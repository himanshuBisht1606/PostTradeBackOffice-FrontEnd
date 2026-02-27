import { Steps, Card, Typography, Tag } from 'antd';
import {
  IdcardOutlined,
  UserOutlined,
  HomeOutlined,
  PhoneOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useOnboardingStore } from '../store/onboardingStore';
import { PanVerificationStep } from './steps/PanVerificationStep';
import { BasicDetailsStep } from './steps/BasicDetailsStep';
import { AddressStep } from './steps/AddressStep';
import { ContactNomineeStep } from './steps/ContactNomineeStep';
import { ReviewStep } from './steps/ReviewStep';

const { Title, Text } = Typography;

const STEPS = [
  { title: 'PAN Verification', icon: <IdcardOutlined /> },
  { title: 'Basic Details', icon: <UserOutlined /> },
  { title: 'Address', icon: <HomeOutlined /> },
  { title: 'Contact & Nominee', icon: <PhoneOutlined /> },
  { title: 'Review & Submit', icon: <CheckSquareOutlined /> },
];

export function ClientOnboardingPage() {
  const { currentStep, setStep, pan } = useOnboardingStore();

  const goNext = () => setStep(currentStep + 1);
  const goPrev = () => setStep(currentStep - 1);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PanVerificationStep onNext={goNext} />;
      case 1:
        return <BasicDetailsStep onNext={goNext} onPrev={goPrev} />;
      case 2:
        return <AddressStep onNext={goNext} onPrev={goPrev} />;
      case 3:
        return <ContactNomineeStep onNext={goNext} onPrev={goPrev} />;
      case 4:
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
          <span style={{ marginLeft: 12 }}>
            <Tag color="blue" style={{ fontWeight: 600 }}>
              {pan.pan}
            </Tag>
            <Tag color="geekblue">{pan.clientType}</Tag>
          </span>
        )}
      </div>

      {/* Step Indicator */}
      <Card
        style={{ marginBottom: 24, borderRadius: 8 }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <Steps
          current={currentStep}
          items={STEPS.map((s) => ({ title: s.title, icon: s.icon }))}
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
