/**
 * Domain enums mirroring the backend exactly (serialized as strings).
 * Source of truth: PostTrade.Domain/Enums/
 */

export enum TradeSide {
  Buy = 'Buy',
  Sell = 'Sell',
}

export enum TradeStatus {
  Booked = 'Booked',
  Confirmed = 'Confirmed',
  Settled = 'Settled',
  Cancelled = 'Cancelled',
  Rejected = 'Rejected',
}

export enum TradeSource {
  Manual = 'Manual',
  Exchange = 'Exchange',
  API = 'API',
}

export enum SettlementStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed',
}

export enum ObligationStatus {
  Pending = 'Pending',
  Settled = 'Settled',
  PartiallySettled = 'PartiallySettled',
  Failed = 'Failed',
}

export enum LedgerType {
  ClientLedger = 'ClientLedger',
  BrokerLedger = 'BrokerLedger',
  CashLedger = 'CashLedger',
  SecuritiesLedger = 'SecuritiesLedger',
}

export enum EntryType {
  Debit = 'Debit',
  Credit = 'Credit',
}

export enum ChargeType {
  Brokerage = 'Brokerage',
  STT = 'STT',
  GST = 'GST',
  ExchangeTxn = 'ExchangeTxn',
  SEBI = 'SEBI',
  StampDuty = 'StampDuty',
}

export enum CalculationType {
  Percentage = 'Percentage',
  Flat = 'Flat',
  Slab = 'Slab',
}

export enum ReconType {
  Trade = 'Trade',
  Position = 'Position',
  Obligation = 'Obligation',
  Funds = 'Funds',
  Securities = 'Securities',
}

export enum ReconStatus {
  Pending = 'Pending',
  Matched = 'Matched',
  Variated = 'Variated',
  Resolved = 'Resolved',
}

export enum ExceptionType {
  QuantityMismatch = 'QuantityMismatch',
  PriceMismatch = 'PriceMismatch',
  MissingTrade = 'MissingTrade',
  DuplicateTrade = 'DuplicateTrade',
  Other = 'Other',
}

export enum ExceptionStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Resolved = 'Resolved',
  Closed = 'Closed',
}

export enum CorporateActionType {
  Dividend = 'Dividend',
  Bonus = 'Bonus',
  Split = 'Split',
  Rights = 'Rights',
  Merger = 'Merger',
  Demerger = 'Demerger',
}

export enum CorporateActionStatus {
  Announced = 'Announced',
  Processing = 'Processing',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum EntityStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Deleted = 'Deleted',
}

export enum ClientStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
  Closed = 'Closed',
}

export enum BrokerStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
}

export enum ClientType {
  Individual = 'Individual',
  Corporate = 'Corporate',
}

export enum KYCStatus {
  Pending = 'Pending',
  Verified = 'Verified',
  Expired = 'Expired',
}

export enum RiskCategory {
  Conservative = 'Conservative',
  Moderate = 'Moderate',
  Aggressive = 'Aggressive',
}

export enum Depository {
  CDSL = 'CDSL',
  NSDL = 'NSDL',
}

export enum InstrumentType {
  Equity = 'Equity',
  Futures = 'Futures',
  Options = 'Options',
  Currency = 'Currency',
  Commodity = 'Commodity',
}

export enum InstrumentStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Expired = 'Expired',
}

export enum OptionType {
  Call = 'Call',
  Put = 'Put',
}

export enum SettlementType {
  T1 = 'T1',
  T2 = 'T2',
  Intraday = 'Intraday',
}

export enum ActivationStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
}

export enum MarginType {
  Cash = 'Cash',
  NonCash = 'NonCash',
}
