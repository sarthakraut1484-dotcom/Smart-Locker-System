# Project Evolution Report: Smart Locker System (v2.1)

This document provides a definitive summary of the project's evolution, technical architecture, and its specialized operational modules.

## 1. Technical Stack (Full Overview)

The system utilizes a decoupled, event-driven architecture to ensure synchronization between physical hardware and cloud interfaces.

### **Frontend & Dashboard (Web)**
- **Framework**: **Next.js 16** (React 19).
- **State Management**: **Zustand** – Synchronizing telemetry across views without refresh.
- **Styling**: **Vanilla CSS / Modern Layouts** – Premium "Clean Tech" aesthetic.
- **Data Visualization**: **Recharts** – Powering the Revenue Trendlines and Intensity Charts.

### **Backend & Services (Cloud)**
- **Platform**: **Firebase (Google Cloud)**.
- **Database**: Realtime Database (Hardware sync) & Firestore (Business logic/pricing).
- **Authentication**: JWT-based secure user sessions.

### **Firmware & Hardware (Locker)**
- **Controller**: **ESP32** (LilyGo T-Display).
- **Language**: **C++ / Arduino**.
- **Security**: `mbedtls` for SHA-256 Chained Hashing.

---

## 2. Admin Panel: Operational Deep Dive

The Admin Dashboard acts as the "Nerve Center," transforming raw hardware signals into actionable business intelligence.

### **A. Real-Time Telemetry & Health Monitoring**
- **Live Fleet Management**: Instant tracking of available vs. occupied units. The dashboard reflects hardware state changes in milliseconds via Firebase listeners.
- **Security Status Heartbeat**: Continuous monitoring of end-to-end encryption and solenoid connectivity across all 20 units.
- **Cycle Intensity Analysis**: Visual breakdown of peak usage periods and average ticket values.

### **B. Remote Hardware Oversight**
- **Emergency Override (Force Open)**: Admins can remotely trigger individual locker solenoids via an authenticated command flag.
- **Live PIN Visibility**: Direct oversight of currently active user PINs and occupancy status.

### **C. Strategic Pricing Engine**
- **Base Matrix Management**: Direct control over 30-min, 1-hour, and 3-hour pricing tiers stored in Firestore.
- **Auto-Dynamic Surge Logic**: An automated system that monitors network occupancy. If demand exceeds a defined threshold (e.g., 90%), a surge multiplier is automatically applied.

---

## 3. Data Integrity & Synchronization (Recent Updates)

### **A. User Identity Resolution (April 23, 2026)**
- **The "N/A" Fix**: Resolved a critical display issue where user names were missing from historical records.
- **Lookup Map Logic**: Implemented a `users` lookup map in `useAdminStore.ts` that performs a real-time join between the `bookings` collection and the `users` profile collection.
- **Cross-Platform Consistency**: Synchronized the fix across both the standalone `admin-dashboard` and the integrated `/admin` route in `main-website`.

### **B. Transaction Metadata Persistence**
- **Booking Flow Update**: Modified `book/confirm/page.tsx` to explicitly save `userName` and `userContact` at the moment of booking, ensuring historical records remain readable.

---

## 4. Blockchain Integrity Layer

The system features a **SHA-256 Chained Hashing Layer** directly within the locker firmware to ensure an immutable audit trail.
- **Tamper-Proof History**: Any attempt to manipulate transaction history is detected by the hardware chain.
- **Genesis Verification**: Every locker initializes with a secure Genesis Hash.

---

## 5. Security & User Privacy

- **RBAC (Role-Based Access Control)**: Separates Customer data from Administrative controls.
- **PIN Hashing**: User PINs are hashed using SHA-256 before transmission.
- **Heartbeat Protocol**: Automatic detection of offline or tampered lockers.

---

## 6. Loyalty & Advanced Features

- **Early Termination Credits**: A sophisticated credit-earning system that rewards users for freeing up lockers ahead of schedule.
- **Session Optimization**: Real-time updates to the web-dashboard whenever a physical session is terminated.

## 7. Hardware Debugging & Reliability (April 2026)

### **A. MOSFET Gate Threshold Voltage Resolution**
- **Issue**: Observed MOSFET overheating and intermittent solenoid triggering.
- **Root Cause**: The gate threshold voltage ($V_{GS(th)}$) was too high for the ESP32's 3.3V logic, causing the MOSFET to operate in the linear region.
- **Fix**: Replaced with a low-$V_{GS(th)}$ logic-level MOSFET and added a 10k pull-down resistor to ensure full saturation and prevent thermal runaway.
- **Inductive Protection**: Integrated a **1N4007 Flyback Diode** in parallel with the solenoid (Anode to MOSFET Drain, Cathode to +12V) to suppress high-voltage spikes generated during switching.

### **B. Startup Security Protocol (Updated April 23, 2026)**
- **Safe-Start Protocol**: Implemented an immediate `LOW` state (0V) on GPIO 26 at the absolute start of the `setup()` function. This is the final software-level safeguard to keep the lock de-energized.
- **Hardware Verification**: If the solenoid remains energized despite this firmware update, it confirms a **Hardware Failure** (e.g., shorted MOSFET or incorrect terminal connection) on the PCB, which cannot be resolved via software.
- **Active-High Reversion**: Re-standardized on **Active-High** logic for all solenoid triggers.






### **C. Cloud Connectivity Optimization**
- **SSL Stability**: Transitioned to `wifiClient.setInsecure()` for Firebase communication to mitigate handshake failures caused by rotating Root CAs.
- **Security Design**: Maintained high security by enforcing SHA-256 hashing for all PIN-based authentication at the application layer.

---

## 8. System Performance & Load Testing (JMeter)

To ensure the backend infrastructure can sustain intensive concurrent operations—such as multiple ESP32 hardware units performing status queries and concurrent user checkouts—we conducted a high-concurrency performance benchmark.

### **A. JMeter Test Plan Specifications**
- **Target Backend Service**: Firebase Realtime Database (RTDB)
- **Target Location**: `asep-smart-locker-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Tested API Endpoint**: `/lockers/1.json` (GET request to monitor real-time state and telemetry metadata of Locker Unit #1)
- **Security Protocol**: HTTPS (Secure Port 443)

### **B. Concurrency Load Profile**
- **Simultaneous Threads (Virtual Users)**: **500 concurrent threads**
- **Ramp-Up Time**: **1 second** (Simulating an instantaneous high-density surge of users/hardware units joining the network simultaneously)
- **Loop Count**: **10 iterations per thread**
- **Total Test Request Volume**: **5,000 requests**
- **Telemetry Listeners**: Integrated *View Results Tree* and *Summary Report* collectors for full throughput, latency distribution, and error rate analysis.

### **C. Strategic Goal**
Verify that Firebase RTDB's event loop and the application's synchronization handlers do not experience socket connection drops, query queuing delays, or request failures when subject to sudden spikes in usage, maintaining robust, sub-second solenoid state synchronization under load.

---

> [!NOTE]
> This ecosystem represents a complete integration of hardware engineering, cloud scalability, and business-focused analytics.
