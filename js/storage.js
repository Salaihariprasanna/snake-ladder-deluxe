/**
 * Snake & Ladder Deluxe - LocalStorage Persistence Manager
 * Handles Save/Continue games, match history logs, statistics, and user settings.
 */

const STORAGE_KEYS = {
  ACTIVE_GAME: 'snake_ladder_active_save_v1',
  HISTORY: 'snake_ladder_history_v1',
  STATS: 'snake_ladder_stats_v1',
  SETTINGS: 'snake_ladder_settings_v1',
  CUSTOM_BOARD: 'snake_ladder_custom_board_v1',
  ACTIVE_THEME: 'snake_ladder_theme_v1',
  ACTIVE_DICE: 'snake_ladder_dice_v1'
};

class StorageManager {
  constructor() {
    this.defaultSettings = {
      sfx: true,
      volume: 75,
      fastMode: false,
      screenShake: true,
      aiAutoRoll: true
    };

    this.defaultStats = {
      totalGames: 0,
      humanWins: 0,
      aiWins: 0,
      snakesBitten: 0,
      laddersClimbed: 0,
      shortestGameTurns: 999
    };
  }

  // Active Game State (Save / Continue)
  saveActiveGame(gameState) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, JSON.stringify(gameState));
    } catch (e) {
      console.warn('Failed to save active game state:', e);
    }
  }

  loadActiveGame() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Failed to parse active game state:', e);
      return null;
    }
  }

  clearActiveGame() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
    } catch (e) {
      console.warn('Failed to clear active game state:', e);
    }
  }

  hasActiveGame() {
    return this.loadActiveGame() !== null;
  }

  // Match History
  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  addHistoryRecord(record) {
    try {
      const history = this.getHistory();
      history.unshift({
        id: 'match_' + Date.now(),
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        ...record
      });
      // Keep up to 30 most recent matches
      if (history.length > 30) history.pop();
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save match history:', e);
    }
  }

  clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (e) {
      console.warn('Failed to clear history:', e);
    }
  }

  // Statistics
  getStats() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      return data ? { ...this.defaultStats, ...JSON.parse(data) } : { ...this.defaultStats };
    } catch (e) {
      return { ...this.defaultStats };
    }
  }

  updateStats(record) {
    try {
      const stats = this.getStats();
      stats.totalGames += 1;
      if (record.winnerIsAi) {
        stats.aiWins += 1;
      } else {
        stats.humanWins += 1;
      }
      stats.snakesBitten += (record.totalSnakesBitten || 0);
      stats.laddersClimbed += (record.totalLaddersClimbed || 0);
      if (record.turns && record.turns < stats.shortestGameTurns) {
        stats.shortestGameTurns = record.turns;
      }
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
      return stats;
    } catch (e) {
      console.warn('Failed to update stats:', e);
      return this.getStats();
    }
  }

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...this.defaultSettings, ...JSON.parse(data) } : { ...this.defaultSettings };
    } catch (e) {
      return { ...this.defaultSettings };
    }
  }

  saveSettings(settings) {
    try {
      const merged = { ...this.getSettings(), ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.warn('Failed to save settings:', e);
      return this.getSettings();
    }
  }

  // Custom Board (snakes & ladders)
  getCustomBoard() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_BOARD);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveCustomBoard(boardData) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BOARD, JSON.stringify(boardData));
    } catch (e) {
      console.warn('Failed to save custom board:', e);
    }
  }

  // Theme & Dice preference
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_THEME) || 'theme-cyberpunk';
  }

  saveTheme(themeClass) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_THEME, themeClass);
  }

  getDiceSkin() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_DICE) || 'dice-skin-cyberpunk';
  }

  saveDiceSkin(skinClass) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DICE, skinClass);
  }
}

// Global Storage Manager Instance
window.storageManager = new StorageManager();
