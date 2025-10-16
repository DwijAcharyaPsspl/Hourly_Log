let allLogs = [];
let filteredLogs = [];
let undoStack = [];
let editingLogId = null;

// Load theme
const theme = localStorage.getItem('theme') || 'light';
document.body.className = theme;

// Initialize
loadLogs();

function loadLogs() {
  chrome.storage.local.get(['logs', 'categories'], (result) => {
    allLogs = result.logs || [];
    filteredLogs = [...allLogs];
    
    updateStats();
    updateCategoryFilter(result.categories);
    renderCategoryChart();
    renderLogs(filteredLogs);
  });
}

// Update statistics
function updateStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const todayLogs = allLogs.filter(log => new Date(log.time) >= today);
  const weekLogs = allLogs.filter(log => new Date(log.time) >= weekAgo);
  
  // Calculate days with logs
  const uniqueDays = new Set(allLogs.map(log => 
    new Date(log.time).toDateString()
  )).size;
  
  const avgPerDay = uniqueDays > 0 ? (allLogs.length / uniqueDays).toFixed(1) : 0;
  
  document.getElementById('totalLogs').textContent = allLogs.length;
  document.getElementById('todayLogs').textContent = todayLogs.length;
  document.getElementById('weekLogs').textContent = weekLogs.length;
  document.getElementById('avgPerDay').textContent = avgPerDay;
}

// Update category filter dropdown
function updateCategoryFilter(customCategories) {
  const categories = customCategories || [
    { name: 'BugFixes' },
    { name: 'Call and Meetings' },
    { name: 'Deployment' },
    { name: 'Design' },
    { name: 'Development' },
    { name: 'Documentation' },
    { name: 'Internal Support' },
    { name: 'Network Support' },
    { name: 'Project Planning' },
    { name: 'QA' },
    { name: 'Requirement Gathering' },
    { name: 'Research' },
    { name: 'Review' },
    { name: 'Technical Architecture' },
    { name: 'Test Case Writing' },
    { name: 'Training' }
  ];
  
  const filterSelect = document.getElementById('categoryFilter');
  const editSelect = document.getElementById('editCategory');
  
  const options = categories.map(cat => 
    `<option value="${cat.name}">${cat.emoji || ''} ${cat.name}</option>`
  ).join('');
  
  filterSelect.innerHTML = '<option value="">All Categories</option>' + options;
  editSelect.innerHTML = options;
}

// Render category chart
function renderCategoryChart() {
  const categoryCounts = {};
  allLogs.forEach(log => {
    const cat = log.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  
  const chartContainer = document.getElementById('categoryChart');
  const total = allLogs.length || 1;
  
  if (Object.keys(categoryCounts).length === 0) {
    chartContainer.innerHTML = '<p class="no-data">No data to display</p>';
    return;
  }
  
  chartContainer.innerHTML = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      return `
        <div class="chart-bar">
          <div class="chart-label">${category}</div>
          <div class="chart-bar-container">
            <div class="chart-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="chart-value">${count} (${percentage}%)</div>
        </div>
      `;
    }).join('');
}

// Render logs with delete and edit
function renderLogs(logs) {
  const container = document.getElementById('logList');
  
  if (logs.length === 0) {
    container.innerHTML = '<div class="no-logs-message"><p>No logs found.</p></div>';
    return;
  }

  container.innerHTML = logs.map((log) => `
    <div class="log-entry" data-id="${log.id}">
      <div class="log-header">
        <span class="category-badge">${log.category || 'Other'}</span>
        <span class="log-time">${formatDateTime(log.time)}</span>
      </div>
      <p class="log-text">${escapeHtml(log.text)}</p>
      <div class="log-actions">
        <button class="edit-btn" data-id="${log.id}">✏️ Edit</button>
        <button class="delete-btn" data-id="${log.id}">🗑️ Delete</button>
      </div>
    </div>
  `).join('');

  // Attach event listeners
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => deleteLog(e.target.dataset.id));
  });
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
  });
}

// Delete log with undo
function deleteLog(logId) {
  const index = allLogs.findIndex(log => log.id == logId);
  if (index === -1) return;
  
  const deletedLog = allLogs[index];
  undoStack.push({ action: 'delete', log: deletedLog, index });
  
  allLogs.splice(index, 1);
  chrome.storage.local.set({ logs: allLogs }, () => {
    applyFilters();
    updateStats();
    renderCategoryChart();
    showToast('Log deleted. Press Ctrl+Z to undo.', 'success');
  });
}

