import { get, onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../store/store";
import { DbResponses } from "../firebase/schema/DbGame";

export default function VotingForm({
  index,
  category,
  gamePath,
  userId,
}: {
  index: number;
  category: string;
  gamePath: string;
  userId: string;
}) {
  const responses = useDbResponses(gamePath, index, userId);
  return (
    <table className="Sprintegories-responseTable">
      <tbody>
        {responses &&
          Object.entries(responses).map(([uid, response]) => (
            <ResponseRow
              key={uid}
              gamePath={gamePath}
              userId={userId}
              index={index}
              category={category}
              responseUid={uid}
              response={response}
            />
          ))}
      </tbody>
    </table>
  );
}

const useDbResponses = (gamePath: string, index: number, userId: string) => {
  const [responses, setResponses] = useState<Record<string, string> | null>(
    null,
  );
  useEffect(() => {
    const responsesRef = ref(db, `${gamePath}/responses`);
    get(responsesRef).then((snap) => {
      const filteredResponses: Record<string, string> = {};
      const responsesByUid: DbResponses = snap.val() ?? {};
      for (const [uid, allResponses] of Object.entries(responsesByUid ?? {})) {
        if (uid !== userId && allResponses[index]) {
          filteredResponses[uid] = allResponses[index];
        }
      }
      setResponses(filteredResponses);
    });
  }, [gamePath, index, userId]);
  return responses;
};

function ResponseRow({
  gamePath,
  userId,
  index,
  category,
  responseUid,
  response,
}: {
  gamePath: string;
  userId: string;
  index: number;
  category: string;
  responseUid: string;
  response: string;
}) {
  const votesPath = `${gamePath}/votes/${index}/${responseUid}`;
  const votes = useDbVotes(votesPath);
  return (
    <tr>
      <td>
        {Object.values(votes ?? {}).reduce((score, vote) => {
          switch (vote) {
            case "upvote":
              return score + 1;
            case "downvote":
              return score - 1;
            default:
              return score;
          }
        }, 0)}
      </td>
      <td className="Sprintegories-responseCell">
        <input
          id={category}
          className="Sprintegories-responseInput"
          disabled
          type="text"
          value={response}
        />
      </td>
      <td>
        <button
          onClick={() => {
            if (votes?.[userId] === "upvote") {
              set(ref(db, `${votesPath}/${userId}`), null);
            } else {
              set(ref(db, `${votesPath}/${userId}`), "upvote");
            }
          }}
        >
          upvote
        </button>
        <button
          onClick={() => {
            if (votes?.[userId] === "downvote") {
              set(ref(db, `${votesPath}/${userId}`), null);
            } else {
              set(ref(db, `${votesPath}/${userId}`), "downvote");
            }
          }}
        >
          downvote
        </button>
      </td>
    </tr>
  );
}

const useDbVotes = (votesPath: string) => {
  const [votes, setVotes] = useState<Record<
    string,
    "upvote" | "downvote"
  > | null>(null);

  useEffect(() => {
    return onValue(ref(db, votesPath), (snap) => setVotes(snap.val()));
  }, [votesPath]);

  return votes;
};
