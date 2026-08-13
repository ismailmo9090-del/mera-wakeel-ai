import { useCallback, useState } from 'react';
import { Language } from '../../types';
import { CaseStatus } from '../../types/database';
import { speakNaturalMaleVoice, stopNaturalVoice } from '../../lib/audioVoice';
import { LEGAL_CITATIONS } from '../../lib/legalCitations';

export interface ChatMessage {
  id: string;
  sender_type: 'user' | 'ai';
  content: string;
  message_type?: 'text' | 'voice' | 'document_reference';
  created_at?: string;
  attachedFile?: string;
  attachedFileUrl?: string;
}

export const langToPreferred = (lang: Language): string => {
  switch (lang) {
    case 'hi': return 'hindi';
    case 'en': return 'english';
    case 'hinglish': return 'hinglish';
    case 'ta': return 'tamil';
    case 'te': return 'telugu';
    case 'mr': return 'marathi';
    case 'bn': return 'bengali';
    case 'kn': return 'kannada';
    case 'gu': return 'gujarati';
    default: return 'hindi';
  }
};

const CITATION_ACT_CODES = (() => {
  const shorts = Array.from(
    new Set(LEGAL_CITATIONS.map((c) => c.actShort).filter(Boolean))
  ).sort((a, b) => b.length - a.length);
  return shorts.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
})();

