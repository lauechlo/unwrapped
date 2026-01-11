"use client";

import { forwardRef } from "react";
import type { PatternCard } from "@/lib/synthesis/types";
import { getArtistTheme } from "@/lib/artistColors";

interface ShareCardProps {
  card: PatternCard;
  cardIndex: number;
  lightMode?: boolean; // Toggle between dark and light mode
}

/**
 * ShareCard component - renders at Instagram Stories dimensions (1080x1920)
 * V3: Neon-on-black aesthetic with artist-specific accent colors
 *
 * Layout:
 * - Solid black background (#0a0a0a)
 * - Emoji visual anchor at top
 * - Neon accent bar with glow
 * - 48px pattern label
 * - 64px callout (star of the show)
 * - Neon divider
 * - Core + supporting evidence
 * - Neon dimension badge at bottom
 */
// Convert Tailwind gradient to CSS linear-gradient
const tailwindGradientToCSS = (tailwindGradient: string, lightMode: boolean = false): string => {
  // Dark mode colors
  const darkColorMap: Record<string, string> = {
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

  // Light mode - HIGHLIGHTER neon colors (maximum saturation!)
  const lightColorMap: Record<string, string> = {
    'rose-900': '#ff006e',      // Hot neon pink
    'pink-900': '#ff007f',      // Electric magenta
    'purple-900': '#9d00ff',    // Highlighter purple
    'blue-900': '#0096ff',      // Electric blue
    'indigo-900': '#4169e1',    // Royal blue
    'violet-900': '#8a2be2',    // Blue violet
    'fuchsia-900': '#ff00ff',   // Pure magenta
    'green-900': '#00ff00',     // Highlighter green
    'emerald-900': '#00ff7f',   // Spring green
    'teal-900': '#00ffcc',      // Bright aqua
    'cyan-900': '#00ffff',      // Pure cyan
    'orange-900': '#ff6600',    // Neon orange
    'red-900': '#ff0000',       // Pure red
    'yellow-900': '#ffff00',    // Highlighter yellow
    'black': '#ffffff',         // White
  };

  const colorMap = lightMode ? lightColorMap : darkColorMap;
  const parts = tailwindGradient.split(' ');
  let from = '', via = '', to = '';

  parts.forEach(part => {
    if (part.startsWith('from-')) {
      const [color, opacity] = part.replace('from-', '').split('/');
      const hex = colorMap[color] || (lightMode ? '#ffffff' : '#000000');
      from = opacity ? `${hex}${Math.round(parseFloat(opacity) * 2.55).toString(16).padStart(2, '0')}` : hex;
    } else if (part.startsWith('via-')) {
      const [color, opacity] = part.replace('via-', '').split('/');
      const hex = colorMap[color] || (lightMode ? '#ffffff' : '#000000');
      via = opacity ? `${hex}${Math.round(parseFloat(opacity) * 2.55).toString(16).padStart(2, '0')}` : hex;
    } else if (part.startsWith('to-')) {
      const [color, opacity] = part.replace('to-', '').split('/');
      const hex = colorMap[color] || (lightMode ? '#ffffff' : '#000000');
      to = opacity ? `${hex}${Math.round(parseFloat(opacity) * 2.55).toString(16).padStart(2, '0')}` : hex;
    }
  });

  return via
    ? `linear-gradient(to bottom right, ${from}, ${via}, ${to})`
    : `linear-gradient(to bottom right, ${from}, ${to})`;
};

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ card, cardIndex, lightMode = false }, ref) => {
    // Get artist theme from pattern label
    const theme = getArtistTheme(card.patternLabel);
    const neonColor = theme.neonAccent || '#8b5cf6'; // Fallback to purple
    const gradientCSS = tailwindGradientToCSS(theme.gradient, lightMode);

    // Keep neon colors in light mode (for badges/accents)
    const getNeonColorForMode = (hex: string): string => {
      // Don't change neon colors - keep them vibrant in both modes!
      return hex;
    };

    const neonColorForMode = getNeonColorForMode(neonColor);

    // Text colors based on mode
    const textColor = '#FFFFFF'; // White for both modes
    const subtleTextColor = lightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255,255,255,0.7)';

    // Badge uses neon color in light mode, white in dark mode
    const badgeTextColor = lightMode ? neonColorForMode : 'rgba(255,255,255,0.8)';
    const badgeBorderColor = lightMode ? neonColorForMode : 'rgba(255,255,255,0.3)';
    const badgeBgColor = lightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0,0,0,0.3)';

    // Dynamic font size based on title length
    const getTitleFontSize = (text: string): number => {
      if (text.length > 55) return 58; // Very long titles
      if (text.length > 45) return 64; // Long titles
      return 72; // Normal titles
    };

    const titleFontSize = getTitleFontSize(card.patternLabel);

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
      return '✨'; // Default
    };

    const emoji = getDimensionEmoji(card.dimension);

    // Truncate text if too long
    const truncate = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength - 3) + '…';
    };

    return (
      <div
        ref={ref}
        id={`share-card-${cardIndex}`}
        style={{
          width: '1080px',
          height: '1920px',
          backgroundColor: '#000000', // Solid black base for consistency
          backgroundImage: gradientCSS.replace('linear-gradient', 'linear-gradient'), // Artist gradient on top
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
        {/* "Your Spotify Unwrapped" Badge at Top */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            fontSize: '26px',
            fontWeight: 600,
            color: badgeTextColor,
            padding: '12px 28px',
            borderRadius: '100px',
            border: `1.5px solid ${badgeBorderColor}`,
            backgroundColor: badgeBgColor,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            textShadow: lightMode ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          Your Spotify Unwrapped
        </div>

        {/* Music Sticker Placeholder - Square for Instagram Stories */}
        <div
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '16px',
            border: `3px dashed ${neonColorForMode}60`,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 30px ${neonColorForMode}20, inset 0 0 30px rgba(0,0,0,0.3)`,
            position: 'absolute',
            top: '300px', // Position higher up, centered in upper third
            left: '50%',
            transform: 'translateX(-50%)', // Center horizontally
          }}
        >
          {/* Spotify Icon + Musical Notes */}
          <div
            style={{
              fontSize: '48px',
              marginBottom: '12px',
              opacity: 0.6,
            }}
          >
            🎵
          </div>

          {/* Instruction Text */}
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: neonColorForMode,
              textAlign: 'center',
              opacity: 0.8,
              letterSpacing: '0.5px',
            }}
          >
            Add Music Sticker
          </div>

          {/* Subtext */}
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.5)',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            Tap ↑ on Instagram
          </div>
        </div>

        {/* Neon Accent Bar */}
        <div
          style={{
            width: '220px',
            height: '6px',
            backgroundColor: neonColorForMode,
            borderRadius: '3px',
            marginTop: '40px',
            marginBottom: '60px',
            boxShadow: `0 0 20px ${neonColorForMode}80, 0 0 40px ${neonColorForMode}40`,
          }}
        />

        {/* Pattern Label - LARGEST element (the star of the show!) */}
        <div
          style={{
            fontSize: `${titleFontSize}px`,
            fontWeight: 800,
            color: textColor,
            textAlign: 'center',
            marginBottom: '70px',
            letterSpacing: '0.5px',
            maxWidth: '920px',
            lineHeight: 1.15,
            textShadow: lightMode
              ? '0 2px 8px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.3)'
              : `0 4px 30px rgba(0,0,0,0.6), 0 0 40px ${neonColor}20`,
          }}
        >
          {truncate(card.patternLabel.replace(/^The /, ''), 100)}
        </div>

        {/* Neon Divider */}
        <div
          style={{
            width: '120px',
            height: '4px',
            backgroundColor: neonColorForMode,
            borderRadius: '2px',
            marginBottom: '60px',
            boxShadow: `0 0 15px ${neonColorForMode}70, 0 0 30px ${neonColorForMode}30`,
          }}
        />

        {/* Core - One punchy proof line */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: 500,
            color: textColor,
            textAlign: 'center',
            maxWidth: '850px',
            lineHeight: 1.4,
            marginBottom: '80px',
            textShadow: lightMode ? '0 2px 6px rgba(0,0,0,0.4), 0 0 2px rgba(0,0,0,0.6)' : 'none',
          }}
        >
          {truncate(card.core, 200)}
        </div>

        {/* Listening Habit Badge - Describes the behavior */}
        <div
          style={{
            fontSize: '32px',
            fontWeight: 500,
            color: neonColorForMode,
            padding: '20px 44px',
            borderRadius: '24px',
            border: `2px solid ${neonColorForMode}`,
            backgroundColor: `${neonColorForMode}10`,
            boxShadow: `0 0 25px ${neonColorForMode}30, inset 0 0 15px ${neonColorForMode}10`,
            letterSpacing: '0.5px',
            maxWidth: '900px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {emoji} {truncate(card.behavior, 100)}
        </div>

        {/* Branding Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: subtleTextColor,
              letterSpacing: '6px',
              textTransform: 'uppercase',
              textShadow: lightMode ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            UNWRAPPED
          </div>
          <div
            style={{
              fontSize: '20px',
              color: subtleTextColor,
              fontWeight: 300,
              textAlign: 'center',
              maxWidth: '700px',
              lineHeight: 1.5,
              textShadow: lightMode ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            Made with ✨ by Chloe | for entertainment, not therapy
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";
