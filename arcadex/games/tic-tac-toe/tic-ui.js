// ═══════════════════════════════════════════════════════════════════
// ARCADE X - TIC TAC TOE UI SYSTEM
// "Full DOM-based arcade UI: Mode Select → Game Board → Result Screen"
// Renders entirely in #game-scene via innerHTML manipulation.
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class TicTacToeUI {
    constructor(state, audio) {
        this.state = state;
        this.audio = audio;

        // DOM references (populated after build)
        this.container = null;

        // Hover tracking for mouse
        this.hoverCell = -1;

        // Particle pool for win effects
        this.particles = [];
        this.particleId = null;

        // CRT glitch timers
        this._glitchTimer = null;
    }

    // ════════════════════════════════════════════
    //  DOM CONSTRUCTION
    // ════════════════════════════════════════════

    mount(containerEl) {
        this.container = containerEl;
        this.container.innerHTML = '';
        this.container.classList.add('tic-game-root');

        // Inject CSS (only once)
        if (!document.getElementById('tic-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'tic-styles';
            styleEl.textContent = TicTacToeUI.CSS;
            document.head.appendChild(styleEl);
        }

        this._buildShell();
    }

    _buildShell() {
        this.container.innerHTML = `
            <div class="tic-shell">
                <!-- CRT mini-overlay for game area -->
                <div class="tic-crt-overlay"></div>

                <!-- HEADER BAR -->
                <div class="tic-header">
                    <div class="tic-header-left">
                        <button id="tic-back-btn" class="tic-btn tic-btn-back" title="Back to Lobby">◄ BACK</button>
                    </div>
                    <div class="tic-header-center">
                        <div class="tic-logo">TIC<span class="tic-blink">_</span>TAC<span class="tic-blink">_</span>TOE</div>
                    </div>
                    <div class="tic-header-right">
                        <div class="tic-mode-label" id="tic-mode-label"></div>
                    </div>
                </div>

                <!-- CONTENT AREA (swapped per state) -->
                <div class="tic-content" id="tic-content"></div>

                <!-- FOOTER BAR -->
                <div class="tic-footer">
                    <div class="tic-footer-left">
                        <div class="tic-score-display" id="tic-score-display"></div>
                    </div>
                    <div class="tic-footer-center">
                        <div class="tic-controls-hint" id="tic-controls-hint"></div>
                    </div>
                    <div class="tic-footer-right">
                        <div class="tic-status-led" id="tic-status-led"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // ════════════════════════════════════════════
    //  SCREEN RENDERERS
    // ════════════════════════════════════════════

    // ── MENU: MODE SELECTION ──
    renderModeSelect() {
        const content = document.getElementById('tic-content');
        if (!content) return;

        const modeLabel = document.getElementById('tic-mode-label');
        if (modeLabel) modeLabel.textContent = 'SELECT MODE';

        const options = [
            { id: 'single',    label: 'SINGLE PLAYER',      desc: 'PLAYER X vs PLAYER O — Same Device', icon: '►' },
            { id: 'ai',        label: 'VS AI',              desc: 'Challenge the Machine Intelligence', icon: '◆' },
            { id: 'multi',     label: 'LOCAL MULTIPLAYER',   desc: 'Head-to-Head on One Terminal',       icon: '◈' },
        ];

        this.state.menuOptions = options;
        const sel = this.state.menuSelectedIndex;

        content.innerHTML = `
            <div class="tic-menu tic-scene-enter">
                <div class="tic-menu-title">
                    <span class="tic-menu-bracket">[</span> SELECT GAME MODE <span class="tic-menu-bracket">]</span>
                </div>
                <div class="tic-menu-options" id="tic-menu-options">
                    ${options.map((opt, i) => `
                        <div class="tic-menu-option ${i === sel ? 'selected' : ''}"
                             data-index="${i}" data-mode="${opt.id}">
                            <div class="tic-option-icon">${opt.icon}</div>
                            <div class="tic-option-text">
                                <div class="tic-option-label">${opt.label}</div>
                                <div class="tic-option-desc">${opt.desc}</div>
                            </div>
                            <div class="tic-option-arrow">${i === sel ? '►' : ''}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="tic-menu-footer-hint">
                    ▲▼ NAVIGATE  •  ENTER SELECT  •  ESC BACK
                </div>
            </div>
        `;

        this._updateScoreDisplay();
        this._updateControlsHint('▲▼ Navigate  •  ENTER Select  •  ESC Back');
    }

    // ── MENU: DIFFICULTY SELECTION ──
    renderDifficultySelect() {
        const content = document.getElementById('tic-content');
        if (!content) return;

        const modeLabel = document.getElementById('tic-mode-label');
        if (modeLabel) modeLabel.textContent = 'AI DIFFICULTY';

        const options = [
            { id: 'ai-easy',   label: 'EASY',   desc: 'Random Moves — For Beginners',        icon: '○', color: '#00ff88' },
            { id: 'ai-medium', label: 'MEDIUM', desc: 'Strategic Play — Blocks & Attacks',    icon: '◐', color: '#ffaa00' },
            { id: 'ai-hard',   label: 'HARD',   desc: 'Minimax AI — Unbeatable Opponent',     icon: '●', color: '#ff3344' },
        ];

        this.state.menuOptions = options;
        const sel = this.state.menuSelectedIndex;

        content.innerHTML = `
            <div class="tic-menu tic-scene-enter">
                <div class="tic-menu-title">
                    <span class="tic-menu-bracket">[</span> SELECT DIFFICULTY <span class="tic-menu-bracket">]</span>
                </div>
                <div class="tic-menu-options" id="tic-menu-options">
                    ${options.map((opt, i) => `
                        <div class="tic-menu-option tic-difficulty-option ${i === sel ? 'selected' : ''}"
                             data-index="${i}" data-mode="${opt.id}"
                             style="--diff-color: ${opt.color}">
                            <div class="tic-option-icon" style="color: ${opt.color}">${opt.icon}</div>
                            <div class="tic-option-text">
                                <div class="tic-option-label">${opt.label}</div>
                                <div class="tic-option-desc">${opt.desc}</div>
                            </div>
                            <div class="tic-option-arrow">${i === sel ? '►' : ''}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="tic-menu-footer-hint">
                    ▲▼ NAVIGATE  •  ENTER SELECT  •  ESC BACK
                </div>
            </div>
        `;

        this._updateControlsHint('▲▼ Navigate  •  ENTER Select  •  ESC Back');
    }

    // ── GAME BOARD ──
    renderGameBoard() {
        const content = document.getElementById('tic-content');
        if (!content) return;

        const modeLabel = document.getElementById('tic-mode-label');
        if (modeLabel) modeLabel.textContent = this.state.getModeLabel();

        content.innerHTML = `
            <div class="tic-game tic-scene-enter">
                <!-- Turn indicator -->
                <div class="tic-turn-indicator" id="tic-turn-indicator">
                    <span class="tic-turn-player" id="tic-turn-player">PLAYER X</span>
                    <span class="tic-turn-label">YOUR TURN</span>
                </div>

                <!-- Board -->
                <div class="tic-board-wrap">
                    <div class="tic-board" id="tic-board">
                        ${Array(9).fill(null).map((_, i) => `
                            <div class="tic-cell" data-cell="${i}" id="tic-cell-${i}">
                                <div class="tic-cell-inner"></div>
                            </div>
                        `).join('')}
                    </div>
                    <!-- Win line overlay -->
                    <svg class="tic-win-line-svg" id="tic-win-line-svg" viewBox="0 0 300 300">
                        <line id="tic-win-line" x1="0" y1="0" x2="0" y2="0"
                              stroke="#ffff00" stroke-width="4" stroke-linecap="round"
                              opacity="0"/>
                    </svg>
                </div>

                <!-- AI thinking indicator -->
                <div class="tic-ai-thinking" id="tic-ai-thinking" style="display: none;">
                    <span class="tic-ai-dots">AI THINKING<span class="tic-dot-anim">...</span></span>
                </div>

                <!-- In-game controls -->
                <div class="tic-game-controls" id="tic-game-controls">
                    <button id="tic-restart-btn" class="tic-btn tic-btn-small">↻ RESTART</button>
                </div>
            </div>
        `;

        this._updateBoardCells();
        this._updateTurnDisplay();
        this._updateScoreDisplay();
        this._updateControlsHint('CLICK cell or ▲▼◄► + ENTER  •  ESC Back');
    }

    // ── RESULT SCREEN ──
    renderResult() {
        const content = document.getElementById('tic-content');
        if (!content) return;

        const modeLabel = document.getElementById('tic-mode-label');
        if (modeLabel) modeLabel.textContent = 'GAME OVER';

        const state = this.state;
        let titleText, titleClass, subtitleText;

        if (state.winner) {
            titleText = `PLAYER ${state.winner.player} WINS!`;
            titleClass = state.winner.player === 'X' ? 'tic-result-x' : 'tic-result-o';
            subtitleText = state.isAIMode()
                ? (state.winner.player === 'X' ? 'YOU DEFEATED THE MACHINE' : 'THE MACHINE PREVAILS')
                : `${state.winner.player} DOMINATED THE GRID`;
        } else {
            titleText = 'DRAW GAME';
            titleClass = 'tic-result-draw';
            subtitleText = 'NEITHER PLAYER COULD BREAK THROUGH';
        }

        content.innerHTML = `
            <div class="tic-result tic-scene-enter">
                <!-- Mini-board snapshot -->
                <div class="tic-result-board-mini">
                    ${Array(9).fill(null).map((_, i) => {
                        const sym = state.board[i];
                        const isWinCell = state.winner && state.winner.cells.includes(i);
                        return `<div class="tic-mini-cell ${isWinCell ? 'win-cell' : ''}">
                            ${sym ? `<span class="tic-mini-sym tic-sym-${sym.toLowerCase()}">${sym}</span>` : ''}
                        </div>`;
                    }).join('')}
                </div>

                <!-- Result title -->
                <div class="tic-result-title ${titleClass}">
                    <span class="tic-result-star">★</span>
                    ${titleText}
                    <span class="tic-result-star">★</span>
                </div>
                <div class="tic-result-subtitle">${subtitleText}</div>

                <!-- Score summary -->
                <div class="tic-result-scores">
                    <div class="tic-rs-item tic-rs-x">
                        <div class="tic-rs-label">PLAYER X</div>
                        <div class="tic-rs-value">${state.scores.X}</div>
                    </div>
                    <div class="tic-rs-item tic-rs-draw">
                        <div class="tic-rs-label">DRAWS</div>
                        <div class="tic-rs-value">${state.scores.draws}</div>
                    </div>
                    <div class="tic-rs-item tic-rs-o">
                        <div class="tic-rs-label">${state.isAIMode() ? 'AI' : 'PLAYER O'}</div>
                        <div class="tic-rs-value">${state.scores.O}</div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="tic-result-actions" id="tic-result-actions">
                    <button id="tic-play-again-btn" class="tic-btn tic-btn-primary tic-result-btn selected"
                            data-index="0">
                        ↻ PLAY AGAIN
                    </button>
                    <button id="tic-change-mode-btn" class="tic-btn tic-btn-secondary tic-result-btn"
                            data-index="1">
                        ◆ CHANGE MODE
                    </button>
                    <button id="tic-back-lobby-btn" class="tic-btn tic-btn-ghost tic-result-btn"
                            data-index="2">
                        ◄ BACK TO LOBBY
                    </button>
                </div>
            </div>
        `;

        this.state.menuSelectedIndex = 0;
        this._updateControlsHint('▲▼ Navigate  •  ENTER Select');

        // Start result particles
        this._startResultParticles();
    }

    // ════════════════════════════════════════════
    //  LIVE UI UPDATES (called from game loop)
    // ════════════════════════════════════════════

    _updateBoardCells() {
        for (let i = 0; i < 9; i++) {
            const cellEl = document.getElementById(`tic-cell-${i}`);
            if (!cellEl) continue;

            const inner = cellEl.querySelector('.tic-cell-inner');
            const sym = this.state.board[i];

            // Set symbol
            if (sym && inner.dataset.sym !== sym) {
                inner.dataset.sym = sym;
                inner.textContent = sym;
                inner.className = `tic-cell-inner tic-sym-${sym.toLowerCase()} tic-cell-pop`;
                cellEl.classList.add('filled');
            }

            // Cursor highlight (keyboard nav)
            cellEl.classList.toggle('cursor', this.state.usingKeyboard && this.state.cursorCell === i);

            // Hover highlight
            cellEl.classList.toggle('hover', this.hoverCell === i && sym === '');

            // Win highlight
            if (this.state.winner && this.state.winner.cells.includes(i)) {
                cellEl.classList.add('win-cell');
            }
        }
    }

    _updateTurnDisplay() {
        const turnEl = document.getElementById('tic-turn-indicator');
        const playerEl = document.getElementById('tic-turn-player');
        if (!turnEl || !playerEl) return;

        if (this.state.gameState !== TIC_STATES.PLAYING) return;

        const p = this.state.currentPlayer;
        playerEl.textContent = `PLAYER ${p}`;
        playerEl.className = `tic-turn-player tic-turn-${p.toLowerCase()}`;

        const label = turnEl.querySelector('.tic-turn-label');
        if (label) {
            if (this.state.aiThinking) {
                label.textContent = 'AI THINKING...';
            } else {
                label.textContent = this.state.isAIMode() && p === 'O' ? 'AI TURN' : 'YOUR TURN';
            }
        }
    }

    _updateScoreDisplay() {
        const el = document.getElementById('tic-score-display');
        if (!el) return;
        const s = this.state.scores;
        el.innerHTML = `
            <span class="tic-score-x">X:${s.X}</span>
            <span class="tic-score-sep">|</span>
            <span class="tic-score-d">D:${s.draws}</span>
            <span class="tic-score-sep">|</span>
            <span class="tic-score-o">O:${s.O}</span>
        `;
    }

    _updateControlsHint(text) {
        const el = document.getElementById('tic-controls-hint');
        if (el) el.textContent = text;
    }

    showAIThinking(show) {
        const el = document.getElementById('tic-ai-thinking');
        if (el) el.style.display = show ? 'flex' : 'none';
    }

    // ── WIN LINE ANIMATION ──
    drawWinLine(cells) {
        const svg = document.getElementById('tic-win-line-svg');
        const line = document.getElementById('tic-win-line');
        if (!svg || !line) return;

        // Map cell indices to center coordinates (0-300 viewBox)
        const cellSize = 100; // 300/3
        const getCenter = (idx) => ({
            x: (idx % 3) * cellSize + cellSize / 2,
            y: Math.floor(idx / 3) * cellSize + cellSize / 2
        });

        const start = getCenter(cells[0]);
        const end = getCenter(cells[2]);

        line.setAttribute('x1', start.x);
        line.setAttribute('y1', start.y);
        line.setAttribute('x2', end.x);
        line.setAttribute('y2', end.y);
        line.setAttribute('opacity', '1');
        line.classList.add('tic-win-line-anim');
    }

    // ── MENU HIGHLIGHT UPDATE ──
    updateMenuSelection(index) {
        const options = document.querySelectorAll('.tic-menu-option, .tic-result-btn');
        options.forEach((el, i) => {
            el.classList.toggle('selected', i === index);
            const arrow = el.querySelector('.tic-option-arrow');
            if (arrow) arrow.textContent = i === index ? '►' : '';
        });
    }

    // ── CRT GLITCH ON TRANSITIONS ──
    triggerGlitch() {
        const shell = this.container?.querySelector('.tic-shell');
        if (!shell) return;
        shell.classList.add('tic-glitch');
        clearTimeout(this._glitchTimer);
        this._glitchTimer = setTimeout(() => shell.classList.remove('tic-glitch'), 300);
    }

    // ── RESULT PARTICLES ──
    _startResultParticles() {
        const container = this.container?.querySelector('.tic-result');
        if (!container) return;

        // Create particle canvas
        const canvas = document.createElement('canvas');
        canvas.className = 'tic-particle-canvas';
        canvas.width = container.offsetWidth || 500;
        canvas.height = container.offsetHeight || 500;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        this.particles = [];

        const isWin = !!this.state.winner;
        const baseColor = isWin
            ? (this.state.winner.player === 'X' ? [0, 255, 100] : [255, 50, 80])
            : [255, 255, 0];

        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 100,
                y: canvas.height * 0.35,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 1,
                decay: 0.005 + Math.random() * 0.01,
                size: 1 + Math.random() * 3,
                color: baseColor
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.particles = this.particles.filter(p => p.life > 0);

            for (const p of this.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05; // gravity
                p.life -= p.decay;

                ctx.globalAlpha = p.life;
                ctx.fillStyle = `rgb(${p.color[0]}, ${p.color[1]}, ${p.color[2]})`;
                ctx.shadowColor = `rgb(${p.color[0]}, ${p.color[1]}, ${p.color[2]})`;
                ctx.shadowBlur = 6;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }

            if (this.particles.length > 0) {
                this.particleId = requestAnimationFrame(animate);
            }
        };

        this.particleId = requestAnimationFrame(animate);
    }

    stopParticles() {
        if (this.particleId) {
            cancelAnimationFrame(this.particleId);
            this.particleId = null;
        }
        this.particles = [];
    }

    // ════════════════════════════════════════════
    //  CLEANUP
    // ════════════════════════════════════════════

    destroy() {
        this.stopParticles();
        clearTimeout(this._glitchTimer);
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('tic-game-root');
        }
    }

    // ════════════════════════════════════════════
    //  STYLESHEET (injected once into <head>)
    // ════════════════════════════════════════════

    static get CSS() { return `
/* ╔══════════════════════════════════════════════╗
   ║  TIC TAC TOE — ARCADE THEME STYLESHEET      ║
   ║  Pixel · Neon · CRT · 60 FPS                ║
   ╚══════════════════════════════════════════════╝ */

@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

/* ── ROOT VARIABLES ── */
.tic-game-root {
    --tic-bg:         #0a0a0f;
    --tic-panel:      #0f0f18;
    --tic-border:     #1a1a2e;
    --tic-neon-green: #00ff88;
    --tic-neon-red:   #ff3355;
    --tic-neon-yellow:#ffee00;
    --tic-neon-cyan:  #00ccff;
    --tic-neon-purple:#cc44ff;
    --tic-dim:        #333344;
    --tic-text:       #aabbcc;
    --tic-font:       'Press Start 2P', 'Courier New', monospace;
}

/* ── SHELL ── */
.tic-shell {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--tic-bg);
    color: var(--tic-text);
    font-family: var(--tic-font);
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
}

.tic-crt-overlay {
    position: absolute;
    inset: 0;
    background:
        repeating-linear-gradient(
            0deg,
            rgba(0,0,0,0) 0px,
            rgba(0,0,0,0) 1px,
            rgba(0,0,0,0.06) 1px,
            rgba(0,0,0,0.06) 2px
        );
    pointer-events: none;
    z-index: 100;
    animation: tic-scanline-drift 0.1s linear infinite;
}

@keyframes tic-scanline-drift {
    0%   { transform: translateY(0); }
    100% { transform: translateY(2px); }
}

/* ── HEADER ── */
.tic-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--tic-panel);
    border-bottom: 2px solid var(--tic-border);
    min-height: 48px;
    z-index: 10;
}

.tic-logo {
    font-size: 14px;
    color: var(--tic-neon-green);
    text-shadow: 0 0 8px rgba(0,255,136,0.5), 0 0 20px rgba(0,255,136,0.2);
    letter-spacing: 2px;
}

.tic-blink {
    animation: tic-blink 1s steps(1) infinite;
}

@keyframes tic-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

.tic-mode-label {
    font-size: 8px;
    color: var(--tic-dim);
    letter-spacing: 1px;
    text-align: right;
}

/* ── BUTTONS ── */
.tic-btn {
    font-family: var(--tic-font);
    font-size: 10px;
    color: var(--tic-text);
    background: transparent;
    border: 1px solid var(--tic-dim);
    padding: 6px 14px;
    cursor: pointer;
    letter-spacing: 1px;
    transition: all 0.15s ease;
    text-transform: uppercase;
}
.tic-btn:hover, .tic-btn:focus {
    color: var(--tic-neon-yellow);
    border-color: var(--tic-neon-yellow);
    box-shadow: 0 0 8px rgba(255,238,0,0.3);
    outline: none;
}
.tic-btn:active {
    transform: scale(0.96);
}

.tic-btn-back {
    font-size: 9px;
    padding: 5px 10px;
}

.tic-btn-primary {
    color: var(--tic-neon-green);
    border-color: var(--tic-neon-green);
    box-shadow: 0 0 4px rgba(0,255,136,0.15);
}
.tic-btn-primary:hover, .tic-btn-primary.selected {
    background: rgba(0,255,136,0.1);
    box-shadow: 0 0 12px rgba(0,255,136,0.4);
}

.tic-btn-secondary {
    color: var(--tic-neon-cyan);
    border-color: var(--tic-neon-cyan);
}
.tic-btn-secondary:hover, .tic-btn-secondary.selected {
    background: rgba(0,204,255,0.1);
    box-shadow: 0 0 12px rgba(0,204,255,0.4);
}

.tic-btn-ghost {
    color: var(--tic-dim);
    border-color: transparent;
}
.tic-btn-ghost:hover, .tic-btn-ghost.selected {
    color: var(--tic-neon-yellow);
    border-color: var(--tic-neon-yellow);
    box-shadow: 0 0 8px rgba(255,238,0,0.2);
}

.tic-btn-small {
    font-size: 8px;
    padding: 4px 10px;
}

/* ── CONTENT ── */
.tic-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    position: relative;
    overflow: hidden;
}

/* ── SCENE TRANSITIONS ── */
.tic-scene-enter {
    animation: tic-scene-in 0.35s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes tic-scene-in {
    0% { opacity: 0; transform: translateY(12px) scale(0.97); filter: brightness(2); }
    100% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); }
}

