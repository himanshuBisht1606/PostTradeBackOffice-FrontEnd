# Plan: Add Create / Edit / Delete Forms to Frontend

## Context
The frontend is fully read-only today — all modules show data from GET endpoints, but have no forms
to create or update records. The backend already implements all POST and PUT endpoints.
This plan adds Ant Design Modal forms and action buttons to each module so users can manage data
end-to-end from the UI without Swagger.

Legacy references used to validate this plan:
- **PT_CLEARING** (`C:\Personal\PTExisting\PT_CLEARING`) — ASP.NET MVC clearing system
- **TP_IFSC** (`C:\Personal\PTExisting\TP_IFSC`) — IFSC trading & clearing system

---

## ⚠️ Critical Enum Corrections (Verified Against Actual Backend Source)

These values were wrong in MEMORY.md and the original plan. Always use these.

| Enum | **Correct values (from backend enums/)** | Was wrong |
|---|---|---|
| `TradeStatus` | Pending, Validated, Settled, Rejected, Amended, Cancelled | Was: Booked, Confirmed, Settled, Cancelled, Rejected |
| `ReconStatus` | Pending, Matched, Mismatched, Resolved | Was: Pending, Matched, Variated, Resolved |
| `EntryType` | Trade, Charges, Payment, Receipt, Adjustment, CorporateAction | Was: Debit, Credit |
| `CorporateActionType` | Dividend, Bonus, Split, Rights, Merger, Demerger | (new) |
| `CorporateActionStatus` | Announced, Processing, Completed, Cancelled | (new) |
| `InstrumentType` | Equity, Derivative, Future, Option, Currency, Commodity | (new) |
| `OptionType` | Call, Put | (new) |
| `ObligationStatus` | Pending, Settled, PartiallySettled, Failed | (new) |

---

## Approach
- Use **Ant Design `Modal` + `Form`** (centered overlay) for create/edit — keeps Drawer for read-only details
- **Single `XxxFormModal`** per entity with optional `initialData` prop: omit = create mode, provide = edit mode
- "Delete" = status change via PUT (backend has no hard DELETE endpoints)
- Cancel trade uses a reason input inside a `Modal.confirm` prompt
- All mutations follow the existing pattern: `useMutation` → `notifySuccess` / `notifyError` → `queryClient.invalidateQueries`
- Permission checks use `useAuthStore().hasRole([...])` before rendering buttons

---

## Phases & Files

### Phase 0 — Master Setup: Exchange & Segment *(NEW — from backend)*

#### 0a. Exchange
**Service** `src/modules/master-setup/services/exchangeService.ts` *(new file)*
- `createExchange(body)` → POST `/api/exchanges`
- `updateExchange(id, body)` → PUT `/api/exchanges/{id}`
- `getExchanges()` → GET `/api/exchanges` *(already used in BookTradeModal)*

**New component** `src/modules/master-setup/components/exchanges/ExchangeFormModal.tsx`
- Props: `open`, `onClose`, `initialData?: ExchangeDto`
- Fields: exchangeCode (create-only), exchangeName, country, timeZone (optional), tradingStartTime (TimePicker optional), tradingEndTime (TimePicker optional)
- Edit adds: isActive toggle
- Role guard: PlatformSuperAdmin, TenantOwner

**New page** `src/modules/master-setup/components/exchanges/ExchangeListPage.tsx`
- Table: exchangeCode, exchangeName, country, isActive badge
- "Add Exchange" button → `<ExchangeFormModal>`
- Row action: "Edit" → `<ExchangeFormModal initialData={...}>`
- Row action: "Deactivate / Activate" via PUT

#### 0b. Segment
**Service** `src/modules/master-setup/services/segmentService.ts` *(new file)*
- `createSegment(body)` → POST `/api/segments`
- `updateSegment(id, body)` → PUT `/api/segments/{id}`
- `getSegments(exchangeId?)` → GET `/api/segments?exchangeId=...`

**New component** `src/modules/master-setup/components/segments/SegmentFormModal.tsx`
- Fields: exchangeId (Select from exchange list), segmentCode (create-only), segmentName
- Edit adds: isActive toggle
- Role guard: PlatformSuperAdmin, TenantOwner

