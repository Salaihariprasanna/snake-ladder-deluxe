/**
 * Snake & Ladder Deluxe - Board Mathematics & SVG/Canvas Rendering Engine
 * Calculates exact zigzag tile geometry and renders smooth Bezier snakes and 3D ladders.
 */

const BOARD_PRESETS = {
  classic: {
    name: 'Classic (Standard)',
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
    name: 'Venom Hazard (More Snakes)',
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
    name: 'Rapid Climb (More Ladders)',
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

class BoardRenderer {
  constructor() {
    this.gridContainer = document.getElementById('board-grid');
    this.svgLayer = document.getElementById('board-svg-layer');
    this.snakesGroup = document.getElementById('svg-snakes-group');
    this.laddersGroup = document.getElementById('svg-ladders-group');
    this.defsLayer = document.getElementById('board-svg-defs');
    
    this.activePresetKey = 'classic';
    this.snakes = [...BOARD_PRESETS.classic.snakes];
    this.ladders = [...BOARD_PRESETS.classic.ladders];

    this.init();
  }

  init() {
    this.generateGridTiles();
    this.renderBoardElements();
  }

  // Calculate 10x10 Zigzag coordinates for Tile 1 to 100
  // Returns { col: 0..9, rowFromBottom: 0..9, pctX: 0..100, pctY: 0..100, svgX: 0..1000, svgY: 0..1000 }
  getTileCoords(tileNumber) {
    const tile = Math.max(1, Math.min(100, tileNumber));
    const index = tile - 1;
    const rowFromBottom = Math.floor(index / 10);
    const isEvenRow = rowFromBottom % 2 === 0;
    
    let col;
    if (isEvenRow) {
      // Left to Right (1..10, 21..30, etc.)
      col = index % 10;
    } else {
      // Right to Left (20..11, 40..31, etc.)
      col = 9 - (index % 10);
    }

    const rowFromTop = 9 - rowFromBottom;

    // Center coordinates in percentage (0% to 100%)
    const pctX = (col * 10) + 5;
    const pctY = (rowFromTop * 10) + 5;

    // Coordinates for SVG viewBox 0 0 1000 1000
    const svgX = (col * 100) + 50;
    const svgY = (rowFromTop * 100) + 50;

    return {
      col,
      rowFromBottom,
      rowFromTop,
      pctX,
      pctY,
      svgX,
      svgY
    };
  }

  // Populate 100 DOM tiles in the CSS grid (numbered 100 down to 1)
  generateGridTiles() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';

    // CSS Grid renders row by row from top to bottom (row 9 down to 0)
    for (let rowFromTop = 0; rowFromTop < 10; rowFromTop++) {
      const rowFromBottom = 9 - rowFromTop;
      const isEvenRow = rowFromBottom % 2 === 0;

      for (let col = 0; col < 10; col++) {
        let tileNum;
        if (isEvenRow) {
          tileNum = (rowFromBottom * 10) + col + 1;
        } else {
          tileNum = (rowFromBottom * 10) + (9 - col) + 1;
        }

        const tileEl = document.createElement('div');
        tileEl.className = `board-tile tile-${tileNum % 2 === 0 ? 'even' : 'odd'} tile-${tileNum}`;
        tileEl.id = `tile-${tileNum}`;
        tileEl.dataset.tile = tileNum;

        // Tile Number Label
        const numLabel = document.createElement('span');
        numLabel.className = 'tile-number';
        numLabel.textContent = tileNum;
        tileEl.appendChild(numLabel);

        // Special End/Start Badges
        if (tileNum === 100) {
          const crown = document.createElement('span');
          crown.className = 'tile-special-icon';
          crown.textContent = '👑';
          tileEl.appendChild(crown);
        } else if (tileNum === 1) {
          const flag = document.createElement('span');
          flag.className = 'tile-special-icon';
          flag.textContent = '🏁';
          tileEl.appendChild(flag);
        }

        this.gridContainer.appendChild(tileEl);
      }
    }
  }

  // Set active board preset or custom board
  setPreset(presetKey, customData = null) {
    this.activePresetKey = presetKey;
    if (presetKey === 'custom' && customData) {
      this.snakes = [...customData.snakes];
      this.ladders = [...customData.ladders];
    } else if (BOARD_PRESETS[presetKey]) {
      this.snakes = [...BOARD_PRESETS[presetKey].snakes];
      this.ladders = [...BOARD_PRESETS[presetKey].ladders];
    }
    this.renderBoardElements();
  }

  // Render SVG Snakes and Ladders with smooth Bezier curves
  renderBoardElements() {
    if (!this.snakesGroup || !this.laddersGroup) return;

    this.snakesGroup.innerHTML = '';
    this.laddersGroup.innerHTML = '';

    // 1. Render Ladders
    this.ladders.forEach((ladder, idx) => {
      this.drawLadder(ladder.from, ladder.to, idx);
    });

    // 2. Render Snakes
    this.snakes.forEach((snake, idx) => {
      this.drawSnake(snake.from, snake.to, idx);
    });
  }

  // Draw 3D-styled ladder with rails and rungs
  drawLadder(fromTile, toTile, index) {
    const start = this.getTileCoords(fromTile);
    const end = this.getTileCoords(toTile);

    const dx = end.svgX - start.svgX;
    const dy = end.svgY - start.svgY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    // Normal vector perpendicular to ladder length
    const nx = (-dy / dist) * 16;
    const ny = (dx / dist) * 16;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'svg-ladder');
    g.setAttribute('data-from', fromTile);
    g.setAttribute('data-to', toTile);

    // Left Rail
    const leftRail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    leftRail.setAttribute('x1', start.svgX - nx);
    leftRail.setAttribute('y1', start.svgY - ny);
    leftRail.setAttribute('x2', end.svgX - nx);
    leftRail.setAttribute('y2', end.svgY - ny);
    leftRail.setAttribute('stroke', 'var(--ladder-rail-color)');
    leftRail.setAttribute('stroke-width', '7');
    leftRail.setAttribute('class', 'svg-ladder-rail');
    g.appendChild(leftRail);

    // Right Rail
    const rightRail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rightRail.setAttribute('x1', start.svgX + nx);
    rightRail.setAttribute('y1', start.svgY + ny);
    rightRail.setAttribute('x2', end.svgX + nx);
    rightRail.setAttribute('y2', end.svgY + ny);
    rightRail.setAttribute('stroke', 'var(--ladder-rail-color)');
    rightRail.setAttribute('stroke-width', '7');
    rightRail.setAttribute('class', 'svg-ladder-rail');
    g.appendChild(rightRail);

    // Step Rungs (spaced every ~35px)
    const numRungs = Math.max(3, Math.floor(dist / 32));
    for (let i = 1; i <= numRungs; i++) {
      const t = i / (numRungs + 1);
      const rx = start.svgX + dx * t;
      const ry = start.svgY + dy * t;

      const rung = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      rung.setAttribute('x1', rx - nx * 1.1);
      rung.setAttribute('y1', ry - ny * 1.1);
      rung.setAttribute('x2', rx + nx * 1.1);
      rung.setAttribute('y2', ry + ny * 1.1);
      rung.setAttribute('stroke', 'var(--ladder-rung-color)');
      rung.setAttribute('stroke-width', '5');
      rung.setAttribute('class', 'svg-ladder-rung');
      g.appendChild(rung);
    }

    this.laddersGroup.appendChild(g);
  }

  // Draw organic wavy snake with head, eyes, flicking tongue, and tapered tail
  drawSnake(headTile, tailTile, index) {
    const head = this.getTileCoords(headTile);
    const tail = this.getTileCoords(tailTile);

    const dx = tail.svgX - head.svgX;
    const dy = tail.svgY - head.svgY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    // S-curve control points perpendicular wave offset
    const wave = (index % 2 === 0 ? 1 : -1) * Math.min(80, dist * 0.35);
    const nx = (-dy / dist) * wave;
    const ny = (dx / dist) * wave;

    const cp1x = head.svgX + dx * 0.33 + nx;
    const cp1y = head.svgY + dy * 0.33 + ny;
    const cp2x = head.svgX + dx * 0.66 - nx;
    const cp2y = head.svgY + dy * 0.66 - ny;

    const pathD = `M ${head.svgX} ${head.svgY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tail.svgX} ${tail.svgY}`;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'svg-snake');
    g.setAttribute('data-from', headTile);
    g.setAttribute('data-to', tailTile);

    // 1. Thick Body Shadow / Base
    const snakeBody = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    snakeBody.setAttribute('d', pathD);
    snakeBody.setAttribute('stroke', 'var(--snake-body-color)');
    snakeBody.setAttribute('stroke-width', '18');
    snakeBody.setAttribute('class', 'svg-snake-body');
    g.appendChild(snakeBody);

    // 2. Belly Scales / Stripe Pattern
    const snakeBelly = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    snakeBelly.setAttribute('d', pathD);
    snakeBelly.setAttribute('stroke', '#ffffff');
    snakeBelly.setAttribute('stroke-width', '6');
    snakeBelly.setAttribute('class', 'svg-snake-belly');
    g.appendChild(snakeBelly);

    // 3. Snake Head & Animated Tongue
    const headAngle = Math.atan2(cp1y - head.svgY, cp1x - head.svgX) * (180 / Math.PI);

    const headGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    headGroup.setAttribute('transform', `translate(${head.svgX}, ${head.svgY}) rotate(${headAngle + 180})`);
    headGroup.setAttribute('class', 'svg-snake-head');

    // Inner group so CSS scaling transforms around (0, 0) without breaking parent's SVG translate/rotate
    const innerHeadGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerHeadGroup.setAttribute('class', 'snake-head-inner');

    // Head Oval
    const headOval = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    headOval.setAttribute('cx', '0');
    headOval.setAttribute('cy', '0');
    headOval.setAttribute('rx', '20');
    headOval.setAttribute('ry', '15');
    headOval.setAttribute('fill', 'var(--snake-head-color)');
    headOval.setAttribute('stroke', '#ffffff');
    headOval.setAttribute('stroke-width', '1.8');
    headOval.setAttribute('class', 'svg-snake-skull');
    innerHeadGroup.appendChild(headOval);

    // Nostrils / Snout details
    const nostrilL = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    nostrilL.setAttribute('cx', '14');
    nostrilL.setAttribute('cy', '-3');
    nostrilL.setAttribute('r', '1.2');
    nostrilL.setAttribute('fill', 'rgba(0, 0, 0, 0.6)');
    innerHeadGroup.appendChild(nostrilL);

    const nostrilR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    nostrilR.setAttribute('cx', '14');
    nostrilR.setAttribute('cy', '3');
    nostrilR.setAttribute('r', '1.2');
    nostrilR.setAttribute('fill', 'rgba(0, 0, 0, 0.6)');
    innerHeadGroup.appendChild(nostrilR);

    // Eyes
    const leftEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    leftEye.setAttribute('cx', '2');
    leftEye.setAttribute('cy', '-7');
    leftEye.setAttribute('r', '4.5');
    leftEye.setAttribute('fill', '#ffffff');
    leftEye.setAttribute('stroke', 'rgba(0, 0, 0, 0.25)');
    leftEye.setAttribute('stroke-width', '0.8');
    innerHeadGroup.appendChild(leftEye);

    const leftPupil = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    leftPupil.setAttribute('cx', '3');
    leftPupil.setAttribute('cy', '-7');
    leftPupil.setAttribute('rx', '1.8');
    leftPupil.setAttribute('ry', '3.5');
    leftPupil.setAttribute('fill', '#000000');
    innerHeadGroup.appendChild(leftPupil);

    const eyeHighlightL = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eyeHighlightL.setAttribute('cx', '4');
    eyeHighlightL.setAttribute('cy', '-8');
    eyeHighlightL.setAttribute('r', '1.2');
    eyeHighlightL.setAttribute('fill', '#ffffff');
    innerHeadGroup.appendChild(eyeHighlightL);

    const rightEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rightEye.setAttribute('cx', '2');
    rightEye.setAttribute('cy', '7');
    rightEye.setAttribute('r', '4.5');
    rightEye.setAttribute('fill', '#ffffff');
    rightEye.setAttribute('stroke', 'rgba(0, 0, 0, 0.25)');
    rightEye.setAttribute('stroke-width', '0.8');
    innerHeadGroup.appendChild(rightEye);

    const rightPupil = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    rightPupil.setAttribute('cx', '3');
    rightPupil.setAttribute('cy', '7');
    rightPupil.setAttribute('rx', '1.8');
    rightPupil.setAttribute('ry', '3.5');
    rightPupil.setAttribute('fill', '#000000');
    innerHeadGroup.appendChild(rightPupil);

    const eyeHighlightR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eyeHighlightR.setAttribute('cx', '4');
    eyeHighlightR.setAttribute('cy', '6');
    eyeHighlightR.setAttribute('r', '1.2');
    eyeHighlightR.setAttribute('fill', '#ffffff');
    innerHeadGroup.appendChild(eyeHighlightR);

    // Flicking Forked Tongue Group (anchored at mouth tip x=17, forks outside at x=29..37)
    const tongueGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tongueGroup.setAttribute('class', 'snake-tongue-group');

    const tongue = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tongue.setAttribute('d', 'M 17 0 L 29 0 M 29 0 L 37 -5 M 29 0 L 37 5');
    tongue.setAttribute('stroke', '#ef4444');
    tongue.setAttribute('stroke-width', '2.6');
    tongue.setAttribute('stroke-linecap', 'round');
    tongue.setAttribute('stroke-linejoin', 'round');
    tongue.setAttribute('fill', 'none');
    tongue.setAttribute('class', 'snake-tongue');
    tongueGroup.appendChild(tongue);

    innerHeadGroup.appendChild(tongueGroup);
    headGroup.appendChild(innerHeadGroup);
    g.appendChild(headGroup);
    this.snakesGroup.appendChild(g);
  }

  // Get SVG Path element for a snake
  getSnakePath(fromTile, toTile) {
    if (!this.snakesGroup) return null;
    const g = this.snakesGroup.querySelector(`g.svg-snake[data-from="${fromTile}"][data-to="${toTile}"]`);
    return g ? g.querySelector('.svg-snake-body') : null;
  }

  // Get points along the snake's actual curved path for smooth realistic sliding
  getSnakeCurvePoints(fromTile, toTile, numPoints = 28) {
    const path = this.getSnakePath(fromTile, toTile);
    const points = [];

    if (path && typeof path.getTotalLength === 'function') {
      try {
        const totalLen = path.getTotalLength();
        for (let i = 0; i <= numPoints; i++) {
          const pt = path.getPointAtLength((i / numPoints) * totalLen);
          points.push({
            pctX: pt.x / 10,
            pctY: pt.y / 10
          });
        }
        return points;
      } catch (e) {
        // Fall through to calculation if SVG geometry is not yet measured
      }
    }

    // Bezier mathematical curve interpolation fallback
    const head = this.getTileCoords(fromTile);
    const tail = this.getTileCoords(toTile);
    const dx = tail.svgX - head.svgX;
    const dy = tail.svgY - head.svgY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const wave = Math.min(80, dist * 0.35);
    const nx = (-dy / dist) * wave;
    const ny = (dx / dist) * wave;

    const p0 = { x: head.pctX, y: head.pctY };
    const p1 = { x: (head.svgX + dx * 0.33 + nx) / 10, y: (head.svgY + dy * 0.33 + ny) / 10 };
    const p2 = { x: (head.svgX + dx * 0.66 - nx) / 10, y: (head.svgY + dy * 0.66 - ny) / 10 };
    const p3 = { x: tail.pctX, y: tail.pctY };

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const u = 1 - t;
      const x = u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x;
      const y = u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y;
      points.push({ pctX: x, pctY: y });
    }
    return points;
  }

  // Get ladder rungs and climb points
  getLadderPoints(fromTile, toTile, numPoints = 16) {
    const start = this.getTileCoords(fromTile);
    const end = this.getTileCoords(toTile);
    const points = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const rungHop = Math.sin(t * Math.PI * 5) * 0.5;
      points.push({
        pctX: start.pctX + (end.pctX - start.pctX) * t,
        pctY: (start.pctY + (end.pctY - start.pctY) * t) - Math.abs(rungHop)
      });
    }
    return points;
  }

  // Visual highlight for active snake (bite animation & venom glow)
  highlightSnake(fromTile, toTile, active = true) {
    if (!this.snakesGroup) return;
    const g = this.snakesGroup.querySelector(`g.svg-snake[data-from="${fromTile}"][data-to="${toTile}"]`);
    if (g) {
      if (active) {
        g.classList.add('snake-active-bite');
      } else {
        g.classList.remove('snake-active-bite');
      }
    }
  }

  // Visual highlight for active ladder (climb shimmer & beam glow)
  highlightLadder(fromTile, toTile, active = true) {
    if (!this.laddersGroup) return;
    const g = this.laddersGroup.querySelector(`g.svg-ladder[data-from="${fromTile}"][data-to="${toTile}"]`);
    if (g) {
      if (active) {
        g.classList.add('ladder-active-climb');
      } else {
        g.classList.remove('ladder-active-climb');
      }
    }
  }

  // Check if tile has a snake head or ladder base
  checkTileTrigger(tileNum) {
    const snake = this.snakes.find(s => s.from === tileNum);
    if (snake) {
      return { type: 'snake', from: snake.from, to: snake.to };
    }

    const ladder = this.ladders.find(l => l.from === tileNum);
    if (ladder) {
      return { type: 'ladder', from: ladder.from, to: ladder.to };
    }

    return null;
  }

  // Render mini preview in Customizer modal
  renderCustomPreview(containerEl, customSnakes, customLadders) {
    if (!containerEl) return;
    containerEl.innerHTML = `
      <div style="position:relative; width:100%; height:100%;">
        <svg viewBox="0 0 1000 1000" style="position:absolute; width:100%; height:100%; top:0; left:0;">
          <g id="mini-ladders"></g>
          <g id="mini-snakes"></g>
        </svg>
        <div id="mini-grid" style="display:grid; grid-template-columns:repeat(10,1fr); grid-template-rows:repeat(10,1fr); width:100%; height:100%;">
        </div>
      </div>
    `;

    const miniGrid = containerEl.querySelector('#mini-grid');
    const miniLadders = containerEl.querySelector('#mini-ladders');
    const miniSnakes = containerEl.querySelector('#mini-snakes');

    for (let r = 0; r < 10; r++) {
      const rowFromBottom = 9 - r;
      const isEven = rowFromBottom % 2 === 0;
      for (let c = 0; c < 10; c++) {
        const num = isEven ? (rowFromBottom * 10 + c + 1) : (rowFromBottom * 10 + (9 - c) + 1);
        const d = document.createElement('div');
        d.style.border = '1px solid rgba(255,255,255,0.05)';
        d.style.fontSize = '8px';
        d.style.padding = '1px';
        d.style.color = 'rgba(255,255,255,0.4)';
        d.textContent = num;
        miniGrid.appendChild(d);
      }
    }

    // Ladders
    customLadders.forEach(l => {
      const s = this.getTileCoords(l.from);
      const e = this.getTileCoords(l.to);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', s.svgX);
      line.setAttribute('y1', s.svgY);
      line.setAttribute('x2', e.svgX);
      line.setAttribute('y2', e.svgY);
      line.setAttribute('stroke', '#10b981');
      line.setAttribute('stroke-width', '8');
      line.setAttribute('stroke-linecap', 'round');
      miniLadders.appendChild(line);
    });

    // Snakes
    customSnakes.forEach(s => {
      const head = this.getTileCoords(s.from);
      const tail = this.getTileCoords(s.to);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', head.svgX);
      line.setAttribute('y1', head.svgY);
      line.setAttribute('x2', tail.svgX);
      line.setAttribute('y2', tail.svgY);
      line.setAttribute('stroke', '#ef4444');
      line.setAttribute('stroke-width', '10');
      line.setAttribute('stroke-linecap', 'round');
      miniSnakes.appendChild(line);
    });
  }
}

window.BOARD_PRESETS = BOARD_PRESETS;
window.boardRenderer = new BoardRenderer();
