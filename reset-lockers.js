
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* ================= FIREBASE INIT ================= */
const firebaseConfig = {
  apiKey: "AIzaSyAE2ZzUsZPKArWnniCpWT2AX5jDpNJMqX0",
  authDomain: "asep-smart-locker.firebaseapp.com",
  databaseURL: "https://asep-smart-locker-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "asep-smart-locker",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

async function resetLockers() {
  const batch = writeBatch(db);
  const lockersRef = collection(db, "lockers");

  try {
    console.log("Fetching lockers...");
    const snapshot = await getDocs(lockersRef);
    console.log(`Found ${snapshot.size} lockers.`);

    snapshot.forEach((docSnap) => {
      const lockerRef = doc(db, "lockers", docSnap.id);
      batch.update(lockerRef, {
        status: "AVAILABLE",
        sessionEnd: 0,
        currentPin: null,
        userId: null,
        lastUpdated: Date.now()
      });
    });

    // Loop for 20 lockers to ensure even missing documents are reset/created if needed
    // (Optional: if we assume all 20 docs exist, the above loop is enough. 
    // But to be safe for RTDB which might be sparse:)

    const rtdbUpdates = {};
    for (let i = 1; i <= 20; i++) {
      rtdbUpdates[`lockers/${i}/status`] = "AVAILABLE";
      rtdbUpdates[`lockers/${i}/pin`] = null;
      rtdbUpdates[`lockers/${i}/sessionEnd`] = 0;
    }
    await update(ref(rtdb), rtdbUpdates);

    await batch.commit();
    console.log("✅ All lockers reset to AVAILABLE in Firestore and Realtime Database.");
    alert("All Lockers Reset Successfully!");

  } catch (error) {
    console.error("Error resetting lockers:", error);
    alert("Error: " + error.message);
  }
}

// Auto-run on load
resetLockers();
