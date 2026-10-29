/** Ask once, on a user gesture, so widgets can ping when something finishes in a background tab. */
export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function notify(title: string, body: string) {
  // Only worth it when the tab is in the background; the sound covers the rest.
  if (!document.hidden || !("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body });
}
