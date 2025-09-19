import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { useThree } from '@react-three/fiber'
import IntroScene from './IntroScene'
import './IntroSequence.css'

// Create a DEBUG flag for controlling verbose logging
const DEBUG = false;

// Component to handle WebGL context loss at the Canvas level
interface ContextLossHandlerProps {
  onContextLoss?: () => void
  onContextRestore?: () => void
}

const ContextLossHandler = ({ onContextLoss, onContextRestore }: ContextLossHandlerProps) => {
  const { gl } = useThree();
  
  useEffect(() => {
    const handleContextLost = () => {
      log('WebGL context lost at Canvas level', true);
      if (onContextLoss) onContextLoss();
    };
    
    const handleContextRestored = () => {
      log('WebGL context restored at Canvas level', true);
      if (onContextRestore) onContextRestore();
    };
    
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl, onContextLoss, onContextRestore]);
  
  return null;
};

interface IntroSequenceProps {
  onComplete: () => void
  onSkip: () => void
  audioLoaded: boolean
  onStartAudio: () => boolean
}

// Helper function for conditional logging
const log = (message: string, force = false) => {
  if (DEBUG || force) {
    console.log(`[IntroSequence] ${message}`);
  }
};

const IntroSequence = ({ onComplete, onSkip, audioLoaded, onStartAudio }: IntroSequenceProps) => {
  log('Component initialized');
  const [sceneReady, setSceneReady] = useState(false)
  const [playingIntro, setPlayingIntro] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [animationStage, setAnimationStage] = useState('initializing')
  const [showDebug, setShowDebug] = useState(false) // Set to true to show debug panel
  const [webglContextLost, setWebglContextLost] = useState(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const playingIntroRef = useRef(false)

  const startExperience = useCallback(() => {
    if (playingIntroRef.current) {
      return
    }

    playingIntroRef.current = true
    setPlayingIntro(true)
    setAnimationStage('starting animation')

    const audioStarted = onStartAudio()
    if (audioStarted) {
      log('Audio started with user interaction', true)
      setAnimationStage('animation with audio')
    } else {
      setAnimationStage('animation without audio')
    }
  }, [onStartAudio])
  
  // Reset all state values on component mount
  useEffect(() => {
    log('Component mounted, resetting state values');

    if (timelineRef.current) {
      timelineRef.current.kill()
    }

    setSceneReady(false)
    setPlayingIntro(false)
    setLoadingTimeout(false)
    setAnimationStage('initializing')
    playingIntroRef.current = false

    return () => {
      log('Component unmounting, cleaning up resources');
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
      gsap.killTweensOf({})
      document.body.classList.remove('intro-cursor-hidden')
    }
  }, [])

  useEffect(() => {
    playingIntroRef.current = playingIntro
  }, [playingIntro])
  
  // Update animation stage based on audio loading
  useEffect(() => {
    if (audioLoaded) {
      setAnimationStage('audio loaded');
    } else {
      setAnimationStage('loading audio');
    }
  }, [audioLoaded])
  
  // Set a timeout for scene loading (separate from audio loading timeout)
  useEffect(() => {
    // Only set a timeout if scene isn't ready yet
    if (sceneReady) {
      return;
    }
    
    log('Starting scene loading timeout countdown');
    const timer = setTimeout(() => {
      log('Scene loading timeout reached after 5 seconds', true);
      setLoadingTimeout(true);
      setAnimationStage('scene loading timeout reached');
      
      // Force scene ready state after timeout
      if (!sceneReady) {
        log('Forcing scene ready state due to timeout', true);
        setSceneReady(true);
        setAnimationStage('scene loading timeout bypass');
      }
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timer)
  }, [sceneReady])

  // Memoize the explosion handler to avoid recreation on each render
  const handleExplosionComplete = useCallback(() => {
    log('Sun bloom finale reached, transitioning to portfolio', true)
    setAnimationStage('sun bloom finale')
    
    // Fade out and trigger the onComplete callback
    const fadeOutTimeline = gsap.timeline({
      onComplete: () => {
        log('Final animation timeline complete');
        log('Triggering onComplete callback to transition to portfolio', true)
        setAnimationStage('sun bloom complete')

        // Small delay to ensure all animations complete properly
        setTimeout(() => {
          setAnimationStage('transitioning to portfolio')
          onComplete()
        }, 50)
      }
    })
    
    // Store timeline reference for cleanup
    timelineRef.current = fadeOutTimeline;
    
    fadeOutTimeline.to('.intro-overlay', {
      opacity: 0,
      duration: 1.2
    })
  }, [onComplete]);

  // Start the intro sequence once everything is loaded
  useEffect(() => {
    log(`Intro check - Audio: ${audioLoaded}, Scene: ${sceneReady}, Playing: ${playingIntro}`);
    
    if (!audioLoaded && sceneReady) {
      setAnimationStage('waiting for audio');
    } else if (audioLoaded && !sceneReady) {
      setAnimationStage('waiting for scene');
    }
    
    // Animation now starts only when user clicks the start button
    // This logic is moved to the button click handler
  }, [audioLoaded, sceneReady, playingIntro, loadingTimeout, handleExplosionComplete])

  // Memoize the scene loaded handler to avoid recreation on each render
  const handleSceneLoaded = useCallback(() => {
    log('Scene loaded callback triggered', true);
    setSceneReady(true);
    setAnimationStage('scene loaded');
  }, []);

  // Toggle debug panel with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd') {
        setShowDebug(prev => !prev)
        log('Debug panel toggled', true)
        return
      }

      if ((audioLoaded || loadingTimeout) && sceneReady && !playingIntroRef.current) {
        log('User pressed key to start experience', true)
        startExperience()
      }
    }

    const handleClick = () => {
      if ((audioLoaded || loadingTimeout) && sceneReady && !playingIntroRef.current) {
        log('User clicked to start experience', true)
        startExperience()
      }
    }

    if ((audioLoaded || loadingTimeout) && sceneReady && !playingIntroRef.current) {
      window.addEventListener('keydown', handleKeyPress)
      window.addEventListener('click', handleClick)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('click', handleClick)
    }
  }, [audioLoaded, loadingTimeout, sceneReady, startExperience])

  useEffect(() => {
    const className = 'intro-cursor-hidden'
    const shouldHide = playingIntro && animationStage !== 'transitioning to portfolio'

    if (shouldHide) {
      document.body.classList.add(className)
    } else {
      document.body.classList.remove(className)
    }

    return () => {
      document.body.classList.remove(className)
    }
  }, [animationStage, playingIntro])

  return (
    <div className={`intro-sequence ${playingIntro ? 'playing' : ''}`}>
      <div className="intro-overlay"></div>
      <div className="grid-lines"></div>
      <div className="css-sun"></div>
      <div className="horizon-line"></div>
      <div className="horizon-grid"></div>
      <div className="stars"></div>
      
      
      {/* Debug Panel */}
      {showDebug && (
        <div className="debug-panel">
          <h4>Animation Status</h4>
          <p>Audio Loaded: <span className={`status ${audioLoaded ? 'true' : 'false'}`}>{audioLoaded ? 'Yes' : 'No'}</span></p>
          <p>Scene Ready: <span className={`status ${sceneReady ? 'true' : 'false'}`}>{sceneReady ? 'Yes' : 'No'}</span></p>
          <p>Playing Intro: <span className={`status ${playingIntro ? 'true' : 'false'}`}>{playingIntro ? 'Yes' : 'No'}</span></p>
          <p>Loading Timeout: <span className={`status ${loadingTimeout ? 'true' : 'false'}`}>{loadingTimeout ? 'Yes' : 'No'}</span></p>
          <p>Stage: <span className="status">{animationStage}</span></p>
          
          {playingIntro && (
            <>
              <h4>Animation Progress</h4>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: animationStage.includes('sun bloom') ? '100%' : 
                           animationStage.includes('animation') ? '70%' : '40%'
                  }}
                ></div>
              </div>
              <p>Step: {
                animationStage === 'starting animation' ? 'Initializing' :
                animationStage === 'animation with audio' || animationStage === 'animation without audio' ? 'Synthwave journey' :
                animationStage === 'sun bloom finale' ? 'Sun bloom rising' :
                animationStage === 'sun bloom complete' ? 'Transition to portfolio' :
                animationStage === 'webgl context lost' ? 'WebGL context lost' :
                animationStage === 'webgl context restored' ? 'WebGL context restored' :
                'Unknown'
              }</p>
            </>
          )}
          
          {/* Audio loading details */}
          <h4>Audio Status</h4>
          <p>Status: <span className="status">{
            animationStage === 'audio loaded' ? 'Loaded ✓' :
            animationStage === 'all audio sources failed' ? 'Failed ✗' :
            animationStage === 'audio global timeout' ? 'Timed Out ⏱' :
            animationStage.includes('audio') ? animationStage :
            'Pending...'
          }</span></p>
          <p>WebGL: <span className={`status ${webglContextLost ? 'false' : 'true'}`}>
            {webglContextLost ? 'Context Lost ✗' : 'OK ✓'}
          </span></p>
        </div>
      )}
      
      <Canvas className="threejs-canvas" camera={{ position: [0, 5, 15], fov: 70 }} style={{ zIndex: 15, position: 'absolute' }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <ContextLossHandler 
          onContextLoss={() => {
            log('Canvas context loss detected', true)
            setWebglContextLost(true)
            setAnimationStage('webgl context lost')
            if (timelineRef.current) {
              timelineRef.current.pause()
            }
          }}
          onContextRestore={() => {
            log('Canvas context restore detected', true)
            setWebglContextLost(false)
            setAnimationStage('webgl context restored')
            if (timelineRef.current) {
              timelineRef.current.play()
            }
          }}
        />
        <Suspense fallback={null}>
          <IntroScene 
            onSceneLoaded={handleSceneLoaded} 
            onExplosionComplete={handleExplosionComplete}
            isPlaying={playingIntro}
          />
        </Suspense>
      </Canvas>
      
      {/* Show WebGL error message if context is lost */}
      {webglContextLost && (
        <div className="webgl-error">
          <p>WebGL context lost. Using CSS fallback animation.</p>
        </div>
      )}
      
      {/* Loading indicator shown until both audio and scene are loaded */}
      {(!audioLoaded || !sceneReady) && (
        <div className="loading-container">
          <div className="loading-text">Loading...</div>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      )}
      
      {/* Skip intro button */}
      <button className="skip-intro-button" onClick={onSkip}>
        Skip Intro
      </button>
      
      {/* Start experience prompt - shown when ready */}
      {(audioLoaded || loadingTimeout) && sceneReady && !playingIntro && (
        <div className="audio-prompt">
          <h2>🌅 Meet Ted McCormick 🌅</h2>
          <p>Click to begin your journey through the digital horizon</p>
          <button 
            className="play-audio-button" 
            onClick={startExperience}
          >
            🚀 Let's. GO!!!!
          </button>
          <button 
            className="skip-intro-button-alt" 
            onClick={onSkip}
          >
            Skip Intro
          </button>
        </div>
      )}
      
      {/* Force complete button for debugging */}
      {showDebug && (
        <button className="force-complete-button" onClick={handleExplosionComplete}>
          Force Complete
        </button>
      )}
    </div>
  )
}

export default IntroSequence
