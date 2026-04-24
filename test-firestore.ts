import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyCbeCsr7BqdlrHpO_PblYx9Xw6l01dF91Q",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0464376280.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0464376280",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0464376280.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-bc0439a8-b0a1-4f9f-8819-58446dbe7a78");

async function main() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "gabrielmaxgestor@gmail.com", "123456");
    console.log("Logged in:", cred.user.uid);
    const ref = doc(db, "resellers", cred.user.uid);
    const snap = await getDoc(ref);
    console.log("Reseller data:", snap.data());
    
    // try to update
    try {
      await updateDoc(ref, {
        "settings.primaryColor": "#ff0000"
      });
      console.log("update doc successful (dot notation)");
    } catch(e) {
      console.error("error updating (dot notation):", e);
    }

    try {
      await updateDoc(ref, {
        settings: {
          ...snap.data()?.settings,
          primaryColor: "#00ff00"
        }
      });
      console.log("update doc successful (object override)");
    } catch(e) {
      console.error("error updating (object override):", e);
    }
    
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

main();
