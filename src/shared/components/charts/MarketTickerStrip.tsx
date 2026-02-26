import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Tag } from 'antd';

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePct: number;
}

const INDICES: MarketIndex[] = [
  { name: 'NIFTY 50',   value: 22547.85, change:  134.20,  changePct:  0.60 },
  { name: 'SENSEX',     value: 74339.44, change:  412.65,  changePct:  0.56 },
  { name: 'NIFTY BANK', value: 48124.30, change:  -87.45,  changePct: -0.18 },
  { name: 'NIFTY IT',   value: 36892.15, change:  278.90,  changePct:  0.76 },
  { name: 'NIFTY MID',  value: 12648.70, change:   98.30,  changePct:  0.78 },
  { name: 'INDIA VIX',  value:    13.42, change:   -0.68,  changePct: -4.82 },
];

function fmt(v: number, decimals = 2) {
  return v.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function MarketTickerStrip() {
  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      style={{
        background: '#0d1b2a',
        borderRadius: 8,
        padding: '10px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        overflowX: 'auto',
      }}
    >
      {/* NSE badge */}
      <div style={{ marginRight: 24, flexShrink: 0 }}>
        <Tag
          color="#e63946"
          style={{ fontWeight: 700, fontSize: 11, letterSpacing: 1, borderRadius: 4 }}
        >
          NSE LIVE
        </Tag>
        <span style={{ color: '#8899aa', fontSize: 10, marginLeft: 4 }}>{now} IST</span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 32, background: '#2a3a4a', marginRight: 24, flexShrink: 0 }} />

      {/* Indices */}
      <div style={{ display: 'flex', gap: 32, flexShrink: 0 }}>
        {INDICES.map((idx) => {
          const up = idx.change >= 0;
          const color = up ? '#52c41a' : '#e63946';
          return (
            <div key={idx.name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: '#8899aa', fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
                {idx.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ color: '#ffffff', fontSize: 15, fontWeight: 700 }}>
                  {fmt(idx.value, idx.name === 'INDIA VIX' ? 2 : 2)}
                </span>
                <span style={{ color, fontSize: 11, fontWeight: 600 }}>
                  {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {' '}
                  {up ? '+' : ''}{fmt(Math.abs(idx.change), 2)}
                  {'  '}({up ? '+' : ''}{idx.changePct.toFixed(2)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spacer + Settlement cycle info */}
      <div style={{ marginLeft: 'auto', flexShrink: 0, textAlign: 'right' }}>
        <div style={{ color: '#8899aa', fontSize: 10 }}>Settlement Cycle</div>
        <div style={{ color: '#52c41a', fontSize: 13, fontWeight: 700 }}>T+1 &nbsp;|&nbsp; NSE / BSE</div>
      </div>
    </div>
  );
}