/* CRT glitch on scene change */
.tic-glitch {
    animation: tic-glitch-fx 0.3s steps(4) both;
}
@keyframes tic-glitch-fx {
    0%   { filter: hue-rotate(0deg) brightness(1); }
    20%  { filter: hue-rotate(90deg) brightness(1.3); transform: translateX(-2px); }
    40%  { filter: hue-rotate(-45deg) brightness(0.8); transform: translateX(3px) scaleY(1.02); }
    60%  { filter: hue-rotate(180deg) brightness(1.2); transform: translateX(-1px); }
    80%  { filter: hue-rotate(-90deg) brightness(0.9); transform: translateX(1px) scaleY(0.98); }
    100% { filter: hue-rotate(0deg) brightness(1); transform: translateX(0); }
}

/* ═══════════════════════════════════════════
   MENU SCREENS
   ═══════════════════════════════════════════ */
.tic-menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    max-width: 420px;
}

.tic-menu-title {
    font-size: 10px;
    color: var(--tic-neon-cyan);
    letter-spacing: 3px;
    text-shadow: 0 0 6px rgba(0,204,255,0.4);
}
.tic-menu-bracket {
    color: var(--tic-dim);
}

.tic-menu-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.tic-menu-option {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--tic-border);
    cursor: pointer;
    transition: all 0.2s ease;
}
.tic-menu-option:hover,
.tic-menu-option.selected {
    background: rgba(0,255,136,0.06);
    border-color: var(--tic-neon-green);
    box-shadow: 0 0 12px rgba(0,255,136,0.15), inset 0 0 20px rgba(0,255,136,0.03);
}
.tic-menu-option.selected .tic-option-label {
    color: var(--tic-neon-green);
    text-shadow: 0 0 6px rgba(0,255,136,0.4);
}

