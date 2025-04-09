// Tab functionality
function openTab(evt, tabName) {
    // Hide all tab content
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("bg-blue-600", "text-white");
        tabButtons[i].classList.add("bg-white", "text-blue-600", "border");
    }

    // Show the current tab and add active class to button
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.remove("bg-white", "text-blue-600", "border");
    evt.currentTarget.classList.add("bg-blue-600", "text-white");
}

// Modal functionality
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Checklist functionality
document.addEventListener('DOMContentLoaded', function () {
    // Initialize checklist from localStorage or default data
    initializeChecklist();

    // Event listeners for buttons
    document.getElementById('newCategoryBtn').addEventListener('click', showNewCategoryModal);
    document.getElementById('newItemBtn').addEventListener('click', showNewItemModal);
    document.getElementById('saveCategoryBtn').addEventListener('click', saveNewCategory);
    document.getElementById('saveItemBtn').addEventListener('click', saveNewItem);
    document.getElementById('saveChecklistBtn').addEventListener('click', saveChecklist);
    document.getElementById('resetChecklistBtn').addEventListener('click', resetChecklist);
    document.getElementById('exportChecklistBtn').addEventListener('click', showExportModal);
    document.getElementById('importChecklistBtn').addEventListener('click', showImportModal);
    document.getElementById('copyChecklistBtn').addEventListener('click', copyChecklistToClipboard);
    document.getElementById('confirmImportBtn').addEventListener('click', importChecklist);
    document.getElementById('updateItemBtn').addEventListener('click', updateItem);
    document.getElementById('updateCategoryBtn').addEventListener('click', updateCategory);

    // Initialize drag and drop
    setupDragAndDrop();
});

// Checklist data structure
let checklistData = {
    categories: [],
    items: []
};

// Color classes mapping
const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' }
};

// Icon mapping
const iconMapping = {
    'suitcase': 'fa-suitcase',
    'user': 'fa-user',
    'shield-alt': 'fa-shield-alt',
    'water': 'fa-water',
    'tint': 'fa-tint',
    'life-ring': 'fa-life-ring',
    'weight-hanging': 'fa-weight-hanging',
    'gauge': 'fa-gauge',
    'mask': 'fa-mask'
};

// Initialize checklist
function initializeChecklist() {
    const savedChecklist = localStorage.getItem('diveChecklist');

    if (savedChecklist) {
        checklistData = JSON.parse(savedChecklist);
    } else {
        // Default checklist data
        checklistData = {
            categories: [
                { id: 1, name: 'Main Equipment', icon: 'suitcase', color: 'blue' },
                { id: 2, name: 'Personal Gear', icon: 'user', color: 'purple' },
                { id: 3, name: 'Safety Equipment', icon: 'shield-alt', color: 'yellow' }
            ],
            items: [
                { id: 1, categoryId: 1, text: 'BCD checked for leaks and proper inflation', checked: false },
                { id: 2, categoryId: 1, text: 'Regulator breathing test (both primary and alternate)', checked: false },
                { id: 3, categoryId: 1, text: 'Tank valve opens/closes properly', checked: false },
                { id: 4, categoryId: 1, text: 'Weight system secure and quick-release functional', checked: false },
                { id: 5, categoryId: 2, text: 'Mask fits properly with no leaks', checked: false },
                { id: 6, categoryId: 2, text: 'Fins straps secure and comfortable', checked: false },
                { id: 7, categoryId: 2, text: 'Exposure protection appropriate for conditions', checked: false },
                { id: 8, categoryId: 2, text: 'Dive computer battery level adequate', checked: false },
                { id: 9, categoryId: 3, text: 'SMB/spool present and functional', checked: false },
                { id: 10, categoryId: 3, text: 'Cutting tool accessible', checked: false },
                { id: 11, categoryId: 3, text: 'Whistle/alert device functional', checked: false }
            ]
        };
    }

    renderChecklist();
    updateCompletionCount();
}

