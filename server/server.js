var five = require("johnny-five"),
    board = new five.Board();

board.on("ready", function() {
    console.log("board ready");

    var path = require('path'),
        auth = require('http-auth'),
        basic = auth.basic({
            realm: "Admin Area.",
            file: __dirname + "/../data/users.htpasswd"
        }),
        express = require('express'),
        app = express(),
        server = require('http').Server(app),
        io = require('socket.io')(server),
        turf = require('turf-random'),
        currentsid = -1,
        Joint = require('./servo-joint'),
        Laser = require('./laser'),
        Timer = require('./timer'),
        Camera = require('./camera'),
        timerCallback = null;

    // Server
    server.listen(80);
    app.use('/', express.static(path.resolve(__dirname + '/../www')));
    app.use('/admin', auth.connect(basic));
    app.use('/admin', express.static(path.resolve(__dirname + '/../admin')));

    app.get('/', function (req, res) {
      res.sendFile('index.html');
    });

    app.get('/admin', function (req, res) {
      res.sendFile('index.html');
    });

    // Camera
    var camera = new Camera();
    camera.start();

    // Arduino
    var servoX = new Joint({
            minPos: 0,
            maxPos: 180,
            offset: 45,
            pin: 3,
            range: [0,180],
            invert: false
        }),
        servoY = new Joint({
            minPos: 0,
            maxPos: 45,
            offset: 40,
            pin: 11,
            range: [0,45],
            invert: false
        }),
        laser = new Laser({
            pin: 4
        });

    // Timer callback
    /*timerCallback = function(e){

        //Update status for next client if exists
        if( io.sockets.sockets.length > 1 ){
            var soc = io.sockets.sockets[0];
            currentsid = soc.conn.id;
            soc.emit('updateStatus', false);
        }
    };*/

    //www Socket connection

    io.of('/www').on('connection', function(socket){

        console.log("io connection ", socket.id);
        console.log("io connections : ", io.sockets.sockets.length);

        if( currentsid === -1 ){
            currentsid = socket.id;
        }else{
            socket.emit('updateStatus', true);
        }

        // Timer
        /*if( io.sockets.sockets.length > 1 && Timer.isStopped ){
            Timer.start(120, timerCallback);
        }*/

        // Events

        socket.on('laserOn', function(){

            if( socket.id !== currentsid )
                return;

            laser.led.stop();
            laser.led.on();
        });

        socket.on('laserOff', function(){

            if( socket.id !== currentsid )
                return;

            laser.led.stop();
            laser.led.off();
        });

        socket.on('laserBlink', function(){

            if( socket.id !== currentsid )
                return;

            laser.led.blink(500);
        });

        socket.on('laserMove', function(pos, fn){

            if( socket.id !== currentsid )
                return;

            var p = laser.target(pos.x, pos.y);
            servoX.move(p.x);
            servoY.move(p.y);

            if( fn !== undefined ){
                fn();
            }
        });

        socket.on('moveToRandomPosition', function(){

            if( socket.id !== currentsid )
                return;

            var calib = laser.getCalibration(),
                xList = [calib.servo[0].x, calib.servo[1].x, calib.servo[2].x, calib.servo[3].x],
                yList = [calib.servo[0].y, calib.servo[1].y, calib.servo[2].y, calib.servo[3].y],
                numberSort = function (a,b) {
                    return a - b;
                };

            xList.sort(numberSort);
            yList.sort(numberSort);

            var points = turf('points', 1, {
                bbox: [xList[0], yList[0], xList.pop(), yList.pop()]
            });

            // console.log(points.features[0].geometry.coordinates);
            var coord = points.features[0].geometry.coordinates;
            servoX.move(Math.round(coord[0]));
            servoY.move(Math.round(coord[1]));
        });

        // For calibration

        socket.on('updateAxis', function(data, fn){

            if( data.axis === 'xaxis' ){
                servoX.move( data.val );
            }else{
                servoY.move( data.val );
            }

            if( fn !== undefined ){
                fn();
            }
        });

        socket.on('getLaser', function(fn){
            if( fn !== undefined ){
                fn( { x: servoX.getAngle(), y: servoY.getAngle() } );
            }
        });

        socket.on('getCalibration', function(fn){
            if( fn !== undefined ){
                fn( laser.getCalibration() );
            }
        });

        socket.on('setCalibration', function(calibration, fn){
            laser.setCalibration(calibration.target, calibration.servo);

            if( fn !== undefined ){
                fn();
            }
        });

        // Disconnection

        socket.on('disconnect', function(){
            console.log('user disconnected ', socket.id);

            if( currentsid === socket.id ){
                currentsid = -1;

                //Update status for next client if exists
                if( io.sockets.sockets.length > 0 ){
                    var soc = io.sockets.sockets[0];
                    currentsid = soc.conn.id;
                    soc.emit('updateStatus', false);
                }
            }

            //Turn off laser if no connections
            if( io.sockets.sockets.length === 0 ){
                console.log('no connections, turn off laser');
                laser.led.stop();
                laser.led.off();
            }
        });
    });

    //Admin Socket connection

    io.of('/admin').on('connection', function(socket){

        socket.on('cameraOn', function(){
            camera.start();
        });

        socket.on('cameraOff', function(){
            camera.stop();
        });

    });

});
