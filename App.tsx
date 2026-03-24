/**
 * App — Root Component & Router
 * Defines all application routes and contains the multi-step OnboardingFlow.
 * Routes:
 *   /           → OnboardingFlow (Welcome → Name → Details → Contact → Success)
 *   /attendance → AttendanceLogin (Sunday check-in)
 *   /login      → LoginPage (admin password gate)
 *   /admin      → AdminDashboard (full admin panel)
 */
import React, { useCallback, useState } from "react";
import { Route, Routes } from "react-router-dom";
import StepContact from "./components/StepContact";
import StepDetails from "./components/StepDetails";
import StepName from "./components/StepName";
import StepSuccess from "./components/StepSuccess";
import StepWelcome from "./components/StepWelcome";

import AdminDashboard from "./components/AdminDashboard";
import AttendanceLogin from "./components/AttendanceLogin";
import LoginPage from "./components/LoginPage";
import { FormData, OnboardingStep } from "./types";

/** The original multi-step onboarding flow, extracted into its own component. */
const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.WELCOME,
  );
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    locationName: "",
    referralSource: "",
    isStudent: false,
    school: "",
    latitude: null,
    longitude: null,
  });

  const nextStep = useCallback(() => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        setCurrentStep(OnboardingStep.NAME);
        break;
      case OnboardingStep.NAME:
        setCurrentStep(OnboardingStep.DETAILS);
        break;
      case OnboardingStep.DETAILS:
        setCurrentStep(OnboardingStep.CONTACT);
        break;
      case OnboardingStep.CONTACT:
        setCurrentStep(OnboardingStep.SUCCESS);
        break;
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    switch (currentStep) {
      case OnboardingStep.NAME:
        setCurrentStep(OnboardingStep.WELCOME);
        break;
      case OnboardingStep.DETAILS:
        setCurrentStep(OnboardingStep.NAME);
        break;
      case OnboardingStep.CONTACT:
        setCurrentStep(OnboardingStep.DETAILS);
        break;
    }
  }, [currentStep]);

  const updateFormData = useCallback((newData: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  return (
    <div className="min-h-screen text-white overflow-x-hidden soft-gradient bg-slate-950">
      {currentStep === OnboardingStep.WELCOME && (
        <StepWelcome onContinue={nextStep} onUpdate={updateFormData} />
      )}
      {currentStep === OnboardingStep.NAME && (
        <StepName
          formData={formData}
          onUpdate={updateFormData}
          onContinue={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === OnboardingStep.DETAILS && (
        <StepDetails
          formData={formData}
          onUpdate={updateFormData}
          onContinue={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === OnboardingStep.CONTACT && (
        <StepContact
          formData={formData}
          onUpdate={updateFormData}
          onContinue={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === OnboardingStep.SUCCESS && (
        <StepSuccess formData={formData} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<OnboardingFlow />} />
      <Route path="/attendance" element={<AttendanceLogin />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
};

export default App;
