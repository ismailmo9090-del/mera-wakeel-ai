import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, Lawyer, Case, CaseFact, ProfileFact, Document, DocumentType, CaseStatus, CaseEvidence, EvidencePriority, LawyerConnection, ConnectionStatus, Review } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
}

export const supabase = getSupabase();

// Returns the currently signed-in user's UUID (matches auth.uid() used by RLS).
export async function getCurrentAuthUserId(): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data } = await client.auth.getUser();
    return data?.user?.id || null;
  } catch (err) {
    return null;
  }
}

// True for demo/guest ids that have no auth.uid() and therefore can never
// satisfy RLS. Client-side writes must use a real authenticated user id.
export function isGuestId(id?: string | null): boolean {
  if (!id) return true;
  const lower = String(id).toLowerCase();
  return lower === 'guest' || lower === 'guest_citizen' || lower.includes('guest');
}

// Resolves the citizen id that should be used for RLS-scoped client calls.
// Prefers a real UUID the caller provided; otherwise falls back to the
// authenticated user's id. Returns null when there is no usable identity.
export async function resolveEffectiveCitizenId(preferredId?: string): Promise<string | null> {
  if (preferredId && isValidUUID(preferredId) && !isGuestId(preferredId)) {
    return preferredId;
  }
  return getCurrentAuthUserId();
}

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  const client = getSupabase();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase environment variables missing (VITE_SUPABASE_URL)',
    };
  }

  try {
    const { error } = await client.from('profiles').select('id', { head: true, count: 'exact' });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.profiles" does not exist')) {
      return { connected: true, message: `Connected to Supabase (${error.message})` };
    }
    return { connected: true, message: 'Supabase client connected successfully' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Failed to connect to Supabase' };
  }
}

// Helper to generate valid RFC4122 v4 UUIDs
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function toValidUUID(id: string): string {
  if (!id) return generateUUID();
  if (isValidUUID(id)) return id;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex1 = Math.abs(hash).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash * 31).toString(16).padStart(8, '0');
  const hex3 = Math.abs(hash * 127).toString(16).padStart(8, '0');
  const hex4 = Math.abs(hash * 8191).toString(16).padStart(8, '0');
  return `${hex1}-${hex2.slice(0, 4)}-4${hex2.slice(1, 4)}-a${hex3.slice(0, 3)}-${hex4.padStart(12, '0').slice(0, 12)}`;
}

export function sanitizeCategory(cat?: string): 'property' | 'tenant' | 'family' | 'consumer' | 'labour' | 'other' {
  if (!cat) return 'other';
  const lower = String(cat).toLowerCase();
  if (lower.includes('prop') || lower.includes('land') || lower.includes('makan') || lower.includes('plot') || lower.includes('registry')) return 'property';
  if (lower.includes('ten') || lower.includes('rent') || lower.includes('kiraya')) return 'tenant';
  if (lower.includes('fam') || lower.includes('divor') || lower.includes('marriage') || lower.includes('custody')) return 'family';
  if (lower.includes('consu') || lower.includes('fraud') || lower.includes('refund')) return 'consumer';
  if (lower.includes('lab') || lower.includes('emp') || lower.includes('sal') || lower.includes('job')) return 'labour';
  return 'other';
}

