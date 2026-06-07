import * as THREE from 'three';
import { Config } from './Config.js';

const _raycaster = new THREE.Raycaster();

export class HitZones {
  static checkHit(origin, direction, targetModel, maxRange) {
    _raycaster.set(origin, direction);
    _raycaster.far = maxRange || Config.weapon.laserRange;

    const targets = targetModel.getHitTargets();
    const intersections = _raycaster.intersectObjects(targets, false);

    if (intersections.length === 0) return null;

    const hit = intersections[0];
    const zone = hit.object.userData.hitZone;
    const zoneConfig = Config.hitZones[zone];

    if (!zoneConfig) return null;

    return {
      zone,
      points: zoneConfig.points,
      label: zoneConfig.label,
      color: zoneConfig.color,
      position: hit.point.clone(),
      distance: hit.distance,
    };
  }

  static checkHitAgainstWalls(origin, direction, walls, maxRange) {
    _raycaster.set(origin, direction);
    _raycaster.far = maxRange || Config.weapon.laserRange;

    const intersections = _raycaster.intersectObjects(walls, false);
    if (intersections.length === 0) return null;

    return {
      position: intersections[0].point.clone(),
      distance: intersections[0].distance,
    };
  }
}
