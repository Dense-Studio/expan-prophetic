import type { ExpanAttendanceCount, PreferredLanguage } from "../types";
import { apiRequest } from "./api";

export interface CheckInResult {
  name: string;
  alreadyCheckedIn: boolean;
  smsSent: boolean;
}

export async function checkInGuest(
  phoneNumber: string,
  attendanceCount: ExpanAttendanceCount,
  preferredLanguage: PreferredLanguage,
): Promise<CheckInResult> {
  return apiRequest<CheckInResult>("/api/check-in", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, attendanceCount, preferredLanguage }),
  });
}
