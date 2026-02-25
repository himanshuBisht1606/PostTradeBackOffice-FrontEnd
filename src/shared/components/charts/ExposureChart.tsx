import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, Typography } from 'antd';

interface ExposureDataPoint {
  name: string;
  utilization: number;
  fill: string;
}

interface ExposureChartProps {
  data: ExposureDataPoint[];
  loading?: boolean;
}

const { Text } = Typography;

export function ExposureChart({ data, loading = false }: ExposureChartProps) {
  return (
    <Card title="Exposure Utilization" loading={loading} style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="30%"
          outerRadius="90%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="utilization"
            label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
          />
          <Legend iconSize={10} iconType="circle" />
          <Tooltip formatter={(v: number) => [`${v}%`, 'Utilization']} />
        </RadialBarChart>
      </ResponsiveContainer>
      <Text type="secondary" style={{ fontSize: 11 }}>
        % of exposure limit consumed per client segment
      </Text>
    </Card>
  );
}
