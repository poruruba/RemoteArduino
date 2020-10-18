'use strict';

const MQTT_HOST_URL = process.env.MQTT_HOST || 'yMQTTƒuƒ[ƒJ‚ÌURLz';
const MQTT_CLIENT_ID = process.argv.MQTT_CLIENT_ID || 'yMQTT‚Å‚ÌƒNƒ‰ƒCƒAƒ“ƒgIDz';

const Arduino = require('./arduino');
const SGC30 = require('./device/SGC30');
const DHT12 = require('./device/DHT12');
const TSL2561 = require('./device/TSL2561');
const BME280 = require('./device/BME280');
const SSD1308 = require('./device/SSD1308');

const MQTT_TOPIC_CMD = process.env.MQTT_TOPIC_CMD || 'm5lite/cmdyM5StickC‚ÌMacƒAƒhƒŒƒXz';
const MQTT_TOPIC_RSP = process.env.MQTT_TOPIC_RSP || 'm5lite/rspyM5StickC‚ÌMacƒAƒhƒŒƒXz';

const arduino = new Arduino(MQTT_CLIENT_ID, MQTT_HOST_URL, MQTT_TOPIC_CMD, MQTT_TOPIC_RSP);

async function test(){
  await arduino.connect();
  var wire = arduino.Wire;
  await wire.begin();

  var bme280 = new BME280(wire);
  await bme280.begin();
  var ret = await bme280.readTemperature();
  console.log(ret);
  var ret = await bme280.readPressure();
  console.log(ret);

  var dht12 = new DHT12(wire);
  var ret = await dht12.readTemperature();
  console.log(ret);
  var ret = await dht12.readHumidity();
  console.log(ret);

  var tsl2561 = new TSL2561(wire);
  await tsl2561.init();
  var ret = await tsl2561.readVisibleLux();
  console.log(ret);

  var sgc30 = new SGC30(wire);
  var ret = await sgc30.begin();
  console.log(ret);
  await sgc30.IAQmeasure();
  console.log(sgc30.TVOC);
  console.log(sgc30.eCO2);

  var ssd1308 = new SSD1308(wire);
  await ssd1308.init();
  await ssd1308.clear();
  await ssd1308.put_pixel(1, 1, true);
  await ssd1308.update();
}

test()
.then(() =>{
  console.log('end');
  arduino.disconnect();
})
.catch(error =>{
  console.error(error);
});
