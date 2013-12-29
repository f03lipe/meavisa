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

	$.fn.share = function (options) {

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
		var options = _.extend(_.extend(defOptions, this.data()), options);

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
	}
});

/*! perfect-scrollbar - v0.4.6
* http://noraesae.github.com/perfect-scrollbar/
* Copyright (c) 2013 HyeonJe Jun; Licensed MIT */
// "use strict";(function(e){"function"==typeof define&&define.amd?define(["jquery"],e):e(jQuery)})(function(e){var r={wheelSpeed:10,wheelPropagation:!1,minScrollbarLength:null,useBothWheelAxes:!1,useKeyboard:!0,suppressScrollX:!1,suppressScrollY:!1,scrollXMarginOffset:0,scrollYMarginOffset:0};e.fn.perfectScrollbar=function(o,l){return this.each(function(){var t=e.extend(!0,{},r),s=e(this);if("object"==typeof o?e.extend(!0,t,o):l=o,"update"===l)return s.data("perfect-scrollbar-update")&&s.data("perfect-scrollbar-update")(),s;if("destroy"===l)return s.data("perfect-scrollbar-destroy")&&s.data("perfect-scrollbar-destroy")(),s;if(s.data("perfect-scrollbar"))return s.data("perfect-scrollbar");s.addClass("ps-container");var n,c,a,i,p,f,u,d,b,h,v=e("<div class='ps-scrollbar-x-rail'></div>").appendTo(s),g=e("<div class='ps-scrollbar-y-rail'></div>").appendTo(s),m=e("<div class='ps-scrollbar-x'></div>").appendTo(v),w=e("<div class='ps-scrollbar-y'></div>").appendTo(g),T=parseInt(v.css("bottom"),10),L=parseInt(g.css("right"),10),y=function(){var e=parseInt(h*(f-i)/(i-b),10);s.scrollTop(e),v.css({bottom:T-e})},S=function(){var e=parseInt(d*(p-a)/(a-u),10);s.scrollLeft(e),g.css({right:L-e})},I=function(e){return t.minScrollbarLength&&(e=Math.max(e,t.minScrollbarLength)),e},C=function(){v.css({left:s.scrollLeft(),bottom:T-s.scrollTop(),width:a,display:t.suppressScrollX?"none":"inherit"}),g.css({top:s.scrollTop(),right:L-s.scrollLeft(),height:i,display:t.suppressScrollY?"none":"inherit"}),m.css({left:d,width:u}),w.css({top:h,height:b})},X=function(){a=s.width(),i=s.height(),p=s.prop("scrollWidth"),f=s.prop("scrollHeight"),!t.suppressScrollX&&p>a+t.scrollXMarginOffset?(n=!0,u=I(parseInt(a*a/p,10)),d=parseInt(s.scrollLeft()*(a-u)/(p-a),10)):(n=!1,u=0,d=0,s.scrollLeft(0)),!t.suppressScrollY&&f>i+t.scrollYMarginOffset?(c=!0,b=I(parseInt(i*i/f,10)),h=parseInt(s.scrollTop()*(i-b)/(f-i),10)):(c=!1,b=0,h=0,s.scrollTop(0)),h>=i-b&&(h=i-b),d>=a-u&&(d=a-u),C()},Y=function(e,r){var o=e+r,l=a-u;d=0>o?0:o>l?l:o,v.css({left:s.scrollLeft()}),m.css({left:d})},x=function(e,r){var o=e+r,l=i-b;h=0>o?0:o>l?l:o,g.css({top:s.scrollTop()}),w.css({top:h})},D=function(){var r,o;m.bind("mousedown.perfect-scrollbar",function(e){o=e.pageX,r=m.position().left,v.addClass("in-scrolling"),e.stopPropagation(),e.preventDefault()}),e(document).bind("mousemove.perfect-scrollbar",function(e){v.hasClass("in-scrolling")&&(S(),Y(r,e.pageX-o),e.stopPropagation(),e.preventDefault())}),e(document).bind("mouseup.perfect-scrollbar",function(){v.hasClass("in-scrolling")&&v.removeClass("in-scrolling")}),r=o=null},P=function(){var r,o;w.bind("mousedown.perfect-scrollbar",function(e){o=e.pageY,r=w.position().top,g.addClass("in-scrolling"),e.stopPropagation(),e.preventDefault()}),e(document).bind("mousemove.perfect-scrollbar",function(e){g.hasClass("in-scrolling")&&(y(),x(r,e.pageY-o),e.stopPropagation(),e.preventDefault())}),e(document).bind("mouseup.perfect-scrollbar",function(){g.hasClass("in-scrolling")&&g.removeClass("in-scrolling")}),r=o=null},k=function(){var e=function(e,r){var o=s.scrollTop();if(0===o&&r>0&&0===e)return!t.wheelPropagation;if(o>=f-i&&0>r&&0===e)return!t.wheelPropagation;var l=s.scrollLeft();return 0===l&&0>e&&0===r?!t.wheelPropagation:l>=p-a&&e>0&&0===r?!t.wheelPropagation:!0},r=!1;s.bind("mousewheel.perfect-scrollbar",function(o,l,a,i){t.useBothWheelAxes?c&&!n?i?s.scrollTop(s.scrollTop()-i*t.wheelSpeed):s.scrollTop(s.scrollTop()+a*t.wheelSpeed):n&&!c&&(a?s.scrollLeft(s.scrollLeft()+a*t.wheelSpeed):s.scrollLeft(s.scrollLeft()-i*t.wheelSpeed)):(s.scrollTop(s.scrollTop()-i*t.wheelSpeed),s.scrollLeft(s.scrollLeft()+a*t.wheelSpeed)),X(),r=e(a,i),r&&o.preventDefault()}),s.bind("MozMousePixelScroll.perfect-scrollbar",function(e){r&&e.preventDefault()})},M=function(){var r=function(e,r){var o=s.scrollTop();if(0===o&&r>0&&0===e)return!1;if(o>=f-i&&0>r&&0===e)return!1;var l=s.scrollLeft();return 0===l&&0>e&&0===r?!1:l>=p-a&&e>0&&0===r?!1:!0},o=!1;s.bind("mouseenter.perfect-scrollbar",function(){o=!0}),s.bind("mouseleave.perfect-scrollbar",function(){o=!1});var l=!1;e(document).bind("keydown.perfect-scrollbar",function(e){if(o){var n=0,c=0;switch(e.which){case 37:n=-3;break;case 38:c=3;break;case 39:n=3;break;case 40:c=-3;break;default:return}s.scrollTop(s.scrollTop()-c*t.wheelSpeed),s.scrollLeft(s.scrollLeft()+n*t.wheelSpeed),X(),l=r(n,c),l&&e.preventDefault()}})},O=function(){var e=function(e){e.stopPropagation()};w.bind("click.perfect-scrollbar",e),g.bind("click.perfect-scrollbar",function(e){var r=parseInt(b/2,10),o=e.pageY-g.offset().top-r,l=i-b,t=o/l;0>t?t=0:t>1&&(t=1),s.scrollTop((f-i)*t),X()}),m.bind("click.perfect-scrollbar",e),v.bind("click.perfect-scrollbar",function(e){var r=parseInt(u/2,10),o=e.pageX-v.offset().left-r,l=a-u,t=o/l;0>t?t=0:t>1&&(t=1),s.scrollLeft((p-a)*t),X()})},j=function(){var r=function(e,r){s.scrollTop(s.scrollTop()-r),s.scrollLeft(s.scrollLeft()-e),X()},o={},l=0,t={},n=null,c=!1;e(window).bind("touchstart.perfect-scrollbar",function(){c=!0}),e(window).bind("touchend.perfect-scrollbar",function(){c=!1}),s.bind("touchstart.perfect-scrollbar",function(e){var r=e.originalEvent.targetTouches[0];o.pageX=r.pageX,o.pageY=r.pageY,l=(new Date).getTime(),null!==n&&clearInterval(n),e.stopPropagation()}),s.bind("touchmove.perfect-scrollbar",function(e){if(!c&&1===e.originalEvent.targetTouches.length){var s=e.originalEvent.targetTouches[0],n={};n.pageX=s.pageX,n.pageY=s.pageY;var a=n.pageX-o.pageX,i=n.pageY-o.pageY;r(a,i),o=n;var p=(new Date).getTime();t.x=a/(p-l),t.y=i/(p-l),l=p,e.preventDefault()}}),s.bind("touchend.perfect-scrollbar",function(){clearInterval(n),n=setInterval(function(){return.01>Math.abs(t.x)&&.01>Math.abs(t.y)?(clearInterval(n),void 0):(r(30*t.x,30*t.y),t.x*=.8,t.y*=.8,void 0)},10)})},A=function(){s.unbind(".perfect-scrollbar"),e(window).unbind(".perfect-scrollbar"),e(document).unbind(".perfect-scrollbar"),s.data("perfect-scrollbar",null),s.data("perfect-scrollbar-update",null),s.data("perfect-scrollbar-destroy",null),m.remove(),w.remove(),v.remove(),g.remove(),m=w=a=i=p=f=u=d=T=b=h=L=null},E=function(r){s.addClass("ie").addClass("ie"+r);var o=function(){var r=function(){e(this).addClass("hover")},o=function(){e(this).removeClass("hover")};s.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),v.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),g.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),m.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o),w.bind("mouseenter.perfect-scrollbar",r).bind("mouseleave.perfect-scrollbar",o)},l=function(){C=function(){m.css({left:d+s.scrollLeft(),bottom:T,width:u}),w.css({top:h+s.scrollTop(),right:L,height:b}),m.hide().show(),w.hide().show()},y=function(){var e=parseInt(h*f/i,10);s.scrollTop(e),m.css({bottom:T}),m.hide().show()},S=function(){var e=parseInt(d*p/a,10);s.scrollLeft(e),w.hide().show()}};6===r&&(o(),l())},W="ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch,B=function(){var e=navigator.userAgent.toLowerCase().match(/(msie) ([\w.]+)/);e&&"msie"===e[1]&&E(parseInt(e[2],10)),X(),D(),P(),O(),W&&j(),s.mousewheel&&k(),t.useKeyboard&&M(),s.data("perfect-scrollbar",s),s.data("perfect-scrollbar-update",X),s.data("perfect-scrollbar-destroy",A)};return B(),s})}});