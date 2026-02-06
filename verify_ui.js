const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set up a simple local server or just open the file
  const path = require('path');
  const fileUrl = 'file://' + path.resolve('ide.html');

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('Opening page:', fileUrl);
  await page.goto(fileUrl);

  // Wait for some time to let Monaco load (or fail)
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'ide_screenshot.png', fullPage: true });
  console.log('Screenshot saved to ide_screenshot.png');

  const content = await page.content();
  if (content.includes('Failed to load Monaco Editor')) {
    console.error('UI shows Monaco load failure!');
  } else {
    console.log('Monaco seems to have loaded or at least not shown the error message.');
  }

  await browser.close();
})();
