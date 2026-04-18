// ═══════════════════════════════════════════════════════════════════
// ARCADE X GAME ENGINE - SCENE MANAGER
// "Scene-based architecture for game screens and UI"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class SceneManager {
    constructor(engine, renderer, input, stateManager) {
        this.engine = engine;
        this.renderer = renderer;
        this.input = input;
        this.stateManager = stateManager;

        this.scenes = new Map(); // Scene name -> scene object
        this.currentScene = null;
        this.previousScene = null;

        // Scene container (DOM element)
        this.sceneContainer = null;

        // Callbacks
        this.onSceneChange = null;
        this.onSceneEnter = null;
        this.onSceneExit = null;
    }

    // ── SCENE REGISTRATION ──
    addScene(name, scene) {
        if (this.scenes.has(name)) {
            console.warn(`Scene '${name}' already exists. Overwriting.`);
        }

        // Ensure scene has required methods
        if (typeof scene.init !== 'function') {
            scene.init = () => {};
        }
        if (typeof scene.destroy !== 'function') {
            scene.destroy = () => {};
        }
        if (typeof scene.update !== 'function') {
            scene.update = () => {};
        }
        if (typeof scene.render !== 'function') {
            scene.render = () => {};
        }
        if (typeof scene.handleInput !== 'function') {
            scene.handleInput = () => {};
        }

        // Inject engine dependencies
        scene.engine = this.engine;
        scene.renderer = this.renderer;
        scene.input = this.input;
        scene.stateManager = this.stateManager;
        scene.sceneManager = this;

        this.scenes.set(name, scene);
    }

    removeScene(name) {
        if (this.scenes.has(name)) {
            const scene = this.scenes.get(name);
            if (scene === this.currentScene) {
                this.changeScene(null); // Exit current scene
            }
            this.scenes.delete(name);
        }
    }

    getScene(name) {
        return this.scenes.get(name);
    }

    // ── SCENE TRANSITIONS ──
    changeScene(name, data = null) {
        if (name !== null && !this.scenes.has(name)) {
            console.error(`Scene '${name}' does not exist.`);
            return false;
        }

        // Exit current scene
        if (this.currentScene) {
            this.currentScene.destroy();
            if (this.onSceneExit) {
                this.onSceneExit(this.currentScene, name);
            }
        }

        // Update scene pointers
        this.previousScene = this.currentScene;
        this.currentScene = name ? this.scenes.get(name) : null;

        // Enter new scene
        if (this.currentScene) {
            this.currentScene.init(data);
            if (this.onSceneEnter) {
                this.onSceneEnter(this.currentScene, this.previousScene);
            }
        }

        // Notify listeners
        if (this.onSceneChange) {
            this.onSceneChange(this.currentScene, this.previousScene);
        }

        return true;
    }

    // ── UPDATE AND RENDER ──
    update(deltaTime) {
        if (this.currentScene) {
            try {
                this.currentScene.handleInput(this.input, deltaTime);
                this.currentScene.update(deltaTime);
            } catch (e) {
                console.error(`Scene ${this.getCurrentSceneName()} update error:`, e);
                // Continue execution
            }
        }
    }

    render(deltaTime) {
        if (this.currentScene) {
            try {
                this.currentScene.render(deltaTime);
            } catch (e) {
                console.error(`Scene ${this.getCurrentSceneName()} render error:`, e);
                // Continue execution
            }
        }
    }

    // ── SCENE QUERIES ──
    getCurrentScene() {
        return this.currentScene;
    }

    getCurrentSceneName() {
        for (const [name, scene] of this.scenes) {
            if (this.scenes.get(name) === this.currentScene) {
                return name;
            }
        }
        return null;
    }

    getPreviousScene() {
        return this.previousScene;
    }

    getPreviousSceneName() {
        for (const [name, scene] of this.scenes) {
            if (this.scenes.get(name) === this.previousScene) {
                return name;
            }
        }
        return null;
    }

    isInScene(name) {
        return this.currentScene === this.scenes.get(name);
    }

    // ── SCENE CONTAINER MANAGEMENT ──
    setSceneContainer(container) {
        this.sceneContainer = container;
    }

    getSceneContainer() {
        return this.sceneContainer;
    }

    // ── UTILITIES ──
    hasScene(name) {
        return this.scenes.has(name);
    }

    getAllScenes() {
        return Array.from(this.scenes.keys());
    }

    clearScenes() {
        if (this.currentScene) {
            this.currentScene.destroy();
        }

        this.scenes.clear();
        this.currentScene = null;
        this.previousScene = null;
    }

    // ── CLEANUP ──
    destroy() {
        this.clearScenes();
        this.onSceneChange = null;
        this.onSceneEnter = null;
        this.onSceneExit = null;
    }
}

// ── SCENE BASE CLASS ──
class Scene {
    constructor() {
        this.name = 'Scene';
        this.engine = null;
        this.renderer = null;
        this.input = null;
        this.stateManager = null;
        this.sceneManager = null;
        this.data = null;
    }

    init(data) {
        this.data = data;
        // Initialize scene resources
    }

    destroy() {
        // Cleanup scene resources
    }

    update(deltaTime) {
        // Update scene logic
    }

    render(deltaTime) {
        // Render scene
    }

    handleInput(deltaTime) {
        // Handle input for this scene
    }
}