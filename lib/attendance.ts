/**
 * Attendance Tracking
 * Handles Sunday check-in operations: recording attendance, duplicate prevention,
 * fetching records, deleting incorrect check-ins, and generating Sunday date lists.
 */
import { supabase } from "./supabaseClient";

/**
 * Look up a registration by phone number.
 */
export async function findByPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  const { data, error } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, phone_number, photo_url")
    .eq("phone_number", cleaned)
    .maybeSingle();

  if (error) {
    console.error("❌ Phone lookup failed:", error.message);
    throw new Error(`Lookup failed: ${error.message}`);
  }

  return data;
}

function todaySundayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export async function hasCheckedInToday(
  registrationId: string,
  dateOverride?: string,
): Promise<boolean> {
  const sundayDate = dateOverride || todaySundayDate();
  const { data, error } = await supabase
    .from("attendance")
    .select("id")
    .eq("registration_id", registrationId)
    .eq("sunday_date", sundayDate)
    .maybeSingle();

  if (error) {
    console.error("❌ Attendance check failed:", error.message);
    return false;
  }

  return !!data;
}

export async function recordAttendance(
  registrationId: string,
  phoneNumber: string,
  dateOverride?: string,
): Promise<{ alreadyCheckedIn: boolean }> {
  const sundayDate = dateOverride || todaySundayDate();

  const already = await hasCheckedInToday(registrationId, sundayDate);
  if (already) {
    return { alreadyCheckedIn: true };
  }

  const { error } = await supabase.from("attendance").insert({
    registration_id: registrationId,
    phone_number: phoneNumber,
    sunday_date: sundayDate,
  });

  if (error) {
    console.error("❌ Failed to record attendance:", error.message);
    throw new Error(`Attendance error: ${error.message}`);
  }

  console.log("✅ Attendance recorded for", sundayDate);
  return { alreadyCheckedIn: false };
}

export interface AttendanceRecord {
  id: string;
  registration_id: string;
  phone_number: string;
  sunday_date: string;
  check_in_time: string;
  registration?: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
    attendance_type: string | null;
    department: string | null;
  };
}

export function getPastSundays(): { value: string; label: string }[] {
  const sundays: { value: string; label: string }[] = [];
  const startDate = new Date(2026, 2, 1); 
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let current = new Date(startDate);
  while (current <= today) {
    if (current.getDay() === 0) {
      const isoDate = current.toISOString().split("T")[0];
      const label = current.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      sundays.unshift({ value: isoDate, label });
    }
    current.setDate(current.getDate() + 1);
  }
  return sundays;
}

export async function fetchAttendance(
  sundayDate?: string,
): Promise<AttendanceRecord[]> {
  let query = supabase
    .from("attendance")
    .select(
      "id, registration_id, phone_number, sunday_date, check_in_time, registration:registrations(first_name, last_name, photo_url, attendance_type, department)",
    )
    .order("check_in_time", { ascending: false });

  if (sundayDate) {
    query = query.eq("sunday_date", sundayDate);
  }

  const { data, error } = await query;
  if (error) {
    console.error("❌ Failed to fetch attendance:", error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  return (data as unknown as AttendanceRecord[]) || [];
}

export async function deleteAttendance(attendanceId: string): Promise<void> {
  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("id", attendanceId);

  if (error) {
    console.error("❌ Failed to delete attendance:", error.message);
    throw new Error(`Delete failed: ${error.message}`);
  }
}
