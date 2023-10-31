import { get, onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../store/store";
import { DbResponses } from "../firebase/schema/DbGame";
import { DbRoomUser } from "../firebase/schema/DbRoom";
import "./VotingForm.css";

export default function VotingForm({
  index,
  category,
  gamePath,
  userId,
  users,
}: {
  index: number;
  category: string;
  gamePath: string;
  userId: string;
  users: Record<string, DbRoomUser>;
}) {
  const responses = useDbResponses(gamePath, index, userId);
  return (
    <table className="Sprintegories-responseTable">
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th>{category}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {responses &&
          Object.entries(responses).map(([uid, response]) => (
            <ResponseRow
              key={uid}
              gamePath={gamePath}
              userId={userId}
              index={index}
              responseUid={uid}
              response={response}
              users={users}
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
        filteredResponses[uid] = allResponses[index];
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
  responseUid,
  response,
  users,
}: {
  gamePath: string;
  userId: string;
  index: number;
  responseUid: string;
  response: string;
  users: Record<string, DbRoomUser>;
}) {
  const votesPath = `${gamePath}/votes/${index}/${responseUid}`;
  const votes = useDbVotes(votesPath);
  const userVote = votes?.[userId];
  const score = Object.values(votes ?? {}).reduce((score, vote) => {
    switch (vote) {
      case "upvote":
        return score + 1;
      case "downvote":
        return score - 1;
      default:
        return score;
    }
  }, 0);
  return (
    <tr>
      <td className={score < 0 ? "VotingForm-negativeScore" : ""}>{score}</td>
      <td>
        <span style={{ margin: "0 8px" }}>{users[responseUid].name}</span>
      </td>
      <td className="Sprintegories-responseCell">
        <input
          className="Sprintegories-responseInput"
          disabled
          type="text"
          value={response}
        />
      </td>
      <td>
        {userId !== responseUid && (
          <>
            <button
              onClick={() => {
                if (userVote === "upvote") {
                  set(ref(db, `${votesPath}/${userId}`), null);
                } else {
                  set(ref(db, `${votesPath}/${userId}`), "upvote");
                }
              }}
            >
              {userVote === "upvote" ? "x" : "upvote"}
            </button>
            <button
              onClick={() => {
                if (userVote === "downvote") {
                  set(ref(db, `${votesPath}/${userId}`), null);
                } else {
                  set(ref(db, `${votesPath}/${userId}`), "downvote");
                }
              }}
            >
              {userVote === "downvote" ? "x" : "downvote"}
            </button>
          </>
        )}
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
