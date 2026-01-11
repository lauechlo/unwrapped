// A/B Testing Framework for Unwrapped V2
// Assigns users to test variants and tracks engagement metrics

export type TestVariant = 'A' | 'B';

export interface ABTest {
  testId: string;
  testName: string;
  description: string;
  variants: {
    A: string; // Description of variant A
    B: string; // Description of variant B
  };
  startDate: string;
  endDate?: string;
  active: boolean;
}

export interface ABTestAssignment {
  testId: string;
  variant: TestVariant;
  assignedAt: string;
}

export interface ABTestMetrics {
  testId: string;
  variant: TestVariant;

  // Engagement metrics
  thumbsUpCount: number;
  thumbsDownCount: number;
  npsScore?: number;
  timeOnPage?: number;
  shareCount?: number;

  // Behavioral metrics
  scrollDepth?: number;
  showProofClicks?: number;

  timestamp: string;
}

const STORAGE_KEY_ASSIGNMENTS = 'unwrapped_abtest_assignments';
const STORAGE_KEY_METRICS = 'unwrapped_abtest_metrics';

// Active A/B tests configuration
const ACTIVE_TESTS: ABTest[] = [
  {
    testId: 'narrative_tone_v1',
    testName: 'Narrative Tone',
    description: 'Test casual/relatable tone vs. scientific/academic tone',
    variants: {
      A: 'Casual, conversational tone with metaphors',
      B: 'Scientific tone with research citations',
    },
    startDate: '2025-01-03',
    active: true,
  },
  {
    testId: 'share_cta_v1',
    testName: 'Share CTA Position',
    description: 'Test share button placement (top vs. bottom)',
    variants: {
      A: 'Share button at top of card',
      B: 'Share button at bottom of card',
    },
    startDate: '2025-01-03',
    active: true,
  },
];

// Get user's assignment for a test (or create new assignment)
export function getTestVariant(testId: string): TestVariant {
  const test = ACTIVE_TESTS.find(t => t.testId === testId && t.active);

  if (!test) {
    console.warn(`[ABTest] Test ${testId} not found or inactive`);
    return 'A'; // Default to A
  }

  // Check existing assignment
  const assignments = getAssignments();
  const existing = assignments.find(a => a.testId === testId);

  if (existing) {
    return existing.variant;
  }

  // Create new assignment (50/50 split)
  const variant: TestVariant = Math.random() < 0.5 ? 'A' : 'B';

  const newAssignment: ABTestAssignment = {
    testId,
    variant,
    assignedAt: new Date().toISOString(),
  };

  assignments.push(newAssignment);
  saveAssignments(assignments);

  console.log(`[ABTest] Assigned to ${testId} variant ${variant}`);

  return variant;
}

// Get all test assignments
function getAssignments(): ABTestAssignment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[ABTest] Error reading assignments:', error);
    return [];
  }
}

// Save test assignments
function saveAssignments(assignments: ABTestAssignment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
  } catch (error) {
    console.error('[ABTest] Error saving assignments:', error);
  }
}

// Track A/B test metrics
export function trackABTestMetric(
  testId: string,
  metrics: Partial<Omit<ABTestMetrics, 'testId' | 'variant' | 'timestamp'>>
): void {
  const variant = getTestVariant(testId);

  const metric: ABTestMetrics = {
    testId,
    variant,
    thumbsUpCount: metrics.thumbsUpCount || 0,
    thumbsDownCount: metrics.thumbsDownCount || 0,
    npsScore: metrics.npsScore,
    timeOnPage: metrics.timeOnPage,
    shareCount: metrics.shareCount,
    scrollDepth: metrics.scrollDepth,
    showProofClicks: metrics.showProofClicks,
    timestamp: new Date().toISOString(),
  };

  const allMetrics = getAllMetrics();
  allMetrics.push(metric);
  saveMetrics(allMetrics);

  console.log(`[ABTest] Tracked metric for ${testId} variant ${variant}`, metrics);
}

// Get all metrics
function getAllMetrics(): ABTestMetrics[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_METRICS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[ABTest] Error reading metrics:', error);
    return [];
  }
}

// Save metrics
function saveMetrics(metrics: ABTestMetrics[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(metrics));
  } catch (error) {
    console.error('[ABTest] Error saving metrics:', error);
  }
}

// Get aggregated results for a test
export function getTestResults(testId: string) {
  const metrics = getAllMetrics().filter(m => m.testId === testId);

  const variantA = metrics.filter(m => m.variant === 'A');
  const variantB = metrics.filter(m => m.variant === 'B');

  const calculateStats = (variantMetrics: ABTestMetrics[]) => {
    if (variantMetrics.length === 0) {
      return {
        count: 0,
        thumbsUpRate: 0,
        avgNPS: null,
        avgTimeOnPage: null,
        avgShareCount: null,
      };
    }

    const totalThumbs = variantMetrics.reduce(
      (sum, m) => sum + m.thumbsUpCount + m.thumbsDownCount,
      0
    );
    const thumbsUp = variantMetrics.reduce((sum, m) => sum + m.thumbsUpCount, 0);
    const thumbsUpRate = totalThumbs > 0 ? (thumbsUp / totalThumbs) * 100 : 0;

    const npsScores = variantMetrics.filter(m => m.npsScore !== undefined).map(m => m.npsScore!);
    const avgNPS = npsScores.length > 0
      ? npsScores.reduce((sum, score) => sum + score, 0) / npsScores.length
      : null;

    const timesOnPage = variantMetrics.filter(m => m.timeOnPage !== undefined).map(m => m.timeOnPage!);
    const avgTimeOnPage = timesOnPage.length > 0
      ? timesOnPage.reduce((sum, time) => sum + time, 0) / timesOnPage.length
      : null;

    const shareCounts = variantMetrics.filter(m => m.shareCount !== undefined).map(m => m.shareCount!);
    const avgShareCount = shareCounts.length > 0
      ? shareCounts.reduce((sum, count) => sum + count, 0) / shareCounts.length
      : null;

    return {
      count: variantMetrics.length,
      thumbsUpRate: Math.round(thumbsUpRate),
      avgNPS: avgNPS ? Math.round(avgNPS * 10) / 10 : null,
      avgTimeOnPage: avgTimeOnPage ? Math.round(avgTimeOnPage) : null,
      avgShareCount: avgShareCount ? Math.round(avgShareCount * 10) / 10 : null,
    };
  };

  return {
    testId,
    variantA: calculateStats(variantA),
    variantB: calculateStats(variantB),
    totalSamples: metrics.length,
  };
}

// Get all active tests
export function getActiveTests(): ABTest[] {
  return ACTIVE_TESTS.filter(t => t.active);
}

// Export all A/B test data
export function exportABTestData(): string {
  const assignments = getAssignments();
  const metrics = getAllMetrics();

  const results = ACTIVE_TESTS.map(test => ({
    test,
    results: getTestResults(test.testId),
  }));

  return JSON.stringify({
    exportDate: new Date().toISOString(),
    activeTests: ACTIVE_TESTS,
    assignments,
    metrics,
    results,
  }, null, 2);
}

// Clear all A/B test data
export function clearABTestData(): void {
  localStorage.removeItem(STORAGE_KEY_ASSIGNMENTS);
  localStorage.removeItem(STORAGE_KEY_METRICS);
  console.log('[ABTest] All A/B test data cleared');
}
