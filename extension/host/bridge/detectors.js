import { CRMConfig } from './products/crm.js';
import { CreatorConfig } from './products/creator.js';
import { BooksConfig } from './products/books.js';
import { FlowConfig } from './products/flow.js';
import { GenericConfig } from './products/generic.js';

export function getZohoProduct() {
    const url = window.location.href;
    if (CRMConfig.match(url)) return 'crm';
    if (CreatorConfig.match(url)) return 'creator';
    if (BooksConfig.match(url)) return 'books';
    if (FlowConfig.match(url)) return 'flow';
    return 'generic';
}

export function getContext() {
    const url = window.location.href;
    let config = GenericConfig;
    if (CRMConfig.match(url)) config = CRMConfig;
    else if (CreatorConfig.match(url)) config = CreatorConfig;
    else if (BooksConfig.match(url)) config = BooksConfig;
    else if (FlowConfig.match(url)) config = FlowConfig;

    const meta = config.getMeta ? config.getMeta() : { service: 'unknown', orgId: 'unknown', functionName: 'unknown' };

    // Fallback if getMeta returns nulls
    if (!meta.service) meta.service = getZohoProduct();
    if (!meta.orgId) meta.orgId = window.location.hostname;
    if (!meta.functionName) meta.functionName = 'unsaved_' + Date.now();

    // Construct Hash: [service]__[org_identifier]__[function_name]
    const hash = `${meta.service}__${meta.orgId}__${meta.functionName}`;

    return {
        ...meta,
        contextHash: hash
    };
}
