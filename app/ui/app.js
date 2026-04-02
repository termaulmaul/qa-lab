let authToken = null;
const loginForm = document.getElementById('login-form');
const orderForm = document.getElementById('order-form');
const loginMessage = document.getElementById('login-message');
const orderMessage = document.getElementById('order-message');
const watchlistMessage = document.getElementById('watchlist-message');
const ordersMessage = document.getElementById('orders-message');
const authStatus = document.getElementById('auth-status');
const marketStateBadge = document.getElementById('market-state');
const marketBody = document.getElementById('market-body');
const portfolioList = document.getElementById('portfolio-list');
const watchlistList = document.getElementById('watchlist-list');
const ordersBody = document.getElementById('orders-body');
const buyingPower = document.getElementById('buying-power');
const orderResult = document.getElementById('order-result');
const orderId = document.getElementById('order-id');
const orderStatus = document.getElementById('order-status');
const orderPrice = document.getElementById('order-price');
const orderLookupId = document.getElementById('order-lookup-id');
const lookupOrderButton = document.getElementById('lookup-order-button');
function setMessage(node, text, tone) {
  node.textContent = text;
  node.className = `message${tone ? ` ${tone}` : ''}`;
}
function getAuthHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}
async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || `Request failed with ${response.status}`);
  }
  return body;
}
function setLoggedOutViews() {
  buyingPower.textContent = '-';
  portfolioList.innerHTML = '';
  watchlistList.innerHTML = '';
  ordersBody.innerHTML = '';
}
function appendOrderRows(orders) {
  ordersBody.innerHTML = orders
    .map(
      (item) => `
        <tr>
          <td>${item.orderId}</td>
          <td>${item.symbol}</td>
          <td>${item.side}</td>
          <td>${item.quantity}</td>
          <td>${item.status}</td>
        </tr>
      `
    )
    .join('');
}
async function loadMarket() {
  const payload = await requestJson('/api/market/tickers');
  marketStateBadge.textContent = `Market ${payload.marketStatus}`;
  marketBody.innerHTML = payload.tickers
    .map(
      (ticker) => `
        <tr>
          <td>${ticker.symbol}</td>
          <td>${ticker.lastPrice}</td>
          <td>${ticker.changePct}%</td>
          <td>${ticker.volume.toLocaleString()}</td>
        </tr>
      `
    )
    .join('');
}
async function loadPortfolio() {
  if (!authToken) {
    setMessage(ordersMessage, '', '');
    buyingPower.textContent = '-';
    portfolioList.innerHTML = '';
    return;
  }
  const payload = await requestJson('/api/portfolio', {
    headers: getAuthHeaders(),
  });
  buyingPower.textContent = payload.buyingPower.toLocaleString();
  portfolioList.innerHTML = payload.positions
    .map(
      (position) => `
        <li>
          <span>${position.symbol}</span>
          <strong>${position.quantity} @ ${position.avgPrice}</strong>
        </li>
      `
    )
    .join('');
}
async function loadWatchlist() {
  if (!authToken) {
    watchlistList.innerHTML = '';
    setMessage(watchlistMessage, 'Login first to view watchlist', 'error');
    return;
  }
  const payload = await requestJson('/api/watchlist', {
    headers: getAuthHeaders(),
  });
  watchlistList.innerHTML = payload.tickers
    .map(
      (ticker) => `
        <li>
          <span>${ticker.symbol}</span>
          <strong>${ticker.lastPrice} (${ticker.changePct}%)</strong>
        </li>
      `
    )
    .join('');
  setMessage(watchlistMessage, `Loaded ${payload.symbols.length} symbols`, 'success');
}
async function loadOrders() {
  if (!authToken) {
    ordersBody.innerHTML = '';
    setMessage(ordersMessage, 'Login first to view order history', 'error');
    return;
  }
  const payload = await requestJson('/api/orders', {
    headers: getAuthHeaders(),
  });
  appendOrderRows(payload.orders);
  setMessage(ordersMessage, `Loaded ${payload.orders.length} orders`, 'success');
}
async function lookupOrder() {
  if (!authToken) {
    setMessage(ordersMessage, 'Login first to lookup order', 'error');
    return;
  }
  const orderIdValue = orderLookupId.value.trim();
  if (!orderIdValue) {
    setMessage(ordersMessage, 'Order ID is required', 'error');
    return;
  }
  const payload = await requestJson(`/api/orders/${encodeURIComponent(orderIdValue)}`, {
    headers: getAuthHeaders(),
  });
  appendOrderRows([payload]);
  setMessage(ordersMessage, `Order ${payload.orderId} found`, 'success');
}
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  try {
    const payload = await requestJson('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password'),
      }),
    });
    authToken = payload.token;
    authStatus.textContent = `Logged in as ${payload.user.username}`;
    setMessage(loginMessage, 'Login successful', 'success');
    await Promise.all([loadPortfolio(), loadWatchlist(), loadOrders()]);
  } catch (error) {
    authToken = null;
    authStatus.textContent = 'Logged out';
    setLoggedOutViews();
    setMessage(loginMessage, error.message, 'error');
  }
});
orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!authToken) {
    setMessage(orderMessage, 'Login first before placing an order', 'error');
    return;
  }
  const formData = new FormData(orderForm);
  try {
    const payload = await requestJson('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        symbol: formData.get('symbol'),
        side: formData.get('side'),
        quantity: Number(formData.get('quantity')),
        type: formData.get('type'),
        clientOrderId: `ui-${Date.now()}`,
      }),
    });
    setMessage(orderMessage, 'Order created successfully', 'success');
    orderId.textContent = payload.orderId;
    orderStatus.textContent = payload.status;
    orderPrice.textContent = payload.filledPrice;
    orderResult.hidden = false;
    await Promise.all([loadPortfolio(), loadOrders()]);
  } catch (error) {
    orderResult.hidden = true;
    setMessage(orderMessage, error.message, 'error');
  }
});
document.getElementById('refresh-market').addEventListener('click', () => {
  loadMarket().catch((error) => setMessage(orderMessage, error.message, 'error'));
});
document.getElementById('refresh-portfolio').addEventListener('click', () => {
  loadPortfolio().catch((error) => setMessage(orderMessage, error.message, 'error'));
});
document.getElementById('refresh-watchlist').addEventListener('click', () => {
  loadWatchlist().catch((error) => setMessage(watchlistMessage, error.message, 'error'));
});
document.getElementById('refresh-orders').addEventListener('click', () => {
  loadOrders().catch((error) => setMessage(ordersMessage, error.message, 'error'));
});
lookupOrderButton.addEventListener('click', () => {
  lookupOrder().catch((error) => setMessage(ordersMessage, error.message, 'error'));
});
setLoggedOutViews();
loadMarket().catch((error) => setMessage(orderMessage, error.message, 'error'));
