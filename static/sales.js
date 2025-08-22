// Sales Management Module
window.SalesModule = {
    data: [],
    inventory: [],

    async load() {
        await Promise.all([this.fetchSales(), this.fetchInventory()]);
        this.render();
    },

    async fetchSales() {
        try {
            const response = await axios.get('/sales');
            this.data = response.data;
        } catch (error) {
            console.error('Error fetching sales:', error);
            Components.showAlert('Failed to load sales data', 'error');
        }
    },

    async fetchInventory() {
        try {
            const response = await axios.get('/inventory');
            this.inventory = response.data;
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    },

    render() {
        const content = document.getElementById('salesContent');
        content.innerHTML = `
            <div class="px-4 py-6 sm:px-0">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Sales Management</h2>
                    <button id="addSaleBtn" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                        <i data-feather="plus" class="w-4 h-4 mr-2"></i>New Sale
                    </button>
                </div>

                <!-- Sales Summary -->
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <i data-feather="shopping-cart" class="h-6 w-6 text-gray-400"></i>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
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
                                        <dt class="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                        <dd class="text-lg font-medium text-gray-900">$${this.getTotalRevenue().toFixed(2)}</dd>
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
                                        <dt class="text-sm font-medium text-gray-500 truncate">Average Sale</dt>
                                        <dd class="text-lg font-medium text-gray-900">$${this.getAverageSale().toFixed(2)}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sales Table -->
                <div class="bg-white shadow rounded-lg">
                    <div id="salesTable">
                        ${this.createSalesTable()}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('addSaleBtn').addEventListener('click', () => this.showAddModal());
        
        feather.replace();
    },

    createSalesTable() {
        const headers = ['Sale ID', 'Customer', 'Date', 'Items', 'Total Amount'];
        const actions = [
            { text: 'View', color: 'blue', onClick: 'SalesModule.showViewModal' }
        ];

        if (AuthUtils.hasManagerRole()) {
            actions.push({ text: 'Delete', color: 'red', onClick: 'SalesModule.deleteSale' });
        }

        const tableData = this.data.map(sale => ({
            id: sale.id,
            customer: sale.customer_name,
            date: formatDate(sale.created_at),
            items: sale.items.length,
            total: `$${sale.total_amount.toFixed(2)}`
        }));

        return Components.createTable(headers, tableData, actions);
    },

    getTotalRevenue() {
        return this.data.reduce((total, sale) => total + sale.total_amount, 0);
    },

    getAverageSale() {
        if (this.data.length === 0) return 0;
        return this.getTotalRevenue() / this.data.length;
    },

    showAddModal() {
        const modal = Components.createModal(
            'New Sale',
            this.createSaleForm(),
            'max-w-4xl'
        );
    },

    createSaleForm() {
        return `
            <form id="saleForm" class="space-y-4">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Customer Name</label>
                        <input type="text" name="customer_name" required
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                               placeholder="Enter customer name">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Customer Email</label>
                        <input type="email" name="customer_email"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                               placeholder="Enter customer email (optional)">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Sale Items</label>
                    <div id="saleItems">
                        <div class="sale-item-row bg-gray-50 p-4 rounded-md mb-2">
                            <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div>
                                    <select name="inventory_item_id" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                        <option value="">Select Item</option>
                                        ${this.inventory.map(item => `<option value="${item.id}" data-price="${item.unit_price}" data-stock="${item.quantity_in_stock}">${item.name} (Stock: ${item.quantity_in_stock})</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <input type="number" name="quantity" min="1" required
                                           class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                           placeholder="Quantity">
                                </div>
                                <div>
                                    <input type="number" name="unit_price" step="0.01" min="0" required
                                           class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                           placeholder="Unit Price">
                                </div>
                                <div class="flex items-end">
                                    <button type="button" class="remove-item bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200" style="display: none;">
                                        <i data-feather="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" id="addItemBtn" class="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                        <i data-feather="plus" class="w-4 h-4 mr-1"></i>Add Item
                    </button>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea name="notes" rows="3"
                              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter any additional notes"></textarea>
                </div>

                <div class="bg-gray-50 p-4 rounded-md">
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-medium">Total: </span>
                        <span id="saleTotal" class="text-lg font-bold">$0.00</span>
                    </div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button type="button" class="modal-close px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                        Create Sale
                    </button>
                </div>
            </form>
        `;
    },

    setupSaleFormEvents(modal) {
        const form = document.getElementById('saleForm');
        const addItemBtn = document.getElementById('addItemBtn');
        const saleItemsContainer = document.getElementById('saleItems');

        // Add item functionality
        addItemBtn.addEventListener('click', () => {
            const newItemRow = this.createSaleItemRow();
            saleItemsContainer.appendChild(newItemRow);
            this.updateRemoveButtons();
            feather.replace();
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processSaleForm(form, modal);
        });

        // Initial setup
        this.setupItemRowEvents(saleItemsContainer.querySelector('.sale-item-row'));
        this.updateRemoveButtons();
        feather.replace();
    },

    createSaleItemRow() {
        const itemRow = document.createElement('div');
        itemRow.className = 'sale-item-row bg-gray-50 p-4 rounded-md mb-2';
        itemRow.innerHTML = `
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                    <select name="inventory_item_id" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Item</option>
                        ${this.inventory.map(item => `<option value="${item.id}" data-price="${item.unit_price}" data-stock="${item.quantity_in_stock}">${item.name} (Stock: ${item.quantity_in_stock})</option>`).join('')}
                    </select>
                </div>
                <div>
                    <input type="number" name="quantity" min="1" required
                           class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Quantity">
                </div>
                <div>
                    <input type="number" name="unit_price" step="0.01" min="0" required
                           class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Unit Price">
                </div>
                <div class="flex items-end">
                    <button type="button" class="remove-item bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200">
                        <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;

        this.setupItemRowEvents(itemRow);
        return itemRow;
    },

    setupItemRowEvents(itemRow) {
        const select = itemRow.querySelector('select[name="inventory_item_id"]');
        const priceInput = itemRow.querySelector('input[name="unit_price"]');
        const quantityInput = itemRow.querySelector('input[name="quantity"]');
        const removeBtn = itemRow.querySelector('.remove-item');

        // Auto-fill price when item is selected
        select.addEventListener('change', () => {
            const selectedOption = select.options[select.selectedIndex];
            if (selectedOption.value) {
                priceInput.value = selectedOption.dataset.price;
                this.updateTotal();
            }
        });

        // Update total when quantity or price changes
        quantityInput.addEventListener('input', () => this.updateTotal());
        priceInput.addEventListener('input', () => this.updateTotal());

        // Remove item row
        removeBtn.addEventListener('click', () => {
            itemRow.remove();
            this.updateRemoveButtons();
            this.updateTotal();
        });
    },

    updateRemoveButtons() {
        const itemRows = document.querySelectorAll('.sale-item-row');
        const removeButtons = document.querySelectorAll('.remove-item');
        
        removeButtons.forEach((btn, index) => {
            btn.style.display = itemRows.length > 1 ? 'block' : 'none';
        });
    },

    updateTotal() {
        const itemRows = document.querySelectorAll('.sale-item-row');
        let total = 0;

        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('input[name="quantity"]').value) || 0;
            const price = parseFloat(row.querySelector('input[name="unit_price"]').value) || 0;
            total += quantity * price;
        });

        document.getElementById('saleTotal').textContent = `$${total.toFixed(2)}`;
    },

    async processSaleForm(form, modal) {
        const formData = new FormData(form);
        
        // Collect sale items
        const itemRows = document.querySelectorAll('.sale-item-row');
        const items = [];

        for (let i = 0; i < itemRows.length; i++) {
            const row = itemRows[i];
            const itemId = parseInt(row.querySelector('select[name="inventory_item_id"]').value);
            const quantity = parseInt(row.querySelector('input[name="quantity"]').value);
            const unitPrice = parseFloat(row.querySelector('input[name="unit_price"]').value);

            if (itemId && quantity && unitPrice) {
                items.push({
                    inventory_item_id: itemId,
                    quantity: quantity,
                    unit_price: unitPrice
                });
            }
        }

        if (items.length === 0) {
            Components.showAlert('Please add at least one item to the sale', 'error');
            return;
        }

        const saleData = {
            customer_name: formData.get('customer_name'),
            customer_email: formData.get('customer_email') || null,
            items: items,
            notes: formData.get('notes') || null
        };

        try {
            await axios.post('/sales', saleData);
            Components.closeModal(modal);
            Components.showAlert('Sale created successfully', 'success');
            await this.fetchSales();
            this.render();
        } catch (error) {
            console.error('Error creating sale:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to create sale', 'error');
        }
    },

    showViewModal(sale) {
        const saleDetails = this.data.find(s => s.id === sale.id);
        if (!saleDetails) return;

        const itemsHtml = saleDetails.items.map(item => `
            <tr>
                <td class="px-4 py-2 border-b">${item.inventory_item_name}</td>
                <td class="px-4 py-2 border-b text-right">${item.quantity}</td>
                <td class="px-4 py-2 border-b text-right">$${item.unit_price.toFixed(2)}</td>
                <td class="px-4 py-2 border-b text-right">$${(item.quantity * item.unit_price).toFixed(2)}</td>
            </tr>
        `).join('');

        const content = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-medium text-gray-900">Customer Information</h4>
                        <p class="text-sm text-gray-600">Name: ${saleDetails.customer_name}</p>
                        ${saleDetails.customer_email ? `<p class="text-sm text-gray-600">Email: ${saleDetails.customer_email}</p>` : ''}
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900">Sale Information</h4>
                        <p class="text-sm text-gray-600">Date: ${formatDateTime(saleDetails.created_at)}</p>
                        <p class="text-sm text-gray-600">Sale ID: #${saleDetails.id}</p>
                    </div>
                </div>

                <div>
                    <h4 class="font-medium text-gray-900 mb-2">Items</h4>
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                            <tr class="font-medium bg-gray-50">
                                <td colspan="3" class="px-4 py-2 text-right">Total Amount:</td>
                                <td class="px-4 py-2 text-right">$${saleDetails.total_amount.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                ${saleDetails.notes ? `
                    <div>
                        <h4 class="font-medium text-gray-900">Notes</h4>
                        <p class="text-sm text-gray-600">${saleDetails.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        Components.createModal(`Sale #${saleDetails.id}`, content, 'max-w-3xl');
    },

    async deleteSale(sale) {
        if (!confirm(`Are you sure you want to delete sale #${sale.id}?`)) {
            return;
        }

        try {
            await axios.delete(`/sales/${sale.id}`);
            Components.showAlert('Sale deleted successfully', 'success');
            await this.fetchSales();
            this.render();
        } catch (error) {
            console.error('Error deleting sale:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to delete sale', 'error');
        }
    }
};

// Override modal creation to add sale form events
const originalCreateModal = Components.createModal;
Components.createModal = function(title, content, size) {
    const modal = originalCreateModal.call(this, title, content, size);
    
    // If this is a sale form modal, set up the events
    if (content.includes('id="saleForm"')) {
        setTimeout(() => {
            window.SalesModule.setupSaleFormEvents(modal);
        }, 10);
    }
    
    return modal;
};
