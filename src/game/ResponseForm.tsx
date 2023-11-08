import { get, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { DbGame } from "../firebase/schema/DbGame";
import { db } from "../store/store";
import CountdownTimer from "./CountdownTimer";

export default function ResponseForm({
  game,
  gamePath,
  userId,
  onTimerFinish,
}: {
  game: DbGame;
  gamePath: string;
  userId: string;
  onTimerFinish: () => void;
}) {
  return (
    <>
      {game && (
        <CountdownTimer
          endTimeMs={game.startedAt + game.options.timeLimitMs}
          onFinish={onTimerFinish}
        />
      )}
      <table className="Sprintergories-responseTable">
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
      <td className="Sprintergories-categoryLabel">
        <label htmlFor={category}>{category}</label>
      </td>
      <td className="Sprintergories-responseCell">
        <input
          id={category}
          className="Sprintergories-responseInput"
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
