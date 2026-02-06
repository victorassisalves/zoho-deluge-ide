const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Verify IDE Settings
    const idePath = 'file://' + path.resolve('ide.html');
    await page.goto(idePath);
    await page.waitForTimeout(500);
    await page.click('.sidebar-item[data-view="settings"]');
    await page.screenshot({ path: 'ide_settings_screenshot.png' });

    // Verify Popup
    const popupPath = 'file://' + path.resolve('popup.html');
    await page.goto(popupPath);
    await page.screenshot({ path: 'popup_screenshot.png' });

    await browser.close();
})();
