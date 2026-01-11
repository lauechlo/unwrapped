'use client';

import { useState, useEffect } from 'react';
import { getFeedbackSummary, downloadFeedbackData, clearFeedbackData } from '@/lib/feedback';

export default function FeedbackDashboard() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // Load feedback summary
    const data = getFeedbackSummary();
    setSummary(data);
  }, []);

  const handleRefresh = () => {
    const data = getFeedbackSummary();
    setSummary(data);
  };

  const handleDownload = () => {
    downloadFeedbackData();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all feedback data? This cannot be undone.')) {
      clearFeedbackData();
      handleRefresh();
    }
  };

  if (!summary) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading feedback data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Feedback Dashboard</h1>
          <p className="text-gray-400">View user feedback and NPS scores</p>
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

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sessions */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Total Sessions</div>
            <div className="text-3xl font-bold text-white">{summary.totalSessions}</div>
          </div>

          {/* Narrative Feedback Count */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Feedback Responses</div>
            <div className="text-3xl font-bold text-white">{summary.narrativeFeedbackCount}</div>
          </div>

          {/* Accuracy Rate */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Accuracy Rate</div>
            <div className="text-3xl font-bold text-green-400">{summary.accuracyRate}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {summary.thumbsUp} 👍 / {summary.thumbsDown} 👎
            </div>
          </div>

          {/* NPS Score */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">NPS Score</div>
            <div className={`text-3xl font-bold ${
              summary.npsScore === null ? 'text-gray-500' :
              summary.npsScore >= 50 ? 'text-green-400' :
              summary.npsScore >= 30 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {summary.npsScore !== null ? summary.npsScore : 'N/A'}
            </div>
            {summary.avgNPS !== null && (
              <div className="text-xs text-gray-500 mt-1">
                Avg: {summary.avgNPS}/10 ({summary.npsResponses} responses)
              </div>
            )}
          </div>
        </div>

        {/* NPS Breakdown */}
        {summary.npsResponses > 0 && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">NPS Breakdown</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{summary.promoters}</div>
                <div className="text-sm text-gray-400">Promoters (9-10)</div>
                <div className="text-xs text-gray-500">
                  {summary.npsResponses > 0
                    ? Math.round((summary.promoters / summary.npsResponses) * 100)
                    : 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{summary.passives}</div>
                <div className="text-sm text-gray-400">Passives (7-8)</div>
                <div className="text-xs text-gray-500">
                  {summary.npsResponses > 0
                    ? Math.round((summary.passives / summary.npsResponses) * 100)
                    : 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{summary.detractors}</div>
                <div className="text-sm text-gray-400">Detractors (0-6)</div>
                <div className="text-xs text-gray-500">
                  {summary.npsResponses > 0
                    ? Math.round((summary.detractors / summary.npsResponses) * 100)
                    : 0}%
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-700">
              <p className="text-xs text-gray-400">
                <strong>NPS Formula:</strong> (% Promoters - % Detractors) × 100
              </p>
              <p className="text-xs text-gray-400 mt-1">
                <strong>Benchmarks:</strong> &gt;50 = Excellent, 30-50 = Good, 0-30 = Needs Improvement, &lt;0 = Critical
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-2">📊 How to Use This Dashboard</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Feedback is stored in browser localStorage (client-side only)</li>
            <li>• Click "Download Data" to export all feedback as JSON</li>
            <li>• Share the JSON file for analysis or import into analytics tools</li>
            <li>• NPS Score: Net Promoter Score (industry standard metric)</li>
            <li>• Accuracy Rate: % of thumbs up vs. total feedback</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
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
