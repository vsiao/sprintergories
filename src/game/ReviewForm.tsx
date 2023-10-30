import { get, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../store/store";

export default function ReviewForm({
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
            <tr key={uid}>
              <td className="Sprintegories-responseCell">
                <input
                  id={category}
                  className="Sprintegories-responseInput"
                  disabled
                  type="text"
                  value={response}
                />
              </td>
            </tr>
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
      const responsesByUid: Record<string, string[]> = snap.val() ?? {};
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
