import { VirtualGift } from '../types';

export const VIRTUAL_GIFTS: VirtualGift[] = [
  { id: 'g_rose', name: 'Rose', icon: '🌹', priceCoins: 10, category: 'popular', animationType: 'float' },
  { id: 'g_heart', name: 'Love Heart', icon: '💖', priceCoins: 50, category: 'popular', animationType: 'float' },
  { id: 'g_boba', name: 'Boba Tea', icon: '🧋', priceCoins: 100, category: 'popular', animationType: 'float' },
  { id: 'g_crown', name: 'Royal Crown', icon: '👑', priceCoins: 500, category: 'luxury', animationType: 'explosion' },
  { id: 'g_ring', name: 'Diamond Ring', icon: '💍', priceCoins: 1200, category: 'luxury', animationType: 'explosion' },
  { id: 'g_car', name: 'Sports Car', icon: '🏎️', priceCoins: 5000, category: 'luxury', animationType: 'sportsCar' },
  { id: 'g_castle', name: 'Magic Castle', icon: '🏰', priceCoins: 10000, category: 'vip', animationType: 'castle' },
  { id: 'g_dragon', name: 'Golden Dragon', icon: '🐉', priceCoins: 25000, category: 'vip', animationType: 'dragon' },
  { id: 'g_rocket', name: 'Space Rocket', icon: '🚀', priceCoins: 50000, category: 'effects', animationType: 'dragon' },
];
