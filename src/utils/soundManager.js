class SoundManager {
  constructor() {
    this.warningSound = new Audio('/sounds/notification.mp3');
    this.warningSound.volume = 0.5;
  }

  playWarningSound() {
    try {
      this.warningSound.currentTime = 0;
      this.warningSound.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  stopWarningSound() {
    try {
      this.warningSound.pause();
      this.warningSound.currentTime = 0;
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  }
}

export const soundManager = new SoundManager(); 