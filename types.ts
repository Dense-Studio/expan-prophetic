export enum OnboardingStep {
  WELCOME = "WELCOME",
  NAME = "NAME",
  DETAILS = "DETAILS",
  CONTACT = "CONTACT",
  SUCCESS = "SUCCESS",
}

export interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  locationName: string;
  referralSource: string; // Posters & Flyers, Invited by someone, Social Media, Other
  isStudent: boolean;
  school: string;
  latitude: number | null;
  longitude: number | null;
}
