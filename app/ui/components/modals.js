import { Icons } from '../icons.js';

export function renderModals() {
    return `
        <!-- JSON Input Modal -->
        <div id="interface-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-title">Convert JSON to Deluge Map</h3>
                    <span id="modal-close" style="cursor:pointer; opacity:0.6; display:flex;">
                        ${Icons.close}
                    </span>
                </div>
                <div class="modal-body">
                    <div id="modal-var-container" class="input-group">
                        <label>Variable Name:</label>
                        <input type="text" id="interface-var-name" value="payload" placeholder="e.g. customer_data">
                    </div>
                    <div class="input-group">
                        <label>JSON Content:</label>
                        <div class="textarea-container">
                            <textarea id="interface-input" placeholder='{"key": "value"}'></textarea>
                            <div class="textarea-actions">
                                <button id="modal-paste" class="mini-action-btn" title="Paste from clipboard">
                                    ${Icons.content_paste}
                                </button>
                                <button id="modal-fix-json" class="mini-action-btn fix-btn" title="Fix and Format JSON" style="display:none;">
                                    ${Icons.auto_fix_high}
                                </button>
                            </div>
                        </div>
                        <div id="modal-json-status"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="footer-left"></div>
                    <div class="footer-right">
                        <button id="modal-cancel" class="text-btn">Cancel</button>
                        <button id="modal-convert" class="primary-btn">Convert & Insert</button>
                        <button id="modal-map-only" class="success-btn" style="display:none;">Save Mapping</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Snippet Management Modal -->
        <div id="snippet-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="snippet-modal-title">Add Snippet</h3>
                    <span id="snippet-modal-close" style="cursor:pointer; opacity:0.6; display:flex;">
                        ${Icons.close}
                    </span>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label>Snippet Name:</label>
                        <input type="text" id="snippet-name" placeholder="e.g. My Custom Loop">
                    </div>
                    <div class="input-group">
                        <label>Trigger Name (trigger via /name):</label>
                        <input type="text" id="snippet-trigger" placeholder="e.g. myloop">
                    </div>
                    <div class="input-group">
                        <label>Category:</label>
                        <input type="text" id="snippet-category" placeholder="e.g. Loops" list="category-list">
                        <datalist id="category-list"></datalist>
                    </div>
                    <div class="input-group">
                        <label>Code (Supports \${1:placeholder}):</label>
                        <div id="snippet-code-editor" style="height:250px; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 4px; overflow: hidden;"></div>
                    </div>
                    <div class="input-group">
                        <label>Comments:</label>
                        <input type="text" id="snippet-comments" placeholder="Optional notes about this snippet">
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="footer-right">
                        <button id="snippet-modal-cancel" class="text-btn">Cancel</button>
                        <button id="snippet-modal-save" class="primary-btn">Save Snippet</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab Selection Modal -->
        <div id="tab-selection-modal" class="modal-overlay" style="display:none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: var(--md-sys-color-surface); padding: 20px; border-radius: 8px; width: 400px; max-height: 80vh; display: flex; flex-direction: column;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3>Select Zoho Tab</h3>
                    <span id="tab-selection-close" style="cursor:pointer; opacity:0.6; display:flex;">
                        ${Icons.close}
                    </span>
                </div>
                <div class="modal-body" style="overflow-y: auto; flex-grow: 1;">
                    <ul id="tab-selection-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;">
                    </ul>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; margin-top: 15px;">
                    <div class="footer-right">
                        <button id="tab-selection-cancel" class="text-btn">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
