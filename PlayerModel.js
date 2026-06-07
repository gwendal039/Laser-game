import * as THREE from 'three';

const _dark = (color) => new THREE.MeshLambertMaterial({ color });
const _glow = (color) => new THREE.MeshBasicMaterial({ color });

export class PlayerModel {
  constructor(teamColor, teamEmissive) {
    this.teamColor = teamColor;
    this.teamEmissive = teamEmissive;
    this.group = new THREE.Group();
    this.hitZoneMeshes = {};
    this.bodyParts = {};
    this._disabled = false;
    this._invulnerable = false;
    this._flashTimer = 0;
    this._build();
    this.group.scale.set(1.8, 1.8, 1.8);
  }

  _addPart(geo, mat, x, y, z, hitZone) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (hitZone) mesh.userData.hitZone = hitZone;
    this.group.add(mesh);
    return mesh;
  }

  _build() {
    const suit = 0x151520;
    const suitDark = 0x111118;
    const vestColor = 0x1a1a30;
    const tc = this.teamColor;

    // ════════════════════════════════════
    // FEET
    // ════════════════════════════════════
    this._addPart(new THREE.BoxGeometry(0.28, 0.12, 0.4), _dark(suitDark), -0.22, 0.06, 0.04, 'legs');
    this._addPart(new THREE.BoxGeometry(0.28, 0.12, 0.4), _dark(suitDark), 0.22, 0.06, 0.04, 'legs');

    // ════════════════════════════════════
    // LOWER LEGS (shins)
    // ════════════════════════════════════
    this._addPart(new THREE.BoxGeometry(0.22, 0.55, 0.22), _dark(suit), -0.22, 0.45, 0, 'legs');
    this._addPart(new THREE.BoxGeometry(0.22, 0.55, 0.22), _dark(suit), 0.22, 0.45, 0, 'legs');

    // Knee pads
    this._addPart(new THREE.BoxGeometry(0.16, 0.12, 0.1), _dark(0x1a1a2a), -0.22, 0.52, 0.16, 'legs');
    this._addPart(new THREE.BoxGeometry(0.16, 0.12, 0.1), _dark(0x1a1a2a), 0.22, 0.52, 0.16, 'legs');

    // ════════════════════════════════════
    // UPPER LEGS (thighs)
    // ════════════════════════════════════
    this._addPart(new THREE.BoxGeometry(0.24, 0.5, 0.24), _dark(suit), -0.2, 1.0, 0, 'legs');
    this._addPart(new THREE.BoxGeometry(0.24, 0.5, 0.24), _dark(suit), 0.2, 1.0, 0, 'legs');

    // Outer leg neon strips
    this._addPart(new THREE.BoxGeometry(0.04, 0.7, 0.22), _glow(tc), -0.35, 0.6, 0, 'legs');
    this._addPart(new THREE.BoxGeometry(0.04, 0.7, 0.22), _glow(tc), 0.35, 0.6, 0, 'legs');

    // ════════════════════════════════════
    // WAIST / BELT
    // ════════════════════════════════════
    this._addPart(new THREE.BoxGeometry(0.56, 0.1, 0.34), _dark(0x111122), 0, 1.3, 0, 'torso');
    this._addPart(new THREE.BoxGeometry(0.12, 0.08, 0.04), _glow(tc), 0, 1.3, 0.18, 'torso');

    // ════════════════════════════════════
    // TORSO (body under vest)
    // ════════════════════════════════════
    this._addPart(new THREE.BoxGeometry(0.55, 0.7, 0.32), _dark(suit), 0, 1.72, 0, 'torso');

    // ════════════════════════════════════
    // LASER TAG VEST
    // ════════════════════════════════════

    // Vest front panel
    this._addPart(new THREE.BoxGeometry(0.54, 0.62, 0.05), _dark(vestColor), 0, 1.74, 0.19, 'torso');

    // Vest back panel
    this._addPart(new THREE.BoxGeometry(0.5, 0.56, 0.05), _dark(vestColor), 0, 1.74, -0.19, 'back');

    // Vest shoulder straps (connecting front to back)
    this._addPart(new THREE.BoxGeometry(0.12, 0.06, 0.42), _dark(vestColor), -0.22, 2.08, 0, 'torso');
    this._addPart(new THREE.BoxGeometry(0.12, 0.06, 0.42), _dark(vestColor), 0.22, 2.08, 0, 'torso');

    // ── FRONT CHEST SENSOR (main target) ──
    // Sensor border (darker ring)
    this._addPart(new THREE.BoxGeometry(0.38, 0.38, 0.02), _dark(0x0a0a15), 0, 1.78, 0.23, 'torso');
    // Sensor panel (BRIGHT — always visible)
    this._addPart(new THREE.BoxGeometry(0.32, 0.32, 0.03), _glow(tc), 0, 1.78, 0.25, 'torso');

    // ── BACK SENSOR ──
    this._addPart(new THREE.BoxGeometry(0.32, 0.3, 0.02), _dark(0x0a0a15), 0, 1.78, -0.23, 'back');
    this._addPart(new THREE.BoxGeometry(0.26, 0.24, 0.03), _glow(tc), 0, 1.78, -0.25, 'back');

    // Vest side panels
    this._addPart(new THREE.BoxGeometry(0.05, 0.5, 0.22), _dark(vestColor), -0.29, 1.74, 0, 'torso');
    this._addPart(new THREE.BoxGeometry(0.05, 0.5, 0.22), _dark(vestColor), 0.29, 1.74, 0, 'torso');

    // ════════════════════════════════════
    // SHOULDERS
    // ════════════════════════════════════

    // Shoulder pads
    this._addPart(new THREE.BoxGeometry(0.24, 0.16, 0.3), _dark(0x1e1e35), -0.42, 2.14, 0, 'shoulders');
    this._addPart(new THREE.BoxGeometry(0.24, 0.16, 0.3), _dark(0x1e1e35), 0.42, 2.14, 0, 'shoulders');

    // Shoulder sensor strips (BRIGHT — on top of pads)
    this._addPart(new THREE.BoxGeometry(0.2, 0.05, 0.26), _glow(tc), -0.42, 2.24, 0, 'shoulders');
    this._addPart(new THREE.BoxGeometry(0.2, 0.05, 0.26), _glow(tc), 0.42, 2.24, 0, 'shoulders');

    // ════════════════════════════════════
    // ARMS
    // ════════════════════════════════════

    // Upper arms
    this._addPart(new THREE.BoxGeometry(0.15, 0.45, 0.15), _dark(suit), -0.46, 1.84, 0, 'shoulders');
    this._addPart(new THREE.BoxGeometry(0.15, 0.45, 0.15), _dark(suit), 0.46, 1.84, 0.08, 'shoulders');

    // Forearms
    this._addPart(new THREE.BoxGeometry(0.13, 0.38, 0.13), _dark(suit), -0.46, 1.3, 0.06, 'shoulders');
    this._addPart(new THREE.BoxGeometry(0.13, 0.38, 0.13), _dark(suit), 0.46, 1.3, 0.22, 'shoulders');

    // Forearm guards (glowing accent)
    this._addPart(new THREE.BoxGeometry(0.08, 0.22, 0.15), _glow(tc), -0.46, 1.22, 0.06, 'shoulders');
    this._addPart(new THREE.BoxGeometry(0.08, 0.22, 0.15), _glow(tc), 0.46, 1.22, 0.22, 'shoulders');

    // Hands (small cubes)
    this._addPart(new THREE.BoxGeometry(0.1, 0.1, 0.1), _dark(0x2a2235), -0.46, 1.06, 0.06, 'shoulders');
    this._addPart(new THREE.BoxGeometry(0.1, 0.1, 0.1), _dark(0x2a2235), 0.46, 1.06, 0.3, 'shoulders');

    // ════════════════════════════════════
    // NECK
    // ════════════════════════════════════
    this._addPart(new THREE.BoxGeometry(0.14, 0.1, 0.14), _dark(0x2a2235), 0, 2.22, 0, 'head');

    // ════════════════════════════════════
    // HEAD / HELMET
    // ════════════════════════════════════

    // Helmet base
    this._addPart(new THREE.BoxGeometry(0.34, 0.36, 0.32), _dark(0x1a1a30), 0, 2.48, 0, 'head');

    // Visor (bright, team-colored)
    this._addPart(new THREE.BoxGeometry(0.3, 0.12, 0.05), _glow(tc), 0, 2.48, 0.19, 'head');

    // Headband sensor (wraps around helmet — BRIGHT)
    this._addPart(new THREE.BoxGeometry(0.36, 0.06, 0.04), _glow(tc), 0, 2.6, 0.17, 'head');
    this._addPart(new THREE.BoxGeometry(0.04, 0.06, 0.34), _glow(tc), -0.18, 2.6, 0, 'head');
    this._addPart(new THREE.BoxGeometry(0.04, 0.06, 0.34), _glow(tc), 0.18, 2.6, 0, 'head');
    this._addPart(new THREE.BoxGeometry(0.36, 0.06, 0.04), _glow(tc), 0, 2.6, -0.15, 'head');

    // Helmet ridge
    this._addPart(new THREE.BoxGeometry(0.1, 0.08, 0.28), _dark(0x1e1e35), 0, 2.72, 0, 'head');

    // Helmet side vents
    this._addPart(new THREE.BoxGeometry(0.06, 0.18, 0.14), _dark(0x161628), -0.2, 2.46, -0.04, 'head');
    this._addPart(new THREE.BoxGeometry(0.06, 0.18, 0.14), _dark(0x161628), 0.2, 2.46, -0.04, 'head');

    // ════════════════════════════════════
    // LASER GUN (held in right hand)
    // ════════════════════════════════════

    // Gun body
    this._addPart(new THREE.BoxGeometry(0.08, 0.12, 0.5), _dark(0x222233), 0.46, 1.12, 0.5);

    // Gun barrel
    const barrel = this._addPart(new THREE.BoxGeometry(0.06, 0.06, 0.14), _glow(tc), 0.46, 1.12, 0.82);
    this.bodyParts.gunTip = barrel;

    // Gun scope/sight
    this._addPart(new THREE.BoxGeometry(0.04, 0.06, 0.14), _dark(0x1a1a2a), 0.46, 1.22, 0.55);

    // Gun grip
    this._addPart(new THREE.BoxGeometry(0.06, 0.14, 0.08), _dark(suitDark), 0.46, 1.0, 0.38);

    // Gun stock
    this._addPart(new THREE.BoxGeometry(0.06, 0.08, 0.12), _dark(0x1e1e2a), 0.46, 1.14, 0.2);

    // ════════════════════════════════════
    // BACKPACK (small equipment box)
    // ════════════════════════════════════
    this._addPart(new THREE.BoxGeometry(0.3, 0.28, 0.12), _dark(0x161628), 0, 1.55, -0.23, 'back');
    // Backpack indicator light
    this._addPart(new THREE.BoxGeometry(0.06, 0.06, 0.04), _glow(tc), 0.08, 1.65, -0.3, 'back');
    // Antenna
    this._addPart(new THREE.BoxGeometry(0.03, 0.25, 0.03), _glow(tc), 0.12, 1.85, -0.28);

    // ── Build hitZone mesh map ──
    this.group.traverse((child) => {
      if (child.isMesh && child.userData.hitZone) {
        const zone = child.userData.hitZone;
        if (!this.hitZoneMeshes[zone]) {
          this.hitZoneMeshes[zone] = [];
        }
        this.hitZoneMeshes[zone].push(child);
      }
    });
  }

  getHitTargets() {
    const targets = [];
    this.group.traverse((child) => {
      if (child.isMesh && child.userData.hitZone) {
        targets.push(child);
      }
    });
    return targets;
  }

  setPosition(x, y, z) { this.group.position.set(x, y, z); }
  setRotationY(angle) { this.group.rotation.y = angle; }

  setDisabled(disabled) {
    this._disabled = disabled;
    if (!disabled) {
      this.group.traverse((c) => { if (c.isMesh) c.visible = true; });
    }
  }

  setInvulnerable(invulnerable) {
    this._invulnerable = invulnerable;
    if (!invulnerable) {
      this.group.traverse((c) => {
        if (c.isMesh) {
          c.visible = true;
          c.material.opacity = 1;
          c.material.transparent = false;
        }
      });
    }
  }

  update(dt) {
    this._flashTimer += dt;

    if (this._disabled) {
      const flash = Math.sin(this._flashTimer * 12) > 0;
      this.group.traverse((c) => { if (c.isMesh) c.visible = flash; });
    } else if (this._invulnerable) {
      const alpha = 0.3 + Math.sin(this._flashTimer * 10) * 0.3;
      this.group.traverse((c) => {
        if (c.isMesh) {
          c.material.transparent = true;
          c.material.opacity = alpha;
        }
      });
    }
  }

  getGunTipWorld() {
    const pos = new THREE.Vector3();
    this.bodyParts.gunTip.getWorldPosition(pos);
    return pos;
  }

  dispose() {
    this.group.traverse((c) => {
      if (c.isMesh) {
        c.geometry.dispose();
        c.material.dispose();
      }
    });
  }
}
