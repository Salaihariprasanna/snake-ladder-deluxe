/**
 * Snake & Ladder Deluxe - Core Game Engine & State Machine
 * Manages player turns, step-by-step hop animations, realistic snake curve slides,
 * ladder rung climbs, multi-token radial offsets (2-6 players), and real-time online sync.
 */

class GameEngine {
  constructor() {
    this.mode = 'ai'; // 'ai' | 'human' | 'online'
    this.isOnlineMode = false;
    this.players = [];
    this.currentTurnIndex = 0;
    this.turnCount = 1;
    this.isTurnInProgress = false;
    this.isGameOver = false;
    this.moveLogs = [];
    this.startTime = null;

    this.pawnsContainer = document.getElementById('pawns-layer');
    this.liveScoreboard = document.getElementById('live-scoreboard');
    this.turnCounterEl = document.getElementById('game-turn-counter');
    this.activePlayerAvatarEl = document.getElementById('active-player-avatar');
    this.activePlayerNameEl = document.getElementById('active-player-name');
    this.activePlayerRoleEl = document.getElementById('active-player-role');
    this.activePlayerTileEl = document.getElementById('active-player-tile');
    this.statusMessageEl = document.getElementById('status-message');

    // Register roll callback with dice controller
    if (window.diceController) {
      window.diceController.onRollComplete = (outcome) => this.handleDiceOutcome(outcome);
    }

    // Connect to multiplayer manager if present
    if (window.multiplayerManager) {
      window.multiplayerManager.onRemoteRoll = (data) => this.executeRemoteTurn(data);
      window.multiplayerManager.onGameStarted = (data) => this.startOnlineGame(data);
    }
  }

  // Initialize a new match with players array (supports 2 to 6 players)
  startNewGame(mode, playersList, presetKey = 'classic', customBoard = null) {
    this.mode = mode;
    this.isOnlineMode = mode === 'online';
    this.players = playersList.map((p, idx) => ({
      id: p.id || p.socketId || `p_${idx + 1}`,
      socketId: p.socketId || null,
      name: p.name || `Player ${idx + 1}`,
      isAi: !!p.isAi,
      characterId: p.characterId || 'dragon',
      color: p.color || window.CHARACTER_PALETTES[idx % window.CHARACTER_PALETTES.length],
      tile: 1,
      turns: 0,
      snakesHit: 0,
      laddersHit: 0,
      isWinner: false
    }));

    this.currentTurnIndex = 0;
    this.turnCount = 1;
    this.isTurnInProgress = false;
    this.isGameOver = false;
    this.moveLogs = [];
    this.startTime = Date.now();

    // Set board elements
    if (window.boardRenderer) {
      window.boardRenderer.setPreset(presetKey, customBoard);
    }

    this.renderPawns();
    this.updateUI();
    this.saveProgress();

    this.showToast(`Game started! ${this.players[0].name} goes first.`, 'info');

    // Check if first player is AI
    this.checkAITurn();
    this.updateOnlineTurnState();
  }

  // Start online game from server event
  startOnlineGame(data) {
    const room = data.room;
    this.mode = 'online';
    this.isOnlineMode = true;
    this.players = room.players.map((p, idx) => ({
      id: p.socketId || `p_${idx + 1}`,
      socketId: p.socketId,
      name: p.name,
      isAi: false,
      characterId: p.characterId || 'dragon',
      color: p.color || window.CHARACTER_PALETTES[idx % window.CHARACTER_PALETTES.length],
      tile: 1,
      turns: 0,
      snakesHit: 0,
      laddersHit: 0,
      isWinner: false
    }));

    this.currentTurnIndex = 0;
    this.turnCount = 1;
    this.isTurnInProgress = false;
    this.isGameOver = false;
    this.moveLogs = [];
    this.startTime = Date.now();

    if (window.boardRenderer) {
      window.boardRenderer.setPreset(room.preset || 'classic');
    }

    this.renderPawns();
    this.updateUI();
    this.updateOnlineTurnState();

    if (window.appController) {
      window.appController.showGameScreen();
    }

    this.showToast(`🌐 Online match started! Room: ${room.code}`, 'ladder');
  }

