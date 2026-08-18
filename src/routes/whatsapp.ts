import express from "express";
import type { ServerContext } from "./context";
import { buildLegalSystemPrompt } from "../../legalPersona";
import { detectLanguageWithStats, languageInstructions as languageInstructionsFor } from "../lib/language";
import { buildCitationContext } from "../lib/legalCitations";
import { buildGovernmentAidContextBlock } from "../lib/govSchemes";

export function registerWhatsappRoutes(app: express.Express, ctx: ServerContext): void {
  const { supabaseAdmin, escapeXml, requestLogger, trackAnalyticsEvent, detectedLangForLog } = ctx;

  app.post("/api/webhooks/whatsapp", async (req, res) => {
    try {
      const body: any = req.body || {};
      const from = String(body.From || body.from || "").replace(/\D/g, "");
      const toNumber = String(body.To || body.To || "").replace(/\D/g, "");
      const messageBody = String(body.Body || body.body || "").trim();

      if (!from || !messageBody) {
        return res.status(200).send("OK");
      }

      let replyText = "";
      try {
        const detection = detectLanguageWithStats(messageBody || "");
        const lang = (detection.confidence || 0) >= 0.5 ? detection.language : "hi";
        const langInstructions = languageInstructionsFor(lang);
        let systemPrompt = buildLegalSystemPrompt(langInstructions, false);
        systemPrompt += `\n\n${buildCitationContext(messageBody || "", 6)}`;
        systemPrompt += `\n\n${buildGovernmentAidContextBlock(messageBody || "")}`;

        const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
        if (!groqKey) {
          replyText = "Kripya thodi der baad dobara koshish karein. Service abhi temporarily unavailable hai.";
        } else {
          const gm = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: messageBody },
              ],
              temperature: 0.5,
              max_tokens: 1024,
            }),
          });
          if (gm.ok) {
            const gd = await gm.json();
            replyText = (gd.choices?.[0]?.message?.content || "").replace(/ thinking[\s\S]*?<\/think>/gi, '').trim();
          } else {
            requestLogger("whatsapp", `groq error ${gm.status}`);
          }
        }
      } catch (aiErr: any) {
        console.error("WhatsApp AI pipeline error:", aiErr?.message || aiErr);
      }

      if (!replyText) {
        replyText = "Namaste Sir/Ma'am, is waqt kuch technical dikkat ho rahi hai. Kripya thodi der baad dobara likhein ya Mera Wakeel AI app par baat karein.";
      }

      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_FROM_NUMBER;

      if (twilioSid && twilioToken && twilioFrom && toNumber) {
        try {
          const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
          const form = new URLSearchParams();
          form.set("From", `whatsapp:${twilioFrom.startsWith("+") ? twilioFrom : "+" + twilioFrom}`);
          form.set("To", `whatsapp:+${from}`);
          form.set("Body", replyText);
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: "POST",
            headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: form.toString(),
          });
        } catch (twErr: any) {
          console.error("Twilio send error:", twErr?.message || twErr);
        }
      } else {
        return res.status(200).set("Content-Type", "text/xml").send(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(replyText)}</Message></Response>`
        );
      }

      if (supabaseAdmin && from) {
        try {
          const { data: existing } = await supabaseAdmin.from("whatsapp_sessions").select("*").eq("phone", from).maybeSingle();
          const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("phone", from).maybeSingle();
          if (existing) {
            await supabaseAdmin.from("whatsapp_sessions").update({ last_message: messageBody, updated_at: new Date().toISOString(), citizen_id: profile?.id ?? existing.citizen_id, is_guest: !profile }).eq("phone", from);
          } else {
            await supabaseAdmin.from("whatsapp_sessions").insert({
              id: crypto.randomUUID(), phone: from, citizen_id: profile?.id ?? null,
              is_guest: !profile, last_message: messageBody, updated_at: new Date().toISOString(),
            });
          }
        } catch (sessErr: any) {
          console.warn("WhatsApp session mapping error:", sessErr?.message || sessErr);
        }
      }

      await trackAnalyticsEvent("whatsapp_message", { from, language: detectedLangForLog(req) });
      return res.status(200).set("Content-Type", "text/xml").send(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(replyText)}</Message></Response>`
      );
    } catch (err: any) {
      console.error("/api/webhooks/whatsapp error:", err?.message || err);
      return res.status(200).send("OK");
    }
  });
}