import React, { useState } from 'react';
import { X, Coins, Gem, ArrowRightLeft, CreditCard, History, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { user, buyCoins, addDiamonds } = useAuth();
  const [activeTab, setActiveTab] = useState<'recharge' | 'exchange' | 'history'>('recharge');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuyPackage = (coinsAmount: number, priceUsd: string) => {
    buyCoins(coinsAmount);
    setSuccessMsg(`Succesfully purchased ${coinsAmount.toLocaleString()} Coins for ${priceUsd}! 🎉`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleExchange = () => {
    if (user.diamonds >= 1000) {
      addDiamonds(-1000);
      buyCoins(700);
      setSuccessMsg('Exchanged 1,000 Diamonds for 700 Coins! 🪙');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      alert('Minimum 1,000 Diamonds required to exchange!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#13082b] border border-purple-500/30 rounded-3xl p-5 shadow-2xl relative space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-black text-white flex items-center space-x-2">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span>Vibe Wallet & Recharge</span>
        </h2>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-amber-900/60 to-yellow-950/60 border border-amber-500/40 p-3 rounded-2xl">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Coin Balance</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl">🪙</span>
              <span className="text-lg font-black text-white">{user.coins.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/60 to-pink-950/60 border border-purple-500/40 p-3 rounded-2xl">
            <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider">Diamond Balance</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl">💎</span>
              <span className="text-lg font-black text-white">{user.diamonds.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Toast success message */}
        {successMsg && (
          <div className="bg-emerald-900/80 border border-emerald-500 p-2.5 rounded-xl text-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('recharge')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'recharge' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Recharge Coins
          </button>
          <button
            onClick={() => setActiveTab('exchange')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'exchange' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Exchange
          </button>
        </div>

        {/* Recharge Packages Grid */}
        {activeTab === 'recharge' && (
          <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
            {[
              { coins: 100, bonus: 0, price: '$0.99' },
              { coins: 550, bonus: 50, price: '$4.99' },
              { coins: 1200, bonus: 200, price: '$9.99' },
              { coins: 3800, bonus: 800, price: '$29.99' },
              { coins: 6500, bonus: 1500, price: '$49.99' },
              { coins: 14000, bonus: 4000, price: '$99.99' },
            ].map((pkg) => (
              <button
                key={pkg.coins}
                onClick={() => handleBuyPackage(pkg.coins + pkg.bonus, pkg.price)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 p-3 rounded-2xl flex flex-col items-center justify-between space-y-2 transition-all hover:scale-102"
              >
                <div className="text-center">
                  <span className="text-lg font-black text-yellow-400">🪙 {(pkg.coins + pkg.bonus).toLocaleString()}</span>
                  {pkg.bonus > 0 && <p className="text-[9px] font-bold text-emerald-400">+{pkg.bonus} Bonus Coins</p>}
                </div>
                <span className="w-full py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs rounded-lg text-center">
                  {pkg.price}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Exchange Tab */}
        {activeTab === 'exchange' && (
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 text-center">
            <p className="text-xs text-gray-300">Convert your Creator Diamonds into usable Vibe Coins.</p>
            <div className="flex items-center justify-center space-x-3 text-lg font-bold text-white">
              <span>💎 1,000 Diamonds</span>
              <ArrowRightLeft className="w-4 h-4 text-pink-400" />
              <span>🪙 700 Coins</span>
            </div>
            <button
              onClick={handleExchange}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Exchange Diamonds Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
