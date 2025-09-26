// Background script for Meeting Prep Chrome extension
// Handles tab filtering and closing operations

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTabsForClosure") {
    getTabsForClosure(sendResponse);
    return true; // Keep the messaging channel open for async response
  }
  
  if (request.action === "closeTabs") {
    closeTabs(request.tabIds, sendResponse);
    return true;
  }
});

/**
 * Get tabs that should be closed based on whitelist
 */
async function getTabsForClosure(sendResponse) {
  try {
    // Get whitelist from storage
    const result = await chrome.storage.sync.get(['whitelist']);
    const whitelist = result.whitelist || [];
    
    // Get all open tabs
    const tabs = await chrome.tabs.query({});
    
    // Filter tabs that should be closed
    const tabsToClose = tabs.filter(tab => {
      if (!tab.url) return false;
      
      try {
        const tabHostname = new URL(tab.url).hostname;
        
        // Check if tab's hostname is in whitelist
        const isWhitelisted = whitelist.some(whitelistUrl => {
          try {
            const whitelistHostname = new URL(whitelistUrl.startsWith('http') ? whitelistUrl : `https://${whitelistUrl}`).hostname;
            return tabHostname === whitelistHostname || tabHostname.endsWith(`.${whitelistHostname}`);
          } catch (e) {
            // If whitelist entry is just a hostname, compare directly
            return tabHostname === whitelistUrl || tabHostname.endsWith(`.${whitelistUrl}`);
          }
        });
        
        return !isWhitelisted;
      } catch (e) {
        // Skip tabs with invalid URLs (chrome://, extension://, etc.)
        return false;
      }
    });
    
    // Return tab data needed for UI
    const tabData = tabsToClose.map(tab => ({
      id: tab.id,
      title: tab.title || 'Untitled',
      url: tab.url,
      favIconUrl: tab.favIconUrl || null
    }));
    
    sendResponse({ success: true, tabs: tabData });
    
  } catch (error) {
    console.error('Error getting tabs for closure:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Close specified tabs
 */
async function closeTabs(tabIds, sendResponse) {
  try {
    if (!Array.isArray(tabIds) || tabIds.length === 0) {
      sendResponse({ success: false, error: 'No tabs to close' });
      return;
    }
    
    // Filter out any invalid tab IDs
    const validTabIds = tabIds.filter(id => typeof id === 'number' && id > 0);
    
    if (validTabIds.length === 0) {
      sendResponse({ success: false, error: 'No valid tab IDs provided' });
      return;
    }
    
    // Close the tabs
    await chrome.tabs.remove(validTabIds);
    
    sendResponse({ success: true, closedCount: validTabIds.length });
    
  } catch (error) {
    console.error('Error closing tabs:', error);
    sendResponse({ success: false, error: error.message });
  }
}

