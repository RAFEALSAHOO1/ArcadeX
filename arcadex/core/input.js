// ═══════════════════════════════════════════════════════════════════
// ARCADE X GAME ENGINE - INPUT SYSTEM
// "Unified input handling for keyboard, mouse, and touch"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class InputManager {
    constructor(canvas) {
        this.canvas = canvas;

        // Input state
        this.keys = new Map(); // Current key states
        this.keysPressed = new Set(); // Keys pressed this frame
        this.keysReleased = new Set(); // Keys released this frame

        this.mouse = {
            x: 0,
            y: 0,
            buttons: new Map(),
            buttonsPressed: new Set(),
            buttonsReleased: new Set(),
            wheelDelta: 0
        };

        this.touch = {
            touches: new Map(),
            touchesStarted: new Set(),
            touchesEnded: new Set()
        };

        // Event handlers
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleKeyUp = this._handleKeyUp.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._handleWheel = this._handleWheel.bind(this);
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchMove = this._handleTouchMove.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);
        this._handleContextMenu = this._handleContextMenu.bind(this);

        // Active state
        this.isActive = false;
    }

    // ── INITIALIZATION ──
    enable() {
        if (this.isActive) return;

        this.isActive = true;

        // Keyboard events
        document.addEventListener('keydown', this._handleKeyDown);
        document.addEventListener('keyup', this._handleKeyUp);

        // Mouse events
        this.canvas.addEventListener('mousemove', this._handleMouseMove);
        this.canvas.addEventListener('mousedown', this._handleMouseDown);
        this.canvas.addEventListener('mouseup', this._handleMouseUp);
        this.canvas.addEventListener('wheel', this._handleWheel);
        this.canvas.addEventListener('contextmenu', this._handleContextMenu);

        // Touch events
        this.canvas.addEventListener('touchstart', this._handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this._handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this._handleTouchEnd, { passive: false });

        // Prevent default behaviors
        this.canvas.style.touchAction = 'none';
    }

    disable() {
        if (!this.isActive) return;

        this.isActive = false;

        // Remove all event listeners
        document.removeEventListener('keydown', this._handleKeyDown);
        document.removeEventListener('keyup', this._handleKeyUp);

        this.canvas.removeEventListener('mousemove', this._handleMouseMove);
        this.canvas.removeEventListener('mousedown', this._handleMouseDown);
        this.canvas.removeEventListener('mouseup', this._handleMouseUp);
        this.canvas.removeEventListener('wheel', this._handleWheel);
        this.canvas.removeEventListener('contextmenu', this._handleContextMenu);

        this.canvas.removeEventListener('touchstart', this._handleTouchStart);
        this.canvas.removeEventListener('touchmove', this._handleTouchMove);
        this.canvas.removeEventListener('touchend', this._handleTouchEnd);

        // Clear all input states
        this._clearAllInputs();
    }

    // ── FRAME UPDATE ──
    update() {
        // Clear frame-specific input states
        this.keysPressed.clear();
        this.keysReleased.clear();

        this.mouse.buttonsPressed.clear();
        this.mouse.buttonsReleased.clear();
        this.mouse.wheelDelta = 0;

        this.touch.touchesStarted.clear();
        this.touch.touchesEnded.clear();
    }

    // ── KEYBOARD HANDLING ──
    _handleKeyDown(e) {
        const key = e.code;

        if (!this.keys.has(key)) {
            this.keys.set(key, true);
            this.keysPressed.add(key);
        }

        // Prevent default for game keys
        if (this._isGameKey(key)) {
            e.preventDefault();
        }
    }

    _handleKeyUp(e) {
        const key = e.code;

        if (this.keys.has(key)) {
            this.keys.set(key, false);
            this.keysReleased.add(key);
        }
    }

    isKeyDown(key) {
        return this.keys.get(key) || false;
    }

    isKeyPressed(key) {
        return this.keysPressed.has(key);
    }

    isKeyReleased(key) {
        return this.keysReleased.has(key);
    }

    _isGameKey(key) {
        const gameKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'KeyW', 'KeyA', 'KeyS', 'KeyD',
            'Space', 'Enter', 'Escape',
            'KeyZ', 'KeyX', 'KeyC'
        ];
        return gameKeys.includes(key);
    }

    // ── MOUSE HANDLING ──
    _handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    _handleMouseDown(e) {
        const button = e.button;

        if (!this.mouse.buttons.has(button)) {
            this.mouse.buttons.set(button, true);
            this.mouse.buttonsPressed.add(button);
        }

        e.preventDefault();
    }

    _handleMouseUp(e) {
        const button = e.button;

        if (this.mouse.buttons.has(button)) {
            this.mouse.buttons.set(button, false);
            this.mouse.buttonsReleased.add(button);
        }
    }

    _handleWheel(e) {
        this.mouse.wheelDelta = e.deltaY;
        e.preventDefault();
    }

    _handleContextMenu(e) {
        e.preventDefault();
    }

    isMouseButtonDown(button = 0) {
        return this.mouse.buttons.get(button) || false;
    }

    isMouseButtonPressed(button = 0) {
        return this.mouse.buttonsPressed.has(button);
    }

    isMouseButtonReleased(button = 0) {
        return this.mouse.buttonsReleased.has(button);
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    getMouseWheelDelta() {
        return this.mouse.wheelDelta;
    }

    // ── TOUCH HANDLING ──
    _handleTouchStart(e) {
        e.preventDefault();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchId = touch.identifier;

            if (!this.touch.touches.has(touchId)) {
                const rect = this.canvas.getBoundingClientRect();
                const touchData = {
                    id: touchId,
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top,
                    startX: touch.clientX - rect.left,
                    startY: touch.clientY - rect.top,
                    force: touch.force || 1
                };

                this.touch.touches.set(touchId, touchData);
                this.touch.touchesStarted.add(touchId);
            }
        }
    }

    _handleTouchMove(e) {
        e.preventDefault();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchId = touch.identifier;

            if (this.touch.touches.has(touchId)) {
                const rect = this.canvas.getBoundingClientRect();
                const touchData = this.touch.touches.get(touchId);
                touchData.x = touch.clientX - rect.left;
                touchData.y = touch.clientY - rect.top;
            }
        }
    }

    _handleTouchEnd(e) {
        e.preventDefault();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchId = touch.identifier;

            if (this.touch.touches.has(touchId)) {
                this.touch.touches.delete(touchId);
                this.touch.touchesEnded.add(touchId);
            }
        }
    }

    getTouches() {
        return Array.from(this.touch.touches.values());
    }

    getTouch(id) {
        return this.touch.touches.get(id);
    }

    isTouchStarted(id) {
        return this.touch.touchesStarted.has(id);
    }

    isTouchEnded(id) {
        return this.touch.touchesEnded.has(id);
    }

    // ── UTILITY METHODS ──
    _clearAllInputs() {
        this.keys.clear();
        this.keysPressed.clear();
        this.keysReleased.clear();

        this.mouse.buttons.clear();
        this.mouse.buttonsPressed.clear();
        this.mouse.buttonsReleased.clear();
        this.mouse.wheelDelta = 0;

        this.touch.touches.clear();
        this.touch.touchesStarted.clear();
        this.touch.touchesEnded.clear();
    }

    // ── GAME-SPECIFIC HELPERS ──
    isActionPressed() {
        return this.isKeyPressed('Space') || this.isKeyPressed('Enter') || this.isMouseButtonPressed(0);
    }

    isBackPressed() {
        return this.isKeyPressed('Escape') || this.isKeyPressed('Backspace');
    }

    isUpPressed() {
        return this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW');
    }

    isDownPressed() {
        return this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS');
    }

    isLeftPressed() {
        return this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA');
    }

    isRightPressed() {
        return this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD');
    }

    // ── CLEANUP ──
    destroy() {
        this.disable();
    }
}