// Render checklist
function renderChecklist() {
    const container = document.getElementById('checklistContainer');
    container.innerHTML = '';

    // Group items by category
    const itemsByCategory = {};
    checklistData.items.forEach(item => {
        if (!itemsByCategory[item.categoryId]) {
            itemsByCategory[item.categoryId] = [];
        }
        itemsByCategory[item.categoryId].push(item);
    });

    // Sort categories by name
    const sortedCategories = [...checklistData.categories].sort((a, b) => a.name.localeCompare(b.name));

    // Render each category with its items
    sortedCategories.forEach(category => {
        const categoryItems = itemsByCategory[category.id] || [];

        const categoryElement = document.createElement('div');
        categoryElement.className = 'mb-6';

        // Category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'flex items-center mb-4';

        const iconDiv = document.createElement('div');
        iconDiv.className = `w-8 h-8 rounded-full ${colorClasses[category.color].bg} flex items-center justify-center mr-3`;

        const icon = document.createElement('i');
        icon.className = `fas ${iconMapping[category.icon] || 'fa-question'} ${colorClasses[category.color].text}`;
        iconDiv.appendChild(icon);

        const categoryName = document.createElement('h3');
        categoryName.className = 'font-semibold text-blue-900';
        categoryName.textContent = category.name;

        categoryHeader.appendChild(iconDiv);
        categoryHeader.appendChild(categoryName);

        // Items list
        const itemsList = document.createElement('div');
        itemsList.className = 'space-y-3 pl-11';
        itemsList.dataset.categoryId = category.id;

        categoryItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = `checklist-item flex items-center p-3 border rounded-lg cursor-pointer transition-all ${item.checked ? 'checked' : ''}`;
            itemElement.dataset.itemId = item.id;
            itemElement.draggable = true;

            const checkBox = document.createElement('div');
            checkBox.className = `w-5 h-5 rounded-full border-2 ${item.checked ? 'bg-green-100 border-green-300' : 'border-gray-300'} mr-3 flex-shrink-0 flex items-center justify-center`;

            if (item.checked) {
                const checkIcon = document.createElement('i');
                checkIcon.className = 'fas fa-check text-green-600 text-xs';
                checkBox.appendChild(checkIcon);
            }

            const itemText = document.createElement('span');
            itemText.className = item.checked ? 'text-gray-500 line-through' : '';
            itemText.textContent = item.text;

            // Add edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'ml-2 text-gray-400 hover:text-blue-500';
            editBtn.innerHTML = '<i class="fas fa-edit text-xs"></i>';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showEditItemModal(item.id);
            });

            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'ml-2 text-gray-400 hover:text-red-500';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt text-xs"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChecklistItem(item.id);
            });

            itemElement.appendChild(checkBox);
            itemElement.appendChild(itemText);
            itemElement.appendChild(editBtn);
            itemElement.appendChild(deleteBtn);

            itemElement.addEventListener('click', function () {
                toggleCheck(this);
            });

            // Drag and drop event listeners
            itemElement.addEventListener('dragstart', handleDragStart);
            itemElement.addEventListener('dragover', handleDragOver);
            itemElement.addEventListener('dragleave', handleDragLeave);
            itemElement.addEventListener('drop', handleDrop);
            itemElement.addEventListener('dragend', handleDragEnd);

            itemsList.appendChild(itemElement);
        });

        // Add edit category button
        const editCategoryBtn = document.createElement('button');
        editCategoryBtn.className = 'ml-2 text-sm text-blue-600 hover:text-blue-800 flex items-center';
        editCategoryBtn.innerHTML = '<i class="fas fa-edit mr-1"></i> Edit';
        editCategoryBtn.addEventListener('click', () => {
            showEditCategoryModal(category.id);
        });

        // Add delete category button
        const deleteCategoryBtn = document.createElement('button');
        deleteCategoryBtn.className = 'ml-2 text-sm text-red-600 hover:text-red-800 flex items-center';
        deleteCategoryBtn.innerHTML = '<i class="fas fa-trash mr-1"></i> Delete';
        deleteCategoryBtn.addEventListener('click', () => {
            if (confirm(`Delete category "${category.name}" and all its items?`)) {
                deleteCategory(category.id);
            }
        });

        categoryHeader.appendChild(editCategoryBtn);
        categoryHeader.appendChild(deleteCategoryBtn);

        categoryElement.appendChild(categoryHeader);
        categoryElement.appendChild(itemsList);
        container.appendChild(categoryElement);
    });

    // Update category dropdown in new item modal
    updateCategoryDropdown();
}

// Toggle checklist item
function toggleCheck(element) {
    const itemId = parseInt(element.dataset.itemId);
    const item = checklistData.items.find(i => i.id === itemId);

    if (item) {
        item.checked = !item.checked;
        saveChecklist();

        if (item.checked) {
            element.classList.add('checked');
            const checkBox = element.querySelector('div');
            checkBox.innerHTML = '<i class="fas fa-check text-green-600 text-xs"></i>';
            checkBox.classList.remove('border-gray-300');
            checkBox.classList.add('bg-green-100', 'border-green-300');
            const text = element.querySelector('span');
            text.classList.add('text-gray-500', 'line-through');
        } else {
            element.classList.remove('checked');
            const checkBox = element.querySelector('div');
            checkBox.innerHTML = '';
            checkBox.classList.remove('bg-green-100', 'border-green-300');
            checkBox.classList.add('border-gray-300');
            const text = element.querySelector('span');
            text.classList.remove('text-gray-500', 'line-through');
        }

        updateCompletionCount();
    }
}

// Update completion count
function updateCompletionCount() {
    const totalItems = checklistData.items.length;
    const checkedItems = checklistData.items.filter(item => item.checked).length;
    const percentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    document.getElementById('completionCount').textContent = `${checkedItems}/${totalItems}`;
    document.getElementById('completionPercentage').textContent = `(${percentage}%)`;
}

// Show new category modal
function showNewCategoryModal() {
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryIcon').value = 'suitcase';
    document.getElementById('categoryColor').value = 'blue';
    document.getElementById('newCategoryModal').classList.remove('hidden');
}

// Show edit category modal
function showEditCategoryModal(categoryId) {
    const category = checklistData.categories.find(c => c.id === categoryId);
    if (!category) return;

    document.getElementById('editCategoryName').value = category.name;
    document.getElementById('editCategoryIcon').value = category.icon;
    document.getElementById('editCategoryColor').value = category.color;
    document.getElementById('editCategoryId').value = categoryId;

    // Update dropdowns
    updateCategoryDropdown();

    document.getElementById('editCategoryModal').classList.remove('hidden');
}

// Show new item modal
function showNewItemModal() {
    if (checklistData.categories.length === 0) {
        alert('Please create a category first!');
        showNewCategoryModal();
        return;
    }

    document.getElementById('itemText').value = '';
    document.getElementById('itemCategory').value = checklistData.categories[0].id;
    document.getElementById('newItemModal').classList.remove('hidden');
}

