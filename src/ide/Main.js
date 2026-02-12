import CodeEditor from './CodeEditor/CodeEditor.js';
import shortcutService from './ShortcutService.js';
import tabManager from './CodeEditor/TabManager.js';
import Explorer from './Explorer/Explorer.js';
import MySnippets from './Snippets/MySnippets.js';
import ZohoSnippets from './Snippets/ZohoSnippets.js';
import InterfaceManagerUI from './InterfaceManager/InterfaceManagerUI.js';

class IDEMain {
    constructor() {
        this.editor = new CodeEditor('editor-container');
        this.shortcutService = shortcutService;
        this.tabManager = tabManager;
        this.explorer = new Explorer('open-editors-list', 'project-explorer-tree');
        this.mySnippets = new MySnippets('my-snippets-list', 'my-snippets-search');
        this.zohoSnippets = new ZohoSnippets();
        this.interfaceManagerUI = new InterfaceManagerUI();
    }

    async init() {
        console.log('[IDEMain] Initializing...');

        await this.tabManager.init();
        await this.shortcutService.init();
        await this.editor.init();
        await this.explorer.init();
        await this.mySnippets.init();
        await this.zohoSnippets.init();
        await this.interfaceManagerUI.init();

        this.setupGlobalEvents();

        console.log('[IDEMain] Ready');
    }

    setupGlobalEvents() {
        window.addEventListener('resize', () => {
            this.editor.layout();
        });
    }
}

const ideMain = new IDEMain();
window.IDEMain = ideMain;
window.AppState = ideMain.tabManager;
window.AppState.models = ideMain.editor.models;

export default ideMain;
