(function ($) {
    'use strict';

    var socket = io('/www'),
        autoMode = null,
        cameraStream = 'http://'+window.location.hostname+':81';

    // Update camera
    socket.on('camera.update', function(nocamera){

        //If camera connected
        if( nocamera ){
            $('.video img').attr('src', '/images/nocamera.png');
        }else{
            $('.video img').attr('src', cameraStream);
        }
    });

    // Update status
    socket.on('status.update', function(ko){
        var $status = $('.js-status-ko'),
            $inputs = $('.btn');

        if(ko){
            $status.removeClass('hide');
            $inputs.attr('disabled', 'disabled');
        }else{
            $status.addClass('hide');
            $inputs.removeAttr('disabled');
        }
    });

    // Video click
    $('.js-stream').on('click', function(e){

        if(autoMode !== null){
            $('.js-automode-bt:eq(0)').trigger('click');
        }

        var imgWidth = $(this).width(),
            imgHeight = $(this).height(),
            x = e.offsetX * 752 / imgWidth,
            y = e.offsetY * 416 / imgHeight;

        socket.emit('laser.move', { pos : { x: x, y: y } });
    });

    // Laser
    $('.js-laser-bt').on('click', function(e){
        socket.emit($(this).find('input').attr('id'));
    });

    // Shot
    $('.js-shot-bt').on('click', function(e){
        socket.emit($(this).attr('id'));
    });

    // Auto mode
    $('.js-automode-bt').on('click', function(e){
        var interval = parseInt($(this).find('input').data('interval'), 10);

        clearInterval(autoMode);
        autoMode = null;

        if( interval >= 750 ){
            autoMode = setInterval(function(){
                socket.emit('laser.moveToRandomPosition');
            }, interval);
        }
    });

    // Robot
    var isKeyDown = false;
    $(document).on("keydown keyup", function(e) {

        if( e.type === "keydown" ){

            if( isKeyDown ) return;

            isKeyDown = true;

            switch(e.which) {
                case 37: // left
                socket.emit('robot.left');
                break;

                case 38: // up
                socket.emit('robot.straight');
                break;

                case 39: // right
                socket.emit('robot.right');
                break;

                case 40: // down
                socket.emit('robot.back');
                break;

                default: return;
            }

        }else{
            isKeyDown = false;
            socket.emit('robot.stop');
        }

        e.preventDefault();
    });


})(jQuery);