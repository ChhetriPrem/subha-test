import React, { useState, useEffect, useRef } from 'react';
import { StreamRoom } from '../types';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { GiftAnimationOverlay } from '../components/GiftAnimationOverlay';
import { GiftDrawer } from '../components/GiftDrawer';
import { ChatOverlay } from '../components/ChatOverlay';
import { MultiGuestGrid } from '../components/MultiGuestGrid';
import { AudioSeatRail } from '../components/AudioSeatRail';
import { DrawAndGuessGame } from '../components/games/DrawAndGuessGame';
import { TriviaGame } from '../components/games/TriviaGame';
import { RockPaperScissorsGame } from '../components/games/RockPaperScissorsGame';
import { StageRequestsModal } from '../components/modals/StageRequestsModal';
import { sfuManager } from '../lib/sfuManager';
import {
  X,
  Gift,
  Share2,
  Gamepad2,
  Users,
  UserPlus,
  Check,
  Hand,
  ChevronDown,
  ChevronUp,
  Radio,
  Sparkles,
  Flame,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff
} from 'lucide-react';

interface LiveStreamViewProps {
  room: StreamRoom;
  onClose: () => void;
  onOpenWallet: () => void;
  onOpenAuth?: () => void;
}

interface ActiveVideoStreamItem {
  id: string;
  name: string;
  avatar: string;
  stream: MediaStream;
  isHost?: boolean;
}

const SingleVideoTile: React.FC<{ item: ActiveVideoStreamItem }> = ({ item }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && item.stream) {
      videoRef.current.srcObject = item.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [item.stream]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-white flex items-center space-x-1.5 border border-white/20 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="truncate max-w-[120px]">{item.name}</span>
        {item.isHost && <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full">HOST</span>}
      </div>
    </div>
  );
};

