/**
 * Game logic and rules for Tic Tac Toe
 */

// Game rules module
const GameRules = (function() {
    // Winning patterns (row, column, diagonal)
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // Check for a winner
    function checkWinner(board) {
        // Check winning patterns
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a]; // Return the winner (X or O)
            }
        }
        
        // Check for tie (if board is full)
        if (!board.includes('')) {
            return 'tie';
        }
        
        // No winner yet
        return null;
    }

    // Get the winning pattern if there is a winner
    function getWinningPattern(board) {
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return pattern;
            }
        }
        return null;
    }

    // Return public methods
    return {
        checkWinner,
        getWinningPattern,
        winPatterns
    };
})();

// Game Engine module
const GameEngine = (function() {
    // Game state
    let state = {
        board: Array(9).fill(''),
        currentPlayer: 'X',
        gameMode: null, // 'ai' or 'multiplayer'
        difficulty: 'medium', // 'easy', 'medium', 'hard'
        playerMark: 'X',
        aiMark: 'O',
        roomId: null,
        isPlayerTurn: true,
        gameActive: false,
        winner: null,
        winningPattern: null
    };

    // Initialize the game
    function init(gameMode, options = {}) {
        // Reset the board
        state.board = Array(9).fill('');
        
        // Set game mode
        state.gameMode = gameMode;
        
        // Configure options
        if (options.difficulty) state.difficulty = options.difficulty;
        if (options.playerMark) {
            state.playerMark = options.playerMark;
            state.aiMark = options.playerMark === 'X' ? 'O' : 'X';
        }
        if (options.roomId) state.roomId = options.roomId;
        
        // Set initial player
        state.currentPlayer = 'X';
        state.isPlayerTurn = state.playerMark === 'X';
        
        // Reset game state
        state.gameActive = true;
        state.winner = null;
        state.winningPattern = null;
        
        // If AI goes first, make the AI move
        if (state.gameMode === 'ai' && !state.isPlayerTurn) {
            makeAIMove();
        }
        
        // Return current state
        return { ...state };
    }

    // Make a move on the board
    function makeMove(index) {
        // Do nothing if the game is over or the cell is already filled
        if (!state.gameActive || state.board[index] !== '') {
            return null;
        }
        
        // Do nothing if it's not the player's turn in AI mode
        if (state.gameMode === 'ai' && !state.isPlayerTurn) {
            return null;
        }
        
        // Update the board
        state.board[index] = state.currentPlayer;
        
        // Check for a winner
        const result = GameRules.checkWinner(state.board);
        
        if (result) {
            // We have a winner or a tie
            state.gameActive = false;
            state.winner = result;
            
            if (result !== 'tie') {
                state.winningPattern = GameRules.getWinningPattern(state.board);
            }
            
            return { ...state, moveResult: 'end', winner: result };
        }
        
        // Switch players
        state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
        state.isPlayerTurn = (state.gameMode === 'ai') 
            ? !state.isPlayerTurn 
            : true; // In multiplayer, the current device is always the player
        
        // If playing against AI and it's the AI's turn, make the AI move
        if (state.gameMode === 'ai' && !state.isPlayerTurn) {
            return { ...state, moveResult: 'success', nextAction: 'ai-move' };
        }
        
        return { ...state, moveResult: 'success' };
    }

    // Make an AI move
    function makeAIMove() {
        if (!state.gameActive || state.isPlayerTurn) {
            return null;
        }
        
        // Use the AI to find the best move
        const move = ComputerAI.makeMove(
            state.board,
            state.difficulty,
            state.playerMark,
            state.aiMark
        );
        
        // Make the move
        if (move !== -1) {
            setTimeout(() => {
                makeMove(move);
                // Notify UI of the AI move
                if (typeof window.GameUI !== 'undefined') {
                    window.GameUI.updateBoard(state);
                }
            }, 600); // Slight delay to make it feel more natural
        }
        
        return { ...state };
    }

    // Get the current state
    function getState() {
        return { ...state };
    }

    // Update state from external source (for multiplayer)
    function updateState(newState) {
        // Update only the necessary state properties
        if (newState.board) state.board = [...newState.board];
        if (newState.currentPlayer) state.currentPlayer = newState.currentPlayer;
        if (newState.winner !== undefined) state.winner = newState.winner;
        if (newState.winningPattern !== undefined) state.winningPattern = newState.winningPattern;
        if (newState.gameActive !== undefined) state.gameActive = newState.gameActive;
        
        return { ...state };
    }

    // Return public methods
    return {
        init,
        makeMove,
        makeAIMove,
        getState,
        updateState
    };
})();

// Make the game modules available globally
window.GameRules = GameRules;
window.GameEngine = GameEngine; 