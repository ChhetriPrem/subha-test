import React from 'react';
import { Search, Trophy, Bell, Coins, Sparkles, Settings, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface HeaderProps {
  activeHomeTab: 'hot' | 'recommend';
  setActiveHomeTab: (tab: 'hot' | 'recommend') => void;
  onSearchClick: () => void;
  onLeaderboardClick: () => void;
  onWalletClick: () => void;
  onNotificationsClick: () => void;
  onSettingsClick: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeHomeTab,
  setActiveHomeTab,
  onSearchClick,
  onLeaderboardClick,
  onWalletClick,
  onNotificationsClick,
  onSettingsClick,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const socket = useSocket();
  const isConnected = socket?.isConnected ?? false;

  return (
    <div className="sticky top-0 z-30 bg-[#050507]/90 backdrop-blur-xl px-4 py-3 border-b border-white/10 flex items-center justify-between">
      {/* Top Tabs */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-full border border-white/10">
          <button
            onClick={() => setActiveHomeTab('hot')}
            className={`px-3.5 py-1 rounded-full text-xs font-black transition-all ${
              activeHomeTab === 'hot'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔥 Hot
          </button>
          <button
            onClick={() => setActiveHomeTab('recommend')}
            className={`px-3.5 py-1 rounded-full text-xs font-black transition-all ${
              activeHomeTab === 'recommend'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✨ Discover
          </button>
        </div>

        {/* WS Connection Indicator */}
        <div
          title={isConnected ? 'Realtime WS Connected' : 'Connecting Realtime WS...'}
          className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold text-slate-300"
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/80' : 'bg-amber-400 animate-ping'}`} />
          <span className="hidden sm:inline">{isConnected ? 'Live WS' : 'Connecting'}</span>
        </div>
      </div>

      {/* Right Icons Row */}
      <div className="flex items-center space-x-2">
        {/* User Account Login Button */}
        <button
          onClick={onOpenAuth}
          className="p-1 bg-white/5 hover:bg-white/10 rounded-full text-slate-300 transition-all border border-white/10 relative group"
          title="Switch Account / Login"
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500"
          />
        </button>

        {/* Coin Balance Pill */}
        <button
          onClick={onWalletClick}
          className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full hover:bg-amber-500/20 transition-all"
        >
          <Coins className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
          <span className="text-xs font-black text-yellow-300">{user.coins.toLocaleString()}</span>
        </button>

        {/* Notifications */}
        <button
          onClick={onNotificationsClick}
          className="relative p-2 bg-white/5 hover:bg-white/10 rounded-full text-indigo-300 transition-all border border-white/10"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-[#050507]" />
        </button>

        {/* Settings */}
        <button
          onClick={onSettingsClick}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-300 transition-all border border-white/10"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
