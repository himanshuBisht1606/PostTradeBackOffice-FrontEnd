# Plan: Add Create / Edit / Delete Forms to Frontend

## Context
The frontend is fully read-only today — all modules show data from GET endpoints, but have no forms
to create or update records. The backend already implements all POST and PUT endpoints.
This plan adds Ant Design Modal forms and action buttons to each module so users can manage data
end-to-end from the UI without Swagger.

---

## Approach
- Use **Ant Design `Modal` + `Form`** (centered overlay) for create/edit — keeps Drawer for read-only details
- **Single `XxxFormModal`** per entity with an optional `initialData` prop: omit = create mode, provide = edit mode
- "Delete" = status change via PUT (backend has no hard DELETE endpoints)
- Cancel trade uses a reason input inside a `Modal.confirm` prompt
- All mutations follow the existing pattern: `useMutation` → `notifySuccess` / `notifyError` → `queryClient.invalidateQueries`
- Permission checks use `useAuthStore().hasRole([...])` before rendering buttons

---

## Phases & Files

### Phase 1 — Account Management

#### 1a. Clients
**Service** `src/modules/account-management/services/clientService.ts`
- Add `createClient(body: CreateClientPayload): Promise<ClientSummary>`
- Add `updateClient(id: string, body: UpdateClientPayload): Promise<ClientSummary>`

**New component** `src/modules/account-management/components/clients/ClientFormModal.tsx`
- Props: `open`, `onClose`, `initialData?: ClientSummary`
- Fields: clientCode (create-only), clientName, email, phone, clientType (Select: Individual/Corporate/FII/DII), brokerId (Select from broker list), pan, address, bankAccountNo, bankName, bankIFSC
- On submit: call `createClient` or `updateClient` mutation → success notification → invalidate `['clients']` → close

**Update** `src/modules/account-management/components/clients/ClientListPage.tsx`
- Add "Add Client" `Button` (top-right of header); roles guard: PlatformSuperAdmin, TenantOwner, OperationsController
- Mount `<ClientFormModal>` with `open` state

**Update** `src/modules/account-management/components/clients/ClientDrawer.tsx`
- Add "Edit" button → open `<ClientFormModal initialData={client}>`
- Add "Deactivate" / "Activate" button → PUT with toggled status via `Modal.confirm`

#### 1b. Brokers
**Service** `src/modules/account-management/services/brokerService.ts`
- Add `createBroker(body)`, `updateBroker(id, body)`

**New component** `src/modules/account-management/components/brokers/BrokerFormModal.tsx`
- Fields: brokerCode (create-only), brokerName, contactEmail, contactPhone, sebiRegistrationNo, address, pan, gst
- Same mutation/notification pattern

**Update** `BrokerListPage.tsx` — "Add Broker" button
**Update** `BrokerTable.tsx` or add `BrokerDrawer.tsx` — "Edit" + "Deactivate/Activate" buttons

---

### Phase 2 — Clearing: Trade Book

**Service** `src/modules/clearing/services/tradeService.ts`
- Add `bookTrade(body: BookTradePayload): Promise<TradeDto>`
- Add `cancelTrade(id: string, reason: string): Promise<void>`

**New component** `src/modules/clearing/components/trade-book/BookTradeModal.tsx`
- Fields: brokerId (Select), clientId (Select, filtered by broker), instrumentId (Select), side (Buy/Sell Select), quantity (Number), price (Number), tradeDate (DatePicker), settlementNo (Input), source (Select: API/Manual/FileUpload/Exchange), exchangeTradeNo (optional)
- Role guard: OperationsController, TenantOwner, PlatformSuperAdmin

**Update** `src/modules/clearing/components/trade-book/TradeListPage.tsx`
- "Book Trade" button → opens `<BookTradeModal>`

**Update** `src/modules/clearing/components/trade-book/TradeDrawer.tsx`
- "Cancel Trade" button → `Modal.confirm` with TextArea for reason → `cancelTrade` mutation
- Only show if trade status is `Booked` or `Confirmed`

---

### Phase 3 — Clearing: Settlement Batch Creation

**Service** `src/modules/clearing/services/settlementService.ts`
- Add `createSettlementBatch(body: CreateBatchPayload): Promise<SettlementBatchDto>`

**New component** `src/modules/clearing/components/settlement/CreateBatchModal.tsx`
- Fields: settlementNo, tradeDate (DatePicker), settlementDate (DatePicker, ≥ tradeDate), exchangeId (Select from GET /api/exchanges), totalTrades (Number), totalTurnover (Number)
- Role guard: OperationsController, TenantOwner, PlatformSuperAdmin

**Update** `src/modules/clearing/components/settlement/BatchListPage.tsx`
- "Create Batch" button → opens `<CreateBatchModal>`

---

### Phase 4 — Finance: Ledger Entries

**Service** `src/modules/finance/services/ledgerService.ts`
- Add `postLedgerEntry(body: PostLedgerEntryPayload): Promise<LedgerEntryDto>`

**New component** `src/modules/finance/components/ledger/PostLedgerEntryModal.tsx`
- Fields: brokerId (Select), clientId (Select), voucherNo, postingDate, valueDate, ledgerType (Select), entryType (Select), debit (Number), credit (Number), referenceType, referenceId, narration
- Validation: at least one of debit/credit > 0
- Role guard: FinanceController, TenantOwner, PlatformSuperAdmin

