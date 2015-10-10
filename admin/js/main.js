(function ($) {
    'use strict';

    var autoMode = null;

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


    // Calibration

    // Setup servo controls
    var setupAxis = function(axis) {
        var group = $('#' + axis);
        var input = group.find('input');
        var erroralert = group.find('div.alert-danger');
        var updateAxis = function() {
            socket.emit('updateAxis', { axis : axis, val : input.val() }, function(){
                group.removeClass('has-error');
                erroralert.hide();
            });
        };
        erroralert.hide();
        input.change(function() {
            updateAxis();
        });
        group.find('button.decrease').click(function() {
            input.val(Number(input.val()) - 2);
            updateAxis();
        });
        group.find('button.increase').click(function() {
            input.val(Number(input.val()) + 2);
            updateAxis();
        });
    };
    setupAxis('xaxis');
    setupAxis('yaxis');
    // Update servo positions by querying server
    var updateServos = function() {
        socket.emit('getLaser', function(data){
            console.log('get laser', data);
            $('#xaxis input').val(data.x);
            $('#yaxis input').val(data.y);
        });
    };
    
    // Generate an event that fires when the video image is loaded.
    // Use both the load event on the image, and a 1 second timeout as
    // a fallback.  I found the fallback is necessary with Chrome 
    // because it sometimes never fires the load event for an MJPEG image.
    var video = $('#video img').first();
    var videoLoad = $.Deferred();
    window.setTimeout(function() {
        videoLoad.resolve();
    }, 1000);
    video.load(function() {
        videoLoad.resolve();
    });
    
    // Wait for the video image to load, then setup calibration.
    videoLoad.done(function() {
        calibration.setup('calibrateLayer', video.width(), video.height());
        updateServos();
    });
    // Send target commands based on click locations
    $('#calibrateLayer').click(function(ev) {
        if (!calibration.isCalibrating()) {
            socket.emit('laserMove', { x: ev.offsetX, y: ev.offsetY }, function(){
                updateServos();
            });
        }
    });

})(jQuery);

