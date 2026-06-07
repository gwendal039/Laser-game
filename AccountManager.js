// ═══════════════════════════════════════════════════
// ACCOUNT MANAGER — Accounts, sessions, guest mode
// localStorage-based authentication
// ═══════════════════════════════════════════════════

const ACCOUNTS_KEY = 'laser_arena_accounts';
const SESSION_KEY = 'laser_arena_session';

export class AccountManager {
  constructor() {
    this._accounts = this._loadAccounts();
    this._session = this._loadSession();
  }

  // ── SESSION STATE ──

  /** Has the user previously chosen guest or account mode? */
  hasSession() { return !!this._session; }

  isGuest() { return this._session?.type === 'guest'; }
  isLoggedIn() { return this._session?.type === 'account'; }

  get currentUsername() { return this._session?.username || null; }

  // ── ACCOUNT CREATION ──

  createAccount(username, password) {
    if (!username || username.length < 2 || username.length > 20) {
      return { success: false, error: 'Le pseudo doit faire entre 2 et 20 caractères.' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Le mot de passe doit faire au moins 4 caractères.' };
    }
    const key = username.toLowerCase();
    if (this._accounts[key]) {
      return { success: false, error: 'Ce pseudo est déjà pris.' };
    }

    this._accounts[key] = {
      displayName: username,
      password: this._hashPassword(password),
      profile: null,
      created: Date.now(),
    };
    this._saveAccounts();

    this._session = { type: 'account', username: key };
    this._saveSession();

    return { success: true };
  }

  // ── LOGIN ──

  login(username, password) {
    const key = username.toLowerCase();
    const acc = this._accounts[key];
    if (!acc) {
      return { success: false, error: 'Compte introuvable.' };
    }
    if (acc.password !== this._hashPassword(password)) {
      return { success: false, error: 'Mot de passe incorrect.' };
    }

    this._session = { type: 'account', username: key };
    this._saveSession();

    return { success: true, displayName: acc.displayName };
  }

  // ── GUEST MODE ──

  loginAsGuest() {
    this._session = { type: 'guest', username: null };
    this._saveSession();
  }

  // ── LOGOUT ──

  logout() {
    this._session = null;
    localStorage.removeItem(SESSION_KEY);
  }

  // ── PROFILE DATA ──

  /** Load profile data for current account (null for guest) */
  loadProfile() {
    if (this.isLoggedIn()) {
      const acc = this._accounts[this._session.username];
      return acc?.profile || null;
    }
    return null;
  }

  /** Save profile data to current account */
  saveProfile(profileData) {
    if (this.isLoggedIn()) {
      const acc = this._accounts[this._session.username];
      if (acc) {
        acc.profile = JSON.parse(JSON.stringify(profileData));
        this._saveAccounts();
      }
    }
  }

  /** Get display name for current session */
  getDisplayName() {
    if (this.isLoggedIn()) {
      const acc = this._accounts[this._session.username];
      return acc?.displayName || this._session.username;
    }
    return 'Guest';
  }

  // ── INTERNAL ──

  _hashPassword(password) {
    // Simple hash for local storage (no server security needed)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return btoa(String(hash));
  }

  _loadAccounts() {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* corrupt */ }
    return {};
  }

  _saveAccounts() {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(this._accounts));
    } catch { /* quota */ }
  }

  _loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        // Validate session still has a valid account
        if (session.type === 'account' && !this._accounts[session.username]) {
          return null;
        }
        return session;
      }
    } catch { /* corrupt */ }
    return null;
  }

  _saveSession() {
    try {
      if (this._session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(this._session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch { /* quota */ }
  }
}
