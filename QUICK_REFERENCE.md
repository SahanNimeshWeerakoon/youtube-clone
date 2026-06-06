# Quick Reference Guide

## 🚀 Getting Started (2 minutes)

```bash
# Already done ✓
npm install                    # Dependencies installed
echo "API_KEY" > .env.local   # Environment set

# Start the app
npm run dev

# Open browser
http://localhost:3000
```

## 📝 Project Files at a Glance

| File | Purpose |
|------|---------|
| `app/page.tsx` | Home page with search |
| `app/watch/page.tsx` | Video player page |
| `app/components/SearchBar.tsx` | Search input |
| `app/components/VideoCard.tsx` | Video thumbnail card |
| `app/components/VideoGrid.tsx` | Grid of videos |
| `app/components/VideoPlayer.tsx` | Player + quality selector |
| `app/api/search/route.ts` | Search API endpoint |
| `app/api/videos/[id]/route.ts` | Video details endpoint |
| `app/lib/youtube.ts` | API utilities |

## 🎯 Core Features

### 1. Search Videos
```
Input: Search query (e.g., "next.js")
Output: Grid of video results
Action: Click video to watch
```

### 2. Video Listing
```
Display: Thumbnail + title + channel + date
Grid: Responsive (1-4 columns)
Hover: Shows play button overlay
```

### 3. Play Video
```
Player: YouTube embedded iframe
Controls: Full YouTube controls
Quality: Display options (UI only)
```

### 4. Quality Selector
```
Options: 1080p, 720p, 480p, 360p
Default: 720p
Actual: YouTube determines availability
```

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm start                # Start production server

# Linting
npm run lint             # Check code quality
```

## 📱 Screen Sizes

| Device | Grid Columns |
|--------|-------------|
| Desktop (1024px+) | 4 columns |
| Tablet (640px+) | 2 columns |
| Mobile (<640px) | 1 column |

## 🔑 Environment Variables

```env
NEXT_PUBLIC_YOUTUBE_API_KEY=your_key_here
```

**Located in:** `.env.local`

## 📊 API Endpoints

```
GET /api/search?q=query&maxResults=20&pageToken=token
GET /api/videos/[videoId]
```

## ✨ Component Props

### SearchBar
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}
```

### VideoGrid
```typescript
interface VideoGridProps {
  videos: YouTubeVideo[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}
```

### VideoPlayer
```typescript
interface VideoPlayerProps {
  videoId: string;
}
```

## 🎨 Colors (Tailwind)

```
Primary Red:    text-red-600 / bg-red-600
Hover Red:      hover:bg-red-700
Gray Text:      text-gray-600
Gray BG:        bg-gray-100
```

## 📈 Performance Tips

1. Images are optimized by Next.js
2. Code splitting automatic by page
3. Lazy loading enabled
4. Use `revalidate` for caching:
   ```typescript
   export const revalidate = 3600; // 1 hour
   ```

## 🐛 Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Check API responses
# Browser Dev Tools → Network tab → /api/search
```

## 📋 Testing Checklist

- [ ] Search returns results
- [ ] Video cards load images
- [ ] Click video navigates to /watch
- [ ] Player embeds correctly
- [ ] Quality buttons highlight
- [ ] Back button works
- [ ] Responsive on mobile
- [ ] Load More pagination works

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| YouTube API | https://console.cloud.google.com |
| Next.js Docs | https://nextjs.org/docs |
| Tailwind CSS | https://tailwindcss.com |
| React | https://react.dev |

## 📞 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Images not loading | Check `next.config.ts` remotePatterns |
| API errors | Verify key in `.env.local` |
| Dev server won't start | `rm -rf .next && npm run dev` |
| TypeScript errors | `npm install` and check types |
| Port 3000 in use | `npm run dev -- -p 3001` |

## 🎬 Example Searches

Try these to test:
- "next.js tutorial"
- "react hooks"
- "web development"
- "javascript"
- "programming"

## 📊 Quota Management

- **Daily Limit:** 10,000 units
- **Search Cost:** 100 units
- **Details Cost:** 1 unit
- **Practical Limit:** ~100 searches/day

## 🔐 Production Checklist

- [ ] Move API key to backend .env
- [ ] Add input validation
- [ ] Implement rate limiting
- [ ] Add error tracking (Sentry)
- [ ] Enable HTTPS
- [ ] Add authentication
- [ ] Set up database
- [ ] Add caching (Redis)
- [ ] Deploy to Vercel/AWS
- [ ] Monitor performance

## 📚 Documentation Files

- `SETUP_GUIDE.md` - Detailed setup instructions
- `ARCHITECTURE.md` - Technical architecture
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `QUICK_REFERENCE.md` - This file

---

**Happy coding! 🚀**
