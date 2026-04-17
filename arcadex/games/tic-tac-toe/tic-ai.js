// ═══════════════════════════════════════════════════════════════════
// ARCADE X - TIC TAC TOE AI SYSTEM
// "AI opponents with 3 difficulty tiers: Easy → Medium → Hard (Minimax)"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class TicTacToeAI {

    // ── WIN PATTERN TABLE (shared with state) ──
    static WIN_PATTERNS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
        [0, 4, 8], [2, 4, 6]              // diags
    ];

    // ── BOARD UTILITIES ──

    static getAvailableMoves(board) {
        const moves = [];
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') moves.push(i);
        }
        return moves;
    }

    static checkWinner(board) {
        for (const pattern of TicTacToeAI.WIN_PATTERNS) {
            const [a, b, c] = pattern;
            if (board[a] !== '' &&
                board[a] === board[b] &&
                board[a] === board[c]) {
                return { player: board[a], cells: pattern };
            }
        }
        return null;
    }

    static isTerminal(board) {
        if (TicTacToeAI.checkWinner(board)) return true;
        return TicTacToeAI.getAvailableMoves(board).length === 0;
    }

    // ════════════════════════════════════════════
    //  EASY — Pure random from available cells
    // ════════════════════════════════════════════

    static getEasyMove(board) {
        const available = TicTacToeAI.getAvailableMoves(board);
        if (available.length === 0) return -1;
        return available[Math.floor(Math.random() * available.length)];
    }

    // ════════════════════════════════════════════
    //  MEDIUM — Block opponent + opportunistic win
    //  Falls back to strategic heuristics
    // ════════════════════════════════════════════

    static getMediumMove(board, aiPlayer = 'O') {
        const humanPlayer = aiPlayer === 'O' ? 'X' : 'O';
        const available = TicTacToeAI.getAvailableMoves(board);
        if (available.length === 0) return -1;

        // 1. Win if possible
        for (const move of available) {
            board[move] = aiPlayer;
            if (TicTacToeAI.checkWinner(board)?.player === aiPlayer) {
                board[move] = '';
                return move;
            }
            board[move] = '';
        }

        // 2. Block opponent winning
        for (const move of available) {
            board[move] = humanPlayer;
            if (TicTacToeAI.checkWinner(board)?.player === humanPlayer) {
                board[move] = '';
                return move;
            }
            board[move] = '';
        }

        // 3. Take center
        if (board[4] === '') return 4;

        // 4. Take a corner
        const corners = [0, 2, 6, 8].filter(i => board[i] === '');
        if (corners.length > 0) {
            return corners[Math.floor(Math.random() * corners.length)];
        }

        // 5. Take any edge
        return TicTacToeAI.getEasyMove(board);
    }

    // ════════════════════════════════════════════
    //  HARD — Full Minimax with alpha-beta pruning
    //  Optimal play (unbeatable)
    // ════════════════════════════════════════════

    static getHardMove(board, aiPlayer = 'O') {
        const humanPlayer = aiPlayer === 'O' ? 'X' : 'O';
        let bestScore = -Infinity;
        let bestMove = -1;
        const available = TicTacToeAI.getAvailableMoves(board);

        for (const move of available) {
            board[move] = aiPlayer;
            const score = TicTacToeAI._minimax(
                board, 0, false, aiPlayer, humanPlayer, -Infinity, Infinity
            );
            board[move] = '';

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    /**
     * Minimax with alpha-beta pruning
     * @returns {number} evaluation score
     */
    static _minimax(board, depth, isMaximizing, aiPlayer, humanPlayer, alpha, beta) {
        const winner = TicTacToeAI.checkWinner(board);
        if (winner) {
            return winner.player === aiPlayer ? (10 - depth) : (depth - 10);
        }

        const available = TicTacToeAI.getAvailableMoves(board);
        if (available.length === 0) return 0; // draw

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of available) {
                board[move] = aiPlayer;
                const evalScore = TicTacToeAI._minimax(
                    board, depth + 1, false, aiPlayer, humanPlayer, alpha, beta
                );
                board[move] = '';
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break; // prune
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of available) {
                board[move] = humanPlayer;
                const evalScore = TicTacToeAI._minimax(
                    board, depth + 1, true, aiPlayer, humanPlayer, alpha, beta
                );
                board[move] = '';
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break; // prune
            }
            return minEval;
        }
    }

    // ════════════════════════════════════════════
    //  UNIFIED DECISION API
    // ════════════════════════════════════════════

    /**
     * Returns the cell index for the AI to play
     * @param {string[]} board - 9-element board array
     * @param {string} difficulty - 'ai-easy' | 'ai-medium' | 'ai-hard'
     * @param {string} aiPlayer - which symbol the AI plays ('O' default)
     * @returns {number} cell index 0-8, or -1 if no move available
     */
    static getMove(board, difficulty, aiPlayer = 'O') {
        switch (difficulty) {
            case 'ai-easy':
            case 'EASY':
                return TicTacToeAI.getEasyMove(board);

            case 'ai-medium':
            case 'MEDIUM':
                return TicTacToeAI.getMediumMove(board, aiPlayer);

            case 'ai-hard':
            case 'HARD':
                return TicTacToeAI.getHardMove(board, aiPlayer);

            default:
                return TicTacToeAI.getEasyMove(board);
        }
    }

    // ── POSITION EVALUATION (for analysis / future features) ──
    static evaluatePosition(board, aiPlayer = 'O') {
        const winner = TicTacToeAI.checkWinner(board);
        if (winner) {
            return winner.player === aiPlayer ? 100 : -100;
        }

        let score = 0;
        for (const line of TicTacToeAI.WIN_PATTERNS) {
            let aiCount = 0, humanCount = 0, emptyCount = 0;
            for (const cell of line) {
                if (board[cell] === aiPlayer) aiCount++;
                else if (board[cell] !== '') humanCount++;
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

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TicTacToeAI };
}