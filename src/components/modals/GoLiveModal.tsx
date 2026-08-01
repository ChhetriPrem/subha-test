import React, { useState } from 'react';
import { X, Radio, Video, Mic, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoomType } from '../../types';

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStream: (title: string, category: string, type: RoomType, mode?: 'solo' | 'multi') => void;
}

export const GoLiveModal: React.FC<GoLiveModalProps> = ({ isOpen, onClose, onStartStream }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(`${user.name}'s Live Stream ✨`);
  const [category, setCategory] = useState('Music');
  const [roomType, setRoomType] = useState<RoomType>('video');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartStream(title, category, roomType, 'multi');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#150a30] border border-purple-500/30 rounded-3xl p-5 shadow-2xl relative space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="p-2 bg-pink-500/20 border border-pink-500/40 rounded-xl text-pink-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Go Live Now</h2>
            <p className="text-[11px] text-gray-400">Set up your room title & stream mode</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Room Title */}
          <div>
            <label className="text-[11px] font-bold text-gray-300 mb-1 block">Stream Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your stream an attractive title..."
              className="w-full bg-black/50 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Room Type Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-300 mb-1 block">Room Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRoomType('video')}
                className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-bold transition-all ${
                  roomType === 'video'
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video Room</span>
              </button>

              <button
                type="button"
                onClick={() => setRoomType('audio')}
                className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-bold transition-all ${
                  roomType === 'audio'
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Audio Room</span>
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold text-gray-300 mb-1 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="Music">Music & Singing 🎤</option>
              <option value="Gaming">Gaming & Esports 🎮</option>
              <option value="Audio Room">Voice & Chill 🎙️</option>
              <option value="CP Matching">Love & CP Matching ❤️</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#ff2a85] via-[#d81b60] to-[#8b5cf6] text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-500/30 hover:opacity-95 transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Live Stream</span>
          </button>
        </form>
      </div>
    </div>
  );
};
