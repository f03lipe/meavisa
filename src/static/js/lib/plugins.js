// Avoid `console` errors in browsers that lack a console.
(function() {
	var method;
	var noop = function () {};
	var methods = [
		'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
		'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
		'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
		'timeStamp', 'trace', 'warn'
	];
	var length = methods.length;
	var console = (window.console = window.console || {});

	while (length--) {
		method = methods[length];

		// Only stub undefined methods.
		if (!console[method]) {
			console[method] = noop;
		}
	}
}());

// Place any jQuery/helper plugins in here.
require(['jquery'], function ($) {

	$.fn.sshare = function (options) {

		// Prevent binding multiple times.
		if (this.find('.sn-share-btns').length)
			return;

		var defOptions = {
			trigger: 'hover',
			duration: 'fast',
			text: undefined,
			url: 'http://vempraruavem.org',
		};
		// Get options from default < element datset < arguments.
		var options = $.extend($.extend(defOptions, this.data()), options);

		var funcs = {
			twitter: function (e) {
				if (options.text || options.url)
					var url = 'http://twitter.com/share?'+(options.text && '&text='+encodeURIComponent(options.text))||('url='+encodeURIComponent(options.url));
				else throw "No url or text specified";
				window.open(url,'','width=500,height=350,toolbar=0,menubar=0,location=0','modal=yes');
			},
			facebook: function (e) {
				if (options.url)
					var url = 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(options.url);
				else throw "No url or text specified";
				window.open(url,'','width=500,height=350,toolbar=0,menubar=0,location=0','modal=yes');
			},
			gplus: function (e) {
				if (options.url)
					var url = 'https://plusone.google.com/_/+1/confirm?hl=pt&url='+encodeURIComponent(options.url);
				else throw "No url or text specified";
				window.open(url,'','width=500,height=350,toolbar=0,menubar=0,location=0','modal=yes');
			},
		};

		this.addClass('sn-share');
		var html = $('<div class="sn-share-btns"><div class="btn-group"><button class="btn btn-xs btn-info btn-twitter"><i class="fa fa-twitter"></i></button><button class="btn btn-xs btn-info btn-facebook">&nbsp;<i class="fa fa-facebook"></i>&nbsp;</button><button class="btn btn-xs btn-info btn-gplus"><i class="fa fa-google-plus"></i></button></div><div class="arrow"></div></div>');

		html.find('.btn-twitter').click(funcs.twitter);
		html.find('.btn-facebook').click(funcs.facebook);
		html.find('.btn-gplus').click(funcs.gplus);
		html.appendTo(this);

		this.click(function(evt){
			evt.stopPropagation();
			evt.preventDefault();
			return false;
		})

		if (options.now === true) {
			html.fadeIn();
			this.on('click '+(options.trigger === 'hover'?'mouseenter':''), function (e) {
				html.fadeIn(options.duration);
			});
		} else {
			this.on('click '+(options.trigger === 'hover'?'mouseenter':''), function (e) {
				html.fadeIn(options.duration);
			});
		}
		this.on('mouseleave', function (e) {
			html.fadeOut(options.duration);
		});
	};

	/*! perfect-scrollbar - v0.4.6
	* http://noraesae.github.com/perfect-scrollbar/
	* Copyright (c) 2013 HyeonJe Jun; Licensed MIT */
	// (function(e){"function"==typeof require&&require.amd?require(["jquery"],e):e(jQuery)})
	(function(e){e(jQuery)})
	(function(e){
		var r={wheelSpeed:10,wheelPropagation:!1,minScrollbarLength:null,useBothWheelAxes:!1,useKeyboard:!0,suppressScrollX:!1,suppressScrollY:!1,scrollXMarginOffset:0,scrollYMarginOffset:0};
		e.fn.perfectScrollbar=function(o,t){return this.each(function(){var l=e.extend(!0,{},r),n=e(this);if("object"==typeof o?e.extend(!0,l,o):t=o,"update"===t)return n.data("perfect-scrollbar-update")&&n.data("perfect-scrollbar-update")(),n;if("destroy"===t)return n.data("perfect-scrollbar-destroy")&&n.data("perfect-scrollbar-destroy")(),n;if(n.data("perfect-scrollbar"))return n.data("perfect-scrollbar");n.addClass("ps-container");var s,c,a,i,p,f,u,d,b,h,v=e("<div class='ps-scrollbar-x-rail'></div>").appendTo(n),g=e("<div class='ps-scrollbar-y-rail'></div>").appendTo(n),m=e("<div class='ps-scrollbar-x'></div>").appendTo(v),w=e("<div class='ps-scrollbar-y'></div>").appendTo(g),T=parseInt(v.css("bottom"),10),L=parseInt(g.css("right"),10),y=function(){var e=parseInt(h*(f-i)/(i-b),10);n.scrollTop(e),v.css({bottom:T-e})},S=function(){var e=parseInt(d*(p-a)/(a-u),10);n.scrollLeft(e),g.css({right:L-e})},I=function(e){return l.minScrollbarLength&&(e=Math.max(e,l.minScrollbarLength)),e},X=function(){v.css({left:n.scrollLeft(),bottom:T-n.scrollTop(),width:a,display:l.suppressScrollX?"none":"inherit"}),g.css({top:n.scrollTop(),right:L-n.scrollLeft(),height:i,display:l.suppressScrollY?"none":"inherit"}),m.css({left:d,width:u}),w.css({top:h,height:b})},D=function(){a=n.width(),i=n.height(),p=n.prop("scrollWidth"),f=n.prop("scrollHeight"),!l.suppressScrollX&&p>a+l.scrollXMarginOffset?(s=!0,u=I(parseInt(a*a/p,10)),d=parseInt(n.scrollLeft()*(a-u)/(p-a),10)):(s=!1,u=0,d=0,n.scrollLeft(0)),!l.suppressScrollY&&f>i+l.scrollYMarginOffset?(c=!0,b=I(parseInt(i*i/f,10)),h=parseInt(n.scrollTop()*(i-b)/(f-i),10)):(c=!1,b=0,h=0,n.scrollTop(0)),h>=i-b&&(h=i-b),d>=a-u&&(d=a-u),X()},Y=function(e,r){var o=e+r,t=a-u;d=0>o?0:o>t?t:o,v.css({left:n.scrollLeft()}),m.css({left:d})},x=function(e,r){var o=e+r,t=i-b;h=0>o?0:o>t?t:o,g.css({top:n.scrollTop()}),w.css({top:h})},C=function(){var r,o;m.bind("mousedown.perfect-scrollbar",function(e){o=e.pageX,r=m.position().left,v.addClass("in-scrolling"),e.stopPropagation(),e.preventDefault()}),e(document).bind("mousemove.perfect-scrollbar",function(e){v.hasClass("in-scrolling")&&(S(),Y(r,e.pageX-o),e.stopPropagation(),e.preventDefault())}),e(document).bind("mouseup.perfect-scrollbar",function(){v.hasClass("in-scrolling")&&v.removeClass("in-scrolling")}),r=o=null},P=function(){var r,o;w.bind("mousedown.perfect-scrollbar",function(e){o=e.pageY,r=w.position().top,g.addClass("in-scrolling"),e.stopPropagation(),e.preventDefault()}),e(document).bind("mousemove.perfect-scrollbar",function(e){g.hasClass("in-scrolling")&&(y(),x(r,e.pageY-o),e.stopPropagation(),e.preventDefault())}),e(document).bind("mouseup.perfect-scrollbar",function(){g.hasClass("in-scrolling")&&g.removeClass("in-scrolling")}),r=o=null},k=function(){var e=function(e,r){var o=n.scrollTop();if(0===o&&r>0&&0===e)return!l.wheelPropagation;if(o>=f-i&&0>r&&0===e)return!l.wheelPropagation;var t=n.scrollLeft();return 0===t&&0>e&&0===r?!l.wheelPropagation:t>=p-a&&e>0&&0===r?!l.wheelPropagation:!0},r=!1;n.bind("mousewheel.perfect-scrollbar",function(o,t,a,i){l.useBothWheelAxes?c&&!s?i?n.scrollTop(n.scrollTop()-i*l.wheelSpeed):n.scrollTop(n.scrollTop()+a*l.wheelSpeed):s&&!c&&(a?n.scrollLeft(n.scrollLeft()+a*l.wheelSpeed):n.scrollLeft(n.scrollLeft()-i*l.wheelSpeed)):(n.scrollTop(n.scrollTop()-i*l.wheelSpeed),n.scrollLeft(n.scrollLeft()+a*l.wheelSpeed)),D(),r=e(a,i),r&&o.preventDefault()}),n.bind("MozMousePixelScroll.perfect-scrollbar",function(e){r&&e.preventDefault()})},M=function(){var r=function(e,r){var o=n.scrollTop();if(0===o&&r>0&&0===e)return!1;if(o>=f-i&&0>r&&0===e)return!1;var t=n.scrollLeft();return 0===t&&0>e&&0===r?!1:t>=p-a&&e>0&&0===r?!1:!0},o=!1;n.bind("mouseenter.perfect-scrollbar",function(){o=!0}),n.bind("mouseleave.perfect-scrollbar",function(){o=!1});var t=!1;e(document).bind("keydown.perfect-scrollbar",function(e){if(o){var s=0,c=0;switch(e.which){case 37:s=-3;break;case 38:c=3;break;case 39:s=3;break;case 40:c=-3;break;default:return}n.scrollTop(n.scrollTop()-c*l.wheelSpeed),n.scrollLeft(n.scrollLeft()+s*l.wheelSpeed),D(),t=r(s,c),t&&e.preventDefault()}})},O=function(){var e=function(e){e.stopPropagation()};w.bind("click.perfect-scrollbar",e),g.bind("click.perfect-scrollbar",function(e){var r=parseInt(b/2,10),o=e.pageY-g.offset().top-r,t=i-b,l=o/t;0>l?l=0:l>1&&(l=1),n.scrollTop((f-i)*l),D()}),m.bind("click.perfect-scrollbar",e),v.bind("click.perfect-scrollbar",function(e){var r=parseInt(u/2,10),o=e.pageX-v.offset().left-r,t=a-u,l=o/t;0>l?l=0:l>1&&(l=1),n.scrollLeft((p-a)*l),D()})},E=function(){var r=function(e,r){n.scrollTop(n.scrollTop()-r),n.scrollLeft(n.scrollLeft()-e),D()},o={},t=0,l={},s=null,c=!1;e(window).bind("touchstart.perfect-scrollbar",function(){c=!0}),e(window).bind("touchend.perfect-scrollbar",function(){c=!1}),n.bind("touchstart.perfect-scrollbar",function(e){var r=e.originalEvent.targetTouches[0];o.pageX=r.pageX,o.pageY=r.pageY,t=(new Date).getTime(),null!==s&&clearInterval(s),e.stopPropagation()}),n.bind("touchmove.perfect-scrollbar",function(e){if(!c&&1===e.originalEvent.targetTouches.length){var n=e.originalEvent.targetTouches[0],s={};s.pageX=n.pageX,s.pageY=n.pageY;var a=s.pageX-o.pageX,i=s.pageY-o.pageY;r(a,i),o=s;var p=(new Date).getTime();l.x=a/(p-t),l.y=i/(p-t),t=p,e.preventDefault()}}),n.bind("touchend.perfect-scrollbar",function(){clearInterval(s),s=setInterval(function(){return.01>Math.abs(l.x)&&.01>Math.abs(l.y)?(clearInterval(s),void 0):(r(30*l.x,30*l.y),l.x*=.8,l.y*=.8,void 0)},10)})},A=function(){n.unbind(".perfect-scrollbar"),e(window).unbind(".perfect-scrollbar"),e(document).unbind(".perfect-scrollbar"),n.data("perfect-scrollbar",null),n.data("perfect-scrollbar-update",null),n.data("perfect-scrollbar-destroy",null),m.remove(),w.remove(),v.remove(),g.remove(),m=w=a=i=p=f=u=d=T=b=h=L=null},j=function(r){n.addClass("ie").addClass("ie"+r);var o=function(){var r=function(){e(this).addClass("hover")},o=function(){e(this).removeClass("hover")};n.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),v.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),g.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),m.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),w.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o)},t=function(){X=function(){m.css({left:d+n.scrollLeft(),bottom:T,width:u}),w.css({top:h+n.scrollTop(),right:L,height:b}),m.hide().show(),w.hide().show()},y=function(){var e=parseInt(h*f/i,10);n.scrollTop(e),m.css({bottom:T}),m.hide().show()},S=function(){var e=parseInt(d*p/a,10);n.scrollLeft(e),w.hide().show()}};6===r&&(o(),t())},W="ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch,H=function(){var e=navigator.userAgent.toLowerCase().match(/(msie) ([\w.]+)/);e&&"msie"===e[1]&&j(parseInt(e[2],10)),D(),C(),P(),O(),W&&E(),n.mousewheel&&k(),l.useKeyboard&&M(),n.data("perfect-scrollbar",n),n.data("perfect-scrollbar-update",D),n.data("perfect-scrollbar-destroy",A)};return H(),n})
		}
	}),(function(e){function r(r){var o=r||window.event,t=[].slice.call(arguments,1),l=0,n=0,s=0;return r=e.event.fix(o),r.type="mousewheel",o.wheelDelta&&(l=o.wheelDelta/120),o.detail&&(l=-o.detail/3),s=l,void 0!==o.axis&&o.axis===o.HORIZONTAL_AXIS&&(s=0,n=-1*l),void 0!==o.wheelDeltaY&&(s=o.wheelDeltaY/120),void 0!==o.wheelDeltaX&&(n=-1*o.wheelDeltaX/120),t.unshift(r,l,n,s),(e.event.dispatch||e.event.handle).apply(this,t)}var o=["DOMMouseScroll","mousewheel"];if(e.event.fixHooks)for(var t=o.length;t;)e.event.fixHooks[o[--t]]=e.event.mouseHooks;e.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var e=o.length;e;)this.addEventListener(o[--e],r,!1);else this.onmousewheel=r},teardown:function(){if(this.removeEventListener)for(var e=o.length;e;)this.removeEventListener(o[--e],r,!1);else this.onmousewheel=null}},e.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}})})
	(jQuery);
});
