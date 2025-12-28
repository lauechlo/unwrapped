/**
 * Privacy Policy Page
 * Required for Spotify API compliance
 */

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
          Privacy Policy
        </h1>

        <p className="text-gray-400 mb-12">
          Last Updated: December 25, 2025
        </p>

        <div className="space-y-8 text-gray-300">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
            <p>
              Welcome to Unwrapped! I built this tool (with help from Claude, Anthropic's AI assistant)
              to give you fun, psychology-driven insights about your Spotify listening habits. Your privacy
              matters to me, so here's exactly what I do (and don't do) with your data.
            </p>
          </section>

          {/* What We Collect & Use */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">What Data I Access & How I Use It</h2>
            <p className="mb-4">When you connect your Spotify account, I access:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Top 50 tracks and artists (Last 4 Weeks, Last 6 Months, All Time)</li>
              <li>Last 50 recently played tracks</li>
              <li>Up to 50 saved (liked) tracks</li>
            </ul>
            <p className="mt-4">
              This data is analyzed <strong>in your browser</strong> to generate insights and shareable cards.
            </p>
            <p className="mt-2 text-pink-400 font-semibold">
              ✨ I do NOT store your Spotify data on any server. Analyzed in real-time, discarded immediately.
            </p>
          </section>

          {/* What We Store */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">What Stays On Your Device</h2>
            <p className="mb-4">Browser localStorage stores (on <strong>your device only</strong>):</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Usage count (3-analysis limit)</li>
              <li>Cached results (24 hours)</li>
              <li>Anonymous analytics (button clicks)</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
            <p className="mb-4">I use these external services:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Spotify API</strong> - To fetch your listening data
                (<a href="https://www.spotify.com/privacy" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">Spotify Privacy Policy</a>)
              </li>
              <li>
                <strong>Anthropic (Claude API)</strong> - To generate AI insights
                (<a href="https://www.anthropic.com/privacy" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">Anthropic Privacy Policy</a>)
              </li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Sharing</h2>
            <p>
              I <strong>do NOT</strong>:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Sell your data to anyone</li>
              <li>Share your listening habits with third parties</li>
              <li>Use your data for advertising</li>
              <li>Store your data long-term</li>
            </ul>
            <p className="mt-4">
              Your analysis results are visible only to you. I don't have access to your results
              after they're generated.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Revoke access</strong> - Disconnect Unwrapped from your Spotify at any time via your Spotify account settings</li>
              <li><strong>Clear local data</strong> - Clear your browser's localStorage to remove usage tracking</li>
              <li><strong>Request deletion</strong> - Email me to request any data deletion (though I don't store much!)</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Cookies</h2>
            <p>
              I use minimal cookies only for authentication (Spotify OAuth). No tracking cookies,
              no analytics cookies, no advertising cookies.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Children's Privacy</h2>
            <p>
              Not intended for users under 13, in line with Spotify's age requirements.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Policy Changes</h2>
            <p>
              I may update this policy occasionally. Changes will be posted on this page with an
              updated date at the top.
            </p>
          </section>

          {/* Entertainment Disclaimer */}
          <section className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">For Entertainment Only</h2>
            <p className="mb-4">
              Unwrapped is for <strong>fun and education</strong>, not therapy. The insights are playful interpretations
              based on music psychology research - think "data art," not clinical assessment.
            </p>
            <p className="text-pink-300 font-semibold">
              📊 Concerned about your mental health? Consult a qualified professional, not an Instagram Story generator. ✨
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact Me</h2>
            <p>
              Questions about privacy? Email me at{' '}
              <span className="text-pink-400">
                chloelau[at]princeton[dot]edu
              </span>
            </p>
          </section>

          {/* TL;DR */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">TL;DR</h2>
            <p className="text-gray-400">
              I use your Spotify data to generate insights, don't store it permanently,
              don't sell it, and only use it to make your experience better. That's it. ✨
            </p>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg
                     hover:opacity-90 transition-all shadow-lg"
          >
            Back to Unwrapped
          </a>
        </div>
      </div>
    </div>
  );
}