export async function ensureProfileRowExists(client: SupabaseClient, dbProfileId: string): Promise<string> {
  if (!isValidUUID(dbProfileId)) return 'a092814b-0e43-4001-9f83-138e22a52df1';
  try {
    const { data } = await client.from('profiles').select('id').eq('id', dbProfileId).maybeSingle();
    if (data?.id) return data.id;

    await client.from('profiles').upsert(
      {
        id: dbProfileId,
        full_name: 'Aapka Naam',
        user_type: 'citizen',
        preferred_language: 'hindi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return dbProfileId;
  } catch (err) {
    console.warn('ensureProfileRowExists notice:', err);
    return dbProfileId;
  }
}

export async function ensureCaseRowExists(
  client: SupabaseClient,
  dbCaseId: string,
  dbCitizenId: string
): Promise<string> {
  if (!isValidUUID(dbCaseId)) return dbCaseId;
  try {
    const { data } = await client.from('cases').select('id').eq('id', dbCaseId).maybeSingle();
    if (data?.id) return data.id;

    const validCitizenId = await ensureProfileRowExists(client, dbCitizenId);
    await client.from('cases').insert({
      id: dbCaseId,
      citizen_id: validCitizenId,
      title: 'Naya Legal Query',
      category: 'other',
      status: 'ongoing',
      ai_verdict: 'needs_more_info',
      confidence_score: 0.5,
    });
    return dbCaseId;
  } catch (err) {
    console.warn('ensureCaseRowExists notice:', err);
    return dbCaseId;
  }
}

export async function resolveValidProfileId(client: SupabaseClient, preferredId?: string): Promise<string> {
  if (preferredId && isValidUUID(preferredId) && !isGuestId(preferredId)) {
    const validId = await ensureProfileRowExists(client, preferredId);
    if (validId) return validId;
  }
  // RLS-scoped: the only profile the client may safely use is the logged-in
  // user's own profile (auth.uid()).
  const authId = await getCurrentAuthUserId();
  if (authId) return authId;

  const { data: firstCitizen } = await client.from('profiles').select('id').eq('user_type', 'citizen').limit(1).maybeSingle();
  if (firstCitizen?.id) return firstCitizen.id;

  return 'a092814b-0e43-4001-9f83-138e22a52df1';
}

export async function resolveValidLawyerId(client: SupabaseClient, preferredId?: string): Promise<string> {
  if (preferredId) {
    const dbId = toValidUUID(preferredId);
    const { data } = await client.from('lawyers').select('id').eq('id', dbId).maybeSingle();
    if (data?.id) return data.id;
  }
  const { data: firstLawyer } = await client.from('lawyers').select('id').limit(1).maybeSingle();
  if (firstLawyer?.id) return firstLawyer.id;

  return '703b8131-cf1f-47ee-8f4a-cda657989c4f';
}

export async function resolveValidCaseId(client: SupabaseClient, preferredCaseId: string, citizenId: string): Promise<string> {
  const dbCaseId = toValidUUID(preferredCaseId);
  const { data } = await client.from('cases').select('id').eq('id', dbCaseId).maybeSingle();
  if (data?.id) return data.id;

  const validCitizenId = await resolveValidProfileId(client, citizenId);
  const { data: newCase, error } = await client
    .from('cases')
    .insert({
      id: dbCaseId,
      citizen_id: validCitizenId,
      title: 'Legal Consultation Request',
      category: 'property',
      status: 'ongoing',
    })
    .select('id')
    .maybeSingle();

  if (!error && newCase?.id) return newCase.id;

  return dbCaseId;
}

// ==========================================
// USER PROFILE HELPERS — DB PRIMARY
// ==========================================

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  // 1. Try server proxy API first (uses admin service role key, bypasses RLS)
  try {
    const res = await fetch(`/api/db/profile?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.profile) {
        return json.profile as Profile;
      }
    }
  } catch (err) {
    console.warn('fetchProfile proxy notice:', err);
  }

  // 2. Client SDK fallback
  const client = getSupabase();
  if (!client) return null;

  const dbUserId = toValidUUID(userId);
  const targetIds = Array.from(
    new Set([userId, dbUserId].filter((x) => Boolean(x) && isValidUUID(x)))
  );

  if (targetIds.length === 0) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .in('id', targetIds)
      .maybeSingle();

    if (error) {
      console.warn('Supabase profile fetch:', error.message);
      return null;
    }
    return data as Profile | null;
  } catch (err) {
    console.error('Error fetching profile from Supabase:', err);
    return null;
  }
}

export async function createOrUpdateProfile(profileData: Partial<Profile> & { id: string }): Promise<Profile | null> {
  const formattedProfile: Profile = {
    id: profileData.id,
    full_name: profileData.full_name || null,
    phone: profileData.phone || null,
    user_type: profileData.user_type || 'citizen',
    preferred_language: profileData.preferred_language || 'hindi',
    city: profileData.city || null,
    state: profileData.state || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Try server proxy API first (bypasses RLS via service role)
  try {
    const res = await fetch('/api/db/profile/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedProfile),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.profile) {
        return json.profile as Profile;
      }
    }
  } catch (err) {
    console.warn('createOrUpdateProfile proxy notice:', err);
  }

  // 2. Client SDK fallback
  const client = getSupabase();
  if (!client) return formattedProfile;

  try {
    const { data, error } = await client
      .from('profiles')
      .upsert(formattedProfile, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase profile upsert error:', error.message);
      return formattedProfile;
    }
    return data as Profile;
  } catch (err) {
    console.error('createOrUpdateProfile error:', err);
    return formattedProfile;
  }
}

export async function createLawyerEntry(profileId: string, extraData?: Partial<Lawyer>): Promise<Lawyer | null> {
  const mockLawyer: Lawyer = {
    id: generateUUID(),
    profile_id: profileId,
    specialty: extraData?.specialty || ['General Legal Practice'],
    years_experience: extraData?.years_experience || 1,
    bar_council_number: extraData?.bar_council_number || '',
    is_verified: true,
    bio: extraData?.bio || 'Advocate registered on Mera Wakeel AI',
    consultation_fee_range: extraData?.consultation_fee_range || '₹1000 - ₹2000',
    rating_avg: 5.0,
    total_cases_handled: 0,
    available: true,
    profile_photo_url: extraData?.profile_photo_url || null,
  };

  // 1. Try server proxy API first (bypasses RLS)
  try {
    const res = await fetch('/api/db/lawyers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: profileId,
        specialty: extraData?.specialty,
        years_experience: extraData?.years_experience,
        bar_council_number: extraData?.bar_council_number,
        bio: extraData?.bio,
        consultation_fee_range: extraData?.consultation_fee_range,
        profile_photo_url: extraData?.profile_photo_url,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.lawyer) return json.lawyer as Lawyer;
    }
  } catch (err) {
    console.warn('createLawyerEntry proxy notice:', err);
  }

  // 2. Client SDK fallback
  const client = getSupabase();
  if (!client) return mockLawyer;

  try {
    const { data, error } = await client
      .from('lawyers')
      .upsert({
        profile_id: profileId,
        specialty: extraData?.specialty || ['General Legal Practice'],
        years_experience: extraData?.years_experience || 1,
        bar_council_number: extraData?.bar_council_number || '',
        is_verified: true,
        bio: extraData?.bio || 'Advocate registered on Mera Wakeel AI',
        consultation_fee_range: extraData?.consultation_fee_range || '₹1000 - ₹2000',
        rating_avg: 5.0,
        total_cases_handled: 0,
        available: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase lawyer upsert error:', error.message);
      return mockLawyer;
    }
    return data as Lawyer;
  } catch (err) {
    console.error('createLawyerEntry failed:', err);
    return mockLawyer;
  }
}

// ==========================================
// CASES — DB PRIMARY, NO LOCAL FALLBACK DATA
// ==========================================

export async function fetchUserCases(citizenId?: string): Promise<Case[]> {
  const targetId = citizenId || 'guest_citizen';

  // 1. Server proxy first (uses admin service role key, bypasses RLS, resolves profile mapping)
  try {
    const res = await fetch(`/api/db/cases?citizenId=${encodeURIComponent(targetId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.cases) && json.cases.length > 0) {
        return json.cases as Case[];
      }
    }
  } catch (err) {
    console.warn('fetchUserCases proxy notice:', err);
  }

  // 2. Client SDK fallback
  const client = getSupabase();
  const dbCitizenId = toValidUUID(targetId);

  const targetIds = Array.from(
    new Set([
      targetId,
      dbCitizenId,
      'cfabc5e6-1924-451e-8cc7-afc493f4e239', // GUEST_PROFILE_ID
      'guest_citizen',
    ].filter((x) => Boolean(x) && isValidUUID(x)))
  );

  if (client) {
    try {
      const { data, error } = await client
        .from('cases')
        .select('*')
        .in('citizen_id', targetIds)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return (data as Case[]) || [];
      }

      // NOTE: No "fetch all / recent cases" fallback here. Without RLS that
      // fallback returned other users' private cases; with RLS enabled it
      // returns nothing. The citizen's own cases are the only safe result.
    } catch (err) {
      console.warn('fetchUserCases client notice:', err);
    }
  }

  return [];
}

