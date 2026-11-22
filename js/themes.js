/**
 * Snake & Ladder Deluxe - Themes & Dice Skins Configuration
 */

const THEMES = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    emoji: '🌟',
    cssClass: 'theme-cyberpunk',
    desc: 'Futuristic dark neon grid with laser ladders & holographic serpents.',
    previewGradient: 'linear-gradient(135deg, #0f172a, #06b6d4)'
  },
  {
    id: 'jungle',
    name: 'Jungle Safari',
    emoji: '🌿',
    cssClass: 'theme-jungle',
    desc: 'Lush tropical temple with golden tiles, bamboo ladders & emerald pythons.',
    previewGradient: 'linear-gradient(135deg, #064e3b, #10b981)'
  },
  {
    id: 'medieval',
    name: 'Medieval Castle',
    emoji: '🏰',
    cssClass: 'theme-medieval',
    desc: 'Stone fortress dungeons with iron siege ladders & fire drakes.',
    previewGradient: 'linear-gradient(135deg, #451a03, #d97706)'
  },
  {
    id: 'candyland',
    name: 'Candyland Delight',
    emoji: '🍭',
    cssClass: 'theme-candyland',
    desc: 'Sweet waffle tiles with candy cane ladders & gummy rainbow worms.',
    previewGradient: 'linear-gradient(135deg, #831843, #ec4899)'
  },
  {
    id: 'space',
    name: 'Space Odyssey',
    emoji: '🌌',
    cssClass: 'theme-space',
    desc: 'Deep cosmic nebula with starlight elevators & galactic void worms.',
    previewGradient: 'linear-gradient(135deg, #1e1b4b, #8b5cf6)'
  },
  {
    id: 'vintage',
    name: 'Classic Vintage',
    emoji: '📜',
    cssClass: 'theme-vintage',
    desc: 'Authentic parchment paper board with mahogany ladders & traditional serpents.',
    previewGradient: 'linear-gradient(135deg, #292524, #b45309)'
  }
];

const DICE_SKINS = [
  {
    id: 'cyberpunk',
    name: 'Cyber Neon',
    emoji: '💎',
    cssClass: 'dice-skin-cyberpunk',
    desc: 'Deep dark glass with glowing cyan pips.'
  },
  {
    id: 'classic',
    name: 'Classic Ivory',
    emoji: '🎲',
    cssClass: 'dice-skin-classic',
    desc: 'Pristine ivory cube with deep red & black pips.'
  },
  {
    id: 'gold',
    name: 'Royal Gold',
    emoji: '👑',
    cssClass: 'dice-skin-gold',
    desc: 'Gleaming 24K polished gold with diamond white pips.'
  },
  {
    id: 'magma',
    name: 'Magma Flame',
    emoji: '🔥',
    cssClass: 'dice-skin-magma',
    desc: 'Volcanic obsidian stone with fiery orange magma pips.'
  },
  {
    id: 'emerald',
    name: 'Emerald Jade',
    emoji: '🍃',
    cssClass: 'dice-skin-emerald',
    desc: 'Translucent imperial jade with golden pips.'
  },
  {
    id: 'cosmic',
    name: 'Cosmic Starlight',
    emoji: '✨',
    cssClass: 'dice-skin-cosmic',
    desc: 'Galactic deep violet with astral cyan pips.'
  }
];

class ThemeManager {
  constructor() {
    this.currentTheme = window.storageManager ? window.storageManager.getTheme() : 'theme-cyberpunk';
    this.currentDiceSkin = window.storageManager ? window.storageManager.getDiceSkin() : 'dice-skin-cyberpunk';
  }

  init() {
    this.applyTheme(this.currentTheme, false);
    this.applyDiceSkin(this.currentDiceSkin, false);
  }

  applyTheme(themeClass, persist = true) {
    THEMES.forEach(t => document.body.classList.remove(t.cssClass));
    document.body.classList.add(themeClass);
    this.currentTheme = themeClass;
    if (persist && window.storageManager) {
      window.storageManager.saveTheme(themeClass);
    }
    // Re-render board elements if board exists
    if (window.boardRenderer) {
      window.boardRenderer.renderBoardElements();
    }
  }

  applyDiceSkin(skinClass, persist = true) {
    const diceCube = document.getElementById('dice-cube');
    if (diceCube) {
      DICE_SKINS.forEach(s => diceCube.classList.remove(s.cssClass));
      diceCube.classList.add(skinClass);
    }
    this.currentDiceSkin = skinClass;
    if (persist && window.storageManager) {
      window.storageManager.saveDiceSkin(skinClass);
    }
  }
}

window.THEMES = THEMES;
window.DICE_SKINS = DICE_SKINS;
window.themeManager = new ThemeManager();
