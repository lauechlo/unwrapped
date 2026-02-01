'use client';

import { forwardRef } from 'react';
import type { TypeCode } from '@/lib/v2.5/typing';
import { getTypeInfo } from '@/lib/v2.5/typing/typeNames';

interface ShareCardProps {
  typeCode: TypeCode;
  /** Optional: for comparison cards showing two types */
  compareTypeCode?: TypeCode;
  compatibilityScore?: number;
  /** Personalization data */
  topArtist?: string;
  totalPlays?: number;
  topSong?: { name: string; plays: number };
  timePeriod?: string;
}

/**
 * Personalized share card inspired by Spotify Wrapped
 * Shows type code + personal stats for social sharing
 *
 * All styles are inline for html2canvas compatibility
 */
const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ typeCode, compareTypeCode, compatibilityScore, topArtist, totalPlays, topSong, timePeriod }, ref) => {
    const typeInfo = getTypeInfo(typeCode);
    const compareTypeInfo = compareTypeCode ? getTypeInfo(compareTypeCode) : null;
    const isComparison = !!compareTypeCode;

    // Story format dimensions (9:16 ratio, scaled to 50% for preview)
    const dimensions = { width: 540, height: 960 };

    return (
      <div
        ref={ref}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Ambient glow effects - simplified for html2canvas */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '50%',
            background: 'radial-gradient(ellipse at 30% 0%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '100%',
            height: '50%',
            background: 'radial-gradient(ellipse at 70% 100%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '48px',
            width: '100%',
          }}
        >
          {isComparison ? (
            /* Comparison layout */
            <>
              {/* Compatibility score */}
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#9ca3af',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '24px',
                }}
              >
                {compatibilityScore}% Compatible
              </div>

              {/* Both type codes side by side */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '32px',
                  marginBottom: '32px',
                }}
              >
                {/* First type */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '64px',
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                      color: '#a855f7',
                    }}
                  >
                    {typeCode}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#e5e7eb',
                      marginTop: '8px',
                    }}
                  >
                    {typeInfo.name}
                  </div>
                </div>

                {/* VS divider */}
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#6b7280',
                  }}
                >
                  ×
                </div>

                {/* Second type */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '64px',
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                      color: '#06b6d4',
                    }}
                  >
                    {compareTypeCode}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#e5e7eb',
                      marginTop: '8px',
                    }}
                  >
                    {compareTypeInfo?.name}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Single type layout - Spotify Wrapped inspired */
            <>
              {/* Small label */}
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#6b7280',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                }}
              >
                My Music Type
              </div>

              {/* Type code - large, bold, colorful */}
              <div
                style={{
                  fontSize: '100px',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  color: '#a855f7',
                  marginBottom: '16px',
                }}
              >
                {typeCode}
              </div>

              {/* Type name */}
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '12px',
                }}
              >
                {typeInfo.name}
              </div>

              {/* Tagline */}
              {typeInfo.tagline && (
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    marginBottom: '32px',
                    maxWidth: '400px',
                  }}
                >
                  "{typeInfo.tagline}"
                </div>
              )}

              {/* Personal stats - Option B: Stacked stats box */}
              {(topArtist || totalPlays || topSong) && (
                <div
                  style={{
                    background: 'rgba(39, 39, 42, 0.8)',
                    borderRadius: '16px',
                    padding: '20px 28px',
                    marginBottom: '24px',
                    minWidth: '280px',
                  }}
                >
                  {topArtist && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: topSong || totalPlays ? '12px' : '0',
                    }}>
                      <span style={{ fontSize: '20px' }}>🎤</span>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          #1 Artist
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                          {topArtist}
                        </div>
                      </div>
                    </div>
                  )}
                  {totalPlays && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: topSong ? '12px' : '0',
                    }}>
                      <span style={{ fontSize: '20px' }}>🎵</span>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Total Plays
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                          {totalPlays.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {topSong && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <span style={{ fontSize: '20px' }}>🔥</span>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Most Played
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                          {topSong.name} <span style={{ color: '#a855f7' }}>({topSong.plays}x)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Time period */}
              {timePeriod && (
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#6b7280',
                    marginBottom: '24px',
                  }}
                >
                  {timePeriod}
                </div>
              )}
            </>
          )}

          {/* Divider */}
          <div
            style={{
              width: '80px',
              height: '2px',
              background: 'linear-gradient(90deg, #a855f7, #ec4899)',
              marginBottom: '32px',
            }}
          />

          {/* CTA */}
          <div
            style={{
              fontSize: '20px',
              fontWeight: 500,
              color: '#9ca3af',
              marginBottom: '12px',
            }}
          >
            what's yours?
          </div>

          {/* Branding */}
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#a855f7',
            }}
          >
            unwrapped.fm
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = 'ShareCard';

export default ShareCard;
