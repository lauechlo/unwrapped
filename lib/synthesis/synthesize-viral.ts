/**
 * Viral Synthesis Logic - V3
 * Generates hero insight, pattern cards, and listening DNA with viral labels
 */

import { callClaude } from '@/lib/claude/api';
import { groupPatternsByDimension, selectHeroPattern, parsePatternCard, formatPatternForPrompt, formatPatternsForPrompt, deduplicatePatterns, normalizeSlashes } from './helpers';
import { validateAndLog } from './validation';
import type { DetectionResult, SynthesisOutput, PatternCard, HeroInsight, ListeningDNA } from './types';

/**
 * Deduplicate pattern cards based on label similarity
 * Prevents showing cards with similar viral names like "Make It To Christmas Disorder" and "Make It To Christmas Stranglehold"
 */
function deduplicateCardLabels(cards: PatternCard[]): PatternCard[] {
  const deduplicated: PatternCard[] = [];

  for (const card of cards) {
    // Extract key phrases from label (track/artist names in quotes or capitalized)
    const labelLower = card.patternLabel.toLowerCase();
    const keyPhrases = [
      ...Array.from(labelLower.matchAll(/"([^"]+)"/g)).map(m => m[1]),
      ...Array.from(labelLower.matchAll(/the ([a-z\s]+) (?:disorder|syndrome|era|energy|vibes?|phase)/g)).map(m => m[1]),
    ];

    // Check if this card shares key phrases with existing cards
    const isDuplicate = deduplicated.some(existing => {
      const existingLower = existing.patternLabel.toLowerCase();
      const existingPhrases = [
        ...Array.from(existingLower.matchAll(/"([^"]+)"/g)).map(m => m[1]),
        ...Array.from(existingLower.matchAll(/the ([a-z\s]+) (?:disorder|syndrome|era|energy|vibes?|phase)/g)).map(m => m[1]),
      ];

      // If they share ANY quoted phrase, consider duplicate
      return keyPhrases.some(phrase =>
        existingPhrases.some(existing =>
          phrase.includes(existing) || existing.includes(phrase)
        )
      );
    });

    if (!isDuplicate) {
      deduplicated.push(card);
    } else {
      console.log(`[Label Dedup] Skipping "${card.patternLabel}" (similar to existing card)`);
    }
  }

  return deduplicated;
}

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

  // Deduplicate patterns with overlapping evidence
  const deduplicatedPatterns = deduplicatePatterns(patterns);

  const topPatterns = deduplicatedPatterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8); // Show up to 8 cards

  console.log(`[Synthesis] Hero pattern: ${heroPattern.patternName}`);

  // ========================================
  // 1. Generate Pattern Cards (viral labels) - BATCHED
  // ========================================
  console.log('[Synthesis] Generating pattern cards with viral labels (batched)...');

  // BATCH all pattern cards into ONE API call for efficiency
  const batchPrompt = `
Analyze these ${topPatterns.length} patterns and create viral, screenshot-worthy pattern cards for each.

## All Patterns

${topPatterns.map((pattern, i) => `
### PATTERN ${i + 1}: ${pattern.patternName}
DIMENSION: ${pattern.psychologicalDimension}
${formatPatternForPrompt(pattern)}
`).join('\n')}

## Requirements for EACH card

1. **VIRAL LABEL** - Make it screenshot-worthy + Gen Z slang
   - For ARTIST/TRACK patterns → Include specific names (e.g., "The Sabrina Carpenter Chokehold")
   - For GENRE patterns → Focus on sonic/vibe (e.g., "Pop Girl Autumn Aura")
   - For TIME patterns → Emphasize when/ritual (e.g., "4AM Sad Girl Hours")
   - For BEHAVIOR patterns → Highlight the action (e.g., "Vaulted Songs Commitment Issues")
   - VARY the style - don't make every label about artists!

2. **CITE SPECIFIC EVIDENCE** - Use track/artist names, numbers, percentages
3. **EVERY claim needs NUMBERS** from the evidence
4. **PUNCHY CALLOUT** - Use POV format or relatable Gen Z statement
5. **RAW EVIDENCE** - Go ONE level deeper than summary with granular details:
   - Include actual track names with play counts
   - Add sample timestamps when available (e.g., "last played: Dec 24, 2:47am")
   - Show the math/calculations behind percentages
   - List specific tracks, not just summaries
   - DO NOT just repeat what's in CORE/SUPPORTING - add new details!

## Label Style Examples

Artist-focused: "The [Artist] Loyalty Chokehold"
Track-focused: "The '[Song Title]' Disorder"
Time-focused: "4AM Sad Girl Hours" or "The Weekend (Not Weeknd) Energy"
Genre-focused: "Pop Girl Falling" or "The Hyperpop Escape Pod" or "[Number]-Genre Commitment Issues" 
Behavior-focused: "Your [Number] Tracks Miss You" or "You Went to Get Milk (And Forgot About [Track])" or "Performative Era" or "Not A Chill Guy" 

## Output Format

For EACH pattern, output:

PATTERN: [Viral Label - MATCH THE PATTERN'S FOCUS]
├─ KEY FINDING: [Primary finding with specific evidence and numbers]
├─ WHY: [Secondary evidence with details]
└─ WHAT IT MEANS: [What this reveals about how they use music]

*[Punchy callout in italics using POV/Gen Z format]*

RAW EVIDENCE:
- [Detailed line 1 with track names, play counts, timestamps]
- [Detailed line 2 with calculations/math behind the claims]
- [Detailed line 3 with specific examples not in summary]

---

Example (Artist-focused):
PATTERN: The "Make It To Christmas" Disorder
├─ KEY FINDING: #1 current, #2 six-month, #5 long-term (avg rank 2.7)
├─ WHY: Sabrina Carpenter has you in a complete chokehold
└─ WHAT IT MEANS: When one holiday song becomes year-round emotional support

*This is what happens when a song becomes your entire personality*

RAW EVIDENCE:
- "Make It To Christmas" by Alessia Cara: 47 total plays across all periods
- Last played: Dec 24, 2:47am (part of late-night listening pattern)
- Rank calculation: (1 + 2 + 5) / 3 = 2.7 average rank
- Appears in 100% of time periods analyzed (current, 6-month, long-term)
- Play frequency: 12 plays in last 4 weeks, 8 plays in 6-month period

---

Example (Time-focused):
PATTERN: 4AM Sad Girl Hours
├─ KEY FINDING: 67% of plays between midnight-4am (34 night vs 16 day plays)
├─ WHY: Lana Del Rey, Billie Eilish, and Phoebe Bridgers dominate late-night rotation
└─ WHAT IT MEANS: Using music as emotional regulation during peak vulnerability hours

*POV: Sleep is for people who don't have feelings to process*

RAW EVIDENCE:
- Night plays: 34 total (midnight-4am window)
- Day plays: 16 total (6am-6pm window)
- Calculation: 34 / (34 + 16) = 68% night concentration
- Top late-night tracks: "The Night We Met" (8 plays), "Motion Sickness" (6 plays), "Ocean Eyes" (5 plays)
- Peak listening hour: 2-3am (12 plays in this hour alone)

---

IMPORTANT: Make sure labels are DIVERSE across the ${topPatterns.length} cards. Don't make every single one about artists - vary between artist, genre, time, and behavior patterns!

Generate ${topPatterns.length} pattern cards separated by "---".
`;

  // Use SONNET for quality (v1 first impressions matter!)
  const batchResponse = await callClaude(batchPrompt, {
    maxTokens: 3000,
    model: 'sonnet' // Quality over cost for v1
  });

  // Parse all cards from batched response
  const cardSections = batchResponse.split('---').filter(s => s.trim());
  const patternCards = cardSections
    .map((section, i) => {
      const pattern = topPatterns[i];
      if (!pattern) return null;

      const card = parsePatternCard(
        section,
        pattern.confidence,
        pattern.evidence.map(e => e.humanReadable),
        pattern.psychologicalDimension
      );

      // Validate card against evidence to catch hallucinations
      if (card) {
        const isValid = validateAndLog(
          card,
          pattern.evidence.map(e => e.humanReadable),
          card.patternLabel
        );

        if (!isValid) {
          console.error(`[Synthesis] ⚠️ REJECTED hallucinated card: "${card.patternLabel}"`);
          return null; // Reject hallucinated cards
        }
      }

      return card;
    })
    .filter((card): card is NonNullable<typeof card> => {
      // Only keep valid cards
      return card !== null &&
             !!card.patternLabel &&
             !!card.core &&
             !!card.supporting &&
             !!card.behavior;
    });

  console.log(`[Synthesis] Generated ${patternCards.length} pattern cards (batched)`);

  // Deduplicate pattern cards based on labels (catch similar viral names)
  const deduplicatedCards = deduplicateCardLabels(patternCards);
  if (deduplicatedCards.length < patternCards.length) {
    console.log(`[Synthesis] Deduplicated ${patternCards.length} cards to ${deduplicatedCards.length} based on labels`);
  }

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

