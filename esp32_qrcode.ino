#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Keypad.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include "qrcodegen.h"
#include <time.h>

/* ================= WIFI ================= */
#define WIFI_SSID     "Shivkrupa"
#define WIFI_PASSWORD "Cinderella3"

/* ================= FIREBASE ================= */
#define FIREBASE_HOST "asep-smart-locker-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_SECRET "ehwg3KYlrxk8jVP5wOQcX4YUZ66IZ1h1aHme2Uu"

/* ================= LOCKER CONFIGURATION ================= */
#define LOCKER_ID     "4"   

/* ================= HARDWARE ================= */
#define LOCK_PIN 21
#define UNLOCK_TIME 3000

/* ================= TFT DISPLAY ================= */
#define TFT_CS    5
#define TFT_DC    2
#define TFT_RST   4

/* ================= KEYPAD ================= */
char keys[4][4] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
byte rowPins[4] = {33, 32, 25, 26};
byte colPins[4] = {27, 14, 12, 13};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, 4, 4);

/* ================= STATE ================= */
enum LockerState { LOCKED, UNLOCKED };
LockerState state = LOCKED;
String enteredPIN = "";
unsigned long unlockStart = 0;
unsigned long lastQrUpdate = 0;
const unsigned long QR_UPDATE_INTERVAL = 300000; // 5 minutes

// State Management
String currentBackendStatus = "AVAILABLE";
unsigned long long currentSessionEnd = 0; // Epoch milliseconds from Firebase
int currentUnlockCount = 0;
unsigned long lastFirebasePoll = 0;
const unsigned long POLL_INTERVAL = 3000; // Check every 3 seconds

// Display State
enum DisplayMode { DISP_QR, DISP_INFO };
DisplayMode currentDisplayMode = DISP_QR;
bool forceRedraw = true;

// Debug Globals
long debugDuration = 0;
long long debugStartTime = 0;

/* ================= TIME ================= */
const long  gmtOffset_sec = 0; // Set to 0 to force UTC (matches Firebase)
const int   daylightOffset_sec = 0;

/* ================= TFT OBJECTS ================= */
Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RST);
uint8_t qrcode[qrcodegen_BUFFER_LEN_MAX];
uint8_t tempBuffer[qrcodegen_BUFFER_LEN_MAX];

/* ================= TFT COLORS ================= */
#define BG_COLOR   ST77XX_BLACK
#define TEXT_COLOR ST77XX_WHITE
#define QR_BG      ST77XX_WHITE
#define QR_FG      ST77XX_BLACK
#define INFO_COLOR ST77XX_GREEN
#define WARN_COLOR ST77XX_WHITE
#define ERROR_COLOR ST77XX_CYAN // Inverted display: Cyan (0x07FF) becomes Red (0xF800)

/* ================= FORWARD DECLARATIONS ================= */
void centerText(const char* text, int y, int size, uint16_t color);
void displayQRCode(const char* text, int yPos, int maxScale);
void drawQRMode();
void drawInfoMode();
void drawPinState();
void pollLockerStatus();
void handleKeypad();
void checkPIN();
void unlockLocker();
void handleAutoLock();
void checkSessionExpiration();

/* ================= SETUP ================= */
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Hardware Init
  pinMode(LOCK_PIN, OUTPUT);
  digitalWrite(LOCK_PIN, LOW); // Locked
  
  tft.init(240, 320); 
  tft.setRotation(2);
  tft.invertDisplay(true);
  tft.fillScreen(BG_COLOR);
  
  centerText("Connecting...", 150, 2, TEXT_COLOR);
  
  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int w = 0;
  while (WiFi.status() != WL_CONNECTED && w < 20) { 
    delay(200); 
    w++; 
  }
  
  // Time Sync
  configTime(gmtOffset_sec, daylightOffset_sec, "pool.ntp.org", "time.nist.gov");
  centerText("Syncing Time...", 180, 2, TEXT_COLOR);
  
  time_t now = time(NULL);
  // Wait a bit for time to sync, but don't block forever
  unsigned long tStart = millis();
  while (now < 24 * 3600 && millis() - tStart < 5000) { 
    delay(100);
    now = time(NULL);
  }
  
  // Initial Fetch
  pollLockerStatus();
  forceRedraw = true; // Ensure first draw happens
}

