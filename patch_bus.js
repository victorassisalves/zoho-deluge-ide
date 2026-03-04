const fs = require('fs');

let bus = fs.readFileSync('app/core/bus.js', 'utf8');

// The runtime response is using the exact same INSTANCE_ID to respond
// which means the window listener drops it
//    if (event.data.instanceId === INSTANCE_ID) return;
// We should use a different instanceId for the response

bus = bus.replace(
`                    // For Standalone mode, we bridge the callback to the event system if relevant
                    if (response && type === 'editor:pull') {
                        const responseType = type + ':response';
                        window.postMessage({ type: responseType, payload: response, instanceId: INSTANCE_ID }, '*');
                    }`,
`                    // For Standalone mode, we bridge the callback to the event system if relevant
                    if (response && type === 'editor:pull') {
                        const responseType = type + ':response';
                        window.postMessage({ type: responseType, payload: response, instanceId: INSTANCE_ID + '_RESPONSE' }, '*');
                    }`
);

fs.writeFileSync('app/core/bus.js', bus);
console.log('Bus patched');
