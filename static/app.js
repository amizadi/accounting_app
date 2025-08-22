// Global application state
window.AppState = {
    user: null,
    token: null,
    currentTab: 'dashboard'
};

// API configuration
axios.defaults.baseURL = '/api';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check for existing token
    const token = localStorage.getItem('token');
    if (token) {
        AppState.token = token;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        verifyToken();
    } else {
        showLoginScreen();
    }

    // Initialize event listeners
    initializeEventListeners();
}

function initializeEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });

    // Quick action buttons
    document.getElementById('quickAddInventory').addEventListener('click', () => {
        switchTab('inventory');
        setTimeout(() => window.InventoryModule.showAddModal(), 100);
    });

    document.getElementById('quickCreateSale').addEventListener('click', () => {
        switchTab('sales');
        setTimeout(() => window.SalesModule.showAddModal(), 100);
    });

    document.getElementById('quickCreatePurchase').addEventListener('click', () => {
        switchTab('purchases');
        setTimeout(() => window.PurchasesModule.showAddModal(), 100);
    });

    document.getElementById('quickViewReports').addEventListener('click', () => {
        switchTab('reports');
    });
}

async function verifyToken() {
    try {
        const response = await axios.get('/auth/me');
        AppState.user = response.data;
        showMainApp();
    } catch (error) {
        console.error('Token verification failed:', error);
        handleLogout();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Update user info
    document.getElementById('userInfo').textContent = 
        `${AppState.user.full_name} (${AppState.user.role})`;
    
    // Show/hide manager-only features
    updateUIForUserRole();
    
    // Load dashboard
    switchTab('dashboard');
    
    // Initialize feather icons
    feather.replace();
}

function updateUIForUserRole() {
    const userManagementTabs = document.querySelectorAll('.user-management-tab');
    if (AppState.user.role === 'manager') {
        userManagementTabs.forEach(tab => tab.classList.remove('hidden'));
    } else {
        userManagementTabs.forEach(tab => tab.classList.add('hidden'));
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await axios.post('/auth/login', {
            username,
            password
        });
        
        AppState.token = response.data.access_token;
        localStorage.setItem('token', AppState.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${AppState.token}`;
        
        await verifyToken();
        errorDiv.classList.add('hidden');
    } catch (error) {
        console.error('Login failed:', error);
        errorDiv.textContent = error.response?.data?.detail || 'Login failed. Please try again.';
        errorDiv.classList.remove('hidden');
    }
}

function handleLogout() {
    AppState.user = null;
    AppState.token = null;
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    showLoginScreen();
}

function handleTabClick(event) {
    event.preventDefault();
    const tabId = event.currentTarget.id.replace('Tab', '');
    switchTab(tabId);
}

function switchTab(tabName) {
    // Update active tab styling
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('border-blue-500', 'text-gray-900');
        tab.classList.add('border-transparent', 'text-gray-500');
    });
    
    const activeTab = document.getElementById(`${tabName}Tab`);
    if (activeTab) {
        activeTab.classList.remove('border-transparent', 'text-gray-500');
        activeTab.classList.add('border-blue-500', 'text-gray-900');
    }
    
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show selected content
    const content = document.getElementById(`${tabName}Content`);
    if (content) {
        content.classList.remove('hidden');
    }
    
    AppState.currentTab = tabName;
    
    // Load content based on tab
    loadTabContent(tabName);
    
    // Update icons
    setTimeout(() => feather.replace(), 10);
}

async function loadTabContent(tabName) {
    try {
        switch (tabName) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'inventory':
                if (window.InventoryModule) {
                    await window.InventoryModule.load();
                }
                break;
            case 'sales':
                if (window.SalesModule) {
                    await window.SalesModule.load();
                }
                break;
            case 'purchases':
                if (window.PurchasesModule) {
                    await window.PurchasesModule.load();
                }
                break;
            case 'payroll':
                if (window.PayrollModule) {
                    await window.PayrollModule.load();
                }
                break;
            case 'reports':
                if (window.ReportsModule) {
                    await window.ReportsModule.load();
                }
                break;
            case 'users':
                if (window.UsersModule) {
                    await window.UsersModule.load();
                }
                break;
        }
    } catch (error) {
        console.error(`Error loading ${tabName}:`, error);
        showError(`Failed to load ${tabName}. Please try again.`);
    }
}

async function loadDashboard() {
    try {
        const statsResponse = await axios.get('/reports/dashboard-stats');
        const stats = statsResponse.data;
        
        const statsContainer = document.getElementById('dashboardStats');
        statsContainer.innerHTML = `
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-feather="shopping-cart" class="h-6 w-6 text-gray-400"></i>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Monthly Sales</dt>
                                <dd class="text-lg font-medium text-gray-900">${stats.monthly_sales}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-feather="dollar-sign" class="h-6 w-6 text-gray-400"></i>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                                <dd class="text-lg font-medium text-gray-900">$${stats.monthly_revenue.toFixed(2)}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-feather="package" class="h-6 w-6 text-gray-400"></i>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Inventory Items</dt>
                                <dd class="text-lg font-medium text-gray-900">${stats.total_inventory_items}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-feather="trending-up" class="h-6 w-6 text-gray-400"></i>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Monthly Profit</dt>
                                <dd class="text-lg font-medium ${stats.monthly_profit >= 0 ? 'text-green-600' : 'text-red-600'}">
                                    $${stats.monthly_profit.toFixed(2)}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Load recent activity
        await loadRecentActivity();
        
        feather.replace();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

async function loadRecentActivity() {
    try {
        const recentActivityDiv = document.getElementById('recentActivity');
        
        // Get recent sales and purchases (simplified for now)
        const salesResponse = await axios.get('/sales');
        const purchasesResponse = await axios.get('/purchases');
        
        const recentSales = salesResponse.data.slice(-3);
        const recentPurchases = purchasesResponse.data.slice(-3);
        
        let activityHTML = '';
        
        if (recentSales.length === 0 && recentPurchases.length === 0) {
            activityHTML = '<p class="text-gray-500 text-center py-4">No recent activity</p>';
        } else {
            recentSales.forEach(sale => {
                activityHTML += `
                    <div class="flex items-center justify-between py-2 border-b border-gray-100">
                        <div class="flex items-center">
                            <i data-feather="shopping-cart" class="w-4 h-4 text-green-500 mr-3"></i>
                            <span class="text-sm">Sale to ${sale.customer_name} - $${sale.total_amount.toFixed(2)}</span>
                        </div>
                        <span class="text-xs text-gray-500">${new Date(sale.created_at).toLocaleDateString()}</span>
                    </div>
                `;
            });
            
            recentPurchases.forEach(purchase => {
                activityHTML += `
                    <div class="flex items-center justify-between py-2 border-b border-gray-100">
                        <div class="flex items-center">
                            <i data-feather="truck" class="w-4 h-4 text-blue-500 mr-3"></i>
                            <span class="text-sm">Purchase from ${purchase.supplier_name} - $${purchase.total_amount.toFixed(2)}</span>
                        </div>
                        <span class="text-xs text-gray-500">${new Date(purchase.created_at).toLocaleDateString()}</span>
                    </div>
                `;
            });
        }
        
        recentActivityDiv.innerHTML = activityHTML;
        feather.replace();
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Utility functions
function showError(message) {
    // Simple error display - could be enhanced with a proper notification system
    alert(message);
}

function showSuccess(message) {
    // Simple success display - could be enhanced with a proper notification system
    console.log('Success:', message);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString();
}
