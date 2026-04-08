import CryptoJS from 'crypto-js';

// IN PRODUCTION: Use a secure Environment Variable for the Master Key
const MASTER_KEY = 'ASEP_LOCKNLEAVE_SECURE_2026'; 

/**
 * 🔐 SHA-256 Hashing for Hardware Compatibility
 * Only used for PIN verification on the ESP32.
 */
export const hashPIN = (pin: string): string => {
  return CryptoJS.SHA256(pin).toString();
};

/**
 * 🔒 AES Encryption for Database Storage
 * Used for fields that need to be readable by User/Admin but encrypted at rest.
 */
export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, MASTER_KEY).toString();
};

/**
 * 🔓 AES Decryption for UI Display
 */
export const decryptData = (ciphertext: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, MASTER_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error("Decryption failed:", err);
    return "DECRYPTION_ERROR";
  }
};
