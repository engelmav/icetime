import fetch from 'node-fetch';

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/TheBloke/Llama-2-7B-GPTQ'; 
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

async function processTextWithLLM(inputText) {
  const response = await fetch(HUGGINGFACE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: `Convert the following text into a JSON array of public skating events:

${inputText}

Each event should have a date, startTime, and endTime. Use the date range provided to generate specific dates for each day of the week. Exclude the event on Sept. 14. Output in JSON format.`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  const result = await response.json();
  return result[0].generated_text;
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
    return { success: false, message: 'Error processing events', error: error.message };
  }
}
