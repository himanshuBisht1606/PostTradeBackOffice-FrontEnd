import { useState } from 'react';
import { Tag, Typography, Space, Table, Badge } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { getFoImportBatchLogs } from '../services/foImportService';
import type { FoImportBatchLog, FoImportBatchLogSummary } from '../types/foImport.types';

const { Text, Title } = Typography;

const levelColor: Record<string, string> = {
  Error: 'red',
  Warning: 'orange',
  Info: 'blue',
};

interface Props {
  batchId: string | null;
  batchLabel?: string | undefined;
  onClose: () => void;
}

export function FoBatchLogsDrawer({ batchId, batchLabel, onClose }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['fo-batch-logs', batchId, page],
    queryFn: () => getFoImportBatchLogs(batchId as string, page, pageSize),
    enabled: !!batchId,
    staleTime: 30_000,
  });

  const columns: TableColumnsType<FoImportBatchLog> = [
    {
      title: 'Row',
      dataIndex: 'rowNumber',
      width: 70,
      render: (v: number) => <Text type="secondary">{v}</Text>,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      width: 85,
      render: (v: string) => <Tag color={levelColor[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      render: (msg: string, rec) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Text>{msg}</Text>
          {rec.rawData && (
            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {rec.rawData}
            </Text>
          )}
        </Space>
      ),
    },
  ];

  return (
    <SlideDrawer
      open={!!batchId}
      onClose={() => { setPage(1); onClose(); }}
      title={
        <Space direction="vertical" size={0}>
          <Title level={5} style={{ margin: 0 }}>Import Log</Title>
          {batchLabel && <Text type="secondary" style={{ fontSize: 12 }}>{batchLabel}</Text>}
        </Space>
      }
      isLoading={isLoading}
    >
      <div style={{ padding: '16px 24px' }}>
        {/* ── Distinct error summary ─────────────────────────────────── */}
        {data && data.summary.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Summary ({data.summary.length} distinct messages)</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
              {data.summary.map((s: FoImportBatchLogSummary, i: number) => (
                <Space key={i} size={8} wrap>
                  <Tag color={levelColor[s.level] ?? 'default'} style={{ margin: 0 }}>{s.level}</Tag>
                  <Badge count={s.count} color={s.level === 'Error' ? 'red' : 'orange'} overflowCount={999999} />
                  <Text style={{ fontSize: 12 }}>{s.message}</Text>
                </Space>
              ))}
            </div>
          </div>
        )}

        {/* ── Paginated log table ────────────────────────────────────── */}
        {data?.totalCount === 0 ? (
          <Text type="secondary">No log entries for this batch.</Text>
        ) : (
          <Table<FoImportBatchLog>
            size="small"
            rowKey="logId"
            columns={columns}
            dataSource={data?.items ?? []}
            loading={isLoading}
            pagination={{
              current: page,
              pageSize,
              total: data?.totalCount ?? 0,
              showTotal: (total) => `${total} log entries`,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
              size: 'small',
            }}
            scroll={{ y: 420 }}
          />
        )}
      </div>
    </SlideDrawer>
  );
}
