#include "M5Lite.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#include <Wire.h>

// MQTT用
WiFiClient espClient;
PubSubClient client(espClient);

const char* wifi_ssid = "【WiFiアクセスポイントのSSID】";
const char* wifi_password = "【WiFiアクセスポイントのパスワード】";
const char* mqtt_server = "【MQTTブローカのホスト名】";
const uint16_t mqtt_port = 1883; // MQTTサーバのポート番号(TCP接続)
std::string topic_cmd = "m5lite/cmd"; // コマンド受信用
std::string topic_rsp = "m5lite/rsp"; // レスポンス送信用
#define MQTT_CLIENT_NAME  "M5Atom" // MQTTサーバ接続時のクライアント名

#define MQTT_BUFFER_SIZE  5120 // MQTT送受信のバッファサイズ
#define BTN_PUSH_MARGIN 100

#define MAX_PARAMS  7

// MQTT Subscribe用
const int request_capacity = JSON_OBJECT_SIZE(5) + JSON_OBJECT_SIZE(MAX_PARAMS);
StaticJsonDocument<request_capacity> json_request;
// MQTT Publish用
const int message_capacity = JSON_OBJECT_SIZE(5) + JSON_OBJECT_SIZE(MAX_PARAMS);
StaticJsonDocument<message_capacity> json_message;
char message_buffer[MQTT_BUFFER_SIZE];

unsigned char temp_buffer[MQTT_BUFFER_SIZE];

void debug_dump(const uint8_t *p_bin, uint16_t len);
long parse_hex(const char* p_hex, unsigned char *p_bin);
std::string create_string(const unsigned char *p_bin, unsigned short len);
void process_Serial(const char *device_type);
void process_Wire(const char *device_type);
void process_Gpio(const char *device_type);
void process_Lcd(const char *device_type);

void initResponse(void){
  const char *client_id = json_request["client_id"];
  long tx_id = json_request["tx_id"];
  const char *cmd = json_request["cmd"];

  json_message.clear();
  json_message["client_id"] = client_id;
  json_message["tx_id"] = tx_id;
  json_message["rsp"] = cmd;
  json_message["status"] = "OK";
}

void sendResponse(void){
  serializeJson(json_message, message_buffer, sizeof(message_buffer));
  client.publish(topic_rsp.c_str(), message_buffer);
}

// MQTT Subscribeで受信した際のコールバック関数
void mqtt_callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("received ");
  DeserializationError err = deserializeJson(json_request, payload, length);
  if( err ){
    Serial.println("Deserialize error");
    Serial.println(err.c_str());
    return;
  }

  const char* device_type = json_request["device_type"];
  Serial.println(device_type);
  if( strcmp(device_type, "Serial") == 0 ){
    process_Serial(device_type);
  }else
  if( strncmp(device_type, "Wire", 4) == 0){
    process_Wire(device_type);
  }else
  if( strcmp(device_type, "Gpio") == 0 ){
    process_Gpio(device_type);
  }else
  if( strcmp(device_type, "Lcd") == 0 ){
    process_Lcd(device_type);
  }
}

