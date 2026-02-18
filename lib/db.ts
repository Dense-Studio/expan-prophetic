import { supabase } from "./supabaseClient";
import type { FormData } from "../types";

/**
 * Save a registration to the Supabase `registrations` table.
 */
export async function saveRegistration(data: FormData): Promise<void> {
  const { error } = await supabase.from("registrations").insert({
    first_name: data.firstName,
    last_name: data.lastName,
    phone_number: data.phoneNumber,
  });

  if (error) {
    console.error("❌ Failed to save registration:", error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  console.log("✅ Registration saved successfully");
}