---

### Phase 1 — Account Management

#### 1a. Clients
**Service** `src/modules/account-management/services/clientService.ts`
- Add `createClient(body: CreateClientPayload): Promise<ClientSummary>`
- Add `updateClient(id: string, body: UpdateClientPayload): Promise<ClientSummary>`

**New component** `src/modules/account-management/components/clients/ClientFormModal.tsx`
- Props: `open`, `onClose`, `initialData?: ClientSummary`
- Fields:
  - clientCode (create-only, required)
  - clientName (required)
  - email (required)
  - phone (required)
  - clientType (Select: Individual / Corporate / FII / DII)
  - brokerId (Select from broker list, required)
  - pan (optional)
  - dpId (optional) — *DP account id, from TP_IFSC DPDetails*
  - address (optional)
  - bankAccountNo (optional)
  - bankName (optional)
  - bankIFSC (optional)
- On submit: `createClient` or `updateClient` → invalidate `['clients']` → close

**Update** `src/modules/account-management/components/clients/ClientListPage.tsx`
- Add "Add Client" button (top-right); roles: PlatformSuperAdmin, TenantOwner, OperationsController
- Mount `<ClientFormModal>`

**Update** `src/modules/account-management/components/clients/ClientDrawer.tsx`
- "Edit" button → `<ClientFormModal initialData={client}>`
- "Deactivate / Activate" → PUT status toggle via `Modal.confirm`

#### 1b. Brokers
**Service** `src/modules/account-management/services/brokerService.ts`
- Add `createBroker(body)`, `updateBroker(id, body)`

**New component** `src/modules/account-management/components/brokers/BrokerFormModal.tsx`
- Fields: brokerCode (create-only), brokerName, contactEmail, contactPhone, sebiRegistrationNo, address, pan, gst
- Same mutation/notification pattern

**Update** `BrokerListPage.tsx` — "Add Broker" button
**Update** `BrokerTable.tsx` or add `BrokerDrawer.tsx` — "Edit" + "Deactivate/Activate" buttons

---

### Phase 2 — Master Setup: Instruments *(NEW — from backend)*

**Service** `src/modules/master-setup/services/instrumentService.ts` *(new file)*
- `createInstrument(body)` → POST `/api/instruments`
- `updateInstrument(id, body)` → PUT `/api/instruments/{id}`
- `getInstruments(exchangeId?, type?)` → GET `/api/instruments`

**New component** `src/modules/master-setup/components/instruments/InstrumentFormModal.tsx`
- Props: `open`, `onClose`, `initialData?: InstrumentDto`
- **Create fields:**
  - instrumentCode (required, create-only)
  - instrumentName (required)
  - symbol (required)
  - isin (optional)
  - exchangeId (Select from exchanges, required)
  - segmentId (Select from segments filtered by exchange, required)
  - instrumentType (Select: Equity / Derivative / Future / Option / Currency / Commodity)
  - lotSize (Number, > 0)
  - tickSize (Number, > 0)
  - series (optional, e.g. EQ, BE)
  - expiryDate (DatePicker, required when type = Future/Option)
  - strikePrice (Number, required when type = Option)
  - optionType (Select: Call/Put, required when type = Option)
- **Edit fields:** instrumentName, lotSize, tickSize, status (Select: Active/Suspended), expiryDate, strikePrice
- Role guard: PlatformSuperAdmin, TenantOwner

**New page** `src/modules/master-setup/components/instruments/InstrumentListPage.tsx`
- Filterable by exchange, segment, instrumentType
- "Add Instrument" button → `<InstrumentFormModal>`
- Row action: "Edit" → `<InstrumentFormModal initialData={...}>`

---

### Phase 3 — Clearing: Trade Book

**Service** `src/modules/clearing/services/tradeService.ts`
- Add `bookTrade(body: BookTradePayload): Promise<TradeDto>`
- Add `cancelTrade(id: string, reason: string): Promise<void>`

**New component** `src/modules/clearing/components/trade-book/BookTradeModal.tsx`
- Fields: brokerId (Select), clientId (Select filtered by broker), instrumentId (Select from GET /api/instruments), side (Buy/Sell), quantity (Number), price (Number), tradeDate (DatePicker), settlementNo (Input), source (Select: API/Manual/FileUpload/Exchange), exchangeTradeNo (optional)
- Role guard: OperationsController, TenantOwner, PlatformSuperAdmin

