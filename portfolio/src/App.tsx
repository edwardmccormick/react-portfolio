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

  const handleIntroComplete = () => {
    console.log('App: Intro complete callback triggered')
    setIntroComplete(true)
    
    // Continue audio at half volume for 20 seconds
    if (soundRef.current) {
      try {
        console.log('[App] Reducing audio volume for portfolio background');
        soundRef.current.fade(0.7, 0.35, 1000);
        
        setTimeout(() => {
          if (soundRef.current) {
            console.log('[App] Fading out background music after 20 seconds');
            soundRef.current.fade(0.35, 0, 3000);
          }
        }, 20000);
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