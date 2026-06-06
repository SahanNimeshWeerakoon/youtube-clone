# YouTube Clone - Initial Requirements & Architecture

## 📋 Initial Requirements

### Core Features Requested
1. ✅ **Search Videos** - Search functionality using YouTube Data API
2. ✅ **List Videos** - Display search results in a grid format
3. ✅ **Play Videos** - Embedded YouTube player
4. ✅ **Video Quality Selector** - UI for selecting video quality

### Technology Stack
- **Framework:** Next.js 16.2.7
- **UI Library:** React 19.2.4
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript
- **API Client:** Axios
- **Video Player:** React Player
- **Icons:** Lucide React
- **External API:** YouTube Data API v3

## 🏗️ Architecture Overview

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│         Next.js App (Frontend)          │
├─────────────────────────────────────────┤
│                                         │
│  Pages:                                 │
│  ├─ / (Home/Search Page)                │
│  │  ├─ SearchBar Component              │
│  │  └─ VideoGrid Component              │
│  └─ /watch (Video Watch Page)           │
│     ├─ VideoPlayer Component            │
│     └─ Video Details                    │
│                                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      Next.js API Routes (Backend)       │
├─────────────────────────────────────────┤
│                                         │
│  /api/search                            │
│  └─ Proxy YouTube search API            │
│                                         │
│  /api/videos/[id]                       │
│  └─ Get video metadata                  │
│                                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│    YouTube Data API v3                  │
│  (googleapis.com/youtube/v3)            │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Metadata (title, description)        │
│  ✓ Thumbnails                           │
│  ✓ Channel info                         │
│  ✓ View count, likes                    │
│  ✗ Direct streaming URLs (N/A)          │
│  ✗ Quality variants (N/A)               │
│                                         │
└─────────────────────────────────────────┘
```

### Data Flow

1. **Search Flow:**
   ```
   User Input → SearchBar
      ↓
   /api/search?q=query
      ↓
   YouTube Data API
      ↓
   VideoGrid (Display Results)
      ↓
   User clicks video → Navigate to /watch?v=ID
   ```

2. **Video Player Flow:**
   ```
   /watch?v=ID
      ↓
   Fetch metadata from /api/videos/ID
      ↓
   Display VideoPlayer with embedded iframe
      ↓
   YouTube iframe handles playback & quality
   ```

## 📊 Component Hierarchy

```
<RootLayout>
├── <HomePage>
│   ├── <SearchBar />
│   └── <VideoGrid>
│       └── <VideoCard /> (multiple)
│
└── <WatchPage>
    ├── <VideoPlayer />
    └── Video Metadata Display
