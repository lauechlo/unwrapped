'use client';

import { useState, useEffect } from 'react';

type CopiedState = 'idle' | 'copied';

interface NavSection {
  id: string;
  label: string;
  number: number;
}

interface StickyNavProps {
  sections: NavSection[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
  typeCode?: string;
  typeName?: string;
}

/**
 * Sticky navigation sidebar (desktop) / top bar (mobile)
 * Inspired by 16Personalities "ON THIS PAGE" navigation
 */
export default function StickyNav({
  sections,
  activeSection,
  onSectionClick,
  typeCode,
  typeName,
}: StickyNavProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopiedState>('idle');

  // Reset copy state after 2 seconds
  useEffect(() => {
    if (copyState === 'copied') {
      const timer = setTimeout(() => setCopyState('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyState]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/compare?type=${typeCode}`;
    navigator.clipboard.writeText(link);
    setCopyState('copied');
  };

  // Close mobile nav when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsMobileNavOpen(false);
    if (isMobileNavOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileNavOpen]);

  return (
    <>
      {/* Desktop Sidebar - Fixed right */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-40 w-64">
        <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-2xl p-6 shadow-xl">
          {/* Type Summary */}
          {typeCode && (
            <div className="mb-6 pb-6 border-b border-zinc-700">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Your Music Type</p>
              <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {typeCode}
              </p>
              {typeName && (
                <p className="text-sm text-zinc-400 mt-1">{typeName}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">On This Page</p>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionClick(section.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200
                  flex items-center gap-3 group
                  ${activeSection === section.id
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }
                `}
              >
                <span className={`
                  w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                  ${activeSection === section.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-zinc-700 text-zinc-400 group-hover:bg-zinc-600'
                  }
                `}>
                  {section.number}
                </span>
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t border-zinc-700 space-y-3">
            {/* Social Share Icons */}
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Share</p>
              <div className="flex gap-2">
                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all group ${
                    copyState === 'copied'
                      ? 'bg-green-600 scale-110'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  title={copyState === 'copied' ? 'Copied!' : 'Copy link'}
                >
                  {copyState === 'copied' ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-zinc-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                {/* X/Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm a ${typeCode} 🎵 What's your Music Type?`)}&url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/compare?type=${typeCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors group"
                  title="Share on X"
                >
                  <svg className="w-4 h-4 text-zinc-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* More share (opens modal) */}
                <button
                  onClick={() => onSectionClick('share')}
                  className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors group"
                  title="More options"
                >
                  <svg className="w-4 h-4 text-zinc-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Compare Button */}
            <button
              onClick={() => onSectionClick('compare')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Compare with a friend
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Type Badge */}
          {typeCode && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {typeCode}
              </span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-sm text-zinc-400">{typeName}</span>
            </div>
          )}

          {/* Navigation Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileNavOpen(!isMobileNavOpen);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm"
          >
            <span>Navigate</span>
            <svg
              className={`w-4 h-4 transition-transform ${isMobileNavOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Navigation */}
        {isMobileNavOpen && (
          <div
            className="absolute top-full left-0 right-0 bg-zinc-900/98 border-b border-zinc-800 px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1 mb-4">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    onSectionClick(section.id);
                    setIsMobileNavOpen(false);
                  }}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg transition-all
                    flex items-center gap-3
                    ${activeSection === section.id
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-zinc-400 hover:bg-zinc-800'
                    }
                  `}
                >
                  <span className={`
                    w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                    ${activeSection === section.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-zinc-700 text-zinc-400'
                    }
                  `}>
                    {section.number}
                  </span>
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              ))}
            </nav>

            {/* Mobile Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  onSectionClick('share');
                  setIsMobileNavOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 text-white text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button
                onClick={() => {
                  onSectionClick('compare');
                  setIsMobileNavOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Compare
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile spacer to prevent content from being hidden under sticky nav */}
      <div className="lg:hidden h-14" />

      {/* Mobile Floating Compare Button - Always visible */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => onSectionClick('compare')}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Compare with Friends
        </button>
      </div>

      {/* Mobile bottom spacer to prevent content from being hidden under floating button */}
      <div className="lg:hidden h-20" />
    </>
  );
}
