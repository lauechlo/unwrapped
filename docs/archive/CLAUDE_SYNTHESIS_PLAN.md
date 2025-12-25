# Claude Synthesis Implementation Plan
**Start Date:** December 21, 2024
**Timeline:** 5-7 days
**Goal:** Transform 35 pattern detections into cohesive psychological narrative

---

## Phase 1: System Prompt Engineering (Days 1-2)

### Objectives
- Develop "researcher voice" persona
- Create synthesis structure templates
- Define negative examples (avoid AI slop)
- Test prompt quality with sample data

### Key Requirements from PRD

**Tone:**
- Observational, not judgmental
- Warm, slightly unnerving in accuracy
- Specific numbers always
- Hedged conclusions ("suggests," "tends to")

**Forbidden words/phrases:**
- "eclectic taste"
- "diverse musical interests"
- "creative soul"
- "music lover"
- "unique"
- Generic compliments

**Pattern structure:**
> "You [specific behavior with numbers]. That's not [surface interpretation] - that's [deeper interpretation]."

### Prompt Components

**1. Hero Insight Generation**
- Input: All detected patterns, confidence scores, evidence
- Output: One devastating observation (5-10 words + 1-2 sentence subtext)
- Examples:
  - "You don't listen to music. You use it."
  - "Your music taste isn't eclectic. It's unstable."
  - "You're not exploring. You're avoiding."

**2. Callout Card Copy**
- Input: Single pattern with evidence
- Output: Punchy one-line interpretation
- Format: "[Specific data]. That's not [X] - that's [Y]."
- Examples:
  - "89 Hozier plays Sept 3-17, then nothing. We've all been there."
  - "Make It To Christmas: #1 for 4 weeks, #2 for 6 months, #5 all-time. That's not a phase - that's an anchor."

**3. Deep Analysis Synthesis**
- Input: All detected patterns grouped by psychological dimension
- Output: 2-3 paragraph narrative connecting patterns
- Must reference specific evidence
- Must identify themes across patterns

**4. Listening DNA Summary**
- Input: Patterns by dimension
- Output: Label + 1-sentence interpretation per dimension
- Examples:
  - "Emotional Strategy: Loyalist - You return to the same 6 artists when you need stability"
  - "Discovery Mode: Active Explorer - 60% of your current favorites are new, but rooted in stable identity"

---

## Phase 2: API Setup & Configuration (Day 1)

### What You Need

**1. Anthropic API Key**
- Sign up at: https://console.anthropic.com/
- Get API key from Dashboard > API Keys
- Store in `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

**2. Install Anthropic SDK**
```bash
npm install @anthropic-ai/sdk
```

**3. API Route Structure**
```
app/api/
  synthesis/
    route.ts          # Main synthesis endpoint
  hero-insight/
    route.ts          # Hero insight generation
  callout-cards/
    route.ts          # Callout card copy generation
```

### Cost Estimation

**Claude Sonnet 4.5:**
- Input: $3 per million tokens
- Output: $15 per million tokens

**Per user analysis:**
- Input: ~2,000 tokens (pattern data + prompts)
- Output: ~800 tokens (synthesis)
- Cost: ~$0.018 per user

**At scale:**
- 1,000 users: $18
- 10,000 users: $180
- 100,000 users: $1,800

Negligible for a product with share-driven growth.

---

## Phase 3: Implementation Architecture (Days 2-4)

### Data Flow

```
User Data
  ↓
Pattern Detection (35 detectors)
  ↓
Pattern Aggregation & Grouping
  ↓
Claude API (Synthesis)
  ↓
Structured Output
  ↓
Results Display
```

### TypeScript Interfaces

```typescript
// Input to Claude
interface SynthesisInput {
  patterns: DetectionResult[];
  userContext: {
    totalArtists: number;
    totalTracks: number;
    topGenres: string[];
    timeRangesCovered: string[];
  };
}

// Output from Claude
interface SynthesisOutput {
  heroInsight: {
    headline: string;        // "You don't listen to music. You use it."
    subtext: string;         // 1-2 sentences explaining
  };
  calloutCards: Array<{
    patternId: number;
    patternName: string;
    oneLiner: string;        // Punchy interpretation
    evidence: string[];      // Key data points
  }>;
  deepAnalysis: {
    paragraphs: string[];    // 2-3 paragraphs
    themes: string[];        // Cross-pattern themes identified
  };
  listeningDNA: Array<{
    dimension: string;       // "Emotional Strategy"
    label: string;           // "The Loyalist"
    interpretation: string;  // One-sentence meaning
    confidence: number;
  }>;
}
```

### Claude API Integration Pattern

```typescript
// app/api/synthesis/route.ts
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  const { patterns, userContext } = await request.json();

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    system: RESEARCHER_VOICE_PROMPT,
    messages: [{
      role: 'user',
      content: buildSynthesisPrompt(patterns, userContext)
    }]
  });

  return Response.json(parseSynthesisOutput(message.content));
}
```

---

## Phase 4: System Prompts (Days 2-3)

### Base System Prompt (Researcher Voice)

```
You are a music cognition researcher analyzing Spotify listening data. Your task is to generate psychological insights that feel personally crafted, not generic.

