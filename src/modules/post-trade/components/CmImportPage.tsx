import { useState, useCallback, useMemo } from 'react';
import {
  Typography,
  Tabs,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  Popconfirm,
  message,
  Input,
  Alert,
  Divider,
  Card,
  Modal,
  List,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UploadOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@shared/components/data-display/DataTable';
import { CmFileUploadModal } from './CmFileUploadModal';
import { CmBatchLogsDrawer } from './CmBatchLogsDrawer';
import {
  getCmImportBatches,
  deleteCmImportBatch,
  getCmSettlementMasters,
  getCmScripMasters,
  importSettlementMaster,
  importScripMaster,
  downloadNseScripMaster,
  downloadBseScripMaster,
  importTrade,
  importBhavCopy,
  importMargin,
  importObligation,
  importStt,
  importStampDuty,
} from '../services/cmImportService';
import type { CmImportBatch, CmSettlementMaster, CmScripMaster, ImportResult } from '../types/cmImport.types';
import { CmFileType, CmImportStatus } from '@app-types/enums';

const { Title, Text } = Typography;
const { Search } = Input;

// ── Status helpers ─────────────────────────────────────────────────────────────

const statusColor: Record<CmImportStatus, string> = {
  [CmImportStatus.Pending]: 'default',
  [CmImportStatus.Processing]: 'processing',
  [CmImportStatus.Completed]: 'success',
  [CmImportStatus.Failed]: 'error',
};

function StatusTag({ status }: { status: CmImportStatus }) {
  return <Tag color={statusColor[status]}>{status}</Tag>;
}

// ── Import file definitions ───────────────────────────────────────────────────

type FileImportDef = {
  key: string;
  label: string;
  fileType: CmFileType | 'SettlementMaster' | 'ScripMaster';
  isPrerequisite: boolean;
  prerequisiteNote?: string;
  csvHint: string;
  importFn: (f: File, d: string, e: string) => Promise<{ created: number; skipped: number; errors: { row: number; reason: string }[] }>;
};

const FILE_DEFS: FileImportDef[] = [
  {
    key: 'settlement-master',
    label: 'Settlement Master',
    fileType: 'SettlementMaster',
    isPrerequisite: true,
    csvHint: 'NSDL CSV (auto-detected): SctiesSttlmTxId, MktTpAndId, SttlmPrdFr, PayInDt, PyoutDt — or NSE/BSE format with SttlmTp, FndsPayInDtAndTm, FndsPayOutDtAndTm',
    importFn: importSettlementMaster,
  },
  {
    key: 'scrip-master',
    label: 'Scrip Master',
    fileType: 'ScripMaster',
    isPrerequisite: true,
    csvHint: 'NSE CSV: TckrSymb, SctySrs, FinInstrmNm, ISIN, NewBrdLotQty, ParVal (paise), SctyTpFlg | BSE pipe-delimited: Scrip_Code, Scrip_Name, ISIN_CODE, Face_Value, Market_Lot, Tick_Size',
    importFn: importScripMaster,
  },
  {
    key: 'trade',
    label: 'Trade File',
    fileType: CmFileType.Trade,
    isPrerequisite: false,
    prerequisiteNote: 'Requires Settlement Master + Scrip Master',
    csvHint: 'NSE/BSE Trade file (exchange-standard format, header row)',
    importFn: importTrade,
  },
  {
    key: 'bhavcopy',
    label: 'BhavCopy',
    fileType: CmFileType.BhavCopy,
    isPrerequisite: false,
    csvHint: 'NSE/BSE BhavCopy file (exchange-standard format, header row)',
    importFn: importBhavCopy,
  },
  {
    key: 'margin',
    label: 'Margin',
    fileType: CmFileType.Margin,
    isPrerequisite: false,
    csvHint: 'Columns (with header): ClientId, Scrip, MarginType, MarginAmount',
    importFn: importMargin,
  },
  {
    key: 'obligation',
    label: 'Obligation',
    fileType: CmFileType.Obligation,
    isPrerequisite: false,
    csvHint: 'Columns (with header): ClientId, Scrip, ObligationQty, ObligationValue, SettlementNo',
    importFn: importObligation,
  },
  {
    key: 'stt',
    label: 'STT',
    fileType: CmFileType.Stt,
    isPrerequisite: false,
    csvHint: 'Columns (with header): ClientId, Scrip, BuySell, TradedQty, TradedValue, SttAmount',
    importFn: importStt,
  },
  {
    key: 'stamp-duty',
    label: 'Stamp Duty',
    fileType: CmFileType.StampDuty,
    isPrerequisite: false,
    csvHint: 'Columns (with header): ClientId, Scrip, InstrumentType, TradedValue, StampDutyAmount',
    importFn: importStampDuty,
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

  function openModal(def: FileImportDef) {
    setUploadDef(def);
  }

  const prereqs = FILE_DEFS.filter((d) => d.isPrerequisite);
  const dailyFiles = FILE_DEFS.filter((d) => !d.isPrerequisite);

  function renderFileRow(def: FileImportDef) {
    return (
      <Row
        key={def.key}
        align="middle"
        style={{
          padding: '10px 0',
          borderBottom: '1px solid #f5f5f5',
        }}
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
            icon={<UploadOutlined />}
            onClick={() => openModal(def)}
            size="small"
            disabled={!tradingDate}
          >
            Upload
          </Button>
        </Col>
      </Row>
    );
  }

  return (
    <>
      {!tradingDate && (
        <Alert
          type="warning"
          message="Select a Trading Date above before uploading files."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        size="small"
        title={
          <Space>
            <Tag color="blue">Step 1 &amp; 2</Tag>
            <Text strong>Prerequisites</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              — must be imported before Trade file
            </Text>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {prereqs.map(renderFileRow)}
      </Card>

      <Card
        size="small"
        title={
          <Space>
            <Tag color="purple">Daily Files</Tag>
            <Text strong>Transactional Imports</Text>
          </Space>
        }
      >
        {dailyFiles.map(renderFileRow)}
      </Card>

      {uploadDef && (
        <CmFileUploadModal
          open
          onClose={() => setUploadDef(null)}
          title={`Import ${uploadDef.label}`}
          csvHint={uploadDef.csvHint}
          tradingDate={tradingDate}
          exchange={exchange}
          onImport={uploadDef.importFn}
          onSuccess={onInvalidateBatches}
        />
      )}
    </>
  );
}

// ── Tab: Import History ───────────────────────────────────────────────────────

function ImportHistoryTab({
  tradingDate,
  exchange,
}: {
  tradingDate: string;
  exchange: string;
}) {
  const qc = useQueryClient();
  const [filterFileType, setFilterFileType] = useState<CmFileType | undefined>();
  const [filterStatus, setFilterStatus] = useState<CmImportStatus | undefined>();
  const [logsForBatch, setLogsForBatch] = useState<{ id: string; label: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cm-batches', tradingDate, exchange, filterFileType, filterStatus],
    queryFn: () =>
      getCmImportBatches({
        tradingDate: tradingDate || undefined,
        exchange: exchange || undefined,
        fileType: filterFileType,
        status: filterStatus,
        pageSize: 100,
      }),
    staleTime: 30_000,
  });

  async function handleDelete(batchId: string) {
    try {
      await deleteCmImportBatch(batchId);
      void qc.invalidateQueries({ queryKey: ['cm-batches'] });
      message.success('Batch deleted. You may reimport the file.');
    } catch {
      message.error('Failed to delete batch');
    }
  }

  const columns: ColumnsType<CmImportBatch> = [
    {
      title: 'File Type',
      dataIndex: 'fileType',
      width: 110,
      render: (v: CmFileType) => <Tag>{v}</Tag>,
    },
    { title: 'Exchange', dataIndex: 'exchange', width: 80 },
    { title: 'Trading Date', dataIndex: 'tradingDate', width: 110 },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: CmImportStatus) => <StatusTag status={v} />,
    },
    { title: 'Total', dataIndex: 'totalRows', width: 70, align: 'right' },
    { title: 'Created', dataIndex: 'createdRows', width: 70, align: 'right' },
    { title: 'Skipped', dataIndex: 'skippedRows', width: 70, align: 'right' },
    {
      title: 'Errors',
      dataIndex: 'errorRows',
      width: 70,
      align: 'right',
      render: (v: number) => (v > 0 ? <Tag color="red">{v}</Tag> : v),
    },
    {
      title: 'Started',
      dataIndex: 'startedAt',
      width: 140,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    { title: 'File', dataIndex: 'fileName', ellipsis: true },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, row: CmImportBatch) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<UnorderedListOutlined />}
            onClick={() =>
              setLogsForBatch({
                id: row.batchId,
                label: `${row.fileType} · ${row.tradingDate} · ${row.exchange}`,
              })
            }
          />
          <Popconfirm
            title="Delete this batch?"
            description="All imported rows will be removed. You can reimport afterwards."
            onConfirm={() => void handleDelete(row.batchId)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Select<CmFileType>
            placeholder="File Type"
            style={{ width: '100%' }}
            allowClear
            value={filterFileType ?? null}
            onChange={(v) => setFilterFileType(v)}
            options={Object.values(CmFileType).map((t) => ({ label: t, value: t }))}
          />
        </Col>
        <Col span={5}>
          <Select<CmImportStatus>
            placeholder="Status"
            style={{ width: '100%' }}
            allowClear
            value={filterStatus ?? null}
            onChange={(v) => setFilterStatus(v)}
            options={Object.values(CmImportStatus).map((s) => ({ label: s, value: s }))}
          />
        </Col>
      </Row>

      <DataTable<CmImportBatch>
        columns={columns}
        dataSource={data ?? []}
        rowKey="batchId"
        loading={isLoading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        emptyText="No import batches found"
      />

      <CmBatchLogsDrawer
        batchId={logsForBatch?.id ?? null}
        batchLabel={logsForBatch?.label}
        onClose={() => setLogsForBatch(null)}
      />
    </>
  );
}

// ── Tab: Settlement Master ────────────────────────────────────────────────────

function SettlementMasterTab({
  tradingDate,
  exchange,
}: {
  tradingDate: string;
  exchange: string;
}) {
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cm-settlement-masters', tradingDate, exchange],
    queryFn: () =>
      getCmSettlementMasters(exchange || undefined, tradingDate || undefined),
    staleTime: 60_000,
  });

  const columns: ColumnsType<CmSettlementMaster> = [
    { title: 'Exchange', dataIndex: 'exchange', width: 90 },
    { title: 'Trading Date', dataIndex: 'tradingDate', width: 120 },
    { title: 'Settlement No', dataIndex: 'settlementNo', width: 130 },
    { title: 'Type', dataIndex: 'settlementType', width: 110 },
    { title: 'PayIn Date', dataIndex: 'payInDate', width: 110 },
    { title: 'PayOut Date', dataIndex: 'payOutDate', width: 110 },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Text type="secondary">
            {data ? `${data.length} record(s)` : ''}
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            disabled={!tradingDate}
            onClick={() => setUploadOpen(true)}
          >
            Import Settlement Master
          </Button>
        </Col>
      </Row>

      <DataTable<CmSettlementMaster>
        columns={columns}
        dataSource={data ?? []}
        rowKey="cmSettlementMasterId"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        emptyText="No settlement master data. Import a CSV file."
      />

      <CmFileUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Import Settlement Master"
        csvHint="NSDL CSV (auto-detected): SctiesSttlmTxId, MktTpAndId, SttlmPrdFr, PayInDt, PyoutDt — or NSE/BSE format with SttlmTp, FndsPayInDtAndTm, FndsPayOutDtAndTm"
        tradingDate={tradingDate}
        exchange={exchange}
        onImport={importSettlementMaster}
        onSuccess={() => {
          void qc.invalidateQueries({ queryKey: ['cm-settlement-masters'] });
        }}
      />
    </>
  );
}

// ── Download result modal (shared) ───────────────────────────────────────────

function DownloadResultModal({
  title,
  result,
  onClose,
}: {
  title: string;
  result: ImportResult;
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      open
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          Close
        </Button>
      }
      width={520}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Alert
          type={result.errors.length === 0 ? 'success' : 'warning'}
          icon={<CheckCircleOutlined />}
          showIcon
          message={
            <Space>
              <Tag color="green">{result.created} created</Tag>
              <Tag color="orange">{result.skipped} skipped</Tag>
              {result.errors.length > 0 && (
                <Tag color="red">{result.errors.length} errors</Tag>
              )}
            </Space>
          }
        />
        {result.skipped > 0 && (
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            message={`${result.skipped} row(s) skipped — already exist or invalid format.`}
          />
        )}
        {result.errors.length > 0 && (
          <>
            <Text type="danger">
              <CloseCircleOutlined /> Parse errors:
            </Text>
            <List
              size="small"
              bordered
              dataSource={result.errors.slice(0, 20)}
              renderItem={(err) => (
                <List.Item>
                  <Text type="secondary">Row {err.row}:</Text>&nbsp;
                  <Text type="danger">{err.reason}</Text>
                </List.Item>
              )}
              style={{ maxHeight: 200, overflowY: 'auto' }}
            />
            {result.errors.length > 20 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                … and {result.errors.length - 20} more errors
              </Text>
            )}
          </>
        )}
      </Space>
    </Modal>
  );
}

