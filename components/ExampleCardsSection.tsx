"use client";

import { ShareCard } from './ShareCard';
import type { PatternCard } from '@/lib/synthesis/types';

/**
 * Example Cards Section - Shows 3 preview cards to help users understand what they'll get
 */
export function ExampleCardsSection() {
  // 3 compelling example cards showcasing different dimensions
  const exampleCards: PatternCard[] = [
    {
      patternLabel: "The 2am Spiral Soundtrack",
      core: "You turn to the same 8 songs when life gets heavy - they're not just music, they're your late-night therapy session.",
      supporting: "Your Repeat Rate on these tracks is 4.2x higher than your overall average, clustering between 11pm-3am on weekdays.",
      behavior: "You listen to Phoebe Bridgers' 'I Know The End' 47 times after midnight",
      callout: "Your coping mechanism has a setlist.",
      confidence: 0.92,
      rawEvidence: [
        "Top 3 late-night tracks: Phoebe Bridgers, Mitski, Bon Iver",
        "47 plays of 'I Know The End' between 11pm-3am",
        "Repeat rate 4.2x higher for emotional tracks"
      ],
      dimension: "Emotional Regulation"
    },
    {
      patternLabel: "The Nostalgia Time Machine",
      core: "Your top artists are from 2014-2017 - you're not discovering new music, you're reliving who you used to be.",
      supporting: "87% of your top 50 tracks were released 5+ years ago. You've built a museum, not a playlist.",
      behavior: "You play Arctic Monkeys' 'AM' album like it's still 2013",
      callout: "Your Spotify is a time capsule.",
      confidence: 0.89,
      rawEvidence: [
        "87% of top 50 tracks are 5+ years old",
        "Top 3 artists all peaked 2013-2017",
        "Discovery rate: 12% (avg is 45%)"
      ],
      dimension: "Temporal Patterns"
    },
    {
      patternLabel: "The Genre Commitment-Phobe",
      core: "You jump from indie folk to hyperpop to classical in the same hour - your vibe is 'controlled chaos'.",
      supporting: "Your genre variance is in the top 5% of Spotify users. You're curating chaos, not playlists.",
      behavior: "You go from Sufjan Stevens to 100 gecs to Chopin in 47 minutes",
      callout: "Your playlist is an identity crisis.",
      confidence: 0.85,
      rawEvidence: [
        "12 different genres in top 30 tracks",
        "Genre switches every 23 minutes on average",
        "Top 5% genre variance on Spotify"
      ],
      dimension: "Discovery Mode"
    }
  ];

  return (
    <div className="w-full bg-gradient-to-b from-black via-zinc-900 to-black py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Here's What You'll Get
          </h2>
          <p className="text-xl text-gray-400">
            Psychology-backed insights about your listening habits + shareable Instagram Story cards
          </p>
        </div>

        {/* Example Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {exampleCards.map((card, index) => {
            // Different neon colors for each card
            const glowColors = [
              { border: 'rgba(236, 72, 153, 0.6)', shadow: 'rgba(236, 72, 153, 0.4)' }, // Pink
              { border: 'rgba(168, 85, 247, 0.6)', shadow: 'rgba(168, 85, 247, 0.4)' }, // Purple
              { border: 'rgba(59, 130, 246, 0.6)', shadow: 'rgba(59, 130, 246, 0.4)' },  // Blue
            ];
            const colors = glowColors[index % 3];

            return (
              <div
                key={index}
                className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                {/* Card Preview (scaled down from 1080x1920) */}
                <div
                  className="relative overflow-hidden rounded-lg"
                  style={{
                    aspectRatio: '9/16', // Instagram Stories ratio
                    width: '100%',
                    maxWidth: '300px',
                    margin: '0 auto',
                    border: `2px solid ${colors.border}`,
                    boxShadow: `0 0 30px ${colors.shadow}, 0 0 60px ${colors.shadow}`,
                    background: `linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9)), radial-gradient(circle at top right, ${colors.border}, transparent 60%)`,
                  }}
                >
                  <div
                    style={{
                      transform: 'scale(0.278)', // Scale down 1080px to ~300px
                      transformOrigin: 'top left',
                      width: '1080px',
                      height: '1920px',
                    }}
                  >
                    <ShareCard card={card} cardIndex={index} lightMode={false} />
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${colors.shadow}, transparent 70%)`,
                    filter: 'blur(20px)',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* CTA Below Examples */}
        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm mb-4">
            These are just examples. Your real insights will be based on <span className="text-purple-400 font-semibold">your</span> actual Spotify data.
          </p>
          <a
            href="#connect"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-full
                     hover:opacity-90 transition-all shadow-lg hover:shadow-purple-500/50"
          >
            Connect Spotify to Get Yours
          </a>
        </div>
      </div>
    </div>
  );
}
