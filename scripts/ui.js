/**
 * UI module for handling the user interface
 */

const GameUI = (function() {
    // DOM elements
    let elements = {
        cells: null,
        statusMessage: null,
        restartBtn: null,
        menuBtn: null,
        winLine: null,
        playerName: null,
        roomInfo: null,
        roomId: null,
        copyLinkBtn: null
    };

    // UI state
    let state = {
        activeScreen: 'welcome',
        nicknameSet: false
    };

    // Initialize the UI
    function init() {
        // Cache DOM elements
        elements.cells = document.querySelectorAll('.cell');
        elements.statusMessage = document.getElementById('status-message');
        elements.restartBtn = document.getElementById('restart-game');
        elements.menuBtn = document.getElementById('back-to-menu');
        elements.winLine = document.getElementById('win-line');
        elements.playerName = document.getElementById('player-name');
        elements.roomInfo = document.getElementById('room-info');
        elements.roomId = document.getElementById('room-id');
        elements.copyLinkBtn = document.getElementById('copy-link');
        
        // Add event listeners
        document.getElementById('vs-computer').addEventListener('click', startAIGame);
        document.getElementById('vs-friend').addEventListener('click', startMultiplayerGame);
        document.getElementById('change-name').addEventListener('click', showNicknameModal);
        document.getElementById('save-nickname').addEventListener('click', saveNickname);
        elements.restartBtn.addEventListener('click', restartGame);
        elements.menuBtn.addEventListener('click', backToMenu);
        document.getElementById('play-again').addEventListener('click', restartGame);
        document.getElementById('result-menu').addEventListener('click', backToMenu);
        elements.copyLinkBtn.addEventListener('click', copyRoomLink);
        document.getElementById('copy-share-link').addEventListener('click', copyShareLink);
        
        // Add event listeners to cells
        elements.cells.forEach(cell => {
            cell.addEventListener('click', () => makeMove(parseInt(cell.dataset.index)));
        });
        
        // Check for nickname
        const nickname = GameUtils.getNickname();
        if (nickname) {
            elements.playerName.textContent = nickname;
            state.nicknameSet = true;
        } else {
            showNicknameModal();
        }
        
        // Check for room ID in URL
        const roomId = GameUtils.getRoomIdFromUrl();
        if (roomId) {
            joinRoom(roomId);
        }
    }

    // Show the nickname modal
    function showNicknameModal() {
        GameUtils.toggleElementVisibility('#nickname-modal', true);
        document.getElementById('nickname-input').focus();
        
        // Add enter key support
        document.getElementById('nickname-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveNickname();
            }
        });
    }

    // Save the nickname
    function saveNickname() {
        const input = document.getElementById('nickname-input');
        const nickname = input.value.trim();
        
        if (nickname) {
            GameUtils.saveNickname(nickname);
            elements.playerName.textContent = nickname;
            state.nicknameSet = true;
            GameUtils.toggleElementVisibility('#nickname-modal', false);
            
            // If joining a room, continue with room join
            const roomId = GameUtils.getRoomIdFromUrl();
            if (roomId && state.activeScreen === 'welcome') {
                joinRoom(roomId);
            }
        }
    }

    // Switch to a different screen
    function switchScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the target screen
        document.getElementById(screenId + '-screen').classList.add('active');
        
        // Update state
        state.activeScreen = screenId;
    }

    // Start a game against the AI
    function startAIGame() {
        if (!state.nicknameSet) {
            showNicknameModal();
            return;
        }
        
        // Initialize the game engine
        GameEngine.init('ai', { difficulty: 'medium' });
        
        // Reset the board
        resetBoard();
        
        // Hide room info
        elements.roomInfo.classList.add('hidden');
        
        // Update status message
        updateStatusMessage();
        
        // Switch to game screen
        switchScreen('game');
    }

    // Start a multiplayer game
    function startMultiplayerGame() {
        if (!state.nicknameSet) {
            showNicknameModal();
            return;
        }
        
        // Create a new room
        const roomInfo = MultiplayerManager.createRoom();
        
        // Show waiting modal
        GameUtils.toggleElementVisibility('#waiting-modal', true);
        
        // Set share URL
        document.getElementById('share-url').value = roomInfo.shareUrl;
        
        // Update room ID display
        elements.roomId.textContent = roomInfo.roomId;
        elements.roomInfo.classList.remove('hidden');
        
        // Initialize game engine
        GameEngine.init('multiplayer', { roomId: roomInfo.roomId });
        
        // Reset the board
        resetBoard();
        
        // Update status message
        elements.statusMessage.textContent = 'Waiting for opponent...';
        
        // Switch to game screen
        switchScreen('game');
        
        // Start polling for updates
        MultiplayerManager.startPolling(handleMultiplayerUpdate);
    }

    // Join an existing room
    function joinRoom(roomId) {
        if (!state.nicknameSet) {
            showNicknameModal();
            return;
        }
        
        // Try to join the room
        const result = MultiplayerManager.joinRoom(roomId);
        
        if (!result.success) {
            alert(result.error);
            return;
        }
        
        // Update room ID display
        elements.roomId.textContent = roomId;
        elements.roomInfo.classList.remove('hidden');
        
        // Initialize game engine
        GameEngine.init('multiplayer', { roomId: roomId, playerMark: result.playerMark });
        
        // Reset the board
        resetBoard();
        
        // Update status message
        updateStatusMessage();
        
        // Switch to game screen
        switchScreen('game');
        
        // Start polling for updates
        MultiplayerManager.startPolling(handleMultiplayerUpdate);
    }

    // Handle multiplayer updates
    function handleMultiplayerUpdate(update) {
        if (update.type === 'error') {
            alert(update.message);
            backToMenu();
            return;
        }
        
        if (update.type === 'player-joined') {
            // Hide waiting modal
            GameUtils.toggleElementVisibility('#waiting-modal', false);
            
            // Update status message
            elements.statusMessage.textContent = `${update.opponentName} joined! Your turn (X)`;
            
            // Play sound
            GameUtils.playSound('join');
        }
        
        if (update.type === 'state-update') {
            // Update game engine state
            GameEngine.updateState(update.gameState);
            
            // Update the board
            updateBoard(GameEngine.getState());
            
            // Update status message based on whose turn it is
            if (update.gameState.winner) {
                showResult(update.gameState.winner);
            } else {
                if (update.isPlayerTurn) {
                    elements.statusMessage.textContent = 'Your turn';
                } else {
                    elements.statusMessage.textContent = 'Opponent\'s turn';
                }
            }
        }
    }

    // Make a move on the board
    function makeMove(index) {
        const gameState = GameEngine.getState();
        
        // Do nothing if the game is over or the cell is already filled
        if (!gameState.gameActive || gameState.board[index] !== '') {
            return;
        }
        
        // Do nothing if it's not the player's turn
        if (!gameState.isPlayerTurn) {
            GameUtils.showTemporaryMessage('Not your turn', 1000);
            return;
        }
        
        let result;
        
        // Handle move based on game mode
        if (gameState.gameMode === 'ai') {
            // Make move in AI game
            result = GameEngine.makeMove(index);
            
            if (result) {
                // Update the board
                updateBoard(result);
                
                // Check for game end
                if (result.moveResult === 'end') {
                    showResult(result.winner);
                } else if (result.nextAction === 'ai-move') {
                    // Update status message while AI is thinking
                    elements.statusMessage.textContent = 'AI is thinking...';
                    
                    // Make AI move
                    GameEngine.makeAIMove();
                }
            }
        } else if (gameState.gameMode === 'multiplayer') {
            // Make move in multiplayer game
            const mpResult = MultiplayerManager.makeMove(index);
            
            if (mpResult.success) {
                // Update the board based on the multiplayer result
                GameEngine.updateState(mpResult.gameState);
                updateBoard(GameEngine.getState());
                
                // Update status message
                elements.statusMessage.textContent = 'Opponent\'s turn';
            } else {
                GameUtils.showTemporaryMessage(mpResult.error, 1000);
            }
        }
    }

    // Update the board based on the game state
    function updateBoard(gameState) {
        // Update cell contents
        for (let i = 0; i < 9; i++) {
            const cell = elements.cells[i];
            cell.classList.remove('x', 'o', 'win');
            
            if (gameState.board[i] === 'X') {
                cell.classList.add('x');
            } else if (gameState.board[i] === 'O') {
                cell.classList.add('o');
            }
        }
        
        // Highlight winning cells if there's a winner
        if (gameState.winningPattern) {
            gameState.winningPattern.forEach(index => {
                elements.cells[index].classList.add('win');
            });
            
            // Show winning line
            showWinLine(gameState.winningPattern);
        }
    }

    // Reset the board
    function resetBoard() {
        // Clear cell classes
        elements.cells.forEach(cell => {
            cell.classList.remove('x', 'o', 'win');
        });
        
        // Hide win line
        elements.winLine.classList.remove('visible');
    }

    // Show the win line
    function showWinLine(pattern) {
        const winLine = elements.winLine;
        winLine.style.opacity = 0;
        
        // Calculate line position based on the winning pattern
        const [a, b, c] = pattern;
        
        // Set line position and rotation
        const cellSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
        const boardGap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--board-gap'));
        
        if (a === 0 && c === 2) {
            // Top row
            winLine.style.width = (cellSize * 3 + boardGap * 2) + 'px';
            winLine.style.height = '10px';
            winLine.style.transform = 'translate(-50%, -50%)';
            winLine.style.top = (cellSize / 2) + 'px';
            winLine.style.left = '50%';
        } else if (a === 3 && c === 5) {
            // Middle row
            winLine.style.width = (cellSize * 3 + boardGap * 2) + 'px';
            winLine.style.height = '10px';
            winLine.style.transform = 'translate(-50%, -50%)';
            winLine.style.top = (cellSize * 1.5 + boardGap) + 'px';
            winLine.style.left = '50%';
        } else if (a === 6 && c === 8) {
            // Bottom row
            winLine.style.width = (cellSize * 3 + boardGap * 2) + 'px';
            winLine.style.height = '10px';
            winLine.style.transform = 'translate(-50%, -50%)';
            winLine.style.top = (cellSize * 2.5 + boardGap * 2) + 'px';
            winLine.style.left = '50%';
        } else if (a === 0 && c === 6) {
            // Left column
            winLine.style.width = '10px';
            winLine.style.height = (cellSize * 3 + boardGap * 2) + 'px';
            winLine.style.transform = 'translate(-50%, -50%)';
            winLine.style.top = '50%';
            winLine.style.left = (cellSize / 2) + 'px';
        } else if (a === 1 && c === 7) {
            // Middle column
            winLine.style.width = '10px';
            winLine.style.height = (cellSize * 3 + boardGap * 2) + 'px';
            winLine.style.transform = 'translate(-50%, -50%)';
            winLine.style.top = '50%';
            winLine.style.left = (cellSize * 1.5 + boardGap) + 'px';
        } else if (a === 2 && c === 8) {
            // Right column
            winLine.style.width = '10px';
            winLine.style.height = (cellSize * 3 + boardGap * 2) + 'px';
            winLine.style.transform = 'translate(-50%, -50%)';
            winLine.style.top = '50%';
            winLine.style.left = (cellSize * 2.5 + boardGap * 2) + 'px';
        } else if (a === 0 && c === 8) {
            // Diagonal from top left to bottom right
            winLine.style.width = (Math.sqrt(2) * (cellSize * 3 + boardGap * 2)) + 'px';
            winLine.style.height = '10px';
            winLine.style.transform = 'translate(-50%, -50%) rotate(45deg)';
            winLine.style.top = '50%';
            winLine.style.left = '50%';
        } else if (a === 2 && c === 6) {
            // Diagonal from top right to bottom left
            winLine.style.width = (Math.sqrt(2) * (cellSize * 3 + boardGap * 2)) + 'px';
            winLine.style.height = '10px';
            winLine.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
            winLine.style.top = '50%';
            winLine.style.left = '50%';
        }
        
        // Show the line
        setTimeout(() => {
            winLine.classList.add('visible');
        }, 200);
    }

    // Restart the game
    function restartGame() {
        const gameState = GameEngine.getState();
        
        if (gameState.gameMode === 'ai') {
            // Restart single player game
            GameEngine.init('ai', { difficulty: 'medium' });
            resetBoard();
            updateStatusMessage();
        } else if (gameState.gameMode === 'multiplayer') {
            // In multiplayer, only the host can restart
            const mpState = MultiplayerManager.getState();
            
            if (mpState.isHost) {
                const result = MultiplayerManager.restartGame();
                
                if (result.success) {
                    GameEngine.updateState(result.gameState);
                    resetBoard();
                    updateStatusMessage();
                } else {
                    alert(result.error);
                }
            } else {
                GameUtils.showTemporaryMessage('Only the host can restart the game', 1500);
            }
        }
        
        // Hide result modal if it's shown
        GameUtils.toggleElementVisibility('#result-modal', false);
    }

    // Back to the main menu
    function backToMenu() {
        // Leave the room if in multiplayer mode
        const gameState = GameEngine.getState();
        
        if (gameState.gameMode === 'multiplayer') {
            MultiplayerManager.leaveRoom();
        }
        
        // Switch to welcome screen
        switchScreen('welcome');
        
        // Hide modals
        GameUtils.toggleElementVisibility('#result-modal', false);
        GameUtils.toggleElementVisibility('#waiting-modal', false);
    }

    // Show the game result
    function showResult(result) {
        const resultMessage = document.getElementById('result-message');
        const resultAnimation = document.querySelector('.result-animation');
        
        if (result === 'tie') {
            resultMessage.textContent = "It's a Tie!";
            resultAnimation.innerHTML = '🤝';
        } else if (result === GameEngine.getState().playerMark) {
            resultMessage.textContent = "You Win!";
            resultAnimation.innerHTML = '🏆';
            
            // Play win sound
            GameUtils.playSound('win');
        } else {
            resultMessage.textContent = "You Lose!";
            resultAnimation.innerHTML = '😞';
            
            // Play lose sound
            GameUtils.playSound('lose');
        }
        
        // Show result modal
        GameUtils.toggleElementVisibility('#result-modal', true);
    }

    // Update the status message based on the current game state
    function updateStatusMessage() {
        const gameState = GameEngine.getState();
        
        if (gameState.gameMode === 'ai') {
            if (gameState.isPlayerTurn) {
                elements.statusMessage.textContent = 'Your turn';
            } else {
                elements.statusMessage.textContent = 'AI is thinking...';
            }
        } else if (gameState.gameMode === 'multiplayer') {
            const mpState = MultiplayerManager.getState();
            
            if (mpState.opponentName) {
                if ((gameState.currentPlayer === 'X' && mpState.playerMark === 'X') ||
                    (gameState.currentPlayer === 'O' && mpState.playerMark === 'O')) {
                    elements.statusMessage.textContent = 'Your turn';
                } else {
                    elements.statusMessage.textContent = 'Opponent\'s turn';
                }
            } else {
                elements.statusMessage.textContent = 'Waiting for opponent...';
            }
        }
    }

    // Copy room link
    function copyRoomLink() {
        const gameState = GameEngine.getState();
        
        if (gameState.roomId) {
            const url = new URL(window.location.href);
            url.pathname = `/room/${gameState.roomId}`;
            url.search = '';
            
            GameUtils.copyToClipboard(url.href)
                .then(() => {
                    GameUtils.showTemporaryMessage('Link copied!', 1000);
                });
        }
    }

    // Copy share link from waiting modal
    function copyShareLink() {
        const shareUrl = document.getElementById('share-url');
        
        GameUtils.copyToClipboard(shareUrl.value)
            .then(() => {
                const copyBtn = document.getElementById('copy-share-link');
                copyBtn.textContent = 'Copied!';
                
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 1000);
            });
    }

    // Return public methods
    return {
        init,
        updateBoard,
        showResult
    };
})();

// Make the UI available globally
window.GameUI = GameUI; 