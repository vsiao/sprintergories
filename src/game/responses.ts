import { DbResponses } from "../firebase/schema/DbGame";
import { singularize } from "../libs/grammar";

/** Convert a raw response to a comparable string to check for duplicates */
const normalizeResponse = (response: string | undefined) => {
  return response?.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').split(" ").map((word) => singularize(word)).join(" ") ?? "";
};

export interface ProcessedResponse {
  response: string;
  isEmpty: boolean;
  isDuplicate: boolean;
}

export const processResponses = (
  responsesByUid: DbResponses,
  category: number,
): Record<string, ProcessedResponse> => {
  const seenResponses = new Set<string>();
  const duplicates = new Set<string>();
  const responses: { uid: string; response: string; normalized: string }[] = [];

  for (const [uid, allResponses] of Object.entries(responsesByUid ?? {})) {
    const response = allResponses[category];
    const normalized = normalizeResponse(response);
    if (normalized) {
      if (seenResponses.has(normalized)) {
        duplicates.add(normalized);
      }
      seenResponses.add(normalized);
    }
    responses.push({ uid, normalized, response: response?.trim() });
  }

  return Object.fromEntries(
    responses.map(({ uid, normalized, response }) => [
      uid,
      {
        response,
        isEmpty: !response,
        isDuplicate: duplicates.has(normalized),
      },
    ]),
  );
};
