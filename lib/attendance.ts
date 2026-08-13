/** Event check-in operations for returning EXPAN guests. */
import { supabase } from "./supabaseClient";
import { EVENT } from "./event";
import type { ExpanAttendanceCount } from "../types";

export interface ReturningGuest {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

function phoneCandidates(phone: string): string[] {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("233")
    ? `0${digits.slice(3)}`
    : digits.length === 9
      ? `0${digits}`
      : digits;
  const international = local.startsWith("0") ? `233${local.slice(1)}` : local;
  return [...new Set([digits, local, international])];
}

export async function findByPhone(phone: string): Promise<ReturningGuest | null> {
  const { data, error } = await supabase
    .from("expan_registrations")
    .select("id, first_name, last_name, phone_number")
    .in("phone_number", phoneCandidates(phone))
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("❌ Phone lookup failed:", error.message);
    throw new Error(`Lookup failed: ${error.message}`);
  }

  return data as ReturningGuest | null;
}

export async function hasCheckedIn(
  registrationId: string,
  eventKey = EVENT.key,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("expan_check_ins")
    .select("id")
    .eq("registration_id", registrationId)
    .eq("event_key", eventKey)
    .maybeSingle();

  if (error) {
    console.error("❌ Check-in lookup failed:", error.message);
    throw new Error(`Check-in lookup failed: ${error.message}`);
  }

  return Boolean(data);
}

export async function recordEventCheckIn(
  registrationId: string,
  phoneNumber: string,
  attendanceCount: ExpanAttendanceCount,
  eventKey = EVENT.key,
): Promise<{ alreadyCheckedIn: boolean }> {
  const { error: profileError } = await supabase
    .from("expan_registrations")
    .update({ expan_attendance_count: attendanceCount })
    .eq("id", registrationId);

  if (profileError) {
    console.error("❌ Failed to update attendance history:", profileError.message);
    throw new Error(`Attendance history update failed: ${profileError.message}`);
  }

  if (await hasCheckedIn(registrationId, eventKey)) {
    return { alreadyCheckedIn: true };
  }

  const { error } = await supabase.from("expan_check_ins").insert({
    registration_id: registrationId,
    phone_number: phoneNumber,
    attendance_count: attendanceCount,
    event_key: eventKey,
  });

  // The database unique constraint also protects against simultaneous taps.
  if (error?.code === "23505") return { alreadyCheckedIn: true };
  if (error) {
    console.error("❌ Failed to record check-in:", error.message);
    throw new Error(`Check-in failed: ${error.message}`);
  }

  return { alreadyCheckedIn: false };
}
