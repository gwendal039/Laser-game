import { Config } from './Config.js';

const STORAGE_KEY = 'laserArenaSettings';

export class SettingsManager {
  constructor() {
    this._settings = {};
    this._listeners = {};
    this._load();
  }

  _load() {
    const defaults = { ...Config.defaults };
    let saved = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch { /* ignore corrupt data */ }
    this._settings = { ...defaults, ...saved };
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
    } catch { /* storage full or private mode */ }
  }

  get(key) {
    return this._settings[key];
  }

  set(key, value) {
    if (this._settings[key] === value) return;
    this._settings[key] = value;
    this._save();
    if (this._listeners[key]) {
      for (const cb of this._listeners[key]) cb(value);
    }
  }

  onChange(key, callback) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(callback);
  }

  getAll() {
    return { ...this._settings };
  }

  reset() {
    this._settings = { ...Config.defaults };
    this._save();
    for (const key in this._listeners) {
      for (const cb of this._listeners[key]) cb(this._settings[key]);
    }
  }
}
