import { Row, Col, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useDebounce } from '@shared/hooks/useDebounce';
import { EntityStatus, ClientType } from '@app-types/enums';
import { useState, useEffect } from 'react';

interface ClientFiltersProps {
  onChange: (filters: {
    search?: string | undefined;
    status?: EntityStatus | undefined;
    type?: ClientType | undefined;
  }) => void;
}

export function ClientFilters({ onChange }: ClientFiltersProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EntityStatus | undefined>(undefined);
  const [type, setType] = useState<ClientType | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    onChange({ search: debouncedSearch || undefined, status, type });
  }, [debouncedSearch, status, type, onChange]);

  return (
    <Row gutter={12} style={{ marginBottom: 16 }}>
      <Col span={10}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name or code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </Col>
      <Col span={6}>
        <Select<EntityStatus>
          placeholder="Status"
          style={{ width: '100%' }}
          allowClear
          value={status ?? null}
          onChange={setStatus}
          options={[
            { label: 'Active', value: EntityStatus.Active },
            { label: 'Inactive', value: EntityStatus.Inactive },
            { label: 'Deleted', value: EntityStatus.Deleted },
          ]}
        />
      </Col>
      <Col span={6}>
        <Select<ClientType>
          placeholder="Client Type"
          style={{ width: '100%' }}
          allowClear
          value={type ?? null}
          onChange={setType}
          options={[
            { label: 'Individual', value: ClientType.Individual },
            { label: 'Corporate', value: ClientType.Corporate },
          ]}
        />
      </Col>
    </Row>
  );
}
