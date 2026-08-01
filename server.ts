import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { VIRTUAL_GIFTS } from './src/data/gifts';
import { StreamRoom, User, ChatMessage, VirtualGift, RoomGuest } from './src/types';
import { encryptMessage } from './src/lib/crypto';

// Supabase Admin / Service Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdmin = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const DEFAULT_USER: User = {
  id: 'usr_maya',
  name: 'Maya Lin',
  handle: 'maya_official',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  country: 'India',
  countryFlag: '🇮🇳',
  level: 10,
  vipLevel: 1,
  svip: false,
  isVerified: true,
  bio: 'Live Streamer & Musician 🎵',
  followers: 120,
  following: 45,
  friends: 30,
  visitors: 500,
  coins: 10000,
  diamonds: 500,
};

const INITIAL_STREAMS: StreamRoom[] = [
  {
    id: 'room_live_1',
    title: '🎵 Bollywood & Pop Live Singing Lounge! 🎤',
    type: 'video',
    mode: 'multi',
    category: 'Music',
    country: 'India',
    countryFlag: '🇮🇳',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    viewerCount: 1420,
    likeCount: 8900,
    tags: ['Singing', 'Bollywood', 'Live'],
    isHot: true,
    isRecommended: true,
    durationSeconds: 0,
    pinnedMessage: 'Welcome to the Live Lounge! Drop song requests in chat! 🎶',
    host: DEFAULT_USER,
    guests: [],
  },
];

const app = express();
app.use(express.json());

const PORT = 3000;
const server = http.createServer(app);

// Initialize Gemini API client lazily / safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.warn('Failed to initialize Gemini AI client:', err);
      }
    }
  }
  return aiClient;
}

// Sample User Directory for Messaging & Following
const ALL_SAMPLE_USERS: Record<string, User> = {
  usr_maya: {
    id: 'usr_maya',
    name: 'Maya Lin 🎤',
    handle: 'maya_official',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    country: 'India',
    countryFlag: '🇮🇳',
    level: 12,
    vipLevel: 2,
    svip: true,
    isVerified: true,
    bio: 'Singer & Songwriter • Live Lounge Host 🎶',
    followers: 1250,
    following: 45,
    friends: 30,
    visitors: 820,
    coins: 10000,
    diamonds: 500,
  },
  usr_alex: {
    id: 'usr_alex',
    name: 'DJ Alex 🎧',
    handle: 'djalex_beats',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    country: 'UK',
    countryFlag: '🇬🇧',
    level: 15,
    vipLevel: 3,
    svip: true,
    isVerified: true,
    bio: 'Electronic Music Producer & Night DJ 🎧',
    followers: 3400,
    following: 88,
    friends: 70,
    visitors: 1900,
    coins: 18000,
    diamonds: 1200,
  },
  usr_priya: {
    id: 'usr_priya',
    name: 'Priya Sharma 💃',
    handle: 'priya_dance',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    country: 'India',
    countryFlag: '🇮🇳',
    level: 8,
    vipLevel: 1,
    svip: false,
    isVerified: true,
    bio: 'Choreographer & Fitness Streamer 💃',
    followers: 890,
    following: 110,
    friends: 50,
    visitors: 450,
    coins: 4200,
    diamonds: 210,
  },
  usr_anya: {
    id: 'usr_anya',
    name: 'Anya Vance 🎮',
    handle: 'anya_gamer',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
    country: 'USA',
    countryFlag: '🇺🇸',
    level: 9,
    vipLevel: 1,
    svip: false,
    isVerified: true,
    bio: 'Pro Mobile Esports Streamer 🕹️',
    followers: 2100,
    following: 200,
    friends: 45,
    visitors: 980,
    coins: 6000,
    diamonds: 300,
  },
  usr_rohan: {
    id: 'usr_rohan',
    name: 'Rohan Verma 🎸',
    handle: 'rohan_guitars',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    country: 'India',
    countryFlag: '🇮🇳',
    level: 5,
    vipLevel: 0,
    svip: false,
    isVerified: false,
    bio: 'Acoustic Cover Singer & Jammer 🎸',
    followers: 430,
    following: 150,
    friends: 20,
    visitors: 210,
    coins: 2000,
    diamonds: 50,
  },
};

// Follow relationships: { followerId, followingId }
let followsStore: Array<{ followerId: string; followingId: string }> = [
  { followerId: 'usr_maya', followingId: DEFAULT_USER.id }, // Maya follows currentUser -> MUTUAL
  { followerId: 'usr_alex', followingId: DEFAULT_USER.id }, // Alex follows currentUser -> MUTUAL
  { followerId: DEFAULT_USER.id, followingId: 'usr_maya' },
  { followerId: DEFAULT_USER.id, followingId: 'usr_alex' },
  { followerId: DEFAULT_USER.id, followingId: 'usr_priya' }, // Single-way follow
  { followerId: DEFAULT_USER.id, followingId: 'usr_anya' },  // Single-way follow
  { followerId: 'usr_rohan', followingId: DEFAULT_USER.id }, // Sent message request to currentUser
];

