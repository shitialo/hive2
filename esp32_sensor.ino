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
  
  // Initialize pins
  pinMode(VPD_PUMP_RELAY, OUTPUT);
  pinMode(ACID_PUMP_RELAY, OUTPUT);
  pinMode(BASE_PUMP_RELAY, OUTPUT);
  pinMode(MIX_PUMP_RELAY, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  digitalWrite(VPD_PUMP_RELAY, LOW);
  digitalWrite(ACID_PUMP_RELAY, LOW);
  digitalWrite(BASE_PUMP_RELAY, LOW);
  digitalWrite(MIX_PUMP_RELAY, HIGH);
  
  // Initialize SHT31
  if (!sht31.begin(0x44)) {
    Serial.println("Couldn't find SHT31");
    while (1) delay(1);
  }
  
  // Initialize stepper
  stepper.setMaxSpeed(1000);
  stepper.setAcceleration(500);

  // Initialize ADC
  analogReadResolution(12);

  // Configure SSL and MQTT
  espClient.setCACert(root_ca);
  client.setServer(mqtt_server, mqtt_port);
  
  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  unsigned long currentTime = millis();
  
  // Read all sensors
  readSensors();
  
  // Control systems
  handleVPDControl(currentTime);
  handlePHControl(currentTime);
  checkReservoirVolume(currentTime);
  checkLightAndRotate(currentTime);
  
  // Run stepper if needed
  stepper.run();
  
  // Publish data every 5 seconds
  if (currentTime - lastPublishTime >= 5000) {
    publishData();
    lastPublishTime = currentTime;
  }
}

void readSensors() {
  temperature = sht31.readTemperature();
  humidity = sht31.readHumidity();
  vpd = calculateVPD(temperature, humidity);
  pH = readpH();
  waterLevel = measureWaterLevel();
  reservoirVolume = calculateReservoirVolume(waterLevel);
  lightIntensity = analogRead(LDR_PIN);
}

void publishData() {
  StaticJsonDocument<512> doc;
  
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["vpd"] = vpd;
  doc["pH"] = pH;
  doc["waterLevel"] = waterLevel;
  doc["reservoirVolume"] = reservoirVolume;
  doc["lightIntensity"] = lightIntensity;
  doc["isVPDPumping"] = isVPDPumping;
  doc["isPHAdjusting"] = isPHAdjusting;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  client.publish(mqtt_topic, jsonString.c_str());
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
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

float calculateVPD(float temperature, float humidity) {
  float es = 0.6108 * exp(17.27 * temperature / (temperature + 237.3));
  float ea = es * (humidity / 100.0);
  return es - ea;
}

float readpH() {
  int sensorValue = analogRead(PH_PIN);
  return map(sensorValue, 0, 4095, 0, 14);
}

float measureWaterLevel() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  return duration * 0.034 / 2;
}

float calculateReservoirVolume(float waterLevel) {
  return PI * pow(RESERVOIR_RADIUS, 2) * waterLevel;
}

void handleVPDControl(unsigned long currentTime) {
  // Implement VPD control logic here
}

void handlePHControl(unsigned long currentTime) {
  // Implement pH control logic here
}

void checkReservoirVolume(unsigned long currentTime) {
  // Implement reservoir volume check logic here
}

void checkLightAndRotate(unsigned long currentTime) {
  // Implement light check and rotation logic here
}