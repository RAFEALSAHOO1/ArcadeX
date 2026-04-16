// ARCADE_X SCRIPT - VANILLA JS ONLY, NO FRAMEWORKS
// INTEGRATED WITH SCENE MANAGER + LOBBY SYSTEM

class ArcadeSystem {
    constructor() {
        this.credits = 0;
        this.maxCredits = 99;
        this.systemReady = false;
        this.audio = null;
        this.sceneManager = null;
        this.init();
    }

    init() {
        // Initialize audio system
        this.audio = new ArcadeAudio();

        // Initialize scene manager
        this.sceneManager = new AppSceneManager(this.audio);
        this.sceneManager.init();

        // Start boot sequence
        this.bootSequence();

        // Bind events after boot
        setTimeout(() => {
            this.bindEvents();
            this.updateCreditsDisplay();
            this.systemReady = true;
        }, 5000); // 5 second boot delay
    }

    bindEvents() {
        // INSERT COIN button
        const insertCoinBtn = document.getElementById('insert-coin');
        if (insertCoinBtn) {
            insertCoinBtn.addEventListener('click', () => {
                this.playButtonSound();
                this.insertCoin();
            });
        }

        // START PLAYING button → transition to lobby
        const startBtn = document.getElementById('start-button');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.playButtonSound();
                setTimeout(() => this.enterLobby(), 100);
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

        // Boot sequence messages
        setTimeout(() => {
            this.showBootMessage('ARCADE_X v3.1');
            if (this.audio) this.audio.playButtonSound();
        }, 500);

        setTimeout(() => {
            this.showBootMessage('INITIALIZING HARDWARE...');
            if (this.audio) this.audio.playSelectSound();
        }, 1200);

        setTimeout(() => {
            this.showBootMessage('CALIBRATING DISPLAY...');
            if (this.audio) this.audio.playButtonSound();
        }, 2200);

        setTimeout(() => {
            this.showBootMessage('LOADING GAME MODULES...');
            if (this.audio) this.audio.playSelectSound();
        }, 3200);

        setTimeout(() => {
            this.showBootMessage('SYSTEM READY');
            if (this.audio) this.audio.playStartSound();
        }, 4200);

        // Re-enable interactions
        setTimeout(() => {
            document.body.style.pointerEvents = 'auto';
            this.showMessage('INSERT COIN', 3000);
        }, 5000);
    }

    showBootMessage(text) {
        // Create boot screen overlay
        const bootScreen = document.createElement('div');
        bootScreen.id = 'boot-screen';
        bootScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #000000;
            color: #00ff00;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            letter-spacing: 2px;
            text-transform: uppercase;
            z-index: 10000;
            animation: boot-fade 0.5s ease-in;
        `;

        bootScreen.textContent = text;

        // Remove previous boot screen
        const existingBoot = document.getElementById('boot-screen');
        if (existingBoot) {
            existingBoot.remove();
        }

        document.body.appendChild(bootScreen);

        // Remove after 1 second
        setTimeout(() => {
            if (bootScreen.parentNode) {
                bootScreen.style.animation = 'boot-fade-out 0.5s ease-out';
                setTimeout(() => {
                    if (bootScreen.parentNode) {
                        bootScreen.parentNode.removeChild(bootScreen);
                    }
                }, 500);
            }
        }, 1000);
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