  // Resume game from saved state
  restoreGame(savedState) {
    this.mode = savedState.mode || 'ai';
    this.isOnlineMode = this.mode === 'online';
    this.players = savedState.players || [];
    this.currentTurnIndex = savedState.currentTurnIndex || 0;
    this.turnCount = savedState.turnCount || 1;
    this.isTurnInProgress = false;
    this.isGameOver = false;
    this.moveLogs = savedState.moveLogs || [];
    this.startTime = savedState.startTime || Date.now();

    if (window.boardRenderer && savedState.presetKey) {
      window.boardRenderer.setPreset(savedState.presetKey, savedState.customBoard);
    }

    this.renderPawns();
    this.updateUI();
    this.updateOnlineTurnState();

    this.showToast('Game session resumed!', 'info');
    this.checkAITurn();
  }

  saveProgress() {
    if (this.isGameOver || this.isOnlineMode) {
      if (window.storageManager && !this.isOnlineMode) window.storageManager.clearActiveGame();
      return;
    }

    const state = {
      mode: this.mode,
      players: this.players,
      currentTurnIndex: this.currentTurnIndex,
      turnCount: this.turnCount,
      moveLogs: this.moveLogs,
      startTime: this.startTime,
      presetKey: window.boardRenderer ? window.boardRenderer.activePresetKey : 'classic'
    };

    if (window.storageManager) {
      window.storageManager.saveActiveGame(state);
    }
  }

