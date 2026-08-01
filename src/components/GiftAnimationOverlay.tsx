import React from 'react';
import { VirtualGift } from '../types';
import { Sparkles, Trophy } from 'lucide-react';

interface FloatingGiftItem {
  id: string;
  gift: VirtualGift;
  count: number;
  senderName: string;
}

interface FloatingEmojiItem {
  id: string;
  emoji: string;
}

interface GiftAnimationOverlayProps {
  floatingGifts: FloatingGiftItem[];
  floatingEmojis: FloatingEmojiItem[];
}

export const GiftAnimationOverlay: React.FC<GiftAnimationOverlayProps> = ({
  floatingGifts,
  floatingEmojis,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {/* Gift Notification Banner Popups */}
      <div className="absolute top-20 left-4 right-4 flex flex-col space-y-2 max-w-sm">
        {floatingGifts.map((fg) => (
          <div
            key={fg.id}
            className="animate-slide-in-left bg-gradient-to-r from-purple-900/90 via-pink-900/90 to-amber-900/90 border border-amber-400/50 backdrop-blur-md rounded-full p-2 flex items-center space-x-3 shadow-2xl shadow-pink-500/30"
          >
            <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-2xl animate-bounce">
              {fg.gift.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-amber-300 truncate">
                {fg.senderName} <span className="text-white font-normal">sent</span> {fg.gift.name}
              </p>
              <p className="text-[10px] text-pink-200 font-semibold">
                Value: {(fg.gift.priceCoins * fg.count).toLocaleString()} Coins 🪙
              </p>
            </div>
            <div className="bg-gradient-to-r from-pink-500 to-amber-500 text-white font-black text-sm px-3 py-1 rounded-full animate-pulse border border-white/40">
              x{fg.count}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Big Emojis */}
      {floatingEmojis.map((e, index) => (
        <div
          key={e.id}
          style={{
            left: `${20 + (index % 5) * 15}%`,
            bottom: '80px',
          }}
          className="absolute text-4xl animate-[float-up_2.5s_ease-out_forwards] filter drop-shadow-lg"
        >
          {e.emoji}
        </div>
      ))}

      {/* CSS Animations */}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 1;
          }
          50% {
            transform: translateY(-150px) scale(1.3) rotate(10deg);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-300px) scale(1.6) rotate(-15deg);
            opacity: 0;
          }
        }
        @keyframes slide-in-left {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
