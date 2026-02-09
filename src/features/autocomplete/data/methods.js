export const typeMethods = {
    string: [
        { label: 'length()', insertText: 'length()' },
        { label: 'subString(start, end)', insertText: 'subString(${1:start}, ${2:end})' },
        { label: 'toLowerCase()', insertText: 'toLowerCase()' },
        { label: 'toUpperCase()', insertText: 'toUpperCase()' },
        { label: 'trim()', insertText: 'trim()' },
        { label: 'toList(sep)', insertText: 'toList("${1:,}")' },
        { label: 'toNumber()', insertText: 'toNumber()' },
        { label: 'toDecimal()', insertText: 'toDecimal()' },
        { label: 'toDate()', insertText: 'toDate()' },
        { label: 'toDateTime()', insertText: 'toDateTime()' },
        { label: 'contains(str)', insertText: 'contains("${1:str}")' },
        { label: 'startsWith(str)', insertText: 'startsWith("${1:str}")' },
        { label: 'endsWith(str)', insertText: 'endsWith("${1:str}")' },
        { label: 'replaceAll(old, new)', insertText: 'replaceAll("${1:old}", "${2:new}")' }
    ],
    list: [
        { label: 'add(val)', insertText: 'add(${1:val})' },
        { label: 'addAll(otherList)', insertText: 'addAll(${1:otherList})' },
        { label: 'get(index)', insertText: 'get(${1:index})' },
        { label: 'size()', insertText: 'size()' },
        { label: 'contains(val)', insertText: 'contains(${1:val})' },
        { label: 'isEmpty()', insertText: 'isEmpty()' },
        { label: 'remove(index)', insertText: 'remove(${1:index})' },
        { label: 'clear()', insertText: 'clear()' },
        { label: 'sort(asc)', insertText: 'sort(${1:true})' },
        { label: 'distinct()', insertText: 'distinct()' }
    ],
    map: [
        { label: 'put(key, val)', insertText: 'put("${1:key}", ${2:val})' },
        { label: 'get(key)', insertText: 'get("${1:key}")' },
        { label: 'getJSON(key)', insertText: 'getJSON("${1:key}")' },
        { label: 'keys()', insertText: 'keys()' },
        { label: 'remove(key)', insertText: 'remove("${1:key}")' },
        { label: 'clear()', insertText: 'clear()' },
        { label: 'size()', insertText: 'size()' },
        { label: 'isEmpty()', insertText: 'isEmpty()' },
        { label: 'containKey(key)', insertText: 'containKey("${1:key}")' }
    ],
    date: [
        { label: 'addDay(n)', insertText: 'addDay(${1:1})' },
        { label: 'addMonth(n)', insertText: 'addMonth(${1:1})' },
        { label: 'addYear(n)', insertText: 'addYear(${1:1})' },
        { label: 'toString(format)', insertText: 'toString("${1:yyyy-MM-dd}")' },
        { label: 'toLong()', insertText: 'toLong()' }
    ],
    zoho: [
        { label: 'zoho.crm.getRecordById(module, id)', insertText: 'zoho.crm.getRecordById("${1:Leads}", ${2:id})' },
        { label: 'zoho.crm.updateRecord(module, id, map)', insertText: 'zoho.crm.updateRecord("${1:Leads}", ${2:id}, ${3:dataMap})' },
        { label: 'zoho.crm.createRecord(module, map)', insertText: 'zoho.crm.createRecord("${1:Leads}", ${2:dataMap})' },
        { label: 'zoho.creator.getRecords(owner, app, report, criteria)', insertText: 'zoho.creator.getRecords("${1:owner}", "${2:app}", "${3:report}", "${4:criteria}")' },
        { label: 'zoho.books.getRecords(module, orgId)', insertText: 'zoho.books.getRecords("${1:Invoices}", "${2:org_id}")' },
        { label: 'zoho.recruit.getRecordById(module, id)', insertText: 'zoho.recruit.getRecordById("${1:Candidates}", ${2:id})' },
        { label: 'zoho.recruit.updateRecord(module, id, map)', insertText: 'zoho.recruit.updateRecord("${1:Candidates}", ${2:id}, ${3:dataMap})' }
    ]
};
