"use strict";
exports.__esModule = true;
var onoff = require('onoff'); //include onoff to interact with the GPIO
var _ = require('lodash');
var SensorState;
(function (SensorState) {
    SensorState[SensorState["SENSOR_STATE_HIGH"] = 0] = "SENSOR_STATE_HIGH";
    SensorState[SensorState["SENSOR_STATE_LOW"] = 1] = "SENSOR_STATE_LOW";
    SensorState[SensorState["SENSOR_STATE_INIT"] = 2] = "SENSOR_STATE_INIT";
    SensorState[SensorState["SENSOR_STATE_UNKNOWN"] = 3] = "SENSOR_STATE_UNKNOWN";
})(SensorState = exports.SensorState || (exports.SensorState = {}));
var GPIOSensorState = /** @class */ (function () {
    function GPIOSensorState(gpio_number, callback_low, debounce_low_time, callback_high, debounce_high_time) {
        this.state = SensorState.SENSOR_STATE_INIT;
        this.sensor = new onoff.Gpio(gpio_number, 'in', 'both'); //use GPIO pin as input, and 'both' button presses, and releases should be $
        /* EXPLANATION
        * events :                    |   |   |   |   |   |   |   |   |   |                   |   |   |
        * debounce leading true :     |                                                       |
        */
        var debounceLow = _.debounce(function () { callback_low(SensorState.SENSOR_STATE_LOW); }, debounce_low_time, {
            'leading': true,
            'trailing': false
        });
        /* EXPLANATION
        * events :                    |   |   |   |   |   |   |   |   |   |                   |   |   |
        * debounce leading false :                                                 |                          |
        */
        var debounceHigh = _.debounce(function () { callback_high(SensorState.SENSOR_STATE_HIGH); }, debounce_high_time, {
            'leading': false,
            'trailing': true
        });
        this.sensor.watch(function (err, value) {
            if (err) { //if an error
                console.error('There was an error', err); //output error message to console
                return;
            }
            switch (value) {
                case onoff.Gpio.HIGH: // inverted... weird
                    //DEBUT DE LA COUPURE DE COURANT
                    this.state = SensorState.SENSOR_STATE_LOW;
                    debounceLow();
                    break;
                case onoff.Gpio.LOW:
                    //FIN DE LA COUPURE DE COURANT
                    this.state = SensorState.SENSOR_STATE_HIGH;
                    debounceHigh();
                    break;
                default:
                    console.error('unknown');
                    //ERREUR dans la detection
                    break;
            }
        });
    }
    /**
     * Return the current state of the sensor
     */
    GPIOSensorState.prototype.get_sensor_state = function () {
        return this.state;
    };
    return GPIOSensorState;
}());
exports.GPIOSensorState = GPIOSensorState;
