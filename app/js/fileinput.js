$('.fileinput').change(function() {
    // When original file input changes, get its value, show it in the fake input
    var files = this.files,
        info  = '';
    if(typeof files != "undefined"){
        if (files.length > 1) {
            // Display number of selected files instead of filenames
            info     = files.length + ' files selected';
        } else {
            info     = files[0].name;
        }

        $(this).parent().parent().find('.file-name').html(info);
    }
});