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
            isAvailable: () => !!(document.querySelector('.ace_editor, .zace-editor') || (window.ace && window.ace.edit) || window.ZEditor || window.Zace),
            getCode: () => {
                try {
                    // Try ZEditor/Zace first (common in Zoho Creator)
                    if (window.ZEditor && window.ZEditor.getValue) return window.ZEditor.getValue();
                    if (window.Zace && window.Zace.getValue) return window.Zace.getValue();

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
            save: ['input[value="Save"].zf-green-btn', 'input[value="Save"]', '.zf-green-btn', '.zf-mw-btn:not(.zf-btn-outline)'],
            execute: ['input[value="Execute"].zf-green-o-btn', 'input[value="Execute"]', '.zf-btn-outline.zf-green-o-btn']
        },
        creator: {
            match: (url) => url.includes('creator.zoho') || url.includes('creatorapp.zoho') || url.includes('creatorportal.zoho'),
            save: ['lyte-button[data-zcqa="save"]', 'lyte-button[data-zcqa="update"]', 'lyte-button[data-id="save"]', '.zc-save-btn', '.zc-update-btn', 'button.save-btn'],
            execute: ['lyte-button[data-zcqa="execute"]', 'lyte-button[data-zcqa="run"]', 'span[data-zcqa="delgv2execPlay"]', '.zc-execute-btn', 'button.run-btn']
        },
        crm: {
            match: (url) => url.includes('crm.zoho'),
            save: ['#crmsave', 'lyte-button[data-zcqa="save"]', '.crm-save-btn', 'input[value="Save"]'],
            execute: ['#crmexecute', 'lyte-button[data-id="execute"]']
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
            el.click();
            ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup'].forEach(type => {
                const Cls = type.startsWith('pointer') ? PointerEvent : MouseEvent;
                el.dispatchEvent(new Cls(type, { bubbles: true, cancelable: true, view: window }));
            });
            return true;
        } catch(e) { return false; }
    }

    function triggerAction(type) {
        const url = window.location.href;
        let product = Object.values(Products).find(p => p.match && p.match(url)) || Products.generic;
        const selectors = product[type] || [];

        for (let sel of selectors) {
            const els = document.querySelectorAll(sel);
            for (let el of els) {
                if (el && (el.offsetParent !== null || el.offsetWidth > 0)) {
                    if (robustClick(el)) return true;
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

    window.addEventListener('message', (event) => {
        let data;
        try {
            data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (e) {
            if (typeof event.data === 'string' && event.data.startsWith('ZIDE_MSG:')) {
                try { data = JSON.parse(event.data.substring(9)); } catch (e2) { return; }
            } else return;
        }

        if (data && (data.source === 'EXTENSION' || data._zide_msg_) && data.source !== 'PAGE') {
            let response = {};
            if (data.action === 'GET_ZOHO_CODE') {
                log('GET_ZOHO_CODE requested');
                for (let engineName of Object.keys(Engines)) {
                    const engine = Engines[engineName];
                    if (engine.isAvailable()) {
                        log('Engine available:', engineName);
                        const code = engine.getCode();
                        if (code !== null) {
                            log('Code retrieved from:', engineName);
                            response = { code };
                            break;
                        }
                    }
                }
                if (!response.code) {
                    log('No editor found in this frame');
                    response = { error: 'No editor found' };
                }
            } else if (data.action === 'SET_ZOHO_CODE') {
                log('SET_ZOHO_CODE requested');
                let success = false;
                for (let engineName of Object.keys(Engines)) {
                    const engine = Engines[engineName];
                    if (engine.isAvailable()) {
                        log('Engine available for set:', engineName);
                        if (engine.setCode(data.code)) {
                            log('Code set successfully using:', engineName);
                            success = true;
                            break;
                        }
                    }
                }
                response = { success };
            } else if (data.action === 'SAVE_ZOHO_CODE') {
                response = { success: triggerAction('save') };
            } else if (data.action === 'EXECUTE_ZOHO_CODE') {
                response = { success: triggerAction('execute') };
            } else if (data.action === 'PING') {
                response = { status: 'PONG' };
            }

            window.postMessage(JSON.stringify({ _zide_msg_: true, source: 'PAGE', action: data.action, response }), '*');
        }
    });
})();
