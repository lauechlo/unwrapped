# Changelog - Technical Implementation Log

> **Note:** This is the technical implementation log for developers. See `/CHANGELOG.md` at project root for user-facing release notes.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2024-12-25

### Added (December 25, 2024)

#### 📲 Shareable Image Cards Feature
- **Instagram Stories-ready cards** (1080×1920 dimensions)
  - Client-side image generation using html-to-image library
  - Artist-specific gradient backgrounds (36+ unique color themes)
  - Neon accent colors matching artist themes
  - Download all 4 cards or individual cards
- **Card selection algorithm** - Selects 4 best cards from 6-8 patterns
  - Ensures dimension diversity (no duplicate psychological dimensions)
  - Ranks by shareability score (confidence + callout quality)
- **Visual hierarchy optimized for virality**
  - 72px pattern label (THE STAR - e.g., "Ariana/PinkPantheress/Sabrina Loyalty Disorder")
  - 30px proof line (one punchy evidence statement)
  - 26px behavior badge with emoji (the shareable insight)
  - "Your Spotify Unwrapped" badge at top
  - Cute disclaimer: "spotify's api gave us crumbs but we made it cute ✨ don't take this too seriously"
- **Design polish**
  - Removed "The" prefix from pattern labels for punchier titles
  - Removed redundant callout line - behavior badge says it better
  - Simplified evidence to one impactful line
  - Neon glow effects on emojis and dividers
  - Rounded behavior badge with neon border
  - Larger branding footer ("UNWRAPPED by Chloe")

#### Components Added
- `ShareCard.tsx` - Main shareable card component with inline styles for image capture
- `DownloadButton.tsx` - Download UI with background rendering
- `lib/synthesis/select-shareable.ts` - Card selection logic

### Added (Previous)
- 30 pattern detectors across 4 categories (temporal, identity, repetition, variety)
- Data validation and debug console for transparency
  - Complete play history with exact timestamps
  - Gap analysis between plays
  - Pattern detection status (all 30 detectors)
  - Track frequency analysis
  - Data coverage metrics
- Quick reference validation helper showing artist/track persistence across time ranges
- Multi-layer evidence strategy requiring 2-3 converging data points per pattern
- Confidence scoring calibrated by data type (temporal: 55-60%, identity: 70-100%)

#### Pattern Detectors (30 total)

**Temporal (10)**
- Night Owl Processor - Late-night listening concentration
- Early Bird Processor - Morning listening patterns
- Weekend Warrior - Weekend vs weekday differences
- The 2AM Song - Tracks with 70%+ plays midnight-4AM
- Emotional Bookender - Same track at start and end of day
- The Binge Listener - 10+ track concentrated sessions
- Sunday Ritual - Day-of-week concentration patterns
- The Day/Night Persona - Morning/evening artist separation OR concentration
- The Momentum Builder - Progressive session intensification
- The Transition Ritual - Tracks preceding long listening gaps

**Identity (8)**
- The Loyalist - Single artist dominance
- The Explorer - High genre diversity
- The Trendy - New track preference
- Time Capsule - Old track preference
- Phase Shifter - Artist intensity surges (new or renewed)
- Comfort Rotation - Tracks persisting across all time ranges
- The Late Bloomer - New tracks with rapid rise
- The Rediscovery - All-time favorites returning after absence

**Repetition (7)**
- The Looper - Top track persisting across all time ranges
- Coping Song - Rapid succession replays (3+ within 10min, 2+ sessions)
- One-Track Wonder - Extreme single-track dominance
- The Skip-Proof Track - Overperformance vs ranking
- The Perfectionist - Instant track replays (under 5min)
- Album Devotee - Multiple tracks from same album
- The First Verse Addict - Early album track preference

**Variety (5)**
- Ghost Artist - Artist in favorites without recent plays
- Genre Purist - Low genre diversity
- The Curator - High saved track ratio
- The Genre Hopper - Frequent cross-genre switching
- The Featured Artist Hunter - Featured artist preference

### Fixed
- Phase Shifter now detects both new discoveries AND renewed obsessions
  - Previously only detected new artists (not in all-time)
  - Added distinction in evidence: "NEW discovery phase" vs "RENEWED obsession"
- Genre Hopper now enriches artist data from topArtists endpoint
  - Previously used recentlyPlayed which lacks genre metadata
  - Now builds artist-to-genres mapping from full artist objects
- Day/Night Persona now detects strong single-period concentration
  - Added concentration detection (75%+ in one period)
  - Renamed to "The Morning Person" or "The Night Owl" based on dominant period
  - Original separation logic preserved when both periods have 5+ plays

### Changed
- Confidence scoring philosophy: under-promise, over-deliver
  - Temporal patterns capped at 55-60% (limited to 2-3 days of data)
  - Identity patterns range 70-100% (cross-time-range validation)
- Pattern detection requires multi-layer evidence (2-3 converging data points)
- Evening hours defined explicitly: 6:00 PM - 2:00 AM

### Technical Decisions
- Spotify audio features API deprecated Nov 2024 - pivoted to behavioral patterns
- Genre data enrichment strategy due to endpoint inconsistencies
- Debug console implementation for user trust and transparency
- Cross-time-range analysis prioritized over point-in-time snapshots

### Known Limitations
- Recent plays limited to 50 tracks (Spotify API constraint)
- Temporal patterns cover only 2-3 days of listening
- Genre data depends on Spotify's artist genre tagging
- Some patterns require more data than available (e.g., weekly patterns need 7+ days)

---

## Future Planned Features

### V1 Completion
- Claude synthesis layer for cross-pattern analysis
- Hero insight selection logic
- Callout card polish for social sharing
- 5-10 additional high-confidence identity detectors

### Future Iterations
- Longitudinal tracking (monthly re-authentication)
- User feedback collection on pattern accuracy
- A/B testing of confidence thresholds
- Pattern "aha moment" rate analysis

---

Last Updated: December 25, 2024
