/**
 * Artist-specific color themes for pattern cards
 * Makes each card visually match the artist/content it's about
 */

export interface ArtistTheme {
  gradient: string; // Tailwind gradient classes
  border: string; // Border color
  badge: string; // Confidence badge color
  accent: string; // Accent color for text/icons
  neonAccent: string; // Hex color for neon glow effects in share cards
}

const artistThemes: Record<string, ArtistTheme> = {
  // EXAMPLE CARDS - Bright gradients for homepage previews (full opacity for visibility)
  'phoebe bridgers 2am spiral': {
    gradient: 'from-pink-700 via-rose-800 to-pink-900', // Bright pink gradient
    border: 'border-pink-400/50 hover:border-rose-400/70',
    badge: 'bg-pink-500/20 border-pink-400/50 text-pink-300',
    accent: 'text-pink-300',
    neonAccent: '#ec4899' // Pink neon
  },

  'arctic monkeys time machine': {
    gradient: 'from-purple-700 via-violet-800 to-purple-900', // Bright purple gradient
    border: 'border-purple-400/50 hover:border-violet-400/70',
    badge: 'bg-purple-500/20 border-purple-400/50 text-purple-300',
    accent: 'text-purple-300',
    neonAccent: '#a855f7' // Purple neon
  },

  'taylor swift / billie eilish oscillation': {
    gradient: 'from-blue-700 via-cyan-800 to-blue-900', // Bright blue gradient
    border: 'border-blue-400/50 hover:border-cyan-400/70',
    badge: 'bg-blue-500/20 border-blue-400/50 text-blue-300',
    accent: 'text-blue-300',
    neonAccent: '#3b82f6' // Blue neon
  },

  // Wicked
  'wicked': {
    gradient: 'from-green-900/40 via-pink-900/40 to-black',
    border: 'border-green-500/30 hover:border-pink-500/50',
    badge: 'bg-green-500/10 border-green-500/30 text-green-400',
    accent: 'text-green-400',
    neonAccent: '#22c55e' // Bright green neon
  },

  // PinkPantheress
  'pinkpantheress': {
    gradient: 'from-pink-900/40 via-purple-900/40 to-black',
    border: 'border-pink-500/30 hover:border-purple-500/50',
    badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    accent: 'text-pink-400',
    neonAccent: '#f472b6' // Hot pink neon
  },

  // Sabrina Carpenter
  'sabrina': {
    gradient: 'from-blue-900/40 via-cyan-900/40 to-black',
    border: 'border-blue-500/30 hover:border-cyan-500/50',
    badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    accent: 'text-blue-400',
    neonAccent: '#3b82f6' // Bright blue neon
  },

  // Taylor Swift
  'taylor': {
    gradient: 'from-purple-900/40 via-indigo-900/40 to-black',
    border: 'border-purple-500/30 hover:border-indigo-500/50',
    badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    accent: 'text-purple-400',
    neonAccent: '#a855f7' // Purple neon
  },

  // Ariana Grande
  'ariana': {
    gradient: 'from-rose-900/40 via-pink-900/40 to-black',
    border: 'border-rose-500/30 hover:border-pink-500/50',
    badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    accent: 'text-rose-400',
    neonAccent: '#ec4899' // Rose/pink neon
  },

  // Lana Del Rey
  'lana': {
    gradient: 'from-red-900/40 via-orange-900/40 to-black',
    border: 'border-red-500/30 hover:border-orange-500/50',
    badge: 'bg-red-500/10 border-red-500/30 text-red-400',
    accent: 'text-red-400',
    neonAccent: '#ef4444' // Red neon
  },

  // FLETCHER
  'fletcher': {
    gradient: 'from-violet-900/40 via-fuchsia-900/40 to-black',
    border: 'border-violet-500/30 hover:border-fuchsia-500/50',
    badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    accent: 'text-violet-400',
    neonAccent: '#8b5cf6' // Violet neon
  },

  // Alessia Cara
  'alessia': {
    gradient: 'from-teal-900/40 via-emerald-900/40 to-black',
    border: 'border-teal-500/30 hover:border-emerald-500/50',
    badge: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    accent: 'text-teal-400',
    neonAccent: '#14b8a6' // Teal neon
  },

  // Olivia Rodrigo
  'olivia': {
    gradient: 'from-purple-900/40 via-pink-900/40 to-black',
    border: 'border-purple-500/30 hover:border-pink-500/50',
    badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    accent: 'text-purple-400',
    neonAccent: '#a855f7' // Purple neon
  },

  // Billie Eilish
  'billie': {
    gradient: 'from-lime-900/40 via-green-900/40 to-black',
    border: 'border-lime-500/30 hover:border-green-500/50',
    badge: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
    accent: 'text-lime-400',
    neonAccent: '#84cc16' // Lime neon
  },

  // Chappell Roan
  'chappell': {
    gradient: 'from-orange-900/40 via-red-900/40 to-black',
    border: 'border-orange-500/30 hover:border-red-500/50',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    accent: 'text-orange-400',
    neonAccent: '#f97316' // Orange neon
  },

  // SZA
  'sza': {
    gradient: 'from-amber-900/40 via-yellow-900/40 to-black',
    border: 'border-amber-500/30 hover:border-yellow-500/50',
    badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    accent: 'text-amber-400',
    neonAccent: '#f59e0b' // Amber neon
  },

  // The Weeknd
  'weeknd': {
    gradient: 'from-red-900/40 via-black to-black',
    border: 'border-red-500/30 hover:border-red-600/50',
    badge: 'bg-red-500/10 border-red-500/30 text-red-400',
    accent: 'text-red-400',
    neonAccent: '#dc2626' // Dark red neon
  },

  // Doja Cat
  'doja': {
    gradient: 'from-fuchsia-900/40 via-pink-900/40 to-black',
    border: 'border-fuchsia-500/30 hover:border-pink-500/50',
    badge: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400',
    accent: 'text-fuchsia-400',
    neonAccent: '#d946ef' // Fuchsia neon
  },

  // Gracie Abrams
  'gracie': {
    gradient: 'from-sky-900/40 via-blue-900/40 to-black',
    border: 'border-sky-500/30 hover:border-blue-500/50',
    badge: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    accent: 'text-sky-400',
    neonAccent: '#0ea5e9' // Sky neon
  },

  // Charli XCX
  'charli': {
    gradient: 'from-lime-900/40 via-green-900/40 to-black',
    border: 'border-lime-500/30 hover:border-green-500/50',
    badge: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
    accent: 'text-lime-400',
    neonAccent: '#84cc16' // Lime neon
  },

  // Travis Scott
  'travis': {
    gradient: 'from-orange-900/40 via-amber-900/40 to-black',
    border: 'border-orange-500/30 hover:border-amber-500/50',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    accent: 'text-orange-400',
    neonAccent: '#f97316' // Orange neon
  },

  // Drake
  'drake': {
    gradient: 'from-yellow-900/40 via-amber-900/40 to-black',
    border: 'border-yellow-500/30 hover:border-amber-500/50',
    badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    accent: 'text-yellow-400',
    neonAccent: '#eab308' // Yellow neon
  },

  // Bad Bunny
  'bad bunny': {
    gradient: 'from-pink-900/40 via-red-900/40 to-black',
    border: 'border-pink-500/30 hover:border-red-500/50',
    badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    accent: 'text-pink-400',
    neonAccent: '#ec4899' // Pink neon
  },

  // Harry Styles
  'harry': {
    gradient: 'from-indigo-900/40 via-purple-900/40 to-black',
    border: 'border-indigo-500/30 hover:border-purple-500/50',
    badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    accent: 'text-indigo-400',
    neonAccent: '#6366f1' // Indigo neon
  },

  // Dua Lipa
  'dua': {
    gradient: 'from-fuchsia-900/40 via-purple-900/40 to-black',
    border: 'border-fuchsia-500/30 hover:border-purple-500/50',
    badge: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400',
    accent: 'text-fuchsia-400',
    neonAccent: '#d946ef' // Fuchsia neon
  },

  // Post Malone
  'post malone': {
    gradient: 'from-slate-900/40 via-zinc-900/40 to-black',
    border: 'border-slate-500/30 hover:border-zinc-500/50',
    badge: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    accent: 'text-slate-400',
    neonAccent: '#64748b' // Slate neon
  },

  // Kendrick Lamar
  'kendrick': {
    gradient: 'from-red-900/40 via-orange-900/40 to-black',
    border: 'border-red-500/30 hover:border-orange-500/50',
    badge: 'bg-red-500/10 border-red-500/30 text-red-400',
    accent: 'text-red-400',
    neonAccent: '#dc2626' // Red neon
  },

  // Rihanna
  'rihanna': {
    gradient: 'from-rose-900/40 via-red-900/40 to-black',
    border: 'border-rose-500/30 hover:border-red-500/50',
    badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    accent: 'text-rose-400',
    neonAccent: '#f43f5e' // Rose neon
  },

  // Ed Sheeran
  'ed sheeran': {
    gradient: 'from-orange-900/40 via-yellow-900/40 to-black',
    border: 'border-orange-500/30 hover:border-yellow-500/50',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    accent: 'text-orange-400',
    neonAccent: '#fb923c' // Orange neon
  },

  // Beyoncé
  'beyonce': {
    gradient: 'from-yellow-900/40 via-amber-900/40 to-black',
    border: 'border-yellow-500/30 hover:border-amber-500/50',
    badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    accent: 'text-yellow-400',
    neonAccent: '#fbbf24' // Golden neon
  },

  // Mitski
  'mitski': {
    gradient: 'from-rose-900/40 via-pink-900/40 to-black',
    border: 'border-rose-500/30 hover:border-pink-500/50',
    badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    accent: 'text-rose-400',
    neonAccent: '#fb7185' // Rose neon
  },

  // Phoebe Bridgers
  'phoebe': {
    gradient: 'from-slate-900/40 via-gray-900/40 to-black',
    border: 'border-slate-500/30 hover:border-gray-500/50',
    badge: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    accent: 'text-slate-400',
    neonAccent: '#94a3b8' // Slate neon
  },

  // Conan Gray
  'conan': {
    gradient: 'from-cyan-900/40 via-blue-900/40 to-black',
    border: 'border-cyan-500/30 hover:border-blue-500/50',
    badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    accent: 'text-cyan-400',
    neonAccent: '#06b6d4' // Cyan neon
  },

  // Lorde
  'lorde': {
    gradient: 'from-indigo-900/40 via-violet-900/40 to-black',
    border: 'border-indigo-500/30 hover:border-violet-500/50',
    badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    accent: 'text-indigo-400',
    neonAccent: '#6366f1' // Indigo neon
  },

  // Troye Sivan
  'troye': {
    gradient: 'from-blue-900/40 via-indigo-900/40 to-black',
    border: 'border-blue-500/30 hover:border-indigo-500/50',
    badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    accent: 'text-blue-400',
    neonAccent: '#3b82f6' // Blue neon
  },

  // Frank Ocean
  'frank ocean': {
    gradient: 'from-orange-900/40 via-red-900/40 to-black',
    border: 'border-orange-500/30 hover:border-red-500/50',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    accent: 'text-orange-400',
    neonAccent: '#f97316' // Orange neon
  },

  // Tame Impala
  'tame impala': {
    gradient: 'from-purple-900/40 via-fuchsia-900/40 to-black',
    border: 'border-purple-500/30 hover:border-fuchsia-500/50',
    badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    accent: 'text-purple-400',
    neonAccent: '#a855f7' // Purple neon
  },

  // Arctic Monkeys
  'arctic monkeys': {
    gradient: 'from-gray-900/40 via-slate-900/40 to-black',
    border: 'border-gray-500/30 hover:border-slate-500/50',
    badge: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
    accent: 'text-gray-400',
    neonAccent: '#9ca3af' // Gray neon
  },

  // Mac Miller
  'mac miller': {
    gradient: 'from-blue-900/40 via-cyan-900/40 to-black',
    border: 'border-blue-500/30 hover:border-cyan-500/50',
    badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    accent: 'text-blue-400',
    neonAccent: '#06b6d4' // Cyan neon
  },

  // Tate McRae
  'tate': {
    gradient: 'from-violet-900/40 via-pink-900/40 to-black',
    border: 'border-violet-500/30 hover:border-pink-500/50',
    badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    accent: 'text-violet-400',
    neonAccent: '#8b5cf6' // Violet neon
  },

  // Maisie Peters
  'maisie': {
    gradient: 'from-rose-900/40 via-orange-900/40 to-black',
    border: 'border-rose-500/30 hover:border-orange-500/50',
    badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    accent: 'text-rose-400',
    neonAccent: '#f43f5e' // Rose neon
  },

  // Reneé Rapp
  'renee': {
    gradient: 'from-red-900/40 via-pink-900/40 to-black',
    border: 'border-red-500/30 hover:border-pink-500/50',
    badge: 'bg-red-500/10 border-red-500/30 text-red-400',
    accent: 'text-red-400',
    neonAccent: '#ef4444' // Red neon
  },

  // Ice Spice
  'ice spice': {
    gradient: 'from-orange-900/40 via-amber-900/40 to-black',
    border: 'border-orange-500/30 hover:border-amber-500/50',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    accent: 'text-orange-400',
    neonAccent: '#f97316' // Orange neon
  },

  // Tyla
  'tyla': {
    gradient: 'from-amber-900/40 via-orange-900/40 to-black',
    border: 'border-amber-500/30 hover:border-orange-500/50',
    badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    accent: 'text-amber-400',
    neonAccent: '#f59e0b' // Amber neon
  },

  // Clairo
  'clairo': {
    gradient: 'from-green-900/40 via-teal-900/40 to-black',
    border: 'border-green-500/30 hover:border-teal-500/50',
    badge: 'bg-green-500/10 border-green-500/30 text-green-400',
    accent: 'text-green-400',
    neonAccent: '#10b981' // Green neon
  },

  // Girl in Red
  'girl in red': {
    gradient: 'from-red-900/40 via-rose-900/40 to-black',
    border: 'border-red-500/30 hover:border-rose-500/50',
    badge: 'bg-red-500/10 border-red-500/30 text-red-400',
    accent: 'text-red-400',
    neonAccent: '#dc2626' // Bright red neon
  },

  // The 1975
  'the 1975': {
    gradient: 'from-pink-900/40 via-fuchsia-900/40 to-black',
    border: 'border-pink-500/30 hover:border-fuchsia-500/50',
    badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    accent: 'text-pink-400',
    neonAccent: '#ec4899' // Pink neon
  },

  // Wallows
  'wallows': {
    gradient: 'from-blue-900/40 via-violet-900/40 to-black',
    border: 'border-blue-500/30 hover:border-violet-500/50',
    badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    accent: 'text-blue-400',
    neonAccent: '#3b82f6' // Blue neon
  },

  // Dayglow
  'dayglow': {
    gradient: 'from-yellow-900/40 via-orange-900/40 to-black',
    border: 'border-yellow-500/30 hover:border-orange-500/50',
    badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    accent: 'text-yellow-400',
    neonAccent: '#eab308' // Yellow neon
  },

  // Bleachers
  'bleachers': {
    gradient: 'from-sky-900/40 via-cyan-900/40 to-black',
    border: 'border-sky-500/30 hover:border-cyan-500/50',
    badge: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    accent: 'text-sky-400',
    neonAccent: '#0ea5e9' // Sky neon
  },

  // Brent Faiyaz
  'brent': {
    gradient: 'from-purple-900/40 via-violet-900/40 to-black',
    border: 'border-purple-500/30 hover:border-violet-500/50',
    badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    accent: 'text-purple-400',
    neonAccent: '#9333ea' // Purple neon
  },

  // Summer Walker
  'summer walker': {
    gradient: 'from-pink-900/40 via-purple-900/40 to-black',
    border: 'border-pink-500/30 hover:border-purple-500/50',
    badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    accent: 'text-pink-400',
    neonAccent: '#d946ef' // Fuchsia neon
  },

  // Jhené Aiko
  'jhene': {
    gradient: 'from-teal-900/40 via-cyan-900/40 to-black',
    border: 'border-teal-500/30 hover:border-cyan-500/50',
    badge: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    accent: 'text-teal-400',
    neonAccent: '#14b8a6' // Teal neon
  },

  // 6LACK
  '6lack': {
    gradient: 'from-gray-900/40 via-zinc-900/40 to-black',
    border: 'border-gray-500/30 hover:border-zinc-500/50',
    badge: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
    accent: 'text-gray-400',
    neonAccent: '#6b7280' // Gray neon
  },

  // Kehlani
  'kehlani': {
    gradient: 'from-emerald-900/40 via-green-900/40 to-black',
    border: 'border-emerald-500/30 hover:border-green-500/50',
    badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    accent: 'text-emerald-400',
    neonAccent: '#059669' // Emerald neon
  },

  // Tyler the Creator
  'tyler': {
    gradient: 'from-lime-900/40 via-green-900/40 to-black',
    border: 'border-lime-500/30 hover:border-green-500/50',
    badge: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
    accent: 'text-lime-400',
    neonAccent: '#84cc16' // Lime neon
  },

  // J. Cole
  'j cole': {
    gradient: 'from-amber-900/40 via-yellow-900/40 to-black',
    border: 'border-amber-500/30 hover:border-yellow-500/50',
    badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    accent: 'text-amber-400',
    neonAccent: '#f59e0b' // Amber neon
  },

  // 21 Savage
  '21 savage': {
    gradient: 'from-red-900/40 via-black to-black',
    border: 'border-red-500/30 hover:border-red-600/50',
    badge: 'bg-red-500/10 border-red-500/30 text-red-400',
    accent: 'text-red-400',
    neonAccent: '#b91c1c' // Dark red neon
  },

  // Megan Thee Stallion
  'megan': {
    gradient: 'from-orange-900/40 via-red-900/40 to-black',
    border: 'border-orange-500/30 hover:border-red-500/50',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    accent: 'text-orange-400',
    neonAccent: '#ea580c' // Deep orange neon
  },

  // Cardi B
  'cardi': {
    gradient: 'from-fuchsia-900/40 via-pink-900/40 to-black',
    border: 'border-fuchsia-500/30 hover:border-pink-500/50',
    badge: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400',
    accent: 'text-fuchsia-400',
    neonAccent: '#c026d3' // Fuchsia neon
  },

  // BTS
  'bts': {
    gradient: 'from-purple-900/40 via-pink-900/40 to-black',
    border: 'border-purple-500/30 hover:border-pink-500/50',
    badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    accent: 'text-purple-400',
    neonAccent: '#a855f7' // Purple neon
  },

  // BLACKPINK
  'blackpink': {
    gradient: 'from-pink-900/40 via-rose-900/40 to-black',
    border: 'border-pink-500/30 hover:border-rose-500/50',
    badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    accent: 'text-pink-400',
    neonAccent: '#f472b6' // Hot pink neon
  },

  // NewJeans
  'newjeans': {
    gradient: 'from-sky-900/40 via-blue-900/40 to-black',
    border: 'border-sky-500/30 hover:border-blue-500/50',
    badge: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    accent: 'text-sky-400',
    neonAccent: '#38bdf8' // Sky blue neon
  },

  // Stray Kids
  'stray kids': {
    gradient: 'from-red-900/40 via-orange-900/40 to-black',
    border: 'border-red-500/30 hover:border-orange-500/50',
    badge: 'bg-red-500/10 border-red-500/30 text-red-400',
    accent: 'text-red-400',
    neonAccent: '#f87171' // Light red neon
  },

  // Paramore
  'paramore': {
    gradient: 'from-orange-900/40 via-yellow-900/40 to-black',
    border: 'border-orange-500/30 hover:border-yellow-500/50',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    accent: 'text-orange-400',
    neonAccent: '#fb923c' // Orange neon
  },

  // The Neighbourhood
  'the neighbourhood': {
    gradient: 'from-gray-900/40 via-slate-900/40 to-black',
    border: 'border-gray-500/30 hover:border-slate-500/50',
    badge: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
    accent: 'text-gray-400',
    neonAccent: '#9ca3af' // Gray neon
  },

  // Cage the Elephant
  'cage the elephant': {
    gradient: 'from-lime-900/40 via-yellow-900/40 to-black',
    border: 'border-lime-500/30 hover:border-yellow-500/50',
    badge: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
    accent: 'text-lime-400',
    neonAccent: '#a3e635' // Lime neon
  },

  // Twenty One Pilots
  'twenty one pilots': {
    gradient: 'from-red-900/40 via-yellow-900/40 to-black',
    border: 'border-red-500/30 hover:border-yellow-500/50',
    badge: 'bg-red-500/10 border-red-500/30 text-red-400',
    accent: 'text-red-400',
    neonAccent: '#fbbf24' // Yellow neon
  },

  // Rosalía
  'rosalia': {
    gradient: 'from-rose-900/40 via-red-900/40 to-black',
    border: 'border-rose-500/30 hover:border-red-500/50',
    badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    accent: 'text-rose-400',
    neonAccent: '#fb7185' // Rose neon
  },

  // Peso Pluma
  'peso pluma': {
    gradient: 'from-green-900/40 via-lime-900/40 to-black',
    border: 'border-green-500/30 hover:border-lime-500/50',
    badge: 'bg-green-500/10 border-green-500/30 text-green-400',
    accent: 'text-green-400',
    neonAccent: '#22c55e' // Green neon
  },

  // Karol G
  'karol g': {
    gradient: 'from-pink-900/40 via-fuchsia-900/40 to-black',
    border: 'border-pink-500/30 hover:border-fuchsia-500/50',
    badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    accent: 'text-pink-400',
    neonAccent: '#e879f9' // Fuchsia neon
  },

  // Rauw Alejandro
  'rauw': {
    gradient: 'from-cyan-900/40 via-blue-900/40 to-black',
    border: 'border-cyan-500/30 hover:border-blue-500/50',
    badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    accent: 'text-cyan-400',
    neonAccent: '#22d3ee' // Cyan neon
  },

  // Justin Bieber
  'justin': {
    gradient: 'from-purple-900/40 via-blue-900/40 to-black',
    border: 'border-purple-500/30 hover:border-blue-500/50',
    badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    accent: 'text-purple-400',
    neonAccent: '#a78bfa' // Purple neon
  },

  // Selena Gomez
  'selena': {
    gradient: 'from-rose-900/40 via-pink-900/40 to-black',
    border: 'border-rose-500/30 hover:border-pink-500/50',
    badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    accent: 'text-rose-400',
    neonAccent: '#fda4af' // Light rose neon
  },

  // Shawn Mendes
  'shawn': {
    gradient: 'from-teal-900/40 via-green-900/40 to-black',
    border: 'border-teal-500/30 hover:border-green-500/50',
    badge: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    accent: 'text-teal-400',
    neonAccent: '#2dd4bf' // Teal neon
  },

  // Camila Cabello
  'camila': {
    gradient: 'from-yellow-900/40 via-amber-900/40 to-black',
    border: 'border-yellow-500/30 hover:border-amber-500/50',
    badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    accent: 'text-yellow-400',
    neonAccent: '#facc15' // Yellow neon
  },

  // Fleetwood Mac
  'fleetwood mac': {
    gradient: 'from-amber-900/40 via-orange-900/40 to-black',
    border: 'border-amber-500/30 hover:border-orange-500/50',
    badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    accent: 'text-amber-400',
    neonAccent: '#fbbf24' // Amber neon
  },

  // Queen
  'queen': {
    gradient: 'from-yellow-900/40 via-red-900/40 to-black',
    border: 'border-yellow-500/30 hover:border-red-500/50',
    badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    accent: 'text-yellow-400',
    neonAccent: '#f59e0b' // Golden neon
  },

  // David Bowie
  'bowie': {
    gradient: 'from-blue-900/40 via-red-900/40 to-black',
    border: 'border-blue-500/30 hover:border-red-500/50',
    badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    accent: 'text-blue-400',
    neonAccent: '#60a5fa' // Blue neon
  },

  // Radiohead
  'radiohead': {
    gradient: 'from-gray-900/40 via-blue-900/40 to-black',
    border: 'border-gray-500/30 hover:border-blue-500/50',
    badge: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
    accent: 'text-gray-400',
    neonAccent: '#cbd5e1' // Gray blue neon
  },

  // Nirvana
  'nirvana': {
    gradient: 'from-yellow-900/40 via-gray-900/40 to-black',
    border: 'border-yellow-500/30 hover:border-gray-500/50',
    badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    accent: 'text-yellow-400',
    neonAccent: '#fde047' // Bright yellow neon
  },

  // Coldplay
  'coldplay': {
    gradient: 'from-sky-900/40 via-yellow-900/40 to-black',
    border: 'border-sky-500/30 hover:border-yellow-500/50',
    badge: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    accent: 'text-sky-400',
    neonAccent: '#7dd3fc' // Sky neon
  },

  // Adele
  'adele': {
    gradient: 'from-amber-900/40 via-orange-900/40 to-black',
    border: 'border-amber-500/30 hover:border-orange-500/50',
    badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    accent: 'text-amber-400',
    neonAccent: '#fbbf24' // Golden neon
  },

  // Sam Smith
  'sam smith': {
    gradient: 'from-indigo-900/40 via-blue-900/40 to-black',
    border: 'border-indigo-500/30 hover:border-blue-500/50',
    badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    accent: 'text-indigo-400',
    neonAccent: '#818cf8' // Indigo neon
  },

  // Hozier
  'hozier': {
    gradient: 'from-green-900/40 via-amber-900/40 to-black',
    border: 'border-green-500/30 hover:border-amber-500/50',
    badge: 'bg-green-500/10 border-green-500/30 text-green-400',
    accent: 'text-green-400',
    neonAccent: '#4ade80' // Green neon
  },

  // Noah Kahan
  'noah kahan': {
    gradient: 'from-emerald-900/40 via-teal-900/40 to-black',
    border: 'border-emerald-500/30 hover:border-teal-500/50',
    badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    accent: 'text-emerald-400',
    neonAccent: '#34d399' // Emerald neon
  },

  // Lizzy McAlpine
  'lizzy': {
    gradient: 'from-sky-900/40 via-indigo-900/40 to-black',
    border: 'border-sky-500/30 hover:border-indigo-500/50',
    badge: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    accent: 'text-sky-400',
    neonAccent: '#0ea5e9' // Sky neon
  },

  // Kacey Musgraves
  'kacey': {
    gradient: 'from-pink-900/40 via-orange-900/40 to-black',
    border: 'border-pink-500/30 hover:border-orange-500/50',
    badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    accent: 'text-pink-400',
    neonAccent: '#f9a8d4' // Pink neon
  },

  // Zach Bryan
  'zach bryan': {
    gradient: 'from-orange-900/40 via-amber-900/40 to-black',
    border: 'border-orange-500/30 hover:border-amber-500/50',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    accent: 'text-orange-400',
    neonAccent: '#fb923c' // Orange neon
  },

  // Steve Lacy
  'steve lacy': {
    gradient: 'from-lime-900/40 via-emerald-900/40 to-black',
    border: 'border-lime-500/30 hover:border-emerald-500/50',
    badge: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
    accent: 'text-lime-400',
    neonAccent: '#bef264' // Lime neon
  },

  // Childish Gambino
  'gambino': {
    gradient: 'from-orange-900/40 via-red-900/40 to-black',
    border: 'border-orange-500/30 hover:border-red-500/50',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    accent: 'text-orange-400',
    neonAccent: '#f97316' // Orange neon
  },

  // Joji
  'joji': {
    gradient: 'from-pink-900/40 via-purple-900/40 to-black',
    border: 'border-pink-500/30 hover:border-purple-500/50',
    badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    accent: 'text-pink-400',
    neonAccent: '#f0abfc' // Light fuchsia neon
  },

  // Rex Orange County
  'rex orange county': {
    gradient: 'from-orange-900/40 via-yellow-900/40 to-black',
    border: 'border-orange-500/30 hover:border-yellow-500/50',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    accent: 'text-orange-400',
    neonAccent: '#fdba74' // Peach neon
  },

  // Daniel Caesar
  'daniel caesar': {
    gradient: 'from-violet-900/40 via-purple-900/40 to-black',
    border: 'border-violet-500/30 hover:border-purple-500/50',
    badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    accent: 'text-violet-400',
    neonAccent: '#c4b5fd' // Light violet neon
  },

  // Khalid
  'khalid': {
    gradient: 'from-blue-900/40 via-purple-900/40 to-black',
    border: 'border-blue-500/30 hover:border-purple-500/50',
    badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    accent: 'text-blue-400',
    neonAccent: '#60a5fa' // Blue neon
  },

  // Halsey
  'halsey': {
    gradient: 'from-cyan-900/40 via-purple-900/40 to-black',
    border: 'border-cyan-500/30 hover:border-purple-500/50',
    badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    accent: 'text-cyan-400',
    neonAccent: '#67e8f9' // Cyan neon
  },

  // Melanie Martinez
  'melanie': {
    gradient: 'from-pink-900/40 via-violet-900/40 to-black',
    border: 'border-pink-500/30 hover:border-violet-500/50',
    badge: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    accent: 'text-pink-400',
    neonAccent: '#f9a8d4' // Pastel pink neon
  },

  // Laufey
  'laufey': {
    gradient: 'from-emerald-900/40 via-teal-900/40 to-black',
    border: 'border-emerald-500/30 hover:border-teal-500/50',
    badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    accent: 'text-emerald-400',
    neonAccent: '#6ee7b7' // Mint neon
  },

  // beabadoobee
  'beabadoobee': {
    gradient: 'from-rose-900/40 via-orange-900/40 to-black',
    border: 'border-rose-500/30 hover:border-orange-500/50',
    badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    accent: 'text-rose-400',
    neonAccent: '#fda4af' // Light rose neon
  },

  // Default theme
  'default': {
    gradient: 'from-zinc-900 to-black',
    border: 'border-zinc-800 hover:border-green-500/30',
    badge: 'bg-green-500/10 border-green-500/30 text-green-400',
    accent: 'text-green-400',
    neonAccent: '#10b981' // Green neon
  }
};

