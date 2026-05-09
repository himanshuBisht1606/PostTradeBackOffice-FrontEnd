import type { FoFileType, FoImportStatus, FoTriggerSource } from '@app-types/enums';

export interface FoImportBatch {
  batchId: string;
  tenantId: string;
  fileType: FoFileType;
  exchange: string;
  tradingDate: string;
  status: FoImportStatus;
  triggerSource: FoTriggerSource;
  fileName: string;
  totalRows: number;
  createdRows: number;
  skippedRows: number;
  errorRows: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface FoImportBatchLog {
  logId: string;
  batchId: string;
  rowNumber: number;
  level: string;
  message: string;
  rawData: string | null;
}

export interface FoImportBatchLogSummary {
  level: string;
  message: string;
  count: number;
}

export interface FoImportBatchLogsPagedResponse {
  summary: FoImportBatchLogSummary[];
  items: FoImportBatchLog[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface FoContractMaster {
  contractRowId: string;
  tradingDate: string;
  exchange: string;
  finInstrmId: string;
  tckrSymb: string;
  finInstrmNm: string;
  xpryDt: string;
  strkPric: number;
  optnTp: string;
  finInstrmTp: string;
  stockNm: string;
  newBrdLotQty: number;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}
