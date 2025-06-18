function saveScrapedContent(newItem) {
  chrome.storage.local.get(["scrapedItems"], (result) => {
    const items = result.scrapedItems || [];

    // Avoid duplicates
    const alreadyExists = items.some(item => item.url === newItem.url);
    if (alreadyExists) {
      console.log("⚠️ Already saved.");
      return;
    }

    items.push(newItem);

    chrome.storage.local.set({ scrapedItems: items }, () => {
      console.log("✅ Saved:", newItem.title);
    });
  });
}

// ✅ THIS IS MISSING
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveContent' && message.data) {
    console.log("📩 Received scraped content in background:", message.data);
    saveScrapedContent(message.data);
    sendResponse({ status: 'ok' });
  }
});
