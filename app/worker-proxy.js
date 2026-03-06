// Proxy for Monaco Editor Workers to bypass cross-origin CSP restrictions
self.MonacoEnvironment = {
  baseUrl: chrome.runtime.getURL('/')
};
importScripts(chrome.runtime.getURL('assets/monaco-editor/min/vs/base/worker/workerMain.js'));
