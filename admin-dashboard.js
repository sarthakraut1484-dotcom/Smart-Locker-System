import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    onSnapshot,
    query,
    where,
    doc,
    updateDoc,
    getDocs,
    orderBy,
    limit,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, update, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

/* ================= AUTH CHECK ================= */
const adminUser = JSON.parse(sessionStorage.getItem("adminUser"));
if (!adminUser) {
    window.location.href = "admin-login.html";
}
document.querySelector(".id-admin-email").textContent = adminUser?.email || "admin@locker.com";

document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("adminUser");
    window.location.href = "admin-login.html";
});

/* ================= NAVIGATION LOGIC ================= */
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".view-section");
const pageTitle = document.getElementById("pageTitle");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");

navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        const target = link.getAttribute("data-target");
        sections.forEach(sec => sec.classList.remove("active"));
        document.getElementById(`view-${target}`).classList.add("active");

        pageTitle.textContent = link.textContent.trim();
        if (window.innerWidth <= 991) {
            sidebar.classList.remove("open");
        }

        if (target === 'analytics') initCharts();
    });
});

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

/* ================= GLOBAL STATE ================= */
let allLockers = [];

/* ================= DASHBOARD & LOCKERS ================= */
const lockersRef = collection(db, "lockers");

onSnapshot(lockersRef, (snapshot) => {
    const TOTAL_LOCKERS = 20;
    const lockerMap = new Map();

    // Pre-fill 20 lockers
    for (let i = 1; i <= TOTAL_LOCKERS; i++) {
        lockerMap.set(i.toString(), {
            id: i.toString(),
            status: "AVAILABLE"
        });
    }

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id.replace("locker_", "");
        const status = data.status || "AVAILABLE";

        lockerMap.set(id, {
            id,
            ...data,
            status
        });
    });

    allLockers = Array.from(lockerMap.values());
    allLockers.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    let available = 0, occupied = 0, maintenance = 0;
    allLockers.forEach(l => {
        if (l.status === "AVAILABLE") available++;
        else if (l.status === "ACTIVE") occupied++;
        else if (l.status === "MAINTENANCE") maintenance++;
    });

    // Update Stats
    document.getElementById("stat-total").textContent = allLockers.length;
    document.getElementById("stat-available").textContent = available;
    document.getElementById("stat-occupied").textContent = occupied;
    document.getElementById("stat-maintenance").textContent = maintenance;

    // Dynamically update the pie chart if it exists
    if (window.myStatusChart) {
        window.myStatusChart.data.datasets[0].data = [available, occupied, maintenance];
        window.myStatusChart.update();
    }

    renderLockersGrid("ALL");
    renderActiveSessions();
    updateDashboardActiveSessions();
});

