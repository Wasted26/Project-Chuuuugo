// Estado del juego
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    lives: 3,
    time: 0,
    currentLevel: 1,
    monstersActive: [],
    gameTimer: null,
    spawnTimer: null,
    timeTimer: null
};

// Configuración del juego
const gameConfig = {
    initialSpawnRate: 2000, // milisegundos
    spawnRateDecrease: 100, // disminución por nivel
    minSpawnRate: 500, // velocidad mínima
    monsterLifetime: 3000, // tiempo que vive un monstruo
    pointsPerMonster: 10,
    maxMonsters: 5,
    levelUpScore: 100 // puntos para subir de nivel
};

// Emojis de monstruos
const monsterEmojis = ['👹', '👺', '👻', '👽', '🤡', '🧟', '🧛', '🦹', '🐲', '🦖', '🕷️', '🦂'];

// Elementos del DOM
const elements = {
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    restartBtn: document.getElementById('restartBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    gameArea: document.getElementById('gameArea'),
    gameMessage: document.getElementById('gameMessage'),
    gameOverModal: document.getElementById('gameOverModal'),
    scoreDisplay: document.getElementById('score'),
    livesDisplay: document.getElementById('lives'),
    timeDisplay: document.getElementById('time'),
    finalScore: document.getElementById('finalScore'),
    finalTime: document.getElementById('finalTime')
};

// Event listeners
elements.startBtn.addEventListener('click', startGame);
elements.pauseBtn.addEventListener('click', togglePause);
elements.restartBtn.addEventListener('click', restartGame);
elements.playAgainBtn.addEventListener('click', playAgain);

// Función para inicializar el estado del juego
function initializeGame() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.time = 0;
    gameState.currentLevel = 1;
    gameState.monstersActive = [];
    
    clearAllTimers();
    clearMonsters();
    updateDisplay();
    showMessage('¡Haz clic en "Iniciar Juego" para comenzar!');
}

// Función para iniciar el juego
function startGame() {
    if (gameState.isPlaying) return;
    
    gameState.isPlaying = true;
    gameState.isPaused = false;
    
    // Mostrar/ocultar botones
    elements.startBtn.style.display = 'none';
    elements.pauseBtn.style.display = 'inline-block';
    elements.restartBtn.style.display = 'inline-block';
    
    // Limpiar mensaje
    hideMessage();
    
    // Iniciar timers
    startGameTimers();
    
    console.log('¡Juego iniciado!');
}

// Función para pausar/reanudar el juego
function togglePause() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        clearAllTimers();
        elements.pauseBtn.textContent = '▶️ Reanudar';
        showMessage('⏸️ Juego Pausado');
        // Pausar animaciones de monstruos
        pauseMonsters();
    } else {
        hideMessage();
        elements.pauseBtn.textContent = '⏸️ Pausar';
        startGameTimers();
        // Reanudar animaciones de monstruos
        resumeMonsters();
    }
}

// Función para reiniciar el juego
function restartGame() {
    initializeGame();
    
    // Resetear botones
    elements.startBtn.style.display = 'inline-block';
    elements.pauseBtn.style.display = 'none';
    elements.restartBtn.style.display = 'none';
    elements.pauseBtn.textContent = '⏸️ Pausar';
}

// Función para jugar de nuevo después del game over
function playAgain() {
    elements.gameOverModal.style.display = 'none';
    initializeGame();
    
    // Resetear botones
    elements.startBtn.style.display = 'inline-block';
    elements.pauseBtn.style.display = 'none';
    elements.restartBtn.style.display = 'none';
    elements.pauseBtn.textContent = '⏸️ Pausar';
}

// Función para iniciar los timers del juego
function startGameTimers() {
    // Timer para el tiempo de juego
    gameState.timeTimer = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.time++;
            updateDisplay();
        }
    }, 1000);
    
    // Timer para generar monstruos
    scheduleNextMonster();
}

