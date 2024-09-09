const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set a specific canvas size
canvas.width = 800;
canvas.height = 600;

// Gravity and platform
const gravity = 0.5;
const jumpStrength = -12;
const groundY = canvas.height - 50; // Position of the ground

// Player properties
const playerSize = 50;
const playerSpeed = 5;
const maxBlocks = 30; // Maximum number of blocks per player
const maxHealth = 10; // Each player has 10 health points
const maxLives = 10;  // Each player has 10 lives

const gridSize = 20; // Size of each grid cell (same as block size)

const player1 = {
    x: 100,
    y: groundY - playerSize,
    vy: 0,
    onGround: true,
    img: new Image(),
    bullets: [],
    blocks: [],
    direction: 'right',
    health: maxHealth,
    lives: maxLives,
    isAlive: true,
    speed: playerSpeed,
    originalSpeed: playerSpeed,
    originalJump: jumpStrength,
    jump: jumpStrength,
    originalImage: 'player1.png',
    effectActive: false, // Track if the "Big Mac" effect is active
    syringeEffectActive: false, // Track if the "Syringe" effect is active
};

const player2 = {
    x: canvas.width - 150,
    y: groundY - playerSize,
    vy: 0,
    onGround: true,
    img: new Image(),
    bullets: [],
    blocks: [],
    direction: 'left',
    health: maxHealth,
    lives: maxLives,
    isAlive: true,
    speed: playerSpeed,
    originalSpeed: playerSpeed,
    originalJump: jumpStrength,
    jump: jumpStrength,
    originalImage: 'player2.png',
    effectActive: false, // Track if the "Big Mac" effect is active
    syringeEffectActive: false, // Track if the "Syringe" effect is active
};

// Load player images
player1.img.src = 'player1.png';
player2.img.src = 'player2.png';

player1.img.onload = () => {
    player1.isLoaded = true;
};
player2.img.onload = () => {
    player2.isLoaded = true;
};

// Block properties
const blockSize = gridSize;  // Set block size to match grid size

// Bullet properties
const bulletSpeed = 10;
const bulletSize = 5;

// Big Mac properties
const bigMacSize = 20; // 20x20 size for the "Big Mac"
let bigMacs = [];

// Syringe properties
const syringeSize = 20; // Same size as Big Mac
let syringes = [];

// Load Big Mac and Syringe images
const bigMacImage = new Image();
bigMacImage.src = 'bigmac.png';

const syringeImage = new Image();
syringeImage.src = 'syringe.png';

// Key tracking
const keys = {};

