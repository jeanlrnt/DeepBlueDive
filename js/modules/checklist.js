import { showModal, closeModal, toast } from './utils.js';

export class ChecklistManager {
    constructor() {
        this.data = {
            categories: [],
            items: []
        };
        this.initializeEventListeners();
        this.loadFromStorage();
    }

    initializeEventListeners() {
        document.getElementById('newCategoryBtn')?.addEventListener('click', () => this.showNewCategoryModal());
        document.getElementById('newItemBtn')?.addEventListener('click', () => this.showNewItemModal());
        document.getElementById('saveCategoryBtn')?.addEventListener('click', () => this.saveNewCategory());
        document.getElementById('saveItemBtn')?.addEventListener('click', () => this.saveNewItem());
        document.getElementById('saveChecklistBtn')?.addEventListener('click', () => this.saveChecklist());
        document.getElementById('resetChecklistBtn')?.addEventListener('click', () => this.resetChecklist());
        document.getElementById('exportChecklistBtn')?.addEventListener('click', () => this.showExportModal());
        document.getElementById('importChecklistBtn')?.addEventListener('click', () => this.showImportModal());
        document.getElementById('copyChecklistBtn')?.addEventListener('click', () => this.copyToClipboard());
        document.getElementById('confirmImportBtn')?.addEventListener('click', () => this.importChecklist());
        document.getElementById('updateItemBtn')?.addEventListener('click', () => this.updateItem());
        document.getElementById('updateCategoryBtn')?.addEventListener('click', () => this.updateCategory());
        document.getElementById('confirmDeleteItemBtn')?.addEventListener('click', () => this.confirmDeleteItem());
    }

    loadFromStorage() {
        const savedChecklist = localStorage.getItem('diveChecklist');
        if (savedChecklist) {
            this.data = JSON.parse(savedChecklist);
        } else {
            this.initializeDefaultChecklist();
        }
        this.render();
    }

    initializeDefaultChecklist() {
        this.data = {
            categories: [
                { id: 1, name: 'Équipement Principal', icon: 'suitcase', color: 'blue' },
                { id: 2, name: 'Équipement Personnel', icon: 'user', color: 'purple' },
                { id: 3, name: 'Équipement de Sécurité', icon: 'shield-alt', color: 'yellow' }
            ],
            items: [
                { id: 1, categoryId: 1, text: 'Gilet stabilisateur vérifié', checked: false },
                { id: 2, categoryId: 1, text: 'Test des détendeurs', checked: false },
                { id: 3, categoryId: 1, text: 'Bouteille chargée et testée', checked: false },
                { id: 4, categoryId: 2, text: 'Masque et tuba', checked: false },
                { id: 5, categoryId: 2, text: 'Combinaison adaptée', checked: false },
                { id: 6, categoryId: 3, text: 'Parachute de palier', checked: false },
                { id: 7, categoryId: 3, text: 'Couteau/outil de coupe', checked: false }
            ]
        };
    }

    render() {
        const container = document.getElementById('checklistContainer');
        if (!container) return;

        container.innerHTML = '';
        this.data.categories
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(category => {
                const items = this.data.items.filter(item => item.categoryId === category.id);
                container.appendChild(this.createCategoryElement(category, items));
            });

        this.updateCompletionCount();
        this.updateCategoryDropdowns();
    }

    createCategoryElement(category, items) {
        const element = document.createElement('div');
        element.className = 'mb-4';
        
        const header = this.createCategoryHeader(category);
        const itemsList = this.createItemsList(category.id, items);
        
        element.appendChild(header);
        element.appendChild(itemsList);
        return element;
    }

