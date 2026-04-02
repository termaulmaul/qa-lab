import http from 'k6/http';
import { check, group, sleep } from 'k6';

const targetUrl = __ENV.TARGET_URL || 'http://app:8000';
const username = __ENV.LOGIN_USERNAME || 'qa_user';
const password = __ENV.LOGIN_PASSWORD || 'qa_pass';
const symbol = __ENV.SYMBOL || 'BBCA';
const quantity = Number(__ENV.ORDER_QUANTITY || 1);
const sleepSeconds = Number(__ENV.ITERATION_SLEEP || 1);
const testProfile = __ENV.TEST_PROFILE || 'load';
const profileDuration = __ENV.TEST_DURATION || '2m';
const invalidSymbol = __ENV.INVALID_SYMBOL || 'XXXX';
const invalidPassword = __ENV.INVALID_PASSWORD || 'wrong-pass';
const expected409 = http.expectedStatuses(409);
const expected503 = http.expectedStatuses(503);
const expected401 = http.expectedStatuses(401);
const expected404 = http.expectedStatuses(404);
const expected400 = http.expectedStatuses(400);
const expected422 = http.expectedStatuses(422);

function buildScenarios(profile) {
  const profiles = {
    smoke: {
      market_data: {
        executor: 'shared-iterations',
        vus: 1,
        iterations: 5,
        maxDuration: '1m',
        exec: 'marketDataScenario',
      },
      trading_flow: {
        executor: 'shared-iterations',
        vus: 1,
        iterations: 3,
        maxDuration: '1m',
        exec: 'tradingFlowScenario',
      },
      negative_flow: {
        executor: 'shared-iterations',
        vus: 1,
        iterations: 2,
        maxDuration: '1m',
        exec: 'negativeTradingScenario',
      },
    },
    load: {
      market_data: {
        executor: 'constant-arrival-rate',
        rate: Number(__ENV.MARKET_RATE || 60),
        timeUnit: '1s',
        duration: profileDuration,
        preAllocatedVUs: Number(__ENV.MARKET_PRE_VUS || 20),
        maxVUs: Number(__ENV.MARKET_MAX_VUS || 100),
        exec: 'marketDataScenario',
      },
      portfolio_polling: {
        executor: 'constant-arrival-rate',
        rate: Number(__ENV.PORTFOLIO_RATE || 20),
        timeUnit: '1s',
        duration: profileDuration,
        preAllocatedVUs: Number(__ENV.PORTFOLIO_PRE_VUS || 10),
        maxVUs: Number(__ENV.PORTFOLIO_MAX_VUS || 40),
        exec: 'portfolioScenario',
      },
      trading_flow: {
        executor: 'constant-arrival-rate',
        rate: Number(__ENV.TRADE_RATE || 8),
        timeUnit: '1s',
        duration: profileDuration,
        preAllocatedVUs: Number(__ENV.TRADE_PRE_VUS || 10),
        maxVUs: Number(__ENV.TRADE_MAX_VUS || 50),
        exec: 'tradingFlowScenario',
      },
      negative_flow: {
        executor: 'constant-arrival-rate',
        rate: Number(__ENV.NEGATIVE_RATE || 2),
        timeUnit: '1s',
        duration: profileDuration,
        preAllocatedVUs: Number(__ENV.NEGATIVE_PRE_VUS || 5),
        maxVUs: Number(__ENV.NEGATIVE_MAX_VUS || 20),
        exec: 'negativeTradingScenario',
      },
    },
    stress: {
      market_data: {
        executor: 'ramping-arrival-rate',
        startRate: Number(__ENV.MARKET_START_RATE || 50),
        timeUnit: '1s',
        preAllocatedVUs: Number(__ENV.MARKET_PRE_VUS || 40),
        maxVUs: Number(__ENV.MARKET_MAX_VUS || 400),
        exec: 'marketDataScenario',
        stages: [
          { target: Number(__ENV.STRESS_STAGE1 || 100), duration: '1m' },
          { target: Number(__ENV.STRESS_STAGE2 || 200), duration: '1m' },
          { target: Number(__ENV.STRESS_STAGE3 || 400), duration: '1m' },
          { target: 0, duration: '30s' },
        ],
      },
      trading_flow: {
        executor: 'ramping-arrival-rate',
        startRate: Number(__ENV.TRADE_START_RATE || 5),
        timeUnit: '1s',
        preAllocatedVUs: Number(__ENV.TRADE_PRE_VUS || 20),
        maxVUs: Number(__ENV.TRADE_MAX_VUS || 200),
        exec: 'tradingFlowScenario',
        stages: [
          { target: Number(__ENV.TRADE_STAGE1 || 15), duration: '1m' },
          { target: Number(__ENV.TRADE_STAGE2 || 40), duration: '1m' },
          { target: Number(__ENV.TRADE_STAGE3 || 80), duration: '1m' },
          { target: 0, duration: '30s' },
        ],
      },
      negative_flow: {
        executor: 'ramping-arrival-rate',
        startRate: Number(__ENV.NEGATIVE_START_RATE || 2),
        timeUnit: '1s',
        preAllocatedVUs: Number(__ENV.NEGATIVE_PRE_VUS || 10),
        maxVUs: Number(__ENV.NEGATIVE_MAX_VUS || 50),
        exec: 'negativeTradingScenario',
        stages: [
          { target: Number(__ENV.NEGATIVE_STAGE1 || 5), duration: '1m' },
          { target: Number(__ENV.NEGATIVE_STAGE2 || 10), duration: '1m' },
          { target: Number(__ENV.NEGATIVE_STAGE3 || 20), duration: '1m' },
          { target: 0, duration: '30s' },
        ],
      },
    },
    spike: {
      market_data: {
        executor: 'ramping-arrival-rate',
        startRate: 20,
        timeUnit: '1s',
        preAllocatedVUs: 30,
        maxVUs: 300,
        exec: 'marketDataScenario',
        stages: [
          { target: 20, duration: '30s' },
          { target: 250, duration: '20s' },
          { target: 250, duration: '30s' },
          { target: 20, duration: '30s' },
        ],
      },
      trading_flow: {
        executor: 'ramping-arrival-rate',
        startRate: 2,
        timeUnit: '1s',
        preAllocatedVUs: 10,
        maxVUs: 150,
        exec: 'tradingFlowScenario',
        stages: [
          { target: 2, duration: '30s' },
          { target: 35, duration: '20s' },
          { target: 35, duration: '30s' },
          { target: 2, duration: '30s' },
        ],
      },
      negative_flow: {
        executor: 'ramping-arrival-rate',
        startRate: 1,
        timeUnit: '1s',
        preAllocatedVUs: 5,
        maxVUs: 40,
        exec: 'negativeTradingScenario',
        stages: [
          { target: 1, duration: '30s' },
          { target: 10, duration: '20s' },
          { target: 10, duration: '30s' },
          { target: 1, duration: '30s' },
        ],
      },
    },
    market_open_chaos: {
      market_data: {
        executor: 'ramping-arrival-rate',
        startRate: Number(__ENV.MARKET_START_RATE || 40),
        timeUnit: '1s',
        preAllocatedVUs: Number(__ENV.MARKET_PRE_VUS || 50),
        maxVUs: Number(__ENV.MARKET_MAX_VUS || 500),
        exec: 'marketDataScenario',
        stages: [
          { target: 50, duration: '20s' },
          { target: 180, duration: '20s' },
          { target: 350, duration: '30s' },
          { target: 120, duration: '20s' },
          { target: 50, duration: '20s' },
        ],
      },
      portfolio_polling: {
        executor: 'ramping-arrival-rate',
        startRate: Number(__ENV.PORTFOLIO_START_RATE || 10),
        timeUnit: '1s',
        preAllocatedVUs: Number(__ENV.PORTFOLIO_PRE_VUS || 20),
        maxVUs: Number(__ENV.PORTFOLIO_MAX_VUS || 150),
        exec: 'portfolioScenario',
        stages: [
          { target: 15, duration: '20s' },
          { target: 60, duration: '20s' },
          { target: 120, duration: '30s' },
          { target: 40, duration: '20s' },
          { target: 15, duration: '20s' },
        ],
      },
      trading_flow: {
        executor: 'ramping-arrival-rate',
        startRate: Number(__ENV.TRADE_START_RATE || 5),
        timeUnit: '1s',
        preAllocatedVUs: Number(__ENV.TRADE_PRE_VUS || 20),
        maxVUs: Number(__ENV.TRADE_MAX_VUS || 200),
        exec: 'tradingFlowScenario',
        stages: [
          { target: 10, duration: '20s' },
          { target: 30, duration: '20s' },
          { target: 80, duration: '30s' },
          { target: 20, duration: '20s' },
          { target: 10, duration: '20s' },
        ],
      },
      negative_flow: {
        executor: 'ramping-arrival-rate',
        startRate: Number(__ENV.NEGATIVE_START_RATE || 3),
        timeUnit: '1s',
        preAllocatedVUs: Number(__ENV.NEGATIVE_PRE_VUS || 10),
        maxVUs: Number(__ENV.NEGATIVE_MAX_VUS || 100),
        exec: 'negativeTradingScenario',
        stages: [
          { target: 5, duration: '20s' },
          { target: 15, duration: '20s' },
          { target: 40, duration: '30s' },
          { target: 10, duration: '20s' },
          { target: 5, duration: '20s' },
        ],
      },
    },
    soak: {
      market_data: {
        executor: 'constant-arrival-rate',
        rate: Number(__ENV.MARKET_RATE || 40),
        timeUnit: '1s',
        duration: profileDuration,
        preAllocatedVUs: Number(__ENV.MARKET_PRE_VUS || 25),
        maxVUs: Number(__ENV.MARKET_MAX_VUS || 120),
        exec: 'marketDataScenario',
      },
      portfolio_polling: {
        executor: 'constant-arrival-rate',
        rate: Number(__ENV.PORTFOLIO_RATE || 15),
        timeUnit: '1s',
        duration: profileDuration,
        preAllocatedVUs: Number(__ENV.PORTFOLIO_PRE_VUS || 10),
        maxVUs: Number(__ENV.PORTFOLIO_MAX_VUS || 60),
        exec: 'portfolioScenario',
      },
      trading_flow: {
        executor: 'constant-arrival-rate',
        rate: Number(__ENV.TRADE_RATE || 5),
        timeUnit: '1s',
        duration: profileDuration,
        preAllocatedVUs: Number(__ENV.TRADE_PRE_VUS || 10),
        maxVUs: Number(__ENV.TRADE_MAX_VUS || 40),
        exec: 'tradingFlowScenario',
      },
      negative_flow: {
        executor: 'constant-arrival-rate',
        rate: Number(__ENV.NEGATIVE_RATE || 1),
        timeUnit: '1s',
        duration: profileDuration,
        preAllocatedVUs: Number(__ENV.NEGATIVE_PRE_VUS || 5),
        maxVUs: Number(__ENV.NEGATIVE_MAX_VUS || 20),
        exec: 'negativeTradingScenario',
      },
    },
  };

  return profiles[profile] || profiles.load;
}

