import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EVENT } from "../lib/event.js";
import { normalizeGhanaPhone } from "../lib/smsEncoding.js";
import { sendTransactionalSms } from "../server/arkesel.js";
import { methodNotAllowed, sendServerError } from "../server/http.js";
import { eventWelcomeMessage } from "../server/messages.js";
import { getSupabaseAdmin } from "../server/supabaseAdmin.js";

const LANGUAGES = new Set(["English", "Twi", "Fante", "Ga", "Ewe"]);

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  try {
    if (!EVENT.forceAccessOpenForTesting && Date.now() < new Date(EVENT.registrationOpensAt).getTime()) {
      return res.status(403).json({ error: `Registration opens on ${EVENT.registrationOpensLabel}.` });
    }
    const firstName = cleanText(req.body?.firstName, 80);
    const lastName = cleanText(req.body?.lastName, 80);
    const normalizedPhone = normalizeGhanaPhone(String(req.body?.phoneNumber || ""));
    const preferredLanguage = cleanText(req.body?.preferredLanguage, 20);
    const attendanceCount = Number(req.body?.expanAttendanceCount);
    if (!firstName || !lastName) return res.status(400).json({ error: "First name and last name are required." });
    if (!normalizedPhone) return res.status(400).json({ error: "Enter a valid Ghana phone number." });
    if (!LANGUAGES.has(preferredLanguage)) return res.status(400).json({ error: "Select a valid preferred language." });
    if (![1, 2, 3, 4].includes(attendanceCount)) return res.status(400).json({ error: "Select a valid EXPAN attendance count." });

    const localPhone = `0${normalizedPhone.slice(3)}`;
    const supabase = getSupabaseAdmin();
    const existing = await supabase.from("expan_registrations").select("id")
      .in("phone_number", [localPhone, normalizedPhone]).limit(1).maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) return res.status(409).json({ error: "This phone number is already registered. Please use Check In instead." });

    const { data, error } = await supabase.from("expan_registrations").insert({
      first_name: firstName,
      last_name: lastName,
      phone_number: localPhone,
      location_name: cleanText(req.body?.locationName, 160) || null,
      referral_source: cleanText(req.body?.referralSource, 100) || null,
      preferred_language: preferredLanguage,
      expan_attendance_count: attendanceCount,
      is_student: Boolean(req.body?.isStudent),
      school: Boolean(req.body?.isStudent) ? cleanText(req.body?.school, 160) || null : null,
      latitude: typeof req.body?.latitude === "number" ? req.body.latitude : null,
      longitude: typeof req.body?.longitude === "number" ? req.body.longitude : null,
      event_key: EVENT.key,
    }).select("id").single();
    if (error?.code === "23505") return res.status(409).json({ error: "This phone number is already registered. Please use Check In instead." });
    if (error) throw new Error(error.message);

    let smsSent = false;
    try {
      await sendTransactionalSms(normalizedPhone, eventWelcomeMessage(firstName));
      smsSent = true;
    } catch (smsError) {
      console.error("Registration saved but welcome SMS failed", smsError);
    }
    return res.status(201).json({ registration: { id: data.id, phoneNumber: localPhone }, smsSent });
  } catch (error) {
    return sendServerError(res, error);
  }
}