const FullBleedMultiVideoStream: React.FC<{
  videoItems: ActiveVideoStreamItem[];
  coverImage: string;
  title: string;
}> = ({ videoItems, coverImage, title }) => {
  if (videoItems.length === 0) {
    return (
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
        <img
          src={coverImage}
          alt={title}
          className="fixed inset-0 w-full h-full object-cover filter brightness-75 z-0"
        />
        <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-0" />
      </div>
    );
  }

  if (videoItems.length === 1) {
    return (
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
        <SingleVideoTile item={videoItems[0]} />
        <div className="fixed inset-0 bg-black/10 pointer-events-none z-0" />
      </div>
    );
  }

  if (videoItems.length === 2) {
    // Dual Video PK Stream / Split View Layout
    return (
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden grid grid-rows-2 sm:grid-cols-2 sm:grid-rows-1 gap-1 bg-black">
        <SingleVideoTile item={videoItems[0]} />
        <SingleVideoTile item={videoItems[1]} />
        <div className="fixed inset-0 bg-black/10 pointer-events-none z-0" />
      </div>
    );
  }

  // Multi-Video Grid
  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden grid grid-cols-2 grid-rows-2 gap-1 bg-black">
      {videoItems.slice(0, 4).map((item) => (
        <SingleVideoTile key={item.id} item={item} />
      ))}
      <div className="fixed inset-0 bg-black/10 pointer-events-none z-0" />
    </div>
  );
};

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({
  room,
  onClose,
  onOpenWallet,
  onOpenAuth,
}) => {
  const { user, isAuthenticated, followingIds, toggleFollow } = useAuth();

  const {
    joinRoom,
    leaveRoom,
    sendChatMessage,
    sendVirtualGift,
    sendEmojiReaction,
    takeSeat,
    leaveSeat,
    toggleMic,
    toggleVideo,
    kickGuest,
    hostToggleMute,
    requestStageSlot,
    approveStageRequest,
    endStream,
    isStreamEnded,
    streamEndReason,
    chatMessages,
    floatingGifts,
    floatingEmojis,
    systemAnnouncements,
    currentViewerCount,
    guestSeats,
    stageRequests,
    remoteMediaStreams,
  } = useSocket();

  const handleGuardedTakeSeat = (seatNumber: number, slotType?: 'video' | 'audio') => {
    if (!isAuthenticated) {
      onOpenAuth?.();
      return;
    }
    const finalType = room.type === 'audio' ? 'audio' : (slotType || 'video');
    takeSeat(seatNumber, finalType);
  };

  const handleGuardedSendMessage = (content: string) => {
    if (!isAuthenticated) {
      onOpenAuth?.();
      return;
    }
    sendChatMessage(content);
  };

  const handleGuardedSendGift = (gift: any, count: number) => {
    if (!isAuthenticated) {
      onOpenAuth?.();
      return;
    }
    sendVirtualGift(gift, count);
  };

  const handleGuardedRequestSlot = (slotType: 'video' | 'audio') => {
    if (!isAuthenticated) {
      onOpenAuth?.();
      return;
    }
    const finalType = room.type === 'audio' ? 'audio' : slotType;
    requestStageSlot(finalType);
  };

  const [isGiftDrawerOpen, setIsGiftDrawerOpen] = useState(false);
  const [isStageQueueModalOpen, setIsStageQueueModalOpen] = useState(false);
  const [activeGame, setActiveGame] = useState<'draw' | 'trivia' | 'rps' | null>(null);
  const [isGamePickerOpen, setIsGamePickerOpen] = useState(false);
  const [showStageGrid, setShowStageGrid] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    joinRoom(room.id);
    return () => {
      leaveRoom();
    };
  }, [room.id]);

  const isHost = room.host.id === user.id;

  // Auto-take Seat #1 for host upon entering created stream
  useEffect(() => {
    if (isHost && !guestSeats.some((g) => g.user.id === user.id)) {
      takeSeat(1, room.type === 'audio' ? 'audio' : 'video');
    }
  }, [isHost, room.id, user.id]);

  // Effect to mute all audio elements in room when deafened
  useEffect(() => {
    const audioElements = document.querySelectorAll('audio, video');
    audioElements.forEach((el) => {
      if (el instanceof HTMLMediaElement) {
        el.muted = isDeafened;
      }
    });
  }, [isDeafened]);

  const isFollowingHost = followingIds.has(room.host.id);
  const myRequestPending = stageRequests.some((sr) => sr.user.id === user.id);
  const mySeat = guestSeats.find((g) => g.user.id === user.id);

  // Monitor stage announcements for toast alerts
  useEffect(() => {
    if (systemAnnouncements.length > 0) {
      const last = systemAnnouncements[systemAnnouncements.length - 1];
      if (last && (last.includes('approved') || last.includes('Stage'))) {
        setToastMessage(last);
        const t = setTimeout(() => setToastMessage(null), 4000);
        return () => clearTimeout(t);
      }
    }
  }, [systemAnnouncements]);

  // Gather ALL active video streams across host and guests for full bleed video / dual video split view
  const activeVideoStreams = React.useMemo(() => {
    const list: ActiveVideoStreamItem[] = [];

    // Check local user stream if video is turned on
    if (mySeat?.isVideoOn) {
      const local = sfuManager.getLocalMediaStream();
      if (local && local.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled)) {
        list.push({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          stream: local,
          isHost: user.id === room.host.id,
        });
      }
    }

    // Check remote guest streams
    guestSeats.forEach((guest) => {
      if (guest.user.id !== user.id && guest.isVideoOn) {
        const remote = remoteMediaStreams.get(guest.user.id)?.stream;
        if (remote && remote.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled)) {
          list.push({
            id: guest.user.id,
            name: guest.user.name,
            avatar: guest.user.avatar,
            stream: remote,
            isHost: guest.user.id === room.host.id,
          });
        }
      }
    });

    return list;
  }, [mySeat, guestSeats, remoteMediaStreams, user.id, user.name, user.avatar, room.host.id]);

  return (
    <div className="fixed inset-0 z-50 bg-[#050507] text-white flex flex-col justify-between overflow-hidden w-screen h-screen pointer-events-none">
      {/* Background Video Stream Layer (Full Bleed Single / Dual Video Split View) */}
      <div className="fixed inset-0 z-0 bg-[#050507] w-full h-full">
        <FullBleedMultiVideoStream
          videoItems={activeVideoStreams}
          coverImage={room.coverImage}
          title={room.title}
        />
      </div>

      {/* Floating Gifts & Particle Animations */}
      <GiftAnimationOverlay floatingGifts={floatingGifts} floatingEmojis={floatingEmojis} />

      {/* Stage Approval Toast Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-black text-xs px-4 py-2 rounded-full shadow-2xl border border-emerald-300/40 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER OVERLAY */}
      <div className="relative z-20 p-2.5 sm:p-3 flex flex-col space-y-2 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-auto">
        <div className="flex items-center justify-between">
          {/* Host Info Pill */}
          <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-md p-1 pr-3 rounded-full border border-white/15 shadow-xl">
            <div className="relative">
              <img
                src={room.host.avatar}
                alt={room.host.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-pink-500"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-white truncate max-w-[100px] sm:max-w-[120px]">
                {room.host.name}
              </span>
              <span className="text-[10px] text-indigo-300 font-bold flex items-center space-x-1">
                <Users className="w-3 h-3 text-indigo-400 inline" />
                <span>{currentViewerCount.toLocaleString()} viewers</span>
              </span>
            </div>

            {/* Follow Button */}
            {!isHost && (
              <button
                onClick={() => toggleFollow(room.host.id)}
                className={`ml-1 px-2.5 py-1 rounded-full text-[10px] font-black transition-all flex items-center space-x-1 ${
                  isFollowingHost
                    ? 'bg-white/20 text-slate-300'
                    : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white shadow-md hover:scale-105 active:scale-95'
                }`}
              >
                {isFollowingHost ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Header Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Start / Stop Camera Feed Button for Admin / Host / Seated user */}
            {(isHost || mySeat) && (
              mySeat?.isVideoOn ? (
                <button
                  onClick={() => toggleVideo(mySeat.seatNumber)}
                  className="px-2.5 py-1 bg-red-600/80 hover:bg-red-600 border border-red-400 text-white rounded-full font-extrabold text-[11px] flex items-center space-x-1 shadow-md active:scale-95 transition-all"
                  title="Stop Camera Feed"
                >
                  <VideoOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Stop Camera</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!mySeat) {
                      handleGuardedTakeSeat(1, 'video');
                    } else {
                      toggleVideo(mySeat.seatNumber);
                    }
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-90 border border-pink-300 text-white rounded-full font-black text-[11px] flex items-center space-x-1.5 shadow-lg shadow-pink-500/30 animate-pulse active:scale-95 transition-all"
                  title="Start Live Camera Feed"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Start Camera Feed</span>
                </button>
              )
            )}

            {/* Transparent Audio Join Request Button for Audience */}
            {!isHost && !mySeat && (
              <button
                onClick={() => handleGuardedRequestSlot('audio')}
                className="px-3 py-1 bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md text-white rounded-full font-bold text-[11px] flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                title="Request Audio Join"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>{myRequestPending ? 'Pending...' : 'Request Audio'}</span>
              </button>
            )}

            {/* Switch Persona Button */}
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full border border-white/20 transition-all shadow-md"
                title="Switch User Persona"
              >
                <img src={user.avatar} className="w-6 h-6 rounded-full object-cover" />
              </button>
            )}

            {/* Exit Stream Button */}
            <button
              onClick={() => {
                if (isHost) {
                  endStream();
                } else {
                  onClose();
                }
              }}
              className="p-2 bg-black/60 hover:bg-red-600 text-white rounded-full border border-white/20 shadow-xl active:scale-95 transition-all"
              title={isHost ? 'End Stream' : 'Leave Room'}
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Stage Status Bar (Only for Multi-Guest Rooms) */}
        {room.mode !== 'solo' && (
          <div className="flex items-center justify-between bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs">
            <div className="flex items-center space-x-1.5 font-bold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-200">
                Stage: <strong className="text-indigo-400">{guestSeats.length}/10</strong>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowStageGrid(!showStageGrid)}
                className="px-2.5 py-0.5 bg-white/10 hover:bg-white/20 rounded-full font-bold text-slate-300 flex items-center space-x-1"
              >
                <span>{showStageGrid ? 'Hide Guests' : 'Show Guests'}</span>
                {showStageGrid ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsStageQueueModalOpen(true)}
                className={`px-3 py-0.5 rounded-full font-extrabold flex items-center space-x-1 transition-all ${
                  stageRequests.length > 0 && isHost
                    ? 'bg-yellow-500 text-black animate-pulse shadow-md'
                    : 'bg-indigo-600/80 border border-indigo-400/40 text-white hover:bg-indigo-600'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>{isHost ? `Queue (${stageRequests.length})` : 'Request'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING GUEST THUMBNAIL BUBBLES OVERLAY */}
      {room.mode !== 'solo' && showStageGrid && guestSeats.length > 0 && (
        <div className="absolute right-3 top-24 z-20 flex flex-col space-y-2 pointer-events-auto max-h-[45vh] overflow-y-auto no-scrollbar">
          {guestSeats.map((guest) => {
            const isGuestMe = guest.user.id === user.id;
            return (
              <div
                key={guest.seatNumber}
                className="relative group flex flex-col items-center justify-center"
              >
                <button
                  onClick={() => {
                    if (isHost || isGuestMe) {
                      toggleVideo(guest.seatNumber);
                    }
                  }}
                  className={`relative flex items-center justify-center p-0.5 bg-black/60 backdrop-blur-md rounded-full border transition-all hover:scale-110 active:scale-95 shadow-2xl ${
                    guest.isVideoOn ? 'border-pink-500 ring-2 ring-pink-500/50' : 'border-white/20'
                  }`}
                  title={`${guest.user.name} (Seat ${guest.seatNumber}) - Click to toggle Video`}
                >
                  <img
                    src={guest.user.avatar}
                    alt={guest.user.name}
                    className={`w-11 h-11 rounded-full object-cover border-2 ${
                      guest.isMicOn ? 'border-emerald-400 ring-2 ring-emerald-500/50' : 'border-white/30'
                    }`}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 bg-black/80 p-0.5 rounded-full border border-white/20 flex items-center space-x-0.5">
                    {guest.isVideoOn ? (
                      <Video className="w-2.5 h-2.5 text-pink-400" />
                    ) : guest.isMicOn ? (
                      <Mic className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <MicOff className="w-2.5 h-2.5 text-red-400" />
                    )}
                  </div>
                </button>

                {/* Quick Dual Video Invite Button for Host */}
                {isHost && !guest.isVideoOn && (
                  <button
                    onClick={() => toggleVideo(guest.seatNumber)}
                    className="mt-0.5 px-1.5 py-0.2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-[8px] rounded-full shadow-md border border-pink-300/40 opacity-90 hover:opacity-100 transition-all"
                    title="Enable Dual Video Stream"
                  >
                    + Video
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MIDDLE OVERLAY (For Active Mini Games) */}
      {activeGame && (
        <div className="relative z-20 px-3 my-auto pointer-events-auto max-w-sm mx-auto w-full">
          {activeGame === 'draw' && <DrawAndGuessGame />}
          {activeGame === 'trivia' && <TriviaGame />}
          {activeGame === 'rps' && <RockPaperScissorsGame />}
        </div>
      )}

      {/* BOTTOM CHAT & ROOM GAME TOOLBAR OVERLAY */}
      <div className="relative z-20 p-2.5 sm:p-3 space-y-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-auto">
        {/* Live Audience Chat Box */}
        <div className="h-36 sm:h-40">
          <ChatOverlay
            messages={chatMessages}
            pinnedMessage={room.pinnedMessage}
            onSendMessage={handleGuardedSendMessage}
            onSendEmojiReaction={sendEmojiReaction}
          />
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
          {/* Left Action Buttons (Games, Seat Manager, Mic, Camera) */}
          <div className="flex items-center space-x-1.5">
            {/* Room Games Launcher Popover */}
            <div className="relative">
              <button
                onClick={() => setIsGamePickerOpen(!isGamePickerOpen)}
                className={`p-2 rounded-full transition-all border ${
                  activeGame
                    ? 'bg-gradient-to-r from-indigo-600 to-pink-500 text-white border-pink-400 shadow-lg shadow-pink-500/20'
                    : 'bg-black/50 hover:bg-black/70 text-slate-200 border-white/15'
                }`}
                title="Stream Games"
              >
                <Gamepad2 className="w-4 h-4 text-pink-400" />
              </button>

              {/* Mini Game Selection Popover Menu */}
              {isGamePickerOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-44 bg-black/95 border border-white/20 backdrop-blur-xl rounded-2xl p-2 shadow-2xl flex flex-col space-y-1.5 z-40">
                  <div className="text-[10px] font-black text-slate-400 px-2 pt-1 pb-0.5">SELECT STREAM GAME</div>
                  <button
                    onClick={() => {
                      setActiveGame(activeGame === 'draw' ? null : 'draw');
                      setIsGamePickerOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      activeGame === 'draw' ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <span>🎨 Draw & Guess</span>
                    {activeGame === 'draw' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setActiveGame(activeGame === 'trivia' ? null : 'trivia');
                      setIsGamePickerOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      activeGame === 'trivia' ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <span>❓ Trivia Quiz</span>
                    {activeGame === 'trivia' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setActiveGame(activeGame === 'rps' ? null : 'rps');
                      setIsGamePickerOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      activeGame === 'rps' ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <span>✂️ RPS Game</span>
                    {activeGame === 'rps' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Stage Seat Queue Manager Button */}
            {room.mode !== 'solo' && (
              <button
                onClick={() => setIsStageQueueModalOpen(true)}
                className={`p-2 rounded-full border transition-all relative ${
                  stageRequests.length > 0 && isHost
                    ? 'bg-amber-500 text-black border-amber-300 animate-pulse'
                    : 'bg-black/50 hover:bg-black/70 text-slate-200 border-white/15'
                }`}
                title="Stage Seats & Queue"
              >
                <Users className="w-4 h-4 text-sky-400" />
                {stageRequests.length > 0 && isHost && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black">
                    {stageRequests.length}
                  </span>
                )}
              </button>
            )}

            {/* Mic Toggle Button */}
            <button
              onClick={() => {
                if (mySeat) {
                  toggleMic(mySeat.seatNumber);
                } else if (!isHost) {
                  setIsStageQueueModalOpen(true);
                }
              }}
              className={`p-2 rounded-full transition-all border ${
                mySeat
                  ? mySeat.isMicOn && !mySeat.isMutedByHost
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
                    : 'bg-red-500 text-white border-red-400 shadow-md shadow-red-500/30'
                  : 'bg-black/50 hover:bg-black/70 text-slate-300 border-white/15'
              }`}
              title={mySeat ? (mySeat.isMicOn ? 'Mute Mic' : 'Unmute Mic') : 'Request Stage'}
            >
              {mySeat ? (
                mySeat.isMicOn && !mySeat.isMutedByHost ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )
              ) : (
                <MicOff className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Camera Toggle Button */}
            {room.type !== 'audio' && mySeat && (
              <button
                onClick={() => toggleVideo(mySeat.seatNumber)}
                className={`p-2 rounded-full transition-all border ${
                  mySeat.isVideoOn
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 border-white/15'
                }`}
                title={mySeat.isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {mySeat.isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            )}

            {/* Share Stream Button */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: room.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Stream room link copied to clipboard!');
                }
              }}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full border border-white/15 text-slate-300 transition-all"
              title="Share Room Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Buttons (Wallet Coins & Prominent Glowing Gift Box) */}
          <div className="flex items-center space-x-2">
            {/* Wallet Coin Store Button */}
            {onOpenWallet && (
              <button
                onClick={onOpenWallet}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/50 rounded-full text-amber-300 font-black text-xs transition-all shadow-md active:scale-95"
                title="Coin Shop & Wallet"
              >
                <span className="text-amber-400">🟡</span>
                <span className="text-[10px]">Recharge</span>
              </button>
            )}

            {/* Prominent Glowing Virtual Gift Drawer Trigger */}
            <button
              onClick={() => setIsGiftDrawerOpen(true)}
              className="group relative p-2.5 bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white rounded-2xl shadow-xl shadow-pink-500/40 hover:scale-110 active:scale-95 transition-all border border-amber-300/60"
              title="Send Virtual Gift"
            >
              <Gift className="w-5 h-5 animate-bounce text-yellow-100" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Stage Requests Modal */}
      <StageRequestsModal
        isOpen={isStageQueueModalOpen}
        onClose={() => setIsStageQueueModalOpen(false)}
        requests={stageRequests}
        onApproveRequest={(reqId) => {
          approveStageRequest(reqId);
          setIsStageQueueModalOpen(false);
        }}
        isHost={isHost}
        onRequestSlot={(slotType) => {
          handleGuardedRequestSlot(slotType);
          setIsStageQueueModalOpen(false);
        }}
        myRequestPending={myRequestPending}
        isAudioRoom={room.type === 'audio'}
      />

      {/* Virtual Gift Drawer Sheet */}
      <GiftDrawer
        isOpen={isGiftDrawerOpen}
        onClose={() => setIsGiftDrawerOpen(false)}
        onSendGift={(gift, count) => {
          handleGuardedSendGift(gift, count);
          setIsGiftDrawerOpen(false);
        }}
        onOpenWallet={onOpenWallet}
      />

      {/* Stream Ended Overlay Screen */}
      {isStreamEnded && (
        <div className="fixed inset-0 z-50 bg-[#050507]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 via-purple-600 to-pink-600 p-0.5 shadow-2xl shadow-red-500/40 animate-pulse">
            <div className="w-full h-full bg-black/80 rounded-full flex items-center justify-center text-red-400">
              <Radio className="w-9 h-9" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Stream Ended</h2>
            <p className="text-xs font-semibold text-slate-300 max-w-xs">
              {streamEndReason || 'The room host has ended this live broadcast.'}
            </p>
          </div>

          {/* Stream Session Stats Card */}
          <div className="w-full max-w-xs grid grid-cols-2 gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Peak Audience</span>
              <span className="text-lg font-black text-indigo-400">{currentViewerCount.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Host Diamonds</span>
              <span className="text-lg font-black text-amber-300">💎 {room.host.diamonds.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full max-w-xs py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-pink-500/25 hover:scale-105 active:scale-95 transition-transform"
          >
            Return to Home
          </button>
        </div>
      )}
    </div>
  );
};
