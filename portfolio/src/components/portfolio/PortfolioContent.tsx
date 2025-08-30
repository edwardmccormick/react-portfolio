import { useState, useEffect } from 'react'
import './PortfolioContent.css'

const PortfolioContent = () => {
  const [visible, setVisible] = useState(false)
  const [activeSection, setActiveSection] = useState('about')
  
  // Function to scroll to a section with offset for navbar
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

  useEffect(() => {
    // Fade in the portfolio content after the intro transition
    const timer = setTimeout(() => {
      setVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Track scroll position and update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.section');
      let current = '';
      
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionId = section.getAttribute('id') || '';
        
        // 100px offset for the navbar and section nav
        if (sectionTop < 150) {
          current = sectionId;
        }
      });
      
      if (current && current !== activeSection) {
        setActiveSection(current);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection])

  return (
    <div className={`portfolio-container ${visible ? 'visible' : ''}`}>
      <header className="portfolio-header">
        <h1 className="portfolio-name">Edward McCormick</h1>
        <h2 className="portfolio-title">DevOps Engineer</h2>
      </header>

      <nav className="section-nav">
        <ul>
          <li>
            <a 
              onClick={(e) => { e.preventDefault(); scrollToSection('about'); }} 
              href="#about" 
              className={activeSection === 'about' ? 'active' : ''}
            >About</a>
          </li>
          <li>
            <a 
              onClick={(e) => { e.preventDefault(); scrollToSection('skills'); }} 
              href="#skills" 
              className={activeSection === 'skills' ? 'active' : ''}
            >Skills</a>
          </li>
          <li>
            <a 
              onClick={(e) => { e.preventDefault(); scrollToSection('experience'); }} 
              href="#experience" 
              className={activeSection === 'experience' ? 'active' : ''}
            >Experience</a>
          </li>
          <li>
            <a 
              onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }} 
              href="#projects" 
              className={activeSection === 'projects' ? 'active' : ''}
            >Projects</a>
          </li>
          <li>
            <a 
              onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }} 
              href="#contact" 
              className={activeSection === 'contact' ? 'active' : ''}
            >Contact</a>
          </li>
        </ul>
      </nav>

      <main className="portfolio-content">
        <section id="about" className="section">
          <h2>About Me</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                Hi there! I'm Edward, a passionate DevOps Engineer with a flair for automating everything and keeping systems running smoothly. 
                I specialize in bridging the gap between development and operations, creating efficient CI/CD pipelines, and implementing infrastructure as code.
              </p>
              <p>
                When I'm not optimizing deployment processes or troubleshooting production issues, you can find me experimenting with new technologies, 
                contributing to open source projects, or enjoying the outdoors.
              </p>
            </div>
          </div>
        </section>

        <section id="skills" className="section">
          <h2>Technical Skills</h2>
          <div className="skills-grid">
            <div className="skill-category">
              <h3>Cloud & Infrastructure</h3>
              <ul>
                <li>AWS</li>
                <li>Azure</li>
                <li>Google Cloud</li>
                <li>Kubernetes</li>
                <li>Docker</li>
              </ul>
            </div>
            <div className="skill-category">
              <h3>CI/CD & Automation</h3>
              <ul>
                <li>Jenkins</li>
                <li>GitLab CI</li>
                <li>GitHub Actions</li>
                <li>ArgoCD</li>
                <li>Terraform</li>
              </ul>
            </div>
            <div className="skill-category">
              <h3>Monitoring & Logging</h3>
              <ul>
                <li>Prometheus</li>
                <li>Grafana</li>
                <li>ELK Stack</li>
                <li>Datadog</li>
                <li>New Relic</li>
              </ul>
            </div>
            <div className="skill-category">
              <h3>Programming</h3>
              <ul>
                <li>Python</li>
                <li>Bash</li>
                <li>Go</li>
                <li>JavaScript/TypeScript</li>
                <li>Ruby</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="experience" className="section">
          <h2>Work Experience</h2>
          <div className="experience-item">
            <div className="experience-header">
              <h3>Senior DevOps Engineer</h3>
              <p className="company">TechCorp Inc.</p>
              <p className="date">2021 - Present</p>
            </div>
            <ul>
              <li>Led the migration from monolithic architecture to microservices using Kubernetes</li>
              <li>Reduced deployment time by 70% through CI/CD pipeline optimization</li>
              <li>Implemented infrastructure as code using Terraform across all environments</li>
              <li>Designed and maintained observability solutions using Prometheus and Grafana</li>
            </ul>
          </div>
          <div className="experience-item">
            <div className="experience-header">
              <h3>DevOps Engineer</h3>
              <p className="company">InnoSystems LLC</p>
              <p className="date">2018 - 2021</p>
            </div>
            <ul>
              <li>Automated application deployment across multiple cloud providers</li>
              <li>Managed container orchestration using Docker Swarm and later Kubernetes</li>
              <li>Implemented robust monitoring and alerting systems</li>
              <li>Collaborated with development teams to improve application performance</li>
            </ul>
          </div>
          <div className="experience-item">
            <div className="experience-header">
              <h3>Systems Administrator</h3>
              <p className="company">DataFlow Solutions</p>
              <p className="date">2016 - 2018</p>
            </div>
            <ul>
              <li>Maintained and optimized on-premise infrastructure</li>
              <li>Implemented automated backup and disaster recovery solutions</li>
              <li>Supported development environments and deployment processes</li>
              <li>Migrated legacy systems to cloud infrastructure</li>
            </ul>
          </div>
        </section>

        <section id="projects" className="section">
          <h2>Projects</h2>
          <div className="projects-grid">
            <div className="project-card">
              <h3>Kubernetes Operator for Database Management</h3>
              <p>Developed a custom Kubernetes operator for automating database provisioning, backups, and scaling operations.</p>
              <div className="project-tech">
                <span>Go</span>
                <span>Kubernetes</span>
                <span>Operator SDK</span>
              </div>
            </div>
            <div className="project-card">
              <h3>Multi-Cloud CI/CD Pipeline</h3>
              <p>Built a portable CI/CD system that works consistently across AWS, Azure, and Google Cloud with automatic failover.</p>
              <div className="project-tech">
                <span>Jenkins</span>
                <span>Terraform</span>
                <span>Python</span>
              </div>
            </div>
            <div className="project-card">
              <h3>Infrastructure Monitoring Dashboard</h3>
              <p>Created a comprehensive monitoring solution with custom dashboards for tracking system performance and cost optimization.</p>
              <div className="project-tech">
                <span>Grafana</span>
                <span>Prometheus</span>
                <span>Node Exporter</span>
              </div>
            </div>
            <div className="project-card">
              <h3>Automated Disaster Recovery</h3>
              <p>Implemented an automated DR solution that tests and validates recovery processes on a regular schedule.</p>
              <div className="project-tech">
                <span>AWS</span>
                <span>CloudFormation</span>
                <span>Lambda</span>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="section">
          <h2>Get In Touch</h2>
          <div className="contact-container">
            <div className="contact-methods">
              <div className="contact-method">
                <h3>Email</h3>
                <p>edward.mccormick@example.com</p>
              </div>
              <div className="contact-method">
                <h3>LinkedIn</h3>
                <p>linkedin.com/in/edwardmccormick</p>
              </div>
              <div className="contact-method">
                <h3>GitHub</h3>
                <p>github.com/edwardmccormick</p>
              </div>
            </div>
            <div className="contact-form">
              <h3>Send a Message</h3>
              <form>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" required />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows={5} required></textarea>
                </div>
                <button type="submit" className="submit-btn">Send Message</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="portfolio-footer">
        <p>&copy; {new Date().getFullYear()} Edward McCormick | DevOps Engineer</p>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </div>
      </footer>
    </div>
  )
}

export default PortfolioContent