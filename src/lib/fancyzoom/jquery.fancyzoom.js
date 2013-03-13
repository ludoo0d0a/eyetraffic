/*
 * https://code.google.com/p/fancyzoomng/
 */
jQuery.fancyHide = function(){ $('.zoom_close').click(); };
jQuery.fancyResize = function(width, height) { 
  var w = {'w': $(window).width(), 'h': $(window).height()};
  var newTop = parseInt(Math.max((w.h / 2) - (height / 2), 0));
  var newLeft = parseInt((w.w / 2) - ((width) / 2));
    
  $('.zoom:visible').animate({width: width, height: height, top: newTop, left: newLeft}); 
};
jQuery.fn.fancyZoom = function(options){
  var options     = options || {};
  var directory   = options.directory || 'images';
  var main_class  = options.main_class || '';
  var zooming     = false;
  var ext = $.browser.msie ? 'gif' : 'png';

  var box = directory + '/box.' + ext;
  var side = directory + '/sides.' + ext;
  var zoom = $('<div class="zoom ' + main_class + '" style="display: none; z-index: 10">'+
               '<table class="zoom_table" style="border-collapse:collapse; width:100%; height:100%;">'+
                 '<tbody>'+
                   '<tr>'+
                     '<td style="background:url(' + box + ') 0 0 no-repeat; width:26px; height:26px; overflow:hidden;"></td>'+
                     '<td style="background:url(' + box + ') 0 -52px repeat-x; height:26px; overflow:hidden;"></td>'+
                     '<td style="background:url(' + box + ') 0 -110px no-repeat; width:26px; height:26px; overflow:hidden;"></td>'+
                   '</tr>'+
                   '<tr>'+
                     '<td style="background:url(' + side + ') 0 0 repeat-y; width:26px; overflow:hidden;"></td>'+
                     '<td style="background:#fff; vertical-align:top; padding:10px;" class="mainfz">'+
                       '<div class="zoom_content"></div>'+
                     '</td>'+
                     '<td style="background:url(' + side + ') -28px 0 repeat-y;  width:26px; overflow:hidden;"></td>'+
                   '</tr>'+
                   '<tr>'+
                     '<td style="background:url(' + box + ') 0 -26px no-repeat; width:26px; height:26px; overflow:hidden;"></td>'+
                     '<td style="background:url(' + box + ') 0 -78px repeat-x; height:26px; overflow:hidden;"></td>'+
                     '<td style="background:url(' + box + ') 0 -136px no-repeat; width:26px; height:20px; overflow:hidden;"></td>'+
                   '</tr>'+
                 '</tbody>'+
               '</table>'+
               '<a href="#" title="Close" class="zoom_close" style="position:absolute; top:0px; left:0px;">'+
                 '<img src="' + directory + '/closebox.png" alt="Close" style="border:none; margin:0; padding:0;"></td>'+
               '</a>'+
             '</div>');

  $('body').append(zoom);
  $('html').click(function(e){
    if (!$(e.target).hasClass('zoomed') && $('.zoom:visible').length && !$(e.target).parents('.zoom').length) hide();
  });

  $().keyup(function(event){
    if (event.keyCode == 27 && $('.zoom:visible').length > 0) hide();
  });

  $('.zoom_close').click(hide);
  var zoom_table    = $('.zoom_table');
  var zoom_close    = $('.zoom_close');
  var zoom_content  = $('.zoom_content');
  var middle_row    = $('td.ml,td.mm,td.mr');

  var switchBackgroundImagesTo = function(to) {
    $('.zoom_table td').each(function(i) {
      var bg = $(this).css('background-image').replace(/\.(png|gif|none)\"\)$/, '.' + to + '")');
      $(this).css('background-image', bg);
    });
    var close_img = zoom_close.children('img');
    var new_img = close_img.attr('src').replace(/\.(png|gif|none)$/, '.' + to);
    close_img.attr('src', new_img);
  };

  var fixBackgroundsForIE = function() {
    if ($.browser.msie && parseFloat($.browser.version) >= 7) {
      switchBackgroundImagesTo('gif');
    }
  };

  var unfixBackgroundsForIE = function() {
    if ($.browser.msie && $.browser.version >= 7) {
      switchBackgroundImagesTo('png');
    }
  };

  function show(e, content_div) {
    if (zooming || $('.zoom:visible').length) return false;
    zooming         = true;
    var dimmer      = $('<div class="dimmer" style="position:absolute;top:0px"/>').height(Math.max($('body').height(), $(document).height()));
    var doc         = window.document;
    var x           = window.pageXOffset || (doc.documentElement.scrollLeft || doc.body.scrollLeft);
    var y           = window.pageYOffset || (doc.documentElement.scrollTop || doc.body.scrollTop);
    var d           = {'width':$(window).width(), 'height':$(window).height(), 'x':x, 'y':y};
    var width       = parseInt(options.width || content_div.width()) + 60;
    var height      = parseInt(options.height || content_div.height()) + 60;

    zoom_content.height(height - 120);

    // ensure that newTop is at least 0 so it doesn't hide close button
    var newTop             = Math.max((d.height/2) - (height/2) + y, 0);
    var newLeft            = (d.width/2) - (width/2);
    var curTop             = e.pageY;
    var curLeft            = e.pageX;

    zoom_close.attr('curTop', curTop);
    zoom_close.attr('curLeft', curLeft);
    zoom_close.attr('scaleImg', Boolean(options.scaleImg));

    $(zoom).hide().css({
      position  : 'absolute',
      top       : curTop + 'px',
      left      : curLeft + 'px',
      width     : '1px',
      height    : '1px'
    });

    //fixBackgroundsForIE();
    zoom_close.hide();

    if (options.closeOnClick) {
      $(zoom).click(hide);
    }

    if (options.scaleImg) {
      zoom_content.html(content_div.html());
      $('.zoom_content img').css('width', '100%');
    } else {
      zoom_content.empty();
    }
    $('body').append(dimmer);
    $(zoom).animate({
      top     : newTop + 'px',
      left    : newLeft + 'px',
      opacity : "show",
      width   : width,
      height  : height
    }, 500, null, function() {
      if (!options.scaleImg) {
        if (options.url) {
          if (!$(".zoom_indicator").length)
            zoom_content.append($('<div class="zoom_indicator"/>'));
          $.ajax({
            url: options.url,
            success: function(msg){
              zoom_content.html(msg);
            }
          });
        } else {
          zoom_content.append(content_div.remove());
        }
      }
      //unfixBackgroundsForIE();
      zoom_close.show();
      if (options.onShow) options.onShow();
      zooming = false;
    });
    return false;
  }

  function hide() {
    if (zooming) return false;
    zooming         = true;

    $('.dimmer').remove();
    $(zoom).unbind('click');
    //fixBackgroundsForIE();
    if (zoom_close.attr('scaleImg') != 'true') {
      zoom_content.empty();
    }
    zoom_close.hide();
    $(zoom).animate({
      top     : zoom_close.attr('curTop') + 'px',
      left    : zoom_close.attr('curLeft') + 'px',
      opacity : "hide",
      width   : '1px',
      height  : '1px'
    }, 500, null, function() {
      if (zoom_close.attr('scaleImg') == 'true') {
        zoom_content.empty();
      }
      //unfixBackgroundsForIE();
      zooming = false;
    });
    return false;
  }

  this.each(function(i, obj) {
    var content_div = $(options.modal || $(obj).attr('href')).hide();
    $(obj).addClass('zoomed');
    $(obj).click(function(e){ return show(e, content_div); });
  });

  return this;
}