import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Pin, Bot, Crown, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isCollapsed) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCollapsed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-between bg-black/40 border border-white/15 backdrop-blur-md rounded-full px-3 py-1.5 text-xs text-white pointer-events-auto shadow-lg">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center space-x-2 text-slate-200 hover:text-white font-bold"
        >
          <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
          <span>Chat Collapsed ({messages.length})</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Quick Emojis when collapsed */}
        <div className="flex items-center space-x-1">
          {['❤️', '🔥', '🎉'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendEmojiReaction(emoji)}
              className="text-sm hover:scale-125 transition-transform px-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between pointer-events-auto bg-transparent overflow-hidden">
      {/* Header Bar with Collapse Toggle & Pinned Message */}
      <div className="flex items-center justify-between mb-1 text-[11px]">
        {pinnedMessage && (showWelcome || !pinnedMessage.toLowerCase().includes('welcome')) ? (
          <div className={`flex-1 bg-gradient-to-r from-purple-950/70 to-pink-950/70 border border-pink-500/30 backdrop-blur-md rounded-xl p-1 px-2.5 mr-2 flex items-center space-x-2 text-pink-200 shadow-md truncate transition-all duration-700 ${
            showWelcome ? 'opacity-100 scale-100' : 'opacity-0 scale-95 max-h-0 overflow-hidden hidden'
          }`}>
            <Pin className="w-3 h-3 text-pink-400 shrink-0 animate-pulse" />
            <span className="font-semibold truncate">{pinnedMessage}</span>
          </div>
        ) : (
          <div className="text-[10px] text-slate-300/80 font-bold tracking-wide uppercase px-1">
            Live Stream Chat
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(true)}
          className="bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md text-slate-300 hover:text-white p-1 rounded-full flex items-center space-x-1 text-[10px] px-2 font-bold transition-all shadow-md shrink-0 ml-auto"
          title="Collapse Chat"
        >
          <span>Hide Chat</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Auto-scrolling Messages Box (Transparent Glassy Overlay) */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar text-xs flex flex-col items-start">
        {messages.length === 0 ? (
          <div className={`py-3 text-center text-slate-300 bg-black/30 border border-white/10 rounded-2xl p-2.5 backdrop-blur-md transition-all duration-700 ${
            showWelcome ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none hidden'
          }`}>
            <p className="font-extrabold text-xs text-pink-300 mb-0.5">Welcome to the LIVE! 👋</p>
            <p className="text-[10px] text-slate-300">Say hi to the host or send a gift!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAI = msg.sender.id === 'usr_aibot';
            const isSystemJoin = msg.content.toLowerCase().includes('joined the live');

            if (isSystemJoin) {
              return (
                <div
                  key={msg.id}
                  className="inline-flex items-center space-x-1.5 bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-sky-400/20 text-[10px] text-sky-300 font-bold shadow-sm my-0.5"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-sky-500/30 text-sky-200 flex items-center justify-center text-[8px] font-black">
                    {msg.sender.level || 20}
                  </span>
                  <span className="text-white">{msg.sender.name}</span>
                  <span className="text-sky-300 font-semibold">joined the LIVE</span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`p-1.5 px-2.5 rounded-2xl backdrop-blur-md border shadow-md inline-block max-w-[92%] ${
                  msg.isGift
                    ? 'bg-gradient-to-r from-amber-950/70 via-yellow-900/50 to-purple-950/70 border-amber-400/40 text-amber-200'
                    : isAI
                    ? 'bg-purple-950/70 border-purple-400/50 text-purple-200'
                    : 'bg-black/40 border-white/15 text-white'
                }`}
              >
                <div className="flex items-center space-x-1.5 flex-wrap">
                  {/* Level Badge */}
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full text-white shadow-sm ${
                      (msg.sender.level || 1) >= 40
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                        : (msg.sender.level || 1) >= 30
                        ? 'bg-gradient-to-r from-pink-500 to-rose-600'
                        : (msg.sender.level || 1) >= 20
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                    }`}
                  >
                    {msg.sender.level || 1}
                  </span>

                  {/* SVIP crown badge */}
                  {msg.sender.svip && (
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-[8px] font-black px-1 py-0.2 rounded text-black flex items-center space-x-0.5">
                      <Crown className="w-2.5 h-2.5 text-black" />
                      <span>SVIP</span>
                    </span>
                  )}

                  {/* Sender Name */}
                  <span className="font-extrabold text-pink-300 drop-shadow-sm">{msg.sender.name}:</span>

                  {/* Message Content */}
                  <span className="break-words font-medium text-slate-100">{msg.content}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Floating Emoji Quick Reactions Bar */}
      <div className="flex items-center space-x-1.5 my-1 overflow-x-auto py-0.5 no-scrollbar">
        {['❤️', '🔥', '🎉', '💎', '🚀', '👏'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendEmojiReaction(emoji)}
            className="px-2 py-0.5 bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md rounded-full text-xs hover:scale-125 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Say something or type @AI..."
            className="w-full bg-black/40 border border-white/20 backdrop-blur-md rounded-full pl-3 pr-8 py-1.5 text-xs text-white placeholder-gray-300 focus:outline-none focus:border-pink-500 transition-all shadow-inner"
          />
          <button
            type="button"
            onClick={() => setInputText((prev) => (prev ? `${prev} @AI ` : '@AI '))}
            title="Ask AI Stream Bot"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-purple-400 hover:text-purple-300"
          >
            <Bot className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="submit"
          className="p-2 bg-gradient-to-r from-[#ff2a85] to-[#8b5cf6] text-white rounded-full hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-pink-500/30"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
