import React, { useState } from 'react';
import { X, Settings, Shield, Bell, Eye, Globe, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [quality, setQuality] = useState('1080p');
  const [language, setLanguage] = useState('English');
  const [notifications, setNotifications] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#150a30] border border-purple-500/30 rounded-3xl p-5 shadow-2xl relative space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-black text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-purple-400" />
          <span>App Settings</span>
        </h2>

        <div className="space-y-3 text-xs">
          {/* Quality */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-pink-400" />
              <span className="font-bold text-white">Stream Video Quality</span>
            </div>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="bg-black/50 border border-white/20 text-white px-2 py-1 rounded-lg text-xs"
            >
              <option value="1080p">1080p HD</option>
              <option value="720p">720p Balanced</option>
              <option value="480p">480p Data Saver</option>
            </select>
          </div>

          {/* Language */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white">Language</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-black/50 border border-white/20 text-white px-2 py-1 rounded-lg text-xs"
            >
              <option value="English">English 🇺🇸</option>
              <option value="Hindi">Hindi 🇮🇳</option>
              <option value="Tagalog">Tagalog 🇵🇭</option>
              <option value="Turkish">Turkish 🇹🇷</option>
            </select>
          </div>

          {/* Notifications Toggle */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">Push Notifications</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${
                notifications ? 'bg-pink-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  notifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
