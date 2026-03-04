const fs = require('fs');

const path = 'app/modules/explorer/explorer.js';
let content = fs.readFileSync(path, 'utf8');

// Replace the render logic to only update if necessary
// I will create a hash of the tree to determine if re-rendering is needed
const diffLogic = `
        const newStateHash = JSON.stringify({ tree, orphanFiles });
        if (this._lastStateHash === newStateHash) {
            // State hasn't changed, do not re-render DOM
            return;
        }
        this._lastStateHash = newStateHash;

        this.container.innerHTML = '';
`;

content = content.replace(`        this.container.innerHTML = '';`, diffLogic);

fs.writeFileSync(path, content);
console.log('Explorer patched');
