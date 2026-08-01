import React, { useState, useEffect } from 'react';
import { Search, Send, ShieldCheck, Lock, Eye, EyeOff, User, MessageSquare, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { encryptMessage, decryptMessage } from '../lib/crypto';

export interface ChatTargetUser {
  id: string;
  name: string;
  avatar: string;
  handle: string;
}

interface MessagesViewProps {
  targetUser?: ChatTargetUser | null;
  onClearTargetUser?: () => void;
}

interface ChatConversation {
  id: string;
  user: ChatTargetUser;
  lastMsgEncrypted: string;
  time: string;
  unread: number;
  messages: Array<{
    id: string;
    senderId: string;
    encryptedContent: string;
    timestamp: string;
  }>;
}

const DEFAULT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'usr_maya',
    user: {
      id: 'usr_maya',
      name: 'Maya Lin 🎤',
      handle: 'maya_official',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    },
    lastMsgEncrypted: encryptMessage('Hey! Thanks for following my stream! 🎶'),
    time: '10:42 AM',
    unread: 1,
    messages: [
      {
        id: 'm1',
        senderId: 'usr_maya',
        encryptedContent: encryptMessage('Hey! Thanks for following my stream! 🎶'),
        timestamp: '10:42 AM',
      },
    ],
  },
  {
    id: 'usr_priya',
    user: {
      id: 'usr_priya',
      name: 'Priya Sharma 💃',
      handle: 'priya_dance',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    },
    lastMsgEncrypted: encryptMessage('Let us collaborate on the next dance stage!'),
    time: 'Yesterday',
    unread: 0,
    messages: [
      {
        id: 'm2',
        senderId: 'usr_priya',
        encryptedContent: encryptMessage('Let us collaborate on the next dance stage!'),
        timestamp: 'Yesterday',
      },
    ],
  },
  {
    id: 'usr_alex',
    user: {
      id: 'usr_alex',
      name: 'DJ Alex 🎧',
      handle: 'djalex_beats',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    },
    lastMsgEncrypted: encryptMessage('Dropped a new synth beat track today 🔥'),
    time: '2 days ago',
    unread: 0,
    messages: [
      {
        id: 'm3',
        senderId: 'usr_alex',
        encryptedContent: encryptMessage('Dropped a new synth beat track today 🔥'),
        timestamp: '2 days ago',
      },
    ],
  },
];