**Update** `src/modules/clearing/components/trade-book/TradeListPage.tsx`
- "Book Trade" button → `<BookTradeModal>`

**Update** `src/modules/clearing/components/trade-book/TradeDrawer.tsx`
- **"Cancel Trade"** — only show when `status === 'Pending' || status === 'Validated'`
  - Opens `Modal.confirm` with TextArea for reason → `cancelTrade` mutation
- *(Note: "Booked"/"Confirmed" do NOT exist in backend — backend uses Pending/Validated)*

---

### Phase 4 — Clearing: Settlement Batch Creation

**Service** `src/modules/clearing/services/settlementService.ts`
- Add `createSettlementBatch(body: CreateBatchPayload): Promise<SettlementBatchDto>`

**New component** `src/modules/clearing/components/settlement/CreateBatchModal.tsx`
- Fields: settlementNo, tradeDate (DatePicker), settlementDate (DatePicker, ≥ tradeDate), exchangeId (Select from GET /api/exchanges), totalTrades (Number), totalTurnover (Number)
- Role guard: OperationsController, TenantOwner, PlatformSuperAdmin

**Update** `src/modules/clearing/components/settlement/BatchListPage.tsx`
- "Create Batch" button → `<CreateBatchModal>`

---

### Phase 5 — Finance: Ledger Entries

**Service** `src/modules/finance/services/ledgerService.ts`
- Add `postLedgerEntry(body: PostLedgerEntryPayload): Promise<LedgerEntryDto>`

**New component** `src/modules/finance/components/ledger/PostLedgerEntryModal.tsx`
- Fields:
  - brokerId (Select, required)
  - clientId (Select filtered by broker, required)
  - voucherNo (Input, required)
  - postingDate (DatePicker, required)
  - valueDate (DatePicker, required)
  - ledgerType (Select: ClientLedger / BrokerLedger / CashLedger / SecuritiesLedger)
  - entryType (Select: **Trade / Charges / Payment / Receipt / Adjustment / CorporateAction**)
  - debit (Number, ≥ 0)
  - credit (Number, ≥ 0)
  - referenceType (Input)
  - referenceId (Input)
  - narration (TextArea, optional)
- Validation: at least one of debit/credit > 0
- Role guard: FinanceController, TenantOwner, PlatformSuperAdmin

**Update** `src/modules/finance/components/ledger/LedgerPage.tsx`
- "Post Entry" button → `<PostLedgerEntryModal>`

---

### Phase 6 — Finance: Charges Config

**Service** `src/modules/finance/services/chargesService.ts`
- Add `createChargeConfig(body: CreateChargePayload): Promise<ChargesConfigDto>`

**New component** `src/modules/finance/components/charges/ChargeConfigFormModal.tsx`
- Fields:
  - chargeName (Input, required)
  - chargeType (Select: Brokerage / STT / GST / ExchangeTxn / SEBI / StampDuty)
  - calculationType (Select: Percentage / Flat / Slab)
  - rate (Number, ≥ 0)
  - brokerId (optional Select — broker-specific override, from TP_IFSC pattern)
  - minAmount (optional Number)
  - maxAmount (optional Number)
  - effectiveFrom (DatePicker)
  - effectiveTo (optional DatePicker)
- Validation: maxAmount ≥ minAmount when both provided; effectiveTo > effectiveFrom
- Role guard: FinanceController, TenantOwner, PlatformSuperAdmin

**Update** `src/modules/finance/components/charges/ChargesConfigPage.tsx`
- "Add Charge" button → `<ChargeConfigFormModal>`

---

### Phase 7 — Reconciliation: Run Recon

**Service** `src/modules/reconciliation/services/reconciliationService.ts`
- Add `runReconciliation(body: RunReconPayload): Promise<ReconciliationDto>`

