// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM elements
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScoreElement = document.getElementById('finalScore');
const bestScoreElement = document.getElementById('bestScore');

// Game constants (tuned for snappier feel)
const GRAVITY = 0.38; // slightly reduced for floaty feel
const FLAP_FORCE = -9; // stronger flap impulse
const PIPE_WIDTH = 60;
let PIPE_GAP = 150;
let PIPE_SPEED = 3; // mutable for progressive difficulty
const PIPE_INTERVAL = 1600; // ms between pipe spawns
const DIFFICULTY_INCREASE_SCORE = 5; // every N points
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;
const GROUND_HEIGHT = 80;
const BIRD_X = 80;

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameover'
let bird = {};
let pipes = [];
let score = 0;
let bestScore = 0;
let lastPipeTime = 0;
let groundOffset = 0;
let frameCount = 0;

// Colors
const COLORS = {
    skyTop: '#70c5ce',
    skyBottom: '#87ceeb',
    ground: '#ded895',
    groundDark: '#d2b04c',
    groundLine: '#538200',
    pipeBody: '#73bf2e',
    pipeBorder: '#558b2f',
    pipeCap: '#8bc34a',
    pipeCapBorder: '#558b2f',
    birdBody: '#f5c842',
    birdWing: '#e0a800',
    birdEye: '#ffffff',
    birdPupil: '#000000',
    birdBeak: '#e74c3c',
    cloud: 'rgba(255, 255, 255, 0.6)'
};

// Cloud data
let clouds = [];
let hillsFar = [];
let hillsNear = [];
let particles = [];

// Linear interpolation helper
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Initialize clouds
function initClouds() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - GROUND_HEIGHT - 200) + 30,
            width: Math.random() * 80 + 40,
            speed: Math.random() * 0.5 + 0.2
        });
    }
}

// Hills for parallax (simple arc shapes)
function initHills() {
    hillsFar = [];
    hillsNear = [];
    for (let i = 0; i < 3; i++) {
        hillsFar.push({ x: i * (canvas.width / 2), speed: 0.25, height: 60 + Math.random() * 30 });
        hillsNear.push({ x: i * (canvas.width / 1.2), speed: 0.6, height: 40 + Math.random() * 30 });
    }
}

// Particle system for score/hit feedback
function spawnParticles(x, y, color = 'rgba(255,255,255,0.9)', count = 12, spread = 30, speed = 2) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = (Math.random() * 0.6 + 0.4) * speed;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * s,
            vy: Math.sin(angle) * s - Math.random() * 1.5,
            life: 60 + Math.random() * 30,
            color: color,
            size: Math.random() * 3 + 1
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.06; // gravity on particles
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / 80);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Initialize bird
function initBird() {
    bird = {
        x: BIRD_X,
        y: canvas.height / 2 - BIRD_HEIGHT / 2,
        width: BIRD_WIDTH,
        height: BIRD_HEIGHT,
        velocity: 0,
        rotation: 0,
        flapFrame: 0
    };
}

// Initialize game
function initGame() {
    initBird();
    pipes = [];
    score = 0;
    lastPipeTime = 0;
    groundOffset = 0;
    frameCount = 0;
    scoreDisplay.textContent = '0';
    initClouds();
    initHills();
    particles = [];
}

// Flap the bird
function flap() {
    bird.velocity = FLAP_FORCE;
    bird.flapFrame = 12;
}

// Spawn a pipe
function spawnPipe() {
    const minY = 80;
    const maxY = canvas.height - GROUND_HEIGHT - PIPE_GAP - 80;
    const topHeight = Math.random() * (maxY - minY) + minY;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + PIPE_GAP,
        scored: false
    });
}

