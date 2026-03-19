#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <XPT2046_Touchscreen.h>
#include "qrcodegen.h"
#include <time.h>
#include <WiFiClientSecure.h>

/* ================= BLOCKCHAIN & ENCRYPTION ================= */
#include "mbedtls/md.h"

String generateBlockchainHash(String previousHash, String payload) {
  String toHash = previousHash + payload;
  unsigned char hashOutput[32];
  
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 0);
  mbedtls_md_starts(&ctx);
  mbedtls_md_update(&ctx, (const unsigned char *) toHash.c_str(), toHash.length());
  mbedtls_md_finish(&ctx, hashOutput);
  mbedtls_md_free(&ctx);

  String hexHash = "";
  for(int i = 0; i < 32; i++) {
    char str[3];
    sprintf(str, "%02x", (int)hashOutput[i]);
    hexHash += str;
  }
  return hexHash;
}

String lastBlockHash = "0000000000000000000000000000000000000000000000000000000000000000"; // Genesis Hash

// ============================================================
// 🔐 SHA-256 PIN HASHER — Never store/compare raw PINs
// ============================================================
String hashPIN(String pin) {
  unsigned char hashOutput[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 0);
  mbedtls_md_starts(&ctx);
  mbedtls_md_update(&ctx, (const unsigned char *) pin.c_str(), pin.length());
  mbedtls_md_finish(&ctx, hashOutput);
  mbedtls_md_free(&ctx);
  String hex = "";
  for(int i = 0; i < 32; i++) {
    char str[3];
    sprintf(str, "%02x", (int)hashOutput[i]);
    hex += str;
  }
  return hex;
}

// 🔐 Firebase Root CA Certificate (ISRG Root X1) — Prevents MITM attacks
const char* FIREBASE_ROOT_CA = \
"-----BEGIN CERTIFICATE-----\n"
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n"
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n"
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n"
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n"
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n"
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc\n"
"h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+\n"
"0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U\n"
"A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW\n"
"T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH\n"
"B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC\n"
"B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv\n"
"KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn\n"
"OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn\n"
"jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw\n"
"qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI\n"
"rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV\n"
"HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq\n"
"hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL\n"
"ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ\n"
"3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK\n"
"NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5\n"
"ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur\n"
"TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwH\n"
"-----END CERTIFICATE-----\n";

WiFiClientSecure wifiClient;

/* ================= MIRROR FIXES ================= */
const bool FIX_TOUCH_MIRROR = true;

/* ================= WIFI ================= */
#define WIFI_SSID     "Sarthak_Raut"
#define WIFI_PASSWORD "qwertyuiop"

/* ================= FIREBASE ================= */
#define FIREBASE_HOST "asep-smart-locker-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_SECRET "ehwg3KYlrxk8jVP5wOQcX4YUZ66IZ1h1aHme2Uu"

/* ================= LOCKER CONFIGURATION ================= */
#define LOCKER_ID     "4"   

/* ================= HARDWARE ================= */
#define LOCK_PIN 32 
#define UNLOCK_TIME 3000

/* ================= PINS ================= */
#define TFT_CS    15
#define TFT_DC    2
#define TFT_RST   4
#define TOUCH_CS  21
#define TOUCH_IRQ 22 

/* ================= THEME (HEX MATCHED) ================= */
uint16_t RGB565(uint8_t r, uint8_t g, uint8_t b) { return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3); }

#define THEME_BG          (~RGB565(15, 23, 42))    
#define THEME_HEADER      (~RGB565(30, 58, 138))   
#define THEME_BTN         (~RGB565(51, 65, 85))    
#define THEME_BTN_PRESS   (~RGB565(34, 197, 94))   
#define THEME_TEXT        (~RGB565(255, 255, 255)) 
#define THEME_CANCEL      (~RGB565(239, 68, 68))   
#define THEME_ENTER       (~RGB565(59, 130, 246))  
#define THEME_NEUTRAL     (~RGB565(250, 204, 21))  
#define THEME_SHADOW      (~RGB565(5, 10, 20))     

