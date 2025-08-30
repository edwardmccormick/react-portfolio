import { useState, useEffect } from 'react'
import './Navbar.css'

interface NavbarProps {
  visible: boolean
}

const Navbar = ({ visible }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('about')
  
  useEffect(() => {
    const handleScroll = () => {
      // Update navbar appearance on scroll
      const isScrolled = window.scrollY > 50
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
      
      // Update active section on scroll
      const sections = document.querySelectorAll('.section');
      let current = '';
      
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionId = section.getAttribute('id') || '';
        
        // 100px offset for the navbar
        if (sectionTop < 150) {
          current = sectionId;
        }
      });
      
      if (current && current !== activeSection) {
        setActiveSection(current);
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [scrolled, activeSection])
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Add offset for navbar height
      const navbarHeight = 60;
      const sectionNavHeight = 40;
      const yOffset = -(navbarHeight + sectionNavHeight);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveSection(sectionId) // Update active section immediately
    }
  }
  
  if (!visible) return null
  
  return (
    <nav className={`main-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => scrollToSection('top')}>
          EM
        </div>
        <ul className="navbar-links">
          <li 
            onClick={() => scrollToSection('about')} 
            className={activeSection === 'about' ? 'active' : ''}
          >About</li>
          <li 
            onClick={() => scrollToSection('skills')} 
            className={activeSection === 'skills' ? 'active' : ''}
          >Skills</li>
          <li 
            onClick={() => scrollToSection('experience')} 
            className={activeSection === 'experience' ? 'active' : ''}
          >Experience</li>
          <li 
            onClick={() => scrollToSection('projects')} 
            className={activeSection === 'projects' ? 'active' : ''}
          >Projects</li>
          <li 
            onClick={() => scrollToSection('contact')} 
            className={activeSection === 'contact' ? 'active' : ''}
          >Contact</li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar