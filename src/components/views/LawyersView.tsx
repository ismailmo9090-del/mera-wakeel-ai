import React, { useState, useEffect } from 'react';
import { Language, UserRole } from '../../types';
import { Lawyer, Case, Review } from '../../types/database';
import { fetchLawyersDirectory, createLawyerConnection, fetchUserCases, createCase, updateCaseStatus, generateUUID, fetchLawyerConnectionsForCitizen, fetchLawyerReviews, trackEvent } from '../../lib/supabase';
import { DirectMessagePanel } from '../DirectMessagePanel';
import { ReviewModal } from '../ReviewModal';
import { Logo } from '../Logo';
import {
  ArrowLeft,
  Share2,
  Heart,
  Briefcase,
  MapPin,
  Globe,
  CheckCircle2,
  MessageSquare,
  Search,
  ChevronRight,
  User,
  Send,
  Paperclip,
  Clock,
  ShieldCheck,
  Phone,
  FileText,
  Sparkles,
  X,
  Star,
} from 'lucide-react';

interface LawyersViewProps {
  language?: Language;
  currentUser?: {
    userId: string;
    email: string;
    role: UserRole;
    name?: string;
  } | null;
  activeCaseId?: string | null;
  preSelectedCategory?: string | null;
  onBackToHome: () => void;
  onNavigateToChat?: (caseId?: string) => void;
  onRequireAuth?: () => void;
}

interface DirectMessage {
  id: string;
  sender: 'user' | 'lawyer';
  text: string;
  timestamp: string;
}

