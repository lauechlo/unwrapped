/**
 * Response Parser
 * Parses Claude API responses into structured data
 */

export interface HeroInsight {
  headline: string;
  subtext: string;
}

export interface ListeningDNA {
  temporalPattern: {
    label: string;
    evidence: string;
  };
  emotionalStrategy: {
    label: string;
    evidence: string;
  };
  discoveryMode: {
    label: string;
    evidence: string;
  };
  attachmentStyle: {
    label: string;
    evidence: string;
  };
}

export function parseHeroInsight(response: string): HeroInsight {
  try {
    const json = JSON.parse(response);
    return {
      headline: sanitize(json.headline) || 'Your music tells a story',
      subtext: sanitize(json.subtext) || 'Here\'s what we found.'
    };
  } catch (e) {
    console.error('[Parser] Failed to parse hero insight:', e);
    // Fallback parsing
    const lines = response.split('\n').filter(l => l.trim());
    return {
      headline: sanitize(lines[0]) || 'Your music tells a story',
      subtext: sanitize(lines.slice(1).join(' ')) || 'Here\'s what we found.'
    };
  }
}

export function parseListeningDNA(response: string): ListeningDNA {
  try {
    const json = JSON.parse(response);
    return {
      temporalPattern: json.temporalPattern || defaultDimension('Listener'),
      emotionalStrategy: json.emotionalStrategy || defaultDimension('Music User'),
      discoveryMode: json.discoveryMode || defaultDimension('Explorer'),
      attachmentStyle: json.attachmentStyle || defaultDimension('Connected')
    };
  } catch (e) {
    console.error('[Parser] Failed to parse listening DNA:', e);
    return defaultListeningDNA();
  }
}

function sanitize(text: string): string {
  if (!text) return '';

  // Remove potential AI-isms that slipped through
  const badPhrases = [
    'As an AI',
    'I don\'t have access',
    'I cannot',
    'I\'d be happy to',
  ];

  let result = text;
  for (const phrase of badPhrases) {
    result = result.replace(new RegExp(phrase, 'gi'), '');
  }

  return result.trim();
}

function defaultDimension(label: string) {
  return {
    label,
    evidence: 'Based on your listening patterns.'
  };
}

function defaultListeningDNA(): ListeningDNA {
  return {
    temporalPattern: defaultDimension('Music Listener'),
    emotionalStrategy: defaultDimension('Music User'),
    discoveryMode: defaultDimension('Explorer'),
    attachmentStyle: defaultDimension('Connected')
  };
}
