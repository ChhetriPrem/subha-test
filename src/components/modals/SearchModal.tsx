import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { StreamRoom } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoom: (room: StreamRoom) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectRoom }) => {
  const [query, setQuery] = useState('');
  const [streams, setStreams] = useState<StreamRoom[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/streams')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setStreams(data);
        })
        .catch((err) => console.error('Failed to load streams in search:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = streams.filter(
    (s) =>
      s.title?.toLowerCase().includes(query.toLowerCase()) ||
      s.host?.name?.toLowerCase().includes(query.toLowerCase()) ||
      s.category?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#150a30] border border-purple-500/30 rounded-3xl p-5 shadow-2xl relative space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-black text-white flex items-center space-x-2">
          <Search className="w-5 h-5 text-pink-400" />
          <span>Search Streamers & Rooms</span>
        </h2>

        <div className="relative">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, streamer, or topic..."
            className="w-full bg-black/50 border border-white/20 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelectRoom(s);
                onClose();
              }}
              className="w-full bg-white/5 border border-white/10 hover:border-pink-500/40 p-2.5 rounded-2xl flex items-center space-x-3 transition-all text-left"
            >
              <img src={s.coverImage} alt={s.title} className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{s.title}</h4>
                <p className="text-[10px] text-pink-300">@{s.host.handle} • {s.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
