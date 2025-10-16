document.getElementById('saveLog').addEventListener('click', () => {
  const input = document.getElementById('logInput').value.trim();
  if (!input) {
    document.getElementById('status').textContent = 'Please enter something before saving.';
    return;
  }

  const timestamp = new Date().toLocaleString();
  const logEntry = { text: input, time: timestamp };

  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];
    logs.unshift(logEntry);
    chrome.storage.local.set({ logs }, () => {
      document.getElementById('status').textContent = 'Log saved successfully!';
      document.getElementById('logInput').value = '';
      setTimeout(() => {
        window.close(); // 👈 Closes popup window after save
      }, 500);
    });
  });
});

document.getElementById('viewSummary').addEventListener('click', () => {
  chrome.tabs.create({ url: 'summary.html' });
});
