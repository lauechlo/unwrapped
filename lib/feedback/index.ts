// Feedback Tracking Utility for Unwrapped V2
// Stores user feedback in localStorage and provides export functionality

export interface NarrativeFeedback {
  narrativeId: string;
  narrativeTitle: string;
  patternFamily: string;
  thumbs?: 'up' | 'down';
  reason?: string;
  timestamp: string;
}

export interface NPSFeedback {
  score: number; // 0-10
  comment?: string;
  timestamp: string;
}

export interface FeedbackSession {
  sessionId: string;
  timestamp: string;
  narrativeFeedback: NarrativeFeedback[];
  npsFeedback?: NPSFeedback;

  // Behavioral metrics
  timeOnPage?: number;
  scrollDepth?: number;
  sharesCompleted?: number;
  showProofClicks?: number;
}

const STORAGE_KEY = 'unwrapped_feedback_v1';

// Generate a unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get current session ID (or create new one)
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem('unwrapped_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('unwrapped_session_id', sessionId);
  }
  return sessionId;
}

// Get current session from localStorage
function getCurrentSession(): FeedbackSession {
  const sessionId = getSessionId();
  const allSessions = getAllSessions();

  let currentSession = allSessions.find(s => s.sessionId === sessionId);

  if (!currentSession) {
    currentSession = {
      sessionId,
      timestamp: new Date().toISOString(),
      narrativeFeedback: [],
    };
    allSessions.push(currentSession);
    saveSessions(allSessions);
  }

  return currentSession;
}

// Get all feedback sessions
function getAllSessions(): FeedbackSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Feedback] Error reading storage:', error);
    return [];
  }
}

// Save all sessions
function saveSessions(sessions: FeedbackSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('[Feedback] Error saving storage:', error);
  }
}

// Track narrative feedback (thumbs up/down)
export function trackNarrativeFeedback(
  narrativeId: string,
  narrativeTitle: string,
  patternFamily: string,
  thumbs: 'up' | 'down',
  reason?: string
): void {
  const session = getCurrentSession();

  // Remove existing feedback for this narrative (allow updates)
  session.narrativeFeedback = session.narrativeFeedback.filter(
    f => f.narrativeId !== narrativeId
  );

  // Add new feedback
  session.narrativeFeedback.push({
    narrativeId,
    narrativeTitle,
    patternFamily,
    thumbs,
    reason,
    timestamp: new Date().toISOString(),
  });

  // Save
  const allSessions = getAllSessions();
  const sessionIndex = allSessions.findIndex(s => s.sessionId === session.sessionId);
  if (sessionIndex >= 0) {
    allSessions[sessionIndex] = session;
  } else {
    allSessions.push(session);
  }
  saveSessions(allSessions);

  console.log('[Feedback] Narrative feedback recorded:', {
    narrativeTitle,
    thumbs,
    reason,
  });
}

// Track NPS feedback
export function trackNPSFeedback(score: number, comment?: string): void {
  const session = getCurrentSession();

  session.npsFeedback = {
    score,
    comment,
    timestamp: new Date().toISOString(),
  };

  // Save
  const allSessions = getAllSessions();
  const sessionIndex = allSessions.findIndex(s => s.sessionId === session.sessionId);
  if (sessionIndex >= 0) {
    allSessions[sessionIndex] = session;
  } else {
    allSessions.push(session);
  }
  saveSessions(allSessions);

  console.log('[Feedback] NPS feedback recorded:', { score, comment });
}

// Track behavioral metrics
export function trackBehavioralMetrics(metrics: {
  timeOnPage?: number;
  scrollDepth?: number;
  sharesCompleted?: number;
  showProofClicks?: number;
}): void {
  const session = getCurrentSession();

  // Update metrics
  Object.assign(session, metrics);

  // Save
  const allSessions = getAllSessions();
  const sessionIndex = allSessions.findIndex(s => s.sessionId === session.sessionId);
  if (sessionIndex >= 0) {
    allSessions[sessionIndex] = session;
  }
  saveSessions(allSessions);
}

// Get feedback summary statistics
export function getFeedbackSummary() {
  const sessions = getAllSessions();

  const totalSessions = sessions.length;
  const narrativeFeedbackCount = sessions.reduce(
    (sum, s) => sum + s.narrativeFeedback.length,
    0
  );

  const thumbsUp = sessions.reduce(
    (sum, s) => sum + s.narrativeFeedback.filter(f => f.thumbs === 'up').length,
    0
  );

  const thumbsDown = sessions.reduce(
    (sum, s) => sum + s.narrativeFeedback.filter(f => f.thumbs === 'down').length,
    0
  );

  const accuracyRate = narrativeFeedbackCount > 0
    ? (thumbsUp / narrativeFeedbackCount) * 100
    : 0;

  const npsScores = sessions
    .filter(s => s.npsFeedback)
    .map(s => s.npsFeedback!.score);

  const avgNPS = npsScores.length > 0
    ? npsScores.reduce((sum, score) => sum + score, 0) / npsScores.length
    : null;

  // Calculate NPS (% promoters - % detractors)
  const promoters = npsScores.filter(s => s >= 9).length;
  const passives = npsScores.filter(s => s >= 7 && s <= 8).length;
  const detractors = npsScores.filter(s => s <= 6).length;
  const npsScore = npsScores.length > 0
    ? ((promoters - detractors) / npsScores.length) * 100
    : null;

  return {
    totalSessions,
    narrativeFeedbackCount,
    thumbsUp,
    thumbsDown,
    accuracyRate: Math.round(accuracyRate),
    npsResponses: npsScores.length,
    avgNPS: avgNPS ? Math.round(avgNPS * 10) / 10 : null,
    npsScore: npsScore ? Math.round(npsScore) : null,
    promoters,
    passives,
    detractors,
  };
}

// Export feedback data as JSON
export function exportFeedbackData(): string {
  const sessions = getAllSessions();
  const summary = getFeedbackSummary();

  return JSON.stringify({
    exportDate: new Date().toISOString(),
    summary,
    sessions,
  }, null, 2);
}

// Download feedback data as file
export function downloadFeedbackData(): void {
  const data = exportFeedbackData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `unwrapped-feedback-${Date.now()}.json`;
  link.click();

  URL.revokeObjectURL(url);

  console.log('[Feedback] Data exported');
}

// Clear all feedback data (for testing)
export function clearFeedbackData(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem('unwrapped_session_id');
  console.log('[Feedback] All data cleared');
}
