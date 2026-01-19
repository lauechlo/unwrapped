'use client';

interface OverviewTabProps {
  mainNarrative: {
    title: string;
    summary: string;
  };
  stats: {
    totalPlays: number;
    uniqueTracks: number;
    uniqueArtists: number;
    dateRange: string;
  };
  personaPreview?: {
    name: string;
    icon: string;
    tagline: string;
  };
  onNavigate: (tab: 'patterns' | 'when' | 'persona') => void;
}

export default function OverviewTab({
  mainNarrative,
  stats,
  personaPreview,
  onNavigate,
}: OverviewTabProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="inline-block bg-green-500/20 border border-green-500/40 px-4 py-2 rounded-full text-sm mb-4">
          Your Extended History Analysis
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          {mainNarrative.title}
        </h1>

        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          {mainNarrative.summary}
        </p>

        <div className="text-gray-500 text-sm mt-4">
          Scroll down or use tabs above to explore your patterns ↓
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-zinc-900/50 border border-zinc-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Your Listening at a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-400">
              {stats.totalPlays.toLocaleString()}
            </div>
            <div className="text-sm text-gray-300 mt-1">Total Plays</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-pink-400">
              {stats.uniqueTracks.toLocaleString()}
            </div>
            <div className="text-sm text-gray-300 mt-1">Unique Tracks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-400">
              {stats.uniqueArtists.toLocaleString()}
            </div>
            <div className="text-sm text-gray-300 mt-1">Unique Artists</div>
          </div>
          <div className="text-center md:col-span-1 col-span-2">
            <div className="text-lg md:text-xl font-bold text-green-400">
              {stats.dateRange}
            </div>
            <div className="text-sm text-gray-300 mt-1">Date Range</div>
          </div>
        </div>
      </section>

      {/* Persona Preview */}
      {personaPreview && (
        <section className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-2 border-purple-500/40 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">People Like You</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{personaPreview.icon}</div>
              <div>
                <div className="text-sm text-gray-300 mb-1">You Are Most Like</div>
                <h3 className="text-3xl font-bold text-white">
                  {personaPreview.name}
                </h3>
                <p className="text-gray-300 italic mt-2">"{personaPreview.tagline}"</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('persona')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
            >
              See Full Analysis →
            </button>
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => onNavigate('patterns')}
          className="group bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700 hover:border-purple-500/50 rounded-xl p-6 text-left transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🔍</span>
            <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">View All Patterns</h3>
          <p className="text-gray-300 text-sm">
            Explore detailed insights about your listening behavior
          </p>
        </button>

        <button
          onClick={() => onNavigate('when')}
          className="group bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700 hover:border-purple-500/50 rounded-xl p-6 text-left transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🕐</span>
            <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">See When You Listen</h3>
          <p className="text-gray-300 text-sm">
            Discover your listening patterns by time and day
          </p>
        </button>
      </section>
    </div>
  );
}
