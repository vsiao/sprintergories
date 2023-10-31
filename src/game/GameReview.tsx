import { get, ref } from "firebase/database";
import { DbGame, DbResponses, DbVotes } from "../firebase/schema/DbGame";
import { db } from "../store/store";
import { useEffect, useState } from "react";
import { DbRoomUser } from "../firebase/schema/DbRoom";
import "./GameReview.css";

export default function GameReview({
  game,
  gamePath,
  users,
  wasAbandoned,
}: {
  game: DbGame;
  gamePath: string;
  users: Record<string, DbRoomUser>;
  wasAbandoned: boolean;
}) {
  const results = useDbResults(gamePath) ?? {};
  const filteredUsers = Object.keys(results).map((uid) => users[uid]);
  if (!wasAbandoned) {
    filteredUsers.sort((u1, u2) => results[u2.id].score - results[u1.id].score);
  }
  return (
    <table className="GameReview-table">
      <thead>
        <tr>
          <th></th>
          {filteredUsers.map((u) => (
            <th key={u.id}>{u.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {!wasAbandoned && (
          <tr>
            <th>Score</th>
            {filteredUsers.map((u) => (
              <td key={u.id}>{results[u.id].score}</td>
            ))}
          </tr>
        )}
        {game.categories.map((category, i) => (
          <tr key={category}>
            <th>{category}</th>
            {filteredUsers.map((u) => {
              const { response, accepted } = results[u.id].responses[i] ?? {};
              return (
                <td
                  key={u.id}
                  className={!accepted ? "GameReview-rejectedResponse" : ""}
                >
                  {response}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type Results = Record<
  string,
  {
    score: number;
    responses: {
      response: string;
      accepted: boolean;
    }[];
  }
>;
const useDbResults = (gamePath: string) => {
  const [results, setResults] = useState<Results | null>(null);
  useEffect(() => {
    Promise.all([
      get(ref(db, `${gamePath}/responses`)),
      get(ref(db, `${gamePath}/votes`)),
    ]).then(([responsesSnap, votesSnap]) => {
      const resultsByUid: Results = {};
      const allResponses: DbResponses = responsesSnap.val() ?? {};
      const votes: DbVotes = votesSnap.val() ?? [];
      for (const [uid, userResponses] of Object.entries(allResponses)) {
        if (!resultsByUid[uid]) {
          const responses = userResponses.map((response, i) => ({
            response,
            accepted:
              !!response.trim() &&
              Object.values(votes[i]?.[uid] ?? {}).reduce<number>(
                (score, vote) => {
                  switch (vote) {
                    case "downvote":
                      return score - 1;
                    case "upvote":
                      return score + 1;
                    default:
                      return score;
                  }
                },
                0,
              ) >= 0,
          }));
          resultsByUid[uid] = {
            score: responses.reduce(
              (score, { accepted }) => (accepted ? score + 1 : score),
              0,
            ),
            responses,
          };
        }
        setResults(resultsByUid);
      }
    });
  }, [gamePath]);
  return results;
};
