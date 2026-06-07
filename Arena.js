import * as THREE from 'three';
import { Config } from './Config.js';

const GRID_SIZE = 20;
const CELL = 5;
const HALF = (GRID_SIZE * CELL) / 2;

// 1 = full wall, 2 = half wall (cover), 0 = open
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,1,0,0,1,1,1,1,0,0,1,1,1,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,0,1,0,0,1,1,0,0,0,0,1,1,0,0,1,0,0,1],
  [1,0,0,0,0,0,1,0,0,2,2,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,1],
  [1,0,0,0,1,0,2,0,0,0,0,0,0,2,0,1,0,0,0,1],
  [1,0,0,0,1,0,2,0,0,0,0,0,0,2,0,1,0,0,0,1],
  [1,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,2,2,0,0,1,0,0,0,0,0,1],
  [1,0,0,1,0,0,1,1,0,0,0,0,1,1,0,0,1,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,0,1,1,1,0,0,1,1,1,1,0,0,1,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ═══════════════════════════════════════════════
// SHARED MATERIALS — created once, reused everywhere
// ═══════════════════════════════════════════════
const wallMat = new THREE.MeshLambertMaterial({ color: 0x1a1a35, emissive: 0x0d0d20, emissiveIntensity: 0.6 });
const coverMat = new THREE.MeshLambertMaterial({ color: 0x1e1e3d, emissive: 0x101025, emissiveIntensity: 0.7 });
const neonBasic = (color) => new THREE.MeshBasicMaterial({ color });
const neonTransparent = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
const floorGridMat = new THREE.MeshBasicMaterial({ color: 0x1a0055, transparent: true, opacity: 0.4 });

// Structural materials
const platformMat = new THREE.MeshLambertMaterial({ color: 0x151530, emissive: 0x0a0a1a, emissiveIntensity: 0.6 });
const rampMat = new THREE.MeshLambertMaterial({ color: 0x161635, emissive: 0x0b0b1a, emissiveIntensity: 0.5 });
const pillarMat = new THREE.MeshLambertMaterial({ color: 0x181840, emissive: 0x0c0c22, emissiveIntensity: 0.7 });
const railMat = new THREE.MeshBasicMaterial({ color: 0x222255, transparent: true, opacity: 0.6 });
const panelBgMat = new THREE.MeshLambertMaterial({ color: 0x0e0e25, emissive: 0x070712, emissiveIntensity: 0.5 });
const partialCeilMat = new THREE.MeshLambertMaterial({ color: 0x101020, emissive: 0x080810, emissiveIntensity: 0.4, side: THREE.DoubleSide });
const crateMat = new THREE.MeshLambertMaterial({ color: 0x222245, emissive: 0x101025, emissiveIntensity: 0.5 });

// Zone colors — 4 quadrants with distinct themes
const ZONE_THEMES = {
  NW: { primary: 0x0066ff, accent: 0x00aaff, glow: 0x0044cc, name: 'SECTOR A' },
  NE: { primary: 0x00ff66, accent: 0x44ffaa, glow: 0x00cc44, name: 'SECTOR B' },
  SW: { primary: 0x9900ff, accent: 0xcc44ff, glow: 0x7700cc, name: 'SECTOR C' },
  SE: { primary: 0xff0066, accent: 0xff4499, glow: 0xcc0044, name: 'SECTOR D' },
};

// Geometry cache — share geometries for identical shapes
const _geoCache = {};
function cachedBox(w, h, d) {
  const key = `${w}_${h}_${d}`;
  if (!_geoCache[key]) _geoCache[key] = new THREE.BoxGeometry(w, h, d);
  return _geoCache[key];
}
function cachedPlane(w, h) {
  const key = `p_${w}_${h}`;
  if (!_geoCache[key]) _geoCache[key] = new THREE.PlaneGeometry(w, h);
  return _geoCache[key];
}

export class Arena {
  constructor(scene) {
    this.scene = scene;
    this.collisionWalls = [];
    this.wallBoxes = [];
    this.layout = MAZE;
    this.navPoints = [];
    this.spawnPoints = { player: [], enemy: [] };
    this._platformBoxes = []; // Platform collision separate for ground check
  }

  build() {
    this._buildFloorAndCeiling();
    this._generateMaze();
    this._buildNeonWallStrips();
    this._buildFloorNeonGrid();
    this._buildCeilingFixtures();
    this._buildAmbientLighting();

    // ═══ NEW VISUAL SYSTEMS ═══
    this._buildMezzanines();
    this._buildRamps();
    this._buildPartialCeilings();
    this._buildPillars();
    this._buildFloorMarkings();
    this._buildWallPanels();
    this._buildDecorativeElements();
    this._buildCentralArenaFeature();
    this._buildCorridorLighting();
    this._buildHazardZones();
    this._buildWallNeonAccents();

    this._defineSpawnPoints();
    this._generateNavPoints();
    this._cacheWallBoxes();
  }

  // ════════════════════════════════════════════════════════════
  // MAZE GENERATION (merged wall runs)
  // ════════════════════════════════════════════════════════════

  _generateMaze() {
    for (let row = 0; row < GRID_SIZE; row++) {
      let col = 0;
      while (col < GRID_SIZE) {
        const type = this.layout[row][col];
        if (type === 0) { col++; continue; }

        let end = col + 1;
        while (end < GRID_SIZE && this.layout[row][end] === type) end++;
        const len = end - col;

        const w = len * CELL + 0.1;
        const d = CELL + 0.1;
        const h = type === 1 ? Config.arena.wallHeight : 3.2;
        const x = (col + len / 2) * CELL - HALF;
        const z = (row + 0.5) * CELL - HALF;

        this._createWallBlock(x, z, w, d, h, type);
        col = end;
      }
    }
  }

  _createWallBlock(x, z, w, d, h, type) {
    const iscover = type === 2;

    // Wall mesh — LambertMaterial (cheap lighting)
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, iscover ? coverMat : wallMat);
    mesh.position.set(x, h / 2, z);
    this.scene.add(mesh);
    this.collisionWalls.push(mesh);

    // Side neon strips (MeshBasicMaterial — zero lighting cost)
    const zone = this._getZone(x, z);
    const stripColor = iscover ? 0x00cc88 : zone.primary;
    const stripMat = neonBasic(stripColor);

    if (!iscover && h > 4) {
      // Front + back horizontal neon at eye level
      const stripGeo = cachedBox(w, 0.08, 0.04);
      const stripF = new THREE.Mesh(stripGeo, stripMat);
      stripF.position.set(x, 1.2, z + d / 2 + 0.02);
      this.scene.add(stripF);

      const stripB = new THREE.Mesh(stripGeo, stripMat);
      stripB.position.set(x, 1.2, z - d / 2 - 0.02);
      this.scene.add(stripB);

      // SECOND neon strip at higher position
      const strip2Geo = cachedBox(w, 0.06, 0.04);
      const strip2Mat = neonBasic(zone.accent);
      const strip2F = new THREE.Mesh(strip2Geo, strip2Mat);
      strip2F.position.set(x, h * 0.7, z + d / 2 + 0.02);
      this.scene.add(strip2F);
      const strip2B = new THREE.Mesh(strip2Geo, strip2Mat);
      strip2B.position.set(x, h * 0.7, z - d / 2 - 0.02);
      this.scene.add(strip2B);

      // Top edge neon
      const topGeo = cachedBox(w + 0.02, 0.06, d + 0.02);
      const topEdge = new THREE.Mesh(topGeo, neonBasic(zone.glow));
      topEdge.position.set(x, h + 0.03, z);
      this.scene.add(topEdge);

      // Corner accent dots (small neon cubes at wall corners)
      if (w > CELL * 1.5) {
        const dotGeo = cachedBox(0.15, 0.15, 0.15);
        const dotMat = neonBasic(zone.accent);
        for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) {
          for (const dz of [-d / 2 - 0.02, d / 2 + 0.02]) {
            const dot = new THREE.Mesh(dotGeo, dotMat);
            dot.position.set(x + dx, 0.5, z + dz);
            this.scene.add(dot);
          }
        }
      }
    } else if (iscover) {
      // Cover walls — bright top edge + side accents
      const topGeo = cachedBox(w + 0.02, 0.06, d + 0.02);
      const topEdge = new THREE.Mesh(topGeo, neonBasic(0x00cc88));
      topEdge.position.set(x, h + 0.03, z);
      this.scene.add(topEdge);

      // Diagonal neon stripe on cover
      const stripeGeo = cachedBox(w * 0.5, 0.05, 0.04);
      const stripe = new THREE.Mesh(stripeGeo, neonBasic(0x00ffaa));
      stripe.position.set(x, h * 0.5, z + d / 2 + 0.02);
      stripe.rotation.z = 0.3;
      this.scene.add(stripe);
    }
  }

  _getZone(x, z) {
    if (x < 0 && z < 0) return ZONE_THEMES.NW;
    if (x >= 0 && z < 0) return ZONE_THEMES.NE;
    if (x < 0 && z >= 0) return ZONE_THEMES.SW;
    return ZONE_THEMES.SE;
  }

  _zoneColor(x, z) {
    return this._getZone(x, z).primary;
  }

  // ════════════════════════════════════════════════════════════
  // FLOOR & CEILING
  // ════════════════════════════════════════════════════════════

  _buildFloorAndCeiling() {
    const size = GRID_SIZE * CELL;

    // Main floor — darker with slight texture feel
    const floorGeo = new THREE.PlaneGeometry(size, size);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x080812 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // Floor sub-grid (fine detail lines every CELL)
    const subGridMat = neonTransparent(0x0a0022, 0.15);
    for (let i = -HALF; i <= HALF; i += CELL) {
      const hGeo = cachedPlane(size, 0.02);
      const hLine = new THREE.Mesh(hGeo, subGridMat);
      hLine.rotation.x = -Math.PI / 2;
      hLine.position.set(0, 0.003, i);
      this.scene.add(hLine);

      const vGeo = cachedPlane(0.02, size);
      const vLine = new THREE.Mesh(vGeo, subGridMat);
      vLine.rotation.x = -Math.PI / 2;
      vLine.position.set(i, 0.003, 0);
      this.scene.add(vLine);
    }

    // Ceiling with subtle panel pattern
    const ceilGeo = new THREE.PlaneGeometry(size, size);
    const ceilMat = new THREE.MeshBasicMaterial({ color: 0x080812, side: THREE.BackSide });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = -Math.PI / 2;
    ceil.position.y = Config.arena.ceilingHeight;
    this.scene.add(ceil);

    // Ceiling panel grid (subtle darker lines)
    const ceilGridMat = neonTransparent(0x020204, 0.3);
    for (let x = -HALF + CELL * 2; x <= HALF; x += CELL * 2) {
      const geo = cachedPlane(0.08, size);
      const line = new THREE.Mesh(geo, ceilGridMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, Config.arena.ceilingHeight - 0.01, 0);
      this.scene.add(line);
    }
    for (let z = -HALF + CELL * 2; z <= HALF; z += CELL * 2) {
      const geo = cachedPlane(size, 0.08);
      const line = new THREE.Mesh(geo, ceilGridMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, Config.arena.ceilingHeight - 0.01, z);
      this.scene.add(line);
    }
  }

  // ════════════════════════════════════════════════════════════
  // NEON WALL STRIPS (vertical accents on wall faces)
  // ════════════════════════════════════════════════════════════

  _buildNeonWallStrips() {
    for (let row = 1; row < GRID_SIZE - 1; row++) {
      for (let col = 1; col < GRID_SIZE - 1; col++) {
        if (this.layout[row][col] !== 1) continue;
        if ((row + col) % 3 !== 0) continue;

        const x = (col + 0.5) * CELL - HALF;
        const z = (row + 0.5) * CELL - HALF;
        const h = Config.arena.wallHeight;
        const zone = this._getZone(x, z);
        const mat = neonBasic(zone.primary);

        const neighbors = [
          [row - 1, col, x, z - CELL / 2 - 0.02, 0],
          [row + 1, col, x, z + CELL / 2 + 0.02, 0],
          [row, col - 1, x - CELL / 2 - 0.02, z, 1],
          [row, col + 1, x + CELL / 2 + 0.02, z, 1],
        ];

        for (const [nr, nc, nx, nz, orient] of neighbors) {
          if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
          if (this.layout[nr][nc] !== 0) continue;

          // Main vertical strip
          const stripGeo = orient === 0
            ? cachedBox(0.06, h * 0.6, 0.04)
            : cachedBox(0.04, h * 0.6, 0.06);
          const strip = new THREE.Mesh(stripGeo, mat);
          strip.position.set(nx, h * 0.4, nz);
          this.scene.add(strip);

          // Small accent strip beside it (thinner, different shade)
          const accentGeo = orient === 0
            ? cachedBox(0.03, h * 0.3, 0.04)
            : cachedBox(0.04, h * 0.3, 0.03);
          const accent = new THREE.Mesh(accentGeo, neonBasic(zone.accent));
          accent.position.set(
            nx + (orient === 0 ? 0.3 : 0),
            h * 0.25,
            nz + (orient === 1 ? 0.3 : 0)
          );
          this.scene.add(accent);
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // FLOOR NEON GRID
  // ════════════════════════════════════════════════════════════

  _buildFloorNeonGrid() {
    // Major grid lines (every 2 cells)
    for (let z = -HALF + CELL * 2; z < HALF; z += CELL * 2) {
      const geo = cachedPlane(GRID_SIZE * CELL, 0.04);
      const line = new THREE.Mesh(geo, floorGridMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.004, z);
      this.scene.add(line);
    }
    for (let x = -HALF + CELL * 2; x < HALF; x += CELL * 2) {
      const geo = cachedPlane(0.04, GRID_SIZE * CELL);
      const line = new THREE.Mesh(geo, floorGridMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.004, 0);
      this.scene.add(line);
    }

    // Axis lines (brighter, along center)
    const axisMat = neonTransparent(0x00ff88, 0.2);
    const axisH = new THREE.Mesh(cachedPlane(GRID_SIZE * CELL, 0.08), axisMat);
    axisH.rotation.x = -Math.PI / 2;
    axisH.position.set(0, 0.005, 0);
    this.scene.add(axisH);
    const axisV = new THREE.Mesh(cachedPlane(0.08, GRID_SIZE * CELL), axisMat);
    axisV.rotation.x = -Math.PI / 2;
    axisV.position.set(0, 0.005, 0);
    this.scene.add(axisV);

    // Center circle (multi-ring)
    this._buildFloorCircle(0, 0, 6, 0x00ff88, 0.4, 20);
    this._buildFloorCircle(0, 0, 8, 0x00ff88, 0.15, 24);
    this._buildFloorCircle(0, 0, 4, 0x00ffcc, 0.5, 16);

    // Zone border circles in each quadrant center
    this._buildFloorCircle(-25, -25, 3, ZONE_THEMES.NW.primary, 0.25, 12);
    this._buildFloorCircle( 25, -25, 3, ZONE_THEMES.NE.primary, 0.25, 12);
    this._buildFloorCircle(-25,  25, 3, ZONE_THEMES.SW.primary, 0.25, 12);
    this._buildFloorCircle( 25,  25, 3, ZONE_THEMES.SE.primary, 0.25, 12);
  }

  _buildFloorCircle(cx, cz, radius, color, opacity, segs) {
    const cMat = neonTransparent(color, opacity);
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * Math.PI * 2;
      const a2 = ((i + 1) / segs) * Math.PI * 2;
      const x1 = Math.cos(a1) * radius, z1 = Math.sin(a1) * radius;
      const x2 = Math.cos(a2) * radius, z2 = Math.sin(a2) * radius;
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const geo = cachedPlane(len, 0.06);
      const seg = new THREE.Mesh(geo, cMat);
      seg.rotation.x = -Math.PI / 2;
      seg.rotation.z = -Math.atan2(dz, dx);
      seg.position.set(cx + (x1 + x2) / 2, 0.005, cz + (z1 + z2) / 2);
      this.scene.add(seg);
    }
  }

  // ════════════════════════════════════════════════════════════
  // CEILING FIXTURES (emissive only — NO PointLights)
  // ════════════════════════════════════════════════════════════

  _buildCeilingFixtures() {
    const placed = [];
    const ch = Config.arena.ceilingHeight;

    for (let row = 1; row < GRID_SIZE - 1; row++) {
      for (let col = 1; col < GRID_SIZE - 1; col++) {
        if (this.layout[row][col] !== 0) continue;

        let openNeighbors = 0;
        if (this.layout[row - 1][col] === 0) openNeighbors++;
        if (this.layout[row + 1][col] === 0) openNeighbors++;
        if (this.layout[row][col - 1] === 0) openNeighbors++;
        if (this.layout[row][col + 1] === 0) openNeighbors++;

        if (openNeighbors >= 3 || (row % 4 === 0 && col % 4 === 0 && openNeighbors >= 2)) {
          const x = (col + 0.5) * CELL - HALF;
          const z = (row + 0.5) * CELL - HALF;

          const tooClose = placed.some(
            (p) => Math.abs(p.x - x) < CELL * 2.5 && Math.abs(p.z - z) < CELL * 2.5
          );
          if (tooClose) continue;

          const zone = this._getZone(x, z);

          // Main ceiling panel (larger, more pronounced)
          const fixtureGeo = cachedBox(1.2, 0.1, 1.2);
          const fixture = new THREE.Mesh(fixtureGeo, neonBasic(zone.primary));
          fixture.position.set(x, ch - 0.06, z);
          this.scene.add(fixture);

          // Inner glow panel (brighter accent)
          const innerGeo = cachedBox(0.6, 0.12, 0.6);
          const inner = new THREE.Mesh(innerGeo, neonBasic(zone.accent));
          inner.position.set(x, ch - 0.08, z);
          this.scene.add(inner);

          // Hanging light beam (thin vertical line down from fixture)
          const beamGeo = cachedBox(0.04, 1.5, 0.04);
          const beam = new THREE.Mesh(beamGeo, neonTransparent(zone.primary, 0.3));
          beam.position.set(x, ch - 0.8, z);
          this.scene.add(beam);

          // Floor glow spot beneath fixture (larger, softer)
          const spotGeo = cachedPlane(4, 4);
          const spotMat = neonTransparent(zone.primary, 0.06);
          const spot = new THREE.Mesh(spotGeo, spotMat);
          spot.rotation.x = -Math.PI / 2;
          spot.position.set(x, 0.006, z);
          this.scene.add(spot);

          // Secondary smaller glow spot
          const spot2Geo = cachedPlane(2, 2);
          const spot2Mat = neonTransparent(zone.accent, 0.1);
          const spot2 = new THREE.Mesh(spot2Geo, spot2Mat);
          spot2.rotation.x = -Math.PI / 2;
          spot2.position.set(x, 0.007, z);
          this.scene.add(spot2);

          placed.push({ x, z });
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // AMBIENT LIGHTING
  // ════════════════════════════════════════════════════════════

  _buildAmbientLighting() {
    // Strong ambient — laser arena must be well-lit
    const ambient = new THREE.AmbientLight(0x556699, 2.5);
    this.scene.add(ambient);

    // Hemisphere light for natural indoor feel (sky=cool blue, ground=dark)
    const hemi = new THREE.HemisphereLight(0x334477, 0x111122, 0.8);
    this.scene.add(hemi);

    // Strong directional from above-center
    const dir = new THREE.DirectionalLight(0x6688aa, 1.0);
    dir.position.set(20, Config.arena.ceilingHeight, 20);
    this.scene.add(dir);

    // Secondary directional from opposite side
    const dir2 = new THREE.DirectionalLight(0x556699, 0.8);
    dir2.position.set(-20, Config.arena.ceilingHeight, -20);
    this.scene.add(dir2);

    // Third directional for cross lighting
    const dir3 = new THREE.DirectionalLight(0x446688, 0.6);
    dir3.position.set(30, Config.arena.ceilingHeight, -30);
    this.scene.add(dir3);

    // Fourth directional from opposite cross
    const dir4 = new THREE.DirectionalLight(0x335577, 0.5);
    dir4.position.set(-30, Config.arena.ceilingHeight, 30);
    this.scene.add(dir4);

    // Very light fog — just for depth, not obscuring
    this.scene.fog = new THREE.FogExp2(0x050510, 0.004);
  }

  // ════════════════════════════════════════════════════════════
  // ★★ MEZZANINES — Raised tactical platforms ★★
  // ════════════════════════════════════════════════════════════

  _buildMezzanines() {
    const platformH = 1.4; // Jump-reachable height (max jump ~1.88)
    const ch = Config.arena.ceilingHeight;

    // 4 mezzanine platforms in open areas near corners
    const mezzanines = [
      // NW corner — row 1-2, col 1-2 (open area)
      { x: -42.5, z: -42.5, w: 8, d: 8, zone: ZONE_THEMES.NW },
      // NE corner
      { x: 42.5, z: -42.5, w: 8, d: 8, zone: ZONE_THEMES.NE },
      // SW corner
      { x: -42.5, z: 42.5, w: 8, d: 8, zone: ZONE_THEMES.SW },
      // SE corner
      { x: 42.5, z: 42.5, w: 8, d: 8, zone: ZONE_THEMES.SE },
    ];

    for (const m of mezzanines) {
      // Platform solid block
      const platGeo = new THREE.BoxGeometry(m.w, platformH, m.d);
      const plat = new THREE.Mesh(platGeo, platformMat);
      plat.position.set(m.x, platformH / 2, m.z);
      this.scene.add(plat);
      this.collisionWalls.push(plat);

      // Platform top surface neon edge (outline)
      const edgeW = neonBasic(m.zone.primary);
      // Front edge
      this.scene.add(this._makeEdge(m.x, platformH + 0.03, m.z - m.d / 2, m.w, 0.05, 0.05, edgeW));
      // Back edge
      this.scene.add(this._makeEdge(m.x, platformH + 0.03, m.z + m.d / 2, m.w, 0.05, 0.05, edgeW));
      // Left edge
      this.scene.add(this._makeEdge(m.x - m.w / 2, platformH + 0.03, m.z, 0.05, 0.05, m.d, edgeW));
      // Right edge
      this.scene.add(this._makeEdge(m.x + m.w / 2, platformH + 0.03, m.z, 0.05, 0.05, m.d, edgeW));

      // Railings on 2 outer edges (waist-height barriers)
      const railH = 1.0;
      const railY = platformH + railH / 2;
      // Outer X edge
      const railGeo1 = cachedBox(m.w + 0.2, railH, 0.08);
      const outerXDir = m.z < 0 ? -1 : 1;
      const rail1 = new THREE.Mesh(railGeo1, railMat);
      rail1.position.set(m.x, railY, m.z + outerXDir * m.d / 2);
      this.scene.add(rail1);

      // Outer Z edge
      const railGeo2 = cachedBox(0.08, railH, m.d + 0.2);
      const outerZDir = m.x < 0 ? -1 : 1;
      const rail2 = new THREE.Mesh(railGeo2, railMat);
      rail2.position.set(m.x + outerZDir * m.w / 2, railY, m.z);
      this.scene.add(rail2);

      // Railing neon strip on top of railing
      const rnGeo1 = cachedBox(m.w + 0.2, 0.04, 0.1);
      const rn1 = new THREE.Mesh(rnGeo1, neonBasic(m.zone.accent));
      rn1.position.set(m.x, platformH + railH + 0.02, m.z + outerXDir * m.d / 2);
      this.scene.add(rn1);
      const rnGeo2 = cachedBox(0.1, 0.04, m.d + 0.2);
      const rn2 = new THREE.Mesh(rnGeo2, neonBasic(m.zone.accent));
      rn2.position.set(m.x + outerZDir * m.w / 2, platformH + railH + 0.02, m.z);
      this.scene.add(rn2);

      // Platform glow on ground below
      const glowGeo = cachedPlane(m.w + 2, m.d + 2);
      const glow = new THREE.Mesh(glowGeo, neonTransparent(m.zone.glow, 0.05));
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(m.x, 0.008, m.z);
      this.scene.add(glow);

      // Side neon accent strip on platform body
      const sideGeo = cachedBox(m.w, 0.06, 0.04);
      const sideMat = neonBasic(m.zone.primary);
      const side1 = new THREE.Mesh(sideGeo, sideMat);
      side1.position.set(m.x, platformH * 0.4, m.z - m.d / 2 - 0.02);
      this.scene.add(side1);
      const side2 = new THREE.Mesh(sideGeo, sideMat);
      side2.position.set(m.x, platformH * 0.4, m.z + m.d / 2 + 0.02);
      this.scene.add(side2);
    }
  }

  _makeEdge(x, y, z, w, h, d, mat) {
    const geo = cachedBox(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // ════════════════════════════════════════════════════════════
  // ★★ RAMPS — Stepped access to mezzanines ★★
  // ════════════════════════════════════════════════════════════

  _buildRamps() {
    const platformH = 1.4;
    const steps = 4;
    const stepH = platformH / steps;

    // Ramp positions — one ramp leading to each mezzanine
    // Each ramp is a series of steps (small boxes at increasing height)
    const ramps = [
      // NW: ramp going +X (from inside arena toward platform)
      { cx: -42.5, cz: -42.5, dir: 'x+', zone: ZONE_THEMES.NW },
      // NE: ramp going -X
      { cx: 42.5, cz: -42.5, dir: 'x-', zone: ZONE_THEMES.NE },
      // SW: ramp going +X
      { cx: -42.5, cz: 42.5, dir: 'x+', zone: ZONE_THEMES.SW },
      // SE: ramp going -X
      { cx: 42.5, cz: 42.5, dir: 'x-', zone: ZONE_THEMES.SE },
    ];

    for (const r of ramps) {
      const stepW = 3; // Width of ramp
      const stepD = 1.5; // Depth of each step

      for (let i = 0; i < steps; i++) {
        const h = stepH * (i + 1);
        const offset = (i - steps / 2 + 0.5) * stepD;
        const dx = r.dir === 'x+' ? r.cx + 4 + offset * 1 : r.cx - 4 - offset * 1;
        const dz = r.cz;

        const stepGeo = new THREE.BoxGeometry(stepD, h, stepW);
        const stepMesh = new THREE.Mesh(stepGeo, rampMat);
        stepMesh.position.set(dx, h / 2, dz);
        this.scene.add(stepMesh);
        this.collisionWalls.push(stepMesh);

        // Step edge neon
        const edgeMat = neonBasic(r.zone.accent);
        const edgeGeo = cachedBox(stepD + 0.02, 0.04, stepW + 0.02);
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.set(dx, h + 0.02, dz);
        this.scene.add(edge);
      }

      // Ramp direction indicator on floor
      const arrowMat = neonTransparent(r.zone.primary, 0.3);
      const arrowGeo = cachedPlane(2, 0.15);
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.rotation.x = -Math.PI / 2;
      const arrowX = r.dir === 'x+' ? r.cx + 4 + steps * 0.8 : r.cx - 4 - steps * 0.8;
      arrow.position.set(arrowX, 0.008, r.cz);
      this.scene.add(arrow);
    }
  }

  // ════════════════════════════════════════════════════════════
  // ★★ PARTIAL CEILINGS — Lower ceiling sections over corridors ★★
  // ════════════════════════════════════════════════════════════

  _buildPartialCeilings() {
    const ch = Config.arena.ceilingHeight;
    const lowCH = 5.5; // Lower ceiling height

    // Partial ceilings over specific corridor sections
    const sections = [
      // Horizontal corridors
      { x: 0, z: -37.5, w: 20, d: 5 },   // Top center
      { x: 0, z: 37.5, w: 20, d: 5 },    // Bottom center
      // Vertical corridors
      { x: -37.5, z: 0, w: 5, d: 20 },   // Left center
      { x: 37.5, z: 0, w: 5, d: 20 },    // Right center
      // Inner cross corridors
      { x: -17.5, z: -17.5, w: 8, d: 3 },
      { x: 17.5, z: -17.5, w: 8, d: 3 },
      { x: -17.5, z: 17.5, w: 8, d: 3 },
      { x: 17.5, z: 17.5, w: 8, d: 3 },
    ];

    for (const s of sections) {
      // Lower ceiling panel
      const ceilGeo = cachedPlane(s.w, s.d);
      const ceil = new THREE.Mesh(ceilGeo, partialCeilMat);
      ceil.rotation.x = -Math.PI / 2;
      ceil.position.set(s.x, lowCH, s.z);
      this.scene.add(ceil);

      // Edge neon on the lower ceiling
      const zone = this._getZone(s.x, s.z);
      const edgeMat = neonBasic(zone.glow);

      // Front and back edges
      const feGeo = cachedBox(s.w, 0.04, 0.04);
      const fe = new THREE.Mesh(feGeo, edgeMat);
      fe.position.set(s.x, lowCH - 0.02, s.z - s.d / 2);
      this.scene.add(fe);
      const be = new THREE.Mesh(feGeo, edgeMat);
      be.position.set(s.x, lowCH - 0.02, s.z + s.d / 2);
      this.scene.add(be);

      // Left and right edges
      const seGeo = cachedBox(0.04, 0.04, s.d);
      const le = new THREE.Mesh(seGeo, edgeMat);
      le.position.set(s.x - s.w / 2, lowCH - 0.02, s.z);
      this.scene.add(le);
      const re = new THREE.Mesh(seGeo, edgeMat);
      re.position.set(s.x + s.w / 2, lowCH - 0.02, s.z);
      this.scene.add(re);

      // Underside glow strip
      const glowGeo = cachedBox(s.w * 0.6, 0.03, 0.06);
      const glowStrip = new THREE.Mesh(glowGeo, neonTransparent(zone.accent, 0.5));
      glowStrip.position.set(s.x, lowCH - 0.05, s.z);
      this.scene.add(glowStrip);
    }
  }

  // ════════════════════════════════════════════════════════════
  // ★★ PILLARS — Structural columns at intersections ★★
  // ════════════════════════════════════════════════════════════

  _buildPillars() {
    const ch = Config.arena.ceilingHeight;

    // Place pillars at key intersections (open cells with 2+ walls nearby)
    const pillarSpots = [
      // Central cross intersections
      { x: -12.5, z: -12.5 }, { x: 12.5, z: -12.5 },
      { x: -12.5, z: 12.5 },  { x: 12.5, z: 12.5 },
      // Mid-corridor markers
      { x: -32.5, z: -22.5 }, { x: 32.5, z: -22.5 },
      { x: -32.5, z: 22.5 },  { x: 32.5, z: 22.5 },
      // Near center
      { x: -7.5, z: 0 }, { x: 7.5, z: 0 },
      { x: 0, z: -7.5 }, { x: 0, z: 7.5 },
    ];

    for (const p of pillarSpots) {
      // Check grid is open
      const gc = this.worldToGrid(p.x, p.z);
      if (this.layout[gc.row]?.[gc.col] !== 0) continue;

      const zone = this._getZone(p.x, p.z);

      // Main pillar body (octagonal approximation using cylinder)
      const pillarGeo = cachedBox(0.6, ch, 0.6);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(p.x, ch / 2, p.z);
      this.scene.add(pillar);
      this.collisionWalls.push(pillar);

      // Pillar base (wider)
      const baseGeo = cachedBox(1.0, 0.3, 1.0);
      const base = new THREE.Mesh(baseGeo, pillarMat);
      base.position.set(p.x, 0.15, p.z);
      this.scene.add(base);

      // Base neon ring
      const baseNeon = cachedBox(1.05, 0.06, 1.05);
      const baseGlow = new THREE.Mesh(baseNeon, neonBasic(zone.primary));
      baseGlow.position.set(p.x, 0.33, p.z);
      this.scene.add(baseGlow);

      // Pillar capital (wider top)
      const capGeo = cachedBox(0.9, 0.2, 0.9);
      const cap = new THREE.Mesh(capGeo, pillarMat);
      cap.position.set(p.x, ch - 0.1, p.z);
      this.scene.add(cap);

      // Vertical neon strips on pillar (4 sides)
      const stripH = ch * 0.7;
      const stripGeo = cachedBox(0.04, stripH, 0.04);
      const stripMat = neonBasic(zone.accent);
      for (const [dx, dz] of [[0.32, 0], [-0.32, 0], [0, 0.32], [0, -0.32]]) {
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.set(p.x + dx, ch * 0.4, p.z + dz);
        this.scene.add(strip);
      }

      // Mid-height accent ring
      const ringGeo = cachedBox(0.7, 0.05, 0.7);
      const ring = new THREE.Mesh(ringGeo, neonBasic(zone.primary));
      ring.position.set(p.x, ch * 0.5, p.z);
      this.scene.add(ring);
    }
  }

  // ════════════════════════════════════════════════════════════
  // ★★ FLOOR MARKINGS — Zone indicators, hazard lines, arrows ★★
  // ════════════════════════════════════════════════════════════

  _buildFloorMarkings() {
    // Zone labels (colored rectangles marking each quadrant)
    const zoneMark = [
      { x: -30, z: -30, zone: ZONE_THEMES.NW },
      { x: 30, z: -30, zone: ZONE_THEMES.NE },
      { x: -30, z: 30, zone: ZONE_THEMES.SW },
      { x: 30, z: 30, zone: ZONE_THEMES.SE },
    ];

    for (const zm of zoneMark) {
      // Zone colored rectangle
      const rectGeo = cachedPlane(6, 6);
      const rect = new THREE.Mesh(rectGeo, neonTransparent(zm.zone.primary, 0.06));
      rect.rotation.x = -Math.PI / 2;
      rect.position.set(zm.x, 0.004, zm.z);
      this.scene.add(rect);

      // Zone border
      this._buildFloorCircle(zm.x, zm.z, 4.5, zm.zone.primary, 0.3, 16);

      // Inner diamond shape (4 floor lines)
      const dSize = 3;
      const dMat = neonTransparent(zm.zone.accent, 0.35);
      const corners = [
        [zm.x, zm.z - dSize], [zm.x + dSize, zm.z],
        [zm.x, zm.z + dSize], [zm.x - dSize, zm.z],
      ];
      for (let i = 0; i < 4; i++) {
        const [x1, z1] = corners[i];
        const [x2, z2] = corners[(i + 1) % 4];
        const dx = x2 - x1, dz = z2 - z1;
        const len = Math.sqrt(dx * dx + dz * dz);
        const geo = cachedPlane(len, 0.05);
        const seg = new THREE.Mesh(geo, dMat);
        seg.rotation.x = -Math.PI / 2;
        seg.rotation.z = -Math.atan2(dz, dx);
        seg.position.set((x1 + x2) / 2, 0.006, (z1 + z2) / 2);
        this.scene.add(seg);
      }
    }

    // Corridor directional lines (dashed lines along corridors)
    const dashMat = neonTransparent(0x00cc88, 0.2);
    // Horizontal corridor dashes
    for (const z of [-37.5, 37.5]) {
      for (let x = -35; x < 35; x += 4) {
        const dash = new THREE.Mesh(cachedPlane(1.5, 0.04), dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.005, z);
        this.scene.add(dash);
      }
    }
    // Vertical corridor dashes
    for (const x of [-37.5, 37.5]) {
      for (let z = -35; z < 35; z += 4) {
        const dash = new THREE.Mesh(cachedPlane(0.04, 1.5), dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.005, z);
        this.scene.add(dash);
      }
    }

    // Spawn zone markers (small + shapes at spawn points)
    const spawnMat = neonTransparent(0x00ffaa, 0.25);
    const allSpawns = [...this.spawnPoints.player, ...this.spawnPoints.enemy];
    // Note: spawnPoints might not be defined yet during build, so we use hardcoded positions
    const spawnPositions = [
      [-42.5,-42.5], [-22.5,-42.5], [2.5,-42.5], [37.5,-42.5],
      [-27.5,-27.5], [-42.5,-17.5], [2.5,-17.5], [-37.5,-2.5],
      [42.5,37.5], [22.5,37.5], [-2.5,37.5], [-37.5,37.5],
      [22.5,22.5], [42.5,7.5], [22.5,7.5], [37.5,-2.5],
    ];
    for (const [sx, sz] of spawnPositions) {
      // Cross mark
      const h1 = new THREE.Mesh(cachedPlane(1.5, 0.06), spawnMat);
      h1.rotation.x = -Math.PI / 2;
      h1.position.set(sx, 0.007, sz);
      this.scene.add(h1);
      const v1 = new THREE.Mesh(cachedPlane(0.06, 1.5), spawnMat);
      v1.rotation.x = -Math.PI / 2;
      v1.position.set(sx, 0.007, sz);
      this.scene.add(v1);
    }
  }

  // ════════════════════════════════════════════════════════════
  // ★★ WALL PANELS — Decorative info panels on walls ★★
  // ════════════════════════════════════════════════════════════

  _buildWallPanels() {
    const ch = Config.arena.ceilingHeight;

    // Scan for wall faces adjacent to open cells — place panels there
    const panelsPlaced = [];

    for (let row = 1; row < GRID_SIZE - 1; row++) {
      for (let col = 1; col < GRID_SIZE - 1; col++) {
        if (this.layout[row][col] !== 1) continue;

        const x = (col + 0.5) * CELL - HALF;
        const z = (row + 0.5) * CELL - HALF;

        // Check each face
        const faces = [
          { nr: row - 1, nc: col, fx: x, fz: z - CELL / 2 - 0.03, rz: 0, axis: 'z' },
          { nr: row + 1, nc: col, fx: x, fz: z + CELL / 2 + 0.03, rz: 0, axis: 'z' },
          { nr: row, nc: col - 1, fx: x - CELL / 2 - 0.03, fz: z, rz: Math.PI / 2, axis: 'x' },
          { nr: row, nc: col + 1, fx: x + CELL / 2 + 0.03, fz: z, rz: Math.PI / 2, axis: 'x' },
        ];

        for (const f of faces) {
          if (f.nr < 0 || f.nr >= GRID_SIZE || f.nc < 0 || f.nc >= GRID_SIZE) continue;
          if (this.layout[f.nr][f.nc] !== 0) continue;

          // Only place panels with some spacing
          const tooClose = panelsPlaced.some(
            p => Math.abs(p.x - f.fx) < CELL * 3 && Math.abs(p.z - f.fz) < CELL * 3
          );
          if (tooClose) continue;

          // Pseudo-random selection based on position
          const hash = Math.abs(Math.sin(f.fx * 13.37 + f.fz * 7.42) * 1000) % 1;
          if (hash > 0.5) continue; // Only place on ~50% of eligible faces

          const zone = this._getZone(f.fx, f.fz);

          // Panel background (dark rectangle)
          const panelW = 2.5;
          const panelH = 1.8;
          const panelGeo = f.axis === 'z'
            ? cachedBox(panelW, panelH, 0.05)
            : cachedBox(0.05, panelH, panelW);
          const panel = new THREE.Mesh(panelGeo, panelBgMat);
          panel.position.set(f.fx, ch * 0.45, f.fz);
          this.scene.add(panel);

          // Panel border (neon outline)
          const borderMat = neonBasic(zone.primary);
          if (f.axis === 'z') {
            // Top and bottom edges
            this.scene.add(this._makeEdge(f.fx, ch * 0.45 + panelH / 2, f.fz, panelW, 0.04, 0.06, borderMat));
            this.scene.add(this._makeEdge(f.fx, ch * 0.45 - panelH / 2, f.fz, panelW, 0.04, 0.06, borderMat));
            // Side edges
            this.scene.add(this._makeEdge(f.fx - panelW / 2, ch * 0.45, f.fz, 0.04, panelH, 0.06, borderMat));
            this.scene.add(this._makeEdge(f.fx + panelW / 2, ch * 0.45, f.fz, 0.04, panelH, 0.06, borderMat));
            // Inner horizontal line (looks like text/data)
            const lineMat = neonBasic(zone.accent);
            this.scene.add(this._makeEdge(f.fx, ch * 0.45 + 0.3, f.fz, panelW * 0.6, 0.03, 0.06, lineMat));
            this.scene.add(this._makeEdge(f.fx, ch * 0.45 - 0.1, f.fz, panelW * 0.4, 0.03, 0.06, lineMat));
            this.scene.add(this._makeEdge(f.fx - 0.3, ch * 0.45 - 0.4, f.fz, panelW * 0.3, 0.03, 0.06, lineMat));
          } else {
            // Top and bottom
            this.scene.add(this._makeEdge(f.fx, ch * 0.45 + panelH / 2, f.fz, 0.06, 0.04, panelW, borderMat));
            this.scene.add(this._makeEdge(f.fx, ch * 0.45 - panelH / 2, f.fz, 0.06, 0.04, panelW, borderMat));
            // Sides
            this.scene.add(this._makeEdge(f.fx, ch * 0.45, f.fz - panelW / 2, 0.06, panelH, 0.04, borderMat));
            this.scene.add(this._makeEdge(f.fx, ch * 0.45, f.fz + panelW / 2, 0.06, panelH, 0.04, borderMat));
            // Inner lines
            const lineMat = neonBasic(zone.accent);
            this.scene.add(this._makeEdge(f.fx, ch * 0.45 + 0.3, f.fz, 0.06, 0.03, panelW * 0.6, lineMat));
            this.scene.add(this._makeEdge(f.fx, ch * 0.45 - 0.1, f.fz, 0.06, 0.03, panelW * 0.4, lineMat));
          }

          panelsPlaced.push({ x: f.fx, z: f.fz });
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // ★★ DECORATIVE ELEMENTS — Crates, consoles, barriers ★★
  // ════════════════════════════════════════════════════════════

  _buildDecorativeElements() {
    // Tactical crates / containers in open areas
    const cratePositions = [
      // Center area flanking
      { x: -5, z: -5, s: 1.2 }, { x: 5, z: 5, s: 1.2 },
      { x: 5, z: -5, s: 0.9 }, { x: -5, z: 5, s: 0.9 },
      // Corridor junctions
      { x: -22.5, z: -2.5, s: 1.0 }, { x: 22.5, z: 2.5, s: 1.0 },
      { x: -2.5, z: -22.5, s: 1.0 }, { x: 2.5, z: 22.5, s: 1.0 },
      // Near mezzanines
      { x: -35, z: -35, s: 0.8 }, { x: 35, z: -35, s: 0.8 },
      { x: -35, z: 35, s: 0.8 }, { x: 35, z: 35, s: 0.8 },
    ];

    for (const c of cratePositions) {
      // Check grid is open
      const gc = this.worldToGrid(c.x, c.z);
      if (this.layout[gc.row]?.[gc.col] !== 0) continue;

      const zone = this._getZone(c.x, c.z);

      // Crate body
      const crateGeo = new THREE.BoxGeometry(c.s, c.s, c.s);
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(c.x, c.s / 2, c.z);
      crate.rotation.y = Math.sin(c.x * 3 + c.z * 7) * 0.3; // Slight rotation variety
      this.scene.add(crate);
      this.collisionWalls.push(crate);

      // Crate edge neon
      const edgeMat = neonBasic(zone.accent);
      const eGeo = cachedBox(c.s + 0.02, 0.03, c.s + 0.02);
      const edge = new THREE.Mesh(eGeo, edgeMat);
      edge.position.set(c.x, c.s + 0.015, c.z);
      edge.rotation.y = crate.rotation.y;
      this.scene.add(edge);

      // Small neon dot on side
      const dotGeo = cachedBox(0.1, 0.1, 0.04);
      const dot = new THREE.Mesh(dotGeo, neonBasic(zone.primary));
      dot.position.set(c.x + c.s / 2 + 0.02, c.s * 0.6, c.z);
      this.scene.add(dot);
    }

    // Console stands (tall thin stands with glowing top)
    const consoleSpots = [
      { x: -17.5, z: -7.5 }, { x: 17.5, z: -7.5 },
      { x: -17.5, z: 7.5 },  { x: 17.5, z: 7.5 },
      { x: -27.5, z: -37.5 }, { x: 27.5, z: -37.5 },
      { x: -27.5, z: 37.5 },  { x: 27.5, z: 37.5 },
    ];

    for (const cs of consoleSpots) {
      const gc = this.worldToGrid(cs.x, cs.z);
      if (this.layout[gc.row]?.[gc.col] !== 0) continue;

      const zone = this._getZone(cs.x, cs.z);

      // Stand body
      const standGeo = cachedBox(0.4, 1.2, 0.4);
      const stand = new THREE.Mesh(standGeo, pillarMat);
      stand.position.set(cs.x, 0.6, cs.z);
      this.scene.add(stand);

      // Glowing top panel
      const topGeo = cachedBox(0.6, 0.08, 0.6);
      const top = new THREE.Mesh(topGeo, neonBasic(zone.primary));
      top.position.set(cs.x, 1.24, cs.z);
      this.scene.add(top);

      // Holographic "screen" (thin glowing plane above)
      const screenGeo = cachedBox(0.5, 0.4, 0.04);
      const screenMat = neonTransparent(zone.accent, 0.4);
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(cs.x, 1.6, cs.z);
      this.scene.add(screen);
    }
  }

  // ════════════════════════════════════════════════════════════
  // ★★ CENTRAL ARENA FEATURE — Enhanced center area ★★
  // ════════════════════════════════════════════════════════════

  _buildCentralArenaFeature() {
    const ch = Config.arena.ceilingHeight;

    // Central elevated hexagonal-ish platform
    const centerH = 0.2;
    const centerR = 5;

    // Build octagon from 4 rotated rectangles (cheaper than custom geometry)
    const segMat = neonTransparent(0x001133, 0.6);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI;
      const w = centerR * 2;
      const d = centerR * 1.4;
      const geo = new THREE.BoxGeometry(w, centerH, d);
      const seg = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x0a0a1a, emissive: 0x050510 }));
      seg.position.set(0, centerH / 2, 0);
      seg.rotation.y = angle;
      this.scene.add(seg);
    }

    // Central raised diamond (smaller, higher)
    const diaGeo = new THREE.BoxGeometry(3, 0.4, 3);
    const dia = new THREE.Mesh(diaGeo, new THREE.MeshLambertMaterial({ color: 0x0f0f2a, emissive: 0x080815 }));
    dia.position.set(0, 0.2, 0);
    dia.rotation.y = Math.PI / 4;
    this.scene.add(dia);

    // Diamond neon edge
    const diaEdge = new THREE.Mesh(cachedBox(3.05, 0.05, 3.05), neonBasic(0x00ffcc));
    diaEdge.position.set(0, 0.42, 0);
    diaEdge.rotation.y = Math.PI / 4;
    this.scene.add(diaEdge);

    // Vertical beacon from center to ceiling
    const beaconGeo = cachedBox(0.08, ch, 0.08);
    const beacon = new THREE.Mesh(beaconGeo, neonTransparent(0x00ffcc, 0.15));
    beacon.position.set(0, ch / 2, 0);
    this.scene.add(beacon);

    // Ceiling feature above center (large glowing ring)
    const ringSegs = 20;
    const ringR = 5;
    const ringMat = neonTransparent(0x00ffcc, 0.5);
    for (let i = 0; i < ringSegs; i++) {
      const a1 = (i / ringSegs) * Math.PI * 2;
      const a2 = ((i + 1) / ringSegs) * Math.PI * 2;
      const x1 = Math.cos(a1) * ringR, z1 = Math.sin(a1) * ringR;
      const x2 = Math.cos(a2) * ringR, z2 = Math.sin(a2) * ringR;
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const geo = cachedBox(len, 0.08, 0.08);
      const seg = new THREE.Mesh(geo, ringMat);
      seg.position.set((x1 + x2) / 2, ch - 0.15, (z1 + z2) / 2);
      seg.rotation.y = -Math.atan2(dz, dx);
      this.scene.add(seg);
    }

    // 4 radial floor lines from center to zone borders
    const radialMat = neonTransparent(0x00ff88, 0.2);
    for (const angle of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) {
      const len = 30;
      const geo = cachedPlane(len, 0.04);
      const line = new THREE.Mesh(geo, radialMat);
      line.rotation.x = -Math.PI / 2;
      line.rotation.z = -angle;
      line.position.set(Math.cos(angle) * len / 2, 0.006, Math.sin(angle) * len / 2);
      this.scene.add(line);
    }
  }

  // ════════════════════════════════════════════════════════════
  // ★★ CORRIDOR LIGHTING — Extra neon accents in corridors ★★
  // ════════════════════════════════════════════════════════════

  _buildCorridorLighting() {
    const ch = Config.arena.ceilingHeight;

    // Wall-mounted light fixtures along border walls
    for (let i = 0; i < GRID_SIZE; i++) {
      if (i % 3 !== 0) continue;

      const pos = (i + 0.5) * CELL - HALF;

      // North wall (row 0) — lights facing south
      if (this.layout[1]?.[i] === 0) {
        const zone = this._getZone(pos, -HALF);
        this._addWallLight(pos, 3.5, -HALF + CELL / 2 + 0.5, zone, 'z+');
      }
      // South wall (row 19) — lights facing north
      if (this.layout[18]?.[i] === 0) {
        const zone = this._getZone(pos, HALF);
        this._addWallLight(pos, 3.5, HALF - CELL / 2 - 0.5, zone, 'z-');
      }
      // West wall (col 0) — lights facing east
      if (this.layout[i]?.[1] === 0) {
        const zone = this._getZone(-HALF, pos);
        this._addWallLight(-HALF + CELL / 2 + 0.5, 3.5, pos, zone, 'x+');
      }
      // East wall (col 19) — lights facing west
      if (this.layout[i]?.[18] === 0) {
        const zone = this._getZone(HALF, pos);
        this._addWallLight(HALF - CELL / 2 - 0.5, 3.5, pos, zone, 'x-');
      }
    }
  }

  _addWallLight(x, y, z, zone, facing) {
    // Light bracket (small box on wall)
    const bracketGeo = cachedBox(0.3, 0.3, 0.15);
    const bracket = new THREE.Mesh(bracketGeo, pillarMat);
    bracket.position.set(x, y, z);
    this.scene.add(bracket);

    // Glowing lamp face
    const lampGeo = cachedBox(0.25, 0.2, 0.04);
    const lamp = new THREE.Mesh(lampGeo, neonBasic(zone.primary));
    const offset = 0.1;
    switch (facing) {
      case 'z+': lamp.position.set(x, y, z + offset); break;
      case 'z-': lamp.position.set(x, y, z - offset); break;
      case 'x+': lamp.position.set(x + offset, y, z); lamp.rotation.y = Math.PI / 2; break;
      case 'x-': lamp.position.set(x - offset, y, z); lamp.rotation.y = Math.PI / 2; break;
    }
    this.scene.add(lamp);

    // Light cone (subtle floor glow below)
    const coneGeo = cachedPlane(2, 2);
    const cone = new THREE.Mesh(coneGeo, neonTransparent(zone.primary, 0.04));
    cone.rotation.x = -Math.PI / 2;
    cone.position.set(x, 0.005, z);
    this.scene.add(cone);
  }

  // ════════════════════════════════════════════════════════════
  // ★★ HAZARD ZONES — Warning stripes and danger areas ★★
  // ════════════════════════════════════════════════════════════

  _buildHazardZones() {
    // Hazard stripes at corridor intersections (yellow/orange chevrons)
    const hazardMat = neonTransparent(0xffaa00, 0.2);
    const hazardMat2 = neonTransparent(0xff6600, 0.15);

    // Intersection hazard zones
    const intersections = [
      { x: -12.5, z: 0 }, { x: 12.5, z: 0 },
      { x: 0, z: -12.5 }, { x: 0, z: 12.5 },
      { x: -22.5, z: -22.5 }, { x: 22.5, z: -22.5 },
      { x: -22.5, z: 22.5 }, { x: 22.5, z: 22.5 },
    ];

    for (const int of intersections) {
      const gc = this.worldToGrid(int.x, int.z);
      if (this.layout[gc.row]?.[gc.col] !== 0) continue;

      // Hazard chevrons (V shapes on floor)
      for (let i = -2; i <= 2; i++) {
        const offset = i * 0.6;
        // Left half of V
        const l = new THREE.Mesh(cachedPlane(1.2, 0.05), i % 2 === 0 ? hazardMat : hazardMat2);
        l.rotation.x = -Math.PI / 2;
        l.rotation.z = 0.5;
        l.position.set(int.x - 0.5, 0.006, int.z + offset);
        this.scene.add(l);
        // Right half of V
        const r = new THREE.Mesh(cachedPlane(1.2, 0.05), i % 2 === 0 ? hazardMat : hazardMat2);
        r.rotation.x = -Math.PI / 2;
        r.rotation.z = -0.5;
        r.position.set(int.x + 0.5, 0.006, int.z + offset);
        this.scene.add(r);
      }
    }

    // Danger border around cover walls (type 2)
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (this.layout[row][col] !== 2) continue;
        const x = (col + 0.5) * CELL - HALF;
        const z = (row + 0.5) * CELL - HALF;
        // Dashed border around cover
        this._buildFloorCircle(x, z, 3.5, 0xffaa00, 0.15, 8);
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // ★★ WALL NEON ACCENTS — Additional neon on border walls ★★
  // ════════════════════════════════════════════════════════════

  _buildWallNeonAccents() {
    const ch = Config.arena.ceilingHeight;

    // Continuous neon strip along all border walls (inner faces)
    const borderStripMat = neonTransparent(0x4400aa, 0.6);
    const borderW = GRID_SIZE * CELL;

    // North wall inner strip
    const nStrip = new THREE.Mesh(cachedBox(borderW, 0.06, 0.04), borderStripMat);
    nStrip.position.set(0, 2.5, -HALF + CELL / 2 + CELL / 2 + 0.02);
    this.scene.add(nStrip);
    // South wall
    const sStrip = new THREE.Mesh(cachedBox(borderW, 0.06, 0.04), borderStripMat);
    sStrip.position.set(0, 2.5, HALF - CELL / 2 - CELL / 2 - 0.02);
    this.scene.add(sStrip);
    // West wall
    const wStrip = new THREE.Mesh(cachedBox(0.04, 0.06, borderW), borderStripMat);
    wStrip.position.set(-HALF + CELL / 2 + CELL / 2 + 0.02, 2.5, 0);
    this.scene.add(wStrip);
    // East wall
    const eStrip = new THREE.Mesh(cachedBox(0.04, 0.06, borderW), borderStripMat);
    eStrip.position.set(HALF - CELL / 2 - CELL / 2 - 0.02, 2.5, 0);
    this.scene.add(eStrip);

    // Vertical accent strips on border walls at regular intervals
    const vertAccentMat = neonBasic(0x3300aa);
    for (let i = 2; i < GRID_SIZE - 2; i += 3) {
      const pos = (i + 0.5) * CELL - HALF;
      // On north wall
      const vn = new THREE.Mesh(cachedBox(0.04, ch * 0.5, 0.04), vertAccentMat);
      vn.position.set(pos, ch * 0.35, -HALF + CELL / 2 + CELL / 2 + 0.03);
      this.scene.add(vn);
      // On south wall
      const vs = new THREE.Mesh(cachedBox(0.04, ch * 0.5, 0.04), vertAccentMat);
      vs.position.set(pos, ch * 0.35, HALF - CELL / 2 - CELL / 2 - 0.03);
      this.scene.add(vs);
      // On west wall
      const vw = new THREE.Mesh(cachedBox(0.04, ch * 0.5, 0.04), vertAccentMat);
      vw.position.set(-HALF + CELL / 2 + CELL / 2 + 0.03, ch * 0.35, pos);
      this.scene.add(vw);
      // On east wall
      const ve = new THREE.Mesh(cachedBox(0.04, ch * 0.5, 0.04), vertAccentMat);
      ve.position.set(HALF - CELL / 2 - CELL / 2 - 0.03, ch * 0.35, pos);
      this.scene.add(ve);
    }

    // Zone transition markers (where zones meet)
    const transGeo = cachedBox(0.15, ch * 0.8, 0.15);
    const transMat = neonBasic(0x00ffcc);
    // Z axis transitions (North-South boundary at z=0)
    for (let col = 1; col < GRID_SIZE - 1; col++) {
      if (this.layout[9][col] !== 0 && this.layout[10][col] !== 0) continue;
      const x = (col + 0.5) * CELL - HALF;
      // Floor marker at boundary
      const marker = new THREE.Mesh(cachedPlane(CELL, 0.06), neonTransparent(0x00ffcc, 0.12));
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(x, 0.005, 0);
      this.scene.add(marker);
    }
    // X axis transitions (East-West boundary at x=0)
    for (let row = 1; row < GRID_SIZE - 1; row++) {
      if (this.layout[row][9] !== 0 && this.layout[row][10] !== 0) continue;
      const z = (row + 0.5) * CELL - HALF;
      const marker = new THREE.Mesh(cachedPlane(0.06, CELL), neonTransparent(0x00ffcc, 0.12));
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(0, 0.005, z);
      this.scene.add(marker);
    }
  }
  // ════════════════════════════════════════════════════════════
  // SPAWN POINTS & NAVIGATION
  // ════════════════════════════════════════════════════════════

  _defineSpawnPoints() {
    // Spawn points — kept away from mezzanines (corners ±38.5) and crates
    this.spawnPoints.player = [
      { x: -32.5, y: 0, z: -42.5 },
      { x: -22.5, y: 0, z: -42.5 },
      { x:   2.5, y: 0, z: -42.5 },
      { x:  27.5, y: 0, z: -42.5 },   // was 37.5 → too close to NE mezzanine
      { x: -27.5, y: 0, z: -27.5 },
      { x: -42.5, y: 0, z: -17.5 },
      { x:   2.5, y: 0, z: -17.5 },
      { x: -37.5, y: 0, z:  -7.5 },   // was -2.5 → overlapped crate at (-22.5,-2.5) area
      { x: -22.5, y: 0, z:   7.5 },
      { x: -27.5, y: 0, z:  22.5 },
      { x:  -2.5, y: 0, z:  32.5 },
      { x: -32.5, y: 0, z:  37.5 },   // was -42.5 → too close to SW mezzanine
    ];
    this.spawnPoints.enemy = [
      { x:  32.5, y: 0, z:  37.5 },   // was 42.5 → too close to SE mezzanine
      { x:  22.5, y: 0, z:  32.5 },   // was z:37.5 → too close to SE mezzanine
      { x:  -2.5, y: 0, z:  32.5 },   // was z:37.5 → too close to SW mezzanine
      { x: -27.5, y: 0, z:  37.5 },   // was -37.5 → too close to SW mezzanine
      { x:  22.5, y: 0, z:  22.5 },
      { x:  42.5, y: 0, z:   7.5 },
      { x:  22.5, y: 0, z:   7.5 },
      { x:  37.5, y: 0, z:  -7.5 },   // was -2.5 → overlapped crate at (22.5,2.5) area
      { x:  42.5, y: 0, z: -17.5 },
      { x:  22.5, y: 0, z: -27.5 },
      { x:  32.5, y: 0, z: -42.5 },
      { x:  -2.5, y: 0, z: -42.5 },
    ];

  }

  _generateNavPoints() {
    this.navPoints = [];
    for (let row = 1; row < GRID_SIZE - 1; row++) {
      for (let col = 1; col < GRID_SIZE - 1; col++) {
        if (this.layout[row][col] === 0) {
          this.navPoints.push({
            x: (col + 0.5) * CELL - HALF,
            z: (row + 0.5) * CELL - HALF,
            row,
            col,
          });
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // PATHFINDING (BFS on grid)
  // ════════════════════════════════════════════════════════════

  worldToGrid(x, z) {
    const col = Math.floor((x + HALF) / CELL);
    const row = Math.floor((z + HALF) / CELL);
    return {
      row: Math.max(0, Math.min(GRID_SIZE - 1, row)),
      col: Math.max(0, Math.min(GRID_SIZE - 1, col)),
    };
  }

  gridToWorld(row, col) {
    return {
      x: (col + 0.5) * CELL - HALF,
      z: (row + 0.5) * CELL - HALF,
    };
  }

  isWalkable(row, col) {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
    return this.layout[row][col] === 0 || this.layout[row][col] === 2;
  }

  findPath(startRow, startCol, endRow, endCol) {
    if (!this.isWalkable(startRow, startCol)) {
      const nearest = this._nearestWalkable(startRow, startCol);
      if (!nearest) return null;
      startRow = nearest.row;
      startCol = nearest.col;
    }
    if (!this.isWalkable(endRow, endCol)) {
      const nearest = this._nearestWalkable(endRow, endCol);
      if (!nearest) return null;
      endRow = nearest.row;
      endCol = nearest.col;
    }

    const queue = [[startRow, startCol]];
    const visited = new Set();
    const parent = new Map();
    visited.add(`${startRow},${startCol}`);

    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    while (queue.length > 0) {
      const [r, c] = queue.shift();

      if (r === endRow && c === endCol) {
        const path = [];
        let key = `${endRow},${endCol}`;
        while (key) {
          const [pr, pc] = key.split(',').map(Number);
          const world = this.gridToWorld(pr, pc);
          path.unshift({ row: pr, col: pc, x: world.x, z: world.z });
          key = parent.get(key) || null;
        }
        return path;
      }

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        const key = `${nr},${nc}`;
        if (this.isWalkable(nr, nc) && !visited.has(key)) {
          visited.add(key);
          parent.set(key, `${r},${c}`);
          queue.push([nr, nc]);
        }
      }
    }

    return null;
  }

  _nearestWalkable(row, col) {
    for (let r = 1; r <= 3; r++) {
      for (let dr = -r; dr <= r; dr++) {
        for (let dc = -r; dc <= r; dc++) {
          if (this.isWalkable(row + dr, col + dc)) {
            return { row: row + dr, col: col + dc };
          }
        }
      }
    }
    return null;
  }

  // ════════════════════════════════════════════════════════════
  // CACHE & GETTERS
  // ════════════════════════════════════════════════════════════

  _cacheWallBoxes() {
    this.wallBoxes = this.collisionWalls.map((w) => new THREE.Box3().setFromObject(w));
  }

  getCollisionWalls() { return this.collisionWalls; }
  getWallBoxes() {
    if (this.wallBoxes.length === 0) this._cacheWallBoxes();
    return this.wallBoxes;
  }
  getSpawnPoints() { return this.spawnPoints; }
  getNavPoints() { return this.navPoints; }
  getLayout() { return this.layout; }
}
