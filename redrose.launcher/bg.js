chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.pendingUrl === 'chrome://newtab/') {
    // Nuke the newtab and spawn your page instead
    await chrome.tabs.remove(tab.id);
    const newTab = await chrome.tabs.create({ url: chrome.runtime.getURL('index.html'), active: true });
    // Once loaded, focus your input
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === newTab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const input = document.getElementById('your-search-input-id');
            input?.focus();
            input?.select(); // Highlight if you want
          }
        });
      }
    });
  }
});