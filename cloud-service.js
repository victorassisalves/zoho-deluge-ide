/**
 * Cloud Service for Zoho Deluge IDE
 * Handles Firestore and Auth operations
 */

const CloudService = {
    db: null,
    auth: null,
    currentUser: null,

    init() {
        if (typeof firebase !== 'undefined') {
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            console.log('[ZohoIDE] CloudService initialized');
        }
    },

    // --- Auth Operations ---

    async signUp(email, password) {
        const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const domain = email.split('@')[1];

        // Check if organization for this domain exists
        let orgId = null;
        try {
            orgId = await this.findOrgByDomain(domain);
        } catch (e) {
            console.warn('[ZohoIDE] findOrgByDomain failed (expected for new domains):', e);
        }

        if (!orgId) {
            // Create new organization
            orgId = await this.createOrganization(domain, user.uid);
        }

        // Create user record
        await this.db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            domain: domain,
            orgId: orgId,
            teams: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { user, orgId };
    },

    async login(email, password) {
        return await this.auth.signInWithEmailAndPassword(email, password);
    },

    logout() {
        return this.auth.signOut();
    },

    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    },

    // --- Organization & Teams ---

    async findOrgByDomain(domain) {
        const snapshot = await this.db.collection('organizations')
            .where('domain', '==', domain)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            return snapshot.docs[0].id;
        }
        return null;
    },

    async createOrganization(domain, ownerId) {
        const docRef = await this.db.collection('organizations').add({
            domain: domain,
            ownerId: ownerId,
            name: domain.split('.')[0].toUpperCase(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    },

    async getTeams(orgId) {
        const snapshot = await this.db.collection('teams')
            .where('orgId', '==', orgId)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async createTeam(orgId, name) {
        const docRef = await this.db.collection('teams').add({
            orgId: orgId,
            name: name,
            members: [this.auth.currentUser.uid],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    },

    // --- Workspaces & Projects ---

    async getWorkspaces(orgId, teamId = null) {
        let query = this.db.collection('workspaces').where('orgId', '==', orgId);
        if (teamId) {
            query = query.where('teamId', '==', teamId);
        } else {
            // Standalone workspaces for the user
            query = query.where('ownerId', '==', this.auth.currentUser.uid).where('type', '==', 'standalone');
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async createWorkspace(orgId, name, teamId = null) {
        const data = {
            orgId: orgId,
            name: name,
            type: teamId ? 'team' : 'standalone',
            ownerId: this.auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (teamId) data.teamId = teamId;

        const docRef = await this.db.collection('workspaces').add(data);
        return docRef.id;
    },

    async getProjects(workspaceId) {
        const snapshot = await this.db.collection('projects')
            .where('workspaceId', '==', workspaceId)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async createProject(workspaceId, name, url = null) {
        const docRef = await this.db.collection('projects').add({
            workspaceId: workspaceId,
            name: name,
            url: url, // Optional base URL
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    },

    // --- Files ---

    async getFilesByProject(projectId) {
        const snapshot = await this.db.collection('files')
            .where('projectId', '==', projectId)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getFilesByUrl(orgId, url) {
        // Find files across all projects in the org that match this URL
        // In a real SaaS, we might limit this to workspaces the user has access to
        const snapshot = await this.db.collectionGroup('files')
            .where('orgId', '==', orgId)
            .where('url', '==', url)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async saveFile(fileId, data) {
        const fileRef = this.db.collection('files').doc(fileId);
        await fileRef.update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    async createFile(projectId, orgId, name, code, url, jsonMappings = {}) {
        const docRef = await this.db.collection('files').add({
            projectId: projectId,
            orgId: orgId,
            name: name,
            code: code,
            url: url,
            jsonMappings: jsonMappings,
            ownerId: this.auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    }
};

// Initialize on load
if (typeof firebase !== 'undefined') {
    CloudService.init();
}
