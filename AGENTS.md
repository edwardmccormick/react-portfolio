# Repository Guidelines

## Project Structure & Module Organization
The React + TypeScript app lives in `portfolio/`. Entry point `src/main.tsx` mounts `App.tsx`, while feature code is grouped in `src/components/intro`, `src/components/navigation`, and `src/components/portfolio`. Shared styles live in `src/App.css` and `src/index.css`. Static assets belong in `public/`—keep audio in `public/audio`, 3D models in `public/models`, and texture references in `public/textures`. Introduce new utilities next to the feature using them until a dedicated `src/lib/` folder is justified.

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — start the Vite dev server with hot reload.
- `npm run build` — run TypeScript project references via `tsc -b` and create a production bundle in `dist/`.
- `npm run preview` — serve the production build for smoke testing.
- `npm run lint` — execute the TypeScript-aware ESLint ruleset; resolve issues before committing.

## Coding Style & Naming Conventions
Stick with two-space indentation, single quotes, and omit semicolons unless required by JSX formatting. Use PascalCase for components (`Navbar.tsx`), camelCase for hooks and utilities (`useAudio.ts`), and align stylesheet names with their companion component. Keep JSX branches shallow with early returns. Run `npm run lint` to enforce React Hooks and Vite-specific rules before pushing.

## Testing Guidelines
Automated tests are not yet configured, so manually verify UI, audio, and 3D flows through `npm run dev`. New tests should adopt Vitest plus React Testing Library, live in `src/__tests__/` or alongside the component (`Navbar.test.tsx`), and register a matching npm script. Document manual test evidence in the PR when adding or changing behavior.

## Commit & Pull Request Guidelines
Recent history uses free-form messages; move toward concise, imperative summaries (e.g., `Add intro skip control`). Reference related issues when available. Each pull request should include a clear description, implementation notes, manual test steps, and media (screenshots or GIFs) for visual updates. Request review before merging and wait for future CI checks once they exist.

## Asset & Performance Notes
Large media must stay under `public/` to be served by Vite. Optimize `.glb` models and `.mp3` audio, update `public/textures/README.txt` with provenance, and confirm the site still loads smoothly after asset changes.
