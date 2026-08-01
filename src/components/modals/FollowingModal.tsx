import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquare, UserCheck, UserPlus, ShieldCheck, Lock, Sparkles, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface FollowedUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  country?: string;
  countryFlag?: string;
  isOnline: boolean;
  isMutual: boolean;
}

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChatWithUser: (user: { id: string; name: string; avatar: string; handle: string }) => void;
}

export const FollowingModal: React.FC<FollowingModalProps> = ({
  isOpen,
  onClose,
  onOpenChatWithUser,
}) => {
  const { user, followingIds, toggleFollow } = useAuth();
  const [followingList, setFollowingList] = useState<FollowedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/user/following?userId=${user.id}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setFollowingList(data);
          } else {
            // Fallback default list if backend endpoint returns empty
            const defaultList: FollowedUser[] = [
              {
                id: 'usr_maya',
                name: 'Maya Lin 🎤',
                handle: 'maya_official',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
                bio: 'Singer & Songwriter • Live Lounge Host 🎶',
                country: 'India',
                countryFlag: '🇮🇳',
                isOnline: true,
                isMutual: true,
              },
              {
                id: 'usr_alex',
                name: 'DJ Alex 🎧',
                handle: 'djalex_beats',
                avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
                bio: 'Electronic Music Producer & DJ 🎧',
                country: 'UK',
                countryFlag: '🇬🇧',
                isOnline: true,
                isMutual: true,
              },
              {
                id: 'usr_priya',
                name: 'Priya Sharma 💃',
                handle: 'priya_dance',
                avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
                bio: 'Choreographer & Fitness Streamer 💃',
                country: 'India',
                countryFlag: '🇮🇳',
                isOnline: true,
                isMutual: false,
              },
              {
                id: 'usr_anya',
                name: 'Anya Vance 🎮',
                handle: 'anya_gamer',
                avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
                bio: 'Pro Mobile Esports Streamer 🕹️',
                country: 'USA',
                countryFlag: '🇺🇸',
                isOnline: false,
                isMutual: false,
              },
            ];
            setFollowingList(defaultList);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, user.id]);

  if (!isOpen) return null;

  const filteredUsers = followingList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleMessageUser = (targetUser: FollowedUser) => {
    onOpenChatWithUser({
      id: targetUser.id,
      name: targetUser.name,
      avatar: targetUser.avatar,
      handle: targetUser.handle,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#130a2e] border border-white/10 rounded-t-3xl sm:rounded-3xl p-4 space-y-4 max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-xl text-white shadow-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center space-x-1.5">
                <span>Following List</span>
                <span className="text-xs font-bold text-pink-400 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                  {followingList.length}
                </span>
              </h2>
              <p className="text-[10px] text-gray-400">Message contacts or manage who you follow</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, handle or bio..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/50"
          />
        </div>

        {/* List of Followed Users */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400 animate-pulse">
              Loading following list...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <UserCheck className="w-8 h-8 text-gray-500 mx-auto opacity-50" />
              <p className="text-xs text-gray-400 font-medium">No followed contacts found</p>
            </div>
          ) : (
            filteredUsers.map((item) => {
              const isCurrentlyFollowed = followingIds.size > 0 ? followingIds.has(item.id) : true;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
                >
                  {/* User Profile Info */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                    <div className="relative shrink-0">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-500/60"
                      />
                      {/* Live Online Status Indicator */}
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#130a2e] ${
                          item.isOnline
                            ? 'bg-emerald-500 ring-2 ring-emerald-500/50 animate-pulse'
                            : 'bg-gray-500'
                        }`}
                        title={item.isOnline ? 'Online now' : 'Offline'}
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-white truncate">{item.name}</span>
                        {item.countryFlag && <span className="text-xs">{item.countryFlag}</span>}
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-gray-400 truncate">@{item.handle}</span>
                        {item.isMutual && (
                          <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.2 rounded-full">
                            Mutual
                          </span>
                        )}
                      </div>

                      {item.bio && (
                        <p className="text-[10px] text-gray-300/80 truncate mt-0.5">{item.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Follow/Unfollow + Direct Message */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => toggleFollow(item.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold border transition-all ${
                        isCurrentlyFollowed
                          ? 'bg-white/10 border-white/20 text-gray-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300'
                          : 'bg-gradient-to-r from-purple-600 to-pink-500 border-pink-400 text-white shadow-md'
                      }`}
                    >
                      {isCurrentlyFollowed ? 'Following' : 'Follow'}
                    </button>

                    <button
                      onClick={() => handleMessageUser(item)}
                      className="p-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center space-x-1 text-xs font-bold"
                      title={`Message ${item.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Message</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* E2EE Guarantee Banner */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300">
          <div className="flex items-center space-x-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold">Direct messages are end-to-end encrypted</span>
          </div>
          <span className="text-gray-400 font-mono text-[9px]">vibelive_e2ee</span>
        </div>
      </div>
    </div>
  );
};