/* ================= LOOP ================= */
void loop() {
  // 1. PIN & Lock Logic (Always Active)
  if (state == LOCKED) {
    handleKeypad();
  } else {
    handleAutoLock();
  }

  // 1.5 Check Expiration locally
  checkSessionExpiration();
  
  // 2. Poll Firebase (Non-blocking)
  if (millis() - lastFirebasePoll >= POLL_INTERVAL) {
    pollLockerStatus();
    lastFirebasePoll = millis();
  }
  
  // 3. UI Updates
  if (state == LOCKED) { // Only update screen if not currently unlocking
    if (currentDisplayMode == DISP_QR) {
      if (forceRedraw || millis() - lastQrUpdate >= QR_UPDATE_INTERVAL) {
        drawQRMode();
      }
    } else {
      // Info Mode (Timer) - Update every second
      static unsigned long lastTimerDraw = 0;
      if (forceRedraw || millis() - lastTimerDraw >= 1000) {
        drawInfoMode();
        lastTimerDraw = millis();
      }
    }
  }
}

/* ================= IMPLEMENTATIONS ================= */

void centerText(const char* text, int y, int size, uint16_t color) {
  tft.setTextSize(size);
  tft.setTextColor(color, BG_COLOR); // Use background color to overwrite previous text
  int16_t x1, y1;
  uint16_t w, h;
  tft.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
  int x = (tft.width() - w) / 2;
  tft.setCursor(x, y);
  tft.print(text);
}

void displayQRCode(const char* text, int yPos, int maxScale) {
  bool ok = qrcodegen_encodeText(text, tempBuffer, qrcode, qrcodegen_Ecc_LOW,
                                 qrcodegen_VERSION_MIN, qrcodegen_VERSION_MAX,
                                 qrcodegen_Mask_AUTO, true);
  
  if (ok) {
    int size = qrcodegen_getSize(qrcode);
    int scale = maxScale;
    
    while ((size * scale) > tft.width() - 20) {
      scale--;
    }
    
    int pxSize = size * scale;
    int x = (tft.width() - pxSize) / 2;

    int margin = 5;
    tft.fillRect(x - margin, yPos - margin, pxSize + (margin * 2), pxSize + (margin * 2), QR_BG);
    
    for (int py = 0; py < size; py++) {
      for (int px = 0; px < size; px++) {
        if (qrcodegen_getModule(qrcode, px, py)) {
          tft.fillRect(x + (px * scale), yPos + (py * scale), scale, scale, QR_FG);
        }
      }
    }
  }
}

void drawPinState() {
  // Clear the area where PIN stars will be shown
  // Y=210 is above the "Enter PIN" text at Y=250
  tft.fillRect(0, 210, 240, 30, BG_COLOR);
  
  if (enteredPIN.length() > 0) {
    String masked = "";
    for (int i = 0; i < enteredPIN.length(); i++) {
      masked += "*";
    }
    centerText(masked.c_str(), 210, 3, TEXT_COLOR);
  }
}

void drawQRMode() {
  if (forceRedraw) {
    tft.fillScreen(BG_COLOR);
    centerText("Smart Locker", 10, 2, TEXT_COLOR);
    centerText("Scan to book", tft.height() - 40, 2, TEXT_COLOR);
    centerText("locker", tft.height() - 20, 2, TEXT_COLOR);
    forceRedraw = false;
  }
  
  // Appends Locker ID and Timestamp
  String dynamicURL = "https://smart-locker-system-two.vercel.app/booking.html?id=" + String(LOCKER_ID) + "&t=" + String(millis());
  displayQRCode(dynamicURL.c_str(), 50, 7);
  
  lastQrUpdate = millis();
}

void drawInfoMode() {
  // Dynamic Updates (Timer)
  unsigned long long nowMs = (unsigned long long)time(NULL) * 1000ULL;
  
  // Decide whether to show Timer or Waiting stats
  // If we have unlocked at least once, we try to show the timer.
  // If the sessionEnd is invalid (0) or past, we might show 00:00:00, but we won't revert to "Waiting"
  // unless the count is actually 0.
  bool showTimer = (currentUnlockCount > 0);
  
  if (forceRedraw) {
    tft.fillScreen(BG_COLOR);
    
    // Header
    centerText("Locker 04", 20, 3, TEXT_COLOR);
    centerText("Booking Confirmed", 60, 2, INFO_COLOR);
    
    if (showTimer) {
      centerText("Expires In:", 110, 2, TEXT_COLOR);
    } else {
      centerText("Waiting User", 120, 2, TEXT_COLOR);
      centerText("to Unlock", 150, 2, TEXT_COLOR);
    }
    
    // Footer Instructions
    centerText("Enter PIN", 250, 2, TEXT_COLOR);
    centerText("& Press #", 280, 2, TEXT_COLOR);
    
    drawPinState();
    
    // Debug info removed as requested previously
    
    forceRedraw = false;
  }
  
  if (showTimer) {
    // Current time is now UTC (since we set offset to 0)
    unsigned long long nowMs = (unsigned long long)time(NULL) * 1000ULL;
    
    long remainingSeconds = 0;
    // Check if sessionEnd is in the future
    if (currentSessionEnd > nowMs) {
      remainingSeconds = (long)((currentSessionEnd - nowMs) / 1000);
    }
    
    if (remainingSeconds < 0) remainingSeconds = 0;
    
    int hours = remainingSeconds / 3600;
    int minutes = (remainingSeconds % 3600) / 60;
    int seconds = remainingSeconds % 60;
    
    char timeStr[16];
    sprintf(timeStr, "%02d:%02d:%02d", hours, minutes, seconds);
    
    // Only update the time digits
    centerText(timeStr, 140, 4, TEXT_COLOR);
  } else if (currentUnlockCount > 0 && !showTimer) {
    // Determine if we are just waiting for sync or if it's truly waiting for unlock
    // If unlockCount > 0 but sessionEnd is 0/past, it acts as 'Waiting for valid session'
    // We can keep 'Waiting for First Unlock' or change to 'Syncing...'
    // For now, keeping 'Waiting for First Unlock' as it effectively means 'Waiting for Session Start'
    // No dynamic update needed for static text
  }
}

void pollLockerStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + ".json?auth=" + String(FIREBASE_SECRET);
  
  http.begin(url);
  int httpCode = http.GET();
  String payload = http.getString();
  http.end();

  if (httpCode == 200) {
    StaticJsonDocument<1024> doc;
    deserializeJson(doc, payload); 
    
    const char* st = doc["status"];
    unsigned long long endTs = doc["sessionEnd"].as<unsigned long long>();
    
    // FALLBACK: If sessionEnd is 0, try to calculate from startTime + duration (mirrors web logic)
    if (endTs == 0) {
       long long start = doc["startTime"];
       long duration = doc["duration"]; 
       
       debugStartTime = start;
       debugDuration = duration;

       // Note: duration in JS might be ms, check if it's large. If > 100000 assume ms.
       // Usually duration is hours? user said "number of hours". 
       // If stored as Hours: start + (hours * 3600 * 1000)
       // If stored as MS: start + duration
       // Let's assume MS to match timestamp logic, but check values.
       if (start > 0 && duration > 0) {
         endTs = (unsigned long long)start + (unsigned long long)duration;
       }
    } else {
       // Also capture debug info if sessionEnd exists
       debugStartTime = doc["startTime"] | 0;
       debugDuration = doc["duration"] | 0;
    }
    
    int unlocks = doc["unlockCount"] | 0; 
    
    String newStatus = st ? String(st) : "AVAILABLE";
    
    if (newStatus != currentBackendStatus || unlocks != currentUnlockCount) {
      if (newStatus != currentBackendStatus) forceRedraw = true;
      // Also force redraw if unlock count changes (e.g. 0 to 1) so we can switch from "Waiting" to Timer
      if (unlocks != currentUnlockCount && currentBackendStatus == "ACTIVE") forceRedraw = true;
      
      currentBackendStatus = newStatus;
      // Sync logic to handle race condition with local increment
      bool sameSession = ((unsigned long long)endTs == currentSessionEnd);
      
      // If we are transitioning from 0 (unknown) to a valid timestamp, 
      // treat it as the same session so we don't discard our local unlock action
      if (currentSessionEnd == 0 && endTs > 0) {
        sameSession = true;
      }
      
      currentSessionEnd = (unsigned long long)endTs;
      
      if (sameSession) {
        // Keep the higher count (Local 1 vs Remote 0 -> Keep 1)
        if (unlocks > currentUnlockCount) currentUnlockCount = unlocks;
      } else {
        // Truly a new session (different valid timestamp), trust backend completely
        currentUnlockCount = unlocks;
      }
      
      if (currentBackendStatus == "ACTIVE") {
        currentDisplayMode = DISP_INFO;
      } else {
        currentDisplayMode = DISP_QR;
      }
    } else {
      if (currentBackendStatus == "ACTIVE") {
        currentSessionEnd = (unsigned long long)endTs;
        currentUnlockCount = unlocks;
      }
    }
  }
}

void handleKeypad() {
  char key = keypad.getKey();
  if (!key) return;
  
  if (key >= '0' && key <= '9') {
    enteredPIN += key;
    Serial.print(key);
    Serial.print(" ");
    drawPinState();
  }
  else if (key == '#') {
    Serial.println("[SUBMIT]");
    if (enteredPIN.length() > 0) {
      checkPIN();
    } else {
      Serial.println("No PIN entered");
    }
    enteredPIN = "";
    drawPinState();
  }
  else if (key == '*') {
    enteredPIN = "";
    Serial.println("\nPIN cleared");
    drawPinState();
  }
}

