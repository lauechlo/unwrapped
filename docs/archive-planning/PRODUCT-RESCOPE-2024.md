# Product Vision Rescoping (December 2024)

## Context: What Changed

After implementing initial detectors and investigating Spotify API capabilities, we discovered critical limitations:

1. **Audio features deprecated** (Nov 27, 2024) - blocks ~30 audio-based detectors
2. **Temporal data limited to 2 days** - cannot build reliable temporal patterns
3. **No long-term temporal data exists** - Spotify API never provided this

This forces us to reassess: **Can we still achieve hyperspecific, psychology-driven music analysis?**

---

## Your Three Questions

### 1. Should we keep building detectors?

**YES - but pivot the strategy.**

**What works (50+ detectors still viable):**
- ✅ Ranking-based patterns (The Looper using top tracks)
- ✅ Artist relationship patterns (Ghost Artist, The Loyalist)
- ✅ Genre diversity patterns (artists have genre tags)
- ✅ Curation behavior patterns (saved tracks, playlists)
- ✅ Cross-time-range persistence patterns (track appearing across 4wk/6mo/all-time)

**What doesn't work (35+ detectors blocked):**
- ❌ Audio-based patterns (energy, valence, tempo)
- ❌ Week/month-long temporal patterns (only have 2 days)
- ❌ Recommendation-based patterns (endpoint deprecated)

**Recommendation:** **Continue building but focus on ranking, curation, and artist relationship patterns.** These are actually MORE psychologically interesting than audio features anyway.

### 2. Do we need more research on Spotify data?

**NO - we've hit the limits. Here's what exists:**

| Data Type | What We Get | Coverage | Sufficient? |
|-----------|-------------|----------|-------------|
| Top Tracks | 50 ranked tracks per time range | 4wk, 6mo, all-time | ✅ YES - excellent |
| Top Artists | 50 ranked artists per time range | 4wk, 6mo, all-time | ✅ YES - excellent |
| Saved Tracks | User's liked songs (paginated) | All saved tracks | ✅ YES - now added |
| Recently Played | 50 tracks with timestamps | ~2 days | ⚠️ LIMITED |
| Audio Features | Energy, valence, etc. | N/A | ❌ DEPRECATED |
| Playlists | User-created playlists | All playlists | ✅ YES - can add |
| User Profile | Name, subscription type | Current | ✅ YES - can add |

**Conclusion:** We've exhausted what's available. The API gives us ranking and curation data, NOT raw play counts or long-term temporal data.

### 3. Would you lose the hyperspecific analysis you intended?

**NO - but you need to reframe what "hyperspecific" means.**

**Original vision (impossible):**
- "You listen to high-energy tracks at 11pm every Thursday for 3 months"
- "Your valence drops 40% in the evening based on 6 weeks of data"

**Revised vision (achievable and arguably MORE interesting):**
- "Make It To Christmas is your #1 track for 4 weeks AND appears in your all-time top 10 → sustained obsession (The Looper)"
- "Lana Del Rey is your #1 artist short-term but doesn't appear in long-term top 50 → new phase obsession (Phase Shifter)"
- "You save 90% of the tracks you actually listen to → active curation behavior (The Curator)"
- "Your top 5 artists span 5 different genres → genre explorer (The Explorer)"

**These patterns are:**
- ✅ **Hyperspecific** - backed by exact rankings and persistence across time ranges
- ✅ **Psychologically grounded** - interpret emotional regulation, identity formation, curation vs passive listening
- ✅ **Evidence-based** - show exact data: "#1 for 4 weeks, also #3 all-time"
- ✅ **Differentiated** - no one else does multi-time-range pattern analysis

**The shift:** From "audio features + temporal precision" to **"ranking persistence + curation behavior + artist relationships"**

---

## Revised Product Vision

### Core Differentiator

**"We analyze the MEANING behind your rankings, not just the rankings themselves."**

Everyone shows "Your Top 10 Tracks." We show:
- **Why** that track is #1 (appears across all time ranges = long-term attachment)
- **What changed** (new artist in top 5 short-term but not medium = phase shift)
- **How you engage** (save rate, playlist behavior, genre diversity)

### What Makes Analysis "Hyperspecific"

**Multi-layer evidence strategy** - every pattern requires 2-3 pieces of evidence:

