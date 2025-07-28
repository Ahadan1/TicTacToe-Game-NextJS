
# Tic Tac Toe Game (Next.js + TypeScript)

A beautiful, animated Tic Tac Toe game built with Next.js 15, TypeScript, Tailwind CSS, and OGL for a galaxy background effect.

## Features
- Modern UI with animated backgrounds and counters
- Playable Tic Tac Toe with win/draw detection
- Scoreboard with animated counters
- Celebration overlays and confetti
- Responsive and mobile-friendly
- Built with Next.js App Router and React Server/Client Components

## Tech Stack
[![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[OGL](https://github.com/oframe/ogl) (for animated galaxy background)
React Hooks
[ReactBits](https://reactbits.dev/)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000) to play the game.

## Project Structure
- `src/app/page.tsx` — Main entry, loads the TicTacToe game
- `src/components/tictactoe.tsx` — Main game logic and UI
- `public/` — Static assets (SVGs, icons)
- `globals.css` — Global styles (Tailwind)

## Customization
- Update styles in `globals.css` or Tailwind config
- Change background or UI in `tictactoe.tsx`
