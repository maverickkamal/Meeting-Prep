// Options script for Meeting Prep Chrome extension
// Handles whitelist management functionality

document.addEventListener('DOMContentLoaded', () => {
  initializeOptions();
});

let currentWhitelist = [];

/**
 * Initialize the options page
 */
function initializeOptions() {
  setupEventListeners();
  loadWhitelist();
}

/**
 * Set up event listeners for UI controls
 */
function setupEventListeners() {
  const addButton = document.getElementById('add-button');
  const urlInput = document.getElementById('url-input');
  const clearAllButton = document.getElementById('clear-all');
  const notificationClose = document.getElementById('notification-close');
  
  addButton.addEventListener('click', handleAddUrl);
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddUrl();
    }
  });
  clearAllButton.addEventListener('click', handleClearAll);
  notificationClose.addEventListener('click', hideNotification);
  
  // Auto-focus the input field
  urlInput.focus();
}

/**
 * Load whitelist from storage
 */
async function loadWhitelist() {
  try {
    showLoadingWhitelist();
    
    const result = await chrome.storage.sync.get(['whitelist']);
    currentWhitelist = result.whitelist || [];
    
    renderWhitelist();
    
  } catch (error) {
    console.error('Error loading whitelist:', error);
    showNotification('Failed to load whitelist', 'error');
  }
}

/**
 * Render the whitelist in the UI
 */
function renderWhitelist() {
  const whitelistList = document.getElementById('whitelist-list');
  const emptyState = document.getElementById('empty-whitelist');
  const loadingState = document.getElementById('loading-whitelist');
  
  loadingState.classList.add('hidden');
  
  if (currentWhitelist.length === 0) {
    whitelistList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  whitelistList.classList.remove('hidden');
  
  whitelistList.innerHTML = '';
  
  currentWhitelist.forEach((url, index) => {
    const listItem = createWhitelistItem(url, index);
    whitelistList.appendChild(listItem);
  });
}

/**
 * Create a whitelist item element
 */
function createWhitelistItem(url, index) {
  const listItem = document.createElement('li');
  listItem.className = 'whitelist-item';
  listItem.innerHTML = `
    <div class="whitelist-content">
      <div class="url-display">
        <span class="url-text" title="${escapeHtml(url)}">${escapeHtml(url)}</span>
        <span class="url-type">${getUrlType(url)}</span>
      </div>
      <button class="btn btn-danger btn-small remove-button" data-index="${index}">
        Remove
      </button>
    </div>
  `;
  
  // Add event listener for remove button
  const removeButton = listItem.querySelector('.remove-button');
  removeButton.addEventListener('click', () => handleRemoveUrl(index));
  
  return listItem;
}

/**
 * Handle adding a new URL to whitelist
 */
async function handleAddUrl() {
  const urlInput = document.getElementById('url-input');
  const addButton = document.getElementById('add-button');
  const rawUrl = urlInput.value.trim();
  
  if (!rawUrl) {
    showNotification('Please enter a URL or domain name', 'error');
    urlInput.focus();
    return;
  }
  
  // Normalize the URL
  const normalizedUrl = normalizeUrl(rawUrl);
  
  if (!isValidUrl(normalizedUrl)) {
    showNotification('Please enter a valid URL or domain name', 'error');
    urlInput.focus();
    return;
  }
  
  // Check for duplicates
  if (currentWhitelist.includes(normalizedUrl)) {
    showNotification('This URL is already in your whitelist', 'warning');
    urlInput.value = '';
    urlInput.focus();
    return;
  }
  
  // Add to whitelist
  try {
    addButton.disabled = true;
    addButton.textContent = 'Adding...';
    
    currentWhitelist.push(normalizedUrl);
    await saveWhitelist();
    
    urlInput.value = '';
    renderWhitelist();
    showNotification('Added to whitelist successfully', 'success');
    
  } catch (error) {
    console.error('Error adding URL:', error);
    currentWhitelist.pop(); // Remove the failed addition
    showNotification('Failed to add URL to whitelist', 'error');
    
  } finally {
    addButton.disabled = false;
    addButton.textContent = 'Add to Whitelist';
    urlInput.focus();
  }
}

/**
 * Handle removing a URL from whitelist
 */
async function handleRemoveUrl(index) {
  if (index < 0 || index >= currentWhitelist.length) {
    return;
  }
  
  const urlToRemove = currentWhitelist[index];
  
  try {
    currentWhitelist.splice(index, 1);
    await saveWhitelist();
    
    renderWhitelist();
    showNotification(`Removed "${urlToRemove}" from whitelist`, 'success');
    
  } catch (error) {
    console.error('Error removing URL:', error);
    // Restore the removed item
    currentWhitelist.splice(index, 0, urlToRemove);
    showNotification('Failed to remove URL from whitelist', 'error');
  }
}

/**
 * Handle clearing all URLs from whitelist
 */
async function handleClearAll() {
  if (currentWhitelist.length === 0) {
    return;
  }
  
  const confirmMessage = `Are you sure you want to remove all ${currentWhitelist.length} websites from your whitelist?`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  const backup = [...currentWhitelist];
  
  try {
    currentWhitelist = [];
    await saveWhitelist();
    
    renderWhitelist();
    showNotification('Cleared all websites from whitelist', 'success');
    
  } catch (error) {
    console.error('Error clearing whitelist:', error);
    currentWhitelist = backup;
    showNotification('Failed to clear whitelist', 'error');
  }
}

/**
 * Save whitelist to storage
 */
async function saveWhitelist() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ whitelist: currentWhitelist }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const messageElement = document.getElementById('notification-message');
  
  notification.className = `notification notification-${type}`;
  messageElement.textContent = message;
  notification.classList.remove('hidden');
  
  // Auto-hide after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      hideNotification();
    }, 5000);
  }
}

/**
 * Hide notification
 */
function hideNotification() {
  const notification = document.getElementById('notification');
  notification.classList.add('hidden');
}

/**
 * Show loading state for whitelist
 */
function showLoadingWhitelist() {
  document.getElementById('loading-whitelist').classList.remove('hidden');
  document.getElementById('whitelist-list').classList.add('hidden');
  document.getElementById('empty-whitelist').classList.add('hidden');
}

/**
 * Utility functions
 */
function normalizeUrl(url) {
  // Remove protocol if present
  let normalized = url.replace(/^https?:\/\//, '');
  
  // Remove www. prefix
  normalized = normalized.replace(/^www\./, '');
  
  // Remove trailing slash and path
  normalized = normalized.split('/')[0];
  
  // Remove port numbers
  normalized = normalized.split(':')[0];
  
  return normalized.toLowerCase();
}

function isValidUrl(url) {
  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(url) && url.includes('.');
}

function getUrlType(url) {
  if (url.includes('google.com')) return 'Google';
  if (url.includes('microsoft.com') || url.includes('outlook.')) return 'Microsoft';
  if (url.includes('slack.com')) return 'Slack';
  if (url.includes('notion.so')) return 'Notion';
  if (url.includes('github.com')) return 'GitHub';
  if (url.includes('gmail.com')) return 'Gmail';
  if (url.includes('calendar.google.com')) return 'Calendar';
  return 'Website';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