// Edit log
function openEditModal(logId) {
  const log = allLogs.find(l => l.id == logId);
  if (!log) return;
  
  editingLogId = logId;
  document.getElementById('editText').value = log.text;
  document.getElementById('editCategory').value = log.category;
  document.getElementById('editModal').classList.add('show');
}

document.getElementById('saveEdit').addEventListener('click', () => {
  const newText = document.getElementById('editText').value.trim();
  const newCategory = document.getElementById('editCategory').value;
  
  if (!newText) {
    showToast('Log text cannot be empty', 'error');
    return;
  }
  
  const index = allLogs.findIndex(log => log.id == editingLogId);
  if (index !== -1) {
    allLogs[index].text = newText;
    allLogs[index].category = newCategory;
    
    chrome.storage.local.set({ logs: allLogs }, () => {
      applyFilters();
      updateStats();
      renderCategoryChart();
      closeEditModal();
      showToast('Log updated successfully', 'success');
    });
  }
});

document.getElementById('cancelEdit').addEventListener('click', closeEditModal);

function closeEditModal() {
  document.getElementById('editModal').classList.remove('show');
  editingLogId = null;
}

// Search and filter
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('categoryFilter').addEventListener('change', applyFilters);
document.getElementById('dateFilter').addEventListener('change', applyFilters);

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const categoryFilter = document.getElementById('categoryFilter').value;
  const dateFilter = document.getElementById('dateFilter').value;
  
  filteredLogs = allLogs.filter(log => {
    // Search filter
    const matchesSearch = log.text.toLowerCase().includes(searchTerm);
    
    // Category filter
    const matchesCategory = !categoryFilter || log.category === categoryFilter;
    
    // Date filter
    let matchesDate = true;
    const logDate = new Date(log.time);
    const now = new Date();
    
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      matchesDate = logDate >= today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = logDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = logDate >= monthAgo;
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });
  
  renderLogs(filteredLogs);
}

// Export logs
document.getElementById('exportLogs').addEventListener('click', () => {
  const text = filteredLogs.map(l => 
    `[${formatDateTime(l.time)}] [${l.category}]\n${l.text}\n${'='.repeat(50)}`
  ).join('\n\n');
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HourlyLogs_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('Logs exported successfully', 'success');
});

// Backup logs
document.getElementById('backupLogs').addEventListener('click', () => {
  chrome.storage.local.get(null, (data) => {
    const backup = {
      logs: data.logs || [],
      categories: data.categories || [],
      templates: data.templates || [],
      settings: data.settings || {},
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HourlyLogger_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Backup created successfully', 'success');
  });
});

// Restore logs
document.getElementById('restoreLogs').addEventListener('click', () => {
  document.getElementById('restoreInput').click();
});

document.getElementById('restoreInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const backup = JSON.parse(event.target.result);
      
      if (confirm('This will replace all current data. Are you sure?')) {
        chrome.storage.local.set({
          logs: backup.logs || [],
          categories: backup.categories || [],
          templates: backup.templates || [],
          settings: backup.settings || {}
        }, () => {
          loadLogs();
          showToast('Data restored successfully', 'success');
        });
      }
    } catch (error) {
      showToast('Invalid backup file', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // Reset input
});

// Clear all logs
document.getElementById('clearAll').addEventListener('click', () => {
  if (confirm('Are you sure you want to delete ALL logs? This cannot be undone!')) {
    if (confirm('Really delete everything? Consider making a backup first.')) {
      chrome.storage.local.set({ logs: [] }, () => {
        allLogs = [];
        filteredLogs = [];
        renderLogs([]);
        updateStats();
        renderCategoryChart();
        showToast('All logs cleared', 'success');
      });
    }
  }
});

// Theme toggle
document.getElementById('toggleTheme').addEventListener('click', () => {
  const currentTheme = document.body.className;
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.className = newTheme;
  localStorage.setItem('theme', newTheme);
});

// Settings button
document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'settings.html' });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && undoStack.length > 0) {
    e.preventDefault();
    const lastAction = undoStack.pop();
    if (lastAction.action === 'delete') {
      allLogs.splice(lastAction.index, 0, lastAction.log);
      chrome.storage.local.set({ logs: allLogs }, () => {
        applyFilters();
        updateStats();
        renderCategoryChart();
        showToast('Undo successful', 'success');
      });
    }
  }
});

// Helper functions
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  if (isToday) {
    return `Today at ${timeStr}`;
  }
  
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
  
  return `${dateStr} at ${timeStr}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('statusToast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}