const SOUNDS = {
  NOTIFICATION_1: '/sounds/notification1.wav',
  NOTIFICATION_2: '/sounds/notification2.wav',
  NOTIFICATION_3: '/sounds/notification3.wav',
  BELL: '/sounds/bell.wav',
  DING: '/sounds/ding.wav'
};

class SoundManager {
  static audioElements = {};

  static async preloadSounds() {
    try {
      // Create audio elements for each sound
      Object.entries(SOUNDS).forEach(([key, path]) => {
        const audio = new Audio(path);
        audio.preload = 'auto';
        this.audioElements[key] = audio;
      });

      // Create a fallback beep sound
      const beep = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+Df4B6eHl5fYGEg4eCgX9/gIOFiIuKiIWCgYGDhoyPjYuGgX15eXyAhYiKiYaDgICChYqOkZCMh4B8eXp9goiMjYyIhICAgYWLkJOTjoiBfHh4e4CGi46OjImFg4ODhoyRlZWQioJ+eXh6f4WJjY2LiYaEhIWHi5CTlI+LhYB7eXp+g4eKioiHhYSEhYiMkJKSjoqEgHx6e36ChYeHhoWEg4OEh4qOkZGPjIeDeHx7fICChIWFhIOCgoOFiY2QkY+MiIN/fHt8f4GDg4OCgYGBgoWIi46PjoyJhYJ+fHx+gIKDgoKBgYGChIeKjY+PjYqHg398fH1/gYKCgoGAgYGDhomMjo6NjIiGgn98fH1+gIGBgYCAgIGDhYiLjY2Mi4mGg39+fX1+f4CAgICAgICChIaJi4yMi4mHhIB+fX19fn+AgICAgICBg4WIiouLiomHhYJ/fn19fn9/gICAgICBgoSGiYqKiomIhoSBf359fX5/f39/f4CAgYOFh4mJiYmIhoWCgH5+fX1+f39/f39/gIGChYeIiYmIiIaFgoB+fn19fn9/f39/f4CBg4WGiIiIiIeGhIKAfn59fX5+f39/f39/gIKDhYaHh4aGhYSDgYB/fn59fX5+f39/f3+AgYOEhYaGhoaFhIOCgH9+fn59fn5/f39/f4CBgoSFhoaGhYWEg4KBf39+fn19fn5/f39/f4CCg4WFhYWFhYSEgoGAf35+fn1+fn9/f39/gIGChIWFhYWEhIOCgYB/f35+fX5+fn9/f3+AgYKDhIWFhISEg4KCgH9/fn5+fn5+f39/f4CBgoOEhISEhIODgoGAf39+fn5+fn5/f39/gIGCg4SEhISEg4OCgYGAf39+fn5+fn5/f39/gIGCg4ODg4ODgoKBgYB/f35+fn5+fn9/f3+AgYKDg4ODg4OCgoGBgH9/f35+fn5+f39/f4CAgYKDg4ODgoKCgYGAf39/fn5+fn5/f39/f4CBgoKCgoKCgoGBgIB/f39+fn5+fn5/f39/gIGBgoKCgoKCgYGBgIB/f39+fn5+fn9/f39/gIGBgoKCgoKBgYGAgH9/f39+fn5+fn9/f3+AgIGBgoKCgoGBgYCAgH9/f35+fn5+f39/f3+AgYGBgoKBgYGBgICAf39/f35+fn5+f39/f4CAgYGBgYGBgYGAgIB/f39/fn5+fn5/f39/f4CAgYGBgYGBgYCAgIB/f39/fn5+fn5/f39/f4CAgYGBgYGBgICAgH9/f39/fn5+fn5/f39/f4CAgYGBgYGAgICAgH9/f39+fn5+fn9/f39/gICAgYGBgYCAgICAf39/f39+fn5+fn9/f39/gICAgYGAgYCAgICAf39/f39+fn5+fn9/f39/gICAgICAgICAgIB/f39/f39+fn5+fn9/f39/gICAgICAgICAgIB/f39/f39+fn5+fn9/f39/gICAgICAgICAgIB/f39/f35+fn5+fn9/f39/gICAgICAgICAgH9/f39/f35+fn5+f39/f39/gICAgICAgICAf39/f39/f35+fn5+f39/f39/gICAgICAgIB/f39/f39/fn5+fn5/f39/f3+AgICAgICAgH9/f39/f39+fn5+fn9/f39/f4CAgICAgIB/f39/f39/fn5+fn5/f39/f3+AgICAgICAf39/f39/f39+fn5+fn9/f39/f4CAgICAgH9/f39/f39/fn5+fn5/f39/f3+AgICAgIB/f39/f39/f35+fn5+f39/f39/gICAgICAf39/f39/f39+fn5+fn9/f39/f4CAgICAgH9/f39/f39/fn5+fn5/f39/f3+AgICAgH9/f39/f39/fn5+fn5/f39/f3+AgICAgH9/f39/f39/f35+fn5+f39/f39/gICAgH9/f39/f39/f35+fn5+f39/f39/gICAf39/f39/f39/fn5+fn5/f39/f3+AgIB/f39/f39/f39+fn5+fn9/f39/f4CAf39/f39/f39/f35+fn5+f39/f39/gIB/f39/f39/f39/fn5+fn5/f39/f39/gH9/f39/f39/f35+fn5+f39/f39/f4B/f39/f39/f39+fn5+fn9/f39/f39/f39/f39/f39/fn5+fn5/f39/f39/f39/f39/f39/f35+fn5+f39/f39/f39/f39/f39/f39+fn5+fn9/f39/f39/f39/f39/f39+fn5+fn9/f39/f39/f39/f39/f39+fn5+fn9/f39/f39/f39/f39/f35+fn5+f39/f39/f39/f39/f39/f35+fn5/f39/f39/f39/f39/f39/fn5+fn9/f39/f39/f39/f39/f35+fn5/f39/f39/f39/f39/f39+fn5+f39/f39/f39/f39/f39/fn5+fn9/f39/f39/f39/f39/f35+fn9/f39/f39/f39/f39/f35+fn9/f39/f39/f39/f39/f35+fn9/f39/f39/f39/f39/");
      beep.preload = 'auto';
      this.audioElements.BEEP = beep;
    } catch (error) {
      console.error('Error preloading sounds:', error);
    }
  }

  static async playNotification(soundType = 'NOTIFICATION_1') {
    try {
      // Try to play the selected sound
      if (this.audioElements[soundType]) {
        const audio = this.audioElements[soundType];
        audio.currentTime = 0;
        await audio.play();
        return;
      }

      // If selected sound not available, play beep
      if (this.audioElements.BEEP) {
        const beep = this.audioElements.BEEP;
        beep.currentTime = 0;
        await beep.play();
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  static setVolume(volume) {
    // Volume should be between 0 and 1
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    Object.values(this.audioElements).forEach(audio => {
      audio.volume = normalizedVolume;
    });
  }

  static async playWarningSound() {
    try {
      // Try to play the warning sound
      if (this.audioElements.BELL) {
        const bell = this.audioElements.BELL;
        bell.currentTime = 0;
        await bell.play();
      }
    } catch (error) {
      console.error('Error playing warning sound:', error);
    }
  }
}

export { SoundManager, SOUNDS, playWarningSound };

export const soundManager = new SoundManager();

// Call this function when the session is about to expire
function playWarningSound() {
  soundManager.playNotification('BELL');
} 