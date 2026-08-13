export enum OnboardingStep {
  WELCOME = "WELCOME",
  NAME = "NAME",
  DETAILS = "DETAILS",
  PREFERENCES = "PREFERENCES",
  CONTACT = "CONTACT",
  SUCCESS = "SUCCESS",
}

export type PreferredLanguage = "English" | "Twi" | "Fante" | "Ga" | "Ewe";
export type ExpanAttendanceCount = 1 | 2 | 3;

export interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  locationName: string;
  referralSource: string; // Posters & Flyers, Invited by someone, Social Media, Other
  preferredLanguage: PreferredLanguage | "";
  expanAttendanceCount: ExpanAttendanceCount | null;
  isStudent: boolean;
  school: string;
  latitude: number | null;
  longitude: number | null;
}
