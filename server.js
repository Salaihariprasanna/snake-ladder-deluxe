/**
 * Snake & Ladder Deluxe - Real-Time Multiplayer Server
 * Powered by Node.js, Express, and Socket.IO
 * Supports 5-alphanumeric room codes, 2-6 players, live dice synchronization,
 * in-game reaction emojis, and cloud deployment ready (Render, Railway, Glitch, etc.)
 */

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));

// Health check endpoint for cloud hosting platforms (Render, Railway, Fly.io, etc.)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', activeRooms: Object.keys(rooms).length });
});

// Root route fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Characters to generate clean, unambiguous 5-alphanumeric codes
// Excludes confusing characters like 0, O, 1, I
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 5; i++) {
    const randIdx = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS[randIdx];
  }
  // If collision exists, regenerate
  return rooms[code] ? generateRoomCode() : code;
}

// In-memory active rooms store
const rooms = {};

// Board preset data for server-side verification
const SERVER_PRESETS = {
  classic: {
    ladders: [
      { from: 4, to: 14 },
      { from: 9, to: 31 },
      { from: 20, to: 38 },
      { from: 28, to: 84 },
      { from: 40, to: 59 },
      { from: 51, to: 67 },
      { from: 63, to: 81 },
      { from: 71, to: 91 }
    ],
    snakes: [
      { from: 17, to: 7 },
      { from: 54, to: 34 },
      { from: 62, to: 19 },
      { from: 64, to: 60 },
      { from: 87, to: 24 },
      { from: 93, to: 73 },
      { from: 95, to: 75 },
      { from: 99, to: 78 }
    ]
  },
  high_snakes: {
    ladders: [
      { from: 5, to: 25 },
      { from: 18, to: 45 },
      { from: 33, to: 65 },
      { from: 50, to: 74 },
      { from: 68, to: 88 }
    ],
    snakes: [
      { from: 22, to: 6 },
      { from: 38, to: 15 },
      { from: 48, to: 26 },
      { from: 56, to: 32 },
      { from: 65, to: 42 },
      { from: 77, to: 49 },
      { from: 84, to: 58 },
      { from: 89, to: 52 },
      { from: 94, to: 66 },
      { from: 97, to: 72 },
      { from: 99, to: 40 }
    ]
  },
  high_ladders: {
    ladders: [
      { from: 3, to: 22 },
      { from: 8, to: 30 },
      { from: 15, to: 44 },
      { from: 24, to: 56 },
      { from: 36, to: 68 },
      { from: 42, to: 78 },
      { from: 55, to: 82 },
      { from: 62, to: 86 },
      { from: 73, to: 92 },
      { from: 80, to: 98 }
    ],
    snakes: [
      { from: 35, to: 12 },
      { from: 58, to: 28 },
      { from: 75, to: 46 },
      { from: 90, to: 65 },
      { from: 97, to: 79 }
    ]
  }
};

function checkSpecialTile(tile, room) {
  const presetKey = room.preset || 'classic';
  let snakes = SERVER_PRESETS[presetKey] ? SERVER_PRESETS[presetKey].snakes : [];
  let ladders = SERVER_PRESETS[presetKey] ? SERVER_PRESETS[presetKey].ladders : [];

  if (room.customBoard) {
    if (room.customBoard.snakes) snakes = room.customBoard.snakes;
    if (room.customBoard.ladders) ladders = room.customBoard.ladders;
  }

  const snake = snakes.find(s => s.from === tile);
  if (snake) return { type: 'snake', from: snake.from, to: snake.to };

  const ladder = ladders.find(l => l.from === tile);
  if (ladder) return { type: 'ladder', from: ladder.from, to: ladder.to };

  return null;
}

