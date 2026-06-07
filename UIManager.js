import { Config } from './Config.js';

export class UIManager {
  constructor(settings) {
    this.settings = settings;
    this.container = document.getElementById('ui');
    this._hitMarkerTimer = 0;
    this._damageTimer = 0;
    this._fpsFrames = 0;
    this._fpsTime = 0;
    this._fpsValue = 0;
    this._callbacks = {};
    this._teamNotifTimer = 0;
    this._shopCategory = 'laser';
    this._settingsTab = 'gameplay';
    this._rebindTarget = null;
    this._build();
    this._bindEvents();
    this._applySettings();
  }

  _build() {
    this.container.innerHTML = `
      <!-- ══ HUD ══ -->
      <div id="hud" class="hidden">
        <div id="crosshair">
          <div class="ch-line ch-top"></div>
          <div class="ch-line ch-bottom"></div>
          <div class="ch-line ch-left"></div>
          <div class="ch-line ch-right"></div>
          <div class="ch-dot"></div>
        </div>
        <div id="hud-top">
          <div id="timer">3:00</div>
          <div id="hud-scores"></div>
        </div>
        <div id="hud-bottom">
          <div id="sprint-indicator" class="hidden">SPRINT</div>
          <div id="player-state">ACTIVE</div>
          <div id="cooldown-bar"><div id="cooldown-fill"></div></div>
        </div>
        <div id="hit-marker"></div>
        <div id="damage-overlay"></div>
        <div id="kill-feed"></div>
        <div id="fps-counter" class="hidden">0 FPS</div>
        <div id="disabled-overlay" class="hidden">
          <div class="disabled-text">DISABLED</div>
          <div class="disabled-timer" id="disabled-timer">3</div>
        </div>
        <div id="invulnerable-indicator" class="hidden">INVULNERABLE</div>
        <div id="pointer-prompt" class="hidden">Click to lock cursor</div>
        <div id="team-notification" class="hidden"></div>
        <div id="teammate-indicators"></div>
      </div>

      <!-- ══ WELCOME / LOGIN SCREEN ══ -->
      <div id="welcome-screen" class="hidden">
        <div class="welcome-content">
          <h1 class="game-title">LASER<br>ARENA</h1>
          <p class="subtitle">FPS LASER GAME</p>

          <div id="welcome-choice">
            <p class="welcome-desc">Bienvenue ! Crée un compte pour sauvegarder ta progression,<br>ou joue en tant qu'invité.</p>
            <div class="welcome-buttons">
              <button class="menu-btn" id="btn-show-register">CREER UN COMPTE</button>
              <button class="menu-btn" id="btn-show-login">SE CONNECTER</button>
              <button class="menu-btn secondary" id="btn-guest">JOUER EN INVITE</button>
            </div>
          </div>

          <div id="register-form" class="hidden">
            <h3 class="form-title">CREER UN COMPTE</h3>
            <div class="form-field">
              <label>Pseudo</label>
              <input type="text" id="reg-username" maxlength="20" placeholder="Ton pseudo...">
            </div>
            <div class="form-field">
              <label>Mot de passe</label>
              <input type="password" id="reg-password" maxlength="32" placeholder="Min. 4 caractères">
            </div>
            <div id="reg-error" class="form-error hidden"></div>
            <div class="form-buttons">
              <button class="menu-btn" id="btn-register">CREER</button>
              <button class="menu-btn secondary" id="btn-back-register">RETOUR</button>
            </div>
          </div>

          <div id="login-form" class="hidden">
            <h3 class="form-title">SE CONNECTER</h3>
            <div class="form-field">
              <label>Pseudo</label>
              <input type="text" id="login-username" maxlength="20" placeholder="Ton pseudo...">
            </div>
            <div class="form-field">
              <label>Mot de passe</label>
              <input type="password" id="login-password" maxlength="32" placeholder="Mot de passe">
            </div>
            <div id="login-error" class="form-error hidden"></div>
            <div class="form-buttons">
              <button class="menu-btn" id="btn-login">CONNEXION</button>
              <button class="menu-btn secondary" id="btn-back-login">RETOUR</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ MAIN MENU ══ -->
      <div id="menu-screen" class="hidden">
        <div class="menu-layout">
          <!-- Profile card top-left -->
          <div id="menu-profile-card" class="hidden">
            <div class="mpc-rank" id="mpc-rank"></div>
            <div class="mpc-info">
              <div class="mpc-name" id="mpc-name">Player</div>
              <div class="mpc-level" id="mpc-level">Lv.1</div>
              <div class="mpc-xpbar"><div class="mpc-xpfill" id="mpc-xpfill"></div></div>
            </div>
            <div class="mpc-credits" id="mpc-credits">0 CR</div>
            <button class="mpc-logout-btn" id="btn-logout" title="Déconnexion">✕</button>
          </div>

          <!-- Center content -->
          <div class="menu-center">
            <h1 class="game-title title-sm">LASER<br>ARENA</h1>
            <p class="subtitle">FPS LASER GAME</p>

            <div class="mode-grid">
              <button class="mode-card" id="btn-quick">
                <span class="mode-icon">⚡</span>
                <span class="mode-name">QUICK MATCH</span>
                <span class="mode-desc">Partie rapide</span>
              </button>
              <button class="mode-card" id="btn-ffa">
                <span class="mode-icon">🎯</span>
                <span class="mode-name">FREE FOR ALL</span>
                <span class="mode-desc">Chacun pour soi</span>
              </button>
              <button class="mode-card" id="btn-team">
                <span class="mode-icon">👥</span>
                <span class="mode-name">TEAM BATTLE</span>
                <span class="mode-desc">Combat en équipe</span>
              </button>
              <button class="mode-card mode-card-alt" id="btn-training">
                <span class="mode-icon">🏋️</span>
                <span class="mode-name">TRAINING</span>
                <span class="mode-desc">Entraînement</span>
              </button>
            </div>
          </div>

          <!-- Bottom nav bar -->
          <div class="menu-bottom-bar">
            <div class="bottom-nav-left">
              <button class="nav-pill" id="btn-nav-profile">PROFILE</button>
              <button class="nav-pill" id="btn-nav-missions">MISSIONS<span class="nav-badge hidden" id="mission-badge">!</span></button>
              <button class="nav-pill" id="btn-nav-achievements">SUCCES</button>
              <button class="nav-pill" id="btn-nav-shop">SHOP</button>
              <button class="nav-pill" id="btn-nav-customize">CUSTOMIZE</button>
            </div>
            <div class="bottom-nav-right">
              <button class="nav-pill nav-pill-dim" id="btn-settings-menu">SETTINGS</button>
              <button class="nav-pill nav-pill-dim" id="btn-controls">CONTROLS</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ FFA CONFIG ══ -->
      <div id="ffa-screen" class="hidden">
        <div class="panel-content">
          <h2>FREE FOR ALL</h2>
          <div class="option-group">
            <label>BOTS</label>
            <div class="option-row" id="opt-ffa-bots">
              <button class="opt-btn" data-val="2">2</button>
              <button class="opt-btn" data-val="3">3</button>
              <button class="opt-btn active" data-val="5">5</button>
              <button class="opt-btn" data-val="8">8</button>
            </div>
          </div>
          <div class="option-group">
            <label>DURATION</label>
            <div class="option-row" id="opt-ffa-dur">
              <button class="opt-btn" data-val="120">2 MIN</button>
              <button class="opt-btn active" data-val="180">3 MIN</button>
              <button class="opt-btn" data-val="300">5 MIN</button>
            </div>
          </div>
          <div class="option-group">
            <label class="cb-label"><input type="checkbox" id="ffa-mixed" checked> Mixed difficulties</label>
          </div>
          <div class="panel-buttons">
            <button class="menu-btn" id="btn-start-ffa">START</button>
            <button class="menu-btn secondary" id="btn-back-ffa">BACK</button>
          </div>
        </div>
      </div>

      <!-- ══ TEAM CONFIG ══ -->
      <div id="team-screen" class="hidden">
        <div class="panel-content">
          <h2>TEAM BATTLE</h2>
          <div class="option-group">
            <label>BOTS</label>
            <div class="option-row" id="opt-team-bots">
              <button class="opt-btn" data-val="3">3</button>
              <button class="opt-btn active" data-val="5">5</button>
              <button class="opt-btn" data-val="7">7</button>
              <button class="opt-btn" data-val="9">9</button>
            </div>
          </div>
          <div class="option-group">
            <label>TEAMS</label>
            <div class="option-row" id="opt-team-count">
              <button class="opt-btn active" data-val="2">2</button>
              <button class="opt-btn" data-val="3">3</button>
              <button class="opt-btn" data-val="4">4</button>
            </div>
          </div>
          <div class="option-group">
            <label>DURATION</label>
            <div class="option-row" id="opt-team-dur">
              <button class="opt-btn" data-val="120">2 MIN</button>
              <button class="opt-btn active" data-val="180">3 MIN</button>
              <button class="opt-btn" data-val="300">5 MIN</button>
            </div>
          </div>
          <div class="panel-buttons">
            <button class="menu-btn" id="btn-start-team">START</button>
            <button class="menu-btn secondary" id="btn-back-team">BACK</button>
          </div>
        </div>
      </div>

      <!-- ══ TRAINING CONFIG ══ -->
      <div id="training-screen" class="hidden">
        <div class="panel-content">
          <h2>TRAINING</h2>
          <div class="option-group">
            <label>BOTS</label>
            <div class="option-row" id="opt-train-bots">
              <button class="opt-btn active" data-val="1">1</button>
              <button class="opt-btn" data-val="2">2</button>
              <button class="opt-btn" data-val="3">3</button>
              <button class="opt-btn" data-val="5">5</button>
            </div>
          </div>
          <div class="option-group">
            <label>DIFFICULTY</label>
            <div class="option-row" id="opt-train-diff">
              <button class="opt-btn active" data-val="rookie">ROOKIE</button>
              <button class="opt-btn" data-val="casual">CASUAL</button>
              <button class="opt-btn" data-val="skilled">SKILLED</button>
              <button class="opt-btn" data-val="elite">ELITE</button>
            </div>
          </div>
          <div class="option-group">
            <label class="cb-label"><input type="checkbox" id="train-passive"> Passive bots (no AI)</label>
          </div>
          <div class="option-group">
            <label class="cb-label"><input type="checkbox" id="train-invincible"> Player invincible</label>
          </div>
          <div class="panel-buttons">
            <button class="menu-btn" id="btn-start-train">START</button>
            <button class="menu-btn secondary" id="btn-back-train">BACK</button>
          </div>
        </div>
      </div>

      <!-- ══ SETTINGS (tabbed) ══ -->
      <div id="settings-screen" class="hidden">
        <div class="panel-content panel-wide">
          <h2>SETTINGS</h2>
          <div class="settings-tabs" id="settings-tabs">
            <button class="stab active" data-tab="gameplay">GAMEPLAY</button>
            <button class="stab" data-tab="controls">CONTROLS</button>
            <button class="stab" data-tab="graphics">GRAPHICS</button>
            <button class="stab" data-tab="audio">AUDIO</button>
          </div>

          <!-- GAMEPLAY TAB -->
          <div class="settings-tab-content" id="stab-gameplay">
            <div class="setting-row">
              <label>Sensitivity</label>
              <input type="range" id="set-sensitivity" min="0.0005" max="0.005" step="0.0001">
              <span id="val-sensitivity">0.002</span>
            </div>
            <div class="setting-row">
              <label>Aim Sensitivity</label>
              <input type="range" id="set-aimsens" min="0.2" max="1.0" step="0.05">
              <span id="val-aimsens">0.60</span>
            </div>
            <div class="setting-row">
              <label>FOV</label>
              <input type="range" id="set-fov" min="60" max="120" step="1">
              <span id="val-fov">85</span>
            </div>
            <div class="setting-row">
              <label>Aim FOV</label>
              <input type="range" id="set-aimfov" min="30" max="80" step="1">
              <span id="val-aimfov">55</span>
            </div>
            <div class="setting-row"><label>Show FPS</label><input type="checkbox" id="set-fps"></div>
            <div class="setting-row"><label>Head Bob</label><input type="checkbox" id="set-headbob" checked></div>
            <div class="setting-row"><label>Screen Shake</label><input type="checkbox" id="set-shake" checked></div>
            <div class="setting-row"><label>Invert Y</label><input type="checkbox" id="set-inverty"></div>
            <div class="setting-row"><label>Show Weapon</label><input type="checkbox" id="set-showweapon" checked></div>
          </div>

          <!-- CONTROLS TAB -->
          <div class="settings-tab-content hidden" id="stab-controls">
            <p class="tab-hint">Clique sur une touche pour la changer</p>
            <div id="keybind-list"></div>
          </div>

          <!-- GRAPHICS TAB -->
          <div class="settings-tab-content hidden" id="stab-graphics">
            <div class="setting-row">
              <label>Render Scale</label>
              <div class="option-row compact" id="opt-renderscale">
                <button class="opt-btn" data-val="0.5">0.5x</button>
                <button class="opt-btn" data-val="0.75">0.75x</button>
                <button class="opt-btn active" data-val="1">1x</button>
                <button class="opt-btn" data-val="1.5">1.5x</button>
              </div>
            </div>
            <div class="setting-row"><label>Anti-Aliasing</label><input type="checkbox" id="set-aa"></div>
            <div class="setting-row">
              <label>Particle Quality</label>
              <div class="option-row compact" id="opt-particles">
                <button class="opt-btn" data-val="low">LOW</button>
                <button class="opt-btn" data-val="medium">MED</button>
                <button class="opt-btn active" data-val="high">HIGH</button>
              </div>
            </div>
            <div class="setting-row">
              <label>Draw Distance</label>
              <input type="range" id="set-drawdist" min="80" max="300" step="10">
              <span id="val-drawdist">200</span>
            </div>
            <div class="setting-row"><label>Shadows</label><input type="checkbox" id="set-shadows"></div>
            <div class="setting-row"><label>Motion Blur</label><input type="checkbox" id="set-mblur"></div>
          </div>

          <!-- AUDIO TAB -->
          <div class="settings-tab-content hidden" id="stab-audio">
            <div class="setting-row">
              <label>Master Volume</label>
              <input type="range" id="set-volume" min="0" max="1" step="0.05">
              <span id="val-volume">70%</span>
            </div>
          </div>

          <div class="panel-buttons">
            <button class="menu-btn secondary" id="btn-reset-settings">RESET</button>
            <button class="menu-btn" id="btn-back-settings">BACK</button>
          </div>
        </div>
      </div>

      <!-- ══ CONTROLS INFO ══ -->
      <div id="controls-screen" class="hidden">
        <div class="panel-content">
          <h2>CONTROLS</h2>
          <div class="controls-grid" id="controls-display"></div>
          <div class="panel-buttons">
            <button class="menu-btn" id="btn-back-controls">BACK</button>
          </div>
        </div>
      </div>

      <!-- ══ PAUSE ══ -->
      <div id="pause-screen" class="hidden">
        <div class="panel-content">
          <h2>PAUSED</h2>
          <div class="menu-buttons">
            <button class="menu-btn" id="btn-resume">RESUME</button>
            <button class="menu-btn secondary" id="btn-restart">RESTART</button>
            <button class="menu-btn secondary" id="btn-pause-settings">SETTINGS</button>
            <button class="menu-btn secondary" id="btn-pause-controls">CONTROLS</button>
            <button class="menu-btn secondary" id="btn-quit">QUIT TO MENU</button>
          </div>
        </div>
      </div>

      <!-- ══ END SCREEN ══ -->
      <div id="end-screen" class="hidden">
        <div class="panel-content">
          <h1 id="end-title">MATCH OVER</h1>
          <div id="end-team-result"></div>
          <div id="end-leaderboard"></div>
          <div id="end-stats"></div>
          <div class="panel-buttons">
            <button class="menu-btn" id="btn-play-again">PLAY AGAIN</button>
            <button class="menu-btn secondary" id="btn-end-menu">MAIN MENU</button>
          </div>
        </div>
      </div>

      <!-- ══ PROGRESSION SCREEN ══ -->
      <div id="progression-screen" class="hidden">
        <div class="panel-content prog-panel">
          <h2>MATCH COMPLETE</h2>
          <div id="prog-rank-display"></div>
          <div id="prog-level-section"></div>
          <div id="prog-rewards-list"></div>
          <div id="prog-missions-done"></div>
          <div id="prog-achievements-new"></div>
          <div id="prog-credits-earned"></div>
          <div class="panel-buttons">
            <button class="menu-btn" id="btn-prog-continue">CONTINUE</button>
          </div>
        </div>
      </div>

      <!-- ══ PROFILE SCREEN ══ -->
      <div id="profile-screen" class="hidden">
        <div class="panel-content panel-wide">
          <h2>PROFILE</h2>
          <div id="profile-header"></div>
          <div id="profile-stats-grid"></div>
          <div id="profile-history"></div>
          <div class="panel-buttons">
            <button class="menu-btn secondary" id="btn-back-profile">BACK</button>
          </div>
        </div>
      </div>

      <!-- ══ MISSIONS SCREEN ══ -->
      <div id="missions-screen" class="hidden">
        <div class="panel-content panel-wide">
          <h2>MISSIONS</h2>
          <div id="missions-daily-section"></div>
          <div id="missions-weekly-section"></div>
          <div class="panel-buttons">
            <button class="menu-btn secondary" id="btn-back-missions">BACK</button>
          </div>
        </div>
      </div>

      <!-- ══ ACHIEVEMENTS SCREEN ══ -->
      <div id="achievements-screen" class="hidden">
        <div class="panel-content panel-wide">
          <h2>SUCCES</h2>
          <div id="achievements-count"></div>
          <div id="achievements-grid"></div>
          <div class="panel-buttons">
            <button class="menu-btn secondary" id="btn-back-achievements">BACK</button>
          </div>
        </div>
      </div>

      <!-- ══ SHOP SCREEN ══ -->
      <div id="shop-screen" class="hidden">
        <div class="panel-content panel-wide">
          <h2>SHOP</h2>
          <div id="shop-credits-display"></div>
          <div id="shop-tabs"></div>
          <div id="shop-items-grid"></div>
          <div class="panel-buttons">
            <button class="menu-btn secondary" id="btn-back-shop">BACK</button>
          </div>
        </div>
      </div>

      <!-- ══ CUSTOMIZE SCREEN ══ -->
      <div id="customize-screen" class="hidden">
        <div class="cust-layout">
          <!-- Left: Character preview -->
          <div class="cust-left">
            <div class="cust-credits" id="cust-credits">0 CR</div>
            <div class="cust-char-wrap">
              <div class="cust-char" id="cust-char-preview">
                <!-- CSS character built by JS -->
              </div>
            </div>
            <div class="cust-char-name" id="cust-char-name">TestPlayer</div>
          </div>

          <!-- Right: Equipment & skins -->
          <div class="cust-right">
            <div id="cust-tabs" class="settings-tabs">
              <button class="stab active" data-ctab="equip">EQUIPEMENT</button>
              <button class="stab" data-ctab="skins">ARME</button>
              <button class="stab" data-ctab="market">MARCHE</button>
              <button class="stab" data-ctab="spin">SPIN</button>
            </div>
            <div id="cust-content" class="cust-scroll-content"></div>
          </div>
        </div>
        <div class="cust-bottom-bar">
          <button class="menu-btn secondary" id="btn-back-customize">RETOUR</button>
        </div>
      </div>

      <!-- ══ SLOT DETAIL OVERLAY ══ -->
      <div id="slot-detail-overlay" class="hidden">
        <div class="slot-detail-panel">
          <div class="slot-detail-header">
            <span id="slot-detail-title"></span>
            <button class="slot-detail-close" id="btn-slot-close">&times;</button>
          </div>
          <div id="slot-detail-content" class="cust-scroll-content"></div>
        </div>
      </div>

      <!-- ══ SPIN OVERLAY ══ -->
      <div id="spin-overlay" class="hidden">
        <div class="spin-container">
          <div class="spin-title">SPINNING...</div>
          <div class="spin-reel" id="spin-reel"></div>
          <div class="spin-pointer"></div>
          <div id="spin-result" class="hidden">
            <div id="spin-result-rarity"></div>
            <div id="spin-result-name"></div>
            <div id="spin-result-desc"></div>
            <div id="spin-result-dupe" class="hidden"></div>
            <button class="menu-btn" id="btn-spin-close">OK</button>
          </div>
        </div>
      </div>

      <!-- ══ REBIND OVERLAY ══ -->
      <div id="rebind-overlay" class="hidden">
        <div class="rebind-box">
          <div class="rebind-title">APPUIE SUR UNE TOUCHE</div>
          <div class="rebind-action" id="rebind-action-name"></div>
          <button class="menu-btn secondary rebind-cancel" id="btn-cancel-rebind">ANNULER</button>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    const $ = (id) => document.getElementById(id);
    const emit = (name, data) => { if (this._callbacks[name]) this._callbacks[name](data); };

    // ── Welcome / Auth ──
    $('btn-show-register').addEventListener('click', () => {
      $('welcome-choice').classList.add('hidden');
      $('register-form').classList.remove('hidden');
      $('reg-username').focus();
    });
    $('btn-show-login').addEventListener('click', () => {
      $('welcome-choice').classList.add('hidden');
      $('login-form').classList.remove('hidden');
      $('login-username').focus();
    });
    $('btn-back-register').addEventListener('click', () => {
      $('register-form').classList.add('hidden');
      $('welcome-choice').classList.remove('hidden');
    });
    $('btn-back-login').addEventListener('click', () => {
      $('login-form').classList.add('hidden');
      $('welcome-choice').classList.remove('hidden');
    });
    $('btn-guest').addEventListener('click', () => emit('guestLogin'));
    $('btn-register').addEventListener('click', () => {
      const u = $('reg-username').value.trim();
      const p = $('reg-password').value;
      emit('register', { username: u, password: p });
    });
    $('btn-login').addEventListener('click', () => {
      const u = $('login-username').value.trim();
      const p = $('login-password').value;
      emit('login', { username: u, password: p });
    });
    $('btn-logout').addEventListener('click', () => emit('logout'));

    // Enter key for forms
    $('reg-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-register').click(); });
    $('login-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-login').click(); });

    // ── Menu ──
    $('btn-quick').addEventListener('click', () => emit('quickMatch'));
    $('btn-ffa').addEventListener('click', () => this._showScreen('ffa-screen'));
    $('btn-team').addEventListener('click', () => emit('teamBattle'));
    $('btn-training').addEventListener('click', () => this._showScreen('training-screen'));
    $('btn-settings-menu').addEventListener('click', () => {
      this._settingsReturnTo = 'menu-screen';
      this._showScreen('settings-screen');
    });
    $('btn-controls').addEventListener('click', () => {
      this._controlsReturnTo = 'menu-screen';
      this._updateControlsDisplay();
      this._showScreen('controls-screen');
    });

    // FFA
    this._setupOptionGroup('opt-ffa-bots');
    this._setupOptionGroup('opt-ffa-dur');
    $('btn-start-ffa').addEventListener('click', () => {
      emit('startFFA', {
        botCount: this._getOptionValue('opt-ffa-bots', 5),
        duration: this._getOptionValue('opt-ffa-dur', 180),
        mixedDifficulty: $('ffa-mixed').checked,
        difficulty: 'casual',
      });
    });
    $('btn-back-ffa').addEventListener('click', () => this._showScreen('menu-screen'));

    // Team
    this._setupOptionGroup('opt-team-bots');
    this._setupOptionGroup('opt-team-count');
    this._setupOptionGroup('opt-team-dur');
    $('btn-start-team').addEventListener('click', () => {
      emit('startTeam', {
        botCount: this._getOptionValue('opt-team-bots', 5),
        teamCount: this._getOptionValue('opt-team-count', 2),
        duration: this._getOptionValue('opt-team-dur', 180),
        mixedDifficulty: true,
      });
    });
    $('btn-back-team').addEventListener('click', () => this._showScreen('menu-screen'));

    // Training
    this._setupOptionGroup('opt-train-bots');
    this._setupOptionGroup('opt-train-diff');
    $('btn-start-train').addEventListener('click', () => {
      emit('startTraining', {
        botCount: this._getOptionValue('opt-train-bots', 1),
        difficulty: this._getOptionStr('opt-train-diff', 'rookie'),
        duration: 0,
        passiveBots: $('train-passive').checked,
        playerInvincible: $('train-invincible').checked,
      });
    });
    $('btn-back-train').addEventListener('click', () => this._showScreen('menu-screen'));

    // Settings
    this._setupSettings();
    this._setupSettingsTabs();
    $('btn-back-settings').addEventListener('click', () => this._showScreen(this._settingsReturnTo || 'menu-screen'));
    $('btn-reset-settings').addEventListener('click', () => { this.settings.reset(); this._applySettings(); this._buildKeybindList(); });
    $('btn-back-controls').addEventListener('click', () => this._showScreen(this._controlsReturnTo || 'menu-screen'));

    // Pause
    $('btn-resume').addEventListener('click', () => emit('resume'));
    $('btn-restart').addEventListener('click', () => emit('restart'));
    $('btn-quit').addEventListener('click', () => emit('quit'));
    $('btn-pause-settings').addEventListener('click', () => {
      this._settingsReturnTo = 'pause-screen';
      this._showScreen('settings-screen');
    });
    $('btn-pause-controls').addEventListener('click', () => {
      this._controlsReturnTo = 'pause-screen';
      this._updateControlsDisplay();
      this._showScreen('controls-screen');
    });

    // End
    $('btn-play-again').addEventListener('click', () => emit('playAgain'));
    $('btn-end-menu').addEventListener('click', () => emit('quit'));

    // Progression
    $('btn-prog-continue').addEventListener('click', () => emit('closeProgression'));

    // Nav buttons
    $('btn-nav-profile').addEventListener('click', () => emit('openProfile'));
    $('btn-nav-missions').addEventListener('click', () => emit('openMissions'));
    $('btn-nav-achievements').addEventListener('click', () => emit('openAchievements'));
    $('btn-nav-shop').addEventListener('click', () => emit('openShop'));
    $('btn-nav-customize').addEventListener('click', () => emit('openCustomize'));

    // Back buttons
    $('btn-back-profile').addEventListener('click', () => this._showScreen('menu-screen'));
    $('btn-back-missions').addEventListener('click', () => this._showScreen('menu-screen'));
    $('btn-back-achievements').addEventListener('click', () => this._showScreen('menu-screen'));
    $('btn-back-shop').addEventListener('click', () => this._showScreen('menu-screen'));
    $('btn-back-customize').addEventListener('click', () => this._showScreen('menu-screen'));

    // Customize tabs
    document.querySelectorAll('#cust-tabs .stab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#cust-tabs .stab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._custTab = tab.dataset.ctab;
        this._refreshCustContent();
      });
    });

    // Spin close
    $('btn-spin-close').addEventListener('click', () => {
      $('spin-overlay').classList.add('hidden');
      this._refreshCustContent();
    });

    // Slot detail close
    $('btn-slot-close').addEventListener('click', () => {
      $('slot-detail-overlay').classList.add('hidden');
    });

    // Rebind overlay
    $('btn-cancel-rebind').addEventListener('click', () => this._cancelRebind());

    // Graphics option groups
    this._setupOptionGroup('opt-renderscale', (val) => {
      this.settings.set('renderScale', parseFloat(val));
      emit('graphicsChanged');
    });
    this._setupOptionGroup('opt-particles', (val) => {
      this.settings.set('particleQuality', val);
    });

    // Build keybind list
    this._buildKeybindList();
  }

  // ═══════════════════════════════════════════
  // SETTINGS TABS
  // ═══════════════════════════════════════════

  _setupSettingsTabs() {
    const tabs = document.querySelectorAll('.stab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.querySelectorAll('#settings-screen .settings-tab-content').forEach(c => c.classList.add('hidden'));
        const target = document.getElementById('stab-' + tabName);
        if (target) target.classList.remove('hidden');
        if (tabName === 'controls') this._buildKeybindList();
      });
    });
  }

  // ═══════════════════════════════════════════
  // KEY REBINDING
  // ═══════════════════════════════════════════

  _buildKeybindList() {
    const container = document.getElementById('keybind-list');
    if (!container) return;

    const bindings = [
      { key: 'keyForward', label: 'Avancer', altKey: 'keyForwardAlt' },
      { key: 'keyBackward', label: 'Reculer' },
      { key: 'keyLeft', label: 'Gauche', altKey: 'keyLeftAlt' },
      { key: 'keyRight', label: 'Droite' },
      { key: 'keyJump', label: 'Sauter' },
      { key: 'keySprint', label: 'Sprint' },
      { key: 'keyCrouch', label: 'S\'accroupir', altKey: 'keyCrouchAlt' },
    ];

    let html = '';
    for (const b of bindings) {
      const currentKey = this.settings.get(b.key) || Config.defaults[b.key];
      const displayName = Config.keyDisplayNames[currentKey] || currentKey;
      html += `<div class="keybind-row">
        <span class="keybind-label">${b.label}</span>
        <button class="keybind-btn" data-bind="${b.key}">${displayName}</button>`;

      if (b.altKey) {
        const altKey = this.settings.get(b.altKey) || Config.defaults[b.altKey];
        const altDisplay = altKey ? (Config.keyDisplayNames[altKey] || altKey) : '-';
        html += `<button class="keybind-btn keybind-alt" data-bind="${b.altKey}">${altDisplay}</button>`;
      }

      html += `</div>`;
    }

    // Non-rebindable
    html += `<div class="keybind-row keybind-fixed">
      <span class="keybind-label">Tirer</span><span class="keybind-val">LEFT CLICK</span>
    </div>`;
    html += `<div class="keybind-row keybind-fixed">
      <span class="keybind-label">Viser</span><span class="keybind-val">RIGHT CLICK</span>
    </div>`;
    html += `<div class="keybind-row keybind-fixed">
      <span class="keybind-label">Pause</span><span class="keybind-val">ESC</span>
    </div>`;

    container.innerHTML = html;

    // Bind click events
    container.querySelectorAll('.keybind-btn').forEach(btn => {
      btn.addEventListener('click', () => this._startRebind(btn.dataset.bind, btn));
    });
  }

  _startRebind(settingKey, buttonEl) {
    this._rebindTarget = { settingKey, buttonEl };
    document.getElementById('rebind-overlay').classList.remove('hidden');

    const bindings = {
      keyForward: 'Avancer', keyForwardAlt: 'Avancer (alt)',
      keyBackward: 'Reculer', keyLeft: 'Gauche', keyLeftAlt: 'Gauche (alt)',
      keyRight: 'Droite', keyJump: 'Sauter', keySprint: 'Sprint',
      keyCrouch: 'S\'accroupir', keyCrouchAlt: 'S\'accroupir (alt)',
    };
    document.getElementById('rebind-action-name').textContent = bindings[settingKey] || settingKey;

    this._rebindHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        this._cancelRebind();
        return;
      }
      this.settings.set(settingKey, e.code);
      this._cancelRebind();
      this._buildKeybindList();
    };
    document.addEventListener('keydown', this._rebindHandler, true);
  }

  _cancelRebind() {
    document.getElementById('rebind-overlay').classList.add('hidden');
    if (this._rebindHandler) {
      document.removeEventListener('keydown', this._rebindHandler, true);
      this._rebindHandler = null;
    }
    this._rebindTarget = null;
  }

  // ═══════════════════════════════════════════
  // CONTROLS DISPLAY
  // ═══════════════════════════════════════════

  _updateControlsDisplay() {
    const container = document.getElementById('controls-display');
    if (!container) return;

    const getKey = (k) => {
      const val = this.settings.get(k) || Config.defaults[k];
      return Config.keyDisplayNames[val] || val;
    };

    const getKeyAlt = (k) => {
      const val = this.settings.get(k);
      if (!val) return null;
      return Config.keyDisplayNames[val] || val;
    };

    const fwd = getKey('keyForward');
    const fwdAlt = getKeyAlt('keyForwardAlt');
    const left = getKey('keyLeft');
    const leftAlt = getKeyAlt('keyLeftAlt');

    container.innerHTML = `
      <div><kbd>${fwd}</kbd>${fwdAlt ? `/<kbd>${fwdAlt}</kbd>` : ''} <kbd>${left}</kbd>${leftAlt ? `/<kbd>${leftAlt}</kbd>` : ''} <kbd>${getKey('keyBackward')}</kbd> <kbd>${getKey('keyRight')}</kbd></div><div>Move</div>
      <div><kbd>MOUSE</kbd></div><div>Look</div>
      <div><kbd>LEFT CLICK</kbd></div><div>Fire</div>
      <div><kbd>RIGHT CLICK</kbd></div><div>Aim / Zoom</div>
      <div><kbd>${getKey('keyJump')}</kbd></div><div>Jump</div>
      <div><kbd>${getKey('keySprint')}</kbd></div><div>Sprint</div>
      <div><kbd>${getKey('keyCrouch')}</kbd></div><div>Crouch</div>
      <div><kbd>ESC</kbd></div><div>Pause</div>
    `;
  }

  _setupOptionGroup(groupId, onChange) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.opt-btn');
      if (!btn) return;
      group.querySelectorAll('.opt-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (onChange) onChange(btn.dataset.val);
    });
  }

  _getOptionValue(groupId, fallback) {
    const active = document.querySelector(`#${groupId} .opt-btn.active`);
    return active ? parseInt(active.dataset.val) : fallback;
  }

