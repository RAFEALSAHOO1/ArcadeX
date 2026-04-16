// ARCADE AUDIO SYSTEM - SYNTHESIZED SOUNDS FOR AUTHENTICITY

class ArcadeAudio {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3;
        this.ambiencePlaying = false;
        this.init();
    }

    init() {
        // Initialize Web Audio API when user interacts
        document.addEventListener('click', () => this.initAudioContext(), { once: true });
        document.addEventListener('keydown', () => this.initAudioContext(), { once: true });
    }

    initAudioContext() {
        if (!this.audioContext && this.enabled) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.startAmbience();
            } catch (e) {
                console.log('Web Audio API not supported');
            }
        }
    }

    createOscillator(frequency, type = 'square', duration = 0.1) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;

        gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playCoinSound() {
        if (!this.enabled) return;

        // Coin insert sound - classic arcade "ching"
        this.createOscillator(800, 'square', 0.08);
        setTimeout(() => this.createOscillator(600, 'square', 0.12), 50);
        setTimeout(() => this.createOscillator(1000, 'square', 0.06), 100);
    }

    playButtonSound() {
        if (!this.enabled) return;

        // Button press sound - short blip
        this.createOscillator(400, 'square', 0.05);
    }

    playSelectSound() {
        if (!this.enabled) return;

        // Selection sound - ascending tones
        this.createOscillator(300, 'square', 0.04);
        setTimeout(() => this.createOscillator(400, 'square', 0.04), 30);
        setTimeout(() => this.createOscillator(500, 'square', 0.04), 60);
    }

    playNavigateSound() {
        if (!this.enabled) return;

        // Navigation sound - short mechanical tick
        this.createOscillator(500, 'square', 0.03);
        setTimeout(() => this.createOscillator(350, 'square', 0.02), 20);
    }

    playStartSound() {
        if (!this.enabled) return;

        // Game start sound - dramatic
        this.createOscillator(200, 'sawtooth', 0.15);
        setTimeout(() => this.createOscillator(300, 'sawtooth', 0.15), 50);
        setTimeout(() => this.createOscillator(400, 'sawtooth', 0.2), 100);
        setTimeout(() => this.createOscillator(600, 'square', 0.1), 150);
    }

    startAmbience() {
        if (!this.enabled || this.ambiencePlaying || !this.audioContext) return;

        this.ambiencePlaying = true;

        const playAmbienceNote = () => {
            if (!this.ambiencePlaying) return;

            // Random arcade ambience - very subtle
            const notes = [220, 277, 330, 415]; // A3, C#4, E4, G#4
            const randomNote = notes[Math.floor(Math.random() * notes.length)];
            const randomDelay = 2000 + Math.random() * 3000; // 2-5 seconds

            this.createOscillator(randomNote, 'sine', 0.3);

            setTimeout(playAmbienceNote, randomDelay);
        };

        // Start ambience after a delay
        setTimeout(playAmbienceNote, 3000);
    }

    stopAmbience() {
        this.ambiencePlaying = false;
    }

    toggleAudio() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopAmbience();
        } else if (this.audioContext) {
            this.startAmbience();
        }
        return this.enabled;
    }

    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
    }
}