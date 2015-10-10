(function ($) {
    'use strict';

    var socket = io('/admin'),
        autoMode = null;

    // Get settings
    socket.on('getSettings', function(params){
        var idCamera = params.camera ? 0 : 1,
            idControls = params.controls ? 0 : 1;

        //Camera
        $('.js-camera-bt:eq('+idCamera+')').addClass('active').find('input').attr('checked', 'checked');
        
        //Controls
        $('.js-controls-bt:eq('+idControls+')').addClass('active').find('input').attr('checked', 'checked');
        
        //Breaks
        if( params.breaks !== undefined ){
            $('.js-breaks').val( params.breaks.join('\n') );
        }
    });

    // Update connections
    socket.on('connections', function(nb){
        var $connections = $('.js-connections');
        $connections.text(nb);
    });

    //Camera + controls
    $('.js-camera-bt').on('click', function(e){
        var id = $(this).find('input').attr('id');
        socket.emit(id);
    });

    $('.js-controls-bt').on('click', function(e){
        var id = $(this).find('input').attr('id');
        socket.emit(id);
    });

    //Submit
    $('.js-submit').on('click', function(e){
        socket.emit('setBreaks', $('.js-breaks').val());
    });

})(jQuery);