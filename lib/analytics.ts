/**
 * Simple analytics tracking for Unwrapped v1
 * Tracks user interactions to understand behavior
 */

const ANALYTICS_KEY_PREFIX = 'unwrapped_analytics_';

export interface AnalyticsEvent {
  event: string;
  timestamp: string;
  data?: Record<string, any>;
}

/**
 * Track a "Prove It" button click
 */
export function trackProveItClick(patternLabel: string): void {
  const event: AnalyticsEvent = {
    event: 'prove_it_click',
    timestamp: new Date().toISOString(),
    data: {
      patternLabel,
    }
  };

  logEvent(event);
  console.log('[Analytics] Prove It clicked:', patternLabel);
}

/**
 * Track card download
 */
export function trackCardDownload(cardIndex: number, patternLabel: string): void {
  const event: AnalyticsEvent = {
    event: 'card_download',
    timestamp: new Date().toISOString(),
    data: {
      cardIndex,
      patternLabel,
    }
  };

  logEvent(event);
  console.log('[Analytics] Card downloaded:', { cardIndex, patternLabel });
}

/**
 * Track download all cards
 */
export function trackDownloadAll(cardCount: number): void {
  const event: AnalyticsEvent = {
    event: 'download_all_cards',
    timestamp: new Date().toISOString(),
    data: {
      cardCount,
    }
  };

  logEvent(event);
  console.log('[Analytics] Download all clicked:', cardCount);
}

/**
 * Get all analytics events
 */
export function getAnalyticsEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];

  const events: AnalyticsEvent[] = [];
  const keys = Object.keys(localStorage);

  keys.forEach(key => {
    if (key.startsWith(ANALYTICS_KEY_PREFIX)) {
      try {
        const event = JSON.parse(localStorage.getItem(key) || '{}');
        events.push(event);
      } catch (e) {
        console.error('[Analytics] Failed to parse event:', key);
      }
    }
  });

  return events.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Get Prove It click count
 */
export function getProveItClickCount(): number {
  const events = getAnalyticsEvents();
  return events.filter(e => e.event === 'prove_it_click').length;
}

/**
 * Export analytics data as JSON (for debugging/analysis)
 */
export function exportAnalytics(): string {
  const events = getAnalyticsEvents();
  return JSON.stringify(events, null, 2);
}

/**
 * Clear all analytics (for testing)
 */
export function clearAnalytics(): void {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(ANALYTICS_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });

  console.log('[Analytics] Cleared all analytics data');
}

// Private helper to log events to localStorage
function logEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  const key = `${ANALYTICS_KEY_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem(key, JSON.stringify(event));
}
