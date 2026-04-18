// ═══════════════════════════════════════════════════════════════════
// ARCADE X - BOOT / LOADING / TRANSITION SYSTEM
// "Authentic 1980s-90s arcade machine simulation"
// NO SMOOTH ANIMATIONS. STEPPED, IMPERFECT, REAL HARDWARE FEEL.
// ═══════════════════════════════════════════════════════════════════

class ArcadeIntroSystem {
    constructor(audio, engine) {
        this.audio = audio;
        this.engine = engine;
        this.isBooting = false;
        this.isLoading = false;
        
        // DOM elements
        this.bootScreen = null;
        this.loadingScreen = null;
        this.transitionOverlay = null;
        
        // Bind methods
        this.boot = this.boot.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        this.transitionPowerOff = this.transitionPowerOff.bind(this);
        this.transitionPowerOn = this.transitionPowerOn.bind(this);
        this.transitionStaticBurst = this.transitionStaticBurst.bind(this);
        this.transitionSignalGlitch = this.transitionSignalGlitch.bind(this);
        
        this.init();
    }

    init() {
        // Create all overlay elements
        this._createBootScreen();
        this._createLoadingScreen();
        this._createTransitionOverlay();
    }

    // ─────────────────────────────────────────────────────────
    // STEP 1: BOOT SEQUENCE
    // ─────────────────────────────────────────────────────────
    
    _createBootScreen() {
        this.bootScreen = document.createElement('div');
        this.bootScreen.id = 'arcade-boot-screen';
        this.bootScreen.className = 'arcade-overlay boot-screen';
        this.bootScreen.innerHTML = `
            <div class="boot-content">
                <div class="boot-line" id="boot-line-1"></div>
                <div class="boot-line" id="boot-line-2"></div>
                <div class="boot-line" id="boot-line-3"></div>
                <div class="boot-line" id="boot-line-4"></div>
                <div class="boot-line" id="boot-line-5"></div>
            </div>
            <div class="boot-scanline"></div>
        `;
        this.bootScreen.style.display = 'none';
        document.body.appendChild(this.bootScreen);
    }

    /**
     * Full arcade boot sequence
     * @param {Function} callback - Called when boot complete
     */
    boot(callback) {
        if (this.isBooting) return;
        this.isBooting = true;
        
        this.bootScreen.style.display = 'flex';
        document.body.style.pointerEvents = 'none';
        
        const bootLines = [
            "ARCADEX SYSTEM v1.0",
            "INITIALIZING HARDWARE...",
            "LOADING MEMORY...",
            "CALIBRATING DISPLAY...",
            "INSERT COIN TO START"
        ];
        
        let lineIndex = 0;
        
        const showNextLine = () => {
            if (lineIndex >= bootLines.length) {
                // Boot complete
                setTimeout(() => {
                    this.bootScreen.style.display = 'none';
                    document.body.style.pointerEvents = 'auto';
                    this.isBooting = false;
                    if (callback) callback();
                }, 1500 + Math.random() * 500);
                return;
            }
            
            const line = bootLines[lineIndex];
            const lineEl = document.getElementById(`boot-line-${lineIndex + 1}`);
            
            // Random delay between lines (200-800ms)
            const delay = 200 + Math.random() * 600;
            
            setTimeout(() => {
                // Typing effect with glitch
                this._typeText(lineEl, line, () => {
                    // Small beep per line
                    if (this.audio && lineIndex < 4) {
                        this.audio.play('click');
                    }
                    lineIndex++;
                    showNextLine();
                });
            }, delay);
        };
        
        // Start with first line after initial delay
        setTimeout(() => showNextLine(), 500 + Math.random() * 300);
    }

