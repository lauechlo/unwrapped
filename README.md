# Unwrapped - Developer Setup Guide

> **Note:** This is the developer setup guide. See `/README.md` at project root for the main project overview.

A viral, psychology-driven Spotify listening analysis tool with screenshot-worthy insights.

## Features

- 🎵 **Pattern Detection**: 30+ detectors analyze listening behavior
- 🧠 **Viral Synthesis**: Claude AI generates screenshot-worthy insights with artist/track names
- 🎨 **Artist-Themed Colors**: 36+ curated color themes + dynamic generation
- 📊 **Listening DNA**: 5 psychological dimensions of music use
- 💬 **Prove It Button**: Collapsible evidence for transparency
- 📲 **Shareable Image Cards**: Instagram Stories-ready cards (1080×1920) with artist-specific gradients

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file with:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback
ANTHROPIC_API_KEY=your_claude_api_key
```

3. Run dev server:
```bash
npm run dev
```

## Shareable Image Cards

The app generates Instagram Stories-ready cards (1080×1920) for the 4 most shareable patterns.

### How It Works
1. **Card Selection** - Algorithm selects 4 cards from 6-8 patterns based on:
   - Shareability score (confidence × callout quality)
   - Dimension diversity (no duplicate psychological dimensions)
2. **Visual Design** - Artist-specific gradients with neon accents
   - 72px pattern label (main attraction)
   - 30px proof line (one punchy fact)
   - 26px behavior badge (the shareable insight)
3. **Image Generation** - Client-side rendering using html-to-image
   - Cards rendered off-screen with inline styles
   - Converted to PNG and downloaded
   - No server-side rendering required

### Design Philosophy
- **Gradient backgrounds** - Artist-specific themes (36+ curated)
- **Neon accents** - Matching the website's visual identity
- **Minimal text** - One title, one proof, one insight
- **Self-aware branding** - "spotify's api gave us crumbs but we made it cute ✨"

## V1.0 Launch Status ✅

**Shipped:** December 25, 2024
**Production:** https://frontend-sooty-six-11.vercel.app

All critical features completed:

### Core Features ✅
- [x] **Remove mock synthesis data** - Deleted `lib/synthesis/mock-data.ts` and mock mode logic
- [x] **Implement rate limiting** - 3 total uses per user (localStorage + fingerprinting)
- [x] **Analytics tracking** - Pattern detection, card downloads, "Prove It" clicks
- [x] **Mobile + Web optimization** - Fully responsive, Web Share API integration

### Image Download Feature ✅
- [x] Instagram Story cards (1080×1920) with html-to-image
- [x] Individual card sharing and batch download
- [x] Mobile-optimized sharing (Web Share API)
- [x] Branding and disclaimers on all cards

### Performance & UX ✅
- [x] Loading states with progressive screens
- [x] Error boundaries for graceful failure
- [x] Client-side analytics (localStorage)
- [x] SEO optimization (meta tags, Open Graph, structured data)
- [x] Privacy policy page

### V2 Roadmap (Post-Launch)
See `/archive/ROADMAP.md` for detailed V2 planning based on user analytics.

## Architecture

```
frontend/
├── app/
│   ├── page.tsx              # Landing page
│   ├── results/page.tsx      # Results display (SSR)
│   └── api/auth/             # Spotify OAuth
├── components/
│   ├── PatternCards.tsx      # Interactive pattern cards
│   ├── ShareCard.tsx         # Shareable image card (Instagram Stories)
│   └── DownloadButton.tsx    # Image download UI + generation
├── lib/
│   ├── detectors/            # Pattern detection engine
│   │   ├── patterns/         # Individual detector files
│   │   └── runner.ts         # Detection orchestration
│   ├── synthesis/            # Claude synthesis
│   │   ├── synthesize-viral.ts
│   │   ├── select-shareable.ts  # Card selection logic (4 best)
│   │   ├── helpers.ts
│   │   └── types.ts
│   ├── spotify/              # Spotify API client
│   ├── claude/               # Claude API client
│   ├── rateLimit.ts          # Rate limiting (3 uses max)
│   ├── analytics.ts          # "Prove It" + download tracking
│   └── artistColors.ts       # Color theme system (100+ artists)
└── .env.local                # ⚠️ NEVER COMMIT
```

## Tech Stack

- **Next.js 15.5.9** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Claude API (Sonnet 4.5)** - AI synthesis
- **Spotify Web API** - Music data
- **html-to-image** - Client-side image generation for shareable cards

## Notes

- Temporal patterns disabled (insufficient data from Spotify API)
- Genre Hopper detector disabled (insufficient evidence for viral synthesis)
- Deduplication: 40% evidence overlap threshold + label similarity matching
- Pattern detection runs in parallel, synthesis runs sequentially (rate limit protection)
- Artist color themes: 100 curated themes with neon accents for shareable cards
- Image cards use inline styles (required for html-to-image compatibility)
- Rate limiting: 3 total uses per user (tracked via localStorage + user fingerprinting)
- Analytics: "Prove It" clicks and card downloads tracked locally
