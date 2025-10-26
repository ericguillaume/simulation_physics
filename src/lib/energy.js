
/**
 * Energy calculation functions for physics simulation
 */

/**
 * Calculate total kinetic energy of all particles
 * KE = 1/2 × m × v²
 * 
 * @param {Universe} universe - The universe instance
 * @returns {number} Total kinetic energy of all particles
 */
export function calculateTotalKineticEnergy(universe) {
  let totalKE = 0;
  
  for (let particle of universe.particles) {
    // Skip photons - their energy is stored separately
    if (particle.isPhoton) continue;
    
    const vx = particle.vx;
    const vy = particle.vy;
    const vz = universe.mode3D ? particle.vz : 0;
    const speedSquared = vx * vx + vy * vy + vz * vz;
    
    const kineticEnergy = 0.5 * particle.mass * speedSquared;
    totalKE += kineticEnergy;
  }
  
  return totalKE;
}

/**
 * Calculate total energy stored in photons
 * 
 * @param {Universe} universe - The universe instance
 * @returns {number} Total photon energy
 */
export function calculateTotalPhotonEnergy(universe) {
  let totalPhotonEnergy = 0;
  
  for (let particle of universe.particles) {
    if (particle.isPhoton) {
      totalPhotonEnergy += particle.energy;
    }
  }
  
  return totalPhotonEnergy;
}

/**
 * Calculate total electrostatic potential energy
 * U = K × q₁ × q₂ / r
 * 
 * Note: We calculate the potential energy between each pair of particles
 * The negative sign in Coulomb's force law is already accounted for in the potential energy formula
 * 
 * @param {Universe} universe - The universe instance
 * @returns {number} Total electrostatic potential energy
 */
export function calculateTotalElectrostaticEnergy(universe) {
  let totalPE = 0;
  
  for (let i = 0; i < universe.particles.length; i++) {
    // Skip photons - they don't have electrostatic interactions
    if (universe.particles[i].isPhoton) continue;
    
    for (let j = i + 1; j < universe.particles.length; j++) {
      // Skip photons - they don't have electrostatic interactions
      if (universe.particles[j].isPhoton) continue;
      
      const p1 = universe.particles[i];
      const p2 = universe.particles[j];
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dz = universe.mode3D ? (p2.z - p1.z) : 0;
      
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Electrostatic potential energy: U = K × q₁ × q₂ / r
      // Note: Opposite charges have negative potential energy (attractive)
      //       Like charges have positive potential energy (repulsive)
      const potentialEnergy = (universe.electrostaticCoefficient * p1.charge * p2.charge) / (distance + 0.01);
      totalPE += potentialEnergy;
    }
  }
  
  return totalPE;
}

/**
 * Calculate total energy of the system
 * Total Energy = Kinetic Energy + Photon Energy + Electrostatic Potential Energy
 * 
 * @param {Universe} universe - The universe instance
 * @returns {Object} Object containing breakdown of energy components and total
 */
export function calculateTotalEnergy(universe) {
  const kineticEnergy = calculateTotalKineticEnergy(universe);
  const photonEnergy = calculateTotalPhotonEnergy(universe);
  const electrostaticEnergy = calculateTotalElectrostaticEnergy(universe);
  const totalEnergy = kineticEnergy + photonEnergy + electrostaticEnergy;
  
  return {
    kinetic: kineticEnergy,
    photon: photonEnergy,
    electrostatic: electrostaticEnergy,
    total: totalEnergy
  };
}

