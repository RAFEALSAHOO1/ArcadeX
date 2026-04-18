// ════════════════════════════════════════════════════════════════════
// ARCADE X - GAME SCENE MANAGER
// "Handles game launching and scene transitions to games"
// NOTE: This class is now deprecated and replaced by the core SceneManager
// The actual scene management is handled by GameScene in script.js
// This file is kept for backward compatibility but should not be used.
// ═══════════════════════════════════════════════════════════════════

class GameSceneManager {
    constructor(audio, engine, input, renderer, sceneManager, stateManager) {
        this.audio = audio;
        this.engine = engine;
        this.input = input;
        this.renderer = renderer;
        this.sceneManager = sceneManager;
        this.stateManager = stateManager;
        this.currentGame = null;
        this.gameId = null;

        // Game scene container
        this.gameScene = null;

        // Bind methods
        this._handleGameEnd = this._handleGameEnd.bind(this);
    }

    // ── INITIALIZATION ──
    init() {
        this.gameScene = document.getElementById('game-scene');
        if (!this.gameScene) {
            console.error('GameSceneManager: #game-scene not found');
            return;
        }

        // Set up engine callbacks for game updates/rendering
        this.engine.onUpdate = (dt) => this._updateGame(dt);
        this.engine.onRender = (dt) => this._renderGame(dt);

        console.log('Game Scene Manager initialized');
    }

    // ── GAME LAUNCHING ──
    launchGame(game) {
        console.log(`Launching game: ${game.name} (${game.id})`);

        // Stop any existing game
        this.stopCurrentGame();

        let gameInstance = null;
        
        // Get game class from registry
        const gameConfig = getGameConfig(game.id);
        const GameClass = getGameClass(game.id);
        
        // Game validation
        if (!GameClass) {
            console.error(`No game class registered for ID: ${game.id}`);
            return false;
        }
        
        // Validate game implements required interface
        const requiredMethods = ['init', 'update', 'render', 'destroy'];
        const missingMethods = requiredMethods.filter(method => 
            !(GameClass.prototype && typeof GameClass.prototype[method] === 'function')
        );
        
        if (missingMethods.length > 0) {
            console.error(`Game ${game.id} missing required methods: ${missingMethods.join(', ')}`);
            return false;
        }

        try {
            // Show loading screen
            if (window.arcadeSystem && window.arcadeSystem.arcadeIntro) {
                window.arcadeSystem.arcadeIntro.showLoading('game-loading');
            }
            
            // Inject all core systems into game
            const gameDependencies = {
                audio: this.audio,
                engine: this.engine,
                input: this.input,
                renderer: this.renderer,
                sceneManager: this.sceneManager,
                gsm: this
            };
            
            gameInstance = new GameClass(gameDependencies);
            
            // Verify render mode
            const renderMode = gameInstance.getRenderMode ? gameInstance.getRenderMode() : 'dom';
            console.log(`Game ${game.id} using render mode: ${renderMode}`);
            
            gameInstance.init('single');
            
            if (!gameInstance.isReady()) {
                throw new Error('Game failed to initialize properly');
            }
            
            // Hide loading screen after game is ready
            setTimeout(() => {
                if (window.arcadeSystem && window.arcadeSystem.arcadeIntro) {
                    window.arcadeSystem.arcadeIntro.hideLoading();
                }
            }, 500 + Math.random() * 300);
            
        } catch (e) {
            console.error(`Failed to initialize game ${game.id}:`, e);
            if (window.arcadeSystem && window.arcadeSystem.arcadeIntro) {
                window.arcadeSystem.arcadeIntro.hideLoading();
            }
            this.stopCurrentGame();
            return false;
        }

        if (!gameInstance) {
            console.error('Failed to create game instance');
            return false;
        }

        this.currentGame = gameInstance;
        this.gameId = game.id;

        // Show game scene
        this.showGameScene();

        // Start the engine loop (not individual game loop)
        this.engine.start();

        // Play launch sound
        if (this.audio) {
            this.audio.playStartSound();
        }

        return true;
    }

    // ── GAME MODE SELECTION ──
    launchGameWithMode(game, mode) {
        // Stop any existing game
        this.stopCurrentGame();

        let gameInstance = null;
        
        // Get game class from registry
        const gameConfig = getGameConfig(game.id);
        const GameClass = getGameClass(game.id);
        
        // Game validation
        if (!GameClass) {
            console.error(`No game class registered for ID: ${game.id}`);
            return false;
        }
        
        // Validate game implements required interface
        const requiredMethods = ['init', 'update', 'render', 'destroy'];
        const missingMethods = requiredMethods.filter(method => 
            !(GameClass.prototype && typeof GameClass.prototype[method] === 'function')
        );
        
        if (missingMethods.length > 0) {
            console.error(`Game ${game.id} missing required methods: ${missingMethods.join(', ')}`);
            return false;
        }

        try {
            // Show loading screen
            if (window.arcadeSystem && window.arcadeSystem.arcadeIntro) {
                window.arcadeSystem.arcadeIntro.showLoading('game-loading');
            }
            
            // Inject all core systems into game
            const gameDependencies = {
                audio: this.audio,
                engine: this.engine,
                input: this.input,
                renderer: this.renderer,
                sceneManager: this.sceneManager,
                gsm: this
            };
            
            gameInstance = new GameClass(gameDependencies);
            
            let gameMode = 'single';
            if (mode === 'AI') gameMode = 'ai-medium';
            else if (mode === 'MULTI') gameMode = 'multi';
            
            gameInstance.init(gameMode);
            
            if (!gameInstance.isReady()) {
                throw new Error('Game failed to initialize properly');
            }
            
            // Hide loading screen after game is ready
            setTimeout(() => {
                if (window.arcadeSystem && window.arcadeSystem.arcadeIntro) {
                    window.arcadeSystem.arcadeIntro.hideLoading();
                }
            }, 500 + Math.random() * 300);
            
        } catch (e) {
            console.error(`Failed to initialize game ${game.id}:`, e);
            if (window.arcadeSystem && window.arcadeSystem.arcadeIntro) {
                window.arcadeSystem.arcadeIntro.hideLoading();
            }
            this.stopCurrentGame();
            return false;
        }

        if (!gameInstance) {
            console.error('Failed to create game instance');
            return false;
        }

        this.currentGame = gameInstance;
        this.gameId = game.id;

        this.showGameScene();
        this._startGameLoop();

        return true;
    }

