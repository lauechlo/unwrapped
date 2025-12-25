/**
 * Prompt Builder Utilities
 * Constructs prompts with pattern data - WITH FULL DETAIL
 */

import type { DetectionResult } from '../detectors/types';

export function buildPatternsList(patterns: DetectionResult[]): string {
  return patterns.map(p => {
    const allEvidence = p.evidence.map((e, idx) => `    ${idx + 1}. ${e.humanReadable}`).join('\n');
    return `
## ${p.patternName} (${(p.confidence * 100).toFixed(0)}% confidence)
   Category: ${p.category}
   Psychological Dimension: ${p.psychologicalDimension}
   Evidence found:
${allEvidence}
`;
  }).join('\n');
}

export function buildEvidenceList(patterns: DetectionResult[]): string {
  // Group evidence by pattern for better context
  return patterns.map(p => {
    const evidenceItems = p.evidence.map(e => `  • ${e.humanReadable}`).join('\n');
    return `[${p.patternName}]\n${evidenceItems}`;
  }).join('\n\n');
}

export function interpolatePrompt(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

export function formatPattern(pattern: DetectionResult): string {
  return `${pattern.patternName} (${(pattern.confidence * 100).toFixed(0)}%): ${pattern.evidence.map(e => e.humanReadable).join(' | ')}`;
}
