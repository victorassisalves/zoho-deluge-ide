export const GenericConfig = {
    match: () => true,
    save: ['#save_script', '#save_btn', 'input[value="Save"]', 'input[value="Update"]', '.save-btn', '.update-btn'],
    execute: ['#execute_script', '#run_script', 'input[value="Execute"]', 'input[value="Run"]', '.execute-btn', '.run-btn'],
    getMeta: () => {
        const url = window.location.href;
        let orgId = window.location.hostname;
        let functionName = null;

        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 2) {
            orgId = pathParts[1] || orgId;
            functionName = pathParts[pathParts.length - 1];
        }

        if (!functionName) {
            functionName = `unsaved_${Date.now()}`;
        }

        return {
            service: 'generic',
            orgId: orgId,
            functionName: functionName
        };
    }
};
