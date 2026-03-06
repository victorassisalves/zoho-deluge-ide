const fs = require('fs');
let code = fs.readFileSync('background.js', 'utf8');

// I accidentally duplicated the sendResponse object in my `patch_bg_check.js` logic!
code = code.replace(/sendResponse\(\{\s*connected: true,\s*tabTitle: tab\.title,\s*url: tab\.url,\s*context: retryRes\.context,\s*isStandalone: !isSidePanel\s*\}\);\s*\}\);\s*connected: true,\s*tabTitle: tab\.title,\s*url: tab\.url,\s*context: retryRes\.context,\s*isStandalone: !isSidePanel\s*\}\);\s*\}\);/, `sendResponse({
                                            connected: true,
                                            tabTitle: tab.title,
                                            url: tab.url,
                                            context: retryRes.context,
                                            id: tabId,
                                            isStandalone: !isSidePanel
                                        });
                                    });`);

// Let's just fix it manually with a regex that removes the malformed double block
const badBlock = `                                    chrome.tabs.get(tabId, (tab) => {
                                        sendResponse({
                                            connected: true,
                                            tabTitle: tab.title,
                                            url: tab.url,
                                            context: retryRes.context,
                                            id: tabId,
                                            isStandalone: !isSidePanel
                                        });
                                    });

                                            connected: true,
                                            tabTitle: tab.title,
                                            url: tab.url,
                                            context: retryRes.context,
                                            isStandalone: !isSidePanel
                                        });
                                    });`;
const goodBlock = `                                    chrome.tabs.get(tabId, (tab) => {
                                        sendResponse({
                                            connected: true,
                                            tabTitle: tab.title,
                                            url: tab.url,
                                            context: retryRes.context,
                                            id: tabId,
                                            isStandalone: !isSidePanel
                                        });
                                    });`;

code = code.replace(badBlock, goodBlock);

fs.writeFileSync('background.js', code);
console.log('Fixed background.js syntax error');
