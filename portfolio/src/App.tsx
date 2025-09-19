import { useState, useEffect, useRef } from 'react'
import { Howl } from 'howler'
import './App.css'
import IntroSequence from './components/intro/IntroSequence'
import PortfolioContent from './components/portfolio/PortfolioContent'
import Navbar from './components/navigation/Navbar'

function App() {
  const [introComplete, setIntroComplete] = useState(false)
  const [skipIntro, setSkipIntro] = useState(false)
  const [audioLoaded, setAudioLoaded] = useState(false)
  // Use a stable key that only changes on page refresh, not on re-renders
  const [introKey] = useState(`intro-${Date.now()}`)
  const soundRef = useRef<Howl | null>(null)
  const fadeTimeoutRef = useRef<number | null>(null)
  const stopTimeoutRef = useRef<number | null>(null)
  
  // Initialize audio on app load
  useEffect(() => {
    const loadAudio = () => {
      try {
        soundRef.current = new Howl({
          src: ['/audio/blinding-lights.mp3'],
          volume: 0.7,
          preload: true,
          html5: false,
          format: ['mp3'],
          onload: () => {
            console.log('[App] Audio loaded successfully');
            setAudioLoaded(true);
          },
          onloaderror: (id, error) => {
            console.log(`[App] Audio load error: ${error}`);
            setAudioLoaded(true); // Continue without audio
          }
        });
      } catch (error) {
        console.log(`[App] Audio initialization error: ${error}`);
        setAudioLoaded(true);
      }
    };

    loadAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, [])
  
  const clearPendingAudioTimers = () => {
    if (fadeTimeoutRef.current) {
      window.clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
    }
    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current)
      stopTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearPendingAudioTimers()
    }
  }, [])

  const handleIntroComplete = () => {
    console.log('App: Intro complete callback triggered')
    setIntroComplete(true)

    // Continue audio at half volume for 20 seconds
    if (soundRef.current) {
      try {
        console.log('[App] Reducing audio volume for portfolio background');
        soundRef.current.fade(0.7, 0.35, 600);

        clearPendingAudioTimers()

        fadeTimeoutRef.current = window.setTimeout(() => {
          if (soundRef.current) {
            const currentVolume = soundRef.current.volume()
            console.log('[App] Fading out background music after post-intro playback');
            soundRef.current.fade(currentVolume, 0, 3000)
          }
        }, 60000)

        stopTimeoutRef.current = window.setTimeout(() => {
          if (soundRef.current) {
            console.log('[App] Stopping audio playback after fade');
            soundRef.current.stop()
          }
        }, 63500)
      } catch (error) {
        console.log(`[App] Error managing audio: ${error}`);
      }
    }
  }

  const handleSkipIntro = () => {
    console.log('App: Skip intro button clicked')
    setSkipIntro(true)
    
    // Stop audio immediately when skipping
    if (soundRef.current) {
      soundRef.current.stop();
    }
    clearPendingAudioTimers()
  }
  
  const startAudio = () => {
    if (soundRef.current) {
      try {
        const playId = soundRef.current.play();
        if (playId) {
          console.log('[App] Audio started successfully');
          return true;
        }
      } catch (error) {
        console.log(`[App] Error starting audio: ${error}`);
      }
    }
    return false;
  }

  // Determine if we should show the portfolio content
  const showPortfolio = skipIntro || introComplete

  // Lock scroll during intro and re-enable for the portfolio view
  useEffect(() => {
    const className = 'intro-active'
    const htmlElement = document.documentElement

    if (!showPortfolio) {
      document.body.classList.add(className)
      htmlElement.classList.add(className)
    } else {
      document.body.classList.remove(className)
      htmlElement.classList.remove(className)
    }

    return () => {
      document.body.classList.remove(className)
      htmlElement.classList.remove(className)
    }
  }, [showPortfolio])

  return (
    <div id="top">
      <Navbar visible={showPortfolio} />
      
      {!skipIntro && !introComplete ? (
        <div className="intro-container">
          {/* Using a stable key that only changes on page refresh */}
          <IntroSequence 
            key={introKey}
            onComplete={handleIntroComplete} 
            onSkip={handleSkipIntro}
            audioLoaded={audioLoaded}
            onStartAudio={startAudio}
          />
        </div>
      ) : (
        <PortfolioContent />
      )}
    </div>
  )
}

export default App