// Show edit item modal
function showEditItemModal(itemId) {
    const item = checklistData.items.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('editItemText').value = item.text;
    document.getElementById('editItemCategory').value = item.categoryId;
    document.getElementById('editItemId').value = itemId;

    // Update dropdowns
    updateCategoryDropdown();

    document.getElementById('editItemModal').classList.remove('hidden');
}

// Update category dropdown
function updateCategoryDropdown() {
    const dropdowns = [
        document.getElementById('itemCategory'),
        document.getElementById('editItemCategory')
    ];

    dropdowns.forEach(dropdown => {
        if (!dropdown) return;

        dropdown.innerHTML = '';

        // Sort categories by name
        const sortedCategories = [...checklistData.categories].sort((a, b) => a.name.localeCompare(b.name));

        sortedCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            dropdown.appendChild(option);
        });
    });
}

// Save new category
function saveNewCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const icon = document.getElementById('categoryIcon').value;
    const color = document.getElementById('categoryColor').value;

    if (!name) {
        alert('Please enter a category name');
        return;
    }

    // Generate new ID
    const newId = checklistData.categories.length > 0 ?
        Math.max(...checklistData.categories.map(c => c.id)) + 1 : 1;

    // Add new category
    checklistData.categories.push({
        id: newId,
        name,
        icon,
        color
    });

    // Save and render
    saveChecklist();
    renderChecklist();

    // Close modal
    document.getElementById('newCategoryModal').classList.add('hidden');

    // Pulse save button to show success
    document.getElementById('saveChecklistBtn').classList.add('pulse');
    setTimeout(() => {
        document.getElementById('saveChecklistBtn').classList.remove('pulse');
    }, 500);
}

// Update category
function updateCategory() {
    const categoryId = parseInt(document.getElementById('editCategoryId').value);
    const name = document.getElementById('editCategoryName').value.trim();
    const icon = document.getElementById('editCategoryIcon').value;
    const color = document.getElementById('editCategoryColor').value;

    if (!name) {
        alert('Please enter a category name');
        return;
    }

    const categoryIndex = checklistData.categories.findIndex(c => c.id === categoryId);
    if (categoryIndex !== -1) {
        checklistData.categories[categoryIndex] = {
            id: categoryId,
            name,
            icon,
            color
        };

        // Save and render
        saveChecklist();
        renderChecklist();

        // Close modal
        document.getElementById('editCategoryModal').classList.add('hidden');

        // Pulse save button to show success
        document.getElementById('saveChecklistBtn').classList.add('pulse');
        setTimeout(() => {
            document.getElementById('saveChecklistBtn').classList.remove('pulse');
        }, 500);
    }
}

// Save new item
function saveNewItem() {
    const text = document.getElementById('itemText').value.trim();
    const categoryId = parseInt(document.getElementById('itemCategory').value);

    if (!text) {
        alert('Please enter item text');
        return;
    }

    // Generate new ID
    const newId = checklistData.items.length > 0 ?
        Math.max(...checklistData.items.map(i => i.id)) + 1 : 1;

    // Add new item
    checklistData.items.push({
        id: newId,
        categoryId,
        text,
        checked: false
    });

    // Save and render
    saveChecklist();
    renderChecklist();

    // Close modal
    document.getElementById('newItemModal').classList.add('hidden');

    // Pulse save button to show success
    document.getElementById('saveChecklistBtn').classList.add('pulse');
    setTimeout(() => {
        document.getElementById('saveChecklistBtn').classList.remove('pulse');
    }, 500);
}

// Update item
function updateItem() {
    const itemId = parseInt(document.getElementById('editItemId').value);
    const text = document.getElementById('editItemText').value.trim();
    const categoryId = parseInt(document.getElementById('editItemCategory').value);

    if (!text) {
        alert('Please enter item text');
        return;
    }

    const itemIndex = checklistData.items.findIndex(i => i.id === itemId);
    if (itemIndex !== -1) {
        checklistData.items[itemIndex] = {
            id: itemId,
            categoryId,
            text,
            checked: checklistData.items[itemIndex].checked
        };

        // Save and render
        saveChecklist();
        renderChecklist();

        // Close modal
        document.getElementById('editItemModal').classList.add('hidden');

        // Pulse save button to show success
        document.getElementById('saveChecklistBtn').classList.add('pulse');
        setTimeout(() => {
            document.getElementById('saveChecklistBtn').classList.remove('pulse');
        }, 500);
    }
}

// Delete checklist item
function deleteChecklistItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        checklistData.items = checklistData.items.filter(item => item.id !== itemId);
        saveChecklist();
        renderChecklist();

        // Pulse save button to show success
        document.getElementById('saveChecklistBtn').classList.add('pulse');
        setTimeout(() => {
            document.getElementById('saveChecklistBtn').classList.remove('pulse');
        }, 500);
    }
}

// Delete category
function deleteCategory(categoryId) {
    // Remove category and its items
    checklistData.categories = checklistData.categories.filter(c => c.id !== categoryId);
    checklistData.items = checklistData.items.filter(i => i.categoryId !== categoryId);

    saveChecklist();
    renderChecklist();

    // Pulse save button to show success
    document.getElementById('saveChecklistBtn').classList.add('pulse');
    setTimeout(() => {
        document.getElementById('saveChecklistBtn').classList.remove('pulse');
    }, 500);
}

// Save checklist to localStorage
function saveChecklist() {
    localStorage.setItem('diveChecklist', JSON.stringify(checklistData));
    updateCompletionCount();
}

