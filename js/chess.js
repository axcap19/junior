// ==========================================
// FOOTBALL CHESS - Arsenal vs Barcelona Legends
// ==========================================

const ChessGame = (() => {
    // Player data for each piece
    const PLAYERS = {
        // Arsenal (White)
        wK: { name: 'Henry', number: '14', fullName: 'Thierry Henry', role: 'King' },
        wQ: { name: 'Bergkamp', number: '10', fullName: 'Dennis Bergkamp', role: 'Queen' },
        wR: { name: 'Adams', number: '6', fullName: 'Tony Adams', role: 'Rook' },
        wB: { name: 'Vieira', number: '4', fullName: 'Patrick Vieira', role: 'Bishop' },
        wN: { name: 'Pirès', number: '7', fullName: 'Robert Pirès', role: 'Knight' },
        wP: { name: 'Invincible', number: '', fullName: 'The Invincibles', role: 'Pawn' },
        // Barcelona (Black)
        bK: { name: 'Messi', number: '10', fullName: 'Lionel Messi', role: 'King' },
        bQ: { name: 'Ronaldinho', number: '10', fullName: 'Ronaldinho', role: 'Queen' },
        bR: { name: 'Puyol', number: '5', fullName: 'Carles Puyol', role: 'Rook' },
        bB: { name: 'Xavi', number: '6', fullName: 'Xavi Hernández', role: 'Bishop' },
        bN: { name: 'Iniesta', number: '8', fullName: 'Andrés Iniesta', role: 'Knight' },
        bP: { name: 'La Masia', number: '', fullName: 'La Masia', role: 'Pawn' },
    };

    // Team colors
    const TEAM_COLORS = {
        w: { primary: '#EF0107', secondary: '#FFFFFF', accent: '#9C824A', name: 'Arsenal' },
        b: { primary: '#A50044', secondary: '#004D98', accent: '#EDBB00', name: 'Barcelona' },
    };

    // Player photo URLs from Wikimedia Commons (Creative Commons licensed)
    const PLAYER_PHOTOS = {
        wK: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Thierry_Henry_Euro_2008.JPG/200px-Thierry_Henry_Euro_2008.JPG',
        wQ: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Dennis_Bergkamp_cropped.JPG/200px-Dennis_Bergkamp_cropped.JPG',
        wR: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Tony_Adams_2017_portrait_%28cropped%29.jpg/200px-Tony_Adams_2017_portrait_%28cropped%29.jpg',
        wB: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Patrick_Vieira_NYCFC.JPG/200px-Patrick_Vieira_NYCFC.JPG',
        wN: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Robert_Pires1.JPG/200px-Robert_Pires1.JPG',
        wP: null, // Pawns use team badge SVG
        bK: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Lionel_Messi%2C_Player_of_Argentina_national_football_team%2C_and_FC_Barcelona.JPG/200px-Lionel_Messi%2C_Player_of_Argentina_national_football_team%2C_and_FC_Barcelona.JPG',
        bQ: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Ronaldinho_by_Vicario.JPG/200px-Ronaldinho_by_Vicario.JPG',
        bR: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Carles_Puyol_Joan_Gamper-Tr.jpg/200px-Carles_Puyol_Joan_Gamper-Tr.jpg',
        bB: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Xavi_Hern%C3%A1ndez_Spain_2009.jpg/200px-Xavi_Hern%C3%A1ndez_Spain_2009.jpg',
        bN: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Andr%C3%A9s_Iniesta_-_001.jpg/200px-Andr%C3%A9s_Iniesta_-_001.jpg',
        bP: null, // Pawns use team badge SVG
    };

    // Chess piece unicode symbols - filled versions for display
    const PIECE_ICONS = { K: '\u265A', Q: '\u265B', R: '\u265C', B: '\u265D', N: '\u265E', P: '\u265F' };
    // White (outline) piece symbols for white side
    const PIECE_ICONS_WHITE = { K: '\u2654', Q: '\u2655', R: '\u2656', B: '\u2657', N: '\u2658', P: '\u2659' };

    // Generate fallback SVG badge for pieces without photos (pawns)
    function generatePawnSVG(color) {
        const tc = TEAM_COLORS[color];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <defs><radialGradient id="pg${color}" cx="40%" cy="40%">
                <stop offset="0%" style="stop-color:${color === 'w' ? '#FF2020' : '#D4006A'}"/>
                <stop offset="100%" style="stop-color:${tc.primary}"/>
            </radialGradient></defs>
            <circle cx="50" cy="45" r="35" fill="url(#pg${color})" stroke="${tc.accent}" stroke-width="2.5"/>
            <path d="M30,80 Q30,95 50,95 Q70,95 70,80 L65,65 Q50,70 35,65 Z" fill="${tc.primary}" stroke="${tc.accent}" stroke-width="1.5"/>
            <circle cx="50" cy="45" r="28" fill="none" stroke="${tc.secondary}" stroke-width="1" opacity="0.3"/>
            <text x="50" y="42" text-anchor="middle" fill="${tc.secondary}" font-size="9" font-weight="bold" font-family="Arial">${color === 'w' ? 'INV' : 'LM'}</text>
            <text x="50" y="55" text-anchor="middle" fill="${tc.accent}" font-size="8" font-family="Arial">${color === 'w' ? '03-04' : 'Acad.'}</text>
        </svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    // For backward compatibility with captured pieces display
    const PIECE_IMAGES = {
        wP: generatePawnSVG('w'),
        bP: generatePawnSVG('b'),
    };
    // Photo-based pieces use PLAYER_PHOTOS directly

    const PIECE_NAMES = {};
    for (const [key, val] of Object.entries(PLAYERS)) {
        PIECE_NAMES[key] = `${val.fullName} (${val.role})`;
    }

    // Piece values for AI
    const PIECE_VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

    // Position bonus tables for AI evaluation
    const POSITION_BONUS = {
        P: [
            [0,0,0,0,0,0,0,0],
            [50,50,50,50,50,50,50,50],
            [10,10,20,30,30,20,10,10],
            [5,5,10,25,25,10,5,5],
            [0,0,0,20,20,0,0,0],
            [5,-5,-10,0,0,-10,-5,5],
            [5,10,10,-20,-20,10,10,5],
            [0,0,0,0,0,0,0,0]
        ],
        N: [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,0,0,0,0,-20,-40],
            [-30,0,10,15,15,10,0,-30],
            [-30,5,15,20,20,15,5,-30],
            [-30,0,15,20,20,15,0,-30],
            [-30,5,10,15,15,10,5,-30],
            [-40,-20,0,5,5,0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        B: [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,0,0,0,0,0,0,-10],
            [-10,0,10,10,10,10,0,-10],
            [-10,5,5,10,10,5,5,-10],
            [-10,0,10,10,10,10,0,-10],
            [-10,10,10,10,10,10,10,-10],
            [-10,5,0,0,0,0,5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
        R: [
            [0,0,0,0,0,0,0,0],
            [5,10,10,10,10,10,10,5],
            [-5,0,0,0,0,0,0,-5],
            [-5,0,0,0,0,0,0,-5],
            [-5,0,0,0,0,0,0,-5],
            [-5,0,0,0,0,0,0,-5],
            [-5,0,0,0,0,0,0,-5],
            [0,0,0,5,5,0,0,0]
        ],
        Q: [
            [-20,-10,-10,-5,-5,-10,-10,-20],
            [-10,0,0,0,0,0,0,-10],
            [-10,0,5,5,5,5,0,-10],
            [-5,0,5,5,5,5,0,-5],
            [0,0,5,5,5,5,0,-5],
            [-10,5,5,5,5,5,0,-10],
            [-10,0,5,0,0,0,0,-10],
            [-20,-10,-10,-5,-5,-10,-10,-20]
        ],
        K: [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20,20,0,0,0,0,20,20],
            [20,30,10,0,0,10,30,20]
        ]
    };

    let board = [];
    let currentTurn = 'w';
    let selectedCell = null;
    let validMoves = [];
    let gameOver = false;
    let vsAI = false;
    let moveHistory = [];
    let lastMove = null;
    let capturedPieces = { w: [], b: [] };
    let promotionCallback = null;

    // Castling rights
    let castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
    // En passant target square
    let enPassantTarget = null;

    const INITIAL_BOARD = [
        ['bR','bN','bB','bQ','bK','bB','bN','bR'],
        ['bP','bP','bP','bP','bP','bP','bP','bP'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['wP','wP','wP','wP','wP','wP','wP','wP'],
        ['wR','wN','wB','wQ','wK','wB','wN','wR'],
    ];

    let onlineMode = false;
    let myColor = null;

    function init(ai, online, color) {
        vsAI = ai;
        onlineMode = online || false;
        myColor = color || null;
        board = INITIAL_BOARD.map(row => [...row]);
        currentTurn = 'w';
        selectedCell = null;
        validMoves = [];
        gameOver = false;
        moveHistory = [];
        lastMove = null;
        capturedPieces = { w: [], b: [] };
        castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
        enPassantTarget = null;

        if (onlineMode) {
            Multiplayer.setOnMoveReceived((moveData) => {
                const move = moveData.move;
                makeMove(moveData.fromR, moveData.fromC, move, moveData.promoType);
                switchTurn();
                render();
                updateStatus();
                checkGameEnd();
            });
        }

        render();
        updateStatus();
    }

    function getColor(piece) {
        return piece ? piece[0] : null;
    }
    function getType(piece) {
        return piece ? piece[1] : null;
    }

    function isInBounds(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    // Generate pseudo-legal moves for a piece (doesn't check for leaving king in check)
    function getPseudoMoves(r, c, brd, ep, castle) {
        const piece = brd[r][c];
        if (!piece) return [];
        const color = getColor(piece);
        const type = getType(piece);
        const moves = [];
        const enemy = color === 'w' ? 'b' : 'w';
        const dir = color === 'w' ? -1 : 1;

        if (type === 'P') {
            const nr = r + dir;
            if (isInBounds(nr, c) && !brd[nr][c]) {
                moves.push({ r: nr, c, type: (nr === 0 || nr === 7) ? 'promotion' : 'move' });
                const startRow = color === 'w' ? 6 : 1;
                const nr2 = r + 2 * dir;
                if (r === startRow && !brd[nr2][c]) {
                    moves.push({ r: nr2, c, type: 'double' });
                }
            }
            for (const dc of [-1, 1]) {
                const nc = c + dc;
                if (!isInBounds(nr, nc)) continue;
                if (brd[nr][nc] && getColor(brd[nr][nc]) === enemy) {
                    moves.push({ r: nr, c: nc, type: (nr === 0 || nr === 7) ? 'promotion' : 'capture' });
                }
                if (ep && ep.r === nr && ep.c === nc) {
                    moves.push({ r: nr, c: nc, type: 'enpassant' });
                }
            }
        }

        if (type === 'R' || type === 'Q') {
            for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
                for (let i = 1; i < 8; i++) {
                    const nr = r + dr * i, nc = c + dc * i;
                    if (!isInBounds(nr, nc)) break;
                    if (!brd[nr][nc]) { moves.push({ r: nr, c: nc, type: 'move' }); }
                    else {
                        if (getColor(brd[nr][nc]) === enemy) moves.push({ r: nr, c: nc, type: 'capture' });
                        break;
                    }
                }
            }
        }

        if (type === 'B' || type === 'Q') {
            for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
                for (let i = 1; i < 8; i++) {
                    const nr = r + dr * i, nc = c + dc * i;
                    if (!isInBounds(nr, nc)) break;
                    if (!brd[nr][nc]) { moves.push({ r: nr, c: nc, type: 'move' }); }
                    else {
                        if (getColor(brd[nr][nc]) === enemy) moves.push({ r: nr, c: nc, type: 'capture' });
                        break;
                    }
                }
            }
        }

        if (type === 'N') {
            for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
                const nr = r + dr, nc = c + dc;
                if (!isInBounds(nr, nc)) continue;
                if (!brd[nr][nc]) moves.push({ r: nr, c: nc, type: 'move' });
                else if (getColor(brd[nr][nc]) === enemy) moves.push({ r: nr, c: nc, type: 'capture' });
            }
        }

        if (type === 'K') {
            for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                const nr = r + dr, nc = c + dc;
                if (!isInBounds(nr, nc)) continue;
                if (!brd[nr][nc]) moves.push({ r: nr, c: nc, type: 'move' });
                else if (getColor(brd[nr][nc]) === enemy) moves.push({ r: nr, c: nc, type: 'capture' });
            }
            if (castle) {
                const row = color === 'w' ? 7 : 0;
                if (r === row && c === 4) {
                    if (castle[color + 'K'] && !brd[row][5] && !brd[row][6] && brd[row][7] === color + 'R') {
                        if (!isSquareAttacked(row, 4, enemy, brd) && !isSquareAttacked(row, 5, enemy, brd) && !isSquareAttacked(row, 6, enemy, brd)) {
                            moves.push({ r: row, c: 6, type: 'castle-k' });
                        }
                    }
                    if (castle[color + 'Q'] && !brd[row][3] && !brd[row][2] && !brd[row][1] && brd[row][0] === color + 'R') {
                        if (!isSquareAttacked(row, 4, enemy, brd) && !isSquareAttacked(row, 3, enemy, brd) && !isSquareAttacked(row, 2, enemy, brd)) {
                            moves.push({ r: row, c: 2, type: 'castle-q' });
                        }
                    }
                }
            }
        }

        return moves;
    }

    function isSquareAttacked(r, c, byColor, brd) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const p = brd[row][col];
                if (!p || getColor(p) !== byColor) continue;
                const moves = getPseudoMoves(row, col, brd, null, null);
                if (moves.some(m => m.r === r && m.c === c)) return true;
            }
        }
        return false;
    }

    function findKing(color, brd) {
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++)
                if (brd[r][c] === color + 'K') return { r, c };
        return null;
    }

    function isInCheck(color, brd) {
        const king = findKing(color, brd);
        if (!king) return false;
        const enemy = color === 'w' ? 'b' : 'w';
        return isSquareAttacked(king.r, king.c, enemy, brd);
    }

    function getLegalMoves(r, c, brd, ep, castle) {
        const piece = brd[r][c];
        if (!piece) return [];
        const color = getColor(piece);
        const pseudo = getPseudoMoves(r, c, brd, ep, castle);
        return pseudo.filter(move => {
            const sim = simulateMove(brd, r, c, move);
            return !isInCheck(color, sim);
        });
    }

    function simulateMove(brd, fromR, fromC, move) {
        const sim = brd.map(row => [...row]);
        const piece = sim[fromR][fromC];
        sim[move.r][move.c] = piece;
        sim[fromR][fromC] = null;
        if (move.type === 'enpassant') {
            const capturedRow = getColor(piece) === 'w' ? move.r + 1 : move.r - 1;
            sim[capturedRow][move.c] = null;
        }
        if (move.type === 'castle-k') {
            sim[move.r][5] = sim[move.r][7]; sim[move.r][7] = null;
        }
        if (move.type === 'castle-q') {
            sim[move.r][3] = sim[move.r][0]; sim[move.r][0] = null;
        }
        if (move.type === 'promotion') {
            sim[move.r][move.c] = getColor(piece) + 'Q';
        }
        return sim;
    }

    function hasAnyLegalMoves(color, brd, ep, castle) {
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                if (brd[r][c] && getColor(brd[r][c]) === color) {
                    if (getLegalMoves(r, c, brd, ep, castle).length > 0) return true;
                }
            }
        return false;
    }

    function makeMove(fromR, fromC, move, promoType) {
        const piece = board[fromR][fromC];
        const color = getColor(piece);
        const captured = board[move.r][move.c];
        if (captured) capturedPieces[color].push(captured);
        if (move.type === 'enpassant') {
            const capturedRow = color === 'w' ? move.r + 1 : move.r - 1;
            capturedPieces[color].push(board[capturedRow][move.c]);
            board[capturedRow][move.c] = null;
        }
        board[move.r][move.c] = piece;
        board[fromR][fromC] = null;
        if (move.type === 'castle-k') { board[move.r][5] = board[move.r][7]; board[move.r][7] = null; }
        if (move.type === 'castle-q') { board[move.r][3] = board[move.r][0]; board[move.r][0] = null; }
        if (move.type === 'promotion') { board[move.r][move.c] = color + (promoType || 'Q'); }
        if (move.type === 'double') {
            enPassantTarget = { r: (fromR + move.r) / 2, c: fromC };
        } else {
            enPassantTarget = null;
        }
        if (getType(piece) === 'K') { castlingRights[color + 'K'] = false; castlingRights[color + 'Q'] = false; }
        if (getType(piece) === 'R') {
            if (fromC === 0) castlingRights[color + 'Q'] = false;
            if (fromC === 7) castlingRights[color + 'K'] = false;
        }
        if (move.r === 0 && move.c === 0) castlingRights.bQ = false;
        if (move.r === 0 && move.c === 7) castlingRights.bK = false;
        if (move.r === 7 && move.c === 0) castlingRights.wQ = false;
        if (move.r === 7 && move.c === 7) castlingRights.wK = false;
        lastMove = { fromR, fromC, toR: move.r, toC: move.c };
        moveHistory.push({ from: { r: fromR, c: fromC }, to: move, piece, captured });
    }

    function switchTurn() {
        currentTurn = currentTurn === 'w' ? 'b' : 'w';
    }

    function checkGameEnd() {
        const color = currentTurn;
        const inCheck = isInCheck(color, board);
        const hasMoves = hasAnyLegalMoves(color, board, enPassantTarget, castlingRights);
        if (!hasMoves) {
            gameOver = true;
            if (inCheck) {
                const winner = color === 'w' ? TEAM_COLORS.b.name : TEAM_COLORS.w.name;
                showGameOver(`Checkmate!`, `${winner} wins!`, 'chess');
            } else {
                showGameOver('Stalemate!', "It's a draw.", 'chess');
            }
            return true;
        }
        return false;
    }

    function updateStatus() {
        const statusEl = document.getElementById('chess-status');
        const teamName = TEAM_COLORS[currentTurn].name;
        const inCheck = isInCheck(currentTurn, board);
        statusEl.textContent = `${teamName}'s Turn` + (inCheck ? ' - CHECK!' : '');
        document.getElementById('white-captured').innerHTML = capturedPieces.w
            .map(p => {
                const src = PLAYER_PHOTOS[p] || PIECE_IMAGES[p];
                return src ? `<img src="${src}" alt="${PIECE_NAMES[p] || p}" style="border-radius:50%;width:24px;height:24px;object-fit:cover;">` : '';
            }).join('');
        document.getElementById('black-captured').innerHTML = capturedPieces.b
            .map(p => {
                const src = PLAYER_PHOTOS[p] || PIECE_IMAGES[p];
                return src ? `<img src="${src}" alt="${PIECE_NAMES[p] || p}" style="border-radius:50%;width:24px;height:24px;object-fit:cover;">` : '';
            }).join('');
    }

    function render() {
        const boardEl = document.getElementById('chess-board');
        boardEl.innerHTML = '';
        const inCheck = isInCheck(currentTurn, board);
        const kingPos = findKing(currentTurn, board);

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
                cell.dataset.row = r;
                cell.dataset.col = c;
                if (lastMove && ((r === lastMove.fromR && c === lastMove.fromC) || (r === lastMove.toR && c === lastMove.toC))) {
                    cell.classList.add('last-move');
                }
                if (inCheck && kingPos && r === kingPos.r && c === kingPos.c) {
                    cell.classList.add('in-check');
                }
                if (selectedCell && r === selectedCell.r && c === selectedCell.c) {
                    cell.classList.add('selected');
                }
                const vm = validMoves.find(m => m.r === r && m.c === c);
                if (vm) {
                    if (board[r][c] || vm.type === 'enpassant') cell.classList.add('valid-capture');
                    else cell.classList.add('valid-move');
                }
                if (board[r][c]) {
                    const piece = board[r][c];
                    const color = getColor(piece);
                    const type = getType(piece);
                    const tc = TEAM_COLORS[color];
                    const playerData = PLAYERS[piece];
                    const photoUrl = PLAYER_PHOTOS[piece];

                    const pieceEl = document.createElement('div');
                    pieceEl.className = `piece piece-with-face ${color === 'w' ? 'white-piece' : 'black-piece'}`;
                    pieceEl.title = playerData ? `${playerData.fullName} (${playerData.role})` : piece;

                    // Chess piece symbol as the main visible element
                    const pieceSymbol = color === 'w' ? PIECE_ICONS_WHITE[type] : PIECE_ICONS[type];
                    const pieceColor = color === 'w' ? tc.primary : tc.primary;
                    const strokeColor = color === 'w' ? '#000' : '#000';

                    if (photoUrl) {
                        pieceEl.innerHTML = `
                            <div class="piece-base">
                                <span class="piece-symbol" style="color:${pieceColor};-webkit-text-stroke:1px ${strokeColor};">${pieceSymbol}</span>
                                <div class="face-overlay" style="border-color:${tc.accent};">
                                    <img src="${photoUrl}" alt="${playerData.fullName}" class="face-photo"
                                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                                    <div class="face-fallback" style="display:none;background:${tc.primary};color:#fff;">
                                        ${playerData.name.substring(0,2)}
                                    </div>
                                </div>
                            </div>
                            <div class="player-label" style="background:${tc.primary};color:${tc.secondary || '#fff'};border:1px solid ${tc.accent};">${playerData.name}</div>
                        `;
                    } else {
                        // Pawn - piece symbol with team badge overlay
                        pieceEl.innerHTML = `
                            <div class="piece-base">
                                <span class="piece-symbol" style="color:${pieceColor};-webkit-text-stroke:1px ${strokeColor};">${pieceSymbol}</span>
                                <div class="face-overlay pawn-badge" style="border-color:${tc.accent};background:${tc.primary};">
                                    <span style="color:${tc.secondary || '#fff'};font-weight:bold;font-size:inherit;">${color === 'w' ? 'INV' : 'LM'}</span>
                                </div>
                            </div>
                        `;
                    }
                    cell.appendChild(pieceEl);
                }
                cell.addEventListener('click', () => onCellClick(r, c));
                boardEl.appendChild(cell);
            }
        }
    }

    function onCellClick(r, c) {
        if (gameOver) return;
        if (vsAI && currentTurn === 'b') return;
        if (onlineMode && currentTurn !== myColor) return;
        const piece = board[r][c];
        const moveTarget = validMoves.find(m => m.r === r && m.c === c);
        if (moveTarget && selectedCell) {
            if (moveTarget.type === 'promotion') {
                showPromotionModal(selectedCell.r, selectedCell.c, moveTarget);
                return;
            }
            if (onlineMode) {
                Multiplayer.sendMove({ fromR: selectedCell.r, fromC: selectedCell.c, move: moveTarget });
            }
            makeMove(selectedCell.r, selectedCell.c, moveTarget);
            selectedCell = null;
            validMoves = [];
            switchTurn();
            render();
            updateStatus();
            if (checkGameEnd()) return;
            if (vsAI && currentTurn === 'b') setTimeout(aiMove, 300);
            return;
        }
        if (piece && getColor(piece) === currentTurn) {
            selectedCell = { r, c };
            validMoves = getLegalMoves(r, c, board, enPassantTarget, castlingRights);
        } else {
            selectedCell = null;
            validMoves = [];
        }
        render();
    }

    function showPromotionModal(fromR, fromC, move) {
        const modal = document.getElementById('chess-promotion-modal');
        const choices = document.getElementById('promotion-choices');
        const color = currentTurn;
        const tc = TEAM_COLORS[color];
        choices.innerHTML = '';
        for (const type of ['Q', 'R', 'B', 'N']) {
            const pieceCode = color + type;
            const playerData = PLAYERS[pieceCode];
            const photoUrl = PLAYER_PHOTOS[pieceCode];
            const opt = document.createElement('div');
            opt.className = 'piece-option';
            opt.style.flexDirection = 'column';
            opt.style.padding = '8px';
            if (photoUrl) {
                const img = document.createElement('img');
                img.src = photoUrl;
                img.alt = playerData.fullName;
                img.style.width = '50px';
                img.style.height = '50px';
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                img.style.border = `2px solid ${tc.accent}`;
                opt.appendChild(img);
                const label = document.createElement('div');
                label.textContent = playerData.name;
                label.style.fontSize = '10px';
                label.style.marginTop = '4px';
                label.style.color = '#ccc';
                opt.appendChild(label);
            } else {
                const img = document.createElement('img');
                img.src = PIECE_IMAGES[pieceCode] || '';
                img.alt = playerData ? playerData.fullName : type;
                opt.appendChild(img);
            }
            opt.addEventListener('click', () => {
                modal.classList.add('hidden');
                if (onlineMode) {
                    Multiplayer.sendMove({ fromR, fromC, move, promoType: type });
                }
                makeMove(fromR, fromC, move, type);
                selectedCell = null;
                validMoves = [];
                switchTurn();
                render();
                updateStatus();
                if (checkGameEnd()) return;
                if (vsAI && currentTurn === 'b') setTimeout(aiMove, 300);
            });
            choices.appendChild(opt);
        }
        modal.classList.remove('hidden');
    }

    // ==========================================
    // AI (Minimax with Alpha-Beta Pruning)
    // ==========================================
    function evaluateBoard(brd) {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = brd[r][c];
                if (!p) continue;
                const type = getType(p);
                const color = getColor(p);
                const val = PIECE_VALUES[type];
                const posBonus = POSITION_BONUS[type] ?
                    (color === 'w' ? POSITION_BONUS[type][r][c] : POSITION_BONUS[type][7 - r][c]) : 0;
                score += (color === 'w' ? 1 : -1) * (val + posBonus);
            }
        }
        return score;
    }

    function getAllMovesForColor(color, brd, ep, castle) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (brd[r][c] && getColor(brd[r][c]) === color) {
                    const legal = getLegalMoves(r, c, brd, ep, castle);
                    for (const m of legal) moves.push({ fromR: r, fromC: c, move: m });
                }
            }
        }
        moves.sort((a, b) => {
            const aCapture = (a.move.type === 'capture' || a.move.type === 'enpassant') ? 1 : 0;
            const bCapture = (b.move.type === 'capture' || b.move.type === 'enpassant') ? 1 : 0;
            return bCapture - aCapture;
        });
        return moves;
    }

    function minimax(brd, depth, alpha, beta, maximizing, ep, castle) {
        if (depth === 0) return evaluateBoard(brd);
        const color = maximizing ? 'w' : 'b';
        const moves = getAllMovesForColor(color, brd, ep, castle);
        if (moves.length === 0) {
            if (isInCheck(color, brd)) return maximizing ? -99999 + (3 - depth) : 99999 - (3 - depth);
            return 0;
        }
        if (maximizing) {
            let maxEval = -Infinity;
            for (const { fromR, fromC, move } of moves) {
                const sim = simulateMove(brd, fromR, fromC, move);
                const newEp = move.type === 'double' ? { r: (fromR + move.r) / 2, c: fromC } : null;
                const newCastle = { ...castle };
                const piece = brd[fromR][fromC];
                if (getType(piece) === 'K') { newCastle[color + 'K'] = false; newCastle[color + 'Q'] = false; }
                if (getType(piece) === 'R') {
                    if (fromC === 0) newCastle[color + 'Q'] = false;
                    if (fromC === 7) newCastle[color + 'K'] = false;
                }
                const ev = minimax(sim, depth - 1, alpha, beta, false, newEp, newCastle);
                maxEval = Math.max(maxEval, ev);
                alpha = Math.max(alpha, ev);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const { fromR, fromC, move } of moves) {
                const sim = simulateMove(brd, fromR, fromC, move);
                const newEp = move.type === 'double' ? { r: (fromR + move.r) / 2, c: fromC } : null;
                const newCastle = { ...castle };
                const piece = brd[fromR][fromC];
                if (getType(piece) === 'K') { newCastle[color + 'K'] = false; newCastle[color + 'Q'] = false; }
                if (getType(piece) === 'R') {
                    if (fromC === 0) newCastle[color + 'Q'] = false;
                    if (fromC === 7) newCastle[color + 'K'] = false;
                }
                const ev = minimax(sim, depth - 1, alpha, beta, true, newEp, newCastle);
                minEval = Math.min(minEval, ev);
                beta = Math.min(beta, ev);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function aiMove() {
        if (gameOver) return;
        const moves = getAllMovesForColor('b', board, enPassantTarget, castlingRights);
        if (moves.length === 0) return;
        let bestScore = Infinity;
        let bestMoves = [];
        for (const { fromR, fromC, move } of moves) {
            const sim = simulateMove(board, fromR, fromC, move);
            const newEp = move.type === 'double' ? { r: (fromR + move.r) / 2, c: fromC } : null;
            const score = minimax(sim, 2, -Infinity, Infinity, true, newEp, { ...castlingRights });
            if (score < bestScore) {
                bestScore = score;
                bestMoves = [{ fromR, fromC, move }];
            } else if (score === bestScore) {
                bestMoves.push({ fromR, fromC, move });
            }
        }
        const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        if (chosen) {
            const promoType = chosen.move.type === 'promotion' ? 'Q' : null;
            makeMove(chosen.fromR, chosen.fromC, chosen.move, promoType);
            switchTurn();
            render();
            updateStatus();
            checkGameEnd();
        }
    }

    return { init, render, PIECE_IMAGES, PIECE_NAMES, TEAM_COLORS };
})();
