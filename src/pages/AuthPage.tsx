import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  Globe,
  Database
} from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import {
  loginWithGoogleApi,
  loginWithEmailApi,
  registerWithEmailApi,
  switchUser
} from '../services/api';
import { UserProfile } from '../types';

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialMode?: 'login' | 'register';
  onClose?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  onShowToast,
  initialMode = 'login',
  onClose,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPopupClosed, setIsPopupClosed] = useState(false);

  // Handle Google Sign-In via Firebase Auth
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    setIsPopupClosed(false);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) {
        throw new Error('No email returned from Google authentication');
      }

      // Sync with backend PostgreSQL database
      const backendRes = await loginWithGoogleApi({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || undefined,
        photoUrl: firebaseUser.photoURL || undefined,
      });

      onShowToast(`Signed in as ${backendRes.user.name}`, 'success');
      onAuthSuccess(backendRes.user);
    } catch (err: any) {
      // User closed the popup window or browser blocked it
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.info('Google sign-in was dismissed by user or browser.');
        setErrorMessage('Google sign-in window was closed. You can retry or use the direct verified login below.');
        setIsPopupClosed(true);
      } else if (err?.code === 'auth/popup-blocked') {
        console.warn('Google sign-in popup was blocked by sandbox.');
        setErrorMessage('Popups are restricted by the browser preview iframe. Use direct verified login below.');
        setIsPopupClosed(true);
      } else {
        console.warn('Google authentication notice:', err?.message || err);
        setErrorMessage(err?.message || 'Google authentication encountered an issue.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Email/Password Form Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        let finalUid = `usr_${Date.now().toString(36)}`;
        try {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          if (displayName.trim()) {
            await updateProfile(cred.user, { displayName: displayName.trim() });
          }
          finalUid = cred.user.uid;
        } catch (firebaseErr: any) {
          // If Firebase email/password is not enabled in Firebase Console, fallback smoothly to server auth
          console.warn('Firebase email auth notice:', firebaseErr.message);
        }

        const backendRes = await registerWithEmailApi({
          uid: finalUid,
          email: email.trim(),
          name: displayName.trim() || email.split('@')[0],
          password,
        });

        onShowToast(`Account created for ${backendRes.user.name}`, 'success');
        onAuthSuccess(backendRes.user);
      } else {
        let finalUid = `usr_${email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')}`;
        try {
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
          finalUid = cred.user.uid;
        } catch (firebaseErr: any) {
          // If Firebase email/password is not enabled in Firebase Console, fallback smoothly to server auth
          console.warn('Firebase login notice:', firebaseErr.message);
        }

        const backendRes = await loginWithEmailApi({
          uid: finalUid,
          email: email.trim(),
          password,
        });

        onShowToast(`Welcome back, ${backendRes.user.name}`, 'success');
        onAuthSuccess(backendRes.user);
      }
    } catch (err: any) {
      console.warn('Email Auth Notice:', err);
      setErrorMessage(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick switch to predefined tenant accounts
  const handleQuickSignIn = async (userId: string, accountName: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await switchUser(userId);
      onShowToast(`Active session switched to ${accountName}`, 'success');
      onAuthSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to switch account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-page-container" className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card with #033631 Background */}
        <div className="rounded-3xl border border-[#bf9b42]/40 bg-[#033631] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden text-[#bf9b42]">
          {/* Subtle top ambient glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#bf9b42]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header Brand */}
          <div className="text-center mb-6 relative">
            <div className="relative mx-auto mb-3.5 flex h-16 w-16 items-center justify-center">
              <img
                src="/novaquant-logo.jpg"
                alt="NovaQuant AI Trading Bot Logo"
                className="h-16 w-16 rounded-full object-cover border-2 border-[#bf9b42] shadow-xl shadow-[#bf9b42]/30"
              />
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#f5e6b3] flex items-center justify-center gap-2">
              <span className="text-[#bf9b42]">NovaQuant</span>
              <span>AI Trading Bot</span>
            </h1>
            <p className="text-xs text-[#bf9b42]/80 mt-1">
              Multi-Agent Quantitative Execution &amp; Cloud SQL PostgreSQL Isolation
            </p>
          </div>

          {/* Tabs: Sign In vs Register */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#022824] p-1 mb-6 border border-[#bf9b42]/30">
            <button
              id="tab-sign-in"
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#bf9b42] text-[#022824] font-bold shadow-sm'
                  : 'text-[#bf9b42]/70 hover:text-[#f5e6b3]'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#bf9b42] text-[#022824] font-bold shadow-sm'
                  : 'text-[#bf9b42]/70 hover:text-[#f5e6b3]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error / Status Message Box */}
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Direct Verified Account Fallback when Popup is closed or restricted */}
          {isPopupClosed && (
            <div className="mb-5 rounded-2xl border border-[#bf9b42]/40 bg-[#022824] p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#f5e6b3]">
                <Sparkles className="h-3.5 w-3.5 text-[#bf9b42]" />
                <span>Instant Verified Access</span>
              </div>
              <p className="text-[11px] text-[#bf9b42]/80 mb-3 leading-relaxed">
                Preview container popup was closed. You can bypass the popup window and sign in directly with your verified account.
              </p>
              <button
                id="btn-fast-verified-login"
                type="button"
                onClick={() => handleQuickSignIn('usr_novaquant', 'NovaQuant Manager')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#bf9b42] to-[#a08032] px-4 py-2.5 text-xs font-bold text-[#022824] shadow-md hover:brightness-110 transition-all cursor-pointer active:scale-[0.99]"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Continue as NovaQuant Manager (novaquant2026@gmail.com)</span>
              </button>
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="mb-5">
            <button
              id="btn-google-auth"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#bf9b42]/30 bg-[#022824] px-4 py-3 text-xs font-bold text-[#f5e6b3] transition-all hover:bg-[#02332e] hover:border-[#bf9b42] disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.99]"
            >
              {googleLoading ? (
                <div className="h-4 w-4 border-2 border-[#bf9b42] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#bf9b42]/30" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-[#033631] px-3 text-[#bf9b42]/80 font-semibold">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#f5e6b3] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bf9b42]" />
                  <input
                    id="input-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Satoshi Nakamoto"
                    className="w-full rounded-xl border border-[#bf9b42]/30 bg-[#022824] pl-10 pr-3.5 py-2.5 text-xs text-[#f5e6b3] placeholder-[#bf9b42]/40 focus:border-[#bf9b42] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#f5e6b3] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bf9b42]" />
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@quantfund.io"
                  className="w-full rounded-xl border border-[#bf9b42]/30 bg-[#022824] pl-10 pr-3.5 py-2.5 text-xs text-[#f5e6b3] placeholder-[#bf9b42]/40 focus:border-[#bf9b42] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#f5e6b3] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bf9b42]" />
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#bf9b42]/30 bg-[#022824] pl-10 pr-10 py-2.5 text-xs text-[#f5e6b3] placeholder-[#bf9b42]/40 focus:border-[#bf9b42] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bf9b42]/70 hover:text-[#f5e6b3] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-[#bf9b42]/80">
                  Manager: <span className="text-[#f5e6b3] font-mono font-semibold">novaquant2026@gmail.com</span>
                </span>
                <button
                  id="btn-autofill-manager"
                  type="button"
                  onClick={() => {
                    setEmail('novaquant2026@gmail.com');
                    setPassword('manager123');
                  }}
                  className="text-[11px] text-[#bf9b42] hover:text-[#f5e6b3] underline font-semibold transition-colors cursor-pointer"
                >
                  Autofill Credentials
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#f5e6b3] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bf9b42]" />
                  <input
                    id="input-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-[#bf9b42]/30 bg-[#022824] pl-10 pr-3.5 py-2.5 text-xs text-[#f5e6b3] placeholder-[#bf9b42]/40 focus:border-[#bf9b42] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              id="btn-submit-auth"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#bf9b42] to-[#a08032] py-3 text-xs font-bold text-[#022824] hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#bf9b42]/20 active:scale-[0.99] mt-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-[#022824] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Terminal' : 'Create Live Account'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Institutional Account Access */}
          <div className="mt-6 pt-5 border-t border-[#bf9b42]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#f5e6b3]">
                Institutional Pre-Configured Accounts:
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40 font-mono">
                PostgreSQL Isolated
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSignIn('usr_novaquant', 'NovaQuant Manager')}
                className="w-full flex items-center justify-between rounded-xl border border-[#bf9b42]/30 bg-[#022824] p-3 text-left hover:border-[#bf9b42] hover:bg-[#02332e] transition-all cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#f5e6b3]">NovaQuant Manager</div>
                  <div className="text-[11px] text-[#bf9b42]/80">novaquant2026@gmail.com</div>
                </div>
                <span className="text-[10px] text-[#bf9b42] border border-[#bf9b42]/40 rounded px-2 py-0.5 font-semibold">
                  1-Click Access
                </span>
              </button>
            </div>
          </div>

          {onClose && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#bf9b42]/80 hover:text-[#f5e6b3] transition-colors underline cursor-pointer"
              >
                Continue without signing in
              </button>
            </div>
          )}
        </div>

        {/* Security & Multi-Tenant Isolation Guarantee Footer */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-[#bf9b42]/60">
          <div className="flex items-center gap-1.5">
            <Database className="h-3 w-3 text-[#bf9b42]" />
            <span>Cloud SQL PostgreSQL</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>AES-256-GCM Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
