import { formatDate, getGasMixLabel, toast } from './utils.js';

class DivePlannerManager {
    constructor() {
        this.plans = [];
        this.currentPlanId = null;
        this.diveProfileChart = null;
        this.map = null;
        this.marker = null;
    }

    initialize() {
        this.loadSavedPlans();
        this.initializeMap();
        this.initializeDiveProfileChart();
        this.setupEventListeners();
    }

    loadSavedPlans() {
        const savedPlans = localStorage.getItem('divePlans');
        if (savedPlans) {
            this.plans = JSON.parse(savedPlans);
            this.renderSavedPlans();
        }
    }

    initializeMap() {
        this.map = L.map('diveMap').setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.map.on('click', (e) => {
            if (this.marker) {
                this.map.removeLayer(this.marker);
            }
            this.marker = L.marker(e.latlng).addTo(this.map);
            
            // Sauvegarder les coordonnées dans des champs cachés
            document.getElementById('diveLat').value = e.latlng.lat;
            document.getElementById('diveLng').value = e.latlng.lng;
            
            // Faire une recherche inverse pour trouver le nom du lieu
            this.reverseGeocode(e.latlng.lat, e.latlng.lng);
        });
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data.display_name) {
                const siteName = document.getElementById('diveSite');
                if (!siteName.value) {
                    siteName.value = data.display_name.split(',')[0];
                }
            }
        } catch (error) {
            console.error('Erreur de géocodage inverse:', error);
        }
    }

    initializeDiveProfileChart() {
        const ctx = document.getElementById('diveProfileChart').getContext('2d');
        
        // Configuration de base du graphique
        const chartConfig = {
            type: 'line',
            data: {
                labels: ['Départ', 'Descente', 'Fond', 'Remontée', 'Palier', 'Surface'],
                datasets: [{
                    label: 'Profondeur (m)',
                    data: [0, 0, 0, 0, 0, 0],
                    borderColor: '#006994',
                    backgroundColor: 'rgba(0, 105, 148, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Limite sans décompression',
                    data: [0, 0, 0, 0, 0, 0],
                    borderColor: '#dc3545',
                    borderDash: [5, 5],
                    borderWidth: 1,
                    fill: false,
                    tension: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            usePointStyle: true,
                            boxWidth: 6
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                if (context.dataset.label === 'Profondeur (m)') {
                                    return `Profondeur: ${context.parsed.y}m`;
                                }
                                return `Limite NDL: ${context.parsed.y}m`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            palier: {
                                type: 'box',
                                xMin: 4,
                                xMax: 5,
                                yMin: 3,
                                yMax: 6,
                                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                                borderColor: 'rgba(255, 193, 7, 0.8)',
                                borderWidth: 1,
                                label: {
                                    content: 'Palier sécurité',
                                    display: true
                                }
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
                            text: 'Profondeur (m)'
                        },
                        grid: {
                            color: '#e9ecef'
                        },
                        ticks: {
                            color: '#666666'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Phase de plongée',
                            color: '#666666'
                        },
                        grid: {
                            color: '#e9ecef'
                        },
                        ticks: {
                            color: '#666666'
                        }
                    }
                }
            }
        };

        this.diveProfileChart = new Chart(ctx, chartConfig);
    }

    setupEventListeners() {
        // Gestion du bouton New Dive Plan
        document.getElementById('newDivePlanBtn')?.addEventListener('click', () => {
            this.resetForm();
            this.currentPlanId = null;
            this.showStep(1);
        });

        // Gestion des étapes
        document.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const currentStep = this.getCurrentStep();
                if (this.validateStep(currentStep)) {
                    this.nextStep();
                }
            });
        });
        
        document.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', () => this.prevStep());
        });

        // Validation en temps réel des champs
        const inputs = {
            step1: ['diveSite', 'diveDate'],
            step2: ['maxDepth', 'diveDuration', 'waterTemp'],
            step3: ['gasMix', 'customO2'],
            step4: ['diveObjectives']
        };

        Object.entries(inputs).forEach(([step, fields]) => {
            const stepNumber = parseInt(step.replace('step', ''));
            fields.forEach(fieldId => {
                document.getElementById(fieldId)?.addEventListener('input', () => {
                    this.validateStep(stepNumber);
                    if (['maxDepth', 'diveDuration'].includes(fieldId)) {
                        this.updateDiveProfile();
                    }
                    if (['maxDepth', 'gasMix', 'customO2'].includes(fieldId)) {
                        this.updateSafetyCalculations();
                    }
                });
            });
        });

        // Gestion du mélange gazeux personnalisé
        const gasMixSelect = document.getElementById('gasMix');
        gasMixSelect?.addEventListener('change', () => {
            const customGasContainer = document.getElementById('customGasContainer');
            if (customGasContainer) {
                customGasContainer.style.display = gasMixSelect.value === 'custom' ? 'block' : 'none';
            }
            this.updateSafetyCalculations();
        });

        // Gestion du bouton Clear
        document.getElementById('clearPlanBtn')?.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir effacer ce plan de plongée ?')) {
                this.resetForm();
                this.currentPlanId = null;
            }
        });

        // Gestion du bouton Save Plan
        document.getElementById('savePlanBtn')?.addEventListener('click', () => {
            if (this.savePlan()) {
                toast.success('Plan de plongée sauvegardé avec succès');
                this.showStep(1);
            }
        });
    }

    showStep(stepNumber) {
        // Cacher toutes les étapes
        document.querySelectorAll('.step-content').forEach(step => {
            step.classList.add('d-none');
            step.classList.remove('active');
        });

        // Afficher l'étape actuelle
        const currentStep = document.getElementById(this.getStepId(stepNumber));
        if (currentStep) {
            currentStep.classList.remove('d-none');
            currentStep.classList.add('active');
        }

        // Mettre à jour l'indicateur de progression
        this.updateProgress(stepNumber);

        // Mettre à jour les titres d'étapes
        for (let i = 1; i <= 4; i++) {
            const stepTitle = document.getElementById(`step${i}`);
            if (stepTitle) {
                stepTitle.classList.toggle('text-primary', i === stepNumber);
                stepTitle.classList.toggle('fw-bold', i === stepNumber);
            }
        }
    }

    getStepId(stepNumber) {
        const steps = {
            1: 'siteStep',
            2: 'paramsStep',
            3: 'gasStep',
            4: 'objectivesStep'
        };
        return steps[stepNumber];
    }

    updateProgress(stepNumber) {
        const progress = document.getElementById('planProgress');
        if (progress) {
            progress.style.width = `${(stepNumber - 1) * 33.33}%`;
        }
    }

    validateStep(stepNumber) {
        let isValid = true;
        const errors = {};

        switch (stepNumber) {
            case 1:
                const site = document.getElementById('diveSite')?.value || '';
                const date = document.getElementById('diveDate')?.value || '';
                
                if (!site.trim()) {
                    errors.site = 'Le site de plongée est requis';
                    isValid = false;
                }
                if (!date) {
                    errors.date = 'La date est requise';
                    isValid = false;
                }
                break;

            case 2:
                const depth = parseFloat(document.getElementById('maxDepth')?.value);
                const duration = parseFloat(document.getElementById('diveDuration')?.value);
                
                if (isNaN(depth) || depth < 1 || depth > 40) {
                    errors.depth = 'Profondeur invalide (1-40m)';
                    isValid = false;
                }
                if (isNaN(duration) || duration < 5 || duration > 180) {
                    errors.duration = 'Durée invalide (5-180min)';
                    isValid = false;
                }

                // Vérifier la MOD
                const gasMix = document.getElementById('gasMix')?.value;
                const o2Percentage = this.getO2Percentage(gasMix);
                const mod = this.calculateMOD(o2Percentage);
                if (depth > mod) {
                    errors.depth = `La profondeur dépasse la MOD (${mod.toFixed(1)}m)`;
                    isValid = false;
                }
                break;

            case 3:
                const selectedGasMix = document.getElementById('gasMix')?.value;
                if (selectedGasMix === 'custom') {
                    const o2 = parseFloat(document.getElementById('customO2')?.value);
                    if (isNaN(o2) || o2 < 21 || o2 > 100) {
                        errors.o2 = 'Pourcentage O2 invalide (21-100%)';
                        isValid = false;
                    }
                }
                break;

            case 4:
                // Pas de validation requise pour l'étape 4
                break;
        }

        // Afficher les erreurs
        this.displayErrors(errors);

        // Activer/désactiver le bouton suivant
        const stepContent = document.getElementById(this.getStepId(stepNumber));
        const nextBtn = stepContent?.querySelector('.next-step');
        if (nextBtn) {
            nextBtn.disabled = !isValid;
        }

        return isValid;
    }

    displayErrors(errors) {
        // Effacer tous les messages d'erreur existants
        document.querySelectorAll('.form-text.text-danger').forEach(el => {
            el.textContent = '';
        });

        // Afficher les nouvelles erreurs
        Object.entries(errors).forEach(([field, message]) => {
            const feedback = document.getElementById(`${field}Feedback`);
            if (feedback) {
                feedback.textContent = message;
            }
        });
    }

    nextStep() {
        const currentStep = this.getCurrentStep();
        if (currentStep < 4 && this.validateStep(currentStep)) {
            this.showStep(currentStep + 1);
        }
    }

    prevStep() {
        const currentStep = this.getCurrentStep();
        if (currentStep > 1) {
            this.showStep(currentStep - 1);
        }
    }

    getCurrentStep() {
        let currentStep = 1;
        document.querySelectorAll('.step-content').forEach((step, index) => {
            if (step.classList.contains('active')) {
                currentStep = index + 1;
            }
        });
        return currentStep;
    }

    resetForm() {
        // Réinitialiser tous les champs du formulaire
        const fields = {
            'diveSite': '',
            'diveDate': '',
            'maxDepth': '',
            'diveDuration': '',
            'waterTemp': '',
            'gasMix': 'air',
            'customO2': '',
            'diveObjectives': '',
            'diveNotes': '',
            'diveLat': '',
            'diveLng': ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });

        // Masquer le conteneur de gaz personnalisé
        const customGasContainer = document.getElementById('customGasContainer');
        if (customGasContainer) {
            customGasContainer.style.display = 'none';
        }

        // Réinitialiser les messages d'erreur
        document.querySelectorAll('.form-text.text-danger').forEach(el => {
            el.textContent = '';
        });

        // Réinitialiser la carte
        if (this.marker) {
            this.map.removeLayer(this.marker);
            this.map.setView([20, 0], 2);
        }

        // Réinitialiser les calculs de sécurité
        const safetyElements = {
            'ndlTime': '-- min',
            'surfaceInterval': '-- hrs',
            'modDepth': '-- m',
            'detailSafety': '3 min at 5m'
        };

        Object.entries(safetyElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Réinitialiser le graphique de profil
        if (this.diveProfileChart) {
            this.diveProfileChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0];
            this.diveProfileChart.data.datasets[1].data = [0, 0, 0, 0, 0, 0];
            this.diveProfileChart.data.labels = ['Départ', 'Descente', 'Fond', 'Remontée', 'Palier', 'Surface'];
            this.diveProfileChart.update();
        }

        // Retourner à la première étape
        this.showStep(1);
    }

    updateDiveProfile() {
        const depth = parseFloat(document.getElementById('maxDepth').value) || 0;
        const duration = parseFloat(document.getElementById('diveDuration').value) || 0;
        const gasMix = document.getElementById('gasMix').value;
        
        const descentTime = Math.min(depth / 20, 3); // 20m/min max
        const bottomTime = duration - descentTime - 3; // 3 min pour la remontée
        const ascentTime = Math.min(depth / 10, 6); // 10m/min max
        const ndl = this.calculateNDL(depth, gasMix);

        if (this.diveProfileChart) {
            // Profil de plongée
            this.diveProfileChart.data.datasets[0].data = [
                0,              // Surface
                depth,          // Descente
                depth,          // Fond
                5,             // Début de la remontée
                5,             // Palier de sécurité
                0              // Surface
            ];

            // Ligne de limite sans décompression
            const ndlDepth = depth > ndl ? depth : ndl;
            this.diveProfileChart.data.datasets[1].data = [
                ndlDepth,      // Surface
                ndlDepth,      // Descente
                ndlDepth,      // Fond
                ndlDepth,      // Début de la remontée
                ndlDepth,      // Palier de sécurité
                ndlDepth       // Surface
            ];

            this.diveProfileChart.data.labels = [
                'Départ (0 min)',
                `Descente (${descentTime.toFixed(1)} min)`,
                `Fond (${bottomTime.toFixed(1)} min)`,
                `Remontée (${ascentTime.toFixed(1)} min)`,
                'Palier (3 min)',
                'Surface'
            ];

            // Mise à jour des annotations pour le palier de sécurité
            const palierAnnotation = this.diveProfileChart.options.plugins.annotation.annotations.palier;
            palierAnnotation.yMin = 3;
            palierAnnotation.yMax = 6;

            this.diveProfileChart.update();
        }
    }

    updateSafetyCalculations() {
        const depth = parseFloat(document.getElementById('maxDepth').value) || 0;
        const gasMix = document.getElementById('gasMix').value;
        const o2Percentage = this.getO2Percentage(gasMix);

        const mod = this.calculateMOD(o2Percentage);
        const ndl = this.calculateNDL(depth, gasMix);

        document.getElementById('modDepth').textContent = mod.toFixed(1) + ' m';
        document.getElementById('ndlTime').textContent = ndl + ' min';
        document.getElementById('surfaceInterval').textContent = this.calculateSurfaceInterval(depth, ndl) + ' hrs';
    }

    getO2Percentage(gasMix) {
        switch(gasMix) {
            case 'air': return 21;
            case 'nitrox32': return 32;
            case 'nitrox36': return 36;
            case 'custom':
                return parseFloat(document.getElementById('customO2').value) || 21;
            default: return 21;
        }
    }

    calculateMOD(o2Percentage) {
        const maxPPO2 = 1.4; // Pression partielle maximale d'oxygène recommandée
        return ((maxPPO2 / (o2Percentage / 100)) - 1) * 10;
    }

    calculateNDL(depth, gasMix) {
        // Table simplifiée des limites sans décompression
        let baseNDL;
        if (depth <= 12) baseNDL = 200;
        else if (depth <= 15) baseNDL = 100;
        else if (depth <= 18) baseNDL = 60;
        else if (depth <= 21) baseNDL = 50;
        else if (depth <= 24) baseNDL = 40;
        else if (depth <= 27) baseNDL = 30;
        else if (depth <= 30) baseNDL = 25;
        else if (depth <= 33) baseNDL = 20;
        else if (depth <= 36) baseNDL = 15;
        else if (depth <= 39) baseNDL = 10;
        else baseNDL = 5;

        // Facteur multiplicateur pour Nitrox
        let multiplier = 1.0;
        switch(gasMix) {
            case 'nitrox32': multiplier = 1.2; break;
            case 'nitrox36': multiplier = 1.4; break;
            case 'custom':
                const o2 = this.getO2Percentage(gasMix);
                multiplier = 1 + ((o2 - 21) * 0.01);
                break;
        }

        return Math.round(baseNDL * multiplier);
    }

    calculateSurfaceInterval(depth, ndl) {
        // Calcul simplifié de l'intervalle de surface recommandé
        if (depth <= 18) return '2';
        if (depth <= 30) return '3';
        return '4';
    }

    savePlan() {
        const planData = {
            site: document.getElementById('diveSite').value,
            date: document.getElementById('diveDate').value,
            maxDepth: parseFloat(document.getElementById('maxDepth').value),
            duration: parseFloat(document.getElementById('diveDuration').value),
            waterTemp: parseFloat(document.getElementById('waterTemp').value) || null,
            gasMix: document.getElementById('gasMix').value,
            o2Percentage: document.getElementById('gasMix').value === 'custom' ? 
                parseFloat(document.getElementById('customO2').value) : null,
            objectives: document.getElementById('diveObjectives').value,
            notes: document.getElementById('diveNotes').value,
            location: {
                lat: parseFloat(document.getElementById('diveLat').value) || null,
                lng: parseFloat(document.getElementById('diveLng').value) || null
            }
        };

        if (this.validatePlanData(planData)) {
            planData.id = this.currentPlanId || Date.now().toString();
            planData.createdAt = new Date().toISOString();

            const index = this.plans.findIndex(p => p.id === planData.id);
            if (index !== -1) {
                this.plans[index] = planData;
            } else {
                this.plans.push(planData);
            }

            localStorage.setItem('divePlans', JSON.stringify(this.plans));
            this.renderSavedPlans();
            
            toast.success('Plan de plongée sauvegardé avec succès');
            return true;
        }

        return false;
    }

    validatePlanData(planData) {
        const errors = [];
        
        // Validation de l'étape 1
        if (!planData.site) {
            errors.push('Le site de plongée est requis');
        }
        if (!planData.date) {
            errors.push('La date est requise');
        }

        // Validation de l'étape 2
        if (!planData.maxDepth) {
            errors.push('La profondeur maximale est requise');
        } else if (planData.maxDepth > 40) {
            errors.push('La profondeur maximale ne peut pas dépasser 40 mètres');
        }

        if (!planData.duration) {
            errors.push('La durée est requise');
        } else if (planData.duration > 180) {
            errors.push('La durée ne peut pas dépasser 180 minutes');
        }

        // Validation MOD
        const o2Percentage = this.getO2Percentage(planData.gasMix);
        const mod = this.calculateMOD(o2Percentage);
        if (planData.maxDepth > mod) {
            errors.push(`La profondeur dépasse la MOD (${mod.toFixed(1)}m) pour ce mélange gazeux`);
        }

        // Validation NDL
        const ndl = this.calculateNDL(planData.maxDepth, planData.gasMix);
        if (planData.duration > ndl) {
            errors.push(`La durée dépasse la limite sans décompression (${ndl} min) pour cette profondeur`);
        }

        if (errors.length > 0) {
            errors.forEach(error => toast.error(error));
            return false;
        }

        return true;
    }

    deletePlan(planId) {
        const index = this.plans.findIndex(p => p.id === planId);
        if (index === -1) return false;

        if (!confirm('Êtes-vous sûr de vouloir supprimer ce plan de plongée ?')) {
            return false;
        }

        this.plans.splice(index, 1);
        localStorage.setItem('divePlans', JSON.stringify(this.plans));
        
        if (this.currentPlanId === planId) {
            this.currentPlanId = null;
        }
        
        this.renderSavedPlans();
        return true;
    }

    renderSavedPlans() {
        const container = document.getElementById('savedPlansContainer');
        const noPlansMessage = document.getElementById('noPlansMessage');
        
        if (!container || !noPlansMessage) return;
        
        container.innerHTML = '';

        if (this.plans.length === 0) {
            noPlansMessage.classList.remove('hidden');
            return;
        }

        noPlansMessage.classList.add('hidden');

        this.plans
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(plan => {
                const planElement = this.createPlanElement(plan);
                container.appendChild(planElement);
            });
    }

    createPlanElement(plan) {
        const element = document.createElement('div');
        element.className = 'card mb-3 cursor-pointer';
        element.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h4 class="h6 fw-bold text-primary mb-1">${plan.site}</h4>
                        <div class="small text-muted">${formatDate(plan.date)}</div>
                    </div>
                    <span class="badge bg-primary bg-opacity-10 text-primary">
                        ${plan.maxDepth}m / ${plan.duration}min
                    </span>
                </div>
                <div class="mt-2 small">
                    <span class="text-muted">Gaz:</span> 
                    ${getGasMixLabel(plan.gasMix, plan.o2Percentage)}
                </div>
            </div>
        `;

        element.addEventListener('click', () => this.showPlanDetails(plan.id));
        return element;
    }

    showPlanDetails(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;

        const modal = document.getElementById('planDetailsModal');
        if (!modal) return;

        // Remplir les détails du plan
        document.getElementById('detailSite').textContent = plan.site;
        document.getElementById('detailDate').textContent = formatDate(plan.date);
        document.getElementById('detailDepth').textContent = `${plan.maxDepth} m`;
        document.getElementById('detailDuration').textContent = `${plan.duration} min`;
        document.getElementById('detailGas').textContent = getGasMixLabel(plan.gasMix, plan.o2Percentage);
        document.getElementById('detailObjectives').textContent = plan.objectives || '--';
        document.getElementById('detailNotes').textContent = plan.notes || '--';

        // Calculs de sécurité
        const ndl = this.calculateNDL(plan.maxDepth, plan.gasMix);
        const mod = this.calculateMOD(this.getO2Percentage(plan.gasMix));
        document.getElementById('detailNoDeco').textContent = `${ndl} min`;
        document.getElementById('detailMod').textContent = `${mod.toFixed(1)} m`;
        document.getElementById('detailSurface').textContent = 
            `${this.calculateSurfaceInterval(plan.maxDepth, ndl)} hrs`;

        // Afficher la position sur la carte
        if (plan.location?.lat && plan.location?.lng) {
            if (this.marker) {
                this.map.removeLayer(this.marker);
            }
            this.marker = L.marker([plan.location.lat, plan.location.lng]).addTo(this.map);
            this.map.setView([plan.location.lat, plan.location.lng], 13);
        }

        // Setup buttons
        document.getElementById('deletePlanBtn').dataset.planId = plan.id;
        document.getElementById('loadPlanBtn').dataset.planId = plan.id;

        modal.classList.remove('hidden');
    }

    loadPlan(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;

        this.resetForm();

        // Remplir le formulaire avec les données du plan
        document.getElementById('diveSite').value = plan.site;
        document.getElementById('diveDate').value = plan.date;
        document.getElementById('maxDepth').value = plan.maxDepth;
        document.getElementById('diveDuration').value = plan.duration;
        document.getElementById('waterTemp').value = plan.waterTemp || '';
        document.getElementById('gasMix').value = plan.gasMix;
        document.getElementById('diveObjectives').value = plan.objectives || '';
        document.getElementById('diveNotes').value = plan.notes || '';

        // Gérer le mélange gazeux personnalisé
        if (plan.gasMix === 'custom') {
            document.getElementById('customO2').value = plan.o2Percentage;
            document.getElementById('customGasContainer').style.display = 'block';
        }

        // Charger la position sur la carte
        if (plan.location?.lat && plan.location?.lng) {
            document.getElementById('diveLat').value = plan.location.lat;
            document.getElementById('diveLng').value = plan.location.lng;
            if (this.marker) {
                this.map.removeLayer(this.marker);
            }
            this.marker = L.marker([plan.location.lat, plan.location.lng]).addTo(this.map);
            this.map.setView([plan.location.lat, plan.location.lng], 13);
        }

        this.currentPlanId = plan.id;
        this.updateDiveProfile();
        this.updateSafetyCalculations();

        // Fermer la modale de détails
        const modal = document.getElementById('planDetailsModal');
        if (modal) {
            modal.classList.add('hidden');
        }

        toast.success('Plan de plongée chargé avec succès');
    }
}

// Export a singleton instance
const divePlanner = new DivePlannerManager();
export default divePlanner;