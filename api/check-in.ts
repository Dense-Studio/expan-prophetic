import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EVENT } from "../lib/event.js";
import { normalizeGhanaPhone } from "../lib/smsEncoding.js";
import { sendTransactionalSms } from "../server/arkesel.js";
import { methodNotAllowed, sendServerError } from "../server/http.js";
import { eventWelcomeMessage } from "../server/messages.js";
import { getSupabaseAdmin } from "../server/supabaseAdmin.js";

const LANGUAGES = new Set(["English", "Twi", "Fante", "Ga", "Ewe"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  try {
    if (!EVENT.forceAccessOpenForTesting && Date.now() < new Date(EVENT.checkInOpensAt).getTime()) {
      return res.status(403).json({ error: `Check-in opens on ${EVENT.checkInOpensLabel}.` });
    }
    const normalizedPhone = normalizeGhanaPhone(String(req.body?.phoneNumber || ""));
    const attendanceCount = Number(req.body?.attendanceCount);
    const preferredLanguage = typeof req.body?.preferredLanguage === "string" ? req.body.preferredLanguage : "";
    if (!normalizedPhone) return res.status(400).json({ error: "Enter a valid Ghana phone number." });
    if (![1, 2, 3, 4].includes(attendanceCount)) return res.status(400).json({ error: "Select a valid EXPAN attendance count." });
    if (!LANGUAGES.has(preferredLanguage)) return res.status(400).json({ error: "Select a valid preferred language." });

    const localPhone = `0${normalizedPhone.slice(3)}`;
    const supabase = getSupabaseAdmin();
    const registrationResult = await supabase.from("expan_registrations")
      .select("id, first_name, last_name, phone_number")
      .in("phone_number", [localPhone, normalizedPhone]).limit(1).maybeSingle();
    if (registrationResult.error) throw new Error(registrationResult.error.message);
    if (!registrationResult.data) return res.status(404).json({ error: "No previous EXPAN registration was found for this phone number.", notFound: true });
    const registration = registrationResult.data;

    const { error: profileError } = await supabase.from("expan_registrations").update({
      expan_attendance_count: attendanceCount,
      preferred_language: preferredLanguage,
      updated_at: new Date().toISOString(),
    }).eq("id", registration.id);
    if (profileError) throw new Error(profileError.message);

    const existing = await supabase.from("expan_check_ins").select("id")
      .eq("registration_id", registration.id).eq("event_key", EVENT.key).maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    let alreadyCheckedIn = Boolean(existing.data);
    if (!alreadyCheckedIn) {
      const insert = await supabase.from("expan_check_ins").insert({
        registration_id: registration.id,
        event_key: EVENT.key,
        phone_number: registration.phone_number,
        attendance_count: attendanceCount,
      });
      if (insert.error?.code === "23505") alreadyCheckedIn = true;
      else if (insert.error) throw new Error(insert.error.message);
    }

    let smsSent = alreadyCheckedIn;
    if (!alreadyCheckedIn) {
      try {
        await sendTransactionalSms(normalizedPhone, eventWelcomeMessage(registration.first_name));
        smsSent = true;
      } catch (smsError) {
        console.error("Check-in saved but confirmation SMS failed", smsError);
      }
    }
    return res.status(200).json({
      name: `${registration.first_name} ${registration.last_name}`,
      alreadyCheckedIn,
      smsSent,
    });
  } catch (error) {
    return sendServerError(res, error);
  }
}
