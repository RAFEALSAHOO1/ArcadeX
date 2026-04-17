// ═══════════════════════════════════════════════════════════════════
// ARCADE X - TIC TAC TOE GAME
// "Classic 3x3 grid strategy game with AI opponents"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class TicTacToeGame {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.renderer = sceneManager.renderer;
        this.input = sceneManager.input;

        // Game configuration
        this.gameMode = 'single'; // 'single', 'ai-easy', 'ai-medium', 'ai-hard', 'multi'
        this.board = Array(9).fill(null); // 3x3 grid: 0-8
        this.currentPlayer = 'X'; // 'X' or 'O'
        this.winner = null;
        this.gameOver = false;
        this.moves = 0;

        // UI state
        this.selectedCell = -1;
        this.hoverCell = -1;
        this.showWinnerAnimation = false;
        this.winnerAnimationTime = 0;

        // Cached rendering values
        this.cellSize = 0;
        this.boardSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;

        // AI state
        this.aiThinking = false;
        this.aiMoveDelay = 500; // ms
        this.aiMoveTimer = 0;

        // Audio (placeholder - would integrate with audio system)
        this.audioEnabled = true;

        // Bind methods
        this.handleInput = this.handleInput.bind(this);
        this._makeAIMove = this._makeAIMove.bind(this);
    }

    // ── GAME INITIALIZATION ──
    init(gameMode = 'single') {
        // Prevent double initialization
        if (this.input && this.input.isActive) {
            console.log(`TIC TAC TOE already initialized, skipping`);
            return;
        }

        // Handle case where init is called with scene data object
        if (typeof gameMode === 'object' && gameMode !== null) {
            gameMode = 'single'; // Default fallback
        }
        this.gameMode = gameMode;
        this.reset();

        // Initialize input handling
        this.input.enable();

        console.log(`TIC TAC TOE initialized: ${this.gameMode} mode`);
    }

    reset() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.winner = null;
        this.gameOver = false;
        this.moves = 0;
        this.selectedCell = -1;
        this.hoverCell = -1;
        this.showWinnerAnimation = false;
        this.winnerAnimationTime = 0;
        this.aiThinking = false;
        this.aiMoveTimer = 0;
    }

    // ── GAME LOGIC ──
    makeMove(cellIndex) {
        if (this.gameOver || this.board[cellIndex] !== null || this.aiThinking) {
            return false;
        }

        // Make the move
        this.board[cellIndex] = this.currentPlayer;
        this.moves++;

        // Play sound effect
        if (this.audioEnabled) {
            this._playMoveSound();
        }

        // Check for winner
        this.winner = this._checkWinner();
        if (this.winner) {
            this.gameOver = true;
            this.showWinnerAnimation = true;
            if (this.audioEnabled) {
                this._playWinSound();
            }
            return true;
        }

        // Check for draw
        if (this.moves >= 9) {
            this.gameOver = true;
            if (this.audioEnabled) {
                this._playDrawSound();
            }
            return true;
        }

        // Switch players
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

        // Handle AI move if applicable
        if (this._isAIMode() && this.currentPlayer === 'O') {
            this.aiThinking = true;
            this.aiMoveTimer = this.aiMoveDelay;
        }

        return true;
    }

    _checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return {
                    player: this.board[a],
                    cells: pattern
                };
            }
        }

        return null;
    }

    _isAIMode() {
        return this.gameMode.startsWith('ai-');
    }

    // ── AI LOGIC ──
    _makeAIMove() {
        if (!this.aiThinking || this.gameOver) return;

        let moveIndex = -1;

        switch (this.gameMode) {
            case 'ai-easy':
                moveIndex = this._getRandomMove();
                break;
            case 'ai-medium':
                moveIndex = this._getMediumMove();
                break;
            case 'ai-hard':
                moveIndex = this._getBestMove();
                break;
        }

        if (moveIndex !== -1) {
            this.makeMove(moveIndex);
            this.aiThinking = false;
        }
    }

    _getRandomMove() {
        const availableMoves = [];
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === null) {
                availableMoves.push(i);
            }
        }
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    _getMediumMove() {
        // 70% chance of optimal move, 30% random
        if (Math.random() < 0.7) {
            return this._getBestMove();
        } else {
            return this._getRandomMove();
        }
    }

    _getBestMove() {
        // Minimax algorithm for perfect play
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < 9; i++) {
            if (this.board[i] === null) {
                this.board[i] = 'O'; // AI is 'O'
                const score = this._minimax(this.board, 0, false);
                this.board[i] = null;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    _minimax(board, depth, isMaximizing) {
        const winner = this._checkWinner();
        if (winner) {
            return winner.player === 'O' ? 10 - depth : depth - 10;
        }
        if (this.moves + depth >= 9) {
            return 0; // Draw
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'O';
                    const evaluation = this._minimax(board, depth + 1, false);
                    board[i] = null;
                    maxEval = Math.max(maxEval, evaluation);
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'X';
                    const evaluation = this._minimax(board, depth + 1, true);
                    board[i] = null;
                    minEval = Math.min(minEval, evaluation);
                }
            }
            return minEval;
        }
    }

    // ── INPUT HANDLING ──
    handleInput(deltaTime) {
        // Mouse/touch input
        const mousePos = this.input.getMousePosition();

        // Use cached rendering values (calculate if not set)
        if (this.cellSize === 0) {
            this.cellSize = Math.min(this.renderer.width, this.renderer.height) * 0.25;
            this.boardSize = this.cellSize * 3;
            this.offsetX = (this.renderer.width - this.boardSize) / 2;
            this.offsetY = (this.renderer.height - this.boardSize) / 2;
        }

        const cellSize = this.cellSize;
        const boardSize = this.boardSize;
        const offsetX = this.offsetX;
        const offsetY = this.offsetY;

        // Calculate hover cell
        this.hoverCell = -1;
        if (mousePos.x >= offsetX && mousePos.x < offsetX + boardSize &&
            mousePos.y >= offsetY && mousePos.y < offsetY + boardSize) {
            const col = Math.floor((mousePos.x - offsetX) / cellSize);
            const row = Math.floor((mousePos.y - offsetY) / cellSize);
            this.hoverCell = row * 3 + col;
        }

        // Handle clicks - check both pressed and just clicked
        if ((this.input.isMouseButtonPressed(0) || this.input.isMouseButtonDown(0)) && this.hoverCell !== -1) {
            // Debug logging
            console.log(`Click detected at cell ${this.hoverCell}, mouse pos: ${mousePos.x}, ${mousePos.y}`);
            this.makeMove(this.hoverCell);
        }

        const cellSize = this.cellSize;
        const boardSize = this.boardSize;
        const offsetX = this.offsetX;
        const offsetY = this.offsetY;

        // Calculate hover cell
        this.hoverCell = -1;
        if (mousePos.x >= offsetX && mousePos.x < offsetX + boardSize &&
            mousePos.y >= offsetY && mousePos.y < offsetY + boardSize) {
            const col = Math.floor((mousePos.x - offsetX) / cellSize);
            const row = Math.floor((mousePos.y - offsetY) / cellSize);
            this.hoverCell = row * 3 + col;
        }

        // Handle clicks
        if (this.input.isMouseButtonPressed(0) && this.hoverCell !== -1) {
            this.makeMove(this.hoverCell);
        }

        // Keyboard navigation (for accessibility)
        if (this.input.isRightPressed()) {
            this.selectedCell = (this.selectedCell + 1) % 9;
        } else if (this.input.isLeftPressed()) {
            this.selectedCell = (this.selectedCell - 1 + 9) % 9;
        } else if (this.input.isDownPressed()) {
            this.selectedCell = (this.selectedCell + 3) % 9;
        } else if (this.input.isUpPressed()) {
            this.selectedCell = (this.selectedCell - 3 + 9) % 9;
        }

        if (this.input.isActionPressed() && this.selectedCell !== -1) {
            this.makeMove(this.selectedCell);
        }

        // Back to lobby
        if (this.input.isBackPressed()) {
            // Dispatch event to return to lobby
            const event = new CustomEvent('backToLobbyFromGame');
            document.dispatchEvent(event);
        }
    }

    // ── RENDERING ──
    update(deltaTime) {
        // Handle AI move timer
        if (this.aiThinking) {
            this.aiMoveTimer -= deltaTime * 1000;
            if (this.aiMoveTimer <= 0) {
                this._makeAIMove();
            }
        }

        if (this.showWinnerAnimation) {
            this.winnerAnimationTime += deltaTime;
            if (this.winnerAnimationTime > 2.0) { // 2 second animation
                this.showWinnerAnimation = false;
            }
        }
    }

    render(deltaTime) {
        // Debug logging (remove after testing)
        console.log('TicTacToe render called');

        this.renderer.beginFrame();

        // Clear background
        this.renderer.clear('#000000');

        // Draw title and UI
        this._drawUI();

        // Draw game board
        this._drawBoard();

        // Draw winner animation
        if (this.showWinnerAnimation) {
            this._drawWinnerAnimation();
        }

        // Draw AI thinking indicator
        if (this.aiThinking) {
            this._drawAIThinking();
        }

        this.renderer.endFrame();
    }

    _drawUI() {
        const centerX = this.renderer.width / 2;

        // Title
        this.renderer.drawText('TIC TAC TOE', centerX, 40, '#00ff00', 24, 'monospace', 'center');

        // Current player / status
        let statusText = '';
        let statusColor = '#ffffff';

        if (this.gameOver) {
            if (this.winner) {
                statusText = `PLAYER ${this.winner.player} WINS!`;
                statusColor = this.winner.player === 'X' ? '#00ff00' : '#ff0000';
            } else {
                statusText = 'DRAW GAME!';
                statusColor = '#ffff00';
            }
        } else if (this.aiThinking) {
            statusText = 'AI THINKING...';
            statusColor = '#888888';
        } else {
            statusText = `PLAYER ${this.currentPlayer}'S TURN`;
            statusColor = this.currentPlayer === 'X' ? '#00ff00' : '#ff0000';
        }

        this.renderer.drawText(statusText, centerX, 80, statusColor, 16, 'monospace', 'center');

        // Controls hint
        this.renderer.drawText('CLICK TO PLAY • ESC TO EXIT', centerX, this.renderer.height - 30, '#666666', 12, 'monospace', 'center');
    }

    _drawBoard() {
        // Use cached rendering values (assume _drawBoard was called first)
        const cellSize = this.cellSize;
        const boardSize = this.boardSize;
        const offsetX = this.offsetX;
        const offsetY = this.offsetY;

        // Debug logging
        console.log(`Drawing board at ${offsetX}, ${offsetY}, size ${boardSize}`);

        // Draw grid
        this.renderer.drawGrid(offsetX, offsetY, boardSize, boardSize, cellSize, '#333333', 2);

        // Draw arcade-style border
        this.renderer.drawArcadeBorder(offsetX - 10, offsetY - 10, boardSize + 20, boardSize + 20, 4, '#ffff00');

        // Draw cells
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const cellIndex = row * 3 + col;
                const x = offsetX + col * cellSize;
                const y = offsetY + row * cellSize;

                // Highlight hover/selected cell
                if (cellIndex === this.hoverCell || cellIndex === this.selectedCell) {
                    this.renderer.drawRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 'rgba(255, 255, 0, 0.2)', true);
                }

                // Draw X or O
                const symbol = this.board[cellIndex];
                if (symbol) {
                    const color = symbol === 'X' ? '#00ff00' : '#ff0000';
                    this._drawSymbol(symbol, x + cellSize/2, y + cellSize/2, cellSize * 0.6, color);
                }
            }
        }
    }

    _drawSymbol(symbol, x, y, size, color) {
        if (symbol === 'X') {
            const half = size / 2;
            this.renderer.drawLine(x - half, y - half, x + half, y + half, color, 3);
            this.renderer.drawLine(x + half, y - half, x - half, y + half, color, 3);
        } else if (symbol === 'O') {
            this.renderer.drawCircle(x, y, size / 2, color, false, 3);
        }
    }

    _drawWinnerAnimation() {
        if (!this.winner) return;

        const progress = Math.min(this.winnerAnimationTime / 2.0, 1);
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

        // Highlight winning cells
        // Use cached values (assume _drawBoard was called first)
        const cellSize = this.cellSize;
        const boardSize = this.boardSize;
        const offsetX = this.offsetX;
        const offsetY = this.offsetY;

        this.winner.cells.forEach(cellIndex => {
            const row = Math.floor(cellIndex / 3);
            const col = cellIndex % 3;
            const x = offsetX + col * cellSize;
            const y = offsetY + row * cellSize;

            this.renderer.drawRect(x + 2, y + 2, cellSize - 4, cellSize - 4,
                                 `rgba(255, 255, 0, ${alpha * 0.5})`, true);
        });

        // Pulsing winner text
        const centerX = this.renderer.width / 2;
        const pulse = Math.sin(this.winnerAnimationTime * 10) * 0.3 + 0.7;
        const winnerColor = this.winner.player === 'X' ? '#00ff00' : '#ff0000';
        this.renderer.drawText(`★ ${this.winner.player} WINS! ★`,
                             centerX, this.renderer.height / 2 + 100,
                             winnerColor, 20 + pulse * 10, 'monospace', 'center');
    }

    _drawAIThinking() {
        const centerX = this.renderer.width / 2;
        const baseY = this.renderer.height / 2 + 120;

        // Animated dots
        const time = Date.now() * 0.005;
        const dots = '...'.split('').map((dot, i) => {
            const offset = Math.sin(time + i * 2) * 5;
            return dot;
        }).join('');

        this.renderer.drawText(`AI THINKING${dots}`, centerX, baseY, '#888888', 14, 'monospace', 'center');
    }

    // ── AUDIO PLACEHOLDERS ──
    _playMoveSound() {
        // Placeholder - would play move sound
        console.log('Move sound');
    }

    _playWinSound() {
        // Placeholder - would play win sound
        console.log('Win sound');
    }

    _playDrawSound() {
        // Placeholder - would play draw sound
        console.log('Draw sound');
    }

    // ── PUBLIC API ──
    getGameState() {
        return {
            board: [...this.board],
            currentPlayer: this.currentPlayer,
            winner: this.winner,
            gameOver: this.gameOver,
            moves: this.moves,
            gameMode: this.gameMode
        };
    }

    destroy() {
        this.input.disable();
    }
}