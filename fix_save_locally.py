import sys

with open('ide.js', 'r') as f:
    content = f.read()

# Find the saveLocally function and the misplaced cloud sync block
import re

# Identify the cloud sync block
cloud_sync_block = """
    // Cloud Sync
    if (window.activeCloudFileId && typeof CloudService !== 'undefined') {
        CloudService.saveFile(window.activeCloudFileId, {
            code: code,
            jsonMappings: window.jsonMappings || {},
            url: zideProjectUrl
        }).then(() => {
            showStatus('Synced to Cloud', 'success');
        }).catch(err => {
            console.error('Cloud Sync failed:', err);
        });
    }
"""

# Remove it from where it is
content = content.replace(cloud_sync_block, '')

# Re-insert it after code and projectUrl are defined
insertion_point = "const projectUrl = zideProjectUrl || 'global';"
content = content.replace(insertion_point, insertion_point + cloud_sync_block)

with open('ide.js', 'w') as f:
    f.write(content)
