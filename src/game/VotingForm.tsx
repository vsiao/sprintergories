import classNames from "classnames";
import { ref, set } from "firebase/database";
import { db } from "../store/store";
import { useDbResponses, useDbVotes } from "../firebase/hooks";
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
  const responseEntries = Object.entries(responses ?? {}).filter(
    ([, { isEmpty }]) => !isEmpty,
  );
  return (
    <table className="Sprintergories-responseTable">
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th>{category}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {responseEntries.length
          ? responseEntries.map(([uid, { response, isDuplicate }]) => (
              <ResponseRow
                key={uid}
                gamePath={gamePath}
                userId={userId}
                index={index}
                responseUid={uid}
                response={response}
                isDuplicate={isDuplicate}
                users={users}
              />
            ))
          : responses && (
              <tr>
                <td></td>
                <td></td>
                <td>No responses</td>
                <td></td>
              </tr>
            )}
      </tbody>
    </table>
  );
}

function ResponseRow({
  gamePath,
  userId,
  index,
  responseUid,
  response,
  isDuplicate,
  users,
}: {
  gamePath: string;
  userId: string;
  index: number;
  responseUid: string;
  response: string;
  isDuplicate: boolean;
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
      <td className={score < 0 ? "VotingForm-negativeScore" : ""}>
        {isDuplicate ? null : score}
      </td>
      <td>
        <span style={{ margin: "0 8px" }}>{users[responseUid].name}</span>
      </td>
      <td className="Sprintergories-responseCell">
        <input
          className={classNames("Sprintergories-responseInput", {
            "Sprintergories-responseInput--rejected": isDuplicate || score < 0,
          })}
          disabled
          type="text"
          value={response}
        />
      </td>
      <td>
        {!isDuplicate && userId !== responseUid && (
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
