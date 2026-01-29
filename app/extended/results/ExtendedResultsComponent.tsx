'use client';

import { useEffect, useState } from 'react';
import { buildSourceOfTruth } from '@/lib/v2/sourceOfTruth';
import { detectExplorer } from '@/lib/v2/detectors/behavioral/explorer';
import { detectLoyalist } from '@/lib/v2/detectors/behavioral/loyalist';
import { detectSkipVelocity } from '@/lib/v2/detectors/behavioral/skipVelocity';
import { detectSearcher } from '@/lib/v2/detectors/behavioral/searcher';
import { detectLooper } from '@/lib/v2/detectors/behavioral/looper';
import { detectCompletionLoyalist } from '@/lib/v2/detectors/behavioral/completionLoyalist';
import { detectLifeEvent } from '@/lib/v2/detectors/temporal/lifeEvent';
import { detectRitual } from '@/lib/v2/detectors/temporal/ritual';
import { detectGhostTimeline } from '@/lib/v2/detectors/temporal/ghostTimeline';
import { V2SynthesisClient } from '@/components/v2/V2SynthesisClient';

type DetectionResult = {
  patternId: string;
  patternName: string;
  patternFamily: string;
  confidence: number;
  distinctiveness: number;
  evidence: any[];
  psychologicalBasis: string;
};

interface ExtendedResultsComponentProps {
  uploadedData: any[];
}

export default function ExtendedResultsComponent({ uploadedData }: ExtendedResultsComponentProps) {
  const [status, setStatus] = useState<'loading' | 'analyzing' | 'complete' | 'error'>('loading');
  const [patterns, setPatterns] = useState<DetectionResult[]>([]);
  const [stats, setStats] = useState({
    totalPlays: 0,
    uniqueTracks: 0,
    uniqueArtists: 0,
    dateRange: '',
  });
  const [error, setError] = useState('');
  const [sourceOfTruth, setSourceOfTruth] = useState<any>(null); // Store SOT for V2.5

  useEffect(() => {
    const analyze = async () => {
      try {
        if (!Array.isArray(uploadedData) || uploadedData.length === 0) {
          setError('Invalid data format');
          setStatus('error');
          return;
        }

        // Allow loading screen to render before heavy computation
        await new Promise(resolve => setTimeout(resolve, 100));

        // Build SourceOfTruth
        setStatus('analyzing');
        const sot = buildSourceOfTruth(uploadedData);

        // Store for V2.5
        setSourceOfTruth(sot);

        // Calculate stats
        const timestamps = uploadedData
          .map((p: any) => new Date(p.timestamp || p.ts || p.endTime))
          .filter((d: Date) => !isNaN(d.getTime()))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime());

        const firstDate = timestamps[0];
        const lastDate = timestamps[timestamps.length - 1];

        setStats({
          totalPlays: sot.meta.totalPlays,
          uniqueTracks: sot.tracks.size,
          uniqueArtists: sot.artists.size,
          dateRange: firstDate && lastDate
            ? `${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()}`
            : 'Unknown date range',
        });

        // Run all 9 V2 detectors
        console.log('[V2 Detectors] Running all detectors...');
        const explorerResults = detectExplorer(sot, 10);
        const loyalistResults = detectLoyalist(sot, 10);
        const skipVelocityResults = detectSkipVelocity(sot, 10);
        const searcherResults = detectSearcher(sot, 10);
        const looperResults = detectLooper(sot, 10);
        const completionLoyalistResults = detectCompletionLoyalist(sot, 10);
        const lifeEventResults = detectLifeEvent(sot, 10);
        const ritualResults = detectRitual(sot, 10);
        const ghostTimelineResults = detectGhostTimeline(sot, 10);

        console.log('[V2 Detectors] Results:');
        console.log(`  Explorer: ${explorerResults.length}`);
        console.log(`  Loyalist: ${loyalistResults.length}`);
        console.log(`  Skip Velocity: ${skipVelocityResults.length}`);
        console.log(`  Searcher: ${searcherResults.length}`);
        console.log(`  Looper: ${looperResults.length}`);
        console.log(`  Completion Loyalist: ${completionLoyalistResults.length}`);
        console.log(`  Life Event: ${lifeEventResults.length}`);
        console.log(`  Ritual: ${ritualResults.length}`);
        console.log(`  Ghost Timeline: ${ghostTimelineResults.length}`);

        const allPatterns: DetectionResult[] = [
          ...explorerResults,
          ...loyalistResults,
          ...skipVelocityResults,
          ...searcherResults,
          ...looperResults,
          ...completionLoyalistResults,
          ...lifeEventResults,
          ...ritualResults,
          ...ghostTimelineResults,
        ];

        // Map V2 pattern families to V1 psychological dimensions for UI consistency
        const patternsWithDimensions = allPatterns.map(p => ({
          ...p,
          psychologicalDimension: mapFamilyToDimension(p.patternFamily),
          category: p.patternFamily,
        }));

        // Sort by confidence * distinctiveness
        patternsWithDimensions.sort((a, b) => {
          const scoreA = a.confidence * a.distinctiveness;
          const scoreB = b.confidence * b.distinctiveness;
          return scoreB - scoreA;
        });

        console.log('[V2 Detectors] Top 10 patterns by score:');
        patternsWithDimensions.slice(0, 10).forEach((p, i) => {
          console.log(`  ${i + 1}. [${p.patternFamily}] ${p.patternName} - confidence: ${p.confidence.toFixed(2)}, distinctiveness: ${p.distinctiveness.toFixed(2)}, score: ${(p.confidence * p.distinctiveness).toFixed(3)}`);
        });

        setPatterns(patternsWithDimensions);
        setStatus('complete');
      } catch (err) {
        console.error('Analysis error:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze data');
        setStatus('error');
      }
    };

    analyze();
  }, [uploadedData]);

  // Map V2 pattern families to V1 psychological dimensions
  function mapFamilyToDimension(family: string): string {
    const mapping: Record<string, string> = {
      'diversity': 'discovery and exploration',
      'loyalty_retention': 'identity and attachment',
      'engagement': 'attention and persistence',
      'repetition': 'ritual and repetition',
      'evolution': 'temporal patterns',
      'temporal': 'temporal patterns',
      'loyalty_dropoff': 'memory and avoidance',
    };
    return mapping[family] || 'cognitive patterns';
  }

  if (status === 'loading' || status === 'analyzing') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎵</div>
          <h2 className="text-3xl font-bold mb-2">
            {status === 'loading' ? 'Loading...' : 'Finding patterns...'}
          </h2>
          <p className="text-gray-400">
            This might take a moment
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center p-8">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-3xl font-bold mb-4 text-red-400">Analysis Failed</h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => window.location.href = '/extended'}
            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            ← Back to Upload
          </button>
        </div>
      </div>
    );
  }

  // Pass patterns to V2 synthesis for narrative generation
  if (patterns.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-3xl font-bold mb-4">Need More Data</h2>
          <p className="text-gray-400 mb-8">
            Not enough listening history to find patterns. Try uploading more files.
          </p>
          <button
            onClick={() => window.location.href = '/extended'}
            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            ← Back to Upload
          </button>
        </div>
      </div>
    );
  }

  return <V2SynthesisClient detectedPatterns={patterns} stats={stats} uploadedData={uploadedData} sourceOfTruth={sourceOfTruth} />;
}
