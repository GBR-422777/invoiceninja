/* =============================================================
 * bootstrap-combobox.js v1.1.5
 * =============================================================
 * Copyright 2012 Daniel Farrell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

!function( $ ) {

 "use strict";

 /* COMBOBOX PUBLIC CLASS DEFINITION
  * ================================ */

  var Combobox = function ( element, options ) {
    this.options = $.extend({}, $.fn.combobox.defaults, options);
    this.$source = $(element);
    this.$container = this.setup();
    this.$element = this.$container.find('input[type=text]');
    this.$target = this.$container.find('input[type=hidden]');
    this.$button = this.$container.find('.dropdown-toggle');
    this.$menu = $(this.options.menu).appendTo('body');
    this.matcher = this.options.matcher || this.matcher;
    this.sorter = this.options.sorter || this.sorter;
    this.highlighter = this.options.highlighter || this.highlighter;
    this.shown = false;
    this.selected = false;
    this.refresh();
    this.transferAttributes();
    this.listen();
  };

  Combobox.prototype = {

    constructor: Combobox

  , setup: function () {
      var combobox = $(this.options.template);
      this.$source.before(combobox);
      this.$source.hide();
      return combobox;
    }

  , parse: function () {
      var that = this
        , map = {}
        , source = []
        , selected = false
        , selectedValue = '';
      this.$source.find('option').each(function() {
        var option = $(this);
        if (option.val() === '') {
          that.options.placeholder = option.text();
          return;
        }
        map[option.text()] = option.val();
        source.push(option.text());
        if (option.prop('selected')) {
          selected = option.text();
          selectedValue = option.val();
        }
      })
      this.map = map;
      if (selected) {
        this.$element.val(selected);
        this.$target.val(selectedValue);
        this.$container.addClass('combobox-selected');
        this.selected = true;
      }
      return source;
    }

  , transferAttributes: function() {
    this.options.placeholder = this.$source.attr('data-placeholder') || this.options.placeholder;
    this.$element.attr('placeholder', this.options.placeholder);
    this.$target.prop('name', this.$source.prop('name'));
    this.$target.val(this.$source.val());
    this.$source.removeAttr('name');  // Remove from source otherwise form will pass parameter twice.
    this.$element.attr('required', this.$source.attr('required'));
    this.$element.attr('rel', this.$source.attr('rel'));
    this.$element.attr('title', this.$source.attr('title'));
    this.$element.attr('class', this.$source.attr('class'));
    this.$element.attr('tabindex', this.$source.attr('tabindex'));
    this.$source.removeAttr('tabindex');
    this.$source.removeAttr('required');
  }

  , setSelected: function() {
    this.selected = true;
  }

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value');
      this.$element.val(this.updater(val));
      this.$target.val(this.map[val]);
      this.$source.val(this.map[val]);
      this.$element.trigger('change');
      this.$target.trigger('change');
      this.$source.trigger('change');
      this.$container.addClass('combobox-selected');
      this.selected = true;
      return this.hide();
    }

  , updater: function (item) {
      return item;
    }

  , show: function () {
      var pos = $.extend({}, this.$element.position(), {
        height: this.$element[0].offsetHeight
      });

      this.$menu
        .insertAfter(this.$element)
        .css({
          top: pos.top + pos.height
        , left: pos.left
        })
        .show();

      this.shown = true;
      return this;
    }

  , hide: function () {
      this.$menu.hide();
      this.shown = false;
      return this;
    }

  , lookup: function (event) {
      this.query = this.$element.val();
      return this.process(this.source);
    }

  , process: function (items) {
      var that = this;

      items = $.grep(items, function (item) {
        return that.matcher(item);
      })

      items = this.sorter(items);

      if (!items.length) {
        return this.shown ? this.hide() : this;
      }

      return this.render(items.slice(0, this.options.items)).show();
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase());
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item;

      while (item = items.shift()) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) {beginswith.push(item);}
        else if (~item.indexOf(this.query)) {caseSensitive.push(item);}
        else {caseInsensitive.push(item);}
      }

      return beginswith.concat(caseSensitive, caseInsensitive);
    }

  , highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>';
      })
    }

  , render: function (items) {
      var that = this;

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item);
        i.find('a').html(that.highlighter(item));
        return i[0];
      })

      items.first().addClass('active');
      this.$menu.html(items);
      return this;
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next();

      if (!next.length) {
        next = $(this.$menu.find('li')[0]);
      }

      next.addClass('active');
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev();

      if (!prev.length) {
        prev = this.$menu.find('li').last();
      }

      prev.addClass('active');
    }

  , toggle: function () {
    if (this.$container.hasClass('combobox-selected')) {
      this.clearTarget();
      this.triggerChange();
      this.clearElement();
    } else {
      if (this.shown) {
        this.hide();
      } else {
        this.clearElement();
        this.lookup();
      }
    }

    this.$element.trigger('change');
    this.$target.trigger('change');
    this.$source.trigger('change');    
  }

  , clearElement: function () {
    this.$element.val('').focus();
  }

  , clearTarget: function () {
    this.$source.val('');
    this.$target.val('');
    this.$container.removeClass('combobox-selected');
    this.selected = false;
  }

  , triggerChange: function () {
    this.$source.trigger('change');
  }

  , refresh: function () {
    this.source = this.parse();
    this.options.items = this.source.length;
  }

  , listen: function () {
      this.$element
        .on('focus',    $.proxy(this.focus, this))
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this));

      if (this.eventSupported('keydown')) {
        this.$element.on('keydown', $.proxy(this.keydown, this));
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
        .on('mouseleave', 'li', $.proxy(this.mouseleave, this));

      this.$button
        .on('click', $.proxy(this.toggle, this));
    }

  , eventSupported: function(eventName) {
      var isSupported = eventName in this.$element;
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;');
        isSupported = typeof this.$element[eventName] === 'function';
      }
      return isSupported;
    }

  , move: function (e) {
      if (!this.shown) {return;}

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault();
          break;

        case 38: // up arrow
          e.preventDefault();
          this.prev();
          break;

        case 40: // down arrow
          e.preventDefault();
          this.next();
          break;
      }

      e.stopPropagation();
    }

  , keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27]);
      this.move(e);
    }

  , keypress: function (e) {
      if (this.suppressKeyPressRepeat) {return;}
      this.move(e);
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 39: // right arrow
        case 38: // up arrow
        case 37: // left arrow
        case 36: // home
        case 35: // end
        case 33: // page up
        case 34: // page down
        case 16: // shift
        case 17: // ctrl
        case 18: // alt
        case 20: // cap lock
          break;

        case 9: // tab
        case 13: // enter
          if (!this.shown) {return;}
          this.select();
          break;

        case 27: // escape
          if (!this.shown) {return;}
          this.hide();
          break;

        default:
          this.clearTarget();
          this.lookup();
      }

      e.stopPropagation();
      e.preventDefault();
  }

  , focus: function (e) {
      this.focused = true;
    }

  , blur: function (e) {
      var that = this;
      this.focused = false;
      var val = this.$element.val();
      if (!this.selected && val !== '' ) {
        this.$element.val('');
        this.$source.val('').trigger('change');
        this.$target.val('').trigger('change');
      }
      if (!this.mousedover && this.shown) {setTimeout(function () { that.hide(); }, 200);}
    }

  , click: function (e) {
      e.stopPropagation();
      e.preventDefault();
      this.select();
      this.$element.focus();
    }

  , mouseenter: function (e) {
      this.mousedover = true;
      this.$menu.find('.active').removeClass('active');
      $(e.currentTarget).addClass('active');
    }

  , mouseleave: function (e) {
      this.mousedover = false;
    }
  };

  /* COMBOBOX PLUGIN DEFINITION
   * =========================== */

  $.fn.combobox = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('combobox')
        , options = typeof option == 'object' && option;
      if(!data) {$this.data('combobox', (data = new Combobox(this, options)));}
      if (typeof option == 'string') {data[option]();}
    });
  };

  $.fn.combobox.defaults = {
  template: '<div class="combobox-container"> <input type="hidden" /> <div class="input-group"> <input type="text" autocomplete="off" /> <span class="input-group-addon dropdown-toggle" data-dropdown="dropdown"> <span class="caret" /> <i class="fa fa-times"></i> </span> </div> </div> '
  , menu: '<ul class="typeahead typeahead-long dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  };

  $.fn.combobox.Constructor = Combobox;

}( window.jQuery );

// http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
var isEdge = navigator.userAgent.indexOf('Edge/') >= 0;
var isChrome = !!window.chrome && !isOpera && !isEdge; // Chrome 1+
var isChromium = isChrome && navigator.userAgent.indexOf('Chromium') >= 0;
// https://code.google.com/p/chromium/issues/detail?id=574648
var isChrome48 = isChrome && navigator.userAgent.indexOf('Chrome/48') >= 0;
var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
var isAndroid = /Android/i.test(navigator.userAgent);
var isIPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);

var refreshTimer;
function generatePDF(invoice, javascript, force, cb) {
  if (!invoice || !javascript) {
    return;
  }
  //console.log('== generatePDF - force: %s', force);
  if (force) {
    refreshTimer = null;
  } else {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(function() {
        generatePDF(invoice, javascript, true, cb);
      }, 500);
      return;
  }

  invoice = calculateAmounts(invoice);

  if (parseInt(invoice.account.signature_on_pdf)) {
      invoice = convertSignature(invoice);
  }

  // convertSignature returns false to wait for the canvas to draw
  if (! invoice) {
      return false;
  }

  var pdfDoc = GetPdfMake(invoice, javascript, cb);

  if (cb) {
     pdfDoc.getDataUrl(cb);
  }

  return pdfDoc;
}

function copyObject(orig) {
  if (!orig) return false;
  return JSON.parse(JSON.stringify(orig));
}

/* Handle converting variables in the invoices (ie, MONTH+1) */
function processVariables(str) {
  if (!str) return '';
  var variables = ['MONTH','QUARTER','YEAR'];
  for (var i=0; i<variables.length; i++) {
    var variable = variables[i];
        var regexp = new RegExp(':' + variable + '[+-]?[\\d]*', 'g');
        var matches = str.match(regexp);
        if (!matches) {
             continue;
        }
        for (var j=0; j<matches.length; j++) {
            var match = matches[j];
            var offset = 0;
            if (match.split('+').length > 1) {
                offset = match.split('+')[1];
            } else if (match.split('-').length > 1) {
                offset = parseInt(match.split('-')[1]) * -1;
            }
            str = str.replace(match, getDatePart(variable, offset));
        }
  }

  return str;
}

function getDatePart(part, offset) {
    offset = parseInt(offset);
    if (!offset) {
        offset = 0;
    }
  if (part == 'MONTH') {
    return getMonth(offset);
  } else if (part == 'QUARTER') {
    return getQuarter(offset);
  } else if (part == 'YEAR') {
    return getYear(offset);
  }
}

function getMonth(offset) {
  var today = new Date();
  var months = [ "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December" ];
  var month = today.getMonth();
    month = parseInt(month) + offset;
    month = month % 12;
    if (month < 0) {
      month += 12;
    }
    return months[month];
}

function getYear(offset) {
  var today = new Date();
  var year = today.getFullYear();
  return parseInt(year) + offset;
}

function getQuarter(offset) {
  var today = new Date();
  var quarter = Math.floor((today.getMonth() + 3) / 3);
  quarter += offset;
    quarter = quarter % 4;
    if (quarter == 0) {
         quarter = 4;
    }
    return 'Q' + quarter;
}

// https://gist.github.com/beiyuu/2029907
$.fn.selectRange = function(start, end) {
    var e = document.getElementById($(this).attr('id')); // I don't know why... but $(this) don't want to work today :-/
    if (!e) return;
    else if (e.setSelectionRange) { e.focus(); e.setSelectionRange(start, end); } /* WebKit */
    else if (e.createTextRange) { var range = e.createTextRange(); range.collapse(true); range.moveEnd('character', end); range.moveStart('character', start); range.select(); } /* IE */
    else if (e.selectionStart) { e.selectionStart = start; e.selectionEnd = end; }
};

