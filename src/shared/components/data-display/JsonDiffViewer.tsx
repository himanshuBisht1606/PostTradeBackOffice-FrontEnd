import { useMemo } from 'react';

interface JsonDiffViewerProps {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

/**
 * Side-by-side JSON diff viewer for audit log row expansion.
 * Highlights changed fields. Uses pre-rendered text — no dangerouslySetInnerHTML.
 */
export function JsonDiffViewer({ before, after }: JsonDiffViewerProps) {
  const allKeys = useMemo(() => {
    const keys = new Set<string>([
      ...Object.keys(before ?? {}),
      ...Object.keys(after ?? {}),
    ]);
    return Array.from(keys).sort();
  }, [before, after]);

  const cellStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontFamily: 'monospace',
    fontSize: 12,
    verticalAlign: 'top',
    borderBottom: '1px solid #f0f0f0',
    wordBreak: 'break-word',
    maxWidth: 280,
  };

  const headerStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 600,
    background: '#fafafa',
    borderBottom: '2px solid #e8e8e8',
  };

  return (
    <div style={{ overflowX: 'auto', fontSize: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...headerStyle, minWidth: 140 }}>Field</th>
            <th style={{ ...headerStyle, color: '#cf1322' }}>Before</th>
            <th style={{ ...headerStyle, color: '#389e0d' }}>After</th>
          </tr>
        </thead>
        <tbody>
          {allKeys.map((key) => {
            const beforeVal = renderValue(before?.[key]);
            const afterVal = renderValue(after?.[key]);
            const changed = beforeVal !== afterVal;
            return (
              <tr key={key} style={{ background: changed ? '#fffbe6' : undefined }}>
                <td style={{ ...cellStyle, fontWeight: changed ? 600 : 400 }}>{key}</td>
                <td style={{ ...cellStyle, color: changed ? '#cf1322' : undefined }}>
                  {beforeVal}
                </td>
                <td style={{ ...cellStyle, color: changed ? '#389e0d' : undefined }}>
                  {afterVal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