// Reset checklist
function resetChecklist() {
    if (confirm('Reset all checklist items to unchecked?')) {
        checklistData.items.forEach(item => {
            item.checked = false;
        });

        saveChecklist();
        renderChecklist();

        // Pulse save button to show success
        document.getElementById('saveChecklistBtn').classList.add('pulse');
        setTimeout(() => {
            document.getElementById('saveChecklistBtn').classList.remove('pulse');
        }, 500);
    }
}

// Show export modal
function showExportModal() {
    document.getElementById('importExportTitle').textContent = 'Export Checklist';
    document.getElementById('exportSection').classList.remove('hidden');
    document.getElementById('importSection').classList.add('hidden');
    document.getElementById('confirmImportBtn').classList.add('hidden');

    // Populate textarea with checklist data
    document.getElementById('checklistData').value = JSON.stringify(checklistData, null, 2);

    document.getElementById('importExportModal').classList.remove('hidden');
}

// Show import modal
function showImportModal() {
    document.getElementById('importExportTitle').textContent = 'Import Checklist';
    document.getElementById('exportSection').classList.add('hidden');
    document.getElementById('importSection').classList.remove('hidden');
    document.getElementById('confirmImportBtn').classList.remove('hidden');

    // Clear import textarea
    document.getElementById('importChecklistData').value = '';

    document.getElementById('importExportModal').classList.remove('hidden');
}

// Copy checklist to clipboard
function copyChecklistToClipboard() {
    const checklistDataText = document.getElementById('checklistData');
    checklistDataText.select();
    document.execCommand('copy');

    // Show feedback
    const copyBtn = document.getElementById('copyChecklistBtn');
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';

    setTimeout(() => {
        copyBtn.innerHTML = originalText;
    }, 2000);
}

// Import checklist
function importChecklist() {
    const importData = document.getElementById('importChecklistData').value.trim();

    if (!importData) {
        alert('Please paste checklist data');
        return;
    }

    try {
        const parsedData = JSON.parse(importData);

        // Basic validation
        if (!parsedData.categories || !parsedData.items) {
            throw new Error('Invalid checklist format');
        }

        // Replace current checklist
        checklistData = parsedData;
        saveChecklist();
        renderChecklist();

        // Close modal
        document.getElementById('importExportModal').classList.add('hidden');

        // Pulse save button to show success
        document.getElementById('saveChecklistBtn').classList.add('pulse');
        setTimeout(() => {
            document.getElementById('saveChecklistBtn').classList.remove('pulse');
        }, 500);

        alert('Checklist imported successfully!');
    } catch (e) {
        alert('Error importing checklist: ' + e.message);
    }
}

// Drag and drop functionality
let draggedItem = null;

function setupDragAndDrop() {
    const checklistContainer = document.getElementById('checklistContainer');

    // Make categories droppable
    const categoryLists = checklistContainer.querySelectorAll('[data-category-id]');
    categoryLists.forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('dragleave', handleDragLeave);
        list.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.dataset.itemId);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Highlight drop target
    if (this.classList.contains('checklist-item')) {
        this.classList.add('over');
    } else if (this.dataset.categoryId) {
        // If dragging over a category list
        this.style.backgroundColor = '#f0f9ff';
    }
}

function handleDragLeave() {
    this.classList.remove('over');
    if (this.dataset.categoryId) {
        this.style.backgroundColor = '';
    }
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('over');

    if (this.dataset.categoryId) {
        this.style.backgroundColor = '';
    }

    const itemId = parseInt(e.dataTransfer.getData('text/plain'));
    const targetCategoryId = this.dataset.categoryId ? parseInt(this.dataset.categoryId) : null;

    // Find the item in our data
    const item = checklistData.items.find(i => i.id === itemId);

    if (item) {
        // If dropped on another item, we'll insert before/after that item
        if (this.classList.contains('checklist-item')) {
            const targetItemId = parseInt(this.dataset.itemId);
            const targetIndex = checklistData.items.findIndex(i => i.id === targetItemId);

            // Remove from current position
            const currentIndex = checklistData.items.findIndex(i => i.id === itemId);
            checklistData.items.splice(currentIndex, 1);

            // Insert at new position
            const rect = this.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const insertPosition = e.clientY < midpoint ? targetIndex : targetIndex + 1;

            checklistData.items.splice(insertPosition, 0, item);
        }
        // If dropped on a category list (but not on an item)
        else if (targetCategoryId) {
            item.categoryId = targetCategoryId;
        }

        saveChecklist();
        renderChecklist();

        // Pulse save button to show success
        document.getElementById('saveChecklistBtn').classList.add('pulse');
        setTimeout(() => {
            document.getElementById('saveChecklistBtn').classList.remove('pulse');
        }, 500);
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;

    // Remove all over classes
    document.querySelectorAll('.checklist-item.over').forEach(item => {
        item.classList.remove('over');
    });

    document.querySelectorAll('[data-category-id]').forEach(list => {
        list.style.backgroundColor = '';
    });
}

// Initialize map
let map = L.map('diveMap').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let marker = null;
map.on('click', function (e) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker(e.latlng).addTo(map);
});

// Dive plan data
let divePlans = [];
let currentPlanId = null;