  _getOptionStr(groupId, fallback) {
    const active = document.querySelector(`#${groupId} .opt-btn.active`);
    return active ? active.dataset.val : fallback;
  }

  _setupSettings() {
    const s = this.settings;
    const bind = (elId, key, transform, display) => {
      const el = document.getElementById(elId);
      if (!el) return;
      if (el.type === 'checkbox') {
        el.checked = s.get(key);
        el.addEventListener('change', () => s.set(key, el.checked));
      } else {
        el.value = s.get(key);
        const valEl = document.getElementById('val-' + key);
        if (valEl) valEl.textContent = display ? display(s.get(key)) : s.get(key);
        el.addEventListener('input', () => {
          const v = transform ? transform(el.value) : parseFloat(el.value);
          s.set(key, v);
          if (valEl) valEl.textContent = display ? display(v) : v;
        });
      }
    };
    bind('set-sensitivity', 'sensitivity', parseFloat, (v) => v.toFixed(4));
    bind('set-aimsens', 'aimSensitivityMultiplier', parseFloat, (v) => v.toFixed(2));
    bind('set-fov', 'fov', (v) => parseInt(v), (v) => v);
    bind('set-aimfov', 'aimFov', (v) => parseInt(v), (v) => v);
    bind('set-volume', 'volume', parseFloat, (v) => Math.round(v * 100) + '%');
    bind('set-fps', 'showFps');
    bind('set-headbob', 'headBob');
    bind('set-shake', 'screenShake');
    bind('set-inverty', 'invertY');
    bind('set-showweapon', 'showWeapon');
    bind('set-aa', 'antiAliasing');
    bind('set-shadows', 'showShadows');
    bind('set-mblur', 'motionBlur');
    bind('set-drawdist', 'drawDistance', (v) => parseInt(v), (v) => v);
  }

