'use strict';

class Serial{
  constructor(arduino){
   this.arduino = arduino;
   this.device_type = "Serial";
  }

  async begin(baud){
    var params = {
      param1: baud
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'begin', params);
  }

  async end(){
    await this.arduino.mqtt_command_tranceive(this.device_type, 'end');
  }

  async available(){
    var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'available');

    return resp.params.param1;
  }

  async read(){
    var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'read');

    return resp.params.param1;
  }

  async peek(){
    var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'peek');

    return resp.params.param1;
  }

  async flush(){
    await this.arduino.mqtt_command_tranceive(this.device_type, 'flush');
  }
  
  async print(str){
    var params = {
      param1: str,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'print', params);
  }

  async println(str){
    var params = {
      param1: str,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'println', params);
  }

  async write(val){
    var params = {
      param1: val,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'write', params);
  }

  async write_str(str){
    var params = {
      param1: str,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'write_str', params);
  }

  async write_buf(buffer){
    var params = {
      param1: Buffer.from(buffer).toString('hex'),
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'write_buf', params);
  }
}

module.exports = Serial;
