// Initialize
let recentLogs = [];
let settings = {};
let undoStack = [];

// Load theme
const theme = localStorage.getItem('theme') || 'light';
document.body.className = theme;

// Update current time
function updateCurrentTime() {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleString();
}
updateCurrentTime();
setInterval(updateCurrentTime, 1000);

// Load settings and recent logs
chrome.storage.local.get(['logs', 'settings', 'categories', 'templates'], (result) => {
  recentLogs = result.logs || [];
  settings = result.settings || {};
  
  displayRecentLogs();
  updateTimeSinceLastLog();
  loadCategories(result.categories);
  loadTemplates(result.templates);
});

// Display recent logs (last 3)
function displayRecentLogs() {
  const container = document.getElementById('recentLogsList');
  const recent = recentLogs.slice(0, 3);
  
  if (recent.length === 0) {
    container.innerHTML = '<p class="no-logs">No recent logs</p>';
    return;
  }
  
  container.innerHTML = recent.map((log, index) => `
    <div class="mini-log-entry">
      <div class="log-header">
        <span class="category-badge">${log.category || 'Other'}</span>
        <span class="log-time">${formatTimeAgo(log.time)}</span>
      </div>
      <p class="log-text">${truncate(log.text, 60)}</p>
    </div>
  `).join('');
}

// Update time since last log
function updateTimeSinceLastLog() {
  const container = document.getElementById('timeSinceLastLog');
  if (recentLogs.length > 0) {
    const lastLog = new Date(recentLogs[0].time);
    const now = new Date();
    const diff = Math.floor((now - lastLog) / 1000 / 60); // minutes
    
    if (diff < 60) {
      container.textContent = `Last log: ${diff} min ago`;
    } else {
      const hours = Math.floor(diff / 60);
      container.textContent = `Last log: ${hours}h ${diff % 60}m ago`;
    }
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// Load categories
function loadCategories(customCategories) {
  if (customCategories && customCategories.length > 0) {
    const select = document.getElementById('categorySelect');
    select.innerHTML = customCategories.map(cat => 
      `<option value="${cat.name}">${cat.emoji} ${cat.name}</option>`
    ).join('');
  }
}

// Load templates
function loadTemplates(templates) {
  const container = document.getElementById('templateButtons');
  if (templates && templates.length > 0) {
    container.innerHTML = templates.map(tmpl => 
      `<button class="template-btn" data-text="${tmpl.text}">${tmpl.name}</button>`
    ).join('');
    
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('logInput').value = btn.dataset.text;
        document.getElementById('logInput').focus();
      });
    });
  } else {
    // Default templates
    const defaultTemplates = [
      { name: 'Dev', text: 'Development work on ' },
      { name: 'Meeting', text: 'Meeting about ' },
      { name: 'Learning', text: 'Learned about ' }
    ];
    container.innerHTML = defaultTemplates.map(tmpl => 
      `<button class="template-btn" data-text="${tmpl.text}">${tmpl.name}</button>`
    ).join('');
    
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('logInput').value = btn.dataset.text;
        document.getElementById('logInput').focus();
      });
    });
  }
}

// Save log
document.getElementById('saveLog').addEventListener('click', saveLog);

function saveLog() {
  const input = document.getElementById('logInput').value.trim();
  if (!input) {
    showToast('Please enter something before saving.', 'error');
    return;
  }

  if (input.length > 500) {
    showToast('Log is too long. Please keep it under 500 characters.', 'error');
    return;
  }

  const timestamp = new Date().toISOString();
  const category = document.getElementById('categorySelect').value;
  
  const logEntry = { 
    text: input, 
    time: timestamp,
    category: category,
    id: Date.now()
  };

  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];
    logs.unshift(logEntry);
    
    chrome.storage.local.set({ logs }, () => {
      showToast('✓ Log saved successfully!', 'success');
      document.getElementById('logInput').value = '';
      
      // Update recent logs display
      recentLogs = logs;
      displayRecentLogs();
      updateTimeSinceLastLog();
      
      setTimeout(() => {
        window.close();
      }, 800);
    });
  });
}

// Keyboard shortcuts
document.getElementById('logInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    saveLog();
  } else if (e.key === 'Escape') {
    window.close();
  }
});

// View summary
document.getElementById('viewSummary').addEventListener('click', () => {
  chrome.tabs.create({ url: 'summary.html' });
});

// Toggle theme
document.getElementById('toggleTheme').addEventListener('click', () => {
  const currentTheme = document.body.className;
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.className = newTheme;
  localStorage.setItem('theme', newTheme);
});

// Manage categories
document.getElementById('manageCategories').addEventListener('click', () => {
  chrome.tabs.create({ url: 'settings.html' });
});

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('statusToast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// Helper functions
function formatTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000 / 60);
  
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return time.toLocaleDateString();
}

function truncate(text, length) {
  return text.length > length ? text.substring(0, length) + '...' : text;
}