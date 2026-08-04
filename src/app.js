const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
const syncFs = require("fs"); // Synchronous fallback for scraper file writes
const puppeteer = require("puppeteer");
const cron = require("node-cron");
const newsRoute = require("./routes/news");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  express.static(path.join(__dirname, "..", "static"), {
    extensions: ["html"],
  }),
);

// Routes
app.use("/api", newsRoute);

// Articles endpoint
app.get("/article/:id", async (req, res) => {
  try {
    const articlePath = path.join(
      __dirname,
      "..",
      "static",
      "articles",
      `${req.params.id}.html`,
    );
    const content = await fs.readFile(articlePath);
    res.send(content.toString());
  } catch (err) {
    res.status(404).json({ error: "Article not found" });
  }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "USD492 Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// API documentation endpoint
app.get("/api/docs", (req, res) => {
  res.json({
    message: "API documentation available at /api/news",
    endpoints: [
      "GET /api/news",
      "POST /api/addnews",
      "GET /api/news/:id",
      "GET /article/:id",
    ],
    status: "active",
  });
});

// --- PUPPETEER SCRAPER & DAILY CRON SETUP ---

const START_URL = "https://usd492.org";
const TARGET_DOMAIN = "usd492.org";
const OUTPUT_DIR = path.join(__dirname, "..", "static");

function urlToFilename(urlStr) {
  try {
    const parsed = new URL(urlStr);
    let pathname = parsed.pathname;

    if (pathname === "/" || pathname.endsWith("/")) {
      pathname += "index.html";
    }
    if (!path.extname(pathname)) {
      pathname += ".html";
    }
    return pathname;
  } catch (e) {
    return null;
  }
}

async function runScraper() {
  console.log("\n[Scraper] Starting scheduled daily USD 492 crawl...");
  const visitedUrls = new Set();
  const urlsToVisit = [START_URL];

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    while (urlsToVisit.length > 0) {
      const currentUrl = urlsToVisit.shift();

      if (visitedUrls.has(currentUrl)) continue;
      visitedUrls.add(currentUrl);

      try {
        await page.goto(currentUrl, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        if (currentUrl.includes("live-feed") || currentUrl.includes("page")) {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        const htmlContent = await page.content();
        const localRelativePath = urlToFilename(currentUrl);
        if (!localRelativePath) continue;

        const fullLocalPath = path.join(OUTPUT_DIR, localRelativePath);
        const dirPath = path.dirname(fullLocalPath);

        if (!syncFs.existsSync(dirPath)) {
          syncFs.mkdirSync(dirPath, { recursive: true });
        }

        syncFs.writeFileSync(fullLocalPath, htmlContent);

        const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("a"))
            .map((a) => a.href)
            .filter((href) => href.startsWith("http"));
        });

        for (const link of links) {
          const parsedLink = new URL(link);
          if (
            parsedLink.hostname.includes(TARGET_DOMAIN) &&
            !visitedUrls.has(link) &&
            !urlsToVisit.includes(link)
          ) {
            if (!link.includes("/users/") && !link.includes(".pdf")) {
              urlsToVisit.push(link);
            }
          }
        }
      } catch (err) {
        console.error(`[Scraper] Failed to scrape ${currentUrl}:`, err.message);
      }
    }

    await browser.close();
    console.log(
      "[Scraper] Daily crawl finished and static files updated successfully.",
    );
  } catch (err) {
    console.error("[Scraper] Browser initialization error:", err.message);
  }
}

// Schedule the scraper to run once every day at midnight ('0 0 * * *')
cron.schedule("0 0 * * *", () => {
  runScraper();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

module.exports = app;
