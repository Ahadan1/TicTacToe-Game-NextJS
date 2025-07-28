Tic Tac Toe – Next.js + TypeScript
A modern, animated Tic Tac Toe game built with Next.js, React, and TypeScript. Features a beautiful UI, animated backgrounds, and a persistent scoreboard.

🕹️ Game Rules
Two players: X and O.
Players take turns clicking empty cells on a 3x3 grid.
The first player to align three of their marks (horizontally, vertically, or diagonally) wins.
If all cells are filled and no player has three in a row, the game is a draw.
The scoreboard tracks wins for X, O, and draws.
Use the "New Game" button to reset the board, or "Reset Scores" to clear the scoreboard.
✨ Features
Animated galaxy background (ReactBits style, using OGL).
Celebration and confetti effects for wins and draws.
Responsive, modern UI with Tailwind CSS.
Animated scoreboard counters.
Built with the latest Next.js App Router and React 19.
🛠️ Tech Stack
Framework: Next.js 15
Language: TypeScript
UI: React 19, Tailwind CSS 4
Animation: OGL (for galaxy background), GSAP (optional)
Fonts: Geist (Google Fonts)
Icons: Google Material Icons
Linting: ESLint (Next.js config)
🚀 Getting Started
Install dependencies:

Run the development server:

Open http://localhost:3000 in your browser.

📁 Project Structure
app – Next.js app directory (entry, layout, global styles)
TicTacToe.tsx – Main game component (UI, logic, animations)
public – Static assets
package.json – Project dependencies and scripts
tsconfig.json – TypeScript configuration
postcss.config.mjs – PostCSS/Tailwind config
🧑‍💻 Customization
Edit TicTacToe.tsx to change game logic or UI.
Tailwind CSS is used for styling; edit globals.css for global styles.
Fonts and icons are loaded via Google Fonts and Material Icons.
📚 Learn More
Next.js Documentation
React Documentation
Tailwind CSS
OGL
