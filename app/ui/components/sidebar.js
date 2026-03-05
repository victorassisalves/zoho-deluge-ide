import { Icons } from '../icons.js';

export function renderSidebar() {
    return `
        <div class="sidebar-item active" data-view="explorer" title="Explorer">${Icons.folder}</div>
        <div class="sidebar-item" data-view="cloud" title="Workspaces">${Icons.cloud}</div>
        <div class="sidebar-item" data-view="ai-agent" title="AI Agent">${Icons.psychology}</div>
        <div class="sidebar-item" data-view="zoho-apis" title="Zoho APIs">${Icons.api}</div>
        <div class="sidebar-item" data-view="snippets" title="Snippets">${Icons.description}</div>
        <div class="sidebar-item" data-view="my-snippets" title="My Snippets">${Icons.bookmarks}</div>
        <div class="sidebar-item" data-view="extensions" title="Extensions" style="display: none;">${Icons.extension}</div>
        <div class="sidebar-item" data-view="settings" title="Settings">${Icons.settings}</div>
    `;
}
