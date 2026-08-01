import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  AtSign,
  LogOut,
  Gift,
  KeyRound,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, signIn, signUp, signOut } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Login Form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup Form state
  const [signupName, setSignupName] = useState('');
  const [signupHandle, setSignupHandle] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupBio, setSignupBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  // Inline handle validation state
  const [handleCheckStatus, setHandleCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [handleCheckMsg, setHandleCheckMsg] = useState('');

  useEffect(() => {
    if (!signupHandle.trim()) {
      setHandleCheckStatus('idle');
      setHandleCheckMsg('');
      return;
    }

    const clean = signupHandle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean.length < 3) {
      setHandleCheckStatus('invalid');
      setHandleCheckMsg('Handle must be at least 3 alphanumeric characters');
      return;
    }

    setHandleCheckStatus('checking');
    const timer = setTimeout(async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('handle', clean)
            .maybeSingle();

          if (data) {
            setHandleCheckStatus('taken');
            setHandleCheckMsg(`@${clean} is already taken`);
          } else {
            setHandleCheckStatus('available');
            setHandleCheckMsg(`@${clean} is available!`);
          }
        } catch (e) {
          setHandleCheckStatus('available');
        }
      } else {
        setHandleCheckStatus('available');
        setHandleCheckMsg(`@${clean} is available!`);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [signupHandle]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    const res = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setLoginError(res.error || 'Failed to sign in.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleCheckStatus === 'taken') {
      setSignupError('Please choose an available handle.');
      return;
    }

    setSignupError('');
    setSignupSuccess('');
    setIsSubmitting(true);

    const res = await signUp({
      name: signupName,
      handle: signupHandle,
      email: signupEmail,
      password: signupPassword,
      avatar: selectedAvatar,
      bio: signupBio,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSignupSuccess('Account created successfully! 5,000 Coins added! 🎉');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setSignupError(res.error || 'Signup failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#08080c] border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative space-y-4 text-white overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600/30 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-600/20 blur-3xl rounded-full pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Current Logged In Banner */}
        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center space-x-3">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500" />
            <div>
              <p className="text-xs font-black text-white flex items-center space-x-1">
                <span>{user.name}</span>
                {isAuthenticated ? (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">Verified Auth</span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">Guest</span>
                )}
              </p>
              <p className="text-[10px] text-slate-400">@{user.handle} • {user.coins.toLocaleString()} Coins</p>
            </div>
          </div>
          {isAuthenticated && (
            <button
              onClick={async () => {
                await signOut();
              }}
              className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl border border-red-500/30 text-xs font-bold transition-all flex items-center space-x-1"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Header Title */}
        <div className="text-center space-y-1 pt-1">
          <h2 className="text-lg font-black text-white tracking-wide">VibeLive Account Access</h2>
          <p className="text-xs text-slate-400">
            {isSupabaseConfigured()
              ? '☁️ Supabase Cloud Authentication Active'
              : 'Sign in or register a new creator account.'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setTab('login')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              tab === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>

          <button
            onClick={() => setTab('signup')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              tab === 'signup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* TAB 1: LOG IN */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
            {loginError && (
              <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-300 font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center space-x-1">
                <Mail className="w-3 h-3 text-indigo-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-indigo-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-90 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In to VibeLive'}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-2.5 pt-1 max-h-[340px] overflow-y-auto pr-1">
            {signupError && (
              <div className="p-2 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-300 font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{signupError}</span>
              </div>
            )}
            {signupSuccess && (
              <div className="p-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-bold text-center">
                {signupSuccess}
              </div>
            )}

            <div className="p-2 bg-gradient-to-r from-indigo-950/80 to-pink-950/80 border border-indigo-500/30 rounded-xl flex items-center space-x-2">
              <Gift className="w-5 h-5 text-yellow-400 shrink-0" />
              <span className="text-[11px] font-bold text-indigo-200">
                Create a new account and get <strong className="text-yellow-300">5,000 Free Coins</strong> welcome bonus!
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-300 mb-1 block">Display Name</label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Alex Rivers"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-300 mb-1 block">Handle / @Username</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={signupHandle}
                    onChange={(e) => setSignupHandle(e.target.value)}
                    placeholder="alex_rivers"
                    className={`w-full bg-black/50 border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none ${
                      handleCheckStatus === 'taken' || handleCheckStatus === 'invalid'
                        ? 'border-red-500'
                        : handleCheckStatus === 'available'
                        ? 'border-emerald-500'
                        : 'border-white/15 focus:border-indigo-500'
                    }`}
                  />
                  {handleCheckStatus === 'checking' && (
                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin absolute right-2.5 top-2.5" />
                  )}
                  {handleCheckStatus === 'available' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-2.5" />
                  )}
                  {handleCheckStatus === 'taken' && (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 absolute right-2.5 top-2.5" />
                  )}
                </div>
                {handleCheckMsg && (
                  <p className={`text-[9px] mt-0.5 ${handleCheckStatus === 'available' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {handleCheckMsg}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 mb-1 block">Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="alex@vibelive.app"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 mb-1 block">Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-300 mb-1 block">Select Avatar</label>
              <div className="flex items-center space-x-2 overflow-x-auto py-1">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedAvatar(url)}
                    className={`shrink-0 rounded-full p-0.5 border-2 transition-all ${
                      selectedAvatar === url ? 'border-pink-500 scale-110 ring-2 ring-pink-500/50' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} className="w-8 h-8 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 mb-1 block">Bio (Optional)</label>
              <input
                type="text"
                value={signupBio}
                onChange={(e) => setSignupBio(e.target.value)}
                placeholder="Live singing & acoustic vibes 🎸"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || handleCheckStatus === 'taken'}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-2"
            >
              {isSubmitting ? 'Registering...' : 'Create VibeLive Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