```

## 🔌 API Response Examples

### Search Response
```json
{
  "items": [
    {
      "id": { "videoId": "dQw4w9WgXcQ" },
      "snippet": {
        "title": "Video Title",
        "thumbnails": { "medium": { "url": "..." } },
        "channelTitle": "Channel Name",
        "publishedAt": "2024-01-01T00:00:00Z"
      }
    }
  ],
  "nextPageToken": "CDIQAA"
}
```

### Video Details Response
```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Video Title",
  "description": "...",
  "thumbnail": { "url": "...", "width": 320, "height": 180 },
  "channel": "Channel Name",
  "duration": "PT3M32S",
  "viewCount": "1000000",
  "likeCount": "50000",
  "publishedAt": "2024-01-01T00:00:00Z"
}
```

## 🎯 Feature Breakdown

### 1. Search Functionality
- **Location:** Home page header
- **Input:** Text query
- **Processing:** Debounced API call to YouTube
- **Output:** Grid of video cards
- **Pagination:** "Load More" button with nextPageToken

### 2. Video Listing
- **Layout:** Responsive grid (1-4 columns)
- **Card Contents:** Thumbnail, title, channel, date
- **Interactions:** Hover effects, play button overlay
- **Navigation:** Click to video player page

### 3. Video Player
- **Type:** YouTube embedded iframe
- **Playback:** Full YouTube player controls
- **Autoplay:** Disabled (respects user preferences)
- **Modestbranding:** Enabled (minimal YouTube branding)

### 4. Quality Selector
- **UI:** 4 buttons (1080p, 720p, 480p, 360p)
- **Default:** 720p selected
- **Behavior:** Updates component state
- **Actual Quality:** Determined by YouTube (UI is for demo)

## 🔑 Key Implementation Details

### Environment Variables
```env
NEXT_PUBLIC_YOUTUBE_API_KEY=<your_api_key>
```

### Next.js Configuration
- Image optimization enabled for YouTube CDN
- Remote pattern: `i.ytimg.com`
- App Router (modern Next.js 13+ syntax)
- Turbopack enabled for fast dev builds

### Styling
- Tailwind CSS utility-first approach
- Responsive breakpoints: sm, md, lg, xl
- Color scheme: YouTube-inspired (red, gray, white)
- Dark mode ready (commented out)

## ⚠️ Important Limitations & Solutions

### Limitation: Direct Video Streaming
**Why:** YouTube API v3 provides metadata only, not streaming URLs

**Current Solution:** YouTube embedded player via iframe
- ✅ Works great for playback
- ✅ Respects YouTube's ToS
- ✅ Quality auto-selected by YouTube
- ❌ No custom quality control

**Alternative Solutions:**
1. **yt-dlp Backend:** Extract streams server-side (complex, ToS concern)
2. **Adaptive Bitrate (HLS):** Requires encoded versions (production scale)
3. **Custom CDN:** Requires content hosting (legal/business complexity)

### Limitation: API Quota
**Quota:** 10,000 units/day
- Search: 100 units each
- Details: 1 unit each

**Solution:** Implement caching
```typescript
// Cache responses for 1 hour
export const revalidate = 3600;
```

### Limitation: Quality Selection
**Why:** YouTube's iframe player controls quality automatically

**Current Solution:** UI buttons for demonstration
- Buttons update local state
- Actual quality handled by YouTube player
- Users can manually select quality in YouTube player itself

## 🔄 Data Flow Diagram

```
START (User types search query)
    │
    ▼
[Search Component]
    │ (handleSearch)
    ▼
searchVideos() utility
    │ (fetch /api/search)
    ▼
[API Route: /api/search]
    │ (axios request)
    ▼
[YouTube Data API]
    │ (JSON response)
    ▼
[API Route returns]
    │ (transform data)
    ▼
[State Update: setVideos]
    │
    ▼
[VideoGrid Renders]
    │
    ├─ VideoCard 1
    ├─ VideoCard 2
    ├─ VideoCard 3
    └─ VideoCard 4 ...
    │ (User clicks video)
    ▼
[Navigate to /watch?v=ID]
    │
    ▼
[Watch Page Loads]
    │ (useEffect: getVideoDetails)
    ▼
[API Route: /api/videos/ID]
    │
    ▼
[YouTube Data API]
    │
    ▼
[State Update: setVideo]
    │
    ▼
[VideoPlayer + Details Render]
    │
    ▼
[User watches video]
    │ (embedded YouTube player)
    ▼
END
```

## 📈 Performance Optimization Tips

1. **Image Optimization:**
   - Using Next.js Image component with remotePatterns
   - Automatic WebP conversion
   - Lazy loading by default

2. **Code Splitting:**
   - Each page is automatically code-split
   - Dynamic imports for heavy components

3. **Caching:**
   - Implement ISR (Incremental Static Revalidation)
   - Cache API responses with revalidate option

4. **API Efficiency:**
   - Only request needed fields
   - Use fields parameter to limit response size

## 🚀 Deployment Considerations

1. **Environment:** Works on Vercel, AWS, GCP, etc.
2. **API Key:** Move to backend for security
3. **Database:** Add for storing favorites, history
4. **Auth:** Add Google Sign-In
5. **Scaling:** Implement caching layer (Redis)

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