void drawBmpData(const uint8_t *p_bitmap, int depth, int pos_x, int pos_y, int width, int height){
  // 1(1), 8(332), 16(565), 24(888),
  int len;
  if( depth == 1 ) len = ((width + 31) / 32) * 4;
  else len = ((width * (depth / 8) + 3) / 4) * 4;

  if(depth == 1){
    for( int y = 0 ; y < height ; y++ ){
      for( int x = 0 ; x < width ; x++ ){
        uint32_t color = 0x000000;
        if( (p_bitmap[y * len + x / 8] & (0x01 << (7 - (x % 8)))) != 0x00 )
          color = TFT_WHITE;
        else
          color = TFT_BLACK;
        M5Lite.Lcd.drawPixel(pos_x + x, pos_y + y, color);
      }
    }
  }else
  if(depth == 8){
    for( int y = 0 ; y < height ; y++ ){
      for( int x = 0 ; x < width ; x++ ){
        uint32_t color = 0x000000;
        color |= (p_bitmap[y * len + x] & 0xe0) << 16;
        color |= (p_bitmap[y * len + x] & 0x1c) << 11;
        color |= (p_bitmap[y * len + x] & 0x03) << 6;
        M5Lite.Lcd.drawPixel(pos_x + x, pos_y + y, color);
      }
    }
  }else
  if(depth == 16){
    for( int y = 0 ; y < height ; y++ ){
      for( int x = 0 ; x < width ; x++ ){
        uint32_t color = 0x000000;
        color |= (p_bitmap[y * len + x * 2] & 0xf8) << 16;
        color |= (p_bitmap[y * len + x * 2] & 0x03) << 13;
        color |= (p_bitmap[y * len + x * 2 + 1] & 0xe0) << 11;
        color |= (p_bitmap[y * len + x * 2 + 1] & 0x1f) << 3;
        M5Lite.Lcd.drawPixel(pos_x + x, pos_y + y, color);
      }
    }
  }else
  if(depth == 24){
    for( int y = 0 ; y < height ; y++ ){
      for( int x = 0 ; x < width ; x++ ){
        uint32_t color = 0x000000;
        color |= p_bitmap[y * len + x * 3] << 16;
        color |= p_bitmap[y * len + x * 3 + 1] << 8;
        color |= p_bitmap[y * len + x * 3 + 2] << 0;
        M5Lite.Lcd.drawPixel(pos_x + x, pos_y + y, color);
      }
    }
  }
}

void process_Lcd(const char *device_type){
  const char *cmd = json_request["cmd"];
  Serial.println(cmd);
  const JsonObject cmd_param = json_request["params"];
  if( strcmp(cmd, "setRotation") == 0 ){
    long param1 = cmd_param["param1"];
    M5Lite.Lcd.setRotation(param1);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "setTextColor") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    M5Lite.Lcd.setTextColor(param1, param2);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "setBrightness") == 0 ){
    long param1 = cmd_param["param1"];
    M5Lite.Lcd.setBrightness(param1);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "drawPixel") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    M5Lite.Lcd.drawPixel(param1, param2, param3);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "drawLine") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    long param4 = cmd_param["param4"];
    long param5 = cmd_param["param5"];
    M5Lite.Lcd.drawLine(param1, param2, param3, param4, param5);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "drawRect") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    long param4 = cmd_param["param4"];
    long param5 = cmd_param["param5"];
    M5Lite.Lcd.drawRect(param1, param2, param3, param4, param5);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "fillRect") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    long param4 = cmd_param["param4"];
    long param5 = cmd_param["param5"];
    M5Lite.Lcd.fillRect(param1, param2, param3, param4, param5);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "fillScreen") == 0 ){
    long param1 = cmd_param["param1"];
    M5Lite.Lcd.fillScreen(param1);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "drawTriangle") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    long param4 = cmd_param["param4"];
    long param5 = cmd_param["param5"];
    long param6 = cmd_param["param6"];
    long param7 = cmd_param["param7"];
    M5Lite.Lcd.drawTriangle(param1, param2, param3, param4, param5, param6, param7);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "fillTriangle") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    long param4 = cmd_param["param4"];
    long param5 = cmd_param["param5"];
    long param6 = cmd_param["param6"];
    long param7 = cmd_param["param7"];
    M5Lite.Lcd.fillTriangle(param1, param2, param3, param4, param5, param6, param7);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "drawCircle") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    long param4 = cmd_param["param4"];
    M5Lite.Lcd.drawCircle(param1, param2, param3, param4);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "fillCircle") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    long param4 = cmd_param["param4"];
    M5Lite.Lcd.fillCircle(param1, param2, param3, param4);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "drawEllipse") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    long param4 = cmd_param["param4"];
    long param5 = cmd_param["param5"];
    M5Lite.Lcd.drawEllipse(param1, param2, param3, param4, param5);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "fillEllipse") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    long param4 = cmd_param["param4"];
    long param5 = cmd_param["param5"];
    M5Lite.Lcd.fillEllipse(param1, param2, param3, param4, param5);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "drawBmpData") == 0 ){
    const char *param1 = cmd_param["param1"];
    long len = parse_hex(param1, temp_buffer);
    long param2 = cmd_param["param2"];
    long param3 = cmd_param["param3"];
    long param4 = cmd_param["param4"];
    long param5 = cmd_param["param5"];
    long param6 = cmd_param["param6"];
    drawBmpData(temp_buffer, param2, param3, param4, param5, param6);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "getRange") == 0 ){
    long width = M5Lite.Lcd.width();
    long height = M5Lite.Lcd.height();
    long depth = M5Lite.Lcd.getColorDepth();
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = width;
    rsp_param["param2"] = height;
    rsp_param["param3"] = depth;
    sendResponse();
  }
}

