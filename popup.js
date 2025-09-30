
document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

let currentTabs = [];
let currentMode = 'manual';
let currentTheme = 'light';

function initializePopup() {
  setupEventListeners();
  loadModePreference();
  loadThemePreference();
  loadTabs();
}

function setupEventListeners() {
  const cleanupButton = document.getElementById('cleanup-button');
  const cancelButton = document.getElementById('cancel-button');
  const selectAllButton = document.getElementById('select-all');
  const selectNoneButton = document.getElementById('select-none');
  const retryButton = document.getElementById('retry-button');
  const manageWhitelistButton = document.getElementById('manage-whitelist');
  const manageWhitelistMainButton = document.getElementById('manage-whitelist-main');
  const modeInputs = document.querySelectorAll('input[name="mode"]');
  const themeSelect = document.getElementById('theme-select');

  cleanupButton?.addEventListener('click', handleCleanup);
  cancelButton?.addEventListener('click', () => window.close());
  selectAllButton?.addEventListener('click', () => toggleAllTabs(true));
  selectNoneButton?.addEventListener('click', () => toggleAllTabs(false));
  retryButton?.addEventListener('click', loadTabs);
  manageWhitelistButton?.addEventListener('click', openOptionsPage);
  manageWhitelistMainButton?.addEventListener('click', openOptionsPage);

  modeInputs.forEach(input => {
    input.addEventListener('change', handleModeChange);
  });

  themeSelect?.addEventListener('change', handleThemeChange);
}

function loadModePreference() {
  chrome.storage.sync.get(['mode'], (result) => {
    currentMode = result.mode || 'manual';
    const modeInputs = document.querySelectorAll('input[name="mode"]');
    modeInputs.forEach(input => {
      input.checked = input.value === currentMode;
    });
    updateButtonText();
    updateControlsVisibility();
  });
}

function handleModeChange(event) {
  currentMode = event.target.value;
  chrome.storage.sync.set({ mode: currentMode });
  updateButtonText();
  updateControlsVisibility();
}

function updateButtonText() {
  const buttonText = document.getElementById('cleanup-button-text');
  if (currentMode === 'auto') {
    buttonText.textContent = 'Auto Clean';
  } else {
    buttonText.textContent = 'Close Selected Tabs';
  }
}

function updateControlsVisibility() {
  const tabCount = document.querySelector('.tab-count');
  const selectionControls = document.querySelector('.selection-controls');

  if (currentMode === 'auto') {
    if (tabCount) tabCount.style.display = 'none';
    if (selectionControls) selectionControls.style.display = 'none';
  } else {
    if (tabCount) tabCount.style.display = 'block';
    if (selectionControls) selectionControls.style.display = 'flex';
  }
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
  });
}

function handleThemeChange(event) {
  currentTheme = event.target.value;
  chrome.storage.sync.get(['pixelatedAutoTime'], (result) => {
    const pixelatedAutoTime = result.pixelatedAutoTime !== false;
    applyTheme(currentTheme, pixelatedAutoTime);
    chrome.storage.sync.set({ theme: currentTheme });
  });
}

function applyTheme(theme, pixelatedAutoTime = true) {
  if (theme === 'pixelated' && pixelatedAutoTime) {
    const hour = new Date().getHours();
    theme = (hour >= 6 && hour < 18) ? 'pixelated-light' : 'pixelated-dark';
  }
  
  document.documentElement.setAttribute('data-theme', theme);
}

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

function renderTabs(tabs) {
  const tabsList = document.getElementById('tabs-list');
  const totalCountElement = document.getElementById('total-count');

  tabsList.innerHTML = '';
  totalCountElement.textContent = tabs.length;

  tabs.forEach((tab) => {
    const tabElement = createTabElement(tab);
    tabsList.appendChild(tabElement);
  });

  if (currentMode === 'manual') {
    updateSelectedCount();
  }
}

function createTabElement(tab) {
  const tabElement = document.createElement('div');
  tabElement.className = 'tab-item';

  if (currentMode === 'manual') {
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

    const checkbox = tabElement.querySelector('.tab-checkbox');
    checkbox.addEventListener('change', updateSelectedCount);
  } else {
    tabElement.innerHTML = `
      <div class="tab-label">
        <div class="tab-info">
          <img src="${tab.favIconUrl || getFallbackIcon()}"
               alt="" class="tab-favicon">
          <div class="tab-details">
            <div class="tab-title" title="${escapeHtml(tab.title)}">${escapeHtml(truncateText(tab.title, 40))}</div>
            <div class="tab-url" title="${escapeHtml(tab.url)}">${escapeHtml(truncateText(getDisplayUrl(tab.url), 50))}</div>
          </div>
        </div>
      </div>
    `;
  }

  const favicon = tabElement.querySelector('.tab-favicon');
  favicon.addEventListener('error', function() {
    this.src = getFallbackIcon();
  });

  return tabElement;
}

function handleCleanup() {
  if (currentMode === 'auto') {
    handleAutoCleanup();
  } else {
    handleManualCleanup();
  }
}

function handleAutoCleanup() {
  const cleanupButton = document.getElementById('cleanup-button');
  cleanupButton.disabled = true;
  cleanupButton.textContent = 'Cleaning up...';

  chrome.runtime.sendMessage({
    action: "autoCleanup"
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error in auto cleanup:', chrome.runtime.lastError);
      cleanupButton.disabled = false;
      cleanupButton.textContent = 'Auto Clean';
      return;
    }

    if (response && response.success) {
      setTimeout(() => {
        window.close();
      }, 300);
    } else {
      console.error('Auto cleanup failed:', response?.error);
      cleanupButton.disabled = false;
      cleanupButton.textContent = 'Auto Clean';
    }
  });
}

function handleManualCleanup() {
  const checkedBoxes = document.querySelectorAll('.tab-checkbox:checked');
  const tabIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

  if (tabIds.length === 0) {
    return;
  }

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
      window.close();
    } else {
      console.error('Failed to close tabs:', response?.error);
      cleanupButton.disabled = false;
      cleanupButton.textContent = 'Close Selected Tabs';
    }
  });
}

function toggleAllTabs(selected) {
  const checkboxes = document.querySelectorAll('.tab-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = selected;
  });
  updateSelectedCount();
}

function updateSelectedCount() {
  const checkedBoxes = document.querySelectorAll('.tab-checkbox:checked');
  const selectedCountElement = document.getElementById('selected-count');
  selectedCountElement.textContent = checkedBoxes.length;
  
  const cleanupButton = document.getElementById('cleanup-button');
  cleanupButton.disabled = checkedBoxes.length === 0;
}

function openOptionsPage() {
  chrome.runtime.openOptionsPage();
  window.close();
}

function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('content').classList.add('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('error-state').classList.add('hidden');
}

function showContent() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.remove('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('error-state').classList.add('hidden');
}

function showEmptyState() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.add('hidden');
  document.getElementById('empty-state').classList.remove('hidden');
  document.getElementById('error-state').classList.add('hidden');
}

function showError(message) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.add('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect width="16" height="16" fill="#ccc" rx="2"/>
    <path d="M4 6h8v1H4zm0 2h8v1H4zm0 2h6v1H4z" fill="#999"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

