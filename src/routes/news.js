const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

// Get all news (example reading from a local JSON file if you store them that way)
router.get("/news", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "..", "static", "news.json"); // Adjust path to wherever your news data is stored
    const data = await fs.readFile(filePath, "utf8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

router.get("/news/:id", async (req, res) => {
  try {
    const articleId = req.params.id;
    // Go up 3 levels from backend/src/routes to reach usd492/, then into static/articles/
    const articlePath = path.join(
      __dirname,
      "../../../static/articles",
      `${articleId}.json`,
    );
    const content = await fs.readFile(articlePath, "utf8");
    res.json(JSON.parse(content));
  } catch (err) {
    res.status(404).json({ error: "News article not found" });
  }
});

module.exports = router;
