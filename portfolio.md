---
title: Fiat-Crypto Native Payment Infrastructure
theme: portfolio
format: A4
margin: 0.65in
margin_top: 0.70in
---

# Fiat-Crypto Native Payment Infrastructure

**Tony Aizize** · Software Engineering Manager, Payments & FX Infra · [linkedin.com/in/tony007](https://www.linkedin.com/in/tony007) · [github.com/Aibier](https://github.com/Aibier)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                               │
│   API Gateway · Load Balancer · Rate Limiter (per client) · Routing     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼───────────────────────┐
        │                        │                       │
┌───────▼────────┐    ┌──────────▼──────────┐  ┌────────▼────────┐
│  CORE SERVICE  │    │  MESSAGE QUEUE LAYER │  │  CACHE LAYER    │
│                │    │                      │  │                 │
│ · Validation & │◄──►│  Apache Kafka        │  │  Redis Cache    │
│   Acknowledge  │    │  Event Streaming     │  │  Hot Data       │
│ · Ledger Entry │    │  Async Communication │  │  Performance    │
│ · Idempotency  │    │  Event Sourcing      │  │  Optimization   │
│ · User/Account │    └──────────────────────┘  └─────────────────┘
└───────┬────────┘
        │
┌───────▼──────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER (CockroachDB)                  │
│   Accounts         Transactions        Cards          Compliance      │
│   User Data        All Records         Card Info      KYC/AML Checks  │
│   KYC Status       ──────────          Limits &       Audit Logs      │
└──────────────────────────────────────────────────────────────────────┘
        │
┌───────┴──────────────────────────────────────────────────────────────┐
│                        CORE SERVICES                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │  PAYOUT SERVICE  │  │ CARD CONNECTOR   │  │ ACCEPTANCE SERVICE │  │
│  │  Third Party     │  │ SERVICE          │  │ Provider Notif.    │  │
│  │  Integration     │  │ Card Transaction │  │ Status Updates     │  │
│  │  Fiat/Crypto     │  │ Handling         │  │                    │  │
│  └────────┬─────────┘  └──────────────────┘  └────────────────────┘  │
│  ┌────────▼─────────────────────────────────────────────────────────┐ │
│  │  AML SERVICE                                                     │ │
│  │  AML/Compliance Checks · Risk Assessment                         │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
        │
┌───────┴──────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEMS                               │
│  Traditional Banks       Crypto Providers        Payment Rails        │
│  DBS, JPM, HSBC          Circle USDC              ACH, SEPA           │
│                          Tether USDT              PIX, UPI, MPesa     │
│  Clients / Merchants                                                  │
│  Users initiating transactions · POS · Online Stores                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Event Streaming & Crypto Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                     EVENT STREAMING LAYER                            │
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────────────┐ │
│  │ API GATEWAY │    │CORE SERVICE │    │     APACHE KAFKA         │ │
│  │             │───►│             │───►│                          │ │
│  │ API Gateway │    │ · Request   │    │ · Event Coordination     │ │
│  │ Request     │    │   Validation│    │ · Status Updates         │ │
│  │ Routing     │    │ · Ledger    │    │                          │ │
│  │ Rate        │    │   Creation  │    └─────────────┬────────────┘ │
│  │ Limiting    │    │ · Idempotency│                 │              │
│  └─────────────┘    └─────────────┘                 │              │
│                                                      │              │
│  ┌─────────────────────────────────────────────────▼────────────┐  │
│  │                   PAYOUT SERVICES                             │  │
│  │  ┌────────────────┐          ┌──────────────────────────┐    │  │
│  │  │  AML SERVICE   │          │   PROVIDER ORCHESTRATOR  │    │  │
│  │  │                │          │                          │    │  │
│  │  │ · Compliance   │          │ · Provider Selection     │    │  │
│  │  │   Checks       │          │ · Route Optimization     │    │  │
│  │  │ · Risk         │          │ · Status Management      │    │  │
│  │  │   Assessment   │          └────────────┬─────────────┘    │  │
│  │  └────────────────┘                       │                  │  │
│  └───────────────────────────────────────────┼──────────────────┘  │
│                                              │                      │
│  ┌───────────────────────────────────────────▼──────────────────┐  │
│  │                    CRYPTO PROVIDERS                           │  │
│  │  Crypto Exchanges     Blockchain Networks   Stablecoin        │  │
│  │  Binance, Coinbase    Ethereum, Polygon,    Issuers           │  │
│  │                       BSC                  Circle USDC        │  │
│  │                                            Tether USDT        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    FIAT PROVIDERS                             │  │
│  │  Payout Service         Acceptance Service                    │  │
│  │  · Bank Integration     · Provider Notifications              │  │
│  │  · Payment Rails        · Status Updates                      │  │
│  │  · Blockchain Integ.                                          │  │
│  │                                                               │  │
│  │  Payment Rails          Card Networks    Traditional Banks    │  │
│  │  ACH, SEPA, PIX, UPI    Visa, Mastercard DBS, JPM, HSBC      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Client Types                                                        │
│  · Crypto Client — Wallet, Exchange                                  │
│  · Fiat Client  — Bank Transfer, Card, ACH                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Payment Flows

### 3.1 On-Ramp Flow (Fiat → Crypto)

```
User Initiates Transaction
         │
         ▼
   ┌─────────────┐       ┌──────────────────┐
   │  Validate   │──────►│ Reject Transaction│ (if invalid)
   │  Request    │       └──────────────────┘
   └──────┬──────┘
          │ (valid)
          ▼
   ┌──────────────────┐      ┌──────────────────┐
   │  AML Compliance  │─────►│ Reject Transaction│ (if failed)
   │  Check           │      └──────────────────┘
   └──────┬───────────┘
          │ Compliance Passed
          ▼
   ┌──────────────┐
   │ Select       │
   │ Provider     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Execute      │
   │ Transaction  │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Update       │
   │ Status       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Notify User  │
   └──────────────┘
          │
         End
```

### 3.2 Off-Ramp Flow (Crypto → Fiat)

Same flow as On-Ramp — Validate → AML Compliance Check → Select Provider → Execute Transaction → Update Status → Notify User.

### 3.3 Card Funding — On-Ramp

```
User Initiates Card Transaction
         │
         ▼
   ┌─────────────┐       ┌──────────────────┐
   │  Validate   │──────►│ Reject Transaction│ (if invalid)
   │  Card Details│      └──────────────────┘
   └──────┬──────┘
          │
          ▼
   ┌──────────────────┐
   │ Check Card       │
   │ Network          │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Visa/Mastercard      │
   │ Processing           │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Core Service         │
   │ Processing           │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────┐       ┌──────────────────┐
   │  AML Compliance  │──────►│ Reject Transaction│ (if failed)
   │  Check           │       └──────────────────┘
   └──────┬───────────┘
          │ Compliance Passed
          ▼
   ┌──────────────────────┐
   │ Provider Orchestrator│
   └──────┬───────────────┘
          ▼
   ┌──────────────────────┐
   │ Card Network         │
   │ Integration          │
   └──────┬───────────────┘
          ▼
   ┌──────────────────────┐
   │ Execute Transaction  │
   └──────┬───────────────┘
          ▼
   ┌──────────────────────┐
   │ Update Account       │
   │ Balance              │
   └──────┬───────────────┘
          ▼
   ┌──────────────┐
   │ Notify User  │
   └──────────────┘
          │
         End
```

### 3.4 Card Payout — Off-Ramp

Same actors as Card On-Ramp with reversed direction — validates card details, checks card network, processes via Visa/Mastercard, AML check, Provider Orchestrator executes, updates balance, notifies user.

---

## 4. Sequence Diagrams

### 4.1 On-Ramp Sequence

| Actor | Step |
|---|---|
| **Client** | `POST /v1/api/transactions (direction: "OnRamp")` |
| **API Gateway** | Forward request |
| **Core Service** | Validate request & create ledger entry |
| **Core Service → Kafka** | Publish `ramp.initiated` event |
| **Core Service → Client** | Return `transaction_id` & `status: "initiated"` |
| **AML Service** | Trigger AML compliance check |
| **AML Service** | Perform risk assessment |
| **AML Service → Kafka** | Publish `compliance.checked` event |
| **[AML Passed]** | AML status: `"approved"` |
| **Provider Orchestrator** | Select optimal provider |
| **Payout Service** | Execute fiat collection |
| **Bank/Payment Rail** | Initiate payment collection |
| **Bank/Payment Rail → Payout** | Payment received notification |
| **Payout Service → Kafka** | Publish `payment.received` event |
| **Core Service** | Process payment received |
| **Crypto Provider** | Mint stablecoins |
| **Crypto Provider → Payout** | Stablecoins minted notification |
| **Payout Service → Kafka** | Publish `stablecoins.minted` event |
| **Core Service** | Update transaction status |
| **Acceptance Service → Client** | Webhook: `status: "success"` |
| **[AML Failed]** | AML status: `"rejected"` |
| **Acceptance Service → Client** | Webhook: `status: "rejected"` |

### 4.2 Off-Ramp Sequence

| Actor | Step |
|---|---|
| **Client** | `POST /v1/api/transactions (direction: "OffRamp")` |
| **API Gateway** | Forward request |
| **Core Service** | Validate request & check balance |
| **Core Service → Kafka** | Publish `ramp.initiated` event |
| **Core Service → Client** | Return `transaction_id` & `status: "initiated"` |
| **AML Service** | Trigger AML compliance check |
| **AML Service** | Perform risk assessment |
| **AML Service → Kafka** | Publish `compliance.checked` event |
| **[AML Passed]** | AML status: `"approved"` |
| **Provider Orchestrator** | Select optimal provider |
| **Payout Service** | Execute fiat payout |
| **Crypto Provider** | Burn stablecoins |
| **Crypto Provider → Payout** | Stablecoins burned notification |
| **Payout Service → Kafka** | Publish `stablecoins.burned` event |
| **Payout Service** | Process stablecoins burned |
| **Bank/Payment Rail** | Initiate fiat transfer |
| **Bank/Payment Rail** | Execute bank transfer |
| **Bank/Payment Rail → Payout** | Transfer completed notification |
| **Payout Service → Kafka** | Publish `transfer.completed` event |
| **Core Service** | Update transaction status |
| **Acceptance Service → Client** | Webhook: `status: "success"` |
| **[AML Failed]** | AML status: `"rejected"` |
| **Acceptance Service → Client** | Webhook: `status: "rejected"` |

### 4.3 Card On-Ramp Sequence

| Actor | Step |
|---|---|
| **Client** | `POST /v1/api/transactions (direction: "OnRamp", payment_rail: "CARD")` |
| **API Gateway** | Forward request |
| **Core Service** | Validate request & create ledger entry |
| **Core Service → Kafka** | Publish `ramp.initiated` event |
| **Core Service → Client** | Return `transaction_id` & `status: "initiated"` |
| **Card Connector** | Process card transaction |
| **Card Network (Visa/MC)** | Authorize card payment |
| **Card Network → Connector** | Authorization response |
| **[Authorization Approved]** | |
| **AML Service** | Trigger AML compliance check |
| **AML Service** | Perform risk assessment |
| **AML Service → Kafka** | Publish `compliance.checked` event |
| **[AML Passed]** | AML status: `"approved"` |
| **Provider Orchestrator** | Select crypto provider |
| **Crypto Provider** | Mint stablecoins |
| **Crypto Provider → Payout** | Stablecoins minted notification |
| **Payout Service → Kafka** | Publish `stablecoins.minted` event |
| **Core Service** | Update transaction status |
| **Card Connector** | Capture authorization |
| **Card Network → Connector** | Payment captured notification |
| **Payout Service → Kafka** | Publish `payment.captured` event |
| **Core Service** | Finalize transaction |
| **Acceptance Service → Client** | Webhook: `status: "success"` |
| **[AML Failed]** | AML status: `"rejected"` |
| **Card Connector** | Void authorization |
| **Acceptance Service → Client** | Webhook: `status: "rejected"` |
| **[Authorization Declined]** | Authorization declined |
| **Acceptance Service → Client** | Webhook: `status: "declined"` |

### 4.4 Card Off-Ramp Sequence

| Actor | Step |
|---|---|
| **Client** | `POST /v1/api/transactions (direction: "OffRamp", payment_rail: "CARD")` |
| **API Gateway** | Forward request |
| **Core Service** | Validate request & check balance |
| **Core Service → Kafka** | Publish `ramp.initiated` event |
| **Core Service → Client** | Return `transaction_id` & `status: "initiated"` |
| **AML Service** | Trigger AML compliance check |
| **AML Service** | Perform risk assessment |
| **AML Service → Kafka** | Publish `compliance.checked` event |
| **[AML Passed]** | AML status: `"approved"` |
| **Provider Orchestrator** | Select crypto provider |
| **Crypto Provider** | Burn stablecoins |
| **Crypto Provider → Payout** | Stablecoins burned notification |
| **Payout Service → Kafka** | Publish `stablecoins.burned` event |
| **Card Connector** | Process stablecoins burned |
| **Card Network (Visa/MC)** | Process card credit |
| **Card Network** | Credit card account |
| **Card Network → Connector** | Credit processed notification |
| **Payout Service → Kafka** | Publish `credit.processed` event |
| **Core Service** | Update transaction status |
| **Acceptance Service → Client** | Webhook: `status: "success"` |
| **[AML Failed]** | AML status: `"rejected"` |
| **Acceptance Service → Client** | Webhook: `status: "rejected"` |

---

## 5. Database Schema

### 5.1 Core Tables

#### ACCOUNTS

| Column | Type | Constraint |
|---|---|---|
| account_id | uuid | PK |
| email | string | UK |
| first_name | string | |
| last_name | string | |
| phone | string | |
| country_code | string | |
| kyc_status | string | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### AUDIT_LOGS

| Column | Type | Constraint |
|---|---|---|
| log_id | uuid | PK |
| entity_type | string | |
| entity_id | uuid | |
| action | string | |
| old_values | jsonb | |
| new_values | jsonb | |
| user_id | string | |
| ip_address | string | |
| created_at | timestamp | |

#### CARDS

| Column | Type | Constraint |
|---|---|---|
| card_id | uuid | PK |
| account_id | uuid | FK |
| card_number | string | |
| masked_number | string | |
| expiry_month | int | |
| expiry_year | int | |
| cardholder_name | string | |
| card_type | string | |
| funding_currency | string | |
| card_details | jsonb | |
| limits | jsonb | |
| restrictions | jsonb | |
| status | string | |
| is_active | boolean | |
| activated_at | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | |

#### RECIPIENTS

| Column | Type | Constraint |
|---|---|---|
| recipient_id | uuid | PK |
| account_id | uuid | FK |
| recipient_type | string | |
| name | string | |
| email | string | |
| phone | string | |
| country_code | string | |
| currency | string | |
| bank_details | jsonb | |
| crypto_details | jsonb | |
| status | string | |
| is_verified | boolean | |
| is_active | boolean | |
| metadata | jsonb | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | |

#### INTEGRATIONS

| Column | Type | Constraint |
|---|---|---|
| integration_id | uuid | PK |
| integration_type | string | |
| provider_name | string | |
| provider_code | string | |
| environment | string | |
| currency | string | |
| name | string | |
| symbol | string | |
| configuration | jsonb | |
| credentials | jsonb | |
| endpoints | jsonb | |
| capabilities | jsonb | |
| is_active | boolean | |
| rate_limit | decimal | |
| timeout_seconds | int | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### CURRENCIES

| Column | Type |
|---|---|
| source_currency | string |
| target_currency | string |
| decimal_places | int |

### 5.2 Quote & Booking Tables

#### QUOTES

| Column | Type | Constraint |
|---|---|---|
| quote_id | uuid | PK, UK |
| account_id | uuid | FK |
| recipient_id | uuid | FK |
| source_amount | decimal | |
| source_currency | string | |
| target_amount | decimal | |
| target_currency | string | |
| exchange_rate | decimal | |
| mid_market_rate | decimal | |
| quote_type | string | |
| external_service | string | |
| total_fee_amount | decimal | |
| fee_type | string | |
| external_estimated_delivery_at | datetime | |
| is_quarantine_needed | boolean | |
| external_service_id | string | |
| payment_option | string | |
| direction | string | |
| is_booked | boolean | |
| should_refresh | boolean | |
| payload | jsonb | |
| expired_at | datetime | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | |

#### BOOKINGS

| Column | Type | Constraint |
|---|---|---|
| booking_id | uuid | PK |
| quote_id | uuid | FK |
| account_id | uuid | FK |
| recipient_id | uuid | FK |
| source_currency | string | FK |
| target_currency | string | FK |
| source_amount | decimal | |
| target_amount | decimal | |
| exchange_rate | decimal | |
| external_service | string | |
| total_fee_amount | decimal | |
| fee_type | string | |
| direction | string | |
| payment_option | string | |
| expired_at | datetime | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | |

### 5.3 Transaction Tables

#### TRANSACTIONS

| Column | Type | Constraint |
|---|---|---|
| transaction_id | uuid | PK |
| account_id | uuid | FK |
| recipient_id | uuid | FK |
| transaction_type | string | |
| direction | string | |
| source_amount | decimal | |
| source_currency | string | |
| target_amount | decimal | |
| target_currency | string | |
| exchange_rate | decimal | |
| status | string | |
| reference | string | |
| metadata | jsonb | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### CARD_TRANSACTIONS

| Column | Type | Constraint |
|---|---|---|
| card_transaction_id | uuid | PK |
| card_id | uuid | FK |
| source_amount | decimal | |
| source_currency | string | |
| merchant_name | string | |
| merchant_category | string | |
| merchant_country | string | |
| transaction_type | string | |
| status | string | |
| authorization_code | string | |
| reference | string | |
| fees | jsonb | |
| created_at | timestamp | |
| settled_at | timestamp | |

#### PROVIDER_TRANSACTIONS

| Column | Type | Constraint |
|---|---|---|
| provider_transaction_id | uuid | PK |
| transaction_id | uuid | FK |
| provider_type | string | |
| provider_id | string | |
| external_id | string | |
| external_reference | string | |
| status | string | |
| provider_request | jsonb | |
| provider_response | jsonb | |
| error_message | string | |
| retry_count | int | |
| external_estimated_delivery_at | datetime | |
| is_quarantine_needed | boolean | |
| payload | jsonb | |
| expired_at | datetime | |
| created_at | timestamp | |
| updated_at | timestamp | |
| completed_at | timestamp | |

#### COMPLIANCE_CHECKS

| Column | Type | Constraint |
|---|---|---|
| check_id | uuid | PK |
| account_id | uuid | FK |
| transaction_id | uuid | FK |
| check_type | string | |
| status | string | |
| risk_score | decimal | |
| compliance_officer_id | string | |
| review_notes | text | |
| collected_fields | jsonb | |
| next_review_date | date | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### TRANSACTION_SESSION_LOGS

| Column | Type | Constraint |
|---|---|---|
| log_id | uuid | PK |
| transaction_id | uuid | FK |
| session_id | string | |
| event_type | string | |
| status | string | |
| event_data | jsonb | |
| error_message | string | |
| created_at | timestamp | |

### 5.4 Schema Relationships

```
ACCOUNTS ──owns──► CARDS
ACCOUNTS ──owns──► RECIPIENTS
ACCOUNTS ──has───► QUOTES ──books──► BOOKINGS
ACCOUNTS ──has───► TRANSACTIONS
TRANSACTIONS ──ledger_entry──► PROVIDER_TRANSACTIONS
TRANSACTIONS ──triggers──────► COMPLIANCE_CHECKS
TRANSACTIONS ──session_logs──► TRANSACTION_SESSION_LOGS
CARD_TRANSACTIONS ──targets──► TRANSACTIONS
```

### 5.5 Key Design Notes

```
TRANSACTIONS (Primary Ledger)
├── transaction_id (PK)
├── sender_id, receiver_id
├── amount, currency
├── transaction_type
└── status, created_at

PROVIDER_TRANSACTIONS (Provider Executions)
├── provider_transaction_id (PK)
├── transaction_id (FK → TRANSACTIONS)
├── provider_type, provider_id
├── external_reference
└── provider_request/response data
```

**Transaction types:** `onramp` · `offramp` · `transfer` · `fx_settlement` · `card_payment`

**Payment rails:** `debit` · `bank` · `credit` · `crypto` · `card`

**Kafka topics:** `transaction.events` · `compliance.events` · `payout.events` · `webhook.events`

---

## 6. API Reference

### 6.1 Endpoints

#### Requirements & Rates

```
POST /v1/api/requirements
POST /v1/api/rates
POST /v1/api/booking
GET  /v1/api/booking/{booking_id}
```

#### Transactions

```
POST /v1/api/transactions
GET  /v1/api/transactions
GET  /v1/api/transactions/{transaction_id}
GET  /v1/api/transactions/{transaction_id}/status
POST /v1/api/transactions/optimized
POST /v1/api/transactions/batch
```

#### Payment Rails & Integrations

```
GET  /v1/api/payment-rails
GET  /v1/api/integrations
GET  /v1/api/integrations/{integration_id}
POST /v1/api/integrations/{integration_id}/test
```

#### Compliance

```
GET  /v1/api/compliance/kyc/{account_id}
GET  /v1/api/compliance/aml/{account_id}
GET  /v1/api/compliance/aml/transaction/{transaction_id}
POST /v1/api/compliance/aml/transaction/{transaction_id}
GET  /v1/api/compliance/travel-rule/{transaction_id}
POST /v1/api/compliance/travel-rule
```

#### Treasury

```
GET  /v1/api/treasury/liquidity
POST /v1/api/treasury/rebalance
GET  /v1/api/treasury/yield
GET  /v1/api/treasury/risk
POST /v1/api/treasury/emergency
```

#### Health

```
GET /v1/api/health
GET /v1/api/metrics
```

### 6.2 Authentication

```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### 6.3 Rate Limiting

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

---

## 7. API Examples

### 7.1 Get Rate Quote

**Request**

```bash
curl -X POST https://api.example.com/v1/api/rates \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": 12345,
    "source_currency": "USD",
    "source_amount": 1000,
    "target_currency": "USDT",
    "direction": "OnRamp",
    "payment_rail": {
      "type": "ACH",
      "country": "US",
      "currency": "USD"
    },
    "bank_account": {
      "account_number": "1234567890",
      "routing_number": "021000021",
      "account_holder_name": "John Doe",
      "bank_name": "Chase Bank",
      "swift_code": "CHASUS33",
      "is_verified": true
    },
    "compliance_requirements": {
      "kyc_required": true,
      "aml_required": true,
      "travel_rule_required": false,
      "regulatory_jurisdiction": "US"
    },
    "reference": "rate-quote-001"
  }'