// Función para programar el siguiente monstruo
function scheduleNextMonster() {
    if (gameState.spawnTimer) {
        clearTimeout(gameState.spawnTimer);
    }
    
    const spawnRate = Math.max(
        gameConfig.minSpawnRate,
        gameConfig.initialSpawnRate - (gameState.currentLevel - 1) * gameConfig.spawnRateDecrease
    );
    
    gameState.spawnTimer = setTimeout(() => {
        if (gameState.isPlaying && !gameState.isPaused) {
            spawnMonster();
            scheduleNextMonster();
        }
    }, spawnRate);
}

// Función para generar un monstruo
function spawnMonster() {
    if (gameState.monstersActive.length >= gameConfig.maxMonsters) {
        return;
    }
    
    const monster = createMonster();
    gameState.monstersActive.push(monster);
    elements.gameArea.appendChild(monster.element);
    
    // Programar la desaparición del monstruo
    monster.timeoutId = setTimeout(() => {
        if (monster.element.parentNode) {
            monsterEscaped(monster);
        }
    }, gameConfig.monsterLifetime);
}

// Función para crear un monstruo
function createMonster() {
    const monsterElement = document.createElement('div');
    monsterElement.className = 'monster';
    
    // Emoji aleatorio
    const emoji = monsterEmojis[Math.floor(Math.random() * monsterEmojis.length)];
    monsterElement.textContent = emoji;
    
    // Posición aleatoria
    const gameAreaRect = elements.gameArea.getBoundingClientRect();
    const maxX = gameAreaRect.width - 80; // Ancho del monstruo
    const maxY = gameAreaRect.height - 80; // Alto del monstruo
    
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    
    monsterElement.style.left = x + 'px';
    monsterElement.style.top = y + 'px';
    
    // Crear objeto monstruo
    const monster = {
        element: monsterElement,
        id: Date.now() + Math.random(),
        timeoutId: null
    };
    
    // Event listener para hacer clic
    monsterElement.addEventListener('click', () => monsterClicked(monster));
    
    return monster;
}

// Función cuando se hace clic en un monstruo
function monsterClicked(monster) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // Agregar puntos
    gameState.score += gameConfig.pointsPerMonster;
    
    // Verificar subida de nivel
    checkLevelUp();
    
    // Mostrar efecto de puntos
    showScoreEffect(monster.element, '+' + gameConfig.pointsPerMonster);
    
    // Animación de clic
    monster.element.classList.add('clicked');
    
    // Remover monstruo después de la animación
    setTimeout(() => {
        removeMonster(monster);
    }, 300);
    
    // Actualizar display
    updateDisplay();
    
    console.log(`¡Monstruo capturado! Puntos: ${gameState.score}`);
}

// Función cuando un monstruo escapa
function monsterEscaped(monster) {
    if (!gameState.isPlaying) return;
    
    // Perder vida
    gameState.lives--;
    
    // Animación de desaparición
    monster.element.classList.add('disappearing');
    
    // Remover monstruo después de la animación
    setTimeout(() => {
        removeMonster(monster);
    }, 300);
    
    // Actualizar display
    updateDisplay();
    
    // Verificar game over
    if (gameState.lives <= 0) {
        gameOver();
    }
    
    console.log(`Monstruo escapó. Vidas restantes: ${gameState.lives}`);
}

// Función para remover un monstruo
function removeMonster(monster) {
    // Limpiar timeout
    if (monster.timeoutId) {
        clearTimeout(monster.timeoutId);
    }
    
    // Remover del DOM
    if (monster.element.parentNode) {
        monster.element.parentNode.removeChild(monster.element);
    }
    
    // Remover del array
    const index = gameState.monstersActive.findIndex(m => m.id === monster.id);
    if (index > -1) {
        gameState.monstersActive.splice(index, 1);
    }
}

