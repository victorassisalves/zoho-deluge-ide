import store from '../services/store.js';

export const initModals = () => {
    const convertBtn = document.getElementById('modal-convert');
    if (convertBtn) {
        convertBtn.addEventListener('click', () => {
            const varName = document.getElementById('interface-var-name').value || 'payload';
            const jsonStr = document.getElementById('interface-input').value;
            // The logic for conversion still lives in ide.js for now as a fallback
            if (window.convertInterfaceToDeluge) {
                try {
                    const code = window.convertInterfaceToDeluge(varName, jsonStr);
                    const editor = store.get('editor');
                    if (editor) {
                        editor.executeEdits('json-convert', [{
                            range: editor.getSelection(),
                            text: code
                        }]);
                    }
                    document.getElementById('interface-modal').style.display = 'none';
                } catch (e) { alert(e.message); }
            }
        });
    }
};
