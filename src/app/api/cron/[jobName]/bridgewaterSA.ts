import { prisma } from '@/libs/database';
import { IceTimeTypeEnum } from '@prisma/client';
import puppeteer from 'puppeteer';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    // Log all found .vevent elements
    const eventElements = await page.$$eval('.vevent', (elements) => {
      return elements.map((el) => el.outerHTML);
    });

    // Use Claude to extract events
    const events = await extractEventsWithClaude(JSON.stringify(eventElements));

    console.log(`Extracted ${events.length} events:`);
    console.log(JSON.stringify(events, null, 2));

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

    // Add new events to the icetime table
    for (const event of events) {
      const [type, date, startTime, endTime] = event;
      
      await prisma.iceTime.create({
        data: {
          rinkId: rink.id,
          date: new Date(date),
          startTime,
          endTime,
          type: mapEventTypeToIceTimeType(type),
          originalIceType: type,
          deleted: false,
        },
      });
    }
    console.log(`Added ${events.length} new events to the icetime table`);
    return events;
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
}

// Helper function to map event types to IceTimeTypeEnum
function mapEventTypeToIceTimeType(eventType: string): IceTimeTypeEnum {
  switch (eventType.toLowerCase()) {
    case 'public skate':
      return IceTimeTypeEnum.OPEN_SKATE;
    case 'stick time':
      return IceTimeTypeEnum.STICK_TIME;
    case 'open hockey':
      return IceTimeTypeEnum.OPEN_HOCKEY;
    case 'learn to skate':
      return IceTimeTypeEnum.LEARN_TO_SKATE;
    case 'youth clinic':
      return IceTimeTypeEnum.YOUTH_CLINIC;
    case 'adult clinic':
      return IceTimeTypeEnum.ADULT_CLINIC;
    // Add more mappings as needed
    default:
      return IceTimeTypeEnum.OTHER;
  }
}

export async function extractEventsWithClaude(eventElementsString: string): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];

  const scheduleResponse = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `
        Can you extract the list of events from this HTML? Put them in a 
        JSON format such as [type, YYYY-MM-DD, startTime, endTime] (using HH:MM 24h time). 
        Kindly respond only with JSON, no other text.


        ${eventElementsString}
        `
      }
    ],
  });

  const scheduleText = (scheduleResponse.content[0] as { text: string }).text;
  return JSON.parse(scheduleText);
}