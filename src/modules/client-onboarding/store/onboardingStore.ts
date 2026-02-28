import { create } from 'zustand';
import type {
  PanStepData,
  BasicDetailsData,
  AddressData,
  ContactData,
  NomineeData,
  BankDetailsData,
  DematAccountData,
  JointHolderData,
  FatcaData,
  DeclarationData,
  EntityDetailsData,
  AuthorizedSignatoryData,
} from '../types/onboarding.types';

interface OnboardingState {
  currentStep: number;
  pan: PanStepData | null;
  basicDetails: BasicDetailsData | null;
  address: AddressData | null;
  contact: ContactData | null;
  nominee: NomineeData | null;
  bankDetails: BankDetailsData | null;
  dematAccount: DematAccountData | null;
  jointHolders: JointHolderData[];
  fatca: FatcaData | null;
  declaration: DeclarationData | null;
  entityDetails: EntityDetailsData | null;
  authorizedSignatories: AuthorizedSignatoryData[];

  setStep: (step: number) => void;
  setPan: (data: PanStepData) => void;
  setBasicDetails: (data: BasicDetailsData) => void;
  setAddress: (data: AddressData) => void;
  setContact: (data: ContactData) => void;
  setNominee: (data: NomineeData) => void;
  setBankDetails: (data: BankDetailsData) => void;
  setDematAccount: (data: DematAccountData) => void;
  setJointHolders: (data: JointHolderData[]) => void;
  setFatca: (data: FatcaData) => void;
  setDeclaration: (data: DeclarationData) => void;
  setEntityDetails: (data: EntityDetailsData) => void;
  setAuthorizedSignatories: (data: AuthorizedSignatoryData[]) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  pan: null,
  basicDetails: null,
  address: null,
  contact: null,
  nominee: null,
  bankDetails: null,
  dematAccount: null,
  jointHolders: [],
  fatca: null,
  declaration: null,
  entityDetails: null,
  authorizedSignatories: [],
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  setPan: (data) => set({ pan: data }),
  setBasicDetails: (data) => set({ basicDetails: data }),
  setAddress: (data) => set({ address: data }),
  setContact: (data) => set({ contact: data }),
  setNominee: (data) => set({ nominee: data }),
  setBankDetails: (data) => set({ bankDetails: data }),
  setDematAccount: (data) => set({ dematAccount: data }),
  setJointHolders: (data) => set({ jointHolders: data }),
  setFatca: (data) => set({ fatca: data }),
  setDeclaration: (data) => set({ declaration: data }),
  setEntityDetails: (data) => set({ entityDetails: data }),
  setAuthorizedSignatories: (data) => set({ authorizedSignatories: data }),
  reset: () => set(initialState),
}));
