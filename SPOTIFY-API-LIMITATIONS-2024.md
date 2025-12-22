# Spotify API Limitations (December 2024)

## Critical Finding: Audio Features Deprecated

You were RIGHT about the deprecation! On **November 27, 2024**, Spotify deprecated several key endpoints for new applications.

### Deprecated Endpoints (New Apps Get 403)
- ❌ **Audio Features** - Energy, valence, tempo, danceability, etc.
- ❌ **Audio Analysis** - Detailed track analysis
- ❌ **Recommendations** - Algorithm-based track recommendations
- ❌ **Related Artists** - Artist similarity
- ❌ **Featured Playlists** - Spotify editorial playlists
- ❌ **30-second Preview URLs** - Track previews

**Source:** [Spotify for Developers - Changes to Web API](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)

**Impact:** Only apps with extended quota extensions BEFORE November 27, 2024 can still use these endpoints. Our app is new, so we get 403 Forbidden errors.

**Reason Given:** Spotify cited "security" but developers are skeptical ([TechCrunch article](https://techcrunch.com/2024/11/27/spotify-cuts-developer-access-to-several-of-its-recommendation-features/)).

**Replacement?** Spotify support mentioned "a replacement is coming" but no official timeline or details ([GitHub Discussion](https://github.com/spotipy-dev/spotipy/issues/1173)).

## Temporal Patterns: NOT Available for Weeks/Months

### What Spotify API Provides

**Recently Played Endpoint:**
- Returns: Last 50 tracks with exact timestamps
- Coverage: ~2-3 days for active listeners
- Format: `played_at` timestamp for each track
- **This is the ONLY temporal data available**

**Top Tracks/Artists Endpoints:**
- Returns: Ranked lists (no timestamps)
- Time ranges: short_term (4 weeks), medium_term (6 months), long_term (all-time)
- Format: Ranked by play count
- **Problem:** NO temporal information (no time-of-day, no day-of-week data)

### What Spotify API Does NOT Provide

❌ **Historical temporal patterns** - No "when did I listen to my top tracks"
❌ **Time-of-day statistics** - No "I listened to X at 10pm over the past month"
❌ **Day-of-week patterns** - No "I listen to Y on weekends over 6 months"
❌ **Extended listening history** - Cannot paginate beyond 50 recent tracks

**Source:** [Spotify API Issue #20 - Retrieve play history](https://github.com/spotify/web-api/issues/20)

### Alternative: Spotify Privacy Data Export

Users can request their full streaming history from Spotify:
- **Privacy Settings → Download Your Data**
- Includes: Last 12 months of listening history with timestamps
- Format: JSON file with all plays and timestamps
- **Limitation:** Requires manual user action, 30-day wait

**Source:** [Medium - Spotify Listening History](https://medium.com/@angelozorn/music-listening-history-using-the-spotify-api-javascript-and-python-b953938b4837)

## What IS Still Available

✅ **Top Tracks** - Ranked by play count across time ranges (we're using this)
✅ **Top Artists** - Ranked by listening time across time ranges (we're using this)
✅ **Recently Played** - Last 50 tracks with timestamps (we're using this)
✅ **User Profile** - Display name, follower count, subscription type
✅ **Saved Tracks** - User's liked songs library
✅ **Playlists** - User-created playlists
✅ **Playback Control** - Current playback state
✅ **Search** - Search Spotify catalog

**Source:** [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api)

## Impact on Our Detectors

### Blocked by Audio Features Deprecation
These detectors **cannot be built** without audio features:

1. **Emotional Bookender** - Morning sad → evening happy (needs valence)
2. **Energy Junkie** - High-energy tracks (needs energy score)
3. **Chill Seeker** - Low-energy, acoustic tracks (needs acousticness)
4. **The Dancer** - High danceability tracks (needs danceability)
5. **Tempo Shifter** - Fast vs slow tempo preferences (needs tempo)
6. **Acoustic vs Electric** - Instrumentalness patterns (needs acousticness/instrumentalness)

**Total blocked:** ~30 detectors from roadmap

### Limited by Temporal Data (2 Days Only)

These detectors are **unreliable** with only 2 days of data:

1. **Night Owl Processor** - Needs weeks to establish pattern
2. **Early Bird Processor** - Needs weeks to establish pattern
3. **Weekend Warrior** - Needs at least 2 weekends (2+ weeks)
4. **Sunday Ritual** - Needs multiple Sundays
5. **Emotional Bookender** - Even if we had valence, 2 days insufficient

**Reliability:** LOW - May detect anomalies, not patterns

### Still Viable with Current Data

These detectors **work well** with available data:

1. ✅ **The Looper** - Uses top tracks ranking (indirect but reliable)
2. ✅ **Ghost Artist** (future) - Uses top artists across time ranges
3. ✅ **The Loyalist** (future) - Compares short vs long-term top artists
4. ✅ **The Explorer** (future) - Diversity of artists in top lists
5. ✅ **Genre Drifter** (future) - Artist genre changes over time (artists have genre tags)

**Total viable:** ~40 detectors from roadmap (non-audio, non-temporal)

## Recommendations

### Immediate Actions

1. **Remove audio features fetching attempt** - Stop trying, it's deprecated
2. **Add disclaimer to temporal patterns** - "Based on 2 days of data"
3. **Lower temporal detector confidence** - 0.5-0.6 max instead of 0.9-1.0
4. **Add saved tracks endpoint** - Still available, enables curation patterns
5. **Focus on ranking-based detectors** - These work with available data

### Medium-Term Strategy

1. **Multi-session data collection**
   - Store aggregated temporal stats in backend
   - Build confidence over multiple user visits
   - Requires: Database, user accounts

2. **User data import flow**
   - Allow users to upload Spotify privacy export
   - Parse their 12-month streaming history
   - Enable true long-term temporal analysis

3. **Artist genre analysis**
   - Artists have genre tags in API
   - Can detect genre preferences, diversity, shifts
   - Build genre-based detectors

### Long-Term Pivot

**Accept the reality:** Spotify has locked down audio features and temporal data.

**New strategy:**
- Focus on what we CAN access (rankings, relationships, curation behavior)
- Be transparent about limitations
- Differentiate through psychological interpretation, not raw data depth
- Consider building "pattern confidence over time" feature (multi-session)

## Summary Table

| Data Type | Available? | Quality | Detectors Enabled |
|-----------|-----------|---------|------------------|
| Top Tracks Rankings | ✅ Yes | High | 20+ detectors |
| Top Artists Rankings | ✅ Yes | High | 15+ detectors |
| Saved Tracks | ✅ Yes | High | 10+ detectors |
| Playlists | ✅ Yes | Medium | 5+ detectors |
| Recent Plays (2 days) | ✅ Yes | Low temporal | 3 detectors (unreliable) |
| Audio Features | ❌ Deprecated | None | 0 detectors |
| Long-term Temporal | ❌ Never existed | None | 0 detectors |
| User Data Export | ⚠️ Manual | High (if provided) | 30+ detectors |

**Bottom line:** We have enough data for ~50 reliable detectors. Audio features (30 detectors) are blocked. Temporal patterns (5 detectors) are unreliable. Focus on ranking, curation, and artist relationship patterns.
