#include <WiFi.h>
#include <Wire.h>
#include <math.h>
#include <AccelStepper.h>
#include <Adafruit_SHT31.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>

// Pin Definitions for ESP32-S3
#define PH_PIN 1          
#define VPD_PUMP_RELAY 19  
#define ACID_PUMP_RELAY 21 
#define BASE_PUMP_RELAY 20 
#define MIX_PUMP_RELAY 5  
#define TRIG_PIN 13        
#define ECHO_PIN 14        
#define LDR_PIN 8         
#define STEPPER_STEP_PIN 4 
#define STEPPER_DIR_PIN 5  

// Constants
#define VPD_PUMP_DURATION 5000
#define MIX_PUMP_DURATION 1000
#define PH_CHECK_INTERVAL 30000
#define PH_WAIT_INTERVAL 18000
#define PH_LOWER_LIMIT 5.5
#define PH_UPPER_LIMIT 6.5
#define DOSAGE_RATE 0.00025
#define RESERVOIR_RADIUS 20.0
#define RESERVOIR_HEIGHT 35.0
#define RESERVOIR_CHECK_INTERVAL 3600
#define ROTATION_INTERVAL 5000
#define STEPS_PER_REVOLUTION 200
#define STEPS_90_DEGREES (STEPS_PER_REVOLUTION / 4)

// WiFi and MQTT credentials
const char* ssid = "Tbag";
const char* password = "Dbcooper";
const char* mqtt_server = "7d79ddcf8af4477491bd13dfe5fa8ba8.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_username = "admin";
const char* mqtt_password = "Admin123";
const char* mqtt_topic = "hydroponic/data";

// Root CA Certificate for HiveMQ
const char* root_ca = R"(-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----)";

// Global objects
Adafruit_SHT31 sht31 = Adafruit_SHT31();
AccelStepper stepper(AccelStepper::DRIVER, STEPPER_STEP_PIN, STEPPER_DIR_PIN);
WiFiClientSecure espClient;
PubSubClient client(espClient);

// Global variables
unsigned long lastVPDCycleTime = 0;
unsigned long vpdCycleInterval = 120;
unsigned long lastpHCheckTime = 0;
unsigned long lastReservoirCheckTime = 0;
unsigned long lastRotationTime = 0;
unsigned long lastPublishTime = 0;
unsigned long lastReadTime = 0;
int currentPosition = 0;

bool isVPDPumping = false;
bool isPHAdjusting = false;
bool isPHWaiting = false;

float temperature = 0.0;
float humidity = 0.0;
float vpd = 0.0;
float pH = 0.0;
float waterLevel = 0.0;
float reservoirVolume = 0.0;
int lightIntensity = 0;
float PH_TARGET = 6.0;

