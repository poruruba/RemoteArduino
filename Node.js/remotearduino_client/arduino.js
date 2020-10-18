'use strict';

const mqtt = require('mqtt');

const Wire = require('./arduio_device/Wire');
const Lcd = require('./arduio_device/Lcd');
const Serial = require('./arduio_device/Serial');
const Gpio = require('./arduio_device/Gpio');

const MQTT_TOPIC_CMD = 'm5lite/cmd';
const MQTT_TOPIC_RSP = 'm5lite/rsp';

class Arduino{
  constructor(client_id, host, topic_cmd = MQTT_TOPIC_CMD, topic_evt = MQTT_TOPIC_RSP){
    this.mqtt_client_id = client_id;
    this.mqtt_host = host;
    this.mqtt_topic_cmd = topic_cmd;
    this.mqtt_topic_evt = topic_evt;

    this.msg_queue = [];
    this.tx_id = 0;
  }

  async disconnect(){
    if( this.client )
      this.client.end();
    this.client = null;
  }

  async connect(){
    this.client = null;

    return new Promise((resolve, reject) =>{
      this.client = mqtt.connect(this.mqtt_host, { clientId: this.mqtt_client_id });

      this.client.on('connect', () => {
        console.log('mqtt.connected.');
        this.client.subscribe(this.mqtt_topic_evt, async (err, granted) =>{
          if( err ){
            console.error(err);
            return reject(err);
          }
          console.log('mqtt.subscribed.');

          this.Wire = new Wire(this);
          this.Wire1 = new Wire(this, "Wire1");
          this.Serial = new Serial(this);
          this.Gpio = new Gpio(this);

          this.Lcd = new Lcd(this);
          try{
            await this.Lcd.init();
          }catch(error){
            console.error("Lcd.init error: " + error);
          }

          resolve();
        });
      });

      this.client.on('error', (error) =>{
        console.log('mqtt.error.');
        reject(error);
      });

      this.client.on('message', async (topic, message) =>{
//        console.log('on.message', 'topic:', topic, 'message:', message.toString());
      
        var msg = JSON.parse(message);
        var index = this.msg_queue.findIndex(item => { return (item.command.client_id == msg.client_id && msg.tx_id == item.command.tx_id) });
        if( index >= 0 ){
          var target = this.msg_queue[index];
          this.msg_queue.splice(index, 1);
          if( msg.status == 'OK')
            target.resolve(msg);
          else
            target.reject(msg);
        }
      });
    });
  }

  async mqtt_command_tranceive(device_type, cmd, params){
    return new Promise((resolve, reject) =>{
      var param = {
        command: {
          client_id: this.mqtt_client_id,
          tx_id: ++this.tx_id,
          device_type: device_type,
          cmd: cmd,
          params: params    
        },
        resolve,
        reject,
      };
      this.client.publish(this.mqtt_topic_cmd, JSON.stringify(param.command), (err) =>{
        if( err )
          return reject(err);
        this.msg_queue.push(param);
      });
    });
  }
}

module.exports = Arduino;
