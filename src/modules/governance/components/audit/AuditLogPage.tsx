import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Input, DatePicker, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getAuditLog } from '../../services/auditService';
import { AuditTable } from './AuditTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { JsonDiffViewer } from '@shared/components/data-display/JsonDiffViewer';
import { formatDateTime } from '@utils/formatters';
import { Descriptions, Tag } from 'antd';
import type { AuditLogEntry } from '../../services/auditService';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [action, setAction] = useState('');
  const [entityName, setEntityName] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | undefined>(undefined);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const { data: allData, isLoading, isError } = useQuery({
    queryKey: ['audit-log', { action: action || undefined, entityName: entityName || undefined, fromDate: dateRange?.[0], toDate: dateRange?.[1] }],
    queryFn: () => getAuditLog({
      action: action || undefined,
      entityName: entityName || undefined,
      fromDate: dateRange?.[0],
      toDate: dateRange?.[1],
    }),
    staleTime: 30_000,
    retry: false, // Endpoint may not exist yet
  });

  const pageData = useMemo(
    () => (allData ?? []).slice((page - 1) * pageSize, page * pageSize),
    [allData, page, pageSize],
  );

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const handleDateChange = useCallback((dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates?.[0] && dates[1]) {
      setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
    } else {
      setDateRange(undefined);
    }
    setPage(1);
  }, []);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16, color: '#1d3557' }}>
        Audit Log
      </Title>

      {isError && (
        <Alert
          type="warning"
          message="Audit log endpoint not yet available"
          description="The backend audit query API is under development. The AuditLog entity exists but GET /api/audit endpoints need to be implemented."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Action (e.g. Create, Update)"
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Input
            placeholder="Entity Name (e.g. Trade)"
            value={entityName}
            onChange={(e) => { setEntityName(e.target.value); setPage(1); }}
            allowClear
          />
        </Col>
        <Col span={8}>
          <RangePicker style={{ width: '100%' }} onChange={handleDateChange} />
        </Col>
      </Row>

      <AuditTable
        data={pageData}
        loading={isLoading}
        total={allData?.length ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onRowClick={setSelected}
      />

      <SlideDrawer
        title="Audit Entry Detail"
        open={!!selected}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Timestamp" span={2}>{formatDateTime(selected.timestamp)}</Descriptions.Item>
              <Descriptions.Item label="User" span={1}>{selected.username}</Descriptions.Item>
              <Descriptions.Item label="Action" span={1}>
                <Tag color="blue">{selected.action}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Entity" span={1}>
                <Tag color="geekblue">{selected.entityName}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Entity ID" span={1}>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{selected.entityId}</span>
              </Descriptions.Item>
              <Descriptions.Item label="IP Address" span={1}>{selected.ipAddress}</Descriptions.Item>
              <Descriptions.Item label="Audit Type" span={1}>{selected.auditType}</Descriptions.Item>
            </Descriptions>

            {(selected.oldValues ?? selected.newValues) && (
              <JsonDiffViewer
                before={selected.oldValues ?? {}}
                after={selected.newValues ?? {}}
              />
            )}
          </>
        )}
      </SlideDrawer>
    </div>
  );
}