export const LawyersView: React.FC<LawyersViewProps> = ({
  language = 'hi',
  currentUser,
  activeCaseId,
  preSelectedCategory,
  onBackToHome,
  onNavigateToChat,
  onRequireAuth,
}) => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(preSelectedCategory || 'all');
  const [isLoading, setIsLoading] = useState(true);

  // Cases State
  const [userCases, setUserCases] = useState<Case[]>([]);
  const [selectedCaseForRequest, setSelectedCaseForRequest] = useState<string | null>(activeCaseId || null);

  // Detail View State
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'stories' | 'faqs'>('about');
  const [selectedDate, setSelectedDate] = useState<number>(13);
  const [selectedTime, setSelectedTime] = useState<string>('11:00 AM');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Connection Request & Direct Advocate Chat States
  // Map of lawyer.id -> 'none' | 'pending' | 'accepted'
  const [requestStatuses, setRequestStatuses] = useState<Record<string, 'none' | 'pending' | 'accepted'>>({});
  const [connectionMap, setConnectionMap] = useState<Record<string, string>>({});
  const [activeAdvocateChat, setActiveAdvocateChat] = useState<Lawyer | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, DirectMessage[]>>({});
  const [inputMsg, setInputMsg] = useState('');

  // Review Modal State
  const [reviewingLawyer, setReviewingLawyer] = useState<Lawyer | null>(null);
  const [selectedLawyerReviews, setSelectedLawyerReviews] = useState<Review[]>([]);

  // Request Modal State & Toast State
  const [requestModalLawyer, setRequestModalLawyer] = useState<Lawyer | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [requestCategory, setRequestCategory] = useState('Property & Land Dispute');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Load reviews for selected lawyer
  useEffect(() => {
    if (selectedLawyer?.id) {
      fetchLawyerReviews(selectedLawyer.id)
        .then((revs) => setSelectedLawyerReviews(revs || []))
        .catch(() => setSelectedLawyerReviews([]));
    } else {
      setSelectedLawyerReviews([]);
    }
  }, [selectedLawyer?.id]);

  useEffect(() => {
    let isMounted = true;
    async function loadData(isBackground = false) {
      if (!isBackground) {
        setIsLoading(true);
      }
      try {
        // Always fetch lawyers directory from DB
        const lawyerData = await fetchLawyersDirectory();
        if (!isMounted) return;
        setLawyers(lawyerData);

        // Always fetch user cases for logged-in users and guest citizens
        const citizenId = currentUser?.userId || 'guest_citizen';
        const casesData = await fetchUserCases(citizenId);
        if (!isMounted) return;

        if (casesData && casesData.length > 0) {
          setUserCases(casesData);
          const activeCases = casesData.filter((c) => c.status !== 'closed');
          if (activeCases.length > 0) {
            setSelectedCaseForRequest((prev) => prev || activeCases[0].id);
          }
        } else {
          setUserCases([]);
        }

        // Load existing connections ONLY from Supabase DB — no localStorage fallback
        if (citizenId) {
          const existingConns = await fetchLawyerConnectionsForCitizen(citizenId);
          if (!isMounted) return;

          const statusMap: Record<string, 'none' | 'pending' | 'accepted'> = {};
          const connMap: Record<string, string> = {};

          if (existingConns && existingConns.length > 0) {
            existingConns.forEach((conn: any) => {
              const isAcc = conn.status === 'accepted' || conn.status === 'approved' || conn.status === 'lawyer_connected' || conn.status === 'completed';
              const isDeclined = conn.status === 'rejected' || conn.status === 'declined';
              const st: 'none' | 'pending' | 'accepted' = isAcc ? 'accepted' : isDeclined ? 'none' : 'pending';

              const connLawyerName = (conn.lawyer?.profile?.full_name || '').toLowerCase().trim();

              lawyerData.forEach((l) => {
                const lName = (l.profile?.full_name || '').toLowerCase().trim();
                const isIdMatch =
                  l.id === conn.lawyer_id ||
                  l.id === conn.lawyer?.id ||
                  l.profile_id === conn.lawyer_id ||
                  l.profile_id === conn.lawyer?.profile_id;

                const isNameMatch = Boolean(lName && connLawyerName && (lName.includes(connLawyerName) || connLawyerName.includes(lName)));

                if (isIdMatch || isNameMatch) {
                  if (statusMap[l.id] !== 'accepted') {
                    statusMap[l.id] = st;
                    connMap[l.id] = conn.id;
                  }
                }
              });

              const keys = [conn.lawyer_id, conn.lawyer?.id, conn.lawyer?.profile_id].filter(Boolean);
              keys.forEach((k) => {
                if (statusMap[k] !== 'accepted') {
                  statusMap[k] = st;
                  connMap[k] = conn.id;
                }
              });
            });
          }

          // Statuses derived strictly from verified DB rows
          setRequestStatuses(statusMap);
          setConnectionMap(connMap);
        } else {
          // Not logged in — clear connection state
          setUserCases([]);
          setRequestStatuses({});
          setConnectionMap({});
        }
      } catch (e) {
        console.error('Error loading lawyers directory or cases:', e);
      } finally {
        if (!isBackground && isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData(false);
    const interval = setInterval(() => loadData(true), 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.userId]);

  // Open Request Modal instantly & refresh latest active cases
  const handleOpenRequestModal = async (lawyer: Lawyer) => {
    setRequestModalLawyer(lawyer);
    setRequestNote('');

    const citizenId = currentUser?.userId || 'guest_citizen';
    let latestCases = await fetchUserCases(citizenId);
    if (!latestCases || latestCases.length === 0) {
      latestCases = await fetchUserCases('guest_citizen');
    }

    let activeCasesList = (latestCases && latestCases.length > 0) ? latestCases : userCases;

    // If still no cases found at all, auto-create a default legal case on the fly so the user is never blocked
    if (!activeCasesList || activeCasesList.length === 0) {
      try {
        const autoCase = await createCase(
          citizenId,
          `Legal Case - Adv. ${lawyer.profile?.full_name || 'Consultation'}`,
          lawyer.specialty?.[0] || 'property'
        );
        activeCasesList = [autoCase];
      } catch (err) {
        console.warn('Auto create case notice:', err);
      }
    }

    if (activeCasesList && activeCasesList.length > 0) {
      setUserCases(activeCasesList);
      const availableCases = activeCasesList.filter((c) => c.status !== 'closed' && c.status !== 'lawyer_connected' && !c.assigned_lawyer_id);
      if (availableCases.length > 0) {
        setSelectedCaseForRequest(availableCases[0].id);
      } else {
        setSelectedCaseForRequest(activeCasesList[0].id);
      }
    } else {
      setSelectedCaseForRequest(null);
    }
  };

  // Send request handler
  const handleConfirmSendRequest = async (lawyerId: string) => {
    if (requestStatuses[lawyerId] === 'pending' || requestStatuses[lawyerId] === 'accepted') return;

    const runningCases = userCases.filter((c) => c.status !== 'closed');
    if (runningCases.length === 0 || !selectedCaseForRequest) {
      setToastNotice('⚠️ Please create or select an active running case first before sending a consultation request.');
      setTimeout(() => setToastNotice(null), 5000);
      return;
    }

    const targetLawyer = lawyers.find((l) => l.id === lawyerId) || selectedLawyer || requestModalLawyer;
    const name = targetLawyer?.profile?.full_name || 'Advocate';

    // 1. Immediately update UI request status to pending
    setRequestStatuses((prev) => ({ ...prev, [lawyerId]: 'pending' }));
    setRequestModalLawyer(null);

    // 2. Call backend / local storage connection helper
    const citizenId = currentUser?.userId || 'guest_citizen_101';
    const caseIdToUse = selectedCaseForRequest;

    try {
      await createLawyerConnection(citizenId, lawyerId, caseIdToUse);
      trackEvent('lawyer_connection_requested', { lawyer_id: lawyerId, case_id: caseIdToUse, user_id: citizenId });
    } catch (e) {
      console.warn('Error creating lawyer connection:', e);
    }

    const selectedCaseObj = userCases.find((c) => c.id === caseIdToUse);
    const caseTitle = selectedCaseObj?.title || 'Active Legal Case';

    setToastNotice(`✅ Consultation request for "${caseTitle}" sent to Adv. ${name}! Waiting for advocate response.`);

    // Auto-clear toast notice after 5s
    setTimeout(() => {
      setToastNotice((curr) => (curr?.includes(`sent to Adv. ${name}`) ? null : curr));
    }, 5000);
  };

  // AI Automatic Lawyer Assignment Fallback
  const handleAiAutoAssignLawyer = async () => {
    if (lawyers.length === 0) return;

    // Pick top rated verified advocate matching selected category or highest overall
    const matchedLawyer = lawyers.find((l) => l.is_verified) || lawyers[0];
    const name = matchedLawyer.profile?.full_name || 'Advocate';
    const citizenId = currentUser?.userId || 'guest_citizen_101';
    const caseIdToUse = selectedCaseForRequest || activeCaseId || generateUUID();

    setRequestStatuses((prev) => ({ ...prev, [matchedLawyer.id]: 'pending' }));

    try {
      await createLawyerConnection(citizenId, matchedLawyer.id, caseIdToUse);
    } catch (e) {
      console.warn('Error in AI auto assign:', e);
    }

    setToastNotice(`🤖 AI Auto-Assigned Adv. ${name} for your case! Request sent to advocate portal.`);

    setTimeout(() => {
      setToastNotice((curr) => (curr?.includes(`AI Auto-Assigned Adv. ${name}`) ? null : curr));
    }, 5000);
  };

  // Open Direct Advocate Chat
  const handleOpenAdvocateChat = (lawyer: Lawyer) => {
    setActiveAdvocateChat(lawyer);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeAdvocateChat) return;

    const lawyerId = activeAdvocateChat.id;
    const userText = inputMsg;
    setInputMsg('');

    const newMsg: DirectMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => ({
      ...prev,
      [lawyerId]: [...(prev[lawyerId] || []), newMsg],
    }));

    // Auto reply from Advocate
    setTimeout(() => {
      const replyMsg: DirectMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'lawyer',
        text: `Dhanyawad. Maine aapka sandesh dekh liya hai. Kripya apne case ke zaruri documents yahan upload karein taaki hum agla step tay kar sakein.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => ({
        ...prev,
        [lawyerId]: [...(prev[lawyerId] || []), replyMsg],
      }));
    }, 1200);
  };

  const categories = [
    { id: 'all', label: 'All Lawyers (सभी वकील)' },
    { id: 'property', label: 'Property & Land (ज़मीन-जायदाद)' },
    { id: 'family', label: 'Family & Divorce (पारिवारिक)' },
    { id: 'criminal', label: 'Criminal Law (आपराधिक)' },
    { id: 'consumer', label: 'Consumer & Fraud (उपभोक्ता)' },
    { id: 'labour', label: 'Labour & Employment (रोजगार)' },
    { id: 'civil', label: 'Civil Litigation (सिविल)' },
  ];

  const filteredLawyers = lawyers.filter((lawyer) => {
    const fullName = lawyer.profile?.full_name || 'Advocate';
    const city = lawyer.profile?.city || '';
    const state = lawyer.profile?.state || '';
    const barNo = lawyer.bar_council_number || '';
    const specialties = (lawyer.specialty || []).join(' ').toLowerCase();

    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialties.includes(searchQuery.toLowerCase());

    if (selectedCategory === 'all') return matchesSearch;

    const matchesCategory = specialties.includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // -------------------------------------------------------------
  // SCREEN 1: DEDICATED ADVOCATE DIRECT MESSAGING CHAT
  // -------------------------------------------------------------
  if (activeAdvocateChat) {
    const lawyerName = activeAdvocateChat.profile?.full_name || 'Advocate Profile';
    const lawyerCity = activeAdvocateChat.profile?.city || 'Delhi';
    const photo =
      activeAdvocateChat.profile_photo_url ||
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80';
    const connId = connectionMap[activeAdvocateChat.id] || activeAdvocateChat.id;

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col">
        {/* ADVOCATE CHAT HEADER */}
        <div className="bg-[#0A1628] text-[#FFFFFF] px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveAdvocateChat(null)}
              className="p-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-[#FFFFFF] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={photo}
                  alt={lawyerName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#D97706]"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-[#0A1628]" />
              </div>

              <div>
                <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                  <span>Adv. {lawyerName}</span>
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                </h2>
                <p className="text-[11px] text-[#94A3B8]">
                  Bar Council Reg: {activeAdvocateChat.bar_council_number || 'Verified'} • {lawyerCity}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`Calling Adv. ${lawyerName}... Helpline: 1800-123-LEGAL`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] text-xs font-bold rounded-xl cursor-pointer shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Request Call</span>
            </button>
          </div>
        </div>

        {/* MESSAGES BODY CONTAINER */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-3 md:p-6 flex flex-col min-h-0">
          <DirectMessagePanel
            connectionId={connId}
            currentUserId={currentUser?.userId || 'guest_citizen_101'}
            currentUserType="citizen"
            currentUserName={currentUser?.name || 'Citizen Client'}
            otherPartyName={`Adv. ${lawyerName}`}
            otherPartyPhone={activeAdvocateChat.profile?.phone || '+91 9876543210'}
            caseTitle="Legal Consultation"
            compact={false}
          />
        </div>
      </div>
    );
  }

  // Render Shared Overlay Modals & Toasts
  const renderModals = () => (
    <>
      {/* TOAST NOTICE BANNER */}
      {toastNotice && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-[#0A1628] text-[#FFFFFF] border-2 border-[#D97706] p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />
            <span>{toastNotice}</span>
          </div>
          <button
            onClick={() => setToastNotice(null)}
            className="p-1 hover:bg-[#1E293B] rounded-lg text-[#94A3B8] hover:text-[#FFFFFF] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* REQUEST CONSULTATION MODAL */}
      {requestModalLawyer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-3">
                <Logo variant="dark" />
              </div>
              <button
                onClick={() => setRequestModalLawyer(null)}
                className="p-2 hover:bg-[#F1F5F9] rounded-xl text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Lawyer Info Badge */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-center gap-3">
                <img
                  src={
                    requestModalLawyer.profile_photo_url ||
                    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80'
                  }
                  alt="Lawyer"
                  className="w-12 h-12 rounded-xl object-cover border border-[#CBD5E1]"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-[#0F172A]">
                    Adv. {requestModalLawyer.profile?.full_name || 'Advocate'}
                  </p>
                  <p className="text-[#D97706] font-semibold">
                    {requestModalLawyer.specialty?.[0] || 'Legal Specialist'} • Bar Reg: {requestModalLawyer.bar_council_number || 'Verified'}
                  </p>
                  <p className="text-[#64748B] text-[11px]">
                    {requestModalLawyer.profile?.city || 'Delhi'}, {requestModalLawyer.profile?.state || 'India'}
                  </p>
                </div>
              </div>

              {/* SELECT CASE SECTION */}
              {(() => {
                const runningCases = userCases.filter((c) => c.status !== 'closed');
                const availableCases = runningCases.filter((c) => c.status !== 'lawyer_connected' && !c.assigned_lawyer_id);

                if (runningCases.length === 0) {
                  return (
                    <div className="p-4 bg-[#FFFBEB] border border-[#FCD34D] rounded-2xl text-center space-y-3 shadow-2xs">
                      <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold mx-auto text-lg">
                        ⚠️
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#92400E]">No Active Case Selected</h4>
                        <p className="text-[11px] text-[#B45309] leading-relaxed">
                          Click below to instantly create a new consultation case for Adv. {requestModalLawyer.profile?.full_name || 'Advocate'} or create one in AI Chat.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const citizenId = currentUser?.userId || 'guest_citizen';
                            const created = await createCase(
                              citizenId,
                              `Legal Consultation - Adv. ${requestModalLawyer.profile?.full_name || 'Advocate'}`,
                              requestCategory || 'other'
                            );
                            setUserCases((prev) => [created, ...prev]);
                            setSelectedCaseForRequest(created.id);
                            setToastNotice('✅ New legal case created! Click "Confirm & Send Request" below.');
                            setTimeout(() => setToastNotice(null), 4000);
                          }}
                          className="flex-1 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] text-xs font-extrabold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Quick Create Case (केस बनाएं)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRequestModalLawyer(null);
                            onNavigateToChat?.();
                          }}
                          className="py-2.5 px-3 bg-[#1E293B] hover:bg-[#0F172A] text-[#FFFFFF] text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          AI Chat
                        </button>
                      </div>
                    </div>
                  );
                }

                if (availableCases.length === 0) {
                  const activeCaseToClose = runningCases[0];
                  return (
                    <div className="p-4 bg-[#FFFBEB] border border-[#FCD34D] rounded-2xl text-center space-y-3 shadow-2xs">
                      <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold mx-auto text-lg">
                        ⚠️
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#92400E]">Existing Active Case Present</h4>
                        <p className="text-[11px] text-[#B45309] leading-relaxed">
                          Aapka ek case pehle se active hai ({activeCaseToClose.title || 'Legal Query'}). Ek waqt mein 1 hi active case ho sakta hai. Naya case banane ke liye pehle active case ko Close karein.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const citizenId = currentUser?.userId || 'guest_citizen';
                          // 1. Close current active case first
                          if (activeCaseToClose) {
                            await updateCaseStatus(activeCaseToClose.id, citizenId, 'closed');
                          }
                          // 2. Create new consultation case
                          const created = await createCase(
                            citizenId,
                            `Consultation - Adv. ${requestModalLawyer.profile?.full_name || 'Advocate'}`,
                            requestCategory || 'other'
                          );
                          setUserCases((prev) => [created, ...prev.map((c) => c.id === activeCaseToClose.id ? { ...c, status: 'closed' as const } : c)]);
                          setSelectedCaseForRequest(created.id);
                          setToastNotice('✅ Purana active case close karke naya consultation case tayar hai! Click "Confirm & Send Request" below.');
                          setTimeout(() => setToastNotice(null), 5000);
                        }}
                        className="w-full py-2.5 bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] text-xs font-extrabold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-[#FFFFFF]" />
                        <span>Close Active Case & Start New (केस क्लोज करके नया बनाएं)</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                      <span>Select Active Case to Attach (मामला चुनें) <span className="text-[#DC2626]">*</span></span>
                      <span className="text-[11px] text-[#D97706] font-semibold">{availableCases.length} Available Case(s)</span>
                    </label>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {runningCases.map((c) => {
                        const isAllotted = c.status === 'lawyer_connected' || Boolean(c.assigned_lawyer_id);
                        const isSelected = selectedCaseForRequest === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              if (isAllotted) {
                                setToastNotice('⚠️ Adv. is already allotted for this case. Select an unassigned case or create a new case.');
                                setTimeout(() => setToastNotice(null), 4000);
                                return;
                              }
                              setSelectedCaseForRequest(c.id);
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                              isAllotted
                                ? 'bg-[#F1F5F9] border-[#CBD5E1] opacity-70 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#FEF3C7] border-[#D97706] shadow-2xs ring-1 ring-[#D97706]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#0F172A]">{c.title}</span>
                                <span className="px-2 py-0.5 bg-[#0A1628] text-[#FFFFFF] text-[9px] font-bold rounded-full uppercase">
                                  {c.category}
                                </span>
                                {isAllotted && (
                                  <span className="px-2 py-0.5 bg-[#10B981] text-[#FFFFFF] text-[9px] font-bold rounded-full uppercase">
                                    Advocate Allotted
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#64748B] line-clamp-1">
                                {c.ai_summary || 'Identified in AI Consultation Chat'}
                              </p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected ? 'border-[#D97706] bg-[#D97706] text-[#FFFFFF]' : 'border-[#CBD5E1]'
                            }`}>
                              {isSelected && <span className="text-[10px] font-bold">✓</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Account Linked Contact Info */}
              <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#64748B] font-medium">Account Linked Contact:</span>
                <span className="font-bold text-[#0F172A]">{currentUser?.email || 'Attached with Account'}</span>
              </div>

              {/* Case Note / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A] block">
                  Brief Legal Issue Note (संक्षिप्त समस्या विवरण)
                </label>
                <textarea
                  rows={2}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Apne mamle ke bare me santhshipt me likhein (jaise: jameen ki registry ki samasya, notice ka jawab)..."
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#D97706] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setRequestModalLawyer(null)}
                className="px-4 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              {userCases.filter((c) => c.status !== 'closed').length > 0 ? (
                <button
                  type="button"
                  disabled={!selectedCaseForRequest}
                  onClick={() => handleConfirmSendRequest(requestModalLawyer.id)}
                  className={`px-6 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 shadow-md ${
                    selectedCaseForRequest
                      ? 'bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] cursor-pointer'
                      : 'bg-[#CBD5E1] text-[#64748B] cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Confirm & Send Request (अनुरोध भेजें)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRequestModalLawyer(null);
                    onNavigateToChat?.();
                  }}
                  className="px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] text-xs font-extrabold rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create Case in Chat First</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewingLawyer && (
        <ReviewModal
          lawyerId={reviewingLawyer.id}
          lawyerName={reviewingLawyer.profile?.full_name || 'Advocate'}
          citizenId={currentUser?.userId || 'guest_citizen'}
          lawyerPhotoUrl={reviewingLawyer.profile_photo_url}
          specialty={reviewingLawyer.specialty}
          onClose={() => setReviewingLawyer(null)}
          onSuccess={() => {
            setToastNotice('⭐ Dhanyawad! Aapka advocate review safaltapoorvak darj ho gaya hai.');
            setTimeout(() => setToastNotice(null), 4000);
            if (selectedLawyer?.id) {
              fetchLawyerReviews(selectedLawyer.id)
                .then((revs) => setSelectedLawyerReviews(revs || []))
                .catch(() => {});
            }
          }}
        />
      )}
    </>
  );

  // -------------------------------------------------------------
  // SCREEN 2: ADVOCATE DETAIL PROFILE (when selectedLawyer !== null)
  // -------------------------------------------------------------
  if (selectedLawyer) {
    const lawyerId = selectedLawyer.id;
    const reqStatus = requestStatuses[lawyerId] || 'none';
    const lawyerName = selectedLawyer.profile?.full_name || 'Advocate Profile';
    const lawyerCity = selectedLawyer.profile?.city || 'Delhi';
    const lawyerState = selectedLawyer.profile?.state || 'India';
    const photo =
      selectedLawyer.profile_photo_url ||
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80';

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
        {/* TOP BAR HEADER */}
        <div className="bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <button
            onClick={() => setSelectedLawyer(null)}
            className="flex items-center gap-2 text-xs font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Advocates Directory (वकील सूची)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Link copied to clipboard!')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold rounded-xl cursor-pointer border border-[#CBD5E1]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer border transition-colors ${
                isSaved
                  ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                  : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border-[#CBD5E1]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#DC2626]' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* MAIN DETAIL CONTAINER */}
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
          
          {/* REQUEST STATUS BANNER */}
          {reqStatus === 'pending' && (
            <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] p-4 rounded-2xl flex items-center gap-3 shadow-xs">
              <Clock className="w-5 h-5 text-[#D97706] shrink-0 animate-pulse" />
              <div className="text-xs">
                <p className="font-bold text-[#78350F]">Consultation Request Sent to Adv. {lawyerName} (अनुरोध भेजा गया)</p>
                <p className="text-[11px] text-[#B45309]">Request sent to advocate's portal. Waiting for advocate response.</p>
              </div>
            </div>
          )}

          {reqStatus === 'accepted' && (
            <div className="bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-[#14532D]">Request Accepted by Adv. {lawyerName}! (अनुरोध स्वीकृत)</p>
                  <p className="text-[11px] text-[#15803D]">You are now directly connected. Click "Message Advocate" to chat.</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenAdvocateChat(selectedLawyer)}
                className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-[#FFFFFF] text-xs font-extrabold rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Advocate Now</span>
              </button>
            </div>
          )}

          {/* TOP PROFILE BANNER CARD */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-6 md:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left Photo & Info */}
              <div className="flex items-start md:items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-[#CBD5E1] shadow-md bg-[#F1F5F9]">
                    <img src={photo} alt={lawyerName} className="w-full h-full object-cover" />
                  </div>
                  {selectedLawyer.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#2563EB] text-[#FFFFFF] border-2 border-[#FFFFFF] flex items-center justify-center text-xs font-bold shadow-xs">
                      ✓
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-xl md:text-2xl font-extrabold text-[#0F172A]">
                    Adv. {lawyerName}
                  </h1>
                  <p className="text-xs font-bold text-[#D97706]">
                    {selectedLawyer.specialty?.[0] || 'Legal Specialist'} • Reg: {selectedLawyer.bar_council_number || 'Verified'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] pt-1">
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-[#0F172A]" />
                      <span>{selectedLawyer.years_experience || 10}+ Years Exp</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0F172A]" />
                      <span>{lawyerCity}, {lawyerState}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-[#0F172A]" />
                      <span>Hindi, English</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 self-start md:self-center w-full md:w-auto">
                {reqStatus === 'none' && (
                  <button
                    onClick={() => handleOpenRequestModal(selectedLawyer)}
                    className="w-full sm:w-auto px-5 py-3 bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] text-xs font-extrabold rounded-2xl shadow-md transition-all cursor-pointer text-center"
                  >
                    Send Consultation Request (अनुरोध भेजें)
                  </button>
                )}

                {reqStatus === 'pending' && (
                  <div className="px-4 py-2 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs font-extrabold rounded-2xl flex items-center gap-1.5">
                    <Clock className="w-4 h-4 animate-spin text-[#D97706]" />
                    <span>Request Pending...</span>
                  </div>
                )}

                {reqStatus === 'accepted' && (
                  <button
                    onClick={() => handleOpenAdvocateChat(selectedLawyer)}
                    className="w-full sm:w-auto px-5 py-3 bg-[#16A34A] hover:bg-[#15803D] text-[#FFFFFF] text-xs font-extrabold rounded-2xl shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Message Advocate (बातचीत करें)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Specialty Tag Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#E2E8F0]">
              {(selectedLawyer.specialty || ['Property Law', 'Civil Disputes']).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[#F1F5F9] text-[#0F172A] text-xs font-bold rounded-full border border-[#E2E8F0]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* STAT METRIC CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-1 text-center sm:text-left">
              <p className="text-xs font-bold text-[#64748B]">Cases Handled</p>
              <p className="text-2xl font-extrabold text-[#0F172A]">{selectedLawyer.total_cases_handled || 50}+</p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-1 text-center sm:text-left">
              <p className="text-xs font-bold text-[#64748B]">Success Rate</p>
              <p className="text-2xl font-extrabold text-[#0F172A]">94%</p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-1 text-center sm:text-left">
              <p className="text-xs font-bold text-[#64748B]">Client Rating</p>
              <p className="text-2xl font-extrabold text-[#D97706]">{selectedLawyer.rating_avg || 4.9} ★</p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-1 text-center sm:text-left">
              <p className="text-xs font-bold text-[#64748B]">Consultation Fee</p>
              <p className="text-sm font-extrabold text-[#0F172A]">{selectedLawyer.consultation_fee_range || '₹1,500 / session'}</p>
            </div>
          </div>

          {/* MAIN SPLIT CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT TABS NAVIGATION & CONTENT (8 cols) */}
            <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center gap-6 border-b border-[#E2E8F0] text-xs font-bold">
                <button
                  onClick={() => setActiveTab('about')}
                  className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                    activeTab === 'about'
                      ? 'border-[#D97706] text-[#0F172A]'
                      : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  About Advocate
                </button>

                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                    activeTab === 'reviews'
                      ? 'border-[#D97706] text-[#0F172A]'
                      : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Reviews
                </button>

                <button
                  onClick={() => setActiveTab('stories')}
                  className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                    activeTab === 'stories'
                      ? 'border-[#D97706] text-[#0F172A]'
                      : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Success Stories
                </button>

                <button
                  onClick={() => setActiveTab('faqs')}
                  className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                    activeTab === 'faqs'
                      ? 'border-[#D97706] text-[#0F172A]'
                      : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  FAQs
                </button>
              </div>

              {activeTab === 'about' && (
                <div className="space-y-4 text-xs text-[#334155] leading-relaxed">
                  <p>{selectedLawyer.bio || `Adv. ${lawyerName} is an experienced Advocate registered with Bar Council. Specializing in legal consultation, documentation verification, and Court litigation representation.`}</p>
                  <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
                    <p className="font-bold text-[#0F172A]">Bar Council Reg. Number: {selectedLawyer.bar_council_number}</p>
                    <p className="text-[#64748B]">Practicing Courts: District Courts, High Court & Tribunals</p>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-3 text-xs text-[#334155]">
                  <div className="flex items-center justify-between bg-[#FFFBEB] p-3 rounded-2xl border border-[#FDE68A]">
                    <div>
                      <h4 className="font-extrabold text-[#0F172A]">Client Reviews & Feedback</h4>
                      <p className="text-[11px] text-[#D97706]">Rating: {selectedLawyer.rating_avg || 4.9} ★ ({selectedLawyerReviews.length} Verified Reviews)</p>
                    </div>
                    <button
                      onClick={() => {
                        if (!currentUser?.userId && onRequireAuth) {
                          onRequireAuth();
                          return;
                        }
                        setReviewingLawyer(selectedLawyer);
                      }}
                      className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Star className="w-3.5 h-3.5 fill-[#FFFFFF]" />
                      <span>Write Review</span>
                    </button>
                  </div>

                  {selectedLawyerReviews.length === 0 ? (
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center space-y-1">
                      <p className="font-bold text-[#0F172A]">Be the First to Review Adv. {lawyerName}</p>
                      <p className="text-[11px] text-[#64748B]">Click the "Write Review" button above to share your consultation experience.</p>
                    </div>
                  ) : (
                    selectedLawyerReviews.map((rev) => (
                      <div key={rev.id} className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F172A]">Verified Citizen</span>
                          <span className="text-[#D97706] font-bold">{rev.rating}.0 ★</span>
                        </div>
                        {rev.review_text && <p>{rev.review_text}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'stories' && (
                <div className="space-y-2 text-xs text-[#334155]">
                  <p className="font-bold text-[#0F172A]">Property & Land Dispute Resolution</p>
                  <p>Successfully resolved ancestral property partition & boundary dispute through mediation and High Court writ petition.</p>
                </div>
              )}

              {activeTab === 'faqs' && (
                <div className="space-y-2 text-xs text-[#334155]">
                  <p className="font-bold text-[#0F172A]">Q: What documents are needed for first consultation?</p>
                  <p>A: Bring relevant deeds, mutation copies, notices, and ID proof.</p>
                </div>
              )}
            </div>

            {/* RIGHT BOOK CONSULTATION CARD (4 cols) */}
            <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-6 shadow-2xs space-y-5">
              <h2 className="text-sm font-bold text-[#0F172A]">Book Consultation Slot</h2>

              <div className="space-y-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                  <span>Available Dates</span>
                  <span>Aug 2026</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#64748B] font-semibold pt-1">
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#0F172A]">
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center mx-auto transition-colors cursor-pointer ${
                        selectedDate === day
                          ? 'bg-[#D97706] text-[#FFFFFF] font-extrabold shadow-xs'
                          : 'hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-[#0F172A]">Select Time</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['10:00 AM', '11:00 AM', '04:00 PM', '05:00 PM'].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2 px-3 rounded-xl font-bold border transition-colors cursor-pointer ${
                        selectedTime === slot
                          ? 'bg-[#D97706] text-[#FFFFFF] border-[#D97706] shadow-xs'
                          : 'bg-[#FFFFFF] border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {reqStatus === 'none' && (
                <button
                  onClick={() => handleOpenRequestModal(selectedLawyer)}
                  className="w-full py-3 bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
                >
                  Send Consultation Request
                </button>
              )}

              {reqStatus === 'pending' && (
                <button
                  disabled
                  className="w-full py-3 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold text-xs rounded-xl cursor-not-allowed text-center"
                >
                  Request Pending Advocate Approval
                </button>
              )}

              {reqStatus === 'accepted' && (
                <button
                  onClick={() => handleOpenAdvocateChat(selectedLawyer)}
                  className="w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-[#FFFFFF] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Start Direct Advocate Chat</span>
                </button>
              )}
            </div>
          </div>
        </div>
        {renderModals()}
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 3: ADVOCATES DIRECTORY LIST (Default view when selectedLawyer === null)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-12">
      {/* COMPACT SLEEK HEADER BANNER */}
      <div className="bg-[#0A1628] text-[#FFFFFF] py-3.5 px-4 md:px-8 border-b border-[#1E293B] shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left Title & Back */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-1.5 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-[#FFFFFF] rounded-xl cursor-pointer shrink-0 transition-colors"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-extrabold text-[#FFFFFF] tracking-tight">
                  Find & Contact Verified Advocates
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-[#1E293B] border border-[#334155] text-[#F59E0B] text-[10px] font-bold rounded-full">
                  ⚖️ Verified Directory
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] hidden md:block">
                Select an advocate for your legal case or let AI auto-assign the best match.
              </p>
            </div>
          </div>

          {/* Right Sleek Compact Search Bar */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, city, court..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-[#1E293B] border border-[#334155] rounded-xl text-xs text-[#FFFFFF] placeholder-[#64748B] focus:outline-none focus:border-[#D97706]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[10px] font-bold text-[#94A3B8] hover:text-[#FFFFFF]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER PILLS */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#0A1628] text-[#FFFFFF] border-[#0A1628] shadow-xs'
                  : 'bg-[#FFFFFF] text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* LAWYERS LISTING GRID */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
        <div className="flex items-center justify-between pb-4">
          <p className="text-xs font-bold text-[#64748B]">
            Showing <span className="text-[#0F172A]">{filteredLawyers.length}</span> Verified Advocates in Bar Directory
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-bold text-[#64748B]">
            Loading advocates directory from Bar Council network...
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3">
            <User className="w-10 h-10 text-[#94A3B8] mx-auto" />
            <p className="text-sm font-bold text-[#0F172A]">No Advocates Found</p>
            <p className="text-xs text-[#64748B]">Try searching with a different court, city, or practice area.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="px-4 py-2 bg-[#F1F5F9] text-[#0F172A] text-xs font-bold rounded-xl hover:bg-[#E2E8F0]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLawyers.map((lawyer) => {
              const reqStatus = requestStatuses[lawyer.id] || 'none';
              const name = lawyer.profile?.full_name || 'Advocate Profile';
              const city = lawyer.profile?.city || 'Delhi';
              const state = lawyer.profile?.state || 'India';
              const photo =
                lawyer.profile_photo_url ||
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80';

              return (
                <div
                  key={lawyer.id}
                  onClick={() => setSelectedLawyer(lawyer)}
                  className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#D97706] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-4">
                    {/* Header Photo & Info */}
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        <img
                          src={photo}
                          alt={name}
                          className="w-16 h-16 rounded-xl object-cover border border-[#CBD5E1] bg-[#F1F5F9]"
                        />
                        {lawyer.verification_status === 'verified' ? (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#2563EB] text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center border border-[#FFFFFF]" title="Verified Advocate">
                            ✓
                          </span>
                        ) : lawyer.verification_status === 'rejected' ? (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#DC2626] text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center border border-[#FFFFFF]" title="Verification rejected">
                            ✕
                          </span>
                        ) : (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#F59E0B] text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center border border-[#FFFFFF]" title="Verification pending">
                            …
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <h3 className="text-sm font-extrabold text-[#0F172A] group-hover:text-[#D97706] transition-colors truncate">
                          Adv. {name}
                        </h3>
                        <p className="text-[11px] font-bold text-[#D97706] truncate">
                          {lawyer.specialty?.[0] || 'Legal Advocate'}
                        </p>
                        <p className="text-[10px] text-[#64748B] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#64748B]" />
                          <span>{city}, {state}</span>
                        </p>
                      </div>
                    </div>

                    {/* Request badge if sent */}
                    {reqStatus === 'pending' && (
                      <div className="bg-[#FEF3C7] text-[#92400E] text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin text-[#D97706]" />
                        <span>Request Sent (Pending Approval)</span>
                      </div>
                    )}

                    {reqStatus === 'accepted' && (
                      <div className="bg-[#DCFCE7] text-[#166534] text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>Request Accepted (Ready to Message)</span>
                      </div>
                    )}

                    {/* Stats Pill Row */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F1F5F9] text-xs">
                      <div className="bg-[#F8FAFC] p-2 rounded-lg text-center">
                        <p className="text-[10px] text-[#64748B]">Experience</p>
                        <p className="font-extrabold text-[#0F172A]">{lawyer.years_experience || 10}+ Yrs</p>
                      </div>
                      <div className="bg-[#F8FAFC] p-2 rounded-lg text-center">
                        <p className="text-[10px] text-[#64748B]">Rating</p>
                        <p className="font-extrabold text-[#D97706]">{lawyer.rating_avg || 4.9} ★ <span className="text-[#94A3B8] font-semibold text-[10px]">({lawyer.review_count || 0})</span></p>
                      </div>
                    </div>

                    {/* Specialties tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(lawyer.specialty || ['Property', 'Civil']).slice(0, 3).map((spec) => (
                        <span
                          key={spec}
                          className="px-2 py-0.5 bg-[#F1F5F9] text-[#334155] text-[10px] font-bold rounded-md border border-[#E2E8F0]"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-[#64748B]">Consultation</p>
                      <p className="text-xs font-bold text-[#0F172A]">{lawyer.consultation_fee_range || '₹1,500 / session'}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {reqStatus === 'none' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRequestModal(lawyer);
                          }}
                          className="px-2.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          Request
                        </button>
                      )}

                      {reqStatus === 'pending' && (
                        <span className="px-2 py-1.5 bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold rounded-xl border border-[#FDE68A] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#D97706]" />
                          <span>Pending</span>
                        </span>
                      )}

                      {reqStatus === 'accepted' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAdvocateChat(lawyer);
                          }}
                          className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-[#FFFFFF] text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
                          title="Direct Message Advocate"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Message</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!currentUser?.userId && onRequireAuth) {
                            onRequireAuth();
                            return;
                          }
                          setReviewingLawyer(lawyer);
                        }}
                        className="px-2 py-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Rate & Review Advocate"
                      >
                        <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                        <span>Rate</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLawyer(lawyer);
                        }}
                        className="px-2.5 py-1.5 bg-[#0A1628] hover:bg-[#D97706] text-[#FFFFFF] text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {renderModals()}
    </div>
  );
};
