import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Select, Tag, Button } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getChargesConfig } from '../../services/chargesService';
import { DataTable } from '@shared/components/data-display/DataTable';
import { MaskedField } from '@shared/components/data-display/MaskedField';
import { ChargeConfigFormModal } from './ChargeConfigFormModal';
import { formatDate, formatPercent, truncateId } from '@utils/formatters';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Permission, Role } from '@app-types/roles.types';
import { ChargeType } from '@app-types/enums';
import type { ChargeConfig } from '../../services/chargesService';

const { Title } = Typography;

const CAN_CREATE_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner, Role.FinanceController];

export function ChargesConfigPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [chargeType, setChargeType] = useState<ChargeType | undefined>(undefined);
  const [isActive, setIsActive] = useState<'true' | 'false' | undefined>('true');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const canViewSensitive = useAuthStore((s) => s.hasPermission(Permission.VIEW_SENSITIVE_FIELDS));
  const { hasRole } = useAuthStore();
  const canCreate = hasRole(CAN_CREATE_ROLES);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['charges-config', { chargeType, isActive }],
    queryFn: () =>
      getChargesConfig({
        chargeType,
        isActive: isActive === undefined ? undefined : isActive === 'true',
      }),
    staleTime: 30_000,
  });

  const pageData = useMemo(
    () => (allData ?? []).slice((page - 1) * pageSize, page * pageSize),
    [allData, page, pageSize],
  );

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const columns: TableColumnsType<ChargeConfig> = [
    { title: 'Name', dataIndex: 'chargeName', ellipsis: true },
    {
      title: 'Type',
      dataIndex: 'chargeType',
      width: 130,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Calculation',
      dataIndex: 'calculationType',
      width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Rate / %',
      dataIndex: 'rate',
      width: 110,
      align: 'right',
      render: (v: number) => (canViewSensitive ? formatPercent(v, 4) : <MaskedField />),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: 'Effective From',
      dataIndex: 'effectiveFrom',
      width: 130,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Effective To',
      dataIndex: 'effectiveTo',
      width: 130,
      render: (v: string | null) => (v ? formatDate(v) : '—'),
    },
    {
      title: 'ID',
      dataIndex: 'chargesConfigId',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            Charges Configuration
          </Title>
        </Col>
        {canCreate && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalOpen(true)}
            >
              Add Charge
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select<ChargeType>
            placeholder="Charge Type"
            style={{ width: '100%' }}
            allowClear
            value={chargeType ?? null}
            onChange={(v) => {
              setChargeType(v);
              setPage(1);
            }}
            options={[
              { label: 'Brokerage', value: ChargeType.Brokerage },
              { label: 'STT', value: ChargeType.STT },
              { label: 'GST', value: ChargeType.GST },
              { label: 'Exchange Txn', value: ChargeType.ExchangeTxn },
              { label: 'SEBI', value: ChargeType.SEBI },
              { label: 'Stamp Duty', value: ChargeType.StampDuty },
            ]}
          />
        </Col>
        <Col span={5}>
          <Select<'true' | 'false'>
            placeholder="Active"
            style={{ width: '100%' }}
            allowClear
            value={isActive ?? null}
            onChange={(v) => {
              setIsActive(v);
              setPage(1);
            }}
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
          />
        </Col>
      </Row>

      <DataTable<ChargeConfig>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="chargesConfigId"
        pagination={{
          current: page,
          pageSize,
          total: allData?.length ?? 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} configurations`,
        }}
      />

      <ChargeConfigFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}
