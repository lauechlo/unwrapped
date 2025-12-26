/**
 * Rate limiting utility for Unwrapped v1
 * Limits users to 3 total uses before v2 launch
 *
 * Uses browser fingerprinting + cookies for bypass protection
 */

const MAX_USES = 3;
const STORAGE_KEY = 'unwrapped_uses';
const FINGERPRINT_COOKIE = 'unwrapped_fp';

export interface UsageData {
  count: number;
  remainingUses: number;
  hasUsesLeft: boolean;
  fingerprint: string;
}

/**
 * Generate browser fingerprint for user identification
 * More persistent than localStorage alone
 */
function generateFingerprint(): string {
  if (typeof window === 'undefined') return '';

  // Collect browser characteristics
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
  ].join('|');

  // Generate hash
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Set cookie (for fingerprint persistence)
 */
function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

/**
 * Get cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Get or create browser fingerprint
 * Checks cookie first, then generates new one if needed
 */
function getFingerprint(): string {
  if (typeof window === 'undefined') return '';

  // Try to get from cookie first
  let fingerprint = getCookie(FINGERPRINT_COOKIE);

  if (!fingerprint) {
    // Generate new fingerprint
    fingerprint = generateFingerprint();
    // Store in cookie for persistence
    setCookie(FINGERPRINT_COOKIE, fingerprint);
  }

  return fingerprint;
}

/**
 * Get current usage data for this browser fingerprint
 */
export function getUsageData(): UsageData {
  if (typeof window === 'undefined') {
    return { count: 0, remainingUses: MAX_USES, hasUsesLeft: true, fingerprint: '' };
  }

  const fingerprint = getFingerprint();

  // Get usage map from localStorage
  const usageMapStr = localStorage.getItem(STORAGE_KEY);
  const usageMap: Record<string, number> = usageMapStr ? JSON.parse(usageMapStr) : {};

  const count = usageMap[fingerprint] || 0;

  return {
    count,
    remainingUses: Math.max(0, MAX_USES - count),
    hasUsesLeft: count < MAX_USES,
    fingerprint
  };
}

/**
 * Increment usage count for this browser fingerprint
 * Returns true if successful, false if limit reached
 */
export function incrementUsage(): boolean {
  if (typeof window === 'undefined') return false;

  const { count, hasUsesLeft, fingerprint } = getUsageData();

  if (!hasUsesLeft) {
    console.log('[Rate Limit] Limit reached for fingerprint:', fingerprint);
    return false;
  }

  // Get usage map
  const usageMapStr = localStorage.getItem(STORAGE_KEY);
  const usageMap: Record<string, number> = usageMapStr ? JSON.parse(usageMapStr) : {};

  // Increment count for this fingerprint
  const newCount = count + 1;
  usageMap[fingerprint] = newCount;

  // Save updated map
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usageMap));

  // Log for analytics/debugging
  console.log(`[Rate Limit] Usage ${newCount}/${MAX_USES}`, {
    fingerprint,
    timestamp: new Date().toISOString()
  });

  return true;
}

/**
 * Check if user can make another request
 */
export function canMakeRequest(): boolean {
  const { hasUsesLeft } = getUsageData();
  return hasUsesLeft;
}

/**
 * Reset usage for current fingerprint (for testing only)
 */
export function resetUsage(): void {
  if (typeof window === 'undefined') return;

  const fingerprint = getFingerprint();
  const usageMapStr = localStorage.getItem(STORAGE_KEY);
  const usageMap: Record<string, number> = usageMapStr ? JSON.parse(usageMapStr) : {};

  delete usageMap[fingerprint];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usageMap));

  console.log('[Rate Limit] Usage reset for fingerprint:', fingerprint);
}
