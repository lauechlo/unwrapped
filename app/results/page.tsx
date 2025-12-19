/**
 * Results page - displays user analysis
 * Placeholder for now, will implement in Phase 4
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ResultsPage() {
  // Check if we have a valid access token in cookies
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;

  console.log('[Results Page] Access token from cookies:', accessToken ? 'Found' : 'Not found');

  if (!accessToken) {
    console.log('[Results Page] Redirecting - no access token');
    redirect('/?error=not_authenticated');
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Authentication Successful</h1>
        <p className="text-gray-400">OAuth working! Analysis coming in Phase 2-4.</p>
        <p className="text-sm text-gray-500 mt-4">Access token: {accessToken.substring(0, 20)}...</p>
      </div>
    </div>
  );
}
