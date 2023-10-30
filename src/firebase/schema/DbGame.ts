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

export interface DbGameUser {
  responses: Record<string, string[]>;
  votes: Record<string, ("upvote" | "downvote")[]>;
}
