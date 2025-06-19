// 🔄 Inject content.js into the active tab (used in both listeners)
function injectScraper(tabId) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content.js"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn("Injection failed:", chrome.runtime.lastError.message);
      } else {
        console.log("✅ Scraper injected into tab", tabId);
      }
    });
  }
  
  // 💾 Save scraped content in local storage
  function saveScrapedContent(newItem) {
    chrome.storage.local.get(["scrapedItems"], (result) => {
      let items = result.scrapedItems || [];
  
      items = items.filter(item => item.url !== newItem.url);
  
      items.unshift(newItem);
  
      if (items.length > 40) {
        items = items.slice(0, 40);
      }
  
      chrome.storage.local.set({ scrapedItems: items }, () => {
        console.log(`✅ Saved: ${newItem.title} | Total stored: ${items.length}`);
      });
    });
  }
  
  // 📩 Listen for messages from content.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveContent' && message.data) {
      console.log("📩 Received scraped content in background:", message.data);
      saveScrapedContent(message.data);
      sendResponse({ status: 'ok' });
    }
  });
  
  // 🧠 NEW: Inject scraper when switching to an already-open tab
  chrome.tabs.onActivated.addListener(({ tabId }) => {
    chrome.tabs.get(tabId, (tab) => {
      if (!tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")) {
        injectScraper(tabId); // ⬅️ Scrape when switching to an active tab
      }
    });
  });
  
  // 🧠 NEW: Inject scraper when tab is fully loaded
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active &&
        !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")) {
      injectScraper(tabId); // ⬅️ Scrape when page load completes
    }
  });