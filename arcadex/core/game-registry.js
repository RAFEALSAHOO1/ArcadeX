// ═══════════════════════════════════════════════════════════════════
// ARCADE X - GAME REGISTRY
// "Centralized game registration system - plug and play"
// Add new games by registering them here
// ═══════════════════════════════════════════════════════════════════

const GAME_REGISTRY = {
    // Core games
    tic: {
        id: 'tic',
        name: 'TIC TAC TOE',
        type: 'puzzle',
        category: 'classic',
        modes: ['single', 'ai', 'multi'],
        difficulty: true,
        render: 'dom',
        position: 1,
        genre: 'LOGIC // STRATEGY',
        players: 2,
        glowColor: 'rgba(0, 255, 0, 0.4)',
        previewColor: '#00ff00',
        previewType: 'grid',
        gameClass: TicTacToeGame
    },
    
    snake: {
        id: 'snake',
        name: 'SNAKE',
        type: 'arcade',
        category: 'action',
        modes: ['single', 'ai', 'multi'],
        difficulty: true,
        render: 'canvas',
        position: 2,
        genre: 'REFLEX // ACTION',
        players: 2,
        glowColor: 'rgba(0, 200, 255, 0.4)',
        previewColor: '#00ccff',
        previewType: 'snake',
        gameClass: SnakeGame
    },
    
    pong: {
        id: 'pong',
        name: 'PONG',
        type: 'arcade',
        category: 'classic',
        modes: ['single', 'ai', 'multi'],
        difficulty: true,
        render: 'canvas',
        position: 3,
        genre: 'ARCADE // CLASSIC',
        players: 2,
        glowColor: 'rgba(255, 255, 0, 0.4)',
        previewColor: '#ffff00',
        previewType: 'pong',
        gameClass: null // Placeholder - implement PongGame first
    },
    
    breakout: {
        id: 'breakout',
        name: 'BREAKOUT',
        type: 'arcade',
        category: 'action',
        modes: ['single'],
        difficulty: false,
        render: 'canvas',
        position: 4,
        genre: 'PHYSICS // RETRO',
        players: 1,
        glowColor: 'rgba(255, 100, 0, 0.4)',
        previewColor: '#ff6400',
        previewType: 'breakout',
        gameClass: null // Placeholder - implement BreakoutGame first
    },
    
    memory: {
        id: 'memory',
        name: 'MEMORY MATCH',
        type: 'puzzle',
        category: 'puzzle',
        modes: ['single', 'multi'],
        difficulty: false,
        render: 'dom',
        position: 5,
        genre: 'MEMORY // PUZZLE',
        players: 2,
        glowColor: 'rgba(200, 100, 255, 0.4)',
        previewColor: '#c864ff',
        previewType: 'memory',
        gameClass: null // Placeholder - implement MemoryGame first
    },
    
    tetris: {
        id: 'tetris',
        name: 'TETRIS',
        type: 'puzzle',
        category: 'classic',
        modes: ['single'],
        difficulty: true,
        render: 'canvas',
        position: 6,
        genre: 'PUZZLE // CLASSIC',
        players: 1,
        glowColor: 'rgba(100, 255, 200, 0.4)',
        previewColor: '#64ffc8',
        previewType: 'tetris',
        gameClass: null // Placeholder - implement TetrisGame first
    },
    
    space_invaders: {
        id: 'space_invaders',
        name: 'SPACE INVADERS',
        type: 'arcade',
        category: 'action',
        modes: ['single'],
        difficulty: true,
        render: 'canvas',
        position: 7,
        genre: 'SHOOTER // RETRO',
        players: 1,
        glowColor: 'rgba(0, 255, 255, 0.4)',
        previewColor: '#00ffff',
        previewType: 'space_invaders',
        gameClass: null // Placeholder
    },
    
    pacman: {
        id: 'pacman',
        name: 'PACMAN',
        type: 'arcade',
        category: 'classic',
        modes: ['single'],
        difficulty: true,
        render: 'canvas',
        position: 8,
        genre: 'MAZE // ACTION',
        players: 1,
        glowColor: 'rgba(255, 255, 0, 0.4)',
        previewColor: '#ffff00',
        previewType: 'pacman',
        gameClass: null // Placeholder
    },
    
    minesweeper: {
        id: 'minesweeper',
        name: 'MINESWEEPER',
        type: 'puzzle',
        category: 'puzzle',
        modes: ['single'],
        difficulty: true,
        render: 'dom',
        position: 9,
        genre: 'LOGIC // PUZZLE',
        players: 1,
        glowColor: 'rgba(100, 100, 255, 0.4)',
        previewColor: '#6464ff',
        previewType: 'minesweeper',
        gameClass: null // Placeholder
    },
    
    checkers: {
        id: 'checkers',
        name: 'CHECKERS',
        type: 'board',
        category: 'classic',
        modes: ['single', 'ai', 'multi'],
        difficulty: true,
        render: 'dom',
        position: 10,
        genre: 'STRATEGY // BOARD',
        players: 2,
        glowColor: 'rgba(255, 100, 0, 0.4)',
        previewColor: '#ff6400',
        previewType: 'checkers',
        gameClass: null // Placeholder
    }
};

