import { Spin } from 'antd';

interface PageLoaderProps {
  tip?: string;
  fullScreen?: boolean;
}

export function PageLoader({ tip = 'Loading...', fullScreen = false }: PageLoaderProps) {
  if (fullScreen) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Spin size="large" />
        <span style={{ color: '#8c8c8c', fontSize: 14 }}>{tip}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <Spin size="large" tip={tip} />
    </div>
  );
}
