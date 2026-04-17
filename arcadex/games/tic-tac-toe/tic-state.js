// ═══════════════════════════════════════════════════════════════════
// ARCADE X - TIC TAC TOE STATE MANAGER
// "Centralized state management for all game data"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

// ── GAME STATES ──
const TIC_STATES = {
    INIT: 'INIT',
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    RESULT: 'RESULT',
    PAUSED: 'PAUSED'
};

// ── GAME MODES ──
const TIC_MODES = {
    SINGLE: 'single',
    AI_EASY: 'ai-easy',
    AI_MEDIUM: 'ai-medium',
    AI_HARD: 'ai-hard',
    MULTI: 'multi'
};

// ── MENU SCREENS ──
const MENU_SCREENS = {
    MODE_SELECT: 'mode-select',
    DIFFICULTY_SELECT: 'difficulty-select'
};

class TicTacToeState {
    constructor() {
        // ── Core game state ──
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.mode = TIC_MODES.SINGLE;
        this.difficulty = 'MEDIUM';
        this.gameState = TIC_STATES.INIT;

        // ── Menu state ──
        this.menuScreen = MENU_SCREENS.MODE_SELECT;
        this.menuSelectedIndex = 0;
        this.menuOptions = [];

        // ── Match data ──
        this.winner = null;         // null | { player: 'X'|'O', cells: [0,1,2] }
        this.isDraw = false;
        this.moves = 0;

        // ── Score tracking ──
        this.scores = { X: 0, O: 0, draws: 0 };

        // ── AI state ──
        this.aiThinking = false;
        this.aiMoveDelay = 600;     // ms delay before AI plays
        this.aiMoveTimer = 0;

        // ── Animation timers ──
        this.resultAnimTime = 0;
        this.transitionTime = 0;
        this.isTransitioning = false;
        this.transitionCallback = null;

        // ── Cell animation tracking ──
        this.cellAnimations = {};    // { cellIndex: { time, type } }
        this.winLineAlpha = 0;

        // ── Keyboard navigation (for menus + grid) ──
        this.cursorCell = 4;         // Center by default
        this.usingKeyboard = false;

        // ── Listeners ──
        this._listeners = {};
    }

    // ── EVENT SYSTEM ──
    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
    }

    off(event, callback) {
        if (this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(cb => cb(data));
        }
    }

    // ── STATE TRANSITIONS ──
    changeGameState(newState) {
        const oldState = this.gameState;
        this.gameState = newState;
        this.emit('stateChange', { from: oldState, to: newState });
    }

    transitionTo(newState, delay = 400) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.transitionTime = 0;
        this.transitionCallback = () => {
            this.changeGameState(newState);
            this.isTransitioning = false;
        };
        this.transitionDuration = delay;
    }

    // ── BOARD OPERATIONS ──
    resetBoard() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.winner = null;
        this.isDraw = false;
        this.moves = 0;
        this.aiThinking = false;
        this.aiMoveTimer = 0;
        this.cellAnimations = {};
        this.winLineAlpha = 0;
        this.resultAnimTime = 0;
        this.cursorCell = 4;
    }

    placeSymbol(cellIndex) {
        if (this.board[cellIndex] !== '' || this.gameState !== TIC_STATES.PLAYING) {
            return false;
        }
        if (this.aiThinking && this.currentPlayer !== 'O') {
            return false;
        }

        this.board[cellIndex] = this.currentPlayer;
        this.moves++;

        // Track cell animation
        this.cellAnimations[cellIndex] = {
            time: 0,
            type: 'place',
            player: this.currentPlayer
        };

        this.emit('move', { cell: cellIndex, player: this.currentPlayer });
        return true;
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    // ── WIN / DRAW DETECTION ──
    checkWin() {
        const WIN_PATTERNS = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
            [0, 4, 8], [2, 4, 6]              // diags
        ];

        for (const pattern of WIN_PATTERNS) {
            const [a, b, c] = pattern;
            if (this.board[a] !== '' &&
                this.board[a] === this.board[b] &&
                this.board[a] === this.board[c]) {
                return { player: this.board[a], cells: pattern };
            }
        }
        return null;
    }

    checkDraw() {
        return this.moves >= 9 && !this.winner;
    }

    // ── MODE HELPERS ──
    isAIMode() {
        return this.mode === TIC_MODES.AI_EASY ||
               this.mode === TIC_MODES.AI_MEDIUM ||
               this.mode === TIC_MODES.AI_HARD;
    }

    isAITurn() {
        return this.isAIMode() && this.currentPlayer === 'O';
    }

    getModeLabel() {
        switch (this.mode) {
            case TIC_MODES.SINGLE: return 'SINGLE PLAYER';
            case TIC_MODES.AI_EASY: return 'VS AI // EASY';
            case TIC_MODES.AI_MEDIUM: return 'VS AI // MEDIUM';
            case TIC_MODES.AI_HARD: return 'VS AI // HARD';
            case TIC_MODES.MULTI: return 'LOCAL MULTIPLAYER';
            default: return 'UNKNOWN';
        }
    }

    getDifficultyFromMode() {
        switch (this.mode) {
            case TIC_MODES.AI_EASY: return 'EASY';
            case TIC_MODES.AI_MEDIUM: return 'MEDIUM';
            case TIC_MODES.AI_HARD: return 'HARD';
            default: return 'NONE';
        }
    }

    // ── SERIALIZATION ──
    getSnapshot() {
        return {
            board: [...this.board],
            currentPlayer: this.currentPlayer,
            mode: this.mode,
            difficulty: this.getDifficultyFromMode(),
            gameState: this.gameState,
            winner: this.winner,
            isDraw: this.isDraw,
            moves: this.moves,
            scores: { ...this.scores }
        };
    }

    // ── CLEANUP ──
    destroy() {
        this._listeners = {};
    }
}

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TicTacToeState, TIC_STATES, TIC_MODES, MENU_SCREENS };
}