.tic-difficulty-option:hover,
.tic-difficulty-option.selected {
    border-color: var(--diff-color, var(--tic-neon-green));
    box-shadow: 0 0 12px color-mix(in srgb, var(--diff-color, green) 30%, transparent);
}
.tic-difficulty-option.selected .tic-option-label {
    color: var(--diff-color, var(--tic-neon-green));
}

.tic-option-icon {
    font-size: 16px;
    color: var(--tic-neon-green);
    width: 24px;
    text-align: center;
}

.tic-option-label {
    font-size: 11px;
    color: var(--tic-text);
    letter-spacing: 1px;
}

.tic-option-desc {
    font-size: 7px;
    color: var(--tic-dim);
    margin-top: 4px;
    letter-spacing: 0.5px;
}

.tic-option-arrow {
    margin-left: auto;
    font-size: 12px;
    color: var(--tic-neon-green);
    width: 16px;
    text-align: center;
}

.tic-menu-footer-hint {
    font-size: 7px;
    color: var(--tic-dim);
    letter-spacing: 1px;
    margin-top: 8px;
}

/* ═══════════════════════════════════════════
   GAME BOARD
   ═══════════════════════════════════════════ */
.tic-game {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
}

.tic-turn-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.tic-turn-player {
    font-size: 14px;
    letter-spacing: 2px;
    transition: color 0.2s ease;
}
.tic-turn-x { color: var(--tic-neon-green); text-shadow: 0 0 8px rgba(0,255,136,0.5); }
.tic-turn-o { color: var(--tic-neon-red);   text-shadow: 0 0 8px rgba(255,51,85,0.5); }

