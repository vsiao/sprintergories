export interface DbGame {
  roomId: string;
  startedAt: number;
  options: {
    timeLimitMs: number;
    letter: string;
  };
  categories: string[];
  status: DbGameStatus;
}

export type DbGameStatus =
  | { kind: "inProgress" }
  | { kind: "voting"; category: number }
  | { kind: "complete" }
  | { kind: "abandoned" };

/** userId -> response[] */
export type DbResponses = Record<string, string[]>;

/** (responseUid -> userId -> "upvote" | "downvote")[] */
export type DbVotes = Record<string, Record<string, "upvote" | "downvote">>[];
