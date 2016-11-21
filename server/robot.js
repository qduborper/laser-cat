/**
 * Robot with continuous servos
 */
var Robot = function(opts) {

    const SPEED = 0.5;

    var five = require("johnny-five"),
        leftWheel = new five.Servo.Continuous({
            controller: "PCA9685",
            pin: opts.pinLeftWheel
        }),
        rightWheel = new five.Servo.Continuous({
            controller: "PCA9685",
            pin: opts.pinRightWheel
        })
    ;

    /**
     * Go straight
     * @return {void} 
     */
    var _straight = function(){
        leftWheel.cw(SPEED);
        rightWheel.ccw(SPEED);
    };

    /**
     * Go back
     * @return {void} 
     */
    var _back = function(){
        leftWheel.ccw(SPEED);
        rightWheel.cw(SPEED);
    };

    /**
     * Turn left
     * @return {void} 
     */
    var _left = function(){
        leftWheel.ccw(SPEED);
        rightWheel.ccw(SPEED);
    };

    /**
     * Turn right
     * @return {void} 
     */
    var _right = function(){
        leftWheel.cw(SPEED);
        rightWheel.cw(SPEED);
    };

    /**
     * Stop rotation
     * @return {void} 
     */
    var _stop = function(){
        leftWheel.stop();
        rightWheel.stop();
    };

    return {
        straight:       _straight,
        back:           _back,
        left:           _left,
        right:          _right,
        stop:           _stop
    };
};

module.exports = Robot;
