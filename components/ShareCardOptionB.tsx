"use client";

import { forwardRef } from "react";
import type { PatternCard } from "@/lib/synthesis/types";
import { getArtistTheme } from "@/lib/artistColors";

interface ShareCardProps {
  card: PatternCard;
  cardIndex: number;
}

/**
 * ShareCard Option B - Stat-focused design
 * Emphasizes numbers and stats over long text
 *
 * Layout:
 * - Dark gradient background (same as website)
 * - Dimension badge at top
 * - Emoji + BIG STAT (hero)
 * - Pattern label (medium)
 * - Punchy callout
 * - Bullet stats from evidence
 * - Neon accents throughout
 */

// Convert Tailwind gradient to CSS linear-gradient
const tailwindGradientToCSS = (tailwindGradient: string): string => {
  const colorMap: Record<string, string> = {
    'rose-900': '#881337',
    'pink-900': '#831843',
    'purple-900': '#581c87',
    'blue-900': '#1e3a8a',
    'indigo-900': '#312e81',
    'violet-900': '#4c1d95',
    'fuchsia-900': '#701a75',
    'green-900': '#14532d',
    'emerald-900': '#064e3b',
    'teal-900': '#134e4a',
    'cyan-900': '#164e63',
    'orange-900': '#7c2d12',
    'red-900': '#7f1d1d',
    'yellow-900': '#713f12',
    'black': '#000000',
  };

  const parts = tailwindGradient.split(' ');
  let from = '', via = '', to = '';

  parts.forEach(part => {
    if (part.startsWith('from-')) {
      const [color, opacity] = part.replace('from-', '').split('/');
      const hex = colorMap[color] || '#000000';
      from = opacity ? `${hex}${Math.round(parseFloat(opacity) * 2.55).toString(16).padStart(2, '0')}` : hex;
    } else if (part.startsWith('via-')) {
      const [color, opacity] = part.replace('via-', '').split('/');
      const hex = colorMap[color] || '#000000';
      via = opacity ? `${hex}${Math.round(parseFloat(opacity) * 2.55).toString(16).padStart(2, '0')}` : hex;
    } else if (part.startsWith('to-')) {
      const [color, opacity] = part.replace('to-', '').split('/');
      const hex = colorMap[color] || '#000000';
      to = opacity ? `${hex}${Math.round(parseFloat(opacity) * 2.55).toString(16).padStart(2, '0')}` : hex;
    }
  });

  return via
    ? `linear-gradient(to bottom right, ${from}, ${via}, ${to})`
    : `linear-gradient(to bottom right, ${from}, ${to})`;
};

export const ShareCardOptionB = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ card, cardIndex }, ref) => {
    // Get artist theme from pattern label
    const theme = getArtistTheme(card.patternLabel);
    const neonColor = theme.neonAccent || '#8b5cf6';
    const gradientCSS = tailwindGradientToCSS(theme.gradient);

    // Map dimension to emoji
    const getDimensionEmoji = (dimension: string): string => {
      const dim = dimension.toLowerCase();
      if (dim.includes('attachment')) return '💎';
      if (dim.includes('emotional') || dim.includes('regulation')) return '🎭';
      if (dim.includes('memory') || dim.includes('avoidance')) return '👻';
      if (dim.includes('ritual') || dim.includes('repetition')) return '🔁';
      if (dim.includes('identity') || dim.includes('fantasy')) return '🌙';
      if (dim.includes('cognitive')) return '🧠';
      if (dim.includes('discovery')) return '🔍';
      if (dim.includes('temporal')) return '⏰';
      return '✨';
    };

    const emoji = getDimensionEmoji(card.dimension);

    // Extract main stat from core (first number or key phrase)
    const extractBigStat = (text: string): string => {
      // Look for patterns like "#1", "15 tracks", "6 times", percentages, etc.
      const statMatch = text.match(/(\d+%|\d+\s+\w+|#\d+|all-time|top \d+)/i);
      if (statMatch) return statMatch[1];

      // Fallback: first 3-4 words
      const words = text.split(' ');
      return words.slice(0, 4).join(' ');
    };

    const bigStat = extractBigStat(card.core);

    // Truncate text
    const truncate = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength - 3) + '…';
    };

    // Format raw evidence as bullet points
    const bulletStats = card.rawEvidence.slice(0, 3);

    return (
      <div
        ref={ref}
        id={`share-card-${cardIndex}`}
        style={{
          width: '1080px',
          height: '1920px',
          background: gradientCSS, // Artist-specific gradient (same as website)
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '100px 80px',
          fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Dimension Badge at Top */}
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: neonColor,
            padding: '10px 24px',
            borderRadius: '100px',
            border: `2px solid ${neonColor}`,
            backgroundColor: `${neonColor}10`,
            boxShadow: `0 0 20px ${neonColor}30`,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '48px',
          }}
        >
          {card.dimension}
        </div>

        {/* Emoji + Neon Glow */}
        <div
          style={{
            fontSize: '120px',
            marginBottom: '40px',
            filter: `drop-shadow(0 0 40px ${neonColor}50)`,
          }}
        >
          {emoji}
        </div>

        {/* BIG STAT - The Hero */}
        <div
          style={{
            fontSize: '96px',
            fontWeight: 900,
            color: neonColor,
            textAlign: 'center',
            marginBottom: '32px',
            lineHeight: 1,
            textShadow: `0 0 50px ${neonColor}60, 0 4px 30px rgba(0,0,0,0.8)`,
            letterSpacing: '-2px',
          }}
        >
          {truncate(bigStat, 30)}
        </div>

        {/* Neon Accent Bar */}
        <div
          style={{
            width: '180px',
            height: '5px',
            backgroundColor: neonColor,
            borderRadius: '3px',
            marginBottom: '40px',
            boxShadow: `0 0 20px ${neonColor}80, 0 0 40px ${neonColor}40`,
          }}
        />

        {/* Pattern Label - Medium size */}
        <div
          style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: '48px',
            letterSpacing: '0.5px',
            maxWidth: '900px',
            lineHeight: 1.2,
            textShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}
        >
          {truncate(card.patternLabel, 70)}
        </div>

        {/* Callout - Punchy one-liner */}
        <div
          style={{
            fontSize: '32px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            marginBottom: '56px',
            lineHeight: 1.3,
            maxWidth: '850px',
            fontStyle: 'italic',
          }}
        >
          {truncate(card.callout, 100)}
        </div>

        {/* Bullet Stats from Evidence */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            width: '100%',
            maxWidth: '800px',
            marginBottom: '48px',
          }}
        >
          {bulletStats.map((stat, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '22px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.75)',
                textAlign: 'left',
                paddingLeft: '24px',
                position: 'relative',
              }}
            >
              {/* Neon bullet */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '10px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: neonColor,
                  boxShadow: `0 0 10px ${neonColor}70`,
                }}
              />
              {truncate(stat, 120)}
            </div>
          ))}
        </div>

        {/* Supporting Text - Small */}
        {card.supporting && (
          <div
            style={{
              fontSize: '20px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              maxWidth: '750px',
              lineHeight: 1.4,
            }}
          >
            {truncate(card.supporting, 120)}
          </div>
        )}

        {/* Branding Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '6px',
              textTransform: 'uppercase',
            }}
          >
            UNWRAPPED
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.3)',
              fontWeight: 300,
            }}
          >
            by Chloe
          </div>
        </div>
      </div>
    );
  }
);

ShareCardOptionB.displayName = "ShareCardOptionB";
