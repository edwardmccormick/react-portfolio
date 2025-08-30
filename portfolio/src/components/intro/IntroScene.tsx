import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Howl } from 'howler'
import { useFrame, useThree } from '@react-three/fiber'

// Create DEBUG flag for controlling verbose logging
const DEBUG = false; // Set to false for production

// Set to false to hide 3D debug helpers
const SHOW_DEBUG = false;

// Helper function for conditional logging
const log = (message: string, force = false) => {
  if (DEBUG || force) {
    console.log(`[IntroScene] ${message}`);
  }
};

// Animation stages for the state machine
// Using string literals instead of enum to avoid TypeScript errors
const AnimationStage = {
  WAITING: 'WAITING',               // Waiting for scene to load
  GRID_APPROACH: 'GRID_APPROACH',   // Grid moving toward sun with acceleration
  SUN_EXPANSION: 'SUN_EXPANSION',   // Sun grows and fills the screen
  COMPLETED: 'COMPLETED'            // Animation completed
} as const

type AnimationStageType = typeof AnimationStage[keyof typeof AnimationStage]

// No need for waypoints in the synthwave grid scene

interface IntroSceneProps {
  onSceneLoaded: () => void
  onExplosionComplete: () => void
  isPlaying: boolean
  howl: Howl | null
}

