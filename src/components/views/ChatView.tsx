import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Language, UserRole } from '../../types';
import {
  MessageSquareText,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Square,
  Sparkles,
  X,
  CheckCircle2,
  Plus,
  Clock,
  PhoneCall,
  FolderCheck,
  FileCheck,
  FileText,
  Download,
  Volume2,
  CheckSquare,
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
  trackEvent,
} from '../../lib/supabase';
import { isLowBandwidth } from '../../lib/pwa';
import { CaseFact, ProfileFact, CaseEvidence, EvidencePriority, CaseStatus, Lawyer, LawyerConnection, Document } from '../../types/database';
import { AICallModal } from '../AICallModal';
import { DirectMessagePanel } from '../DirectMessagePanel';
import { ExportModal } from '../ExportModal';
import { APP_CONFIG } from '../../constants';
import { sendGeminiChatMessage } from '../../lib/geminiApi';
import {
  ChatMessage,
  langToPreferred,
  parseAIResponse,
  fallbackNetworkMessage,
  useSpeechOutput,
} from '../chat/parts';
import { ChatMessageList } from '../chat/ChatMessageList';
import { ChatInputBar } from '../chat/ChatInputBar';
import { ChatSidebar } from '../chat/ChatSidebar';
import { LanguageSwitcher } from '../chat/LanguageSwitcher';

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

  const [verdict, setVerdict] = useState<'user_correct' | 'user_incorrect' | 'needs_more_info'>('needs_more_info');
  const [summaryNotes, setSummaryNotes] = useState<string[]>([]);
  const [caseTitle, setCaseTitle] = useState<string>('Legal Consultation Case');
  const [caseStatus, setCaseStatus] = useState<CaseStatus>('ongoing');
  const [caseEvidence, setCaseEvidence] = useState<CaseEvidence[]>([]);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState<boolean>(true);
  const [newEvidenceInput, setNewEvidenceInput] = useState<string>('');
  const [rememberedCaseFacts, setRememberedCaseFacts] = useState<CaseFact[]>([]);
  const [rememberedProfileFacts, setRememberedProfileFacts] = useState<ProfileFact[]>([]);

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

  const speech = useSpeechOutput(language);
  const { voiceOutputEnabled, setVoiceOutputEnabled, isSpeaking, speakText, stopSpeechOutput } = speech;

  useEffect(() => {
    fetchLawyersDirectory().then((dir) => {
      setRecommendedLawyers(dir);
    });
  }, []);

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

  const acceptedConnection = useMemo(() => {
    if (citizenConnections.length === 0) return null;
    if (currentCaseId) {
      const caseMatch = citizenConnections.find(
        (c) => (c.case_id === currentCaseId || c.case?.id === currentCaseId) &&
               (c.status === 'accepted' || c.status === 'approved' || c.status === 'lawyer_connected' || c.status === 'completed')
      );
      if (caseMatch) return caseMatch;
    }
    const generalMatch = citizenConnections.find(
      (c) => c.status === 'accepted' || c.status === 'approved' || c.status === 'lawyer_connected' || c.status === 'completed'
    );
    return generalMatch || null;
  }, [citizenConnections, currentCaseId]);

  const pendingConnection = useMemo(() => {
    if (citizenConnections.length === 0) return null;
    if (currentCaseId) {
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      stopSpeechOutput();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initCase() {
      const citizenId = currentUser?.userId || 'cfabc5e6-1924-451e-8cc7-afc493f4e239';

      let cId = activeCaseId || currentCaseId;

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

        if (citizenId) {
          const cFacts = await fetchCaseFacts(cId);
          const pFacts = await fetchProfileFacts(citizenId);
          const evidenceList = await fetchCaseEvidence(cId);
          const caseDocs = await fetchCaseDocuments(cId);

          if (isMounted) {
            setRememberedCaseFacts(cFacts);
            setRememberedProfileFacts(pFacts);
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

  const handleToggleCaseStatus = async () => {
    if (!currentCaseId) return;
    const citizenId = currentUser?.userId || 'guest_citizen';
    const newStatus: CaseStatus = caseStatus === 'closed' ? 'ongoing' : 'closed';
    setCaseStatus(newStatus);
    await updateCaseStatus(currentCaseId, citizenId, newStatus);
  };

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

  const handleSelectLanguage = async (newLang: Language) => {
    onLanguageChange(newLang);
    stopSpeechOutput();

    if (currentUser?.userId) {
      const fullLangName = langToPreferred(newLang);
      await createOrUpdateProfile({
        id: currentUser.userId,
        preferred_language: fullLangName as any,
      });
    }
  };

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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleVoiceOutput = (enabled: boolean) => {
    setVoiceOutputEnabled(enabled);
    if (!enabled) stopSpeechOutput();
  };

  const handleSendMessage = async (customText?: string) => {
    if (isLoading) return;
    const textToSend = customText || inputText;
    if (!textToSend.trim() && !selectedFile) return;

    setIsLoading(true);

    if (messages.length <= 1) {
      setIsSidebarOpen(true);
      trackEvent('chat_started', { user_id: currentUser?.userId });
    }

    stopSpeechOutput();

    const currentFile = selectedFile;
    const currentPreview = filePreview;

    setInputText('');
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const citizenId = currentUser?.userId || 'guest_citizen';

    try {
      let cId = currentCaseId;
      if (!cId) {
        const createdCase = await createCase(
          citizenId,
          currentFile ? `Document Case: ${currentFile.name}` : `Case: ${textToSend.substring(0, 25)}...`
        );
        cId = createdCase.id;
        setCurrentCaseId(cId);
        trackEvent('case_created', { case_id: cId, user_id: citizenId });
      }

      const defaultPrompt = 'Ye document dekho aur mujhe samjhao ki ye kya hai.';
      const promptText = textToSend.trim() || defaultPrompt;

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

      const { cleanedText: textAfterFacts, extractedFacts } = await saveExtractedFacts(
        cId,
        citizenId,
        rawAiText
      );

      const { cleanedText: textAfterEvidence, extractedEvidences } = await saveExtractedEvidence(
        cId,
        textAfterFacts
      );

      if (cId && extractedEvidences.length > 0) {
        const updatedEvList = await fetchCaseEvidence(cId);
        setCaseEvidence(updatedEvList);
      }

      const docType = currentFile ? inferDocumentType(textAfterEvidence) : 'other';

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

      if (cId) {
        const cFacts = await fetchCaseFacts(cId);
        setRememberedCaseFacts(cFacts);
      }
      const pFacts = await fetchProfileFacts(citizenId);
      setRememberedProfileFacts(pFacts);

      let { cleanedText, newVerdict, summaryNote, docValidity, caseStatusUpdate } = parseAIResponse(textAfterEvidence, verdict);

      if (caseStatusUpdate && cId) {
        setCaseStatus(caseStatusUpdate);
        await updateCaseStatus(cId, citizenId, caseStatusUpdate);
      }

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

      setVerdict(newVerdict);
      if (summaryNote) {
        setSummaryNotes((prev) => [summaryNote, ...prev]);
      }

      const isInvalidDoc =
        docValidity === 'invalid' ||
        docType === 'unknown' ||
        cleanedText.toLowerCase().includes('not a legal document') ||
        cleanedText.toLowerCase().includes('koi legal document nahi') ||
        cleanedText.toLowerCase().includes('photo of ticket') ||
        cleanedText.toLowerCase().includes('stamp paper nahi');

      if (currentFile && isInvalidDoc) {
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

      if (!isLowBandwidth()) speakText(finalAiContent);

      if (cId) {
        await saveCaseMessage(cId, 'ai', finalAiContent, 'text', citizenId);

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
        trackEvent('case_score_updated', { case_id: cId, verdict: newVerdict, score, category: inferredCat, user_id: citizenId });

        const dirLawyers = await fetchLawyersDirectory();
        if (dirLawyers && dirLawyers.length > 0) {
          const categoryFiltered = dirLawyers.filter((l) =>
            l.specialty?.some((s) => s.toLowerCase().includes(inferredCat.toLowerCase()))
          );
          const matchedList = categoryFiltered.length > 0 ? categoryFiltered : dirLawyers;
          setRecommendedLawyers(matchedList);

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

      const fallbackMsg = fallbackNetworkMessage(language);

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

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#F8FAFC] overflow-hidden">
      <header className="bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between shadow-2xs z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCases || onBackToHome}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#0F1D38] hover:bg-[#F1F5F9] transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="Back to Cases"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Cases</span>
          </button>

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

        <div className="flex items-center gap-2">
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

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#F5A623] border border-[#F5A623]/40 p-2 sm:px-2.5 sm:py-1.5 rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
            title="Export Case Assessment PDF"
          >
            <Download className="w-4 h-4 text-[#F5A623]" />
          </button>

          <LanguageSwitcher language={language} onSelectLanguage={handleSelectLanguage} />

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

      <div className="flex-1 flex overflow-hidden relative">
        <ChatSidebar
          open={isSidebarOpen}
          language={language}
          onClose={() => setIsSidebarOpen(false)}
          verdict={verdict}
          summaryNotes={summaryNotes}
          caseEvidence={caseEvidence}
          isEvidenceOpen={isEvidenceOpen}
          onToggleEvidenceOpen={() => setIsEvidenceOpen(!isEvidenceOpen)}
          newEvidenceInput={newEvidenceInput}
          onNewEvidenceInputChange={setNewEvidenceInput}
          onAddManualEvidence={handleAddManualEvidence}
          onToggleEvidence={handleToggleEvidence}
          rememberedCaseFacts={rememberedCaseFacts}
          rememberedProfileFacts={rememberedProfileFacts}
          recommendedLawyers={recommendedLawyers}
          acceptedConnection={acceptedConnection}
          pendingConnection={pendingConnection}
          categoryMatchedLawyers={categoryMatchedLawyers}
          allocatedLawyerIndex={allocatedLawyerIndex}
          allocatedCategory={allocatedCategory}
          connectedLawyerIds={connectedLawyerIds}
          connectingLawyerId={connectingLawyerId}
          lawyerConnectNotice={lawyerConnectNotice}
          onQuickConnectLawyer={handleQuickConnectLawyer}
          onDeclineAndShowNextLawyer={handleDeclineAndShowNextLawyer}
          onOpenDirectChat={() => setIsDirectChatOpen(true)}
          caseStatus={caseStatus}
          onToggleCaseStatus={handleToggleCaseStatus}
          onFindLawyer={onFindLawyer}
        />

        <main className="flex-1 flex flex-col bg-[#F8FAFC] relative overflow-hidden">
          {lawyerConnectNotice && (
            <div className="bg-[#ECFDF5] border-b border-[#10B981]/30 px-4 py-2.5 flex items-center gap-2 animate-fade-in shadow-2xs z-10 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span className="text-[#065F46] text-xs font-bold">{lawyerConnectNotice}</span>
            </div>
          )}

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

          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            language={language}
            currentUserName={currentUser?.name}
            isSpeaking={isSpeaking}
            speakText={speakText}
            stopSpeechOutput={stopSpeechOutput}
            messagesEndRef={messagesEndRef}
            onQuickChip={handleSendMessage}
          />

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

          <ChatInputBar
            language={language}
            inputText={inputText}
            setInputText={setInputText}
            isLoading={isLoading}
            onSend={() => handleSendMessage()}
            selectedFile={selectedFile}
            filePreview={filePreview}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
            voiceOutputEnabled={voiceOutputEnabled}
            onToggleVoiceOutput={handleToggleVoiceOutput}
            stopSpeechOutput={stopSpeechOutput}
          />
        </main>
      </div>

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

      {showCaseDocsModal && (
        <div className="fixed inset-0 bg-[#000000]/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-[#FFFFFF] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E2E8F0] my-8 overflow-hidden flex flex-col max-h-[90vh]">
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

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#F8FAFC]">
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#0F1D38] flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#10B981]" />
                    <span>Uploaded Legal Documents ({caseDocuments.length})</span>
                  </h4>

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