.tic-turn-label {
    font-size: 7px;
    color: var(--tic-dim);
    letter-spacing: 2px;
}

.tic-board-wrap {
    position: relative;
    width: min(300px, 70vmin);
    height: min(300px, 70vmin);
}

.tic-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    width: 100%;
    height: 100%;
    gap: 4px;
    background: var(--tic-neon-green);
    box-shadow:
        0 0 12px rgba(0,255,136,0.25),
        0 0 40px rgba(0,255,136,0.08);
    border: 2px solid var(--tic-neon-green);
    padding: 4px;
}

.tic-cell {
    background: var(--tic-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    transition: background 0.15s ease;
}
.tic-cell::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.15s ease;
}
.tic-cell:hover:not(.filled)::before {
    background: rgba(255,238,0,0.08);
    opacity: 1;
}
.tic-cell.hover:not(.filled)::before {
    background: rgba(255,238,0,0.08);
    opacity: 1;
}
.tic-cell.cursor::before {
    border: 2px solid var(--tic-neon-yellow);
    opacity: 1;
    animation: tic-cursor-pulse 0.8s ease-in-out infinite alternate;
}
@keyframes tic-cursor-pulse {
    0% { opacity: 0.4; }
    100% { opacity: 1; }
}

.tic-cell.win-cell {
    background: rgba(255,238,0,0.08);
    animation: tic-win-cell-flash 0.5s ease-in-out infinite alternate;
}
@keyframes tic-win-cell-flash {
    0%   { background: rgba(255,238,0,0.05); }
    100% { background: rgba(255,238,0,0.18); }
}