export async function createCase(
  citizenId: string,
  title: string = 'Naya Legal Query',
  category: any = 'other'
): Promise<Case> {
  const effectiveCitizenId = (await resolveEffectiveCitizenId(citizenId)) || citizenId;
  const dbCitizenId = toValidUUID(effectiveCitizenId);
  const caseId = generateUUID();
  const safeCategory = sanitizeCategory(category);

  // System Rule: As long as 1 case is active, no new case can be created
  try {
    const existingCases = await fetchUserCases(citizenId);
    const activeCase = existingCases?.find((c) => c.status !== 'closed' && c.status !== 'resolved');
    if (activeCase) {
      console.log('Active case already exists, reusing active case:', activeCase.id);
      return activeCase;
    }
  } catch (err) {
    console.warn('Check active case restriction notice:', err);
  }

  const newCase: Case = {
    id: caseId,
    citizen_id: dbCitizenId,
    title,
    category: safeCategory,
    status: 'ongoing',
    ai_verdict: 'needs_more_info',
    ai_summary: null,
    confidence_score: 0.5,
    assigned_lawyer_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Server proxy first (bypasses RLS)
  try {
    const res = await fetch('/api/db/cases/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: caseId,
        citizen_id: citizenId,
        title,
        category: safeCategory,
        status: 'ongoing',
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.case) return json.case;
    }
  } catch (err) {
    console.warn('createCase proxy notice:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();
  if (client) {
    try {
      const validCitizenId = await ensureProfileRowExists(client, dbCitizenId);

      const { data, error } = await client
        .from('cases')
        .insert({
          id: caseId,
          citizen_id: validCitizenId,
          title,
          category: safeCategory,
          status: 'ongoing',
          ai_verdict: 'needs_more_info',
          ai_summary: null,
          confidence_score: 0.5,
        })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        return data as Case;
      }
    } catch (err) {
      console.warn('createCase client notice:', err);
    }
  }

  return newCase;
}

// ==========================================
// MESSAGES — DB PRIMARY
// ==========================================

export async function fetchCaseMessages(caseId: string): Promise<any[]> {
  // 1. Try server proxy first (bypasses RLS)
  try {
    const res = await fetch(`/api/db/messages?caseId=${encodeURIComponent(caseId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.messages)) {
        return json.messages;
      }
    }
  } catch (err) {
    console.warn('fetchCaseMessages proxy notice:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();
  const dbCaseId = toValidUUID(caseId);
  const targetIds = Array.from(
    new Set([caseId, dbCaseId].filter((x) => Boolean(x) && isValidUUID(x)))
  );

  if (client && targetIds.length > 0) {
    try {
      const { data, error } = await client
        .from('messages')
        .select('*')
        .in('case_id', targetIds)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('fetchCaseMessages client notice:', err);
    }
  }

  return [];
}

export async function saveCaseMessage(
  caseId: string,
  senderType: 'user' | 'ai',
  content: string,
  messageType: 'text' | 'voice' | 'document_reference' = 'text',
  citizenId?: string
): Promise<any> {
  const dbCaseId = toValidUUID(caseId);
  const effectiveCitizenId = (await resolveEffectiveCitizenId(citizenId)) || citizenId || 'guest_citizen';
  const dbCitizenId = toValidUUID(effectiveCitizenId);
  const msgObj = {
    id: generateUUID(),
    case_id: dbCaseId,
    sender_type: senderType,
    content: content.trim(),
    message_type: messageType,
    created_at: new Date().toISOString(),
  };

  // 1. Try server proxy first (bypasses RLS)
  try {
    const res = await fetch('/api/db/messages/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        sender_type: senderType,
        content: content.trim(),
        message_type: messageType,
        citizen_id: citizenId || 'guest_citizen',
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.message) {
        return json.message;
      }
    }
  } catch (err) {
    console.warn('saveCaseMessage proxy notice:', err);
  }

  // 2. Client-side fallback
  const client = getSupabase();
  if (client) {
    try {
      await ensureCaseRowExists(client, dbCaseId, dbCitizenId);

      const { data, error } = await client
        .from('messages')
        .insert({
          id: msgObj.id,
          case_id: dbCaseId,
          sender_type: senderType,
          content: content.trim(),
          message_type: messageType,
        })
        .select('*')
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('saveCaseMessage client db notice:', err);
    }
  }

  return msgObj;
}

export async function fetchCaseById(caseId: string): Promise<Case | null> {
  // 1. Try server proxy API first (bypasses RLS)
  try {
    const res = await fetch(`/api/db/cases?caseId=${encodeURIComponent(caseId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.cases)) {
        const found = json.cases.find((c: any) => c.id === caseId || c.id === toValidUUID(caseId));
        if (found) return found as Case;
      }
    }
  } catch (err) {
    console.warn('fetchCaseById proxy notice:', err);
  }

  // 2. Client SDK fallback
  const client = getSupabase();
  if (!client || !caseId) return null;

  const dbCaseId = toValidUUID(caseId);
  const targetIds = Array.from(
    new Set([caseId, dbCaseId].filter((x) => Boolean(x) && isValidUUID(x)))
  );

  if (targetIds.length === 0) return null;

  try {
    const { data, error } = await client
      .from('cases')
      .select('*')
      .in('id', targetIds)
      .maybeSingle();

    if (!error && data) {
      return data as Case;
    }
  } catch (err) {
    console.warn('fetchCaseById exception:', err);
  }

  return null;
}

export async function incrementLawyerCasesHandled(lawyerId: string): Promise<number> {
  const client = getSupabase();
  if (client) {
    try {
      const { data } = await client
        .from('lawyers')
        .select('total_cases_handled')
        .or(`id.eq.${lawyerId},profile_id.eq.${lawyerId}`)
        .maybeSingle();

      const current = data?.total_cases_handled || 0;
      const updated = current + 1;
      await client
        .from('lawyers')
        .update({ total_cases_handled: updated })
        .or(`id.eq.${lawyerId},profile_id.eq.${lawyerId}`);

      return updated;
    } catch (e) {
      console.warn('incrementLawyerCasesHandled db notice:', e);
    }
  }
  return 0;
}

export async function updateCaseStatus(
  caseId: string,
  citizenId: string,
  status: CaseStatus
): Promise<void> {
  const client = getSupabase();

  // 1. Try server proxy first (bypasses RLS)
  try {
    await fetch('/api/db/cases/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, status }),
    });
  } catch (err) {
    console.warn('updateCaseStatus proxy notice:', err);
  }

  // 2. Client-side fallback
  if (client && isValidUUID(caseId)) {
    try {
      const { data: caseData } = await client
        .from('cases')
        .select('assigned_lawyer_id, status')
        .eq('id', caseId)
        .maybeSingle();

      await client
        .from('cases')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseId);

      if (status === 'closed' && caseData && caseData.status !== 'closed' && caseData.assigned_lawyer_id) {
        await incrementLawyerCasesHandled(caseData.assigned_lawyer_id);
      }
    } catch (err) {
      console.warn('updateCaseStatus error:', err);
    }
  }
}

export function inferCaseCategory(text: string): 'property' | 'tenant' | 'family' | 'consumer' | 'labour' | 'other' {
  const lower = text.toLowerCase();
  if (
    lower.includes('property') || lower.includes('zameen') || lower.includes('land') ||
    lower.includes('plot') || lower.includes('registry') || lower.includes('stamp') ||
    lower.includes('dakhil') || lower.includes('kabza') || lower.includes('encroach') ||
    lower.includes('builder') || lower.includes('flat') || lower.includes('sale deed') || lower.includes('partition')
  ) {
    return 'property';
  }
  if (
    lower.includes('kiraya') || lower.includes('rent') || lower.includes('tenant') ||
    lower.includes('landlord') || lower.includes('makan malik') || lower.includes('kirayedar') ||
    lower.includes('deposit') || lower.includes('evict')
  ) {
    return 'tenant';
  }
  if (
    lower.includes('divorce') || lower.includes('custody') || lower.includes('maintenance') ||
    lower.includes('matrimonial') || lower.includes('husband') || lower.includes('wife') ||
    lower.includes('dowry') || lower.includes('shadi') || lower.includes('talaq') || lower.includes('family')
  ) {
    return 'family';
  }
  if (
    lower.includes('consumer') || lower.includes('refund') || lower.includes('product') ||
    lower.includes('defective') || lower.includes('fraud') || lower.includes('warranty') || lower.includes('order')
  ) {
    return 'consumer';
  }
  if (
    lower.includes('salary') || lower.includes('job') || lower.includes('terminat') ||
    lower.includes('resign') || lower.includes('employer') || lower.includes('employee') ||
    lower.includes('labor') || lower.includes('labour') || lower.includes('majdoori') || lower.includes('pf')
  ) {
    return 'labour';
  }
  return 'other';
}

