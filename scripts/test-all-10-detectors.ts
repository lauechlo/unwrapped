/**
 * Test All 10 V2 Detectors
 * Runs complete detector suite on real data
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';

// Existing detectors
import { detectLifeEvent } from '../lib/v2/detectors/temporal/lifeEvent';
import { detectRitual } from '../lib/v2/detectors/temporal/ritual';
import { detectGhostTimeline } from '../lib/v2/detectors/temporal/ghostTimeline';
import { detectAmbient } from '../lib/v2/detectors/behavioral/ambient';

// New detectors
import { detectExplorer } from '../lib/v2/detectors/behavioral/explorer';
import { detectLoyalist } from '../lib/v2/detectors/behavioral/loyalist';
import { detectSkipVelocity } from '../lib/v2/detectors/behavioral/skipVelocity';
import { detectSearcher } from '../lib/v2/detectors/behavioral/searcher';
import { detectLooper } from '../lib/v2/detectors/behavioral/looper';
import { detectCompletionLoyalist } from '../lib/v2/detectors/behavioral/completionLoyalist';

async function testAllDetectors() {
  console.log('='.repeat(80));
  console.log('V2 DETECTOR SUITE TEST (ALL 10 DETECTORS)');
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

  console.log('Loading and parsing...');
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
  console.log(`   ${sot.tracks.size.toLocaleString()} unique tracks`);
  console.log(`   ${sot.artists.size.toLocaleString()} unique artists`);
  console.log();

  // Run all detectors
  console.log('='.repeat(80));
  console.log('RUNNING ALL 10 DETECTORS...');
  console.log('='.repeat(80));
  console.log();

  const results = {
    // Existing (4)
    lifeEvent: detectLifeEvent(sot, 10),
    ritual: detectRitual(sot, 10),
    ghostTimeline: detectGhostTimeline(sot, 10),
    ambient: detectAmbient(sot, 10),

    // New (6)
    explorer: detectExplorer(sot, 10),
    loyalist: detectLoyalist(sot, 10),
    skipVelocity: detectSkipVelocity(sot, 10),
    searcher: detectSearcher(sot, 10),
    looper: detectLooper(sot, 10),
    completionLoyalist: detectCompletionLoyalist(sot, 10),
  };

  // Display results
  console.log('EXISTING DETECTORS:');
  console.log('─'.repeat(80));
  console.log(`  Life Event:        ${results.lifeEvent.length} found`);
  console.log(`  Ritual:            ${results.ritual.length} found`);
  console.log(`  Ghost Timeline:    ${results.ghostTimeline.length} found`);
  console.log(`  Ambient:           ${results.ambient.length} found`);
  console.log();

  console.log('NEW DETECTORS:');
  console.log('─'.repeat(80));
  console.log(`  Explorer:          ${results.explorer.length} found`);
  console.log(`  Loyalist:          ${results.loyalist.length} found`);
  console.log(`  Skip Velocity:     ${results.skipVelocity.length} found`);
  console.log(`  Searcher:          ${results.searcher.length} found`);
  console.log(`  Looper:            ${results.looper.length} found`);
  console.log(`  Completion Loyalist: ${results.completionLoyalist.length} found`);
  console.log();

  // Count total patterns
  const totalPatterns = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`TOTAL PATTERNS DETECTED: ${totalPatterns}`);
  console.log();

  // Show top pattern from each detector
  console.log('='.repeat(80));
  console.log('TOP PATTERN FROM EACH DETECTOR');
  console.log('='.repeat(80));
  console.log();

  for (const [name, patterns] of Object.entries(results)) {
    if (patterns.length > 0) {
      const top = patterns[0];
      console.log(`${name.toUpperCase()}:`);
      console.log(`  Pattern: ${top.patternName}`);
      console.log(`  Confidence: ${(top.confidence * 100).toFixed(1)}%`);
      console.log(`  Distinctiveness: ${(top.distinctiveness * 100).toFixed(1)}%`);
      console.log(`  Evidence:`);
      top.evidence.slice(0, 3).forEach(e => {
        console.log(`    - ${e.humanReadable}`);
      });
      console.log();
    } else {
      console.log(`${name.toUpperCase()}: No patterns found`);
      console.log();
    }
  }

  // Test pattern selection (max 10 total, max 4 per family)
  console.log('='.repeat(80));
  console.log('PATTERN SELECTION TEST');
  console.log('='.repeat(80));
  console.log();

  const allPatterns = Object.values(results).flat();
  console.log(`All patterns: ${allPatterns.length}`);

  // Group by family
  const byFamily = new Map<string, typeof allPatterns>();
  for (const pattern of allPatterns) {
    const family = pattern.patternFamily;
    if (!byFamily.has(family)) {
      byFamily.set(family, []);
    }
    byFamily.get(family)!.push(pattern);
  }

  console.log();
  console.log('Patterns by family:');
  for (const [family, patterns] of byFamily.entries()) {
    console.log(`  ${family}: ${patterns.length}`);
  }

  // Apply selection logic (max 4 per family, then top 10 by score)
  const selected: typeof allPatterns = [];

  for (const [family, patterns] of byFamily.entries()) {
    const sorted = patterns.sort((a, b) => {
      const scoreA = a.confidence * a.distinctiveness;
      const scoreB = b.confidence * b.distinctiveness;
      return scoreB - scoreA;
    });
    selected.push(...sorted.slice(0, 4)); // Max 4 per family
  }

  // Sort by combined score and take top 10
  const finalSelection = selected
    .sort((a, b) => {
      const scoreA = a.confidence * a.distinctiveness;
      const scoreB = b.confidence * b.distinctiveness;
      return scoreB - scoreA;
    })
    .slice(0, 10);

  console.log();
  console.log(`Selected for synthesis: ${finalSelection.length}`);
  console.log();

  finalSelection.forEach((p, i) => {
    const score = (p.confidence * p.distinctiveness * 100).toFixed(1);
    console.log(`${i + 1}. ${p.patternName} (${p.patternFamily}) - Score: ${score}%`);
  });

  console.log();
  console.log('='.repeat(80));
  console.log('✅ DETECTOR SUITE TEST COMPLETE');
  console.log('='.repeat(80));
}

testAllDetectors().catch(console.error);
