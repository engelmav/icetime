import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer';
import { IceTimeTypeEnum } from '@prisma/client';
import { prisma } from '@/libs/database';


const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function mennenSportsArena() {
  // Use Puppeteer to pull the schedule data from https://www.morrisparks.net/mennen-landing/public-skating/
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.morrisparks.net/mennen-landing/public-skating/');
  const mainContent = await page.$eval('.main_content', (element) => element.outerHTML);
  await browser.close();

  console.log(mainContent);

  // Ask Claude about the schedule in the mainContent
  const scheduleResponse = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `
        Here is a chunk of HTML content. It contains a schedule with two date ranges.
        Each date range is in the following format:
        1. The date range when they are held, (e.g.,  September 3rd – December 22nd)
        2. A list of days with the time range on each day of the week for that event type.
        Note: there are TWO date ranges. Just concatenate them.
        Please ONLY respond with the schedule, no other text, in JSON with the following schema:
        [
          {
            "startDate": "2023-09-03",
            "endDate": "2023-12-22",
            "schedules": [
              {
                "dayOfWeek": "Monday",
                "startTime": "16:00",
                "endTime": "17:30"
              }
            ]
          }
        ]
        HTML Content:
        ${mainContent}
        `
      }
    ],
  });
  
  // Print Claude's response
  const scheduleText = (scheduleResponse.content[0] as { text: string }).text;
  console.log("Claude's response about the schedule:");
  console.log(scheduleText);
  const today = new Date().toISOString().split('T')[0];
  const initialResponse = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `
        There is a webpage that lists out the dates of certain Ice Rink events in the following way:
        1. the event type (e.g., Public Skate)
        2. The date range when they are held, (e.g.,  September 3rd – December 22nd)
        3. A list of days with the time range on each day of the week for that event type.
        4. Note: there are TWO date ranges. Create a json object FOR EACH date range.

      Here is a snippet of that:
      <BeginSnippet>
      ${scheduleText}
      </EndSnippet>

      1. Use the startDate of today, which is ${today}
      2. The endDate of the series of events
      3. An attribute called "schedules" with the dayOfWeek followed by its startTime and endTime

      The schema of this JSON object is as follows:
     [ {
  "startDate": "2023-09-03",
  "endDate": "2023-12-22",
  "schedules": [
    {
      "dayOfWeek": "Monday",
      "startTime": "16:00",
      "endTime": "17:30"
    }]
      ...
      ]  
      Please ONLY output valid JSON, no explanations, no comments, and no other text.
        `
      }
    ],
  });
  const jsonResponse = JSON.parse((initialResponse.content[0] as { text: string }).text);
  console.log("Claude's schedule data:", jsonResponse);

  const events = generateEvents(jsonResponse);

  // Add the following code to create IceTime records

  // Fetch the Mennen Sports Arena rink
  const rink = await prisma.rink.findUnique({
    where: { name: "Mennen Sports Arena" },
  });

  if (!rink) {
    throw new Error("Rink not found");
  }

  // Soft delete existing records for this rink
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

  // Create new IceTime records
  for (const event of events) {
    await prisma.iceTime.create({
      data: {
        type: IceTimeTypeEnum.LEARN_TO_SKATE, // Assuming all events are open skate, adjust if needed
        originalIceType: "Public Skate",
        date: new Date(event.date),
        startTime: event.startTime,
        endTime: event.endTime,
        rinkId: rink.id,
        deleted: false,
      },
    });
  }

  console.log(`Persisted ${events.length} events to database`);

  return events;

  interface ScheduleData {
    startDate: string;
    endDate: string;
    schedules: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
    exceptions?: Array<{
      date: string;
    }>;
  }

  function generateEvents(scheduleDataList: ScheduleData[]) {
    const events = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const scheduleData of scheduleDataList) {
      const startDate = new Date(scheduleData.startDate);
      const endDate = new Date(scheduleData.endDate);

      for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        const dayOfWeek = dayNames[currentDate.getDay()];
        const schedule = scheduleData.schedules.find(s => s.dayOfWeek === dayOfWeek);

        if (schedule) {
          const dateString = currentDate.toISOString().split('T')[0];
          const isException = scheduleData.exceptions && scheduleData.exceptions.some(e => e.date === dateString);

          if (!isException) {
            events.push({
              date: dateString,
              dayOfWeek: dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime
            });
          }
        }
      }
    }

    return events;
  }
}
