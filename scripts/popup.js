const bannerStatus = document.getElementById('bannerStatus');
const option30 = document.getElementById('option30');
const option60 = document.getElementById('option60');
const refreshNow = document.getElementById('refreshNow');
const refreshOffOn = document.getElementById('refreshOffOn');
const refreshOffOnLable = document.getElementById('refreshOffOnLable');
const activeURLList = document.getElementById('activeURLList');
const clearRefreshes = document.getElementById('clearRefreshes');
const removeTabForRefresh =  document.getElementById("removeTabForRefresh");
const setTabForRefresh = document.getElementById('setTabForRefresh');

/*
Get from storage
*/

chrome.runtime.onMessage.addListener((message,sender,senderResponse) => {
  if (message.onStartFunction === true) {
    refreshOffOnLable.textContent = "On";
    refreshOffOn.checked = true;
  } else {
    refreshOffOnLable.textContent = "Off";
    refreshOffOn.checked = false;
  };
});

function setContextLable() {
  chrome.storage.local.get(['refreshOffOn'], (results) => {
    const refreshOffOn = results.refreshOffOn;
    if (refreshOffOn) {
      refreshOffOnLable.textContent = "On";
      refreshOffOn.checked = true;
    } else {
      refreshOffOnLable.textContent = "Off";
      refreshOffOn.checked = false;
    }
  });
}
setContextLable();


function setTabStatusInd() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTabUrl = tabs[0].url;
      chrome.storage.local.get({ tabsForRefresh: [] }, (result) => {
        const tabsForRefresh = result.tabsForRefresh;
        chrome.storage.local.get(['refreshWaitTime'], (result) => {
          const refreshWaitTime = result.refreshWaitTime;
          if (tabsForRefresh.includes(activeTabUrl)) {
            bannerStatus.innerHTML = "This tab is set to be refeshed every " + refreshWaitTime + " seconds.";
          } else {
            bannerStatus.innerHTML = "This tab is not set to be refreshed."
          }
        });
      });
    }
  });
}
setTabStatusInd();

function menuBlock(insideHTML, parentClasses, parentElement) {
  let x = document.createElement('ul');
  x.id = "activeURLElementExists";
  x.setAttribute('class', parentClasses);
  x.innerHTML = insideHTML;
  $(parentElement).append(x);
}


async function setActiveURLVisual() {
  const activeTabUrlListClass = "list-group list-group-flush w-100 h-auto bg-transparent";
  let activeTabUrlList = ``;

  // Get tabsForRefresh from storage
  const results = await new Promise((resolve) => {
    chrome.storage.local.get(['tabsForRefresh'], resolve);
  });
  const tabsForRefresh = results.tabsForRefresh || [];

  // Process each result
  const promises = tabsForRefresh.map((result) => {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => {
        let tabId = '';
        for (const tab of tabs) {
          if (result.includes(tab.url)) {
            tabId = tab.id;
            break;
          }
        }
        resolve({ result, tabId });
      });
    });
  });

  // Wait for all queries to complete
  const tabResults = await Promise.all(promises);

  // Build the activeTabUrlList HTML
  tabResults.forEach(({ result, tabId }) => {
    activeTabUrlList = `
      <li class="list-group-item bg-transparent text-light text-wrap" id="tab-${tabId}">${result}</li>
    ` + activeTabUrlList;
  });

  // Append or create the menu block
  const elm = document.getElementById('activeURLElementExists');
  if (elm !== null) {
    $(elm).append(activeTabUrlList);
  } else {
    menuBlock(activeTabUrlList, activeTabUrlListClass, "#activeURLList");
  }
}
setActiveURLVisual();

function removeActiveURLVisual(x) {
  const tabID = "tab-" + x;
  const tabIDDoc = document.getElementById(tabID);
  if (tabIDDoc) {
    tabIDDoc.remove
  }
}

/*
Event Listener & save to storage
*/

// Listen for toggle changes



document.getElementById('refreshOffOn').addEventListener("click", () =>{
  if (refreshOffOn.checked) {
    refreshOffOnLable.textContent = "Off";
    chrome.storage.local.set({
      refreshOffOn:false
    });
  } else {
    refreshOffOnLable.textContent = "On";
    chrome.storage.local.set({
      refreshOffOn:true
    });
  }
});

document.getElementById("refreshNow").addEventListener("click", () =>{
  chrome.runtime.sendMessage({ refreshStart:"refreshPage"});
});

option30.addEventListener('change', () => {
  if (option30.checked) {
    chrome.storage.local.set({
      timeButton30: true,
      timeButton60: false,
      refreshWaitTime: 30
    });
  }
  console.log(option30.checked, option60.checked);
  chrome.runtime.sendMessage({ refreshStart:"refreshPage"});
  setTabStatusInd()
});

option60.addEventListener('change', () => {
  if (option60.checked) {
    chrome.storage.local.set({
      timeButton30: false,
      timeButton60: true,
      refreshWaitTime: 60
    });
  }
  console.log(option30.checked, option60.checked);
  chrome.runtime.sendMessage({ refreshStart:"refreshPage"});
  setTabStatusInd()
});

setTabForRefresh.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTabUrl = tabs[0].url;
      const activeTabID = tabs[0].id;
      chrome.storage.local.get({ tabsForRefresh: [] }, (result) => {
        const tabsForRefresh = result.tabsForRefresh;
        if (!tabsForRefresh.includes(activeTabUrl)) {
          tabsForRefresh.push(activeTabUrl);
          chrome.storage.local.set({ tabsForRefresh }, () => {
            console.log(`Added ${activeTabUrl} to refresh list.`);
            setTabStatusInd();
            chrome.runtime.sendMessage({ refreshStart:"PageUpdate",tabIDRefresh: activeTabID});
            setActiveURLVisual();
          });
        } else {
          console.log(`${activeTabUrl} is already in the refresh list.`);
        }
      });
    }
  });
});

removeTabForRefresh.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTabID = tabs[0].id;
      const activeTabUrl = tabs[0].url;
      chrome.storage.local.get({ tabsForRefresh: [] }, (result) => {
        var tabsForRefresh = result.tabsForRefresh;
        if (tabsForRefresh.includes(activeTabUrl)) {
          tabsForRefresh = tabsForRefresh.filter(item => item !== activeTabUrl);
          chrome.storage.local.set({ tabsForRefresh }, () => {
            console.log(`Removed  ${activeTabUrl} from the refresh list.`);
            setTabStatusInd();
            removeActiveURLVisual(activeTabID)
            chrome.runtime.sendMessage({ refreshStart:"PageUpdate",tabIDRefresh: activeTabID}); // Refresh the tab
          });
        } else {
          console.log(`${activeTabUrl} is not apart of the refresh list.`);
        }
      });
    }
  });
});

clearRefreshes.addEventListener("click", () => {
  let temparray = [];
  chrome.storage.local.set({tabsForRefresh:temparray});
  setContextLable();
  setTabStatusInd();
  setActiveURLVisual();
});

/*
Extention List Items
*/