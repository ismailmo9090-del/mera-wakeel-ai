export type Language = 'hi' | 'en' | 'hinglish' | 'ta' | 'te' | 'mr' | 'bn' | 'kn' | 'gu';

export type UserRole = 'citizen' | 'lawyer';

export type NavTab = 'home' | 'how-it-works' | 'for-lawyers' | 'my-cases' | 'chat' | 'lawyers' | 'advocates' | 'documents' | 'settings' | 'auth' | 'privacy' | 'terms' | 'draft-documents' | 'free-legal-aid' | 'admin' | 'help';

export interface TrustStat {
  label: string;
  value: string;
  subtext: string;
}

export interface StepItem {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

export interface SlideData {
  id: string | number;
  title: string;
  category?: string;
  subtitle?: string;
  headline?: string;
  content?: any;
  [key: string]: any;
}

export interface DeckMetadata {
  title: string;
  subtitle?: string;
}

export interface QAHistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp?: string;
  isFallback?: boolean;
}

export interface DemoCaseResult {
  id: string;
  title: string;
  status: string;
}