```

**Response**

```json
{
  "id": 987654321,
  "account_id": 12345,
  "source": "USD",
  "source_amount": 1000,
  "target": "USDT",
  "target_amount": 999.50,
  "rate": 0.9995,
  "direction": "OnRamp",
  "payment_rail": {
    "type": "ACH",
    "country": "US",
    "currency": "USD",
    "estimated_processing_time": "1-3 business days"
  },
  "fees": {
    "total": 0.50,
    "breakdown": {
      "processing": 0.30,
      "network": 0.20
    }
  },
  "compliance_status": {
    "kyc_verified": true,
    "aml_verified": true,
    "travel_rule_verified": true,
    "regulatory_jurisdiction": "US"
  },
  "created_at": "2025-01-15T10:30:00Z",
  "validity": 60,
  "expires_at": "2025-01-15T10:31:00Z"
}
```

### 7.2 Create Booking

**Request**

```bash
curl -X POST https://api.example.com/v1/api/booking \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": 12345,
    "source_currency": "USD",
    "source_amount": 1000,
    "target_currency": "USDT",
    "target_amount": 999.50,
    "direction": "OnRamp",
    "payment_rail": {
      "type": "ACH",
      "country": "US",
      "currency": "USD"
    },
    "bank_account": {
      "account_number": "1234567890",
      "routing_number": "021000021",
      "account_holder_name": "John Doe",
      "bank_name": "Chase Bank",
      "swift_code": "CHASUS33",
      "is_verified": true
    },
    "compliance_requirements": {
      "kyc_required": true,
      "aml_required": true,
      "travel_rule_required": false,
      "regulatory_jurisdiction": "US"
    },
    "reference": "booking-001"
  }'
