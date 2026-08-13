import express from "express";
import type { ServerContext } from "./context";

export function registerAdminRoutes(app: express.Express, ctx: ServerContext): void {
  const { supabaseAdmin, isUuid, toUuid, trackAnalyticsEvent } = ctx;

  app.post("/api/admin/lawyers/:id/verify", async (req, res) => {
    try {
      const adminKey = process.env.ADMIN_API_KEY;
      const presented = req.headers["x-admin-key"] || req.headers["authorization"];
      const presentedKey = Array.isArray(presented) ? presented[0] : (String(presented || "").replace(/^Bearer\s+/i, ""));
      if (!adminKey || String(presentedKey) !== String(adminKey)) {
        return res.status(403).json({ error: "Forbidden: missing or invalid admin API key" });
      }

      const { verification_status = "verified" } = req.body;
      const validStates = ["pending", "verified", "rejected"];
      if (!validStates.includes(verification_status)) {
        return res.status(400).json({ error: `verification_status must be one of ${validStates.join(", ")}` });
      }

      const lawyerId = req.params.id;
      const dbLawyerId = isUuid(lawyerId) ? lawyerId : toUuid(lawyerId);
      if (!isUuid(dbLawyerId)) return res.status(400).json({ error: "Invalid lawyer id" });

      if (!supabaseAdmin) return res.status(503).json({ error: "Database not configured" });

      const verified = verification_status === "verified";
      const updateData: any = {
        verification_status,
        is_verified: verified,
        verified_at: verified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from("lawyers")
        .update(updateData)
        .eq("id", dbLawyerId)
        .select("*")
        .single();

      if (error) throw error;
      await trackAnalyticsEvent("lawyer_verified", { lawyer_id: dbLawyerId, verification_status });
      return res.json({ success: true, lawyer: data });
    } catch (err: any) {
      console.error("/api/admin/lawyers/:id/verify error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
}