Example: "'Make It To Christmas' has you in a chokehold (#1 current, #2 six-month, #5 long-term). Meanwhile 'Guilty as Sin?' sits vaulted alongside 16 other abandoned favorites. You're capable of sustained attachment - but only to songs that feel safe."

## Output Format

Respond ONLY with valid JSON:

{
  "headline": "Your viral headline here",
  "subtext": "Your subtext with specific tracks, numbers, and viral language."
}

Do not include any text before or after the JSON.
`;

  // Use SONNET for hero insight (this is the first thing users see - keep quality!)
  const heroResponse = await callClaude(heroPrompt, {
    expectJson: true,
    maxTokens: 500,
    model: 'sonnet' // Quality matters here!
  });
  const rawHeroInsight: HeroInsight = JSON.parse(heroResponse);

  // Normalize slashes for better text wrapping
  const heroInsight: HeroInsight = {
    headline: normalizeSlashes(rawHeroInsight.headline),
    subtext: normalizeSlashes(rawHeroInsight.subtext)
  };

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

1. **Temporal Pattern** - When/how they listen - NOTE: Data limited to recent 50 tracks only
2. **Emotional Strategy** - How they use music emotionally (use viral labels)
3. **Discovery Mode** - Exploration vs. loyalty (use viral labels)
4. **Attachment Style** - How they relate to artists/tracks (use viral labels)
5. **Genre Profile** - What sonic worlds they gravitate to (use viral labels with specific genres)

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
    "evidence": "'Make It To Christmas' anchors across all periods (#1 current, #2 six-month, #5 long-term)."
  },
  "discoveryMode": {
    "label": "The 6-Artist Loyalist",
    "evidence": "Ariana, Taylor, Sabrina, Lana, PinkPantheress, FLETCHER constant across recent, medium, and long-term periods."
  },
  "attachmentStyle": {
    "label": "The Vault Hunter (17-Track Edition)",
    "evidence": "17 tracks from long-term top 20 now vaulted from current rotation."
  },
  "genreProfile": {
    "label": "Pop Girl Autumn Realness",
    "evidence": "Pop dominates 85% of top artists (Ariana, Sabrina, Taylor). Dash of art pop via PinkPantheress."
  }
}

If no pattern detected for a dimension, use: {"label": "Insufficient Data", "evidence": "Need more listening history."}

Respond ONLY with valid JSON. Do not include any text before or after the JSON.
`;

  // Use HAIKU for listening DNA (follows template, cost efficiency)
  const dnaResponse = await callClaude(dnaPrompt, {
    expectJson: true,
    maxTokens: 600,
    model: 'haiku' // Cost efficient for templated output
  });
  const rawListeningDNA: ListeningDNA = JSON.parse(dnaResponse);

  // Normalize slashes for better text wrapping
  const listeningDNA: ListeningDNA = {
    temporalPattern: {
      label: normalizeSlashes(rawListeningDNA.temporalPattern.label),
      evidence: normalizeSlashes(rawListeningDNA.temporalPattern.evidence)
    },
    emotionalStrategy: {
      label: normalizeSlashes(rawListeningDNA.emotionalStrategy.label),
      evidence: normalizeSlashes(rawListeningDNA.emotionalStrategy.evidence)
    },
    discoveryMode: {
      label: normalizeSlashes(rawListeningDNA.discoveryMode.label),
      evidence: normalizeSlashes(rawListeningDNA.discoveryMode.evidence)
    },
    attachmentStyle: {
      label: normalizeSlashes(rawListeningDNA.attachmentStyle.label),
      evidence: normalizeSlashes(rawListeningDNA.attachmentStyle.evidence)
    },
    genreProfile: {
      label: normalizeSlashes(rawListeningDNA.genreProfile.label),
      evidence: normalizeSlashes(rawListeningDNA.genreProfile.evidence)
    }
  };

  console.log('[Synthesis] Listening DNA generated');

  // ========================================
  // Return synthesized insights
  // ========================================

  return {
    heroInsight,
    patternCards: deduplicatedCards,
    listeningDNA
  };
}
