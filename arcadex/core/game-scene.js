// ═══════════════════════════════════════════════════════════════════
// ARCADE X - GAME SCENE MANAGER
// "Handles game launching and scene transitions to games"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class GameSceneManager {
    constructor(audio) {
        this.audio = audio;
        this.engine = null;
        this.renderer = null;
        this.input = null;
        this.stateManager = null;
        this.sceneManager = null;
        this.currentGame = null;
        this.gameCanvas = null;

        // Bind methods
        this._handleGameEnd = this._handleGameEnd.bind(this);
    }

    // ── INITIALIZATION ──
    init() {
        // Create game scene container
        const gameScene = document.getElementById('game-scene');
        if (!gameScene) return;

        gameScene.innerHTML = `
            <div id="game-container">
                <canvas id="game-canvas" width="800" height="600"></canvas>
                <div id="game-ui">
                    <button id="game-back-btn">◄ BACK TO LOBBY</button>
                </div>
            </div>
        `;

        // Get canvas and initialize engine
        this.gameCanvas = document.getElementById('game-canvas');
        if (!this.gameCanvas) return;

        // Initialize core engine components
        this.engine = new GameEngine(this.gameCanvas);
        this.renderer = new Renderer(this.gameCanvas);
        this.input = new InputManager(this.gameCanvas);
        this.stateManager = new StateManager();
        this.sceneManager = new SceneManager(this.engine, this.renderer, this.input, this.stateManager);

        // Set up engine callbacks
        this.engine.onUpdate = (deltaTime) => {
            this.sceneManager.update(deltaTime);
        };
        this.engine.onRender = (deltaTime) => {
            this.sceneManager.render(deltaTime);
        };
        this.engine.onInit = () => {
            // Engine initialized
        };

        // Bind UI events
        this._bindGameUIEvents();

        console.log('Game Scene Manager initialized');
    }

    // ── GAME LAUNCHING ──
    launchGame(game) {
        if (!this.engine || !this.sceneManager) {
            console.error('Game engine not initialized');
            return false;
        }

        console.log(`Launching game: ${game.name} (${game.id})`);

        // Stop any existing game
        this.stopCurrentGame();

        // Create game instance based on game ID
        let gameInstance = null;

        switch (game.id) {
            case 'tic':
                gameInstance = new TicTacToeGame(this);
                // For Tic Tac Toe, we need to determine the mode
                // Default to single player for now
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

        // Add game as a scene
        this.sceneManager.addScene(game.id, gameInstance);
        this.sceneManager.changeScene(game.id);
        this.currentGame = gameInstance;

        // Start the engine
        this.engine.start();

        // Show game scene
        this.showGameScene();

        // Play launch sound
        if (this.audio) {
            this.audio.playStartSound();
        }

        return true;
    }

    // ── GAME MODE SELECTION ──
    launchGameWithMode(game, mode) {
        if (!this.engine || !this.sceneManager) {
            console.error('Game engine not initialized');
            return false;
        }

        // Stop any existing game
        this.stopCurrentGame();

        // Create game instance
        let gameInstance = null;

        switch (game.id) {
            case 'tic':
                gameInstance = new TicTacToeGame(this);
                // Map mode to game mode
                let gameMode = 'single';
                if (mode === 'AI') gameMode = 'ai-medium'; // Default AI difficulty
                else if (mode === 'MULTI') gameMode = 'multi';
                gameInstance.init(gameMode);
                break;
            default:
                console.error(`Unknown game ID: ${game.id}`);
                return false;
        }

        if (!gameInstance) {
            console.error('Failed to create game instance');
            return false;
        }

        // Add and launch game
        this.sceneManager.addScene(game.id, gameInstance);
        this.sceneManager.changeScene(game.id);
        this.currentGame = gameInstance;

        // Start the engine
        this.engine.start();

        // Show game scene
        this.showGameScene();

        return true;
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
        }
    }

    backToLobby() {
        // Stop current game
        this.stopCurrentGame();

        // Hide game scene
        this.hideGameScene();

        // Show lobby (this will be handled by the main SceneManager)
        const event = new CustomEvent('backToLobbyFromGame');
        document.dispatchEvent(event);
    }

    // ── GAME LIFECYCLE ──
    stopCurrentGame() {
        if (this.engine) {
            this.engine.stop();
        }

        if (this.currentGame) {
            this.currentGame.destroy();
            this.currentGame = null;
        }

        if (this.sceneManager) {
            this.sceneManager.clearScenes();
        }
    }

    // ── EVENT HANDLING ──
    _bindGameUIEvents() {
        const backBtn = document.getElementById('game-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.backToLobby();
            });
        }
    }

    _handleGameEnd(gameResult) {
        // Handle game end (could show results screen, etc.)
        console.log('Game ended:', gameResult);
    }

    // ── UTILITIES ──
    isGameRunning() {
        return this.engine && this.engine.isRunning && this.currentGame;
    }

    getCurrentGame() {
        return this.currentGame;
    }

    // ── CLEANUP ──
    destroy() {
        this.stopCurrentGame();

        if (this.engine) {
            this.engine.destroy();
        }

        if (this.input) {
            this.input.destroy();
        }

        this.hideGameScene();
    }
}