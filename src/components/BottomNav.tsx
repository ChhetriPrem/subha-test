import React from 'react';
import { Home, Tv, MessageSquare, User, Radio } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'reel' | 'live' | 'message' | 'profile';
  setActiveTab: (tab: 'home' | 'reel' | 'live' | 'message' | 'profile') => void;
  onGoLiveClick: () => void;
  unreadMessagesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onGoLiveClick,
  unreadMessagesCount = 0,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#050507]/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        {/* Home Tab */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === 'home' ? 'text-indigo-400 scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide">Home</span>
        </button>

        {/* Solo Live Feed Tab */}
        <button
          onClick={() => setActiveTab('reel')}
          className={`flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === 'reel' ? 'text-pink-400 scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide">Solo Live</span>
        </button>

        {/* Floating Action Button (Center Go Live / Voice Room Button) */}
        <button
          onClick={onGoLiveClick}
          className="-mt-5 relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
          <div className="relative w-14 h-14 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 rounded-full p-0.5 shadow-xl flex items-center justify-center border-2 border-white/30">
            <Radio className="w-7 h-7 text-white animate-pulse" />
          </div>
        </button>

        {/* Message Tab */}
        <button
          onClick={() => setActiveTab('message')}
          className={`relative flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === 'message' ? 'text-indigo-400 scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide">Message</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 right-1 bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[#050507]">
              {unreadMessagesCount}
            </span>
          )}
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === 'profile' ? 'text-indigo-400 scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide">Profile</span>
        </button>
      </div>
    </div>
  );
};