**New component** `src/modules/reconciliation/components/RunReconModal.tsx`
- Fields: reconDate (DatePicker), settlementNo (Input), reconType (Select: Trade / Position / Obligation / Funds / Securities), systemValue (Number), exchangeValue (Number), toleranceLimit (Number), comments (TextArea optional)
- Role guard: OperationsController, FinanceController, TenantOwner, PlatformSuperAdmin

**Update** `src/modules/reconciliation/components/ReconDashboardPage.tsx`
- "Run Reconciliation" button → `<RunReconModal>`

---

### Phase 8 — Corporate Actions *(NEW — from backend)*

**Service** `src/modules/corporate-actions/services/corporateActionService.ts` *(new file)*
- `createCorporateAction(body)` → POST `/api/corporate-actions`
- `processCorporateAction(id)` → PUT `/api/corporate-actions/{id}/process`
- `getCorporateActions(filters?)` → GET `/api/corporate-actions`

**New component** `src/modules/corporate-actions/components/CorporateActionFormModal.tsx`
- Props: `open`, `onClose`
- Fields:
  - instrumentId (Select from GET /api/instruments, required)
  - actionType (Select: Dividend / Bonus / Split / Rights / Merger / Demerger)
  - announcementDate (DatePicker)
  - exDate (DatePicker, ≥ announcementDate)
  - recordDate (DatePicker, ≥ exDate)
  - paymentDate (DatePicker optional, ≥ recordDate)
  - dividendAmount (Number, shown only when type = Dividend)
  - bonusRatio (Number, shown only when type = Bonus)
  - splitRatio (Number, shown only when type = Split)
  - rightsRatio + rightsPrice (Numbers, shown only when type = Rights)
- Validation mirrors backend: required ratio/amount fields per action type
- Role guard: FinanceController, TenantOwner, PlatformSuperAdmin

**New page** `src/modules/corporate-actions/components/CorporateActionsListPage.tsx`
- Filterable by instrumentId, actionType, status
- "Create Corporate Action" button → `<CorporateActionFormModal>`
- Row action: "Process" → `processCorporateAction` mutation (only when status = Announced)
- Status badge: Announced / Processing / Completed / Cancelled

---

### Phase 9 — EOD (End of Day) *(NEW — from backend)*

**Service** `src/modules/eod/services/eodService.ts` *(new file)*
- `runEod(tradingDate: string)` → POST `/api/eod/run`
- `getEodStatus(date: string)` → GET `/api/eod/status/{date}`

**New component** `src/modules/eod/components/EodPanel.tsx`
- Shows current EOD status for selected date (from GET /api/eod/status)
- "Run EOD" button → confirms in `Modal.confirm` → `runEod` mutation
- Display result: positions snapshotted, success/failure message
- Role guard: PlatformSuperAdmin, TenantOwner

---

## Shared Utilities (No New Files — Reuse Existing)

| Utility | Location |
|---|---|
| `notifySuccess` / `notifyError` | `src/utils/errorHandler.ts` |
| `useAuthStore` (roles + hasRole) | `src/modules/auth/store/authStore.ts` |
| `axiosInstance` | `src/core/api/axiosInstance.ts` |
| `ApiResponse<T>` | `src/core/types/api.types.ts` |
| `SlideDrawer` | `src/shared/components/data-display/SlideDrawer.tsx` |
| `DataTable` | `src/shared/components/data-display/DataTable.tsx` |
| `StatusBadge` | `src/shared/components/data-display/StatusBadge.tsx` |

---

## Backend Request Shapes (Quick Reference)

### POST /api/exchanges
```json
{ "exchangeCode":"str", "exchangeName":"str", "country":"str",
  "timeZone":"str?", "tradingStartTime":"HH:mm:ss?", "tradingEndTime":"HH:mm:ss?" }
```

### PUT /api/exchanges/{id}
```json
{ "exchangeId":"guid", "exchangeName":"str", "country":"str",
  "timeZone":"str?", "tradingStartTime":"HH:mm:ss?", "tradingEndTime":"HH:mm:ss?", "isActive":true }
```

### POST /api/segments
```json
{ "exchangeId":"guid", "segmentCode":"str", "segmentName":"str" }
```

### PUT /api/segments/{id}
```json
{ "segmentId":"guid", "segmentName":"str", "isActive":true }
```

