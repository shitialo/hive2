#include <Wire.h>
#include <math.h>
#include <AccelStepper.h>
#include "Adafruit_SHT31.h"
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <ArduinoJson.h>
#include "time.h"

// Provide the token generation process info.
#include "addons/TokenHelper.h"
// Provide the RTDB payload printing info and other helper functions.
#include "addons/RTDBHelper.h"

// Pin Definitions for ESP32-S3
#define PH_PIN 1          // ADC1_CH0
#define VPD_PUMP_RELAY 19  
#define ACID_PUMP_RELAY 21 
#define BASE_PUMP_RELAY 20 
#define MIX_PUMP_RELAY 5  
#define TRIG_PIN 13        
#define ECHO_PIN 14        
#define LDR_PIN 8        // Changed to ADC1_CH1 for analog reading
#define STEPPER_STEP_PIN 4 
#define STEPPER_DIR_PIN 5  

// Constants (unchanged)
const unsigned long VPD_PUMP_DURATION = 5000;
const unsigned long MIX_PUMP_DURATION = 1000;
const unsigned long PH_CHECK_INTERVAL = 30000;
const unsigned long PH_WAIT_INTERVAL = 18000;
const float PH_LOWER_LIMIT = 5.5;
const float PH_UPPER_LIMIT = 6.5;
const float DOSAGE_RATE = 0.00025;
const float RESERVOIR_RADIUS = 20.0;
const float RESERVOIR_HEIGHT = 35.0;
const unsigned long RESERVOIR_CHECK_INTERVAL = 3600;
const unsigned long ROTATION_INTERVAL = 5000;
const int STEPS_PER_REVOLUTION = 200;
const int STEPS_90_DEGREES = STEPS_PER_REVOLUTION / 4;

// WiFi credentials
const char* ssid = "Tbag";
const char* password = "Dbcooper";

// Firebase credentials
#define FIREBASE_HOST "aero-23f92-default-rtdb.firebaseio.com"
#define FIREBASE_API_KEY "AIzaSyAcgvExvFKBu4ZuB1vC6_scQM9HPEgS9uc"
#define USER_EMAIL "davechrom99@gmail.com"
#define USER_PASSWORD "0736502088"

// Define Firebase Data object
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Global variables
Adafruit_SHT31 sht31 = Adafruit_SHT31();
AccelStepper stepper(AccelStepper::DRIVER, STEPPER_STEP_PIN, STEPPER_DIR_PIN);

unsigned long lastVPDCycleTime = 0;
unsigned long vpdCycleInterval = 120000;
unsigned long lastpHCheckTime = 0;
unsigned long lastReservoirCheckTime = 0;
unsigned long lastRotationTime = 0;
unsigned long lastDataUpdate = 0;
unsigned long ph_pump_duration = 0;  // Duration for pH pump operation in milliseconds
const unsigned long DATA_UPDATE_INTERVAL = 2000;

bool isVPDPumping = false;
bool isPHAdjusting = false;
bool isPHWaiting = false;

float temperature = 0.0;
float humidity = 0.0;
float vpd = 0.0;
float pH = 0.0;
float waterLevel = 0.0;
float reservoirVolume = 0.0;
int lightIntensity = 0;  // Changed from bool to int
float PH_TARGET = 6.0;
int LIGHT_THRESHOLD = 500;

