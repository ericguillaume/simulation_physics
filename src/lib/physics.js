/**
 * Physics simulation for 2D/3D universe with electrostatic forces
 */

import { config } from './config.js';

export class Particle {
  constructor(x, y, vx, vy, charge, mass, fixed = false, z = 0.5, vz = 0, isPhoton = false, energy = 0) {
    this.x = x;
    this.y = y;
    this.z = z; // Z coordinate (default 0.5 for 2D mode)
    this.vx = vx;
    this.vy = vy;
    this.vz = vz; // Z velocity
    this.charge = charge;
    this.mass = mass;
    this.fixed = fixed;
    this.isPhoton = isPhoton; // Flag for electromagnetic particles (photons)
    this.energy = energy; // Energy for photons
    this.age = 0; // Age in simulation steps (for photons)
    this.hasEmittedPhoton = false; // Track if this electron has already emitted a photon
    // Force tracking for diagnostics
    this.forceElectroX = 0;
    this.forceElectroY = 0;
    this.forceElectroZ = 0;
    this.accelerationX = 0;
    this.accelerationY = 0;
    this.accelerationZ = 0;
  }
}

export class Universe {
  constructor(size = 1.0, electrostaticCoefficient = 1e-3) {
    this.size = size; // Universe is size x size (x size for 3D)
    this.electrostaticCoefficient = electrostaticCoefficient; // K_electro
    this.electronMass = 1; // Electron mass (constant)
    this.photonEmissionSpeedThreshold = 1e-3; // Speed threshold for photon emission
    this.photonAbsorptionDistance = 3*1e-3; // Distance threshold for photon-electron collision
    this.photonMinAgeForAbsorption = 100; // Minimum photon age (steps) before it can be absorbed
    this.staticProtons = true; // Protons are static by default
    this.strongForceEnabled = false; // Strong force disabled by default
    this.strongForceCoefficient = 10; // K_strong coefficient (default 10)
    this.gravityEnabled = false; // Gravity disabled by default
    this.gravityCoefficient = 10; // K_gravity coefficient (default 10)
    this.groundGravityEnabled = false; // Ground gravity disabled by default
    this.groundGravityCoefficient = 10; // K_ground_gravity coefficient (default 10)
    this.mode3D = false; // 3D mode disabled by default
    this.particles = [];
    this.dt = 0.01; // Time step for simulation
  }

  addParticle(particle) {
    this.particles.push(particle);
  }

  removeAllElectrons() {
    this.particles = this.particles.filter(p => p.charge > 0);
  }

  /**
   * Calculate electrostatic force between two particles using Coulomb's law
   * 
   * PHYSICS PRINCIPLE: Coulomb's Law - F = k * q1 * q2 / r²
   * 
   * HOW IT WORKS:
   * 1. DISTANCE CALCULATION: Computes 3D distance between particles
   *    - dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z (if 3D)
   *    - distance² = dx² + dy² + dz²
   * 
   * 2. FORCE MAGNITUDE: F = -(K_electro * q1 * q2) / r²
   *    - Negative sign: opposite charges attract, like charges repel
   *    - K_electro: electrostatic coefficient (scaling factor)
   *    - q1, q2: charges of particles (positive for protons, negative for electrons)
   *    - r²: squared distance (inverse square law)
   * 
   * 3. FORCE DIRECTION: Normalized direction vector from p1 to p2
   *    - Unit vector = (dx, dy, dz) / distance
   *    - Force components = magnitude × unit vector components
   * 
   * @param {Particle} p1 - First particle
   * @param {Particle} p2 - Second particle
   * @returns {Object} Force vector {fx, fy, fz} acting on p1 due to p2
   */
  calculateElectrostaticForce(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = this.mode3D ? (p2.z - p1.z) : 0;

    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const distance = Math.sqrt(distanceSquared);

    // Coulomb's law: F = -(K_electro * q1 * q2) / r²
    // Negative sign: opposite charges attract, like charges repel
    const electrostaticForceMagnitude = -(this.electrostaticCoefficient * p1.charge * p2.charge) / (distanceSquared + 0.01);

    // Calculate force direction (normalized)
    const fx = electrostaticForceMagnitude * (dx / distance);
    const fy = electrostaticForceMagnitude * (dy / distance);
    const fz = this.mode3D ? electrostaticForceMagnitude * (dz / distance) : 0;

    return { fx, fy, fz };
  }

