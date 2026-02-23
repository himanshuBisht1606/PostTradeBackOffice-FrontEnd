import { Empty } from 'antd';

interface EmptyStateProps {
  description?: string;
  image?: string;
}

export function EmptyState({ description = 'No data available', image }: EmptyStateProps) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <Empty image={image ?? Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
    </div>
  );
}
