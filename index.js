const aggBtn = document.getElementById('agg');
const platBtn = document.getElementById('platbtn');
const catBtn = document.getElementById('cat');
const dupBtn = document.getElementById('dup');
const toggle = document.getElementById('toggle');
const clock = document.getElementById('clock');
const searchInput = document.getElementById('search-input');

const widgetToggle = document.getElementById('widget-toggle');
const widgetPanel = document.getElementById('widget-panel');
const panelClose = document.getElementById('panel-close');

let use24hr = localStorage.getItem('clock24') !== 'false';
let particleInterval;

// === THEME HANDLING ===
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'light') {
  document.body.setAttribute('data-theme', 'light');
  toggle.textContent = 'Dark';
} else if (savedTheme === 'dark') {
  document.body.removeAttribute('data-theme');
  toggle.textContent = 'Light';
} else {
  document.body.setAttribute('data-theme', prefersDark ? '' : 'light');
  toggle.textContent = prefersDark ? 'Light' : 'Dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (localStorage.getItem('theme')) return;
  document.body.setAttribute('data-theme', e.matches ? '' : 'light');
  toggle.textContent = e.matches ? 'Light' : 'Dark';
  stopParticles();
  setTimeout(startParticles, 400);
});

// === QUICK LINKS ===
aggBtn.onclick = () => triggerPrompt('agg');
platBtn.onclick = () => triggerPrompt('plat');
catBtn.onclick = () => triggerPrompt('cat');
dupBtn.onclick = () => triggerPrompt('dup');

function triggerPrompt(type) {
  let p = prompt('Platform:', 'platform name');
  if (!p) return;
  let url;
  if (type === 'agg') url = `https://aggregate.redrosecps.com/${p}`;
  else if (type === 'plat') url = `https://${p}.redrosecps.com`;
  else if (type === 'cat') url = `https://${p}.crscat.com`;
  else if (type === 'dup') url = `https://${p}.redrosecps.com/fingerprintDuplicateAnalysisRequestList`;
  openUrl(url);
}

function openUrl(url) { 
  chrome.tabs.update({ url });
}

// Ctrl+A/P/C/D shortcuts
document.addEventListener('keydown', e => {
  if (!e.ctrlKey) return;
  if (e.key === 'a' || e.key === 'A') { e.preventDefault(); triggerPrompt('agg'); }
  else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); triggerPrompt('plat'); }
  else if (e.key === 'c' || e.key === 'C') { e.preventDefault(); triggerPrompt('cat'); }
  else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); triggerPrompt('dup'); }
});

// Search with unduck.link
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && searchInput.value.trim()) {
    const query = searchInput.value.trim();
    chrome.tabs.update({ url: `https://unduck.link?q=${encodeURIComponent(query)}` });
    searchInput.value = '';
  }
});

// === CLOCK ===
function updateClock() {
  const now = new Date();
  const timeStr = use24hr
    ? now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  clock.textContent = timeStr;
}
clock.onclick = () => {
  use24hr = !use24hr;
  localStorage.setItem('clock24', use24hr);
  updateClock();
};
updateClock();
setInterval(updateClock, 1000);

// === THEME TOGGLE ===
toggle.onclick = () => {
  const isLight = document.body.hasAttribute('data-theme');
  if (isLight) {
    document.body.removeAttribute('data-theme');
    toggle.textContent = 'Light';
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.setAttribute('data-theme', 'light');
    toggle.textContent = 'Dark';
    localStorage.setItem('theme', 'light');
  }
  stopParticles();
  setTimeout(startParticles, 400);
};

// === BOOKMARKS ===
(async () => {
  const bms = await chrome.bookmarks.getTree();
  const container = document.getElementById('dials');
  flatten(bms).slice(0, 40).forEach(bm => {
    if (bm.url && bm.url.startsWith('http')) {
      const btn = document.createElement('button');
      btn.textContent = bm.title || new URL(bm.url).hostname;
      btn.onclick = () => chrome.tabs.update({ url: bm.url });
      container.appendChild(btn);
    }
  });
})();

function flatten(nodes) {
  let res = [];
  nodes.forEach(n => {
    if (n.children) res.push(...flatten(n.children));
    if (n.url) res.push(n);
  });
  return res;
}

// === PARTICLES ===
function startParticles() {
  if (particleInterval) return;
  particleInterval = setInterval(() => {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + 'vw';
    const duration = Math.random() * 10 + 15;
    const delay = Math.random() * 3;
    p.style.animation = `float-up ${duration}s linear ${delay}s forwards, fade-in-out ${duration}s ease-in-out ${delay}s forwards`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), (duration + delay + 1) * 1000);
  }, 800);
}

function stopParticles() {
  if (particleInterval) clearInterval(particleInterval);
  particleInterval = null;
  document.querySelectorAll('.particle').forEach(p => p.remove());
}

// === WIDGET PANEL TOGGLE (with close button + Escape) ===
function openPanel() {
  widgetPanel.classList.add('open');
  document.body.classList.add('panel-open');
}

function closePanel() {
  widgetPanel.classList.remove('open');
  document.body.classList.remove('panel-open');
}

widgetToggle.onclick = openPanel;
panelClose.onclick = closePanel;

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && widgetPanel.classList.contains('open')) {
    closePanel();
  }
});

// === CURRENCY CONVERTER ===
const apiKey = 'YOUR_API_KEY_HERE'; // ← Put your exchangerate-api.com key here
let rates = null;

async function fetchRates(base = 'USD') {
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`);
    if (!res.ok) throw new Error('API down');
    const data = await res.json();
    rates = data.conversion_rates;
    document.getElementById('info').textContent = 
      `Updated: ${new Date(data.time_last_update_utc).toLocaleString()}`;
    populateCurrencies();
  } catch (err) {
    document.getElementById('result').textContent = 'API error – check your key';
  }
}

function populateCurrencies() {
  const from = document.getElementById('fromCurrency');
  const to = document.getElementById('toCurrency');
  from.innerHTML = to.innerHTML = '';
  Object.keys(rates).sort().forEach(cur => {
    const opt = new Option(cur, cur);
    from.add(opt.cloneNode(true));
    to.add(opt);
  });
  from.value = 'USD';
  to.value = 'EUR';
}

document.getElementById('convert').onclick = () => {
  const amount = parseFloat(document.getElementById('amount').value);
  const from = document.getElementById('fromCurrency').value;
  const to = document.getElementById('toCurrency').value;
  if (!amount || !rates) {
    document.getElementById('result').textContent = 'Invalid amount';
    return;
  }
  const result = (amount * rates[to]).toFixed(2);
  document.getElementById('result').textContent = `${amount} ${from} → ${result} ${to}`;
};

document.getElementById('switchCurrencies').onclick = () => {
  const from = document.getElementById('fromCurrency');
  const to = document.getElementById('toCurrency');
  [from.value, to.value] = [to.value, from.value];
  fetchRates(from.value);
};

// === ON LOAD ===
window.addEventListener('load', () => {
  document.title = 'New Tab';
  searchInput.focus();
  startParticles();
  fetchRates(); // Load currency rates immediately
});

// === PARTICLE ANIMATIONS (injected once) ===
document.head.insertAdjacentHTML('beforeend', `
  <style>
    @keyframes float-up { from { transform: translateY(0); } to { transform: translateY(-120vh); } }
    @keyframes fade-in-out { 0%, 100% { opacity: 0; } 10%, 90% { opacity: 0.6; } }
  </style>
`);