import {
  onDisconnect,
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { FormEventHandler, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "./store/hooks";
import { selectUserId } from "./store/authSlice";
import { db } from "./store/store";
import "./GameRoom.css";

export default function GameRoom() {
  const { roomId } = useParams() as { roomId: string };
  const userId = useAppSelector(selectUserId);
  const [room, users] = useDbRoom(roomId);
  usePresence(roomId, userId);

  if (!userId || !room || !users?.[userId]) {
    return null;
  }

  const roomUser = users[userId];
  return (
    <div className="GameRoom">
      <div className="GameRoom-main">
        {roomUser.name ? (
          <h2 className="GameRoom-mainHeader">Game Options</h2>
        ) : (
          <GameRoomNameEntry roomId={roomId} userId={userId} />
        )}
      </div>
      <div className="GameRoom-panel">
        <h3 className="GameRoom-playersHeader">Players</h3>
        <ul className="GameRoom-playerList">
          {Object.values(users)
            .filter((u) => u.status === "connected")
            .map((u, i) => (
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
    set(ref(db, `roomUsers/${roomId}/${userId}/name`), name);
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
        <input
          className="GameRoomNameEntry-submit"
          type="submit"
          value="Enter"
        />
      </form>
    </>
  );
}

interface DbRoomUser {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  connectedAt: number;
}

interface DbRoom {
  id: string;
  createdAt: number;
  status: "lobby";
}

const useDbRoom = (roomId: string) => {
  const [room, setRoom] = useState<DbRoom | null>(null);
  const [users, setUsers] = useState<Record<string, DbRoomUser> | null>(null);

  useEffect(() => {
    const unsubscribeRoom = onValue(ref(db, `rooms/${roomId}`), (snap) => {
      setRoom(snap.val());
    });
    const unsubscribeUsers = onValue(ref(db, `roomUsers/${roomId}`), (snap) => {
      setUsers(snap.val());
    });
    return () => {
      unsubscribeRoom();
      unsubscribeUsers();
    };
  }, [roomId]);

  // Initialize the room if it doesn't exist
  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomId}`);
    runTransaction(roomRef, (currentData) => {
      if (!currentData) {
        return {
          id: roomId,
          createdAt: serverTimestamp(),
          status: "lobby",
        };
      }
    });
  }, [roomId]);

  return [room, users] as const;
};

const usePresence = (roomId: string | undefined, userId: string | null) => {
  useEffect(() => {
    if (!roomId || !userId) {
      return;
    }
    const userRef = ref(db, `roomUsers/${roomId}/${userId}`);
    onValue(ref(db, ".info/connected"), async (snap) => {
      if (snap.val() === true) {
        await onDisconnect(userRef).update({ status: "disconnected" });
        update(userRef, {
          id: userId,
          status: "connected",
          connectedAt: serverTimestamp(),
        });
      }
    });
  }, [roomId, userId]);
};