void setup() {
  Serial.begin(115200);
  Wire.begin(41, 42);
  delay(2000);  // Give time for Serial to initialize
  
  // Initialize random for client ID generation
  randomSeed(micros());
  
  // Initialize pins
  pinMode(VPD_PUMP_RELAY, OUTPUT);
  pinMode(ACID_PUMP_RELAY, OUTPUT);
  pinMode(BASE_PUMP_RELAY, OUTPUT);
  pinMode(MIX_PUMP_RELAY, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  
  // Initialize all relays to OFF
  digitalWrite(VPD_PUMP_RELAY, LOW);
  digitalWrite(ACID_PUMP_RELAY, LOW);
  digitalWrite(BASE_PUMP_RELAY, LOW);
  digitalWrite(MIX_PUMP_RELAY, LOW);
  
  // Initialize SHT31 sensor
  if (!sht31.begin(0x44)) {
    Serial.println("Couldn't find SHT31 sensor!");
    while (1) delay(1);
  }
  Serial.println("SHT31 sensor initialized");
  
  // Initialize stepper motor
  stepper.setMaxSpeed(1000);
  stepper.setAcceleration(500);
  Serial.println("Stepper initialized");
  
  // Setup WiFi security
  espClient.setCACert(root_ca);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setKeepAlive(60);  // Set keepalive to 60 seconds
  
  // Set the buffer sizes
  client.setBufferSize(512);  // Increase buffer size if needed
  
  Serial.println("Setup complete!");
  Serial.printf("MQTT Server: %s\n", mqtt_server);
  Serial.printf("MQTT Port: %d\n", mqtt_port);
}

void loop() {
  unsigned long currentTime = millis();
  
  if (!client.connected()) {
    Serial.println("MQTT disconnected, reconnecting...");
    reconnectMQTT();
  }
  
  // Process any incoming messages
  client.loop();
  
  // Read and publish sensor data every 5 seconds
  if (currentTime - lastReadTime >= 5000) {
    readSensors();
    publishData();  // Separated publish from readSensors
    lastReadTime = currentTime;
  }
  
  // Handle VPD control
  handleVPDControl(currentTime);
  
  // Handle pH control
  handlePHControl(currentTime);
  
  // Check light levels and rotate if needed
  checkLightAndRotate(currentTime);
  
  // Check reservoir volume
  checkReservoirVolume(currentTime);
}

void readSensors() {
  Serial.println("\n--- Reading Sensors ---");
  
  // Read temperature and humidity from SHT31
  float temperature = sht31.readTemperature();
  float humidity = sht31.readHumidity();
  
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from SHT31 sensor!");
    return;
  }
  
  Serial.printf("Temperature: %.2f°C\n", temperature);
  Serial.printf("Humidity: %.2f%%\n", humidity);
  
  // Calculate VPD
  float vpd = calculateVPD(temperature, humidity);
  Serial.printf("VPD: %.2f kPa\n", vpd);
  
  // Read pH
  float ph = readpH();
  Serial.printf("pH: %.2f\n", ph);
  
  // Measure water level and calculate volume
  float waterLevel = measureWaterLevel();
  float reservoirVolume = calculateReservoirVolume(waterLevel);
  Serial.printf("Water Level: %.2f cm\n", waterLevel);
  Serial.printf("Reservoir Volume: %.2f L\n", reservoirVolume);
  
  // Read light intensity
  int lightIntensity = analogRead(LDR_PIN);
  Serial.printf("Light Intensity: %d\n", lightIntensity);
}

void publishData() {
  if (!client.connected()) {
    Serial.println("MQTT disconnected, reconnecting...");
    reconnectMQTT();
    if (!client.connected()) {
      Serial.println("Failed to reconnect to MQTT!");
      return;
    }
  }

  // Create JSON document
  StaticJsonDocument<256> doc;
  doc["timestamp"] = millis();
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["vpd"] = vpd;
  doc["ph"] = pH;
  doc["waterLevel"] = waterLevel;
  doc["reservoirVolume"] = reservoirVolume;
  doc["lightIntensity"] = lightIntensity;
  doc["vpdPumpRunning"] = digitalRead(VPD_PUMP_RELAY) == HIGH;
  doc["phAdjusting"] = (digitalRead(ACID_PUMP_RELAY) == HIGH || digitalRead(BASE_PUMP_RELAY) == HIGH);

  // Serialize and publish
  char buffer[256];
  serializeJson(doc, buffer);
  
  Serial.println("Attempting to publish data:");
  Serial.println(buffer);
  
  if (client.publish(mqtt_topic, buffer, true)) {  // Added retained flag
    Serial.println("Data published successfully");
    Serial.printf("Message size: %d bytes\n", strlen(buffer));
  } else {
    Serial.println("Failed to publish data!");
    Serial.printf("MQTT state: %d\n", client.state());
  }
}

float calculateVPD(float temperature, float humidity) {
  // VPD calculation
  float es = 0.6108 * exp((17.27 * temperature) / (temperature + 237.3));
  float ea = (humidity / 100.0) * es;
  return es - ea;
}

