'use client';

import { useState, useRef } from 'react';
import type { TypeCode } from '@/lib/v2.5/typing';
import { getTypeInfo, getShareText, getRarityBadge } from '@/lib/v2.5/typing/typeNames';
import { generateComparisonLink, getComparisonShareText } from '@/lib/v2.5/comparison';
import ShareCard from './ShareCard';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  typeCode: TypeCode;
}

type CardFormat = 'story' | 'square';
type Platform = 'instagram' | 'twitter' | 'dm';

/**
 * Share modal with card generation and download
 * Implements P0.4 from SHARE_AND_COMPARISON_FLOW_SPEC
 */
export default function ShareModal({ isOpen, onClose, typeCode }: ShareModalProps) {
  const [cardFormat, setCardFormat] = useState<CardFormat>('story');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const typeInfo = getTypeInfo(typeCode);
  const rarityBadge = getRarityBadge(typeCode);
  const shareText = getShareText(typeCode, platform);
  const comparisonLink = generateComparisonLink(typeCode);
  const comparisonShareText = getComparisonShareText(typeCode, platform);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      // Dynamic import to reduce initial bundle size
      const html2canvas = (await import('html2canvas')).default;

      // Generate canvas from card element
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 2, // Higher quality
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `unwrapped-${typeCode}-${cardFormat}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to generate card:', error);
      alert('Failed to generate card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    alert('Share text copied to clipboard!');
  };

  const handleCopyComparisonLink = () => {
    navigator.clipboard.writeText(comparisonLink);
    alert('Comparison link copied to clipboard!');
  };

  const handleCopyComparisonText = () => {
    navigator.clipboard.writeText(comparisonShareText);
    alert('Comparison share text copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-2xl font-bold text-white">Share Your Music Type</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Card Format Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Card Format</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setCardFormat('story')}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all
                  ${
                    cardFormat === 'story'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-gray-400 hover:border-zinc-600'
                  }
                `}
              >
                Story (1080×1920)
              </button>
              <button
                onClick={() => setCardFormat('square')}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all
                  ${
                    cardFormat === 'square'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-gray-400 hover:border-zinc-600'
                  }
                `}
              >
                Square (1080×1080)
              </button>
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Platform</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setPlatform('instagram')}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all
                  ${
                    platform === 'instagram'
                      ? 'border-pink-500 bg-pink-500/20 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-gray-400 hover:border-zinc-600'
                  }
                `}
              >
                Instagram
              </button>
              <button
                onClick={() => setPlatform('twitter')}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all
                  ${
                    platform === 'twitter'
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-gray-400 hover:border-zinc-600'
                  }
                `}
              >
                Twitter
              </button>
              <button
                onClick={() => setPlatform('dm')}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all
                  ${
                    platform === 'dm'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-gray-400 hover:border-zinc-600'
                  }
                `}
              >
                DM
              </button>
            </div>
          </div>

          {/* Card Preview */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Preview</h3>
            <div className="flex justify-center bg-zinc-800 rounded-lg p-4">
              <ShareCard
                ref={cardRef}
                typeCode={typeCode}
                format={cardFormat}
                platform={platform}
              />
            </div>
          </div>

          {/* Share Text */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Share Text</h3>
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <p className="text-gray-300 whitespace-pre-wrap text-sm mb-3">
                {shareText}
              </p>
              <button
                onClick={handleCopyText}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Copy to clipboard
              </button>
            </div>
          </div>

          {/* Comparison Link */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Comparison Link
              <span className="ml-2 text-sm font-normal text-gray-400">
                Let friends compare their types with yours
              </span>
            </h3>
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-2">Link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={comparisonLink}
                    readOnly
                    className="flex-1 bg-zinc-900 text-gray-300 px-3 py-2 rounded text-sm border border-zinc-700"
                  />
                  <button
                    onClick={handleCopyComparisonLink}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Share text with link:</p>
                <p className="text-gray-300 text-sm mb-2 whitespace-pre-wrap">
                  {comparisonShareText}
                </p>
                <button
                  onClick={handleCopyComparisonText}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                >
                  Copy share text
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="
                flex-1 px-6 py-4 rounded-lg
                bg-gradient-to-r from-purple-500 to-pink-500
                hover:from-purple-600 hover:to-pink-600
                disabled:from-gray-600 disabled:to-gray-600
                text-white font-bold
                transition-all
              "
            >
              {isGenerating ? 'Generating...' : 'Download Card'}
            </button>
            <button
              onClick={onClose}
              className="
                px-6 py-4 rounded-lg
                bg-zinc-800 hover:bg-zinc-700
                text-white font-medium
                border border-zinc-700
                transition-all
              "
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
