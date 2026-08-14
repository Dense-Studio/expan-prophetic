/**
 * Admin Database Operations
 * CRUD operations for the admin dashboard.
 */
import { apiRequest } from "./api";

export interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  location_name: string | null;
  referral_source: string | null;
  preferred_language: string | null;
  expan_attendance_count: number | null;
  is_student: boolean;
  school: string | null;
  latitude: number | null;
  longitude: number | null;
  event_key: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  registration_id: string;
  event_key: string;
  phone_number: string;
  attendance_count: number | null;
  check_in_time: string;
}

export async function fetchRegistrations(): Promise<Registration[]> {
  const result = await apiRequest<{ registrations: Registration[] }>("/api/admin/registrations");
  return result.registrations;
}

export async function fetchCheckIns(): Promise<CheckIn[]> {
  const result = await apiRequest<{ checkIns: CheckIn[] }>("/api/admin/registrations?view=check-ins");
  return result.checkIns;
}

export async function deleteRegistration(id: string): Promise<void> {
  await apiRequest<{ deleted: boolean }>("/api/admin/registrations", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

export async function updateRegistration(
  id: string,
  updates: Partial<Omit<Registration, "id" | "created_at">>,
): Promise<Registration> {
  const result = await apiRequest<{ registration: Registration }>("/api/admin/registrations", {
    method: "PATCH",
    body: JSON.stringify({ id, updates }),
  });
  return result.registration;
}
