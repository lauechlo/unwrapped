"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { ShareCard } from "./ShareCard";
import type { PatternCard } from "@/lib/synthesis/types";
import { trackCardDownload, trackDownloadAll } from "@/lib/analytics";

interface DownloadButtonProps {
  cards: PatternCard[];
}

export function DownloadButton({ cards }: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const downloadCard = async (index: number, forceDownload: boolean = false) => {
    const card = cards[index];
    const element = cardRefs.current[index];

    if (!element) {
      console.error(`Card element ${index} not found`);
      return;
    }

    setIsGenerating(true);
    setCurrentCardIndex(index);

    try {
      // Wait for fonts to load
      await document.fonts.ready;

      console.log(`[Download] Generating image for card ${index + 1}...`);

      const dataUrl = await toPng(element, {
        width: 1080,
        height: 1920,
        pixelRatio: 1, // Keep at 1 for exact dimensions
        cacheBust: true,
        style: {
          transform: 'none', // Prevent any transforms
        },
      });

      const fileName = card.patternLabel
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .slice(0, 50); // Limit length

      // Check if we're on mobile and Web Share API is available
      // BUT: only use Web Share for individual cards, not batch downloads
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const useWebShare = !forceDownload && isMobile && navigator.share;

      if (useWebShare) {
        // Convert data URL to blob for sharing on mobile
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `unwrapped-${fileName}.png`, { type: 'image/png' });

        // Check if we can share files (canShare might not exist in all browsers)
        const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });

        if (canShareFiles) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Unwrapped Result',
              text: card.patternLabel,
            });
            console.log(`[Download] Card ${index + 1} shared successfully`);
          } catch (shareError: any) {
            // User cancelled share, or error occurred
            if (shareError.name !== 'AbortError') {
              console.error('[Download] Share failed, falling back to download:', shareError);
              // Fallback to download
              const link = document.createElement("a");
              link.download = `unwrapped-${fileName}.png`;
              link.href = dataUrl;
              link.click();
            }
          }
        } else {
          // Fallback to download if can't share files
          const link = document.createElement("a");
          link.download = `unwrapped-${fileName}.png`;
          link.href = dataUrl;
          link.click();
        }
      } else {
        // Desktop or batch download: trigger regular download
        const link = document.createElement("a");
        link.download = `unwrapped-${fileName}.png`;
        link.href = dataUrl;
        link.click();
      }

      // Track download
      trackCardDownload(index, card.patternLabel);

      console.log(`[Download] Card ${index + 1} downloaded successfully`);
    } catch (error) {
      console.error(`[Download] Failed to generate image for card ${index + 1}:`, error);
      alert(`Failed to download card. Please try again.`);
    } finally {
      setIsGenerating(false);
      setCurrentCardIndex(null);
    }
  };

  const downloadAll = async () => {
    // Track download all
    trackDownloadAll(cards.length);

    // Detect mobile - mobile browsers need longer delays to avoid blocking downloads
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const delay = isMobile ? 1000 : 500; // 1s for mobile, 500ms for desktop

    for (let i = 0; i < cards.length; i++) {
      // Force download mode - don't use Web Share API for batch downloads
      // because Web Share can only be triggered once per user gesture
      await downloadCard(i, true);
      // Delay between downloads to prevent browser blocking
      if (i < cards.length - 1) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  };

  return (
    <div className="w-full">
      {/* Hidden renderer for image generation */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
        }}
        aria-hidden="true"
      >
        {cards.map((card, index) => (
          <ShareCard
            key={`share-${index}`}
            ref={(el) => { cardRefs.current[index] = el; }}
            card={card}
            cardIndex={index}
            lightMode={false}
          />
        ))}
      </div>

      {/* Download section */}
      <div className="flex flex-col items-center gap-6 py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center px-4">
          Share Your Results
        </h2>
        <p className="text-sm md:text-base text-gray-300 text-center max-w-2xl px-4">
          We've selected your {cards.length} most shareable patterns. {/iPhone|iPad|iPod|Android/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '') ? 'Tap cards below to share. Add Instagram music sticker 🎵 to the square at top!' : 'Click cards below to download for Instagram Stories! Add music sticker 🎵 to the square at top.'}
        </p>

        {/* Thumbnail Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mt-8">
          {cards.map((card, index) => (
            <div
              key={`preview-${index}`}
              className="flex flex-col items-center gap-3"
            >
              {/* Card Thumbnail */}
              <div
                className="relative overflow-hidden rounded-lg shadow-2xl cursor-pointer
                           transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/30
                           border-2 border-transparent hover:border-purple-500/50"
                style={{
                  aspectRatio: '9/16',
                  width: '100%',
                  maxWidth: '200px',
                }}
                onClick={() => downloadCard(index)}
              >
                {/* Scaled-down ShareCard */}
                <div
                  style={{
                    transform: 'scale(0.185)', // Scale 1080px to ~200px
                    transformOrigin: 'top left',
                    width: '1080px',
                    height: '1920px',
                  }}
                >
                  <ShareCard card={card} cardIndex={index} lightMode={false} />
                </div>

                {/* Download Icon Overlay on Hover */}
                <div
                  className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity
                             flex items-center justify-center pointer-events-none"
                >
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">📲</div>
                    <div className="text-sm font-semibold">Click to Download</div>
                  </div>
                </div>

                {/* Generating indicator */}
                {isGenerating && currentCardIndex === index && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-3xl mb-2">⏳</div>
                      <div className="text-sm font-semibold">Generating...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Title & Download Button */}
              <div className="text-center w-full">
                <p className="text-sm text-gray-300 mb-2 px-2 line-clamp-2 min-h-[2.5rem]">
                  {card.patternLabel.replace(/^The /, '')}
                </p>
                <button
                  onClick={() => downloadCard(index, false)}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500
                           text-white text-sm font-semibold rounded-lg
                           hover:opacity-90 disabled:opacity-50 transition-all
                           disabled:cursor-not-allowed shadow-lg"
                >
                  {currentCardIndex === index && isGenerating
                    ? 'Generating...'
                    : 'Share Card'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
