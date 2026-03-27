#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <XPT2046_Touchscreen.h>

// Screen Pins
#define TFT_CS    15
#define TFT_DC    2
#define TFT_RST   4

// Touch Pins
#define TOUCH_CS  21
// Note: We deliberately exclude TOUCH_IRQ so we run in 100% reliable software polling mode.

// Hardware Objects
Adafruit_ST7789 tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_RST);
XPT2046_Touchscreen ts(TOUCH_CS);

void setup() {
  Serial.begin(115200);   // Important: Set Serial Monitor to 115200 baud
  delay(1000);
  
  Serial.println("\n\n=======================================");
  Serial.println("Starting Touch Screen Hardware Diagnostics");
  Serial.println("=======================================\n");

  // Start the physical SPI Hardware pins
  SPI.begin(18, 19, 23); 
  
  // Start up the LCD display
  tft.init(240, 320); 
  tft.setRotation(2);     // Upright portrait orientation
  uint8_t madctl = 0x88; 
  tft.sendCommand(0x36, &madctl, 1); 
  tft.invertDisplay(true);
  
  // Paint Background Black
  tft.fillScreen(0x0000); 

  tft.setTextColor(0xFFFF); // White
  tft.setTextSize(2);
  tft.setCursor(20, 20);
  tft.print("Hardware Test");

  tft.setTextSize(1);
  tft.setCursor(10, 60);
  tft.print("Starting Touch Sensor...");
  
  // ----------------------------------------------------
  // IMPORTANT DIAGNOSTIC: Does the Sensor literally exist?
  // ----------------------------------------------------
  if (!ts.begin()) {
    Serial.println("\n>>> FATAL ERROR: TOUCH CONTROLLER UNREACHABLE <<<");
    Serial.println("- Check jumper wire on GPIO 21 (TOUCH_CS)!");
    Serial.println("- Check SPI wires (MISO 19, MOSI 23, CLK 18)!");
    
    tft.setTextColor(0xF800); // Red
    tft.setCursor(10, 80);
    tft.print("ERROR: SENSOR DEAD!");
    tft.setCursor(10, 100);
    tft.print("- Check GPIO 21");
    tft.setCursor(10, 115);
    tft.print("- Check MISO/MOSI wires");
  } else {
    Serial.println("\n>>> SUCCESS: TOUCH CONTROLLER ONLINE <<<");
    Serial.println("Now gently touch the screen glass to test output...");
    
    tft.setTextColor(0x07E0); // Green
    tft.setCursor(10, 80);
    tft.print("TOUCH ONLINE - DRAW NOW");
  }
  
  ts.setRotation(2);
}

void loop() {
  if (ts.touched()) {
    TS_Point p = ts.getPoint();
    
    // Print the RAW hardware values back to your computer
    Serial.print("Touch! -> Z-Pressure: "); Serial.print(p.z);
    Serial.print(" | RawX: "); Serial.print(p.x);
    Serial.print(" | RawY: "); Serial.println(p.y);
    
    // Map raw hardware numbers to 240x320 pixels
    int tx = map(p.x, 300, 3800, 0, 240); 
    int ty = map(p.y, 3800, 300, 0, 320); 

    // Draw a small red box exactly where the screen mathematically thinks your finger is
    tft.fillRect(tx - 2, ty - 2, 4, 4, 0xF800); 

    delay(20); // Very short debounce so you can effectively "paint" on the screen
  }
}
