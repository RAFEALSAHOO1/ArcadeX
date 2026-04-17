// ═══════════════════════════════════════════════════════════════════
// ARCADE X — SNAKE STATE MANAGER
// Centralized state management for all Snake game data.
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

// ── GAME STATES ──
const SNAKE_STATES = {
    INIT:    'INIT',
    MENU:    'MENU',
    PLAYING: 'PLAYING',
    PAUSED:  'PAUSED',
    RESULT:  'RESULT'
};

// ── GAME MODES ──
const SNAKE_MODES = {
    SINGLE:    'single',
    AI_EASY:   'ai-easy',
    AI_MEDIUM: 'ai-medium',
    AI_HARD:   'ai-hard',
    MULTI:     'multi'
};

// ── MENU SCREENS ──
const SNAKE_MENU_SCREENS = {
    MODE_SELECT:       'mode-select',
    DIFFICULTY_SELECT: 'difficulty-select'
};

// ── DIRECTION VECTORS ──
const DIRS = {
    UP:    { x:  0, y: -1 },
    DOWN:  { x:  0, y:  1 },
    LEFT:  { x: -1, y:  0 },
    RIGHT: { x:  1, y:  0 }
};

// Prevents 180° reversal
const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

// ── SPEED PRESETS (ms per tick) ──
const SPEED_TABLE = {
    'ai-easy':   { start: 180, min: 90,  decrement: 3 },
    'ai-medium': { start: 150, min: 70,  decrement: 3 },
    'ai-hard':   { start: 130, min: 55,  decrement: 3 },
    'single':    { start: 150, min: 60,  decrement: 3 },
    'multi':     { start: 150, min: 70,  decrement: 3 }
};

// ════════════════════════════════════════════════════
//  SNAKE ENTITY — one per player / AI
// ════════════════════════════════════════════════════
class SnakeEntity {
    /**
     * @param {number} id       – 0 = player1, 1 = player2/AI
     * @param {object} headPos  – { x, y }
     * @param {string} dir      – 'UP'|'DOWN'|'LEFT'|'RIGHT'
     * @param {string} color    – neon color key
     */
    constructor(id, headPos, dir, color) {
        this.id = id;
        this.body = [{ ...headPos }];         // [head, ...tail]
        this.dir = dir;
        this.nextDir = dir;                    // buffered input
        this.color = color;
        this.alive = true;
        this.score = 0;
        this.growing = 0;                      // segments left to grow
    }

    get head() { return this.body[0]; }

    queueDirection(newDir) {
        if (OPPOSITE[newDir] === this.dir) return; // disallow reversal
        this.nextDir = newDir;
    }

    advance() {
        this.dir = this.nextDir;
        const d = DIRS[this.dir];
        const newHead = { x: this.head.x + d.x, y: this.head.y + d.y };
        this.body.unshift(newHead);
        if (this.growing > 0) {
            this.growing--;
        } else {
            this.body.pop();
        }
    }

    grow(amount = 1) {
        this.growing += amount;
    }

    occupies(x, y, skipHead = false) {
        const start = skipHead ? 1 : 0;
        for (let i = start; i < this.body.length; i++) {
            if (this.body[i].x === x && this.body[i].y === y) return true;
        }
        return false;
    }

    reset(headPos, dir) {
        this.body = [{ ...headPos }];
        this.dir = dir;
        this.nextDir = dir;
        this.alive = true;
        this.score = 0;
        this.growing = 2; // start with length 3
    }
}

// ════════════════════════════════════════════════════
//  MAIN SNAKE STATE CLASS
// ════════════════════════════════════════════════════
class SnakeState {
    constructor() {
        // ── Grid ──
        this.cols = 20;
        this.rows = 20;

        // ── Mode ──
        this.mode = SNAKE_MODES.SINGLE;
        this.gameState = SNAKE_STATES.INIT;

        // ── Menu ──
        this.menuScreen = SNAKE_MENU_SCREENS.MODE_SELECT;
        this.menuSelectedIndex = 0;
        this.menuOptions = [];

        // ── Snakes ──
        this.snakes = [];    // SnakeEntity[]

        // ── Food ──
        this.food = null;    // { x, y }
        this.foodAge = 0;    // for blink animation

        // ── Timing ──
        this.tickInterval = 150;   // ms between movement ticks
        this.tickTimer = 0;        // accumulator
        this.totalTicks = 0;

        // ── Results ──
        this.winner = null;        // null | SnakeEntity
        this.highScore = 0;

        // ── Scores across rounds ──
        this.roundScores = { p1: 0, p2: 0 };

        // ── Animations ──
        this.eatFlash = 0;         // remaining flash time
        this.deathEffect = 0;      // death animation timer
        this.resultAnimTime = 0;

        // ── Transition ──
        this.isTransitioning = false;
        this.transitionTime = 0;
        this.transitionDuration = 0;
        this.transitionCallback = null;

        // ── Listeners ──
        this._listeners = {};
    }

    // ════════ EVENT SYSTEM ════════
    on(event, cb)  { (this._listeners[event] ||= []).push(cb); }
    off(event, cb) { if (this._listeners[event]) this._listeners[event] = this._listeners[event].filter(c => c !== cb); }
    emit(event, data) { (this._listeners[event] || []).forEach(cb => cb(data)); }

    // ════════ STATE CHANGES ════════
    changeGameState(newState) {
        const old = this.gameState;
        this.gameState = newState;
        this.emit('stateChange', { from: old, to: newState });
    }

