// ==========================================
// FOOTBALL PONG - Arsenal vs Barcelona
// ==========================================

const PongGame = (() => {
    let canvas, ctx;
    let animFrame;
    let gameRunning = false;
    let vsAI = false;
    let gameOver = false;
    let winner = null;
    const WINNING_SCORE = 7;

    // Pitch colors
    const PITCH_GREEN = '#2d6a30';
    const PITCH_LINE = 'rgba(255,255,255,0.3)';
    const ARSENAL_RED = '#EF0107';
    const BARCA_MAROON = '#A50044';
    const BARCA_BLUE = '#004D98';
    const GOLD = '#f5a623';

    // Game objects
    let ball, paddleL, paddleR, score;

    // Keys pressed
    const keys = {};

    function init(ai) {
        vsAI = ai;
        gameOver = false;
        winner = null;
        canvas = document.getElementById('pong-canvas');
        ctx = canvas.getContext('2d');
        resizeCanvas();

        score = { left: 0, right: 0 };
        resetBall();
        resetPaddles();

        if (animFrame) cancelAnimationFrame(animFrame);
        gameRunning = true;
        loop();
    }

    function resizeCanvas() {
        const container = canvas.parentElement;
        const maxW = Math.min(800, window.innerWidth - 40);
        const maxH = maxW * 0.6;
        canvas.width = maxW;
        canvas.height = maxH;
    }

    function resetBall() {
        const w = canvas.width, h = canvas.height;
        ball = {
            x: w / 2,
            y: h / 2,
            radius: Math.max(8, w * 0.015),
            dx: (Math.random() > 0.5 ? 1 : -1) * w * 0.005,
            dy: (Math.random() - 0.5) * w * 0.006,
            speed: w * 0.005,
            trail: []
        };
    }

    function resetPaddles() {
        const w = canvas.width, h = canvas.height;
        const pw = Math.max(12, w * 0.018);
        const ph = h * 0.2;
        paddleL = { x: 20, y: h / 2 - ph / 2, w: pw, h: ph, speed: w * 0.007, color: ARSENAL_RED };
        paddleR = { x: w - 20 - pw, y: h / 2 - ph / 2, w: pw, h: ph, speed: w * 0.007, color: BARCA_MAROON };
    }

    function loop() {
        if (!gameRunning) return;
        update();
        draw();
        animFrame = requestAnimationFrame(loop);
    }

    function update() {
        if (gameOver) return;
        const w = canvas.width, h = canvas.height;

        // Player 1 controls (W/S)
        if (keys['w'] || keys['W'] || keys['ArrowUp'] && !vsAI ? false : false) {}
        if (keys['w'] || keys['W']) paddleL.y -= paddleL.speed;
        if (keys['s'] || keys['S']) paddleL.y += paddleL.speed;

        // Player 2 controls (Arrow keys) or AI
        if (vsAI) {
            // AI tracks ball with slight delay
            const aiCenter = paddleR.y + paddleR.h / 2;
            const diff = ball.y - aiCenter;
            const aiSpeed = paddleR.speed * 0.7;
            if (Math.abs(diff) > paddleR.h * 0.15) {
                paddleR.y += Math.sign(diff) * Math.min(aiSpeed, Math.abs(diff));
            }
        } else {
            if (keys['ArrowUp']) paddleR.y -= paddleR.speed;
            if (keys['ArrowDown']) paddleR.y += paddleR.speed;
        }

        // Clamp paddles
        paddleL.y = Math.max(0, Math.min(h - paddleL.h, paddleL.y));
        paddleR.y = Math.max(0, Math.min(h - paddleR.h, paddleR.y));

        // Ball trail
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();

        // Move ball
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Top/bottom bounce
        if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= h) {
            ball.dy *= -1;
            ball.y = ball.y - ball.radius <= 0 ? ball.radius : h - ball.radius;
        }

        // Paddle collision - left
        if (ball.dx < 0 && ball.x - ball.radius <= paddleL.x + paddleL.w &&
            ball.x + ball.radius >= paddleL.x &&
            ball.y >= paddleL.y && ball.y <= paddleL.y + paddleL.h) {
            ball.dx = Math.abs(ball.dx) * 1.05;
            const hitPos = (ball.y - paddleL.y) / paddleL.h - 0.5;
            ball.dy = hitPos * ball.speed * 2;
            ball.x = paddleL.x + paddleL.w + ball.radius;
        }

        // Paddle collision - right
        if (ball.dx > 0 && ball.x + ball.radius >= paddleR.x &&
            ball.x - ball.radius <= paddleR.x + paddleR.w &&
            ball.y >= paddleR.y && ball.y <= paddleR.y + paddleR.h) {
            ball.dx = -Math.abs(ball.dx) * 1.05;
            const hitPos = (ball.y - paddleR.y) / paddleR.h - 0.5;
            ball.dy = hitPos * ball.speed * 2;
            ball.x = paddleR.x - ball.radius;
        }

        // Speed cap
        const maxSpeed = w * 0.012;
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (currentSpeed > maxSpeed) {
            ball.dx = (ball.dx / currentSpeed) * maxSpeed;
            ball.dy = (ball.dy / currentSpeed) * maxSpeed;
        }

        // Score
        if (ball.x < 0) {
            score.right++;
            updateScoreDisplay();
            if (score.right >= WINNING_SCORE) {
                endGame('Barcelona');
            } else {
                resetBall();
            }
        }
        if (ball.x > w) {
            score.left++;
            updateScoreDisplay();
            if (score.left >= WINNING_SCORE) {
                endGame('Arsenal');
            } else {
                resetBall();
            }
        }
    }

    function draw() {
        const w = canvas.width, h = canvas.height;

        // Pitch background
        ctx.fillStyle = PITCH_GREEN;
        ctx.fillRect(0, 0, w, h);

        // Pitch markings
        ctx.strokeStyle = PITCH_LINE;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        // Center line
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();

        // Center circle
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, h * 0.2, 0, Math.PI * 2);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = PITCH_LINE;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Goal areas
        ctx.strokeRect(0, h * 0.25, w * 0.08, h * 0.5);
        ctx.strokeRect(w - w * 0.08, h * 0.25, w * 0.08, h * 0.5);

        // Penalty areas
        ctx.strokeRect(0, h * 0.15, w * 0.15, h * 0.7);
        ctx.strokeRect(w - w * 0.15, h * 0.15, w * 0.15, h * 0.7);

        // Corner arcs
        const cornerR = w * 0.025;
        ctx.beginPath(); ctx.arc(0, 0, cornerR, 0, Math.PI / 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(w, 0, cornerR, Math.PI / 2, Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, h, cornerR, -Math.PI / 2, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(w, h, cornerR, Math.PI, Math.PI * 1.5); ctx.stroke();

        // Ball trail
        for (let i = 0; i < ball.trail.length; i++) {
            const t = ball.trail[i];
            const alpha = (i / ball.trail.length) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, ball.radius * (i / ball.trail.length), 0, Math.PI * 2);
            ctx.fill();
        }

        // Ball (football style)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Pentagon pattern on ball
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Left paddle (Arsenal)
        drawPaddle(paddleL, ARSENAL_RED, '#fff');

        // Right paddle (Barcelona)
        drawPaddle(paddleR, BARCA_MAROON, BARCA_BLUE);

        // Game over overlay on canvas
        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = GOLD;
            ctx.font = `bold ${w * 0.06}px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(`${winner} Wins!`, w / 2, h / 2 - 10);
            ctx.fillStyle = '#fff';
            ctx.font = `${w * 0.025}px 'Segoe UI', sans-serif`;
            ctx.fillText(`${score.left} - ${score.right}`, w / 2, h / 2 + 25);
            ctx.fillText('Press SPACE to play again', w / 2, h / 2 + 55);
        }
    }

    function drawPaddle(p, mainColor, stripeColor) {
        // Main paddle body
        ctx.fillStyle = mainColor;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        roundRect(ctx, p.x, p.y, p.w, p.h, 6);
        ctx.fill();

        // Stripe
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = stripeColor;
        const stripeH = p.h * 0.15;
        roundRect(ctx, p.x, p.y + p.h / 2 - stripeH / 2, p.w, stripeH, 2);
        ctx.fill();

        // Border glow
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        roundRect(ctx, p.x, p.y, p.w, p.h, 6);
        ctx.stroke();
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function updateScoreDisplay() {
        const el = document.getElementById('pong-score');
        if (el) el.textContent = `${score.left} - ${score.right}`;
    }

    function endGame(winnerName) {
        gameOver = true;
        winner = winnerName;
        showGameOver(`${winnerName} Wins!`, `Final score: ${score.left} - ${score.right}`, 'pong');
    }

    function stop() {
        gameRunning = false;
        if (animFrame) cancelAnimationFrame(animFrame);
    }

    // Keyboard
    function onKeyDown(e) {
        keys[e.key] = true;
        if (e.key === ' ' && gameOver) {
            const overlay = document.querySelector('.game-over-overlay');
            if (overlay) overlay.remove();
            init(vsAI);
        }
        // Prevent scrolling with arrow keys
        if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
    }
    function onKeyUp(e) {
        keys[e.key] = false;
    }

    function attachControls() {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
    }
    function detachControls() {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
    }

    // Handle window resize
    function onResize() {
        if (!canvas) return;
        const oldW = canvas.width;
        const oldH = canvas.height;
        resizeCanvas();
        const scaleX = canvas.width / oldW;
        const scaleY = canvas.height / oldH;
        // Scale game objects
        if (ball) {
            ball.x *= scaleX; ball.y *= scaleY;
            ball.dx *= scaleX; ball.dy *= scaleY;
            ball.radius = Math.max(8, canvas.width * 0.015);
            ball.speed = canvas.width * 0.005;
        }
        if (paddleL) {
            paddleL.y *= scaleY;
            paddleL.h = canvas.height * 0.2;
            paddleL.w = Math.max(12, canvas.width * 0.018);
            paddleL.speed = canvas.width * 0.007;
        }
        if (paddleR) {
            paddleR.x = canvas.width - 20 - paddleR.w;
            paddleR.y *= scaleY;
            paddleR.h = canvas.height * 0.2;
            paddleR.w = Math.max(12, canvas.width * 0.018);
            paddleR.speed = canvas.width * 0.007;
        }
    }

    window.addEventListener('resize', onResize);

    return { init, stop, attachControls, detachControls };
})();
