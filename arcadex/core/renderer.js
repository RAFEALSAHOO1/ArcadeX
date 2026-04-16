// ═══════════════════════════════════════════════════════════════════
// ARCADE X GAME ENGINE - RENDERER SYSTEM
// "Canvas 2D rendering with CRT effects and performance optimizations"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
        this.width = canvas.width;
        this.height = canvas.height;

        // CRT effect settings
        this.crtEnabled = true;
        this.crtIntensity = 0.3;
        this.scanlinesEnabled = false; // Disabled for performance
        this.scanlineIntensity = 0.1;
        this.chromaticAberration = 0.0; // Disabled for performance
        this.screenCurvature = 0.0; // Disabled by default for performance
        this.vignetteEnabled = false; // Disabled for performance
        this.vignetteIntensity = 0.2;

        // Pixel art settings
        this.pixelRatio = 1;
        this.pixelated = true;

        // Performance optimization
        this.clearColor = '#000000';
        this.alphaEnabled = false;

        // Offscreen canvas for effects
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.width;
        this.offscreenCanvas.height = this.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

        // Initialize canvas settings
        this._initCanvas();
    }

    // ── CANVAS INITIALIZATION ──
    _initCanvas() {
        // Set canvas properties for crisp pixel rendering
        this.ctx.imageSmoothingEnabled = !this.pixelated;
        this.offscreenCtx.imageSmoothingEnabled = !this.pixelated;

        // Enable alpha blending if needed
        this.ctx.globalCompositeOperation = 'source-over';
        this.offscreenCtx.globalCompositeOperation = 'source-over';
    }

    // ── RENDERING METHODS ──
    beginFrame() {
        // Clear offscreen canvas
        this.offscreenCtx.fillStyle = this.clearColor;
        this.offscreenCtx.fillRect(0, 0, this.width, this.height);

        // Reset context state
        this.offscreenCtx.save();
        this.offscreenCtx.globalAlpha = 1.0;
    }

    endFrame() {
        this.offscreenCtx.restore();

        // Apply CRT effects and render to main canvas
        this._applyCRTEffects();
    }

    // ── BASIC DRAWING METHODS ──
    clear(color = this.clearColor) {
        this.offscreenCtx.fillStyle = color;
        this.offscreenCtx.fillRect(0, 0, this.width, this.height);
    }

    drawRect(x, y, width, height, color = '#ffffff', filled = true) {
        this.offscreenCtx.fillStyle = color;
        this.offscreenCtx.strokeStyle = color;

        if (filled) {
            this.offscreenCtx.fillRect(x, y, width, height);
        } else {
            this.offscreenCtx.strokeRect(x, y, width, height);
        }
    }

    drawCircle(x, y, radius, color = '#ffffff', filled = true) {
        this.offscreenCtx.beginPath();
        this.offscreenCtx.arc(x, y, radius, 0, Math.PI * 2);

        if (filled) {
            this.offscreenCtx.fillStyle = color;
            this.offscreenCtx.fill();
        } else {
            this.offscreenCtx.strokeStyle = color;
            this.offscreenCtx.stroke();
        }
    }

    drawLine(x1, y1, x2, y2, color = '#ffffff', width = 1) {
        this.offscreenCtx.strokeStyle = color;
        this.offscreenCtx.lineWidth = width;
        this.offscreenCtx.beginPath();
        this.offscreenCtx.moveTo(x1, y1);
        this.offscreenCtx.lineTo(x2, y2);
        this.offscreenCtx.stroke();
    }

    drawText(text, x, y, color = '#ffffff', fontSize = 16, fontFamily = 'monospace', align = 'left') {
        this.offscreenCtx.fillStyle = color;
        this.offscreenCtx.font = `${fontSize}px ${fontFamily}`;
        this.offscreenCtx.textAlign = align;
        this.offscreenCtx.fillText(text, x, y);
    }

    // ── ADVANCED DRAWING METHODS ──
    drawGrid(x, y, width, height, cellSize, color = '#333333', lineWidth = 1) {
        this.offscreenCtx.strokeStyle = color;
        this.offscreenCtx.lineWidth = lineWidth;

        // Vertical lines
        for (let i = 0; i <= width; i += cellSize) {
            this.offscreenCtx.beginPath();
            this.offscreenCtx.moveTo(x + i, y);
            this.offscreenCtx.lineTo(x + i, y + height);
            this.offscreenCtx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i <= height; i += cellSize) {
            this.offscreenCtx.beginPath();
            this.offscreenCtx.moveTo(x, y + i);
            this.offscreenCtx.lineTo(x + width, y + i);
            this.offscreenCtx.stroke();
        }
    }

    drawArcadeBorder(x, y, width, height, borderWidth = 4, color = '#ffff00') {
        // Outer border
        this.drawRect(x - borderWidth, y - borderWidth,
                     width + borderWidth * 2, height + borderWidth * 2,
                     color, false);

        // Inner highlight
        this.drawRect(x - borderWidth/2, y - borderWidth/2,
                     width + borderWidth, height + borderWidth,
                     '#ffffff', false);
    }

    // ── CRT EFFECTS ──
    _applyCRTEffects() {
        if (!this.crtEnabled) {
            // No effects, just copy to main canvas
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.drawImage(this.offscreenCanvas, 0, 0);
            return;
        }

        // Clear main canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Apply chromatic aberration
        if (this.chromaticAberration > 0) {
            this._applyChromaticAberration();
        }

        // Apply screen curvature
        if (this.screenCurvature > 0) {
            this._applyScreenCurvature();
        }

        // Apply scanlines
        if (this.scanlinesEnabled) {
            this._applyScanlines();
        }

        // Apply vignette
        if (this.vignetteEnabled) {
            this._applyVignette();
        }

        // Apply general CRT overlay
        this._applyCRTGlow();
    }

    _applyChromaticAberration() {
        const offset = this.chromaticAberration * this.width;

        // Draw red channel
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'destination-in';
        this.ctx.drawImage(this.offscreenCanvas, -offset, 0);

        // Draw blue channel
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'destination-in';
        this.ctx.drawImage(this.offscreenCanvas, offset, 0);

        // Draw green channel (normal)
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'destination-in';
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);

        // Reset composite operation
        this.ctx.globalCompositeOperation = 'source-over';
    }

    _applyScreenCurvature() {
        // Simple barrel distortion approximation
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

        // Create distortion map (simplified)
        const imageData = this.offscreenCtx.getImageData(0, 0, this.width, this.height);
        const distortedData = new ImageData(this.width, this.height);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const distortion = 1 + this.screenCurvature * (dist / maxDist) * (dist / maxDist);

                const srcX = Math.floor(centerX + dx / distortion);
                const srcY = Math.floor(centerY + dy / distortion);

                if (srcX >= 0 && srcX < this.width && srcY >= 0 && srcY < this.height) {
                    const srcIndex = (srcY * this.width + srcX) * 4;
                    const destIndex = (y * this.width + x) * 4;

                    distortedData.data[destIndex] = imageData.data[srcIndex];
                    distortedData.data[destIndex + 1] = imageData.data[srcIndex + 1];
                    distortedData.data[destIndex + 2] = imageData.data[srcIndex + 2];
                    distortedData.data[destIndex + 3] = imageData.data[srcIndex + 3];
                }
            }
        }

        this.offscreenCtx.putImageData(distortedData, 0, 0);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }

    _applyScanlines() {
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.fillStyle = `rgba(0, 0, 0, ${this.scanlineIntensity})`;

        for (let y = 0; y < this.height; y += 2) {
            this.ctx.fillRect(0, y, this.width, 1);
        }

        this.ctx.globalCompositeOperation = 'source-over';
    }

    _applyVignette() {
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) / 2
        );

        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
        gradient.addColorStop(0.7, `rgba(0, 0, 0, ${this.vignetteIntensity * 0.3})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteIntensity})`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    _applyCRTGlow() {
        // Add subtle glow effect
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 2;
        this.ctx.globalAlpha = this.crtIntensity;
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
    }

    // ── CONFIGURATION ──
    setCRTEffects(enabled, intensity = 0.3) {
        this.crtEnabled = enabled;
        this.crtIntensity = intensity;
    }

    setScanlines(enabled, intensity = 0.1) {
        this.scanlinesEnabled = enabled;
        this.scanlineIntensity = intensity;
    }

    setChromaticAberration(amount) {
        this.chromaticAberration = amount;
    }

    setScreenCurvature(amount) {
        this.screenCurvature = amount;
    }

    setVignette(enabled, intensity = 0.2) {
        this.vignetteEnabled = enabled;
        this.vignetteIntensity = intensity;
    }

    setPixelated(pixelated) {
        this.pixelated = pixelated;
        this.ctx.imageSmoothingEnabled = !pixelated;
        this.offscreenCtx.imageSmoothingEnabled = !pixelated;
    }

    // ── UTILITIES ──
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.offscreenCanvas.width = width;
        this.offscreenCanvas.height = height;
        this._initCanvas();
    }

    getImageData(x = 0, y = 0, width = this.width, height = this.height) {
        return this.offscreenCtx.getImageData(x, y, width, height);
    }

    putImageData(imageData, x = 0, y = 0) {
        this.offscreenCtx.putImageData(imageData, x, y);
    }

    // ── CLEANUP ──
    destroy() {
        // Clear canvases
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    }
}