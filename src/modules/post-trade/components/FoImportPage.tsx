import { useState, useCallback } from 'react';
import {
  Typography,
  Tabs,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Tag,
  Space,
  Popconfirm,
  message,
  Alert,
  Divider,
  Card,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UploadOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@shared/components/data-display/DataTable';
import { CmFileUploadModal } from './CmFileUploadModal';
import { FoBatchLogsDrawer } from './FoBatchLogsDrawer';
import {
  getFoImportBatches,
  deleteFoImportBatch,
  importFoContractMaster,
  importFoTrade,
  importFoBhavCopy,
  importFoStt,
  importFoStampDuty,
  importFoPosition,
} from '../services/foImportService';
import type { FoImportBatch, ImportResult } from '../types/foImport.types';
import { FoFileType, FoImportStatus } from '@app-types/enums';

const { Title, Text } = Typography;

// ── Status helpers ────────────────────────────────────────────────────────────

const statusColor: Record<FoImportStatus, string> = {
  [FoImportStatus.Pending]: 'default',
  [FoImportStatus.Processing]: 'processing',
  [FoImportStatus.Completed]: 'success',
  [FoImportStatus.Failed]: 'error',
};

function StatusTag({ status }: { status: FoImportStatus }) {
  return <Tag color={statusColor[status]}>{status}</Tag>;
}

// ── FO exchanges ──────────────────────────────────────────────────────────────

const FO_EXCHANGES = [
  { label: 'NFO (NSE F&O)', value: 'NFO' },
  { label: 'BFO (BSE F&O)', value: 'BFO' },
];

// ── File import definitions ───────────────────────────────────────────────────

type FileImportDef = {
  key: string;
  label: string;
  fileType: FoFileType | 'ContractMaster';
  isPrerequisite: boolean;
  prerequisiteNote?: string;
  csvHint: string;
  importFn: (f: File, d: string, e: string) => Promise<ImportResult>;
};

const FILE_DEFS: FileImportDef[] = [
  {
    key: 'contract-master',
    label: 'Contract Master',
    fileType: 'ContractMaster',
    isPrerequisite: true,
    csvHint: 'NSE: NSE_FO_contract_DDMMYYYY.csv | BSE: BSE_EQD_CONTRACT_DDMMYYYY.csv — columns: FinInstrmId, TckrSymb, XpryDt, StrkPric, OptnTp, NewBrdLotQty, ...',
    importFn: importFoContractMaster,
  },
  {
    key: 'trade',
    label: 'Trade File',
    fileType: FoFileType.Trade,
    isPrerequisite: false,
    prerequisiteNote: 'Requires Contract Master',
    csvHint: 'Trade_NSE_FO_... or Trade_BSE_FO_... — exchange-standard format, header row. Exchange param: NFO for NSE, BFO for BSE.',
    importFn: importFoTrade,
  },
  {
    key: 'bhavcopy',
    label: 'BhavCopy',
    fileType: FoFileType.BhavCopy,
    isPrerequisite: false,
    csvHint: 'BhavCopy_NSE_FO_... or BhavCopy_BSE_FO_... — exchange-standard format with OHLC, settlement price, open interest.',
    importFn: importFoBhavCopy,
  },
  {
    key: 'stt',
    label: 'STT',
    fileType: FoFileType.Stt,
    isPrerequisite: false,
    csvHint: 'STT_NCL_FO_... — RptHdr-based format. Client-level rows (RptHdr=30) are imported. Exchange: NFO.',
    importFn: importFoStt,
  },
  {
    key: 'stamp-duty',
    label: 'Stamp Duty',
    fileType: FoFileType.StampDuty,
    isPrerequisite: false,
    csvHint: 'StampDuty_NCL_FO_... — RptHdr-based format. Client-level rows (RptHdr=30) are imported. Exchange: NFO.',
    importFn: importFoStampDuty,
  },
  {
    key: 'position',
    label: 'Position',
    fileType: FoFileType.Position,
    isPrerequisite: false,
    csvHint: 'Position_NCL_FO_... — position/obligation file with long/short quantities, exercise/assignment. Exchange: NFO.',
    importFn: importFoPosition,
  },
];

// ── Tab: Daily Import ─────────────────────────────────────────────────────────

function DailyImportTab({
  tradingDate,
  exchange,
  onInvalidateBatches,
}: {
  tradingDate: string;
  exchange: string;
  onInvalidateBatches: () => void;
}) {
  const [uploadDef, setUploadDef] = useState<FileImportDef | null>(null);

  const prereqs = FILE_DEFS.filter((d) => d.isPrerequisite);
  const dailyFiles = FILE_DEFS.filter((d) => !d.isPrerequisite);

  function renderFileRow(def: FileImportDef) {
    return (
      <Row
        key={def.key}
        align="middle"
        style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}
        gutter={12}
      >
        <Col flex="none" style={{ color: '#1d3557' }}>
          <FileTextOutlined style={{ fontSize: 18 }} />
        </Col>
        <Col flex="auto">
          <Space direction="vertical" size={0}>
            <Text strong>{def.label}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {def.csvHint}
            </Text>
            {def.prerequisiteNote && (
              <Text type="warning" style={{ fontSize: 11 }}>
                <ExclamationCircleOutlined /> {def.prerequisiteNote}
              </Text>
            )}
          </Space>
        </Col>
        <Col flex="none">
          <Button
            size="small"
            icon={<UploadOutlined />}
            onClick={() => setUploadDef(def)}
            disabled={!tradingDate || !exchange}
          >
            Upload
          </Button>
        </Col>
      </Row>
    );
  }

  return (
    <>
      {(!tradingDate || !exchange) && (
        <Alert
          type="info"
          showIcon
          message="Select a Trading Date and Exchange above to enable file uploads."
          style={{ marginBottom: 16 }}
        />
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <Text strong style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Prerequisites (import first)
        </Text>
        <Divider style={{ margin: '8px 0' }} />
        {prereqs.map(renderFileRow)}
      </Card>

      <Card size="small">
        <Text strong style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Daily Files
        </Text>
        <Divider style={{ margin: '8px 0' }} />
        {dailyFiles.map(renderFileRow)}
      </Card>

      {uploadDef && (
        <CmFileUploadModal
          open={true}
          onClose={() => setUploadDef(null)}
          title={`Import FO ${uploadDef.label}`}
          csvHint={uploadDef.csvHint}
          tradingDate={tradingDate}
          exchange={exchange}
          onImport={uploadDef.importFn as (f: File, d: string, e: string) => Promise<{ created: number; skipped: number; errors: { row: number; reason: string }[] }>}
          onSuccess={() => {
            setUploadDef(null);
            onInvalidateBatches();
          }}
        />
      )}
    </>
  );
}

// ── Tab: Batch History ────────────────────────────────────────────────────────

function BatchHistoryTab({ tradingDate, exchange }: { tradingDate: string; exchange: string }) {
  const queryClient = useQueryClient();
  const [logsForBatch, setLogsForBatch] = useState<{ id: string; label: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['fo-import-batches', tradingDate, exchange],
    queryFn: () =>
      getFoImportBatches({
        tradingDate: tradingDate || undefined,
        exchange: exchange || undefined,
        pageSize: 100,
      }),
    staleTime: 30_000,
  });

  const handleDelete = useCallback(
    async (batchId: string) => {
      setDeletingId(batchId);
      try {
        await deleteFoImportBatch(batchId);
        void queryClient.invalidateQueries({ queryKey: ['fo-import-batches'] });
        void message.success('Batch deleted');
      } catch {
        void message.error('Failed to delete batch');
      } finally {
        setDeletingId(null);
      }
    },
    [queryClient],
  );

  const columns: ColumnsType<FoImportBatch> = [
    {
      title: 'File Type',
      dataIndex: 'fileType',
      key: 'fileType',
      render: (v: string) => <Tag>{v}</Tag>,
      width: 140,
    },
    {
      title: 'Exchange',
      dataIndex: 'exchange',
      key: 'exchange',
      width: 80,
    },
    {
      title: 'Trading Date',
      dataIndex: 'tradingDate',
      key: 'tradingDate',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: FoImportStatus) => <StatusTag status={v} />,
      width: 120,
    },
    {
      title: 'File',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: 'Rows',
      key: 'rows',
      width: 160,
      render: (_: unknown, r: FoImportBatch) => (
        <Space size={4}>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <Text>{r.createdRows}</Text>
          {r.errorRows > 0 && (
            <>
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
              <Text type="danger">{r.errorRows}</Text>
            </>
          )}
          {r.skippedRows > 0 && (
            <>
              <WarningOutlined style={{ color: '#faad14' }} />
              <Text type="secondary">{r.skippedRows}</Text>
            </>
          )}
        </Space>
      ),
    },
    {
      title: 'Started',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 160,
      render: (v: string) => dayjs(v).format('DD-MM-YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, r: FoImportBatch) => (
        <Space>
          <Button
            size="small"
            icon={<UnorderedListOutlined />}
            onClick={() =>
              setLogsForBatch({
                id: r.batchId,
                label: `${r.fileType} · ${r.exchange} · ${r.tradingDate}`,
              })
            }
          />
          <Popconfirm
            title="Delete this batch?"
            description="All imported rows for this batch will be removed, allowing reimport."
            onConfirm={() => void handleDelete(r.batchId)}
            okText="Delete"
            okType="danger"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === r.batchId}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <DataTable<FoImportBatch>
        columns={columns}
        dataSource={batches}
        rowKey="batchId"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        size="small"
      />

      <FoBatchLogsDrawer
        batchId={logsForBatch?.id ?? null}
        batchLabel={logsForBatch?.label}
        onClose={() => setLogsForBatch(null)}
      />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function FoImportPage() {
  const queryClient = useQueryClient();
  const [tradingDate, setTradingDate] = useState('');
  const [exchange, setExchange] = useState('NFO');

  const invalidateBatches = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['fo-import-batches'] });
  }, [queryClient]);

  const tabs = [
    {
      key: 'import',
      label: 'Daily Import',
      children: (
        <DailyImportTab
          tradingDate={tradingDate}
          exchange={exchange}
          onInvalidateBatches={invalidateBatches}
        />
      ),
    },
    {
      key: 'history',
      label: 'Batch History',
      children: <BatchHistoryTab tradingDate={tradingDate} exchange={exchange} />,
    },
  ];

  return (
    <div style={{ padding: '24px 32px' }}>
      <Title level={4} style={{ marginBottom: 4 }}>
        FO File Import
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        Import Futures &amp; Options (NFO / BFO) exchange files for a given trading date.
      </Text>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col>
          <Space>
            <Text strong>Trading Date:</Text>
            <DatePicker
              format="DD-MM-YYYY"
              onChange={(d) => setTradingDate(d ? d.format('YYYY-MM-DD') : '')}
              allowClear
            />
          </Space>
        </Col>
        <Col>
          <Space>
            <Text strong>Exchange:</Text>
            <Select
              value={exchange}
              options={FO_EXCHANGES}
              onChange={setExchange}
              style={{ width: 160 }}
            />
          </Space>
        </Col>
      </Row>

      <Tabs items={tabs} defaultActiveKey="import" />
    </div>
  );
}
