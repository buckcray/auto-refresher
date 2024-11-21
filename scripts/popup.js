const bannerStatus = document.getElementById('bannerStatus');
const option30 = document.getElementById('option30');
const option60 = document.getElementById('option60');
const option30Lable = document.getElementById('option30Lable');
const option60Lable = document.getElementById('option60Lable');
const refreshNow = document.getElementById('refreshNow');
const refreshOffOn = document.getElementById('refreshOffOn');
const refreshOffOnLable = document.getElementById('refreshOffOnLable');
const activeURLList = document.getElementById('activeURLList');
const clearRefreshes = document.getElementById('clearRefreshes');
const removeTabForRefresh =  document.getElementById("removeTabForRefresh");
const setTabForRefresh = document.getElementById('setTabForRefresh');
const offOnControlerStart = document.getElementById('offOnControlerStart');
const offOnControlerStop = document.getElementById('offOnControlerStop');
const offOnControlerStartLable = document.getElementById('offOnControlerStartLable');
const offOnControlerStopLable = document.getElementById('offOnControlerStopLable');

/*
Get from storage
*/

// Starting function responsible for retreving buton and indicaters from storage
function setTabStatusInd() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTabUrl = tabs[0].url;
      chrome.storage.local.get({ tabsForRefresh: [] }, (result) => {
        const tabsForRefresh = result.tabsForRefresh;
        chrome.storage.local.get(['refreshWaitTime', 'refreshOffOn'], (result) => {
          const refreshWaitTime = result.refreshWaitTime;
          const refreshOffOn = result.refreshOffOn;
          if (tabsForRefresh.includes(activeTabUrl)) {
            bannerStatus.innerHTML = "This tab is set to be refeshed every " + refreshWaitTime + " seconds.";
          } else {
            bannerStatus.innerHTML = "This tab is not set to be refreshed."
          }
          switch (refreshWaitTime) {
            case 60:
              option30Lable.classList.remove("active-btn");
              option60Lable.classList.add("active-btn");
              break;
            case 30:
              option30Lable.classList.add("active-btn");
              option60Lable.classList.remove("active-btn");
              break;
          }
          switch (refreshOffOn) {
            case true:
              offOnControlerStopLable.classList.remove("active-btn");
              offOnControlerStartLable.classList.add("active-btn");
              break;
            case false:
              offOnControlerStopLable.classList.add("active-btn");
              offOnControlerStartLable.classList.remove("active-btn");
              break;
          }
        });
      });
    }
  });
}
setTabStatusInd();

// menuBlock is requred for creating the elements in the Active URL's section of the popup
function menuBlock(insideHTML, parentClasses, parentElement) {
  let x = document.createElement('ul');
  x.id = "activeURLElementExists";
  x.setAttribute('class', parentClasses);
  x.innerHTML = insideHTML;
  $(parentElement).append(x);
}

// Set the visual reminder in the popup
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
      <li class="list-group-item bg-transparent text-light text-wrap" id="tab-${tabId}">
        <a href="${result}" target="_blank" title="Navigate to an active url" rel="noopener">${result}</a>
      </li>
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
  console.log("Starting removeActiveURLVisual(x)")
  const tabID = "tab-" + x;
  const tabIDDoc = document.getElementById(tabID);
  if (tabIDDoc) {
    tabIDDoc.remove();
  }
}


document.getElementById("refreshNow").addEventListener("click", () =>{
  chrome.runtime.sendMessage({ refreshStart:"refreshPage"});
});

/*____________________________________________________________________________________*/
/* Option30/60 Event Listeners */

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

/*____________________________________________________________________________________*/
/* offOnControlerStart/Stop Event Listeners */

offOnControlerStart.addEventListener('change', () => {
  if (offOnControlerStart.checked) {
    chrome.storage.local.set({
      offOnControlerStartButton: true,
      offOnControlerStopButton: false,
      refreshOffOn: true
    });
    setTabStatusInd();
    offOnControlerStopLable.classList.remove("active-btn");
    offOnControlerStartLable.classList.add("active-btn");
  }
  console.log(option30.checked, option60.checked);
  chrome.runtime.sendMessage({ refreshStart:"refreshPage"});
});

offOnControlerStop.addEventListener('change', () => {
  if (offOnControlerStop.checked) {
    chrome.storage.local.set({
      offOnControlerStartButton: false,
      offOnControlerStopButton: true,
      refreshOffOn: false
    });
    setTabStatusInd();
    offOnControlerStartLable.classList.remove("active-btn");
    offOnControlerStopLable.classList.add("active-btn");
  }
  console.log(option30.checked, option60.checked);
  chrome.runtime.sendMessage({ refreshStart:"refreshPage"});
});

/*____________________________________________________________________________________*/
/* Set/Remove tabsForRefresh Event Listeners */

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
            removeActiveURLVisual(activeTabID);
            chrome.runtime.sendMessage({ refreshStart:"PageUpdate",tabIDRefresh: activeTabID}); // Refresh the tab
          });
        } else {
          console.log(`${activeTabUrl} is not apart of the refresh list.`);
        }
      });
    }
  });
});

/*____________________________________________________________________________________*/
/* Clear All Event Listeners */

clearRefreshes.addEventListener("click", () => {
  let temparray = [];
  chrome.storage.local.set({tabsForRefresh:temparray});
  setContextLable();
  setTabStatusInd();
  setActiveURLVisual();
});