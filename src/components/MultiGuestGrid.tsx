import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RoomGuest, User } from '../types';
import { Mic, MicOff, Video, VideoOff, Plus, Volume2, ShieldAlert, UserX, VolumeX, Hand, X, Camera, Maximize2, Minimize2, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { sfuManager } from '../lib/sfuManager';

interface MultiGuestGridProps {
  guests: RoomGuest[];
  host: User;
  onTakeSeat: (seatNumber: number, slotType?: 'video' | 'audio') => void;
  onLeaveSeat: (seatNumber: number) => void;
  onToggleMic: (seatNumber: number) => void;
  onToggleVideo: (seatNumber: number) => void;
  onKickGuest?: (seatNumber: number) => void;
  onHostToggleMute?: (seatNumber: number) => void;
  onRequestSlot?: (slotType: 'video' | 'audio') => void;
  isHost?: boolean;
  isAudioRoom?: boolean;
}

const RemoteMediaStreamTile: React.FC<{
  stream: MediaStream;
  isVideoOn: boolean;
  isMicOn: boolean;
}> = ({ stream, isVideoOn }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOn]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="absolute inset-0 w-full h-full object-cover rounded-2xl z-0"
    />
  );
};

const LocalMediaStreamTile: React.FC<{
  isMicOn: boolean;
  isVideoOn: boolean;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}> = ({ isMicOn, isVideoOn, onSpeakingChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let intervalId: any = null;
    let lastSpoke = false;

    async function bindStream() {
      let mediaStream = sfuManager.getLocalMediaStream();
      const hasLiveVideo = mediaStream && mediaStream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled);

      if ((!mediaStream || (isVideoOn && !hasLiveVideo)) && (isVideoOn || isMicOn)) {
        mediaStream = await sfuManager.getLocalStream(isVideoOn, isMicOn);
      }

      if (videoRef.current && mediaStream) {
        if (videoRef.current.srcObject !== mediaStream) {
          videoRef.current.srcObject = mediaStream;
        }
        if (isVideoOn) {
          videoRef.current.play().catch(() => {});
        }
      }

      if (mediaStream && isMicOn && onSpeakingChange) {
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length > 0) {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            audioContext = new AudioCtx();
            const source = audioContext.createMediaStreamSource(mediaStream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            intervalId = setInterval(() => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              const isSpeaking = average > 18;
              if (isSpeaking !== lastSpoke) {
                lastSpoke = isSpeaking;
                onSpeakingChange(isSpeaking);
              }
            }, 150);
          } catch (e) {
            console.warn('Audio analyzer error:', e);
          }
        }
      }
    }

    bindStream();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioContext) audioContext.close();
    };
  }, [isVideoOn, isMicOn, onSpeakingChange]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`absolute inset-0 w-full h-full object-cover rounded-2xl z-0 ${isVideoOn ? 'block' : 'hidden'}`}
    />
  );
};

interface SeatTileProps {
  seatNum: number;
  guest?: RoomGuest;
  isMySeat: boolean;
  isSpeakingNow: boolean;
  remoteStream?: MediaStream;
  isHost: boolean;
  activeSlotMenu: number | null;
  handleSeatClick: (seatNum: number) => void;
  onLeaveSeat: (seatNum: number) => void;
  onToggleMic: (seatNum: number) => void;
  onToggleVideo: (seatNum: number) => void;
  onSpeakingChange: (seatNum: number, speaking: boolean) => void;
  onSpotlight: (guest: RoomGuest, isLocal: boolean, stream?: MediaStream) => void;
  setActiveSlotMenu: React.Dispatch<React.SetStateAction<number | null>>;
  onHostToggleMute?: (seatNum: number) => void;
  onKickGuest?: (seatNum: number) => void;
  isAudioRoom?: boolean;
}