export async function updateCaseVerdictAndSummary(
  caseId: string,
  verdict: 'user_correct' | 'user_incorrect' | 'needs_more_info',
  summary: string,
  confidenceScore: number = 0.85,
  title?: string,
  citizenId?: string,
  category?: string
): Promise<void> {
  const client = getSupabase();

  // 1. Try server proxy first (bypasses RLS)
  try {
    await fetch('/api/db/cases/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        ai_verdict: verdict,
        ai_summary: summary,
        confidence_score: confidenceScore,
      }),
    });
  } catch (err) {
    console.warn('updateCaseVerdictAndSummary proxy notice:', err);
  }

  // 2. Client-side fallback
  if (client && isValidUUID(caseId)) {
    try {
      const updatePayload: any = {
        ai_verdict: verdict,
        ai_summary: summary,
        confidence_score: confidenceScore,
        updated_at: new Date().toISOString(),
      };
      if (title) updatePayload.title = title;
      if (category) updatePayload.category = category;

      await client.from('cases').update(updatePayload).eq('id', caseId);
    } catch (err) {
      console.error('updateCaseVerdictAndSummary error:', err);
    }
  }
}

// ==========================================
// CASE EVIDENCE — DB PRIMARY
// ==========================================

export async function fetchCaseEvidence(caseId: string): Promise<CaseEvidence[]> {
  const client = getSupabase();
  const dbCaseId = toValidUUID(caseId);
  const targetIds = Array.from(
    new Set([caseId, dbCaseId].filter((x) => Boolean(x) && isValidUUID(x)))
  );

  // 1. Client side
  if (client && targetIds.length > 0) {
    try {
      const { data, error } = await client
        .from('case_evidence')
        .select('*')
        .in('case_id', targetIds)
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as CaseEvidence[]) || [];
      }
    } catch (err) {
      console.warn('fetchCaseEvidence client notice:', err);
    }
  }

  // 2. Server proxy fallback
  try {
    const res = await fetch(`/api/db/evidence?caseId=${encodeURIComponent(caseId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.evidence)) {
        return json.evidence;
      }
    }
  } catch (err) {
    console.warn('fetchCaseEvidence proxy notice:', err);
  }

  return [];
}

export async function addCaseEvidence(
  caseId: string,
  description: string,
  priority: EvidencePriority = 'critical',
  citizenId?: string
): Promise<CaseEvidence> {
  const cleanDesc = description.trim();
  const evId = generateUUID();
  const newEv: CaseEvidence = {
    id: evId,
    case_id: caseId,
    evidence_description: cleanDesc,
    is_available: false,
    priority,
  };

  // 1. Server proxy first (bypasses RLS)
  try {
    const res = await fetch('/api/db/evidence/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        title: cleanDesc,
        description: cleanDesc,
        priority,
        citizen_id: citizenId || 'guest_citizen',
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.evidence) return json.evidence;
    }
  } catch (err) {
    console.warn('addCaseEvidence proxy notice:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();
  if (client && isValidUUID(caseId)) {
    try {
      const { data, error } = await client
        .from('case_evidence')
        .insert({
          id: evId,
          case_id: caseId,
          evidence_description: cleanDesc,
          is_available: false,
          priority,
        })
        .select('*')
        .single();

      if (!error && data) {
        return data as CaseEvidence;
      }
    } catch (err) {
      console.warn('addCaseEvidence client exception:', err);
    }
  }

  return newEv;
}

export async function toggleEvidenceAvailable(
  evidenceId: string,
  caseId: string,
  isAvailable: boolean
): Promise<void> {
  const client = getSupabase();
  if (client && isValidUUID(caseId)) {
    try {
      await client
        .from('case_evidence')
        .update({ is_available: isAvailable })
        .eq('id', evidenceId);
    } catch (err) {
      console.warn('toggleEvidenceAvailable error:', err);
    }
  }
}

export async function saveExtractedEvidence(
  caseId: string,
  rawAiText: string
): Promise<{
  cleanedText: string;
  extractedEvidences: Array<{ description: string; priority: EvidencePriority }>;
}> {
  let cleanedText = rawAiText;
  const extractedEvidences: Array<{ description: string; priority: EvidencePriority }> = [];

  const evRegex = /\[\[EVIDENCE:\s*(.*?)(?:\s*\|\s*(critical|helpful|optional))?\s*\]\]/gi;
  let match;

  while ((match = evRegex.exec(rawAiText)) !== null) {
    const description = match[1]?.trim();
    const rawPriority = match[2]?.trim().toLowerCase();
    const priority: EvidencePriority =
      rawPriority === 'critical' ? 'critical' : rawPriority === 'helpful' ? 'helpful' : 'optional';

    if (description) {
      extractedEvidences.push({ description, priority });
      if (caseId) {
        await addCaseEvidence(caseId, description, priority);
      }
    }
  }

  cleanedText = cleanedText.replace(evRegex, '').trim();

  return { cleanedText, extractedEvidences };
}

// ==========================================
// STRUCTURED MEMORY FACTS — DB PRIMARY
// ==========================================

export async function fetchCaseFacts(caseId: string): Promise<CaseFact[]> {
  const client = getSupabase();
  const dbCaseId = toValidUUID(caseId);
  const targetIds = Array.from(
    new Set([caseId, dbCaseId].filter((x) => Boolean(x) && isValidUUID(x)))
  );

  // 1. Client side
  if (client && targetIds.length > 0) {
    try {
      const { data, error } = await client
        .from('case_facts')
        .select('*')
        .in('case_id', targetIds)
        .order('updated_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as CaseFact[]) || [];
      }
    } catch (err) {
      console.warn('fetchCaseFacts client notice:', err);
    }
  }

  // 2. Server proxy fallback
  try {
    const res = await fetch(`/api/db/facts?caseId=${encodeURIComponent(caseId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.facts)) {
        return json.facts;
      }
    }
  } catch (err) {
    console.warn('fetchCaseFacts proxy notice:', err);
  }

  return [];
}