// Socket.IO Real-time Connection Logic
io.on('connection', (socket) => {
  let currentRoomCode = null;

  // 1. Create Room (Host)
  socket.on('create_room', (data, callback) => {
    try {
      const roomCode = generateRoomCode();
      const maxPlayers = Math.max(2, Math.min(6, parseInt(data.maxPlayers, 10) || 4));
      const preset = data.preset || 'classic';
      const customBoard = data.customBoard || null;

      const hostPlayer = {
        socketId: socket.id,
        name: (data.playerName || 'Host Player').trim().substring(0, 18),
        characterId: data.characterId || 'dragon',
        color: data.color || '#06b6d4',
        isHost: true,
        isReady: true,
        tile: 1,
        turns: 0,
        snakesHit: 0,
        laddersHit: 0
      };

      rooms[roomCode] = {
        code: roomCode,
        hostSocketId: socket.id,
        maxPlayers,
        preset,
        customBoard,
        status: 'waiting', // 'waiting' | 'playing' | 'ended'
        players: [hostPlayer],
        currentTurnIndex: 0,
        turnCount: 1,
        startTime: null,
        logs: []
      };

      socket.join(roomCode);
      currentRoomCode = roomCode;

      console.log(`[Room Created] Code: ${roomCode} by ${hostPlayer.name} (Max: ${maxPlayers})`);

      if (typeof callback === 'function') {
        callback({
          success: true,
          roomCode,
          room: getSanitizedRoom(rooms[roomCode]),
          yourPlayerIndex: 0
        });
      }
    } catch (err) {
      console.error('Error creating room:', err);
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Failed to create room. Please try again.' });
      }
    }
  });

  // 2. Join Room (Guest)
  socket.on('join_room', (data, callback) => {
    try {
      const rawCode = (data.roomCode || '').trim().toUpperCase();
      const room = rooms[rawCode];

      if (!room) {
        if (typeof callback === 'function') {
          return callback({ success: false, message: `Room "${rawCode}" not found. Check the 5-letter code!` });
        }
        return;
      }

      if (room.status !== 'waiting') {
        if (typeof callback === 'function') {
          return callback({ success: false, message: 'Game has already started in this room.' });
        }
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        if (typeof callback === 'function') {
          return callback({ success: false, message: `Room is full (max ${room.maxPlayers} players).` });
        }
        return;
      }

      const defaultColors = ['#ef4444', '#10b981', '#f59e0b', '#a855f7', '#ec4899', '#3b82f6'];
      const playerColor = data.color || defaultColors[room.players.length % defaultColors.length];

      const newPlayer = {
        socketId: socket.id,
        name: (data.playerName || `Player ${room.players.length + 1}`).trim().substring(0, 18),
        characterId: data.characterId || 'cyberbot',
        color: playerColor,
        isHost: false,
        isReady: true,
        tile: 1,
        turns: 0,
        snakesHit: 0,
        laddersHit: 0
      };

      room.players.push(newPlayer);
      socket.join(rawCode);
      currentRoomCode = rawCode;

      const playerIndex = room.players.length - 1;
      console.log(`[Player Joined] ${newPlayer.name} joined room ${rawCode} (${room.players.length}/${room.maxPlayers})`);

      // Notify caller
      if (typeof callback === 'function') {
        callback({
          success: true,
          roomCode: rawCode,
          room: getSanitizedRoom(room),
          yourPlayerIndex: playerIndex
        });
      }

      // Broadcast update to everyone in the room
      io.to(rawCode).emit('room_updated', {
        room: getSanitizedRoom(room),
        announcement: `${newPlayer.name} joined the room!`
      });
    } catch (err) {
      console.error('Error joining room:', err);
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Error joining room.' });
      }
    }
  });

  // 3. Update Player Setup in Lobby
  socket.on('update_player_profile', (data) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    if (room.status !== 'waiting') return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    if (data.name) player.name = data.name.trim().substring(0, 18);
    if (data.characterId) player.characterId = data.characterId;
    if (data.color) player.color = data.color;

    io.to(currentRoomCode).emit('room_updated', {
      room: getSanitizedRoom(room)
    });
  });

  // 4. Start Game (Host only)
  socket.on('start_game', (data, callback) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];

    if (room.hostSocketId !== socket.id) {
      if (typeof callback === 'function') {
        return callback({ success: false, message: 'Only the room host can start the match.' });
      }
      return;
    }

    if (room.players.length < 2) {
      if (typeof callback === 'function') {
        return callback({ success: false, message: 'Need at least 2 players to start!' });
      }
      return;
    }

    room.status = 'playing';
    room.currentTurnIndex = 0;
    room.turnCount = 1;
    room.startTime = Date.now();
    room.logs = [];

    // Reset player tiles
    room.players.forEach(p => {
      p.tile = 1;
      p.turns = 0;
      p.snakesHit = 0;
      p.laddersHit = 0;
    });

    console.log(`[Game Started] Room ${currentRoomCode} with ${room.players.length} players!`);

    io.to(currentRoomCode).emit('game_started', {
      room: getSanitizedRoom(room),
      firstPlayer: room.players[0].name
    });

    if (typeof callback === 'function') callback({ success: true });
  });

  // 5. Roll Dice Action
  socket.on('roll_dice', (data, callback) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];

    if (room.status !== 'playing') {
      if (typeof callback === 'function') callback({ success: false, message: 'Game is not active.' });
      return;
    }

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.socketId !== socket.id) {
      if (typeof callback === 'function') callback({ success: false, message: 'It is not your turn!' });
      return;
    }

    // Roll random 1 to 6
    const rollVal = Math.floor(Math.random() * 6) + 1;
    currentPlayer.turns += 1;

    const startTile = currentPlayer.tile;
    let targetTile = startTile + rollVal;
    let bounced = false;

    // Handle exact 100 win overshoot bounce-back rule
    if (targetTile > 100) {
      const overshoot = targetTile - 100;
      targetTile = 100 - overshoot;
      bounced = true;
    }

    // Check snake or ladder on target tile
    const specialTrigger = checkSpecialTile(targetTile, room);
    const finalTile = specialTrigger ? specialTrigger.to : targetTile;

    if (specialTrigger) {
      if (specialTrigger.type === 'snake') currentPlayer.snakesHit += 1;
      if (specialTrigger.type === 'ladder') currentPlayer.laddersHit += 1;
    }

    currentPlayer.tile = finalTile;

    const isGameOver = finalTile === 100;
    let winner = null;

    if (isGameOver) {
      room.status = 'ended';
      winner = { ...currentPlayer };
    }

    // Extra turn if rolled 6 and not won
    const gotExtraTurn = rollVal === 6 && !isGameOver;
    const previousPlayerIndex = room.currentTurnIndex;

    if (!gotExtraTurn && !isGameOver) {
      room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
      if (room.currentTurnIndex === 0) {
        room.turnCount += 1;
      }
    }

    console.log(`[Dice Roll] Room ${currentRoomCode} - ${currentPlayer.name} rolled ${rollVal} (${startTile} -> ${finalTile})`);

    // Broadcast synchronized roll and movement event to all room members
    io.to(currentRoomCode).emit('dice_rolled', {
      playerIndex: previousPlayerIndex,
      playerName: currentPlayer.name,
      rollVal,
      startTile,
      targetTile,
      bounced,
      specialTrigger,
      finalTile,
      gotExtraTurn,
      nextTurnIndex: room.currentTurnIndex,
      turnCount: room.turnCount,
      isGameOver,
      winner,
      room: getSanitizedRoom(room)
    });

    if (typeof callback === 'function') {
      callback({ success: true, rollVal, finalTile });
    }
  });

  // 6. Floating Reaction Emojis
  socket.on('send_reaction', (data) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const allowedEmojis = ['😂', '🐍', '🪜', '🎲', '👑', '😱', '🔥', '👏', '💥', '🚀'];
    const emoji = allowedEmojis.includes(data.emoji) ? data.emoji : '🎲';

    io.to(currentRoomCode).emit('reaction_received', {
      emoji,
      senderName: player.name,
      senderColor: player.color
    });
  });

  // 7. Rematch Request (Host)
  socket.on('rematch', (data, callback) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];

    if (room.hostSocketId !== socket.id) {
      if (typeof callback === 'function') callback({ success: false, message: 'Only the host can restart.' });
      return;
    }

    room.status = 'playing';
    room.currentTurnIndex = 0;
    room.turnCount = 1;
    room.startTime = Date.now();
    room.players.forEach(p => {
      p.tile = 1;
      p.turns = 0;
      p.snakesHit = 0;
      p.laddersHit = 0;
    });

    io.to(currentRoomCode).emit('game_restarted', {
      room: getSanitizedRoom(room)
    });

    if (typeof callback === 'function') callback({ success: true });
  });

  // 8. Player Disconnect
  socket.on('disconnect', () => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1) return;

    const leavingPlayer = room.players[playerIndex];
    console.log(`[Player Left] ${leavingPlayer.name} left room ${currentRoomCode}`);

    room.players.splice(playerIndex, 1);

    // If room is empty, delete room
    if (room.players.length === 0) {
      delete rooms[currentRoomCode];
      console.log(`[Room Deleted] Room ${currentRoomCode} closed (empty).`);
      return;
    }

    // If host left, assign host to first remaining player
    if (room.hostSocketId === socket.id && room.players.length > 0) {
      room.players[0].isHost = true;
      room.hostSocketId = room.players[0].socketId;
      console.log(`[New Host] ${room.players[0].name} is now host of room ${currentRoomCode}`);
    }

    // Adjust turn index if needed
    if (room.currentTurnIndex >= room.players.length) {
      room.currentTurnIndex = 0;
    }

    io.to(currentRoomCode).emit('player_left', {
      playerName: leavingPlayer.name,
      room: getSanitizedRoom(room),
      newTurnIndex: room.currentTurnIndex
    });
  });
});

// Helper to sanitize room data for client transmission
function getSanitizedRoom(room) {
  if (!room) return null;
  return {
    code: room.code,
    hostSocketId: room.hostSocketId,
    maxPlayers: room.maxPlayers,
    preset: room.preset,
    status: room.status,
    currentTurnIndex: room.currentTurnIndex,
    turnCount: room.turnCount,
    players: room.players.map((p, idx) => ({
      index: idx,
      socketId: p.socketId,
      name: p.name,
      characterId: p.characterId,
      color: p.color,
      isHost: p.isHost,
      tile: p.tile,
      turns: p.turns,
      snakesHit: p.snakesHit,
      laddersHit: p.laddersHit
    }))
  };
}

// Start Server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║             🐍 SNAKE & LADDER DELUXE SERVER 🪜               ║
║                                                                ║
║  Local URL:        http://localhost:${PORT}                      ║
║  Online Engine:    Socket.IO 4.8 + Express 4.21                ║
║  Room Codes:       5-Alphanumeric Instant Rooms (e.g. K9X2B)   ║
║  Supported Modes:  2, 3, 4, 5, 6 Players                       ║
║  Status:           Ready for Browser & Cloud Deployment!       ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