VOICE:
- Observational, not judgmental
- Warm but direct
- Slightly unnerving in accuracy
- Use hedged language: "suggests," "tends to," "pattern indicates"

REQUIREMENTS:
1. Reference SPECIFIC numbers, track names, artist names, dates
2. Connect patterns to psychological constructs
3. Use the structure: "You [specific behavior]. That's not [surface] - that's [deeper meaning]."
4. Maximum 3 sentences per insight

FORBIDDEN (never use these):
- "eclectic taste"
- "diverse musical interests"
- "creative soul"
- "music lover"
- "unique"
- Generic compliments

GROUNDING:
- Saarikallio's emotional regulation framework (discharge, diversion, solace)
- Rentfrow-Gosling personality dimensions (openness, conscientiousness)
- Music identity theory (attachment, exploration, regulation)

OUTPUT FORMAT:
- Hero Insight: 1 headline (5-10 words) + 1-2 sentence subtext
- Callout Cards: One punchy line per pattern using the structure above
- Deep Analysis: 2-3 paragraphs connecting patterns into narrative
- Listening DNA: 1 label + 1 sentence per psychological dimension
```

### Hero Insight Prompt Template

```
Based on these detected patterns, generate ONE hero insight - the most devastating, personally resonant observation about this user's listening behavior.

DETECTED PATTERNS:
${patterns.map(p => `- ${p.patternName} (${p.confidence}): ${p.evidence[0].humanReadable}`).join('\n')}

REQUIREMENTS:
- 5-10 word headline that feels like a personal callout
- 1-2 sentence subtext explaining the insight
- Must reference at least 2 patterns
- Must feel personally crafted, not generic

EXAMPLES OF GOOD HERO INSIGHTS:
- Headline: "You don't listen to music. You use it."
  Subtext: "Your listening patterns reveal music as an emotional regulation tool, not entertainment. The same 6 artists appear across all time ranges - these aren't favorites, they're coping mechanisms."

- Headline: "You're not exploring. You're avoiding."
  Subtext: "17 tracks from your all-time top 20 are absent from current rotation. That's not taste evolution - that's emotional protection from songs that mean too much."

Generate hero insight:
```

### Callout Card Prompt Template

```
Transform this pattern detection into a punchy, shareable callout.

PATTERN: ${patternName}
CONFIDENCE: ${confidence}
EVIDENCE:
${evidence.map(e => `- ${e.humanReadable}`).join('\n')}

STRUCTURE:
"[Specific data with numbers]. That's not [surface interpretation] - that's [deeper psychological meaning]."

EXAMPLES:
- "Make It To Christmas: #1 for 4 weeks, #2 for 6 months, #5 all-time. That's not a phase - that's an anchor."
- "89 Hozier plays Sept 3-17, then nothing. We don't need to talk about what happened that week."
- "You played 'All Too Well' 4 times in a row at 2:34am. That's not listening - that's processing."

Generate callout:
```

### Deep Analysis Prompt Template

```
Synthesize these patterns into a cohesive 2-3 paragraph narrative about this user's listening psychology.

PATTERNS BY DIMENSION:

IDENTITY & ATTACHMENT:
${identityPatterns.map(p => formatPattern(p)).join('\n')}

EMOTIONAL REGULATION:
${emotionalPatterns.map(p => formatPattern(p)).join('\n')}

TEMPORAL BEHAVIOR:
${temporalPatterns.map(p => formatPattern(p)).join('\n')}

REPETITION & COPING:
${repetitionPatterns.map(p => formatPattern(p)).join('\n')}

INSTRUCTIONS:
1. Identify 2-3 themes across patterns (e.g., "stable identity + active exploration")
2. Connect patterns into psychological narrative
3. Reference specific evidence (track names, numbers, dates)
4. 2-3 paragraphs, each 3-5 sentences
5. Use researcher voice (observational, specific, hedged)

EXAMPLE OUTPUT:
"You've built a stable musical identity anchored by 6 core artists (Ariana Grande, Sabrina Carpenter, PinkPantheress, Lana Del Rey, Taylor Swift, FLETCHER) who appear consistently across all time ranges. This isn't casual listening - these artists serve specific emotional functions. The Loyalist pattern suggests low novelty-seeking and high attachment to familiar sonic environments.

