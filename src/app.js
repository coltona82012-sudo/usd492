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
// File explorer endpoint for /documents
app.get('/documents', async (req, res) => {
  try {
    // Get the relative path query parameter if someone clicks into a subfolder (e.g., /documents?path=USD 492 District Offices)
    const subpath = req.query.path || '';
    const targetDir = path.join(__dirname, '..', 'static', 'files', 'Documents', subpath);

    // Ensure the path stays safe and doesn't escape out of Documents (prevent directory traversal)
    const safePath = path.resolve(targetDir);
    const basePath = path.resolve(path.join(__dirname, '..', 'static', 'files', 'Documents'));

    if (!safePath.startsWith(basePath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Read the directory contents with file types
    const entries = await fs.readdir(safePath, { withFileTypes: true });

    const contents = entries.map(entry => {
      return {
        name: entry.name,
        isDirectory: entry.isDirectory(),
                                 // Provide a relative web path or URL if they want to fetch/download it
                                 url: `/files/Documents/${subpath ? subpath + '/' : ''}${entry.name}`
      };
    });

    res.json({
      currentPath: subpath || '/',
      items: contents
    });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'Directory not found or unable to read' });
  }
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
