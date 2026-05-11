import { Alert, Typography } from 'antd';
import {
  CheckCircleFilled,
  SafetyCertificateOutlined,
  BarChartOutlined,
  TeamOutlined,
  AuditOutlined,
  BankOutlined,
  StockOutlined,
  FundOutlined,
  ReconciliationOutlined,
  RiseOutlined,
  FileProtectOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import type { ReactNode } from 'react';

const { Title, Text } = Typography;

const SESSION_MESSAGES: Record<string, string> = {
  session_expired: 'Your session has expired. Please sign in again.',
  unauthorized: 'You must be signed in to access that page.',
};

interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

const LEFT_FEATURES: Feature[] = [
  {
    icon: <BarChartOutlined style={{ fontSize: 17, color: '#a8dadc' }} />,
    title: 'T+1 Settlement & Clearing',
    desc: 'Equity T+1, F&O daily settlement, Currency & Commodity obligation tracking across NSE · BSE · MCX · NCDEX',
  },
  {
    icon: <ReconciliationOutlined style={{ fontSize: 17, color: '#a8dadc' }} />,
    title: 'Trade Book & Reconciliation',
    desc: 'Real-time recon across exchange, broker and client legs with exception management and resolution workflows',
  },
  {
    icon: <RiseOutlined style={{ fontSize: 17, color: '#a8dadc' }} />,
    title: 'Margin & Risk Monitoring',
    desc: 'Client-level margin utilisation, fund obligation alerts and real-time risk exposure across segments',
  },
];

const RIGHT_FEATURES: Feature[] = [
  {
    icon: <SafetyCertificateOutlined style={{ fontSize: 17, color: '#a8dadc' }} />,
    title: 'SEBI Compliant Operations',
    desc: 'Complete audit trails, regulatory reporting, STP workflows and SEBI inspection-ready record keeping',
  },
  {
    icon: <TeamOutlined style={{ fontSize: 17, color: '#a8dadc' }} />,
    title: 'Client KYC & Onboarding',
    desc: 'PAN-linked KYC for individuals & corporates, segment activation across Equity, F&O, Currency & Commodity',
  },
  {
    icon: <BankOutlined style={{ fontSize: 17, color: '#a8dadc' }} />,
    title: 'CDSL · NSDL Depository Ops',
    desc: 'Demat account mapping, DP master management, depository participant linkage and position tracking',
  },
];

const BOTTOM_FEATURES: Feature[] = [
  {
    icon: <FundOutlined style={{ fontSize: 15, color: '#a8dadc' }} />,
    title: 'Ledger & Charge Engine',
    desc: 'Brokerage slabs, STT, GST, exchange txn charges and client-wise ledger',
  },
  {
    icon: <FileProtectOutlined style={{ fontSize: 15, color: '#a8dadc' }} />,
    title: 'Corporate Actions',
    desc: 'Dividend, bonus, split, rights and merger event processing',
  },
  {
    icon: <AuditOutlined style={{ fontSize: 15, color: '#a8dadc' }} />,
    title: 'Governance & Approvals',
    desc: 'Role-based approval workflows, audit log and RBAC permission management',
  },
  {
    icon: <PartitionOutlined style={{ fontSize: 15, color: '#a8dadc' }} />,
    title: 'Multi-Exchange Master Setup',
    desc: 'Exchange, segment, instrument, branch and DP master configuration',
  },
];

const BADGES = ['NSE', 'BSE', 'MCX', 'NCDEX', 'MSEI', 'CDSL', 'NSDL', 'SEBI'];
const SEGMENTS = ['EQ', 'F&O', 'CDS', 'COM', 'SLB', 'DEBT'];

const STYLES = `
  .lp-root {
    min-height: 100vh;
    background: linear-gradient(160deg, #0a1929 0%, #1d3557 55%, #243b55 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 36px 24px 32px;
    position: relative;
    overflow: hidden;
  }
  .lp-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0);
    background-size: 28px 28px;
    pointer-events: none;
  }

  /* ── Header ── */
  .lp-header {
    text-align: center;
    margin-bottom: 30px;
    position: relative;
    z-index: 1;
    width: 100%;
  }
  .lp-logo-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .lp-logo-icon {
    width: 44px;
    height: 44px;
    border-radius: 11px;
    background: rgba(168,218,220,0.15);
    border: 1px solid rgba(168,218,220,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* ── Main 3-col grid ── */
  .lp-main {
    display: grid;
    grid-template-columns: 1fr 390px 1fr;
    grid-template-areas: "left center right";
    gap: 20px;
    align-items: center;
    width: 100%;
    max-width: 1280px;
    position: relative;
    z-index: 1;
  }
  .lp-col-left  { grid-area: left;   display: flex; flex-direction: column; gap: 14px; }
  .lp-col-center { grid-area: center; }
  .lp-col-right { grid-area: right;  display: flex; flex-direction: column; gap: 14px; }

  /* ── Feature card (main) ── */
  .lp-feature-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(168,218,220,0.15);
    border-radius: 10px;
    padding: 15px 17px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    backdrop-filter: blur(4px);
    transition: background 0.2s;
  }
  .lp-feature-card:hover { background: rgba(255,255,255,0.08); }
  .lp-feature-icon {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(168,218,220,0.12);
    border: 1px solid rgba(168,218,220,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  /* ── Login card ── */
  .lp-login-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08);
  }
  .lp-card-header {
    background: linear-gradient(135deg, #1d3557 0%, #2a4a72 100%);
    padding: 22px 28px;
    text-align: center;
  }
  .lp-card-body { padding: 24px 28px 20px; }
  .lp-card-footer {
    background: #f8fafc;
    border-top: 1px solid #e9edf2;
    padding: 12px 28px;
    text-align: center;
  }

  /* ── Bottom 4-col strip ── */
  .lp-bottom {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    width: 100%;
    max-width: 1280px;
    margin-top: 20px;
    position: relative;
    z-index: 1;
  }
  .lp-feature-card-sm {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(168,218,220,0.12);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
    backdrop-filter: blur(4px);
    transition: background 0.2s;
  }
  .lp-feature-card-sm:hover { background: rgba(255,255,255,0.07); }
  .lp-feature-icon-sm {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: rgba(168,218,220,0.12);
    border: 1px solid rgba(168,218,220,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  /* ── Badges ── */
  .lp-badges {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 9px;
    position: relative;
    z-index: 1;
  }
  .lp-badge-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .lp-segment-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }

  /* ── Tablet (≤ 1099px): login top full-width, features 2-col below ── */
  @media (max-width: 1099px) {
    .lp-main {
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
        "center center"
        "left   right";
      max-width: 820px;
      gap: 16px;
    }
    .lp-col-center { max-width: 460px; margin: 0 auto; width: 100%; }
    .lp-bottom {
      grid-template-columns: repeat(2, 1fr);
      max-width: 820px;
    }
  }

  /* ── Mobile (≤ 639px): stack to single column ── */
  @media (max-width: 639px) {
    .lp-root { padding: 24px 16px 28px; }
    .lp-header { margin-bottom: 20px; }
    .lp-main {
      grid-template-columns: 1fr;
      grid-template-areas:
        "center"
        "left"
        "right";
      max-width: 100%;
      gap: 12px;
    }
    .lp-col-center { max-width: 100%; }
    .lp-col-left,
    .lp-col-right { gap: 10px; }
    .lp-feature-card { padding: 12px 14px; }
    .lp-card-header { padding: 18px 20px; }
    .lp-card-body   { padding: 20px 20px 16px; }
    .lp-card-footer { padding: 11px 20px; }
    .lp-bottom {
      grid-template-columns: repeat(2, 1fr);
      margin-top: 12px;
    }
  }
`;

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="lp-feature-card">
      <div className="lp-feature-icon">{feature.icon}</div>
      <div>
        <Text style={{ color: '#e8f4f8', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 3 }}>
          {feature.title}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: 11.5, lineHeight: 1.55 }}>
          {feature.desc}
        </Text>
      </div>
    </div>
  );
}