### POST /api/instruments
```json
{ "instrumentCode":"str", "instrumentName":"str", "symbol":"str", "isin":"str?",
  "exchangeId":"guid", "segmentId":"guid",
  "instrumentType":"Equity|Derivative|Future|Option|Currency|Commodity",
  "lotSize":1.0, "tickSize":0.05, "series":"str?",
  "expiryDate":"2026-03-27?", "strikePrice":0.0, "optionType":"Call|Put?" }
```

### PUT /api/instruments/{id}
```json
{ "instrumentId":"guid", "instrumentName":"str", "lotSize":1.0, "tickSize":0.05,
  "status":"Active|Suspended", "expiryDate":"2026-03-27?", "strikePrice":0.0 }
```

### POST /api/clients
```json
{ "brokerId":"guid", "clientCode":"str", "clientName":"str", "email":"str",
  "phone":"str", "clientType":"Individual|Corporate|FII|DII",
  "pan":"str?", "dpId":"str?", "address":"str?",
  "bankAccountNo":"str?", "bankName":"str?", "bankIFSC":"str?" }
```

### PUT /api/clients/{id}
```json
{ "clientId":"guid", "clientName":"str", "email":"str", "phone":"str",
  "status":"Active|Inactive|Deleted", "pan":"str?", "dpId":"str?", "address":"str?",
  "bankAccountNo":"str?", "bankName":"str?", "bankIFSC":"str?" }
```

### POST /api/brokers
```json
{ "brokerCode":"str", "brokerName":"str", "contactEmail":"str", "contactPhone":"str",
  "sebiRegistrationNo":"str?", "address":"str?", "pan":"str?", "gst":"str?" }
```

### PUT /api/brokers/{id}
```json
{ "brokerId":"guid", "brokerName":"str", "contactEmail":"str", "contactPhone":"str",
  "status":"Active|Inactive", "sebiRegistrationNo":"str?", "address":"str?",
  "pan":"str?", "gst":"str?" }
```

### POST /api/trades
```json
{ "brokerId":"guid", "clientId":"guid", "instrumentId":"guid",
  "side":"Buy|Sell", "quantity":100, "price":2500.00,
  "tradeDate":"2026-02-25", "settlementNo":"str",
  "source":"API|FileUpload|Manual|Exchange", "exchangeTradeNo":"str?" }
```

### PUT /api/trades/{id}/cancel
```json
{ "tradeId":"guid", "reason":"str" }
```

### POST /api/settlement/batches
```json
{ "settlementNo":"str", "tradeDate":"2026-02-25", "settlementDate":"2026-02-26",
  "exchangeId":"guid", "totalTrades":0, "totalTurnover":0.0 }
```

### POST /api/ledger/entries
```json
{ "brokerId":"guid", "clientId":"guid", "voucherNo":"str",
  "postingDate":"2026-02-25", "valueDate":"2026-02-25",
  "ledgerType":"ClientLedger|BrokerLedger|CashLedger|SecuritiesLedger",
  "entryType":"Trade|Charges|Payment|Receipt|Adjustment|CorporateAction",
  "debit":0.0, "credit":0.0, "referenceType":"str", "referenceId":"guid",
  "narration":"str?" }
```

### POST /api/ledger/charges
```json
{ "chargeName":"str", "chargeType":"Brokerage|STT|GST|ExchangeTxn|SEBI|StampDuty",
  "calculationType":"Percentage|Flat|Slab", "rate":0.05,
  "brokerId":"guid?", "minAmount":0.0, "maxAmount":0.0,
  "effectiveFrom":"2026-02-25", "effectiveTo":"2026-02-26?" }
```

### POST /api/reconciliation/run
```json
{ "reconDate":"2026-02-25", "settlementNo":"str",
  "reconType":"Trade|Position|Obligation|Funds|Securities",
  "systemValue":0.0, "exchangeValue":0.0, "toleranceLimit":0.0, "comments":"str?" }
```

### POST /api/corporate-actions
```json
{ "instrumentId":"guid",
  "actionType":"Dividend|Bonus|Split|Rights|Merger|Demerger",
  "announcementDate":"2026-02-25", "exDate":"2026-02-27",
  "recordDate":"2026-02-28", "paymentDate":"2026-03-05?",
  "dividendAmount":5.0, "bonusRatio":null, "splitRatio":null,
  "rightsRatio":null, "rightsPrice":null }
```