export const options = {
  scenarios: buildScenarios(testProfile),
  tags: {
    suite: 'performance',
    product: 'trading-lab',
    test_profile: testProfile,
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
    'http_req_duration{scenario:market_data}': ['p(95)<500'],
    'http_req_duration{scenario:portfolio_polling}': ['p(95)<800'],
    'http_req_duration{scenario:trading_flow}': ['p(95)<1200'],
    'http_req_duration{scenario:negative_flow}': ['p(95)<1200'],
    checks: ['rate>0.95'],
  },
};

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function setMarketState(token, status, responseCallback = null) {
  return http.post(
    `${targetUrl}/api/admin/market-state`,
    JSON.stringify({ status }),
    {
      headers: authHeaders(token),
      ...(responseCallback ? { responseCallback } : {}),
    }
  );
}

function login() {
  const response = http.post(
    `${targetUrl}/api/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'login status is 200': (res) => res.status === 200,
    'login returns token': (res) => Boolean(res.json('token')),
  });

  return response.json('token');
}

function healthCheck() {
  const response = http.get(`${targetUrl}/health`);
  check(response, {
    'health status is 200': (res) => res.status === 200,
    'market status exists': (res) => Boolean(res.json('marketStatus')),
  });
}

export function marketDataScenario() {
  group('market-data', () => {
    healthCheck();

    const tickers = http.get(`${targetUrl}/api/market/tickers`);
    check(tickers, {
      'tickers status is 200': (res) => res.status === 200,
      'tickers contain data': (res) => (res.json('tickers') || []).length >= 3,
    });

    const depth = http.get(`${targetUrl}/api/market/depth?symbol=${symbol}`);
    check(depth, {
      'depth status is 200': (res) => res.status === 200,
      'depth has bids': (res) => (res.json('depth.bids') || []).length > 0,
      'depth has asks': (res) => (res.json('depth.asks') || []).length > 0,
    });
  });

  sleep(sleepSeconds);
}

export function portfolioScenario() {
  group('portfolio-polling', () => {
    const token = login();

    const watchlist = http.get(`${targetUrl}/api/watchlist`, {
      headers: authHeaders(token),
    });
    check(watchlist, {
      'watchlist status is 200': (res) => res.status === 200,
      'watchlist has symbols': (res) => (res.json('symbols') || []).length > 0,
    });

    const portfolio = http.get(`${targetUrl}/api/portfolio`, {
      headers: authHeaders(token),
    });
    check(portfolio, {
      'portfolio status is 200': (res) => res.status === 200,
      'portfolio has positions': (res) => (res.json('positions') || []).length > 0,
    });
  });

  sleep(sleepSeconds);
}

export function tradingFlowScenario() {
  group('trading-flow', () => {
    const token = login();

    const portfolio = http.get(`${targetUrl}/api/portfolio`, {
      headers: authHeaders(token),
    });
    check(portfolio, {
      'pre-trade portfolio status is 200': (res) => res.status === 200,
    });

    const createOrder = http.post(
      `${targetUrl}/api/orders`,
      JSON.stringify({
        symbol,
        side: 'BUY',
        quantity,
        type: 'MARKET',
      }),
      { headers: authHeaders(token) }
    );
    check(createOrder, {
      'order create status is 201': (res) => res.status === 201,
      'order create has id': (res) => Boolean(res.json('orderId')),
      'order create filled': (res) => res.json('status') === 'FILLED',
    });

    const orderId = createOrder.json('orderId');

    const listOrders = http.get(`${targetUrl}/api/orders`, {
      headers: authHeaders(token),
    });
    check(listOrders, {
      'orders list status is 200': (res) => res.status === 200,
      'orders list has data': (res) => (res.json('orders') || []).length >= 1,
    });

    const orderDetail = http.get(`${targetUrl}/api/orders/${orderId}`, {
      headers: authHeaders(token),
    });
    check(orderDetail, {
      'order detail status is 200': (res) => res.status === 200,
      'order detail matches id': (res) => res.json('orderId') === orderId,
      'order detail symbol matches': (res) => res.json('symbol') === symbol,
    });
  });

  sleep(sleepSeconds);
}

export function negativeTradingScenario() {
  group('negative-trading', () => {
    const badLogin = http.post(
      `${targetUrl}/api/login`,
      JSON.stringify({ username, password: invalidPassword }),
      { headers: { 'Content-Type': 'application/json' }, responseCallback: expected401 }
    );
    check(badLogin, {
      'negative login returns 401': (res) => res.status === 401,
    });

    const unauthorizedPortfolio = http.get(`${targetUrl}/api/portfolio`, {
      responseCallback: expected401,
    });
    check(unauthorizedPortfolio, {
      'unauthorized portfolio returns 401': (res) => res.status === 401,
    });

    const token = login();

    const badSymbol = http.post(
      `${targetUrl}/api/orders`,
      JSON.stringify({ symbol: invalidSymbol, side: 'BUY', quantity, type: 'MARKET' }),
      { headers: authHeaders(token), responseCallback: expected404 }
    );
    check(badSymbol, {
      'invalid symbol returns 404': (res) => res.status === 404,
    });

    const badSide = http.post(
      `${targetUrl}/api/orders`,
      JSON.stringify({ symbol, side: 'HOLD', quantity, type: 'MARKET' }),
      { headers: authHeaders(token), responseCallback: expected400 }
    );
    check(badSide, {
      'invalid side returns 400': (res) => res.status === 400,
    });

    const badQuantity = http.post(
      `${targetUrl}/api/orders`,
      JSON.stringify({ symbol, side: 'BUY', quantity: 0, type: 'MARKET' }),
      { headers: authHeaders(token), responseCallback: expected400 }
    );
    check(badQuantity, {
      'invalid quantity returns 400': (res) => res.status === 400,
    });

    const noPower = http.post(
      `${targetUrl}/api/orders`,
      JSON.stringify({ symbol: 'BBCA', side: 'BUY', quantity: 500000, type: 'MARKET' }),
      { headers: authHeaders(token), responseCallback: expected422 }
    );
    check(noPower, {
      'insufficient buying power returns 422': (res) => res.status === 422,
    });

    const badOrderType = http.post(
      `${targetUrl}/api/orders`,
      JSON.stringify({ symbol, side: 'BUY', quantity, type: 'ICEBERG' }),
      { headers: authHeaders(token), responseCallback: expected400 }
    );
    check(badOrderType, {
      'invalid order type returns 400': (res) => res.status === 400,
    });

    const duplicateClientOrderId = `dup-${__VU}-${__ITER}`;
    const firstOrder = http.post(
      `${targetUrl}/api/orders`,
      JSON.stringify({ symbol, side: 'BUY', quantity, type: 'MARKET', clientOrderId: duplicateClientOrderId }),
      { headers: authHeaders(token) }
    );
    check(firstOrder, {
      'first duplicate-check order succeeds': (res) => res.status === 201,
    });

    const duplicateOrder = http.post(
      `${targetUrl}/api/orders`,
      JSON.stringify({ symbol, side: 'BUY', quantity, type: 'MARKET', clientOrderId: duplicateClientOrderId }),
      { headers: authHeaders(token), responseCallback: expected409 }
    );
    check(duplicateOrder, {
      'duplicate client order id returns 409': (res) => res.status === 409,
    });

    const closeMarket = setMarketState(token, 'CLOSED');
    check(closeMarket, {
      'market close toggle returns 200': (res) => res.status === 200,
    });

    const closedMarketOrder = http.post(
      `${targetUrl}/api/orders`,
      JSON.stringify({ symbol, side: 'BUY', quantity, type: 'MARKET' }),
      { headers: authHeaders(token), responseCallback: expected503 }
    );
    check(closedMarketOrder, {
      'market closed returns 503': (res) => res.status === 503,
    });

    const reopenMarket = setMarketState(token, 'OPEN');
    check(reopenMarket, {
      'market reopen toggle returns 200': (res) => res.status === 200,
    });

    const missingOrder = http.get(`${targetUrl}/api/orders/TRX-NOT-FOUND`, {
      headers: authHeaders(token),
      responseCallback: expected404,
    });
    check(missingOrder, {
      'missing order detail returns 404': (res) => res.status === 404,
    });
  });

  sleep(sleepSeconds);
}

export default function () {
  marketDataScenario();
}
