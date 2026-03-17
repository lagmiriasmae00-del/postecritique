import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";

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

const accounts = [
  {
    id: "pdb_dg",
    name: "PDB (DG)",
    segments: [
      { name: "Segment PDB-1", posts: ["Poste PDB-1A", "Poste PDB-1B"] },
      { name: "Segment PDB-2", posts: ["Poste PDB-2A", "Poste PDB-2B"] },
      { name: "Segment PDB-3", posts: ["Poste PDB-3A", "Poste PDB-3B"] }
    ]
  },
  {
    id: "carousel",
    name: "Carousel",
    segments: [
      { name: "Segment CR-1", posts: ["Poste CR-1A", "Poste CR-1B"] },
      { name: "Segment CR-2", posts: ["Poste CR-2A", "Poste CR-2B"] },
      { name: "Segment CR-3", posts: ["Poste CR-3A", "Poste CR-3B"] },
      { name: "Segment CR-4", posts: ["Poste CR-4A", "Poste CR-4B"] },
      { name: "Segment CR-5", posts: ["Poste CR-5A", "Poste CR-5B"] },
      { name: "Segment CR-6", posts: ["Poste CR-6A", "Poste CR-6B"] }
    ]
  },
  {
    id: "lowdash",
    name: "LOWDASH",
    segments: [
      { name: "Segment LD-1", posts: ["Poste LD-1A", "Poste LD-1B"] },
      { name: "Segment LD-2", posts: ["Poste LD-2A", "Poste LD-2B"] },
      { name: "Segment LD-3", posts: ["Poste LD-3A", "Poste LD-3B"] },
      { name: "Segment LD-4", posts: ["Poste LD-4A", "Poste LD-4B"] },
      { name: "Segment LD-5", posts: ["Poste LD-5A", "Poste LD-5B"] }
    ]
  }
];

async function clearData() {
    console.log("Clearing existing data...");
    const collections = ['lignes', 'postes', 'operateurs', 'historique'];
    for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        for (const docSnap of snapshot.docs) {
            await deleteDoc(docSnap.ref);
        }
        console.log(`Cleared collection: ${colName}`);
    }
}

async function seed() {
  await clearData();
  console.log("Starting population...");
  
  for (const account of accounts) {
    console.log(`\nProcessing account: ${account.name}`);
    
    for (const seg of account.segments) {
      // Add Segment (Line)
      const lineRef = await addDoc(collection(db, "lignes"), { 
        nom: seg.name,
        accountId: account.id 
      });
      console.log(`  Added segment: ${seg.name} (ID: ${lineRef.id})`);
      
      for (const postName of seg.posts) {
        // Add Post
        const postRef = await addDoc(collection(db, "postes"), {
          nom: postName,
          ligneId: lineRef.id,
          accountId: account.id,
          critique: true
        });
        console.log(`    Added post: ${postName} (ID: ${postRef.id})`);

        // Add a default operator for each post to see something on the dashboard
        await addDoc(collection(db, "operateurs"), {
            nom: "Doe",
            prenom: postName.split(' ')[1], // Use part of post name as prenom
            posteId: postRef.id,
            ligneId: lineRef.id,
            accountId: account.id,
            polyvalence: true,
            absent: false,
            critique: true
        });
      }
    }
  }
}

seed().then(() => {
  console.log("\nData population complete!");
  process.exit(0);
}).catch(err => {
  console.error("Error populating data:", err);
  process.exit(1);
});
