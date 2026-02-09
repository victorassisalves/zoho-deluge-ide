/**
 * JSON to Deluge Map Converter Modal
 */
import store from '../../services/store.js';

export const convertInterfaceToDeluge = (varName, jsonStr, options = {}) => {
    let obj;
    try {
        obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    } catch (e) {
        throw new Error('Invalid JSON: ' + e.message);
    }

    const style = options.style || 'step';
    const isUpdate = options.update || false;
    let code = "";
    let varCounter = 0;

    if (style === 'inline') {
        const toInline = (val) => {
            if (Array.isArray(val)) {
                return "{" + val.map(item => toInline(item)).join(", ") + "}";
            } else if (typeof val === "object" && val !== null) {
                let parts = [];
                for (const key in val) {
                    if (key.startsWith("$")) continue;
                    parts.push(`"${key}": ${toInline(val[key])}`);
                }
                return "{" + parts.join(", ") + "}";
            } else {
                if (typeof val === "string") return `"${val.replace(/"/g, '\\"')}"`;
                return val;
            }
        };
        return `${varName} = ${toInline(obj)};`;
    }

    const processValue = (val, name) => {
        if (Array.isArray(val)) {
            const listVar = name || `list_${++varCounter}`;
            code += `${listVar} = List();\n`;
            val.forEach(item => {
                const itemVal = processValue(item);
                code += `${listVar}.add(${itemVal});\n`;
            });
            return listVar;
        } else if (typeof val === "object" && val !== null) {
            const mapVar = name || `map_${++varCounter}`;
            if (!isUpdate || name !== varName) {
                code += `${mapVar} = Map();\n`;
            }
            for (const key in val) {
                if (key.startsWith("$")) continue;
                const memberVal = processValue(val[key]);
                code += `${mapVar}.put("${key}", ${memberVal});\n`;
            }
            return mapVar;
        } else {
            if (typeof val === "string") return `"${val.replace(/"/g, '\\"')}"`;
            return val;
        }
    };

    processValue(obj, varName);
    return code;
};

export const initJsonConverter = () => {
    const modal = document.getElementById('interface-modal');
    const convertBtn = document.getElementById('modal-convert');
    const cancelBtn = document.getElementById('modal-cancel');
    const input = document.getElementById('interface-input');
    const varNameInput = document.getElementById('interface-var-name');

    if (!modal || !convertBtn) return;

    convertBtn.addEventListener('click', () => {
        const varName = varNameInput.value || 'payload';
        const jsonStr = input.value;
        try {
            const code = convertInterfaceToDeluge(varName, jsonStr);
            const editor = store.getEditor();
            if (editor) {
                const selection = editor.getSelection();
                const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
                editor.executeEdits("json-converter", [{ range: range, text: code, forceMoveMarkers: true }]);
            }
            modal.style.display = 'none';
        } catch (e) {
            alert(e.message);
        }
    });

    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
};
