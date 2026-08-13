import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { Language, NavTab, UserRole } from '../types';
import { getContent } from './LanguageContent';
import { LANGUAGES } from '../lib/language';
import { isLowBandwidth, setLowBandwidth } from '../lib/pwa';
import { ChevronDown, Menu, X, Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAuth: () => void;
  currentUser?: { email: string; role: UserRole; name?: string; userId?: string } | null;
  onLogout?: () => void;
  pendingRequestsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  language,
  onLanguageChange,
  onOpenAuth,
  currentUser,
  onLogout,
  pendingRequestsCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [lowBandwidth, setLowBandwidthState] = useState<boolean>(() => isLowBandwidth());
  const resourcesRef = useRef<HTMLDivElement>(null);
  const t = getContent(language).nav;

  // Close Resources dropdown on outside click / Escape
  useEffect(() => {
    if (!resourcesOpen) return;
    const handlePointer = (e: PointerEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setResourcesOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [resourcesOpen]);

  const toggleLowBandwidth = () => {
    const next = !lowBandwidth;
    setLowBandwidth(next);
    setLowBandwidthState(next);
  };

  const languages: { code: Language; label: string }[] = LANGUAGES.map((l) => ({
    code: l.code as Language,
    label: l.nativeLabel,
  }));

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#E5E7EB] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center text-left focus:outline-none rounded-lg p-1 transition-all cursor-pointer"
              aria-label="Mera Wakeel AI Home"
            >
              <Logo variant="dark" />
            </button>
          </div>

          {/* Center: Desktop Nav Links (Role-based separation) */}
          <nav className="hidden md:flex items-center space-x-3.5 lg:space-x-4">
            {currentUser?.role === 'lawyer' ? (
              <>
                <button
                  onClick={() => handleNavClick('home')}
                  className={`text-xs font-medium transition-colors cursor-pointer ${
                    currentTab === 'home'
                      ? 'text-[#0F1D38] border-b-2 border-[#D98800] pb-1'
                      : 'text-[#4B5563] hover:text-[#0F1D38]'
                  }`}
                >
                  Home
                </button>

                <button
                  onClick={() => handleNavClick('how-it-works')}
                  className={`text-xs font-medium transition-colors cursor-pointer ${
                    currentTab === 'how-it-works'
                      ? 'text-[#0F1D38] border-b-2 border-[#D98800] pb-1'
                      : 'text-[#4B5563] hover:text-[#0F1D38]'
                  }`}
                >
                  How It Works
                </button>

                <button
                  onClick={() => handleNavClick('for-lawyers')}
                  className={`text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    currentTab === 'for-lawyers'
                      ? 'text-[#D98800] border-b-2 border-[#D98800] pb-1'
                      : 'text-[#1F3864] hover:text-[#D98800]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#D98800]" />
                  <span>Advocate Dashboard</span>
                  {pendingRequestsCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold text-white bg-red-600 rounded-full animate-pulse">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('home')}
                  className={`text-xs font-medium transition-colors cursor-pointer ${
                    currentTab === 'home'
                      ? 'text-[#0F1D38] border-b-2 border-[#D98800] pb-1'
                      : 'text-[#4B5563] hover:text-[#0F1D38]'
                  }`}
                >
                  {t.home}
                </button>

                <button
                  onClick={() => handleNavClick('how-it-works')}
                  className={`text-xs font-medium transition-colors cursor-pointer ${
                    currentTab === 'how-it-works'
                      ? 'text-[#0F1D38] border-b-2 border-[#D98800] pb-1'
                      : 'text-[#4B5563] hover:text-[#0F1D38]'
                  }`}
                >
                  {t.howItWorks}
                </button>

                {currentUser && (
                  <button
                    onClick={() => handleNavClick('my-cases')}
                    className={`text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      currentTab === 'my-cases'
                        ? 'text-[#D98800] font-bold border-b-2 border-[#D98800] pb-1'
                        : 'text-[#1F3864] hover:text-[#D98800]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#D98800]" />
                    <span>My Dashboard (डैशबोर्ड)</span>
                  </button>
                )}

                <button
                  onClick={() => handleNavClick('help')}
                  className={`text-xs font-medium transition-colors cursor-pointer ${
                    currentTab === 'help'
                      ? 'text-[#D98800] font-bold border-b-2 border-[#D98800] pb-1'
                      : 'text-[#1F3864] hover:text-[#D98800]'
                  }`}
                >
                  Help (सहायता)
                </button>

                                {/* Resources Dropdown */}
                <div
                  ref={resourcesRef}
                  className="relative"
                  onMouseEnter={() => setResourcesOpen(true)}
                  onMouseLeave={() => setResourcesOpen(false)}
                >
                  <button
                    onClick={() => setResourcesOpen(!resourcesOpen)}
                    className="flex items-center gap-1 text-xs font-medium text-[#4B5563] hover:text-[#0F1D38] transition-colors cursor-pointer"
                    aria-haspopup="menu"
                    aria-expanded={resourcesOpen}
                  >
                    <span>Resources</span>
                    <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {resourcesOpen && (
                    <div className="absolute top-full right-0 w-48 pt-2 z-50">
                      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-lg py-2">
                        <button
                          onClick={() => {
                            handleNavClick('chat');
                            setResourcesOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        >
                          AI Legal Chat
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('documents');
                            setResourcesOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        >
                          Document Analysis
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('lawyers');
                            setResourcesOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        >
                          Find Lawyers
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('advocates');
                            setResourcesOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        >
                          Advocate Directory
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('draft-documents');
                            setResourcesOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        >
                          Draft Documents
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('free-legal-aid');
                            setResourcesOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        >
                          Free Govt Legal Aid
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* Right: Advocate subtle badge + Language Switcher & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Advocate portal tiny link — only visible when not logged in */}
            {!currentUser && (
              <button
                onClick={() => handleNavClick('for-lawyers')}
                className="text-[10px] font-semibold text-[#94A3B8] hover:text-[#D98800] border border-[#E5E7EB] hover:border-[#D98800] px-2.5 py-1 rounded-full transition-all cursor-pointer"
              >
                ⚖️ Advocate?
              </button>
            )}
            {/* Low-bandwidth (data-saver) toggle — item 9 */}
            <button
              onClick={() => toggleLowBandwidth()}
              className={`hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                lowBandwidth
                  ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                  : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#64748B] hover:bg-[#F3F4F6]'
              }`}
              title={
                lowBandwidth
                  ? 'Data-saver ON — lighter page, fewer images, cached content'
                  : 'Data-saver OFF — tap to reduce data usage'
              }
            >
              {lowBandwidth ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              <span className="hidden lg:inline">{lowBandwidth ? 'Data Saver' : 'Data Saver'}</span>
            </button>

            <div className="relative group">
              <div className="flex items-center gap-1 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-xs font-semibold text-[#374151] cursor-pointer">
                <span>{LANGUAGES.find((l) => l.code === language)?.nativeLabel || 'हिंदी'}</span>
                <ChevronDown className="w-3 h-3 text-[#6B7280]" />
              </div>

              {/* Language Dropdown */}
              <div className="absolute top-full right-0 w-40 pt-1 hidden group-hover:block z-50">
                <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-md py-1 max-h-72 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => onLanguageChange(lang.code)}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium ${
                        language === lang.code
                          ? 'bg-[#FEF3C7] text-[#D98800] font-bold'
                          : 'text-[#374151] hover:bg-[#F3F4F6]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleNavClick(currentUser.role === 'lawyer' ? 'for-lawyers' : 'my-cases')}
                  className="px-2.5 py-1 rounded-lg text-xs font-extrabold text-[#0F172A] bg-[#DCFCE7] border border-[#86EFAC] hover:bg-[#BBF7D0] transition-all cursor-pointer flex items-center gap-1.5"
                  title={`Logged in as ${currentUser.email}`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="truncate max-w-[100px]">
                    {currentUser.name && currentUser.name.trim().length > 0
                      ? currentUser.name
                      : currentUser.email
                      ? currentUser.email.split('@')[0]
                      : 'Citizen'}
                  </span>
                  <span className="text-[10px] bg-[#16A34A] text-[#FFFFFF] px-1.5 py-0.5 rounded-md font-extrabold">
                    Logged In
                  </span>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FCA5A5] transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Login Button */}
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#374151] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                >
                  Login
                </button>

                {/* Sign Up Button */}
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#FFFFFF] bg-[#D98800] hover:bg-[#C27900] transition-colors shadow-xs cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#374151] hover:bg-[#F3F4F6]"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#0F1D38]" /> : <Menu className="w-6 h-6 text-[#0F1D38]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFFFF] border-b border-[#E5E7EB] px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1 pt-2">
            {currentUser?.role === 'lawyer' ? (
              <>
                <button
                  onClick={() => handleNavClick('home')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                    currentTab === 'home' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavClick('how-it-works')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                    currentTab === 'how-it-works' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                  }`}
                >
                  How It Works
                </button>
                <button
                  onClick={() => handleNavClick('for-lawyers')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-bold bg-[#FEF3C7] text-[#D98800]`}
                >
                  ⚖️ Advocate Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('home')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                    currentTab === 'home' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                  }`}
                >
                  {t.home}
                </button>
                <button
                  onClick={() => handleNavClick('how-it-works')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                    currentTab === 'how-it-works' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                  }`}
                >
                  {t.howItWorks}
                </button>
                {currentUser && (
                  <button
                    onClick={() => handleNavClick('my-cases')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                      currentTab === 'my-cases' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                    }`}
                  >
                    My Dashboard (डैशबोर्ड)
                  </button>
                )}
                <button
                  onClick={() => handleNavClick('help')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                    currentTab === 'help' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                  }`}
                >
                  Help (सहायता)
                </button>
                <button
                  onClick={() => handleNavClick('chat')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                    currentTab === 'chat' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                  }`}
                >
                  AI Legal Chat
                </button>
                <button
                  onClick={() => handleNavClick('advocates')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                    currentTab === 'advocates' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                  }`}
                >
                  Advocate Directory
                </button>
                <button
                  onClick={() => handleNavClick('draft-documents')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                    currentTab === 'draft-documents' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                  }`}
                >
                  Draft Documents
                </button>
                <button
                  onClick={() => handleNavClick('free-legal-aid')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                    currentTab === 'free-legal-aid' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                  }`}
                >
                  Free Govt Legal Aid
                </button>
                {!currentUser && (
                  <button
                    onClick={() => handleNavClick('for-lawyers')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-[#D98800] flex items-center gap-1.5"
                  >
                    <span>⚖️</span>
                    <span>Advocate Portal (वकील)</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="pt-2 border-t border-[#E5E7EB]">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick(currentUser.role === 'lawyer' ? 'for-lawyers' : 'my-cases')}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-extrabold text-[#0F172A] bg-[#DCFCE7] border border-[#86EFAC]"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse shrink-0" />
                  <span className="truncate">
                    {currentUser.name && currentUser.name.trim().length > 0
                      ? currentUser.name
                      : currentUser.email
                      ? currentUser.email.split('@')[0]
                      : 'Citizen'}
                  </span>
                  <span className="text-[10px] bg-[#16A34A] text-[#FFFFFF] px-1.5 py-0.5 rounded-md font-extrabold shrink-0">
                    Logged In
                  </span>
                </button>
                {onLogout && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="px-3 py-2.5 rounded-xl text-sm font-bold text-[#DC2626] bg-[#FEF2F2] border border-[#FCA5A5]"
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={onOpenAuth}
                  className="flex-1 bg-[#F3F4F6] text-[#374151] font-bold py-2.5 rounded-xl text-sm"
                >
                  Login
                </button>
                <button
                  onClick={onOpenAuth}
                  className="flex-1 bg-[#D98800] text-[#FFFFFF] font-bold py-2.5 rounded-xl text-sm shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile language switcher */}
          <div className="pt-2 border-t border-[#E5E7EB]">
            <div className="flex gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    language === lang.code
                      ? 'bg-[#0F1D38] text-[#FFFFFF] border-[#0F1D38]'
                      : 'bg-[#FFFFFF] text-[#374151] border-[#E5E7EB]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};