export async function fetchProfileFacts(profileId: string): Promise<ProfileFact[]> {
  const client = getSupabase();
  const dbProfileId = toValidUUID(profileId);
  const targetIds = Array.from(
    new Set([profileId, dbProfileId].filter((x) => Boolean(x) && isValidUUID(x)))
  );

  // 1. Client side
  if (client && targetIds.length > 0) {
    try {
      const { data, error } = await client
        .from('profile_facts')
        .select('*')
        .in('profile_id', targetIds)
        .order('updated_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as ProfileFact[]) || [];
      }
    } catch (err) {
      console.warn('fetchProfileFacts client notice:', err);
    }
  }

  // 2. Server proxy fallback
  try {
    const res = await fetch(`/api/db/facts?profileId=${encodeURIComponent(profileId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.facts)) {
        return json.facts;
      }
    }
  } catch (err) {
    console.warn('fetchProfileFacts proxy notice:', err);
  }

  return [];
}

export async function saveExtractedFacts(
  caseId: string | null,
  citizenId: string | null,
  rawAiText: string
): Promise<{ extractedFacts: Array<{ key: string; value: string }>; cleanedText: string }> {
  const extractedFacts: Array<{ key: string; value: string }> = [];

  if (!rawAiText) {
    return { extractedFacts, cleanedText: '' };
  }

  const factRegex = /\[\[FACT:\s*([a-zA-Z0-9_\-\s]+?)\s*=\s*(.*?)\]\]/gi;
  let match;

  while ((match = factRegex.exec(rawAiText)) !== null) {
    const rawKey = match[1].trim();
    const key = rawKey.toLowerCase().replace(/[\s\-]+/g, '_');
    const value = match[2].trim();
    if (key && value) {
      extractedFacts.push({ key, value });
    }
  }

  const cleanedText = rawAiText.replace(/\[\[FACT:\s*.*?\s*=\s*.*?\]\]/gi, '').trim();

  const profileKeys = ['full_name', 'city', 'state', 'phone', 'preferred_language'];
  const client = getSupabase();
  const effectiveProfileId = (await resolveEffectiveCitizenId(citizenId)) || citizenId;

  for (const { key, value } of extractedFacts) {
    const nowIso = new Date().toISOString();
    const isProfileKey = profileKeys.includes(key);

    // 1. Try server proxy first (bypasses RLS)
    try {
      await fetch('/api/db/facts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          profile_id: isProfileKey ? citizenId : undefined,
          key,
          value,
          citizen_id: citizenId || 'guest_citizen',
        }),
      });
    } catch (err) {
      console.warn('saveExtractedFacts proxy notice:', err);
    }

    // 2. Client SDK fallback
    if (caseId && client && isValidUUID(caseId)) {
      try {
        await client.from('case_facts').upsert(
          {
            case_id: caseId,
            fact_key: key,
            fact_value: value,
            updated_at: nowIso,
          },
          { onConflict: 'case_id,fact_key' }
        );
      } catch (err) {
        console.warn('Upsert case_fact error:', err);
      }
    }

    if (isProfileKey && effectiveProfileId && client && isValidUUID(effectiveProfileId)) {
      try {
        await client.from('profile_facts').upsert(
          {
            profile_id: effectiveProfileId,
            fact_key: key,
            fact_value: value,
            updated_at: nowIso,
          },
          { onConflict: 'profile_id,fact_key' }
        );
      } catch (err) {
        console.warn('Upsert profile_fact error:', err);
      }
    }
  }

  return { extractedFacts, cleanedText };
}

export async function fetchFactsBlock(
  caseId: string | null,
  citizenId: string | null
): Promise<string> {
  const caseFacts = caseId ? await fetchCaseFacts(caseId) : [];
  const profileFacts = citizenId ? await fetchProfileFacts(citizenId) : [];

  if (caseFacts.length === 0 && profileFacts.length === 0) {
    return '';
  }

  let block = '';

  if (caseFacts.length > 0) {
    block += 'Yaad rakhne wali baatein is case ke baare me (in cheezon ko dobara mat poochna):\n';
    caseFacts.forEach((f) => {
      block += `- ${f.fact_key}: ${f.fact_value}\n`;
    });
  }

  if (profileFacts.length > 0) {
    if (block) block += '\n';
    block += 'User ke baare me general jaankari:\n';
    profileFacts.forEach((f) => {
      block += `- ${f.fact_key}: ${f.fact_value}\n`;
    });
  }

  return block.trim();
}

// ==========================================
// DOCUMENT HELPERS — DB PRIMARY
// ==========================================

export function inferDocumentType(aiText: string): DocumentType {
  const text = aiText.toLowerCase();

  // Check for non-legal documents first
  if (
    text.includes('not a legal document') ||
    text.includes('koi legal document nahi') ||
    text.includes('ticket') ||
    text.includes('bus ticket') ||
    text.includes('movie ticket') ||
    text.includes('receipt') ||
    text.includes('invalid document') ||
    text.includes('irrelevant') ||
    text.includes('non-legal') ||
    text.includes('photo of ticket') ||
    text.includes('stamp paper nahi')
  ) {
    return 'unknown';
  }

  if (text.includes('power of attorney') || text.includes('mukhtarnama') || text.includes('poa') || text.includes('मुख्तारनामा')) {
    return 'power_of_attorney';
  }
  if (text.includes('stamp') || text.includes('स्टांप') || text.includes('stamp paper')) {
    return 'stamp_paper';
  }
  if (text.includes('will') || text.includes('वसीयत') || text.includes('testament')) {
    return 'will';
  }
  if (text.includes('sale deed') || text.includes('बैनामा') || text.includes('विक्रय पत्र') || text.includes('deed')) {
    return 'sale_deed';
  }
  if (text.includes('registry') || text.includes('रजिस्ट्री') || text.includes('registration')) {
    return 'registry';
  }
  return 'unknown';
}

export async function uploadCaseDocument(
  caseId: string,
  file: File,
  _dataUrlOrCitizenId?: string,
  citizenIdParam?: string
): Promise<Document> {
  const client = getSupabase();
  const docId = generateUUID();
  const dbCaseId = toValidUUID(caseId);

  let targetCitizenId = citizenIdParam;
  if (_dataUrlOrCitizenId && !_dataUrlOrCitizenId.startsWith('data:')) {
    targetCitizenId = _dataUrlOrCitizenId;
  }

  const effectiveCitizenId = (await resolveEffectiveCitizenId(targetCitizenId)) || targetCitizenId || 'guest_citizen';
  const dbCitizenId = toValidUUID(effectiveCitizenId);
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${dbCaseId}/${docId}_${cleanFileName}`;

  if (client) {
    await ensureCaseRowExists(client, dbCaseId, dbCitizenId);
    try {
      const { data: buckets } = await client.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === 'documents');
      if (!bucketExists) {
        await client.storage.createBucket('documents', { public: false }).catch(() => {});
      }

      await client.storage
        .from('documents')
        .upload(storagePath, file, {
          upsert: true,
          contentType: file.type || 'image/png',
        });
    } catch (err) {
      console.warn('Storage upload notice:', err);
    }
  }

  const docObj: Document = {
    id: docId,
    case_id: dbCaseId,
    file_url: storagePath,
    document_type: 'unknown',
    ai_extracted_text: null,
    ai_analysis: null,
    is_verified_valid: null,
    uploaded_at: new Date().toISOString(),
  };

  // 1. Try server proxy first (bypasses RLS)
  try {
    const res = await fetch('/api/db/documents/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: docId,
        case_id: caseId,
        file_url: storagePath,
        document_type: 'unknown',
        citizen_id: targetCitizenId || 'guest_citizen',
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.document) return json.document;
    }
  } catch (err) {
    console.warn('uploadCaseDocument proxy notice:', err);
  }

  // 2. Client side fallback
  if (client) {
    try {
      const { data, error } = await client
        .from('documents')
        .insert({
          id: docId,
          case_id: dbCaseId,
          file_url: storagePath,
          document_type: 'unknown',
          uploaded_at: docObj.uploaded_at,
        })
        .select('*')
        .single();

      if (!error && data) {
        return data as Document;
      }
    } catch (err) {
      console.warn('Insert document error:', err);
    }
  }

  return docObj;
}

