class EnhancedContentScraper {
    constructor() {
      console.log('Enhanced Content Scraper with YouTube transcript support initialized');
    }
  
    // Main function - extracts content from current page
    async extractContent() {
      const url = window.location.href;
      const pageType = this.getPageType(url);
      
      console.log(`Extracting from: ${pageType} | ${url}`);
  
      // Get basic page data
      const title = this.getTitle();
      let content = '';
      
      if (pageType === 'youtube') {
        content = await this.getYouTubeContent();
      } else {
        content = this.getArticleContent();
      }
      
      const wordCount = this.countWords(content);
      
      // For YouTube, lower the minimum word threshold since transcripts can be valuable even if shorter
      const minWords = pageType === 'youtube' ? 20 : 50;
      
      if (wordCount < minWords) {
        console.log(`Content too short (${wordCount} words), skipping...`);
        return null;
      }
  
      // Create result object
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
  
      return result;
    }
  
    // Determine what type of page this is
    getPageType(url) {
      const hostname = new URL(url).hostname.toLowerCase();
      
      // YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return 'youtube';
      }
      
      // Common article sites
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
  
    // Get page title
    getTitle() {
      let title = '';
      
      // For YouTube, try video title first
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
      
      // Try main heading (h1)
      if (!title) {
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent.trim()) {
          title = h1.textContent.trim();
        }
      }
      
      // Try page title if h1 is empty or too short
      if (!title || title.length < 10) {
        title = document.title;
      }
      
      // Clean up title (remove site name)
      title = this.cleanTitle(title);
      
      return title;
    }
  
    // Clean title by removing common suffixes
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
  
    // Enhanced YouTube content extraction with transcript support
    async getYouTubeContent() {
      console.log('Attempting to extract YouTube content...');
      
      // Try to get transcript first (most valuable)
      const transcript = await this.getYouTubeTranscript();
      if (transcript && transcript.length > 50) {
        console.log('✅ Found transcript:', transcript.length, 'characters');
        return transcript;
      }
      
      // Fallback to description
      const description = this.getYouTubeDescription();
      if (description && description.length > 20) {
        console.log('✅ Found description:', description.length, 'characters');
        return description;
      }
      
      // Last fallback to title
      console.log('⚠️ Using title as fallback');
      return this.getTitle();
    }
  
    // Get YouTube video description
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
  
    // Get YouTube transcript
    async getYouTubeTranscript() {
      try {
        console.log('🔍 Looking for transcript...');
        
        // Method 1: Try to find transcript button and click it
        const transcriptButton = this.findTranscriptButton();
        if (transcriptButton) {
          console.log('📝 Found transcript button, clicking...');
          transcriptButton.click();
          
          // Wait for transcript to load
          await this.sleep(2000);
          
          const transcript = this.extractTranscriptText();
          if (transcript) {
            return transcript;
          }
        }
        
        // Method 2: Look for already opened transcript
        const existingTranscript = this.extractTranscriptText();
        if (existingTranscript) {
          console.log('📝 Found existing transcript');
          return existingTranscript;
        }
        
        console.log('❌ No transcript found');
        return '';
        
      } catch (error) {
        console.log('❌ Transcript extraction error:', error.message);
        return '';
      }
    }
  
    // Find transcript button
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
          // Handle pseudo-selector manually
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
      
      // Look for buttons with transcript-related text
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
  
    // Extract transcript text from transcript panel
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
            // Remove timestamps and clean text
            let text = el.textContent.trim();
            // Remove timestamp patterns like "0:00", "1:23", etc.
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
  
    // Sleep utility
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    // Get article content (unchanged from original)
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
  
    // Clean content by removing unwanted elements
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
  
    // Count words in text
    countWords(text) {
      if (!text) return 0;
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
  
    // Enhanced quality scoring with YouTube support
    calculateQualityScore(wordCount, title, pageType) {
      let score = 1;
      
      // Base scoring for word count
      if (wordCount > 50) score += 1;   // Lower threshold for YouTube
      if (wordCount > 100) score += 1;
      if (wordCount > 300) score += 1;
      if (wordCount > 500) score += 1;
      if (wordCount > 1000) score += 1;
      if (wordCount > 2000) score += 1;
      
      // Bonus for good title length
      if (title.length > 20 && title.length < 100) score += 1;
      
      // YouTube-specific bonuses
      if (pageType === 'youtube') {
        // Bonus for having transcript vs just description
        if (wordCount > 200) score += 1; // Likely has transcript
        
        // Educational content indicators
        const educationalKeywords = ['tutorial', 'how to', 'explained', 'guide', 'learn'];
        const titleLower = title.toLowerCase();
        if (educationalKeywords.some(keyword => titleLower.includes(keyword))) {
          score += 1;
        }
      }
      
      return Math.min(score, 10);
    }
  
    // Manual transcript extraction helper
    async extractTranscriptManually() {
      console.log('🔧 Manual transcript extraction mode');
      console.log('1. Look for "Show transcript" button and click it');
      console.log('2. Wait a moment, then run: scraper.extractTranscriptText()');
      
      // Look for transcript UI elements
      const transcriptElements = document.querySelectorAll('[class*="transcript"], [aria-label*="transcript"]');
      console.log('Found transcript-related elements:', transcriptElements.length);
      
      transcriptElements.forEach((el, i) => {
        console.log(`Element ${i}:`, el.className, el.tagName);
      });
      
      return 'Manual extraction initiated - check console for instructions';
    }
  }
  
  // Initialize enhanced scraper
  const scraper = new EnhancedContentScraper();
  
  // Extension message listener (only runs in extension context)
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
  
  // Auto-extract content when page loads

    (async () => {
        console.log('Auto-extracting content in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        const content = await scraper.extractContent();
        if (content) {
        console.log('Auto-extracted content:', content);
        window.extractedContent = content;
        }
    })();
  
  
  // Make scraper available globally
  window.scraper = scraper;

  // SPA handling using MutationObserver (YouTube specific)
(function observeYouTubeNavigation() {
  let lastUrl = location.href;

  const observer = new MutationObserver(async () => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      // Wait briefly to allow content to load
      console.log('🔄 Detected YouTube SPA navigation. Waiting for content to load...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const content = await scraper.extractContent();
      if (content) {
        console.log('🔄 Re-extracted content after navigation:', content);
        window.extractedContent = content;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('🎯 YouTube SPA navigation observer activated');
})();
