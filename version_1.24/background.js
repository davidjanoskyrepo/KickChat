const filter = {
    url: [
        {
            urlContains: "kick.com",
        },
    ],
};

chrome.webNavigation.onCompleted.addListener(() => {
    // Send a message to the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var activeTab = tabs[0];
        chrome.scripting.executeScript({
            target: {
                tabId: activeTab.id,
                allFrames: true,
            },
            files: ['kick_chat.js'],
        });
    });
}, filter);