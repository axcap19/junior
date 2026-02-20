// ==========================================
// MULTIPLAYER GAME SERVER - WebSocket
// ==========================================
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = 3001;
const rooms = new Map();

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Game server running');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
        let msg;
        try { msg = JSON.parse(data); } catch { return; }

        switch (msg.type) {
            case 'create_room': {
                const code = msg.code.toUpperCase().trim();
                if (rooms.has(code)) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Room already exists. Try a different code.' }));
                    return;
                }
                rooms.set(code, {
                    gameType: msg.gameType,
                    players: [ws],
                    colors: ['w'] // creator is always Arsenal (white/red)
                });
                ws.roomCode = code;
                ws.playerColor = msg.gameType === 'chess' ? 'w' : 'red';
                ws.send(JSON.stringify({
                    type: 'room_created',
                    code,
                    color: ws.playerColor
                }));
                break;
            }

            case 'join_room': {
                const code = msg.code.toUpperCase().trim();
                const room = rooms.get(code);
                if (!room) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Room not found. Check the code and try again.' }));
                    return;
                }
                if (room.players.length >= 2) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Room is full.' }));
                    return;
                }
                room.players.push(ws);
                ws.roomCode = code;
                ws.playerColor = room.gameType === 'chess' ? 'b' : 'black';
                ws.send(JSON.stringify({
                    type: 'room_joined',
                    code,
                    color: ws.playerColor,
                    gameType: room.gameType
                }));
                // Notify creator that opponent joined
                room.players[0].send(JSON.stringify({
                    type: 'opponent_joined'
                }));
                break;
            }

            case 'move': {
                const room = rooms.get(ws.roomCode);
                if (!room) return;
                const opponent = room.players.find(p => p !== ws);
                if (opponent && opponent.readyState === 1) {
                    opponent.send(JSON.stringify({
                        type: 'opponent_move',
                        move: msg.move
                    }));
                }
                break;
            }

            case 'game_over': {
                const room = rooms.get(ws.roomCode);
                if (!room) return;
                const opponent = room.players.find(p => p !== ws);
                if (opponent && opponent.readyState === 1) {
                    opponent.send(JSON.stringify({
                        type: 'game_over',
                        winner: msg.winner,
                        reason: msg.reason
                    }));
                }
                break;
            }
        }
    });

    ws.on('close', () => {
        if (ws.roomCode) {
            const room = rooms.get(ws.roomCode);
            if (room) {
                const opponent = room.players.find(p => p !== ws);
                if (opponent && opponent.readyState === 1) {
                    opponent.send(JSON.stringify({
                        type: 'opponent_disconnected'
                    }));
                }
                rooms.delete(ws.roomCode);
            }
        }
    });
});

// Heartbeat to clean up dead connections
setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// Clean up empty rooms periodically
setInterval(() => {
    for (const [code, room] of rooms) {
        room.players = room.players.filter(p => p.readyState === 1);
        if (room.players.length === 0) rooms.delete(code);
    }
}, 60000);

server.listen(PORT, () => {
    console.log(`Game server running on port ${PORT}`);
});