  isCurrentPlayerAI() {
    const player = this.getCurrentPlayer();
    return player && player.isAi;
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  // Render player pawns on the board (supports 2 to 6 players)
  renderPawns() {
    if (!this.pawnsContainer) return;
    this.pawnsContainer.innerHTML = '';

    this.players.forEach((player, idx) => {
      const pawnEl = document.createElement('div');
      pawnEl.className = `player-pawn player-pawn-${idx}`;
      pawnEl.id = `pawn-player-${idx}`;

      const charData = window.GAME_CHARACTERS[player.characterId] || window.GAME_CHARACTERS.dragon;

      pawnEl.innerHTML = `
        <div class="pawn-inner">
          <div class="pawn-shadow"></div>
          <div class="pawn-avatar">${charData.renderSvg(player.color)}</div>
          <div class="pawn-indicator" style="background-color: ${player.color}; color: ${player.color};"></div>
          <span class="pawn-name-tag" style="background: ${player.color};">${player.name.substring(0, 8)}</span>
        </div>
      `;

      this.pawnsContainer.appendChild(pawnEl);
      this.positionPawn(idx, player.tile, false);
    });
  }

  // Position a pawn on the board (radial stacking offset for multiple pawns on the same tile)
  positionPawn(playerIndex, tileNumber, animate = true) {
    const pawnEl = document.getElementById(`pawn-player-${playerIndex}`);
    if (!pawnEl || !window.boardRenderer) return;

    const coords = window.boardRenderer.getTileCoords(tileNumber);

    // Calculate tile stacking offset for 2 to 6 players
    const playersOnSameTile = this.players
      .map((p, idx) => ({ idx, tile: p.tile }))
      .filter(p => p.tile === tileNumber);

    let offsetX = 0;
    let offsetY = 0;

    if (playersOnSameTile.length > 1) {
      const posIndex = playersOnSameTile.findIndex(p => p.idx === playerIndex);
      const radius = playersOnSameTile.length > 3 ? 2.4 : 1.9;
      const angle = (posIndex / playersOnSameTile.length) * Math.PI * 2;
      offsetX = Math.cos(angle) * radius;
      offsetY = Math.sin(angle) * radius;
    }

    pawnEl.style.left = `${coords.pctX + offsetX}%`;
    pawnEl.style.top = `${coords.pctY + offsetY}%`;
  }

  // Local user dice outcome
  async handleDiceOutcome(rollVal) {
    if (this.isGameOver) return;

    // If online match, let the server handle game logic and broadcast
    if (this.isOnlineMode) {
      return;
    }

    this.isTurnInProgress = true;
    const player = this.getCurrentPlayer();
    player.turns += 1;

    const startTile = player.tile;
    let targetTile = startTile + rollVal;
    let bounced = false;

    // Handle Overshoot (Tile 100 exact landing rule with bounce-back)
    if (targetTile > 100) {
      const overshoot = targetTile - 100;
      targetTile = 100 - overshoot;
      bounced = true;
      this.showToast(`${player.name} overshot Tile 100! Bouncing back to ${targetTile}`, 'info');
      this.spawnFloatingEffect(100, '🔄 Bounce Back!', 'bonus');
    }

    this.setStatusMessage(`${player.name} rolled a ${rollVal}! Moving...`);

    // 1. Step-by-step movement animation
    await this.animatePawnSteps(this.currentTurnIndex, startTile, targetTile, rollVal, bounced);

    player.tile = targetTile;
    this.positionPawn(this.currentTurnIndex, targetTile);

    // 2. Check for Snake or Ladder on target tile
    let specialTrigger = null;
    if (window.boardRenderer) {
      specialTrigger = window.boardRenderer.checkTileTrigger(targetTile);
    }

    if (specialTrigger) {
      await this.handleSpecialTrigger(player, specialTrigger);
    }

    // 3. Log Move
    this.logMove(player, rollVal, startTile, player.tile, specialTrigger);

    // 4. Check Win Condition
    if (player.tile === 100) {
      this.handleVictory(player);
      return;
    }

    // 5. Extra turn if rolled a 6
    const gotExtraTurn = rollVal === 6;
    if (gotExtraTurn) {
      this.showToast(`🎲 ${player.name} rolled a 6! Extra turn!`, 'ladder');
      this.setStatusMessage(`${player.name} rolled a 6 and gets another roll!`);
      this.spawnFloatingEffect(player.tile, '🎲 Extra Turn!', 'bonus');
    } else {
      this.advanceTurn();
    }

    this.isTurnInProgress = false;
    this.updateUI();
    this.saveProgress();

    // Check if next player is AI
    this.checkAITurn();
  }

  // Execute synchronized turn received from Online Server
  async executeRemoteTurn(data) {
    this.isTurnInProgress = true;
    const playerIndex = data.playerIndex;
    const player = this.players[playerIndex];

    if (!player) {
      this.isTurnInProgress = false;
      return;
    }

    // 1. Trigger dice roll visually on all clients
    if (window.diceController) {
      window.diceController.roll(data.rollVal);
    }

    // Wait for dice roll spin to complete
    await this.delay(750);

    this.setStatusMessage(`${player.name} rolled ${data.rollVal}! Moving...`);

    // 2. Animate step-by-step movement
    await this.animatePawnSteps(playerIndex, data.startTile, data.targetTile, data.rollVal, data.bounced);

    player.tile = data.targetTile;
    this.positionPawn(playerIndex, data.targetTile);

    // 3. Animate Snake Slide or Ladder Climb if triggered
    if (data.specialTrigger) {
      await this.handleSpecialTrigger(player, data.specialTrigger);
    }

    player.tile = data.finalTile;
    this.positionPawn(playerIndex, data.finalTile);

    // 4. Log Move
    this.logMove(player, data.rollVal, data.startTile, data.finalTile, data.specialTrigger);

    // 5. Check Win
    if (data.isGameOver && data.winner) {
      this.handleVictory(data.winner);
      return;
    }

    // 6. Extra Turn or Advance Turn
    if (data.gotExtraTurn) {
      this.showToast(`🎲 ${player.name} rolled a 6! Extra turn!`, 'ladder');
      this.spawnFloatingEffect(player.tile, '🎲 Extra Turn!', 'bonus');
    }

    this.currentTurnIndex = data.nextTurnIndex;
    this.turnCount = data.turnCount;
    this.isTurnInProgress = false;

    this.updateUI();
    this.updateOnlineTurnState();
  }

  // Smooth square-by-square hop animation
  async animatePawnSteps(playerIndex, fromTile, toTile, rollVal, bounced) {
    const pawnEl = document.getElementById(`pawn-player-${playerIndex}`);
    const settings = window.storageManager ? window.storageManager.getSettings() : { fastMode: false };
    const stepDelay = settings.fastMode ? 140 : 240;

    let current = fromTile;
    let stepCount = 0;

    const triggerHop = () => {
      if (pawnEl) {
        pawnEl.classList.remove('is-hopping');
        void pawnEl.offsetWidth; // Reflow
        pawnEl.classList.add('is-hopping');
      }
    };

    if (!bounced) {
      while (current < toTile) {
        current += 1;
        stepCount += 1;
        this.positionPawn(playerIndex, current);
        triggerHop();
        if (window.soundEngine) {
          window.soundEngine.playPawnStep(stepCount);
        }
        await this.delay(stepDelay);
      }
    } else {
      while (current < 100) {
        current += 1;
        stepCount += 1;
        this.positionPawn(playerIndex, current);
        triggerHop();
        if (window.soundEngine) window.soundEngine.playPawnStep(stepCount);
        await this.delay(stepDelay);
      }
      while (current > toTile) {
        current -= 1;
        stepCount += 1;
        this.positionPawn(playerIndex, current);
        triggerHop();
        if (window.soundEngine) window.soundEngine.playPawnStep(stepCount);
        await this.delay(stepDelay);
      }
    }

    if (pawnEl) {
      setTimeout(() => pawnEl.classList.remove('is-hopping'), 300);
    }
  }

  // Realistic Snake Sliding & Ladder Climbing Animations
  async handleSpecialTrigger(player, trigger) {
    const playerIndex = this.players.indexOf(player);
    const targetIdx = playerIndex >= 0 ? playerIndex : this.currentTurnIndex;
    const pawnEl = document.getElementById(`pawn-player-${targetIdx}`);
    const boardEl = document.getElementById('board-container');
    const settings = window.storageManager ? window.storageManager.getSettings() : { screenShake: true, fastMode: false };

    await this.delay(250);

    if (trigger.type === 'snake') {
      player.snakesHit += 1;
      this.showToast(`🐍 BITTEN! ${player.name} slides down from ${trigger.from} to ${trigger.to}!`, 'snake');
      this.setStatusMessage(`🐍 Bitten by a Snake! Sliding down to ${trigger.to}...`);

      if (window.soundEngine) window.soundEngine.playSnakeBite();

      // Highlight the snake with pulsating venom glow
      if (window.boardRenderer) {
        window.boardRenderer.highlightSnake(trigger.from, trigger.to, true);
      }

      // Floating text effect
      this.spawnFloatingEffect(trigger.from, `-${trigger.from - trigger.to} 🐍 OUCH!`, 'snake');

      // Screen Shake
      if (settings.screenShake && boardEl) {
        boardEl.classList.add('screen-shake');
        setTimeout(() => boardEl.classList.remove('screen-shake'), 600);
      }

      // Venom burst at snake head
      if (window.particleEngine && window.boardRenderer && boardEl) {
        const coords = window.boardRenderer.getTileCoords(trigger.from);
        const rect = boardEl.getBoundingClientRect();
        const screenX = rect.left + (rect.width * (coords.pctX / 100));
        const screenY = rect.top + (rect.height * (coords.pctY / 100));
        window.particleEngine.spawnSnakeVenom(screenX, screenY);
      }

      // REALISTIC CURVE SLIDE: sample points along the snake Bezier body!
      const curvePoints = window.boardRenderer ? window.boardRenderer.getSnakeCurvePoints(trigger.from, trigger.to, 32) : [];
      if (pawnEl) pawnEl.classList.add('is-sliding');

      if (curvePoints.length > 0 && pawnEl) {
        const slideSpeed = settings.fastMode ? 16 : 26;
        for (let i = 0; i < curvePoints.length; i++) {
          const pt = curvePoints[i];
          pawnEl.style.left = `${pt.pctX}%`;
          pawnEl.style.top = `${pt.pctY}%`;
          // Wobble tilt based on snake winding direction
          const tilt = Math.sin(i * 0.7) * 20;
          pawnEl.style.transform = `translate(-50%, -50%) rotate(${tilt}deg) scale(1.1)`;

          // Venom droplet trail
          if (i % 6 === 0 && window.particleEngine && boardEl) {
            const rect = boardEl.getBoundingClientRect();
            const sx = rect.left + rect.width * (pt.pctX / 100);
            const sy = rect.top + rect.height * (pt.pctY / 100);
            window.particleEngine.spawnSnakeVenom(sx, sy);
          }
          await this.delay(slideSpeed);
        }
      }

      if (pawnEl) pawnEl.style.transform = '';
      player.tile = trigger.to;
      this.positionPawn(targetIdx, trigger.to);

      // Tail landing burst
      if (window.particleEngine && window.boardRenderer && boardEl) {
        const coords = window.boardRenderer.getTileCoords(trigger.to);
        const rect = boardEl.getBoundingClientRect();
        const screenX = rect.left + (rect.width * (coords.pctX / 100));
        const screenY = rect.top + (rect.height * (coords.pctY / 100));
        window.particleEngine.spawnSnakeVenom(screenX, screenY);
      }

      if (window.boardRenderer) {
        window.boardRenderer.highlightSnake(trigger.from, trigger.to, false);
      }
      if (pawnEl) pawnEl.classList.remove('is-sliding');
      await this.delay(300);

    } else if (trigger.type === 'ladder') {
      player.laddersHit += 1;
      this.showToast(`🪜 CLIMB! ${player.name} climbs ladder from ${trigger.from} to ${trigger.to}!`, 'ladder');
      this.setStatusMessage(`🪜 Climbed a Ladder to ${trigger.to}!`);

      if (window.soundEngine) window.soundEngine.playLadderClimb();

      // Highlight the ladder with golden beam
      if (window.boardRenderer) {
        window.boardRenderer.highlightLadder(trigger.from, trigger.to, true);
      }

      // Floating text effect
      this.spawnFloatingEffect(trigger.from, `+${trigger.to - trigger.from} 🪜 CLIMB!`, 'ladder');

      // Ladder climb points
      const ladderPoints = window.boardRenderer ? window.boardRenderer.getLadderPoints(trigger.from, trigger.to, 22) : [];
      if (pawnEl) pawnEl.classList.add('is-climbing');

      if (ladderPoints.length > 0 && pawnEl) {
        const climbSpeed = settings.fastMode ? 22 : 36;
        for (let i = 0; i < ladderPoints.length; i++) {
          const pt = ladderPoints[i];
          pawnEl.style.left = `${pt.pctX}%`;
          pawnEl.style.top = `${pt.pctY}%`;
          pawnEl.style.transform = `translate(-50%, -50%) scale(1.2)`;

          // Sparkle trail
          if (i % 4 === 0 && window.particleEngine && boardEl) {
            const rect = boardEl.getBoundingClientRect();
            const sx = rect.left + rect.width * (pt.pctX / 100);
            const sy = rect.top + rect.height * (pt.pctY / 100);
            window.particleEngine.spawnLadderSparkles(sx, sy);
          }
          await this.delay(climbSpeed);
        }
      }

      if (pawnEl) pawnEl.style.transform = '';
      player.tile = trigger.to;
      this.positionPawn(targetIdx, trigger.to);

      // Star sparkles explosion at the top
      if (window.particleEngine && window.boardRenderer && boardEl) {
        const coords = window.boardRenderer.getTileCoords(trigger.to);
        const rect = boardEl.getBoundingClientRect();
        const screenX = rect.left + (rect.width * (coords.pctX / 100));
        const screenY = rect.top + (rect.height * (coords.pctY / 100));
        window.particleEngine.spawnLadderSparkles(screenX, screenY);
      }

      if (window.boardRenderer) {
        window.boardRenderer.highlightLadder(trigger.from, trigger.to, false);
      }
      if (pawnEl) pawnEl.classList.remove('is-climbing');
      await this.delay(300);
    }
  }

  // Spawn dynamic floating text tags over tiles (+18 Climbed!, -35 Bitten!)
  spawnFloatingEffect(tileNum, text, type = 'info') {
    const boardEl = document.getElementById('board-container');
    if (!boardEl || !window.boardRenderer) return;

    const coords = window.boardRenderer.getTileCoords(tileNum);
    const badge = document.createElement('div');
    badge.className = `floating-board-tag tag-${type}`;
    badge.textContent = text;
    badge.style.left = `${coords.pctX}%`;
    badge.style.top = `${coords.pctY}%`;

    boardEl.appendChild(badge);
    setTimeout(() => badge.remove(), 1600);
  }

  // Advance to next player turn
  advanceTurn() {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    if (this.currentTurnIndex === 0) {
      this.turnCount += 1;
    }

    if (window.soundEngine) {
      window.soundEngine.playTurnSwitch();
    }
  }

  // Check if AI needs to play
  checkAITurn() {
    if (this.isGameOver || this.isOnlineMode) return;
    const player = this.getCurrentPlayer();
    if (player && player.isAi && window.aiBotEngine) {
      if (window.diceController) {
        window.diceController.setDisabled(true);
      }
      window.aiBotEngine.triggerTurn(this, player);
    } else {
      if (window.diceController) {
        window.diceController.setDisabled(false);
      }
      this.setStatusMessage(`${player.name}'s Turn - Roll the dice!`);
    }
  }

  // Update roll button state for online multiplayer
  updateOnlineTurnState() {
    const rollBtn = document.getElementById('btn-roll-dice');
    const rollBtnText = document.getElementById('roll-btn-text');
    const onlineBadge = document.getElementById('ingame-online-badge');
    const onlineCodeText = document.getElementById('ingame-room-code-text');

    if (!rollBtn) return;

    if (this.isOnlineMode && window.multiplayerManager) {
      if (onlineBadge) onlineBadge.classList.remove('hidden');
      if (onlineCodeText && window.multiplayerManager.roomCode) {
        onlineCodeText.textContent = window.multiplayerManager.roomCode;
      }

      const isMyTurn = window.multiplayerManager.isMyTurn();
      const activePlayer = this.getCurrentPlayer();

      if (isMyTurn && !this.isGameOver && !this.isTurnInProgress) {
        rollBtn.disabled = false;
        if (rollBtnText) rollBtnText.textContent = 'ROLL (Your Turn!)';
        rollBtn.classList.add('pulse-btn');
        this.setStatusMessage('Your turn! Roll the dice!');
      } else {
        rollBtn.disabled = true;
        rollBtn.classList.remove('pulse-btn');
        if (rollBtnText) {
          rollBtnText.textContent = activePlayer ? `Waiting for ${activePlayer.name}...` : 'Waiting...';
        }
        if (activePlayer) {
          this.setStatusMessage(`Waiting for ${activePlayer.name} to roll...`);
        }
      }
    } else {
      if (onlineBadge) onlineBadge.classList.add('hidden');
    }
  }

  // Handle Game Victory
  handleVictory(winner) {
    this.isGameOver = true;
    this.isTurnInProgress = false;
    winner.isWinner = true;

    if (window.diceController) {
      window.diceController.setDisabled(true);
    }

    // Sound and Confetti FX
    if (window.soundEngine) window.soundEngine.playVictory();
    if (window.particleEngine) window.particleEngine.launchVictoryConfetti();

    // Stats and Match Record
    const durationSec = Math.round((Date.now() - (this.startTime || Date.now())) / 1000);
    const matchRecord = {
      winnerName: winner.name,
      winnerColor: winner.color,
      winnerChar: winner.characterId,
      winnerIsAi: winner.isAi || false,
      turns: this.turnCount,
      duration: `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`,
      mode: this.isOnlineMode ? 'Online Room' : (this.mode === 'ai' ? 'vs AI' : 'Pass & Play'),
      totalPlayers: this.players.length,
      totalSnakesBitten: this.players.reduce((acc, p) => acc + (p.snakesHit || 0), 0),
      totalLaddersClimbed: this.players.reduce((acc, p) => acc + (p.laddersHit || 0), 0)
    };

    if (window.storageManager && !this.isOnlineMode) {
      window.storageManager.addHistoryRecord(matchRecord);
      window.storageManager.updateStats(matchRecord);
      window.storageManager.clearActiveGame();
    }

    this.showVictoryModal(winner, matchRecord);
  }

  showVictoryModal(winner, match) {
    const modal = document.getElementById('modal-victory');
    const winnerNameEl = document.getElementById('victory-winner-name');
    const summaryTextEl = document.getElementById('victory-summary-text');
    const avatarWrapEl = document.getElementById('victory-avatar-wrap');
    const vStatTurns = document.getElementById('v-stat-turns');
    const vStatLadders = document.getElementById('v-stat-ladders');
    const vStatSnakes = document.getElementById('v-stat-snakes');
    const btnRematch = document.getElementById('btn-victory-rematch');

    if (winnerNameEl) winnerNameEl.textContent = `${winner.name} Wins!`;
    if (summaryTextEl) summaryTextEl.textContent = `Reached Tile 100 in ${match.turns} turns (${match.duration})!`;
    
    if (avatarWrapEl) {
      const charData = window.GAME_CHARACTERS[winner.characterId] || window.GAME_CHARACTERS.dragon;
      avatarWrapEl.innerHTML = charData.renderSvg(winner.color);
    }

    if (vStatTurns) vStatTurns.textContent = match.turns;
    if (vStatLadders) vStatLadders.textContent = winner.laddersHit || 0;
    if (vStatSnakes) vStatSnakes.textContent = winner.snakesHit || 0;

    // In online mode, only host can click Rematch
    if (btnRematch && this.isOnlineMode && window.multiplayerManager) {
      btnRematch.style.display = window.multiplayerManager.isHost ? 'inline-flex' : 'none';
    } else if (btnRematch) {
      btnRematch.style.display = 'inline-flex';
    }

    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  // Update Game UI (Sidebar turn display & Leaderboard)
  updateUI() {
    const player = this.getCurrentPlayer();
    if (!player) return;

    // Active Turn Avatar
    if (this.activePlayerAvatarEl) {
      const charData = window.GAME_CHARACTERS[player.characterId] || window.GAME_CHARACTERS.dragon;
      this.activePlayerAvatarEl.innerHTML = charData.renderSvg(player.color);
      this.activePlayerAvatarEl.style.borderColor = player.color;
    }

    if (this.activePlayerNameEl) {
      this.activePlayerNameEl.textContent = player.name;
    }

    if (this.activePlayerRoleEl) {
      if (this.isOnlineMode && window.multiplayerManager) {
        const isMe = window.multiplayerManager.myPlayerIndex === this.currentTurnIndex;
        this.activePlayerRoleEl.textContent = isMe ? 'Your Turn' : 'Waiting...';
      } else {
        this.activePlayerRoleEl.textContent = player.isAi ? 'AI Opponent' : 'Your Turn';
      }
      this.activePlayerRoleEl.style.color = player.color;
    }

    if (this.activePlayerTileEl) {
      this.activePlayerTileEl.textContent = `Tile ${player.tile}`;
    }

    if (this.turnCounterEl) {
      this.turnCounterEl.textContent = `Turn ${this.turnCount}`;
    }

    // Update active pawn glow
    this.players.forEach((_, idx) => {
      const pawn = document.getElementById(`pawn-player-${idx}`);
      if (pawn) {
        if (idx === this.currentTurnIndex) {
          pawn.classList.add('is-active-turn');
        } else {
          pawn.classList.remove('is-active-turn');
        }
      }
    });

    // Update Live Leaderboard (supports 2 to 6 players)
    if (this.liveScoreboard) {
      const sortedPlayers = [...this.players].sort((a, b) => b.tile - a.tile);
      this.liveScoreboard.innerHTML = sortedPlayers.map((p, rank) => {
        const isCurrent = p.id === player.id;
        const charData = window.GAME_CHARACTERS[p.characterId] || window.GAME_CHARACTERS.dragon;
        return `
          <div class="live-player-item ${isCurrent ? 'is-active' : ''}">
            <div class="player-pill-left">
              <div class="player-tiny-avatar" style="background:${p.color}22; border:1px solid ${p.color};">
                ${charData.renderSvg(p.color)}
              </div>
              <span class="player-pill-name">${p.name}</span>
            </div>
            <div class="player-pill-score" style="color:${p.color};">Tile ${p.tile}</div>
          </div>
        `;
      }).join('');
    }
  }

  setStatusMessage(msg) {
    if (this.statusMessageEl) {
      this.statusMessageEl.textContent = msg;
    }
  }

  logMove(player, roll, from, to, trigger) {
    let specialNote = '';
    let typeClass = 'log-normal';

    if (trigger && trigger.type === 'snake') {
      specialNote = `🐍 Bitten! Slid to ${to}`;
      typeClass = 'log-snake';
    } else if (trigger && trigger.type === 'ladder') {
      specialNote = `🪜 Climbed to ${to}`;
      typeClass = 'log-ladder';
    } else if (to === 100) {
      specialNote = `🏆 Reached Tile 100!`;
      typeClass = 'log-win';
    }

    this.moveLogs.unshift({
      turn: this.turnCount,
      playerName: player.name,
      playerColor: player.color,
      roll,
      from,
      to,
      specialNote,
      typeClass
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
}

// Global Game Engine Instance
window.gameEngine = new GameEngine();
