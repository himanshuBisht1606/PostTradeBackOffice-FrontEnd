import { useState } from 'react';
import { Modal, Upload, Button, Alert, List, Typography, Space, Tag } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { importPinCodesCsv } from '../../services/pinCodeService';
import type { ImportResult } from '../../services/pinCodeService';

const { Dragger } = Upload;
const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PinCodeImportModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
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
      const res = await importPinCodesCsv(file);
      setResult(res);
      void queryClient.invalidateQueries({ queryKey: ['pin-codes'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Import Pin Code Master from CSV"
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
      width={560}
    >
      {!result ? (
        <>
          <Dragger
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => setFile(null)}
            maxCount={1}
            accept=".csv,.txt"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file here</p>
            <p className="ant-upload-hint">
              Columns (with header): pincode, district, city, state_id, country_id, mcx_code
            </p>
          </Dragger>
          {error && <Alert type="error" message={error} style={{ marginTop: 12 }} showIcon />}
        </>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            showIcon
            message={
              <Space>
                <Tag color="green">{result.created} created</Tag>
                <Tag color="orange">{result.skipped} skipped</Tag>
                <Tag color={result.errors.length > 0 ? 'red' : 'default'}>
                  {result.errors.length} errors
                </Tag>
              </Space>
            }
          />
          {result.skipped > 0 && (
            <Alert
              type="warning"
              icon={<WarningOutlined />}
              showIcon
              message={`${result.skipped} row(s) skipped — pin codes already exist.`}
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
