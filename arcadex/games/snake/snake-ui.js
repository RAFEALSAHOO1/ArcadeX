// ═══════════════════════════════════════════════════════════════════
// ARCADE X — SNAKE UI SYSTEM
// DOM shell + Canvas game board.  Menus & overlays are DOM, the
// gameplay grid is rendered to a <canvas> at 60 FPS.
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class SnakeUI {
    constructor(state, audio) {
        this.state = state;
        this.audio = audio;
        this.container = null;

        // Canvas refs
        this.canvas = null;
        this.ctx = null;

        // Computed sizing
        this.cellSize = 0;    // px per grid cell
        this.boardX = 0;
        this.boardY = 0;

        // CRT glitch timer
        this._glitchTimer = null;

        // Particle pool for results
        this.particles = [];
        this.particleId = null;
    }

    // ════════════════════════════════════════════
    //  MOUNT / DESTROY
    // ════════════════════════════════════════════

    mount(containerEl) {
        this.container = containerEl;
        this.container.innerHTML = '';
        this.container.classList.add('snk-game-root');

        // Inject CSS (once)
        if (!document.getElementById('snk-styles')) {
            const s = document.createElement('style');
            s.id = 'snk-styles';
            s.textContent = SnakeUI.CSS;
            document.head.appendChild(s);
        }

        this._buildShell();
    }

    destroy() {
        this._stopParticles();
        clearTimeout(this._glitchTimer);
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('snk-game-root');
        }
        this.canvas = null;
        this.ctx = null;
    }

    // ════════════════════════════════════════════
    //  DOM SHELL
    // ════════════════════════════════════════════

    _buildShell() {
        this.container.innerHTML = `
            <div class="snk-shell">
                <div class="snk-crt-overlay"></div>

                <!-- HEADER -->
                <div class="snk-header">
                    <div class="snk-header-left">
                        <button id="snk-back-btn" class="snk-btn snk-btn-back" title="Back">◄ BACK</button>
                    </div>
                    <div class="snk-header-center">
                        <div class="snk-logo">SNA<span class="snk-blink">_</span>KE</div>
                    </div>
                    <div class="snk-header-right">
                        <div class="snk-mode-label" id="snk-mode-label"></div>
                    </div>
                </div>

                <!-- CONTENT -->
                <div class="snk-content" id="snk-content"></div>

                <!-- FOOTER -->
                <div class="snk-footer">
                    <div class="snk-footer-left">
                        <div class="snk-score-display" id="snk-score-display"></div>
                    </div>
                    <div class="snk-footer-center">
                        <div class="snk-controls-hint" id="snk-controls-hint"></div>
                    </div>
                    <div class="snk-footer-right">
                        <div class="snk-status-led" id="snk-status-led"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // ════════════════════════════════════════════
    //  SCREEN RENDERERS
    // ════════════════════════════════════════════

    // ── MODE SELECT ──
    renderModeSelect() {
        const content = document.getElementById('snk-content');
        if (!content) return;
        this._setModeLabel('SELECT MODE');

        const options = [
            { id: 'single', label: 'CLASSIC MODE',       desc: 'Solo Arcade Snake — Beat Your High Score', icon: '►' },
            { id: 'ai',     label: 'VS AI',              desc: 'Race Against the Machine Intelligence',    icon: '◆' },
            { id: 'multi',  label: 'LOCAL MULTIPLAYER',   desc: 'Head-to-Head on One Terminal',             icon: '◈' },
        ];
        this.state.menuOptions = options;
        const sel = this.state.menuSelectedIndex;

        content.innerHTML = `
            <div class="snk-menu snk-scene-enter">
                <div class="snk-menu-title">
                    <span class="snk-menu-bracket">[</span> SELECT GAME MODE <span class="snk-menu-bracket">]</span>
                </div>
                <div class="snk-menu-options" id="snk-menu-options">
                    ${options.map((o, i) => `
                        <div class="snk-menu-option ${i === sel ? 'selected' : ''}"
                             data-index="${i}" data-mode="${o.id}">
                            <div class="snk-option-icon">${o.icon}</div>
                            <div class="snk-option-text">
                                <div class="snk-option-label">${o.label}</div>
                                <div class="snk-option-desc">${o.desc}</div>
                            </div>
                            <div class="snk-option-arrow">${i === sel ? '►' : ''}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="snk-menu-footer-hint">▲▼ NAVIGATE  •  ENTER SELECT  •  ESC BACK</div>
            </div>
        `;
        this._updateScoreBar();
        this._setHint('▲▼ Navigate  •  ENTER Select  •  ESC Back');
    }

    // ── DIFFICULTY SELECT ──
    renderDifficultySelect() {
        const content = document.getElementById('snk-content');
        if (!content) return;
        this._setModeLabel('AI DIFFICULTY');

        const options = [
            { id: 'ai-easy',   label: 'EASY',   desc: 'Random Moves — Slow Speed',       icon: '○', color: '#00ff88' },
            { id: 'ai-medium', label: 'MEDIUM', desc: 'Greedy Pathfinding — Faster',      icon: '◐', color: '#ffaa00' },
            { id: 'ai-hard',   label: 'HARD',   desc: 'BFS + Flood Fill — Relentless',    icon: '●', color: '#ff3344' },
        ];
        this.state.menuOptions = options;
        const sel = this.state.menuSelectedIndex;

        content.innerHTML = `
            <div class="snk-menu snk-scene-enter">
                <div class="snk-menu-title">
                    <span class="snk-menu-bracket">[</span> SELECT DIFFICULTY <span class="snk-menu-bracket">]</span>
                </div>
                <div class="snk-menu-options" id="snk-menu-options">
                    ${options.map((o, i) => `
                        <div class="snk-menu-option snk-difficulty-option ${i === sel ? 'selected' : ''}"
                             data-index="${i}" data-mode="${o.id}"
                             style="--diff-color: ${o.color}">
                            <div class="snk-option-icon" style="color:${o.color}">${o.icon}</div>
                            <div class="snk-option-text">
                                <div class="snk-option-label">${o.label}</div>
                                <div class="snk-option-desc">${o.desc}</div>
                            </div>
                            <div class="snk-option-arrow">${i === sel ? '►' : ''}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="snk-menu-footer-hint">▲▼ NAVIGATE  •  ENTER SELECT  •  ESC BACK</div>
            </div>
        `;
        this._setHint('▲▼ Navigate  •  ENTER Select  •  ESC Back');
    }

    // ── GAME BOARD (canvas) ──
    renderGameBoard() {
        const content = document.getElementById('snk-content');
        if (!content) return;
        this._setModeLabel(this.state.getModeLabel());

        const multiInfo = this.state.mode === SNAKE_MODES.MULTI
            ? `<div class="snk-player-labels">
                   <span class="snk-p1-label">P1: ▲▼◄►</span>
                   <span class="snk-p2-label">P2: WASD</span>
               </div>` : '';

        const aiInfo = this.state.isAIMode()
            ? `<div class="snk-player-labels">
                   <span class="snk-p1-label">YOU: ▲▼◄►</span>
                   <span class="snk-ai-label">AI</span>
               </div>` : '';

        content.innerHTML = `
            <div class="snk-game snk-scene-enter">
                <div class="snk-hud" id="snk-hud">
                    <div class="snk-hud-score" id="snk-hud-score">SCORE: 0</div>
                    ${multiInfo}${aiInfo}
                    <div class="snk-hud-right">
                        <button id="snk-pause-btn" class="snk-btn snk-btn-small">❚❚ PAUSE</button>
                        <button id="snk-restart-btn" class="snk-btn snk-btn-small">↻ RESTART</button>
                    </div>
                </div>
                <div class="snk-board-wrap" id="snk-board-wrap">
                    <canvas id="snk-canvas"></canvas>
                </div>
            </div>
        `;

        // Setup canvas
        this.canvas = document.getElementById('snk-canvas');
        this.ctx = this.canvas.getContext('2d');
        this._sizeCanvas();
        this._updateScoreBar();
        this._setHint('▲▼◄► Move  •  P Pause  •  ESC Back');
    }

    // ── PAUSE OVERLAY ──
    renderPauseOverlay() {
        // Remove old overlay
        this._removePauseOverlay();
        const wrap = document.getElementById('snk-board-wrap');
        if (!wrap) return;

        const overlay = document.createElement('div');
        overlay.id = 'snk-pause-overlay';
        overlay.className = 'snk-pause-overlay snk-scene-enter';
        overlay.innerHTML = `
            <div class="snk-pause-text">❚❚ PAUSED</div>
            <div class="snk-pause-sub">PRESS P OR ENTER TO RESUME</div>
        `;
        wrap.appendChild(overlay);
    }

    _removePauseOverlay() {
        const el = document.getElementById('snk-pause-overlay');
        if (el) el.remove();
    }

    // ── RESULT SCREEN ──
    renderResult() {
        const content = document.getElementById('snk-content');
        if (!content) return;
        this._setModeLabel('GAME OVER');

        const s = this.state;
        const p1 = s.snakes[0];
        const p2 = s.snakes[1] || null;

        let titleText, titleClass, subtitleText;

        if (s.snakes.length === 1) {
            // Single player
            titleText = `SCORE: ${p1.score}`;
            titleClass = 'snk-result-single';
            subtitleText = p1.score > s.highScore
                ? '★ NEW HIGH SCORE ★'
                : `HIGH SCORE: ${s.highScore}`;
        } else if (s.winner) {
            const winnerId = s.winner.id;
            if (s.isAIMode()) {
                titleText = winnerId === 0 ? 'YOU WIN!' : 'AI WINS!';
                titleClass = winnerId === 0 ? 'snk-result-win' : 'snk-result-lose';
                subtitleText = winnerId === 0 ? 'THE MACHINE HAS BEEN BESTED' : 'THE MACHINE PREVAILS';
            } else {
                titleText = `PLAYER ${winnerId + 1} WINS!`;
                titleClass = winnerId === 0 ? 'snk-result-win' : 'snk-result-lose';
                subtitleText = `P1: ${p1.score}  |  P2: ${p2.score}`;
            }
        } else {
            titleText = 'DRAW!';
            titleClass = 'snk-result-draw';
            subtitleText = 'BOTH SNAKES FELL';
        }

        content.innerHTML = `
            <div class="snk-result snk-scene-enter">
                <div class="snk-result-title ${titleClass}">
                    <span class="snk-result-star">★</span>
                    ${titleText}
                    <span class="snk-result-star">★</span>
                </div>
                <div class="snk-result-subtitle">${subtitleText}</div>

                <div class="snk-result-scores">
                    <div class="snk-rs-item snk-rs-p1">
                        <div class="snk-rs-label">${s.isAIMode() ? 'YOU' : 'P1'}</div>
                        <div class="snk-rs-value">${p1.score}</div>
                    </div>
                    ${p2 ? `
                    <div class="snk-rs-item snk-rs-p2">
                        <div class="snk-rs-label">${s.isAIMode() ? 'AI' : 'P2'}</div>
                        <div class="snk-rs-value">${p2.score}</div>
                    </div>` : ''}
                </div>

                <div class="snk-result-actions" id="snk-result-actions">
                    <button id="snk-play-again-btn" class="snk-btn snk-btn-primary snk-result-btn selected" data-index="0">
                        ↻ PLAY AGAIN
                    </button>
                    <button id="snk-change-mode-btn" class="snk-btn snk-btn-secondary snk-result-btn" data-index="1">
                        ◆ CHANGE MODE
                    </button>
                    <button id="snk-back-lobby-btn" class="snk-btn snk-btn-ghost snk-result-btn" data-index="2">
                        ◄ BACK TO LOBBY
                    </button>
                </div>
            </div>
        `;

        this.state.menuSelectedIndex = 0;
        this._setHint('▲▼ Navigate  •  ENTER Select');
        this._startResultParticles();
    }

    // ════════════════════════════════════════════
    //  CANVAS RENDERING (called every frame)
    // ════════════════════════════════════════════

    drawFrame() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const s = this.state;
        const cs = this.cellSize;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // ── Background ──
        ctx.fillStyle = '#060610';
        ctx.fillRect(0, 0, w, h);

        // ── Grid lines (subtle) ──
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= s.cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cs, 0);
            ctx.lineTo(x * cs, s.rows * cs);
            ctx.stroke();
        }
        for (let y = 0; y <= s.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cs);
            ctx.lineTo(s.cols * cs, y * cs);
            ctx.stroke();
        }

        // ── Border ──
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0,204,255,0.5)';
        ctx.shadowBlur = 8;
        ctx.strokeRect(0, 0, s.cols * cs, s.rows * cs);
        ctx.shadowBlur = 0;

        // ── Food ──
        if (s.food) {
            const pulse = 0.5 + 0.5 * Math.sin(s.foodAge * 8);
            const foodSize = cs * (0.6 + 0.15 * pulse);
            const fx = s.food.x * cs + cs / 2;
            const fy = s.food.y * cs + cs / 2;

            ctx.fillStyle = '#ffee00';
            ctx.shadowColor = 'rgba(255,238,0,0.8)';
            ctx.shadowBlur = 6 + 4 * pulse;
            ctx.fillRect(fx - foodSize / 2, fy - foodSize / 2, foodSize, foodSize);
            ctx.shadowBlur = 0;
        }

        // ── Eat flash overlay ──
        if (s.eatFlash > 0) {
            ctx.fillStyle = `rgba(255,238,0,${s.eatFlash * 0.3})`;
            ctx.fillRect(0, 0, w, h);
        }

        // ── Snakes ──
        const SNAKE_COLORS = {
            green: { body: '#00ff88', head: '#00ffaa', glow: 'rgba(0,255,136,0.5)' },
            cyan:  { body: '#00ccff', head: '#44ddff', glow: 'rgba(0,204,255,0.5)' },
            red:   { body: '#ff3355', head: '#ff5577', glow: 'rgba(255,51,85,0.5)' }
        };

        for (const snake of s.snakes) {
            const pal = SNAKE_COLORS[snake.color] || SNAKE_COLORS.green;

            if (!snake.alive) {
                // Death fade
                ctx.globalAlpha = Math.max(0, 0.3);
            }

            // Body segments
            for (let i = snake.body.length - 1; i >= 0; i--) {
                const seg = snake.body[i];
                const isHead = i === 0;
                const segSize = isHead ? cs * 0.92 : cs * 0.8;
                const px = seg.x * cs + cs / 2;
                const py = seg.y * cs + cs / 2;

                // Glow behind
                if (isHead) {
                    ctx.shadowColor = pal.glow;
                    ctx.shadowBlur = 10;
                }

                ctx.fillStyle = isHead ? pal.head : pal.body;

                // Slight fade toward tail
                if (!isHead) {
                    const fade = 1.0 - (i / snake.body.length) * 0.4;
                    ctx.globalAlpha = (snake.alive ? 1 : 0.3) * fade;
                }

                ctx.fillRect(px - segSize / 2, py - segSize / 2, segSize, segSize);
                ctx.shadowBlur = 0;

                // Eyes on head
                if (isHead && snake.alive) {
                    ctx.fillStyle = '#000';
                    const d = DIRS[snake.dir];
                    const eyeOff = cs * 0.15;
                    const eyeSize = cs * 0.12;
                    // Two eyes perpendicular to direction
                    const perpX = -d.y;
                    const perpY = d.x;
                    ctx.fillRect(
                        px + d.x * eyeOff + perpX * eyeOff * 0.8 - eyeSize / 2,
                        py + d.y * eyeOff + perpY * eyeOff * 0.8 - eyeSize / 2,
                        eyeSize, eyeSize
                    );
                    ctx.fillRect(
                        px + d.x * eyeOff - perpX * eyeOff * 0.8 - eyeSize / 2,
                        py + d.y * eyeOff - perpY * eyeOff * 0.8 - eyeSize / 2,
                        eyeSize, eyeSize
                    );
                }
            }

            ctx.globalAlpha = 1;
        }

        // ── Death effect — CRT static ──
        if (s.deathEffect > 0) {
            const intensity = Math.min(s.deathEffect * 3, 0.4);
            for (let i = 0; i < 60; i++) {
                const rx = Math.random() * w;
                const ry = Math.random() * h;
                const rw = Math.random() * 8 + 2;
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * intensity})`;
                ctx.fillRect(rx, ry, rw, 1);
            }
        }
    }

    // ── CANVAS SIZING ──
    _sizeCanvas() {
        if (!this.canvas) return;
        const wrap = document.getElementById('snk-board-wrap');
        if (!wrap) return;

        const ww = wrap.clientWidth;
        const wh = wrap.clientHeight;
        const s = this.state;

        // Fit grid into container, maintain square cells
        this.cellSize = Math.floor(Math.min(ww / s.cols, wh / s.rows));
        this.canvas.width = s.cols * this.cellSize;
        this.canvas.height = s.rows * this.cellSize;
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';
    }

    // ── HUD UPDATES ──
    updateHUD() {
        const el = document.getElementById('snk-hud-score');
        if (!el) return;

        const s = this.state;
        if (s.snakes.length === 1) {
            el.textContent = `SCORE: ${s.snakes[0].score}`;
        } else {
            const p1 = s.snakes[0];
            const p2 = s.snakes[1];
            const label1 = s.isAIMode() ? 'YOU' : 'P1';
            const label2 = s.isAIMode() ? 'AI' : 'P2';
            el.innerHTML = `<span class="snk-sc-p1">${label1}: ${p1.score}</span> <span class="snk-sc-sep">|</span> <span class="snk-sc-p2">${label2}: ${p2.score}</span>`;
        }
    }

    _updateScoreBar() {
        const el = document.getElementById('snk-score-display');
        if (!el) return;
        el.innerHTML = `<span class="snk-score-hi">HI: ${this.state.highScore}</span>`;
    }

    _setModeLabel(text) {
        const el = document.getElementById('snk-mode-label');
        if (el) el.textContent = text;
    }

    _setHint(text) {
        const el = document.getElementById('snk-controls-hint');
        if (el) el.textContent = text;
    }

    // ── MENU SELECTION ──
    updateMenuSelection(index) {
        const opts = document.querySelectorAll('.snk-menu-option, .snk-result-btn');
        opts.forEach((el, i) => {
            el.classList.toggle('selected', i === index);
            const arrow = el.querySelector('.snk-option-arrow');
            if (arrow) arrow.textContent = i === index ? '►' : '';
        });
    }

    // ── CRT GLITCH ──
    triggerGlitch() {
        const shell = this.container?.querySelector('.snk-shell');
        if (!shell) return;
        shell.classList.add('snk-glitch');
        clearTimeout(this._glitchTimer);
        this._glitchTimer = setTimeout(() => shell.classList.remove('snk-glitch'), 300);
    }

    // ── RESULT PARTICLES ──
    _startResultParticles() {
        const container = this.container?.querySelector('.snk-result');
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'snk-particle-canvas';
        canvas.width = container.offsetWidth || 500;
        canvas.height = container.offsetHeight || 400;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        this.particles = [];

        const base = this.state.winner?.id === 0 ? [0, 255, 100] : [0, 204, 255];

        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 120,
                y: canvas.height * 0.3,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 1,
                decay: 0.005 + Math.random() * 0.01,
                size: 1 + Math.random() * 3,
                color: base
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.particles = this.particles.filter(p => p.life > 0);
            for (const p of this.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05;
                p.life -= p.decay;
                ctx.globalAlpha = p.life;
                ctx.fillStyle = `rgb(${p.color[0]},${p.color[1]},${p.color[2]})`;
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 6;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
            if (this.particles.length > 0) {
                this.particleId = requestAnimationFrame(animate);
            }
        };

        this.particleId = requestAnimationFrame(animate);
    }

    _stopParticles() {
        if (this.particleId) {
            cancelAnimationFrame(this.particleId);
            this.particleId = null;
        }
        this.particles = [];
    }

    // ════════════════════════════════════════════
    //  CSS STYLESHEET
    // ════════════════════════════════════════════

    static get CSS() { return `
/* ╔══════════════════════════════════════════════╗
   ║  SNAKE — ARCADE THEME STYLESHEET            ║
   ║  Pixel · Neon · CRT · 60 FPS                ║
   ╚══════════════════════════════════════════════╝ */

@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.snk-game-root {
    --snk-bg:          #0a0a0f;
    --snk-panel:       #0f0f18;
    --snk-border:      #1a1a2e;
    --snk-neon-green:  #00ff88;
    --snk-neon-red:    #ff3355;
    --snk-neon-yellow: #ffee00;
    --snk-neon-cyan:   #00ccff;
    --snk-dim:         #333344;
    --snk-text:        #aabbcc;
    --snk-font:        'Press Start 2P', 'Courier New', monospace;
}

/* ── SHELL ── */
.snk-shell {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--snk-bg);
    color: var(--snk-text);
    font-family: var(--snk-font);
    overflow: hidden;
    user-select: none;
}

.snk-crt-overlay {
    position: absolute; inset: 0;
    background: repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 1px,rgba(0,0,0,0.06) 1px,rgba(0,0,0,0.06) 2px);
    pointer-events: none; z-index: 100;
    animation: snk-scanline-drift .1s linear infinite;
}
@keyframes snk-scanline-drift { 0%{transform:translateY(0)} 100%{transform:translateY(2px)} }

/* ── HEADER ── */
.snk-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px; background: var(--snk-panel);
    border-bottom: 2px solid var(--snk-border); min-height: 48px; z-index: 10;
}
.snk-logo {
    font-size: 14px; color: var(--snk-neon-cyan);
    text-shadow: 0 0 8px rgba(0,204,255,0.5), 0 0 20px rgba(0,204,255,0.2);
    letter-spacing: 2px;
}
.snk-blink { animation: snk-blink 1s steps(1) infinite; }
@keyframes snk-blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }

.snk-mode-label { font-size: 8px; color: var(--snk-dim); letter-spacing: 1px; text-align: right; }

/* ── BUTTONS ── */
.snk-btn {
    font-family: var(--snk-font); font-size: 10px; color: var(--snk-text);
    background: transparent; border: 1px solid var(--snk-dim);
    padding: 6px 14px; cursor: pointer; letter-spacing: 1px;
    transition: all .15s ease; text-transform: uppercase;
}
.snk-btn:hover,.snk-btn:focus {
    color: var(--snk-neon-yellow); border-color: var(--snk-neon-yellow);
    box-shadow: 0 0 8px rgba(255,238,0,0.3); outline: none;
}
.snk-btn:active { transform: scale(0.96); }

.snk-btn-back { font-size: 9px; padding: 5px 10px; }
.snk-btn-small { font-size: 8px; padding: 4px 10px; }

.snk-btn-primary { color: var(--snk-neon-green); border-color: var(--snk-neon-green); box-shadow: 0 0 4px rgba(0,255,136,0.15); }
.snk-btn-primary:hover,.snk-btn-primary.selected { background: rgba(0,255,136,0.1); box-shadow: 0 0 12px rgba(0,255,136,0.4); }

.snk-btn-secondary { color: var(--snk-neon-cyan); border-color: var(--snk-neon-cyan); }
.snk-btn-secondary:hover,.snk-btn-secondary.selected { background: rgba(0,204,255,0.1); box-shadow: 0 0 12px rgba(0,204,255,0.4); }

.snk-btn-ghost { color: var(--snk-dim); border-color: transparent; }
.snk-btn-ghost:hover,.snk-btn-ghost.selected { color: var(--snk-neon-yellow); border-color: var(--snk-neon-yellow); box-shadow: 0 0 8px rgba(255,238,0,0.2); }

/* ── CONTENT ── */
.snk-content {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 8px; position: relative; overflow: hidden;
}

/* ── TRANSITIONS ── */
.snk-scene-enter { animation: snk-scene-in .35s cubic-bezier(.22,1,.36,1) both; }
@keyframes snk-scene-in {
    0%   { opacity:0; transform:translateY(12px) scale(.97); filter:brightness(2); }
    100% { opacity:1; transform:translateY(0) scale(1); filter:brightness(1); }
}
.snk-glitch { animation: snk-glitch-fx .3s steps(4) both; }
@keyframes snk-glitch-fx {
    0%  { filter:hue-rotate(0) brightness(1); }
    20% { filter:hue-rotate(90deg) brightness(1.3); transform:translateX(-2px); }
    40% { filter:hue-rotate(-45deg) brightness(.8); transform:translateX(3px) scaleY(1.02); }
    60% { filter:hue-rotate(180deg) brightness(1.2); transform:translateX(-1px); }
    80% { filter:hue-rotate(-90deg) brightness(.9); transform:translateX(1px) scaleY(.98); }
    100%{ filter:hue-rotate(0) brightness(1); transform:translateX(0); }
}

/* ═══════════════ MENU ═══════════════ */
.snk-menu { display:flex; flex-direction:column; align-items:center; gap:20px; width:100%; max-width:420px; }
.snk-menu-title { font-size:10px; color:var(--snk-neon-cyan); letter-spacing:3px; text-shadow:0 0 6px rgba(0,204,255,0.4); }
.snk-menu-bracket { color:var(--snk-dim); }
.snk-menu-options { display:flex; flex-direction:column; gap:8px; width:100%; }
.snk-menu-option {
    display:flex; align-items:center; gap:14px; padding:14px 18px;
    background:rgba(255,255,255,0.02); border:1px solid var(--snk-border);
    cursor:pointer; transition:all .2s ease;
}
.snk-menu-option:hover,.snk-menu-option.selected {
    background:rgba(0,204,255,0.06); border-color:var(--snk-neon-cyan);
    box-shadow:0 0 12px rgba(0,204,255,0.15),inset 0 0 20px rgba(0,204,255,0.03);
}
.snk-menu-option.selected .snk-option-label { color:var(--snk-neon-cyan); text-shadow:0 0 6px rgba(0,204,255,0.4); }

.snk-difficulty-option:hover,.snk-difficulty-option.selected {
    border-color:var(--diff-color,var(--snk-neon-cyan));
    box-shadow:0 0 12px color-mix(in srgb,var(--diff-color,cyan) 30%,transparent);
}
.snk-difficulty-option.selected .snk-option-label { color:var(--diff-color,var(--snk-neon-cyan)); }

.snk-option-icon { font-size:16px; color:var(--snk-neon-cyan); width:24px; text-align:center; }
.snk-option-label { font-size:11px; color:var(--snk-text); letter-spacing:1px; }
.snk-option-desc { font-size:7px; color:var(--snk-dim); margin-top:4px; letter-spacing:.5px; }
.snk-option-arrow { margin-left:auto; font-size:12px; color:var(--snk-neon-cyan); width:16px; text-align:center; }
.snk-menu-footer-hint { font-size:7px; color:var(--snk-dim); letter-spacing:1px; margin-top:8px; }

/* ═══════════════ GAME BOARD ═══════════════ */
.snk-game { display:flex; flex-direction:column; align-items:center; gap:8px; width:100%; height:100%; }

.snk-hud {
    display:flex; align-items:center; justify-content:space-between; width:100%;
    padding:0 8px; min-height:32px;
}
.snk-hud-score { font-size:10px; color:var(--snk-neon-green); letter-spacing:1px; }
.snk-hud-right { display:flex; gap:6px; }

.snk-player-labels { display:flex; gap:16px; font-size:8px; }
.snk-p1-label { color:var(--snk-neon-green); }
.snk-p2-label { color:var(--snk-neon-cyan); }
.snk-ai-label { color:var(--snk-neon-red); }

.snk-sc-p1 { color:var(--snk-neon-green); }
.snk-sc-p2 { color:var(--snk-neon-red); }
.snk-sc-sep { color:var(--snk-dim); margin:0 4px; }

.snk-board-wrap {
    position:relative; flex:1; display:flex; align-items:center; justify-content:center;
    width:100%; overflow:hidden;
}

#snk-canvas { image-rendering:pixelated; image-rendering:crisp-edges; }

/* ── PAUSE OVERLAY ── */
.snk-pause-overlay {
    position:absolute; inset:0; z-index:50;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    background:rgba(0,0,0,0.75); gap:12px;
}
.snk-pause-text { font-size:18px; color:var(--snk-neon-yellow); letter-spacing:4px; text-shadow:0 0 12px rgba(255,238,0,0.6); }
.snk-pause-sub { font-size:7px; color:var(--snk-dim); letter-spacing:1px; }

/* ═══════════════ RESULT ═══════════════ */
.snk-result { display:flex; flex-direction:column; align-items:center; gap:16px; position:relative; width:100%; max-width:420px; }
.snk-particle-canvas { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:0; }

.snk-result-title {
    font-size:16px; letter-spacing:3px; text-align:center; z-index:1;
    animation:snk-result-pulse 1.5s ease-in-out infinite alternate;
}
.snk-result-single { color:var(--snk-neon-green); text-shadow:0 0 12px rgba(0,255,136,0.6); }
.snk-result-win    { color:var(--snk-neon-green); text-shadow:0 0 12px rgba(0,255,136,0.6); }
.snk-result-lose   { color:var(--snk-neon-red);   text-shadow:0 0 12px rgba(255,51,85,0.6); }
.snk-result-draw   { color:var(--snk-neon-yellow);text-shadow:0 0 12px rgba(255,238,0,0.6); }
@keyframes snk-result-pulse { 0%{filter:brightness(1)} 100%{filter:brightness(1.3)} }

.snk-result-star { display:inline-block; margin:0 6px; animation:snk-star-spin 2s linear infinite; }
@keyframes snk-star-spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }

.snk-result-subtitle { font-size:7px; color:var(--snk-dim); letter-spacing:1px; text-align:center; z-index:1; }

.snk-result-scores { display:flex; gap:16px; z-index:1; }
.snk-rs-item { text-align:center; padding:8px 14px; border:1px solid var(--snk-border); min-width:80px; }
.snk-rs-label { font-size:7px; color:var(--snk-dim); margin-bottom:4px; letter-spacing:1px; }
.snk-rs-value { font-size:18px; }
.snk-rs-p1 .snk-rs-value { color:var(--snk-neon-green); }
.snk-rs-p2 .snk-rs-value { color:var(--snk-neon-red); }

.snk-result-actions { display:flex; flex-direction:column; gap:8px; width:100%; max-width:280px; z-index:1; }
.snk-result-btn { width:100%; padding:10px 16px; font-size:9px; }

/* ═══════════════ FOOTER ═══════════════ */
.snk-footer {
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 16px; background:var(--snk-panel);
    border-top:2px solid var(--snk-border); min-height:36px; z-index:10;
}
.snk-score-display { font-size:8px; letter-spacing:1px; }
.snk-score-hi { color:var(--snk-neon-yellow); }
.snk-controls-hint { font-size:7px; color:var(--snk-dim); letter-spacing:.5px; text-align:center; }
.snk-status-led {
    width:6px; height:6px; border-radius:50%;
    background:var(--snk-neon-cyan); box-shadow:0 0 6px rgba(0,204,255,0.6);
    animation:snk-led-pulse 2s ease-in-out infinite;
}
@keyframes snk-led-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

/* ═══════════════ RESPONSIVE ═══════════════ */
@media (max-width:500px) {
    .snk-logo { font-size:10px; }
    .snk-menu-option { padding:10px 12px; }
    .snk-option-label { font-size:9px; }
    .snk-result-title { font-size:12px; }
}
@media (max-height:500px) {
    .snk-hud { min-height:24px; }
    .snk-result-scores { gap:8px; }
    .snk-rs-item { padding:4px 8px; min-width:60px; }
}
`; }
}

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnakeUI };
}
