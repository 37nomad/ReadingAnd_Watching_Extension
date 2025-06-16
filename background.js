chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveContent' && request.data) {
      const jsonString = JSON.stringify(request.data, null, 2);
      const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
  
      chrome.downloads.download({
        url: dataUrl,
        filename: `scraped-${Date.now()}.json`,
        saveAs: false // change to true if you want manual save prompt
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError.message);
        } else {
          console.log('✅ JSON download started with ID:', downloadId);
        }
      });
    }
  });
  