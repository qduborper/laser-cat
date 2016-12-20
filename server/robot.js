/**
 * Robot with continuous servos
 */
var Robot = function(opts) {

    var five = require("johnny-five"),
        wheels = {},
        wheels.left = new five.Servo.Continuous({
            controller: "PCA9685",
            pin: opts.pinLeftWheel
        }),
        wheels.right = new five.Servo.Continuous({
            controller: "PCA9685",
            pin: opts.pinRightWheel,
            invert: true
        }),
        wheels.both = new five.Servos([opts.pinLeftWheel, opts.pinRightWheel]).stop(); // reference both together
    ;

    /**
     * Go straight
     * @return {void} 
     */
    var _straight = function(){
        wheels.both.cw();
    };

    /**
     * Go back
     * @return {void} 
     */
    var _back = function(){
        wheels.both.ccw();
    };

    /**
     * Turn left
     * @return {void} 
     */
    var _left = function(){
        wheels.left.ccw();
        wheels.right.cw();
    };

    /**
     * Turn right
     * @return {void} 
     */
    var _right = function(){
        wheels.left.cw();
        wheels.right.ccw();
    };

    /**
     * Stop rotation
     * @return {void} 
     */
    var _stop = function(){
        wheels.both.stop();
    };

    return {
        straight:       _straight,
        back:           _back,
        left:           _left,
        right:          _right,
        stop:           _stop,
        wheels:         wheels
    };
};

module.exports = Robot;
