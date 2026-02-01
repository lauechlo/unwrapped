'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

const PERSONAS = {
  loyalist: {
    icon: '💎',
    name: 'The Loyalist',
    tagline: 'You found your people, and you\'re never letting go',
    description: 'You build deep, sustained relationships with artists over time. High completion rates and low skip rates reveal intentional, devoted listening. You don\'t chase trends—you commit to artists who resonate.',
  },
  explorer: {
    icon: '🔍',
    name: 'The Explorer',
    tagline: 'Always hunting for the next musical gem',
    description: 'Your library grows constantly. New artists, new genres, new sounds - you\'re never satisfied with what you already know. The thrill is in discovery.',
  },
  ritualist: {
    icon: '🕐',
    name: 'The Ritualist',
    tagline: 'Your soundtrack runs on a schedule',
    description: 'Morning coffee playlist. Workout bangers. Sunday wind-down vibes. You\'ve built rituals around your music, and your day follows the beat.',
  },
  'emotional-processor': {
    icon: '🎭',
    name: 'The Emotional Processor',
    tagline: 'Music is how you feel your feelings',
    description: 'When life gets heavy, you press repeat. Certain songs become emotional anchors - you loop them until you\'ve processed what you need to process.',
  },
  curator: {
    icon: '🎨',
    name: 'The Curator',
    tagline: 'You don\'t shuffle - you curate',
    description: 'Every playlist is a mood, every queue is a story. You think about what comes next, what fits the vibe. Listening isn\'t passive for you - it\'s an art.',
  },
  nostalgist: {
    icon: '⏮️',
    name: 'The Nostalgist',
    tagline: 'Your music is a time machine',
    description: 'Certain songs transport you back instantly. You return to old favorites not just for the sound, but for the memories they hold.',
  },
};

export default function SharePersonaPage() {
  const params = useParams();
  const id = params.id as string;

  const persona = PERSONAS[id as keyof typeof PERSONAS];

  if (!persona) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Unwrapped Persona
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            This persona was shared from someone's Spotify analysis
          </p>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 mb-8">
            <p className="text-gray-400 mb-6">
              Want to discover your listening archetype?
            </p>
            <Link
              href="/extended"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all"
            >
              Find Your Persona →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-purple-500/20 border border-purple-500/40 px-4 py-2 rounded-full text-sm mb-4">
            Shared Persona
          </div>
          <h1 className="text-3xl font-bold mb-2">People Like Me</h1>
          <p className="text-gray-400">From Unwrapped V2 Analysis</p>
        </div>

        {/* Persona Card */}
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/40 rounded-xl p-12 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="text-7xl">{persona.icon}</div>
            <div>
              <div className="text-sm text-purple-300 mb-2">YOU ARE MOST LIKE</div>
              <h2 className="text-4xl font-bold">{persona.name}</h2>
            </div>
          </div>

          <p className="text-2xl italic text-gray-300 mb-6">
            "{persona.tagline}"
          </p>

          <p className="text-lg text-gray-300 leading-relaxed">
            {persona.description}
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/40 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">What's Your Persona?</h2>
          <p className="text-gray-300 mb-6">
            Upload your Extended Streaming History to discover your listening archetype
          </p>
          <Link
            href="/extended"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all"
          >
            Find Out →
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Based on music cognition research (Rentfrow & Gosling, 2003)</p>
          <p className="mt-2">Made with ✨ by Chloe</p>
        </div>
      </div>
    </div>
  );
}
