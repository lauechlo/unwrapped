# V1 Audit → V2 Translation Guide

## Executive Summary

**Key Insight:** V1 and V2 have fundamentally different architectures:
- **V1**: Claude discovers patterns from raw stats → High hallucination risk, needs psychology framework for guidance
- **V2**: Detectors find patterns with evidence → Low hallucination risk, Claude only narrates

**Implication:** Many V1 improvements are about **constraining discovery**. V2 needs improvements for **accurate narration** instead.

## Translatable Improvements (High Value)

### ✅ 1. Zod Schemas for Runtime Validation

**V1 Issue:** No runtime validation, parser falls back to generic content
**V2 Status:** ❌ Not implemented
**Translation:** DIRECT - Add Zod schemas for all synthesis outputs

```typescript
// Add to validation.ts
import { z } from 'zod';

export const PatternNarrativeSchema = z.object({
  title: z.string()
    .min(10, 'Title too short')
    .max(80, 'Title too long')
    .refine(s => /\d/.test(s), 'Title must include a number'),
  finding: z.string().min(20).max(300),
  context: z.string().min(20).max(400),
  callout: z.string().min(10).max(150),
});

export const HeroInsightSchema = z.object({
  headline: z.string()
    .min(5).max(60)
    .refine(s => s.split(' ').length <= 12, 'Max 12 words'),
  subtext: z.string().min(10).max(200),
  patternId: z.string(),
});
```

**Benefit:** Fail loudly instead of silent generic content

---

### ✅ 2. XML Structuring for Better Claude Understanding

**V1 Issue:** Natural language prompts less structured
**V2 Status:** ⚠️ Partially implemented (some structure, no XML)
**Translation:** ADAPT - Use XML tags for evidence formatting

**Current V2:**
```typescript
${formatPatternForPrompt(p)}  // Returns JSON string
```

**Improved V2:**
```typescript
function formatPatternForPrompt(pattern: DetectionResult): string {
  return `
<pattern id="${pattern.patternId}">
  <name>${pattern.patternName}</name>
  <family>${pattern.patternFamily}</family>
  <confidence>${(pattern.confidence * 100).toFixed(0)}%</confidence>

  <psychological_basis>
    ${pattern.psychologicalBasis}
  </psychological_basis>

  <evidence>
${pattern.evidence.map(e => `    <${e.type}>${e.humanReadable}</${e.type}>`).join('\n')}
  </evidence>
</pattern>
  `.trim();
}
```

**Benefit:** Claude 4.x responds better to XML structure (per Anthropic docs)

---

### ✅ 3. Prefilling for Guaranteed JSON

**V1 Issue:** Hopes for JSON, strips markdown fallback
**V2 Status:** ❌ Not implemented
**Translation:** DIRECT - Use assistant prefilling

**Update api.ts:**
```typescript
// Add prefilling for JSON
const messages: Anthropic.MessageParam[] = [
  { role: 'user', content: prompt }
];

if (expectJson) {
  messages.push({
    role: 'assistant',
    content: '{'  // Forces Claude to continue JSON
  });
}

const response = await client.messages.create({
  model: modelId,
  max_tokens: maxTokens,
  temperature,
  system: systemPrompt,
  messages
});

let text = response.content[0].type === 'text' ? response.content[0].text : '';

// Re-add prefilled opening brace
if (expectJson) {
  text = '{' + text;
}
```

**Benefit:** Eliminates markdown wrapping issues

---

### ✅ 4. Prompt Caching for Cost Optimization

**V1 Issue:** No caching, repeated system prompts cost money
**V2 Status:** ❌ Not implemented
**Translation:** DIRECT - Enable cache_control

**Update api.ts:**
```typescript
const response = await client.messages.create({
  model: modelId,
  max_tokens: maxTokens,
  temperature,
  system: [
    {
      type: 'text',
      text: SYNTHESIS_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' }  // Cache system prompt
    }
  ],
  messages
});
```

**Cost Savings:**
- System prompt: ~800 tokens
- Without cache: $0.003 per synthesis × 1000 users = $3
- With cache: $0.0003 per synthesis × 1000 users = $0.30
- **Savings: 90% on system prompt costs**

---

### ✅ 5. Few-Shot Examples (Not Negative Constraints)

**V1 Issue:** Negative constraints ("DON'T do X") can backfire
**V2 Status:** ⚠️ Mix of both
**Translation:** ADAPT - Show good examples, remove negative lists

**Current V2 (prompts.ts):**
```typescript
## BANNED - Do NOT Use
❌ Mental health terms: "hyperfixation", "dopamine"...
❌ Vague language: "seems like", "might be"...
```

**Improved V2:**
```typescript
<examples>
<example quality="excellent">
INPUT:
- Track: "Sugar Talking" by Sabrina Carpenter
- 95 plays total
- 71 plays at 1pm (75% consistency)

OUTPUT: {
  "title": "The 'Sugar Talking' 1pm Ritual",
  "finding": "95 plays with 71 at 1pm (75% consistency across 12 days)",
  "context": "Temporal anchoring - using music as emotional marker (Levitin, 2006)",
  "callout": "POV: 1pm hits and your body instinctively reaches for this song"
}
</example>

<example quality="poor_and_why">
OUTPUT: {
  "title": "Obsessive Listener",  // ❌ Generic, no track name
  "finding": "Plays this song a lot",  // ❌ Vague, no numbers
  "callout": "You're obsessed!"  // ❌ Not specific or viral
}
WHY_BAD: No track names, no numbers, generic language
</example>
</examples>
```

---

### ✅ 6. Viral Score Calculation

**V1 Issue:** No pattern prioritization
**V2 Status:** ⚠️ Sorts by confidence × distinctiveness only
**Translation:** ADAPT - Add viral potential scoring

