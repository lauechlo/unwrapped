/**
 * Loading state for results page
 * Shows while pattern detection and Claude synthesis are running
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        {/* Animated music notes */}
        <div className="text-6xl mb-8 animate-bounce">
          🎵 🎶 🎧
        </div>

        {/* Main message */}
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
          Analyzing Your Listening DNA...
        </h1>

        <p className="text-xl text-gray-400 mb-8">
          Claude is reading between the plays
        </p>

        {/* Progress steps */}
        <div className="space-y-4 text-left max-w-md mx-auto">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Running 30+ pattern detectors...</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <span>Generating viral insights...</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span>Selecting shareable cards...</span>
          </div>
        </div>

        {/* Fun fact */}
        <div className="mt-12 text-sm text-gray-600 italic">
          This usually takes 15-30 seconds ✨
        </div>
      </div>
    </div>
  );
}
