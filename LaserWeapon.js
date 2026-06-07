import * as THREE from 'three';
import { Config } from './Config.js';
import { HitZones } from './HitZones.js';

// Reusable temp vectors
const _dir = new THREE.Vector3();
const _mid = new THREE.Vector3();

class LaserBeam {
  constructor(scene, origin, end, color, duration) {
    this.scene = scene;
    this.timer = duration;
    this._duration = duration;
    this._meshes = [];

    const o = origin.clone();
    const e = end.clone();
    _dir.subVectors(e, o);
    const length = _dir.length();
    _dir.normalize();
    _mid.addVectors(o, e).multiplyScalar(0.5);

    // ── Core beam (bright, thin cylinder) ──
    const coreGeo = new THREE.CylinderGeometry(0.03, 0.03, length, 4, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 1,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(_mid);
    core.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _dir);
    scene.add(core);
    this._meshes.push({ mesh: core, geo: coreGeo, mat: coreMat, baseOpacity: 1 });

    // ── Glow beam (wider, softer) ──
    const glowGeo = new THREE.CylinderGeometry(0.12, 0.12, length, 6, 1);
    const glowMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.35, depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(_mid);
    glow.quaternion.copy(core.quaternion);
    scene.add(glow);
    this._meshes.push({ mesh: glow, geo: glowGeo, mat: glowMat, baseOpacity: 0.35 });

    // ── Outer halo (very wide, very faint) ──
    const haloGeo = new THREE.CylinderGeometry(0.28, 0.28, length, 6, 1);
    const haloMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.1, depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(_mid);
    halo.quaternion.copy(core.quaternion);
    scene.add(halo);
    this._meshes.push({ mesh: halo, geo: haloGeo, mat: haloMat, baseOpacity: 0.1 });

    // ── Impact flash (big glowing sphere) ──
    const impactGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const impactMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.9, depthWrite: false,
    });
    const impact = new THREE.Mesh(impactGeo, impactMat);
    impact.position.copy(e);
    scene.add(impact);
    this._meshes.push({ mesh: impact, geo: impactGeo, mat: impactMat, baseOpacity: 0.9 });

    // ── Muzzle flash (at origin) ──
    const muzzGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const muzzMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false,
    });
    const muzzle = new THREE.Mesh(muzzGeo, muzzMat);
    muzzle.position.copy(o);
    scene.add(muzzle);
    this._meshes.push({ mesh: muzzle, geo: muzzGeo, mat: muzzMat, baseOpacity: 0.8 });
  }

  update(dt) {
    this.timer -= dt;
    const t = Math.max(0, this.timer / this._duration);
    // Ease out for smooth fade
    const fade = t * t;
    for (const entry of this._meshes) {
      entry.mat.opacity = fade * entry.baseOpacity;
    }
    return this.timer <= 0;
  }

  dispose() {
    for (const entry of this._meshes) {
      this.scene.remove(entry.mesh);
      entry.geo.dispose();
      entry.mat.dispose();
    }
    this._meshes.length = 0;
  }
}

export class LaserWeapon {
  constructor(scene, audioManager, particleSystem) {
    this.scene = scene;
    this.audio = audioManager;
    this.particles = particleSystem;
    this.cooldownTimer = 0;
    this.activeBeams = [];
  }

  canFire() {
    return this.cooldownTimer <= 0;
  }

  getCooldownProgress() {
    if (this.cooldownTimer <= 0) return 1;
    return 1 - this.cooldownTimer / Config.weapon.cooldown;
  }

  fire(origin, direction, targets, walls, laserColor, isPlayer = true) {
    if (!this.canFire()) return null;

    this.cooldownTimer = Config.weapon.cooldown;

    if (isPlayer) {
      this.audio.playLaserFire();
    }

    let hitResult = null;
    let hitPosition = null;
    let closestDist = Config.weapon.laserRange;

    // Check hits against all targets
    for (const target of targets) {
      if (!target.model) continue;
      const result = HitZones.checkHit(origin, direction, target.model, closestDist);
      if (result && result.distance < closestDist) {
        hitResult = { ...result, target };
        closestDist = result.distance;
        hitPosition = result.position;
      }
    }

    // Check wall hit
    const wallHit = HitZones.checkHitAgainstWalls(origin, direction, walls, closestDist);
    if (wallHit && wallHit.distance < closestDist) {
      hitPosition = wallHit.position;
      closestDist = wallHit.distance;
      hitResult = null; // Wall blocked the hit
    }

    // Calculate end point
    const endPoint = hitPosition
      ? hitPosition
      : origin.clone().addScaledVector(direction, Config.weapon.laserRange);

    // Create laser beam visual
    const beam = new LaserBeam(
      this.scene,
      origin,
      endPoint,
      laserColor,
      Config.weapon.laserDuration
    );
    this.activeBeams.push(beam);

    // Particles at impact
    if (hitPosition) {
      const particleColor = hitResult ? 0xff4400 : 0x4444ff;
      this.particles.spawnHitParticles(hitPosition, particleColor, hitResult ? 14 : 6);
    }

    // Muzzle flash
    this.particles.spawnMuzzleFlash(origin, direction);

    return hitResult;
  }

  update(dt) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }

    for (let i = this.activeBeams.length - 1; i >= 0; i--) {
      if (this.activeBeams[i].update(dt)) {
        this.activeBeams[i].dispose();
        this.activeBeams.splice(i, 1);
      }
    }
  }

  dispose() {
    for (const beam of this.activeBeams) {
      beam.dispose();
    }
    this.activeBeams.length = 0;
  }
}