// Pre-seeded encrypted direct messages
let directMessagesStore: Array<{
  id: string;
  senderId: string;
  recipientId: string;
  encryptedContent: string;
  timestamp: string;
}> = [
  {
    id: 'dm_1',
    senderId: 'usr_maya',
    recipientId: DEFAULT_USER.id,
    encryptedContent: encryptMessage('Hey! Thanks for following my stream! 🎤'),
    timestamp: '10:42 AM',
  },
  {
    id: 'dm_2',
    senderId: 'usr_alex',
    recipientId: DEFAULT_USER.id,
    encryptedContent: encryptMessage('Dropped a new synth beat track today 🔥'),
    timestamp: 'Yesterday',
  },
  {
    id: 'dm_3',
    senderId: 'usr_priya',
    recipientId: DEFAULT_USER.id,
    encryptedContent: encryptMessage('Let us collaborate on the next dance stage!'),
    timestamp: '2 days ago',
  },
  {
    id: 'dm_4',
    senderId: 'usr_rohan',
    recipientId: DEFAULT_USER.id,
    encryptedContent: encryptMessage('Hey! Would love to play acoustic guitar on your room stream! 🎸'),
    timestamp: '3 days ago',
  },
];

// Helper to check mutual follow status
function checkIsMutualFollow(userA: string, userB: string): boolean {
  const aFollowsB = followsStore.some((f) => f.followerId === userA && f.followingId === userB);
  const bFollowsA = followsStore.some((f) => f.followerId === userB && f.followingId === userA);
  return aFollowsB && bFollowsA;
}

// Helper to check live online status
function checkIsUserOnline(userId: string): boolean {
  if (['usr_maya', 'usr_alex', 'usr_priya'].includes(userId)) return true;
  for (const client of activeClients) {
    if (client.userId === userId) return true;
  }
  return false;
}

// In-Memory & Disk Persisted Data Store for Server State
const DATA_FILE = path.join(process.cwd(), 'data_store.json');

let roomsStore: StreamRoom[] = [...INITIAL_STREAMS];
let currentUserStore: User = { ...DEFAULT_USER };
let reelsStore: any[] = [];
let notificationsStore: any[] = [];

function loadPersistedData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.directMessagesStore)) directMessagesStore = data.directMessagesStore;
      if (Array.isArray(data.followsStore)) followsStore = data.followsStore;
      if (data.currentUserStore && data.currentUserStore.id) currentUserStore = data.currentUserStore;
      if (data.ALL_SAMPLE_USERS) Object.assign(ALL_SAMPLE_USERS, data.ALL_SAMPLE_USERS);
      console.log('✅ Local disk persistent data loaded successfully.');
    }
  } catch (err) {
    console.warn('Could not load data_store.json:', err);
  }
}

function savePersistedData() {
  try {
    const payload = {
      directMessagesStore,
      followsStore,
      currentUserStore,
      ALL_SAMPLE_USERS,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save data_store.json:', err);
  }
}

// Initialize persisted store
loadPersistedData();

// Active WebSocket Room connections
interface ClientConnection {
  ws: WebSocket;
  userId: string;
  userName: string;
  roomId?: string;
}

const activeClients = new Set<ClientConnection>();
const roomClients = new Map<string, Set<ClientConnection>>();

// Setup WebSocket Server
const wss = new WebSocketServer({ server });

function broadcastToRoom(roomId: string, messageObj: any, excludeWs?: WebSocket) {
  const clients = roomClients.get(roomId);
  if (!clients) return;
  const jsonString = JSON.stringify(messageObj);
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN && client.ws !== excludeWs) {
      client.ws.send(jsonString);
    }
  }
}

function closeRoomStream(roomId: string, reason: string) {
  const room = roomsStore.find((r) => r.id === roomId);
  if (!room) return;

  broadcastToRoom(roomId, {
    type: 'stream-ended',
    reason,
    roomId,
  });

  roomsStore = roomsStore.filter((r) => r.id !== roomId);
  roomClients.delete(roomId);
}

