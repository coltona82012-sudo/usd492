const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const START_URL = 'https://usd492.org';
const TARGET_DOMAIN = 'usd492.org';
const OUTPUT_DIR = path.join(__dirname, '..', 'static');

const visitedUrls = new Set();
const urlsToVisit = [START_URL];

function urlToFilename(urlStr) {
    try {
        const parsed = new URL(urlStr);
        let pathname = parsed.pathname;
        if (pathname === '/' || pathname.endsWith('/')) pathname += 'index.html';
        if (!path.extname(pathname)) pathname += '.html';
        return pathname;
    } catch (e) {
        return null;
    }
}

async function runScraper() {
    console.log('Launching browser for daily crawl...');
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    while (urlsToVisit.length > 0) {
        const currentUrl = urlsToVisit.shift();
        if (visitedUrls.has(currentUrl)) continue;
        visitedUrls.add(currentUrl);

        try {
            await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            if (currentUrl.includes('live-feed') || currentUrl.includes('page')) {
                await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            const htmlContent = await page.content();
            const localRelativePath = urlToFilename(currentUrl);
            if (!localRelativePath) continue;

            const fullLocalPath = path.join(OUTPUT_DIR, localRelativePath);
            const dirPath = path.dirname(fullLocalPath);

            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            fs.writeFileSync(fullLocalPath, htmlContent);

            const links = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a'))
                    .map(a => a.href)
                    .filter(href => href.startsWith('http'));
            });

            for (const link of links) {
                const parsedLink = new URL(link);
                if (parsedLink.hostname.includes(TARGET_DOMAIN) && !visitedUrls.has(link) && !urlsToVisit.includes(link)) {
                    if (!link.includes('/users/') && !link.includes('.pdf')) {
                        urlsToVisit.push(link);
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to scrape ${currentUrl}:`, err.message);
        }
    }

    await browser.close();
    console.log('Scraping complete.');
}

runScraper();
