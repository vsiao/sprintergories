import { configureStore } from "@reduxjs/toolkit";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import "firebase/database";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../config";
import { authSlice } from "./authSlice";
import { gameSlice } from "./gameSlice";
import { roomSlice } from "./roomSlice";

initializeApp(firebaseConfig);

const auth = getAuth();
onAuthStateChanged(auth, user => {
    if (user) {
        store.dispatch(authSlice.actions.setUserId(user.uid));
    } else {
        signInAnonymously(auth);
    }
});

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        game: gameSlice.reducer,
        room: roomSlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
