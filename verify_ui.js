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
  console.log('Opening page:', fileUrl);

  await page.goto(fileUrl);
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'ide_fixed_screenshot.png', fullPage: true });
  console.log('Screenshot saved to ide_fixed_screenshot.png');

  // Test sidepanel mode
  await page.goto(fileUrl + '?mode=sidepanel');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'ide_sidepanel_fixed_screenshot.png', fullPage: true });
  console.log('Sidepanel screenshot saved to ide_sidepanel_fixed_screenshot.png');

  await browser.close();
})();
