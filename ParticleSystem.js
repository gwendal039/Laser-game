import * as THREE from 'three';

class Particle {
  constructor(mesh, velocity, life) {
    this.mesh = mesh;
    this.velocity = velocity;
    this.life = life;
    this.maxLife = life;
  }
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  spawnHitParticles(position, color = 0xff4400, count = 12) {
    for (let i = 0; i < count; i++) {
      const size = 0.03 + Math.random() * 0.05;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      this.scene.add(mesh);

      const speed = 3 + Math.random() * 6;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        Math.random() * speed * 0.7,
        (Math.random() - 0.5) * speed
      );

      this.particles.push(new Particle(mesh, velocity, 0.3 + Math.random() * 0.4));
    }
  }

  spawnMuzzleFlash(position, direction) {
    const geo = new THREE.SphereGeometry(0.08, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position).addScaledVector(direction, 0.3);
    this.scene.add(mesh);
    this.particles.push(new Particle(mesh, new THREE.Vector3(), 0.06));
  }

  spawnRespawnEffect(position) {
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        position.x + Math.cos(angle) * 0.5,
        position.y + Math.random() * 2,
        position.z + Math.sin(angle) * 0.5
      );
      this.scene.add(mesh);

      const velocity = new THREE.Vector3(
        Math.cos(angle) * 2,
        1 + Math.random() * 2,
        Math.sin(angle) * 2
      );
      this.particles.push(new Particle(mesh, velocity, 0.5 + Math.random() * 0.5));
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 8 * dt;

      const t = p.life / p.maxLife;
      p.mesh.material.opacity = t;
      const s = 0.5 + t * 0.5;
      p.mesh.scale.setScalar(s);
    }
  }

  dispose() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    this.particles.length = 0;
  }
}