/* ================= TOUCH KEYPAD ================= */
struct TouchButton {
  int x, y, w, h;
  char label;
  uint16_t color;
  uint16_t pressColor;
  bool isPressed;
};

TouchButton buttons[12] = {
  { 16,  105, 64, 42, '1', THEME_BTN, THEME_BTN_PRESS, false },
  { 88,  105, 64, 42, '2', THEME_BTN, THEME_BTN_PRESS, false },
  { 160, 105, 64, 42, '3', THEME_BTN, THEME_BTN_PRESS, false },
  
  { 16,  153, 64, 42, '4', THEME_BTN, THEME_BTN_PRESS, false },
  { 88,  153, 64, 42, '5', THEME_BTN, THEME_BTN_PRESS, false },
  { 160, 153, 64, 42, '6', THEME_BTN, THEME_BTN_PRESS, false },
  
  { 16,  201, 64, 42, '7', THEME_BTN, THEME_BTN_PRESS, false },
  { 88,  201, 64, 42, '8', THEME_BTN, THEME_BTN_PRESS, false },
  { 160, 201, 64, 42, '9', THEME_BTN, THEME_BTN_PRESS, false },
  
  { 16,  249, 64, 42, '*', THEME_CANCEL, THEME_BTN_PRESS, false }, // Cancel/Del
  { 88,  249, 64, 42, '0', THEME_BTN, THEME_BTN_PRESS, false },
  { 160, 249, 64, 42, '#', THEME_ENTER, THEME_BTN_PRESS, false }  // Enter
};

/* ================= STATE ================= */
enum LockerState { LOCKED, UNLOCKED };
LockerState state = LOCKED;
String enteredPIN = "";
unsigned long unlockStart = 0;
unsigned long lastQrUpdate = 0;
const unsigned long QR_UPDATE_INTERVAL = 300000;

String currentBackendStatus = "AVAILABLE";
unsigned long long currentSessionEnd = 0;
int currentUnlockCount = 0;
unsigned long lastFirebasePoll = 0;
const unsigned long POLL_INTERVAL = 1000;

// Security variables
int failedAttempts = 0;
unsigned long lockoutUntil = 0;

enum DisplayMode { DISP_QR, DISP_INFO };
DisplayMode currentDisplayMode = DISP_QR;
bool forceRedraw = true;

bool terminationMode = false;
String terminationPIN = "";

long debugDuration = 0;
long long debugStartTime = 0;
String currentStatusMsg = "Enter PIN...";
uint16_t currentStatusColor = THEME_NEUTRAL;

/* ================= OBJECTS ================= */
Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RST);
XPT2046_Touchscreen ts(TOUCH_CS, TOUCH_IRQ);
uint8_t qrcode[qrcodegen_BUFFER_LEN_MAX];
uint8_t tempBuffer[qrcodegen_BUFFER_LEN_MAX];

void unlockLocker(bool clearCommand = false);
void terminateSession();

