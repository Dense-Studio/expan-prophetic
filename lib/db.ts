/**
 * Registration Database Operations
 * Handles saving new member registrations to Supabase.
 * Keeps registration for new guests by rejecting duplicate phone numbers.
 */
import { supabase } from "./supabaseClient";
import type { FormData } from "../types";
import { EVENT } from "./event";

/**
 * Save a registration to the Supabase `registrations` table.
 * Checks for duplicate phone numbers before inserting. Returning guests should
 * use the event check-in flow instead of overwriting their original profile.
 */
export async function saveRegistration(
  data: FormData,
): Promise<{ id: string; phoneNumber: string }> {
  const payload = {
    first_name: data.firstName,
    last_name: data.lastName,
    phone_number: data.phoneNumber,
    location_name: data.locationName || null,
    referral_source: data.referralSource || null,
    preferred_language: data.preferredLanguage,
    expan_attendance_count: data.expanAttendanceCount,
    is_student: data.isStudent,
    school: data.school || null,
    latitude: data.latitude,
    longitude: data.longitude,
    event_key: EVENT.key,
  };

  // JS-level Duplicate Prevention: Check if the phone number already exists
  const { data: existing, error: lookupError } = await supabase
    .from("expan_registrations")
    .select("id")
    .eq("phone_number", payload.phone_number)
    .maybeSingle();

  if (lookupError) {
    console.error(
      "❌ Failed to check for existing registration:",
      lookupError.message,
    );
    throw new Error(`Database lookup error: ${lookupError.message}`);
  }

  if (existing) {
    throw new Error(
      "This phone number is already registered. Please use Check In instead.",
    );
  } else {
    // Insert new profile
    const { data: inserted, error: insertError } = await supabase
      .from("expan_registrations")
      .insert([payload])
      .select("id")
      .single();

    if (insertError) {
      console.error("❌ Failed to insert registration:", insertError.message);
      throw new Error(`Database insert error: ${insertError.message}`);
    }
    console.log("✅ New registration created successfully");
    return { id: inserted.id, phoneNumber: payload.phone_number };
  }
}
