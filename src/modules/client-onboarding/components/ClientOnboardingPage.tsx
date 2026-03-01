import { useMemo } from 'react';
import { Steps, Card, Typography, Tag, Space } from 'antd';
import {
  IdcardOutlined,
  UserOutlined,
  HomeOutlined,
  PhoneOutlined,
  BankOutlined,
  StockOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  GlobalOutlined,
  SafetyOutlined,
  AuditOutlined,
  SolutionOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { useOnboardingStore } from '../store/onboardingStore';
import { PanVerificationStep } from './steps/PanVerificationStep';
import { BasicDetailsStep } from './steps/BasicDetailsStep';
import { AddressStep } from './steps/AddressStep';
import { ContactNomineeStep } from './steps/ContactNomineeStep';
import { BankDetailsStep } from './steps/BankDetailsStep';
import { DematAccountStep } from './steps/DematAccountStep';
import { JointHoldersStep } from './steps/JointHoldersStep';
import { FatcaStep } from './steps/FatcaStep';
import { DeclarationStep } from './steps/DeclarationStep';
import { ReviewStep } from './steps/ReviewStep';
import { EntityDetailsStep } from './steps/EntityDetailsStep';
import { AuthorizedSignatoriesStep } from './steps/AuthorizedSignatoriesStep';
import { BranchSelectionStep } from './steps/BranchSelectionStep';

const { Title, Text } = Typography;

// Individual PAN types (4th char P or J)
export const INDIVIDUAL_TYPES = new Set(['Individual', 'AJP']);

type StepKey =
  | 'pan'
  | 'branch'
  | 'entity'
  | 'signatories'
  | 'basic'
  | 'joint'
  | 'address'
  | 'contact'
  | 'bank'
  | 'demat'
  | 'fatca'
  | 'declaration'
  | 'review';

interface StepDef {
  key: StepKey;
  title: string;
  icon: React.ReactNode;
}

const INDIV_ALL_STEPS: StepDef[] = [
  { key: 'pan', title: 'PAN', icon: <IdcardOutlined /> },
  { key: 'branch', title: 'Branch', icon: <BranchesOutlined /> },
  { key: 'basic', title: 'Basic Details', icon: <UserOutlined /> },
  { key: 'joint', title: 'Joint Holders', icon: <TeamOutlined /> },
  { key: 'address', title: 'Address', icon: <HomeOutlined /> },
  { key: 'contact', title: 'Contact & Nominee', icon: <PhoneOutlined /> },
  { key: 'bank', title: 'Bank Details', icon: <BankOutlined /> },
  { key: 'demat', title: 'Demat Account', icon: <StockOutlined /> },
  { key: 'fatca', title: 'FATCA / CRS', icon: <GlobalOutlined /> },
  { key: 'declaration', title: 'Declaration', icon: <SafetyOutlined /> },
  { key: 'review', title: 'Review & Submit', icon: <CheckSquareOutlined /> },
];

const NONINDIV_STEPS: StepDef[] = [
  { key: 'pan', title: 'PAN', icon: <IdcardOutlined /> },
  { key: 'branch', title: 'Branch', icon: <BranchesOutlined /> },
  { key: 'entity', title: 'Entity Details', icon: <AuditOutlined /> },
  { key: 'signatories', title: 'Signatories', icon: <SolutionOutlined /> },
  { key: 'address', title: 'Address', icon: <HomeOutlined /> },
  { key: 'contact', title: 'Contact', icon: <PhoneOutlined /> },
  { key: 'bank', title: 'Bank Details', icon: <BankOutlined /> },
  { key: 'demat', title: 'Demat Account', icon: <StockOutlined /> },
  { key: 'fatca', title: 'FATCA / CRS', icon: <GlobalOutlined /> },
  { key: 'declaration', title: 'Declaration', icon: <SafetyOutlined /> },
  { key: 'review', title: 'Review & Submit', icon: <CheckSquareOutlined /> },
];

export function ClientOnboardingPage() {
  const { currentStep, setStep, pan } = useOnboardingStore();

  const isIndividualClient = !pan || INDIVIDUAL_TYPES.has(pan.clientType);
  const isJoint = pan?.holderType === 'Joint';

  const steps = useMemo<StepDef[]>(() => {
    if (!isIndividualClient) return NONINDIV_STEPS;
    return INDIV_ALL_STEPS.filter((s) => s.key !== 'joint' || isJoint);
  }, [isIndividualClient, isJoint]);

  const goNext = () => setStep(currentStep + 1);
  const goPrev = () => setStep(currentStep - 1);

  const currentKey = steps[currentStep]?.key;

  const renderStep = () => {
    switch (currentKey) {
      case 'pan':
        return <PanVerificationStep onNext={goNext} />;
      case 'branch':
        return <BranchSelectionStep onNext={goNext} onPrev={goPrev} />;
      case 'entity':
        return <EntityDetailsStep onNext={goNext} onPrev={goPrev} />;
      case 'signatories':
        return <AuthorizedSignatoriesStep onNext={goNext} onPrev={goPrev} />;
      case 'basic':
        return <BasicDetailsStep onNext={goNext} onPrev={goPrev} />;
      case 'joint':
        return <JointHoldersStep onNext={goNext} onPrev={goPrev} />;
      case 'address':
        return <AddressStep onNext={goNext} onPrev={goPrev} />;
      case 'contact':
        return (
          <ContactNomineeStep
            onNext={goNext}
            onPrev={goPrev}
            showNominee={isIndividualClient}
          />
        );
      case 'bank':
        return <BankDetailsStep onNext={goNext} onPrev={goPrev} />;
      case 'demat':
        return <DematAccountStep onNext={goNext} onPrev={goPrev} />;
      case 'fatca':
        return <FatcaStep onNext={goNext} onPrev={goPrev} />;
      case 'declaration':
        return <DeclarationStep onNext={goNext} onPrev={goPrev} />;
      case 'review':
        return <ReviewStep onPrev={goPrev} />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
          Client Onboarding
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Register a new client by completing all required steps
        </Text>
        {pan && (
          <Space style={{ marginLeft: 12 }}>
            <Tag color="blue" style={{ fontWeight: 600 }}>
              {pan.pan}
            </Tag>
            <Tag color="geekblue">{pan.clientType}</Tag>
            {!isIndividualClient && <Tag color="volcano">Non-Individual</Tag>}
            {pan.holderType === 'Joint' && <Tag color="purple">Joint</Tag>}
          </Space>
        )}
      </div>

      {/* Step Indicator */}
      <Card
        style={{ marginBottom: 24, borderRadius: 8 }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <Steps
          current={currentStep}
          items={steps.map((s) => ({ title: s.title, icon: s.icon }))}
          size="small"
        />
      </Card>

      {/* Step Content */}
      <Card style={{ borderRadius: 8, minHeight: 400 }} styles={{ body: { padding: 32 } }}>
        {renderStep()}
      </Card>
    </div>
  );
}