**Update** `src/modules/finance/components/ledger/LedgerPage.tsx`
- "Post Entry" button → opens `<PostLedgerEntryModal>`

---

### Phase 5 — Finance: Charges Config

**Service** `src/modules/finance/services/chargesService.ts`
- Add `createChargeConfig(body: CreateChargePayload): Promise<ChargesConfigDto>`

**New component** `src/modules/finance/components/charges/ChargeConfigFormModal.tsx`
- Fields: chargeName, chargeType (Select: Brokerage/STT/GST/ExchangeTxn/SEBI/StampDuty), calculationType (Select: Percentage/Flat/Slab), rate (Number), brokerId (optional Select), minAmount (optional), maxAmount (optional), effectiveFrom (DatePicker), effectiveTo (optional DatePicker)
- Validation: maxAmount ≥ minAmount when both provided; effectiveTo > effectiveFrom
- Role guard: FinanceController, TenantOwner, PlatformSuperAdmin

**Update** `src/modules/finance/components/charges/ChargesConfigPage.tsx`
- "Add Charge" button → opens `<ChargeConfigFormModal>`

---

### Phase 6 — Reconciliation: Run Recon

**Service** `src/modules/reconciliation/services/reconciliationService.ts`
- Add `runReconciliation(body: RunReconPayload): Promise<ReconciliationDto>`

**New component** `src/modules/reconciliation/components/RunReconModal.tsx`
- Fields: reconDate (DatePicker), settlementNo (Input), reconType (Select: Trade/Position/Obligation/Funds/Securities), systemValue (Number), exchangeValue (Number), toleranceLimit (Number), comments (TextArea optional)
- Role guard: OperationsController, FinanceController, TenantOwner, PlatformSuperAdmin

**Update** `src/modules/reconciliation/components/ReconDashboardPage.tsx`
- "Run Reconciliation" button → opens `<RunReconModal>`

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

### POST /api/clients
```json
{ "brokerId":"guid", "clientCode":"str", "clientName":"str", "email":"str",
  "phone":"str", "clientType":"Individual|Corporate|FII|DII",
  "pan":"str?", "address":"str?", "bankAccountNo":"str?", "bankName":"str?", "bankIFSC":"str?" }
```

### PUT /api/clients/{id}
```json
{ "clientId":"guid", "clientName":"str", "email":"str", "phone":"str",
  "status":"Active|Inactive|Deleted", "pan":"str?", "address":"str?",
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

---

## Enum Values

| Field | Values |
|---|---|
| ClientType | Individual, Corporate, FII, DII |
| TradeSide | Buy, Sell |
| TradeSource | API, FileUpload, Manual, Exchange |
| LedgerType | ClientLedger, BrokerLedger, CashLedger, SecuritiesLedger |
| EntryType | Trade, Charges, Payment, Receipt, Adjustment, CorporateAction |
| ChargeType | Brokerage, STT, GST, ExchangeTxn, SEBI, StampDuty |
| CalculationType | Percentage, Flat, Slab |
| ReconType | Trade, Position, Obligation, Funds, Securities |

---

## New Files (7)

| File | Purpose |
|---|---|
| `src/modules/account-management/components/clients/ClientFormModal.tsx` | Create + Edit client |
| `src/modules/account-management/components/brokers/BrokerFormModal.tsx` | Create + Edit broker |
| `src/modules/clearing/components/trade-book/BookTradeModal.tsx` | Book trade |
| `src/modules/clearing/components/settlement/CreateBatchModal.tsx` | Create settlement batch |
| `src/modules/finance/components/ledger/PostLedgerEntryModal.tsx` | Post ledger entry |
| `src/modules/finance/components/charges/ChargeConfigFormModal.tsx` | Add charge config |
| `src/modules/reconciliation/components/RunReconModal.tsx` | Run reconciliation |

## Modified Files (16)

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
| `src/modules/clearing/components/trade-book/TradeDrawer.tsx` | Add "Cancel Trade" |
| `src/modules/clearing/components/settlement/BatchListPage.tsx` | Add "Create Batch" button |
| `src/modules/finance/components/ledger/LedgerPage.tsx` | Add "Post Entry" button |
| `src/modules/finance/components/charges/ChargesConfigPage.tsx` | Add "Add Charge" button |
| `src/modules/reconciliation/components/ReconDashboardPage.tsx` | Add "Run Reconciliation" button |

---

## Verification Checklist

1. `npm run type-check` — no errors
2. `npm run lint` — no warnings
3. Login as **PlatformSuperAdmin**
4. Create Broker → appears in list ✓
5. Create Client (linked to broker) → appears in list ✓
6. Book Trade → appears in Trade Book ✓
7. Cancel a Trade → status changes to Cancelled ✓
8. Create Settlement Batch → appears in Batches list ✓
9. Process Batch → status changes to Processing/Completed ✓
10. Post Ledger Entry → appears in Ledger list ✓
11. Add Charge Config → appears in Charges list ✓
12. Run Reconciliation → recon record appears ✓
13. Login as **OperationsController** → "Post Ledger Entry" button NOT visible ✓
14. Login as **FinanceController** → "Book Trade" button NOT visible ✓
