/**
 * Gun with servo trigger
 */
var Gun = function(opts) {

    var Joint = require('./servo-joint'),
        trigger = new Joint({
            minPos: 0,
            maxPos: 180,
            offset: opts.offset,
            pin: opts.pin,
            range: [0,180],
            center: false,
            invert: opts.invert,
            startAt: 0
        });

    /**
     * Shot trigger by moving servo to 90 degrees
     * @return {void} 
     */
    var _shot = function(){
        trigger.move(100);

        setTimeout(() => {
            trigger.move(0);
        }, 1000);
    };

    return {
        shot: _shot
    };
};

module.exports = Gun;