export async function fetchCaseDocuments(caseId: string): Promise<Document[]> {
  // 1. Try server proxy first (bypasses RLS via admin key)
  try {
    const res = await fetch(`/api/db/documents?caseId=${encodeURIComponent(caseId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.documents)) {
        return json.documents;
      }
    }
  } catch (err) {
    console.warn('fetchCaseDocuments proxy notice:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();
  const dbCaseId = toValidUUID(caseId);
  const targetIds = Array.from(
    new Set([caseId, dbCaseId].filter((x) => Boolean(x) && isValidUUID(x)))
  );

  if (client && targetIds.length > 0) {
    try {
      const { data, error } = await client
        .from('documents')
        .select('*')
        .in('case_id', targetIds)
        .order('uploaded_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Document[];
      }
    } catch (err) {
      console.warn('fetchCaseDocuments client notice:', err);
    }
  }

  return [];
}

export async function deleteCaseDocument(docId: string): Promise<void> {
  const client = getSupabase();

  // 1. Server proxy
  try {
    await fetch(`/api/db/documents/${encodeURIComponent(docId)}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('deleteCaseDocument proxy notice:', err);
  }

  // 2. Client side
  if (client && isValidUUID(docId)) {
    try {
      await client.from('documents').delete().eq('id', docId);
    } catch (err) {
      console.warn('deleteCaseDocument client error:', err);
    }
  }
}

export async function updateCaseDocumentAnalysis(
  docId: string,
  caseId: string,
  extractedText: string,
  aiAnalysis: string,
  documentType: DocumentType,
  isVerifiedValid: boolean = true,
  citizenId?: string
): Promise<void> {
  // 1. Server proxy first (bypasses RLS with admin key)
  try {
    const res = await fetch('/api/db/documents/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: docId,
        case_id: caseId,
        ai_extracted_text: extractedText,
        ai_analysis: aiAnalysis,
        document_type: documentType,
        is_verified_valid: isVerifiedValid,
        citizen_id: citizenId || 'guest_citizen',
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return;
    }
  } catch (err) {
    console.error('updateCaseDocumentAnalysis proxy error:', err);
  }

  // 2. Client SDK fallback
  const client = getSupabase();
  if (client && isValidUUID(docId)) {
    try {
      const { error } = await client
        .from('documents')
        .update({
          ai_extracted_text: extractedText,
          ai_analysis: aiAnalysis,
          document_type: documentType,
          is_verified_valid: isVerifiedValid,
        })
        .eq('id', docId);
      if (error) {
        console.error('updateCaseDocumentAnalysis client error:', error);
      }
    } catch (err) {
      console.error('Update document analysis catch error:', err);
    }
  }
}

// ==========================================
// LAWYER PROFILE & DASHBOARD HELPERS — DB PRIMARY
// ==========================================

export async function fetchLawyerProfile(userId: string): Promise<Lawyer | null> {
  const client = getSupabase();
  if (!client || !isValidUUID(userId)) return null;

  try {
    const { data, error } = await client
      .from('lawyers')
      .select('*, profile:profiles(*)')
      .or(`id.eq.${userId},profile_id.eq.${userId}`)
      .single();

    if (!error && data) {
      return data as Lawyer;
    }
  } catch (err) {
    console.warn('fetchLawyerProfile error:', err);
  }

  return null;
}

export async function uploadProfilePhoto(file: File, userId: string): Promise<string | null> {
  const client = getSupabase();
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `photo_${userId}_${Date.now()}.${fileExt}`;
  const storagePath = `${userId}/${fileName}`;

  // Read as base64 for fallback
  const base64Url = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  if (client) {
    try {
      const { data: buckets } = await client.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === 'profile-photos');
      if (!bucketExists) {
        await client.storage.createBucket('profile-photos', { public: true }).catch(() => {});
      }

      const { error: uploadErr } = await client.storage
        .from('profile-photos')
        .upload(storagePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

      if (!uploadErr) {
        const { data: publicUrlData } = client.storage.from('profile-photos').getPublicUrl(storagePath);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else {
        console.warn('Profile photo upload notice:', uploadErr.message);
      }
    } catch (err) {
      console.warn('uploadProfilePhoto exception:', err);
    }
  }

  return base64Url;
}

export async function upsertLawyerProfile(
  userId: string,
  lawyerData: {
    specialty: string[];
    years_experience: number;
    bar_council_number: string;
    bio: string;
    consultation_fee_range: string;
    profile_photo_url?: string | null;
  },
  profileData?: {
    full_name?: string;
    phone?: string;
    city?: string;
    state?: string;
  }
): Promise<Lawyer> {
  const nowIso = new Date().toISOString();
  const fallbackLawyer: Lawyer = {
    id: userId,
    profile_id: userId,
    specialty: lawyerData.specialty,
    years_experience: lawyerData.years_experience,
    bar_council_number: lawyerData.bar_council_number,
    is_verified: true,
    bio: lawyerData.bio,
    consultation_fee_range: lawyerData.consultation_fee_range,
    rating_avg: 4.8,
    total_cases_handled: 0,
    available: true,
    profile_photo_url: lawyerData.profile_photo_url || null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  // 1. Try server API proxy first (bypasses RLS via service role key)
  try {
    const res = await fetch('/api/db/lawyers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        profile_photo_url: lawyerData.profile_photo_url,
        bar_council_number: lawyerData.bar_council_number,
        specialty: lawyerData.specialty,
        years_experience: lawyerData.years_experience,
        bio: lawyerData.bio,
        consultation_fee_range: lawyerData.consultation_fee_range,
        city: profileData?.city,
        state: profileData?.state
      })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.lawyer) {
        return json.lawyer as Lawyer;
      }
    }
  } catch (err) {
    console.warn('saveLawyerProfileToDb proxy error:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();

  if (profileData && client && isValidUUID(userId)) {
    try {
      await client.from('profiles').upsert({
        id: userId,
        user_type: 'lawyer',
        ...profileData,
        updated_at: nowIso,
      });
    } catch (e) {
      console.warn('upsert profile error:', e);
    }
  }

  if (client && isValidUUID(userId)) {
    try {
      const { data, error } = await client
        .from('lawyers')
        .upsert({
          id: userId,
          profile_id: userId,
          specialty: lawyerData.specialty,
          years_experience: lawyerData.years_experience,
          bar_council_number: lawyerData.bar_council_number,
          bio: lawyerData.bio,
          consultation_fee_range: lawyerData.consultation_fee_range,
          profile_photo_url: lawyerData.profile_photo_url,
          is_verified: true,
          updated_at: nowIso,
        })
        .select('*, profile:profiles(*)')
        .single();

      if (!error && data) {
        return data as Lawyer;
      }
    } catch (err) {
      console.warn('upsertLawyerProfile error:', err);
    }
  }

  return fallbackLawyer;
}

// ==========================================
// LAWYERS DIRECTORY — DB PRIMARY WITH SEED FALLBACK
// ==========================================

// Sample Verified Advocates for initial directory seed / fallback (only used if DB has no lawyers)
const SEED_LAWYERS: Lawyer[] = [
  {
    id: 'lawyer_rajesh_sharma',
    profile_id: 'prof_rajesh',
    specialty: ['Property Law', 'Civil Litigation', 'Consumer Law'],
    years_experience: 14,
    bar_council_number: 'D/2048/2010',
    is_verified: true,
    bio: 'Senior Advocate specializing in land title disputes, property partition, mutation challenges, and High Court writ petitions. 14+ years experience.',
    consultation_fee_range: '₹1,500 - ₹2,500 / session',
    rating_avg: 4.9,
    total_cases_handled: 84,
    available: true,
    profile_photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
    profile: {
      id: 'prof_rajesh',
      full_name: 'Adv. Rajesh Sharma',
      phone: '+91 9876543210',
      user_type: 'lawyer',
      preferred_language: 'hindi',
      city: 'New Delhi',
      state: 'Delhi',
    },
  },
  {
    id: 'lawyer_priya_deshmukh',
    profile_id: 'prof_priya',
    specialty: ['Family Law', 'Property Law', 'Consumer Law'],
    years_experience: 11,
    bar_council_number: 'MAH/1129/2013',
    is_verified: true,
    bio: 'Family & Matrimonial specialist with focus on ancestral property rights, divorce mediation, child custody, and domestic violence protection.',
    consultation_fee_range: '₹1,200 - ₹2,000 / session',
    rating_avg: 4.8,
    total_cases_handled: 62,
    available: true,
    profile_photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    profile: {
      id: 'prof_priya',
      full_name: 'Adv. Priya Deshmukh',
      phone: '+91 9811223344',
      user_type: 'lawyer',
      preferred_language: 'english',
      city: 'Mumbai',
      state: 'Maharashtra',
    },
  },
  {
    id: 'lawyer_amit_verma',
    profile_id: 'prof_amit',
    specialty: ['Labour Law', 'Consumer Law', 'Corporate Law'],
    years_experience: 9,
    bar_council_number: 'KAR/3021/2015',
    is_verified: true,
    bio: 'Employment rights & consumer court advocate. Expert in illegal termination, unpaid severance, non-compete disputes, and e-commerce fraud compensation.',
    consultation_fee_range: '₹1,000 - ₹1,800 / session',
    rating_avg: 4.7,
    total_cases_handled: 48,
    available: true,
    profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    profile: {
      id: 'prof_amit',
      full_name: 'Adv. Amit Verma',
      phone: '+91 9900112233',
      user_type: 'lawyer',
      preferred_language: 'hinglish',
      city: 'Bengaluru',
      state: 'Karnataka',
    },
  },
  {
    id: 'lawyer_sanjay_gupta',
    profile_id: 'prof_sanjay',
    specialty: ['Criminal Law', 'Property Law', 'Consumer Law'],
    years_experience: 18,
    bar_council_number: 'UP/8841/2006',
    is_verified: true,
    bio: 'Senior Criminal & Civil Attorney in District & High Courts. Specializes in Section 420 fraud cases, bail petitions, and property encroachment recovery.',
    consultation_fee_range: '₹2,000 - ₹3,500 / session',
    rating_avg: 5.0,
    total_cases_handled: 140,
    available: true,
    profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    profile: {
      id: 'prof_sanjay',
      full_name: 'Adv. Sanjay Gupta',
      phone: '+91 9711223344',
      user_type: 'lawyer',
      preferred_language: 'hindi',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
    },
  },
];

export async function fetchLawyersDirectory(): Promise<Lawyer[]> {
  // 1. Try server proxy API first (bypasses RLS, returns joined profiles)
  try {
    const res = await fetch('/api/db/lawyers');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.lawyers) && json.lawyers.length > 0) {
        return json.lawyers;
      }
    }
  } catch (err) {
    console.warn('fetchLawyersDirectory proxy notice:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('lawyers')
        .select('*, profile:profiles(*)')
        .order('rating_avg', { ascending: false });

      if (!error && data && data.length > 0) {
        if (data.some((l: any) => l.profile?.full_name)) {
          return data as Lawyer[];
        }
      }
    } catch (err) {
      console.warn('fetchLawyersDirectory client notice:', err);
    }
  }

  return SEED_LAWYERS;
}

