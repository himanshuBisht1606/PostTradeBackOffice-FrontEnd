import { useState, useCallback, useMemo } from 'react';
import {
  Typography, Row, Col, Select, Tag, Button, Modal, Form,
  Input, InputNumber, DatePicker, Switch, Space, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  getChargesConfig, createChargesConfig, updateChargesConfig, toggleChargesConfigStatus,
} from '../../services/chargesService';
import type { ChargeConfig, CreateChargeConfigPayload, UpdateChargeConfigPayload } from '../../services/chargesService';
import { DataTable } from '@shared/components/data-display/DataTable';
import { formatDate } from '@utils/formatters';
import { ChargeType, TradeSegment, ChargeApplicableTo, CalculationType } from '@app-types/enums';

const { Title } = Typography;

// ── Label maps ──────────────────────────────────────────────────────────────

const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  [ChargeType.Brokerage]:      'Brokerage',
  [ChargeType.STT]:            'STT',
  [ChargeType.GST]:            'GST (18%)',
  [ChargeType.ExchangeTxn]:    'Exchange Txn',
  [ChargeType.SEBI]:           'SEBI Fees',
  [ChargeType.StampDuty]:      'Stamp Duty',
  [ChargeType.IPFT]:           'IPFT',
  [ChargeType.DPCharge]:       'DP Charge',
  [ChargeType.ClearingCharge]: 'Clearing Charge',
  [ChargeType.Other]:          'Other',
};

const CHARGE_TYPE_COLORS: Partial<Record<ChargeType, string>> = {
  [ChargeType.Brokerage]:      'blue',
  [ChargeType.STT]:            'red',
  [ChargeType.GST]:            'orange',
  [ChargeType.ExchangeTxn]:    'purple',
  [ChargeType.SEBI]:           'geekblue',
  [ChargeType.StampDuty]:      'volcano',
  [ChargeType.IPFT]:           'cyan',
  [ChargeType.DPCharge]:       'magenta',
  [ChargeType.ClearingCharge]: 'gold',
  [ChargeType.Other]:          'default',
};

const SEGMENT_LABELS: Record<TradeSegment, string> = {
  [TradeSegment.All]: 'All Segments',
  [TradeSegment.CM]:  'CM (Equity)',
  [TradeSegment.FO]:  'F&O',
  [TradeSegment.CDS]: 'Currency (CDS)',
  [TradeSegment.COM]: 'Commodity',
};

const APPLICABLE_TO_LABELS: Record<ChargeApplicableTo, string> = {
  [ChargeApplicableTo.Both]: 'Buy + Sell',
  [ChargeApplicableTo.Buy]:  'Buy only',
  [ChargeApplicableTo.Sell]: 'Sell only',
};

const CALC_TYPE_LABELS: Record<CalculationType, string> = {
  [CalculationType.Percentage]: '% of Turnover',
  [CalculationType.Flat]:       'Flat Amount',
  [CalculationType.Slab]:       'Slab',
};

// ── Form helpers ─────────────────────────────────────────────────────────────

interface FormValues {
  chargeName: string;
  chargeType: ChargeType;
  segment: TradeSegment;
  applicableTo: ChargeApplicableTo;
  calculationType: CalculationType;
  rate: number;
  minAmount?: number | null;
  maxAmount?: number | null;
  effectiveFrom: dayjs.Dayjs;
  effectiveTo?: dayjs.Dayjs | null;
  remarks?: string | null;
}

function toFormValues(c: ChargeConfig): FormValues {
  return {
    chargeName: c.chargeName,
    chargeType: c.chargeType,
    segment: c.segment,
    applicableTo: c.applicableTo,
    calculationType: c.calculationType,
    rate: c.rate,
    minAmount: c.minAmount,
    maxAmount: c.maxAmount,
    effectiveFrom: dayjs(c.effectiveFrom),
    effectiveTo: c.effectiveTo ? dayjs(c.effectiveTo) : null,
    remarks: c.remarks,
  };
}

// ── Main page ────────────────────────────────────────────────────────────────

