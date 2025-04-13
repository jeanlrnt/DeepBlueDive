// Imports des modules
import divePlanner from './js/modules/dive-planner.js';
import logbook from './js/modules/logbook.js';
import safetyTimer from './js/modules/safety-timer.js';
import { ChecklistManager } from './js/modules/checklist.js';
import * as Utils from './js/modules/utils.js';

let checklistManager;
let modalInstances = {};

// Initialize all components when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
    setupTabNavigation();
    setupLogbookFilters();
    setupDivePlannerListeners();
    setupModals();
});

function initializeApplication() {
    // Initialize each module
    divePlanner.initialize();
    logbook.initialize();
    safetyTimer.initialize();
    checklistManager = new ChecklistManager();
}

function setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-link[data-tab]');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            event.preventDefault();
            const tabName = tab.getAttribute('data-tab');
            openTab(event.currentTarget, tabName);
        });
    });

    // Open default tab
    const defaultTab = document.querySelector('.nav-link[data-tab="checklist"]');
    if (defaultTab) {
        openTab(defaultTab, 'checklist');
    }
}

// Handle tab switching
function openTab(buttonElement, tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('show', 'active');
    });

    // Reset all tab buttons
    document.querySelectorAll('.nav-link').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('show', 'active');
    }

    // Highlight selected tab button
    buttonElement.classList.add('active');
}

// Make closeModal function globally available
window.closeModal = function(modalId) {
    if (modalInstances[modalId]) {
        modalInstances[modalId].hide();
    }
}

// Make showModal function globally available
window.showModal = function(modalId) {
    if (modalInstances[modalId]) {
        modalInstances[modalId].show();
    }
}

function setupLogbookFilters() {
    const logbookDateRange = document.getElementById('logbookDateRange');
    const customDateRange = document.getElementById('customDateRange');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');

    logbookDateRange.addEventListener('change', () => {
        customDateRange.style.display = logbookDateRange.value === 'custom' ? 'grid' : 'none';
    });

    resetFiltersBtn.addEventListener('click', resetFilters);
    applyFiltersBtn.addEventListener('click', logbook.applyFilters);

    document.getElementById('prevPageBtn').addEventListener('click', logbook.goToPrevPage);
    document.getElementById('nextPageBtn').addEventListener('click', logbook.goToNextPage);
}

function setupDivePlannerListeners() {
    const gasMixSelect = document.getElementById('gasMix');
    const customGasContainer = document.getElementById('customGasContainer');
    const maxDepthInput = document.getElementById('maxDepth');
    const customO2Input = document.getElementById('customO2');

    gasMixSelect.addEventListener('change', () => {
        customGasContainer.style.display = gasMixSelect.value === 'custom' ? 'block' : 'none';
        updateSafetyCalculations();
    });

    [maxDepthInput, customO2Input].forEach(input => {
        input.addEventListener('input', updateSafetyCalculations);
    });

    document.getElementById('savePlanBtn').addEventListener('click', () => {
        const planData = collectPlanData();
        if (divePlanner.savePlan(planData)) {
            Utils.closeModal('planDetailsModal');
        }
    });

    document.getElementById('deletePlanBtn').addEventListener('click', (event) => {
        const planId = event.currentTarget.dataset.planId;
        if (divePlanner.deletePlan(planId)) {
            Utils.closeModal('planDetailsModal');
        }
    });
}

function setupModals() {
    // Initialize Bootstrap modals
    document.querySelectorAll('.modal.fade').forEach(modalElement => {
        const modalId = modalElement.id;
        modalInstances[modalId] = new bootstrap.Modal(modalElement);
    });

    // Setup modal event listeners
    document.getElementById('newLogEntryBtn')?.addEventListener('click', () => {
        const dateInput = document.getElementById('logEntryDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        modalInstances['newLogEntryModal'].show();
    });

    document.getElementById('saveLogEntryBtn')?.addEventListener('click', () => {
        const entry = collectLogEntryData();
        if (logbook.addEntry(entry)) {
            modalInstances['newLogEntryModal'].hide();
        }
    });

    // Gestion des événements de la modale de détails du plan
    document.getElementById('loadPlanBtn')?.addEventListener('click', (event) => {
        const planId = event.currentTarget.dataset.planId;
        if (planId) {
            divePlanner.loadPlan(planId);
            modalInstances['planDetailsModal'].hide();
        }
    });

    document.getElementById('deletePlanBtn')?.addEventListener('click', (event) => {
        const planId = event.currentTarget.dataset.planId;
        if (planId && confirm('Êtes-vous sûr de vouloir supprimer ce plan de plongée ?')) {
            if (divePlanner.deletePlan(planId)) {
                modalInstances['planDetailsModal'].hide();
            }
        }
    });
}

function collectPlanData() {
    return {
        site: document.getElementById('diveSite').value,
        date: document.getElementById('diveDate').value,
        maxDepth: parseFloat(document.getElementById('maxDepth').value),
        duration: parseFloat(document.getElementById('diveDuration').value),
        waterTemp: parseFloat(document.getElementById('waterTemp').value) || null,
        gasMix: document.getElementById('gasMix').value,
        o2Percentage: document.getElementById('gasMix').value === 'custom' ? 
            parseFloat(document.getElementById('customO2').value) : null,
        objectives: document.getElementById('diveObjectives').value,
        notes: document.getElementById('diveNotes').value
    };
}

function collectLogEntryData() {
    return {
        site: document.getElementById('logEntrySite').value,
        date: document.getElementById('logEntryDate').value,
        depth: parseFloat(document.getElementById('logEntryDepth').value),
        duration: parseFloat(document.getElementById('logEntryDuration').value),
        temperature: parseFloat(document.getElementById('logEntryTemp').value) || null,
        gasMix: document.getElementById('logEntryGasMix').value,
        conditions: document.getElementById('logEntryConditions').value,
        notes: document.getElementById('logEntryNotes').value
    };
}

function updateSafetyCalculations() {
    const depth = parseFloat(document.getElementById('maxDepth').value) || 0;
    const gasMix = document.getElementById('gasMix').value;
    const o2Percentage = gasMix === 'custom' ? 
        (parseFloat(document.getElementById('customO2').value) || 21) :
        gasMix === 'nitrox32' ? 32 : 
        gasMix === 'nitrox36' ? 36 : 21;

    const mod = divePlanner.calculateMOD(o2Percentage);
    const ndl = divePlanner.calculateNDL(depth, gasMix);

    document.getElementById('modResult').textContent = mod.toFixed(1) + ' m';
    document.getElementById('ndlResult').textContent = ndl + ' min';
}

function resetFilters() {
    document.getElementById('logbookDateRange').value = 'all';
    document.getElementById('logbookYearFilter').value = 'all';
    document.getElementById('logbookMonthFilter').value = 'all';
    document.getElementById('logbookSiteFilter').value = 'all';
    document.getElementById('logbookGasMixFilter').value = 'all';
    document.getElementById('customDateRange').style.display = 'none';
    logbook.applyFilters();
}