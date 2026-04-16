# ArcadeX - Retro Gaming Platform

A modern web-based arcade gaming platform built with vanilla JavaScript, featuring classic games with retro CRT aesthetics and smooth 60 FPS performance.

![ArcadeX Preview](https://via.placeholder.com/800x400/000000/00ff00?text=ArcadeX+Retro+Gaming)

## 🎮 Features

### Core Engine
- **60 FPS Game Engine**: Optimized rendering pipeline with CRT visual effects
- **Modular Architecture**: Easy to add new games and features
- **Scene Management**: Smooth transitions between lobby and games
- **Input System**: Mouse, keyboard, and touch support
- **State Management**: Persistent game state and settings

### Games
- **Tic Tac Toe**: Classic strategy game with AI opponents
  - Single player vs AI (Easy, Medium, Hard difficulty)
  - AI uses minimax algorithm for perfect play
  - Smooth animations and retro visual effects

### Visual Effects
- **CRT Monitor Simulation**: Authentic arcade aesthetics
- **Scanlines**: Classic CRT display effect
- **Glow Effects**: Neon-style game elements
- **Smooth Animations**: CSS transitions and JavaScript animations
- **Pixel Art Rendering**: Crisp pixel-perfect graphics

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs locally via file:// protocol

### Running the Game
1. Clone the repository:
   ```bash
   git clone https://github.com/RAFEALSAHOO1/ArcadeX.git
   cd ArcadeX
   ```

2. Open `arcadex/landing/index.html` in your web browser

3. Click "START" to enter the arcade lobby

4. Select "TIC TAC TOE" from the game menu

5. Choose your game mode and enjoy!

## 🎯 Game Controls

### Tic Tac Toe
- **Mouse**: Click on any empty cell to make a move
- **Keyboard**: Use arrow keys to navigate, Enter to select
- **ESC**: Return to lobby

## 🏗️ Architecture

### Project Structure
```
ArcadeX/
├── arcadex/                    # Main application
│   ├── core/                   # Game engine components
│   │   ├── engine.js          # Main game loop
│   │   ├── renderer.js        # Canvas rendering & CRT effects
│   │   ├── input.js           # Input handling system
│   │   ├── scene-manager.js   # Scene transitions
│   │   ├── state-manager.js   # Game state persistence
│   │   └── game-scene.js      # Game scene management
│   ├── games/                 # Individual games
│   │   └── tic-tac-toe/       # Tic Tac Toe implementation
│   │       ├── tic.js         # Main game logic
│   │       ├── tic-ai.js      # AI algorithms
│   │       └── tic-ui.js      # UI utilities
│   └── landing/               # Landing page & lobby
│       ├── index.html         # Main HTML file
│       ├── script.js          # Application bootstrap
│       ├── lobby.js           # Lobby interface
│       ├── style.css          # Base styles
│       ├── lobby.css          # Lobby-specific styles
│       ├── crt.css            # CRT effect styles
│       ├── animations.css     # Animation definitions
│       └── audio.js           # Audio system
├── assets/                    # Static assets
│   └── fonts/                 # Custom fonts
└── README.md                  # This file
```

### Engine Architecture

#### Core Components
1. **Engine**: Main game loop managing update/render cycles at 60 FPS
2. **Renderer**: Canvas-based rendering with CRT post-processing effects
3. **Input Manager**: Unified input handling for keyboard, mouse, and touch
4. **Scene Manager**: Manages transitions between different game screens
5. **State Manager**: Handles game state persistence and configuration
6. **Game Scene Manager**: Bridges the lobby with individual games

#### Game Structure
Each game implements a standard interface:
```javascript
class Game {
    init(gameMode)        // Initialize the game
    update(deltaTime)     // Update game logic
    render(deltaTime)     // Render the game
    handleInput(deltaTime)// Process user input
    destroy()             // Cleanup resources
}
```

## 🔧 Development Setup

### Prerequisites
- Git for version control
- Modern code editor (VS Code recommended)
- Local web server (optional, but recommended for some features)

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-game`
3. Make your changes
4. Test locally by opening `index.html` in a browser
5. Commit your changes: `git commit -m "Add new feature"`
6. Push to your fork: `git push origin feature/new-game`
7. Create a Pull Request

### Adding New Games
1. Create a new directory under `arcadex/games/`
2. Implement the game class following the standard interface
3. Add the game to the lobby menu in `lobby.js`
4. Update the game scene manager in `game-scene.js`

### Performance Optimization
- Canvas contexts use `willReadFrequently: true` for optimal performance
- CRT effects are selectively applied to maintain 60 FPS
- Rendering calculations are cached where possible
- AI algorithms are optimized for real-time play

## 🎨 Customization

### Visual Themes
Modify `crt.css` and `style.css` to customize:
- Color schemes
- CRT effect intensity
- Font styles
- Animation timings

### Game Difficulty
Adjust AI difficulty in game-specific files:
- `tic-ai.js`: Modify minimax depth or random move probability

### Audio Settings
Configure sound effects in `audio.js`:
- Volume levels
- Sound file paths
- Audio context settings

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Code Style
- Use modern ES6+ JavaScript features
- Follow consistent naming conventions
- Add JSDoc comments for public methods
- Keep functions small and focused
- Use meaningful variable names

### Pull Request Process
1. Ensure your code passes basic testing
2. Update documentation if needed
3. Add tests for new features
4. Follow the existing code style
5. Write clear, concise commit messages

### Areas for Contribution
- **New Games**: Implement classic arcade games
- **Visual Effects**: Enhance CRT simulation
- **Audio System**: Add sound effects and music
- **Performance**: Optimize rendering and AI algorithms
- **Accessibility**: Improve keyboard navigation and screen reader support

## 📊 Performance Metrics

- **Target FPS**: 60 FPS
- **Canvas Resolution**: 800x600 (configurable)
- **Memory Usage**: Minimal, no external dependencies
- **Load Time**: <1 second on modern browsers
- **Compatibility**: Works on all modern browsers

## 🐛 Known Issues & Limitations

- Local file access requires browser permissions for some features
- Audio may not work in all browsers due to security restrictions
- Touch input optimized for mobile but may need adjustments
- Some CRT effects disabled by default for performance

## 📄 License

This project is open source. Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- Built with vanilla JavaScript for maximum compatibility
- Inspired by classic arcade gaming experiences
- CRT effect algorithms based on retro display simulation techniques

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Ensure you're using a modern browser
3. Try clearing browser cache
4. Check GitHub Issues for known problems

---

**Enjoy gaming the retro way! 🎮✨**