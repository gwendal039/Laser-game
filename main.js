import * as THREE from 'three';
import { Config } from './Config.js';
import { PlayerState, GamePhase } from './GameState.js';
import { SettingsManager } from './SettingsManager.js';
import { InputManager } from './InputManager.js';
import { Player } from './Player.js';
import { BotPlayer } from './BotPlayer.js';
import { LaserWeapon } from './LaserWeapon.js';
import { Scoring } from './Scoring.js';
import { RespawnSystem } from './RespawnSystem.js';
import { MatchManager } from './MatchManager.js';
import { Arena } from './Arena.js';
import { UIManager } from './UIManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { AudioManager } from './AudioManager.js';
import { TargetingSystem } from './TargetingSystem.js';
import { TeamManager } from './TeamManager.js';
import { ProfileManager } from './ProfileManager.js';
import { ProgressionManager } from './ProgressionManager.js';
import { MissionManager } from './MissionManager.js';
import { AchievementManager } from './AchievementManager.js';
import { ShopManager } from './ShopManager.js';
import { AccountManager } from './AccountManager.js';
import { WeaponModel } from './WeaponModel.js';
import { WeaponSkinManager, SKIN_CATALOG } from './WeaponSkinManager.js';
import { BodyCosmeticManager } from './BodyCosmeticManager.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.clock = new THREE.Clock();
    this.phase = GamePhase.MENU;
    this.gameMode = null;

    this.settings = new SettingsManager();
    this.bots = [];
    this.botWeapons = [];
    this._nameMap = {};

    this._initRenderer();
    this._initScene();
    this._initSystems();
    this._initUI();

    this._bound_loop = this._loop.bind(this);
    this._bound_resize = this._onResize.bind(this);
    window.addEventListener('resize', this._bound_resize);

    this._loop();
  }

  // ═══════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.settings.get('antiAliasing') || false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const scale = this.settings.get('renderScale') || 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio * scale, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.settings.get('fov'),
      window.innerWidth / window.innerHeight,
      0.1, this.settings.get('drawDistance') || 200
    );
  }

  _initSystems() {
    this.audio = new AudioManager();
    this.particles = new ParticleSystem(this.scene);
    this.arena = new Arena(this.scene);
    this.arena.build();

    this.input = new InputManager(this.canvas, this.settings);
    this.playerWeapon = new LaserWeapon(this.scene, this.audio, this.particles);
    this.scoring = new Scoring();
    this.respawn = new RespawnSystem(this.arena.getSpawnPoints());
    this.match = new MatchManager();
    this.targeting = new TargetingSystem();
    this.teamManager = new TeamManager();

    // ── Account system ──
    this.accountManager = new AccountManager();

    // ── Progression systems ──
    this.profileManager = new ProfileManager();
    this.missionManager = new MissionManager(this.profileManager);
    this.achievementManager = new AchievementManager(this.profileManager);
    this.shopManager = new ShopManager(this.profileManager);
    this.progressionManager = new ProgressionManager(
      this.profileManager, this.missionManager, this.achievementManager
    );

    // ── Weapon skins & body cosmetics ──
    this.weaponSkinManager = new WeaponSkinManager(this.profileManager);
    this.bodyCosmeticManager = new BodyCosmeticManager(this.profileManager);

    // ── Weapon model (FPS view) ──
    this.weaponModel = new WeaponModel(this.camera);

    // Pointer lock → pause
    this.input.onPointerLockChange((locked) => {
      if (this.phase === GamePhase.PLAYING && !locked) this._pause();
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.phase === GamePhase.PAUSED) this._resume();
      if (e.code === 'Tab' && this.phase === GamePhase.PLAYING) e.preventDefault();
    });

    // Listen for graphics changes
    this.settings.onChange('renderScale', () => this._applyGraphicsSettings());
    this.settings.onChange('drawDistance', (v) => { this.camera.far = v; this.camera.updateProjectionMatrix(); });
    this.settings.onChange('showWeapon', (v) => { if (this.phase === GamePhase.PLAYING) { if (v) this.weaponModel.show(); else this.weaponModel.hide(); } });
  }

  _initUI() {
    this.ui = new UIManager(this.settings);

    // ── Auth events ──
    this.ui.on('guestLogin', () => this._handleGuestLogin());
    this.ui.on('register', (data) => this._handleRegister(data));
    this.ui.on('login', (data) => this._handleLogin(data));
    this.ui.on('logout', () => this._handleLogout());

    // ── Game events ──
    this.ui.on('quickMatch', () => this._startQuickMatch());
    this.ui.on('startFFA',   (opts) => this._startFFA(opts));
    this.ui.on('startTeam',  (opts) => this._startTeamBattle(opts));
    this.ui.on('teamBattle', () => this._startQuickTeamBattle());
    this.ui.on('startTraining', (opts) => this._startTraining(opts));
    this.ui.on('resume',   () => this._resume());
    this.ui.on('restart',  () => this._restart());
    this.ui.on('quit',     () => this._quitToMenu());
    this.ui.on('playAgain', () => this._restart());
    this.ui.on('graphicsChanged', () => this._applyGraphicsSettings());

    // ── Progression UI events ──
    this.ui.on('openProfile',      () => this.ui.showProfileScreen(this.profileManager));
    this.ui.on('openMissions',     () => this.ui.showMissionsScreen(this.missionManager));
    this.ui.on('openAchievements', () => this.ui.showAchievementsScreen(this.achievementManager));
    this.ui.on('openShop',         () => this.ui.showShopScreen(this.shopManager));
    this.ui.on('buyItem',          (id) => this._handleShopBuy(id));
    this.ui.on('equipItem',        (id) => this._handleShopEquip(id));
    this.ui.on('claimMission',     (d) => this._handleClaimMission(d));

    // ── Customize / Skins ──
    this.ui.on('openCustomize',    () => {
      this.ui._custPlayerName = this.profileManager.name;
      this.ui.showCustomizeScreen(this.weaponSkinManager, this.profileManager.profile.credits || 0, this.bodyCosmeticManager);
    });
    this.ui.on('equipSkin',        (id) => { this.weaponSkinManager.equipSkin(id); this._applyWeaponSkin(); this.ui._custCredits = this.profileManager.profile.credits || 0; this.ui._refreshCustContent(); });
    this.ui.on('buySkin',          (id) => { const r = this.weaponSkinManager.buySkin(id); if (r.ok) { this._applyWeaponSkin(); this._saveProfileToAccount(); } this.ui._custCredits = this.profileManager.profile.credits || 0; this.ui._refreshCustContent(); });
    this.ui.on('spinSkin',         (tierId) => { const r = this.weaponSkinManager.spin(tierId); if (r.ok) { this._applyWeaponSkin(); this._saveProfileToAccount(); this.ui._custCredits = this.profileManager.profile.credits || 0; this.ui.showSpinResult(r.skin, r.isDupe); } });
    this.ui.on('equipCosmetic',    (id) => { this.bodyCosmeticManager.equipCosmetic(id); this._saveProfileToAccount(); this.ui._custCredits = this.profileManager.profile.credits || 0; this.ui._refreshCustContent(); });
    this.ui.on('unequipCosmetic',  (slotId) => { this.bodyCosmeticManager.unequipSlot(slotId); this._saveProfileToAccount(); this.ui._refreshCustContent(); });
    this.ui.on('buyCosmetic',      (id) => { const r = this.bodyCosmeticManager.buyCosmetic(id); if (r.ok) { this._saveProfileToAccount(); this.ui._custCredits = this.profileManager.profile.credits || 0; } });
    this.ui.on('closeProgression', () => this._showEndScreenFromProgression());

    // ── Initial screen ──
    this._handleInitialScreen();
  }

  // ═══════════════════════════════════════════
  // ACCOUNT SYSTEM
  // ═══════════════════════════════════════════

  _handleInitialScreen() {
    if (this.accountManager.hasSession()) {
      // Auto-login
      if (this.accountManager.isLoggedIn()) {
        this._loadAccountProfile();
      }
      this._showMenuWithProfile();
    } else {
      // First time — show welcome
      this.ui.showWelcome();
    }
  }

  _handleGuestLogin() {
    this.accountManager.loginAsGuest();
    this._showMenuWithProfile();
  }

  _handleRegister(data) {
    const result = this.accountManager.createAccount(data.username, data.password);
    if (!result.success) {
      this.ui.showRegisterError(result.error);
      return;
    }
    // Set player name to username
    this.profileManager.setName(data.username);
    this._saveProfileToAccount();
    this._showMenuWithProfile();
  }

  _handleLogin(data) {
    const result = this.accountManager.login(data.username, data.password);
    if (!result.success) {
      this.ui.showLoginError(result.error);
      return;
    }
    this._loadAccountProfile();
    this._showMenuWithProfile();
  }

  _handleLogout() {
    this._saveProfileToAccount();
    this.accountManager.logout();
    // Reset profile to default
    this.profileManager.reset();
    this.missionManager = new MissionManager(this.profileManager);
    this.achievementManager = new AchievementManager(this.profileManager);
    this.shopManager = new ShopManager(this.profileManager);
    this.progressionManager = new ProgressionManager(
      this.profileManager, this.missionManager, this.achievementManager
    );
    this.ui.showWelcome();
  }

  _loadAccountProfile() {
    const profileData = this.accountManager.loadProfile();
    if (profileData) {
      // Merge account profile into ProfileManager
      this.profileManager.profile = profileData;
      this.profileManager.profile.name = profileData.name || this.accountManager.getDisplayName();
    } else {
      this.profileManager.setName(this.accountManager.getDisplayName());
    }
    // Rebuild managers with loaded profile
    this.missionManager = new MissionManager(this.profileManager);
    this.achievementManager = new AchievementManager(this.profileManager);
    this.shopManager = new ShopManager(this.profileManager);
    this.progressionManager = new ProgressionManager(
      this.profileManager, this.missionManager, this.achievementManager
    );
  }

  _saveProfileToAccount() {
    if (this.accountManager.isLoggedIn()) {
      this.accountManager.saveProfile(this.profileManager.profile);
    }
  }

  _showMenuWithProfile() {
    const displayName = this.accountManager.isLoggedIn()
      ? this.accountManager.getDisplayName()
      : (this.accountManager.isGuest() ? 'Guest' : 'Player');
    this.ui.showMenu(this.profileManager, this.missionManager);
    this.ui.updateMenuProfile(this.profileManager, displayName);
  }

  // ═══════════════════════════════════════════
  // GRAPHICS
  // ═══════════════════════════════════════════

  _applyGraphicsSettings() {
    const scale = this.settings.get('renderScale') || 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio * scale, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ═══════════════════════════════════════════
  // MATCH START — All Modes
  // ═══════════════════════════════════════════

  _startQuickMatch() {
    const cfg = Config.quickMatch;
    const botCount = cfg.minBots + Math.floor(Math.random() * (cfg.maxBots - cfg.minBots + 1));
    const duration = cfg.durations[Math.floor(Math.random() * cfg.durations.length)];

    const botConfigs = [];
    const usedNames = new Set();
    for (let i = 0; i < botCount; i++) {
      const diff = this._weightedRandomDifficulty();
      let name;
      do { name = Config.bot.names[Math.floor(Math.random() * Config.bot.names.length)]; }
      while (usedNames.has(name));
      usedNames.add(name);
      botConfigs.push({ name, difficulty: diff, colorIndex: i });
    }

    this._launchMatch({
      mode: Config.gameModes.QUICK_MATCH,
      botConfigs,
      duration,
      isTeamMode: false,
    });
  }

  _startFFA(opts) {
    const botConfigs = [];
    const usedNames = new Set();
    for (let i = 0; i < opts.botCount; i++) {
      const diff = opts.mixedDifficulty ? this._weightedRandomDifficulty() : opts.difficulty;
      let name;
      do { name = Config.bot.names[Math.floor(Math.random() * Config.bot.names.length)]; }
      while (usedNames.has(name));
      usedNames.add(name);
      botConfigs.push({ name, difficulty: diff, colorIndex: i });
    }

    this._launchMatch({
      mode: Config.gameModes.FFA,
      botConfigs,
      duration: opts.duration || 180,
      isTeamMode: false,
    });
  }

  _startQuickTeamBattle() {
    const cfg = Config.quickMatch;
    const botCount = cfg.minBots + Math.floor(Math.random() * (cfg.maxBots - cfg.minBots + 1));
    const duration = cfg.durations[Math.floor(Math.random() * cfg.durations.length)];

    const botConfigs = [];
    const usedNames = new Set();
    for (let i = 0; i < botCount; i++) {
      const diff = this._weightedRandomDifficulty();
      let name;
      do { name = Config.bot.names[Math.floor(Math.random() * Config.bot.names.length)]; }
      while (usedNames.has(name));
      usedNames.add(name);
      botConfigs.push({ name, difficulty: diff, colorIndex: i });
    }

    this._launchMatch({
      mode: Config.gameModes.TEAM_BATTLE,
      botConfigs,
      duration,
      isTeamMode: true,
      teamCount: null,
    });
  }

  _startTeamBattle(opts) {
    const botConfigs = [];
    const usedNames = new Set();
    for (let i = 0; i < opts.botCount; i++) {
      const diff = opts.mixedDifficulty ? this._weightedRandomDifficulty() : opts.difficulty;
      let name;
      do { name = Config.bot.names[Math.floor(Math.random() * Config.bot.names.length)]; }
      while (usedNames.has(name));
      usedNames.add(name);
      botConfigs.push({ name, difficulty: diff, colorIndex: i });
    }

    this._launchMatch({
      mode: Config.gameModes.TEAM_BATTLE,
      botConfigs,
      duration: opts.duration || 180,
      isTeamMode: true,
      teamCount: opts.teamCount || 2,
    });
  }

  _startTraining(opts) {
    const botConfigs = [];
    const usedNames = new Set();
    for (let i = 0; i < opts.botCount; i++) {
      let name;
      do { name = Config.bot.names[Math.floor(Math.random() * Config.bot.names.length)]; }
      while (usedNames.has(name));
      usedNames.add(name);
      botConfigs.push({ name, difficulty: opts.difficulty || 'rookie', colorIndex: i });
    }

    this._launchMatch({
      mode: Config.gameModes.TRAINING,
      botConfigs,
      duration: opts.duration || 0,
      isTeamMode: false,
      passiveBots: opts.passiveBots || false,
      playerInvincible: opts.playerInvincible || false,
    });
  }

  // ═══════════════════════════════════════════
  // CORE LAUNCH
  // ═══════════════════════════════════════════

  _launchMatch(config) {
    this._matchConfig = config;
    this.gameMode = config.mode;

    this.audio.init();
    this.audio.setVolume(this.settings.get('volume'));
    this.audio.resume();

    this._disposeBots();
    this.scoring.reset();
    this.targeting.reset();
    this.teamManager.deactivate();

    this.particles = new ParticleSystem(this.scene);
    this.playerWeapon = new LaserWeapon(this.scene, this.audio, this.particles);

    this.player = new Player(this.camera, this.input, this.settings);
    const playerSpawns = this.arena.getSpawnPoints().player;
    this.player.spawn(playerSpawns[Math.floor(Math.random() * playerSpawns.length)]);
    this.player.setState(PlayerState.ACTIVE);
    this.scoring.registerPlayer('player');

    this._nameMap = { player: 'You' };

    this.bots = [];
    this.botWeapons = [];
    const enemySpawns = this.arena.getSpawnPoints().enemy;
    const allSpawns = [...playerSpawns, ...enemySpawns];

    for (let i = 0; i < config.botConfigs.length; i++) {
      const bc = config.botConfigs[i];
      const bot = new BotPlayer(this.scene, this.arena, i, bc.difficulty);
      bot.botName = bc.name;
      const sp = allSpawns[Math.floor(Math.random() * allSpawns.length)];
      bot.spawn(sp);
      bot.setState(PlayerState.ACTIVE);
      this.bots.push(bot);

      const weapon = new LaserWeapon(this.scene, this.audio, this.particles);
      this.botWeapons.push(weapon);

      this.scoring.registerPlayer(bot.id);
      this._nameMap[bot.id] = bc.name;
    }

    // Assign random weapon skins to bots (excluding 'default')
    const skinPool = SKIN_CATALOG.filter(s => s.id !== 'default');
    for (const bot of this.bots) {
      const randomSkin = skinPool[Math.floor(Math.random() * skinPool.length)];
      bot._assignedSkin = randomSkin;
      bot.model.applyWeaponSkin(randomSkin);
      // Use skin accent color as bot laser color
      bot.laserColor = randomSkin.accent;
    }

    if (config.isTeamMode) {
      const allIds = ['player', ...this.bots.map((b) => b.id)];
      if (config.teamCount) {
        this.teamManager.createTeams(allIds, config.teamCount);
      } else {
        this.teamManager.createRandomTeams(allIds);
      }
      for (const bot of this.bots) {
        const tc = this.teamManager.getTeamColor(bot.id);
        if (tc) bot.setTeamColor(tc.primary, tc.secondary);
        // Re-apply weapon skin after team colors (team colors skip gun parts)
        if (bot._assignedSkin) bot.model.applyWeaponSkin(bot._assignedSkin);
      }
    }

    this.match.start(config.duration);
    this.match.onMatchEnd(() => this._endMatch());

    this._buildColorMap();

    this._appliedLaserColor = this.shopManager.getLaserColor();
    this._appliedCrosshairColor = this.shopManager.getCrosshairColor();
    this._appliedCrosshairStyle = this.shopManager.getCrosshairStyle();

    this._matchStartTime = Date.now();

    // Show weapon model with skin
    if (this.settings.get('showWeapon')) {
      this.weaponModel.show();
      this._applyWeaponSkin();
      // Only apply shop laser color if using default skin (skin accent takes priority)
      const eqSkin = this.weaponSkinManager.getEquippedSkin();
      if (eqSkin === 'default' && this._appliedLaserColor) {
        this.weaponModel.setLaserColor(this._appliedLaserColor);
      }
    }

    this.ui.showHUD();
    this.ui.buildScoreHeader(this.bots, this._nameMap, this.teamManager, this._colorMap);
    this.ui.applyCrosshair(this._appliedCrosshairColor, this._appliedCrosshairStyle);

    if (config.isTeamMode) {
      const myTeamIdx = this.teamManager.getTeam('player');
      const myTeamColor = this.teamManager.getTeamColor('player');
      if (myTeamIdx >= 0 && myTeamColor) {
        this.ui.showTeamNotification(myTeamColor.name, myTeamColor);
      }
    }

    this.input.requestPointerLock();
    this.phase = GamePhase.PLAYING;
  }

  _buildColorMap() {
    this._colorMap = { player: '#00ccff' };
    for (const bot of this.bots) {
      if (this.teamManager.active) {
        const tc = this.teamManager.getTeamColor(bot.id);
        this._colorMap[bot.id] = tc ? tc.css : '#ff5555';
      } else {
        this._colorMap[bot.id] = '#' + bot.color.toString(16).padStart(6, '0');
      }
    }
  }

  _weightedRandomDifficulty() {
    const w = Config.quickMatch.difficultyWeights;
    const total = w.rookie + w.casual + w.skilled + w.elite;
    let r = Math.random() * total;
    if ((r -= w.rookie) < 0)  return 'rookie';
    if ((r -= w.casual) < 0)  return 'casual';
    if ((r -= w.skilled) < 0) return 'skilled';
    return 'elite';
  }

  // ═══════════════════════════════════════════
  // MATCH LIFECYCLE
  // ═══════════════════════════════════════════

  _pause() {
    if (this.phase !== GamePhase.PLAYING) return;
    this.phase = GamePhase.PAUSED;
    this.ui.showPause();
  }

  _resume() {
    if (this.phase !== GamePhase.PAUSED) return;
    this.phase = GamePhase.PLAYING;
    this.ui.hidePause();
    this.input.requestPointerLock();
  }

  _restart() {
    this._disposeBots();
    this.particles.dispose();
    this.playerWeapon.dispose();
    this.weaponModel.hide();
    if (this._matchConfig) this._launchMatch(this._matchConfig);
  }

  _quitToMenu() {
    this._disposeBots();
    this.particles.dispose();
    this.playerWeapon.dispose();
    this.weaponModel.hide();
    this.phase = GamePhase.MENU;
    this.gameMode = null;
    document.exitPointerLock();
    // Auto-save to account
    this._saveProfileToAccount();
    this._showMenuWithProfile();
  }

  _endMatch() {
    this.phase = GamePhase.ENDED;
    this.audio.playMatchEnd();
    document.exitPointerLock();
    this.weaponModel.hide();

    const leaderboard = this.scoring.getLeaderboard(this._nameMap);
    const playerEntry = leaderboard.find((e) => e.id === 'player');
    const pStats = this.scoring.getStats('player') || {};

    const topScore = leaderboard[0]?.score || 0;
    const playerWon = leaderboard[0]?.id === 'player';
    const draw = leaderboard.filter((e) => e.score === topScore).length > 1 &&
                 playerEntry && playerEntry.score === topScore;

    const teamScores = this.teamManager.active ? this.teamManager.getTeamScores(this.scoring) : null;

    const accuracy = this.player.shotsFired > 0
      ? Math.round((this.player.shotsHit / this.player.shotsFired) * 100) : 0;

    const position = leaderboard.findIndex(e => e.id === 'player') + 1;
    const playTimeSeconds = Math.floor((Date.now() - (this._matchStartTime || Date.now())) / 1000);

    const matchData = {
      score: playerEntry?.score || 0,
      kills: pStats.kills || 0,
      deaths: pStats.deaths || 0,
      headshots: pStats.headshots || 0,
      shotsFired: this.player.shotsFired || 0,
      shotsHit: this.player.shotsHit || 0,
      accuracy,
      won: playerWon,
      position,
      zones: {
        head: pStats.zones?.head || 0,
        torso: pStats.zones?.torso || 0,
        back: pStats.zones?.back || 0,
        shoulders: pStats.zones?.shoulders || 0,
        legs: pStats.zones?.legs || 0,
      },
      isTeamMode: this.teamManager.active,
      mode: this.gameMode,
      playTime: playTimeSeconds,
      botCount: this.bots.length,
    };

    const rewards = this.progressionManager.processMatchEnd(matchData);

    // Auto-save to account
    this._saveProfileToAccount();

    this._lastEndScreenData = {
      leaderboard,
      playerWon,
      draw,
      teamScores,
      isTeamMode: this.teamManager.active,
      playerHits: pStats.shotsHit || 0,
      accuracy,
      headshots: pStats.headshots || 0,
      deaths: pStats.deaths || 0,
      bestHit: pStats.bestZone ? Config.hitZones[pStats.bestZone]?.label : '-',
      mode: this.gameMode,
      colorMap: this._colorMap,
    };

    this.ui.showProgressionScreen(rewards, this.profileManager);
  }

  _disposeBots() {
    for (const bot of this.bots) bot.dispose();
    this.bots = [];
    for (const w of this.botWeapons) w.dispose();
    this.botWeapons = [];
  }

  // ═══════════════════════════════════════════
  // GAME LOOP
  // ═══════════════════════════════════════════

  _loop() {
    requestAnimationFrame(this._bound_loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.phase === GamePhase.PLAYING) this._update(dt);

    this.particles.update(dt);
    this.playerWeapon.update(dt);
    for (const w of this.botWeapons) w.update(dt);
    this.ui.update(dt);

    // Render main scene
    this.renderer.render(this.scene, this.camera);

    // Render weapon overlay on top
    if (this.phase === GamePhase.PLAYING || this.phase === GamePhase.PAUSED) {
      this.weaponModel.render(this.renderer);
    }

    this.input.endFrame();
  }

  _update(dt) {
    this.match.update(dt);
    this.ui.updateTimer(this.match.getFormattedTime());
    const t = this.match.getTimeRemaining();
    if (t <= 10 && t > 0 && Math.ceil(t) !== Math.ceil(t + dt)) this.audio.playCountdown();

    this.player.update(dt, this.arena.getWallBoxes());

    this.targeting.decayThreats(dt);
    this.targeting.updateLocks(dt);

    const participants = this._getParticipants();

    const isTrainingPassive = this._matchConfig?.passiveBots;
    for (const bot of this.bots) {
      if (isTrainingPassive) {
        bot.update(dt, null);
      } else {
        const target = this.targeting.getBestTarget(
          bot, participants, this.teamManager.active ? this.teamManager : null,
          this.arena.getCollisionWalls()
        );
        bot.update(dt, target);
      }
    }

    this.respawn.update(dt);

    this._handlePlayerShooting(participants);

    for (let i = 0; i < this.bots.length; i++) {
      this._handleBotShooting(this.bots[i], this.botWeapons[i], participants);
    }

    // Update weapon model
    const hSpeed = Math.sqrt(
      this.player.velocity.x * this.player.velocity.x +
      this.player.velocity.z * this.player.velocity.z
    );
    const isMoving = hSpeed > 0.5;
    this.weaponModel.setAiming(this.player.isAiming);
    this.weaponModel.setSprinting(this.player.isSprinting);
    this.weaponModel.update(dt, this.player.velocity, isMoving, this.player.onGround);

    this._updateHUD();
  }

  _getParticipants() {
    const list = [];
    list.push({
      id: 'player',
      position: this.player.position,
      state: this.player.state,
      score: this.scoring.getScore('player'),
      model: null,
      isHuman: true,
    });
    for (const bot of this.bots) {
      list.push({
        id: bot.id,
        position: bot.position,
        state: bot.state,
        score: this.scoring.getScore(bot.id),
        model: bot.model,
        entity: bot,
        isHuman: false,
      });
    }
    return list;
  }

  // ═══════════════════════════════════════════
  // SHOOTING — Player
  // ═══════════════════════════════════════════

  _handlePlayerShooting() {
    if (!this.player.isActive() || this.player.isDisabled()) return;
    if (!this.input.isFireDown() || !this.playerWeapon.canFire()) return;

    this.audio.resume();
    this.player.shotsFired++;

    // Fire weapon model recoil
    this.weaponModel.fire();

    const targets = [];
    for (const bot of this.bots) {
      if (!bot.isActive() || bot.isInvulnerable()) continue;
      if (this.teamManager.active && this.teamManager.isAlly('player', bot.id)) continue;
      targets.push({ id: bot.id, model: bot.model, entity: bot });
    }

    const hitResult = this.playerWeapon.fire(
      this.player.getEyePosition(),
      this.player.getDirection(),
      targets,
      this.arena.getCollisionWalls(),
      this._appliedLaserColor || Config.weapon.laserColor,
      true
    );

    if (hitResult && hitResult.target) {
      const bot = hitResult.target.entity;
      const wasHit = bot.onHit(hitResult.zone);
      if (wasHit) {
        this.player.shotsHit++;
        this.scoring.addScore('player', bot.id, hitResult.zone, hitResult.points);
        this.ui.showHitMarker(hitResult.label, hitResult.points, hitResult.color);
        this.ui.addKillFeed('You', bot.botName, hitResult.label, true, '#00ccff', this._colorMap[bot.id]);
        this.targeting.registerThreat(bot.id, 'player', 10);

        if (hitResult.zone === 'head') this.audio.playHeadshot();
        else this.audio.playHitConfirm();

        this._respawnEntity(bot, 'enemy');
      }
    }
  }

  // ═══════════════════════════════════════════
  // SHOOTING — Bot
  // ═══════════════════════════════════════════

  _handleBotShooting(bot, weapon, participants) {
    if (!bot.wantsToFire || !bot.isActive()) return;

    const origin = bot.getEyePosition();
    const dir = bot.getAimDirection();
    const laserColor = bot.laserColor;

    weapon.fire(origin, dir, [], this.arena.getCollisionWalls(), laserColor, false);

    const targetId = bot.currentTargetId;
    if (!targetId) return;

    if (targetId === 'player') {
      this._checkBotHitsPlayer(bot, origin, dir);
    } else {
      const targetBot = this.bots.find((b) => b.id === targetId);
      if (targetBot) this._checkBotHitsBot(bot, targetBot, origin, dir);
    }
  }

  _checkBotHitsPlayer(bot, origin, dir) {
    if (!this.player.isActive() || this.player.isInvulnerable()) return;
    if (this._matchConfig?.playerInvincible) return;
    if (this.teamManager.active && this.teamManager.isAlly(bot.id, 'player')) return;

    const playerCenter = new THREE.Vector3(
      this.player.position.x,
      this.player.position.y + Config.player.eyeHeight * 0.75,
      this.player.position.z
    );
    const toPlayer = new THREE.Vector3().subVectors(playerCenter, origin);
    const dist = toPlayer.length();
    toPlayer.normalize();
    const dot = dir.dot(toPlayer);

    const distFactor = Math.max(0, 1 - dist / Config.weapon.laserRange);
    const hitThreshold = bot.diff.hitThreshold + (1 - distFactor) * 0.025;
    const randomMiss = Math.random() < bot.diff.missChance;

    if (dot > hitThreshold && dist < Config.weapon.laserRange && !randomMiss) {
      const zone = this._randomHitZone();
      const zoneConfig = Config.hitZones[zone];

      this.player.setState(PlayerState.DISABLED);
      this.player.deaths++;
      this.player.applyDamageShake();
      bot.kills++;
      this.scoring.addScore(bot.id, 'player', zone, zoneConfig.points);
      this.ui.showDamageIndicator(zoneConfig.label);
      this.ui.addKillFeed(bot.botName, 'You', zoneConfig.label, false, this._colorMap[bot.id], '#00ccff');
      this.audio.playDamage();
      this.targeting.registerThreat('player', bot.id, 10);

      this._respawnEntity(this.player, 'player');
    }
  }

  _checkBotHitsBot(shooter, target, origin, dir) {
    if (!target.isActive() || target.isInvulnerable()) return;
    if (this.teamManager.active && this.teamManager.isAlly(shooter.id, target.id)) return;

    const targetCenter = new THREE.Vector3(
      target.position.x,
      target.position.y + Config.player.eyeHeight * 0.75,
      target.position.z
    );
    const toTarget = new THREE.Vector3().subVectors(targetCenter, origin);
    const dist = toTarget.length();
    toTarget.normalize();
    const dot = dir.dot(toTarget);

    const distFactor = Math.max(0, 1 - dist / Config.weapon.laserRange);
    const hitThreshold = shooter.diff.hitThreshold + (1 - distFactor) * 0.025;
    const randomMiss = Math.random() < shooter.diff.missChance;

    if (dot > hitThreshold && dist < Config.weapon.laserRange && !randomMiss) {
      const zone = this._randomHitZone();
      const zoneConfig = Config.hitZones[zone];

      const wasHit = target.onHit(zone);
      if (wasHit) {
        shooter.kills++;
        shooter.shotsHit++;
        this.scoring.addScore(shooter.id, target.id, zone, zoneConfig.points);
        this.targeting.registerThreat(target.id, shooter.id, 10);

        this.ui.addKillFeed(
          shooter.botName, target.botName, zoneConfig.label, false,
          this._colorMap[shooter.id], this._colorMap[target.id]
        );

        this._respawnEntity(target, 'enemy');
      }
    }
  }

  _randomHitZone() {
    const r = Math.random();
    if (r < 0.35) return 'torso';
    if (r < 0.55) return 'shoulders';
    if (r < 0.70) return 'legs';
    if (r < 0.85) return 'back';
    return 'head';
  }

  // ═══════════════════════════════════════════
  // RESPAWN
  // ═══════════════════════════════════════════

  _respawnEntity(entity, team) {
    this.respawn.startRespawn(entity, (phase) => {
      if (phase === 'respawn') {
        const sp = this.respawn.getSpawnPoint(team);
        entity.spawn(sp);
        entity.setState(PlayerState.INVULNERABLE);
        this.particles.spawnRespawnEffect(entity.position);
        this.audio.playRespawn();
      } else if (phase === 'active') {
        entity.setState(PlayerState.ACTIVE);
      }
    });
  }

  // ═══════════════════════════════════════════
  // PROGRESSION HELPERS
  // ═══════════════════════════════════════════

  _applyWeaponSkin() {
    const skin = this.weaponSkinManager.getEquippedSkinData();
    if (skin && this.weaponModel) {
      this.weaponModel.applySkin(skin);
    }
  }

  _handleShopBuy(itemId) {
    const result = this.shopManager.buyItem(itemId);
    if (result.success) {
      this.ui.showShopScreen(this.shopManager);
      this.ui.updateMenuProfile(this.profileManager);
      this._saveProfileToAccount();
    }
    return result;
  }

  _handleShopEquip(itemId) {
    this.shopManager.equipItem(itemId);
    this.ui.showShopScreen(this.shopManager);
    this._saveProfileToAccount();
  }

  _handleClaimMission(data) {
    const reward = this.missionManager.claimMission(data.type, data.index);
    if (reward) {
      this.profileManager.addXP(reward.xp);
      this.profileManager.addCredits(reward.credits);
      this.ui.showMissionsScreen(this.missionManager);
      this.ui.updateMenuProfile(this.profileManager);
      this._saveProfileToAccount();
    }
  }

  _showEndScreenFromProgression() {
    if (this._lastEndScreenData) {
      this.ui.showEndScreen(this._lastEndScreenData);
    }
  }

  // ═══════════════════════════════════════════
  // TEAMMATE INDICATORS
  // ═══════════════════════════════════════════

  _updateTeammateIndicators() {
    if (!this.teamManager.active) {
      this.ui.clearTeammateIndicators();
      return;
    }

    const indicators = [];
    for (const bot of this.bots) {
      if (!this.teamManager.isAlly('player', bot.id)) continue;
      if (!bot.isActive()) continue;

      const worldPos = new THREE.Vector3(bot.position.x, bot.position.y + 2.5, bot.position.z);
      const screenPos = worldPos.clone().project(this.camera);

      if (screenPos.z > 1) continue;

      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

      if (x < -50 || x > window.innerWidth + 50 || y < -50 || y > window.innerHeight + 50) continue;

      const tc = this.teamManager.getTeamColor(bot.id);
      indicators.push({
        name: bot.botName,
        x, y,
        color: tc?.css || '#00ccff',
        isDisabled: bot.isDisabled(),
      });
    }

    this.ui.updateTeammateIndicators(indicators);
  }

  // ═══════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════

  _updateHUD() {
    const playerScore = this.scoring.getScore('player');
    const botScores = this.bots.map((b) => this.scoring.getScore(b.id));
    const teamScores = this.teamManager.active ? this.teamManager.getTeamScores(this.scoring) : null;
    this.ui.updateScores(playerScore, botScores, teamScores);
    this.ui.updateCooldown(this.playerWeapon.getCooldownProgress());
    this.ui.updatePlayerState(this.player.state);
    this.ui.setSprinting(this.player.isSprinting);

    if (this.player.isDisabled()) {
      const entry = this.respawn.entries.find((e) => e.entity === this.player);
      if (entry) this.ui.updateDisabledTimer(entry.timer);
    }

    this.ui.setAiming(this.player.isAiming);
    this.ui.showPointerPrompt(!this.input.pointerLocked && this.phase === GamePhase.PLAYING);

    this._updateTeammateIndicators();
  }

  // ═══════════════════════════════════════════
  // RESIZE
  // ═══════════════════════════════════════════

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.weaponModel.onResize();
  }
}

window._game = new Game();
