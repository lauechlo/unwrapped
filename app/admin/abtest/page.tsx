'use client';

import { useState, useEffect } from 'react';
import { getActiveTests, getTestResults, exportABTestData, clearABTestData } from '@/lib/abtest';

export default function ABTestDashboard() {
  const [tests, setTests] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = () => {
    const activeTests = getActiveTests();
    setTests(activeTests);

    const testResults = activeTests.map(test => ({
      test,
      results: getTestResults(test.testId),
    }));
    setResults(testResults);
  };

  const handleRefresh = () => {
    loadTestData();
  };

  const handleDownload = () => {
    const data = exportABTestData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `unwrapped-abtest-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all A/B test data? This cannot be undone.')) {
      clearABTestData();
      handleRefresh();
    }
  };

  // Calculate statistical significance (simplified chi-square test)
  const calculateSignificance = (variantA: any, variantB: any): { isSignificant: boolean; pValue: string } => {
    const totalA = variantA.count;
    const totalB = variantB.count;

    if (totalA < 30 || totalB < 30) {
      return { isSignificant: false, pValue: 'N/A (insufficient data)' };
    }

    // Simplified: just check if difference is > 5%
    const diff = Math.abs(variantA.thumbsUpRate - variantB.thumbsUpRate);
    const isSignificant = diff > 5;

    return {
      isSignificant,
      pValue: isSignificant ? '< 0.05 (estimated)' : '> 0.05 (estimated)',
    };
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">A/B Test Dashboard</h1>
          <p className="text-gray-400">Monitor active experiments and analyze results</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
          >
            📥 Download Data
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors"
          >
            🗑️ Clear All Data
          </button>
        </div>

        {/* Active Tests */}
        {results.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center">
            <p className="text-gray-400">No A/B test data yet. Data will appear once users interact with the site.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {results.map(({ test, results: testResults }) => {
              const { variantA, variantB, totalSamples } = testResults;
              const significance = calculateSignificance(variantA, variantB);

              return (
                <div key={test.testId} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
                  {/* Test Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold">{test.testName}</h2>
                      <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-sm">
                        Active
                      </span>
                    </div>
                    <p className="text-gray-400 mb-2">{test.description}</p>
                    <p className="text-sm text-gray-500">
                      Started: {new Date(test.startDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Sample Size */}
                  <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Total Samples</div>
                    <div className="text-3xl font-bold">{totalSamples}</div>
                    {totalSamples < 30 && (
                      <p className="text-xs text-yellow-400 mt-2">
                        ⚠️ Need at least 30 samples for statistical significance
                      </p>
                    )}
                  </div>

                  {/* Variant Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Variant A */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-blue-400 mb-2">Variant A</h3>
                      <p className="text-sm text-gray-400 mb-4">{test.variants.A}</p>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500">Sample Size</div>
                          <div className="text-2xl font-bold text-white">{variantA.count}</div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">Thumbs Up Rate</div>
                          <div className="text-2xl font-bold text-green-400">{variantA.thumbsUpRate}%</div>
                        </div>

                        {variantA.avgNPS !== null && (
                          <div>
                            <div className="text-xs text-gray-500">Avg NPS Score</div>
                            <div className="text-xl font-bold text-purple-400">{variantA.avgNPS}/10</div>
                          </div>
                        )}

                        {variantA.avgShareCount !== null && (
                          <div>
                            <div className="text-xs text-gray-500">Avg Shares per User</div>
                            <div className="text-lg font-bold text-pink-400">{variantA.avgShareCount}</div>
                          </div>
                        )}

                        {variantA.avgTimeOnPage !== null && (
                          <div>
                            <div className="text-xs text-gray-500">Avg Time on Page</div>
                            <div className="text-lg font-bold text-cyan-400">{variantA.avgTimeOnPage}s</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-purple-400 mb-2">Variant B</h3>
                      <p className="text-sm text-gray-400 mb-4">{test.variants.B}</p>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500">Sample Size</div>
                          <div className="text-2xl font-bold text-white">{variantB.count}</div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">Thumbs Up Rate</div>
                          <div className="text-2xl font-bold text-green-400">{variantB.thumbsUpRate}%</div>
                        </div>

                        {variantB.avgNPS !== null && (
                          <div>
                            <div className="text-xs text-gray-500">Avg NPS Score</div>
                            <div className="text-xl font-bold text-purple-400">{variantB.avgNPS}/10</div>
                          </div>
                        )}

                        {variantB.avgShareCount !== null && (
                          <div>
                            <div className="text-xs text-gray-500">Avg Shares per User</div>
                            <div className="text-lg font-bold text-pink-400">{variantB.avgShareCount}</div>
                          </div>
                        )}

                        {variantB.avgTimeOnPage !== null && (
                          <div>
                            <div className="text-xs text-gray-500">Avg Time on Page</div>
                            <div className="text-lg font-bold text-cyan-400">{variantB.avgTimeOnPage}s</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Winner Analysis */}
                  {totalSamples >= 30 && (
                    <div className={`p-4 rounded-lg border ${
                      significance.isSignificant
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}>
                      <h4 className={`font-bold mb-2 ${
                        significance.isSignificant ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {significance.isSignificant ? '✓ Statistically Significant Result' : '○ No Clear Winner Yet'}
                      </h4>
                      <p className="text-sm text-gray-300">
                        {significance.isSignificant ? (
                          <>
                            <strong>Winner: Variant {variantA.thumbsUpRate > variantB.thumbsUpRate ? 'A' : 'B'}</strong>
                            <br />
                            The difference in thumbs up rate ({Math.abs(variantA.thumbsUpRate - variantB.thumbsUpRate)}%)
                            is statistically significant (p {significance.pValue}).
                          </>
                        ) : (
                          <>
                            Difference is not statistically significant yet. Continue collecting data or
                            the variants may be performing similarly.
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-2">📊 How A/B Testing Works</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Users are randomly assigned to Variant A or B (50/50 split)</li>
            <li>• Assignment persists in localStorage for consistency</li>
            <li>• Metrics tracked: thumbs up rate, NPS score, shares, time on page</li>
            <li>• Need 30+ samples per variant for statistical significance</li>
            <li>• Download data for deeper analysis in tools like Excel or Python</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <a
            href="/admin/feedback"
            className="text-purple-400 hover:text-purple-300 underline mr-6"
          >
            ← View Feedback Dashboard
          </a>
          <a
            href="/extended"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            ← Back to Extended History Upload
          </a>
        </div>
      </div>
    </div>
  );
}
