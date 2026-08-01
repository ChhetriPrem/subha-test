import React, { useState, useEffect } from 'react';
import { HelpCircle, Clock, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TRIVIA_QUESTIONS = [
  {
    q: 'Which country invented the game of Chess?',
    options: ['China', 'India', 'Persia', 'Greece'],
    ans: 1,
  },
  {
    q: 'What is the world record for longest live stream broadcast?',
    options: ['150 Hours', '268 Hours', '624 Hours', '1000 Hours'],
    ans: 2,
  },
  {
    q: 'What is the currency symbol for Diamonds in live streaming apps?',
    options: ['💎', '🪙', '👑', '⚡'],
    ans: 0,
  },
];

export const TriviaGame: React.FC = () => {
  const { buyCoins } = useAuth();
  const [qIndex, setQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);

  const currentQ = TRIVIA_QUESTIONS[qIndex];

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    if (idx === currentQ.ans) {
      setScore((s) => s + 100);
      buyCoins(50);
    }
  };

  const nextQuestion = () => {
    setSelectedOpt(null);
    setTimeLeft(15);
    setQIndex((prev) => (prev + 1) % TRIVIA_QUESTIONS.length);
  };

  return (
    <div className="bg-[#160d36] p-3 rounded-2xl border border-white/10 space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-xs text-white">Live Speed Trivia</span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
          <Clock className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      <div className="bg-purple-900/30 p-3 rounded-xl border border-purple-500/20 text-xs font-semibold text-white">
        {currentQ.q}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {currentQ.options.map((opt, idx) => {
          let optStyle = 'bg-white/5 border-white/10 hover:border-pink-500/50';
          if (selectedOpt !== null) {
            if (idx === currentQ.ans) optStyle = 'bg-emerald-900/60 border-emerald-500 text-emerald-200';
            else if (idx === selectedOpt) optStyle = 'bg-red-900/60 border-red-500 text-red-200';
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(idx)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${optStyle}`}
            >
              <span>{opt}</span>
              {selectedOpt !== null && idx === currentQ.ans && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {selectedOpt !== null && idx === selectedOpt && idx !== currentQ.ans && (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </button>
          );
        })}
      </div>

      {selectedOpt !== null && (
        <button
          onClick={nextQuestion}
          className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs rounded-xl shadow-md"
        >
          Next Question ➡️
        </button>
      )}
    </div>
  );
};
