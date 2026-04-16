// ═══════════════════════════════════════════════════════════════════
// ARCADE X - TIC TAC TOE AI SYSTEM
// "AI opponents with varying difficulty levels"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

// ── AI DIFFICULTY LEVELS ──
const AI_DIFFICULTY = {
    EASY: 'ai-easy',
    MEDIUM: 'ai-medium',
    HARD: 'ai-hard'
};

// ── AI UTILITIES ──
class TicTacToeAI {
    static getAvailableMoves(board) {
        const moves = [];
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                moves.push(i);
            }
        }
        return moves;
    }

    static isWinningMove(board, move, player) {
        // Temporarily make the move
        board[move] = player;
        const winner = this.checkWinner(board);
        board[move] = null; // Undo move

        return winner && winner.player === player;
    }

    static checkWinner(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return {
                    player: board[a],
                    cells: pattern
                };
            }
        }

        return null;
    }

    static getRandomMove(board) {
        const availableMoves = this.getAvailableMoves(board);
        if (availableMoves.length === 0) return -1;
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    static getStrategicMove(board, player) {
        const opponent = player === 'X' ? 'O' : 'X';

        // 1. Check if AI can win
        const availableMoves = this.getAvailableMoves(board);
        for (const move of availableMoves) {
            if (this.isWinningMove(board, move, player)) {
                return move;
            }
        }

        // 2. Check if AI needs to block opponent
        for (const move of availableMoves) {
            if (this.isWinningMove(board, move, opponent)) {
                return move;
            }
        }

        // 3. Take center if available
        if (board[4] === null) {
            return 4;
        }

        // 4. Take corners
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(corner => board[corner] === null);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // 5. Take any available move
        return this.getRandomMove(board);
    }

    static minimax(board, depth, isMaximizing, aiPlayer = 'O', humanPlayer = 'X') {
        const winner = this.checkWinner(board);

        // Terminal states
        if (winner) {
            if (winner.player === aiPlayer) return 10 - depth;
            if (winner.player === humanPlayer) return depth - 10;
        }

        const availableMoves = this.getAvailableMoves(board);
        if (availableMoves.length === 0) return 0; // Draw

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of availableMoves) {
                board[move] = aiPlayer;
                const evaluation = this.minimax(board, depth + 1, false, aiPlayer, humanPlayer);
                board[move] = null;
                maxEval = Math.max(maxEval, evaluation);
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of availableMoves) {
                board[move] = humanPlayer;
                const evaluation = this.minimax(board, depth + 1, true, aiPlayer, humanPlayer);
                board[move] = null;
                minEval = Math.min(minEval, evaluation);
            }
            return minEval;
        }
    }

    static getBestMove(board, aiPlayer = 'O') {
        let bestScore = -Infinity;
        let bestMove = -1;
        const availableMoves = this.getAvailableMoves(board);

        for (const move of availableMoves) {
            board[move] = aiPlayer;
            const score = this.minimax(board, 0, false, aiPlayer);
            board[move] = null;

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    // ── AI DECISION MAKING ──
    static makeMove(board, difficulty, aiPlayer = 'O') {
        switch (difficulty) {
            case AI_DIFFICULTY.EASY:
                return this.getRandomMove(board);

            case AI_DIFFICULTY.MEDIUM:
                // 70% strategic, 30% random
                return Math.random() < 0.7 ?
                    this.getStrategicMove(board, aiPlayer) :
                    this.getRandomMove(board);

            case AI_DIFFICULTY.HARD:
                return this.getBestMove(board, aiPlayer);

            default:
                return this.getRandomMove(board);
        }
    }

    // ── AI ANALYSIS ──
    static evaluatePosition(board, aiPlayer = 'O') {
        const winner = this.checkWinner(board);
        if (winner) {
            if (winner.player === aiPlayer) return 100;
            if (winner.player !== aiPlayer) return -100;
        }

        // Count potential winning lines
        let score = 0;
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const line of lines) {
            let aiCount = 0;
            let humanCount = 0;
            let emptyCount = 0;

            for (const cell of line) {
                if (board[cell] === aiPlayer) aiCount++;
                else if (board[cell] !== null) humanCount++;
                else emptyCount++;
            }

            if (aiCount === 2 && emptyCount === 1) score += 10;
            else if (humanCount === 2 && emptyCount === 1) score -= 10;
            else if (aiCount === 1 && emptyCount === 2) score += 1;
            else if (humanCount === 1 && emptyCount === 2) score -= 1;
        }

        return score;
    }
}

// ── EXPORT FOR USE IN MAIN GAME ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TicTacToeAI, AI_DIFFICULTY };
}