/* Default class modification */
if ($.fn.dataTableExt) {
  $.extend( $.fn.dataTableExt.oStdClasses, {
    "sWrapper": "dataTables_wrapper form-inline"
  } );


  /* API method to get paging information */
  $.fn.dataTableExt.oApi.fnPagingInfo = function ( oSettings )
  {
    return {
      "iStart":         oSettings._iDisplayStart,
      "iEnd":           oSettings.fnDisplayEnd(),
      "iLength":        oSettings._iDisplayLength,
      "iTotal":         oSettings.fnRecordsTotal(),
      "iFilteredTotal": oSettings.fnRecordsDisplay(),
      "iPage":          oSettings._iDisplayLength === -1 ?
        0 : Math.ceil( oSettings._iDisplayStart / oSettings._iDisplayLength ),
      "iTotalPages":    oSettings._iDisplayLength === -1 ?
        0 : Math.ceil( oSettings.fnRecordsDisplay() / oSettings._iDisplayLength )
    };
  };


  /* Bootstrap style pagination control */
  $.extend( $.fn.dataTableExt.oPagination, {
    "bootstrap": {
      "fnInit": function( oSettings, nPaging, fnDraw ) {
        var oLang = oSettings.oLanguage.oPaginate;
        var fnClickHandler = function ( e ) {
          e.preventDefault();
          if ( oSettings.oApi._fnPageChange(oSettings, e.data.action) ) {
            fnDraw( oSettings );
          }
        };

        $(nPaging).addClass('pagination').append(
          '<ul class="pagination">'+
            '<li class="prev disabled"><a href="#">&laquo;</a></li>'+
            '<li class="next disabled"><a href="#">&raquo;</a></li>'+
          '</ul>'
        );
        var els = $('a', nPaging);
        $(els[0]).bind( 'click.DT', { action: "previous" }, fnClickHandler );
        $(els[1]).bind( 'click.DT', { action: "next" }, fnClickHandler );
      },

      "fnUpdate": function ( oSettings, fnDraw ) {
        var iListLength = 5;
        var oPaging = oSettings.oInstance.fnPagingInfo();
        var an = oSettings.aanFeatures.p;
        var i, ien, j, sClass, iStart, iEnd, iHalf=Math.floor(iListLength/2);

        if ( oPaging.iTotalPages < iListLength) {
          iStart = 1;
          iEnd = oPaging.iTotalPages;
        }
        else if ( oPaging.iPage <= iHalf ) {
          iStart = 1;
          iEnd = iListLength;
        } else if ( oPaging.iPage >= (oPaging.iTotalPages-iHalf) ) {
          iStart = oPaging.iTotalPages - iListLength + 1;
          iEnd = oPaging.iTotalPages;
        } else {
          iStart = oPaging.iPage - iHalf + 1;
          iEnd = iStart + iListLength - 1;
        }

        for ( i=0, ien=an.length ; i<ien ; i++ ) {
          // Remove the middle elements
          $('li:gt(0)', an[i]).filter(':not(:last)').remove();

          // Add the new list items and their event handlers
          for ( j=iStart ; j<=iEnd ; j++ ) {
            sClass = (j==oPaging.iPage+1) ? 'class="active"' : '';
            $('<li '+sClass+'><a href="#">'+j+'</a></li>')
              .insertBefore( $('li:last', an[i])[0] )
              .bind('click', function (e) {
                e.preventDefault();
                oSettings._iDisplayStart = (parseInt($('a', this).text(),10)-1) * oPaging.iLength;
                fnDraw( oSettings );
              } );
          }

          // Add / remove disabled classes from the static elements
          if ( oPaging.iPage === 0 ) {
            $('li:first', an[i]).addClass('disabled');
          } else {
            $('li:first', an[i]).removeClass('disabled');
          }

          if ( oPaging.iPage === oPaging.iTotalPages-1 || oPaging.iTotalPages === 0 ) {
            $('li:last', an[i]).addClass('disabled');
          } else {
            $('li:last', an[i]).removeClass('disabled');
          }
        }
      }
    }
  } );
}

/*
 * TableTools Bootstrap compatibility
 * Required TableTools 2.1+
 */
if ( $.fn.DataTable.TableTools ) {
  // Set the classes that TableTools uses to something suitable for Bootstrap
  $.extend( true, $.fn.DataTable.TableTools.classes, {
    "container": "DTTT btn-group",
    "buttons": {
      "normal": "btn",
      "disabled": "disabled"
    },
    "collection": {
      "container": "DTTT_dropdown dropdown-menu",
      "buttons": {
        "normal": "",
        "disabled": "disabled"
      }
    },
    "print": {
      "info": "DTTT_print_info modal"
    },
    "select": {
      "row": "active"
    }
  } );

  // Have the collection use a bootstrap compatible dropdown
  $.extend( true, $.fn.DataTable.TableTools.DEFAULTS.oTags, {
    "collection": {
      "container": "ul",
      "button": "li",
      "liner": "a"
    }
  } );
}


function isStorageSupported() {
  try {
      return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
      return false;
  }
}

function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
    return pattern.test(emailAddress);
};

function enableHoverClick($combobox, $entityId, url) {
  /*
  $combobox.mouseleave(function() {
    $combobox.css('text-decoration','none');
  }).on('mouseenter', function(e) {
    setAsLink($combobox, $combobox.closest('.combobox-container').hasClass('combobox-selected'));
  }).on('focusout mouseleave', function(e) {
    setAsLink($combobox, false);
  }).on('click', function() {
    var clientId = $entityId.val();
    if ($(combobox).closest('.combobox-container').hasClass('combobox-selected')) {
      if (parseInt(clientId) > 0) {
        window.open(url + '/' + clientId, '_blank');
      } else {
        $('#myModal').modal('show');
      }
    };
  });
  */
}

function setAsLink($input, enable) {
  if (enable) {
    $input.css('text-decoration','underline');
    $input.css('cursor','pointer');
  } else {
    $input.css('text-decoration','none');
    $input.css('cursor','text');
  }
}

function setComboboxValue($combobox, id, name) {
  $combobox.find('input').val(id);
  $combobox.find('input.form-control').val(name);
  if (id && name) {
    $combobox.find('select').combobox('setSelected');
    $combobox.find('.combobox-container').addClass('combobox-selected');
  } else {
    $combobox.find('.combobox-container').removeClass('combobox-selected');
  }
}


var BASE64_MARKER = ';base64,';
function convertDataURIToBinary(dataURI) {
  var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  var base64 = dataURI.substring(base64Index);
  return base64DecToArr(base64);
}

if (window.ko) {
  ko.bindingHandlers.dropdown = {
      init: function (element, valueAccessor, allBindingsAccessor) {
         var options = allBindingsAccessor().dropdownOptions|| {};
         var value = ko.utils.unwrapObservable(valueAccessor());
         var id = (value && value.public_id) ? value.public_id() : (value && value.id) ? value.id() : value ? value : false;
         if (id) $(element).val(id);
         //console.log("combo-init: %s", id);
         $(element).combobox(options);

         /*
          ko.utils.registerEventHandler(element, "change", function () {
            console.log("change: %s", $(element).val());
            //var
            valueAccessor($(element).val());
              //$(element).combobox('refresh');
          });
          */
      },
      update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var id = (value && value.public_id) ? value.public_id() : (value && value.id) ? value.id() : value ? value : false;
          //console.log("combo-update: %s", id);
        if (id) {
          $(element).val(id);
          $(element).combobox('refresh');
        } else {
          $(element).combobox('clearTarget');
          $(element).combobox('clearElement');
        }
      }
  };

  ko.bindingHandlers.combobox = {
      init: function (element, valueAccessor, allBindingsAccessor) {
         var options = allBindingsAccessor().dropdownOptions|| {};
         var value = ko.utils.unwrapObservable(valueAccessor());
         var id = (value && value.public_id) ? value.public_id() : (value && value.id) ? value.id() : value ? value : false;
         if (id) $(element).val(id);
         $(element).combobox(options);

          ko.utils.registerEventHandler(element, "change", function () {
            var value = valueAccessor();
            value($(element).val());
          });
      },
      update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var id = (value && value.public_id) ? value.public_id() : (value && value.id) ? value.id() : value ? value : false;
        if (id) {
          $(element).val(id);
          $(element).combobox('refresh');
        } else {
          $(element).combobox('clearTarget');
          $(element).combobox('clearElement');
        }
      }
  };

  ko.bindingHandlers.datePicker = {
      init: function (element, valueAccessor, allBindingsAccessor) {
         var value = ko.utils.unwrapObservable(valueAccessor());
         if (value) $(element).datepicker('update', value);
         $(element).change(function() {
            var value = valueAccessor();
            value($(element).val());
         })
      },
      update: function (element, valueAccessor) {
         var value = ko.utils.unwrapObservable(valueAccessor());
         if (value) $(element).datepicker('update', value);
      }
  };

  ko.bindingHandlers.placeholder = {
    init: function (element, valueAccessor, allBindingsAccessor) {
      var underlyingObservable = valueAccessor();
      ko.applyBindingsToNode(element, { attr: { placeholder: underlyingObservable } } );
    }
  };

  ko.bindingHandlers.tooltip = {
    init: function(element, valueAccessor) {
        var local = ko.utils.unwrapObservable(valueAccessor()),
        options = {};

        ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
        ko.utils.extend(options, local);

        $(element).tooltip(options);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $(element).tooltip("destroy");
        });
    },
    options: {
        placement: "bottom",
        trigger: "hover"
    }
  };

  ko.bindingHandlers.typeahead = {
      init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var $element = $(element);
          var allBindings = allBindingsAccessor();

          $element.typeahead({
              highlight: true,
              minLength: 0,
          },
          {
              name: 'data',
              display: allBindings.key,
              limit: 50,
              source: searchData(allBindings.items, allBindings.key)
          }).on('typeahead:change', function(element, datum, name) {
              var value = valueAccessor();
              value(datum);
          });
      },

      update: function (element, valueAccessor) {
          var value = ko.utils.unwrapObservable(valueAccessor());
          if (value) {
              $(element).typeahead('val', value);
          }
      }
  };
}

function comboboxHighlighter(item) {
    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    var result = item.replace(new RegExp('<br/>', 'g'), "\n");
    result = _.escape(result);
    result = result.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return match ? '<strong>' + match + '</strong>' : query;
    });
    return result.replace(new RegExp("\n", 'g'), '<br/>');
}

// https://stackoverflow.com/a/326076/497368
function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

function getContactDisplayName(contact)
{
    if (contact.first_name || contact.last_name) {
        return $.trim((contact.first_name || '') + ' ' + (contact.last_name || ''));
    } else {
        return contact.email;
    }
}

function getContactDisplayNameWithEmail(contact)
{
    var str = '';

    if (contact.first_name || contact.last_name) {
        str += $.trim((contact.first_name || '') + ' ' + (contact.last_name || ''));
    }

    if (contact.email) {
        if (str) {
            str += ' - ';
        }

        str += contact.email;
    }

    return $.trim(str);
}

function getClientDisplayName(client)
{
  var contact = client.contacts ? client.contacts[0] : false;
  if (client.name) {
    return client.name;
  } else if (contact) {
    return getContactDisplayName(contact);
  }
  return '';
}


var CONSTS = {};
CONSTS.INVOICE_STATUS_DRAFT = 1;
CONSTS.INVOICE_STATUS_SENT = 2;
CONSTS.INVOICE_STATUS_VIEWED = 3;
CONSTS.INVOICE_STATUS_APPROVED = 4;
CONSTS.INVOICE_STATUS_PARTIAL = 5;
CONSTS.INVOICE_STATUS_PAID = 6;

$.fn.datepicker.defaults.autoclose = true;
$.fn.datepicker.defaults.todayHighlight = true;

function formatAddress(city, state, zip, swap) {
    var str = '';
    if (swap) {
        str += zip ? zip + ' ' : '';
        str += city ? city : '';
        str += (city && state) ? ', ' : (city ? ' ' : '');
        str += state;
    } else {
        str += city ? city : '';
        str += (city && state) ? ', ' : (state ? ' ' : '');
        str += state + ' ' + zip;
    }
    return str;
}

function concatStrings() {
  var concatStr = '';
  var data = [];
  for (var i=0; i<arguments.length; i++) {
    var string = arguments[i];
    if (string) {
      data.push(string);
    }
  }
  for (var i=0; i<data.length; i++) {
    concatStr += data[i];
    if (i == 0 && data.length > 1) {
      concatStr += ', ';
    } else if (i < data.length -1) {
      concatStr += ' ';
    }
  }
  return data.length ? concatStr : "";
}

