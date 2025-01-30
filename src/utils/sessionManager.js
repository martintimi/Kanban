const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_BEFORE = 5 * 60 * 1000;    // Show warning 5 minutes before timeout

class SessionManager {
  constructor() {
    this.timeout = null;
    this.warningTimeout = null;
    this.startTime = Date.now();
    this.warningCallback = null;
    this.soundEnabled = localStorage.getItem('sessionSoundEnabled') !== 'false';
  }

  toggleSound(enabled) {
    this.soundEnabled = enabled;
    localStorage.setItem('sessionSoundEnabled', enabled);
  }

  resetTimer(logoutCallback, warningCallback) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }

    this.startTime = Date.now();
    this.warningCallback = warningCallback;

    // Set warning timeout
    this.warningTimeout = setTimeout(() => {
      warningCallback();
    }, TIMEOUT_DURATION - WARNING_BEFORE);

    // Set logout timeout
    this.timeout = setTimeout(logoutCallback, TIMEOUT_DURATION);
  }

  clearTimer() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }
  }

  // Add time to current session
  extendSession() {
    if (this.timeout && this.warningCallback) {
      this.resetTimer(
        () => this.timeout,
        () => this.warningCallback
      );
    }
  }

  // Get remaining time in seconds
  getRemainingTime() {
    return Math.max(
      0,
      TIMEOUT_DURATION - (Date.now() - this.startTime)
    ) / 1000;
  }
}

export const sessionManager = new SessionManager(); 