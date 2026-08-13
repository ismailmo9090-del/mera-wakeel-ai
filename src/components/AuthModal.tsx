import React, { useState } from 'react';
import { UserRole, Language } from '../types';
import { supabase, fetchProfile, createOrUpdateProfile, trackEvent } from '../lib/supabase';
import { CitySelect } from './CitySelect';
import { StateSelect } from './StateSelect';
import { Logo } from './Logo';
import { X, User, Mail, Lock, Phone, ArrowRight, ShieldCheck, Briefcase, MapPin } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  language: Language;
  onLoginSuccess: (role: UserRole, email: string, userId?: string, profile?: any) => void;
  onGoToLawyerPortal?: () => void;
}

// Utility to ensure error messages are clean and never render `{}` or raw JSON objects
function cleanErrorMessage(error: any, fallbackMessage: string): string {
  if (!error) return fallbackMessage;
  let msg = typeof error === 'string' ? error : error.message || error.error_description || '';
  if (typeof msg === 'object') {
    try { msg = JSON.stringify(msg); } catch { msg = ''; }
  }
  msg = String(msg).trim();
  if (!msg || msg === '{}' || msg === '[object Object]' || msg.includes('Invalid login credentials')) {
    return fallbackMessage;
  }
  return msg;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  onLoginSuccess,
  onGoToLawyerPortal,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('New Delhi, Delhi');
  const [state, setState] = useState('Delhi');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lawyerNotice, setLawyerNotice] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return;
    setErrorMessage('');
    setLawyerNotice(false);

    const cleanEmail = email.trim().toLowerCase();

    if (isSignUp) {
      if (!fullName.trim()) {
        setErrorMessage('Kripya apna poora naam likhein (Please enter your full name)');
        return;
      }
      if (!phone.trim() || phone.length < 10) {
        setErrorMessage('Kripya 10-digit phone number likhein (Please enter a valid phone number)');
        return;
      }
      if (!state) {
        setErrorMessage('Kripya State (राज्य) select karein');
        return;
      }
      if (!city) {
        setErrorMessage('Kripya City (शहर) select karein');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Password aur Confirm Password match nahi ho rahe (Passwords do not match)');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password kam se kam 6 characters ka hona chahiye');
        return;
      }
      if (!termsAccepted) {
        setErrorMessage('Kripya Terms & Conditions (नियम और शर्तें) accept karein — iske bina account nahi ban sakta');
        return;
      }
    }

    setSubmitted(true);

    try {
      if (isSignUp) {
        // Backend Signup Proxy Call
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            full_name: fullName.trim(),
            phone: phone.trim(),
            user_type: 'citizen',
            preferred_language: language,
            city,
            state,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          setErrorMessage(data.error || 'Registration failed. Kripya details re-check karein.');
          setSubmitted(false);
          return;
        }

        const realUserId = data.user?.id || `usr_${Date.now()}`;
        trackEvent('user_signed_up', { user_id: realUserId, user_type: 'citizen', state, city });

        // Auto sign in on client side
        if (supabase) {
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          }).catch(() => {});
        }

        onClose();
        setSubmitted(false);
        onLoginSuccess('citizen', cleanEmail, realUserId, data.profile);
        return;

      } else {
        // Auth Login
        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (error) {
            const msg = cleanErrorMessage(error, 'Galat Email ya Password. Kripya check karke punah prayas karein.');
            setErrorMessage(msg);
            setSubmitted(false);
            return;
          }

          if (data?.user) {
            const profile = await fetchProfile(data.user.id);
            const metaName = data.user.user_metadata?.full_name || '';
            const mergedProfile = profile
              ? { ...profile, full_name: profile.full_name || metaName || null }
              : metaName
              ? { full_name: metaName, user_type: 'citizen' }
              : null;
            
            if (profile?.user_type === 'lawyer') {
              setLawyerNotice(true);
              setSubmitted(false);
              return;
            }

            onClose();
            setSubmitted(false);
            onLoginSuccess('citizen', data.user.email || cleanEmail, data.user.id, mergedProfile);
            return;
          }
        }

        setErrorMessage('Database connection or credentials invalid. Login failed.');
        setSubmitted(false);
        return;
      }

    } catch (err: any) {
      console.error('AuthModal error:', err);
      const msg = cleanErrorMessage(err, 'Authentication error. Kripya details check karein.');
      setErrorMessage(msg);
      setSubmitted(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1D38]/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      
      <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full p-5 sm:p-8 border border-[#E5E7EB] shadow-2xl relative text-[#111827] max-h-[90vh] overflow-y-auto my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#6B7280] hover:text-[#0F1D38] rounded-xl hover:bg-[#F3F4F6] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo Header */}
        <div className="text-center space-y-2 mb-6 flex flex-col items-center">
          <Logo variant="dark" />
          <p className="text-xs text-[#64748B] font-medium pt-1">
            {isSignUp
              ? 'Naya account banayein aur instant legal consultation paayein'
              : 'Sign in to access your legal cases & chat history'}
          </p>
        </div>

        {/* Validation Error Box */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-medium rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        {/* Advocate Warning Notice */}
        {lawyerNotice && (
          <div className="mb-4 p-4 bg-[#FEF3C7] border border-[#F59E0B] rounded-2xl text-center space-y-2">
            <span className="text-xs font-bold text-[#92400E]">Advocate Account Detected!</span>
            <p className="text-xs text-[#78350F]">
              Aapka account Advocate (वकील) portal ke under hai. Kripya Wakeel Portal se login karein.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onGoToLawyerPortal) onGoToLawyerPortal();
              }}
              className="bg-[#1F3864] text-[#FFFFFF] font-bold px-4 py-2 rounded-xl text-xs shadow-sm hover:bg-[#1F3864]/90 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Advocate Portal Open Karein</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4A017]" />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Full Name field (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Full Name (पूरा नाम) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-[#D98800] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Phone Number field (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Phone Number (फ़ोन नंबर) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-[#D98800] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* State & City Selection (Sign Up only) */}
          {isSignUp && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  State (राज्य) *
                </label>
                <StateSelect
                  required
                  value={state}
                  onChange={(s) => setState(s)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  City (शहर) *
                </label>
                <CitySelect
                  required
                  value={city}
                  onChange={(c) => setCity(c)}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Email Address (ईमेल) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-[#D98800] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Password (पासवर्ड) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-[#D98800] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>
          </div>

          {/* Confirm Password field (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Confirm Password (पासवर्ड कन्फर्म करें) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-[#D98800] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Terms Acceptance (Sign Up only) */}
          {isSignUp && (
            <label className="flex items-start gap-2.5 cursor-pointer select-none bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#1F3864] cursor-pointer shrink-0"
              />
              <span className="text-xs text-[#374151] leading-relaxed">
                Main Mera Wakeel AI ke Terms &amp; Conditions (नियम और शर्तें) se sahamat hoon.{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1F3864] font-bold underline hover:text-[#D4A017]"
                >
                  Terms &amp; Conditions padhein →
                </a>
              </span>
            </label>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={submitted}
            className="w-full bg-[#1F3864] hover:bg-[#1F3864]/95 text-[#FFFFFF] font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all mt-3 cursor-pointer"
          >
            {submitted ? (
              <span>Account taiyar ho raha hai...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account & Continue' : 'Login to Account'}</span>
                <ArrowRight className="w-4 h-4 text-[#D4A017]" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Sign Up / Login */}
        <div className="mt-4 text-center text-xs text-[#4B5563]">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMessage('');
                  setLawyerNotice(false);
                }}
                className="text-[#1F3864] font-bold hover:underline cursor-pointer"
              >
                Login here
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMessage('');
                  setLawyerNotice(false);
                }}
                className="text-[#D4A017] font-bold hover:underline cursor-pointer"
              >
                Sign Up for free
              </button>
            </span>
          )}
        </div>

        {/* Lawyer Portal Redirect Link */}
        <div className="mt-5 pt-4 border-t border-[#E5E7EB] text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onGoToLawyerPortal) {
                onGoToLawyerPortal();
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F3864] hover:text-[#D4A017] transition-colors cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#D4A017]" />
            <span>Aap Wakeel hain? Go to Lawyer Portal (वकील पोर्टल)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
