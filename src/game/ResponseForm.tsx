import { useEffect, useRef, useState } from "react";
import { DbGame } from "../firebase/schema/DbGame";
import { get, onValue, ref, set } from "firebase/database";
import { db } from "../store/store";

export default function ResponseForm({
  game,
  gamePath,
  userId,
}: {
  game: DbGame;
  gamePath: string;
  userId: string;
}) {
  return (
    <>
      {game && (
        <GameTimer endTimeMs={game.startedAt + game.options.timeLimitMs} />
      )}
      <table className="Sprintegories-responseTable">
        <tbody>
          {game?.categories?.map((category, i) => (
            <CategoryField
              key={category}
              category={category}
              path={`${gamePath}/responses/${userId}/${i}`}
            />
          ))}
        </tbody>
      </table>
    </>
  );
}

function CategoryField({ category, path }: { category: string; path: string }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    get(ref(db, path)).then((snap) => {
      const dbValue = snap.val();
      if (dbValue) {
        setValue(dbValue);
      }
    });
  }, [path]);

  return (
    <tr key={category}>
      <td className="Sprintegories-categoryLabel">
        <label htmlFor={category}>{category}</label>
      </td>
      <td className="Sprintegories-responseCell">
        <input
          id={category}
          className="Sprintegories-responseInput"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            set(ref(db, path), e.target.value);
          }}
        />
      </td>
    </tr>
  );
}

function GameTimer({ endTimeMs }: { endTimeMs: number }) {
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
    }
  });

  return <>{secondsLeft}</>;
}

const getSecondsLeft = (endTimeMs: number, serverTimeOffset: number) => {
  const currentTimeMs = new Date().getTime() + serverTimeOffset;
  const timeLeftMs = endTimeMs - currentTimeMs;
  return Math.max(0, Math.round(timeLeftMs / 1000));
};
