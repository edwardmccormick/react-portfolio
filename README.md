<![CDATA[<div align="center">

# ✨ SYNTHWAVE PORTFOLIO ✨

<img src="https://i.imgur.com/3gaRolU.gif" alt="Synthwave Grid Animation" width="600">

### *Journey through the digital horizon*

[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.179-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 🌅 Overview

Welcome to the **Synthwave Portfolio** - a React-based portfolio site with a stunning retro-futuristic intro animation. Enter a neon-soaked digital landscape where synthwave aesthetics meet modern web technologies. The portfolio features a mesmerizing Three.js animation with glowing grids, cosmic mountains, and a digital sunset that transports you straight to the 80s digital dreamscape.

<div align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <img src="https://i.imgur.com/wy4hJdl.png" alt="Retro Grid" width="100%"><br>
        <b>RETRO GRID</b>
      </td>
      <td align="center" width="33%">
        <img src="https://i.imgur.com/Q6CS3of.png" alt="Digital Sunset" width="100%"><br>
        <b>DIGITAL SUNSET</b>
      </td>
      <td align="center" width="33%">
        <img src="https://i.imgur.com/LMbFLWF.png" alt="Cyber Mountains" width="100%"><br>
        <b>CYBER MOUNTAINS</b>
      </td>
    </tr>
  </table>
</div>

## 🚀 Features

- **📱 Responsive Design** - Perfect viewing on any device
- **🎵 Synchronized Audio** - Blast through the digital horizon with synthwave beats
- **🌈 Custom GLSL Shaders** - Handcrafted visual effects for the ultimate retro experience
- **🏃‍♂️ Smooth Animations** - GSAP-powered transitions that flow like neon light
- **🎮 Interactive Elements** - Engaging user experience with interactive components
- **🏎️ Accelerating Grid** - Classic synthwave acceleration effect that draws you in
- **🌄 Dynamic Sun Expansion** - Seamless transition between intro and portfolio content

## 🛠️ Tech Stack

- **⚛️ React 19** - The library for web and native user interfaces
- **🔷 TypeScript** - Your type-safe guardian
- **🧊 Three.js / React Three Fiber** - 3D graphics in your browser
- **🎭 GSAP** - Professional-grade animation
- **🔊 Howler.js** - Audio playback made simple
- **⚡ Vite** - Next generation frontend tooling

## 📋 Getting Started

### Prerequisites

```bash
# Make sure you have Node.js installed (v18+ recommended)
node --version
```

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/synthwave-portfolio.git

# Navigate to project directory
cd synthwave-portfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

## 🎮 Usage

The portfolio begins with an immersive synthwave intro animation featuring:

1. A neon grid that accelerates toward the horizon
2. A glowing sunset in classic retrowave style
3. Mountain silhouettes against the digital horizon

After approximately 10 seconds, the sun expands to transition to the main portfolio content. Users can skip the intro by clicking the "Skip Intro" button.

<div align="center">
  <img src="https://i.imgur.com/JQEKlg4.png" alt="Portfolio Preview" width="80%">
</div>

## 🧠 Behind the Scenes

The intro animation uses custom GLSL shaders to create the authentic synthwave grid effect:

```glsl
void main() {
  // Create proper perspective grid
  // Horizontal lines (move with time)
  float horizontalLineSize = 0.04; 
  float horizontalLine = step(1.0 - horizontalLineSize, 
    fract(vUv.y * 30.0 + time * speed));
  
  // Vertical lines (fixed)
  float verticalLineSize = 0.03;
  float verticalLine = step(1.0 - verticalLineSize, 
    fract(vUv.x * 30.0));
  
  // Combine lines
  float grid = max(horizontalLine, verticalLine);
  
  // Fade out with distance
  float dist = abs(vUv.y) * fadeDistance;
  float fadeOut = smoothstep(fadeDistance, 0.0, dist);
  
  // Final color
  gl_FragColor = vec4(color, grid * fadeOut * 0.8);
}
```

## 🎨 Customization

Tailor this portfolio to your own style by modifying:

- **Colors**: Adjust the neon palette in CSS variables
- **Speed**: Change animation durations and timings
- **Content**: Replace portfolio content with your own work
- **Audio**: Swap in your own synthwave track

## 👨‍💻 Development

For those looking to expand or modify this project:

```bash
# Run development server with hot module replacement
npm run dev

# Lint your code
npm run lint
```

## 🔮 Future Features

- [ ] More interactive elements in the 3D scene
- [ ] Particle effects for enhanced atmosphere
- [ ] Custom 3D models for unique identity
- [ ] Day/night toggle for different aesthetics
- [ ] Mobile gesture controls for interactive exploration

---

<div align="center">
  <img src="https://i.imgur.com/e7OXndj.png" alt="Synthwave Footer" width="100%">
  
  <p>
    <strong>Created with 💜 and lots of neon</strong>
  </p>
  
  <p>
    <i>License: MIT - Feel free to use and modify for your own portfolio</i>
  </p>
</div>]]>