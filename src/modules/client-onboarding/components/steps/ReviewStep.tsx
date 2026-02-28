import { Button, Space, Typography, Descriptions, Tag, Divider, Alert, Spin } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../../store/onboardingStore';
import { submitOnboarding } from '../../services/onboardingService';

const { Title, Text } = Typography;

interface Props {
  onPrev: () => void;
}

export function ReviewStep({ onPrev }: Props) {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const { pan, basicDetails, address, contact, nominee, bankDetails, dematAccount, reset } = store;

  const {
    mutate,
    isPending,
    isSuccess,
    data: result,
    isError,
    error,
  } = useMutation({
    mutationFn: () => {
      if (!pan || !basicDetails || !address || !contact) {
        throw new Error('Required onboarding data is missing');
      }
      const payload: Parameters<typeof submitOnboarding>[0] = {
        pan,
        basicDetails,
        address,
        contact,
      };
      if (nominee) payload.nominee = nominee;
      if (bankDetails) payload.bankDetails = bankDetails;
      if (dematAccount) payload.dematAccount = dematAccount;
      return submitOnboarding(payload);
    },
    onSuccess: () => {
      reset();
    },
  });

  if (isSuccess) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
        <Title level={3} style={{ color: '#1d3557' }}>
          Client Onboarded Successfully!
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Client Code: <strong>{result?.clientCode}</strong>
        </Text>
        <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
          Client ID: <strong>{result?.clientId}</strong>
        </Text>
        <Button type="primary" onClick={() => void navigate('/account-management/clients')}>
          Go to Client List
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Title level={5} style={{ color: '#1d3557', marginBottom: 20 }}>
        Review all details before submitting
      </Title>

      {/* PAN & Client Type */}
      <Descriptions
        title="PAN & Client Type"
        bordered
        size="small"
        column={2}
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="PAN">
          <Text code style={{ fontWeight: 700 }}>
            {pan?.pan}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Client Type">
          <Tag color="blue">{pan?.clientType}</Tag>
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* Basic Details */}
      <Descriptions
        title="Basic Details"
        bordered
        size="small"
        column={3}
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="Name" span={2}>
          {[
            basicDetails?.prefix,
            basicDetails?.firstName,
            basicDetails?.middleName,
            basicDetails?.lastName,
          ]
            .filter(Boolean)
            .join(' ')}
        </Descriptions.Item>
        <Descriptions.Item label="DOB">{basicDetails?.dob}</Descriptions.Item>
        <Descriptions.Item label="Gender">{basicDetails?.gender}</Descriptions.Item>
        <Descriptions.Item label="Marital Status">
          {basicDetails?.maritalStatus ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Occupation">{basicDetails?.occupation}</Descriptions.Item>
        <Descriptions.Item label="Father / Spouse">
          {basicDetails?.fatherSpouseName ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Mother">{basicDetails?.motherName ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Annual Income">
          {basicDetails?.grossAnnualIncome ?? '—'}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* Address */}
      <Descriptions
        title="Permanent Address"
        bordered
        size="small"
        column={2}
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="Line 1" span={2}>
          {address?.permanentLine1}
        </Descriptions.Item>
        {address?.permanentLine2 && (
          <Descriptions.Item label="Line 2" span={2}>
            {address.permanentLine2}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="City">{address?.permanentCity}</Descriptions.Item>
        <Descriptions.Item label="State">{address?.permanentState}</Descriptions.Item>
        <Descriptions.Item label="PIN Code">{address?.permanentPinCode}</Descriptions.Item>
        <Descriptions.Item label="Country">{address?.permanentCountry}</Descriptions.Item>
        {address?.sameAsPermanent && (
          <Descriptions.Item label="Correspondence" span={2}>
            <Tag color="default">Same as Permanent</Tag>
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider />

      {/* Contact */}
      <Descriptions
        title="Contact Details"
        bordered
        size="small"
        column={3}
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="Mobile">{contact?.mobile}</Descriptions.Item>
        <Descriptions.Item label="Email">{contact?.email}</Descriptions.Item>
        <Descriptions.Item label="Alternate Mobile">
          {contact?.alternateMobile ?? '—'}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* Nominee */}
      {nominee && (
        <Descriptions
          title="Nominee Details"
          bordered
          size="small"
          column={3}
          style={{ marginBottom: 20 }}
        >
          <Descriptions.Item label="Name">{nominee.nomineeName}</Descriptions.Item>
          <Descriptions.Item label="Relationship">{nominee.relationship}</Descriptions.Item>
          <Descriptions.Item label="Share %">{nominee.sharePercentage}%</Descriptions.Item>
          <Descriptions.Item label="DOB">{nominee.dob || '—'}</Descriptions.Item>
          <Descriptions.Item label="Mobile">{nominee.nomineeMobile ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Email">{nominee.nomineeEmail ?? '—'}</Descriptions.Item>
        </Descriptions>
      )}

      {bankDetails && (
        <>
          <Divider />
          <Descriptions
            title="Bank Details"
            bordered
            size="small"
            column={3}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Bank Name">{bankDetails.bankName}</Descriptions.Item>
            <Descriptions.Item label="Branch">{bankDetails.branchName}</Descriptions.Item>
            <Descriptions.Item label="Account Type">{bankDetails.accountType}</Descriptions.Item>
            <Descriptions.Item label="Account Number" span={2}>
              <Text code>{bankDetails.accountNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="IFSC Code">
              <Text code>{bankDetails.ifscCode}</Text>
            </Descriptions.Item>
          </Descriptions>
        </>
      )}

      {dematAccount && (
        <>
          <Divider />
          <Descriptions
            title="Demat Account"
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Depository">{dematAccount.depository}</Descriptions.Item>
            <Descriptions.Item label="DP Name">{dematAccount.dpName}</Descriptions.Item>
            <Descriptions.Item label="DP ID">
              <Text code>{dematAccount.dpId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Client ID / Beneficiary ID">
              <Text code>{dematAccount.clientId}</Text>
            </Descriptions.Item>
          </Descriptions>
        </>
      )}

      {isError && (
        <Alert
          type="warning"
          showIcon
          message="API not yet available"
          description={
            (error as Error)?.message ??
            'The backend API is not yet implemented. Onboarding data has been captured and will be submitted once the API is ready.'
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Space style={{ marginTop: 16 }}>
        <Button onClick={onPrev} disabled={isPending}>
          Back
        </Button>
        <Button
          type="primary"
          onClick={() => mutate()}
          loading={isPending}
          icon={<CheckCircleOutlined />}
        >
          {isPending ? 'Submitting…' : 'Submit Onboarding'}
        </Button>
      </Space>

      {isPending && (
        <div style={{ marginTop: 16 }}>
          <Spin size="small" />{' '}
          <Text type="secondary" style={{ marginLeft: 8 }}>
            Submitting to server…
          </Text>
        </div>
      )}
    </div>
  );
}