/**
 * Get game configuration by ID
 * @param {string} id - Game ID
 * @returns {object|null} Game config or null if not found
 */
function getGameConfig(id) {
    return GAME_REGISTRY[id] || null;
}

/**
 * Get game class by ID
 * @param {string} id - Game ID
 * @returns {class|null} Game class constructor or null
 */
function getGameClass(id) {
    const config = GAME_REGISTRY[id];
    return config?.gameClass || null;
}

/**
 * Get all registered game IDs
 * @returns {string[]} Array of game IDs
 */
function getAllGameIds() {
    return Object.keys(GAME_REGISTRY);
}

/**
 * Get all game configurations
 * @returns {object[]} Array of game configs
 */
function getAllGameConfigs() {
    return Object.values(GAME_REGISTRY);
}

/**
 * Get games by category
 * @param {string} category - Category to filter by
 * @returns {object[]} Array of game configs in category
 */
function getGamesByCategory(category) {
    return Object.values(GAME_REGISTRY).filter(game => game.category === category);
}

/**
 * Get games by type
 * @param {string} type - Type to filter by
 * @returns {object[]} Array of game configs of type
 */
function getGamesByType(type) {
    return Object.values(GAME_REGISTRY).filter(game => game.type === type);
}

/**
 * Get games by render mode
 * @param {string} renderMode - Render mode to filter by
 * @returns {object[]} Array of game configs with render mode
 */
function getGamesByRenderMode(renderMode) {
    return Object.values(GAME_REGISTRY).filter(game => game.render === renderMode);
}

/**
 * Get all available categories
 * @returns {string[]} Unique categories
 */
function getAllCategories() {
    return [...new Set(Object.values(GAME_REGISTRY).map(game => game.category))];
}

/**
 * Get games by position (arcade layout)
 * @param {number} position - Position number
 * @returns {object|null} Game config at position or null
 */
function getGameByPosition(position) {
    return Object.values(GAME_REGISTRY).find(game => game.position === position) || null;
}

/**
 * Get games sorted by position
 * @returns {object[]} Games in arcade layout order
 */
function getGamesSortedByPosition() {
    return Object.values(GAME_REGISTRY).sort((a, b) => a.position - b.position);
}

/**
 * Register a new game
 * @param {string} id - Unique game ID
 * @param {object} config - Game configuration
 * @param {class} gameClass - Game class constructor
 */
function registerGame(id, config, gameClass) {
    if (GAME_REGISTRY[id]) {
        console.warn(`Game '${id}' already registered. Overwriting.`);
    }
    
    // Auto-assign position if not specified
    if (!config.position) {
        const maxPos = Math.max(...Object.values(GAME_REGISTRY).map(g => g.position || 0), 0);
        config.position = maxPos + 1;
    }
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'category', 'modes', 'render'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
        console.warn(`Game ${id} missing required fields: ${missingFields.join(', ')}`);
    }
    
    GAME_REGISTRY[id] = {
        id,
        name: config.name || 'Unnamed Game',
        type: config.type || 'arcade',
        category: config.category || 'classic',
        modes: config.modes || ['single'],
        difficulty: config.difficulty !== undefined ? config.difficulty : false,
        render: config.render || 'canvas',
        position: config.position,
        genre: config.genre || 'ARCADE',
        players: config.players || 1,
        glowColor: config.glowColor || 'rgba(255, 255, 255, 0.4)',
        previewColor: config.previewColor || '#ffffff',
        previewType: config.previewType || 'default',
        gameClass
    };
    
    console.log(`Registered new game: ${id} at position ${config.position}`);
}

// Game categories for arcade layout
const GAME_CATEGORIES = {
    classic: { name: 'CLASSICS', icon: '★', color: '#ffff00' },
    action: { name: 'ACTION', icon: '◆', color: '#ff3355' },
    puzzle: { name: 'PUZZLE', icon: '◇', color: '#00ccff' },
    multiplayer: { name: 'MULTIPLAYER', icon: '◈', color: '#00ff88' },
    board: { name: 'BOARD', icon: '□', color: '#cc44ff' }
};

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GAME_REGISTRY,
        getGameConfig,
        getGameClass,
        getAllGameIds,
        getAllGameConfigs,
        registerGame
    };
}
