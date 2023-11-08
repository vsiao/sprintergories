import { onValue, ref } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import { db } from "../store/store";
import "./CountdownTimer.css";

export default function CountdownTimer({
  endTimeMs,
  onFinish,
}: {
  endTimeMs: number;
  onFinish: () => void;
}) {
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(
    getSecondsLeft(endTimeMs, serverTimeOffset),
  );

  useEffect(() => {
    return onValue(ref(db, ".info/serverTimeOffset"), (snap) => {
      setServerTimeOffset(snap.val());
    });
  }, []);

  const currentTickTime = useRef(Date.now());
  useEffect(() => {
    if (secondsLeft > 0) {
      const timer = setTimeout(
        () => {
          setSecondsLeft(getSecondsLeft(endTimeMs, serverTimeOffset));
          currentTickTime.current = currentTickTime.current + 1000;
        },
        // Update 1 second later, but adjust for execution delay
        currentTickTime.current + 1000 - Date.now(),
      );
      return () => clearTimeout(timer);
    } else {
      onFinish();
    }
  });

  return <span className="CountdownTimer">{secondsLeft}</span>;
}

const getSecondsLeft = (endTimeMs: number, serverTimeOffset: number) => {
  const currentTimeMs = new Date().getTime() + serverTimeOffset;
  const timeLeftMs = endTimeMs - currentTimeMs;
  return Math.max(0, Math.round(timeLeftMs / 1000));
};
