import { useState } from 'react';
import { Button, Select, Space, Typography, Alert, Descriptions, Tag, Divider, Form } from 'antd';
import {
  BranchesOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getBranches } from '../../../master-setup/services/branchService';
import type { BranchRecord } from '../../../master-setup/services/branchService';
import { useOnboardingStore } from '../../store/onboardingStore';

const { Title, Text } = Typography;

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function BranchSelectionStep({ onNext, onPrev }: Props) {
  const { branch, setBranch } = useOnboardingStore();
  const [selectedBranch, setSelectedBranch] = useState<BranchRecord | null>(null);
  const [touched, setTouched] = useState(false);

  const { data: branches = [], isLoading, isError } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    staleTime: 60_000,
  });

  const options = branches
    .filter((b) => b.isActive)
    .map((b) => ({
      value: b.branchId,
      label: `${b.branchCode} — ${b.branchName}`,
    }));

  const handleChange = (value: string | undefined) => {
    setTouched(true);
    if (!value) {
      setBranch(null);
      setSelectedBranch(null);
      return;
    }
    const found = branches.find((b) => b.branchId === value) ?? null;
    setSelectedBranch(found);
    if (found) {
      setBranch({
        branchId: found.branchId,
        branchCode: found.branchCode,
        branchName: found.branchName,
      });
    }
  };

  const handleNext = () => {
    setTouched(true);
    if (!branch) return;
    onNext();
  };

  // Restore the selectedBranch object on re-mount if store already has a branch selected
  const displayBranch =
    selectedBranch ??
    (branch ? (branches.find((b) => b.branchId === branch.branchId) ?? null) : null);

  return (
    <div>
      <Title level={5} style={{ color: '#1d3557', marginBottom: 4 }}>
        Branch Assignment
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Select the branch under which this client will be registered. A branch must be selected
        before proceeding.
      </Text>

      {isError && (
        <Alert
          type="error"
          showIcon
          message="Could not load branches. Please refresh the page and try again."
          style={{ marginBottom: 20 }}
        />
      )}

      <div style={{ maxWidth: 520 }}>
        <Form layout="vertical">
          <Form.Item
            label={
              <Text strong>
                <BranchesOutlined style={{ marginRight: 6 }} />
                Branch <span style={{ color: '#ff4d4f' }}>*</span>
              </Text>
            }
            validateStatus={touched && !branch ? 'error' : ''}
            help={touched && !branch ? 'Please select a branch to continue' : undefined}
          >
            <Select
              style={{ width: '100%' }}
              placeholder="Select a branch"
              loading={isLoading}
              showSearch
              value={branch?.branchId ?? undefined}
              onChange={handleChange}
              filterOption={(input, opt) =>
                (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={options}
              size="large"
              {...(touched && !branch ? { status: 'error' as const } : {})}
            />
          </Form.Item>
        </Form>
      </div>

      {displayBranch && (
        <>
          <Divider style={{ marginTop: 28, marginBottom: 20 }} />
          <div
            style={{
              background: '#f6f9ff',
              border: '1px solid #d0e2ff',
              borderRadius: 8,
              padding: '16px 20px',
              maxWidth: 680,
            }}
          >
            <Space style={{ marginBottom: 14 }} align="center">
              <BranchesOutlined style={{ color: '#1d3557', fontSize: 16 }} />
              <Text strong style={{ fontSize: 14, color: '#1d3557' }}>
                {displayBranch.branchCode} — {displayBranch.branchName}
              </Text>
              <Tag color={displayBranch.isActive ? 'green' : 'default'}>
                {displayBranch.isActive ? 'Active' : 'Inactive'}
              </Tag>
            </Space>

            <Descriptions
              bordered
              column={2}
              size="small"
              labelStyle={{ background: '#eef4ff', fontWeight: 500, width: 140 }}
              contentStyle={{ background: '#fff' }}
            >
              {displayBranch.address && (
                <Descriptions.Item
                  label={
                    <Space size={4}>
                      <EnvironmentOutlined />
                      Address
                    </Space>
                  }
                  span={2}
                >
                  {displayBranch.address}
                </Descriptions.Item>
              )}

              {displayBranch.city && (
                <Descriptions.Item label="City">{displayBranch.city}</Descriptions.Item>
              )}

              <Descriptions.Item label="State">
                {displayBranch.stateName}{' '}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({displayBranch.stateCode})
                </Text>
              </Descriptions.Item>

              {displayBranch.gstin && (
                <Descriptions.Item label="GSTIN" span={2}>
                  <Text code>{displayBranch.gstin}</Text>
                </Descriptions.Item>
              )}

              {displayBranch.contactPerson && (
                <Descriptions.Item
                  label={
                    <Space size={4}>
                      <UserOutlined />
                      Contact Person
                    </Space>
                  }
                >
                  {displayBranch.contactPerson}
                </Descriptions.Item>
              )}

              {displayBranch.contactPhone && (
                <Descriptions.Item
                  label={
                    <Space size={4}>
                      <PhoneOutlined />
                      Phone
                    </Space>
                  }
                >
                  {displayBranch.contactPhone}
                </Descriptions.Item>
              )}

              {displayBranch.contactEmail && (
                <Descriptions.Item
                  label={
                    <Space size={4}>
                      <MailOutlined />
                      Email
                    </Space>
                  }
                  span={2}
                >
                  {displayBranch.contactEmail}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        </>
      )}

      <Space style={{ marginTop: 32 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" onClick={handleNext}>
          Next
        </Button>
      </Space>
    </div>
  );
}
