export class InputManager {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.keys = {};
    this.mouseDown = {};
    this.mousePressed = {};
    this.pointerLocked = false;
    this._mouseCallbacks = [];
    this._pointerLockCallbacks = [];

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);

    canvas.addEventListener('click', () => {
      if (!this.pointerLocked) canvas.requestPointerLock();
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onMouseMove(callback) { this._mouseCallbacks.push(callback); }

  onPointerLockChange(callback) { this._pointerLockCallbacks.push(callback); }

  _onKeyDown(e) { this.keys[e.code] = true; }
  _onKeyUp(e) { this.keys[e.code] = false; }

  _onMouseMove(e) {
    if (!this.pointerLocked) return;
    for (const cb of this._mouseCallbacks) cb(e.movementX, e.movementY);
  }

  _onMouseDown(e) {
    this.mouseDown[e.button] = true;
    this.mousePressed[e.button] = true;
  }

  _onMouseUp(e) { this.mouseDown[e.button] = false; }

  _onPointerLockChange() {
    const wasLocked = this.pointerLocked;
    this.pointerLocked = document.pointerLockElement === this.canvas;
    if (wasLocked !== this.pointerLocked) {
      for (const cb of this._pointerLockCallbacks) cb(this.pointerLocked);
    }
  }

  isKeyDown(code) { return !!this.keys[code]; }

  // ── Rebindable movement keys ──
  _key(settingKey) {
    return this.settings ? this.settings.get(settingKey) : null;
  }

  isForward() {
    const k = this._key('keyForward');
    const kAlt = this._key('keyForwardAlt');
    return (k && this.isKeyDown(k)) || (kAlt && this.isKeyDown(kAlt))
      || this.isKeyDown('KeyW') || this.isKeyDown('KeyZ');
  }

  isBackward() {
    const k = this._key('keyBackward');
    return (k && this.isKeyDown(k)) || this.isKeyDown('KeyS');
  }

  isLeft() {
    const k = this._key('keyLeft');
    const kAlt = this._key('keyLeftAlt');
    return (k && this.isKeyDown(k)) || (kAlt && this.isKeyDown(kAlt))
      || this.isKeyDown('KeyA') || this.isKeyDown('KeyQ');
  }

  isRight() {
    const k = this._key('keyRight');
    return (k && this.isKeyDown(k)) || this.isKeyDown('KeyD');
  }

  isJump() {
    const k = this._key('keyJump');
    return (k && this.isKeyDown(k)) || this.isKeyDown('Space');
  }

  isSprint() {
    const k = this._key('keySprint');
    return (k && this.isKeyDown(k)) || this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }

  isCrouch() {
    const k = this._key('keyCrouch');
    const kAlt = this._key('keyCrouchAlt');
    return (k && this.isKeyDown(k)) || (kAlt && this.isKeyDown(kAlt))
      || this.isKeyDown('KeyC') || this.isKeyDown('ControlLeft');
  }

  isFireDown() { return !!this.mouseDown[0]; }
  isAimDown()  { return !!this.mouseDown[2]; }
  wasFirePressed() { return !!this.mousePressed[0]; }

  endFrame() { this.mousePressed = {}; }
  requestPointerLock() { this.canvas.requestPointerLock(); }
}
