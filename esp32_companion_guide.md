# 🎙️ ESP32-S3 AI Robot Companion (Kiki) Integration Guide

This guide details how to build, connect, and configure the ESP32-S3 hardware companion device to talk to the Kiki AI platform backend.

---

## 1. Hardware Pinout Configuration

### A. I2S INMP441 Microphone Connection
The INMP441 is an omnidirectional microphone with an I2S digital interface.
| INMP441 Pin | ESP32-S3 GPIO | Note |
| :--- | :--- | :--- |
| **VDD** | 3.3V | Power Supply |
| **GND** | GND | Ground |
| **L/R** | GND | Left Channel select |
| **SCK** | GPIO 4 | Serial Clock (BCLK) |
| **WS** | GPIO 5 | Word Select (LRCLK) |
| **SD** | GPIO 6 | Serial Data (DIN) |

### B. I2S MAX98357A Amplifier & 3W Speaker
The MAX98357A is an easy-to-use digital-to-analog converter (DAC) that connects directly to a speaker.
| MAX98357A Pin | ESP32-S3 GPIO | Note |
| :--- | :--- | :--- |
| **VIN** | 5V | Power Supply (5V for 3W output) |
| **GND** | GND | Ground |
| **LRC** | GPIO 15 | Left/Right Clock (WS) |
| **BCLK** | GPIO 16 | Bit Clock (SCK) |
| **DIN** | GPIO 17 | Data Input (SD) |
| **GAIN** | Floating | Default Gain (+9dB) |

### C. 2.4" TFT LCD Display (SPI - ILI9341 Driver)
For rendering animated eye states.
| ILI9341 Pin | ESP32-S3 GPIO | Note |
| :--- | :--- | :--- |
| **VCC** | 3.3V / 5V | Power Supply |
| **GND** | GND | Ground |
| **CS** | GPIO 10 | Chip Select |
| **RESET** | GPIO 9 | Hardware Reset |
| **DC** | GPIO 11 | Data / Command |
| **SDI (MOSI)**| GPIO 13 | SPI Master Out Slave In |
| **SCK** | GPIO 12 | SPI Serial Clock |
| **LED** | 3.3V | Backlight Power |

### D. Push To Talk (PTT) Button
| Button Pin | ESP32-S3 GPIO | Note |
| :--- | :--- | :--- |
| **Terminal A** | GPIO 1 | Input Pin (Active Low) |
| **Terminal B** | GND | Ground |

---

## 2. API Specification

All request endpoints expect API Key authentication:
*   **Header Name:** `x-api-key`
*   **Query Parameter:** `apiKey` (e.g. `/api/robot/message?apiKey=kiki-key-2026`)
*   **Default API Key:** `kiki-key-2026` (Loaded via `ROBOT_API_KEY` env variable)

---

### A. Robot Interaction Endpoint

#### `POST /api/robot/message`
Establishes a chat request, processes context/memory, and returns the response with emotion and eye state metadata.

**Headers:**
```http
Content-Type: application/json
x-api-key: kiki-key-2026
```

**Request Payload:**
```json
{
  "robotId": "robot001",
  "message": "Hi Kiki, my name is Alex and I love pizza!"
}
```

**JSON Response (200 OK):**
```json
{
  "reply": "Hiiiii Alex! 😊 I love pizza too! Nice to meet you! ✨",
  "emotion": "excited",
  "eyeState": "excited",
  "audioUrl": "http://192.168.1.100:3000/audio/tts-uuid.mp3"
}
```

---

### B. Speech to Text (STT) Endpoint

#### `POST /api/stt`
Transcribes binary audio stream (WAV/MP3/WEBM/PCM) or multipart form file input into text using the Gemini 1.5 Flash Audio API.

**Headers (Binary Stream):**
```http
Content-Type: audio/wav
x-api-key: kiki-key-2026
```

**JSON Response (200 OK):**
```json
{
  "text": "Hello robot"
}
```

