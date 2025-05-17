/**
 * AI module for the computer player
 */

const ComputerAI = (function() {
    // Constants for the minimax algorithm
    const SCORES = {
        X: 10,  // AI wins
        O: -10, // Player wins
        tie: 0  // Draw
    };

    // Check if a player can win in the next move and return the winning cell
    function findWinningMove(board, player) {
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                // Try this move
                board[i] = player;
                
                // Check if this move results in a win
                if (GameRules.checkWinner(board) === player) {
                    // Undo the move and return the index
                    board[i] = '';
                    return i;
                }
                
                // Undo the move
                board[i] = '';
            }
        }
        return -1; // No winning move found
    }

    // Make a random move
    function makeRandomMove(board) {
        const emptyCells = [];
        
        // Find all empty cells
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                emptyCells.push(i);
            }
        }
        
        // Return a random empty cell
        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            return emptyCells[randomIndex];
        }
        
        return -1; // No empty cells (shouldn't happen)
    }

    // Basic AI strategy - combination of tactics
    function makeStrategicMove(board, difficulty, playerMark, aiMark) {
        // First check if AI can win in this move
        const winningMove = findWinningMove(board, aiMark);
        if (winningMove !== -1) {
            return winningMove;
        }
        
        // If opponent can win in the next move, block them
        const blockingMove = findWinningMove(board, playerMark);
        if (blockingMove !== -1) {
            return blockingMove;
        }
        
        // If medium difficulty, sometimes make a random move instead of best move
        if (difficulty === 'easy' || (difficulty === 'medium' && Math.random() < 0.3)) {
            return makeRandomMove(board);
        }
        
        // Try to take the center if it's available
        if (board[4] === '') {
            return 4;
        }
        
        // Try to take the corners
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Take any available side
        const sides = [1, 3, 5, 7];
        const availableSides = sides.filter(i => board[i] === '');
        if (availableSides.length > 0) {
            return availableSides[Math.floor(Math.random() * availableSides.length)];
        }
        
        // Fallback to random move (shouldn't reach here)
        return makeRandomMove(board);
    }

    // Minimax algorithm for hard difficulty
    function minimax(board, depth, isMaximizing, alpha, beta, aiMark, playerMark) {
        const result = GameRules.checkWinner(board);
        
        // Terminal states
        if (result === aiMark) return SCORES.X;
        if (result === playerMark) return SCORES.O;
        if (result === 'tie') return SCORES.tie;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = aiMark;
                    let score = minimax(board, depth + 1, false, alpha, beta, aiMark, playerMark);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                    
                    // Alpha-beta pruning
                    alpha = Math.max(alpha, bestScore);
                    if (beta <= alpha) break;
                }
            }
            
            return bestScore;
        } else {
            let bestScore = Infinity;
            
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = playerMark;
                    let score = minimax(board, depth + 1, true, alpha, beta, aiMark, playerMark);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                    
                    // Alpha-beta pruning
                    beta = Math.min(beta, bestScore);
                    if (beta <= alpha) break;
                }
            }
            
            return bestScore;
        }
    }

    // Find the best move using minimax
    function findBestMove(board, aiMark, playerMark, difficulty) {
        // If easy or medium difficulty, use strategic move
        if (difficulty === 'easy' || difficulty === 'medium') {
            return makeStrategicMove(board, difficulty, playerMark, aiMark);
        }
        
        let bestScore = -Infinity;
        let bestMove = -1;
        
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = aiMark;
                let score = minimax(board, 0, false, -Infinity, Infinity, aiMark, playerMark);
                board[i] = '';
                
                // If we found a better move
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    }

    // Return the public methods
    return {
        makeMove: function(board, difficulty, playerMark, aiMark) {
            return findBestMove(board, aiMark, playerMark, difficulty);
        }
    };
})();

// Make the AI available globally
window.ComputerAI = ComputerAI; 