.tic-cell-inner {
    font-size: min(6vmin, 42px);
    font-family: var(--tic-font);
    line-height: 1;
    pointer-events: none;
}

.tic-sym-x {
    color: var(--tic-neon-green);
    text-shadow: 0 0 12px rgba(0,255,136,0.6), 0 0 30px rgba(0,255,136,0.2);
}
.tic-sym-o {
    color: var(--tic-neon-red);
    text-shadow: 0 0 12px rgba(255,51,85,0.6), 0 0 30px rgba(255,51,85,0.2);
}

/* Pop animation on symbol placement */
.tic-cell-pop {
    animation: tic-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes tic-pop {
    0%   { transform: scale(0); opacity: 0; }
    50%  { transform: scale(1.3); }
    100% { transform: scale(1); opacity: 1; }
}

/* Win line SVG overlay */
.tic-win-line-svg {
    position: absolute;
    inset: 4px; /* match board padding */
    width: calc(100% - 8px);
    height: calc(100% - 8px);
    pointer-events: none;
    z-index: 10;
}

.tic-win-line-anim {
    animation: tic-win-line-draw 0.4s ease-out both;
    filter: drop-shadow(0 0 6px rgba(255,238,0,0.8));
}
@keyframes tic-win-line-draw {
    0%   { stroke-dasharray: 0 500; opacity: 0; }
    100% { stroke-dasharray: 500 0; opacity: 1; }
}

/* AI thinking */
.tic-ai-thinking {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--tic-dim);
    font-size: 8px;
    letter-spacing: 1px;
    min-height: 20px;
}

