import { useState } from 'react';
import { Descriptions, Button, Space, Popconfirm } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { MaskedField } from '@shared/components/data-display/MaskedField';
import { useClientDetail } from '../../hooks/useClients';
import { updateClient } from '../../services/clientService';
import { ClientFormModal } from './ClientFormModal';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Permission } from '@app-types/roles.types';
import { Role } from '@app-types/roles.types';
import { EntityStatus } from '@app-types/enums';
import { notifySuccess, notifyError } from '@utils/errorHandler';

const CAN_EDIT_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner, Role.OperationsController];

interface ClientDrawerProps {
  clientId: string | null;
  onClose: () => void;
}

export function ClientDrawer({ clientId, onClose }: ClientDrawerProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { data: client, isLoading } = useClientDetail(clientId);
  const canViewSensitive = useAuthStore((s) => s.hasPermission(Permission.VIEW_SENSITIVE_FIELDS));
  const { hasRole } = useAuthStore();
  const canEdit = hasRole(CAN_EDIT_ROLES);
  const queryClient = useQueryClient();

  const toggleStatusMutation = useMutation({
    mutationFn: (newStatus: EntityStatus) =>
      updateClient(clientId as string, { status: newStatus }),
    onSuccess: (updated) => {
      notifySuccess(`Client ${updated.status === EntityStatus.Active ? 'activated' : 'deactivated'}`);
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err) => notifyError(err, 'Failed to update status'),
  });

  const isActive = client?.status === EntityStatus.Active;

  return (
    <>
      <SlideDrawer
        title={client?.clientName ?? 'Client Detail'}
        open={!!clientId}
        onClose={onClose}
        isLoading={isLoading}
        extra={
          canEdit && client ? (
            <Space>
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
              <Popconfirm
                title={isActive ? 'Deactivate client?' : 'Activate client?'}
                description="This will change the client status."
                onConfirm={() =>
                  toggleStatusMutation.mutate(
                    isActive ? EntityStatus.Inactive : EntityStatus.Active,
                  )
                }
                okText="Confirm"
              >
                <Button
                  size="small"
                  danger={isActive}
                  loading={toggleStatusMutation.isPending}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </Popconfirm>
            </Space>
          ) : undefined
        }
      >
        {client && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Client Code" span={1}>
              {client.clientCode}
            </Descriptions.Item>
            <Descriptions.Item label="Name" span={1}>
              {client.clientName}
            </Descriptions.Item>
            <Descriptions.Item label="Type" span={1}>
              {client.clientType}
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <StatusBadge status={client.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={2}>
              {client.email}
            </Descriptions.Item>
            <Descriptions.Item label="Phone" span={1}>
              {client.phone}
            </Descriptions.Item>
            <Descriptions.Item label="PAN" span={1}>
              {canViewSensitive ? (client.pan ?? '—') : <MaskedField />}
            </Descriptions.Item>
            <Descriptions.Item label="Bank Account" span={1}>
              {canViewSensitive ? (client.bankAccountNo ?? '—') : <MaskedField />}
            </Descriptions.Item>
            <Descriptions.Item label="Bank Name" span={1}>
              {client.bankName ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>
              {client.address ?? '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </SlideDrawer>

      {client && (
        <ClientFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initialData={client}
        />
      )}
    </>
  );
}
