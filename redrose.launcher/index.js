const aggBtn = document.getElementById('agg');
const platBtn = document.getElementById('platbtn');
const catBtn = document.getElementById('cat');
const dupBtn = document.getElementById('dup');
const toggle = document.getElementById('toggle');
const clock = document.getElementById('clock');
const searchInput = document.getElementById('search-input');

let use24hr = localStorage.getItem('clock24') !== 'false';
let particleInterval;

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'light') {
  document.body.setAttribute('data-theme', 'light');
  toggle.textContent = 'Dark';
} else if (savedTheme === 'dark') {
  document.body.removeAttribute('data-theme');
  toggle.textContent = 'Light';
} else {
  if (prefersDark) {
    document.body.removeAttribute('data-theme');
    toggle.textContent = 'Light';
  } else {
    document.body.setAttribute('data-theme', 'light');
    toggle.textContent = 'Dark';
  }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (localStorage.getItem('theme')) return;
  if (e.matches) {
    document.body.removeAttribute('data-theme');
    toggle.textContent = 'Light';
  } else {
    document.body.setAttribute('data-theme', 'light');
    toggle.textContent = 'Dark';
  }
  stopParticles();
  setTimeout(startParticles, 400);
});

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

document.addEventListener('keydown', (e) => {
  if (!e.ctrlKey) return;
  if (e.key === 'a' || e.key === 'A') { e.preventDefault(); triggerPrompt('agg'); }
  else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); triggerPrompt('plat'); }
  else if (e.key === 'c' || e.key === 'C') { e.preventDefault(); triggerPrompt('cat'); }
  else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); triggerPrompt('dup'); }
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && searchInput.value.trim()) {
    const query = searchInput.value.trim();
    const url = `https://unduck.link?q=${encodeURIComponent(query)}`;
    chrome.tabs.update({ url });
    searchInput.value = '';
  }
});

function updateClock() {
  const now = new Date();
  let timeStr;
  if (use24hr) {
    timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } else {
    timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  }
  clock.textContent = timeStr;
}

clock.onclick = () => {
  use24hr = !use24hr;
  localStorage.setItem('clock24', use24hr);
  updateClock();
};

updateClock();
setInterval(updateClock, 1000);

window.addEventListener('load', () => {
  document.title = 'New Tab';
  if (document.activeElement) document.activeElement.blur();
  window.focus();
  document.body.focus();
  setTimeout(() => {
    if (document.activeElement && document.activeElement.tagName !== 'BODY') {
      document.activeElement.blur();
    }
    document.body.focus();
    searchInput.focus();
  }, 100);

  startParticles();
});

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

(async () => {
  let bms = await chrome.bookmarks.getTree();
  let container = document.getElementById('dials');
  flatten(bms).slice(0,40).forEach(bm => {
    if (bm.url && bm.url.startsWith('http')) {
      let btn = document.createElement('button');
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

document.head.insertAdjacentHTML('beforeend', `
  <style>
    @keyframes float-up {
      from { transform: translateY(0); }
      to { transform: translateY(-120vh); }
    }
    @keyframes fade-in-out {
      0%, 100% { opacity: 0; }
      10%, 90% { opacity: 0.6; }
    }
  </style>
`);