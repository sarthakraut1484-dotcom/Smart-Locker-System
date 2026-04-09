"use server";

import { rtdb } from "@/lib/firebase/config";
import { ref, update } from "firebase/database";

// Secret key for REST fallback if SDK fails on server
const SECRET = "ehwg3KYlrxk8jVP5wOQcX4YUZ66IZ1h1aHme2Uu";
const DB_URL = "https://asep-smart-locker-default-rtdb.asia-southeast1.firebasedatabase.app";

export async function syncHardwareAction(lockerId: string, data: any) {
  console.log(`[Server Action] Syncing Locker #${lockerId}...`);
  
  try {
    // Try via REST API from server side (most reliable, bypasses SDK initialization issues on server)
    const url = `${DB_URL}/${lockerId}.json?auth=${SECRET}`;
    
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        lastUpdated: Date.now(),
        lastUpdate: Date.now() // Support both naming conventions
      })
    });

    if (!response.ok) {
      throw new Error(`REST API failed with status ${response.status}`);
    }

    console.log(`[Server Action] Success for Locker #${lockerId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[Server Action] Hardware Sync Error:", err.message);
    return { success: false, error: err.message };
  }
}
