/**
 * Queue
 */
var Timer = function(opts) {

    //Init vars
    var interval = null,
        endCallback = null,
        time = 0,
        _isStopped = true;

    /**
     * Get servo angle value
     */
    var _startTimer = function(t, cb) {
        time = t;
        endCallback = cb;
        interval = setInterval(_intervalCallback, 1000);
        _isStopped = false;
    };

    /**
     * Move the joint of the calculated angle
     * @param {Number} pos - tracked hand/finger position
     * @param {function()} constraint - if present, a constraint to apply to the current position
     */
    var _stopTimer = function(pos, constraint) {
        clearInterval(interval);
        _isStopped = true;
        endCallback();
    };

    /**
     * Get servo angle value
     */
    var _intervalCallback = function() {
        console.log(time);

        if( time <= 0 ){
            _stopTimer();
        }

        time--;
    };

    return {
        start: _startTimer,
        stop: _stopTimer,
        isStopped: _isStopped
    };
};

module.exports = Timer;
