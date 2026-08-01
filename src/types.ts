export type RoomType = 'video' | 'audio' | 'gaming' | 'cp' | 'party';

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  country: string;
  countryFlag: string;
  level: number;
  vipLevel: number;
  svip: boolean;
  agency?: string;
  isVerified: boolean;
  bio: string;
  followers: number;
  following: number;
  friends: number;
  visitors: number;
  coins: number;
  diamonds: number;
  isFollowing?: boolean;
}

export interface StageRequest {
  id: string;
  user: User;
  type: 'video' | 'audio';
  requestedAt: string;
}

export interface RoomGuest {
  id: string;
  user: User;
  seatNumber: number; // 1 to 10
  slotType: 'video' | 'audio';
  isMicOn: boolean;
  isVideoOn: boolean;
  isSpeaking: boolean;
  isMutedByHost?: boolean;
}

export interface StreamRoom {
  id: string;
  title: string;
  host: User;
  type: RoomType;
  category: string;
  country: string;
  countryFlag: string;
  coverImage: string;
  videoUrl?: string;
  viewerCount: number;
  likeCount: number;
  tags: string[];
  isHot: boolean;
  isRecommended: boolean;
  durationSeconds: number;
  pinnedMessage?: string;
  mode?: 'solo' | 'multi'; // solo = host-only broadcast, multi = stage/seats enabled
  guests: RoomGuest[];
  maxSeats?: number; // Default 10
  stageRequests?: StageRequest[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: User;
  content: string;
  timestamp: string;
  isSystem?: boolean;
  isGift?: boolean;
  giftData?: {
    giftId: string;
    giftName: string;
    giftIcon: string;
    count: number;
    valueCoins: number;
  };
}

export interface VirtualGift {
  id: string;
  name: string;
  icon: string;
  priceCoins: number;
  category: 'popular' | 'luxury' | 'vip' | 'effects';
  animationType: 'float' | 'explosion' | 'castle' | 'sportsCar' | 'dragon';
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'follow' | 'gift' | 'message' | 'invite';
  user: User;
  text: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface ShortReel {
  id: string;
  user: User;
  videoUrl: string;
  thumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  musicTitle: string;
  isLiked?: boolean;
}

export interface GameState {
  gameType: 'draw' | 'trivia' | 'rps';
  active: boolean;
  wordToDraw?: string;
  drawerId?: string;
  scores: Record<string, number>;
  triviaQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}
