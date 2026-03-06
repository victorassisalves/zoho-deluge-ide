const fs = require('fs');

let code = fs.readFileSync('bridge.js', 'utf8');

// The issue: `bridge.js` DOES NOT SUPPORT `SET_CONTEXT_HASH` or returning `response.context` on PING!
// Wait! In V1 architecture, `content.js` or `scrapers.js` used to maintain `window.currentContext`.
// Let's check `bridge.js` for where it handles `SET_CONTEXT_HASH`. It doesn't!
// It only handles GET, SET, SAVE, EXECUTE, PING.

// Oh, I see. In `bridge.js`:
// `if (action === 'PING') { response = { status: 'PONG' }; }`

// Let's add context tracking to `bridge.js`.
const contextTracking = `
    let currentContext = { contextHash: null };

    window.addEventListener('ZOHO_IDE_FROM_EXT', async (event) => {
        const data = event.detail;
        if (!data || !data.action) return;

        log('[Bridge] Received:', data.action, data);

        let response = {};
        const { action, eventId } = data;

        if (action === 'SET_CONTEXT_HASH') {
            currentContext.contextHash = data.contextHash;
            response = { success: true };
        } else if (action === 'GET_ZOHO_CODE') {
`;

code = code.replace(/window\.addEventListener\('ZOHO_IDE_FROM_EXT', async \(event\) => \{[\s\S]*?if \(action === 'GET_ZOHO_CODE'\) \{/, contextTracking);

const pingTracking = `
        } else if (action === 'PING') {
            response = { status: 'PONG', context: currentContext };
        }
`;

code = code.replace(/\} else if \(action === 'PING'\) \{\s*response = \{ status: 'PONG' \};\s*\}/, pingTracking);

fs.writeFileSync('bridge.js', code);
console.log('Fixed bridge.js to track and return contextHash on PING');
