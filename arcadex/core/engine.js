// ═══════════════════════════════════════════════════════════════════
// ARCADE X GAME ENGINE - CORE LOOP SYSTEM
// "requestAnimationFrame game loop with delta time"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class GameEngine {
    constructor(canvas, targetFPS = 60) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.targetFPS = targetFPS;
        this.frameInterval = 1000 / targetFPS;

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.accumulatedTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateTime = 0;

        // Game loop
        this.isRunning = false;
        this.animationFrameId = null;

        // Callbacks
        this.onUpdate = null;
        this.onRender = null;
        this.onInit = null;

        // Performance monitoring
        this.frameTimes = [];
        this.maxFrameTimeHistory = 60; // 1 second at 60fps
        
        // FPS guard
        this.lowFPSCount = 0;
        this.lastWarningTime = 0;
        this.warningCooldown = 10000; // 10s between FPS warnings

        // Bind methods
        this._gameLoop = this._gameLoop.bind(this);
    }

    // ── INITIALIZATION ──
    init() {
        if (this.onInit) {
            this.onInit();
        }

        // Reset timing
        this.lastTime = performance.now();
        this.deltaTime = 0;
        this.accumulatedTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateTime = 0;
        this.frameTimes = [];
    }

    // ── GAME LOOP ──
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this._gameLoop);
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    _gameLoop(currentTime) {
        if (!this.isRunning) return;

        // Calculate delta time
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap delta time to prevent spiral of death
        if (this.deltaTime > this.frameInterval * 2) {
            this.deltaTime = this.frameInterval * 2;
        }

        // Accumulate time for fixed timestep
        this.accumulatedTime += this.deltaTime;

        // Update FPS counter
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsUpdateTime));
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
            
            // FPS guard - warn on consistent low FPS
            if (this.fps < 45) {
                this.lowFPSCount++;
                if (this.lowFPSCount >= 3 && currentTime - this.lastWarningTime > this.warningCooldown) {
                    console.warn(`PERFORMANCE WARNING: Low FPS detected (${this.fps} FPS). Consider reducing effects.`);
                    this.lastWarningTime = currentTime;
                    this.lowFPSCount = 0;
                }
            } else {
                this.lowFPSCount = 0;
            }
        }

        // Track frame times for performance monitoring
        this.frameTimes.push(this.deltaTime);
        if (this.frameTimes.length > this.maxFrameTimeHistory) {
            this.frameTimes.shift();
        }

        // Update input state
        if (this.input) {
            this.input.update();
        }

        // Update game logic (fixed timestep)
        while (this.accumulatedTime >= this.frameInterval) {
            if (this.onUpdate) {
                try {
                    this.onUpdate(this.frameInterval / 1000); // Convert to seconds
                } catch (e) {
                    console.error('Engine update error:', e);
                    // Continue execution - don't let one bad update crash everything
                }
            }
            this.accumulatedTime -= this.frameInterval;
        }

        // Render
        if (this.onRender) {
            try {
                this.onRender(this.deltaTime / 1000); // Convert to seconds
            } catch (e) {
                console.error('Engine render error:', e);
                // Continue execution - don't let one bad frame crash everything
            }
        }

        // Continue loop
        this.animationFrameId = requestAnimationFrame(this._gameLoop);
    }

    // ── PERFORMANCE MONITORING ──
    getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 0;
        return this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
    }

    getFrameTimeVariance() {
        if (this.frameTimes.length < 2) return 0;
        const avg = this.getAverageFrameTime();
        const variance = this.frameTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / this.frameTimes.length;
        return Math.sqrt(variance);
    }

    // ── UTILITIES ──
    setTargetFPS(fps) {
        this.targetFPS = fps;
        this.frameInterval = 1000 / fps;
    }

    getFPS() {
        return this.fps;
    }

    getDeltaTime() {
        return this.deltaTime / 1000; // Return in seconds
    }

    // ── CLEANUP ──
    destroy() {
        this.stop();
        this.onUpdate = null;
        this.onRender = null;
        this.onInit = null;
        this.frameTimes = [];
    }
}