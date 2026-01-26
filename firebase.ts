
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCAWkK2-2FEKVF5kNniHWycAh-YsSyGKbI",
  authDomain: "prime-drinking.firebaseapp.com",
  databaseURL: "https://prime-drinking-default-rtdb.firebaseio.com",
  projectId: "prime-drinking",
  storageBucket: "prime-drinking.firebasestorage.app",
  messagingSenderId: "994405908900",
  appId: "1:994405908900:web:96a2ef1e339449f3578131",
  measurementId: "G-55JHFFN54E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
