// ARCADE_X SCRIPT - VANILLA JS ONLY, NO FRAMEWORKS
// INTEGRATED WITH SCENE MANAGER + LOBBY SYSTEM

class ArcadeSystem {
    constructor() {
        this.credits = 0;
        this.maxCredits = 99;
        this.systemReady = false;
        this.audio = null;
        this.engine = null;
        this.renderer = null;
        this.input = null;
        this.stateManager = null;
        this.sceneManager = null;
        this.gameSceneManager = null;
        
        // Debug mode - toggle to show performance overlay
        this.DEBUG = true;
        
        this.init();
    }

    init() {
        // Initialize central audio manager
        this.audio = new AudioManager();
        this.audio.init();

        // Initialize legacy audio for backward compatibility
        this.legacyAudio = new ArcadeAudio();

        // Initialize engine systems
        const gameSceneCanvas = document.getElementById('game-scene');
        this.engine = new GameEngine(gameSceneCanvas);
        this.renderer = new Renderer(gameSceneCanvas);
        this.input = new InputSystem();
        this.stateManager = new StateManager();
        
        // Initialize arcade intro/loading/transition system
        this.arcadeIntro = new ArcadeIntroSystem(this.audio, this.engine);

        // Initialize scene managers
        this.sceneManager = new SceneManager(this.engine, this.renderer, this.input, this.stateManager);
        
        // Initialize game scene manager with injected systems
        this.gameSceneManager = new GameSceneManager(
            this.audio, 
            this.engine, 
            this.input,
            this.renderer,
            this.sceneManager,
            this.stateManager
        );
        this.gameSceneManager.init();
        
        // Set engine callbacks to scene manager
        this.engine.onUpdate = (dt) => {
            this.sceneManager.update(dt);
            
            // Random CRT effects
            if (this.arcadeIntro) {
                this.arcadeIntro.triggerRandomFlicker();
                this.arcadeIntro.triggerDistortionLine();
            }
        };
        
        this.engine.onRender = (dt) => {
            this.sceneManager.render(dt);
            this._renderDebugOverlay(dt);
        };
        
        // Initialize scenes
        this._initializeScenes();
        
        // Create debug overlay element
        this._createDebugOverlay();
    }
    
