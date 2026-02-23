import { Tooltip } from 'antd';
import { EyeInvisibleOutlined } from '@ant-design/icons';

interface MaskedFieldProps {
  /** Reason shown in the tooltip explaining why the field is masked. */
  reason?: string;
}

/**
 * Renders a masked placeholder for sensitive financial fields.
 * Used for: Margin %, Net Obligation, Charges %, Realized PnL.
 * Displayed when the current user lacks 'view:sensitive-fields' permission.
 */
export function MaskedField({ reason = 'Insufficient permissions to view this field' }: MaskedFieldProps) {
  return (
    <Tooltip title={reason}>
      <span
        style={{
          color: '#bfbfbf',
          letterSpacing: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'not-allowed',
          fontFamily: 'monospace',
        }}
      >
        <EyeInvisibleOutlined style={{ fontSize: 12 }} />
        ●●●●
      </span>
    </Tooltip>
  );
}
