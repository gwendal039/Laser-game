export const Config = {
  // ═══════════════════════════════════════════
  // PLAYER PHYSICS (shared by player AND bots)
  // ═══════════════════════════════════════════
  player: {
    moveSpeed: 10,
    sprintMultiplier: 1.55,
    crouchSpeedMultiplier: 0.5,
    acceleration: 45,
    friction: 10,
    airControl: 0.55,
    jumpForce: 10.5,
    gravity: 26,
    height: 3.3,
    eyeHeight: 3.1,
    crouchHeight: 2.2,
    crouchEyeHeight: 2.0,
    radius: 0.65,
  },

  // ═══════════════════════════════════════════
  // WEAPON
  // ═══════════════════════════════════════════
  weapon: {
    cooldown: 0.55,
    laserDuration: 0.2,
    laserRange: 150,
    laserColor: 0x00ffff,
  },

  // ═══════════════════════════════════════════
  // HIT ZONES & SCORING
  // ═══════════════════════════════════════════
  hitZones: {
    head:      { points: 150, label: 'HEADSHOT',  color: '#ff4444' },
    torso:     { points: 100, label: 'TORSO',     color: '#ff8800' },
    back:      { points: 120, label: 'BACK',      color: '#ffaa00' },
    shoulders: { points: 75,  label: 'SHOULDER',  color: '#ffcc00' },
    legs:      { points: 50,  label: 'LEGS',      color: '#ffee00' },
  },

  // ═══════════════════════════════════════════
  // RESPAWN
  // ═══════════════════════════════════════════
  respawn: {
    disableDuration: 1.8,
    invulnerabilityDuration: 1.2,
  },

  // ═══════════════════════════════════════════
  // MATCH
  // ═══════════════════════════════════════════
  match: {
    defaultDuration: 180,
    durations: [60, 120, 180, 300, 0],
    durationLabels: ['1 min', '2 min', '3 min', '5 min', 'Unlimited'],
  },

  // ═══════════════════════════════════════════
  // 4 DIFFICULTY PRESETS
  // ═══════════════════════════════════════════
  difficulty: {
    rookie: {
      label: 'ROOKIE',
      moveSpeedMul: 0.7,
      accuracy: 0.15,
      fireRate: 0.35,
      reactionTime: 1.2,
      detectionRange: 25,
      jumpChance: 0.001,
      crouchChance: 0.0005,
      strafeIntensity: 0.15,
      hitThreshold: 0.91,
      missChance: 0.65,
      targetSwitchRate: 0.3,
      aggressiveness: 0.2,
    },
    casual: {
      label: 'CASUAL',
      moveSpeedMul: 0.85,
      accuracy: 0.35,
      fireRate: 0.55,
      reactionTime: 0.7,
      detectionRange: 38,
      jumpChance: 0.004,
      crouchChance: 0.003,
      strafeIntensity: 0.3,
      hitThreshold: 0.94,
      missChance: 0.45,
      targetSwitchRate: 0.5,
      aggressiveness: 0.4,
    },
    skilled: {
      label: 'SKILLED',
      moveSpeedMul: 1.0,
      accuracy: 0.6,
      fireRate: 0.8,
      reactionTime: 0.3,
      detectionRange: 55,
      jumpChance: 0.01,
      crouchChance: 0.008,
      strafeIntensity: 0.55,
      hitThreshold: 0.965,
      missChance: 0.25,
      targetSwitchRate: 0.7,
      aggressiveness: 0.65,
    },
    elite: {
      label: 'ELITE',
      moveSpeedMul: 1.1,
      accuracy: 0.82,
      fireRate: 1.2,
      reactionTime: 0.1,
      detectionRange: 70,
      jumpChance: 0.016,
      crouchChance: 0.014,
      strafeIntensity: 0.8,
      hitThreshold: 0.975,
      missChance: 0.12,
      targetSwitchRate: 0.9,
      aggressiveness: 0.85,
    },
  },
  difficultyKeys: ['rookie', 'casual', 'skilled', 'elite'],

  // ═══════════════════════════════════════════
  // BOT POOL
  // ═══════════════════════════════════════════
  bot: {
    patrolPauseMin: 0.4,
    patrolPauseMax: 1.5,
    pathUpdateInterval: 1.5,
    maxCount: 10,
    names: [
      'Phantom', 'Viper', 'Neon', 'Blaze', 'Ghost', 'Pulse', 'Volt', 'Storm',
      'Nova', 'Echo', 'Apex', 'Cipher', 'Atlas', 'Raven', 'Onyx', 'Flux',
      'Zenith', 'Orbit', 'Nexus', 'Prism', 'Helix', 'Quartz', 'Dynamo', 'Vector',
    ],
    colors: [
      0xff3333, 0xff8800, 0xcc00ff, 0xffcc00, 0x33ff66, 0xff66cc,
      0x00ccff, 0xff4466, 0x88ff00, 0xff0088, 0x00ffaa, 0xaa44ff,
    ],
  },

  // ═══════════════════════════════════════════
  // TEAMS
  // ═══════════════════════════════════════════
  teams: {
    colors: [
      { primary: 0x0088ff, secondary: 0x00ccff, name: 'Blue',  css: '#0088ff' },
      { primary: 0xff3333, secondary: 0xff6666, name: 'Red',   css: '#ff3333' },
      { primary: 0x33cc33, secondary: 0x66ff66, name: 'Green', css: '#33cc33' },
      { primary: 0xffaa00, secondary: 0xffcc44, name: 'Gold',  css: '#ffaa00' },
    ],
  },

  // ═══════════════════════════════════════════
  // QUICK MATCH CONFIG
  // ═══════════════════════════════════════════
  quickMatch: {
    minBots: 3,
    maxBots: 8,
    difficultyWeights: { rookie: 30, casual: 35, skilled: 25, elite: 10 },
    durations: [120, 180, 300],
  },

  // ═══════════════════════════════════════════
  // GAME MODES
  // ═══════════════════════════════════════════
  gameModes: {
    QUICK_MATCH: 'quick_match',
    TRAINING: 'training',
    FFA: 'ffa',
    TEAM_BATTLE: 'team_battle',
  },

  // ═══════════════════════════════════════════
  // ARENA
  // ═══════════════════════════════════════════
  arena: {
    width: 100,
    depth: 100,
    wallHeight: 7,
    ceilingHeight: 8,
  },

  // ═══════════════════════════════════════════
  // DEFAULT USER SETTINGS
  // ═══════════════════════════════════════════
  defaults: {
    // Gameplay
    sensitivity: 0.003,
    aimSensitivityMultiplier: 0.65,
    fov: 90,
    aimFov: 70,
    volume: 0.7,
    showFps: false,
    crosshairColor: '#00ffcc',
    playerName: 'Player',
    botCount: 2,
    difficulty: 'casual',
    matchDuration: 180,
    invertY: false,
    headBob: true,
    screenShake: true,
    showWeapon: true,

    // Graphics
    renderScale: 1.0,
    antiAliasing: false,
    particleQuality: 'high',
    drawDistance: 200,
    showShadows: false,
    motionBlur: false,
    bloomEffect: false,
    ambientOcclusion: false,

    // Key bindings (event.code values)
    keyForward: 'KeyW',
    keyForwardAlt: 'KeyZ',
    keyBackward: 'KeyS',
    keyLeft: 'KeyA',
    keyLeftAlt: 'KeyQ',
    keyRight: 'KeyD',
    keyJump: 'Space',
    keySprint: 'ShiftLeft',
    keyCrouch: 'KeyC',
    keyCrouchAlt: 'ControlLeft',
  },

  // Mapping for display names of key codes
  keyDisplayNames: {
    'KeyW': 'W', 'KeyZ': 'Z', 'KeyS': 'S', 'KeyA': 'A', 'KeyQ': 'Q',
    'KeyD': 'D', 'KeyE': 'E', 'KeyR': 'R', 'KeyF': 'F', 'KeyG': 'G',
    'KeyT': 'T', 'KeyY': 'Y', 'KeyU': 'U', 'KeyI': 'I', 'KeyO': 'O',
    'KeyP': 'P', 'KeyH': 'H', 'KeyJ': 'J', 'KeyK': 'K', 'KeyL': 'L',
    'KeyN': 'N', 'KeyM': 'M', 'KeyB': 'B', 'KeyV': 'V', 'KeyX': 'X',
    'KeyC': 'C',
    'Space': 'SPACE', 'ShiftLeft': 'L-SHIFT', 'ShiftRight': 'R-SHIFT',
    'ControlLeft': 'L-CTRL', 'ControlRight': 'R-CTRL',
    'AltLeft': 'L-ALT', 'AltRight': 'R-ALT',
    'Tab': 'TAB', 'CapsLock': 'CAPS',
    'ArrowUp': 'UP', 'ArrowDown': 'DOWN', 'ArrowLeft': 'LEFT', 'ArrowRight': 'RIGHT',
    'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4', 'Digit5': '5',
    'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9', 'Digit0': '0',
  },
};
