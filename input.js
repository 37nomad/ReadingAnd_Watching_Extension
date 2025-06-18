chrome.storage.local.get("scrapedItems", (result) => {
    const items = result.scrapedItems || [];
  
    const formattedInput = items.map((item, index) => {
      return `Entry ${index + 1}:
  URL: ${item.url}
  Title: ${item.title}
  Wordcount: ${item.wordCount}
  Pagetype: ${item.pagetype}
  Extracted at: ${item.extractedAt}
  Qualityscore: ${item.qualityScore}
  Content:
  ${item.content}
  
  ----------------------`;
    }).join("\n");
  
    console.log("📄 LLM Input:\n", formattedInput);
  
  });
  