```

**Response**

```json
{
  "id": 555001,
  "account_id": 12345,
  "source_currency": "USD",
  "source_amount": 1000,
  "target_currency": "USDT",
  "target_amount": 999.50,
  "direction": "OnRamp",
  "status": "booked",
  "payment_rail": {
    "type": "ACH",
    "country": "US",
    "currency": "USD",
    "estimated_processing_time": "1-3 business days"
  },
  "fees": {
    "total": 0.50,
    "breakdown": {
      "processing": 0.30,
      "network": 0.20
    }
  },
  "compliance_status": {
    "kyc_verified": true,
    "aml_verified": true,
    "travel_rule_verified": true,
    "regulatory_jurisdiction": "US"
  },
  "created_at": "2025-01-15T10:30:00Z",
  "expires_at": "2025-01-15T10:31:00Z",
  "reference": "booking-001"
}
```

### 7.3 Create Transaction — On-Ramp

**Request**

```bash
curl -X POST https://api.example.com/v1/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-request-id" \
  -d '{
    "account_id": 12345,
    "direction": "OnRamp",
    "source_currency": "USD",
    "source_amount": 1000.00,
    "target_currency": "USDT",
    "booking_id": 555001,
    "payment_rail": {
      "type": "ACH",
      "country": "US",
      "currency": "USD"
    },
    "bank_account": {
      "account_number": "1234567890",
      "routing_number": "021000021",
      "account_holder_name": "John Doe",
      "bank_name": "Chase Bank",
      "swift_code": "CHASUS33",
      "is_verified": true
    },
    "compliance_requirements": {
      "kyc_required": true,
      "aml_required": true,
      "travel_rule_required": false,
      "regulatory_jurisdiction": "US"
    },
    "transaction_metadata": {
      "customer_reference": "CUST-001",
      "order_id": "ORDER-12345",
      "invoice_number": "INV-67890",
      "description": "On-ramp transaction for stablecoin purchase"
    },
    "reference": "onramp-001"
  }'
