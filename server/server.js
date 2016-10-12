var raspi = require('raspi-io'),
    five = require("johnny-five"),
    board = new five.Board({
        io: new raspi()
    });

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
        socketio_jwt   = require("socketio-jwt"),
        jwt = require('jsonwebtoken'),
        jwt_secret = 'piplaylasercatarduinoprojectraspberry',
        turf = require('turf-random'),
        storage = require('node-persist'),
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

    app.get('/admin', function (req, res) {
        console.log('login admin : ', req.user);

        var profile = { user: req.user };

        // We are sending the profile inside the token
        var token = jwt.sign(profile, jwt_secret, {expiresInMinutes: 60}),
            local = (req.query.local !== undefined) ? 'local='+req.query.local+'&' : '';

        if( req.query.token === undefined || req.query.token !== token ){
            res.redirect('/admin?'+local+'token='+token);
        }else{
            res.sendFile(path.resolve(__dirname + '/../admin/index.html'));
        }

    });

    app.use('/admin', express.static(path.resolve(__dirname + '/../admin')));

    // Camera
    var camera = new Camera();
    camera.start();

    // Arduino
    var servoX = new Joint({
            minPos: 0,
            maxPos: 180,
            offset: 70,
            pin: 8,
            range: [0,180],
            invert: false
        }),
        servoY = new Joint({
            minPos: 0,
            maxPos: 60,
            offset: 1,
            pin: 9,
            range: [0,45],
            invert: false
        }),
        laser = new Laser({
            pin: 11
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
        console.log("io connections : ", io.of('/www').sockets.length);
        io.of('/admin').emit('connections', io.of('/www').sockets.length);

        if( !laser.getDisable() && currentsid === -1 ){
            currentsid = socket.id;
        }else{
            socket.emit('updateStatus', true);
        }

        // Timer
        /*if( io.sockets.sockets.length > 1 && Timer.isStopped ){
            Timer.start(120, timerCallback);
        }*/

        // Events

        socket.emit('updateCamera', camera.getIsStopped()); //Camera status

        socket.on('laserOn', function(){

            if( socket.id !== currentsid )
                return;

            laser.on();
        });

        socket.on('laserOff', function(){

            if( socket.id !== currentsid )
                return;

            laser.off();
        });

        socket.on('laserBlink', function(){

            if( socket.id !== currentsid )
                return;

            laser.blink(500);
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

        // Disconnection

        socket.on('disconnect', function(){
            console.log('user disconnected ', socket.id);
            io.of('/admin').emit('connections', io.of('/www').sockets.length);

            if( currentsid === socket.id ){
                currentsid = -1;

                //Update status for next client if exists
                if( !laser.getDisable() && io.of('/www').sockets.length > 0 ){
                    var soc = io.of('/www').sockets[0];
                    currentsid = soc.conn.id;
                    soc.emit('updateStatus', false);
                }
            }

            //Turn off laser if no connections
            if( io.of('/www').sockets.length === 0 ){
                console.log('no connections, turn off laser');
                laser.off();
            }
        });
    });

    //Admin Socket connection

    io.of('/admin').on('connection', socketio_jwt.authorize({
        secret: jwt_secret,
        timeout: 15000 // 15 seconds to send the authentication message
    })).on('authenticated', function(socket) {
        
        //this socket is authenticated, we are good to handle more events from it.
        console.log(socket.decoded_token.user, 'connected');

        io.of('/admin').emit('connections', io.of('/www').sockets.length);
        socket.emit('updateCamera', camera.getIsStopped()); //Camera status

        socket.on('getSettings', function(cb){
            cb({
                laser: laser.getIsOn(),
                camera: camera.getIsStopped(),
                controls: laser.getDisable(),
                breaks: storage.getItem('breaks')
            });
        });

        socket.on('cameraOn', function(){
            camera.start();

            setTimeout(function(){
                io.of('/admin').emit('updateCamera', false);
                io.of('/www').emit('updateCamera', false);
            }, 5000);
        });

        socket.on('cameraOff', function(){
            camera.stop();
            io.of('/admin').emit('updateCamera', true);
            io.of('/www').emit('updateCamera', true);
        });

        socket.on('controlsOn', function(){
            laser.setDisable(false);

            //Update status for first client if exists
            if( io.of('/www').sockets.length > 0 ){
                var soc = io.of('/www').sockets[0];
                currentsid = soc.conn.id;
                soc.emit('updateStatus', false);
            }
        });

        socket.on('controlsOff', function(){
            laser.setDisable(true);
            currentsid = -1;
            io.of('/www').emit('updateStatus', true);
        });

        socket.on('setBreaks', function(breaks){
            var arr = breaks.split('\n');
            storage.setItem('breaks', arr);
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

        socket.on('laserOn', function(){
            laser.on();
        });

        socket.on('laserOff', function(){
            laser.off();
        });

        socket.on('laserMove', function(pos, fn){

            var p = laser.target(pos.x, pos.y);
            servoX.move(p.x);
            servoY.move(p.y);

            if( fn !== undefined ){
                fn();
            }
        });
    });

});
