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
            execute: ['input[value="Execute"].zf-green-o-btn', 'input[value="Execute"]']
        },
        creator: {
            match: (url) => url.includes('creator.zoho') || url.includes('creatorapp.zoho') || url.includes('creatorportal.zoho'),
            save: ['input#saveFuncBtn', 'input[elename="saveFunction"]', 'lyte-button[data-zcqa="save"]', '.zc-save-btn', 'button.save-btn'],
            execute: ['input#executeFuncBtn', 'input[elename="executeFunction"]', 'lyte-button[data-zcqa="execute"]', '.zc-execute-btn', 'button.run-btn']
        },
        crm: {
            match: (url) => url.includes('crm.zoho'),
            save: ['lyte-button[data-zcqa="functionSavev2"]', 'lyte-button[data-zcqa="functionSavev2"] button', '#crmsave', 'lyte-button[data-zcqa="save"]', '.crm-save-btn'],
            execute: ['span[data-zcqa="delgv2execPlay"]', '#crmexecute', 'lyte-button[data-id="execute"]']
        },
        generic: {
            match: () => true,
            save: ['#save_script', '#save_btn', 'input[value="Save"]', 'input[value="Update"]'],
            execute: ['#execute_script', '#run_script', 'input[value="Execute"]', 'input[value="Run"]']
        }
    };

    function robustClick(el) {
        if (!el) return false;
        try {
            log('Clicking element:', el.tagName, el.id, el.className);

            // Try regular click first
            el.click();

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
            for (let engineName of Object.keys(Engines)) {
                const engine = Engines[engineName];
                if (engine.isAvailable()) {
                    const code = engine.getCode();
                    if (code !== null) {
                        log('Code retrieved from:', engineName);
                        response = { code };
                        break;
                    }
                }
            }
            if (!response.code) response = { error: 'No editor found' };
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
        } else if (action === 'PING') {
            response = { status: 'PONG' };
        }

        window.dispatchEvent(new CustomEvent('ZOHO_IDE_FROM_PAGE', {
            detail: { eventId, action, response }
        }));
    });
})();
