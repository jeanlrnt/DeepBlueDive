class SafetyTimerManager {
    constructor() {
        this.timeLeft = 180; // 3 minutes in seconds
        this.isRunning = false;
        this.timer = null;
        this.alarmSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    }

    initialize() {
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        document.getElementById('startStopBtn').addEventListener('click', () => this.toggleTimer());
        document.getElementById('resetStopBtn').addEventListener('click', () => this.resetTimer());
        document.getElementById('addMinuteBtn').addEventListener('click', () => this.addMinute());
    }

    toggleTimer() {
        if (this.isRunning) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
        this.updateStartStopButton();
    }

    startTimer() {
        this.isRunning = true;
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.playAlarm();
            }
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timer);
        this.isRunning = false;
    }

    resetTimer() {
        this.stopTimer();
        this.timeLeft = 180;
        this.updateDisplay();
        this.updateStartStopButton();
    }

    addMinute() {
        this.timeLeft += 60;
        this.updateDisplay();
    }

    updateDisplay() {
        const timerDisplay = document.getElementById('safetyStopTimer');
        if (!timerDisplay) return;

        timerDisplay.textContent = this.formatTime();

        // Change color when time is running low
        if (this.timeLeft <= 30) {
            timerDisplay.classList.add('text-danger');
            timerDisplay.classList.remove('text-dark');
        } else {
            timerDisplay.classList.remove('text-danger');
            timerDisplay.classList.add('text-dark');
        }
    }

    updateStartStopButton() {
        const startStopBtn = document.getElementById('startStopBtn');
        if (!startStopBtn) return;

        if (this.isRunning) {
            startStopBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            startStopBtn.classList.remove('btn-success');
            startStopBtn.classList.add('btn-danger');
        } else {
            startStopBtn.innerHTML = '<i class="fas fa-play"></i> Start';
            startStopBtn.classList.remove('btn-danger');
            startStopBtn.classList.add('btn-success');
        }
    }

    formatTime() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    playAlarm() {
        this.alarmSound.play().catch(error => {
            console.warn('Could not play alarm sound:', error);
        });
    }

    // Configuration methods
    setDefaultDuration(minutes) {
        const seconds = minutes * 60;
        if (seconds > 0 && !this.isRunning) {
            this.timeLeft = seconds;
            this.updateDisplay();
        }
    }

    setAlarmSound(url) {
        this.alarmSound = new Audio(url);
    }

    destroy() {
        this.stopTimer();
        this.alarmSound = null;
    }
}

// Export a singleton instance
const safetyTimer = new SafetyTimerManager();
export default safetyTimer;