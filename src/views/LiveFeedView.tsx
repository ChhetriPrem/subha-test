import React, { useState, useEffect } from 'react';
import { StreamRoom } from '../types';
import {
  Radio,
  Eye,
  Heart,
  MessageCircle,
  Gift,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Play,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface LiveFeedViewProps {
  onSelectStream: (room: StreamRoom) => void;
  onOpenGiftDrawer: () => void;
}

export const LiveFeedView: React.FC<LiveFeedViewProps> = ({ onSelectStream, onOpenGiftDrawer }) => {
  const [soloStreams, setSoloStreams] = useState<StreamRoom[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSoloStreams();
  }, []);

  const fetchSoloStreams = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/streams?mode=solo');
      if (res.ok) {
        const data: StreamRoom[] = await res.json();
        setSoloStreams(data.length > 0 ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch solo streams:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentStream = soloStreams[activeIndex];

  const handleNext = () => {
    if (soloStreams.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % soloStreams.length);
  };

  const handlePrev = () => {
    if (soloStreams.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + soloStreams.length) % soloStreams.length);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-slate-400 font-bold text-sm space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        <span className="text-pink-300 animate-pulse">Loading Solo Live Feed...</span>
      </div>
    );
  }

  if (!currentStream) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#050507] text-slate-400 p-6 text-center space-y-4">
        <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400">
          <Radio className="w-8 h-8 animate-pulse" />
        </div>
        <div>
          <h3 className="text-white font-extrabold text-base">No Solo Live Streams Right Now</h3>
          <p className="text-xs text-slate-400 mt-1">Be the first to go live with a Solo Broadcast!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen pb-20 bg-black flex flex-col justify-between overflow-hidden max-w-md mx-auto select-none">
      {/* Background Stream Media / Cover */}
      <div className="absolute inset-0 z-0">
        {currentStream.videoUrl ? (
          <video
            key={currentStream.id}
            src={currentStream.videoUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={currentStream.coverImage}
            alt=""
            className="w-full h-full object-cover filter brightness-75 scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
      </div>

      {/* Top Header Live Badge & Stream Switcher */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="px-2.5 py-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full text-white font-black text-[10px] flex items-center space-x-1 shadow-lg shadow-pink-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>SOLO LIVE</span>
          </div>
          <span className="text-xs font-bold text-white/80 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
            {activeIndex + 1} / {soloStreams.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/20 text-white transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Up / Down Feed Navigation */}
      {soloStreams.length > 1 && (
        <div className="absolute right-4 top-24 z-20 flex flex-col space-y-2">
          <button
            onClick={handlePrev}
            className="p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/20 text-white transition-all active:scale-95"
            title="Previous Stream"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/20 text-white transition-all active:scale-95"
            title="Next Stream"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Right Action Icons Column */}
      <div className="absolute right-4 bottom-28 z-20 flex flex-col items-center space-y-5">
        {/* Host Avatar */}
        <div className="relative mb-2">
          <img
            src={currentStream.host.avatar}
            alt={currentStream.host.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500 shadow-xl"
          />
        </div>

        {/* Gift Button */}
        <button onClick={onOpenGiftDrawer} className="flex flex-col items-center group">
          <div className="p-3 bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-500 rounded-full shadow-lg shadow-pink-600/40 group-hover:scale-110 transition-transform">
            <Gift className="w-6 h-6 text-white animate-bounce" />
          </div>
          <span className="text-[10px] font-bold text-yellow-300 mt-1">Send Gift</span>
        </button>

        {/* Enter Room Button */}
        <button
          onClick={() => onSelectStream(currentStream)}
          className="flex flex-col items-center group"
        >
          <div className="p-3 bg-pink-500 hover:bg-pink-400 text-white rounded-full shadow-lg shadow-pink-500/50 group-hover:scale-110 transition-transform">
            <ArrowRight className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-extrabold text-white mt-1">Join Room</span>
        </button>
      </div>

      {/* Bottom Host Overlay & Join Room Bar */}
      <div className="relative z-10 p-4 space-y-3 max-w-[80%]">
        <div className="flex items-center space-x-2">
          <img
            src={currentStream.host.avatar}
            alt={currentStream.host.name}
            className="w-10 h-10 rounded-full object-cover border border-pink-500"
          />
          <div>
            <h3 className="text-sm font-black text-white flex items-center space-x-1">
              <span>{currentStream.host.name}</span>
              <span className="text-[10px] text-pink-400 font-bold bg-pink-500/20 px-1.5 py-0.2 rounded border border-pink-500/30">
                LV.{currentStream.host.level}
              </span>
            </h3>
            <div className="flex items-center space-x-2 text-[10px] text-gray-300 font-medium">
              <span className="flex items-center space-x-1">
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>{currentStream.viewerCount.toLocaleString()} watching</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Heart className="w-3 h-3 text-pink-400" />
                <span>{currentStream.likeCount.toLocaleString()} likes</span>
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-100 font-bold leading-snug line-clamp-2">{currentStream.title}</p>

        <button
          onClick={() => onSelectStream(currentStream)}
          className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white text-xs font-black rounded-2xl shadow-xl shadow-pink-500/30 hover:opacity-95 transition-all flex items-center justify-center space-x-2 border border-pink-400/30"
        >
          <Sparkles className="w-4 h-4" />
          <span>Enter Live Broadcast Room</span>
        </button>
      </div>
    </div>
  );
};
