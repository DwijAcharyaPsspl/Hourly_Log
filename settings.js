// Load theme
const theme = localStorage.getItem('theme') || 'light';
document.body.className = theme;

let settings = {};
let categories = [];
let templates = [];

// Load current settings
chrome.storage.local.get(['settings', 'categories', 'templates'], (result) => {
  settings = result.settings || {
    reminderInterval: 60,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  };
  
  categories = result.categories || [
    { name: 'BugFixes', emoji: '🪲' },
    { name: 'Call and Meetings', emoji: '👥' },
    { name: 'Deployment', emoji: '📚' },
    { name: 'Design', emoji: '📔' },
    { name: 'Development', emoji: '🏠' },
    { name: 'Documentation', emoji: '📑' },
    { name: 'Internal Support', emoji: '📞' },
    { name: 'Network Support', emoji: '🛜' },
    { name: 'Project Planning', emoji: '🏵️' },
    { name: 'QA', emoji: '👾' },
    { name: 'Requirement Gathering', emoji: '🔍' },
    { name: 'Research', emoji: '🔎' },
    { name: 'Review', emoji: '✅' },
    { name: 'Technical Architecture', emoji: '🏫' },
    { name: 'Test Case Writing', emoji: '📃' },
    { name: 'Training', emoji: '🧑‍🎓' }
  ];
  
  templates = result.templates || [
    { name: 'Dev', text: 'Development work on ' },
    { name: 'Meeting', text: 'Meeting about ' },
    { name: 'Learning', text: 'Learned about ' }
  ];
  
  populateSettings();
  renderCategories();
  renderTemplates();
});

// Populate settings form
function populateSettings() {
  document.getElementById('reminderInterval').value = settings.reminderInterval;
  document.getElementById('quietHoursEnabled').checked = settings.quietHoursEnabled;
  document.getElementById('quietHoursStart').value = settings.quietHoursStart;
  document.getElementById('quietHoursEnd').value = settings.quietHoursEnd;
  
  toggleQuietHours();
}

// Toggle quiet hours visibility
document.getElementById('quietHoursEnabled').addEventListener('change', toggleQuietHours);

function toggleQuietHours() {
  const enabled = document.getElementById('quietHoursEnabled').checked;
  document.getElementById('quietHoursSettings').style.display = enabled ? 'flex' : 'none';
}

// Render categories
function renderCategories() {
  const container = document.getElementById('categoriesList');
  container.innerHTML = categories.map((cat, index) => `
    <div class="list-item">
      <span>${cat.emoji} ${cat.name}</span>
      <button class="delete-small" data-index="${index}">✕</button>
    </div>
  `).join('');
  
  document.querySelectorAll('#categoriesList .delete-small').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      categories.splice(index, 1);
      renderCategories();
    });
  });
}

// Add category
document.getElementById('addCategory').addEventListener('click', () => {
  const name = document.getElementById('newCategoryName').value.trim();
  const emoji = document.getElementById('newCategoryEmoji').value.trim();
  
  if (!name) {
    showToast('Please enter a category name', 'error');
    return;
  }
  
  categories.push({ name, emoji: emoji || '📌' });
  renderCategories();
  
  document.getElementById('newCategoryName').value = '';
  document.getElementById('newCategoryEmoji').value = '';
});

// Render templates
function renderTemplates() {
  const container = document.getElementById('templatesList');
  container.innerHTML = templates.map((tmpl, index) => `
    <div class="list-item">
      <span><strong>${tmpl.name}:</strong> ${tmpl.text}</span>
      <button class="delete-small" data-index="${index}">✕</button>
    </div>
  `).join('');
  
  document.querySelectorAll('#templatesList .delete-small').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      templates.splice(index, 1);
      renderTemplates();
    });
  });
}

// Add template
document.getElementById('addTemplate').addEventListener('click', () => {
  const name = document.getElementById('newTemplateName').value.trim();
  const text = document.getElementById('newTemplateText').value.trim();
  
  if (!name || !text) {
    showToast('Please enter both name and text', 'error');
    return;
  }
  
  templates.push({ name, text });
  renderTemplates();
  
  document.getElementById('newTemplateName').value = '';
  document.getElementById('newTemplateText').value = '';
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', () => {
  const newSettings = {
    reminderInterval: parseInt(document.getElementById('reminderInterval').value),
    quietHoursEnabled: document.getElementById('quietHoursEnabled').checked,
    quietHoursStart: document.getElementById('quietHoursStart').value,
    quietHoursEnd: document.getElementById('quietHoursEnd').value
  };
  
  chrome.storage.local.set({
    settings: newSettings,
    categories: categories,
    templates: templates
  }, () => {
    showToast('Settings saved successfully!', 'success');
    setTimeout(() => {
      window.close();
    }, 1000);
  });
});

// Reset settings
document.getElementById('resetSettings').addEventListener('click', () => {
  if (confirm('Reset all settings to defaults?')) {
    const defaultSettings = {
      reminderInterval: 60,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    };
    
    const defaultCategories = [
        { name: 'BugFixes', emoji: '🪲' },
    { name: 'Call and Meetings', emoji: '👥' },
    { name: 'Deployment', emoji: '📚' },
    { name: 'Design', emoji: '📔' },
    { name: 'Development', emoji: '🏠' },
    { name: 'Documentation', emoji: '📑' },
    { name: 'Internal Support', emoji: '📞' },
    { name: 'Network Support', emoji: '🛜' },
    { name: 'Project Planning', emoji: '🏵️' },
    { name: 'QA', emoji: '👾' },
    { name: 'Requirement Gathering', emoji: '🔍' },
    { name: 'Research', emoji: '🔎' },
    { name: 'Review', emoji: '✅' },
    { name: 'Technical Architecture', emoji: '🏫' },
    { name: 'Test Case Writing', emoji: '📃' },
    { name: 'Training', emoji: '🧑‍🎓' }
    ];
    
    const defaultTemplates = [
      { name: 'Dev', text: 'Development work on ' },
      { name: 'Meeting', text: 'Meeting about ' },
      { name: 'Learning', text: 'Learned about ' }
    ];
    
    chrome.storage.local.set({
      settings: defaultSettings,
      categories: defaultCategories,
      templates: defaultTemplates
    }, () => {
      settings = defaultSettings;
      categories = defaultCategories;
      templates = defaultTemplates;
      
      populateSettings();
      renderCategories();
      renderTemplates();
      showToast('Settings reset to defaults', 'success');
    });
  }
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