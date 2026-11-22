const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('Testing Snake & Ladder Deluxe runtime with JSDOM...');

const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const dom = new JSDOM(htmlContent, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'http://localhost:3000/'
});

const { window } = dom;
const { document } = window;

const errors = [];
window.addEventListener('error', (err) => {
  errors.push(err.message || err.error);
});

// Polyfill AudioContext
window.AudioContext = class {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 44100;
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
      start() {},
      stop() {}
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {}
    };
  }
  createBuffer() {
    return { getChannelData() { return new Float32Array(100); } };
  }
  createBufferSource() {
    return { buffer: null, connect() {}, start() {} };
  }
  createBiquadFilter() {
    return { type: '', frequency: { value: 0 }, connect() {} };
  }
};
window.webkitAudioContext = window.AudioContext;

// Polyfill SVG & Layout methods for JSDOM
window.SVGElement.prototype.getPointAtLength = function(len) {
  return { x: len, y: len };
};
window.SVGElement.prototype.getTotalLength = function() {
  return 500;
};
window.HTMLElement.prototype.getBoundingClientRect = function() {
  return { left: 0, top: 0, width: 600, height: 600, right: 600, bottom: 600 };
};
window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
window.cancelAnimationFrame = (id) => clearTimeout(id);

// Load scripts in exact order
const scriptFiles = [
  'js/audio.js',
  'js/storage.js',
  'js/characters.js',
  'js/themes.js',
  'js/confetti.js',
  'js/dice.js',
  'js/board.js',
  'js/ai.js',
  'js/multiplayer.js',
  'js/game.js',
  'js/app.js'
];

for (const sf of scriptFiles) {
  const code = fs.readFileSync(path.join(__dirname, sf), 'utf8');
  try {
    window.eval(code);
  } catch (err) {
    console.error(`Error executing ${sf}:`, err);
    errors.push(`${sf}: ${err.message}`);
  }
}

// Dispatch DOMContentLoaded
const event = new window.Event('DOMContentLoaded');
window.document.dispatchEvent(event);

console.log('Testing App initialization...');
console.log('boardRenderer initialized:', !!window.boardRenderer);
console.log('gameEngine initialized:', !!window.gameEngine);
console.log('appController initialized:', !!window.appController);
console.log('multiplayerManager initialized:', !!window.multiplayerManager);

const tiles = document.querySelectorAll('.board-tile');
console.log('Board tiles generated count:', tiles.length);

const snakes = document.querySelectorAll('.svg-snake');
const ladders = document.querySelectorAll('.svg-ladder');
console.log('Snakes rendered:', snakes.length, 'Ladders rendered:', ladders.length);

const tongues = document.querySelectorAll('.snake-tongue');
console.log('Snake tongues found:', tongues.length);

console.log('\nTesting 6-player match start...');
try {
  window.appController.playerCount = 6;
  window.appController.startMatch();
  console.log('GameEngine active players count:', window.gameEngine.players.length);
  const pawns = document.querySelectorAll('.player-pawn');
  console.log('Player pawns on board:', pawns.length);
} catch (err) {
  console.error('Error starting 6-player match:', err);
  errors.push(`6-player match: ${err.message}`);
}

console.log('\nTesting Dice Roll...');
try {
  window.diceController.roll(5);
  console.log('Dice rolled successfully!');
} catch (err) {
  console.error('Error rolling dice:', err);
  errors.push(`Dice roll: ${err.message}`);
}

console.log('\nTesting Snake Head and Tongue structure...');
try {
  const heads = document.querySelectorAll('.svg-snake-head');
  const innerHeads = document.querySelectorAll('.snake-head-inner');
  const tongueGroups = document.querySelectorAll('.snake-tongue-group');
  console.log(`Found ${heads.length} snake heads, ${innerHeads.length} inner head groups, ${tongueGroups.length} tongue groups.`);
  if (heads.length !== 8 || innerHeads.length !== 8 || tongueGroups.length !== 8) {
    throw new Error('Snake head hierarchy mismatch');
  }

  // Verify first snake tongue path
  const firstTongue = document.querySelector('.snake-tongue');
  console.log('Sample tongue path d:', firstTongue.getAttribute('d'));
  if (!firstTongue.getAttribute('d').includes('M 17 0')) {
    throw new Error('Tongue path does not match expected mouth anchoring');
  }

  // Test Snake Bite Highlight
  window.boardRenderer.highlightSnake(17, 7, true);
  const biteSnake = document.querySelector('g.svg-snake[data-from="17"]');
  console.log('Snake bite class applied:', biteSnake.classList.contains('snake-active-bite'));
  window.boardRenderer.highlightSnake(17, 7, false);
} catch (err) {
  console.error('Snake test error:', err);
  errors.push(`Snake structure: ${err.message}`);
}

console.log('\nTesting Snake Slide & Ladder Climb handlers...');
(async () => {
  try {
    const player = window.gameEngine.players[0];
    // Test ladder climb
    await window.gameEngine.handleSpecialTrigger(player, { type: 'ladder', from: 4, to: 14 });
    console.log(`Player 1 tile after ladder climb: ${player.tile} (expected 14)`);

    // Test snake bite
    await window.gameEngine.handleSpecialTrigger(player, { type: 'snake', from: 17, to: 7 });
    console.log(`Player 1 tile after snake bite: ${player.tile} (expected 7)`);

    const pawnEl = document.getElementById('pawn-player-0');
    console.log('Pawn transform after slide/climb is reset clean:', pawnEl.style.transform === '');
  } catch (err) {
    console.error('Trigger handling error:', err);
    errors.push(`Special triggers: ${err.message}`);
  }

  if (errors.length > 0) {
    console.error('\nERRORS FOUND:', errors);
    process.exit(1);
  } else {
    console.log('\nALL RUNTIME CHECKS PASSED WITH 0 ERRORS!');
    process.exit(0);
  }
})();
