// Purchases Management Module
window.PurchasesModule = {
    data: [],
    inventory: [],

    async load() {
        await Promise.all([this.fetchPurchases(), this.fetchInventory()]);
        this.render();
    },

    async fetchPurchases() {
        try {
            const response = await axios.get('/purchases');
            this.data = response.data;
        } catch (error) {
            console.error('Error fetching purchases:', error);
            Components.showAlert('Failed to load purchases data', 'error');
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
        const content = document.getElementById('purchasesContent');
        content.innerHTML = `
            <div class="px-4 py-6 sm:px-0">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Purchase Management</h2>
                    <button id="addPurchaseBtn" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                        <i data-feather="plus" class="w-4 h-4 mr-2"></i>New Purchase
                    </button>
                </div>

                <!-- Purchase Summary -->
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <i data-feather="truck" class="h-6 w-6 text-gray-400"></i>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Total Purchases</dt>
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
                                        <dt class="text-sm font-medium text-gray-500 truncate">Total Spent</dt>
                                        <dd class="text-lg font-medium text-gray-900">$${this.getTotalSpent().toFixed(2)}</dd>
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
                                        <dt class="text-sm font-medium text-gray-500 truncate">Average Purchase</dt>
                                        <dd class="text-lg font-medium text-gray-900">$${this.getAveragePurchase().toFixed(2)}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Purchases Table -->
                <div class="bg-white shadow rounded-lg">
                    <div id="purchasesTable">
                        ${this.createPurchasesTable()}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('addPurchaseBtn').addEventListener('click', () => this.showAddModal());
        
        feather.replace();
    },

    createPurchasesTable() {
        const headers = ['Purchase ID', 'Supplier', 'Date', 'Items', 'Total Amount'];
        const actions = [
            { text: 'View', color: 'blue', onClick: 'PurchasesModule.showViewModal' }
        ];

        if (AuthUtils.hasManagerRole()) {
            actions.push({ text: 'Delete', color: 'red', onClick: 'PurchasesModule.deletePurchase' });
        }

        const tableData = this.data.map(purchase => ({
            id: purchase.id,
            supplier: purchase.supplier_name,
            date: formatDate(purchase.created_at),
            items: purchase.items.length,
            total: `$${purchase.total_amount.toFixed(2)}`
        }));

        return Components.createTable(headers, tableData, actions);
    },

    getTotalSpent() {
        return this.data.reduce((total, purchase) => total + purchase.total_amount, 0);
    },

    getAveragePurchase() {
        if (this.data.length === 0) return 0;
        return this.getTotalSpent() / this.data.length;
    },

    showAddModal() {
        const modal = Components.createModal(
            'New Purchase',
            this.createPurchaseForm(),
            'max-w-4xl'
        );
    },

    createPurchaseForm() {
        return `
            <form id="purchaseForm" class="space-y-4">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Supplier Name</label>
                        <input type="text" name="supplier_name" required
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                               placeholder="Enter supplier name">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Supplier Email</label>
                        <input type="email" name="supplier_email"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                               placeholder="Enter supplier email (optional)">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Purchase Items</label>
                    <div id="purchaseItems">
                        <div class="purchase-item-row bg-gray-50 p-4 rounded-md mb-2">
                            <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div>
                                    <select name="inventory_item_id" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                        <option value="">Select Item</option>
                                        ${this.inventory.map(item => `<option value="${item.id}" data-price="${item.unit_price}">${item.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <input type="number" name="quantity" min="1" required
                                           class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                           placeholder="Quantity">
                                </div>
                                <div>
                                    <input type="number" name="unit_cost" step="0.01" min="0" required
                                           class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                           placeholder="Unit Cost">
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
                        <span id="purchaseTotal" class="text-lg font-bold">$0.00</span>
                    </div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button type="button" class="modal-close px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
                        Create Purchase
                    </button>
                </div>
            </form>
        `;
    },

    setupPurchaseFormEvents(modal) {
        const form = document.getElementById('purchaseForm');
        const addItemBtn = document.getElementById('addItemBtn');
        const purchaseItemsContainer = document.getElementById('purchaseItems');

        // Add item functionality
        addItemBtn.addEventListener('click', () => {
            const newItemRow = this.createPurchaseItemRow();
            purchaseItemsContainer.appendChild(newItemRow);
            this.updateRemoveButtons();
            feather.replace();
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPurchaseForm(form, modal);
        });

        // Initial setup
        this.setupItemRowEvents(purchaseItemsContainer.querySelector('.purchase-item-row'));
        this.updateRemoveButtons();
        feather.replace();
    },

    createPurchaseItemRow() {
        const itemRow = document.createElement('div');
        itemRow.className = 'purchase-item-row bg-gray-50 p-4 rounded-md mb-2';
        itemRow.innerHTML = `
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                    <select name="inventory_item_id" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Item</option>
                        ${this.inventory.map(item => `<option value="${item.id}" data-price="${item.unit_price}">${item.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <input type="number" name="quantity" min="1" required
                           class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Quantity">
                </div>
                <div>
                    <input type="number" name="unit_cost" step="0.01" min="0" required
                           class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Unit Cost">
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
        const costInput = itemRow.querySelector('input[name="unit_cost"]');
        const quantityInput = itemRow.querySelector('input[name="quantity"]');
        const removeBtn = itemRow.querySelector('.remove-item');

        // Auto-fill cost when item is selected
        select.addEventListener('change', () => {
            const selectedOption = select.options[select.selectedIndex];
            if (selectedOption.value) {
                costInput.value = selectedOption.dataset.price;
                this.updateTotal();
            }
        });

        // Update total when quantity or cost changes
        quantityInput.addEventListener('input', () => this.updateTotal());
        costInput.addEventListener('input', () => this.updateTotal());

        // Remove item row
        removeBtn.addEventListener('click', () => {
            itemRow.remove();
            this.updateRemoveButtons();
            this.updateTotal();
        });
    },

    updateRemoveButtons() {
        const itemRows = document.querySelectorAll('.purchase-item-row');
        const removeButtons = document.querySelectorAll('.remove-item');
        
        removeButtons.forEach((btn, index) => {
            btn.style.display = itemRows.length > 1 ? 'block' : 'none';
        });
    },

    updateTotal() {
        const itemRows = document.querySelectorAll('.purchase-item-row');
        let total = 0;

        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('input[name="quantity"]').value) || 0;
            const cost = parseFloat(row.querySelector('input[name="unit_cost"]').value) || 0;
            total += quantity * cost;
        });

        document.getElementById('purchaseTotal').textContent = `$${total.toFixed(2)}`;
    },

    async processPurchaseForm(form, modal) {
        const formData = new FormData(form);
        
        // Collect purchase items
        const itemRows = document.querySelectorAll('.purchase-item-row');
        const items = [];

        for (let i = 0; i < itemRows.length; i++) {
            const row = itemRows[i];
            const itemId = parseInt(row.querySelector('select[name="inventory_item_id"]').value);
            const quantity = parseInt(row.querySelector('input[name="quantity"]').value);
            const unitCost = parseFloat(row.querySelector('input[name="unit_cost"]').value);

            if (itemId && quantity && unitCost) {
                items.push({
                    inventory_item_id: itemId,
                    quantity: quantity,
                    unit_cost: unitCost
                });
            }
        }

        if (items.length === 0) {
            Components.showAlert('Please add at least one item to the purchase', 'error');
            return;
        }

        const purchaseData = {
            supplier_name: formData.get('supplier_name'),
            supplier_email: formData.get('supplier_email') || null,
            items: items,
            notes: formData.get('notes') || null
        };

        try {
            await axios.post('/purchases', purchaseData);
            Components.closeModal(modal);
            Components.showAlert('Purchase created successfully', 'success');
            await this.fetchPurchases();
            this.render();
        } catch (error) {
            console.error('Error creating purchase:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to create purchase', 'error');
        }
    },

    showViewModal(purchase) {
        const purchaseDetails = this.data.find(p => p.id === purchase.id);
        if (!purchaseDetails) return;

        const itemsHtml = purchaseDetails.items.map(item => `
            <tr>
                <td class="px-4 py-2 border-b">${item.inventory_item_name}</td>
                <td class="px-4 py-2 border-b text-right">${item.quantity}</td>
                <td class="px-4 py-2 border-b text-right">$${item.unit_cost.toFixed(2)}</td>
                <td class="px-4 py-2 border-b text-right">$${(item.quantity * item.unit_cost).toFixed(2)}</td>
            </tr>
        `).join('');

        const content = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-medium text-gray-900">Supplier Information</h4>
                        <p class="text-sm text-gray-600">Name: ${purchaseDetails.supplier_name}</p>
                        ${purchaseDetails.supplier_email ? `<p class="text-sm text-gray-600">Email: ${purchaseDetails.supplier_email}</p>` : ''}
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900">Purchase Information</h4>
                        <p class="text-sm text-gray-600">Date: ${formatDateTime(purchaseDetails.created_at)}</p>
                        <p class="text-sm text-gray-600">Purchase ID: #${purchaseDetails.id}</p>
                    </div>
                </div>

                <div>
                    <h4 class="font-medium text-gray-900 mb-2">Items</h4>
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                            <tr class="font-medium bg-gray-50">
                                <td colspan="3" class="px-4 py-2 text-right">Total Amount:</td>
                                <td class="px-4 py-2 text-right">$${purchaseDetails.total_amount.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                ${purchaseDetails.notes ? `
                    <div>
                        <h4 class="font-medium text-gray-900">Notes</h4>
                        <p class="text-sm text-gray-600">${purchaseDetails.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        Components.createModal(`Purchase #${purchaseDetails.id}`, content, 'max-w-3xl');
    },

    async deletePurchase(purchase) {
        if (!confirm(`Are you sure you want to delete purchase #${purchase.id}?`)) {
            return;
        }

        try {
            await axios.delete(`/purchases/${purchase.id}`);
            Components.showAlert('Purchase deleted successfully', 'success');
            await this.fetchPurchases();
            this.render();
        } catch (error) {
            console.error('Error deleting purchase:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to delete purchase', 'error');
        }
    }
};

// Extend modal creation for purchase forms
const originalCreateModalForPurchases = Components.createModal;
Components.createModal = function(title, content, size) {
    const modal = originalCreateModalForPurchases.call(this, title, content, size);
    
    // If this is a purchase form modal, set up the events
    if (content.includes('id="purchaseForm"')) {
        setTimeout(() => {
            window.PurchasesModule.setupPurchaseFormEvents(modal);
        }, 10);
    }
    
    return modal;
};
