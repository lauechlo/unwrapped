# Development Journal

Record of key product decisions, technical challenges, and insights.

## Project Vision

Build a Spotify analysis tool revealing the psychology behind music listening patterns. Move beyond "top songs" statistics to insights about emotional regulation, daily structure, and experience processing.

Core Principle: Music cognition psychology over vanity metrics.

---

## Week 1: Foundation & Detector Architecture (Dec 15-21, 2025)

### Initial Discovery: Spotify API Constraints

Challenge: Original vision included audio feature analysis (energy, valence, tempo) for mood detection.

Finding: Spotify deprecated audio features API in November 2024.

Impact:
- Cannot detect mood through audio features
- Forced focus on behavioral patterns (repetition, timing, artist loyalty)
- Led to stronger cross-time analysis framework
- Behavioral patterns prove more psychologically revealing

Key Decision: Embrace the constraint. Behavioral patterns over audio features for psychological insight.

---

### Architecture Decision: Multi-Layer Evidence Strategy

Problem: How to confidently detect patterns when data is limited?

Solution: Require 2-3 converging data points before triggering any pattern.

Example - The Looper:
1. Track is #1 in 4-week top tracks
2. AND also top 10 in 6-month favorites
3. AND also top 10 in all-time favorites
4. Evidence: "This isn't a phase, this is a core part of your identity"

Confidence Calibration:
- Temporal patterns: 55-60% max (only 2-3 days from 50 recent plays)
- Identity patterns: 70-100% (cross-referencing 3 time ranges, 50 items each)
- Repetition patterns: 65-85% (frequency + recency)

Rationale: Users need to trust insights. False positives destroy credibility.

---

### Major Troubleshooting: Phase Shifter False Negatives

Issue: User has 3 Cynthia Erivo tracks in top 10 (clear intensity surge), but Phase Shifter didn't detect.

Investigation:
1. Added debug logging
2. Logs showed: "Cynthia Erivo has 3 tracks (threshold: 3)" - PASS
3. BUT: "In long-term top 50: true" - FAIL

Root Cause: Pattern only detected NEW artists (not in all-time history).

User Insight: "Wouldn't a renewed obsession with an old favorite also be a phase shift?"

Fix: Rescoped to detect ANY intensity surge:
- NEW discovery (not in long-term) = "NEW discovery phase"
- Returning favorite (in long-term) = "RENEWED obsession"

Confidence adjustment:
- NEW: Higher confidence (truly new behavior)
- RENEWED: Slightly lower (but still valid)

Product Learning: Pattern definitions need user validation. User was correct - we were missing valid patterns.

---

### API Data Discovery: Genre Metadata Issue

Problem: Genre Hopper showed "0 switches, 1 genre" despite user having diverse taste (k-pop, pop, cantopop, musicals, bedroom pop).

Investigation:
- The Explorer: Found 24 unique genres (WORKING)
- Genre Purist: Found 13 unique genres (WORKING)
- Genre Hopper: Found 1 genre (BROKEN)

Root Cause:
- recentlyPlayed endpoint returns simplified track objects without artist genres
- topArtists endpoint returns full artist objects WITH genres

Solution: Enrichment strategy
```typescript
// Build artist ID -> genres mapping from topArtists
const artistGenreMap = new Map<string, string[]>();
[...data.topArtists.short, ...data.topArtists.medium, ...data.topArtists.long]
  .forEach(artist => {
    if (artist.genres) artistGenreMap.set(artist.id, artist.genres);
  });

// Enrich recent plays
const artistGenres = artistGenreMap.get(artistId) || [];
```

Impact: Unlocked all genre-based detectors.

Product Learning: API responses not consistent across endpoints. Always validate data structure.

---

### User Feedback: Day/Night Persona Threshold Too Strict

Issue: User had 18 morning / 4 evening plays (82% morning) but pattern didn't trigger.

Original Logic: Required 5+ plays in EACH period to measure artist separation.

User Challenge: "Wouldn't 82% concentration be enough evidence?"

Analysis: User correct. Two distinct patterns exist:
1. Concentration: Overwhelming preference for ONE period (75%+)
2. Separation: Different artists in morning vs evening (when both periods have data)

Fix: Detect both patterns
```typescript
// Pattern 1: Strong concentration
if (morningConcentration >= 0.75) {
  return { patternName: 'The Morning Person', ... }
}

// Pattern 2: Distinct separation (original)
if (both periods >= 5 plays && separation >= 60%) {
  return { patternName: 'The Day/Night Persona', ... }
}
```

Evening Hours Defined: 6:00 PM - 2:00 AM

Product Learning: When users question thresholds, they're often revealing better pattern definitions.

---

### Testing & Validation: User's "Obsessed x3" Experiment

Experiment: User played "Obsessed" 3 times consecutively to test Coping Song detector.

Expected: Should trigger (3+ plays within 10min threshold met)

