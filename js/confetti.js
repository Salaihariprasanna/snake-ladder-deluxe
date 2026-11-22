/**
 * Snake & Ladder Deluxe - FX & Particle System
 * Canvas particle animations for Confetti Cannons, Ladder Sparkles, and Venom Smoke.
 */

class ParticleEngine {
  constructor() {
    this.canvas = document.getElementById('fx-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animating = false;

    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Launch Victory Confetti Blast
  launchVictoryConfetti() {
    if (!this.canvas) return;
    const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#a855f7', '#06b6d4', '#ffffff', '#fbbf24'];
    const count = 160;

    // Left cannon
    for (let i = 0; i < count / 2; i++) {
      this.particles.push({
        x: 0,
        y: this.canvas.height * 0.85,
        vx: Math.random() * 12 + 6,
        vy: -(Math.random() * 18 + 8),
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: Math.random() * 10 - 5,
        shape: Math.random() > 0.4 ? 'rect' : 'star',
        alpha: 1,
        decay: Math.random() * 0.005 + 0.005,
        gravity: 0.35
      });
    }

    // Right cannon
    for (let i = 0; i < count / 2; i++) {
      this.particles.push({
        x: this.canvas.width,
        y: this.canvas.height * 0.85,
        vx: -(Math.random() * 12 + 6),
        vy: -(Math.random() * 18 + 8),
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: Math.random() * 10 - 5,
        shape: Math.random() > 0.4 ? 'rect' : 'star',
        alpha: 1,
        decay: Math.random() * 0.005 + 0.005,
        gravity: 0.35
      });
    }

    this.startLoop();
  }

  // Ladder Climbing Sparkles at board coordinates
  spawnLadderSparkles(screenX, screenY) {
    if (!this.canvas) return;
    const colors = ['#fde047', '#38bdf8', '#ffffff', '#fbbf24'];
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: screenX,
        y: screenY,
        vx: (Math.random() - 0.5) * 6,
        vy: -(Math.random() * 6 + 2),
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: Math.random() * 8 - 4,
        shape: 'star',
        alpha: 1,
        decay: Math.random() * 0.02 + 0.02,
        gravity: 0.1
      });
    }
    this.startLoop();
  }

  // Snake Bite Venom Smoke Puff
  spawnSnakeVenom(screenX, screenY) {
    if (!this.canvas) return;
    const colors = ['#ef4444', '#dc2626', '#7f1d1d', '#9333ea', '#581c87'];
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: screenX + (Math.random() - 0.5) * 20,
        y: screenY + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 16 + 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: 0,
        rotSpeed: 0,
        shape: 'circle',
        alpha: 0.8,
        decay: Math.random() * 0.025 + 0.015,
        gravity: -0.05
      });
    }
    this.startLoop();
  }

  startLoop() {
    if (!this.animating) {
      this.animating = true;
      requestAnimationFrame(() => this.update());
    }
  }

  update() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > this.canvas.height + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else if (p.shape === 'star') {
        this.drawStar(0, 0, 5, p.size, p.size / 2);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.update());
    } else {
      this.animating = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }
}

window.particleEngine = new ParticleEngine();
