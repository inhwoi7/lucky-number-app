"use client";

import { useRef, useEffect, useCallback, useState } from "react";

export type DrumState = "idle" | "spinning" | "done";

export function useDrum() {
  const angleRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [drumAngle, setDrumAngle] = useState(0);
  const [state, setState] = useState<DrumState>("idle");

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startIdle = useCallback(() => {
    stopRaf();
    let last: number | null = null;
    const frame = (ts: number) => {
      if (last) angleRef.current += (ts - last) * 0.00012;
      last = ts;
      setDrumAngle(angleRef.current);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    setState("idle");
  }, [stopRaf]);

  const spinAndStop = useCallback(
    (onDone: () => void) => {
      stopRaf();
      setState("spinning");
      const FAST_DUR = 1800;
      let startTs: number | null = null;
      let last: number | null = null;

      const slowDown = (cb: () => void) => {
        let slowStart: number | null = null;
        let slowLast: number | null = null;
        const frame = (ts: number) => {
          if (!slowStart) slowStart = ts;
          const p = Math.min((ts - slowStart) / 900, 1);
          const speed = 0.008 * (1 - p) * (1 - p);
          if (slowLast) angleRef.current += (ts - slowLast) * speed;
          slowLast = ts;
          setDrumAngle(angleRef.current);
          if (p < 1) {
            rafRef.current = requestAnimationFrame(frame);
          } else {
            setState("done");
            cb();
          }
        };
        rafRef.current = requestAnimationFrame(frame);
      };

      const fastFrame = (ts: number) => {
        if (!startTs) startTs = ts;
        const elapsed = ts - startTs;
        const progress = Math.min(elapsed / FAST_DUR, 1);
        const speed = 0.00012 + (0.008 - 0.00012) * Math.sin(progress * Math.PI);
        if (last) angleRef.current += (ts - last) * speed;
        last = ts;
        setDrumAngle(angleRef.current);
        if (elapsed < FAST_DUR) {
          rafRef.current = requestAnimationFrame(fastFrame);
        } else {
          slowDown(onDone);
        }
      };

      rafRef.current = requestAnimationFrame(fastFrame);
    },
    [stopRaf]
  );

  useEffect(() => {
    startIdle();
    return stopRaf;
  }, [startIdle, stopRaf]);

  return { drumAngle, state, startIdle, spinAndStop };
}
