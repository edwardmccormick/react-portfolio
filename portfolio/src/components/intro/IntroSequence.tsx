import { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { Howl } from 'howler'
import { useThree } from '@react-three/fiber'
import IntroScene from './IntroScene'
import './IntroSequence.css'

// Create a DEBUG flag for controlling verbose logging
const DEBUG = false;

// Component to handle WebGL context loss at the Canvas level
const ContextLossHandler = ({ onContextLoss, onContextRestore }) => {
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
}

// Helper function for conditional logging
const log = (message: string, force = false) => {
  if (DEBUG || force) {
    console.log(`[IntroSequence] ${message}`);
  }
};

const IntroSequence = ({ onComplete, onSkip }: IntroSequenceProps) => {
  log('Component initialized');
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [playingIntro, setPlayingIntro] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [animationStage, setAnimationStage] = useState('initializing')
  const [showDebug, setShowDebug] = useState(false) // Set to true to show debug panel
  const [webglContextLost, setWebglContextLost] = useState(false)
  const soundRef = useRef<Howl | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  
  // Reset all state values on component mount
  useEffect(() => {
    log('Component mounted, resetting state values');
    
    // Clean up any previous instances to prevent memory leaks
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.unload();
    }
    
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    
    // Reset state
    setAudioLoaded(false);
    setSceneReady(false);
    setPlayingIntro(false);
    setLoadingTimeout(false);
    setAnimationStage('initializing');
    
    return () => {
      log('Component unmounting, cleaning up resources');
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.unload();
      }
      
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      
      // Clear any pending GSAP animations
      gsap.killTweensOf({});
    }
  }, [])
  
  // Set up the audio with multiple fallbacks
  useEffect(() => {
    log('Audio setup effect running');
    setAnimationStage('loading audio');
    
    // Don't try to reload if we already have a sound reference
    if (soundRef.current) {
      log('Audio already initialized, skipping setup');
      return;
    }
    
    // Array of potential audio sources to try
    const audioSources = [
      '/audio/blinding-lights.mp3',  // Primary audio
      '/assets/audio/blinding-lights.mp3',  // Alternate location
      '/public/audio/blinding-lights.mp3',  // Another possible location
      'https://raw.githubusercontent.com/user/repo/main/assets/audio/blinding-lights.mp3' // Remote fallback (update with real URL if available)
    ];
    
    // Keep track of which source we're trying
    let currentSourceIndex = 0;
    
    // Function to try loading an audio source
    const tryLoadAudio = (sourceIndex: number) => {
      if (sourceIndex >= audioSources.length) {
        // We've tried all sources, force loaded state
        log('All audio sources failed, forcing loaded state', true);
        setAudioLoaded(true);
        setAnimationStage('all audio sources failed');
        return;
      }
      
      const source = audioSources[sourceIndex];
      log(`Trying audio source: ${source}`);
      
      try {
        // Create audio object with better error handling
        soundRef.current = new Howl({
          src: [source],
          volume: 0.7,
          preload: true,
          html5: true, // Use HTML5 Audio to reduce loading issues
          onload: () => {
            log(`Audio successfully loaded from ${source}`, true);
            setAudioLoaded(true);
            setAnimationStage('audio loaded');
          },
          onloaderror: () => {
            log(`Audio failed to load from ${source}, trying next source`, true);
            
            // Clean up the failed Howl instance
            if (soundRef.current) {
              soundRef.current.unload();
            }
            
            // Try the next source
            tryLoadAudio(sourceIndex + 1);
          },
          onend: () => {
            // Handle audio ending if needed
            log('Audio playback ended');
            setAnimationStage('audio playback complete');
          }
        });
      } catch (error) {
        log(`Error initializing audio: ${error}`, true);
        
        // Try the next source
        tryLoadAudio(sourceIndex + 1);
      }
    };
    
    // Start trying audio sources
    tryLoadAudio(currentSourceIndex);
    
    // Add a direct timeout as final fallback
    const timeout = setTimeout(() => {
      if (!audioLoaded) {
        log('Global audio timeout reached, forcing loaded state', true);
        setAudioLoaded(true);
        setAnimationStage('audio global timeout');
      }
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, [])
  
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
    log('Explosion animation complete, transitioning to portfolio', true);
    setAnimationStage('explosion complete');
    
    // Fade out and trigger the onComplete callback
    const fadeOutTimeline = gsap.timeline({
      onComplete: () => {
        log('Final animation timeline complete');
        if (soundRef.current) {
          try {
            log('Fading out audio');
            soundRef.current.fade(0.7, 0, 1000)
          } catch (error) {
            log(`Error fading audio: ${error}`, true);
          }
        }
        log('Triggering onComplete callback to transition to portfolio', true);
        setAnimationStage('transitioning to portfolio');
        
        // Small delay to ensure all animations complete properly
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    })
    
    // Store timeline reference for cleanup
    timelineRef.current = fadeOutTimeline;
    
    fadeOutTimeline.to('.intro-overlay', {
      opacity: 0,
      duration: 1.5
    });
  }, [onComplete]);

  // Start the intro sequence once everything is loaded
  useEffect(() => {
    log(`Intro check - Audio: ${audioLoaded}, Scene: ${sceneReady}, Playing: ${playingIntro}`);
    
    if (!audioLoaded && sceneReady) {
      setAnimationStage('waiting for audio');
    } else if (audioLoaded && !sceneReady) {
      setAnimationStage('waiting for scene');
    }
    
    // Only start the animation if all conditions are met and it hasn't started yet
    if ((audioLoaded || loadingTimeout) && sceneReady && !playingIntro) {
      log('All conditions met, starting intro animation sequence', true);
      setAnimationStage('starting animation');
      setPlayingIntro(true);
      
      // Start playing the audio if available
      if (soundRef.current) {
        log('Audio object exists, attempting to play');
        try {
          // Make sure audio is at the beginning
          soundRef.current.seek(0);
          soundRef.current.play();
          log('Audio playback started', true);
          setAnimationStage('animation with audio');
        } catch (error) {
          log(`Error playing audio: ${error}`, true);
          log('Continuing with animation despite audio error');
          setAnimationStage('animation without audio');
        }
      } else {
        setAnimationStage('animation without audio object');
      }
      
      // Create a timeline for the CSS animations
      const cssTimeline = gsap.timeline();
      
      // Store timeline reference for cleanup
      timelineRef.current = cssTimeline;
      
      // Wait 3 seconds before triggering the explosion
      cssTimeline.to({}, { duration: 3, onComplete: () => {
        log('Setting explosion started state', true);
        setAnimationStage('explosion started');
        
        // Wait for explosion animation to complete
        gsap.delayedCall(2, () => {
          log('CSS explosion animation complete', true);
          handleExplosionComplete();
        });
      }});
    }
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
        setShowDebug(prev => !prev);
        log('Debug panel toggled', true);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="intro-sequence">
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
                    width: animationStage === 'explosion started' ? '75%' : 
                           animationStage === 'explosion complete' ? '100%' : '50%' 
                  }}
                ></div>
              </div>
              <p>Step: {
                animationStage === 'starting animation' ? 'Initializing' :
                animationStage === 'animation with audio' || animationStage === 'animation without audio' ? 'Bomb dropping' :
                animationStage === 'explosion started' ? 'Explosion in progress' :
                animationStage === 'explosion complete' ? 'Transition to portfolio' :
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
      
      <Canvas className="threejs-canvas" camera={{ position: [0, 5, 15], fov: 75 }} style={{ zIndex: 15, position: 'absolute' }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <ContextLossHandler 
          onContextLoss={() => {
            log('Canvas context loss detected', true);
            setWebglContextLost(true);
            
            // Show a warning in the debug panel
            setAnimationStage('webgl context lost');
            
            // Try to salvage the animation if possible, or fall back to CSS only
            if (timelineRef.current) {
              timelineRef.current.pause();
            }
          }}
          onContextRestore={() => {
            log('Canvas context restore detected', true);
            setWebglContextLost(false);
            setAnimationStage('webgl context restored');
            
            // Resume timeline if possible
            if (timelineRef.current) {
              timelineRef.current.play();
            }
          }}
        />
        <IntroScene 
          onSceneLoaded={handleSceneLoaded} 
          onExplosionComplete={handleExplosionComplete}
          isPlaying={playingIntro}
          howl={soundRef.current}
        />
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