function calculateAmounts(invoice) {
  var total = 0;
  var hasTaxes = false;
  var taxes = {};
  invoice.has_custom_item_value1 = false;
  invoice.has_custom_item_value2 = false;

  var hasStandard = false;
  var hasTask = false;
  var hasDiscount = false;

  // sum line item
  for (var i=0; i<invoice.invoice_items.length; i++) {
    var item = invoice.invoice_items[i];
    var lineTotal = roundSignificant(NINJA.parseFloat(item.cost) * NINJA.parseFloat(item.qty));
    var discount = roundToTwo(NINJA.parseFloat(item.discount));
    if (discount != 0) {
        if (parseInt(invoice.is_amount_discount)) {
            lineTotal -= discount;
        } else {
            lineTotal -= roundToTwo(lineTotal * discount / 100);
        }
    }

    lineTotal = roundToTwo(lineTotal);
    if (lineTotal) {
      total += lineTotal;
      total = roundToTwo(total);
    }
    if (!item.notes && !item.product_key && !item.cost) {
        continue;
    }
    if (item.invoice_item_type_id == 2) {
        hasTask = true;
    } else {
        hasStandard = true;
    }
  }

  invoice.hasTasks = hasTask;
  invoice.hasStandard = hasStandard;
  invoice.hasSecondTable = hasTask && hasStandard;

  for (var i=0; i<invoice.invoice_items.length; i++) {
    var item = invoice.invoice_items[i];
    var taxRate1 = 0;
    var taxName1 = '';
    var taxRate2 = 0;
    var taxName2 = '';

    if (invoice.features.invoice_settings) {
        if (item.custom_value1) {
            invoice.has_custom_item_value1 = true;
        }

        if (item.custom_value2) {
            invoice.has_custom_item_value2 = true;
        }
    }

    if (parseFloat(item.tax_rate1) != 0 || item.tax_name1) {
      taxRate1 = parseFloat(item.tax_rate1);
      taxName1 = item.tax_name1;
    }

    if (parseFloat(item.tax_rate2) != 0 || item.tax_name2) {
      taxRate2 = parseFloat(item.tax_rate2);
      taxName2 = item.tax_name2;
    }

    // calculate line item tax
    var lineTotal = roundSignificant(NINJA.parseFloat(item.cost) * NINJA.parseFloat(item.qty));
    var discount = roundToTwo(NINJA.parseFloat(item.discount));
    if (discount != 0) {
        hasDiscount = true;
        if (parseInt(invoice.is_amount_discount)) {
            lineTotal -= discount;
        } else {
            lineTotal -= roundSignificant(lineTotal * discount / 100);
        }
    }
    lineTotal = roundSignificant(lineTotal);

    if (invoice.discount != 0) {
        var discount = roundToTwo(NINJA.parseFloat(invoice.discount));
        if (parseInt(invoice.is_amount_discount)) {
            lineTotal -= roundSignificant((lineTotal/total) * discount);
        } else {
            lineTotal -= roundSignificant(lineTotal * discount / 100);
        }
    }

    if (! taxRate1) {
        var taxAmount1 = 0;
    } else if (invoice.account.inclusive_taxes != '1') {
        var taxAmount1 = roundToTwo(lineTotal * taxRate1 / 100);
    } else {
        var taxAmount1 = roundToTwo(lineTotal - (lineTotal / (1 + (taxRate1 / 100))))
    }
    if (taxAmount1 != 0 || taxName1) {
      hasTaxes = true;
      var key = taxName1 + taxRate1;
      if (taxes.hasOwnProperty(key)) {
        taxes[key].amount += taxAmount1;
      } else {
        taxes[key] = {name: taxName1, rate:taxRate1, amount:taxAmount1};
      }
    }

    if (! taxRate2) {
        var taxAmount2 = 0;
    } else if (invoice.account.inclusive_taxes != '1') {
        var taxAmount2 = roundToTwo(lineTotal * taxRate2 / 100);
    } else {
        var taxAmount2 = roundToTwo(lineTotal - (lineTotal / (1 + (taxRate2 / 100))))
    }
    if (taxAmount2 != 0 || taxName2) {
      hasTaxes = true;
      var key = taxName2 + taxRate2;
      if (taxes.hasOwnProperty(key)) {
        taxes[key].amount += taxAmount2;
      } else {
        taxes[key] = {name: taxName2, rate:taxRate2, amount:taxAmount2};
      }
    }
  }

  invoice.has_item_taxes = hasTaxes;
  invoice.has_item_discounts = hasDiscount;
  invoice.subtotal_amount = total;

  var discount = 0;
  if (invoice.discount != 0) {
    if (parseInt(invoice.is_amount_discount)) {
      discount = roundToTwo(invoice.discount);
    } else {
      discount = roundToTwo(total * roundToTwo(invoice.discount) / 100);
    }
    total -= discount;
  }

  // custom fields with taxes
  if (NINJA.parseFloat(invoice.custom_value1) && invoice.custom_taxes1 == '1') {
    total += roundToTwo(invoice.custom_value1);
  }
  if (NINJA.parseFloat(invoice.custom_value2) && invoice.custom_taxes2 == '1') {
    total += roundToTwo(invoice.custom_value2);
  }

  taxRate1 = 0;
  taxRate2 = 0;
  if (parseFloat(invoice.tax_rate1 || 0) != 0) {
    taxRate1 = parseFloat(invoice.tax_rate1);
  }
  if (parseFloat(invoice.tax_rate2 || 0) != 0) {
    taxRate2 = parseFloat(invoice.tax_rate2);
  }

  if (invoice.account.inclusive_taxes != '1') {
      taxAmount1 = roundToTwo(total * taxRate1 / 100);
      taxAmount2 = roundToTwo(total * taxRate2 / 100);
      total = total + taxAmount1 + taxAmount2;

      for (var key in taxes) {
        if (taxes.hasOwnProperty(key)) {
            total += taxes[key].amount;
        }
      }
  } else {
     taxAmount1 = roundToTwo(total - (total / (1 + (taxRate1 / 100))))
     taxAmount2 = roundToTwo(total - (total / (1 + (taxRate2 / 100))))
  }

  // custom fields w/o with taxes
  if (NINJA.parseFloat(invoice.custom_value1) && invoice.custom_taxes1 != '1') {
    total += roundToTwo(invoice.custom_value1);
  }
  if (NINJA.parseFloat(invoice.custom_value2) && invoice.custom_taxes2 != '1') {
    total += roundToTwo(invoice.custom_value2);
  }

  invoice.total_amount = roundToTwo(roundToTwo(total) - (roundToTwo(invoice.amount) - roundToTwo(invoice.balance)));
  invoice.discount_amount = discount;
  invoice.tax_amount1 = taxAmount1;
  invoice.tax_amount2 = taxAmount2;
  invoice.item_taxes = taxes;

  if (NINJA.parseFloat(invoice.partial)) {
    invoice.balance_amount = roundToTwo(invoice.partial);
  } else {
    invoice.balance_amount = invoice.total_amount;
  }

  return invoice;
}

// http://stackoverflow.com/questions/11941876/correctly-suppressing-warnings-in-datatables
window.alert = (function() {
    var nativeAlert = window.alert;
    return function(message) {
        window.alert = nativeAlert;
        message && message.indexOf("DataTables warning") === 0 ?
            console.error(message) :
            nativeAlert(message);
    }
})();


// http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
function objectEquals(x, y) {
    // if both are function
    if (x instanceof Function) {
        if (y instanceof Function) {
            return x.toString() === y.toString();
        }
        return false;
    }
    if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
    if (x === y || x.valueOf() === y.valueOf()) { return true; }

    // if one of them is date, they must had equal valueOf
    if (x instanceof Date) { return false; }
    if (y instanceof Date) { return false; }

    // if they are not function or strictly equal, they both need to be Objects
    if (!(x instanceof Object)) { return false; }
    if (!(y instanceof Object)) { return false; }

    var p = Object.keys(x);
    return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) ?
            p.every(function (i) { return objectEquals(x[i], y[i]); }) : false;
}



/*\
|*|
|*|  Base64 / binary data / UTF-8 strings utilities
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
|*|
\*/

/* Array of bytes to base64 string decoding */

function b64ToUint6 (nChr) {

  return nChr > 64 && nChr < 91 ?
      nChr - 65
    : nChr > 96 && nChr < 123 ?
      nChr - 71
    : nChr > 47 && nChr < 58 ?
      nChr + 4
    : nChr === 43 ?
      62
    : nChr === 47 ?
      63
    :
      0;

}

function base64DecToArr (sBase64, nBlocksSize) {

  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;

    }
  }

  return taBytes;
}

/* Base64 string to array encoding */

function uint6ToB64 (nUint6) {

  return nUint6 < 26 ?
      nUint6 + 65
    : nUint6 < 52 ?
      nUint6 + 71
    : nUint6 < 62 ?
      nUint6 - 4
    : nUint6 === 62 ?
      43
    : nUint6 === 63 ?
      47
    :
      65;

}

function base64EncArr (aBytes) {

  var nMod3 = 2, sB64Enc = "";

  for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3;
    if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
    nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
    if (nMod3 === 2 || aBytes.length - nIdx === 1) {
      sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
      nUint24 = 0;
    }
  }

  return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');

}

/* UTF-8 array to DOMString and vice versa */

