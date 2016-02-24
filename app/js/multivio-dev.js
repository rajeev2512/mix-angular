/***************************************************************************/
/* Cookie for jquery from                                                  */
/* http://plugins.jquery.com/files/issues/jjquery.cookie-modified.js_.txt  */
/***************************************************************************/

jQuery.cookie = function(name, value, options) {
  if (typeof value != 'undefined'  ||  (name  &&  typeof name != 'string')) { // name and value given, set cookie
    if (typeof name == 'string') {
      options = options || {};
      if (value === null) {
        value = '';
        options.expires = -1;
      }
      var expires = '';
      if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
        var date;
        if (typeof options.expires == 'number') {
          date = new Date();
          date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
        } else {
          date = options.expires;
        }
        expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
      }
      // CAUTION: Needed to parenthesize options.path and options.domain
      // in the following expressions, otherwise they evaluate to undefined
      // in the packed version for some reason...
      var path = options.path ? '; path=' + (options.path) : '';
      var domain = options.domain ? '; domain=' + (options.domain) : '';
      var secure = options.secure ? '; secure' : '';
      document.cookie = name + '=' + encodeURIComponent(value) + expires + path + domain + secure;
    } else { // `name` is really an object of multiple cookies to be set.
      for (var n in name) { jQuery.cookie(n, name[n], value||options); }
    }
  } else { // get cookie (or all cookies if name is not provided)
    var returnValue = {};
    if (document.cookie) {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (!name) {
          var nameLength = cookie.indexOf('=');
          returnValue[ cookie.substr(0, nameLength)] = decodeURIComponent(cookie.substr(nameLength+1));
        } else if (cookie.substr(0, name.length + 1) == (name + '=')) {
          returnValue = decodeURIComponent(cookie.substr(name.length + 1));
          break;
        }
      }
    }
    return returnValue;
  }
};


/***************************************************************************/
/* Extended jquery ui dialog to support fixed position, maximized and      */
/* restore. Inspired by http://code.google.com/p/jquery-ui-dialog-extra    */
/***************************************************************************/

//______ Dialog Options __________
var def_options = {
  'canMaximize' : false,
  'overlayWidth': 800,
  'overlayHeight': 600
};
$.extend($.ui.dialog.prototype.options, def_options);


//************************************
//Custom Dialog Init
//************************************

//save original init to call "super"
var _init = $.ui.dialog.prototype._init;