function renderLockersGrid(filterStatus) {
    const container = document.getElementById("lockers-grid-container");
    if (!container) return;

    container.innerHTML = "";
    let filtered = allLockers;

    if (filterStatus === "AVAILABLE") filtered = allLockers.filter(l => l.status === "AVAILABLE");
    else if (filterStatus === "OCCUPIED") filtered = allLockers.filter(l => l.status === "ACTIVE");
    else if (filterStatus === "MAINTENANCE") filtered = allLockers.filter(l => l.status === "MAINTENANCE");

    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-12 text-center text-muted py-5">No lockers found in this status.</div>`;
        return;
    }

    filtered.forEach(locker => {
        const isOccupied = locker.status === "ACTIVE";
        const isMaint = locker.status === "MAINTENANCE";

        let badgeClass = "status-available";
        if (isOccupied) badgeClass = "status-occupied";
        if (isMaint) badgeClass = "status-maintenance";

        let timeRemaining = "--";
        if (isOccupied && locker.sessionEnd) {
            const remainingMs = locker.sessionEnd - Date.now();
            if (remainingMs > 0) {
                timeRemaining = Math.max(1, Math.floor(remainingMs / 60000)) + " mins";
            } else {
                timeRemaining = "Expired";
            }
        }

        const card = document.createElement("div");
        card.className = "locker-card";
        card.innerHTML = `
      <div class="locker-card-header">
        <div class="locker-id">Locker ${locker.id}</div>
        <div class="status-badge ${badgeClass}">${locker.status}</div>
      </div>
      <div class="locker-details">
        <div class="detail-row">
          <span>Door:</span>
          <span class="val" id="door-status-${locker.id}">Syncing...</span>
        </div>
        <div class="detail-row">
          <span>Occupancy:</span>
          <span class="val" id="occ-status-${locker.id}">Syncing...</span>
        </div>
        ${isOccupied ? `
          <div class="detail-row">
            <span>Time Left:</span>
            <span class="val ${timeRemaining === 'Expired' ? 'text-danger' : ''}">${timeRemaining}</span>
          </div>
          <div class="detail-row">
            <span>User ID:</span>
            <span class="val text-truncate" style="max-width:120px;" title="${locker.userId}">${locker.userId || 'Unknown'}</span>
          </div>
        ` : ''}
      </div>
      <div class="locker-actions">
        <button class="btn-action btn-open" onclick="sendAction('${locker.id}', 'OPEN')"><i class="bi bi-unlock"></i> Open</button>
        <button class="btn-action btn-lock" onclick="sendAction('${locker.id}', 'LOCK')"><i class="bi bi-lock"></i> Lock</button>
        ${isOccupied ? `<button class="btn-action btn-maint text-white bg-danger bg-opacity-75" onclick="sendAction('${locker.id}', 'END_SESSION')"><i class="bi bi-stop-circle"></i> End</button>` : ''}
        ${!isOccupied && !isMaint ? `<button class="btn-action btn-maint" onclick="sendAction('${locker.id}', 'MAINTENANCE')"><i class="bi bi-tools"></i> Maint</button>` : ''}
        ${isMaint ? `<button class="btn-action bg-success bg-opacity-25 text-success" onclick="sendAction('${locker.id}', 'AVAILABLE')"><i class="bi bi-check-circle"></i> Fix</button>` : ''}
      </div>
    `;
        container.appendChild(card);

        // Track RTDB Hardware statuses (door & ultrasonic sensors)
        const doorRef = ref(rtdb, `lockers/${locker.id}/doorOpen`);
        onValue(doorRef, (snap) => {
            const isOpen = snap.val();
            const el = document.getElementById(`door-status-${locker.id}`);
            if (el) {
                el.textContent = isOpen ? "OPEN" : "CLOSED";
                el.className = isOpen ? "val text-warning fw-bold" : "val text-success";
                // Add Orange Door Open Alert
                if (isOpen) {
                    card.style.borderColor = "#f97316"; // Tailwind orange-500
                    card.style.boxShadow = "0 0 10px rgba(249, 115, 22, 0.5)";
                } else {
                    card.style.borderColor = "";
                    card.style.boxShadow = "";
                }
            }
        });

        const occRef = ref(rtdb, `lockers/${locker.id}/itemInside`);
        onValue(occRef, (snap) => {
            const inside = snap.val();
            const el = document.getElementById(`occ-status-${locker.id}`);
            if (el) {
                el.textContent = inside ? "ITEM PRESENT" : "EMPTY";
            }
        });
    });
}

window.filterLockers = function (status) {
    renderLockersGrid(status);
};

window.sendAction = async function (id, action) {
    if (!confirm(`Are you sure you want to ${action} Locker ${id}?`)) return;

    try {
        const fsRef = doc(db, "lockers", `locker_${id}`);
        const rtRef = ref(rtdb, `lockers/${id}`);

        if (action === "OPEN") {
            await update(rtRef, { command: "OPEN" });
        } else if (action === "LOCK") {
            await update(rtRef, { command: "LOCK" });
        } else if (action === "END_SESSION" || action === "AVAILABLE") {
            await updateDoc(fsRef, { status: "AVAILABLE", sessionEnd: null, currentPin: null, userId: null });
            await update(rtRef, { status: "AVAILABLE", sessionEnd: 0, pin: null });
        } else if (action === "MAINTENANCE") {
            await updateDoc(fsRef, { status: "MAINTENANCE" });
            await update(rtRef, { status: "MAINTENANCE" });
        }

        console.log(`Command ${action} sent to Locker ${id} successfully.`);
    } catch (e) {
        alert("Action failed: " + e.message);
    }
};

