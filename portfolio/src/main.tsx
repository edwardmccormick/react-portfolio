// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Temporarily disabling StrictMode to fix animation issues
// StrictMode causes components to mount twice in development, which breaks animation sequences
createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App />
  // </StrictMode>
)