  /**
   * Calculate strong force (short-range repulsion) between two particles
   * 
   * PHYSICS PRINCIPLE: Strong nuclear force - short-range repulsive force
   * 
   * HOW IT WORKS:
   * 1. DISTANCE CALCULATION: Same as electrostatic force
   *    - Uses 3D distance between particles
   *    - Applies same distance capping for numerical stability
   * 
   * 2. FORCE MAGNITUDE: F = (K_strong * 1e-10) / r⁴
   *    - Inverse quartic law (1/r⁴) - much stronger at short distances
   *    - K_strong: strong force coefficient (scaling factor)
   *    - 1e-10: small constant to keep force reasonable
   *    - Always repulsive (positive magnitude)
   * 
   * 3. SHORT-RANGE BEHAVIOR: Force drops off very quickly with distance
   *    - r⁴ means force becomes negligible beyond short distances
   *    - Prevents particles from overlapping (like nuclear repulsion)
   *    - Much stronger than electrostatic force at very close range
   * 
   * 4. FORCE DIRECTION: Repulsive - pushes particles apart
   *    - Direction vector from p1 to p2 (same as electrostatic)
   *    - But magnitude is always positive (repulsive)
   * 
   * @param {Particle} p1 - First particle
   * @param {Particle} p2 - Second particle
   * @returns {Object} Force vector {fx, fy, fz} acting on p1 due to p2
   */
  calculateStrongForce(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = this.mode3D ? (p2.z - p1.z) : 0;

    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const distance = Math.sqrt(distanceSquared);

    // Strong force: F = (K_strong * 1e-10) / r⁴
    // Always repulsive (positive magnitude)
    const distanceQuartic = distanceSquared * distanceSquared; // r⁴
    const strongForceMagnitude = (this.strongForceCoefficient * 1e-10) / (distanceQuartic);

    // Calculate force direction (normalized)
    const fx = -strongForceMagnitude * (dx / distance);
    const fy = -strongForceMagnitude * (dy / distance);
    const fz = this.mode3D ? -strongForceMagnitude * (dz / distance) : 0;

    return { fx, fy, fz };
  }

  /**
   * Calculate gravitational force on a particle toward the universe center
   * 
   * PHYSICS PRINCIPLE: Gravitational attraction toward a central point
   * 
   * HOW IT WORKS:
   * 1. CENTER DEFINITION: Universe center at (0.5, 0.5, 0.5)
   *    - Fixed gravitational center regardless of particle positions
   *    - Acts like a massive object at the center of the universe
   * 
   * 2. DISTANCE CALCULATION: Distance from particle to center
   *    - dx = centerX - particle.x, dy = centerY - particle.y, dz = centerZ - particle.z
   *    - distance = √(dx² + dy² + dz²)
   * 
   * 3. FORCE MAGNITUDE: F = mass × K_gravity × 1e-6
   *    - Proportional to particle mass (heavier particles feel stronger gravity)
   *    - K_gravity: gravitational coefficient (scaling factor)
   *    - 1e-6: small constant to keep gravitational force reasonable
   *    - Always attractive (positive magnitude toward center)
   * 
   * 4. FORCE DIRECTION: Always toward the center
   *    - Unit vector = (dx, dy, dz) / distance (normalized direction to center)
   *    - Force components = magnitude × unit vector components
   * 
   * 5. DISTANCE THRESHOLD: Avoids division by zero at exact center
   *    - If distance < 1e-6, no gravitational force is applied
   *    - Prevents numerical instability when particle is at exact center
   * 
   * @param {Particle} particle - Particle to calculate gravity for
   * @returns {Object} Force vector {fx, fy, fz} acting on particle toward center
   */
  calculateGravityForce(particle) {
    const centerX = 0.5;
    const centerY = 0.5;
    const centerZ = 0.5;

    // Calculate direction vector from particle to center
    const dx = centerX - particle.x;
    const dy = centerY - particle.y;
    const dz = this.mode3D ? (centerZ - particle.z) : 0;

    // Calculate distance to center
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const distance = Math.sqrt(distanceSquared);

    // Avoid division by zero if particle is exactly at center
    if (distance <= 1e-6) {
      return { fx: 0, fy: 0, fz: 0 };
    }

    // Gravitational force magnitude: mass × K_gravity × 1e-6
    const gravityForceMagnitude = particle.mass * this.gravityCoefficient * 1e-6;

    // Normalize direction and apply force toward center
    const fx = gravityForceMagnitude * (dx / distance);
    const fy = gravityForceMagnitude * (dy / distance);
    const fz = this.mode3D ? gravityForceMagnitude * (dz / distance) : 0;

    return { fx, fy, fz };
  }