  _applySettings() {
    const s = this.settings;
    const setVal = (elId, val) => {
      const el = document.getElementById(elId);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = val; else el.value = val;
    };
    setVal('set-sensitivity', s.get('sensitivity'));
    setVal('set-aimsens', s.get('aimSensitivityMultiplier'));
    setVal('set-fov', s.get('fov'));
    setVal('set-aimfov', s.get('aimFov'));
    setVal('set-volume', s.get('volume'));
    setVal('set-fps', s.get('showFps'));
    setVal('set-headbob', s.get('headBob'));
    setVal('set-shake', s.get('screenShake'));
    setVal('set-inverty', s.get('invertY'));
    setVal('set-showweapon', s.get('showWeapon'));
    setVal('set-aa', s.get('antiAliasing'));
    setVal('set-shadows', s.get('showShadows'));
    setVal('set-mblur', s.get('motionBlur'));
    setVal('set-drawdist', s.get('drawDistance'));

    // Update display values
    const vals = {
      sensitivity: s.get('sensitivity')?.toFixed(4),
      aimsens: s.get('aimSensitivityMultiplier')?.toFixed(2),
      fov: s.get('fov'),
      aimfov: s.get('aimFov'),
      volume: Math.round((s.get('volume') || 0) * 100) + '%',
      drawdist: s.get('drawDistance'),
    };
    for (const [k, v] of Object.entries(vals)) {
      const el = document.getElementById('val-' + k);
      if (el && v !== undefined) el.textContent = v;
    }

    // Sync option groups
    this._syncOptionGroup('opt-renderscale', String(s.get('renderScale') || 1));
    this._syncOptionGroup('opt-particles', s.get('particleQuality') || 'high');
  }

