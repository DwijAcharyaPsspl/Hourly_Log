chrome.runtime.onInstalled.addListener(() => {
  // Set the hourly alarm
  chrome.alarms.create('hourlyLogReminder', { periodInMinutes: 60 });
  console.log('hourly logger called: ', new Date().toLocaleString())
});

// Trigger notification each hour
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'hourlyLogReminder') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Hourly Logger',
      message: 'Please input the logs of this previous hour.',
      priority: 2
    });
  }
});

// When user clicks notification → open mini popup window
chrome.notifications.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 400,
    height: 300,
    focused: true
  });
});
