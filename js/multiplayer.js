/**
 * Snake & Ladder Deluxe - Real-Time Multiplayer Client Controller
 * Manages Socket.IO connection, 5-alphanumeric room creation, joining,
 * lobby synchronization, turn lockouts, and floating reaction emojis.
 */

class MultiplayerManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.roomCode = null;
    this.isHost = false;
    this.myPlayerIndex = -1;
    this.currentRoom = null;
    this.isOnlineMatch = false;

    // Callbacks
    this.onRoomUpdated = null;
    this.onGameStarted = null;
    this.onRemoteRoll = null;
    this.onReaction = null;

    this.initSocket();
  }

  // Initialize Socket.IO connection
  initSocket() {
    if (typeof io === 'undefined') {
      console.warn('Socket.IO client library not loaded. Online multiplayer requires server connection.');
      this.updateConnectionBadge('offline');
      return;
    }

    try {
      this.socket = io(window.location.origin, {
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('[Multiplayer] Connected to server:', this.socket.id);
        this.updateConnectionBadge('connected');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.warn('[Multiplayer] Disconnected from server');
        this.updateConnectionBadge('disconnected');
      });

      this.socket.on('connect_error', (err) => {
        this.isConnected = false;
        console.warn('[Multiplayer] Connection error:', err.message);
        this.updateConnectionBadge('offline');
      });

      // Server event handlers
      this.setupSocketListeners();

    } catch (e) {
      console.error('Socket initialization error:', e);
      this.updateConnectionBadge('offline');
    }
  }

  setupSocketListeners() {
    if (!this.socket) return;

    // Room state updated (players joined/left)
    this.socket.on('room_updated', (data) => {
      this.currentRoom = data.room;
      if (data.announcement && window.gameEngine) {
        window.gameEngine.showToast(data.announcement, 'info');
      }
      if (typeof this.onRoomUpdated === 'function') {
        this.onRoomUpdated(this.currentRoom);
      }
    });

    // Game started by host
    this.socket.on('game_started', (data) => {
      this.currentRoom = data.room;
      this.isOnlineMatch = true;

      if (typeof this.onGameStarted === 'function') {
        this.onGameStarted(data);
      }
    });

    // Remote dice roll & move
    this.socket.on('dice_rolled', (data) => {
      if (typeof this.onRemoteRoll === 'function') {
        this.onRemoteRoll(data);
      }
    });

    // Floating reaction emoji received
    this.socket.on('reaction_received', (data) => {
      this.renderFloatingReaction(data.emoji, data.senderName, data.senderColor);
    });

    // Game restarted (Rematch)
    this.socket.on('game_restarted', (data) => {
      this.currentRoom = data.room;
      if (window.gameEngine) {
        window.gameEngine.restoreGame({
          mode: 'online',
          players: data.room.players,
          currentTurnIndex: 0,
          turnCount: 1,
          presetKey: data.room.preset
        });
        window.gameEngine.showToast('Match restarted! Host begins.', 'ladder');
      }
    });

    // Player left room
    this.socket.on('player_left', (data) => {
      this.currentRoom = data.room;
      if (window.gameEngine) {
        window.gameEngine.showToast(`${data.playerName} left the game.`, 'snake');
      }
      // Check if I became host
      if (this.currentRoom && this.currentRoom.hostSocketId === this.socket.id) {
        this.isHost = true;
        if (window.gameEngine) {
          window.gameEngine.showToast('You are now the room host 👑', 'ladder');
        }
      }
      if (typeof this.onRoomUpdated === 'function') {
        this.onRoomUpdated(this.currentRoom);
      }
      if (this.isOnlineMatch && window.gameEngine) {
        window.gameEngine.updateOnlineTurnState();
      }
    });
  }

  // Create new 5-alphanumeric room
  createRoom(options, callback) {
    if (!this.socket || !this.isConnected) {
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Not connected to game server. Please refresh or verify the server is running.' });
      }
      return;
    }

    this.socket.emit('create_room', options, (response) => {
      if (response && response.success) {
        this.roomCode = response.roomCode;
        this.isHost = true;
        this.myPlayerIndex = response.yourPlayerIndex;
        this.currentRoom = response.room;
        this.isOnlineMatch = false;
      }
      if (typeof callback === 'function') callback(response);
    });
  }

  // Join existing room with 5-alphanumeric code
  joinRoom(roomCode, options, callback) {
    if (!this.socket || !this.isConnected) {
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Not connected to game server. Please refresh or verify the server is running.' });
      }
      return;
    }

    const cleanCode = (roomCode || '').trim().toUpperCase();
    this.socket.emit('join_room', { roomCode: cleanCode, ...options }, (response) => {
      if (response && response.success) {
        this.roomCode = response.roomCode;
        this.isHost = false;
        this.myPlayerIndex = response.yourPlayerIndex;
        this.currentRoom = response.room;
        this.isOnlineMatch = false;
      }
      if (typeof callback === 'function') callback(response);
    });
  }

  // Update profile in lobby
  updateProfile(name, characterId, color) {
    if (!this.socket || !this.isConnected || !this.roomCode) return;
    this.socket.emit('update_player_profile', { name, characterId, color });
  }

  // Host starts the online match
  startGame(callback) {
    if (!this.socket || !this.isConnected || !this.isHost) {
      if (typeof callback === 'function') callback({ success: false, message: 'Only the host can start.' });
      return;
    }

    this.socket.emit('start_game', {}, (response) => {
      if (typeof callback === 'function') callback(response);
    });
  }

  // Local player rolls dice
  rollDice(callback) {
    if (!this.socket || !this.isConnected || !this.isOnlineMatch) {
      if (typeof callback === 'function') callback({ success: false });
      return;
    }

    this.socket.emit('roll_dice', {}, (response) => {
      if (typeof callback === 'function') callback(response);
    });
  }

  // Send in-game floating reaction emoji
  sendReaction(emoji) {
    if (!this.socket || !this.isConnected || !this.roomCode) return;
    this.socket.emit('send_reaction', { emoji });
  }

  // Request rematch
  rematch(callback) {
    if (!this.socket || !this.isConnected || !this.isHost) {
      if (typeof callback === 'function') callback({ success: false, message: 'Only host can restart match.' });
      return;
    }
    this.socket.emit('rematch', {}, callback);
  }

  // Check if current turn belongs to this local player
  isMyTurn() {
    if (!this.isOnlineMatch || !this.currentRoom) return true;
    return this.currentRoom.currentTurnIndex === this.myPlayerIndex;
  }

  getMyPlayer() {
    if (!this.currentRoom || this.myPlayerIndex < 0) return null;
    return this.currentRoom.players[this.myPlayerIndex];
  }

  // Generate shareable room link
  getShareableLink(code) {
    const targetCode = code || this.roomCode;
    if (!targetCode) return window.location.href;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('room', targetCode);
    return url.toString();
  }

  // Copy shareable link to clipboard
  async copyShareLink(code) {
    const link = this.getShareableLink(code);
    try {
      await navigator.clipboard.writeText(link);
      if (window.gameEngine) {
        window.gameEngine.showToast('📋 Room invite link copied! Share with friends.', 'info');
      }
      return true;
    } catch (e) {
      // Fallback
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      if (window.gameEngine) {
        window.gameEngine.showToast('📋 Room invite link copied to clipboard!', 'info');
      }
      return true;
    }
  }

  // Copy 5-character room code to clipboard
  async copyRoomCode(code) {
    const targetCode = code || this.roomCode;
    if (!targetCode) return;
    try {
      await navigator.clipboard.writeText(targetCode);
      if (window.gameEngine) {
        window.gameEngine.showToast(`🔑 Code "${targetCode}" copied!`, 'info');
      }
    } catch (e) {
      // Fallback
      const input = document.createElement('input');
      input.value = targetCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      if (window.gameEngine) {
        window.gameEngine.showToast(`🔑 Code "${targetCode}" copied!`, 'info');
      }
    }
  }

  // Check URL query parameters for room code
  checkUrlForRoom() {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      return roomParam.trim().toUpperCase().substring(0, 5);
    }
    return null;
  }

  // Floating reaction emoji renderer (Live-stream style)
  renderFloatingReaction(emoji, senderName, senderColor) {
    const container = document.getElementById('floating-reactions-layer') || document.body;
    const bubble = document.createElement('div');
    bubble.className = 'floating-reaction-bubble';

    const randomX = Math.floor(Math.random() * 60) + 20; // 20% to 80% from left
    bubble.style.left = `${randomX}%`;
    bubble.style.borderColor = senderColor || '#06b6d4';

    bubble.innerHTML = `
      <span class="reaction-emoji">${emoji}</span>
      <span class="reaction-sender" style="color: ${senderColor || '#ffffff'};">${senderName || 'Player'}</span>
    `;

    container.appendChild(bubble);

    // Audio cue
    if (window.soundEngine) {
      window.soundEngine.playTone(600, 'sine', 0.08, 0.15);
    }

    setTimeout(() => {
      bubble.remove();
    }, 2800);
  }

  updateConnectionBadge(status) {
    const badges = document.querySelectorAll('.server-status-pill');
    badges.forEach(badge => {
      badge.className = `server-status-pill status-${status}`;
      if (status === 'connected') {
        badge.innerHTML = `<span class="status-dot"></span> Online Server Ready`;
      } else if (status === 'disconnected') {
        badge.innerHTML = `<span class="status-dot"></span> Reconnecting...`;
      } else {
        badge.innerHTML = `<span class="status-dot"></span> Server Offline (Local Mode)`;
      }
    });
  }

  leaveRoom() {
    this.roomCode = null;
    this.isHost = false;
    this.myPlayerIndex = -1;
    this.currentRoom = null;
    this.isOnlineMatch = false;
  }
}

// Global Multiplayer Manager Instance
window.multiplayerManager = new MultiplayerManager();
