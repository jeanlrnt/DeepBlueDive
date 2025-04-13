export const COLORS = {
    get isDarkMode() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    },
    get primary() {
        return this.isDarkMode ? '#4dabf7' : '#006994';
    },
    get secondary() {
        return this.isDarkMode ? '#74c0fc' : '#00A0C6';
    },
    get warning() {
        return this.isDarkMode ? '#ffd43b' : '#FF9F1C';
    },
    get success() {
        return this.isDarkMode ? '#40c057' : '#2f9e44';
    },
    get danger() {
        return this.isDarkMode ? '#ff6b6b' : '#fa5252';
    }
};

export function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

export function showModal(modalId) {
    window.showModal(modalId);
}

export function closeModal(modalId) {
    window.closeModal(modalId);
}

export function getGasMixLabel(gasMix, o2Percentage) {
    switch (gasMix) {
        case 'air':
            return 'Air (21% O₂)';
        case 'nitrox32':
            return 'Nitrox 32';
        case 'nitrox36':
            return 'Nitrox 36';
        case 'custom':
            return `Nitrox ${o2Percentage}%`;
        default:
            return gasMix;
    }
}

export function updateRangeSliderFill(slider, otherSlider, isMin) {
    const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    const otherValue = ((otherSlider.value - otherSlider.min) / (otherSlider.max - otherSlider.min)) * 100;
    
    if (isMin) {
        slider.style.background = `linear-gradient(to right, #e9ecef 0%, #e9ecef ${value}%, #0d6efd ${value}%, #0d6efd ${otherValue}%, #e9ecef ${otherValue}%, #e9ecef 100%)`;
    } else {
        slider.style.background = `linear-gradient(to right, #e9ecef 0%, #e9ecef ${otherValue}%, #0d6efd ${otherValue}%, #0d6efd ${value}%, #e9ecef ${value}%, #e9ecef 100%)`;
    }
}

// Toast notification system
export const toast = {
    init() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    },

    show(message, type = 'info') {
        // Initialiser le conteneur si nécessaire
        this.init();

        // Créer et configurer le toast
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.display = 'block'; // Assurer que le toast est visible
        toast.style.backgroundColor = getToastColor(type);

        // Gérer la fermeture au clic
        toast.addEventListener('click', () => {
            toast.remove();
        });

        // Ajouter le toast au conteneur
        container.appendChild(toast);

        // Forcer un reflow pour déclencher l'animation
        toast.offsetHeight;

        // Supprimer le toast après 3 secondes
        setTimeout(() => {
            if (toast && toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    }
};

function getToastColor(type) {
    const colors = {
        success: COLORS.success,
        error: COLORS.danger,
        warning: COLORS.warning,
        info: COLORS.primary
    };
    return colors[type] || colors.info;
}