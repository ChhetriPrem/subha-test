import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { ChatMessage, VirtualGift, RoomGuest } from '../types';
import { sfuManager, PeerMediaStream } from '../lib/sfuManager';

interface SocketContextType {
  isConnected: boolean;
  activeRoomId: string | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendChatMessage: (content: string) => void;
  sendVirtualGift: (gift: VirtualGift, count: number) => void;
  sendEmojiReaction: (emoji: string) => void;
  takeSeat: (seatNumber: number, slotType?: 'video' | 'audio') => void;
  leaveSeat: (seatNumber: number) => void;
  toggleMic: (seatNumber: number) => void;
  toggleVideo: (seatNumber: number) => void;
  kickGuest: (seatNumber: number) => void;
  hostToggleMute: (seatNumber: number) => void;
  promoteGuestToVideo: (seatNumber: number) => void;
  requestStageSlot: (slotType: 'video' | 'audio') => void;
  cancelStageRequest: () => void;
  approveStageRequest: (requestId: string) => void;
  sendDrawStroke: (stroke: any) => void;
  clearCanvas: () => void;
  endStream: () => void;
  sendDirectMessage: (recipientId: string, encryptedContent: string) => void;
  markDirectMessagesRead: (senderId: string) => void;
  incomingDirectMessage: any;
  readReceiptEvent: { readerId: string; senderId: string } | null;
  onlineUserIds: Set<string>;
  isStreamEnded: boolean;
  streamEndReason: string;
  chatMessages: ChatMessage[];
  floatingGifts: { id: string; gift: VirtualGift; count: number; senderName: string }[];
  floatingEmojis: { id: string; emoji: string }[];
  systemAnnouncements: string[];
  currentViewerCount: number;
  guestSeats: RoomGuest[];
  stageRequests: any[];
  remoteMediaStreams: Map<string, PeerMediaStream>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  const [isConnected, setIsConnected] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [floatingGifts, setFloatingGifts] = useState<{ id: string; gift: VirtualGift; count: number; senderName: string }[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string }[]>([]);
  const [systemAnnouncements, setSystemAnnouncements] = useState<string[]>([]);
  const [currentViewerCount, setCurrentViewerCount] = useState<number>(109);
  const [guestSeats, setGuestSeats] = useState<RoomGuest[]>([]);
  const [stageRequests, setStageRequests] = useState<any[]>([]);
  const [remoteMediaStreams, setRemoteMediaStreams] = useState<Map<string, PeerMediaStream>>(new Map());
  const [isStreamEnded, setIsStreamEnded] = useState(false);
  const [streamEndReason, setStreamEndReason] = useState('');
  const [incomingDirectMessage, setIncomingDirectMessage] = useState<any>(null);
  const [readReceiptEvent, setReadReceiptEvent] = useState<{ readerId: string; senderId: string } | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    sfuManager.initSocket((payload) => safeSend(payload), user.id);
    const unsubscribe = sfuManager.subscribeStreams((map) => {
      setRemoteMediaStreams(map);
    });
    return () => {
      unsubscribe();
    };
  }, [user.id]);

  useEffect(() => {
    let reconnectTimeout: any = null;
    let isComponentMounted = true;
    let retryCount = 0;

    const connectWebSocket = () => {
      try {
        const envUrl = (import.meta as any).env?.VITE_WS_URL;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = envUrl || `${protocol}//${window.location.host}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isComponentMounted) return;
          setIsConnected(true);
          retryCount = 0;
          console.log('⚡ Connected to VibeLive Realtime Server:', wsUrl);

          // Identify user on socket open for instant direct messages & online status
          ws.send(
            JSON.stringify({
              type: 'identify-user',
              user: userRef.current,
            })
          );

          // Auto re-join active room if connection restored
          if (activeRoomIdRef.current) {
            ws.send(
              JSON.stringify({
                type: 'join-room',
                roomId: activeRoomIdRef.current,
                user: userRef.current,
              })
            );
          }
        };

        ws.onmessage = (event) => {
          if (!isComponentMounted) return;
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'direct-message-received':
                setIncomingDirectMessage(data.message);
                break;

              case 'direct-messages-read-ack':
                setReadReceiptEvent({ readerId: data.readerId, senderId: data.senderId });
                break;

              case 'online-status-update':
                if (Array.isArray(data.onlineUserIds)) {
                  setOnlineUserIds(new Set(data.onlineUserIds));
                }
                break;

              case 'chat-message':
                setChatMessages((prev) => [...prev.slice(-100), data.message]);
                break;

              case 'system-message':
                setSystemAnnouncements((prev) => [...prev.slice(-10), data.content]);
                if (data.viewerCount) setCurrentViewerCount(data.viewerCount);
                break;

              case 'viewer-count-update':
                if (data.viewerCount !== undefined) setCurrentViewerCount(data.viewerCount);
                break;

              case 'send-gift': {
                const giftId = `fg_${Date.now()}_${Math.random()}`;
                setFloatingGifts((prev) => [
                  ...prev,
                  { id: giftId, gift: data.gift, count: data.count, senderName: data.sender?.name || 'Anonymous' },
                ]);
                setTimeout(() => {
                  setFloatingGifts((prev) => prev.filter((g) => g.id !== giftId));
                }, 4000);

                if (data.message) {
                  setChatMessages((prev) => [...prev.slice(-100), data.message]);
                }
                break;
              }

              case 'emoji-reaction': {
                const emojiId = `fe_${Date.now()}_${Math.random()}`;
                setFloatingEmojis((prev) => [...prev, { id: emojiId, emoji: data.emoji }]);
                setTimeout(() => {
                  setFloatingEmojis((prev) => prev.filter((e) => e.id !== emojiId));
                }, 2500);
                break;
              }

              case 'guests-update': {
                const guests = data.guests || [];
                setGuestSeats(guests);
                if (data.stageRequests) setStageRequests(data.stageRequests);
                sfuManager.syncStageGuests(guests, userRef.current.id);
                break;
              }

              case 'stream-ended':
                setIsStreamEnded(true);
                setStreamEndReason(data.reason || 'Live stream has ended.');
                break;

              case 'rtc-signal':
                sfuManager.handleRtcSignal(data);
                break;
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.onerror = (_err) => {
          // Suppress error log spam
        };

        ws.onclose = () => {
          if (!isComponentMounted) return;
          setIsConnected(false);

          // Exponential backoff up to 8 retries (max 15s delay)
          if (retryCount < 8) {
            retryCount++;
            const delay = Math.min(15000, 2000 * retryCount);
            reconnectTimeout = setTimeout(connectWebSocket, delay);
          }
        };

        socketRef.current = ws;
      } catch (err) {
        if (isComponentMounted && retryCount < 8) {
          retryCount++;
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isComponentMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user.id]);

  const safeSend = (payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(payload));
      } catch (err) {
        console.warn('Socket send suppressed:', err);
      }
    }
  };

  const joinRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    activeRoomIdRef.current = roomId;
    setChatMessages([]);
    setGuestSeats([]);
    setStageRequests([]);
    setIsStreamEnded(false);
    setStreamEndReason('');

    safeSend({
      type: 'join-room',
      roomId,
      user: userRef.current,
    });
  };

  const leaveRoom = () => {
    if (activeRoomId) {
      safeSend({
        type: 'leave-room',
        roomId: activeRoomId,
      });
    }
    sfuManager.unpublishSeatMedia();
    setActiveRoomId(null);
    activeRoomIdRef.current = null;
  };

  const sendChatMessage = (content: string) => {
    if (!activeRoomId) return;

    // Optimistic local add
    const optimisticMsg: ChatMessage = {
      id: `opt_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId: activeRoomId,
      sender: user,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev.slice(-100), optimisticMsg]);

    safeSend({
      type: 'chat-message',
      content,
      sender: user,
    });
  };

  const sendVirtualGift = (gift: VirtualGift, count: number) => {
    if (!activeRoomId) return;

    // Optimistic floating gift
    const giftId = `fg_opt_${Date.now()}_${Math.random()}`;
    setFloatingGifts((prev) => [
      ...prev,
      { id: giftId, gift, count, senderName: user.name },
    ]);
    setTimeout(() => {
      setFloatingGifts((prev) => prev.filter((g) => g.id !== giftId));
    }, 4000);

    const giftMsg: ChatMessage = {
      id: `opt_gift_${Date.now()}`,
      roomId: activeRoomId,
      sender: user,
      content: `sent ${gift.name} x${count} ${gift.icon}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGift: true,
      giftData: {
        giftId: gift.id,
        giftName: gift.name,
        giftIcon: gift.icon,
        count,
        valueCoins: gift.priceCoins
      }
    };
    setChatMessages((prev) => [...prev.slice(-100), giftMsg]);

    safeSend({
      type: 'send-gift',
      gift,
      count,
      sender: user,
    });
  };

  const sendEmojiReaction = (emoji: string) => {
    if (!activeRoomId) return;
    safeSend({
      type: 'emoji-reaction',
      emoji,
    });
  };

  const takeSeat = async (seatNumber: number, slotType: 'video' | 'audio' = 'video') => {
    if (!activeRoomId) return;
    safeSend({
      type: 'seat-action',
      action: 'take',
      seatNumber,
      slotType,
      user,
    });
    // Publish SFU / WebRTC camera and mic stream tracks
    await sfuManager.publishSeatMedia(seatNumber, slotType);
  };

  const leaveSeat = (seatNumber: number) => {
    if (!activeRoomId) return;
    safeSend({
      type: 'seat-action',
      action: 'leave',
      seatNumber,
    });
    // Stop local camera and mic track publication
    sfuManager.unpublishSeatMedia();
  };

  const toggleMic = (seatNumber: number) => {
    if (!activeRoomId) return;
    const currentGuest = guestSeats.find((g) => g.seatNumber === seatNumber && g.user.id === user.id);
    const newMicState = currentGuest ? !currentGuest.isMicOn : false;
    sfuManager.setMicEnabled(newMicState);

    safeSend({
      type: 'seat-action',
      action: 'toggle-mic',
      seatNumber,
    });
  };

  const toggleVideo = (seatNumber: number) => {
    if (!activeRoomId) return;
    const currentGuest = guestSeats.find((g) => g.seatNumber === seatNumber && g.user.id === user.id);
    const newVideoState = currentGuest ? !currentGuest.isVideoOn : false;
    sfuManager.setVideoEnabled(newVideoState);

    safeSend({
      type: 'seat-action',
      action: 'toggle-video',
      seatNumber,
    });
  };

  const kickGuest = (seatNumber: number) => {
    if (!activeRoomId) return;
    const guestToKick = guestSeats.find((g) => g.seatNumber === seatNumber);
    if (guestToKick?.user.id === user.id) {
      sfuManager.unpublishSeatMedia();
    }

    safeSend({
      type: 'seat-action',
      action: 'kick',
      seatNumber,
    });
  };

  const hostToggleMute = (seatNumber: number) => {
    if (!activeRoomId) return;
    const targetGuest = guestSeats.find((g) => g.seatNumber === seatNumber);
    if (targetGuest?.user.id === user.id) {
      sfuManager.setMicEnabled(!targetGuest.isMutedByHost);
    }

    safeSend({
      type: 'seat-action',
      action: 'host-toggle-mute',
      seatNumber,
    });
  };

  const promoteGuestToVideo = (seatNumber: number) => {
    if (!activeRoomId) return;
    safeSend({
      type: 'seat-action',
      action: 'promote-to-video',
      seatNumber,
    });
  };

  const requestStageSlot = (slotType: 'video' | 'audio') => {
    if (!activeRoomId) return;
    safeSend({
      type: 'seat-action',
      action: 'request-stage',
      slotType,
      user,
    });
  };

  const cancelStageRequest = () => {
    if (!activeRoomId) return;
    safeSend({
      type: 'seat-action',
      action: 'cancel-request',
      user,
    });
  };

  const approveStageRequest = (requestId: string) => {
    if (!activeRoomId) return;
    safeSend({
      type: 'seat-action',
      action: 'approve-request',
      requestId,
    });
  };

  const sendDrawStroke = (stroke: any) => {
    if (!activeRoomId) return;
    safeSend({
      type: 'draw-stroke',
      stroke,
    });
  };

  const clearCanvas = () => {
    if (!activeRoomId) return;
    safeSend({
      type: 'clear-canvas',
    });
  };

  const endStream = () => {
    if (!activeRoomId) return;
    safeSend({
      type: 'end-stream',
    });
    setIsStreamEnded(true);
    setStreamEndReason('Host ended the live stream.');
  };

  const sendDirectMessage = (recipientId: string, encryptedContent: string) => {
    safeSend({
      type: 'direct-message',
      recipientId,
      encryptedContent,
    });
  };

  const markDirectMessagesRead = (senderId: string) => {
    safeSend({
      type: 'mark-messages-read',
      senderId,
    });
  };

  const contextValue = React.useMemo(() => ({
    isConnected,
    activeRoomId,
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
    promoteGuestToVideo,
    requestStageSlot,
    cancelStageRequest,
    approveStageRequest,
    sendDrawStroke,
    clearCanvas,
    endStream,
    sendDirectMessage,
    markDirectMessagesRead,
    incomingDirectMessage,
    readReceiptEvent,
    onlineUserIds,
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
  }), [
    isConnected,
    activeRoomId,
    incomingDirectMessage,
    readReceiptEvent,
    onlineUserIds,
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
  ]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