    _typeText(element, text, callback) {
        element.textContent = '';
        let charIndex = 0;
        
        const typeNext = () => {
            if (charIndex >= text.length) {
                if (callback) callback();
                return;
            }
            
            // Random character delay
            const charDelay = 30 + Math.random() * 20;
            
            // Random glitch characters
            if (Math.random() < 0.08) {
                element.textContent += ['▓', '█', '▒', '░', '▀', '▄'][Math.floor(Math.random() * 6)];
                setTimeout(() => {
                    element.textContent = element.textContent.slice(0, -1) + text[charIndex];
                    charIndex++;
                    setTimeout(typeNext, charDelay);
                }, 20 + Math.random() * 30);
            } else {
                element.textContent += text[charIndex];
                charIndex++;
                setTimeout(typeNext, charDelay);
            }
        };
        
        typeNext();
    }

    // ─────────────────────────────────────────────────────────
    // STEP 2: LOADING SCREEN SYSTEM
    // ─────────────────────────────────────────────────────────
    
    _createLoadingScreen() {
        this.loadingScreen = document.createElement('div');
        this.loadingScreen.id = 'arcade-loading-screen';
        this.loadingScreen.className = 'arcade-overlay loading-screen';
        this.loadingScreen.innerHTML = `
            <div class="loading-content">
                <div class="loading-text" id="loading-text">LOADING...</div>
                <div class="loading-bar-container">
                    <div class="loading-bar" id="loading-bar"></div>
                </div>
                <div class="loading-status" id="loading-status"></div>
            </div>
        `;
        this.loadingScreen.style.display = 'none';
        document.body.appendChild(this.loadingScreen);
    }