const SeatTile = React.memo<SeatTileProps>(({
  seatNum,
  guest,
  isMySeat,
  isSpeakingNow,
  remoteStream,
  isHost,
  activeSlotMenu,
  handleSeatClick,
  onLeaveSeat,
  onToggleMic,
  onToggleVideo,
  onSpeakingChange,
  onSpotlight,
  setActiveSlotMenu,
  onHostToggleMute,
  onKickGuest,
  isAudioRoom = false,
}) => {
  const [showTapOverlay, setShowTapOverlay] = useState(false);

  if (!guest) {
    return (
      <button
        onClick={() => handleSeatClick(seatNum)}
        className="group relative flex flex-col items-center justify-center aspect-square rounded-2xl bg-white/[0.04] border border-dashed border-white/15 hover:border-indigo-400 hover:bg-indigo-600/10 transition-all p-1 active:scale-95"
      >
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-indigo-300 transition-all">
          <Plus className="w-3.5 h-3.5" />
        </div>
        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-0.5">#{seatNum}</span>
      </button>
    );
  }

  return (
    <div
      onClick={() => !isMySeat && setShowTapOverlay((prev) => !prev)}
      className={`relative group flex flex-col items-center justify-between aspect-square rounded-2xl border overflow-hidden transition-all duration-300 shadow-md cursor-pointer ${
        isSpeakingNow
          ? 'bg-indigo-950/90 border-pink-500 ring-2 ring-pink-500/60 shadow-pink-500/30'
          : 'bg-slate-950/90 border-white/15'
      }`}
    >
      {/* Webcam Video & Microphone Media Stream */}
      {isMySeat ? (
        <LocalMediaStreamTile
          isMicOn={guest.isMicOn && !guest.isMutedByHost}
          isVideoOn={guest.isVideoOn}
          onSpeakingChange={(speaking) => onSpeakingChange(seatNum, speaking)}
        />
      ) : remoteStream ? (
        <RemoteMediaStreamTile
          stream={remoteStream}
          isVideoOn={guest.isVideoOn}
          isMicOn={guest.isMicOn && !guest.isMutedByHost}
        />
      ) : guest.isVideoOn ? (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-indigo-950 to-slate-900 opacity-60 flex items-center justify-center">
          <Camera className="w-6 h-6 text-indigo-400/30 animate-pulse" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-indigo-950/40">
          <img src={guest.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover opacity-50 blur-xs" />
        </div>
      )}

      {/* OVERLAY: Always visible controls in compact format */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-1 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-auto">
        {/* Header: Slot #, Spotlight & Leave Stage Button */}
        <div className="w-full flex items-center justify-between">
          <span className="px-1 py-0.2 bg-black/70 rounded text-[8px] font-black text-indigo-300 border border-white/10">
            #{seatNum}
          </span>

          {isMySeat ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLeaveSeat(seatNum);
              }}
              className="p-1 bg-red-600 hover:bg-red-500 text-white rounded-full text-[8px] font-bold shadow transition-transform active:scale-95 flex items-center justify-center"
              title="Leave Stage Seat"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const localStream = sfuManager.getLocalMediaStream() || undefined;
                onSpotlight(guest, isMySeat, isMySeat ? localStream : remoteStream);
              }}
              className="p-1 bg-black/60 hover:bg-black text-white rounded-md border border-white/20 shadow"
              title="Spotlight"
            >
              <Maximize2 className="w-2.5 h-2.5 text-indigo-300" />
            </button>
          )}
        </div>

        {/* Center: Guest Avatar & Speaking indicator */}
        <div className="my-auto relative flex flex-col items-center">
          <img
            src={guest.user.avatar}
            alt={guest.user.name}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ${
              isSpeakingNow ? 'ring-pink-400 scale-105 shadow-md shadow-pink-500/50' : 'ring-indigo-500/60'
            }`}
          />
          {isSpeakingNow && (
            <span className="absolute -bottom-1 -right-1 p-0.5 bg-pink-500 text-white rounded-full shadow">
              <Volume2 className="w-2.5 h-2.5 animate-pulse" />
            </span>
          )}
        </div>

        {/* Footer: User Info & Controls */}
        <div className="w-full flex items-center justify-between bg-black/70 px-1 py-0.5 rounded-full border border-white/10">
          <span className="text-[8px] font-bold text-white truncate max-w-[42px]">
            {guest.user.name}
          </span>

          {isMySeat ? (
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMic(seatNum);
                }}
                className={`p-0.5 rounded-full text-white ${
                  guest.isMicOn && !guest.isMutedByHost ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                title={guest.isMicOn ? 'Mute' : 'Unmute'}
              >
                {guest.isMicOn && !guest.isMutedByHost ? <Mic className="w-2.5 h-2.5" /> : <MicOff className="w-2.5 h-2.5" />}
              </button>
            </div>
          ) : (
            <span className={guest.isMicOn && !guest.isMutedByHost ? 'text-emerald-400' : 'text-red-400'}>
              {guest.isMicOn && !guest.isMutedByHost ? <Mic className="w-2.5 h-2.5" /> : <MicOff className="w-2.5 h-2.5" />}
            </span>
          )}
        </div>

        {/* Host Gear Settings Icon */}
        {isHost && !isMySeat && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveSlotMenu(activeSlotMenu === seatNum ? null : seatNum);
            }}
            className="absolute top-1 right-1 z-20 p-0.5 bg-black/80 hover:bg-black text-white rounded text-[8px] border border-white/20 shadow"
            title="Host Moderation"
          >
            ⚙️
          </button>
        )}
      </div>

      {/* Host Quick Action Dropdown Modal */}
      {isHost && activeSlotMenu === seatNum && (
        <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center justify-center space-y-2 text-xs">
          <span className="font-extrabold text-white text-[10px]">Moderate {guest.user.name}</span>
          <button
            onClick={() => {
              onHostToggleMute?.(seatNum);
              setActiveSlotMenu(null);
            }}
            className="w-full py-1 bg-yellow-500/20 text-yellow-300 font-bold rounded-lg border border-yellow-500/40 hover:bg-yellow-500/30"
          >
            {guest.isMutedByHost ? 'Unmute Mic' : 'Mute Guest Mic'}
          </button>
          <button
            onClick={() => {
              onKickGuest?.(seatNum);
              setActiveSlotMenu(null);
            }}
            className="w-full py-1 bg-red-500/20 text-red-300 font-bold rounded-lg border border-red-500/40 hover:bg-red-500/30"
          >
            Kick from Stage
          </button>
          <button onClick={() => setActiveSlotMenu(null)} className="text-slate-400 text-[10px] font-bold pt-1">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
});

