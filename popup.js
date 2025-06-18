document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('content-list');
  
    chrome.storage.local.get(["scrapedItems"], (result) => {
      const items = result.scrapedItems || [];
  
      if (items.length === 0) {
        container.textContent = "No scraped content found.";
        return;
      }
  
      container.innerHTML = ""; // Clear "Loading..."
  
      items.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "item";
  
        const title = document.createElement("div");
        title.className = "item-title";
        title.textContent = item.title || `Item ${index + 1}`;
  
        const meta = document.createElement("div");
        meta.className = "item-meta";
        meta.textContent = `Page: ${item.pagetype || "Unknown"} • ${item.wordCount || 0} words • Score: ${item.qualityScore || "N/A"}`;
  
        const extractedAt = document.createElement("div");
        extractedAt.className = "item-meta";
        extractedAt.textContent = `Extracted: ${item.extractedAt || "Unknown time"}`;
  
        const url = document.createElement("div");
        url.className = "item-meta";
        url.textContent = `URL: ${item.url || "No URL"}`;
  
        div.appendChild(title);
        div.appendChild(meta);
        div.appendChild(extractedAt);
        div.appendChild(url);
  
        container.appendChild(div);
      });
    });
  });
  