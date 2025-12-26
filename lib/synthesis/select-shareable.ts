/**
 * Select the 4 most shareable pattern cards for Instagram Stories
 *
 * Criteria:
 * 1. Different psychological dimensions (ensure variety)
 * 2. Highest confidence scores
 * 3. Specific artist/track names (more viral)
 */

import type { PatternCard } from './types';

/**
 * Score a card for shareability
 */
function calculateShareabilityScore(card: PatternCard): number {
  let score = card.confidence;

  // Bonus for specific artist/track names (look for quotes or capitalized names)
  const hasQuotes = card.patternLabel.includes('"') || card.core.includes('"');
  if (hasQuotes) {
    score += 0.1;
  }

  // Bonus for provocative language in callout
  const provocativeWords = ['POV:', 'therapy', 'disorder', 'chokehold', 'obsessed', 'addiction'];
  const hasProvocativeLanguage = provocativeWords.some(word =>
    card.callout.toLowerCase().includes(word.toLowerCase())
  );
  if (hasProvocativeLanguage) {
    score += 0.05;
  }

  return Math.min(score, 1.0);
}

/**
 * Select 4 best cards for sharing
 * Ensures different dimensions and high shareability
 */
export function selectShareableCards(cards: PatternCard[]): PatternCard[] {
  if (cards.length <= 4) {
    return cards;
  }

  // Score all cards for shareability
  const scoredCards = cards.map(card => ({
    card,
    shareabilityScore: calculateShareabilityScore(card)
  }));

  // Sort by shareability score (descending)
  scoredCards.sort((a, b) => b.shareabilityScore - a.shareabilityScore);

  // Select top 4 with dimension diversity
  const selected: PatternCard[] = [];
  const usedDimensions = new Set<string>();

  for (const { card } of scoredCards) {
    // Skip if we already have a card from this dimension
    if (usedDimensions.has(card.dimension.toLowerCase())) {
      continue;
    }

    selected.push(card);
    usedDimensions.add(card.dimension.toLowerCase());

    // Stop when we have 4 cards
    if (selected.length === 4) {
      break;
    }
  }

  // If we couldn't get 4 unique dimensions, fill remaining slots with highest scored cards
  if (selected.length < 4) {
    for (const { card } of scoredCards) {
      if (!selected.includes(card)) {
        selected.push(card);
        if (selected.length === 4) {
          break;
        }
      }
    }
  }

  console.log(`[Card Selection] Selected ${selected.length} shareable cards from ${cards.length} total`);
  console.log(`  Dimensions: ${selected.map(c => c.dimension).join(', ')}`);

  return selected;
}