function broadcastOnlineUsers() {
  const onlineSet = new Set<string>();
  for (const client of activeClients) {
    if (client.userId) onlineSet.add(client.userId);
  }
  const payload = JSON.stringify({
    type: 'online-status-update',
    onlineUserIds: Array.from(onlineSet),
  });
  for (const client of activeClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  const conn: ClientConnection = {
    ws,
    userId: `user_${Math.random().toString(36).substring(2, 9)}`,
    userName: 'Anonymous'
  };
  activeClients.add(conn);

  ws.on('message', async (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      switch (data.type) {
        case 'identify-user': {
          if (data.user?.id) conn.userId = data.user.id;
          if (data.user?.name) conn.userName = data.user.name;
          broadcastOnlineUsers();
          break;
        }

        case 'direct-message': {
          const recipientId = data.recipientId;
          const encryptedContent = data.encryptedContent;
          const senderId = conn.userId;
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const msgId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

          const messagePayload = {
            id: msgId,
            senderId,
            recipientId,
            encryptedContent,
            isRead: false,
            timestamp,
          };

          // In-memory & disk store
          directMessagesStore.push({
            id: msgId,
            senderId,
            recipientId,
            encryptedContent,
            timestamp,
          });
          savePersistedData();

          // Supabase persistence
          if (supabaseAdmin) {
            (async () => {
              try {
                await supabaseAdmin.from('direct_messages').insert({
                  id: msgId,
                  sender_id: senderId,
                  recipient_id: recipientId,
                  encrypted_content: encryptedContent,
                  is_read: false,
                });
              } catch (e) {}
            })();
          }

          // Instant 0ms WebSocket delivery to recipient AND sender
          for (const client of activeClients) {
            if ((client.userId === recipientId || client.userId === senderId) && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'direct-message-received',
                message: messagePayload,
              }));
            }
          }
          break;
        }

        case 'mark-messages-read': {
          const senderId = data.senderId;
          const readerId = conn.userId;

          directMessagesStore.forEach((m) => {
            if (m.senderId === senderId && m.recipientId === readerId) {
              (m as any).isRead = true;
            }
          });

          if (supabaseAdmin) {
            (async () => {
              try {
                await supabaseAdmin.from('direct_messages')
                  .update({ is_read: true, read_at: new Date().toISOString() })
                  .match({ sender_id: senderId, recipient_id: readerId });
              } catch (e) {}
            })();
          }

          for (const client of activeClients) {
            if (client.userId === senderId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'direct-messages-read-ack',
                readerId,
                senderId,
              }));
            }
          }
          break;
        }

        case 'authenticate-token': {
          if (supabaseAdmin && data.token) {
            try {
              const { data: userData, error } = await supabaseAdmin.auth.getUser(data.token);
              if (userData?.user && !error) {
                conn.userId = userData.user.id;
                // Fetch profile
                const { data: prof } = await supabaseAdmin.from('profiles').select('*').eq('id', userData.user.id).single();
                if (prof) {
                  conn.userName = prof.name || prof.handle;
                }
                ws.send(JSON.stringify({ type: 'authenticated-user', userId: conn.userId, userName: conn.userName }));
              }
            } catch (err) {
              console.warn('WS auth token verification failed:', err);
            }
          }
          break;
        }

        case 'join-room': {
          if (conn.roomId && roomClients.has(conn.roomId)) {
            roomClients.get(conn.roomId)?.delete(conn);
          }

          conn.roomId = data.roomId;
          if (data.user?.id) conn.userId = data.user.id;
          if (data.user?.name) conn.userName = data.user.name;

          if (!roomClients.has(data.roomId)) {
            roomClients.set(data.roomId, new Set());
          }
          roomClients.get(data.roomId)!.add(conn);

          // Find room and increment viewer count
          const room = roomsStore.find((r) => r.id === data.roomId);
          if (room) {
            room.viewerCount += 1;
            // Broadcast system message
            broadcastToRoom(data.roomId, {
              type: 'system-message',
              content: `✨ ${conn.userName} entered the room!`,
              viewerCount: room.viewerCount,
            });

            // Send current stage guests and stage requests immediately to newly joined viewer
            ws.send(JSON.stringify({
              type: 'guests-update',
              guests: room.guests || [],
              stageRequests: room.stageRequests || []
            }));
          }
          break;
        }

        case 'end-stream': {
          if (conn.roomId) {
            closeRoomStream(conn.roomId, 'Host has ended the live stream.');
            conn.roomId = undefined;
          }
          break;
        }

        case 'leave-room': {
          if (conn.roomId) {
            const targetRoomId = conn.roomId;
            if (roomClients.has(targetRoomId)) {
              roomClients.get(targetRoomId)?.delete(conn);
            }
            const room = roomsStore.find((r) => r.id === targetRoomId);

            if (room) {
              const isHost = room.host.id === conn.userId;
              const remainingCount = roomClients.get(targetRoomId)?.size || 0;

              if (isHost || remainingCount === 0) {
                closeRoomStream(targetRoomId, isHost ? 'Host ended the live stream.' : 'Stream closed (0 members left).');
              } else {
                if (room.viewerCount > 0) room.viewerCount -= 1;
                room.guests = (room.guests || []).filter((g) => g.user.id !== conn.userId);
                broadcastToRoom(targetRoomId, {
                  type: 'viewer-count-update',
                  viewerCount: room.viewerCount,
                });
                broadcastToRoom(targetRoomId, {
                  type: 'guests-update',
                  guests: room.guests,
                  stageRequests: room.stageRequests || []
                });
              }
            }
            conn.roomId = undefined;
          }
          break;
        }

        case 'chat-message': {
          if (!conn.roomId) break;
          const msg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            roomId: conn.roomId,
            sender: data.sender || {
              id: conn.userId,
              name: conn.userName,
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              level: 10,
              vipLevel: 1,
              svip: false,
              country: 'India',
              countryFlag: '🇮🇳',
              followers: 100,
              following: 50,
              friends: 20,
              visitors: 100,
              coins: 500,
              diamonds: 1000,
              bio: 'User',
              handle: conn.userName.toLowerCase(),
              isVerified: false
            },
            content: data.content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          broadcastToRoom(conn.roomId, {
            type: 'chat-message',
            message: msg
          });

          // Persist chat message to Supabase database in background
          if (supabaseAdmin) {
            (async () => {
              try {
                const { error } = await supabaseAdmin.from('messages').insert({
                  stream_id: conn.roomId,
                  sender_id: conn.userId,
                  content: data.content,
                  is_gift: false
                });
                if (error) console.warn('Supabase message persist note:', error.message);
              } catch (err) {
                // Ignore transient db errors
              }
            })();
          }

          // Check for AI Assistant prompt command (e.g. "@AI", "!ai")
          if (data.content.startsWith('@AI') || data.content.startsWith('!ai')) {
            const prompt = data.content.replace(/^(@AI|!ai)\s*/i, '');
            const gemini = getGeminiClient();
            if (gemini) {
              try {
                const response = await gemini.models.generateContent({
                  model: 'gemini-3.6-flash',
                  contents: `You are VibeBot, an enthusiastic live stream AI co-host on a popular video/voice app. Reply concisely (1-2 sentences max) to this viewer comment: "${prompt}"`,
                });
                const aiReply = response.text?.trim() || '🔥 Let\'s get this stream hype going!';
                
                const aiMsg: ChatMessage = {
                  id: `ai_msg_${Date.now()}`,
                  roomId: conn.roomId,
                  sender: {
                    id: 'usr_aibot',
                    name: '🤖 VibeBot AI Co-Host',
                    handle: 'vibebot_ai',
                    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
                    level: 99,
                    vipLevel: 9,
                    svip: true,
                    country: 'Global',
                    countryFlag: '🌐',
                    isVerified: true,
                    bio: 'Official Stream Co-Host',
                    followers: 999999,
                    following: 0,
                    friends: 999,
                    visitors: 500000,
                    coins: 999999,
                    diamonds: 999999
                  },
                  content: aiReply,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };

                setTimeout(() => {
                  broadcastToRoom(conn.roomId!, {
                    type: 'chat-message',
                    message: aiMsg
                  });
                }, 800);
              } catch (err) {
                console.error('Gemini AI error:', err);
              }
            }
          }
          break;
        }

        case 'send-gift': {
          if (!conn.roomId) break;
          const gift: VirtualGift = data.gift;
          const count: number = data.count || 1;
          const totalCoins = gift.priceCoins * count;

          // Deduct coins from sender if current user
          if (conn.userId === currentUserStore.id) {
            currentUserStore.coins = Math.max(0, currentUserStore.coins - totalCoins);
          }

          // Add diamonds to room host
          const room = roomsStore.find((r) => r.id === conn.roomId);
          if (room) {
            room.host.diamonds += Math.floor(totalCoins * 0.7);
          }

          savePersistedData();

          const giftMsg: ChatMessage = {
            id: `gift_msg_${Date.now()}`,
            roomId: conn.roomId,
            sender: data.sender || currentUserStore,
            content: `sent ${gift.name} x${count} ${gift.icon}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isGift: true,
            giftData: {
              giftId: gift.id,
              giftName: gift.name,
              giftIcon: gift.icon,
              count: count,
              valueCoins: gift.priceCoins
            }
          };

          broadcastToRoom(conn.roomId, {
            type: 'send-gift',
            gift,
            count,
            sender: data.sender || currentUserStore,
            message: giftMsg,
            updatedCoins: currentUserStore.coins,
          });
          break;
        }

        case 'emoji-reaction': {
          if (!conn.roomId) break;
          broadcastToRoom(conn.roomId, {
            type: 'emoji-reaction',
            emoji: data.emoji || '❤️',
            senderName: conn.userName,
          });
          break;
        }

        case 'seat-action': {
          if (!conn.roomId) break;
          const room = roomsStore.find((r) => r.id === conn.roomId);
          if (room) {
            if (!room.guests) room.guests = [];
            if (!room.stageRequests) room.stageRequests = [];

            if (data.action === 'take') {
              const targetUserId = data.user?.id || conn.userId;

              // Remove user from any existing seat in this room first (single seat policy per user)
              room.guests = room.guests.filter((g) => g.user.id !== targetUserId && g.seatNumber !== data.seatNumber);

              // Ensure maximum 10 seats
              if (room.guests.length >= 10) {
                ws.send(JSON.stringify({
                  type: 'system-message',
                  content: '⚠️ All 10 stage slots are full! Host can manage seats or viewers can request slots.'
                }));
                break;
              }

              const newGuest: RoomGuest = {
                id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                seatNumber: data.seatNumber,
                slotType: data.slotType || (room.type === 'video' ? 'video' : 'audio'),
                isMicOn: true,
                isVideoOn: data.slotType === 'video' || room.type === 'video',
                isSpeaking: false,
                isMutedByHost: false,
                user: data.user || currentUserStore
              };

              room.guests.push(newGuest);

              // Remove from stage requests if present
              room.stageRequests = room.stageRequests.filter(sr => sr.user.id !== targetUserId);

              broadcastToRoom(conn.roomId, {
                type: 'system-message',
                content: `🎤 ${newGuest.user.name} joined Stage Slot #${data.seatNumber}!`
              });
            } else if (data.action === 'leave') {
              const guestLeaving = room.guests.find((g) => g.seatNumber === data.seatNumber);
              room.guests = room.guests.filter((g) => g.seatNumber !== data.seatNumber);
              if (guestLeaving) {
                broadcastToRoom(conn.roomId, {
                  type: 'system-message',
                  content: `👋 ${guestLeaving.user.name} stepped down from Stage Slot #${data.seatNumber}`
                });
              }
            } else if (data.action === 'kick') {
              // Host kicks guest from slot back to audience
              const guestToKick = room.guests.find((g) => g.seatNumber === data.seatNumber);
              room.guests = room.guests.filter((g) => g.seatNumber !== data.seatNumber);
              if (guestToKick) {
                broadcastToRoom(conn.roomId, {
                  type: 'system-message',
                  content: `🚫 Host moved ${guestToKick.user.name} back to the audience.`
                });
              }
            } else if (data.action === 'toggle-mic') {
              const guest = room.guests.find((g) => g.seatNumber === data.seatNumber);
              if (guest) {
                guest.isMicOn = !guest.isMicOn;
              }
            } else if (data.action === 'host-toggle-mute') {
              const guest = room.guests.find((g) => g.seatNumber === data.seatNumber);
              if (guest) {
                guest.isMutedByHost = !guest.isMutedByHost;
                guest.isMicOn = !guest.isMutedByHost;
              }
            } else if (data.action === 'toggle-video') {
              const guest = room.guests.find((g) => g.seatNumber === data.seatNumber);
              if (guest) {
                guest.isVideoOn = !guest.isVideoOn;
              }
            } else if (data.action === 'request-stage') {
              // Audience viewer requests stage slot
              const requestUser = data.user || currentUserStore;
              const existingReq = room.stageRequests.find(sr => sr.user.id === requestUser.id);
              if (!existingReq) {
                room.stageRequests.push({
                  id: `req_${Date.now()}`,
                  user: requestUser,
                  type: data.slotType || 'video',
                  requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
                broadcastToRoom(conn.roomId, {
                  type: 'system-message',
                  content: `✋ ${requestUser.name} requested to join Stage (${room.stageRequests.length} in queue)`
                });
              }
            } else if (data.action === 'cancel-request') {
              const requestUser = data.user || currentUserStore;
              room.stageRequests = room.stageRequests.filter(sr => sr.user.id !== requestUser.id);
            } else if (data.action === 'approve-request') {
              const requestToApprove = room.stageRequests.find(sr => sr.id === data.requestId);
              if (requestToApprove && room.guests.length < 10) {
                // Find first available seat number 1-10
                let openSeat = 1;
                for (let i = 1; i <= 10; i++) {
                  if (!room.guests.some(g => g.seatNumber === i)) {
                    openSeat = i;
                    break;
                  }
                }
                const newGuest: RoomGuest = {
                  id: `guest_${Date.now()}`,
                  seatNumber: openSeat,
                  slotType: requestToApprove.type,
                  isMicOn: true,
                  isVideoOn: requestToApprove.type === 'video',
                  isSpeaking: false,
                  isMutedByHost: false,
                  user: requestToApprove.user
                };
                room.guests.push(newGuest);
                room.stageRequests = room.stageRequests.filter(sr => sr.id !== data.requestId);

                broadcastToRoom(conn.roomId, {
                  type: 'system-message',
                  content: `🎉 Host approved ${requestToApprove.user.name} for Stage Slot #${openSeat}!`
                });
              }
            } else if (data.action === 'promote-to-video') {
              const guest = room.guests.find((g) => g.seatNumber === data.seatNumber);
              if (guest) {
                const videoCount = room.guests.filter((g) => g.slotType === 'video').length;
                if (videoCount < 3) {
                  guest.slotType = 'video';
                  guest.isVideoOn = true;
                  broadcastToRoom(conn.roomId, {
                    type: 'system-message',
                    content: `🎥 Host promoted ${guest.user.name} to Video Stage Slot!`
                  });
                } else {
                  ws.send(JSON.stringify({
                    type: 'system-message',
                    content: '⚠️ Video stage is full (3/3 max slots).'
                  }));
                }
              }
            }

            broadcastToRoom(conn.roomId, {
              type: 'guests-update',
              guests: room.guests,
              stageRequests: room.stageRequests
            });
          }
          break;
        }

        case 'draw-stroke': {
          if (!conn.roomId) break;
          broadcastToRoom(conn.roomId, {
            type: 'draw-stroke',
            stroke: data.stroke
          }, ws);
          break;
        }

        case 'clear-canvas': {
          if (!conn.roomId) break;
          broadcastToRoom(conn.roomId, {
            type: 'clear-canvas'
          });
          break;
        }

        case 'rtc-signal': {
          if (!conn.roomId) break;
          if (data.targetUserId) {
            // Forward to specific target user
            for (const client of activeClients) {
              if (client.userId === data.targetUserId && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({ ...data, fromUserId: conn.userId }));
              }
            }
          } else {
            // Broadcast to all other clients in room
            broadcastToRoom(conn.roomId, { ...data, fromUserId: conn.userId }, ws);
          }
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket Error:', err);
    }
  });

  ws.on('close', () => {
    activeClients.delete(conn);
    broadcastOnlineUsers();
    if (conn.roomId) {
      const targetRoomId = conn.roomId;
      if (roomClients.has(targetRoomId)) {
        roomClients.get(targetRoomId)?.delete(conn);
      }
      const room = roomsStore.find((r) => r.id === targetRoomId);
      if (room) {
        const isHost = room.host.id === conn.userId;
        const remainingCount = roomClients.get(targetRoomId)?.size || 0;

        if (isHost || remainingCount === 0) {
          closeRoomStream(targetRoomId, isHost ? 'Host disconnected.' : 'Stream closed (0 members left).');
        } else {
          if (room.viewerCount > 0) room.viewerCount -= 1;
          room.guests = (room.guests || []).filter((g) => g.user.id !== conn.userId);
          broadcastToRoom(targetRoomId, {
            type: 'viewer-count-update',
            viewerCount: room.viewerCount,
          });
          broadcastToRoom(targetRoomId, {
            type: 'guests-update',
            guests: room.guests,
            stageRequests: room.stageRequests || []
          });
        }
      }
    }
  });
});

