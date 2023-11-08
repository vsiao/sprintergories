import { get, ref } from "firebase/database";
import { DbGame, DbResponses, DbVotes } from "../firebase/schema/DbGame";
import { db } from "../store/store";
import { useEffect, useState } from "react";
import { DbRoomUser } from "../firebase/schema/DbRoom";
import { processResponses } from "./responses";
import "./GameReview.css";

import cx from "classnames"

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
  const results = useDbResults(gamePath, game.categories) ?? {};
  const filteredUsers = Object.keys(results).map((uid) => users[uid]);
  if (!wasAbandoned) {
    filteredUsers
      .sort((u1, u2) => results[u2.id].score - results[u1.id].score)
  }

  return (
    <table className="GameReview-table">
      <thead>
        <tr>
          <th className="GameReview-cell GameReview-name" />
          {filteredUsers.map((u) => (
            <th key={u.id} className="GameReview-cell GameReview-name">{u.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {game.categories.map((category, i) => (
          <tr key={category}>
            <th className="GameReview-cell">{category}</th>
            {filteredUsers.map((u) => {
              const { response, accepted } = results[u.id].responses[i] ?? {};
              return (
                <td
                  key={u.id}
                  className={cx(
                    "GameReview-cell", {
                    "GameReview-rejectedResponse": !accepted
                  })
                  }
                >
                  {response}
                </td>
              );
            })}
          </tr>
        ))}
        {!wasAbandoned && (
          <tr>
            <th className="GameReview-cell GameReview-score">Final Score</th>
            {filteredUsers.map((u) => (
              <td className="GameReview-cell GameReview-score" key={u.id}>{results[u.id].score === results[filteredUsers[0]?.id].score ? `${results[u.id].score} 🏆` : `${results[u.id].score}`}</td>
            ))}
          </tr>
        )}
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
const useDbResults = (gamePath: string, categories: string[]) => {
  const [results, setResults] = useState<Results | null>(null);
  useEffect(() => {
    Promise.all([
      get(ref(db, `${gamePath}/responses`)),
      get(ref(db, `${gamePath}/votes`)),
    ]).then(([responsesSnap, votesSnap]) => {
      const resultsByUid: Results = {};
      const allResponses: DbResponses = responsesSnap.val() ?? {};
      const votes: DbVotes = votesSnap.val() ?? [];
      const processedResponses = categories.map((_category, i) =>
        processResponses(allResponses, i),
      );

      for (const uid of Object.keys(allResponses)) {
        const responses = processedResponses.map((responseByUid, i) => {
          const score = Object.values(votes[i]?.[uid] ?? {}).reduce<number>(
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
          );
          const { response, isEmpty, isDuplicate } = responseByUid[uid];
          return {
            response,
            isEmpty,
            isDuplicate,
            score,
            accepted: !isEmpty && !isDuplicate && score >= 0,
          };
        });
        resultsByUid[uid] = {
          score: responses.reduce(
            (prev, { accepted }) => (accepted ? prev + 1 : prev),
            0,
          ),
          responses,
        };
        setResults(resultsByUid);
      }
    });
  }, [gamePath, categories]);
  return results;
};
