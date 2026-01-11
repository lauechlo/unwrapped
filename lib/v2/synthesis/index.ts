/**
 * V2 Synthesis Engine
 * Generates narrative synthesis from detected patterns
 *
 * ARCHITECTURE:
 * 1. Detectors find patterns with evidence chains (deterministic)
 * 2. Synthesis layer narrates patterns (Claude-powered)
 * 3. Validation layer prevents hallucinations (evidence allowlist)
 */

import { DetectionResult } from '../types';
import {
  SynthesisOutput,
  HeroInsight,
  PatternNarrative,
  PatternNarrativeSchema,
  HeroInsightSchema,
} from './types';
import {
  buildEvidenceAllowlist,
  validateAndLog,
} from './validation';
import { callClaude } from './api';
import {
  PATTERN_NARRATIVE_PROMPT,
  HERO_INSIGHT_PROMPT,
  PSYCHOLOGICAL_SUMMARY_PROMPT,
  formatPatternForPrompt,
  formatAllPatternsForPrompt,
} from './prompts';

/**
 * Generate narrative synthesis from detected patterns
 *
 * @param patterns - Detected patterns with evidence chains
 * @param maxNarratives - Maximum number of pattern narratives to generate (default 8)
 * @returns Synthesized narratives with validation
 */
export async function synthesizePatterns(
  patterns: DetectionResult[],
  maxNarratives: number = 8
): Promise<SynthesisOutput> {
  if (!patterns || patterns.length === 0) {
    throw new Error('No patterns provided for synthesis');
  }

  console.log(`[V2 Synthesis] Starting synthesis for ${patterns.length} patterns`);

  // ========================================
  // 1. Build Evidence Allowlist (Ground Truth)
  // ========================================
  console.log('[V2 Synthesis] Building evidence allowlist...');
  const allowlist = buildEvidenceAllowlist(patterns);

  console.log(`[V2 Synthesis] Allowlist built:`);
  console.log(`  - ${allowlist.artists.size} artists`);
  console.log(`  - ${allowlist.tracks.size} tracks`);
  console.log(`  - ${allowlist.numbers.size} numbers`);
  console.log(`  - ${allowlist.dates.size} dates`);
  console.log(`  - ${allowlist.patterns.size} patterns`);

  // ========================================
  // 2. Select Patterns for Narratives
  // ========================================
  // Take top N by combined score (confidence × distinctiveness)
  const topPatterns = patterns
    .sort((a, b) => {
      const scoreA = a.confidence * a.distinctiveness;
      const scoreB = b.confidence * b.distinctiveness;
      return scoreB - scoreA;
    })
    .slice(0, maxNarratives);

  console.log(`[V2 Synthesis] Selected ${topPatterns.length} patterns for narratives:`);
  topPatterns.forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.patternFamily}] ${p.patternName}`);
  });

  // ========================================
  // 3. Generate Pattern Narratives (One at a Time)
  // ========================================
  console.log('[V2 Synthesis] Generating pattern narratives (sequential)...');

  // Generate narratives one at a time to avoid Haiku refusal
  const narrativePromises = topPatterns.map(async (pattern, i) => {
    console.log(`[V2 Synthesis] Generating narrative ${i + 1}/${topPatterns.length}...`);

    const singlePrompt = `
Generate a narrative for this detected pattern:

${formatPatternForPrompt(pattern)}

Return ONLY a JSON object with this structure (not wrapped in an array):

{
  "title": "Professional pattern label with artist/track names",
  "finding": "Core finding with exact numbers from evidence - BE DETAILED! Include specific track names in quotes, exact play counts, percentages, dates/times",
  "context": "Psychological interpretation based on psychologicalBasis - explain what this pattern reveals about their relationship with music",
  "callout": "Clear insight statement that references specific evidence in formal language"
}

REQUIREMENTS FOR RICH EVIDENCE WITH TEMPORAL CITATIONS:
1. **FINDING** field MUST include:
   - Specific track names in quotes when available (e.g., "Make It To Christmas")
   - Exact numbers from evidence (e.g., "47 plays", "89% completion rate", "3 weeks")
   - **CONVERT TECHNICAL STATS TO HUMAN-READABLE**:
     * Seconds → "X hours" or "X minutes" (e.g., "1587s between plays" → "26 minutes between plays")
     * Large minute counts → hours (e.g., "1375 minutes" → "23 hours")
     * Show both if helpful (e.g., "53 plays = 23 hours of listening")
   - Artist names when relevant
   - **TEMPORAL CITATIONS**: Extract and cite ALL dates, times, weeks, months from evidence
     * If evidence says "Week of Oct 27" → cite it: "during the week of Oct 27"
     * If evidence says "5pm" or "at 5pm" → cite it: "mostly at 5pm"
     * If evidence says "Last heard: Nov 15" → cite it: "last played Nov 15"
     * If evidence has month/week ranges → cite them
   - Calculate and cite percentages/ratios
   - Example with temporal citations: "53 consecutive plays = 23 hours of listening during Mar 17, 2024, mostly between 9-11pm"

2. **CONTEXT** field should:
   - **START with DeNora (2000) if applicable** - "Active music engagement as identity construction (DeNora, 2000)"
   - Then reference other psychologicalBasis research (Saarikallio, Levitin)
   - Explain the behavior pattern clearly as INTENTIONAL choice
   - Frame as identity construction, not emotional recovery
   - Keep accessible, not academic

