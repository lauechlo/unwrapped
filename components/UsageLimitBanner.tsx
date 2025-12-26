"use client";

import { useEffect, useState } from 'react';
import { getUsageData, type UsageData } from '@/lib/rateLimit';

export function UsageLimitBanner() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);

  useEffect(() => {
    setUsageData(getUsageData());
  }, []);

  if (!usageData) return null;

  const { remainingUses, count } = usageData;
  const maxUses = 3;

  // Generate hearts array (filled/empty based on remaining uses)
  const hearts = Array.from({ length: maxUses }, (_, i) => {
    const isUsed = i < count;
    return { id: i, isUsed };
  });

  return (
    <div className="w-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border-b border-white/10 py-3 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 flex-wrap">
        {/* Hearts display */}
        <div className="flex items-center gap-2">
          {hearts.map((heart) => (
            <div
              key={heart.id}
              className="transition-all duration-300"
              style={{
                filter: heart.isUsed ? 'grayscale(1) opacity(0.3)' : 'none'
              }}
            >
              <span className="text-2xl">💖</span>
            </div>
          ))}
        </div>

        {/* Message */}
        <div className="text-center">
          {remainingUses > 0 ? (
            <p className="text-sm font-medium text-white/80">
              <span className="text-pink-400 font-bold">{remainingUses}</span> free {remainingUses === 1 ? 'analysis' : 'analyses'} remaining
              <span className="text-white/50 ml-2 text-xs">
                (v2 coming soon with unlimited access!)
              </span>
            </p>
          ) : (
            <p className="text-sm font-medium text-white/80">
              You've used all your free analyses! 🎉
              <span className="text-pink-400 ml-2">Stay tuned for v2 with unlimited access</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