    _createDebugOverlay() {
        // Create debug overlay container
        const debugOverlay = document.createElement('div');
        debugOverlay.id = 'debug-overlay';
        debugOverlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff88;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            padding: 8px 12px;
            border: 1px solid #00ff88;
            z-index: 99999;
            display: ${this.DEBUG ? 'block' : 'none'};
            pointer-events: none;
            text-shadow: 0 0 4px rgba(0, 255, 136, 0.5);
            line-height: 1.4;
        `;
        debugOverlay.innerHTML = `
            <div id="debug-fps">FPS: --</div>
            <div id="debug-scene">SCENE: --</div>
            <div id="debug-game">GAME: --</div>
            <div id="debug-memory">MEM: --</div>
        `;
        document.body.appendChild(debugOverlay);
    }
    
    _renderDebugOverlay(dt) {
        if (!this.DEBUG) return;
        
        const fpsEl = document.getElementById('debug-fps');
        const sceneEl = document.getElementById('debug-scene');
        const gameEl = document.getElementById('debug-game');
        const memoryEl = document.getElementById('debug-memory');
        
        if (fpsEl && this.engine) {
            fpsEl.textContent = `FPS: ${this.engine.getFPS()}`;
            if (this.engine.getFPS() < 45) {
                fpsEl.style.color = '#ff3355';
            } else {
                fpsEl.style.color = '#00ff88';
            }
        }
        
        if (sceneEl && this.sceneManager) {
            const sceneName = this.sceneManager.getCurrentSceneName() || 'none';
            sceneEl.textContent = `SCENE: ${sceneName.toUpperCase()}`;
        }
        
        if (gameEl && this.gameSceneManager) {
            const gameId = this.gameSceneManager.gameId || 'none';
            gameEl.textContent = `GAME: ${gameId.toUpperCase()}`;
        }
        
        if (memoryEl && performance.memory) {
            const mbUsed = Math.round(performance.memory.usedJSHeapSize / 1048576);
            memoryEl.textContent = `MEM: ${mbUsed}MB`;
        }
    }

        // Initialize scenes
        this._initializeScenes();

        // Start boot sequence
        this.bootSequence();

        // Bind events after boot
        setTimeout(() => {
            this.bindEvents();
            this.updateCreditsDisplay();
            this.systemReady = true;
        }, 5000); // 5 second boot delay
    }

    _initializeScenes() {
        // Import scene classes
        const LandingScene = window.LandingScene || class LandingScene extends Scene {
            constructor(audio) {
                super();
                this.name = 'landing';
                this.audio = audio;
            }
            
            init() {
                // Landing page is already in DOM, just show it
                const landingEl = document.getElementById('cabinet-frame');
                if (landingEl) landingEl.style.display = 'block';
            }
            
            update(dt) {
                // No update needed for landing page
            }
            
            render(dt) {
                // No render needed for landing page
            }
            
            handleInput(input) {
                // Handle input for landing page
                if (input.isKeyJustPressed('Space') || input.isKeyJustPressed('Enter')) {
                    this.insertCoin();
                }
                
                // Number keys for game selection (1-4)
                if (input.isKeyJustPressed('Key1') || 
                    input.isKeyJustPressed('Key2') || 
                    input.isKeyJustPressed('Key3') || 
                    input.isKeyJustPressed('Key4')) {
                    this.enterLobby();
                }
                
                // S key to start game / enter lobby
                if (input.isKeyJustPressed('KeyS') && this.credits > 0) {
                    this.enterLobby();
                }
            }
            
            destroy() {
                // Hide landing page
                const landingEl = document.getElementById('cabinet-frame');
                if (landingEl) landingEl.style.display = 'none';
            }
            
            insertCoin() {
                if (this.credits < this.maxCredits) {
                    this.credits++;
                    this.updateCreditsDisplay();
                    this.playCoinSound();
                    this.showCoinMessage();
                }
            }
            
            enterLobby() {
                if (this.systemReady && this.credits > 0) {
                    this.credits--;
                    this.updateCreditsDisplay();
                    this.sceneManager.changeScene('lobby');
                }
            }
            
            updateCreditsDisplay() {
                const creditsLed = document.getElementById('credits-led');
                const coinDisplay = document.getElementById('coin-display');
                const lobbyCreditCount = document.getElementById('lobby-credit-count');

                const formatted = this.credits.toString().padStart(2, '0');

                if (creditsLed) {
                    creditsLed.textContent = `CREDITS ${formatted}`;
                }

                if (coinDisplay) {
                    coinDisplay.textContent = `CREDITS: ${formatted}`;
                }

                if (lobbyCreditCount) {
                    lobbyCreditCount.textContent = formatted;
                }
            }
            
            playCoinSound() {
                if (this.audio) {
                    this.audio.playCoinSound();
                }
            }
            
            showCoinMessage() {
                this.showMessage('COIN INSERTED', 1000);
            }
            
            showMessage(text, duration = 2000) {
                // Remove any existing message
                const existing = document.getElementById('arcade-message');
                if (existing) existing.remove();

                // Create temporary message overlay
                const message = document.createElement('div');
                message.id = 'arcade-message';
                message.textContent = text;
                message.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: #000000;
                    color: #ffff00;
                    border: 2px solid #ffff00;
                    padding: 20px 40px;
                    font-size: 18px;
                    font-family: 'ArcadeFont', monospace;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    z-index: 10000;
                    animation: message-appear 0.3s steps(3);
                `;

                document.body.appendChild(message);

                setTimeout(() => {
                    message.style.animation = 'message-disappear 0.3s steps(3)';
                    setTimeout(() => {
                        if (message.parentNode) {
                            message.parentNode.removeChild(message);
                        }
                    }, 300);
                }, duration);
            }
        };
        
        const LobbyScene = window.LobbyScene || class LobbyScene extends Scene {
            constructor(audio) {
                super();
                this.name = 'lobby';
                this.audio = audio;
                this.lobby = null;
            }
            
            init() {
                // Initialize lobby system
                this.lobby = new ArcadeLobby(this.audio);
                this.lobby.buildLobby();
                
                // Listen for lobby events
                document.addEventListener('lobbyBack', () => {
                    this.sceneManager.changeScene('landing');
                });
                
                document.addEventListener('gameSelected', (e) => {
                    this._handleGameSelected(e.detail.game);
                });
            }
            
            update(dt) {
                if (this.lobby) {
                    this.lobby.update(dt);
                }
            }
            
            render(dt) {
                if (this.lobby) {
                    this.lobby.render(dt);
                }
            }
            
            handleInput(input) {
                if (this.lobby) {
                    this.lobby.handleInput(input);
                }
            }
            
            destroy() {
                if (this.lobby) {
                    this.lobby.destroy();
                    this.lobby = null;
                }
                
                // Remove event listeners
                document.removeEventListener('lobbyBack', () => {
                    this.sceneManager.changeScene('landing');
                });
                
                document.removeEventListener('gameSelected', (e) => {
                    this._handleGameSelected(e.detail.game);
                });
            }
            
            _handleGameSelected(game) {
                // Launch the game through gameSceneManager
                // We'll need to access the gameSceneManager from the arcade system
                // For now, we'll use a custom event that the original AppSceneManager listens to
                const event = new CustomEvent('gameSelected', { detail: { game } });
                document.dispatchEvent(event);
            }
        };
        
        const GameScene = window.GameScene || class GameScene extends Scene {
            constructor(audio, gameSceneManager) {
                super();
                this.name = 'game';
                this.audio = audio;
                this.gameSceneManager = gameSceneManager;
            }
            
            init(data) {
                if (data && data.game) {
                    this.gameSceneManager.launchGame(data.game);
                }
            }
            
            update(dt) {
                // Game scene updates are handled by the engine through gameSceneManager
            }
            
            render(dt) {
                // Game scene rendering is handled by the engine through gameSceneManager
            }
            
            handleInput(input) {
                // Game scene input is handled by the engine through gameSceneManager
            }
            
            destroy() {
                // Clean up any game resources
                this.gameSceneManager.stopCurrentGame();
            }
        };

        // Register scenes with the scene manager
        this.sceneManager.addScene('landing', new LandingScene(this.audio));
        this.sceneManager.addScene('lobby', new LobbyScene(this.audio));
        this.sceneManager.addScene('game', new GameScene(this.audio, this.gameSceneManager));
        
        // Start with landing scene
        this.sceneManager.changeScene('landing');
    }

    bindEvents() {
        // INSERT COIN button
        const insertCoinBtn = document.getElementById('insert-coin');
        if (insertCoinBtn) {
            insertCoinBtn.addEventListener('click', () => {
                this.arcadeIntro.inputDelay(() => {
                    insertCoinBtn.classList.add('button-press-feedback');
                    setTimeout(() => insertCoinBtn.classList.remove('button-press-feedback'), 100);
                    this.playButtonSound();
                    this.insertCoin();
                });
            });
        }

        // START PLAYING button → transition to lobby
        const startBtn = document.getElementById('start-button');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.arcadeIntro.inputDelay(() => {
                    startBtn.classList.add('button-press-feedback');
                    setTimeout(() => startBtn.classList.remove('button-press-feedback'), 100);
                    this.playButtonSound();
                    this.arcadeIntro.transitionStaticBurst(() => {
                        this.enterLobby();
                    });
                });
            });
        }

        // EXPLORE GAMES button → transition to lobby
        const exploreBtn = document.getElementById('explore-button');
        if (exploreBtn) {
            exploreBtn.addEventListener('click', () => {
                this.playButtonSound();
                setTimeout(() => this.enterLobby(), 100);
            });
        }

        // Keyboard interaction (only when on landing scene)
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Game card interactions (landing page cards)
        const gameCards = document.querySelectorAll('#games-grid .game-card');
        gameCards.forEach(card => {
            card.addEventListener('click', () => {
                this.playSelectSound();
                setTimeout(() => this.enterLobby(), 50);
            });
        });

        // Nav button interactions
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.playButtonSound();
                setTimeout(() => this.navigateSection(button.textContent.toLowerCase()), 50);
            });
        });
    }

    enterLobby() {
        if (!this.systemReady) return;
        if (this.sceneManager) {
            this.sceneManager.transitionTo('lobby');
        }
    }

    insertCoin() {
        if (!this.systemReady) return;

        // Add slight delay for authenticity
        setTimeout(() => {
            if (this.credits < this.maxCredits) {
                this.credits++;
                this.updateCreditsDisplay();
                this.playCoinSound();
                this.showCoinMessage();
            }
        }, 150); // 150ms delay like real arcade machines
    }

    updateCreditsDisplay() {
        const creditsLed = document.getElementById('credits-led');
        const coinDisplay = document.getElementById('coin-display');
        const lobbyCreditCount = document.getElementById('lobby-credit-count');

        const formatted = this.credits.toString().padStart(2, '0');

        if (creditsLed) {
            creditsLed.textContent = `CREDITS ${formatted}`;
        }

        if (coinDisplay) {
            coinDisplay.textContent = `CREDITS: ${formatted}`;
        }

        // Sync to lobby display
        if (lobbyCreditCount) {
            lobbyCreditCount.textContent = formatted;
        }
    }

    handleKeyPress(e) {
        // Only handle keys when on landing scene
        if (this.sceneManager && this.sceneManager.currentScene !== 'landing') return;

        // Space or Enter to insert coin
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            this.insertCoin();
        }

        // Number keys for game selection
        if (e.key >= '1' && e.key <= '4') {
            this.enterLobby();
        }

        // S key to start game / enter lobby
        if (e.key.toLowerCase() === 's' && this.credits > 0) {
            this.enterLobby();
        }
    }

    navigateSection(section) {
        if (section === 'games') {
            this.enterLobby();
        } else {
            this.showMessage(`${section.toUpperCase()} LOADED`, 1500);
            this.playSelectSound();
        }
    }

    showCoinMessage() {
        this.showMessage('COIN INSERTED', 1000);
    }

    showMessage(text, duration = 2000) {
        // Remove any existing message
        const existing = document.getElementById('arcade-message');
        if (existing) existing.remove();

        // Create temporary message overlay
        const message = document.createElement('div');
        message.id = 'arcade-message';
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #000000;
            color: #ffff00;
            border: 2px solid #ffff00;
            padding: 20px 40px;
            font-size: 18px;
            font-family: 'ArcadeFont', monospace;
            text-transform: uppercase;
            letter-spacing: 2px;
            z-index: 10000;
            animation: message-appear 0.3s steps(3);
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.style.animation = 'message-disappear 0.3s steps(3)';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, duration);
    }

    playCoinSound() {
        if (this.audio) {
            this.audio.playCoinSound();
        }
    }

    playGameSound() {
        if (this.audio) {
            this.audio.playStartSound();
        }
    }

    playSelectSound() {
        if (this.audio) {
            this.audio.playSelectSound();
        }
    }

    playButtonSound() {
        if (this.audio) {
            this.audio.playButtonSound();
        }
    }

    bootSequence() {
        // Disable all interactions during boot
        document.body.style.pointerEvents = 'none';
        
        // Run proper arcade boot sequence
        this.arcadeIntro.boot(() => {
            // Boot complete
            document.body.style.pointerEvents = 'auto';
            this.showMessage('INSERT COIN', 3000);
        });
    }

    showBootMessage(text) {
        // NOTE: Boot sequence now handled by ArcadeIntroSystem.boot()
        console.log(`BOOT: ${text}`);
    }
}

