"use client";

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RateLimitModal({ isOpen, onClose }: RateLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-pink-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Broken hearts animation */}
          <div className="text-6xl mb-4 animate-pulse">
            💔💔💔
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            You've Hit Your Limit!
          </h2>

          <p className="text-white/70 mb-6 leading-relaxed">
            You've used all <span className="text-pink-400 font-semibold">3 free analyses</span> for Unwrapped v1.
            Thanks for being an early user! 🎉
          </p>

          <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-white/80">
              <span className="text-pink-400 font-semibold">✨ Coming in v2:</span>
              <br />
              Unlimited analyses, even more insights, and new features!
            </p>
          </div>

          {/* Waitlist CTA */}
          <a
            href="https://forms.gle/djCs4NFUBnwFCLBr7"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg
                     hover:opacity-90 transition-all shadow-lg hover:shadow-pink-500/50 mb-3 text-center"
          >
            🎉 Join the v2 Waitlist
          </a>

          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-zinc-800 text-white font-semibold rounded-lg
                     hover:bg-zinc-700 transition-all"
          >
            Close
          </button>

          <p className="text-xs text-white/40 mt-4">
            Got feedback?{' '}
            <a
              href="https://forms.gle/bo1K5tWekj2uPTow8"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300"
            >
              Share here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
