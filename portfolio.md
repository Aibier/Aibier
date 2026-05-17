---
title: Fiat-Crypto Native Payment Infrastructure
theme: portfolio
format: A4
margin: 0.70in
margin_top: 0.75in
---

# Fiat-Crypto Native Payment Infrastructure

**Tony Aizize** · Software Engineering Manager, Payments & FX Infra · [linkedin.com/in/tony007](https://www.linkedin.com/in/tony007) · [github.com/Aibier](https://github.com/Aibier)

---

## Executive Summary

This portfolio documents the architecture of a production-grade **fiat-crypto bridge platform** — a system that enables seamless conversion between traditional fiat currencies and stablecoins (USDC, USDT) across multiple payment rails and blockchain networks.

The platform handles two core operations: **On-Ramp** (fiat → stablecoin) and **Off-Ramp** (stablecoin → fiat), serving both consumer wallets and institutional merchants across APAC, EMEA, and the US. It is designed for regulatory compliance from day one — embedding AML screening, KYC verification, and Travel Rule reporting into every transaction flow.

**Scale targets:** 500+ TPS, 99.99% uptime, sub-500ms API acknowledgement, full AML/KYC coverage, multi-chain stablecoin support.

---

## Platform Architecture

The platform is structured around five distinct layers, each with independent scaling characteristics.

### API Gateway Layer

All traffic enters through a hardened API gateway responsible for:

- **JWT authentication** with short-lived token rotation
- **Rate limiting** via a Redis-backed sliding-window algorithm (per-client and global)
- **Request routing** to downstream microservices
- **Idempotency enforcement** — duplicate requests are deduplicated at the gateway before reaching core services

The gateway is stateless and horizontally scalable behind an AWS ALB, with circuit breakers preventing cascade failures during provider outages.

### Core Service Layer

The **Core Service** is the transaction ledger and orchestration hub. On receiving a validated request it:

1. Validates the request payload and account state
2. Creates a ledger entry atomically (CockroachDB, serializable isolation)
3. Performs idempotency checks against the request reference
4. Publishes a `ramp.initiated` event to Kafka
5. Returns a `transaction_id` and `status: initiated` to the caller within 100ms

The Core Service deliberately owns **no provider-side logic** — it delegates execution entirely via Kafka events. This decoupling means provider failures never block ledger writes.

### Event Streaming Layer (Kafka)

Apache Kafka is the backbone of all asynchronous coordination. Key topics:

| Topic | Producer | Consumers |
|---|---|---|
| `ramp.initiated` | Core Service | AML Service, Provider Orchestrator |
| `compliance.checked` | AML Service | Provider Orchestrator |
| `payment.received` | Payout Service | Core Service, Acceptance Service |
| `stablecoins.minted` | Payout Service | Core Service, Acceptance Service |
| `stablecoins.burned` | Payout Service | Core Service |
| `transfer.completed` | Payout Service | Core Service, Acceptance Service |
| `transaction.status_changed` | Core Service | Acceptance Service (webhooks) |

Each topic is partitioned by `account_id` to preserve per-account ordering while enabling horizontal consumer scaling.

### Payout Service

The **Payout Service** owns all external execution — it integrates with both fiat payment rails and crypto providers. Its responsibilities are split into two sub-concerns:

**Fiat execution:** ACH, SEPA, PIX, UPI, M-Pesa, SWIFT rails via bank integrations (JPM, DBS, Citibank, HDFC, Standard Chartered). Each bank integration is wrapped in a common provider interface, enabling the orchestrator to swap providers without changing business logic.

**Crypto execution:** Mint/burn operations against stablecoin issuers (Circle USDC, Tether USDT) and settlement across blockchain networks (Ethereum, Polygon, BSC). All crypto custody is delegated to an MPC custody provider (Fireblocks) — private keys never exist in application memory.

### Acceptance Service

The **Acceptance Service** translates internal Kafka events into outbound webhooks for merchants and clients. It handles:

- Webhook fan-out with at-least-once delivery guarantees
- Per-client retry policies with exponential backoff
- Signature verification payloads (HMAC-SHA256) for webhook authenticity
- Dead-letter handling for consistently failing endpoints

---

## Payment Flows

### On-Ramp: Fiat → Stablecoin

A user initiates an ACH transfer of $1,000 USD to receive USDT on Ethereum.

```
Client → POST /v1/api/transactions  {direction: "OnRamp", source: USD, target: USDT}

1. API Gateway    — authenticate, rate-limit, route
2. Core Service   — validate, create ledger entry, publish ramp.initiated
3. AML Service    — risk assessment; publish compliance.checked
   ├─ [Rejected]  → Core Service marks REJECTED; webhook fired
   └─ [Approved]  → Provider Orchestrator selects fiat rail
4. Payout Service — initiate ACH collection; await bank confirmation
5. Payout Service — on payment.received: mint USDC/USDT via Circle/Tether
6. Core Service   — update status to SUCCESS
7. Acceptance Svc — fire webhook: {status: "success", tx_hash: "0x..."}
```

**Key design decisions:**
- Ledger entry is created synchronously before any external call — prevents state loss if downstream services fail
- Stablecoin mint only executes after confirmed fiat receipt — eliminates settlement risk
- AML check is asynchronous but blocks execution; clients poll or receive webhooks

### Off-Ramp: Stablecoin → Fiat

A user redeems 500 USDT for USD via ACH bank transfer.

```
Client → POST /v1/api/transactions  {direction: "OffRamp", source: USDT, target: USD}

1. API Gateway    — authenticate, rate-limit, route
2. Core Service   — validate, check stablecoin balance, create ledger entry
3. AML Service    — risk assessment; publish compliance.checked
   ├─ [Rejected]  → marks REJECTED; webhook fired
   └─ [Approved]  → Provider Orchestrator selects crypto provider
4. Payout Service — burn stablecoins; await on-chain confirmation
5. Payout Service — on stablecoins.burned: initiate fiat transfer via bank rail
6. Core Service   — update status to SUCCESS on transfer.completed
7. Acceptance Svc — fire webhook: {status: "success", fiat_reference: "ACH-..."}
```

**Key design decisions:**
- Stablecoin burn and fiat payout are decoupled via Kafka — a fiat payout failure does not trigger a re-mint
- The off-ramp ledger reserves the stablecoin balance at creation time, preventing double-spend across concurrent requests
- Gas fee estimation is pre-calculated at booking time to avoid slippage on execution

### Card On-Ramp: Card Charge → Stablecoin

A user funds a stablecoin wallet via Visa/Mastercard.

```
Client → POST /v1/api/transactions  {direction: "OnRamp", payment_rail: "CARD"}

1. Card Connector  — card authorization request to Visa/MC network
   ├─ [Declined]   → immediate rejection; no ledger entry persisted
   └─ [Authorized] → Core Service creates ledger entry
2. AML Service     — risk assessment (card transactions carry higher fraud risk)
   ├─ [Rejected]   → void card authorization; mark REJECTED
   └─ [Approved]   → Provider Orchestrator selects crypto provider
3. Payout Service  — mint stablecoins
4. Card Connector  — capture authorization
5. Acceptance Svc  — webhook: {status: "success"}
```

**Key design decision:** Card authorization is held (not captured) until AML clearance and mint completion. This eliminates the scenario of charging a card but failing to deliver the stablecoin.

---

## Data Architecture

### Core Schema Design

The schema is built around a clear separation between the **canonical ledger** (TRANSACTIONS) and **provider execution records** (PROVIDER_TRANSACTIONS). This separation is critical — a single user-facing transaction may require multiple provider attempts before success.

**TRANSACTIONS** (primary ledger)
- One record per user-initiated operation
- `direction`: `onramp | offramp | transfer | fx_settlement | card_payment`
- `status`: `initiated → pending → success | failed | rejected`
- Immutable after `success` or `failed`

**PROVIDER_TRANSACTIONS** (execution records)
- One record per external provider call
- Linked to TRANSACTIONS via FK
- Stores raw `provider_request` / `provider_response` JSON for audit
- Enables retry tracking without mutating the ledger

**QUOTES → BOOKINGS → TRANSACTIONS** (rate-lock flow)

FX rates are volatile. The platform implements a two-step rate-lock:

1. `POST /v1/api/rates` — returns a rate valid for 60 seconds
2. `POST /v1/api/booking` — locks the rate into a BOOKING record (expires in 60s)
3. `POST /v1/api/transactions` — executes against a booking_id, inheriting the locked rate

This design prevents users from being exposed to rate slippage between quote and execution.

### Key Entity Relationships

```
ACCOUNTS ──< CARDS
    │
    ├──< TRANSACTIONS ──< PROVIDER_TRANSACTIONS
    │         │
    │         └──< COMPLIANCE_CHECKS
    │         └──< TRANSACTION_SESSION_LOGS
    │
    ├──< QUOTES ──< BOOKINGS
    │
    └──< RECIPIENTS ──< TRANSACTIONS (target)
```

### Compliance Tables

**COMPLIANCE_CHECKS** tracks every AML/KYC check against a transaction:
- `check_type`: `aml | kyc | travel_rule | sanctions`
- `risk_score`: float, used for manual review routing
- `compliance_officer_id`: populated on manual review
- Full audit trail via `AUDIT_LOGS` (immutable, append-only)

**TRANSACTION_SESSION_LOGS** provides a debug/tracing trail per transaction:
- Every internal state transition is logged as an event
- Enables support teams to reconstruct the exact sequence of events for any transaction without querying Kafka

---

## API Platform

The API follows REST conventions with a few key platform-wide guarantees:

| Behaviour | Implementation |
|---|---|
| Idempotency | `Idempotency-Key` header; duplicates return the original response |
| Rate limiting | Per-client sliding window; `X-RateLimit-*` headers on every response |
| Authentication | Bearer JWT; short-lived (15min) with refresh token rotation |
| Versioning | URI prefix `/v1/api/` — breaking changes get a new version |
| Error schema | `{code, message, details, request_id, timestamp}` — machine-parseable |

### Core Endpoints

**Rate & Booking**
```
POST /v1/api/requirements          Get KYC/AML requirements for a corridor
POST /v1/api/rates                 Get FX rate quote (60s validity)
POST /v1/api/booking               Lock a rate into a 60s booking
GET  /v1/api/booking/{id}          Check booking status
```

**Transactions**
```
POST /v1/api/transactions          Initiate on-ramp or off-ramp
GET  /v1/api/transactions/{id}     Fetch transaction state
GET  /v1/api/transactions          List transactions (paginated)
POST /v1/api/transactions/batch    Submit up to 100 transactions atomically
```

**Compliance**
```
GET  /v1/api/compliance/kyc/{account_id}
GET  /v1/api/compliance/aml/transaction/{tx_id}
POST /v1/api/compliance/travel-rule          Submit Travel Rule data for FATF
GET  /v1/api/compliance/travel-rule/{tx_id}  Check Travel Rule status
```

**Provider Management**
```
GET  /v1/api/integrations                        List all active integrations
GET  /v1/api/integrations/{id}                   Get integration config
POST /v1/api/integrations/{id}/test              Health-check a provider
GET  /v1/api/payment-rails                       List supported corridors
```

**Treasury**
```
GET  /v1/api/treasury/liquidity     Current pool balances & yield
POST /v1/api/treasury/rebalance     Trigger manual rebalance
GET  /v1/api/treasury/risk          Exposure & counterparty risk metrics
POST /v1/api/treasury/emergency     Emergency drain / halt
```

### Example: On-Ramp Transaction Request

```json
POST /v1/api/transactions
Authorization: Bearer <jwt>
Idempotency-Key: <uuid>

{
  "account_id": "acc_1a2b3c",
  "direction": "OnRamp",
  "source_currency": "USD",
  "source_amount": 1000.00,
  "target_currency": "USDT",
  "booking_id": "bkg_9x8y7z",
  "payment_rail": { "type": "ACH", "country": "US" },
  "bank_account": {
    "account_number": "••••7890",
    "routing_number": "021000021",
    "account_holder_name": "John Doe",
    "bank_name": "Chase Bank"
  },
  "compliance": {
    "kyc_required": true,
    "aml_required": true,
    "travel_rule_required": false,
    "jurisdiction": "US"
  }
}
```

```json
{
  "id": "tx_001a2b3c",
  "status": "initiated",
  "direction": "OnRamp",
  "source_currency": "USD",
  "source_amount": 1000.00,
  "target_currency": "USDT",
  "target_amount": 999.50,
  "exchange_rate": 0.9995,
  "fees": { "total": 0.50, "processing": 0.30, "network": 0.20 },
  "payment_rail": { "type": "ACH", "estimated_settlement": "1-3 business days" },
  "compliance_status": { "kyc": "verified", "aml": "approved", "travel_rule": "n/a" },
  "created_at": "2025-05-01T10:30:00Z",
  "expires_at": "2025-05-01T22:30:00Z"
}
```

### Webhook Events

Webhooks are delivered via the Acceptance Service with HMAC-SHA256 signatures. Clients verify using `X-Signature-256: sha256=<hex>`.

| Event | Trigger |
|---|---|
| `transaction.status_changed` | Any status transition |
| `compliance.review_required` | Transaction routed to manual AML review |
| `booking.created` | Rate successfully locked |
| `booking.expired` | Booking window elapsed without execution |
| `rate.expired` | Quote validity window elapsed |

---

## Compliance & Risk Framework

### AML (Anti-Money Laundering)

Every transaction triggers an AML check before provider execution. The AML Service:

- Screens against OFAC, EU, UN, and local sanctions lists in real-time
- Computes a `risk_score` (0.0–1.0) using a rule-based engine
- Routes high-risk transactions (`score > 0.7`) to manual compliance review
- Publishes `compliance.checked` with `approved | rejected | review_required`

Hard limits enforce that no provider execution begins before an `approved` status is confirmed.

### KYC (Know Your Customer)

KYC status is stored at the account level (`kyc_status` on ACCOUNTS) and checked at transaction initiation — not on each transaction. The platform supports tiered KYC:

- **Tier 1** (basic identity): up to $1,000/day
- **Tier 2** (enhanced due diligence): up to $50,000/day
- **Tier 3** (institutional): negotiated limits, full document verification

### Travel Rule (FATF)

For transactions above the FATF threshold ($3,000 USD equivalent), the platform automatically collects and transmits Travel Rule data:

- Originator: name, account number, address, DOB, national ID
- Beneficiary: same set of fields
- Submitted to counterparty VASPs via the `/v1/api/compliance/travel-rule` endpoint before fund movement
- All Travel Rule exchanges are logged in COMPLIANCE_CHECKS for regulatory audit

### Regulatory Coverage

| Jurisdiction | Standard | Implementation |
|---|---|---|
| Singapore | MAS Notice PSN02 | AML screening + CDD + transaction monitoring |
| Hong Kong | HKMA AML Guideline | Enhanced due diligence, STR filing hooks |
| EU | 6AMLD / MiCA | Travel Rule, VASP registration checks |
| US | FinCEN / BSA | CTR auto-filing trigger at $10k threshold |

---

## Provider Integration Architecture

### Bank Integration Pattern

All bank integrations implement a common `PaymentProvider` interface:

```go
type PaymentProvider interface {
    Initiate(ctx context.Context, req PayoutRequest) (ProviderRef, error)
    GetStatus(ctx context.Context, ref ProviderRef) (PaymentStatus, error)
    Cancel(ctx context.Context, ref ProviderRef) error
    Healthcheck(ctx context.Context) error
}
```

This abstraction means the Provider Orchestrator selects among DBS, JPM, Wise, or HDFC purely based on corridor availability, cost, and SLA — the routing logic is decoupled from any individual bank's API specifics.

Each integration wraps:
- **Authentication** (OAuth2, API Key, mTLS) — handled per-provider, hidden from core logic
- **Retry logic** — exponential backoff with jitter, max 3 attempts
- **Timeout handling** — 30s hard timeout; slow provider triggers fallback routing
- **Credential rotation** — API keys stored in AWS Secrets Manager, rotated quarterly

### Crypto Provider Integration

Stablecoin operations (mint/burn) are executed against Circle (USDC) and Tether (USDT) APIs. Both are wrapped in the same provider interface as banks — the Payout Service sees a unified `CryptoProvider` abstraction.

**Custody:** All wallets are managed through Fireblocks MPC. No raw private key ever exists in application memory. Transaction signing uses threshold signature schemes distributed across geographically separated hardware security modules.

**Supported networks:** Ethereum mainnet, Polygon, Binance Smart Chain. Network selection is driven by current gas costs and settlement speed requirements.

### Provider Selection Logic

The Provider Orchestrator scores available providers on each transaction using:

```
score = (1 - normalized_cost) × 0.4
      + availability_rate      × 0.35
      + (1 - p95_latency_norm) × 0.25
```

Providers below 99.5% availability or with open incidents are automatically excluded from routing until health is restored.

---

## Treasury & Liquidity Management

The platform maintains pre-funded stablecoin liquidity pools to enable instant off-ramp execution without waiting for external mint operations.

### Liquidity Pool Design

| Pool | Target Balance | Yield Strategy | Auto-Rebalance |
|---|---|---|---|
| USDC | $10M | Circle Yield (4.5% APY) | Yes — triggers at ±10% drift |
| USDT | $5M | Tether Reserve yield | Yes — triggers at ±10% drift |

Pools are distributed across multiple custodians (Circle, Coinbase, Binance) with a maximum 40% concentration per custodian to manage counterparty risk.

### Rebalancing

The auto-rebalance algorithm fires when a pool drifts beyond 10% of its target. A rebalance:
1. Calculates the delta needed to return to target
2. Identifies the cheapest on-chain transfer path
3. Executes the transfer and logs to `PROVIDER_TRANSACTIONS`
4. Alerts the treasury team via PagerDuty if manual override is needed

An emergency drain endpoint (`POST /v1/api/treasury/emergency`) halts all new transactions and initiates an orderly wind-down of open positions — tested quarterly as part of business continuity drills.

---

## Non-Functional Architecture

### Performance

- **API acknowledgement:** < 100ms (p95) — Core Service commits ledger and returns before any external call
- **AML screening:** < 2s (p95) — parallel list screening with local cache for hot entities
- **Full settlement:** payment-rail dependent (ACH: 1-3 days; SEPA: same day; FAST/PromptPay: seconds)
- **Stablecoin mint/burn:** 30-90s depending on network congestion

### Availability

- Core Service and API Gateway: 99.99% SLA (multi-AZ ECS, auto-scaling)
- Kafka: 3-broker cluster with replication factor 3; no data loss on single-node failure
- Database: CockroachDB multi-region cluster; automatic failover < 30s

### Security

- All data in transit: TLS 1.3
- All data at rest: AES-256 (AWS KMS-managed keys)
- PAN/account numbers: tokenised at ingest; raw values never written to logs
- Penetration testing: quarterly, with findings tracked to closure
- PCI DSS compliance: SAQ-D scope management, quarterly ASV scans

### Observability

- **Metrics:** Datadog with custom dashboards per payment corridor (success rate, latency, volume, error rate)
- **Distributed tracing:** OpenTelemetry traces spanning API → Core Service → Payout Service → Provider
- **Alerting:** P1 pages within 30s of success rate dropping below 99%; P2 on latency p95 exceeding 1s
- **Audit logging:** every state transition written to an immutable append-only `AUDIT_LOGS` table and replicated to S3 for 7-year retention (regulatory requirement)

---

## About the Author

**Tony Aizize** is a Software Engineering Manager and de-facto Payments Architect with 10+ years building production payment infrastructure across APAC, EMEA, and the US.

- **Current:** Software Engineering Manager, Payments & FX Infra at Aspire Financial Technologies (Singapore)
- **Past:** Senior SDE (Payments) at Thunes — integrated GrabPay, TikTok Pay, Alipay and 40+ APAC providers; migrated legacy Perl systems to Go, handling 2M+ daily transactions
- **Integrations delivered:** 50+ banks and payment providers (JPM, DBS, Wise, PayPal, Stripe, RippleNet, Circle, and more)
- **Volume handled:** $50M+ monthly transaction volume; 500+ TPS at peak
- **Education:** M.Tech Software Engineering (NUS, 2023) · Graduate Diploma Systems Science (NUS, 2016) · B.Sc Management Science & Engineering (CUFE Beijing, 2015)
- **Certifications:** AWS Certified Solutions Architect (Associate)

The architecture documented in this portfolio reflects patterns developed and battle-tested across multiple production deployments. The open-source reference implementation, **Taymas-Bank**, containing annotated bank integration samples in Go, is planned for public release in late 2025.

---

*tony.aizize@you.co · linkedin.com/in/tony007 · github.com/Aibier*
