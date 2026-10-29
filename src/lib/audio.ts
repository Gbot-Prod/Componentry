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
  alarm.play().catch(() => {});

  setTimeout(() => {
    alarmPlaying = false;
  }, 1000);
};

export const stopAlarm = () => {
  alarm.pause();
  alarm.currentTime = 0;
};

/*
 * A looping ring for alarms and timers that should sound until dismissed. Several widgets can
 * ring at once, so each one registers as an owner and the sound only stops when the last one
 * stops. It gives up on its own after a while in case the tab was left unattended.
 */
const ringer = new Audio("/alarm.mp3");
ringer.loop = true;
ringer.volume = 0.5;

const MAX_RING_MS = 5 * 60 * 1000;
const ringOwners = new Set<string>();
let ringTimeout: number | undefined;

const silenceRinger = () => {
  clearTimeout(ringTimeout);
  ringer.pause();
  ringer.currentTime = 0;
};

export const startRinging = (owner: string) => {
  ringOwners.add(owner);
  if (!ringer.paused) return;
  ringer.currentTime = 0;
  ringer.play().catch(() => {});
  clearTimeout(ringTimeout);
  ringTimeout = window.setTimeout(() => {
    ringOwners.clear();
    silenceRinger();
  }, MAX_RING_MS);
};

export const stopRinging = (owner: string) => {
  ringOwners.delete(owner);
  if (ringOwners.size === 0) silenceRinger();
};
