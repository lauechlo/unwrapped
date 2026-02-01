'use client';

import { useState, useRef, useEffect } from 'react';
import type { TypeCode } from '@/lib/v2.5/typing';
import { getTypeInfo } from '@/lib/v2.5/typing/typeNames';
import { generateComparisonLink } from '@/lib/v2.5/comparison';
import ShareCard from './ShareCard';
import type { ShareStats } from './TypeShareButton';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  typeCode: TypeCode;
  shareStats?: ShareStats;
}

/**
 * DM-optimized share modal with casual text and neon card
 */
export default function ShareModal({ isOpen, onClose, typeCode, shareStats }: ShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hiddenCardRef = useRef<HTMLDivElement>(null);

  const typeInfo = getTypeInfo(typeCode);
  const comparisonLink = generateComparisonLink(typeCode);

  // Casual DM-friendly share text
  const shareText = `im a ${typeCode} — ${typeInfo.name} 🎵

what's yours? ${comparisonLink}`;

  // Clear copied feedback after 2 seconds
  useEffect(() => {
    if (copiedField) {
      const timer = setTimeout(() => setCopiedField(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedField]);

  if (!isOpen) return null;

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
  };

  const handleDownload = async () => {
    if (!hiddenCardRef.current) return;

    setIsGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(hiddenCardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
      } as Parameters<typeof html2canvas>[1]);

      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `unwrapped-${typeCode}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to generate card:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Web Share API for native sharing on mobile
  const handleNativeShare = async () => {
    if (!hiddenCardRef.current) return;

    setIsGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(hiddenCardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
      } as Parameters<typeof html2canvas>[1]);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) throw new Error('Failed to create blob');

      const file = new File([blob], `unwrapped-${typeCode}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `I'm a ${typeCode}`,
          text: shareText,
          files: [file],
        });
      } else if (navigator.share) {
        // Fallback: share without image
        await navigator.share({
          title: `I'm a ${typeCode}`,
          text: shareText,
          url: comparisonLink,
        });
      } else {
        // No Web Share API, just download
        handleDownload();
      }
    } catch (error) {
      // User cancelled or error - silently fail
      console.log('Share cancelled or failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if Web Share API is available
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Instagram Stories deep link (works on mobile with Instagram installed)
  const handleShareToStories = async () => {
    if (!hiddenCardRef.current) return;

    setIsGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(hiddenCardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
      } as Parameters<typeof html2canvas>[1]);

      canvas.toBlob((blob) => {
        if (!blob) return;

        // Download first, then prompt user
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `unwrapped-${typeCode}-story.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        // Show instruction
        setCopiedField('stories');
      }, 'image/png');
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-700">
          <h2 className="text-xl font-bold text-white">Share</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Card Preview - scaled for display */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Preview</h3>
            <div className="flex justify-center bg-zinc-800/50 rounded-lg p-4 overflow-hidden">
              {/* Container sized for scaled card: 540x960 * 0.35 = 189x336 + padding */}
              <div className="relative" style={{ width: '200px', height: '350px' }}>
                <div
                  className="absolute top-0 left-1/2 origin-top"
                  style={{ transform: 'translateX(-50%) scale(0.35)' }}
                >
                  <ShareCard
                    typeCode={typeCode}
                    topArtist={shareStats?.topArtist}
                    totalPlays={shareStats?.totalPlays}
                    topSong={shareStats?.topSong}
                    timePeriod={shareStats?.timePeriod}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hidden full-size card for canvas capture - positioned off-screen but in DOM */}
          <div
            style={{
              position: 'absolute',
              left: '-9999px',
              top: '0',
              opacity: 1,
              pointerEvents: 'none',
            }}
          >
            <ShareCard
              ref={hiddenCardRef}
              typeCode={typeCode}
              topArtist={shareStats?.topArtist}
              totalPlays={shareStats?.totalPlays}
              topSong={shareStats?.topSong}
              timePeriod={shareStats?.timePeriod}
            />
          </div>

          {/* Share Text + Link Combined */}
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-gray-300 text-sm whitespace-pre-wrap flex-1">
                {shareText}
              </p>
              <button
                onClick={() => handleCopy(shareText, 'text')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex-shrink-0 ${
                  copiedField === 'text'
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }`}
              >
                {copiedField === 'text' ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Comparison Link */}
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-700">
              <input
                type="text"
                value={comparisonLink}
                readOnly
                className="flex-1 bg-zinc-900 text-gray-400 px-3 py-2 rounded text-xs border border-zinc-700"
              />
              <button
                onClick={() => handleCopy(comparisonLink, 'link')}
                className={`px-3 py-2 text-xs font-medium rounded transition-all ${
                  copiedField === 'link'
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copiedField === 'link' ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary: Native Share or Download */}
            {canNativeShare ? (
              <button
                onClick={handleNativeShare}
                disabled={isGenerating}
                className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  'Preparing...'
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold transition-all"
              >
                {isGenerating ? 'Preparing...' : 'Save Image'}
              </button>
            )}

            {/* Secondary actions row */}
            <div className="flex gap-3">
              {/* Share to Stories */}
              <button
                onClick={handleShareToStories}
                disabled={isGenerating}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium text-sm transition-all"
              >
                {copiedField === 'stories' ? (
                  <span className="flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved! Open Instagram
                  </span>
                ) : (
                  'Save for Stories'
                )}
              </button>

              {/* Download (if native share is primary) */}
              {canNativeShare && (
                <button
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm border border-zinc-700 transition-all"
                >
                  Save Image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