$.ui.dialog.prototype._init = function () {

  var self = this;
  
  //call super
  _init.apply(this, arguments);

  //get titleBar
  uiDialogTitlebar = this.uiDialogTitlebar;

  //we need two variables to preserve the original width and height so that can be restored.
  this._savePositionAndSize();

  //save a reference to the resizable handle so we can hide it when necessary (full screen).
  this.resizeableHandle =  this.uiDialog.resizable().find('.ui-resizable-se');

  //Save the height of the titlebar for the size operation
  this.titlebarHeight = parseInt(uiDialogTitlebar.outerHeight(true), 10) +
    parseInt(this.uiDialog.css('padding-top'), 10) +
    parseInt(this.uiDialog.css('padding-bottom'), 10);


  //-------------------------------------------------------------------------
  //restore button
  var uiDialogTitlebarRest = this.uiDialogTitlebarRest = $('<a href="#"></a>')
  .addClass(
    'dialog-restore ui-dialog-titlebar-rest ui-corner-all'
  )
  .attr('role', 'button')
  .hover(
    function () {
      uiDialogTitlebarRest.addClass('ui-state-hover');
    },
    function () {
      uiDialogTitlebarRest.removeClass('ui-state-hover');
    }
  )
  .focus(function () {
    uiDialogTitlebarRest.addClass('ui-state-focus');
  })
  .blur(function () {
    uiDialogTitlebarRest.removeClass('ui-state-focus');
  })
  .click(function (event) {
    self.restore();
    return false;
  })
  .appendTo(uiDialogTitlebar)
  .hide();

  var uiDialogTitlebarRestText = (this.uiDialogTitlebarRestText = $('<span>'))
  .addClass('ui-icon ui-icon-minus')
  .text('minimize')
  .appendTo(uiDialogTitlebarRest);


  //-------------------------------------------------------------------------
  //maximize button
  var uiDialogTitlebarMaximize = this.uiDialogTitlebarMaximize = $('<a href="#"></a>')
  .addClass(
    'dialog-maximize ui-dialog-titlebar-max ui-corner-all'
  )
  .attr('role', 'button')
  .hover(
    function () {
      uiDialogTitlebarMaximize.addClass('ui-state-hover');
    },
    function () {
      uiDialogTitlebarMaximize.removeClass('ui-state-hover');
    })
  .focus(function () {
    uiDialogTitlebarMaximize.addClass('ui-state-focus');
  })
  .blur(function () {
    uiDialogTitlebarMaximize.removeClass('ui-state-focus');
  })
  .click(function (event) {
    self.maximize();
    return false;
  });

  if (this.options.canMaximize) {
    uiDialogTitlebarMaximize
    .appendTo(uiDialogTitlebar)
    .css({right: 18});
  }

  var uiDialogTitlebarMaximizeText = (this.uiDialogTitlebarMaximizeText = $('<span>'))
  .addClass('ui-icon ui-icon-plus')
  .text('maximize')
  .appendTo(uiDialogTitlebarMaximize);


  //-------------------------------------------------------------------------
  // allows double click to maximize/restore operation
  this.uiDialogTitlebar
  .dblclick(function (event) {
    self.toggleMaximize();
    return false;
  });


  //-------------------------------------------------------------------------
  // avoid focus in iFrame during resize and drag operation
  // we put a div in top to block mouse event in iFrame
  var uiDisableContent = this.uiDisableContent = $('<div>')
  .addClass('ui-dialog-disablecontent')
  .css({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
    background: 'none repeat scroll 0 0 #888'
  })
  .fadeTo(0, 0.5)
  .appendTo(this.uiDialog)
  .hide();

  //-------------------------------------------------------------------------
  //before open the dialog
  var self = this;
  this.uiDialog.bind('dialogopen', function (event, ui) {
    //restore maximize position?
    self.getCookie();
    if (self.options.currentState === 'maximized') {
      self.maximize();
      $(window).bind('resize', {dialogObject: self}, self._maximizedResizeHandler);
    } else {
      $(window).bind('resize', {dialogObject: self}, self._normalResizeHandler);
    }
    //be sure that the dialog is in the visible part of the window
    self._adjustSizeAndPosition();
  });

  this.uiDialog.bind('dialogclose', function (event, ui) {
    if (self.options.currentState === 'maximized') {
      $(window).unbind('resize', self._maximizedResizeHandler);
    } else {
      $(window).unbind('resize', self._normalResizeHandler);
    }
  });

  //-------------------------------------------------------------------------
  //dialog move start
  this.uiDialog.bind('dialogdragstart', function (event, ui) {
    //avoid focus in iFrame
    //option: 'iframeFix' should solve the problem, but as we have to do that
    //for resize...
    self.uiDisableContent.show();
  });

  //-------------------------------------------------------------------------
  //dialog move stop
  this.uiDialog.bind('dialogdragstop', function (event, ui) {

    //remove focus interception
    self.uiDisableContent.hide();

    //save position for close/open operation
    self.options.position = [
      self.uiDialog.position().left - $(document).scrollLeft(), 
      self.uiDialog.position().top - $(document).scrollTop()
    ];
    
    //check that the dialog is in the visible part of the window
    //containment support window value, but it is ignore after one
    //fullscreen/restore sequence
    self._adjustSizeAndPosition();
  });

  //-------------------------------------------------------------------------
  //dialog resize start
  this.uiDialog.bind('dialogresizestart', function (event, ui) {
    
    //avoid focus in iFrame
    //option: 'iframeFix' similar than draggable does not exists for
    //resizeable
    self.uiDisableContent.show();

    //window resize event is fire when the dialog is resized. This make no
    //sense, but this patch solve the problem
    $(window).unbind('resize', self._normalResizeHandler);
    
    //as resizable does not support fixed position, thus translate the
    //position
    self.uiDialog.css({
      left: self.uiDialog.position().left, 
      top: self.uiDialog.position().top
    });
  });

  //-------------------------------------------------------------------------
  //dialog resize stop
  this.uiDialog.bind('dialogresizestop', function (event, ui) {
    
    //remove focus interception
    self.uiDisableContent.hide();

    //window resize event is fire when the dialog is resized. This make no
    //sense, but this patch solve the problem
    $(window).bind('resize', {dialogObject: self}, self._normalResizeHandler);

    //as resizable does not support fixed position, thus translate the
    //position
    self.uiDialog.css({
      left: self.uiDialog.position().left - $(document).scrollLeft(),
      top: self.uiDialog.position().top - $(document).scrollTop()
    });
    
    //force fixed position as it has been changed by jquery ui
    self.uiDialog.css({position: 'fixed'});

    //be sure that the dialog is in the window
    //containment option does not support "window" value!
    self._adjustSizeAndPosition();
  });

  //first state is normal thus bind window resize for normal resize dialog
  //mode
  //$(window).bind('resize', {dialogObject: this}, this._normalResizeHandler);

  //should avoid drag outide the window
  this.uiDialog.draggable('option', 'containment', 'window');
  
  //should avoid focus in iframe during moves operation
  this.uiDialog.draggable('option', 'iframeFix', true);

  //should avoid scroll move, seems not be the case after maximize/restore
  //operation
  this.uiDialog.draggable('option', 'scroll', false);

  //get the focus to dialog to allow esc to close
  this.uiDialog.hover(function() {
    this.focus();
  });
};

