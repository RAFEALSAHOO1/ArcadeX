// ═══════════════════════════════════════════════════════════════════
// ARCADE X - BASE GAME CLASS
// "Strict interface for all games to ensure consistency"
// All games MUST extend this class
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class BaseGame {
    constructor(dependencies) {
        // Backward compatibility for existing games
        if (dependencies instanceof GameSceneManager) {
            this.gsm = dependencies;
            this.audio = dependencies?.audio || null;
            this.engine = dependencies?.engine || null;
            this.input = dependencies?.input || null;
            this.renderer = dependencies?.renderer || null;
        } else {
            // New dependency injection pattern
            this.gsm = dependencies?.gsm || null;
            this.audio = dependencies?.audio || null;
            this.engine = dependencies?.engine || null;
            this.input = dependencies?.input || null;
            this.renderer = dependencies?.renderer || null;
        }
        
        // Game state
        this.isInitialized = false;
        this.isDestroyed = false;
        
        // Bind base methods
        this.destroy = this.destroy.bind(this);
    }
    
    /**
     * Get render mode for this game
     * @returns {string} "dom" or "canvas"
     * @override
     */
    getRenderMode() {
        return "dom"; // Default to DOM
    }

    /**
     * Initialize the game. Called when game is loaded.
     * @param {string|object} data - Game mode or configuration data
     * @override
     */
    init(data) {
        this.isInitialized = true;
        console.log(`${this.constructor.name}: Initialized`);
    }

    /**
     * Update game logic. Called every frame.
     * @param {number} dt - Delta time in seconds (1/60 ~ 0.01666)
     * @override
     */
    update(dt) {
        if (!this.isInitialized || this.isDestroyed) return;
    }

    /**
     * Render game visuals. Called every frame after update.
     * @param {number} dt - Delta time in seconds
     * @override
     */
    render(dt) {
        if (!this.isInitialized || this.isDestroyed) return;
    }

    /**
     * Handle input. Called every frame.
     * @param {InputSystem} input - Input system instance
     * @override
     */
    handleInput(input) {
        if (!this.isInitialized || this.isDestroyed) return;
    }

    /**
     * Clean up game resources. Called when game is exited.
     * Must remove all event listeners, timers, and DOM elements.
     * @override
     */
    destroy() {
        this.isDestroyed = true;
        this.isInitialized = false;
        console.log(`${this.constructor.name}: Destroyed`);
    }

    /**
     * Check if game is ready to run
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized && !this.isDestroyed;
    }
}

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaseGame };
}
