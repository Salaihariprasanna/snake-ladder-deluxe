/**
 * Snake & Ladder Deluxe - Main UI Controller & Application Coordinator
 * Binds DOM events, modals, setup rosters (2-6 players), online room creation,
 * lobby synchronization, in-game floating reactions, and screen transitions.
 */

class AppController {
  constructor() {
    this.selectedMode = 'ai'; // 'ai' | 'human' | 'online'
    this.playerCount = 2;
    this.aiDifficulty = 'normal';
    this.boardPreset = 'classic';
    this.editingPlayerIndex = 0; // For character picker modal
    this.editingTarget = 'local'; // 'local' | 'online-host' | 'online-join'

    // Up to 6 players supported with distinct characters & colors
    this.playerConfigs = [
      { name: 'Player 1', characterId: 'dragon', color: '#06b6d4', isAi: false },
      { name: 'AI Bot 🤖', characterId: 'cyberbot', color: '#f59e0b', isAi: true },
      { name: 'Player 3', characterId: 'wizard', color: '#a855f7', isAi: false },
      { name: 'Player 4', characterId: 'ninjacat', color: '#ec4899', isAi: false },
      { name: 'Player 5', characterId: 'astronaut', color: '#3b82f6', isAi: false },
      { name: 'Player 6', characterId: 'knight', color: '#10b981', isAi: false }
    ];

    // Online Multiplayer Setup State
    this.onlineHostConfig = {
      name: 'Player 1',
      characterId: 'dragon',
      color: '#06b6d4',
      maxPlayers: 4,
      preset: 'classic'
    };

    this.onlineJoinConfig = {
      name: 'Guest Player',
      characterId: 'cyberbot',
      color: '#ec4899'
    };

    // Custom Editor State
    this.customSnakes = [...BOARD_PRESETS.classic.snakes];
    this.customLadders = [...BOARD_PRESETS.classic.ladders];

    this.init();
  }

  init() {
    // 1. Initialize Themes & Sound
    if (window.themeManager) window.themeManager.init();
    this.loadSavedSettings();

    // 2. Setup Modals and Screen Listeners
    this.initModals();
    this.initStartScreen();
    this.initOnlineHub();
    this.initHeaderButtons();
    this.initCustomizer();
    this.initSettings();
    this.initVictoryButtons();
    this.initInGameReactions();

    // 3. Check for Saved Active Game
    this.checkContinueGame();

    // 4. Check URL for direct room invitation link (e.g. ?room=K9X2B)
    this.checkDirectRoomInvite();
  }

  // Check URL query parameters for ?room=CODE
  checkDirectRoomInvite() {
    if (!window.multiplayerManager) return;
    const roomCode = window.multiplayerManager.checkUrlForRoom();
    if (roomCode) {
      this.selectedMode = 'online';
      const modeGrid = document.querySelector('.mode-grid');
      const continueCont = document.getElementById('continue-game-container');
      const onlineHub = document.getElementById('online-hub-panel');
      const inputCode = document.getElementById('input-room-code');

      if (modeGrid) modeGrid.classList.add('hidden');
      if (continueCont) continueCont.classList.add('hidden');
      if (onlineHub) onlineHub.classList.remove('hidden');

      // Switch to Join tab
      this.switchOnlineTab('join');
      if (inputCode) {
        inputCode.value = roomCode;
        inputCode.classList.add('pulse-input');
      }

      if (window.gameEngine) {
        window.gameEngine.showToast(`Found invite for Room ${roomCode}! Enter your name and join.`, 'ladder');
      }
    }
  }

  // Check if saved match exists in localStorage
  checkContinueGame() {
    const continueContainer = document.getElementById('continue-game-container');
    const continueModeText = document.getElementById('continue-mode-text');
    const continueDetailsText = document.getElementById('continue-details-text');
    const btnContinue = document.getElementById('btn-continue-game');

    if (!window.storageManager || !continueContainer) return;

    const savedGame = window.storageManager.loadActiveGame();
    if (savedGame && savedGame.players && savedGame.players.length > 0) {
      continueContainer.classList.remove('hidden');
      if (continueModeText) {
        continueModeText.textContent = savedGame.mode === 'ai' ? 'AI Match in Progress' : 'Multiplayer Match';
      }
      if (continueDetailsText) {
        continueDetailsText.textContent = `Turn ${savedGame.turnCount} • ${savedGame.players.length} Players • Current: ${savedGame.players[savedGame.currentTurnIndex]?.name}`;
      }

      if (btnContinue) {
        btnContinue.onclick = () => {
          this.showGameScreen();
          if (window.gameEngine) {
            window.gameEngine.restoreGame(savedGame);
          }
        };
      }
    } else {
      continueContainer.classList.add('hidden');
    }
  }

