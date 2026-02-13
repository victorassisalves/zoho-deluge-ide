export const GenericConfig = {
    match: () => true,
    save: ['#save_script', '#save_btn', 'input[value="Save"]', 'input[value="Update"]'],
    execute: ['#execute_script', '#run_script', 'input[value="Execute"]', 'input[value="Run"]'],
    getMetadata: () => {
        return {
            system: 'Zoho',
            orgId: 'global',
            functionId: window.location.pathname,
            functionName: document.title,
            folder: 'General'
        };
    }
};
