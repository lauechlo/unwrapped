# Claude Synthesis Stability Testing Plan

**Purpose:** Validate prompt stability, consistency, and tone compliance before scaling to users
**Timeline:** 2-3 days before building full pipeline
**Cost:** ~$2-3 of the $5 Claude budget

---

## Testing Framework

### 1. Prompt Stability Tests (Consistency)

**Hypothesis:** Same pattern set should produce similar narrative structure and tone, not wildly different interpretations.

**Test Method:**
1. Select 3 representative pattern sets from real user data
2. Run each pattern set through Claude 5 times (15 total runs)
3. Measure variance in:
   - Sentiment/tone (positive, neutral, clinical)
   - Narrative structure (intro → finding → implication)
   - Key terms used (technical vs colloquial)
   - Length (word count variance)

**Success Criteria:**
- Tone variance < 20% (measured by sentiment analysis)
- All outputs use researcher voice (no "bestie" language)
- Structure remains consistent (intro → evidence → interpretation)
- No contradictory interpretations of same pattern

**Test Cases:**

```typescript
// Test Case 1: Heavy Looper + Night Owl (high confidence)
const testCase1 = {
  patterns: [
    { patternName: 'The Looper', confidence: 1.0, evidence: [...] },
    { patternName: 'Night Owl Processor', confidence: 0.93, evidence: [...] }
  ],
  expectedTone: 'clinical, specific, non-judgmental',
  expectedFraming: 'emotional regulation strategy (discharge + temporal)'
};

// Test Case 2: Mixed confidence patterns
const testCase2 = {
  patterns: [
    { patternName: 'The Loyalist', confidence: 1.0, evidence: [...] },
    { patternName: 'The Trendy', confidence: 0.75, evidence: [...] },
    { patternName: 'Sunday Ritual', confidence: 0.70, evidence: [...] }
  ],
  expectedTone: 'balanced - acknowledge both stability and exploration',
  expectedFraming: 'identity formation with active discovery'
};

// Test Case 3: Low pattern count (edge case)
const testCase3 = {
  patterns: [
    { patternName: 'The Explorer', confidence: 1.0, evidence: [...] }
  ],
  expectedTone: 'focused on single dimension, not overgeneralized',
  expectedFraming: 'openness to experience, genre diversity'
};
```

**Analysis:**
- Manual review of all 15 outputs
- Flag any "AI slop" phrases ("eclectic taste," "unique journey," "fascinating")
- Flag any invented patterns not in input
- Flag tone inconsistencies

---

### 2. Non-Hallucination Tests

**Hypothesis:** Claude will not invent patterns, tracks, or statistics not present in the input data.

**Test Method:**
1. Provide pattern data with specific tracks/artists/numbers
2. Check output for:
   - Invented track names
   - Fabricated statistics
   - Patterns not in the input
   - Timestamps/dates that don't match input

**Test Cases:**

```typescript
// Test Case: Specific Evidence
const hallucinationTest = {
  patterns: [
    {
      patternName: 'The Vault Track Hunter',
      confidence: 0.95,
      evidence: [
        { type: 'track', value: { name: 'Guilty as Sin?', artists: [{ name: 'Taylor Swift' }] } },
        { type: 'count', value: 17, humanReadable: '17 tracks from all-time top 20' }
      ]
    }
  ],
  mustInclude: ['Guilty as Sin?', 'Taylor Swift', '17'],
  mustNotInclude: ['other tracks', 'similar songs', 'approximately']
};
```

**Success Criteria:**
- 0 invented track names
- 0 fabricated statistics
- All numbers match input exactly
- No vague language ("several tracks" when input says "17 tracks")

---

### 3. Tone Compliance Tests (Researcher Voice)

**Hypothesis:** Output maintains researcher persona - clinical, specific, non-generic, occasionally provocative.

**Test Method:**
1. Create prompt with explicit negative examples
2. Test with 10 different pattern sets
3. Check for banned phrases and tone violations

**Banned Phrases (AI Slop):**
- "eclectic taste"
- "unique journey"
- "fascinating pattern"
- "interesting to note"
- "diverse listening habits"
- "your music tells a story"
- "reflects your personality"
- "suggests that you"

