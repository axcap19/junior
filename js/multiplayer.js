// ==========================================
// MULTIPLAYER CLIENT - WebSocket
// ==========================================

const Multiplayer = (() => {
    let ws = null;
    let playerColor = null;
    let roomCode = null;
    let gameType = null;
    let isOnline = false;
    let onMoveReceived = null;
    let onOpponentJoined = null;
    let onOpponentDisconnected = null;
    let onError = null;

    function connect() {
        return new Promise((resolve, reject) => {
            const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(`${proto}//${location.host}/ws`);
            ws.onopen = () => resolve();
            ws.onerror = () => reject(new Error('Could not connect to game server'));
            ws.onclose = () => {
                if (isOnline) {
                    updateOnlineStatus('Disconnected from server', 'error');
                }
            };
            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                handleMessage(msg);
            };
        });
    }

    function handleMessage(msg) {
        switch (msg.type) {
            case 'room_created':
                roomCode = msg.code;
                playerColor = msg.color;
                updateOnlineStatus('Waiting for opponent to join...', 'waiting');
                document.getElementById('online-room-display').textContent = `Room: ${roomCode}`;
                document.getElementById('online-waiting').classList.remove('hidden');
                document.getElementById('online-form').classList.add('hidden');
                break;

            case 'room_joined':
                roomCode = msg.code;
                playerColor = msg.color;
                gameType = msg.gameType;
                startOnlineGame();
                break;

            case 'opponent_joined':
                startOnlineGame();
                break;

            case 'opponent_move':
                if (onMoveReceived) onMoveReceived(msg.move);
                break;

            case 'opponent_disconnected':
                updateOnlineStatus('Opponent disconnected!', 'error');
                isOnline = false;
                break;

            case 'error':
                if (onError) onError(msg.message);
                updateOnlineStatus(msg.message, 'error');
                break;
        }
    }

    function createRoom(code, type) {
        gameType = type;
        ws.send(JSON.stringify({ type: 'create_room', code, gameType: type }));
    }

    function joinRoom(code) {
        ws.send(JSON.stringify({ type: 'join_room', code }));
    }

    function sendMove(moveData) {
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'move', move: moveData }));
        }
    }

    function startOnlineGame() {
        isOnline = true;
        if (gameType === 'chess') {
            showScreen('chess-screen');
            ChessGame.init(false, true, playerColor);
        } else {
            showScreen('checkers-screen');
            CheckersGame.init(false, true, playerColor);
        }
    }

    function isMyTurn(currentTurn) {
        if (!isOnline) return true;
        return currentTurn === playerColor;
    }

    function updateOnlineStatus(text, type) {
        const el = document.getElementById('online-status-msg');
        if (el) {
            el.textContent = text;
            el.className = 'online-status-msg ' + (type || '');
        }
    }

    function disconnect() {
        isOnline = false;
        playerColor = null;
        roomCode = null;
        if (ws) {
            ws.close();
            ws = null;
        }
    }

    function getPlayerColor() { return playerColor; }
    function isOnlineGame() { return isOnline; }
    function getGameType() { return gameType; }

    function setOnMoveReceived(fn) { onMoveReceived = fn; }
    function setOnError(fn) { onError = fn; }

    return {
        connect, createRoom, joinRoom, sendMove,
        isMyTurn, isOnlineGame, getPlayerColor, getGameType,
        disconnect, setOnMoveReceived, setOnError, updateOnlineStatus
    };
})();
