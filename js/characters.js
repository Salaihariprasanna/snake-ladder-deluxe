/**
 * Snake & Ladder Deluxe - Character Avatars & Visual Rigs
 * Provides clean vector SVG character rigs with customizable colors and animations.
 */

const CHARACTER_PALETTES = [
  '#06b6d4', // Cyan
  '#ef4444', // Crimson Red
  '#10b981', // Emerald Green
  '#f59e0b', // Amber Gold
  '#a855f7', // Mystic Purple
  '#ec4899', // Hot Pink
  '#3b82f6', // Royal Blue
  '#f97316'  // Orange
];

const GAME_CHARACTERS = {
  dragon: {
    id: 'dragon',
    name: 'Drake the Dragon',
    emoji: '🐉',
    defaultColor: '#10b981',
    renderSvg: (color = '#10b981') => `
      <svg viewBox="0 0 100 100" class="char-svg">
        <circle cx="50" cy="50" r="44" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
        <!-- Horns -->
        <polygon points="32,22 24,6 40,16" fill="#f59e0b"/>
        <polygon points="68,22 76,6 60,16" fill="#f59e0b"/>
        <!-- Dragon Head -->
        <ellipse cx="50" cy="52" rx="34" ry="28" fill="${color}"/>
        <ellipse cx="50" cy="62" rx="24" ry="16" fill="#34d399"/>
        <!-- Eyes -->
        <circle cx="36" cy="44" r="7" fill="#ffffff"/>
        <circle cx="36" cy="44" r="3.5" fill="#0f172a"/>
        <circle cx="64" cy="44" r="7" fill="#ffffff"/>
        <circle cx="64" cy="44" r="3.5" fill="#0f172a"/>
        <circle cx="38" cy="42" r="1.5" fill="#ffffff"/>
        <circle cx="66" cy="42" r="1.5" fill="#ffffff"/>
        <!-- Snout & Nostrils -->
        <circle cx="44" cy="62" r="2.5" fill="#065f46"/>
        <circle cx="56" cy="62" r="2.5" fill="#065f46"/>
        <!-- Friendly Smile -->
        <path d="M 42 70 Q 50 76 58 70" stroke="#065f46" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </svg>
    `
  },
  wizard: {
    id: 'wizard',
    name: 'Merlin the Mage',
    emoji: '🧙',
    defaultColor: '#a855f7',
    renderSvg: (color = '#a855f7') => `
      <svg viewBox="0 0 100 100" class="char-svg">
        <circle cx="50" cy="50" r="44" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
        <!-- Wizard Hat Base -->
        <ellipse cx="50" cy="44" rx="38" ry="12" fill="#4c1d95"/>
        <polygon points="50,4 20,44 80,44" fill="${color}"/>
        <!-- Hat Star -->
        <polygon points="50,20 53,27 60,27 55,32 57,39 50,35 43,39 45,32 40,27 47,27" fill="#fbbf24"/>
        <!-- Face -->
        <circle cx="50" cy="62" r="22" fill="#fed7aa"/>
        <!-- Beard -->
        <path d="M 32 64 Q 50 96 68 64 Q 50 78 32 64" fill="#ffffff"/>
        <!-- Eyes -->
        <circle cx="42" cy="58" r="3" fill="#1e1b4b"/>
        <circle cx="58" cy="58" r="3" fill="#1e1b4b"/>
        <!-- Sparkle -->
        <circle cx="78" cy="24" r="3" fill="#38bdf8"/>
      </svg>
    `
  },
  cyberbot: {
    id: 'cyberbot',
    name: 'Neon Byte-Bot',
    emoji: '🤖',
    defaultColor: '#06b6d4',
    renderSvg: (color = '#06b6d4') => `
      <svg viewBox="0 0 100 100" class="char-svg">
        <circle cx="50" cy="50" r="44" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
        <!-- Antenna -->
        <line x1="50" y1="20" x2="50" y2="8" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
        <circle cx="50" cy="8" r="5" fill="#f43f5e"/>
        <!-- Robot Head -->
        <rect x="22" y="24" width="56" height="52" rx="14" fill="#1e293b" stroke="${color}" stroke-width="3"/>
        <!-- Visor / Eyes Screen -->
        <rect x="30" y="36" width="40" height="18" rx="6" fill="#0f172a"/>
        <circle cx="40" cy="45" r="4" fill="${color}"/>
        <circle cx="60" cy="45" r="4" fill="${color}"/>
        <!-- Speaker Mouth -->
        <line x1="36" y1="64" x2="64" y2="64" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
        <!-- Bolts -->
        <circle cx="16" cy="50" r="4" fill="${color}"/>
        <circle cx="84" cy="50" r="4" fill="${color}"/>
      </svg>
    `
  },
  ninjacat: {
    id: 'ninjacat',
    name: 'Shadow Claw',
    emoji: '🐱',
    defaultColor: '#ec4899',
    renderSvg: (color = '#ec4899') => `
      <svg viewBox="0 0 100 100" class="char-svg">
        <circle cx="50" cy="50" r="44" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
        <!-- Cat Ears -->
        <polygon points="26,40 18,12 42,28" fill="#1e1b4b"/>
        <polygon points="74,40 82,12 58,28" fill="#1e1b4b"/>
        <polygon points="27,36 22,18 38,28" fill="${color}"/>
        <polygon points="73,36 78,18 62,28" fill="${color}"/>
        <!-- Head -->
        <circle cx="50" cy="54" r="32" fill="#1e1b4b"/>
        <!-- Headband -->
        <rect x="18" y="40" width="64" height="12" rx="4" fill="${color}"/>
        <!-- Headband Knot Tails -->
        <path d="M 80 46 Q 94 44 92 56" stroke="${color}" stroke-width="4" fill="none"/>
        <!-- Glowing Ninja Eyes -->
        <ellipse cx="38" cy="56" rx="5" ry="6" fill="#38bdf8"/>
        <circle cx="38" cy="56" r="2" fill="#ffffff"/>
        <ellipse cx="62" cy="56" rx="5" ry="6" fill="#38bdf8"/>
        <circle cx="62" cy="56" r="2" fill="#ffffff"/>
        <!-- Cat Snout -->
        <polygon points="50,66 46,62 54,62" fill="#f43f5e"/>
      </svg>
    `
  },
  astronaut: {
    id: 'astronaut',
    name: 'Astro Cosmo',
    emoji: '🚀',
    defaultColor: '#3b82f6',
    renderSvg: (color = '#3b82f6') => `
      <svg viewBox="0 0 100 100" class="char-svg">
        <circle cx="50" cy="50" r="44" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
        <!-- Space Helmet -->
        <circle cx="50" cy="50" r="36" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
        <!-- Gold Visor -->
        <rect x="24" y="32" width="52" height="34" rx="14" fill="url(#goldVisorGrad)"/>
        <!-- Visor Glare -->
        <ellipse cx="38" cy="40" rx="8" ry="4" fill="#ffffff" opacity="0.6" transform="rotate(-20 38 40)"/>
        <!-- Helmet Neck Collar -->
        <rect x="32" y="80" width="36" height="10" rx="4" fill="${color}"/>
        <!-- Defs for Gradient -->
        <defs>
          <linearGradient id="goldVisorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
      </svg>
    `
  },
  knight: {
    id: 'knight',
    name: 'Sir Galahad',
    emoji: '👑',
    defaultColor: '#f59e0b',
    renderSvg: (color = '#f59e0b') => `
      <svg viewBox="0 0 100 100" class="char-svg">
        <circle cx="50" cy="50" r="44" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
        <!-- Helmet Plume -->
        <path d="M 50 26 Q 50 6 70 8 Q 58 20 54 26" fill="#ef4444"/>
        <!-- Steel Helm -->
        <rect x="22" y="24" width="56" height="54" rx="16" fill="#94a3b8" stroke="#475569" stroke-width="3"/>
        <!-- Golden Crown Top -->
        <polygon points="32,24 40,16 50,22 60,16 68,24" fill="${color}"/>
        <!-- Visor Slit -->
        <rect x="30" y="44" width="40" height="8" rx="3" fill="#0f172a"/>
        <!-- Breathing Vent Holes -->
        <circle cx="42" cy="62" r="2" fill="#0f172a"/>
        <circle cx="50" cy="62" r="2" fill="#0f172a"/>
        <circle cx="58" cy="62" r="2" fill="#0f172a"/>
        <circle cx="46" cy="68" r="2" fill="#0f172a"/>
        <circle cx="54" cy="68" r="2" fill="#0f172a"/>
      </svg>
    `
  },
  fox: {
    id: 'fox',
    name: 'Rusty Fox',
    emoji: '🦊',
    defaultColor: '#f97316',
    renderSvg: (color = '#f97316') => `
      <svg viewBox="0 0 100 100" class="char-svg">
        <circle cx="50" cy="50" r="44" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
        <!-- Fox Ears -->
        <polygon points="22,44 14,14 42,28" fill="${color}"/>
        <polygon points="78,44 86,14 58,28" fill="${color}"/>
        <polygon points="24,38 18,20 36,28" fill="#1e293b"/>
        <polygon points="76,38 82,20 64,28" fill="#1e293b"/>
        <!-- Face Body -->
        <ellipse cx="50" cy="54" rx="34" ry="28" fill="${color}"/>
        <!-- White Cheeks -->
        <path d="M 20 62 Q 50 82 50 64 Q 30 46 20 62" fill="#f8fafc"/>
        <path d="M 80 62 Q 50 82 50 64 Q 70 46 80 62" fill="#f8fafc"/>
        <!-- Eyes -->
        <ellipse cx="36" cy="48" rx="4" ry="5" fill="#1e293b"/>
        <circle cx="37" cy="47" r="1.5" fill="#ffffff"/>
        <ellipse cx="64" cy="48" rx="4" ry="5" fill="#1e293b"/>
        <circle cx="65" cy="47" r="1.5" fill="#ffffff"/>
        <!-- Black Nose -->
        <circle cx="50" cy="68" r="4" fill="#0f172a"/>
      </svg>
    `
  },
  unicorn: {
    id: 'unicorn',
    name: 'Sparkle Horn',
    emoji: '🦄',
    defaultColor: '#ec4899',
    renderSvg: (color = '#ec4899') => `
      <svg viewBox="0 0 100 100" class="char-svg">
        <circle cx="50" cy="50" r="44" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
        <!-- Glowing Horn -->
        <polygon points="50,6 44,34 56,34" fill="#fbbf24"/>
        <line x1="46" y1="26" x2="54" y2="28" stroke="#f59e0b" stroke-width="2"/>
        <line x1="48" y1="16" x2="52" y2="18" stroke="#f59e0b" stroke-width="2"/>
        <!-- Ears -->
        <polygon points="30,40 24,18 42,30" fill="#f8fafc"/>
        <polygon points="70,40 76,18 58,30" fill="#f8fafc"/>
        <!-- Head -->
        <ellipse cx="50" cy="56" rx="30" ry="26" fill="#f8fafc"/>
        <!-- Pastel Rainbow Mane -->
        <path d="M 28 36 Q 16 52 24 66" stroke="#38bdf8" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M 72 36 Q 84 52 76 66" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <!-- Star Eyes -->
        <circle cx="38" cy="52" r="4" fill="#8b5cf6"/>
        <circle cx="62" cy="52" r="4" fill="#8b5cf6"/>
        <circle cx="39" cy="50" r="1.5" fill="#ffffff"/>
        <circle cx="63" cy="50" r="1.5" fill="#ffffff"/>
        <!-- Muzzle -->
        <ellipse cx="50" cy="68" rx="14" ry="8" fill="#fbcfe8"/>
        <circle cx="46" cy="68" r="1.5" fill="#ec4899"/>
        <circle cx="54" cy="68" r="1.5" fill="#ec4899"/>
      </svg>
    `
  }
};

window.GAME_CHARACTERS = GAME_CHARACTERS;
window.CHARACTER_PALETTES = CHARACTER_PALETTES;
