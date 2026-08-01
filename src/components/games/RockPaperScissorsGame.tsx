import React, { useState } from 'react';
import { Gamepad2, Coins, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Choice = 'rock' | 'paper' | 'scissors';

export const RockPaperScissorsGame: React.FC = () => {
  const { user, buyCoins, deductCoins } = useAuth();
  const [userChoice, setUserChoice] = useState<Choice | null>(null);
  const [aiChoice, setAiChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [bet, setBet] = useState(50);

  const choices: { id: Choice; label: string; icon: string }[] = [
    { id: 'rock', label: 'Rock', icon: '🪨' },
    { id: 'paper', label: 'Paper', icon: '📄' },
    { id: 'scissors', label: 'Scissors', icon: '✂️' },
  ];

  const handlePlay = (choice: Choice) => {
    if (!deductCoins(bet)) {
      alert('Not enough coins!');
      return;
    }

    setUserChoice(choice);
    const options: Choice[] = ['rock', 'paper', 'scissors'];
    const botChoice = options[Math.floor(Math.random() * options.length)];
    setAiChoice(botChoice);

    if (choice === botChoice) {
      setResult('IT\'S A TIE! Coins returned 🪙');
      buyCoins(bet);
    } else if (
      (choice === 'rock' && botChoice === 'scissors') ||
      (choice === 'paper' && botChoice === 'rock') ||
      (choice === 'scissors' && botChoice === 'paper')
    ) {
      setResult(`YOU WON! +${bet * 2} Coins 🎉`);
      buyCoins(bet * 2);
    } else {
      setResult(`YOU LOST! -${bet} Coins 😢`);
    }
  };

  return (
    <div className="bg-[#160d36] p-3 rounded-2xl border border-white/10 space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-xs text-white">Rock Paper Scissors Duel</span>
        </div>
        <div className="flex items-center space-x-1 text-xs font-bold text-yellow-400">
          <Coins className="w-4 h-4" />
          <span>Bet: {bet}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {choices.map((c) => (
          <button
            key={c.id}
            onClick={() => handlePlay(c.id)}
            className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 hover:border-amber-400/50 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <span className="text-3xl mb-1">{c.icon}</span>
            <span className="text-[11px] font-bold text-white">{c.label}</span>
          </button>
        ))}
      </div>

      {userChoice && aiChoice && (
        <div className="bg-purple-950/80 p-3 rounded-xl border border-amber-400/30 text-center space-y-1">
          <div className="flex justify-around items-center text-2xl font-bold text-white">
            <div>
              <p className="text-[10px] text-gray-400">You</p>
              <span>{choices.find((c) => c.id === userChoice)?.icon}</span>
            </div>
            <span className="text-pink-500 font-black text-sm">VS</span>
            <div>
              <p className="text-[10px] text-gray-400">Stream Bot</p>
              <span>{choices.find((c) => c.id === aiChoice)?.icon}</span>
            </div>
          </div>
          <p className="text-xs font-black text-amber-300 mt-2">{result}</p>
        </div>
      )}
    </div>
  );
};
