document.addEventListener('DOMContentLoaded', () => {
  initializeOptions();
});

let currentWhitelist = [];
let currentTheme = 'light';


function initializeOptions() {
  setupEventListeners();
  loadThemePreference();
  loadWhitelist();
}


function setupEventListeners() {
  const addButton = document.getElementById('add-button');
  const urlInput = document.getElementById('url-input');
  const clearAllButton = document.getElementById('clear-all');
  const notificationClose = document.getElementById('notification-close');
  const themeSelect = document.getElementById('theme-select');
  const pixelatedAutoTime = document.getElementById('pixelated-auto-time');
  const pixelatedDay = document.getElementById('pixelated-day');
  const pixelatedNight = document.getElementById('pixelated-night');

  addButton.addEventListener('click', handleAddUrl);
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddUrl();
    }
  });
  clearAllButton.addEventListener('click', handleClearAll);
  notificationClose.addEventListener('click', hideNotification);
  themeSelect?.addEventListener('change', handleThemeChange);
  
  pixelatedAutoTime?.addEventListener('change', handlePixelatedAutoTimeChange);
  pixelatedDay?.addEventListener('click', () => setPixelatedMode('light'));
  pixelatedNight?.addEventListener('click', () => setPixelatedMode('dark'));


  urlInput.focus();
}

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

  const removeButton = listItem.querySelector('.remove-button');
  removeButton.addEventListener('click', () => handleRemoveUrl(index));
  
  return listItem;
}


async function handleAddUrl() {
  const urlInput = document.getElementById('url-input');
  const addButton = document.getElementById('add-button');
  const rawUrl = urlInput.value.trim();
  
  if (!rawUrl) {
    showNotification('Please enter a URL or domain name', 'error');
    urlInput.focus();
    return;
  }
  
  const normalizedUrl = normalizeUrl(rawUrl);
  
  if (!isValidUrl(normalizedUrl)) {
    showNotification('Please enter a valid URL or domain name', 'error');
    urlInput.focus();
    return;
  }
  
  if (currentWhitelist.includes(normalizedUrl)) {
    showNotification('This URL is already in your whitelist', 'warning');
    urlInput.value = '';
    urlInput.focus();
    return;
  }
  
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
    currentWhitelist.pop();
    showNotification('Failed to add URL to whitelist', 'error');
    
  } finally {
    addButton.disabled = false;
    addButton.textContent = 'Add to Whitelist';
    urlInput.focus();
  }
}


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
    currentWhitelist.splice(index, 0, urlToRemove);
    showNotification('Failed to remove URL from whitelist', 'error');
  }
}


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


function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const messageElement = document.getElementById('notification-message');
  
  notification.className = `notification notification-${type}`;
  messageElement.textContent = message;
  notification.classList.remove('hidden');
  
  if (type === 'success') {
    setTimeout(() => {
      hideNotification();
    }, 5000);
  }
}


function hideNotification() {
  const notification = document.getElementById('notification');
  notification.classList.add('hidden');
}


function showLoadingWhitelist() {
  document.getElementById('loading-whitelist').classList.remove('hidden');
  document.getElementById('whitelist-list').classList.add('hidden');
  document.getElementById('empty-whitelist').classList.add('hidden');
}


function normalizeUrl(url) {
  let normalized = url.replace(/^https?:\/\//, '');
  
  normalized = normalized.replace(/^www\./, '');
  
  normalized = normalized.split('/')[0];
  
  normalized = normalized.split(':')[0];
  
  return normalized.toLowerCase();
}

function isValidUrl(url) {
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


function loadThemePreference() {
  chrome.storage.sync.get(['theme', 'pixelatedAutoTime'], (result) => {
    currentTheme = result.theme || 'light';
    const pixelatedAutoTime = result.pixelatedAutoTime !== false;
    
    applyTheme(currentTheme, pixelatedAutoTime);
    
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = currentTheme === 'pixelated-light' || currentTheme === 'pixelated-dark' ? 'pixelated' : currentTheme;
    }
    
    updatePixelatedControls();
  });
}


function handleThemeChange(event) {
  currentTheme = event.target.value;
  chrome.storage.sync.get(['pixelatedAutoTime'], (result) => {
    const pixelatedAutoTime = result.pixelatedAutoTime !== false;
    applyTheme(currentTheme, pixelatedAutoTime);
    chrome.storage.sync.set({ theme: currentTheme });
    updatePixelatedControls();
  });
}


function applyTheme(theme, pixelatedAutoTime = true) {
  if (theme === 'pixelated' && pixelatedAutoTime) {
    const hour = new Date().getHours();
    theme = (hour >= 6 && hour < 18) ? 'pixelated-light' : 'pixelated-dark';
  }
  
  document.documentElement.setAttribute('data-theme', theme);
}

function updatePixelatedControls() {
  const pixelatedControls = document.getElementById('pixelated-controls');
  const manualTimeControl = document.getElementById('manual-time-control');
  const pixelatedAutoTimeCheckbox = document.getElementById('pixelated-auto-time');
  
  if (pixelatedControls) {
    const isPixelated = currentTheme === 'pixelated' || currentTheme === 'pixelated-light' || currentTheme === 'pixelated-dark';
    pixelatedControls.style.display = isPixelated ? 'block' : 'none';
    
    if (isPixelated) {
      chrome.storage.sync.get(['pixelatedAutoTime'], (result) => {
        const autoTime = result.pixelatedAutoTime !== false;
        if (pixelatedAutoTimeCheckbox) {
          pixelatedAutoTimeCheckbox.checked = autoTime;
        }
        if (manualTimeControl) {
          manualTimeControl.style.display = autoTime ? 'none' : 'flex';
        }
      });
    }
  }
}

function handlePixelatedAutoTimeChange(event) {
  const autoTime = event.target.checked;
  chrome.storage.sync.set({ pixelatedAutoTime: autoTime });
  
  const manualTimeControl = document.getElementById('manual-time-control');
  if (manualTimeControl) {
    manualTimeControl.style.display = autoTime ? 'none' : 'flex';
  }
  
  chrome.storage.sync.get(['theme'], (result) => {
    applyTheme(result.theme || 'light', autoTime);
  });
}

function setPixelatedMode(mode) {
  const theme = mode === 'light' ? 'pixelated-light' : 'pixelated-dark';
  applyTheme(theme, false);
  chrome.storage.sync.set({ theme: 'pixelated', pixelatedAutoTime: false });
}