// Función para verificar subida de nivel
function checkLevelUp() {
    const newLevel = Math.floor(gameState.score / gameConfig.levelUpScore) + 1;
    if (newLevel > gameState.currentLevel) {
        gameState.currentLevel = newLevel;
        showMessage(`🎉 ¡Nivel ${gameState.currentLevel}! 🎉`, 2000);
        console.log(`¡Subiste al nivel ${gameState.currentLevel}!`);
    }
}

// Función para mostrar efecto de puntuación
function showScoreEffect(monsterElement, text) {
    const scorePopup = document.createElement('div');
    scorePopup.className = 'score-popup';
    scorePopup.textContent = text;
    
    // Posicionar sobre el monstruo
    const rect = monsterElement.getBoundingClientRect();
    const gameAreaRect = elements.gameArea.getBoundingClientRect();
    
    scorePopup.style.left = (rect.left - gameAreaRect.left) + 'px';
    scorePopup.style.top = (rect.top - gameAreaRect.top) + 'px';
    
    elements.gameArea.appendChild(scorePopup);
    
    // Remover después de la animación
    setTimeout(() => {
        if (scorePopup.parentNode) {
            scorePopup.parentNode.removeChild(scorePopup);
        }
    }, 1000);
}

// Función para mostrar mensaje en el área de juego
function showMessage(text, duration = null) {
    elements.gameMessage.textContent = text;
    elements.gameMessage.style.display = 'block';
    
    if (duration) {
        setTimeout(() => {
            hideMessage();
        }, duration);
    }
}

// Función para ocultar mensaje
function hideMessage() {
    elements.gameMessage.style.display = 'none';
}

// Función para pausar monstruos
function pauseMonsters() {
    gameState.monstersActive.forEach(monster => {
        monster.element.style.animationPlayState = 'paused';
    });
}

// Función para reanudar monstruos
function resumeMonsters() {
    gameState.monstersActive.forEach(monster => {
        monster.element.style.animationPlayState = 'running';
    });
}

// Función para limpiar todos los monstruos
function clearMonsters() {
    gameState.monstersActive.forEach(monster => {
        removeMonster(monster);
    });
    gameState.monstersActive = [];
}

// Función para limpiar todos los timers
function clearAllTimers() {
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
        gameState.gameTimer = null;
    }
    if (gameState.spawnTimer) {
        clearTimeout(gameState.spawnTimer);
        gameState.spawnTimer = null;
    }
    if (gameState.timeTimer) {
        clearInterval(gameState.timeTimer);
        gameState.timeTimer = null;
    }
}

// Función para actualizar la pantalla
function updateDisplay() {
    elements.scoreDisplay.textContent = gameState.score;
    elements.livesDisplay.textContent = gameState.lives;
    elements.timeDisplay.textContent = gameState.time;
}

// Función de game over
function gameOver() {
    gameState.isPlaying = false;
    
    // Limpiar timers y monstruos
    clearAllTimers();
    clearMonsters();
    
    // Mostrar modal de game over
    elements.finalScore.textContent = `Puntuación Final: ${gameState.score}`;
    elements.finalTime.textContent = `Tiempo Total: ${gameState.time}s`;
    elements.gameOverModal.style.display = 'flex';
    
    // Ocultar botones de control
    elements.pauseBtn.style.display = 'none';
    elements.restartBtn.style.display = 'none';
    elements.startBtn.style.display = 'none';
    
    console.log(`Game Over! Puntuación final: ${gameState.score}, Tiempo: ${gameState.time}s`);
}

// Función para formatear tiempo
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Inicializar el juego al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    console.log('Juego "Aplasta al Monstruo" inicializado');
});

// Prevenir clic derecho en monstruos para evitar trucos
document.addEventListener('contextmenu', (e) => {
    if (e.target.classList.contains('monster')) {
        e.preventDefault();
    }
});

// Prevenir selección de texto durante el juego
document.addEventListener('selectstart', (e) => {
    if (gameState.isPlaying && e.target.classList.contains('monster')) {
        e.preventDefault();
    }
});