### PUT /api/corporate-actions/{id}/process
No body required.

### POST /api/eod/run
```json
{ "tradingDate":"2026-02-25" }
```

---

## Enum Values (Verified Against Backend Source)

| Field | Values |
|---|---|
| ClientType | Individual, Corporate, FII, DII |
| **TradeStatus** | **Pending, Validated, Settled, Rejected, Amended, Cancelled** |
| TradeSide | Buy, Sell |
| TradeSource | API, FileUpload, Manual, Exchange |
| SettlementStatus | Pending, Processing, Completed, Failed |
| ObligationStatus | Pending, Settled, PartiallySettled, Failed |
| LedgerType | ClientLedger, BrokerLedger, CashLedger, SecuritiesLedger |
| **EntryType** | **Trade, Charges, Payment, Receipt, Adjustment, CorporateAction** |
| ChargeType | Brokerage, STT, GST, ExchangeTxn, SEBI, StampDuty |
| CalculationType | Percentage, Flat, Slab |
| **ReconStatus** | **Pending, Matched, Mismatched, Resolved** |
| ReconType | Trade, Position, Obligation, Funds, Securities |
| InstrumentType | Equity, Derivative, Future, Option, Currency, Commodity |
| OptionType | Call, Put |
| CorporateActionType | Dividend, Bonus, Split, Rights, Merger, Demerger |
| CorporateActionStatus | Announced, Processing, Completed, Cancelled |

---

## New Files (20 total)

| File | Purpose |
|---|---|
| `src/modules/master-setup/services/exchangeService.ts` | Exchange CRUD |
| `src/modules/master-setup/services/segmentService.ts` | Segment CRUD |
| `src/modules/master-setup/services/instrumentService.ts` | Instrument CRUD |
| `src/modules/master-setup/components/exchanges/ExchangeFormModal.tsx` | Create + Edit exchange |
| `src/modules/master-setup/components/exchanges/ExchangeListPage.tsx` | Exchange list + actions |
| `src/modules/master-setup/components/segments/SegmentFormModal.tsx` | Create + Edit segment |
| `src/modules/master-setup/components/instruments/InstrumentFormModal.tsx` | Create + Edit instrument |
| `src/modules/master-setup/components/instruments/InstrumentListPage.tsx` | Instrument list + actions |
| `src/modules/account-management/components/clients/ClientFormModal.tsx` | Create + Edit client |
| `src/modules/account-management/components/brokers/BrokerFormModal.tsx` | Create + Edit broker |
| `src/modules/clearing/components/trade-book/BookTradeModal.tsx` | Book trade |
| `src/modules/clearing/components/settlement/CreateBatchModal.tsx` | Create settlement batch |
| `src/modules/finance/components/ledger/PostLedgerEntryModal.tsx` | Post ledger entry |
| `src/modules/finance/components/charges/ChargeConfigFormModal.tsx` | Add charge config |
| `src/modules/reconciliation/components/RunReconModal.tsx` | Run reconciliation |
| `src/modules/corporate-actions/services/corporateActionService.ts` | Corp action service |
| `src/modules/corporate-actions/components/CorporateActionFormModal.tsx` | Create corporate action |
| `src/modules/corporate-actions/components/CorporateActionsListPage.tsx` | Corp actions list |
| `src/modules/eod/services/eodService.ts` | EOD service |
| `src/modules/eod/components/EodPanel.tsx` | EOD trigger + status |

## Modified Files (16 existing)

