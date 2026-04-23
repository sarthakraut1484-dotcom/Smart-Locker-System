import { create } from 'zustand';
import { db, rtdb } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { ref, onValue, update } from 'firebase/database';

export type LockerStatus = 'AVAILABLE' | 'ACTIVE' | 'OCCUPIED' | 'MAINTENANCE' | 'CONFIRMED';

export interface LockerData {
  id: string;
  status: LockerStatus;
  doorStatus: 'OPEN' | 'CLOSED';
  occupancy: 'EMPTY' | 'OCCUPIED';
  currentPin: string;
  userName: string;
  startTime: number | null;
  duration: number;
  unlockCount: number;
  sessionEnd?: number;
  firestoreStatus?: boolean;
  lastUpdated?: number;
}

export interface Booking {
  id: string;
  lockerId: string;
  userId: string;
  userName: string;
  userContact?: string;
  amount: number;
  hours: number;
  duration?: number;
  pin?: string;
  createdAt: number;       // stored as Date.now() number in booking.html
  startTime: number | null;
  status: 'ACTIVE' | 'CONFIRMED' | 'COMPLETED' | 'EXPIRED';
}

interface AdminState {
  lockers: Record<string, LockerData>;
  bookings: Booking[];
  alerts: any[];
  maintenanceLogs: any[];
  adminLogs: any[];
  pulse: boolean;
  isInitializing: boolean;
  users: Record<string, { name: string; email: string }>;
  initialized: boolean;