  _syncOptionGroup(groupId, value) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.opt-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === value);
    });
  }

  _showScreen(id) {
    const screens = [
      'welcome-screen', 'menu-screen', 'ffa-screen', 'team-screen', 'training-screen',
      'settings-screen', 'controls-screen', 'pause-screen', 'end-screen',
      'progression-screen', 'profile-screen', 'missions-screen',
      'achievements-screen', 'shop-screen', 'customize-screen',
    ];
    screens.forEach((s) => {
      const el = document.getElementById(s);
      if (el) el.classList.toggle('hidden', s !== id);
    });
  }

  // ═══════════════════════════════════════════
  // PUBLIC API — Core
  // ═══════════════════════════════════════════

  on(event, callback) { this._callbacks[event] = callback; }

  showWelcome() {
    document.getElementById('hud').classList.add('hidden');
    this._showScreen('welcome-screen');
    // Reset forms
    document.getElementById('welcome-choice').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.add('hidden');
  }

  showRegisterError(msg) {
    const el = document.getElementById('reg-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  showLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  showMenu(profileManager, missionManager) {
    document.getElementById('hud').classList.add('hidden');
    this._showScreen('menu-screen');
    if (profileManager) this.updateMenuProfile(profileManager);
    if (missionManager) {
      const badge = document.getElementById('mission-badge');
      if (badge) {
        const unclaimed = missionManager.hasUnclaimedMissions();
        badge.classList.toggle('hidden', !unclaimed);
      }
    }
  }

  updateMenuProfile(pm, displayName) {
    const card = document.getElementById('menu-profile-card');
    if (!card || !pm) return;
    card.classList.remove('hidden');

    const rank = pm.rank;
    document.getElementById('mpc-rank').textContent = `${rank.icon}`;
    document.getElementById('mpc-name').textContent = displayName || pm.name;
    document.getElementById('mpc-level').textContent = `Lv.${pm.level} — ${rank.name}`;
    const fill = document.getElementById('mpc-xpfill');
    if (fill) fill.style.width = `${Math.round(pm.xpProgress * 100)}%`;
    document.getElementById('mpc-credits').textContent = `${pm.credits} CR`;
  }

  showHUD() {
    const screens = [
      'welcome-screen', 'menu-screen', 'ffa-screen', 'team-screen', 'training-screen',
      'settings-screen', 'controls-screen', 'pause-screen', 'end-screen',
      'progression-screen', 'profile-screen', 'missions-screen',
      'achievements-screen', 'shop-screen', 'customize-screen',
    ];
    screens.forEach((s) => { const el = document.getElementById(s); if (el) el.classList.add('hidden'); });
    document.getElementById('hud').classList.remove('hidden');
  }

  showPause() { this._showScreen('pause-screen'); }
  hidePause() { document.getElementById('pause-screen').classList.add('hidden'); }

  // ═══════════════════════════════════════════
  // HUD — Score Header
  // ═══════════════════════════════════════════

  buildScoreHeader(bots, nameMap, teamManager, colorMap) {
    const el = document.getElementById('hud-scores');
    let html = '<span class="score-you">YOU <b id="player-score">0</b></span>';
    if (teamManager && teamManager.active) {
      for (let t = 0; t < teamManager.teamCount; t++) {
        const tc = teamManager.getTeamConfig(t);
        html += `<span class="score-team" style="color:${tc.css}">${tc.name} <b id="team-score-${t}">0</b></span>`;
      }
    } else {
      html += '<span class="score-sep">vs</span>';
      bots.forEach((bot, i) => {
        const name = nameMap[bot.id] || bot.botName;
        const color = colorMap && colorMap[bot.id] ? colorMap[bot.id] : '#ff5555';
        html += `<span class="score-bot-entry" style="color:${color}"><b id="bot-score-${i}">0</b> ${name}</span>`;
      });
    }
    el.innerHTML = html;
  }

  updateScores(playerScore, botScores, teamScores) {
    const ps = document.getElementById('player-score');
    if (ps) ps.textContent = playerScore;
    botScores.forEach((score, i) => {
      const el = document.getElementById('bot-score-' + i);
      if (el) el.textContent = score;
    });
    if (teamScores) {
      for (const ts of teamScores) {
        const el = document.getElementById('team-score-' + ts.teamIndex);
        if (el) el.textContent = ts.score;
      }
    }
  }

  updateTimer(t) { const el = document.getElementById('timer'); if (el) el.textContent = t; }

  updateCooldown(progress) {
    const fill = document.getElementById('cooldown-fill');
    if (!fill) return;
    fill.style.width = `${progress * 100}%`;
    fill.style.backgroundColor = progress >= 1 ? '#00ffcc' : '#ff6600';
  }

  updatePlayerState(state) {
    const el = document.getElementById('player-state');
    if (el) { el.textContent = state.toUpperCase(); el.className = 'state-' + state; }
    const dis = document.getElementById('disabled-overlay');
    const inv = document.getElementById('invulnerable-indicator');
    if (state === 'disabled') { dis.classList.remove('hidden'); inv.classList.add('hidden'); }
    else if (state === 'invulnerable') { dis.classList.add('hidden'); inv.classList.remove('hidden'); }
    else { dis.classList.add('hidden'); inv.classList.add('hidden'); }
  }

  updateDisabledTimer(s) { const el = document.getElementById('disabled-timer'); if (el) el.textContent = Math.ceil(s); }
  setSprinting(v) { const el = document.getElementById('sprint-indicator'); if (el) el.classList.toggle('hidden', !v); }

  showHitMarker(zone, points, color) {
    this._hitMarkerTimer = 0.8;
    const el = document.getElementById('hit-marker');
    el.innerHTML = `<div class="hm-zone" style="color:${color}">${zone}</div><div class="hm-points">+${points}</div>`;
    el.classList.add('active');
    const ch = document.getElementById('crosshair');
    ch.classList.add('hit');
    setTimeout(() => ch.classList.remove('hit'), 200);
  }

  showDamageIndicator() {
    this._damageTimer = 0.5;
    document.getElementById('damage-overlay').classList.add('active');
  }

  addKillFeed(shooterName, targetName, zone, isPlayerKill, shooterColor, targetColor) {
    const feed = document.getElementById('kill-feed');
    const div = document.createElement('div');
    div.className = 'kill-entry' + (isPlayerKill ? ' player-kill' : '');
    const sColor = shooterColor || (isPlayerKill ? '#00ccff' : '#ff5555');
    const tColor = targetColor || '#aaa';
    div.innerHTML = `<span class="kf-shooter" style="color:${sColor}">${shooterName}</span> ▸ <span class="kf-target" style="color:${tColor}">${targetName}</span> <span class="kf-zone">${zone}</span>`;
    feed.appendChild(div);
    while (feed.children.length > 6) feed.removeChild(feed.firstChild);
    setTimeout(() => { div.classList.add('fade-out'); setTimeout(() => div.remove(), 500); }, 4000);
  }

  setAiming(v) { const ch = document.getElementById('crosshair'); if (ch) ch.classList.toggle('aiming', v); }
  showPointerPrompt(show) { const el = document.getElementById('pointer-prompt'); if (el) el.classList.toggle('hidden', !show); }

  // ═══════════════════════════════════════════
  // END SCREEN
  // ═══════════════════════════════════════════

  showEndScreen(results) {
    document.getElementById('hud').classList.add('hidden');
    this._showScreen('end-screen');

    const title = document.getElementById('end-title');
    if (results.playerWon) { title.textContent = 'VICTORY'; title.style.color = '#00ffcc'; }
    else if (results.draw) { title.textContent = 'DRAW'; title.style.color = '#ffcc00'; }
    else { title.textContent = 'DEFEAT'; title.style.color = '#ff3333'; }

    const teamEl = document.getElementById('end-team-result');
    if (results.isTeamMode && results.teamScores) {
      let html = '<div class="team-results">';
      results.teamScores.forEach((ts) => {
        html += `<div class="team-row" style="border-color:${ts.css}"><span style="color:${ts.css}">${ts.name}</span><span class="team-total">${ts.score}</span></div>`;
      });
      html += '</div>';
      teamEl.innerHTML = html;
    } else { teamEl.innerHTML = ''; }

    const lb = document.getElementById('end-leaderboard');
    let lbHtml = '<div class="leaderboard">';
    results.leaderboard.forEach((entry, i) => {
      const cls = entry.id === 'player' ? 'lb-player' : '';
      const nameColor = results.colorMap && results.colorMap[entry.id] ? results.colorMap[entry.id] : (entry.id === 'player' ? '#00ccff' : '#ccc');
      lbHtml += `<div class="lb-row ${cls}"><span class="lb-rank">#${i + 1}</span><span class="lb-name" style="color:${nameColor}">${entry.name}</span><span class="lb-kills">${entry.kills}K</span><span class="lb-deaths">${entry.deaths}D</span><span class="lb-score">${entry.score}</span></div>`;
    });
    lbHtml += '</div>';
    lb.innerHTML = lbHtml;

    document.getElementById('end-stats').innerHTML = `
      <div class="stat">Hits: ${results.playerHits}</div>
      <div class="stat">Accuracy: ${results.accuracy}%</div>
      <div class="stat">Headshots: ${results.headshots}</div>
      <div class="stat">Deaths: ${results.deaths}</div>
      <div class="stat">Best: ${results.bestHit}</div>
    `;
  }

  // ═══════════════════════════════════════════
  // PROGRESSION SCREEN
  // ═══════════════════════════════════════════

  showProgressionScreen(rewards, pm) {
    document.getElementById('hud').classList.add('hidden');
    this._showScreen('progression-screen');

    const rank = pm.rank;
    document.getElementById('prog-rank-display').innerHTML = `
      <div class="prog-rank"><span class="prog-rank-icon">${rank.icon}</span><span class="prog-rank-name">${rank.name}</span></div>
    `;

    const xpPercent = Math.round((rewards.currentXP / rewards.xpToNext) * 100);
    let levelHtml = `
      <div class="prog-level-row">
        <span class="prog-lv">Lv.${rewards.newLevel}</span>
        <div class="prog-xpbar"><div class="prog-xpfill" id="prog-xpfill-anim" style="width:0%"></div></div>
        <span class="prog-xp-text">${rewards.currentXP} / ${rewards.xpToNext}</span>
      </div>
    `;
    if (rewards.levelsGained.length > 0) levelHtml += `<div class="prog-levelup">LEVEL UP! ${rewards.oldLevel} &rarr; ${rewards.newLevel}</div>`;
    if (rewards.rankUp) levelHtml += `<div class="prog-rankup">RANK UP! ${rewards.rankUp.icon} ${rewards.rankUp.name}</div>`;
    document.getElementById('prog-level-section').innerHTML = levelHtml;

    setTimeout(() => {
      const fill = document.getElementById('prog-xpfill-anim');
      if (fill) fill.style.width = xpPercent + '%';
    }, 200);

    let rwHtml = '<div class="prog-rewards">';
    for (const b of rewards.breakdown) {
      rwHtml += `<div class="prog-rw-row"><span class="prog-rw-label">${b.label}</span><span class="prog-rw-xp">+${b.xp} XP</span>${b.credits > 0 ? `<span class="prog-rw-cr">+${b.credits} CR</span>` : '<span class="prog-rw-cr"></span>'}</div>`;
    }
    rwHtml += `<div class="prog-rw-total"><span class="prog-rw-label">TOTAL</span><span class="prog-rw-xp">+${rewards.totalXP} XP</span><span class="prog-rw-cr">+${rewards.totalCredits} CR</span></div></div>`;
    document.getElementById('prog-rewards-list').innerHTML = rwHtml;

    if (rewards.completedMissions.length > 0) {
      let mHtml = '<div class="prog-section-title">MISSIONS COMPLETED</div>';
      for (const m of rewards.completedMissions) mHtml += `<div class="prog-mission-done">${m.name} — +${m.xp} XP, +${m.credits} CR</div>`;
      document.getElementById('prog-missions-done').innerHTML = mHtml;
    } else { document.getElementById('prog-missions-done').innerHTML = ''; }

    if (rewards.newAchievements.length > 0) {
      let aHtml = '<div class="prog-section-title">NEW ACHIEVEMENTS</div>';
      for (const a of rewards.newAchievements) aHtml += `<div class="prog-achievement-new">${a.icon} ${a.name} — ${a.desc}</div>`;
      document.getElementById('prog-achievements-new').innerHTML = aHtml;
    } else { document.getElementById('prog-achievements-new').innerHTML = ''; }

    document.getElementById('prog-credits-earned').innerHTML = `<div class="prog-credits-total">Balance: ${pm.credits} CR</div>`;
  }

  // ═══════════════════════════════════════════
  // PROFILE SCREEN
  // ═══════════════════════════════════════════

  showProfileScreen(pm) {
    this._showScreen('profile-screen');
    const rank = pm.rank;
    const nextRank = pm.nextRank;
    const xpPercent = Math.round(pm.xpProgress * 100);
    const s = pm.stats;
    const kd = s.deaths > 0 ? (s.kills / s.deaths).toFixed(2) : s.kills.toFixed(0);
    const acc = s.shotsFired > 0 ? Math.round((s.shotsHit / s.shotsFired) * 100) : 0;
    const playHours = Math.floor(s.totalPlayTime / 3600);
    const playMins = Math.floor((s.totalPlayTime % 3600) / 60);

    document.getElementById('profile-header').innerHTML = `
      <div class="prof-header">
        <div class="prof-rank-big">${rank.icon}</div>
        <div class="prof-info">
          <div class="prof-name">${pm.name}</div>
          <div class="prof-rank-name">${rank.name}</div>
          <div class="prof-level-row"><span>Lv.${pm.level}</span><div class="prof-xpbar"><div class="prof-xpfill" style="width:${xpPercent}%"></div></div><span class="prof-xp-num">${pm.xp}/${pm.xpToNextLevel}</span></div>
          ${nextRank ? `<div class="prof-next-rank">Next: ${nextRank.icon} ${nextRank.name} (Lv.${nextRank.minLevel})</div>` : ''}
          <div class="prof-credits">${pm.credits} Credits</div>
        </div>
      </div>`;

    document.getElementById('profile-stats-grid').innerHTML = `
      <div class="stats-grid">
        <div class="sg-item"><div class="sg-val">${s.matchesPlayed}</div><div class="sg-label">Matches</div></div>
        <div class="sg-item"><div class="sg-val">${s.wins}</div><div class="sg-label">Wins</div></div>
        <div class="sg-item"><div class="sg-val">${s.kills}</div><div class="sg-label">Kills</div></div>
        <div class="sg-item"><div class="sg-val">${s.deaths}</div><div class="sg-label">Deaths</div></div>
        <div class="sg-item"><div class="sg-val">${kd}</div><div class="sg-label">K/D Ratio</div></div>
        <div class="sg-item"><div class="sg-val">${acc}%</div><div class="sg-label">Accuracy</div></div>
        <div class="sg-item"><div class="sg-val">${s.headshots}</div><div class="sg-label">Headshots</div></div>
        <div class="sg-item"><div class="sg-val">${s.bestScore}</div><div class="sg-label">Best Score</div></div>
        <div class="sg-item"><div class="sg-val">${s.totalScore}</div><div class="sg-label">Total Score</div></div>
        <div class="sg-item"><div class="sg-val">${s.backHits}</div><div class="sg-label">Back Hits</div></div>
        <div class="sg-item"><div class="sg-val">${playHours}h${playMins}m</div><div class="sg-label">Play Time</div></div>
        <div class="sg-item"><div class="sg-val">${pm.totalXp}</div><div class="sg-label">Total XP</div></div>
      </div>`;

    const hist = pm.matchHistory;
    if (hist.length > 0) {
      let hHtml = '<div class="prof-section-title">RECENT MATCHES</div><div class="match-history">';
      for (const m of hist.slice(0, 10)) {
        const won = m.won ? '<span class="mh-win">W</span>' : '<span class="mh-loss">L</span>';
        hHtml += `<div class="mh-row">${won}<span class="mh-score">${m.score}</span><span class="mh-kd">${m.kills}K/${m.deaths}D</span><span class="mh-acc">${m.accuracy}%</span></div>`;
      }
      hHtml += '</div>';
      document.getElementById('profile-history').innerHTML = hHtml;
    } else {
      document.getElementById('profile-history').innerHTML = '<div class="prof-no-data">No matches yet</div>';
    }
  }

  // ═══════════════════════════════════════════
  // MISSIONS SCREEN
  // ═══════════════════════════════════════════

  showMissionsScreen(mm) {
    this._showScreen('missions-screen');
    const emit = (name, data) => { if (this._callbacks[name]) this._callbacks[name](data); };

    let dHtml = '<div class="mission-section-title">DAILY MISSIONS</div>';
    const daily = mm.dailyMissions;
    if (daily.length === 0) { dHtml += '<div class="mission-empty">No missions today</div>'; }
    else {
      for (let i = 0; i < daily.length; i++) {
        const m = daily[i];
        const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
        const status = m.claimed ? 'claimed' : m.completed ? 'completed' : 'active';
        dHtml += `<div class="mission-card mission-${status}"><div class="mission-info"><div class="mission-name">${m.name}</div><div class="mission-desc">${m.desc}</div><div class="mission-progress-row"><div class="mission-bar"><div class="mission-bar-fill" style="width:${pct}%"></div></div><span class="mission-pct">${m.progress}/${m.target}</span></div></div><div class="mission-reward"><div>+${m.xp} XP</div><div>+${m.credits} CR</div>${status === 'completed' ? `<button class="claim-btn" data-type="daily" data-idx="${i}">CLAIM</button>` : ''}${status === 'claimed' ? '<div class="claimed-tag">CLAIMED</div>' : ''}</div></div>`;
      }
    }
    document.getElementById('missions-daily-section').innerHTML = dHtml;

    let wHtml = '<div class="mission-section-title">WEEKLY MISSIONS</div>';
    const weekly = mm.weeklyMissions;
    if (weekly.length === 0) { wHtml += '<div class="mission-empty">No weekly missions</div>'; }
    else {
      for (let i = 0; i < weekly.length; i++) {
        const m = weekly[i];
        const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
        const status = m.claimed ? 'claimed' : m.completed ? 'completed' : 'active';
        wHtml += `<div class="mission-card mission-${status}"><div class="mission-info"><div class="mission-name">${m.name}</div><div class="mission-desc">${m.desc}</div><div class="mission-progress-row"><div class="mission-bar"><div class="mission-bar-fill" style="width:${pct}%"></div></div><span class="mission-pct">${m.progress}/${m.target}</span></div></div><div class="mission-reward"><div>+${m.xp} XP</div><div>+${m.credits} CR</div>${status === 'completed' ? `<button class="claim-btn" data-type="weekly" data-idx="${i}">CLAIM</button>` : ''}${status === 'claimed' ? '<div class="claimed-tag">CLAIMED</div>' : ''}</div></div>`;
      }
    }
    document.getElementById('missions-weekly-section').innerHTML = wHtml;

    document.querySelectorAll('.claim-btn').forEach(btn => {
      btn.addEventListener('click', () => emit('claimMission', { type: btn.dataset.type, index: parseInt(btn.dataset.idx) }));
    });
  }

  // ═══════════════════════════════════════════
  // ACHIEVEMENTS SCREEN
  // ═══════════════════════════════════════════

  showAchievementsScreen(am) {
    this._showScreen('achievements-screen');
    const all = am.getAll();
    const unlocked = am.getUnlockedCount();
    document.getElementById('achievements-count').innerHTML = `<div class="ach-count">${unlocked} / ${all.length} unlocked</div>`;

    let html = '<div class="ach-grid">';
    for (const a of all) {
      const cls = a.unlocked ? 'ach-unlocked' : 'ach-locked';
      html += `<div class="ach-card ${cls}"><div class="ach-icon">${a.unlocked ? a.icon : '?'}</div><div class="ach-details"><div class="ach-name">${a.unlocked ? a.name : '???'}</div><div class="ach-desc">${a.desc}</div><div class="ach-reward">+${a.reward.xp} XP, +${a.reward.credits} CR</div></div></div>`;
    }
    html += '</div>';
    document.getElementById('achievements-grid').innerHTML = html;
  }

  // ═══════════════════════════════════════════
  // SHOP SCREEN
  // ═══════════════════════════════════════════

  showShopScreen(sm) {
    this._showScreen('shop-screen');
    const emit = (name, data) => { if (this._callbacks[name]) this._callbacks[name](data); };

    document.getElementById('shop-credits-display').innerHTML = `<div class="shop-balance">${sm.profile.credits} Credits</div>`;

    const cats = sm.CATEGORIES;
    let tabHtml = '<div class="shop-tab-row">';
    for (const cat of cats) {
      const active = cat.id === this._shopCategory ? 'active' : '';
      tabHtml += `<button class="shop-tab ${active}" data-cat="${cat.id}">${cat.name}</button>`;
    }
    tabHtml += '</div>';
    document.getElementById('shop-tabs').innerHTML = tabHtml;

    const items = sm.getItemsByCategory(this._shopCategory);
    let itemHtml = '<div class="shop-items">';
    for (const item of items) {
      const statusCls = item.equipped ? 'shop-equipped' : item.owned ? 'shop-owned' : 'shop-buyable';
      const preview = this._getItemPreview(item);
      itemHtml += `<div class="shop-item ${statusCls}"><div class="shop-item-preview">${preview}</div><div class="shop-item-info"><div class="shop-item-name">${item.name}</div>${item.equipped ? '<div class="shop-item-status">EQUIPPED</div>' : item.owned ? `<button class="shop-equip-btn" data-id="${item.id}">EQUIP</button>` : `<button class="shop-buy-btn" data-id="${item.id}">${item.price} CR</button>`}</div></div>`;
    }
    itemHtml += '</div>';
    document.getElementById('shop-items-grid').innerHTML = itemHtml;

    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => { this._shopCategory = tab.dataset.cat; this.showShopScreen(sm); });
    });
    document.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => emit('buyItem', btn.dataset.id));
    });
    document.querySelectorAll('.shop-equip-btn').forEach(btn => {
      btn.addEventListener('click', () => emit('equipItem', btn.dataset.id));
    });
  }

  _getItemPreview(item) {
    if (item.css) return `<div class="shop-color-dot" style="background:${item.css};box-shadow:0 0 12px ${item.css}"></div>`;
    if (item.style === 'dot') return '<div class="shop-ch-preview ch-prev-dot"></div>';
    if (item.style === 'circle') return '<div class="shop-ch-preview ch-prev-circle"></div>';
    if (item.style === 'cross') return '<div class="shop-ch-preview ch-prev-cross"></div>';
    if (item.effect) return `<div class="shop-effect-label">${item.name}</div>`;
    return '<div class="shop-ch-preview ch-prev-default">+</div>';
  }

  // ═══════════════════════════════════════════
  // CUSTOMIZE / SKIN SCREEN
  // ═══════════════════════════════════════════

  showCustomizeScreen(wsm, credits, bodyCosm) {
    this._showScreen('customize-screen');
    this._custSkinManager = wsm;
    this._custCredits = credits;
    this._custBodyManager = bodyCosm || this._custBodyManager;
    if (!this._custTab) this._custTab = 'equip';

    // Credits display
    document.getElementById('cust-credits').textContent = credits + ' CR';
    // Player name
    const nameEl = document.getElementById('cust-char-name');
    if (this._custPlayerName) nameEl.textContent = this._custPlayerName;

    // Build character preview
    this._buildCharPreview();
    // Build content tab
    this._refreshCustContent();
  }

  _refreshCustContent() {
    const content = document.getElementById('cust-content');
    content.classList.remove('hidden');
    const emit = (name, data) => { if (this._callbacks[name]) this._callbacks[name](data); };
    const wsm = this._custSkinManager;
    const credits = this._custCredits;
    if (!wsm) return;
    if (this._custTab === 'equip') this._buildEquipTab(content, emit);
    else if (this._custTab === 'skins') this._buildSkinsTab(content, wsm, emit);
    else if (this._custTab === 'market') this._buildMarketTab(content, wsm, credits, emit);
    else if (this._custTab === 'spin') this._buildSpinTab(content, wsm, credits, emit);
    // Update credits
    document.getElementById('cust-credits').textContent = (this._custCredits || 0) + ' CR';
    this._buildCharPreview();
  }

  // ── Character CSS Preview ──
  _buildCharPreview() {
    const el = document.getElementById('cust-char-preview');
    if (!el) return;
    const bcm = this._custBodyManager;
    const wsm = this._custSkinManager;

    // Get equipped cosmetics
    const equipped = bcm ? bcm.getEquipped() : {};
    const dyeItem = bcm && equipped.dye ? bcm.getItemById(equipped.dye) : null;
    const bodyColor = dyeItem ? dyeItem.visual.color : '#1a1a28';
    const bodyLight = dyeItem ? this._lightenColor(dyeItem.visual.color, 30) : '#2a2a40';
    const accentColor = '#00ccff';

    // Weapon skin
    const skinData = wsm ? wsm.getEquippedSkinData() : null;
    const wBody = skinData ? '#' + skinData.body.toString(16).padStart(6,'0') : '#3a3a52';
    const wAccent = skinData ? '#' + skinData.accent.toString(16).padStart(6,'0') : '#00ffcc';
    const wBarrel = skinData ? '#' + skinData.barrel.toString(16).padStart(6,'0') : '#4a4a62';
    const wGrip = skinData ? '#' + skinData.grip.toString(16).padStart(6,'0') : '#282840';

    // Hat
    const hatItem = bcm && equipped.hat ? bcm.getItemById(equipped.hat) : null;
    const hatHtml = hatItem ? `<div class="cp-hat" style="background:${hatItem.visual.color};${hatItem.visual.glow ? 'box-shadow:0 0 8px '+hatItem.visual.color : ''}"></div>` : '';

    // Face
    const faceItem = bcm && equipped.face ? bcm.getItemById(equipped.face) : null;
    const faceHtml = faceItem ? `<div class="cp-face-acc" style="background:${faceItem.visual.color};${faceItem.visual.glow ? 'box-shadow:0 0 6px '+faceItem.visual.color : ''}"></div>` : '';

    // Body armor
    const bodyItem = bcm && equipped.body ? bcm.getItemById(equipped.body) : null;
    const armorHtml = bodyItem ? `<div class="cp-armor" style="background:${bodyItem.visual.color}"><div class="cp-armor-accent" style="background:${bodyItem.visual.accent || accentColor}"></div></div>` : '';

    // Back
    const backItem = bcm && equipped.back ? bcm.getItemById(equipped.back) : null;
    const backHtml = backItem ? `<div class="cp-back" style="background:${backItem.visual.color};${backItem.visual.glow ? 'box-shadow:0 0 10px '+backItem.visual.color : ''}"></div>` : '';

    // Waist
    const waistItem = bcm && equipped.waist ? bcm.getItemById(equipped.waist) : null;
    const waistHtml = waistItem ? `<div class="cp-waist" style="background:${waistItem.visual.color}"></div>` : '';

    // Shoes
    const shoeItem = bcm && equipped.shoes ? bcm.getItemById(equipped.shoes) : null;
    const shoeColor = shoeItem ? shoeItem.visual.color : bodyColor;

    // Glow/Aura
    const glowItem = bcm && equipped.glow ? bcm.getItemById(equipped.glow) : null;
    const auraHtml = glowItem ? `<div class="cp-aura" style="background:${glowItem.visual.color};opacity:${glowItem.visual.opacity || 0.3}"></div>` : '';

    el.innerHTML = `
      ${auraHtml}
      <div class="cp-body-wrap">
        ${hatHtml}
        <div class="cp-head" style="background:${bodyLight}">
          <div class="cp-visor" style="background:${accentColor}"></div>
          ${faceHtml}
        </div>
        <div class="cp-neck" style="background:${bodyColor}"></div>
        <div class="cp-torso" style="background:${bodyColor}">
          ${armorHtml}
          <div class="cp-sensor cp-sensor-chest" style="background:${accentColor}"></div>
          ${backHtml}
        </div>
        <div class="cp-arms">
          <div class="cp-arm cp-arm-l" style="background:${bodyColor}">
            <div class="cp-sensor cp-sensor-arm" style="background:${accentColor}"></div>
          </div>
          <div class="cp-arm cp-arm-r" style="background:${bodyColor}">
            <div class="cp-weapon">
              <div class="cp-gun-body" style="background:${wBody}">
                <div class="cp-gun-barrel" style="background:${wBarrel}"></div>
                <div class="cp-gun-accent" style="background:${wAccent};box-shadow:0 0 6px ${wAccent}"></div>
                <div class="cp-gun-grip" style="background:${wGrip}"></div>
              </div>
            </div>
          </div>
        </div>
        ${waistHtml}
        <div class="cp-legs">
          <div class="cp-leg" style="background:${bodyLight}">
            <div class="cp-sensor cp-sensor-leg" style="background:${accentColor}"></div>
          </div>
          <div class="cp-leg" style="background:${bodyLight}">
            <div class="cp-sensor cp-sensor-leg" style="background:${accentColor}"></div>
          </div>
        </div>
        <div class="cp-feet">
          <div class="cp-foot" style="background:${shoeColor}"></div>
          <div class="cp-foot" style="background:${shoeColor}"></div>
        </div>
      </div>
    `;
  }

  _lightenColor(hex, amount) {
    const r = Math.min(255, parseInt(hex.slice(1,3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3,5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5,7), 16) + amount);
    return '#' + [r,g,b].map(c => c.toString(16).padStart(2,'0')).join('');
  }

  // ── Equipment Grid Tab (Krunker-style) ──
  _buildEquipTab(container, emit) {
    const bcm = this._custBodyManager;
    const wsm = this._custSkinManager;
    if (!bcm || !wsm) { container.innerHTML = ''; return; }
    const slots = bcm.getSlots();
    const equipped = bcm.getEquipped();

    // Weapon skin card first
    const skin = wsm.getEquippedSkinData();
    const wAccent = '#' + skin.accent.toString(16).padStart(6,'0');
    const wBody = '#' + skin.body.toString(16).padStart(6,'0');
    const wBarrel = '#' + skin.barrel.toString(16).padStart(6,'0');
    const wGrip = '#' + skin.grip.toString(16).padStart(6,'0');

    let html = '<div class="equip-grid">';

    // Weapon slot
    html += `<div class="equip-slot" data-action="weapon">
      <div class="equip-slot-label">Arme</div>
      <div class="equip-slot-preview">
        <div class="eqp-gun">
          <div class="eqp-gun-body" style="background:${wBody}">
            <div class="eqp-gun-barrel" style="background:${wBarrel}"></div>
            <div class="eqp-gun-accent" style="background:${wAccent};box-shadow:0 0 4px ${wAccent}"></div>
            <div class="eqp-gun-grip" style="background:${wGrip}"></div>
          </div>
        </div>
      </div>
      <div class="equip-slot-name" style="color:${skin.rarity.color}">${skin.name}</div>
    </div>`;

    // Body cosmetic slots
    for (const slot of slots) {
      const eqId = equipped[slot.id];
      const item = eqId ? bcm.getItemById(eqId) : null;
      const visual = item ? item.visual : null;

      html += `<div class="equip-slot" data-slot="${slot.id}">
        <div class="equip-slot-label">${slot.label}</div>
        <div class="equip-slot-preview">
          ${item
            ? `<div class="eqp-item-dot" style="background:${visual.color};${visual.glow ? 'box-shadow:0 0 10px '+visual.color : ''}"></div>`
            : `<div class="eqp-none">${slot.icon}</div>`
          }
        </div>
        <div class="equip-slot-name" ${item ? `style="color:${item.rarity.color}"` : ''}>${item ? item.name : 'Aucun'}</div>
        ${item ? '<button class="equip-slot-remove" data-unequip="'+slot.id+'">&times;</button>' : ''}
      </div>`;
    }
    html += '</div>';

    container.innerHTML = html;

    // Click handlers — open slot detail
    container.querySelectorAll('.equip-slot[data-slot]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('equip-slot-remove')) return;
        this._openSlotDetail(el.dataset.slot);
      });
    });
    container.querySelectorAll('.equip-slot[data-action="weapon"]').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('#cust-tabs .stab').forEach(t => t.classList.remove('active'));
        document.querySelector('#cust-tabs .stab[data-ctab="skins"]').classList.add('active');
        this._custTab = 'skins';
        this._refreshCustContent();
      });
    });
    // Unequip buttons
    container.querySelectorAll('.equip-slot-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        emit('unequipCosmetic', btn.dataset.unequip);
      });
    });
  }

  // ── Slot Detail Overlay ──
  _openSlotDetail(slotId) {
    const bcm = this._custBodyManager;
    if (!bcm) return;
    const slot = bcm.getSlots().find(s => s.id === slotId);
    if (!slot) return;

    const overlay = document.getElementById('slot-detail-overlay');
    overlay.classList.remove('hidden');
    document.getElementById('slot-detail-title').textContent = slot.icon + ' ' + slot.label;

    const content = document.getElementById('slot-detail-content');
    const items = bcm.getItemsForSlot(slotId);
    const owned = bcm.getOwned();
    const equipped = bcm.getEquippedForSlot(slotId);
    const credits = this._custCredits || 0;

    const emit = (name, data) => { if (this._callbacks[name]) this._callbacks[name](data); };

    let html = '<div class="skin-grid">';
    for (const item of items) {
      const isOwned = owned.includes(item.id);
      const isEq = item.id === equipped;
      const canBuy = credits >= item.price;
      const v = item.visual;

      html += `<div class="skin-card ${isEq ? 'skin-equipped' : ''}" style="border-color:${item.rarity.color}40">
        <div class="cosm-preview" style="background:${v.color};${v.glow ? 'box-shadow:inset 0 0 15px '+v.color : ''}"></div>
        <div class="skin-name" style="color:${item.rarity.color}">${item.name}</div>
        <div class="skin-rarity" style="color:${item.rarity.color}">${item.rarity.label}</div>
        <div class="cosm-desc">${item.desc}</div>
        ${isEq ? '<div class="skin-status">EQUIPE</div>'
          : isOwned ? `<button class="skin-equip-btn" data-cid="${item.id}">EQUIPER</button>`
          : `<div class="skin-price">${item.price} CR</div><button class="skin-buy-btn ${canBuy ? '' : 'disabled'}" data-cid="${item.id}" ${canBuy ? '' : 'disabled'}>${canBuy ? 'ACHETER' : 'INSUFFISANT'}</button>`
        }
      </div>`;
    }
    html += '</div>';
    content.innerHTML = html;

    // Event handlers
    content.querySelectorAll('.skin-equip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        emit('equipCosmetic', btn.dataset.cid);
        this._openSlotDetail(slotId); // refresh
      });
    });
    content.querySelectorAll('.skin-buy-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        emit('buyCosmetic', btn.dataset.cid);
        this._openSlotDetail(slotId); // refresh
      });
    });
  }

  // ── Weapon Skins Tab (with gun shape preview) ──
  _buildSkinsTab(container, wsm, emit) {
    const owned = wsm.getOwnedSkins();
    const equipped = wsm.getEquippedSkin();
    const catalog = wsm.getCatalog();
    const ownedSkins = catalog.filter(s => owned.includes(s.id));
    let html = `<div class="cust-count">${ownedSkins.length} skins d'arme</div><div class="skin-grid">`;
    for (const skin of ownedSkins) {
      const isEq = skin.id === equipped;
      html += `<div class="skin-card ${isEq ? 'skin-equipped' : ''}" style="border-color:${skin.rarity.color}40">
        ${this._gunPreviewHtml(skin)}
        <div class="skin-name" style="color:${skin.rarity.color}">${skin.name}</div>
        <div class="skin-rarity" style="color:${skin.rarity.color}">${skin.rarity.label}</div>
        ${isEq ? '<div class="skin-status">EQUIPE</div>' : `<button class="skin-equip-btn" data-id="${skin.id}">EQUIPER</button>`}
      </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll('.skin-equip-btn').forEach(btn => {
      btn.addEventListener('click', () => emit('equipSkin', btn.dataset.id));
    });
  }

  // ── Market Tab ──
  _buildMarketTab(container, wsm, credits, emit) {
    const catalog = wsm.getCatalog();
    const owned = wsm.getOwnedSkins();
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unobtainable'];
    let html = '';
    for (const rKey of rarities) {
      const skins = catalog.filter(s => s.rarity.key === rKey && !owned.includes(s.id) && s.price > 0);
      if (skins.length === 0) continue;
      const rObj = skins[0].rarity;
      html += `<div class="market-section"><div class="market-section-title" style="color:${rObj.color}">${rObj.label}</div><div class="skin-grid">`;
      for (const skin of skins) {
        const canBuy = credits >= skin.price;
        html += `<div class="skin-card" style="border-color:${skin.rarity.color}40">
          ${this._gunPreviewHtml(skin)}
          <div class="skin-name" style="color:${skin.rarity.color}">${skin.name}</div>
          <div class="skin-price">${skin.price} CR</div>
          <button class="skin-buy-btn ${canBuy ? '' : 'disabled'}" data-id="${skin.id}" ${canBuy ? '' : 'disabled'}>${canBuy ? 'ACHETER' : 'INSUFFISANT'}</button>
        </div>`;
      }
      html += '</div></div>';
    }
    if (!html) html = '<div class="cust-empty">Tous les skins du marche ont ete achetes !</div>';
    container.innerHTML = html;
    container.querySelectorAll('.skin-buy-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => emit('buySkin', btn.dataset.id));
    });
  }

  // ── Spin Tab ──
  _buildSpinTab(container, wsm, credits, emit) {
    const tiers = wsm.getSpinTiers();
    let html = '<div class="spin-info">Tente ta chance pour obtenir des skins rares !</div><div class="spin-tiers">';
    for (const tier of tiers) {
      const canSpin = credits >= tier.price;
      html += `<div class="spin-tier-card">
        <div class="spin-tier-name">${tier.name}</div>
        <div class="spin-tier-price">${tier.label}</div>
        <div class="spin-tier-desc">${tier.guaranteedMinRarity.toUpperCase()}+ garanti</div>
        <button class="spin-btn ${canSpin ? '' : 'disabled'}" data-tier="${tier.id}" ${canSpin ? '' : 'disabled'}>${canSpin ? 'SPIN' : 'INSUFFISANT'}</button>
      </div>`;
    }
    html += '</div>';
    html += '<div class="spin-chances"><div class="spin-chances-title">Chances</div>';
    const rarities = [
      { label: 'Common', color: '#aaa', chance: '40%' },
      { label: 'Uncommon', color: '#4c4', chance: '25%' },
      { label: 'Rare', color: '#48f', chance: '18%' },
      { label: 'Epic', color: '#a4f', chance: '10%' },
      { label: 'Legendary', color: '#fa0', chance: '5%' },
      { label: 'Mythic', color: '#f36', chance: '1.8%' },
      { label: 'Unobtainable', color: '#f0f', chance: '0.2%' },
    ];
    for (const r of rarities) {
      html += `<div class="spin-chance-row"><span style="color:${r.color}">${r.label}</span><span>${r.chance}</span></div>`;
    }
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll('.spin-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => emit('spinSkin', btn.dataset.tier));
    });
  }

  // ── Gun shape preview (CSS weapon) ──
  _gunPreviewHtml(skin) {
    const body = '#' + skin.body.toString(16).padStart(6,'0');
    const accent = '#' + skin.accent.toString(16).padStart(6,'0');
    const barrel = '#' + skin.barrel.toString(16).padStart(6,'0');
    const grip = '#' + skin.grip.toString(16).padStart(6,'0');
    return `<div class="gun-prev">
      <div class="gp-stock" style="background:${body}"></div>
      <div class="gp-body" style="background:${body}">
        <div class="gp-accent" style="background:${accent};box-shadow:0 0 6px ${accent}"></div>
      </div>
      <div class="gp-barrel" style="background:${barrel}">
        <div class="gp-muzzle" style="background:${accent};box-shadow:0 0 4px ${accent}"></div>
      </div>
      <div class="gp-grip" style="background:${grip}"></div>
      <div class="gp-mag" style="background:${grip}"></div>
    </div>`;
  }

  showSpinResult(skin, isDupe) {
    const overlay = document.getElementById('spin-overlay');
    overlay.classList.remove('hidden');

    // Build reel with random skins
    const catalog = this._custSkinManager ? this._custSkinManager.getCatalog() : [];
    const reel = document.getElementById('spin-reel');
    let reelHtml = '';
    for (let i = 0; i < 30; i++) {
      const s = (i === 25) ? skin : catalog[Math.floor(Math.random() * catalog.length)];
      const acHex = '#' + s.accent.toString(16).padStart(6, '0');
      const bodyHex = '#' + s.body.toString(16).padStart(6, '0');
      reelHtml += `<div class="spin-reel-item" style="border-color:${s.rarity.color}">
        <div class="spin-reel-preview" style="background:${bodyHex}"><div class="skin-accent-bar" style="background:${acHex}"></div></div>
        <div class="spin-reel-name" style="color:${s.rarity.color}">${s.name}</div>
      </div>`;
    }
    reel.innerHTML = reelHtml;

    // Animate reel
    const result = document.getElementById('spin-result');
    result.classList.add('hidden');
    reel.style.transition = 'none';
    reel.style.transform = 'translateX(0)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Item width = 130px (120 + 10 gap), target = item 25 centered
        const targetOffset = 25 * 130 - (reel.parentElement.offsetWidth / 2) + 65;
        reel.style.transition = 'transform 3s cubic-bezier(0.1, 0.7, 0.2, 1)';
        reel.style.transform = `translateX(-${targetOffset}px)`;
      });
    });

    setTimeout(() => {
      result.classList.remove('hidden');
      document.getElementById('spin-result-rarity').textContent = skin.rarity.label;
      document.getElementById('spin-result-rarity').style.color = skin.rarity.color;
      document.getElementById('spin-result-name').textContent = skin.name;
      document.getElementById('spin-result-name').style.color = skin.rarity.color;
      document.getElementById('spin-result-desc').textContent = skin.desc;
      const dupeEl = document.getElementById('spin-result-dupe');
      if (isDupe) {
        dupeEl.classList.remove('hidden');
        dupeEl.textContent = 'DUPLICATE — Credits rembourses';
      } else {
        dupeEl.classList.add('hidden');
      }
    }, 3200);
  }

  // ═══════════════════════════════════════════
  // TEAM NOTIFICATION
  // ═══════════════════════════════════════════

  showTeamNotification(teamName, teamColor) {
    const el = document.getElementById('team-notification');
    if (!el) return;
    el.innerHTML = `<div class="team-notif-inner" style="border-color:${teamColor.css};color:${teamColor.css}"><div class="team-notif-label">YOUR TEAM</div><div class="team-notif-name">${teamName}</div></div>`;
    el.classList.remove('hidden');
    this._teamNotifTimer = 3;
  }

  // ═══════════════════════════════════════════
  // TEAMMATE INDICATORS
  // ═══════════════════════════════════════════

  updateTeammateIndicators(indicators) {
    const container = document.getElementById('teammate-indicators');
    if (!container) return;
    while (container.children.length > indicators.length) container.removeChild(container.lastChild);
    while (container.children.length < indicators.length) {
      const div = document.createElement('div');
      div.className = 'teammate-tag';
      container.appendChild(div);
    }
    for (let i = 0; i < indicators.length; i++) {
      const ind = indicators[i];
      const div = container.children[i];
      div.style.left = ind.x + 'px';
      div.style.top = ind.y + 'px';
      div.style.borderColor = ind.color;
      div.style.color = ind.color;
      div.textContent = ind.name;
      div.style.opacity = ind.isDisabled ? '0.3' : '0.85';
    }
  }

  clearTeammateIndicators() {
    const container = document.getElementById('teammate-indicators');
    if (container) container.innerHTML = '';
  }

  // ═══════════════════════════════════════════
  // CROSSHAIR CUSTOMIZATION
  // ═══════════════════════════════════════════

  applyCrosshair(color, style) {
    const ch = document.getElementById('crosshair');
    if (!ch) return;
    ch.classList.remove('ch-style-dot', 'ch-style-circle', 'ch-style-cross');
    if (style === 'dot') ch.classList.add('ch-style-dot');
    else if (style === 'circle') ch.classList.add('ch-style-circle');
    else if (style === 'cross') ch.classList.add('ch-style-cross');
    ch.style.setProperty('--ch-color', color);
    ch.querySelectorAll('.ch-line').forEach(l => l.style.background = color);
    const dot = ch.querySelector('.ch-dot');
    if (dot) dot.style.background = color;
  }

  // ═══════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════

  update(dt) {
    if (this._hitMarkerTimer > 0) { this._hitMarkerTimer -= dt; if (this._hitMarkerTimer <= 0) document.getElementById('hit-marker').classList.remove('active'); }
    if (this._damageTimer > 0) { this._damageTimer -= dt; if (this._damageTimer <= 0) document.getElementById('damage-overlay').classList.remove('active'); }
    if (this._teamNotifTimer > 0) {
      this._teamNotifTimer -= dt;
      if (this._teamNotifTimer <= 0) { const el = document.getElementById('team-notification'); if (el) el.classList.add('hidden'); }
    }
    this._fpsFrames++;
    this._fpsTime += dt;
    if (this._fpsTime >= 0.5) { this._fpsValue = Math.round(this._fpsFrames / this._fpsTime); this._fpsFrames = 0; this._fpsTime = 0; }
    const fpsEl = document.getElementById('fps-counter');
    if (fpsEl) { fpsEl.classList.toggle('hidden', !this.settings.get('showFps')); fpsEl.textContent = this._fpsValue + ' FPS'; }
  }
}
