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

          {/* What We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">What Data I Access</h2>
            <p className="mb-4">When you connect your Spotify account, I access:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Your top tracks and artists</strong> (short, medium, and long-term - 50 each)</li>
              <li><strong>Your recently played tracks</strong> (last 50 songs)</li>
              <li><strong>Your saved tracks</strong> (liked songs - 50 most recent)</li>
            </ul>
            <p className="mt-4">
              This data is used <strong>only</strong> to generate your personalized insights.
              I don't access your playlists, followers, profile info, or any other private information.
            </p>
          </section>

          {/* How We Use It */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">How I Use Your Data</h2>
            <p className="mb-4">Your Spotify data is used to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Run 30+ pattern detectors on your listening behavior</li>
              <li>Generate AI-powered insights using Claude (Anthropic)</li>
              <li>Create shareable Instagram Stories-ready cards</li>
              <li>Display your personalized results</li>
            </ul>
            <p className="mt-4 text-pink-400 font-semibold">
              I do NOT store your Spotify data on any server. It's analyzed in real-time and immediately discarded.
            </p>
          </section>

          {/* What We Store */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">What I Store Locally</h2>
            <p className="mb-4">I use browser localStorage to track:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Usage count</strong> - To enforce the 3-analysis limit</li>
              <li><strong>Cached results</strong> - Your AI-generated insights (stored for 24 hours)</li>
              <li><strong>Analytics</strong> - Button clicks and card downloads</li>
            </ul>
            <p className="mt-4">
              This data stays on <strong>your device</strong> and is never sent to any server.
            </p>
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
              Unwrapped is not intended for users under 13. I don't knowingly collect data from children.
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
            <h2 className="text-2xl font-bold text-white mb-4">Entertainment & Educational Use Only</h2>
            <p className="mb-4">
              <strong>Important:</strong> Unwrapped is designed for <strong>entertainment and educational purposes only</strong>.
              The insights, pattern labels, and "diagnoses" generated by my analysis are:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Playful interpretations</strong> of your listening data, not clinical assessments</li>
              <li><strong>Based on music cognition and psychology research</strong>, but simplified for fun</li>
              <li><strong>Not medical, psychological, or therapeutic advice</strong> in any form</li>
            </ul>
            <p className="mb-4">
              This app was built by Chloe and Claude using Chloe's background in music cognition and psychology to make
              Spotify data analysis more engaging and shareable. Think of it as "data art" - a creative
              interpretation of patterns, not a professional assessment.
            </p>
            <p className="text-pink-300 font-semibold">
              📊 If you're concerned about your mental health or relationship with music, please consult
              a qualified mental health professional - not an Instagram Story generator. ✨
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
