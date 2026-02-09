# Services Module

## Purpose
This module contains singleton services that manage global state, cloud synchronization, and external communications.

## Store Service (store.js)
The central source of truth for the application state.

### API
- `store.get(key)`: Retrieve a value from the state.
- `store.set(key, value)`: Update a value and notify subscribers.
- `store.subscribe(callback)`: Register a listener for state changes. Callback receives `(key, value, oldValue)`.

### Golden Rules
- **NEVER** modify `store.state` directly. Always use `store.set()` or `store.update()`.
- **Avoid** adding heavy logic to the store; it should remain a data container.
- Always use descriptive keys for state variables.

## Cloud Service (cloud.js)
*Migrated from cloud-service.js*
Handles Firebase interactions.

## Bridge Client (bridge-client.js)
Handles communication with the Zoho content scripts.