    createCategoryHeader(category) {
        const header = document.createElement('div');
        header.className = 'd-flex align-items-center justify-content-between mb-3';
        
        const titleSection = document.createElement('div');
        titleSection.className = 'd-flex align-items-center';
        
        const iconContainer = document.createElement('div');
        iconContainer.className = `rounded-circle p-2 me-3 ${this.getColorClass(category.color, 'bg')}`;
        
        const icon = document.createElement('i');
        icon.className = `fas ${this.getIconClass(category.icon)} ${this.getColorClass(category.color, 'text')}`;
        iconContainer.appendChild(icon);
        
        const title = document.createElement('h3');
        title.className = 'h5 fw-bold mb-0';
        title.textContent = category.name;
        
        titleSection.appendChild(iconContainer);
        titleSection.appendChild(title);
        
        const buttons = document.createElement('div');
        buttons.className = 'd-flex gap-2';

        const addBtn = this.createButton('plus', 'primary', () => this.showNewItemModalForCategory(category.id));
        const editBtn = this.createButton('edit', 'primary', () => this.showEditCategoryModal(category));
        const deleteBtn = this.createButton('trash', 'danger', () => this.deleteCategory(category.id));
        
        buttons.appendChild(addBtn);
        buttons.appendChild(editBtn);
        buttons.appendChild(deleteBtn);
        
        header.appendChild(titleSection);
        header.appendChild(buttons);
        
        return header;
    }

    showNewItemModalForCategory(categoryId) {
        const modal = document.getElementById('newItemModal');
        if (!modal) return;

        // Pré-sélectionner la catégorie
        const categorySelect = modal.querySelector('#itemCategory');
        if (categorySelect) {
            categorySelect.value = categoryId;
        }
        
        showModal('newItemModal');
    }

    createItemsList(categoryId, items) {
        const list = document.createElement('div');
        list.className = 'ps-5';
        
        items.forEach(item => {
            const itemElement = this.createItemElement(item);
            list.appendChild(itemElement);
        });
        
        return list;
    }

    createItemElement(item) {
        const element = document.createElement('div');
        element.className = `d-flex align-items-center p-3 rounded border mb-2 ${item.checked ? 'border-success bg-success bg-opacity-10' : 'border-gray-200'}`;
        element.dataset.itemId = item.id;
        element.style.cursor = 'pointer';
        
        const checkbox = document.createElement('div');
        checkbox.className = `form-check me-3`;
        
        const checkboxInput = document.createElement('input');
        checkboxInput.className = 'form-check-input';
        checkboxInput.type = 'checkbox';
        checkboxInput.checked = item.checked;
        
        checkbox.appendChild(checkboxInput);
        
        const text = document.createElement('span');
        text.className = 'flex-grow-1 ' + (item.checked ? 'text-muted text-decoration-line-through' : '');
        text.textContent = item.text;
        
        const buttons = document.createElement('div');
        buttons.className = 'ms-auto d-flex gap-2';
        buttons.style.zIndex = '1';
        
        const editBtn = this.createButton('edit', 'primary', () => this.showEditItemModal(item));
        const deleteBtn = this.createButton('trash', 'danger', () => this.deleteItem(item.id));
        
        buttons.appendChild(editBtn);
        buttons.appendChild(deleteBtn);
        
        element.appendChild(checkbox);
        element.appendChild(text);
        element.appendChild(buttons);

        // Ajouter l'événement de clic sur l'élément principal
        element.addEventListener('click', (e) => {
            // Ne pas déclencher si on clique sur la checkbox ou les boutons
            if (e.target === checkboxInput || buttons.contains(e.target)) {
                return;
            }
            checkboxInput.checked = !checkboxInput.checked;
            this.toggleItem(item.id);
        });

        // Gérer le clic sur la checkbox séparément
        checkboxInput.addEventListener('click', () => {
            this.toggleItem(item.id);
        });
        
        return element;
    }

    createButton(icon, color, onClick) {
        const button = document.createElement('button');
        button.className = `btn btn-${color} btn-sm`;
        button.innerHTML = `<i class="fas fa-${icon}"></i>`;
        button.addEventListener('click', onClick);
        return button;
    }

