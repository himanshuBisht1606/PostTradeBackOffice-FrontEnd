import { Form, Checkbox, Button, Space, Typography, Alert, Divider } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { DeclarationData } from '../../types/onboarding.types';

const { Title, Paragraph, Text } = Typography;

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function DeclarationStep({ onNext, onPrev }: Props) {
  const [form] = Form.useForm<DeclarationData>();
  const { declaration: saved, setDeclaration } = useOnboardingStore();

  const handleFinish = (values: DeclarationData) => {
    setDeclaration(values);
    onNext();
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <Title level={5} style={{ color: '#1d3557', marginBottom: 16 }}>
        <SafetyOutlined style={{ marginRight: 8 }} />
        Declaration & Consent
      </Title>

      <Alert
        type="info"
        showIcon
        message="Please read the following carefully before proceeding."
        style={{ marginBottom: 20 }}
      />

      <Paragraph style={{ color: '#444', lineHeight: 1.8 }}>
        I/We hereby declare that I/We have read and understood the terms and conditions governing the
        opening of a trading and demat account with this broker. I/We confirm that:
      </Paragraph>

      <ul style={{ color: '#444', lineHeight: 2, paddingLeft: 20 }}>
        <li>
          All information provided during this onboarding process is true, accurate, and complete to
          the best of my/our knowledge.
        </li>
        <li>
          I/We will promptly notify the broker of any changes to the information provided.
        </li>
        <li>
          I/We consent to the collection, use, and processing of my/our personal data for the
          purpose of account management, regulatory compliance, and communication.
        </li>
        <li>
          I/We understand that providing false or misleading information may result in account
          termination and legal action.
        </li>
        <li>
          I/We acknowledge receipt of the Risk Disclosure Document and the KYC policies of the
          broker.
        </li>
      </ul>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        initialValues={saved ?? { informationAccurate: false, acceptedTerms: false }}
        onFinish={handleFinish}
      >
        <Form.Item
          name="informationAccurate"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value: boolean) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error('You must confirm the accuracy of information')),
            },
          ]}
        >
          <Checkbox>
            <Text strong>
              I confirm that all information provided is true and accurate to the best of my
              knowledge.
            </Text>
          </Checkbox>
        </Form.Item>

        <Form.Item
          name="acceptedTerms"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value: boolean) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error('You must accept the Terms & Conditions')),
            },
          ]}
        >
          <Checkbox>
            <Text strong>
              I accept the Terms & Conditions and consent to data processing as described above.
            </Text>
          </Checkbox>
        </Form.Item>

        <Space style={{ marginTop: 8 }}>
          <Button onClick={onPrev}>Back</Button>
          <Button type="primary" htmlType="submit">
            Next — Review & Submit
          </Button>
        </Space>
      </Form>
    </div>
  );
}
