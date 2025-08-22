// Reusable UI components
window.Components = {
    
    createModal(title, content, size = 'max-w-md') {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-11/12 ${size} shadow-lg rounded-md bg-white">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">${title}</h3>
                    <button class="modal-close text-gray-400 hover:text-gray-600">
                        <i data-feather="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;
        
        // Add close functionality
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('.modal-close')) {
                this.closeModal(modal);
            }
        });
        
        document.getElementById('modalContainer').appendChild(modal);
        setTimeout(() => feather.replace(), 10);
        
        return modal;
    },

    closeModal(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    },

    createTable(headers, data, actions = []) {
        let tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
        `;
        
        headers.forEach(header => {
            tableHTML += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${header}</th>`;
        });
        
        if (actions.length > 0) {
            tableHTML += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>`;
        }
        
        tableHTML += `
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        if (data.length === 0) {
            const colSpan = headers.length + (actions.length > 0 ? 1 : 0);
            tableHTML += `
                <tr>
                    <td colspan="${colSpan}" class="px-6 py-4 text-center text-sm text-gray-500">
                        No data available
                    </td>
                </tr>
            `;
        } else {
            data.forEach(row => {
                tableHTML += `<tr>`;
                Object.values(row).forEach(cell => {
                    tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cell}</td>`;
                });
                
                if (actions.length > 0) {
                    tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">`;
                    actions.forEach(action => {
                        tableHTML += `<button class="text-${action.color}-600 hover:text-${action.color}-900 mr-3" onclick="${action.onClick}(${JSON.stringify(row).replace(/"/g, '&quot;')})">
                            ${action.text}
                        </button>`;
                    });
                    tableHTML += `</td>`;
                }
                
                tableHTML += `</tr>`;
            });
        }
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        return tableHTML;
    },

    createForm(fields, onSubmit, submitText = 'Submit') {
        let formHTML = `<form class="space-y-4">`;
        
        fields.forEach(field => {
            formHTML += `
                <div>
                    <label class="block text-sm font-medium text-gray-700">${field.label}</label>
            `;
            
            if (field.type === 'select') {
                formHTML += `<select name="${field.name}" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" ${field.required ? 'required' : ''}>`;
                if (field.placeholder) {
                    formHTML += `<option value="">${field.placeholder}</option>`;
                }
                field.options.forEach(option => {
                    formHTML += `<option value="${option.value}">${option.text}</option>`;
                });
                formHTML += `</select>`;
            } else if (field.type === 'textarea') {
                formHTML += `<textarea name="${field.name}" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>`;
            } else {
                formHTML += `<input type="${field.type}" name="${field.name}" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} ${field.step ? `step="${field.step}"` : ''} ${field.min !== undefined ? `min="${field.min}"` : ''}>`;
            }
            
            formHTML += `</div>`;
        });
        
        formHTML += `
            <div class="flex justify-end space-x-3">
                <button type="button" class="modal-close px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    ${submitText}
                </button>
            </div>
        </form>`;
        
        const formContainer = document.createElement('div');
        formContainer.innerHTML = formHTML;
        
        const form = formContainer.querySelector('form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            onSubmit(data);
        });
        
        return formContainer.innerHTML;
    },

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `fixed top-4 right-4 p-4 rounded-md shadow-md z-50 ${
            type === 'success' ? 'bg-green-100 text-green-800' :
            type === 'error' ? 'bg-red-100 text-red-800' :
            type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
        }`;
        alertDiv.innerHTML = `
            <div class="flex">
                <div class="flex-1">
                    ${message}
                </div>
                <button class="ml-3 text-sm" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
};