// DOM elements
const diveSiteInput = document.getElementById('diveSite');
const diveDateInput = document.getElementById('diveDate');
const maxDepthInput = document.getElementById('maxDepth');
const diveDurationInput = document.getElementById('diveDuration');
const waterTempInput = document.getElementById('waterTemp');
const gasMixSelect = document.getElementById('gasMix');
const customGasContainer = document.getElementById('customGasContainer');
const customO2Input = document.getElementById('customO2');
const diveObjectivesInput = document.getElementById('diveObjectives');
const diveNotesInput = document.getElementById('diveNotes');

// Safety calculation elements
const noDecoTimeEl = document.getElementById('noDecoTime');
const surfaceIntervalEl = document.getElementById('surfaceInterval');
const modDepthEl = document.getElementById('modDepth');
const safetyStopEl = document.getElementById('safetyStop');

// Buttons
const newDivePlanBtn = document.getElementById('newDivePlanBtn');
const clearPlanBtn = document.getElementById('clearPlanBtn');
const savePlanBtn = document.getElementById('savePlanBtn');

// Saved plans container
const savedPlansContainer = document.getElementById('savedPlansContainer');
const noPlansMessage = document.getElementById('noPlansMessage');

// Modal elements
const planDetailsModal = document.getElementById('planDetailsModal');

// Dive profile chart
let diveProfileChart = null;

// Event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Load saved plans from localStorage
    loadSavedPlans();

    // Initialize dive profile chart
    initDiveProfileChart();

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    diveDateInput.value = today;

    // Gas mix change handler
    gasMixSelect.addEventListener('change', function () {
        if (this.value === 'custom') {
            customGasContainer.classList.remove('hidden');
        } else {
            customGasContainer.classList.add('hidden');
        }
        calculateSafety();
    });

    // Input change handlers for safety calculations
    maxDepthInput.addEventListener('input', calculateSafety);
    diveDurationInput.addEventListener('input', calculateSafety);
    customO2Input.addEventListener('input', calculateSafety);

    // Button handlers
    newDivePlanBtn.addEventListener('click', clearPlan);
    clearPlanBtn.addEventListener('click', clearPlan);
    savePlanBtn.addEventListener('click', savePlan);

    // Nitrox calculator
    document.getElementById('nitroxO2').addEventListener('input', calculateNitrox);
    document.getElementById('calculateBestMixBtn').addEventListener('click', calculateBestMix);

    // NDL calculator
    document.getElementById('ndlDepth').addEventListener('input', calculateNDL);
    document.getElementById('ndlGasMix').addEventListener('change', calculateNDL);
    document.getElementById('calculateNdlBtn').addEventListener('click', calculateNDL);

    // Safety stop timer
    setupSafetyStopTimer();
});

// Calculate safety parameters
function calculateSafety() {
    const depth = parseFloat(maxDepthInput.value) || 0;
    const duration = parseFloat(diveDurationInput.value) || 0;

    // Get O2 percentage based on gas mix
    let o2Percentage = 21; // Default to air
    if (gasMixSelect.value === 'nitrox32') {
        o2Percentage = 32;
    } else if (gasMixSelect.value === 'nitrox36') {
        o2Percentage = 36;
    } else if (gasMixSelect.value === 'custom') {
        o2Percentage = parseFloat(customO2Input.value) || 21;
    }

    // Calculate MOD (Maximum Operating Depth)
    // MOD = ( (PpO2 / FO2) - 1 ) * 10
    // Where PpO2 is the maximum partial pressure of O2 (typically 1.4 for recreational diving)
    const mod = ((1.4 / (o2Percentage / 100)) - 1) * 10;
    modDepthEl.textContent = mod.toFixed(1) + ' m';

    // Calculate no decompression limit (simplified)
    // This is a very simplified approximation - real dive tables are more complex
    let ndl = 0;
    if (depth <= 12) {
        ndl = 200; // Very long NDL for shallow dives
    } else if (depth <= 18) {
        ndl = 60;
    } else if (depth <= 21) {
        ndl = 45;
    } else if (depth <= 24) {
        ndl = 35;
    } else if (depth <= 27) {
        ndl = 25;
    } else if (depth <= 30) {
        ndl = 20;
    } else if (depth <= 33) {
        ndl = 15;
    } else if (depth <= 36) {
        ndl = 10;
    } else {
        ndl = 5; // Very short for deep dives
    }

    // Adjust NDL for Nitrox
    if (o2Percentage > 21) {
        // Nitrox extends NDL - simplified calculation
        const airEAD = ((1 - (o2Percentage / 100)) / 0.79) * (depth + 10) - 10;
        const airNdl = calculateAirNDL(airEAD);
        ndl = Math.min(ndl * 1.5, airNdl * 1.5); // Cap the extension
    }

    noDecoTimeEl.textContent = ndl.toFixed(0) + ' min';

    // Calculate recommended surface interval
    // Simplified - based on dive duration and depth
    let surfaceInterval = 0;
    if (duration <= 30) {
        surfaceInterval = 1;
    } else if (duration <= 60) {
        surfaceInterval = 3;
    } else {
        surfaceInterval = 5;
    }

    // Longer surface interval for deeper dives
    if (depth > 18) {
        surfaceInterval += 1;
    }
    if (depth > 24) {
        surfaceInterval += 1;
    }

    surfaceIntervalEl.textContent = surfaceInterval + ' hrs';

    // Safety stop recommendation
    let safetyStop = '3 min at 5m';
    if (depth > 30) {
        safetyStop = '5 min at 5m';
    } else if (depth > 18) {
        safetyStop = '3-5 min at 5m';
    }
    safetyStopEl.textContent = safetyStop;

    // Update dive profile chart
    updateDiveProfileChart(depth, duration);
}

