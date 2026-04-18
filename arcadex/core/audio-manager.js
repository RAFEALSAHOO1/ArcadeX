// ═══════════════════════════════════════════════════════════════════
// ARCADE X - CENTRAL AUDIO MANAGER
// "Single global audio system for all games and UI"
// All audio goes through this - no game should create its own AudioContext
// ═══════════════════════════════════════════════════════════════════

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        
        this.isMuted = false;
        this.isInitialized = false;
        
        // Active sounds
        this.activeSounds = new Map();
        
        // Volume settings
        this.volume = {
            master: 0.5,
            sfx: 0.6,
            music: 0.3
        };
        
        // Bind methods
        this._initializeContext = this._initializeContext.bind(this);
        this.play = this.play.bind(this);
        this.stop = this.stop.bind(this);
        this.mute = this.mute.bind(this);
        this.unmute = this.unmute.bind(this);
    }

    /**
     * Initialize audio context on first user interaction (browser policy)
     * @private
     */
    _initializeContext() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            
            // Connect graph: master ← sfx + music
            this.sfxGain.connect(this.masterGain);
            this.musicGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            // Set initial volumes
            this._updateVolumes();
            
            this.isInitialized = true;
            console.log('AudioManager initialized');
            
            // Remove event listener once initialized
            document.removeEventListener('click', this._initializeContext);
            document.removeEventListener('keydown', this._initializeContext);
        } catch (e) {
            console.warn('AudioContext not supported:', e);
        }
    }

    /**
     * Start listening for user interaction to initialize audio
     */
    init() {
        // Browser requires user interaction to create AudioContext
        document.addEventListener('click', this._initializeContext, { once: true });
        document.addEventListener('keydown', this._initializeContext, { once: true });
    }

    /**
     * Update all gain node volumes
     * @private
     */
    _updateVolumes() {
        if (!this.isInitialized) return;
        
        const masterLevel = this.isMuted ? 0 : this.volume.master;
        this.masterGain.gain.setValueAtTime(masterLevel, this.audioContext.currentTime);
        this.sfxGain.gain.setValueAtTime(this.volume.sfx, this.audioContext.currentTime);
        this.musicGain.gain.setValueAtTime(this.volume.music, this.audioContext.currentTime);
    }

    /**
     * Play a sound effect
     * @param {string} type - Sound type: 'click', 'coin', 'win', 'lose', 'move', 'navigate', 'select', 'start'
     * @param {object} options - Optional parameters
     */
    play(type, options = {}) {
        if (!this.isInitialized) {
            this._initializeContext();
            return;
        }

        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const now = this.audioContext.currentTime;
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            // Set volume based on sound type
            const volume = options.volume || 1.0;
            
            switch(type) {
                case 'click':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
                    gain.gain.setValueAtTime(this.volume.sfx * volume * 0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    osc.start(now);
                    osc.stop(now + 0.1);
                    break;
                    
                case 'coin':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(988, now);
                    osc.frequency.setValueAtTime(1319, now + 0.08);
                    gain.gain.setValueAtTime(this.volume.sfx * volume * 0.5, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.start(now);
                    osc.stop(now + 0.2);
                    break;
                    
                case 'win':
                    osc.type = 'square';
                    const winNotes = [523, 659, 784, 1047];
                    winNotes.forEach((f, i) => {
                        osc.frequency.setValueAtTime(f, now + i * 0.1);
                    });
                    gain.gain.setValueAtTime(this.volume.sfx * volume * 0.5, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc.start(now);
                    osc.stop(now + 0.5);
                    break;
                    
                case 'lose':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(220, now);
                    osc.frequency.exponentialRampToValueAtTime(55, now + 0.3);
                    gain.gain.setValueAtTime(this.volume.sfx * volume * 0.4, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                    osc.start(now);
                    osc.stop(now + 0.4);
                    break;
                    
                case 'move':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(330, now);
                    gain.gain.setValueAtTime(this.volume.sfx * volume * 0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    osc.start(now);
                    osc.stop(now + 0.05);
                    break;
                    
                case 'navigate':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(523, now);
                    gain.gain.setValueAtTime(this.volume.sfx * volume * 0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    osc.start(now);
                    osc.stop(now + 0.08);
                    break;
                    
                case 'select':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(659, now);
                    osc.frequency.setValueAtTime(784, now + 0.05);
                    gain.gain.setValueAtTime(this.volume.sfx * volume * 0.35, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.start(now);
                    osc.stop(now + 0.15);
                    break;
                    
                case 'start':
                    osc.type = 'square';
                    const startNotes = [262, 330, 392, 523];
                    startNotes.forEach((f, i) => {
                        osc.frequency.setValueAtTime(f, now + i * 0.07);
                    });
                    gain.gain.setValueAtTime(this.volume.sfx * volume * 0.4, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                    osc.start(now);
                    osc.stop(now + 0.4);
                    break;
                    
                default:
                    console.warn(`Unknown sound type: ${type}`);
                    osc.stop();
                    return;
            }
            
            // Track active sound for cleanup
            const soundId = `${type}_${Date.now()}_${Math.random()}`;
            this.activeSounds.set(soundId, { osc, gain });
            
            // Auto-cleanup
            osc.onended = () => {
                this.activeSounds.delete(soundId);
            };
            
        } catch (e) {
            console.warn(`Failed to play sound ${type}:`, e);
        }
    }

    /**
     * Stop all active sounds
     */
    stopAll() {
        this.activeSounds.forEach((sound, id) => {
            try {
                sound.osc.stop();
            } catch (e) {}
        });
        this.activeSounds.clear();
    }

    /**
     * Mute all audio
     */
    mute() {
        this.isMuted = true;
        this._updateVolumes();
    }

    /**
     * Unmute audio
     */
    unmute() {
        this.isMuted = false;
        this._updateVolumes();
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        this.isMuted ? this.unmute() : this.mute();
    }

    /**
     * Set master volume
     * @param {number} value - 0.0 to 1.0
     */
    setMasterVolume(value) {
        this.volume.master = Math.max(0, Math.min(1, value));
        this._updateVolumes();
    }

    /**
     * Set SFX volume
     * @param {number} value - 0.0 to 1.0
     */
    setSfxVolume(value) {
        this.volume.sfx = Math.max(0, Math.min(1, value));
        this._updateVolumes();
    }

    /**
     * Set music volume
     * @param {number} value - 0.0 to 1.0
     */
    setMusicVolume(value) {
        this.volume.music = Math.max(0, Math.min(1, value));
        this._updateVolumes();
    }

    /**
     * Cleanup all audio resources
     */
    destroy() {
        this.stopAll();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.isInitialized = false;
    }
}

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioManager };
}