void process_Gpio(const char *device_type){
  const char *cmd = json_request["cmd"];
  Serial.println(cmd);
  const JsonObject cmd_param = json_request["params"];
  if( strcmp(cmd, "pinMode") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    pinMode(param1, param2);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "digitalWrite") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    digitalWrite(param1, param2);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "digitalRead") == 0 ){
    long param1 = cmd_param["param1"];
    long ret = digitalRead(param1);
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "analogRead") == 0 ){
    long param1 = cmd_param["param1"];
    long ret = analogRead(param1);
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "analogReadResolution") == 0 ){
    long param1 = cmd_param["param1"];
    analogReadResolution(param1);
    initResponse();
    sendResponse();
  }
}

void process_Wire(const char *device_type){
  TwoWire *wire;
  if( strcmp(device_type, "Wire") == 0 ) wire = &Wire;
  else if( strcmp(device_type, "Wire1") == 0 ) wire = &Wire1;
  else{
    initResponse();
    json_message["status"] = "NG";
    json_message["reason"] = "Invalid Parameter";
    sendResponse();
    return;
  }

  const char *cmd = json_request["cmd"];
  Serial.println(cmd);
  const JsonObject cmd_param = json_request["params"];
  if( strcmp(cmd, "begin") == 0 ){
    int sca = -1;
    int scl = -1;
    if( strcmp(device_type, "Wire") == 0 ){
      sca = 32;
      scl = 33;
    }else if( strcmp(device_type, "Wire1") == 0 ){
      sca = 0;
      scl = 26;
    }
    wire->begin(sca, scl);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "requestFrom") == 0 ){
    long param1 = cmd_param["param1"];
    long param2 = cmd_param["param2"];
    bool param3 = cmd_param["param3"] || true;
    long ret = wire->requestFrom(param1, param2, param3);
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "beginTransmission") == 0 ){
    long param1 = cmd_param["param1"];
    wire->beginTransmission((uint8_t)param1);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "endTransmission") == 0 ){
    bool param1 = cmd_param["param1"] || true;
    long ret = wire->endTransmission(param1);
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "write") == 0 ){
    long param1 = cmd_param["param1"];
    long ret = wire->write(param1);
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "write_str") == 0 ){
    const char *param1 = cmd_param["param1"];
    long ret = wire->write(param1);
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "write_buf") == 0 ){
    const char *param1 = cmd_param["param1"];
    long len = parse_hex(param1, temp_buffer);
    long ret = wire->write(temp_buffer, len);
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "available") == 0 ){
    long ret = wire->available();
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "read") == 0 ){
    long ret = wire->read();
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "read_buf") == 0 ){
    long param1 = cmd_param["param1"];
    for( long i = 0 ; i < param1 ; i++ )
      temp_buffer[i] = wire->read();
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    std::string str = create_string(temp_buffer, param1);
    rsp_param["param1"] = str.c_str();
    sendResponse();
  }
}

void process_Serial(const char *device_type){
  const char *cmd = json_request["cmd"];
  Serial.println(cmd);
  const JsonObject cmd_param = json_request["params"];
  if( strcmp(cmd, "begin") == 0 ){
    long param1 = cmd_param["param1"];
    Serial.begin(param1);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "end") == 0){
    Serial.end();
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "available") == 0 ){
    long ret = Serial.available();
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "read") == 0 ){
    long ret = Serial.read();
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "peek") == 0 ){
    long ret = Serial.peek();
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "flush") == 0 ){
    Serial.flush();
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "print") == 0 ){
    const char *param1 = cmd_param["param1"];
    Serial.print(param1);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "println") == 0 ){
    const char *param1 = cmd_param["param1"];
    Serial.println(param1);
    initResponse();
    sendResponse();
  }else
  if( strcmp(cmd, "write") == 0 ){
    long param1 = cmd_param["param1"];
    long ret = Serial.write(param1);
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "write_str") == 0 ){
    const char *param1 = cmd_param["param1"];
    long ret = Serial.write(param1);
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }else
  if( strcmp(cmd, "write_buf") == 0 ){
    const char *param1 = cmd_param["param1"];
    long len = parse_hex(param1, temp_buffer);
    long ret = Serial.write(temp_buffer, len);
    Serial.printf("ret=%ld\n", ret);
    initResponse();
    const JsonObject rsp_param = json_message.createNestedObject("params");
    rsp_param["param1"] = ret;
    sendResponse();
  }
}