.tic-dot-anim {
    display: inline-block;
    animation: tic-dots 1.2s steps(4, end) infinite;
    overflow: hidden;
    vertical-align: bottom;
    width: 0;
}
@keyframes tic-dots {
    0%   { width: 0; }
    25%  { width: 6px; }
    50%  { width: 12px; }
    75%  { width: 18px; }
    100% { width: 24px; }
}

.tic-game-controls {
    display: flex;
    gap: 8px;
}

/* ═══════════════════════════════════════════
   RESULT SCREEN
   ═══════════════════════════════════════════ */
.tic-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    position: relative;
    width: 100%;
    max-width: 420px;
}

.tic-particle-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
}

/* Mini board snapshot */
.tic-result-board-mini {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    width: 90px;
    height: 90px;
    background: var(--tic-dim);
    border: 1px solid var(--tic-dim);
    padding: 2px;
    opacity: 0.7;
}
.tic-mini-cell {
    background: var(--tic-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
}
.tic-mini-cell.win-cell {
    background: rgba(255,238,0,0.12);
}
.tic-mini-sym { font-family: var(--tic-font); }
.tic-mini-sym.tic-sym-x { color: var(--tic-neon-green); }
.tic-mini-sym.tic-sym-o { color: var(--tic-neon-red); }

/* Result title */
.tic-result-title {
    font-size: 16px;
    letter-spacing: 3px;
    text-align: center;
    z-index: 1;
    animation: tic-result-pulse 1.5s ease-in-out infinite alternate;
}
.tic-result-x {
    color: var(--tic-neon-green);
    text-shadow: 0 0 12px rgba(0,255,136,0.6), 0 0 30px rgba(0,255,136,0.2);
}
.tic-result-o {
    color: var(--tic-neon-red);
    text-shadow: 0 0 12px rgba(255,51,85,0.6), 0 0 30px rgba(255,51,85,0.2);
}
.tic-result-draw {
    color: var(--tic-neon-yellow);
    text-shadow: 0 0 12px rgba(255,238,0,0.6), 0 0 30px rgba(255,238,0,0.2);
}
@keyframes tic-result-pulse {
    0%   { filter: brightness(1); }
    100% { filter: brightness(1.3); }
}

.tic-result-star {
    display: inline-block;
    margin: 0 6px;
    animation: tic-star-spin 2s linear infinite;
}
@keyframes tic-star-spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.tic-result-subtitle {
    font-size: 7px;
    color: var(--tic-dim);
    letter-spacing: 1px;
    text-align: center;
    z-index: 1;
}

/* Scores */
.tic-result-scores {
    display: flex;
    gap: 16px;
    z-index: 1;
}
.tic-rs-item {
    text-align: center;
    padding: 8px 14px;
    border: 1px solid var(--tic-border);
    min-width: 70px;
}
.tic-rs-label {
    font-size: 7px;
    color: var(--tic-dim);
    margin-bottom: 4px;
    letter-spacing: 1px;
}
.tic-rs-value {
    font-size: 18px;
}
.tic-rs-x .tic-rs-value { color: var(--tic-neon-green); }
.tic-rs-o .tic-rs-value { color: var(--tic-neon-red); }
.tic-rs-draw .tic-rs-value { color: var(--tic-neon-yellow); }

/* Result actions */
.tic-result-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 280px;
    z-index: 1;
}