// Simplified air NDL calculation for EAD
function calculateAirNDL(depth) {
    if (depth <= 12) return 200;
    if (depth <= 18) return 60;
    if (depth <= 21) return 45;
    if (depth <= 24) return 35;
    if (depth <= 27) return 25;
    if (depth <= 30) return 20;
    if (depth <= 33) return 15;
    if (depth <= 36) return 10;
    return 5;
}

// Initialize dive profile chart
function initDiveProfileChart() {
    const ctx = document.getElementById('diveProfileChart').getContext('2d');
    diveProfileChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Start', 'Descent', 'Bottom', 'Ascent', 'Safety Stop', 'Surface'],
            datasets: [{
                label: 'Depth (m)',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#006994',
                backgroundColor: 'rgba(0, 105, 148, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return 'Depth: ' + context.parsed.y + 'm';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    reverse: true,
                    title: {
                        display: true,
                        text: 'Depth (m)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Dive Phase'
                    }
                }
            }
        }
    });
}

// Update dive profile chart
function updateDiveProfileChart(depth, duration) {
    if (!diveProfileChart) return;

    // Calculate time distribution (simplified)
    const descentTime = Math.min(5, duration * 0.1); // 10% of dive time or max 5 min
    const ascentTime = Math.min(5, duration * 0.1); // 10% of dive time or max 5 min
    const bottomTime = duration - descentTime - ascentTime;

    // Update chart data
    diveProfileChart.data.datasets[0].data = [
        0, // Start
        depth, // Descent
        depth, // Bottom
        5, // Ascent to safety stop
        5, // Safety stop
        0 // Surface
    ];

    // Update labels based on times
    diveProfileChart.data.labels = [
        'Start (0 min)',
        `Descent (${descentTime.toFixed(0)} min)`,
        `Bottom (${bottomTime.toFixed(0)} min)`,
        `Ascent (${ascentTime.toFixed(0)} min)`,
        'Safety Stop',
        'Surface'
    ];

    diveProfileChart.update();
}

// Clear dive plan form
function clearPlan() {
    diveSiteInput.value = '';
    maxDepthInput.value = '';
    diveDurationInput.value = '';
    waterTempInput.value = '';
    gasMixSelect.value = 'air';
    customGasContainer.classList.add('hidden');
    customO2Input.value = '';
    diveObjectivesInput.value = '';
    diveNotesInput.value = '';

    // Reset safety calculations
    noDecoTimeEl.textContent = '-- min';
    surfaceIntervalEl.textContent = '-- hrs';
    modDepthEl.textContent = '-- m';
    safetyStopEl.textContent = '3 min at 5m';

    // Reset map marker
    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }

    // Reset current plan ID
    currentPlanId = null;

    // Reset dive profile chart
    if (diveProfileChart) {
        diveProfileChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0];
        diveProfileChart.update();
    }
}

// Save dive plan
function savePlan() {
    // Validate required fields
    if (!diveSiteInput.value || !maxDepthInput.value || !diveDurationInput.value) {
        alert('Please fill in all required fields (Dive Site, Max Depth, Duration)');
        return;
    }

    // Get O2 percentage based on gas mix
    let o2Percentage = 21; // Default to air
    if (gasMixSelect.value === 'nitrox32') {
        o2Percentage = 32;
    } else if (gasMixSelect.value === 'nitrox36') {
        o2Percentage = 36;
    } else if (gasMixSelect.value === 'custom') {
        o2Percentage = parseFloat(customO2Input.value) || 21;
    }

    // Get marker location if exists
    let location = null;
    if (marker) {
        location = {
            lat: marker.getLatLng().lat,
            lng: marker.getLatLng().lng
        };
    }

    // Create plan object
    const plan = {
        id: currentPlanId || Date.now().toString(),
        site: diveSiteInput.value,
        date: diveDateInput.value,
        maxDepth: parseFloat(maxDepthInput.value),
        duration: parseFloat(diveDurationInput.value),
        waterTemp: parseFloat(waterTempInput.value) || null,
        gasMix: gasMixSelect.value,
        o2Percentage: o2Percentage,
        objectives: diveObjectivesInput.value,
        notes: diveNotesInput.value,
        location: location,
        noDecoTime: noDecoTimeEl.textContent,
        surfaceInterval: surfaceIntervalEl.textContent,
        modDepth: modDepthEl.textContent,
        safetyStop: safetyStopEl.textContent,
        createdAt: new Date().toISOString()
    };

    // Update or add plan
    if (currentPlanId) {
        // Update existing plan
        const index = divePlans.findIndex(p => p.id === currentPlanId);
        if (index !== -1) {
            divePlans[index] = plan;
        }
    } else {
        // Add new plan
        divePlans.push(plan);
    }

    // Save to localStorage
    localStorage.setItem('divePlans', JSON.stringify(divePlans));

    // Reload saved plans
    loadSavedPlans();

    // Clear form
    clearPlan();

    // Show success message
    alert('Dive plan saved successfully!');
}

// Load saved plans from localStorage
function loadSavedPlans() {
    const savedPlans = localStorage.getItem('divePlans');
    if (savedPlans) {
        divePlans = JSON.parse(savedPlans);
    } else {
        divePlans = [];
    }

    // Sort plans by date (newest first)
    divePlans.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render plans
    renderSavedPlans();
}

