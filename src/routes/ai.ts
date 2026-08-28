import express from "express";
import type { ServerContext } from "./context";
import { buildLegalSystemPrompt } from "../../legalPersona";
import { detectLanguageWithStats, languageInstructions as languageInstructionsFor } from "../lib/language";
import { buildCitationContext } from "../lib/legalCitations";
import { buildGovernmentAidContextBlock } from "../lib/govSchemes";
import { rankLawyersForCase, inferMatchCategory } from "../lib/db/lawyerMatch";

export function registerAiRoutes(app: express.Express, ctx: ServerContext): void {
  const { supabaseAdmin, geminiApiKey, geminiGenerateContent } = ctx;

  async function buildLawyerRecommendationBlock(caseText: string, category: string, excludedLawyerIds: string[] = []): Promise<string> {
    try {
      if (!supabaseAdmin) return '';
      const { data: lawyers } = await supabaseAdmin
        .from('lawyers')
        .select('*, profile:profiles(*)')
        .order('rating_avg', { ascending: false })
        .limit(30);
      const rows = (lawyers || []) as any[];
      if (!rows.length) return '';

      const suggestions = rankLawyersForCase(rows as any, {
        category,
        text: caseText,
        excludedLawyerIds,
      });
      const top = suggestions.slice(0, 5);
      const lines = top.map((s, i) => {
        const l = s.lawyer as any;
        const name = l.profile?.full_name || 'Advocate';
        const fee = l.consultation_fee_range || '₹1,000 - ₹2,000 / session';
        const city = l.profile?.city || '—';
        const exp = l.years_experience ? `${l.years_experience} yrs` : 'Experienced';
        const rating = l.rating_avg ? `★${Number(l.rating_avg).toFixed(1)}` : '';
        return `${i + 1}. Adv. ${name} (${(l.specialty || ['General']).join(', ')} | ${exp} | ${rating} | City: ${city} | Fee: ${fee})`;
      });

      return (
        'AVAILABLE VERIFIED ADVOCATES ON MERA WAKEEL AI (ranked best for THIS specific case, best match first):\n' +
        lines.join('\n') +
        '\n\nRULE: When recommending a lawyer, ONLY recommend advocates from this exact list by their full name, in this ranked order, never repeating an advocate already handling this case. If the user asks for more options, recommend the next advocates from the list. Do not invent advocates outside this list.'
      );
    } catch (err: any) {
      console.warn('[MERA-FIX] lawyer recommendation block error:', err?.message || err);
      return '';
    }
  }

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

  app.post("/api/rag/embed", async (req, res) => {
    try {
      const { text = "" } = req.body;
      const vec = await ctx.generateVectorEmbedding(text);
      return res.json({ embedding: vec, dimension: vec.length });
    } catch (err: any) {
      console.error("RAG embed error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate embedding" });
    }
  });

  app.post("/api/rag/insert", async (req, res) => {
    try {
      const { act_name, section_number, category = "other", content } = req.body;
      if (!act_name || !content) {
        return res.status(400).json({ error: "act_name and content are required" });
      }

      const textToEmbed = `${act_name} ${section_number || ""} ${content}`;
      const embedding = await ctx.generateVectorEmbedding(textToEmbed);

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
            model: "openai/gpt-oss-20b",
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

  async function handleChatRequest(req: express.Request, res: express.Response) {
    const requestStartedAt = Date.now();

    try {
      const {
        prompt = "",
        history = [],
        language = "hi",
        file,
        isCallMode = false,
        factsBlock = "",
        ragContext = "",
      } = req.body;

      // ---------------------------------------------------------
      // 1. Basic validation
      // ---------------------------------------------------------
      const cleanPrompt = String(prompt || "").trim();

      if (!cleanPrompt && !(file && file.data)) {
        return res.status(400).json({
          error: "Prompt is required",
        });
      }

      // ---------------------------------------------------------
      // 2. Detect language
      // ---------------------------------------------------------
      let detectedLanguage = language;

      try {
        const detection = detectLanguageWithStats(cleanPrompt);

        if (cleanPrompt) {
          const confidence = detection.confidence || 0;

          detectedLanguage =
            confidence >= 0.5
              ? detection.language
              : language;
        }
      } catch (error) {
        console.warn(
          "[AI] Language detection failed:",
          error
        );
      }

      const languageInstructions =
        languageInstructionsFor(detectedLanguage);

      // ---------------------------------------------------------
      // 3. Build legal context
      // ---------------------------------------------------------
      let citationContext = "";

      try {
        citationContext = buildCitationContext(
          cleanPrompt,
          6
        );
      } catch (error) {
        console.warn(
          "[AI] Citation context failed:",
          error
        );
      }

      let govAidContext = "";

      try {
        govAidContext =
          buildGovernmentAidContextBlock(cleanPrompt);
      } catch (error) {
        console.warn(
          "[AI] Government aid context failed:",
          error
        );
      }

      let systemPrompt = buildLegalSystemPrompt(
        languageInstructions,
        isCallMode
      );

      if (citationContext.trim()) {
        systemPrompt += `\n\n${citationContext.trim()}`;
      }

      if (govAidContext.trim()) {
        systemPrompt += `\n\n${govAidContext.trim()}`;
      }

      if (
        typeof factsBlock === "string" &&
        factsBlock.trim()
      ) {
        systemPrompt +=
          `\n\n${factsBlock.trim()}` +
          `\n\nCRITICAL CONTEXT RULE: ` +
          `Never re-ask for any fact that already appears ` +
          `in the fact block above.`;
      }

      if (
        typeof ragContext === "string" &&
        ragContext.trim()
      ) {
        systemPrompt += `\n\n${ragContext.trim()}`;
      }

      // ---------------------------------------------------------
      // 4. Lawyer recommendation
      //
      // Do NOT query Supabase for every normal message.
      // Only query when the conversation actually appears to
      // require a lawyer recommendation.
      // ---------------------------------------------------------
      const lawyerIntentRegex =
        /\b(lawyer|advocate|vakil|wakeel|vakeel|attorney|hire|connect|recommend|lawyer chahiye|vakil chahiye|wakeel chahiye|advocate chahiye)\b/i;

      const shouldLoadLawyers =
        lawyerIntentRegex.test(cleanPrompt);

      if (shouldLoadLawyers) {
        try {
          const lastAssistant =
            Array.isArray(history)
              ? [...history]
                  .reverse()
                  .find(
                    (item: any) =>
                      item?.role === "assistant"
                  )?.content || ""
              : "";

          const caseText =
            `${cleanPrompt} ${lastAssistant}`.trim();

          const caseCategory =
            String(
              req.body?.caseCategory ||
                req.body?.category ||
                ""
            ) || inferMatchCategory(caseText);

          const excludedLawyerIds =
            Array.isArray(
              req.body?.excludedLawyerIds
            )
              ? req.body.excludedLawyerIds
              : [];

          const lawyerStartedAt = Date.now();

          const lawyerBlock =
            await buildLawyerRecommendationBlock(
              caseText,
              caseCategory,
              excludedLawyerIds
            );

          console.log(
            `[AI] Lawyer lookup: ${
              Date.now() - lawyerStartedAt
            }ms`
          );

          if (lawyerBlock) {
            systemPrompt += `\n\n${lawyerBlock}`;
          }
        } catch (error: any) {
          console.warn(
            "[AI] Lawyer recommendation failed:",
            error?.message || error
          );
        }
      }

      // ---------------------------------------------------------
      // 5. Document / image analysis
      // ---------------------------------------------------------
      if (file && file.data) {
        let mimeType =
          file.mimeType || "image/jpeg";

        if (!mimeType.includes("/")) {
          mimeType = `image/${mimeType}`;
        }

        let cleanData = String(file.data);

        if (cleanData.includes(";base64,")) {
          cleanData =
            cleanData.split(";base64,")[1];
        }

        const documentSystemPrompt =
          "You are an expert Indian Legal Document Verifier " +
          "and high-speed OCR extractor for Mera Wakeel AI. " +
          "Analyze the image accurately and respond with " +
          "exact structured fields.";

        // Gemini primary
        if (geminiApiKey) {
          try {
            console.log(
              "[AI] Analyzing document with Gemini..."
            );

            const replyText =
              await geminiGenerateContent({
                model: "gemini-3.6-flash",
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: cleanData,
                    },
                  },
                  {
                    text:
                      cleanPrompt ||
                      "Analyze this document and extract all legal details.",
                  },
                ],
                systemInstruction:
                  documentSystemPrompt,
                temperature: 0.1,
              });

            if (replyText?.trim()) {
              console.log(
                `[AI] Document completed in ${
                  Date.now() - requestStartedAt
                }ms`
              );

              return res.json({
                text: replyText.trim(),
                provider: "gemini",
              });
            }
          } catch (error: any) {
            console.warn(
              "[AI] Gemini primary vision failed:",
              error?.message || error
            );

            // Gemini fallback
            try {
              const fallbackReply =
                await geminiGenerateContent({
                  model: "gemini-flash-latest",
                  parts: [
                    {
                      inlineData: {
                        mimeType,
                        data: cleanData,
                      },
                    },
                    {
                      text:
                        cleanPrompt ||
                        "Analyze this document and extract all legal details.",
                    },
                  ],
                  systemInstruction:
                    documentSystemPrompt,
                  temperature: 0.1,
                });

              if (fallbackReply?.trim()) {
                return res.json({
                  text: fallbackReply.trim(),
                  provider: "gemini-fallback",
                });
              }
            } catch (fallbackError: any) {
              console.warn(
                "[AI] Gemini fallback failed:",
                fallbackError?.message ||
                  fallbackError
              );
            }
          }
        }

        // Groq vision fallback
        const groqKey =
          process.env.GROQ_API_KEY ||
          process.env.VITE_GROQ_API_KEY;

        if (groqKey) {
          try {
            const visionMessages: any[] = [
              {
                role: "system",
                content: documentSystemPrompt,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      cleanPrompt ||
                      "Analyze this legal document.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url:
                        `data:${mimeType};base64,` +
                        cleanData,
                    },
                  },
                ],
              },
            ];

            const visionResponse = await fetch(
              "https://api.groq.com/openai/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                  Authorization:
                    `Bearer ${groqKey}`,
                },
                body: JSON.stringify({
                  model: "qwen/qwen3.6-27b",
                  messages: visionMessages,
                  temperature: 0.1,
                  max_tokens: 1024,
                }),
              }
            );

            if (visionResponse.ok) {
              const data =
                await visionResponse.json();

              let replyText =
                data.choices?.[0]?.message
                  ?.content || "";

              replyText = replyText
                .replace(
                  /<think>[\s\S]*?<\/think>/gi,
                  ""
                )
                .trim();

              if (replyText) {
                return res.json({
                  text: replyText,
                  provider: "groq-vision",
                });
              }
            } else {
              const errorBody =
                await visionResponse.text();

              console.error(
                "[AI] Groq vision error:",
                visionResponse.status,
                errorBody
              );
            }
          } catch (error: any) {
            console.error(
              "[AI] Groq vision exception:",
              error?.message || error
            );
          }
        }

        return res.status(503).json({
          error: "VISION_UNAVAILABLE",
          message:
            "Document analysis is temporarily unavailable.",
        });
      }

      // ---------------------------------------------------------
      // 6. Normal AI legal chat
      // ---------------------------------------------------------
      const groqKey =
        process.env.GROQ_API_KEY ||
        process.env.VITE_GROQ_API_KEY;

      if (!groqKey) {
        console.error(
          "[AI] GROQ_API_KEY is not configured."
        );

        return res.status(503).json({
          error: "AI_NOT_CONFIGURED",
          message:
            "AI service is not configured on the server.",
        });
      }

      const messages: any[] = [
        {
          role: "system",
          content: systemPrompt,
        },
      ];

      // ---------------------------------------------------------
      // 7. Limit conversation history
      //
      // Sending unlimited history makes requests larger and
      // slower as the consultation grows.
      // ---------------------------------------------------------
      const HISTORY_LIMIT = 12;

      const safeHistory =
        Array.isArray(history)
          ? history.slice(-HISTORY_LIMIT)
          : [];

      safeHistory.forEach((item: any) => {
        const content =
          typeof item?.content === "string"
            ? item.content.trim()
            : String(
                item?.content || ""
              ).trim();

        if (!content) {
          return;
        }

        messages.push({
          role:
            item?.role === "user"
              ? "user"
              : "assistant",
          content,
        });
      });

      messages.push({
        role: "user",
        content:
          cleanPrompt ||
          "Please provide legal assistance.",
      });

      // ---------------------------------------------------------
      // 8. Groq request helper with timeout
      // ---------------------------------------------------------
      const callGroq = async (
        model: string
      ) => {
        const controller =
          new AbortController();

        // Prevent a request from hanging indefinitely.
        const timeout = setTimeout(
          () => controller.abort(),
          30000
        );

        const startedAt = Date.now();

        try {
          const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${groqKey}`,
              },
              signal: controller.signal,
              body: JSON.stringify({
                model,
                messages,
                temperature: 0.5,
                max_tokens: 1024,
              }),
            }
          );

          const duration =
            Date.now() - startedAt;

          console.log(
            `[AI] Groq ${model}: ` +
              `${response.status} (${duration}ms)`
          );

          return response;
        } finally {
          clearTimeout(timeout);
        }
      };

      // ---------------------------------------------------------
      // 9. Primary model
      // ---------------------------------------------------------
      let response: Response | null = null;

      try {
        response = await callGroq(
          "openai/gpt-oss-120b"
        );
      } catch (error: any) {
        console.error(
          "[AI] Primary model request failed:",
          error?.name,
          error?.message || error
        );
      }

      // ---------------------------------------------------------
      // 10. Primary response
      // ---------------------------------------------------------
      if (response?.ok) {
        const data = await response.json();

        let replyText =
          data.choices?.[0]?.message?.content ||
          "";

        replyText = replyText
          .replace(
            /<think>[\s\S]*?<\/think>/gi,
            ""
          )
          .trim();

        if (replyText) {
          console.log(
            `[AI] Request completed in ${
              Date.now() - requestStartedAt
            }ms using GPT-OSS 120B`
          );

          return res.json({
            text: replyText,
            detectedLanguage,
            model: "openai/gpt-oss-120b",
            fallback: false,
          });
        }
      }

      // ---------------------------------------------------------
      // 11. Log actual primary error
      // ---------------------------------------------------------
      if (response && !response.ok) {
        try {
          const errorText =
            await response.text();

          console.error(
            "[AI] GPT-OSS 120B failed:",
            response.status,
            errorText
          );
        } catch (_) {
          console.error(
            "[AI] GPT-OSS 120B failed:",
            response.status
          );
        }
      }

      // ---------------------------------------------------------
      // 12. Fallback model
      // ---------------------------------------------------------
      console.warn(
        "[AI] Trying GPT-OSS 20B fallback..."
      );

      let fallbackResponse: Response | null =
        null;

      try {
        fallbackResponse = await callGroq(
          "openai/gpt-oss-20b"
        );
      } catch (error: any) {
        console.error(
          "[AI] Fallback model request failed:",
          error?.name,
          error?.message || error
        );
      }

      if (fallbackResponse?.ok) {
        const data =
          await fallbackResponse.json();

        let replyText =
          data.choices?.[0]?.message?.content ||
          "";

        replyText = replyText
          .replace(
            /<think>[\s\S]*?<\/think>/gi,
            ""
          )
          .trim();

        if (replyText) {
          console.log(
            `[AI] Request completed in ${
              Date.now() - requestStartedAt
            }ms using GPT-OSS 20B fallback`
          );

          return res.json({
            text: replyText,
            detectedLanguage,
            model: "openai/gpt-oss-20b",
            fallback: true,
          });
        }
      }

      if (
        fallbackResponse &&
        !fallbackResponse.ok
      ) {
        try {
          const errorText =
            await fallbackResponse.text();

          console.error(
            "[AI] GPT-OSS 20B failed:",
            fallbackResponse.status,
            errorText
          );
        } catch (_) {
          console.error(
            "[AI] GPT-OSS 20B failed:",
            fallbackResponse.status
          );
        }
      }

      // ---------------------------------------------------------
      // 13. Both models failed
      //
      // Do not pretend that the user's internet is slow.
      // ---------------------------------------------------------
      return res.status(503).json({
        error: "AI_SERVICE_UNAVAILABLE",
        message:
          detectedLanguage === "en"
            ? "AI service is temporarily unavailable. Please try again."
            : detectedLanguage === "hinglish"
            ? "AI service abhi temporarily unavailable hai. Please thodi der baad try karein."
            : "AI सेवा अभी अस्थायी रूप से उपलब्ध नहीं है। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
      });
    } catch (error: any) {
      console.error(
        "[AI] Chat endpoint error:",
        error?.stack ||
          error?.message ||
          error
      );

      return res.status(500).json({
        error: "CHAT_REQUEST_FAILED",
        message:
          "Unable to process the AI request at this time.",
      });
    }
  }

  const ttsCache = new Map<string, { audio: string; mimeType: string }>();

  const handleTtsRequest = async (req: express.Request, res: express.Response) => {
    try {
      const { text, language = "hi", voice = "Charon" } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required for TTS" });
      }

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

      const isDevanagari = /[\u0900-\u097F]/.test(cleanText);
      const targetLang = (language === "hi" || isDevanagari) ? "hi" : "en";
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText.slice(0, 300))}&tl=${targetLang}&client=tw-ob`;

      const ttsRes = await fetch(ttsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(5000),
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

      console.warn("[TTS] Google Translate TTS failed:", ttsRes.status);
      return res.status(500).json({ error: "TTS generation failed" });
    } catch (err: any) {
      console.error("TTS Endpoint Error:", err);
      return res.status(500).json({ error: err.message || "TTS generation failed" });
    }
  };

  app.post("/api/groq/chat", handleChatRequest);
  app.post("/api/gemini/chat", handleChatRequest);
  app.post("/api/tts", handleTtsRequest);
  app.post("/api/gemini/tts", handleTtsRequest);

  // ─── STREAMING CHAT ENDPOINT (for AI Call — sentence-by-sentence TTS) ───
  app.post("/api/gemini/chat/stream", async (req: express.Request, res: express.Response) => {
    try {
      const { prompt = "", history = [], language = "hi", isCallMode = false, factsBlock = "", ragContext = "" } = req.body;

      const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
      if (!groqKey) {
        return res.status(500).json({ error: "Groq API key not configured" });
      }

      let detectedLanguage = language;
      try {
        const detection = detectLanguageWithStats(prompt || "");
        if (prompt && prompt.trim()) {
          const conf = detection.confidence || 0;
          detectedLanguage = conf >= 0.5 ? detection.language : language;
        }
      } catch (_e) {}

      const languageInstructions = languageInstructionsFor(detectedLanguage);
      let systemPrompt = buildLegalSystemPrompt(languageInstructions, isCallMode);

      if (factsBlock && factsBlock.trim()) {
        systemPrompt += `\n\n${factsBlock.trim()}\n\nCRITICAL CONTEXT RULE: Never re-ask for any fact that already appears in the fact block above.`;
      }
      if (ragContext && typeof ragContext === "string" && ragContext.trim()) {
        systemPrompt += `\n\n${ragContext.trim()}`;
      }

      const messages: any[] = [{ role: "system", content: systemPrompt }];
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          messages.push({
            role: h.role === "user" ? "user" : "assistant",
            content: typeof h.content === "string" ? h.content : String(h.content || ""),
          });
        });
      }
      messages.push({ role: "user", content: prompt || "Kripya kanooni sahayata pradan karein." });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages,
          temperature: 0.5,
          max_tokens: 1024,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        res.write(`data: ${JSON.stringify({ error: errText })}\n\n`);
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                res.write(`data: ${JSON.stringify({ token: delta, done: false })}\n\n`);
              }
            } catch (_e) {}
          }
        }
      }

      const cleaned = fullText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      res.write(`data: ${JSON.stringify({ text: cleaned, done: true })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      console.error("Streaming chat error:", err);
      try {
        res.write(`data: ${JSON.stringify({ error: err.message || "Stream failed" })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (_e) {}
    }
  });

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
              model: "openai/gpt-oss-120b",
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

      return res.json({
        answer: "Mera Wakeel AI combines hybrid RAG vector search over Indian Statutes with Groq GPT-OSS 120B and strict legal grounding rules for reliable AI-powered legal assistance.",
        isFallback: true,
      });
    } catch (err: any) {
      console.error("Judge QA Endpoint Error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate judge response" });
    }
  });
}
