'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import type { TypeCode } from '@/lib/v2.5/typing';

interface TypeCodeInputProps {
  onComplete: (code: TypeCode) => void;
  onPartialChange?: (partial: string) => void;
}

// Valid characters for each position
const VALID_CHARS: Record<number, string[]> = {
  0: ['D', 'N'], // Temporal: Diurnal/Nocturnal
  1: ['L', 'S'], // Processing: Looper/Skimmer
  2: ['E', 'R'], // Discovery: Explorer/Rooted
  3: ['A', 'F'], // Attachment: Anchored/Fluid
};

const DIMENSION_HINTS: Record<number, { label: string; options: string }> = {
  0: { label: 'Temporal', options: 'D or N' },
  1: { label: 'Processing', options: 'L or S' },
  2: { label: 'Discovery', options: 'E or R' },
  3: { label: 'Attachment', options: 'A or F' },
};

/**
 * 4-character type code input with auto-advance and validation
 * Used for Quick Compare feature
 */
export default function TypeCodeInput({ onComplete, onPartialChange }: TypeCodeInputProps) {
  const [values, setValues] = useState<string[]>(['', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if a character is valid for a given position
  const isValidChar = (char: string, position: number): boolean => {
    return VALID_CHARS[position]?.includes(char.toUpperCase()) ?? false;
  };

  // Check if entire code is complete and valid
  const isComplete = values.every((v, i) => isValidChar(v, i));

  useEffect(() => {
    if (isComplete) {
      const code = values.join('').toUpperCase() as TypeCode;
      onComplete(code);
    }
    onPartialChange?.(values.join('').toUpperCase());
  }, [values, isComplete, onComplete, onPartialChange]);

  const handleChange = (index: number, value: string) => {
    const char = value.slice(-1).toUpperCase(); // Take last character, uppercase

    if (!char) {
      // Allow clearing
      const newValues = [...values];
      newValues[index] = '';
      setValues(newValues);
      return;
    }

    if (isValidChar(char, index)) {
      const newValues = [...values];
      newValues[index] = char;
      setValues(newValues);

      // Auto-advance to next input
      if (index < 3) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Blur on last input to show completion
        inputRefs.current[index]?.blur();
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      // Move to previous input on backspace when current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().slice(0, 4);

    const newValues = [...values];
    let lastValidIndex = -1;

    for (let i = 0; i < pastedText.length && i < 4; i++) {
      if (isValidChar(pastedText[i], i)) {
        newValues[i] = pastedText[i];
        lastValidIndex = i;
      }
    }

    setValues(newValues);

    // Focus next empty or last input
    if (lastValidIndex < 3) {
      inputRefs.current[lastValidIndex + 1]?.focus();
    }
  };

  return (
    <div className="space-y-4">
      {/* Input boxes */}
      <div className="flex justify-center gap-3">
        {[0, 1, 2, 3].map((index) => {
          const hasValue = !!values[index];
          const isValid = hasValue && isValidChar(values[index], index);
          const isFocused = focusedIndex === index;

          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <input
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={1}
                value={values[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                className={`
                  w-16 h-20 text-center text-4xl font-black uppercase
                  rounded-xl border-2 transition-all duration-200
                  bg-zinc-900 outline-none
                  ${isFocused
                    ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    : isValid
                      ? 'border-green-500/50'
                      : hasValue
                        ? 'border-red-500/50'
                        : 'border-zinc-700 hover:border-zinc-600'
                  }
                  ${isValid ? 'text-white' : hasValue ? 'text-red-400' : 'text-white'}
                `}
                placeholder={VALID_CHARS[index][0]}
              />
              <span className={`text-xs transition-colors ${
                isFocused ? 'text-purple-400' : 'text-gray-500'
              }`}>
                {DIMENSION_HINTS[index].options}
              </span>
            </div>
          );
        })}
      </div>

      {/* Validation hint */}
      {values.some((v, i) => v && !isValidChar(v, i)) && (
        <p className="text-center text-sm text-red-400">
          Hmm, that doesn't look right. Each position has specific valid letters.
        </p>
      )}

      {/* Completion indicator */}
      {isComplete && (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Valid type code!
          </span>
        </div>
      )}
    </div>
  );
}