// Listen for keydown and keyup events
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;

    // Jumping logic
    if (event.key === 'w' && player1.onGround) {
        player1.vy = player1.jump;
        player1.onGround = false;
    }
    if (event.key === 'ArrowUp' && player2.onGround) {
        player2.vy = player2.jump;
        player2.onGround = false;
    }

    // Placing blocks when in the air
    if (event.key === 's' && !player1.onGround) {
        placeBlock(player1);
    }
    if (event.key === 'ArrowDown' && !player2.onGround) {
        placeBlock(player2);
    }

    // Shooting for Player 1 (E key)
    if (event.key === 'e') {
        shootBullet(player1);
    }

    // Shooting for Player 2 (Spacebar)
    if (event.key === ' ') {
        shootBullet(player2);
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

function placeBlock(player) {
    let blockX = Math.floor((player.x + playerSize / 2) / gridSize) * gridSize;
    let blockY = Math.floor((player.y + playerSize) / gridSize) * gridSize;

    if (blockY < canvas.height - gridSize && !isCollidingWithBlocksOrGround(blockX, blockY)) {
        if (player.blocks.length >= maxBlocks) {
            removeOldestBlock(player);
        }

        const newBlock = {
            x: blockX,
            y: blockY,
            width: gridSize,
            height: gridSize,
            timePlaced: Date.now(),
        };

        player.blocks.push(newBlock);
    }
}

function removeOldestBlock(player) {
    if (player.blocks.length > 0) {
        player.blocks.shift();
    }
}

function isCollidingWithBlocksOrGround(x, y) {
    if (y + blockSize > groundY || x < 0 || x + blockSize > canvas.width) {
        return true; // Collision with ground or canvas edge
    }

    for (let player of [player1, player2]) {
        for (let block of player.blocks) {
            if (
                x < block.x + block.width &&
                x + blockSize > block.x &&
                y < block.y + block.height &&
                y + blockSize > block.y
            ) {
                return true; // Collision with another block
            }
        }
    }
    return false;
}

function shootBullet(player) {
    const bulletOffsetX = player.direction === 'right' ? playerSize : -bulletSize;
    let bullet = {
        x: player.x + bulletOffsetX,
        y: player.y + playerSize / 2,
        direction: player.direction,
    };
    player.bullets.push(bullet);
}

function checkBulletCollision(player, opponent) {
    player.bullets = player.bullets.filter(bullet => {
        if (
            bullet.x < opponent.x + playerSize &&
            bullet.x + bulletSize > opponent.x &&
            bullet.y < opponent.y + playerSize &&
            bullet.y + bulletSize > opponent.y
        ) {
            opponent.health -= 1; // Reduce opponent's health by 1
            if (opponent.health <= 0) {
                opponent.lives -= 1;
                opponent.health = maxHealth; // Reset health
                if (opponent.lives <= 0) {
                    opponent.isAlive = false;
                    endGame(player); // End game if opponent has no lives left
                }
            }
            return false; // Remove the bullet
        }
        return true; // Keep the bullet
    });
}

function update() {
    applyGravity(player1);
    applyGravity(player2);

    if (player1.isAlive) {
        if (keys['a']) {
            movePlayerHorizontally(player1, -player1.speed);
            player1.direction = 'left';
        }
        if (keys['d']) {
            movePlayerHorizontally(player1, player1.speed);
            player1.direction = 'right';
        }
    }

    if (player2.isAlive) {
        if (keys['ArrowLeft']) {
            movePlayerHorizontally(player2, -player2.speed);
            player2.direction = 'left';
        }
        if (keys['ArrowRight']) {
            movePlayerHorizontally(player2, player2.speed);
            player2.direction = 'right';
        }
    }

    moveBullets(player1);
    moveBullets(player2);

    checkBulletCollision(player1, player2);
    checkBulletCollision(player2, player1);

    removeExpiredBlocks(player1);
    removeExpiredBlocks(player2);

    moveBigMacs();
    checkBigMacCollision(player1);
    checkBigMacCollision(player2);

    moveSyringes();
    checkSyringeCollision(player1);
    checkSyringeCollision(player2);
}

function removeExpiredBlocks(player) {
    const now = Date.now();
    player.blocks = player.blocks.filter(block => now - block.timePlaced < 20000);
}

function applyGravity(player) {
    if (player.y + playerSize < groundY || player.vy < 0) {
        player.vy += gravity;
        player.onGround = false;
    } else {
        player.vy = 0;
        player.onGround = true;
        player.y = groundY - playerSize;
    }

    player.y += player.vy;

    // Prevent going off the top of the screen
    if (player.y < 0) {
        player.y = 0;
        player.vy = 0;
    }

    handleBlockCollision(player);
}

function handleBlockCollision(player) {
    player.blocks.forEach(block => {
        if (
            player.x < block.x + block.width &&
            player.x + playerSize > block.x &&
            player.y + playerSize > block.y &&
            player.y < block.y
        ) {
            player.vy = 0;
            player.onGround = true;
            player.y = block.y - playerSize;
        }

        if (
            player.x < block.x + block.width &&
            player.x + playerSize > block.x &&
            player.y < block.y + block.height &&
            player.y + playerSize > block.y + block.height
        ) {
            player.vy = 0;
            player.y = block.y + block.height;
        }

        if (
            player.y + playerSize > block.y &&
            player.y < block.y + block.height
        ) {
            if (player.x < block.x && player.x + playerSize > block.x) {
                player.x = block.x - playerSize;
            }
            if (player.x + playerSize > block.x + block.width && player.x < block.x + block.width) {
                player.x = block.x + block.width;
            }
        }
    });

    // Prevent going off the left or right sides of the screen
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + playerSize > canvas.width) {
        player.x = canvas.width - playerSize;
    }
}

function movePlayerHorizontally(player, speed) {
    player.x += speed;

    for (let p of [player1, player2]) {
        p.blocks.forEach(block => {
            if (
                player.y + playerSize > block.y &&
                player.y < block.y + block.height
            ) {
                if (speed > 0 && player.x < block.x && player.x + playerSize > block.x) {
                    player.x = block.x - playerSize;
                } else if (speed < 0 && player.x + playerSize > block.x + block.width && player.x < block.x + block.width) {
                    player.x = block.x + block.width;
                }
            }
        });
    }
}

function moveBullets(player) {
    player.bullets = player.bullets.map(bullet => {
        if (bullet.direction === 'left') {
            bullet.x -= bulletSpeed;
        } else {
            bullet.x += bulletSpeed;
        }
        return bullet;
    }).filter(bullet => bullet.x > 0 && bullet.x < canvas.width);
}

// Big Mac functionality
function spawnBigMac() {
    const x = Math.random() * (canvas.width - bigMacSize);
    const bigMac = {
        x: x,
        y: 0,
        width: bigMacSize,
        height: bigMacSize,
    };
    bigMacs.push(bigMac);
}

function moveBigMacs() {
    bigMacs.forEach(bigMac => {
        bigMac.y += 2; // Big Mac falling speed
    });
    bigMacs = bigMacs.filter(bigMac => bigMac.y < canvas.height);
}

function checkBigMacCollision(player) {
    bigMacs = bigMacs.filter(bigMac => {
        if (
            player.x < bigMac.x + bigMac.width &&
            player.x + playerSize > bigMac.x &&
            player.y < bigMac.y + bigMac.height &&
            player.y + playerSize > bigMac.y
        ) {
            if (!player.effectActive) { // Apply the effect only if not active
                player.effectActive = true;

                player.health = maxHealth;
                player.lives = Math.min(player.lives + 2, maxLives);

                const originalSpeed = player.speed;
                player.speed = player.speed / 2;
                const originalImage = player.img.src;
                player.img.src = 'playerfat.png';

                setTimeout(() => {
                    player.speed = originalSpeed;
                    player.img.src = originalImage;
                    player.effectActive = false; // Effect wears off
                }, 50000); // 50 seconds

                return false; // Remove the Big Mac
            }
        }
        return true; // Keep the Big Mac
    });
}

