import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

const DEBUG = false
const SHOW_DEBUG = false

const log = (message: string, force = false) => {
  if (DEBUG || force) {
    console.log(`[IntroScene] ${message}`)
  }
}

const AnimationStage = {
  WAITING: 'WAITING',
  GRID_APPROACH: 'GRID_APPROACH',
  SUN_EXPANSION: 'SUN_EXPANSION',
  COMPLETED: 'COMPLETED',
} as const

type AnimationStageType = typeof AnimationStage[keyof typeof AnimationStage]

type SunUniforms = {
  time: { value: number }
  baseColor: { value: THREE.Color }
  glowColor: { value: THREE.Color }
  pulseSpeed: { value: number }
  pulseIntensity: { value: number }
  glowFactor: { value: number }
}

type GridUniforms = {
  time: { value: number }
  color: { value: THREE.Color }
  fadeDistance: { value: number }
  glowIntensity: { value: number }
  speed: { value: number }
}

interface IntroSceneProps {
  onSceneLoaded: () => void
  onExplosionComplete: () => void
  isPlaying: boolean
}

const easeInOut = (t: number): number => {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const easeOutCubic = (t: number): number => {
  const clamped = THREE.MathUtils.clamp(t, 0, 1)
  return 1 - Math.pow(1 - clamped, 3)
}

const IntroScene = ({ onSceneLoaded, onExplosionComplete, isPlaying }: IntroSceneProps) => {
  log('Component initialized')

  const gridRef = useRef<THREE.Mesh>(null)
  const sunRef = useRef<THREE.Group>(null)
  const mountainRef = useRef<THREE.Mesh>(null)
  const mountainMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const sunGlowMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const explosionRef = useRef<THREE.Mesh>(null)
  const explosionMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const sunTriggeredRef = useRef(false)

  const [animStage, setAnimStage] = useState<AnimationStageType>(AnimationStage.WAITING)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [animationStarted, setAnimationStarted] = useState(false)

  const animationTime = useRef(0)
  const animationComplete = useRef(false)

  const totalDuration = 15
  const glowPhaseStart = totalDuration - 5
  const sunIntroStart = totalDuration - 3

  const gridMotionRef = useRef({
    speed: 0,
    targetSpeed: 0,
    uvOffset: 0,
  })

  const { scene, camera } = useThree()

  const sunUniforms = useMemo<SunUniforms>(() => ({
    time: { value: 0 },
    baseColor: { value: new THREE.Color('#ff6600') },
    glowColor: { value: new THREE.Color('#ff00ff') },
    pulseSpeed: { value: 0.5 },
    pulseIntensity: { value: 0.25 },
    glowFactor: { value: 0.45 },
  }), [])

  const gridUniforms = useMemo<GridUniforms>(() => ({
    time: { value: 0 },
    color: { value: new THREE.Color('#36f9f6') },
    fadeDistance: { value: 60 },
    glowIntensity: { value: 0.5 },
    speed: { value: 1 },
  }), [])

  const mountainBaseEmissive = useMemo(() => new THREE.Color('#2a1f5d'), [])
  const mountainPeakEmissive = useMemo(() => new THREE.Color('#ff6ad5'), [])
  const fogStartColor = useMemo(() => new THREE.Color('#0d0221'), [])
  const fogGlowColor = useMemo(() => new THREE.Color('#431a7f'), [])

  useEffect(() => {
    const originalFog = scene.fog
    const fog = new THREE.Fog(fogStartColor.getHex(), 28, 110)
    scene.fog = fog

    const originalBackground = scene.background instanceof THREE.Color ? scene.background.clone() : null
    scene.background = fogStartColor.clone()

    const originalFov = camera.fov
    camera.fov = 58
    camera.updateProjectionMatrix()

    const timer = window.setTimeout(() => {
      setModelsLoaded(true)
      onSceneLoaded()
      log('Scene marked as loaded', true)
    }, 150)

    return () => {
      scene.fog = originalFog || null
      if (originalBackground) {
        scene.background = originalBackground
      }
      camera.fov = originalFov
      camera.updateProjectionMatrix()
      window.clearTimeout(timer)
    }
  }, [camera, fogStartColor, onSceneLoaded, scene])

  useEffect(() => {
    if (isPlaying && modelsLoaded && !animationStarted) {
      log('Starting synthwave mountain animation', true)
      setAnimationStarted(true)
      setAnimStage(AnimationStage.GRID_APPROACH)

      animationTime.current = 0
      animationComplete.current = false

      const gridMotion = gridMotionRef.current
      gridMotion.speed = 0.25
      gridMotion.targetSpeed = 0.8
      gridMotion.uvOffset = 0

      sunUniforms.time.value = 0
      sunUniforms.pulseIntensity.value = 0.25
      sunUniforms.glowFactor.value = 0.45
      gridUniforms.glowIntensity.value = 0.5

      sunTriggeredRef.current = false

      if (sunRef.current) {
        sunRef.current.scale.setScalar(1.2)
      }

      if (sunGlowMaterialRef.current) {
        sunGlowMaterialRef.current.opacity = 0.25
      }

      if (mountainMaterialRef.current) {
        mountainMaterialRef.current.emissive.copy(mountainBaseEmissive)
        mountainMaterialRef.current.emissiveIntensity = 0.25
        mountainMaterialRef.current.metalness = 0.1
        mountainMaterialRef.current.roughness = 0.8
      }

      if (explosionRef.current) {
        explosionRef.current.visible = false
        explosionRef.current.scale.setScalar(0.2)
      }

      if (explosionMaterialRef.current) {
        explosionMaterialRef.current.opacity = 1
      }
    }
  }, [animationStarted, gridUniforms, isPlaying, modelsLoaded, mountainBaseEmissive, sunUniforms])

  useFrame((_, delta) => {
    if (!isPlaying || !animationStarted || animationComplete.current) return

    animationTime.current += delta
    const time = animationTime.current

    if (animStage === AnimationStage.GRID_APPROACH && time >= sunIntroStart) {
      setAnimStage(AnimationStage.SUN_EXPANSION)
    }

    const approachProgress = Math.min(time / glowPhaseStart, 1)
    const glowProgress = time < glowPhaseStart ? 0 : Math.min((time - glowPhaseStart) / (sunIntroStart - glowPhaseStart), 1)
    const bloomProgressRaw = time < sunIntroStart ? 0 : Math.min((time - sunIntroStart) / (totalDuration - sunIntroStart), 1)
    const bloomProgress = easeOutCubic(bloomProgressRaw)

    const gridMotion = gridMotionRef.current
    const baseTarget = THREE.MathUtils.lerp(0.8, 5.0, easeInOut(approachProgress))
    const glowSlowdown = THREE.MathUtils.lerp(1, 0.75, glowProgress)
    let targetSpeed = baseTarget * glowSlowdown
    targetSpeed = THREE.MathUtils.lerp(targetSpeed, 0.45, bloomProgressRaw)

    gridMotion.targetSpeed = targetSpeed
    gridMotion.speed = THREE.MathUtils.lerp(gridMotion.speed, gridMotion.targetSpeed, 1.4 * delta)
    gridMotion.uvOffset += gridMotion.speed * delta

    gridUniforms.time.value = gridMotion.uvOffset
    gridUniforms.speed.value = gridMotion.speed
    gridUniforms.glowIntensity.value = 0.5 + approachProgress * 0.4 + glowProgress * 0.6

    const fogBlend = Math.min(approachProgress + glowProgress * 0.6, 1)
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(fogStartColor).lerp(fogGlowColor, fogBlend)
    }
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(fogStartColor).lerp(fogGlowColor, Math.min(fogBlend * 1.1, 1))
    }

    if (mountainRef.current) {
      const mountainScale = THREE.MathUtils.lerp(1, 1.35, approachProgress)
      mountainRef.current.scale.setScalar(mountainScale)
      mountainRef.current.position.z = -35 + approachProgress * 9
      mountainRef.current.position.y = THREE.MathUtils.lerp(-2, -1.5, glowProgress)
    }

    if (mountainMaterialRef.current) {
      const emissiveBlend = Math.min(approachProgress * 0.5 + glowProgress, 1)
      mountainMaterialRef.current.emissive.copy(mountainBaseEmissive).lerp(mountainPeakEmissive, emissiveBlend)
      mountainMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(0.25, 1.6, emissiveBlend)
      mountainMaterialRef.current.metalness = THREE.MathUtils.lerp(0.1, 0.28, emissiveBlend)
      mountainMaterialRef.current.roughness = THREE.MathUtils.lerp(0.8, 0.35, emissiveBlend)
    }

    sunUniforms.time.value += delta * (1 + glowProgress * 1.2)
    sunUniforms.glowFactor.value = THREE.MathUtils.lerp(0.45, 1.5, glowProgress)
    sunUniforms.pulseIntensity.value = THREE.MathUtils.lerp(0.25, 0.85, glowProgress + bloomProgressRaw * 0.15)

    if (sunRef.current) {
      const baseScale = THREE.MathUtils.lerp(1.2, 3.4, approachProgress)
      const scaled = bloomProgressRaw > 0 ? THREE.MathUtils.lerp(baseScale, 16, bloomProgress) : baseScale
      sunRef.current.scale.setScalar(scaled)
      sunRef.current.position.z = THREE.MathUtils.lerp(-55, -28, approachProgress)
      sunRef.current.position.y = THREE.MathUtils.lerp(5, 7.2, approachProgress)
    }

    if (sunGlowMaterialRef.current) {
      const glowOpacity = bloomProgressRaw > 0
        ? THREE.MathUtils.lerp(0.65, 0, bloomProgressRaw)
        : THREE.MathUtils.lerp(0.25, 0.65, glowProgress)
      sunGlowMaterialRef.current.opacity = glowOpacity
    }

    if (bloomProgressRaw > 0) {
      if (!sunTriggeredRef.current) {
        sunTriggeredRef.current = true
        if (explosionRef.current) {
          explosionRef.current.visible = true
        }
      }

      if (explosionRef.current) {
        explosionRef.current.scale.setScalar(THREE.MathUtils.lerp(0.6, 22, bloomProgress))
      }

      if (explosionMaterialRef.current) {
        explosionMaterialRef.current.opacity = THREE.MathUtils.lerp(0.9, 0, bloomProgressRaw)
      }

      camera.fov = THREE.MathUtils.lerp(camera.fov, 74, bloomProgressRaw)
      camera.updateProjectionMatrix()
    }

    if (time >= totalDuration && !animationComplete.current) {
      animationComplete.current = true
      setAnimStage(AnimationStage.COMPLETED)
      onExplosionComplete()
    }
  })

  const RetroGrid = ({ uniforms }: { uniforms: GridUniforms }) => {
    const gridSize = 220
    const gridDivisions = 30

    const gridShader = useMemo(
      () => ({
        uniforms,
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
            float horizontalLineSize = 0.04;
            float horizontalLine = step(1.0 - horizontalLineSize, fract(vUv.y * 30.0 + time * speed));

            float verticalLineSize = 0.03;
            float verticalLine = step(1.0 - verticalLineSize, fract(vUv.x * 30.0));

            float grid = max(horizontalLine, verticalLine);

            float dist = abs(vUv.y) * fadeDistance;
            float fadeOut = smoothstep(fadeDistance, 0.0, dist);
            float intensity = clamp(glowIntensity, 0.2, 3.0);

            vec3 glowColor = color * (0.6 + intensity * 0.4);
            float alpha = grid * fadeOut * clamp(intensity, 0.2, 2.0);
            gl_FragColor = vec4(glowColor, alpha);
          }
        `,
      }),
      [uniforms]
    )

    return (
      <mesh
        ref={gridRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2, 0]}
        renderOrder={10}
      >
        <planeGeometry args={[gridSize, gridSize, gridDivisions, gridDivisions]} />
        <shaderMaterial
          args={[gridShader]}
          transparent
          wireframe={false}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    )
  }

  const SynthwaveSun = ({ uniforms }: { uniforms: SunUniforms }) => {
    const sunShader = useMemo(
      () => ({
        uniforms,
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
          uniform float glowFactor;

          varying vec2 vUv;
          varying vec3 vNormal;

          void main() {
            float rim = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            float pulse = pulseIntensity * sin(time * pulseSpeed);
            float glow = clamp(rim * glowFactor + pulse, 0.0, 2.0);
            vec3 color = mix(baseColor, glowColor, clamp(glow, 0.0, 1.5));
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
      [uniforms]
    )

    return (
      <group ref={sunRef} position={[0, 5, -50]}>
        <mesh>
          <sphereGeometry args={[15, 48, 48]} />
          <shaderMaterial args={[sunShader]} transparent />
        </mesh>
        <mesh>
          <sphereGeometry args={[10.5, 48, 48]} />
          <meshBasicMaterial
            ref={sunGlowMaterialRef}
            color="#ff00ff"
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>
      </group>
    )
  }

  const MountainSilhouette = () => {
    const createCraggyValleyShape = () => {
      const shape = new THREE.Shape()
      shape.moveTo(-100, -5)
      shape.bezierCurveTo(-95, -2, -90, 4, -85, 2)
      shape.bezierCurveTo(-80, 0, -78, 6, -75, 4)
      shape.bezierCurveTo(-72, 2, -70, 8, -65, 6)
      shape.bezierCurveTo(-60, 4, -55, 2, -50, 3)
      shape.bezierCurveTo(-45, 5, -42, 10, -38, 8)
      shape.bezierCurveTo(-35, 6, -32, 12, -28, 10)
      shape.bezierCurveTo(-25, 8, -22, 14, -18, 12)
      shape.bezierCurveTo(-15, 10, -12, 6, -8, 4)
      shape.bezierCurveTo(-5, 2, -2, 3, 0, 1)
      shape.bezierCurveTo(2, 3, 5, 2, 8, 4)
      shape.bezierCurveTo(12, 6, 15, 10, 18, 12)
      shape.bezierCurveTo(22, 14, 25, 8, 28, 10)
      shape.bezierCurveTo(32, 12, 35, 6, 38, 8)
      shape.bezierCurveTo(42, 10, 45, 5, 50, 3)
      shape.bezierCurveTo(55, 2, 60, 4, 65, 6)
      shape.bezierCurveTo(70, 8, 72, 2, 75, 4)
      shape.bezierCurveTo(78, 6, 80, 0, 85, 2)
      shape.bezierCurveTo(90, 4, 95, -2, 100, -5)
      shape.lineTo(-100, -5)
      return shape
    }

    const extrudeSettings = {
      steps: 1,
      depth: 0.5,
      bevelEnabled: false,
    }

    return (
      <mesh ref={mountainRef} position={[0, -2, -30]} rotation={[0, 0, 0]}>
        <extrudeGeometry args={[createCraggyValleyShape(), extrudeSettings]} />
        <meshStandardMaterial
          ref={mountainMaterialRef}
          color="#29113e"
          emissive="#2a1f5d"
          emissiveIntensity={0.3}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
    )
  }

  const Explosion = () => {
    return (
      <mesh ref={explosionRef} position={[0, 0, -5]} scale={[0.1, 0.1, 0.1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial ref={explosionMaterialRef} color="#ffffff" transparent opacity={1} />
        <mesh>
          <sphereGeometry args={[0.8, 24, 24]} />
          <meshBasicMaterial color="#ff6600" transparent opacity={0.6} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
        </mesh>
      </mesh>
    )
  }

  return (
    <>
      <color attach="background" args={['#0d0221']} />
      {SHOW_DEBUG && <axesHelper args={[10]} />}
      <RetroGrid uniforms={gridUniforms} />
      <SynthwaveSun uniforms={sunUniforms} />
      <MountainSilhouette />
      <Explosion />
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 10, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[0, 6, -5]} intensity={1.5} color="#ff00ff" />
      <spotLight position={[0, 9, 2]} intensity={1.6} angle={0.5} penumbra={0.6} color="#ff66cc" />
    </>
  )
}

export default IntroScene
