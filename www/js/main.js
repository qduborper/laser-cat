(function ($) {
    'use strict';

    var socket = io('/www'),
        autoMode = null,
        isLocal = getQueryVariable('local') !== '' ? true : false,
        cameraStream = isLocal ? 'http://'+getQueryVariable('local')+':1234' : 'http://laser-cat.ddns.net:1234';

    // Update camera
    socket.on('updateCamera', function(nocamera){

        //If camera connected
        if( nocamera ){
            $('.video img').attr('src', '/images/nocamera.png');
        }else{
            $('.video img').attr('src', cameraStream);
        }
    });

    // Update status
    socket.on('updateStatus', function(ko){
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
            x = e.offsetX * 750 / imgWidth,
            y = e.offsetY * 422 / imgHeight;

        socket.emit('laserMove', { x: x, y: y });
    });

    // Laser
    $('.js-laser-bt').on('click', function(e){
        var id = $(this).find('input').attr('id');
        socket.emit(id);
    });

    // Auto mode
    $('.js-automode-bt').on('click', function(e){
        var interval = parseInt($(this).find('input').data('interval'), 10);

        clearInterval(autoMode);
        autoMode = null;

        if( interval >= 750 ){
            autoMode = setInterval(function(){
                socket.emit('moveToRandomPosition');
            }, interval);
        }
    });

    // Utils
    var getQueryVariable = function(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
        console.log('Query variable %s not found', variable);
        return '';
    }


})(jQuery);