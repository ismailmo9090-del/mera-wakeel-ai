import { Lawyer, LawyerConnection, ConnectionStatus, Review } from '../../types/database';
import { getSupabase, generateUUID, isValidUUID, toValidUUID, resolveValidProfileId, resolveValidLawyerId, resolveValidCaseId } from './client';
import { updateCaseStatus } from './cases';

export async function createLawyerEntry(profileId: string, extraData?: Partial<Lawyer>): Promise<Lawyer | null> {
  const mockLawyer: Lawyer = {
    id: generateUUID(),
    profile_id: profileId,
    specialty: extraData?.specialty || ['General Legal Practice'],
    years_experience: extraData?.years_experience || 1,
    bar_council_number: extraData?.bar_council_number || '',
    bar_council_state: extraData?.bar_council_state || null,
    verification_status: 'pending',
    verified_at: null,
    is_verified: true,
    bio: extraData?.bio || 'Advocate registered on Mera Wakeel AI',
    consultation_fee_range: extraData?.consultation_fee_range || '₹1000 - ₹2000',
    rating_avg: 5.0,
    total_cases_handled: 0,
    available: true,
    profile_photo_url: extraData?.profile_photo_url || null,
  };

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
    bar_council_state?: string | null;
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
    bar_council_state: lawyerData.bar_council_state || null,
    verification_status: 'pending',
    verified_at: null,
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

  try {
    const res = await fetch('/api/db/lawyers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        profile_photo_url: lawyerData.profile_photo_url,
        bar_council_number: lawyerData.bar_council_number,
        bar_council_state: lawyerData.bar_council_state,
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
          bar_council_state: lawyerData.bar_council_state || null,
          verification_status: 'pending',
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

const SEED_LAWYERS: Lawyer[] = [
  {
    id: 'lawyer_rajesh_sharma',
    profile_id: 'prof_rajesh',
    specialty: ['Property Law', 'Civil Litigation', 'Consumer Law'],
    years_experience: 14,
    bar_council_number: 'D/2048/2010',
    bar_council_state: 'Delhi',
    verification_status: 'verified',
    verified_at: '2024-01-10T00:00:00.000Z',
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
    bar_council_state: 'Maharashtra',
    verification_status: 'verified',
    verified_at: '2024-02-05T00:00:00.000Z',
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
    bar_council_state: 'Karnataka',
    verification_status: 'verified',
    verified_at: '2024-03-12T00:00:00.000Z',
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
    bar_council_state: 'Uttar Pradesh',
    verification_status: 'verified',
    verified_at: '2023-11-20T00:00:00.000Z',
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

  const found = SEED_LAWYERS.find((l) => l.id === lawyerId || l.profile_id === lawyerId);
  return found || null;
}

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

export async function fetchLawyerReviews(lawyerId: string): Promise<Review[]> {
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
