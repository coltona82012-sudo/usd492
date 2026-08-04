const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const newsRoute = require('./routes/news');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'static'), {
  extensions: ['html']
}));

// Routes
app.use('/api', newsRoute);

// Articles endpoint
app.get('/article/:id', async (req, res) => {
  try {
    const articlePath = path.join(__dirname, '..', 'static', 'articles', `${req.params.id}.html`);
    const content = await fs.readFile(articlePath);
    res.send(content.toString());
  } catch (err) {
    res.status(404).json({ error: 'Article not found' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'USD492 Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'API documentation available at /api/news',
    endpoints: ['GET /api/news', 'POST /api/addnews', 'GET /api/news/:id', 'GET /article/:id'],
    status: 'active'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Remove or comment this out:
// app.listen(PORT, () => { ... });

// Add this at the very bottom of the file:
module.exports = app;

