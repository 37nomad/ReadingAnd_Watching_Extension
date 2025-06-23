let latestScrapedItems = []; // Temporary in-memory list

function renderItems(container, items) {
  container.innerHTML = "";

  if (items.length === 0) {
    container.textContent = "No scraped content found.";
    return;
  }

  const latestItems = items.slice(0, 10);

  latestItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = item.title || `Item ${index + 1}`;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = `${item.pageType || "page"} \u2022 ${item.wordCount || 0} words`;

    const time = document.createElement("div");
    time.className = "item-meta";
    time.textContent = `Scraped at: ${new Date(item.extractedAt).toLocaleString()}`;

    const url = document.createElement("div");
    url.className = "item-meta";
    url.textContent = item.url || "No URL";

    div.appendChild(title);
    div.appendChild(meta);
    div.appendChild(time);
    div.appendChild(url);

    container.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('content-list');

  // Render any already received items
  renderItems(container, latestScrapedItems);

  // Listen for new scraped items sent from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'newScrapedContent' && message.data) {
      console.log("🆕 Received new scraped item in popup:", message.data);
      latestScrapedItems.unshift(message.data);

      // Keep only the last 10
      if (latestScrapedItems.length > 10) {
        latestScrapedItems = latestScrapedItems.slice(0, 10);
      }

      renderItems(container, latestScrapedItems);
    }
  });
});
