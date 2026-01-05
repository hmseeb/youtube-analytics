import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for development
app.use(cors());

// Serve static files in production
app.use(express.static(join(__dirname, 'dist')));

// RSS Feed Proxy Endpoint
app.get('/api/feed', async (req, res) => {
  const { channelId } = req.query;
  
  if (!channelId) {
    return res.status(400).json({ error: 'channelId is required' });
  }
  
  // Validate channel ID format
  if (!channelId.startsWith('UC') || channelId.length !== 24) {
    return res.status(400).json({ error: 'Invalid channel ID format. Must start with UC and be 24 characters.' });
  }
  
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  
  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YouTubeAnalytics/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`YouTube returned ${response.status}`);
    }
    
    const xml = await response.text();
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.send(xml);
    
  } catch (error) {
    console.error('RSS fetch error:', error.message);
    res.status(500).json({ error: `Failed to fetch RSS feed: ${error.message}` });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all for SPA routing in production
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 RSS Proxy: http://localhost:${PORT}/api/feed?channelId=UC...`);
});
