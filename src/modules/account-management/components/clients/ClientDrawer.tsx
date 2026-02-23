import { Descriptions } from 'antd';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { MaskedField } from '@shared/components/data-display/MaskedField';
import { useClientDetail } from '../../hooks/useClients';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Permission } from '@app-types/roles.types';

interface ClientDrawerProps {
  clientId: string | null;
  onClose: () => void;
}

export function ClientDrawer({ clientId, onClose }: ClientDrawerProps) {
  const { data: client, isLoading } = useClientDetail(clientId);
  const canViewSensitive = useAuthStore((s) => s.hasPermission(Permission.VIEW_SENSITIVE_FIELDS));

  return (
    <SlideDrawer
      title={client?.clientName ?? 'Client Detail'}
      open={!!clientId}
      onClose={onClose}
      isLoading={isLoading}
    >
      {client && (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Client Code" span={1}>
            {client.clientCode}
          </Descriptions.Item>
          <Descriptions.Item label="Name" span={1}>{client.clientName}</Descriptions.Item>
          <Descriptions.Item label="Type" span={1}>{client.clientType}</Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            <StatusBadge status={client.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Email" span={2}>{client.email}</Descriptions.Item>
          <Descriptions.Item label="Phone" span={1}>{client.phone}</Descriptions.Item>
          <Descriptions.Item label="PAN" span={1}>
            {canViewSensitive ? (client.pan ?? '—') : <MaskedField />}
          </Descriptions.Item>
          <Descriptions.Item label="Bank Account" span={1}>
            {canViewSensitive ? (client.bankAccountNo ?? '—') : <MaskedField />}
          </Descriptions.Item>
          <Descriptions.Item label="Bank Name" span={1}>{client.bankName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>{client.address ?? '—'}</Descriptions.Item>
        </Descriptions>
      )}
    </SlideDrawer>
  );
}
