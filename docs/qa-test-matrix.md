QA Test Matrix: Trading App Lab
===============================

Scope
-----

Lab ini dimodelkan untuk QA engineer yang perlu menguji:

- UI smoke automation
- functional API regression
- negative business rules
- performance baseline
- stress and spike behavior
- CI execution
- reporting and observability

Coverage Map
------------

| Area | Type | Tool | Objective | Status |
| --- | --- | --- | --- | --- |
| Trading dashboard UI | UI functional smoke | Playwright | login, market refresh, portfolio refresh, place order from browser | Active |
| Health endpoint | Functional smoke | Newman | service alive, market state exposed | Active |
| Login success/failure | Functional regression | Newman, k6 | auth happy path and 401 path | Active |
| Market tickers/depth | Functional + performance | Newman, k6 | market data valid under load | Active |
| Portfolio auth and polling | Functional + performance | Newman, k6 | secure portfolio access and refresh pattern | Active |
| Create order | Functional + performance | Newman, k6 | core trading flow works | Active |
| Order detail lookup | Functional + performance | Newman, k6 | created order retrievable | Active |
| Invalid symbol | Negative business | Newman, k6 | reject unknown instruments | Active |
| Invalid side/type/quantity | Negative business | k6 | validate request contract | Active |
| Insufficient buying power | Negative business | Newman, k6 | enforce business guardrail | Active |
| Duplicate client order id | Negative business | Newman, k6 | simulate idempotency conflict | Active |
| Market closed rejection | Negative business | Newman, k6 | reject trading when market closed | Active |
| Load baseline | Non-functional | k6 | normal trading day traffic | Active |
| Stress | Non-functional | k6 | find bottleneck and degradation | Active |
| Spike | Non-functional | k6 | market-open style burst | Active |
| Soak | Non-functional | k6 | long duration stability | Active |
| Reporting | Observability | InfluxDB, Grafana | time-series trend and export | Active |
| CI orchestration | Delivery | Jenkins | automated functional + performance gate | Active |

Real Case Scenarios
-------------------

Functional regression:

1. trading dashboard must render in browser
2. user can login from UI
3. user can refresh market and portfolio widgets
4. user can place order from UI and see `FILLED`
5. screenshot evidence must be captured

Functional API regression:

1. service health must be available before testing starts
2. valid trader can login and receive token
3. invalid credentials must return `401`
4. unauthorized portfolio access must return `401`
5. trader can create an order and retrieve order detail

Negative business rules:

1. invalid symbol must return `404`
2. invalid order type must return `400`
3. invalid side must return `400`
4. invalid quantity must return `400`
5. insufficient buying power must return `422`
6. duplicate `clientOrderId` must return `409`
7. market closed must reject order with `503`
8. missing order detail must return `404`

Performance profiles:

1. `smoke`
   sanity check low volume
2. `load`
   normal working-day steady traffic
3. `stress`
   rising traffic until resource pressure becomes visible
4. `spike`
   sudden demand burst
5. `market_open_chaos`
   bursty open-market mix with read and write pressure
6. `soak`
   long-duration stability

Exit Criteria for Lab Runs
--------------------------

Functional API:

- all Newman requests pass
- no unexpected `5xx`
- market state restored to `OPEN`

Performance:

- `http_req_failed < 5%`
- `checks > 95%`
- scenario thresholds remain green
- no `request timeout`
- no Influx flush warning in Jenkins validation run

Artifacts
---------

- Jenkins console log
- Playwright screenshots
- Newman JUnit XML
- Newman JSON result
- k6 logs per stage
- Grafana dashboard export JSON
