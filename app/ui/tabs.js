import { Bus } from '../core/bus.js';
import { db } from '../services/db.js';

export class TabManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`[TabManager] Container #${containerId} not found.`);
            return;
        }

        this.tabs = new Map(); // tabId -> tab element metadata
        this.activeTabId = null;

        this._setupEventListeners();
        this._hydrateFromDB();
    }

    _setupEventListeners() {
        // Event Delegation for clicks on tabs
        this.container.addEventListener('click', (event) => {
            const tabElement = event.target.closest('.workspace-tab');
            if (!tabElement) return;

            const tabId = parseInt(tabElement.dataset.tabId, 10);

            // Handle Close Button Click
            if (event.target.closest('.tab-close')) {
                this.closeTab(tabId);
                return;
            }

            // Handle Tab Select
            if (this.activeTabId !== tabId) {
                this.selectTab(tabId);
            }
        });

        // Listen for internal IDE events (like from Explorer clicking a file)
        document.addEventListener('UI_TAB_OPEN', (e) => {
            const { tabId, title, code, context } = e.detail;
            this.openTab(tabId, title, code, context);
        });

        // Listen for Broadcasts from other instances
        Bus.on('TAB_SWITCHED', (detail) => {
            if (detail.payload && detail.payload.tabId) {
                this._visualSelectTab(detail.payload.tabId);
            }
        });

        Bus.on('ZOHO_TAB_DISCONNECTED', (detail) => {
            if (detail.payload && detail.payload.tabId) {
                this.markTabOrphaned(detail.payload.tabId);
            }
        });
    }

    async _hydrateFromDB() {
        try {
            const allTabs = await db.workspace_tabs.toArray();
            if (allTabs.length === 0) return;

            // Sort by lastActive descending so most recent are first,
            // but we append them so let's sort ascending for display order
            allTabs.sort((a, b) => a.lastActive - b.lastActive);

            const fragment = document.createDocumentFragment();
            allTabs.forEach(tabData => {
                const el = this._createTabElement(tabData.tabId, tabData.title);
                this.tabs.set(tabData.tabId, el);
                fragment.appendChild(el);
            });

            this.container.appendChild(fragment);

            const activeSetting = await db.settings.get('activeTabId');
            if (activeSetting && activeSetting.value) {
                this._visualSelectTab(activeSetting.value);
            }

            // Tell background to check which tabs are actually still alive
            Bus.send('FETCH_ACTIVE_ZOHO_TABS');

        } catch (e) {
            console.error('[TabManager] Hydration error', e);
        }
    }

    _createTabElement(tabId, title) {
        const li = document.createElement('li');
        li.className = 'workspace-tab';
        li.dataset.tabId = tabId;

        li.innerHTML = `
            <span class="tab-title" title="${title}">${title}</span>
            <div class="tab-close"></div>
        `;
        return li;
    }

    openTab(tabId, title, code, contextInfo) {
        if (!this.tabs.has(tabId)) {
            const el = this._createTabElement(tabId, title);
            this.tabs.set(tabId, el);
            this.container.appendChild(el);
        }

        this.selectTab(tabId, contextInfo, code);
    }

    selectTab(tabId, contextInfo = null, initialCode = '') {
        this._visualSelectTab(tabId);

        // Let EditorController know to switch the monaco model
        document.dispatchEvent(new CustomEvent('UI_TAB_SELECTED', {
            detail: { tabId, contextInfo, code: initialCode }
        }));

        // Broadcast to other IDE views
        Bus.broadcast('TAB_SWITCHED', { tabId });
    }

    _visualSelectTab(tabId) {
        this.activeTabId = tabId;
        // Remove active class from all
        this.container.querySelectorAll('.workspace-tab').forEach(el => {
            el.classList.remove('active');
        });

        // Add to selected
        const target = this.tabs.get(tabId);
        if (target) {
            target.classList.add('active');
            // Ensure it's scrolled into view
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }

    closeTab(tabId) {
        const el = this.tabs.get(tabId);
        if (el) {
            el.remove();
            this.tabs.delete(tabId);
        }

        // Inform Editor Controller to clean up model
        document.dispatchEvent(new CustomEvent('UI_TAB_CLOSED', { detail: { tabId } }));

        if (this.activeTabId === tabId) {
            this.activeTabId = null;
            // Select the last available tab if any
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.selectTab(remainingTabs[remainingTabs.length - 1]);
            } else {
                // Show empty state
                document.dispatchEvent(new CustomEvent('UI_TABS_EMPTY'));
            }
        }
    }

    markTabOrphaned(tabId) {
        const el = this.tabs.get(tabId);
        if (el) {
            el.classList.add('orphaned');
            el.title = "This Zoho session is no longer active.";
        }
    }
}
