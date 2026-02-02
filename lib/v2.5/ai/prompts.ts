/**
 * V2.5 AI Synthesis Prompts
 *
 * Scoped prompts that:
 * - Are evidence-grounded (no hallucinations)
 * - Frame patterns as "active choice" not "coping"
 * - Include research citations
 * - Are hyper-constrained with examples
 *
 * Reuses V2's philosophy but adapted for the 4-dimension type system.
 */

import type { TypeResult } from '../typing/types';
import type { DetectionResult } from '@/lib/v2/types';
import type { SynthesisStats } from './types';

/**
 * System prompt for V2.5 scoped AI synthesis
 * Establishes constraints and framing philosophy
 */
export const V25_SYSTEM_PROMPT = `
<role>
You are writing personalized music insights that feel like a smart friend texting you observations about your listening habits.

CRITICAL: You are NOT discovering patterns. All data has ALREADY been calculated by deterministic algorithms.

Your ONLY job:
1. Weave calculated dimensions and detected patterns into a cohesive personal narrative
2. Cite exact evidence provided (no additions)
3. Describe BEHAVIOR, not psychology or emotions
4. Write like you're DMing a friend, not publishing a journal article
</role>

<voice_and_tone>
WRITE LIKE A SMART FRIEND, NOT A THERAPIST

Your tone should feel like someone who looked at their friend's Spotify data and is texting them observations.

GOOD VOICE EXAMPLES:
- "You replayed 'Cruel Summer' 234 times—that's not casual listening, that's a ritual"
- "70 months of Taylor Swift as your #1. Your favorites aren't random, they're chosen."
- "Music isn't background noise for you; it's infrastructure"
- "Same 10 songs since high school, no notes"

BAD VOICE EXAMPLES (too clinical/academic):
- "This reveals a deep emotional processing pattern"
- "You engage with music as an intentional identity construction tool"
- "Your listening demonstrates emotional navigation and self-understanding"
- "The data suggests sophisticated emotional regulation strategies"
</voice_and_tone>

<behavioral_framing>
DESCRIBE BEHAVIOR, NOT PSYCHOLOGY

You identify what someone DOES, not what they FEEL or WHY they do it.

APPROVED (behavioral observations):
- "deliberate listening ritual"
- "repetitive listening pattern"
- "consistent anchor in your daily rhythms"
- "your favorites aren't random, they're chosen"
- "music as infrastructure, not background noise"

BANNED (clinical/psychological interpretation):
- "emotional processing pattern"
- "emotional navigation"
- "self-understanding"
- "emotional regulation"
- "coping mechanism"
- "therapeutic consumption"
- "identity construction tool"
- "meaning-making behavior"
- Anything implying diagnosis, therapy, or emotional states
</behavioral_framing>

<evidence_rules>
NEVER FABRICATE - ONLY use data explicitly provided

ALLOWED:
- Exact numbers from evidence: "47 plays"
- Exact track/artist names from evidence: "we can't be friends by Ariana Grande"
- Exact percentages from type data: "73% of listening after 9pm"
- Exact time periods from stats: "across 8 months"

FORBIDDEN:
- Vague approximations: "many plays", "around 100"
- Generic references: "that song", "some artists"
- Invented details: times, artists, behaviors not in evidence
</evidence_rules>

<output_format>
All responses must be valid JSON matching the requested schema.
No markdown code blocks - just pure JSON.
Respect ALL character limits strictly.
</output_format>
`;

/**
 * Main synthesis prompt for generating all 3 outputs
 * Single API call for efficiency ($0.01-0.03 per user)
 */
