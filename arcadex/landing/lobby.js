// ═══════════════════════════════════════════════════════════════════
// ARCADE LOBBY SYSTEM - PHYSICAL ARCADE ROOM SIMULATION
// "A row of physical arcade machines inside a 1990s arcade room"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

// ── CENTRALIZED GAME DATA ──
// Scalable to 25+ games. Each entry defines a cabinet.
const ARCADE_GAMES = [
    {
        id: 'tic',
        name: 'TIC TAC TOE',
        genre: 'LOGIC // STRATEGY',
        modes: ['SINGLE', 'AI', 'MULTI'],
        glowColor: 'rgba(0, 255, 0, 0.4)',
        previewColor: '#00ff00',
        previewType: 'grid'
    },
    {
        id: 'snake',
        name: 'SNAKE',
        genre: 'REFLEX // ACTION',
        modes: ['SINGLE', 'AI', 'MULTI'],
        glowColor: 'rgba(0, 200, 255, 0.4)',
        previewColor: '#00ccff',
        previewType: 'snake'
    },
    {
        id: 'pong',
        name: 'PONG',
        genre: 'ARCADE // CLASSIC',
        modes: ['SINGLE', 'AI', 'MULTI'],
        glowColor: 'rgba(255, 255, 0, 0.4)',
        previewColor: '#ffff00',
        previewType: 'pong'
    },
    {
        id: 'breakout',
        name: 'BREAKOUT',
        genre: 'PHYSICS // RETRO',
        modes: ['SINGLE'],
        glowColor: 'rgba(255, 100, 0, 0.4)',
        previewColor: '#ff6400',
        previewType: 'breakout'
    },
    {
        id: 'memory',
        name: 'MEMORY MATCH',
        genre: 'MEMORY // PUZZLE',
        modes: ['SINGLE', 'MULTI'],
        glowColor: 'rgba(200, 0, 255, 0.4)',
        previewColor: '#cc00ff',
        previewType: 'memory'
    },
    {
        id: 'tetris',
        name: 'BLOCK FALL',
        genre: 'PUZZLE // ARCADE',
        modes: ['SINGLE', 'AI'],
        glowColor: 'rgba(255, 0, 100, 0.4)',
        previewColor: '#ff0064',
        previewType: 'tetris'
    }
];

