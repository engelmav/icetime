import * as cheerio from 'cheerio';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Update the CalendarEvent type
export type CalendarEvent = {
  date: string;
  title: string;
  timeRange: string;
};

export async function getWebTracCalendarEvents(html: string): Promise<CalendarEvent[]> {
  const allEvents: CalendarEvent[] = [];

  // Regular expression to match calendar day elements
  const calendarDayRegex = /<div class="calendar__day[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  let match;
  let calendarDays = [];

  console.log('HTML:', html);

  while ((match = calendarDayRegex.exec(html)) !== null) {
    calendarDays.push(match[0]);
  }
  // console.log(`Found ${calendarDays}`);
  return;
  console.log(`Found ${calendarDays.length} calendar days`);

  // Divide calendar days into buckets of 7
  const buckets = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    buckets.push(calendarDays.slice(i, i + 7));
  }

  // Process buckets synchronously
  for (const bucket of buckets) {
    const bucketResults = await processCalendarDaysWithClaude(bucket);
    allEvents.push(...bucketResults);
  }

  return allEvents;
}

// Sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let lastRequestTime = 0;
const minRequestInterval = 1500; // 1.5 seconds, which allows for 40 requests per minute

async function processCalendarDaysWithClaude(calendarDays: string[]): Promise<CalendarEvent[]> {
  // Implement rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < minRequestInterval) {
    await sleep(minRequestInterval - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();

  const scheduleResponse = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 1000,
    system: "You are an expert HTML parser.",
    messages: [{
      role: "user",
      content: `
        Kindly extract the events from these calendar day elements. 
        Create a JSON object that acts as a table, with [{activity_name: activity_id}]. Example: [{"Snowplow 3": "1"}]. The activity_id should start at 1 and increment by one. Create a second JSON object that refers to the first one by activity_id, and lists out the event information.
        Format your output like so:

        {
          "activities": [
            {
              "Snowplow 1": 1
            },
            {
              "Snowplow 2": 2
            },
        ...
          ],
          "events": [
            [
              date (YYYY-MM-DD),
              [
                1,
                startDate,
                endDate
              ],
              ...
            ]
          }

          Use 24h time. Don't use any carriage returns/newlines.
          You may only see a date, and no event information. In that case, skip creation of the array.
          ${JSON.stringify(calendarDays)}
          `
    }],
  });

  const scheduleText = (scheduleResponse.content[0] as { text: string }).text;
  
  console.log('Attempting to parse JSON:', scheduleText);
  console.log('Original HTML:', JSON.stringify(calendarDays));
  
  try {
    const parsedData = JSON.parse(scheduleText);
    const activities = new Map(parsedData.activities.map(activity => {
      const [name, id] = Object.entries(activity)[0];
      return [id, name];
    }));

    const rawEvents: CalendarEvent[] = parsedData.events.flatMap(([date, ...eventData]) => 
      eventData.map(([activityId, startTime, endTime]) => ({
        date,
        title: activities.get(activityId) || 'Unknown Activity',
        startTime,
        endTime
      }))
    );

    return rawEvents;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    console.error('Original HTML that caused the error:', JSON.stringify(calendarDays));
    return [];
  }
}

export async function fetchWebTracCalendarHtml(date: Date): Promise<CalendarEvent[]> {
  const url = `https://webtrac.bloomingtonmn.gov/wbwsc/webtrac.wsc/search.html?display=Calendar&module=Event&_csrf_token=Wj14720U091A2I4B3A292Z3H5D4I5V6B725U4K6M4Z04024T5D470C614K6F5M1C6R506J511A5U4O5A5264023T524T1V5J4J5M501D6X4R5F561F4O4T5L4Z6Z665S6G`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const calendarEvents: CalendarEvent[] = [];

    const regex = /^(.*?)(?=\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?))/i;

    $('.calendar__day').each((_, dayElement) => {
      const dateElement = $(dayElement).find('.calendar__day-label-long');
      const date = dateElement.text().trim();

      $(dayElement).find('.calendar__day-inner .calendar__block').each((_, eventElement) => {
        const eventText = $(eventElement).text().trim();
        const match = eventText.match(regex);
        
        if (match) {
          const title = match[1].trim();
          const timeRange = eventText.slice(match[0].length).trim();
          
          calendarEvents.push({
            date,
            title,
            timeRange
          });
        } else {
          // If the regex doesn't match, use the whole text as the title
          calendarEvents.push({
            date,
            title: eventText,
            timeRange: ''
          });
        }
      });
    });
    console.log('Calendar events:', calendarEvents);
    return calendarEvents;
  } catch (error) {
    console.error('Error fetching WebTrac calendar HTML:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}
