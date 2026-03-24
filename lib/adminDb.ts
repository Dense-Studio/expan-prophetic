/**
 * Admin Database Operations
 * CRUD operations for the admin dashboard.
 */
import { supabase } from "./supabaseClient";

export interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  location_name: string | null;
  referral_source: string | null;
  is_student: boolean;
  school: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export async function fetchRegistrations(): Promise<Registration[]> {
  const { data, error } = await supabase
    .from("expan_registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Failed to fetch registrations:", error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  return (data as Registration[]) || [];
}

export async function deleteRegistration(id: string): Promise<void> {
  const { error } = await supabase
    .from("expan_registrations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Failed to delete registration:", error.message);
    throw new Error(`Delete failed: ${error.message}`);
  }
}

export async function updateRegistration(
  id: string,
  updates: Partial<Omit<Registration, "id" | "created_at">>,
): Promise<Registration> {
  const { data, error } = await supabase
    .from("expan_registrations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Failed to update registration:", error.message);
    throw new Error(`Update failed: ${error.message}`);
  }

  return data as Registration;
}
