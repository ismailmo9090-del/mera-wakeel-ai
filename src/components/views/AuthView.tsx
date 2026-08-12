import React, { useState, useEffect } from 'react';
import { Language, UserRole } from '../../types';
import { CitySelect } from '../CitySelect';
import { StateSelect } from '../StateSelect';
import { Logo } from '../Logo';
import { APP_CONFIG } from '../../constants';
import { supabase, fetchProfile } from '../../lib/supabase';
import {
  Mail,
  Lock,
  User,
  Phone,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Briefcase,
  Award,
  BookOpen,
} from 'lucide-react';

interface AuthViewProps {
  language: Language;
  onLoginSuccess: (role: UserRole, email: string, userId?: string, profile?: any) => void;
  onGoToLawyerPortal?: () => void;
  onBackToHome: () => void;
  initialRole?: UserRole;
}

const ALL_SPECIALTIES = [
  'Property Law',
  'Family Law',
  'Consumer Law',
  'Labour Law',
  'Criminal Law',
  'Civil Litigation',
  'Corporate Law',
  'Revenue Law',
  'Matrimonial Law',
  'Cyber Law',
];

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

export const AuthView: React.FC<AuthViewProps> = ({
  language,
  onLoginSuccess,
  onBackToHome,
  initialRole = 'citizen',
}) => {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Sync role state when initialRole prop changes
  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [preferredLang, setPreferredLang] = useState<Language>(language || 'hi');
  const [showPassword, setShowPassword] = useState(false);

  // Advocate specific fields
  const [barNumber, setBarNumber] = useState('');
  const [yearsExp, setYearsExp] = useState('5');
  const [regSpecialties, setRegSpecialties] = useState<string[]>(['Property Law', 'Family Law']);
  const [regBio, setRegBio] = useState('');
  const [regFee, setRegFee] = useState('1500');

  // UI feedback states
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleSpecialty = (spec: string) => {
    if (regSpecialties.includes(spec)) {
      if (regSpecialties.length > 1) {
        setRegSpecialties(regSpecialties.filter((s) => s !== spec));
      }
    } else {
      setRegSpecialties([...regSpecialties, spec]);
    }
  };

  const handleModeChange = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();

    // Field validation for signup
    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMessage('Kripya apna poora naam likhein');
        return;
      }
      if (!phone.trim() || phone.length < 10) {
        setErrorMessage('Kripya valid 10-digit mobile number enter karein');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password kam se kam 6 characters ka hona chahiye');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Password aur Confirm Password match nahi kar rahe hain');
        return;
      }
      if (role === 'lawyer' && !barNumber.trim()) {
        setErrorMessage('Kripya State Bar Council Registration Number darj karein');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        // Registration
        const signupPayload = {
          email: cleanEmail,
          password,
          full_name: fullName.trim(),
          phone: phone.trim(),
          user_type: role,
          preferred_language: preferredLang === 'en' ? 'english' : preferredLang === 'hinglish' ? 'hinglish' : 'hindi',
          city,
          state,
          // Advocate specific fields (passed if lawyer)
          ...(role === 'lawyer' && {
            bar_council_number: barNumber.trim(),
            years_experience: parseInt(yearsExp, 10) || 5,
            specialty: regSpecialties,
            bio: regBio.trim() || `Advocate enrolled with State Bar Council. Specializing in ${regSpecialties.join(', ')}`,
            consultation_fee_range: `₹${regFee} / session`,
          }),
        };

        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signupPayload),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          setErrorMessage(data.error || 'Registration failed. Kripya details check karein.');
          setIsSubmitting(false);
          return;
        }

        const userId = data.user?.id;
        if (supabase && userId) {
          await supabase.auth.signInWithPassword({ email: cleanEmail, password }).catch(() => {});
        }

        setIsSubmitting(false);
        onLoginSuccess(role, cleanEmail, userId, data.profile);
        return;

      } else {
        // Login — automatically detect role from database after login
        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (error) {
            setErrorMessage('Galat Email ya Password. Kripya details check karke punah prayas karein.');
            setIsSubmitting(false);
            return;
          }

          if (data?.user) {
            const profile = await fetchProfile(data.user.id);
            const detectedRole: UserRole = profile?.user_type === 'lawyer' ? 'lawyer' : 'citizen';
            setIsSubmitting(false);
            onLoginSuccess(detectedRole, data.user.email || cleanEmail, data.user.id, profile);
            return;
          }
        }

        setErrorMessage('Database authentication failed. Kripya valid login credentials enter karein.');
        setIsSubmitting(false);
        return;
      }

    } catch (err: any) {
      const msg = cleanErrorMessage(err, 'An error occurred during authentication.');
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row select-none overflow-y-auto">

      {/* LEFT PANE — Premium Navy Branding */}
      <div className="lg:w-[420px] xl:w-[460px] bg-gradient-to-b from-[#0F1D38] via-[#162B50] to-[#0A1424] text-[#FFFFFF] p-5 sm:p-8 flex flex-col justify-between shrink-0 h-auto lg:min-h-screen overflow-y-auto relative shadow-xl border-b lg:border-b-0 lg:border-r border-[#FFFFFF]/10">

        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 lg:space-y-6 z-10">
          <div className="flex items-center justify-between">
            <Logo variant="light" />
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs text-[#D4A017] hover:text-[#FFFFFF] bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 px-3 py-1.5 rounded-full transition-all cursor-pointer font-bold border border-[#D4A017]/40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Homepage</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#FFFFFF]/10 border border-[#D4A017]/50 text-[#D4A017] px-3.5 py-1 rounded-full text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>
              {role === 'lawyer' ? 'Advocate Legal Portal (वकील)' : 'Citizen Kanooni Portal (नागरिक)'}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-[#FFFFFF] leading-tight">
              {role === 'lawyer'
                ? 'Empowering Advocates with AI Research & Client Connect'
                : APP_CONFIG.subtitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed opacity-90">
              {role === 'lawyer'
                ? 'Access automated summaries, client case timelines, key evidence analysis & secure messaging.'
                : 'Simple Hindi & English me instant kanooni guidance, document analysis aur verified advocates se direct connect.'}
            </p>
          </div>

          <div className="hidden sm:block space-y-2.5 pt-2">
            {role === 'lawyer' ? (
              <>
                <div className="flex items-start gap-3 text-xs text-[#F8FAFC]">
                  <CheckCircle className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
                  <span>AI Pre-Analysis & Timeline Extractor</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-[#F8FAFC]">
                  <CheckCircle className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
                  <span>State Bar Council Verification Badge</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-[#F8FAFC]">
                  <CheckCircle className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
                  <span>0% Commission on Client Consultations</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 text-xs text-[#F8FAFC]">
                  <CheckCircle className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
                  <span>100% Free AI Instant Legal Advisory</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-[#F8FAFC]">
                  <CheckCircle className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
                  <span>Supreme Court & High Court Precedents</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-[#F8FAFC]">
                  <CheckCircle className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
                  <span>Verified State Bar Council Advocates</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="hidden lg:flex pt-6 mt-6 border-t border-[#FFFFFF]/15 z-10 items-center justify-between">
          <span className="text-xs text-[#CBD5E1] flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
            Digital India Legal AI
          </span>
          <span className="text-xs text-[#D4A017] font-semibold">v2.5</span>
        </div>
      </div>

      {/* RIGHT PANE — Auth Form */}
      <div className="flex-1 bg-[#FFFFFF] flex flex-col min-h-screen overflow-y-auto">

        {/* Mobile nav bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] lg:hidden">
          <Logo />
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1 text-xs text-[#1F3864] font-bold bg-[#F1F5F9] px-3 py-1.5 rounded-full"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#D4A017]" />
            Home
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] bg-[#FFFFFF] shrink-0">
          <div className="max-w-md mx-auto">
            <div className="flex bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1]">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#0F1D38] text-[#FFFFFF] shadow-md'
                    : 'text-[#64748B] hover:text-[#0F1D38]'
                }`}
              >
                Login (लॉगिन)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#0F1D38] text-[#FFFFFF] shadow-md'
                    : 'text-[#64748B] hover:text-[#0F1D38]'
                }`}
              >
                Register (साइन अप)
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-md mx-auto space-y-5">

            <div>
              <h2 className="text-xl font-extrabold text-[#0F172A]">
                {role === 'lawyer'
                  ? mode === 'signup'
                    ? 'Advocate Account Registration'
                    : 'Advocate Portal Login'
                  : mode === 'signup'
                  ? 'Citizen Account Registration'
                  : 'Citizen Account Login'}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {mode === 'signup'
                  ? 'Niche diye gaye details bharein — 2 minute me active ho jaayein'
                  : 'Apna registered email aur password enter karein'}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* SIGNUP EXTRA FIELDS */}
              {mode === 'signup' && (
                <>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl space-y-3">
                    <div className="text-xs font-extrabold text-[#0F1D38] uppercase tracking-wider border-b border-[#E2E8F0] pb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#D4A017]" />
                      <span>{role === 'lawyer' ? 'Advocate Profile Info' : 'Personal Information'}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#334155] mb-1">
                          Full Name (पूरा नाम) <span className="text-[#DC2626]">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={role === 'lawyer' ? 'Adv. Rajesh Sharma' : 'e.g. Ramesh Kumar Sharma'}
                            className="w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#D4A017] rounded-lg pl-9 pr-3 py-2 text-xs outline-none text-[#0F172A]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#334155] mb-1">
                          Mobile Number <span className="text-[#DC2626]">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="10-digit number"
                            className="w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#D4A017] rounded-lg pl-9 pr-3 py-2 text-xs outline-none text-[#0F172A]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ADVOCATE SPECIFIC SIGNUP FIELDS */}
                    {role === 'lawyer' && (
                      <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#334155] mb-1">
                              Bar Council Enrollment No. <span className="text-[#DC2626]">*</span>
                            </label>
                            <div className="relative">
                              <Briefcase className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                              <input
                                type="text"
                                required
                                value={barNumber}
                                onChange={(e) => setBarNumber(e.target.value)}
                                placeholder="e.g. D/2048/2018"
                                className="w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#D4A017] rounded-lg pl-9 pr-3 py-2 text-xs font-mono outline-none text-[#0F172A]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#334155] mb-1">
                              Years of Experience <span className="text-[#DC2626]">*</span>
                            </label>
                            <div className="relative">
                              <Award className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                              <input
                                type="number"
                                required
                                min="0"
                                max="60"
                                value={yearsExp}
                                onChange={(e) => setYearsExp(e.target.value)}
                                className="w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#D4A017] rounded-lg pl-9 pr-3 py-2 text-xs outline-none text-[#0F172A]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#334155] mb-1">
                              Consultation Fee (₹)
                            </label>
                            <input
                              type="number"
                              value={regFee}
                              onChange={(e) => setRegFee(e.target.value)}
                              className="w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#D4A017] rounded-lg px-3 py-2 text-xs outline-none text-[#0F172A]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#334155] mb-1">Practice City</label>
                            <CitySelect required value={city} onChange={(c) => setCity(c)} />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#334155] mb-1.5">Specialties</label>
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_SPECIALTIES.map((spec) => {
                              const sel = regSpecialties.includes(spec);
                              return (
                                <button
                                  key={spec}
                                  type="button"
                                  onClick={() => handleToggleSpecialty(spec)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                    sel
                                      ? 'bg-[#0F1D38] text-[#FFFFFF] border-[#0F1D38]'
                                      : 'bg-[#FFFFFF] text-[#64748B] border-[#CBD5E1] hover:border-[#D4A017]'
                                  }`}
                                >
                                  {sel ? `✓ ${spec}` : spec}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#334155] mb-1">Short Bio</label>
                          <textarea
                            rows={2}
                            value={regBio}
                            onChange={(e) => setRegBio(e.target.value)}
                            placeholder="Describe your background and courts practiced in..."
                            className="w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#D4A017] rounded-lg px-3 py-2 text-xs outline-none text-[#0F172A] leading-relaxed"
                          />
                        </div>
                      </div>
                    )}

                    {/* CITIZEN SPECIFIC FIELDS */}
                    {role === 'citizen' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#334155] mb-1">State (राज्य)</label>
                          <StateSelect required value={state} onChange={(s) => setState(s)} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#334155] mb-1">City (शहर)</label>
                          <CitySelect required value={city} onChange={(c) => setCity(c)} />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#334155] mb-1">Language Preference</label>
                      <div className="flex gap-2">
                        {(['hi', 'en', 'hinglish'] as Language[]).map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setPreferredLang(l)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              preferredLang === l
                                ? 'bg-[#0F1D38] text-[#FFFFFF] border-[#0F1D38]'
                                : 'bg-[#FFFFFF] text-[#64748B] border-[#CBD5E1] hover:border-[#D4A017]'
                            }`}
                          >
                            {l === 'hi' ? 'हिंदी' : l === 'en' ? 'English' : 'Hinglish'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Email Address <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'lawyer' ? 'advocate@barcouncil.in' : 'apna@email.com'}
                    className="w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#D4A017] rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none text-[#0F172A]"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Password (पासवर्ड) <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#D4A017] rounded-xl pl-9 pr-10 py-2.5 text-xs outline-none text-[#0F172A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F1D38] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    Confirm Password <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#D4A017] rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none text-[#0F172A]"
                    />
                  </div>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#FFFFFF] font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">{mode === 'signup' ? 'Creating Account...' : 'Logging in...'}</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
                    <span>{mode === 'signup' ? 'Create Account' : 'Login to Portal'}</span>
                  </>
                )}
              </button>

              {/* Toggle mode */}
              <p className="text-center text-xs text-[#64748B] pt-1">
                {mode === 'login' ? (
                  <>
                    Naya account nahi hai?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeChange('signup')}
                      className="text-[#D98800] font-bold hover:underline cursor-pointer"
                    >
                      Register karein →
                    </button>
                  </>
                ) : (
                  <>
                    Pehle se account hai?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeChange('login')}
                      className="text-[#D98800] font-bold hover:underline cursor-pointer"
                    >
                      Login karein →
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