export async function fetchLawyerById(lawyerId: string): Promise<Lawyer | null> {
  // 1. Try server proxy API first (bypasses RLS)
  try {
    const res = await fetch('/api/db/lawyers');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.lawyers)) {
        const found = json.lawyers.find((l: any) => l.id === lawyerId || l.profile_id === lawyerId);
        if (found) return found as Lawyer;
      }
    }
  } catch (err) {
    console.warn('fetchLawyerById proxy notice:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();
  if (client) {
    try {
      const { data } = await client
        .from('lawyers')
        .select('*, profile:profiles(*)')
        .or(`id.eq.${lawyerId},profile_id.eq.${lawyerId}`)
        .maybeSingle();
      if (data) return data as Lawyer;
    } catch {}
  }

  // Fallback: check seed lawyers
  const found = SEED_LAWYERS.find((l) => l.id === lawyerId || l.profile_id === lawyerId);
  return found || null;
}

// ==========================================
// LAWYER CONNECTIONS & INBOX HELPERS — DB PRIMARY
// ==========================================

export async function createLawyerConnection(
  citizenId: string,
  lawyerId: string,
  caseId: string
): Promise<LawyerConnection> {
  const dbCitizenId = toValidUUID(citizenId);
  const dbLawyerId = toValidUUID(lawyerId);
  const dbCaseId = toValidUUID(caseId);
  const connectionId = generateUUID();

  const newConn: LawyerConnection = {
    id: connectionId,
    case_id: dbCaseId,
    citizen_id: dbCitizenId,
    lawyer_id: dbLawyerId,
    status: 'requested',
    requested_at: new Date().toISOString(),
  };

  // 1. Server proxy first (bypasses RLS)
  try {
    const res = await fetch('/api/db/connections/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizen_id: citizenId,
        lawyer_id: lawyerId,
        case_id: caseId,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.connection) return json.connection;
    }
  } catch (err) {
    console.warn('createLawyerConnection proxy notice:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();
  if (client) {
    try {
      const validCitizenId = await resolveValidProfileId(client, citizenId);
      const validLawyerId = await resolveValidLawyerId(client, lawyerId);
      const validCaseId = await resolveValidCaseId(client, caseId, validCitizenId);

      const { data, error } = await client
        .from('lawyer_connections')
        .upsert(
          {
            id: connectionId,
            case_id: validCaseId,
            citizen_id: validCitizenId,
            lawyer_id: validLawyerId,
            status: 'requested',
            requested_at: newConn.requested_at,
          },
          { onConflict: 'id' }
        )
        .select('*')
        .maybeSingle();

      if (!error && data) {
        return data as LawyerConnection;
      }
    } catch (err) {
      console.error('createLawyerConnection exception:', err);
    }
  }

  return newConn;
}

export async function fetchLawyerConnectionsForLawyer(lawyerId: string): Promise<LawyerConnection[]> {
  // 1. Try server proxy first (bypasses RLS)
  try {
    const res = await fetch(`/api/db/connections?lawyerId=${encodeURIComponent(lawyerId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.connections)) {
        return json.connections;
      }
    }
  } catch (err) {
    console.warn('fetchLawyerConnectionsForLawyer proxy error:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();
  const dbLawyerId = toValidUUID(lawyerId);
  const lawyerObj = await fetchLawyerById(lawyerId);

  const targetIds = Array.from(
    new Set(
      [
        lawyerId,
        dbLawyerId,
        lawyerObj?.id,
        lawyerObj?.id ? toValidUUID(lawyerObj.id) : null,
        lawyerObj?.profile_id,
        lawyerObj?.profile_id ? toValidUUID(lawyerObj.profile_id) : null,
      ].filter(Boolean) as string[]
    )
  );

  if (client) {
    try {
      const { data, error } = await client
        .from('lawyer_connections')
        .select('*, case:cases(*), citizen_profile:profiles!lawyer_connections_citizen_id_fkey(*)')
        .in('lawyer_id', targetIds)
        .order('requested_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as LawyerConnection[];
      }
    } catch (err) {
      console.warn('fetchLawyerConnectionsForLawyer client error:', err);
    }
  }

  return [];
}

export async function updateConnectionStatus(
  connectionId: string,
  caseId: string,
  lawyerId: string,
  citizenId: string,
  status: ConnectionStatus
): Promise<void> {
  const dbStatus = (status as string) === 'declined' ? 'rejected' : status;

  // 1. Server proxy first (bypasses RLS)
  try {
    await fetch('/api/db/connections/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId,
        caseId,
        lawyerId,
        citizenId,
        status: dbStatus,
      }),
    });
  } catch (err) {
    console.warn('updateConnectionStatus proxy notice:', err);
  }

  // 2. Client side fallback
  if (status === 'accepted') {
    await updateCaseStatus(caseId, citizenId, 'lawyer_connected');
  }

  const client = getSupabase();
  if (client) {
    try {
      const validCitizenId = await resolveValidProfileId(client, citizenId);
      const validLawyerId = await resolveValidLawyerId(client, lawyerId);
      const validCaseId = await resolveValidCaseId(client, caseId, validCitizenId);

      const dbConnectionId = toValidUUID(connectionId);
      const targetConnIds = Array.from(new Set([connectionId, dbConnectionId].filter(Boolean)));
      await client
        .from('lawyer_connections')
        .update({ status: dbStatus })
        .in('id', targetConnIds);
    } catch (err) {
      console.warn('updateConnectionStatus db error:', err);
    }
  }
}

export async function fetchLawyerConnectionsForCitizen(citizenId: string): Promise<LawyerConnection[]> {
  // 1. Try server proxy first (bypasses RLS)
  try {
    const res = await fetch(`/api/db/connections?citizenId=${encodeURIComponent(citizenId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.connections)) {
        return json.connections;
      }
    }
  } catch (err) {
    console.warn('fetchLawyerConnectionsForCitizen proxy error:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();
  const dbCitizenId = toValidUUID(citizenId);

  if (client) {
    try {
      const validCitizenId = await resolveValidProfileId(client, citizenId);
      const targetIds = Array.from(
        new Set(
          [
            citizenId,
            dbCitizenId,
            validCitizenId,
          ].filter(Boolean) as string[]
        )
      );

      const { data, error } = await client
        .from('lawyer_connections')
        .select('*, case:cases(*), lawyer:lawyers!lawyer_connections_lawyer_id_fkey(*, profile:profiles(*))')
        .in('citizen_id', targetIds)
        .order('requested_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((conn: any) => {
          if (conn.status === 'approved' || conn.status === 'lawyer_connected') {
            conn.status = 'accepted';
          }
          return conn as LawyerConnection;
        });
      }
    } catch (err) {
      console.warn('fetchLawyerConnectionsForCitizen client error:', err);
    }
  }

  return [];
}

// ==========================================
// DIRECT MESSAGES — DB PRIMARY
// ==========================================

export interface DirectMessage {
  id: string;
  connection_id: string;
  sender_id: string;
  sender_type: 'lawyer' | 'citizen';
  content: string;
  sent_at: string;
}

export async function sendDirectMessage(
  connectionId: string,
  senderId: string,
  senderType: 'lawyer' | 'citizen',
  content: string
): Promise<DirectMessage> {
  const dbConnectionId = toValidUUID(connectionId);
  const msgId = generateUUID();
  const msg: DirectMessage = {
    id: msgId,
    connection_id: connectionId,
    sender_id: senderId,
    sender_type: senderType,
    content: content.trim(),
    sent_at: new Date().toISOString(),
  };

  // 1. Server proxy first (bypasses RLS)
  try {
    const res = await fetch('/api/db/direct-messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connection_id: connectionId,
        sender_id: senderId,
        sender_type: senderType,
        content: content.trim(),
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.message) return json.message;
    }
  } catch (err) {
    console.warn('sendDirectMessage proxy notice:', err);
  }

  // 2. Client side fallback
  const client = getSupabase();
  if (client) {
    try {
      await client.from('direct_messages').insert({
        id: msgId,
        connection_id: dbConnectionId,
        sender_id: senderId,
        sender_type: senderType,
        content: msg.content,
        sent_at: msg.sent_at,
      });
    } catch (err) {
      console.warn('sendDirectMessage db warning:', err);
    }
  }

  return msg;
}

export async function fetchDirectMessages(connectionId: string): Promise<DirectMessage[]> {
  const dbConnectionId = toValidUUID(connectionId);
  const client = getSupabase();

  // 1. Client side
  if (client) {
    try {
      const { data, error } = await client
        .from('direct_messages')
        .select('*')
        .in('connection_id', Array.from(new Set([connectionId, dbConnectionId])))
        .order('sent_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as DirectMessage[];
      }
    } catch (err) {
      console.warn('fetchDirectMessages db warning:', err);
    }
  }

  // 2. Server proxy
  try {
    const res = await fetch(`/api/db/direct-messages?connectionId=${encodeURIComponent(connectionId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.messages)) {
        return json.messages;
      }
    }
  } catch (err) {
    console.warn('fetchDirectMessages proxy notice:', err);
  }

  return [];
}

// ==========================================
// REVIEWS & RATINGS HELPERS — DB PRIMARY
// ==========================================

export async function fetchLawyerReviews(lawyerId: string): Promise<Review[]> {
  // 1. Try server proxy API first (uses admin key, bypasses RLS)
  try {
    const res = await fetch(`/api/db/reviews?lawyer_id=${encodeURIComponent(lawyerId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.reviews)) {
        return json.reviews as Review[];
      }
    }
  } catch (err) {
    console.warn('fetchLawyerReviews proxy error:', err);
  }

  // 2. Client SDK fallback
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('reviews')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Review[];
      }
    } catch (err) {
      console.warn('fetchLawyerReviews error:', err);
    }
  }

  // Return empty array
  return [];
}

