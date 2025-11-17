// bg.js – actually useful now, forces focus on your search box

chrome.runtime.onStartup.addListener(() => {
  // Chrome just started, session restore might steal focus → steal it back
  setTimeout(forceFocusOnNewTab, 800);
});

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab.url?.includes(chrome.runtime.getURL('index.html'))) {
      forceFocusOnNewTab();
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes(chrome.runtime.getURL('index.html'))) {
    forceFocusOnNewTab();
  }
});

function forceFocusOnNewTab() {
  chrome.tabs.query({ url: chrome.runtime.getURL('index.html') + '*' }, tabs => {
    tabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const input = document.getElementById('search-input');
          if (input) {
          input.focus();
          input.select(); // optional: highlights the text if any
          }
        }
      });
    });
  });
}