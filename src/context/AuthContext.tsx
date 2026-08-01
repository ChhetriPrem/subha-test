import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const GUEST_USER: User = {
  id: 'usr_guest_default',
  name: 'Guest Explorer',
  handle: 'guest_explorer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  country: 'India',
  countryFlag: '🇮🇳',
  level: 1,
  vipLevel: 0,
  svip: false,
  isVerified: false,
  bio: 'Exploring VibeLive streams 🎧',
  followers: 0,
  following: 0,
  friends: 0,
  visitors: 0,
  coins: 1000,
  diamonds: 0,
};

export interface Profile {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  bio?: string;
  country?: string;
  country_flag?: string;
  level?: number;
  vip_level?: number;
  svip?: boolean;
  is_verified?: boolean;
  coins?: number;
  diamonds?: number;
  followers?: number;
  following?: number;
}

interface AuthContextType {
  user: User;
  session: any;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: { name: string; handle: string; email: string; password: string; avatar?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  // Legacy aliases for component compatibility
  loginUserWithPassword: (emailOrHandle: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupUser: (params: { name: string; handle: string; email: string; password: string; avatar?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginGuest: () => void;
  buyCoins: (amount: number) => void;
  deductCoins: (amount: number) => boolean;
  addDiamonds: (amount: number) => void;
  updateUser: (updates: Partial<User>) => void;
  followingIds: Set<string>;
  toggleFollow: (userId: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [guestCoins, setGuestCoins] = useState<number>(1000);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else if (!data) {
        // Create profile if missing
        const newProfile: Partial<Profile> = {
          id: userId,
          name: session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'User',
          handle: session?.user?.user_metadata?.handle || `user_${userId.slice(0, 6)}`,
          avatar: session?.user?.user_metadata?.avatar || GUEST_USER.avatar,
        };
        const { data: inserted } = await supabase.from('profiles').insert(newProfile).select().single();
        if (inserted) setProfile(inserted);
      }
    } catch (err) {
      console.error('Error fetching Supabase profile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (mounted) {
          setSession(data.session);
          if (data.session?.user) {
            fetchProfile(data.session.user.id);
          }
          setIsLoading(false);
        }
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          if (newSession?.user) {
            fetchProfile(newSession.user.id);
          } else {
            setProfile(null);
          }
        }
      });

      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase credentials are not configured.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await fetchProfile(data.user.id);
    }
    return { success: true };
  };

  const signUp = async ({
    name,
    handle,
    email,
    password,
    avatar,
    bio,
  }: {
    name: string;
    handle: string;
    email: string;
    password: string;
    avatar?: string;
    bio?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase credentials are not configured.' };
    }

    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!name.trim()) return { success: false, error: 'Please enter your display name.' };
    if (!cleanHandle) return { success: false, error: 'Please enter a valid handle.' };
    if (!cleanEmail.includes('@')) return { success: false, error: 'Please enter a valid email.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

    // Check handle availability first
    const { data: existingHandle } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', cleanHandle)
      .maybeSingle();

    if (existingHandle) {
      return { success: false, error: 'Username/Handle is already taken.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: name.trim(),
          handle: cleanHandle,
          avatar: avatar || GUEST_USER.avatar,
          bio: bio || '',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await fetchProfile(data.user.id);
    }
    return { success: true };
  };

  const signOut = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
  };

  const loginGuest = () => {
    // Guest fallback reset
  };

  const buyCoins = async (amount: number) => {
    if (profile && isSupabaseConfigured() && supabase) {
      const newCoins = (profile.coins || 0) + amount;
      setProfile((p) => p ? { ...p, coins: newCoins } : null);
      await supabase.from('profiles').update({ coins: newCoins }).eq('id', profile.id);
    } else {
      setGuestCoins((c) => c + amount);
    }
  };

  const deductCoins = (amount: number): boolean => {
    const currentCoins = profile ? (profile.coins ?? 5000) : guestCoins;
    if (currentCoins >= amount) {
      const newCoins = currentCoins - amount;
      if (profile && isSupabaseConfigured() && supabase) {
        setProfile((p) => p ? { ...p, coins: newCoins } : null);
        supabase.from('profiles').update({ coins: newCoins }).eq('id', profile.id);
      } else {
        setGuestCoins(newCoins);
      }
      return true;
    }
    return false;
  };

  const addDiamonds = async (amount: number) => {
    if (profile && isSupabaseConfigured() && supabase) {
      const newDiamonds = (profile.diamonds || 0) + amount;
      setProfile((p) => p ? { ...p, diamonds: newDiamonds } : null);
      await supabase.from('profiles').update({ diamonds: newDiamonds }).eq('id', profile.id);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (profile && isSupabaseConfigured() && supabase) {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.handle !== undefined) dbUpdates.handle = updates.handle;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.countryFlag !== undefined) dbUpdates.country_flag = updates.countryFlag;

      setProfile((p) => (p ? { ...p, ...dbUpdates } : null));
      await supabase.from('profiles').update(dbUpdates).eq('id', profile.id);
    }
  };

  const toggleFollow = (targetUserId: string) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetUserId)) {
        next.delete(targetUserId);
      } else {
        next.add(targetUserId);
      }
      return next;
    });
  };

  // Compute standard user object from profile
  const user: User = profile
    ? {
        id: profile.id,
        name: profile.name || 'User',
        handle: profile.handle || 'user',
        avatar: profile.avatar || GUEST_USER.avatar,
        country: profile.country || 'India',
        countryFlag: profile.country_flag || '🇮🇳',
        level: profile.level || 1,
        vipLevel: profile.vip_level || 0,
        svip: profile.svip || false,
        isVerified: profile.is_verified || false,
        bio: profile.bio || '',
        followers: profile.followers || 0,
        following: profile.following || 0,
        friends: 0,
        visitors: 0,
        coins: profile.coins ?? 5000,
        diamonds: profile.diamonds ?? 0,
      }
    : {
        ...GUEST_USER,
        coins: guestCoins,
      };

  const isAuthenticated = !!session?.user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        loginUserWithPassword: signIn,
        signupUser: signUp,
        logout: signOut,
        loginGuest,
        buyCoins,
        deductCoins,
        addDiamonds,
        updateUser,
        followingIds,
        toggleFollow,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

