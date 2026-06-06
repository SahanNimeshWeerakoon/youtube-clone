# CloneTube - YouTube Clone with Next.js

A fully functional YouTube clone built with Next.js 16, React 19, TypeScript, and Tailwind CSS. Search, browse, and watch videos using the YouTube Data API v3.

## ✨ Features

- 🔍 **Video Search** - Search millions of videos using YouTube Data API
- 📺 **Video Listing** - Browse search results in a responsive grid layout
- ▶️ **Video Player** - Embedded YouTube player with full playback controls
- 🎬 **Quality Selector** - UI for selecting video quality (1080p, 720p, 480p, 360p)
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Fast Performance** - Built with Next.js App Router and Turbopack
- 🎨 **Modern UI** - Styled with Tailwind CSS inspired by YouTube

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- YouTube Data API v3 key

### Installation

```bash
# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_YOUTUBE_API_KEY=YOUR_API_KEY_HERE" > .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000` and start searching for videos!

## 📁 Project Structure

```
app/
├── api/
│   ├── search/
│   │   └── route.ts          # YouTube search API endpoint
│   └── videos/
│       └── [id]/
│           └── route.ts      # Get video details endpoint
├── components/
│   ├── SearchBar.tsx         # Search input component
│   ├── VideoCard.tsx         # Individual video card
│   ├── VideoGrid.tsx         # Video grid container
│   └── VideoPlayer.tsx       # Video player with quality selector
├── lib/
│   └── youtube.ts            # YouTube API utilities
├── watch/
│   └── page.tsx              # Video watch page
├── layout.tsx                # Root layout
├── page.tsx                  # Home/search page
└── globals.css               # Global styles
```

## 🔑 Key Components

### SearchBar.tsx
- Search input field with icon
- Submit handler for search queries
- Loading state management

### VideoCard.tsx
- Displays video thumbnail, title, channel, and date
- Hover effects with play button overlay
- Links to video watch page

### VideoGrid.tsx
- Responsive grid layout (1-4 columns)
- Load more pagination
- Loading spinner

### VideoPlayer.tsx
- YouTube embedded iframe
- Quality selector buttons (1080p, 720p, 480p, 360p)
- Fullscreen support
- Volume control UI

## 🔌 API Routes

### GET /api/search
Search for videos on YouTube.

**Query Parameters:**
- `q` (required) - Search query
- `maxResults` (optional, default: 20) - Number of results
- `pageToken` (optional) - For pagination

**Response:**
```json
{
  "items": [...],
  "nextPageToken": "string",
  "prevPageToken": "string"
}
```

### GET /api/videos/[id]
Get detailed information about a video.

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "thumbnail": { "url": "string", "width": 320, "height": 180 },
  "channel": "string",
  "duration": "PT1H2M3S",
  "viewCount": "string",
  "likeCount": "string",
  "publishedAt": "2024-01-01T00:00:00Z"
}
```

## 🛠️ Setup YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **YouTube Data API v3**
4. Create an API key (Application type: Public)
5. Add your key to `.env.local`:
   ```
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_key_here
   ```

## 📝 Important Notes

### About Video Streaming
- This app uses **YouTube's official embedded player** via iframe
- The embedded player respects YouTube's terms of service
- Quality selection UI is provided, but actual quality depends on YouTube's availability for each video
- You cannot download videos or access raw video streams

### API Limitations
- YouTube Data API has a **quota of 10,000 units per day**
- Search operations cost 100 units each
- Video details cost 1 unit each
- Consider implementing caching for production

### About the Quality Selector
- The quality selector buttons are UI elements for demonstration
- Actual video quality is determined by YouTube's player
- The selected quality is stored in component state but doesn't override YouTube's player behavior
- For full quality control, you would need a custom video streaming solution

## 🎯 Future Enhancements

- [ ] User authentication with Google
- [ ] Save favorite videos
- [ ] Watch history tracking
- [ ] Video recommendations
- [ ] Playlist support
- [ ] Comments section
- [ ] Channel browsing
- [ ] Advanced filtering and sorting
- [ ] Dark mode
- [ ] Infinite scroll instead of "Load More"

## 🚨 Troubleshooting

### Images not loading
- Make sure `next.config.ts` has `i.ytimg.com` in `remotePatterns`
- Clear browser cache and rebuild

### API errors
- Verify your API key is correct in `.env.local`
- Check if API quota is exceeded
- Ensure YouTube Data API v3 is enabled in Google Cloud Console

### Development server not starting
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install

# Start dev server again
npm run dev
```

## 📦 Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Security Notes

- The API key in this example is public-facing (OK for development only)
- For production, move API calls to backend to keep keys secret
- Use API key restrictions in Google Cloud Console
- Consider rate limiting on your API routes

## 📄 License

This project is provided as-is for educational purposes.

## 👤 Author

Built with Next.js, React, TypeScript, and Tailwind CSS

---

**Happy video searching! 🎬**
