/*
On Start Functions/Scripts
*/

function onStart() {
  // Grabing variables from storage and assigning them to our instance
  chrome.storage.local.get(['timeButton30', 'timeButton60', 'refreshOffOn'], (results) => {
    const timeButton30 = results.timeButton30;
    const timeButton60 = results.timeButton60;
    const refreshOffOn = results.refreshOffOn;
    if (timeButton30) {
      chrome.storage.local.set({
        refreshWaitTime: 30
      });
    }
    if (timeButton60) {
      chrome.storage.local.set({
        refreshWaitTime: 60
      });
    }
    chrome.storage.local.get(['refreshWaitTime'], (results) =>{
      console.log("refreshWaitTime is " + results.refreshWaitTime)
    })
  }); // end of grabing variables from storage

  // Injecting Content.js Script
  chrome.storage.local.get('tabsForRefresh', (result) => {
    const patterns = result.tabsForRefresh || [];
    chrome.scripting.unregisterContentScripts({ ids: ['dynamicScript'] }, () => {
      if (patterns.length > 0) {
        chrome.scripting.registerContentScripts([
          {
            id: 'dynamicScript',
            js: ['/scripts/jquery.min.js','/scripts/content.js'],
            matches: patterns,
            runAt: 'document_idle',
          },
        ], () => {
          console.log('Content script updated with new URL patterns.');
        });
      }
    });
  }); // end of injecting content.js

  // Refreshing matching tabs
  chrome.storage.local.get({ tabsForRefresh: [] }, (result) => {
    const tabsForRefresh = result.tabsForRefresh;
    if (tabsForRefresh.length === 0) {
      console.log("No tabs to refresh.");
      return;
    }
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tabsForRefresh.includes(tab.url)) {
          chrome.tabs.reload(tab.id, () => {
            console.log(`Refreshed tab with URL: ${tab.url}`);
          });
        }
      });
    });
  }); // end of refreshing matching tabs
};


/*
Functions
*/

function sendToConsole(e) {
  console.log(e);
}


function refreshMatchingTabs() {
  chrome.storage.local.get({ tabsForRefresh: [] }, (result) => {
    const tabsForRefresh = result.tabsForRefresh;
    if (tabsForRefresh.length === 0) {
      console.log("No tabs to refresh.");
      return;
    }
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tabsForRefresh.includes(tab.url)) {
          chrome.tabs.reload(tab.id, () => {
            console.log(`Refreshed tab with URL: ${tab.url}`);
          });
        }
      });
    });
  });
}

function injectHeader() {
  chrome.storage.local.get('tabsForRefresh', (result) => {
    const patterns = result.tabsForRefresh || [];
    chrome.scripting.unregisterContentScripts({ ids: ['dynamicScript'] }, () => {
      if (patterns.length > 0) {
        chrome.scripting.registerContentScripts([
          {
            id: 'dynamicScript',
            js: ['/scripts/content.js'],
            matches: patterns,
            runAt: 'document_idle',
          },
        ], () => {
          console.log('Content script updated with new URL patterns.');
        });
      }
    });
  });
};


chrome.scripting.getRegisteredContentScripts()
  .then((scripts) => {
    scripts.forEach((script) => {
      console.log(`Registered script ID: ${script.id}`);
    });
  })
  .catch((error) => {
    console.error(`Error retrieving registered content scripts: ${error}`);
});



/*
Message Listeners
*/

// Message Listener for refreshPage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.refreshStart === 'refreshPage') {
    injectHeader();
    refreshMatchingTabs();
  }
});


// Message Listener for PageUpdate
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.refreshStart === 'PageUpdate') {
    injectHeader();
    let tabID = message.tabIDRefresh;
    console.log(tabID)
    chrome.tabs.reload(tabID)
  }
});

/*
Storage Base
*/

// On startup event listener 
chrome.runtime.onInstalled.addListener(()=>{
  onStart()
});

chrome.runtime.onStartup.addListener(()=>{
  onStart()
});

chrome.runtime.sendMessage({startHeadDivCreate:true});
chrome.runtime.sendMessage({startBootstrapStyleSheet:true});
chrome.runtime.sendMessage({startBootstrapScript:true});

chrome.storage.local.get(['tabsForRefresh'], (results) => {
  const tabsForRefresh = results.tabsForRefresh;
  sendToConsole("Line 168, tabsForRefresh is " + tabsForRefresh);
  chrome.tabs.query({url: tabsForRefresh}, (tabs) => {
  var tabIDtoSend = [];
  sendToConsole("Line 171, tabIDtoSend is " + tabIDtoSend)
    tabs.forEach(function(tab){
      tabIDtoSend.push(tab.id);
    });
    sendToConsole("Line 175, tabIDtoSend is " + tabIDtoSend)
    chrome.runtime.sendMessage({tabsIDtoInjectContentJS:tabIDtoSend})
  });
});

// If a tab is updated, check the URL, if it matches 
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") { // Wait for the page to finish loading
    chrome.storage.local.get({ tabsForRefresh: [] }, (results) => {
      const tabsForRefresh = results.tabsForRefresh;
      if (tabsForRefresh.includes(tab.url)) {
        injectHeader(); // Run the inject headers script
      };
    })
    console.log('Tab URL updated to:', tab.url);
  }
});