//************************************
//Custom Dialog Functions
//************************************
$.extend($.ui.dialog.prototype, {

  //-------------------------------------------------------------------------
  _savePositionAndSize: function () {
    this.options.originalWidth = this.uiDialog.width();
    this.options.originalHeight = this.uiDialog.height();
    this.options.originalLeft = this.uiDialog.css('left');
    this.options.originalTop = this.uiDialog.css('top');
    //this.options.position = [this.uiDialog.position().left - $(document).scrollLeft(), this.uiDialog.position().top - $(document).scrollTop()];
  },

  //-------------------------------------------------------------------------
  _restorePositionAndSize: function () {
    this.uiDialog.css({
      left: this.options.originalLeft,
      top: this.options.originalTop,
      width: this.options.originalWidth,
      height: this.options.originalHeight
    });
    this.element.css({width: '100%', height: this._contentHeight()});
  },

  //-------------------------------------------------------------------------
  _contentHeight: function () {
    return this.uiDialog.innerHeight() - this.titlebarHeight;
  },

  //-------------------------------------------------------------------------
  _adjustSizeAndPosition: function () {

    var dialogHeight = this.uiDialog.outerHeight();
    var dialogWidth = this.uiDialog.width();

    var windowHeight = $(window).height();
    var windowWidth = $(window).width();

    //check and corrects the top value
    var topPos = this.uiDialog.position().top - $(window).scrollTop(); 
    //sanity check
    if (topPos < 0) {
      topPos = 0;
    }
    if ((topPos + dialogHeight) > windowHeight) {
      topPos = windowHeight - dialogHeight;
      if (topPos < 0) {
        topPos = 0;
      }
    }

    //check and corrects the left value
    var leftPos = this.uiDialog.position().left - $(window).scrollLeft(); 
    //sanity check
    if (leftPos < 0) {
      leftPos = 0;
    }
    if ((leftPos + dialogWidth) > windowWidth) {
      leftPos = windowWidth - dialogWidth;
    }

    //check and corrects the left value
    var height = dialogHeight = this.uiDialog.height();
    if (dialogHeight > windowHeight) {
      height = windowHeight - (this.uiDialog.innerHeight() - dialogHeight);
    }

    //check and corrects the right value
    var width = dialogWidth = this.uiDialog.width();
    if (dialogWidth > windowWidth) {
      width = windowWidth;
    }

    this.uiDialog.css({top: topPos, left: leftPos, width: width, height: height});

    this.element.css({width: '100%', height: this._contentHeight()});

    //this._savePositionAndSize();
    this.setCookie();
  },

  //-------------------------------------------------------------------------
  _normalResizeHandler: function (event) {
    event.data.dialogObject._adjustSizeAndPosition();
  },

  //-------------------------------------------------------------------------
  _maximizedResizeHandler: function (event) {
    var self = event.data.dialogObject;
    var newHeight = $(window).height() - 2 - (self.uiDialog.innerHeight() - self.uiDialog.height());
    var newWidth = $(window).width() - 2;
    event.data.dialogObject.uiDialog.css({top: 1, left: 1, width: newWidth, height: newHeight});
    self.element.css({height: self._contentHeight()});
  },

  //-------------------------------------------------------------------------
  toggleMaximize: function () {
    if (this.options.currentState === 'maximized') {
      this.restore();
      return false;
    } else {
      this.maximize();
      return false;
    }
  },
  
  //-------------------------------------------------------------------------
  setCookie: function () {
    if(this.options.currentState === 'maximized') {
      $.cookie({
        mvoCurrentState: this.options.currentState, 
        mvoVersion: '1.0'
      }, { path: '/' });
    } else {
      $.cookie({
        mvoCurrentState: this.options.currentState, 
        mvoTop: this.uiDialog.css('top'), 
        mvoLeft: this.uiDialog.css('left'), 
        mvoWidth: this.uiDialog.css('width'), 
        mvoHeight: this.uiDialog.css('height'),
        mvoVersion: '1.0'
      }, { path: '/', expires: 365 });
    }
  },
  
  //-------------------------------------------------------------------------
  getCookie: function () {
    if($.cookie('mvoVersion') === '1.0') {
      this.uiDialog.css({
        top: $.cookie('mvoTop'),
        left: $.cookie('mvoLeft'),
        width: $.cookie('mvoWidth'),
        height: $.cookie('mvoHeight')
      });
      this.options.currentState = $.cookie('mvoCurrentState');
      this._savePositionAndSize();
      return true;
    }
    return false;
  },

  //-------------------------------------------------------------------------
  restore: function () {
    
    //dialog can be resized and moved
    this._makeResizable();
    this._makeDraggable();

    //should avoid drag outide the window
    this.uiDialog.draggable('option', 'containment', 'window');
    
    //should avoid focus in iframe during moves operation
    this.uiDialog.draggable('option', 'iframeFix', true);

    //should avoid scroll move, seems not be the case after maximize/restore
    //operation
    this.uiDialog.draggable('option', 'scroll', false);

    //swap resize method
    $(window).unbind('resize', this._maximizedResizeHandler);
    $(window).bind('resize', {dialogObject: this}, this._normalResizeHandler);

    //restore size and position
    this._restorePositionAndSize();

    //resize area is now visible
    this.resizeableHandle.show();

    //swap buttons
    this.uiDialogTitlebarRest.hide();
    this.uiDialogTitlebarMaximize.show();
    
    //set current state
    this.options.currentState = 'normal';

    //check that the dialog is in the window
    this._adjustSizeAndPosition();
  },


  //-------------------------------------------------------------------------
  //the dialog will take all the window area
  maximize: function () { 

    //disable resize and dialog moves
    this.uiDialog.resizable('destroy');
    this.uiDialog.draggable('destroy');
    
    //save the actual position and size for later restore
    this._savePositionAndSize();

    //compte new size and positions
    var newHeight = $(window).height() - 2 - (this.uiDialog.innerHeight() - this.uiDialog.height());
    var newWidth = $(window).width() - 2;
    this.uiDialog.css({top: 1, left: 1, width: newWidth, height: newHeight});

    //this.element.show();
    this.element.css({width: '100%', height: this._contentHeight()});

    //remove maxmized button
    this.uiDialogTitlebarMaximize.hide();
    
    //add restore button
    this.uiDialogTitlebarRest.show();
    
    //remove resize button (bottom right)
    this.resizeableHandle.hide();

    //change dialog window resize function
    $(window).unbind('resize', this._normalResizeHandler);
    $(window).bind('resize', {dialogObject: this}, this._maximizedResizeHandler);
    
    //set current state
    this.options.currentState = 'maximized';
    this.setCookie();
  }

});

