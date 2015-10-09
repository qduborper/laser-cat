(function ($) {
    'use strict';

    var socket = io().of('/www'),
        autoMode = null;

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

    //Video click
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

    //Laser
    $('.js-laser-bt').on('click', function(e){
        var id = $(this).find('input').attr('id');
        socket.emit(id);
    });

    //Auto mode
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


})(jQuery);