  // Start Screen Mode Choosers & Player Setup
  initStartScreen() {
    const modeCards = document.querySelectorAll('.mode-card, .btn-select-mode');
    const setupPanel = document.getElementById('setup-panel');
    const onlineHub = document.getElementById('online-hub-panel');
    const modeGrid = document.querySelector('.mode-grid');
    const btnBack = document.getElementById('btn-setup-back');
    const btnOnlineBack = document.getElementById('btn-online-back');
    const btnStart = document.getElementById('btn-start-match');
    const countPills = document.querySelectorAll('#setup-panel .count-pill');
    const diffPills = document.querySelectorAll('#setup-panel .diff-pill');
    const presetPills = document.querySelectorAll('#setup-panel .preset-pill');
    const aiGroup = document.getElementById('ai-difficulty-group');

    modeCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const mode = card.dataset.mode || card.closest('.mode-card')?.dataset.mode;
        if (!mode) return;
        this.selectedMode = mode;

        if (modeGrid) modeGrid.classList.add('hidden');
        const continueCont = document.getElementById('continue-game-container');
        if (continueCont) continueCont.classList.add('hidden');

        if (mode === 'online') {
          // Open Online Hub
          if (setupPanel) setupPanel.classList.add('hidden');
          if (onlineHub) onlineHub.classList.remove('hidden');
          this.renderOnlineHubProfile();
        } else {
          // Open Local / AI Setup Panel
          if (onlineHub) onlineHub.classList.add('hidden');
          if (setupPanel) setupPanel.classList.remove('hidden');

          if (aiGroup) {
            if (mode === 'ai') {
              aiGroup.classList.remove('hidden');
              for (let i = 1; i < this.playerConfigs.length; i++) {
                this.playerConfigs[i].isAi = true;
                this.playerConfigs[i].name = `AI Bot ${i} 🤖`;
              }
            } else {
              aiGroup.classList.add('hidden');
              for (let i = 1; i < this.playerConfigs.length; i++) {
                this.playerConfigs[i].isAi = false;
                this.playerConfigs[i].name = `Player ${i + 1}`;
              }
            }
          }

          this.renderPlayerSetupCards();
        }
      });
    });

    if (btnBack) {
      btnBack.addEventListener('click', () => {
        if (setupPanel) setupPanel.classList.add('hidden');
        if (modeGrid) modeGrid.classList.remove('hidden');
        this.checkContinueGame();
      });
    }

    if (btnOnlineBack) {
      btnOnlineBack.addEventListener('click', () => {
        if (onlineHub) onlineHub.classList.add('hidden');
        if (modeGrid) modeGrid.classList.remove('hidden');
        this.checkContinueGame();
      });
    }

    // Player Count Pills (Local/AI: 2 to 6)
    countPills.forEach(pill => {
      pill.addEventListener('click', () => {
        countPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.playerCount = parseInt(pill.dataset.count, 10);
        this.renderPlayerSetupCards();
      });
    });

    // AI Difficulty Pills
    diffPills.forEach(pill => {
      pill.addEventListener('click', () => {
        diffPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.aiDifficulty = pill.dataset.diff;
        if (window.aiBotEngine) window.aiBotEngine.setDifficulty(this.aiDifficulty);
      });
    });

    // Preset Board Pills
    presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        presetPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.boardPreset = pill.dataset.preset;
      });
    });

    // Start Game Button
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.startMatch();
      });
    }
  }

  // Render Player Configuration Cards in Setup Panel (2 to 6 players)
  renderPlayerSetupCards() {
    const list = document.getElementById('player-config-list');
    if (!list) return;
    list.innerHTML = '';

    for (let i = 0; i < this.playerCount; i++) {
      const config = this.playerConfigs[i];
      const isAi = this.selectedMode === 'ai' && i > 0;
      config.isAi = isAi;

      const card = document.createElement('div');
      card.className = 'player-config-card';

      const charData = window.GAME_CHARACTERS[config.characterId] || window.GAME_CHARACTERS.dragon;

      card.innerHTML = `
        <button class="player-avatar-btn" data-player-index="${i}" title="Change Avatar">
          ${charData.renderSvg(config.color)}
        </button>
        <div class="player-inputs">
          <input type="text" class="player-name-input" data-player-index="${i}" value="${config.name}" placeholder="Player Name" maxlength="16">
          <div class="player-color-picker-row">
            ${window.CHARACTER_PALETTES.map(color => `
              <span class="color-swatch ${color === config.color ? 'selected' : ''}" 
                    data-player-index="${i}" 
                    data-color="${color}" 
                    style="background-color: ${color};">
              </span>
            `).join('')}
          </div>
        </div>
      `;

      list.appendChild(card);
    }

    // Bind Avatar Click (Opens Character Picker for local player)
    list.querySelectorAll('.player-avatar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editingTarget = 'local';
        this.editingPlayerIndex = parseInt(btn.dataset.playerIndex, 10);
        this.openModal('modal-characters');
      });
    });

    // Bind Name Inputs
    list.querySelectorAll('.player-name-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.playerIndex, 10);
        this.playerConfigs[idx].name = e.target.value.trim() || `Player ${idx + 1}`;
      });
    });

    // Bind Color Swatches
    list.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.playerIndex, 10);
        const color = e.target.dataset.color;
        this.playerConfigs[idx].color = color;
        this.renderPlayerSetupCards();
      });
    });
  }

  // ================= ONLINE MULTIPLAYER HUB =================

  initOnlineHub() {
    const tabCreate = document.getElementById('tab-btn-create-room');
    const tabJoin = document.getElementById('tab-btn-join-room');
    const btnCreateSubmit = document.getElementById('btn-create-room-submit');
    const btnJoinSubmit = document.getElementById('btn-join-room-submit');
    const hostCountPills = document.querySelectorAll('.online-count-pills .count-pill');
    const hostPresetPills = document.querySelectorAll('.online-preset-pills .preset-pill');

    const btnHostAvatar = document.getElementById('btn-online-host-avatar');
    const btnJoinAvatar = document.getElementById('btn-online-join-avatar');
    const inputHostName = document.getElementById('online-host-name');
    const inputJoinName = document.getElementById('online-join-name');
    const inputRoomCode = document.getElementById('input-room-code');

    const btnCopyCode = document.getElementById('btn-copy-lobby-code');
    const btnCopyLink = document.getElementById('btn-copy-lobby-link');
    const btnStartOnlineMatch = document.getElementById('btn-start-online-match');
    const btnLeaveLobby = document.getElementById('btn-leave-lobby');

    // Tab switching
    tabCreate?.addEventListener('click', () => this.switchOnlineTab('create'));
    tabJoin?.addEventListener('click', () => this.switchOnlineTab('join'));

    // Host max players pills
    hostCountPills.forEach(pill => {
      pill.addEventListener('click', () => {
        hostCountPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.onlineHostConfig.maxPlayers = parseInt(pill.dataset.count, 10);
      });
    });

    // Host preset pills
    hostPresetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        hostPresetPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.onlineHostConfig.preset = pill.dataset.preset;
      });
    });

    // Host Avatar & Name
    btnHostAvatar?.addEventListener('click', () => {
      this.editingTarget = 'online-host';
      this.openModal('modal-characters');
    });

    inputHostName?.addEventListener('input', (e) => {
      this.onlineHostConfig.name = e.target.value.trim() || 'Host Player';
    });

    // Join Avatar & Name & Code
    btnJoinAvatar?.addEventListener('click', () => {
      this.editingTarget = 'online-join';
      this.openModal('modal-characters');
    });

    inputJoinName?.addEventListener('input', (e) => {
      this.onlineJoinConfig.name = e.target.value.trim() || 'Guest Player';
    });

    inputRoomCode?.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    // Submit Create Room
    btnCreateSubmit?.addEventListener('click', () => {
      if (!window.multiplayerManager) return;
      btnCreateSubmit.disabled = true;
      btnCreateSubmit.textContent = '⏳ Creating Room...';

      window.multiplayerManager.createRoom({
        playerName: this.onlineHostConfig.name,
        characterId: this.onlineHostConfig.characterId,
        color: this.onlineHostConfig.color,
        maxPlayers: this.onlineHostConfig.maxPlayers,
        preset: this.onlineHostConfig.preset
      }, (res) => {
        btnCreateSubmit.disabled = false;
        btnCreateSubmit.textContent = '🚀 Create Private Room';

        if (res && res.success) {
          this.showLobbyPanel(res.room);
        } else {
          alert(res ? res.message : 'Failed to connect to multiplayer server.');
        }
      });
    });

    // Submit Join Room
    btnJoinSubmit?.addEventListener('click', () => {
      const code = inputRoomCode ? inputRoomCode.value.trim().toUpperCase() : '';
      if (!code || code.length !== 5) {
        alert('Please enter a valid 5-character alphanumeric room code (e.g. K9X2B)!');
        return;
      }

      btnJoinSubmit.disabled = true;
      btnJoinSubmit.textContent = '⏳ Joining Room...';

      window.multiplayerManager.joinRoom(code, {
        playerName: this.onlineJoinConfig.name,
        characterId: this.onlineJoinConfig.characterId,
        color: this.onlineJoinConfig.color
      }, (res) => {
        btnJoinSubmit.disabled = false;
        btnJoinSubmit.textContent = '🔑 Join Room Now';

        if (res && res.success) {
          this.showLobbyPanel(res.room);
        } else {
          alert(res ? res.message : 'Failed to join room. Please check the 5-letter code!');
        }
      });
    });

    // Copy Room Code & Link in Lobby
    btnCopyCode?.addEventListener('click', () => {
      if (window.multiplayerManager) {
        window.multiplayerManager.copyRoomCode();
      }
    });

    btnCopyLink?.addEventListener('click', () => {
      if (window.multiplayerManager) {
        window.multiplayerManager.copyShareLink();
      }
    });

    // Host Starts Online Match
    btnStartOnlineMatch?.addEventListener('click', () => {
      if (!window.multiplayerManager) return;
      btnStartOnlineMatch.disabled = true;
      btnStartOnlineMatch.textContent = '⏳ Starting...';

      window.multiplayerManager.startGame((res) => {
        btnStartOnlineMatch.disabled = false;
        btnStartOnlineMatch.textContent = '🎮 Start Match';

        if (res && !res.success) {
          alert(res.message || 'Could not start match yet.');
        }
      });
    });

    // Leave Lobby
    btnLeaveLobby?.addEventListener('click', () => {
      if (confirm('Leave this room and return to main menu?')) {
        if (window.multiplayerManager) window.multiplayerManager.leaveRoom();
        const lobbyPanel = document.getElementById('online-lobby-panel');
        const onlineHub = document.getElementById('online-hub-panel');
        if (lobbyPanel) lobbyPanel.classList.add('hidden');
        if (onlineHub) onlineHub.classList.remove('hidden');
      }
    });

    // Register lobby update callback
    if (window.multiplayerManager) {
      window.multiplayerManager.onRoomUpdated = (room) => {
        this.renderLobbyRoster(room);
      };
    }
  }

  switchOnlineTab(tabKey) {
    const tabCreate = document.getElementById('tab-btn-create-room');
    const tabJoin = document.getElementById('tab-btn-join-room');
    const contentCreate = document.getElementById('tab-content-create');
    const contentJoin = document.getElementById('tab-content-join');

    if (tabKey === 'create') {
      tabCreate?.classList.add('active');
      tabJoin?.classList.remove('active');
      contentCreate?.classList.remove('hidden');
      contentJoin?.classList.add('hidden');
    } else {
      tabJoin?.classList.add('active');
      tabCreate?.classList.remove('active');
      contentJoin?.classList.remove('hidden');
      contentCreate?.classList.add('hidden');
    }
  }

  renderOnlineHubProfile() {
    // Render Host Avatar & Swatches
    const btnHostAvatar = document.getElementById('btn-online-host-avatar');
    const hostColorsRow = document.getElementById('online-host-colors');
    const charDataHost = window.GAME_CHARACTERS[this.onlineHostConfig.characterId] || window.GAME_CHARACTERS.dragon;

    if (btnHostAvatar) btnHostAvatar.innerHTML = charDataHost.renderSvg(this.onlineHostConfig.color);
    if (hostColorsRow) {
      hostColorsRow.innerHTML = window.CHARACTER_PALETTES.map(c => `
        <span class="color-swatch ${c === this.onlineHostConfig.color ? 'selected' : ''}" 
              data-target="online-host" 
              data-color="${c}" 
              style="background-color:${c};">
        </span>
      `).join('');
      hostColorsRow.querySelectorAll('.color-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
          this.onlineHostConfig.color = sw.dataset.color;
          this.renderOnlineHubProfile();
        });
      });
    }

    // Render Join Avatar & Swatches
    const btnJoinAvatar = document.getElementById('btn-online-join-avatar');
    const joinColorsRow = document.getElementById('online-join-colors');
    const charDataJoin = window.GAME_CHARACTERS[this.onlineJoinConfig.characterId] || window.GAME_CHARACTERS.cyberbot;

    if (btnJoinAvatar) btnJoinAvatar.innerHTML = charDataJoin.renderSvg(this.onlineJoinConfig.color);
    if (joinColorsRow) {
      joinColorsRow.innerHTML = window.CHARACTER_PALETTES.map(c => `
        <span class="color-swatch ${c === this.onlineJoinConfig.color ? 'selected' : ''}" 
              data-target="online-join" 
              data-color="${c}" 
              style="background-color:${c};">
        </span>
      `).join('');
      joinColorsRow.querySelectorAll('.color-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
          this.onlineJoinConfig.color = sw.dataset.color;
          this.renderOnlineHubProfile();
        });
      });
    }
  }

  // Show Waiting Lobby
  showLobbyPanel(room) {
    const hubPanel = document.getElementById('online-hub-panel');
    const lobbyPanel = document.getElementById('online-lobby-panel');
    const lobbyCodeDisplay = document.getElementById('lobby-code-display');

    if (hubPanel) hubPanel.classList.add('hidden');
    if (lobbyPanel) lobbyPanel.classList.remove('hidden');

    if (lobbyCodeDisplay) {
      lobbyCodeDisplay.textContent = room.code;
    }

    this.renderLobbyRoster(room);
  }

  renderLobbyRoster(room) {
    if (!room) return;
    const grid = document.getElementById('lobby-players-grid');
    const countEl = document.getElementById('lobby-player-count');
    const maxEl = document.getElementById('lobby-max-count');
    const btnStart = document.getElementById('btn-start-online-match');

    if (countEl) countEl.textContent = room.players.length;
    if (maxEl) maxEl.textContent = room.maxPlayers;

    if (grid) {
      grid.innerHTML = room.players.map((p, idx) => {
        const charData = window.GAME_CHARACTERS[p.characterId] || window.GAME_CHARACTERS.dragon;
        const isMe = window.multiplayerManager && window.multiplayerManager.myPlayerIndex === idx;
        return `
          <div class="lobby-player-card ${isMe ? 'is-self' : ''}">
            <div class="lobby-avatar-wrap" style="border-color:${p.color};">
              ${charData.renderSvg(p.color)}
            </div>
            <div class="lobby-player-info">
              <span class="lobby-player-name">${p.name} ${isMe ? '(You)' : ''}</span>
              <div class="lobby-player-badge">
                ${p.isHost ? '<span class="host-badge">👑 HOST</span>' : '<span class="ready-badge">✅ READY</span>'}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Host start button control
    if (btnStart) {
      const isHost = window.multiplayerManager && window.multiplayerManager.isHost;
      btnStart.style.display = isHost ? 'inline-flex' : 'none';
      btnStart.disabled = room.players.length < 2;
      if (room.players.length < 2) {
        btnStart.title = 'Need at least 2 players to start match.';
      } else {
        btnStart.title = 'Start the match now!';
      }
    }
  }

  // ================= IN-GAME QUICK REACTIONS =================

  initInGameReactions() {
    const reactionButtons = document.querySelectorAll('.btn-reaction');
    reactionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji;
        if (!emoji) return;

        // If online, broadcast to all players
        if (this.selectedMode === 'online' && window.multiplayerManager) {
          window.multiplayerManager.sendReaction(emoji);
        } else {
          // Local play floating reaction
          if (window.multiplayerManager) {
            const curP = window.gameEngine ? window.gameEngine.getCurrentPlayer() : null;
            window.multiplayerManager.renderFloatingReaction(emoji, curP ? curP.name : 'Player', curP ? curP.color : '#06b6d4');
          }
        }

        // Button pop animation
        btn.classList.add('btn-pop');
        setTimeout(() => btn.classList.remove('btn-pop'), 200);
      });
    });

    // In-game Room Code copy buttons
    document.getElementById('btn-copy-ingame-code')?.addEventListener('click', () => {
      if (window.multiplayerManager) window.multiplayerManager.copyRoomCode();
    });

    document.getElementById('btn-copy-ingame-link')?.addEventListener('click', () => {
      if (window.multiplayerManager) window.multiplayerManager.copyShareLink();
    });
  }

  // Start the local / AI game
  startMatch() {
    const activePlayers = this.playerConfigs.slice(0, this.playerCount);
    let customBoardData = null;
    if (this.boardPreset === 'custom' && window.storageManager) {
      customBoardData = window.storageManager.getCustomBoard();
      if (!customBoardData) {
        customBoardData = { snakes: this.customSnakes, ladders: this.customLadders };
      }
    }

    this.showGameScreen();

    if (window.gameEngine) {
      window.gameEngine.startNewGame(this.selectedMode, activePlayers, this.boardPreset, customBoardData);
    }
  }

  showGameScreen() {
    const screenStart = document.getElementById('screen-start');
    if (screenStart) screenStart.classList.remove('active');
  }

  showStartScreen() {
    const screenStart = document.getElementById('screen-start');
    if (screenStart) screenStart.classList.add('active');
    const setupPanel = document.getElementById('setup-panel');
    const onlineHub = document.getElementById('online-hub-panel');
    const onlineLobby = document.getElementById('online-lobby-panel');
    const modeGrid = document.querySelector('.mode-grid');

    if (setupPanel) setupPanel.classList.add('hidden');
    if (onlineHub) onlineHub.classList.add('hidden');
    if (onlineLobby) onlineLobby.classList.add('hidden');
    if (modeGrid) modeGrid.classList.remove('hidden');

    this.checkContinueGame();
  }

  // Header Nav Actions & Modals
  initHeaderButtons() {
    // Theme modal
    document.getElementById('btn-theme-modal')?.addEventListener('click', () => {
      this.populateThemeGrid();
      this.openModal('modal-theme');
    });

    // Dice skin modal
    document.getElementById('btn-dice-modal')?.addEventListener('click', () => {
      this.populateDiceSkinGrid();
      this.openModal('modal-dice');
    });

    // Customizer modal
    document.getElementById('btn-board-customizer')?.addEventListener('click', () => {
      this.openCustomizerModal();
    });

    // History & Stats modal
    document.getElementById('btn-history-modal')?.addEventListener('click', () => {
      this.renderHistoryAndStats();
      this.openModal('modal-history');
    });

    // Move Log modal
    document.getElementById('btn-replay-last')?.addEventListener('click', () => {
      this.renderMoveLog();
      this.openModal('modal-movelog');
    });

    // Settings modal
    document.getElementById('btn-settings-modal')?.addEventListener('click', () => {
      this.openModal('modal-settings');
    });

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = soundBtn.classList.toggle('muted');
        soundBtn.querySelector('.sound-icon').textContent = isMuted ? '🔇' : '🔊';
        if (window.soundEngine) window.soundEngine.setMuted(isMuted);
      });
    }

    // New Game Confirmation
    document.getElementById('btn-new-game-confirm')?.addEventListener('click', () => {
      if (confirm('Return to main menu? Your game progress is saved.')) {
        this.showStartScreen();
      }
    });
  }

  // Initialize Modal Open/Close functionality
  initModals() {
    document.querySelectorAll('.btn-modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.close;
        if (modalId) this.closeModal(modalId);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
      }
    });

    this.populateCharacterGrid();
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
    if (window.soundEngine) window.soundEngine.playClick();
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  // Populate Themes in Modal
  populateThemeGrid() {
    const grid = document.getElementById('theme-options-grid');
    if (!grid || !window.THEMES) return;

    grid.innerHTML = window.THEMES.map(theme => {
      const isActive = document.body.classList.contains(theme.cssClass);
      return `
        <div class="theme-card ${isActive ? 'active' : ''}" data-theme-class="${theme.cssClass}">
          <div class="theme-preview-swatch" style="background: ${theme.previewGradient};">
            ${theme.emoji}
          </div>
          <span class="theme-card-name">${theme.name}</span>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const themeClass = card.dataset.themeClass;
        if (window.themeManager) window.themeManager.applyTheme(themeClass);
        this.populateThemeGrid();
      });
    });
  }

  // Populate Dice Skins in Modal
  populateDiceSkinGrid() {
    const grid = document.getElementById('dice-skins-grid');
    if (!grid || !window.DICE_SKINS) return;

    const diceCube = document.getElementById('dice-cube');
    const currentSkin = window.DICE_SKINS.find(s => diceCube && diceCube.classList.contains(s.cssClass))?.cssClass || 'dice-skin-cyberpunk';

    grid.innerHTML = window.DICE_SKINS.map(skin => {
      const isActive = skin.cssClass === currentSkin;
      return `
        <div class="dice-skin-card ${isActive ? 'active' : ''}" data-skin-class="${skin.cssClass}">
          <div class="dice-skin-preview">
            ${skin.emoji}
          </div>
          <span class="dice-skin-name">${skin.name}</span>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.dice-skin-card').forEach(card => {
      card.addEventListener('click', () => {
        const skinClass = card.dataset.skinClass;
        if (window.themeManager) window.themeManager.applyDiceSkin(skinClass);
        this.populateDiceSkinGrid();
      });
    });
  }

  // Populate Character Picker in Modal
  populateCharacterGrid() {
    const grid = document.getElementById('characters-picker-grid');
    if (!grid || !window.GAME_CHARACTERS) return;

    grid.innerHTML = Object.values(window.GAME_CHARACTERS).map(char => {
      return `
        <div class="character-card" data-char-id="${char.id}">
          <div class="char-card-avatar">
            ${char.renderSvg(char.defaultColor)}
          </div>
          <span class="character-card-name">${char.name}</span>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.character-card').forEach(card => {
      card.addEventListener('click', () => {
        const charId = card.dataset.charId;

        if (this.editingTarget === 'online-host') {
          this.onlineHostConfig.characterId = charId;
          this.renderOnlineHubProfile();
        } else if (this.editingTarget === 'online-join') {
          this.onlineJoinConfig.characterId = charId;
          this.renderOnlineHubProfile();
        } else if (this.playerConfigs[this.editingPlayerIndex]) {
          this.playerConfigs[this.editingPlayerIndex].characterId = charId;
          this.renderPlayerSetupCards();
        }

        this.closeModal('modal-characters');
      });
    });
  }

  // Custom Board Editor / Builder
  initCustomizer() {
    const typeSelect = document.getElementById('custom-element-type');
    const startLabel = document.getElementById('custom-start-label');
    const endLabel = document.getElementById('custom-end-label');
    const fromInput = document.getElementById('custom-from-tile');
    const toInput = document.getElementById('custom-to-tile');
    const btnAdd = document.getElementById('btn-add-custom-element');
    const valMsg = document.getElementById('custom-validation-msg');
    const btnSave = document.getElementById('btn-save-custom-board');

    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        if (typeSelect.value === 'snake') {
          if (startLabel) startLabel.textContent = 'Head Tile (Drop from):';
          if (endLabel) endLabel.textContent = 'Tail Tile (Slide to):';
          if (fromInput) fromInput.value = '50';
          if (toInput) toInput.value = '12';
        } else {
          if (startLabel) startLabel.textContent = 'Base Tile (Climb from):';
          if (endLabel) endLabel.textContent = 'Top Tile (Climb to):';
          if (fromInput) fromInput.value = '15';
          if (toInput) toInput.value = '48';
        }
      });
    }

    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        const type = typeSelect.value;
        const from = parseInt(fromInput.value, 10);
        const to = parseInt(toInput.value, 10);

        if (isNaN(from) || isNaN(to) || from < 2 || from > 99 || to < 1 || to > 99 || from === to) {
          if (valMsg) valMsg.textContent = 'Tiles must be between 2 and 99 and cannot be equal!';
          return;
        }

        if (type === 'snake' && from <= to) {
          if (valMsg) valMsg.textContent = 'Snake head must be higher than tail!';
          return;
        }

        if (type === 'ladder' && from >= to) {
          if (valMsg) valMsg.textContent = 'Ladder base must be lower than top!';
          return;
        }

        const conflictSnake = this.customSnakes.find(s => s.from === from);
        const conflictLadder = this.customLadders.find(l => l.from === from);
        if (conflictSnake || conflictLadder) {
          if (valMsg) valMsg.textContent = `Tile ${from} already has a snake or ladder!`;
          return;
        }

        if (valMsg) valMsg.textContent = '';

        if (type === 'snake') {
          this.customSnakes.push({ from, to });
        } else {
          this.customLadders.push({ from, to });
        }

        this.renderCustomElementsList();
        this.updateCustomPreview();
      });
    }

    document.getElementById('btn-load-preset-classic')?.addEventListener('click', () => {
      this.customSnakes = [...BOARD_PRESETS.classic.snakes];
      this.customLadders = [...BOARD_PRESETS.classic.ladders];
      this.renderCustomElementsList();
      this.updateCustomPreview();
    });

    document.getElementById('btn-load-preset-snakes')?.addEventListener('click', () => {
      this.customSnakes = [...BOARD_PRESETS.high_snakes.snakes];
      this.customLadders = [...BOARD_PRESETS.high_snakes.ladders];
      this.renderCustomElementsList();
      this.updateCustomPreview();
    });

    document.getElementById('btn-load-preset-ladders')?.addEventListener('click', () => {
      this.customSnakes = [...BOARD_PRESETS.high_ladders.snakes];
      this.customLadders = [...BOARD_PRESETS.high_ladders.ladders];
      this.renderCustomElementsList();
      this.updateCustomPreview();
    });

    document.getElementById('btn-clear-all-elements')?.addEventListener('click', () => {
      this.customSnakes = [];
      this.customLadders = [];
      this.renderCustomElementsList();
      this.updateCustomPreview();
    });

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const boardData = { snakes: this.customSnakes, ladders: this.customLadders };
        if (window.storageManager) window.storageManager.saveCustomBoard(boardData);
        if (window.boardRenderer) {
          window.boardRenderer.setPreset('custom', boardData);
        }
        if (window.gameEngine) {
          window.gameEngine.showToast('Custom Snakes & Ladders applied to board!', 'ladder');
        }
        this.closeModal('modal-customizer');
      });
    }
  }

  openCustomizerModal() {
    if (window.boardRenderer) {
      this.customSnakes = [...window.boardRenderer.snakes];
      this.customLadders = [...window.boardRenderer.ladders];
    }
    this.renderCustomElementsList();
    this.updateCustomPreview();
    this.openModal('modal-customizer');
  }

  renderCustomElementsList() {
    const snakesList = document.getElementById('custom-snakes-list');
    const laddersList = document.getElementById('custom-ladders-list');
    const countSnakes = document.getElementById('count-snakes');
    const countLadders = document.getElementById('count-ladders');

    if (countSnakes) countSnakes.textContent = this.customSnakes.length;
    if (countLadders) countLadders.textContent = this.customLadders.length;

    if (snakesList) {
      snakesList.innerHTML = this.customSnakes.map((s, idx) => `
        <div class="element-tag snake-tag">
          <span>🐍 ${s.from} → ${s.to}</span>
          <span class="btn-remove-tag" data-type="snake" data-index="${idx}">&times;</span>
        </div>
      `).join('');
    }

    if (laddersList) {
      laddersList.innerHTML = this.customLadders.map((l, idx) => `
        <div class="element-tag ladder-tag">
          <span>🪜 ${l.from} → ${l.to}</span>
          <span class="btn-remove-tag" data-type="ladder" data-index="${idx}">&times;</span>
        </div>
      `).join('');
    }

    document.querySelectorAll('.btn-remove-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const idx = parseInt(btn.dataset.index, 10);
        if (type === 'snake') {
          this.customSnakes.splice(idx, 1);
        } else {
          this.customLadders.splice(idx, 1);
        }
        this.renderCustomElementsList();
        this.updateCustomPreview();
      });
    });
  }

  updateCustomPreview() {
    const previewWrap = document.getElementById('preview-board-wrap');
    if (previewWrap && window.boardRenderer) {
      window.boardRenderer.renderCustomPreview(previewWrap, this.customSnakes, this.customLadders);
    }
  }

  // History & Statistics Modal
  renderHistoryAndStats() {
    if (!window.storageManager) return;

    const stats = window.storageManager.getStats();
    const history = window.storageManager.getHistory();

    const statGames = document.getElementById('stat-total-games');
    const statHuman = document.getElementById('stat-human-wins');
    const statAi = document.getElementById('stat-ai-wins');
    const statSnakes = document.getElementById('stat-snakes-bitten');
    const statLadders = document.getElementById('stat-ladders-climbed');

    if (statGames) statGames.textContent = stats.totalGames;
    if (statHuman) statHuman.textContent = stats.humanWins;
    if (statAi) statAi.textContent = stats.aiWins;
    if (statSnakes) statSnakes.textContent = stats.snakesBitten;
    if (statLadders) statLadders.textContent = stats.laddersClimbed;

    const historyList = document.getElementById('history-items-container');
    if (historyList) {
      if (history.length === 0) {
        historyList.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">No match records yet. Play a game to see your history!</p>`;
      } else {
        historyList.innerHTML = history.map(item => `
          <div class="history-item">
            <div class="history-winner-col">
              <span style="font-size:18px;">👑</span>
              <div>
                <strong>${item.winnerName}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${item.date} • ${item.mode}</div>
              </div>
            </div>
            <div class="history-item-details">
              <span><strong>${item.turns}</strong> turns</span>
              <span><strong>${item.duration}</strong></span>
            </div>
          </div>
        `).join('');
      }
    }

    document.getElementById('btn-clear-history')?.addEventListener('click', () => {
      if (confirm('Clear all match history?')) {
        window.storageManager.clearHistory();
        this.renderHistoryAndStats();
      }
    });
  }

  // Move Log Modal
  renderMoveLog() {
    const list = document.getElementById('move-log-list');
    if (!list || !window.gameEngine) return;

    const logs = window.gameEngine.moveLogs;
    if (logs.length === 0) {
      list.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">No moves recorded yet.</p>`;
      return;
    }

    list.innerHTML = logs.map(l => `
      <div class="move-log-entry ${l.typeClass}">
        <span class="log-turn-num">T${l.turn}</span>
        <div class="log-desc">
          <strong style="color:${l.playerColor};">${l.playerName}</strong> rolled <strong>${l.roll}</strong> (${l.from} → ${l.to})
          ${l.specialNote ? `<div style="font-size:0.78rem; opacity:0.9;">${l.specialNote}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  // Settings & Toggles
  initSettings() {
    const sfxToggle = document.getElementById('setting-sfx');
    const volSlider = document.getElementById('setting-volume');
    const fastToggle = document.getElementById('setting-fast-mode');
    const shakeToggle = document.getElementById('setting-shake');
    const aiAutoToggle = document.getElementById('setting-ai-autoroll');

    const update = () => {
      const newSettings = {
        sfx: sfxToggle?.checked ?? true,
        volume: parseInt(volSlider?.value || '75', 10),
        fastMode: fastToggle?.checked ?? false,
        screenShake: shakeToggle?.checked ?? true,
        aiAutoRoll: aiAutoToggle?.checked ?? true
      };

      if (window.storageManager) window.storageManager.saveSettings(newSettings);
      if (window.soundEngine) {
        window.soundEngine.setMuted(!newSettings.sfx);
        window.soundEngine.setVolume(newSettings.volume / 100);
      }
    };

    [sfxToggle, volSlider, fastToggle, shakeToggle, aiAutoToggle].forEach(el => {
      el?.addEventListener('change', update);
      el?.addEventListener('input', update);
    });
  }

  loadSavedSettings() {
    if (!window.storageManager) return;
    const settings = window.storageManager.getSettings();

    const sfxToggle = document.getElementById('setting-sfx');
    const volSlider = document.getElementById('setting-volume');
    const fastToggle = document.getElementById('setting-fast-mode');
    const shakeToggle = document.getElementById('setting-shake');
    const aiAutoToggle = document.getElementById('setting-ai-autoroll');

    if (sfxToggle) sfxToggle.checked = settings.sfx;
    if (volSlider) volSlider.value = settings.volume;
    if (fastToggle) fastToggle.checked = settings.fastMode;
    if (shakeToggle) shakeToggle.checked = settings.screenShake;
    if (aiAutoToggle) aiAutoToggle.checked = settings.aiAutoRoll;

    if (window.soundEngine) {
      window.soundEngine.setMuted(!settings.sfx);
      window.soundEngine.setVolume(settings.volume / 100);
    }
  }

  // Victory Rematch / Menu buttons
  initVictoryButtons() {
    document.getElementById('btn-victory-rematch')?.addEventListener('click', () => {
      this.closeModal('modal-victory');
      if (this.selectedMode === 'online' && window.multiplayerManager) {
        window.multiplayerManager.rematch((res) => {
          if (res && !res.success) alert(res.message);
        });
      } else {
        this.startMatch();
      }
    });

    document.getElementById('btn-victory-menu')?.addEventListener('click', () => {
      this.closeModal('modal-victory');
      this.showStartScreen();
    });
  }
}

// Instantiate App after DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});
