import { push, ref, serverTimestamp, set } from "firebase/database";
import { FormEventHandler, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "./store/hooks";
import { selectUserId } from "./store/authSlice";
import { db } from "./store/store";
import { useDbRoom, usePresence } from "./firebase/hooks";
import { DbRoomOptions } from "./firebase/schema/DbRoom";
import { defaultCategories } from "./game/defaultCategories";
import Sprintergories from "./game/Sprintergories";
import "./GameRoom.css";

export default function GameRoom() {
  const { roomId } = useParams() as { roomId: string };
  let userId = useAppSelector(selectUserId);
  const [room, users] = useDbRoom(roomId);
  usePresence(roomId, userId);

  if (window.location.search.indexOf("localdev") >= 0) {
    userId = "DEVUSER";
  }
  if (!userId || !room || !users?.[userId]) {
    return null;
  }

  const roomUser = users[userId];
  const sortedUsers = Object.values(users)
    .filter((u) => u.status === "connected")
    .sort((u1, u2) => u1.connectedAt - u2.connectedAt);
  const isHost = sortedUsers[0] === roomUser;

  return (
    <div className="GameRoom">
      <div className="GameRoom-main">
        {roomUser.name ? (
          room.currentGameId ? (
            <Sprintergories
              roomId={roomId}
              gameId={room.currentGameId}
              userId={userId}
              isHost={isHost}
              users={users}
            />
          ) : (
            <GameOptionsForm
              roomId={roomId}
              options={room.options}
              disabled={!isHost}
            />
          )
        ) : (
          <GameRoomNameEntry roomId={roomId} userId={userId} />
        )}
      </div>
      <div className="GameRoom-panel">
        <h3 className="GameRoom-playersHeader">Players</h3>
        <ul className="GameRoom-playerList">
          {sortedUsers.map((u, i) => (
            <li key={u.id} className="GameRoom-player">
              {u.name ?? "connecting…"}
              {i === 0 && <span className="GameRoom-hostLabel">host</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function GameOptionsForm({
  roomId,
  options,
  disabled,
}: {
  roomId: string;
  options: DbRoomOptions;
  disabled: boolean;
}) {
  const useFormField = <T extends keyof DbRoomOptions>({
    label,
    name,
    placeholder,
  }: {
    label: string;
    name: T;
    placeholder?: string;
  }) => {
    const [value, setValue] = useState(options[name] ?? "");
    const field = (
      <div className="GameOptionsForm-field">
        <label className="GameOptionsForm-label" htmlFor={label}>
          {label}
        </label>
        <input
          id={label}
          className="GameOptionsForm-input"
          disabled={disabled}
          type="text"
          value={disabled ? options[name] : value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            set(
              ref(db, `rooms/${roomId}/state/options/${name}`),
              e.target.value,
            );
          }}
        />
      </div>
    );
    return field;
  };
  const timeField = useFormField({
    label: "Time limit (seconds)",
    name: "timeLimit",
  });
  const numCategoriesField = useFormField({
    label: "Number of categories",
    name: "numCategories",
  });
  const letterField = useFormField({
    label: "Letter override",
    name: "letterOverride",
    placeholder: "None (random)",
  });

  const startGame: FormEventHandler = (event) => {
    event.preventDefault();

    const categories = getRandom(
      defaultCategories.split("\n"),
      parseInt(options.numCategories ?? 12, 10),
    );

    const gameId = push(ref(db, `rooms/${roomId}/games`)).key!;
    set(ref(db, `rooms/${roomId}/games/${gameId}/state`), {
      roomId,
      startedAt: serverTimestamp(),
      options: {
        timeLimitMs: parseInt(options.timeLimit, 10) * 1000,
        letter:
          options.letterOverride.substring(0, 1).toUpperCase() ||
          "ABCDEFGHIJKLMNOPRSTW".charAt(Math.floor(Math.random() * 20)),
      },
      categories,
      status: { kind: "inProgress" },
    });
    set(ref(db, `rooms/${roomId}/state/currentGameId`), gameId);
  };

  return (
    <>
      <h2 className="GameRoom-mainHeader">Game Options</h2>
      <form className="GameOptionsForm" onSubmit={startGame}>
        {timeField}
        {numCategoriesField}
        {letterField}
        {!disabled && (
          <input
            className="GameOptionsForm-submit GameRoom-submit"
            type="submit"
            value="Start Game"
          />
        )}
      </form>
    </>
  );
}

/** https://stackoverflow.com/a/19270021 */
function getRandom<T>(arr: T[], n: number) {
  const result = new Array(n);
  let len = arr.length;
  const taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    const x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

function GameRoomNameEntry({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) {
  const [name, setName] = useState("");

  const submit: FormEventHandler = (event) => {
    event.preventDefault();
    set(ref(db, `rooms/${roomId}/users/${userId}/name`), name);
  };

  return (
    <>
      <h2 className="GameRoom-mainHeader">Enter Room</h2>
      <form className="GameRoomNameEntry" onSubmit={submit}>
        <input
          autoFocus={true}
          className="GameRoomNameEntry-input"
          type="text"
          value={name}
          placeholder="Username"
          onChange={(e) => setName(e.target.value)}
        />
        <input className="GameRoom-submit" type="submit" value="Enter" />
      </form>
    </>
  );
}
