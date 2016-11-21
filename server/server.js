var raspi = require('raspi-io'),
    five = require("johnny-five"),
    board = new five.Board({
        io: new raspi()
    });

board.on("ready", function() {
    console.log("board ready");

    var path            = require('path'),
        auth            = require('http-auth'),
        basic           = auth.basic({
                            realm: "Admin Area.",
                            file: __dirname + "/../data/users.htpasswd"
                        }),
        express         = require('express'),
        app             = express(),
        server          = require('http').Server(app),
        io              = require('socket.io')(server),
        socketio_jwt    = require("socketio-jwt"),
        jwt             = require('jsonwebtoken'),
        jwt_secret      = 'piplaylasercatarduinoprojectraspberry',
        turf            = require('turf-random'),
        storage         = require('node-persist'),
        currentsid      = -1,
        Joint           = require('./servo-joint'),
        Laser           = require('./laser'),
        Gun             = require('./gun'),
        Robot           = require('./robot'),
        Timer           = require('./timer'),
        Camera          = require('./camera'),
        timerCallback   = null;

    // Server
    server.listen(80);
    app.use('/', express.static(path.resolve(__dirname + '/../www')));
    app.use('/admin', auth.connect(basic));

    app.get('/admin', function (req, res) {
        console.log('login admin : ', req.user);

        var profile = { user: req.user };

        // We are sending the profile inside the token
        var token = jwt.sign(profile, jwt_secret, { expiresIn : 60*60*24 }),
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

    // Raspberry GPIO
    var servoX = new Joint({
            minPos: 0,
            maxPos: 180,
            offset: 0,
            pin: 12,
            range: [0,180],
            invert: false
        }),
        servoY = new Joint({
            minPos: 0,
            maxPos: 45,
            offset: 0,
            pin: 13,
            range: [0,45],
            invert: true
        }),
        laser = new Laser({
            pin: 'P1-36'
        }),
        robot = new Robot({
            pinLeftWheel: 4,
            pinRightWheel: 5
        }),
        gun = new Gun({
            pin: 10,
            offset: 15, //Adjust offset
            invert: false
        }),
        gun2 = new Gun({
            pin: 11,
            offset: 0,
            invert: true
        })
    ;

    // Timer callback
    /*timerCallback = function(e){

        //Update status for next client if exists
        if( io.sockets.sockets.length > 1 ){
            var soc = io.sockets.sockets[0];
            currentsid = soc.conn.id;
            soc.emit('status.update', false);
        }
    };*/

    //www Socket connection
    
    // listener function
    var socketListener = function(socket, event, cb){

        socket.on(event, function(params){

            // Allow only one emiter
            if( socket.id !== currentsid )
                return;

            cb(params);
        });
    };

    io.of('/www').on('connection', function(socket){
        var wwwSockets = Object.keys(io.of('/www').sockets);

        console.log("io connection ", socket.id);
        console.log("io connections : ", wwwSockets.length);
        io.of('/admin').emit('connections', wwwSockets.length);

        if( !laser.getDisable() && currentsid === -1 ){
            currentsid = socket.id;
        }else{
            socket.emit('status.update', true);
        }

        // Timer
        /*if( io.sockets.sockets.length > 1 && Timer.isStopped ){
            Timer.start(120, timerCallback);
        }*/

        // Events

        //Camera status
        socket.emit('camera.update', camera.getIsStopped());

        // Laser
        socketListener(socket, 'laser.on', function(){
            laser.on();
        });

        socketListener(socket, 'laser.off', function(){
            laser.off();
        });

        socketListener(socket, 'laser.blink', function(){
            laser.blink(500);
        });

        socketListener(socket, 'laser.move', function(params){
            var p = laser.target(params.pos.x, params.pos.y);
            servoX.move(p.x);
            servoY.move(p.y);

            if( params.fn !== undefined ){
                params.fn();
            }
        });

        socketListener(socket, 'laser.moveToRandomPosition', function(){
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

        // Gun
        socketListener(socket, 'gun.shot1', function(){
            gun.shot();
        });

        socketListener(socket, 'gun.shot2', function(){
            gun2.shot();
        });

        // Robot wheels
        socketListener(socket, 'robot.straight', function(){
            robot.straight();
        });

        socketListener(socket, 'robot.back', function(){
            robot.back();
        });

        socketListener(socket, 'robot.left', function(){
            robot.left();
        });

        socketListener(socket, 'robot.right', function(){
            robot.right();
        });

        socketListener(socket, 'robot.stop', function(){
            robot.stop();
        });

        // Disconnection
        socket.on('disconnect', function(){
            console.log('user disconnected ', socket.id);
            var wwwSockets = Object.keys(io.of('/www').sockets);

            io.of('/admin').emit('connections', wwwSockets.length);

            if( currentsid === socket.id ){
                currentsid = -1;

                //Update status for next client if exists
                if( !laser.getDisable() && wwwSockets.length > 0 ){
                    currentsid = wwwSockets[0];
                    socket.broadcast.to(currentsid).emit('status.update', false);
                }
            }

            //Turn off laser if no connections
            if( wwwSockets.length === 0 ){
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
        var wwwSockets = Object.keys(io.of('/www').sockets);

        io.of('/admin').emit('connections', wwwSockets.length);
        socket.emit('camera.update', camera.getIsStopped()); //Camera status

        socket.on('settings.get', function(cb){
            cb({
                laser: laser.getIsOn(),
                camera: camera.getIsStopped(),
                controls: laser.getDisable(),
                breaks: storage.getItem('breaks')
            });
        });

        socket.on('camera.on', function(){
            camera.start();

            setTimeout(function(){
                io.of('/admin').emit('camera.update', false);
                io.of('/www').emit('camera.update', false);
            }, 5000);
        });

        socket.on('camera.off', function(){
            camera.stop();
            io.of('/admin').emit('camera.update', true);
            io.of('/www').emit('camera.update', true);
        });

        socket.on('controls.on', function(){
            laser.setDisable(false);
            var wwwSockets = Object.keys(io.of('/www').sockets);

            //Update status for first client if exists
            if( wwwSockets.length > 0 ){
                currentsid = wwwSockets[0];
                socket.broadcast.to(currentsid).emit('status.update', false);
            }
        });

        socket.on('controls.off', function(){
            laser.setDisable(true);
            currentsid = -1;
            io.of('/www').emit('status.update', true);
        });

        socket.on('breaks.set', function(breaks){
            var arr = breaks.split('\n');
            storage.setItem('breaks', arr);
        });

        // For calibration
        socket.on('axis.update', function(data, fn){

            if( data.axis === 'xaxis' ){
                servoX.move( data.val );
            }else{
                servoY.move( data.val );
            }

            if( fn !== undefined ){
                fn();
            }
        });

        socket.on('laser.get', function(fn){
            if( fn !== undefined ){
                fn( { x: servoX.getAngle(), y: servoY.getAngle() } );
            }
        });

        socket.on('calibration.get', function(fn){
            if( fn !== undefined ){
                fn( laser.getCalibration() );
            }
        });

        socket.on('calibration.set', function(calibration, fn){
            laser.setCalibration(calibration.target, calibration.servo);

            if( fn !== undefined ){
                fn();
            }
        });

        socket.on('laser.on', function(){
            laser.on();
        });

        socket.on('laser.off', function(){
            laser.off();
        });

        socket.on('laser.move', function(params){

            var p = laser.target(params.pos.x, params.pos.y);
            servoX.move(p.x);
            servoY.move(p.y);

            if( params.fn !== undefined ){
                params.fn();
            }
        });
    });

});
