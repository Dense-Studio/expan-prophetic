import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth.js";
import { errorMessage, methodNotAllowed, sendServerError } from "../../server/http.js";
import { getSupabaseAdmin } from "../../server/supabaseAdmin.js";

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
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  if (!requireAdmin(req, res)) return;

  try {
    return res.status(200).json({ checkIns: await fetchAllCheckIns() });
  } catch (error) {
    return sendServerError(res, error, errorMessage(error));
  }
}
