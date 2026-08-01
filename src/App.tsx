import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { LiveStreamView } from './views/LiveStreamView';
import { LiveFeedView } from './views/LiveFeedView';
import { ReelsView } from './views/ReelsView';
import { MessagesView } from './views/MessagesView';
import { ProfileView } from './views/ProfileView';
import { CreatorDashboardView } from './views/CreatorDashboardView';
import { WalletModal } from './components/modals/WalletModal';
import { GoLiveModal } from './components/modals/GoLiveModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { SearchModal } from './components/modals/SearchModal';
import { AuthModal } from './components/modals/AuthModal';
import { GiftDrawer } from './components/GiftDrawer';
import { StreamRoom, RoomType } from './types';
import { VIRTUAL_GIFTS } from './data/gifts';
import { useAuth } from './context/AuthContext';

export function MainApp() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'reel' | 'live' | 'message' | 'profile'>('home');
  const [activeHomeTab, setActiveHomeTab] = useState<'hot' | 'recommend'>('hot');
  const [selectedRoom, setSelectedRoom] = useState<StreamRoom | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<{ id: string; name: string; avatar: string; handle: string } | null>(null);

  // Modals
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReelGiftOpen, setIsReelGiftOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleStartStream = async (title: string, category: string, type: RoomType, mode?: 'solo' | 'multi') => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          type,
          mode: mode || 'multi',
          country: user.country || 'India',
          countryFlag: user.countryFlag || '🇮🇳',
          tags: ['Live', category],
          host: user,
        }),
      });
      if (res.ok) {
        const newRoom: StreamRoom = await res.json();
        setSelectedRoom(newRoom);
        return;
      }
    } catch (err) {
      console.error('Failed to create stream via API, using fallback:', err);
    }

    const fallbackRoom: StreamRoom = {
      id: `room_live_${Date.now()}`,
      title,
      type,
      mode: mode || 'multi',
      category,
      country: user.country || 'India',
      countryFlag: user.countryFlag || '🇮🇳',
      coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      viewerCount: 1,
      likeCount: 0,
      tags: ['Live', category],
      isHot: true,
      isRecommended: true,
      durationSeconds: 0,
      pinnedMessage: `Welcome everyone to ${title}! 👋`,
      host: user,
      guests: []
    };
    setSelectedRoom(fallbackRoom);
  };

  return (
    <div className="bg-[#0a0518] min-h-screen text-white font-sans selection:bg-pink-500 selection:text-white">
      {/* Phone Canvas Container Frame */}
      <div className="max-w-md mx-auto min-h-screen relative bg-[#0f0826] shadow-2xl border-x border-white/5 overflow-x-hidden transform-gpu">
        {/* Top Sticky Header (shown on Home view) */}
        {activeTab === 'home' && !selectedRoom && (
          <Header
            activeHomeTab={activeHomeTab}
            setActiveHomeTab={setActiveHomeTab}
            onSearchClick={() => setIsSearchOpen(true)}
            onLeaderboardClick={() => setIsLeaderboardOpen(true)}
            onWalletClick={() => setIsWalletOpen(true)}
            onNotificationsClick={() => setIsNotificationsOpen(true)}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {/* Views Router */}
        {activeTab === 'home' && (
          <HomeView
            activeHomeTab={activeHomeTab}
            onSelectRoom={(room) => setSelectedRoom(room)}
            onGoLiveClick={() => setIsGoLiveOpen(true)}
          />
        )}

        {activeTab === 'reel' && (
          <LiveFeedView
            onSelectStream={(room) => setSelectedRoom(room)}
            onOpenGiftDrawer={() => setIsReelGiftOpen(true)}
          />
        )}

        {activeTab === 'message' && (
          <MessagesView
            targetUser={selectedChatUser}
            onClearTargetUser={() => setSelectedChatUser(null)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenCreatorDashboard={() => setActiveTab('live')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenChatWithUser={(targetUser) => {
              setSelectedChatUser(targetUser);
              setActiveTab('message');
            }}
          />
        )}

        {activeTab === 'live' && (
          <CreatorDashboardView onGoLiveClick={() => setIsGoLiveOpen(true)} />
        )}

        {/* Bottom Fixed Navigation Bar */}
        {!selectedRoom && (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onGoLiveClick={() => setIsGoLiveOpen(true)}
          />
        )}

        {/* Active Live Stream Room Overlay Screen */}
        {selectedRoom && (
          <LiveStreamView
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {/* Global Modals */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
        <GoLiveModal
          isOpen={isGoLiveOpen}
          onClose={() => setIsGoLiveOpen(false)}
          onStartStream={handleStartStream}
        />
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectRoom={(room) => setSelectedRoom(room)}
        />

        <GiftDrawer
          isOpen={isReelGiftOpen}
          onClose={() => setIsReelGiftOpen(false)}
          onSendGift={(_gift, _count) => setIsReelGiftOpen(false)}
          onOpenWallet={() => setIsWalletOpen(true)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
