
export enum OnboardingStep {
  WELCOME = 'WELCOME',
  NAME = 'NAME',
  CONTACT = 'CONTACT',
  SUCCESS = 'SUCCESS'
}

export interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}
