# Data Coverage Analysis

## Current Data Sources

### ✅ What We Have

1. **Top Tracks** (50 each)
   - Short-term: Last 4 weeks
   - Medium-term: Last 6 months
   - Long-term: All-time
   - **Use cases:** Repetition patterns, genre preferences, artist loyalty

2. **Top Artists** (50 each)
   - Short-term: Last 4 weeks
   - Medium-term: Last 6 months
   - Long-term: All-time
   - **Use cases:** Artist obsession, genre diversity, consistency over time

3. **Recently Played** (50 tracks)
   - Coverage: ~2-3 days for active listeners
   - Includes exact timestamps
   - **Use cases:** Temporal patterns (time of day, day of week)

4. **Audio Features** (attempted)
   - Status: 403 Forbidden error
   - **Would provide:** Energy, valence, tempo, danceability, acousticness, etc.
   - **Use cases:** Emotional patterns, energy levels, genre characteristics

### ⚠️ Critical Data Limitations

#### Problem 1: Temporal Patterns Unreliable
**Current detectors affected:**
- Night Owl Processor
- Early Bird Processor
- Weekend Warrior

**Issue:** Only 2 days of recently-played data
- Cannot reliably detect patterns (could be anomaly)
- Weekend Warrior needs at least 2 weeks (to compare multiple weekends)
- Night Owl needs at least a week to establish consistent behavior

**Evidence quality: LOW**

#### Problem 2: Audio Features Unavailable
**Status:** HTTP 403 on `/audio-features` endpoint

**Impact:** Cannot build audio-based detectors:
- Emotional Bookender (morning sad → evening happy)
- Energy patterns
- Valence (mood) shifts
- Tempo preferences

**Evidence quality: NONE**

#### Problem 3: No Track Play Counts
**What Spotify doesn't provide:**
- Exact play counts for tracks
- Historical listening timeline beyond 50 tracks
- Time-of-day statistics

**Impact:**
- The Looper uses ranking as proxy (good but indirect)
- Cannot measure exact repetition intensity

## Additional Data We Could Fetch

### High Priority

1. **User's Saved Tracks** (`/me/tracks`)
   - What: User's liked songs library (50+ tracks)
   - Why: Distinguish between passive listening vs active curation
   - Detector use cases:
     - "The Hoarder" (saves everything)
     - "The Curator" (selective saver)
     - Compare saved vs actually played

2. **Fix Audio Features** (`/audio-features`)
   - Debug 403 error (likely missing OAuth scope)
   - Required scope: NONE (should be public)
   - **This is CRITICAL for 30+ detectors in roadmap**

3. **User Profile** (`/me`)
   - What: Display name, follower count, product (premium/free)
   - Why: Context for analysis
   - Low priority but easy to add

### Medium Priority

4. **User's Playlists** (`/me/playlists`)
   - What: User's created playlists
   - Why: Detect curation behavior, organization patterns
   - Detector use cases:
     - "The Organizer" (many playlists)
     - Playlist themes analysis

5. **Recently Played with Pagination**
   - What: Request more than 50 tracks using pagination
   - Why: Extend temporal window beyond 2 days
   - **Problem:** API still caps at reasonable limits, won't get weeks of data
   - **Assessment:** Marginal improvement, not worth complexity

### Low Priority

6. **Current Playback** (`/me/player`)
   - What: What user is listening to right now
   - Why: Show live stats
   - Use case: "Currently listening to..." badge

7. **Available Genre Seeds** (`/recommendations/available-genre-seeds`)
   - What: List of genres Spotify recognizes
   - Why: Genre classification for tracks
   - **Problem:** Tracks don't have genre tags, only artists do

## Recommended Actions

### Immediate (This Session)

1. **Debug audio features 403 error**
   - Check OAuth scopes in `/api/auth/spotify/route.ts`
   - May need to add scope (though shouldn't be required)
   - Test with different endpoint format

2. **Add saved tracks endpoint**
   - Quick win, useful data
   - Enables curation vs listening comparison

3. **Update temporal detector confidence**
   - Lower confidence scores for temporal patterns
   - Add evidence disclaimers: "Based on 2 days of data"
   - Consider requiring higher thresholds

### Short-term (Next Session)

4. **Add user profile endpoint**
   - Display name for personalization
   - Premium status might affect recommendations later

5. **Multi-session approach for temporal patterns**
   - Store aggregated temporal stats across multiple user visits
   - Build confidence over time
   - Requires backend/database (future)

### Long-term (V2)

6. **Request extended listening history**
   - Allow users to upload their Spotify data export
   - Spotify provides full streaming history via privacy request
   - Enables true long-term temporal analysis

## Detector Reliability Matrix

| Detector | Current Data | Reliability | Needs Improvement? |
|----------|--------------|-------------|-------------------|
| Night Owl Processor | 2 days recent plays | LOW | Yes - need more data or lower confidence |
| Early Bird Processor | 2 days recent plays | LOW | Yes - need more data or lower confidence |
| Weekend Warrior | 2 days recent plays | VERY LOW | Yes - may not span a weekend |
| The Looper | 4 weeks top tracks | HIGH | No - good proxy for repetition |

## Multi-Layer Evidence Strategy

**For each detector, aim for 2-3 evidence layers:**

### Example: The Looper (Current Implementation ✅)
- **Layer 1:** Top track ranking (short-term) - "Make It To Christmas" is #1
- **Layer 2:** Persistence check (medium-term) - Also in top 10 over 6 months
- **Layer 3:** Long-term attachment (long-term) - Also in all-time favorites
- **Confidence calculation:** Base 0.9 + 0.2 persistence + 0.2 long-term = 1.0

### Example: Night Owl (Needs Improvement ⚠️)
- **Current Layer 1:** 35%+ night plays in 2-day recent history
- **Missing Layer 2:** Should check if top tracks were added to library at night
- **Missing Layer 3:** Should check medium-term consistency
- **Problem:** API doesn't provide this temporal metadata

### Example: Future Detector - "The Curator" (Needs Saved Tracks)
- **Layer 1:** High ratio of saved tracks to played tracks
- **Layer 2:** Saved tracks span diverse genres
- **Layer 3:** Saved tracks align with long-term top artists
- **Status:** Blocked on adding saved tracks endpoint

## Conclusion

**What we need to do:**
1. Fix audio features (unblock 30+ detectors)
2. Add saved tracks (new detector possibilities)
3. Lower confidence / add disclaimers for temporal patterns
4. Consider temporal patterns "V1.5" requiring multi-session data

**What Spotify API cannot provide:**
- More than 50 recent tracks
- Exact play counts
- Historical temporal patterns
- Time-of-day metadata for top tracks

**Trade-off:** We can either:
- A) Be honest about limitations (lower confidence, require more evidence)
- B) Use indirect proxies (acceptable but less precise)
- C) Build multi-session tracking (requires backend, future)

Recommendation: **A + B** - Be transparent about data limitations while using best available proxies.
