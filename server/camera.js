/**
 * Camera
 */
var Camera = function(opts) {

    //Init vars
    var exec = require('child_process').exec,
        cameraCmd = null,
        _isStopped = true;

    /**
     * Start Camera
     */
    var _start = function() {

        if(!_isStopped) return; 

        cameraCmd = exec("cvlc v4l2:///dev/video0:chroma=mjpg:width=750:height=422:fps=25 --sout '#standard{access=http{mime=multipart/x-mixed-replace;boundary=--7b3cc56e5f51db803f790dad720ed50a},mux=mpjpeg,dst=:1234}' -vvv");
        _isStopped = false;
        console.log('camera started');

        // Camera events
        cameraCmd.stdout.on('data', function(data) {
            console.log('cameraCmd stdout: ' + data);
        });
        cameraCmd.stderr.on('data', function(data) {
            console.log('cameraCmd stdout: ' + data);
        });
        cameraCmd.on('close', function(code) {
            console.log('cameraCmd closing code: ' + code);
        });
    };

    /**
     * Stop camera
     */
    var _stop = function() {

        if(_isStopped) return; 

        // cameraCmd.stdout.off('data');
        // cameraCmd.stderr.off('data');
        // cameraCmd.off('close');
        cameraCmd.kill();
        _isStopped = true;
        console.log('camera stopped');
    };

    return {
        start: _start,
        stop: _stop,
        isStopped: _isStopped
    };
};

module.exports = Camera;
