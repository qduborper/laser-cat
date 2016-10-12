/**
 * Laser
 */
var Laser = function(opts) {

    var five = require('johnny-five'),
        storage = require('node-persist'),
        numeric = require('./lib/numeric-1.2.6.min'),
        luqr = require('luqr').luqr,
        // laser instance
        _led = new five.Led({
            pin: opts.pin,
            address: 0x40,
            controller: "PCA9685"
        }),
        _transform = null,
        _disabled = false,
        _targetCalibration = null,
        _servoCalibration = null,
        _isOn = false;

    var _on = function(){
        _led.stop();
        _led.on();
        _isOn = true;
    };

    var _off = function(){
        _led.stop();
        _led.off();
        _isOn = false;
    };

    var _blink = function(){
        _led.blink(500);
    };

    var _getIsOn = function(){
        return _isOn;
    };

    var _setCalibration = function(targetCalibration, servoCalibration){
        _targetCalibration = targetCalibration;
        _servoCalibration = servoCalibration;
        _generateTransform();
        _saveCalibration()
    };

    var _getCalibration = function(){
        return { target : _targetCalibration, servo: _servoCalibration };
    };

    var _setDisable = function(disabled){
        _disabled = disabled;
    };

    var _getDisable = function(){
        return _disabled;
    };

    var _target = function(x, y){
        //Transform screen coordinate position to servo coordinate position and move servos accordingly.
        if( _transform == null ){
            return { x : 0, y : 0 };
        }

        var screen = [parseFloat(x), parseFloat(y), 1.0],
            servo = numeric.dot(_transform, screen);

        return { x : Math.round(servo[0] / servo[2]), y : Math.round(servo[1] / servo[2]) };
    };

    var _saveCalibration = function(){
        storage.setItem('calibration', { target: _targetCalibration, servo: _servoCalibration });
        console.log('save calibration', _targetCalibration, _servoCalibration);
    };

    var _loadCalibration = function(){
        var calib = storage.getItem('calibration');

        if( calib !== undefined ){
            _targetCalibration = calib.target;
            _servoCalibration = calib.servo;
            console.log('load calibration', _targetCalibration, _servoCalibration);
        }
    };

    var _generateTransform = function(){
        // Generate the matrix to transform a quadrilaterl in target click coordinates to a quadrilateral in
        // servo movement coordinates using a perspective transformation.  
        // See http://alumni.media.mit.edu/~cwren/interpolator/ for more details.

        if (_targetCalibration === null || _servoCalibration === null)
            return;

        // Define some variables to make the matrices easier to read
        var x1 = parseFloat(_targetCalibration[0]['x']),
            y1 = parseFloat(_targetCalibration[0]['y']),
            x2 = parseFloat(_targetCalibration[1]['x']),
            y2 = parseFloat(_targetCalibration[1]['y']),
            x3 = parseFloat(_targetCalibration[2]['x']),
            y3 = parseFloat(_targetCalibration[2]['y']),
            x4 = parseFloat(_targetCalibration[3]['x']),
            y4 = parseFloat(_targetCalibration[3]['y']),
            X1 = parseFloat(_servoCalibration[0]['x']),
            Y1 = parseFloat(_servoCalibration[0]['y']),
            X2 = parseFloat(_servoCalibration[1]['x']),
            Y2 = parseFloat(_servoCalibration[1]['y']),
            X3 = parseFloat(_servoCalibration[2]['x']),
            Y3 = parseFloat(_servoCalibration[2]['y']),
            X4 = parseFloat(_servoCalibration[3]['x']),
            Y4 = parseFloat(_servoCalibration[3]['y']);
        
        // Define matrices
        var flatA = [
            x1,y1,1,0,0,0,-X1*x1,-X1*y1,
            0,0,0,x1,y1,1,-Y1*x1,-Y1*y1,
            x2,y2,1,0,0,0,-X2*x2,-X2*y2,
            0,0,0,x2,y2,1,-Y2*x2,-Y2*y2,
            x3,y3,1,0,0,0,-X3*x3,-X3*y3,
            0,0,0,x3,y3,1,-Y3*x3,-Y3*y3,
            x4,y4,1,0,0,0,-X4*x4,-X4*y4,
            0,0,0,x4,y4,1,-Y4*x4,-Y4*y4
        ];
        var A = luqr.fold(flatA, 8);
        var b = [X1, Y1, X2, Y2, X3, Y3, X4, Y4];

        // Solve for coefficients x in equation Ax = B
        var x = luqr.solveQR(A, b);
        
        // Set transformation matrix with coefficients
        _transform = [[x[0], x[1], x[2]],
                     [x[3], x[4], x[5]],
                     [x[6], x[7],  1.0]];
    };

    storage.initSync();
    _loadCalibration();
    _generateTransform();

    return {
        on: _on,
        off: _off,
        blink: _blink,
        getIsOn: _getIsOn,
        targetCalibration: _targetCalibration,
        servoCalibration: _servoCalibration,
        setCalibration: _setCalibration,
        getCalibration: _getCalibration,
        setDisable: _setDisable,
        getDisable: _getDisable,
        target: _target
    };
};

module.exports = Laser;