// ── LOBBY SYSTEM CLASS ──
class ArcadeLobby {
    constructor(audio) {
        this.audio = audio;
        this.selectedIndex = 0;
        this.isActive = false;
        this.machines = [];
        this.canvases = [];
        this.animationFrameId = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.swipeThreshold = 50;

        // Bind methods
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);
    }

    // ── BUILD LOBBY DOM ──
    buildLobby() {
        const lobbyScene = document.getElementById('lobby-scene');
        if (!lobbyScene) return;

        lobbyScene.innerHTML = `
            <div id="arcade-room">
                <!-- Header -->
                <div id="lobby-header">
                    <div id="lobby-title">ARCADE<span>_</span>X // <span>SELECT MACHINE</span></div>
                    <div id="lobby-credits">CREDITS: <span id="lobby-credit-count">00</span></div>
                    <div id="lobby-nav-hint">◄ ► NAVIGATE  //  ENTER SELECT  //  ESC BACK</div>
                </div>

                <!-- Back Button -->
                <button id="lobby-back">◄ BACK</button>

                <!-- Machines Viewport -->
                <div id="machines-viewport">
                    <div id="machines-track">
                        ${this._buildMachines()}
                    </div>
                </div>

                <!-- Footer Info -->
                <div id="lobby-footer">
                    <div id="lobby-game-info">SELECT A MACHINE TO PLAY</div>
                    <div id="lobby-counter">${this.selectedIndex + 1} / ${ARCADE_GAMES.length}</div>
                    <div id="lobby-status">
                        <div id="lobby-status-led"></div>
                        <div id="lobby-status-text">SYSTEM ACTIVE</div>
                    </div>
                </div>
            </div>
        `;

        // Cache machine elements
        this.machines = Array.from(lobbyScene.querySelectorAll('.arcade-machine'));

        // Initialize canvas previews
        this._initCanvases();

        // Bind lobby-specific events
        this._bindLobbyEvents();
    }

    _buildMachines() {
        return ARCADE_GAMES.map((game, index) => {
            const modeBadges = game.modes.map(mode => {
                const cls = mode.toLowerCase();
                return `<span class="mode-badge ${cls}">${mode}</span>`;
            }).join('');

            return `
                <div class="arcade-machine" data-index="${index}" data-game-id="${game.id}" style="--glow-color: ${game.glowColor};">
                    <div class="cabinet-body">
                        <div class="cabinet-marquee">
                            <div class="marquee-title">${game.name}</div>
                        </div>
                        <div class="cabinet-screen">
                            <canvas class="screen-canvas" id="canvas-${game.id}" width="176" height="126"></canvas>
                            <div class="screen-glow"></div>
                        </div>
                        <div class="cabinet-controls">
                            <div class="mode-badges">${modeBadges}</div>
                            <div class="cabinet-genre">${game.genre}</div>
                        </div>
                        <div class="cabinet-base"></div>
                    </div>
                    <div class="select-indicator">► PRESS START ◄</div>
                </div>
            `;
        }).join('');
    }

    // ── CANVAS PREVIEW SYSTEM ──
    _initCanvases() {
        this.canvases = [];
        ARCADE_GAMES.forEach(game => {
            const canvas = document.getElementById(`canvas-${game.id}`);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                this.canvases.push({
                    canvas,
                    ctx,
                    game,
                    frame: 0,
                    speed: 1 + Math.random() * 0.5
                });
            }
        });
    }

    _startCanvasAnimations() {
        const animate = () => {
            if (!this.isActive) return;

            this.canvases.forEach(item => {
                item.frame += item.speed;
                this._drawPreview(item);
            });

            this.animationFrameId = requestAnimationFrame(animate);
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    _stopCanvasAnimations() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    _drawPreview(item) {
        const { ctx, game, frame } = item;
        const w = 176;
        const h = 126;

        // Clear with slight trail for CRT feel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, w, h);

        switch(game.previewType) {
            case 'grid':    this._drawTicTacToe(ctx, w, h, frame, game.previewColor); break;
            case 'snake':   this._drawSnake(ctx, w, h, frame, game.previewColor); break;
            case 'pong':    this._drawPong(ctx, w, h, frame, game.previewColor); break;
            case 'breakout': this._drawBreakout(ctx, w, h, frame, game.previewColor); break;
            case 'memory':  this._drawMemory(ctx, w, h, frame, game.previewColor); break;
            case 'tetris':  this._drawTetris(ctx, w, h, frame, game.previewColor); break;
            default:        this._drawDefault(ctx, w, h, frame, game.previewColor); break;
        }
    }

    // ── PREVIEW RENDERERS ──
    _drawTicTacToe(ctx, w, h, frame, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;

        // Draw grid
        const cx = w / 2, cy = h / 2;
        const size = 50;
        ctx.beginPath();
        ctx.moveTo(cx - size/6, cy - size/2); ctx.lineTo(cx - size/6, cy + size/2);
        ctx.moveTo(cx + size/6, cy - size/2); ctx.lineTo(cx + size/6, cy + size/2);
        ctx.moveTo(cx - size/2, cy - size/6); ctx.lineTo(cx + size/2, cy - size/6);
        ctx.moveTo(cx - size/2, cy + size/6); ctx.lineTo(cx + size/2, cy + size/6);
        ctx.stroke();

        // Animated X and O placement
        const cell = Math.floor(frame / 40) % 9;
        const positions = [
            [-1,-1],[0,-1],[1,-1],
            [-1,0],[0,0],[1,0],
            [-1,1],[0,1],[1,1]
        ];

        for (let i = 0; i <= cell; i++) {
            const p = positions[i];
            const px = cx + p[0] * (size/3);
            const py = cy + p[1] * (size/3);

            if (i % 2 === 0) {
                // X
                ctx.beginPath();
                ctx.moveTo(px - 5, py - 5); ctx.lineTo(px + 5, py + 5);
                ctx.moveTo(px + 5, py - 5); ctx.lineTo(px - 5, py + 5);
                ctx.stroke();
            } else {
                // O
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    }

    _drawSnake(ctx, w, h, frame, color) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;

        const segLen = 8;
        const segments = 12;
        const headX = w/2 + Math.cos(frame * 0.03) * 40;
        const headY = h/2 + Math.sin(frame * 0.05) * 25;

        for (let i = 0; i < segments; i++) {
            const t = frame * 0.03 - i * 0.3;
            const x = w/2 + Math.cos(t) * 40;
            const y = h/2 + Math.sin(t * 1.7) * 25;
            const alpha = 1 - (i / segments) * 0.6;
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillRect(Math.floor(x/segLen)*segLen, Math.floor(y/segLen)*segLen, segLen - 1, segLen - 1);
        }

        // Food
        ctx.globalAlpha = 0.6 + Math.sin(frame * 0.1) * 0.3;
        ctx.fillStyle = '#ff0000';
        const fx = (Math.floor(Math.sin(frame * 0.005) * 5 + 10)) * segLen;
        const fy = (Math.floor(Math.cos(frame * 0.007) * 4 + 7)) * segLen;
        ctx.fillRect(fx, fy, segLen - 1, segLen - 1);

        ctx.globalAlpha = 1;
    }

    _drawPong(ctx, w, h, frame, color) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;

        // Paddles
        const paddleH = 24;
        const leftY = h/2 + Math.sin(frame * 0.04) * 30 - paddleH/2;
        const rightY = h/2 + Math.sin(frame * 0.04 + 1) * 30 - paddleH/2;
        ctx.fillRect(8, leftY, 4, paddleH);
        ctx.fillRect(w - 12, rightY, 4, paddleH);

        // Ball
        const ballX = w/2 + Math.cos(frame * 0.06) * 60;
        const ballY = h/2 + Math.sin(frame * 0.08) * 35;
        ctx.fillRect(ballX - 2, ballY - 2, 4, 4);

        // Center line
        ctx.globalAlpha = 0.2;
        for (let y = 0; y < h; y += 8) {
            ctx.fillRect(w/2 - 1, y, 2, 4);
        }

        // Score
        ctx.globalAlpha = 0.4;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('03', w/2 - 25, 15);
        ctx.fillText('02', w/2 + 25, 15);

        ctx.globalAlpha = 1;
    }

    _drawBreakout(ctx, w, h, frame, color) {
        ctx.globalAlpha = 0.7;

        // Bricks
        const cols = 8;
        const rows = 4;
        const brickW = (w - 20) / cols;
        const brickH = 8;
        const colors = ['#ff0000', '#ff6400', '#ffff00', '#00ff00'];

        const destroyed = Math.floor(frame / 20) % (cols * rows);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                if (idx < destroyed) continue;
                ctx.fillStyle = colors[r];
                ctx.globalAlpha = 0.6;
                ctx.fillRect(10 + c * brickW + 1, 10 + r * (brickH + 2) + 1, brickW - 2, brickH);
            }
        }

        // Paddle
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        const paddleX = w/2 + Math.sin(frame * 0.05) * 50;
        ctx.fillRect(paddleX - 15, h - 15, 30, 4);

        // Ball
        const bx = w/2 + Math.cos(frame * 0.07) * 50;
        const by = h/2 + Math.sin(frame * 0.09) * 30;
        ctx.fillRect(bx - 2, by - 2, 4, 4);

        ctx.globalAlpha = 1;
    }

    _drawMemory(ctx, w, h, frame, color) {
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        const gridCols = 4;
        const gridRows = 3;
        const cardW = 28;
        const cardH = 28;
        const startX = (w - gridCols * (cardW + 4)) / 2;
        const startY = (h - gridRows * (cardH + 4)) / 2;

        const revealedCard = Math.floor(frame / 30) % (gridCols * gridRows);

        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                const idx = r * gridCols + c;
                const x = startX + c * (cardW + 4);
                const y = startY + r * (cardH + 4);

                ctx.strokeRect(x, y, cardW, cardH);

                if (idx === revealedCard || idx === (revealedCard + 1) % (gridCols * gridRows)) {
                    // Show symbol
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.5;
                    ctx.font = '12px monospace';
                    ctx.textAlign = 'center';
                    const symbols = ['★', '♦', '●', '▲', '■', '♥', '★', '♦', '●', '▲', '■', '♥'];
                    ctx.fillText(symbols[idx % symbols.length], x + cardW/2, y + cardH/2 + 4);
                } else {
                    // Show back
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.1;
                    ctx.fillRect(x + 2, y + 2, cardW - 4, cardH - 4);
                }
                ctx.globalAlpha = 0.6;
            }
        }
        ctx.globalAlpha = 1;
    }

    _drawTetris(ctx, w, h, frame, color) {
        ctx.globalAlpha = 0.6;

        const blockSize = 8;
        const cols = 10;
        const startX = (w - cols * blockSize) / 2;

        // Draw borders
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(startX - 1, 5, cols * blockSize + 2, h - 15);

        // Static blocks at bottom
        const staticRows = [
            [1, 1, 0, 0, 1, 1, 1, 0, 0, 1],
            [1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];

        const blockColors = ['#ff0000', '#00ff00', '#00ccff', '#ffff00', '#ff6400', '#cc00ff'];

        ctx.globalAlpha = 0.5;
        staticRows.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell) {
                    ctx.fillStyle = blockColors[(r + c) % blockColors.length];
                    ctx.fillRect(startX + c * blockSize, h - 15 - (staticRows.length - r) * blockSize, blockSize - 1, blockSize - 1);
                }
            });
        });

        // Falling piece
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        const pieceCol = Math.floor(Math.sin(frame * 0.02) * 3 + 4);
        const pieceRow = (frame % 80) / 80 * (h - 50);

        // T-piece
        ctx.fillRect(startX + pieceCol * blockSize, pieceRow, blockSize - 1, blockSize - 1);
        ctx.fillRect(startX + (pieceCol - 1) * blockSize, pieceRow, blockSize - 1, blockSize - 1);
        ctx.fillRect(startX + (pieceCol + 1) * blockSize, pieceRow, blockSize - 1, blockSize - 1);
        ctx.fillRect(startX + pieceCol * blockSize, pieceRow - blockSize, blockSize - 1, blockSize - 1);

        ctx.globalAlpha = 1;
    }

    _drawDefault(ctx, w, h, frame, color) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LOADING...', w/2, h/2);
        ctx.globalAlpha = 1;
    }

    // ── SELECTION SYSTEM ──
    select(index) {
        if (index < 0 || index >= ARCADE_GAMES.length) return;

        const prevIndex = this.selectedIndex;
        this.selectedIndex = index;

        // Update machine classes
        this.machines.forEach((machine, i) => {
            machine.classList.remove('selected', 'dimmed');
            if (i === index) {
                machine.classList.add('selected');
            } else {
                machine.classList.add('dimmed');
            }
        });

        // Center the selected machine
        this._centerMachine(index);

        // Update info bar
        const game = ARCADE_GAMES[index];
        const infoEl = document.getElementById('lobby-game-info');
        const counterEl = document.getElementById('lobby-counter');
        if (infoEl) infoEl.textContent = `${game.name} // ${game.genre}`;
        if (counterEl) counterEl.textContent = `${index + 1} / ${ARCADE_GAMES.length}`;

        // Play nav sound
        if (prevIndex !== index && this.audio) {
            this.audio.playButtonSound();
        }
    }

    _centerMachine(index) {
        const track = document.getElementById('machines-track');
        if (!track || !this.machines[index]) return;

        const machine = this.machines[index];
        const viewport = document.getElementById('machines-viewport');
        if (!viewport) return;

        const viewportWidth = viewport.offsetWidth;
        const machineLeft = machine.offsetLeft;
        const machineWidth = machine.offsetWidth;
        const targetOffset = -(machineLeft - viewportWidth / 2 + machineWidth / 2);

        track.style.transform = `translateX(${targetOffset}px)`;
    }

    navigateLeft() {
        if (this.selectedIndex > 0) {
            this.select(this.selectedIndex - 1);
        }
    }

    navigateRight() {
        if (this.selectedIndex < ARCADE_GAMES.length - 1) {
            this.select(this.selectedIndex + 1);
        }
    }

    confirmSelection() {
        const game = ARCADE_GAMES[this.selectedIndex];
        if (!game) return;

        if (this.audio) {
            this.audio.playStartSound();
        }

        // Flash the selected machine
        const machine = this.machines[this.selectedIndex];
        if (machine) {
            machine.style.filter = 'brightness(2)';
            setTimeout(() => {
                machine.style.filter = '';
            }, 200);
        }

        // Dispatch game selection event
        const event = new CustomEvent('gameSelected', { detail: { game } });
        document.dispatchEvent(event);

        console.log(`GAME SELECTED: ${game.name}`);
    }

    // ── EVENT HANDLING ──
    _bindLobbyEvents() {
        // Machine click/tap
        this.machines.forEach((machine, index) => {
            machine.addEventListener('click', () => {
                if (this.selectedIndex === index) {
                    // Double-click to confirm
                    this.confirmSelection();
                } else {
                    this.select(index);
                    if (this.audio) this.audio.playSelectSound();
                }
            });
        });

        // Back button
        const backBtn = document.getElementById('lobby-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.audio) this.audio.playButtonSound();
                const event = new CustomEvent('lobbyBack');
                document.dispatchEvent(event);
            });
        }
    }

    _handleKeyDown(e) {
        if (!this.isActive) return;

        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                e.preventDefault();
                this.navigateLeft();
                break;

            case 'ArrowRight':
            case 'KeyD':
                e.preventDefault();
                this.navigateRight();
                break;

            case 'Enter':
            case 'Space':
                e.preventDefault();
                this.confirmSelection();
                break;

            case 'Escape':
            case 'Backspace':
                e.preventDefault();
                const event = new CustomEvent('lobbyBack');
                document.dispatchEvent(event);
                break;
        }
    }

    _handleTouchStart(e) {
        if (!this.isActive) return;
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;
    }

    _handleTouchEnd(e) {
        if (!this.isActive) return;
        const dx = e.changedTouches[0].screenX - this.touchStartX;
        const dy = e.changedTouches[0].screenY - this.touchStartY;

        if (Math.abs(dx) > this.swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) {
                this.navigateRight();
            } else {
                this.navigateLeft();
            }
        }
    }

    // ── LIFECYCLE ──
    activate() {
        this.isActive = true;

        // Build DOM if not built yet
        const lobbyScene = document.getElementById('lobby-scene');
        if (lobbyScene && lobbyScene.children.length === 0) {
            this.buildLobby();
        }

        // Bind global events
        document.addEventListener('keydown', this._handleKeyDown);
        document.addEventListener('touchstart', this._handleTouchStart, { passive: true });
        document.addEventListener('touchend', this._handleTouchEnd, { passive: true });

        // Start animations
        this._startCanvasAnimations();

        // Initial selection
        this.select(this.selectedIndex);

        // Update credits display
        this._syncCredits();
    }

    deactivate() {
        this.isActive = false;

        // Unbind global events
        document.removeEventListener('keydown', this._handleKeyDown);
        document.removeEventListener('touchstart', this._handleTouchStart);
        document.removeEventListener('touchend', this._handleTouchEnd);

        // Stop canvas animations
        this._stopCanvasAnimations();
    }

    _syncCredits() {
        const creditCountEl = document.getElementById('lobby-credit-count');
        const mainCreditsLed = document.getElementById('credits-led');
        if (creditCountEl && mainCreditsLed) {
            const match = mainCreditsLed.textContent.match(/\d+/);
            if (match) {
                creditCountEl.textContent = match[0].padStart(2, '0');
            }
        }
    }

    destroy() {
        this.deactivate();
        this.canvases = [];
        this.machines = [];
    }
}

