// Create a new element responosible for being our notification bar
const header = document.createElement('div');
function headDivCreate() {
header.style.position = 'relative';
header.style.top = '0';
header.style.left = '0';
header.style.width = '100%';
header.style.height = '40px';
header.style.fontSize = '14px';
header.style.width = '-webkit-fill-available';
header.style.backgroundColor = '#252826';
header.style.color = "#F6F6F6";
header.style.zIndex = "999999999";
header.style.textAlign = 'center';
header.style.padding = '10px';
header.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
document.body.insertBefore(header, document.body.firstChild);
}
headDivCreate();

// Function for enjecting the refresh bar data
function refreshBarInjection() {
    chrome.storage.local.get(['refreshWaitTime', 'refreshOffOn'], (results) => {
        const refreshWaitTime = results.refreshWaitTime;
        let refreshOffOn = results.refreshOffOn;
    
        if (refreshOffOn) {
            for (let i = 0; i < refreshWaitTime; i++) {
                const tempSeconds = refreshWaitTime - i - 1;
                setTimeout(() => {
                    if (refreshOffOn) {
                        header.textContent = `There are ${tempSeconds} seconds left until refresh.`;
                    } else {
                        header.textContent = `Auto Refresh is Off.`;
                    };
                    if (tempSeconds === 0 && refreshOffOn) {
                        location.reload(true);
                    };
                    chrome.storage.local.set({vartempSeconds:tempSeconds});
                }, (i + 1) * 1000);
                if (!refreshOffOn) {
                    break;
                }
            }
        } else {
            header.textContent = `Auto Refresh is Off.`;
        }
    
        // Listen for changes to refreshOffOn
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes.refreshOffOn) {
                refreshOffOn = changes.refreshOffOn.newValue;
                if (!refreshOffOn) {
                    header.textContent = `Auto Refresh is Off.`;
                }
            }
        });
    });    
};
refreshBarInjection();


/*____________________________________________________________________________________*/
// End goal required Host Permissions. Commenting it out for now since this isn't required.
/*
chrome.runtime.onMessage.addListener((message,sender,senderResponse) => {
    if (message.startHeadDivCreate) {
        headDivCreate();
        refreshBarInjection();
    }
});
*/
