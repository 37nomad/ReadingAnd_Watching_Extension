(() => { 
  if (window.hasInitializedScraper) {
    console.log("Scraper already initialized. Skipping.");
    return;
  }
  window.hasInitializedScraper = true;

  if (!window.__scraperInitialized__) {
    window.__scraperInitialized__ = true;

    class EnhancedContentScraper {
        constructor() {
          console.log('Enhanced Content Scraper with YouTube transcript support initialized');
        }
      
        async extractContent() {
          const url = window.location.href;
          const pageType = this.getPageType(url);
          
          console.log(`Extracting from: ${pageType} | ${url}`);
      
          const title = this.getTitle();
          let content = '';
          
          if (pageType === 'youtube') {
            content = await this.getYouTubeContent();
          } else {
            content = this.getArticleContent();
          }
          
          const wordCount = this.countWords(content);
          
          const minWords = pageType === 'youtube' ? 20 : 50;
          
          if (wordCount < minWords) {
            console.log(`Content too short (${wordCount} words), skipping...`);
            return null;
          }
      
          const result = {
            url: url,
            title: title,
            content: content,
            wordCount: wordCount,
            pageType: pageType,
            extractedAt: new Date().toISOString(),
            qualityScore: this.calculateQualityScore(wordCount, title, pageType)
          };
      
          console.log('Content extracted:', {
            title: result.title,
            wordCount: result.wordCount,
            qualityScore: result.qualityScore,
            contentPreview: content.substring(0, 100) + '...'
          });

          chrome.runtime.sendMessage({
            action: 'saveContent',
            data: result
          }, (response) => {
            console.log('Sent to background:', response);
          });                
    
          return result;
        }
      
        getPageType(url) {
          const hostname = new URL(url).hostname.toLowerCase();
          
          if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
            return 'youtube';
          }
          
          if (hostname.includes('medium.com') || 
              hostname.includes('substack.com') ||
              hostname.includes('dev.to') ||
              hostname.includes('hackernoon.com') ||
              url.includes('/blog/') ||
              url.includes('/article/') ||
              url.includes('/post/')) {
            return 'article';
          }
          
          return 'webpage';
        }
      
        getTitle() {
          let title = '';
          
          if (this.getPageType(window.location.href) === 'youtube') {
            const ytTitleSelectors = [
              'h1.ytd-video-primary-info-renderer',
              'h1.title',
              '.watch-main-col h1',
              '#eow-title'
            ];
            
            for (const selector of ytTitleSelectors) {
              const element = document.querySelector(selector);
              if (element && element.textContent.trim()) {
                title = element.textContent.trim();
                break;
              }
            }
          }
          
          if (!title) {
            const h1 = document.querySelector('h1');
            if (h1 && h1.textContent.trim()) {
              title = h1.textContent.trim();
            }
          }
          
          if (!title || title.length < 10) {
            title = document.title;
          }
          
          title = this.cleanTitle(title);
          
          return title;
        }
      
        cleanTitle(title) {
          const suffixes = [
            ' - YouTube',
            ' | Medium',
            ' - Dev.to',
            ' | Hacker News',
            ' - Stack Overflow',
            ' - GitHub'
          ];
          
          for (const suffix of suffixes) {
            if (title.endsWith(suffix)) {
              title = title.slice(0, -suffix.length);
              break;
            }
          }
          
          return title.trim();
        }
      
        async getYouTubeContent() {
          console.log('Attempting to extract YouTube content...');
          
          const transcript = await this.getYouTubeTranscript();
          if (transcript && transcript.length > 50) {
            console.log('Found transcript:', transcript.length, 'characters');
            return transcript;
          }
          
          const description = this.getYouTubeDescription();
          if (description && description.length > 20) {
            console.log('Found description:', description.length, 'characters');
            return description;
          }
          
          console.log('⚠️ Using title as fallback');
          return this.getTitle();
        }
      
        getYouTubeDescription() {
          const descriptionSelectors = [
            '#description-text',
            '.ytd-video-secondary-info-renderer #description',
            '#watch-description-text',
            '.content.style-scope.ytd-video-secondary-info-renderer',
            '#meta-contents #description'
          ];
          
          for (const selector of descriptionSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
              return element.textContent.trim();
            }
          }
          
          return '';
        }
      
        async getYouTubeTranscript() {
          try {
            console.log('Looking for transcript...');
            
            const transcriptButton = this.findTranscriptButton();
            if (transcriptButton) {
              console.log('Found transcript button, clicking...');
              transcriptButton.click();
              
              await this.sleep(2000);
              
              const transcript = this.extractTranscriptText();
              if (transcript) {
                return transcript;
              }
            }
            
            const existingTranscript = this.extractTranscriptText();
            if (existingTranscript) {
              console.log('Found existing transcript');
              return existingTranscript;
            }
            
            console.log('No transcript found');
            return '';
            
          } catch (error) {
            console.log('Transcript extraction error:', error.message);
            return '';
          }
        }
      
        findTranscriptButton() {
          const buttonSelectors = [
            'button[aria-label*="transcript" i]',
            'button[aria-label*="Show transcript" i]',
            'button[title*="transcript" i]',
            '[role="button"]:contains("transcript")',
            '.ytp-menuitem[role="menuitem"]:contains("transcript")'
          ];
          
          for (const selector of buttonSelectors) {
            if (selector.includes(':contains')) {
              const elements = document.querySelectorAll(selector.split(':contains')[0]);
              for (const el of elements) {
                if (el.textContent.toLowerCase().includes('transcript')) {
                  return el;
                }
              }
            } else {
              const element = document.querySelector(selector);
              if (element) return element;
            }
          }
          
          const allButtons = document.querySelectorAll('button, [role="button"]');
          for (const button of allButtons) {
            const text = button.textContent.toLowerCase();
            const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
            if (text.includes('transcript') || ariaLabel.includes('transcript')) {
              return button;
            }
          }
          
          return null;
        }
      
        extractTranscriptText() {
          const transcriptSelectors = [
            '.ytd-transcript-segment-renderer',
            '.transcript-item',
            '[data-testid="transcript-segment"]',
            '.cue-group-start-offset'
          ];
          
          for (const selector of transcriptSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              const transcriptParts = Array.from(elements).map(el => {
                let text = el.textContent.trim();
                text = text.replace(/^\d{1,2}:\d{2}\s*/, '');
                return text;
              }).filter(text => text.length > 0);
              
              if (transcriptParts.length > 0) {
                return transcriptParts.join(' ');
              }
            }
          }
          
          return '';
        }
      
        sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
      
        getArticleContent() {
          const contentSelectors = [
            'article',
            '[role="main"]',
            '.post-content',
            '.entry-content',
            '.article-content',
            '.content',
            'main',
            '#content'
          ];
      
          for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              const content = this.cleanContent(element);
              if (content.length > 100) {
                return content;
              }
            }
          }
      
          return this.cleanContent(document.body);
        }
      
        cleanContent(element) {
          const clone = element.cloneNode(true);
          
          const unwantedSelectors = [
            'script', 'style', 'noscript',
            'nav', 'header', 'footer',
            '.ad', '.ads', '.advertisement',
            '.social-share', '.share-buttons',
            '.comments', '.comment-section',
            '.sidebar', '.widget',
            '.related-posts', '.recommended',
            '.newsletter', '.subscription',
            '[class*="ad-"]', '[id*="ad-"]'
          ];
      
          unwantedSelectors.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });
      
          let content = clone.textContent || '';
          
          content = content
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .trim();
          
          return content;
        }
      
        countWords(text) {
          if (!text) return 0;
          return text.trim().split(/\s+/).filter(word => word.length > 0).length;
        }
      
        calculateQualityScore(wordCount, title, pageType) {
          let score = 1;
          
          if (wordCount > 50) score += 1;
          if (wordCount > 100) score += 1;
          if (wordCount > 300) score += 1;
          if (wordCount > 500) score += 1;
          if (wordCount > 1000) score += 1;
          if (wordCount > 2000) score += 1;
          
          if (title.length > 20 && title.length < 100) score += 1;
          
          if (pageType === 'youtube') {
            if (wordCount > 200) score += 1;
            
            const educationalKeywords = ['tutorial', 'how to', 'explained', 'guide', 'learn'];
            const titleLower = title.toLowerCase();
            if (educationalKeywords.some(keyword => titleLower.includes(keyword))) {
              score += 1;
            }
          }
          
          return Math.min(score, 10);
        }
      
        async extractTranscriptManually() {
          console.log('Manual transcript extraction mode');
          console.log('1. Look for "Show transcript" button and click it');
          console.log('2. Wait a moment, then run: scraper.extractTranscriptText()');
          
          const transcriptElements = document.querySelectorAll('[class*="transcript"], [aria-label*="transcript"]');
          console.log('Found transcript-related elements:', transcriptElements.length);
          
          transcriptElements.forEach((el, i) => {
            console.log(`Element ${i}:`, el.className, el.tagName);
          });
          
          return 'Manual extraction initiated - check console for instructions';
        }
      }

    const scraper = new EnhancedContentScraper();
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractContent') {
            console.log('Received extract content request');
            
            scraper.extractContent()
            .then(content => {
                console.log('Sending extracted content:', content);
                sendResponse({ success: true, content: content });
            })
            .catch(error => {
                console.error('Extraction error:', error);
                sendResponse({ success: false, error: error.message });
            });
            
            return true;
        }
        });
    }
    
    let activeTime = 0;
    let isTabActive = document.visibilityState === 'visible';
    let lastActiveTimestamp = isTabActive ? Date.now() : null;
    const requiredActiveTime = 3 * 60 * 1000; // 3 minutes can use 15 secs for quick testing 
    let hasExtracted = false;
    
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
        isTabActive = true;
        lastActiveTimestamp = Date.now();
        console.log('Tab active again. Resuming timer...');
        } else {
        isTabActive = false;
        if (lastActiveTimestamp) {
            activeTime += Date.now() - lastActiveTimestamp;
            console.log(`Tab inactive. Active time so far: ${Math.floor(activeTime / 1000)} sec`);
        }
        }
    });
    
    window.scraper = scraper;
    
    setInterval(async () => {
        if (isTabActive && !hasExtracted) {
        const now = Date.now();
        if (lastActiveTimestamp) {
            activeTime += now - lastActiveTimestamp;
            lastActiveTimestamp = now;
        }
    
        const seconds = Math.floor(activeTime / 1000);
        console.log(`Active time on page: ${seconds} seconds`);
    
        if (activeTime >= requiredActiveTime) {
            console.log('Required active time reached! Extracting content...');
            const content = await scraper.extractContent();
            if (content) {
            console.log('Content extracted after active time:', content);
            window.extractedContent = content;
            hasExtracted = true;
            }
        }
        }
    }, 10000);
    
    
    (function observeYouTubeNavigation() {
        let lastUrl = location.href;
    
        const observer = new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            console.log('YouTube SPA navigation detected:', currentUrl);
            lastUrl = currentUrl;
    
            activeTime = 0;
            hasExtracted = false;
            lastActiveTimestamp = document.visibilityState === 'visible' ? Date.now() : null;
    
            console.log('Waiting 15s after SPA navigation...');
        }
        });
    
        observer.observe(document.body, {
        childList: true,
        subtree: true,
        });
    
        console.log('YouTube SPA navigation observer activated');
    })(); 
  }
})();