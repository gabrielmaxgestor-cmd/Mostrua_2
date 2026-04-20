import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    console.log("Testing connection to", config.projectId, config.firestoreDatabaseId);
    const cred = await signInWithEmailAndPassword(auth, "testadmin@example.com", "12345678"); // Assuming a password or just testing if auth works
    console.log("Auth success:", cred.user.uid);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    console.log("Doc exists:", snap.exists());
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}
test();
