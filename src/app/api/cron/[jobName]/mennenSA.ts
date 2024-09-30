import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function processTextWithLLM(inputText: string) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that converts text schedules into structured JSON data."
      },
      {
        role: "user",
        content: `Convert the following text into a JSON array of public skating events:

${inputText}

Each event should have a date, startTime, and endTime. Use the date range provided to generate specific dates for each day of the week. Exclude the event on Sept. 14. Output in JSON format.`
      }
    ],
  });

  if (!response.data.choices[0].message) {
    throw new Error('No response from OpenAI');
  }

  return response.data.choices[0].message.content;
}

export async function mennenSportsArena() {
  const inputText = `
Weekly Schedule: September 3rd – December 22nd

Monday – 4:00 -5:30 PM
Tuesday – 10:30 -12:00 PM
Wednesday – 4:00 -5:30 PM
Thursday – 10:30 -12:00 PM
Friday – 4:00 -5:30 PM
Saturday – 11:30 AM -1:00 PM*
Sunday – 11:30 AM -1:00 PM
*No Public Session on Sept. 14
  `;

  try {
    const processedText = await processTextWithLLM(inputText);
    console.log(processedText);

    // Parse the JSON string into an object
    const events = JSON.parse(processedText);

    // Here you would typically save these events to your database
    // For example:
    // await saveEventsToDatabase(events);

    return { success: true, message: 'Events processed successfully', events };
  } catch (error) {
    console.error('Error processing events:', error);
    return { success: false, message: 'Error processing events', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
