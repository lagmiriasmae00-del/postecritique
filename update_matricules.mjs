import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

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

async function updateMatricules() {
    console.log("Fetching operators...");
    const operatorsCol = collection(db, "operateurs");
    const snapshot = await getDocs(operatorsCol);
    
    let updatedCount = 0;
    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const updates = {};
        
        if (!data.matricule) {
            const randomId = Math.floor(1000 + Math.random() * 9000);
            const prefix = data.accountId?.toUpperCase() || "OP";
            updates.matricule = `${prefix}-${randomId}`;
        }

        if (!data.backupFor) {
            updates.backupFor = [];
        }

        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, "operateurs", docSnap.id), updates);
            console.log(`Updated ${data.prenom} ${data.nom} with: ${JSON.stringify(updates)}`);
            updatedCount++;
        }
    }
    console.log(`\nFinished! Updated ${updatedCount} operators.`);
}

updateMatricules().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
