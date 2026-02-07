import json

with open('manifest.json', 'r') as f:
    data = json.load(f)

new_domains = [
    "https://deluge.zoho.com/*",
    "https://deluge.zoho.eu/*",
    "https://deluge.zoho.in/*",
    "https://deluge.zoho.com.au/*",
    "https://deluge.zoho.jp/*",
    "https://deluge.zoho.ca/*",
    "https://deluge.zoho.uk/*",
    "https://deluge.zoho.com.cn/*"
]

for domain in new_domains:
    if domain not in data['host_permissions']:
        data['host_permissions'].append(domain)
    if domain not in data['content_scripts'][0]['matches']:
        data['content_scripts'][0]['matches'].append(domain)

with open('manifest.json', 'w') as f:
    json.dump(data, f, indent=2)