---

### C. Text to Speech (TTS) Endpoint

#### `POST /api/tts`
Converts text into spoken MP3 audio files using the backend speech synthesis engine (Google Translate TTS / local offline fallback).

**Headers:**
```http
Content-Type: application/json
x-api-key: kiki-key-2026
```

**Request Payload:**
```json
{
  "text": "Hello human, nice to meet you!"
}
```

**JSON Response (200 OK):**
```json
{
  "audioUrl": "http://192.168.1.100:3000/audio/tts-uuid.mp3"
}
```


---

## 3. Error Handling & HTTP Status Codes

The backend responds with standard HTTP status codes:
*   **`200 OK`**: Request succeeded. Response body contains valid data.
*   **`400 Bad Request`**: Missing required parameters (e.g. missing `robotId` or `message` on `/api/robot/message`).
*   **`401 Unauthorized`**: Missing or invalid `x-api-key` header or parameter.
*   **`429 Too Many Requests`**: Rate limit exceeded (Default: 60 requests per minute per IP).
*   **`500 Internal Server Error`**: Server or OpenAI API connection error.

**Example Error Response:**
```json
{
  "error": "Unauthorized. Missing or invalid API key."
}
```

---

## 4. TFT Animated Eye Display Characters
When receiving the `eyeState` value, map them to the following graphical representation on the TFT display screen:

| Emotion | Eye State Name | Character Pattern | Color Theme |
| :--- | :--- | :--- | :--- |
| **happy** | `happy` | `(^ ^)` | TFT_GREEN |
| **normal** | `normal` | `(◕ ◕)` | TFT_CYAN |
| **thinking** | `thinking` | `(•_•)` | TFT_YELLOW |
| **sleeping** | `sleeping` | `(- -)` | TFT_DARKGREY |
| **surprised**| `surprised`| `(O O)` | TFT_MAGENTA |
| **excited** | `excited` | `(* *)` | TFT_ORANGE |
| **confused** | `confused` | `(•?•)` | TFT_YELLOW |
| **sad** | `sad` | `(╥ ╥)` | TFT_RED |
| **listening**| `listening`| `(◕ ◕)` | TFT_CYAN |

---

## 5. Arduino ESP32 C++ Code Examples

Ensure you install these libraries in the Arduino IDE:
1. **ArduinoJson** (by Benoit Blanchon)
2. **TFT_eSPI** (by Bodmer) - Configure SPI Pins for ESP32-S3 in `User_Setup.h`.
3. **ESP32-audioI2S** (by Wolle) - For streaming and playing MP3 URLs.

