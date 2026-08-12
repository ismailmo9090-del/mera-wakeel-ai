export type PreferredLanguage = 'hindi' | 'english' | 'hinglish';
export type UserType = 'citizen' | 'lawyer';
export type CaseCategory = 'property' | 'tenant' | 'family' | 'consumer' | 'labour' | 'other';
export type CaseStatus = 'ongoing' | 'assessed' | 'closed' | 'resolved' | 'lawyer_connected';
export type AIVerdict = 'user_correct' | 'user_incorrect' | 'needs_more_info';
export type MessageSenderType = 'user' | 'ai';
export type MessageType = 'text' | 'voice' | 'document_reference';
export type DocumentType = 'stamp_paper' | 'will' | 'registry' | 'sale_deed' | 'power_of_attorney' | 'affidavit' | 'contract' | 'court_notice' | 'lease_agreement' | 'legal_notice' | 'other' | 'unknown';
export type EvidencePriority = 'critical' | 'helpful' | 'optional';
export type ConnectionStatus = 'requested' | 'accepted' | 'rejected' | 'completed';

export interface Profile {
  id: string; // references auth.users(id)
  full_name: string | null;
  phone: string | null;
  user_type: UserType;
  preferred_language: PreferredLanguage;
  city: string | null;
  state: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Lawyer {
  id: string;
  profile_id: string;
  specialty: string[];
  years_experience: number;
  bar_council_number: string | null;
  is_verified: boolean;
  bio: string | null;
  consultation_fee_range: string | null;
  rating_avg: number;
  total_cases_handled: number;
  available: boolean;
  profile_photo_url: string | null;
  created_at?: string;
  updated_at?: string;

  // Joined profile object if fetched with join
  profile?: Profile;
}

export interface Case {
  id: string;
  citizen_id: string;
  title: string | null;
  category: CaseCategory | null;
  status: CaseStatus;
  ai_verdict: AIVerdict | null;
  ai_summary: string | null;
  confidence_score: number | null;
  assigned_lawyer_id: string | null;
  created_at?: string;
  updated_at?: string;

  // Joined lawyer
  assigned_lawyer?: Lawyer;
}

export interface Message {
  id: string;
  case_id: string;
  sender_type: MessageSenderType;
  content: string;
  message_type: MessageType;
  created_at?: string;
}

export interface Document {
  id: string;
  case_id: string;
  file_url: string;
  document_type: DocumentType | null;
  ai_extracted_text: string | null;
  ai_analysis: string | null;
  is_verified_valid: boolean | null;
  uploaded_at?: string;
}

export interface CaseEvidence {
  id: string;
  case_id: string;
  evidence_description: string;
  is_available: boolean;
  priority: EvidencePriority;
}

export interface LawyerConnection {
  id: string;
  case_id: string;
  citizen_id: string;
  lawyer_id: string;
  status: ConnectionStatus;
  requested_at?: string;

  // Joined fields
  lawyer?: Lawyer;
  case?: Case;
  citizen_profile?: Profile;
}

export interface Review {
  id: string;
  lawyer_id: string;
  citizen_id: string;
  rating: number;
  review_text: string | null;
  created_at?: string;
}

export interface CaseFact {
  id: string;
  case_id: string;
  fact_key: string;
  fact_value: string;
  updated_at?: string;
}

export interface ProfileFact {
  id: string;
  profile_id: string;
  fact_key: string;
  fact_value: string;
  updated_at?: string;
}

export interface LegalKnowledgeBase {
  id: string;
  act_name: string;
  section_number: string | null;
  content: string;
  embedding?: number[];
  category: CaseCategory | null;
}
