'use client';

import { useState, useEffect } from 'react';
import { trackNPSFeedback } from '@/lib/feedback';
import { trackABTestMetric } from '@/lib/abtest';

interface NPSWidgetProps {
  onComplete?: () => void;
}

export default function NPSWidget({ onComplete }: NPSWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);

  // Show widget after user has engaged with content (not immediately)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if user already submitted NPS this session
      const hasSubmitted = sessionStorage.getItem('nps_submitted');
      if (hasSubmitted) {
        return;
      }

      // Only show if user has been on page for 60+ seconds
      // This ensures they've had time to view at least 2 narrative cards
      const timeOnPage = Date.now() - (parseInt(sessionStorage.getItem('page_load_time') || '0') || Date.now());
      if (timeOnPage >= 60000) {
        setIsVisible(true);
      }
    }, 60000); // 60 seconds (not 45)

    // Track page load time
    if (!sessionStorage.getItem('page_load_time')) {
      sessionStorage.setItem('page_load_time', Date.now().toString());
    }

    return () => clearTimeout(timer);
  }, []);

  const handleScoreClick = (selectedScore: number) => {
    setScore(selectedScore);
    setShowCommentBox(true);
  };

  const handleSubmit = () => {
    if (score === null) return;

    // Track NPS feedback
    trackNPSFeedback(score, comment || undefined);

    // Track in A/B test metrics
    trackABTestMetric('narrative_tone_v1', {
      npsScore: score,
    });

    // Mark as submitted
    setIsSubmitted(true);
    sessionStorage.setItem('nps_submitted', 'true');

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 3000);
  };

  const handleSkip = () => {
    setIsVisible(false);
    sessionStorage.setItem('nps_submitted', 'skipped');
  };

  // Helper to determine NPS category
  const getNPSCategory = (score: number): 'promoter' | 'passive' | 'detractor' => {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  };

  // Get follow-up message based on score
  const getFollowUpMessage = (score: number) => {
    const category = getNPSCategory(score);

    if (category === 'promoter') {
      return 'That\'s amazing! What did you love most?';
    } else if (category === 'passive') {
      return 'Thanks! What would make this a 10?';
    } else {
      return 'We appreciate your honesty. What disappointed you?';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-sm z-50 animate-fadeIn">
      <div className="bg-zinc-900 border-2 border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-4 border-b border-zinc-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Quick Question</h3>
                  <p className="text-xs text-gray-300">Help us improve Unwrapped</p>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-300 transition-colors text-xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* NPS Score Selection */}
            {score === null && (
              <div className="p-4">
                <p className="text-sm text-white mb-3 text-center">
                  How likely are you to recommend Unwrapped to a friend who loves music?
                </p>

                {/* 0-10 Scale */}
                <div className="flex gap-1 mb-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleScoreClick(num)}
                      className="flex-1 h-10 rounded bg-zinc-800 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Labels */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>
            )}

            {/* Follow-Up Comment */}
            {score !== null && !isSubmitted && (
              <div className="p-4 space-y-3">
                <div className="text-center">
                  <div className="inline-block bg-purple-500/20 px-4 py-2 rounded-full mb-2">
                    <span className="text-2xl font-bold text-white">{score}</span>
                    <span className="text-xs text-gray-300 ml-1">/10</span>
                  </div>
                  <p className="text-sm text-white">
                    {getFollowUpMessage(score)}
                  </p>
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Your feedback helps improve music psychology research... (optional)"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500"
                  rows={3}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setScore(null);
                      setComment('');
                      setShowCommentBox(false);
                    }}
                    className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Thank You Message */
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-white mb-2">Thank You!</h3>
            <p className="text-sm text-gray-300">
              Your feedback helps us improve music psychology research
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