void checkPIN() {
  Serial.println("Checking PIN...");
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return;
  }
  
  HTTPClient http;
  String url = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + ".json?auth=" + String(FIREBASE_SECRET);
  
  http.begin(url);
  int httpCode = http.GET();
  String payload = http.getString();
  http.end();
  
  if (httpCode == 200 && payload.length() > 0 && payload != "null") {
    StaticJsonDocument<1024> doc;
    deserializeJson(doc, payload);
    
    const char* firebasePIN = doc["pin"];
    const char* status = doc["status"];
    
    if (String(status) == "ACTIVE" && enteredPIN == String(firebasePIN)) {
      Serial.println("*** UNLOCKING ***");
      
      // PRE-SYNC: Update state immediately so UI works before next poll
      unsigned long long endTs = doc["sessionEnd"].as<unsigned long long>();
      
      // FALLBACK for PRE-SYNC
      if (endTs == 0) {
         long long start = doc["startTime"];
         long duration = doc["duration"]; 
         if (start > 0 && duration > 0) {
           endTs = (unsigned long long)start + (unsigned long long)duration;
         }
      }
      
      currentSessionEnd = endTs;
      currentBackendStatus = "ACTIVE";
      // We don't update unlockCount here, unlockLocker will increment it.
      
      unlockLocker();
    } else {
      Serial.println("*** WRONG PIN ***");
      tft.fillScreen(BG_COLOR);
      centerText("Wrong PIN", 100, 2, ERROR_COLOR);
      centerText("Try Again", 130, 2, ERROR_COLOR);
      delay(2000);
      forceRedraw = true;
    }
  }
}

void unlockLocker() {
  Serial.println("=== UNLOCKING ===");
  digitalWrite(LOCK_PIN, HIGH); // Unlocking
  unlockStart = millis();
  state = UNLOCKED;
  
  // Immedate UI Update
  currentUnlockCount++; 
  forceRedraw = true; 
  
  // 1. Update Unlock Count in Firebase
  HTTPClient http;
  String countUrl = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + "/unlockCount.json?auth=" + String(FIREBASE_SECRET);
  http.begin(countUrl);
  int getCode = http.GET();
  String countPayload = http.getString();
  http.end();
  
  int currentCount = 0;
  if (getCode == 200 && countPayload != "null") {
    currentCount = countPayload.toInt();
  }
  currentCount++;
  
  http.begin(countUrl);
  http.PUT(String(currentCount));
  http.end();

  // 2. FIRST UNLOCK: Start the Timer if it hasn't started (startTime == 0)
  // We use the 'debugStartTime' global which holds the last fetched startTime
  if (debugStartTime == 0) {
     Serial.println("First Unlock! Starting Timer...");
     
     // Calculate Now in UTC (ms)
     unsigned long long nowUTC = (unsigned long long)time(NULL) * 1000ULL;
     
     // Write to Firebase
     String startUrl = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + "/startTime.json?auth=" + String(FIREBASE_SECRET);
     http.begin(startUrl);
     http.PUT(String((unsigned long long)nowUTC)); // Write as number
     http.end();
     
     // Update Local State immediately so timer appears
     debugStartTime = nowUTC;
     
     // Recalculate Session End locally
     if (debugDuration > 0) {
        currentSessionEnd = nowUTC + (unsigned long long)debugDuration;
     }
  }
}

void handleAutoLock() {
  if (millis() - unlockStart >= UNLOCK_TIME) {
    digitalWrite(LOCK_PIN, LOW); // Locking
    state = LOCKED;
    enteredPIN = "";
    Serial.println("=== LOCKED ===");
  }
}

void checkSessionExpiration() {
  // Only check if we are currently ACTIVE and have a valid session end time
  if (currentBackendStatus != "ACTIVE" || currentSessionEnd == 0) return;

  // Use the same time source as the rest of the app
  unsigned long long nowMs = (unsigned long long)time(NULL) * 1000ULL;

  // Check if time has passed
  if (nowMs > currentSessionEnd) {
    Serial.println("Session Expired! Resetting...");
    
    // 1. Force Lock
    digitalWrite(LOCK_PIN, LOW);
    state = LOCKED;
    
    // 2. Update Firebase to AVAILABLE
    if (WiFi.status() == WL_CONNECTED) {
       HTTPClient http;
       String url = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + ".json?auth=" + String(FIREBASE_SECRET);
       
       // Resetting status, clearing PIN, and zeroing timers
       String json = "{\"status\":\"AVAILABLE\",\"pin\":\"\",\"startTime\":0,\"sessionEnd\":0,\"duration\":0,\"unlockCount\":0}";
       
       http.begin(url);
       int code = http.sendRequest("PATCH", json);
       http.end();
       Serial.print("Reset Backend Code: ");
       Serial.println(code);
    }
    
    // 3. Reset Local State
    currentBackendStatus = "AVAILABLE";
    currentSessionEnd = 0;
    currentUnlockCount = 0;
    enteredPIN = "";
    debugStartTime = 0;
    debugDuration = 0;
    
    // 4. Update UI
    currentDisplayMode = DISP_QR;
    forceRedraw = true;
  }
}
