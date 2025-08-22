// Users Management Module
window.UsersModule = {
    data: [],

    async load() {
        if (!AuthUtils.hasManagerRole()) {
            this.renderAccessDenied();
            return;
        }
        
        await this.fetchUsers();
        this.render();
    },

    async fetchUsers() {
        try {
            const response = await axios.get('/users');
            this.data = response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            Components.showAlert('Failed to load users data', 'error');
        }
    },

    renderAccessDenied() {
        const content = document.getElementById('usersContent');
        content.innerHTML = `
            <div class="px-4 py-6 sm:px-0">
                <div class="text-center py-12">
                    <i data-feather="lock" class="mx-auto h-12 w-12 text-gray-400"></i>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
                    <p class="mt-1 text-sm text-gray-500">
                        Only managers can access user management.
                    </p>
                </div>
            </div>
        `;
        feather.replace();
    },

    render() {
        const content = document.getElementById('usersContent');
        content.innerHTML = `
            <div class="px-4 py-6 sm:px-0">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">User Management</h2>
                    <button id="addUserBtn" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        <i data-feather="plus" class="w-4 h-4 mr-2"></i>Add User
                    </button>
                </div>

                <!-- User Summary -->
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <i data-feather="users" class="h-6 w-6 text-gray-400"></i>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                                        <dd class="text-lg font-medium text-gray-900">${this.data.length}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <i data-feather="user-check" class="h-6 w-6 text-gray-400"></i>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                                        <dd class="text-lg font-medium text-gray-900">${this.getActiveUsersCount()}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <i data-feather="shield" class="h-6 w-6 text-gray-400"></i>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Managers</dt>
                                        <dd class="text-lg font-medium text-gray-900">${this.getManagersCount()}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="bg-white shadow rounded-lg p-4 mb-6">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Search</label>
                            <input type="text" id="searchInput" placeholder="Search users..." 
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Role</label>
                            <select id="roleFilter" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="">All Roles</option>
                                <option value="manager">Manager</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Status</label>
                            <select id="statusFilter" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="">All Users</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Users Table -->
                <div class="bg-white shadow rounded-lg">
                    <div id="usersTable">
                        ${this.createUsersTable()}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('addUserBtn').addEventListener('click', () => this.showAddModal());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('roleFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        
        feather.replace();
    },

    createUsersTable() {
        const headers = ['Name', 'Username', 'Email', 'Role', 'Status', 'Created'];
        const actions = [
            { text: 'View', color: 'blue', onClick: 'UsersModule.showViewModal' },
            { text: 'Toggle Status', color: 'yellow', onClick: 'UsersModule.toggleUserStatus' }
        ];

        const tableData = this.data.map(user => ({
            id: user.id,
            name: user.full_name,
            username: user.username,
            email: user.email,
            role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
            status: user.is_active ? 
                '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>' :
                '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>',
            created: formatDate(user.created_at)
        }));

        return Components.createTable(headers, tableData, actions);
    },

    getActiveUsersCount() {
        return this.data.filter(user => user.is_active).length;
    },

    getManagersCount() {
        return this.data.filter(user => user.role === 'manager').length;
    },

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const roleFilter = document.getElementById('roleFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filteredData = this.data;

        // Apply search filter
        if (searchTerm) {
            filteredData = filteredData.filter(user => 
                user.full_name.toLowerCase().includes(searchTerm) ||
                user.username.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm)
            );
        }

        // Apply role filter
        if (roleFilter) {
            filteredData = filteredData.filter(user => user.role === roleFilter);
        }

        // Apply status filter
        if (statusFilter === 'active') {
            filteredData = filteredData.filter(user => user.is_active);
        } else if (statusFilter === 'inactive') {
            filteredData = filteredData.filter(user => !user.is_active);
        }

        // Update table with filtered data
        const originalData = this.data;
        this.data = filteredData;
        document.getElementById('usersTable').innerHTML = this.createUsersTable();
        this.data = originalData;
        
        feather.replace();
    },

    showAddModal() {
        const fields = [
            { name: 'full_name', type: 'text', label: 'Full Name', required: true, placeholder: 'Enter full name' },
            { name: 'username', type: 'text', label: 'Username', required: true, placeholder: 'Enter username' },
            { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'Enter email address' },
            { name: 'password', type: 'password', label: 'Password', required: true, placeholder: 'Enter password' },
            { 
                name: 'role', 
                type: 'select', 
                label: 'Role', 
                required: true,
                options: [
                    { value: 'staff', text: 'Staff' },
                    { value: 'manager', text: 'Manager' }
                ],
                placeholder: 'Select role'
            }
        ];

        const modal = Components.createModal(
            'Add New User',
            Components.createForm(fields, (data) => this.createUser(data, modal), 'Create User'),
            'max-w-lg'
        );
    },

    showViewModal(user) {
        const userData = this.data.find(u => u.id === user.id);
        if (!userData) return;

        const content = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-medium text-gray-900">Personal Information</h4>
                        <p class="text-sm text-gray-600">Name: ${userData.full_name}</p>
                        <p class="text-sm text-gray-600">Email: ${userData.email}</p>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900">Account Information</h4>
                        <p class="text-sm text-gray-600">Username: ${userData.username}</p>
                        <p class="text-sm text-gray-600">Role: ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</p>
                    </div>
                </div>

                <div>
                    <h4 class="font-medium text-gray-900">Status</h4>
                    <div class="mt-2">
                        ${userData.is_active ? 
                            '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><i data-feather="check-circle" class="w-3 h-3 mr-1"></i>Active</span>' :
                            '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><i data-feather="x-circle" class="w-3 h-3 mr-1"></i>Inactive</span>'
                        }
                    </div>
                </div>

                <div>
                    <h4 class="font-medium text-gray-900">Account Created</h4>
                    <p class="text-sm text-gray-600">${formatDateTime(userData.created_at)}</p>
                </div>

                ${userData.id !== AppState.user.id ? `
                    <div class="pt-4 border-t border-gray-200">
                        <button id="toggleStatusBtn" class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md ${userData.is_active ? 'text-red-700 bg-red-100 hover:bg-red-200' : 'text-green-700 bg-green-100 hover:bg-green-200'}">
                            <i data-feather="${userData.is_active ? 'user-x' : 'user-check'}" class="w-4 h-4 mr-2"></i>
                            ${userData.is_active ? 'Deactivate User' : 'Activate User'}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        const modal = Components.createModal(`User Details - ${userData.full_name}`, content, 'max-w-2xl');
        
        // Add toggle status functionality
        if (userData.id !== AppState.user.id) {
            setTimeout(() => {
                const toggleBtn = document.getElementById('toggleStatusBtn');
                if (toggleBtn) {
                    toggleBtn.addEventListener('click', () => {
                        Components.closeModal(modal);
                        this.toggleUserStatus(userData);
                    });
                }
                feather.replace();
            }, 10);
        } else {
            setTimeout(() => feather.replace(), 10);
        }
    },

    async createUser(data, modal) {
        try {
            await axios.post('/users', data);
            
            Components.closeModal(modal);
            Components.showAlert('User created successfully', 'success');
            await this.fetchUsers();
            this.render();
        } catch (error) {
            console.error('Error creating user:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to create user', 'error');
        }
    },

    async toggleUserStatus(user) {
        const userData = this.data.find(u => u.id === user.id);
        if (!userData) return;

        const action = userData.is_active ? 'deactivate' : 'activate';
        const confirmMessage = `Are you sure you want to ${action} ${userData.full_name}?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const endpoint = userData.is_active ? 
                `/users/${userData.id}/deactivate` : 
                `/users/${userData.id}/activate`;
            
            await axios.put(endpoint);
            
            Components.showAlert(`User ${action}d successfully`, 'success');
            await this.fetchUsers();
            this.render();
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            Components.showAlert(error.response?.data?.detail || `Failed to ${action} user`, 'error');
        }
    }
};