/* ================= SETUP ================= */
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  pinMode(LOCK_PIN, OUTPUT);
  digitalWrite(LOCK_PIN, LOW); // Locked
  
  SPI.begin(18, 19, 23); 
  
  tft.init(240, 320); 
  tft.setRotation(2);

  uint8_t madctl = 0x88; 
  tft.sendCommand(0x36, &madctl, 1); 

  tft.invertDisplay(true);
  tft.fillScreen(THEME_BG);
  
  ts.begin();
  ts.setRotation(2);
  
  centerText("Connecting...", 150, 2, THEME_NEUTRAL);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int w = 0;
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print(".");
    w++;
    if (w > 60) { 
        tft.fillScreen(THEME_BG);
        centerText("ERROR", 130, 2, THEME_CANCEL);
        centerText("WiFi Failed", 160, 2, THEME_CANCEL);
        delay(3000);
        ESP.restart();
    }
  }
  
  tft.fillScreen(THEME_BG);
  centerText("Connected!", 150, 2, THEME_BTN_PRESS);
  delay(1000);
  
  // 🔐 TLS CERTIFICATE PINNING — Verify Firebase server identity (replaces setInsecure())
  // This completely prevents Man-in-the-Middle (MITM) network attacks
  wifiClient.setCACert(FIREBASE_ROOT_CA);
  
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  tft.fillScreen(THEME_BG);
  centerText("Syncing Time...", 150, 2, THEME_TEXT);
  
  time_t now = time(NULL);
  unsigned long tStart = millis();
  while (now < 24 * 3600 && millis() - tStart < 5000) { 
    delay(100);
    now = time(NULL);
  }
  
  pollLockerStatus();
  forceRedraw = true;
}

