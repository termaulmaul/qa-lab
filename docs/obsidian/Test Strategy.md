# Test Strategy

## Coverage

- UI smoke automation
- API functional regression
- negative business rules
- baseline load test
- stress test
- spike test
- soak test
- CI validation
- observability validation

## Business Flow

1. login
2. market ticker
3. market depth
4. watchlist
5. portfolio
6. create order
7. order detail

## Negative Cases

- invalid login
- unauthorized portfolio
- invalid symbol
- invalid side
- invalid quantity
- invalid order type
- insufficient buying power
- duplicate client order id
- market closed
- missing order detail

## Automation Mapping

- API: Newman
- UI: Playwright
- performance: k6
- pipeline gate: Jenkins
- dashboard: Grafana

## Referensi

- [[../qa-test-matrix]]
- [[Runbook]]
