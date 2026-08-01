import React from 'react';
import { StreamRoom } from '../types';
import { Users, Volume2 } from 'lucide-react';

interface StreamCardProps {
  room: StreamRoom;
  onSelect: (room: StreamRoom) => void;
}

export const StreamCard: React.FC<StreamCardProps> = ({ room, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(room)}
      className="relative rounded-2xl overflow-hidden cursor-pointer group bg-[#180e38] border border-white/10 hover:border-pink-500/50 shadow-lg hover:shadow-pink-500/20 transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Thumbnail Aspect Ratio Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-purple-950">
        <img
          src={room.coverImage}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0826] via-transparent to-black/40" />

        {/* Top Header Stats Bar */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          {/* Country Flag Pill */}
          <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-xs text-white">
            <span className="text-sm">{room.countryFlag}</span>
          </div>

          {/* Viewer Count Badge */}
          <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 text-[11px] font-semibold text-white">
            <Users className="w-3 h-3 text-pink-400" />
            <span>{room.viewerCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Bottom Tag Pill with Live Equalizer */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <div className="flex items-center space-x-1.5 bg-[#8b5cf6]/80 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-lg border border-white/20 shadow-md">
            {/* Equalizer animation */}
            <div className="flex items-end space-x-0.5 h-3">
              <span className="w-0.5 h-2.5 bg-white rounded-full animate-[bounce_1s_infinite_100ms]"></span>
              <span className="w-0.5 h-3 bg-pink-300 rounded-full animate-[bounce_1s_infinite_300ms]"></span>
              <span className="w-0.5 h-1.5 bg-white rounded-full animate-[bounce_1s_infinite_200ms]"></span>
            </div>
            <span>{room.type === 'video' ? 'Video Room' : room.type === 'audio' ? 'Audio Room' : 'Gaming'}</span>
          </div>
        </div>
      </div>

      {/* Host info and Title below image */}
      <div className="p-3 bg-[#150b33] border-t border-white/5">
        <div className="flex items-center space-x-2">
          <img
            src={room.host.avatar}
            alt={room.host.name}
            className="w-7 h-7 rounded-full object-cover ring-2 ring-pink-500/50"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-pink-300 transition-colors">
              {room.title}
            </h4>
            <p className="text-[10px] text-gray-400 truncate">@{room.host.handle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
