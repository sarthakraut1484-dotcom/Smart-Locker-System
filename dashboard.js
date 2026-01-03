/* ================= FIREBASE IMPORTS ================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* ================= FIREBASE INIT ================= */

const firebaseConfig = {
  apiKey: "AIzaSyAE2ZzUsZPKArWnniCpWT2AX5jDpNJMqX0",
  authDomain: "asep-smart-locker.firebaseapp.com",
  projectId: "asep-smart-locker",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

/* ================= SESSION CHECK ================= */

const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  window.location.href = "login.html";
}

/* ================= AUTO EXPIRE LOCKERS ================= */

async function autoExpireLockers() {
  const now = Date.now();
  const snapshot = await getDocs(collection(db, "lockers"));

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    let sessionEnd = data.sessionEnd;
    if (!sessionEnd && data.startTime && data.duration) {
      sessionEnd = data.startTime + data.duration;
    }

    if (
      data.status === "ACTIVE" &&
      sessionEnd &&
      sessionEnd <= now
    ) {
      console.log(`Expiring locker ${docSnap.id}...`);

      // 1. Update Firestore
      await updateDoc(doc(db, "lockers", docSnap.id), {
        status: "AVAILABLE",
        userId: null,
        sessionEnd: null,
        currentPin: null
      });

      // 2. Update Realtime Database (Hardware Sync)
      try {
        const lockerIdNumeric = docSnap.id.replace("locker_", "");
        const rtdbRef = ref(rtdb, `lockers/${lockerIdNumeric}`);
        await update(rtdbRef, {
          status: "AVAILABLE",
          pin: null,
          sessionEnd: 0
        });
        console.log(`✅ Locker ${lockerIdNumeric} expired and synced to RTDB.`);
      } catch (err) {
        console.error("Failed to sync expiry to RTDB:", err);
      }
    }
  }
}

// 🔥 RUN ON LOAD
autoExpireLockers();

// 🔥 RUN EVERY 15 SECONDS (THIS WAS MISSING)
setInterval(autoExpireLockers, 15000);

/* ================= DASHBOARD COUNTERS ================= */

const availableEl = document.getElementById("availableLockers");
const activeEl = document.getElementById("activeBookings");

/* 🔥 REAL-TIME LISTENER */
onSnapshot(collection(db, "lockers"), (snapshot) => {
  const TOTAL_LOCKERS = 20;
  let activeTotal = 0;
  let activeUserBookings = 0;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    if (data.status === "ACTIVE") {
      activeTotal++;
    }

    if (data.status === "ACTIVE" && data.userId === currentUser.uid) {
      activeUserBookings++;
    }
  });

  const available = TOTAL_LOCKERS - activeTotal;

  if (availableEl) availableEl.textContent = available > 0 ? available : 0;
  if (activeEl) activeEl.textContent = activeUserBookings;
});

/* ================= TOTAL AMOUNT SPENT ================= */

const totalSpentEl = document.getElementById("totalSpent");

const totalQuery = query(
  collection(db, "bookings"),
  where("userId", "==", currentUser.uid)
);

onSnapshot(totalQuery, (snapshot) => {
  let total = 0;

  snapshot.forEach(docSnap => {
    total += docSnap.data().amount || 0;
  });

  if (totalSpentEl) {
    totalSpentEl.textContent = `₹${total}`;
  }
});

/* ================= ACTIVE LOCKER DETAILS ================= */

const activeBoxContainer = document.getElementById("activeBoxContainer");

onSnapshot(collection(db, "lockers"), (snapshot) => {
  const activeLockers = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const isMyActiveBooking = (
      data.status === "ACTIVE" &&
      data.userId === currentUser.uid
    );

    if (isMyActiveBooking) {
      let sessionEnd = data.sessionEnd;
      if (!sessionEnd && data.startTime && data.duration) {
        sessionEnd = data.startTime + data.duration;
      }

      // If it hasn't expired yet (or hasn't started), show it
      if (!sessionEnd || sessionEnd > Date.now()) {
        activeLockers.push({
          lockerId: docSnap.id.replace("locker_", ""),
          sessionEnd: sessionEnd || 0 // 0 means "Not Started"
        });
      }
    }
  });

  if (activeLockers.length === 0) {
    activeBoxContainer.innerHTML = `
      <div class="empty-state">
        <h3>No Active Locker</h3>
        <p>You currently do not have any active locker bookings.</p>
      </div>
    `;
    return;
  }

  activeBoxContainer.innerHTML = activeLockers.map((b, i) => `
    <div class="active-box">
      <div class="box-left">
        <div class="active-box-title">Locker #${b.lockerId}</div>
        <div class="active-box-details">
          Active Session<br>
          Ends at: <strong>${new Date(b.sessionEnd).toLocaleTimeString()}</strong>
        </div>
      </div>
      <div class="box-right">
        <button class="unlock-btn" data-index="${i}">View / Unlock</button>
      </div>
    </div>
  `).join("");

  const unlockBtns = activeBoxContainer.querySelectorAll(".unlock-btn");
  unlockBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = e.target.getAttribute("data-index");
      const booking = activeLockers[index];

      const selectedLocker = {
        locker: booking.lockerId,
        id: booking.lockerId,
        sessionEnd: booking.sessionEnd
      };

      sessionStorage.setItem("selectedLocker", JSON.stringify(selectedLocker));
      window.location.href = "unlock.html";
    });
  });

  if (!document.getElementById("dynamic-unlock-css")) {
    const style = document.createElement("style");
    style.id = "dynamic-unlock-css";
    style.textContent = `
      .unlock-btn {
        background: #6366f1;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
      }
      .unlock-btn:hover {
        background: #4f46e5;
      }
    `;
    document.head.appendChild(style);
  }
});
