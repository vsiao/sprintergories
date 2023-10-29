export interface DbGame {
  roomId: string;
  startedAt: number;
  options: {
    timeLimit: number;
    letter: string;
  };
  categories: string[];
  responses: Record<string, string[]>;
  votes: Record<string, ("upvote" | "downvote")[]>;
}
