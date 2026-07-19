<div align="center">

# Tony

### Payment Architect · Engineering Leader · Crypto Platform

**Senior Engineering Manager** · Crypto Platform & Infrastructure · [Triple A](https://triple-a.io) 🇸🇬

*Ex-YouTrip · Ex-Aspire · Ex-Thunes · 10+ years shipping money systems*

<br/>

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/tony007/)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:tony.aizize@you.co)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Aibier)

</div>

<br/>

I design and lead **payment platforms** that move money safely at scale — **ledgers**, multi-currency accounts, **FX**, card rails, **payouts**, and **crypto / stablecoin** infrastructure.

Most of my career has been inside regulated fintech: building systems that banks, PSPs, and merchants depend on every day, and leading the teams that keep them reliable.

---

### What I work on

Ledger design · multi-currency wallets · cross-border payouts · card issuing · on-ramp / off-ramp · webhooks · reconciliation · AML-aware flows · multi-region expansion

---

### Where I've been

**[Triple A](https://triple-a.io)** — leading crypto platform and infrastructure engineering for stablecoin payment rails.

**YouTrip** — led 20+ engineers across MCA and YouBiz; Family Card, 3DS, top-ups, business accounts; multi-currency wallets and cards processing at large scale; engineering career ladder.

**Aspire** — payment architecture for multi-currency business accounts across Singapore, Hong Kong, and Australia; virtual accounts, payout, and FX provider integrations.

**Thunes** — tech lead for GrabPay and TikTok influencer pay; high-volume APAC corridors; 15+ partners including Alipay, DBS, RippleNet, and MoneyGram.

---

### Selected work

**Payout service**  
Multi-currency global payouts with 40+ providers (JPM, DBS, Wise, HDFC, PayPal, Stripe, RippleNet, and more). Event-driven, high throughput, bank-facing reliability.

**Payment acceptance & webhooks**  
Real-time provider acknowledgement path, fraud workflows under MAS / HKMA expectations, horizontal scale on AWS, Kafka, Redis, and Datadog.

**High-volume processors**  
Grab and TikTok payment integrations supporting millions of daily transactions, with routing and settlement logic tuned for regional rails.

**Cross-border platforms**  
Unified FX and payout services, plus core account and reconciliation modules for high-availability money systems.

---

### Stack I use most

![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![CockroachDB](https://img.shields.io/badge/CockroachDB-6933FF?style=flat-square&logo=cockroachlabs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-231F20?style=flat-square&logo=apachekafka&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazonwebservices&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![gRPC](https://img.shields.io/badge/gRPC-244c5a?style=flat-square&logo=grpc&logoColor=white)
![Datadog](https://img.shields.io/badge/Datadog-632CA6?style=flat-square&logo=datadog&logoColor=white)

---

### Architecture I care about

Core owns money truth. Rails stay in a payout service. Fiat and crypto share one account and ledger model. One codebase, multi-region ready — expand markets by configuration, not by forking the platform.

```mermaid
flowchart TB
  subgraph clients[" "]
    direction LR
    A[Web / Checkout]
    B[Mobile]
    C[Merchant API]
  end

  API[Core API · auth · rate limits]
  CORE[Core Service · ledger · transactions]
  PAY[Payout Service · bank · crypto · FX]

  subgraph external[" "]
    direction LR
    D[Banks / PSPs]
    E[Crypto custody]
    F[AML vendors]
  end

  subgraph data[" "]
    direction LR
    G[(CockroachDB)]
    H[(MySQL)]
    I[(Redis)]
  end

  A --> API
  B --> API
  C --> API
  API --> CORE
  CORE --> PAY
  CORE --> F
  PAY --> D
  PAY --> E
  API --> G
  API --> I
  PAY --> H
```

---

### Banks & providers I've integrated with

Alipay · WeChat Pay · PayPal · Stripe · MoneyGram · RippleNet · GrabPay · Wise · CurrencyCloud · J.P. Morgan · DBS · Citi · Standard Chartered · HDFC · SeaBank · Maybank · KBank · SCB · CZBank · 9Pay · and many more across APAC, EMEA, and the US.

---

### Education

Management Essentials — Harvard Business School (2025)  
M.Tech Software Engineering — National University of Singapore (2021)  
M.Comp Computer Science — National University of Singapore (2015)  
B.S. Management Science & Engineering — Central University of Finance & Economics (2011)

---

<div align="center">

### Resources

[Resume](https://github.com/Aibier/Aibier/blob/main/resume.pdf)
&nbsp;·&nbsp;
[Portfolio](https://github.com/Aibier/Aibier/blob/main/portfolio.pdf)
&nbsp;·&nbsp;
[Bank integration guide](https://drive.google.com/file/d/19g5SY3wFXJeZKx0nm6leUdoQecCtkABr/view?usp=sharing)

<br/>

Always happy to connect with people building serious payment systems.

[LinkedIn](https://www.linkedin.com/in/tony007/) · [Email](mailto:tony.aizize@you.co) · [GitHub](https://github.com/Aibier)

</div>
