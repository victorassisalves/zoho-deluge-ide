const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const idePath = 'file://' + path.resolve(__dirname, 'ide.html');
  await page.goto(idePath);

  console.log('Verifying IDE UI...');

  // Mock AppState for testing
  await page.evaluate(() => {
    AppState.activeTabs = [
      { tabId: 101, system: 'CRM', functionName: 'Zoho - Functions - Zoho CRM - standalone.test', orgId: 'my_client', functionId: 'id1', tabSequence: 1 },
      { tabId: 102, system: 'Creator', functionName: 'Untitled Creator', orgId: 'my_client', functionId: 'unknown', tabSequence: 2 }
    ];
    AppState.savedFunctions = {
      'my_client': {
        'CRM': {
          'General': {
            'id1': { name: 'standalone.test', metadata: { orgId: 'my_client', system: 'CRM', functionId: 'id1' }, code: 'void test() {}' }
          }
        }
      }
    };
    renderOpenEditors();
    renderExplorer();
  });

  // Check Open Editors
  const openEditors = await page.$$('.explorer-item');
  console.log(`Found ${openEditors.length} items in total (Open Editors + Explorer)`);

  const openEditorsSection = await page.$('#open-editors-list');
  const items = await openEditorsSection.$$('.explorer-item');
  console.log(`Open Editors count: ${items.length}`);

  for (let i = 0; i < items.length; i++) {
    const text = await items[i].innerText();
    console.log(`Open Editor ${i+1}: ${text}`);
  }

  // Check Explorer Delete Buttons
  const clientHeader = await page.$('.explorer-header:has-text("Client: my_client")');
  const deleteBtn = await clientHeader.$('.explorer-action-btn');
  console.log(`Client Delete button found: ${!!deleteBtn}`);

  const sysHeader = await page.$('.explorer-header:has-text("CRM")');
  const sysDel = await sysHeader.$('.explorer-action-btn');
  console.log(`System Delete button found: ${!!sysDel}`);

  const foldHeader = await page.$('.explorer-header:has-text("General")');
  const foldDel = await foldHeader.$('.explorer-action-btn');
  console.log(`Folder Delete button found: ${!!foldDel}`);

  // Test Renaming Sync
  console.log('Testing rename sync...');
  await page.evaluate(() => {
    const metadata = { orgId: 'my_client', system: 'CRM', functionId: 'id1' };
    renameFunction(metadata);
  });

  // Since prompt() is blocking in playwright unless handled, let's mock it
  await page.evaluate(() => {
    window.prompt = () => 'Renamed Test Func';
    const metadata = { orgId: 'my_client', system: 'CRM', functionId: 'id1' };
    renameFunction(metadata);
  });

  const renamedEditorText = await (await page.$('#open-editors-list .explorer-item')).innerText();
  console.log(`Renamed Open Editor: ${renamedEditorText}`);

  const renamedExplorerText = await (await page.$('.func-name-text')).innerText();
  console.log(`Renamed Explorer Item: ${renamedExplorerText}`);

  if (renamedEditorText.includes('Renamed Test Func') && renamedExplorerText.includes('Renamed Test Func')) {
    console.log('SUCCESS: Rename synchronized correctly!');
  } else {
    console.log('FAILURE: Rename not synchronized.');
  }

  // Screenshot for visual confirmation
  await page.screenshot({ path: 'final_verification.png', fullPage: true });
  console.log('Screenshot saved to final_verification.png');

  await browser.close();
})();
