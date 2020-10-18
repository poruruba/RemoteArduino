'use strict';

const TSL2561_Control = 0x80;
const TSL2561_Timing = 0x81;
const TSL2561_Interrupt = 0x86;
const TSL2561_Channal0L = 0x8C;
const TSL2561_Channal0H = 0x8D;
const TSL2561_Channal1L = 0x8E;
const TSL2561_Channal1H = 0x8F;

const TSL2561_Address = 0x29;       //device address

const LUX_SCALE = 14;           // scale by 2^14
const RATIO_SCALE = 9;          // scale ratio by 2^9
const CH_SCALE = 10;            // scale channel values by 2^10
const CHSCALE_TINT0 = 0x7517;   // 322/11 * 2^CH_SCALE
const CHSCALE_TINT1 = 0x0fe7;   // 322/81 * 2^CH_SCALE

const K1T = 0x0040;   // 0.125 * 2^RATIO_SCALE
const B1T = 0x01f2;   // 0.0304 * 2^LUX_SCALE
const M1T = 0x01be;   // 0.0272 * 2^LUX_SCALE
const K2T = 0x0080;   // 0.250 * 2^RATIO_SCA
const B2T = 0x0214;   // 0.0325 * 2^LUX_SCALE
const M2T = 0x02d1;   // 0.0440 * 2^LUX_SCALE
const K3T = 0x00c0;   // 0.375 * 2^RATIO_SCALE
const B3T = 0x023f;   // 0.0351 * 2^LUX_SCALE
const M3T = 0x037b;   // 0.0544 * 2^LUX_SCALE
const K4T = 0x0100;   // 0.50 * 2^RATIO_SCALE
const B4T = 0x0270;   // 0.0381 * 2^LUX_SCALE
const M4T = 0x03fe;   // 0.0624 * 2^LUX_SCALE
const K5T = 0x0138;   // 0.61 * 2^RATIO_SCALE
const B5T = 0x016f;   // 0.0224 * 2^LUX_SCALE
const M5T = 0x01fc;   // 0.0310 * 2^LUX_SCALE
const K6T = 0x019a;   // 0.80 * 2^RATIO_SCALE
const B6T = 0x00d2;   // 0.0128 * 2^LUX_SCALE
const M6T = 0x00fb;   // 0.0153 * 2^LUX_SCALE
const K7T = 0x029a;   // 1.3 * 2^RATIO_SCALE
const B7T = 0x0018;   // 0.00146 * 2^LUX_SCALE
const M7T = 0x0012;   // 0.00112 * 2^LUX_SCALE
const K8T = 0x029a;   // 1.3 * 2^RATIO_SCALE
const B8T = 0x0000;   // 0.000 * 2^LUX_SCALE
const M8T = 0x0000;   // 0.000 * 2^LUX_SCALE

const K1C = 0x0043;   // 0.130 * 2^RATIO_SCALE
const B1C = 0x0204;   // 0.0315 * 2^LUX_SCALE
const M1C = 0x01ad;   // 0.0262 * 2^LUX_SCALE
const K2C = 0x0085;   // 0.260 * 2^RATIO_SCALE
const B2C = 0x0228;   // 0.0337 * 2^LUX_SCALE
const M2C = 0x02c1;   // 0.0430 * 2^LUX_SCALE
const K3C = 0x00c8;   // 0.390 * 2^RATIO_SCALE
const B3C = 0x0253;   // 0.0363 * 2^LUX_SCALE
const M3C = 0x0363;   // 0.0529 * 2^LUX_SCALE
const K4C = 0x010a;   // 0.520 * 2^RATIO_SCALE
const B4C = 0x0282;   // 0.0392 * 2^LUX_SCALE
const M4C = 0x03df;   // 0.0605 * 2^LUX_SCALE
const K5C = 0x014d;   // 0.65 * 2^RATIO_SCALE
const B5C = 0x0177;   // 0.0229 * 2^LUX_SCALE
const M5C = 0x01dd;   // 0.0291 * 2^LUX_SCALE
const K6C = 0x019a;   // 0.80 * 2^RATIO_SCALE
const B6C = 0x0101;   // 0.0157 * 2^LUX_SCALE
const M6C = 0x0127;   // 0.0180 * 2^LUX_SCALE
const K7C = 0x029a;   // 1.3 * 2^RATIO_SCALE
const B7C = 0x0037;   // 0.00338 * 2^LUX_SCALE
const M7C = 0x002b;   // 0.00260 * 2^LUX_SCALE
const K8C = 0x029a;   // 1.3 * 2^RATIO_SCALE
const B8C = 0x0000;   // 0.000 * 2^LUX_SCALE
const M8C = 0x0000;   // 0.000 * 2^LUX_SCALE

class TSL2561{
  constructor(wire){
    this.wire = wire;
    this.address = TSL2561_Address;
  }

  async readRegister(address) {
    await this.wire.beginTransmission(this.address);
    var ret = await this.wire.write(address);                // register to read
    if( ret != 1 )
      throw 'failed';

    var ret = await this.wire.endTransmission();
    if( ret != 0 )
      throw 'failed';

    var ret = await this.wire.requestFrom(this.address, 1); // read a byte
    if( ret != 1 )
      throw 'failed';

    var value = await this.wire.read();
    //delay(100);

    return value;
}

  async writeRegister(address, val) {
    await this.wire.beginTransmission(this.address);  // start transmission to device
    var ret = await this.wire.write([address, val]);                    // send register address
    if( ret != 2 )
      throw 'failed';
    var ret = await this.wire.endTransmission();                 // end transmission
    if( ret != 0 )
      throw 'failed';
  }