export const extractCitations = (text: string): string[] => {
  const results: string[] = [];
  const patterns: RegExp[] = [
    new RegExp(`\\b(?:${CITATION_ACT_CODES})\\s*-?\\s*(\\d{1,4}[A-Z]?)\\b`, 'gi'),
    /\b(?:Section|Sec)\s+(\d{1,4}[A-Z]?)\s+of\s+(?:the\s+)?((?:[A-Za-z][A-Za-z .&'-]*\s+)?Act)\b/gi,
    /\b(?:Section|Sec)\s+(\d{1,4}[A-Z]?)\s+((?:[A-Za-z][A-Za-z .&'-]*\s+)?Act)\b/gi,
  ];
  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(text)) !== null) {
      const hit = m[0].trim();
      const display = hit.length > 42 ? hit.slice(0, 42) + '…' : hit;
      if (!results.includes(display)) results.push(display);
      if (results.length >= 6) return results;
    }
  }
  return results;
};

export const getWelcomeGreeting = (lang: Language) => {
  if (lang === 'hi') {
    return 'नमस्ते! मैं आपकी Mera Wakeel AI लीगल एडवाइजर (Advocate Naya) हूं। अपनी कानूनी समस्या (प्रॉपर्टी, किराया विवाद, कंज्यूमर शिकायत या नोटिस) विस्तार से बताएं। मैं आपको सही कानूनी रास्ता समझाऊंगी।';
  } else if (lang === 'en') {
    return 'Namaste! I am Advocate Naya, your Mera Wakeel AI Legal Assistant. Please describe your legal issue (property, tenant, consumer complaint, or notice) in detail, and I will guide you with actionable next steps.';
  } else {
    return 'Namaste! Main aapki Mera Wakeel AI Legal Advocate (Naya) hoon. Apni kanooni samasya (property, rental, consumer dispute ya notice) batayein, main aapko sahi rasta samjhaungi.';
  }
};

export const QUICK_CHIPS: Record<Language, string[]> = {
  hi: ['संपत्ति विवाद', 'दस्तावेज़ समझ नहीं आते', 'किराया/डिपॉज़िट विवाद', 'ज़मीन पर कब्ज़ा'],
  en: ['Property Dispute', 'Document Confusion', 'Tenant/Deposit Issue', 'Land Encroachment'],
  hinglish: ['Property Jhagda', 'Documents Nahi Samajh Aate', 'Kiraya/Deposit Vivaad', 'Zameen Par Kabza'],
  ta: ['சொத்து தகராறு', 'ஆவணம் புரியவில்லை', 'வாடகை/வைப்பு பிரச்சனை', 'நிலம் ஆக்கிரமிப்பு'],
  te: ['ఆస్తి వివాదం', 'పత్రం అర్థం కావడం లేదు', 'అద్దె/డిపాజిట్ సమస్య', 'భూమి ఆక్రమణ'],
  mr: ['मालमत्ता वाद', 'कागदपत्र समजत नाहीत', 'भाडे/ठेव वाद', 'जमिनीवर आक्रमण'],
  bn: ['সম্পত্তি বিবাদ', 'নথি বুঝতে পারছি না', 'ভাড়া/জমা বিবাদ', 'জমি দখল'],
  kn: ['ಆಸ್ತಿ ವಿವಾದ', 'ದಾಖಲೆ ಅರ್ಥವಾಗುತ್ತಿಲ್ಲ', 'ಬಾಡಿಗೆ/ಠೇವಣಿ ಸಮಸ್ಯೆ', 'ಜಮೀನು ಆಕ್ರಮಣ'],
  gu: ['મિલકત વિવાદ', 'દસ્તાવેજ સમજાતા નથી', 'ભાડું/ડિપોઝિટ વિવાદ', 'જમીન પર કબજો'],
};

export const PLACEHOLDERS: Record<Language, string> = {
  hi: 'अपनी समस्या लिखें, या माइक दबाएं...',
  en: 'Type your problem, or tap the mic...',
  hinglish: 'Apni samasya likho, ya mic dabao...',
  ta: 'உங்கள் பிரச்சனையை எழுதுங்கள், அல்லது மைக்கை அழுத்துங்கள்...',
  te: 'మీ సమస్యను టైప్ చేయండి, లేదా మైక్ నొక్కండి...',
  mr: 'तुमची समस्या लिहा, किंवा मायक दाबा...',
  bn: 'আপনার সমস্যা লিখুন, অথবা মাইক চাপুন...',
  kn: 'ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ, ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ...',
  gu: 'તમારી સમસ્યા લખો, અથવા માઇક દબાવો...',
};

export const DISCLAIMERS: Record<Language, string> = {
  hi: 'Ye guidance sirf jaankari ke liye hai, professional legal advice ka replacement nahi.',
  en: 'Ye guidance sirf jaankari ke liye hai, professional legal advice ka replacement nahi.',
  hinglish: 'Ye guidance sirf jaankari ke liye hai, professional legal advice ka replacement nahi.',
  ta: 'இந்த வழிகாட்டுதல் தகவலுக்காக மட்டுமே, தொழில்முறை சட்ட ஆலோசனைக்கு மாற்றாக அல்ல.',
  te: 'ఈ మార్గదర్శకం సమాచారం కోసం మాత్రమే, వృత్తిపరమైన చట్టపరమైన సలహాకు ప్రత్యామ్నాయం కాదు.',
  mr: 'हे मार्गदर्शन फक्त माहितीसाठी आहे, व्यावसायिक कायदेशीर सल्ल्याचा पर्याय नाही.',
  bn: 'এই নির্দেশনা শুধুমাত্র তথ্যের জন্য, পেশাদার আইনি পরামর্শের বিকল্প নয়।',
  kn: 'ಈ ಮಾರ್ಗದರ್ಶನ ಮಾಹಿತಿಗಾಗಿ ಮಾತ್ರ, ವೃತ್ತಿಪರ ಕಾನೂನು ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.',
  gu: 'આ માર્ગદર્શન માત્ર માહિતી માટે છે, વ્યાવસાયિક કાનૂની સલાહનો વિકલ્પ નથી.',
};

export interface ParsedAIResponse {
  cleanedText: string;
  newVerdict: 'user_correct' | 'user_incorrect' | 'needs_more_info';
  summaryNote: string;
  docValidity: 'valid' | 'invalid' | 'suspicious' | null;
  caseStatusUpdate: CaseStatus | null;
}

export const parseAIResponse = (responseText: string, currentVerdict: 'user_correct' | 'user_incorrect' | 'needs_more_info'): ParsedAIResponse => {
  let cleanedText = responseText.replace(/ thinking[\s\S]*?<\/think>/gi, '').trim();

  let newVerdict: 'user_correct' | 'user_incorrect' | 'needs_more_info' = currentVerdict;
  const verdictMatch = cleanedText.match(/\[\[VERDICT:\s*(CORRECT|INCORRECT|PENDING)\]\]/i);
  if (verdictMatch) {
    const vStr = verdictMatch[1].toUpperCase();
    if (vStr === 'CORRECT') newVerdict = 'user_correct';
    else if (vStr === 'INCORRECT') newVerdict = 'user_incorrect';
    else newVerdict = 'needs_more_info';
  }

  let summaryNote = '';
  const summaryMatch = cleanedText.match(/\[\[SUMMARY:\s*([\s\S]*?)\]\]/i);
  if (summaryMatch) {
    summaryNote = summaryMatch[1].trim();
  }

  let docValidity: 'valid' | 'invalid' | 'suspicious' | null = null;
  const docMatch = cleanedText.match(/\[\[DOC_VALIDITY:\s*(VALID|INVALID|SUSPICIOUS)\]\]/i);
  if (docMatch) {
    const dStr = docMatch[1].toUpperCase();
    if (dStr === 'VALID') docValidity = 'valid';
    else if (dStr === 'INVALID') docValidity = 'invalid';
    else if (dStr === 'SUSPICIOUS') docValidity = 'suspicious';
  }

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

export const fallbackNetworkMessage = (language: Language): string => {
  if (language === 'hi') {
    return 'नमस्ते सर/मैडम, थोड़ा समय दें। नेटवर्क में कुछ धीमापन आ गया है, कृपया एक बार फिर अपना संदेश भेजें।';
  }
  if (language === 'en') {
    return 'Hello Sir/Ma\'am, please give me just a moment. Connection is a bit slow right now, please try sending your message again.';
  }
  return 'Namaste Sir/Ma\'am, thoda waqt dein. Network thoda slow hai, kripya ek baar fir message bhejein.';
};

export const useSpeechOutput = (language: Language) => {
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stopSpeechOutput = useCallback(() => {
    stopNaturalVoice();
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (!voiceOutputEnabled) return;
      stopSpeechOutput();
      speakNaturalMaleVoice(
        text,
        language as 'hi' | 'en' | 'hinglish',
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    },
    [voiceOutputEnabled, language, stopSpeechOutput]
  );

  return { voiceOutputEnabled, setVoiceOutputEnabled, isSpeaking, stopSpeechOutput, speakText };
};