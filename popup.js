// Popup script for Meeting Prep Chrome extension
// Handles UI interactions and communication with background script

document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

let currentTabs = [];

/**
 * Initialize the popup
 */
function initializePopup() {
  setupEventListeners();
  loadTabs();
}

/**
 * Set up event listeners for UI controls
 */
function setupEventListeners() {
  const cleanupButton = document.getElementById('cleanup-button');
  const cancelButton = document.getElementById('cancel-button');
  const selectAllButton = document.getElementById('select-all');
  const selectNoneButton = document.getElementById('select-none');
  const retryButton = document.getElementById('retry-button');
  const manageWhitelistButton = document.getElementById('manage-whitelist');
  const manageWhitelistMainButton = document.getElementById('manage-whitelist-main');
  
  cleanupButton?.addEventListener('click', handleCleanup);
  cancelButton?.addEventListener('click', () => window.close());
  selectAllButton?.addEventListener('click', () => toggleAllTabs(true));
  selectNoneButton?.addEventListener('click', () => toggleAllTabs(false));
  retryButton?.addEventListener('click', loadTabs);
  manageWhitelistButton?.addEventListener('click', openOptionsPage);
  manageWhitelistMainButton?.addEventListener('click', openOptionsPage);
}

/**
 * Load tabs from background script
 */
function loadTabs() {
  showLoading();
  
  chrome.runtime.sendMessage({ action: "getTabsForClosure" }, (response) => {
    if (chrome.runtime.lastError) {
      showError('Failed to communicate with extension background script');
      return;
    }
    
    if (!response || !response.success) {
      showError(response?.error || 'Failed to load tabs');
      return;
    }
    
    currentTabs = response.tabs || [];
    
    if (currentTabs.length === 0) {
      showEmptyState();
    } else {
      renderTabs(currentTabs);
      showContent();
    }
  });
}

/**
 * Render tabs in the UI
 */
function renderTabs(tabs) {
  const tabsList = document.getElementById('tabs-list');
  const totalCountElement = document.getElementById('total-count');
  
  tabsList.innerHTML = '';
  totalCountElement.textContent = tabs.length;
  
  tabs.forEach((tab) => {
    const tabElement = createTabElement(tab);
    tabsList.appendChild(tabElement);
  });
  
  updateSelectedCount();
}

/**
 * Create a tab element
 */
function createTabElement(tab) {
  const tabElement = document.createElement('div');
  tabElement.className = 'tab-item';
  tabElement.innerHTML = `
    <label class="tab-label">
      <input type="checkbox" value="${tab.id}" checked class="tab-checkbox">
      <div class="tab-info">
        <img src="${tab.favIconUrl || getFallbackIcon()}" 
             alt="" class="tab-favicon">
        <div class="tab-details">
          <div class="tab-title" title="${escapeHtml(tab.title)}">${escapeHtml(truncateText(tab.title, 40))}</div>
          <div class="tab-url" title="${escapeHtml(tab.url)}">${escapeHtml(truncateText(getDisplayUrl(tab.url), 50))}</div>
        </div>
      </div>
    </label>
  `;
  
  // Add event listener for checkbox changes
  const checkbox = tabElement.querySelector('.tab-checkbox');
  checkbox.addEventListener('change', updateSelectedCount);
  
  // Add error handler for favicon
  const favicon = tabElement.querySelector('.tab-favicon');
  favicon.addEventListener('error', function() {
    this.src = getFallbackIcon();
  });
  
  return tabElement;
}

/**
 * Handle cleanup button click
 */
function handleCleanup() {
  const checkedBoxes = document.querySelectorAll('.tab-checkbox:checked');
  const tabIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
  
  if (tabIds.length === 0) {
    return;
  }
  
  // Disable button and show loading state
  const cleanupButton = document.getElementById('cleanup-button');
  cleanupButton.disabled = true;
  cleanupButton.textContent = 'Closing tabs...';
  
  chrome.runtime.sendMessage({ 
    action: "closeTabs", 
    tabIds: tabIds 
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error closing tabs:', chrome.runtime.lastError);
      cleanupButton.disabled = false;
      cleanupButton.textContent = 'Close Selected Tabs';
      return;
    }
    
    if (response && response.success) {
      // Close the popup after successful cleanup
      window.close();
    } else {
      console.error('Failed to close tabs:', response?.error);
      cleanupButton.disabled = false;
      cleanupButton.textContent = 'Close Selected Tabs';
    }
  });
}

/**
 * Toggle all tabs selection
 */
function toggleAllTabs(selected) {
  const checkboxes = document.querySelectorAll('.tab-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = selected;
  });
  updateSelectedCount();
}

/**
 * Update selected tabs count
 */
function updateSelectedCount() {
  const checkedBoxes = document.querySelectorAll('.tab-checkbox:checked');
  const selectedCountElement = document.getElementById('selected-count');
  selectedCountElement.textContent = checkedBoxes.length;
  
  // Update cleanup button state
  const cleanupButton = document.getElementById('cleanup-button');
  cleanupButton.disabled = checkedBoxes.length === 0;
}

/**
 * Open options page
 */
function openOptionsPage() {
  chrome.runtime.openOptionsPage();
  window.close();
}

/**
 * Show loading state
 */
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('content').classList.add('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('error-state').classList.add('hidden');
}

/**
 * Show main content
 */
function showContent() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.remove('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('error-state').classList.add('hidden');
}

/**
 * Show empty state
 */
function showEmptyState() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.add('hidden');
  document.getElementById('empty-state').classList.remove('hidden');
  document.getElementById('error-state').classList.add('hidden');
}

/**
 * Show error state
 */
function showError(message) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.add('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

/**
 * Utility functions
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function getDisplayUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch (e) {
    return url;
  }
}

function getFallbackIcon() {
  // Create a simple gray square icon as base64 encoded SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect width="16" height="16" fill="#ccc" rx="2"/>
    <path d="M4 6h8v1H4zm0 2h8v1H4zm0 2h6v1H4z" fill="#999"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

