import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCVPtGXdp_M4l8dC_l_Q6TssVnLy398u2U",
  authDomain: "cesarperso-3460e.firebaseapp.com",
  databaseURL: "https://cesarperso-3460e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cesarperso-3460e",
  storageBucket: "cesarperso-3460e.firebasestorage.app",
  messagingSenderId: "342192567043",
  appId: "1:342192567043:web:36f3248801c478c62faf36"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