function FeatureCardSm({ feature }: { feature: Feature }) {
  return (
    <div className="lp-feature-card-sm">
      <div className="lp-feature-icon-sm">{feature.icon}</div>
      <div>
        <Text style={{ color: '#e8f4f8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>
          {feature.title}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, lineHeight: 1.5 }}>
          {feature.desc}
        </Text>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const sessionMessage = reason ? SESSION_MESSAGES[reason] : null;

  return (
    <>
      <style>{STYLES}</style>
      <div className="lp-root">

        {/* ── Platform Header ── */}
        <div className="lp-header">
          <div className="lp-logo-row">
            <div className="lp-logo-icon">
              <StockOutlined style={{ fontSize: 24, color: '#a8dadc' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <Title
                level={3}
                style={{ color: '#ffffff', margin: 0, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.1 }}
              >
                PostTrade Backoffice
              </Title>
              <Text style={{ color: '#a8dadc', fontSize: 11, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Equity · F&amp;O · Currency · Commodity Operations
              </Text>
            </div>
          </div>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            India's end-to-end post-trade platform — clearing, settlement, reconciliation &amp; compliance
          </Text>
        </div>

        {/* ── Main: Features | Login | Features ── */}
        <div className="lp-main">

          {/* Left features */}
          <div className="lp-col-left">
            {LEFT_FEATURES.map((f) => (
              <FeatureCard key={f.title} feature={f} />
            ))}
          </div>

          {/* Center: Login card */}
          <div className="lp-col-center">
            {sessionMessage && (
              <Alert
                type="warning"
                message={sessionMessage}
                showIcon
                style={{ marginBottom: 14, borderRadius: 8 }}
              />
            )}
            <div className="lp-login-card">
              <div className="lp-card-header">
                <Title
                  level={4}
                  style={{ color: '#ffffff', margin: '0 0 3px', fontWeight: 700, letterSpacing: '-0.2px' }}
                >
                  Broker Portal Sign In
                </Title>
                <Text style={{ color: 'rgba(168,218,220,0.85)', fontSize: 12 }}>
                  Access your post-trade backoffice workspace
                </Text>
              </div>
              <div className="lp-card-body">
                <LoginForm />
              </div>
              <div className="lp-card-footer">
                <Text style={{ color: '#94a3b8', fontSize: 11.5 }}>
                  For access issues, contact your system administrator
                </Text>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                © {new Date().getFullYear()} PostTrade Backoffice &nbsp;·&nbsp; All rights reserved
              </Text>
            </div>
          </div>

          {/* Right features */}
          <div className="lp-col-right">
            {RIGHT_FEATURES.map((f) => (
              <FeatureCard key={f.title} feature={f} />
            ))}
          </div>

        </div>

        {/* ── Bottom compact feature strip ── */}
        <div className="lp-bottom">
          {BOTTOM_FEATURES.map((f) => (
            <FeatureCardSm key={f.title} feature={f} />
          ))}
        </div>

        {/* ── Exchange / segment badges ── */}
        <div className="lp-badges">
          <div className="lp-segment-row">
            {SEGMENTS.map((s) => (
              <span
                key={s}
                style={{
                  padding: '2px 9px',
                  borderRadius: 3,
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'rgba(255,220,100,0.8)',
                  background: 'rgba(255,220,100,0.07)',
                  border: '1px solid rgba(255,220,100,0.18)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <div className="lp-badge-row">
            {BADGES.map((b) => (
              <span
                key={b}
                style={{
                  padding: '3px 11px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.7px',
                  color: '#a8dadc',
                  background: 'rgba(168,218,220,0.08)',
                  border: '1px solid rgba(168,218,220,0.2)',
                }}
              >
                {b}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleFilled style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }} />
            <Text style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11 }}>
              SEBI Registered Broker Operations &nbsp;·&nbsp; 256-bit Encrypted &nbsp;·&nbsp; Role-Based Access Control
            </Text>
          </div>
        </div>

      </div>
    </>
  );
}
