/**
 * V2.5 Music Type Comparison System
 *
 * Implements comparison link generation and compatibility calculation
 * P1.1 from SHARE_AND_COMPARISON_FLOW_SPEC
 */

import type { TypeCode } from './typing';
import { getTypeInfo } from './typing/typeNames';

const STORAGE_KEY = 'unwrapped_user_type';
const COMPARISON_URL_BASE = typeof window !== 'undefined' ? window.location.origin : '';

// ============================================================================
// Local Storage Management
// ============================================================================

/**
 * Store user's type code in localStorage
 */
export function storeUserType(typeCode: TypeCode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, typeCode);
}

/**
 * Get stored user type from localStorage
 */
export function getStoredUserType(): TypeCode | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY) as TypeCode | null;
}

/**
 * Clear stored user type
 */
export function clearStoredUserType(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================================================
// Comparison Link Generation
// ============================================================================

/**
 * Generate a comparison link for the user's type
 * The link includes the user's type code as a URL parameter
 */
export function generateComparisonLink(typeCode: TypeCode): string {
  return `${COMPARISON_URL_BASE}/compare?type=${typeCode}`;
}

/**
 * Parse type code from comparison URL
 */
export function parseComparisonUrl(url: string): TypeCode | null {
  try {
    const urlObj = new URL(url);
    const typeParam = urlObj.searchParams.get('type');

    if (!typeParam || typeParam.length !== 4) {
      return null;
    }

    return typeParam as TypeCode;
  } catch {
    return null;
  }
}

/**
 * Get type code from current URL query params
 */
export function getTypeFromUrl(): TypeCode | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get('type');

  if (!typeParam || typeParam.length !== 4) {
    return null;
  }

  return typeParam as TypeCode;
}

// ============================================================================
// Compatibility Calculation
// ============================================================================

export interface CompatibilityResult {
  score: number; // 0-100
  level: 'soulmates' | 'compatible' | 'different' | 'opposites';
  message: string;
  sharedDimensions: number;
  differences: Array<{
    dimension: string;
    type1: string;
    type2: string;
  }>;
}

/**
 * Calculate detailed compatibility between two types
 * Based on the algorithm from SHARE_AND_COMPARISON_FLOW_SPEC
 */
export function calculateCompatibility(type1: TypeCode, type2: TypeCode): CompatibilityResult {
  const type1Info = getTypeInfo(type1);
  const type2Info = getTypeInfo(type2);

  // Count matching dimensions
  let matchCount = 0;
  const differences: CompatibilityResult['differences'] = [];

  const dimensionNames = ['Temporal', 'Processing', 'Discovery', 'Attachment'];
  const dimensionLabels = [
    { D: 'Diurnal', N: 'Nocturnal' },
    { L: 'Looper', S: 'Skimmer' },
    { E: 'Explorer', R: 'Rooted' },
    { A: 'Anchored', F: 'Fluid' },
  ];

  for (let i = 0; i < 4; i++) {
    const char1 = type1[i];
    const char2 = type2[i];

    if (char1 === char2) {
      matchCount++;
    } else {
      differences.push({
        dimension: dimensionNames[i],
        type1: dimensionLabels[i][char1 as keyof typeof dimensionLabels[typeof i]] || char1,
        type2: dimensionLabels[i][char2 as keyof typeof dimensionLabels[typeof i]] || char2,
      });
    }
  }

  // Calculate score (each match = 25 points)
  let score = matchCount * 25;

  // Bonus points for complementary combinations
  // Same temporal dimension (good for scheduling)
  if (type1[0] === type2[0]) {
    score += 5;
  }

  // Explorer + Rooted balance (complementary)
  if ((type1[2] === 'E' && type2[2] === 'R') || (type1[2] === 'R' && type2[2] === 'E')) {
    score += 5;
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine compatibility level and message
  let level: CompatibilityResult['level'];
  let message: string;

  if (matchCount === 4) {
    level = 'soulmates';
    message = 'Perfect match! You listen the exact same way.';
  } else if (matchCount === 3) {
    level = 'compatible';
    message = 'Highly compatible! You vibe on most dimensions.';
  } else if (matchCount === 2) {
    level = 'different';
    message = 'Different but interesting! Mix of similarities and contrasts.';
  } else if (matchCount === 1) {
    level = 'different';
    message = 'Pretty different styles, but you share one key trait.';
  } else {
    level = 'opposites';
    message = 'Complete opposites! Might discover new music together.';
  }

  return {
    score,
    level,
    message,
    sharedDimensions: matchCount,
    differences,
  };
}

// ============================================================================
// Share Text for Comparison
// ============================================================================

/**
 * Generate share text for comparison invitation
 */
export function getComparisonShareText(typeCode: TypeCode, platform: 'instagram' | 'twitter' | 'dm'): string {
  const typeInfo = getTypeInfo(typeCode);
  const link = generateComparisonLink(typeCode);

  switch (platform) {
    case 'instagram':
      return `I'm a ${typeCode} (${typeInfo.name}) 🎵

Compare your Music Type with mine:
${link}`;

    case 'twitter':
      return `I'm a ${typeCode} — ${typeInfo.name} 🎵

Let's compare our Music Types and see how compatible we are!

${link}`;

    case 'dm':
      return `Just found out my Music Type — I'm a ${typeCode} (${typeInfo.name})

Check yours and compare with me:
${link}`;

    default:
      return `Compare your Music Type with mine: ${link}`;
  }
}
