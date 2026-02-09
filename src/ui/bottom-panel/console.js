/**
 * Console Panel Logic
 */

const consoleEl = document.getElementById('console-output');

export const log = (type, message) => {
    if (!consoleEl) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type.toLowerCase()}`;
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
};

export const showStatus = (message, type = 'info') => {
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
        syncStatus.innerText = message;
        syncStatus.className = 'status-' + type;
    }
    log(type, message);
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
