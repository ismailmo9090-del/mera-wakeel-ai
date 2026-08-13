/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Language, NavTab, UserRole } from './types';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { HowItWorksSection } from './components/HowItWorksSection';
import { StatsBanner } from './components/StatsBanner';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AuthView } from './components/views/AuthView';
import { ChatView } from './components/views/ChatView';
import { DocumentsView } from './components/views/DocumentsView';
import { LawyersView } from './components/views/LawyersView';
import { AdvocateDirectoryView } from './components/views/AdvocateDirectoryView';
import { SettingsView } from './components/views/SettingsView';
import { ForLawyersView } from './components/views/ForLawyersView';
import { MyCasesView } from './components/views/MyCasesView';
import { PrivacyPolicyView } from './components/views/PrivacyPolicyView';
import { TermsConditionsView } from './components/views/TermsConditionsView';
import { DraftDocumentView } from './components/views/DraftDocumentView';
import { FreeLegalAidView } from './components/views/FreeLegalAidView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { HelpView } from './components/views/HelpView';
import { supabase, fetchProfile, createOrUpdateProfile, resolveDisplayName, createCase, fetchUserCases } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

// ---------------------------------------------------------------------------
// URL ROUTING — multi-page paths for every tab (History API).
// Back/forward buttons work natively and pages are deep-linkable.
// ---------------------------------------------------------------------------
const TAB_PATHS: Record<NavTab, string> = {
  home: '/',
  'how-it-works': '/how-it-works',
  auth: '/login',
  'for-lawyers': '/for-lawyers',
  'my-cases': '/my-cases',
  chat: '/chat',
  lawyers: '/lawyers',
  advocates: '/advocates',
  documents: '/documents',
  settings: '/settings',
  privacy: '/privacy',
  terms: '/terms',
  'draft-documents': '/draft-documents',
  'free-legal-aid': '/free-legal-aid',
  admin: '/admin',
  help: '/help',
};

function tabFromPath(path: string): NavTab {
  const match = (Object.entries(TAB_PATHS) as Array<[NavTab, string]>).find(([, p]) => p === path);
  return match ? match[0] : 'home';
}

// Maps the stored profile.preferred_language value (e.g. 'hindi', 'tamil') to the app Language code.
function languageFromProfile(lang?: string | null): Language {
  switch (lang?.toLowerCase()) {
    case 'english': return 'en';
    case 'hinglish': return 'hinglish';
    case 'tamil': return 'ta';
    case 'telugu': return 'te';
    case 'marathi': return 'mr';
    case 'bengali': return 'bn';
    case 'kannada': return 'kn';
    case 'gujarati': return 'gu';
    case 'hindi':
    default: return 'hi';
  }
}

