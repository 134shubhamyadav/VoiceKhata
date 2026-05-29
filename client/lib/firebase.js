import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyArhae7qbw9MfACQHjd9iWHYck0apiIwxI",
  authDomain: "voicekhata-b6152.firebaseapp.com",
  projectId: "voicekhata-b6152",
  storageBucket: "voicekhata-b6152.firebasestorage.app",
  messagingSenderId: "892438447315",
  appId: "1:892438447315:web:4f60a29567dbb9d47b8026",
  measurementId: "G-THRCTSGE8X"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;