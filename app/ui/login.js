const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

function setMessage(node, text, tone) {
  node.textContent = text;
  node.className = `message${tone ? ` ${tone}` : ''}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || `Request failed with ${response.status}`);
  }
  return body;
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
    
    // Store token and user info
    localStorage.setItem('authToken', payload.token);
    localStorage.setItem('authUsername', payload.user.username);
    
    setMessage(loginMessage, 'Login successful', 'success');
    
    setTimeout(() => {
        window.location.href = '/ui/dashboard.html';
    }, 500);
  } catch (error) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUsername');
    setMessage(loginMessage, error.message, 'error');
  }
});

// If already logged in, redirect to dashboard
if (localStorage.getItem('authToken')) {
  window.location.href = '/ui/dashboard.html';
}