export default function App() {
  // Default language is Hindi ('hi')
  const [language, setLanguage] = useState<Language>('hi');
  const [currentTab, setCurrentTab] = useState<NavTab>(() => tabFromPath(window.location.pathname));
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('citizen');
  const [pendingRedirectTab, setPendingRedirectTab] = useState<NavTab | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    email: string;
    role: UserRole;
    name?: string;
  } | null>(null);
  const [lawyerDirectoryCategory, setLawyerDirectoryCategory] = useState<string | null>(null);

  const PROTECTED_TABS: NavTab[] = [
    'my-cases',
    'chat',
    'documents',
    'settings',
    'draft-documents',
    'lawyers',
    'admin',
  ];

  // Keep up-to-date refs so the popstate listener (registered once) can read
  // the current auth state and tab without re-subscribing.
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const currentTabRef = useRef(currentTab);
  currentTabRef.current = currentTab;

  // Browser Back/Forward:
  // - Derives the tab from the URL and re-renders (in-app navigation).
  // - If Back lands on the same tab (i.e. the app root / a sentinel entry),
  //   it pushes a new entry so the user can NEVER navigate out of the site.
  // - A sentinel entry is added on first load so Back from the root does not
  //   drop the user onto the external referrer page.
  useEffect(() => {
    if (!sessionStorage.getItem('mw_sentinel_used')) {
      window.history.pushState({ mw: true }, '', window.location.pathname);
      sessionStorage.setItem('mw_sentinel_used', '1');
    }

    const handlePop = () => {
      let tab = tabFromPath(window.location.pathname);
      if (PROTECTED_TABS.includes(tab) && !currentUserRef.current) {
        tab = 'auth';
      } else if (tab === 'auth' && currentUserRef.current) {
        tab = currentUserRef.current.role === 'lawyer' ? 'for-lawyers' : 'my-cases';
      }
      const didChange = tab !== currentTabRef.current;
      currentTabRef.current = tab;
      setCurrentTab(tab);
      window.scrollTo({ top: 0, behavior: 'auto' });
      if (!didChange) {
        window.history.pushState({ mw: true }, '', TAB_PATHS[tab]);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Tab change (via navigation) -> push the matching URL path.
  const prevTabRef = useRef(currentTab);
  useEffect(() => {
    if (prevTabRef.current === currentTab) return;
    prevTabRef.current = currentTab;
    const path = TAB_PATHS[currentTab];
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }, [currentTab]);

  useEffect(() => {
    const titleMap: Record<NavTab, string> = {
      'home': 'Mera Wakeel AI — Apna Personal Legal Guide',
      'how-it-works': 'How It Works — Mera Wakeel AI',
      'for-lawyers': 'Advocate Portal — Mera Wakeel AI',
      'my-cases': 'My Cases — Mera Wakeel AI',
      'chat': 'AI Legal Consultation — Mera Wakeel AI',
      'lawyers': 'Find Verified Lawyers — Mera Wakeel AI',
      'advocates': 'Find & Contact Verified Advocates — Mera Wakeel AI',
      'documents': 'Legal Document Reader — Mera Wakeel AI',
      'settings': 'Settings & Privacy — Mera Wakeel AI',
      'privacy': 'Privacy Policy — Mera Wakeel AI',
      'terms': 'Terms & Conditions — Mera Wakeel AI',
      'auth': 'Login & Register — Mera Wakeel AI',
      'draft-documents': 'AI Document Drafting — Mera Wakeel AI',
      'free-legal-aid': 'Free Government Legal Aid — Mera Wakeel AI',
      'admin': 'Admin Dashboard — Mera Wakeel AI',
      'help': 'Help Center — Mera Wakeel AI',
    };
    document.title = titleMap[currentTab] || 'Mera Wakeel AI — Apna Personal Legal Guide';
  }, [currentTab]);

  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [activeCaseNotice, setActiveCaseNotice] = useState<string | null>(null);

  const handleStartNewCase = async () => {
    if (isCreatingCase) return;
    if (!currentUser) {
      setPendingRedirectTab('chat');
      setAuthInitialRole('citizen');
      setCurrentTab('auth');
      return;
    }
    setIsCreatingCase(true);
    try {
      const userId = currentUser.userId;
      const userCases = await fetchUserCases(userId);
      const activeCase = userCases?.find((c) => c.status !== 'closed' && c.status !== 'resolved');

      if (activeCase) {
        setActiveCaseId(activeCase.id);
        setCurrentTab('chat');
        setActiveCaseNotice(`⚠️ Aapka ek active case pehle se chal raha hai (${activeCase.title || 'Legal Consultation'}). Ek waqt mein sirf 1 active case chal sakta hai. Naya case shuru karne ke liye pehle pichhle case ko Close karein.`);
        setTimeout(() => setActiveCaseNotice(null), 6000);
        return;
      }

      const newCase = await createCase(userId, 'New Legal Consultation', 'other');
      setActiveCaseId(newCase.id);
      setCurrentTab('chat');
    } catch (err) {
      console.error('Error starting new case:', err);
    } finally {
      setIsCreatingCase(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initAuthSession() {
      if (!supabase) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const profile = await fetchProfile(session.user.id);
          const role: UserRole = profile?.user_type === 'lawyer' ? 'lawyer' : 'citizen';
          const name = resolveDisplayName({
            profile,
            metadata: session.user.user_metadata || null,
            email: session.user.email,
            phone: profile?.phone,
            role,
          });
          setCurrentUser({
            userId: session.user.id,
            email: session.user.email || '',
            role,
            name,
          });

          // Best-effort: persist the real name into the DB profile when the
          // profile row is empty but the auth metadata still has it, so the
          // navbar keeps showing the user's name after every refresh.
          const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
          if (profile && !profile.full_name && metaName) {
            createOrUpdateProfile({ ...profile, full_name: String(metaName).trim() }).catch(() => {});
          }

          if (profile?.preferred_language) {
            setLanguage(languageFromProfile(profile.preferred_language));
          }
        }
      } catch (err) {
        console.warn('Initial session lookup warning:', err);
      }
    }

    initAuthSession();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && isMounted) {
          const profile = await fetchProfile(session.user.id);
          const role: UserRole = profile?.user_type === 'lawyer' ? 'lawyer' : 'citizen';
          const name = resolveDisplayName({
            profile,
            metadata: session.user.user_metadata || null,
            email: session.user.email,
            phone: profile?.phone,
            role,
          });
          setCurrentUser({
            userId: session.user.id,
            email: session.user.email || '',
            role,
            name,
          });
        } else if (event === 'SIGNED_OUT' && isMounted) {
          setCurrentUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
        isMounted = false;
      };
    }
  }, []);

  // Direct URL guard: if a protected page is loaded while logged-out
  // (e.g. someone opens /chat directly), force them to the login page.
  useEffect(() => {
    if (!currentUser && PROTECTED_TABS.includes(currentTab)) {
      setPendingRedirectTab(currentTab);
      setAuthInitialRole('citizen');
      setCurrentTab('auth');
      window.history.replaceState({}, '', TAB_PATHS.auth);
      return;
    }
    // Logged-in users hitting the login page are sent to their dashboard.
    if (currentUser && currentTab === 'auth') {
      const target = pendingRedirectTab || (currentUser.role === 'lawyer' ? 'for-lawyers' : 'my-cases');
      setPendingRedirectTab(null);
      setCurrentTab(target);
      window.history.replaceState({}, '', TAB_PATHS[target]);
    }
  }, [currentUser, currentTab]);

  const handleTabChange = (tab: NavTab) => {
    // Logged-in users don't need the login page — go to their dashboard.
    if (tab === 'auth' && currentUser) {
      setCurrentTab(currentUser.role === 'lawyer' ? 'for-lawyers' : 'my-cases');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (PROTECTED_TABS.includes(tab) && !currentUser) {
      setPendingRedirectTab(tab);
      setAuthInitialRole('citizen');
      setCurrentTab('auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Role-based route guard:
    if (currentUser?.role === 'lawyer') {
      // Advocates cannot access citizen-only views
      const citizenOnlyTabs: NavTab[] = ['my-cases', 'chat', 'documents', 'lawyers', 'advocates'];
      if (citizenOnlyTabs.includes(tab)) {
        setCurrentTab('for-lawyers');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setCurrentTab(tab);
    if (tab === 'how-it-works') {
      const el = document.getElementById('how-it-works');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (role: UserRole = 'citizen') => {
    setAuthInitialRole(role);
    setCurrentTab('auth');
  };

  const handleLoginSuccess = (role: UserRole, email: string, userId?: string, profile?: any) => {
    const finalUserId = userId || `user_${Date.now()}`;
    const name = resolveDisplayName({
      profile,
      metadata: profile?.user_metadata || null,
      email,
      phone: profile?.phone,
      role,
    });
    setCurrentUser({
      userId: finalUserId,
      email,
      role,
      name,
    });

    if (profile?.preferred_language) {
      setLanguage(languageFromProfile(profile.preferred_language));
    }

    if (pendingRedirectTab) {
      const target = pendingRedirectTab;
      setPendingRedirectTab(null);
      setCurrentTab(target);
    } else if (role === 'lawyer') {
      setCurrentTab('for-lawyers');
    } else {
      setCurrentTab('my-cases');
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    // Clear all user-cached items from localStorage
    try {
      localStorage.removeItem('mw_user_uploaded_docs');
      localStorage.removeItem('mw_qa_history');
      localStorage.removeItem('mw_active_case_id');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mw_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (err) {}

    setCurrentUser(null);
    setCurrentTab('home');
  };

  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [incomingAdvocateMsg, setIncomingAdvocateMsg] = useState<{
    senderName: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    const handleLawyerMsg = (e: any) => {
      if (e.detail && e.detail.content) {
        setIncomingAdvocateMsg({
          senderName: e.detail.sender_name || 'Advocate',
          content: e.detail.content,
        });
      }
    };

    window.addEventListener('lawyer_message_received', handleLawyerMsg);
    return () => {
      window.removeEventListener('lawyer_message_received', handleLawyerMsg);
    };
  }, []);

  // Pages where Footer is required
  const SHOW_FOOTER_PAGES: NavTab[] = ['home', 'how-it-works', 'documents', 'settings', 'privacy', 'terms', 'lawyers', 'advocates', 'help', 'draft-documents', 'free-legal-aid'];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#111827] font-sans">
      
      {/* ADVOCATE MESSAGE NOTIFICATION BANNER */}
      {incomingAdvocateMsg && (
        <div className="sticky top-0 bg-[#0A1628] text-[#FFFFFF] border-b-2 border-[#D97706] px-4 py-3 shadow-xl z-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#D97706] text-[#FFFFFF] font-bold flex items-center justify-center shrink-0">
              💬
            </div>
            <div className="text-xs md:text-sm min-w-0">
              <p className="font-extrabold text-[#F59E0B] truncate">
                Message from {incomingAdvocateMsg.senderName}
              </p>
              <p className="text-slate-200 truncate font-medium">"{incomingAdvocateMsg.content}"</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIncomingAdvocateMsg(null);
                setCurrentTab('lawyers');
              }}
              className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-black rounded-xl cursor-pointer shadow-xs transition-all"
            >
              Open Chat (चैट खोलें)
            </button>
            <button
              onClick={() => setIncomingAdvocateMsg(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Sticky App Header & Top Navigation Bar */}
      {currentTab !== 'auth' && currentTab !== 'chat' && currentTab !== 'my-cases' && currentTab !== 'for-lawyers' && (
        <Navbar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          language={language}
          onLanguageChange={setLanguage}
          onOpenAuth={() => handleOpenAuth('citizen')}
          currentUser={currentUser}
          onLogout={handleLogout}
          pendingRequestsCount={pendingRequestsCount}
        />
      )}

      {/* Main View Area */}
      <main className="flex-grow flex flex-col relative">
        {activeCaseNotice && (
          <div className="bg-[#FEF3C7] border-b border-[#F59E0B]/30 px-4 py-3 text-xs md:text-sm font-bold text-[#92400E] flex items-center justify-between shadow-xs z-50 animate-fadeIn">
            <div className="flex items-center gap-2 max-w-5xl mx-auto">
              <span className="text-base">⚠️</span>
              <span>{activeCaseNotice}</span>
            </div>
            <button
              onClick={() => setActiveCaseNotice(null)}
              className="text-[#B45309] hover:text-[#78350F] p-1 font-black cursor-pointer text-base"
            >
              ✕
            </button>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-grow flex flex-col"
          >
            {currentTab === 'home' || currentTab === 'how-it-works' ? (
              <>
                {/* 1. Hero Section */}
                <HeroBanner
                  language={language}
                  onStartConsultation={() => handleTabChange('chat')}
                  onNavigate={handleTabChange}
                />

                {/* 2. 3-Step How It Works Section */}
                <HowItWorksSection
                  onStart={() => handleTabChange('chat')}
                />

                {/* 3. Dark Navy Stats Banner */}
                <StatsBanner />
              </>
            ) : currentTab === 'auth' ? (
              <AuthView
                language={language}
                onLoginSuccess={handleLoginSuccess}
                onGoToLawyerPortal={() => handleTabChange('for-lawyers')}
                onBackToHome={() => handleTabChange('home')}
                initialRole={authInitialRole}
              />
            ) : currentTab === 'for-lawyers' ? (
              <ForLawyersView
                language={language}
                currentUser={currentUser}
                onOpenLawyerAuth={() => handleOpenAuth('lawyer')}
                onBackToHome={() => handleTabChange('home')}
                onPendingCountChange={setPendingRequestsCount}
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
              />
            ) : currentTab === 'my-cases' ? (
              <MyCasesView
                language={language}
                userId={currentUser?.userId}
                currentUser={currentUser}
                onStartNewCase={handleStartNewCase}
                onSelectCase={(cId) => {
                  setActiveCaseId(cId);
                  setCurrentTab('chat');
                }}
                onBackToHome={() => handleTabChange('home')}
                onLogout={handleLogout}
              />
            ) : currentTab === 'chat' ? (
              <ChatView
                language={language}
                onLanguageChange={setLanguage}
                currentUser={currentUser}
                activeCaseId={activeCaseId}
                onBackToHome={() => handleTabChange('home')}
                onBackToCases={() => handleTabChange('my-cases')}
                onStartNewCase={handleStartNewCase}
                onFindLawyer={(category) => {
                  setLawyerDirectoryCategory(category || null);
                  setCurrentTab('lawyers');
                }}
              />
            ) : currentTab === 'documents' ? (
              <DocumentsView
                language={language}
                currentUser={currentUser}
                activeCaseId={activeCaseId}
                onBackToHome={() => handleTabChange('home')}
              />
            ) : currentTab === 'lawyers' ? (
              <LawyersView
                language={language}
                currentUser={currentUser}
                activeCaseId={activeCaseId}
                preSelectedCategory={lawyerDirectoryCategory}
                onBackToHome={() => handleTabChange('home')}
                onNavigateToChat={(cId) => {
                  if (cId) setActiveCaseId(cId);
                  setCurrentTab('chat');
                }}
                onRequireAuth={() => handleOpenAuth('citizen')}
              />
            ) : currentTab === 'advocates' ? (
              <AdvocateDirectoryView
                currentUser={currentUser}
                onBackToHome={() => handleTabChange('home')}
                onRequireAuth={() => handleOpenAuth('citizen')}
              />
            ) : currentTab === 'settings' ? (
              <SettingsView
                language={language}
                onBackToHome={() => handleTabChange('home')}
                currentUser={currentUser}
                onNavigate={handleTabChange}
              />
            ) : currentTab === 'privacy' ? (
              <PrivacyPolicyView
                language={language}
                onBackToHome={() => handleTabChange('home')}
                onNavigate={handleTabChange}
              />
            ) : currentTab === 'terms' ? (
              <TermsConditionsView
                language={language}
                onBackToHome={() => handleTabChange('home')}
                onNavigate={handleTabChange}
              />
            ) : currentTab === 'draft-documents' ? (
              <DraftDocumentView
                language={language}
                currentUser={currentUser}
                onBackToHome={() => handleTabChange('home')}
              />
            ) : currentTab === 'free-legal-aid' ? (
              <FreeLegalAidView
                language={language}
                onBackToHome={() => handleTabChange('home')}
              />
            ) : currentTab === 'admin' ? (
              <AdminDashboardView
                language={language}
                onBackToHome={() => handleTabChange('home')}
              />
            ) : currentTab === 'help' ? (
              <HelpView
                language={language}
                onBackToHome={() => handleTabChange('home')}
                onNavigate={handleTabChange}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Required Footer for specific pages */}
      {SHOW_FOOTER_PAGES.includes(currentTab) && (
        <Footer
          language={language}
          onTabChange={handleTabChange}
          onOpenAuth={handleOpenAuth}
          currentUser={currentUser}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialRole={authInitialRole}
        language={language}
        onLoginSuccess={handleLoginSuccess}
        onGoToLawyerPortal={() => handleTabChange('for-lawyers')}
      />

    </div>
  );
}
