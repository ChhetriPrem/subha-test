import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Heart, Flame, Sparkles, Pin, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatOverlayProps {
  messages: ChatMessage[];
  pinnedMessage?: string;
  onSendMessage: (content: string) => void;
  onSendEmojiReaction: (emoji: string) => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  pinnedMessage,
  onSendMessage,
  onSendEmojiReaction,
}) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full justify-between pointer-events-auto">
      {/* Pinned Message Notice */}
      {pinnedMessage && (
        <div className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 border border-pink-500/30 backdrop-blur-md rounded-xl p-2 mb-2 flex items-center space-x-2 text-xs text-pink-200">
          <Pin className="w-4 h-4 text-pink-400 shrink-0 animate-pulse" />
          <span className="font-semibold truncate">{pinnedMessage}</span>
        </div>
      )}

      {/* Auto-scrolling Messages Box */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-48 pr-1 no-scrollbar text-xs">
        {messages.length === 0 ? (
          <div className="py-6 text-center text-slate-400/80 bg-black/30 border border-white/5 rounded-2xl p-3">
            <p className="font-extrabold text-xs text-indigo-300 mb-0.5">Welcome to the Live Stream! 👋</p>
            <p className="text-[10px] text-slate-400">No chat messages yet. Say hi or ask a question!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === user.id;
            const isAI = msg.sender.id === 'usr_aibot';

            return (
              <div
                key={msg.id}
                className={`p-2 rounded-xl backdrop-blur-md border ${
                  msg.isGift
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                    : isAI
                    ? 'bg-purple-950/80 border-purple-400/60 text-purple-200'
                    : 'bg-black/40 border-white/10 text-white'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1 flex-wrap">
                  {/* Level Badge */}
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white">
                    LV.{msg.sender.level}
                  </span>

                  {/* SVIP badge */}
                  {msg.sender.svip && (
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-600 text-[9px] font-black px-1.5 py-0.5 rounded-full text-black">
                      SVIP
                    </span>
                  )}

                  {/* Sender Name */}
                  <span className="font-bold text-pink-300">{msg.sender.name}:</span>
                </div>

                {/* Message Content */}
                <p className="break-words font-medium">{msg.content}</p>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Floating Emoji Reactions Bar */}
      <div className="flex items-center space-x-2 my-2 overflow-x-auto py-1">
        {['❤️', '🔥', '🎉', '💎', '🚀', '👏'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendEmojiReaction(emoji)}
            className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-lg hover:scale-125 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Say something or type @AI..."
            className="w-full bg-black/60 border border-white/20 rounded-full pl-3.5 pr-10 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition-all"
          />
          <button
            type="button"
            onClick={() => setInputText((prev) => (prev ? `${prev} @AI ` : '@AI '))}
            title="Ask AI Stream Bot"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-purple-400 hover:text-purple-300"
          >
            <Bot className="w-4 h-4" />
          </button>
        </div>

        <button
          type="submit"
          className="p-2.5 bg-gradient-to-r from-[#ff2a85] to-[#8b5cf6] text-white rounded-full hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-pink-500/30"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
