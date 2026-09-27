document.addEventListener("DOMContentLoaded", () => {
    // Canvas es la superficie de dibujo; ctx contiene las herramientas 2D.
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    if (!canvas || !ctx) {
        console.error("No se pudo inicializar el canvas del juego.");
        return;
    }

    const scoreValue = document.getElementById("scoreValue");
    const highScoreValue = document.getElementById("highScoreValue");
    const livesValue = document.getElementById("livesValue");
    const coinsValue = document.getElementById("coinsValue");
    const speedUpgradeButton = document.getElementById("speedUpgradeButton");
    const shopMessage = document.getElementById("shopMessage");
    const powerUpStatus = document.getElementById("powerUpStatus");
    const objectiveStatus = document.getElementById("objectiveStatus");
    const pauseButton = document.getElementById("pauseButton");
    const resetScoreButton = document.getElementById("resetScoreButton");
    const menuButton = document.getElementById("menuButton");
    const gameOverOverlay = document.getElementById("gameOverOverlay");
    const retryButton = document.getElementById("retryButton");
    const overlayTitle = gameOverOverlay.querySelector("h2");
    const touchButtons = document.querySelectorAll("[data-control]");
    const mainMenu = document.getElementById("mainMenu");
    const mapOverlay = document.getElementById("mapOverlay");
    const playButton = document.getElementById("playButton");
    const mapButton = document.getElementById("mapButton");
    const closeMapButton = document.getElementById("closeMapButton");
    const mapList = document.getElementById("mapList");
    const levelList = document.getElementById("levelList");
    const mapTitle = document.getElementById("mapTitle");
    const backToMapsButton = document.getElementById("backToMapsButton");
    const menuProgress = document.getElementById("menuProgress");

    const STORAGE_KEY = "miJuego2DHighScore";
    const COINS_STORAGE_KEY = "miJuego2DCoins";
    const SPEED_UPGRADE_STORAGE_KEY = "miJuego2DSpeedUpgrade";
    const SPEED_UPGRADE_COST = 30;
    const MAX_SPEED_UPGRADE_LEVEL = 5;
    const MAX_DELTA_TIME = 0.05;

    // Estado global mínimo: reglas del mundo, progreso y estado de la partida.
    const game = {
        width: canvas.width,
        height: canvas.height,
        worldWidth: 2200,
        lastTime: 0,
        gravity: 1600,
        groundY: canvas.height - 70,
        elapsedTime: 0,
        score: 0,
        highScore: 0,
        lives: 3,
        invulnerable: 0,
        state: "menu",
        distance: 0,
        coinScore: 0,
        currentLevel: 0,
        coins: 0,
        speedUpgradeLevel: 0,
        respawnTimer: 0
    };

    // Datos originales del nivel. Se clonan al reiniciar para no mutar la plantilla.
    const initialPlatforms = [
        { x: 220, y: 390, width: 180, height: 18 },
        { x: 500, y: 330, width: 180, height: 18 },
        { x: 740, y: 270, width: 180, height: 18 },
        { x: 1080, y: 380, width: 220, height: 18 },
        { x: 1450, y: 310, width: 200, height: 18 },
        { x: 1750, y: 260, width: 220, height: 18 }
    ];

    const initialObstacles = [
        { x: 430, y: game.groundY - 34, width: 44, height: 34, color: "#7f1d1d" },
        { x: 910, y: game.groundY - 52, width: 64, height: 52, color: "#991b1b" },
        { x: 1320, y: game.groundY - 40, width: 50, height: 40, color: "#7f1d1d" },
        { x: 1680, y: game.groundY - 46, width: 58, height: 46, color: "#991b1b" },
        { x: 2200, y: game.groundY - 42, width: 52, height: 42, color: "#7f1d1d" },
        { x: 2380, y: game.groundY - 50, width: 60, height: 50, color: "#991b1b" }
    ];

    const initialEnemies = [
        { x: 620, y: game.groundY - 34, width: 42, height: 34, minX: 540, maxX: 760, speed: 85, baseSpeed: 85, direction: 1, color: "#7c2d12" },
        { x: 1180, y: game.groundY - 34, width: 42, height: 34, minX: 1090, maxX: 1380, speed: 90, baseSpeed: 90, direction: -1, color: "#9a5b14" },
        { x: 1560, y: game.groundY - 34, width: 42, height: 34, minX: 1480, maxX: 1800, speed: 95, baseSpeed: 95, direction: 1, color: "#7c2d12" }
    ];

    const initialCoins = [
        { x: 260, y: 340, width: 18, height: 18, collected: false },
        { x: 520, y: 280, width: 18, height: 18, collected: false },
        { x: 760, y: 220, width: 18, height: 18, collected: false },
        { x: 1110, y: 330, width: 18, height: 18, collected: false },
        { x: 1490, y: 260, width: 18, height: 18, collected: false },
        { x: 1780, y: 210, width: 18, height: 18, collected: false },
        { x: 1980, y: 330, width: 18, height: 18, collected: false },
        { x: 2080, y: 280, width: 18, height: 18, collected: false },
        { x: 2280, y: 330, width: 18, height: 18, collected: false },
        { x: 2420, y: 290, width: 18, height: 18, collected: false }
    ];

    const initialPowerUps = [
        { x: 610, y: 287, width: 18, height: 18, type: "speed", collected: false },
        { x: 1240, y: 345, width: 18, height: 18, type: "jump", collected: false },
        { x: 1820, y: 225, width: 18, height: 18, type: "shield", collected: false }
    ];

    const initialCheckpoints = [
        { x: 650, y: game.groundY - 52, width: 26, height: 52, reached: false },
        { x: 1750, y: game.groundY - 52, width: 26, height: 52, reached: false }
    ];

    const levelDefinitions = [
        {
            id: "bosque",
            mapId: "bosque",
            name: "Bosque",
            worldWidth: 2700,
            backgroundTop: "#0f766e",
            backgroundMid: "#67e8f9",
            backgroundBottom: "#d9f99d",
            platforms: initialPlatforms,
            obstacles: initialObstacles,
            enemies: initialEnemies,
            coins: initialCoins,
            powerUps: initialPowerUps,
            checkpoints: initialCheckpoints,
            enemySpeedMultiplier: 1,
            objective: { type: "collect-coins", target: 4 },
            spawnX: 120,
            goalX: 2550,
            door: { x: 2550, y: game.groundY - 92, width: 54, height: 92 }
        },
        {
            id: "bosque-2",
            mapId: "bosque",
            name: "Bosque - Nivel 2",
            worldWidth: 3100,
            backgroundTop: "#14532d",
            backgroundMid: "#22c55e",
            backgroundBottom: "#bef264",
            platforms: [
                { x: 220, y: 400, width: 135, height: 18 },
                { x: 500, y: 335, width: 105, height: 18 },
                { x: 760, y: 280, width: 90, height: 18 },
                { x: 1030, y: 350, width: 120, height: 18 },
                { x: 1320, y: 290, width: 85, height: 18 },
                { x: 1600, y: 235, width: 75, height: 18 },
                { x: 1880, y: 320, width: 100, height: 18 },
                { x: 2180, y: 265, width: 85, height: 18 },
                { x: 2500, y: 215, width: 75, height: 18 },
                { x: 2780, y: 300, width: 120, height: 18 }
            ],
            obstacles: [
                { x: 410, y: game.groundY - 40, width: 52, height: 40, color: "#166534" },
                { x: 690, y: game.groundY - 48, width: 62, height: 48, color: "#14532d" },
                { x: 950, y: game.groundY - 35, width: 48, height: 35, color: "#166534" },
                { x: 1240, y: game.groundY - 52, width: 66, height: 52, color: "#14532d" },
                { x: 1510, y: game.groundY - 42, width: 54, height: 42, color: "#166534" },
                { x: 1800, y: game.groundY - 55, width: 70, height: 55, color: "#14532d" },
                { x: 2100, y: game.groundY - 40, width: 50, height: 40, color: "#166534" },
                { x: 2420, y: game.groundY - 52, width: 64, height: 52, color: "#14532d" },
                { x: 2700, y: game.groundY - 44, width: 56, height: 44, color: "#166534" }
            ],
            enemies: [
                { x: 560, y: game.groundY - 34, width: 42, height: 34, minX: 500, maxX: 720, speed: 105, baseSpeed: 105, direction: 1, color: "#064e3b" },
                { x: 1120, y: game.groundY - 34, width: 42, height: 34, minX: 1000, maxX: 1320, speed: 115, baseSpeed: 115, direction: -1, color: "#065f46" },
                { x: 1700, y: game.groundY - 34, width: 42, height: 34, minX: 1560, maxX: 1940, speed: 120, baseSpeed: 120, direction: 1, color: "#064e3b" },
                { x: 2380, y: game.groundY - 34, width: 42, height: 34, minX: 2240, maxX: 2600, speed: 125, baseSpeed: 125, direction: -1, color: "#065f46" }
            ],
            coins: [
                { x: 270, y: 340, width: 18, height: 18, collected: false },
                { x: 540, y: 275, width: 18, height: 18, collected: false },
                { x: 800, y: 220, width: 18, height: 18, collected: false },
                { x: 1070, y: 290, width: 18, height: 18, collected: false },
                { x: 1360, y: 230, width: 18, height: 18, collected: false },
                { x: 1640, y: 175, width: 18, height: 18, collected: false },
                { x: 1920, y: 260, width: 18, height: 18, collected: false },
                { x: 2220, y: 205, width: 18, height: 18, collected: false },
                { x: 2540, y: 155, width: 18, height: 18, collected: false },
                { x: 2820, y: 240, width: 18, height: 18, collected: false }
            ],
            powerUps: [
                { x: 780, y: 220, width: 18, height: 18, type: "speed", collected: false },
                { x: 1620, y: 175, width: 18, height: 18, type: "jump", collected: false },
                { x: 2220, y: 205, width: 18, height: 18, type: "shield", collected: false }
            ],
            checkpoints: [
                { x: 900, y: game.groundY - 52, width: 26, height: 52, reached: false },
                { x: 2100, y: game.groundY - 52, width: 26, height: 52, reached: false }
            ],
            enemySpeedMultiplier: 1.35,
            objective: { type: "collect-coins", target: 6 },
            spawnX: 120,
            goalX: 2950,
            door: { x: 2950, y: game.groundY - 92, width: 54, height: 92 }
        },
        {
            id: "desierto",
            mapId: "desierto",
            name: "Desierto",
            worldWidth: 3000,
            backgroundTop: "#f59e0b",
            backgroundMid: "#fbbf24",
            backgroundBottom: "#fef3c7",
            platforms: [
                { x: 220, y: 410, width: 150, height: 18 },
                { x: 580, y: 350, width: 145, height: 18 },
                { x: 850, y: 300, width: 105, height: 18 },
                { x: 1120, y: 265, width: 90, height: 18 },
                { x: 1300, y: 360, width: 160, height: 18 },
                { x: 1580, y: 315, width: 95, height: 18 },
                { x: 1770, y: 270, width: 90, height: 18 },
                { x: 1950, y: 250, width: 160, height: 18 }
            ],
            obstacles: [
                { x: 480, y: game.groundY - 36, width: 50, height: 36, color: "#b45309" },
                { x: 800, y: game.groundY - 30, width: 42, height: 30, color: "#d97706" },
                { x: 1080, y: game.groundY - 50, width: 64, height: 50, color: "#d97706" },
                { x: 1240, y: game.groundY - 32, width: 44, height: 32, color: "#b45309" },
                { x: 1490, y: game.groundY - 42, width: 54, height: 42, color: "#b45309" },
                { x: 1850, y: game.groundY - 46, width: 58, height: 46, color: "#d97706" },
                { x: 2130, y: game.groundY - 38, width: 52, height: 38, color: "#b45309" },
                { x: 2420, y: game.groundY - 44, width: 58, height: 44, color: "#d97706" },
                { x: 2700, y: game.groundY - 50, width: 62, height: 50, color: "#b45309" }
            ],
            enemies: [
                { x: 640, y: game.groundY - 34, width: 42, height: 34, minX: 560, maxX: 820, speed: 95, baseSpeed: 95, direction: 1, color: "#78350f" },
                { x: 1200, y: game.groundY - 34, width: 42, height: 34, minX: 1100, maxX: 1460, speed: 100, baseSpeed: 100, direction: -1, color: "#a16207" },
                { x: 1720, y: game.groundY - 34, width: 42, height: 34, minX: 1620, maxX: 1940, speed: 110, baseSpeed: 110, direction: 1, color: "#78350f" }
            ],
            coins: [
                { x: 250, y: 350, width: 18, height: 18, collected: false },
                { x: 640, y: 300, width: 18, height: 18, collected: false },
                { x: 940, y: 240, width: 18, height: 18, collected: false },
                { x: 1340, y: 310, width: 18, height: 18, collected: false },
                { x: 1690, y: 250, width: 18, height: 18, collected: false },
                { x: 1980, y: 200, width: 18, height: 18, collected: false },
                { x: 2140, y: 320, width: 18, height: 18, collected: false },
                { x: 2440, y: 320, width: 18, height: 18, collected: false },
                { x: 2680, y: 280, width: 18, height: 18, collected: false }
            ],
            powerUps: [
                { x: 860, y: 245, width: 18, height: 18, type: "speed", collected: false },
                { x: 1540, y: 250, width: 18, height: 18, type: "jump", collected: false },
                { x: 2100, y: 200, width: 18, height: 18, type: "shield", collected: false }
            ],
            checkpoints: [
                { x: 700, y: game.groundY - 52, width: 26, height: 52, reached: false },
                { x: 1900, y: game.groundY - 52, width: 26, height: 52, reached: false }
            ],
            enemySpeedMultiplier: 1.45,
            objective: { type: "survive-lives", target: 2 },
            spawnX: 120,
            goalX: 2850,
            door: { x: 2850, y: game.groundY - 92, width: 54, height: 92 }
        },
        {
            id: "noche",
            mapId: "noche",
            name: "La Noche",
            worldWidth: 3200,
            backgroundTop: "#020617",
            backgroundMid: "#0f172a",
            backgroundBottom: "#1e3a8a",
            theme: "night",
            platforms: [
                { x: 260, y: 390, width: 135, height: 18 },
                { x: 560, y: 330, width: 110, height: 18 },
                { x: 820, y: 270, width: 90, height: 18 },
                { x: 1080, y: 350, width: 120, height: 18 },
                { x: 1390, y: 290, width: 90, height: 18 },
                { x: 1700, y: 240, width: 80, height: 18 },
                { x: 2020, y: 320, width: 105, height: 18 },
                { x: 2350, y: 260, width: 85, height: 18 },
                { x: 2650, y: 210, width: 120, height: 18 }
            ],
            obstacles: [
                { x: 450, y: game.groundY - 42, width: 52, height: 42, color: "#172554" },
                { x: 730, y: game.groundY - 52, width: 64, height: 52, color: "#1e1b4b" },
                { x: 1260, y: game.groundY - 44, width: 58, height: 44, color: "#172554" },
                { x: 1580, y: game.groundY - 50, width: 60, height: 50, color: "#1e1b4b" },
                { x: 2160, y: game.groundY - 46, width: 58, height: 46, color: "#172554" },
                { x: 2500, y: game.groundY - 54, width: 68, height: 54, color: "#1e1b4b" },
                { x: 2890, y: game.groundY - 48, width: 60, height: 48, color: "#172554" }
            ],
            enemies: [
                { x: 620, y: game.groundY - 34, width: 42, height: 34, minX: 540, maxX: 760, speed: 115, baseSpeed: 115, direction: 1, color: "#312e81" },
                { x: 1160, y: game.groundY - 34, width: 42, height: 34, minX: 1080, maxX: 1380, speed: 120, baseSpeed: 120, direction: -1, color: "#3730a3" },
                { x: 1800, y: game.groundY - 34, width: 42, height: 34, minX: 1660, maxX: 2040, speed: 125, baseSpeed: 125, direction: 1, color: "#312e81" },
                { x: 2440, y: game.groundY - 34, width: 42, height: 34, minX: 2320, maxX: 2700, speed: 130, baseSpeed: 130, direction: -1, color: "#3730a3" }
            ],
            coins: [
                { x: 300, y: 330, width: 18, height: 18, collected: false },
                { x: 600, y: 270, width: 18, height: 18, collected: false },
                { x: 860, y: 210, width: 18, height: 18, collected: false },
                { x: 1120, y: 290, width: 18, height: 18, collected: false },
                { x: 1430, y: 230, width: 18, height: 18, collected: false },
                { x: 1740, y: 180, width: 18, height: 18, collected: false },
                { x: 2060, y: 260, width: 18, height: 18, collected: false },
                { x: 2390, y: 200, width: 18, height: 18, collected: false },
                { x: 2690, y: 150, width: 18, height: 18, collected: false }
            ],
            powerUps: [
                { x: 840, y: 210, width: 18, height: 18, type: "shield", collected: false },
                { x: 1420, y: 230, width: 18, height: 18, type: "jump", collected: false },
                { x: 2380, y: 200, width: 18, height: 18, type: "speed", collected: false }
            ],
            checkpoints: [
                { x: 950, y: game.groundY - 52, width: 26, height: 52, reached: false },
                { x: 2200, y: game.groundY - 52, width: 26, height: 52, reached: false }
            ],
            enemySpeedMultiplier: 1.6,
            objective: { type: "collect-coins", target: 6 },
            spawnX: 120,
            goalX: 3050,
            door: { x: 3050, y: game.groundY - 92, width: 54, height: 92 }
        }
    ];

    // El contexto de audio se crea solo después de una interacción del usuario.
    let audioCtx = null;
    let musicTimer = null;
    let musicStep = 0;

    function ensureAudio() {
        // Los navegadores suelen bloquear audio hasta que existe una interacción.
        if (!audioCtx) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtor) return null;
            audioCtx = new AudioCtor();
        }

        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }

        return audioCtx;
    }

    function playTone({ frequency = 220, duration = 0.08, type = "square", volume = 0.04, slideTo = null }) {
        // Genera un tono corto con un oscilador, sin cargar archivos externos.
        const ctxAudio = ensureAudio();
        if (!ctxAudio) return;

        const oscillator = ctxAudio.createOscillator();
        const gainNode = ctxAudio.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctxAudio.currentTime);

        if (slideTo !== null) {
            oscillator.frequency.exponentialRampToValueAtTime(slideTo, ctxAudio.currentTime + duration);
        }

        gainNode.gain.setValueAtTime(0.0001, ctxAudio.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(volume, ctxAudio.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctxAudio.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctxAudio.destination);

        oscillator.start();
        oscillator.stop(ctxAudio.currentTime + duration);
    }

    function playDamageSound() {
        playTone({ frequency: 220, duration: 0.12, type: "sawtooth", volume: 0.05, slideTo: 80 });
        playTone({ frequency: 120, duration: 0.18, type: "triangle", volume: 0.04, slideTo: 50 });
    }

    function playJumpSound() {
        // Dos tonos ascendentes hacen reconocible el inicio de un salto.
        playTone({ frequency: 320, duration: 0.07, type: "square", volume: 0.035, slideTo: 520 });
        playTone({ frequency: 520, duration: 0.09, type: "triangle", volume: 0.025, slideTo: 700 });
    }

    function playLandingSound() {
        // Un tono corto y descendente representa el contacto con una superficie.
        playTone({ frequency: 150, duration: 0.08, type: "triangle", volume: 0.035, slideTo: 90 });
    }

    function playGameOverSound() {
        // Tres notas descendentes marcan el final de la partida.
        playTone({ frequency: 260, duration: 0.12, type: "sawtooth", volume: 0.035, slideTo: 190 });
        playTone({ frequency: 190, duration: 0.14, type: "sawtooth", volume: 0.035, slideTo: 120 });
        playTone({ frequency: 120, duration: 0.2, type: "triangle", volume: 0.04, slideTo: 70 });
    }

    function playCoinSound() {
        // El sonido de moneda es corto y alegre, para reforzar la recompensa.
        playTone({ frequency: 980, duration: 0.08, type: "square", volume: 0.03, slideTo: 1200 });
        playTone({ frequency: 1420, duration: 0.1, type: "triangle", volume: 0.02, slideTo: 1600 });
    }

    function playPowerUpSound() {
        // Los power-ups se distinguen con dos tonos ascendentes y luminosos.
        playTone({ frequency: 660, duration: 0.09, type: "triangle", volume: 0.03, slideTo: 820 });
        playTone({ frequency: 980, duration: 0.12, type: "square", volume: 0.025, slideTo: 1180 });
    }

    function playMusicNote() {
        // Melodía corta y original: se repite mientras la partida está activa.
        const melody = [262, 330, 392, 330, 294, 349, 440, 349];
        const frequency = melody[musicStep % melody.length];
        musicStep += 1;
        playTone({ frequency, duration: 0.16, type: "triangle", volume: 0.012 });
    }

    function startMusic() {
        // Evita duplicar intervalos si el usuario pulsa iniciar varias veces.
        if (musicTimer !== null || !ensureAudio()) return;

        musicStep = 0;
        playMusicNote();
        musicTimer = window.setInterval(playMusicNote, 240);
    }

    function stopMusic() {
        // Libera el temporizador cuando la partida deja de estar activa.
        if (musicTimer === null) return;

        window.clearInterval(musicTimer);
        musicTimer = null;
    }

    function getHighScore() {
        // Recupera el récord persistido y evita usar valores inválidos.
        let saved;

        try {
            saved = localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn("No se pudo leer el récord guardado.", error);
            return 0;
        }

        if (saved === null) return 0;

        const parsed = Number(saved);

        if (Number.isNaN(parsed)) return 0;

        return parsed;
    }

    function getStoredNumber(storageKey) {
        // Lee una mejora o moneda persistente sin romper el juego si storage falla.
        try {
            const saved = localStorage.getItem(storageKey);
            const parsed = Number(saved);
            return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
        } catch (error) {
            console.warn("No se pudo leer el progreso guardado.", error);
            return 0;
        }
    }

    function saveProgress() {
        try {
            localStorage.setItem(COINS_STORAGE_KEY, String(game.coins));
            localStorage.setItem(SPEED_UPGRADE_STORAGE_KEY, String(game.speedUpgradeLevel));
        } catch (error) {
            console.warn("No se pudo guardar el progreso.", error);
        }
    }

    game.highScore = getHighScore();
    game.coins = getStoredNumber(COINS_STORAGE_KEY);
    game.speedUpgradeLevel = getStoredNumber(SPEED_UPGRADE_STORAGE_KEY);

    function updateHud() {
        // Sincroniza el estado del juego con los valores visibles del HUD.
        if (scoreValue) scoreValue.textContent = String(game.score);
        if (highScoreValue) highScoreValue.textContent = String(game.highScore);
        if (livesValue) livesValue.textContent = String(game.lives);
        if (coinsValue) coinsValue.textContent = String(game.coins);
        if (shopMessage) shopMessage.textContent = `Mejora de velocidad: nivel ${game.speedUpgradeLevel}`;
        if (powerUpStatus) {
            const activeEffects = [];

            if (player.speedBoostTimer > 0) {
                activeEffects.push(`Velocidad ${player.speedBoostTimer.toFixed(1)} s`);
            }

            if (player.jumpBoostTimer > 0) {
                activeEffects.push(`Salto ${player.jumpBoostTimer.toFixed(1)} s`);
            }

            if (game.invulnerable > 0) {
                activeEffects.push(`Escudo ${game.invulnerable.toFixed(1)} s`);
            }

            powerUpStatus.textContent = activeEffects.length > 0
                ? activeEffects.join("  |  ")
                : "Sin power-up activo";
        }
        if (speedUpgradeButton) {
            const upgradeMaxed = game.speedUpgradeLevel >= MAX_SPEED_UPGRADE_LEVEL;
            speedUpgradeButton.disabled = upgradeMaxed || game.coins < SPEED_UPGRADE_COST;
            speedUpgradeButton.textContent = upgradeMaxed
                ? "Velocidad al máximo"
                : game.coins >= SPEED_UPGRADE_COST
                    ? `Comprar velocidad · ${SPEED_UPGRADE_COST}`
                    : `Faltan ${SPEED_UPGRADE_COST - game.coins} monedas`;
        }

        if (objectiveStatus) {
            const level = levelDefinitions[game.currentLevel] || levelDefinitions[0];
            const objective = level.objective;

            if (objective.type === "collect-coins") {
                const collectedCoins = coins.filter(coin => coin.collected).length;
                objectiveStatus.textContent = `Objetivo: recoge ${objective.target} monedas (${Math.min(collectedCoins, objective.target)}/${objective.target})`;
            } else if (objective.type === "survive-lives") {
                objectiveStatus.textContent = `Objetivo: llega con ${objective.target} vidas o más (${game.lives}/${objective.target})`;
            }
        }
    }

    // La cámara transforma coordenadas del mundo en coordenadas visibles.
    const camera = { x: 0 };

    const keys = {
        left: false,
        right: false,
        jump: false,
        jumpQueued: false
    };

    function setControlState(control, isPressed) {
        // Traduce un control táctil a las mismas banderas usadas por el teclado.
        if (control === "left") keys.left = isPressed;
        if (control === "right") keys.right = isPressed;

        if (control === "jump") {
            if (isPressed && !keys.jump) keys.jumpQueued = true;
            keys.jump = isPressed;
        }
    }

    function setupTouchControls() {
        // Pointer Events unifican dedo, mouse y lápiz en una sola API.
        for (const button of touchButtons) {
            const control = button.dataset.control;

            button.addEventListener("pointerdown", event => {
                event.preventDefault();
                button.setPointerCapture(event.pointerId);
                button.classList.add("is-pressed");
                ensureAudio();
                setControlState(control, true);
            });

            const releaseControl = event => {
                event.preventDefault();
                button.classList.remove("is-pressed");
                setControlState(control, false);
            };

            button.addEventListener("pointerup", releaseControl);
            button.addEventListener("pointercancel", releaseControl);
            button.addEventListener("lostpointercapture", releaseControl);
        }
    }

    // Entidad controlada por el jugador: física, apariencia y estado actual.
    const player = {
        x: 120,
        y: 0,
        width: 48,
        height: 58,
        vx: 0,
        vy: 0,
        acceleration: 1800,
        friction: 1800,
        maxSpeed: 300,
        baseJumpForce: 720,
        jumpForce: 720,
        speedBoostTimer: 0,
        jumpBoostTimer: 0,
        onGround: false,
        color: "#1f2937",
        accent: "#fbbf24",
        state: "idle",
        coyoteTime: 0,
        jumpBuffer: 0,
        lastScoreX: 120,
        facing: 1
    };

    let platforms = [];
    let obstacles = [];
    let enemies = [];
    let coins = [];
    let powerUps = [];
    let checkpoints = [];
    let lastCheckpoint = null;

    function showOverlay(titleText, buttonText) {
        // Reutiliza la misma ventana para inicio y Game Over.
        overlayTitle.textContent = titleText;
        retryButton.textContent = buttonText;
        gameOverOverlay.classList.remove("hidden");
    }

    function hideOverlay() {
        // Oculta la capa para devolver el control visual al Canvas.
        gameOverOverlay.classList.add("hidden");
    }

    function hideMenu() {
        mainMenu.classList.add("hidden");
        mapOverlay.classList.add("hidden");
    }

    function showMenu() {
        game.state = "menu";
        stopMusic();
        mainMenu.classList.remove("hidden");
        mapOverlay.classList.add("hidden");
        menuProgress.textContent = `Nivel desbloqueado: ${Math.min(game.currentLevel + 1, levelDefinitions.length)}`;
    }

    function renderMapList() {
        mapTitle.textContent = "Elegir mapa";
        mapList.textContent = "";
        levelList.textContent = "";
        mapList.classList.remove("hidden");
        levelList.classList.add("hidden");
        backToMapsButton.classList.add("hidden");

        const maps = [];

        levelDefinitions.forEach((level, index) => {
            if (maps.some(map => map.id === level.mapId)) return;

            maps.push({
                id: level.mapId,
                name: level.mapId === "bosque" ? "Bosque" : level.mapId === "desierto" ? "Desierto" : "La Noche",
                firstLevelIndex: index
            });
        });

        maps.forEach(map => {
            const mapButton = document.createElement("button");
            const isUnlocked = map.firstLevelIndex <= game.currentLevel;

            mapButton.type = "button";
            mapButton.className = "level-button";
            mapButton.disabled = !isUnlocked;
            mapButton.textContent = isUnlocked
                ? map.name
                : `${map.name} · Bloqueado`;

            if (map.id === levelDefinitions[game.currentLevel].mapId) {
                mapButton.classList.add("is-current");
            }

            mapButton.addEventListener("click", () => renderLevelList(map.id));
            mapList.appendChild(mapButton);
        });
    }

    function renderLevelList(mapId) {
        const levels = levelDefinitions
            .map((level, index) => ({ level, index }))
            .filter(entry => entry.level.mapId === mapId);
        const map = levels[0].level;

        mapTitle.textContent = `${map.name}: elegir nivel`;
        mapList.classList.add("hidden");
        levelList.classList.remove("hidden");
        backToMapsButton.classList.remove("hidden");
        levelList.textContent = "";

        levels.forEach((entry, levelNumber) => {
            const levelButton = document.createElement("button");
            const isUnlocked = entry.index <= game.currentLevel;

            levelButton.type = "button";
            levelButton.className = "level-button";
            levelButton.disabled = !isUnlocked;
            levelButton.textContent = isUnlocked
                ? `Nivel ${levelNumber + 1} · Disponible`
                : `Nivel ${levelNumber + 1} · Bloqueado`;

            if (entry.index === game.currentLevel) {
                levelButton.classList.add("is-current");
            }

            levelButton.addEventListener("click", () => {
                game.currentLevel = entry.index;
                hideMenu();
                startGame();
            });
            levelList.appendChild(levelButton);
        });

        for (let levelNumber = levels.length + 1; levelNumber <= 3; levelNumber += 1) {
            const lockedButton = document.createElement("button");
            lockedButton.type = "button";
            lockedButton.className = "level-button";
            lockedButton.disabled = true;
            lockedButton.textContent = `Nivel ${levelNumber} · Próximamente`;
            levelList.appendChild(lockedButton);
        }
    }

    function resetPlayer() {
        // Devuelve al jugador a la posición inicial y limpia su movimiento.
        player.x = 120;
        player.y = game.groundY - player.height;
        player.vx = 0;
        player.vy = 0;
        player.onGround = true;
        player.state = "idle";
        player.coyoteTime = 0.12;
        player.jumpBuffer = 0;
        player.lastScoreX = player.x;
    }

    function resetLevel() {
        // Restaura entidades y progreso sin borrar el récord guardado.
        const level = levelDefinitions[game.currentLevel] || levelDefinitions[0];

        game.worldWidth = level.worldWidth;
        platforms = (level.platforms || initialPlatforms).map(platform => ({ ...platform }));
        obstacles = (level.obstacles || initialObstacles).map(obstacle => ({ ...obstacle }));
        enemies = (level.enemies || initialEnemies).map(enemy => ({ ...enemy }));
        coins = (level.coins || initialCoins).map(coin => ({ ...coin }));
        powerUps = (level.powerUps || initialPowerUps).map(powerUp => ({ ...powerUp }));
        checkpoints = (level.checkpoints || initialCheckpoints).map(checkpoint => ({ ...checkpoint, reached: false }));

        game.lives = 3;
        game.distance = 0;
        game.score = 0;
        game.coinScore = 0;
        game.invulnerable = 0;
        game.elapsedTime = 0;
        game.respawnTimer = 0;

        player.speedBoostTimer = 0;
        player.jumpBoostTimer = 0;
        player.jumpForce = player.baseJumpForce;
        lastCheckpoint = null;

        player.x = level.spawnX;
        player.y = game.groundY - player.height;
        player.vx = 0;
        player.vy = 0;
        player.onGround = true;
        player.state = "idle";
        player.coyoteTime = 0.12;
        player.jumpBuffer = 0;
        player.lastScoreX = player.x;
        player.facing = 1;

        updateHud();
        camera.x = 0;
    }

    function startGame() {
        // Cambia al estado jugable y prepara una partida limpia.
        game.state = "playing";
        pauseButton.textContent = "Pausa";
        hideMenu();
        hideOverlay();
        resetLevel();
        startMusic();
    }

    function showGameOver() {
        // Detiene la actualización del juego y muestra la opción de reinicio.
        game.state = "gameover";
        stopMusic();
        playGameOverSound();
        showOverlay("Game Over", "Reintentar");
    }

    function togglePause() {
        if (game.state === "playing") {
            game.state = "paused";
            stopMusic();
            pauseButton.textContent = "Reanudar";
            showOverlay("Pausa", "Reanudar");
            return;
        }

        if (game.state === "paused") {
            game.state = "playing";
            pauseButton.textContent = "Pausa";
            hideOverlay();
            startMusic();
        }
    }

    function resetCurrentScore() {
        if (game.state !== "playing" && game.state !== "paused") return;

        game.score = 0;
        game.distance = 0;
        game.coinScore = 0;
        player.lastScoreX = player.x;
        updateHud();
    }

    function returnToMenu() {
        keys.left = false;
        keys.right = false;
        keys.jump = false;
        keys.jumpQueued = false;
        pauseButton.textContent = "Pausa";
        hideOverlay();
        showMenu();
    }

    function advanceLevel() {
        // Avanza al siguiente escenario o termina la partida con victoria.
        if (game.currentLevel < levelDefinitions.length - 1) {
            game.currentLevel += 1;
            startGame();
            return;
        }

        game.state = "victory";
        stopMusic();
        playPowerUpSound();
        showOverlay("Victoria", "Reiniciar");
    }

    function updateCheckpoints() {
        // Marca el punto de control solo cuando el jugador toca su bandera.
        for (const checkpoint of checkpoints) {
            if (checkpoint.reached) continue;

            const playerRect = {
                left: player.x,
                right: player.x + player.width,
                top: player.y,
                bottom: player.y + player.height
            };

            const checkpointRect = {
                left: checkpoint.x,
                right: checkpoint.x + checkpoint.width + 12,
                top: checkpoint.y,
                bottom: checkpoint.y + checkpoint.height
            };

            if (rectsOverlap(playerRect, checkpointRect)) {
                checkpoint.reached = true;
                lastCheckpoint = checkpoint;
                playPowerUpSound();
            }
        }
    }

    function respawnAtCheckpoint() {
        // Devuelve al jugador al último punto de control conocido.
        if (lastCheckpoint) {
            player.x = lastCheckpoint.x - 10;
        } else {
            player.x = 120;
        }

        player.y = game.groundY - player.height;
        player.vx = 0;
        player.vy = 0;
        player.onGround = true;
        player.coyoteTime = 0.12;
    }

    function applyDamage() {
        // Reduce una vida y activa una breve invulnerabilidad.
        if (game.state !== "playing") return;
        if (game.invulnerable > 0) return;

        game.lives -= 1;
        game.invulnerable = 1.2;

        playDamageSound();
        updateHud();

        if (game.lives <= 0) {
            game.lives = 0;
            showGameOver();
            return;
        }

        respawnAtCheckpoint();
    game.respawnTimer = 0.35;
        player.vx = -180;
        player.vy = -240;
    }

    function restartGame() {
        // Reiniciar reutiliza exactamente la misma ruta de inicio.
        startGame();
    }

    function handleInput(deltaTime) {
        // Convierte las teclas pulsadas en aceleración y solicitudes de salto.
        if (game.state !== "playing") return;

        const permanentSpeedMultiplier = 1 + game.speedUpgradeLevel * 0.08;
        const speedMultiplier = (player.speedBoostTimer > 0 ? 1.5 : 1) * permanentSpeedMultiplier;
        const acceleration = player.acceleration * speedMultiplier;

        if (keys.left && !keys.right) {
            player.vx -= acceleration * deltaTime;
            player.facing = -1;
        } else if (keys.right && !keys.left) {
            player.vx += acceleration * deltaTime;
            player.facing = 1;
        } else {
            if (player.onGround) {
                if (Math.abs(player.vx) < 5) {
                    player.vx = 0;
                } else if (player.vx > 0) {
                    player.vx -= player.friction * deltaTime;
                } else if (player.vx < 0) {
                    player.vx += player.friction * deltaTime;
                }
            }
        }

        if (keys.jumpQueued) {
            player.jumpBuffer = 0.12;
            keys.jumpQueued = false;
        }

        if (player.jumpBuffer > 0) {
            player.jumpBuffer -= deltaTime;
        }

        if (player.coyoteTime > 0) {
            player.coyoteTime -= deltaTime;
        }

        if (player.jumpBuffer > 0 && (player.onGround || player.coyoteTime > 0)) {
            player.vy = -player.jumpForce;
            player.onGround = false;
            player.state = "jumping";
            player.jumpBuffer = 0;
            player.coyoteTime = 0;
            playJumpSound();
        }

        if (!keys.jump && player.vy < 0) {
            player.vy += 900 * deltaTime;
        }
    }

    function resolvePlatformCollisions(previousY) {
        // Solo permite aterrizar cuando el jugador estaba encima y descendía.
        let landedOnPlatform = false;

        for (const platform of platforms) {
            const intersectsX =
                player.x + player.width > platform.x &&
                player.x < platform.x + platform.width;

            const playerBottom = player.y + player.height;
            const previousBottom = previousY + player.height;

            const isFalling = player.vy >= 0;
            const wasAbovePlatform = previousBottom <= platform.y + 14;
            const isTouchingPlatformTop =
                playerBottom >= platform.y &&
                playerBottom <= platform.y + 26;

            if (intersectsX && isFalling && wasAbovePlatform && isTouchingPlatformTop) {
                player.y = platform.y - player.height;
                player.vy = 0;
                player.onGround = true;
                player.coyoteTime = 0.12;
                landedOnPlatform = true;
                break;
            }
        }

        if (!landedOnPlatform && player.y >= game.groundY - player.height) {
            player.y = game.groundY - player.height;
            player.vy = 0;
            player.onGround = true;
            player.coyoteTime = 0.12;
        }
    }

    function resolveObstacleCollisions(previousX, previousY) {
        // Resuelve contacto rectangular con obstáculos sólidos.
        for (const obstacle of obstacles) {
            const playerLeft = player.x;
            const playerRight = player.x + player.width;
            const playerTop = player.y;
            const playerBottom = player.y + player.height;

            const obstacleLeft = obstacle.x;
            const obstacleRight = obstacle.x + obstacle.width;
            const obstacleTop = obstacle.y;
            const obstacleBottom = obstacle.y + obstacle.height;

            const overlaps =
                playerRight > obstacleLeft &&
                playerLeft < obstacleRight &&
                playerBottom > obstacleTop &&
                playerTop < obstacleBottom;

            if (!overlaps) continue;

            const prevLeft = previousX;
            const prevRight = previousX + player.width;
            const prevTop = previousY;
            const prevBottom = previousY + player.height;

            const wasAbove = prevBottom <= obstacleTop + 16;
            const wasBelow = prevTop >= obstacleBottom - 16;
            const wasLeft = prevRight <= obstacleLeft + 16;
            const wasRight = prevLeft >= obstacleRight - 16;

            if (player.vy >= 0 && wasAbove) {
                player.y = obstacleTop - player.height;
                player.vy = 0;
                player.onGround = true;
                player.coyoteTime = 0.12;
            } else if (player.vy < 0 && wasBelow) {
                player.y = obstacleBottom;
                player.vy = 0;
            } else if (wasLeft) {
                player.x = obstacleLeft - player.width;
                player.vx = Math.min(player.vx, 0);
            } else if (wasRight) {
                player.x = obstacleRight;
                player.vx = Math.max(player.vx, 0);
            }
        }
    }

    function rectsOverlap(a, b) {
        // Comprueba intersección entre dos rectángulos expresados por sus bordes.
        return (
            a.left < b.right &&
            a.right > b.left &&
            a.top < b.bottom &&
            a.bottom > b.top
        );
    }

    function updateEnemies(deltaTime) {
        // Mueve cada enemigo dentro de los límites de su patrulla con un patrón más natural.
        const level = levelDefinitions[game.currentLevel] || levelDefinitions[0];
        const speedMultiplier = level.enemySpeedMultiplier || 1;

        for (const enemy of enemies) {
            const waveOffset = Math.sin(game.elapsedTime * 2 + enemy.x * 0.02) * 10;
            enemy.speed = (enemy.baseSpeed + waveOffset) * speedMultiplier;
            enemy.x += enemy.speed * enemy.direction * deltaTime;

            if (enemy.x <= enemy.minX) {
                enemy.x = enemy.minX;
                enemy.direction = 1;
            }

            if (enemy.x + enemy.width >= enemy.maxX) {
                enemy.x = enemy.maxX - enemy.width;
                enemy.direction = -1;
            }
        }
    }

    function updateCoins() {
        // Revisa si el jugador toca una moneda activa y la convierte en puntos.
        for (const coin of coins) {
            if (coin.collected) continue;

            const playerRect = {
                left: player.x,
                right: player.x + player.width,
                top: player.y,
                bottom: player.y + player.height
            };

            const coinRect = {
                left: coin.x,
                right: coin.x + coin.width,
                top: coin.y,
                bottom: coin.y + coin.height
            };

            if (rectsOverlap(playerRect, coinRect)) {
                coin.collected = true;
                game.coins += 1;
                game.coinScore += 10;
                playCoinSound();
                saveProgress();
                updateHud();
            }
        }
    }

    function updatePowerUps() {
        // Revisa si el jugador recoge un boost, una burbuja protectora o un salto reforzado.
        for (const powerUp of powerUps) {
            if (powerUp.collected) continue;

            const playerRect = {
                left: player.x,
                right: player.x + player.width,
                top: player.y,
                bottom: player.y + player.height
            };

            const powerUpRect = {
                left: powerUp.x,
                right: powerUp.x + powerUp.width,
                top: powerUp.y,
                bottom: powerUp.y + powerUp.height
            };

            if (!rectsOverlap(playerRect, powerUpRect)) continue;

            powerUp.collected = true;
            playPowerUpSound();

            if (powerUp.type === "speed") {
                player.speedBoostTimer = 9;
            } else if (powerUp.type === "jump") {
                player.jumpBoostTimer = 8;
            } else if (powerUp.type === "shield") {
                game.invulnerable = Math.max(game.invulnerable, 10);
            }

            game.coinScore += 25;
            updateHud();
        }
    }

    function checkEnemyCollisions() {
        // Compara la caja del jugador con la de cada enemigo.
        for (const enemy of enemies) {
            const playerRect = {
                left: player.x,
                right: player.x + player.width,
                top: player.y,
                bottom: player.y + player.height
            };

            const enemyRect = {
                left: enemy.x,
                right: enemy.x + enemy.width,
                top: enemy.y,
                bottom: enemy.y + enemy.height
            };

            if (rectsOverlap(playerRect, enemyRect)) {
                applyDamage();
                return;
            }
        }
    }

    function updateScore() {
        // Convierte únicamente el avance hacia delante en puntuación y suma monedas colectadas.
        const movedForward = Math.max(0, player.x - player.lastScoreX);
        game.distance += movedForward;
        player.lastScoreX = player.x;

        game.score = Math.floor(game.distance * 0.1) + game.coinScore;

        if (game.score > game.highScore) {
            game.highScore = game.score;

            try {
                localStorage.setItem(STORAGE_KEY, String(game.highScore));
            } catch (error) {
                console.warn("No se pudo guardar el récord.", error);
            }
        }

        updateHud();
    }

    function isObjectiveComplete() {
        const level = levelDefinitions[game.currentLevel] || levelDefinitions[0];
        const objective = level.objective;

        if (objective.type === "collect-coins") {
            return coins.filter(coin => coin.collected).length >= objective.target;
        }

        if (objective.type === "survive-lives") {
            return game.lives >= objective.target;
        }

        return true;
    }

    function checkLevelProgress() {
        // Cuando se llega al final del nivel, se pasa a la siguiente zona o se gana.
        if (game.state !== "playing") return;

        const currentLevelData = levelDefinitions[game.currentLevel] || levelDefinitions[0];
        const door = currentLevelData.door;
        const playerRect = {
            left: player.x,
            right: player.x + player.width,
            top: player.y,
            bottom: player.y + player.height
        };
        const doorRect = {
            left: door.x,
            right: door.x + door.width,
            top: door.y,
            bottom: door.y + door.height
        };

        if (rectsOverlap(playerRect, doorRect) && isObjectiveComplete()) {
            game.state = "level-clear";
            stopMusic();
            showOverlay(
                game.currentLevel === levelDefinitions.length - 1 ? "Victoria" : "Nivel completado",
                game.currentLevel === levelDefinitions.length - 1 ? "Reiniciar" : "Siguiente nivel"
            );
        }
    }

    function update(deltaTime) {
        // UPDATE: calcula física, colisiones, entidades, puntuación y cámara.
        if (game.state !== "playing") return;

        game.elapsedTime += deltaTime;
        game.invulnerable = Math.max(0, game.invulnerable - deltaTime);
        game.respawnTimer = Math.max(0, game.respawnTimer - deltaTime);

        if (player.speedBoostTimer > 0) {
            player.speedBoostTimer = Math.max(0, player.speedBoostTimer - deltaTime);
        }

        if (player.jumpBoostTimer > 0) {
            player.jumpBoostTimer = Math.max(0, player.jumpBoostTimer - deltaTime);
        }

        player.jumpForce = player.jumpBoostTimer > 0 ? player.baseJumpForce * 1.35 : player.baseJumpForce;

        const wasOnGround = player.onGround;

        handleInput(deltaTime);

        const previousX = player.x;
        const previousY = player.y;

        player.vy += game.gravity * deltaTime;
        player.x += player.vx * deltaTime;

        const permanentSpeedMultiplier = 1 + game.speedUpgradeLevel * 0.08;
        const maxSpeed = player.maxSpeed * permanentSpeedMultiplier * (player.speedBoostTimer > 0 ? 1.5 : 1);

        if (player.vx > maxSpeed) {
            player.vx = maxSpeed;
        } else if (player.vx < -maxSpeed) {
            player.vx = -maxSpeed;
        }

        player.y += player.vy * deltaTime;

        const groundTop = game.groundY - player.height;

        if (player.y >= groundTop) {
            player.y = groundTop;
            player.vy = 0;
            player.onGround = true;
            player.coyoteTime = 0.12;
        } else {
            player.onGround = false;
        }

        resolvePlatformCollisions(previousY);
        resolveObstacleCollisions(previousX, previousY);

        if (!wasOnGround && player.onGround) {
            playLandingSound();
        }

        updateCoins();
        updatePowerUps();
        updateCheckpoints();
        updateEnemies(deltaTime);
        checkEnemyCollisions();
        updateScore();
        checkLevelProgress();

        if (player.onGround) {
            if (Math.abs(player.vx) > 5) {
                player.state = player.facing === 1 ? "running-right" : "running-left";
            } else {
                player.state = "idle";
            }
        } else {
            if (player.vy > 0) {
                player.state = "falling";
            } else if (player.vy < 0) {
                player.state = "jumping";
            }
        }

        if (player.x < 0) {
            player.x = 0;
            player.vx = 0;
        }

        if (player.x + player.width > game.worldWidth) {
            player.x = game.worldWidth - player.width;
            player.vx = 0;
        }

        const targetCameraX = player.x - game.width * 0.35;
        camera.x = Math.max(0, Math.min(targetCameraX, game.worldWidth - game.width));
    }

    function drawPlayer() {
        // Dibuja un personaje temporal con una pose procedural según su estado.
        if (game.respawnTimer > 0 && Math.floor(game.respawnTimer * 20) % 2 === 0) return;

        const drawX = player.x - camera.x;
        const isMoving = player.state === "running-left" || player.state === "running-right";
        const step = isMoving ? Math.sin(game.elapsedTime * 14) * 3 : 0;
        const eyeOffset = player.facing === 1 ? 0 : 4;
        const bodyOffset = player.state === "jumping" ? -3 : player.state === "falling" ? 3 : 0;
        const bodyY = player.y + bodyOffset;

        ctx.fillStyle = player.color;
        ctx.fillRect(drawX, bodyY + Math.abs(step) * 0.25, player.width, player.height - Math.abs(step) * 0.25);

        ctx.fillStyle = player.accent;
        ctx.fillRect(drawX + 9 + eyeOffset, bodyY + 10, 10, 10);
        ctx.fillRect(drawX + 27 + eyeOffset, bodyY + 10, 10, 10);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(drawX + 16, bodyY + 24, 16, 18);

        // Dos bloques inferiores sugieren el movimiento sin usar sprites externos.
        ctx.fillStyle = "#111827";
        const legOffset = player.state === "jumping" ? -4 : player.state === "falling" ? 2 : 0;
        ctx.fillRect(drawX + 7, bodyY + player.height - 5, 12, 5 + step + legOffset);
        ctx.fillRect(drawX + 29, bodyY + player.height - 5, 12, 5 - step + legOffset);

        // La sombra ayuda a percibir la altura durante un salto o una caída.
        if (!player.onGround) {
            const shadowScale = player.state === "jumping" ? 0.55 : 0.75;
            ctx.fillStyle = `rgba(15, 23, 42, ${0.18 * shadowScale})`;
            ctx.beginPath();
            ctx.ellipse(drawX + player.width / 2, game.groundY + 5, 25 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (game.invulnerable > 0) {
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX - 2, bodyY - 2, player.width + 4, player.height + 4);
        }
    }

    function isVisibleInCanvas(entity) {
        // Evita dibujar entidades que están completamente fuera de la cámara.
        const screenLeft = entity.x - camera.x;
        const screenRight = screenLeft + entity.width;
        return screenRight >= 0 && screenLeft <= game.width;
    }

    function drawPlatforms() {
        // Dibuja plataformas del mundo aplicando el desplazamiento de cámara.
        for (const platform of platforms) {
            if (!isVisibleInCanvas(platform)) continue;

            const drawX = platform.x - camera.x;

            ctx.fillStyle = "#2c7a7b";
            ctx.fillRect(drawX, platform.y, platform.width, platform.height);

            ctx.strokeStyle = "#134e4a";
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, platform.y, platform.width, platform.height);
        }
    }

    function drawObstacles() {
        // Dibuja obstáculos sólidos con borde de contraste.
        for (const obstacle of obstacles) {
            if (!isVisibleInCanvas(obstacle)) continue;

            const drawX = obstacle.x - camera.x;

            ctx.fillStyle = obstacle.color;
            ctx.fillRect(drawX, obstacle.y, obstacle.width, obstacle.height);

            ctx.strokeStyle = "#450a0a";
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, obstacle.y, obstacle.width, obstacle.height);
        }
    }

    function drawCheckpoints() {
        // Dibuja banderas visibles para representar cada punto de control.
        for (const checkpoint of checkpoints) {
            if (!isVisibleInCanvas(checkpoint)) continue;

            const drawX = checkpoint.x - camera.x;
            const drawY = checkpoint.y;

            ctx.strokeStyle = checkpoint.reached ? "#86efac" : "#f8fafc";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(drawX + 10, drawY);
            ctx.lineTo(drawX + 10, drawY + checkpoint.height);
            ctx.stroke();

            ctx.fillStyle = checkpoint.reached ? "#22c55e" : "#fbbf24";
            ctx.beginPath();
            ctx.moveTo(drawX + 10, drawY + 10);
            ctx.lineTo(drawX + 32, drawY + 22);
            ctx.lineTo(drawX + 10, drawY + 34);
            ctx.closePath();
            ctx.fill();
        }
    }

    function drawDoor() {
        const level = levelDefinitions[game.currentLevel] || levelDefinitions[0];
        const door = level.door;

        if (!isVisibleInCanvas(door)) return;

        const drawX = door.x - camera.x;

        ctx.fillStyle = "#312e81";
        ctx.fillRect(drawX, door.y, door.width, door.height);

        ctx.strokeStyle = "#c4b5fd";
        ctx.lineWidth = 4;
        ctx.strokeRect(drawX, door.y, door.width, door.height);

        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(drawX + door.width - 14, door.y + door.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawEnemies() {
        // Dibuja enemigos temporales usando formas rectangulares.
        for (const enemy of enemies) {
            if (!isVisibleInCanvas(enemy)) continue;

            const drawX = enemy.x - camera.x;

            ctx.fillStyle = enemy.color;
            ctx.fillRect(drawX, enemy.y, enemy.width, enemy.height);

            ctx.fillStyle = "#1f2937";
            ctx.fillRect(drawX + 8, enemy.y + 8, 8, 8);
            ctx.fillRect(drawX + 24, enemy.y + 8, 8, 8);

            ctx.fillStyle = "#fef3c7";
            ctx.fillRect(drawX + 10, enemy.y + 20, 22, 8);
        }
    }

    function drawCoins() {
        // Dibuja las monedas visibles en pantalla con un efecto de brillo suave.
        for (const coin of coins) {
            if (coin.collected || !isVisibleInCanvas(coin)) continue;

            const drawX = coin.x - camera.x + coin.width / 2;
            const drawY = coin.y + coin.height / 2 + Math.sin(game.elapsedTime * 8 + coin.x * 0.1) * 3;

            ctx.fillStyle = "#facc15";
            ctx.beginPath();
            ctx.arc(drawX, drawY, coin.width / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#fef3c7";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.fillRect(drawX - 2, drawY - 5, 4, 10);
        }
    }

    function drawPowerUps() {
        // Dibuja los power-ups con varios colores según su efecto en el jugador.
        for (const powerUp of powerUps) {
            if (powerUp.collected || !isVisibleInCanvas(powerUp)) continue;

            const drawX = powerUp.x - camera.x + powerUp.width / 2;
            const drawY = powerUp.y + powerUp.height / 2 + Math.sin(game.elapsedTime * 9 + powerUp.x * 0.2) * 3;
            const colors = {
                speed: "#22c55e",
                jump: "#f97316",
                shield: "#a78bfa"
            };

            ctx.fillStyle = colors[powerUp.type] || "#38bdf8";
            ctx.beginPath();

            if (powerUp.type === "speed") {
                ctx.moveTo(drawX, drawY - 10);
                ctx.lineTo(drawX + 10, drawY);
                ctx.lineTo(drawX, drawY + 10);
                ctx.lineTo(drawX - 10, drawY);
                ctx.closePath();
            } else if (powerUp.type === "jump") {
                ctx.arc(drawX, drawY, 10, 0, Math.PI * 2);
            } else {
                ctx.moveTo(drawX, drawY - 11);
                ctx.lineTo(drawX + 9, drawY - 4);
                ctx.lineTo(drawX + 9, drawY + 6);
                ctx.lineTo(drawX, drawY + 11);
                ctx.lineTo(drawX - 9, drawY + 6);
                ctx.lineTo(drawX - 9, drawY - 4);
                ctx.closePath();
            }

            ctx.fill();

            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    function drawBackground() {
        // Dibuja capas decorativas independientes de las entidades jugables.
        const level = levelDefinitions[game.currentLevel] || levelDefinitions[0];
        const skyGradient = ctx.createLinearGradient(0, 0, 0, game.height);
        skyGradient.addColorStop(0, level.backgroundTop);
        skyGradient.addColorStop(0.55, level.backgroundMid);
        skyGradient.addColorStop(1, level.backgroundBottom);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, game.width, game.height);

        if (level.theme === "night") {
            ctx.fillStyle = "#fef3c7";
            ctx.beginPath();
            ctx.arc(790, 92, 34, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
            for (let index = 0; index < 28; index += 1) {
                const starX = (index * 137 + 43) % game.width;
                const starY = 24 + ((index * 67) % 190);
                const starSize = index % 4 === 0 ? 2 : 1;
                ctx.fillRect(starX, starY, starSize, starSize);
            }

            ctx.fillStyle = "rgba(30, 58, 138, 0.42)";
            ctx.beginPath();
            ctx.moveTo(0, game.groundY);
            ctx.lineTo(0, 350);
            ctx.lineTo(180, 300);
            ctx.lineTo(360, 345);
            ctx.lineTo(560, 285);
            ctx.lineTo(760, 335);
            ctx.lineTo(960, 290);
            ctx.lineTo(960, game.groundY);
            ctx.closePath();
            ctx.fill();
            return;
        }

        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        for (let index = 0; index < 5; index += 1) {
            const cloudX = index * 240 - (camera.x * 0.18) % 240;
            const cloudY = 75 + (index % 2) * 52;
            ctx.beginPath();
            ctx.ellipse(cloudX, cloudY, 58, 14, 0, 0, Math.PI * 2);
            ctx.ellipse(cloudX + 38, cloudY - 8, 38, 18, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = "rgba(15, 118, 110, 0.24)";
        ctx.beginPath();
        ctx.moveTo(0, game.groundY);
        ctx.lineTo(0, 325);
        ctx.lineTo(180, 270);
        ctx.lineTo(360, 330);
        ctx.lineTo(560, 245);
        ctx.lineTo(760, 320);
        ctx.lineTo(960, 255);
        ctx.lineTo(960, game.groundY);
        ctx.closePath();
        ctx.fill();
    }

    function draw() {
        // DRAW: limpia el Canvas y renderiza el mundo en orden de profundidad.
        ctx.clearRect(0, 0, game.width, game.height);

        drawBackground();

        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(-camera.x, game.groundY, game.worldWidth, game.height - game.groundY);

        ctx.strokeStyle = "#2E7D32";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-camera.x, game.groundY);
        ctx.lineTo(game.worldWidth - camera.x, game.groundY);
        ctx.stroke();

        drawPlatforms();
        drawObstacles();
        drawCoins();
        drawPowerUps();
        drawCheckpoints();
        drawDoor();
        drawEnemies();
        drawPlayer();
    }

    function gameLoop(timestamp) {
        // requestAnimationFrame sincroniza cada actualización con el repintado del navegador.
        const deltaTime = Math.min((timestamp - game.lastTime) / 1000, MAX_DELTA_TIME);
        game.lastTime = timestamp;

        update(deltaTime);
        draw();

        requestAnimationFrame(gameLoop);
    }

    // addEventListener registra funciones para responder a eventos sin usar onclick en HTML.
    window.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            keys.left = true;
            event.preventDefault();
        }

        if (event.key === "ArrowRight") {
            keys.right = true;
            event.preventDefault();
        }

        if (event.key === "ArrowUp" || event.key === " ") {
            if (game.state === "menu") {
                ensureAudio();
                startGame();
                return;
            }

            if (game.state === "gameover") {
                ensureAudio();
                restartGame();
                return;
            }

            if (game.state === "paused") {
                togglePause();
                return;
            }

            if (game.state === "level-clear") {
                ensureAudio();
                advanceLevel();
                return;
            }

            if (game.state === "victory") {
                ensureAudio();
                game.currentLevel = 0;
                startGame();
                return;
            }

            if (!keys.jump) {
                keys.jumpQueued = true;
            }

            keys.jump = true;
            event.preventDefault();
        }
    });

    window.addEventListener("keyup", (event) => {
        // Al soltar una tecla se desactiva su bandera de entrada.
        if (event.key === "ArrowLeft") {
            keys.left = false;
        }

        if (event.key === "ArrowRight") {
            keys.right = false;
        }

        if (event.key === "ArrowUp" || event.key === " ") {
            keys.jump = false;
        }
    });

    retryButton.addEventListener("click", () => {
        // El botón funciona tanto para comenzar, para avanzar de nivel y para reiniciar.
        ensureAudio();
        if (game.state === "level-clear") {
            advanceLevel();
            return;
        }

        if (game.state === "victory") {
            game.currentLevel = 0;
            startGame();
            return;
        }

        if (game.state === "paused") {
            togglePause();
            return;
        }

        restartGame();
    });

    pauseButton.addEventListener("click", togglePause);
    resetScoreButton.addEventListener("click", resetCurrentScore);
    menuButton.addEventListener("click", returnToMenu);

    playButton.addEventListener("click", () => {
        ensureAudio();
        startGame();
    });

    mapButton.addEventListener("click", () => {
        renderMapList();
        mainMenu.classList.add("hidden");
        mapOverlay.classList.remove("hidden");
    });

    backToMapsButton.addEventListener("click", renderMapList);
    closeMapButton.addEventListener("click", showMenu);

    speedUpgradeButton.addEventListener("click", () => {
        if (game.coins < SPEED_UPGRADE_COST || game.speedUpgradeLevel >= MAX_SPEED_UPGRADE_LEVEL) return;

        game.coins -= SPEED_UPGRADE_COST;
        game.speedUpgradeLevel += 1;
        saveProgress();
        updateHud();
    });

    document.addEventListener("visibilitychange", () => {
        // Pausar la música evita consumir audio mientras la pestaña no es visible.
        if (document.hidden) {
            stopMusic();
        } else if (game.state === "playing") {
            startMusic();
        }
    });

    setupTouchControls();

    // Estado inicial: se pinta el primer frame aunque todavía no haya partida.
    updateHud();
    resetLevel();
    showMenu();
    requestAnimationFrame(gameLoop);

    console.log("FASE 14: score corregido, daño con vidas y sonido implementados.");
});