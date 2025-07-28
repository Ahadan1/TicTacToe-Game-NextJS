import React, { useState, useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";

type Player = 'X' | 'O' | null;
type Board = Player[];

interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player;
  gameOver: boolean;
  scores: { X: number; O: number; draws: number };
  winningLine: number[] | null;
  showCelebration: boolean;
}

// ReactBits Galaxy Component
const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);

  vec2 gv = fract(uv) - 0.5; 
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star(gv - offset - pad, flareSize);
      vec3 color = base;

      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;
      
      col += star * size * color;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  vec2 mouseNorm = uMouse - vec2(0.5);
  
  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0); // Center in UV space
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;

  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha); // Enhance contrast
    alpha = min(alpha, 1.0); // Clamp to maximum 1.0
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

interface GalaxyProps {
  focal?: [number, number];
  rotation?: [number, number];
  starSpeed?: number;
  density?: number;
  hueShift?: number;
  disableAnimation?: boolean;
  speed?: number;
  mouseInteraction?: boolean;
  glowIntensity?: number;
  saturation?: number;
  mouseRepulsion?: boolean;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  repulsionStrength?: number;
  autoCenterRepulsion?: number;
  transparent?: boolean;
}

const Galaxy: React.FC<GalaxyProps> = React.memo(({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  glowIntensity = 0.3,
  saturation = 0.0,
  mouseRepulsion = true,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = true,
  ...rest
}) => {
  const ctnDom = useRef<HTMLDivElement>(null);
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothMousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMouseActive = useRef(0.0);
  const smoothMouseActive = useRef(0.0);
  const rendererRef = useRef<Renderer | null>(null);
  const programRef = useRef<Program | null>(null);
  const animateIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ctnDom.current) return;
    
    // Prevent multiple initializations
    if (rendererRef.current) return;
    
    const ctn = ctnDom.current;
    const renderer = new Renderer({
      alpha: transparent,
      premultipliedAlpha: false,
      antialias: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    const gl = renderer.gl;

    // Set clear color to prevent white flashing
    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.clearColor(0.05, 0.05, 0.15, 1); // Dark blue instead of black
    }

    function resize() {
      if (!rendererRef.current || !programRef.current) return;
      const scale = Math.min(window.devicePixelRatio, 2); // Limit pixel ratio
      renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
      programRef.current.uniforms.uResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }
    
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(ctn);
    resize();

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Color(
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height
          ),
        },
        uFocal: { value: new Float32Array(focal) },
        uRotation: { value: new Float32Array(rotation) },
        uStarSpeed: { value: starSpeed },
        uDensity: { value: density },
        uHueShift: { value: hueShift },
        uSpeed: { value: speed },
        uMouse: {
          value: new Float32Array([
            smoothMousePos.current.x,
            smoothMousePos.current.y,
          ]),
        },
        uGlowIntensity: { value: glowIntensity },
        uSaturation: { value: saturation },
        uMouseRepulsion: { value: mouseRepulsion },
        uTwinkleIntensity: { value: twinkleIntensity },
        uRotationSpeed: { value: rotationSpeed },
        uRepulsionStrength: { value: repulsionStrength },
        uMouseActiveFactor: { value: 0.0 },
        uAutoCenterRepulsion: { value: autoCenterRepulsion },
        uTransparent: { value: transparent },
      },
    });
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });

    function update(t: number) {
      if (!programRef.current || !rendererRef.current) return;
      
      animateIdRef.current = requestAnimationFrame(update);
      
      if (!disableAnimation) {
        programRef.current.uniforms.uTime.value = t * 0.001;
        programRef.current.uniforms.uStarSpeed.value = (t * 0.001 * starSpeed) / 10.0;
      }

      const lerpFactor = 0.05;
      smoothMousePos.current.x +=
        (targetMousePos.current.x - smoothMousePos.current.x) * lerpFactor;
      smoothMousePos.current.y +=
        (targetMousePos.current.y - smoothMousePos.current.y) * lerpFactor;

      smoothMouseActive.current +=
        (targetMouseActive.current - smoothMouseActive.current) * lerpFactor;

      programRef.current.uniforms.uMouse.value[0] = smoothMousePos.current.x;
      programRef.current.uniforms.uMouse.value[1] = smoothMousePos.current.y;
      programRef.current.uniforms.uMouseActiveFactor.value = smoothMouseActive.current;

      rendererRef.current.render({ scene: mesh });
    }
    
    animateIdRef.current = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    function handleMouseMove(e: MouseEvent) {
      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetMousePos.current = { x, y };
      targetMouseActive.current = 1.0;
    }

    function handleMouseLeave() {
      targetMouseActive.current = 0.0;
    }

    if (mouseInteraction) {
      ctn.addEventListener("mousemove", handleMouseMove, { passive: true });
      ctn.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    }

    return () => {
      if (animateIdRef.current) {
        cancelAnimationFrame(animateIdRef.current);
        animateIdRef.current = null;
      }
      
      resizeObserver.disconnect();
      
      if (mouseInteraction) {
        ctn.removeEventListener("mousemove", handleMouseMove);
        ctn.removeEventListener("mouseleave", handleMouseLeave);
      }
      
      if (gl.canvas && ctn.contains(gl.canvas)) {
        ctn.removeChild(gl.canvas);
      }
      
      // Clean up WebGL context
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
      
      rendererRef.current = null;
      programRef.current = null;
    };

  // Add all used props to the dependency array for exhaustive-deps compliance
  }, [focal, rotation, starSpeed, density, hueShift, saturation, glowIntensity, twinkleIntensity, repulsionStrength, autoCenterRepulsion, transparent, disableAnimation, speed, rotationSpeed, mouseRepulsion, mouseInteraction]);

  return <div ref={ctnDom} className="w-full h-full absolute inset-0 pointer-events-none" {...rest} />;
});

