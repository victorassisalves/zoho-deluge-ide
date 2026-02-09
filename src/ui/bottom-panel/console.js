/**
 * Console Panel Logic
 */

const consoleEl = document.getElementById('console-output');

export const log = (type, message) => {
    if (!consoleEl) return;

    const entry = document.createElement('div');
    entry.className = \`log-entry \${type}\`;
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = \`<span class="log-time">[\${time}]</span> \${message}\`;
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
};

export const clearConsole = () => {
    if (consoleEl) consoleEl.innerHTML = '';
};

export const initConsole = () => {
    const clearBtn = document.getElementById('clear-console');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearConsole);
    }
};
