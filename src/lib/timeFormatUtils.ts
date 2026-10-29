export const formatMMSS = (ms: number) => {
  const minutes = String(Math.floor(ms / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

/** Stopwatch style: MM:SS.cc, with an hours part only once it's needed. */
export const formatStopwatch = (ms: number) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = String(Math.floor((ms / 60000) % 60)).padStart(2, '0');
  const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, '0');
  const centiseconds = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');

  return `${hours > 0 ? `${hours}:` : ''}${minutes}:${seconds}.${centiseconds}`;
}
