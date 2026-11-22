# 🐍 Snake & Ladder Deluxe 3D - Ultimate Multiplayer Edition 🪜

A modern, animated, 3D Snake & Ladder game built with pure HTML5, CSS3, SVG Bezier physics, Web Audio procedural sound synthesis, and real-time Socket.IO multiplayer rooms.

---

## ✨ Features

- **🎨 Stunning Visual Effects & Themes**:
  - 6 Immersive Themes: *Cyberpunk Neon, Jungle Safari, Medieval Castle, Candyland Delight, Space Odyssey, Classic Vintage*.
  - 6 3D Dice Skins: *Cyber Neon, Classic Ivory, Royal Gold, Magma Flame, Emerald Jade, Cosmic Starlight*.
  - 8 Vector SVG Character Rigs with custom color palettes (*Dragon, Wizard, Byte-Bot, Ninja Cat, Astronaut, Knight, Fox, Unicorn*).
- **🐍 Realistic Snake & Ladder Animations**:
  - **Smooth Snake Curve Slide**: Pawns don't just teleport—they realistically glide and wobble along the snake's actual winding Bezier curve body from head to tail with venom droplet trails and screen-shake impact!
  - **Ladder Climb Rung Shimmer**: Golden energy beam shines as pawns climb rung-by-rung with harp arpeggios and star sparkle eruptions!
  - **Tile Ripples & Floating Tags**: Interactive popups (`-35 🐍 OUCH!`, `+28 🪜 CLIMB!`, `Double 6!`).
- **👥 Flexible Multiplayer Options**:
  - Support for **2, 3, 4, 5, or 6 players**!
  - Radial pawn offset math ensures multiple tokens never overlap or hide each other on the same tile.
- **🌐 Online Room-Based Multiplayer**:
  - **5-Character Alphanumeric Room Codes** (e.g., `K9X2B`, uppercase, unambiguous).
  - **1-Click Shareable Invite Links** (`https://your-site/?room=K9X2B`) so friends can click and immediately join.
  - **Real-Time Synchronized 3D Dice Rolls** and pawn steps across all browsers.
  - **Live Floating Reaction Emojis** (😂, 🐍, 🪜, 🎲, 👑, 😱, 🔥, 👏) floating up the screen like a live stream!
  - **Host Controls & Turn Lockout**: Clean turn indicators preventing roll conflicts.
- **🤖 Smart AI Opponents**:
  - 3 Personalities & Difficulties (*Easy Casual, Normal Balanced, Smart Strategic*).
- **🔊 100% Procedural Web Audio API**:
  - Zero external MP3 files needed! Synthesizes realistic dice clicks, ascending pawn steps, snake hisses, descending slide whistles, harp chords, and victory fanfares.

---

## 🚀 Easy Deployment Steps (Play via Browser Link)

Deploy this project for free so your friends can open a link on their phones, tablets, or computers and join your game in seconds!

### Option 1: Render.com (Recommended — 100% Free, 1-Click)

1. **Upload your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Snake & Ladder Deluxe"
   git branch -M main
   # Push to your GitHub repository
   git remote add origin https://github.com/YOUR_USERNAME/snake-ladder-deluxe.git
   git push -u origin main
   ```
2. Go to **[render.com](https://render.com/)** and sign in with GitHub.
3. Click **"New +"** → **"Web Service"**.
4. Select your `snake-ladder-deluxe` repository.
5. Fill in the simple settings:
   - **Name**: `snake-ladder-deluxe` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
6. Click **"Create Web Service"**.
7. Once deployed (1-2 minutes), Render gives you a free HTTPS link like:
   `https://snake-ladder-deluxe.onrender.com`
8. **Share the link!** Open it on your phone or PC, create a room, and send the 5-letter code or invite link to your friends!

---

### Option 2: Glitch.com (No Git Needed — 30 Seconds)

1. Go to **[glitch.com](https://glitch.com/)** and create a free account.
2. Click **"New Project"** → **"Import from GitHub"** (or upload files).
3. Glitch immediately hosts it live with a public URL like `https://my-snake-game.glitch.me`!

---

### Option 3: Railway.app

1. Go to **[railway.app](https://railway.app/)**.
2. Click **"New Project"** → **"Deploy from GitHub repo"**.
3. Railway automatically detects `package.json` and `npm start` and provisions a public domain.

---

### Option 4: Instant Play on your Local WiFi or with ngrok

#### Local WiFi (Same Home / College WiFi):
1. Run in terminal:
   ```bash
   npm start
   ```
2. Find your local IP (e.g., `ipconfig` on Windows → IPv4 Address, e.g. `192.168.1.45`).
3. Anyone connected to the same WiFi can open `http://192.168.1.45:3000` on their phone browser and join!

#### Free Instant Public Tunnel via ngrok:
1. Run in terminal:
   ```bash
   npx ngrok http 3000
   ```
2. ngrok gives you a public HTTPS URL like `https://a1b2-xyz.ngrok-free.app`.
3. Anyone in the world can open that link and play with you!

---

## 🕹️ How to Play

1. **Host**:
   - Choose **🌐 Online Rooms** → **Create Room**.
   - Select player capacity (2 to 6 players) and board preset.
   - Click **🚀 Create Private Room**.
   - Copy the 5-character room code (e.g., `K9X2B`) or click **🔗 Copy Invite Link** and send it on WhatsApp, Discord, or SMS!
2. **Guests**:
   - Open the invite link (or open the website and enter the 5-letter code).
   - Enter nickname and pick character avatar.
   - Click **🔑 Join Room Now**.
3. **Play**:
   - Host clicks **🎮 Start Match**.
   - When it's your turn, click **ROLL (Space)**.
   - Use the bottom emoji bar to react in real-time during moves!

---

## 🛠️ Project Structure

```
snake_ladder/
├── index.html          # Main application HTML5 interface & modals
├── server.js           # Node.js + Express + Socket.IO multiplayer backend
├── package.json        # Dependencies & start script
├── css/
│   ├── style.css       # Core typography, glassmorphic UI, responsive layouts
│   ├── board.css       # 10x10 board grid, SVG Bezier paths, flags, pawns
│   ├── dice.css        # 3D CSS cube, rotation keyframes, skins & pips
│   ├── animations.css  # Floating tags, particle trails, screen shake, reaction bubbles
│   └── themes.css      # 6 visual themes & color palettes
└── js/
    ├── server.js       # Backend Socket.IO server
    ├── multiplayer.js  # Real-time room manager, URL auto-fill & reaction engine
    ├── game.js         # Core game state machine, curve slide & climb animations
    ├── board.js        # Zigzag coordinates, SVG Bezier curve sampling & highlights
    ├── dice.js         # 3D dice physics, face outcomes & keyboard shortcuts
    ├── characters.js   # 8 vector SVG character rigs & palettes
    ├── themes.js       # Board atmosphere & dice material coordinator
    ├── confetti.js     # Canvas particle system for victory & effects
    ├── audio.js        # Procedural Web Audio API sound synthesizer
    ├── ai.js           # Computer bot engine with 3 difficulty personalities
    └── app.js          # App lifecycle, setup menus, modals & custom editor
```

---

## 📜 License
MIT License. Free to use, modify, and distribute for college projects, gaming nights, and personal portfolios!
