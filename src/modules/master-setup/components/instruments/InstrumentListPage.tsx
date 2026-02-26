import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Input, Select, Button, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getInstruments } from '../../services/instrumentService';
import { getExchanges } from '../../services/exchangeService';
import type { Instrument } from '../../services/instrumentService';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { InstrumentFormModal } from './InstrumentFormModal';
import { truncateId } from '@utils/formatters';
import { InstrumentType } from '@app-types/enums';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@app-types/roles.types';

const { Title } = Typography;

const CAN_MANAGE_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner];

export function InstrumentListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [exchangeId, setExchangeId] = useState<string | undefined>(undefined);
  const [type, setType] = useState<InstrumentType | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Instrument | undefined>(undefined);

  const { hasRole } = useAuthStore();
  const canManage = hasRole(CAN_MANAGE_ROLES);

  const { data: exchanges } = useQuery({
    queryKey: ['exchanges'],
    queryFn: getExchanges,
    staleTime: 60_000,
  });

  const { data: allData, isLoading } = useQuery({
    queryKey: ['instruments', { exchangeId, type }],
    queryFn: () => getInstruments({ exchangeId, type }),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!allData) return [];
    const q = search.toLowerCase();
    if (!q) return allData;
    return allData.filter(
      (i) =>
        i.symbol.toLowerCase().includes(q) ||
        i.instrumentName.toLowerCase().includes(q) ||
        i.isin.toLowerCase().includes(q),
    );
  }, [allData, search]);

  const pageData = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditTarget(undefined);
  }, []);

  const columns: TableColumnsType<Instrument> = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      width: 120,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    { title: 'Name', dataIndex: 'instrumentName', ellipsis: true },
    { title: 'ISIN', dataIndex: 'isin', width: 140, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    {
      title: 'Type',
      dataIndex: 'instrumentType',
      width: 110,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    { title: 'Currency', dataIndex: 'currency', width: 90 },
    { title: 'Lot Size', dataIndex: 'lotSize', width: 90, align: 'right' },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: 'ID',
      dataIndex: 'instrumentId',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
    ...(canManage
      ? [
          {
            title: '',
            key: 'actions',
            width: 70,
            render: (_: unknown, record: Instrument) => (
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTarget(record);
                  setModalOpen(true);
                }}
              >
                Edit
              </Button>
            ),
          } as TableColumnsType<Instrument>[number],
        ]
      : []),
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            Instruments
          </Title>
        </Col>
        {canManage && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditTarget(undefined);
                setModalOpen(true);
              }}
            >
              Add Instrument
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search symbol, name or ISIN"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select
            placeholder="Exchange"
            style={{ width: '100%' }}
            allowClear
            value={exchangeId ?? null}
            onChange={(v: string) => {
              setExchangeId(v);
              setPage(1);
            }}
            options={(exchanges ?? []).map((e) => ({
              label: `${e.exchangeCode} — ${e.exchangeName}`,
              value: e.exchangeId,
            }))}
          />
        </Col>
        <Col span={5}>
          <Select<InstrumentType>
            placeholder="Type"
            style={{ width: '100%' }}
            allowClear
            value={type ?? null}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            options={[
              { label: 'Equity', value: InstrumentType.Equity },
              { label: 'Derivative', value: InstrumentType.Derivative },
              { label: 'Future', value: InstrumentType.Future },
              { label: 'Option', value: InstrumentType.Option },
              { label: 'Currency', value: InstrumentType.Currency },
              { label: 'Commodity', value: InstrumentType.Commodity },
            ]}
          />
        </Col>
      </Row>

      <DataTable<Instrument>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="instrumentId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} instruments`,
        }}
      />

      <InstrumentFormModal
        open={modalOpen}
        onClose={handleModalClose}
        initialData={editTarget}
      />
    </div>
  );
}
