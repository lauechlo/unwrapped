'use client';

import { forwardRef } from 'react';
import type { TypeCode } from '@/lib/v2.5/typing';
import { getTypeInfo, getRarityBadge, getFullDimensionString } from '@/lib/v2.5/typing/typeNames';

interface ShareCardProps {
  typeCode: TypeCode;
  format: 'story' | 'square';
  platform: 'instagram' | 'twitter' | 'dm';
}

/**
 * Share card component for html2canvas generation
 * Implements P0.5 from SHARE_AND_COMPARISON_FLOW_SPEC
 *
 * Formats:
 * - Story: 1080x1920 (9:16 ratio, scaled down for preview)
 * - Square: 1080x1080 (1:1 ratio, scaled down for preview)
 */
const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ typeCode, format, platform }, ref) => {
    const typeInfo = getTypeInfo(typeCode);
    const rarityBadge = getRarityBadge(typeCode);
    const dimensionString = getFullDimensionString(typeCode);

    // Dimensions for html2canvas (will be scaled down for preview)
    const dimensions =
      format === 'story'
        ? { width: 540, height: 960 } // 1080x1920 scaled to 50%
        : { width: 540, height: 540 }; // 1080x1080 scaled to 50%

    const getRarityGradient = (color: 'gold' | 'purple' | 'blue' | null): string => {
      switch (color) {
        case 'gold':
          return 'from-yellow-400 to-orange-400';
        case 'purple':
          return 'from-purple-500 to-pink-500';
        case 'blue':
          return 'from-blue-500 to-cyan-500';
        default:
          return 'from-gray-500 to-gray-400';
      }
    };

    return (
      <div
        ref={ref}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
        className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 w-full">
          {/* Small Header */}
          <div className="text-xs uppercase tracking-widest text-gray-300">
            My Music Type
          </div>

          {/* Type Code - Large Display */}
          <div>
            <h1
              className="font-black tracking-tight"
              style={{ fontSize: format === 'story' ? '120px' : '100px' }}
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {typeCode}
              </span>
            </h1>
          </div>

          {/* Type Name */}
          <div>
            <h2
              className="font-bold text-white"
              style={{ fontSize: format === 'story' ? '32px' : '28px' }}
            >
              {typeInfo.name}
            </h2>
          </div>

          {/* Tagline */}
          {typeInfo.tagline && (
            <div className="px-8">
              <p
                className="text-gray-300 italic"
                style={{ fontSize: format === 'story' ? '20px' : '18px' }}
              >
                "{typeInfo.tagline}"
              </p>
            </div>
          )}

          {/* Rarity Badge */}
          {rarityBadge && (
            <div className="mt-4">
              <div
                className={`
                  inline-flex items-center gap-2 px-6 py-2 rounded-full
                  bg-gradient-to-r ${getRarityGradient(rarityBadge.color)}
                  text-white font-bold
                `}
                style={{ fontSize: format === 'story' ? '16px' : '14px' }}
              >
                <span style={{ fontSize: format === 'story' ? '20px' : '18px' }}>✨</span>
                <span>{rarityBadge.text}</span>
              </div>
            </div>
          )}

          {/* Dimension Breakdown */}
          <div className="mt-6 px-8">
            <p
              className="text-gray-300"
              style={{ fontSize: format === 'story' ? '14px' : '12px' }}
            >
              {dimensionString}
            </p>
          </div>

          {/* Bottom Branding */}
          <div className="mt-auto pt-8">
            <div className="space-y-2">
              <p
                className="text-white font-bold"
                style={{ fontSize: format === 'story' ? '18px' : '16px' }}
              >
                What's your Music Type?
              </p>
              <p
                className="text-purple-400 font-bold"
                style={{ fontSize: format === 'story' ? '20px' : '18px' }}
              >
                unwrapped.fm
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-8 right-8 text-purple-500/20 text-6xl">
          🎵
        </div>
        <div className="absolute bottom-8 left-8 text-pink-500/20 text-6xl">
          🎧
        </div>
      </div>
    );
  }
);

ShareCard.displayName = 'ShareCard';

export default ShareCard;
