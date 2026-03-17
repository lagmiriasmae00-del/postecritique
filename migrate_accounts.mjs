import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyANoo7ZFB2lZ7iivTxg1KqM61uNL9nA1KY",
    authDomain: "watchapp-37f12.firebaseapp.com",
    projectId: "watchapp-37f12",
    storageBucket: "watchapp-37f12.firebasestorage.app",
    messagingSenderId: "444768482846",
    appId: "1:444768482846:web:420ed9ed0f38543fb1600f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateCarouselToPDB() {
    console.log("Starting migration: Carousel -> PDB");
    
    // Migrate Operators
    const operatorsCol = collection(db, "operateurs");
    const qOps = query(operatorsCol, where("accountId", "==", "carousel"));
    const opsSnapshot = await getDocs(qOps);
    
    console.log(`Found ${opsSnapshot.size} operators in Carousel account.`);
    
    for (const docSnap of opsSnapshot.docs) {
        await updateDoc(doc(db, "operateurs", docSnap.id), {
            accountId: "pdb_dg"
        });
        console.log(`Migrated operator: ${docSnap.id}`);
    }

    // Migrate Posts (if any have accountId)
    const postesCol = collection(db, "postes");
    const qPostes = query(postesCol, where("accountId", "==", "carousel"));
    const postesSnapshot = await getDocs(qPostes);
    
    console.log(`Found ${postesSnapshot.size} posts in Carousel account.`);
    for (const docSnap of postesSnapshot.docs) {
        await updateDoc(doc(db, "postes", docSnap.id), {
            accountId: "pdb_dg"
        });
        console.log(`Migrated post: ${docSnap.id}`);
    }

    // Migrate Lignes
    const lignesCol = collection(db, "lignes");
    const qLignes = query(lignesCol, where("accountId", "==", "carousel"));
    const lignesSnapshot = await getDocs(qLignes);
    
    console.log(`Found ${lignesSnapshot.size} lines in Carousel account.`);
    for (const docSnap of lignesSnapshot.docs) {
        await updateDoc(doc(db, "lignes", docSnap.id), {
            accountId: "pdb_dg"
        });
        console.log(`Migrated line: ${docSnap.id}`);
    }

    // Migrate History
    const historyCol = collection(db, "historique");
    const qHistory = query(historyCol, where("accountId", "==", "carousel"));
    const historySnapshot = await getDocs(qHistory);
    
    console.log(`Found ${historySnapshot.size} history entries in Carousel account.`);
    for (const docSnap of historySnapshot.docs) {
        await updateDoc(doc(db, "historique", docSnap.id), {
            accountId: "pdb_dg"
        });
    }

    console.log("\nMigration complete!");
}

migrateCarouselToPDB().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