**Example: The Looper (Make It To Christmas)**
- Layer 1: #1 in 4-week top tracks
- Layer 2: Also #8 in 6-month top tracks (persistent)
- Layer 3: Also #15 in all-time top tracks (long-term attachment)
- **Conclusion:** This isn't a temporary phase, it's sustained obsessive listening

**Example: Phase Shifter (new pattern we can build)**
- Layer 1: Lana Del Rey is #1 artist in 4-week
- Layer 2: NOT in top 50 for 6-month
- Layer 3: NOT in all-time top 50
- **Conclusion:** New obsession phase, distinct from your historical preferences

**Example: The Curator (new pattern we can build)**
- Layer 1: 45 of your top 50 short-term tracks are saved
- Layer 2: You have 1,200 saved tracks total
- Layer 3: 80% of saved tracks are NOT in current top 50
- **Conclusion:** Active curatorial behavior, building a collection beyond current mood

### Psychological Frameworks (Still Valid)

**Saarikallio's emotional regulation strategies:**
- Discharge (The Looper)
- Diversion (The Explorer)
- Strong sensation (The Binge Listener)
- Solace (Comfort Rotation)

**Rentfrow-Gosling personality correlates:**
- Openness → genre diversity
- Conscientiousness → playlist organization
- Extraversion → social sharing (if we add social data)

**These frameworks still work** - we're just measuring them through rankings and curation rather than audio features.

---

## What We CAN Build (50+ Detectors)

### Repetition & Obsession Patterns (10 detectors)
1. ✅ **The Looper** - #1 track with persistence across time ranges
2. **Album Devotee** - Multiple tracks from same album in top 10
3. **The Completist** - All tracks from an album saved
4. **One-Track Wonder** - #1 track far ahead of #2
5. **Comfort Rotation** - Same 5-10 tracks across all time ranges

### Artist Relationship Patterns (15 detectors)
6. **Ghost Artist** - One artist dominates (40%+ of top tracks)
7. **The Loyalist** - Same top 3 artists across all time ranges
8. **Phase Shifter** - New #1 artist NOT in long-term top 50
9. **The Explorer** - High genre diversity in top artists
10. **Monogamous Listener** - Low artist count, high track count per artist

### Curation Behavior Patterns (10 detectors)
11. **The Curator** - High save rate (80%+ of top tracks saved)
12. **The Hoarder** - Massive saved library (2000+ tracks)
13. **Selective Saver** - Low save rate (< 20% of top tracks saved)
14. **The Organizer** - 20+ curated playlists
15. **Playlist Abandoner** - Many playlists, few followers

### Genre & Diversity Patterns (10 detectors)
16. **Genre Purist** - 90%+ of top tracks share one genre
17. **Genre Drifter** - Short-term genre different from long-term
18. **The Eclectic** - 5+ genres in top 10 artists
19. **Era Obsessed** - All top tracks from same decade
20. **Language Learner** - Multiple languages in top tracks

### Cross-Time-Range Patterns (10 detectors)
21. **The Trendy** - Short-term top tracks NOT in medium/long-term
22. **Time Capsule** - All-time favorites still in current top 10
23. **The Revivalist** - Long-term track returns to short-term top 10
24. **Seasonal Shifter** - Complete turnover between time ranges
25. **The Consistent** - 70%+ overlap across all time ranges

### Temporal Patterns (LIMITED - 5 detectors, low confidence)
26. ⚠️ **Night Owl** - 35%+ listening 10pm-4am (2-day sample, confidence 0.6 max)
27. ⚠️ **Early Bird** - 35%+ listening 6am-10am (2-day sample, confidence 0.6 max)
28. ⚠️ **Weekend Warrior** - 2.5x+ weekend listening (2-day sample, confidence 0.55 max)

**Note:** Temporal patterns include disclaimers about limited data coverage.

### TOTAL: ~50 reliable detectors + 5 limited temporal patterns

---

## What We CANNOT Build (35+ Detectors Blocked)

### Audio Feature Patterns (30 detectors)
- Emotional Bookender (valence shifts)
- Energy Junkie (high energy preference)
- The Dancer (danceability)
- Tempo Shifter (BPM preferences)
- Acoustic vs Electric
- *All require deprecated audio features endpoint*

