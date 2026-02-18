import React, { useState, useCallback } from "react";
import { OnboardingStep, FormData } from "./types";
import StepWelcome from "./components/StepWelcome";
import StepName from "./components/StepName";
import StepContact from "./components/StepContact";
import StepSuccess from "./components/StepSuccess";

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.WELCOME,
  );
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const nextStep = useCallback(() => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        setCurrentStep(OnboardingStep.NAME);
        break;
      case OnboardingStep.NAME:
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
      case OnboardingStep.CONTACT:
        setCurrentStep(OnboardingStep.NAME);
        break;
    }
  }, [currentStep]);

  const updateFormData = useCallback((newData: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  return (
    <div className="min-h-screen text-white soft-gradient bg-slate-950 overflow-x-hidden">
      {currentStep === OnboardingStep.WELCOME && (
        <StepWelcome onContinue={nextStep} />
      )}
      {currentStep === OnboardingStep.NAME && (
        <StepName
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

export default App;
