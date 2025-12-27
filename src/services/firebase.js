import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDCiT_WhSm9wTiOuIniW0jFxO1bROepv3Y",
  authDomain: "academy-of-curiosity.firebaseapp.com",
  projectId: "academy-of-curiosity",
  storageBucket: "academy-of-curiosity.firebasestorage.app",
  messagingSenderId: "710632620518",
  appId: "1:710632620518:web:4e0b9b9cd9c0a4306a5627",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