/* ================= LOOP ================= */
void loop() {
  if (state == LOCKED) {
    handleTouch();
  } else {
    handleAutoLock();
  }

  checkSessionExpiration();
  
  if (millis() - lastFirebasePoll >= POLL_INTERVAL) {
    pollLockerStatus();
    lastFirebasePoll = millis();
  }
  
  if (state == LOCKED) { 
    if (terminationMode) {
      static unsigned long lastTermDraw = 0;
      if (forceRedraw || millis() - lastTermDraw >= 1000) {
        drawTerminationMode();
        lastTermDraw = millis();
      }
    } else if (currentDisplayMode == DISP_QR) {
      if (forceRedraw || millis() - lastQrUpdate >= QR_UPDATE_INTERVAL) {
        forceRedraw = true; // Ensure drawQRMode executes
        drawQRMode();
      }
    } else {
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
  tft.setTextColor(color);
  int16_t x1, y1;
  uint16_t w, h;
  tft.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
  int x = (tft.width() - w) / 2;
  tft.setCursor(x, y);
  tft.print(text);
}

void processKeypadEntry(char key) {
  // ---------------- TERMINATION MODE ----------------
  if (terminationMode) {
    if (key >= '0' && key <= '9') {
      if (terminationPIN.length() < 4) terminationPIN += key; // Strictly limit to 4
      drawTerminationPinState();
    }
    else if (key == '#') {
      if (terminationPIN.length() > 0) checkTerminationPIN();
    }
    else if (key == '*') {
      // Smart Backspace vs Exit
      if (terminationPIN.length() > 0) {
         terminationPIN.remove(terminationPIN.length() - 1); // Delete last character
         drawTerminationPinState();
      } else {
         terminationMode = false;
         terminationPIN = "";
         forceRedraw = true; // Return to standard screen
      }
    }
    return;
  }
  
  // ---------------- STANDARD / UNLOCK MODE ----------------
  if (key >= '0' && key <= '9') {
    if (enteredPIN.length() < 4) enteredPIN += key; // Strictly limit to 4
    drawPinState();
    updateStatus("Enter PIN...", THEME_NEUTRAL);
  }
  else if (key == '#') {
    if (enteredPIN.length() > 0) checkPIN();
  }
  else if (key == '*') {
    // Smart Backspace vs Terminate
    if (enteredPIN.length() > 0) {
       enteredPIN.remove(enteredPIN.length() - 1); // Delete last character
       drawPinState();
       updateStatus("Enter PIN...", THEME_NEUTRAL);
    } else if (currentBackendStatus == "ACTIVE") {
       terminationMode = true;
       terminationPIN = "";
       forceRedraw = true;
    }
  }
}

void handleTouch() {
  if (!ts.touched()) {
    // Ensure all buttons unpress visually if released
    for (int i=0; i<12; i++) {
       if (buttons[i].isPressed) {
          buttons[i].isPressed = false;
          drawButton(i); 
       }
    }
    return;
  }
  
  // 1. Stabilize touch input to prevent edge-case wrong coordinate reads
  delay(10); 
  if (!ts.touched()) return;
  
  TS_Point p = ts.getPoint();
  
  // 2. Require a firm press (Z pressure) to avoid accidental light-brush sliding mistakes
  if (p.z < 300) return; 
  
  int tx;
  if(FIX_TOUCH_MIRROR) {
    tx = map(p.x, 300, 3800, 0, 240); 
  } else {
    tx = map(p.x, 3800, 300, 0, 240); 
  }
  int ty = map(p.y, 3800, 300, 0, 320); 
  
  if (currentDisplayMode == DISP_QR && !terminationMode) {
     static unsigned long lastQRTap = 0;
     if (ty < 40 && millis() - lastQRTap > 3000) {
        lastQRTap = millis();
        pollLockerStatus(); // Silent sync without screen blinking
     }
     return;
  }
  
  // 3. Forgiving hit detection margin (makes it easier to press without exact precision)
  int pad = 6; 
  
  for (int i=0; i<12; i++) {
     if (tx >= (buttons[i].x - pad) && tx <= (buttons[i].x + buttons[i].w + pad) &&
         ty >= (buttons[i].y - pad) && ty <= (buttons[i].y + buttons[i].h + pad)) {
         
         if (!buttons[i].isPressed) {
             // Show press visually instantly
             buttons[i].isPressed = true;
             drawButton(i); 
             
             processKeypadEntry(buttons[i].label);
             
             // ---------- RESPONSIVE DEBOUNCE LOGIC ----------
             delay(120); // Hold green "pressed" visual just enough for human perception
             
             buttons[i].isPressed = false;
             drawButton(i); 
             
             // Wait for finger to be physically lifted to prevent rapid fire
             uint32_t pressTime = millis();
             while(ts.touched() && (millis() - pressTime < 2000)) {
                 delay(10);
             }
             delay(100); // Post-release buffer
             // ---------------------------------------------
             
             return; 
         }
     }
  }
}

void drawButton(int i) {
   uint16_t bgColor = buttons[i].isPressed ? buttons[i].pressColor : buttons[i].color;
   
   if (!buttons[i].isPressed) {
     tft.fillRoundRect(buttons[i].x + 2, buttons[i].y + 3, buttons[i].w, buttons[i].h, 8, THEME_SHADOW);
   }

   tft.fillRoundRect(buttons[i].x, buttons[i].y, buttons[i].w, buttons[i].h, 8, bgColor);
   
   tft.setTextSize(2);
   tft.setTextColor(THEME_TEXT);
   
   int cx = buttons[i].x + (buttons[i].w - 12) / 2;
   int cy = buttons[i].y + (buttons[i].h - 16) / 2;
   tft.setCursor(cx, cy);
   tft.print(buttons[i].label);
}

void drawKeypad() {
  for (int i=0; i<12; i++) drawButton(i);
}

void drawPinState() {
  tft.fillRect(0, 58, 240, 40, THEME_BG);
  
  if (enteredPIN.length() > 0) {
    String masked = "";
    for (int i = 0; i < enteredPIN.length(); i++) masked += "* ";
    centerText(masked.c_str(), 70, 3, THEME_TEXT);
  } else {
    // Clearer "Empty" indication
    centerText("- - - -", 70, 3, THEME_BTN);
  }
}

void drawTerminationPinState() {
  tft.fillRect(0, 58, 240, 40, THEME_BG);
  
  if (terminationPIN.length() > 0) {
    String masked = "";
    for (int i = 0; i < terminationPIN.length(); i++) masked += "* ";
    centerText(masked.c_str(), 70, 3, THEME_TEXT);
  } else {
    centerText("- - - -", 70, 3, THEME_BTN);
  }
}

void updateStatus(String msg, uint16_t color) {
  currentStatusMsg = msg;
  currentStatusColor = color;
  
  tft.fillRect(0, 298, 240, 22, THEME_BG);
  centerText(currentStatusMsg.c_str(), 300, 2, currentStatusColor);
}

void displayQRCode(const char* text, int yPos, int maxScale) {
  bool ok = qrcodegen_encodeText(text, tempBuffer, qrcode, qrcodegen_Ecc_LOW,
                                 qrcodegen_VERSION_MIN, qrcodegen_VERSION_MAX,
                                 qrcodegen_Mask_AUTO, true);
  if (ok) {
    int size = qrcodegen_getSize(qrcode);
    int scale = maxScale;
    while ((size * scale) > tft.width() - 40) scale--;
    
    int pxSize = size * scale;
    int x = (tft.width() - pxSize) / 2;
    int margin = 8;
    
    tft.fillRect(x - margin, yPos - margin, pxSize + (margin * 2), pxSize + (margin * 2), THEME_TEXT);
    for (int py = 0; py < size; py++) {
      for (int px = 0; px < size; px++) {
        if (qrcodegen_getModule(qrcode, px, py)) {
          tft.fillRect(x + (px * scale), yPos + (py * scale), scale, scale, THEME_BG);
        }
      }
    }
  }
}

// ---------------- UI RENDER LOOPS ---------------- //

void drawQRMode() {
  if (forceRedraw) {
    tft.fillScreen(THEME_BG);

    tft.fillRect(0, 0, 240, 42, THEME_HEADER);
    centerText("LOCKNLEAVE", 14, 2, THEME_TEXT);
    
    centerText("Scan to book locker", 60, 2, THEME_NEUTRAL);

    unsigned long long nowMs = (unsigned long long)time(NULL) * 1000ULL;
    String dynamicURL = "https://locknleave.vercel.app/booking?id=" + String(LOCKER_ID) + "&t=" + String(nowMs);
    displayQRCode(dynamicURL.c_str(), 95, 6);
    
    String lockerText = "Locker #" + String(LOCKER_ID);
    centerText(lockerText.c_str(), 290, 2, THEME_TEXT);
    
    lastQrUpdate = millis();
    forceRedraw = false;
  }
}

void drawInfoMode() {
  unsigned long long nowMs = (unsigned long long)time(NULL) * 1000ULL;
  bool showTimer = (currentUnlockCount > 0);
  
  if (forceRedraw) {
    tft.fillScreen(THEME_BG);
    
    tft.fillRect(0, 0, 240, 42, THEME_HEADER);
    centerText("LOCKNLEAVE", 14, 2, THEME_TEXT);
    
    if (showTimer) {
        // Leave space for timer
    } else {
        centerText("Waiting to unlock...", 45, 1, THEME_NEUTRAL);
    }
    
    drawKeypad();
    drawPinState();
    updateStatus("Enter PIN...", THEME_NEUTRAL);
    
    forceRedraw = false;
  }
  
  // Continuously update the timer
  if (showTimer) {
      long remainingSeconds = 0;
      if (currentSessionEnd > nowMs) {
          remainingSeconds = (long)((currentSessionEnd - nowMs) / 1000);
      }
      
      int hours = remainingSeconds / 3600;
      int minutes = (remainingSeconds % 3600) / 60;
      int seconds = remainingSeconds % 60;
      
      char timeStr[16];
      sprintf(timeStr, "%02d:%02d:%02d", hours, minutes, seconds);
      
      // Clear specifically the timer area (adjusted for larger size 2 font)
      tft.fillRect(0, 43, 240, 15, THEME_BG);
      centerText(timeStr, 43, 2, THEME_NEUTRAL);
  }
}

void drawTerminationMode() {
  if (forceRedraw) {
    tft.fillScreen(THEME_BG);
    
    tft.fillRect(0, 0, 240, 42, THEME_CANCEL);
    centerText("END SESSION", 14, 2, THEME_TEXT);

    centerText("Confirm PIN", 45, 2, THEME_NEUTRAL);
    
    drawKeypad();
    drawTerminationPinState();
    
    updateStatus("Enter PIN...", THEME_NEUTRAL);
    forceRedraw = false;
  }
}

/* ================= EXECUTIONS ================= */
void pollLockerStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.setReuse(true);
  String url = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + ".json?auth=" + String(FIREBASE_SECRET);
  
  http.begin(wifiClient, url);
  int httpCode = http.GET();
  String payload = http.getString();
  http.end();

  if (httpCode == 200 && payload.length() > 0 && payload != "null") {
    StaticJsonDocument<1024> doc;
    DeserializationError err = deserializeJson(doc, payload); 
    if (err) return; // Prevent corrupt JSON from resetting display mode
    
    const char* st = doc["status"];
    unsigned long long endTs = doc["sessionEnd"].as<unsigned long long>();
    
    // Check for Remote Commands
    const char* cmd = doc["command"];
    if (cmd && String(cmd) == "OPEN") {
      Serial.println("*** REMOTE OPEN COMMAND RECEIVED ***");
      unlockLocker(true);
    }
    
    if (endTs == 0) {
       long long start = doc["startTime"];
       long duration = doc["duration"]; 
       debugStartTime = start;
       debugDuration = duration;
       if (start > 0 && duration > 0) {
         endTs = (unsigned long long)start + (unsigned long long)duration;
       }
    } else {
       debugStartTime = doc["startTime"] | 0;
       debugDuration = doc["duration"] | 0;
    }
    
    int unlocks = doc["unlockCount"] | 0; 
    String newStatus = st ? String(st) : "AVAILABLE";
    
    if (newStatus != currentBackendStatus || unlocks != currentUnlockCount) {
      if (newStatus != currentBackendStatus) forceRedraw = true;
      if (unlocks != currentUnlockCount && currentBackendStatus == "ACTIVE") forceRedraw = true;
      
      currentBackendStatus = newStatus;
      bool sameSession = ((unsigned long long)endTs == currentSessionEnd);
      
      if (currentSessionEnd == 0 && endTs > 0) sameSession = true;
      currentSessionEnd = (unsigned long long)endTs;
      
      if (sameSession) {
        if (unlocks > currentUnlockCount) currentUnlockCount = unlocks;
      } else {
        currentUnlockCount = unlocks;
      }
      
      if (currentBackendStatus == "ACTIVE") {
        currentDisplayMode = DISP_INFO;
      } else {
        currentDisplayMode = DISP_QR;
        terminationMode = false;
        terminationPIN = "";
      }
    } else {
      if (currentBackendStatus == "ACTIVE") {
        currentSessionEnd = (unsigned long long)endTs;
        currentUnlockCount = unlocks;
      }
    }
  }
}

void checkPIN() {
  if (millis() < lockoutUntil) {
    long remaining = (lockoutUntil - millis()) / 1000;
    updateStatus("LOCKED: Wait " + String(remaining) + "s", THEME_CANCEL);
    delay(1000);
    enteredPIN = "";
    drawPinState();
    return;
  }
  
  updateStatus("Checking...", THEME_NEUTRAL);
  
  if (WiFi.status() != WL_CONNECTED) {
    updateStatus("WiFi Error", THEME_CANCEL);
    return;
  }
  
  HTTPClient http;
  http.setReuse(true);
  String url = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + ".json?auth=" + String(FIREBASE_SECRET);
  http.begin(wifiClient, url);
  int httpCode = http.GET();
  String payload = http.getString();
  http.end();
  
  if (httpCode == 200 && payload.length() > 0 && payload != "null") {
    StaticJsonDocument<1024> doc;
    deserializeJson(doc, payload);
    
    const char* firebasePIN = doc["pin"];
    const char* status = doc["status"];
    
    if (String(status) == "ACTIVE" && hashPIN(enteredPIN) == String(firebasePIN)) {
      failedAttempts = 0; // Clear attempts on success
      unsigned long long endTs = doc["sessionEnd"].as<unsigned long long>();
      if (endTs == 0) {
         long long start = doc["startTime"];
         long duration = doc["duration"]; 
         if (start > 0 && duration > 0) {
           endTs = (unsigned long long)start + (unsigned long long)duration;
         }
      }
      currentSessionEnd = endTs;
      currentBackendStatus = "ACTIVE";
      
      enteredPIN = ""; // Clear immediately on success
      
      updateStatus("Access Granted!", THEME_BTN_PRESS);
      delay(700);
      unlockLocker();
    } else {
      failedAttempts++;
      if (failedAttempts >= 3) {
        lockoutUntil = millis() + 30000; // 30 sec lockout
        failedAttempts = 0; // reset for next active period
        updateStatus("Locked Out (30s)", THEME_CANCEL);
      } else {
        updateStatus("Wrong PIN", THEME_CANCEL);
      }
      delay(2000);
      enteredPIN = "";
      drawPinState();
      
      if (millis() > lockoutUntil) {
        updateStatus("Enter PIN...", THEME_NEUTRAL);
      }
    }
  }
}

void checkTerminationPIN() {
  updateStatus("Checking...", THEME_NEUTRAL);

  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  http.setReuse(true);
  String url = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + ".json?auth=" + String(FIREBASE_SECRET);
  
  http.begin(wifiClient, url);
  int httpCode = http.GET();
  String payload = http.getString();
  http.end();
  
  if (httpCode == 200 && payload.length() > 0 && payload != "null") {
    StaticJsonDocument<1024> doc;
    deserializeJson(doc, payload);
    
    const char* firebasePIN = doc["pin"];
    const char* status = doc["status"];
    
    if (String(status) == "ACTIVE" && hashPIN(terminationPIN) == String(firebasePIN)) {
      updateStatus("Access Granted!", THEME_BTN_PRESS);
      delay(700);
      terminateSession();
    } else {
      updateStatus("Wrong PIN", THEME_CANCEL);
      delay(2000);
      terminationPIN = "";
      drawTerminationPinState();
      updateStatus("Enter PIN...", THEME_NEUTRAL);
    }
  }
}

void terminateSession() {
  if (WiFi.status() == WL_CONNECTED) {
     HTTPClient http;
     http.setReuse(true);
     String url = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + ".json?auth=" + String(FIREBASE_SECRET);
     String json = "{\"status\":\"AVAILABLE\",\"pin\":\"\",\"startTime\":0,\"sessionEnd\":0,\"duration\":0,\"unlockCount\":0}";
     
     http.begin(wifiClient, url);
     http.sendRequest("PATCH", json);
     http.end();
  }
  
  digitalWrite(LOCK_PIN, LOW);
  state = LOCKED;
  
  currentBackendStatus = "AVAILABLE";
  currentSessionEnd = 0;
  currentUnlockCount = 0;
  enteredPIN = "";
  terminationPIN = "";
  terminationMode = false;
  debugStartTime = 0;
  debugDuration = 0;
  
  tft.fillScreen(THEME_BG);
  centerText("Session", 120, 3, THEME_NEUTRAL);
  centerText("Terminated", 160, 3, THEME_NEUTRAL);
  delay(1500);
  
  currentDisplayMode = DISP_QR;
  forceRedraw = true;
}

void unlockLocker(bool clearCommand) {
  digitalWrite(LOCK_PIN, HIGH);
  unlockStart = millis();
  state = UNLOCKED;
  currentUnlockCount++; 
  
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setReuse(true);
    String url = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + ".json?auth=" + String(FIREBASE_SECRET);
    
    String jsonUpdate = "{\"unlockCount\":" + String(currentUnlockCount);
    
    if (clearCommand) {
      jsonUpdate += ",\"command\":null";
    }
    
    if (debugStartTime == 0) {
       unsigned long long nowUTC = (unsigned long long)time(NULL) * 1000ULL;
       unsigned long long newEndUTC = nowUTC;
       
       jsonUpdate += ",\"startTime\":" + String((unsigned long long)nowUTC);
       
       if (debugDuration > 0) {
          newEndUTC = nowUTC + (unsigned long long)debugDuration;
          jsonUpdate += ",\"sessionEnd\":" + String(newEndUTC);
       }
       
       debugStartTime = nowUTC;
       currentSessionEnd = newEndUTC; // Set local end immediately
    }
    
    jsonUpdate += "}";
    
    http.begin(wifiClient, url);
    http.sendRequest("PATCH", jsonUpdate);
    http.end();
    
    // --- IoT BLOCKCHAIN AUDIT LOG ---
    String logPayload = "{\"locker_id\":\"" + String(LOCKER_ID) + "\",\"timestamp\":" + String((unsigned long long)time(NULL) * 1000ULL) + ",\"action\":\"UNLOCK\"}";
    String newHash = generateBlockchainHash(lastBlockHash, logPayload);
    
    String blockJson = "{\"payload\":" + logPayload + ",\"previousHash\":\"" + lastBlockHash + "\",\"hash\":\"" + newHash + "\"}";
    String blockUrl = "https://" + String(FIREBASE_HOST) + "/blockchain_ledger/" + String(LOCKER_ID) + "_" + String(time(NULL)) + ".json?auth=" + String(FIREBASE_SECRET);
    
    http.begin(wifiClient, blockUrl);
    http.sendRequest("PUT", blockJson);
    http.end();
    
    lastBlockHash = newHash; // Step the physical ledger forward
    // --------------------------------
  }
  
  // Set current display to INFO mode and force a redraw to show the timer immediately
  currentDisplayMode = DISP_INFO;
  forceRedraw = true;
  
  tft.fillScreen(THEME_BTN_PRESS); // Full Green Background
  tft.setTextColor(THEME_TEXT);
  tft.setTextSize(3);
  tft.setCursor(45, 120); tft.print("UNLOCKED");
  tft.setTextSize(2);
  tft.setCursor(40, 160); tft.print("Open Locker Now");
}

