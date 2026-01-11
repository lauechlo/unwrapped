// Test all detectors with multiple instances
// Run with: npx tsx scripts/test-multiple-instances.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';
import { detectLifeEvent } from '../lib/v2/detectors/temporal/lifeEvent';
import { detectRitual } from '../lib/v2/detectors/temporal/ritual';
import { detectGhostTimeline } from '../lib/v2/detectors/temporal/ghostTimeline';
import { detectAmbient } from '../lib/v2/detectors/behavioral/ambient';
import { selectBestPatterns, groupPatternsByFamily } from '../lib/v2/detectors/patternSelection';

async function testMultipleInstances() {
  console.log('='.repeat(80));
  console.log('V2 DETECTOR SUITE: MULTIPLE INSTANCES TEST');
  console.log('='.repeat(80));
  console.log();

  // Load test data
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
  console.log();

  // Run all detectors (return top 10 each)
  console.log('Running detectors...');
  const lifeEvents = detectLifeEvent(sot, 10);
  const rituals = detectRitual(sot, 10);
  const ghosts = detectGhostTimeline(sot, 10);
  const ambient = detectAmbient(sot, 10);

  console.log(`Life Events: ${lifeEvents.length} found`);
  console.log(`Rituals: ${rituals.length} found`);
  console.log(`Ghosts: ${ghosts.length} found`);
  console.log(`Ambient: ${ambient.length} found`);
  console.log();

  // Combine all patterns
  const allPatterns = [...lifeEvents, ...rituals, ...ghosts, ...ambient];
  console.log(`Total patterns: ${allPatterns.length}`);
  console.log();

  // Select best 10 across all families
  const selectedPatterns = selectBestPatterns(allPatterns, {
    maxTotal: 10,
    maxPerFamily: 4,
    minDistinctiveness: 0.3,
  });

  console.log('='.repeat(80));
  console.log(`TOP 10 PATTERNS (Selected from ${allPatterns.length} total)`);
  console.log('='.repeat(80));
  console.log();

  selectedPatterns.forEach((pattern, i) => {
    const icon = {
      evolution: '🌟',
      temporal: '🕔',
      loyalty_dropoff: '👻',
      behavioral: '🔥',
      loyalty_retention: '💙',
      diversity: '🎨',
      repetition: '🔁',
    }[pattern.patternFamily] || '•';

    console.log(`${i + 1}. ${icon} ${pattern.patternName}`);
    console.log(`   Family: ${pattern.patternFamily}`);
    console.log(`   Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
    console.log(`   Distinctiveness: ${(pattern.distinctiveness * 100).toFixed(1)}%`);

    // Show key evidence
    const trackEvidence = pattern.evidence.find(e => e.type === 'track');
    const artistEvidence = pattern.evidence.find(e => e.type === 'artist');
    const timestampEvidence = pattern.evidence.find(e => e.type === 'timestamp');

    if (trackEvidence) {
      console.log(`   Track: ${trackEvidence.humanReadable}`);
    }
    if (artistEvidence) {
      console.log(`   Artist: ${artistEvidence.humanReadable}`);
    }
    if (timestampEvidence) {
      console.log(`   Time: ${timestampEvidence.humanReadable}`);
    }

    console.log();
  });

  // Show patterns grouped by family
  console.log('='.repeat(80));
  console.log('PATTERNS BY FAMILY (All detected)');
  console.log('='.repeat(80));
  console.log();

  const grouped = groupPatternsByFamily(allPatterns);

  for (const [family, patterns] of grouped) {
    console.log(`${family.toUpperCase()} (${patterns.length} patterns)`);
    console.log('─'.repeat(80));

    patterns.slice(0, 5).forEach(p => {
      const trackEvidence = p.evidence.find(e => e.type === 'track');
      const artistEvidence = p.evidence.find(e => e.type === 'artist');

      if (trackEvidence) {
        console.log(`  • ${trackEvidence.humanReadable}`);
      } else if (artistEvidence) {
        console.log(`  • ${artistEvidence.humanReadable}`);
      }
    });

    if (patterns.length > 5) {
      console.log(`  ... and ${patterns.length - 5} more`);
    }

    console.log();
  }

  console.log('='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
}

testMultipleInstances().catch(console.error);