window.masterResetLockers = async function () {
    if (!confirm("WARNING: This will end ALL active sessions and reset all lockers to AVAILABLE. Proceed?")) return;

    try {
        const batch = writeBatch(db);
        const updatesRtdb = {};

        allLockers.forEach(l => {
            const refFs = doc(db, "lockers", `locker_${l.id}`);
            batch.update(refFs, { status: "AVAILABLE", sessionEnd: null, currentPin: null, userId: null });
            updatesRtdb[`lockers/${l.id}/status`] = "AVAILABLE";
            updatesRtdb[`lockers/${l.id}/pin`] = null;
            updatesRtdb[`lockers/${l.id}/sessionEnd`] = 0;
        });

        await batch.commit();
        await update(ref(rtdb), updatesRtdb);
        alert("Master Reset Successful!");
    } catch (e) {
        alert("Reset failed: " + e.message);
    }
};


/* ================= ACTIVE SESSIONS ================= */
function renderActiveSessions() {
    const tbody = document.querySelector("#active-sessions-table tbody");
    if (!tbody) return;

    const activeLocks = allLockers.filter(l => l.status === "ACTIVE");
    tbody.innerHTML = "";

    if (activeLocks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No active sessions</td></tr>`;
        return;
    }

    activeLocks.forEach(l => {
        let timeLeft = "Not Started";
        if (l.sessionEnd) {
            const remainingMs = l.sessionEnd - Date.now();
            if (remainingMs > 0) {
                const hrs = Math.floor(remainingMs / 3600000);
                const mins = Math.floor((remainingMs % 3600000) / 60000);
                timeLeft = `${hrs}h ${mins}m`;
            } else {
                timeLeft = "<span class='text-danger'>Expired</span>";
            }
        }

        const startStr = l.startTime ? new Date(l.startTime).toLocaleString() : "Syncing...";
        const endStr = l.sessionEnd ? new Date(l.sessionEnd).toLocaleString() : "Unknown";

        // Display human-readable contact if available
        const userContactDisplay = l.userContact || l.userId || "Unknown";

        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>Locker ${l.id}</td>
      <td class="text-truncate" style="max-width:150px;" title="${userContactDisplay}">${userContactDisplay}</td>
      <td>${l.currentPin || "****"}</td>
      <td>${startStr}</td>
      <td>${endStr}</td>
      <td>${timeLeft}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="window.sendAction('${l.id}', 'OPEN')" title="Open Remotely"><i class="bi bi-unlock"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="window.sendAction('${l.id}', 'END_SESSION')" title="End Session"><i class="bi bi-stop-circle"></i></button>
      </td>
    `;
        tbody.appendChild(tr);
    });
}

function updateDashboardActiveSessions() {
    const tbody = document.querySelector("#dashboard-sessions-table tbody");
    if (!tbody) return;

    const activeLocks = allLockers.filter(l => l.status === "ACTIVE").slice(0, 5);
    tbody.innerHTML = "";

    if (activeLocks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No active sessions</td></tr>`;
        return;
    }

    activeLocks.forEach(l => {
        const startStr = l.startTime ? new Date(l.startTime).toLocaleTimeString() : "--";
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>Locker ${l.id}</td>
      <td class="text-truncate" style="max-width:100px;">${l.userId || "User"}</td>
      <td>${startStr}</td>
      <td><span class="badge bg-success bg-opacity-25 text-success">Active</span></td>
    `;
        tbody.appendChild(tr);
    });
}