void handleAutoLock() {
  if (millis() - unlockStart >= UNLOCK_TIME) {
    digitalWrite(LOCK_PIN, LOW); // Locking
    state = LOCKED;
    enteredPIN = "";
    forceRedraw = true;
  }
}

void checkSessionExpiration() {
  if (currentBackendStatus != "ACTIVE" || currentSessionEnd == 0) return;

  unsigned long long nowMs = (unsigned long long)time(NULL) * 1000ULL;
  if (nowMs > currentSessionEnd) {
    digitalWrite(LOCK_PIN, LOW);
    state = LOCKED;
    
    if (WiFi.status() == WL_CONNECTED) {
       HTTPClient http;
       http.setReuse(true);
       String url = "https://" + String(FIREBASE_HOST) + "/lockers/" + String(LOCKER_ID) + ".json?auth=" + String(FIREBASE_SECRET);
       String json = "{\"status\":\"AVAILABLE\",\"pin\":\"\",\"startTime\":0,\"sessionEnd\":0,\"duration\":0,\"unlockCount\":0}";
       http.begin(wifiClient, url);
       http.sendRequest("PATCH", json);
       http.end();
    }
    
    currentBackendStatus = "AVAILABLE";
    currentSessionEnd = 0;
    currentUnlockCount = 0;
    enteredPIN = "";
    terminationPIN = "";
    terminationMode = false;
    debugStartTime = 0;
    debugDuration = 0;
    
    currentDisplayMode = DISP_QR;
    forceRedraw = true;
  }
}
