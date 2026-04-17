// ═══════════════════════════════════════════════════════════════════
// ARCADE X — SNAKE AI SYSTEM
// 3 tiers: Easy (random), Medium (greedy), Hard (BFS pathfinding)
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class SnakeAI {

    // ────────────────────────────────────────────
    //  UNIFIED API
    // ────────────────────────────────────────────
    /**
     * Returns the next direction for the AI snake.
     * @param {SnakeEntity} snake     – the AI snake
     * @param {object}      food      – { x, y }
     * @param {SnakeState}  state     – entire game state (for grid & other snakes)
     * @param {string}      difficulty – SNAKE_MODES key
     * @returns {string} 'UP'|'DOWN'|'LEFT'|'RIGHT'
     */
    static getMove(snake, food, state, difficulty) {
        switch (difficulty) {
            case 'ai-easy':
            case 'EASY':   return SnakeAI._easyMove(snake, state);
            case 'ai-medium':
            case 'MEDIUM': return SnakeAI._mediumMove(snake, food, state);
            case 'ai-hard':
            case 'HARD':   return SnakeAI._hardMove(snake, food, state);
            default:       return SnakeAI._easyMove(snake, state);
        }
    }

    // ────────────────────────────────────────────
    //  EASY — random safe direction
    // ────────────────────────────────────────────
    static _easyMove(snake, state) {
        const safe = SnakeAI._safeDirs(snake, state);
        if (safe.length === 0) return snake.dir; // no escape
        // Bias slightly toward current direction for smoother play
        if (safe.includes(snake.dir) && Math.random() < 0.6) return snake.dir;
        return safe[Math.floor(Math.random() * safe.length)];
    }

    // ────────────────────────────────────────────
    //  MEDIUM — greedy (closest safe step toward food)
    // ────────────────────────────────────────────
    static _mediumMove(snake, food, state) {
        if (!food) return SnakeAI._easyMove(snake, state);

        const safe = SnakeAI._safeDirs(snake, state);
        if (safe.length === 0) return snake.dir;

        // Pick the safe direction that minimizes Manhattan distance to food
        let best = safe[0];
        let bestDist = Infinity;

        for (const dir of safe) {
            const d = DIRS[dir];
            const nx = snake.head.x + d.x;
            const ny = snake.head.y + d.y;
            const dist = Math.abs(nx - food.x) + Math.abs(ny - food.y);
            if (dist < bestDist) {
                bestDist = dist;
                best = dir;
            }
        }

        return best;
    }

    // ────────────────────────────────────────────
    //  HARD — BFS shortest path, with flood-fill survival check
    // ────────────────────────────────────────────
    static _hardMove(snake, food, state) {
        if (!food) return SnakeAI._easyMove(snake, state);

        // Build occupancy grid (true = blocked)
        const blocked = SnakeAI._buildBlockedGrid(state);

        // BFS from head to food
        const path = SnakeAI._bfs(snake.head, food, blocked, state.cols, state.rows);

        if (path && path.length > 0) {
            const firstStep = path[0];
            const dir = SnakeAI._posToDir(snake.head, firstStep);

            // Safety check: will following this path trap us?
            // Clone blocked, simulate step, then flood-fill
            const testBlocked = blocked.map(row => [...row]);
            testBlocked[firstStep.y][firstStep.x] = true;
            const reachable = SnakeAI._floodFill(firstStep, testBlocked, state.cols, state.rows);

            if (reachable >= snake.body.length) {
                return dir;
            }
        }

        // Fallback: pick the safe direction with the largest open area
        return SnakeAI._survivalMove(snake, state, blocked);
    }

    // ────────────────────────────────────────────
    //  HELPERS
    // ────────────────────────────────────────────

    /** Returns all safe (non-lethal) directions */
    static _safeDirs(snake, state) {
        const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        const results = [];

        for (const dir of dirs) {
            // No 180° turns
            if (OPPOSITE[dir] === snake.dir) continue;

            const d = DIRS[dir];
            const nx = snake.head.x + d.x;
            const ny = snake.head.y + d.y;

            // Wall check
            if (nx < 0 || nx >= state.cols || ny < 0 || ny >= state.rows) continue;

            // Body / other snake collision
            let blocked = false;
            for (const s of state.snakes) {
                if (s.occupies(nx, ny, s === snake)) { // skip own head
                    blocked = true;
                    break;
                }
            }
            if (blocked) continue;

            results.push(dir);
        }

        return results;
    }

    /** Build a 2D boolean grid: true = cell is blocked */
    static _buildBlockedGrid(state) {
        const grid = Array.from({ length: state.rows }, () => Array(state.cols).fill(false));
        for (const snake of state.snakes) {
            for (let i = 0; i < snake.body.length; i++) {
                const seg = snake.body[i];
                if (seg.x >= 0 && seg.x < state.cols && seg.y >= 0 && seg.y < state.rows) {
                    grid[seg.y][seg.x] = true;
                }
            }
        }
        return grid;
    }

    /** BFS from start to goal, returns path array (excluding start) or null */
    static _bfs(start, goal, blocked, cols, rows) {
        const key = (x, y) => `${x},${y}`;
        const visited = new Set();
        visited.add(key(start.x, start.y));

        const queue = [{ x: start.x, y: start.y, path: [] }];
        const dirList = [DIRS.UP, DIRS.DOWN, DIRS.LEFT, DIRS.RIGHT];

        while (queue.length > 0) {
            const curr = queue.shift();

            for (const d of dirList) {
                const nx = curr.x + d.x;
                const ny = curr.y + d.y;

                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
                if (blocked[ny][nx]) continue;
                const k = key(nx, ny);
                if (visited.has(k)) continue;

                visited.add(k);
                const newPath = [...curr.path, { x: nx, y: ny }];

                if (nx === goal.x && ny === goal.y) return newPath;

                queue.push({ x: nx, y: ny, path: newPath });
            }
        }

        return null; // no path found
    }

    /** Flood-fill from pos, returns count of reachable cells */
    static _floodFill(pos, blocked, cols, rows) {
        const key = (x, y) => `${x},${y}`;
        const visited = new Set();
        const stack = [pos];
        let count = 0;
        const dirList = [DIRS.UP, DIRS.DOWN, DIRS.LEFT, DIRS.RIGHT];

        while (stack.length > 0) {
            const curr = stack.pop();
            const k = key(curr.x, curr.y);
            if (visited.has(k)) continue;
            visited.add(k);
            count++;

            for (const d of dirList) {
                const nx = curr.x + d.x;
                const ny = curr.y + d.y;
                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
                if (blocked[ny][nx]) continue;
                if (!visited.has(key(nx, ny))) stack.push({ x: nx, y: ny });
            }
        }

        return count;
    }

    /** Pick the safe direction that leads to the most open space */
    static _survivalMove(snake, state, blocked) {
        const safe = SnakeAI._safeDirs(snake, state);
        if (safe.length === 0) return snake.dir;

        let bestDir = safe[0];
        let bestCount = -1;

        for (const dir of safe) {
            const d = DIRS[dir];
            const nx = snake.head.x + d.x;
            const ny = snake.head.y + d.y;

            const testBlocked = blocked.map(row => [...row]);
            testBlocked[ny][nx] = true;
            const reachable = SnakeAI._floodFill({ x: nx, y: ny }, testBlocked, state.cols, state.rows);

            if (reachable > bestCount) {
                bestCount = reachable;
                bestDir = dir;
            }
        }

        return bestDir;
    }

    /** Convert two adjacent positions to a direction string */
    static _posToDir(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        if (dx === 1) return 'RIGHT';
        if (dx === -1) return 'LEFT';
        if (dy === 1) return 'DOWN';
        if (dy === -1) return 'UP';
        return 'RIGHT';
    }
}

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnakeAI };
}