  /**
   * Calculate ground gravitational force on a particle toward y=1
   * 
   * PHYSICS PRINCIPLE: Gravitational attraction toward a horizontal plane at y=1
   * 
   * HOW IT WORKS:
   * 1. GROUND DEFINITION: Ground plane at y=1 (top of the universe)
   *    - Fixed gravitational plane regardless of particle positions
   *    - Acts like a massive horizontal surface attracting particles upward
   * 
   * 2. DISTANCE CALCULATION: Distance from particle to ground plane
   *    - dy = groundY - particle.y (where groundY = 1)
   *    - Only Y-component matters for ground gravity
   * 
   * 3. FORCE MAGNITUDE: F = mass × K_ground_gravity × 1e-6
   *    - Proportional to particle mass (heavier particles feel stronger gravity)
   *    - K_ground_gravity: ground gravitational coefficient (scaling factor)
   *    - 1e-6: small constant to keep gravitational force reasonable
   *    - Always attractive (positive magnitude toward ground)
   * 
   * 4. FORCE DIRECTION: Always toward the ground (y=1)
   *    - Only Y-component: force is purely vertical
   *    - Force magnitude applied in positive Y direction
   * 
   * 5. DISTANCE THRESHOLD: Avoids division by zero at exact ground
   *    - If distance < 1e-6, no ground gravitational force is applied
   *    - Prevents numerical instability when particle is at exact ground level
   * 
   * @param {Particle} particle - Particle to calculate ground gravity for
   * @returns {Object} Force vector {fx, fy, fz} acting on particle toward ground
   */
  calculateGroundGravityForce(particle) {
    const groundY = 1.0;

    // Calculate distance to ground (only Y component matters)
    const dy = groundY - particle.y;

    // Avoid division by zero if particle is exactly at ground level
    if (Math.abs(dy) <= 1e-6) {
      return { fx: 0, fy: 0, fz: 0 };
    }

    // Ground gravitational force magnitude: mass × K_ground_gravity × 1e-6
    const groundGravityForceMagnitude = particle.mass * this.groundGravityCoefficient * 1e-6;

    // Force is purely vertical (only Y component)
    const fx = 0;
    const fy = groundGravityForceMagnitude;
    const fz = 0;

    return { fx, fy, fz };
  }

