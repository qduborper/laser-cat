/**
 * Joint Servo
 */
var Joint = function(opts) {

    var five = require('johnny-five'),
        //lowest hand postion tracked
        minPos = opts.minPos,
        // highest position tracked
        maxPos = opts.maxPos,
        // servo instance that handle this joint
        _servo = new five.Servo({
            address: 0x40,
            controller: "PCA9685",
            pin: opts.pin,
            range: opts.range,
            offset: opts.offset,
            center: true,
            invert: opts.invert
        });

    /**
     * Get servo angle value
     */
    var _getAngle = function() {
        return _servo.value - opts.offset;
    };

    /**
     * Move the joint of the calculated angle
     * @param {Number} pos - tracked hand/finger position
     * @param {function()} constraint - if present, a constraint to apply to the current position
     */
    var _move = function(pos, constraint) {
        var angle;
        if (constraint) {
            pos = constraint(pos);
        }
        angle = _scale(pos);
        _servo.to(angle);
    };

    /**
     * Map a given position to the corresponding angle
     * @param {Number} pos - positon to map from its range to the range of angle
     * @return {Number} the corresponding angle
     */
    var _scale = function(pos) {
        // if current hand/finger position is outside the tracked range
        // get the nearest tracked limit
        if (pos<minPos) {
            pos = minPos;
        }
        else if (pos>maxPos) {
            pos = maxPos;
        }
        return Math.floor(five.Fn.map(pos, minPos, maxPos, _servo.range[0], _servo.range[1]));
    };

    return {
        servo: _servo,
        getAngle: _getAngle,
        move: _move,
        scale: _scale
    };
};

module.exports = Joint;