**Add to synthesis/index.ts:**
```typescript
function calculateViralScore(pattern: DetectionResult): number {
  let score = pattern.confidence * pattern.distinctiveness * 10;

  // Boost for extreme values (100%, #1, "only", "every")
  const hasExtreme = pattern.evidence.some(e =>
    /100%|#1|only|every (day|hour|time)|never/i.test(e.humanReadable)
  );
  if (hasExtreme) score += 5;

  // Boost for temporal specificity (times, dates)
  const hasTemporal = pattern.evidence.some(e =>
    /\d+(?:am|pm)|midnight|morning|night|weekend|christmas|week of/i.test(e.humanReadable)
  );
  if (hasTemporal) score += 3;

  // Boost for specific track names (more shareable)
  const hasTrack = pattern.evidence.some(e => e.type === 'track');
  if (hasTrack) score += 2;

  return score;
}

// Sort patterns by viral score before synthesis
const rankedPatterns = patterns
  .map(p => ({ pattern: p, viralScore: calculateViralScore(p) }))
  .sort((a, b) => b.viralScore - a.viralScore)
  .map(x => x.pattern);
```

---

## Non-Translatable (V1-Specific)

### ❌ 1. Psychology Framework for Pattern Discovery

**V1 Need:** Guide Claude to discover patterns using Saarikallio framework
**V2 Reality:** Detectors already have `psychologicalBasis` field
**Translation:** NOT NEEDED - Detectors handle this

**What V2 Already Has:**
```typescript
// From lifeEvent.ts
psychologicalBasis: 'Sudden shifts in listening behavior correlate with life transitions...'

// From ritual.ts
psychologicalBasis: 'Temporal anchoring and ritualistic behavior. Music as temporal marker...'

// From ghostTimeline.ts
psychologicalBasis: 'Emotional disassociation and memory avoidance...'
```

**V2 Adaptation:** Map pattern families to Saarikallio strategies for context

```typescript
function mapPatternFamilyToSaarikallio(family: string): string {
  const mappings: Record<string, string> = {
    'temporal': 'Entertainment | Mental_Work',
    'evolution': 'Diversion | Revival',
    'loyalty_dropoff': 'Diversion',
    'behavioral': 'Solace',
    'loyalty_retention': 'Solace | Entertainment',
  };
  return mappings[family] || 'Entertainment';
}
```

---

### ❌ 2. Rentfrow-Gosling MUSIC Model

**V1 Need:** Map genre preferences to personality dimensions
**V2 Reality:** V2 uses Extended History (no audio features, no genres)
**Translation:** NOT APPLICABLE - V2 focuses on temporal/behavioral patterns

---

### ❌ 3. Artist Recognition Boosting

**V1 Need:** Boost patterns mentioning Taylor Swift, Drake, etc.
**V2 Reality:** Detectors are artist-agnostic, find patterns regardless
**Translation:** OPTIONAL - Could add for viral score, but not core

---

## Recommended Implementation Priority

### P0 (Critical - Do Before First Test)

| Improvement | Effort | Impact | Risk if Skipped |
|-------------|--------|--------|-----------------|
| Zod schemas | 1h | High | Silent failures, generic content |
| Prefilling | 30m | High | Markdown wrapping issues |
| Few-shot examples | 1h | High | Output quality degradation |

### P1 (High Value - Do This Week)

| Improvement | Effort | Impact | Benefit |
|-------------|--------|--------|---------|
| XML structuring | 1h | Medium | Better Claude understanding |
| Prompt caching | 30m | High | 90% cost savings on system prompt |
| Viral score | 1h | Medium | Better pattern prioritization |

### P2 (Nice to Have)

| Improvement | Effort | Impact | Benefit |
|-------------|--------|--------|---------|
| Saarikallio mapping | 30m | Low | Richer context |
| Error taxonomy | 2h | Medium | Better debugging |

---

## Key Differences in Approach

### V1: Discovery-Focused
```
Raw Stats → Claude + Psychology Framework → Patterns
              ↑
        (Needs strong guidance)
```

### V2: Narration-Focused
```
Raw Data → Detectors + Evidence Chains → Patterns → Claude → Narratives
                                                        ↑
                                              (Just format & contextualize)
```

**Implication:** V2 prompts should emphasize **accurate narration** over **constrained discovery**

---

## Synthesis Prompt Comparison

### V1 Approach (Discovery)
```typescript
<theoretical_framework>
EMOTIONAL_REGULATION (Saarikallio):
- Entertainment: Mood maintenance
- Revival: Energy boost
...
</theoretical_framework>

<output_requirements>
You MUST identify patterns that match these frameworks...
</output_requirements>
```

### V2 Approach (Narration)
```typescript
<role>
You are narrating pre-detected patterns.
Patterns have already been found by deterministic algorithms.
</role>

<your_job>
1. Format pattern into viral label
2. Cite exact evidence provided
3. Explain using psychologicalBasis from pattern
</your_job>

<critical_constraint>
ONLY mention artists, tracks, numbers, times from evidence.
If not in evidence, DO NOT invent it.
</critical_constraint>
```

---

## Summary: What to Implement

### Must-Have (P0)
1. ✅ **Zod schemas** - Runtime validation, fail loudly
2. ✅ **Prefilling** - Guaranteed JSON structure
3. ✅ **Few-shot examples** - Remove negative constraints

### High-Value (P1)
4. ✅ **XML structuring** - Better Claude understanding
5. ✅ **Prompt caching** - 90% cost savings
6. ✅ **Viral score** - Pattern prioritization

### Optional (P2)
7. ⚠️ **Saarikallio mapping** - Enrich context (low priority)
8. ⚠️ **Error taxonomy** - Better debugging (nice to have)

**Next Step:** Implement P0 improvements, then test hallucination detection
