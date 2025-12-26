/**
 * Test Viral Pattern Labels
 * Quick test to see if Gen Z slang + specific names = better labels
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

const TEST_CASE = {
  patterns: [
    {
      patternName: 'The Looper',
      confidence: 1.0,
      evidence: [
        { humanReadable: '"Make It To Christmas" by Sabrina Carpenter' },
        { humanReadable: 'Current #1, 6-month #2, all-time #5' },
        { humanReadable: 'Average rank: 2.7' }
      ]
    },
    {
      patternName: 'The Wicked Fan',
      confidence: 1.0,
      evidence: [
        { humanReadable: '6 tracks from Wicked in your top 20' },
        { humanReadable: 'Tracks: "No Good Deed", "As Long As You\'re Mine", "For Good"' }
      ]
    }
  ]
};

const VIRAL_PROMPT = `
You are a music cognition researcher analyzing Spotify listening data.

## Pattern Label Requirements

**CRITICAL: Labels must be screenshot-worthy and viral**

Create pattern labels using this format:
PATTERN: The [Specific Artist/Track] [Gen Z Slang]

**Include in labels:**
- Artist/track names: "Sabrina Carpenter", "Make It To Christmas", "Wicked"
- Numbers: "6-Artist", "17-Track", "4/4 Sunday"
- Gen Z slang: "chokehold", "era", "hyperfixation", "fixation", "stranglehold", "main character energy", "emotional support [artist]", "witness protection"

**Good Examples:**
- "The Sabrina Carpenter Chokehold"
- "The 'Make It To Christmas' Disorder"
- "Wicked Hyperfixation Era (6/20 Tracks)"
- "The Ariana/Taylor/Sabrina Trifecta"
- "Sunday Obsessed Ritual (4/4 plays)"
- "The Guilty as Sin? Vault (17-Track Edition)"

**Bad Examples (DO NOT USE):**
- "Obsessive Loyalist" ← generic, no artist names
- "Ritual Maximalist" ← therapy-speak
- "Memory Curator" ← sounds like a job title

## Output Format

PATTERN: The [Specific Artist/Track] [Viral Phrase]
├─ CORE: [Evidence with numbers]
├─ SUPPORTING: [More evidence]
└─ BEHAVIOR: [What this means]

[Punchy 1-liner callout]

Generate analysis for the patterns below.
`;

async function testViralLabels() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  console.log('🧪 TESTING VIRAL PATTERN LABELS\n');
  console.log('Generating 3 different labels for same data...\n');

  const results = [];

  for (let i = 1; i <= 3; i++) {
    console.log(`Run ${i}/3...`);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: VIRAL_PROMPT,
      messages: [{
        role: 'user',
        content: `Analyze:\n${JSON.stringify(TEST_CASE.patterns, null, 2)}`
      }]
    });

    const output = response.content[0].type === 'text' ? response.content[0].text : '';
    results.push(output);

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 OUTPUTS');
  console.log('='.repeat(80) + '\n');

  results.forEach((output, i) => {
    console.log(`Run ${i + 1}:`);
    console.log('─'.repeat(80));
    console.log(output);
    console.log();
  });

  console.log('='.repeat(80));
  console.log('🤔 EVALUATION QUESTIONS');
  console.log('='.repeat(80));
  console.log('\n1. Do labels include artist/track names?');
  console.log('2. Do labels use Gen Z slang (chokehold, era, hyperfixation)?');
  console.log('3. Would you screenshot these for Instagram?');
  console.log('4. Do they feel specific to YOUR data vs generic?');
  console.log('\nCost: ~$0.015\n');
}

testViralLabels().catch(console.error);
