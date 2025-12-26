# Analytics Tracking for V2 Planning

**Created:** December 26, 2024
**Purpose:** Document analytics being collected to inform V2 feature decisions

---

## Overview

Unwrapped V1 tracks user behavior in **browser localStorage** (client-side only). No server-side analytics or tracking pixels. This data helps answer: "What do users actually do with the app?"

**Key Principle:** Data-driven V2 roadmap based on real user behavior, not assumptions.

---

## What We Track

### 1. Pattern Detection Analytics

**Tracked by:** `components/SynthesisClient.tsx`
**Storage Key:** `unwrapped_analytics`

**Data Structure:**
```json
{
  "sessions": [
    {
      "timestamp": "2024-12-26T08:00:00.000Z",
      "patternsDetected": [
        {
          "name": "The 2AM Song",
          "confidence": 0.92,
          "category": "temporal"
        },
        {
          "name": "Ghost Artist",
          "confidence": 0.85,
          "category": "repetition"
        }
      ],
      "patternCount": 30,
      "fromCache": false
    }
  ],
  "cacheViews": 5,
  "lastCacheView": "2024-12-26T09:00:00.000Z"
}
```

**Questions This Answers:**
- Which patterns appear most frequently across all users?
- What's the average pattern count per user?
- Which pattern categories dominate (temporal, repetition, emotional)?
- How many users return to view cached results?

---

### 2. Card Share Analytics

**Tracked by:** `components/DownloadButton.tsx` via `lib/analytics.ts`
**Storage Keys:** `unwrapped_analytics_*` (timestamped events)

**Event: Individual Card Download**
```json
{
  "event": "card_download",
  "timestamp": "2024-12-26T08:05:00.000Z",
  "data": {
    "cardIndex": 0,
    "patternLabel": "The 2AM Song"
  }
}
```

**Event: Download All Cards**
```json
{
  "event": "download_all_cards",
  "timestamp": "2024-12-26T08:10:00.000Z",
  "data": {
    "cardCount": 4
  }
}
```

**Questions This Answers:**
- Which cards get shared most? (popularity ranking)
- Do users share individual cards or download all?
- Which pattern types resonate most for sharing?

---

### 3. "Prove It" Click Analytics

**Tracked by:** `components/PatternCards.tsx` via `lib/analytics.ts`
**Storage Keys:** `unwrapped_analytics_*`

**Event: Prove It Click**
```json
{
  "event": "prove_it_click",
  "timestamp": "2024-12-26T08:07:00.000Z",
  "data": {
    "patternLabel": "The 2AM Song"
  }
}
```

**Questions This Answers:**
- Do users care about seeing the evidence?
- Which patterns do users want proof for?
- Should V2 show evidence by default or keep it hidden?

---

## How to Export Analytics

### Option 1: Browser Console (Single User)

Open browser DevTools Console and run:

```javascript
// Export all analytics
console.log(JSON.parse(localStorage.getItem('unwrapped_analytics')));

// Export all events
Object.keys(localStorage)
  .filter(key => key.startsWith('unwrapped_analytics_'))
  .map(key => JSON.parse(localStorage.getItem(key)));

// Count Prove It clicks
Object.keys(localStorage)
  .filter(key => key.startsWith('unwrapped_analytics_'))
  .map(key => JSON.parse(localStorage.getItem(key)))
  .filter(e => e.event === 'prove_it_click')
  .length;
```

### Option 2: Using Built-in Functions

In browser console:

```javascript
// Import analytics functions
import { getAnalyticsEvents, exportAnalytics } from '@/lib/analytics';

// Get all events
const events = getAnalyticsEvents();
console.log(events);

// Export as JSON
const json = exportAnalytics();
console.log(json);

// Copy to clipboard
navigator.clipboard.writeText(exportAnalytics());
```

---

## Analysis Framework for V2

### After First 50-100 Users

**Goal:** Identify trends and validate assumptions

**Key Metrics to Calculate:**

1. **Pattern Popularity**
   ```
   Count frequency of each pattern name across all sessions
   → Top 5 most common patterns
   → Inform which detectors to improve in V2
   ```

2. **Share Behavior**
   ```
   Ratio of individual card shares vs. download all
   → If >70% download all: Keep current UX
   → If <30% download all: Focus on individual sharing UX
   ```