    // Note: Game loop is now handled by the main engine.js
// No internal RAF loop needed here

    // ── SCENE MANAGEMENT ──
    showGameScene() {
        const gameScene = document.getElementById('game-scene');
        const lobbyScene = document.getElementById('lobby-scene');
        const landingScene = document.getElementById('cabinet-frame');

        if (gameScene) {
            gameScene.style.display = 'block';
            gameScene.classList.add('active');
        }

        // Hide other scenes
        if (lobbyScene) {
            lobbyScene.style.display = 'none';
            lobbyScene.classList.remove('active');
        }
        if (landingScene) {
            landingScene.style.display = 'none';
        }
    }

    // ── GAME UPDATE/RENDER DELEGATION ──
    _updateGame(dt) {
        if (this.currentGame && this.currentGame.update && this.currentGame.isReady()) {
            try {
                this.currentGame.update(dt);
            } catch (e) {
                console.error(`Game update error [${this.gameId}]:`, e);
                // Attempt graceful recovery
                this._handleGameError('update', e);
            }
        }
    }

    _renderGame(dt) {
        if (this.currentGame && this.currentGame.render && this.currentGame.isReady()) {
            try {
                this.currentGame.render(dt);
            } catch (e) {
                console.error(`Game render error [${this.gameId}]:`, e);
                // Attempt graceful recovery
                this._handleGameError('render', e);
            }
        }
    }
    
    // ── ERROR HANDLING ──
    _handleGameError(type, error) {
        console.warn(`Game ${this.gameId} failed during ${type}, attempting recovery...`);
        
        // Try to cleanly stop the game
        try {
            if (this.currentGame && this.currentGame.destroy) {
                this.currentGame.destroy();
            }
        } catch (destroyError) {
            console.error('Game cleanup failed:', destroyError);
        }
        
        // Reset state
        this.currentGame = null;
        this.gameId = null;
    }

    hideGameScene() {
        const gameScene = document.getElementById('game-scene');
        if (gameScene) {
            gameScene.style.display = 'none';
            gameScene.classList.remove('active');
            gameScene.innerHTML = ''; // Clean up DOM
        }
    }

    backToLobby() {
        // Stop current game
        this.stopCurrentGame();

        // Hide game scene
        this.hideGameScene();

        // Show lobby (handled by the main AppSceneManager)
        const event = new CustomEvent('backToLobbyFromGame');
        document.dispatchEvent(event);
    }

    // ── GAME LIFECYCLE ──
    stopCurrentGame() {
        // Stop the engine loop
        if (this.engine) {
            this.engine.stop();
        }

        if (this.currentGame) {
            try {
                if (this.currentGame.destroy) {
                    this.currentGame.destroy();
                }
                
                // Verify cleanup - check for orphaned timers/listeners
                if (this.currentGame._loopId) {
                    cancelAnimationFrame(this.currentGame._loopId);
                    console.warn('Game had orphaned animation frame - cleaned up');
                }
                
                if (this.currentGame._timers) {
                    this.currentGame._timers.forEach(clearTimeout);
                }
            } catch (e) {
                console.error('Error during game cleanup:', e);
            }
            
            this.currentGame = null;
            this.gameId = null;
            
            // Clear game scene DOM to prevent memory leaks
            const gameScene = document.getElementById('game-scene');
            if (gameScene) {
                gameScene.innerHTML = '';
            }
            
            // Force garbage collection hint
            if (window.gc) {
                try { window.gc(); } catch(e) {}
            }
        }

        // Clean up engine components if they were used
        if (this.input) {
            this.input.destroy();
            this.input = null;
        }

        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }

        if (this.sceneManager) {
            this.sceneManager.clearScenes();
            this.sceneManager = null;
        }

        this.stateManager = null;
        
        console.log('Game stopped and resources cleaned up');
    }

    // ── EVENT HANDLING ──
    _handleGameEnd(gameResult) {
        console.log('Game ended:', gameResult);
    }

    // ── UTILITIES ──
    isGameRunning() {
        return !!this.currentGame;
    }

    getCurrentGame() {
        return this.currentGame;
    }

    // ── CLEANUP ──
    destroy() {
        this.stopCurrentGame();
        this.hideGameScene();
    }
}