export interface PanStepData {
  pan: string;
  clientType: string;
}

export interface BasicDetailsData {
  prefix?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fatherSpouseName?: string;
  motherName?: string;
  dob: string; // ISO 'YYYY-MM-DD'
  gender: string;
  maritalStatus?: string;
  occupation: string;
  grossAnnualIncome?: string;
}

export interface AddressData {
  permanentLine1: string;
  permanentLine2?: string;
  permanentCity: string;
  permanentState: string;
  permanentCountry: string;
  permanentPinCode: string;
  sameAsPermanent: boolean;
  corrLine1?: string;
  corrLine2?: string;
  corrCity?: string;
  corrState?: string;
  corrCountry?: string;
  corrPinCode?: string;
}

export interface ContactData {
  mobile: string;
  email: string;
  alternateMobile?: string;
}

export interface NomineeData {
  nomineeName: string;
  relationship: string;
  dob: string;
  nomineePan?: string;
  sharePercentage: number;
  nomineeMobile?: string;
  nomineeEmail?: string;
  nomineeAddress?: string;
}

export interface OnboardingPayload {
  pan: PanStepData;
  basicDetails: BasicDetailsData;
  address: AddressData;
  contact: ContactData;
  nominee?: NomineeData;
}

export interface OnboardingResult {
  clientId: string;
  clientCode: string;
}
