import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Select, Tag, Button } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getLedgerEntries } from '../../services/ledgerService';
import { DataTable } from '@shared/components/data-display/DataTable';
import { PostLedgerEntryModal } from './PostLedgerEntryModal';
import { formatCurrency, formatDate, truncateId } from '@utils/formatters';
import { LedgerType, EntryType } from '@app-types/enums';
import type { LedgerEntry } from '../../services/ledgerService';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@app-types/roles.types';

const { Title } = Typography;

const CAN_POST_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner, Role.FinanceController];

export function LedgerPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [ledgerType, setLedgerType] = useState<LedgerType | undefined>(undefined);
  const [entryType, setEntryType] = useState<EntryType | undefined>(undefined);
  const [postModalOpen, setPostModalOpen] = useState(false);

  const { hasRole } = useAuthStore();
  const canPost = hasRole(CAN_POST_ROLES);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['ledger', { ledgerType, entryType }],
    queryFn: () => getLedgerEntries({ ledgerType, entryType }),
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

  const columns: TableColumnsType<LedgerEntry> = [
    {
      title: 'Posting Date',
      dataIndex: 'postingDate',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Voucher No',
      dataIndex: 'voucherNo',
      width: 140,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: 'Ledger Type',
      dataIndex: 'ledgerType',
      width: 140,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Entry',
      dataIndex: 'entryType',
      width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Debit',
      dataIndex: 'debit',
      width: 130,
      align: 'right',
      render: (v: number) =>
        v > 0 ? <span style={{ color: '#f5222d' }}>{formatCurrency(v)}</span> : '—',
    },
    {
      title: 'Credit',
      dataIndex: 'credit',
      width: 130,
      align: 'right',
      render: (v: number) =>
        v > 0 ? <span style={{ color: '#52c41a' }}>{formatCurrency(v)}</span> : '—',
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      width: 130,
      align: 'right',
      render: (v: number) => formatCurrency(v),
    },
    { title: 'Ref Type', dataIndex: 'referenceType', width: 120 },
    { title: 'Narration', dataIndex: 'narration', ellipsis: true },
    {
      title: 'ID',
      dataIndex: 'ledgerId',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 4 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            General Ledger
          </Title>
        </Col>
        {canPost && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setPostModalOpen(true)}
            >
              Post Entry
            </Button>
          </Col>
        )}
      </Row>
      <p style={{ color: '#8c8c8c', marginBottom: 16, fontSize: 13 }}>
        Append-only financial record
      </p>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select<LedgerType>
            placeholder="Ledger Type"
            style={{ width: '100%' }}
            allowClear
            value={ledgerType ?? null}
            onChange={(v) => {
              setLedgerType(v);
              setPage(1);
            }}
            options={[
              { label: 'Client Ledger', value: LedgerType.ClientLedger },
              { label: 'Broker Ledger', value: LedgerType.BrokerLedger },
              { label: 'Cash Ledger', value: LedgerType.CashLedger },
              { label: 'Securities Ledger', value: LedgerType.SecuritiesLedger },
            ]}
          />
        </Col>
        <Col span={6}>
          <Select<EntryType>
            placeholder="Entry Type"
            style={{ width: '100%' }}
            allowClear
            value={entryType ?? null}
            onChange={(v) => {
              setEntryType(v);
              setPage(1);
            }}
            options={[
              { label: 'Trade', value: EntryType.Trade },
              { label: 'Charges', value: EntryType.Charges },
              { label: 'Payment', value: EntryType.Payment },
              { label: 'Receipt', value: EntryType.Receipt },
              { label: 'Adjustment', value: EntryType.Adjustment },
              { label: 'Corporate Action', value: EntryType.CorporateAction },
            ]}
          />
        </Col>
      </Row>

      <DataTable<LedgerEntry>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="ledgerId"
        pagination={{
          current: page,
          pageSize,
          total: allData?.length ?? 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} entries`,
        }}
      />

      <PostLedgerEntryModal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
      />
    </div>
  );
}
