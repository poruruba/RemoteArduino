'use strict';

class Lcd{
  constructor(arduino){
   this.arduino = arduino;
   this.device_type = "Lcd";
  }

  async init(){
    var resp = await this.arduino.mqtt_command_tranceive(this.device_type, 'getRange');

    this.width = resp.params.param1;
    this.height = resp.params.param2;
    this.depth = resp.params.param3;

    return { width: this.width, height: this.height, depth : this.depth };
  }

  async setRotation(r){
    var params = {
      param1: r
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'setRotation', params);
  }

  async setTextColor(fgcolor, bgcolor){
    var params = {
      param1: fgcolor,
      param2: bgcolor,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'setTextColor', params);
  }

  async setBrightness(brightness){
    var params = {
      param1: brightness,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'setBrightness', params);
  }

  async drawLine(x0, y0, x1, y1, color ){
    var params = {
      param1: x0,
      param2: y0,
      param3: x1,
      param4: y1,
      param5: color,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'drawLine', params);
  }

  async drawRect(x, y, w, h, color ){
    var params = {
      param1: x,
      param2: y,
      param3: w,
      param4: h,
      param5: color,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'drawRect', params);
  }

  async fillRect(x, y, w, h, color ){
    var params = {
      param1: x,
      param2: y,
      param3: w,
      param4: h,
      param5: color,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'fillRect', params);
  }

  async fillScreen(color){
    var params = {
      param1: color,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'fillScreen', params);
  }

  async drawTriangle(x0, y0, x1, y1, x2, y2, color ){
    var params = {
      param1: x0,
      param2: y0,
      param3: x1,
      param4: y1,
      param5: x2,
      param6: y2,
      param7: color,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'drawTriangle', params);
  }

  async fillTriangle(x0, y0, x1, y1, x2, y2, color ){
    var params = {
      param1: x0,
      param2: y0,
      param3: x1,
      param4: y1,
      param5: x2,
      param6: y2,
      param7: color,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'fillTriangle', params);
  }

  async drawCircle(x, y, r, color ){
    var params = {
      param1: x,
      param2: y,
      param3: r,
      param4: color,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'drawCircle', params);
  }

  async fillCircle(x, y, r, color ){
    var params = {
      param1: x,
      param2: y,
      param3: r,
      param4: color,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'fillCircle', params);
  }

  async drawEllipse(x, y, rx, ry, color ){
    var params = {
      param1: x,
      param2: y,
      param3: rx,
      param4: ry,
      param5: color,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'drawEllipse', params);
  }

  async fillEllipse(x, y, rx, ry, color ){
    var params = {
      param1: x,
      param2: y,
      param3: rx,
      param4: ry,
      param5: color,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'fillEllipse', params);
  }

  async drawBmpData(bmp, depth, x, y, w, h){
    var params = {
      param1: Buffer.from(bmp).toString('hex'),
      param2: depth,
      param3: x,
      param4: y,
      param5: w,
      param6: h,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'drawBmpData', params);
  }

  async draw(ctx, pos_x, pos_y, width, height, depth){
    var img = ctx.getImageData(0, 0, this.WIDTH, this.HEIGHT);

    if( depth == undefined )
      depth = this.depth;

    var len;
    if( depth == 1 ) len = ((width + 31) / 32) * 4;
    else len = ((width * (depth / 8) + 3) / 4) * 4;
    
    var buffer = Buffer.alloc(len * height);
    for (var y = 0; y < height; y++ ) {
      for (var x = 0; x < width; x++) {
        var r = img.data[((pos_x + x) + (y + pos_y) * width) * 4];
        var g = img.data[((pos_x + x) + (y + pos_y) * width) * 4 + 1];
        var b = img.data[((pos_x + x) + (y + pos_y) * width) * 4 + 2];
        var a = img.data[((pos_x + x) + (y + pos_y) * width) * 4 + 3];

        // 1(1), 8(332), 16(565), 24(888),
        if( depth == 1 ){
          var val = this.to_mono(r, g, b, a);
          if( val )
            buffer[len * y + x / 8] |= (0x01) << (7 - (x % 8));
        }else
        if( depth == 8){
          buffer[len * y + x] |= r & 0xe0;
          buffer[len * y + x] |= g & 0xe0 >> 3;
          buffer[len * y + x] |= b & 0xc0 >> 6;
        }else
        if(depth == 16){
          buffer[len * y + x * 2] |= r & 0xf8;
          buffer[len * y + x * 2] |= g & 0xe0 >> 5;
          buffer[len * y + x * 2 + 1] |= g & 0x1c << 3;
          buffer[len * y + x * 2 + 1] |= b & 0xf8 >> 3;
        }else
        if( depth == 24){
          buffer[len * y + x * 3] = r;
          buffer[len * y + x * 3 + 1] = g;
          buffer[len * y + x * 3 + 2] = b;
        }
      }
    }
    var params = {
      param1: buffer.toString('hex'),
      param2: depth,
      param3: pos_x,
      param4: pos_y,
      param5: width,
      param6: height,
    };
    await this.arduino.mqtt_command_tranceive(this.device_type, 'drawBmpData', params);
  }

  to_mono(r, g, b, a){
    var grey = r * 0.299 + g * 0.587 + b * 0.114;
    if( a > 127 || grey > 127.5)
      return 1;
    else
      return 0;
  }
}

module.exports = Lcd;