    // ════════ INITIALIZATION ════════
    initGame() {
        this.snakes = [];
        this.food = null;
        this.tickTimer = 0;
        this.totalTicks = 0;
        this.winner = null;
        this.eatFlash = 0;
        this.deathEffect = 0;
        this.resultAnimTime = 0;

        // Speed from mode
        const sp = SPEED_TABLE[this.mode] || SPEED_TABLE['single'];
        this.tickInterval = sp.start;

        // Create snakes
        if (this.mode === SNAKE_MODES.MULTI) {
            // P1 left side, P2 right side
            const s1 = new SnakeEntity(0, { x: 4,  y: Math.floor(this.rows / 2) }, 'RIGHT', 'green');
            const s2 = new SnakeEntity(1, { x: this.cols - 5, y: Math.floor(this.rows / 2) }, 'LEFT', 'cyan');
            s1.reset(s1.head, s1.dir);
            s2.reset(s2.head, s2.dir);
            this.snakes = [s1, s2];
        } else if (this.isAIMode()) {
            // P1 left, AI right
            const s1 = new SnakeEntity(0, { x: 4, y: Math.floor(this.rows / 2) }, 'RIGHT', 'green');
            const ai = new SnakeEntity(1, { x: this.cols - 5, y: Math.floor(this.rows / 2) }, 'LEFT', 'red');
            s1.reset(s1.head, s1.dir);
            ai.reset(ai.head, ai.dir);
            this.snakes = [s1, ai];
        } else {
            // Single player — center
            const s1 = new SnakeEntity(0, { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) }, 'RIGHT', 'green');
            s1.reset(s1.head, s1.dir);
            this.snakes = [s1];
        }

        // Spawn first food
        this.spawnFood();
    }

    // ════════ FOOD ════════
    spawnFood() {
        const occupied = new Set();
        for (const snake of this.snakes) {
            for (const seg of snake.body) {
                occupied.add(`${seg.x},${seg.y}`);
            }
        }

        const free = [];
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                if (!occupied.has(`${x},${y}`)) free.push({ x, y });
            }
        }

        if (free.length === 0) {
            this.food = null;
            return;
        }

        this.food = free[Math.floor(Math.random() * free.length)];
        this.foodAge = 0;
    }

    // ════════ TICK — CORE GAME STEP ════════
    tick() {
        this.totalTicks++;

        // Move all alive snakes
        for (const snake of this.snakes) {
            if (!snake.alive) continue;
            snake.advance();
        }

        // Collision detection (after all moved)
        for (const snake of this.snakes) {
            if (!snake.alive) continue;
            const h = snake.head;

            // Wall collision
            if (h.x < 0 || h.x >= this.cols || h.y < 0 || h.y >= this.rows) {
                snake.alive = false;
                continue;
            }

            // Self collision (skip head)
            if (snake.occupies(h.x, h.y, true)) {
                snake.alive = false;
                continue;
            }

            // Collision with other snakes
            for (const other of this.snakes) {
                if (other === snake) continue;
                if (other.occupies(h.x, h.y, false)) {
                    snake.alive = false;
                    break;
                }
            }
        }

        // Food eating
        for (const snake of this.snakes) {
            if (!snake.alive) continue;
            if (this.food && snake.head.x === this.food.x && snake.head.y === this.food.y) {
                snake.score += 10;
                snake.grow(1);
                this.eatFlash = 0.25; // seconds
                this.spawnFood();
                this.emit('eat', { snakeId: snake.id });

                // Speed up
                const sp = SPEED_TABLE[this.mode] || SPEED_TABLE['single'];
                this.tickInterval = Math.max(sp.min, this.tickInterval - sp.decrement);
            }
        }

        // Check game over
        const alive = this.snakes.filter(s => s.alive);
        if (this.snakes.length === 1 && alive.length === 0) {
            // Single player died
            this.emit('gameOver', { winner: null });
            return 'gameover';
        }
        if (this.snakes.length > 1) {
            if (alive.length <= 1) {
                // Determine winner primarily by SCORE. 
                // If it's a tie, the survivor wins.
                const p1 = this.snakes[0];
                const p2 = this.snakes[1];
                
                if (p1.score > p2.score) {
                    this.winner = p1;
                } else if (p2.score > p1.score) {
                    this.winner = p2;
                } else {
                    this.winner = alive.length === 1 ? alive[0] : null;
                }
                
                this.emit('gameOver', { winner: this.winner });
                return 'gameover';
            }
        }

        this.emit('tick', { totalTicks: this.totalTicks });
        return 'continue';
    }

    // ════════ MODE HELPERS ════════
    isAIMode() {
        return this.mode === SNAKE_MODES.AI_EASY ||
               this.mode === SNAKE_MODES.AI_MEDIUM ||
               this.mode === SNAKE_MODES.AI_HARD;
    }

    getModeLabel() {
        switch (this.mode) {
            case SNAKE_MODES.SINGLE:    return 'CLASSIC MODE';
            case SNAKE_MODES.AI_EASY:   return 'VS AI // EASY';
            case SNAKE_MODES.AI_MEDIUM: return 'VS AI // MEDIUM';
            case SNAKE_MODES.AI_HARD:   return 'VS AI // HARD';
            case SNAKE_MODES.MULTI:     return 'LOCAL MULTIPLAYER';
            default: return 'SNAKE';
        }
    }

    // ════════ SERIALIZATION ════════
    getSnapshot() {
        return {
            snakes: this.snakes.map(s => ({
                id: s.id, body: [...s.body], dir: s.dir,
                alive: s.alive, score: s.score, color: s.color
            })),
            food: this.food ? { ...this.food } : null,
            mode: this.mode,
            gameState: this.gameState,
            tickInterval: this.tickInterval,
            totalTicks: this.totalTicks
        };
    }

    // ════════ CLEANUP ════════
    destroy() { this._listeners = {}; }
}

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnakeState, SnakeEntity, SNAKE_STATES, SNAKE_MODES, SNAKE_MENU_SCREENS, DIRS, OPPOSITE, SPEED_TABLE };
}
