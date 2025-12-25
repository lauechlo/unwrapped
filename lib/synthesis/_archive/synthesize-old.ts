/**
 * Core Synthesis Logic
 * Generates hero insight, deep analysis, and listening DNA from pattern data
 */

import { callClaude } from '@/lib/claude/api';
import { HERO_INSIGHT_PROMPT, DEEP_ANALYSIS_PROMPT } from '@/lib/claude/prompts';
import { buildPatternsList, buildEvidenceList, interpolatePrompt } from '@/lib/claude/promptBuilder';
import { parseHeroInsight } from '@/lib/claude/parser';
import { groupPatternsByDimension } from '@/lib/synthesis/groupPatterns';
import { selectHeroPattern } from '@/lib/synthesis/selectHeroInsight';
import type { DetectionResult } from '@/lib/detectors/types';

export interface SynthesisResult {
  heroInsight: {
    headline: string;
    subtext: string;
  };
  deepAnalysis: string;
  metadata: {
    patternsAnalyzed: number;
    dimensionsIdentified: number;
    heroPatternName: string;
    timestamp: string;
  };
}

export async function synthesizeInsights(
  patterns: DetectionResult[]
): Promise<SynthesisResult> {
  if (!patterns || patterns.length === 0) {
    throw new Error('No patterns provided for synthesis');
  }

  console.log(`[Synthesis] Processing ${patterns.length} patterns`);

  // Group patterns by dimension
  const grouped = groupPatternsByDimension(patterns);
  console.log(`[Synthesis] Grouped into ${grouped.length} dimensions`);

  // Select hero pattern
  const heroPattern = selectHeroPattern(patterns);
  console.log(`[Synthesis] Hero pattern: ${heroPattern.patternName}`);

  // Get top 5 patterns for supporting context
  const topPatterns = patterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  // ========================================
  // Generate Hero Insight
  // ========================================
  console.log('[Synthesis] Generating hero insight...');

  const heroVariables = {
    primaryPattern: JSON.stringify({
      name: heroPattern.patternName,
      confidence: heroPattern.confidence,
      category: heroPattern.category,
      dimension: heroPattern.psychologicalDimension,
      evidence: heroPattern.evidence.map(e => e.humanReadable)
    }, null, 2),
    supportingPatterns: JSON.stringify(
      topPatterns.slice(1).map(p => ({
        name: p.patternName,
        confidence: p.confidence,
        dimension: p.psychologicalDimension,
        keyEvidence: p.evidence.map(e => e.humanReadable)
      })), null, 2
    )
  };

  const heroPrompt = interpolatePrompt(HERO_INSIGHT_PROMPT, heroVariables);
  const heroResponse = await callClaude(heroPrompt, { expectJson: true, maxTokens: 500 });
  const heroInsight = parseHeroInsight(heroResponse);

  console.log('[Synthesis] Hero insight generated:', heroInsight.headline);

  // ========================================
  // Generate Deep Analysis
  // ========================================
  console.log('[Synthesis] Generating deep analysis...');

  const analysisVariables = {
    patternsList: buildPatternsList(patterns),
    evidenceList: buildEvidenceList(patterns)
  };

  const analysisPrompt = interpolatePrompt(DEEP_ANALYSIS_PROMPT, analysisVariables);
  const deepAnalysis = await callClaude(analysisPrompt, { maxTokens: 1500 });

  console.log('[Synthesis] Deep analysis generated:', deepAnalysis.substring(0, 100) + '...');

  // ========================================
  // Return synthesized insights
  // ========================================

  return {
    heroInsight,
    deepAnalysis,
    metadata: {
      patternsAnalyzed: patterns.length,
      dimensionsIdentified: grouped.length,
      heroPatternName: heroPattern.patternName,
      timestamp: new Date().toISOString()
    }
  };
}
