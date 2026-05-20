import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDuRPi8pUtusQgbWVKx8aKTpgRkT4m8mpg",
  authDomain: "wallet-db538.firebaseapp.com",
  projectId: "wallet-db538",
  storageBucket: "wallet-db538.firebasestorage.app",
  messagingSenderId: "622462946699",
  appId: "1:622462946699:web:282bbc84199ba06a9cb38e",
  measurementId: "G-1P8KCQHVKC",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");