```

**Response**

```json
{
  "id": 1001,
  "account_id": 12345,
  "direction": "OnRamp",
  "status": "pending",
  "source_currency": "USD",
  "source_amount": 1000.00,
  "target_currency": "USDT",
  "target_amount": 999.50,
  "exchange_rate": 0.9995,
  "booking_id": 555001,
  "payment_rail": {
    "type": "ACH",
    "country": "US",
    "currency": "USD",
    "estimated_processing_time": "1-3 business days"
  },
  "bank_account": {
    "account_number": "****7890",
    "routing_number": "021000021",
    "account_holder_name": "John Doe",
    "bank_name": "Chase Bank",
    "swift_code": "CHASUS33",
    "is_verified": true
  },
  "fees": {
    "total": 0.50,
    "breakdown": {
      "processing": 0.30,
      "network": 0.20
    }
  },
  "compliance_status": {
    "kyc_verified": true,
    "aml_verified": true,
    "travel_rule_verified": true,
    "regulatory_jurisdiction": "US"
  },
  "transaction_metadata": {
    "customer_reference": "CUST-001",
    "order_id": "ORDER-12345",
    "invoice_number": "INV-67890",
    "description": "On-ramp transaction for stablecoin purchase"
  },
  "transaction_hash": null,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "expires_at": "2025-01-15T22:30:00Z",
  "reference": "onramp-001"
}
```

### 7.4 Create Transaction — Off-Ramp

```bash
curl -X POST https://api.example.com/v1/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-request-id" \
  -d '{
    "account_id": 12345,
    "direction": "OffRamp",
    "source_currency": "USDT",
    "source_amount": 500.00,
    "target_currency": "USD",
    "booking_id": 555002,
    "payment_rail": {
      "type": "ACH",
      "country": "US",
      "currency": "USD"
    },
    "bank_account": {
      "account_number": "1234567890",
      "routing_number": "021000021",
      "account_holder_name": "John Doe",
      "bank_name": "Chase Bank",
      "swift_code": "CHASUS33",
      "is_verified": true
    },
    "compliance_requirements": {
      "kyc_required": true,
      "aml_required": true,
      "travel_rule_required": false,
      "regulatory_jurisdiction": "US"
    },
    "transaction_metadata": {
      "customer_reference": "CUST-001",
      "order_id": "ORDER-12346",
      "description": "Off-ramp transaction for fiat withdrawal"
    },
    "reference": "offramp-001"
  }'
