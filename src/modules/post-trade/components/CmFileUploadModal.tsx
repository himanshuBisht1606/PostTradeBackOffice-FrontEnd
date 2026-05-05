import { useState } from 'react';
import { Modal, Upload, Button, Alert, List, Typography, Space, Tag } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ImportResult } from '../types/cmImport.types';

const { Dragger } = Upload;
const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  csvHint: string;
  tradingDate: string;
  exchange: string;
  onImport: (file: File, tradingDate: string, exchange: string) => Promise<ImportResult>;
  onSuccess?: () => void;
}

export function CmFileUploadModal({
  open,
  onClose,
  title,
  csvHint,
  tradingDate,
  exchange,
  onImport,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await onImport(file, tradingDate, exchange);
      setResult(res);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleClose}
      footer={
        result ? (
          <Button type="primary" onClick={handleClose}>
            Close
          </Button>
        ) : (
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="primary"
              disabled={!file}
              loading={loading}
              onClick={() => void handleImport()}
            >
              Import
            </Button>
          </Space>
        )
      }
      width={580}
      destroyOnClose
    >
      {!result ? (
        <>
          <Space style={{ marginBottom: 12 }}>
            <Text type="secondary">Date:</Text>
            <Text strong>{tradingDate}</Text>
            <Text type="secondary" style={{ marginLeft: 12 }}>Exchange:</Text>
            <Text strong>{exchange}</Text>
          </Space>
          <Dragger
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => setFile(null)}
            maxCount={1}
            accept=".csv,.txt"
            style={{ marginTop: 4 }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag CSV file here</p>
            <p className="ant-upload-hint">{csvHint}</p>
          </Dragger>
          {error && <Alert type="error" message={error} style={{ marginTop: 12 }} showIcon />}
        </>
      ) : (
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
              message={`${result.skipped} row(s) skipped — already exist or invalid.`}
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
                dataSource={result.errors}
                renderItem={(err) => (
                  <List.Item>
                    <Text type="secondary">Row {err.row}:</Text>&nbsp;
                    <Text type="danger">{err.reason}</Text>
                  </List.Item>
                )}
                style={{ maxHeight: 200, overflowY: 'auto' }}
              />
            </>
          )}
        </Space>
      )}
    </Modal>
  );
}