```cpp
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TFT_eSPI.h>
#include "Audio.h"

// WiFi settings
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL configurations
const String kikiServer = "http://192.168.1.100:3000"; 
const String apiKey     = "kiki-key-2026";
const String robotId    = "robot001";

// MAX98357A I2S DAC Pin Configuration
#define I2S_BCLK 16
#define I2S_LRC  15
#define I2S_DOUT 17

TFT_eSPI tft = TFT_eSPI();
Audio audio;
bool isRecording = false;

void drawEyeState(String eyeState) {
  tft.fillScreen(TFT_BLACK);
  tft.setTextDatum(MC_DATUM);
  tft.setTextSize(3);

  String eyeText = "(◕ ◕)";
  tft.setTextColor(TFT_CYAN, TFT_BLACK);

  if (eyeState == "happy") {
    eyeText = "(^ ^)";
    tft.setTextColor(TFT_GREEN, TFT_BLACK);
  } else if (eyeState == "normal") {
    eyeText = "(◕ ◕)";
  } else if (eyeState == "thinking") {
    eyeText = "(•_•)";
    tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  } else if (eyeState == "sleeping") {
    eyeText = "(- -)";
    tft.setTextColor(TFT_DARKGREY, TFT_BLACK);
  } else if (eyeState == "surprised") {
    eyeText = "(O O)";
    tft.setTextColor(TFT_MAGENTA, TFT_BLACK);
  } else if (eyeState == "excited") {
    eyeText = "(* *)";
    tft.setTextColor(TFT_ORANGE, TFT_BLACK);
  } else if (eyeState == "confused") {
    eyeText = "(•?•)";
    tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  } else if (eyeState == "sad") {
    eyeText = "(╥ ╥)";
    tft.setTextColor(TFT_RED, TFT_BLACK);
  } else if (eyeState == "listening") {
    eyeText = "(◕ ◕) 🔊";
    tft.setTextColor(TFT_CYAN, TFT_BLACK);
  }

  tft.drawRoundRect(10, 20, 220, 120, 15, TFT_DARKCYAN);
  tft.drawString(eyeText, 120, 80);
}

// ----------------------------------------------------
// API CALL 1: Send Message to Companion API
// ----------------------------------------------------
void sendKikiMessage(String messageText) {
  if (WiFi.status() != WL_CONNECTED) return;

  drawEyeState("thinking");

  HTTPClient http;
  String url = kikiServer + "/api/robot/message";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", apiKey);

  StaticJsonDocument<256> doc;
  doc["robotId"] = robotId;
  doc["message"] = messageText;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode == 200) {
    String response = http.getString();
    StaticJsonDocument<512> filterDoc;
    deserializeJson(filterDoc, response);

    String reply = filterDoc["reply"];
    String eyeState = filterDoc["eyeState"];
    String audioUrl = filterDoc["audioUrl"];

    Serial.println("Kiki Reply: " + reply);
    drawEyeState(eyeState);

    // Stream speech audio directly
    if (audioUrl.length() > 0) {
      audio.connecttohost(audioUrl.c_str());
    }
  } else {
    Serial.println("Error calling message endpoint: " + String(httpResponseCode));
    drawEyeState("confused");
  }
  http.end();
}

// ----------------------------------------------------
// API CALL 2: Post raw Audio stream (STT)
// ----------------------------------------------------
String sendAudioToStt(uint8_t* audioBuffer, size_t bufferSize) {
  if (WiFi.status() != WL_CONNECTED) return "";

  HTTPClient http;
  String url = kikiServer + "/api/stt";
  http.begin(url);
  http.addHeader("Content-Type", "audio/wav");
  http.addHeader("x-api-key", apiKey);

  int httpResponseCode = http.POST(audioBuffer, bufferSize);
  String textResult = "";

  if (httpResponseCode == 200) {
    String response = http.getString();
    StaticJsonDocument<256> filterDoc;
    deserializeJson(filterDoc, response);
    textResult = filterDoc["text"].as<String>();
    Serial.println("Transcribed text: " + textResult);
  } else {
    Serial.println("STT upload failed: " + String(httpResponseCode));
  }
  
  http.end();
  return textResult;
}

// ----------------------------------------------------
// API CALL 3: Get TTS audio file URL
// ----------------------------------------------------
String getTtsAudioUrl(String text) {
  if (WiFi.status() != WL_CONNECTED) return "";

  HTTPClient http;
  String url = kikiServer + "/api/tts";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", apiKey);

  StaticJsonDocument<256> doc;
  doc["text"] = text;
  doc["voice"] = "alloy";

  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);
  String audioUrl = "";

  if (httpResponseCode == 200) {
    String response = http.getString();
    StaticJsonDocument<256> filterDoc;
    deserializeJson(filterDoc, response);
    audioUrl = filterDoc["audioUrl"].as<String>();
  }
  
  http.end();
  return audioUrl;
}

void setup() {
  Serial.begin(115200);
  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  tft.drawString("Connecting to WiFi...", 10, 40);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  
  audio.setPinout(I2S_BCLK, I2S_LRC, I2S_DOUT);
  audio.setVolume(21); // Default volume (0-21)
  drawEyeState("normal");
}

void loop() {
  audio.loop();
}
```
