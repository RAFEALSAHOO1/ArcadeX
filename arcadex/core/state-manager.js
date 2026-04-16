// ═══════════════════════════════════════════════════════════════════
// ARCADE X GAME ENGINE - STATE MANAGER
// "Hierarchical state machine for game states and transitions"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class StateManager {
    constructor() {
        this.states = new Map(); // State name -> state object
        this.currentState = null;
        this.previousState = null;
        this.globalState = null;

        // Transition state
        this.isTransitioning = false;
        this.transitionTime = 0;
        this.transitionDuration = 0;
        this.onTransitionComplete = null;

        // Callbacks
        this.onStateChange = null;
        this.onStateEnter = null;
        this.onStateExit = null;
    }

    // ── STATE REGISTRATION ──
    addState(name, state) {
        if (this.states.has(name)) {
            console.warn(`State '${name}' already exists. Overwriting.`);
        }

        // Ensure state has required methods
        if (typeof state.enter !== 'function') {
            state.enter = () => {};
        }
        if (typeof state.exit !== 'function') {
            state.exit = () => {};
        }
        if (typeof state.update !== 'function') {
            state.update = () => {};
        }
        if (typeof state.render !== 'function') {
            state.render = () => {};
        }

        this.states.set(name, state);
    }

    removeState(name) {
        if (this.states.has(name)) {
            this.states.delete(name);
        }
    }

    getState(name) {
        return this.states.get(name);
    }

    // ── STATE TRANSITIONS ──
    changeState(name, data = null) {
        if (!this.states.has(name)) {
            console.error(`State '${name}' does not exist.`);
            return false;
        }

        if (this.isTransitioning) {
            console.warn('Cannot change state during transition. Ignoring request.');
            return false;
        }

        const newState = this.states.get(name);

        // Exit current state
        if (this.currentState) {
            this.currentState.exit();
            if (this.onStateExit) {
                this.onStateExit(this.currentState, newState);
            }
        }

        // Update state pointers
        this.previousState = this.currentState;
        this.currentState = newState;

        // Enter new state
        this.currentState.enter(data);
        if (this.onStateEnter) {
            this.onStateEnter(this.currentState, this.previousState);
        }

        // Notify listeners
        if (this.onStateChange) {
            this.onStateChange(this.currentState, this.previousState);
        }

        return true;
    }

    // ── TRANSITIONS WITH ANIMATION ──
    transitionTo(name, duration = 500, data = null) {
        if (!this.states.has(name) || this.isTransitioning) {
            return false;
        }

        this.isTransitioning = true;
        this.transitionTime = 0;
        this.transitionDuration = duration;

        const targetState = this.states.get(name);
        const startState = this.currentState;

        this.onTransitionComplete = () => {
            this.changeState(name, data);
            this.isTransitioning = false;
        };

        return true;
    }

    // ── UPDATE AND RENDER ──
    update(deltaTime) {
        // Handle transitions
        if (this.isTransitioning) {
            this.transitionTime += deltaTime * 1000; // Convert to milliseconds

            if (this.transitionTime >= this.transitionDuration) {
                if (this.onTransitionComplete) {
                    this.onTransitionComplete();
                    this.onTransitionComplete = null;
                }
            }
        }

        // Update global state
        if (this.globalState && typeof this.globalState.update === 'function') {
            this.globalState.update(deltaTime);
        }

        // Update current state
        if (this.currentState && !this.isTransitioning) {
            this.currentState.update(deltaTime);
        }
    }

    render(deltaTime) {
        // Render current state
        if (this.currentState) {
            this.currentState.render(deltaTime);
        }

        // Render global state (on top)
        if (this.globalState && typeof this.globalState.render === 'function') {
            this.globalState.render(deltaTime);
        }

        // Render transition effects
        if (this.isTransitioning) {
            this._renderTransition();
        }
    }

    _renderTransition() {
        // Simple fade transition
        const progress = Math.min(this.transitionTime / this.transitionDuration, 1);
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

        // This would need access to renderer - implement in game-specific code
        // For now, just a placeholder
    }

    // ── STATE QUERIES ──
    getCurrentState() {
        return this.currentState;
    }

    getCurrentStateName() {
        for (const [name, state] of this.states) {
            if (state === this.currentState) {
                return name;
            }
        }
        return null;
    }

    getPreviousState() {
        return this.previousState;
    }

    getPreviousStateName() {
        for (const [name, state] of this.states) {
            if (state === this.previousState) {
                return name;
            }
        }
        return null;
    }

    isInState(name) {
        return this.currentState === this.states.get(name);
    }

    isTransitioning() {
        return this.isTransitioning;
    }

    getTransitionProgress() {
        if (!this.isTransitioning) return 1;
        return Math.min(this.transitionTime / this.transitionDuration, 1);
    }

    // ── GLOBAL STATE ──
    setGlobalState(state) {
        if (this.globalState) {
            this.globalState.exit();
        }

        this.globalState = state;

        if (this.globalState) {
            if (typeof this.globalState.enter !== 'function') {
                this.globalState.enter = () => {};
            }
            if (typeof this.globalState.exit !== 'function') {
                this.globalState.exit = () => {};
            }
            if (typeof this.globalState.update !== 'function') {
                this.globalState.update = () => {};
            }
            if (typeof this.globalState.render !== 'function') {
                this.globalState.render = () => {};
            }

            this.globalState.enter();
        }
    }

    getGlobalState() {
        return this.globalState;
    }

    // ── UTILITIES ──
    hasState(name) {
        return this.states.has(name);
    }

    getAllStates() {
        return Array.from(this.states.keys());
    }

    clearStates() {
        if (this.currentState) {
            this.currentState.exit();
        }
        if (this.globalState) {
            this.globalState.exit();
        }

        this.states.clear();
        this.currentState = null;
        this.previousState = null;
        this.globalState = null;
        this.isTransitioning = false;
    }

    // ── CLEANUP ──
    destroy() {
        this.clearStates();
        this.onStateChange = null;
        this.onStateEnter = null;
        this.onStateExit = null;
    }
}

// ── STATE BASE CLASS ──
class GameState {
    constructor() {
        this.name = 'GameState';
        this.data = null;
    }

    enter(data) {
        this.data = data;
    }

    exit() {
        // Cleanup
    }

    update(deltaTime) {
        // Update logic
    }

    render(deltaTime) {
        // Render logic
    }
}