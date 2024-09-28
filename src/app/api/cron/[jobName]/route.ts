import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/libs/database';
import { IceTimeTypeEnum } from '@prisma/client';
import puppeteer from 'puppeteer';

const BROWSER_TIMEOUT = 1000 * 60 * 60; // 1 hour in milliseconds

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const jobName = url.pathname.split('/').pop()
  try {
    switch (jobName) {
      case 'union-sports-arena-nj':
        const result = await nj_unionSportsArena()
        return NextResponse.json(result)
      case 'bridgewater-ice-arena':
        const bridgewaterResult = await bridgewaterIceArena()
        return NextResponse.json(bridgewaterResult)
      default:
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error executing cron job:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

async function nj_unionSportsArena() {
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const url = `https://api.bondsports.co/v4/facilities/116/programs-schedule?startDate=${startDate}&endDate=${endDate}&caller=icetime`;
  console.log("Fetching data from:", url);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log("Data fetched successfully");

  // Map programName to IceTimeTypeEnum
  const programTypeMap: { [key: string]: IceTimeTypeEnum } = {
    "Learn To Skate": IceTimeTypeEnum.LEARN_TO_SKATE,
    "Public Skate": IceTimeTypeEnum.OPEN_SKATE,
    "Adult Open Hockey": IceTimeTypeEnum.OPEN_HOCKEY,
    "Freestyle": IceTimeTypeEnum.STICK_TIME,
    "Youth Clinic": IceTimeTypeEnum.YOUTH_CLINIC,
    "Adult Clinic": IceTimeTypeEnum.ADULT_CLINIC,
    // Add more mappings as needed
  };

  // Process and save the data
  for (const event of data.data) {
    const iceTimeType = programTypeMap[event.programName] || IceTimeTypeEnum.OPEN_SKATE; // Default to OPEN_SKATE if not found

    await prisma.iceTime.create({
      data: {
        type: iceTimeType,
        date: new Date(event.eventStartDate),
        startTime: event.eventStartTime,
        endTime: event.eventEndTime,
        rink: "Union Sports Arena",
        location: "Union Sports Arena, NJ",
      },
    });
  }

  console.log(`Processed and saved ${data.data.length} events`);
  return { message: `Processed and saved ${data.data.length} events` };
}

async function bridgewaterIceArena() {
  const initialUrl = 'https://www.bridgewatericearena.com/events-page';
  console.log("Navigating to:", initialUrl);

  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  try {
    // Step 1: Navigate to the initial page
    await page.goto(initialUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    console.log("Initial page loaded");

    // Step 2: Click the "View All" button
    await page.waitForSelector('a.goToLink.icon[title="View All"]', { timeout: 10000 });
    await page.click('a.goToLink.icon[title="View All"]');
    console.log("Clicked 'View All' button");

    // Step 3: Wait for and click the "Month List View" link
    await page.waitForSelector('a.siteMapLink.icon[href="/event/show_month_list/6359108"]', { timeout: 10000 });
    await page.click('a.siteMapLink.icon[href="/event/show_month_list/6359108"]');
    console.log("Clicked 'Month List View' link");

    // Step 4: Wait for the events page to load
    await page.waitForSelector('.vevent', { timeout: 30000 });
    console.log("Events page loaded");

    const events = await page.evaluate(() => {
      const eventElements = document.querySelectorAll('.vevent');
      return Array.from(eventElements).map((element, index) => {
        const title = element.querySelector('.summary a')?.textContent?.trim() || '';
        const dateElement = index % 2 === 0 ? element : element.previousElementSibling;
        const month = dateElement.querySelector('.month')?.textContent?.trim() || '';
        const day = dateElement.querySelector('.date')?.textContent?.trim() || '';
        const year = new Date().getFullYear();
        
        const startTime = element.querySelector('.dtstart[title]')?.getAttribute('title') || '';
        const endTime = element.querySelector('.dtend[title]')?.getAttribute('title') || '';
        
        const tags = Array.from(element.querySelectorAll('.tags a'))
          .map(tag => tag.textContent?.trim())
          .filter(Boolean)
          .join(', ');

        return {
          title,
          date: `${year}-${month}-${day.padStart(2, '0')}`,
          startTime: startTime ? new Date(startTime).toTimeString().split(' ')[0] : '',
          endTime: endTime ? new Date(endTime).toTimeString().split(' ')[0] : '',
          tags
        };
      });
    });

    console.log(`Found ${events.length} events`);

    // Map the events to IceTime format and persist to database
    const iceTimeEvents = events.map(event => ({
      type: mapEventTypeToEnum(event.title),
      date: new Date(event.date),
      startTime: event.startTime,
      endTime: event.endTime,
      rink: "Bridgewater Ice Arena",
      location: "Bridgewater Ice Arena, NJ",
    }));

    // Persist events to database
    for (const iceTimeEvent of iceTimeEvents) {
      await prisma.iceTime.create({
        data: iceTimeEvent,
      });
    }

    console.log(`Persisted ${iceTimeEvents.length} events to database`);

    // Set a timeout to close the browser after BROWSER_TIMEOUT
    setTimeout(() => {
      browser.close();
      console.log("Browser closed due to timeout");
    }, BROWSER_TIMEOUT);

    return events;

  } catch (error) {
    console.error('Error fetching events:', error);
    await browser.close();
    return [];
  }
}

// Helper function to map event titles to IceTimeTypeEnum
function mapEventTypeToEnum(title: string): IceTimeTypeEnum {
  if (title.toLowerCase().includes('public skate')) {
    return IceTimeTypeEnum.OPEN_SKATE;
  } else if (title.toLowerCase().includes('stick time')) {
    return IceTimeTypeEnum.STICK_TIME;
  }
  // Add more mappings as needed
  return IceTimeTypeEnum.OPEN_SKATE; // Default case
}