float readpH() {
  // Read pH sensor (analog value)
  float voltage = analogRead(PH_PIN) * 3.3 / 4095.0;
  // Convert voltage to pH (calibration needed)
  return 7.0 + ((2.5 - voltage) / 0.18);
}

float measureWaterLevel() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2;
  
  // Convert distance to water level (assuming sensor is at top)
  return RESERVOIR_HEIGHT - distance;
}

float calculateReservoirVolume(float waterLevel) {
  // Calculate volume of cylinder (πr²h)
  return PI * pow(RESERVOIR_RADIUS, 2) * waterLevel / 1000.0; // Convert to liters
}

void handleVPDControl(unsigned long currentTime) {
  if (currentTime - lastVPDCycleTime >= vpdCycleInterval * 1000) {
    float vpd = calculateVPD(sht31.readTemperature(), sht31.readHumidity());
    Serial.printf("VPD Check: %.2f kPa\n", vpd);
    
    if (vpd > 1.2) {
      Serial.println("VPD too high, activating misting...");
      digitalWrite(VPD_PUMP_RELAY, HIGH);
      delay(VPD_PUMP_DURATION);
      digitalWrite(VPD_PUMP_RELAY, LOW);
      Serial.println("Misting complete");
    }
    
    lastVPDCycleTime = currentTime;
  }
}

void handlePHControl(unsigned long currentTime) {
  if (currentTime - lastpHCheckTime >= PH_CHECK_INTERVAL) {
    float ph = readpH();
    Serial.printf("pH Check: %.2f\n", ph);
    
    if (ph < PH_LOWER_LIMIT) {
      Serial.println("pH too low, adding base...");
      digitalWrite(BASE_PUMP_RELAY, HIGH);
      delay(PH_WAIT_INTERVAL);
      digitalWrite(BASE_PUMP_RELAY, LOW);
    } else if (ph > PH_UPPER_LIMIT) {
      Serial.println("pH too high, adding acid...");
      digitalWrite(ACID_PUMP_RELAY, HIGH);
      delay(PH_WAIT_INTERVAL);
      digitalWrite(ACID_PUMP_RELAY, LOW);
    }
    
    // Run mix pump
    Serial.println("Running mix pump...");
    digitalWrite(MIX_PUMP_RELAY, HIGH);
    delay(MIX_PUMP_DURATION);
    digitalWrite(MIX_PUMP_RELAY, LOW);
    Serial.println("Mixing complete");
    
    lastpHCheckTime = currentTime;
  }
}

void checkLightAndRotate(unsigned long currentTime) {
  if (currentTime - lastRotationTime >= ROTATION_INTERVAL) {
    int lightLevel = analogRead(LDR_PIN);
    
    if (lightLevel < 500) { // Threshold for low light
      // Rotate 90 degrees
      stepper.moveTo(currentPosition + STEPS_90_DEGREES);
      while (stepper.distanceToGo() != 0) {
        stepper.run();
      }
      currentPosition = stepper.currentPosition();
    }
    
    lastRotationTime = currentTime;
  }
}

void connectToWiFi() {
  Serial.printf("Connecting to WiFi %s\n", ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected");
  Serial.printf("IP address: %s\n", WiFi.localIP().toString().c_str());
}

void reconnectMQTT() {
  int retries = 0;
  while (!client.connected() && retries < 3) {
    Serial.print("Attempting MQTT connection...");
    
    // Create a random client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    // Attempt to connect with credentials
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");
      
      // Subscribe to any control topics if needed
      // client.subscribe("hydroponic/control");
      
      // Publish a connection message
      StaticJsonDocument<128> doc;
      doc["status"] = "connected";
      doc["id"] = clientId;
      char buffer[128];
      serializeJson(doc, buffer);
      
      if (client.publish("hydroponic/status", buffer)) {
        Serial.println("Connection status published");
      } else {
        Serial.println("Failed to publish connection status");
      }
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      retries++;
      delay(5000);
    }
  }
}

void checkReservoirVolume(unsigned long currentTime) {
  // Implement reservoir volume check logic here
}