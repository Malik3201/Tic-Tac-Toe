/**
 * Main application script
 * Initializes the game and sets up any necessary event listeners
 */

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI
    GameUI.init();
    
    // Handle history state changes (for back/forward navigation)
    window.addEventListener('popstate', function(event) {
        const roomId = GameUtils.getRoomIdFromUrl();
        
        // If the URL contains a room ID, try to join it
        if (roomId) {
            const nickname = GameUtils.getNickname();
            
            if (nickname) {
                // We have a nickname, try to join
                const mpState = MultiplayerManager.getState();
                
                // Only join if we're not already in this room
                if (mpState.roomId !== roomId) {
                    // If we're in another room, leave it first
                    if (mpState.roomId) {
                        MultiplayerManager.leaveRoom();
                    }
                    
                    // Try to join the new room
                    const result = MultiplayerManager.joinRoom(roomId);
                    
                    if (result.success) {
                        // Initialize game engine
                        GameEngine.init('multiplayer', { roomId: roomId, playerMark: result.playerMark });
                        
                        // Update UI
                        GameUI.updateBoard(GameEngine.getState());
                        
                        // Start polling for updates
                        MultiplayerManager.startPolling(function(update) {
                            // This will be handled by the UI's handleMultiplayerUpdate
                            // but we need to pass the updates to the game engine
                            if (update.type === 'state-update') {
                                GameEngine.updateState(update.gameState);
                                GameUI.updateBoard(GameEngine.getState());
                            }
                        });
                    }
                }
            }
        } else {
            // No room ID in URL, go back to menu
            const gameState = GameEngine.getState();
            
            if (gameState.gameMode === 'multiplayer') {
                MultiplayerManager.leaveRoom();
            }
        }
    });
    
    // Handle URL sharing/direct access via URL
    function handleDirectAccess() {
        const roomId = GameUtils.getRoomIdFromUrl();
        
        if (roomId) {
            // Update browser history
            const url = new URL(window.location.href);
            url.pathname = `/room/${roomId}`;
            url.search = '';
            
            // Update history without triggering a reload
            window.history.replaceState({ roomId }, '', url.href);
            
            // Join the room
            const nickname = GameUtils.getNickname();
            
            if (nickname) {
                setTimeout(() => {
                    // Join room via UI (which handles all the setup)
                    // The UI module will check for a room ID in the URL
                }, 100);
            }
        }
    }
    
    // Call the handler
    handleDirectAccess();
}); 