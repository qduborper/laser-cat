(function ($) {
    'use strict';

    var socket = io(),
        autoMode = null;

    //Camera
    $('.js-camera-bt').on('click', function(e){
        var id = $(this).find('input').attr('id');
        socket.emit(id);
    });

})(jQuery);