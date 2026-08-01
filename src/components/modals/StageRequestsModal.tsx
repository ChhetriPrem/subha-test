import React from 'react';
import { X, Check, Hand, ShieldAlert, Video, Mic, UserCheck } from 'lucide-react';

interface StageRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: any[];
  onApproveRequest: (requestId: string) => void;
  isHost: boolean;
  onRequestSlot: (type: 'video' | 'audio') => void;
  myRequestPending: boolean;
  isAudioRoom?: boolean;
}

export const StageRequestsModal: React.FC<StageRequestsModalProps> = ({
  isOpen,
  onClose,
  requests,
  onApproveRequest,
  isHost,
  onRequestSlot,
  myRequestPending,
  isAudioRoom = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200 pointer-events-auto">
      <div className="w-full max-w-md bg-[#08080c] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Hand className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide">
                {isHost ? 'Stage Request Queue (10 Slots Max)' : 'Join Video/Audio Stage'}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {isHost
                  ? `${requests.length} viewers waiting for a video/audio slot`
                  : 'Host approves limited slots for video & voice chat'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewer Request Button (for non-host) */}
        {!isHost && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-3">
            <p className="text-xs text-slate-300 font-medium">
              {isAudioRoom
                ? 'Want to speak on stage? Send a voice slot request to the host!'
                : 'Want to speak or turn on video on stage? Send a slot request to the host!'}
            </p>
            {myRequestPending ? (
              <div className="py-2.5 px-4 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 animate-pulse">
                <Hand className="w-4 h-4" />
                <span>Request Pending Host Approval...</span>
              </div>
            ) : (
              <div className={isAudioRoom ? 'flex justify-center' : 'grid grid-cols-2 gap-2'}>
                {!isAudioRoom && (
                  <button
                    onClick={() => onRequestSlot('video')}
                    className="py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-1.5"
                  >
                    <Video className="w-4 h-4 text-indigo-200" />
                    <span>Request Video Slot</span>
                  </button>
                )}
                <button
                  onClick={() => onRequestSlot('audio')}
                  className={`py-2.5 px-3 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 ${
                    isAudioRoom
                      ? 'w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-white/10 hover:bg-white/15 border border-white/20'
                  }`}
                >
                  <Mic className="w-4 h-4 text-emerald-300" />
                  <span>Request Voice Slot</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pending Requests List for Host */}
        {isHost && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {requests.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                <p className="font-bold">No pending stage requests right now.</p>
                <p className="text-[10px] text-slate-500">Viewers can raise hand to ask for a stage slot.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={req.user.avatar}
                      alt={req.user.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/50"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center space-x-1">
                        <span>{req.user.name}</span>
                        <span className="text-[10px] text-indigo-400 font-normal">
                          ({req.type === 'video' ? '📹 Video' : '🎙️ Audio'})
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400">Level {req.user.level} • {req.requestedAt}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onApproveRequest(req.id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Slot</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
