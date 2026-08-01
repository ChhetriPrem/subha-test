import React, { useState, useEffect, useRef } from 'react';
import { ShortReel } from '../types';
import {
  Heart,
  MessageCircle,
  Share2,
  Music,
  Gift,
  Plus,
  Check,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Play,
  Pause
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ReelsViewProps {
  onOpenGiftDrawer: () => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({ onOpenGiftDrawer }) => {
  const { followingIds, toggleFollow } = useAuth();
  const [reels, setReels] = useState<ShortReel[]>([]);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const res = await fetch('/api/reels');
      if (res.ok) {
        const data = await res.json();
        setReels(data);
      }
    } catch (e) {
      console.error('Failed to fetch reels:', e);
    }
  };

  const currentReel = reels[activeReelIndex];

  const handleNextReel = () => {
    if (reels.length === 0) return;
    setActiveReelIndex((prev) => (prev + 1) % reels.length);
    setIsPlaying(true);
  };

  const handlePrevReel = () => {
    if (reels.length === 0) return;
    setActiveReelIndex((prev) => (prev - 1 + reels.length) % reels.length);
    setIsPlaying(true);
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!currentReel) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-slate-400 font-bold text-sm">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span>Loading 10s Short Reels...</span>
        </div>
      </div>
    );
  }

  const isFollowing = followingIds.has(currentReel.user.id);

  const toggleLike = () => {
    setReels((prev) =>
      prev.map((r, i) => {
        if (i === activeReelIndex) {
          return {
            ...r,
            isLiked: !r.isLiked,
            likes: r.isLiked ? r.likes - 1 : r.likes + 1,
          };
        }
        return r;
      })
    );
  };

  const addComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setReels((prev) =>
      prev.map((r, i) => {
        if (i === activeReelIndex) {
          return {
            ...r,
            comments: r.comments + 1,
          };
        }
        return r;
      })
    );
    setCommentText('');
    setShowCommentModal(false);
  };

  return (
    <div className="relative h-screen pb-20 bg-black flex flex-col justify-between overflow-hidden max-w-md mx-auto select-none">
      {/* Video Content Container */}
      <div className="absolute inset-0 z-0 cursor-pointer" onClick={toggleVideoPlay}>
        <video
          ref={videoRef}
          key={currentReel.videoUrl}
          src={currentReel.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />

        {/* Center Pause/Play Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs">
            <div className="p-5 bg-black/60 rounded-full border border-white/20 text-white animate-in zoom-in-75 duration-150">
              <Play className="w-10 h-10 fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Top Header Tag & Audio / Nav Controls */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-black text-white tracking-wide">Vibe Reels</span>
          <span className="text-[10px] font-extrabold text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
            {activeReelIndex + 1} / {reels.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio Mute/Unmute Toggle */}
          <button
            onClick={toggleMute}
            className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/20 text-white transition-all"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Up/Down Navigation Floating Arrows */}
      <div className="absolute right-4 top-24 z-20 flex flex-col space-y-2">
        <button
          onClick={handlePrevReel}
          className="p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/20 text-white transition-all"
          title="Previous Reel"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleNextReel}
          className="p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/20 text-white transition-all"
          title="Next Reel"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Right Action Icons Column */}
      <div className="absolute right-4 bottom-28 z-20 flex flex-col items-center space-y-5">
        {/* Creator Avatar with Follow Plus Badge */}
        <div className="relative mb-2">
          <img
            src={currentReel.user.avatar}
            alt={currentReel.user.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500 shadow-xl"
          />
          <button
            onClick={() => toggleFollow(currentReel.user.id)}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-gradient-to-r from-indigo-600 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold border border-black shadow-md"
          >
            {isFollowing ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>

        {/* Like Button */}
        <button onClick={toggleLike} className="flex flex-col items-center group">
          <div className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/20 group-hover:scale-110 transition-transform">
            <Heart
              className={`w-6 h-6 transition-colors ${
                currentReel.isLiked ? 'fill-pink-500 text-pink-500' : 'text-white'
              }`}
            />
          </div>
          <span className="text-xs font-bold text-white mt-1">{currentReel.likes.toLocaleString()}</span>
        </button>

        {/* Comment Button */}
        <button onClick={() => setShowCommentModal(true)} className="flex flex-col items-center group">
          <div className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/20 group-hover:scale-110 transition-transform">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-bold text-white mt-1">{currentReel.comments}</span>
        </button>

        {/* Gift Button */}
        <button onClick={onOpenGiftDrawer} className="flex flex-col items-center group">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 rounded-full shadow-lg shadow-indigo-600/40 group-hover:scale-110 transition-transform">
            <Gift className="w-6 h-6 text-white animate-bounce" />
          </div>
          <span className="text-xs font-bold text-yellow-300 mt-1">Gift</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: currentReel.caption, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Reel link copied to clipboard!');
            }
          }}
          className="flex flex-col items-center group"
        >
          <div className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/20 group-hover:scale-110 transition-transform">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-bold text-white mt-1">{currentReel.shares}</span>
        </button>
      </div>

      {/* Bottom Creator Overlay */}
      <div className="relative z-10 p-4 space-y-2 max-w-[80%]">
        <h3 className="text-sm font-black text-white flex items-center space-x-1">
          <span>@{currentReel.user.handle}</span>
          <span className="text-[10px] text-indigo-400 font-bold bg-white/10 px-1.5 py-0.2 rounded">
            Lvl {currentReel.user.level}
          </span>
        </h3>
        <p className="text-xs text-gray-200 font-medium line-clamp-2">{currentReel.caption}</p>

        {/* Music Track Badge */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-300">
          <Music className="w-3.5 h-3.5 animate-spin" />
          <span className="truncate">{currentReel.musicTitle}</span>
        </div>
      </div>

      {/* Comment Drawer Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#08080c] border border-white/10 rounded-t-3xl p-4 space-y-3 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-black">Comments ({currentReel.comments})</h4>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-40 overflow-y-auto text-xs text-slate-300">
              <div className="flex items-start space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                  className="w-6 h-6 rounded-full"
                />
                <div>
                  <span className="font-bold text-indigo-400">@maya_sing: </span>
                  <span>Awesome clip! 🔥</span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
                  className="w-6 h-6 rounded-full"
                />
                <div>
                  <span className="font-bold text-indigo-400">@leo_beats: </span>
                  <span>Love the vibes! 🎸</span>
                </div>
              </div>
            </div>

            <form onSubmit={addComment} className="flex items-center space-x-2 pt-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-500 font-bold text-xs rounded-xl shadow-md"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