  initSync: (force?: boolean) => void;
  triggerPulse: () => void;
  setError: (err: string | null) => void;
  endSession: (lockerId: string) => Promise<void>;
  overrideStart: (lockerId: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveMaintenance: (logId: string) => Promise<void>;
  forceOpenLocker: (lockerId: string) => Promise<void>;
  logAdminAction: (action: string, target: string, severity?: string) => Promise<void>;
  showModal: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info', onConfirm?: () => void, confirmLabel?: string) => void;
  closeModal: () => void;
  modal: {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
    confirmLabel?: string;
  };
}

export const useAdminStore = create<AdminState>((set, get) => ({
  lockers: {},
  bookings: [],
  alerts: [],
  maintenanceLogs: [],
  adminLogs: [],
  pulse: false,
  isInitializing: true,
  error: null,
  users: {},
  initialized: false,
  modal: {
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  },

  showModal: (title, message, type = "info", onConfirm, confirmLabel) => set({ 
    modal: { isOpen: true, title, message, type, onConfirm, confirmLabel } 
  }),
  
  closeModal: () => set((state) => ({ 
    modal: { ...state.modal, isOpen: false, onConfirm: undefined } 
  })),

  logAdminAction: async (action, target, severity = "SUCCESS") => {
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(collection(db, 'admin_logs'), {
        action,
        target,
        timestamp: Date.now(),
        status: severity,
        by: 'Master-Gateway'
      });
    } catch (err) { console.error('Logging failed:', err); }
  },

  forceOpenLocker: async (lockerId: string) => {
    const numericId = lockerId.replace('locker_', '');
    try {
      // 1. Dispatch Hardware Command
      await update(ref(rtdb, numericId), {
        status: 'OVERRIDE_OPEN',
        lastUpdated: Date.now()
      });
      
      // 2. Audit Trail
      get().logAdminAction('Remote Force Open', `Locker #${numericId}`, 'SUCCESS');
      
      // 3. Reset hardware back to its state after short delay (let solenoid fire)
      setTimeout(async () => {
         await update(ref(rtdb, numericId), { status: get().lockers[numericId]?.status || 'AVAILABLE' });
      }, 2000);
      
      console.info(`[Admin] Force Open sent to ${numericId}`);
    } catch (err: any) {
      console.error('[Admin] Force Open failed:', err.message);
      throw err;
    }
  },

  acknowledgeAlert: async (id: string) => {
    try {
      await updateDoc(doc(db, 'system_logs', id), { acknowledged: true });
    } catch (err) { console.error(err); }
  },

  resolveMaintenance: async (id: string) => {
    try {
      await updateDoc(doc(db, 'maintenance_logs', id), { status: 'RESOLVED', resolvedAt: Date.now() });
    } catch (err) { console.error(err); }
  },

  endSession: async (lockerId: string) => {
    const numericId = lockerId.replace('locker_', '');
    const firestoreId = `locker_${numericId}`;

    try {
      // 1. Update Firestore
      await updateDoc(doc(db, 'lockers', firestoreId), {
        status: 'AVAILABLE',
        startTime: null,
        duration: 0,
        currentPin: null,
        userId: null,
        userName: null,
        userContact: null,
        sessionEnd: 0
      });

      // 2. Update RTDB (Hardware Sync)
      await update(ref(rtdb, numericId), {
        status: 'AVAILABLE',
        pin: null,
        startTime: 0,
        duration: 0,
        unlockCount: 0,
        sessionEnd: 0,
        userName: null
      });

      console.info(`[Admin] Session ended for locker ${numericId}`);
      get().showModal(
        'Session Terminated',
        `SUCCESS: Session for Locker #${numericId} has been terminated. The unit is now available for new bookings.`,
        'success'
      );
    } catch (err: any) {
      console.error('[Admin] Failed to end session:', err.message);
      get().showModal('Termination Failed', `Could not end session for Locker #${numericId}. Error: ${err.message}`, 'error');
      throw err;
    }
  },

  triggerPulse: () => {
    set({ pulse: true });
    setTimeout(() => set({ pulse: false }), 800);
  },

  overrideStart: async (lockerId: string) => {
    const numericId = lockerId.replace('locker_', '');
    const firestoreId = `locker_${numericId}`;
    const locker = get().lockers[numericId];

    if (!locker || !!locker.startTime) return;

    try {
      const now = Date.now();
      const duration = Number(locker.duration || 3600000);
      const sessionEnd = now + duration;

      // 1. Update Firestore (Authority)
      await updateDoc(doc(db, 'lockers', firestoreId), {
        status: 'ACTIVE',
        startTime: now,
        sessionEnd: sessionEnd,
        unlockCount: 1, // Bypass hardware-trigger requirement
      });

      // 2. Update RTDB (Hardware / UI Notification)
      await update(ref(rtdb, numericId), {
        status: 'ACTIVE',
        startTime: now,
        sessionEnd: sessionEnd,
        unlockCount: 1,
        lastUpdated: now
      });

      console.info(`[Admin] Force Started session for locker ${numericId}`);
    } catch (err: any) {
      console.error('[Admin] Failed to override start:', err.message);
      throw err;
    }
  },

  setError: (err) => set({ error: err }),

  initSync: (force = false) => {
    if (get().initialized && !force) return;   // prevent duplicate listeners
    set({ initialized: true, isInitializing: true });

    // 0. Pre-initialize 20 lockers locally to ensure UI shows full grid immediately
    set((state) => {
      const initial: Record<string, LockerData> = { ...state.lockers };
      for (let i = 1; i <= 20; i++) {
        const id = String(i);
        if (!initial[id]) {
          initial[id] = {
            id,
            status: 'AVAILABLE',
            doorStatus: 'CLOSED',
            occupancy: 'EMPTY',
            currentPin: '---',
            userName: 'N/A',
            startTime: null,
            duration: 0,
            unlockCount: 0,
          };
        }
      }
      return { lockers: initial };
    });

    // 1. RTDB Sync & Cloud-Bridge (Synchronizes Hardware -> Firestore)
    onValue(ref(rtdb, '/'), (snapshot) => {
      get().triggerPulse();
      const raw = snapshot.val();
      if (!raw || typeof raw !== 'object') return;
      
      set((state) => {
        const updated = { ...state.lockers };
        
        Object.keys(raw).forEach((rawId) => {
          const nodeData = raw[rawId];
          if (!nodeData || typeof nodeData !== 'object') return;
          
          const id = String(rawId);
          if (!updated[id]) updated[id] = { id, status: 'AVAILABLE', doorStatus: 'CLOSED', occupancy: 'EMPTY', currentPin: '---', userName: 'N/A', startTime: null, duration: 0, unlockCount: 0 };
          
          const prevStatus = updated[id].status;
          const prevUnlockCount = updated[id].unlockCount;
          const prevStartTime = updated[id].startTime;

          // Local state update
          updated[id].status = (nodeData.status || 'AVAILABLE') as LockerStatus;
          updated[id].startTime = nodeData.startTime || null;
          updated[id].duration = nodeData.duration || 0;
          updated[id].unlockCount = nodeData.unlockCount || 0;
          updated[id].sessionEnd = nodeData.sessionEnd;
          if (nodeData.userName) updated[id].userName = nodeData.userName;

          // CLOUD-BRIDGE LOGIC: Proactively sync hardware-initiated states to Firestore
          // This ensures the main website (which follows Firestore) stays in sync.
          const firestoreDocId = `locker_${id}`;
          
          // Trigger 1: Hardware just started a session (Unlock Count 1)
          if (updated[id].unlockCount > 0 && !prevStartTime && updated[id].startTime) {
             console.log(`[Bridge] Syncing Hardware Start for Locker #${id} to Firestore...`);
             updateDoc(doc(db, 'lockers', firestoreDocId), {
               startTime: updated[id].startTime,
               sessionEnd: updated[id].sessionEnd,
               unlockCount: updated[id].unlockCount,
               status: 'ACTIVE'
             }).catch(e => console.error('[Bridge] Firestore sync failed:', e));
          }

          // Trigger 2: Hardware session end (Status became AVAILABLE on hardware)
          if (updated[id].status === 'AVAILABLE' && prevStatus === 'ACTIVE' && prevStartTime) {
             console.log(`[Bridge] Syncing Hardware Termination for Locker #${id} to Firestore...`);
             updateDoc(doc(db, 'lockers', firestoreDocId), {
               status: 'AVAILABLE',
               startTime: null,
               sessionEnd: 0,
               unlockCount: 0
             }).catch(e => console.error('[Bridge] Firestore termination failed:', e));
          }
        });
        
        return { lockers: updated };
      });
    });

    // 2. Firestore Lockers
    onSnapshot(collection(db, 'lockers'), (snapshot) => {
      get().triggerPulse();
      set((state) => {
        const updated = { ...state.lockers };
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!docSnap.id.startsWith('locker_')) return;
          const id = docSnap.id.replace('locker_', '');
          if (parseInt(id) < 1 || parseInt(id) > 20) return;
          if (!updated[id]) updated[id] = { id, status: 'AVAILABLE', doorStatus: 'CLOSED', occupancy: 'EMPTY', currentPin: '---', userName: 'N/A', startTime: null, duration: 0, unlockCount: 0 };
          if (data.status) updated[id].status = data.status as LockerStatus;
          if (data.currentPin) updated[id].currentPin = data.currentPin;
          if (data.userName) updated[id].userName = data.userName;
          if (data.userId) updated[id].occupancy = 'OCCUPIED';
          if (data.startTime) updated[id].startTime = data.startTime;
          if (data.duration) updated[id].duration = data.duration;
          updated[id].firestoreStatus = true;
        });
        return { lockers: updated };
      });
    });

    // 3. Bookings
    onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')), (snapshot) => {
      get().triggerPulse();
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      set({ bookings: docs, isInitializing: false });
    });

    // 4. System Logs (Alerts)
    onSnapshot(query(collection(db, 'system_logs'), orderBy('timestamp', 'desc')), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      set({ alerts: docs });
    });

    // 5. Maintenance Logs
    onSnapshot(query(collection(db, 'maintenance_logs'), orderBy('createdAt', 'desc')), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      set({ maintenanceLogs: docs });
    });

    // 6. Admin Logs
    onSnapshot(query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc')), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      set({ adminLogs: docs });
    });

    // 7. Users Lookup (for resolving names in history)
    onSnapshot(collection(db, 'users'), (snapshot) => {
      const userMap: Record<string, { name: string; email: string }> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        userMap[doc.id] = { 
          name: data.name || 'User', 
          email: data.email || 'N/A' 
        };
      });
      set({ users: userMap });
    });
  },
}));