export function ChargesConfigPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterChargeType, setFilterChargeType] = useState<ChargeType | undefined>(undefined);
  const [filterSegment, setFilterSegment] = useState<TradeSegment | undefined>(undefined);
  const [filterActive, setFilterActive] = useState<'true' | 'false' | undefined>('true');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ChargeConfig | null>(null);
  const [form] = Form.useForm<FormValues>();

  const { data: allData, isLoading } = useQuery({
    queryKey: ['charges-config', { filterChargeType, filterSegment, filterActive }],
    queryFn: () =>
      getChargesConfig({
        chargeType: filterChargeType,
        segment: filterSegment,
        isActive: filterActive === undefined ? undefined : filterActive === 'true',
      }),
    staleTime: 30_000,
  });

  const pageData = useMemo(
    () => (allData ?? []).slice((page - 1) * pageSize, page * pageSize),
    [allData, page, pageSize],
  );

  const createMutation = useMutation({
    mutationFn: createChargesConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges-config'] });
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateChargesConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges-config'] });
      setModalOpen(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleChargesConfigStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['charges-config'] }),
  });

  const openAdd = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      segment: TradeSegment.CM,
      applicableTo: ChargeApplicableTo.Both,
      calculationType: CalculationType.Percentage,
      effectiveFrom: dayjs(),
    });
    setModalOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (record: ChargeConfig) => {
      setEditingRecord(record);
      form.setFieldsValue(toFormValues(record));
      setModalOpen(true);
    },
    [form],
  );

  const handleSubmit = useCallback(
    async (values: FormValues) => {
      const payload: CreateChargeConfigPayload = {
        chargeName: values.chargeName,
        chargeType: values.chargeType,
        segment: values.segment,
        applicableTo: values.applicableTo,
        calculationType: values.calculationType,
        rate: values.rate,
        minAmount: values.minAmount ?? null,
        maxAmount: values.maxAmount ?? null,
        effectiveFrom: values.effectiveFrom.toISOString(),
        effectiveTo: values.effectiveTo ? values.effectiveTo.toISOString() : null,
        remarks: values.remarks ?? null,
      };

      if (editingRecord) {
        const upd: UpdateChargeConfigPayload = {
          ...payload,
          chargesConfigId: editingRecord.chargesConfigId,
        };
        updateMutation.mutate(upd);
      } else {
        createMutation.mutate(payload);
      }
    },
    [editingRecord, createMutation, updateMutation],
  );

  const columns: TableColumnsType<ChargeConfig> = [
    {
      title: 'Charge Name',
      dataIndex: 'chargeName',
      ellipsis: true,
      width: 180,
    },
    {
      title: 'Type',
      dataIndex: 'chargeType',
      width: 140,
      render: (v: ChargeType) => (
        <Tag color={CHARGE_TYPE_COLORS[v] ?? 'default'}>{CHARGE_TYPE_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: 'Segment',
      dataIndex: 'segment',
      width: 120,
      render: (v: TradeSegment) => (
        <Tag color={v === TradeSegment.All ? 'default' : 'green'}>{SEGMENT_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: 'Applicable To',
      dataIndex: 'applicableTo',
      width: 110,
      render: (v: ChargeApplicableTo) => (
        <Tag color={v === ChargeApplicableTo.Both ? 'default' : 'blue'}>
          {APPLICABLE_TO_LABELS[v] ?? v}
        </Tag>
      ),
    },
    {
      title: 'Calc Basis',
      dataIndex: 'calculationType',
      width: 130,
      render: (v: CalculationType) => (
        <Tag color="geekblue">{CALC_TYPE_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      width: 100,
      align: 'right',
      render: (v: number, row: ChargeConfig) =>
        row.calculationType === CalculationType.Flat
          ? `₹${v.toFixed(2)}`
          : `${v.toFixed(6)}%`,
    },
    {
      title: 'Min',
      dataIndex: 'minAmount',
      width: 80,
      align: 'right',
      render: (v: number | null) => (v != null ? `₹${v.toFixed(2)}` : '—'),
    },
    {
      title: 'Max',
      dataIndex: 'maxAmount',
      width: 80,
      align: 'right',
      render: (v: number | null) => (v != null ? `₹${v.toFixed(2)}` : '—'),
    },
    {
      title: 'Effective From',
      dataIndex: 'effectiveFrom',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Effective To',
      dataIndex: 'effectiveTo',
      width: 120,
      render: (v: string | null) => (v ? formatDate(v) : '—'),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      align: 'center',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      ellipsis: true,
      width: 150,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      fixed: 'right',
      render: (_: unknown, record: ChargeConfig) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
            <Button
              size="small"
              danger={record.isActive}
              icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              loading={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate(record.chargesConfigId)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            Charges Configuration
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Add Charge
          </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={10} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Select<ChargeType>
            placeholder="Charge Type"
            style={{ width: '100%' }}
            allowClear
            value={filterChargeType ?? null}
            onChange={(v) => { setFilterChargeType(v); setPage(1); }}
            options={Object.values(ChargeType).map((v) => ({
              label: CHARGE_TYPE_LABELS[v],
              value: v,
            }))}
          />
        </Col>
        <Col span={5}>
          <Select<TradeSegment>
            placeholder="Segment"
            style={{ width: '100%' }}
            allowClear
            value={filterSegment ?? null}
            onChange={(v) => { setFilterSegment(v); setPage(1); }}
            options={Object.values(TradeSegment).map((v) => ({
              label: SEGMENT_LABELS[v],
              value: v,
            }))}
          />
        </Col>
        <Col span={4}>
          <Select<'true' | 'false'>
            placeholder="Status"
            style={{ width: '100%' }}
            allowClear
            value={filterActive ?? null}
            onChange={(v) => { setFilterActive(v); setPage(1); }}
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
          />
        </Col>
      </Row>

      <DataTable<ChargeConfig>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="chargesConfigId"
        scroll={{ x: 1400 }}
        pagination={{
          current: page,
          pageSize,
          total: allData?.length ?? 0,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          showSizeChanger: true,
          showTotal: (t) => `${t} configurations`,
        }}
      />

      {/* Add / Edit Modal */}
      <Modal
        title={editingRecord ? 'Edit Charge Configuration' : 'Add Charge Configuration'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isSaving}
        width={680}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 8 }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="chargeName"
                label="Charge Name"
                rules={[{ required: true, message: 'Required' }, { max: 100 }]}
              >
                <Input placeholder="e.g. NSE F&O Exchange Transaction Charge" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="chargeType" label="Charge Type" rules={[{ required: true }]}>
                <Select
                  options={Object.values(ChargeType).map((v) => ({
                    label: CHARGE_TYPE_LABELS[v],
                    value: v,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="segment" label="Segment" rules={[{ required: true }]}>
                <Select
                  options={Object.values(TradeSegment).map((v) => ({
                    label: SEGMENT_LABELS[v],
                    value: v,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="applicableTo" label="Applicable To" rules={[{ required: true }]}>
                <Select
                  options={Object.values(ChargeApplicableTo).map((v) => ({
                    label: APPLICABLE_TO_LABELS[v],
                    value: v,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="calculationType" label="Calculation Basis" rules={[{ required: true }]}>
                <Select
                  options={Object.values(CalculationType).map((v) => ({
                    label: CALC_TYPE_LABELS[v],
                    value: v,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="rate"
                label="Rate"
                rules={[{ required: true, type: 'number', min: 0, message: 'Required, ≥ 0' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  precision={6}
                  placeholder="0.000035"
                  addonAfter={<Form.Item noStyle shouldUpdate={(p, c) => p.calculationType !== c.calculationType}>
                    {({ getFieldValue }) =>
                      getFieldValue('calculationType') === CalculationType.Flat ? '₹' : '%'
                    }
                  </Form.Item>}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="minAmount" label="Min Amount (₹)">
                <InputNumber style={{ width: '100%' }} precision={2} min={0} placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxAmount" label="Max Amount (₹)">
                <InputNumber style={{ width: '100%' }} precision={2} min={0} placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="effectiveTo" label="Effective To">
                <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} maxLength={500} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
