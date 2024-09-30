import { prisma } from '@/libs/database';
import { IceTimeTypeEnum } from '@prisma/client';
import puppeteer from 'puppeteer';

const BROWSER_TIMEOUT = 1000 * 60 * 60; // 1 hour in milliseconds

export async function bridgewaterIceArena() {
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

    // Soft delete existing records for this rink
    const rink = await prisma.rink.findUnique({
      where: { name: "Bridgewater Ice Arena" },
    });

    if (!rink) {
      throw new Error("Rink not found");
    }

    await prisma.iceTime.updateMany({
      where: {
        rinkId: rink.id,
        deleted: false,
      },
      data: {
        deleted: true,
      },
    });
    console.log("Existing records soft-deleted");

    // Map the events to IceTime format and persist to database
    const iceTimeEvents = events.map(event => ({
      type: mapEventTypeToEnum(event.title),
      originalIceType: event.title,
      date: new Date(event.date),
      startTime: event.startTime,
      endTime: event.endTime,
      rinkId: rink.id,
      deleted: false,
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
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('public skate')) {
    return IceTimeTypeEnum.OPEN_SKATE;
  } else if (lowerTitle.includes('stick time')) {
    return IceTimeTypeEnum.STICK_TIME;
  } else if (lowerTitle.includes('learn to skate')) {
    return IceTimeTypeEnum.LEARN_TO_SKATE;
  } else if (lowerTitle.includes('youth clinic')) {
    return IceTimeTypeEnum.YOUTH_CLINIC;
  } else if (lowerTitle.includes('adult clinic')) {
    return IceTimeTypeEnum.ADULT_CLINIC;
  } else if (lowerTitle.includes('open hockey')) {
    return IceTimeTypeEnum.OPEN_HOCKEY;
  }
  // Add more mappings as needed
  return IceTimeTypeEnum.OTHER;
}