| File | Change |
|---|---|
| `src/modules/account-management/services/clientService.ts` | Add createClient, updateClient |
| `src/modules/account-management/services/brokerService.ts` | Add createBroker, updateBroker |
| `src/modules/clearing/services/tradeService.ts` | Add bookTrade, cancelTrade |
| `src/modules/clearing/services/settlementService.ts` | Add createSettlementBatch |
| `src/modules/finance/services/ledgerService.ts` | Add postLedgerEntry |
| `src/modules/finance/services/chargesService.ts` | Add createChargeConfig |
| `src/modules/reconciliation/services/reconciliationService.ts` | Add runReconciliation |
| `src/modules/account-management/components/clients/ClientListPage.tsx` | Add "Add Client" button |
| `src/modules/account-management/components/clients/ClientDrawer.tsx` | Add Edit + status toggle |
| `src/modules/account-management/components/brokers/BrokerListPage.tsx` | Add "Add Broker" button |
| `src/modules/clearing/components/trade-book/TradeListPage.tsx` | Add "Book Trade" button |
| `src/modules/clearing/components/trade-book/TradeDrawer.tsx` | Add "Cancel Trade" (Pending/Validated only) |
| `src/modules/clearing/components/settlement/BatchListPage.tsx` | Add "Create Batch" button |
| `src/modules/finance/components/ledger/LedgerPage.tsx` | Add "Post Entry" button |
| `src/modules/finance/components/charges/ChargesConfigPage.tsx` | Add "Add Charge" button |
| `src/modules/reconciliation/components/ReconDashboardPage.tsx` | Add "Run Reconciliation" button |

---

## Insights from Legacy Repos (Applied to This Plan)

### From PT_CLEARING
- **Trade cancel condition**: Use `Pending` or `Validated` (NOT Booked/Confirmed — those don't exist in backend)
- **Brokerage is auto-calculated by backend** when a trade is booked via ChargesConfig master — no manual charge input per trade
- **Charge types confirmed**: Brokerage, STT, StampDuty, GST, SEBI, ExchangeTxn — maps exactly to backend `ChargeType` enum
- **Ledger entry types confirmed**: Trade, Charges, Payment, Receipt, Adjustment, CorporateAction (NOT simple Debit/Credit)
- **Maker-Checker workflow**: PT_CLEARING tracks Maker_UserId/Checker_UserId on client records — frontend `canApprove()` in `utils/permissions.ts` handles this via CHECKER_ROLES

### From TP_IFSC
- **DPId field on Client**: Depository Participant account ID — backend `Client` entity has `DPId` column — included in ClientFormModal
- **Instrument/Scrip structure confirmed**: InstrumentCode, ISIN, Symbol, LotSize, TickSize, Series, ExpiryDate, StrikePrice, OptionType all present in backend Instrument entity
- **Settlement**: Legacy has PayinDate/PayoutDate — backend simplifies to TradeDate + SettlementDate; no separate payin/payout in modern API
- **ReconStatus = Mismatched** in backend (NOT "Variated" like legacy TP_IFSC)
- **ChargesConfig brokerId override**: TP_IFSC allows broker-specific charge rates — backend `ChargesConfiguration.BrokerId` is nullable for this; included in ChargeConfigFormModal
- **CorporateActionType confirmed**: Dividend, Bonus, Split, Rights (from legacy) + Merger, Demerger added in backend

---

## Verification Checklist

1. `npm run type-check` — no errors
2. `npm run lint` — no warnings
3. Login as **PlatformSuperAdmin**
4. Create Exchange → appears in Exchange list ✓
5. Create Segment (linked to exchange) → appears in list ✓
6. Create Instrument (linked to exchange + segment) → appears in list ✓
7. Create Broker → appears in list ✓
8. Create Client (linked to broker) → appears in list ✓
9. Book Trade → appears in Trade Book with status **Pending** ✓
10. Cancel a Trade (status Pending/Validated) → status changes to Cancelled ✓
11. Create Settlement Batch → appears in Batches list ✓
12. Process Batch → status changes to Processing/Completed ✓
13. Post Ledger Entry (entryType = Payment) → appears in Ledger list ✓
14. Add Charge Config → appears in Charges list ✓
15. Run Reconciliation → recon record appears, status = Pending ✓
16. Recon exception with status badge shows **Mismatched** (NOT Variated) ✓
17. Create Corporate Action (Dividend) → status = Announced ✓
18. Process Corporate Action → status changes to Processing/Completed ✓
19. Run EOD → success message, positions snapshotted ✓
20. Login as **OperationsController** → "Post Ledger Entry" button NOT visible ✓
21. Login as **FinanceController** → "Book Trade" button NOT visible ✓
22. Login as **FinanceController** → "Run EOD" button NOT visible ✓