3. **CALLOUT** should be specific and reference actual evidence with formal tone:
   - 🚨 MUST BE UNDER 150 CHARACTERS (strict limit - will fail validation if longer)
   - CRITICAL: Frame as ACTIVE CHOICE, not passive coping or pathology
   - Good: "This pattern demonstrates intentional engagement through repetitive listening"
   - Good: "Active temporal anchoring as daily routine marker"
   - Bad: "You really like this song"
   - Bad: "This shows you're using music to cope"
   - Bad: Any language suggesting diagnosis, therapy, or emotional crisis
   - Bad: Any callout over 150 characters

🚨🚨🚨 CRITICAL ANTI-HALLUCINATION RULES 🚨🚨🚨:
1. ONLY use artist names EXACTLY as they appear in evidence - DO NOT guess variations
2. ONLY use track names EXACTLY as they appear in evidence - DO NOT invent similar-sounding tracks
3. If evidence says "Taylor Swift: 41 plays" → use ONLY "Taylor Swift", do NOT mention specific track names unless explicitly listed
4. If you're not 100% certain a track/artist is in the evidence → DO NOT include it
5. When in doubt, use GENERAL language ("this artist", "these tracks") instead of making up names
6. Numbers, dates, times must come DIRECTLY from evidence - no estimation

SCHEMA REQUIREMENTS:
- Title: 10-80 chars, must include number or name
- Finding: 20-300 chars
- Context: 20-400 chars
- Callout: 10-150 chars (STRICT - will fail if longer)

`;

    try {
      const response = await callClaude(singlePrompt, {
        maxTokens: 800,
        expectJson: true,
        model: 'haiku',
      });

      const rawData = JSON.parse(response);
      return { pattern, rawData, index: i };
    } catch (error) {
      console.error(`[V2 Synthesis] Failed to generate narrative ${i + 1}:`, error);
      return { pattern, rawData: null, index: i };
    }
  });

  // Wait for all narratives to generate
  const narrativeResults = await Promise.all(narrativePromises);

  // Build PatternNarrative objects with Zod validation + evidence validation
  const narratives: PatternNarrative[] = [];

  for (const { pattern, rawData, index } of narrativeResults) {
    if (!rawData) {
      console.warn(`[V2 Synthesis] Missing narrative data for pattern ${index}`);
      continue;
    }

    // Validate against Zod schema (runtime type checking)
    const zodResult = PatternNarrativeSchema.safeParse(rawData);

    if (!zodResult.success) {
      console.error(`[V2 Synthesis] ⚠️ Schema validation failed for pattern ${index}:`, zodResult.error.flatten());
      continue; // Skip invalid narratives
    }

    const data = zodResult.data;

    const narrative: PatternNarrative = {
      patternId: pattern.patternId,
      patternFamily: pattern.patternFamily,
      title: data.title,
      finding: data.finding,
      context: data.context,
      callout: data.callout,
      confidence: pattern.confidence,
      evidenceSummary: pattern.evidence.map(e => e.humanReadable),
    };

    // Validate against evidence allowlist (hallucination detection)
    const isValid = validateAndLog(narrative, allowlist, narrative.title);

    if (isValid) {
      narratives.push(narrative);
    } else {
      console.error(`[V2 Synthesis] ⚠️ REJECTED hallucinated narrative: "${narrative.title}"`);
      // Don't include hallucinated narratives
    }
  }

  console.log(`[V2 Synthesis] Generated ${narratives.length} valid narratives`);

  // ========================================
  // 4. Generate Hero Insight
  // ========================================
  console.log('[V2 Synthesis] Generating hero insight...');

  // Select hero pattern (highest confidence)
  const heroPattern = patterns[0];

  const heroPrompt = HERO_INSIGHT_PROMPT
    .replace('{ALL_PATTERNS}', formatAllPatternsForPrompt(patterns.slice(0, 5)));

  const heroResponse = await callClaude(heroPrompt, {
    maxTokens: 400,
    expectJson: true,
    model: 'haiku',
  });

  const rawHeroData = JSON.parse(heroResponse);

  // Validate against Zod schema
  const heroZodResult = HeroInsightSchema.safeParse(rawHeroData);

  if (!heroZodResult.success) {
    console.error('[V2 Synthesis] ⚠️ Hero insight schema validation failed:', heroZodResult.error.flatten());
    throw new Error('Hero insight failed validation');
  }

  const heroData = heroZodResult.data;
  const heroInsight: HeroInsight = {
    headline: heroData.headline,
    subtext: heroData.subtext,
    patternId: heroData.patternId || heroPattern.patternId,
  };

  console.log(`[V2 Synthesis] Hero insight: "${heroInsight.headline}"`);

  // ========================================
  // 5. Generate Psychological Summary
  // ========================================
  console.log('[V2 Synthesis] Generating psychological summary...');

  const summaryPrompt = PSYCHOLOGICAL_SUMMARY_PROMPT
    .replace('{ALL_PATTERNS}', formatAllPatternsForPrompt(patterns));

  const psychologicalSummary = await callClaude(summaryPrompt, {
    maxTokens: 600,
    expectJson: false, // Plain text
    model: 'haiku',
  });

  console.log('[V2 Synthesis] Psychological summary generated');

  // ========================================
  // 6. Return Synthesis Output
  // ========================================

  return {
    heroInsight,
    narratives,
    psychologicalSummary,
  };
}