    getColorClass(color, type) {
        const colorMap = {
            blue: { bg: 'bg-primary bg-opacity-10', text: 'text-primary' },
            red: { bg: 'bg-danger bg-opacity-10', text: 'text-danger' },
            green: { bg: 'bg-success bg-opacity-10', text: 'text-success' },
            yellow: { bg: 'bg-warning bg-opacity-10', text: 'text-warning' },
            purple: { bg: 'bg-info bg-opacity-10', text: 'text-info' }
        };
        return (colorMap[color] || colorMap.blue)[type];
    }

    getIconClass(iconName) {
        const iconMap = {
            suitcase: 'fa-suitcase',
            user: 'fa-user',
            'shield-alt': 'fa-shield-alt',
            water: 'fa-water',
            gauge: 'fa-gauge',
            mask: 'fa-mask'
        };
        return iconMap[iconName] || 'fa-check';
    }

    showNewCategoryModal() {
        showModal('newCategoryModal');
    }

    showNewItemModal() {
        showModal('newItemModal');
    }

    showEditCategoryModal(category) {
        const modal = document.getElementById('editCategoryModal');
        if (!modal) return;

        modal.querySelector('#editCategoryName').value = category.name;
        modal.querySelector('#editCategoryIcon').value = category.icon;
        modal.querySelector('#editCategoryColor').value = category.color;
        modal.querySelector('#editCategoryId').value = category.id;
        
        showModal('editCategoryModal');
    }

    showEditItemModal(item) {
        const modal = document.getElementById('editItemModal');
        if (!modal) return;

        modal.querySelector('#editItemText').value = item.text;
        modal.querySelector('#editItemCategory').value = item.categoryId;
        modal.querySelector('#editItemId').value = item.id;
        
        showModal('editItemModal');
    }

    saveNewCategory() {
        const name = document.getElementById('categoryName')?.value.trim();
        const icon = document.getElementById('categoryIcon')?.value;
        const color = document.getElementById('categoryColor')?.value;

        if (!name) {
            toast.error('Le nom de la catégorie est requis');
            return;
        }

        const newId = Math.max(0, ...this.data.categories.map(c => c.id)) + 1;
        this.data.categories.push({ id: newId, name, icon, color });
        
        this.saveChecklist();
        closeModal('newCategoryModal');
    }

    saveNewItem() {
        const text = document.getElementById('itemText')?.value.trim();
        const categoryId = parseInt(document.getElementById('itemCategory')?.value);

        if (!text || isNaN(categoryId)) {
            toast.error('Tous les champs sont requis');
            return;
        }

        const newId = Math.max(0, ...this.data.items.map(i => i.id)) + 1;
        this.data.items.push({
            id: newId,
            categoryId,
            text,
            checked: false
        });

        this.saveChecklist();
        closeModal('newItemModal');
    }

