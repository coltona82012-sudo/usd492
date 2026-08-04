const express = require("express");
const router = express.Router();
const { News, Event } = require("../models/Schema");

// Get all news
router.get("/news", async (req, res) => {
  try {
    const news = await News.find().sort({ date: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// Add news (admin/comment moderation)
router.post("/addnews", async (req, res) => {
  try {
    const blog = new News(req.body);
    await blog.save();
    res.status(201).json({ message: "News added" });
  } catch (err) {
    res.status(400).json({ error: "Invalid input" });
  }
});
// Get a single news article by ID
router.get("/news/:id", async (req, res) => {
  try {
    // Change 'id' to whatever your custom field name is in your schema
    // (e.g., externalId: req.params.id or id: req.params.id)
    const singleNews = await News.findOne({ id: req.params.id });

    if (!singleNews) {
      return res.status(404).json({ error: "News article not found" });
    }
    res.json(singleNews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news article" });
  }
});
// Get sample news content for restoration
router.get("/sample", async (req, res) => {
  try {
    const sample = await News.find().limit(1);
    res.json(sample);
  } catch (err) {
    res.status(500).json({ error: "No sample found" });
  }
});

// Get event status
router.get("/events/status/:eventId", async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    res.json(event?.status);
  } catch (err) {
    res.status(404).json({ error: "Event not found" });
  }
});

// Update event status
router.patch("/events/update/:eventId", async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(
      req.params.eventId,
      { $set: { status: req.body.status } },
      { new: true },
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Update failed" });
  }
});

module.exports = router;
