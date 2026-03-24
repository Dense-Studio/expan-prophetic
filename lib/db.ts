/**
 * Registration Database Operations
 * Handles saving new member registrations to Supabase.
 * Performs JS-level duplicate prevention using phone number as the unique key.
 * Returns the registration ID and phone number for downstream use (e.g. auto-attendance).
 */
import { supabase } from "./supabaseClient";
import type { FormData } from "../types";

/**
 * Save a registration to the Supabase `registrations` table.
 * Checks for duplicate phone numbers before inserting.
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
    is_student: data.isStudent,
    school: data.school || null,
    latitude: data.latitude,
    longitude: data.longitude,
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
    // Update existing profile
    const { error: updateError } = await supabase
      .from("expan_registrations")
      .update(payload)
      .eq("id", existing.id);

    if (updateError) {
      console.error("❌ Failed to update registration:", updateError.message);
      throw new Error(`Database update error: ${updateError.message}`);
    }
    console.log(
      "✅ Registration updated successfully for existing phone number",
    );
    return { id: existing.id, phoneNumber: payload.phone_number };
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