// WiFiアクセスポイントへの接続
void wifi_connect(void){
  Serial.println("");
  Serial.print("WiFi Connenting");
  M5Lite.Lcd.print("Connecting");
  
  WiFi.begin(wifi_ssid, wifi_password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    M5Lite.Lcd.print(".");
    delay(1000);
  }
  Serial.println("");
  Serial.print("Connected : ");
  Serial.println(WiFi.localIP());

  M5Lite.Lcd.fillScreen(BLACK);
  M5Lite.Lcd.setCursor(0, 0);
  M5Lite.Lcd.println(WiFi.localIP());
  unsigned char mac[6];
  WiFi.macAddress(mac);
  topic_cmd += create_string(mac, 6);
  topic_rsp += create_string(mac, 6);
  Serial.print("topic_cmd: ");
  Serial.print(topic_cmd.c_str());
  Serial.print(", topic_rsp: ");
  Serial.println(topic_rsp.c_str());
  M5Lite.Lcd.printf("topic_cmd=%s\n", topic_cmd.c_str());
  M5Lite.Lcd.printf("topic_rsp=%s\n", topic_rsp.c_str());
  
  // バッファサイズの変更
  client.setBufferSize(MQTT_BUFFER_SIZE);
  // MQTTコールバック関数の設定
  client.setCallback(mqtt_callback);
  // MQTTブローカに接続
  client.setServer(mqtt_server, mqtt_port);
}

void setup() {
  M5Lite.begin();
  Serial.begin(9600);

  M5Lite.Lcd.setRotation(3);
  M5Lite.Lcd.fillScreen(BLACK);
  M5Lite.Lcd.setTextColor(WHITE, BLACK);
  M5Lite.Lcd.println("[M5StickC]");

  wifi_connect();
}

void loop() {
  client.loop();
  // MQTT未接続の場合、再接続
  while(!client.connected() ){
    Serial.println("Mqtt Reconnecting");
    if( client.connect(MQTT_CLIENT_NAME) ){
      // MQTT Subscribe
      client.subscribe(topic_cmd.c_str());
      Serial.println("Mqtt Connected and Subscribing");
      Serial.print("topic_cmd: ");
      Serial.print(topic_cmd.c_str());
      Serial.print(", topic_rsp: ");
      Serial.println(topic_rsp.c_str());
      break;
    }
    delay(1000);
  }

  M5Lite.update();
}

void debug_dump(const uint8_t *p_bin, uint16_t len){
  for( uint16_t i = 0 ; i < len ; i++ ){
    Serial.print((p_bin[i] >> 4) & 0x0f, HEX);
    Serial.print(p_bin[i] & 0x0f, HEX);
  }
  Serial.println("");
}

char toC(unsigned char bin){
  if( bin >= 0 && bin <= 9 )
    return '0' + bin;
  if( bin >= 0x0a && bin <= 0x0f )
    return 'a' + bin - 10;
  return '0';
}

unsigned char tohex(char c){
  if( c >= '0' && c <= '9')
    return c - '0';
  if( c >= 'a' && c <= 'f' )
    return c - 'a' + 10;
  if( c >= 'F' && c <= 'F' )
    return c - 'A' + 10;

  return 0;
}

long parse_hex(const char* p_hex, unsigned char *p_bin){
  int index = 0;
  while( p_hex[index * 2] != '\0'){
    p_bin[index] = tohex(p_hex[index * 2]) << 4;
    p_bin[index] |= tohex(p_hex[index * 2 + 1]);
    index++;
  }

  return index;
}

std::string create_string(const unsigned char *p_bin, unsigned short len){
  std::string str = "";
  for( int i = 0 ; i < len ; i++ ){
    str += toC((p_bin[i] >> 4) & 0x0f);
    str += toC(p_bin[i] & 0x0f);
  }

  return str;
}