export async function submitLawyerReview(
  lawyerId: string,
  citizenId: string,
  rating: number,
  reviewText: string
): Promise<Review> {
  const newRev: Review = {
    id: generateUUID(),
    lawyer_id: lawyerId,
    citizen_id: citizenId,
    rating,
    review_text: reviewText,
    created_at: new Date().toISOString(),
  };

  // 1. Try server proxy API first (uses admin key, bypasses RLS)
  try {
    const res = await fetch('/api/db/reviews/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lawyer_id: lawyerId,
        citizen_id: citizenId,
        rating,
        review_text: reviewText,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.review) {
        return json.review as Review;
      }
    }
  } catch (err) {
    console.warn('submitLawyerReview proxy error:', err);
  }

  // 2. Client SDK fallback
  const client = getSupabase();
  if (client && isValidUUID(lawyerId)) {
    try {
      await client.from('reviews').insert({
        id: newRev.id,
        lawyer_id: lawyerId,
        citizen_id: citizenId,
        rating,
        review_text: reviewText,
      });

      // Recalculate average rating
      const { data: revs } = await client.from('reviews').select('rating').eq('lawyer_id', lawyerId);
      if (revs && revs.length > 0) {
        const avg = revs.reduce((acc, r) => acc + r.rating, 0) / revs.length;
        await client.from('lawyers').update({ rating_avg: parseFloat(avg.toFixed(1)) }).eq('id', lawyerId);
      }
    } catch (err) {
      console.warn('submitLawyerReview error:', err);
    }
  }

  return newRev;
}