// REST API Endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Streams REST
app.get('/api/streams', (req, res) => {
  const category = req.query.category as string;
  const country = req.query.country as string;
  const filter = req.query.filter as string; // 'hot', 'recommend'
  const mode = req.query.mode as string; // 'solo', 'multi'

  let list = [...roomsStore];

  if (mode) {
    list = list.filter((r) => (r.mode || 'multi') === mode);
  }

  if (category && category !== 'All') {
    list = list.filter((r) => r.category.toLowerCase() === category.toLowerCase() || r.type === category.toLowerCase());
  }

  if (country && country !== 'All') {
    list = list.filter((r) => r.country.toLowerCase() === country.toLowerCase());
  }

  if (filter === 'hot') {
    list = list.filter((r) => r.isHot);
  } else if (filter === 'recommend') {
    list = list.filter((r) => r.isRecommended);
  }

  res.json(list);
});

// Create Stream
app.post('/api/streams', (req, res) => {
  const { title, category, type, country, countryFlag, coverImage, tags, mode, host } = req.body;
  const hostUser = host || currentUserStore;

  const newRoom: StreamRoom = {
    id: `room_${Date.now()}`,
    title: title || `${hostUser.name}'s Live Stream`,
    type: type || 'video',
    mode: mode === 'solo' ? 'solo' : 'multi',
    category: category || 'Gaming',
    country: country || hostUser.country,
    countryFlag: countryFlag || hostUser.countryFlag,
    coverImage: coverImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800',
    viewerCount: 1,
    likeCount: 0,
    tags: tags || ['Live', 'Fun'],
    isHot: true,
    isRecommended: true,
    durationSeconds: 0,
    pinnedMessage: `Welcome to ${hostUser.name}'s room! Say hi in chat! 👋`,
    host: hostUser,
    guests: []
  };

  roomsStore.unshift(newRoom);
  res.json(newRoom);
});

