import React, { useState } from 'react';
import { Logo } from './Logo';
import { Language, NavTab, UserRole } from '../types';
import { getContent } from './LanguageContent';
import { ChevronDown, Menu, X } from 'lucide-react';

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
  const t = getContent(language).nav;

  const languages: { code: Language; label: string }[] = [
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'English' },
    { code: 'hinglish', label: 'Hinglish' },
  ];

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#E5E7EB] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
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
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {currentUser?.role === 'lawyer' ? (
              <>
                <button
                  onClick={() => handleNavClick('home')}
                  className={`text-sm font-semibold transition-colors cursor-pointer ${
                    currentTab === 'home'
                      ? 'text-[#0F1D38] border-b-2 border-[#D98800] pb-1'
                      : 'text-[#4B5563] hover:text-[#0F1D38]'
                  }`}
                >
                  Home
                </button>

                <button
                  onClick={() => handleNavClick('how-it-works')}
                  className={`text-sm font-semibold transition-colors cursor-pointer ${
                    currentTab === 'how-it-works'
                      ? 'text-[#0F1D38] border-b-2 border-[#D98800] pb-1'
                      : 'text-[#4B5563] hover:text-[#0F1D38]'
                  }`}
                >
                  How It Works
                </button>

                <button
                  onClick={() => handleNavClick('for-lawyers')}
                  className={`text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
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
                  className={`text-sm font-semibold transition-colors cursor-pointer ${
                    currentTab === 'home'
                      ? 'text-[#0F1D38] border-b-2 border-[#D98800] pb-1'
                      : 'text-[#4B5563] hover:text-[#0F1D38]'
                  }`}
                >
                  {t.home}
                </button>

                <button
                  onClick={() => handleNavClick('how-it-works')}
                  className={`text-sm font-semibold transition-colors cursor-pointer ${
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
                    className={`text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      currentTab === 'my-cases'
                        ? 'text-[#D98800] font-bold border-b-2 border-[#D98800] pb-1'
                        : 'text-[#1F3864] hover:text-[#D98800]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#D98800]" />
                    <span>My Dashboard (डैशबोर्ड)</span>
                  </button>
                )}

                {/* Resources Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setResourcesOpen(!resourcesOpen)}
                    className="flex items-center gap-1 text-sm font-semibold text-[#4B5563] hover:text-[#0F1D38] transition-colors cursor-pointer"
                  >
                    <span>Resources</span>
                    <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                  </button>

                  {resourcesOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-lg py-2 z-50">
                      <button
                        onClick={() => {
                          handleNavClick('chat');
                          setResourcesOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                      >
                        AI Legal Chat
                      </button>
                      <button
                        onClick={() => {
                          handleNavClick('documents');
                          setResourcesOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                      >
                        Document Analysis
                      </button>
                      <button
                        onClick={() => {
                          handleNavClick('lawyers');
                          setResourcesOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                      >
                        Find Lawyers
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* Right: Advocate subtle badge + Language Switcher & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Advocate portal tiny link — only visible when not logged in */}
            {!currentUser && (
              <button
                onClick={() => handleNavClick('for-lawyers')}
                className="text-[10px] font-semibold text-[#94A3B8] hover:text-[#D98800] border border-[#E5E7EB] hover:border-[#D98800] px-2.5 py-1 rounded-full transition-all cursor-pointer"
              >
                ⚖️ Advocate?
              </button>
            )}
            <div className="relative group">
              <div className="flex items-center gap-1 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#374151] cursor-pointer">
                <span>{language === 'hi' ? 'हिंदी' : language === 'en' ? 'English' : 'Hinglish'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
              </div>

              {/* Language Dropdown */}
              <div className="absolute top-full right-0 mt-1 w-32 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-md py-1 hidden group-hover:block z-50">
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

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick(currentUser.role === 'lawyer' ? 'for-lawyers' : 'my-cases')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-[#0F172A] bg-[#DCFCE7] border border-[#86EFAC] hover:bg-[#BBF7D0] transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                  title={`Logged in as ${currentUser.email}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="truncate max-w-[140px]">
                    {currentUser.name && currentUser.name.trim().length > 0
                      ? currentUser.name
                      : currentUser.email
                      ? currentUser.email.split('@')[0].toUpperCase()
                      : 'User'}
                  </span>
                  <span className="text-[10px] bg-[#16A34A] text-[#FFFFFF] px-1.5 py-0.5 rounded-md font-extrabold">
                    Logged In
                  </span>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FCA5A5] transition-colors cursor-pointer"
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
                  className="px-4 py-2 rounded-xl text-sm font-bold text-[#374151] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                >
                  Login
                </button>

                {/* Sign Up Button */}
                <button
                  onClick={onOpenAuth}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-[#FFFFFF] bg-[#D98800] hover:bg-[#C27900] transition-colors shadow-xs cursor-pointer"
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
                  onClick={() => handleNavClick('chat')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                    currentTab === 'chat' ? 'bg-[#FEF3C7] text-[#D98800]' : 'text-[#374151]'
                  }`}
                >
                  AI Legal Chat
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

          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
            <button
              onClick={onOpenAuth}
              className="w-1/2 mr-2 bg-[#F3F4F6] text-[#374151] font-bold py-2.5 rounded-xl text-sm"
            >
              Login
            </button>
            <button
              onClick={onOpenAuth}
              className="w-1/2 ml-2 bg-[#D98800] text-[#FFFFFF] font-bold py-2.5 rounded-xl text-sm shadow-sm"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
