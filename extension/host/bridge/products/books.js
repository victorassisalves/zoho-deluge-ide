export const BooksConfig = {
    match: (url) => url.includes('books.zoho'),
    save: ['#save_script', '.save-btn', 'input[value="Save"]'],
    execute: ['#execute_script', '.execute-btn'],
    getMeta: () => {
        let orgId = null;
        const params = new URLSearchParams(window.location.search);
        if (params.get('organization_id')) {
            orgId = params.get('organization_id');
        }

        if (!orgId) {
            orgId = window.location.hostname + '_books';
        }

        let functionName = null;
        // Function Name logic
        const nameInput = document.querySelector('input[name="automation_function_name"], #automation_function_name');
        if (nameInput) functionName = nameInput.value;

        if (!functionName) {
            const header = document.querySelector('.zb-page-title, .page-title');
            if (header) functionName = header.innerText.trim();
        }

        if (!functionName) {
            const parts = window.location.pathname.split('/');
            functionName = parts[parts.length - 1] || 'unknown_books_func';
        }

        return {
            service: 'books',
            orgId: orgId,
            functionName: functionName || `unsaved_books_${Date.now()}`
        };
    }
};
