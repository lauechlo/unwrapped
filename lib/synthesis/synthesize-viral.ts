/**
 * Viral Synthesis Logic - V3
 * Generates hero insight, pattern cards, and listening DNA with viral labels
 */

import { callClaude } from '@/lib/claude/api';
import { groupPatternsByDimension, selectHeroPattern, parsePatternCard, formatPatternForPrompt, formatPatternsForPrompt } from './helpers';
import type { DetectionResult, SynthesisOutput, PatternCard, HeroInsight, ListeningDNA } from './types';

/**
 * Generate viral synthesis from patterns
 */
export async function synthesizeInsights(
  patterns: DetectionResult[]
): Promise<SynthesisOutput> {
  if (!patterns || patterns.length === 0) {
    throw new Error('No patterns provided for synthesis');
  }

  console.log(`[Synthesis] Processing ${patterns.length} patterns with viral labels`);

  // Group patterns by dimension
  const grouped = groupPatternsByDimension(patterns);
  console.log(`[Synthesis] Grouped into ${grouped.length} dimensions`);

  // Select hero pattern and top patterns for context
  const heroPattern = selectHeroPattern(patterns);
  const topPatterns = patterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  console.log(`[Synthesis] Hero pattern: ${heroPattern.patternName}`);

  // ========================================
  // 1. Generate Pattern Cards (viral labels)
  // ========================================
  console.log('[Synthesis] Generating pattern cards with viral labels...');

  const patternCardPromises = topPatterns.map(async (pattern) => {
    const prompt = `
Analyze this pattern and create a viral, screenshot-worthy pattern card.

## Pattern Data

${formatPatternForPrompt(pattern)}

## Requirements

1. **VIRAL LABEL** - Must include artist/track names + Gen Z slang
2. **CITE 5-7 TRACK/ARTIST NAMES** from the evidence
3. **EVERY claim needs NUMBERS** from the evidence
4. **PUNCHY CALLOUT** - Use POV format or relatable Gen Z statement

## Output Format

PATTERN: The [Specific Artist/Track] [Viral Phrase]
├─ CORE: [Primary finding with specific evidence and numbers]
├─ SUPPORTING: [Secondary evidence with artist/track names]
└─ BEHAVIOR: [What this reveals about how they use music]

*[Punchy callout in italics using POV/Gen Z format]*

Example:
PATTERN: The "Make It To Christmas" Disorder
├─ CORE: #1 current, #2 six-month, #5 all-time (avg rank 2.7)
├─ SUPPORTING: Sabrina Carpenter has you in a complete chokehold
└─ BEHAVIOR: When one holiday song becomes year-round emotional support

*This is what happens when a song becomes your entire personality*
`;

    const response = await callClaude(prompt, { maxTokens: 400 });
    return parsePatternCard(response, pattern.confidence);
  });

  const patternCards = await Promise.all(patternCardPromises);
  console.log(`[Synthesis] Generated ${patternCards.length} pattern cards`);

  // ========================================
  // 2. Generate Hero Insight
  // ========================================
  console.log('[Synthesis] Generating hero insight...');

  const heroPrompt = `
Based on these detected patterns, generate a "hero insight" - the single most striking observation.

## Detected Patterns

PRIMARY PATTERN (highest confidence):
${JSON.stringify({
  name: heroPattern.patternName,
  confidence: heroPattern.confidence,
  dimension: heroPattern.psychologicalDimension,
  evidence: heroPattern.evidence.map(e => e.humanReadable)
}, null, 2)}

SUPPORTING PATTERNS:
${JSON.stringify(
  topPatterns.slice(1).map(p => ({
    name: p.patternName,
    confidence: p.confidence,
    dimension: p.psychologicalDimension,
    keyEvidence: p.evidence.map(e => e.humanReadable).slice(0, 3)
  })), null, 2
)}

## Requirements

You MUST:
1. Reference SPECIFIC evidence from patterns above (track names, numbers, pattern names)
2. Connect multiple patterns to show the full story
3. Make it feel personally targeted, not generic
4. Be direct and occasionally provocative
5. Use Gen Z slang and viral language

## Output Structure

**1. HEADLINE** (5-10 words) - Direct, memorable, screenshot-worthy

Examples:
- "POV: You don't listen to music. You use it."
- "Your Spotify is basically therapy (but make it Sabrina Carpenter)"
- "You're in your [Artist] era and it shows"

**2. SUBTEXT** (2-3 sentences) - MUST include specific tracks, numbers, patterns

Example: "'Make It To Christmas' has you in a chokehold (#1 current, #2 six-month, #5 all-time). Meanwhile 'Guilty as Sin?' sits vaulted alongside 16 other abandoned top-20 tracks. You're capable of sustained attachment - but only to songs that feel safe."

## Output Format

Respond ONLY with valid JSON:

{
  "headline": "Your viral headline here",
  "subtext": "Your subtext with specific tracks, numbers, and viral language."
}

Do not include any text before or after the JSON.
`;

  const heroResponse = await callClaude(heroPrompt, { expectJson: true, maxTokens: 500 });
  const heroInsight: HeroInsight = JSON.parse(heroResponse);

  console.log('[Synthesis] Hero insight generated:', heroInsight.headline);

  // ========================================
  // 3. Generate Listening DNA
  // ========================================
  console.log('[Synthesis] Generating listening DNA...');

  const dnaPrompt = `
Based on detected patterns, generate a "Listening DNA" profile with dimensional labels.

## All Detected Patterns

${formatPatternsForPrompt(patterns)}

## Dimensions

1. **Temporal Pattern** - When/how they listen (use viral labels)
2. **Emotional Strategy** - How they use music emotionally (use viral labels)
3. **Discovery Mode** - Exploration vs. loyalty (use viral labels)
4. **Attachment Style** - How they relate to artists/tracks (use viral labels)

## Label Requirements

- Use Gen Z slang and specific artist/track names where possible
- Include numbers in evidence
- Make labels screenshot-worthy

## Output Format

{
  "temporalPattern": {
    "label": "4/4 Sunday Ritual Energy",
    "evidence": "82% of recent plays during 6am-12pm (18 morning vs 4 evening plays)."
  },
  "emotionalStrategy": {
    "label": "Sabrina Carpenter Comfort Rotation",
    "evidence": "'Make It To Christmas' anchors across all periods (#1 current, #2 six-month, #5 all-time)."
  },
  "discoveryMode": {
    "label": "The 6-Artist Loyalist",
    "evidence": "Ariana, Taylor, Sabrina, Lana, PinkPantheress, FLETCHER constant across ALL time ranges."
  },
  "attachmentStyle": {
    "label": "The Vault Hunter (17-Track Edition)",
    "evidence": "17 tracks from all-time top 20 now in witness protection."
  }
}

If no pattern detected for a dimension, use: {"label": "Insufficient Data", "evidence": "Need more listening history."}

Respond ONLY with valid JSON. Do not include any text before or after the JSON.
`;

  const dnaResponse = await callClaude(dnaPrompt, { expectJson: true, maxTokens: 600 });
  const listeningDNA: ListeningDNA = JSON.parse(dnaResponse);

  console.log('[Synthesis] Listening DNA generated');

  // ========================================
  // Return synthesized insights
  // ========================================

  return {
    heroInsight,
    patternCards,
    listeningDNA
  };
}