void setup() {
  Serial.begin(115200);
  Wire.begin(41, 42);  // ESP32-S3 default I2C pins: SDA=41, SCL=42
  
  // Initialize WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Initialize Firebase
  config.api_key = FIREBASE_API_KEY;
  config.database_url = FIREBASE_HOST;

  // Sign in to Firebase
  Serial.println("Signing in to Firebase...");
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Wait for authentication to complete
  Serial.println("Waiting for authentication...");
  while (Firebase.ready() == false) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nFirebase ready!");
  
  // Initialize pins
  pinMode(VPD_PUMP_RELAY, OUTPUT);
  pinMode(ACID_PUMP_RELAY, OUTPUT);
  pinMode(BASE_PUMP_RELAY, OUTPUT);
  pinMode(MIX_PUMP_RELAY, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Set initial relay states
  digitalWrite(VPD_PUMP_RELAY, LOW);
  digitalWrite(ACID_PUMP_RELAY, LOW);
  digitalWrite(BASE_PUMP_RELAY, LOW);
  digitalWrite(MIX_PUMP_RELAY, HIGH);
  
  if (!sht31.begin(0x44)) {
    Serial.println("Couldn't find SHT31");
    while (1) delay(1);
  }
  
  // Initialize stepper
  stepper.setMaxSpeed(1000);
  stepper.setAcceleration(500);
  
  // Initialize ADC
  analogReadResolution(12); // ESP32 has 12-bit ADC
  
  // Initialize with status
  updateFirebaseStatus("Connected");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read and update sensor data
  temperature = sht31.readTemperature();
  humidity = sht31.readHumidity();
  vpd = calculateVPD(temperature, humidity);
  pH = readpH();
  waterLevel = measureWaterLevel();
  reservoirVolume = calculateReservoirVolume(waterLevel);
  lightIntensity = analogRead(LDR_PIN);

  handleVPDControl(currentTime);
  handlePHControl(currentTime);
  checkReservoirVolume(currentTime);
  checkLightAndRotate(currentTime);
  
  // Update Firebase if interval has passed
  if (currentTime - lastDataUpdate >= DATA_UPDATE_INTERVAL) {
    updateFirebaseData();
    lastDataUpdate = currentTime;
  }
  
  stepper.run();
  
  // Check for control updates from Firebase
  if (Firebase.RTDB.getBool(&fbdo, "/control/lightThresholdUpdate")) {
    if (fbdo.dataType() == "boolean" && fbdo.boolData()) {
      updateLightThreshold();
      Firebase.RTDB.setBool(&fbdo, "/control/lightThresholdUpdate", false);
    }
  }
  
  if (Firebase.RTDB.getBool(&fbdo, "/control/pHTargetUpdate")) {
    if (fbdo.dataType() == "boolean" && fbdo.boolData()) {
      updatePHTarget();
      Firebase.RTDB.setBool(&fbdo, "/control/pHTargetUpdate", false);
    }
  }
}

void updateFirebaseData() {
  if (Firebase.ready()) {
    FirebaseJson json;
    json.set("temperature", temperature);
    json.set("humidity", humidity);
    json.set("vpd", vpd);
    json.set("ph", pH);
    json.set("waterLevel", waterLevel);
    json.set("reservoirVolume", reservoirVolume);
    json.set("lightIntensity", lightIntensity);
    json.set("vpdPumpRunning", isVPDPumping);
    json.set("phAdjusting", isPHAdjusting);
    json.set("timestamp", (int)time(nullptr));
    
    if (Firebase.RTDB.setJSON(&fbdo, "/sensor_readings", &json)) {
      Serial.println("Data updated successfully");
    } else {
      Serial.printf("Data update failed: %s\n", fbdo.errorReason().c_str());
    }
  } else {
    Serial.println("Firebase not ready for data update");
  }
}

void updateFirebaseStatus(const char* status) {
  if (Firebase.ready()) {
    FirebaseJson json;
    json.set("status", status);
    json.set("timestamp", (int)time(nullptr));
    json.set("vpdPumpRunning", isVPDPumping);
    json.set("phAdjusting", isPHAdjusting);
    
    if (Firebase.RTDB.setJSON(&fbdo, "/system_status", &json)) {
      Serial.println("Status updated successfully");
    } else {
      Serial.printf("Status update failed: %s\n", fbdo.errorReason().c_str());
    }
  } else {
    Serial.println("Firebase not ready for status update");
  }
}

void updateLightThreshold() {
  if (Firebase.RTDB.getInt(&fbdo, "/control/lightThreshold")) {
    if (fbdo.dataType() == "int") {
      LIGHT_THRESHOLD = fbdo.intData();
      Serial.printf("Light threshold updated to: %d\n", LIGHT_THRESHOLD);
    }
  }
}

void updatePHTarget() {
  if (Firebase.RTDB.getFloat(&fbdo, "/control/pHTarget")) {
    if (fbdo.dataType() == "float") {
      PH_TARGET = fbdo.floatData();
      Serial.printf("pH target updated to: %.2f\n", PH_TARGET);
    }
  }
}

// Modified pH reading for ESP32's 12-bit ADC
float readpH() {
  int sensorValue = analogRead(PH_PIN);
  // ESP32 ADC is 12-bit (0-4095)
  return map(sensorValue, 0, 4095, 0, 14);
}

void checkLightAndRotate(unsigned long currentTime) {
  if (currentTime - lastRotationTime >= ROTATION_INTERVAL) {
    lastRotationTime = currentTime;
    
    int lightLevel = analogRead(LDR_PIN);
    Serial.printf("Light intensity: %d\n", lightLevel);

    if (lightLevel > LIGHT_THRESHOLD) {
      stepper.moveTo(stepper.currentPosition() + STEPS_90_DEGREES);
      while (stepper.distanceToGo() != 0) {
        stepper.run();
      }
      Serial.println("Rotated 90 degrees");
    } else {
      Serial.println("Insufficient light, not rotating");
    }
  }
}

void handleVPDControl(unsigned long currentTime) {
  if (currentTime - lastVPDCycleTime >= vpdCycleInterval) {
    lastVPDCycleTime = currentTime;
    
    float humidity = sht31.readHumidity();
    float temperature = sht31.readTemperature();

    if (!isnan(humidity) && !isnan(temperature)) {
      float vpd = calculateVPD(temperature, humidity);
      updateVPDCycleInterval(vpd);
      
      Serial.printf("Humidity: %.1f%%, Temperature: %.1f°C, VPD: %.2f kPa\n", 
                   humidity, temperature, vpd);
    } else {
      Serial.println("Failed to read from SHT31 sensor!");
    }

    digitalWrite(VPD_PUMP_RELAY, HIGH);
    isVPDPumping = true;
    Serial.println("VPD Pump activated");
  }

  if (isVPDPumping && currentTime - lastVPDCycleTime >= VPD_PUMP_DURATION) {
    digitalWrite(VPD_PUMP_RELAY, LOW);
    isVPDPumping = false;
    Serial.println("VPD Pump deactivated");
  }
}

void handlePHControl(unsigned long currentTime) {
  if (!isPHAdjusting && !isPHWaiting && currentTime - lastpHCheckTime >= PH_CHECK_INTERVAL) {
    checkAndAdjustPH(currentTime);
  }

  if (isPHWaiting && currentTime - lastpHCheckTime >= PH_WAIT_INTERVAL) {
    isPHWaiting = false;
    checkAndAdjustPH(currentTime);
  }

  if (isPHAdjusting && currentTime - lastpHCheckTime >= ph_pump_duration) {
    digitalWrite(ACID_PUMP_RELAY, LOW);
    digitalWrite(BASE_PUMP_RELAY, LOW);
    digitalWrite(MIX_PUMP_RELAY, LOW);
    
    delay(MIX_PUMP_DURATION);
    
    digitalWrite(MIX_PUMP_RELAY, HIGH);
    isPHAdjusting = false;
    isPHWaiting = true;
    Serial.println("pH adjustment cycle completed, waiting before rechecking");
    
    // Update Firebase status after pH adjustment
    updateFirebaseStatus("Active");
  }
}

void checkReservoirVolume(unsigned long currentTime) {
  if (currentTime - lastReservoirCheckTime >= RESERVOIR_CHECK_INTERVAL) {
    lastReservoirCheckTime = currentTime;
    
    float waterLevel = measureWaterLevel();
    float volume = calculateReservoirVolume(waterLevel);
    
    Serial.printf("Water Level: %.1f cm, Volume: %.1f liters\n", waterLevel, volume);
    
    // Calculate pump duration based on reservoir volume
    ph_pump_duration = (unsigned long)(volume * DOSAGE_RATE * 1000000.0); // Convert to milliseconds
    Serial.printf("Updated pH pump duration: %lu ms\n", ph_pump_duration);
  }
}

void checkAndAdjustPH(unsigned long currentTime) {
  lastpHCheckTime = currentTime;
  float currentPH = readpH();
  Serial.printf("Current pH: %.2f\n", currentPH);

  if (currentPH < PH_LOWER_LIMIT || currentPH > PH_UPPER_LIMIT) {
    if (currentPH < PH_TARGET) {
      Serial.println("pH too low, activating base pump");
      digitalWrite(BASE_PUMP_RELAY, HIGH);
    } else {
      Serial.println("pH too high, activating acid pump");
      digitalWrite(ACID_PUMP_RELAY, HIGH);
    }
    isPHAdjusting = true;
    
    Serial.printf("Dosing for %lu ms based on current reservoir volume\n", ph_pump_duration);
    updateFirebaseStatus("pH Adjusting");
  } else {
    Serial.println("pH within acceptable range");
  }
}

float calculateVPD(float temperature, float humidity) {
  float svp = 0.6108 * exp(17.27 * temperature / (temperature + 237.3)); 
  float avp = (humidity / 100.0) * svp;
  return svp - avp;
}

void updateVPDCycleInterval(float vpd) {
  vpdCycleInterval = (vpd > 1.5) ? 6000 : (vpd < 0.8) ? 18000 : 12000;
  Serial.printf("New VPD cycle interval: %d seconds\n", vpdCycleInterval / 1000);
}

float measureWaterLevel() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  return RESERVOIR_HEIGHT - (duration * 0.034 / 2);
}

float calculateReservoirVolume(float waterLevel) {
  return PI * RESERVOIR_RADIUS * RESERVOIR_RADIUS * waterLevel / 1000.0;
}