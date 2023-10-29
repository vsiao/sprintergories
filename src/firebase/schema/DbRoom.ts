export interface DbRoom {
  id: string;
  createdAt: number;
  status: "lobby";
  currentGameId?: string;
  options: DbRoomOptions;
}

export type DbRoomOptions = Record<
  "timeLimit" | "numCategories" | "letterOverride",
  string
>;

export interface DbRoomUser {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  connectedAt: number;
}
