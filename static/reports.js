// Reports Module
window.ReportsModule = {
    
    async load() {
        this.render();
        await this.loadReports();
    },

    render() {
        const content = document.getElementById('reportsContent');
        content.innerHTML = `
            <div class="px-4 py-6 sm:px-0">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Financial Reports</h2>
                </div>

                <!-- Report Selection -->
                <div class="bg-white shadow rounded-lg p-6 mb-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Generate Reports</h3>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <button id="financialSummaryBtn" class="report-btn inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                            <i data-feather="bar-chart-2" class="w-4 h-4 mr-2"></i>Financial Summary
                        </button>
                        <button id="inventoryReportBtn" class="report-btn inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200">
                            <i data-feather="package" class="w-4 h-4 mr-2"></i>Inventory Report
                        </button>
                        <button id="salesReportBtn" class="report-btn inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200">
                            <i data-feather="shopping-cart" class="w-4 h-4 mr-2"></i>Sales Report
                        </button>
                    </div>
                </div>

                <!-- Date Range Selector -->
                <div class="bg-white shadow rounded-lg p-6 mb-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Date Range</h3>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Start Date</label>
                            <input type="date" id="startDate" 
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">End Date</label>
                            <input type="date" id="endDate" 
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div class="flex items-end">
                            <select id="presetDates" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Custom Range</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="quarter">This Quarter</option>
                                <option value="year">This Year</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Report Content -->
                <div id="reportContent" class="space-y-6">
                    <div class="bg-white shadow rounded-lg p-6">
                        <p class="text-gray-500 text-center py-8">
                            Select a report type above to view financial data
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('financialSummaryBtn').addEventListener('click', () => this.loadFinancialSummary());
        document.getElementById('inventoryReportBtn').addEventListener('click', () => this.loadInventoryReport());
        document.getElementById('salesReportBtn').addEventListener('click', () => this.loadSalesReport());
        
        document.getElementById('startDate').addEventListener('change', () => this.onDateChange());
        document.getElementById('endDate').addEventListener('change', () => this.onDateChange());
        document.getElementById('presetDates').addEventListener('change', () => this.onPresetDateChange());

        // Set default dates to current month
        this.setDefaultDates();
        
        feather.replace();
    },

    setDefaultDates() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        document.getElementById('startDate').value = firstDay.toISOString().split('T')[0];
        document.getElementById('endDate').value = lastDay.toISOString().split('T')[0];
    },

    onPresetDateChange() {
        const preset = document.getElementById('presetDates').value;
        const now = new Date();
        let startDate, endDate;

        switch (preset) {
            case 'today':
                startDate = endDate = now;
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                startDate = weekStart;
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                return;
        }

        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        
        this.onDateChange();
    },

    onDateChange() {
        // Re-load the current report with new dates
        const activeBtn = document.querySelector('.report-btn.bg-blue-500');
        if (activeBtn) {
            activeBtn.click();
        }
    },

    getDateRange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        return { startDate, endDate };
    },

    setActiveButton(buttonId) {
        // Reset all buttons
        document.querySelectorAll('.report-btn').forEach(btn => {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('text-blue-700', 'bg-blue-100');
        });
        
        // Set active button
        const activeBtn = document.getElementById(buttonId);
        activeBtn.classList.remove('text-blue-700', 'bg-blue-100');
        activeBtn.classList.add('bg-blue-500', 'text-white');
    },

    async loadReports() {
        // Load financial summary by default
        await this.loadFinancialSummary();
    },

    async loadFinancialSummary() {
        this.setActiveButton('financialSummaryBtn');
        
        try {
            const { startDate, endDate } = this.getDateRange();
            const response = await axios.get('/reports/financial-summary', {
                params: { start_date: startDate, end_date: endDate }
            });
            
            const data = response.data;
            this.renderFinancialSummary(data);
        } catch (error) {
            console.error('Error loading financial summary:', error);
            Components.showAlert('Failed to load financial summary', 'error');
        }
    },

    renderFinancialSummary(data) {
        const content = document.getElementById('reportContent');
        content.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-gray-900">Financial Summary</h3>
                    <span class="text-sm text-gray-500">
                        ${formatDate(data.period_start)} - ${formatDate(data.period_end)}
                    </span>
                </div>

                <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i data-feather="trending-up" class="h-8 w-8 text-green-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-green-800">Total Revenue</p>
                                <p class="text-2xl font-bold text-green-900">$${data.total_revenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-red-50 p-4 rounded-lg">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i data-feather="trending-down" class="h-8 w-8 text-red-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-red-800">Total Expenses</p>
                                <p class="text-2xl font-bold text-red-900">$${data.total_expenses.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i data-feather="dollar-sign" class="h-8 w-8 ${data.net_income >= 0 ? 'text-blue-600' : 'text-red-600'}"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium ${data.net_income >= 0 ? 'text-blue-800' : 'text-red-800'}">Net Income</p>
                                <p class="text-2xl font-bold ${data.net_income >= 0 ? 'text-blue-900' : 'text-red-900'}">
                                    $${data.net_income.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-8">
                    <h4 class="text-md font-medium text-gray-900 mb-4">Profit & Loss Overview</h4>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">Revenue</span>
                                <span class="text-sm font-medium text-gray-900">$${data.total_revenue.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-600">Less: Expenses</span>
                                <span class="text-sm font-medium text-gray-900">($${data.total_expenses.toFixed(2)})</span>
                            </div>
                            <hr class="border-gray-300">
                            <div class="flex justify-between">
                                <span class="text-base font-medium text-gray-900">Net Income</span>
                                <span class="text-base font-bold ${data.net_income >= 0 ? 'text-green-600' : 'text-red-600'}">
                                    $${data.net_income.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        feather.replace();
    },

    async loadInventoryReport() {
        this.setActiveButton('inventoryReportBtn');
        
        try {
            const response = await axios.get('/reports/inventory-report');
            const data = response.data;
            this.renderInventoryReport(data);
        } catch (error) {
            console.error('Error loading inventory report:', error);
            Components.showAlert('Failed to load inventory report', 'error');
        }
    },

    renderInventoryReport(data) {
        const content = document.getElementById('reportContent');
        content.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-6">Inventory Report</h3>

                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i data-feather="package" class="h-8 w-8 text-blue-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-blue-800">Total Items</p>
                                <p class="text-2xl font-bold text-blue-900">${data.total_items}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i data-feather="dollar-sign" class="h-8 w-8 text-green-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-green-800">Total Value</p>
                                <p class="text-2xl font-bold text-green-900">$${data.total_value.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                ${data.low_stock_items.length > 0 ? `
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div class="flex items-center mb-3">
                            <i data-feather="alert-triangle" class="h-5 w-5 text-yellow-600 mr-2"></i>
                            <h4 class="text-md font-medium text-yellow-800">Low Stock Alert</h4>
                        </div>
                        <p class="text-sm text-yellow-700 mb-3">
                            ${data.low_stock_items.length} item(s) are at or below their reorder level.
                        </p>
                        <div class="overflow-x-auto">
                            <table class="min-w-full">
                                <thead class="bg-yellow-100">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Item</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-yellow-800 uppercase">SKU</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Current Stock</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Reorder Level</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-yellow-200">
                                    ${data.low_stock_items.map(item => `
                                        <tr>
                                            <td class="px-4 py-2 text-sm text-gray-900">${item.name}</td>
                                            <td class="px-4 py-2 text-sm text-gray-600">${item.sku}</td>
                                            <td class="px-4 py-2 text-sm ${item.quantity_in_stock === 0 ? 'text-red-600 font-medium' : 'text-yellow-600'}">${item.quantity_in_stock}</td>
                                            <td class="px-4 py-2 text-sm text-gray-600">${item.reorder_level}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div class="flex items-center">
                            <i data-feather="check-circle" class="h-5 w-5 text-green-600 mr-2"></i>
                            <p class="text-sm text-green-700">All inventory items are above their reorder levels.</p>
                        </div>
                    </div>
                `}
            </div>
        `;
        
        feather.replace();
    },

    async loadSalesReport() {
        this.setActiveButton('salesReportBtn');
        
        try {
            const { startDate, endDate } = this.getDateRange();
            const response = await axios.get('/reports/sales-report', {
                params: { start_date: startDate, end_date: endDate }
            });
            
            const data = response.data;
            this.renderSalesReport(data);
        } catch (error) {
            console.error('Error loading sales report:', error);
            Components.showAlert('Failed to load sales report', 'error');
        }
    },

    renderSalesReport(data) {
        const content = document.getElementById('reportContent');
        content.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-gray-900">Sales Report</h3>
                    <span class="text-sm text-gray-500">
                        ${formatDate(data.period_start)} - ${formatDate(data.period_end)}
                    </span>
                </div>

                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i data-feather="shopping-cart" class="h-8 w-8 text-blue-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-blue-800">Total Sales</p>
                                <p class="text-2xl font-bold text-blue-900">${data.total_sales}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i data-feather="dollar-sign" class="h-8 w-8 text-green-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-green-800">Total Revenue</p>
                                <p class="text-2xl font-bold text-green-900">$${data.total_revenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                ${data.top_selling_items.length > 0 ? `
                    <div>
                        <h4 class="text-md font-medium text-gray-900 mb-4">Top Selling Items</h4>
                        <div class="bg-gray-50 rounded-lg p-4">
                            <div class="space-y-3">
                                ${data.top_selling_items.map((item, index) => `
                                    <div class="flex justify-between items-center">
                                        <div class="flex items-center">
                                            <span class="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-3">
                                                ${index + 1}
                                            </span>
                                            <span class="text-sm font-medium text-gray-900">${item.item}</span>
                                        </div>
                                        <span class="text-sm text-gray-600">${item.quantity_sold} sold</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="bg-gray-50 rounded-lg p-8 text-center">
                        <i data-feather="inbox" class="h-12 w-12 text-gray-400 mx-auto mb-4"></i>
                        <p class="text-gray-500">No sales data available for the selected period.</p>
                    </div>
                `}
            </div>
        `;
        
        feather.replace();
    }
};