// Update game logic
function update() {
    if (gameState !== 'playing') return;

    frameCount++;

    // Update bird
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Smooth rotation using lerp for less jitter
    const targetRot = bird.velocity * 3;
    bird.rotation = lerp(bird.rotation, Math.max(-40, Math.min(90, targetRot)), 0.08);

    // Flap animation
    if (bird.flapFrame > 0) {
        bird.flapFrame--;
    }

    // Ground collision
    if (bird.y + bird.height >= canvas.height - GROUND_HEIGHT) {
        gameOver();
        return;
    }

    // Top boundary collision
    if (bird.y <= 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    // Spawn pipes
    const now = Date.now();
    if (now - lastPipeTime > PIPE_INTERVAL) {
        spawnPipe();
        lastPipeTime = now;
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;

        // Score when bird passes pipe
        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < bird.x) {
            pipes[i].scored = true;
            score++;
            scoreDisplay.textContent = score;
            // visual/audio feedback
            spawnParticles(bird.x + bird.width/2, bird.y + bird.height/2, 'rgba(255,215,0,0.95)', 14, 40, 2.2);
            scoreDisplay.classList.add('pop');
            setTimeout(() => scoreDisplay.classList.remove('pop'), 380);

            // Progressive difficulty
            if (score % DIFFICULTY_INCREASE_SCORE === 0) {
                PIPE_SPEED = Math.min(6, PIPE_SPEED + 0.2);
                PIPE_GAP = Math.max(110, PIPE_GAP - 4);
            }
        }

        // Remove off-screen pipes
        if (pipes[i].x + PIPE_WIDTH < -10) {
            pipes.splice(i, 1);
        }
    }

    // Collision detection with pipes
    for (const pipe of pipes) {
        // Check if bird is in pipe's x range
        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + PIPE_WIDTH) {
            // Check top pipe collision
            if (bird.y < pipe.topHeight) {
                gameOver();
                return;
            }
            // Check bottom pipe collision
            if (bird.y + bird.height > pipe.bottomY) {
                gameOver();
                return;
            }
        }
    }

    // Update ground offset
    groundOffset = (groundOffset + PIPE_SPEED) % 24;

    // Update clouds
    for (const cloud of clouds) {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width + cloud.width;
            cloud.y = Math.random() * (canvas.height - GROUND_HEIGHT - 200) + 30;
        }
    }

    // Update hills (parallax)
    for (const h of hillsFar) {
        h.x -= h.speed;
        if (h.x + canvas.width/2 < -50) h.x = canvas.width + 20;
    }
    for (const h of hillsNear) {
        h.x -= h.speed;
        if (h.x + canvas.width/1.2 < -50) h.x = canvas.width + 20;
    }

    // Update particles
    updateParticles();
}

// Game over
function gameOver() {
    gameState = 'gameover';
    if (score > bestScore) {
        bestScore = score;
    }
    finalScoreElement.textContent = score;
    bestScoreElement.textContent = bestScore;
    gameOverOverlay.classList.remove('hidden');
    scoreDisplay.style.display = 'none';
    // big hit particles
    spawnParticles(bird.x + bird.width/2, bird.y + bird.height/2, 'rgba(240,60,60,0.95)', 30, 60, 3.5);
}

// Start game
function startGame() {
    initGame();
    gameState = 'playing';
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    scoreDisplay.style.display = 'block';
    flap();
}

// Draw background
function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height - GROUND_HEIGHT);
    gradient.addColorStop(0, COLORS.skyTop);
    gradient.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height - GROUND_HEIGHT);

    // Parallax hills (far)
    for (const h of hillsFar) {
        drawHill(h.x, canvas.height - GROUND_HEIGHT - 20, h.height, 'rgba(20,90,70,0.12)');
    }

    // Clouds
    for (const cloud of clouds) {
        drawCloud(cloud.x, cloud.y, cloud.width);
    }

    // Parallax hills (near)
    for (const h of hillsNear) {
        drawHill(h.x - 40, canvas.height - GROUND_HEIGHT + 10, h.height + 20, 'rgba(10,120,80,0.18)');
    }
}

// Draw a cloud
function drawCloud(x, y, width) {
    ctx.fillStyle = COLORS.cloud;
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2, width / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - width / 4, y + width / 8, width / 3, width / 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + width / 4, y + width / 8, width / 3, width / 5, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawHill(x, baseY, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 200, baseY + 100);
    ctx.quadraticCurveTo(x + 80, baseY - h, x + 400, baseY + 100);
    ctx.lineTo(x + 400, baseY + 200);
    ctx.lineTo(x - 200, baseY + 200);
    ctx.closePath();
    ctx.fill();
}

