/**
 * Loading state for results page
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold mb-2">Analyzing Your Music...</h2>
        <p className="text-gray-400">Fetching your top tracks, artists, and recent plays</p>
      </div>
    </div>
  );
}
