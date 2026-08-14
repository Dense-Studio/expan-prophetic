/**
 * Registration Database Operations
 * Handles saving new member registrations to Supabase.
 * Keeps registration for new guests by rejecting duplicate phone numbers.
 */
import type { FormData } from "../types";
import { apiRequest } from "./api";

/**
 * Save a registration to the Supabase `registrations` table.
 * Checks for duplicate phone numbers before inserting. Returning guests should
 * use the event check-in flow instead of overwriting their original profile.
 */
export async function saveRegistration(
  data: FormData,
): Promise<{ id: string; phoneNumber: string; smsSent: boolean }> {
  const result = await apiRequest<{
    registration: { id: string; phoneNumber: string };
    smsSent: boolean;
  }>("/api/register", { method: "POST", body: JSON.stringify(data) });
  return { ...result.registration, smsSent: result.smsSent };
}