Actual: Didn't trigger

Reason: Coping Song requires MIN_REPEAT_SESSIONS: 2 (needs behavior on 2 separate occasions)

Rationale: One intense session could be random. Two sessions indicate pattern.

Product Learning: Detection thresholds balance sensitivity vs false positives. Debug console essential for trust.

---

## Data Coverage Analysis

After building 30 detectors:

Strong Sources (high confidence possible):
- Top Tracks: 50 x 3 time ranges = 150 data points
- Top Artists: 50 x 3 time ranges = 150 data points
- Cross-time-range analysis enables 70-100% confidence
- Persistence detection across months/years

Limited Sources (moderate confidence):
- Recent Plays: Only 50 tracks (2-3 days)
- Temporal patterns capped at 55-60% confidence
- Cannot detect weekly patterns reliably (need 7+ days)
- Genre data requires enrichment from topArtists

Missing Sources (deprecated):
- Audio Features (energy, valence, tempo) - deprecated Nov 2024
- Cannot directly measure track "mood"
- Must infer from artist/genre instead

Strategic Implication: Build MORE identity detectors (cross-time-range), FEWER temporal detectors (limited by 2-3 day window).

---

## Current Status: 30 Detectors Built

Detection Rate: 8/30 patterns triggered on test data (27%)

Why 27% is Good:
- Temporal patterns need specific conditions (late-night, weekend, etc.)
- Not everyone exhibits all 30 patterns
- Shows detectors are specific, not overly broad

Patterns Detecting on Test User:
1. The Loyalist (100% confidence)
2. The Looper (100% confidence)
3. Album Devotee (95% confidence) - 5 Wicked tracks
4. The Trendy (80% confidence)
5. Comfort Rotation (74% confidence)
6. Phase Shifter (70% confidence) - Cynthia Erivo surge
7. The Explorer (100% confidence)
8. The Binge Listener (74% confidence) - 2 sessions

Near-Misses (edge cases):
- First Verse Addict: 100% early tracks but only 1 album (needs 2)
- Featured Artist Hunter: 25% featured tracks (needs 40%)
- Day/Night Persona: Fixed, should trigger after refresh

---

## Key Product Decisions

### 1. Debug Console for Transparency

Rationale: Users need to validate pattern detection against actual data.

Implementation:
- Complete play history with exact timestamps
- Gap analysis between plays (binge sessions, rapid succession)
- All 30 detectors status (detected / not detected)
- Track frequency analysis (near-misses)
- Data coverage metrics (API limitations)

Impact: Users can verify detection logic and understand why patterns didn't trigger.

### 2. Confidence Scoring Philosophy

Principle: Under-promise, over-deliver.

Rationale for Lower Temporal Confidence:
- 50 tracks over 2-3 days is tiny sample
- Cannot confidently claim "you're a night owl" from 3 days
- CAN state "this track appears 70% at night" (observable fact)

Approach: Show actual data, let user interpret significance. Don't overstate confidence.

### 3. Pattern Naming Convention

Effective Names:
- "The Loyalist" (clear identity)
- "The 2AM Song" (specific, evocative)
- "Coping Song" (psychological insight)

Renamed During Development:
- "Day/Night Persona" → "The Morning Person" / "The Night Owl" (more specific)

Rationale: Names become part of user self-narrative. "I'm a Loyalist" sticks better than "high artist consistency."

---

## Next Steps

Immediate (This Session):
1. Document key decisions
2. Create changelog
3. Commit current progress
4. Build 5 high-confidence identity detectors

V1 Completion:
- Build to 35-40 detectors (currently 30)
- Prioritize cross-time-range detectors (strongest data)
- Add Claude synthesis layer (cross-pattern analysis)
- Implement hero insight selection
- Polish callout cards for sharing

Future Considerations:
- Collect user feedback on pattern accuracy
- A/B test different confidence thresholds
- Analyze which patterns have highest "aha moment" rate
- Consider longitudinal tracking (monthly re-auth)

---

## Lessons Learned

1. API constraints can be assets - losing audio features forced better psychological framework
2. Users are effective debuggers - every "why didn't this trigger?" improved patterns
3. Transparency builds trust - debug console turns skepticism into validation
4. Cross-time analysis superior to point-in-time - 3 time ranges = exponentially more insight
5. Name patterns carefully - they become identity labels
6. Test with real data early - assumptions about thresholds often wrong
7. Document while fresh - technical context fades quickly

---

## Open Questions

1. Should Coping Song threshold lower to 1 session? (Currently requires 2)
2. How to handle users with under 10 saved tracks? (The Curator won't trigger)
3. Should confidence scores be visible? (Currently shown, might confuse)
4. Minimum listening history for meaningful analysis? (New Spotify users)
5. How to explain temporal pattern limitations without disappointing users?

---

Last Updated: December 21, 2025
