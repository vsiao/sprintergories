import { createSlice } from "@reduxjs/toolkit";

interface CategoryState {
  categoryName: string;
  responses: Record<
    string,
    {
      response: string;
      votes: Record<string, "upvote" | "downvote">;
    }
  >;
}

interface GameState {
  settings: {
    letter: string;
    numCategories: number;
    timeLimit: number;
  };
  categories: CategoryState[];
}

const initialState: GameState = {
  settings: {
    letter: "A",
    numCategories: 3,
    timeLimit: 30,
  },
  categories: [],
};

export const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    doSomething(state, action) {},
  },
});

export default gameSlice.reducer;
