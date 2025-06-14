(() => {
  const url = window.location.href;
  const title = document.title;

  const data = {
    url,
    title,
    timestamp: Date.now(),
    type: url.includes("youtube.com/watch") ? "video" : "web",
    source: url.includes("youtube.com") ? "YouTube" : "Generic"
  };

  if (data.type === "video") {
    const channel = document.querySelector("#channel-name")?.innerText?.trim() || "Unknown Channel";
    data.channel = channel;
  }

  chrome.storage.local.get({ activity: [] }, (result) => {
    const activity = [data, ...result.activity].slice(0, 100); // Keep max 100 records
    chrome.storage.local.set({ activity });
  });
})();
