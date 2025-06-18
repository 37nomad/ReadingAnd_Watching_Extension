(() => {
  let lastUrl = location.href;

  // Detect SPA navigation changes
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      handlePageData();
    }
  }).observe(document, { subtree: true, childList: true });

  // Run immediately on first load
  handlePageData();

  function handlePageData() {
    const url = location.href;
    const title = document.title;

    // Attempt to extract meta description and keywords
    const metaDescription = document.querySelector("meta[name='description']")?.content?.trim() || "";
    const metaKeywords = document.querySelector("meta[name='keywords']")?.content?.trim() || "";

    // Fallback to some visible content
    const pageText = document.body?.innerText?.trim().replace(/\s+/g, " ") || "";
    const brief = metaDescription || pageText.slice(0, 300);

    const data = {
      url,
      title,
      description: brief,
      keywords: metaKeywords,
      timestamp: Date.now(),
      type: "page"
    };

    chrome.storage.local.get({ activity: [] }, (result) => {
      const updated = [data, ...result.activity].slice(0, 100);
      chrome.storage.local.set({ activity: updated });
    });
  }
})();