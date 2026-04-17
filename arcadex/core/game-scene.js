// ═══════════════════════════════════════════════════════════════════
// ARCADE X - GAME SCENE MANAGER
// "Handles game launching and scene transitions to games"
// Supports both canvas-based and DOM-based games.
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class GameSceneManager {
    constructor(audio) {
        this.audio = audio;
        this.currentGame = null;
        this.gameId = null;

        // Engine components (for canvas-based games)
        this.engine = null;
        this.renderer = null;
        this.input = null;
        this.stateManager = null;
        this.sceneManager = null;

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

        console.log('Game Scene Manager initialized');
    }

    // ── GAME LAUNCHING ──
    launchGame(game) {
        console.log(`Launching game: ${game.name} (${game.id})`);

        // Stop any existing game
        this.stopCurrentGame();

        let gameInstance = null;

        switch (game.id) {
            case 'tic':
                gameInstance = new TicTacToeGame(this);
                gameInstance.init('single');
                break;

            case 'snake':
                gameInstance = new SnakeGame(this);
                gameInstance.init('single');
                break;

            default:
                console.error(`Unknown game ID: ${game.id}`);
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

        // Start the game loop for update/render
        this._startGameLoop();

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

        switch (game.id) {
            case 'tic':
                gameInstance = new TicTacToeGame(this);
                {
                    let gameMode = 'single';
                    if (mode === 'AI') gameMode = 'ai-medium';
                    else if (mode === 'MULTI') gameMode = 'multi';
                    gameInstance.init(gameMode);
                }
                break;

            case 'snake':
                gameInstance = new SnakeGame(this);
                {
                    let gameMode = 'single';
                    if (mode === 'AI') gameMode = 'ai-medium';
                    else if (mode === 'MULTI') gameMode = 'multi';
                    gameInstance.init(gameMode);
                }
                break;

            default:
                console.error(`Unknown game ID: ${game.id}`);
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

    // ── GAME LOOP (for DOM-based games that need update/render ticks) ──
    _startGameLoop() {
        if (this._loopId) return;

        let lastTime = performance.now();

        const loop = (now) => {
            if (!this.currentGame) return;

            const dt = Math.min((now - lastTime) / 1000, 0.033); // cap at ~30fps delta
            lastTime = now;

            // Call game update and render
            if (this.currentGame.update) {
                this.currentGame.update(dt);
            }
            if (this.currentGame.render) {
                this.currentGame.render(dt);
            }

            this._loopId = requestAnimationFrame(loop);
        };

        this._loopId = requestAnimationFrame(loop);
    }

    _stopGameLoop() {
        if (this._loopId) {
            cancelAnimationFrame(this._loopId);
            this._loopId = null;
        }
    }

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
        this._stopGameLoop();

        if (this.currentGame) {
            if (this.currentGame.destroy) {
                this.currentGame.destroy();
            }
            this.currentGame = null;
            this.gameId = null;
        }

        // Clean up engine components if they were used
        if (this.engine) {
            this.engine.stop();
            this.engine.destroy();
            this.engine = null;
        }

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