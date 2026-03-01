import { Button, Space, Typography, Descriptions, Tag, Divider, Alert, Spin } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../../store/onboardingStore';
import { submitOnboarding } from '../../services/onboardingService';
import { INDIVIDUAL_TYPES } from '../ClientOnboardingPage';

const { Title, Text } = Typography;

interface Props {
  onPrev: () => void;
}

export function ReviewStep({ onPrev }: Props) {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const {
    pan,
    branch,
    basicDetails,
    address,
    contact,
    nominee,
    bankDetails,
    dematAccount,
    jointHolders,
    fatca,
    declaration,
    entityDetails,
    authorizedSignatories,
    reset,
  } = store;

  const isIndividualClient = !pan || INDIVIDUAL_TYPES.has(pan.clientType);
  const isHUF = pan?.clientType === 'HUF';

  const {
    mutate,
    isPending,
    isSuccess,
    data: result,
    isError,
    error,
  } = useMutation({
    mutationFn: () => {
      if (!pan || !address || !contact) {
        throw new Error('Required onboarding data is missing');
      }
      if (!branch) {
        throw new Error('Branch selection is required');
      }
      if (isIndividualClient && !basicDetails) {
        throw new Error('Basic details are required for individual clients');
      }
      if (!isIndividualClient && !entityDetails) {
        throw new Error('Entity details are required for non-individual clients');
      }

      const payload: Parameters<typeof submitOnboarding>[0] = {
        pan,
        address,
        contact,
      };
      if (branch) payload.branchId = branch.branchId;
      if (isIndividualClient && basicDetails) payload.basicDetails = basicDetails;
      if (nominee) payload.nominee = nominee;
      if (bankDetails) payload.bankDetails = bankDetails;
      if (dematAccount) payload.dematAccount = dematAccount;
      if (jointHolders.length > 0) payload.jointHolders = jointHolders;
      if (fatca) payload.fatca = fatca;
      if (declaration) payload.declaration = declaration;
      if (entityDetails) payload.entityDetails = entityDetails;
      if (authorizedSignatories.length > 0) payload.authorizedSignatories = authorizedSignatories;
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
        title="PAN & Account Type"
        bordered
        size="small"
        column={3}
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
        <Descriptions.Item label="Holder Type">
          <Tag color={pan?.holderType === 'Joint' ? 'purple' : 'green'}>{pan?.holderType}</Tag>
        </Descriptions.Item>
      </Descriptions>

      {branch && (
        <>
          <Divider />
          <Descriptions
            title="Branch Assignment"
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Branch Code">
              <Text code>{branch.branchCode}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Branch Name">{branch.branchName}</Descriptions.Item>
          </Descriptions>
        </>
      )}

      <Divider />

      {isIndividualClient ? (
        <>
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

          {/* Identity & Residency */}
          {(basicDetails?.citizenshipStatus ||
            basicDetails?.residentialStatus ||
            basicDetails?.identityProofType) && (
            <>
              <Divider />
              <Descriptions
                title="Identity & Residency"
                bordered
                size="small"
                column={2}
                style={{ marginBottom: 20 }}
              >
                <Descriptions.Item label="Citizenship Status">
                  {basicDetails?.citizenshipStatus ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Residential Status">
                  {basicDetails?.residentialStatus ?? '—'}
                </Descriptions.Item>
                {basicDetails?.identityProofType && (
                  <>
                    <Descriptions.Item label="Identity Proof Type">
                      {basicDetails.identityProofType}
                    </Descriptions.Item>
                    <Descriptions.Item label="Identity Proof Number">
                      <Text code>{basicDetails.identityProofNumber}</Text>
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            </>
          )}
        </>
      ) : (
        <>
          {/* Entity Details */}
          <Descriptions
            title="Entity Details"
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Entity Name" span={2}>
              {entityDetails?.entityName}
            </Descriptions.Item>
            {entityDetails?.constitutionType && (
              <Descriptions.Item label="Constitution Type">
                {entityDetails.constitutionType}
              </Descriptions.Item>
            )}
            {entityDetails?.registrationNumber && (
              <Descriptions.Item label="Registration / CIN">
                <Text code>{entityDetails.registrationNumber}</Text>
              </Descriptions.Item>
            )}
            {entityDetails?.dateOfConstitution && (
              <Descriptions.Item label="Date of Constitution">
                {entityDetails.dateOfConstitution}
              </Descriptions.Item>
            )}
            {entityDetails?.gstNumber && (
              <Descriptions.Item label="GST Number">
                <Text code>{entityDetails.gstNumber}</Text>
              </Descriptions.Item>
            )}
            {entityDetails?.annualTurnover && (
              <Descriptions.Item label="Annual Turnover">
                {entityDetails.annualTurnover}
              </Descriptions.Item>
            )}
            {isHUF && entityDetails?.kartaName && (
              <Descriptions.Item label="Karta Name">{entityDetails.kartaName}</Descriptions.Item>
            )}
            {isHUF && entityDetails?.kartaPan && (
              <Descriptions.Item label="Karta PAN">
                <Text code>{entityDetails.kartaPan}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Authorized Signatories */}
          {authorizedSignatories.length > 0 && (
            <>
              <Divider />
              {authorizedSignatories.map((sig, i) => (
                <Descriptions
                  key={i}
                  title={`Authorized Signatory ${i + 1}`}
                  bordered
                  size="small"
                  column={3}
                  style={{ marginBottom: 16 }}
                >
                  <Descriptions.Item label="Name">{sig.name}</Descriptions.Item>
                  <Descriptions.Item label="Designation">{sig.designation}</Descriptions.Item>
                  <Descriptions.Item label="PAN">
                    <Text code>{sig.pan}</Text>
                  </Descriptions.Item>
                  {sig.din && (
                    <Descriptions.Item label="DIN">
                      <Text code>{sig.din}</Text>
                    </Descriptions.Item>
                  )}
                  {sig.mobile && (
                    <Descriptions.Item label="Mobile">{sig.mobile}</Descriptions.Item>
                  )}
                  {sig.email && (
                    <Descriptions.Item label="Email">{sig.email}</Descriptions.Item>
                  )}
                </Descriptions>
              ))}
            </>
          )}
        </>
      )}

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

      {/* Nominee (individual only) */}
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

      {/* Joint Holders */}
      {jointHolders.length > 0 && (
        <>
          <Divider />
          {jointHolders.map((h) => (
            <Descriptions
              key={h.holderNumber}
              title={`${h.holderNumber === 2 ? '2nd' : '3rd'} Joint Holder`}
              bordered
              size="small"
              column={3}
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="Name">
                {h.firstName} {h.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="PAN">
                <Text code>{h.pan}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="DOB">{h.dob}</Descriptions.Item>
              <Descriptions.Item label="Relationship">{h.relationship}</Descriptions.Item>
            </Descriptions>
          ))}
        </>
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
            {dematAccount.segments.length > 0 && (
              <Descriptions.Item label="Trading Segments" span={2}>
                <Space>
                  {dematAccount.segments.map((s) => (
                    <Tag key={s} color="blue">
                      {s}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        </>
      )}

      {/* FATCA */}
      {fatca && (
        <>
          <Divider />
          <Descriptions
            title="FATCA / CRS"
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Tax Residency Country">{fatca.taxCountry}</Descriptions.Item>
            <Descriptions.Item label="TIN">{fatca.tin ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="US Person">
              <Tag color={fatca.isUsPerson ? 'red' : 'green'}>
                {fatca.isUsPerson ? 'Yes' : 'No'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Source of Wealth">{fatca.sourceOfWealth}</Descriptions.Item>
          </Descriptions>
        </>
      )}

      {/* Declaration */}
      {declaration && (
        <>
          <Divider />
          <Descriptions
            title="Declaration"
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Information Accurate">
              <Tag color={declaration.informationAccurate ? 'green' : 'red'}>
                {declaration.informationAccurate ? 'Confirmed' : 'Not Confirmed'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Terms Accepted">
              <Tag color={declaration.acceptedTerms ? 'green' : 'red'}>
                {declaration.acceptedTerms ? 'Accepted' : 'Not Accepted'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </>
      )}

      {isError && (
        <Alert
          type="warning"
          showIcon
          message="Submission Error"
          description={
            (error as Error)?.message ??
            'The backend API returned an error. Please check your details and try again.'
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
