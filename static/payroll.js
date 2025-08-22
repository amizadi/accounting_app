// Payroll Management Module
window.PayrollModule = {
    data: [],

    async load() {
        await this.fetchPayroll();
        this.render();
    },

    async fetchPayroll() {
        try {
            const response = await axios.get('/payroll');
            this.data = response.data;
        } catch (error) {
            console.error('Error fetching payroll:', error);
            Components.showAlert('Failed to load payroll data', 'error');
        }
    },

    render() {
        const content = document.getElementById('payrollContent');
        content.innerHTML = `
            <div class="px-4 py-6 sm:px-0">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Payroll Management</h2>
                    ${AuthUtils.hasManagerRole() ? `
                        <button id="addPayrollBtn" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            <i data-feather="plus" class="w-4 h-4 mr-2"></i>Add Payroll Entry
                        </button>
                    ` : ''}
                </div>

                ${!AuthUtils.hasManagerRole() ? `
                    <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i data-feather="info" class="h-5 w-5 text-yellow-400"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-yellow-700">
                                    Only managers can create, edit, or delete payroll entries.
                                </p>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Payroll Summary -->
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <i data-feather="users" class="h-6 w-6 text-gray-400"></i>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Total Entries</dt>
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
                                    <i data-feather="dollar-sign" class="h-6 w-6 text-gray-400"></i>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Total Gross Pay</dt>
                                        <dd class="text-lg font-medium text-gray-900">$${this.getTotalGrossPay().toFixed(2)}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <i data-feather="credit-card" class="h-6 w-6 text-gray-400"></i>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Total Net Pay</dt>
                                        <dd class="text-lg font-medium text-gray-900">$${this.getTotalNetPay().toFixed(2)}</dd>
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
                                        <dt class="text-sm font-medium text-gray-500 truncate">Unique Employees</dt>
                                        <dd class="text-lg font-medium text-gray-900">${this.getUniqueEmployees()}</dd>
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
                            <label class="block text-sm font-medium text-gray-700">Search Employee</label>
                            <input type="text" id="searchInput" placeholder="Search by employee name or ID..." 
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Pay Period From</label>
                            <input type="date" id="dateFromFilter" 
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Pay Period To</label>
                            <input type="date" id="dateToFilter" 
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>
                </div>

                <!-- Payroll Table -->
                <div class="bg-white shadow rounded-lg">
                    <div id="payrollTable">
                        ${this.createPayrollTable()}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        if (AuthUtils.hasManagerRole()) {
            document.getElementById('addPayrollBtn').addEventListener('click', () => this.showAddModal());
        }
        
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('dateFromFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('dateToFilter').addEventListener('change', () => this.applyFilters());
        
        feather.replace();
    },

    createPayrollTable() {
        const headers = ['Employee', 'Employee ID', 'Pay Period', 'Base Salary', 'Overtime', 'Gross Pay', 'Net Pay'];
        const actions = [
            { text: 'View', color: 'blue', onClick: 'PayrollModule.showViewModal' }
        ];

        if (AuthUtils.hasManagerRole()) {
            actions.push(
                { text: 'Edit', color: 'green', onClick: 'PayrollModule.showEditModal' },
                { text: 'Delete', color: 'red', onClick: 'PayrollModule.deletePayrollEntry' }
            );
        }

        const tableData = this.data.map(entry => ({
            id: entry.id,
            employee_name: entry.employee_name,
            employee_id: entry.employee_id,
            pay_period: `${formatDate(entry.pay_period_start)} - ${formatDate(entry.pay_period_end)}`,
            base_salary: `$${entry.base_salary.toFixed(2)}`,
            overtime: entry.overtime_hours > 0 ? `${entry.overtime_hours}h @ $${entry.overtime_rate.toFixed(2)}` : 'None',
            gross_pay: `$${entry.gross_pay.toFixed(2)}`,
            net_pay: `$${entry.net_pay.toFixed(2)}`
        }));

        return Components.createTable(headers, tableData, actions);
    },

    getTotalGrossPay() {
        return this.data.reduce((total, entry) => total + entry.gross_pay, 0);
    },

    getTotalNetPay() {
        return this.data.reduce((total, entry) => total + entry.net_pay, 0);
    },

    getUniqueEmployees() {
        const uniqueEmployees = new Set(this.data.map(entry => entry.employee_id));
        return uniqueEmployees.size;
    },

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const dateFrom = document.getElementById('dateFromFilter').value;
        const dateTo = document.getElementById('dateToFilter').value;

        let filteredData = this.data;

        // Apply search filter
        if (searchTerm) {
            filteredData = filteredData.filter(entry => 
                entry.employee_name.toLowerCase().includes(searchTerm) ||
                entry.employee_id.toLowerCase().includes(searchTerm)
            );
        }

        // Apply date filters
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filteredData = filteredData.filter(entry => 
                new Date(entry.pay_period_start) >= fromDate
            );
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            filteredData = filteredData.filter(entry => 
                new Date(entry.pay_period_end) <= toDate
            );
        }

        // Update table with filtered data
        const originalData = this.data;
        this.data = filteredData;
        document.getElementById('payrollTable').innerHTML = this.createPayrollTable();
        this.data = originalData;
        
        feather.replace();
    },

    showAddModal() {
        const fields = [
            { name: 'employee_name', type: 'text', label: 'Employee Name', required: true, placeholder: 'Enter employee name' },
            { name: 'employee_id', type: 'text', label: 'Employee ID', required: true, placeholder: 'Enter employee ID' },
            { name: 'base_salary', type: 'number', label: 'Base Salary', required: true, step: '0.01', min: '0', placeholder: '0.00' },
            { name: 'overtime_hours', type: 'number', label: 'Overtime Hours', step: '0.5', min: '0', placeholder: '0' },
            { name: 'overtime_rate', type: 'number', label: 'Overtime Rate per Hour', step: '0.01', min: '0', placeholder: '0.00' },
            { name: 'bonus', type: 'number', label: 'Bonus', step: '0.01', min: '0', placeholder: '0.00' },
            { name: 'deductions', type: 'number', label: 'Deductions', step: '0.01', min: '0', placeholder: '0.00' },
            { name: 'pay_period_start', type: 'date', label: 'Pay Period Start', required: true },
            { name: 'pay_period_end', type: 'date', label: 'Pay Period End', required: true }
        ];

        const modal = Components.createModal(
            'Add Payroll Entry',
            Components.createForm(fields, (data) => this.createPayrollEntry(data, modal), 'Add Entry'),
            'max-w-lg'
        );
    },

    showEditModal(entry) {
        const payrollEntry = this.data.find(p => p.id === entry.id);
        if (!payrollEntry) return;

        const fields = [
            { name: 'employee_name', type: 'text', label: 'Employee Name', required: true, placeholder: 'Enter employee name' },
            { name: 'employee_id', type: 'text', label: 'Employee ID', required: true, placeholder: 'Enter employee ID' },
            { name: 'base_salary', type: 'number', label: 'Base Salary', required: true, step: '0.01', min: '0', placeholder: '0.00' },
            { name: 'overtime_hours', type: 'number', label: 'Overtime Hours', step: '0.5', min: '0', placeholder: '0' },
            { name: 'overtime_rate', type: 'number', label: 'Overtime Rate per Hour', step: '0.01', min: '0', placeholder: '0.00' },
            { name: 'bonus', type: 'number', label: 'Bonus', step: '0.01', min: '0', placeholder: '0.00' },
            { name: 'deductions', type: 'number', label: 'Deductions', step: '0.01', min: '0', placeholder: '0.00' },
            { name: 'pay_period_start', type: 'date', label: 'Pay Period Start', required: true },
            { name: 'pay_period_end', type: 'date', label: 'Pay Period End', required: true }
        ];

        const modal = Components.createModal(
            'Edit Payroll Entry',
            Components.createForm(fields, (data) => this.updatePayrollEntry(payrollEntry.id, data, modal), 'Update Entry'),
            'max-w-lg'
        );

        // Pre-populate form fields
        setTimeout(() => {
            const form = modal.querySelector('form');
            form.employee_name.value = payrollEntry.employee_name || '';
            form.employee_id.value = payrollEntry.employee_id || '';
            form.base_salary.value = payrollEntry.base_salary || '';
            form.overtime_hours.value = payrollEntry.overtime_hours || '';
            form.overtime_rate.value = payrollEntry.overtime_rate || '';
            form.bonus.value = payrollEntry.bonus || '';
            form.deductions.value = payrollEntry.deductions || '';
            form.pay_period_start.value = payrollEntry.pay_period_start ? payrollEntry.pay_period_start.split('T')[0] : '';
            form.pay_period_end.value = payrollEntry.pay_period_end ? payrollEntry.pay_period_end.split('T')[0] : '';
        }, 10);
    },

    showViewModal(entry) {
        const payrollEntry = this.data.find(p => p.id === entry.id);
        if (!payrollEntry) return;

        const content = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-medium text-gray-900">Employee Information</h4>
                        <p class="text-sm text-gray-600">Name: ${payrollEntry.employee_name}</p>
                        <p class="text-sm text-gray-600">Employee ID: ${payrollEntry.employee_id}</p>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900">Pay Period</h4>
                        <p class="text-sm text-gray-600">From: ${formatDate(payrollEntry.pay_period_start)}</p>
                        <p class="text-sm text-gray-600">To: ${formatDate(payrollEntry.pay_period_end)}</p>
                    </div>
                </div>

                <div>
                    <h4 class="font-medium text-gray-900 mb-2">Pay Breakdown</h4>
                    <table class="w-full">
                        <tbody class="divide-y divide-gray-200">
                            <tr>
                                <td class="py-2 text-sm text-gray-600">Base Salary</td>
                                <td class="py-2 text-sm text-gray-900 text-right">$${payrollEntry.base_salary.toFixed(2)}</td>
                            </tr>
                            ${payrollEntry.overtime_hours > 0 ? `
                                <tr>
                                    <td class="py-2 text-sm text-gray-600">Overtime (${payrollEntry.overtime_hours} hrs @ $${payrollEntry.overtime_rate.toFixed(2)}/hr)</td>
                                    <td class="py-2 text-sm text-gray-900 text-right">$${(payrollEntry.overtime_hours * payrollEntry.overtime_rate).toFixed(2)}</td>
                                </tr>
                            ` : ''}
                            ${payrollEntry.bonus > 0 ? `
                                <tr>
                                    <td class="py-2 text-sm text-gray-600">Bonus</td>
                                    <td class="py-2 text-sm text-gray-900 text-right">$${payrollEntry.bonus.toFixed(2)}</td>
                                </tr>
                            ` : ''}
                            <tr class="border-t-2 border-gray-300">
                                <td class="py-2 text-sm font-medium text-gray-900">Gross Pay</td>
                                <td class="py-2 text-sm font-medium text-gray-900 text-right">$${payrollEntry.gross_pay.toFixed(2)}</td>
                            </tr>
                            ${payrollEntry.deductions > 0 ? `
                                <tr>
                                    <td class="py-2 text-sm text-red-600">Deductions</td>
                                    <td class="py-2 text-sm text-red-600 text-right">-$${payrollEntry.deductions.toFixed(2)}</td>
                                </tr>
                            ` : ''}
                            <tr class="border-t-2 border-gray-300 bg-gray-50">
                                <td class="py-2 text-base font-bold text-gray-900">Net Pay</td>
                                <td class="py-2 text-base font-bold text-gray-900 text-right">$${payrollEntry.net_pay.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-500">
                        Created: ${formatDateTime(payrollEntry.created_at)}
                    </p>
                </div>
            </div>
        `;

        Components.createModal(`Payroll Entry - ${payrollEntry.employee_name}`, content, 'max-w-2xl');
    },

    async createPayrollEntry(data, modal) {
        try {
            await axios.post('/payroll', {
                ...data,
                base_salary: parseFloat(data.base_salary),
                overtime_hours: parseFloat(data.overtime_hours) || 0,
                overtime_rate: parseFloat(data.overtime_rate) || 0,
                bonus: parseFloat(data.bonus) || 0,
                deductions: parseFloat(data.deductions) || 0,
                pay_period_start: new Date(data.pay_period_start).toISOString(),
                pay_period_end: new Date(data.pay_period_end).toISOString()
            });
            
            Components.closeModal(modal);
            Components.showAlert('Payroll entry created successfully', 'success');
            await this.fetchPayroll();
            this.render();
        } catch (error) {
            console.error('Error creating payroll entry:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to create payroll entry', 'error');
        }
    },

    async updatePayrollEntry(entryId, data, modal) {
        try {
            await axios.put(`/payroll/${entryId}`, {
                ...data,
                base_salary: parseFloat(data.base_salary),
                overtime_hours: parseFloat(data.overtime_hours) || 0,
                overtime_rate: parseFloat(data.overtime_rate) || 0,
                bonus: parseFloat(data.bonus) || 0,
                deductions: parseFloat(data.deductions) || 0,
                pay_period_start: new Date(data.pay_period_start).toISOString(),
                pay_period_end: new Date(data.pay_period_end).toISOString()
            });
            
            Components.closeModal(modal);
            Components.showAlert('Payroll entry updated successfully', 'success');
            await this.fetchPayroll();
            this.render();
        } catch (error) {
            console.error('Error updating payroll entry:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to update payroll entry', 'error');
        }
    },

    async deletePayrollEntry(entry) {
        if (!confirm(`Are you sure you want to delete the payroll entry for ${entry.employee_name}?`)) {
            return;
        }

        try {
            await axios.delete(`/payroll/${entry.id}`);
            Components.showAlert('Payroll entry deleted successfully', 'success');
            await this.fetchPayroll();
            this.render();
        } catch (error) {
            console.error('Error deleting payroll entry:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to delete payroll entry', 'error');
        }
    }
};
