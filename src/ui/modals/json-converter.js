import store from '../../services/store.js';

export const convertInterfaceToDeluge = (varName, jsonStr, options = {}) => {
    let obj;
    try { obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr; } catch (e) { throw new Error('Invalid JSON'); }

    let code = "";
    let varCounter = 0;

    const processValue = (val, name) => {
        if (Array.isArray(val)) {
            const listVar = name || "list_" + (++varCounter);
            code += listVar + " = List();\n";
            val.forEach(item => {
                const itemVal = processValue(item);
                code += listVar + ".add(" + itemVal + ");\n";
            });
            return listVar;
        } else if (typeof val === "object" && val !== null) {
            const mapVar = name || "map_" + (++varCounter);
            code += mapVar + " = Map();\n";
            for (const key in val) {
                if (key.startsWith("$")) continue;
                const memberVal = processValue(val[key]);
                code += mapVar + '.put("' + key + '", ' + memberVal + ");\n";
            }
            return mapVar;
        } else {
            if (typeof val === "string") return '"' + val.replace(/"/g, '\\"') + '"';
            return val;
        }
    };
    processValue(obj, varName);
    return code;
};

export const initJsonConverter = () => {
    const modal = document.getElementById('interface-modal');
    const convertBtn = document.getElementById('modal-convert');
    if (!modal || !convertBtn) return;
    convertBtn.addEventListener('click', () => {
        const varName = document.getElementById('interface-var-name').value || 'payload';
        const jsonStr = document.getElementById('interface-input').value;
        try {
            const code = convertInterfaceToDeluge(varName, jsonStr);
            const editor = store.getEditor();
            if (editor) {
                const selection = editor.getSelection();
                editor.executeEdits("json-converter", [{ range: selection, text: code, forceMoveMarkers: true }]);
            }
            modal.style.display = 'none';
        } catch (e) { alert(e.message); }
    });
};