export const MessagesView: React.FC<MessagesViewProps> = ({
  targetUser,
  onClearTargetUser,
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>(DEFAULT_CONVERSATIONS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputMsg, setInputMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRawCiphertext, setShowRawCiphertext] = useState(false);

  // If a targetUser is provided from ProfileView "Message" button, open or create conversation
  useEffect(() => {
    if (targetUser) {
      setConversations((prev) => {
        const existing = prev.find((c) => c.user.id === targetUser.id);
        if (existing) return prev;
        const newConv: ChatConversation = {
          id: targetUser.id,
          user: targetUser,
          lastMsgEncrypted: encryptMessage(`Started encrypted chat with ${targetUser.name}`),
          time: 'Just now',
          unread: 0,
          messages: [
            {
              id: `init_${Date.now()}`,
              senderId: targetUser.id,
              encryptedContent: encryptMessage(`Hi! Direct messages here are end-to-end encrypted 🔐`),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        };
        return [newConv, ...prev];
      });
      setActiveChatId(targetUser.id);
    }
  }, [targetUser]);

  const activeConv = conversations.find((c) => c.id === activeChatId);

  // Load backend direct messages if available
  useEffect(() => {
    if (activeChatId) {
      fetch(`/api/direct-messages/${activeChatId}?currentUserId=${user.id}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((serverMsgs) => {
          if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id === activeChatId) {
                  const combined = [...c.messages];
                  serverMsgs.forEach((sm) => {
                    if (!combined.some((m) => m.id === sm.id)) {
                      combined.push({
                        id: sm.id,
                        senderId: sm.senderId,
                        encryptedContent: sm.encryptedContent,
                        timestamp: sm.timestamp,
                      });
                    }
                  });
                  return { ...c, messages: combined };
                }
                return c;
              })
            );
          }
        })
        .catch(() => {});
    }
  }, [activeChatId, user.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeChatId) return;

    const plainText = inputMsg.trim();
    // ENCRYPT plain text before sending or storing
    const encrypted = encryptMessage(plainText);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = `msg_${Date.now()}`;

    // Update local state with encrypted message payload
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMsgEncrypted: encrypted,
            time: 'Just now',
            messages: [
              ...c.messages,
              {
                id: msgId,
                senderId: user.id,
                encryptedContent: encrypted,
                timestamp: timeStr,
              },
            ],
          };
        }
        return c;
      })
    );

    setInputMsg('');

    // Persist encrypted payload to database REST API
    try {
      await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: activeChatId,
          encryptedContent: encrypted,
          senderId: user.id,
        }),
      });
    } catch (err) {
      console.warn('DB Direct Message persist failover to local state');
    }
  };

  const filteredConvs = conversations.filter(
    (c) =>
      c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24 pt-3 px-3 max-w-md mx-auto space-y-3 min-h-screen text-white bg-[#0f0826]">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          {activeChatId && (
            <button
              onClick={() => {
                setActiveChatId(null);
                onClearTargetUser?.();
              }}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-lg font-black text-white">
            {activeConv ? activeConv.user.name : 'Direct Messages'}
          </h2>
        </div>

        {/* E2EE Security Shield Badge */}
        <div className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-[10px] font-extrabold text-emerald-300">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>E2E Encrypted</span>
        </div>
      </div>

      {!activeChatId ? (
        /* CONVERSATIONS LIST VIEW */
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search followed contacts..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/50"
            />
          </div>

          {/* Conversations */}
          <div className="space-y-2">
            {filteredConvs.map((conv) => {
              const decryptedPreview = decryptMessage(conv.lastMsgEncrypted);
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveChatId(conv.id)}
                  className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center space-x-3 ${
                    activeChatId === conv.id
                      ? 'bg-purple-900/50 border-pink-500/50 shadow-md'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conv.user.avatar}
                      alt={conv.user.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-pink-500/50"
                    />
                    {conv.unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-black">
                        {conv.unread}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black text-white truncate">{conv.user.name}</span>
                      <span className="text-[10px] text-gray-400">{conv.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-300 truncate flex items-center space-x-1">
                      <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0 inline" />
                      <span className="truncate">{decryptedPreview}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ACTIVE CHAT THREAD VIEW */
        activeConv && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-3 flex flex-col h-[70vh]">
            {/* Top Chat Contact Banner */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2.5">
                <img
                  src={activeConv.user.avatar}
                  alt={activeConv.user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500"
                />
                <div>
                  <h3 className="text-xs font-black text-white">{activeConv.user.name}</h3>
                  <span className="text-[10px] text-gray-400">@{activeConv.user.handle}</span>
                </div>
              </div>

              {/* Ciphertext Debug Inspector Toggle */}
              <button
                onClick={() => setShowRawCiphertext(!showRawCiphertext)}
                className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1 border transition-all ${
                  showRawCiphertext
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
                title="Toggle encrypted database cipher payload view"
              >
                {showRawCiphertext ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showRawCiphertext ? 'Hide DB Cipher' : 'Inspect DB Cipher'}</span>
              </button>
            </div>

            {/* DB Encryption Banner Notice */}
            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-2 text-[10px] text-emerald-200 flex items-start space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300 block font-bold">End-To-End AES-256 Encrypted Chat</strong>
                Messages stored in database are encrypted into AES cipher text. Decrypted automatically for your session key.
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
              {activeConv.messages.map((m) => {
                const isMe = m.senderId === user.id;
                const decrypted = decryptMessage(m.encryptedContent);

                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-tr-none shadow-md'
                          : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/10'
                      }`}
                    >
                      {/* Main Message Content */}
                      <p className="font-medium whitespace-pre-wrap break-words">{decrypted}</p>

                      {/* Optional DB Cipher Inspector Payload Display */}
                      {showRawCiphertext && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/20 text-[9px] font-mono text-amber-300/90 break-all bg-black/40 p-1 rounded">
                          <span className="font-bold block text-[8px] text-amber-400">DATABASE ENCRYPTED PAYLOAD:</span>
                          {m.encryptedContent}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 mt-0.5 px-1">
                      <span className="text-[9px] text-gray-400">{m.timestamp}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-emerald-400 inline" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Send Message Form */}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-1 border-t border-white/10">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder={`Encrypted message to ${activeConv.user.name.split(' ')[0]}...`}
                className="flex-1 bg-black/60 border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim()}
                className="p-2.5 bg-gradient-to-r from-indigo-600 to-pink-500 text-white rounded-full hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 shadow-lg shadow-pink-500/20"
                title="Send Encrypted Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )
      )}
    </div>
  );
};
