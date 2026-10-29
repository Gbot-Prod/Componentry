// src/hooks/useCountdownTimer.ts
import { useState, useRef, useCallback, useEffect } from "react";

interface UseCountdownTimerOptions {
  onFinish?: () => void;
  tickMs?: number; // how often to re-render, default 100ms
  initialMs?: number; // time shown before the first start, default 0
}

interface UseCountdownTimerReturn {
  timeMs: number;
  isRunning: boolean;
  start: (durationMs: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setTime: (ms: number) => void;
  addTime: (ms: number) => void;
}

export function useCountdownTimer({
  onFinish,
  tickMs = 100,
  initialMs = 0,
}: UseCountdownTimerOptions = {}): UseCountdownTimerReturn {
  const [timeMs, setTimeMs] = useState(initialMs);
  const [isRunning, setIsRunning] = useState(false);

  // These refs are the source of truth — they don't cause re-renders
  const startWallTime = useRef<number>(0);    // Date.now() when started/resumed
  const remainingAtStart = useRef<number>(initialMs); // how much time was left when we (re)started
  const intervalRef = useRef<number>(0);
  const onFinishRef = useRef(onFinish);

  // Keep onFinish ref fresh without restarting the interval
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = 0;
  }, []);

  const startTicking = useCallback((remaining: number) => {
    stop();
    startWallTime.current = Date.now();
    remainingAtStart.current = remaining;

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startWallTime.current;
      const newTime = Math.max(0, remainingAtStart.current - elapsed);

      setTimeMs(newTime);

      if (newTime <= 0) {
        stop();
        remainingAtStart.current = 0;
        setIsRunning(false);
        onFinishRef.current?.();
      }
    }, tickMs);
  }, [stop, tickMs]);

  const start = useCallback((durationMs: number) => {
    setTimeMs(durationMs);
    setIsRunning(true);
    startTicking(durationMs);
  }, [startTicking]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    // Snapshot how much time is left right now
    const elapsed = Date.now() - startWallTime.current;
    remainingAtStart.current = Math.max(0, remainingAtStart.current - elapsed);
    setTimeMs(remainingAtStart.current);
    stop();
    setIsRunning(false);
  }, [isRunning, stop]);

  const resume = useCallback(() => {
    if (isRunning || remainingAtStart.current <= 0) return;
    setIsRunning(true);
    startTicking(remainingAtStart.current);
  }, [isRunning, startTicking]);

  const reset = useCallback(() => {
    stop();
    setIsRunning(false);
    setTimeMs(0);
    remainingAtStart.current = 0;
  }, [stop]);

  const setTime = useCallback((ms: number) => {
    stop();
    setIsRunning(false);
    setTimeMs(ms);
    remainingAtStart.current = ms;
  }, [stop]);

  // Works mid-run too: the next tick measures from the bumped starting amount.
  const addTime = useCallback((ms: number) => {
    remainingAtStart.current = Math.max(0, remainingAtStart.current + ms);
    if (!intervalRef.current) setTimeMs(remainingAtStart.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { timeMs, isRunning, start, pause, resume, reset, setTime, addTime };
}