/* ================= ALERTS & HISTORY (Dummy Data for Demo) ================= */
// If there is an alerts collection, we can read it. For now, simulate.
function initAlertsAndHistory() {
    // Alerts
    const alertsTbody = document.querySelector("#alerts-table tbody");
    const dashAlerts = document.getElementById("dashboard-alerts-list");

    const alertsData = []; // Removed dummy alerts for now

    if (alertsData.length > 0) {
        if (dashAlerts) {
            dashAlerts.innerHTML = alertsData.map(a => `
        <div class="mb-3 p-3 bg-dark border border-secondary rounded">
          <div class="d-flex justify-content-between mb-1">
            <strong class="${a.type === 'WARNING' ? 'text-warning' : 'text-danger'}">${a.type}</strong>
            <small class="text-muted">${a.time.toLocaleTimeString()}</small>
          </div>
          <div class="fs-6">Locker ${a.locker}: ${a.msg}</div>
        </div>
      `).join("");
        }

        if (alertsTbody) {
            alertsTbody.innerHTML = alertsData.map(a => `
        <tr>
          <td>${a.time.toLocaleString()}</td>
          <td><span class="badge ${a.type === 'WARNING' ? 'bg-warning' : 'bg-danger'}">${a.type}</span></td>
          <td>Locker ${a.locker}</td>
          <td>${a.msg}</td>
          <td><span class="text-danger">${a.status}</span></td>
          <td><button class="btn btn-sm btn-outline-secondary">Dismiss</button></td>
        </tr>
      `).join("");
        }
    } else {
        // Show empty state
        if (dashAlerts) dashAlerts.innerHTML = '<p class="text-muted text-center mt-5">No active alerts</p>';
        if (alertsTbody) alertsTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No active alerts</td></tr>';
    }

    const alertsCount = document.getElementById("alertsCount");
    if (alertsCount) alertsCount.textContent = alertsData.length.toString();

    // History - query from bookings if it exists.
    const historyTbody = document.getElementById("history-tbody-list");
    if (historyTbody) {
        const bookingsRef = collection(db, "bookings");
        // Use 'createdAt' based on how booking.html saves it
        onSnapshot(query(bookingsRef, orderBy("createdAt", "desc"), limit(20)), (snap) => {
            historyTbody.innerHTML = "";
            if (snap.empty) {
                historyTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No history found</td></tr>`;
                return;
            }
            snap.forEach(docSnap => {
                const data = docSnap.data();
                // Check either createdAt or fallback to timestamp
                const timeVal = data.createdAt || data.timestamp || Date.now();
                const dateStr = new Date(timeVal).toLocaleString();

                // Favor the human-readable userContact if it exists (email/phone), else fallback to UID
                const displayUser = data.userContact || data.userId || "Guest";

                const tr = document.createElement("tr");
                tr.innerHTML = `
                  <td>${dateStr}</td>
                  <td><b>Locker ${data.lockerId || '-'}</b></td>
                  <td class="text-truncate" style="max-width:200px;" title="${displayUser}">${displayUser}</td>
                  <td>${data.duration ? (data.duration / 3600000).toFixed(1) : (data.hours || '--')}</td>
                  <td><span class="text-success fw-bold">₹${data.amount || '0'}</span></td>
                  <td><span class="badge bg-secondary">${data.status || 'CONFIRMED'}</span></td>
                `;
                historyTbody.appendChild(tr);
            });
        });
    }
}

window.fetchHistory = function () {
    console.log("Applying filters to history... (UI update demo)");
};

initAlertsAndHistory();

/* ================= ANALYTICS ================= */
let chartsInit = false;
function initCharts() {
    if (chartsInit) return;
    chartsInit = true;

    // Chart defaults for dark theme
    Chart.defaults.color = '#8b949e';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';

    // Usage Chart
    const usageCanvas = document.getElementById('usageChart');
    if (usageCanvas) {
        new Chart(usageCanvas, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Bookings',
                    data: [12, 19, 15, 25, 32, 45, 38],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Status Chart
    const statusCanvas = document.getElementById('statusChart');
    if (statusCanvas) {
        window.myStatusChart = new Chart(statusCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Available', 'Occupied', 'Maintenance'],
                datasets: [{
                    data: [
                        parseInt(document.getElementById("stat-available").textContent) || 0,
                        parseInt(document.getElementById("stat-occupied").textContent) || 0,
                        parseInt(document.getElementById("stat-maintenance").textContent) || 0
                    ],
                    backgroundColor: ['#2ea043', '#da3633', '#e3b341'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%' }
        });
    }

    // Peak Hours
    const peakCanvas = document.getElementById('peakChart');
    if (peakCanvas) {
        new Chart(peakCanvas, {
            type: 'bar',
            data: {
                labels: ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'],
                datasets: [{
                    label: 'Active Sessions',
                    data: [5, 12, 20, 15, 25, 30, 18],
                    backgroundColor: '#38bdf8',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}