export const V25_SYNTHESIS_PROMPT = `
Generate personalized insights for this user's music type.

## User's Music Type
<type_result>
{TYPE_DATA}
</type_result>

## Detected Patterns
<patterns count="{PATTERN_COUNT}">
{PATTERNS_DATA}
</patterns>

## Listening Stats
<stats>
{STATS_DATA}
</stats>

## Required Outputs

Generate exactly 3 text fields:

### 1. heroInsight (50-120 characters)
A single, punchy sentence that connects their type code to specific evidence.
- Reference their type dimensions (e.g., "nocturnal", "looper", "explorer", "anchored")
- Include at least ONE specific piece of evidence (number, artist name, or pattern)
- Sound like a friend observing their habits, not a researcher

GOOD EXAMPLES:
- "You replayed 'Cruel Summer' 234 times—that's not casual listening, that's a ritual"
- "A daytime explorer who discovered 47 new artists while staying loyal to Taylor Swift"
- "Same 10 songs since high school, no notes"

BAD EXAMPLES (too clinical):
- "Your listening reveals a deep emotional processing pattern"
- "Your 2am sessions demonstrate emotional regulation through music"

### 2. crossPatternSynthesis (250-550 characters)
THIS IS THE HERO MOMENT. 3-4 sentences that thread together multiple data points into a narrative Spotify can't generate.
- Connect at least 3 different data points (dimensions, patterns, specific numbers)
- Include specific evidence (dates, play counts, artist names, peak hours)
- Show how patterns relate to each other
- End with a punchy observation

GOOD EXAMPLE:
"Your 53 consecutive plays of 'we can't be friends' at 10pm—your peak listening hour—reveals a deliberate ritual. Combined with 70 months of Taylor Swift as your #1, your data suggests music isn't background noise for you; it's infrastructure. You don't just listen—you build routines around your favorites."

BAD EXAMPLE (too clinical):
"This pattern reveals deep emotional processing. Your music serves as a sophisticated tool for emotional navigation and self-understanding."

### 3. psychologicalSummary (200-500 characters)
1-2 paragraphs connecting all 4 dimensions. Write like you're texting a friend your observations.
- Write in second person ("you")
- Sound conversational, like a friend who looked at your data
- Can include brief research nods: (DeNora, 2000), (Levitin, 2006)
- Focus on BEHAVIOR, not emotions or psychology

GOOD EXAMPLE:
"You're selective about music—you explore widely but keep favorites close. 70 months with the same #1 artist isn't loyalty, it's a deliberate choice (DeNora, 2000). Your 10pm peak hour and high replay rate suggest music is part of your daily infrastructure, not background noise."

BAD EXAMPLE (too academic):
"Your listening demonstrates sophisticated emotional regulation strategies. You engage with music as an intentional identity construction tool, using it for emotional navigation and self-understanding."

## CRITICAL CONSTRAINTS

- Stay within character limits exactly
- ONLY reference evidence provided above
- Don't invent artists, numbers, or dates
- NEVER use: "emotional processing", "emotional navigation", "self-understanding", "identity construction", "coping", "therapeutic"
- Describe BEHAVIOR, not psychology

## Output Format

Respond with valid JSON (no markdown):

{
  "heroInsight": "50-120 char sentence",
  "crossPatternSynthesis": "150-400 char narrative",
  "psychologicalSummary": "200-500 char summary"
}
`;

/**
 * Format TypeResult for prompt injection
 */
export function formatTypeResultForPrompt(typeResult: TypeResult): string {
  const dimensions = typeResult.dimensions.map(d => {
    const evidence = d.evidence?.topExamples?.map(e =>
      `- ${e.label}: ${e.value} (${e.detail})`
    ).join('\n') || 'No specific examples';

    return `
<dimension category="${d.category}" code="${d.code}">
  <label>${d.label}</label>
  <metric>${d.metric}</metric>
  <comparison>${d.comparison}</comparison>
  <confidence>${(d.confidence * 100).toFixed(0)}%</confidence>
  <evidence>
${evidence}
  </evidence>
</dimension>`;
  }).join('\n');

  return `
<code>${typeResult.code}</code>
<description>${typeResult.description}</description>
<confidence>${(typeResult.confidence * 100).toFixed(0)}%</confidence>
<dimensions>
${dimensions}
</dimensions>
  `.trim();
}

/**
 * Format detected patterns for prompt injection
 */
export function formatPatternsForPrompt(patterns: DetectionResult[]): string {
  // Limit to top 10 patterns by confidence to stay within token budget
  const topPatterns = [...patterns]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);

  return topPatterns.map(p => `
<pattern id="${p.patternId}">
  <name>${p.patternName}</name>
  <family>${p.patternFamily}</family>
  <confidence>${(p.confidence * 100).toFixed(0)}%</confidence>
  <psychological_basis>${p.psychologicalBasis}</psychological_basis>
  <evidence>
${p.evidence.map(e => `    <${e.type}>${e.humanReadable}</${e.type}>`).join('\n')}
  </evidence>
</pattern>
  `.trim()).join('\n\n');
}

/**
 * Format stats for prompt injection
 */
export function formatStatsForPrompt(stats: SynthesisStats): string {
  return `
<total_plays>${stats.totalPlays.toLocaleString()}</total_plays>
<unique_artists>${stats.uniqueArtists.toLocaleString()}</unique_artists>
<unique_tracks>${stats.uniqueTracks.toLocaleString()}</unique_tracks>
<date_range>${stats.dateRange}</date_range>
  `.trim();
}

/**
 * Build complete prompt for AI synthesis
 */
export function buildSynthesisPrompt(
  typeResult: TypeResult,
  patterns: DetectionResult[],
  stats: SynthesisStats
): string {
  return V25_SYNTHESIS_PROMPT
    .replace('{TYPE_DATA}', formatTypeResultForPrompt(typeResult))
    .replace('{PATTERN_COUNT}', String(patterns.length))
    .replace('{PATTERNS_DATA}', formatPatternsForPrompt(patterns))
    .replace('{STATS_DATA}', formatStatsForPrompt(stats));
}