// ── Tab: Scrip Master ─────────────────────────────────────────────────────────

function ScripMasterTab({
  tradingDate,
  exchange,
}: {
  tradingDate: string;
  exchange: string;
}) {
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [nseLoading, setNseLoading] = useState(false);
  const [bseLoading, setBseLoading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<{ label: string; result: ImportResult } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cm-scrip-masters', tradingDate, exchange, searchText, page, pageSize],
    queryFn: () =>
      getCmScripMasters({
        exchange: exchange || undefined,
        tradingDate: tradingDate || undefined,
        symbol: searchText || undefined,
        page,
        pageSize,
      }),
    staleTime: 60_000,
  });

  async function handleExchangeDownload(exch: 'NSE' | 'BSE') {
    if (!tradingDate) return;
    const setLoading = exch === 'NSE' ? setNseLoading : setBseLoading;
    setLoading(true);
    try {
      const result =
        exch === 'NSE'
          ? await downloadNseScripMaster(tradingDate)
          : await downloadBseScripMaster(tradingDate);
      void qc.invalidateQueries({ queryKey: ['cm-scrip-masters'] });
      setDownloadResult({ label: `${exch} Scrip Master — Import Result`, result });
    } catch (e) {
      void message.error(
        `${exch} download failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  }

  const columns: ColumnsType<CmScripMaster> = [
    { title: 'Symbol', dataIndex: 'symbol', width: 110 },
    { title: 'ISIN', dataIndex: 'isin', width: 130, render: (v: string) => <Text code>{v}</Text> },
    { title: 'Series', dataIndex: 'series', width: 70 },
    { title: 'Name', dataIndex: 'name', ellipsis: true },
    { title: 'Instrument', dataIndex: 'instrumentType', width: 110 },
    { title: 'Face Value', dataIndex: 'faceValue', width: 100, align: 'right' },
    { title: 'Lot Size', dataIndex: 'lotSize', width: 80, align: 'right' },
    { title: 'Tick Size', dataIndex: 'tickSize', width: 80, align: 'right' },
    { title: 'Exchange', dataIndex: 'exchange', width: 90 },
    { title: 'Trading Date', dataIndex: 'tradingDate', width: 120 },
  ];

  return (
    <>
      {!tradingDate && (
        <Alert
          type="warning"
          message="Select a Trading Date above before importing."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={12} align="middle" style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Search
            placeholder="Search by symbol"
            allowClear
            style={{ maxWidth: 280 }}
            onSearch={(v) => {
              setSearchText(v);
              setPage(1);
            }}
            onChange={(e) => {
              if (!e.target.value) {
                setSearchText('');
                setPage(1);
              }
            }}
          />
        </Col>
        <Col flex="none">
          <Space wrap>
            <Button
              icon={<UploadOutlined />}
              disabled={!tradingDate}
              onClick={() => setUploadOpen(true)}
            >
              Upload File
            </Button>
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              loading={nseLoading}
              disabled={!tradingDate || bseLoading}
              onClick={() => void handleExchangeDownload('NSE')}
            >
              Download from NSE
            </Button>
            <Button
              icon={<CloudDownloadOutlined />}
              loading={bseLoading}
              disabled={!tradingDate || nseLoading}
              onClick={() => void handleExchangeDownload('BSE')}
            >
              Download from BSE
            </Button>
          </Space>
        </Col>
      </Row>

      <DataTable<CmScripMaster>
        columns={columns}
        dataSource={data ?? []}
        rowKey="cmScripMasterId"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data
            ? data.length === pageSize
              ? page * pageSize + 1
              : (page - 1) * pageSize + data.length
            : 0,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showSizeChanger: true,
          pageSizeOptions: ['50', '100', '200'],
        }}
        emptyText="No scrip master data. Upload a file or download from NSE / BSE."
      />

      <CmFileUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Import Scrip Master"
        csvHint="NSE CSV: TckrSymb, SctySrs, FinInstrmNm, ISIN, NewBrdLotQty, ParVal (paise), SctyTpFlg | BSE pipe-delimited: Scrip_Code, Scrip_Name, ISIN_CODE, Face_Value, Market_Lot, Tick_Size"
        tradingDate={tradingDate}
        exchange={exchange}
        onImport={importScripMaster}
        onSuccess={() => {
          void qc.invalidateQueries({ queryKey: ['cm-scrip-masters'] });
        }}
      />

      {downloadResult && (
        <DownloadResultModal
          title={downloadResult.label}
          result={downloadResult.result}
          onClose={() => setDownloadResult(null)}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function CmImportPage() {
  const qc = useQueryClient();
  const [tradingDate, setTradingDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [exchange, setExchange] = useState('NSE');
  const [activeTab, setActiveTab] = useState('import');

  const handleInvalidateBatches = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['cm-batches'] });
  }, [qc]);

  const tabItems = useMemo(
    () => [
      {
        key: 'import',
        label: 'Daily Import',
        children: (
          <DailyImportTab
            tradingDate={tradingDate}
            exchange={exchange}
            onInvalidateBatches={handleInvalidateBatches}
          />
        ),
      },
      {
        key: 'history',
        label: 'Import History',
        children: <ImportHistoryTab tradingDate={tradingDate} exchange={exchange} />,
      },
      {
        key: 'settlement-master',
        label: 'Settlement Master',
        children: <SettlementMasterTab tradingDate={tradingDate} exchange={exchange} />,
      },
      {
        key: 'scrip-master',
        label: 'Scrip Master',
        children: <ScripMasterTab tradingDate={tradingDate} exchange={exchange} />,
      },
    ],
    [tradingDate, exchange, handleInvalidateBatches],
  );

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            CM File Import
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Capital Market — daily exchange file processing
          </Text>
        </Col>
      </Row>

      <Divider style={{ margin: '12px 0' }} />

      {/* Global context: date + exchange */}
      <Row gutter={16} align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Text type="secondary" style={{ fontSize: 12 }}>Trading Date</Text>
          <br />
          <DatePicker
            value={dayjs(tradingDate)}
            format="YYYY-MM-DD"
            onChange={(d) => {
              if (d) setTradingDate(d.format('YYYY-MM-DD'));
            }}
            allowClear={false}
            style={{ width: 150 }}
          />
        </Col>
        <Col>
          <Text type="secondary" style={{ fontSize: 12 }}>Exchange</Text>
          <br />
          <Select
            value={exchange}
            onChange={setExchange}
            style={{ width: 100 }}
            options={[
              { label: 'NSE', value: 'NSE' },
              { label: 'BSE', value: 'BSE' },
            ]}
          />
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        destroyInactiveTabPane={false}
      />
    </div>
  );
}