But within that framework, you're actively discovering. 60% of your current top tracks are new - they weren't in your 6-month or all-time favorites. This combination of stability + exploration is psychologically revealing: you know who you are musically, and you're expanding from there. You're not stuck in the past, but you're not chasing trends either.

The 2 tracks that persist across all three time ranges ('Make It To Christmas' and 'we can't be friends') function as emotional anchors. These aren't just songs you like - they're songs you return to when you need stability. The consistency pattern (appearing in top 5 across 4 weeks, 6 months, and all-time) indicates these tracks serve a regulatory function in your emotional life."

Generate analysis:
```

---

## Phase 5: Implementation Steps (Days 3-5)

### Step 1: Pattern Grouping Logic

```typescript
// lib/synthesis/groupPatterns.ts

interface PatternGroup {
  dimension: string;
  patterns: DetectionResult[];
  dominance: number; // How strong this dimension is (0-1)
}

export function groupPatternsByDimension(
  patterns: DetectionResult[]
): PatternGroup[] {
  const groups = new Map<string, DetectionResult[]>();

  patterns.forEach(pattern => {
    const dimension = pattern.psychologicalDimension;
    if (!groups.has(dimension)) {
      groups.set(dimension, []);
    }
    groups.get(dimension)!.push(pattern);
  });

  return Array.from(groups.entries()).map(([dimension, patterns]) => ({
    dimension,
    patterns,
    dominance: calculateDominance(patterns)
  })).sort((a, b) => b.dominance - a.dominance);
}

function calculateDominance(patterns: DetectionResult[]): number {
  const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
  const count = patterns.length;
  return (avgConfidence * 0.7) + (Math.min(count / 5, 1) * 0.3);
}
```

### Step 2: Hero Insight Selection

```typescript
// lib/synthesis/selectHeroInsight.ts

export function selectHeroPattern(patterns: DetectionResult[]): DetectionResult {
  // Score each pattern for "hero potential"
  const scored = patterns.map(pattern => ({
    pattern,
    score: calculateHeroScore(pattern)
  }));

  // Return highest scoring pattern
  return scored.sort((a, b) => b.score - a.score)[0].pattern;
}

function calculateHeroScore(pattern: DetectionResult): number {
  let score = pattern.confidence;

  // Bonus for psychological depth
  const deepDimensions = ['memory and avoidance', 'identity transition', 'emotional regulation'];
  if (deepDimensions.includes(pattern.psychologicalDimension)) {
    score += 0.2;
  }

  // Bonus for specificity (more evidence = more specific)
  score += Math.min(pattern.evidence.length * 0.05, 0.15);

  // Bonus for certain high-impact patterns
  const heroCandidates = ['The Vault Track Hunter', 'The Consistency Champion', 'The 2AM Song', 'Ghost Artist'];
  if (heroCandidates.includes(pattern.patternName)) {
    score += 0.15;
  }

  return Math.min(score, 1.0);
}
```

### Step 3: API Routes

```typescript
// app/api/synthesis/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { groupPatternsByDimension } from '@/lib/synthesis/groupPatterns';
import { selectHeroPattern } from '@/lib/synthesis/selectHeroInsight';

export async function POST(request: Request) {
  try {
    const { patterns, userContext } = await request.json();

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Group patterns by dimension
    const grouped = groupPatternsByDimension(patterns);

    // Select hero pattern
    const heroPattern = selectHeroPattern(patterns);

    // Generate hero insight
    const heroInsight = await generateHeroInsight(anthropic, heroPattern, patterns);

    // Generate callout cards (top 5 patterns by confidence)
    const topPatterns = patterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
    const calloutCards = await generateCalloutCards(anthropic, topPatterns);

    // Generate deep analysis
    const deepAnalysis = await generateDeepAnalysis(anthropic, grouped);

    // Generate listening DNA
    const listeningDNA = await generateListeningDNA(anthropic, grouped);

    return Response.json({
      heroInsight,
      calloutCards,
      deepAnalysis,
      listeningDNA
    });

  } catch (error) {
    console.error('[Synthesis API] Error:', error);
    return Response.json({ error: 'Synthesis failed' }, { status: 500 });
  }
}
```

### Step 4: Prompt Builder Functions

```typescript
// lib/synthesis/prompts.ts

export const SYSTEM_PROMPT = `You are a music cognition researcher analyzing Spotify listening data...`;

export function buildHeroInsightPrompt(
  heroPattern: DetectionResult,
  allPatterns: DetectionResult[]
): string {
  return `Based on these detected patterns, generate ONE hero insight - the most devastating observation.

HERO PATTERN: ${heroPattern.patternName} (${heroPattern.confidence})
${heroPattern.evidence.map(e => `- ${e.humanReadable}`).join('\n')}

SUPPORTING PATTERNS:
${allPatterns.slice(0, 5).map(p => `- ${p.patternName} (${p.confidence})`).join('\n')}

Generate a hero insight with:
1. Headline (5-10 words)
2. Subtext (1-2 sentences)

Format as JSON:
{
  "headline": "...",
  "subtext": "..."
}`;
}

export function buildCalloutPrompt(pattern: DetectionResult): string {
  return `Transform this pattern into a punchy callout.

PATTERN: ${pattern.patternName}
CONFIDENCE: ${pattern.confidence}
EVIDENCE:
${pattern.evidence.map(e => `- ${e.humanReadable}`).join('\n')}

Generate one line using structure: "[Data]. That's not [X] - that's [Y]."

Output JSON:
{
  "callout": "..."
}`;
}
```

---

## Phase 6: Testing & Iteration (Days 5-6)

### Test Cases

**Test with multiple user profiles:**

1. **High Loyalty Profile**
   - The Loyalist (100%)
   - Comfort Rotation (85%)
   - Low genre diversity
   - Expected: "You've found your artists and you're staying there"

2. **Explorer Profile**
   - The Explorer (100%)
   - The Trendy (85%)
   - High genre diversity
   - Expected: "You're always discovering, never settling"

3. **Emotional Regulation Profile**
   - The Vault Track Hunter (95%)
   - Coping Song (80%)
   - Night Owl (60%)
   - Expected: "You use music to process, not just listen"

4. **Mixed Profile** (Your current data)
   - Loyalty + Exploration + Vaulting
   - Expected: "Stable identity with active evolution"

### Quality Criteria

**Good synthesis:**
- ✅ References specific tracks/artists/numbers
- ✅ Uses researcher voice (not generic)
- ✅ Connects 2-3 patterns into theme
- ✅ Feels personally crafted
- ✅ Avoids forbidden words

**Bad synthesis (iterate if you see this):**
- ❌ "You have eclectic taste"
- ❌ Generic compliments
- ❌ No specific evidence
- ❌ Doesn't connect patterns
- ❌ Feels like AI slop

### Iteration Process

1. Run synthesis on test data
2. Evaluate output against quality criteria
3. Refine prompts (add negative examples, adjust structure)
4. Re-test
5. Repeat until output is consistently good

---

## Phase 7: UI Integration (Days 6-7)

### Results Page Structure

```tsx
// app/results/page.tsx

export default async function ResultsPage() {
  // ... existing data fetching

  // NEW: Fetch synthesis
  const synthesis = await fetch('/api/synthesis', {
    method: 'POST',
    body: JSON.stringify({ patterns: detectedPatterns, userContext })
  }).then(r => r.json());

  return (
    <div>
      {/* Hero Insight - Full screen reveal */}
      <HeroInsightSection insight={synthesis.heroInsight} />

      {/* Callout Cards - Swipeable */}
      <CalloutCardsSection cards={synthesis.calloutCards} />

      {/* Deep Analysis */}
      <DeepAnalysisSection analysis={synthesis.deepAnalysis} />

      {/* Listening DNA */}
      <ListeningDNASection dna={synthesis.listeningDNA} />

      {/* Debug Console (existing) */}
      <DebugConsole patterns={detectedPatterns} />
    </div>
  );
}
```

### Component Design

```tsx
// components/HeroInsight.tsx
export function HeroInsightSection({ insight }) {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-2xl px-8 text-center">
        <h1 className="text-5xl font-bold mb-6 text-white">
          {insight.headline}
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          {insight.subtext}
        </p>
      </div>
    </section>
  );
}
```

---

## Timeline Summary

**Day 1: Setup & Prompt Engineering**
- Get Anthropic API key
- Install SDK
- Write system prompts
- Test prompts with sample data

**Day 2: Architecture & Grouping**
- Build pattern grouping logic
- Implement hero insight selection
- Create synthesis input/output interfaces

**Day 3: API Implementation**
- Build synthesis API route
- Implement prompt builder functions
- Test Claude API integration

**Day 4: Generation Functions**
- Hero insight generation
- Callout card generation
- Deep analysis generation
- Listening DNA generation

**Day 5: Testing**
- Test with multiple user profiles
- Evaluate output quality
- Iterate on prompts

**Day 6: UI Integration**
- Build hero insight component
- Build callout card components
- Integrate with results page

**Day 7: Polish & Validation**
- Refine copy based on tests
- Error handling
- Loading states
- Final validation

---

## Success Metrics

**You'll know synthesis is working when:**

1. Hero insights feel personally targeted
2. Callouts are immediately shareable
3. Deep analysis connects patterns coherently
4. No generic AI slop detected
5. You get "how did it know that?" reactions

---

## Next Steps

1. Get Anthropic API key
2. Install SDK: `npm install @anthropic-ai/sdk`
3. Create `.env.local` with API key
4. Start with system prompt engineering
5. Test prompts before building full pipeline

Ready to start implementation?
