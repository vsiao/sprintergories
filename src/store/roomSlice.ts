import { createSlice } from "@reduxjs/toolkit";

interface RoomState {
    roomId: string;
    users: {};
}

const initialState: RoomState = {
    roomId: null!,
    users: {},
};

export const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {
        doSomething(state, action) {

        },
    },
});

export default roomSlice.reducer;
