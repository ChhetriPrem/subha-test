import React, { useState } from 'react';
import { RoomGuest, User } from '../types';
import { Mic, MicOff, Hand, ChevronLeft, ChevronRight, X, Volume2, UserCheck, Sparkles } from 'lucide-react';

interface AudioSeatRailProps {
  guests: RoomGuest[];
  host: User;
  currentUser: User;
  isHost: boolean;
  mySeat?: RoomGuest;
  myRequestPending: boolean;
  onRequestSlot: (slotType: 'audio') => void;
  onTakeSeat: (seatNumber: number, slotType?: 'video' | 'audio') => void;
  onLeaveSeat: (seatNumber: number) => void;
  onToggleMic: (seatNumber: number) => void;
  onHostToggleMute?: (seatNumber: number) => void;
  isAudioRoom?: boolean;
}

export const AudioSeatRail: React.FC<AudioSeatRailProps> = ({
  guests,
  host,
  currentUser,
  isHost,
  mySeat,
  myRequestPending,
  onRequestSlot,
  onTakeSeat,
  onLeaveSeat,
  onToggleMic,
  onHostToggleMute,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter audio occupants (or guests with audio enabled/active)
  const audioOccupants = guests.filter((g) => g.slotType === 'audio' || !g.isVideoOn);

  const handleJoinClick = () => {
    if (mySeat) {
      setIsExpanded(!isExpanded);
      return;
    }
    if (myRequestPending) return;

    if (isHost) {
      onTakeSeat(1, 'audio');
    } else {
      onRequestSlot('audio');
    }
  };

  return (
    <div className="fixed right-2 top-[38%] -translate-y-1/2 z-30 flex flex-col items-end space-y-2 pointer-events-auto">
      {/* Primary Docked Action Button / Toggle Pill */}
      <button
        onClick={handleJoinClick}
        className={`group relative flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-black transition-all shadow-xl backdrop-blur-md border ${
          mySeat
            ? 'bg-gradient-to-r from-emerald-600/80 to-teal-600/80 border-emerald-400/40 text-white shadow-emerald-500/20'
            : myRequestPending
            ? 'bg-amber-500/80 border-amber-400/50 text-black animate-pulse'
            : 'bg-black/40 hover:bg-black/60 border-white/15 text-white'
        }`}
      >
        {mySeat ? (
          <>
            <div className="relative">
              <Mic className="w-4 h-4 text-emerald-300" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <span className="text-[11px] font-extrabold">{isExpanded ? 'Hide Stage' : `Audio Stage (${audioOccupants.length})`}</span>
            {isExpanded ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </>
        ) : myRequestPending ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px]">Requested…</span>
          </>
        ) : (
          <>
            <Hand className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] bg-gradient-to-r from-indigo-300 to-pink-300 bg-clip-text text-transparent font-black">
              {isHost ? 'Join Stage' : 'Join Audio'}
            </span>
          </>
        )}
      </button>

      {/* Expanded Audio Roster Panel */}
      {isExpanded && mySeat && (
        <div className="w-56 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 shadow-2xl space-y-2 max-h-[55vh] overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-right-3 duration-200">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <div className="flex items-center space-x-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-black text-white uppercase tracking-wider">Audio Roster</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
              {audioOccupants.length} Live
            </span>
          </div>

          <div className="space-y-1.5">
            {audioOccupants.length === 0 ? (
              <p className="text-[10px] text-gray-400 text-center py-2">No active audio speakers</p>
            ) : (
              audioOccupants.map((occ) => {
                const isMe = occ.user.id === currentUser.id;
                const isOccHost = occ.user.id === host.id;

                return (
                  <div
                    key={occ.seatNumber}
                    className={`flex items-center justify-between p-1.5 rounded-xl border transition-all ${
                      isMe
                        ? 'bg-emerald-950/40 border-emerald-500/40'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate pr-1">
                      <div className="relative">
                        <img
                          src={occ.user.avatar}
                          alt={occ.user.name}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                            occ.isMicOn && !occ.isMutedByHost ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                      </div>

                      <div className="flex flex-col truncate">
                        <span className="text-[10px] font-bold text-white truncate flex items-center space-x-1">
                          <span>{occ.user.name}</span>
                          {isOccHost && (
                            <span className="text-[8px] px-1 bg-amber-500/30 text-amber-300 rounded font-black">
                              HOST
                            </span>
                          )}
                          {isMe && (
                            <span className="text-[8px] px-1 bg-indigo-500/30 text-indigo-300 rounded font-black">
                              YOU
                            </span>
                          )}
                        </span>
                        <span className="text-[8px] text-gray-400 font-medium">Seat #{occ.seatNumber}</span>
                      </div>
                    </div>

                    {/* Mic Controls */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {isMe ? (
                        <>
                          <button
                            onClick={() => onToggleMic(occ.seatNumber)}
                            className={`p-1 rounded-full text-white ${
                              occ.isMicOn && !occ.isMutedByHost ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                            title={occ.isMicOn ? 'Mute' : 'Unmute'}
                          >
                            {occ.isMicOn && !occ.isMutedByHost ? (
                              <Mic className="w-2.5 h-2.5" />
                            ) : (
                              <MicOff className="w-2.5 h-2.5" />
                            )}
                          </button>

                          <button
                            onClick={() => onLeaveSeat(occ.seatNumber)}
                            className="p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full text-[8px] font-bold"
                            title="Leave Stage"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </>
                      ) : (
                        isHost && (
                          <button
                            onClick={() => onHostToggleMute?.(occ.seatNumber)}
                            className="p-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-full text-[8px]"
                            title={occ.isMutedByHost ? 'Unmute Guest' : 'Mute Guest'}
                          >
                            {occ.isMutedByHost ? (
                              <MicOff className="w-2.5 h-2.5 text-red-400" />
                            ) : (
                              <Mic className="w-2.5 h-2.5 text-emerald-400" />
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
