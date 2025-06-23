function injectScraper(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["assets/content.js"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.warn("Injection failed:", chrome.runtime.lastError.message);
    } else {
      console.log("✅ Scraper injected into tab", tabId);
    }
  });
}

function preloadLLMTab() {
  chrome.tabs.query({ url: chrome.runtime.getURL("get_started.html") }, (tabs) => {
    if (tabs.length === 0) {
      chrome.tabs.create({
        url: chrome.runtime.getURL("get_started.html"),
        active: false
      }, (tab) => {
        console.log("🚀 get_started.html loaded in background tab", tab.id);
      });
    } else {
      console.log("🧠 LLM tab already loaded.");
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveContent' && message.data) {
    console.log("📩 Received scraped content:", message.data);

    // Forward to LLM for summarization
    chrome.runtime.sendMessage({
      action: 'summarize',
      data: {
        title: message.data.title,
        description: message.data.content
      }
    });

    // Notify popup if needed (optional)
    sendResponse({ status: 'ok' });
  }
});

function isSafePage(url) {
  return url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://');
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (!tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")) {
      injectScraper(tabId);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active &&
      !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")) {
    injectScraper(tabId);
  }
});

chrome.runtime.onInstalled.addListener(preloadLLMTab);
chrome.runtime.onStartup.addListener(preloadLLMTab);