**Required Voice Characteristics:**
- Uses specific numbers and track names
- Direct statements, not hedging ("This is X" not "This suggests X")
- Occasional provocative framing ("That's not a favorite - that's a coping mechanism")
- Technical terms grounded in research (Saarikallio's discharge strategy, etc.)

**Test Prompt Structure:**

```
SYSTEM:
You are a music cognition researcher analyzing listening data. Your voice is:
- Clinical and specific (use exact numbers, track names, timestamps)
- Direct, not hedging (state findings confidently)
- Occasionally provocative (reveal uncomfortable truths)
- Grounded in research frameworks (cite Saarikallio, Rentfrow-Gosling when relevant)

NEVER use these generic phrases:
- "eclectic taste" (be specific about genre distribution)
- "unique journey" (everyone's listening is unique, add nothing)
- "fascinating pattern" (clinical analysis, not commentary)
- "interesting to note" (weak hedge, just state the finding)

EXAMPLE - Bad:
"Your eclectic taste spans many genres, which is fascinating and suggests you have an open personality."

EXAMPLE - Good:
"24 genres across your top 50 artists (entropy: 3.8) - this maps to Rentfrow-Gosling's Openness dimension. You're not 'eclectic' - you're systematically exploring."

USER:
[Pattern data here]
```

**Success Criteria:**
- 0 occurrences of banned phrases
- All outputs use specific numbers (not vague language)
- Tone feels "researcher sharing findings" not "AI being helpful"

---

### 4. Diagnostic Framing Tests

**Hypothesis:** Framing as "diagnostic labels with evidence chains" is more differentiated than prose narratives.

**Test Method:**
Compare two synthesis approaches on same data:

**Approach A: Prose Narrative**
```
You've built a stable musical identity anchored by 6 core artists who've earned
permanent positions across years of listening. But within that framework, you're
actively discovering - 60% of your current favorites are new. You're not stuck in
the past, but you're not chasing trends either. You know who you are musically,
and you're expanding from there.
```

**Approach B: Diagnostic Label + Evidence Chain**
```
PATTERN: Anchored Explorer
├─ STABILITY MECHANISM: 6 artists across all 3 time ranges (The Loyalist, conf: 1.0)
├─ ACTIVE DISCOVERY: 60% current top 10 absent from 6-month (The Trendy, conf: 0.75)
└─ FRAMEWORK: Rentfrow-Gosling - High Openness + High Conscientiousness

INTERPRETATION: Musical identity formation with controlled expansion. You've
established core attachments (Ariana Grande, Sabrina Carpenter across 12+ months)
while maintaining discovery rate (8/10 current tracks are new). This isn't
indecision - it's strategic exploration from a stable base.
```

**Evaluation Criteria:**
- Which feels more "research-backed"?
- Which is more shareable (Instagram screenshot test)?
- Which better highlights the psychology framework?
- Which avoids "AI slop" better?

**User Testing:**
- Show 5 people both formats
- Ask: "Which feels more credible?"
- Ask: "Which would you screenshot?"

---

### 5. Edge Case Tests

**Test scenarios where synthesis might fail:**

**Test Case 1: Contradictory Patterns**
```typescript
// User is both "The Loyalist" and "The Explorer"
const contradiction = {
  patterns: [
    { patternName: 'The Loyalist', confidence: 1.0 },
    { patternName: 'The Explorer', confidence: 1.0 }
  ],
  expectedBehavior: 'Synthesize into "selective explorer" or "anchored diversity" - not call out contradiction'
};
```

**Test Case 2: Low Confidence Only**
```typescript
// All patterns below 0.75 confidence
const lowConfidence = {
  patterns: [
    { patternName: 'Sunday Ritual', confidence: 0.70 },
    { patternName: 'The Binge Listener', confidence: 0.74 }
  ],
  expectedBehavior: 'Acknowledge limited data, don\'t overstate findings'
};
```

**Test Case 3: Single Strong Pattern**
```typescript
// Only one high-confidence pattern
const singlePattern = {
  patterns: [
    { patternName: 'The Looper', confidence: 1.0 }
  ],
  expectedBehavior: 'Deep analysis of single pattern, not generic filler'
};
```

**Test Case 4: Temporal Patterns with Warnings**
```typescript
// Pattern includes data limitation warning
const limitedData = {
  patterns: [
    {
      patternName: 'Night Owl Processor',
      confidence: 0.60,
      evidence: [
        { humanReadable: '⚠️ Based on ~3 days of recent listening' }
      ]
    }
  ],
  expectedBehavior: 'Acknowledge limitation in synthesis, don\'t overstate'
};
```

---

## Testing Timeline (2-3 Days)

### Day 1: Setup + Consistency Tests
- **Morning:** Write system prompt with negative examples
- **Afternoon:** Run consistency tests (Test Cases 1-3, 5 runs each = 15 runs)
- **Evening:** Manual review, flag tone issues
- **Cost:** ~$0.30 (15 runs × $0.02)

### Day 2: Hallucination + Tone Tests
- **Morning:** Run hallucination tests (10 different pattern sets)
- **Afternoon:** Tone compliance tests (check for banned phrases)
- **Evening:** Compare diagnostic framing vs prose narrative
- **Cost:** ~$0.40 (20 runs × $0.02)

### Day 3: Edge Cases + Iteration
- **Morning:** Edge case tests (contradictions, low confidence, etc.)
- **Afternoon:** Refine prompts based on failures
- **Evening:** Re-run failed tests with updated prompts
- **Cost:** ~$0.50 (25 runs × $0.02)

**Total Cost:** ~$1.20 (leaves $3.80 for pipeline integration and user testing)

---

## Success Metrics

**Gate for proceeding to pipeline build:**
- [ ] Consistency: <20% variance in tone across 5 runs of same input
- [ ] Hallucination: 0 invented tracks/stats across all tests
- [ ] Tone: 0 banned phrases across all outputs
- [ ] Framing: User preference for diagnostic framing >60%
- [ ] Edge cases: Graceful handling of contradictions and low confidence

**If ANY metric fails:**
- Refine prompts
- Re-test
- Don't proceed to pipeline

---

## Prompt Template (Starting Point)

```typescript
export const SYNTHESIS_SYSTEM_PROMPT = `You are a music cognition researcher analyzing Spotify listening data.

Your analysis style:
- CLINICAL AND SPECIFIC: Use exact numbers, track names, timestamps from evidence
- DIRECT: State findings confidently ("This is X" not "This suggests X")
- GROUNDED: Reference research frameworks (Saarikallio's emotional regulation, Rentfrow-Gosling MUSIC model)
- DIAGNOSTIC: Frame as labeled patterns with evidence chains, not prose stories

BANNED PHRASES (never use these):
- "eclectic taste" → specify genre distribution with entropy
- "unique journey" → adds nothing, everyone is unique
- "fascinating pattern" → clinical analysis, not commentary
- "interesting to note" → weak hedge, state the finding directly
- "diverse listening habits" → quantify the diversity
- "your music tells a story" → cliché, be specific

FORMAT YOUR RESPONSE AS:

PATTERN: [Diagnostic Label]
├─ PRIMARY MECHANISM: [Highest confidence pattern with evidence]
├─ SECONDARY PATTERNS: [Supporting patterns]
└─ FRAMEWORK: [Psychology model mapping]

INTERPRETATION: [2-3 sentences of clinical analysis using specific evidence]

EXAMPLE INPUT:
{
  "patterns": [
    { "patternName": "The Loyalist", "confidence": 1.0, "evidence": [...] },
    { "patternName": "The Trendy", "confidence": 0.75, "evidence": [...] }
  ]
}

EXAMPLE OUTPUT:
PATTERN: Anchored Explorer
├─ STABILITY: 6 artists across all 3 time ranges (The Loyalist, conf: 1.0)
├─ DISCOVERY: 60% current top 10 new tracks (The Trendy, conf: 0.75)
└─ FRAMEWORK: Rentfrow-Gosling - High Openness + Conscientiousness

INTERPRETATION: You've established core attachments (Ariana Grande, Sabrina Carpenter persistent 12+ months) while maintaining 60% discovery rate. This isn't indecision - it's controlled exploration from a stable identity base. Saarikallio's "solace" strategy (familiar artists) combined with active seeking.
`;

export const HERO_INSIGHT_PROMPT = `Based on the pattern analysis, generate a single devastating observation (5-10 words max).

BANNED:
- "You don't just listen to music, you..."
- "Your music taste is..."
- "Music is your..."

GOOD EXAMPLES:
- "You don't listen to music. You use it."
- "That's not a favorite. That's a coping mechanism."
- "You're not exploring. You're searching."

Use the HIGHEST confidence pattern as the basis. Be direct and provocative.`;
```

---

## Share Image Format Question (Addressing User's Ask)

Based on Instagram sharing behavior research:

**Recommended Format: Instagram Stories (1080x1920)**

**Why Stories > Feed:**
1. Lower friction - tap and share vs download and post
2. Ephemeral nature encourages sharing (FOMO)
3. Sticker/text overlay friendly
4. Stories have 2x engagement vs feed posts (Meta 2023 data)

**Card Design for Stories:**
```
┌─────────────────────────┐
│ [1080x1920 portrait]    │
│                         │
│    🌙                   │
│    PATTERN NAME         │
│                         │
│    "Diagnostic Label"   │
│                         │
│    ├─ Evidence 1        │
│    ├─ Evidence 2        │
│    └─ Framework         │
│                         │
│    [Interpretation]     │
│                         │
│                         │
│    unwrapped.app        │
└─────────────────────────┘
```

**Also generate: Feed Format (1080x1350) as secondary**
- For users who want permanent posts
- Better for archiving/portfolios

---

## Revised Priority (With Testing)

**Days 15-16: Stability Testing** (NEW)
- Run all 5 test suites above
- Validate prompt consistency
- Choose diagnostic framing vs prose
- Refine prompts until all gates pass

**Days 17-18: Synthesis Pipeline** (Only if testing passes)
- Build with validated prompts
- Cross-pattern theme identification
- Hero insight selection

**Days 19-20: Share Images**
- Stories format (1080x1920) primary
- Feed format (1080x1350) secondary
- Test share flow end-to-end

**Days 21: Integration**
- Results page with synthesis
- Error handling

---

## Questions for You

1. **Diagnostic framing vs prose**: Which resonates more with your psychology background? The diagnostic format feels more "instrument-like" but might be less shareable?

2. **Landing page anonymized examples**: Do you have 2-3 example pattern sets we could synthesize and show on landing (before auth)?

3. **Testing participation**: Do you want to manually review all test outputs, or should I automate tone/consistency checking?

Let me know your thoughts and we can refine this testing plan before starting.
