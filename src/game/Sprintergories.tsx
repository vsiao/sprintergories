import { ref, set } from "firebase/database";
import { useDbGame } from "../firebase/hooks";
import { DbGame } from "../firebase/schema/DbGame";
import { DbRoomUser } from "../firebase/schema/DbRoom";
import { db } from "../store/store";
import GameReview from "./GameReview";
import ResponseForm from "./ResponseForm";
import VotingForm from "./VotingForm";
import "./Sprintergories.css";

export default function Sprintergories({
  roomId,
  gameId,
  userId,
  isHost,
  users,
}: {
  roomId: string;
  gameId: string;
  userId: string;
  isHost: boolean;
  users: Record<string, DbRoomUser>;
}) {
  const gamePath = `rooms/${roomId}/games/${gameId}`;
  const game = useDbGame(gamePath);

  return (
    <>
      <h2 className="GameRoom-mainHeader">Letter: {game?.options.letter}</h2>
      {game && isHost && renderHostControls(game, gamePath, roomId)}
      {game && renderContents(game, gamePath, userId, users)}
    </>
  );
}

function renderHostControls(game: DbGame, gamePath: string, roomId: string) {
  const status = game.status;
  return (
    <>
      {status.kind !== "complete" && status.kind !== "abandoned" && (
        <button
          onClick={() => {
            set(ref(db, `rooms/${roomId}/state/currentGameId`), null);
            set(ref(db, `${gamePath}/state/status`), { kind: "abandoned" });
          }}
        >
          Abandon game
        </button>
      )}
      {(status.kind === "complete" || status.kind === "abandoned") && (
        <button
          onClick={() => {
            set(ref(db, `rooms/${roomId}/state/currentGameId`), null);
          }}
        >
          Continue
        </button>
      )}
      {status.kind === "inProgress" && (
        <button onClick={() => endRound(gamePath)}>End round</button>
      )}
      {status.kind === "voting" && (
        <button
          onClick={() => {
            if (status.category === game.categories.length - 1) {
              set(ref(db, `${gamePath}/state/status`), { kind: "complete" });
            } else {
              set(
                ref(db, `${gamePath}/state/status/category`),
                status.category + 1,
              );
            }
          }}
        >
          End voting
        </button>
      )}
    </>
  );
}

function renderContents(
  game: DbGame,
  gamePath: string,
  userId: string,
  users: Record<string, DbRoomUser>,
) {
  switch (game.status.kind) {
    case "inProgress":
      return (
        <ResponseForm
          game={game}
          gamePath={gamePath}
          userId={userId}
          onTimerFinish={() => endRound(gamePath)}
        />
      );
    case "voting":
      return (
        <VotingForm
          key={game.status.category}
          index={game.status.category}
          category={game.categories[game.status.category]}
          gamePath={gamePath}
          userId={userId}
          users={users}
        />
      );
    case "complete":
    case "abandoned":
      return (
        <GameReview
          game={game}
          gamePath={gamePath}
          users={users}
          wasAbandoned={game.status.kind === "abandoned"}
        />
      );
  }
}

const endRound = (gamePath: string) => {
  set(ref(db, `${gamePath}/state/status`), {
    kind: "voting",
    category: 0,
  });
};
