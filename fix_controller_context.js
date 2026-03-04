const fs = require('fs');
let controller = fs.readFileSync('app/core/editor-controller.js', 'utf8');

// The event listener for 'explorer:load-file' only updates currentContextHash
// It needs to reconstruct currentContext from the hash or file so it knows WHERE to push it.
// The hash format is: `${service}__${orgId}__${functionName}`

controller = controller.replace(
`                currentContextHash = file.id; // Update our tracking hash so subsequent saves go to this file
                // Update currentContext metadata if possible from file info?
                // Ideally file.workspaceId etc help.
                // But for now, just visual load.`,
`                currentContextHash = file.id;

                // Construct pseudo context so push/pull targets the right service
                const parts = currentContextHash.split('__');
                if (parts.length >= 3) {
                    currentContext = {
                        service: parts[0],
                        orgId: parts[1],
                        functionName: parts[2],
                        contextHash: currentContextHash
                    };
                } else {
                    currentContext = {
                        service: 'unknown',
                        orgId: file.workspaceId,
                        functionName: file.fileName,
                        contextHash: currentContextHash
                    };
                }
`
);

fs.writeFileSync('app/core/editor-controller.js', controller);
console.log('Controller context patched');
