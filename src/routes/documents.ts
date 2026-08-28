import express from "express";
import type { ServerContext } from "./context";
import { renderDocument } from "../lib/documentTemplates";

export function registerDocumentsRoutes(app: express.Express, ctx: ServerContext): void {
  const { supabaseAdmin, serverEnsureProfile, trackAnalyticsEvent } = ctx;

  app.post("/api/documents/generate", async (req, res) => {
    try {
      const { template_key, values = {}, citizen_id = "guest_citizen", ai_polish = true } = req.body;
      if (!template_key) return res.status(400).json({ error: "template_key is required" });

      let rendered = "";
      try {
        rendered = renderDocument(template_key, values || {});
      } catch (templateErr: any) {
        return res.status(400).json({ error: templateErr.message });
      }

      let finalText = rendered;
      let title = `${template_key} - ${new Date().toLocaleDateString()}`;

      const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
      if (ai_polish && groqKey) {
        try {
          const polishPrompt = [
            { role: "system", content: "You are an expert Indian legal document drafter. Polish the following draft for Indian legal drafting conventions, correct grammar and clarity, keep all facts and placeholders intact (do NOT invent facts), and output only the polished document text with no commentary." },
            { role: "user", content: rendered },
          ];
          const polishRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqKey}`,
            },
            body: JSON.stringify({ model: "qwen/qwen3.6-27b", messages: polishPrompt, temperature: 0.2, max_tokens: 2000 }),
          });
          if (polishRes.ok) {
            const pData = await polishRes.json();
            const polished = pData.choices?.[0]?.message?.content;
            if (polished && typeof polished === "string" && polished.trim()) {
              finalText = polished.trim();
            }
          }
        } catch (pgErr: any) {
          console.warn("Document AI polish error (using raw template):", pgErr?.message || pgErr);
        }
      }

      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const lines = finalText.split("\n");
      const paragraphs = lines.map((ln: string) =>
        new Paragraph({ children: [new TextRun({ text: ln, size: 22, font: "Calibri" })] })
      );
      const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
      const buffer = Buffer.from(await Packer.toBuffer(doc));

      const base64 = buffer.toString("base64");
      const fileName = `${template_key.replace(/_/g, "-")}-${Date.now()}.docx`;

      let dbId: string | null = null;
      if (supabaseAdmin) {
        const dbCitizenId = await serverEnsureProfile(citizen_id);
        const rec = {
          id: crypto.randomUUID(),
          citizen_id: dbCitizenId,
          template_key: String(template_key),
          title,
          content: finalText,
          file_url: null,
          model: "qwen/qwen3.6-27b",
          created_at: new Date().toISOString(),
        };
        const { data } = await supabaseAdmin.from("generated_documents").insert(rec).select("id").single();
        if (data) dbId = data.id;
      }
      await trackAnalyticsEvent("document_generated", { template_key });

      return res.json({ success: true, docxBase64: base64, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName, text: finalText, documentId: dbId });
    } catch (err: any) {
      console.error("/api/documents/generate error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
}