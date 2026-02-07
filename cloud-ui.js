/**
 * Cloud UI Controller for Zoho Deluge IDE
 */

const CloudUI = {
    activeOrgId: null,
    activeFileId: null,

    init() {
        this.bindEvents();
        this.listenToAuth();
        console.log('[ZohoIDE] CloudUI initialized');
    },

    bindEvents() {
        // Auth buttons
        document.getElementById('auth-login-btn')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('auth-signup-btn')?.addEventListener('click', () => this.handleSignUp());
        document.getElementById('auth-logout-btn')?.addEventListener('click', () => this.handleLogout());

        // Hierarchy buttons
        document.getElementById('create-team-btn')?.addEventListener('click', () => this.handleCreateTeam());
        document.getElementById('create-workspace-btn')?.addEventListener('click', () => this.handleCreateWorkspace());
        document.getElementById('create-project-btn')?.addEventListener('click', () => this.handleCreateProject());
        document.getElementById('create-file-btn')?.addEventListener('click', () => this.handleCreateFile());

        // Selectors
        document.getElementById('team-selector')?.addEventListener('change', (e) => this.loadWorkspaces(e.target.value));
        document.getElementById('workspace-selector')?.addEventListener('change', (e) => this.loadProjects(e.target.value));
        document.getElementById('project-selector')?.addEventListener('change', (e) => this.loadFiles(e.target.value));
    },

    listenToAuth() {
        CloudService.onAuthStateChanged(async (user) => {
            const loggedOut = document.getElementById('auth-logged-out');
            const loggedIn = document.getElementById('auth-logged-in');
            const hierarchy = document.getElementById('cloud-hierarchy-section');
            const idleMsg = document.getElementById('cloud-idle-msg');

            if (user) {
                if (loggedOut) loggedOut.style.display = 'none';
                if (loggedIn) loggedIn.style.display = 'block';
                if (hierarchy) hierarchy.style.display = 'block';
                if (idleMsg) idleMsg.style.display = 'none';

                document.getElementById('user-display').innerText = user.email;

                try {
                    let userDoc = await CloudService.db.collection('users').doc(user.uid).get();

                    if (!userDoc.exists) {
                        console.log('[ZohoIDE] User doc missing, creating profile...');
                        const domain = CloudService.getDomain(user.email);
                        let orgId = await CloudService.findOrgByDomain(domain);
                        if (!orgId) orgId = await CloudService.createOrganization(domain, user.uid);

                        await CloudService.db.collection('users').doc(user.uid).set({
                            uid: user.uid,
                            email: user.email,
                            domain: domain,
                            orgId: orgId,
                            teams: [],
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        userDoc = await CloudService.db.collection('users').doc(user.uid).get();
                    }

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        this.activeOrgId = userData.orgId;
                        const orgDoc = await CloudService.db.collection('organizations').doc(this.activeOrgId).get();
                        if (orgDoc.exists) {
                            document.getElementById('org-display').innerText = orgDoc.data().name || 'My Space';
                        }

                        this.loadTeams();

                        // Check for cloud files for current URL
                        this.checkForCloudFiles(window.zideProjectUrl || 'global');
                    }
                } catch (err) {
                    console.error('[ZohoIDE] Auth state error:', err);
                }
            } else {
                if (loggedOut) loggedOut.style.display = 'block';
                if (loggedIn) loggedIn.style.display = 'none';
                if (hierarchy) hierarchy.style.display = 'none';
                if (idleMsg) idleMsg.style.display = 'block';
                this.activeOrgId = null;
            }
        });
    },

    async migrateLocalToCloud() {
        if (typeof editor === 'undefined' || !editor) return;
        const localCode = editor.getValue();
        const localMappings = window.jsonMappings || {};
        const localName = window.zideProjectName || 'Migrated Project';
        const localUrl = window.zideProjectUrl || '';

        if (!localCode || localCode.trim() === '' || localCode.startsWith('// Start coding')) return;

        if (confirm('You have local code. Would you like to migrate it to a new Cloud Workspace?')) {
            try {
                const workspaceId = await CloudService.createWorkspace(this.activeOrgId, 'My Cloud Workspace');
                const projectId = await CloudService.createProject(workspaceId, localName, localUrl);
                const fileId = await CloudService.createFile(projectId, this.activeOrgId, 'Main', localCode, localUrl, localMappings);

                this.activeFileId = fileId;
                window.activeCloudFileId = fileId;

                this.loadTeams();
                if (typeof showStatus === 'function') showStatus('Migration complete!', 'success');
            } catch (err) {
                alert('Migration failed: ' + err.message);
            }
        }
    },

    async handleLogin() {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-password').value;
        try {
            await CloudService.login(email, pass);
        } catch (err) {
            alert('Login failed: ' + err.message);
        }
    },

    async handleSignUp() {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-password').value;
        if (!email.includes('@')) {
            alert('Please enter a valid email');
            return;
        }
        try {
            await CloudService.signUp(email, pass);
            alert('Account created successfully');
        } catch (err) {
            alert('Signup failed: ' + err.message);
        }
    },

    async handleLogout() {
        await CloudService.logout();
    },

    async loadTeams() {
        if (!this.activeOrgId) return;
        const teams = await CloudService.getTeams(this.activeOrgId);
        const selector = document.getElementById('team-selector');
        if (!selector) return;
        selector.innerHTML = '<option value="">Personal (No Team)</option>';
        teams.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.innerText = t.name;
            selector.appendChild(opt);
        });
        this.loadWorkspaces(null);
    },

    async loadWorkspaces(teamId) {
        if (!this.activeOrgId) return;
        const workspaces = await CloudService.getWorkspaces(this.activeOrgId, teamId);
        const selector = document.getElementById('workspace-selector');
        if (!selector) return;
        selector.innerHTML = '<option value="">Select Workspace...</option>';
        workspaces.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.innerText = w.name;
            selector.appendChild(opt);
        });
        const projSelector = document.getElementById('project-selector');
        if (projSelector) projSelector.innerHTML = '';
        const fileList = document.getElementById('cloud-file-list');
        if (fileList) fileList.innerHTML = '';
    },

    async loadProjects(workspaceId) {
        if (!workspaceId) return;
        const projects = await CloudService.getProjects(workspaceId);
        const selector = document.getElementById('project-selector');
        if (!selector) return;
        selector.innerHTML = '<option value="">Select Project...</option>';
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.name;
            selector.appendChild(opt);
        });
        const fileList = document.getElementById('cloud-file-list');
        if (fileList) fileList.innerHTML = '';
    },

    async loadFiles(projectId) {
        if (!projectId) return;
        const files = await CloudService.getFilesByProject(projectId);
        this.renderFileList(files);
    },

    renderFileList(files) {
        const list = document.getElementById('cloud-file-list');
        if (!list) return;
        list.innerHTML = '';
        if (files.length === 0) {
            list.innerHTML = '<div style="padding:10px; opacity:0.5; font-size:11px;">No files in this project</div>';
            return;
        }
        files.forEach(f => {
            const item = document.createElement('div');
            item.className = 'cloud-file-item' + (this.activeFileId === f.id ? ' active' : '');
            item.innerHTML = `<div>${f.name}</div><div style="font-size:9px; opacity:0.5;">${f.url || 'No URL linked'}</div>`;
            item.addEventListener('click', () => this.selectFile(f));
            list.appendChild(item);
        });
    },

    async handleCreateTeam() {
        const name = prompt('Team Name:');
        if (name) {
            await CloudService.createTeam(this.activeOrgId, name);
            this.loadTeams();
        }
    },

    async handleCreateWorkspace() {
        const teamId = document.getElementById('team-selector').value;
        const name = prompt('Workspace Name:');
        if (name) {
            await CloudService.createWorkspace(this.activeOrgId, name, teamId || null);
            this.loadWorkspaces(teamId);
        }
    },

    async handleCreateProject() {
        const workspaceId = document.getElementById('workspace-selector').value;
        if (!workspaceId) { alert('Select a workspace first'); return; }
        const name = prompt('Project Name:');
        if (name) {
            await CloudService.createProject(workspaceId, name);
            this.loadProjects(workspaceId);
        }
    },

    async handleCreateFile() {
        const projectId = document.getElementById('project-selector').value;
        if (!projectId) { alert('Select a project first'); return; }
        const name = prompt('File Name:');
        if (name) {
            const code = (typeof editor !== 'undefined' && editor) ? editor.getValue() : '';
            const url = window.zideProjectUrl || '';
            const fileId = await CloudService.createFile(projectId, this.activeOrgId, name, code, url);
            this.loadFiles(projectId);
            alert('File created and linked to cloud');
        }
    },

    async selectFile(file) {
        this.activeFileId = file.id;
        document.querySelectorAll('.cloud-file-item').forEach(i => i.classList.remove('active'));
        this.loadFiles(file.projectId);

        if (window.confirm('Load cloud file: ' + file.name + '? This will overwrite current editor.')) {
            if (typeof editor !== 'undefined' && editor) {
                editor.setValue(file.code);
                if (file.jsonMappings) {
                    window.jsonMappings = file.jsonMappings;
                    if (typeof updateInterfaceMappingsList === 'function') updateInterfaceMappingsList();
                }
                const nameInput = document.getElementById('project-name-input');
                if (nameInput) nameInput.value = file.name;
                window.zideProjectName = file.name;
                window.activeCloudFileId = file.id;
                if (typeof showStatus === 'function') showStatus('Cloud File Loaded');
            }
        }
    },

    async checkForCloudFiles(url) {
        if (!this.activeOrgId || url === 'global') return;
        try {
            const files = await CloudService.getFilesByUrl(this.activeOrgId, url);
            if (files.length > 0) {
                if (typeof showStatus === 'function') showStatus(files.length + ' cloud file(s) found for this URL', 'info');
                this.renderFileList(files);
            }
        } catch (err) {
            console.error('Error checking cloud files:', err);
        }
    }
};

// Initialize
CloudUI.init();
