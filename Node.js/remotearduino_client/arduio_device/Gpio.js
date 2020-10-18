'use strict';

class Gpio{
  constructor(arduino){
   this.arduino = arduino;
   this.device_type = "Gpio";
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
