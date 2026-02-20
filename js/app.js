// ==========================================
// APP CONTROLLER - Menu & Navigation
// ==========================================

let selectedGame = null;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showModeSelect(game) {
    selectedGame = game;
    const titles = { chess: '⚽ Football Chess', checkers: '⚽ Football Checkers', pong: '⚽ Football Pong' };
    document.getElementById('mode-title').textContent = titles[game] || game;
    showScreen('mode-screen');
}

function startGame(mode) {
    if (mode === 'online') {
        showOnlineScreen();
        return;
    }
    const ai = mode === 'ai';
    if (selectedGame === 'chess') {
        document.getElementById('chess-screen').dataset.ai = ai;
        showScreen('chess-screen');
        ChessGame.init(ai);
    } else if (selectedGame === 'pong') {
        document.getElementById('pong-screen').dataset.ai = ai;
        showScreen('pong-screen');
        PongGame.attachControls();
        PongGame.init(ai);
    } else {
        document.getElementById('checkers-screen').dataset.ai = ai;
        showScreen('checkers-screen');
        CheckersGame.init(ai);
    }
}

async function showOnlineScreen() {
    const onlineTitles = { chess: '⚽ Football Chess — Online', checkers: '⚽ Football Checkers — Online', pong: '⚽ Football Pong — Online' };
    document.getElementById('online-title').textContent = onlineTitles[selectedGame] || 'Play Online';
    document.getElementById('online-form').classList.remove('hidden');
    document.getElementById('online-waiting').classList.add('hidden');
    document.getElementById('online-status-msg').textContent = '';
    document.getElementById('room-code-input').value = '';
    showScreen('online-screen');

    try {
        await Multiplayer.connect();
    } catch (e) {
        document.getElementById('online-status-msg').textContent = 'Could not connect to server. Please try again.';
        document.getElementById('online-status-msg').className = 'online-status-msg error';
    }
}

function createOnlineRoom() {
    const code = document.getElementById('room-code-input').value.trim();
    if (!code) {
        Multiplayer.updateOnlineStatus('Please enter a room code', 'error');
        return;
    }
    Multiplayer.createRoom(code, selectedGame);
}

function joinOnlineRoom() {
    const code = document.getElementById('room-code-input').value.trim();
    if (!code) {
        Multiplayer.updateOnlineStatus('Please enter a room code', 'error');
        return;
    }
    Multiplayer.joinRoom(code);
}

function cancelOnline() {
    Multiplayer.disconnect();
    showScreen('mode-screen');
}

function goBack() {
    showScreen('menu-screen');
}

function goToMenu() {
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay) overlay.remove();
    PongGame.stop();
    PongGame.detachControls();
    Multiplayer.disconnect();
    showScreen('menu-screen');
}

function resetPong() {
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay) overlay.remove();
    PongGame.init(document.getElementById('pong-screen').dataset.ai === 'true');
}

function resetChess() {
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay) overlay.remove();
    if (Multiplayer.isOnlineGame()) {
        // Can't reset online game — go back to menu
        Multiplayer.disconnect();
        showScreen('menu-screen');
        return;
    }
    ChessGame.init(document.getElementById('chess-screen').dataset.ai === 'true');
}

function resetCheckers() {
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay) overlay.remove();
    if (Multiplayer.isOnlineGame()) {
        Multiplayer.disconnect();
        showScreen('menu-screen');
        return;
    }
    CheckersGame.init(document.getElementById('checkers-screen').dataset.ai === 'true');
}

function showGameOver(title, subtitle, game) {
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.innerHTML = `
        <div class="game-over-box">
            <h2>${title}</h2>
            <p>${subtitle}</p>
            <button class="btn-primary" onclick="this.closest('.game-over-overlay').remove(); ${game === 'chess' ? 'resetChess()' : game === 'pong' ? 'resetPong()' : 'resetCheckers()'}">Play Again</button>
            <button class="btn-secondary" onclick="goToMenu()">Main Menu</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Auto-capitalize room code input
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('room-code-input');
    if (input) {
        input.addEventListener('input', () => {
            input.value = input.value.toUpperCase();
        });
    }
});