// CSS animations for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes message-appear {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        33% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.9); }
        66% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    @keyframes message-disappear {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        33% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.9); }
        66% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }

    @keyframes audio-flash {
        0% { opacity: 1; }
        50% { opacity: 0; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Performance monitoring system
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.fpsHistory = [];
        this.lowFpsCount = 0;
        this.startMonitoring();
    }

    startMonitoring() {
        const measureFPS = () => {
            const now = performance.now();
            this.frameCount++;

            if (now - this.lastTime >= 1000) {
                const currentFps = Math.round((this.frameCount * 1000) / (now - this.lastTime));

                // Smooth FPS calculation using moving average
                this.fpsHistory.push(currentFps);
                if (this.fpsHistory.length > 5) {
                    this.fpsHistory.shift();
                }

                this.fps = Math.round(this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length);
                this.frameCount = 0;
                this.lastTime = now;

                // Log FPS for debugging - warn only after consistent low FPS
                if (this.fps < 45) {
                    this.lowFpsCount++;
                    if (this.lowFpsCount >= 3) { // Warn only after 3 consecutive low readings
                        console.warn(`Low FPS detected: ${this.fps} (average over ${this.fpsHistory.length} seconds)`);
                        this.lowFpsCount = 0; // Reset to avoid spam
                    }
                } else {
                    this.lowFpsCount = 0; // Reset counter when FPS recovers
                }
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    getFPS() {
        return this.fps;
    }
}

// Initialize the arcade system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.arcadeSystem = new ArcadeSystem();
    new PerformanceMonitor();
});

// Make arcade intro globally accessible
window.ArcadeIntroSystem = ArcadeIntroSystem;

// Enhanced performance monitoring
window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`ARCADE_X loaded in ${loadTime.toFixed(2)}ms`);

    // Performance optimizations for low-end devices
    if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
        console.log('Low-memory device detected, reducing effects');
        document.body.classList.add('low-performance');
    }

    // Show load time in footer if fast enough
    if (loadTime < 2000) {
        const copyright = document.getElementById('copyright');
        if (copyright) {
            copyright.textContent = `©1984 ARCADE_X TERMINAL RENDERED IN ${(loadTime / 1000).toFixed(3)}s`;
        }
    }
});