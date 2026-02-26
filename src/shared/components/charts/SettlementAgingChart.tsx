import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Card, Tag } from 'antd';

interface AgingDataPoint {
  bucket: string;
  count: number;
}

interface SettlementAgingChartProps {
  data: AgingDataPoint[];
  loading?: boolean;
}

const BUCKET_COLORS: Record<string, string> = {
  'T+1':  '#1d3557',
  'T+2':  '#457b9d',
  'T+3':  '#fa8c16',
  '>T+3': '#e63946',
};

export function SettlementAgingChart({ data, loading = false }: SettlementAgingChartProps) {
  const overdue = data.find((d) => d.bucket === '>T+3')?.count ?? 0;

  return (
    <Card
      title="Settlement Aging (T+1 Cycle)"
      loading={loading}
      style={{ height: 320 }}
      extra={
        overdue > 0 ? (
          <Tag color="error">{overdue} overdue</Tag>
        ) : (
          <Tag color="success">All on track</Tag>
        )
      }
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="bucket" tick={{ fontSize: 12, fontWeight: 600 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v: number, _name: string, props: { payload?: AgingDataPoint }) => [
              `${v} batches`,
              props.payload?.bucket ?? '',
            ]}
          />
          <ReferenceLine y={500} stroke="#fa8c16" strokeDasharray="4 4" label={{ value: 'SLA limit', fontSize: 10, fill: '#fa8c16' }} />
          <Bar dataKey="count" radius={[5, 5, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket] ?? '#457b9d'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
