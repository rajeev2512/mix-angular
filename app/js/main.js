/*
 * jQuery File Upload Plugin JS Example 8.3.0
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint nomen: true, regexp: true */
/*global $, window, blueimp */

$(function () {
    'use strict';
    var path = $('#imageupload').attr('action');  
   
    // Initialize the jQuery File Upload widget:
    $('#imageupload').fileupload({
        // Uncomment the following to send cross-domain cookies:
        //xhrFields: {withCredentials: true},
        //url: path
        //url: '/dev001/projects_new/pivotit/module/fileupload/static/server/php'
         //url: path
         acceptFileTypes: /(\.|\/)(jpg|png|jpeg|gif)$/i,
        url: path,
        sequentialUploads: true
        //url: '/phpfox/v3/module/fileupload/static/server/php'
    });
    $('#imageupload').bind('fileuploadsubmit', function (e, data) {
        var inputs = data.context.find(':input');
        if (inputs.filter('[required][value=""]').first().focus().length) {
            return false;
        }
        data.formData = inputs.serializeArray();
    });

     // Load existing files:
    $('#imageupload').addClass('fileupload-processing');
    $.ajax({
        // Uncomment the following to send cross-domain cookies:
        //xhrFields: {withCredentials: true},
        url: $('#imageupload').fileupload('option', 'url'),
        dataType: 'json',
        context: $('#imageupload')[0]
    }).always(function () {
        $(this).removeClass('fileupload-processing');
    }).done(function (result) {
        $(this).fileupload('option', 'done')
            .call(this, null, {result: result});
    });

});

$(function () {
    'use strict';
    var path = $('#videoupload').attr('action');  
   
    // Initialize the jQuery File Upload widget:
    $('#videoupload').fileupload({
        // Uncomment the following to send cross-domain cookies:
        //xhrFields: {withCredentials: true},
        //url: path
        //url: '/dev001/projects_new/pivotit/module/fileupload/static/server/php'
         //url: path
        acceptFileTypes: /(\.|\/)(mp4)$/i,
        url: path,
        sequentialUploads: true
        //url: '/phpfox/v3/module/fileupload/static/server/php'
    });
    $('#videoupload').bind('fileuploadsubmit', function (e, data) {
        var inputs = data.context.find(':input');
        if (inputs.filter('[required][value=""]').first().focus().length) {
            return false;
        }
        data.formData = inputs.serializeArray();
    });

     // Load existing files:
    $('#videoupload').addClass('fileupload-processing');
    $.ajax({
        // Uncomment the following to send cross-domain cookies:
        //xhrFields: {withCredentials: true},
        url: $('#videoupload').fileupload('option', 'url'),
        dataType: 'json',
        context: $('#videoupload')[0]
    }).always(function () {
        $(this).removeClass('fileupload-processing');
    }).done(function (result) {
        $(this).fileupload('option', 'done')
            .call(this, null, {result: result});
    });

});