// Render saved plans
function renderSavedPlans() {
    savedPlansContainer.innerHTML = '';

    if (divePlans.length === 0) {
        noPlansMessage.classList.remove('hidden');
        return;
    }

    noPlansMessage.classList.add('hidden');

    divePlans.forEach(plan => {
        const planEl = document.createElement('div');
        planEl.className = 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer';
        planEl.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-bold text-blue-800">${plan.site}</h4>
                    <div class="text-sm text-gray-500">${formatDate(plan.date)}</div>
                </div>
                <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${plan.maxDepth}m / ${plan.duration}min</span>
            </div>
            <div class="mt-2 text-sm">
                <span class="text-gray-600">Gas:</span> ${getGasMixLabel(plan.gasMix, plan.o2Percentage)}
            </div>
        `;

        planEl.addEventListener('click', () => showPlanDetails(plan.id));
        savedPlansContainer.appendChild(planEl);
    });
}

// Show plan details in modal
function showPlanDetails(planId) {
    const plan = divePlans.find(p => p.id === planId);
    if (!plan) return;

    // Set modal content
    document.getElementById('detailSite').textContent = plan.site;
    document.getElementById('detailDate').textContent = formatDate(plan.date);
    document.getElementById('detailDepth').textContent = plan.maxDepth + ' m';
    document.getElementById('detailDuration').textContent = plan.duration + ' min';
    document.getElementById('detailGas').textContent = getGasMixLabel(plan.gasMix, plan.o2Percentage);
    document.getElementById('detailNoDeco').textContent = plan.noDecoTime;
    document.getElementById('detailSurface').textContent = plan.surfaceInterval;
    document.getElementById('detailMod').textContent = plan.modDepth;
    document.getElementById('detailSafety').textContent = plan.safetyStop;
    document.getElementById('detailObjectives').textContent = plan.objectives || '--';
    document.getElementById('detailNotes').textContent = plan.notes || '--';

    // Set plan ID on buttons
    document.getElementById('loadPlanBtn').dataset.planId = plan.id;
    document.getElementById('deletePlanBtn').dataset.planId = plan.id;

    // Show modal
    planDetailsModal.classList.remove('hidden');

    // Add event listeners to modal buttons
    document.getElementById('loadPlanBtn').addEventListener('click', loadPlan);
    document.getElementById('deletePlanBtn').addEventListener('click', deletePlan);
}

// Load plan into form
function loadPlan() {
    const planId = this.dataset.planId;
    const plan = divePlans.find(p => p.id === planId);
    if (!plan) return;

    // Set form values
    diveSiteInput.value = plan.site;
    diveDateInput.value = plan.date;
    maxDepthInput.value = plan.maxDepth;
    diveDurationInput.value = plan.duration;
    waterTempInput.value = plan.waterTemp || '';

    // Set gas mix
    if (plan.gasMix === 'custom') {
        gasMixSelect.value = 'custom';
        customGasContainer.classList.remove('hidden');
        customO2Input.value = plan.o2Percentage;
    } else {
        gasMixSelect.value = plan.gasMix;
        customGasContainer.classList.add('hidden');
    }

    diveObjectivesInput.value = plan.objectives || '';
    diveNotesInput.value = plan.notes || '';

    // Set current plan ID
    currentPlanId = plan.id;

    // Set marker if location exists
    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }

    if (plan.location) {
        marker = L.marker([plan.location.lat, plan.location.lng]).addTo(map);
        map.setView([plan.location.lat, plan.location.lng], 12);
    }

    // Calculate safety parameters
    calculateSafety();

    // Close modal
    closeModal('planDetailsModal');
}

// Delete plan
function deletePlan() {
    if (!confirm('Are you sure you want to delete this dive plan?')) return;

    const planId = this.dataset.planId;
    divePlans = divePlans.filter(p => p.id !== planId);

    // Save to localStorage
    localStorage.setItem('divePlans', JSON.stringify(divePlans));

    // Reload saved plans
    loadSavedPlans();

    // Close modal
    closeModal('planDetailsModal');

    // If we deleted the currently loaded plan, clear the form
    if (currentPlanId === planId) {
        clearPlan();
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Get gas mix label
function getGasMixLabel(gasMix, o2Percentage) {
    if (gasMix === 'air') return 'Air (21% O2)';
    if (gasMix === 'nitrox32') return 'Nitrox 32';
    if (gasMix === 'nitrox36') return 'Nitrox 36';
    if (gasMix === 'custom') return `Custom (${o2Percentage}% O2)`;
    return gasMix;
}

// Nitrox calculator
function calculateNitrox() {
    const o2Percentage = parseFloat(document.getElementById('nitroxO2').value) || 21;

    // Calculate MOD (Maximum Operating Depth)
    // MOD = ( (PpO2 / FO2) - 1 ) * 10
    // Where PpO2 is the maximum partial pressure of O2 (typically 1.4 for recreational diving)
    const mod = ((1.4 / (o2Percentage / 100)) - 1) * 10;
    document.getElementById('modResult').value = mod.toFixed(1);

    // Calculate EAD (Equivalent Air Depth)
    // EAD = ( (1 - FO2) / 0.79 ) * (D + 10) - 10
    const depth = parseFloat(document.getElementById('targetDepth').value) || 0;
    if (depth > 0) {
        const ead = ((1 - (o2Percentage / 100)) / 0.79) * (depth + 10) - 10;
        document.getElementById('eadResult').value = ead.toFixed(1);
    }
}

// Calculate best mix for target depth
function calculateBestMix() {
    const targetDepth = parseFloat(document.getElementById('targetDepth').value) || 0;
    if (targetDepth <= 0) {
        alert('Please enter a valid target depth');
        return;
    }

    // Calculate required O2 percentage to stay within MOD at target depth
    // FO2 = PpO2 / (D/10 + 1)
    // Where PpO2 is the maximum partial pressure of O2 (typically 1.4 for recreational diving)
    const maxO2 = (1.4 / (targetDepth / 10 + 1)) * 100;

    if (maxO2 < 21) {
        document.getElementById('bestMixResult').innerHTML = `
            <span class="text-red-600">Target depth ${targetDepth}m exceeds MOD for air (21% O2). Consider using trimix.</span>
        `;
        return;
    }

    // Find standard Nitrox mix that's safe at this depth
    let recommendedMix = 'Air (21% O2)';
    if (maxO2 >= 32) {
        recommendedMix = 'Nitrox 32';
    } else if (maxO2 >= 28) {
        recommendedMix = 'Custom mix (~28% O2)';
    } else {
        recommendedMix = `Custom mix (~${Math.floor(maxO2)}% O2)`;
    }

    document.getElementById('bestMixResult').innerHTML = `
        <span class="text-green-700">Recommended gas: ${recommendedMix}</span><br>
        <span class="text-sm text-gray-600">Maximum safe O2 percentage at ${targetDepth}m: ${maxO2.toFixed(1)}%</span>
    `;

    // Update MOD calculator with this O2 percentage
    document.getElementById('nitroxO2').value = Math.min(40, Math.floor(maxO2));
    calculateNitrox();
}

// No decompression limit calculator
function calculateNDL() {
    const depth = parseFloat(document.getElementById('ndlDepth').value) || 0;
    const gasMix = document.getElementById('ndlGasMix').value;

    if (depth <= 0) {
        document.getElementById('ndlTime').textContent = '-- minutes';
        return;
    }

    // Get O2 percentage based on gas mix
    let o2Percentage = 21; // Default to air
    if (gasMix === 'nitrox32') {
        o2Percentage = 32;
    } else if (gasMix === 'nitrox36') {
        o2Percentage = 36;
    }

    // Calculate NDL (simplified)
    let ndl = 0;
    if (depth <= 12) {
        ndl = 200; // Very long NDL for shallow dives
    } else if (depth <= 18) {
        ndl = 60;
    } else if (depth <= 21) {
        ndl = 45;
    } else if (depth <= 24) {
        ndl = 35;
    } else if (depth <= 27) {
        ndl = 25;
    } else if (depth <= 30) {
        ndl = 20;
    } else if (depth <= 33) {
        ndl = 15;
    } else if (depth <= 36) {
        ndl = 10;
    } else {
        ndl = 5; // Very short for deep dives
    }

    // Adjust NDL for Nitrox
    if (o2Percentage > 21) {
        // Nitrox extends NDL - simplified calculation
        const airEAD = ((1 - (o2Percentage / 100)) / 0.79) * (depth + 10) - 10;
        const airNdl = calculateAirNDL(airEAD);
        ndl = Math.min(ndl * 1.5, airNdl * 1.5); // Cap the extension
    }

    document.getElementById('ndlTime').textContent = ndl.toFixed(0) + ' minutes';
}

// Safety stop timer setup
function setupSafetyStopTimer() {
    const timerDisplay = document.getElementById('safetyStopTimer');
    const startStopBtn = document.getElementById('startStopBtn');
    const resetStopBtn = document.getElementById('resetStopBtn');
    const addMinuteBtn = document.getElementById('addMinuteBtn');

    let timer;
    let timeLeft = 180; // 3 minutes in seconds
    let isRunning = false;

    // Format time display
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Update timer display
    function updateDisplay() {
        timerDisplay.textContent = formatTime(timeLeft);

        // Change color when time is running low
        if (timeLeft <= 30) {
            timerDisplay.classList.add('text-red-600');
            timerDisplay.classList.remove('text-gray-900');
        } else {
            timerDisplay.classList.remove('text-red-600');
            timerDisplay.classList.add('text-gray-900');
        }
    }

    // Start or stop timer
    startStopBtn.addEventListener('click', function () {
        if (isRunning) {
            // Stop timer
            clearInterval(timer);
            isRunning = false;
            startStopBtn.innerHTML = '<i class="fas fa-play"></i> Start';
            startStopBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
            startStopBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        } else {
            // Start timer
            isRunning = true;
            startStopBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            startStopBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            startStopBtn.classList.add('bg-red-600', 'hover:bg-red-700');

            timer = setInterval(function () {
                timeLeft--;
                updateDisplay();

                if (timeLeft <= 0) {
                    clearInterval(timer);
                    isRunning = false;
                    startStopBtn.innerHTML = '<i class="fas fa-play"></i> Start';
                    startStopBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
                    startStopBtn.classList.add('bg-green-600', 'hover:bg-green-700');

                    // Play alarm sound
                    const alarm = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
                    alarm.play();
                }
            }, 1000);
        }
    });

    // Reset timer
    resetStopBtn.addEventListener('click', function () {
        clearInterval(timer);
        isRunning = false;
        timeLeft = 180;
        updateDisplay();
        startStopBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        startStopBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        startStopBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    });

    // Add minute
    addMinuteBtn.addEventListener('click', function () {
        timeLeft += 60;
        updateDisplay();
    });

    // Initial display
    updateDisplay();
}