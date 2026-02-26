import { useState } from 'react';
import { Typography, Card, Button, DatePicker, Row, Col, Descriptions, Alert, Tag } from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { runEod, getEodStatus } from '../services/eodService';
import { formatDate } from '@utils/formatters';
import { notifySuccess, notifyError } from '@utils/errorHandler';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@app-types/roles.types';

const { Title } = Typography;

const CAN_RUN_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner];

const STATUS_COLOR: Record<string, string> = {
  Completed: 'green',
  Running: 'processing',
  Failed: 'red',
  NotRun: 'default',
};

export function EodPanel() {
  const [statusDate, setStatusDate] = useState<ReturnType<typeof dayjs>>(dayjs());
  const { hasRole } = useAuthStore();
  const canRun = hasRole(CAN_RUN_ROLES);

  const {
    data: eodStatus,
    isLoading: statusLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ['eod-status', statusDate.format('YYYY-MM-DD')],
    queryFn: () => getEodStatus(statusDate.format('YYYY-MM-DD')),
    retry: false,
    staleTime: 30_000,
  });

  const runMutation = useMutation({
    mutationFn: runEod,
    onSuccess: () => {
      notifySuccess('EOD job triggered', 'Processing will complete in the background.');
      void refetch();
    },
    onError: (err) => notifyError(err, 'Failed to trigger EOD'),
  });

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            End of Day (EOD)
          </Title>
        </Col>
        {canRun && (
          <Col>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={runMutation.isPending}
              onClick={() => runMutation.mutate()}
              danger
            >
              Run EOD
            </Button>
          </Col>
        )}
      </Row>

      {!canRun && (
        <Alert
          message="Read-only access"
          description="Only PlatformSuperAdmin and TenantOwner can trigger EOD processing."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Card
        title="EOD Status Lookup"
        extra={
          <Button
            icon={<ReloadOutlined />}
            size="small"
            loading={statusLoading}
            onClick={() => void refetch()}
          >
            Refresh
          </Button>
        }
        style={{ maxWidth: 640 }}
      >
        <Row gutter={12} style={{ marginBottom: 20 }}>
          <Col span={12}>
            <DatePicker
              style={{ width: '100%' }}
              value={statusDate}
              onChange={(d) => {
                if (d) setStatusDate(d);
              }}
            />
          </Col>
        </Row>

        {isError && (
          <Alert
            message="No EOD record found for the selected date."
            type="warning"
            showIcon
          />
        )}

        {eodStatus && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Date">
              {formatDate(eodStatus.date)}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLOR[eodStatus.status] ?? 'default'}>
                {eodStatus.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Started At">
              {eodStatus.startedAt ? new Date(eodStatus.startedAt).toLocaleString() : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Completed At">
              {eodStatus.completedAt ? new Date(eodStatus.completedAt).toLocaleString() : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Triggered By">
              {eodStatus.triggeredBy ?? '—'}
            </Descriptions.Item>
            {eodStatus.error && (
              <Descriptions.Item label="Error">
                <span style={{ color: '#f5222d' }}>{eodStatus.error}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Card>
    </div>
  );
}