// Add displayName for ESLint compliance
Galaxy.displayName = "Galaxy";

// ReactBits-style Animated Counter Component
interface CounterProps {
  value: number;
  label: string;
  color: string;
  bgColor: string;
}

const AnimatedCounter: React.FC<CounterProps> = ({ value, label, color, bgColor }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value !== displayValue) {
      const duration = 500; // Animation duration in ms
      const steps = 20;
      const increment = (value - displayValue) / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.round(displayValue + increment * currentStep));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, displayValue]);

  return (
    <div className={`${bgColor} rounded-lg p-4 transform transition-all duration-300 hover:scale-105`}>
      <div className={`text-2xl font-bold ${color} mb-1`}>{label}</div>
      <div 
        className={`text-3xl font-bold ${color} transition-all duration-300`}
        style={{
          transform: displayValue !== value ? 'scale(1.2)' : 'scale(1)',
        }}
      >
        {displayValue}
      </div>
    </div>
  );
};

const TicTacToe: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    gameOver: false,
    scores: { X: 0, O: 0, draws: 0 },
    winningLine: null,
    showCelebration: false
  });

  const checkWinner = (board: Board): { winner: Player; winningLine: number[] | null } => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], winningLine: pattern };
      }
    }

    return { winner: null, winningLine: null };
  };

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.gameOver) return;

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;
    
    const { winner, winningLine } = checkWinner(newBoard);
    const isDraw = !winner && newBoard.every(cell => cell !== null);
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      gameOver: winner !== null || isDraw,
      winningLine,
      showCelebration: winner !== null || isDraw
    }));

    // Auto-hide celebration after 3 seconds
    if (winner || isDraw) {
      setTimeout(() => {
        setGameState(prev => ({ ...prev, showCelebration: false }));
      }, 3000);
    }
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      gameOver: false,
      winningLine: null,
      showCelebration: false
    }));
  };

  const resetScores = () => {
    setGameState(prev => ({
      ...prev,
      scores: { X: 0, O: 0, draws: 0 }
    }));
  };

  useEffect(() => {
    if (gameState.winner) {
      setGameState(prev => ({
        ...prev,
        scores: {
          ...prev.scores,
          [gameState.winner!]: prev.scores[gameState.winner!] + 1
        }
      }));
    } else if (gameState.gameOver && !gameState.winner) {
      setGameState(prev => ({
        ...prev,
        scores: {
          ...prev.scores,
          draws: prev.scores.draws + 1
        }
      }));
    }
  }, [gameState.winner, gameState.gameOver]);

  const renderCell = (index: number) => {
    const cellValue = gameState.board[index];
    const isWinningCell = gameState.winningLine?.includes(index);
    const isWinner = gameState.winner && isWinningCell;
    
    return (
      <button
        key={index}
        onClick={() => handleCellClick(index)}
        className={`
          w-20 h-20 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl
          text-4xl font-bold transition-all duration-300 transform hover:scale-105
          ${cellValue === 'X' ? 'text-blue-600' : 'text-red-600'}
          ${gameState.gameOver ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
          ${isWinner ? 'bg-yellow-200/90 animate-pulse shadow-lg scale-105 ring-4 ring-yellow-400 rounded-xl' : ''}
          disabled:hover:bg-white/90 disabled:hover:scale-100
          ${isWinner ? 'disabled:hover:bg-yellow-200/90 disabled:hover:scale-105' : ''}
          border border-white/20 shadow-xl
        `}
        disabled={gameState.gameOver || cellValue !== null}
      >
        <span className={isWinner ? 'animate-bounce' : ''}>{cellValue}</span>
      </button>
    );
  };

  const getGameStatus = () => {
    if (gameState.winner) {
      return `🎉 Player ${gameState.winner} wins!`;
    }
    if (gameState.gameOver) {
      return "🤝 It's a draw!";
    }
    return `Current player: ${gameState.currentPlayer}`;
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* ReactBits Galaxy Background */}
      <div className="fixed inset-0 z-0">
        <Galaxy 
          mouseRepulsion={false}
          mouseInteraction={false}
          density={1.2}
          glowIntensity={0.4}
          saturation={0.6}
          hueShift={180}
          twinkleIntensity={0.4}
          rotationSpeed={0.05}
          transparent={false}
        />
      </div>
      
      {/* Celebration Overlay */}
      {gameState.showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {gameState.winner ? (
            // Winner celebration
            <div className="text-center animate-bounce">
              <div className="text-8xl mb-4">🎉</div>
              <div className="text-4xl font-bold text-white drop-shadow-lg animate-pulse">
                Player {gameState.winner} Wins!
              </div>
              <div className="flex justify-center mt-4 space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 bg-yellow-300 rounded-full animate-ping"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Draw celebration
            <div className="text-center animate-pulse">
              <div className="text-8xl mb-4">🤝</div>
              <div className="text-4xl font-bold text-white drop-shadow-lg">
                It&apos;s a Draw!
              </div>
              <div className="text-2xl text-white/80 mt-2">Good Game!</div>
            </div>
          )}
        </div>
      )}

      {/* Confetti Animation */}
      {gameState.showCelebration && gameState.winner && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md w-full relative z-30 border border-white/20">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Tic Tac Toe
        </h1>
        
        <p className="text-center text-white/70 mb-6">Built with Next.js & TypeScript with ReactBits</p>
        
        {/* Game Status */}
        <div className="text-center mb-6">
          <p className={`text-xl font-semibold transition-all duration-300 ${
            gameState.winner 
              ? gameState.winner === 'X' ? 'text-blue-400 animate-pulse' : 'text-red-400 animate-pulse'
              : gameState.gameOver ? 'text-gray-300 animate-pulse' : 'text-white'
          }`}>
            {getGameStatus()}
          </p>
        </div>

        {/* Game Board */}
        <div className="relative mb-6 flex justify-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm p-1 rounded-xl border border-white/30">
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }, (_, i) => renderCell(i))}
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={resetGame}
            className="flex-1 bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-sm text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600/90 hover:to-purple-700/90 transition-all duration-200 transform hover:scale-105 border border-white/20"
          >
            New Game
          </button>
          <button
            onClick={resetScores}
            className="flex-1 bg-gradient-to-r from-gray-500/80 to-gray-600/80 backdrop-blur-sm text-white py-3 px-4 rounded-lg font-semibold hover:from-gray-600/90 hover:to-gray-700/90 transition-all duration-200 transform hover:scale-105 border border-white/20"
          >
            Reset Scores
          </button>
        </div>

        {/* Score Board with ReactBits-style Animated Counters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <h3 className="text-lg font-semibold text-center mb-3 text-white">Score Board</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <AnimatedCounter
              value={gameState.scores.X}
              label="X"
              color="text-blue-400"
              bgColor="bg-blue-500/20 border border-blue-400/30"
            />
            <AnimatedCounter
              value={gameState.scores.draws}
              label="Draws"
              color="text-gray-300"
              bgColor="bg-gray-500/20 border border-gray-400/30"
            />
            <AnimatedCounter
              value={gameState.scores.O}
              label="O"
              color="text-red-400"
              bgColor="bg-red-500/20 border border-red-400/30"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-white/60">
          <p>Click on any empty cell to make your move!</p>
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;