// 10 Transparent Audio Seats + Max 3 Video Stage Slots Architecture
export const MultiGuestGrid: React.FC<MultiGuestGridProps> = ({
  guests,
  host,
  onTakeSeat,
  onLeaveSeat,
  onToggleMic,
  onToggleVideo,
  onKickGuest,
  onHostToggleMute,
  onRequestSlot,
  isHost = false,
  isAudioRoom = false,
}) => {
  const { user } = useAuth();
  const { remoteMediaStreams, promoteGuestToVideo } = useSocket();
  const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(true);
  const [activeSlotMenu, setActiveSlotMenu] = useState<number | null>(null);
  const [localSpeakingState, setLocalSpeakingState] = useState<Record<number, boolean>>({});
  const [spotlightTarget, setSpotlightTarget] = useState<{ guest: RoomGuest; isLocal: boolean; stream?: MediaStream } | null>(null);

  // Separate Video Guests (Seats 1..3 or slotType === 'video') and Audio Guests (Seats 1..10)
  const videoGuests = guests.filter((g) => g.slotType === 'video' || (g.seatNumber <= 3 && g.isVideoOn));
  const audioSeats = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleAudioSeatClick = (seatNum: number) => {
    const existingGuest = guests.find((g) => g.seatNumber === seatNum);
    if (!existingGuest) {
      if (isHost) {
        onTakeSeat(seatNum, 'audio');
      } else {
        onRequestSlot?.('audio');
      }
    }
  };

  const handlePromoteToVideo = (guest: RoomGuest) => {
    if (!isHost) return;
    promoteGuestToVideo(guest.seatNumber);
  };

  const handleSpeakingChange = useCallback((seatNum: number, speaking: boolean) => {
    setLocalSpeakingState((prev) => ({ ...prev, [seatNum]: speaking }));
  }, []);

  const handleSpotlight = useCallback((guest: RoomGuest, isLocal: boolean, stream?: MediaStream) => {
    setSpotlightTarget({ guest, isLocal, stream });
  }, []);

  return (
    <div className="w-full space-y-3 relative">
      {/* 1. COLLAPSABLE VIDEO STAGE (MAX 3 SLOTS - 60% HEIGHT ASPECT RATIO) */}
      {!isAudioRoom && (
        <div className="bg-black/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl transition-all">
          {/* Host Collapsable Video Control Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-black border-b border-white/10">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Video Stage <span className="text-indigo-400">({videoGuests.length}/3 Slots)</span>
              </span>
            </div>

            {/* Collapsable Control Button - Only visible / controlled by Admin or Host */}
            {isHost ? (
              <button
                onClick={() => setIsVideoPanelOpen(!isVideoPanelOpen)}
                className="px-2.5 py-1 bg-indigo-600/40 hover:bg-indigo-600/70 border border-indigo-400/40 rounded-full text-[10px] font-black text-indigo-200 flex items-center space-x-1 transition-all"
                title="Admin Collapse Video Stage"
              >
                <Video className="w-3 h-3 text-indigo-300" />
                <span>{isVideoPanelOpen ? 'Collapse Video' : 'Expand Video'}</span>
                {isVideoPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            ) : (
              <span className="text-[10px] text-indigo-300 font-bold px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                Host Moderated Stage
              </span>
            )}
          </div>

          {/* Dynamic Aspect Ratio Video Container (~60% Height Ratio) */}
          {isVideoPanelOpen && (
            <div className="p-2 transition-all">
              {videoGuests.length === 0 ? (
                <div className="h-44 sm:h-52 flex flex-col items-center justify-center space-y-2 bg-gradient-to-b from-indigo-950/20 to-black/40 border border-dashed border-white/10 rounded-2xl p-4 text-center">
                  <Camera className="w-8 h-8 text-indigo-400/50" />
                  <span className="text-xs font-bold text-slate-300">No Active Video Streamers</span>
                  <p className="text-[10px] text-slate-400 max-w-xs">
                    {isHost
                      ? 'As host, join video stage or promote an audio guest to live video.'
                      : 'Request stage seat to be approved by host for video stream.'}
                  </p>
                  {isHost && (
                    <button
                      onClick={() => onTakeSeat(1, 'video')}
                      className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-pink-500 text-white rounded-full text-xs font-black shadow-lg hover:scale-105 transition-all"
                    >
                      Start Host Camera Feed
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={`grid gap-2 min-h-[220px] max-h-[340px] ${
                    videoGuests.length === 1
                      ? 'grid-cols-1 aspect-[16/9]'
                      : videoGuests.length === 2
                      ? 'grid-cols-2 aspect-[16/9]'
                      : 'grid-cols-2 sm:grid-cols-3 aspect-[16/9]'
                  }`}
                >
                  {videoGuests.slice(0, 3).map((vg) => {
                    const isMySeat = vg.user.id === user.id;
                    const remoteStream = remoteMediaStreams.get(vg.user.id)?.stream;

                    return (
                      <div
                        key={vg.seatNumber}
                        className="relative rounded-2xl overflow-hidden bg-slate-950 border border-indigo-500/40 shadow-lg group flex items-center justify-center"
                      >
                        {isMySeat ? (
                          <LocalMediaStreamTile
                            isMicOn={vg.isMicOn && !vg.isMutedByHost}
                            isVideoOn={vg.isVideoOn}
                          />
                        ) : remoteStream ? (
                          <RemoteMediaStreamTile
                            stream={remoteStream}
                            isVideoOn={vg.isVideoOn}
                            isMicOn={vg.isMicOn && !vg.isMutedByHost}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-3 text-center">
                            <img
                              src={vg.user.avatar}
                              alt={vg.user.name}
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500 shadow-lg mb-2"
                            />
                            <span className="text-xs font-black text-white">{vg.user.name}</span>
                          </div>
                        )}

                        {/* Video Controls Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 p-2 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-black/60 rounded-full text-[9px] font-black text-indigo-300 border border-white/10">
                              VIDEO #{vg.seatNumber}
                            </span>
                            <button
                              onClick={() => handleSpotlight(vg, isMySeat, remoteStream)}
                              className="p-1.5 bg-black/60 hover:bg-black text-white rounded-full border border-white/20"
                              title="Fullscreen"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-white truncate max-w-[100px]">
                              {vg.user.name}
                            </span>
                            {isMySeat && (
                              <button
                                onClick={() => onLeaveSeat(vg.seatNumber)}
                                className="p-1 bg-red-600 text-white rounded-full text-[9px] font-bold"
                              >
                                Leave Video
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. TRANSPARENT AUDIO SEATS (10 SLOTS - ACCESSIBLE VIA REQUEST TO ADMIN) */}
      <div className="bg-black/50 border border-white/10 backdrop-blur-xl rounded-3xl p-3 shadow-xl space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Audio Stage Pods <span className="text-indigo-400">(10 Seats)</span>
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400">Tap to request seat</span>
        </div>

        {/* 10 Audio Transparent Glass Pods (5 cols x 2 rows) */}
        <div className="grid grid-cols-5 gap-2">
          {audioSeats.map((seatNum) => {
            const guest = guests.find((g) => g.seatNumber === seatNum);
            const isMySeat = guest?.user.id === user.id;
            const isSpeakingNow = !!(guest?.isSpeaking || localSpeakingState[seatNum]);

            if (!guest) {
              return (
                <button
                  key={seatNum}
                  onClick={() => handleAudioSeatClick(seatNum)}
                  className="group relative flex flex-col items-center justify-center aspect-square rounded-2xl bg-white/[0.04] border border-dashed border-white/15 hover:border-indigo-400 hover:bg-indigo-600/10 transition-all p-1 active:scale-95"
                >
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-indigo-300 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-400 mt-1">#{seatNum}</span>
                </button>
              );
            }

            return (
              <div
                key={seatNum}
                className={`relative group flex flex-col items-center justify-between aspect-square rounded-2xl border p-1.5 transition-all shadow-lg ${
                  isSpeakingNow
                    ? 'bg-indigo-950/80 border-pink-500 ring-2 ring-pink-500/50 shadow-pink-500/30'
                    : 'bg-white/5 border-white/15 hover:bg-white/10'
                }`}
              >
                {/* Audio Seat Top Bar */}
                <div className="w-full flex items-center justify-between text-[8px] font-black">
                  <span className="text-indigo-300">#{seatNum}</span>
                  {isMySeat ? (
                    <button
                      onClick={() => onLeaveSeat(seatNum)}
                      className="text-red-400 hover:text-red-300"
                      title="Leave Seat"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : (
                    isHost && (
                      <button
                        onClick={() => setActiveSlotMenu(activeSlotMenu === seatNum ? null : seatNum)}
                        className="text-slate-400 hover:text-white"
                      >
                        ⚙️
                      </button>
                    )
                  )}
                </div>

                {/* Guest Avatar */}
                <div className="relative">
                  <img
                    src={guest.user.avatar}
                    alt={guest.user.name}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ${
                      isSpeakingNow ? 'ring-pink-400 scale-105' : 'ring-indigo-500/60'
                    }`}
                  />
                  {isSpeakingNow && (
                    <span className="absolute -bottom-1 -right-1 p-0.5 bg-pink-500 text-white rounded-full shadow">
                      <Volume2 className="w-2.5 h-2.5 animate-pulse" />
                    </span>
                  )}
                </div>

                {/* Guest Name & Mic State */}
                <div className="w-full flex items-center justify-between px-1 text-[8px] font-bold text-white">
                  <span className="truncate max-w-[38px]">{guest.user.name}</span>
                  {isMySeat ? (
                    <button
                      onClick={() => onToggleMic(seatNum)}
                      className={`p-0.5 rounded-full text-white ${
                        guest.isMicOn && !guest.isMutedByHost ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    >
                      {guest.isMicOn && !guest.isMutedByHost ? <Mic className="w-2.5 h-2.5" /> : <MicOff className="w-2.5 h-2.5" />}
                    </button>
                  ) : (
                    <span className={guest.isMicOn && !guest.isMutedByHost ? 'text-emerald-400' : 'text-red-400'}>
                      {guest.isMicOn && !guest.isMutedByHost ? <Mic className="w-2.5 h-2.5" /> : <MicOff className="w-2.5 h-2.5" />}
                    </span>
                  )}
                </div>

                {/* Host Moderation Menu & Video Promotion Option */}
                {isHost && activeSlotMenu === seatNum && (
                  <div className="absolute inset-0 z-30 bg-black/95 border border-indigo-500/40 rounded-2xl p-2 flex flex-col items-center justify-center space-y-1 text-[9px]">
                    <span className="font-extrabold text-white truncate max-w-full">{guest.user.name}</span>
                    <button
                      onClick={() => {
                        handlePromoteToVideo(guest);
                        setActiveSlotMenu(null);
                      }}
                      className="w-full py-1 bg-indigo-600 text-white font-bold rounded-lg border border-indigo-400/40 hover:bg-indigo-500"
                    >
                      Promote to Video
                    </button>
                    <button
                      onClick={() => {
                        onHostToggleMute?.(seatNum);
                        setActiveSlotMenu(null);
                      }}
                      className="w-full py-0.5 bg-yellow-500/20 text-yellow-300 font-bold rounded-lg"
                    >
                      {guest.isMutedByHost ? 'Unmute Mic' : 'Mute Mic'}
                    </button>
                    <button
                      onClick={() => {
                        onKickGuest?.(seatNum);
                        setActiveSlotMenu(null);
                      }}
                      className="w-full py-0.5 bg-red-500/20 text-red-300 font-bold rounded-lg"
                    >
                      Kick Seat
                    </button>
                    <button onClick={() => setActiveSlotMenu(null)} className="text-slate-400 text-[8px] pt-0.5">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
