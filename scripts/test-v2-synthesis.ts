/**
 * V2 Synthesis Test
 * Run synthesis on actual detected patterns from test data
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { resolve } from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';
import { detectLifeEvent } from '../lib/v2/detectors/temporal/lifeEvent';
import { detectRitual } from '../lib/v2/detectors/temporal/ritual';
import { detectGhostTimeline } from '../lib/v2/detectors/temporal/ghostTimeline';
import { detectAmbient } from '../lib/v2/detectors/behavioral/ambient';
import { synthesizePatterns } from '../lib/v2/synthesis';

config({ path: resolve(__dirname, '../.env.local') });

async function testSynthesis() {
  console.log('='.repeat(80));
  console.log('V2 SYNTHESIS TEST');
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
  console.log();

  // Run detectors
  console.log('Running detectors...');
  const lifeEvents = detectLifeEvent(sot, 10);
  const rituals = detectRitual(sot, 10);
  const ghosts = detectGhostTimeline(sot, 10);
  const ambient = detectAmbient(sot, 10);

  // Combine all patterns
  const allPatterns = [...lifeEvents, ...rituals, ...ghosts, ...ambient];
  console.log(`Detected ${allPatterns.length} patterns total`);
  console.log(`  - Life Events: ${lifeEvents.length}`);
  console.log(`  - Rituals: ${rituals.length}`);
  console.log(`  - Ghosts: ${ghosts.length}`);
  console.log(`  - Ambient: ${ambient.length}`);
  console.log();

  if (allPatterns.length === 0) {
    console.log('No patterns detected - cannot test synthesis');
    return;
  }

  // ========================================
  // Run Synthesis
  // ========================================

  console.log('='.repeat(80));
  console.log('RUNNING SYNTHESIS...');
  console.log('='.repeat(80));
  console.log();

  const synthesis = await synthesizePatterns(allPatterns, 5);

  // ========================================
  // Display Results
  // ========================================

  console.log('='.repeat(80));
  console.log('HERO INSIGHT');
  console.log('='.repeat(80));
  console.log();
  console.log(`HEADLINE: ${synthesis.heroInsight.headline}`);
  console.log();
  console.log(`SUBTEXT: ${synthesis.heroInsight.subtext}`);
  console.log();

  console.log('='.repeat(80));
  console.log(`PATTERN NARRATIVES (${synthesis.narratives.length})`);
  console.log('='.repeat(80));
  console.log();

  synthesis.narratives.forEach((narrative, i) => {
    console.log(`${i + 1}. ${narrative.title}`);
    console.log(`   Family: ${narrative.patternFamily}`);
    console.log(`   Confidence: ${(narrative.confidence * 100).toFixed(1)}%`);
    console.log();
    console.log(`   FINDING: ${narrative.finding}`);
    console.log();
    console.log(`   CONTEXT: ${narrative.context}`);
    console.log();
    console.log(`   CALLOUT: ${narrative.callout}`);
    console.log();
    console.log('─'.repeat(80));
    console.log();
  });

  console.log('='.repeat(80));
  console.log('PSYCHOLOGICAL SUMMARY');
  console.log('='.repeat(80));
  console.log();
  console.log(synthesis.psychologicalSummary);
  console.log();

  console.log('='.repeat(80));
  console.log('✅ SYNTHESIS COMPLETE');
  console.log('='.repeat(80));

  // ========================================
  // Save Output to Files
  // ========================================

  const outputDir = path.join(__dirname, '..', 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

  // Save JSON output (full synthesis data)
  const jsonPath = path.join(outputDir, `synthesis-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    meta: {
      timestamp: new Date().toISOString(),
      patternsDetected: allPatterns.length,
      narrativesGenerated: synthesis.narratives.length,
    },
    heroInsight: synthesis.heroInsight,
    narratives: synthesis.narratives,
    psychologicalSummary: synthesis.psychologicalSummary,
    // Include detector evidence for traceability
    detectorEvidence: allPatterns.map(p => ({
      patternId: p.patternId,
      patternName: p.patternName,
      patternFamily: p.patternFamily,
      confidence: p.confidence,
      distinctiveness: p.distinctiveness,
      evidence: p.evidence,
    })),
  }, null, 2));

  // Save human-readable text output
  const textPath = path.join(outputDir, `synthesis-${timestamp}.txt`);
  const textOutput = `
${'='.repeat(80)}
V2 SYNTHESIS OUTPUT
Generated: ${new Date().toISOString()}
${'='.repeat(80)}

HERO INSIGHT
${'='.repeat(80)}

HEADLINE: ${synthesis.heroInsight.headline}

SUBTEXT: ${synthesis.heroInsight.subtext}

Pattern ID: ${synthesis.heroInsight.patternId}


${'='.repeat(80)}
PATTERN NARRATIVES (${synthesis.narratives.length})
${'='.repeat(80)}

${synthesis.narratives.map((narrative, i) => `
${i + 1}. ${narrative.title}
   Pattern ID: ${narrative.patternId}
   Family: ${narrative.patternFamily}
   Confidence: ${(narrative.confidence * 100).toFixed(1)}%

   FINDING: ${narrative.finding}

   CONTEXT: ${narrative.context}

   CALLOUT: ${narrative.callout}

   EVIDENCE:
${narrative.evidenceSummary.map(e => `     - ${e}`).join('\n')}

${'─'.repeat(80)}
`).join('\n')}

${'='.repeat(80)}
PSYCHOLOGICAL SUMMARY
${'='.repeat(80)}

${synthesis.psychologicalSummary}

${'='.repeat(80)}
END OF SYNTHESIS
${'='.repeat(80)}
`.trim();

  fs.writeFileSync(textPath, textOutput);

  console.log();
  console.log('📁 Output saved to:');
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   Text: ${textPath}`);
  console.log();
}

testSynthesis().catch(console.error);