.tic-result-btn {
    width: 100%;
    padding: 10px 16px;
    font-size: 9px;
}

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */
.tic-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: var(--tic-panel);
    border-top: 2px solid var(--tic-border);
    min-height: 36px;
    z-index: 10;
}

.tic-score-display {
    font-size: 8px;
    letter-spacing: 1px;
}
.tic-score-x { color: var(--tic-neon-green); }
.tic-score-o { color: var(--tic-neon-red); }
.tic-score-d { color: var(--tic-neon-yellow); }
.tic-score-sep { color: var(--tic-dim); margin: 0 4px; }

.tic-controls-hint {
    font-size: 7px;
    color: var(--tic-dim);
    letter-spacing: 0.5px;
    text-align: center;
}

.tic-status-led {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--tic-neon-green);
    box-shadow: 0 0 6px rgba(0,255,136,0.6);
    animation: tic-led-pulse 2s ease-in-out infinite;
}
@keyframes tic-led-pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.4; }
}

/* ═══════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════ */
@media (max-width: 500px) {
    .tic-logo { font-size: 10px; }
    .tic-menu-option { padding: 10px 12px; }
    .tic-option-label { font-size: 9px; }
    .tic-result-title { font-size: 12px; }
    .tic-turn-player { font-size: 11px; }
    .tic-board-wrap { width: min(260px, 75vmin); height: min(260px, 75vmin); }
}

@media (max-height: 500px) {
    .tic-board-wrap { width: min(220px, 55vmin); height: min(220px, 55vmin); }
    .tic-result-board-mini { width: 60px; height: 60px; }
    .tic-result-scores { gap: 8px; }
    .tic-rs-item { padding: 4px 8px; min-width: 55px; }
}
`; }
}

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TicTacToeUI };
}