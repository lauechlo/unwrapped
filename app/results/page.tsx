/**
 * Results page - displays user analysis
 * Placeholder for now, will implement in Phase 4
 */

import { getValidAccessToken } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ResultsPage() {
  const accessToken = await getValidAccessToken();

  if (!accessToken) {
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
