// Bridge script for Zoho Deluge IDE
(function() {
    const log = (...args) => console.log('[ZohoIDE Bridge]', ...args);

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
                } catch(e) { log('Monaco getCode error:', e); return null; }
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
                } catch(e) { log('Monaco setCode error:', e); return false; }
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
                            try { return window.ace.edit(el).getValue(); } catch(e) {}
                        }
                    }
                    return null;
                } catch(e) { log('Ace getCode error:', e); return null; }
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
                            try { window.ace.edit(el).setValue(code); success = true; } catch(e) {}
                        }
                    }
                    return success;
                } catch(e) { log('Ace setCode error:', e); return false; }
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

    const Products = {
        flow: {
            match: (url) => url.includes('flow.zoho'),
            save: ['input[value="Save"].zf-green-btn', 'input[value="Save"]'],
            execute: ['input[value="Execute"].zf-green-o-btn', 'input[value="Execute"]'],
            getMetadata: () => {
                const url = window.location.href;
                const pathParts = window.location.pathname.split('/');
                const flowId = url.split('/flow/')[1]?.split('/')[0];
                const code = Engines.Monaco.getCode() || Engines.Ace.getCode() || Engines.CodeMirror.getCode();
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
        },
        creator: {
            match: (url) => url.includes('creator.zoho') || url.includes('creatorapp.zoho') || url.includes('creatorportal.zoho'),
            save: ['input#saveFuncBtn', 'input[elename="saveFunction"]', 'lyte-button[data-zcqa="save"]', '.zc-save-btn', 'button.save-btn'],
            execute: ['input#executeFuncBtn', 'input[elename="executeFunction"]', 'lyte-button[data-zcqa="execute"]', '.zc-execute-btn', 'button.run-btn'],
            getMetadata: () => {
                const pathParts = window.location.pathname.split('/');
                const ownerName = window.ZCApp?.ownerName || pathParts[1];
                const appName = window.ZCApp?.appName || pathParts[2];
                const code = Engines.Monaco.getCode() || Engines.Ace.getCode() || Engines.CodeMirror.getCode();
                const codeName = extractNameFromCode(code);

                let titleName = document.title.replace(/^\(\d+\)\s*/, '').split(' - ')[0].trim();
                if (titleName.toLowerCase().includes("zoho creator")) titleName = null;

                let functionId = (appName ? appName + ":" : "") + (window.location.hash || 'unknown');
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
        },
        crm: {
            match: (url) => url.includes('crm.zoho'),
            save: ['lyte-button[data-zcqa="functionSavev2"]', 'lyte-button[data-zcqa="functionSavev2"] button', '#crmsave', 'lyte-button[data-zcqa="save"]', '.crm-save-btn'],
            execute: ['span[data-zcqa="delgv2execPlay"]', '#crmexecute', 'lyte-button[data-id="execute"]'],
            getMetadata: () => {
                const urlParams = new URLSearchParams(window.location.search);
                const pathParts = window.location.pathname.split('/');
                const code = Engines.Monaco.getCode() || Engines.Ace.getCode() || Engines.CodeMirror.getCode();
                const codeName = extractNameFromCode(code);

                let orgName = window.ZCRMSession?.orgId || 'global';
                if (pathParts[1] === 'crm' && pathParts[2] && pathParts[2] !== 'org' && isNaN(pathParts[2])) {
                    orgName = pathParts[2];
                }

                let titleName = document.title.replace(/Zoho CRM - |Functions - |Zoho - |CRM - /g, '').replace(/-/g, '').trim();
                if (titleName === "" || titleName === "Zoho CRM") titleName = null;

                let functionId = urlParams.get('id') || window.location.href.split('id/')[1]?.split('/')[0] || 'unknown';
                if (functionId === 'unknown') {
                    const scriptEl = document.querySelector('[id*="scriptId"], [name*="scriptId"]');
                    if (scriptEl) functionId = scriptEl.value || scriptEl.innerText;
                }

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
        },
        generic: {
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
        }
    };

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

    function robustClick(el) {
        if (!el) return false;
        try {
            log('Clicking element:', el.tagName, el.id, el.className);

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

            return true;
        } catch(e) {
            log('Click error:', e);
            return false;
        }
    }

    function triggerAction(type) {
        const url = window.location.href;
        log(`Triggering ${type} for URL: ${url}`);
        let productMatch = Object.entries(Products).find(([name, p]) => p.match && p.match(url));
        let product = productMatch ? productMatch[1] : Products.generic;
        let productName = productMatch ? productMatch[0] : 'generic';

        log(`Detected product: ${productName}`);
        const selectors = product[type] || [];

        for (let sel of selectors) {
            const els = document.querySelectorAll(sel);
            log(`Checking selector: ${sel}, found ${els.length} elements`);
            for (let el of els) {
                const isVisible = !!(el.offsetParent !== null || el.offsetWidth > 0);
                log(`Element ${el.tagName} visible: ${isVisible}`);
                if (el && isVisible) {
                    if (robustClick(el)) {
                        log(`${type} action successful with selector: ${sel}`);
                        return true;
                    }
                }
            }
        }

        // Text-based fallback
        const candidates = document.querySelectorAll('button, input[type="button"], input[type="submit"], .lyte-button, [role="button"]');
        for (let el of candidates) {
            if (el.offsetParent === null && el.offsetWidth === 0) continue;
            const txt = (el.innerText || el.textContent || el.value || '').toLowerCase().trim();
            if (type === 'save' && (txt === 'save' || txt === 'update' || txt.includes('save script'))) return robustClick(el);
            if (type === 'execute' && (txt === 'execute' || txt === 'run' || txt.includes('execute script'))) return robustClick(el);
        }
        return false;
    }

    log('Bridge initialized in frame:', window.location.href);

    window.addEventListener('ZOHO_IDE_FROM_EXT', async (event) => {
        const data = event.detail;
        if (!data || !data.action) return;

        let response = {};
        const { action, eventId } = data;

        if (action === 'GET_ZOHO_CODE') {
            log('GET_ZOHO_CODE requested');
            let found = false;
            for (let engineName of Object.keys(Engines)) {
                const engine = Engines[engineName];
                if (engine.isAvailable()) {
                    log('Engine available:', engineName);
                    const code = engine.getCode();
                    if (code !== null) {
                        log('Code retrieved from:', engineName, 'Length:', code.length);
                        response = { code };
                        found = true;
                        break;
                    } else {
                        log('Engine', engineName, 'returned null code');
                    }
                }
            }
            if (!found) {
                log('No editor engine found or returned code');
                response = { error: 'No editor found' };
            }
        } else if (action === 'SET_ZOHO_CODE') {
            log('SET_ZOHO_CODE requested');
            let success = false;
            for (let engineName of Object.keys(Engines)) {
                const engine = Engines[engineName];
                if (engine.isAvailable()) {
                    if (engine.setCode(data.code)) {
                        log('Code set successfully using:', engineName);
                        success = true;
                        break;
                    }
                }
            }
            // Give the editor a moment to process the change before returning
            if (success) await new Promise(r => setTimeout(r, 100));
            response = { success };
        } else if (action === 'SAVE_ZOHO_CODE') {
            log('SAVE_ZOHO_CODE requested');
            response = { success: triggerAction('save') };
        } else if (action === 'EXECUTE_ZOHO_CODE') {
            log('EXECUTE_ZOHO_CODE requested');
            response = { success: triggerAction('execute') };
        } else if (action === 'GET_ZOHO_METADATA') {
            log('GET_ZOHO_METADATA requested');
            const url = window.location.href;
            let productMatch = Object.entries(Products).find(([name, p]) => p.match && p.match(url));
            let product = productMatch ? productMatch[1] : Products.generic;
            response = product.getMetadata ? product.getMetadata() : Products.generic.getMetadata();
            response.url = url;
            response.title = document.title;
        } else if (action === 'PING') {
            response = { status: 'PONG' };
        }

        window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
            detail: { eventId, action, response }
        }));
    });
})();
