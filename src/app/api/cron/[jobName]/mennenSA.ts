import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function mennenSportsArena(inputText: string) {
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


      Here is a snippet of that:
      <BeginSnippet>
      ${inputText}
      </EndSnippet>

      1. Use the startDate of today, which is ${today}
      2. The endDate of the series of events
      3. An attribute called "schedules" with the dayOfWeek followed by its startTime and endTime

      The schema of this JSON object is as follows:
      {
  "startDate": "2023-09-03",
  "endDate": "2023-12-22",
  "schedules": [
    {
      "dayOfWeek": "Monday",
      "startTime": "16:00",
      "endTime": "17:30"
    }
      ...
      ]  
      Please ONLY output valid JSON, no explanations, no comments, and no other text.
        `
      }
    ],
  });
  const jsonResponse = JSON.parse(initialResponse.content[0].text);


  const events = generateEvents(jsonResponse);
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

  function generateEvents(scheduleData: ScheduleData) {
    const events = [];
    const startDate = new Date(scheduleData.startDate);
    const endDate = new Date(scheduleData.endDate);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

    return events;
  }
}