function UTF8ArrToStr (aBytes) {

  var sView = "";

  for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
    nPart = aBytes[nIdx];
    sView += String.fromCharCode(
      nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
        /* (nPart - 252 << 32) is not possible in ECMAScript! So...: */
        (nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
        (nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
        (nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
        (nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
        (nPart - 192 << 6) + aBytes[++nIdx] - 128
      : /* nPart < 127 ? */ /* one byte */
        nPart
    );
  }

  return sView;

}

function strToUTF8Arr (sDOMStr) {

  var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

  /* mapping... */

  for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
    nChr = sDOMStr.charCodeAt(nMapIdx);
    nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
  }

  aBytes = new Uint8Array(nArrLen);

  /* transcription... */

  for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
    nChr = sDOMStr.charCodeAt(nChrIdx);
    if (nChr < 128) {
      /* one byte */
      aBytes[nIdx++] = nChr;
    } else if (nChr < 0x800) {
      /* two bytes */
      aBytes[nIdx++] = 192 + (nChr >>> 6);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x10000) {
      /* three bytes */
      aBytes[nIdx++] = 224 + (nChr >>> 12);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x200000) {
      /* four bytes */
      aBytes[nIdx++] = 240 + (nChr >>> 18);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x4000000) {
      /* five bytes */
      aBytes[nIdx++] = 248 + (nChr >>> 24);
      aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else /* if (nChr <= 0x7fffffff) */ {
      /* six bytes */
      aBytes[nIdx++] = 252 + /* (nChr >>> 32) is not possible in ECMAScript! So...: */ (nChr / 1073741824);
      aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    }
  }

  return aBytes;

}



function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
function setDocHexColor(doc, hex) {
  var r = hexToR(hex);
  var g = hexToG(hex);
  var b = hexToB(hex);
  return doc.setTextColor(r, g, b);
}
function setDocHexFill(doc, hex) {
  var r = hexToR(hex);
  var g = hexToG(hex);
  var b = hexToB(hex);
  return doc.setFillColor(r, g, b);
}
function setDocHexDraw(doc, hex) {
  var r = hexToR(hex);
  var g = hexToG(hex);
  var b = hexToB(hex);
  return doc.setDrawColor(r, g, b);
}

function toggleDatePicker(field) {
  $('#'+field).datepicker('show');
}

function getPrecision(number) {
  if (roundToPrecision(number, 3) != number) {
    return 4;
  } else if (roundToPrecision(number, 2) != number) {
    return 3;
  } else {
    return 2;
  }
}

function roundSignificant(number, toString) {
  var precision = getPrecision(number);
  var val = roundToPrecision(number, precision) || 0;
  return toString ? val.toFixed(precision) : val;
}

function roundToTwo(number, toString) {
  var val = roundToPrecision(number, 2) || 0;
  return toString ? val.toFixed(2) : val;
}

function roundToFour(number, toString) {
  var val = roundToPrecision(number, 4) || 0;
  return toString ? val.toFixed(4) : val;
}

// https://stackoverflow.com/a/18358056/497368
function roundToPrecision(number, precision) {
  // prevent negative numbers from rounding to 0
  var isNegative = number < 0;
  if (isNegative) {
      number = number * -1;
  }
  number = +(Math.round(number + "e+"+ precision) + "e-" + precision);
  if (isNegative) {
      number = number * -1;
  }
  return number;
}

function truncate(str, length) {
  return (str && str.length > length) ? (str.substr(0, length-1) + '...') : str;
}

// http://stackoverflow.com/questions/280634/endswith-in-javascript
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// http://codeaid.net/javascript/convert-seconds-to-hours-minutes-and-seconds-%28javascript%29
function secondsToTime(secs)
{
    secs = Math.round(secs);
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}

function twoDigits(value) {
   if (value < 10) {
       return '0' + value;
   }
   return value;
}

function toSnakeCase(str) {
    if (!str) return '';
    return str.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
}

// https://coderwall.com/p/iprsng/convert-snake-case-to-camelcase
function snakeToCamel(s){
    return s.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
}

function getDescendantProp(obj, desc) {
    var arr = desc.split(".");
    while(arr.length && (obj = obj[arr.shift()]));
    return obj;
}

function doubleDollarSign(str) {
    if (!str) return '';
    if (!str.replace) return str;
    return str.replace(/\$/g, '\$\$\$');
}

function truncate(string, length){
   if (string.length > length) {
      return string.substring(0, length) + '...';
   } else {
      return string;
   }
};

// Show/hide the 'Select' option in the datalists
function actionListHandler() {
    $('tbody tr .tr-action').closest('tr').mouseover(function() {
        $(this).closest('tr').find('.tr-action').show();
        $(this).closest('tr').find('.tr-status').hide();
    }).mouseout(function() {
        $dropdown = $(this).closest('tr').find('.tr-action');
        if (!$dropdown.hasClass('open')) {
          $dropdown.hide();
          $(this).closest('tr').find('.tr-status').show();
        }
    });
}

function loadImages(selector) {
    $(selector + ' img').each(function(index, item) {
        var src = $(item).attr('data-src');
        $(item).attr('src', src);
        $(item).attr('data-src', src);
    });
}

// http://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
function prettyJson(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        match = snakeToCamel(match);
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function searchData(data, key, fuzzy, secondKey) {
    return function findMatches(q, cb) {
    var matches, substringRegex;
    if (fuzzy) {
        var options = {
          keys: [key],
        }
        var fuse = new Fuse(data, options);
        matches = fuse.search(q);
    } else {
        matches = [];
        substrRegex = new RegExp(escapeRegExp(q), 'i');
        $.each(data, function(i, obj) {
          if (substrRegex.test(obj[key])) {
            matches.push(obj);
          } else if (secondKey && substrRegex.test(obj[secondKey]))
            matches.push(obj);
          });
    }
    cb(matches);
    }
};

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function firstJSONError(json) {
    for (var key in json) {
        if ( ! json.hasOwnProperty(key)) {
            continue;
        }
        var item = json[key];
        for (var subKey in item) {
            if ( ! item.hasOwnProperty(subKey)) {
                continue;
            }
            return item[subKey];
        }
    }
    return false;
}

// http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function brewerColor(number) {
    var colors = [
        '#1c9f77',
        '#d95d02',
        '#716cb1',
        '#e62a8b',
        '#5fa213',
        '#e6aa04',
        '#a87821',
        '#676767',
    ];
    var number = (number-1) % colors.length;

    return colors[number];
}

// https://gist.github.com/sente/1083506
function formatXml(xml) {
    var formatted = '';
    var reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    var pad = 0;
    jQuery.each(xml.split('\r\n'), function(index, node) {
        var indent = 0;
        if (node.match( /.+<\/\w[^>]*>$/ )) {
            indent = 0;
        } else if (node.match( /^<\/\w/ )) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
            indent = 1;
        } else {
            indent = 0;
        }

        var padding = '';
        for (var i = 0; i < pad; i++) {
            padding += '  ';
        }

        formatted += padding + node + '\r\n';
        pad += indent;
    });

    return formatted;
}

function openUrlOnClick(url, event) {
    if (event.ctrlKey) {
        window.open(url, '_blank');
    } else {
        window.location = url;
    }
}

// https://stackoverflow.com/a/11268104/497368
function scorePassword(pass) {
    var score = 0;
    if (!pass)
    return score;

    // award every unique letter until 5 repetitions
    var letters = new Object();
    for (var i=0; i<pass.length; i++) {
        letters[pass[i]] = (letters[pass[i]] || 0) + 1;
        score += 5.0 / letters[pass[i]];
    }

    // bonus points for mixing it up
    var variations = {
        digits: /\d/.test(pass),
        lower: /[a-z]/.test(pass),
        upper: /[A-Z]/.test(pass),
        nonWords: /\W/.test(pass),
    }

    variationCount = 0;
    for (var check in variations) {
        variationCount += (variations[check] == true) ? 1 : 0;
    }
    score += (variationCount - 1) * 10;

    return parseInt(score);
}

var NINJA = NINJA || {};

NINJA.TEMPLATES = {
    CLEAN: "1",
    BOLD:"2",
    MODERN: "3",
    NORMAL:"4",
    BUSINESS:"5",
    CREATIVE:"6",
    ELEGANT:"7",
    HIPSTER:"8",
    PLAYFUL:"9",
    PHOTO:"10"
};

function GetPdfMake(invoice, javascript, callback) {
    var itemsTable = false;

    // check if we need to add a second table for tasks
    if (invoice.hasTasks) {
        if (invoice.hasSecondTable) {
            var json = JSON.parse(javascript);
            for (var i=0; i<json.content.length; i++) {
                var item = json.content[i];
                if (item.table && item.table.body == '$invoiceLineItems') {
                    itemsTable = JSON.stringify(item);
                    itemsTable = itemsTable.replace('$invoiceLineItems', '$taskLineItems');
                    itemsTable = itemsTable.replace('$invoiceLineItemColumns', '$taskLineItemColumns');
                    break;
                }
            }
            itemsTable = JSON.parse(itemsTable);
            json.content.splice(i+1, 0, itemsTable);
            javascript = JSON.stringify(json);
        // use the single product table for tasks
        } else {
            javascript = javascript.replace('$invoiceLineItems', '$taskLineItems');
            javascript = javascript.replace('$invoiceLineItemColumns', '$taskLineItemColumns');
        }
    } else if (invoice.is_statement) {
        var json = JSON.parse(javascript);
        for (var i=0; i<json.content.length; i++) {
            var item = json.content[i];
            if (item.table && item.table.body == '$invoiceLineItems') {
                json.content.splice(i, 2);
                json.content.splice(i, 0, "$statementDetails");
            }
        }
        javascript = JSON.stringify(json);
    }

    javascript = NINJA.decodeJavascript(invoice, javascript);

    function jsonCallBack(key, val) {

        // handle custom functions
        if (typeof val === 'string') {
            if (val.indexOf('$firstAndLast') === 0) {
                var parts = val.split(':');
                return function (i, node) {
                    return (i === 0 || i === node.table.body.length) ? parseFloat(parts[1]) : 0;
                };
            } else if (val.indexOf('$none') === 0) {
                return function (i, node) {
                    return 0;
                };
            } else if (val.indexOf('$notFirstAndLastColumn') === 0) {
                var parts = val.split(':');
                return function (i, node) {
                    return (i === 0 || i === node.table.widths.length) ? 0 : parseFloat(parts[1]);
                };
            } else if (val.indexOf('$notFirst') === 0) {
                var parts = val.split(':');
                return function (i, node) {
                    return i === 0 ? 0 : parseFloat(parts[1]);
                };
            } else if (val.indexOf('$amount') === 0) {
                var parts = val.split(':');
                return function (i, node) {
                    return parseFloat(parts[1]);
                };
            } else if (val.indexOf('$primaryColor') === 0) {
                var parts = val.split(':');
                return NINJA.primaryColor || parts[1];
            } else if (val.indexOf('$secondaryColor') === 0) {
                var parts = val.split(':');
                return NINJA.secondaryColor || parts[1];
            }
        }

        // determine whether or not to show the header/footer
        if (invoice.features.customize_invoice_design) {
            if (key === 'header') {
                return function(page, pages) {
                    if (page === 1 || invoice.account.all_pages_header == '1') {
                        if (invoice.features.remove_created_by) {
                            return NINJA.updatePageCount(JSON.parse(JSON.stringify(val)), page, pages);
                        } else {
                            return val;
                        }
                    } else {
                        return '';
                    }
                }
            } else if (key === 'footer') {
                return function(page, pages) {
                    if (page === pages || invoice.account.all_pages_footer == '1') {
                        if (invoice.features.remove_created_by) {
                            return NINJA.updatePageCount(JSON.parse(JSON.stringify(val)), page, pages);
                        } else {
                            return val;
                        }
                    } else {
                        return '';
                    }
                }
            }
        }

        // check for markdown
        if (key === 'text') {
            val = NINJA.parseMarkdownText(val, true);
        }

        /*
        if (key === 'stack') {
            val = NINJA.parseMarkdownStack(val);
            val = NINJA.parseMarkdownText(val, false);
        }
        */

        return val;
    }

    // Add ninja logo to the footer
    var dd = JSON.parse(javascript, jsonCallBack);
    var designId = invoice.invoice_design_id;
    if (!invoice.features.remove_created_by) {
        var footer = (typeof dd.footer === 'function') ? dd.footer() : dd.footer;
        if (footer) {
            if (footer.hasOwnProperty('columns')) {
                footer.columns.push({image: logoImages.imageLogo1, alignment: 'right', width: 130, margin: [0, 0, 0, 0]})
            } else {
                var foundColumns;
                for (var i=0; i<footer.length; i++) {
                    var item = footer[i];
                    if (item.hasOwnProperty('columns')) {
                        foundColumns = true;
                        var columns = item.columns;
                        if (columns[0].hasOwnProperty('stack')) {
                            columns[0].stack.push({image: logoImages.imageLogo3, alignment: 'left', width: 130, margin: [40, 6, 0, 0]});
                        } else {
                            columns.push({image: logoImages.imageLogo1, alignment: 'right', width: 130, margin: [0, -40, 20, 0]})
                        }
                    }
                }
                if (!foundColumns) {
                    footer.push({image: logoImages.imageLogo1, alignment: 'right', width: 130, margin: [0, 0, 10, 10]})
                }
            }
        }
    }

    // support setting noWrap as a style
    dd.styles.noWrap = {'noWrap': true};
    dd.styles.discount = {'alignment': 'right'};
    dd.styles.alignRight = {'alignment': 'right'};

    // set page size
    dd.pageSize = invoice.account.page_size;

    if (invoice.watermark) {
        dd.watermark = {
            text: invoice.watermark,
            color: 'black',
            opacity: 0.04,
        };
    }

    pdfMake.fonts = {}
    fonts = window.invoiceFonts || invoice.invoice_fonts;

    // Add only the loaded fonts
    $.each(fonts, function(i,font){
        addFont(font);
    });


    function addFont(font){
        if(window.ninjaFontVfs[font.folder]){
            folder = 'fonts/'+font.folder;
            pdfMake.fonts[font.name] = {
                normal: folder+'/'+font.normal,
                italics: folder+'/'+font.italics,
                bold: folder+'/'+font.bold,
                bolditalics: folder+'/'+font.bolditalics
            }
        }
    }

    if(!dd.defaultStyle)dd.defaultStyle = {font:NINJA.bodyFont};
    else if(!dd.defaultStyle.font)dd.defaultStyle.font = NINJA.bodyFont;

    if (window.accountBackground) {
        var origBackground = dd.background;
        if (! origBackground) {
            origBackground = [{"image": window.accountBackground, "alignment": "center"}];
        }
        dd.background = function(currentPage) {
            var allPages = origBackground.length && origBackground[0].pages == 'all';
            return currentPage == 1 || allPages ? origBackground : false;
        }
    } else {
        // prevent unnecessarily showing blank image
        dd.background = false;
    }

    doc = pdfMake.createPdf(dd);
    doc.save = function(fileName) {
        this.download(fileName);
    };

    return doc;
}

NINJA.updatePageCount = function(obj, pageNumber, pageCount)
{
    var pageNumberRegExp = new RegExp('\\$pageNumber', 'g');
    var pageCountRegExp = new RegExp('\\$pageCount', 'g');

    for (key in obj) {
        if (!obj.hasOwnProperty(key)) {
            continue;
        }
        var val = obj[key];
        if (typeof val === 'string') {
            val = val.replace(pageNumberRegExp, pageNumber);
            val = val.replace(pageCountRegExp, pageCount);
            obj[key] = val;
        } else if (typeof val === 'object') {
            obj[key] = NINJA.updatePageCount(val, pageNumber, pageCount);
        }
    }

    return obj;
}

NINJA.decodeJavascript = function(invoice, javascript)
{
    var account = invoice.account;
    var blankImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

    // search/replace variables
    var json = {
        'accountName': account.name || ' ',
        'accountLogo': window.accountLogo ? window.accountLogo : blankImage,
        'accountBackground': window.accountBackground ? window.accountBackground : blankImage,
        'accountDetails': NINJA.accountDetails(invoice),
        'accountAddress': NINJA.accountAddress(invoice),
        'invoiceDetails': NINJA.invoiceDetails(invoice),
        'invoiceDetailsHeight': (NINJA.invoiceDetails(invoice).length * 16) + 16,
        'invoiceLineItems': NINJA.invoiceLines(invoice),
        'invoiceLineItemColumns': NINJA.invoiceColumns(invoice, javascript),
        'taskLineItems': NINJA.invoiceLines(invoice, true),
        'taskLineItemColumns': NINJA.invoiceColumns(invoice, javascript, true),
        'invoiceDocuments' : NINJA.invoiceDocuments(invoice),
        'quantityWidth': NINJA.quantityWidth(invoice),
        'taxWidth': NINJA.taxWidth(invoice),
        'clientDetails': NINJA.clientDetails(invoice),
        'statementDetails': NINJA.statementDetails(invoice),
        'notesAndTerms': NINJA.notesAndTerms(invoice),
        'subtotals': NINJA.subtotals(invoice),
        'subtotalsHeight': (NINJA.subtotals(invoice).length * 16) + 16,
        'subtotalsWithoutBalance': NINJA.subtotals(invoice, true),
        'subtotalsBalance': NINJA.subtotalsBalance(invoice),
        'balanceDue': formatMoneyInvoice(invoice.balance_amount, invoice),
        'invoiceFooter': NINJA.invoiceFooter(invoice),
        'invoiceNumber': invoice.is_statement ? '' : (invoice.invoice_number || ' '),
        'entityType': NINJA.entityType(invoice),
        'entityTypeUC': NINJA.entityType(invoice).toUpperCase(),
        'entityTaxType': invoice.is_statement ? invoiceLabels.statement : invoice.is_quote ? invoiceLabels.tax_quote : invoiceLabels.tax_invoice,
        'fontSize': NINJA.fontSize,
        'fontSizeLarger': NINJA.fontSize + 1,
        'fontSizeLargest': NINJA.fontSize + 2,
        'fontSizeSmaller': NINJA.fontSize - 1,
        'bodyFont': NINJA.bodyFont,
        'headerFont': NINJA.headerFont,
        'signature': NINJA.signature(invoice),
        'signatureBase64': NINJA.signatureImage(invoice),
        'signatureDate': NINJA.signatureDate(invoice),
        'invoiceTotal': formatMoneyInvoice(invoice.amount, invoice),
    }

    for (var key in json) {
        // remove trailing commas for these fields
        if (['quantityWidth', 'taxWidth'].indexOf(key) >= 0) {
            var regExp = new RegExp('"\\$'+key+'",', 'g');
            val = json[key];
        } else {
            var regExp = new RegExp('"\\$'+key+'"', 'g');
            var val = JSON.stringify(json[key]);
            val = doubleDollarSign(val);
        }
        javascript = javascript.replace(regExp, val);
    }

    // search/replace labels
    var regExp = new RegExp('"\\$\\\w*?Label(UC)?(:)?(\\\?)?"', 'g');
    var matches = javascript.match(regExp);

    if (matches) {
        for (var i=0; i<matches.length; i++) {
            var match = matches[i];
            field = match.substring(2, match.indexOf('Label'));
            field = toSnakeCase(field);
            var value = getDescendantProp(invoice, field);
            if (match.indexOf('?') < 0 || value) {
                if (invoice.partial > 0 && field == 'balance_due') {
                    field = 'partial_due';
                } else if (invoice.is_quote) {
                    if (field == 'due_date') {
                        field = 'valid_until';
                    } else {
                        field = field.replace('invoice', 'quote');
                    }
                }
                if (invoice.is_statement) {
                    if (field == 'your_invoice') {
                        field = 'your_statement';
                    } else if (field == 'invoice_issued_to') {
                        field = 'statement_issued_to';
                    } else if (field == 'invoice_to') {
                        field = 'statement_to';
                    }
                } else if (invoice.is_delivery_note) {
                    field = 'delivery_note';
                } else if (invoice.balance_amount < 0) {
                    if (field == 'your_invoice') {
                        field = 'your_credit';
                    } else if (field == 'invoice_issued_to') {
                        field = 'credit_issued_to';
                    } else if (field == 'invoice_to') {
                        field = 'credit_to';
                    }
                }

                var label = invoiceLabels[field];
                if (match.indexOf('UC') >= 0) {
                    label = label.toUpperCase();
                }
                if (match.indexOf(':') >= 0) {
                    label = label + ':';
                }
            } else {
                label = ' ';
            }
            javascript = javascript.replace(match, '"'+label+'"');
        }
    }

    // search/replace values
    var regExp = new RegExp('\\$[a-zA-Z][a-zA-Z0-9_\\.]*[Value]?', 'g');
    var matches = javascript.match(regExp);

    if (matches) {
        for (var i=0; i<matches.length; i++) {
            var match = matches[i];

            // reserved words
            if ([
                '$none',
                '$firstAndLast',
                '$notFirstAndLastColumn',
                '$notFirst',
                '$amount',
                '$primaryColor',
                '$secondaryColor',
            ].indexOf(match) >= 0) {
                continue;
            }

            field = match.replace('$invoice.', '$');

            // legacy style had 'Value' at the end
            if (endsWith(field, 'Value')) {
                field = field.substring(1, field.indexOf('Value'));
            } else {
                field = field.substring(1, field.length);
            }

            if (! field) {
                continue;
            }

            field = toSnakeCase(field);

            if (field == 'footer') {
                field = 'invoice_footer';
            } else if (match == '$account.phone') {
                field = 'account.work_phone';
            } else if (match == '$client.phone') {
                field = 'client.phone';
            }

            var value = getDescendantProp(invoice, field) || ' ';
            value = doubleDollarSign(value) + '';
            value = value.replace(/\n/g, "\\n").replace(/\r/g, "\\r");

            if (['amount', 'partial', 'client.balance', 'client.paid_to_date'].indexOf(field) >= 0) {
                value = formatMoneyInvoice(value, invoice);
            }

            if (['$pageNumber', '$pageCount'].indexOf(match) == -1) {
                javascript = javascript.replace(match, value);
            }
        }
    }

    return javascript;
}

NINJA.statementDetails = function(invoice) {
    if (! invoice.is_statement) {
        return false;
    }

    var data = {
        "stack": []
    };

    var table = {
        "style": "invoiceLineItemsTable",
        "margin": [0, 20, 0, 16],
        "table": {
            "headerRows": 1,
            "widths": false,
            "body": false,
        },
        "layout": {
            "hLineWidth": "$notFirst:.5",
            "vLineWidth": "$none",
            "hLineColor": "#D8D8D8",
            "paddingLeft": "$amount:8",
            "paddingRight": "$amount:8",
            "paddingTop": "$amount:14",
            "paddingBottom": "$amount:14"
        }
    };

    var subtotals =   {
        "columns": [
            {
                "text": " ",
                "width": "60%",
            },
            {
                "table": {
                    "widths": [
                        "*",
                        "40%"
                    ],
                    "body": false,
                },
                "margin": [0, 0, 0, 16],
                "layout": {
                    "hLineWidth": "$none",
                    "vLineWidth": "$none",
                    "paddingLeft": "$amount:34",
                    "paddingRight": "$amount:8",
                    "paddingTop": "$amount:4",
                    "paddingBottom": "$amount:4"
                }
            }
        ]
    };


    var hasPayments = false;
    var hasAging = false;
    var paymentTotal = 0;
    for (var i = 0; i < invoice.invoice_items.length; i++) {
        var item = invoice.invoice_items[i];
        if (item.invoice_item_type_id == 3) {
            paymentTotal += item.cost;
            hasPayments = true;
        } else if (item.invoice_item_type_id == 4) {
            hasAging = true;
        }
    }

    var clone = JSON.parse(JSON.stringify(table));
    clone.table.body = NINJA.prepareDataTable(NINJA.statementInvoices(invoice), 'invoiceItems');
    clone.table.widths = ["22%", "22%", "22%", "17%", "17%"];
    data.stack.push(clone);

    var clone = JSON.parse(JSON.stringify(subtotals));
    clone.columns[1].table.body = [[
        { text: invoiceLabels.balance_due, style: ['subtotalsLabel', 'subtotalsBalanceDueLabel'] },
        { text: formatMoneyInvoice(invoice.balance_amount, invoice), style: ['subtotals', 'subtotalsBalanceDue', 'noWrap'] }
    ]];
    data.stack.push(clone);

    if (hasPayments) {
        var clone = JSON.parse(JSON.stringify(table));
        clone.table.body = NINJA.prepareDataTable(NINJA.statementPayments(invoice), 'invoiceItems');
        clone.table.widths = ["22%", "22%", "39%", "17%"];
        data.stack.push(clone);

        var clone = JSON.parse(JSON.stringify(subtotals));
        clone.columns[1].table.body = [[
            { text: invoiceLabels.amount_paid, style: ['subtotalsLabel', 'subtotalsBalanceDueLabel'] },
            { text: formatMoneyInvoice(paymentTotal, invoice), style: ['subtotals', 'subtotalsBalanceDue', 'noWrap'] }
        ]];
        data.stack.push(clone);
    }

    if (hasAging) {
        var clone = JSON.parse(JSON.stringify(table));
        clone.table.body = NINJA.prepareDataTable(NINJA.statementAging(invoice), 'invoiceItems');
        clone.table.widths = ["20%", "20%", "20%", "20%", "20%"];
        data.stack.push(clone);
    }

    return data;
}

NINJA.statementInvoices = function(invoice) {
    var grid = [[]];
    grid[0].push({text: invoiceLabels.invoice_number, style: ['tableHeader', 'itemTableHeader', 'firstColumn']});
    grid[0].push({text: invoiceLabels.invoice_date, style: ['tableHeader', 'invoiceDateTableHeader']});
    grid[0].push({text: invoiceLabels.due_date, style: ['tableHeader', 'dueDateTableHeader']});
    grid[0].push({text: invoiceLabels.total, style: ['tableHeader', 'totalTableHeader']});
    grid[0].push({text: invoiceLabels.balance, style: ['tableHeader', 'balanceTableHeader', 'lastColumn']});

    var counter = 0;
    for (var i = 0; i < invoice.invoice_items.length; i++) {
        var item = invoice.invoice_items[i];
        if (item.invoice_item_type_id != 1) {
            continue;
        }
        var rowStyle = (counter++ % 2 == 0) ? 'odd' : 'even';
        grid.push([
            {text: item.product_key, style:['invoiceNumber', 'productKey', rowStyle, 'firstColumn']},
            {text: item.custom_value1 && item.custom_value1 != '0000-00-00' ? moment(item.custom_value1).format(invoice.account.date_format ? invoice.account.date_format.format_moment : 'MMM D, YYYY') : ' ', style:['invoiceDate', rowStyle]},
            {text: item.custom_value2 && item.custom_value2 != '0000-00-00' ? moment(item.custom_value2).format(invoice.account.date_format ? invoice.account.date_format.format_moment : 'MMM D, YYYY') : ' ', style:['dueDate', rowStyle]},
            {text: formatMoneyInvoice(item.notes, invoice), style:['subtotals', rowStyle]},
            {text: formatMoneyInvoice(item.cost, invoice), style:['lineTotal', rowStyle, 'lastColumn']},
        ]);
    }

    return grid;
}

NINJA.statementPayments = function(invoice) {
    var grid = [[]];

    grid[0].push({text: invoiceLabels.invoice_number, style: ['tableHeader', 'itemTableHeader', 'firstColumn']});
    grid[0].push({text: invoiceLabels.payment_date, style: ['tableHeader', 'invoiceDateTableHeader']});
    grid[0].push({text: invoiceLabels.method, style: ['tableHeader', 'dueDateTableHeader']});
    //grid[0].push({text: invoiceLabels.reference, style: ['tableHeader', 'totalTableHeader']});
    grid[0].push({text: invoiceLabels.amount, style: ['tableHeader', 'balanceTableHeader', 'lastColumn']});

    var counter = 0;
    for (var i = 0; i < invoice.invoice_items.length; i++) {
        var item = invoice.invoice_items[i];
        if (item.invoice_item_type_id != 3) {
            continue;
        }
        var rowStyle = (counter++ % 2 == 0) ? 'odd' : 'even';
        grid.push([
            {text: item.product_key, style:['invoiceNumber', 'productKey', rowStyle, 'firstColumn']},
            {text: item.custom_value1 && item.custom_value1 != '0000-00-00' ? moment(item.custom_value1).format(invoice.account.date_format ? invoice.account.date_format.format_moment : 'MMM D, YYYY') : ' ', style:['invoiceDate', rowStyle]},
            {text: item.custom_value2 ? item.custom_value2 : ' ', style:['dueDate', rowStyle]},
            //{text: item.transaction_reference, style:['subtotals', rowStyle]},
            {text: formatMoneyInvoice(item.cost, invoice), style:['lineTotal', rowStyle, 'lastColumn']},
        ]);
    }

    return grid;
}
NINJA.statementAging = function(invoice) {
    var grid = [[]];

    grid[0].push({text: '0 - 30', style: ['tableHeader', 'alignRight', 'firstColumn']});
    grid[0].push({text: '30 - 60', style: ['tableHeader', 'alignRight']});
    grid[0].push({text: '60 - 90', style: ['tableHeader', 'alignRight']});
    grid[0].push({text: '90 - 120', style: ['tableHeader', 'alignRight']});
    grid[0].push({text: '120+', style: ['tableHeader', 'alignRight', 'lastColumn']});

    for (var i = 0; i < invoice.invoice_items.length; i++) {
        var item = invoice.invoice_items[i];
        if (item.invoice_item_type_id != 4) {
            continue;
        }
        grid.push([
            {text: formatMoneyInvoice(item.product_key, invoice), style:['subtotals', 'odd', 'firstColumn']},
            {text: formatMoneyInvoice(item.notes, invoice), style:['subtotals', 'odd']},
            {text: formatMoneyInvoice(item.custom_value1, invoice), style:['subtotals', 'odd']},
            {text: formatMoneyInvoice(item.custom_value1, invoice), style:['subtotals', 'odd']},
            {text: formatMoneyInvoice(item.cost, invoice), style:['subtotals', 'odd', 'lastColumn']},
        ]);
    }

    return grid;
}

NINJA.signature = function(invoice) {
    var invitation = NINJA.getSignatureInvitation(invoice);
    if (invitation) {
        return {
            "stack": [
                {
                    "image": "$signatureBase64",
                    "margin": [200, 10, 0, 0]
                },
                {
                    "canvas": [{
                        "type": "line",
                        "x1": 200,
                        "y1": -25,
                        "x2": 504,
                        "y2": -25,
                        "lineWidth": 1,
                        "lineColor": "#888888"
                    }]
                },
                {
                    "text": [invoiceLabels.date, ": ", "$signatureDate"],
                    "margin": [200, -20, 0, 0]
                }
            ]
        };
    } else {
        return '';
    }
}

NINJA.signatureImage = function(invoice) {
    var blankImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
    var invitation = NINJA.getSignatureInvitation(invoice);
    return invitation ? invitation.signature_base64 : blankImage;
}

NINJA.signatureDate = function(invoice) {
    var invitation = NINJA.getSignatureInvitation(invoice);
    return invitation ? NINJA.formatDateTime(invitation.signature_date, invoice.account) : '';
}

NINJA.getSignatureInvitation = function(invoice) {
    if (! invoice.invitations || ! invoice.invitations.length) {
        return false;
    }

    if (! parseInt(invoice.account.signature_on_pdf)) {
        return false;
    }

    for (var i=0; i<invoice.invitations.length; i++) {
        var invitation = invoice.invitations[i];
        if (invitation.signature_base64) {
            return invitation;
        }
    }

    return false;
}

NINJA.formatDateTime = function(date, account) {
    var format = account.datetime_format ? account.datetime_format.format_moment : 'LLL';
    var timezone = account.timezone ? account.timezone.name : 'US/Eastern';

    return date ? moment.utc(date).tz(timezone).format(format) : '';
}

NINJA.entityType = function(invoice)
{
    if (invoice.is_delivery_note) {
        return invoiceLabels.delivery_note;
    } else if (invoice.is_statement) {
        return invoiceLabels.statement;
    } else if (invoice.is_quote) {
        return invoiceLabels.quote;
    } else if (invoice.balance_amount < 0) {
        return invoiceLabels.credit_note;
    } else if (hasPayments) {
        return "RECEIPT";
    } else {
        return invoiceLabels.invoice;
    }
}

NINJA.notesAndTerms = function(invoice)
{
    var data = [];

    if (invoice.public_notes) {
        data.push({stack:[{text: invoice.is_recurring ? processVariables(invoice.public_notes) : invoice.public_notes, style: ['notes']}]});
        data.push({text:' '});
    }

    if (invoice.terms) {
        data.push({text:invoiceLabels.terms, style: ['termsLabel']});
        data.push({stack:[{text: invoice.is_recurring ? processVariables(invoice.terms) : invoice.terms, style: ['terms']}]});
    }

    return NINJA.prepareDataList(data, 'notesAndTerms');
}

NINJA.invoiceColumns = function(invoice, design, isTasks)
{
    var account = invoice.account;
    var columns = [];
    var fields = NINJA.productFields(invoice, isTasks);
    var hasDescription = fields.indexOf('product.description') >= 0;
    var hasPadding = design.indexOf('"pageMargins":[0') == -1 && design.indexOf('"pageMargins": [0') == -1;

    for (var i=0; i<fields.length; i++) {
        var field = fields[i];
        var width = 0;

        if (invoice.is_delivery_note) {
            var skipFields = [
                'product.unit_cost',
                'product.rate',
                'product.tax',
                'product.line_total',
            ];
            if (skipFields.indexOf(field) >= 0) {
                continue;
            }
        }

        if (field == 'product.custom_value1') {
            if (invoice.has_custom_item_value1) {
                width = 10;
            } else {
                continue;
            }
        } else if (field == 'product.custom_value2') {
            if (invoice.has_custom_item_value2) {
                width = 10;
            } else {
                continue;
            }
        } else if (field == 'product.tax') {
            if (invoice.has_item_taxes) {
                width = 15;
            } else {
                continue;
            }
        } else if (field == 'product.discount') {
            if (invoice.has_item_discounts) {
                width = 15;
            } else {
                continue;
            }
        } else if (field == 'product.description') {
            width = 0;
        } else {
            width = 14;
        }

        if (width) {
            // make the first and last columns of the Bold design a bit wider
            if (! hasPadding) {
                if (i == 0 || i == fields.length - 1) {
                    width += 8;
                }
            }
            if (! hasDescription) {
                width = '*';
            } else {
                width += '%';
            }
        } else {
            width = '*';
        }

        columns.push(width)
    }

    //console.log(columns);
    return columns;
}

NINJA.invoiceFooter = function(invoice)
{
    var footer = invoice.invoice_footer;

    if (invoice.is_recurring) {
        footer = processVariables(footer);
    }

    if (!invoice.features.invoice_settings && invoice.invoice_design_id == 3) {
        return footer ? footer.substring(0, 200) : ' ';
    } else {
        return footer || ' ';
    }
}

NINJA.quantityWidth = function(invoice)
{
    var fields = NINJA.productFields(invoice);
    return fields.indexOf('product.quantity') >= 0 ? '"14%", ' : '';
}

NINJA.taxWidth = function(invoice)
{
    var fields = NINJA.productFields(invoice);
    return invoice.has_item_taxes && fields.indexOf('product.tax') >= 0 ? '"14%", ' : '';
}

NINJA.productFields = function(invoice, isTasks) {
    var account = invoice.account;
    var allFields = JSON.parse(account.invoice_fields);

    if (allFields) {
        if (isTasks && allFields.task_fields && allFields.task_fields.length) {
            return allFields.task_fields;
        } else if (! isTasks && allFields.product_fields && allFields.product_fields.length) {
            return allFields.product_fields;
        }
    }

    var fields = [
        isTasks ? 'product.service' : 'product.item',
        'product.description',
        'product.custom_value1',
        'product.custom_value2',
        isTasks ? 'product.rate' : 'product.unit_cost',
        isTasks ? 'product.hours' : 'product.quantity',
        'product.tax',
        'product.line_total',
    ];

    // add backwards compatibility for 'hide qty' setting
    if (invoice.account.hide_quantity == '1' && ! isTasks) {
        fields.splice(5, 1);
    }

    return fields;
}

NINJA.invoiceLines = function(invoice, isSecondTable) {
    var account = invoice.account;
    var total = 0;
    var shownItem = false;
    var isTasks = isSecondTable || (invoice.hasTasks && !invoice.hasStandard);
    var grid = [[]];
    var styles = ['tableHeader'];
    var skipFields = [
        'product.unit_cost',
        'product.rate',
        'product.tax',
        'product.line_total',
        'product.discount',
    ];

    if (isSecondTable && invoice.hasStandard) {
        styles.push('secondTableHeader');
    }

    var fields = NINJA.productFields(invoice, isTasks);
    var hasDescription = fields.indexOf('product.description') >= 0;

    for (var i=0; i<fields.length; i++) {
        var field = fields[i].split('.')[1]; // split to remove 'product.'

        if (invoice.is_delivery_note && skipFields.indexOf(fields[i]) >= 0) {
            continue;
        }

        var headerStyles = styles.concat([snakeToCamel(field), snakeToCamel(field) + 'TableHeader']);
        var value = invoiceLabels[field];

        if (field == 'custom_value1') {
            if (invoice.has_custom_item_value1) {
                value = NINJA.getCustomLabel(account.custom_fields.product1);
            } else {
                continue;
            }
        } else if (field == 'custom_value2') {
            if (invoice.has_custom_item_value2) {
                value = NINJA.getCustomLabel(account.custom_fields.product2);
            } else {
                continue;
            }
        } else if (field == 'tax' && ! invoice.has_item_taxes) {
            continue;
        } else if (field == 'discount' && ! invoice.has_item_discounts) {
            continue;
        } else if (field == 'unit_cost' || field == 'rate' || field == 'hours') {
            headerStyles.push('cost');
        }

        if (i == 0) {
            headerStyles.push('firstColumn');
        } else if (i == fields.length - 1) {
            headerStyles.push('lastColumn');
        }

        grid[0].push({text: value, style: headerStyles});
    }

    for (var i=0; i<invoice.invoice_items.length; i++) {
        var row = [];
        var item = invoice.invoice_items[i];
        var cost = NINJA.parseFloat(item.cost) ? formatMoneyInvoice(NINJA.parseFloat(item.cost), invoice, null, getPrecision(NINJA.parseFloat(item.cost))) : ' ';
        var qty = NINJA.parseFloat(item.qty) ? formatMoneyInvoice(NINJA.parseFloat(item.qty), invoice, 'none', getPrecision(NINJA.parseFloat(item.qty))) + '' : ' ';
        var discount = roundToTwo(NINJA.parseFloat(item.discount));
        var notes = item.notes;
        var productKey = item.product_key;
        var tax1 = '';
        var tax2 = '';
        var customValue1 = item.custom_value1;
        var customValue2 = item.custom_value2;

        if (isTasks) {
            if (item.invoice_item_type_id != 2) {
                continue;
            }
        } else {
            if (item.invoice_item_type_id == 2) {
                continue;
            }
        }

        if (parseFloat(item.tax_rate1) != 0) {
            tax1 = parseFloat(item.tax_rate1);
        }
        if (parseFloat(item.tax_rate2) != 0) {
            tax2 = parseFloat(item.tax_rate2);
        }

        // show at most one blank line
        if (shownItem && !notes && !productKey && !item.cost) {
            continue;
        }

        shownItem = true;

        // process date variables
        if (invoice.is_recurring) {
            notes = processVariables(notes);
            productKey = processVariables(productKey);
            customValue1 = processVariables(item.custom_value1);
            customValue2 = processVariables(item.custom_value2);
        }

        var lineTotal = roundSignificant(NINJA.parseFloat(item.cost) * NINJA.parseFloat(item.qty));

        if (discount != 0) {
            if (parseInt(invoice.is_amount_discount)) {
                lineTotal -= discount;
            } else {
                lineTotal -= (lineTotal * discount / 100);
            }
        }

        if (account.include_item_taxes_inline == '1') {
            var taxAmount1 = 0;
            var taxAmount2 = 0;
            if (tax1) {
                taxAmount1 = roundToTwo(lineTotal * tax1 / 100);
            }
            if (tax2) {
                taxAmount2 = roundToTwo(lineTotal * tax2 / 100);
            }
            lineTotal += taxAmount1 + taxAmount2;
        }

        if (lineTotal != 0) {
            lineTotal = formatMoneyInvoice(lineTotal, invoice);
        }
        rowStyle = (grid.length % 2 == 0) ? 'even' : 'odd';

        for (var j=0; j<fields.length; j++) {
            var field = fields[j].split('.')[1]; // split to remove 'product.'

            if (invoice.is_delivery_note && skipFields.indexOf(fields[j]) >= 0) {
                continue;
            }

            var value = item[field];
            var styles = [snakeToCamel(field), rowStyle];

            if (field == 'custom_value1' && ! invoice.has_custom_item_value1) {
                continue;
            } else if (field == 'custom_value2' && ! invoice.has_custom_item_value2) {
                continue;
            } else if (field == 'tax' && ! invoice.has_item_taxes) {
                continue;
            } else if (field == 'discount' && ! invoice.has_item_discounts) {
                continue;
            }

            if (field == 'item' || field == 'service') {
                value = productKey;
                styles.push('productKey');
            } else if (field == 'description') {
                value = notes;
            } else if (field == 'unit_cost' || field == 'rate') {
                value = cost;
                styles.push('cost');
            } else if (field == 'quantity' || field == 'hours') {
                value = qty;
                if (field == 'hours') {
                    styles.push('cost');
                }
            } else if (field == 'custom_value1') {
                value = customValue1;
            } else if (field == 'custom_value2') {
                value = customValue2;
            } else if (field == 'discount') {
                if (NINJA.parseFloat(discount)) {
                    if (parseInt(invoice.is_amount_discount)) {
                        value = formatMoneyInvoice(discount, invoice);
                    } else {
                        if (discount) {
                            value = discount + '%';
                        }
                    }
                } else {
                    value = '';
                }
            } else if (field == 'tax') {
                value = ' ';
                if (item.tax_name1) {
                    value += (tax1 || '0') + '%';
                }
                if (item.tax_name2) {
                    if (item.tax_name1) {
                        value += '  ';
                    }
                    value += (tax2 || '0') + '%';
                }
            } else if (field == 'line_total') {
                value = lineTotal;
            }

            if (j == 0) {
                styles.push('firstColumn');
            } else if (j == fields.length - 1) {
                styles.push('lastColumn');
            }

            row.push({text:value || ' ', style:styles});
        }

        grid.push(row);
    }

    //console.log(JSON.stringify(grid));
    return NINJA.prepareDataTable(grid, 'invoiceItems');
}

NINJA.invoiceDocuments = function(invoice) {
    if (invoice.account.invoice_embed_documents != '1') {
        return [];
    }

    var j = 0;
    var stack = [];
    var stackItem = null;

    if (invoice.documents) {
        for (var i = 0; i < invoice.documents.length; i++) {
            addDoc(invoice.documents[i]);
        }
    }

    if (invoice.expenses) {
        for (var i = 0; i < invoice.expenses.length; i++) {
            var expense = invoice.expenses[i];
            for (var j = 0; j < expense.documents.length; j++) {
                addDoc(expense.documents[j]);
            }
        }
    }

    function addDoc(document){
        var path = document.base64;

        if(!path)path = 'docs/'+document.public_id+'/'+document.name;
        if(path && (window.pdfMake.vfs[path] || document.base64)){
            // Only embed if we actually have an image for it
            if(j%3==0){
                stackItem = {columns:[]};
                stack.push(stackItem);
            }
            stackItem.columns.push({stack:[{image:path,style:'invoiceDocument',fit:[150,150]}], width:175})
            j++;
        }
    }

    return stack.length?{stack:stack}:[];
}

NINJA.subtotals = function(invoice, hideBalance)
{
    if (! invoice || invoice.is_delivery_note) {
        return [[]];
    }

    var account = invoice.account;
    var data = [];
    data.push([{text: invoiceLabels.subtotal, style: ['subtotalsLabel', 'subtotalLabel']}, {text: formatMoneyInvoice(invoice.subtotal_amount, invoice), style: ['subtotals', 'subtotal']}]);

    if (invoice.discount_amount != 0) {
        data.push([{text: invoiceLabels.discount , style: ['subtotalsLabel', 'discountLabel']}, {text: formatMoneyInvoice(invoice.discount_amount, invoice), style: ['subtotals', 'discount']}]);
    }

    var customValue1 = NINJA.parseFloat(invoice.custom_value1);
    var customValue1Label = account.custom_fields.invoice1 || invoiceLabels.surcharge;

    var customValue2 = NINJA.parseFloat(invoice.custom_value2);
    var customValue2Label = account.custom_fields.invoice2 || invoiceLabels.surcharge;

    if (customValue1 && invoice.custom_taxes1 == '1') {
        data.push([{text: customValue1Label, style: ['subtotalsLabel', 'customTax1Label']}, {text: formatMoneyInvoice(invoice.custom_value1, invoice), style: ['subtotals', 'customTax1']}]);
    }
    if (customValue2 && invoice.custom_taxes2 == '1') {
        data.push([{text: customValue2Label, style: ['subtotalsLabel', 'customTax2Label']}, {text: formatMoneyInvoice(invoice.custom_value2, invoice), style: ['subtotals', 'customTax2']}]);
    }

    for (var key in invoice.item_taxes) {
        if (invoice.item_taxes.hasOwnProperty(key)) {
            var taxRate = invoice.item_taxes[key];
            var taxStr = taxRate.name + ' ' + (taxRate.rate*1).toString() + '%';
            data.push([{text: taxStr, style: ['subtotalsLabel', 'taxLabel']}, {text: formatMoneyInvoice(taxRate.amount, invoice), style: ['subtotals', 'tax']}]);
        }
    }

    if (parseFloat(invoice.tax_rate1 || 0) != 0 || invoice.tax_name1) {
        var taxStr = invoice.tax_name1 + ' ' + (invoice.tax_rate1*1).toString() + '%';
        data.push([{text: taxStr, style: ['subtotalsLabel', 'tax1Label']}, {text: formatMoneyInvoice(invoice.tax_amount1, invoice), style: ['subtotals', 'tax1']}]);
    }
    if (parseFloat(invoice.tax_rate2 || 0) != 0 || invoice.tax_name2) {
        var taxStr = invoice.tax_name2 + ' ' + (invoice.tax_rate2*1).toString() + '%';
        data.push([{text: taxStr, style: ['subtotalsLabel', 'tax2Label']}, {text: formatMoneyInvoice(invoice.tax_amount2, invoice), style: ['subtotals', 'tax2']}]);
    }

    if (customValue1 && invoice.custom_taxes1 != '1') {
        data.push([{text: customValue1Label, style: ['subtotalsLabel', 'custom1Label']}, {text: formatMoneyInvoice(invoice.custom_value1, invoice), style: ['subtotals', 'custom1']}]);
    }
    if (customValue2 && invoice.custom_taxes2 != '1') {
        data.push([{text: customValue2Label, style: ['subtotalsLabel', 'custom2Label']}, {text: formatMoneyInvoice(invoice.custom_value2, invoice), style: ['subtotals', 'custom2']}]);
    }

    var paid = invoice.amount - invoice.balance;
    if (!invoice.is_quote && invoice.balance_amount >= 0 && (invoice.account.hide_paid_to_date != '1' || paid)) {
        data.push([{text:invoiceLabels.paid_to_date, style: ['subtotalsLabel', 'paidToDateLabel']}, {text:formatMoneyInvoice(paid, invoice), style: ['subtotals', 'paidToDate']}]);
    }

    var isPartial = NINJA.parseFloat(invoice.partial);

    if (!hideBalance || isPartial) {
        data.push([
            { text: invoice.is_quote || invoice.balance_amount < 0 ? invoiceLabels.total : invoiceLabels.balance_due, style: ['subtotalsLabel', isPartial ? '' : 'subtotalsBalanceDueLabel'] },
            { text: formatMoneyInvoice(invoice.total_amount, invoice), style: ['subtotals', isPartial ? '' : 'subtotalsBalanceDue'] }
        ]);
    }

    if (!hideBalance) {
        if (isPartial) {
            data.push([
                { text: invoiceLabels.partial_due, style: ['subtotalsLabel', 'subtotalsBalanceDueLabel'] },
                { text: formatMoneyInvoice(invoice.balance_amount, invoice), style: ['subtotals', 'subtotalsBalanceDue'] }
            ]);
        }
    }

    return NINJA.prepareDataPairs(data, 'subtotals');
}

NINJA.subtotalsBalance = function(invoice) {
    if (invoice.is_delivery_note) {
        return [[]];
    }

    var isPartial = NINJA.parseFloat(invoice.partial);
    return [[
        {text: isPartial ? invoiceLabels.partial_due : (invoice.is_quote || invoice.balance_amount < 0 ? invoiceLabels.total : invoiceLabels.balance_due), style:['subtotalsLabel', 'subtotalsBalanceDueLabel']},
        {text: formatMoneyInvoice(invoice.balance_amount, invoice), style:['subtotals', 'subtotalsBalanceDue']}
    ]];
}

NINJA.accountDetails = function(invoice) {
    var account = invoice.account;
    if (invoice.features.invoice_settings && account.invoice_fields) {
        var fields = JSON.parse(account.invoice_fields).account_fields1;
    } else {
        var fields = [
            'account.company_name',
            'account.id_number',
            'account.vat_number',
            'account.website',
            'account.email',
            'account.phone',
        ];
    }

    var data = [];

    for (var i=0; i < fields.length; i++) {
        var field = fields[i];
        var value = NINJA.renderField(invoice, field);
        if (value) {
            data.push(value);
        }
    }

    return NINJA.prepareDataList(data, 'accountDetails');
}

NINJA.accountAddress = function(invoice) {
    var account = invoice.account;
    if (invoice.features.invoice_settings && account.invoice_fields) {
        var fields = JSON.parse(account.invoice_fields).account_fields2;
    } else {
        var fields = [
            'account.address1',
            'account.address2',
            'account.city_state_postal',
            'account.country',
            'account.custom_value1',
            'account.custom_value2',
        ]
    }

    var data = [];

    for (var i=0; i < fields.length; i++) {
        var field = fields[i];
        var value = NINJA.renderField(invoice, field);
        if (value) {
            data.push(value);
        }
    }

    return NINJA.prepareDataList(data, 'accountAddress');
}

NINJA.invoiceDetails = function(invoice) {

    var account = invoice.account;
    if (invoice.features.invoice_settings && account.invoice_fields) {
        var fields = JSON.parse(account.invoice_fields).invoice_fields;
    } else {
        var fields = [
            'invoice.invoice_number',
            'invoice.po_number',
            'invoice.invoice_date',
            'invoice.due_date',
            'invoice.balance_due',
            'invoice.partial_due',
            'invoice.custom_text_value1',
            'invoice.custom_text_value2',
        ];
    }
    var data = [];

    for (var i=0; i < fields.length; i++) {
        var field = fields[i];
        var value = NINJA.renderField(invoice, field, true);
        if (value) {
            data.push(value);
        }
    }

    return NINJA.prepareDataPairs(data, 'invoiceDetails');
}


NINJA.renderField = function(invoice, field, twoColumn) {
    if (invoice.is_delivery_note) {
        var skipFields = [
            'invoice.due_date',
            'invoice.balance_due',
            'invoice.partial_due',
        ];
        if (skipFields.indexOf(field) >= 0) {
            return false;
        }
    }

    var client = invoice.client;
    if (!client) {
        return false;
    }
    var account = invoice.account;
    var contact = invoice.contact || client.contacts[0];
    var clientName = client.name || (contact.first_name || contact.last_name ? ((contact.first_name || '') + ' ' + (contact.last_name || '')) : contact.email);

    var label = false;
    var value = false;

    if (field == 'client.client_name') {
        value = clientName || ' ';
    } else if (field == 'client.contact_name') {
        value = (contact.first_name || contact.last_name) ? (contact.first_name || '') + ' ' + (contact.last_name || '') : false;
    } else if (field == 'client.id_number') {
        value = client.id_number;
        if (invoiceLabels.id_number_orig) {
            label = invoiceLabels.id_number;
        }
    } else if (field == 'client.vat_number') {
        value = client.vat_number;
        if (invoiceLabels.vat_number_orig) {
            label = invoiceLabels.vat_number;
        }
    } else if (field == 'client.address1') {
        if (invoice.is_delivery_note && client.shipping_address1) {
            value = client.shipping_address1;
        } else {
            value = client.address1;
        }
    } else if (field == 'client.address2') {
        if (invoice.is_delivery_note && client.shipping_address1) {
            value = client.shipping_address2;
        } else {
            value = client.address2;
        }
    } else if (field == 'client.city_state_postal') {
        var cityStatePostal = '';
        if (invoice.is_delivery_note && client.shipping_address1) {
            if (client.shipping_city || client.shipping_state || client.shipping_postal_code) {
                var swap = client.shipping_country && client.shipping_country.swap_postal_code;
                cityStatePostal = formatAddress(client.shipping_city, client.shipping_state, client.shipping_postal_code, swap);
            }
        } else {
            if (client.city || client.state || client.postal_code) {
                var swap = client.country && client.country.swap_postal_code;
                cityStatePostal = formatAddress(client.city, client.state, client.postal_code, swap);
            }
        }
        value = cityStatePostal;
    } else if (field == 'client.postal_city_state') {
        var postalCityState = '';
        if (invoice.is_delivery_note && client.shipping_address1) {
            if (client.shipping_city || client.shipping_state || client.shipping_postal_code) {
                postalCityState = formatAddress(client.shipping_city, client.shipping_state, client.shipping_postal_code, true);
            }
        } else {
            if (client.city || client.state || client.postal_code) {
                postalCityState = formatAddress(client.city, client.state, client.postal_code, true);
            }
        }
        value = postalCityState;
    } else if (field == 'client.country') {
        if (invoice.is_delivery_note && client.shipping_address1) {
            value = client.shipping_country ? client.shipping_country.name : '';
        } else {
            value = client.country ? client.country.name : '';
        }
    } else if (field == 'client.website') {
        value = client.website;
    } else if (field == 'client.email') {
        value = contact.email == clientName ? '' : contact.email;
    } else if (field == 'client.phone') {
        value = contact.phone;
    } else if (field == 'client.work_phone') {
        value = client.work_phone;
    } else if (field == 'client.custom_value1') {
        if (account.custom_fields.client1 && client.custom_value1) {
            label = NINJA.getCustomLabel(account.custom_fields.client1);
            value = client.custom_value1;
        }
    } else if (field == 'client.custom_value2') {
        if (account.custom_fields.client2 && client.custom_value2) {
            label = NINJA.getCustomLabel(account.custom_fields.client2);
            value = client.custom_value2;
        }
    } else if (field == 'contact.custom_value1') {
        if (account.custom_fields.contact1 && contact.custom_value1) {
            label = NINJA.getCustomLabel(account.custom_fields.contact1);
            value = contact.custom_value1;
        }
    } else if (field == 'contact.custom_value2') {
        if (account.custom_fields.contact2 && contact.custom_value2) {
            label = NINJA.getCustomLabel(account.custom_fields.contact2);
            value = contact.custom_value2;
        }
    } else if (field == 'account.company_name') {
        value = account.name + ' ';
    } else if (field == 'account.id_number') {
        value = account.id_number;
        if (invoiceLabels.id_number_orig) {
            label = invoiceLabels.id_number;
        }
    } else if (field == 'account.vat_number') {
        value = account.vat_number;
        if (invoiceLabels.vat_number_orig) {
            label = invoiceLabels.vat_number;
        }
    } else if (field == 'account.website') {
        value = account.website;
    } else if (field == 'account.email') {
        value = account.work_email;
    } else if (field == 'account.phone') {
        value = account.work_phone;
    } else if (field == 'account.address1') {
        value = account.address1;
    } else if (field == 'account.address2') {
        value = account.address2;
    } else if (field == 'account.city_state_postal') {
        var cityStatePostal = '';
        if (account.city || account.state || account.postal_code) {
            var swap = account.country && account.country.swap_postal_code;
            cityStatePostal = formatAddress(account.city, account.state, account.postal_code, swap);
        }
        value = cityStatePostal;
    } else if (field == 'account.postal_city_state') {
        var postalCityState = '';
        if (account.city || account.state || account.postal_code) {
            postalCityState = formatAddress(account.city, account.state, account.postal_code, true);
        }
        value = postalCityState;
    } else if (field == 'account.country') {
        value = account.country ? account.country.name : false;
    } else if (field == 'account.custom_value1') {
        if (invoice.account.custom_fields.account1 && invoice.account.custom_value1) {
            label = invoice.account.custom_fields.account1;
            value = invoice.account.custom_value1;
        }
    } else if (field == 'account.custom_value2') {
        if (invoice.account.custom_fields.account2 && invoice.account.custom_value2) {
            label = invoice.account.custom_fields.account2;
            value = invoice.account.custom_value2;
        }
    } else if (field == 'invoice.invoice_number') {
        if (! invoice.is_statement) {
            label = invoice.is_quote ? invoiceLabels.quote_number : invoice.balance_amount < 0 ? invoiceLabels.credit_number : invoiceLabels.invoice_number;
            value = invoice.invoice_number;
        }
    } else if (field == 'invoice.po_number') {
        value = invoice.po_number;
    } else if (field == 'invoice.invoice_date') {
        label = invoice.is_statement ? invoiceLabels.statement_date : invoice.is_quote ? invoiceLabels.quote_date : invoice.balance_amount < 0 ? invoiceLabels.credit_date : invoiceLabels.invoice_date;
        value = invoice.invoice_date;
    } else if (field == 'invoice.due_date') {
        label = invoice.is_quote ? invoiceLabels.valid_until : invoiceLabels.due_date;
        if (invoice.partial_due_date) {
            value = invoice.partial_due_date;
        } else {
            value = invoice.due_date;
        }
    } else if (field == 'invoice.custom_text_value1') {
        if (invoice.custom_text_value1 && account.custom_fields.invoice_text1) {
            label = NINJA.getCustomLabel(invoice.account.custom_fields.invoice_text1);
            value = invoice.is_recurring ? processVariables(invoice.custom_text_value1) : invoice.custom_text_value1;
        }
    } else if (field == 'invoice.custom_text_value2') {
        if (invoice.custom_text_value2 && account.custom_fields.invoice_text2) {
            label = NINJA.getCustomLabel(invoice.account.custom_fields.invoice_text2);
            value = invoice.is_recurring ? processVariables(invoice.custom_text_value2) : invoice.custom_text_value2;
        }
    } else if (field == 'invoice.balance_due') {
        label = invoice.is_quote || invoice.balance_amount < 0 ? invoiceLabels.total : invoiceLabels.balance_due;
        value = formatMoneyInvoice(invoice.total_amount, invoice);
    } else if (field == 'invoice.partial_due') {
        if (NINJA.parseFloat(invoice.partial)) {
            label = invoiceLabels.partial_due;
            value = formatMoneyInvoice(invoice.balance_amount, invoice);
        }
    } else if (field == 'invoice.invoice_total') {
        if (invoice.is_statement || invoice.is_quote || invoice.balance_amount < 0) {
            // hide field
        } else {
            value = formatMoneyInvoice(invoice.amount, invoice);
        }
    } else if (field == 'invoice.outstanding') {
        if (invoice.is_statement || invoice.is_quote) {
            // hide field
        } else {
            value = formatMoneyInvoice(client.balance, invoice);
        }
    } else if (field == '.blank') {
        value = ' ';
    }

    if (value) {
        var shortField = false;
        var parts = field.split('.');
        if (parts.length >= 2) {
            var shortField = parts[1];
        }
        var style = snakeToCamel(shortField == 'company_name' ? 'account_name' : shortField); // backwards compatibility
        if (twoColumn) {
            // try to automatically determine the label
            if (! label && label != 'Blank') {
                if (invoiceLabels[shortField]) {
                    label = invoiceLabels[shortField];
                }
            }
            return [{text: label, style: [style + 'Label']}, {text: value, style: [style]}];
        } else {
            // if the label is set prepend it to the value
            if (label) {
                value = label + ': ' + value;
            }
            return {text:value, style: [style]};
        }
    } else {
        return false;
    }
}

NINJA.clientDetails = function(invoice) {
    var account = invoice.account;
    if (invoice.features.invoice_settings && account.invoice_fields) {
        var fields = JSON.parse(account.invoice_fields).client_fields;
    } else {
        var fields = [
            'client.client_name',
            'client.id_number',
            'client.vat_number',
            'client.address1',
            'client.address2',
            'client.city_state_postal',
            'client.country',
            'client.email',
            'client.custom_value1',
            'client.custom_value2',
            'contact.custom_value1',
            'contact.custom_value2',
        ];
    }
    var data = [];

    for (var i=0; i < fields.length; i++) {
        var field = fields[i];
        var value = NINJA.renderField(invoice, field);
        if (value) {
            data.push(value);
        }
    }

    return NINJA.prepareDataList(data, 'clientDetails');
}

NINJA.getPrimaryColor = function(defaultColor) {
    return NINJA.primaryColor ? NINJA.primaryColor : defaultColor;
}

NINJA.getSecondaryColor = function(defaultColor) {
    return NINJA.primaryColor ? NINJA.secondaryColor : defaultColor;
}

// remove blanks and add section style to all elements
NINJA.prepareDataList = function(oldData, section) {
    var newData = [];
    if (! oldData.length) {
        oldData.push({text:' '});
    }
    for (var i=0; i<oldData.length; i++) {
        var item = NINJA.processItem(oldData[i], section);
        if (item.text || item.stack) {
            newData.push(item);
        }
    }
    return newData;
}

NINJA.prepareDataTable = function(oldData, section) {
    var newData = [];
    for (var i=0; i<oldData.length; i++) {
        var row = oldData[i];
        var newRow = [];
        for (var j=0; j<row.length; j++) {
            var item = NINJA.processItem(row[j], section);
            if (item.text || item.stack) {
                newRow.push(item);
            }
        }
        if (newRow.length) {
            newData.push(newRow);
        }
    }
    return newData;
}

NINJA.prepareDataPairs = function(oldData, section) {
    var newData = [];
    if (! oldData.length) {
        oldData.push([{text:' '}, {text:' '}]);
    }
    for (var i=0; i<oldData.length; i++) {
        var row = oldData[i];
        var isBlank = false;
        for (var j=0; j<row.length; j++) {
            var item = NINJA.processItem(row[j], section);
            if (!item.text) {
                isBlank = true;
            }
            if (j == 1) {
                NINJA.processItem(row[j], section + "Value");
            }
        }
        if (!isBlank) {
            newData.push(oldData[i]);
        }
    }
    return newData;
}

NINJA.processItem = function(item, section) {
    if (! item.style) {
        item.style = [];
    }

    item.style.push(section);

    // make sure numbers aren't wrapped
    if (item.text && item.length && item.length < 20 && item.text.match && item.text.match(/\d[.,]\d\d($| [A-Z]{3}$)/)) {
        item.style.push('noWrap');
    }

    return item;
}


NINJA.parseMarkdownText = function(val, groupText)
{
    var rules = [
        ['\\\*\\\*(\\\w.+?)\\\*\\\*', {'bold': true}], // **value**
        ['\\\*(\\\w.+?)\\\*', {'italics': true}], // *value*
        ['^###(.*)', {'style': 'help'}], // ### Small/gray help
        ['^##(.*)', {'style': 'subheader'}], // ## Header
        ['^#(.*)', {'style': 'fullheader'}] // # Subheader
    ];

    var parts = typeof val === 'string' ? [val] : val;
    for (var i=0; i<rules.length; i++) {
        var rule = rules[i];
        var formatter = function(data) {
            return $.extend(data, rule[1]);
        }
        parts = NINJA.parseRegExp(parts, rule[0], formatter, true);
    }

    return parts.length > 1 ? parts : val;
}

/*
NINJA.parseMarkdownStack = function(val)
{
    if (val.length == 1) {
        var item = val[0];
        var line = item.hasOwnProperty('text') ? item.text : item;

        if (typeof line === 'string') {
            line = [line];
        }

        var regExp = '^\\\* (.*[\r\n|\n|\r]?)';
        var formatter = function(data) {
            return {"ul": [data.text]};
        }

        val = NINJA.parseRegExp(line, regExp, formatter, false);
    }

    return val;
}
*/

NINJA.parseRegExp = function(val, regExpStr, formatter, groupText)
{
    var regExp = new RegExp(regExpStr, 'gm');
    var parts = [];

    for (var i=0; i<val.length; i++) {
        var line = val[i];
        parts = parts.concat(NINJA.parseRegExpLine(line, regExp, formatter, groupText));
    }

    return parts.length > 1 ? parts : val;
}

NINJA.parseRegExpLine = function(line, regExp, formatter, groupText)
{
    var parts = [];
    var lastIndex = -1;

    while (match = regExp.exec(line)) {
        if (match.index > lastIndex) {
            parts.push(line.substring(lastIndex, match.index));
        }
        var data = {};
        data.text = match[1];
        data = formatter(data);
        parts.push(data);
        lastIndex = match.index + match[0].length;
    }

    if (parts.length) {
        if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
        }
        return parts;
    }

    return line;
}

NINJA.getCustomLabel = function(value) {
    if (value && value.indexOf('|') > 0) {
        return value.split('|')[0];
    } else {
        return value;
    }
}

//# sourceMappingURL=built.js.map
