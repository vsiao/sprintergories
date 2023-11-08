import { useEffect, useRef, useState } from "react";
import { DbRoom, DbRoomUser } from "./schema/DbRoom";
import {
  get,
  onDisconnect,
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
  update,
} from "firebase/database";
import { db } from "../store/store";
import { DbGame, DbResponses } from "./schema/DbGame";
import { ProcessedResponse, processResponses } from "../game/responses";

export const useDbRoom = (roomId: string) => {
  let [room, setRoom] = useState<DbRoom | null>(null);
  let [users, setUsers] = useState<Record<string, DbRoomUser> | null>(null);

  useEffect(() => {
    const unsubscribeRoom = onValue(ref(db, `rooms/${roomId}/state`), (snap) =>
      setRoom(snap.val()),
    );
    const unsubscribeUsers = onValue(ref(db, `rooms/${roomId}/users`), (snap) =>
      setUsers(snap.val()),
    );
    return () => {
      unsubscribeRoom();
      unsubscribeUsers();
    };
  }, [roomId]);

  // Initialize the room if it doesn't exist
  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomId}/state`);
    runTransaction(roomRef, (currentData) => {
      if (!currentData) {
        return {
          id: roomId,
          createdAt: serverTimestamp(),
          status: "lobby",
          options: {
            timeLimit: 30,
            numCategories: 3,
            letterOverride: "A",
          },
        };
      }
    });
  }, [roomId]);

  if (window.location.search.indexOf("localdev") >= 0) {
    room = {
      createdAt: 1234567890,
      id: "FAKEROOMID",
      options: {
        letterOverride: "",
        numCategories: "12",
        timeLimit: "120",
      },
      status: "lobby",
      currentGameId: "FAKEGAMEID",
    };
    users = {
      DEVUSER: {
        connectedAt: 1234567890,
        id: "DEVUSER",
        name: "Fake Local User",
        status: "connected",
      },
      TESTUSER: {
        connectedAt: 987654321,
        id: "TESTUSER",
        name: "testycat",
        status: "connected",
      },
    };
  }
  return [room, users] as const;
};

export const usePresence = (
  roomId: string | undefined,
  userId: string | null,
) => {
  useEffect(() => {
    if (!roomId || !userId) {
      return;
    }
    const userRef = ref(db, `rooms/${roomId}/users/${userId}`);
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

export const useDbGame = (gamePath: string) => {
  let [game, setGame] = useState<DbGame | null>(null);
  const mountTimeMs = useRef(Date.now());

  useEffect(() => {
    const gameStateRef = ref(db, `${gamePath}/state`);
    return onValue(gameStateRef, (snap) => setGame(snap.val()));
  }, [gamePath]);

  if (window.location.search.indexOf("localdev") >= 0) {
    game = {
      categories: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
        (n) => `category ${n}`,
      ),
      options: {
        letter: "X",
        timeLimitMs: 30000,
      },
      roomId: "FAKEROOMID",
      startedAt: mountTimeMs.current - 15000,
      status: {
        // kind: "inProgress",
        kind: "voting",
        category: 0,
      },
    };
  }
  return game;
};

export const useDbResponses = (
  gamePath: string,
  index: number,
  userId: string,
) => {
  let [result, setResult] = useState<Record<string, ProcessedResponse> | null>(
    null,
  );
  useEffect(() => {
    const responsesRef = ref(db, `${gamePath}/responses`);
    get(responsesRef).then((snap) => {
      const responsesByUid: DbResponses = snap.val() ?? {};
      setResult(processResponses(responsesByUid, index));
    });
  }, [gamePath, index, userId]);

  if (window.location.search.indexOf("localdev") >= 0) {
    result = {
      DEVUSER: {
        isDuplicate: false,
        isEmpty: false,
        response: "FAKERESPONSE",
      },
      TESTUSER: {
        isDuplicate: false,
        isEmpty: false,
        response: "test response",
      },
    };
  }
  return result;
};

export const useDbVotes = (votesPath: string) => {
  const [votes, setVotes] = useState<Record<
    string,
    "upvote" | "downvote"
  > | null>(null);

  useEffect(() => {
    return onValue(ref(db, votesPath), (snap) => setVotes(snap.val()));
  }, [votesPath]);

  if (window.location.search.indexOf("localdev") >= 0) {
  }
  return votes;
};
