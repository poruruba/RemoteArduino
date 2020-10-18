'use strict';

class Wire{
  constructor(arduino, wire = "Wire"){
    this.arduino = arduino;
    this.device_type = wire;
  }

  async begin(){
    await this.arduino.mqtt_command_tranceive(this.device_type, 'begin');
  }

  async beginTransmission(address){
    var params = {
      param1: address
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'beginTransmission', params);
  }

  async endTransmission(){
    var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'endTransmission');

    return resp.params.param1;
  }

  async requestFrom(address, count){
    var params = {
      param1: address,
      param2: count
    };
    var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'requestFrom', params);

    return resp.params.param1;
  }

  async available(){
    var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'available');
    
    return resp.params.param1;
  }

  async read(len){
    if( len === undefined ){
      var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'read');
      
      return resp.params.param1;
    }else{
      var params = {
        param1: len
      };
      var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'read_buf', params);
      
      return Buffer.from(resp.params.param1, 'hex');
    }
  }

  async write(value, len){
    if( !Array.isArray(value) ){
      var params = {
        param1: value
      };
      var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'write', params);
    }else{
      var params = {
        param1: Buffer.from(value).toString('hex'),
        param2: (len === undefined) ? value.length : len,
      };
      var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'write_buf', params);
    }
    
    return resp.params.param1;
  }
}

module.exports = Wire;