import { create } from 'zustand';
import type {
  PanStepData,
  BasicDetailsData,
  AddressData,
  ContactData,
  NomineeData,
} from '../types/onboarding.types';

interface OnboardingState {
  currentStep: number;
  pan: PanStepData | null;
  basicDetails: BasicDetailsData | null;
  address: AddressData | null;
  contact: ContactData | null;
  nominee: NomineeData | null;

  setStep: (step: number) => void;
  setPan: (data: PanStepData) => void;
  setBasicDetails: (data: BasicDetailsData) => void;
  setAddress: (data: AddressData) => void;
  setContact: (data: ContactData) => void;
  setNominee: (data: NomineeData) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  pan: null,
  basicDetails: null,
  address: null,
  contact: null,
  nominee: null,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  setPan: (data) => set({ pan: data }),
  setBasicDetails: (data) => set({ basicDetails: data }),
  setAddress: (data) => set({ address: data }),
  setContact: (data) => set({ contact: data }),
  setNominee: (data) => set({ nominee: data }),
  reset: () => set(initialState),
}));
