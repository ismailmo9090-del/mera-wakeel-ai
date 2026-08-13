import express from "express";
import type { ServerContext } from "./context";
import { detectLanguageWithStats } from "../lib/language";

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

export function registerDbRoutes(app: express.Express, ctx: ServerContext): void {
  const { supabaseAdmin, isUuid, toUuid, serverEnsureProfile, serverEnsureCase, GUEST_PROFILE_ID } = ctx;

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

  app.post("/api/db/messages/save", async (req, res) => {
    try {
      const { case_id, sender_type, content, message_type = 'text', citizen_id = 'guest_citizen', language: providedLanguage } = req.body;
      if (!case_id || !content) return res.status(400).json({ error: "case_id and content are required" });

      let detectedLang = providedLanguage || "hi";
      if (!providedLanguage) {
        try {
          const det = detectLanguageWithStats(String(content).trim());
          detectedLang = (det.confidence || 0) >= 0.5 ? det.language : detectedLang;
        } catch (_e) { /* keep default */ }
      }

      if (supabaseAdmin) {
        const dbCaseId = await serverEnsureCase(case_id, citizen_id);
        const msgObj = {
          id: crypto.randomUUID(),
          case_id: dbCaseId,
          sender_type: sender_type === 'user' ? 'user' : 'ai',
          content: String(content).trim(),
          message_type: message_type || 'text',
          language: detectedLang,
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
          return res.status(500).json({ success: false, error: error.message });
        }
        return res.json({ success: true, message: msgObj });
      }

      return res.json({ success: true, message: { id: crypto.randomUUID(), case_id, sender_type, content, message_type, language: detectedLang, created_at: new Date().toISOString() } });
    } catch (err: any) {
      console.error("/api/db/messages/save error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

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

      return res.json({ success: true, cases: data || [] });
    } catch (err: any) {
      console.warn("/api/db/cases GET exception:", err.message);
      return res.json({ success: false, cases: [] });
    }
  });

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

  app.post("/api/db/documents/save", async (req, res) => {
    try {
      const { id, case_id, file_url, document_type, ai_extracted_text, ai_summary, ai_analysis, is_verified, is_verified_valid, citizen_id } = req.body;
      if (!case_id) return res.status(400).json({ error: "case_id required" });

      const docId = id ? toUuid(id) : crypto.randomUUID();
      const dbCaseId = toUuid(case_id);

      if (supabaseAdmin) {
        const resolvedCaseId = await serverEnsureCase(case_id, citizen_id || 'guest_citizen');

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

  app.get("/api/db/lawyers", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.json({ success: false, lawyers: [] });

      const { data } = await supabaseAdmin
        .from('lawyers')
        .select('*, profile:profiles(*)')
        .order('rating_avg', { ascending: false });

      const lawyersWithReviews = (data || []).map((lawyer: any) => ({ ...lawyer, review_count: 0 }));
      if (data && data.length > 0) {
        const { data: reviewRows } = await supabaseAdmin
          .from('reviews')
          .select('lawyer_id')
          .in('lawyer_id', data.map((l: any) => l.id));
        if (reviewRows && reviewRows.length > 0) {
          const counts: Record<string, number> = {};
          reviewRows.forEach((r: any) => { counts[r.lawyer_id] = (counts[r.lawyer_id] || 0) + 1; });
          lawyersWithReviews.forEach((l: any) => { l.review_count = counts[l.id] || 0; });
        }
      }

      return res.json({ success: true, lawyers: lawyersWithReviews });
    } catch (err: any) {
      return res.json({ success: false, lawyers: [] });
    }
  });

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

      let { data: updatedLawyer, error } = await supabaseAdmin
        .from('lawyers')
        .update(updatePayload)
        .in('profile_id', targetIds)
        .select('*, profile:profiles(*)')
        .maybeSingle();

      if (!updatedLawyer) {
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

  app.get("/api/db/stats/trust", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.json({ success: true, stats: { total_consultations: 0, resolved_cases: 0, verified_lawyers: 0, avg_rating: 0, total_lawyers: 0 } });
      }
      const [{ count: consultations }, { count: resolved }, { data: lawyers }, { data: reviews }] = await Promise.all([
        supabaseAdmin.from("cases").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("cases").select("id", { count: "exact", head: true }).eq("status", "resolved").or("status.eq.closed,status.eq.resolved"),
        supabaseAdmin.from("lawyers").select("id, is_verified, verification_status"),
        supabaseAdmin.from("reviews").select("rating"),
      ]);

      const verifiedLawyers = (lawyers || []).filter((l: any) => l.is_verified === true || l.verification_status === "verified").length;
      const totalLawyers = (lawyers || []).length;
      const avgRating = reviews && reviews.length
        ? parseFloat((reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1))
        : 0;

      const stats = {
        total_consultations: consultations || 0,
        resolved_cases: (resolved as any)?.[0]?.count ?? 0,
        verified_lawyers: verifiedLawyers,
        total_lawyers: totalLawyers,
        avg_rating: avgRating,
      };
      return res.json({ success: true, stats });
    } catch (err: any) {
      console.error("/api/db/stats/trust error:", err);
      return res.json({ success: true, stats: { total_consultations: 0, resolved_cases: 0, verified_lawyers: 0, avg_rating: 0, total_lawyers: 0 } });
    }
  });

  app.get("/api/db/deadlines", async (req, res) => {
    try {
      const citizenId = String((req.query.citizenId as string) || req.query.citizen_id || "").trim() || undefined;
      const caseId = req.query.caseId as string | undefined;
      if (!citizenId && !caseId) return res.json({ success: true, deadlines: [] });
      if (!supabaseAdmin) return res.json({ success: true, deadlines: [] });

      let query = supabaseAdmin.from("case_deadlines").select("*, case:cases(id,title,status)");
      if (caseId) {
        const ids = Array.from(new Set([caseId, toUuid(caseId)].filter(isUuid)));
        query = query.in("case_id", ids);
      }
      if (citizenId && !caseId) {
        const ids = Array.from(new Set([citizenId, toUuid(citizenId)].filter(isUuid)));
        query = query.in("citizen_id", ids);
      }
      const { data, error } = await query.order("due_date", { ascending: true });
      if (error) throw error;
      return res.json({ success: true, deadlines: data || [] });
    } catch (err: any) {
      console.warn("/api/db/deadlines GET error:", err.message);
      return res.json({ success: true, deadlines: [] });
    }
  });

  app.post("/api/db/deadlines/save", async (req, res) => {
    try {
      const { case_id, caseId, citizen_id, citizenId = "guest_citizen", deadline_type, due_date, notes } = req.body;
      const targetCaseId = case_id || caseId;
      const targetCitizenId = citizen_id || citizenId;
      if (!targetCaseId || !deadline_type || !due_date) {
        return res.status(400).json({ error: "case_id, deadline_type, and due_date are required" });
      }
      const validTypes = ["hearing", "filing", "response"];
      if (!validTypes.includes(deadline_type)) {
        return res.status(400).json({ error: `deadline_type must be one of ${validTypes.join(", ")}` });
      }

      const dbCaseId = await serverEnsureCase(targetCaseId, targetCitizenId);
      const dbCitizenId = await serverEnsureProfile(targetCitizenId);

      const dlObj = {
        id: crypto.randomUUID(),
        case_id: dbCaseId,
        citizen_id: dbCitizenId,
        deadline_type: deadline_type,
        due_date: new Date(due_date).toISOString(),
        notes: notes || null,
        reminder_sent: false,
        created_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.from("case_deadlines").insert(dlObj).select("*").single();
        if (error) {
          console.warn("/api/db/deadlines/save insert error:", error.message);
          return res.status(500).json({ success: false, error: error.message });
        }
        if (data) return res.json({ success: true, deadline: data });
      }
      return res.json({ success: true, deadline: dlObj });
    } catch (err: any) {
      console.error("/api/db/deadlines/save error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/db/deadlines/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!isUuid(id)) return res.status(400).json({ error: "Invalid deadline id" });
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.from("case_deadlines").delete().eq("id", id);
        if (error) throw error;
      }
      return res.json({ success: true });
    } catch (err: any) {
      console.error("/api/db/deadlines DELETE error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
}