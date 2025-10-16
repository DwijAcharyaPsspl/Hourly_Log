function renderLogs(logs) {
  const container = document.getElementById('logList');
  container.innerHTML = '';

  if (logs.length === 0) {
    container.innerHTML = '<p>No logs yet.</p>';
    return;
  }

  logs.forEach((log, index) => {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
      <p><strong>${log.time}</strong></p>
      <p>${log.text}</p>
      <button class="delete" data-index="${index}">Delete</button>
    `;
    container.appendChild(entry);
  });

  document.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      logs.splice(index, 1);
      chrome.storage.local.set({ logs }, () => renderLogs(logs));
    });
  });
}

chrome.storage.local.get(['logs'], (result) => {
  renderLogs(result.logs || []);
});

document.getElementById('exportLogs').addEventListener('click', () => {
  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];
    const text = logs.map(l => `${l.time}\n${l.text}\n---`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'HourlyLogs.txt';
    a.click();
    URL.revokeObjectURL(url);
  });
});

document.getElementById('clearAll').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all logs?')) {
        chrome.storage.local.set({ logs: [] }, () => renderLogs([]));
    }
})
