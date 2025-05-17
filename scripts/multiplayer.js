/**
 * Multiplayer module for Tic Tac Toe
 * Uses localStorage to simulate real-time gameplay between two users
 */

const MultiplayerManager = (function() {
    // Constants
    const STORAGE_KEY_PREFIX = 'neon-ttt-room-';
    const POLL_INTERVAL = 500; // 500ms polling interval
    
    // State
    let state = {
        roomId: null,
        isHost: false,
        playerMark: null,
        opponentName: null,
        pollInterval: null,
        lastUpdateTime: 0
    };
    
    // Create a new room
    function createRoom() {
        // Generate a room ID
        const roomId = GameUtils.generateRoomId();
        
        // Set up the room in localStorage
        const roomData = {
            board: Array(9).fill(''),
            currentPlayer: 'X',
            hostMark: 'X',
            guestMark: 'O',
            hostName: GameUtils.getNickname() || 'Player 1',
            guestName: null,
            lastUpdateTime: Date.now(),
            gameActive: true,
            winner: null,
            winningPattern: null
        };
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY_PREFIX + roomId, JSON.stringify(roomData));
        
        // Update local state
        state.roomId = roomId;
        state.isHost = true;
        state.playerMark = 'X';
        
        // Return room info
        return {
            roomId,
            isHost: true,
            playerMark: 'X',
            shareUrl: getShareUrl(roomId)
        };
    }
    
    // Join an existing room
    function joinRoom(roomId) {
        // Check if room exists
        const roomData = getRoomData(roomId);
        
        if (!roomData) {
            return { success: false, error: 'Room not found' };
        }
        
        // Check if room already has a guest
        if (roomData.guestName) {
            return { success: false, error: 'Room is full' };
        }
        
        // Update room with guest info
        roomData.guestName = GameUtils.getNickname() || 'Player 2';
        roomData.lastUpdateTime = Date.now();
        
        // Save updated room data
        localStorage.setItem(STORAGE_KEY_PREFIX + roomId, JSON.stringify(roomData));
        
        // Update local state
        state.roomId = roomId;
        state.isHost = false;
        state.playerMark = 'O';
        state.opponentName = roomData.hostName;
        
        // Return success
        return {
            success: true,
            roomId,
            isHost: false,
            playerMark: 'O',
            opponentName: roomData.hostName
        };
    }
    
    // Make a move in the multiplayer game
    function makeMove(index) {
        if (!state.roomId) {
            return { success: false, error: 'Not in a room' };
        }
        
        // Get current room data
        const roomData = getRoomData(state.roomId);
        
        if (!roomData) {
            return { success: false, error: 'Room not found' };
        }
        
        // Check if it's this player's turn
        const isPlayerTurn = (roomData.currentPlayer === 'X' && state.playerMark === 'X') ||
                             (roomData.currentPlayer === 'O' && state.playerMark === 'O');
        
        if (!isPlayerTurn) {
            return { success: false, error: 'Not your turn' };
        }
        
        // Check if the move is valid
        if (!roomData.gameActive || roomData.board[index] !== '') {
            return { success: false, error: 'Invalid move' };
        }
        
        // Make the move
        roomData.board[index] = roomData.currentPlayer;
        
        // Check for win or tie
        const result = GameRules.checkWinner(roomData.board);
        
        if (result) {
            roomData.gameActive = false;
            roomData.winner = result;
            
            if (result !== 'tie') {
                roomData.winningPattern = GameRules.getWinningPattern(roomData.board);
            }
        } else {
            // Switch current player
            roomData.currentPlayer = roomData.currentPlayer === 'X' ? 'O' : 'X';
        }
        
        // Update timestamp
        roomData.lastUpdateTime = Date.now();
        
        // Save updated room data
        localStorage.setItem(STORAGE_KEY_PREFIX + state.roomId, JSON.stringify(roomData));
        
        // Return the updated state
        return {
            success: true,
            gameState: {
                board: roomData.board,
                currentPlayer: roomData.currentPlayer,
                gameActive: roomData.gameActive,
                winner: roomData.winner,
                winningPattern: roomData.winningPattern
            }
        };
    }
    
    // Start polling for updates
    function startPolling(callback) {
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
        }
        
        // Set last update time
        state.lastUpdateTime = Date.now();
        
        // Start polling
        state.pollInterval = setInterval(() => {
            if (!state.roomId) {
                return;
            }
            
            const roomData = getRoomData(state.roomId);
            
            if (!roomData) {
                clearInterval(state.pollInterval);
                if (callback) callback({ type: 'error', message: 'Room not found' });
                return;
            }
            
            // Check if there's an update
            if (roomData.lastUpdateTime > state.lastUpdateTime) {
                state.lastUpdateTime = roomData.lastUpdateTime;
                
                // Update opponent name if needed
                if (!state.opponentName) {
                    state.opponentName = state.isHost ? roomData.guestName : roomData.hostName;
                    
                    // If opponent joined, notify
                    if (state.isHost && roomData.guestName) {
                        if (callback) callback({ 
                            type: 'player-joined',
                            opponentName: roomData.guestName
                        });
                    }
                }
                
                // Return game state update
                if (callback) callback({
                    type: 'state-update',
                    gameState: {
                        board: roomData.board,
                        currentPlayer: roomData.currentPlayer,
                        gameActive: roomData.gameActive,
                        winner: roomData.winner,
                        winningPattern: roomData.winningPattern
                    },
                    isPlayerTurn: (roomData.currentPlayer === 'X' && state.playerMark === 'X') ||
                                 (roomData.currentPlayer === 'O' && state.playerMark === 'O')
                });
            }
        }, POLL_INTERVAL);
    }
    
    // Stop polling
    function stopPolling() {
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
            state.pollInterval = null;
        }
    }
    
    // Restart the game
    function restartGame() {
        if (!state.roomId || !state.isHost) {
            return { success: false, error: 'Only the host can restart the game' };
        }
        
        // Get current room data
        const roomData = getRoomData(state.roomId);
        
        if (!roomData) {
            return { success: false, error: 'Room not found' };
        }
        
        // Reset the game
        roomData.board = Array(9).fill('');
        roomData.currentPlayer = 'X';
        roomData.gameActive = true;
        roomData.winner = null;
        roomData.winningPattern = null;
        roomData.lastUpdateTime = Date.now();
        
        // Save updated room data
        localStorage.setItem(STORAGE_KEY_PREFIX + state.roomId, JSON.stringify(roomData));
        
        // Return success
        return {
            success: true,
            gameState: {
                board: roomData.board,
                currentPlayer: roomData.currentPlayer,
                gameActive: roomData.gameActive,
                winner: roomData.winner,
                winningPattern: roomData.winningPattern
            }
        };
    }
    
    // Leave the room
    function leaveRoom() {
        if (!state.roomId) {
            return { success: false, error: 'Not in a room' };
        }
        
        // If host, remove the room
        if (state.isHost) {
            localStorage.removeItem(STORAGE_KEY_PREFIX + state.roomId);
        } else {
            // If guest, update room to remove guest
            const roomData = getRoomData(state.roomId);
            
            if (roomData) {
                roomData.guestName = null;
                roomData.lastUpdateTime = Date.now();
                localStorage.setItem(STORAGE_KEY_PREFIX + state.roomId, JSON.stringify(roomData));
            }
        }
        
        // Stop polling
        stopPolling();
        
        // Reset state
        state.roomId = null;
        state.isHost = false;
        state.playerMark = null;
        state.opponentName = null;
        
        return { success: true };
    }
    
    // Helper: Get room data from localStorage
    function getRoomData(roomId) {
        const data = localStorage.getItem(STORAGE_KEY_PREFIX + roomId);
        
        if (!data) {
            return null;
        }
        
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Error parsing room data:', e);
            return null;
        }
    }
    
    // Helper: Generate a share URL for the room
    function getShareUrl(roomId) {
        const url = new URL(window.location.href);
        url.pathname = `/room/${roomId}`;
        
        // Remove any existing query parameters
        url.search = '';
        
        return url.href;
    }
    
    // Return public methods
    return {
        createRoom,
        joinRoom,
        makeMove,
        startPolling,
        stopPolling,
        restartGame,
        leaveRoom,
        getState: () => ({ ...state })
    };
})();

// Make the multiplayer manager available globally
window.MultiplayerManager = MultiplayerManager; 