    /**
     * Show loading screen
     * @param {string} type - "game-loading", "scene-loading", "system-loading"
     */
    showLoading(type = 'game-loading') {
        if (this.isLoading) return;
        this.isLoading = true;
        
        this.loadingScreen.style.display = 'flex';
        
        // Different text based on type
        const statusTexts = {
            'game-loading': "INITIALIZING GAME MODULE...",
            'scene-loading': "SWITCHING SCENES...",
            'system-loading': "SYSTEM INITIALIZATION..."
        };
        
        document.getElementById('loading-status').textContent = statusTexts[type] || statusTexts['system-loading'];
        
        // Fake progress bar (not smooth - jumps like real hardware)
        let progress = 0;
        const loadingBar = document.getElementById('loading-bar');
        
        const updateProgress = () => {
            if (!this.isLoading) return;
            
            // Random progress jumps
            const jump = 5 + Math.random() * 25;
            progress = Math.min(progress + jump, 95);
            
            loadingBar.style.width = `${progress}%`;
            
            // Random glitch flash
            if (Math.random() < 0.15) {
                this.loadingScreen.classList.add('glitch');
                setTimeout(() => this.loadingScreen.classList.remove('glitch'), 50 + Math.random() * 100);
            }
            
            if (progress < 95) {
                setTimeout(updateProgress, 100 + Math.random() * 300);
            }
        };
        
        updateProgress();
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        if (!this.isLoading) return;
        
        // Fill to 100%
        document.getElementById('loading-bar').style.width = '100%';
        
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.isLoading = false;
            document.getElementById('loading-bar').style.width = '0%';
        }, 300 + Math.random() * 200);
    }

    // ─────────────────────────────────────────────────────────
    // STEP 3: SKELETON LOADING
    // ─────────────────────────────────────────────────────────
    
    showSkeleton(container) {
        // Show wireframe grid placeholders
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loading';
        skeleton.innerHTML = `
            <div class="skeleton-grid"></div>
            <div class="skeleton-text">INITIALIZING...</div>
        `;
        container.appendChild(skeleton);
        return skeleton;
    }

    hideSkeleton(skeleton) {
        skeleton.classList.add('skeleton-fade');
        setTimeout(() => skeleton.remove(), 500);
    }

    // ─────────────────────────────────────────────────────────
    // STEP 4: SCENE TRANSITIONS
    // ─────────────────────────────────────────────────────────
    
    _createTransitionOverlay() {
        this.transitionOverlay = document.createElement('div');
        this.transitionOverlay.id = 'arcade-transition-overlay';
        this.transitionOverlay.className = 'transition-overlay';
        this.transitionOverlay.innerHTML = `
            <div class="transition-power" id="transition-power"></div>
            <div class="transition-static" id="transition-static"></div>
            <div class="transition-glitch" id="transition-glitch"></div>
        `;
        this.transitionOverlay.style.display = 'none';
        document.body.appendChild(this.transitionOverlay);
    }

    /**
     * CRT Power Off transition
     * @param {Function} callback - Called mid-transition
     */
    transitionPowerOff(callback) {
        this.transitionOverlay.style.display = 'block';
        const power = document.getElementById('transition-power');
        power.classList.add('power-off');
        
        // Callback when screen is collapsed
        setTimeout(() => {
            if (callback) callback();
            
            // Power back on
            setTimeout(() => {
                power.classList.remove('power-off');
                power.classList.add('power-on');
                setTimeout(() => {
                    power.classList.remove('power-on');
                    this.transitionOverlay.style.display = 'none';
                }, 300);
            }, 100);
        }, 250);
    }

    /**
     * CRT Power On transition
     * @param {Function} callback - Called when complete
     */
    transitionPowerOn(callback) {
        this.transitionOverlay.style.display = 'block';
        const power = document.getElementById('transition-power');
        power.classList.add('power-on');
        
        setTimeout(() => {
            power.classList.remove('power-on');
            this.transitionOverlay.style.display = 'none';
            if (callback) callback();
        }, 400);
    }

    /**
     * Static burst transition
     * @param {Function} callback - Called mid-transition
     */
    transitionStaticBurst(callback) {
        this.transitionOverlay.style.display = 'block';
        const staticEl = document.getElementById('transition-static');
        staticEl.classList.add('active');
        
        setTimeout(() => {
            if (callback) callback();
            setTimeout(() => {
                staticEl.classList.remove('active');
                this.transitionOverlay.style.display = 'none';
            }, 100);
        }, 200 + Math.random() * 200);
    }

    /**
     * Signal glitch transition
     * @param {Function} callback - Called when complete
     */
    transitionSignalGlitch(callback) {
        this.transitionOverlay.style.display = 'block';
        const glitch = document.getElementById('transition-glitch');
        glitch.classList.add('active');
        
        setTimeout(() => {
            glitch.classList.remove('active');
            this.transitionOverlay.style.display = 'none';
            if (callback) callback();
        }, 150 + Math.random() * 150);
    }

    // ─────────────────────────────────────────────────────────
    // STEP 6: INPUT DELAY SIMULATION
    // ─────────────────────────────────────────────────────────
    
    /**
     * Simulate hardware input delay
     * @param {Function} callback - Called after delay
     * @param {number} minMs - Minimum delay (default 80)
     * @param {number} maxMs - Maximum delay (default 120)
     */
    inputDelay(callback, minMs = 80, maxMs = 120) {
        const delay = minMs + Math.random() * (maxMs - minMs);
        setTimeout(callback, delay);
    }

    // ─────────────────────────────────────────────────────────
    // CRT EFFECT ENHANCEMENT
    // ─────────────────────────────────────────────────────────
    
    /**
     * Trigger random CRT flicker
     */
    triggerRandomFlicker() {
        if (Math.random() < 0.005) { // 0.5% chance per frame
            document.body.classList.add('crt-flicker');
            setTimeout(() => document.body.classList.remove('crt-flicker'), 50 + Math.random() * 100);
        }
    }

    /**
     * Trigger random distortion line
     */
    triggerDistortionLine() {
        if (Math.random() < 0.002) { // 0.2% chance per frame
            const line = document.createElement('div');
            line.className = 'distortion-line';
            line.style.top = `${Math.random() * 100}%`;
            document.body.appendChild(line);
            setTimeout(() => line.remove(), 50 + Math.random() * 100);
        }
    }
}

// Global access for backward compatibility
if (typeof window !== 'undefined') {
    window.ArcadeIntroSystem = ArcadeIntroSystem;
}

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArcadeIntroSystem };
}
