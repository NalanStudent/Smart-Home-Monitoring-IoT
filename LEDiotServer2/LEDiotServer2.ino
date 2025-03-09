#include <SPI.h>
#include <WiFiNINA.h>
#include <WiFiClient.h>
#include "DHT.h"


// NETWORK CONFIGURATION
const char* ssid = "IoT Smart Home";
const char* password = "0987654321";

char server[] = "192.168.137.1"; // Server IP address
int port = 3000;

WiFiClient client;


// ---------- //


// DHT Sensor Configuration
#define DHTPIN 2     // Pin connected to the data pin of the sensor
#define DHTTYPE DHT11   // DHT11 or DHT22
DHT dht(DHTPIN, DHTTYPE);

// LDR Configuration
const int ldrPin = A0;  // Pin connected to the LDR
int ldrValue = 0;       // Variable to store the LDR reading
float lightIntensity = 0.0; // Variable to store calculated light intensity


// LED Configuration
const int ledPin = 12 ;  // Built-in LED pin on the Arduino UNO WiFi Rev2
String previousLEDStatus = "";   // Store the last known LED status



void setup() {

  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  while (WiFi.begin(ssid, password) != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  // Print the IP address assigned to the Arduino
  Serial.print("Arduino IP Address: ");
  Serial.println(WiFi.localIP());

  // Print the Gateway IP address (usually your router's IP, but in your case, it will also show your laptop's IP if it's acting as a server)
  Serial.print("Gateway IP Address: ");
  Serial.println(WiFi.gatewayIP());


  dht.begin();

}

void loop() {
  
  getLEDStatusFromServer();
  
  // Read humidity and temperature from DHT sensor
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  // Check if DHT sensor readings are valid
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    // Print humidity and temperature readings
    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.print(" %\t");
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" *C");
  }

  // Read light intensity from LDR
  ldrValue = analogRead(ldrPin);

  // Convert LDR reading to light intensity (custom calculation)
  lightIntensity = ldrValue/500.00 * 100 ; // calculate percentage - plus 1 to avoid infinity

  Serial.print("LDR Value: ");
  Serial.print(ldrValue);
  Serial.print("\tLight Intensity: ");
  Serial.println(lightIntensity);

  // Send sensor data to the server
  sendSensorDataToServer(temperature, humidity, lightIntensity);

  delay(2000); // 2 seconds delay
}

void getLEDStatusFromServer() {
  if (client.connect(server, port)) {
    client.println("GET /ledStatus HTTP/1.1");
    client.println("Host: " + String(server));
    client.println("Connection: close");
    client.println();

    while (client.connected() && !client.available()) {
      delay(1); // Wait for server response
    }

    while (client.available()) {
      String line = client.readStringUntil('\r');
      if (line.indexOf("{\"status\":") >= 0) {
        String status = line.substring(line.indexOf(":") + 2, line.indexOf("\"}"));
        if (status != previousLEDStatus) {  // Check if the status has changed
          Serial.println("LED Status: " + status);
          if (status == "on") {
            digitalWrite(ledPin, HIGH);
          } else if (status == "off") {
            digitalWrite(ledPin, LOW);
          }
          previousLEDStatus = status;  // Update the previous status
        }
      }
    }
    client.stop();
  } else {
    Serial.println("Failed connection - LED status not received from server !");
  }
}

void sendSensorDataToServer(float temperature, float humidity, float lightIntensity) {
  if (client.connect(server, port)) {
    client.println("POST /data HTTP/1.1");
    client.println("Host: " + String(server));
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    String jsonData = "{\"temperature\":" + String(temperature) + ",\"humidity\":" + String(humidity) + ",\"lightIntensity\":" + String(lightIntensity) + "}";
    client.println(jsonData.length());
    client.println();
    client.println(jsonData);
    client.stop();
  } else {
    Serial.println("Failed connection - Sensor data not sent to server !");
  }
}
