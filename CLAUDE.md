# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a portfolio website built with React, TypeScript, and Vite. The site features a synthwave-style intro animation created with Three.js (via React Three Fiber) that transitions to the main portfolio content.

## Key Commands

```bash
# Start the development server
npm run dev

# Build the project
npm run build

# Lint the codebase
npm run lint

# Preview the production build
npm run preview
```

## Project Architecture

The project follows a component-based architecture with React and Three.js integration:

### Key Components

1. **App.tsx** - The main application component that manages the state between the intro animation and portfolio content.

2. **IntroSequence.tsx** - Controls the synthwave intro animation sequence including:
   - Audio loading and playback (Blinding Lights audio)
   - WebGL context management
   - Animation timeline management with GSAP
   - Transitions to the portfolio content

3. **IntroScene.tsx** - Contains the Three.js scene with:
   - RetroGrid - Shader-based grid animation
   - SynthwaveSun - Custom sun with glow effects
   - MountainSilhouette - Mountain shapes on the horizon
   - Animation stages (WAITING, GRID_APPROACH, SUN_EXPANSION, COMPLETED)

4. **PortfolioContent.tsx** - The main portfolio content displayed after the intro animation.

5. **Navbar.tsx** - Navigation component that appears after the intro animation completes.

### Technology Stack

- **React** (v19) - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **Three.js / React Three Fiber** - 3D graphics rendering
- **Howler** - Audio playback
- **GSAP** - Animation timeline management
- **CSS** - Custom styling, including synthwave aesthetics

### Key Features

1. **Synthwave Intro Animation**:
   - Custom GLSL shaders for grid and sun effects
   - Synchronized animation stages
   - Fallback CSS animations if WebGL context is lost
   - Audio synchronization
   - Skip functionality for users who want to bypass the intro

2. **Responsive Design**: 
   - Adapts to different screen sizes
   - Provides visual feedback during loading

3. **Debugging Features**:
   - Press 'd' key to toggle a debug panel
   - Shows animation stage progress
   - WebGL context loss detection and recovery