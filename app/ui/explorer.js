import { Bus } from '../core/bus.js';
import { db } from '../services/db.js';

export class SidebarManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`[SidebarManager] Container #${containerId} not found.`);
            return;
        }

        this.activeSessions = new Map(); // tabId -> metadata
        this.localFiles = new Map(); // fileId -> metadata

        this._renderScaffolding();
        this._setupEventListeners();
        this._fetchInitialState();
    }

    _renderScaffolding() {
        this.container.innerHTML = `
            <div class="explorer-section" id="active-sessions-section">
                <div class="explorer-section-header">
                    <span class="chevron">▼</span> ACTIVE ZOHO SESSIONS
                </div>
                <div class="explorer-section-content" id="active-sessions-list">
                    <!-- Dynamic list items -->
                    <div style="padding: 10px; color: #666; font-style: italic; font-size: 11px;">Waiting for Zoho editors...</div>
                </div>
            </div>

            <div class="explorer-section" id="local-workspace-section">
                <div class="explorer-section-header">
                    <span class="chevron">▼</span> LOCAL WORKSPACE
                </div>
                <div class="explorer-section-content" id="local-workspace-list">
                    <!-- Offline files from Dexie -->
                </div>
            </div>
        `;
    }

    _setupEventListeners() {
        // Accordion functionality
        this.container.addEventListener('click', (e) => {
            const header = e.target.closest('.explorer-section-header');
            if (header) {
                const section = header.closest('.explorer-section');
                section.classList.toggle('collapsed');
                return;
            }

            // Click on an active session item
            const sessionItem = e.target.closest('.explorer-item[data-tab-id]');
            if (sessionItem) {
                const tabId = parseInt(sessionItem.dataset.tabId, 10);
                const metadata = this.activeSessions.get(tabId);

                if (metadata) {
                    // Pull code first
                    Bus.send('editor:pull', { targetTabId: tabId });

                    // Tell TabManager to open this tab.
                    // When pull responds, it will populate the editor.
                    document.dispatchEvent(new CustomEvent('UI_TAB_OPEN', {
                        detail: {
                            tabId: tabId,
                            title: metadata.title,
                            code: '// Pulling code from Zoho...',
                            context: metadata.context
                        }
                    }));
                }
                return;
            }

            // Click on a local file item
            const localItem = e.target.closest('.explorer-item[data-file-id]');
            if (localItem) {
                const fileId = localItem.dataset.fileId;
                // For local files, we might open them in a tab with a negative/string ID, or load them into the current active tab
                // Depending on the exact UX desired. Let's assume we open it as a "virtual" tab.
                db.files.get(fileId).then(file => {
                    if (file) {
                        document.dispatchEvent(new CustomEvent('UI_TAB_OPEN', {
                            detail: {
                                tabId: `local_${file.id}`, // String ID for local files
                                title: file.fileName,
                                code: file.code,
                                context: null
                            }
                        }));
                    }
                });
            }
        });

        // Background Events
        Bus.on('ZOHO_TAB_DETECTED', (detail) => {
            if (detail.payload && detail.payload.tabId) {
                this.addActiveSession(detail.payload);
            }
        });

        Bus.on('ZOHO_TAB_DISCONNECTED', (detail) => {
            if (detail.payload && detail.payload.tabId) {
                this.removeActiveSession(detail.payload.tabId);
            }
        });

        // Initialize Background sync
        Bus.on('FETCH_ACTIVE_ZOHO_TABS:response', (detail) => {
            const tabs = detail.payload.tabs || [];
            this.activeSessions.clear();
            const listEl = document.getElementById('active-sessions-list');
            if (listEl) listEl.innerHTML = '';

            tabs.forEach(tab => this.addActiveSession(tab));
        });
    }

    async _fetchInitialState() {
        // Request active tabs from Background
        Bus.send('FETCH_ACTIVE_ZOHO_TABS');

        // Fetch offline files from Dexie
        const files = await db.files.toArray();
        const listEl = document.getElementById('local-workspace-list');
        if (!listEl) return;

        listEl.innerHTML = '';
        const fragment = document.createDocumentFragment();

        files.forEach(file => {
            this.localFiles.set(file.id, file);
            const item = document.createElement('div');
            item.className = 'explorer-item';
            item.dataset.fileId = file.id;
            item.innerHTML = `<span class="item-icon">📄</span> <span title="${file.fileName}">${file.fileName}</span>`;
            fragment.appendChild(item);
        });

        listEl.appendChild(fragment);
    }

    addActiveSession(sessionData) {
        this.activeSessions.set(sessionData.tabId, sessionData);
        const listEl = document.getElementById('active-sessions-list');
        if (!listEl) return;

        // Remove placeholder if present
        if (listEl.querySelector('div[style]')) listEl.innerHTML = '';

        // Check if already exists to avoid duplicates
        if (listEl.querySelector(`[data-tab-id="${sessionData.tabId}"]`)) return;

        const item = document.createElement('div');
        item.className = 'explorer-item';
        item.dataset.tabId = sessionData.tabId;

        const contextName = sessionData.context ? sessionData.context.service : 'Zoho';
        const displayTitle = sessionData.title.length > 25 ? sessionData.title.substring(0, 22) + '...' : sessionData.title;

        item.innerHTML = `
            <span class="status-indicator connected"></span>
            <span class="item-icon">⚡</span>
            <span title="${sessionData.title}">[${contextName}] ${displayTitle}</span>
        `;
        listEl.appendChild(item);
    }

    removeActiveSession(tabId) {
        this.activeSessions.delete(tabId);
        const listEl = document.getElementById('active-sessions-list');
        if (!listEl) return;

        const item = listEl.querySelector(`[data-tab-id="${tabId}"]`);
        if (item) {
            item.remove();
        }

        if (this.activeSessions.size === 0) {
            listEl.innerHTML = `<div style="padding: 10px; color: #666; font-style: italic; font-size: 11px;">Waiting for Zoho editors...</div>`;
        }
    }
}