### Long-Term Temporal Patterns (5 detectors)
- Sunday Ritual (consistent Sunday behavior over months)
- Coping Song (2am specific track over weeks)
- Commute Companion (weekday 8am patterns over months)
- *All require weeks/months of temporal data, only have 2 days*

---

## Product Strategy Going Forward

### Phase 1: V1 Launch (Current - 2 weeks)
**Goal:** Ship 15 high-quality detectors with multi-layer evidence

**Detectors to build:**
1. ✅ The Looper (done)
2. ⚠️ Night Owl (done, low confidence)
3. ⚠️ Early Bird (done, low confidence)
4. ⚠️ Weekend Warrior (done, low confidence)
5. Ghost Artist (artist obsession)
6. The Loyalist (consistent favorites)
7. Phase Shifter (new obsession)
8. The Curator (high save rate)
9. The Explorer (genre diversity)
10. Genre Purist (genre focus)
11. The Trendy (short-term only tracks)
12. Time Capsule (all-time in current top 10)
13. Comfort Rotation (same tracks across time)
14. Album Devotee (album focus)
15. One-Track Wonder (dominant single track)

**Why these 15:**
- Mix of patterns across categories
- All use available data (rankings, saved tracks, time ranges)
- Multi-layer evidence for each
- Psychologically grounded interpretations

### Phase 2: V1.5 Expansion (Month 2)
**Add 20-30 more detectors:**
- Playlist behavior patterns
- User profile integration (premium vs free)
- Advanced cross-time-range patterns
- More genre/language patterns

### Phase 3: V2 Multi-Session (Month 3+)
**Require backend/database:**
- Track aggregated temporal stats over multiple visits
- Build confidence in temporal patterns over time
- "We've observed your listening for 3 weeks, NOW we can confirm Night Owl pattern"

### Phase 4: User Data Import (Future)
**Optional feature:**
- Allow users to upload Spotify privacy export (12 months of data)
- Unlock true long-term temporal analysis
- "Premium analysis" tier

---

## Key Decisions

### ✅ Keep Building Detectors
- 50+ detectors still viable with current data
- Focus on ranking, curation, artist relationships
- These are MORE psychologically interesting than audio features

### ✅ Hyperspecific Analysis Still Achievable
- Reframe from "audio precision" to "ranking persistence + curation behavior"
- Multi-layer evidence makes patterns specific and credible
- Actually more defensible than vague audio feature patterns

### ✅ Product Vision Intact
- "Psychology-first music analysis" → still true
- "Evidence-based pattern detection" → still true
- "Researcher voice with transparency" → still true
- Differentiator shifts from "we have audio data" to "we interpret meaning behind rankings"

### ⚠️ Temporal Patterns Are Limited
- Only build 3-5 temporal detectors
- Cap confidence at 0.55-0.6
- Add explicit disclaimers about 2-day data
- Consider "V2" feature requiring multi-session or user data import

---

## Updated README Summary

**What changed:**
- Audio features: Removed (deprecated)
- Temporal patterns: Limited confidence (2-day data)
- Saved tracks: Added
- Focus: Rankings, curation, artist relationships

**What stayed the same:**
- Psychology-first interpretation
- Evidence-based detection
- Researcher voice
- Multi-layer pattern validation
- Target: 75 detectors (50 V1, 25 V1.5)

**New core differentiator:**
"We don't just show your top tracks - we reveal the psychological patterns behind WHY those tracks are at the top, HOW your tastes evolved, and WHAT your curation behavior says about you."

---

## Conclusion

**You CAN achieve hyperspecific, psychology-driven analysis.**

You just need to:
1. ✅ Accept audio features are gone (not a loss - rankings are better data anyway)
2. ✅ Be honest about temporal limitations (add disclaimers, lower confidence)
3. ✅ Focus on what's UNIQUE about your approach (multi-time-range persistence analysis)
4. ✅ Build the 50 viable detectors that use ranking/curation data

**The product vision is not only intact - it's MORE focused and MORE defensible.**

**Spotify Wrapped shows:** "These were your top 10 tracks."
**Unwrapped shows:** "Your #1 track appears across ALL three time ranges with 1.0 confidence - this is sustained emotional attachment (The Looper). Here's the psychological framework explaining why people loop tracks (Saarikallio's discharge strategy)."

That's hyperspecific. That's differentiated. That's achievable with current data.
