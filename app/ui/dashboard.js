const authToken = localStorage.getItem('authToken');
const authUsername = localStorage.getItem('authUsername');

if (!authToken) {
  window.location.href = '/';
}

const logoutButton = document.getElementById('logout-button');
const orderForm = document.getElementById('order-form');
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

authStatus.textContent = authUsername ? `Logged in as ${authUsername}` : 'Logged in';

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
    if (response.status === 401) {
      // Token might be invalid or expired
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUsername');
      window.location.href = '/';
    }
    throw new Error(body.message || `Request failed with ${response.status}`);
  }
  return body;
}

function appendOrderRows(orders) {
  ordersBody.innerHTML = orders
    .map(
      (item) => `
        <tr>
          <td>${item.orderId}</td>
          <td>${item.symbol}</td>
          <td>${item.side}</td>
          <td class="text-right">${item.quantity}</td>
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
          <td class="text-right">${ticker.lastPrice}</td>
          <td class="text-right"><span style="color: ${ticker.changePct >= 0 ? 'var(--success)' : 'var(--danger)'}">${ticker.changePct > 0 ? '+' : ''}${ticker.changePct}%</span></td>
          <td class="text-right">${ticker.volume.toLocaleString()}</td>
        </tr>
      `
    )
    .join('');
}

async function loadPortfolio() {
  const payload = await requestJson('/api/portfolio', {
    headers: getAuthHeaders(),
  });
  buyingPower.textContent = payload.buyingPower.toLocaleString();
  portfolioList.innerHTML = payload.positions
    .map(
      (position) => `
        <li>
          <span>${position.symbol}</span>
          <div style="text-align: right;">
            <strong>${position.quantity}</strong> 
            <span style="opacity: 0.6; font-size: 0.85rem">@ ${position.avgPrice}</span>
          </div>
        </li>
      `
    )
    .join('');
}

async function loadWatchlist() {
  const payload = await requestJson('/api/watchlist', {
    headers: getAuthHeaders(),
  });
  watchlistList.innerHTML = payload.tickers
    .map(
      (ticker) => `
        <li>
          <span>${ticker.symbol}</span>
          <div style="text-align: right;">
            <strong>${ticker.lastPrice}</strong> 
            <span style="color: ${ticker.changePct >= 0 ? 'var(--success)' : 'var(--danger)'}; font-size: 0.85rem; margin-left: 8px;">${ticker.changePct > 0 ? '+' : ''}${ticker.changePct}%</span>
          </div>
        </li>
      `
    )
    .join('');
  setMessage(watchlistMessage, `Loaded ${payload.symbols.length} symbols`, 'success');
}

async function loadOrders() {
  const payload = await requestJson('/api/orders', {
    headers: getAuthHeaders(),
  });
  appendOrderRows(payload.orders);
  setMessage(ordersMessage, `Loaded ${payload.orders.length} orders`, 'success');
}

async function lookupOrder() {
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

logoutButton.addEventListener('click', () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUsername');
  window.location.href = '/';
});

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
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

// Initial load
Promise.all([loadMarket(), loadPortfolio(), loadWatchlist(), loadOrders()]).catch(console.error);
