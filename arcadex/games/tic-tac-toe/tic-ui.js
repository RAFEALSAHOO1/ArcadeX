// ═══════════════════════════════════════════════════════════════════
// ARCADE X - TIC TAC TOE UI SYSTEM
// "UI rendering utilities and effects for Tic Tac Toe"
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class TicTacToeUI {
    constructor(renderer) {
        this.renderer = renderer;
    }

    // ── BOARD RENDERING ──
    drawGameBoard(board, cellSize, offsetX, offsetY, hoverCell = -1, selectedCell = -1) {
        const boardSize = cellSize * 3;

        // Draw background
        this.renderer.drawRect(offsetX - 10, offsetY - 10, boardSize + 20, boardSize + 20, '#111111', true);

        // Draw grid
        this.renderer.drawGrid(offsetX, offsetY, boardSize, boardSize, cellSize, '#333333', 2);

        // Draw arcade-style border
        this.drawArcadeBorder(offsetX - 15, offsetY - 15, boardSize + 30, boardSize + 30, 4, '#ffff00');

        // Draw cells
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const cellIndex = row * 3 + col;
                const x = offsetX + col * cellSize;
                const y = offsetY + row * cellSize;

                // Cell background
                let cellColor = '#000000';
                if (cellIndex === hoverCell) {
                    cellColor = 'rgba(255, 255, 0, 0.1)';
                } else if (cellIndex === selectedCell) {
                    cellColor = 'rgba(0, 255, 0, 0.1)';
                }

                this.renderer.drawRect(x + 2, y + 2, cellSize - 4, cellSize - 4, cellColor, true);

                // Draw symbol
                const symbol = board[cellIndex];
                if (symbol) {
                    const color = symbol === 'X' ? '#00ff00' : '#ff0000';
                    this.drawSymbol(symbol, x + cellSize/2, y + cellSize/2, cellSize * 0.6, color);
                }
            }
        }
    }

    // ── SYMBOL RENDERING ──
    drawSymbol(symbol, x, y, size, color, lineWidth = 3) {
        this.renderer.ctx.strokeStyle = color;
        this.renderer.ctx.lineWidth = lineWidth;
        this.renderer.ctx.lineCap = 'round';
        this.renderer.ctx.lineJoin = 'round';

        if (symbol === 'X') {
            const half = size / 2;
            const offset = size * 0.1;

            this.renderer.ctx.beginPath();
            this.renderer.ctx.moveTo(x - half + offset, y - half + offset);
            this.renderer.ctx.lineTo(x + half - offset, y + half - offset);
            this.renderer.ctx.moveTo(x + half - offset, y - half + offset);
            this.renderer.ctx.lineTo(x - half + offset, y + half - offset);
            this.renderer.ctx.stroke();
        } else if (symbol === 'O') {
            this.renderer.ctx.beginPath();
            this.renderer.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            this.renderer.ctx.stroke();
        }
    }

    // ── UI ELEMENTS ──
    drawTitle(text, x, y, color = '#00ff00', size = 24) {
        // Main title
        this.renderer.drawText(text, x, y, color, size, 'monospace', 'center');

        // Glow effect
        this.renderer.ctx.shadowColor = color;
        this.renderer.ctx.shadowBlur = 10;
        this.renderer.drawText(text, x, y, color, size, 'monospace', 'center');
        this.renderer.ctx.shadowBlur = 0;
    }

    drawStatus(text, x, y, color = '#ffffff', size = 16) {
        this.renderer.drawText(text, x, y, color, size, 'monospace', 'center');
    }

    drawControlsHint(text, x, y, color = '#666666', size = 12) {
        this.renderer.drawText(text, x, y, color, size, 'monospace', 'center');
    }

    // ── ANIMATIONS ──
    drawWinnerAnimation(winner, cells, animationTime, cellSize, offsetX, offsetY) {
        if (!winner) return;

        const progress = Math.min(animationTime / 2.0, 1);
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

        // Highlight winning cells with pulsing effect
        cells.forEach(cellIndex => {
            const row = Math.floor(cellIndex / 3);
            const col = cellIndex % 3;
            const x = offsetX + col * cellSize;
            const y = offsetY + row * cellSize;

            const pulse = Math.sin(animationTime * 8) * 0.2 + 0.8;
            this.renderer.drawRect(x + 2, y + 2, cellSize - 4, cellSize - 4,
                                 `rgba(255, 255, 0, ${alpha * pulse * 0.5})`, true);
        });

        // Winner text with pulsing effect
        const pulse = Math.sin(animationTime * 10) * 0.3 + 0.7;
        const winnerColor = winner === 'X' ? '#00ff00' : '#ff0000';
        const winnerText = `★ ${winner} WINS! ★`;

        this.renderer.ctx.shadowColor = winnerColor;
        this.renderer.ctx.shadowBlur = 5 + pulse * 10;
        this.renderer.drawText(winnerText, this.renderer.width / 2, this.renderer.height / 2 + 100,
                             winnerColor, 20 + pulse * 10, 'monospace', 'center');
        this.renderer.ctx.shadowBlur = 0;
    }

    drawDrawAnimation(animationTime) {
        const progress = Math.min(animationTime / 2.0, 1);
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        const pulse = Math.sin(animationTime * 8) * 0.2 + 0.8;

        const drawText = 'DRAW GAME!';
        this.renderer.ctx.shadowColor = '#ffff00';
        this.renderer.ctx.shadowBlur = pulse * 15;
        this.renderer.drawText(drawText, this.renderer.width / 2, this.renderer.height / 2 + 100,
                             `rgba(255, 255, 0, ${alpha})`, 24, 'monospace', 'center');
        this.renderer.ctx.shadowBlur = 0;
    }

    drawAIThinking(animationTime, x, y) {
        // Animated dots
        const time = animationTime * 5;
        const dots = '...'.split('').map((dot, i) => {
            const offset = Math.sin(time + i * 2) * 2;
            return { char: dot, offset: offset };
        });

        let text = 'AI THINKING';
        let currentX = x;

        dots.forEach((dot, i) => {
            this.renderer.drawText(dot.char, currentX, y + dot.offset, '#888888', 14, 'monospace', 'left');
            currentX += 8; // Approximate character width
        });

        this.renderer.drawText(text, x - 60, y, '#888888', 14, 'monospace', 'left');
    }

    // ── BORDERS AND EFFECTS ──
    drawArcadeBorder(x, y, width, height, borderWidth = 4, color = '#ffff00') {
        // Outer border
        this.renderer.drawRect(x, y, width, height, color, false, borderWidth);

        // Inner highlight
        this.renderer.drawRect(x + borderWidth/2, y + borderWidth/2,
                             width - borderWidth, height - borderWidth,
                             '#ffffff', false, 1);
    }

    drawPixelBorder(x, y, width, height, color = '#00ff00', thickness = 2) {
        // Top
        this.renderer.drawRect(x, y, width, thickness, color, true);
        // Bottom
        this.renderer.drawRect(x, y + height - thickness, width, thickness, color, true);
        // Left
        this.renderer.drawRect(x, y, thickness, height, color, true);
        // Right
        this.renderer.drawRect(x + width - thickness, y, thickness, height, color, true);
    }

    // ── MENU ELEMENTS ──
    drawMenuOption(text, x, y, selected = false, color = '#ffffff', selectedColor = '#00ff00') {
        const displayColor = selected ? selectedColor : color;
        const prefix = selected ? '► ' : '  ';

        this.renderer.drawText(`${prefix}${text}`, x, y, displayColor, 16, 'monospace', 'left');

        if (selected) {
            // Selection indicator
            this.renderer.drawRect(x - 25, y - 8, 15, 16, selectedColor, true);
        }
    }

    drawProgressBar(x, y, width, height, progress, bgColor = '#333333', fillColor = '#00ff00') {
        // Background
        this.renderer.drawRect(x, y, width, height, bgColor, true);

        // Fill
        const fillWidth = width * Math.max(0, Math.min(1, progress));
        this.renderer.drawRect(x, y, fillWidth, height, fillColor, true);

        // Border
        this.renderer.drawRect(x, y, width, height, '#ffffff', false, 1);
    }

    // ── PARTICLE EFFECTS ──
    drawParticles(particles) {
        particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.renderer.drawCircle(particle.x, particle.y, particle.size,
                                   `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`,
                                   true);
        });
    }

    createWinParticles(centerX, centerY, count = 20) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 60, // frames
                maxLife: 60,
                size: Math.random() * 3 + 1,
                color: {
                    r: Math.floor(Math.random() * 100) + 155,
                    g: Math.floor(Math.random() * 100) + 155,
                    b: Math.floor(Math.random() * 100)
                }
            });
        }
        return particles;
    }

    updateParticles(particles, deltaTime) {
        particles.forEach(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 100 * deltaTime; // Gravity
            particle.life -= 1;
        });

        // Remove dead particles
        return particles.filter(p => p.life > 0);
    }
}

// ── EXPORT FOR USE IN MAIN GAME ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TicTacToeUI;
}