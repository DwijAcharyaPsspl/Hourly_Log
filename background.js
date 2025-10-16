chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      const defaultSettings = {
        reminderInterval: 60, // minutes
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        notificationSound: true
      };
      chrome.storage.local.set({ settings: defaultSettings });
    }
  });

  // Set initial alarm
  setAlarmFromSettings();
  console.log('Hourly logger initialized: ', new Date().toLocaleString());
});

// Function to set alarm based on settings
function setAlarmFromSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    const interval = result.settings?.reminderInterval || 60;
    chrome.alarms.clear('hourlyLogReminder', () => {
      chrome.alarms.create('hourlyLogReminder', { periodInMinutes: interval });
    });
  });
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.settings) {
    setAlarmFromSettings();
  }
});

// Check if current time is in quiet hours
function isQuietHours(settings) {
  if (!settings.quietHoursEnabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

// Trigger notification
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'hourlyLogReminder') {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      
      if (!isQuietHours(settings)) {
        chrome.notifications.create('hourlyLogNotification', {
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Hourly Logger',
          message: 'Time to log your work! What did you accomplish?',
          priority: 2,
          buttons: [
            { title: 'Log Now' },
            { title: 'Snooze 15min' }
          ]
        });
      }
    });
  } else if (alarm.name === 'snoozeReminder') {
    chrome.notifications.create('hourlyLogNotification', {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Hourly Logger - Snoozed Reminder',
      message: 'Time to log your work!',
      priority: 2
    });
  }
});

// Handle notification clicks and button clicks
chrome.notifications.onClicked.addListener(() => {
  openLoggerPopup();
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Log Now
    openLoggerPopup();
  } else if (buttonIndex === 1) {
    // Snooze 15min
    chrome.alarms.create('snoozeReminder', { delayInMinutes: 15 });
    chrome.notifications.clear(notificationId);
  }
});

function openLoggerPopup() {
  chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 450,
    height: 550,
    focused: true
  });
}

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-logger') {
    openLoggerPopup();
  }
});