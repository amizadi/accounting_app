// Inventory Management Module
window.InventoryModule = {
    data: [],

    async load() {
        await this.fetchInventory();
        this.render();
    },

    async fetchInventory() {
        try {
            const response = await axios.get('/inventory');
            this.data = response.data;
        } catch (error) {
            console.error('Error fetching inventory:', error);
            Components.showAlert('Failed to load inventory data', 'error');
        }
    },

    render() {
        const content = document.getElementById('inventoryContent');
        content.innerHTML = `
            <div class="px-4 py-6 sm:px-0">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Inventory Management</h2>
                    <button id="addInventoryBtn" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <i data-feather="plus" class="w-4 h-4 mr-2"></i>Add Item
                    </button>
                </div>
                
                <!-- Filters -->
                <div class="bg-white shadow rounded-lg p-4 mb-6">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Search</label>
                            <input type="text" id="searchInput" placeholder="Search items..." 
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Category</label>
                            <select id="categoryFilter" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="">All Categories</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Stock Level</label>
                            <select id="stockFilter" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="">All Items</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Inventory Table -->
                <div class="bg-white shadow rounded-lg">
                    <div id="inventoryTable">
                        ${this.createInventoryTable()}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('addInventoryBtn').addEventListener('click', () => this.showAddModal());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('stockFilter').addEventListener('change', () => this.applyFilters());

        // Populate category filter
        this.populateCategoryFilter();
        
        feather.replace();
    },

    createInventoryTable() {
        const headers = ['SKU', 'Name', 'Category', 'Price', 'Stock', 'Reorder Level', 'Status'];
        const actions = [
            { text: 'Edit', color: 'blue', onClick: 'InventoryModule.showEditModal' },
            { text: 'Delete', color: 'red', onClick: 'InventoryModule.deleteItem' }
        ];

        const tableData = this.data.map(item => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category,
            price: `$${item.unit_price.toFixed(2)}`,
            stock: item.quantity_in_stock,
            reorder_level: item.reorder_level,
            status: item.quantity_in_stock <= item.reorder_level ? 
                '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Low Stock</span>' :
                item.quantity_in_stock === 0 ?
                '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Out of Stock</span>' :
                '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>'
        }));

        return Components.createTable(headers, tableData, actions);
    },

    populateCategoryFilter() {
        const categories = [...new Set(this.data.map(item => item.category))].sort();
        const categoryFilter = document.getElementById('categoryFilter');
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    },

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;

        let filteredData = this.data;

        // Apply search filter
        if (searchTerm) {
            filteredData = filteredData.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.sku.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm)
            );
        }

        // Apply category filter
        if (categoryFilter) {
            filteredData = filteredData.filter(item => item.category === categoryFilter);
        }

        // Apply stock filter
        if (stockFilter === 'low') {
            filteredData = filteredData.filter(item => 
                item.quantity_in_stock <= item.reorder_level && item.quantity_in_stock > 0);
        } else if (stockFilter === 'out') {
            filteredData = filteredData.filter(item => item.quantity_in_stock === 0);
        }

        // Update table with filtered data
        const originalData = this.data;
        this.data = filteredData;
        document.getElementById('inventoryTable').innerHTML = this.createInventoryTable();
        this.data = originalData;
        
        feather.replace();
    },

    showAddModal() {
        const fields = [
            { name: 'name', type: 'text', label: 'Item Name', required: true, placeholder: 'Enter item name' },
            { name: 'sku', type: 'text', label: 'SKU', required: true, placeholder: 'Enter SKU' },
            { name: 'description', type: 'textarea', label: 'Description', placeholder: 'Enter description' },
            { name: 'category', type: 'text', label: 'Category', required: true, placeholder: 'Enter category' },
            { name: 'unit_price', type: 'number', label: 'Unit Price', required: true, step: '0.01', min: '0', placeholder: '0.00' },
            { name: 'quantity_in_stock', type: 'number', label: 'Initial Stock', required: true, min: '0', placeholder: '0' },
            { name: 'reorder_level', type: 'number', label: 'Reorder Level', required: true, min: '0', placeholder: '0' }
        ];

        const modal = Components.createModal(
            'Add Inventory Item',
            Components.createForm(fields, (data) => this.createItem(data, modal), 'Add Item'),
            'max-w-lg'
        );
    },

    showEditModal(item) {
        const fields = [
            { name: 'name', type: 'text', label: 'Item Name', required: true, placeholder: 'Enter item name' },
            { name: 'sku', type: 'text', label: 'SKU', required: true, placeholder: 'Enter SKU' },
            { name: 'description', type: 'textarea', label: 'Description', placeholder: 'Enter description' },
            { name: 'category', type: 'text', label: 'Category', required: true, placeholder: 'Enter category' },
            { name: 'unit_price', type: 'number', label: 'Unit Price', required: true, step: '0.01', min: '0', placeholder: '0.00' },
            { name: 'quantity_in_stock', type: 'number', label: 'Current Stock', required: true, min: '0', placeholder: '0' },
            { name: 'reorder_level', type: 'number', label: 'Reorder Level', required: true, min: '0', placeholder: '0' }
        ];

        const modal = Components.createModal(
            'Edit Inventory Item',
            Components.createForm(fields, (data) => this.updateItem(item.id, data, modal), 'Update Item'),
            'max-w-lg'
        );

        // Pre-populate form fields
        setTimeout(() => {
            const form = modal.querySelector('form');
            form.name.value = item.name || '';
            form.sku.value = item.sku || '';
            form.description.value = item.description || '';
            form.category.value = item.category || '';
            form.unit_price.value = item.unit_price || '';
            form.quantity_in_stock.value = item.quantity_in_stock || '';
            form.reorder_level.value = item.reorder_level || '';
        }, 10);
    },

    async createItem(data, modal) {
        try {
            await axios.post('/inventory', {
                ...data,
                unit_price: parseFloat(data.unit_price),
                quantity_in_stock: parseInt(data.quantity_in_stock),
                reorder_level: parseInt(data.reorder_level)
            });
            
            Components.closeModal(modal);
            Components.showAlert('Inventory item added successfully', 'success');
            await this.fetchInventory();
            this.render();
        } catch (error) {
            console.error('Error creating inventory item:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to add inventory item', 'error');
        }
    },

    async updateItem(itemId, data, modal) {
        try {
            await axios.put(`/inventory/${itemId}`, {
                ...data,
                unit_price: parseFloat(data.unit_price),
                quantity_in_stock: parseInt(data.quantity_in_stock),
                reorder_level: parseInt(data.reorder_level)
            });
            
            Components.closeModal(modal);
            Components.showAlert('Inventory item updated successfully', 'success');
            await this.fetchInventory();
            this.render();
        } catch (error) {
            console.error('Error updating inventory item:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to update inventory item', 'error');
        }
    },

    async deleteItem(item) {
        if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
            return;
        }

        try {
            await axios.delete(`/inventory/${item.id}`);
            Components.showAlert('Inventory item deleted successfully', 'success');
            await this.fetchInventory();
            this.render();
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            Components.showAlert(error.response?.data?.detail || 'Failed to delete inventory item', 'error');
        }
    }
};
