// ═══════════════════════════════════════════════════════════════════
// ARCADE X - GAME CONSTANTS
// "Centralized configuration for consistent behavior across all games"
// All magic numbers belong here, not in individual games
// ═══════════════════════════════════════════════════════════════════

const ARCADE_CONSTANTS = {
    // ── ENGINE SETTINGS ──
    ENGINE: {
        TARGET_FPS: 60,
        FRAME_INTERVAL: 1000 / 60,
        MAX_DELTA_TIME: 0.033, // Cap at ~30 FPS delta to prevent spiral of death
        LOW_FPS_THRESHOLD: 45,
        LOW_FPS_CONSECUTIVE_WARNINGS: 3
    },

    // ── INPUT SETTINGS ──
    INPUT: {
        DEBOUNCE_MS: 50,
        DOUBLE_CLICK_THRESHOLD: 300,
        HOLD_THRESHOLD: 500
    },

    // ── GAME TIMINGS ──
    GAME: {
        // AI delays
        AI_MOVE_DELAY_TIC: 600,       // ms before AI plays in TicTacToe
        AI_MOVE_DELAY_SNAKE: 150,     // ms per tick for Snake AI
        AI_MOVE_DELAY_PONG: 100,      // ms for Pong AI
        
        // Result screens
        WIN_DISPLAY_DELAY: 1800,      // ms to admire win animation
        DRAW_DISPLAY_DELAY: 1200,     // ms to display draw result
        GAME_OVER_DELAY: 1200,        // ms before game over screen
        
        // Input cooldowns
        INPUT_COOLDOWN_TIC: 150,      // ms between moves in TicTacToe
        INPUT_COOLDOWN_SNAKE: 80,     // ms between moves in Snake
        
        // Animation durations
        CELL_PLACE_ANIMATION: 250,    // ms for TicTacToe cell pop
        WIN_LINE_ANIMATION: 400,      // ms for TicTacToe win line
        RESULT_PARTICLES: 2000,       // ms for particle effects
        SCENE_TRANSITION: 800,        // ms total transition time
        GLITCH_EFFECT: 300            // ms CRT glitch effect
    },

    // ── SNAKE GAME ──
    SNAKE: {
        GRID_SIZE: 20,               // Default grid size 20x20
        INITIAL_LENGTH: 3,           // Starting snake length
        SPEED_START: 150,            // ms per tick (easy)
        SPEED_MIN: 60,               // Fastest possible
        SPEED_DECREMENT: 3,          // ms faster per food eaten
        FOOD_SCORE: 10,              // Points per food
        HIGH_SCORE_INIT: 0           // Initial high score
    },

    // ── TIC TAC TOE ──
    TIC_TAC_TOE: {
        BOARD_SIZE: 3,
        CELL_COUNT: 9,
        WIN_PATTERNS: [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]              // Diagonals
        ]
    },

    // ── AUDIO VOLUMES ──
    AUDIO: {
        MASTER: 0.5,
        SFX: 0.6,
        MUSIC: 0.3,
        BUTTON: 0.4,
        COIN: 0.7
    },

    // ── UI SETTINGS ──
    UI: {
        FONT_SIZE_SMALL: 8,
        FONT_SIZE_MEDIUM: 10,
        FONT_SIZE_LARGE: 14,
        FONT_SIZE_HUGE: 20,
        NEON_ALPHA: 0.4,
        NEON_GLOW: 8
    },

    // ── PERFORMANCE GUARD ──
    PERFORMANCE: {
        LOW_MEMORY_THRESHOLD: 4,     // GB device memory
        PARTICLE_LIMIT: 30,          // Max particles per effect
        MAX_FPS_DIPS_IN_ROW: 3
    },

    // ── COLOR PALETTE (UNIFORM ACROSS ALL GAMES) ──
    COLORS: {
        NEON_GREEN: '#00ff88',
        NEON_RED: '#ff3355',
        NEON_YELLOW: '#ffee00',
        NEON_CYAN: '#00ccff',
        NEON_PURPLE: '#cc44ff',
        NEON_ORANGE: '#ff6400',
        DIM: '#333344',
        TEXT: '#aabbcc',
        BG: '#0a0a0f',
        PANEL: '#0f0f18',
        BORDER: '#1a1a2e'
    }
};

// Freeze constants to prevent modification
Object.freeze(ARCADE_CONSTANTS);
Object.freeze(ARCADE_CONSTANTS.ENGINE);
Object.freeze(ARCADE_CONSTANTS.INPUT);
Object.freeze(ARCADE_CONSTANTS.GAME);
Object.freeze(ARCADE_CONSTANTS.SNAKE);
Object.freeze(ARCADE_CONSTANTS.TIC_TAC_TOE);
Object.freeze(ARCADE_CONSTANTS.AUDIO);
Object.freeze(ARCADE_CONSTANTS.UI);
Object.freeze(ARCADE_CONSTANTS.PERFORMANCE);
Object.freeze(ARCADE_CONSTANTS.COLORS);

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ARCADE_CONSTANTS };
}
