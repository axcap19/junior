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
    const title = game === 'chess' ? '⚽ Football Chess' : '⚽ Football Checkers';
    document.getElementById('mode-title').textContent = title;
    showScreen('mode-screen');
}

function startGame(mode) {
    const ai = mode === 'ai';
    if (selectedGame === 'chess') {
        showScreen('chess-screen');
        ChessGame.init(ai);
    } else {
        showScreen('checkers-screen');
        CheckersGame.init(ai);
    }
}

function goBack() {
    showScreen('menu-screen');
}

function goToMenu() {
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay) overlay.remove();
    showScreen('menu-screen');
}

function resetChess() {
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay) overlay.remove();
    ChessGame.init(document.getElementById('chess-screen').dataset.ai === 'true');
}

function resetCheckers() {
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay) overlay.remove();
    CheckersGame.init(document.getElementById('checkers-screen').dataset.ai === 'true');
}

function showGameOver(title, subtitle, game) {
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.innerHTML = \`
        <div class="game-over-box">
            <h2>\${title}</h2>
            <p>\${subtitle}</p>
            <button class="btn-primary" onclick="this.closest('.game-over-overlay').remove(); \${game === 'chess' ? 'resetChess()' : 'resetCheckers()'}">Play Again</button>
            <button class="btn-secondary" onclick="goToMenu()">Main Menu</button>
        </div>
    \`;
    document.body.appendChild(overlay);
}

// Store AI mode when starting
const origStartGame = startGame;
startGame = function(mode) {
    const ai = mode === 'ai';
    if (selectedGame === 'chess') {
        document.getElementById('chess-screen').dataset.ai = ai;
    } else {
        document.getElementById('checkers-screen').dataset.ai = ai;
    }
    origStartGame(mode);
};