  shouldEmitPhoton(particle) {
    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy + particle.vz * particle.vz);
    if (speed < this.photonEmissionSpeedThreshold) {
      return false;
    }
    // Return true with probability 0.001 * speed / this.photonEmissionSpeedThreshold
    return Math.random() < 0.00001 * speed / this.photonEmissionSpeedThreshold;
  }

  /**
   * Manage photon emission from a particle
   * 
   * PHYSICS PRINCIPLE: Energy radiation from fast-moving electrons
   * 
   * HOW IT WORKS:
   * 1. ENERGY CALCULATION: Calculate initial kinetic energy of electron
   *    - Initial KE = 1/2 × m × v²
   * 
   * 2. ENERGY DISTRIBUTION: Distribute energy between electron and photon
   *    - Photon gets energyRatio of the initial kinetic energy
   *    - Electron keeps (1 - energyRatio) of the initial kinetic energy
   * 
   * 3. SPEED REDUCTION: Calculate new electron speed based on remaining energy
   *    - New KE = (1 - energyRatio) × Initial KE
   *    - 1/2 × m × v_new² = (1 - energyRatio) × 1/2 × m × v²
   *    - v_new = v × √(1 - energyRatio)
   *    - Speed reduction factor = 1 / √(1 - energyRatio)
   * 
   * 4. PHOTON CREATION: Create electromagnetic particle (photon)
   *    - Energy: E_photon = energyRatio × 1/2 × m × v²
   *    - Position: Same as electron position
   *    - Velocity: Same direction as electron, with appropriate speed
   *    - Charge: 0 (photons are neutral)
   *    - Mass: 0 (photons are massless)
   * 
   * @param {Particle} particle - The electron particle emitting the photon
   * @param {number} speed - Current speed of the electron
   * @param {number} vx - X velocity component
   * @param {number} vy - Y velocity component
   * @param {number} vz - Z velocity component
   * @param {number} photonEnergyRatio - Fraction of initial kinetic energy given to photon (default: 0.5)
   * @returns {Particle|null} New photon particle or null if photon emission is disabled
   */
  managePhotonEmission(particle, speed, vx, vy, vz, photonEnergyRatio = 0.9) {
    // Calculate initial kinetic energy
    const initialKE = 0.5 * this.electronMass * speed * speed;

    // Calculate photon energy based on energy ratio
    const photonEnergy = photonEnergyRatio * initialKE;

    // Calculate speed reduction factor
    // New KE = (1 - energyRatio) × Initial KE
    // 1/2 × m × v_new² = (1 - energyRatio) × 1/2 × m × v²
    // v_new² = (1 - energyRatio) × v²
    // v_new = v × √(1 - energyRatio)
    const speedReductionFactor = 1 / Math.sqrt(1 - photonEnergyRatio);

    // Reduce electron speed
    particle.vx /= speedReductionFactor;
    particle.vy /= speedReductionFactor;
    if (this.mode3D) {
      particle.vz /= speedReductionFactor;
    }

    // Mark electron as having emitted a photon
    particle.hasEmittedPhoton = true;

    // Create photon with same position and normalized velocity direction
    const newSpeed = speed / speedReductionFactor; // New electron speed
    const photonSpeed = newSpeed; // Photon moves at same speed as reduced electron

    const photonVx = (vx / speed) * photonSpeed;
    const photonVy = (vy / speed) * photonSpeed;
    const photonVz = this.mode3D ? ((vz / speed) * photonSpeed) : 0;

    // Create photon particle
    if (config.photonEmission.enabled) {
      const photon = new Particle(
        particle.x,
        particle.y,
        photonVx,
        photonVy,
        0, // charge = 0
        0, // mass = 0
        false, // not fixed
        particle.z,
        photonVz,
        true, // isPhoton = true
        photonEnergy
      );

      return photon;
    }

    return null;
  }

  /**
   * Handle photon-electron energy transfer collisions
   * 
   * PHYSICS PRINCIPLE: Photon absorption by electrons
   * 
   * HOW IT WORKS:
   * 1. COLLISION DETECTION: Check distance between each photon and electron
   *    - distance = √((x_e - x_p)² + (y_e - y_p)² + (z_e - z_p)²)
   *    - Collision occurs when distance < 1e-3
   *    - Photon must be at least 100 steps old to be absorbed
   * 
   * 2. ENERGY TRANSFER: Photon energy is transferred to electron
   *    - Old electron KE: KE_old = 1/2 × m × v_old²
   *    - New electron KE: KE_new = KE_old + E_photon
   *    - Energy conservation: total energy before = total energy after
   * 
   * 3. VELOCITY UPDATE: Calculate new electron velocity from increased energy
   *    - KE_new = 1/2 × m × v_new²
   *    - v_new = √(2 × KE_new / m)
   *    - Direction maintained: velocity vector scaled to new speed
   * 
   * 4. PHOTON REMOVAL: Photon is absorbed and removed from simulation
   *    - Marked for removal and deleted after collision processing
   * 
   * @returns {Array} Indices of photons to remove after absorption
   */
  handlePhotonElectronCollisions() {
    const photonsToRemove = [];

    // Find all photons and electrons
    for (let i = 0; i < this.particles.length; i++) {
      const photon = this.particles[i];
      if (!photon.isPhoton) continue;

      for (let j = 0; j < this.particles.length; j++) {
        const electron = this.particles[j];
        
        // Only process electrons (negative charge, not photons)
        if (electron.charge >= 0 || electron.isPhoton) continue;

        // Calculate distance between photon and electron
        const dx = electron.x - photon.x;
        const dy = electron.y - photon.y;
        const dz = this.mode3D ? (electron.z - photon.z) : 0;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Check for collision (distance and minimum age requirement)
        if (distance < this.photonAbsorptionDistance && photon.age >= this.photonMinAgeForAbsorption) {
          // Calculate current electron kinetic energy
          const currentSpeed = Math.sqrt(
            electron.vx * electron.vx + 
            electron.vy * electron.vy + 
            electron.vz * electron.vz
          );
          const currentKE = 0.5 * electron.mass * currentSpeed * currentSpeed;

          // Add photon energy to electron
          const newKE = currentKE + photon.energy;
          const newSpeed = Math.sqrt(2 * newKE / electron.mass);

          // Scale velocity vector to new speed (maintain direction)
          if (currentSpeed > 0) {
            const speedRatio = newSpeed / currentSpeed;
            electron.vx *= speedRatio;
            electron.vy *= speedRatio;
            if (this.mode3D) {
              electron.vz *= speedRatio;
            }
          } else {
            // If electron was at rest, give it random direction with new speed
            const theta = Math.random() * 2 * Math.PI;
            const phi = this.mode3D ? Math.acos(2 * Math.random() - 1) : Math.PI / 2;
            electron.vx = newSpeed * Math.sin(phi) * Math.cos(theta);
            electron.vy = newSpeed * Math.sin(phi) * Math.sin(theta);
            if (this.mode3D) {
              electron.vz = newSpeed * Math.cos(phi);
            }
          }

          // Mark photon for removal
          if (!photonsToRemove.includes(i)) {
            photonsToRemove.push(i);
          }
          break; // Photon can only be absorbed once
        }
      }
    }

    // Remove absorbed photons (iterate backwards to avoid index issues)
    for (let i = photonsToRemove.length - 1; i >= 0; i--) {
      this.particles.splice(photonsToRemove[i], 1);
    }

    return photonsToRemove.length;
  }

  /**
   * Check electron speeds and emit photons if speed exceeds threshold
   * 
   * PHYSICS PRINCIPLE: Energy radiation from fast-moving electrons
   * 
   * HOW IT WORKS:
   * 1. PHOTON EMISSION CHECK: If config.photonEmission.enabled is false, skip entirely
   *    - No photons will be created at all
   * 
   * 2. SPEED CHECK: Calculate speed (norm of velocity vector) for each electron
   *    - speed = √(vx² + vy² + vz²)
   *    - Only applies to electrons (charge < 0), never to protons
   * 
   * 3. EMISSION LIMIT: If config.photonEmission.onePhotonPerElectron is true:
   *    - Each electron can only emit one photon in its lifetime
   *    - Tracked via particle.hasEmittedPhoton flag
   * 
   * 4. ENERGY EMISSION: If speed > threshold (1e-3):
   *    - Initial kinetic energy: KE_initial = 1/2 × m × v²
   *    - Electron speed reduced by factor of √2: v_new = v / √2
   *    - New kinetic energy: KE_new = 1/2 × m × (v/√2)² = 1/4 × m × v²
   *    - Energy radiated: ΔKE = KE_initial - KE_new = 1/4 × m × v²
   * 
   * 5. PHOTON CREATION: Create electromagnetic particle (photon)
   *    - Energy: E_photon = 1/4 × m × v²
   *    - Position: Same as electron position
   *    - Velocity: Same direction as electron, normalized to maintain momentum
   *    - Charge: 0 (photons are neutral)
   *    - Mass: 0 (photons are massless)
   * 
   * 6. ENERGY CONSERVATION: Total energy is conserved
   *    - Electron loses kinetic energy: from 1/2 × m × v² to 1/4 × m × v²
   *    - Photon gains that energy: E_photon = 1/4 × m × v²
   *    - Total: 1/4 × m × v² + 1/4 × m × v² = 1/2 × m × v² ✓
   */
  checkAndEmitPhotons() {
    const newPhotons = [];

    for (let particle of this.particles) {
      // Only check electrons (charge < 0), never protons
      if (particle.charge >= 0 || particle.isPhoton) continue;

      // If onePhotonPerElectron is enabled, skip electrons that have already emitted
      if (config.photonEmission.onePhotonPerElectron && particle.hasEmittedPhoton) {
        continue;
      }

      // Calculate speed (norm of velocity vector)
      const vx = particle.vx;
      const vy = particle.vy;
      const vz = this.mode3D ? particle.vz : 0;
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

      // Check if speed exceeds threshold
      if (this.shouldEmitPhoton(particle)) {
        const photon = this.managePhotonEmission(particle, speed, vx, vy, vz);
        if (photon) {
          newPhotons.push(photon);
        }
      }
    }

    // Add all new photons to the universe
    for (let photon of newPhotons) {
      this.addParticle(photon);
    }
  }

  /**
   * Calculate total force between two particles (electrostatic + strong force)
   * F = K_electro * q1 * q2 / r^2
   * Returns force vector [fx, fy, fz]
   */
  calculateForce(p1, p2) {
    // Calculate electrostatic force between particles
    const electrostaticForce = this.calculateElectrostaticForce(p1, p2);
    // console.log('p1.x', p1.x);
    // console.log('p1.y', p1.y);
    // console.log('p2.x', p2.x);
    // console.log('p2.y', p2.y);
    // console.log('p1.mass', p1.mass);
    // console.log('p2.mass', p2.mass);
    // console.log('p1.speed.y', p1.vy);
    // console.log('p1.accelerationY', p1.accelerationY);
    // console.log('electrostaticForce', electrostaticForce.fy);


    // Calculate strong force if enabled
    let strongForce = { fx: 0, fy: 0, fz: 0 };
    if (this.strongForceEnabled) {
      strongForce = this.calculateStrongForce(p1, p2);
      // console.log('strongForce', strongForce.fy);
    }

    // Combine forces: total = electrostatic + strong
    return {
      fx: electrostaticForce.fx + strongForce.fx,
      fy: electrostaticForce.fy + strongForce.fy,
      fz: electrostaticForce.fz + strongForce.fz
    };
  }

  /**
   * Apply boundary conditions to a particle
   * 
   * PHOTONS: Bounce back elastically (reflect off walls like a mirror)
   * ELECTRONS & PROTONS: Clamp to boundary and stop (velocity = 0)
   */
  applyBoundaryConditions(particle) {
    if (particle.isPhoton) {
      // Photons bounce back elastically (reflect off walls)

      // X-axis boundary - reflect vx if hitting left or right wall
      if (particle.x < 0) {
        particle.x = -particle.x; // Reflect position back inside
        particle.vx = -particle.vx; // Reverse velocity
      } else if (particle.x > this.size) {
        particle.x = 2 * this.size - particle.x; // Reflect position back inside
        particle.vx = -particle.vx; // Reverse velocity
      }

      // Y-axis boundary - reflect vy if hitting top or bottom wall
      if (particle.y < 0) {
        particle.y = -particle.y; // Reflect position back inside
        particle.vy = -particle.vy; // Reverse velocity
      } else if (particle.y > this.size) {
        particle.y = 2 * this.size - particle.y; // Reflect position back inside
        particle.vy = -particle.vy; // Reverse velocity
      }

      // Z-axis boundary (3D only) - reflect vz if hitting front or back wall
      if (this.mode3D) {
        if (particle.z < 0) {
          particle.z = -particle.z; // Reflect position back inside
          particle.vz = -particle.vz; // Reverse velocity
        } else if (particle.z > this.size) {
          particle.z = 2 * this.size - particle.z; // Reflect position back inside
          particle.vz = -particle.vz; // Reverse velocity
        }
      }
    } else {
      // Electrons and protons: clamp to boundary and stop
      let hitBoundary = false;

      // X-axis boundary conditions - clamp to closest boundary point
      if (particle.x < 0) {
        particle.x = 0;
        hitBoundary = true;
      } else if (particle.x > this.size) {
        particle.x = this.size;
        hitBoundary = true;
      }

      // Y-axis boundary conditions - clamp to closest boundary point
      if (particle.y < 0) {
        particle.y = 0;
        hitBoundary = true;
      } else if (particle.y > this.size) {
        particle.y = this.size;
        hitBoundary = true;
      }

      // Z-axis boundary conditions (3D only) - clamp to closest boundary point
      if (this.mode3D) {
        if (particle.z < 0) {
          particle.z = 0;
          hitBoundary = true;
        } else if (particle.z > this.size) {
          particle.z = this.size;
          hitBoundary = true;
        }
      }

      // If particle hit any boundary, set velocity and acceleration to zero in all directions
      if (hitBoundary) {
        particle.vx = 0;
        particle.vy = 0;
        particle.accelerationX = 0;
        particle.accelerationY = 0;

        if (this.mode3D) {
          particle.vz = 0;
          particle.accelerationZ = 0;
        }
      }
    }
  }

  /**
   * Update particle velocities and positions based on applied forces using Euler integration
   * 
   * This function implements Newton's second law of motion (F = ma) and basic kinematic equations:
   * 
   * 1. FORCE TO ACCELERATION: a = F / m
   *    - Calculates acceleration from the total force vector and particle mass
   *    - Each component (x, y, z) is calculated independently
   * 
   * 2. VELOCITY UPDATE: v_new = v_old + a * dt
   *    - Uses Euler integration to update velocity based on acceleration
   *    - dt is the time step (small time interval)
   *    - Velocity accumulates over time due to continuous acceleration
   * 
   * 3. POSITION UPDATE: x_new = x_old + v * dt
   *    - Uses Euler integration to update position based on current velocity
   *    - Position changes linearly with velocity over the time step
   * 
   * The function skips particles that are:
   * - Fixed in place (particle.fixed = true)
   * - Protons when staticProtons mode is enabled
   * - Photons move in straight lines (no forces applied)
   * 
   * After updating physics, it applies boundary conditions to prevent particles
   * from leaving the simulation space.
   */
  updateParticleMotion(particle, forceX, forceY, forceZ) {
    // Photons move in straight lines (no forces applied)
    if (particle.isPhoton) {
      // Update position only (constant velocity)
      particle.x += particle.vx * this.dt;
      particle.y += particle.vy * this.dt;
      if (this.mode3D) {
        particle.z += particle.vz * this.dt;
      }
      // Increment photon age (for absorption eligibility)
      particle.age++;
      // Apply boundary conditions (photons disappear at boundaries)
      this.applyBoundaryConditions(particle);
      return;
    }

    // Store force information for diagnostics
    particle.forceElectroX = forceX;
    particle.forceElectroY = forceY;
    particle.forceElectroZ = forceZ;

    // Skip fixed particles
    if (particle.fixed) return;

    // Skip protons if staticProtons is enabled
    if (this.staticProtons && particle.charge > 0) return;

    // Step 1: Calculate acceleration from force (Newton's second law: a = F / m)
    let ax = forceX / particle.mass;
    let ay = forceY / particle.mass;
    let az = this.mode3D ? (forceZ / particle.mass) : 0;

    // Store acceleration for diagnostics
    particle.accelerationX = ax;
    particle.accelerationY = ay;
    particle.accelerationZ = az;

    // Step 2: Update velocity using Euler integration (v = v0 + a * dt)
    particle.vx += ax * this.dt;
    particle.vy += ay * this.dt;
    if (this.mode3D) {
      particle.vz += az * this.dt;
    }

    // Step 3: Update position using Euler integration (x = x0 + v * dt)
    particle.x += particle.vx * this.dt;
    particle.y += particle.vy * this.dt;
    if (this.mode3D) {
      particle.z += particle.vz * this.dt;
    }

    // Apply boundary conditions to keep particles within the simulation space
    this.applyBoundaryConditions(particle);
  }

  /**
   * Perform one simulation step
   */
  step() {
    // log number of particles per types
    if (Math.random() < 0.005) { // ~0.5% chance, i.e. once every 200 times
      console.log('Number of particles:', this.particles.length);
      console.log('Number of electrons:', this.particles.filter(particle => particle.charge < 0).length);
      console.log('Number of protons:', this.particles.filter(particle => particle.charge > 0).length);
      console.log('Number of photons:', this.particles.filter(particle => particle.isPhoton).length);
      console.log('Sum of positive charges:', this.particles.filter(particle => particle.charge > 0).reduce((sum, p) => sum + p.charge, 0));
      console.log('Sum of negative charges:', this.particles.filter(particle => particle.charge < 0).reduce((sum, p) => sum + p.charge, 0));
    }

    // Compute and log total energy of the system
    // const energy = calculateTotalEnergy(this);
    // console.log('Total Energy:', energy.total.toExponential(6),
    //   '| Kinetic:', energy.kinetic.toExponential(6),
    //   '| Photon:', energy.photon.toExponential(6),
    //   '| Electrostatic:', energy.electrostatic.toExponential(6));

    // Handle photon-electron collisions and energy transfer
    this.handlePhotonElectronCollisions();

    // Check electron speeds and emit photons if needed (at the beginning of step)
    this.checkAndEmitPhotons();

    // Calculate forces on each particle
    const forces = this.particles.map(() => ({
      fx: 0, fy: 0, fz: 0
    }));

    // Reset force tracking for all particles
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].forceElectroX = 0;
      this.particles[i].forceElectroY = 0;
      this.particles[i].forceElectroZ = 0;
    }

    for (let i = 0; i < this.particles.length; i++) {
      // Skip photons - they don't interact with other particles
      if (this.particles[i].isPhoton) continue;

      for (let j = i + 1; j < this.particles.length; j++) {
        // Skip photons - they don't interact with other particles
        if (this.particles[j].isPhoton) continue;

        const force = this.calculateForce(this.particles[i], this.particles[j]);

        // Newton's third law: equal and opposite forces
        forces[i].fx += force.fx;
        forces[i].fy += force.fy;
        forces[i].fz += force.fz;

        forces[j].fx -= force.fx;
        forces[j].fy -= force.fy;
        forces[j].fz -= force.fz;
      }
    }

    // Apply gravitational force (attracts particles toward center at 0.5, 0.5, 0.5)
    if (this.gravityEnabled) {
      for (let i = 0; i < this.particles.length; i++) {
        // Skip photons - they are not affected by gravity
        if (this.particles[i].isPhoton) continue;

        const gravityForce = this.calculateGravityForce(this.particles[i]);

        // Add gravity force to total forces
        forces[i].fx += gravityForce.fx;
        forces[i].fy += gravityForce.fy;
        forces[i].fz += gravityForce.fz;
      }
    }

    // Apply ground gravitational force (attracts particles toward y=1)
    if (this.groundGravityEnabled) {
      for (let i = 0; i < this.particles.length; i++) {
        // Skip photons - they are not affected by gravity
        if (this.particles[i].isPhoton) continue;

        const groundGravityForce = this.calculateGroundGravityForce(this.particles[i]);

        // Add ground gravity force to total forces
        forces[i].fx += groundGravityForce.fx;
        forces[i].fy += groundGravityForce.fy;
        forces[i].fz += groundGravityForce.fz;
      }
    }

    // Update velocities and positions using Euler integration
    for (let i = 0; i < this.particles.length; i++) {
      this.updateParticleMotion(this.particles[i], forces[i].fx, forces[i].fy, forces[i].fz);
    }
  }

  /**
   * Run multiple steps
   */
  runSteps(n) {
    for (let i = 0; i < n; i++) {
      this.step();
    }
  }

  setElectrostaticCoefficient(k) {
    this.electrostaticCoefficient = k;
  }

  setStaticProtons(enabled) {
    this.staticProtons = enabled;
  }

  setStrongForceEnabled(enabled) {
    this.strongForceEnabled = enabled;
  }

  setStrongForceCoefficient(k) {
    this.strongForceCoefficient = k;
  }

  setGravityEnabled(enabled) {
    this.gravityEnabled = enabled;
  }

  setGravityCoefficient(k) {
    this.gravityCoefficient = k;
  }

  setMode3D(enabled) {
    this.mode3D = enabled;
  }

  setGroundGravityEnabled(enabled) {
    this.groundGravityEnabled = enabled;
  }

  setGroundGravityCoefficient(k) {
    this.groundGravityCoefficient = k;
  }
}