// Draw ground
function drawGround() {
    const groundY = canvas.height - GROUND_HEIGHT;

    // Main ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, groundY, canvas.width, GROUND_HEIGHT);

    // Ground top line
    ctx.fillStyle = COLORS.groundLine;
    ctx.fillRect(0, groundY, canvas.width, 4);

    // Ground pattern (moving stripes)
    ctx.fillStyle = COLORS.groundDark;
    for (let i = -groundOffset; i < canvas.width + 24; i += 24) {
        ctx.fillRect(i, groundY + 10, 12, GROUND_HEIGHT - 10);
    }
}

// Draw a pipe
function drawPipe(pipe) {
    const capHeight = 26;
    const capOverhang = 6;

    // Top pipe body
    ctx.fillStyle = COLORS.pipeBody;
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight - capHeight);

    // Top pipe border
    ctx.strokeStyle = COLORS.pipeBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight - capHeight);

    // Top pipe cap
    ctx.fillStyle = COLORS.pipeCap;
    ctx.fillRect(pipe.x - capOverhang, pipe.topHeight - capHeight, PIPE_WIDTH + capOverhang * 2, capHeight);
    ctx.strokeStyle = COLORS.pipeCapBorder;
    ctx.strokeRect(pipe.x - capOverhang, pipe.topHeight - capHeight, PIPE_WIDTH + capOverhang * 2, capHeight);

    // Bottom pipe body
    ctx.fillStyle = COLORS.pipeBody;
    ctx.fillRect(pipe.x, pipe.bottomY + capHeight, PIPE_WIDTH, canvas.height - GROUND_HEIGHT - pipe.bottomY - capHeight);

    // Bottom pipe border
    ctx.strokeStyle = COLORS.pipeBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(pipe.x, pipe.bottomY + capHeight, PIPE_WIDTH, canvas.height - GROUND_HEIGHT - pipe.bottomY - capHeight);

    // Bottom pipe cap
    ctx.fillStyle = COLORS.pipeCap;
    ctx.fillRect(pipe.x - capOverhang, pipe.bottomY, PIPE_WIDTH + capOverhang * 2, capHeight);
    ctx.strokeStyle = COLORS.pipeCapBorder;
    ctx.strokeRect(pipe.x - capOverhang, pipe.bottomY, PIPE_WIDTH + capOverhang * 2, capHeight);

    // Pipe highlight (shine effect)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(pipe.x + 6, 0, 8, pipe.topHeight - capHeight);
    ctx.fillRect(pipe.x + 6, pipe.bottomY + capHeight, 8, canvas.height - GROUND_HEIGHT - pipe.bottomY - capHeight);
}

// Draw bird
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation * Math.PI / 180);

    // Body
    ctx.fillStyle = COLORS.birdBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body outline
    ctx.strokeStyle = '#c9a800';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wing
    const wingY = bird.flapFrame > 0 ? -5 : 3;
    ctx.fillStyle = COLORS.birdWing;
    ctx.beginPath();
    ctx.ellipse(-5, wingY, 12, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eye (white)
    ctx.fillStyle = COLORS.birdEye;
    ctx.beginPath();
    ctx.arc(10, -5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = COLORS.birdPupil;
    ctx.beginPath();
    ctx.arc(12, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = COLORS.birdBeak;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, 2);
    ctx.lineTo(15, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    // Draw pipes
    for (const pipe of pipes) {
        drawPipe(pipe);
    }

    drawGround();

    // Draw particles behind bird for depth
    drawParticles();

    // Draw bird
    drawBird();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Input handling
function handleInput() {
    if (gameState === 'start') {
        startGame();
    } else if (gameState === 'playing') {
        flap();
    } else if (gameState === 'gameover') {
        startGame();
    }
}

// Keyboard events
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput();
    }
});

// Mouse/touch events
canvas.addEventListener('click', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput();
});

// Also handle clicks on overlays
startOverlay.addEventListener('click', handleInput);
gameOverOverlay.addEventListener('click', handleInput);

// Initialize and start game loop
initGame();
gameLoop();