chrome.runtime.sendMessage({ action: "getScrapedHistory" }, (history) => {
  console.log("Got scraped history:", history);

  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = "";

  if (!history || history.length === 0) {
    const msg = document.createElement("div");
    msg.className = "no-content";
    msg.textContent = "No scraped content found.";
    contentDiv.appendChild(msg);
    return;
  }

  for (const item of history) {
    console.log("Rendering item:", item);

    const div = document.createElement("div");
    div.className = "item";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = item.title || "Untitled";

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = `${item.pageType || "page"} • ${item.wordCount || 0} words`;

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

    contentDiv.appendChild(div);
  }
});
