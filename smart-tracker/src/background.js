let scrapedHistory = [];

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
  console.log("📩 Received saveContent:", message.data);
  if (message.action === 'saveContent' && message.data) {
    const data = {
      title: message.data.title,
      content: message.data.content,
      url: message.data.url || (sender.tab ? sender.tab.url : ''),
      wordCount: message.data.wordCount || message.data.content?.split(/\s+/).length || 0,
      pageType: message.data.pageType || 'webpage',
      extractedAt: new Date().toISOString()
    };

    // Add to the front of the array
    scrapedHistory.unshift(data);

    // Keep only the last 10 entries
    if (scrapedHistory.length > 10) {
      scrapedHistory = scrapedHistory.slice(0, 10);
    }

    // Trigger summarization
    chrome.runtime.sendMessage({
      action: 'summarize',
      data: {
        title: data.title,
        description: data.content
      }
    });

    // Optional: notify popup or badge
    chrome.runtime.sendMessage({
      action: 'newScrapedContent',
      data: data
    });

    sendResponse({ status: 'ok' });
  }

  // 🔁 Provide scraped history to popup
  if (message.action === 'getScrapedHistory') {
    sendResponse(scrapedHistory);
  }

  // 🧠 (legacy) Provide latest scraped content
  if (message.action === 'getScrapedContent') {
    sendResponse({ data: scrapedHistory[0] || null });
  }

  return true;
});

function isSafePage(url) {
  return url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://');
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (isSafePage(tab.url)) {
      injectScraper(tabId);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active && isSafePage(tab.url)) {
    injectScraper(tabId);
  }
});

chrome.runtime.onInstalled.addListener(preloadLLMTab);
chrome.runtime.onStartup.addListener(preloadLLMTab);
