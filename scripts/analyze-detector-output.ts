/**
 * Analyze Detector Output
 * Deep dive into the 6 new detectors to check for overlap, evidence, and language
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';

// New detectors only
import { detectExplorer } from '../lib/v2/detectors/behavioral/explorer';
import { detectLoyalist } from '../lib/v2/detectors/behavioral/loyalist';
import { detectSkipVelocity } from '../lib/v2/detectors/behavioral/skipVelocity';
import { detectSearcher } from '../lib/v2/detectors/behavioral/searcher';
import { detectLooper } from '../lib/v2/detectors/behavioral/looper';
import { detectCompletionLoyalist } from '../lib/v2/detectors/behavioral/completionLoyalist';

async function analyzeDetectors() {
  console.log('='.repeat(80));
  console.log('DETECTOR OUTPUT ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  // Load and parse test data
  const testDataPath = path.join(
    'C:',
    'Users',
    'lauec',
    'Desktop',
    'Princeton',
    'Side Quests',
    'My Spotify History',
    'Streaming_History_Audio_2025_9.json'
  );

  console.log('Loading data...');
  const fileContent = fs.readFileSync(testDataPath, 'utf-8');
  const parseResult = await parseStreamingHistory(fileContent, {
    sanitize: true,
    validate: false,
  });

  if (!parseResult.success || !parseResult.data) {
    console.error('Parse failed');
    return;
  }

  const sot = buildSourceOfTruth(parseResult.data);
  console.log(`✅ Indexed ${sot.meta.totalPlays.toLocaleString()} plays`);
  console.log();

  // Run all new detectors
  const results = {
    explorer: detectExplorer(sot, 3), // Top 3 only for analysis
    loyalist: detectLoyalist(sot, 3),
    skipVelocity: detectSkipVelocity(sot, 3),
    searcher: detectSearcher(sot, 3),
    looper: detectLooper(sot, 3),
    completionLoyalist: detectCompletionLoyalist(sot, 3),
  };

  // Analyze each detector
  console.log('='.repeat(80));
  console.log('1. THE EXPLORER (Discovery Velocity)');
  console.log('='.repeat(80));
  console.log();
  analyzePatterns(results.explorer, 'The Explorer');

  console.log('='.repeat(80));
  console.log('2. THE LOYALIST (Consistency Tracking)');
  console.log('='.repeat(80));
  console.log();
  analyzePatterns(results.loyalist, 'The Loyalist');

  console.log('='.repeat(80));
  console.log('3. SKIP VELOCITY (Engagement Depth)');
  console.log('='.repeat(80));
  console.log();
  analyzePatterns(results.skipVelocity, 'Skip Velocity');

  console.log('='.repeat(80));
  console.log('4. THE SEARCHER (Intentionality)');
  console.log('='.repeat(80));
  console.log();
  analyzePatterns(results.searcher, 'The Searcher');

  console.log('='.repeat(80));
  console.log('5. THE LOOPER (Repetition Pattern)');
  console.log('='.repeat(80));
  console.log();
  analyzePatterns(results.looper, 'The Looper');

  console.log('='.repeat(80));
  console.log('6. COMPLETION LOYALIST (Finish Rate)');
  console.log('='.repeat(80));
  console.log();
  analyzePatterns(results.completionLoyalist, 'Completion Loyalist');

  // Check for overlap
  console.log('='.repeat(80));
  console.log('OVERLAP ANALYSIS');
  console.log('='.repeat(80));
  console.log();
  analyzeOverlap(results);

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log();

  const totalPatterns = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`Total patterns detected: ${totalPatterns}`);
  console.log();

  for (const [name, patterns] of Object.entries(results)) {
    console.log(`${name}: ${patterns.length} patterns`);
  }
}

function analyzePatterns(patterns: any[], detectorName: string) {
  if (patterns.length === 0) {
    console.log(`❌ No patterns detected`);
    console.log();
    console.log('POSSIBLE REASONS:');
    console.log('  - Threshold too high for this dataset');
    console.log('  - Data doesn\'t contain this behavior');
    console.log('  - Bug in detector logic');
    console.log();
    return;
  }

  console.log(`✅ ${patterns.length} patterns detected`);
  console.log();

  patterns.forEach((pattern, i) => {
    console.log(`PATTERN #${i + 1}:`);
    console.log(`  Name: ${pattern.patternName}`);
    console.log(`  Family: ${pattern.patternFamily}`);
    console.log(`  Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
    console.log(`  Distinctiveness: ${(pattern.distinctiveness * 100).toFixed(1)}%`);
    console.log();
    console.log(`  EVIDENCE:`);
    pattern.evidence.forEach((e: any) => {
      console.log(`    - [${e.type}] ${e.humanReadable}`);
    });
    console.log();
    console.log(`  PSYCHOLOGICAL BASIS:`);
    console.log(`    ${pattern.psychologicalBasis}`);
    console.log();
    console.log('─'.repeat(80));
    console.log();
  });

  // Evidence check
  console.log('EVIDENCE VALIDATION:');
  const evidenceIssues: string[] = [];

  patterns.forEach((pattern, i) => {
    // Check for vague language
    const allEvidence = pattern.evidence.map((e: any) => e.humanReadable).join(' ');

    if (allEvidence.includes('approximately') || allEvidence.includes('around')) {
      evidenceIssues.push(`Pattern #${i + 1}: Uses vague approximations`);
    }

    if (allEvidence.includes('many') || allEvidence.includes('several')) {
      evidenceIssues.push(`Pattern #${i + 1}: Uses vague quantities`);
    }

    // Check for missing artist/track names
    const hasArtistOrTrack = pattern.evidence.some(
      (e: any) => e.type === 'artist' || e.type === 'track'
    );
    if (!hasArtistOrTrack && detectorName !== 'The Searcher') {
      evidenceIssues.push(`Pattern #${i + 1}: Missing specific artist/track reference`);
    }

    // Check for specific numbers
    const hasNumbers = pattern.evidence.some((e: any) => e.type === 'count' || e.type === 'ratio');
    if (!hasNumbers) {
      evidenceIssues.push(`Pattern #${i + 1}: Missing quantitative evidence`);
    }
  });

  if (evidenceIssues.length === 0) {
    console.log('  ✅ All evidence is specific and quantitative');
  } else {
    console.log('  ⚠️ Issues found:');
    evidenceIssues.forEach(issue => console.log(`     ${issue}`));
  }
  console.log();
}

function analyzeOverlap(results: any) {
  // Check for same artists appearing across detectors
  const artistsByDetector = new Map<string, Set<string>>();

  for (const [detectorName, patterns] of Object.entries(results)) {
    const artists = new Set<string>();
    for (const pattern of patterns as any[]) {
      for (const evidence of pattern.evidence) {
        if (evidence.type === 'artist') {
          artists.add(evidence.value);
        }
      }
    }
    artistsByDetector.set(detectorName, artists);
  }

  console.log('ARTIST OVERLAP:');
  console.log();

  const allDetectors = Object.keys(results);
  for (let i = 0; i < allDetectors.length; i++) {
    for (let j = i + 1; j < allDetectors.length; j++) {
      const detector1 = allDetectors[i];
      const detector2 = allDetectors[j];

      const artists1 = artistsByDetector.get(detector1) || new Set();
      const artists2 = artistsByDetector.get(detector2) || new Set();

      const overlap = Array.from(artists1).filter(a => artists2.has(a));

      if (overlap.length > 0) {
        console.log(`  ${detector1} ↔ ${detector2}:`);
        console.log(`    Shared artists: ${overlap.join(', ')}`);
        console.log(`    Analysis: These detectors detect different BEHAVIORS for the same artists`);
        console.log();
      }
    }
  }

  console.log('INTERPRETATION:');
  console.log('  Overlap is EXPECTED and GOOD:');
  console.log('  - Same artist can be loyal (Loyalist) AND high completion (Completion Loyalist)');
  console.log('  - Same artist can be explored (Explorer) AND skipped (Skip Velocity)');
  console.log('  - Overlap shows MULTI-DIMENSIONAL relationship with artists');
  console.log();
  console.log('  BAD overlap would be:');
  console.log('  - Multiple detectors claiming the SAME pattern (e.g., two rituals for same track/time)');
  console.log('  - Contradictory evidence (e.g., high skip + high completion for same artist)');
  console.log();
}

analyzeDetectors().catch(console.error);
