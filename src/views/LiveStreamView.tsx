import React, { useState, useEffect, useRef } from 'react';
import { StreamRoom } from '../types';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { GiftAnimationOverlay } from '../components/GiftAnimationOverlay';
import { GiftDrawer } from '../components/GiftDrawer';
import { ChatOverlay } from '../components/ChatOverlay';
import { MultiGuestGrid } from '../components/MultiGuestGrid';
import { DrawAndGuessGame } from '../components/games/DrawAndGuessGame';
import { TriviaGame } from '../components/games/TriviaGame';
import { RockPaperScissorsGame } from '../components/games/RockPaperScissorsGame';
import { StageRequestsModal } from '../components/modals/StageRequestsModal';
import {
  X,
  Gift,
  Share2,
  Gamepad2,
  Users,
  Camera,
  UserPlus,
  Check,
  Hand,
  ChevronDown,
  ChevronUp,
  Radio,
  Sparkles,
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
    currentViewerCount,
    guestSeats,
    stageRequests,
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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showStageGrid, setShowStageGrid] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Toggle user camera for WebRTC / live video broadcast
  const toggleCameraFeed = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err) {
        alert('Could not access camera/microphone or permission denied.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050507] text-white flex flex-col justify-between overflow-hidden max-w-md mx-auto shadow-2xl">
      {/* Background Video Stream Layer */}
      <div className="absolute inset-0 z-0 bg-[#050507]">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={room.coverImage}
              alt={room.title}
              className="w-full h-full object-cover filter brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-[#050507]" />
          </div>
        )}
      </div>

      {/* Floating Gifts & Particle Animations */}
      <GiftAnimationOverlay floatingGifts={floatingGifts} floatingEmojis={floatingEmojis} />

      {/* TOP HEADER OVERLAY */}
      <div className="relative z-20 p-2.5 sm:p-3 flex flex-col space-y-2 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <div className="flex items-center justify-between">
          {/* Host Info Pill */}
          <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-md p-1 pr-2.5 rounded-full border border-white/10">
            <img
              src={room.host.avatar}
              alt={room.host.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500"
            />
            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold text-white truncate max-w-[85px] sm:max-w-[100px]">{room.host.name}</span>
              <span className="text-[9px] text-yellow-300 font-bold flex items-center">
                💎 {room.host.diamonds.toLocaleString()}
              </span>
            </div>

            {/* Follow Button */}
            {!isHost && (
              <button
                onClick={() => toggleFollow(room.host.id)}
                className={`ml-1 px-2 py-0.5 rounded-full text-[9px] font-black transition-all flex items-center space-x-0.5 ${
                  isFollowingHost
                    ? 'bg-white/20 text-slate-300'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md'
                }`}
              >
                {isFollowingHost ? (
                  <>
                    <Check className="w-2.5 h-2.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-2.5 h-2.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-1.5">
            {/* Live Audience Viewer Pill */}
            <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/15 text-[11px] font-black text-white">
              <Users className="w-3 h-3 text-indigo-400" />
              <span>{currentViewerCount.toLocaleString()}</span>
            </div>

            {/* Camera Feed Toggle */}
            {room.type !== 'audio' && (
              <button
                onClick={toggleCameraFeed}
                className={`p-1.5 rounded-full border transition-all ${
                  isCameraActive ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/50' : 'bg-black/60 text-slate-300 border-white/15'
                }`}
                title="Toggle Live Camera"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Switch Persona / Account Button */}
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="p-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-full border border-indigo-400/50 transition-all flex items-center"
                title="Switch User Persona"
              >
                <img src={user.avatar} className="w-5 h-5 rounded-full object-cover" />
              </button>
            )}

            {/* Prominent Leave Room Button */}
            <button
              onClick={() => {
                if (isHost) {
                  endStream();
                } else {
                  onClose();
                }
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-black border border-red-400/40 flex items-center space-x-1 shadow-lg shadow-red-600/40 active:scale-95 transition-all"
              title={isHost ? 'End Stream' : 'Leave Room'}
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isHost ? 'End' : 'Leave'}</span>
            </button>
          </div>
        </div>

        {/* Stage Status & Request Bar (Only shown for Multi-Guest Rooms) */}
        {room.mode !== 'solo' && (
          <div className="flex items-center justify-between bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px]">
            <div className="flex items-center space-x-1.5 font-bold">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-slate-200">
                Stage: <strong className="text-indigo-400">{guestSeats.length}/10</strong>
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Toggle Stage Grid View */}
              <button
                onClick={() => setShowStageGrid(!showStageGrid)}
                className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-full font-bold text-slate-300 flex items-center space-x-0.5"
              >
                <span>{showStageGrid ? 'Hide Stage' : 'Show Stage'}</span>
                {showStageGrid ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Stage Queue / Request Button */}
              <button
                onClick={() => setIsStageQueueModalOpen(true)}
                className={`px-2.5 py-0.5 rounded-full font-extrabold flex items-center space-x-1 transition-all ${
                  stageRequests.length > 0 && isHost
                    ? 'bg-yellow-500 text-black animate-pulse shadow-md'
                    : 'bg-indigo-600/80 border border-indigo-400/40 text-white hover:bg-indigo-600'
                }`}
              >
                <Hand className="w-3 h-3" />
                <span>{isHost ? `Queue (${stageRequests.length})` : 'Request'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MIDDLE SECTION (3 Video Stage Slots & 10 Transparent Audio Pods) */}
      <div className="relative z-20 px-2 sm:px-3 my-auto space-y-2 pointer-events-auto max-h-[60vh] flex-1 overflow-y-auto scrollbar-none">
        {/* Active Room Mini Game */}
        {activeGame === 'draw' && <DrawAndGuessGame />}
        {activeGame === 'trivia' && <TriviaGame />}
        {activeGame === 'rps' && <RockPaperScissorsGame />}

        {/* 10 Dedicated Stage Seats Grid (Multi-Guest Only) */}
        {room.mode !== 'solo' && showStageGrid && !activeGame && (
          <MultiGuestGrid
            guests={guestSeats}
            host={room.host}
            onTakeSeat={handleGuardedTakeSeat}
            onLeaveSeat={leaveSeat}
            onToggleMic={toggleMic}
            onToggleVideo={toggleVideo}
            onKickGuest={kickGuest}
            onHostToggleMute={hostToggleMute}
            onRequestSlot={handleGuardedRequestSlot}
            isHost={isHost}
            isAudioRoom={room.type === 'audio'}
          />
        )}
      </div>

      {/* BOTTOM CHAT & ROOM GAME TOOLBAR OVERLAY */}
      <div className="relative z-20 p-2.5 sm:p-3 space-y-2 bg-gradient-to-t from-[#050507] via-[#050507]/90 to-transparent">
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
        <div className="flex items-center justify-between pt-1">
          {/* Room Games Launcher Popover */}
          <div className="relative">
            <button
              onClick={() => setIsGamePickerOpen(!isGamePickerOpen)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                activeGame
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-500 text-white border-pink-400 shadow-lg shadow-pink-500/20'
                  : 'bg-black/60 hover:bg-black/80 text-slate-200 border-white/15'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-pink-400" />
              <span>{activeGame ? activeGame.toUpperCase() : 'Games'}</span>
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

          {/* Middle Room Audio/Mic Controls (Mute Mic, Deafen, Camera) */}
          <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/15">
            {/* Mic Control */}
            <button
              onClick={() => {
                if (mySeat) {
                  toggleMic(mySeat.seatNumber);
                } else if (!isHost) {
                  setIsStageQueueModalOpen(true);
                }
              }}
              className={`p-2 rounded-full font-bold text-xs transition-all flex items-center justify-center ${
                mySeat
                  ? mySeat.isMicOn && !mySeat.isMutedByHost
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-red-500 text-white shadow-md shadow-red-500/30'
                  : 'bg-white/10 text-slate-300 hover:text-white'
              }`}
              title={
                mySeat
                  ? mySeat.isMicOn && !mySeat.isMutedByHost
                    ? 'Mute Microphone'
                    : 'Unmute Microphone'
                  : 'Request Stage to Speak'
              }
            >
              {mySeat ? (
                mySeat.isMicOn && !mySeat.isMutedByHost ? (
                  <Mic className="w-3.5 h-3.5" />
                ) : (
                  <MicOff className="w-3.5 h-3.5" />
                )
              ) : (
                <MicOff className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Deafen / Audio Output Toggle */}
            <button
              onClick={() => setIsDeafened(!isDeafened)}
              className={`p-2 rounded-full font-bold text-xs transition-all flex items-center justify-center ${
                isDeafened
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
              title={isDeafened ? 'Unmute Room Speakers (Deafen OFF)' : 'Deafen Room Audio (Deafen ON)'}
            >
              {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Camera Toggle (If Video Room and sitting in stage seat) */}
            {room.type !== 'audio' && mySeat && (
              <button
                onClick={() => toggleVideo(mySeat.seatNumber)}
                className={`p-2 rounded-full font-bold text-xs transition-all flex items-center justify-center ${
                  mySeat.isVideoOn
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
                title={mySeat.isVideoOn ? 'Camera Off' : 'Camera On'}
              >
                {mySeat.isVideoOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Right Action Icons (Gift & Share) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: room.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Stream room link copied to clipboard!');
                }
              }}
              className="p-2.5 bg-black/60 hover:bg-black/80 rounded-full border border-white/15 text-slate-200 transition-all"
              title="Share Room"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Gift Drawer Trigger Button */}
            <button
              onClick={() => setIsGiftDrawerOpen(true)}
              className="relative p-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-full shadow-lg shadow-pink-500/30 hover:scale-110 active:scale-95 transition-transform"
              title="Send Virtual Gift"
            >
              <Gift className="w-5 h-5 animate-bounce" />
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
