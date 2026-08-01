import React, { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, Trash2, Send, Award } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const DrawAndGuessGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { sendDrawStroke, clearCanvas } = useSocket();
  const { user, buyCoins } = useAuth();

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff2a85');
  const [lineWidth, setLineWidth] = useState(4);
  const [guessInput, setGuessInput] = useState('');
  const [currentWord, setCurrentWord] = useState('Guitar');
  const [score, setScore] = useState(120);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    sendDrawStroke({ x, y, color, lineWidth });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    clearCanvas();
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput) return;

    if (guessInput.trim().toLowerCase() === currentWord.toLowerCase()) {
      setWinnerMessage(`🎉 Correct! You guessed "${currentWord}" and won +50 Coins! 🪙`);
      setScore((s) => s + 50);
      buyCoins(50);
      setTimeout(() => {
        setWinnerMessage(null);
        setCurrentWord(['Crown', 'Pizza', 'Rocket', 'Dragon', 'Diamond'][Math.floor(Math.random() * 5)]);
        handleClear();
      }, 2500);
    } else {
      setWinnerMessage('❌ Incorrect! Try again!');
      setTimeout(() => setWinnerMessage(null), 1500);
    }
    setGuessInput('');
  };

  return (
    <div className="flex flex-col bg-[#160d36] p-3 rounded-2xl border border-white/10 space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-pink-400" />
          <span className="font-bold text-xs text-white">Draw & Guess Live Game</span>
        </div>
        <div className="flex items-center space-x-1 text-xs font-bold text-yellow-400">
          <Award className="w-4 h-4" />
          <span>Score: {score}</span>
        </div>
      </div>

      {/* Secret Word Box */}
      <div className="bg-purple-900/40 p-2 rounded-xl text-center border border-purple-500/30 text-xs">
        <span className="text-gray-300">Word to Draw/Guess: </span>
        <span className="font-extrabold text-pink-400 uppercase tracking-widest">{currentWord}</span>
      </div>

      {/* Drawing Canvas */}
      <div className="relative aspect-[4/3] bg-white rounded-xl overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          className="w-full h-full cursor-crosshair touch-none"
        />

        {winnerMessage && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 text-center font-extrabold text-sm text-yellow-300 animate-pulse">
            {winnerMessage}
          </div>
        )}
      </div>

      {/* Drawing Toolbar */}
      <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-white/10">
        <div className="flex items-center space-x-1.5">
          {['#ff2a85', '#3b82f6', '#10b981', '#f59e0b', '#000000'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full border-2 ${
                color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleClear}
          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Guess Input */}
      <form onSubmit={handleGuessSubmit} className="flex space-x-2">
        <input
          type="text"
          value={guessInput}
          onChange={(e) => setGuessInput(e.target.value)}
          placeholder="Type your guess here..."
          className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
        />
        <button
          type="submit"
          className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md"
        >
          Guess
        </button>
      </form>
    </div>
  );
};