// ── APP SCENE MANAGER ──
// Handles transitions between Landing, Lobby, and Game scenes
class AppSceneManager {
    constructor(audio) {
        this.audio = audio;
        this.currentScene = 'landing'; // 'landing' | 'lobby' | 'game'
        this.isTransitioning = false;
        this.lobby = null;
        this.gameSceneManager = null;
    }

    init() {
        // Create lobby scene container if not present
        if (!document.getElementById('lobby-scene')) {
            const lobbyScene = document.createElement('div');
            lobbyScene.id = 'lobby-scene';
            document.body.appendChild(lobbyScene);
        }

        // Initialize lobby system
        this.lobby = new ArcadeLobby(this.audio);
        this.lobby.buildLobby();

        // Initialize game scene manager
        this.gameSceneManager = new GameSceneManager(this.audio);
        this.gameSceneManager.init();

        // Listen for lobby events
        document.addEventListener('lobbyBack', () => {
            this.transitionTo('landing');
        });

        document.addEventListener('gameSelected', (e) => {
            this._handleGameSelected(e.detail.game);
        });

        document.addEventListener('backToLobbyFromGame', () => {
            this.transitionTo('lobby');
        });
    }

    transitionTo(targetScene, data = null) {
        if (this.isTransitioning || this.currentScene === targetScene) return;
        this.isTransitioning = true;

        const landingScene = document.getElementById('cabinet-frame');
        const lobbyScene = document.getElementById('lobby-scene');
        const gameScene = document.getElementById('game-scene');

        // Play transition sound
        if (this.audio) {
            this.audio.playStartSound();
        }
        
        // Use arcade intro power off transition
        if (window.arcadeSystem && window.arcadeSystem.arcadeIntro) {
            window.arcadeSystem.arcadeIntro.transitionPowerOff(() => {
                // Phase 1: Exit current scene
                if (targetScene === 'lobby') {
                    landingScene.classList.add('scene-exit');
                    if (gameScene) gameScene.classList.add('scene-exit');
                } else if (targetScene === 'game') {
                    lobbyScene.classList.add('scene-exit');
                } else { // landing
                    lobbyScene.classList.add('scene-exit');
                    if (gameScene) gameScene.classList.add('scene-exit');
                }

        setTimeout(() => {
            // Hide current scenes
            if (targetScene === 'lobby') {
                landingScene.style.display = 'none';
                landingScene.classList.remove('scene-exit');
                if (gameScene) {
                    gameScene.style.display = 'none';
                    gameScene.classList.remove('active', 'scene-exit');
                }
            } else if (targetScene === 'game') {
                lobbyScene.classList.remove('active');
                lobbyScene.classList.remove('scene-exit');
                this.lobby.deactivate();
                landingScene.style.display = 'none';
            } else { // landing
                lobbyScene.classList.remove('active');
                lobbyScene.classList.remove('scene-exit');
                this.lobby.deactivate();
                if (gameScene) {
                    gameScene.style.display = 'none';
                    gameScene.classList.remove('active', 'scene-exit');
                }
            }

            // Phase 2: Enter target scene
            if (targetScene === 'lobby') {
                lobbyScene.classList.add('active');
                lobbyScene.classList.add('scene-enter');
                this.lobby.activate();
            } else if (targetScene === 'game') {
                // Launch the game
                if (data && data.game && this.gameSceneManager) {
                    this.gameSceneManager.launchGame(data.game);
                }
            } else { // landing
                landingScene.style.display = '';
                landingScene.classList.add('scene-enter');
            }

             // Cleanup
            setTimeout(() => {
                if (lobbyScene) lobbyScene.classList.remove('scene-enter');
                if (landingScene) landingScene.classList.remove('scene-enter');

                this.currentScene = targetScene;
                this.isTransitioning = false;
            }, 800);
        });
        });
    }

    _handleGameSelected(game) {
        console.log(`LAUNCHING: ${game.name}`);

        // Transition to game scene
        this.transitionTo('game', { game });
    }
}