// Syringe functionality
function spawnSyringe() {
    const x = Math.random() * (canvas.width - syringeSize);
    const syringe = {
        x: x,
        y: 0,
        width: syringeSize,
        height: syringeSize,
    };
    syringes.push(syringe);
}

function moveSyringes() {
    syringes.forEach(syringe => {
        syringe.y += 2; // Syringe falling speed
    });
    syringes = syringes.filter(syringe => syringe.y < canvas.height);
}

function checkSyringeCollision(player) {
    syringes = syringes.filter(syringe => {
        if (
            player.x < syringe.x + syringe.width &&
            player.x + playerSize > syringe.x &&
            player.y < syringe.y + syringe.height &&
            player.y + playerSize > syringe.y
        ) {
            if (!player.syringeEffectActive) { // Apply the effect only if not active
                player.syringeEffectActive = true;

                player.lives = Math.max(player.lives - 1, 0); // Lose a life
                player.speed = player.originalSpeed * 2; // Double speed
                player.jump = player.originalJump * 2; // Double jump

                setTimeout(() => {
                    player.speed = player.originalSpeed;
                    player.jump = player.originalJump;
                    player.syringeEffectActive = false; // Effect wears off
                }, 50000); // 50 seconds

                return false; // Remove the Syringe
            }
        }
        return true; // Keep the Syringe
    });
}

function drawPlayer(player) {
    const imgWidth = player.img.width;
    const imgHeight = player.img.height;
    const aspectRatio = imgWidth / imgHeight;
    const width = playerSize * aspectRatio;
    const height = playerSize;

    ctx.drawImage(player.img, player.x, player.y, width, height);

    // Draw health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x, player.y - 10, width * (player.health / maxHealth), 5);
}

function drawLives() {
    // Draw Player 1's lives as a red bar
    ctx.fillStyle = 'red';
    ctx.fillRect(20, 20, 20 * player1.lives, 20);

    // Draw Player 2's lives as a blue bar
    ctx.fillStyle = 'blue';
    ctx.fillRect(canvas.width - 220, 20, 20 * player2.lives, 20);
}

function drawBigMacs() {
    bigMacs.forEach(bigMac => {
        ctx.drawImage(bigMacImage, bigMac.x, bigMac.y, bigMac.width, bigMac.height);
    });
}

function drawSyringes() {
    syringes.forEach(syringe => {
        ctx.drawImage(syringeImage, syringe.x, syringe.y, syringe.width, syringe.height);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#654321';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    ctx.fillStyle = '#888';
    player1.blocks.forEach(block => {
        ctx.fillRect(block.x, block.y, block.width, block.height);
    });
    player2.blocks.forEach(block => {
        ctx.fillRect(block.x, block.y, block.width, block.height);
    });

    if (player1.isLoaded && player1.isAlive) {
        drawPlayer(player1);
    }
    if (player2.isLoaded && player2.isAlive) {
        drawPlayer(player2);
    }

    drawLives();
    drawBigMacs();
    drawSyringes();

    ctx.fillStyle = 'red';
    player1.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bulletSize, bulletSize);
    });

    ctx.fillStyle = 'blue';
    player2.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bulletSize, bulletSize);
    });
}

function endGame(winner) {
    alert(`${winner === player1 ? 'Player 1' : 'Player 2'} wins!`);
    resetGame();
}

function resetGame() {
    player1.health = maxHealth;
    player1.lives = maxLives;
    player1.isAlive = true;
    player1.blocks = [];
    player1.bullets = [];
    player1.speed = player1.originalSpeed;
    player1.jump = player1.originalJump;
    player1.img.src = player1.originalImage;
    player1.effectActive = false;
    player1.syringeEffectActive = false;

    player2.health = maxHealth;
    player2.lives = maxLives;
    player2.isAlive = true;
    player2.blocks = [];
    player2.bullets = [];
    player2.speed = player2.originalSpeed;
    player2.jump = player2.originalJump;
    player2.img.src = player2.originalImage;
    player2.effectActive = false;
    player2.syringeEffectActive = false;

    bigMacs = [];
    syringes = [];
    spawnBigMac(); // Spawn a Big Mac at the start
    spawnSyringe(); // Spawn a Syringe at the start
}

function gameLoop() {
    update();
    draw();
    if (player1.isAlive && player2.isAlive) {
        requestAnimationFrame(gameLoop);
    }
}

// Start the game loop
gameLoop();

// Spawn a Big Mac every 60 seconds
setInterval(spawnBigMac, 60000);

// Spawn a Syringe every 60 seconds
setInterval(spawnSyringe, 60000);

// Spawn the initial Big Mac and Syringe at the start
spawnBigMac();
spawnSyringe();
