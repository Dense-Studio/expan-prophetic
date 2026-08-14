import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createAdminSessionCookie,
  getClientIpHash,
  hasTrustedOrigin,
  verifyAdminPassword,
} from "../../server/auth.js";
import { methodNotAllowed, sendServerError } from "../../server/http.js";
import { getSupabaseAdmin } from "../../server/supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  if (!hasTrustedOrigin(req)) return res.status(403).json({ error: "Request origin was not accepted." });

  try {
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const ipHash = getClientIpHash(req);
    const supabase = getSupabaseAdmin();
    const attemptResult = await supabase.from("admin_login_attempts").select("*").eq("ip_hash", ipHash).maybeSingle();
    if (attemptResult.error) throw new Error(`Login protection is not ready: ${attemptResult.error.message}`);

    const attempt = attemptResult.data as {
      attempt_count: number;
      window_started_at: string;
      locked_until: string | null;
    } | null;
    if (attempt?.locked_until && new Date(attempt.locked_until).getTime() > Date.now()) {
      return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
    }

    if (!verifyAdminPassword(password)) {
      const windowExpired = !attempt || Date.now() - new Date(attempt.window_started_at).getTime() >= 15 * 60_000;
      const attemptCount = windowExpired ? 1 : attempt.attempt_count + 1;
      const now = new Date().toISOString();
      const { error } = await supabase.from("admin_login_attempts").upsert({
        ip_hash: ipHash,
        attempt_count: attemptCount,
        window_started_at: windowExpired ? now : attempt?.window_started_at,
        locked_until: attemptCount >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null,
        updated_at: now,
      });
      if (error) throw new Error(error.message);
      return res.status(401).json({ error: "Incorrect password." });
    }

    await supabase.from("admin_login_attempts").delete().eq("ip_hash", ipHash);
    res.setHeader("Set-Cookie", createAdminSessionCookie());
    return res.status(200).json({ authenticated: true, expiresInSeconds: 8 * 60 * 60 });
  } catch (error) {
    return sendServerError(res, error);
  }
}
