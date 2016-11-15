/**
 * Gun with servo trigger
 */
var Gun = function(opts) {

    var Joint = require('./servo-joint'),
        trigger = new Joint({
            minPos: 0,
            maxPos: 180,
            offset: 0,
            pin: 11,
            range: [0,180],
            center: false,
            invert: true,
            startAt: 0
        });

    /**
     * Shot trigger by moving servo to 90 degrees
     * @return {void} 
     */
    var _shot = function(){
        servo.move(90);
        servo.move(0);
    };

    return {
        shot: _shot
    };
};

module.exports = Gun;
