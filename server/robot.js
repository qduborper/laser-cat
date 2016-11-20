/**
 * Robot with continuous servos
 */
var Robot = function(opts) {

    var leftWheel = new five.Servo.Continuous({
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
        leftWheel.ccw(1);
        rightWheel.cw(1);
    };

    /**
     * Go back
     * @return {void} 
     */
    var _back = function(){
        leftWheel.cw(1);
        rightWheel.ccw(1);
    };

    /**
     * Turn left
     * @return {void} 
     */
    var _left = function(){
        leftWheel.cw(1);
        rightWheel.cw(1);
    };

    /**
     * Turn right
     * @return {void} 
     */
    var _right = function(){
        leftWheel.ccw(1);
        rightWheel.ccw(1);
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
