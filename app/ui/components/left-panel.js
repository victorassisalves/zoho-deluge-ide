import { Icons } from '../icons.js';

export function renderLeftPanel() {
    return `
        <!-- Explorer View -->
        <div id="view-explorer" class="view-content active">
            <h4 style="display: flex; justify-content: space-between; align-items: center;">
                Explorer
                <span id="create-ws-btn" class="sidebar-btn" style="cursor: pointer; font-size: 16px; margin-right: 10px;" title="New Workspace">${Icons.create_new_folder}</span>
            </h4>
            <div id="saved-files-list" class="explorer-tree">
                <!-- File Explorer Rendered via JS -->
            </div>
        </div>

        <!-- Cloud View -->
        <div id="view-cloud" class="view-content">
            <h4>Cloud Workspaces</h4>
            <div id="cloud-auth-section">
                <div id="auth-logged-out">
                    <input type="email" id="auth-email" placeholder="Email" class="cloud-input">
                    <input type="password" id="auth-password" placeholder="Password" class="cloud-input">
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <button id="auth-login-btn" class="cloud-btn">Login</button>
                        <button id="auth-signup-btn" class="cloud-btn">Sign Up</button>
                    </div>
                </div>
                <div id="auth-logged-in" style="display:none;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span id="user-display" style="font-size:11px; opacity:0.8;"></span>
                        <button id="auth-logout-btn" style="background:transparent; border:none; color:#ff79c6; cursor:pointer; font-size:10px;">Logout</button>
                    </div>
                    <div id="org-display" style="font-size:12px; font-weight:bold; margin-top:5px; color:#50fa7b;"></div>
                </div>
            </div>
            <hr style="border:0; border-top:1px solid var(--md-sys-color-outline); margin:15px 0;">
            <div id="cloud-hierarchy-section" style="display:none;">
                <div class="hierarchy-level"><label>Team</label><select id="team-selector" class="cloud-select"></select><button id="create-team-btn" class="mini-btn">+</button></div>
                <div class="hierarchy-level"><label>Workspace</label><select id="workspace-selector" class="cloud-select"></select><button id="create-workspace-btn" class="mini-btn">+</button></div>
                <div class="hierarchy-level"><label>Project</label><select id="project-selector" class="cloud-select"></select><button id="create-project-btn" class="mini-btn">+</button></div>
                <div class="hierarchy-level" style="flex-direction:column; align-items:flex-start;">
                    <label style="width:100%;">Files</label>
                    <div id="cloud-file-list" class="cloud-list"></div>
                    <button id="create-file-btn" class="cloud-btn" style="width:100%; margin-top:5px;">+ New Cloud File</button>
                </div>
            </div>
        </div>

        <!-- AI Agent View -->
        <div id="view-ai-agent" class="view-content">
            <div class="ai-agent-tabs">
                <div class="ai-tab active" data-agent="planning">Planning</div>
                <div class="ai-tab" data-agent="architecture">Architecture</div>
            </div>

            <!-- Planning Agent -->
            <div id="agent-planning-view" class="agent-view active">
                <h4>Planning Agent</h4>
                <div class="ai-input-area">
                    <textarea id="ai-research-goal" placeholder="Describe the task for deep research... (Ctrl+Enter to start)"></textarea>
                    <div class="ai-controls">
                        <button id="ai-research-btn" class="primary-btn" style="width: 100%;">Start Research</button>
                    </div>
                </div>
                <div id="research-progress-container" style="display:none; margin-top:10px;">
                    <div class="progress-label">Researching... <span id="research-percent">0%</span></div>
                    <div class="progress-bar-bg">
                        <div id="research-progress-fill" class="progress-bar-fill"></div>
                    </div>
                    <div id="research-status-text" style="font-size:10px; color:var(--md-sys-color-on-surface-variant); margin-top:4px;">Initializing...</div>
                </div>
                <div id="research-result-container" style="display:none; margin-top:15px; flex-direction: column; flex-grow: 1;">
                    <label style="font-size:11px; color:var(--md-sys-color-on-surface-variant);">Research Report (Review & Edit):</label>
                    <textarea id="research-report-edit" class="report-editor"></textarea>
                    <div class="handoff-controls" style="display:flex; gap:10px; margin-top:10px;">
                        <button id="ai-redo-plan-btn" class="secondary-btn" style="flex:1;">Redo Plan</button>
                        <button id="ai-build-this-btn" class="primary-btn" style="flex:1;">Build This</button>
                    </div>
                </div>
            </div>

            <!-- Architecture Agent -->
            <div id="agent-architecture-view" class="agent-view">
                <h4>Architecture Agent</h4>
                <div id="arch-plan-summary" class="plan-summary-box" style="background:var(--md-sys-color-surface-hover); padding:8px; border-radius:4px; font-size:11px; margin-bottom:10px; border-left:3px solid var(--md-sys-color-tertiary);">
                    <span style="opacity:0.5;">No active plan. Use the Planning Agent first.</span>
                </div>
                <div id="ai-chat-container" style="flex-grow: 1; display: flex; flex-direction: column;">
                    <div id="ai-chat-history" style="flex-grow: 1;">
                        <div class="chat-msg ai">I'm ready to build your solution based on the plan.</div>
                    </div>
                    <div class="ai-input-area">
                        <textarea id="ai-question" placeholder="Refine or ask about the code..."></textarea>
                        <button id="ai-ask-btn" class="primary-btn">Ask Architect</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Zoho APIs View -->
        <div id="view-zoho-apis" class="view-content">
            <h4>Zoho API Reference</h4>
            <div class="api-explorer-header">
                <select id="sidebar-api-product-selector" class="api-select">
                    <option value="crm">Zoho CRM (V8)</option>
                    <option value="books">Zoho Books (V3)</option>
                    <option value="creator">Zoho Creator (V2.1)</option>
                    <option value="recruit">Zoho Recruit (V2)</option>
                </select>
                <input type="text" id="sidebar-api-search" placeholder="Search APIs..." class="api-search-input">
            </div>
            <div id="sidebar-api-results-list" class="api-list">
                <!-- API references will be populated here -->
            </div>
        </div>

        <!-- Snippets View -->
        <div id="view-snippets" class="view-content">
            <h4>Deluge Snippets</h4>
            <div class="snippets-container" style="font-size:12px;">

                        <div class="snippet-group">
                            <h5>Map Manipulation</h5>
                            <div class="snippet-btn" data-snippet="map">create map</div>
                            <div class="snippet-btn" data-snippet="put">put</div>
                            <div class="snippet-btn" data-snippet="put_all">put all keys</div>
                            <div class="snippet-btn" data-snippet="remove_key">remove key</div>
                            <div class="snippet-btn" data-snippet="clear_map">clear map</div>
                            <div class="snippet-btn" data-snippet="get">get value</div>
                            <div class="snippet-btn" data-snippet="keys">get keys</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Collection (Native)</h5>
                            <div class="snippet-btn" data-snippet="collection_create">create collection</div>
                            <div class="snippet-btn" data-snippet="collection_insert">insert</div>
                            <div class="snippet-btn" data-snippet="collection_get">get</div>
                            <div class="snippet-btn" data-snippet="collection_insert_all">insertAll</div>
                            <div class="snippet-btn" data-snippet="collection_update">update</div>
                            <div class="snippet-btn" data-snippet="collection_delete">delete</div>
                            <div class="snippet-btn" data-snippet="collection_keys">keys</div>
                            <div class="snippet-btn" data-snippet="collection_values">values</div>
                            <div class="snippet-btn" data-snippet="collection_contains_key">contains key</div>
                            <div class="snippet-btn" data-snippet="collection_contains_value">contains value</div>
                            <div class="snippet-btn" data-snippet="collection_clear">clear</div>
                            <div class="snippet-btn" data-snippet="collection_sort">sort value</div>
                            <div class="snippet-btn" data-snippet="collection_is_empty">is empty</div>
                            <div class="snippet-btn" data-snippet="collection_size">size</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Web Data</h5>
                            <div class="snippet-btn" data-snippet="zoho_integration">zoho integration</div>
                            <div class="snippet-btn" data-snippet="other_integration">other integration</div>
                            <div class="snippet-btn" data-snippet="get_url">get url</div>
                            <div class="snippet-btn" data-snippet="post_url">post url</div>
                            <div class="snippet-btn" data-snippet="invoke_url">invoke url</div>
                            <div class="snippet-btn" data-snippet="open_url">open url</div>
                            <div class="snippet-btn" data-snippet="invoke_api">invoke API</div>
                            <div class="snippet-btn" data-snippet="ftp">FTP/SFTP</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Xml Manipulation</h5>
                            <div class="snippet-btn" data-snippet="xpath">execute XPath</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Condition</h5>
                            <div class="snippet-btn" data-snippet="if">if</div>
                            <div class="snippet-btn" data-snippet="else if">else if</div>
                            <div class="snippet-btn" data-snippet="else">else</div>
                            <div class="snippet-btn" data-snippet="conditional if">conditional if</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Data Access (Creator)</h5>
                            <div style="margin-bottom:10px; display:flex; flex-direction:column; gap:5px; border-bottom:1px solid var(--md-sys-color-outline); padding-bottom:10px;">
                                <button id="fetch-creator-forms-btn" class="mini-btn" style="width:100%; font-size:10px;">Fetch Creator Forms</button>
                                <select id="creator-form-selector" class="cloud-select" style="width:100%; display:none;"></select>
                            </div>
                            <div class="snippet-btn" data-snippet="insert">add record</div>
                            <div class="snippet-btn" data-snippet="fetch">fetch records</div>
                            <div class="snippet-btn" data-snippet="aggregate">aggregate records</div>
                            <div class="snippet-btn" data-snippet="update">update record</div>
                            <div class="snippet-btn" data-snippet="update_multiple">update multiple fields</div>
                            <div class="snippet-btn" data-snippet="for each">for each record</div>
                            <div class="snippet-btn" data-snippet="delete">delete records</div>
                        </div>
                        <div class="snippet-group">
                            <h5>List Manipulation</h5>
                            <div class="snippet-btn" data-snippet="list">create list</div>
                            <div class="snippet-btn" data-snippet="add">add</div>
                            <div class="snippet-btn" data-snippet="remove">remove index</div>
                            <div class="snippet-btn" data-snippet="remove_element">remove element</div>
                            <div class="snippet-btn" data-snippet="add_all">add all | remove all</div>
                            <div class="snippet-btn" data-snippet="clear">clear list</div>
                            <div class="snippet-btn" data-snippet="sort">sort</div>
                            <div class="snippet-btn" data-snippet="for_each_element">for each element</div>
                            <div class="snippet-btn" data-snippet="for_each_index">for each index</div>
                            <div class="snippet-btn" data-snippet="list_get">get element</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Miscellaneous</h5>
                            <div class="snippet-btn" data-snippet="variable">set variable</div>
                            <div class="snippet-btn" data-snippet="function">call function</div>
                            <div class="snippet-btn" data-snippet="mail">send mail</div>
                            <div class="snippet-btn" data-snippet="add_comment">add comment</div>
                            <div class="snippet-btn" data-snippet="return">return</div>
                            <div class="snippet-btn" data-snippet="info">info (debug)</div>
                        </div>

                        <div class="snippet-group">
                            <h5>Date Manipulation</h5>
                            <div class="snippet-btn" data-snippet="today">today</div>
                            <div class="snippet-btn" data-snippet="now">now</div>
                            <div class="snippet-btn" data-snippet="current_date">current date</div>
                            <div class="snippet-btn" data-snippet="add_day">add day</div>
                            <div class="snippet-btn" data-snippet="add_month">add month</div>
                            <div class="snippet-btn" data-snippet="date_format">format date</div>
                            <div class="snippet-btn" data-snippet="date_diff">date diff</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Loops & Flow</h5>
                            <div class="snippet-btn" data-snippet="for_each_element">for each (list)</div>
                            <div class="snippet-btn" data-snippet="for each">for each (form)</div>
                            <div class="snippet-btn" data-snippet="while">while loop</div>
                            <div class="snippet-btn" data-snippet="info">info</div>
                            <div class="snippet-btn" data-snippet="info_var">info with var</div>
                        </div>
                        <div class="snippet-group">
                            <h5>Advanced Integrations</h5>
                            <div class="snippet-btn" data-snippet="coql">CRM COQL Query</div>
                            <div class="snippet-btn" data-snippet="invoke_url">invokeurl (base)</div>
                        </div>
            </div>
        </div>

        <!-- My Snippets View -->
        <div id="view-my-snippets" class="view-content">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4>My Snippets</h4>
                <div style="display:flex; gap:5px;">
                    <button id="add-my-snippet-btn" class="mini-btn" title="Add Snippet" style="background:var(--md-sys-color-primary);">${Icons.add}</button>
                    <button id="export-snippets-btn" class="mini-btn" title="Export Snippets">${Icons.file_download}</button>
                    <button id="import-snippets-btn" class="mini-btn" title="Import Snippets">${Icons.file_upload}</button>
                </div>
            </div>
            <div class="search-container" style="margin-bottom:10px;">
                <input type="text" id="my-snippets-search" placeholder="Search snippets..." class="cloud-input">
            </div>
            <div id="my-snippets-list" class="snippets-container">
                <div style="font-size:11px; opacity:0.5; text-align:center; margin-top:20px;">No snippets found. Click the + icon to add your first snippet.</div>
            </div>
        </div>

        <!-- Settings View -->
        <div id="view-settings" class="view-content">
            <h4>Settings</h4>
            <div class="setting-item">
                <label style="font-size:12px; margin-bottom:4px;">Gemini Model:</label>
                <select id="gemini-model" class="cloud-select">
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Latest)</option>
                    <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Experimental)</option>
                    <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Most Powerful)</option>
                </select>
            </div>
            <div class="setting-item" style="margin-top:10px;">
                <label style="font-size:12px; margin-bottom:4px;">Gemini API Key:</label>
                <input type="password" id="gemini-api-key" placeholder="AIZA..." class="cloud-input">
                <button id="save-settings-btn" class="primary-btn" style="margin-top:10px;">Save Configuration</button>
            </div>
            <div class="setting-item" style="margin-top:20px; margin-bottom:15px;">
                <label style="font-size:12px; margin-bottom:4px;">Activation Shortcut Behavior:</label>
                <select id="activation-behavior" class="cloud-select">
                    <option value="new-tab">Open in New Tab</option>
                    <option value="side-panel">Open in Side Panel (if on Zoho)</option>
                    <option value="smart">Smart (Side Panel if on Zoho, else New Tab)</option>
                </select>
            </div>
            <div class="setting-item">
                <label style="font-size:12px; margin-bottom:4px;">Editor Theme:</label>
                <select id="theme-selector" class="cloud-select">
                    <option value="vs-dark">Dark (Default)</option>
                    <option value="dracula">Dracula</option>
                    <option value="vs-light">Light</option>
                </select>
            </div>
            <div class="setting-item" style="margin-top:15px;">
                <label style="font-size:12px; margin-bottom:4px;">Editor Font Size:</label>
                <input type="text" id="editor-font-size" placeholder="14" class="cloud-input">
            </div>
        </div>
    `;
}
