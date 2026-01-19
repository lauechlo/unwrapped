'use client';

import { useState } from 'react';
import ShareModal from './ShareModal';
import type { TypeCode } from '@/lib/v2.5/typing';

interface TypeShareButtonProps {
  typeCode: TypeCode;
  className?: string;
}

/**
 * Share button that opens modal with share card generation
 * Implements P0.3 from SHARE_AND_COMPARISON_FLOW_SPEC
 */
export default function TypeShareButton({ typeCode, className = '' }: TypeShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          inline-flex items-center gap-3 px-8 py-4 rounded-full
          bg-gradient-to-r from-purple-500 to-pink-500
          hover:from-purple-600 hover:to-pink-600
          text-white font-bold text-lg
          shadow-lg hover:shadow-xl
          transition-all duration-200
          transform hover:scale-105
          ${className}
        `}
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
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span>Share Your Type</span>
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        typeCode={typeCode}
      />
    </>
  );
}
