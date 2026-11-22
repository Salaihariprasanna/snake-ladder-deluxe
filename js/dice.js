/**
 * Snake & Ladder Deluxe - 3D Dice Controller
 * Manages 3D rotation physics, roll animations, and face outcome mapping.
 */

class DiceController {
  constructor() {
    this.cube = document.getElementById('dice-cube');
    this.scene = document.getElementById('dice-scene');
    this.rollBtn = document.getElementById('btn-roll-dice');
    this.resultVal = document.getElementById('dice-result-val');
    this.isRolling = false;
    this.currentValue = 1;
    this.onRollComplete = null;

    this.initEvents();
  }

  initEvents() {
    if (this.scene) {
      this.scene.addEventListener('click', () => this.handleUserRoll());
    }
    if (this.rollBtn) {
      this.rollBtn.addEventListener('click', () => this.handleUserRoll());
    }

    // Keyboard shortcut (Space bar)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.target.matches('input, select, textarea')) {
        e.preventDefault();
        this.handleUserRoll();
      }
    });
  }

  handleUserRoll() {
    if (this.isRolling) return;
    if (window.gameEngine && window.gameEngine.isTurnInProgress) return;
    if (window.gameEngine && window.gameEngine.isCurrentPlayerAI()) return;

    if (window.gameEngine && window.gameEngine.isOnlineMode) {
      if (!window.multiplayerManager || !window.multiplayerManager.isMyTurn()) {
        if (window.gameEngine) window.gameEngine.showToast('Please wait for your turn!', 'info');
        return;
      }
      this.setDisabled(true);
      window.multiplayerManager.rollDice((res) => {
        if (!res || !res.success) {
          this.setDisabled(false);
          if (res && res.message && window.gameEngine) {
            window.gameEngine.showToast(res.message, 'snake');
          }
        }
      });
      return;
    }

    this.roll();
  }

  // Trigger roll with optional target result (or pure random 1-6)
  roll(targetVal = null) {
    if (this.isRolling) return;
    this.isRolling = true;

    if (this.rollBtn) this.rollBtn.disabled = true;

    // Play rolling sound FX
    if (window.soundEngine) {
      window.soundEngine.playDiceRoll();
    }

    // Clear previous face classes
    for (let i = 1; i <= 6; i++) {
      this.cube.classList.remove(`show-${i}`);
    }
    this.cube.classList.add('is-rolling');

    // Generate random value if not provided
    const outcome = targetVal || (Math.floor(Math.random() * 6) + 1);

    setTimeout(() => {
      this.cube.classList.remove('is-rolling');
      this.cube.classList.add(`show-${outcome}`);
      this.currentValue = outcome;
      this.isRolling = false;

      if (this.resultVal) {
        this.resultVal.textContent = outcome;
        this.resultVal.style.animation = 'none';
        this.resultVal.offsetHeight; // trigger reflow
        this.resultVal.style.animation = 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }

      if (this.rollBtn) this.rollBtn.disabled = false;

      // Notify game engine
      if (typeof this.onRollComplete === 'function') {
        this.onRollComplete(outcome);
      }
    }, 700);
  }

  setDisabled(disabled) {
    if (this.rollBtn) {
      this.rollBtn.disabled = disabled;
    }
    if (this.scene) {
      this.scene.style.pointerEvents = disabled ? 'none' : 'all';
    }
  }
}

window.diceController = new DiceController();
