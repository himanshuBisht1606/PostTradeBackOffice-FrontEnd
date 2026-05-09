import type { CmFileType, CmImportStatus, CmTriggerSource } from '@app-types/enums';

export interface CmImportBatch {
  batchId: string;
  tenantId: string;
  fileType: CmFileType;
  exchange: string;
  tradingDate: string;
  status: CmImportStatus;
  triggerSource: CmTriggerSource;
  fileName: string;
  totalRows: number;
  createdRows: number;
  skippedRows: number;
  errorRows: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface CmImportBatchLog {
  logId: string;
  batchId: string;
  rowNumber: number;
  level: string;
  message: string;
  rawData: string | null;
}

export interface CmSettlementMaster {
  cmSettlementMasterId: string;
  exchange: string;
  tradingDate: string;
  settlementNo: string;
  settlementType: string;
  payInDate: string;
  payOutDate: string;
}

export interface CmScripMaster {
  cmScripMasterId: string;
  exchange: string;
  tradingDate: string;
  symbol: string;
  isin: string;
  series: string;
  name: string;
  faceValue: number;
  lotSize: number;
  tickSize: number;
  instrumentType: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}