3. **Evidence Engagement**
   ```
   Prove It click rate = (prove_it_clicks / total_sessions)
   → If >50%: Users want evidence, show by default in V2
   → If <20%: Evidence is optional, keep hidden
   ```

4. **Cache Hit Rate**
   ```
   Cache views / total sessions
   → Measure 24-hour return rate
   → If high: Users like to revisit, consider longer cache
   ```

---

## V2 Feature Decision Matrix

Use this framework to prioritize V2 features based on data:

### High Share Rate for Specific Pattern → Prioritize Similar Detectors

**Example:**
- If "The 2AM Song" gets shared 3x more than other cards
- **V2 Action:** Build more temporal/coping pattern detectors
- **Why:** Users resonate with time-based behavioral insights

### High "Prove It" Click Rate → Add More Evidence

**Example:**
- If >60% of users click "Prove It"
- **V2 Action:** Show evidence by default, add more detailed breakdowns
- **Why:** Users want data transparency, not just insights

### Low Individual Card Share, High "Download All" → Simplify Sharing

**Example:**
- If 80% use "Download All" and <20% share individual cards
- **V2 Action:** Improve "Download All" UX, add direct Instagram Story integration
- **Why:** Users want batch sharing, not curation

### High Cache View Rate → Add Historical Comparison

**Example:**
- If 40%+ of users return to view cached results
- **V2 Action:** Add "Compare to last month" feature
- **Why:** Users are interested in longitudinal patterns

---

## Data Collection Timeline

### Phase 1: Launch (Dec 26-31, 2024)
- Friends & family testing (10-15 users)
- Fix critical bugs
- Validate analytics collection works

### Phase 2: Public Launch (Jan 1-7, 2025)
- LinkedIn/Instagram posts
- Target: 100-150 users
- Monitor analytics daily

### Phase 3: Analysis (Jan 8-15, 2025)
- Export all analytics
- Calculate metrics
- Create V2 roadmap based on findings

### Phase 4: V2 Development (Jan 15+)
- Build features informed by data
- A/B test new patterns if possible

---

## Example Analysis: Real User Data

**Hypothetical findings after 100 users:**

```
Pattern Frequency Analysis:
1. The 2AM Song: 47 users (47%)
2. Ghost Artist: 38 users (38%)
3. Night Owl Processor: 35 users (35%)
4. The Looper: 28 users (28%)
5. Comfort Rotation: 22 users (22%)

Share Behavior:
- Individual card shares: 234
- Download all: 89
- Most shared card: "The 2AM Song" (89 shares)

Evidence Engagement:
- Total Prove It clicks: 312
- Click rate: 78% of sessions
- Most clicked: "Ghost Artist" (67 clicks)

Cache Behavior:
- Total sessions: 100
- Cache views: 45
- Cache hit rate: 45%
```

**V2 Decisions Based on This Data:**

1. ✅ **Add more temporal/coping detectors** (2AM Song is most popular)
2. ✅ **Show evidence by default** (78% click "Prove It")
3. ✅ **Keep individual card sharing** (234 individual shares shows users curate)
4. ✅ **Add "Compare to last analysis" feature** (45% return rate)
5. ⏸️ **Skip email capture** (not enough demand data yet)

---

## Privacy & Ethics

**Important:**
- All analytics stored **client-side only** (localStorage)
- No server-side tracking, no cookies, no third-party analytics
- Users can clear analytics by clearing browser data
- No personally identifiable information (PII) collected
- Pattern names/labels only, never actual track names or user data

**Disclosure:**
- Privacy policy already mentions "localStorage analytics"
- Users are informed data stays on their device

---

## Files Modified for Analytics

1. `components/SynthesisClient.tsx` - Pattern detection tracking (lines 57-65, 105-123)
2. `components/DownloadButton.tsx` - Card share tracking (line 100, 114)
3. `components/PatternCards.tsx` - Prove It tracking (line 19)
4. `lib/analytics.ts` - Core analytics functions (already existed)

---

## Next Steps

1. ✅ Launch to friends & family (Dec 26-27)
2. ✅ Public launch (Dec 29-30)
3. ⏸️ Let users accumulate (Dec 31 - Jan 7)
4. 📊 Export analytics (Jan 8)
5. 📝 Analyze data and create V2 roadmap
6. 🚀 Build V2 features based on findings

---

*Documentation created: December 26, 2024*
*See also: SESSION_SUMMARY_2024-12-25_MOBILE_UX.md, BUDGET.md*
