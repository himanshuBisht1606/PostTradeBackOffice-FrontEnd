import { useState, useCallback } from 'react';
import {
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Input,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Tooltip,
  Table,
} from 'antd';
import {
  SearchOutlined,
  CalculatorOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { formatCurrency, formatDate } from '@utils/formatters';
import {
  getFoFinanceLedger,
  computeFoFinanceLedger,
  deleteFoFinanceLedger,
} from '../../services/foFinanceLedgerService';
import type { FoFinanceLedgerItem } from '../../services/foFinanceLedgerService';

const { Title } = Typography;

const today = dayjs().format('YYYY-MM-DD');

function NetAmountTag({ value }: { value: number }) {
  if (value === 0) return <span style={{ color: '#8c8c8c' }}>—</span>;
  const color = value > 0 ? '#52c41a' : '#f5222d';
  const label = value > 0 ? `+${formatCurrency(value)}` : formatCurrency(value);
  return <span style={{ color, fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{label}</span>;
}

export function FoFinanceLedgerPage() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const [tradeDate, setTradeDate] = useState<string>(today);
  const [exchange, setExchange] = useState<string>('NFO');
  const [clientCodeSearch, setClientCodeSearch] = useState('');

  const queryKey = ['fo-finance-ledger', tradeDate, exchange, clientCodeSearch];

  const { data = [], isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      getFoFinanceLedger({
        tradeDate,
        exchange: exchange || undefined,
        clientCode: clientCodeSearch.trim() || undefined,
      }),
    staleTime: 30_000,
  });

  const computeMutation = useMutation({
    mutationFn: () => computeFoFinanceLedger({ tradeDate, exchange }),
    onSuccess: (result) => {
      void messageApi.success(result.message);
      void queryClient.invalidateQueries({ queryKey: ['fo-finance-ledger'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const msg = err?.response?.data?.message ?? 'Failed to compute finance ledger';
      void messageApi.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFoFinanceLedger(tradeDate, exchange),
    onSuccess: () => {
      void messageApi.success(`Finance ledger deleted for ${tradeDate} / ${exchange}`);
      void queryClient.invalidateQueries({ queryKey: ['fo-finance-ledger'] });
    },
    onError: () => {
      void messageApi.error('Failed to delete finance ledger');
    },
  });

  const handleCompute = useCallback(() => {
    if (data.length > 0) {
      Modal.confirm({
        title: 'Recompute Finance Ledger?',
        content: `Finance ledger already exists for ${tradeDate} / ${exchange}. Delete it first, then recompute?`,
        okText: 'Delete & Recompute',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          await deleteMutation.mutateAsync();
          computeMutation.mutate();
        },
      });
    } else {
      computeMutation.mutate();
    }
  }, [data.length, tradeDate, exchange, computeMutation, deleteMutation]);

  const handleDelete = useCallback(() => {
    Modal.confirm({
      title: 'Delete Finance Ledger?',
      content: `This will remove all finance ledger rows for ${tradeDate} / ${exchange}. You can recompute after.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(),
    });
  }, [tradeDate, exchange, deleteMutation]);

  const columns: TableColumnsType<FoFinanceLedgerItem> = [
    {
      title: 'Trade Date',
      dataIndex: 'tradeDate',
      width: 100,
      fixed: 'left',
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Exchange',
      dataIndex: 'exchange',
      width: 70,
      render: (v: string) => <Tag style={{ margin: 0 }}>{v}</Tag>,
    },
    {
      title: 'Client Code',
      dataIndex: 'clientCode',
      width: 110,
      fixed: 'left',
      render: (v: string) => <strong style={{ fontFamily: 'monospace' }}>{v}</strong>,
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      width: 160,
      ellipsis: true,
      render: (v: string | null) => v ?? <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    // ── Turnover ──────────────────────────────────────────────────────────────
    {
      title: 'Buy Turnover',
      dataIndex: 'buyTurnover',
      width: 130,
      align: 'right',
      render: (v: number) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Sell Turnover',
      dataIndex: 'sellTurnover',
      width: 130,
      align: 'right',
      render: (v: number) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Total Turnover',
      dataIndex: 'totalTurnover',
      width: 130,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{formatCurrency(v)}</span>
      ),
    },
    // ── Charges ───────────────────────────────────────────────────────────────
    {
      title: 'STT',
      dataIndex: 'totalStt',
      width: 100,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#fa8c16' }}>{formatCurrency(v)}</span>
      ),
    },
    {
      title: 'Stamp Duty',
      dataIndex: 'totalStampDuty',
      width: 105,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#fa8c16' }}>{formatCurrency(v)}</span>
      ),
    },
    {
      title: 'Brokerage',
      dataIndex: 'brokerage',
      width: 105,
      align: 'right',
      render: (v: number) =>
        v > 0 ? (
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#fa8c16' }}>{formatCurrency(v)}</span>
        ) : (
          <Tooltip title="Pending — computed in Contract Charges step">
            <span style={{ color: '#bfbfbf', fontSize: 12 }}>—</span>
          </Tooltip>
        ),
    },
    {
      title: 'Total Charges',
      dataIndex: 'totalCharges',
      width: 120,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#cf1322' }}>
          {formatCurrency(v)}
        </span>
      ),
    },
    // ── Settlement ────────────────────────────────────────────────────────────
    {
      title: 'Daily MTM',
      dataIndex: 'dailyMtmSettlement',
      width: 115,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: v >= 0 ? '#389e0d' : '#cf1322' }}>
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      title: 'Net Premium',
      dataIndex: 'netPremium',
      width: 110,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: v >= 0 ? '#389e0d' : '#cf1322' }}>
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      title: 'Final Settlement',
      dataIndex: 'finalSettlement',
      width: 130,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: v >= 0 ? '#389e0d' : '#cf1322' }}>
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      title: 'Exercise / Assign',
      dataIndex: 'exerciseAssignmentValue',
      width: 130,
      align: 'right',
      render: (v: number) => (
        v !== 0
          ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: v >= 0 ? '#389e0d' : '#cf1322' }}>{formatCurrency(v)}</span>
          : <span style={{ color: '#bfbfbf' }}>—</span>
      ),
    },
    // ── Net ───────────────────────────────────────────────────────────────────
    {
      title: 'Net Amount',
      dataIndex: 'netAmount',
      width: 130,
      align: 'right',
      fixed: 'right',
      render: (v: number) => <NetAmountTag value={v} />,
    },
  ];

  const isBusy = computeMutation.isPending || deleteMutation.isPending;

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
          FO Finance Ledger
        </Title>
        {data.length > 0 && (
          <Tag color="blue">{data.length.toLocaleString('en-IN')} client(s)</Tag>
        )}
      </div>

      {/* ── Filters + Actions ─────────────────────────────────────────────── */}
      <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col span={5}>
            <DatePicker
              style={{ width: '100%' }}
              value={dayjs(tradeDate)}
              onChange={(d) => {
                if (d) setTradeDate(d.format('YYYY-MM-DD'));
              }}
              allowClear={false}
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={exchange}
              onChange={(v) => setExchange(v)}
              options={[
                { label: 'NFO (NSE F&O)', value: 'NFO' },
                { label: 'BFO (BSE F&O)', value: 'BFO' },
              ]}
            />
          </Col>
          <Col span={5}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Filter by client code"
              value={clientCodeSearch}
              allowClear
              onChange={(e) => setClientCodeSearch(e.target.value)}
            />
          </Col>
          <Col flex="auto" />
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => void queryClient.invalidateQueries({ queryKey })}
                loading={isFetching && !isBusy}
              >
                Refresh
              </Button>
              {data.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  loading={deleteMutation.isPending}
                >
                  Delete
                </Button>
              )}
              <Button
                type="primary"
                icon={<CalculatorOutlined />}
                onClick={handleCompute}
                loading={computeMutation.isPending}
              >
                Compute
              </Button>
            </Space>
          </Col>
        </Row>
      </Space>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <DataTable<FoFinanceLedgerItem>
        columns={columns}
        dataSource={data}
        loading={isLoading || isBusy}
        rowKey="id"
        size="small"
        scroll={{ x: 1900 }}
        pagination={false}
        summary={(pageData) => {
          if (pageData.length === 0) return null;

          const sum = (key: keyof FoFinanceLedgerItem) =>
            pageData.reduce((acc, r) => acc + (r[key] as number), 0);

          return (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={4}>
                  Total ({pageData.length} clients)
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCurrency(sum('buyTurnover'))}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCurrency(sum('sellTurnover'))}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCurrency(sum('totalTurnover'))}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#fa8c16' }}>{formatCurrency(sum('totalStt'))}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#fa8c16' }}>{formatCurrency(sum('totalStampDuty'))}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">
                  <span style={{ color: '#bfbfbf', fontSize: 12 }}>—</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#cf1322' }}>{formatCurrency(sum('totalCharges'))}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCurrency(sum('dailyMtmSettlement'))}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCurrency(sum('netPremium'))}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCurrency(sum('finalSettlement'))}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCurrency(sum('exerciseAssignmentValue'))}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="right">
                  <NetAmountTag value={sum('netAmount')} />
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </div>
  );
}
