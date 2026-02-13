// Bridge script for Zoho Deluge IDE
(function() {
function getZohoProduct() {
    const h = window.location.hostname;
    if (h.includes('crm')) return 'crm';
    if (h.includes('creator')) return 'creator';
    if (h.includes('books')) return 'books';
    if (h.includes('recruit')) return 'recruit';
    if (h.includes('flow')) return 'flow';
    return 'generic';
}

function robustClick(el) {
    if (!el) return false;
    try {
        console.log('[ZohoIDE Bridge] Clicking element:', el.tagName, el.id, el.className);

        // Dispatch a sequence of events to mimic real user interaction
        const events = [
            { type: 'mousedown', cls: MouseEvent },
            { type: 'pointerdown', cls: PointerEvent },
            { type: 'mouseup', cls: MouseEvent },
            { type: 'pointerup', cls: PointerEvent },
            { type: 'click', cls: MouseEvent }
        ];

        events.forEach(({ type, cls }) => {
            try {
                const event = new cls(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    buttons: 1
                });
                el.dispatchEvent(event);
            } catch (e) {}
        });

        // If it's a lyte-button or has a specific 'click' attribute (common in Zoho)
        // we might need to trigger its internal handlers if they didn't fire
        if (el.tagName.toLowerCase() === 'lyte-button' && el.executeAction) {
            try { el.executeAction('click', new MouseEvent('click')); } catch(e) {}
        }

        // Final fallback
        if (el.click) el.click();

        return true;
    } catch(e) {
        console.log('[ZohoIDE Bridge] Click error:', e);
        return false;
    }
}

function clickBySelectors(selectors) {
    for (let sel of selectors) {
        try {
            const els = document.querySelectorAll(sel);
            for (let el of els) {
                // Check if visible
                const isVisible = !!(el.offsetParent !== null || el.offsetWidth > 0);
                if (el && isVisible) {
                    if (robustClick(el)) return true;
                }
            }
        } catch(e) {}
    }
    return false;
}

function clickByText(type) {
    const buttons = document.querySelectorAll('button, .lyte-button, a.btn, input[type="button"], input[type="submit"], [role="button"]');
    for (let btn of buttons) {
        if (btn.offsetParent === null && btn.offsetWidth === 0) continue; // Skip hidden
        const txt = (btn.innerText || btn.textContent || btn.value || btn.getAttribute('aria-label') || '').toLowerCase().trim();
        if (type === 'save') {
            if (txt === 'save' || txt === 'update' || txt.includes('save script') || txt.includes('update script') || txt.includes('save & close')) {
                if (robustClick(btn)) return true;
            }
        } else if (type === 'execute') {
            if (txt === 'execute' || txt === 'run' || txt.includes('execute script') || txt.includes('run script')) {
                if (robustClick(btn)) return true;
            }
        }
    }
    return false;
}

const editorCache = new WeakMap();

const Engines = {
    Monaco: {
        isAvailable: () => !!(window.monaco && (window.monaco.editor || window.monaco.languages)),
        getCode: () => {
            try {
                if (!window.monaco || !window.monaco.editor) return null;
                const models = window.monaco.editor.getModels();
                if (!models || models.length === 0) return null;
                // Prefer models with content and relevant language
                let model = models.find(m => m.getValue().length > 0 && (m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript'));
                if (!model) model = models.find(m => m.getValue().length > 0);
                if (!model) model = models[0];
                return model.getValue();
            } catch(e) { console.log('Monaco getCode error:', e); return null; }
        },
        setCode: (code) => {
            try {
                if (!window.monaco || !window.monaco.editor) return false;
                const models = window.monaco.editor.getModels();
                if (!models || models.length === 0) return false;
                let model = models.find(m => m.getLanguageId() === 'deluge' || m.getLanguageId() === 'javascript');
                if (!model) model = models[0];
                model.setValue(code);
                return true;
            } catch(e) { console.log('Monaco setCode error:', e); return false; }
        }
    },
    Ace: {
        isAvailable: () => !!(document.querySelector('.ace_editor, .zace-editor, lyte-ace-editor') || (window.ace && window.ace.edit) || window.ZEditor || window.Zace),
        getCode: () => {
            try {
                // Try ZEditor/Zace first (common in Zoho Creator)
                if (window.ZEditor && window.ZEditor.getValue) return window.ZEditor.getValue();
                if (window.Zace && window.Zace.getValue) return window.Zace.getValue();

                // Try lyte-ace-editor component
                const lyteAce = document.querySelector('lyte-ace-editor');
                if (lyteAce && lyteAce.getEditor) {
                    const ed = lyteAce.getEditor();
                    if (ed && ed.getValue) return ed.getValue();
                }

                const aceEls = document.querySelectorAll('.ace_editor, .zace-editor');
                for (let el of aceEls) {
                    if (el.env && el.env.editor) return el.env.editor.getValue();
                    if (window.ace && window.ace.edit) {
                        try {
                            let editor = editorCache.get(el);
                            if (!editor) {
                                editor = window.ace.edit(el);
                                editorCache.set(el, editor);
                            }
                            return editor.getValue();
                        } catch(e) {}
                    }
                }
                return null;
            } catch(e) { console.log('Ace getCode error:', e); return null; }
        },
        setCode: (code) => {
            try {
                if (window.ZEditor && window.ZEditor.setValue) { window.ZEditor.setValue(code); return true; }
                if (window.Zace && window.Zace.setValue) { window.Zace.setValue(code); return true; }

                const lyteAce = document.querySelector('lyte-ace-editor');
                if (lyteAce && lyteAce.getEditor) {
                    const ed = lyteAce.getEditor();
                    if (ed && ed.setValue) { ed.setValue(code); return true; }
                }

                const aceEls = document.querySelectorAll('.ace_editor, .zace-editor');
                let success = false;
                for (let el of aceEls) {
                    if (el.env && el.env.editor) { el.env.editor.setValue(code); success = true; }
                    else if (window.ace && window.ace.edit) {
                        try {
                            let editor = editorCache.get(el);
                            if (!editor) {
                                editor = window.ace.edit(el);
                                editorCache.set(el, editor);
                            }
                            editor.setValue(code);
                            success = true;
                        } catch(e) {}
                    }
                }
                return success;
            } catch(e) { console.log('Ace setCode error:', e); return false; }
        }
    },
    CodeMirror: {
        isAvailable: () => !!document.querySelector('.CodeMirror'),
        getCode: () => {
            try {
                const cmEls = document.querySelectorAll('.CodeMirror');
                for (let el of cmEls) if (el.CodeMirror) return el.CodeMirror.getValue();
                return null;
            } catch(e) { return null; }
        },
        setCode: (code) => {
            try {
                const cmEls = document.querySelectorAll('.CodeMirror');
                let success = false;
                for (let el of cmEls) if (el.CodeMirror) { el.CodeMirror.setValue(code); success = true; }
                return success;
            } catch(e) { return false; }
        }
    },
    Fallback: {
        isAvailable: () => !!(document.querySelector('[id*="delugeEditor"], .deluge-editor, textarea[id*="script"]')),
        getCode: () => {
            const el = document.querySelector('[id*="delugeEditor"], .deluge-editor, textarea[id*="script"]');
            return el ? el.value || el.innerText : null;
        },
        setCode: (code) => {
            const el = document.querySelector('[id*="delugeEditor"], .deluge-editor, textarea[id*="script"]');
            if (el) {
                el.value = code;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
            return false;
        }
    }
};

function getEditorCode() {
    console.log('[ZohoIDE Bridge] Getting Code...');
    for (let engineName of Object.keys(Engines)) {
        const engine = Engines[engineName];
        if (engine.isAvailable()) {
            const code = engine.getCode();
            if (code !== null) {
                console.log('[ZohoIDE Bridge] Got code from:', engineName);
                return code;
            }
        }
    }
    return null;
}

function setEditorCode(code) {
    console.log('[ZohoIDE Bridge] Setting Code...');
    for (let engineName of Object.keys(Engines)) {
        const engine = Engines[engineName];
        if (engine.isAvailable()) {
            if (engine.setCode(code)) {
                console.log('[ZohoIDE Bridge] Set code using:', engineName);
                return true;
            }
        }
    }
    return false;
}

function extractNameFromCode(code) {
    if (!code) return null;
    // Match common Deluge function patterns: type name(params) { ... }
    // Support namespaces like standalone.test
    const match = code.match(/(?:void|string|int|decimal|list|map|bool|date|datetime|json|file)\s+([a-zA-Z0-9_.]+)\s*\(/i);
    if (match) return match[1];

    // Try to match function name from a line starting with the name followed by = {
    const simpleMatch = code.match(/^\s*([a-zA-Z0-9_.]+)\s*=\s*(?:Map|List|\{)/);
    if (simpleMatch) return simpleMatch[1];

    // Fallback for simple assignment
    const assignmentMatch = code.match(/^\s*([a-zA-Z0-9_.]+)\s*=\s*/);
    return assignmentMatch ? assignmentMatch[1] : null;
}

const CRMConfig = {
    match: (url) => url.includes('crm.zoho'),
    save: ['lyte-button[data-zcqa="functionSavev2"]', 'lyte-button[data-zcqa="functionSavev2"] button', '#crmsave', 'lyte-button[data-zcqa="save"]', '.crm-save-btn'],
    execute: ['span[data-zcqa="delgv2execPlay"]', '#crmexecute', 'lyte-button[data-id="execute"]'],
    getMetadata: () => {
        const urlParams = new URLSearchParams(window.location.search);
        const pathParts = window.location.pathname.split('/');
        // Note: getEditorCode and extractNameFromCode come from scrapers.js (shared scope)
        const code = getEditorCode();
        const codeName = extractNameFromCode(code);

        let orgName = window.ZCRMSession?.orgName || window.ZCRMSession?.orgId || 'global';
        if (pathParts[1] === 'crm') {
            if (pathParts[2] && pathParts[2] !== 'org') orgName = pathParts[2];
            else if (pathParts[2] === 'org' && pathParts[3]) orgName = pathParts[3];
        }

        let titleName = document.title.replace(/Zoho CRM - |Functions - |Zoho - |CRM - /g, '').replace(/-/g, '').trim();
        if (titleName === "" || titleName === "Zoho CRM") titleName = null;

        let functionId = urlParams.get('id') || urlParams.get('wfId') || window.location.href.match(/edit\/(\d+)/)?.[1] || window.location.href.split('id/')[1]?.split('/')[0] || 'unknown';
        if (functionId === 'unknown') {
            const scriptEl = document.querySelector('[id*="scriptId"], [name*="scriptId"], input[name="id"], input#id, input#funcId');
            if (scriptEl) functionId = scriptEl.value || scriptEl.innerText;
        }
        if (functionId === 'unknown' && window.ZCRMSession?.functionId) functionId = window.ZCRMSession.functionId;

        // Advanced Name Detection
        const nameSelectors = [
            '.custom_fn_name', '[data-zcqa="function-name"]', '.fnName', '.fn_name', '#function_name',
            '.bread-crumb-current', '.lyteBreadcrumbItem.active', '.crm-fn-name'
        ];
        let domName = null;
        for (const sel of nameSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim()) { domName = el.innerText.trim(); break; }
        }

        const finalName = codeName || domName || titleName || 'Untitled CRM';

        if (functionId === 'unknown' && finalName !== 'Untitled CRM') {
            functionId = 'name:' + finalName;
        }

        return {
            system: 'CRM',
            orgId: orgName.toString().toLowerCase(),
            functionId: functionId,
            functionName: finalName,
            folder: document.querySelector('.breadcrumb-item.active, .lyteBreadcrumbItem.active')?.innerText || 'Functions'
        };
    }
};

const CreatorConfig = {
    match: (url) => url.includes('creator.zoho') || url.includes('creatorapp.zoho') || url.includes('creatorportal.zoho'),
    save: ['input#saveFuncBtn', 'input[elename="saveFunction"]', 'lyte-button[data-zcqa="save"]', '.zc-save-btn', 'button.save-btn'],
    execute: ['input#executeFuncBtn', 'input[elename="executeFunction"]', 'lyte-button[data-zcqa="execute"]', '.zc-execute-btn', 'button.run-btn'],
    getMetadata: () => {
        const pathParts = window.location.pathname.split('/');
        let appIdx = pathParts.indexOf('app');
        const ownerName = window.ZCApp?.ownerName || (appIdx !== -1 ? pathParts[appIdx-1] : pathParts[1]);
        const appName = window.ZCApp?.appName || (appIdx !== -1 ? pathParts[appIdx+1] : pathParts[2]);
        const code = getEditorCode();
        const codeName = extractNameFromCode(code);

        let titleName = document.title.replace(/^\(\d+\)\s*/, '').split(' - ')[0].trim();
        if (titleName.toLowerCase().includes("zoho creator")) titleName = null;

        let functionId = (appName ? appName + ":" : "") + (window.location.hash || 'unknown');
        if (functionId.endsWith('unknown')) {
            const workflowId = document.querySelector('[data-workflowid], [data-id]')?.getAttribute('data-workflowid') || document.querySelector('[data-id]')?.getAttribute('data-id');
            if (workflowId) functionId = (appName ? appName + ":" : "") + workflowId;
        }
        if (functionId.endsWith('unknown') && codeName) {
            functionId = (appName ? appName + ":" : "") + 'name:' + codeName;
        }

        return {
            system: 'Creator',
            orgId: (ownerName || 'global').toLowerCase(),
            functionId: functionId,
            functionName: codeName || document.querySelector('.zc-func-name, .zc-workflow-name')?.innerText || titleName || 'Untitled Creator',
            folder: appName || 'General'
        };
    }
};

const FlowConfig = {
    match: (url) => url.includes('flow.zoho'),
    save: ['input[value="Save"].zf-green-btn', 'input[value="Save"]'],
    execute: ['input[value="Execute"].zf-green-o-btn', 'input[value="Execute"]'],
    getMetadata: () => {
        const url = window.location.href;
        const pathParts = window.location.pathname.split('/');
        const flowId = url.split('/flow/')[1]?.split('/')[0];
        const code = getEditorCode();
        const codeName = extractNameFromCode(code);

        let orgName = window.zf_org_id || 'global';
        if (pathParts[1] === 'flow' && pathParts[2] && isNaN(pathParts[2])) {
            orgName = pathParts[2];
        }

        return {
            system: 'Flow',
            orgId: orgName.toString().toLowerCase(),
            functionId: flowId || 'unknown',
            functionName: codeName || document.querySelector('.zf-flow-name')?.innerText || 'Untitled Flow',
            folder: 'My Flows'
        };
    }
};

const BooksConfig = {
    match: (url) => url.includes('books.zoho'),
    save: ['#save_script', '.save-btn', 'input[value="Save"]'],
    execute: ['#execute_script', '.execute-btn'],
    getMetadata: () => {
        // Basic metadata for books
        return {
            system: 'Books',
            orgId: 'global', // TODO: improve org detection
            functionId: window.location.hash || window.location.pathname,
            functionName: document.title,
            folder: 'General'
        };
    }
};

const GenericConfig = {
    match: () => true,
    save: ['#save_script', '#save_btn', 'input[value="Save"]', 'input[value="Update"]'],
    execute: ['#execute_script', '#run_script', 'input[value="Execute"]', 'input[value="Run"]'],
    getMetadata: () => {
        return {
            system: 'Zoho',
            orgId: 'global',
            functionId: window.location.pathname,
            functionName: document.title,
            folder: 'General'
        };
    }
};


console.log('[ZohoIDE Bridge] Modular Bridge Initialized');

const ProductConfigs = {
    crm: CRMConfig,
    creator: CreatorConfig,
    flow: FlowConfig,
    books: BooksConfig,
    generic: GenericConfig
};

function getCurrentConfig() {
    const url = window.location.href;
    // Try to match by URL first (more accurate than hostname in some cases)
    for (const [key, config] of Object.entries(ProductConfigs)) {
        if (config.match && config.match(url)) return { name: key, config };
    }
    return { name: 'generic', config: GenericConfig };
}

function triggerAction(type) {
    const { name, config } = getCurrentConfig();
    console.log(`[ZohoIDE Bridge] Triggering ${type} for ${name}`);

    let success = false;
    const selectors = config[type];
    if (selectors && selectors.length > 0) {
        success = clickBySelectors(selectors);
    }

    if (!success) {
        console.log(`[ZohoIDE Bridge] Selector click failed, trying text fallback...`);
        success = clickByText(type);
    }

    return success;
}

window.addEventListener('ZOHO_IDE_FROM_EXT', async (event) => {
    const data = event.detail;
    if (!data || !data.action) return;

    let response = {};
    const { action, eventId } = data;

    try {
        if (action === 'PING') {
            const { name } = getCurrentConfig();
            response = { status: 'PONG', product: name };
        }
        else if (action === 'GET_ZOHO_CODE') {
            const code = getEditorCode();
            if (code !== null) response = { code };
            else response = { error: 'No code found' };
        }
        else if (action === 'SET_ZOHO_CODE') {
            const success = setEditorCode(data.code);
            response = { success };
        }
        else if (action === 'SAVE_ZOHO_CODE') {
            response = { success: triggerAction('save') };
        }
        else if (action === 'EXECUTE_ZOHO_CODE') {
            response = { success: triggerAction('execute') };
        }
        else if (action === 'GET_ZOHO_METADATA') {
            const { config } = getCurrentConfig();
            if (config.getMetadata) {
                response = config.getMetadata();
            } else {
                response = GenericConfig.getMetadata();
            }
            // Add extra info
            response.url = window.location.href;
            response.title = document.title;
        }
    } catch (e) {
        console.error('[ZohoIDE Bridge] Error handling action:', action, e);
        response = { error: e.message };
    }

    window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
        detail: { eventId, action, response }
    }));
});

})();
