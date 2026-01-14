/**
 * V2.5 Feature Flags
 *
 * Controls rollout of V2.5 features (Music Type System)
 */

/**
 * Master toggle for V2.5 mode
 * Set to true to enable V2.5 (Music Type System)
 * Set to false to use V2 (Narrative + Persona System)
 */
export const USE_V25 = true; // V2.5 ENABLED - Music Type System

/**
 * Show V2.5 preview banner for testing
 * Only shown when USE_V25 is false
 */
export const SHOW_V25_PREVIEW = false;

/**
 * Enable client-side type calculation
 * If false, falls back to API endpoint
 */
export const ENABLE_CLIENT_SIDE_CALCULATION = true;

/**
 * Enable detailed dimension cards
 * Shows confidence scores and additional metrics
 */
export const SHOW_DIMENSION_DETAILS = false;

/**
 * Environment-based feature flag check
 * Allows gradual rollout via environment variables
 */
export function isV25Enabled(): boolean {
  // Check environment variable first (for gradual rollout)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const v25Param = urlParams.get('v25');

    // Allow ?v25=true in URL for testing
    if (v25Param === 'true') return true;
    if (v25Param === 'false') return false;
  }

  // Fall back to master flag
  return USE_V25;
}

/**
 * Check if user should see V2.5 preview banner
 */
export function shouldShowV25Preview(): boolean {
  return !isV25Enabled() && SHOW_V25_PREVIEW;
}