/*****************************************************************************/
/* jQuery script for Multivio
/*****************************************************************************/
(function ($) {

  /***************************************************************************/
  /* Multivio itself                                                         */
  /***************************************************************************/

  //-------------------------------------------------------------------------
  //check for touch device
  function isiPhone(){
    return navigator.userAgent.toLowerCase().match(/(iPhone|iPad|Android)/i);
  }

  //-------------------------------------------------------------------------
  //check if multivio is supported (ie6< == not supported)
  function multivioSupported() {
    if ($.browser.msie && parseInt($.browser.version, 10) < 7) {
      return false;
    }
    return true;
  }

  $.fn.extend({ 
    enableMultivio: function (options) { 
      // You must return jQuery object 
      if (!options) {
        return $(this);
      }

      //----------------------------------------------------
      //options
      //class name for theming
      options.className = options.className || 'mvo-custom';
      
      //method: newwindow, overlay, download
      options.method = options.method || 'newwindow';

      //thumbnail dimension
      options.previewWidth = options.previewWidth || 60;
      options.previewHeight = options.previewHeight || 60;
      
      //overlay dimension
      options.overlayWidth = options.overlayWidth || 800;
      options.overlayHeight = options.overlayHeight || 600;

      //enable multivio only for certain document described by a regular
      //expression
      options.supportedDocuments = options.supportedDocuments 
        || /.*?(\.pdf|\.jpeg|\.jpg|\.gif|\.png|\.tif|\.tiff|xm|xml)$/;

      //thumbnail alignment can depend of the view, for RERO DOC for example
      //brief is top and detailed is bottom
      options.thumbnailAlign = options.thumbnailAlign || 'bottom';
      
      //display download button if available
      if (options.downloadButton === undefined) {
        options.downloadButton = true;
      } 


      
      //display quickview button if multivio supported
      options.quickViewButton = options.quickViewButton || true;
      if (options.quickViewButton === undefined) {
        options.quickViewButton = true;
      }
      options.previewAttr = options.previewAttr || 'data-multivio-preview'
			
      //client/server urls
      options.multivioServerInstance = options.multivioServerInstance || 'http://demo.multivio.org/server';
      options.multivioClientInstance = options.multivioClientInstance || 'http://demo.multivio.org/client';

      //multivio language: only french and english for the moment
      options.language = options.language || 'en';
      if (options.language !== 'fr') {
        options.language = 'en';
      }
      
      //text in different languages
      var downloadTranslate = [];
      downloadTranslate['en'] = 'Download';
      downloadTranslate['fr'] = 'Telecharger';

      var quickViewTranslate = [];
      quickViewTranslate['fr'] = 'Voir avec Multivio';
      quickViewTranslate['en'] = 'Multivio Quick view';
      quickViewTranslate['it'] = 'Anteprima con Multivio';
      quickViewTranslate['de'] = 'Vorschau mit Multivio';

      //set download method for unsupported browsers
      if (!multivioSupported()) {
        options.method = 'download';
      }

      //open Multivio in a separate window for touch device
      if (isiPhone()) {
        options.method = 'newwindow';
      }

      //multivio urls
      var multivioServer = options.multivioServerInstance;
      var multivioClient = options.multivioClientInstance;

      //----------------------------------------------------
      //for each full text
      this.each(function (index) {
        var self = $(this);
        var method = options.method;

        //url for the full text
        var url = self.attr('href');

        //download for unsupported document
        lower_url = url.toLowerCase();
        if (lower_url.match(options.supportedDocuments) === null) {
          method = 'download';
        }

        //url to call multivio
        var clientMultivioUrl = multivioClient + "/" + options.language 
          + "/" +"/#get&theme=gray&url=" + url;

        self.addClass('mvo-caption');

        //overload the href by our own options
        var multivioOptions = self.attr('data-multivio-options');
        if (multivioOptions) {
          clientMultivioUrl = multivioClient + "/" + options.language + "/#get&theme=gray&" + multivioOptions;
        }

        //preview
        var multivioPreview = self.attr(options.previewAttr);
        if(multivioPreview && multivioPreview.match(/^http/)) {
          multivioPreview = 'url=' + multivioPreview;
        }

        //elements to click to run Multivio
        var toClick = self;

        //thumbnails
        if (multivioPreview) {

          //create a container using a span
          var container = $('<span>')
          .addClass('mvo-container')
          .addClass(options.className);
          var test = self.wrap(container);
          container = self.parents('.mvo-container');

          //url to generate the preview
          var multivioThumbUrl = multivioServer + '/document/render?max_width='
            + options.previewWidth + '&max_height=' + options.previewHeight 
            + "&" + multivioPreview;

          //thumbnail element
          var thumbHeight = options.previewHeight+'px';
          var thumbWidth = options.previewWidth+'px';
          if (options.thumbnailAlign === 'auto') {
            thumbHeight = 'auto';
            thumbWidth = 'auto';
          }
          var previewThumb = $('<div>')
          .css({
            height: thumbHeight,
            lineHeight: thumbHeight,
            width: thumbWidth
          })
          .addClass("mvo-thumb");

          //display buttons under the thumbnails
          var buttonGroup = $('<div>')
          .addClass('mvo-buttons');

          //button to download
          var downloadTitle = downloadTranslate[options.language];
          if(self.attr('title')) {
            downloadTitle = downloadTitle + ": " + self.attr('title');
          }
          var downloadButton = $('<button>')
          .text('Download')
          .addClass('mvo-icon-download')
          .attr('title', downloadTitle)
          .button({
            icons: {
              primary: "ui-icon-arrowthickstop-1-s"
            },
            text: false
          });

          if(options.downloadButton) {
            downloadButton.appendTo(buttonGroup)
          }

          //button to open Multivio
          var quickLook = $('<button>')
          .addClass('mvo-quick')
          .text('View')
          .attr('title', quickViewTranslate[options.language])
          .button({
            icons: {
              primary: "ui-icon-newwin"
            },
            text: false
          });

          //add quickLook button if neeeded
          if (multivioThumbUrl.match(options.supportedDocuments) !== null 
              && multivioSupported() && options.quickViewButton) {
            quickLook.appendTo(buttonGroup)
          }

          //add thumbnail if doc is supported
          if (multivioThumbUrl.match(options.supportedDocuments) !== null) {
            previewImage = $('<img>')
            .attr('src', multivioThumbUrl)
            .attr('title', quickViewTranslate[options.language])
            .load(function () {
              //ie does not support vertical-align: bottom!!
              //adjust position as it is difficult to do that using css for all
              //kind of browsers
              if (options.thumbnailAlign === 'bottom') {
                var _marginTop = $(this).parent().height() - $(this).height();
                $(this).css({marginTop: _marginTop + "px"});
              }
            })
            .appendTo(previewThumb);

            //element to click is also the thumbnail
            toClick = quickLook.add(previewImage);

          } else {

            //generic image for unsupported document
            previewThumb.addClass('mvo-unsupported')
            .removeClass('mvo-thumb');

            //add label as extension of the preview url
            var len = multivioThumbUrl.length;
            var extString = multivioThumbUrl.substring(len - 5, len);
            if (extString.match(/.*?\.\w+$/) !== null) {
              extString = extString.split('.').pop();
            } else {
              //no extension, "URL" instead
              extString = 'url';
            }

            var ext = $('<span>')
            .text(extString)
            .addClass('mvo-ext')
            .appendTo(previewThumb);
          }
          
          //add buttons if needed
          if(options.downloadButton | options.quickViewButton) {
            buttonGroup.appendTo(container);
          }
          buttonGroup.buttonset().hide();
          previewThumb.insertBefore(self);

          //open doc in same or new tab/window depending on the options
          downloadButton.click(function(event) {
            if(options.method === 'newwindow') {
              window.open(url);
            } else {
              window.location = url;
            }
          });

          //adjust container size to the size of the label (can be multi-line)
          if(container.height() > 0 && container.width() > 0) {
            container.css({height:Math.floor(container.height()) + 1, width: Math.floor(container.width()) + 1});
          }

          var caption = self;
          
          //display/hide buttons when the mouse is enter or go out
          container.hover(
            function () {
              buttonGroup.show();
              buttonGroup.css({opacity:0.1});
              buttonGroup.show().animate({opacity: 1});
              caption.hide();
            },
            function() {
              buttonGroup.hide();
              caption.css({opacity:0.1});
              caption.show().animate({opacity: 1});
            }
          );
        }//end thumbnails 

        //action when the thumnail, quickView button are clicked
        toClick.click(function (event) {

          if (method === 'overlay') {
            
            //display dialog
            event.preventDefault();
            var iFrame = $('iframe.mvo-overlay')
            .attr('src', clientMultivioUrl)
            .dialog('open');

            //remove all previously selected thumb
            $('.mvo-container').find('.mvo-thumb').removeClass('mvo-selection');
            
            //select current thumb
            self.parents('.mvo-container').find('.mvo-thumb').addClass('mvo-selection');

          } else {

            var urlToOpen = clientMultivioUrl;
            
            //download the doc
            if (method === 'download') {
              urlToOpen = url;
            }

            if(options.method === 'newwindow') {
              //open in separate window
              window.open(urlToOpen);
            } else {
              //open in the same window
              window.location = urlToOpen;
            }
          }
        });
      });

      //add DOM element for the overlay dialog
      if (options.method === 'overlay') {
        
        //already exists in DOM?
        if($('iframe.mvo-overlay').length === 0) {
          var iFrame = $('<iframe>')
          .attr('frameborder', '0')
          .addClass('mvo-overlay')
          .appendTo($('body'));
          
          //enable custom dialog
          iFrame.dialog({
            canMaximize: true,
            overlayWidth: options.overlayWidth,
            overlayHeight: options.overlayHeight,
            width: options.overlayWidth,
            height: options.overlayHeight,
            //effects
            show: 'fade',
            hide: 'fade',
            //not opened when the doc is loaded!
            autoOpen: false
          });
        }
      }
      this.options = options;
      return self; 
    } 
  }); 

}(jQuery));
