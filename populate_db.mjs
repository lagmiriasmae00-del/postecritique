import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyANoo7ZFB2lZ7iivTxg1KqM61uNL9nA1KY",
    authDomain: "watchapp-37f12.firebaseapp.com",
    projectId: "watchapp-37f12",
    storageBucket: "watchapp-37f12.firebasestorage.app",
    messagingSenderId: "444768482846",
    appId: "1:444768482846:web:420ed9ed0f38543fb1600f",
    measurementId: "G-MFV592E5BH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const data = [
  { line: "Ligne A", posts: ["Poste A-01", "Poste A-02", "Poste A-03"] },
  { line: "Ligne B", posts: ["Poste B-01", "Poste B-02", "Poste B-03"] },
  { line: "Ligne C", posts: ["Poste C-01", "Poste C-02", "Poste C-03"] }
];

async function populate() {
  console.log("Starting population...");
  for (const item of data) {
    const lineRef = await addDoc(collection(db, "lignes"), { nom: item.line });
    console.log(`Added line: ${item.line} (ID: ${lineRef.id})`);
    for (const postName of item.posts) {
      const postRef = await addDoc(collection(db, "postes"), {
        nom: postName,
        ligneId: lineRef.id,
        critique: true
      });
      console.log(`  Added post: ${postName} (ID: ${postRef.id})`);
    }
  }
}

populate().then(() => {
  console.log("Data population complete!");
  process.exit(0);
}).catch(err => {
  console.error("Error populating data:", err);
  process.exit(1);
});
