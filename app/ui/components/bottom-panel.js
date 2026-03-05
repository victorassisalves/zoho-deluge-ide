import { Icons } from '../icons.js';

export function renderBottomPanel() {
    return `
        <div class="panel-header">
            <div class="tab active" data-target="console-output">
                ${Icons.terminal} Console
            </div>
            <div class="tab" data-target="problems-output">
                ${Icons.error_outline} Problems
            </div>
            <div class="tab" data-target="docs-output">
                ${Icons.help_outline} Docs
            </div>

            <div class="panel-actions">
                <button id="clear-console">Clear</button>
            </div>
        </div>
        <div id="panel-body">
            <div id="console-output" class="panel-content active">
                <div class="log-entry system">Welcome to Deluge IDE.</div>
            </div>
            <div id="problems-output" class="panel-content">
                <div id="problems-list">
                    <div class="log-entry">No problems detected.</div>
                </div>
            </div>
            <div id="docs-output" class="panel-content">
                <div class="docs-search-container" style="padding:10px; background:var(--md-sys-color-surface); position:sticky; top:0; z-index:10;">
                    <input type="text" id="docs-search" placeholder="Search methods..." style="width:100%; padding:8px; background:var(--md-sys-color-surface-hover); border:1px solid var(--md-sys-color-outline); color:var(--md-sys-color-on-surface); border-radius:var(--md-sys-shape-corner-small);">
                </div>
                <div id="docs-resources-list">
                     <div class="resource-section"><h5>String Methods</h5><ul><li>length()</li><li>subString(start, end)</li><li>indexOf(str)</li><li>startsWith(prefix)</li><li>toLowerCase()</li><li>toUpperCase()</li><li>trim()</li><li>toList(delim)</li></ul></div>
                     <div class="resource-section"><h5>List Methods</h5><ul><li>add(val)</li><li>addAll(list)</li><li>get(index)</li><li>size()</li><li>isEmpty()</li><li>remove(index)</li><li>contains(val)</li></ul></div>
                     <div class="resource-section"><h5>Map Methods</h5><ul><li>put(key, val)</li><li>get(key)</li><li>getJSON(key)</li><li>keys()</li><li>remove(key)</li><li>clear()</li></ul></div>
                </div>
            </div>
        </div>
    `;
}
