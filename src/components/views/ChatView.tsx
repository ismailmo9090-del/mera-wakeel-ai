import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Language, UserRole } from '../../types';
import { getContent } from '../LanguageContent';
import { ExportModal } from '../ExportModal';
import { 
  MessageSquareText,
  Paperclip,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowLeft,
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Square,
  Plus,
  RefreshCw,
  PhoneCall,
  Brain,
  CheckSquare,
  Lock,
  Unlock,
  Briefcase,
  FolderCheck,
  Eye,
  FileCheck,
  File,
  Download,
  Clock,
} from 'lucide-react';
import { 
  fetchCaseMessages,
  saveCaseMessage,
  createCase,
  updateCaseVerdictAndSummary,
  createOrUpdateProfile,
  fetchCaseFacts,
  fetchProfileFacts,
  saveExtractedFacts,
  uploadCaseDocument,
  deleteCaseDocument,
  fetchCaseDocuments,
  updateCaseDocumentAnalysis,
  inferDocumentType,
  fetchCaseById,
  updateCaseStatus,
  fetchCaseEvidence,
  addCaseEvidence,
  toggleEvidenceAvailable,
  saveExtractedEvidence,
  fetchLawyersDirectory,
  createLawyerConnection,
  fetchLawyerConnectionsForCitizen,
  fetchUserCases,
  inferCaseCategory,
} from '../../lib/supabase';
import { CaseFact, ProfileFact, CaseEvidence, EvidencePriority, CaseStatus, Lawyer, LawyerConnection, Document } from '../../types/database';
import { AICallModal } from '../AICallModal';
import { DirectMessagePanel } from '../DirectMessagePanel';
import { APP_CONFIG } from '../../constants';
import { speakNaturalMaleVoice, stopNaturalVoice } from '../../lib/audioVoice';
import { startWebAudioCapture, AudioCaptureSession } from '../../lib/webAudioCapture';
import { sendGeminiChatMessage, fileToBase64 } from '../../lib/geminiApi';

interface ChatViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentUser?: {
    userId: string;
    email: string;
    role: UserRole;
    name?: string;
  } | null;
  activeCaseId?: string | null;
  onBackToHome: () => void;
  onBackToCases?: () => void;
  onStartNewCase?: () => void;
  onFindLawyer?: (category?: string) => void;
}

