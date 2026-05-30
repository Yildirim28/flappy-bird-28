// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM elements
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScoreElement = document.getElementById('finalScore');
const bestScoreElement = document.getElementById('bestScore');

// Game constants
const GRAVITY = 0.5;
const FLAP_FORCE = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 3;
const PIPE_INTERVAL = 1600; // ms between pipe spawns
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
}

// Flap the bird
function flap() {
    bird.velocity = FLAP_FORCE;
    bird.flapFrame = 10;
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

    // Bird rotation based on velocity
    if (bird.velocity < 0) {
        bird.rotation = Math.max(-30, bird.velocity * 3);
    } else {
        bird.rotation = Math.min(90, bird.velocity * 3);
    }

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

    // Clouds
    for (const cloud of clouds) {
        drawCloud(cloud.x, cloud.y, cloud.width);
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