```

### 7.5 Error Response

```json
{
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Amount must be greater than 0.01",
    "details": {
      "field": "source_amount",
      "value": 0.005,
      "constraint": "minimum: 0.01"
    },
    "request_id": "req_123456789",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

---

## 8. Webhooks

### 8.1 Event Types

```
rate.expired
booking.created
booking.expired
transaction.status_changed
compliance.review_required
webhook.test
```

### 8.2 Webhook Payload — transaction.status_changed

```json
{
  "event": "transaction.status_changed",
  "data": {
    "id": 1001,
    "account_id": 12345,
    "direction": "OnRamp",
    "status": "success",
    "previous_status": "pending"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "webhook_id": "wh_123456789"
}
```

### 8.3 Travel Rule Data

```json
{
  "travel_rule_data": {
    "transaction_id": "tx_123456789",
    "originator": {
      "name": "John Doe",
      "account_number": "1234567890",
      "address": "123 Main St, New York, NY 10001",
      "date_of_birth": "1990-01-01",
      "national_id": "SSN123456789"
    },
    "beneficiary": {
      "name": "Jane Smith",
      "account_number": "0987654321",
      "address": "456 Oak Ave, London, UK",
      "date_of_birth": "1985-05-15",
      "national_id": "UK123456789"
    },
    "transaction_details": {
      "amount": 5000.00,
      "currency": "USDT",
      "purpose": "Business payment",
      "reference": "Invoice #12345"
    },
    "compliance_status": "approved",
    "regulatory_jurisdiction": "US",
    "threshold_exceeded": true,
    "reporting_required": true
  }
}
```

---

## 9. Provider Integrations

### 9.1 DBS Bank Singapore

```json
{
  "integration_id": "dbs_bank_sg",
  "provider_name": "DBS Bank Singapore",
  "type": "bank",
  "metadata": {
    "country": "SG",
    "bank_code": "7171",
    "supported_rails": ["SEPA", "SWIFT", "FAST"],
    "supported_currencies": ["USD", "SGD", "EUR"],
    "payout_limits": {
      "min_amount": 1.00,
      "max_amount": 1000000.00,
      "daily_limit": 5000000.00,
      "monthly_limit": 50000000.00
    }
  },
  "configurations": {
    "api_endpoint": "https://api.dbs.com",
    "api_version": "v2",
    "authentication_type": "oauth2",
    "webhook_url": "https://api.example.com/webhooks/dbs",
    "timeout_seconds": 30,
    "retry_attempts": 3
  },
  "capabilities": ["transfer", "balance_check", "transaction_status"],
  "is_active": true,
  "rate_limits": {
    "requests_per_minute": 100,
    "requests_per_hour": 1000,
    "requests_per_day": 10000
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### 9.2 Circle USDC

```json
{
  "integration_id": "circle_usdc",
  "provider_name": "Circle USDC",
  "type": "crypto",
  "metadata": {
    "provider_type": "stablecoin_issuer",
    "supported_networks": [
      {
        "network": "ethereum",
        "chain_id": 1,
        "rpc_url": "https://mainnet.infura.io/v3/...",
        "explorer_url": "https://etherscan.io"
      }
    ],
    "supported_tokens": [
      {
        "symbol": "USDC",
        "contract_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "decimals": 6,
        "network": "ethereum"
      }
    ],
    "fees": {
      "mint_fee": 0.0,
      "burn_fee": 0.0,
      "transfer_fee": 0.0,
      "gas_fee_multiplier": 1.0
    }
  },
  "configurations": {
    "api_endpoint": "https://api.circle.com",
    "api_version": "v1",
    "authentication_type": "api_key",
    "webhook_url": "https://api.example.com/webhooks/circle",
    "timeout_seconds": 30,
    "retry_attempts": 3,
    "gas_limit": 21000,
    "gas_price": "20"
  },
  "capabilities": ["mint", "burn", "transfer", "balance_check", "transaction_status"],
  "is_active": true,
  "rate_limits": {
    "requests_per_minute": 100,
    "requests_per_hour": 1000,
    "requests_per_day": 10000
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### 9.3 Tether USDT

```json
{
  "integration_id": "tether_usdt",
  "provider_name": "Tether USDT",
  "type": "crypto",
  "metadata": {
    "provider_type": "stablecoin_issuer",
    "supported_networks": [
      {
        "network": "ethereum",
        "chain_id": 1,
        "rpc_url": "https://mainnet.infura.io/v3/...",
        "explorer_url": "https://etherscan.io"
      }
    ],
    "supported_tokens": [
      {
        "symbol": "USDT",
        "contract_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "decimals": 6,
        "network": "ethereum"
      }
    ],
    "fees": {
      "mint_fee": 0.0,
      "burn_fee": 0.0,
      "transfer_fee": 0.0,
      "gas_fee_multiplier": 1.0
    }
  },
  "configurations": {
    "api_endpoint": "https://api.tether.to",
    "api_version": "v1",
    "authentication_type": "api_key",
    "webhook_url": "https://api.example.com/webhooks/tether",
    "timeout_seconds": 30,
    "retry_attempts": 3,
    "gas_limit": 21000,
    "gas_price": "20"
  },
  "capabilities": ["mint", "burn", "transfer", "balance_check", "transaction_status"],
  "is_active": true,
  "rate_limits": {
    "requests_per_minute": 100,
    "requests_per_hour": 1000,
    "requests_per_day": 10000
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### 9.4 Fireblocks MPC Custody

```json
{
  "custody_provider": {
    "provider_id": "fireblocks_mpc",
    "name": "Fireblocks MPC",
    "custody_type": "MPC",
    "api_endpoint": "https://api.fireblocks.io",
    "supported_networks": [
      "ethereum",
      "polygon",
      "binance_smart_chain"
    ],
    "security_features": [
      "threshold_signatures",
      "hardware_security_modules",
      "geographic_distribution",
      "key_rotation"
    ],
    "compliance_features": [
      "travel_rule_support",
      "regulatory_reporting",
      "audit_trails",
      "risk_monitoring"
    ]
  }
}
```

---

## 10. Treasury Management

```json
{
  "treasury_management": {
    "liquidity_pools": {
      "usdc_pool": {
        "total_balance": 10000000.00,
        "available_balance": 8000000.00,
        "reserved_balance": 2000000.00,
        "yield_rate": 0.045,
        "provider_distribution": {
          "circle": 0.6,
          "coinbase": 0.3,
          "binance": 0.1
        }
      },
      "usdt_pool": {
        "total_balance": 5000000.00,
        "available_balance": 4000000.00,
        "reserved_balance": 1000000.00,
        "yield_rate": 0.038,
        "provider_distribution": {
          "tether": 0.7,
          "binance": 0.3
        }
      }
    },
    "risk_metrics": {
      "total_exposure": 15000000.00,
      "counterparty_risk": 0.15,
      "market_risk": 0.08,
      "liquidity_ratio": 0.85,
      "stress_test_score": 0.92
    },
    "rebalancing_strategy": {
      "auto_rebalance": true,
      "rebalance_threshold": 0.1,
      "max_single_provider": 0.4,
      "emergency_reserve_ratio": 0.2
    }
  }
}
```

### Treasury Endpoints

```
GET  /v1/api/treasury/liquidity
POST /v1/api/treasury/rebalance
GET  /v1/api/treasury/yield
GET  /v1/api/treasury/risk
POST /v1/api/treasury/emergency
```
