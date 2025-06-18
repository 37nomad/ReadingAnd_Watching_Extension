document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('content-list');
  
    chrome.storage.local.get(["scrapedItems"], (result) => {
      const items = result.scrapedItems || [];
  
      if (items.length === 0) {
        container.textContent = "No scraped content found.";
        return;
      }
  
      container.innerHTML = "";
  
      const latestItems = items.slice(-10).reverse();
  
      latestItems.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "item";
  
        const title = document.createElement("div");
        title.className = "item-title";
        title.textContent = item.title || `Item ${index + 1}`;
  
        const meta = document.createElement("div");
        meta.className = "item-meta";
        meta.textContent = `${item.pagetype || "page"} \u2022 ${item.wordCount || 0} words`;
  
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
    });
  });
  