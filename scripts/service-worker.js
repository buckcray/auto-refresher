/*____________________________________________________________________________________*/
/* On Start Functions/Scripts */

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

  // Injecting content .js
  chrome.storage.local.get('tabsForRefresh', (result) => {
    const patterns = result.tabsForRefresh || [];
    chrome.scripting.getRegisteredContentScripts()
    .then((scripts) => {
      const scriptExists = scripts.some(script => script.id === 'dynamicScript');
      if (scriptExists) {
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
      } else {
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
    })
    .catch((error) => {
      console.error('Error fetching registered content scripts:', error);
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

/*____________________________________________________________________________________*/
/* Functions  */

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
    chrome.scripting.getRegisteredContentScripts()
    .then((scripts) => {
      const scriptExists = scripts.some(script => script.id === 'dynamicScript');
      if (scriptExists) {
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
      } else {
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
    })
    .catch((error) => {
      console.error('Error fetching registered content scripts:', error);
    });
  }); // end of injecting content.js
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

/*____________________________________________________________________________________*/
/* Message Listeners */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.refreshStart === 'refreshPage') {
    injectHeader();
    refreshMatchingTabs();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.refreshStart === 'PageUpdate') {
    injectHeader();
    let tabID = message.tabIDRefresh;
    console.log(tabID)
    chrome.tabs.reload(tabID)
  }
});

chrome.runtime.onInstalled.addListener(()=>{
  onStart();
});

chrome.runtime.onStartup.addListener(()=>{
  onStart();
});


/*____________________________________________________________________________________*/
// End goal required Host Permissions. Commenting it out for now since this isn't required.
/* 
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Ensure the tab has finished loading
  if (changeInfo.status === "complete" && tab.url) {
    chrome.storage.local.get({ tabsForRefresh: [] }, (results) => {
      const tabsForRefresh = results.tabsForRefresh || [];
      // Check if the tab's URL is in the refresh list
      if (tabsForRefresh.includes(tab.url)) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabId },
            files: ["/scripts/content.js"]
          },
          () => {
            // Send a message to the injected script
            chrome.tabs.sendMessage(tabId, { startHeadDivCreate: true });
          }
        );
      }
    });
  }
});
*/