// Helper to get profiles directly from Supabase database
async function getSupabaseProfiles() {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          handle: p.handle,
          avatar: p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
          bio: p.bio || 'VibeLive Member',
          country: p.country || 'India',
          countryFlag: p.country_flag || '🇮🇳',
          coins: p.coins || 1000,
          diamonds: p.diamonds || 0,
          followers: p.followers || 0,
          following: p.following || 0,
          isVerified: p.is_verified || false,
          level: p.level || 1,
          vipLevel: p.vip_level || 0,
          svip: p.svip || false,
        }));
      }
    } catch (e) {
      console.warn('Supabase profiles fetch note:', e);
    }
  }
  return [];
}

// User Profile & Wallet
app.get('/api/user/profile', (_req, res) => {
  res.json(currentUserStore);
});

// Search Users REST endpoint
app.get('/api/users/search', async (req, res) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  const currentUserId = (req.query.userId as string) || currentUserStore.id;

  let dbProfiles = await getSupabaseProfiles();
  if (dbProfiles.length === 0) {
    dbProfiles = Object.values(ALL_SAMPLE_USERS) as any[];
  }

  if (query) {
    dbProfiles = dbProfiles.filter(
      (u) => u.name.toLowerCase().includes(query) || u.handle.toLowerCase().includes(query)
    );
  }

  const result = dbProfiles.map((u) => ({
    ...u,
    isOnline: checkIsUserOnline(u.id),
    isMutual: checkIsMutualFollow(currentUserId, u.id),
  }));

  res.json(result);
});

