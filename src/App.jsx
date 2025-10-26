import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react'
import { Universe, Particle } from './lib/physics'
import './App.css'

/*

  This is the front of an App with a screen representing a universe.
  In this universe, particules evolve and simulate physics laws.

  The universe is represented by a canvas.
  The user can interact with the universe by adding and removing particles,
  and by changing the parameters of the universe.
  The user can also zoom in and out of the universe, and pan the universe around.
  The user can also select the view axis of the universe.
  The user can also select the particle type to add to the universe.
  The user can also select the charge multiplier for the drawn protons.
  The user can also select the number of protons and electrons in the universe.
  The user can also select the number of steps to run the universe for.
*/

function App() {
  const canvasRef = useRef(null)
  const universeRef = useRef(null)
  const animationRef = useRef(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [electrostaticCoefficient, setElectrostaticCoefficient] = useState(10)
  const [staticProtons, setStaticProtons] = useState(true)
  const [strongForceEnabled, setStrongForceEnabled] = useState(true)
  const [strongForceCoefficient, setStrongForceCoefficient] = useState(10)
  const [gravityEnabled, setGravityEnabled] = useState(true)
  const [gravityCoefficient, setGravityCoefficient] = useState(10)
  const [groundGravityEnabled, setGroundGravityEnabled] = useState(false)
  const [groundGravityCoefficient, setGroundGravityCoefficient] = useState(10)
  const [mode3D, setMode3D] = useState(false)
  const [viewAxis, setViewAxis] = useState('xy') // 'xy', 'xz', or 'yz'
  const [numSteps, setNumSteps] = useState(1)
  const [electronCount, setElectronCount] = useState(5)
  const [protonCount, setProtonCount] = useState(1)
  const [drawMode, setDrawMode] = useState(false)
  const [selectedParticleType, setSelectedParticleType] = useState('proton') // 'proton' or 'electron'
  const [chargeMultiplier, setChargeMultiplier] = useState(1) // Charge multiplier for drawn protons
  const [zoomMode, setZoomMode] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [zoomCenterX, setZoomCenterX] = useState(0.5)
  const [zoomCenterY, setZoomCenterY] = useState(0.5)
  
  // Initialize universe
  useEffect(() => {
    const universe = new Universe(1.0, electrostaticCoefficient * 1e-6)
    
    // Apply current settings
    universe.setStaticProtons(staticProtons)
    universe.setStrongForceEnabled(strongForceEnabled)
    universe.setStrongForceCoefficient(strongForceCoefficient)
    universe.setGravityEnabled(gravityEnabled)
    universe.setGravityCoefficient(gravityCoefficient)
    universe.setGroundGravityEnabled(groundGravityEnabled)
    universe.setGroundGravityCoefficient(groundGravityCoefficient)
    universe.setMode3D(mode3D)
    
    // Add protons at random positions (mass 100)
    for (let i = 0; i < protonCount; i++) {
      const px = 0.2 + Math.random() * 0.6
      const py = 0.2 + Math.random() * 0.6
      const pz = mode3D ? (0.2 + Math.random() * 0.6) : 0.5
      universe.addParticle(new Particle(px, py, 0, 0, 1, 100, false, pz, 0))
    }
    
    // Add free electrons randomly
    for (let i = 0; i < electronCount; i++) {
      if (mode3D) {
        // 3D: distribute on sphere
        const phi = (Math.PI * 2 * i) / electronCount
        const theta = Math.acos(2 * Math.random() - 1) // Uniform distribution on sphere
        const radius = 0.2 + Math.random() * 0.2
        const x = 0.5 + radius * Math.sin(theta) * Math.cos(phi)
        const y = 0.5 + radius * Math.sin(theta) * Math.sin(phi)
        const z = 0.5 + radius * Math.cos(theta)
        
        let vx = 0, vy = 0, vz = 0
        
        universe.addParticle(new Particle(x, y, vx, vy, -1, 1, false, z, vz))
      } else {
        // 2D: distribute on circle
        const angle = (Math.PI * 2 * i) / electronCount
        const radius = 0.2 + Math.random() * 0.2
        const x = 0.5 + radius * Math.cos(angle)
        const y = 0.5 + radius * Math.sin(angle)
        
        let vx = 0, vy = 0
        
        universe.addParticle(new Particle(x, y, vx, vy, -1, 1, false, 0.5, 0))
      }
    }
    
    universeRef.current = universe
    drawUniverse()
  }, [mode3D])  // Only restart when 3D mode changes (locked after initialization)
  
  // Update electrostatic coefficient when changed
  useEffect(() => {
    if (universeRef.current) {
      universeRef.current.setElectrostaticCoefficient(electrostaticCoefficient * 1e-6)
    }
  }, [electrostaticCoefficient])
  
  
  // Update static protons when changed
  useEffect(() => {
    if (universeRef.current) {
      universeRef.current.setStaticProtons(staticProtons)
    }
  }, [staticProtons])
  
  
  // Update strong force when changed
  useEffect(() => {
    if (universeRef.current) {
      universeRef.current.setStrongForceEnabled(strongForceEnabled)
    }
  }, [strongForceEnabled])
  
  // Update strong force coefficient when changed
  useEffect(() => {
    if (universeRef.current) {
      universeRef.current.setStrongForceCoefficient(strongForceCoefficient)
    }
  }, [strongForceCoefficient])
  
  
  // Update gravity when changed
  useEffect(() => {
    if (universeRef.current) {
      universeRef.current.setGravityEnabled(gravityEnabled)
    }
  }, [gravityEnabled])
  
  // Update ground gravity when changed
  useEffect(() => {
    if (universeRef.current) {
      universeRef.current.setGroundGravityEnabled(groundGravityEnabled)
    }
  }, [groundGravityEnabled])
  
  // Update ground gravity coefficient when changed
  useEffect(() => {
    if (universeRef.current) {
      universeRef.current.setGroundGravityCoefficient(groundGravityCoefficient)
    }
  }, [groundGravityCoefficient])
  
  // Update gravity coefficient when changed
  useEffect(() => {
    if (universeRef.current) {
      universeRef.current.setGravityCoefficient(gravityCoefficient)
    }
  }, [gravityCoefficient])
  
  const drawUniverse = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const size = canvas.width
    const universe = universeRef.current
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, size, size)
    
    // Calculate zoom viewport
    const viewWidth = 1 / zoomLevel
    const viewHeight = 1 / zoomLevel
    const viewMinX = zoomCenterX - viewWidth / 2
    const viewMinY = zoomCenterY - viewHeight / 2
    
    // Draw grid
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const gridPos = i / 10
      // Only draw grid lines that are visible in the viewport
      if (gridPos >= viewMinX && gridPos <= viewMinX + viewWidth) {
        const x = ((gridPos - viewMinX) / viewWidth) * size
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, size)
        ctx.stroke()
      }
      if (gridPos >= viewMinY && gridPos <= viewMinY + viewHeight) {
        const y = ((gridPos - viewMinY) / viewHeight) * size
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(size, y)
        ctx.stroke()
      }
    }
    
    // Draw particles - photons first, then electrons, then protons
    const photons = universe.particles.filter(p => p.isPhoton)
    const electrons = universe.particles.filter(p => p.charge < 0 && !p.isPhoton)
    const protons = universe.particles.filter(p => p.charge > 0)
    
    // Draw photons first (electromagnetic particles)
    photons.forEach((particle) => {
      // Select coordinates based on view axis
      let coord1, coord2;
      if (viewAxis === 'xy') {
        coord1 = particle.x;
        coord2 = particle.y;
      } else if (viewAxis === 'xz') {
        coord1 = particle.x;
        coord2 = particle.z;
      } else { // 'yz'
        coord1 = particle.y;
        coord2 = particle.z;
      }
      
      // Transform particle position to zoomed viewport
      const x = ((coord1 - viewMinX) / viewWidth) * size
      const y = ((coord2 - viewMinY) / viewHeight) * size
      
      // Photon - yellow/gold with bright glow
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#fbbf24'
      ctx.shadowColor = '#fbbf24'
      ctx.shadowBlur = 15
      ctx.fill()
      ctx.shadowBlur = 0
      
      // Draw velocity vector for photons (showing light ray)
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
      if (speed > 0.001) {
        ctx.strokeStyle = '#fbbf2480'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + particle.vx * 50, y + particle.vy * 50)
        ctx.stroke()
      }
      
      // Draw a small star/sparkle effect
      ctx.strokeStyle = '#fef3c7'
      ctx.lineWidth = 1
      const sparkleSize = 3
      ctx.beginPath()
      ctx.moveTo(x - sparkleSize, y)
      ctx.lineTo(x + sparkleSize, y)
      ctx.moveTo(x, y - sparkleSize)
      ctx.lineTo(x, y + sparkleSize)
      ctx.stroke()
    })
    
    // Draw electrons
    electrons.forEach((particle) => {
      // Select coordinates based on view axis
      let coord1, coord2;
      if (viewAxis === 'xy') {
        coord1 = particle.x;
        coord2 = particle.y;
      } else if (viewAxis === 'xz') {
        coord1 = particle.x;
        coord2 = particle.z;
      } else { // 'yz'
        coord1 = particle.y;
        coord2 = particle.z;
      }
      
      // Transform particle position to zoomed viewport
      const x = ((coord1 - viewMinX) / viewWidth) * size
      const y = ((coord2 - viewMinY) / viewHeight) * size
      
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      
      // Electron - blue with glow
      ctx.fillStyle = '#3b82f6'
      ctx.shadowColor = '#3b82f6'
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.shadowBlur = 0
      
      // Draw charge symbol
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('−', x, y)
      
      // Draw velocity vector for moving electrons
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
      if (speed > 0.01) {
        ctx.strokeStyle = '#3b82f680'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + particle.vx * 30, y + particle.vy * 30)
        ctx.stroke()
      }
    })
    
    // Draw protons last (so they appear on top)
    protons.forEach((particle) => {
      // Select coordinates based on view axis
      let coord1, coord2;
      if (viewAxis === 'xy') {
        coord1 = particle.x;
        coord2 = particle.y;
      } else if (viewAxis === 'xz') {
        coord1 = particle.x;
        coord2 = particle.z;
      } else { // 'yz'
        coord1 = particle.y;
        coord2 = particle.z;
      }
      
      // Transform particle position to zoomed viewport
      const x = ((coord1 - viewMinX) / viewWidth) * size
      const y = ((coord2 - viewMinY) / viewHeight) * size
      
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      
      // Proton - red with glow
      ctx.fillStyle = '#ef4444'
      ctx.shadowColor = '#ef4444'
      ctx.shadowBlur = 20
      ctx.fill()
      ctx.shadowBlur = 0
      
      // Draw charge symbol
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', x, y)
      
      // Draw velocity vector for moving protons
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
      if (speed > 0.01) {
        ctx.strokeStyle = '#ef444480'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + particle.vx * 100, y + particle.vy * 100)
        ctx.stroke()
      }
    })
  }
  
  const handleNextStep = () => {
    if (universeRef.current) {
      universeRef.current.step()
      drawUniverse()
    }
  }
  
  const handleRunSteps = () => {
    if (universeRef.current) {
      universeRef.current.runSteps(numSteps)
      drawUniverse()
    }
  }
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }
  
  const handleReset = () => {
    setIsPlaying(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    // Reinitialize universe
    const universe = new Universe(1.0, electrostaticCoefficient * 1e-6)
    
    // Apply current settings
    universe.setStaticProtons(staticProtons)
    universe.setStrongForceEnabled(strongForceEnabled)
    universe.setStrongForceCoefficient(strongForceCoefficient)
    universe.setGravityEnabled(gravityEnabled)
    universe.setGravityCoefficient(gravityCoefficient)
    universe.setGroundGravityEnabled(groundGravityEnabled)
    universe.setGroundGravityCoefficient(groundGravityCoefficient)
    universe.setMode3D(mode3D)
    
    // Add protons at random positions (mass 100)
    for (let i = 0; i < protonCount; i++) {
      const px = 0.2 + Math.random() * 0.6
      const py = 0.2 + Math.random() * 0.6
      const pz = mode3D ? (0.2 + Math.random() * 0.6) : 0.5
      universe.addParticle(new Particle(px, py, 0, 0, 1, 100, false, pz, 0))
    }
    
    // Add free electrons randomly
    for (let i = 0; i < electronCount; i++) {
      const angle = (Math.PI * 2 * i) / electronCount
      const radius = 0.2 + Math.random() * 0.2
      const x = 0.5 + radius * Math.cos(angle)
      const y = 0.5 + radius * Math.sin(angle)
      
      let vx = 0
      let vy = 0
      
      universe.addParticle(new Particle(x, y, vx, vy, -1, 1, false))
    }
    
    universeRef.current = universe
    drawUniverse()
  }
  
  const handleDrawMode = () => {
    // Enter draw mode - stop animation but keep particles
    setIsPlaying(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setDrawMode(true)
  }
  
  const handleClearAll = () => {
    // Clear all particles and stop animation
    setIsPlaying(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    // Create empty universe with current settings
    const universe = new Universe(1.0, electrostaticCoefficient * 1e-6)
    universe.setStaticProtons(staticProtons)
    universe.setStrongForceEnabled(strongForceEnabled)
    universe.setStrongForceCoefficient(strongForceCoefficient)
    universe.setGravityEnabled(gravityEnabled)
    universe.setGravityCoefficient(gravityCoefficient)
    universe.setGroundGravityEnabled(groundGravityEnabled)
    universe.setGroundGravityCoefficient(groundGravityCoefficient)
    universe.setMode3D(mode3D)
    
    universeRef.current = universe
    drawUniverse()
  }
  
  const handleExitDrawMode = () => {
    setDrawMode(false)
  }
  
  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clickX = (event.clientX - rect.left) / rect.width
    const clickY = (event.clientY - rect.top) / rect.height
    
    if (drawMode && universeRef.current) {
      // Draw mode: Add particle at clicked position with no velocity
      // Account for zoom transformation if zoom is active
      let universeX = clickX;
      let universeY = clickY;
      
      if (zoomMode) {
        const viewWidth = 1 / zoomLevel;
        const viewHeight = 1 / zoomLevel;
        const viewMinX = zoomCenterX - viewWidth / 2;
        const viewMinY = zoomCenterY - viewHeight / 2;
        
        universeX = viewMinX + clickX * viewWidth;
        universeY = viewMinY + clickY * viewHeight;
      }
      
      // In 3D mode, randomize Z around 0.5 (range: 0.49 to 0.51)
      const z = 0.5 + (Math.random() - 0.5) * 2 * 1e-2;
      
      if (selectedParticleType === 'proton') {
        // Use charge multiplier for proton charge
        universeRef.current.addParticle(new Particle(universeX, universeY, 0, 0, chargeMultiplier, 100, false, z, 0))
      } else {
        universeRef.current.addParticle(new Particle(universeX, universeY, 0, 0, -1, 1, false, z, 0))
      }
      drawUniverse()
    } else if (zoomMode) {
      // Zoom mode: Convert click position to universe coordinates and zoom in
      const viewWidth = 1 / zoomLevel
      const viewHeight = 1 / zoomLevel
      const viewMinX = zoomCenterX - viewWidth / 2
      const viewMinY = zoomCenterY - viewHeight / 2
      
      // Calculate universe coordinates of click
      const universeX = viewMinX + clickX * viewWidth
      const universeY = viewMinY + clickY * viewHeight
      
      // Zoom in by 2x and center on clicked position
      setZoomLevel(zoomLevel * 2)
      setZoomCenterX(universeX)
      setZoomCenterY(universeY)
      drawUniverse()
    }
  }
  
  const handleZoomMode = () => {
    setZoomMode(true)
    setDrawMode(false)
  }
  
  const handleExitZoomMode = () => {
    setZoomMode(false)
  }
  
  const handleResetZoom = () => {
    setZoomLevel(1)
    setZoomCenterX(0.5)
    setZoomCenterY(0.5)
    drawUniverse()
  }
  
  const handleDeleteOutsideZoom = () => {
    if (!universeRef.current || zoomLevel <= 1) return
    
    // Calculate visible region bounds
    const viewWidth = 1 / zoomLevel
    const viewHeight = 1 / zoomLevel
    const minX = zoomCenterX - viewWidth / 2
    const maxX = zoomCenterX + viewWidth / 2
    const minY = zoomCenterY - viewHeight / 2
    const maxY = zoomCenterY + viewHeight / 2
    
    // Filter particles to keep only those inside the zoom region
    universeRef.current.particles = universeRef.current.particles.filter(particle => {
      return particle.x >= minX && particle.x <= maxX &&
             particle.y >= minY && particle.y <= maxY
    })
    
    drawUniverse()
  }
  
  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        if (universeRef.current) {
          // Run 100 steps per frame for smoother animation
          for (let i = 0; i < 100; i++) {
            universeRef.current.step()
          }
          drawUniverse()
        }
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])
  
  // Redraw when zoom changes
  useEffect(() => {
    drawUniverse()
  }, [zoomLevel, zoomCenterX, zoomCenterY])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            2D Physics Universe
          </h1>
          <p className="text-slate-400 text-lg">
            Simulating electrostatic forces between charged particles
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Universe Visualization</CardTitle>
                <CardDescription>1U × 1U space with electrostatic interactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={600}
                  className="w-full border-2 border-slate-700 rounded-lg shadow-2xl"
                  onClick={handleCanvasClick}
                  style={{ cursor: drawMode ? 'crosshair' : zoomMode ? 'zoom-in' : 'default' }}
                />
                
                {/* Axis View Selector */}
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => setViewAxis('xy')}
                    variant={viewAxis === 'xy' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    X-Y View
                  </Button>
                  <Button
                    onClick={() => setViewAxis('xz')}
                    variant={viewAxis === 'xz' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    X-Z View
                  </Button>
                  <Button
                    onClick={() => setViewAxis('yz')}
                    variant={viewAxis === 'yz' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    Y-Z View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Controls */}
          <div className="space-y-6">
            {/* Simulation Controls */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Simulation Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={handlePlayPause} 
                    className="flex-1"
                    variant={isPlaying ? "destructive" : "default"}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button onClick={handleReset} variant="outline">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleClearAll} variant="outline" title="Clear all particles">
                    Clear All
                  </Button>
                </div>
                
                <Button 
                  onClick={drawMode ? handleExitDrawMode : handleDrawMode}
                  className="w-full"
                  variant={drawMode ? "destructive" : "default"}
                >
                  {drawMode ? "Exit Draw Mode" : "Draw Your Own Map"}
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={zoomMode ? handleExitZoomMode : handleZoomMode}
                    className="flex-1"
                    variant={zoomMode ? "destructive" : "default"}
                    disabled={isPlaying}
                  >
                    {zoomMode ? "Exit Zoom" : "Zoom In"}
                  </Button>
                  {zoomLevel > 1 && (
                    <Button 
                      onClick={handleResetZoom}
                      variant="outline"
                    >
                      Reset Zoom
                    </Button>
                  )}
                </div>
                
                {zoomMode && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-4 space-y-2">
                      <p className="text-white text-sm font-semibold">Zoom Mode Active</p>
                      <p className="text-slate-400 text-xs">Click on the canvas to zoom in on that area</p>
                      <p className="text-slate-400 text-xs">Current zoom: {zoomLevel}x</p>
                      {zoomLevel > 1 && (
                        <Button 
                          onClick={handleDeleteOutsideZoom}
                          variant="destructive"
                          className="w-full mt-2"
                        >
                          Delete Particles Outside Zoom
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {drawMode && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-4 space-y-3">
                      <p className="text-white text-sm font-semibold">Draw Mode Active</p>
                      <p className="text-slate-400 text-xs">Click on the canvas to place particles</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedParticleType('proton')}
                          variant={selectedParticleType === 'proton' ? 'default' : 'outline'}
                          className="flex-1"
                        >
                          Proton (+)
                        </Button>
                        <Button
                          onClick={() => setSelectedParticleType('electron')}
                          variant={selectedParticleType === 'electron' ? 'default' : 'outline'}
                          className="flex-1"
                        >
                          Electron (-)
                        </Button>
                      </div>
                      
                      {selectedParticleType === 'proton' && (
                        <div className="space-y-2 pt-2 border-t border-slate-700">
                          <Label htmlFor="chargeMultiplier" className="text-white text-sm">
                            Charge Multiplier (N)
                          </Label>
                          <Input
                            id="chargeMultiplier"
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            value={chargeMultiplier}
                            onChange={(e) => setChargeMultiplier(parseInt(e.target.value) || 1)}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                          <p className="text-xs text-slate-400">
                            Proton will have {chargeMultiplier}× normal charge (+{chargeMultiplier}e)
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                <Button 
                  onClick={handleNextStep} 
                  className="w-full"
                  variant="secondary"
                  disabled={isPlaying}
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Next Step
                </Button>
                
                <div className="space-y-2">
                  <Label htmlFor="steps" className="text-white">Run N Steps</Label>
                  <div className="flex gap-2">
                    <Input
                      id="steps"
                      type="number"
                      min="1"
                      value={numSteps}
                      onChange={(e) => setNumSteps(parseInt(e.target.value) || 1)}
                      className="flex-1 bg-slate-800 border-slate-700 text-white"
                      disabled={isPlaying}
                    />
                    <Button 
                      onClick={handleRunSteps}
                      disabled={isPlaying}
                    >
                      Run
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Parameters */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="force" className="text-white">
                    Electrostatic Force Coefficient (K_electro)
                  </Label>
                  <Input
                    id="force"
                    type="number"
                    step="0.1"
                    value={electrostaticCoefficient}
                    onChange={(e) => setElectrostaticCoefficient(parseFloat(e.target.value) || 1)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Actual force: {electrostaticCoefficient}e-6 / distance²
                  </p>
                </div>
                
                
                
                <div className="space-y-2">
                  <Label htmlFor="strongForce" className="text-white">
                    Strong Force Coefficient (K_strong)
                  </Label>
                  <Input
                    id="strongForce"
                    type="number"
                    step="0.1"
                    min="0"
                    value={strongForceCoefficient}
                    onChange={(e) => setStrongForceCoefficient(parseFloat(e.target.value) || 1)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Repulsion: {strongForceCoefficient}e-10 / distance⁴
                  </p>
                </div>
                
                
                <div className="space-y-2">
                  <Label htmlFor="gravity" className="text-white">
                    Gravity Coefficient (K_gravity)
                  </Label>
                  <Input
                    id="gravity"
                    type="number"
                    step="0.1"
                    min="0"
                    value={gravityCoefficient}
                    onChange={(e) => setGravityCoefficient(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Attraction to center: mass × {gravityCoefficient}e-4 (toward 0.5, 0.5, 0.5)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="groundGravity" className="text-white">
                    Ground Gravity Coefficient (K_ground_gravity)
                  </Label>
                  <Input
                    id="groundGravity"
                    type="number"
                    step="0.1"
                    min="0"
                    value={groundGravityCoefficient}
                    onChange={(e) => setGroundGravityCoefficient(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Attraction to ground: mass × {groundGravityCoefficient}e-6 (toward y=1)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="protons" className="text-white">
                    Number of Protons
                  </Label>
                  <Input
                    id="protons"
                    type="number"
                    min="0"
                    max="10"
                    value={protonCount}
                    onChange={(e) => setProtonCount(parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="electrons" className="text-white">
                    Number of Free Electrons
                  </Label>
                  <Input
                    id="electrons"
                    type="number"
                    min="0"
                    max="20"
                    value={electronCount}
                    onChange={(e) => setElectronCount(parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    Apply & Reset
                  </Button>
                </div>
                
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="staticProtons"
                      checked={staticProtons}
                      onChange={(e) => setStaticProtons(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <Label htmlFor="staticProtons" className="text-white text-sm cursor-pointer">
                      Static Protons
                    </Label>
                  </div>
                  <p className="text-xs text-slate-400">
                    Prevent protons from moving (checked by default)
                  </p>
                </div>
                
                
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="strongForceEnabled"
                      checked={strongForceEnabled}
                      onChange={(e) => setStrongForceEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <Label htmlFor="strongForceEnabled" className="text-white text-sm cursor-pointer">
                      Strong Force
                    </Label>
                  </div>
                  <p className="text-xs text-slate-400">
                    Short-range repulsion: F = K_strong × 1e-10 / r⁴
                  </p>
                </div>
                
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="gravityEnabled"
                      checked={gravityEnabled}
                      onChange={(e) => setGravityEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <Label htmlFor="gravityEnabled" className="text-white text-sm cursor-pointer">
                      Gravitational Force
                    </Label>
                  </div>
                  <p className="text-xs text-slate-400">
                    Attraction to center: F = mass × K_gravity × 1e-4 (toward 0.5, 0.5, 0.5)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="groundGravityEnabled"
                      checked={groundGravityEnabled}
                      onChange={(e) => setGroundGravityEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <Label htmlFor="groundGravityEnabled" className="text-white text-sm cursor-pointer">
                      Ground Gravity
                    </Label>
                  </div>
                  <p className="text-xs text-slate-400">
                    Attraction to ground: F = mass × K_ground_gravity × 1e-6 (toward y=1)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mode3D"
                      checked={mode3D}
                      onChange={(e) => setMode3D(e.target.checked)}
                      disabled={universeRef.current && universeRef.current.particles.length > 0}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Label htmlFor="mode3D" className="text-white text-sm cursor-pointer">
                      3D Mode (locked after initialization)
                    </Label>
                  </div>
                  <p className="text-xs text-slate-400">
                    Enable 3D physics in a 1U cube (visualized as 2D projection)
                  </p>
                </div>
                
              </CardContent>
            </Card>
            
            {/* Particle Diagnostics */}
            {universeRef.current && (
              <>
                {universeRef.current.particles.filter(p => p.charge < 0).length === 1 && (
                  <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-blue-400 text-sm">Electron Diagnostics</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-300 space-y-2">
                      {(() => {
                        const electron = universeRef.current.particles.find(p => p.charge < 0);
                        if (!electron) return null;
                        const speed = Math.sqrt(electron.vx ** 2 + electron.vy ** 2);
                        const acceleration = Math.sqrt(electron.accelerationX ** 2 + electron.accelerationY ** 2);
                        const electroForce = Math.sqrt(electron.forceElectroX ** 2 + electron.forceElectroY ** 2);
                        
                        return (
                          <>
                            <div className="border-b border-slate-700 pb-2">
                              <p className="font-semibold text-white mb-1">Position</p>
                              <p>x: {electron.x.toFixed(4)} U</p>
                              <p>y: {electron.y.toFixed(4)} U</p>
                            </div>
                            <div className="border-b border-slate-700 pb-2">
                              <p className="font-semibold text-white mb-1">Velocity</p>
                              <p>vx: {electron.vx.toFixed(6)} U/s</p>
                              <p>vy: {electron.vy.toFixed(6)} U/s</p>
                              <p className="text-blue-300">|v|: {speed.toFixed(6)} U/s</p>
                            </div>
                            <div className="border-b border-slate-700 pb-2">
                              <p className="font-semibold text-white mb-1">Acceleration</p>
                              <p>ax: {electron.accelerationX.toFixed(6)} U/s²</p>
                              <p>ay: {electron.accelerationY.toFixed(6)} U/s²</p>
                              <p className="text-blue-300">|a|: {acceleration.toFixed(6)} U/s²</p>
                            </div>
                            <div>
                              <p className="font-semibold text-white mb-1">Electrostatic Force</p>
                              <p>Fx: {electron.forceElectroX.toFixed(8)} N</p>
                              <p>Fy: {electron.forceElectroY.toFixed(8)} N</p>
                              <p className="text-green-300">|F|: {electroForce.toFixed(8)} N</p>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
                
                {universeRef.current.particles.filter(p => p.charge > 0).length === 1 && (
                  <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-red-400 text-sm">Proton Diagnostics</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-300 space-y-2">
                      {(() => {
                        const proton = universeRef.current.particles.find(p => p.charge > 0);
                        if (!proton) return null;
                        const speed = Math.sqrt(proton.vx ** 2 + proton.vy ** 2);
                        const acceleration = Math.sqrt(proton.accelerationX ** 2 + proton.accelerationY ** 2);
                        const electroForce = Math.sqrt(proton.forceElectroX ** 2 + proton.forceElectroY ** 2);
                        
                        return (
                          <>
                            <div className="border-b border-slate-700 pb-2">
                              <p className="font-semibold text-white mb-1">Position</p>
                              <p>x: {proton.x.toFixed(4)} U</p>
                              <p>y: {proton.y.toFixed(4)} U</p>
                            </div>
                            <div className="border-b border-slate-700 pb-2">
                              <p className="font-semibold text-white mb-1">Velocity</p>
                              <p>vx: {proton.vx.toFixed(6)} U/s</p>
                              <p>vy: {proton.vy.toFixed(6)} U/s</p>
                              <p className="text-blue-300">|v|: {speed.toFixed(6)} U/s</p>
                            </div>
                            <div className="border-b border-slate-700 pb-2">
                              <p className="font-semibold text-white mb-1">Acceleration</p>
                              <p>ax: {proton.accelerationX.toFixed(6)} U/s²</p>
                              <p>ay: {proton.accelerationY.toFixed(6)} U/s²</p>
                              <p className="text-blue-300">|a|: {acceleration.toFixed(6)} U/s²</p>
                            </div>
                            <div>
                              <p className="font-semibold text-white mb-1">Electrostatic Force</p>
                              <p>Fx: {proton.forceElectroX.toFixed(8)} N</p>
                              <p>Fy: {proton.forceElectroY.toFixed(8)} N</p>
                              <p className="text-green-300">|F|: {electroForce.toFixed(8)} N</p>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            
            {/* Info */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-sm">Physics Model</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400 space-y-2">
                <p>• Protons (red, +1 charge, mass = 100)</p>
                <p>• Electrons (blue, -1 charge, mass = 1)</p>
                <p>• Electrostatic: F = -K × q₁ × q₂ / r² (K default = 10e-6)</p>
                <p>• Collision repulsion: F = K_collision × 1e-9 / r⁴ (toggleable)</p>
                <p>• Gravity: F = mass × K_gravity × 1e-4 toward center (0.5, 0.5, 0.5) (toggleable, off by default)</p>
                <p>• Acceleration: a = F / m</p>
                <p>• Velocity damping: K_brake × 1e-6 per step (toggleable, off by default)</p>
                <p>• Electron bounce: v = 1/4000 units</p>
                <p>• Proton bounce: elastic (same speed)</p>
                <p>• Bound electrons: 0.02-0.04 units from proton</p>
                <p>• Colored lines show velocity vectors</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
