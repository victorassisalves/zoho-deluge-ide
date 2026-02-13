export function robustClick(el) {
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

export function clickBySelectors(selectors) {
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

export function clickByText(type) {
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
