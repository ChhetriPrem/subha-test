import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Radio, Gem, Users, Clock, Trophy, BarChart2, Sparkles, ArrowUpRight } from 'lucide-react';

interface CreatorDashboardViewProps {
  onGoLiveClick: () => void;
}

export const CreatorDashboardView: React.FC<CreatorDashboardViewProps> = ({ onGoLiveClick }) => {
  const { user } = useAuth();

  return (
    <div className="pb-24 pt-3 px-3 max-w-md mx-auto space-y-4 text-white bg-[#0f0826] min-h-screen">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-pink-500/20 border border-pink-500/40 rounded-xl text-pink-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Creator Host Dashboard</h2>
            <p className="text-[11px] text-gray-400">Stream analytics & Diamond revenue</p>
          </div>
        </div>

        <button
          onClick={onGoLiveClick}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs rounded-full shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform"
        >
          Go Live Now
        </button>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-purple-900/60 to-pink-950/60 border border-purple-500/40 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-pink-300 uppercase">Total Diamonds</span>
            <Gem className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-black text-white">{user.diamonds.toLocaleString()}</span>
          <p className="text-[9px] text-emerald-400 font-bold mt-1 flex items-center">
            <ArrowUpRight className="w-3 h-3" /> +14.2% this week
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/60 to-purple-950/60 border border-indigo-500/40 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-indigo-300 uppercase">Stream Time</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-black text-white">48h 20m</span>
          <p className="text-[9px] text-indigo-300 font-bold mt-1">12 Streams completed</p>
        </div>
      </div>

      {/* Top Gifters Ranking List */}
      <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-white flex items-center space-x-1.5">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Top Stream Gifters</span>
          </span>
          <span className="text-[10px] text-gray-400">All-time</span>
        </div>

        <div className="space-y-2">
          {[
            { name: 'Maya Lin', giftCoins: 125000, rank: 1, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200' },
            { name: 'Alex Gamer', giftCoins: 89000, rank: 2, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200' },
            { name: 'Samantha Vance', giftCoins: 45000, rank: 3, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
          ].map((g) => (
            <div key={g.name} className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5">
              <div className="flex items-center space-x-2.5">
                <span className={`text-xs font-black ${g.rank === 1 ? 'text-yellow-400' : 'text-gray-300'}`}>#{g.rank}</span>
                <img src={g.avatar} alt={g.name} className="w-8 h-8 rounded-full object-cover" />
                <span className="text-xs font-bold text-white">{g.name}</span>
              </div>
              <span className="text-xs font-bold text-amber-300">🪙 {g.giftCoins.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