  async getLux() {
    var CH0_LOW = await this.readRegister(TSL2561_Channal0L);
    var CH0_HIGH = await this.readRegister(TSL2561_Channal0H);
    //read two bytes from registers 0x0E and 0x0F
    var CH1_LOW = await this.readRegister(TSL2561_Channal1L);
    var CH1_HIGH = await this.readRegister(TSL2561_Channal1H);

    this.ch0 = (CH0_HIGH << 8) | CH0_LOW;
    this.ch1 = (CH1_HIGH << 8) | CH1_LOW;
  }

  async init() {
    await this.writeRegister(TSL2561_Control, 0x03); // POWER UP
    await this.writeRegister(TSL2561_Timing, 0x00); //No High Gain (1x), integration time of 13ms
    await this.writeRegister(TSL2561_Interrupt, 0x00);
    await this.writeRegister(TSL2561_Control, 0x00); // POWER Down
  }

  async readIRLuminosity() { // read Infrared channel value only, not convert to lux.
    await this.writeRegister(TSL2561_Control, 0x03); // POWER UP
    await this.sleep_async(14);
    await this.getLux();

    await this.writeRegister(TSL2561_Address, TSL2561_Control, 0x00); // POWER Down
    if (this.ch1 == 0) {
        return 0;
    }
    if (this.ch0 / this.ch1 < 2 && this.ch0 > 4900) {
        return -1;  //ch0 out of range, but ch1 not. the lux is not valid in this situation.
    }
    return ch1;
  }

  async readFSpecLuminosity() { //read Full Spectrum channel value only,  not convert to lux.
    await this.writeRegister(TSL2561_Control, 0x03); // POWER UP
    await this.sleep_async(14);
    await this.getLux();

    await this.writeRegister(TSL2561_Control, 0x00); // POWER Down
    if (this.ch1 == 0) {
        return 0;
    }
    if (this.ch0 / this.ch1 < 2 && this.ch0 > 4900) {
        return -1;  //ch0 out of range, but ch1 not. the lux is not valid in this situation.
    }
    return this.ch0;
  }

  async readVisibleLux() {
    await this.writeRegister(TSL2561_Control, 0x03); // POWER UP
    await this.sleep_async(14);
    await this.getLux();

    await this.writeRegister(TSL2561_Control, 0x00); // POWER Down
    if (this.ch1 == 0) {
        return 0;
    }
    if (this.ch0 / this.ch1 < 2 && this.ch0 > 4900) {
        return -1;  //ch0 out of range, but ch1 not. the lux is not valid in this situation.
    }
    return this.calculateLux(0, 0, 0);  //T package, no gain, 13ms
  }

  async calculateLux(iGain, tInt, iType) {
    var chScale;
    switch (tInt) {
        case 0:  // 13.7 msec
            chScale = CHSCALE_TINT0;
            break;
        case 1: // 101 msec
            chScale = CHSCALE_TINT1;
            break;
        default: // assume no scaling
            chScale = (1 << CH_SCALE);
            break;
    }
    if (!iGain) {
        chScale = chScale << 4;    // scale 1X to 16X
    }
    // scale the channel values
    var channel0 = (this.ch0 * chScale) >> CH_SCALE;
    var channel1 = (this.ch1 * chScale) >> CH_SCALE;

    var ratio1 = 0;
    if (channel0 != 0) {
        ratio1 = (channel1 << (RATIO_SCALE + 1)) / channel0;
    }
    // round the ratio value
    var ratio = (ratio1 + 1) >> 1;

    var b, m;
    switch (iType) {
        case 0: // T package
            if ((ratio >= 0) && (ratio <= K1T)) {
                b = B1T;
                m = M1T;
            } else if (ratio <= K2T) {
                b = B2T;
                m = M2T;
            } else if (ratio <= K3T) {
                b = B3T;
                m = M3T;
            } else if (ratio <= K4T) {
                b = B4T;
                m = M4T;
            } else if (ratio <= K5T) {
                b = B5T;
                m = M5T;
            } else if (ratio <= K6T) {
                b = B6T;
                m = M6T;
            } else if (ratio <= K7T) {
                b = B7T;
                m = M7T;
            } else if (ratio > K8T) {
                b = B8T;
                m = M8T;
            }
            break;
        case 1:// CS package
            if ((ratio >= 0) && (ratio <= K1C)) {
                b = B1C;
                m = M1C;
            } else if (ratio <= K2C) {
                b = B2C;
                m = M2C;
            } else if (ratio <= K3C) {
                b = B3C;
                m = M3C;
            } else if (ratio <= K4C) {
                b = B4C;
                m = M4C;
            } else if (ratio <= K5C) {
                b = B5C;
                m = M5C;
            } else if (ratio <= K6C) {
                b = B6C;
                m = M6C;
            } else if (ratio <= K7C) {
                b = B7C;
                m = M7C;
            }
            break;
    }
    var temp = ((channel0 * b) - (channel1 * m));
    if (temp < 0) {
        temp = 0;
    }
    temp += (1 << (LUX_SCALE - 1));
    // strip off fractional portion
    var lux = temp >> LUX_SCALE;

    return (lux);
  }

  async sleep_async(msec){
    return new Promise(resolve =>{
      setTimeout(resolve, msec);
    });
  }
}

module.exports = TSL2561;