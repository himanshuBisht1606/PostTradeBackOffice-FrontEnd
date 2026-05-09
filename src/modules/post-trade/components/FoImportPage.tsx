import { useState, useRef, useEffect } from 'react';
import {
  Typography,
  Tabs,
  Card,
  DatePicker,
  Select,
  Button,
  Upload,
  Alert,
  Descriptions,
  Tag,
  Space,
  notification,
  Spin,
} from 'antd';
import { InboxOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import type { Dayjs } from 'dayjs';
import {
  importFoContractMaster,
  importFoBhavCopy,
  importFoStt,
  importFoStampDuty,
  importFoPosition,
  importFoTrade,
  getFoImportBatches,
} from '../services/foImportService';
import type { FoFileType, FoImportBatch, ImportQueuedData } from '../services/foImportService';
import { AppError } from '@core/types/api.types';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const EXCHANGE_OPTIONS = [
  { label: 'NSE (NFO)', value: 'NFO' },
  { label: 'BSE (BFO)', value: 'BFO' },
];

const POLL_INTERVAL_MS = 4_000;

interface ImportState {
  uploading: boolean;
  queued: ImportQueuedData | null;
  batch: FoImportBatch | null;
  error: string | null;
}

const INITIAL_STATE: ImportState = { uploading: false, queued: null, batch: null, error: null };

function statusTag(status: FoImportBatch['status']) {
  if (status === 'Completed')
    return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
  if (status === 'Failed')
    return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
  return <Tag icon={<SyncOutlined spin />} color="processing">Processing</Tag>;
}

interface ImportPanelProps {
  fileType: FoFileType;
  label: string;
  accept?: string;
  importFn: (file: File, tradingDate: string, exchange: string) => Promise<ImportQueuedData>;
}

function ImportPanel({ fileType, label, accept = '.csv,.zip,.dat', importFn }: ImportPanelProps) {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [exchange, setExchange] = useState<string>('NFO');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [state, setState] = useState<ImportState>(INITIAL_STATE);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop polling when component unmounts
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function startPolling(tradingDate: string, exch: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const batches = await getFoImportBatches({ fileType, exchange: exch, tradingDate, pageSize: 1 });
        const latest = batches[0];
        if (!latest) return;
        setState((prev) => ({ ...prev, batch: latest }));
        if (latest.status === 'Completed' || latest.status === 'Failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          if (latest.status === 'Completed') {
            notification.success({
              message: `${label} import complete`,
              description: `Created: ${latest.createdRows} | Skipped: ${latest.skippedRows} | Errors: ${latest.errorRows}`,
              duration: 8,
            });
          } else {
            notification.error({ message: `${label} import failed`, duration: 6 });
          }
        }
      } catch {
        // polling errors are silent — we show the last known state
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleImport() {
    if (!date || !exchange || fileList.length === 0) {
      notification.warning({ message: 'Please select a date, exchange and file before importing.' });
      return;
    }

    const tradingDate = date.format('YYYY-MM-DD');
    const rawFile = (fileList[0] as UploadFile & { originFileObj?: RcFile }).originFileObj;
    if (!rawFile) return;

    setState({ uploading: true, queued: null, batch: null, error: null });
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const queued = await importFn(rawFile, tradingDate, exchange);
      setState({ uploading: false, queued, batch: null, error: null });
      notification.info({
        message: `${label} import queued`,
        description: 'Processing in background — status updates below.',
        duration: 4,
      });
      startPolling(tradingDate, exchange);
    } catch (err) {
      const msg = err instanceof AppError ? err.message : 'Upload failed. Please try again.';
      setState({ uploading: false, queued: null, batch: null, error: msg });
    }
  }

  const { uploading, queued, batch, error } = state;
  const isPolling = queued !== null && batch?.status !== 'Completed' && batch?.status !== 'Failed';

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space wrap size="middle" style={{ marginBottom: 16 }}>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Trading Date</Text>
            <DatePicker
              value={date}
              onChange={setDate}
              format="DD-MM-YYYY"
              style={{ width: 160 }}
              disabled={uploading}
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Exchange</Text>
            <Select
              value={exchange}
              onChange={setExchange}
              options={EXCHANGE_OPTIONS}
              style={{ width: 140 }}
              disabled={uploading}
            />
          </div>
        </Space>

        <Dragger
          accept={accept}
          fileList={fileList}
          beforeUpload={(file) => {
            setFileList([file as unknown as UploadFile]);
            return false; // prevent auto-upload
          }}
          onRemove={() => setFileList([])}
          maxCount={1}
          disabled={uploading}
          style={{ marginBottom: 16 }}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">Click or drag {label} file here</p>
          <p className="ant-upload-hint">Supports CSV, ZIP and DAT formats</p>
        </Dragger>

        <Button
          type="primary"
          size="large"
          loading={uploading}
          onClick={handleImport}
          disabled={!date || fileList.length === 0}
          block
        >
          {uploading ? 'Uploading…' : `Import ${label}`}
        </Button>
      </Card>

      {error && (
        <Alert type="error" showIcon message="Import Failed" description={error} closable
          onClose={() => setState((p) => ({ ...p, error: null }))} />
      )}

      {queued && (
        <Card
          title={
            <Space>
              {isPolling ? <Spin size="small" /> : null}
              {batch ? statusTag(batch.status) : <Tag icon={<SyncOutlined spin />} color="processing">Queued</Tag>}
              <Text>{label} — {queued.tradingDate} / {queued.exchange}</Text>
            </Space>
          }
        >
          {batch ? (
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="File">{batch.fileName}</Descriptions.Item>
              <Descriptions.Item label="Status">{statusTag(batch.status)}</Descriptions.Item>
              <Descriptions.Item label="Total Rows">{batch.totalRows.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Created">{batch.createdRows.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Skipped">{batch.skippedRows.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Errors">{batch.errorRows.toLocaleString()}</Descriptions.Item>
              {batch.completedAt && (
                <Descriptions.Item label="Completed At">
                  {new Date(batch.completedAt).toLocaleTimeString()}
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <Text type="secondary">Waiting for server to start processing…</Text>
          )}
        </Card>
      )}
    </Space>
  );
}

const TABS = [
  { key: 'contract-master', label: 'Contract Master', fileType: 'ContractMaster' as FoFileType, importFn: importFoContractMaster },
  { key: 'trade',           label: 'Trade File',      fileType: 'Trade' as FoFileType,          importFn: importFoTrade },
  { key: 'bhavcopy',        label: 'BhavCopy',        fileType: 'BhavCopy' as FoFileType,       importFn: importFoBhavCopy },
  { key: 'stt',             label: 'STT',              fileType: 'Stt' as FoFileType,            importFn: importFoStt },
  { key: 'stamp-duty',      label: 'Stamp Duty',       fileType: 'StampDuty' as FoFileType,     importFn: importFoStampDuty },
  { key: 'position',        label: 'Position',         fileType: 'Position' as FoFileType,      importFn: importFoPosition },
];

export function FoImportPage() {
  return (
    <div style={{ padding: '24px', maxWidth: 720 }}>
      <Title level={4} style={{ marginBottom: 24 }}>FO File Import</Title>
      <Tabs
        defaultActiveKey="contract-master"
        items={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          children: (
            <ImportPanel
              fileType={t.fileType}
              label={t.label}
              importFn={t.importFn}
            />
          ),
        }))}
      />
    </div>
  );
}
