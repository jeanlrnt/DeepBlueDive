import { formatDate, getGasMixLabel, toast } from './utils.js';

class LogbookManager {
    constructor() {
        this.entries = [];
        this.currentPage = 1;
        this.entriesPerPage = 10;
        this.filters = {
            dateRange: 'all',
            year: 'all',
            month: 'all',
            site: 'all',
            gasMix: 'all'
        };
    }

    initialize() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.render();
    }

    loadFromStorage() {
        const savedEntries = localStorage.getItem('logbookEntries');
        this.entries = savedEntries ? JSON.parse(savedEntries) : this.createSampleEntries();
        this.save();
    }

    createSampleEntries() {
        return [
            {
                site: "Blue Lagoon",
                date: "2025-04-09",
                depth: 18,
                duration: 45,
                temperature: 24,
                gasMix: "air",
                conditions: "Excellente visibilité, léger courant",
                notes: "Vu plusieurs tortues de mer et un requin récifal",
                timestamp: new Date().getTime()
            },
            {
                site: "Coral Garden",
                date: "2025-04-08",
                depth: 22,
                duration: 50,
                temperature: 23,
                gasMix: "nitrox32",
                conditions: "Visibilité modérée, pas de courant",
                notes: "Magnifiques formations de corail",
                timestamp: new Date().getTime() - 86400000
            }
        ];
    }

    setupEventListeners() {
        // Filtres
        document.getElementById('logbookDateRange').addEventListener('change', e => {
            this.filters.dateRange = e.target.value;
            this.currentPage = 1;
            this.render();
        });

        document.getElementById('logbookYearFilter').addEventListener('change', e => {
            this.filters.year = e.target.value;
            this.currentPage = 1;
            this.render();
        });

        document.getElementById('logbookMonthFilter').addEventListener('change', e => {
            this.filters.month = e.target.value;
            this.currentPage = 1;
            this.render();
        });

        document.getElementById('logbookSiteFilter').addEventListener('change', e => {
            this.filters.site = e.target.value;
            this.currentPage = 1;
            this.render();
        });

        document.getElementById('logbookGasMixFilter').addEventListener('change', e => {
            this.filters.gasMix = e.target.value;
            this.currentPage = 1;
            this.render();
        });

        // Pagination
        document.getElementById('prevPageBtn').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPageBtn').addEventListener('click', () => this.nextPage());
    }

    addEntry(entry) {
        if (!this.validateEntry(entry)) {
            return false;
        }

        this.entries.push({
            ...entry,
            timestamp: new Date().getTime()
        });

        this.save();
        this.render();
        return true;
    }

    validateEntry(entry) {
        if (!entry.site || !entry.date || !entry.depth || !entry.duration) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return false;
        }

        if (entry.depth <= 0 || entry.depth > 40) {
            toast.error('La profondeur doit être comprise entre 0 et 40 mètres');
            return false;
        }

        if (entry.duration <= 0 || entry.duration > 180) {
            toast.error('La durée doit être comprise entre 0 et 180 minutes');
            return false;
        }

        return true;
    }

    editEntry(index, updatedEntry) {
        if (!this.validateEntry(updatedEntry)) {
            return false;
        }

        this.entries[index] = {
            ...this.entries[index],
            ...updatedEntry,
            timestamp: new Date().getTime()
        };

        this.save();
        this.render();
        return true;
    }

    deleteEntry(index) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
            this.entries.splice(index, 1);
            this.save();
            this.render();
        }
    }

    save() {
        localStorage.setItem('logbookEntries', JSON.stringify(this.entries));
    }

    render() {
        const filteredEntries = this.getFilteredEntries();
        const { startIndex, endIndex, paginatedEntries } = this.getPaginatedEntries(filteredEntries);
        
        this.renderEntries(paginatedEntries);
        this.updatePaginationInfo(startIndex, endIndex, filteredEntries.length);
        this.updateFilterDropdowns();
    }

    getFilteredEntries() {
        return this.entries
            .filter(entry => this.applyDateRangeFilter(entry))
            .filter(entry => this.applyYearMonthFilter(entry))
            .filter(entry => this.applySiteFilter(entry))
            .filter(entry => this.applyGasMixFilter(entry))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getPaginatedEntries(filteredEntries) {
        const startIndex = (this.currentPage - 1) * this.entriesPerPage;
        const endIndex = startIndex + this.entriesPerPage;
        const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

        return { startIndex, endIndex, paginatedEntries };
    }

    applyDateRangeFilter(entry) {
        if (this.filters.dateRange === 'all') return true;

        const entryDate = new Date(entry.date);
        const now = new Date();
        
        switch (this.filters.dateRange) {
            case 'today':
                return entryDate.toDateString() === now.toDateString();
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                return entryDate.toDateString() === yesterday.toDateString();
            case 'week':
                return (now - entryDate) <= 7 * 24 * 60 * 60 * 1000;
            case 'month':
                return (now - entryDate) <= 30 * 24 * 60 * 60 * 1000;
            case '3months':
                return (now - entryDate) <= 90 * 24 * 60 * 60 * 1000;
            case '6months':
                return (now - entryDate) <= 180 * 24 * 60 * 60 * 1000;
            case 'year':
                return (now - entryDate) <= 365 * 24 * 60 * 60 * 1000;
            case 'custom':
                const fromDate = document.getElementById('logbookDateFrom').value;
                const toDate = document.getElementById('logbookDateTo').value;
                return (!fromDate || entry.date >= fromDate) && (!toDate || entry.date <= toDate);
            default:
                return true;
        }
    }

    applyYearMonthFilter(entry) {
        const entryDate = new Date(entry.date);
        const yearMatch = this.filters.year === 'all' || 
            entryDate.getFullYear().toString() === this.filters.year;
        const monthMatch = this.filters.month === 'all' || 
            (entryDate.getMonth() + 1).toString() === this.filters.month;
        return yearMatch && monthMatch;
    }

    applySiteFilter(entry) {
        return this.filters.site === 'all' || 
            entry.site.toLowerCase().includes(this.filters.site.toLowerCase());
    }

    applyGasMixFilter(entry) {
        return this.filters.gasMix === 'all' || entry.gasMix === this.filters.gasMix;
    }

    renderEntries(entries) {
        const container = document.getElementById('logbookEntries');
        container.innerHTML = '';

        if (entries.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-book text-4xl mb-2"></i>
                    <p>Aucune plongée trouvée</p>
                    <p class="text-sm mt-2">Utilisez le bouton "New Entry" pour ajouter une plongée</p>
                </div>
            `;
            return;
        }

        entries.forEach((entry, index) => {
            const entryElement = this.createEntryElement(entry, index);
            container.appendChild(entryElement);
        });
    }

    createEntryElement(entry, index) {
        const element = document.createElement('div');
        element.className = 'card mb-4 shadow-sm';
        element.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h4 class="h5 fw-bold text-primary mb-1">${entry.site}</h4>
                        <p class="small text-muted mb-0">${formatDate(entry.date)}</p>
                    </div>
                    <div class="btn-group">
                        <button class="edit-btn btn btn-outline-primary btn-sm">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn btn btn-outline-danger btn-sm">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="row g-4 mt-3">
                    <div class="col-md-3 col-6">
                        <span class="small text-muted d-block">Profondeur Max</span>
                        <p class="fw-semibold mb-0">${entry.depth} m</p>
                    </div>
                    <div class="col-md-3 col-6">
                        <span class="small text-muted d-block">Durée</span>
                        <p class="fw-semibold mb-0">${entry.duration} min</p>
                    </div>
                    <div class="col-md-3 col-6">
                        <span class="small text-muted d-block">Température</span>
                        <p class="fw-semibold mb-0">${entry.temperature ? entry.temperature + '°C' : '--'}</p>
                    </div>
                    <div class="col-md-3 col-6">
                        <span class="small text-muted d-block">Mélange gazeux</span>
                        <p class="fw-semibold mb-0">${getGasMixLabel(entry.gasMix)}</p>
                    </div>
                </div>
                
                ${entry.conditions ? `
                    <div class="mt-3">
                        <span class="small text-muted d-block">Conditions</span>
                        <p class="text-body mb-0">${entry.conditions}</p>
                    </div>
                ` : ''}
                
                ${entry.notes ? `
                    <div class="mt-3">
                        <span class="small text-muted d-block">Notes</span>
                        <p class="text-body mb-0">${entry.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        element.querySelector('.edit-btn').addEventListener('click', () => this.showEditModal(entry, index));
        element.querySelector('.delete-btn').addEventListener('click', () => this.deleteEntry(index));

        return element;
    }

    updatePaginationInfo(startIndex, endIndex, totalEntries) {
        document.getElementById('entriesShown').textContent = 
            `${startIndex + 1}-${Math.min(endIndex, totalEntries)}`;
        document.getElementById('totalEntries').textContent = totalEntries;

        document.getElementById('prevPageBtn').disabled = this.currentPage === 1;
        document.getElementById('nextPageBtn').disabled = endIndex >= totalEntries;
    }

    updateFilterDropdowns() {
        // Mettre à jour la liste des sites
        const siteSelect = document.getElementById('logbookSiteFilter');
        const uniqueSites = [...new Set(this.entries.map(entry => entry.site))];
        this.updateDropdownOptions(siteSelect, uniqueSites);

        // Mettre à jour la liste des années
        const yearSelect = document.getElementById('logbookYearFilter');
        const uniqueYears = [...new Set(this.entries.map(entry => 
            new Date(entry.date).getFullYear()
        ))].sort((a, b) => b - a);
        this.updateDropdownOptions(yearSelect, uniqueYears);
    }

    updateDropdownOptions(select, values) {
        const currentValue = select.value;
        
        // Garder seulement l'option "All"
        select.innerHTML = '<option value="all">All</option>';
        
        // Ajouter les nouvelles options
        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });

        // Restaurer la valeur sélectionnée si elle existe toujours
        if (values.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render();
        }
    }

    nextPage() {
        const filteredEntries = this.getFilteredEntries();
        const totalPages = Math.ceil(filteredEntries.length / this.entriesPerPage);
        
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.render();
        }
    }

    showEditModal(entry, index) {
        // Implementation of edit modal display
    }

    resetFilters() {
        this.filters = {
            dateRange: 'all',
            year: 'all',
            month: 'all',
            site: 'all',
            gasMix: 'all'
        };
        this.currentPage = 1;
        this.render();
    }
}

// Export a singleton instance
const logbook = new LogbookManager();
export default logbook;