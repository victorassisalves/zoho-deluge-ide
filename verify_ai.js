const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Mock chrome API
  await page.addInitScript(() => {
    window.chrome = {
      runtime: {
        getURL: (url) => url,
        sendMessage: (msg, cb) => cb && cb({ connected: true, tabTitle: 'Mock Zoho' }),
        onMessage: { addListener: () => {} }
      },
      storage: {
        local: {
          get: (keys, cb) => cb({ saved_deluge_code: 'info "Hello";' }),
          set: (data, cb) => cb && cb()
        }
      }
    };
  });

  const fileUrl = 'file://' + path.resolve('ide.html');
  await page.goto(fileUrl);
  await page.waitForTimeout(500);

  // Click on AI Agent icon
  await page.click('.sidebar-item[data-view="ai-agent"]');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'ide_ai_screenshot.png' });
  console.log('AI screenshot saved to ide_ai_screenshot.png');

  await browser.close();
})();
