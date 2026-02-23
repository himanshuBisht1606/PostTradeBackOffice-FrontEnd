import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Select, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getChargesConfig } from '../../services/chargesService';
import { DataTable } from '@shared/components/data-display/DataTable';
import { MaskedField } from '@shared/components/data-display/MaskedField';
import { formatDate, formatPercent, truncateId } from '@utils/formatters';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Permission } from '@types/roles.types';
import { ChargeType } from '@types/enums';
import type { ChargeConfig } from '../../services/chargesService';

const { Title } = Typography;

export function ChargesConfigPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [chargeType, setChargeType] = useState<ChargeType | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(true);
  const canViewSensitive = useAuthStore((s) => s.hasPermission(Permission.VIEW_SENSITIVE_FIELDS));

  const { data: allData, isLoading } = useQuery({
    queryKey: ['charges-config', { chargeType, isActive }],
    queryFn: () => getChargesConfig({ chargeType, isActive }),
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
      render: (v: number) =>
        canViewSensitive ? formatPercent(v, 4) : <MaskedField />,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>
      ),
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
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Charges Configuration
      </Title>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select<ChargeType>
            placeholder="Charge Type"
            style={{ width: '100%' }}
            allowClear
            value={chargeType}
            onChange={(v) => { setChargeType(v); setPage(1); }}
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
          <Select<boolean>
            placeholder="Active"
            style={{ width: '100%' }}
            allowClear
            value={isActive}
            onChange={(v) => { setIsActive(v); setPage(1); }}
            options={[
              { label: 'Active', value: true },
              { label: 'Inactive', value: false },
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
    </div>
  );
}
