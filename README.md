# Neon Tic Tac Toe

A fully frontend Tic Tac Toe game with a modern, animated, neon-themed UI. Play against a computer AI or invite a friend to play in real-time via a unique room link.

## Features

### Nickname Storage
- Enter your nickname when you first visit the site
- Your nickname is saved in localStorage for future visits

### Play vs Computer
- Play against a computer AI with multiple difficulty levels
- The AI uses the minimax algorithm for smarter gameplay
- Animated win/draw/loss feedback

### Play with Friend (Room System)
- Create a private room with a unique link to invite a friend
- Share the link to play in real-time with a friend
- No backend required - uses localStorage for state management

### Modern UI/UX
- Neon-style visuals with glowing X and O markers
- Animated effects for moves, wins, and game events
- Responsive design that works on both desktop and mobile
- Dark theme with vibrant neon colors

## How to Play

1. Enter your nickname when prompted
2. Choose a game mode:
   - **Play vs Computer**: Play against the AI
   - **Play with Friend**: Create a room and share the link with a friend
3. Make your moves by clicking on the board
4. The game will indicate whose turn it is and show the result when the game ends

## Technical Details

This project is built using:
- HTML5
- CSS3 (with animations and modern styling)
- Vanilla JavaScript (no frameworks)

The multiplayer functionality uses:
- localStorage for state management
- URL parameters for room sharing
- Polling for real-time updates

The AI player uses:
- Minimax algorithm with alpha-beta pruning for optimal moves
- Difficulty levels by varying the AI's strategy

## Setup and Running

There are two ways to run the game:

### Method 1: Direct HTML
Simply open `index.html` in your web browser to play. However, some features like the room sharing might not work correctly without a proper server.

### Method 2: Running the Node.js Server (Recommended)
For the best experience, especially for multiplayer, run the included Node.js server:

```bash
# Install Node.js if you don't have it already: https://nodejs.org/

# Navigate to the project directory
cd neon-tic-tac-toe

# Start the server
npm start

# The game will be available at http://localhost:3000
```

## Browser Compatibility

Works in all modern browsers including:
- Chrome
- Firefox
- Safari
- Edge

## License

MIT License 