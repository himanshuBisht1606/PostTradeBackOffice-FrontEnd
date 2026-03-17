import { Tag, Typography, Space, List } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { getCmImportBatchLogs } from '../services/cmImportService';

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

export function CmBatchLogsDrawer({ batchId, batchLabel, onClose }: Props) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['cm-batch-logs', batchId],
    queryFn: () => getCmImportBatchLogs(batchId as string),
    enabled: !!batchId,
    staleTime: 30_000,
  });

  return (
    <SlideDrawer
      open={!!batchId}
      onClose={onClose}
      title={
        <Space direction="vertical" size={0}>
          <Title level={5} style={{ margin: 0 }}>Import Log</Title>
          {batchLabel && <Text type="secondary" style={{ fontSize: 12 }}>{batchLabel}</Text>}
        </Space>
      }
      isLoading={isLoading}
    >
      <div style={{ padding: 24 }}>
        {logs && logs.length === 0 && (
          <Text type="secondary">No log entries for this batch.</Text>
        )}
        <List
          size="small"
          dataSource={logs ?? []}
          renderItem={(log) => (
            <List.Item style={{ alignItems: 'flex-start', padding: '6px 0' }}>
              <Space size={8} wrap>
                <Text type="secondary" style={{ minWidth: 60 }}>Row {log.rowNumber}</Text>
                <Tag color={levelColor[log.level] ?? 'default'}>{log.level}</Tag>
                <Text>{log.message}</Text>
                {log.rawData && (
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}
                  >
                    {log.rawData}
                  </Text>
                )}
              </Space>
            </List.Item>
          )}
        />
      </div>
    </SlideDrawer>
  );
}
