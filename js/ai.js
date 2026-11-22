/**
 * Snake & Ladder Deluxe - AI Bot Engine
 * Manages computer opponent actions, thinking delays, and personality behaviors.
 */

class AIBotEngine {
  constructor() {
    this.difficulty = 'normal'; // 'easy' | 'normal' | 'smart'
    this.botNames = [
      'ByteBot 3000',
      'Cyber Dragon',
      'Shadow AI',
      'Pixel Knight',
      'Quantum Wizard',
      'Robo Rover'
    ];
    this.isThinking = false;
    this.timer = null;
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  // Generate random AI bot profile
  generateBotPlayer(index, defaultChar = 'cyberbot', color = '#06b6d4') {
    const name = this.botNames[index % this.botNames.length];
    return {
      id: `player_ai_${index + 1}`,
      name: `${name} 🤖`,
      isAi: true,
      characterId: defaultChar,
      color: color,
      tile: 1,
      turns: 0,
      snakesHit: 0,
      laddersHit: 0,
      isWinner: false
    };
  }

  // Trigger AI turn after brief natural pause
  triggerTurn(gameEngine, player) {
    if (this.isThinking) return;
    this.isThinking = true;

    const banner = document.getElementById('status-message');
    if (banner) {
      banner.textContent = `🤖 ${player.name} is thinking...`;
    }

    // Determine thinking duration based on settings
    let delay = 900;
    if (this.difficulty === 'easy') delay = 1200;
    if (this.difficulty === 'smart') delay = 800;

    const settings = window.storageManager ? window.storageManager.getSettings() : { fastMode: false };
    if (settings.fastMode) delay = 400;

    this.timer = setTimeout(() => {
      this.isThinking = false;
      if (!gameEngine || gameEngine.isGameOver) return;

      if (banner) {
        banner.textContent = `🤖 ${player.name} is rolling the dice!`;
      }

      // Roll the dice for AI
      if (window.diceController) {
        window.diceController.roll();
      }
    }, delay);
  }

  cancel() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isThinking = false;
  }
}

window.aiBotEngine = new AIBotEngine();
