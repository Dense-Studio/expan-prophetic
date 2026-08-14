import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth.js";
import { errorMessage, methodNotAllowed, sendServerError } from "../../server/http.js";
import { getSupabaseAdmin } from "../../server/supabaseAdmin.js";

async function fetchAllRegistrations() {
  const supabase = getSupabaseAdmin();
  const registrations: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("expan_registrations").select("*")
      .order("created_at", { ascending: false }).order("id", { ascending: true }).range(from, from + 999);
    if (error) throw new Error(error.message);
    registrations.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return registrations;
}

async function fetchAllCheckIns() {
  const supabase = getSupabaseAdmin();
  const checkIns: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("expan_check_ins")
      .select("id, registration_id, event_key, phone_number, attendance_count, check_in_time")
      .order("check_in_time", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    checkIns.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return checkIns;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!req.method || !["GET", "PATCH", "DELETE"].includes(req.method)) {
    return methodNotAllowed(res, ["GET", "PATCH", "DELETE"]);
  }
  if (!requireAdmin(req, res, { mutation: req.method !== "GET" })) return;

  try {
    const supabase = getSupabaseAdmin();
    if (req.method === "GET") {
      if (req.query.view === "check-ins") {
        return res.status(200).json({ checkIns: await fetchAllCheckIns() });
      }
      return res.status(200).json({ registrations: await fetchAllRegistrations() });
    }

    const id = typeof req.body?.id === "string" ? req.body.id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "Invalid registration ID." });
    if (req.method === "DELETE") {
      const { error } = await supabase.from("expan_registrations").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return res.status(200).json({ deleted: true });
    }

    const updates = req.body?.updates;
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return res.status(400).json({ error: "Registration updates are required." });
    }
    const allowed = new Set([
      "first_name", "last_name", "phone_number", "location_name", "referral_source",
      "preferred_language", "expan_attendance_count", "is_student", "school", "event_key",
    ]);
    const safeUpdates = Object.fromEntries(Object.entries(updates).filter(([key]) => allowed.has(key)));
    const { data, error } = await supabase.from("expan_registrations").update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq("id", id).select("*").single();
    if (error) throw new Error(error.message);
    return res.status(200).json({ registration: data });
  } catch (error) {
    return sendServerError(res, error, errorMessage(error));
  }
}