const IntroScene = ({ 
  onSceneLoaded, 
  onExplosionComplete, 
  isPlaying 
}: IntroSceneProps) => {
  log('Component initialized');
  
  // Use the Three.js context
  useThree();
  
  // References to our 3D objects
  const gridRef = useRef<THREE.Mesh>(null)
  const sunRef = useRef<THREE.Group>(null)
  const explosionRef = useRef<THREE.Mesh>(null)
  
  // Animation state
  const [animStage, setAnimStage] = useState<AnimationStageType>(AnimationStage.WAITING)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [animationStarted, setAnimationStarted] = useState(false)
  
  // Animation control variables
  const animationTime = useRef(0)
  const explosionTime = useRef(0)
  const animationComplete = useRef(false)
  
  // Immediately indicate scene is loaded
  useEffect(() => {
    log('Component mounted, notifying parent');
    
    // Use a ref to track if the component is mounted
    const mounted = { current: true };
    
    // Short timeout to ensure components are rendered
    const timer = setTimeout(() => {
      if (mounted.current) {
        setModelsLoaded(true);
        onSceneLoaded();
        log('Scene marked as loaded', true);
      }
    }, 300); // Reduced timeout for faster loading
    
    return () => {
      log('Component unmounting, cleaning up');
      mounted.current = false;
      clearTimeout(timer);
    };
  }, [onSceneLoaded]);
  
  // Reference for animation control
  const timelineRef = useRef<any>(null);
  
  // Add WebGL context loss handling
  useEffect(() => {
    // WebGL context event handlers
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      log('WebGL context lost', true);
      
      // Pause any ongoing animations
      if (timelineRef.current) {
        timelineRef.current.pause();
      }
    };
    
    const handleContextRestored = () => {
      log('WebGL context restored', true);
      
      // Resume animations if possible
      if (timelineRef.current && animationStarted) {
        timelineRef.current.play();
      }
    };
    
    // Add event listeners for WebGL context events
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);
      
      // Return cleanup function
      return () => {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      };
    }
  }, [animationStarted]);
  
  // Animation initialization effect
  useEffect(() => {
    if (isPlaying && modelsLoaded && !animationStarted) {
      log('Starting synthwave grid animation sequence', true);
      setAnimationStarted(true);
      setAnimStage(AnimationStage.GRID_APPROACH);
      
      // Reset animation parameters
      animationTime.current = 0;
      
      // Reset grid motion values
      const gridMotion = gridMotionRef.current;
      gridMotion.speed = 0.5;
      gridMotion.uvOffset = 0;
      
      // Set sun expansion timing (about 10 seconds in)
      const gridApproachDuration = 10.0; // seconds
      explosionTime.current = gridApproachDuration;
      
      // Initialize explosion/sun expansion effect
      if (explosionRef.current) {
        log('Initializing sun expansion effect', true);
        // Position in the horizon
        explosionRef.current.position.set(0, 0, -15);
        explosionRef.current.scale.set(0.1, 0.1, 0.1);
        explosionRef.current.visible = true;
      }
      
      // Make sure all animations start from the beginning
      animationComplete.current = false;
      
      log('Animation initialization complete', true);
    }
  }, [isPlaying, modelsLoaded, animationStarted]);
  
  // Grid motion animation references
  const gridMotionRef = useRef({
    speed: 1.0,         // DOUBLED starting speed (was 0.5)
    acceleration: 0.5, // DOUBLED acceleration (was 0.01)
    maxSpeed: 5.0,      // DOUBLED max speed (was 1.5)
    uvOffset: 0
  });
  
  // Main animation loop using useFrame
  useFrame((_, delta) => {
    // Only run animation if it's playing and has started
    if (!isPlaying || !animationStarted || animationComplete.current) return;
    
    // Update animation time
    animationTime.current += delta;
    
    // Handle animation based on current stage
    switch (animStage) {
      case AnimationStage.GRID_APPROACH: {
        // Accelerate the grid movement to create the driving effect
        const gridMotion = gridMotionRef.current;
        
        // Apply acceleration
        if (gridMotion.speed < gridMotion.maxSpeed) {
          gridMotion.speed += gridMotion.acceleration * delta;
          gridMotion.speed = Math.min(gridMotion.speed, gridMotion.maxSpeed);
        }
        
        // Update UV offset to create forward motion
        gridMotion.uvOffset += gridMotion.speed * delta;
        
        // Direct reference to RetroGrid component's material
        if (gridRef.current && gridRef.current.material) {
          const material = gridRef.current.material as THREE.ShaderMaterial;
          if (material.uniforms) {
            // Update time uniform to create movement effect
            material.uniforms.time.value = gridMotion.uvOffset;
            // Update speed uniform based on current speed
            material.uniforms.speed.value = gridMotion.speed;
            
            log(`Updating grid motion: time=${gridMotion.uvOffset.toFixed(2)}, speed=${gridMotion.speed.toFixed(2)}`, true);
          }
        }
        
        // Check if it's time to start sun expansion
        if (animationTime.current >= explosionTime.current) {
          setAnimStage(AnimationStage.SUN_EXPANSION);
          log('Animation stage: SUN_EXPANSION', true);
        }
        
        break;
      }
      
      case AnimationStage.SUN_EXPANSION: {
        // Handle sun expansion animation
        if (explosionRef.current) {
          const explosionElapsed = animationTime.current - explosionTime.current;
          
          // Show explosion if it just started
          if (!explosionRef.current.visible) {
            explosionRef.current.visible = true;
            log('Sun expansion started', true);
          }
          
          // Scale up sun over time
          if (explosionElapsed < 2.0) {
            const scale = 1.0 + explosionElapsed * 10; // Grow to size 20x over 2 seconds
            explosionRef.current.scale.set(scale, scale, scale);
            
            // Move sun closer to viewer
            explosionRef.current.position.z += delta * 10;
          }
          
          // Check if explosion is complete
          if (explosionElapsed > 2.0 && !animationComplete.current) {
            log('Animation complete', true);
            animationComplete.current = true;
            onExplosionComplete();
          }
        }
        break;
      }
      
      case AnimationStage.COMPLETED: {
        // Animation is done
        break;
      }
    }
  });
  
  // Helper function for animation easing
  const easeInOut = (t: number): number => {
    // Ease in-out sine
    return -(Math.cos(Math.PI * t) - 1) / 2;
  };
  
  // Retro Grid component
  const RetroGrid = () => {
    // State for animating the grid
    const gridSize = 200;       // Increased size for larger grid
    const gridDivisions = 30;   // More divisions for more detailed grid (was 20)
    const gridMatRef = useRef<THREE.ShaderMaterial>(null);
    
    // Log when grid is mounted
    useEffect(() => {
      log('RetroGrid mounted', true);
    }, []);
    
    // Custom shader for the retro grid
    const gridShader = {
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color("#00FFFF") }, // Cyan color like in reference
        fadeDistance: { value: 60.0 },
        glowIntensity: { value: 1.0 },
        speed: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float fadeDistance;
        uniform float glowIntensity;
        uniform float speed;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          // Create proper perspective grid
          // Horizontal lines (move with time)
          float horizontalLineSize = 0.04; // THINNER lines (was 0.1)
          float horizontalLine = step(1.0 - horizontalLineSize, fract(vUv.y * 30.0 + time * speed)); // 1.5x MORE lines (was 10.0)
          
          // Vertical lines (fixed)
          float verticalLineSize = 0.03; // THINNER lines (was 0.05)
          float verticalLine = step(1.0 - verticalLineSize, fract(vUv.x * 30.0)); // 1.5x MORE lines (was 10.0)
          
          // Combine lines
          float grid = max(horizontalLine, verticalLine);
          
          // Fade out with distance
          float dist = abs(vUv.y) * fadeDistance;
          float fadeOut = smoothstep(fadeDistance, 0.0, dist);
          
          // Final color
          gl_FragColor = vec4(color, grid * fadeOut * 0.8);
        }
      `
    };
    
    // Log grid initialization
    useEffect(() => {
      log('RetroGrid component initialized', true);
      if (gridMatRef.current) {
        log('gridMatRef is available', true);
      }
    }, []);
    
    return (
      <mesh 
        ref={gridRef} 
        rotation={[-Math.PI / 2, 0, 0]}  // Flat on XZ plane
        position={[0, -2, 0]}
        renderOrder={10} // Ensure grid renders on top
      >
        <planeGeometry args={[gridSize, gridSize, gridDivisions, gridDivisions]} />
        <shaderMaterial 
          ref={gridMatRef}
          args={[gridShader]}
          transparent={true}
          wireframe={false}     // Changed to false to avoid duplicate lines
          depthWrite={false}    // Helps with transparency issues
          depthTest={false}     // Further ensures visibility
        />
      </mesh>
    );
  };
  
  // Synthwave Sun component
  const SynthwaveSun = () => {
    // Reference for animations
    const sunMatRef = useRef<THREE.ShaderMaterial>(null);
    
    // Custom shader for the sun with glow effect
    const sunShader = {
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color("#ff6600") }, // More orange like reference
        glowColor: { value: new THREE.Color("#ff0066") }, // Pink glow
        pulseSpeed: { value: 0.5 },
        pulseIntensity: { value: 0.2 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 glowColor;
        uniform float pulseSpeed;
        uniform float pulseIntensity;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          // Edge glow effect
          float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          
          // Pulsating effect
          float pulse = pulseIntensity * sin(time * pulseSpeed);
          
          // Color mixing with glow
          vec3 color = mix(baseColor, glowColor, intensity + pulse);
          
          // Final color with glow intensity
          gl_FragColor = vec4(color, 1.0);
        }
      `
    };
    
    // Update shader uniforms on each frame
    useFrame((_, delta) => {
      if (sunMatRef.current) {
        sunMatRef.current.uniforms.time.value += delta;
      }
    });
    
    return (
      <group ref={sunRef} position={[0, 5, -50]}> {/* Raised sun position */}
        {/* Main sun sphere */}
        <mesh>
          <sphereGeometry args={[15, 32, 32]} /> {/* Larger sun */}
          <shaderMaterial
            ref={sunMatRef}
            args={[sunShader]}
            transparent={true}
          />
        </mesh>
        
        {/* Outer glow */}
        <mesh>
          <sphereGeometry args={[10.5, 32, 32]} />
          <meshBasicMaterial
            color="#ff00ff"
            transparent={true}
            opacity={0.3}
          />
        </mesh>
      </group>
    );
  };
  
  // Mountain silhouette component
  const MountainSilhouette = () => {
    // Create mountain shape using shape and extrude geometry
    const createMountainShape = () => {
      const shape = new THREE.Shape();
      
      // Start at the left edge
      shape.moveTo(-60, -5);
      
      // Create smoother mountains like in reference
      // Left side mountains
      shape.bezierCurveTo(-55, -2, -50, 4, -45, 2);
      shape.bezierCurveTo(-40, 0, -38, 6, -35, 4);
      shape.bezierCurveTo(-32, 2, -30, 8, -25, 6);
      shape.bezierCurveTo(-20, 4, -15, 2, -10, 3);
      
      // Center mountains
      shape.bezierCurveTo(-5, 4, -2, 10, 0, 12); // Tallest peak
      shape.bezierCurveTo(2, 10, 5, 8, 8, 10);
      shape.bezierCurveTo(10, 12, 15, 8, 18, 6);
      
      // Right side mountains
      shape.bezierCurveTo(22, 4, 25, 7, 30, 5);
      shape.bezierCurveTo(35, 3, 40, 6, 45, 4);
      shape.bezierCurveTo(50, 2, 55, 0, 60, -5);
      
      // Close the shape
      shape.lineTo(-60, -5);
      
      return shape;
    };
    
    const mountainShape = createMountainShape();
    const extrudeSettings = {
      steps: 1,
      depth: 0.5,
      bevelEnabled: false
    };
    
    return (
      <mesh position={[0, -2, -30]} rotation={[0, 0, 0]}>
        <extrudeGeometry args={[mountainShape, extrudeSettings]} />
        <meshStandardMaterial 
          color="#3a1f5d" 
          emissive="#2a1f5d"
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>
    );
  };
  
  // Explosion component for sun expansion
  const Explosion = () => {
    return (
      <mesh ref={explosionRef} position={[0, -2, 0]} scale={[0.1, 0.1, 0.1]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial 
          color="#ffffff"
          transparent={true}
          opacity={1}
        />
        {/* Inner explosion */}
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
        {/* Core */}
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      </mesh>
    );
  };
  
  return (
    <>
      {/* Dark purple background */}
      <color attach="background" args={['#0d0221']} />
      
      {/* Debug helpers - only in development */}
      {SHOW_DEBUG && <axesHelper args={[10]} />}
      
      {/* Scene elements */}
      <RetroGrid />
      <SynthwaveSun />
      <MountainSilhouette />
      {/* No debug elements needed */}
      
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 10, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 5, 0]} intensity={2} color="#ff00ff" />
      <spotLight position={[0, 10, 0]} intensity={2} angle={0.6} penumbra={0.5} castShadow />
    </>
  );
};

export default IntroScene;