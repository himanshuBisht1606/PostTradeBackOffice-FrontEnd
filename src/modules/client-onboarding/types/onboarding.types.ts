export interface PanStepData {
  pan: string;
  clientType: string;
  holderType: 'Single' | 'Joint';
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
  citizenshipStatus?: string;
  residentialStatus?: string;
  identityProofType?: string;
  identityProofNumber?: string;
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

export interface BankDetailsData {
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
}

export interface DematAccountData {
  depository: string;
  dpId: string;
  clientId: string;
  dpName: string;
  segments: string[];
}

export interface JointHolderData {
  holderNumber: 2 | 3;
  pan: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO 'YYYY-MM-DD'
  relationship: string;
}

export interface FatcaData {
  taxCountry: string;
  tin?: string;
  isUsPerson: boolean;
  sourceOfWealth: string;
}

export interface DeclarationData {
  acceptedTerms: boolean;
  informationAccurate: boolean;
}

export interface EntityDetailsData {
  entityName: string;
  registrationNumber?: string;
  dateOfConstitution?: string; // ISO YYYY-MM-DD
  constitutionType?: string;
  gstNumber?: string;
  annualTurnover?: string;
  kartaName?: string;   // HUF only
  kartaPan?: string;    // HUF only
}

export interface AuthorizedSignatoryData {
  name: string;
  designation: string;
  pan: string;
  din?: string;
  mobile?: string;
  email?: string;
}

export interface OnboardingPayload {
  pan: PanStepData;
  basicDetails?: BasicDetailsData;
  address: AddressData;
  contact: ContactData;
  nominee?: NomineeData;
  bankDetails?: BankDetailsData;
  dematAccount?: DematAccountData;
  jointHolders?: JointHolderData[];
  fatca?: FatcaData;
  declaration?: DeclarationData;
  entityDetails?: EntityDetailsData;
  authorizedSignatories?: AuthorizedSignatoryData[];
}

export interface OnboardingResult {
  clientId: string;
  clientCode: string;
}
