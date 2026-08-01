import React, { useState, useEffect } from 'react';
import { StreamCard } from '../components/StreamCard';
import { StreamRoom } from '../types';
import { Sparkles, Radio, Award, ChevronRight, Flame } from 'lucide-react';

interface HomeViewProps {
  activeHomeTab: 'hot' | 'recommend';
  onSelectRoom: (room: StreamRoom) => void;
  onGoLiveClick: () => void;
}

const COUNTRIES = [
  { code: 'All', name: 'All', flag: '🌐' },
  { code: 'India', name: 'India', flag: '🇮🇳' },
  { code: 'Philippines', name: 'Philippines', flag: '🇵🇭' },
  { code: 'Turkey', name: 'Turkey', flag: '🇹🇷' },
  { code: 'USA', name: 'USA', flag: '🇺🇸' },
  { code: 'Egypt', name: 'Egypt', flag: '🇪🇬' },
  { code: 'UK', name: 'UK', flag: '🇬🇧' },
];

const CATEGORIES = ['All', 'Video Room', 'Audio Room', 'Gaming', 'CP Matching'];

export const HomeView: React.FC<HomeViewProps> = ({
  activeHomeTab,
  onSelectRoom,
  onGoLiveClick,
}) => {
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [streams, setStreams] = useState<StreamRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(() => {
      fetchStreams(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeHomeTab, selectedCountry, selectedCategory]);

  const fetchStreams = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (activeHomeTab) query.set('filter', activeHomeTab);
      if (selectedCategory !== 'All') query.set('category', selectedCategory);
      if (selectedCountry !== 'All') query.set('country', selectedCountry);

      const res = await fetch(`/api/streams?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStreams(data);
      }
    } catch (e) {
      console.error('Failed to load streams:', e);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-2 space-y-4 px-3 max-w-md mx-auto">
      {/* Featured Banner Slider (Matching reference "Welcome To TipZy") */}
      <div className="relative rounded-2xl overflow-hidden p-4 bg-gradient-to-r from-[#200947] via-[#4c126b] to-[#1d083f] border border-pink-500/30 shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-yellow-400/20 border border-yellow-400/50 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-yellow-300">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span>SPECIAL EVENT</span>
          </div>
          <h2 className="text-lg font-black text-white leading-tight">
            Welcome To VibeLive <span className="text-pink-400">#TipZy</span>
          </h2>
          <p className="text-[11px] text-gray-300 font-medium">
            We Are Hiring Agency, BD, Admin | Recharge & Get +20% Coins!
          </p>

          <button
            onClick={onGoLiveClick}
            className="mt-1 px-4 py-1.5 bg-gradient-to-r from-[#ff2a85] to-[#8b5cf6] text-white text-xs font-bold rounded-full shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform flex items-center space-x-1"
          >
            <span>Coins Seller & Host Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Decorative Mascot Illustration */}
        <div className="absolute right-2 bottom-2 w-24 h-24 opacity-80 pointer-events-none flex items-center justify-center text-5xl">
          🐯
        </div>
      </div>

      {/* Country Filter Pill Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => setSelectedCountry(c.code)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCountry === c.code
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-md shadow-pink-500/30'
                : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30'
            }`}
          >
            <span>{c.flag}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-white/20 text-pink-300 border border-pink-400/50'
                : 'bg-black/30 text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Streams Grid (2 Columns) */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : streams.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {streams.map((room) => (
            <StreamCard key={room.id} room={room} onSelect={onSelectRoom} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 space-y-2">
          <Radio className="w-8 h-8 text-pink-400 mx-auto animate-bounce" />
          <p className="text-xs font-bold text-white">No active streams found in this category.</p>
          <button
            onClick={onGoLiveClick}
            className="px-4 py-1.5 bg-pink-500 text-white text-xs font-bold rounded-full"
          >
            Be the first to Go Live!
          </button>
        </div>
      )}
    </div>
  );
};
