import { configureStore } from "@reduxjs/toolkit";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { initializeApp } from "firebase/app";
import { authSlice } from "./authSlice";
import { gameSlice } from "./gameSlice";

const app = initializeApp({
  apiKey: "AIzaSyCaAPFxV10RY8KsB0OKi8jmiU9nks8VFeE",
  authDomain: "sprintergories.firebaseapp.com",
  projectId: "sprintergories",
  storageBucket: "sprintergories.appspot.com",
  messagingSenderId: "502495083860",
  appId: "1:502495083860:web:f1dbb95aa87c4d95b05cc1",
});

export const db = getDatabase(app);

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
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
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