// Follow System REST Endpoints
app.get('/api/user/following', async (req, res) => {
  const currentUserId = (req.query.userId as string) || currentUserStore.id;

  let followingUserIds: string[] = [];

  if (supabaseAdmin) {
    try {
      const { data: followRows } = await supabaseAdmin
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);
      if (followRows && followRows.length > 0) {
        followingUserIds = followRows.map((f: any) => f.following_id);
      }
    } catch (e) {}
  }

  if (followingUserIds.length === 0) {
    followingUserIds = followsStore
      .filter((f) => f.followerId === currentUserId)
      .map((f) => f.followingId);
  }

  const dbProfiles = await getSupabaseProfiles();
  const userMap = new Map<string, any>();
  dbProfiles.forEach((p) => userMap.set(p.id, p));

  const result = followingUserIds.map((targetId) => {
    const targetUser = userMap.get(targetId) || ALL_SAMPLE_USERS[targetId] || {
      id: targetId,
      name: `User ${targetId.slice(0, 6)}`,
      handle: `user_${targetId.slice(0, 6)}`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      bio: 'VibeLive Member',
      country: 'India',
      countryFlag: '🇮🇳'
    };

    return {
      id: targetUser.id,
      name: targetUser.name,
      handle: targetUser.handle,
      avatar: targetUser.avatar,
      bio: targetUser.bio,
      country: targetUser.country,
      countryFlag: targetUser.countryFlag,
      isOnline: checkIsUserOnline(targetUser.id),
      isMutual: checkIsMutualFollow(currentUserId, targetUser.id),
    };
  });

  res.json(result);
});

