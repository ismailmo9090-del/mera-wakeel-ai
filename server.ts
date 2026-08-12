import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { buildLegalSystemPrompt } from "./legalPersona";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

// Initialize Supabase Admin Client for secure server-side ops
const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// The admin client must use the SERVICE ROLE key (bypasses RLS). If it falls
// back to the anon key, RLS blocks every server write and the whole app breaks.
const adminUsesServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  && process.env.SUPABASE_SERVICE_ROLE_KEY.trim().startsWith('eyJ')
  && process.env.SUPABASE_SERVICE_ROLE_KEY !== anonKey;

if (!adminUsesServiceRole) {
  console.error('======================================================================');
  console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing or invalid in .env.');
  console.error('The server is using the ANON key for admin DB operations, which is');
  console.error('blocked by Row Level Security (RLS). Every write fails with:');
  console.error('  "new row violates row-level security policy for table ..."');
  console.error('Fix: add this to .env and restart the server:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  console.error('Get it from: Supabase Dashboard -> Settings -> API -> service_role.');
  console.error('======================================================================');
}

// Gemini 3.6 Flash Server Client (raw REST transport)
// NOTE: The @google/genai SDK sends keys via the "x-goog-api-key" header, which
// Google rejects for the new "AQ." authorization keys with
// ACCESS_TOKEN_TYPE_UNSUPPORTED. Plain REST with the "?key=" query parameter
// works with both "AIza..." and "AQ." keys, so we call the REST API directly.
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

if (geminiApiKey && !geminiApiKey.trim().startsWith('AIza') && !geminiApiKey.trim().startsWith('AQ.')) {
  console.error('WARNING: GEMINI_API_KEY does not look like a valid Gemini API key.');
  console.error('Valid keys start with "AIza" or the newer "AQ." authorization key');
  console.error('(from https://aistudio.google.com/apikey). The app still works via');
  console.error('Groq + deterministic embeddings, but Gemini features need a valid key.');
}

async function geminiGenerateContent(opts: {
  model: string;
  parts: any[];
  systemInstruction?: string;
  temperature?: number;
}): Promise<string> {
  if (!geminiApiKey) throw new Error("No GEMINI_API_KEY set");
  const url = `${GEMINI_BASE}/models/${opts.model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;
  const body: any = {
    contents: [{ role: "user", parts: opts.parts }],
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }
  if (opts.temperature !== undefined) {
    body.generationConfig = { temperature: opts.temperature };
  }
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    throw new Error(`Gemini ${opts.model} error ${resp.status}: ${await resp.text()}`);
  }
  const data: any = await resp.json();
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p: any) => p.text || "")
    .join("");
  if (!text.trim()) throw new Error(`Gemini ${opts.model} returned empty response`);
  return text;
}

// Helper function to generate 1536-dim vector embedding via Gemini API gemini-embedding-001
async function generateVectorEmbedding(text: string): Promise<number[]> {
  const dim = 1536;
  if (!text || !text.trim()) return new Array(dim).fill(0);

  if (geminiApiKey) {
    try {
      const url = `${GEMINI_BASE}/models/gemini-embedding-001:embedContent?key=${encodeURIComponent(geminiApiKey)}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: text.slice(0, 2048) }] },
          outputDimensionality: dim,
        }),
      });
      if (!resp.ok) {
        throw new Error(`Gemini embed error ${resp.status}: ${await resp.text()}`);
      }
      const data: any = await resp.json();
      const vec = data?.embedding?.values;
      if (vec && Array.isArray(vec) && vec.length === dim) {
        return vec;
      }
    } catch (err: any) {
      console.warn("Gemini embedContent warning, fallback to deterministic vector:", err?.message || err);
    }
  }

  // Fallback deterministic feature hashing vector generator
  const vec = new Array(dim).fill(0);
  const clean = text.toLowerCase().trim();
  const words = clean.split(/\W+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1.0 / (i + 1);
  }
  let sumSq = 0;
  for (let i = 0; i < dim; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((v) => v / norm);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      supabaseConfigured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
      supabaseAdminConfigured: !!supabaseAdmin,
      adminUsesServiceRole: adminUsesServiceRole,
      geminiConfigured: !!geminiApiKey,
      groqConfigured: !!(process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY),
    });
  });

  // Helpers for server-side Supabase Admin DB ops (bypasses RLS)
  function isUuid(str: string): boolean {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  function toUuid(id: string): string {
    if (!id) return crypto.randomUUID();
    if (isUuid(id)) return id;
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

  const GUEST_PROFILE_ID = 'cfabc5e6-1924-451e-8cc7-afc493f4e239';
  const DEFAULT_CITIZEN_ID = 'a092814b-0e43-4001-9f83-138e22a52df1';

  async function serverEnsureProfile(profileId?: string): Promise<string> {
    if (!supabaseAdmin) return GUEST_PROFILE_ID;

    const targetId = (!profileId || profileId === 'guest_citizen' || profileId === 'guest' || profileId.includes('guest'))
      ? GUEST_PROFILE_ID
      : (isUuid(profileId) ? profileId : toUuid(profileId));

    try {
      const { data } = await supabaseAdmin.from('profiles').select('id').eq('id', targetId).maybeSingle();
      if (data?.id) return data.id;

      const { data: upserted, error } = await supabaseAdmin.from('profiles').upsert(
        {
          id: targetId,
          full_name: targetId === GUEST_PROFILE_ID ? 'Guest Citizen' : 'Citizen User',
          user_type: 'citizen',
          preferred_language: 'hindi',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      ).select('id').maybeSingle();

      if (!error && upserted?.id) return upserted.id;
      return targetId;
    } catch (err) {
      console.warn('serverEnsureProfile warning:', err);
      return targetId;
    }
  }

  async function serverEnsureCase(caseId: string, citizenId?: string): Promise<string> {
    if (!supabaseAdmin) return caseId;
    const validCaseId = isUuid(caseId) ? caseId : toUuid(caseId);
    const validCitizenId = await serverEnsureProfile(citizenId);

    try {
      const { data } = await supabaseAdmin.from('cases').select('id').eq('id', validCaseId).maybeSingle();
      if (data?.id) return data.id;

      const { data: newCase, error } = await supabaseAdmin.from('cases').upsert({
        id: validCaseId,
        citizen_id: validCitizenId,
        title: 'Naya Legal Query',
        category: 'other',
        status: 'ongoing',
        ai_verdict: 'needs_more_info',
        confidence_score: 0.5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }).select('id').maybeSingle();

      if (!error && newCase?.id) return newCase.id;

      return validCaseId;
    } catch (err) {
      console.warn('serverEnsureCase warning:', err);
      return validCaseId;
    }
  }

  // ==========================================
  // SERVER-SIDE DATABASE API PROXIES (RLS BYPASS VIA SUPABASE ADMIN)
  // ==========================================

  // 1. MESSAGES GET
  app.get("/api/db/messages", async (req, res) => {
    try {
      const caseId = req.query.caseId as string;
      if (!caseId) return res.json({ success: true, messages: [] });

      const dbCaseId = toUuid(caseId);
      const targetIds = Array.from(new Set([caseId, dbCaseId].filter(isUuid)));

      if (!supabaseAdmin) return res.json({ success: false, messages: [] });

      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .in('case_id', targetIds)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return res.json({ success: true, messages: data || [] });
    } catch (err: any) {
      console.warn("/api/db/messages GET error:", err.message);
      return res.json({ success: false, messages: [] });
    }
  });

  // 2. MESSAGES SAVE
  app.post("/api/db/messages/save", async (req, res) => {
    try {
      const { case_id, sender_type, content, message_type = 'text', citizen_id = 'guest_citizen' } = req.body;
      if (!case_id || !content) return res.status(400).json({ error: "case_id and content are required" });

      if (supabaseAdmin) {
        const dbCaseId = await serverEnsureCase(case_id, citizen_id);
        const msgObj = {
          id: crypto.randomUUID(),
          case_id: dbCaseId,
          sender_type: sender_type === 'user' ? 'user' : 'ai',
          content: String(content).trim(),
          message_type: message_type || 'text',
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from('messages')
          .insert(msgObj)
          .select('*')
          .single();

        if (!error && data) {
          return res.json({ success: true, message: data });
        } else if (error) {
          console.warn("/api/db/messages/save insert error:", error.message);
          // Never retry against a hardcoded case id — that leaks messages into
          // another citizen's case. Return failure so the client can retry
          // through its own RLS-scoped fallback instead.
          return res.status(500).json({ success: false, error: error.message });
        }
        return res.json({ success: true, message: msgObj });
      }

      return res.json({ success: true, message: { id: crypto.randomUUID(), case_id, sender_type, content, message_type, created_at: new Date().toISOString() } });
    } catch (err: any) {
      console.error("/api/db/messages/save error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. CASES GET
  app.get("/api/db/cases", async (req, res) => {
    try {
      const citizenId = (req.query.citizenId as string) || 'guest_citizen';
      if (!supabaseAdmin) return res.json({ success: false, cases: [] });

      const dbCitizenId = await serverEnsureProfile(citizenId);
      const rawUuid = isUuid(citizenId) ? citizenId : toUuid(citizenId);

      const targetIds = Array.from(
        new Set([
          citizenId,
          dbCitizenId,
          rawUuid,
          GUEST_PROFILE_ID,
          'cfabc5e6-1924-451e-8cc7-afc493f4e239',
          'guest_citizen',
          'guest'
        ].filter(isUuid))
      );

      let { data, error } = await supabaseAdmin
        .from('cases')
        .select('*')
        .in('citizen_id', targetIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("/api/db/cases GET query notice:", error.message);
      }

      // NOTE: No cross-user fallback here. Returning cases that do not belong
      // to the requesting citizen would leak another user's private data.

      return res.json({ success: true, cases: data || [] });
    } catch (err: any) {
      console.warn("/api/db/cases GET exception:", err.message);
      return res.json({ success: false, cases: [] });
    }
  });

  // 4. CASES SAVE
  app.post("/api/db/cases/save", async (req, res) => {
    try {
      const { id, citizen_id, title, category = 'other', status = 'ongoing', ai_verdict = 'needs_more_info', ai_summary, confidence_score } = req.body;
      if (!citizen_id) return res.status(400).json({ error: "citizen_id is required" });

      const caseId = id ? toUuid(id) : crypto.randomUUID();
      const validCitizenId = await serverEnsureProfile(citizen_id);

      const caseData = {
        id: caseId,
        citizen_id: validCitizenId,
        title: title || 'Naya Legal Query',
        category: category || 'other',
        status: status || 'ongoing',
        ai_verdict: ai_verdict || 'needs_more_info',
        ai_summary: ai_summary || null,
        confidence_score: confidence_score ?? 0.5,
        updated_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('cases')
          .upsert(caseData, { onConflict: 'id' })
          .select('*')
          .single();

        if (!error && data) {
          return res.json({ success: true, case: data });
        }
        if (error) {
          console.warn("/api/db/cases/save error:", error.message);
          return res.status(500).json({ success: false, error: error.message });
        }
      }

      return res.status(500).json({ success: false, error: "Supabase admin client not configured" });
    } catch (err: any) {
      console.error("/api/db/cases/save exception:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 5. CASES STATUS / VERDICT UPDATE
  app.post("/api/db/cases/status", async (req, res) => {
    try {
      const { caseId, status, ai_verdict, ai_summary, confidence_score } = req.body;
      if (!caseId) return res.status(400).json({ error: "caseId required" });

      const dbCaseId = toUuid(caseId);
      const updateData: any = { updated_at: new Date().toISOString() };
      if (status) updateData.status = status;
      if (ai_verdict) updateData.ai_verdict = ai_verdict;
      if (ai_summary !== undefined) updateData.ai_summary = ai_summary;
      if (confidence_score !== undefined) updateData.confidence_score = confidence_score;

      if (supabaseAdmin) {
        await supabaseAdmin.from('cases').update(updateData).in('id', Array.from(new Set([caseId, dbCaseId].filter(isUuid))));
      }

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 6. DOCUMENTS GET
  app.get("/api/db/documents", async (req, res) => {
    try {
      const caseId = req.query.caseId as string;
      if (!caseId) return res.json({ success: true, documents: [] });

      const dbCaseId = toUuid(caseId);
      const targetIds = Array.from(new Set([caseId, dbCaseId].filter(isUuid)));

      if (!supabaseAdmin) return res.json({ success: false, documents: [] });

      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('*')
        .in('case_id', targetIds)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, documents: data || [] });
    } catch (err: any) {
      return res.json({ success: false, documents: [] });
    }
  });

  function sanitizeDbDocumentType(type?: string | null): string {
    if (!type) return 'unknown';
    const validSet = new Set(['stamp_paper', 'will', 'registry', 'sale_deed', 'power_of_attorney', 'affidavit', 'contract', 'court_notice', 'lease_agreement', 'legal_notice', 'other', 'unknown']);
    const lower = String(type).toLowerCase().trim();
    if (validSet.has(lower)) return lower;
    if (lower.includes('stamp')) return 'stamp_paper';
    if (lower.includes('will')) return 'will';
    if (lower.includes('registry') || lower.includes('registration')) return 'registry';
    if (lower.includes('sale') || lower.includes('deed')) return 'sale_deed';
    if (lower.includes('power of attorney') || lower.includes('mukhtarnama')) return 'power_of_attorney';
    if (lower.includes('affidavit')) return 'affidavit';
    if (lower.includes('contract') || lower.includes('agreement')) return 'contract';
    if (lower.includes('court notice') || lower.includes('legal notice')) return 'legal_notice';
    if (lower.includes('lease')) return 'lease_agreement';
    return 'unknown';
  }

  // 7. DOCUMENTS SAVE
  app.post("/api/db/documents/save", async (req, res) => {
    try {
      const { id, case_id, file_url, document_type, ai_extracted_text, ai_summary, ai_analysis, is_verified, is_verified_valid, citizen_id } = req.body;
      if (!case_id) return res.status(400).json({ error: "case_id required" });

      const docId = id ? toUuid(id) : crypto.randomUUID();
      const dbCaseId = toUuid(case_id);

      if (supabaseAdmin) {
        const resolvedCaseId = await serverEnsureCase(case_id, citizen_id || 'guest_citizen');
        
        // Check if doc exists
        const { data: existingDoc } = await supabaseAdmin.from('documents').select('*').eq('id', docId).maybeSingle();
        
        const safeDocType = sanitizeDbDocumentType(document_type);
        const updateData: any = {};
        if (file_url !== undefined) updateData.file_url = file_url;
        if (document_type !== undefined) updateData.document_type = safeDocType;
        if (ai_extracted_text !== undefined) updateData.ai_extracted_text = ai_extracted_text;
        if (ai_analysis !== undefined || ai_summary !== undefined) updateData.ai_analysis = ai_analysis ?? ai_summary ?? null;
        if (is_verified_valid !== undefined || is_verified !== undefined) updateData.is_verified_valid = is_verified_valid ?? is_verified ?? false;

        if (existingDoc) {
          const { data, error } = await supabaseAdmin.from('documents').update(updateData).eq('id', docId).select('*').single();
          if (error) {
            console.error("Error updating document in server endpoint:", error);
            return res.status(500).json({ error: error.message });
          }
          return res.json({ success: true, document: data });
        } else {
          const docObj = {
            id: docId,
            case_id: resolvedCaseId,
            file_url: file_url || '',
            document_type: safeDocType,
            ai_extracted_text: ai_extracted_text || null,
            ai_analysis: ai_analysis ?? ai_summary ?? null,
            is_verified_valid: is_verified_valid ?? is_verified ?? false,
            uploaded_at: new Date().toISOString(),
          };
          const { data, error } = await supabaseAdmin.from('documents').insert(docObj).select('*').single();
          if (error) {
            console.error("Error inserting document in server endpoint:", error);
            return res.status(500).json({ error: error.message });
          }
          return res.json({ success: true, document: data });
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("Server document save catch error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 8. DOCUMENTS DELETE
  app.delete("/api/db/documents/:id", async (req, res) => {
    try {
      const docId = req.params.id;
      if (!docId) return res.status(400).json({ error: "id required" });

      if (supabaseAdmin) {
        const dbDocId = toUuid(docId);
        await supabaseAdmin.from('documents').delete().in('id', Array.from(new Set([docId, dbDocId].filter(isUuid))));
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 9. FACTS GET
  app.get("/api/db/facts", async (req, res) => {
    try {
      const caseId = req.query.caseId as string;
      const profileId = req.query.profileId as string;

      if (caseId && supabaseAdmin) {
        const dbCaseId = toUuid(caseId);
        const { data } = await supabaseAdmin.from('case_facts').select('*').in('case_id', Array.from(new Set([caseId, dbCaseId].filter(isUuid))));
        return res.json({ success: true, facts: data || [] });
      }

      if (profileId && supabaseAdmin) {
        const dbProfId = toUuid(profileId);
        const { data } = await supabaseAdmin.from('profile_facts').select('*').in('profile_id', Array.from(new Set([profileId, dbProfId].filter(isUuid))));
        return res.json({ success: true, facts: data || [] });
      }

      return res.json({ success: true, facts: [] });
    } catch (err: any) {
      return res.json({ success: false, facts: [] });
    }
  });

  // 9b. FACTS SAVE
  app.post("/api/db/facts/save", async (req, res) => {
    try {
      const { case_id, profile_id, key, value, citizen_id } = req.body;
      if (!key || !value) return res.status(400).json({ error: "key and value required" });

      if (supabaseAdmin) {
        const nowIso = new Date().toISOString();
        if (case_id) {
          const dbCaseId = await serverEnsureCase(case_id, citizen_id || 'guest_citizen');
          await supabaseAdmin.from('case_facts').upsert(
            { case_id: dbCaseId, fact_key: key, fact_value: value, updated_at: nowIso },
            { onConflict: 'case_id,fact_key' }
          );
        }
        if (profile_id) {
          const dbProfId = await serverEnsureProfile(profile_id);
          await supabaseAdmin.from('profile_facts').upsert(
            { profile_id: dbProfId, fact_key: key, fact_value: value, updated_at: nowIso },
            { onConflict: 'profile_id,fact_key' }
          );
        }
      }
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Server facts save catch error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 10. EVIDENCE GET & SAVE
  app.get("/api/db/evidence", async (req, res) => {
    try {
      const caseId = req.query.caseId as string;
      if (!caseId || !supabaseAdmin) return res.json({ success: true, evidence: [] });

      const dbCaseId = toUuid(caseId);
      const { data } = await supabaseAdmin.from('case_evidence').select('*').in('case_id', Array.from(new Set([caseId, dbCaseId].filter(isUuid))));
      return res.json({ success: true, evidence: data || [] });
    } catch (err: any) {
      return res.json({ success: false, evidence: [] });
    }
  });

  app.post("/api/db/evidence/save", async (req, res) => {
    try {
      const { case_id, title, description, priority = 'helpful', citizen_id } = req.body;
      const evidenceDescription = String(description || title || '').trim();
      if (!case_id || !evidenceDescription) return res.status(400).json({ error: "case_id and evidence text required" });

      const dbCaseId = toUuid(case_id);
      const safePriority = (priority === 'critical' || priority === 'optional') ? priority : 'helpful';
      const evObj = {
        id: crypto.randomUUID(),
        case_id: dbCaseId,
        evidence_description: evidenceDescription,
        is_available: false,
        priority: safePriority,
      };

      if (supabaseAdmin) {
        await serverEnsureCase(case_id, citizen_id || 'guest_citizen');
        const { data } = await supabaseAdmin.from('case_evidence').insert(evObj).select('*').single();
        if (data) return res.json({ success: true, evidence: data });
      }

      return res.json({ success: true, evidence: evObj });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 11. LAWYER CONNECTIONS GET & SAVE & STATUS
  app.get("/api/db/connections", async (req, res) => {
    try {
      const citizenId = req.query.citizenId as string;
      const lawyerId = req.query.lawyerId as string;

      if (!supabaseAdmin) return res.json({ success: false, connections: [] });

      if (citizenId) {
        const dbCitId = toUuid(citizenId);
        const { data } = await supabaseAdmin
          .from('lawyer_connections')
          .select('*, case:cases(*), lawyer:lawyers!lawyer_connections_lawyer_id_fkey(*, profile:profiles(*))')
          .in('citizen_id', Array.from(new Set([citizenId, dbCitId].filter(isUuid))))
          .order('requested_at', { ascending: false });

        return res.json({ success: true, connections: data || [] });
      }

      if (lawyerId) {
        const dbLawId = toUuid(lawyerId);
        const { data } = await supabaseAdmin
          .from('lawyer_connections')
          .select('*, case:cases(*), citizen_profile:profiles!lawyer_connections_citizen_id_fkey(*)')
          .in('lawyer_id', Array.from(new Set([lawyerId, dbLawId].filter(isUuid))))
          .order('requested_at', { ascending: false });

        return res.json({ success: true, connections: data || [] });
      }

      return res.json({ success: true, connections: [] });
    } catch (err: any) {
      return res.json({ success: false, connections: [] });
    }
  });

  app.post("/api/db/connections/save", async (req, res) => {
    try {
      const citizen_id = req.body.citizen_id || req.body.citizenId;
      const lawyer_id = req.body.lawyer_id || req.body.lawyerId;
      let case_id = req.body.case_id || req.body.caseId;

      if (!citizen_id || !lawyer_id) return res.status(400).json({ error: "citizen_id and lawyer_id are required" });

      const dbCitizenId = await serverEnsureProfile(citizen_id);
      const dbLawyerId = toUuid(lawyer_id);
      const dbCaseId = await serverEnsureCase(case_id || 'active_case', citizen_id);
      const connectionId = crypto.randomUUID();

      const connObj = {
        id: connectionId,
        case_id: dbCaseId,
        citizen_id: dbCitizenId,
        lawyer_id: dbLawyerId,
        status: req.body.status || 'requested',
        requested_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.from('lawyer_connections').upsert(connObj, { onConflict: 'id' }).select('*').single();
        if (data) return res.json({ success: true, connection: data });
        if (error) {
          console.warn("/api/db/connections/save error:", error.message);
          return res.status(500).json({ success: false, error: error.message });
        }
      }

      return res.status(500).json({ success: false, error: "Supabase admin client not configured" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/connections/status", async (req, res) => {
    try {
      const { connectionId, caseId, lawyerId, citizenId, status } = req.body;
      if (!connectionId || !status) return res.status(400).json({ error: "Missing parameters" });

      const dbStatus = status === 'declined' ? 'rejected' : status;
      const dbConnId = toUuid(connectionId);

      if (supabaseAdmin) {
        await supabaseAdmin.from('lawyer_connections').update({ status: dbStatus }).in('id', Array.from(new Set([connectionId, dbConnId].filter(isUuid))));

        if (status === 'accepted' && caseId) {
          const dbCaseId = toUuid(caseId);
          const validLawyerId = toUuid(lawyerId);
          await supabaseAdmin.from('cases').update({ assigned_lawyer_id: validLawyerId, status: 'lawyer_connected' }).in('id', Array.from(new Set([caseId, dbCaseId].filter(isUuid))));
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 12. DIRECT MESSAGES GET & SEND
  app.get("/api/db/direct-messages", async (req, res) => {
    try {
      const connectionId = req.query.connectionId as string;
      if (!connectionId || !supabaseAdmin) return res.json({ success: true, messages: [] });

      const dbConnId = toUuid(connectionId);
      const { data } = await supabaseAdmin
        .from('direct_messages')
        .select('*')
        .in('connection_id', Array.from(new Set([connectionId, dbConnId].filter(isUuid))))
        .order('sent_at', { ascending: true });

      return res.json({ success: true, messages: data || [] });
    } catch (err: any) {
      return res.json({ success: false, messages: [] });
    }
  });

  app.post("/api/db/direct-messages/send", async (req, res) => {
    try {
      const { connection_id, sender_id, sender_type, content } = req.body;
      if (!connection_id || !content) return res.status(400).json({ error: "Missing parameters" });

      const dbConnId = toUuid(connection_id);
      const msgObj = {
        id: crypto.randomUUID(),
        connection_id: dbConnId,
        sender_id: sender_id || 'user',
        sender_type: sender_type || 'citizen',
        content: String(content).trim(),
        sent_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        const { data } = await supabaseAdmin.from('direct_messages').insert(msgObj).select('*').single();
        if (data) return res.json({ success: true, message: data });
      }

      return res.json({ success: true, message: msgObj });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 13. LAWYERS DIRECTORY GET
  app.get("/api/db/lawyers", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.json({ success: false, lawyers: [] });

      const { data } = await supabaseAdmin
        .from('lawyers')
        .select('*, profile:profiles(*)')
        .order('rating_avg', { ascending: false });

      return res.json({ success: true, lawyers: data || [] });
    } catch (err: any) {
      return res.json({ success: false, lawyers: [] });
    }
  });

  // 13B. UPDATE LAWYER PROFILE & PROFILE PHOTO
  app.post("/api/db/lawyers/update", async (req, res) => {
    try {
      const {
        userId,
        profile_photo_url,
        bar_council_number,
        specialty,
        years_experience,
        bio,
        consultation_fee_range,
        courts,
        city,
        state
      } = req.body;

      if (!userId || !supabaseAdmin) {
        return res.status(400).json({ success: false, error: "userId is required" });
      }

      const dbUserId = await serverEnsureProfile(userId);
      const targetIds = Array.from(new Set([userId, dbUserId, toUuid(userId)].filter(isUuid)));

      // 1. Update profiles table if city or state provided
      if (city || state) {
        await supabaseAdmin
          .from('profiles')
          .update({
            city: city || undefined,
            state: state || undefined,
            updated_at: new Date().toISOString()
          })
          .in('id', targetIds);
      }

      // 2. Parse payload for lawyers table
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (profile_photo_url !== undefined) updatePayload.profile_photo_url = profile_photo_url;
      if (bar_council_number !== undefined) updatePayload.bar_council_number = bar_council_number;
      if (bio !== undefined) updatePayload.bio = bio;
      if (consultation_fee_range !== undefined) updatePayload.consultation_fee_range = consultation_fee_range;
      if (years_experience !== undefined) {
        const parsedExp = parseInt(years_experience, 10);
        if (!isNaN(parsedExp)) updatePayload.years_experience = parsedExp;
      }
      if (specialty !== undefined) {
        updatePayload.specialty = Array.isArray(specialty)
          ? specialty
          : typeof specialty === 'string'
          ? specialty.split(',').map((s) => s.trim()).filter(Boolean)
          : ["General Legal Practice"];
      }

      // 3. Upsert / update lawyer row in database
      let { data: updatedLawyer, error } = await supabaseAdmin
        .from('lawyers')
        .update(updatePayload)
        .in('profile_id', targetIds)
        .select('*, profile:profiles(*)')
        .maybeSingle();

      if (!updatedLawyer) {
        // If row doesn't exist yet, insert with profile_id
        const insertPayload = {
          profile_id: dbUserId,
          profile_photo_url: profile_photo_url || null,
          bar_council_number: bar_council_number || "BAR/VERIFIED/2026",
          specialty: Array.isArray(specialty) ? specialty : ["General Legal Practice"],
          years_experience: parseInt(years_experience, 10) || 5,
          bio: bio || "Verified Advocate on Mera Wakeel AI Platform",
          consultation_fee_range: consultation_fee_range || "₹1,000 / consultation",
          rating_avg: 5.0,
          total_cases_handled: 12,
          is_verified: true,
          available: true,
          updated_at: new Date().toISOString()
        };
        const { data: createdData } = await supabaseAdmin
          .from('lawyers')
          .upsert(insertPayload, { onConflict: 'profile_id' })
          .select('*, profile:profiles(*)')
          .maybeSingle();
        updatedLawyer = createdData;
      }

      return res.json({ success: true, lawyer: updatedLawyer });
    } catch (err: any) {
      console.error("/api/db/lawyers/update error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 14. PROFILE GET & SAVE
  app.get("/api/db/profile", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId || !supabaseAdmin) return res.json({ success: false, profile: null });

      const dbUserId = toUuid(userId);
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', Array.from(new Set([userId, dbUserId].filter(isUuid))))
        .maybeSingle();

      return res.json({ success: true, profile: data });
    } catch (err: any) {
      return res.json({ success: false, profile: null });
    }
  });

  app.post("/api/db/profile/save", async (req, res) => {
    try {
      const profileId = req.body.id || req.body.userId || req.body.user_id;
      if (!profileId) return res.status(400).json({ error: "id or userId required" });

      const fullName = req.body.full_name || req.body.name || req.body.fullName || null;
      const phone = req.body.phone || null;
      const userType = req.body.user_type || req.body.userType || req.body.role || 'citizen';
      const preferredLanguage = req.body.preferred_language || req.body.preferredLanguage || 'hindi';
      const city = req.body.city || null;
      const state = req.body.state || null;

      const dbUserId = toUuid(profileId);
      const profObj = {
        id: dbUserId,
        full_name: fullName,
        phone,
        user_type: userType,
        preferred_language: preferredLanguage,
        city,
        state,
        updated_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        const { data } = await supabaseAdmin.from('profiles').upsert(profObj, { onConflict: 'id' }).select('*').single();
        if (data) return res.json({ success: true, profile: data });
      }

      return res.json({ success: true, profile: profObj });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 15. REVIEWS GET & SAVE
  app.get("/api/db/reviews", async (req, res) => {
    try {
      const lawyer_id = req.query.lawyer_id || req.query.lawyerId;
      if (!lawyer_id) return res.status(400).json({ error: "lawyer_id is required" });

      if (supabaseAdmin) {
        const targetId = String(lawyer_id);
        const dbLawyerId = toUuid(targetId);
        const { data, error } = await supabaseAdmin
          .from('reviews')
          .select('*')
          .in('lawyer_id', Array.from(new Set([targetId, dbLawyerId].filter(isUuid))))
          .order('created_at', { ascending: false });

        if (!error && data) {
          return res.json({ success: true, reviews: data });
        }
      }
      return res.json({ success: true, reviews: [] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/reviews/save", async (req, res) => {
    try {
      const { lawyer_id, lawyerId, citizen_id, citizenId, rating, review_text, reviewText } = req.body;
      const targetLawyerId = lawyer_id || lawyerId;
      const targetCitizenId = citizen_id || citizenId;
      const text = review_text || reviewText || '';
      const numRating = Number(rating) || 5;

      if (!targetLawyerId) return res.status(400).json({ error: "lawyer_id is required" });

      const dbCitizenId = await serverEnsureProfile(targetCitizenId);
      const dbLawyerId = isUuid(String(targetLawyerId)) ? String(targetLawyerId) : toUuid(String(targetLawyerId));
      const reviewId = crypto.randomUUID();

      const revObj = {
        id: reviewId,
        lawyer_id: dbLawyerId,
        citizen_id: dbCitizenId,
        rating: numRating,
        review_text: text,
        created_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('reviews')
          .upsert(revObj, { onConflict: 'id' })
          .select('*')
          .single();

        if (error) {
          console.warn('/api/db/reviews/save insert error:', error.message);
        }

        // Recalculate average rating for advocate
        const { data: revs } = await supabaseAdmin.from('reviews').select('rating').eq('lawyer_id', dbLawyerId);
        if (revs && revs.length > 0) {
          const avg = revs.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / revs.length;
          const formattedAvg = parseFloat(avg.toFixed(1));
          await supabaseAdmin.from('lawyers').update({ rating_avg: formattedAvg }).eq('id', dbLawyerId);
        }

        if (data) return res.json({ success: true, review: data });
      }

      return res.json({ success: true, review: revObj });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Secure Server-Side Signup Proxy Endpoint (Bypasses SMTP confirmation requirements)
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const {
        email,
        password,
        full_name,
        phone,
        user_type = "citizen",
        preferred_language = "hindi",
        city,
        state,
        bar_council_number,
        years_experience,
        specialty,
        bio,
        consultation_fee_range,
        court_jurisdiction,
        state_bar,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email aur Password zaroori hain." });
      }

      if (!phone || !String(phone).trim() || String(phone).trim().length < 10) {
        return res.status(400).json({ error: "Valid 10-digit Mobile Number zaroori hai. Isk bina registration nahi ho sakta." });
      }

      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase Service Role Key server par configured nahi hai." });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanPhone = String(phone).trim();

      // Check if phone number is already registered to another account
      const { data: existingPhoneUser } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (existingPhoneUser) {
        return res.status(400).json({
          error: "Is mobile number se pehle se account registered hai. Ek mobile number se multiple account nahi ban sakte. Kripya Login karein."
        });
      }

      // 1. Create user via Supabase Admin API with auto email_confirm
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: String(password),
        email_confirm: true,
        user_metadata: {
          full_name: full_name ? String(full_name).trim() : "",
          phone: phone ? String(phone).trim() : "",
          user_type,
          city,
          state,
        },
      });

      if (createError) {
        console.warn("Backend auth.admin.createUser error:", createError.message);
        if (createError.message.includes("already registered") || createError.message.includes("User already exists") || createError.message.includes("duplicate key")) {
          return res.status(400).json({ error: "Yeh email pehle se registered hai. Kripya Login karein." });
        }
        return res.status(400).json({ error: createError.message || "Registration fail ho gaya." });
      }

      const createdUser = userData?.user;
      if (!createdUser?.id) {
        return res.status(500).json({ error: "User ID generation failed." });
      }

      const userId = createdUser.id;

      // 2. Direct database insert into profiles table (Bypasses RLS)
      const profileData = {
        id: userId,
        full_name: full_name ? String(full_name).trim() : null,
        phone: phone ? String(phone).trim() : null,
        user_type: user_type === "lawyer" ? "lawyer" : "citizen",
        preferred_language: preferred_language || "hindi",
        city: city || null,
        state: state || null,
        updated_at: new Date().toISOString(),
      };

      const { data: dbProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(profileData, { onConflict: "id" })
        .select("*")
        .single();

      if (profileError) {
        console.error("Backend profiles upsert error:", profileError.message);
      }

      // 3. If user_type is 'lawyer', insert/upsert into lawyers table
      let lawyerRecord = null;
      if (user_type === "lawyer") {
        const parsedExp = parseInt(years_experience, 10);
        const lawyerPayload = {
          profile_id: userId,
          specialty: Array.isArray(specialty)
            ? specialty
            : specialty
            ? [String(specialty)]
            : ["General Legal Practice"],
          years_experience: isNaN(parsedExp) ? 5 : parsedExp,
          bar_council_number: bar_council_number ? String(bar_council_number).trim() : "",
          is_verified: true,
          bio: bio
            ? String(bio)
            : `Advocate enrolled with ${state_bar || "State Bar Association"}. Court Practice: ${court_jurisdiction || "District & High Courts"}. State: ${state || "India"}`,
          consultation_fee_range: consultation_fee_range
            ? String(consultation_fee_range)
            : "₹1000 Consultation Fee",
          rating_avg: 5.0,
          total_cases_handled: 0,
          available: true,
          updated_at: new Date().toISOString(),
        };

        const { data: dbLawyer, error: lawyerError } = await supabaseAdmin
          .from("lawyers")
          .upsert(lawyerPayload, { onConflict: "profile_id" })
          .select("*")
          .single();

        if (lawyerError) {
          console.error("Backend lawyers upsert error:", lawyerError.message);
        } else {
          lawyerRecord = dbLawyer;
        }
      }

      return res.json({
        success: true,
        user: {
          id: userId,
          email: cleanEmail,
        },
        profile: dbProfile || profileData,
        lawyer: lawyerRecord,
      });

    } catch (err: any) {
      console.error("Signup endpoint exception:", err);
      return res.status(500).json({ error: err.message || "Server signup failed." });
    }
  });

  // Secure Groq Speech-to-Text Transcription Endpoint (Whisper Large v3)
  app.post("/api/groq/transcribe", async (req, res) => {
    const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!groqKey) {
      return res.status(500).json({ error: "Groq API key not configured on server" });
    }

    try {
      const { audioBase64, mimeType = "audio/webm", language = "hi" } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: "Missing audioBase64 data" });
      }

      // Clean base64 string if data URL prefix exists
      const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
      const audioBuffer = Buffer.from(cleanBase64, "base64");

      if (audioBuffer.length === 0) {
        return res.status(400).json({ error: "Audio data is empty" });
      }

      const audioBlob = new Blob([audioBuffer], { type: mimeType });
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-large-v3-turbo");
      
      if (language === "hi" || language === "hinglish") {
        formData.append("language", "hi");
        formData.append("prompt", "Mera Wakeel AI legal consultation Hindi Hinglish text.");
      } else if (language === "en") {
        formData.append("language", "en");
      }

      let response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        // Fallback to whisper-large-v3 if turbo isn't available
        const formDataV3 = new FormData();
        formDataV3.append("file", audioBlob, "audio.webm");
        formDataV3.append("model", "whisper-large-v3");
        if (language === "hi" || language === "hinglish") {
          formDataV3.append("language", "hi");
        } else if (language === "en") {
          formDataV3.append("language", "en");
        }

        response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
          },
          body: formDataV3,
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        console.warn("Groq transcribe failed:", response.status, errText);
        return res.status(response.status).json({ error: errText });
      }

      const data = await response.json();
      return res.json({ text: data.text || "" });
    } catch (err: any) {
      console.error("Groq transcribe endpoint error:", err);
      return res.status(500).json({ error: err.message || "Failed to transcribe audio" });
    }
  });

  // RAG Vector Embedding Endpoint
  app.post("/api/rag/embed", async (req, res) => {
    try {
      const { text = "" } = req.body;
      const vec = await generateVectorEmbedding(text);
      return res.json({ embedding: vec, dimension: vec.length });
    } catch (err: any) {
      console.error("RAG embed error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate embedding" });
    }
  });

  // RAG Insert Knowledge Base Chunk Endpoint
  app.post("/api/rag/insert", async (req, res) => {
    try {
      const { act_name, section_number, category = "other", content } = req.body;
      if (!act_name || !content) {
        return res.status(400).json({ error: "act_name and content are required" });
      }

      const textToEmbed = `${act_name} ${section_number || ""} ${content}`;
      const embedding = await generateVectorEmbedding(textToEmbed);

      let record: any = {
        id: crypto.randomUUID(),
        act_name: String(act_name).trim(),
        section_number: section_number ? String(section_number).trim() : null,
        category: category || "other",
        content: String(content).trim(),
        embedding,
      };

      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from("legal_knowledge_base")
          .insert(record)
          .select("*")
          .single();

        if (!error && data) {
          record = data;
        } else if (error) {
          console.warn("Supabase admin insert legal_knowledge_base error:", error.message);
        }
      }

      return res.json({ success: true, chunk: record });
    } catch (err: any) {
      console.error("RAG insert error:", err);
      return res.status(500).json({ error: err.message || "Failed to insert knowledge chunk" });
    }
  });

  // Secure Groq AI API Proxy route
  app.post("/api/groq", async (req, res) => {
    const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!groqKey) {
      return res.status(500).json({ error: "Groq API key not configured on server" });
    }

    try {
      const { messages, model = "openai/gpt-oss-120b", temperature = 0.5 } = req.body;

      let response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
        }),
      });

      if (!response.ok && model === "openai/gpt-oss-120b") {
        response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            temperature,
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: errorText });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error("Groq proxy error:", err);
      return res.status(500).json({ error: err.message || "Failed to process request" });
    }
  });

  // Pure Chat & Document Vision Endpoint (Gemini 3.6 Flash + Llama 3.3 70b fallback) [Senior Lawyer Persona]
  async function handleChatRequest(req: express.Request, res: express.Response) {
    try {
      const { prompt = "", history = [], language = "hi", file, isCallMode = false, factsBlock = "", ragContext = "" } = req.body;

      let languageInstructions = "";
      if (language === "en") {
        languageInstructions = `CRITICAL LANGUAGE RULE: The user requested English. Respond in clear, polite, natural ENGLISH. Speak as a caring, wise, experienced senior Indian lawyer guiding a client as Sir or Ma'am. NEVER address the user as 'beta', 'bachha', or 'child'.`;
      } else if (language === "hinglish") {
        languageInstructions = `CRITICAL LANGUAGE RULE: The user requested Hinglish. Respond in natural HINGLISH (Hindi written in Roman/English script, e.g., "Aapki problem main samajh gayi Sir, ghabrao mat, milkar dekhte hain."). Address the user respectfully as Sir or Ma'am. NEVER address the user as 'beta', 'bachha', or 'child'.`;
      } else {
        languageInstructions = `CRITICAL LANGUAGE RULE (PRIMARY DEFAULT - MANDATORY HINDI):
By default, you MUST write your reply in natural, fluent, respectful HINDI in Devanagari script (देवनागरी हिंदी), e.g. "नमस्ते सर, आपकी समस्या मैं समझती हूँ, बिल्कुल चिंता न करें।".
You are a FEMALE legal advisor with a female voice, so ALWAYS use feminine self-verb forms: "मैं समझती हूँ" (never "समझता हूँ"), "मैं कर रही हूँ" (never "कर रहा हूँ"), "मैं बता रही हूँ" (never "बता रहा हूँ"), "मैं मदद कर सकती हूँ" (never "कर सकता हूँ").
If the user writes in English or asks to speak in English ("speak in english", "reply in english"), respond in English.
If the user writes in Hinglish, respond in Hinglish or Hindi.
Otherwise, ALWAYS write in pure Devanagari Hindi. NEVER address the user as 'beta', 'bachha', or 'child'.`;
      }

      let systemPrompt = buildLegalSystemPrompt(languageInstructions, isCallMode);

      if (factsBlock && factsBlock.trim()) {
        systemPrompt += `\n\n${factsBlock.trim()}\n\nCRITICAL CONTEXT RULE: Never re-ask for any fact that already appears in the fact block above.`;
      }

      if (ragContext && typeof ragContext === "string" && ragContext.trim()) {
        systemPrompt += `\n\n${ragContext.trim()}`;
      }

      // Handle File / Document Analysis Requests (Fast Path)
      if (file && file.data) {
        let mimeType = file.mimeType || "image/jpeg";
        if (!mimeType.includes("/")) mimeType = `image/${mimeType}`;
        let cleanData = String(file.data);
        if (cleanData.includes(";base64,")) {
          cleanData = cleanData.split(";base64,")[1];
        }

        // Targeted, lightweight system prompt for document OCR analysis to maximize speed
        const documentSystemPrompt = "You are an expert Indian Legal Document Verifier and high-speed OCR extractor for Mera Wakeel AI. Analyze the image accurately and respond with exact structured fields.";

        // 1. PRIMARY PROVIDER: Gemini Flash Vision API (Fastest & Most Accurate)
        if (geminiApiKey) {
          try {
            console.log("Analyzing document with Gemini 3.6 Flash Vision API...");
            const replyText = await geminiGenerateContent({
              model: "gemini-3.6-flash",
              parts: [
                { inlineData: { mimeType, data: cleanData } },
                { text: prompt || "Analyze this document and extract all legal details." },
              ],
              systemInstruction: documentSystemPrompt,
              temperature: 0.1,
            });
            if (replyText && replyText.trim()) {
              return res.json({ text: replyText.trim() });
            }
          } catch (geminiErr: any) {
            console.warn("Gemini 3.6 Flash vision error, attempting fallback:", geminiErr?.message || geminiErr);
            try {
              const replyTextFB = await geminiGenerateContent({
                model: "gemini-flash-latest",
                parts: [
                  { inlineData: { mimeType, data: cleanData } },
                  { text: prompt || "Analyze this document and extract all legal details." },
                ],
                systemInstruction: documentSystemPrompt,
                temperature: 0.1,
              });
              if (replyTextFB && replyTextFB.trim()) {
                return res.json({ text: replyTextFB.trim() });
              }
            } catch (fbErr) {
              console.warn("Gemini fallback vision error:", fbErr);
            }
          }
        }

        // 2. FALLBACK PROVIDER: Groq Llama 3.2 Vision (Fast 11b Multimodal Model)
        const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
        if (groqKey) {
          try {
            const visionMessages: any[] = [
              { role: "system", content: documentSystemPrompt },
              {
                role: "user",
                content: [
                  { type: "text", text: prompt || "Ye document/image dekho aur mujhe samjhao ki ye kya hai." },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${cleanData}`,
                    },
                  },
                ],
              },
            ];

            let visionRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model: "llama-4-scout-17b-16e-instruct",
                messages: visionMessages,
                temperature: 0.1,
                max_tokens: 1024,
              }),
            });

            if (visionRes.ok) {
              const vData = await visionRes.json();
              let replyText = vData.choices?.[0]?.message?.content || "";
              replyText = replyText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
              if (replyText) {
                return res.json({ text: replyText });
              }
            } else {
              const errBody = await visionRes.text();
              console.warn("Groq vision failed:", visionRes.status, errBody);
            }
          } catch (vErr: any) {
            console.warn("Groq vision exception:", vErr?.message || vErr);
          }
        }

        // CRITICAL: Document analysis failed or API key missing
        return res.status(503).json({
          error: "VISION_UNAVAILABLE",
          message: "Document vision analysis is temporarily unavailable. Please ensure GEMINI_API_KEY is configured in Settings > Secrets or .env file."
        });
      }

      // Handle Text-Only Chat Requests
      const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
      if (groqKey) {
        const messages: any[] = [
          { role: "system", content: systemPrompt },
        ];

        if (history && Array.isArray(history)) {
          history.forEach((h: any) => {
            messages.push({
              role: h.role === "user" ? "user" : "assistant",
              content: typeof h.content === "string" ? h.content : String(h.content || ""),
            });
          });
        }

        messages.push({
          role: "user",
          content: prompt || "Kripya kanooni sahayata pradan karein.",
        });

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            temperature: 0.5,
            max_tokens: 1024,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let replyText = data.choices?.[0]?.message?.content || "Maaf kijiye, response milne me dikkat aayi.";
          replyText = replyText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          return res.json({ text: replyText });
        }
      }

      let fallbackText = "नमस्ते सर/मैडम, थोड़ा समय दें। नेटवर्क में कुछ धीमापन है, मैं अभी आपकी बात फिर से देख रही हूँ।";
      if (language === "en") {
        fallbackText = "Hello Sir/Ma'am, please give me just a moment. Connection is a bit slow right now, I am looking into your matter.";
      } else if (language === "hinglish") {
        fallbackText = "Namaste Sir/Ma'am, thoda waqt dein. Connection thoda slow hai, main abhi aapki baat dobara dekh rahi hoon.";
      }
      return res.json({ text: fallbackText });

    } catch (err: any) {
      console.error("Chat Endpoint Error:", err);
      const lang = req.body?.language || "hi";
      let fallbackText = "नमस्ते सर/मैडम, थोड़ा समय दें। नेटवर्क में कुछ धीमापन है, मैं अभी आपकी बात फिर से देख रही हूँ।";
      if (lang === "en") {
        fallbackText = "Hello Sir/Ma'am, please give me just a moment. Connection is a bit slow right now, I am looking into your matter.";
      } else if (lang === "hinglish") {
        fallbackText = "Namaste Sir/Ma'am, thoda waqt dein. Connection thoda slow hai, main abhi aapki baat dobara dekh rahi hoon.";
      }
      return res.json({ text: fallbackText });
    }
  }

  app.post("/api/groq/chat", handleChatRequest);
  app.post("/api/gemini/chat", handleChatRequest);

  // Server-side TTS Cache for instant response on repeated text
  const ttsCache = new Map<string, { audio: string; mimeType: string }>();

  // Gemini Natural Voice TTS Handler
  const handleTtsRequest = async (req: express.Request, res: express.Response) => {
    try {
      const { text, language = "hi", voice = "Charon" } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required for TTS" });
      }

      // Clean text for speech synthesis
      const cleanText = String(text)
        .replace(/\[\[.*?\]\]/g, '')
        .replace(/Ye guidance sirf jaankari ke liye hai[^\.\n]*/gi, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[*_#`~/\\]/g, ' ')
        .replace(/^[\s\-*•\d\.\)]+/gm, '')
        .replace(/\b\d+\.\s*/g, ' ')
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        return res.json({ audio: null });
      }

      const cacheKey = `${cleanText}_${language}_${voice}`;
      if (ttsCache.has(cacheKey)) {
        const cached = ttsCache.get(cacheKey)!;
        return res.json({ audio: cached.audio, mimeType: cached.mimeType, cached: true });
      }

      // TTS: Google Natural Speech Stream (Gemini TTS disabled — Groq-only directive)
      const isDevanagari = /[\u0900-\u097F]/.test(cleanText);
      const targetLang = (language === "hi" || isDevanagari) ? "hi" : "en";
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText.slice(0, 300))}&tl=${targetLang}&client=tw-ob`;

      const ttsRes = await fetch(ttsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (ttsRes.ok) {
        const arrayBuf = await ttsRes.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuf).toString("base64");
        const mimeType = "audio/mp3";
        if (ttsCache.size > 300) {
          const firstKey = ttsCache.keys().next().value;
          if (firstKey) ttsCache.delete(firstKey);
        }
        ttsCache.set(cacheKey, { audio: base64Audio, mimeType });
        return res.json({ audio: base64Audio, mimeType });
      }

      return res.status(500).json({ error: "TTS generation failed" });
    } catch (err: any) {
      console.error("TTS Endpoint Error:", err);
      return res.status(500).json({ error: err.message || "TTS generation failed" });
    }
  };

  app.post("/api/tts", handleTtsRequest);
  app.post("/api/gemini/tts", handleTtsRequest);

  // Technical Judge Q&A Endpoint (Groq-powered)
  app.post("/api/judge-qa", async (req: express.Request, res: express.Response) => {
    try {
      const { question, slideContext = "General" } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
      const systemPrompt = `You are the lead full-stack developer and AI Architect of Mera Wakeel AI presenting to hackathon judges.
Answer technical questions concisely (2-4 sentences max), confidently, and accurately regarding the technical architecture, Indian legal framework integration (BNS, IPC, RAG indexing), AI hallucination prevention, data privacy, and the 2-sided legal marketplace model. Context slide: ${slideContext}`;

      if (groqKey) {
        try {
          const qaRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: question },
              ],
              temperature: 0.3,
              max_tokens: 512,
            }),
          });
          if (qaRes.ok) {
            const qaData = await qaRes.json();
            const answer = qaData.choices?.[0]?.message?.content || "";
            if (answer.trim()) {
              return res.json({ answer: answer.trim(), isFallback: false });
            }
          }
        } catch (e: any) {
          console.warn("Judge Q&A Groq error:", e?.message || e);
        }
      }

      // Static fallback
      return res.json({
        answer: "Mera Wakeel AI combines hybrid RAG vector search over Indian Statutes with Groq Llama 3.3 70b and strict legal grounding rules for reliable AI-powered legal assistance.",
        isFallback: true,
      });
    } catch (err: any) {
      console.error("Judge QA Endpoint Error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate judge response" });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mera Wakeel AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