/**
 * Generate a deterministic color theme from any string (artist name)
 * Uses string hashing to create unique but consistent colors
 */
function generateDynamicTheme(text: string): ArtistTheme {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use hash to pick colors from a curated palette
  const colors = [
    { name: 'rose', from: 'from-rose-900/40', via: 'via-pink-900/40', border: 'border-rose-500/30 hover:border-pink-500/50', badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400', accent: 'text-rose-400', neonAccent: '#ec4899' },
    { name: 'blue', from: 'from-blue-900/40', via: 'via-cyan-900/40', border: 'border-blue-500/30 hover:border-cyan-500/50', badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400', accent: 'text-blue-400', neonAccent: '#3b82f6' },
    { name: 'purple', from: 'from-purple-900/40', via: 'via-pink-900/40', border: 'border-purple-500/30 hover:border-pink-500/50', badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400', accent: 'text-purple-400', neonAccent: '#a855f7' },
    { name: 'green', from: 'from-green-900/40', via: 'via-emerald-900/40', border: 'border-green-500/30 hover:border-emerald-500/50', badge: 'bg-green-500/10 border-green-500/30 text-green-400', accent: 'text-green-400', neonAccent: '#10b981' },
    { name: 'orange', from: 'from-orange-900/40', via: 'via-red-900/40', border: 'border-orange-500/30 hover:border-red-500/50', badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400', accent: 'text-orange-400', neonAccent: '#f97316' },
    { name: 'violet', from: 'from-violet-900/40', via: 'via-fuchsia-900/40', border: 'border-violet-500/30 hover:border-fuchsia-500/50', badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400', accent: 'text-violet-400', neonAccent: '#8b5cf6' },
    { name: 'indigo', from: 'from-indigo-900/40', via: 'via-purple-900/40', border: 'border-indigo-500/30 hover:border-purple-500/50', badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', accent: 'text-indigo-400', neonAccent: '#6366f1' },
    { name: 'teal', from: 'from-teal-900/40', via: 'via-cyan-900/40', border: 'border-teal-500/30 hover:border-cyan-500/50', badge: 'bg-teal-500/10 border-teal-500/30 text-teal-400', accent: 'text-teal-400', neonAccent: '#14b8a6' },
    { name: 'amber', from: 'from-amber-900/40', via: 'via-yellow-900/40', border: 'border-amber-500/30 hover:border-yellow-500/50', badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400', accent: 'text-amber-400', neonAccent: '#f59e0b' },
    { name: 'fuchsia', from: 'from-fuchsia-900/40', via: 'via-pink-900/40', border: 'border-fuchsia-500/30 hover:border-pink-500/50', badge: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400', accent: 'text-fuchsia-400', neonAccent: '#d946ef' },
  ];

  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];

  return {
    gradient: `${color.from} ${color.via} to-black`,
    border: color.border,
    badge: color.badge,
    accent: color.accent,
    neonAccent: color.neonAccent
  };
}

/**
 * Detect which artist is referenced in a pattern label and return their theme
 * HYBRID APPROACH: Manual themes for popular artists, dynamic generation for others
 */
export function getArtistTheme(patternLabel: string): ArtistTheme {
  const labelLower = patternLabel.toLowerCase();

  // Check for manually curated artists first
  for (const [artist, theme] of Object.entries(artistThemes)) {
    if (artist === 'default') continue;
    if (labelLower.includes(artist)) {
      return theme;
    }
  }

  // Try to extract artist name from common patterns
  // Pattern examples: "The Sabrina Era", "Taylor Swift Disorder", "Ariana Grande Therapy"
  const artistMatch = labelLower.match(/(?:the\s+)?(?:"([^"]+)"|(\w+(?:\s+\w+)?))(?:\s+(?:era|disorder|syndrome|energy|vibes?|phase|moment))/i);

  if (artistMatch) {
    const extractedArtist = (artistMatch[1] || artistMatch[2]).trim();
    // Generate deterministic color for this unknown artist
    return generateDynamicTheme(extractedArtist);
  }

  // Return default theme if no artist detected
  return artistThemes.default;
}
