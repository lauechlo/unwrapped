// Narrative Tone Variants for A/B Testing
// Variant A: Casual, conversational tone with metaphors
// Variant B: Scientific tone with research citations

import { PatternFamily } from '../types';

export type NarrativeTone = 'casual' | 'scientific';

interface ToneVariants {
  casual: {
    intro: string;
    body: string;
    conclusion: string;
  };
  scientific: {
    intro: string;
    body: string;
    conclusion: string;
  };
}

// Tone templates by pattern family
export const TONE_VARIANTS: Record<PatternFamily, ToneVariants> = {
  'loyalty_dropoff': {
    casual: {
      intro: "You found THE song, and you couldn't let go",
      body: "While everyone else plays the hits, you're on repeat with track 7. Something about it just hit different - so you played it until you memorized every breath, every note.",
      conclusion: "You don't just listen - you inhabit songs",
    },
    scientific: {
      intro: "Intensive single-track repetition detected",
      body: "Data shows hyperfocus on specific tracks (Levitin, 2006). This pattern suggests deep processing for personal meaning-making or emotional resolution through auditory engagement.",
      conclusion: "Track looping indicates psychological significance",
    },
  },
  'loyalty_retention': {
    casual: {
      intro: "You found your people - and you stuck with them",
      body: "While others chase the new, you go deep. Your top artists aren't just favorites - they're companions. You've explored their entire discography, not just the hits.",
      conclusion: "Loyalty is your listening superpower",
    },
    scientific: {
      intro: "High artist-specific engagement detected",
      body: "Your listening data demonstrates sustained parasocial attachment (Rentfrow & Gosling, 2003). Repeated exposure patterns indicate identity-reinforcing behaviors through musical preferences.",
      conclusion: "Artist loyalty correlates with self-concept stability",
    },
  },
  'temporal': {
    casual: {
      intro: "Your soundtrack runs on a schedule",
      body: "Morning coffee playlist. Workout bangers. Sunday wind-down vibes. You've built rituals around your music, and your day follows the beat.",
      conclusion: "Music structures your daily rhythm",
    },
    scientific: {
      intro: "Circadian listening patterns identified",
      body: "Temporal analysis shows consistent music consumption aligned with daily routines (DeNora, 2000). Your listening behaviors demonstrate environmental scaffolding through auditory cues.",
      conclusion: "Music functions as temporal organization tool",
    },
  },
  'diversity': {
    casual: {
      intro: "You're a music explorer, always hunting for the next gem",
      body: "Your library grows constantly. New artists, new genres, new sounds - you're never satisfied with what you already know. The thrill is in discovery.",
      conclusion: "Curiosity drives your musical journey",
    },
    scientific: {
      intro: "Elevated discovery rate patterns identified",
      body: "Data shows high novelty-seeking behavior in music consumption (Rentfrow & Gosling, 2003). Your exploration patterns correlate with openness to experience and cognitive engagement.",
      conclusion: "Discovery velocity indicates personality trait expression",
    },
  },
  'repetition': {
    casual: {
      intro: "Music is how you feel your feelings",
      body: "When life gets heavy, you press repeat. Certain songs become emotional anchors - you loop them until you've processed what you need to process.",
      conclusion: "You use music as emotional therapy",
    },
    scientific: {
      intro: "Mood regulation through repetition detected",
      body: "Analysis reveals strategic use of music for emotional self-regulation (Saarikallio, 2007). Looping behaviors indicate rumination processing or affective state management.",
      conclusion: "Music serves a psychological coping function",
    },
  },
  'behavioral': {
    casual: {
      intro: "You don't shuffle - you curate",
      body: "Every playlist is a mood, every queue is a story. You think about what comes next, what fits the vibe. Listening isn't passive for you - it's an art.",
      conclusion: "You're not just a listener - you're a curator",
    },
    scientific: {
      intro: "High curation effort detected",
      body: "Playlist construction patterns show deliberate song sequencing and thematic coherence (DeNora, 2000). Your listening demonstrates active engagement rather than passive consumption.",
      conclusion: "Curation behavior indicates metacognitive processing",
    },
  },
  'evolution': {
    casual: {
      intro: "You're a time traveler through music",
      body: "Your listening patterns show clear boundaries - like musical chapters in your life. Whether it's summer anthems or winter vibes, you mark moments with sound.",
      conclusion: "Music is your personal time capsule",
    },
    scientific: {
      intro: "Temporal pattern clustering detected",
      body: "Analysis reveals statistically significant temporal boundaries in your listening behavior (DeNora, 2000). Your music consumption demonstrates autobiographical memory encoding through sonic markers.",
      conclusion: "Music functions as a mnemonic device for life events",
    },
  },
};

// Generate narrative text with specified tone
export function generateNarrativeWithTone(
  patternFamily: PatternFamily,
  tone: NarrativeTone,
  baseTitle: string,
  baseStats: string
): {
  title: string;
  intro: string;
  body: string;
  conclusion: string;
} {
  const variants = TONE_VARIANTS[patternFamily];

  if (!variants) {
    console.warn(`[ToneVariants] No variants for pattern family: ${patternFamily}`);
    return {
      title: baseTitle,
      intro: baseStats,
      body: '',
      conclusion: '',
    };
  }

  const toneVariant = tone === 'casual' ? variants.casual : variants.scientific;

  return {
    title: tone === 'casual' ? baseTitle : `${baseTitle}: Research Perspective`,
    intro: toneVariant.intro,
    body: `${baseStats}\n\n${toneVariant.body}`,
    conclusion: toneVariant.conclusion,
  };
}

// Helper to get tone label for UI
export function getToneLabel(tone: NarrativeTone): string {
  return tone === 'casual' ? 'Conversational' : 'Scientific';
}
