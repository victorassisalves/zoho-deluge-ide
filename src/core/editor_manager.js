import Logger from '../core/logger.js';
import bus from '../core/bus.js';
import { EVENTS } from '../core/events.js';

export class EditorManager {
    constructor() {
        this.editor = null; // Mock Monaco instance
        this.content = ''; // Internal state for verification
        this.setupListeners();
    }

    setupListeners() {
        bus.on(EVENTS.EDITOR.MOUNTED, (payload) => this.mountEditor(payload));
        bus.on(EVENTS.EDITOR.SET_VALUE, (payload) => this.setValue(payload.code));
        bus.on(EVENTS.EXECUTION.PUSH, () => this.handlePushRequest()); // If we need to send content
    }

    mountEditor(payload) {
        this.editor = payload.editor;
        Logger.info('EditorManager: Monaco Editor Mounted.');
    }

    setValue(code) {
        this.content = code;
        if (this.editor) {
            this.editor.setValue(code);
            Logger.info('EditorManager: Content updated from Pull.');
        } else {
            Logger.warn('EditorManager: Editor instance not mounted. Content stored in state.');
        }
    }

    getValue() {
        return this.editor ? this.editor.getValue() : this.content;
    }

    handlePushRequest() {
        const currentCode = this.getValue();
        Logger.info('EditorManager: Preparing content for Push...', { contentLength: currentCode.length });

        // Emit PUSH with code payload so Bridge can pick it up
        // Wait, Bridge is listening to EXECUTION.PUSH too.
        // We need a separate event or just call bridge directly?
        // Better: EXECUTION.PUSH triggers EditorManager -> EditorManager emits EXECUTION.PUSH_Payload -> Bridge listens to Payload.
        // OR: UI emits EXECUTION.PUSH_REQUEST -> EditorManager -> EXECUTION.PUSH (with payload) -> Bridge.

        // Let's stick to simple:
        // UI emits EXECUTION.PUSH (no payload).
        // EditorManager listens, gets code, emits EXECUTION.PUSH_Payload.
        // Bridge listens to EXECUTION.PUSH_Payload.

        // Refactoring Bridge listener to EXECUTION.PUSH_Payload
        bus.emit('execution:push-payload', { code: currentCode });
    }
}

const editorManager = new EditorManager();
export default editorManager;
