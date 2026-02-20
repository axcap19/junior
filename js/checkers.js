// ==========================================
// FOOTBALL CHECKERS - Arsenal vs Barcelona
// ==========================================

const CheckersGame = (() => {
    // Team logos from Wikipedia
    const TEAM_IMAGES = {
        red: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
        black: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    };

    const TEAM_NAMES = { red: 'Arsenal', black: 'Barcelona' };
    const TEAM_COLORS = {
        red: { bg1: '#EF0107', bg2: '#9C0104', border: '#9C824A' },
        black: { bg1: '#A50044', bg2: '#004D98', border: '#EDBB00' },
    };

    let board = [];
    let currentTurn = 'red';
    let selectedCell = null;
    let validMoves = [];
    let gameOver = false;
    let vsAI = false;
    let mustJump = false;
    let multiJumpPiece = null;
    let onlineMode = false;
    let myColor = null;

    function init(ai, online, color) {
        vsAI = ai;
        onlineMode = online || false;
        myColor = color || null;
        board = [];
        currentTurn = 'red';
        selectedCell = null;
        validMoves = [];
        gameOver = false;
        mustJump = false;
        multiJumpPiece = null;

        for (let r = 0; r < 8; r++) {
            board[r] = [];
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) {
                    if (r < 3) board[r][c] = { color: 'black', king: false };
                    else if (r > 4) board[r][c] = { color: 'red', king: false };
                    else board[r][c] = null;
                } else {
                    board[r][c] = null;
                }
            }
        }

        if (onlineMode) {
            Multiplayer.setOnMoveReceived((moveData) => {
                const turnOver = makeMove(moveData.fromR, moveData.fromC, moveData.move);
                if (turnOver) {
                    switchTurn();
                }
                render();
                updateStatus();
                checkGameEnd();
            });
        }

        render();
        updateStatus();
    }

    function getMovesForPiece(r, c, brd) {
        const piece = brd[r][c];
        if (!piece) return { moves: [], jumps: [] };

        const moves = [];
        const jumps = [];
        const dirs = [];

        if (piece.color === 'red' || piece.king) dirs.push(-1);
        if (piece.color === 'black' || piece.king) dirs.push(1);

        for (const dr of dirs) {
            for (const dc of [-1, 1]) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;

                if (!brd[nr][nc]) {
                    moves.push({ r: nr, c: nc, type: 'move' });
                } else if (brd[nr][nc].color !== piece.color) {
                    const jr = nr + dr, jc = nc + dc;
                    if (jr >= 0 && jr <= 7 && jc >= 0 && jc <= 7 && !brd[jr][jc]) {
                        jumps.push({ r: jr, c: jc, type: 'jump', capturedR: nr, capturedC: nc });
                    }
                }
            }
        }
        return { moves, jumps };
    }

    function getAllJumps(color, brd) {
        const jumps = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (brd[r][c] && brd[r][c].color === color) {
                    const { jumps: pJumps } = getMovesForPiece(r, c, brd);
                    if (pJumps.length > 0) jumps.push({ r, c, jumps: pJumps });
                }
            }
        }
        return jumps;
    }

    function getLegalMoves(r, c) {
        const piece = board[r][c];
        if (!piece || piece.color !== currentTurn) return [];
        if (multiJumpPiece && (multiJumpPiece.r !== r || multiJumpPiece.c !== c)) return [];
        const { moves, jumps } = getMovesForPiece(r, c, board);
        if (multiJumpPiece) return jumps;
        const allJumps = getAllJumps(currentTurn, board);
        if (allJumps.length > 0) {
            const myJumps = allJumps.find(j => j.r === r && j.c === c);
            return myJumps ? myJumps.jumps : [];
        }
        return moves;
    }

    function makeMove(fromR, fromC, move) {
        const piece = board[fromR][fromC];
        board[move.r][move.c] = { ...piece };
        board[fromR][fromC] = null;
        if (move.type === 'jump') {
            board[move.capturedR][move.capturedC] = null;
        }
        if ((piece.color === 'red' && move.r === 0) || (piece.color === 'black' && move.r === 7)) {
            board[move.r][move.c].king = true;
        }
        if (move.type === 'jump') {
            const { jumps } = getMovesForPiece(move.r, move.c, board);
            if (jumps.length > 0) {
                multiJumpPiece = { r: move.r, c: move.c };
                selectedCell = { r: move.r, c: move.c };
                validMoves = jumps;
                render();
                updateStatus();
                return false;
            }
        }
        multiJumpPiece = null;
        return true;
    }

    function switchTurn() {
        currentTurn = currentTurn === 'red' ? 'black' : 'red';
    }

    function countPieces(color) {
        let count = 0;
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++)
                if (board[r][c] && board[r][c].color === color) count++;
        return count;
    }

    function hasLegalMoves(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] && board[r][c].color === color) {
                    const { moves, jumps } = getMovesForPiece(r, c, board);
                    if (moves.length > 0 || jumps.length > 0) return true;
                }
            }
        }
        return false;
    }

    function checkGameEnd() {
        const redCount = countPieces('red');
        const blackCount = countPieces('black');
        if (redCount === 0) {
            gameOver = true;
            showGameOver(`${TEAM_NAMES.black} Wins!`, 'All Arsenal pieces captured', 'checkers');
            return true;
        }
        if (blackCount === 0) {
            gameOver = true;
            showGameOver(`${TEAM_NAMES.red} Wins!`, 'All Barcelona pieces captured', 'checkers');
            return true;
        }
        if (!hasLegalMoves(currentTurn)) {
            gameOver = true;
            const winner = currentTurn === 'red' ? TEAM_NAMES.black : TEAM_NAMES.red;
            showGameOver(`${winner} Wins!`, `${TEAM_NAMES[currentTurn]} has no moves`, 'checkers');
            return true;
        }
        return false;
    }

    function updateStatus() {
        const statusEl = document.getElementById('checkers-status');
        const teamName = TEAM_NAMES[currentTurn];
        const emoji = currentTurn === 'red' ? '🔴' : '🔵';
        statusEl.textContent = `${teamName}'s Turn (${emoji})`;
        if (multiJumpPiece) statusEl.textContent += ' - Must continue jumping!';
    }

    function render() {
        const boardEl = document.getElementById('checkers-board');
        boardEl.innerHTML = '';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (selectedCell && r === selectedCell.r && c === selectedCell.c) {
                    cell.classList.add('selected');
                }
                const vm = validMoves.find(m => m.r === r && m.c === c);
                if (vm) {
                    if (vm.type === 'jump') cell.classList.add('valid-capture');
                    else cell.classList.add('valid-move');
                }

                if (board[r][c]) {
                    const piece = board[r][c];
                    const tc = TEAM_COLORS[piece.color];
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `checker-piece ${piece.color}${piece.king ? ' king' : ''}`;
                    pieceEl.style.background = `radial-gradient(circle at 35% 35%, ${tc.bg1}, ${tc.bg2})`;
                    pieceEl.style.borderColor = tc.border;
                    const img = document.createElement('img');
                    img.src = TEAM_IMAGES[piece.color];
                    img.alt = TEAM_NAMES[piece.color];
                    pieceEl.appendChild(img);
                    cell.appendChild(pieceEl);
                }

                cell.addEventListener('click', () => onCellClick(r, c));
                boardEl.appendChild(cell);
            }
        }
    }

    function onCellClick(r, c) {
        if (gameOver) return;
        if (vsAI && currentTurn === 'black') return;
        if (onlineMode && currentTurn !== myColor) return;
        const piece = board[r][c];
        const moveTarget = validMoves.find(m => m.r === r && m.c === c);
        if (moveTarget && selectedCell) {
            if (onlineMode) {
                Multiplayer.sendMove({ fromR: selectedCell.r, fromC: selectedCell.c, move: moveTarget });
            }
            const turnOver = makeMove(selectedCell.r, selectedCell.c, moveTarget);
            if (turnOver) {
                selectedCell = null;
                validMoves = [];
                switchTurn();
                render();
                updateStatus();
                if (checkGameEnd()) return;
                if (vsAI && currentTurn === 'black') setTimeout(aiMove, 400);
            }
            return;
        }
        if (!multiJumpPiece && piece && piece.color === currentTurn) {
            selectedCell = { r, c };
            validMoves = getLegalMoves(r, c);
        } else if (!multiJumpPiece) {
            selectedCell = null;
            validMoves = [];
        }
        render();
    }

    // ==========================================
    // CHECKERS AI
    // ==========================================
    function evaluateBoard(brd) {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = brd[r][c];
                if (!p) continue;
                let val = p.king ? 5 : 3;
                if (!p.king) {
                    val += p.color === 'black' ? r * 0.3 : (7 - r) * 0.3;
                }
                if (c >= 2 && c <= 5 && r >= 2 && r <= 5) val += 0.5;
                score += p.color === 'black' ? val : -val;
            }
        }
        return score;
    }

    function getAllAIMoves(color, brd) {
        const allJumps = [];
        const allMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (brd[r][c] && brd[r][c].color === color) {
                    const { moves, jumps } = getMovesForPiece(r, c, brd);
                    for (const j of jumps) allJumps.push({ fromR: r, fromC: c, move: j });
                    for (const m of moves) allMoves.push({ fromR: r, fromC: c, move: m });
                }
            }
        }
        return allJumps.length > 0 ? allJumps : allMoves;
    }

    function simulateAIMove(brd, fromR, fromC, move) {
        const sim = brd.map(row => row.map(cell => cell ? { ...cell } : null));
        sim[move.r][move.c] = { ...sim[fromR][fromC] };
        sim[fromR][fromC] = null;
        if (move.type === 'jump') sim[move.capturedR][move.capturedC] = null;
        const piece = sim[move.r][move.c];
        if ((piece.color === 'red' && move.r === 0) || (piece.color === 'black' && move.r === 7)) {
            piece.king = true;
        }
        return sim;
    }

    function checkersMinmax(brd, depth, alpha, beta, maximizing) {
        const color = maximizing ? 'black' : 'red';
        const moves = getAllAIMoves(color, brd);
        if (depth === 0 || moves.length === 0) return evaluateBoard(brd);

        if (maximizing) {
            let maxEval = -Infinity;
            for (const { fromR, fromC, move } of moves) {
                const sim = simulateAIMove(brd, fromR, fromC, move);
                const ev = checkersMinmax(sim, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, ev);
                alpha = Math.max(alpha, ev);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const { fromR, fromC, move } of moves) {
                const sim = simulateAIMove(brd, fromR, fromC, move);
                const ev = checkersMinmax(sim, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, ev);
                beta = Math.min(beta, ev);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function aiMove() {
        if (gameOver) return;
        function doAITurn() {
            const moves = getAllAIMoves('black', board);
            if (moves.length === 0) { checkGameEnd(); return; }
            let bestScore = -Infinity;
            let bestMoves = [];
            for (const { fromR, fromC, move } of moves) {
                const sim = simulateAIMove(board, fromR, fromC, move);
                const score = checkersMinmax(sim, 4, -Infinity, Infinity, false);
                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [{ fromR, fromC, move }];
                } else if (score === bestScore) {
                    bestMoves.push({ fromR, fromC, move });
                }
            }
            const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            if (chosen) {
                const turnOver = makeMove(chosen.fromR, chosen.fromC, chosen.move);
                render();
                if (!turnOver) {
                    setTimeout(doAITurn, 300);
                    return;
                }
                selectedCell = null;
                validMoves = [];
                switchTurn();
                render();
                updateStatus();
                checkGameEnd();
            }
        }
        doAITurn();
    }

    return { init, render, TEAM_IMAGES, TEAM_NAMES };
})();
