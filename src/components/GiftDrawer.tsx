import React, { useState } from 'react';
import { VIRTUAL_GIFTS } from '../data/gifts';
import { VirtualGift } from '../types';
import { Coins, Plus, Send, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GiftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (gift: VirtualGift, count: number) => void;
  onOpenWallet: () => void;
}

export const GiftDrawer: React.FC<GiftDrawerProps> = ({
  isOpen,
  onClose,
  onSendGift,
  onOpenWallet,
}) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'popular' | 'luxury' | 'vip' | 'effects'>('popular');
  const [selectedGift, setSelectedGift] = useState<VirtualGift>(VIRTUAL_GIFTS[0]);
  const [multiplier, setMultiplier] = useState<number>(1);

  if (!isOpen) return null;

  const filteredGifts = VIRTUAL_GIFTS.filter((g) => g.category === selectedCategory);

  const handleSend = () => {
    onSendGift(selectedGift, multiplier);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#130b2e] border-t border-purple-500/30 rounded-t-3xl p-4 shadow-2xl space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm text-white">Send Virtual Gift</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Wallet Balance Pill */}
            <button
              onClick={onOpenWallet}
              className="flex items-center space-x-1.5 bg-amber-500/20 border border-amber-400/40 px-3 py-1 rounded-full hover:bg-amber-500/30 transition-all"
            >
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-300">{user.coins.toLocaleString()}</span>
              <Plus className="w-3.5 h-3.5 text-yellow-300 ml-1" />
            </button>

            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {(['popular', 'luxury', 'vip', 'effects'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#ff2a85] to-[#8b5cf6] text-white shadow-md shadow-pink-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gifts Grid */}
        <div className="grid grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
          {filteredGifts.map((gift) => {
            const isSelected = selectedGift.id === gift.id;
            return (
              <button
                key={gift.id}
                onClick={() => setSelectedGift(gift)}
                className={`relative flex flex-col items-center p-2.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-purple-800/60 to-pink-900/60 border-pink-500 ring-2 ring-pink-500/50 scale-105 shadow-lg shadow-pink-500/30'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <span className="text-3xl mb-1 filter drop-shadow-md">{gift.icon}</span>
                <span className="text-[11px] font-semibold text-white truncate w-full text-center">{gift.name}</span>
                <span className="text-[10px] text-yellow-400 font-bold flex items-center mt-0.5">
                  🪙 {gift.priceCoins}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Bar: Multipliers & Send Button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          {/* Multiplier Pills */}
          <div className="flex items-center space-x-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            {[1, 10, 99].map((m) => (
              <button
                key={m}
                onClick={() => setMultiplier(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  multiplier === m ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                x{m}
              </button>
            ))}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={user.coins < selectedGift.priceCoins * multiplier}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-bold text-sm shadow-xl transition-all ${
              user.coins >= selectedGift.priceCoins * multiplier
                ? 'bg-gradient-to-r from-[#ff2a85] via-[#d81b60] to-[#8b5cf6] text-white hover:opacity-95 active:scale-95 shadow-pink-500/40'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send ({(selectedGift.priceCoins * multiplier).toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
