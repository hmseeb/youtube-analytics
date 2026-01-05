# YouTube Channel Analytics Dashboard

## Overview
A multi-channel YouTube analytics dashboard that fetches real-time data from YouTube RSS feeds. Built for BADAAAS AI to provide clients with quick KPI visibility across multiple YouTube channels.

## Tech Stack
- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Backend:** Express.js (RSS proxy to bypass CORS)
- **Deployment:** Vercel-ready (or any Node.js host)

## Project Structure
```
youtube-analytics/
├── CLAUDE.md           # This file - project documentation
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
├── postcss.config.js   # PostCSS configuration
├── vercel.json         # Vercel deployment config
├── index.html          # Entry HTML
├── server.js           # Express backend (RSS proxy)
├── public/             # Static assets
└── src/
    ├── main.jsx        # React entry point
    ├── App.jsx         # Main application component
    ├── index.css       # Global styles + Tailwind
    └── components/
        ├── Dashboard.jsx       # Main dashboard view
        ├── ChannelSelector.jsx # Channel tab management
        ├── StatCard.jsx        # KPI stat cards
        └── VideoList.jsx       # Video performance list
```

## Features

### Current
- **Multi-channel support:** Add/remove YouTube channels by ID or URL
- **Real-time RSS parsing:** Fetches latest ~15 videos per channel
- **KPI metrics:** Total views, likes, engagement rate, avg views, video count
- **Content breakdown:** Shorts vs long-form video analysis
- **Top performers:** Ranked list of best-performing videos
- **Performance chart:** Visual bar chart of recent video views
- **Clickable videos:** Direct links to YouTube

### Data Available from RSS
- Video ID, title, description
- Published date, updated date
- Thumbnail URL
- View count
- Like count (star rating)
- Video link

### Limitations (RSS-only)
- Only last ~15 videos exposed by YouTube
- No subscriber count
- No watch time, CTR, or retention data
- View/like counts may be slightly delayed
- No historical data beyond recent videos

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
```bash
# Start both frontend and backend
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 3. Production Build
```bash
npm run build
npm run start
```

## API Endpoints

### GET /api/feed
Proxies YouTube RSS feed to bypass CORS.

**Query Parameters:**
- `channelId` (required): YouTube channel ID (e.g., `UC6HBmXVAtwRBkZuaV9Jsubw`)

**Example:**
```
GET /api/feed?channelId=UC6HBmXVAtwRBkZuaV9Jsubw
```

**Response:** Raw XML from YouTube RSS feed

## Environment Variables
None required for basic functionality.

For future YouTube Data API integration:
```
YOUTUBE_API_KEY=your_api_key_here
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import to Vercel
3. Deploy (auto-detects Vite + serverless functions)

The `vercel.json` is pre-configured to:
- Serve static frontend
- Route `/api/*` to serverless functions

### Manual Deployment
Any Node.js hosting (Railway, Render, DigitalOcean, etc.):
```bash
npm run build
npm run start
```

## Channel ID
The app only accepts YouTube channel IDs (24 characters starting with `UC`).

**How to find a Channel ID:**
1. Go to the YouTube channel page
2. Click **More** > **Share channel**
3. Click **Copy channel ID**

**Alternative method:**
1. View page source (Ctrl+U / Cmd+U)
2. Search for `"channelId"`
3. Copy the 24-character ID starting with `UC`

Example: `UC6HBmXVAtwRBkZuaV9Jsubw`

## Shorts Detection
Videos are classified as "shorts" if:
- URL contains `/shorts/`
- Title contains hashtags
- Description is < 100 characters

This is heuristic-based and may not be 100% accurate.

## Future Enhancements

### Phase 2: YouTube Data API Integration
- Subscriber count
- Full video history (not just last 15)
- More accurate metrics
- Channel thumbnails/branding

### Phase 3: Advanced Analytics
- Historical trend tracking (store data over time)
- Views velocity (views per hour/day)
- Engagement benchmarking
- Content performance predictions
- Export to CSV/PDF

### Phase 4: Multi-platform
- TikTok analytics
- Instagram Reels
- LinkedIn video
- Unified dashboard

## Code Patterns

### Adding a New Stat Card
```jsx
<StatCard 
  label="New Metric" 
  value={calculatedValue} 
  color="#hex" 
  icon="🎯" 
  delay={0.5} 
/>
```

### Adding a New Channel Programmatically
```javascript
addChannel('UC6HBmXVAtwRBkZuaV9Jsubw');
// or
addChannel('https://www.youtube.com/channel/UC6HBmXVAtwRBkZuaV9Jsubw');
```

## Troubleshooting

### "Failed to load channel"
- Verify channel ID is correct (starts with `UC`)
- Check if channel has public videos
- Backend server may not be running

### CORS Errors
- Ensure backend proxy is running on port 3001
- Check `vite.config.js` proxy configuration

### No Videos Showing
- Channel may have no recent uploads
- RSS feed may be temporarily unavailable

## Credits
Built by Claude (Anthropic) for BADAAAS AI
Design inspired by modern analytics dashboards

## License
MIT - Do whatever you want with it
