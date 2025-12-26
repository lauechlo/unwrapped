"use client";

import { useEffect, useState } from 'react';
import { incrementUsage, getUsageData } from '@/lib/rateLimit';

/**
 * Client component to track usage when results page loads
 * This increments the usage counter once per analysis
 */
export function UsageTracker() {
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    // Only increment once per page load
    if (!tracked) {
      const success = incrementUsage();
      setTracked(true);

      if (success) {
        const { remainingUses } = getUsageData();
        console.log(`[Usage] Analysis counted. ${remainingUses} uses remaining`);
      } else {
        console.log('[Usage] Failed to increment - limit reached');
      }
    }
  }, [tracked]);

  // This component doesn't render anything
  return null;
}
