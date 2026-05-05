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
    icon: <BarChartOutlined style={{ fontSize: 18, color: '#a8dadc' }} />,
    title: 'T+1 Settlement & Clearing',
    desc: 'Equity T+1, F&O daily settlement, Currency & Commodity segment obligation tracking across NSE · BSE · MCX · NCDEX',
  },
  {
    icon: <ReconciliationOutlined style={{ fontSize: 18, color: '#a8dadc' }} />,
    title: 'Trade Book & Reconciliation',
    desc: 'Real-time recon across exchange, broker and client legs with exception management and resolution workflows',
  },
  {
    icon: <RiseOutlined style={{ fontSize: 18, color: '#a8dadc' }} />,
    title: 'Margin & Risk Monitoring',
    desc: 'Client-level margin utilisation, fund obligation alerts and real-time risk exposure across segments',
  },
];

const RIGHT_FEATURES: Feature[] = [
  {
    icon: <SafetyCertificateOutlined style={{ fontSize: 18, color: '#a8dadc' }} />,
    title: 'SEBI Compliant Operations',
    desc: 'Complete audit trails, regulatory reporting, STP workflows and SEBI inspection-ready record keeping',
  },
  {
    icon: <TeamOutlined style={{ fontSize: 18, color: '#a8dadc' }} />,
    title: 'Client KYC & Onboarding',
    desc: 'PAN-linked KYC for individuals &amp; corporates, segment activation across Equity, F&amp;O, Currency &amp; Commodity',
  },
  {
    icon: <BankOutlined style={{ fontSize: 18, color: '#a8dadc' }} />,
    title: 'CDSL · NSDL Depository Ops',
    desc: 'Demat account mapping, DP master management, depository participant linkage and position tracking',
  },
];

const BOTTOM_FEATURES: Feature[] = [
  {
    icon: <FundOutlined style={{ fontSize: 15, color: '#a8dadc' }} />,
    title: 'Ledger & Charge Engine',
    desc: 'Brokerage slabs, STT, GST, exchange txn charges and client-wise ledger with debit/credit entries',
  },
  {
    icon: <FileProtectOutlined style={{ fontSize: 15, color: '#a8dadc' }} />,
    title: 'Corporate Actions',
    desc: 'Dividend, bonus, split, rights and merger event processing with entitlement computation',
  },
  {
    icon: <AuditOutlined style={{ fontSize: 15, color: '#a8dadc' }} />,
    title: 'Governance & Approvals',
    desc: 'Role-based approval workflows, audit log and RBAC permission management for all entities',
  },
  {
    icon: <PartitionOutlined style={{ fontSize: 15, color: '#a8dadc' }} />,
    title: 'Multi-Exchange Master Setup',
    desc: 'Exchange, segment, instrument, branch and DP master configuration for all markets',
  },
];

const BADGES = ['NSE', 'BSE', 'MCX', 'NCDEX', 'MSEI', 'CDSL', 'NSDL', 'SEBI'];
const SEGMENTS = ['EQ', 'F&O', 'CDS', 'COM', 'SLB', 'DEBT'];

function FeatureCard({ feature, compact = false }: { feature: Feature; compact?: boolean }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(168,218,220,0.15)',
        borderRadius: 10,
        padding: compact ? '12px 14px' : '16px 18px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: compact ? 32 : 36,
          height: compact ? 32 : 36,
          borderRadius: 8,
          background: 'rgba(168,218,220,0.12)',
          border: '1px solid rgba(168,218,220,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {feature.icon}
      </div>
      <div>
        <Text
          style={{
            color: '#e8f4f8',
            fontSize: compact ? 12 : 13,
            fontWeight: 600,
            display: 'block',
            marginBottom: 3,
          }}
        >
          {feature.title}
        </Text>
        <Text
          style={{
            color: 'rgba(255,255,255,0.42)',
            fontSize: compact ? 11 : 11.5,
            lineHeight: 1.5,
          }}
        >
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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0a1929 0%, #1d3557 55%, #243b55 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 24px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dot-grid texture */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }}
      />

      {/* ── Platform Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: 'rgba(168,218,220,0.15)',
              border: '1px solid rgba(168,218,220,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
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
          India's end-to-end post-trade platform — Equity, F&amp;O, Currency &amp; Commodity clearing
        </Text>
      </div>

      {/* ── 3-column layout: Features | Login | Features ── */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          width: '100%',
          maxWidth: 1200,
          alignItems: 'center',
          position: 'relative',
          flex: 1,
        }}
      >
        {/* Left feature column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {LEFT_FEATURES.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>

        {/* Center: Login card */}
        <div style={{ flexShrink: 0, width: 380 }}>
          {/* Session alert above the card */}
          {sessionMessage && (
            <Alert
              type="warning"
              message={sessionMessage}
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
            />
          )}

          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            {/* Card header band */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1d3557 0%, #2a4a72 100%)',
                padding: '20px 28px',
                textAlign: 'center',
              }}
            >
              <Title
                level={4}
                style={{ color: '#ffffff', margin: '0 0 2px', fontWeight: 700, letterSpacing: '-0.2px' }}
              >
                Broker Portal Sign In
              </Title>
              <Text style={{ color: 'rgba(168,218,220,0.85)', fontSize: 12 }}>
                Access your post-trade backoffice workspace
              </Text>
            </div>

            {/* Form body */}
            <div style={{ padding: '24px 28px 20px' }}>
              <LoginForm />
            </div>

            {/* Card footer */}
            <div
              style={{
                background: '#f8fafc',
                borderTop: '1px solid #e9edf2',
                padding: '12px 28px',
                textAlign: 'center',
              }}
            >
              <Text style={{ color: '#94a3b8', fontSize: 11.5 }}>
                For access issues, contact your system administrator
              </Text>
            </div>
          </div>

          {/* Copyright below card */}
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
              © {new Date().getFullYear()} PostTrade Backoffice &nbsp;·&nbsp; All rights reserved
            </Text>
          </div>
        </div>

        {/* Right feature column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {RIGHT_FEATURES.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </div>

      {/* ── Bottom feature strip ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          position: 'relative',
        }}
      >
        {BOTTOM_FEATURES.map((f) => (
          <FeatureCard key={f.title} feature={f} compact />
        ))}
      </div>

      {/* ── Exchange / depository badges ── */}
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
        }}
      >
        {/* Segment labels */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
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
        {/* Exchange / depository labels */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
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
  );
}