app.post('/api/user/follow', (req, res) => {
  const { targetUserId, followerId } = req.body;
  const currentUserId = followerId || currentUserStore.id;

  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId is required' });
  }

  const existingIdx = followsStore.findIndex(
    (f) => f.followerId === currentUserId && f.followingId === targetUserId
  );

  let isFollowing = false;
  if (existingIdx >= 0) {
    // Unfollow
    followsStore.splice(existingIdx, 1);
    isFollowing = false;
    if (currentUserStore.following > 0) currentUserStore.following -= 1;
  } else {
    // Follow
    followsStore.push({ followerId: currentUserId, followingId: targetUserId });
    isFollowing = true;
    currentUserStore.following += 1;
  }

  // Sync with Supabase follows table if available
  savePersistedData();
  if (supabaseAdmin) {
    (async () => {
      try {
        if (isFollowing) {
          await supabaseAdmin.from('follows').insert({ follower_id: currentUserId, following_id: targetUserId });
        } else {
          await supabaseAdmin.from('follows').delete().match({ follower_id: currentUserId, following_id: targetUserId });
        }
      } catch (e) {}
    })();
  }

  const isMutual = checkIsMutualFollow(currentUserId, targetUserId);

  res.json({
    success: true,
    isFollowing,
    isMutual,
    followingCount: currentUserStore.following,
  });
});

app.get('/api/users/online', (_req, res) => {
  const onlineIds = new Set<string>();
  for (const client of activeClients) {
    if (client.userId) onlineIds.add(client.userId);
  }
  res.json({ onlineUserIds: Array.from(onlineIds) });
});

app.post('/api/wallet/buy-coins', (req, res) => {
  const { amount } = req.body;
  if (typeof amount === 'number' && amount > 0) {
    currentUserStore.coins += amount;
    savePersistedData();
  }
  res.json({ coins: currentUserStore.coins, diamonds: currentUserStore.diamonds });
});