interface ChatMessage {
  id: string;
  sender_type: 'user' | 'ai';
  content: string;
  message_type?: 'text' | 'voice' | 'document_reference';
  created_at?: string;
  attachedFile?: string;
  attachedFileUrl?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  language,
  onLanguageChange,
  currentUser,
  activeCaseId,
  onBackToHome,
  onBackToCases,
  onStartNewCase,
  onFindLawyer,
}) => {
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(activeCaseId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Case Snapshot state
  const [verdict, setVerdict] = useState<'user_correct' | 'user_incorrect' | 'needs_more_info'>('needs_more_info');
  const [summaryNotes, setSummaryNotes] = useState<string[]>([]);
  const [caseTitle, setCaseTitle] = useState<string>('Legal Consultation Case');
  const [caseStatus, setCaseStatus] = useState<CaseStatus>('ongoing');
  const [caseEvidence, setCaseEvidence] = useState<CaseEvidence[]>([]);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState<boolean>(true);
  const [newEvidenceInput, setNewEvidenceInput] = useState<string>('');
  const [rememberedCaseFacts, setRememberedCaseFacts] = useState<CaseFact[]>([]);
  const [rememberedProfileFacts, setRememberedProfileFacts] = useState<ProfileFact[]>([]);

  // Matched Advocate Allocation State
  const [recommendedLawyers, setRecommendedLawyers] = useState<Lawyer[]>([]);
  const [allocatedLawyerIndex, setAllocatedLawyerIndex] = useState<number>(0);
  const [showAllocationModal, setShowAllocationModal] = useState<boolean>(false);
  const [hasDismissedAllocationModal, setHasDismissedAllocationModal] = useState<boolean>(false);
  const [allocatedCategory, setAllocatedCategory] = useState<string>('other');
  const [connectedLawyerIds, setConnectedLawyerIds] = useState<string[]>([]);
  const [connectingLawyerId, setConnectingLawyerId] = useState<string | null>(null);
  const [lawyerConnectNotice, setLawyerConnectNotice] = useState<string>('');
  const [citizenConnections, setCitizenConnections] = useState<LawyerConnection[]>([]);
  const [caseDocuments, setCaseDocuments] = useState<Document[]>([]);
  const [showCaseDocsModal, setShowCaseDocsModal] = useState<boolean>(false);
  const [isDirectChatOpen, setIsDirectChatOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchLawyersDirectory().then((dir) => {
      setRecommendedLawyers(dir);
    });
  }, []);

  // Fetch existing connections and documents when currentCaseId or user changes with live polling
  const refreshConnectionsAndDocs = async () => {
    if (currentUser?.userId) {
      const conns = await fetchLawyerConnectionsForCitizen(currentUser.userId);
      setCitizenConnections(conns);
      if (currentCaseId) {
        const sentIds = conns.filter((c) => c.case_id === currentCaseId).map((c) => c.lawyer_id);
        setConnectedLawyerIds(sentIds);
      }
    }
    if (currentCaseId) {
      const docs = await fetchCaseDocuments(currentCaseId);
      setCaseDocuments(docs);
      const caseObj = await fetchCaseById(currentCaseId);
      if (caseObj) {
        if (caseObj.status) setCaseStatus(caseObj.status);
        if (caseObj.ai_verdict) setVerdict(caseObj.ai_verdict);
        if (caseObj.title) setCaseTitle(caseObj.title);
      }
    }
  };

  useEffect(() => {
    refreshConnectionsAndDocs();
    const interval = setInterval(refreshConnectionsAndDocs, 4000);
    return () => clearInterval(interval);
  }, [currentCaseId, currentUser?.userId]);

  // Derived accepted connection — STRICTLY from real DB connections only
  const acceptedConnection = useMemo(() => {
    if (citizenConnections.length === 0) return null;
    // First: match by case ID
    if (currentCaseId) {
      const caseMatch = citizenConnections.find(
        (c) => (c.case_id === currentCaseId || c.case?.id === currentCaseId) &&
               (c.status === 'accepted' || c.status === 'approved' || c.status === 'lawyer_connected' || c.status === 'completed')
      );
      if (caseMatch) return caseMatch;
    }
    // Second: any accepted connection for this citizen
    const generalMatch = citizenConnections.find(
      (c) => c.status === 'accepted' || c.status === 'approved' || c.status === 'lawyer_connected' || c.status === 'completed'
    );
    return generalMatch || null;
  }, [citizenConnections, currentCaseId]);

  // Derived pending connection for this case or citizen
  const pendingConnection = useMemo(() => {
    if (citizenConnections.length === 0) return null;
    if (currentCaseId) {
      // If an accepted connection exists for this case, there is no pending connection for this case
      const hasAccepted = citizenConnections.some(
        (c) => (c.case_id === currentCaseId || c.case?.id === currentCaseId) &&
               (c.status === 'accepted' || c.status === 'approved' || c.status === 'lawyer_connected')
      );
      if (hasAccepted) return null;

      const caseMatch = citizenConnections.find(
        (c) => (c.case_id === currentCaseId || c.case?.id === currentCaseId) &&
               (c.status === 'requested' || c.status === 'pending')
      );
      if (caseMatch) return caseMatch;
    }
    return null;
  }, [citizenConnections, currentCaseId]);

  // Category Matched Lawyers
  const categoryMatchedLawyers = useMemo(() => {
    if (recommendedLawyers.length === 0) return [];
    const cat = (allocatedCategory || 'general').toLowerCase();

    const filtered = recommendedLawyers.filter((l) => {
      if (!l.specialty || l.specialty.length === 0) return true;
      const specialties = l.specialty.map((s) => s.toLowerCase());
      if (cat.includes('property') || cat.includes('land') || cat.includes('zameen')) {
        return specialties.some((s) => s.includes('property') || s.includes('real estate') || s.includes('civil'));
      }
      if (cat.includes('tenant') || cat.includes('rent')) {
        return specialties.some((s) => s.includes('property') || s.includes('rent') || s.includes('consumer') || s.includes('civil'));
      }
      if (cat.includes('family') || cat.includes('divorce') || cat.includes('marriage')) {
        return specialties.some((s) => s.includes('family') || s.includes('matrimonial') || s.includes('civil'));
      }
      if (cat.includes('consumer')) {
        return specialties.some((s) => s.includes('consumer') || s.includes('civil'));
      }
      if (cat.includes('labour') || cat.includes('job') || cat.includes('service')) {
        return specialties.some((s) => s.includes('labour') || s.includes('service') || s.includes('employment'));
      }
      return true;
    });

    return filtered.length > 0 ? filtered : recommendedLawyers;
  }, [recommendedLawyers, allocatedCategory]);

  const handleQuickConnectLawyer = async (lawyer: Lawyer) => {
    if (!currentUser?.userId) {
      alert(language === 'hi' ? 'वकील से जुड़ने के लिए पहले लॉगिन करें।' : 'Please login to connect with an advocate.');
      return;
    }
    if (!currentCaseId) {
      alert('Please start a conversation first to create a case before connecting to a lawyer.');
      return;
    }
    // Guard against duplicate sending on multiple fast clicks
    if (connectingLawyerId === lawyer.id || connectedLawyerIds.includes(lawyer.id)) {
      return;
    }

    setConnectingLawyerId(lawyer.id);
    const citizenId = currentUser?.userId || 'guest_citizen_101';

    await createLawyerConnection(citizenId, lawyer.id, currentCaseId);
    setConnectingLawyerId(null);
    setConnectedLawyerIds((prev) => (prev.includes(lawyer.id) ? prev : [...prev, lawyer.id]));

    setLawyerConnectNotice(
      `Request Sent ✓ to Adv. ${lawyer.profile?.full_name || 'Advocate'}! Connection details will unlock upon advocate acceptance.`
    );
    setTimeout(() => setLawyerConnectNotice(''), 6000);
  };

  const handleAcceptAllocatedLawyer = async () => {
    const list = categoryMatchedLawyers.length > 0 ? categoryMatchedLawyers : recommendedLawyers;
    const currentLawyer = list[allocatedLawyerIndex % list.length] || list[0];
    if (!currentLawyer) return;
    setShowAllocationModal(false);
    await handleQuickConnectLawyer(currentLawyer);
  };

  const handleDeclineAndShowNextLawyer = () => {
    const list = categoryMatchedLawyers.length > 0 ? categoryMatchedLawyers : recommendedLawyers;
    if (list.length === 0) return;
    const nextIdx = (allocatedLawyerIndex + 1) % list.length;
    setAllocatedLawyerIndex(nextIdx);
  };

  // File Attachment
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const recognitionRef = useRef<any>(null);
  const webAudioSessionRef = useRef<AudioCaptureSession | null>(null);

  // TTS Voice Output State
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // AI Phone Call Modal State
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle End Call transcript memory synchronization
  const handleEndCallTranscript = async (
    transcript: Array<{ sender_type: 'user' | 'ai'; content: string; fileAttached?: string }>
  ) => {
    setIsCallModalOpen(false);

    if (!transcript || transcript.length === 0) return;

    const citizenId = currentUser?.userId || 'guest_citizen';

    const newChatMsgs: ChatMessage[] = transcript.map((t, idx) => ({
      id: `call_${Date.now()}_${idx}`,
      sender_type: t.sender_type,
      content: t.content,
      attachedFile: t.fileAttached,
      created_at: new Date().toISOString(),
    }));

    setMessages((prev) => [...prev, ...newChatMsgs]);

    if (currentCaseId) {
      for (const t of transcript) {
        await saveCaseMessage(currentCaseId, t.sender_type, t.content, t.fileAttached ? 'document_reference' : 'voice');
        if (t.sender_type === 'ai') {
          await saveExtractedFacts(currentCaseId, citizenId, t.content);
        }
      }
      const updatedCFacts = await fetchCaseFacts(currentCaseId);
      const updatedPFacts = await fetchProfileFacts(citizenId);
      setRememberedCaseFacts(updatedCFacts);
      setRememberedProfileFacts(updatedPFacts);
    }
  };

  // Quick chips per language
  const quickChips: Record<Language, string[]> = {
    hi: ['संपत्ति विवाद', 'दस्तावेज़ समझ नहीं आते', 'किराया/डिपॉज़िट विवाद', 'ज़मीन पर कब्ज़ा'],
    en: ['Property Dispute', 'Document Confusion', 'Tenant/Deposit Issue', 'Land Encroachment'],
    hinglish: ['Property Jhagda', 'Documents Nahi Samajh Aate', 'Kiraya/Deposit Vivaad', 'Zameen Par Kabza'],
  };

  // Placeholders per language
  const placeholders: Record<Language, string> = {
    hi: 'अपनी समस्या लिखें, या माइक दबाएं...',
    en: 'Type your problem, or tap the mic...',
    hinglish: 'Apni samasya likho, ya mic dabao...',
  };

  // Disclaimers per language (Exact requested text)
  const disclaimers: Record<Language, string> = {
    hi: 'Ye guidance sirf jaankari ke liye hai, professional legal advice ka replacement nahi.',
    en: 'Ye guidance sirf jaankari ke liye hai, professional legal advice ka replacement nahi.',
    hinglish: 'Ye guidance sirf jaankari ke liye hai, professional legal advice ka replacement nahi.',
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize input textarea up to at least 4 visible lines of text before internal scrolling
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to compute actual scrollHeight accurately
    textarea.style.height = 'auto';

    // 112px allows for at least 4-5 full visible lines of text
    const maxHeight = 112;
    const scrollHeight = textarea.scrollHeight;

    if (scrollHeight > 0) {
      const targetHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${targetHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [inputText]);

  // Stop TTS speech on unmount
  useEffect(() => {
    return () => {
      stopSpeechOutput();
    };
  }, []);

  // Initialize or fetch Case & Messages — NEVER auto-create a case on mount
  useEffect(() => {
    let isMounted = true;

    async function initCase() {
      const citizenId = currentUser?.userId || 'cfabc5e6-1924-451e-8cc7-afc493f4e239';

      // Determine which case to load: prefer explicitly passed activeCaseId
      let cId = activeCaseId || currentCaseId;

      // If no explicit case provided, try to find an ongoing one from DB (do NOT create a new case)
      if (!cId) {
        try {
          const dbCases = await fetchUserCases(citizenId);
          if (dbCases && dbCases.length > 0) {
            const ongoing = dbCases.find((c) => c.status === 'ongoing' || c.status === 'lawyer_connected') || dbCases[0];
            if (ongoing) {
              cId = ongoing.id;
              if (isMounted) setCurrentCaseId(cId);
            }
          }
        } catch (e) {
          console.warn('initCase fetch user cases notice:', e);
        }
      } else if (cId) {
        if (isMounted) setCurrentCaseId(cId);
      }

      if (cId) {
        // Fetch case row to restore Snapshot sidebar state
        const caseObj = await fetchCaseById(cId);
        if (isMounted && caseObj) {
          if (caseObj.ai_verdict) setVerdict(caseObj.ai_verdict);
          if (caseObj.title) setCaseTitle(caseObj.title);
          if (caseObj.status) setCaseStatus(caseObj.status);
          if (caseObj.ai_summary) {
            setSummaryNotes([caseObj.ai_summary]);
          }
        }

        const existingMsgs = await fetchCaseMessages(cId);
        if (isMounted) {
          setMessages(existingMsgs || []);
        }

        // Fetch remembered facts, evidence & verified documents from DB
        if (citizenId) {
          const cFacts = await fetchCaseFacts(cId);
          const pFacts = await fetchProfileFacts(citizenId);
          const evidenceList = await fetchCaseEvidence(cId);
          const caseDocs = await fetchCaseDocuments(cId);

          if (isMounted) {
            setRememberedCaseFacts(cFacts);
            setRememberedProfileFacts(pFacts);
            // Only mark evidence available if user has actually shared a problem/message
            const hasUserSharedProblem = messages.some(m => m.sender_type === 'user');
            const sanitizedEvidence = evidenceList.map(e => ({
              ...e,
              is_available: hasUserSharedProblem ? e.is_available : false
            }));
            setCaseEvidence(sanitizedEvidence);
            if (caseDocs) setCaseDocuments(caseDocs);
          }
        }
      } else if (isMounted) {
        setMessages([]);
      }
    }

    initCase();

    return () => {
      isMounted = false;
    };
  }, [activeCaseId, currentUser?.userId]);

  // Case Status Handler
  const handleToggleCaseStatus = async () => {
    if (!currentCaseId) return;
    const citizenId = currentUser?.userId || 'guest_citizen';
    const newStatus: CaseStatus = caseStatus === 'closed' ? 'ongoing' : 'closed';
    setCaseStatus(newStatus);
    await updateCaseStatus(currentCaseId, citizenId, newStatus);
  };

  // Evidence Checklist Handlers
  const handleToggleEvidence = async (evId: string, currentVal: boolean) => {
    if (!currentCaseId) return;
    const newVal = !currentVal;
    setCaseEvidence((prev) =>
      prev.map((item) => (item.id === evId ? { ...item, is_available: newVal } : item))
    );
    await toggleEvidenceAvailable(evId, currentCaseId, newVal);
  };

  const handleAddManualEvidence = async (desc: string, priority: EvidencePriority = 'critical') => {
    if (!currentCaseId || !desc.trim()) return;
    const newEv = await addCaseEvidence(currentCaseId, desc.trim(), priority);
    setCaseEvidence((prev) => {
      if (prev.some((e) => e.id === newEv.id)) return prev;
      return [...prev, newEv];
    });
    setNewEvidenceInput('');
  };

  // Helper for welcome greeting
  const getWelcomeGreeting = (lang: Language) => {
    if (lang === 'hi') {
      return 'नमस्ते! मैं आपकी Mera Wakeel AI लीगल एडवाइजर (Advocate Naya) हूं। अपनी कानूनी समस्या (प्रॉपर्टी, किराया विवाद, कंज्यूमर शिकायत या नोटिस) विस्तार से बताएं। मैं आपको सही कानूनी रास्ता समझाऊंगी।';
    } else if (lang === 'en') {
      return 'Namaste! I am Advocate Naya, your Mera Wakeel AI Legal Assistant. Please describe your legal issue (property, tenant, consumer complaint, or notice) in detail, and I will guide you with actionable next steps.';
    } else {
      return 'Namaste! Main aapki Mera Wakeel AI Legal Advocate (Naya) hoon. Apni kanooni samasya (property, rental, consumer dispute ya notice) batayein, main aapko sahi rasta samjhaungi.';
    }
  };

  // Handle Language Change from Pill Switcher
  const handleSelectLanguage = async (newLang: Language) => {
    onLanguageChange(newLang);
    stopSpeechOutput();

    // Update profile in DB if user is logged in
    if (currentUser?.userId) {
      const fullLangName = newLang === 'en' ? 'english' : newLang === 'hinglish' ? 'hinglish' : 'hindi';
      await createOrUpdateProfile({
        id: currentUser.userId,
        preferred_language: fullLangName as any,
      });
    }
  };

  // Voice Output (Natural Male Voice)
  const stopSpeechOutput = () => {
    stopNaturalVoice();
    setIsSpeaking(false);
  };

  const speakText = (text: string) => {
    if (!voiceOutputEnabled) return;

    stopSpeechOutput();

    speakNaturalMaleVoice(
      text,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  // Voice Input (Web Audio API + Groq Whisper STT with SpeechRecognition live preview)
  const toggleListening = async () => {
    stopSpeechOutput();

    if (isListening) {
      setIsListening(false);
      setMicVolume(0);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

      if (webAudioSessionRef.current) {
        const whisperText = await webAudioSessionRef.current.stopAndTranscribe(language);
        webAudioSessionRef.current = null;
        if (whisperText && whisperText.trim()) {
          setInputText((prev) => {
            const trimmedPrev = prev.trim();
            // Append or set Groq Whisper high-accuracy transcription
            return trimmedPrev ? `${trimmedPrev} ${whisperText.trim()}` : whisperText.trim();
          });
        }
      }
      return;
    }

    // Start Web Audio Stream Capture
    setIsListening(true);
    const audioSession = await startWebAudioCapture((vol) => setMicVolume(vol));

    if (!audioSession) {
      console.warn('Web Audio capture initialization returned null');
    } else {
      webAudioSessionRef.current = audioSession;
    }

    // Optional SpeechRecognition for live interim text preview while recording
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'en' ? 'en-IN' : 'hi-IN';

        let baseText = inputText.trim();

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }

          const trimmed = currentTranscript.trim();
          if (trimmed) {
            setInputText(baseText ? `${baseText} ${trimmed}` : trimmed);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition notice:', err?.error || err);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition live preview start notice:', err);
      }
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  // Response Parser
  const parseAIResponse = (responseText: string) => {
    // 1. Strip <think>...</think> blocks or any leaked reasoning text
    let cleanedText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 2. Extract Verdict Marker
    let newVerdict: 'user_correct' | 'user_incorrect' | 'needs_more_info' = verdict;
    const verdictMatch = cleanedText.match(/\[\[VERDICT:\s*(CORRECT|INCORRECT|PENDING)\]\]/i);
    if (verdictMatch) {
      const vStr = verdictMatch[1].toUpperCase();
      if (vStr === 'CORRECT') newVerdict = 'user_correct';
      else if (vStr === 'INCORRECT') newVerdict = 'user_incorrect';
      else newVerdict = 'needs_more_info';
    }

    // 3. Extract Summary Marker
    let summaryNote = '';
    const summaryMatch = cleanedText.match(/\[\[SUMMARY:\s*([\s\S]*?)\]\]/i);
    if (summaryMatch) {
      summaryNote = summaryMatch[1].trim();
    }

    // 4. Extract Document Validity Marker
    let docValidity: 'valid' | 'invalid' | 'suspicious' | null = null;
    const docMatch = cleanedText.match(/\[\[DOC_VALIDITY:\s*(VALID|INVALID|SUSPICIOUS)\]\]/i);
    if (docMatch) {
      const dStr = docMatch[1].toUpperCase();
      if (dStr === 'VALID') docValidity = 'valid';
      else if (dStr === 'INVALID') docValidity = 'invalid';
      else if (dStr === 'SUSPICIOUS') docValidity = 'suspicious';
    }

    // 5. Extract Status Marker (for case status update)
    let caseStatusUpdate: CaseStatus | null = null;
    const statusMatch2 = cleanedText.match(/\[\[STATUS:\s*([^\]]+)\]\]/i);
    if (statusMatch2) {
      const sStr = statusMatch2[1].toUpperCase().trim();
      if (sStr.includes('RESOLVED') || sStr.includes('CLOSED')) caseStatusUpdate = 'resolved';
      else if (sStr.includes('LAWYER CONNECTED') || sStr === 'LAWYER_CONNECTED') caseStatusUpdate = 'lawyer_connected';
      else if (sStr.includes('LAWYER REFERRAL') || sStr.includes('ESCALATED')) caseStatusUpdate = 'assessed';
      else if (sStr.includes('ASSESSED')) caseStatusUpdate = 'assessed';
      else if (sStr.includes('DOCS') || sStr.includes('DOCUMENT')) caseStatusUpdate = 'docs_verified' as any;
      else if (sStr === 'ONGOING' || sStr.includes('INFORMATION GATHERING') || sStr.includes('UNDER ASSESSMENT')) caseStatusUpdate = 'ongoing';
    }

    // 6. Strip out all system markers before displaying
    cleanedText = cleanedText
      .replace(/\[\[DOC_VALIDITY:\s*(VALID|INVALID|SUSPICIOUS)\]\]/gi, '')
      .replace(/\[\[VERDICT:\s*(CORRECT|INCORRECT|PENDING)\]\]/gi, '')
      .replace(/\[\[SUMMARY:\s*[\s\S]*?\]\]/gi, '')
      .replace(/\[\[FACT:\s*.*?\s*=\s*.*?\]\]/gi, '')
      .replace(/\[\[STATUS:\s*.*?\]\]/gi, '')
      .replace(/\[\[LAWYER_MATCH:\s*.*?\]\]/gi, '')
      .replace(/\[\[.*?\]\]/gi, '')
      .trim();

    return {
      cleanedText,
      newVerdict,
      summaryNote,
      docValidity,
      caseStatusUpdate,
    };
  };

  // Send Message Handler
  const handleSendMessage = async (customText?: string) => {
    if (isLoading) return;
    const textToSend = customText || inputText;
    if (!textToSend.trim() && !selectedFile) return;

    setIsLoading(true);

    // Open sidebar on first message
    if (messages.length <= 1) {
      setIsSidebarOpen(true);
    }

    stopSpeechOutput();

    const currentFile = selectedFile;
    const currentPreview = filePreview;

    // Reset input fields immediately
    setInputText('');
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const citizenId = currentUser?.userId || 'guest_citizen';

    try {
      // Get or create Case ID
      let cId = currentCaseId;
      if (!cId) {
        const createdCase = await createCase(
          citizenId,
          currentFile ? `Document Case: ${currentFile.name}` : `Case: ${textToSend.substring(0, 25)}...`
        );
        cId = createdCase.id;
        setCurrentCaseId(cId);
      }

      const defaultPrompt = 'Ye document dekho aur mujhe samjhao ki ye kya hai.';
      const promptText = textToSend.trim() || defaultPrompt;

      // Upload document to Supabase storage bucket `documents` & insert database row
      let uploadedDoc = null;
      if (currentFile && currentPreview && cId) {
        uploadedDoc = await uploadCaseDocument(cId, currentFile, currentPreview, citizenId);
      }

      const userDisplayContent = textToSend.trim() || defaultPrompt;

      const userMsg: ChatMessage = {
        id: `usr_${Date.now()}`,
        sender_type: 'user',
        content: userDisplayContent,
        attachedFile: currentFile?.name,
        attachedFileUrl: uploadedDoc?.file_url || currentPreview || undefined,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);

      if (cId) {
        await saveCaseMessage(cId, 'user', userDisplayContent, currentFile ? 'document_reference' : 'text', citizenId);
      }

      let fileData = null;
      if (currentFile && currentPreview) {
        fileData = {
          mimeType: currentFile.type || 'image/png',
          data: currentPreview,
        };
      }

      // Format conversation history for API (MUST strictly be string content turn history)
      const apiHistory = messages
        .filter((m) => m.id !== 'welcome_msg')
        .map((m) => ({
          role: m.sender_type === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.attachedFile ? `${m.content} [Document attached: ${m.attachedFile}]` : m.content,
        }));

      const response = await sendGeminiChatMessage(
        promptText,
        apiHistory,
        language,
        fileData,
        false,
        cId,
        citizenId
      );

      const rawAiText = response.text;

      // Extract & save structured facts
      const { cleanedText: textAfterFacts, extractedFacts } = await saveExtractedFacts(
        cId,
        citizenId,
        rawAiText
      );

      // Extract & save evidence checklist items
      const { cleanedText: textAfterEvidence, extractedEvidences } = await saveExtractedEvidence(
        cId,
        textAfterFacts
      );

      // Refresh evidence list
      if (cId && extractedEvidences.length > 0) {
        const updatedEvList = await fetchCaseEvidence(cId);
        setCaseEvidence(updatedEvList);
      }

      // Infer document type if document was attached
      const docType = currentFile ? inferDocumentType(textAfterEvidence) : 'other';

      // Ensure document_type fact is stored in AI Memory if a document was attached
      if (currentFile && cId) {
        const hasDocTypeFact = extractedFacts.some((f) => f.key === 'document_type');
        if (!hasDocTypeFact) {
          const formattedDocType = docType === 'power_of_attorney'
            ? 'Power of Attorney'
            : docType === 'stamp_paper'
            ? 'Stamp Paper'
            : docType === 'sale_deed'
            ? 'Sale Deed'
            : docType === 'will'
            ? 'Will'
            : docType === 'registry'
            ? 'Registry'
            : 'Legal Document';

          await saveExtractedFacts(cId, citizenId, `[[FACT: document_type = ${formattedDocType}]]`);
        }
      }

      // Refresh remembered facts
      if (cId) {
        const cFacts = await fetchCaseFacts(cId);
        setRememberedCaseFacts(cFacts);
      }
      const pFacts = await fetchProfileFacts(citizenId);
      setRememberedProfileFacts(pFacts);

      // Parse verdict, summary, document validity, and case status markers
      let { cleanedText, newVerdict, summaryNote, docValidity, caseStatusUpdate } = parseAIResponse(textAfterEvidence);

      // Auto-update case status from AI marker
      if (caseStatusUpdate && cId) {
        setCaseStatus(caseStatusUpdate);
        await updateCaseStatus(cId, citizenId, caseStatusUpdate);
      }

      // Ensure a summary note exists in Case Key Notes if a document was attached
      if (currentFile && !summaryNote) {
        const displayDocName = docType === 'power_of_attorney'
          ? 'Power of Attorney'
          : docType === 'stamp_paper'
          ? 'Stamp Paper'
          : docType === 'sale_deed'
          ? 'Sale Deed'
          : docType === 'will'
          ? 'Will'
          : docType === 'registry'
          ? 'Registry'
          : 'Document';
        summaryNote = `Analyzed ${displayDocName} (${currentFile.name})`;
      }

      // Update case snapshot state
      setVerdict(newVerdict);
      if (summaryNote) {
        setSummaryNotes((prev) => [summaryNote, ...prev]);
      }

      // Strict Legal Document Verification & Non-Legal Document Rejection
      const isInvalidDoc =
        docValidity === 'invalid' ||
        docType === 'unknown' ||
        cleanedText.toLowerCase().includes('not a legal document') ||
        cleanedText.toLowerCase().includes('koi legal document nahi') ||
        cleanedText.toLowerCase().includes('photo of ticket') ||
        cleanedText.toLowerCase().includes('stamp paper nahi');

      if (currentFile && isInvalidDoc) {
        // Non-legal item detected (e.g. ticket, photo, food item) — delete from DB and do NOT store in vault
        if (uploadedDoc && uploadedDoc.id) {
          await deleteCaseDocument(uploadedDoc.id);
        }
        setCaseDocuments((prev) => prev.filter((d) => d.id !== uploadedDoc?.id));
      } else if (uploadedDoc && cId && currentFile) {
        const isDocVerified = docValidity === 'valid';
        await updateCaseDocumentAnalysis(
          uploadedDoc.id,
          cId,
          cleanedText.substring(0, 250),
          cleanedText,
          docType,
          isDocVerified
        );
        const refreshedDocs = await fetchCaseDocuments(cId);
        setCaseDocuments(refreshedDocs);

        // Sync to localStorage so DocumentsView and MyCasesView immediately see it
        try {
          const userDocsKey = `mw_user_uploaded_docs_${currentUser?.userId || 'guest'}`;
          const raw = localStorage.getItem(userDocsKey);
          let currentLocal: any[] = raw ? JSON.parse(raw) : [];
          const newDocEntry = {
            id: uploadedDoc.id,
            name: currentFile.name,
            uploadDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: isDocVerified ? 'Verified' : 'Under Review',
            customAnalysis: {
              stampValue: `Type: ${docType}`,
              executionDate: new Date().toLocaleDateString(),
              partiesInvolved: 'Verified from Chat Attachment',
              docType: docType,
              overallStatus: cleanedText.substring(0, 150),
            },
          };
          if (!currentLocal.some((d: any) => d.id === uploadedDoc.id)) {
            currentLocal = [newDocEntry, ...currentLocal];
            localStorage.setItem(userDocsKey, JSON.stringify(currentLocal));
          }
        } catch (err) {}
      }

      let finalAiContent = cleanedText;

      // If document was rejected as non-legal, emphasize it in AI message
      if (currentFile && isInvalidDoc) {
        const nonLegalNote = language === 'hi'
          ? '⚠️ सिस्टम सत्यापन: आपके द्वारा अपलोड की गई फ़ाइल (जैसे टिकट/फोटो) कोई कानूनी दस्तावेज नहीं है। इसलिए इसे आपके केस वॉलेट/डेटाबेस में स्टोर नहीं किया गया है।'
          : language === 'en'
          ? '⚠️ System Verification: The uploaded file is identified as a non-legal item (e.g. ticket/photo). It is not a valid legal document, so it has NOT been saved to your case vault.'
          : '⚠️ System Verification: Upload ki gayi file (jaise ticket/photo) koi legal document nahi hai. Isliye ise aapke case vault me save nahi kiya gaya hai.';
        if (!finalAiContent.includes('System Verification') && !finalAiContent.includes('सिस्टम सत्यापन')) {
          finalAiContent = `${nonLegalNote}\n\n${finalAiContent}`;
        }
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender_type: 'ai',
        content: finalAiContent,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, aiMsg];
        return updated;
      });

      speakText(finalAiContent);

      if (cId) {
        await saveCaseMessage(cId, 'ai', finalAiContent, 'text', citizenId);

        // Infer case category based on user message and AI response
        const inferredCat = inferCaseCategory(promptText + ' ' + finalAiContent);
        setAllocatedCategory(inferredCat);

        const score = newVerdict === 'user_correct' || newVerdict === 'user_incorrect' ? 0.92 : 0.60;
        await updateCaseVerdictAndSummary(
          cId,
          newVerdict,
          summaryNote || finalAiContent.substring(0, 150),
          score,
          summaryNote ? `Case: ${summaryNote.substring(0, 30)}` : undefined,
          citizenId,
          inferredCat
        );

        // Fetch directory advocates matching category
        const dirLawyers = await fetchLawyersDirectory();
        if (dirLawyers && dirLawyers.length > 0) {
          const categoryFiltered = dirLawyers.filter((l) =>
            l.specialty?.some((s) => s.toLowerCase().includes(inferredCat.toLowerCase()))
          );
          const matchedList = categoryFiltered.length > 0 ? categoryFiltered : dirLawyers;
          setRecommendedLawyers(matchedList);

          // Trigger automated lawyer allocation modal ONLY during final process after thorough conversation (turn >= 8)
          const isLateStageConsultation = messages.length >= 8;
          const hasDefinitiveVerdict = newVerdict === 'user_correct' || newVerdict === 'user_incorrect';
          const hasGoodUnderstanding = isLateStageConsultation && (hasDefinitiveVerdict || Boolean(summaryNote));

          const isCaseLawyerAllocated = Boolean(acceptedConnection || pendingConnection || connectedLawyerIds.length > 0 || caseStatus === 'lawyer_connected');

          console.log('[Wakeel Allot Trigger Check]', {
            isLateStageConsultation,
            hasDefinitiveVerdict,
            hasGoodUnderstanding,
            isCaseLawyerAllocated,
            hasDismissedAllocationModal,
            messagesCount: messages.length,
            lawyersCount: dirLawyers.length,
          });

          if (hasGoodUnderstanding && !isCaseLawyerAllocated && !hasDismissedAllocationModal) {
            setShowAllocationModal(true);
          }
        }
      }
    } catch (err: any) {
      console.error('Chat AI Service Error:', err);

      const fallbackMsg = language === 'hi'
        ? 'नमस्ते सर/मैडम, थोड़ा समय दें। नेटवर्क में कुछ धीमापन आ गया है, कृपया एक बार फिर अपना संदेश भेजें।'
        : language === 'en'
        ? 'Hello Sir/Ma\'am, please give me just a moment. Connection is a bit slow right now, please try sending your message again.'
        : 'Namaste Sir/Ma\'am, thoda waqt dein. Network thoda slow hai, kripya ek baar fir message bhejein.';

      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender_type: 'ai',
          content: fallbackMsg,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#F8FAFC] overflow-hidden">
      
      {/* TOP HEADER BAR WITH LANGUAGE SWITCHER & CASE DETAILS */}
      <header className="bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between shadow-2xs z-20 shrink-0">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={onBackToCases || onBackToHome}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#0F1D38] hover:bg-[#F1F5F9] transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="Back to Cases"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Cases</span>
          </button>

          {/* Toggle Snapshot Sidebar on Mobile/Desktop */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl text-[#0F1D38] hover:bg-[#F0F5FE] transition-all cursor-pointer"
            title="Toggle Case Snapshot"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5 text-[#D98800]" /> : <PanelLeftOpen className="w-5 h-5 text-[#0F1D38]" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0F1D38] text-[#D98800] flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden border border-[#D98800]/40 p-0.5">
              <img
                src={APP_CONFIG.logoUrl}
                alt="Mera Wakeel AI Logo"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0F1D38] flex items-center gap-2">
                <span>Mera Wakeel AI</span>
              </h2>
              <p className="text-[11px] text-[#64748B] font-medium">
                {language === 'hi' ? 'सक्रिय परामर्श' : language === 'en' ? 'Active Consultation' : 'Active Consultation'}
              </p>
            </div>
          </div>
        </div>

        {/* TOP RIGHT: DOCS VAULT, CALL BUTTON, LANGUAGE SWITCHER & EXPORT */}
        <div className="flex items-center gap-2">
          
          {/* My Uploaded Case Documents Button */}
          <button
            onClick={() => setShowCaseDocsModal(true)}
            className="bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E3A8A] border border-[#BFDBFE] text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="View My Uploaded Documents & Case Details"
          >
            <FolderCheck className="w-4 h-4 text-[#1E3A8A]" />
            <span className="hidden md:inline">Documents</span>
            <span className="bg-[#1E3A8A] text-[#FFFFFF] text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {caseDocuments.length}
            </span>
          </button>

          {/* Call Mera Wakeel AI Button */}
          <button
            onClick={() => {
              stopSpeechOutput();
              setIsCallModalOpen(true);
            }}
            className="bg-[#10B981] hover:bg-[#059669] text-[#FFFFFF] text-xs font-extrabold p-2 sm:px-3 sm:py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
            title="Call Mera Wakeel AI"
          >
            <PhoneCall className="w-4 h-4 text-[#FFFFFF]" />
            <span className="hidden lg:inline">Call AI</span>
          </button>

          {/* Export PDF Icon Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#F5A623] border border-[#F5A623]/40 p-2 sm:px-2.5 sm:py-1.5 rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
            title="Export Case Assessment PDF"
          >
            <Download className="w-4 h-4 text-[#F5A623]" />
          </button>

          {/* Three-Option Language Switcher Pill */}
          <div className="bg-[#F1F5F9] p-0.5 rounded-full border border-[#CBD5E1] flex items-center gap-0.5 text-[11px] font-semibold shadow-2xs">
            <button
              onClick={() => handleSelectLanguage('hi')}
              className={`px-2 py-1 rounded-full transition-all cursor-pointer font-bold ${
                language === 'hi' ? 'bg-[#0F1D38] text-[#FFFFFF] shadow-2xs' : 'text-[#475569] hover:text-[#0F1D38]'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => handleSelectLanguage('hinglish')}
              className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
                language === 'hinglish' ? 'bg-[#0F1D38] text-[#FFFFFF] shadow-2xs font-bold' : 'text-[#475569] hover:text-[#0F1D38]'
              }`}
            >
              Hinglish
            </button>
            <button
              onClick={() => handleSelectLanguage('en')}
              className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
                language === 'en' ? 'bg-[#0F1D38] text-[#FFFFFF] shadow-2xs font-bold' : 'text-[#475569] hover:text-[#0F1D38]'
              }`}
            >
              English
            </button>
          </div>

          {/* New Case Button */}
          {onStartNewCase && (
            <button
              onClick={() => {
                stopSpeechOutput();
                onStartNewCase();
              }}
              className="bg-[#D98800] hover:bg-[#C27900] text-[#FFFFFF] text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Case</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER: SIDEBAR + CHAT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT SLIM SIDEBAR: CASE SNAPSHOT */}
        <aside
          className={`${
            isSidebarOpen ? 'w-full md:w-80 lg:w-88' : 'w-0 opacity-0 pointer-events-none'
          } bg-[#FFFFFF] border-r border-[#E2E8F0] transition-all duration-300 flex flex-col shrink-0 z-10 absolute md:relative inset-y-0 left-0 shadow-lg md:shadow-none`}
        >
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D98800]" />
              <h3 className="font-extrabold text-sm text-[#0F1D38]">
                {language === 'hi' ? 'केस स्नैपशॉट' : 'Case Snapshot'}
              </h3>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1 rounded-lg text-[#64748B] hover:text-[#0F1D38]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* VERDICT BADGE */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                {language === 'hi' ? 'कानूनी फैसला स्थिति' : 'Legal Assessment Verdict'}
              </span>

              {verdict === 'user_correct' ? (
                <div className="bg-[#ECFDF5] border border-[#10B981]/30 p-3.5 rounded-xl text-[#047857] space-y-2.5 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-sm">
                        {language === 'hi' ? 'आप सही हैं (User Is Correct)' : language === 'en' ? 'User Is Correct' : 'Aap Sahi Hain (Correct)'}
                      </h4>
                      <p className="text-xs text-[#065F46] mt-0.5 leading-snug">
                        {language === 'hi'
                          ? 'कानून आपके पक्ष में है। कानूनी कार्रवाई के लिए वकील से संपर्क करें।'
                          : 'Legal provisions favor your position. Consult a verified advocate.'}
                      </p>
                    </div>
                  </div>

                  {onFindLawyer && (
                    <button
                      onClick={() => onFindLawyer('Property Law')}
                      className="w-full bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#FFFFFF] font-bold py-2 px-3 rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-[#1E2E4F]"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-[#D98800]" />
                      <span>{language === 'hi' ? 'वकील खोजें (Find a Lawyer)' : 'Find a Verified Lawyer'}</span>
                    </button>
                  )}
                </div>
              ) : verdict === 'user_incorrect' ? (
                <div className="bg-[#FEF2F2] border border-[#EF4444]/30 p-3.5 rounded-xl text-[#991B1B] flex items-start gap-3 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm">
                      {language === 'hi' ? 'आप गलत हैं (In Violation)' : language === 'en' ? 'In Legal Violation' : 'Aap Galat Hain (Incorrect)'}
                    </h4>
                    <p className="text-xs text-[#7F1D1D] mt-0.5 leading-snug">
                      {language === 'hi'
                        ? 'वर्तमान स्थिति में कानूनी जोखिम है। सही रास्ता चुनें।'
                        : 'Position carries legal risk under current law.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FFFBEB] border border-[#F59E0B]/30 p-3.5 rounded-xl text-[#B45309] flex items-start gap-3 shadow-2xs">
                  <Clock className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5 animate-spin-slow" />
                  <div>
                    <h4 className="font-extrabold text-sm">
                      {language === 'hi' ? 'विश्लेषण जारी... (Assessing)' : language === 'en' ? 'Still Assessing Case' : 'Pura Mamla Samajh Rahe Hain...'}
                    </h4>
                    <p className="text-xs text-[#92400E] mt-0.5 leading-snug">
                      {language === 'hi'
                        ? 'बातचीत के आधार पर मूल्यांकन किया जा रहा है।'
                        : 'Gathering details before final legal verdict.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RUNNING SUMMARY NOTES */}
            <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
                <span>{language === 'hi' ? 'मुख्य बिंदु (Key Notes)' : 'Case Key Notes'}</span>
                <span className="text-[10px] text-[#D98800] bg-[#FFFBF0] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                  Auto-Updated
                </span>
              </div>

              {summaryNotes.length === 0 ? (
                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1] text-center text-xs text-[#64748B] space-y-2">
                  <FileText className="w-8 h-8 text-[#94A3B8] mx-auto opacity-60" />
                  <p>
                    {language === 'hi'
                      ? 'केस का सारांश और मुख्य बिंदु यहां जुड़ते जाएंगे जैसे-जैसे बातचीत आगे बढ़ेगी।'
                      : language === 'en'
                      ? 'Case summary and key details will update here as your conversation progresses.'
                      : 'Case summary aur key details yahan add honge jaise-jaise baat aage badhegi.'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {summaryNotes.map((note, idx) => (
                    <li
                      key={idx}
                      className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#334155] leading-relaxed flex items-start gap-2"
                    >
                      <span className="text-[#D98800] font-bold mt-0.5">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* EVIDENCE CHECKLIST (EVIDENCE CHAHIYE) */}
            <div className="space-y-2.5 pt-3 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
                <button
                  onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
                  className="flex items-center gap-1.5 text-[#0F1D38] hover:text-[#D98800] transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-[#D98800]" />
                  <span>
                    {language === 'hi' ? 'एविडेंस/दस्तावेज़ (Evidence Chahiye)' : 'Evidence Chahiye (Checklist)'}
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    {isEvidenceOpen ? '▲' : '▼'}
                  </span>
                </button>
                <span className="text-[10px] font-mono text-[#D98800] bg-[#FFFBF0] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                  {caseEvidence.filter((e) => e.is_available).length}/{caseEvidence.length} Ready
                </span>
              </div>

              {isEvidenceOpen && (
                <div className="space-y-2">
                  {caseEvidence.length === 0 ? (
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1] text-center text-xs text-[#64748B]">
                      <p className="text-[11px] leading-relaxed">
                        {language === 'hi'
                          ? 'AI द्वारा बताए गए ज़रूरी दस्तावेज और एविडेंस यहां चेकलिस्ट में जुड़ेंगे।'
                          : 'Required documents and evidence identified by AI will appear here.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {caseEvidence.map((ev) => {
                        const isCrit = ev.priority === 'critical';
                        const isHelp = ev.priority === 'helpful';
                        const dotColor = isCrit ? 'bg-[#EF4444]' : isHelp ? 'bg-[#F59E0B]' : 'bg-[#94A3B8]';
                        const badgeLabel = isCrit
                          ? (language === 'hi' ? 'अति आवश्यक' : 'Critical')
                          : isHelp
                          ? (language === 'hi' ? 'सहायक' : 'Helpful')
                          : (language === 'hi' ? 'ऐच्छिक' : 'Optional');

                        return (
                          <div
                            key={ev.id}
                            onClick={() => handleToggleEvidence(ev.id, ev.is_available)}
                            className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer text-xs ${
                              ev.is_available
                                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1] text-[#0F1D38]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={ev.is_available}
                              onChange={() => {}} // handled by row click
                              className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] text-[#10B981] focus:ring-[#10B981] cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                                  {badgeLabel}
                                </span>
                              </div>
                              <p className={`font-medium leading-snug break-words ${ev.is_available ? 'line-through opacity-75' : ''}`}>
                                {ev.evidence_description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Manual evidence add input */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newEvidenceInput}
                      onChange={(e) => setNewEvidenceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddManualEvidence(newEvidenceInput);
                      }}
                      placeholder={language === 'hi' ? 'नया दस्तावेज जोड़ें...' : 'Add required document...'}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#D98800] bg-[#FFFFFF]"
                    />
                    <button
                      onClick={() => handleAddManualEvidence(newEvidenceInput)}
                      disabled={!newEvidenceInput.trim()}
                      className="px-2.5 py-1.5 bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#FFFFFF] text-xs font-bold rounded-lg disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI MEMORY (STRUCTURED FACTS) */}
            <div className="space-y-2.5 pt-3 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
                <div className="flex items-center gap-1.5 text-[#0F1D38]">
                  <Brain className="w-4 h-4 text-[#D98800]" />
                  <span>{language === 'hi' ? 'याद रखी गई बातें (AI Memory)' : language === 'en' ? 'AI Memory (Saved Facts)' : 'AI Memory (Saved Facts)'}</span>
                </div>
                <span className="text-[10px] font-mono text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                  {rememberedCaseFacts.length + rememberedProfileFacts.length} Facts
                </span>
              </div>

              {rememberedCaseFacts.length === 0 && rememberedProfileFacts.length === 0 ? (
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1] text-center text-xs text-[#64748B]">
                  <p className="text-[11px] leading-relaxed">
                    {language === 'hi'
                      ? 'जब आप नाम, रिश्ता, दस्तावेज या तारीख बताएंगे, AI उन्हें यहां याद रखेगा।'
                      : 'When you share names, relations, dates or documents, AI stores key facts here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {rememberedCaseFacts.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                        {language === 'hi' ? 'केस संबंधी विवरण:' : 'Case Facts:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rememberedCaseFacts.map((fact) => (
                          <span
                            key={fact.id || fact.fact_key}
                            className="inline-flex items-center gap-1 bg-[#FFFBF0] border border-[#FDE68A] text-[#92400E] px-2 py-1 rounded-md text-[11px] font-medium shadow-2xs"
                          >
                            <span className="font-mono text-[#D98800] text-[10px]">{fact.fact_key}:</span>
                            <span className="font-bold text-[#0F1D38]">{fact.fact_value}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {rememberedProfileFacts.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                        {language === 'hi' ? 'व्यक्तिगत विवरण:' : 'Profile Facts:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rememberedProfileFacts.map((fact) => (
                          <span
                            key={fact.id || fact.fact_key}
                            className="inline-flex items-center gap-1 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] px-2 py-1 rounded-md text-[11px] font-medium shadow-2xs"
                          >
                            <span className="font-mono text-[#2563EB] text-[10px]">{fact.fact_key}:</span>
                            <span className="font-bold text-[#0F1D38]">{fact.fact_value}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MATCHED ADVOCATE ALLOCATION SIDEBAR CARD */}
            {recommendedLawyers.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-[#F1F5F9]">
                <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
                  <div className="flex items-center gap-1.5 text-[#0F1D38]">
                    <Briefcase className="w-4 h-4 text-[#D98800]" />
                    <span>{language === 'hi' ? 'आवंटित वकील (Matched Advocate)' : 'Matched Advocate'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#D98800] bg-[#FFFBF0] px-2 py-0.5 rounded-full border border-[#FDE68A] capitalize">
                    {allocatedCategory}
                  </span>
                </div>

                {(() => {
                  if (acceptedConnection) {
                    const accName = acceptedConnection.lawyer?.profile?.full_name || recommendedLawyers.find((l) => l.id === acceptedConnection.lawyer_id)?.profile?.full_name || 'Advocate';
                    return (
                      <div className="bg-[#ECFDF5] rounded-xl border border-[#10B981]/40 p-3 space-y-2.5 shadow-2xs">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-[#0F1D38] text-[#D98800] font-extrabold text-xs flex items-center justify-center shrink-0">
                            {accName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-xs text-[#0F1D38] truncate">
                              Adv. {accName}
                            </h4>
                            <p className="text-[10px] font-extrabold text-[#047857] mt-0.5">
                              ✓ Lawyer Connected to Case
                            </p>
                          </div>
                        </div>

                        <div className="p-2 bg-[#FFFFFF] border border-[#10B981]/30 text-[#047857] text-[10px] font-bold rounded-lg text-center">
                          Adv. {accName} accepted the request. Direct chat unlocked.
                        </div>

                        <button
                          onClick={() => setIsDirectChatOpen(true)}
                          className="w-full bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#FFFFFF] font-extrabold py-2 px-3 rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <MessageSquareText className="w-3.5 h-3.5 text-[#D98800]" />
                          <span>Message Adv. {accName}</span>
                        </button>
                      </div>
                    );
                  }

                  if (pendingConnection) {
                    const pendName = pendingConnection.lawyer?.profile?.full_name || recommendedLawyers.find((l) => l.id === pendingConnection.lawyer_id)?.profile?.full_name || 'Advocate';
                    return (
                      <div className="bg-[#FFFBF0] rounded-xl border border-[#FDE68A] p-3 space-y-2.5 shadow-2xs">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-[#D97706] text-[#FFFFFF] font-extrabold text-xs flex items-center justify-center shrink-0">
                            {pendName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-xs text-[#92400E] truncate">
                              Adv. {pendName}
                            </h4>
                            <p className="text-[10px] font-bold text-[#B45309] mt-0.5">
                              ⏳ Consultation Request Pending
                            </p>
                          </div>
                        </div>

                        <div className="p-2 bg-[#FFFFFF] border border-[#FDE68A] text-[#B45309] text-[10px] font-semibold rounded-lg text-center leading-relaxed">
                          Request sent to Adv. {pendName}. Awaiting advocate confirmation.
                        </div>
                      </div>
                    );
                  }

                  const list = categoryMatchedLawyers.length > 0 ? categoryMatchedLawyers : recommendedLawyers;
                  const currentLawyer = list[allocatedLawyerIndex % list.length] || list[0];
                  const isConnected = connectedLawyerIds.includes(currentLawyer.id);
                  const isConnecting = connectingLawyerId === currentLawyer.id;

                  return (
                    <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-3 space-y-2.5 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#0F1D38] text-[#D98800] font-extrabold text-xs flex items-center justify-center shrink-0">
                          {currentLawyer.profile?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-xs text-[#0F1D38] truncate">
                            Adv. {currentLawyer.profile?.full_name || 'Advocate'}
                          </h4>
                          <p className="text-[10px] text-[#64748B] truncate">
                            {currentLawyer.specialty?.slice(0, 2).join(', ')} • {currentLawyer.years_experience} Yrs
                          </p>
                          <p className="text-[10px] font-bold text-[#10B981] mt-0.5">
                            ★ {currentLawyer.rating_avg?.toFixed(1) || '4.9'} • {currentLawyer.consultation_fee_range || '₹1,500'}
                          </p>
                        </div>
                      </div>

                      {lawyerConnectNotice && (
                        <div className="p-2 bg-[#ECFDF5] border border-[#10B981]/30 text-[#047857] text-[10px] font-bold rounded-lg">
                          {lawyerConnectNotice}
                        </div>
                      )}

                      {isConnected ? (
                        <div className="w-full bg-[#ECFDF5] text-[#047857] border border-[#10B981]/30 text-xs font-extrabold py-2 rounded-xl text-center flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>Request Sent ✓</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickConnectLawyer(currentLawyer)}
                            disabled={isConnecting}
                            className="flex-1 bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#FFFFFF] font-bold py-2 px-2 rounded-xl text-[11px] shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Send className="w-3 h-3 text-[#D98800]" />
                            <span>{isConnecting ? 'Sending...' : 'Send Request Direct'}</span>
                          </button>
                          {recommendedLawyers.length > 1 && (
                            <button
                              onClick={handleDeclineAndShowNextLawyer}
                              className="px-2 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] text-[10px] font-bold rounded-xl cursor-pointer"
                              title="Next Advocate"
                            >
                              Next →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>

          {/* SIDEBAR FOOTER: CASE STATUS CONTROL */}
          <div className="p-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${caseStatus === 'closed' ? 'bg-[#64748B]' : 'bg-[#10B981]'}`} />
              <span className="text-[#0F1D38]">
                {caseStatus === 'closed'
                  ? (language === 'hi' ? 'केस: बंद (Closed)' : 'Case: Closed')
                  : (language === 'hi' ? 'केस: जारी (Active)' : 'Case: Active')}
              </span>
            </div>

            <button
              onClick={handleToggleCaseStatus}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                caseStatus === 'closed'
                  ? 'bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F1D38] border-[#CBD5E1]'
                  : 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
              }`}
            >
              {caseStatus === 'closed' ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-[#0F1D38]" />
                  <span>{language === 'hi' ? 'केस खोलें' : 'Reopen Case'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>{language === 'hi' ? 'केस बंद करें' : 'Mark Closed'}</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN CHAT AREA */}
        <main className="flex-1 flex flex-col bg-[#F8FAFC] relative overflow-hidden">

          {/* TEMPORARY NOTICE BANNER (On Send Request) */}
          {lawyerConnectNotice && (
            <div className="bg-[#ECFDF5] border-b border-[#10B981]/30 px-4 py-2.5 flex items-center gap-2 animate-fade-in shadow-2xs z-10 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span className="text-[#065F46] text-xs font-bold">{lawyerConnectNotice}</span>
            </div>
          )}

          {/* PENDING ADVOCATE CONNECTION BANNER */}
          {pendingConnection && !acceptedConnection && (
            <div className="bg-[#FFFBF0] border-b border-[#FDE68A]/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-2xs z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D98800] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#92400E] flex items-center gap-2">
                    <span>
                      {language === 'hi' ? 'वकील रिक्वेस्ट पेंडिंग' : 'Request Pending'} — Adv. {pendingConnection.lawyer?.profile?.full_name || recommendedLawyers.find((l) => l.id === pendingConnection.lawyer_id)?.profile?.full_name || 'Advocate'}
                    </span>
                    <span className="bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Waiting
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#B45309]">
                    {language === 'hi' 
                      ? 'वकील को रिक्वेस्ट भेज दी गई है। उनके स्वीकार करने पर चैट शुरू हो जाएगी।'
                      : 'Request sent successfully. Awaiting advocate acceptance to unlock direct chat.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ACCEPTED ADVOCATE CONNECTION BANNER & DIRECT CHAT */}
          {acceptedConnection && (
            <div className="bg-[#ECFDF5] border-b border-[#10B981]/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-2xs z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#10B981] text-[#FFFFFF] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#065F46] flex items-center gap-2">
                    <span>
                      Adv. {acceptedConnection.lawyer?.profile?.full_name || recommendedLawyers.find((l) => l.id === acceptedConnection.lawyer_id)?.profile?.full_name || 'Advocate'} connected to this case.
                    </span>
                    <span className="bg-[#10B981] text-[#FFFFFF] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      CONNECTED
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#047857]">
                    Advocate is allotted for this case. You can send direct messages anytime below.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCaseDocsModal(true)}
                  className="bg-[#FFFFFF] hover:bg-[#F1F5F9] text-[#0F1D38] border border-[#CBD5E1] font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderCheck className="w-3.5 h-3.5 text-[#D98800]" />
                  <span>Case Docs ({caseDocuments.length})</span>
                </button>
                <button
                  onClick={() => setIsDirectChatOpen(!isDirectChatOpen)}
                  className="bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#FFFFFF] font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-[#D98800]" />
                  <span>{isDirectChatOpen ? 'Close Advocate Chat' : `Chat with Adv. ${acceptedConnection.lawyer?.profile?.full_name || recommendedLawyers.find((l) => l.id === acceptedConnection.lawyer_id)?.profile?.full_name || 'Advocate'}`}</span>
                </button>
              </div>
            </div>
          )}

          {acceptedConnection && isDirectChatOpen && (
            <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col animate-fade-in">
              <div className="bg-[#0F1D38] text-[#FFFFFF] px-4 py-3 flex justify-between items-center shrink-0 border-b border-[#1E2E4F]">
                <div className="flex items-center gap-3">
                  <MessageSquareText className="w-5 h-5 text-[#D98800]" />
                  <h2 className="text-base font-bold">Chat with Adv. {acceptedConnection.lawyer?.profile?.full_name || recommendedLawyers.find((l) => l.id === acceptedConnection.lawyer_id)?.profile?.full_name || 'Advocate'}</h2>
                </div>
                <button onClick={() => setIsDirectChatOpen(false)} className="text-[#94A3B8] hover:text-[#FFFFFF] transition-colors p-1.5 rounded-xl hover:bg-[#1E2E4F] cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col p-2 sm:p-4 bg-[#E2E8F0] min-h-0">
                <div className="bg-[#FFFFFF] flex-1 rounded-2xl shadow-xl overflow-hidden border border-[#CBD5E1] flex flex-col min-h-0">
                  <DirectMessagePanel
                    connectionId={acceptedConnection.id}
                    currentUserId={currentUser?.userId || ''}
                    currentUserType="citizen"
                    currentUserName={currentUser?.name || 'Citizen Client'}
                    otherPartyName={`Adv. ${acceptedConnection.lawyer?.profile?.full_name || 'Advocate'}`}
                    otherPartyPhone={acceptedConnection.lawyer?.profile?.phone || '+91 9876543210'}
                    caseTitle={caseTitle}
                    caseSummary={summaryNotes.join(' • ') || 'Legal Consultation Case'}
                    caseCategory={allocatedCategory}
                    compact={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((msg) => {
              const isUser = msg.sender_type === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI Avatar with Project Logo */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#CBD5E1] shadow-2xs overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                      <img
                        src={APP_CONFIG.logoUrl}
                        alt="Mera Wakeel AI Logo"
                        className="w-full h-full object-contain rounded-full"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 shadow-xs text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#0F1D38] text-[#F8FAFC] rounded-2xl rounded-tr-xs border border-[#1E2E4F]'
                        : 'bg-[#FFFFFF] text-[#1E293B] rounded-2xl rounded-tl-xs border border-[#E2E8F0]'
                    }`}
                  >
                    {/* Attached file notice if user sent document */}
                    {msg.attachedFile && (
                      <div className="mb-2.5 p-2 px-3 rounded-xl bg-[#FFFFFF]/10 border border-[#FFFFFF]/20 text-xs font-medium flex items-center justify-between gap-2 backdrop-blur-xs">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-[#D98800] shrink-0" />
                          <span className="font-semibold text-white">📎 Document attach kiya gaya</span>
                        </div>
                        <span className="truncate max-w-[130px] text-[11px] text-[#D98800] font-mono">{msg.attachedFile}</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {!isUser && (
                      <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] text-[10px] text-[#64748B] italic flex items-center gap-1.5 leading-tight">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D98800] shrink-0" />
                        <span>This guidance is for informational purposes only. Please consult a licensed advocate registered with the Bar Council of India for advice specific to your situation.</span>
                      </div>
                    )}

                    <div
                      className={`text-[10px] mt-2 font-medium flex items-center gap-2 ${
                        isUser ? 'text-[#94A3B8] justify-end' : 'text-[#64748B]'
                      }`}
                    >
                      <span>
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => {
                            if (isSpeaking) {
                              stopSpeechOutput();
                            } else {
                              speakText(msg.content);
                            }
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F1D38] text-[11px] font-semibold transition-all cursor-pointer border border-[#CBD5E1]"
                          title="Aawaaz mein suno"
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-[#D98800] animate-bounce' : 'text-[#64748B]'}`} />
                          <span>{isSpeaking ? 'Roko (Stop)' : 'Aawaaz mein Suno'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-[#D98800] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#CBD5E1] shadow-2xs overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src={APP_CONFIG.logoUrl}
                    alt="Mera Wakeel AI Logo"
                    className="w-full h-full object-contain rounded-full animate-pulse"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="bg-[#FFFFFF] p-4 rounded-2xl rounded-tl-xs border border-[#E2E8F0] shadow-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D98800] animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-[#0F1D38] animate-ping delay-100" />
                  <span className="w-2 h-2 rounded-full bg-[#D98800] animate-ping delay-200" />
                  <span className="text-xs text-[#64748B] font-medium ml-1">
                    {language === 'hi' ? 'AI विश्लेषण कर रही है...' : 'AI is analyzing law...'}
                  </span>
                </div>
              </div>
            )}

            {/* QUICK-START SUGGESTION CHIPS (First-time / Empty Chat) */}
            {messages.length <= 1 && !isLoading && (
              <div className="py-8 px-4 max-w-xl mx-auto text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-[#0F1D38] text-[#D98800] mx-auto flex items-center justify-center shadow-md border border-[#D98800]/40 p-1">
                  <img
                    src={APP_CONFIG.logoUrl}
                    alt="Mera Wakeel AI"
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-extrabold text-[#0F1D38]">
                    {language === 'hi' ? 'नमस्ते, मैं एडवोकेट नया हूँ' : 'Namaste, I am Advocate Naya'}
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                    {language === 'hi'
                      ? 'अपनी कानूनी समस्या (प्रॉपर्टी, किराया, कंज्यूमर शिकायत या नोटिस) साझा करें या कोई दस्तावेज अपलोड करें।'
                      : 'Share your legal concern (property, tenant, consumer dispute, or notice) or upload a document.'}
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    {language === 'hi' ? 'त्वरित शुरुआत के लिए सवाल चुनें' : 'Quick Start Legal Queries'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickChips[language].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="bg-[#FFFFFF] hover:bg-[#F0F5FE] border border-[#CBD5E1] hover:border-[#D98800] text-[#0F1D38] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D98800]" />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* AI SPEAKING FLOATING CONTROL BAR */}
          {isSpeaking && (
            <div className="bg-[#0F1D38] text-[#FFFFFF] px-4 py-2 flex items-center justify-between border-t border-[#D98800]/40 shadow-lg animate-slide-up">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F8FAFC]">
                <Volume2 className="w-4 h-4 text-[#D98800] animate-pulse" />
                <span>
                  {language === 'hi' ? 'AI बोल रहा है...' : language === 'en' ? 'AI is speaking...' : 'AI bol raha hai...'}
                </span>
              </div>
              <button
                onClick={stopSpeechOutput}
                className="bg-[#EF4444] hover:bg-[#DC2626] text-[#FFFFFF] text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>{language === 'hi' ? 'रोकें' : language === 'en' ? 'Stop' : 'Roko'}</span>
              </button>
            </div>
          )}

          {/* INPUT SECTION & CONTROLS */}
          <div className="p-3 sm:p-4 bg-[#FFFFFF] border-t border-[#E2E8F0] space-y-2 shrink-0">
            
            {/* Top Row: File Upload Pill & TTS Voice Toggle Switch */}
            <div className="flex items-center justify-between px-1 text-xs">
              
              {/* Attached file preview chip */}
              <div>
                {selectedFile ? (
                  <div className="inline-flex items-center gap-2 bg-[#F0F5FE] text-[#1E3A8A] px-3 py-1.5 rounded-xl border border-[#CBD5E1] font-medium shadow-2xs">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Document preview"
                        className="w-7 h-7 object-cover rounded-md border border-[#CBD5E1] shrink-0"
                      />
                    ) : (
                      <Paperclip className="w-4 h-4 text-[#D98800] shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="truncate max-w-[160px] text-xs font-semibold text-[#0F1D38]">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Photo Document
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 text-[#64748B] hover:text-[#EF4444] hover:bg-[#CBD5E1]/50 rounded-full transition-colors ml-1 cursor-pointer"
                      title="Remove document"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#64748B]">
                    {language === 'hi' ? 'दस्तावेज़/नोटिस की फोटो अटैच करें (Stamp Paper, Will, Registry, etc.)' : 'Attach Document Photo (Stamp Paper, Will, Registry, etc.)'}
                  </span>
                )}
              </div>

              {/* TTS Voice Toggle Switch */}
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#334155]">
                <span>
                  {language === 'hi'
                    ? 'AI की आवाज़ में जवाब'
                    : language === 'en'
                    ? "Hear AI's reply aloud"
                    : 'AI ki awaaz me jawab'}
                </span>
                <input
                  type="checkbox"
                  checked={voiceOutputEnabled}
                  onChange={(e) => {
                    setVoiceOutputEnabled(e.target.checked);
                    if (!e.target.checked) stopSpeechOutput();
                  }}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#D98800] relative"></div>
              </label>
            </div>

            {/* ROUNDED INPUT CONTAINER */}
            <div className="bg-[#F8FAFC] rounded-2xl p-2.5 border border-[#CBD5E1] focus-within:border-[#0F1D38] focus-within:ring-2 focus-within:ring-[#0F1D38]/10 transition-all flex items-end gap-2 shadow-2xs">
              
              {/* Paperclip / File Picker Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-[#64748B] hover:text-[#0F1D38] hover:bg-[#E2E8F0] transition-colors cursor-pointer shrink-0 mb-0.5"
                title="Attach legal document photo (Stamp Paper, Registry, Will, Sale Deed, FIR, Notice)"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Auto-resizing Textarea */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder={placeholders[language]}
                rows={1}
                className="flex-1 bg-transparent border-0 focus:outline-none resize-none text-sm leading-relaxed text-[#0F1D38] placeholder-[#94A3B8] py-1.5 px-1 min-h-[28px] max-h-[112px] overflow-y-hidden transition-all duration-75"
              />

              {/* Microphone Button for Voice Input */}
              <button
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 mb-0.5 ${
                  isListening
                    ? 'bg-[#EF4444] text-[#FFFFFF] animate-pulse shadow-md'
                    : 'text-[#64748B] hover:text-[#0F1D38] hover:bg-[#E2E8F0]'
                }`}
                title="Speak message"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!inputText.trim() && !selectedFile)}
                className="w-10 h-10 rounded-xl bg-[#0F1D38] hover:bg-[#1A2D54] disabled:opacity-40 text-[#FFFFFF] flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0 mb-0.5"
                title="Send message"
              >
                <Send className="w-4 h-4 text-[#D98800]" />
              </button>
            </div>

            {/* HINT ROW BELOW INPUT BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-1 text-[11px] text-[#64748B] px-1 pt-0.5">
              <div className="flex items-center gap-1.5 font-medium shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                <span className="text-[#0F1D38] font-bold">
                  Groq AI Active
                </span>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* AI Live Voice Call Interface Modal */}
      <AICallModal
        isOpen={isCallModalOpen}
        language={language}
        caseId={currentCaseId}
        citizenId={currentUser?.userId || 'guest_citizen'}
        onEndCall={handleEndCallTranscript}
        onLiveMessage={(msg) => {
          const newMsgObj: ChatMessage = {
            id: `call-msg-${Date.now()}-${Math.random()}`,
            sender_type: msg.sender_type,
            content: msg.content,
            attachedFile: msg.fileAttached,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, newMsgObj]);
        }}
      />

      {/* AUTOMATED ADVOCATE ALLOCATION POPUP MODAL */}
      {showAllocationModal && recommendedLawyers.length > 0 && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFFFFF] w-full max-w-lg rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-5 relative">
            <button
              onClick={() => {
                setShowAllocationModal(false);
                setHasDismissedAllocationModal(true);
              }}
              className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F1D38] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F1D38] text-[#D98800] flex items-center justify-center font-bold shadow-md shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D98800] bg-[#FFFBF0] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                  AI Advocate Allocation • {allocatedCategory.toUpperCase()}
                </span>
                <h3 className="text-base font-extrabold text-[#0F1D38] mt-1 leading-tight">
                  Matched Advocate Selected
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Based on your conversation and case category (<strong>{allocatedCategory}</strong>), Mera Wakeel AI has matched a verified advocate for your matter:
            </p>

            {(() => {
              const list = categoryMatchedLawyers.length > 0 ? categoryMatchedLawyers : recommendedLawyers;
              const currentLawyer = list[allocatedLawyerIndex % list.length] || list[0];
              return (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0F1D38] text-[#D98800] font-extrabold text-base flex items-center justify-center border border-[#D98800]/40 shrink-0 shadow-sm">
                      {currentLawyer.profile?.full_name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-[#0F1D38]">
                        Adv. {currentLawyer.profile?.full_name || 'Advocate'}
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Bar Reg: <span className="font-mono text-[#0F1D38] font-bold">{currentLawyer.bar_council_number || 'D/2048/2018'}</span>
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs mt-1.5">
                        <span className="bg-[#EFF6FF] text-[#1E3A8A] px-2 py-0.5 rounded-md font-bold">
                          {currentLawyer.years_experience} Yrs Exp
                        </span>
                        <span className="bg-[#ECFDF5] text-[#047857] px-2 py-0.5 rounded-md font-bold">
                          ★ {currentLawyer.rating_avg?.toFixed(1) || '4.9'}
                        </span>
                        <span className="bg-[#FFFBF0] text-[#92400E] px-2 py-0.5 rounded-md font-bold">
                          {currentLawyer.consultation_fee_range || '₹1,500/session'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#64748B] border-t border-[#E2E8F0] pt-2">
                    <strong>Specialties:</strong> {currentLawyer.specialty?.join(', ')}
                  </div>
                </div>
              );
            })()}

            <p className="text-xs font-bold text-[#0F1D38] text-center bg-[#FEF3C7] text-[#92400E] p-2.5 rounded-xl border border-[#FDE68A]">
              "I have selected this advocate for your case. Shall I send your AI case summary request to them?"
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                onClick={handleAcceptAllocatedLawyer}
                className="w-full sm:flex-1 bg-[#10B981] hover:bg-[#059669] text-[#FFFFFF] font-extrabold py-3 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, Send Case Request</span>
              </button>

              <button
                onClick={handleDeclineAndShowNextLawyer}
                className="w-full sm:w-auto bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-bold py-3 px-3 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1 border border-[#CBD5E1]"
              >
                <span>No, Show Next Advocate →</span>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setShowAllocationModal(false);
                  setHasDismissedAllocationModal(true);
                }}
                className="text-xs font-bold text-[#64748B] hover:text-[#0F1D38] underline cursor-pointer"
              >
                Decide Later (Dismiss & Keep in Sidebar)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CITIZEN CASE DETAILS & DOCUMENT VAULT MODAL */}
      {showCaseDocsModal && (
        <div className="fixed inset-0 bg-[#000000]/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-[#FFFFFF] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E2E8F0] my-8 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-[#0F1D38] text-[#FFFFFF] flex items-center justify-between shrink-0 border-b border-[#1E2E4F]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E2E4F] text-[#D98800] flex items-center justify-center font-bold shadow-xs">
                  <FolderCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <span>{caseTitle || 'My Case Details & Document Vault'}</span>
                    <span className="text-[10px] font-bold bg-[#D98800] text-[#FFFFFF] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {allocatedCategory}
                    </span>
                  </h3>
                  <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                    {language === 'hi' 
                      ? 'आपके द्वारा अपलोड किए गए सभी कानूनी दस्तावेज और केस रिपोर्ट'
                      : 'All your uploaded legal documents & AI case details'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCaseDocsModal(false)}
                className="p-2 text-[#94A3B8] hover:text-[#FFFFFF] rounded-xl hover:bg-[#1E2E4F] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#F8FAFC]">
              
              {/* Case Summary Snapshot Card */}
              <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                  <span className="text-xs font-extrabold text-[#0F1D38] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#D98800]" />
                    Case Summary Snapshot
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    verdict === 'user_correct'
                      ? 'bg-[#ECFDF5] text-[#047857] border border-[#10B981]/30'
                      : verdict === 'user_incorrect'
                      ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#EF4444]/30'
                      : 'bg-[#FFFBF0] text-[#92400E] border border-[#FDE68A]'
                  }`}>
                    {verdict === 'user_correct' ? 'User Correct' : verdict === 'user_incorrect' ? 'In Violation' : 'Assessing'}
                  </span>
                </div>

                <div className="text-xs text-[#334155] leading-relaxed space-y-1.5">
                  {summaryNotes.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {summaryNotes.map((note, idx) => (
                        <li key={idx} className="text-[#0F1D38] font-medium">{note}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic text-[#64748B]">Case description is active. AI is analyzing details from your conversation.</p>
                  )}
                </div>
              </div>

              {/* Uploaded Documents List Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#0F1D38] flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#10B981]" />
                    <span>Uploaded Legal Documents ({caseDocuments.length})</span>
                  </h4>

                  {/* Upload button inside modal */}
                  <label className="bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#FFFFFF] text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs">
                    <Plus className="w-3.5 h-3.5 text-[#D98800]" />
                    <span>Upload New File</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {caseDocuments.length === 0 ? (
                  <div className="p-8 bg-[#FFFFFF] rounded-2xl border border-dashed border-[#CBD5E1] text-center space-y-3">
                    <FileText className="w-10 h-10 text-[#94A3B8] mx-auto opacity-50" />
                    <div>
                      <p className="text-xs font-bold text-[#0F1D38]">No documents uploaded yet</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        You can upload property agreements, stamp paper photos, or legal notices to view AI breakdown.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {caseDocuments.map((doc) => {
                      const docTypeFormatted = (doc.document_type || 'other').replace(/_/g, ' ').toUpperCase();
                      const fileExt = doc.file_url?.split('.').pop()?.toUpperCase() || 'DOC';
                      return (
                        <div key={doc.id} className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-3 hover:border-[#CBD5E1] transition-all">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] flex items-center justify-center font-extrabold text-xs shrink-0">
                                {fileExt}
                              </div>
                              <div>
                                <h5 className="font-extrabold text-xs text-[#0F1D38] flex items-center gap-2">
                                  <span>Document #{doc.id.slice(0, 6)}</span>
                                  <span className="bg-[#FFFBF0] text-[#92400E] border border-[#FDE68A] text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                    {docTypeFormatted}
                                  </span>
                                </h5>
                                <p className="text-[11px] text-[#64748B] mt-0.5">
                                  Uploaded on: {new Date(doc.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold bg-[#ECFDF5] text-[#047857] px-2 py-0.5 rounded-md border border-[#10B981]/30">
                              Verified
                            </span>
                          </div>

                          {doc.ai_analysis && (
                            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs text-[#334155] space-y-1">
                              <p className="font-bold text-[#0F1D38] text-[11px]">AI Analysis Summary:</p>
                              <p className="leading-relaxed text-[11px]">{doc.ai_analysis}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Extracted Facts & Evidence Summary */}
              {caseEvidence.length > 0 && (
                <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-2.5">
                  <h4 className="text-xs font-extrabold text-[#0F1D38] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-[#D98800]" />
                    Required Documents Checklist ({caseEvidence.filter(e => e.is_available).length}/{caseEvidence.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {caseEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                          ev.is_available ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F1D38]'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${ev.is_available ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                        <span className={`font-medium truncate ${ev.is_available ? 'line-through opacity-75' : ''}`}>
                          {ev.evidence_description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
              <span className="text-xs text-[#64748B] font-medium">
                Mera Wakeel Secure Case Storage
              </span>
              <button
                onClick={() => setShowCaseDocsModal(false)}
                className="bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#FFFFFF] font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Close Vault
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EXPORT CASE SUMMARY PDF MODAL */}
      {isExportModalOpen && (
        <ExportModal
          caseData={{
            caseId: currentCaseId || undefined,
            caseTitle: caseTitle || 'Legal Assessment Summary',
            category: allocatedCategory || 'Legal Consultation',
            aiVerdict: verdict,
            aiSummary: summaryNotes.join('\n') || 'Case analysis in progress.',
            confidenceScore: 88,
            evidenceChecklist: caseEvidence.map((e) => ({
              description: e.evidence_description,
              priority: e.priority,
              available: e.is_available,
            })),
            caseFacts: rememberedCaseFacts.map((f) => ({ key: f.fact_key, value: f.fact_value })),
            messages: messages.map((m) => ({
              sender: m.sender_type === 'user' ? 'user' : 'ai',
              text: m.content,
            })),
          }}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

    </div>
  );
};