    updateCategory() {
        const id = parseInt(document.getElementById('editCategoryId')?.value);
        const name = document.getElementById('editCategoryName')?.value.trim();
        const icon = document.getElementById('editCategoryIcon')?.value;
        const color = document.getElementById('editCategoryColor')?.value;

        if (!name || isNaN(id)) {
            toast.error('Le nom de la catégorie est requis');
            return;
        }

        const index = this.data.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            this.data.categories[index] = { id, name, icon, color };
            this.saveChecklist();
            closeModal('editCategoryModal');
        }
    }

    updateItem() {
        const id = parseInt(document.getElementById('editItemId')?.value);
        const text = document.getElementById('editItemText')?.value.trim();
        const categoryId = parseInt(document.getElementById('editItemCategory')?.value);

        if (!text || isNaN(id) || isNaN(categoryId)) {
            toast.error('Tous les champs sont requis');
            return;
        }

        const index = this.data.items.findIndex(i => i.id === id);
        if (index !== -1) {
            this.data.items[index] = {
                ...this.data.items[index],
                text,
                categoryId
            };
            this.saveChecklist();
            closeModal('editItemModal');
        }
    }

    deleteCategory(categoryId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie et tous ses éléments ?')) {
            return;
        }

        this.data.categories = this.data.categories.filter(c => c.id !== categoryId);
        this.data.items = this.data.items.filter(i => i.categoryId !== categoryId);
        this.saveChecklist();
    }

    deleteItem(itemId) {
        // Stocker l'ID de l'item à supprimer
        const deleteItemIdInput = document.getElementById('deleteItemId');
        if (deleteItemIdInput) {
            deleteItemIdInput.value = itemId;
        }
        // Afficher la modale de confirmation
        showModal('deleteItemModal');
    }

    confirmDeleteItem() {
        const itemId = parseInt(document.getElementById('deleteItemId')?.value);
        if (!isNaN(itemId)) {
            this.data.items = this.data.items.filter(i => i.id !== itemId);
            this.saveChecklist();
            closeModal('deleteItemModal');
            toast.success('Élément supprimé avec succès');
        }
    }

    toggleItem(itemId) {
        const item = this.data.items.find(i => i.id === itemId);
        if (item) {
            item.checked = !item.checked;
            this.saveChecklist();
        }
    }

    resetChecklist() {
        if (!confirm('Voulez-vous réinitialiser toute la liste ? Cela décochera tous les éléments.')) {
            return;
        }

        this.data.items.forEach(item => item.checked = false);
        this.saveChecklist();
    }

    saveChecklist() {
        localStorage.setItem('diveChecklist', JSON.stringify(this.data));
        this.render();
    }

    updateCompletionCount() {
        const total = this.data.items.length;
        const completed = this.data.items.filter(i => i.checked).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const countElement = document.getElementById('completionCount');
        const percentageElement = document.getElementById('completionPercentage');
        
        if (countElement) countElement.textContent = `${completed}/${total}`;
        if (percentageElement) percentageElement.textContent = `(${percentage}%)`;
    }

    updateCategoryDropdowns() {
        const dropdowns = ['itemCategory', 'editItemCategory'].map(id => 
            document.getElementById(id)
        ).filter(Boolean);

        dropdowns.forEach(dropdown => {
            dropdown.innerHTML = '';
            this.data.categories
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    dropdown.appendChild(option);
                });
        });
    }

    showExportModal() {
        const exportData = JSON.stringify(this.data, null, 2);
        const textArea = document.getElementById('checklistData');
        if (textArea) {
            textArea.value = exportData;
        }
        document.getElementById('exportSection').classList.remove('d-none');
        document.getElementById('importSection').classList.add('d-none');
        document.getElementById('confirmImportBtn').classList.add('d-none');
        document.getElementById('importExportTitle').textContent = 'Export Checklist';
        showModal('importExportModal');
    }

    showImportModal() {
        document.getElementById('exportSection').classList.add('d-none');
        document.getElementById('importSection').classList.remove('d-none');
        document.getElementById('confirmImportBtn').classList.remove('d-none');
        document.getElementById('importExportTitle').textContent = 'Import Checklist';
        const textArea = document.getElementById('importChecklistData');
        if (textArea) {
            textArea.value = '';
        }
        showModal('importExportModal');
    }

    async copyToClipboard() {
        const exportData = document.getElementById('checklistData');
        if (!exportData) return;
        
        try {
            await navigator.clipboard.writeText(exportData.value);
            toast.success('Liste copiée dans le presse-papier');
        } catch (err) {
            toast.error('Erreur lors de la copie');
        }
    }

    importChecklist() {
        const importData = document.getElementById('importChecklistData')?.value;
        if (!importData) {
            toast.error('Veuillez coller les données à importer');
            return;
        }

        try {
            const data = JSON.parse(importData);
            if (!data.categories || !data.items || !Array.isArray(data.categories) || !Array.isArray(data.items)) {
                throw new Error('Format invalide');
            }

            this.data = data;
            this.saveChecklist();
            closeModal('importExportModal');
            toast.success('Liste importée avec succès');
        } catch (e) {
            toast.error('Les données importées sont invalides');
        }
    }
}