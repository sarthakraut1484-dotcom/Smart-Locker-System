import CryptoJS from 'crypto-js';

// IN PRODUCTION: Use a secure Environment Variable for the Master Key
const MASTER_KEY = 'ASEP_LOCKNLEAVE_SECURE_2026'; 

/**
 * 🔒 AES Encryption for Database Storage
 */
export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, MASTER_KEY).toString();
};

/**
 * 🔓 AES Decryption for UI Display
 */
export const decryptData = (ciphertext: string): string => {
  if (!ciphertext) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, MASTER_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || "---";
  } catch (err) {
    console.error("Decryption failed:", err);
    return "DECRYPTION_ERROR";
  }
};

/**
 * 🔒 SHA-256 Hashing for Hardware Comparison
 */
export const hashPIN = (pin: string): string => {
  return CryptoJS.SHA256(pin).toString();
};
