export const BooksConfig = {
    match: (url) => url.includes('books.zoho'),
    save: ['#save_script', '.save-btn', 'input[value="Save"]'],
    execute: ['#execute_script', '.execute-btn'],
    getMetadata: () => {
        // Basic metadata for books
        return {
            system: 'Books',
            orgId: 'global', // TODO: improve org detection
            functionId: window.location.hash || window.location.pathname,
            functionName: document.title,
            folder: 'General'
        };
    }
};
