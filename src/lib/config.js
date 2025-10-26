/**
 * Physics simulation configuration
 */

export const config = {
  // Photon emission settings
  photonEmission: {
    // If false, photons are completely disabled (no photon creation)
    enabled: false,
    
    // If true, each electron can only emit one photon in its lifetime
    onePhotonPerElectron: false,
  },
};

