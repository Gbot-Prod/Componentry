/*shared audio singletons*/

export const clickSound = new Audio("/click.mp3");
clickSound.volume = 0.5;

export const playClickSound = () => {
  // Restart so rapid clicks each make a sound; ignore autoplay-policy rejections.
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
};

export const alarm = new Audio("/alarm.mp3");
alarm.volume = 0.5;

let alarmPlaying = false;
export const playAlarm = () => {
  if (alarmPlaying) return;
  alarmPlaying = true;
  alarm.play();

  setTimeout(() => { 
    alarmPlaying = false; 
  }, 1000);
};

export const stopAlarm = () => {
  alarm.pause();
  alarm.currentTime = 0;
};