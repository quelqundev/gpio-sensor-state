let onoff = require('onoff'); //include onoff to interact with the GPIO
let _ = require('lodash');

export enum SensorState {
    SENSOR_STATE_HIGH,
    SENSOR_STATE_LOW,
    SENSOR_STATE_INIT,
    SENSOR_STATE_UNKNOWN
}

export class GPIOSensorState {
    public state: SensorState = SensorState.SENSOR_STATE_INIT;
    private sensor: any;

    constructor(
        gpio_number: number,
        callback_low: Function,
        debounce_low_time: number,
        callback_high: Function,
        debounce_high_time: number
    ) {
        this.sensor = new onoff.Gpio(gpio_number, 'in', 'both'); //use GPIO pin as input, and 'both' button presses, and releases should be $

        /* EXPLANATION
        * events :                    |   |   |   |   |   |   |   |   |   |                   |   |   |
        * debounce leading true :     |                                                       |
        */
        let debounceLow = _.debounce(() => { callback_low(SensorState.SENSOR_STATE_LOW) }, debounce_low_time, {
            'leading': true,
            'trailing': false
        });

        /* EXPLANATION
        * events :                    |   |   |   |   |   |   |   |   |   |                   |   |   |
        * debounce leading false :                                                 |                          |
        */
        let debounceHigh = _.debounce(() => { callback_high(SensorState.SENSOR_STATE_HIGH) }, debounce_high_time, {
            'leading': false,
            'trailing': true
        });

        this.sensor.watch(function (err: any, value: any) { //Watch for hardware interrupts on sensor GPIO, specify callback function
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
    public get_sensor_state(): SensorState {
        return this.state;
    }
}
