'use strict';

class Gpio{
  constructor(arduino){
   this.arduino = arduino;
   this.device_type = "Gpio";
    
   this.LOW = 0x0;
   this.HIGH = 0x1;

   this.INPUT = 0x01;
   this.OUTPUT = 0x02;
   this.PULLUP = 0x04;
   this.INPUT_PULLUP = 0x05;
   this.PULLDOWN = 0x08;
   this.INPUT_PULLDOWN = 0x09;
   this.OPEN_DRAIN = 0x10;
   this.OUTPUT_OPEN_DRAIN = 0x12;
  }

  async pinMode(pin, mode){
    var params = {
      param1: pin,
      param2: mode
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'pinMode', params);
  }

  async digitalWrite(pin, val){
    var params = {
      param1: pin,
      param2: val,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'digitalWrite', params);
  }

  async digitalRead(pin){
    var params = {
      param1: pin,
    };
    var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'digitalRead', params);

    return resp.params.param1;
  }

  async analogRead(pin){
    var params = {
      param1: pin,
    };
    var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'analogRead', params);

    return resp.params.param1;
  }

  async analogReadResolution(bits){
    var params = {
      param1: bits,
    };
    var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'analogReadResolution', params);
  }
}

module.exports = Gpio;
