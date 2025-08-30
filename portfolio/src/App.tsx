import { useState, useEffect } from 'react'
import './App.css'
import IntroSequence from './components/intro/IntroSequence'
import PortfolioContent from './components/portfolio/PortfolioContent'
import Navbar from './components/navigation/Navbar'

function App() {
  const [introComplete, setIntroComplete] = useState(false)
  const [skipIntro, setSkipIntro] = useState(false)
  // Use a stable key that only changes on page refresh, not on re-renders
  const [introKey] = useState(`intro-${Date.now()}`)
  
  // Reset intro state when page is loaded/reloaded
  useEffect(() => {
    setIntroComplete(false)
    setSkipIntro(false)
  }, [])

  const handleIntroComplete = () => {
    console.log('App: Intro complete callback triggered')
    setIntroComplete(true)
  }

  const handleSkipIntro = () => {
    console.log('App: Skip intro button clicked')
    setSkipIntro(true)
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
          />
        </div>
      ) : (
        <PortfolioContent />
      )}
    </div>
  )
}

export default App