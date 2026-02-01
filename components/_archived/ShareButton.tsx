'use client';

import { useState } from 'react';
import * as htmlToImage from 'html-to-image';

interface ShareButtonProps {
  cardId: string;
  cardTitle: string;
  cardType: 'narrative' | 'persona';
  onShare?: () => void;
}

export default function ShareButton({ cardId, cardTitle, cardType, onShare }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate shareable link
  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/share/${cardType}/${cardId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);

      // Track share action
      if (onShare) onShare();

      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Download card as image
  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      // Find the card element by ID
      const cardElement = document.getElementById(cardId);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Generate image using html-to-image
      const dataUrl = await htmlToImage.toPng(cardElement, {
        quality: 1.0,
        pixelRatio: 2, // Higher quality for retina displays
        backgroundColor: '#000000',
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `unwrapped-${cardType}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      // Track download action
      if (onShare) onShare();
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Share via Web Share API (mobile)
  const handleNativeShare = async () => {
    if (!navigator.share) {
      // Fallback to copy link
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: `My Unwrapped Insight: ${cardTitle}`,
        text: `Check out this insight from my Spotify analysis`,
        url: `${window.location.origin}/share/${cardType}/${cardId}`,
      });

      // Track share action
      if (onShare) onShare();
    } catch (err) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed:', err);
    }
  };

  return (
    <div className="relative">
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
        aria-label="Share this card"
      >
        <span>📤</span>
        <span>Share</span>
      </button>

      {/* Share Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-zinc-700">
              <h4 className="text-sm font-bold text-white">Share This Insight</h4>
              <p className="text-xs text-gray-300 mt-1">Send to friends via DM</p>
            </div>

            <div className="p-2">
              {/* Native Share (Mobile) */}
              {'share' in navigator && (
                <button
                  onClick={() => {
                    handleNativeShare();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-3"
                >
                  <span className="text-xl">📱</span>
                  <div>
                    <div className="text-sm font-medium text-white">Share via...</div>
                    <div className="text-xs text-gray-300">Message, WhatsApp, etc.</div>
                  </div>
                </button>
              )}

              {/* Copy Link */}
              <button
                onClick={() => {
                  handleCopyLink();
                }}
                className="w-full px-4 py-3 text-left hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-3"
              >
                <span className="text-xl">{copySuccess ? '✓' : '🔗'}</span>
                <div>
                  <div className="text-sm font-medium text-white">
                    {copySuccess ? 'Link Copied!' : 'Copy Link'}
                  </div>
                  <div className="text-xs text-gray-300">Share in DMs</div>
                </div>
              </button>

              {/* Download Image */}
              <button
                onClick={() => {
                  handleDownload();
                }}
                disabled={isGenerating}
                className="w-full px-4 py-3 text-left hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl">{isGenerating ? '⏳' : '📥'}</span>
                <div>
                  <div className="text-sm font-medium text-white">
                    {isGenerating ? 'Generating...' : 'Download Image'}
                  </div>
                  <div className="text-xs text-gray-300">Save as PNG</div>
                </div>
              </button>
            </div>

            {/* Footer Note */}
            <div className="p-3 bg-blue-500/10 border-t border-zinc-700">
              <p className="text-xs text-blue-300">
                💡 Tip: Share via DM for more personal conversations
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
