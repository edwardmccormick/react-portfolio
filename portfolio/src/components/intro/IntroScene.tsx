import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Howl } from 'howler'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

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
  const mountainRef = useRef<THREE.Mesh>(null)
  const explosionRef = useRef<THREE.Mesh>(null)
  const f14Ref = useRef<THREE.Group>(null)
  const corvetteRef = useRef<THREE.Group>(null)
  
  // Animation state
  const [animStage, setAnimStage] = useState<AnimationStageType>(AnimationStage.WAITING)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [animationStarted, setAnimationStarted] = useState(false)
  
  // Animation control variables
  const animationTime = useRef(0)
  const explosionTime = useRef(0)
  const animationComplete = useRef(false)
  
  // F-14 animation state
  const f14Motion = useRef({
    phase: 'FLY_IN' as 'FLY_IN' | 'FORMATION' | 'OVERTAKE',
    startTime: 0
  })
  
  // Corvette animation state
  const corvetteMotion = useRef({
    phase: 'SPEEDING' as 'SPEEDING' | 'STEERING',
    startTime: 0
  })
  
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
      
      // Set sun expansion timing (about 5 seconds in)
      const gridApproachDuration = 15.0; // seconds
      explosionTime.current = gridApproachDuration;
      
      // Initialize explosion/sun expansion effect
      if (explosionRef.current) {
        log('Initializing sun expansion effect', true);
        // Position in the horizon
        explosionRef.current.position.set(0, 0, -15);
        explosionRef.current.scale.set(0.1, 0.1, 0.1);
        explosionRef.current.visible = true;
      }
      
      // Initialize F-14 animation
      if (f14Ref.current) {
        log('Initializing F-14 fly-in animation', true);
        f14Ref.current.position.set(20, 2, -10);
        f14Ref.current.rotation.set(0, -Math.PI / 4, 0);
        f14Motion.current.phase = 'FLY_IN';
        f14Motion.current.startTime = 0;
      }
      
      // Initialize Corvette animation
      if (corvetteRef.current) {
        log('Initializing Corvette animation', true);
        corvetteRef.current.position.set(0, -2, 5); // On the grid surface
        corvetteRef.current.rotation.set(0, 0, 0);
        corvetteMotion.current.phase = 'SPEEDING';
        corvetteMotion.current.startTime = 0;
      }
      
      // Make sure all animations start from the beginning
      animationComplete.current = false;
      
      log('Animation initialization complete', true);
    }
  }, [isPlaying, modelsLoaded, animationStarted]);
  
  // Grid motion animation references
  const gridMotionRef = useRef({
    speed: 0.0,         // DOUBLED starting speed (was 0.5)
    acceleration: 0.33, // DOUBLED acceleration (was 0.01)
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
            
            // log(`Updating grid motion: time=${gridMotion.uvOffset.toFixed(2)}, speed=${gridMotion.speed.toFixed(2)}`, true);
          }
        }
        
        // Slowly move mountains and sun closer and larger (1/100th the speed of grid)
        const slowMotion = gridMotion.uvOffset * 0.03;
        
        // Move and scale mountains
        if (mountainRef.current) {
          mountainRef.current.position.z = -30 + slowMotion * 10; // Move closer slowly
          const mountainScale = 1 + slowMotion * 0.15; // Grow slowly
          mountainRef.current.scale.set(mountainScale, mountainScale, mountainScale);
        }
        
        // Move and scale sun
        if (sunRef.current) {
          sunRef.current.position.z = -50 + slowMotion * 8; // Move closer slowly
          const sunScale = 1 + slowMotion * 0.18; // Grow slightly faster than mountains
          sunRef.current.scale.set(sunScale, sunScale, sunScale);
        }
        
        // Animate F-14 Tomcat
        if (f14Ref.current) {
          const time = animationTime.current;
          const f14 = f14Ref.current;
          
          // Phase 1: Fly-in with barrel roll (0-5s)
          if (time < 5.0) {
            const t = time / 5.0;
            f14.position.set(
              20 * (1 - t), // Right to center
              2 + Math.sin(t * Math.PI * 4) * 3, // Barrel roll
              -10 - t * 5
            );
            f14.rotation.z = t * Math.PI * 4; // Roll rotation
            f14.rotation.y = -Math.PI / 4 + t * Math.PI / 4; // Turn toward camera
            f14Motion.current.phase = 'FLY_IN';
          }
          
          // Phase 1.5: Smooth transition to formation (5-6s)
          else if (time >= 5.0 && time < 6.0) {
            const t = (time - 5.0) / 1.0; // 1 second transition
            const eased = easeInOut(t);
            
            // Smooth transition from barrel roll end to formation position
            const startX = 0; // Where barrel roll ended
            const startY = 2;
            const startZ = -15;
            
            f14.position.set(
              startX + (-8 - startX) * eased, // Smooth to left side
              startY + (1 - startY) * eased,   // Smooth to formation height
              startZ + gridMotion.uvOffset * 0.8 * eased // Start following grid
            );
            
            // Smooth rotation transition
            f14.rotation.z = 0; // Stop rolling
            f14.rotation.y = 0; // Face forward
            f14Motion.current.phase = 'TRANSITION';
          }
          
          // Phase 2: Formation flight (6-12s)
          else if (time >= 6.0 && time < 12.0) {
            f14.position.set(-8, 1, -15 + gridMotion.uvOffset * 0.8); // Fly alongside
            f14Motion.current.phase = 'FORMATION';
          }
          
          // Phase 3: Camera overtakes with banking (12-15s)
          else if (time >= 12.0) {
            if (f14Motion.current.phase !== 'OVERTAKE') {
              f14Motion.current.phase = 'OVERTAKE';
              f14Motion.current.startTime = time; // Record overtake start time
            }
            
            const overtakeTime = time - f14Motion.current.startTime;
            
            // Banking maneuvers during overtake
            let bankAngle = 0;
            if (overtakeTime < 1.0) {
              // Bank right for first second
              bankAngle = Math.sin(overtakeTime * Math.PI) * 0.3; // 0.3 radians max
            } else if (overtakeTime < 2.0) {
              // Bank left for second second
              bankAngle = -Math.sin((overtakeTime - 1.0) * Math.PI) * 0.4; // Slightly more left bank
            }
            
            f14.rotation.z = bankAngle;
            f14.position.z += gridMotion.speed * 0.5 * delta; // F-14 falls behind
            f14.position.y -= delta * 2; // Descends below camera
          }
        }
        
        // Animate Corvette
        if (corvetteRef.current) {
          const time = animationTime.current;
          const corvette = corvetteRef.current;
          
          // Phase 1: Speed out from under camera (0-3s)
          if (time < 3.0) {
            const t = time / 3.0;
            corvette.position.set(
              0, // Stay centered
              -2, // On the grid surface
              5 - t * 25 // Speed forward
            );
            corvetteMotion.current.phase = 'SPEEDING';
          }
          
          // Phase 2: Steering left and right as camera catches up (3-12s)
          else if (time >= 3.0 && time < 12.0) {
            if (corvetteMotion.current.phase !== 'STEERING') {
              corvetteMotion.current.phase = 'STEERING';
              corvetteMotion.current.startTime = time;
            }
            
            const steerTime = time - corvetteMotion.current.startTime;
            
            // Steering pattern: left, right, left
            let steerX = 0;
            let steerAngle = 0;
            
            if (steerTime < 3.0) {
              // Steer left
              steerX = -Math.sin(steerTime * Math.PI / 3) * 4;
              steerAngle = -Math.sin(steerTime * Math.PI / 3) * 0.3;
            } else if (steerTime < 6.0) {
              // Steer right
              const t = steerTime - 3.0;
              steerX = Math.sin(t * Math.PI / 3) * 5;
              steerAngle = Math.sin(t * Math.PI / 3) * 0.4;
            } else {
              // Steer left again
              const t = steerTime - 6.0;
              steerX = -Math.sin(t * Math.PI / 3) * 3;
              steerAngle = -Math.sin(t * Math.PI / 3) * 0.25;
            }
            
            corvette.position.set(
              steerX,
              -2, // On the grid surface
              -20 + gridMotion.uvOffset * 0.6 // Move with grid but slower
            );
            corvette.rotation.y = steerAngle;
          }
          
          // Phase 3: Camera overtakes (12s+)
          else {
            corvette.position.z += gridMotion.speed * 0.3 * delta; // Falls behind slower than F-14
          }
        }
        
        // Check if it's time to start sun expansion
        if (animationTime.current >= explosionTime.current) {
            log('Animation complete', true);
            animationComplete.current = true;
            onExplosionComplete();
          }
        
        break;
      }
      
      case AnimationStage.SUN_EXPANSION: {

          // Call completion immediately when entering this stage, but only once
        if (!animationComplete.current) {
          log('Animation complete', true);
          animationComplete.current = true;
          onExplosionComplete();
        }
        // // Handle sun expansion animation
        // if (explosionRef.current) {
        //   const explosionElapsed = animationTime.current - explosionTime.current;
          
        //   // Show explosion if it just started
        //   if (!explosionRef.current.visible) {
        //     explosionRef.current.visible = true;
        //     log('Sun expansion started', true);
        //   }
          
        //   // Scale up sun over time
        //   if (explosionElapsed < 1.5) {
        //     const scale = 1.0 + explosionElapsed * 20; // Grow to size 20x over 1 second
        //     explosionRef.current.scale.set(scale, scale, scale);
            
        //     // Move sun closer to viewer
        //     explosionRef.current.position.z += delta * 10;
        //     // onExplosionComplete();
            
        //   }
          
        //   // Check if explosion is complete
        //   if (explosionElapsed > 1.5 && !animationComplete.current) {
        //     log('Animation complete', true);
        //     animationComplete.current = true;
        //     onExplosionComplete();
        //   }
        // }
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
    // useEffect(() => {
    //   log('RetroGrid mounted', true);
    // }, []);
    
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
  
  // Mountain silhouette component - craggy valley formation
  const MountainSilhouette = () => {
    // Create mountain shape with craggy valley in center
    const createCraggyValleyShape = () => {
      const shape = new THREE.Shape();
      
      // Start at far left edge - extended viewport
      shape.moveTo(-100, -5);
      
      // Far left mountains - craggy and uneven
      shape.bezierCurveTo(-95, -2, -90, 4, -85, 2);
      shape.bezierCurveTo(-80, 0, -78, 6, -75, 4);
      shape.bezierCurveTo(-72, 2, -70, 8, -65, 6);
      shape.bezierCurveTo(-60, 4, -55, 2, -50, 3);
      
      // Left side rising towards valley - more peaks
      shape.bezierCurveTo(-45, 5, -42, 10, -38, 8);
      shape.bezierCurveTo(-35, 6, -32, 12, -28, 10);
      shape.bezierCurveTo(-25, 8, -22, 14, -18, 12);
      
      // Valley descent - craggy approach to sun
      shape.bezierCurveTo(-15, 10, -12, 6, -8, 4);
      shape.bezierCurveTo(-5, 2, -2, 3, 0, 1); // Valley floor where sun sits
      
      // Valley ascent - mirror the descent with variations
      shape.bezierCurveTo(2, 3, 5, 2, 8, 4);
      shape.bezierCurveTo(12, 6, 15, 10, 18, 12);
      
      // Right side peaks - craggy mirror of left
      shape.bezierCurveTo(22, 14, 25, 8, 28, 10);
      shape.bezierCurveTo(32, 12, 35, 6, 38, 8);
      shape.bezierCurveTo(42, 10, 45, 5, 50, 3);
      
      // Far right mountains - extended and craggy
      shape.bezierCurveTo(55, 2, 60, 4, 65, 6);
      shape.bezierCurveTo(70, 8, 72, 2, 75, 4);
      shape.bezierCurveTo(78, 6, 80, 0, 85, 2);
      shape.bezierCurveTo(90, 4, 95, -2, 100, -5);
      
      // Close the shape
      shape.lineTo(-100, -5);
      
      return shape;
    };
    
    const mountainShape = createCraggyValleyShape();
    const extrudeSettings = {
      steps: 1,
      depth: 0.5,
      bevelEnabled: false
    };
    
    return (
      <mesh ref={mountainRef} position={[0, -2, -30]} rotation={[0, 0, 0]}>
        <extrudeGeometry args={[mountainShape, extrudeSettings]} />
        <meshStandardMaterial 
          color="#3a1f5d" 
          emissive="#2a1f5d"
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
    );
  };
  
  // F-14 Tomcat component
  const F14Tomcat = () => {
    try {
      const { scene } = useGLTF('/models/f14_tomcat_lowpoly.glb');
      
      // Fix transparency on model load
      useEffect(() => {
        if (scene) {
          scene.traverse((child: any) => {
            if (child.isMesh && child.material) {
              child.material.transparent = false;
              child.material.opacity = 1;
            }
          });
        }
      }, [scene]);
      
      return (
        <primitive 
          ref={f14Ref} 
          object={scene} 
          scale={[0.5, 0.5, 0.5]} 
          position={[20, 2, -10]}
        />
      );
    } catch (error) {
      log('F-14 model failed to load, using placeholder', true);
      // Fallback placeholder
      return (
        <mesh ref={f14Ref} position={[20, 2, -10]} scale={[0.5, 0.5, 0.5]}>
          <boxGeometry args={[2, 0.5, 4]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      );
    }
  };
  
  // Corvette component
  const Corvette = () => {
    try {
      const { scene } = useGLTF('/models/corvette__low_poly.glb');
      
      // Fix transparency on model load
      useEffect(() => {
        if (scene) {
          scene.traverse((child: any) => {
            if (child.isMesh && child.material) {
              child.material.transparent = false;
              child.material.opacity = 1;
            }
          });
        }
      }, [scene]);
      
      return (
        <primitive 
          ref={corvetteRef} 
          object={scene} 
          scale={[0.8, 0.8, 0.8]} 
          position={[0, -2, 5]}
        />
      );
    } catch (error) {
      log('Corvette model failed to load, using placeholder', true);
      // Fallback placeholder
      return (
        <mesh ref={corvetteRef} position={[0, -2, 5]} scale={[0.8, 0.8, 0.8]}>
          <boxGeometry args={[1.5, 0.6, 3]} />
          <meshStandardMaterial color="#ff0066" />
        </mesh>
      );
    }
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
      <F14Tomcat />
      <Corvette />
      <Explosion />
      
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 10, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 5, 0]} intensity={2} color="#ff00ff" />
      <spotLight position={[0, 10, 0]} intensity={2} angle={0.6} penumbra={0.5} castShadow />
    </>
  );
};

export default IntroScene;