// Auth endpoints
app.post('/api/auth/guest', (_req, res) => {
  res.json({ user: currentUserStore, token: 'guest_token_12345' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, name } = req.body;
  if (name) currentUserStore.name = name;
  res.json({ user: currentUserStore, token: 'auth_token_98765' });
});

// Reels
app.get('/api/reels', (_req, res) => {
  res.json(reelsStore);
});

// Direct Messages REST API (Encrypted payloads stored in DB)
app.get('/api/direct-messages/conversations', async (req, res) => {
  const currentUserId = (req.query.userId as string) || currentUserStore.id;

  let allDMs: any[] = [];
  if (supabaseAdmin) {
    try {
      const { data: dms } = await supabaseAdmin
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order('created_at', { ascending: true });
      if (dms && dms.length > 0) {
        allDMs = dms.map((d: any) => ({
          id: d.id,
          senderId: d.sender_id,
          recipientId: d.recipient_id,
          encryptedContent: d.encrypted_content,
          isRead: Boolean(d.is_read),
          timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
      }
    } catch (e) {}
  }

  if (allDMs.length === 0) {
    allDMs = directMessagesStore;
  }

  const involvedUserIds = new Set<string>();

  followsStore.forEach((f) => {
    if (f.followerId === currentUserId) involvedUserIds.add(f.followingId);
    if (f.followingId === currentUserId) involvedUserIds.add(f.followerId);
  });

  allDMs.forEach((m) => {
    if (m.senderId === currentUserId) involvedUserIds.add(m.recipientId);
    if (m.recipientId === currentUserId) involvedUserIds.add(m.senderId);
  });

  involvedUserIds.delete(currentUserId);

  const dbProfiles = await getSupabaseProfiles();
  const profileMap = new Map<string, any>();
  dbProfiles.forEach((p) => profileMap.set(p.id, p));

  const primary: any[] = [];
  const requests: any[] = [];

  involvedUserIds.forEach((otherId) => {
    const userObj = profileMap.get(otherId) || ALL_SAMPLE_USERS[otherId] || {
      id: otherId,
      name: `User ${otherId.slice(0, 6)}`,
      handle: `user_${otherId.slice(0, 6)}`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      bio: '',
    };

    const msgs = allDMs.filter(
      (m) =>
        (m.senderId === currentUserId && m.recipientId === otherId) ||
        (m.senderId === otherId && m.recipientId === currentUserId)
    );

    const lastMsg = msgs[msgs.length - 1];
    const isMutual = checkIsMutualFollow(currentUserId, otherId);
    const isOnline = checkIsUserOnline(otherId);
    const unreadCount = msgs.filter((m) => m.recipientId === currentUserId && !m.isRead).length;

    const convItem = {
      id: otherId,
      user: {
        id: userObj.id,
        name: userObj.name,
        handle: userObj.handle,
        avatar: userObj.avatar,
        bio: userObj.bio || '',
      },
      lastMsgEncrypted: lastMsg ? lastMsg.encryptedContent : encryptMessage('No messages yet'),
      time: lastMsg ? lastMsg.timestamp : 'New',
      unread: unreadCount,
      isMutual,
      isOnline,
      messages: msgs,
    };

    if (isMutual) {
      primary.push(convItem);
    } else {
      requests.push(convItem);
    }
  });

  res.json({ primary, requests });
});

app.get('/api/direct-messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const currentUserId = (req.query.currentUserId as string) || currentUserStore.id;

  if (supabaseAdmin) {
    try {
      const { data: dms } = await supabaseAdmin
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (dms && dms.length > 0) {
        return res.json(
          dms.map((d: any) => ({
            id: d.id,
            senderId: d.sender_id,
            recipientId: d.recipient_id,
            encryptedContent: d.encrypted_content,
            isRead: Boolean(d.is_read),
            timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }))
        );
      }
    } catch (e) {}
  }

  const msgs = directMessagesStore.filter(
    (m) =>
      (m.senderId === currentUserId && m.recipientId === userId) ||
      (m.senderId === userId && m.recipientId === currentUserId)
  );

  res.json(msgs);
});

app.post('/api/direct-messages', (req, res) => {
  const { recipientId, encryptedContent, senderId } = req.body;
  if (!recipientId || !encryptedContent) {
    return res.status(400).json({ error: 'recipientId and encryptedContent are required' });
  }

  const sender = senderId || currentUserStore.id;
  const msgId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMsg = {
    id: msgId,
    senderId: sender,
    recipientId,
    encryptedContent,
    isRead: false,
    timestamp: timeStr,
  };

  directMessagesStore.push(newMsg);
  savePersistedData();

  if (supabaseAdmin) {
    (async () => {
      try {
        await supabaseAdmin.from('direct_messages').insert({
          id: msgId,
          sender_id: sender,
          recipient_id: recipientId,
          encrypted_content: encryptedContent,
          is_read: false,
        });
      } catch (e) {}
    })();
  }

  // Instant 0ms WebSocket delivery
  for (const client of activeClients) {
    if ((client.userId === recipientId || client.userId === sender) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'direct-message-received',
        message: newMsg,
      }));
    }
  }

  res.json(newMsg);
});

// Notifications
app.get('/api/notifications', (_req, res) => {
  res.json(notificationsStore);
});

// Serve frontend in dev / prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(indexPath);
      });
    } else {
      console.warn(`⚠️ Warning: ${indexPath} not found. Running in API-only / non-built mode.`);
      app.get('*', (_req, res) => {
        res.status(200).send('🚀 VibeLive Backend API & Realtime Server active.');
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VibeLive Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
