import { Button, Popconfirm, Space, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { formatDateTime, truncateId } from '@utils/formatters';
import { canApprove } from '@utils/permissions';
import { useAuthStore } from '@modules/auth/store/authStore';
import { CHECKER_ROLES } from '@app-types/roles.types';
import type { ApprovalRecord } from '../../services/approvalService';

interface ApprovalTableProps {
  data: ApprovalRecord[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRowClick: (record: ApprovalRecord) => void;
}

export function ApprovalTable({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onApprove,
  onReject,
  onRowClick,
}: ApprovalTableProps) {
  const { userId, roles, hasRole } = useAuthStore();
  const canDoApproval = hasRole(CHECKER_ROLES);

  const columns: TableColumnsType<ApprovalRecord> = [
    {
      title: 'Entity Type',
      dataIndex: 'entityType',
      width: 150,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: 'Entity ID',
      dataIndex: 'entityId',
      width: 120,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 150,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => <StatusBadge status={v} />,
    },
    { title: 'Requested By', dataIndex: 'requestedBy', width: 140 },
    {
      title: 'Requested At',
      dataIndex: 'requestedAt',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'ID',
      dataIndex: 'id',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, record) => {
        if (record.status !== 'Pending') return null;
        const allowed =
          canDoApproval && canApprove(roles, userId ?? '', record.requestedByUserId);
        if (!allowed) return <span style={{ color: '#8c8c8c', fontSize: 12 }}>—</span>;

        return (
          <Space size={4}>
            <Popconfirm
              title="Approve this action?"
              onConfirm={() => onApprove(record.id)}
              okText="Approve"
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Approve
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Reject this action?"
              onConfirm={() => onReject(record.id)}
              okText="Reject"
              okButtonProps={{ danger: true }}
            >
              <Button danger size="small" icon={<CloseOutlined />}>
                Reject
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <DataTable<ApprovalRecord>
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: true,
        showTotal: (t) => `${t} approvals`,
      }}
      onRow={(record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } })}
    />
  );
}
