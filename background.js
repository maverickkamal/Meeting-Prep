

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTabsForClosure") {
    getTabsForClosure(sendResponse);
    return true; 
  }

  if (request.action === "closeTabs") {
    closeTabs(request.tabIds, sendResponse);
    return true;
  }

  if (request.action === "autoCleanup") {
    autoCleanup(sendResponse);
    return true;
  }
});


async function getTabsForClosure(sendResponse) {
  try {
    const result = await chrome.storage.sync.get(['whitelist']);
    const whitelist = result.whitelist || [];
    
    const tabs = await chrome.tabs.query({});
    
    const tabsToClose = tabs.filter(tab => {
      if (!tab.url) return false;
      
      try {
        const tabHostname = new URL(tab.url).hostname;
        
        const isWhitelisted = whitelist.some(whitelistUrl => {
          try {
            const whitelistHostname = new URL(whitelistUrl.startsWith('http') ? whitelistUrl : `https://${whitelistUrl}`).hostname;
            return tabHostname === whitelistHostname || tabHostname.endsWith(`.${whitelistHostname}`);
          } catch (e) {
            return tabHostname === whitelistUrl || tabHostname.endsWith(`.${whitelistUrl}`);
          }
        });
        
        return !isWhitelisted;
      } catch (e) {
        return false;
      }
    });
    
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


async function closeTabs(tabIds, sendResponse) {
  try {
    if (!Array.isArray(tabIds) || tabIds.length === 0) {
      sendResponse({ success: false, error: 'No tabs to close' });
      return;
    }
    
    const validTabIds = tabIds.filter(id => typeof id === 'number' && id > 0);
    
    if (validTabIds.length === 0) {
      sendResponse({ success: false, error: 'No valid tab IDs provided' });
      return;
    }
    
    await chrome.tabs.remove(validTabIds);
    
    sendResponse({ success: true, closedCount: validTabIds.length });
    
  } catch (error) {
    console.error('Error closing tabs:', error);
    sendResponse({ success: false, error: error.message });
  }
}


async function autoCleanup(sendResponse) {
  try {
    const result = await chrome.storage.sync.get(['whitelist']);
    const whitelist = result.whitelist || [];

    const tabs = await chrome.tabs.query({});

    const tabsToClose = tabs.filter(tab => {
      if (!tab.url) return false;

      try {
        const tabHostname = new URL(tab.url).hostname;

        const isWhitelisted = whitelist.some(whitelistUrl => {
          try {
            const whitelistHostname = new URL(whitelistUrl.startsWith('http') ? whitelistUrl : `https://${whitelistUrl}`).hostname;
            return tabHostname === whitelistHostname || tabHostname.endsWith(`.${whitelistHostname}`);
          } catch (e) {
            return tabHostname === whitelistUrl || tabHostname.endsWith(`.${whitelistUrl}`);
          }
        });

        return !isWhitelisted;
      } catch (e) {
        return false;
      }
    });

    if (tabsToClose.length === 0) {
      sendResponse({ success: true, closedCount: 0 });
      return;
    }

    const tabIds = tabsToClose.map(tab => tab.id);
    await chrome.tabs.remove(tabIds);

    sendResponse({ success: true, closedCount: tabIds.length });

  } catch (error) {
    console.error('Error in auto cleanup:', error);
    sendResponse({ success: false, error: error.message });
  }
}

