const puppeteer = require('puppeteer');
import cheerio from 'cheerio';

interface Event {
    eventType: string;
    eventDate: string;
    startTime: string;
    endTime: string;
}

async function scrapeArenaCalendar(arenaUrl: string) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    try {
        await page.goto(arenaUrl, { waitUntil: 'networkidle2' });

        // Wait for the content to load
        await page.waitForSelector('#content_dropintype_Skating', { timeout: 15000 });

        // Get the HTML content
        const content = await page.$eval('#content_dropintype_Skating', (el: Element) => el.outerHTML);

        // Parse the HTML content
        const $ = cheerio.load(content);
        const events: Event[] = [];

        // Iterate through all tables with id starting with 'dropin_Skating_'
        $('tr[id^="dropin_Skating_"]').each((_, element) => {
            const $table = $(element).find('table');
            const dates = $table.find('thead th').slice(1).map((_, th) => $(th).text().trim()).get();
            const times = $table.find('tbody td').map((_, td) => $(td).text().trim()).get();

            dates.forEach((date, index) => {
                const time = times[index];
                if (time && time !== '\u00A0') { // \u00A0 is &nbsp;
                    const [startTime, endTime] = time.split(' - ').map(t => t.trim());
                    events.push({
                        eventType: 'Leisure Skate',
                        eventDate: date,
                        startTime,
                        endTime
                    });
                }
            });
        });

        console.log(JSON.stringify(events, null, 2));

    } catch (error) {
        console.error(`Error scraping ${arenaUrl}:`, error);
    } finally {
        await browser.close();
    }
}

const urls = [
    'https://www.toronto.ca/data/parks/prd/facilities/complex/803/index.html', 
    'https://www.toronto.ca/data/parks/prd/facilities/complex/802/index.html'  
];

// Run scraping concurrently for all URLs
Promise.all(urls.map(url => scrapeArenaCalendar(url)))
    .then(() => console.log('Scraping completed for all URLs.'))
    .catch(err => console.error('Error during scraping:', err));
