'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

	"use strict";

	var FOUNDATION_VERSION = '6.2.2';

	// Global Foundation object
	// This is attached to the window, or used as a module for AMD/Browserify
	var Foundation = {
		version: FOUNDATION_VERSION,

		/**
   * Stores initialized plugins.
   */
		_plugins: {},

		/**
   * Stores generated unique ids for plugin instances
   */
		_uuids: [],

		/**
   * Returns a boolean for RTL support
   */
		rtl: function rtl() {
			return $('html').attr('dir') === 'rtl';
		},
		/**
   * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
   * @param {Object} plugin - The constructor of the plugin.
   */
		plugin: function plugin(_plugin, name) {
			// Object key to use when adding to global Foundation object
			// Examples: Foundation.Reveal, Foundation.OffCanvas
			var className = name || functionName(_plugin);
			// Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
			// Examples: data-reveal, data-off-canvas
			var attrName = hyphenate(className);

			// Add to the Foundation object and the plugins list (for reflowing)
			this._plugins[attrName] = this[className] = _plugin;
		},
		/**
   * @function
   * Populates the _uuids array with pointers to each individual plugin instance.
   * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
   * Also fires the initialization event for each plugin, consolidating repetitive code.
   * @param {Object} plugin - an instance of a plugin, usually `this` in context.
   * @param {String} name - the name of the plugin, passed as a camelCased string.
   * @fires Plugin#init
   */
		registerPlugin: function registerPlugin(plugin, name) {
			var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
			plugin.uuid = this.GetYoDigits(6, pluginName);

			if (!plugin.$element.attr('data-' + pluginName)) {
				plugin.$element.attr('data-' + pluginName, plugin.uuid);
			}
			if (!plugin.$element.data('zfPlugin')) {
				plugin.$element.data('zfPlugin', plugin);
			}
			/**
    * Fires when the plugin has initialized.
    * @event Plugin#init
    */
			plugin.$element.trigger('init.zf.' + pluginName);

			this._uuids.push(plugin.uuid);

			return;
		},
		/**
   * @function
   * Removes the plugins uuid from the _uuids array.
   * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
   * Also fires the destroyed event for the plugin, consolidating repetitive code.
   * @param {Object} plugin - an instance of a plugin, usually `this` in context.
   * @fires Plugin#destroyed
   */
		unregisterPlugin: function unregisterPlugin(plugin) {
			var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

			this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
			plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
			/**
    * Fires when the plugin has been destroyed.
    * @event Plugin#destroyed
    */
			.trigger('destroyed.zf.' + pluginName);
			for (var prop in plugin) {
				plugin[prop] = null; //clean up script to prep for garbage collection.
			}
			return;
		},

		/**
   * @function
   * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
   * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
   * @default If no argument is passed, reflow all currently active plugins.
   */
		reInit: function reInit(plugins) {
			var isJQ = plugins instanceof $;
			try {
				if (isJQ) {
					plugins.each(function () {
						$(this).data('zfPlugin')._init();
					});
				} else {
					var type = typeof plugins === 'undefined' ? 'undefined' : _typeof(plugins),
					    _this = this,
					    fns = {
						'object': function object(plgs) {
							plgs.forEach(function (p) {
								p = hyphenate(p);
								$('[data-' + p + ']').foundation('_init');
							});
						},
						'string': function string() {
							plugins = hyphenate(plugins);
							$('[data-' + plugins + ']').foundation('_init');
						},
						'undefined': function undefined() {
							this['object'](Object.keys(_this._plugins));
						}
					};
					fns[type](plugins);
				}
			} catch (err) {
				console.error(err);
			} finally {
				return plugins;
			}
		},

		/**
   * returns a random base-36 uid with namespacing
   * @function
   * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
   * @param {String} namespace - name of plugin to be incorporated in uid, optional.
   * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
   * @returns {String} - unique id
   */
		GetYoDigits: function GetYoDigits(length, namespace) {
			length = length || 6;
			return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? '-' + namespace : '');
		},
		/**
   * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
   * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
   * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
   */
		reflow: function reflow(elem, plugins) {

			// If plugins is undefined, just grab everything
			if (typeof plugins === 'undefined') {
				plugins = Object.keys(this._plugins);
			}
			// If plugins is a string, convert it to an array with one item
			else if (typeof plugins === 'string') {
					plugins = [plugins];
				}

			var _this = this;

			// Iterate through each plugin
			$.each(plugins, function (i, name) {
				// Get the current plugin
				var plugin = _this._plugins[name];

				// Localize the search to all elements inside elem, as well as elem itself, unless elem === document
				var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

				// For each plugin found, initialize it
				$elem.each(function () {
					var $el = $(this),
					    opts = {};
					// Don't double-dip on plugins
					if ($el.data('zfPlugin')) {
						console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
						return;
					}

					if ($el.attr('data-options')) {
						var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
							var opt = e.split(':').map(function (el) {
								return el.trim();
							});
							if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
						});
					}
					try {
						$el.data('zfPlugin', new plugin($(this), opts));
					} catch (er) {
						console.error(er);
					} finally {
						return;
					}
				});
			});
		},
		getFnName: functionName,
		transitionend: function transitionend($elem) {
			var transitions = {
				'transition': 'transitionend',
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'otransitionend'
			};
			var elem = document.createElement('div'),
			    end;

			for (var t in transitions) {
				if (typeof elem.style[t] !== 'undefined') {
					end = transitions[t];
				}
			}
			if (end) {
				return end;
			} else {
				end = setTimeout(function () {
					$elem.triggerHandler('transitionend', [$elem]);
				}, 1);
				return 'transitionend';
			}
		}
	};

	Foundation.util = {
		/**
   * Function for applying a debounce effect to a function call.
   * @function
   * @param {Function} func - Function to be called at end of timeout.
   * @param {Number} delay - Time in ms to delay the call of `func`.
   * @returns function
   */
		throttle: function throttle(func, delay) {
			var timer = null;

			return function () {
				var context = this,
				    args = arguments;

				if (timer === null) {
					timer = setTimeout(function () {
						func.apply(context, args);
						timer = null;
					}, delay);
				}
			};
		}
	};

	// TODO: consider not making this a jQuery function
	// TODO: need way to reflow vs. re-initialize
	/**
  * The Foundation jQuery method.
  * @param {String|Array} method - An action to perform on the current jQuery object.
  */
	var foundation = function foundation(method) {
		var type = typeof method === 'undefined' ? 'undefined' : _typeof(method),
		    $meta = $('meta.foundation-mq'),
		    $noJS = $('.no-js');

		if (!$meta.length) {
			$('<meta class="foundation-mq">').appendTo(document.head);
		}
		if ($noJS.length) {
			$noJS.removeClass('no-js');
		}

		if (type === 'undefined') {
			//needs to initialize the Foundation object, or an individual plugin.
			Foundation.MediaQuery._init();
			Foundation.reflow(this);
		} else if (type === 'string') {
			//an individual method to invoke on a plugin or group of plugins
			var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
			var plugClass = this.data('zfPlugin'); //determine the class of plugin

			if (plugClass !== undefined && plugClass[method] !== undefined) {
				//make sure both the class and method exist
				if (this.length === 1) {
					//if there's only one, call it directly.
					plugClass[method].apply(plugClass, args);
				} else {
					this.each(function (i, el) {
						//otherwise loop through the jQuery collection and invoke the method on each
						plugClass[method].apply($(el).data('zfPlugin'), args);
					});
				}
			} else {
				//error for no class or no method
				throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
			}
		} else {
			//error for invalid argument type
			throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
		}
		return this;
	};

	window.Foundation = Foundation;
	$.fn.foundation = foundation;

	// Polyfill for requestAnimationFrame
	(function () {
		if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
			return new Date().getTime();
		};

		var vendors = ['webkit', 'moz'];
		for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
			var vp = vendors[i];
			window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
		}
		if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
			var lastTime = 0;
			window.requestAnimationFrame = function (callback) {
				var now = Date.now();
				var nextTime = Math.max(lastTime + 16, now);
				return setTimeout(function () {
					callback(lastTime = nextTime);
				}, nextTime - now);
			};
			window.cancelAnimationFrame = clearTimeout;
		}
		/**
   * Polyfill for performance.now, required by rAF
   */
		if (!window.performance || !window.performance.now) {
			window.performance = {
				start: Date.now(),
				now: function now() {
					return Date.now() - this.start;
				}
			};
		}
	})();
	if (!Function.prototype.bind) {
		Function.prototype.bind = function (oThis) {
			if (typeof this !== 'function') {
				// closest thing possible to the ECMAScript 5
				// internal IsCallable function
				throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
			}

			var aArgs = Array.prototype.slice.call(arguments, 1),
			    fToBind = this,
			    fNOP = function fNOP() {},
			    fBound = function fBound() {
				return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
			};

			if (this.prototype) {
				// native functions don't have a prototype
				fNOP.prototype = this.prototype;
			}
			fBound.prototype = new fNOP();

			return fBound;
		};
	}
	// Polyfill to get the name of a function in IE9
	function functionName(fn) {
		if (Function.prototype.name === undefined) {
			var funcNameRegex = /function\s([^(]{1,})\(/;
			var results = funcNameRegex.exec(fn.toString());
			return results && results.length > 1 ? results[1].trim() : "";
		} else if (fn.prototype === undefined) {
			return fn.constructor.name;
		} else {
			return fn.prototype.constructor.name;
		}
	}
	function parseValue(str) {
		if (/true/.test(str)) return true;else if (/false/.test(str)) return false;else if (!isNaN(str * 1)) return parseFloat(str);
		return str;
	}
	// Convert PascalCase to kebab-case
	// Thank you: http://stackoverflow.com/a/8955580
	function hyphenate(str) {
		return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
	}
}(jQuery);

'use strict';

!function ($) {

	Foundation.Box = {
		ImNotTouchingYou: ImNotTouchingYou,
		GetDimensions: GetDimensions,
		GetOffsets: GetOffsets

		/**
   * Compares the dimensions of an element to a container and determines collision events with container.
   * @function
   * @param {jQuery} element - jQuery object to test for collisions.
   * @param {jQuery} parent - jQuery object to use as bounding container.
   * @param {Boolean} lrOnly - set to true to check left and right values only.
   * @param {Boolean} tbOnly - set to true to check top and bottom values only.
   * @default if no parent object passed, detects collisions with `window`.
   * @returns {Boolean} - true if collision free, false if a collision in any direction.
   */
	};function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
		var eleDims = GetDimensions(element),
		    top,
		    bottom,
		    left,
		    right;

		if (parent) {
			var parDims = GetDimensions(parent);

			bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
			top = eleDims.offset.top >= parDims.offset.top;
			left = eleDims.offset.left >= parDims.offset.left;
			right = eleDims.offset.left + eleDims.width <= parDims.width + parDims.offset.left;
		} else {
			bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
			top = eleDims.offset.top >= eleDims.windowDims.offset.top;
			left = eleDims.offset.left >= eleDims.windowDims.offset.left;
			right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
		}

		var allDirs = [bottom, top, left, right];

		if (lrOnly) {
			return left === right === true;
		}

		if (tbOnly) {
			return top === bottom === true;
		}

		return allDirs.indexOf(false) === -1;
	};

	/**
  * Uses native methods to return an object of dimension values.
  * @function
  * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
  * @returns {Object} - nested object of integer pixel values
  * TODO - if element is window, return only those values.
  */
	function GetDimensions(elem, test) {
		elem = elem.length ? elem[0] : elem;

		if (elem === window || elem === document) {
			throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
		}

		var rect = elem.getBoundingClientRect(),
		    parRect = elem.parentNode.getBoundingClientRect(),
		    winRect = document.body.getBoundingClientRect(),
		    winY = window.pageYOffset,
		    winX = window.pageXOffset;

		return {
			width: rect.width,
			height: rect.height,
			offset: {
				top: rect.top + winY,
				left: rect.left + winX
			},
			parentDims: {
				width: parRect.width,
				height: parRect.height,
				offset: {
					top: parRect.top + winY,
					left: parRect.left + winX
				}
			},
			windowDims: {
				width: winRect.width,
				height: winRect.height,
				offset: {
					top: winY,
					left: winX
				}
			}
		};
	}

	/**
  * Returns an object of top and left integer pixel values for dynamically rendered elements,
  * such as: Tooltip, Reveal, and Dropdown
  * @function
  * @param {jQuery} element - jQuery object for the element being positioned.
  * @param {jQuery} anchor - jQuery object for the element's anchor point.
  * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
  * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
  * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
  * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
  * TODO alter/rewrite to work with `em` values as well/instead of pixels
  */
	function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
		var $eleDims = GetDimensions(element),
		    $anchorDims = anchor ? GetDimensions(anchor) : null;

		switch (position) {
			case 'top':
				return {
					left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
					top: $anchorDims.offset.top - ($eleDims.height + vOffset)
				};
				break;
			case 'left':
				return {
					left: $anchorDims.offset.left - ($eleDims.width + hOffset),
					top: $anchorDims.offset.top
				};
				break;
			case 'right':
				return {
					left: $anchorDims.offset.left + $anchorDims.width + hOffset,
					top: $anchorDims.offset.top
				};
				break;
			case 'center top':
				return {
					left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
					top: $anchorDims.offset.top - ($eleDims.height + vOffset)
				};
				break;
			case 'center bottom':
				return {
					left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
					top: $anchorDims.offset.top + $anchorDims.height + vOffset
				};
				break;
			case 'center left':
				return {
					left: $anchorDims.offset.left - ($eleDims.width + hOffset),
					top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
				};
				break;
			case 'center right':
				return {
					left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
					top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
				};
				break;
			case 'center':
				return {
					left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
					top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
				};
				break;
			case 'reveal':
				return {
					left: ($eleDims.windowDims.width - $eleDims.width) / 2,
					top: $eleDims.windowDims.offset.top + vOffset
				};
			case 'reveal full':
				return {
					left: $eleDims.windowDims.offset.left,
					top: $eleDims.windowDims.offset.top
				};
				break;
			case 'left bottom':
				return {
					left: $anchorDims.offset.left - ($eleDims.width + hOffset),
					top: $anchorDims.offset.top + $anchorDims.height
				};
				break;
			case 'right bottom':
				return {
					left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
					top: $anchorDims.offset.top + $anchorDims.height
				};
				break;
			default:
				return {
					left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
					top: $anchorDims.offset.top + $anchorDims.height + vOffset
				};
		}
	}
}(jQuery);

/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

	var keyCodes = {
		9: 'TAB',
		13: 'ENTER',
		27: 'ESCAPE',
		32: 'SPACE',
		37: 'ARROW_LEFT',
		38: 'ARROW_UP',
		39: 'ARROW_RIGHT',
		40: 'ARROW_DOWN'
	};

	var commands = {};

	var Keyboard = {
		keys: getKeyCodes(keyCodes),

		/**
   * Parses the (keyboard) event and returns a String that represents its key
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   * @param {Event} event - the event generated by the event handler
   * @return String key - String that represents the key pressed
   */
		parseKey: function parseKey(event) {
			var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();
			if (event.shiftKey) key = 'SHIFT_' + key;
			if (event.ctrlKey) key = 'CTRL_' + key;
			if (event.altKey) key = 'ALT_' + key;
			return key;
		},


		/**
   * Handles the given (keyboard) event
   * @param {Event} event - the event generated by the event handler
   * @param {String} component - Foundation component's name, e.g. Slider or Reveal
   * @param {Objects} functions - collection of functions that are to be executed
   */
		handleKey: function handleKey(event, component, functions) {
			var commandList = commands[component],
			    keyCode = this.parseKey(event),
			    cmds,
			    command,
			    fn;

			if (!commandList) return console.warn('Component not defined!');

			if (typeof commandList.ltr === 'undefined') {
				// this component does not differentiate between ltr and rtl
				cmds = commandList; // use plain list
			} else {
				// merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
				if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
			}
			command = cmds[keyCode];

			fn = functions[command];
			if (fn && typeof fn === 'function') {
				// execute function  if exists
				var returnValue = fn.apply();
				if (functions.handled || typeof functions.handled === 'function') {
					// execute function when event was handled
					functions.handled(returnValue);
				}
			} else {
				if (functions.unhandled || typeof functions.unhandled === 'function') {
					// execute function when event was not handled
					functions.unhandled();
				}
			}
		},


		/**
   * Finds all focusable elements within the given `$element`
   * @param {jQuery} $element - jQuery object to search within
   * @return {jQuery} $focusable - all focusable elements within `$element`
   */
		findFocusable: function findFocusable($element) {
			return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
				if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
					return false;
				} //only have visible elements and those that have a tabindex greater or equal 0
				return true;
			});
		},


		/**
   * Returns the component name name
   * @param {Object} component - Foundation component, e.g. Slider or Reveal
   * @return String componentName
   */

		register: function register(componentName, cmds) {
			commands[componentName] = cmds;
		}
	};

	/*
  * Constants for easier comparing.
  * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
  */
	function getKeyCodes(kcs) {
		var k = {};
		for (var kc in kcs) {
			k[kcs[kc]] = kcs[kc];
		}return k;
	}

	Foundation.Keyboard = Keyboard;
}(jQuery);

'use strict';

!function ($) {

	// Default set of media queries
	var defaultQueries = {
		'default': 'only screen',
		landscape: 'only screen and (orientation: landscape)',
		portrait: 'only screen and (orientation: portrait)',
		retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
	};

	var MediaQuery = {
		queries: [],

		current: '',

		/**
   * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
   * @function
   * @private
   */
		_init: function _init() {
			var self = this;
			var extractedStyles = $('.foundation-mq').css('font-family');
			var namedQueries;

			namedQueries = parseStyleToObject(extractedStyles);

			for (var key in namedQueries) {
				if (namedQueries.hasOwnProperty(key)) {
					self.queries.push({
						name: key,
						value: 'only screen and (min-width: ' + namedQueries[key] + ')'
					});
				}
			}

			this.current = this._getCurrentSize();

			this._watcher();
		},


		/**
   * Checks if the screen is at least as wide as a breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint to check.
   * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
   */
		atLeast: function atLeast(size) {
			var query = this.get(size);

			if (query) {
				return window.matchMedia(query).matches;
			}

			return false;
		},


		/**
   * Gets the media query of a breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint to get.
   * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
   */
		get: function get(size) {
			for (var i in this.queries) {
				if (this.queries.hasOwnProperty(i)) {
					var query = this.queries[i];
					if (size === query.name) return query.value;
				}
			}

			return null;
		},


		/**
   * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
   * @function
   * @private
   * @returns {String} Name of the current breakpoint.
   */
		_getCurrentSize: function _getCurrentSize() {
			var matched;

			for (var i = 0; i < this.queries.length; i++) {
				var query = this.queries[i];

				if (window.matchMedia(query.value).matches) {
					matched = query;
				}
			}

			if ((typeof matched === 'undefined' ? 'undefined' : _typeof(matched)) === 'object') {
				return matched.name;
			} else {
				return matched;
			}
		},


		/**
   * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
   * @function
   * @private
   */
		_watcher: function _watcher() {
			var _this2 = this;

			$(window).on('resize.zf.mediaquery', function () {
				var newSize = _this2._getCurrentSize(),
				    currentSize = _this2.current;

				if (newSize !== currentSize) {
					// Change the current media query
					_this2.current = newSize;

					// Broadcast the media query change on the window
					$(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
				}
			});
		}
	};

	Foundation.MediaQuery = MediaQuery;

	// matchMedia() polyfill - Test a CSS media type/query in JS.
	// Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
	window.matchMedia || (window.matchMedia = function () {
		'use strict';

		// For browsers that support matchMedium api such as IE 9 and webkit

		var styleMedia = window.styleMedia || window.media;

		// For those that don't support matchMedium
		if (!styleMedia) {
			var style = document.createElement('style'),
			    script = document.getElementsByTagName('script')[0],
			    info = null;

			style.type = 'text/css';
			style.id = 'matchmediajs-test';

			script.parentNode.insertBefore(style, script);

			// 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
			info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

			styleMedia = {
				matchMedium: function matchMedium(media) {
					var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

					// 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
					if (style.styleSheet) {
						style.styleSheet.cssText = text;
					} else {
						style.textContent = text;
					}

					// Test if media query is true or false
					return info.width === '1px';
				}
			};
		}

		return function (media) {
			return {
				matches: styleMedia.matchMedium(media || 'all'),
				media: media || 'all'
			};
		};
	}());

	// Thank you: https://github.com/sindresorhus/query-string
	function parseStyleToObject(str) {
		var styleObject = {};

		if (typeof str !== 'string') {
			return styleObject;
		}

		str = str.trim().slice(1, -1); // browsers re-quote string style values

		if (!str) {
			return styleObject;
		}

		styleObject = str.split('&').reduce(function (ret, param) {
			var parts = param.replace(/\+/g, ' ').split('=');
			var key = parts[0];
			var val = parts[1];
			key = decodeURIComponent(key);

			// missing `=` should be `null`:
			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
			val = val === undefined ? null : decodeURIComponent(val);

			if (!ret.hasOwnProperty(key)) {
				ret[key] = val;
			} else if (Array.isArray(ret[key])) {
				ret[key].push(val);
			} else {
				ret[key] = [ret[key], val];
			}
			return ret;
		}, {});

		return styleObject;
	}

	Foundation.MediaQuery = MediaQuery;
}(jQuery);

'use strict';

!function ($) {

	/**
  * Motion module.
  * @module foundation.motion
  */

	var initClasses = ['mui-enter', 'mui-leave'];
	var activeClasses = ['mui-enter-active', 'mui-leave-active'];

	var Motion = {
		animateIn: function animateIn(element, animation, cb) {
			animate(true, element, animation, cb);
		},

		animateOut: function animateOut(element, animation, cb) {
			animate(false, element, animation, cb);
		}
	};

	function Move(duration, elem, fn) {
		var anim,
		    prog,
		    start = null;
		// console.log('called');

		function move(ts) {
			if (!start) start = window.performance.now();
			// console.log(start, ts);
			prog = ts - start;
			fn.apply(elem);

			if (prog < duration) {
				anim = window.requestAnimationFrame(move, elem);
			} else {
				window.cancelAnimationFrame(anim);
				elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
			}
		}
		anim = window.requestAnimationFrame(move);
	}

	/**
  * Animates an element in or out using a CSS transition class.
  * @function
  * @private
  * @param {Boolean} isIn - Defines if the animation is in or out.
  * @param {Object} element - jQuery or HTML object to animate.
  * @param {String} animation - CSS class to use.
  * @param {Function} cb - Callback to run when animation is finished.
  */
	function animate(isIn, element, animation, cb) {
		element = $(element).eq(0);

		if (!element.length) return;

		var initClass = isIn ? initClasses[0] : initClasses[1];
		var activeClass = isIn ? activeClasses[0] : activeClasses[1];

		// Set up the animation
		reset();

		element.addClass(animation).css('transition', 'none');

		requestAnimationFrame(function () {
			element.addClass(initClass);
			if (isIn) element.show();
		});

		// Start the animation
		requestAnimationFrame(function () {
			element[0].offsetWidth;
			element.css('transition', '').addClass(activeClass);
		});

		// Clean up the animation when it finishes
		element.one(Foundation.transitionend(element), finish);

		// Hides the element (for out animations), resets the element, and runs a callback
		function finish() {
			if (!isIn) element.hide();
			reset();
			if (cb) cb.apply(element);
		}

		// Resets transitions and removes motion-specific classes
		function reset() {
			element[0].style.transitionDuration = 0;
			element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
		}
	}

	Foundation.Move = Move;
	Foundation.Motion = Motion;
}(jQuery);

'use strict';

!function ($) {

	var Nest = {
		Feather: function Feather(menu) {
			var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'zf';

			menu.attr('role', 'menubar');

			var items = menu.find('li').attr({ 'role': 'menuitem' }),
			    subMenuClass = 'is-' + type + '-submenu',
			    subItemClass = subMenuClass + '-item',
			    hasSubClass = 'is-' + type + '-submenu-parent';

			menu.find('a:first').attr('tabindex', 0);

			items.each(function () {
				var $item = $(this),
				    $sub = $item.children('ul');

				if ($sub.length) {
					$item.addClass(hasSubClass).attr({
						'aria-haspopup': true,
						'aria-expanded': false,
						'aria-label': $item.children('a:first').text()
					});

					$sub.addClass('submenu ' + subMenuClass).attr({
						'data-submenu': '',
						'aria-hidden': true,
						'role': 'menu'
					});
				}

				if ($item.parent('[data-submenu]').length) {
					$item.addClass('is-submenu-item ' + subItemClass);
				}
			});

			return;
		},
		Burn: function Burn(menu, type) {
			var items = menu.find('li').removeAttr('tabindex'),
			    subMenuClass = 'is-' + type + '-submenu',
			    subItemClass = subMenuClass + '-item',
			    hasSubClass = 'is-' + type + '-submenu-parent';

			menu.find('*').removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').removeAttr('data-submenu').css('display', '');

			// console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
			//           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
			//           .removeAttr('data-submenu'));
			// items.each(function(){
			//   var $item = $(this),
			//       $sub = $item.children('ul');
			//   if($item.parent('[data-submenu]').length){
			//     $item.removeClass('is-submenu-item ' + subItemClass);
			//   }
			//   if($sub.length){
			//     $item.removeClass('has-submenu');
			//     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
			//   }
			// });
		}
	};

	Foundation.Nest = Nest;
}(jQuery);

'use strict';

!function ($) {

	function Timer(elem, options, cb) {
		var _this = this,
		    duration = options.duration,
		    //options is an object for easily adding features later.
		nameSpace = Object.keys(elem.data())[0] || 'timer',
		    remain = -1,
		    start,
		    timer;

		this.isPaused = false;

		this.restart = function () {
			remain = -1;
			clearTimeout(timer);
			this.start();
		};

		this.start = function () {
			this.isPaused = false;
			// if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
			clearTimeout(timer);
			remain = remain <= 0 ? duration : remain;
			elem.data('paused', false);
			start = Date.now();
			timer = setTimeout(function () {
				if (options.infinite) {
					_this.restart(); //rerun the timer.
				}
				cb();
			}, remain);
			elem.trigger('timerstart.zf.' + nameSpace);
		};

		this.pause = function () {
			this.isPaused = true;
			//if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
			clearTimeout(timer);
			elem.data('paused', true);
			var end = Date.now();
			remain = remain - (end - start);
			elem.trigger('timerpaused.zf.' + nameSpace);
		};
	}

	/**
  * Runs a callback function when images are fully loaded.
  * @param {Object} images - Image(s) to check if loaded.
  * @param {Func} callback - Function to execute when image is fully loaded.
  */
	function onImagesLoaded(images, callback) {
		var self = this,
		    unloaded = images.length;

		if (unloaded === 0) {
			callback();
		}

		images.each(function () {
			if (this.complete) {
				singleImageLoaded();
			} else if (typeof this.naturalWidth !== 'undefined' && this.naturalWidth > 0) {
				singleImageLoaded();
			} else {
				$(this).one('load', function () {
					singleImageLoaded();
				});
			}
		});

		function singleImageLoaded() {
			unloaded--;
			if (unloaded === 0) {
				callback();
			}
		}
	}

	Foundation.Timer = Timer;
	Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);

//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

	$.spotSwipe = {
		version: '1.0.0',
		enabled: 'ontouchstart' in document.documentElement,
		preventDefault: false,
		moveThreshold: 75,
		timeThreshold: 200
	};

	var startPosX,
	    startPosY,
	    startTime,
	    elapsedTime,
	    isMoving = false;

	function onTouchEnd() {
		//  alert(this);
		this.removeEventListener('touchmove', onTouchMove);
		this.removeEventListener('touchend', onTouchEnd);
		isMoving = false;
	}

	function onTouchMove(e) {
		if ($.spotSwipe.preventDefault) {
			e.preventDefault();
		}
		if (isMoving) {
			var x = e.touches[0].pageX;
			var y = e.touches[0].pageY;
			var dx = startPosX - x;
			var dy = startPosY - y;
			var dir;
			elapsedTime = new Date().getTime() - startTime;
			if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
				dir = dx > 0 ? 'left' : 'right';
			}
			// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
			//   dir = dy > 0 ? 'down' : 'up';
			// }
			if (dir) {
				e.preventDefault();
				onTouchEnd.call(this);
				$(this).trigger('swipe', dir).trigger('swipe' + dir);
			}
		}
	}

	function onTouchStart(e) {
		if (e.touches.length == 1) {
			startPosX = e.touches[0].pageX;
			startPosY = e.touches[0].pageY;
			isMoving = true;
			startTime = new Date().getTime();
			this.addEventListener('touchmove', onTouchMove, false);
			this.addEventListener('touchend', onTouchEnd, false);
		}
	}

	function init() {
		this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
	}

	function teardown() {
		this.removeEventListener('touchstart', onTouchStart);
	}

	$.event.special.swipe = { setup: init };

	$.each(['left', 'up', 'down', 'right'], function () {
		$.event.special['swipe' + this] = { setup: function setup() {
				$(this).on('swipe', $.noop);
			} };
	});
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function ($) {
	$.fn.addTouch = function () {
		this.each(function (i, el) {
			$(el).bind('touchstart touchmove touchend touchcancel', function () {
				//we pass the original event object because the jQuery event
				//object is normalized to w3c specs and does not provide the TouchList
				handleTouch(event);
			});
		});

		var handleTouch = function handleTouch(event) {
			var touches = event.changedTouches,
			    first = touches[0],
			    eventTypes = {
				touchstart: 'mousedown',
				touchmove: 'mousemove',
				touchend: 'mouseup'
			},
			    type = eventTypes[event.type],
			    simulatedEvent;

			if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
				simulatedEvent = new window.MouseEvent(type, {
					'bubbles': true,
					'cancelable': true,
					'screenX': first.screenX,
					'screenY': first.screenY,
					'clientX': first.clientX,
					'clientY': first.clientY
				});
			} else {
				simulatedEvent = document.createEvent('MouseEvent');
				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
			}
			first.target.dispatchEvent(simulatedEvent);
		};
	};
}(jQuery);

//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/

'use strict';

!function ($) {

	var MutationObserver = function () {
		var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
		for (var i = 0; i < prefixes.length; i++) {
			if (prefixes[i] + 'MutationObserver' in window) {
				return window[prefixes[i] + 'MutationObserver'];
			}
		}
		return false;
	}();

	var triggers = function triggers(el, type) {
		el.data(type).split(' ').forEach(function (id) {
			$('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
		});
	};
	// Elements with [data-open] will reveal a plugin that supports it when clicked.
	$(document).on('click.zf.trigger', '[data-open]', function () {
		triggers($(this), 'open');
	});

	// Elements with [data-close] will close a plugin that supports it when clicked.
	// If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
	$(document).on('click.zf.trigger', '[data-close]', function () {
		var id = $(this).data('close');
		if (id) {
			triggers($(this), 'close');
		} else {
			$(this).trigger('close.zf.trigger');
		}
	});

	// Elements with [data-toggle] will toggle a plugin that supports it when clicked.
	$(document).on('click.zf.trigger', '[data-toggle]', function () {
		triggers($(this), 'toggle');
	});

	// Elements with [data-closable] will respond to close.zf.trigger events.
	$(document).on('close.zf.trigger', '[data-closable]', function (e) {
		e.stopPropagation();
		var animation = $(this).data('closable');

		if (animation !== '') {
			Foundation.Motion.animateOut($(this), animation, function () {
				$(this).trigger('closed.zf');
			});
		} else {
			$(this).fadeOut().trigger('closed.zf');
		}
	});

	$(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
		var id = $(this).data('toggle-focus');
		$('#' + id).triggerHandler('toggle.zf.trigger', [$(this)]);
	});

	/**
 * Fires once after all other scripts have loaded
 * @function
 * @private
 */
	$(window).load(function () {
		checkListeners();
	});

	function checkListeners() {
		eventsListener();
		resizeListener();
		scrollListener();
		closemeListener();
	}

	//******** only fires this function once on load, if there's something to watch ********
	function closemeListener(pluginName) {
		var yetiBoxes = $('[data-yeti-box]'),
		    plugNames = ['dropdown', 'tooltip', 'reveal'];

		if (pluginName) {
			if (typeof pluginName === 'string') {
				plugNames.push(pluginName);
			} else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
				plugNames.concat(pluginName);
			} else {
				console.error('Plugin names must be strings');
			}
		}
		if (yetiBoxes.length) {
			var listeners = plugNames.map(function (name) {
				return 'closeme.zf.' + name;
			}).join(' ');

			$(window).off(listeners).on(listeners, function (e, pluginId) {
				var plugin = e.namespace.split('.')[0];
				var plugins = $('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

				plugins.each(function () {
					var _this = $(this);

					_this.triggerHandler('close.zf.trigger', [_this]);
				});
			});
		}
	}

	function resizeListener(debounce) {
		var timer = void 0,
		    $nodes = $('[data-resize]');
		if ($nodes.length) {
			$(window).off('resize.zf.trigger').on('resize.zf.trigger', function (e) {
				if (timer) {
					clearTimeout(timer);
				}

				timer = setTimeout(function () {

					if (!MutationObserver) {
						//fallback for IE 9
						$nodes.each(function () {
							$(this).triggerHandler('resizeme.zf.trigger');
						});
					}
					//trigger all listening elements and signal a resize event
					$nodes.attr('data-events', "resize");
				}, debounce || 10); //default time to emit resize event
			});
		}
	}

	function scrollListener(debounce) {
		var timer = void 0,
		    $nodes = $('[data-scroll]');
		if ($nodes.length) {
			$(window).off('scroll.zf.trigger').on('scroll.zf.trigger', function (e) {
				if (timer) {
					clearTimeout(timer);
				}

				timer = setTimeout(function () {

					if (!MutationObserver) {
						//fallback for IE 9
						$nodes.each(function () {
							$(this).triggerHandler('scrollme.zf.trigger');
						});
					}
					//trigger all listening elements and signal a scroll event
					$nodes.attr('data-events', "scroll");
				}, debounce || 10); //default time to emit scroll event
			});
		}
	}

	function eventsListener() {
		if (!MutationObserver) {
			return false;
		}
		var nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

		//element callback
		var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
			var $target = $(mutationRecordsList[0].target);
			//trigger the event handler for the element depending on type
			switch ($target.attr("data-events")) {

				case "resize":
					$target.triggerHandler('resizeme.zf.trigger', [$target]);
					break;

				case "scroll":
					$target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
					break;

				// case "mutate" :
				// console.log('mutate', $target);
				// $target.triggerHandler('mutate.zf.trigger');
				//
				// //make sure we don't get stuck in an infinite loop from sloppy codeing
				// if ($target.index('[data-mutate]') == $("[data-mutate]").length-1) {
				//   domMutationObserver();
				// }
				// break;

				default:
					return false;
				//nothing
			}
		};

		if (nodes.length) {
			//for each element that needs to listen for resizing, scrolling, (or coming soon mutation) add a single observer
			for (var i = 0; i <= nodes.length - 1; i++) {
				var elementObserver = new MutationObserver(listeningElementsMutation);
				elementObserver.observe(nodes[i], { attributes: true, childList: false, characterData: false, subtree: false, attributeFilter: ["data-events"] });
			}
		}
	}

	// ------------------------------------

	// [PH]
	// Foundation.CheckWatchers = checkWatchers;
	Foundation.IHearYou = checkListeners;
	// Foundation.ISeeYou = scrollListener;
	// Foundation.IFeelYou = closemeListener;
}(jQuery);

// function domMutationObserver(debounce) {
//   // !!! This is coming soon and needs more work; not active  !!! //
//   var timer,
//   nodes = document.querySelectorAll('[data-mutate]');
//   //
//   if (nodes.length) {
//     // var MutationObserver = (function () {
//     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
//     //   for (var i=0; i < prefixes.length; i++) {
//     //     if (prefixes[i] + 'MutationObserver' in window) {
//     //       return window[prefixes[i] + 'MutationObserver'];
//     //     }
//     //   }
//     //   return false;
//     // }());
//
//
//     //for the body, we need to listen for all changes effecting the style and class attributes
//     var bodyObserver = new MutationObserver(bodyMutation);
//     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
//
//
//     //body callback
//     function bodyMutation(mutate) {
//       //trigger all listening elements and signal a mutation event
//       if (timer) { clearTimeout(timer); }
//
//       timer = setTimeout(function() {
//         bodyObserver.disconnect();
//         $('[data-mutate]').attr('data-events',"mutate");
//       }, debounce || 150);
//     }
//   }
// }

'use strict';

!function ($) {

	/**
  * Reveal module.
  * @module foundation.reveal
  * @requires foundation.util.keyboard
  * @requires foundation.util.box
  * @requires foundation.util.triggers
  * @requires foundation.util.mediaQuery
  * @requires foundation.util.motion if using animations
  */

	var Reveal = function () {
		/**
   * Creates a new instance of Reveal.
   * @class
   * @param {jQuery} element - jQuery object to use for the modal.
   * @param {Object} options - optional parameters.
   */
		function Reveal(element, options) {
			_classCallCheck(this, Reveal);

			this.$element = element;
			this.options = $.extend({}, Reveal.defaults, this.$element.data(), options);
			this._init();

			Foundation.registerPlugin(this, 'Reveal');
			Foundation.Keyboard.register('Reveal', {
				'ENTER': 'open',
				'SPACE': 'open',
				'ESCAPE': 'close',
				'TAB': 'tab_forward',
				'SHIFT_TAB': 'tab_backward'
			});
		}

		/**
   * Initializes the modal by adding the overlay and close buttons, (if selected).
   * @private
   */


		_createClass(Reveal, [{
			key: '_init',
			value: function _init() {
				this.id = this.$element.attr('id');
				this.isActive = false;
				this.cached = { mq: Foundation.MediaQuery.current };
				this.isMobile = mobileSniff();

				this.$anchor = $('[data-open="' + this.id + '"]').length ? $('[data-open="' + this.id + '"]') : $('[data-toggle="' + this.id + '"]');
				this.$anchor.attr({
					'aria-controls': this.id,
					'aria-haspopup': true,
					'tabindex': 0
				});

				if (this.options.fullScreen || this.$element.hasClass('full')) {
					this.options.fullScreen = true;
					this.options.overlay = false;
				}
				if (this.options.overlay && !this.$overlay) {
					this.$overlay = this._makeOverlay(this.id);
				}

				this.$element.attr({
					'role': 'dialog',
					'aria-hidden': true,
					'data-yeti-box': this.id,
					'data-resize': this.id
				});

				if (this.$overlay) {
					this.$element.detach().appendTo(this.$overlay);
				} else {
					this.$element.detach().appendTo($('body'));
					this.$element.addClass('without-overlay');
				}
				this._events();
				if (this.options.deepLink && window.location.hash === '#' + this.id) {
					$(window).one('load.zf.reveal', this.open.bind(this));
				}
			}

			/**
    * Creates an overlay div to display behind the modal.
    * @private
    */

		}, {
			key: '_makeOverlay',
			value: function _makeOverlay(id) {
				var $overlay = $('<div></div>').addClass('reveal-overlay').appendTo('body');
				return $overlay;
			}

			/**
    * Updates position of modal
    * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
    * @private
    */

		}, {
			key: '_updatePosition',
			value: function _updatePosition() {
				var width = this.$element.outerWidth();
				var outerWidth = $(window).width();
				var height = this.$element.outerHeight();
				var outerHeight = $(window).height();
				var left, top;
				if (this.options.hOffset === 'auto') {
					left = parseInt((outerWidth - width) / 2, 10);
				} else {
					left = parseInt(this.options.hOffset, 10);
				}
				if (this.options.vOffset === 'auto') {
					if (height > outerHeight) {
						top = parseInt(Math.min(100, outerHeight / 10), 10);
					} else {
						top = parseInt((outerHeight - height) / 4, 10);
					}
				} else {
					top = parseInt(this.options.vOffset, 10);
				}
				this.$element.css({ top: top + 'px' });
				// only worry about left if we don't have an overlay or we havea  horizontal offset,
				// otherwise we're perfectly in the middle
				if (!this.$overlay || this.options.hOffset !== 'auto') {
					this.$element.css({ left: left + 'px' });
					this.$element.css({ margin: '0px' });
				}
			}

			/**
    * Adds event handlers for the modal.
    * @private
    */

		}, {
			key: '_events',
			value: function _events() {
				var _this3 = this;

				var _this = this;

				this.$element.on({
					'open.zf.trigger': this.open.bind(this),
					'close.zf.trigger': function closeZfTrigger(event, $element) {
						if (event.target === _this.$element[0] || $(event.target).parents('[data-closable]')[0] === $element) {
							// only close reveal when it's explicitly called
							return _this3.close.apply(_this3);
						}
					},
					'toggle.zf.trigger': this.toggle.bind(this),
					'resizeme.zf.trigger': function resizemeZfTrigger() {
						_this._updatePosition();
					}
				});

				if (this.$anchor.length) {
					this.$anchor.on('keydown.zf.reveal', function (e) {
						if (e.which === 13 || e.which === 32) {
							e.stopPropagation();
							e.preventDefault();
							_this.open();
						}
					});
				}

				if (this.options.closeOnClick && this.options.overlay) {
					this.$overlay.off('.zf.reveal').on('click.zf.reveal', function (e) {
						if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
							return;
						}
						_this.close();
					});
				}
				if (this.options.deepLink) {
					$(window).on('popstate.zf.reveal:' + this.id, this._handleState.bind(this));
				}
			}

			/**
    * Handles modal methods on back/forward button clicks or any other event that triggers popstate.
    * @private
    */

		}, {
			key: '_handleState',
			value: function _handleState(e) {
				if (window.location.hash === '#' + this.id && !this.isActive) {
					this.open();
				} else {
					this.close();
				}
			}

			/**
    * Opens the modal controlled by `this.$anchor`, and closes all others by default.
    * @function
    * @fires Reveal#closeme
    * @fires Reveal#open
    */

		}, {
			key: 'open',
			value: function open() {
				var _this4 = this;

				if (this.options.deepLink) {
					var hash = '#' + this.id;

					if (window.history.pushState) {
						window.history.pushState(null, null, hash);
					} else {
						window.location.hash = hash;
					}
				}

				this.isActive = true;

				// Make elements invisible, but remove display: none so we can get size and positioning
				this.$element.css({ 'visibility': 'hidden' }).show().scrollTop(0);
				if (this.options.overlay) {
					this.$overlay.css({ 'visibility': 'hidden' }).show();
				}

				this._updatePosition();

				this.$element.hide().css({ 'visibility': '' });

				if (this.$overlay) {
					this.$overlay.css({ 'visibility': '' }).hide();
					if (this.$element.hasClass('fast')) {
						this.$overlay.addClass('fast');
					} else if (this.$element.hasClass('slow')) {
						this.$overlay.addClass('slow');
					}
				}

				if (!this.options.multipleOpened) {
					/**
      * Fires immediately before the modal opens.
      * Closes any other modals that are currently open
      * @event Reveal#closeme
      */
					this.$element.trigger('closeme.zf.reveal', this.id);
				}
				// Motion UI method of reveal
				if (this.options.animationIn) {
					var afterAnimationFocus = function afterAnimationFocus() {
						_this.$element.attr({
							'aria-hidden': false,
							'tabindex': -1
						}).focus();
						console.log('focus');
					};

					var _this = this;

					if (this.options.overlay) {
						Foundation.Motion.animateIn(this.$overlay, 'fade-in');
					}
					Foundation.Motion.animateIn(this.$element, this.options.animationIn, function () {
						_this4.focusableElements = Foundation.Keyboard.findFocusable(_this4.$element);
						afterAnimationFocus();
					});
				}
				// jQuery method of reveal
				else {
						if (this.options.overlay) {
							this.$overlay.show(0);
						}
						this.$element.show(this.options.showDelay);
					}

				// handle accessibility
				this.$element.attr({
					'aria-hidden': false,
					'tabindex': -1
				}).focus();

				/**
     * Fires when the modal has successfully opened.
     * @event Reveal#open
     */
				this.$element.trigger('open.zf.reveal');

				if (this.isMobile) {
					this.originalScrollPos = window.pageYOffset;
					$('html, body').addClass('is-reveal-open');
				} else {
					$('body').addClass('is-reveal-open');
				}

				setTimeout(function () {
					_this4._extraHandlers();
				}, 0);
			}

			/**
    * Adds extra event handlers for the body and window if necessary.
    * @private
    */

		}, {
			key: '_extraHandlers',
			value: function _extraHandlers() {
				var _this = this;
				this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);

				if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
					$('body').on('click.zf.reveal', function (e) {
						if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
							return;
						}
						_this.close();
					});
				}

				if (this.options.closeOnEsc) {
					$(window).on('keydown.zf.reveal', function (e) {
						Foundation.Keyboard.handleKey(e, 'Reveal', {
							close: function close() {
								if (_this.options.closeOnEsc) {
									_this.close();
									_this.$anchor.focus();
								}
							}
						});
					});
				}

				// lock focus within modal while tabbing
				this.$element.on('keydown.zf.reveal', function (e) {
					var $target = $(this);
					// handle keyboard event with keyboard util
					Foundation.Keyboard.handleKey(e, 'Reveal', {
						tab_forward: function tab_forward() {
							if (_this.$element.find(':focus').is(_this.focusableElements.eq(-1))) {
								// left modal downwards, setting focus to first element
								_this.focusableElements.eq(0).focus();
								return true;
							}
							if (_this.focusableElements.length === 0) {
								// no focusable elements inside the modal at all, prevent tabbing in general
								return true;
							}
						},
						tab_backward: function tab_backward() {
							if (_this.$element.find(':focus').is(_this.focusableElements.eq(0)) || _this.$element.is(':focus')) {
								// left modal upwards, setting focus to last element
								_this.focusableElements.eq(-1).focus();
								return true;
							}
							if (_this.focusableElements.length === 0) {
								// no focusable elements inside the modal at all, prevent tabbing in general
								return true;
							}
						},
						open: function open() {
							if (_this.$element.find(':focus').is(_this.$element.find('[data-close]'))) {
								setTimeout(function () {
									// set focus back to anchor if close button has been activated
									_this.$anchor.focus();
								}, 1);
							} else if ($target.is(_this.focusableElements)) {
								// dont't trigger if acual element has focus (i.e. inputs, links, ...)
								_this.open();
							}
						},
						close: function close() {
							if (_this.options.closeOnEsc) {
								_this.close();
								_this.$anchor.focus();
							}
						},
						handled: function handled(preventDefault) {
							if (preventDefault) {
								e.preventDefault();
							}
						}
					});
				});
			}

			/**
    * Closes the modal.
    * @function
    * @fires Reveal#closed
    */

		}, {
			key: 'close',
			value: function close() {
				if (!this.isActive || !this.$element.is(':visible')) {
					return false;
				}
				var _this = this;

				// Motion UI method of hiding
				if (this.options.animationOut) {
					if (this.options.overlay) {
						Foundation.Motion.animateOut(this.$overlay, 'fade-out', finishUp);
					} else {
						finishUp();
					}

					Foundation.Motion.animateOut(this.$element, this.options.animationOut);
				}
				// jQuery method of hiding
				else {
						if (this.options.overlay) {
							this.$overlay.hide(0, finishUp);
						} else {
							finishUp();
						}

						this.$element.hide(this.options.hideDelay);
					}

				// Conditionals to remove extra event listeners added on open
				if (this.options.closeOnEsc) {
					$(window).off('keydown.zf.reveal');
				}

				if (!this.options.overlay && this.options.closeOnClick) {
					$('body').off('click.zf.reveal');
				}

				this.$element.off('keydown.zf.reveal');

				function finishUp() {
					if (_this.isMobile) {
						$('html, body').removeClass('is-reveal-open');
						if (_this.originalScrollPos) {
							$('body').scrollTop(_this.originalScrollPos);
							_this.originalScrollPos = null;
						}
					} else {
						$('body').removeClass('is-reveal-open');
					}

					_this.$element.attr('aria-hidden', true);

					/**
     * Fires when the modal is done closing.
     * @event Reveal#closed
     */
					_this.$element.trigger('closed.zf.reveal');
				}

				/**
    * Resets the modal content
    * This prevents a running video to keep going in the background
    */
				if (this.options.resetOnClose) {
					this.$element.html(this.$element.html());
				}

				this.isActive = false;
				if (_this.options.deepLink) {
					if (window.history.replaceState) {
						window.history.replaceState("", document.title, window.location.pathname);
					} else {
						window.location.hash = '';
					}
				}
			}

			/**
    * Toggles the open/closed state of a modal.
    * @function
    */

		}, {
			key: 'toggle',
			value: function toggle() {
				if (this.isActive) {
					this.close();
				} else {
					this.open();
				}
			}
		}, {
			key: 'destroy',


			/**
    * Destroys an instance of a modal.
    * @function
    */
			value: function destroy() {
				if (this.options.overlay) {
					this.$element.appendTo($('body')); // move $element outside of $overlay to prevent error unregisterPlugin()
					this.$overlay.hide().off().remove();
				}
				this.$element.hide().off();
				this.$anchor.off('.zf');
				$(window).off('.zf.reveal:' + this.id);

				Foundation.unregisterPlugin(this);
			}
		}]);

		return Reveal;
	}();

	Reveal.defaults = {
		/**
   * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
   * @option
   * @example 'slide-in-left'
   */
		animationIn: '',
		/**
   * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
   * @option
   * @example 'slide-out-right'
   */
		animationOut: '',
		/**
   * Time, in ms, to delay the opening of a modal after a click if no animation used.
   * @option
   * @example 10
   */
		showDelay: 0,
		/**
   * Time, in ms, to delay the closing of a modal after a click if no animation used.
   * @option
   * @example 10
   */
		hideDelay: 0,
		/**
   * Allows a click on the body/overlay to close the modal.
   * @option
   * @example true
   */
		closeOnClick: true,
		/**
   * Allows the modal to close if the user presses the `ESCAPE` key.
   * @option
   * @example true
   */
		closeOnEsc: true,
		/**
   * If true, allows multiple modals to be displayed at once.
   * @option
   * @example false
   */
		multipleOpened: false,
		/**
   * Distance, in pixels, the modal should push down from the top of the screen.
   * @option
   * @example auto
   */
		vOffset: 'auto',
		/**
   * Distance, in pixels, the modal should push in from the side of the screen.
   * @option
   * @example auto
   */
		hOffset: 'auto',
		/**
   * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
   * @option
   * @example false
   */
		fullScreen: false,
		/**
   * Percentage of screen height the modal should push up from the bottom of the view.
   * @option
   * @example 10
   */
		btmOffsetPct: 10,
		/**
   * Allows the modal to generate an overlay div, which will cover the view when modal opens.
   * @option
   * @example true
   */
		overlay: true,
		/**
   * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
   * @option
   * @example false
   */
		resetOnClose: false,
		/**
   * Allows the modal to alter the url on open/close, and allows the use of the `back` button to close modals. ALSO, allows a modal to auto-maniacally open on page load IF the hash === the modal's user-set id.
   * @option
   * @example false
   */
		deepLink: false
	};

	// Window exports
	Foundation.plugin(Reveal, 'Reveal');

	function iPhoneSniff() {
		return (/iP(ad|hone|od).*OS/.test(window.navigator.userAgent)
		);
	}

	function androidSniff() {
		return (/Android/.test(window.navigator.userAgent)
		);
	}

	function mobileSniff() {
		return iPhoneSniff() || androidSniff();
	}
}(jQuery);

/*! VelocityJS.org (1.5.0). (C) 2014 Julian Shapiro. MIT @license: en.wikipedia.org/wiki/MIT_License */

/*************************
 Velocity jQuery Shim
 *************************/

/*! VelocityJS.org jQuery Shim (1.0.1). (C) 2014 The jQuery Foundation. MIT @license: en.wikipedia.org/wiki/MIT_License. */

/* This file contains the jQuery functions that Velocity relies on, thereby removing Velocity's dependency on a full copy of jQuery, and allowing it to work in any environment. */
/* These shimmed functions are only used if jQuery isn't present. If both this shim and jQuery are loaded, Velocity defaults to jQuery proper. */
/* Browser support: Using this shim instead of jQuery proper removes support for IE8. */

(function (window) {
	"use strict";
	/***************
  Setup
  ***************/

	/* If jQuery is already loaded, there's no point in loading this shim. */

	if (window.jQuery) {
		return;
	}

	/* jQuery base. */
	var $ = function $(selector, context) {
		return new $.fn.init(selector, context);
	};

	/********************
  Private Methods
  ********************/

	/* jQuery */
	$.isWindow = function (obj) {
		/* jshint eqeqeq: false */
		return obj && obj === obj.window;
	};

	/* jQuery */
	$.type = function (obj) {
		if (!obj) {
			return obj + "";
		}

		return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
	};

	/* jQuery */
	$.isArray = Array.isArray || function (obj) {
		return $.type(obj) === "array";
	};

	/* jQuery */
	function isArraylike(obj) {
		var length = obj.length,
		    type = $.type(obj);

		if (type === "function" || $.isWindow(obj)) {
			return false;
		}

		if (obj.nodeType === 1 && length) {
			return true;
		}

		return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
	}

	/***************
  $ Methods
  ***************/

	/* jQuery: Support removed for IE<9. */
	$.isPlainObject = function (obj) {
		var key;

		if (!obj || $.type(obj) !== "object" || obj.nodeType || $.isWindow(obj)) {
			return false;
		}

		try {
			if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
				return false;
			}
		} catch (e) {
			return false;
		}

		for (key in obj) {}

		return key === undefined || hasOwn.call(obj, key);
	};

	/* jQuery */
	$.each = function (obj, callback, args) {
		var value,
		    i = 0,
		    length = obj.length,
		    isArray = isArraylike(obj);

		if (args) {
			if (isArray) {
				for (; i < length; i++) {
					value = callback.apply(obj[i], args);

					if (value === false) {
						break;
					}
				}
			} else {
				for (i in obj) {
					if (!obj.hasOwnProperty(i)) {
						continue;
					}
					value = callback.apply(obj[i], args);

					if (value === false) {
						break;
					}
				}
			}
		} else {
			if (isArray) {
				for (; i < length; i++) {
					value = callback.call(obj[i], i, obj[i]);

					if (value === false) {
						break;
					}
				}
			} else {
				for (i in obj) {
					if (!obj.hasOwnProperty(i)) {
						continue;
					}
					value = callback.call(obj[i], i, obj[i]);

					if (value === false) {
						break;
					}
				}
			}
		}

		return obj;
	};

	/* Custom */
	$.data = function (node, key, value) {
		/* $.getData() */
		if (value === undefined) {
			var getId = node[$.expando],
			    store = getId && cache[getId];

			if (key === undefined) {
				return store;
			} else if (store) {
				if (key in store) {
					return store[key];
				}
			}
			/* $.setData() */
		} else if (key !== undefined) {
			var setId = node[$.expando] || (node[$.expando] = ++$.uuid);

			cache[setId] = cache[setId] || {};
			cache[setId][key] = value;

			return value;
		}
	};

	/* Custom */
	$.removeData = function (node, keys) {
		var id = node[$.expando],
		    store = id && cache[id];

		if (store) {
			// Cleanup the entire store if no keys are provided.
			if (!keys) {
				delete cache[id];
			} else {
				$.each(keys, function (_, key) {
					delete store[key];
				});
			}
		}
	};

	/* jQuery */
	$.extend = function () {
		var src,
		    copyIsArray,
		    copy,
		    name,
		    options,
		    clone,
		    target = arguments[0] || {},
		    i = 1,
		    length = arguments.length,
		    deep = false;

		if (typeof target === "boolean") {
			deep = target;

			target = arguments[i] || {};
			i++;
		}

		if ((typeof target === 'undefined' ? 'undefined' : _typeof(target)) !== "object" && $.type(target) !== "function") {
			target = {};
		}

		if (i === length) {
			target = this;
			i--;
		}

		for (; i < length; i++) {
			if (options = arguments[i]) {
				for (name in options) {
					if (!options.hasOwnProperty(name)) {
						continue;
					}
					src = target[name];
					copy = options[name];

					if (target === copy) {
						continue;
					}

					if (deep && copy && ($.isPlainObject(copy) || (copyIsArray = $.isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && $.isArray(src) ? src : [];
						} else {
							clone = src && $.isPlainObject(src) ? src : {};
						}

						target[name] = $.extend(deep, clone, copy);
					} else if (copy !== undefined) {
						target[name] = copy;
					}
				}
			}
		}

		return target;
	};

	/* jQuery 1.4.3 */
	$.queue = function (elem, type, data) {
		function $makeArray(arr, results) {
			var ret = results || [];

			if (arr) {
				if (isArraylike(Object(arr))) {
					/* $.merge */
					(function (first, second) {
						var len = +second.length,
						    j = 0,
						    i = first.length;

						while (j < len) {
							first[i++] = second[j++];
						}

						if (len !== len) {
							while (second[j] !== undefined) {
								first[i++] = second[j++];
							}
						}

						first.length = i;

						return first;
					})(ret, typeof arr === "string" ? [arr] : arr);
				} else {
					[].push.call(ret, arr);
				}
			}

			return ret;
		}

		if (!elem) {
			return;
		}

		type = (type || "fx") + "queue";

		var q = $.data(elem, type);

		if (!data) {
			return q || [];
		}

		if (!q || $.isArray(data)) {
			q = $.data(elem, type, $makeArray(data));
		} else {
			q.push(data);
		}

		return q;
	};

	/* jQuery 1.4.3 */
	$.dequeue = function (elems, type) {
		/* Custom: Embed element iteration. */
		$.each(elems.nodeType ? [elems] : elems, function (i, elem) {
			type = type || "fx";

			var queue = $.queue(elem, type),
			    fn = queue.shift();

			if (fn === "inprogress") {
				fn = queue.shift();
			}

			if (fn) {
				if (type === "fx") {
					queue.unshift("inprogress");
				}

				fn.call(elem, function () {
					$.dequeue(elem, type);
				});
			}
		});
	};

	/******************
  $.fn Methods
  ******************/

	/* jQuery */
	$.fn = $.prototype = {
		init: function init(selector) {
			/* Just return the element wrapped inside an array; don't proceed with the actual jQuery node wrapping process. */
			if (selector.nodeType) {
				this[0] = selector;

				return this;
			} else {
				throw new Error("Not a DOM node.");
			}
		},
		offset: function offset() {
			/* jQuery altered code: Dropped disconnected DOM node checking. */
			var box = this[0].getBoundingClientRect ? this[0].getBoundingClientRect() : { top: 0, left: 0 };

			return {
				top: box.top + (window.pageYOffset || document.scrollTop || 0) - (document.clientTop || 0),
				left: box.left + (window.pageXOffset || document.scrollLeft || 0) - (document.clientLeft || 0)
			};
		},
		position: function position() {
			/* jQuery */
			function offsetParentFn(elem) {
				var offsetParent = elem.offsetParent;

				while (offsetParent && offsetParent.nodeName.toLowerCase() !== "html" && offsetParent.style && offsetParent.style.position === "static") {
					offsetParent = offsetParent.offsetParent;
				}

				return offsetParent || document;
			}

			/* Zepto */
			var elem = this[0],
			    offsetParent = offsetParentFn(elem),
			    offset = this.offset(),
			    parentOffset = /^(?:body|html)$/i.test(offsetParent.nodeName) ? { top: 0, left: 0 } : $(offsetParent).offset();

			offset.top -= parseFloat(elem.style.marginTop) || 0;
			offset.left -= parseFloat(elem.style.marginLeft) || 0;

			if (offsetParent.style) {
				parentOffset.top += parseFloat(offsetParent.style.borderTopWidth) || 0;
				parentOffset.left += parseFloat(offsetParent.style.borderLeftWidth) || 0;
			}

			return {
				top: offset.top - parentOffset.top,
				left: offset.left - parentOffset.left
			};
		}
	};

	/**********************
  Private Variables
  **********************/

	/* For $.data() */
	var cache = {};
	$.expando = "velocity" + new Date().getTime();
	$.uuid = 0;

	/* For $.queue() */
	var class2type = {},
	    hasOwn = class2type.hasOwnProperty,
	    toString = class2type.toString;

	var types = "Boolean Number String Function Array Date RegExp Object Error".split(" ");
	for (var i = 0; i < types.length; i++) {
		class2type["[object " + types[i] + "]"] = types[i].toLowerCase();
	}

	/* Makes $(node) possible, without having to call init. */
	$.fn.init.prototype = $.fn;

	/* Globalize Velocity onto the window, and assign its Utilities property. */
	window.Velocity = { Utilities: $ };
})(window);

/******************
 Velocity.js
 ******************/

(function (factory) {
	"use strict";
	/* CommonJS module. */

	if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
		module.exports = factory();
		/* AMD module. */
	} else if (typeof define === "function" && define.amd) {
		define(factory);
		/* Browser globals. */
	} else {
		factory();
	}
})(function () {
	"use strict";

	return function (global, window, document, undefined) {

		/***************
   Summary
   ***************/

		/*
   - CSS: CSS stack that works independently from the rest of Velocity.
   - animate(): Core animation method that iterates over the targeted elements and queues the incoming call onto each element individually.
   - Pre-Queueing: Prepare the element for animation by instantiating its data cache and processing the call's options.
   - Queueing: The logic that runs once the call has reached its point of execution in the element's $.queue() stack.
   Most logic is placed here to avoid risking it becoming stale (if the element's properties have changed).
   - Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
   - tick(): The single requestAnimationFrame loop responsible for tweening all in-progress calls.
   - completeCall(): Handles the cleanup process for each Velocity call.
   */

		/*********************
   Helper Functions
   *********************/

		/* IE detection. Gist: https://gist.github.com/julianshapiro/9098609 */
		var IE = function () {
			if (document.documentMode) {
				return document.documentMode;
			} else {
				for (var i = 7; i > 4; i--) {
					var div = document.createElement("div");

					div.innerHTML = "<!--[if IE " + i + "]><span></span><![endif]-->";

					if (div.getElementsByTagName("span").length) {
						div = null;

						return i;
					}
				}
			}

			return undefined;
		}();

		/* rAF shim. Gist: https://gist.github.com/julianshapiro/9497513 */
		var rAFShim = function () {
			var timeLast = 0;

			return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
				var timeCurrent = new Date().getTime(),
				    timeDelta;

				/* Dynamically set delay on a per-tick basis to match 60fps. */
				/* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671 */
				timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
				timeLast = timeCurrent + timeDelta;

				return setTimeout(function () {
					callback(timeCurrent + timeDelta);
				}, timeDelta);
			};
		}();

		var performance = function () {
			var perf = window.performance || {};

			if (typeof perf.now !== "function") {
				var nowOffset = perf.timing && perf.timing.navigationStart ? perf.timing.navigationStart : new Date().getTime();

				perf.now = function () {
					return new Date().getTime() - nowOffset;
				};
			}
			return perf;
		}();

		/* Array compacting. Copyright Lo-Dash. MIT License: https://github.com/lodash/lodash/blob/master/LICENSE.txt */
		function compactSparseArray(array) {
			var index = -1,
			    length = array ? array.length : 0,
			    result = [];

			while (++index < length) {
				var value = array[index];

				if (value) {
					result.push(value);
				}
			}

			return result;
		}

		/**
   * Shim for "fixing" IE's lack of support (IE < 9) for applying slice
   * on host objects like NamedNodeMap, NodeList, and HTMLCollection
   * (technically, since host objects have been implementation-dependent,
   * at least before ES2015, IE hasn't needed to work this way).
   * Also works on strings, fixes IE < 9 to allow an explicit undefined
   * for the 2nd argument (as in Firefox), and prevents errors when
   * called on other DOM objects.
   */
		var _slice = function () {
			var slice = Array.prototype.slice;

			try {
				// Can't be used with DOM elements in IE < 9
				slice.call(document.documentElement);
				return slice;
			} catch (e) {
				// Fails in IE < 9

				// This will work for genuine arrays, array-like objects, 
				// NamedNodeMap (attributes, entities, notations),
				// NodeList (e.g., getElementsByTagName), HTMLCollection (e.g., childNodes),
				// and will not fail on other DOM objects (as do DOM elements in IE < 9)
				return function (begin, end) {
					var len = this.length;

					if (typeof begin !== "number") {
						begin = 0;
					}
					// IE < 9 gets unhappy with an undefined end argument
					if (typeof end !== "number") {
						end = len;
					}
					// For native Array objects, we use the native slice function
					if (this.slice) {
						return slice.call(this, begin, end);
					}
					// For array like object we handle it ourselves.
					var i,
					    cloned = [],

					// Handle negative value for "begin"
					start = begin >= 0 ? begin : Math.max(0, len + begin),

					// Handle negative value for "end"
					upTo = end < 0 ? len + end : Math.min(end, len),

					// Actual expected size of the slice
					size = upTo - start;

					if (size > 0) {
						cloned = new Array(size);
						if (this.charAt) {
							for (i = 0; i < size; i++) {
								cloned[i] = this.charAt(start + i);
							}
						} else {
							for (i = 0; i < size; i++) {
								cloned[i] = this[start + i];
							}
						}
					}
					return cloned;
				};
			}
		}();

		/* .indexOf doesn't exist in IE<9 */
		var _inArray = function _inArray() {
			if (Array.prototype.includes) {
				return function (arr, val) {
					return arr.includes(val);
				};
			}
			if (Array.prototype.indexOf) {
				return function (arr, val) {
					return arr.indexOf(val) >= 0;
				};
			}
			return function (arr, val) {
				for (var i = 0; i < arr.length; i++) {
					if (arr[i] === val) {
						return true;
					}
				}
				return false;
			};
		};

		function sanitizeElements(elements) {
			/* Unwrap jQuery/Zepto objects. */
			if (Type.isWrapped(elements)) {
				elements = _slice.call(elements);
				/* Wrap a single element in an array so that $.each() can iterate with the element instead of its node's children. */
			} else if (Type.isNode(elements)) {
				elements = [elements];
			}

			return elements;
		}

		var Type = {
			isNumber: function isNumber(variable) {
				return typeof variable === "number";
			},
			isString: function isString(variable) {
				return typeof variable === "string";
			},
			isArray: Array.isArray || function (variable) {
				return Object.prototype.toString.call(variable) === "[object Array]";
			},
			isFunction: function isFunction(variable) {
				return Object.prototype.toString.call(variable) === "[object Function]";
			},
			isNode: function isNode(variable) {
				return variable && variable.nodeType;
			},
			/* Determine if variable is an array-like wrapped jQuery, Zepto or similar element, or even a NodeList etc. */
			/* NOTE: HTMLFormElements also have a length. */
			isWrapped: function isWrapped(variable) {
				return variable && variable !== window && Type.isNumber(variable.length) && !Type.isString(variable) && !Type.isFunction(variable) && !Type.isNode(variable) && (variable.length === 0 || Type.isNode(variable[0]));
			},
			isSVG: function isSVG(variable) {
				return window.SVGElement && variable instanceof window.SVGElement;
			},
			isEmptyObject: function isEmptyObject(variable) {
				for (var name in variable) {
					if (variable.hasOwnProperty(name)) {
						return false;
					}
				}

				return true;
			}
		};

		/*****************
   Dependencies
   *****************/

		var $,
		    isJQuery = false;

		if (global.fn && global.fn.jquery) {
			$ = global;
			isJQuery = true;
		} else {
			$ = window.Velocity.Utilities;
		}

		if (IE <= 8 && !isJQuery) {
			throw new Error("Velocity: IE8 and below require jQuery to be loaded before Velocity.");
		} else if (IE <= 7) {
			/* Revert to jQuery's $.animate(), and lose Velocity's extra features. */
			jQuery.fn.velocity = jQuery.fn.animate;

			/* Now that $.fn.velocity is aliased, abort this Velocity declaration. */
			return;
		}

		/*****************
   Constants
   *****************/

		var DURATION_DEFAULT = 400,
		    EASING_DEFAULT = "swing";

		/*************
   State
   *************/

		var Velocity = {
			/* Container for page-wide Velocity state data. */
			State: {
				/* Detect mobile devices to determine if mobileHA should be turned on. */
				isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
				/* The mobileHA option's behavior changes on older Android devices (Gingerbread, versions 2.3.3-2.3.7). */
				isAndroid: /Android/i.test(navigator.userAgent),
				isGingerbread: /Android 2\.3\.[3-7]/i.test(navigator.userAgent),
				isChrome: window.chrome,
				isFirefox: /Firefox/i.test(navigator.userAgent),
				/* Create a cached element for re-use when checking for CSS property prefixes. */
				prefixElement: document.createElement("div"),
				/* Cache every prefix match to avoid repeating lookups. */
				prefixMatches: {},
				/* Cache the anchor used for animating window scrolling. */
				scrollAnchor: null,
				/* Cache the browser-specific property names associated with the scroll anchor. */
				scrollPropertyLeft: null,
				scrollPropertyTop: null,
				/* Keep track of whether our RAF tick is running. */
				isTicking: false,
				/* Container for every in-progress call to Velocity. */
				calls: [],
				delayedElements: {
					count: 0
				}
			},
			/* Velocity's custom CSS stack. Made global for unit testing. */
			CSS: {/* Defined below. */},
			/* A shim of the jQuery utility functions used by Velocity -- provided by Velocity's optional jQuery shim. */
			Utilities: $,
			/* Container for the user's custom animation redirects that are referenced by name in place of the properties map argument. */
			Redirects: {/* Manually registered by the user. */},
			Easings: {/* Defined below. */},
			/* Attempt to use ES6 Promises by default. Users can override this with a third-party promises library. */
			Promise: window.Promise,
			/* Velocity option defaults, which can be overriden by the user. */
			defaults: {
				queue: "",
				duration: DURATION_DEFAULT,
				easing: EASING_DEFAULT,
				begin: undefined,
				complete: undefined,
				progress: undefined,
				display: undefined,
				visibility: undefined,
				loop: false,
				delay: false,
				mobileHA: true,
				/* Advanced: Set to false to prevent property values from being cached between consecutive Velocity-initiated chain calls. */
				_cacheValues: true,
				/* Advanced: Set to false if the promise should always resolve on empty element lists. */
				promiseRejectEmpty: true
			},
			/* A design goal of Velocity is to cache data wherever possible in order to avoid DOM requerying. Accordingly, each element has a data cache. */
			init: function init(element) {
				$.data(element, "velocity", {
					/* Store whether this is an SVG element, since its properties are retrieved and updated differently than standard HTML elements. */
					isSVG: Type.isSVG(element),
					/* Keep track of whether the element is currently being animated by Velocity.
      This is used to ensure that property values are not transferred between non-consecutive (stale) calls. */
					isAnimating: false,
					/* A reference to the element's live computedStyle object. Learn more here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
					computedStyle: null,
					/* Tween data is cached for each animation on the element so that data can be passed across calls --
      in particular, end values are used as subsequent start values in consecutive Velocity calls. */
					tweensContainer: null,
					/* The full root property values of each CSS hook being animated on this element are cached so that:
      1) Concurrently-animating hooks sharing the same root can have their root values' merged into one while tweening.
      2) Post-hook-injection root values can be transferred over to consecutively chained Velocity calls as starting root values. */
					rootPropertyValueCache: {},
					/* A cache for transform updates, which must be manually flushed via CSS.flushTransformCache(). */
					transformCache: {}
				});
			},
			/* A parallel to jQuery's $.css(), used for getting/setting Velocity's hooked CSS properties. */
			hook: null, /* Defined below. */
			/* Velocity-wide animation time remapping for testing purposes. */
			mock: false,
			version: { major: 1, minor: 5, patch: 0 },
			/* Set to 1 or 2 (most verbose) to output debug info to console. */
			debug: false,
			/* Use rAF high resolution timestamp when available */
			timestamp: true,
			/* Pause all animations */
			pauseAll: function pauseAll(queueName) {
				var currentTime = new Date().getTime();

				$.each(Velocity.State.calls, function (i, activeCall) {

					if (activeCall) {

						/* If we have a queueName and this call is not on that queue, skip */
						if (queueName !== undefined && (activeCall[2].queue !== queueName || activeCall[2].queue === false)) {
							return true;
						}

						/* Set call to paused */
						activeCall[5] = {
							resume: false
						};
					}
				});

				/* Pause timers on any currently delayed calls */
				$.each(Velocity.State.delayedElements, function (k, element) {
					if (!element) {
						return;
					}
					pauseDelayOnElement(element, currentTime);
				});
			},
			/* Resume all animations */
			resumeAll: function resumeAll(queueName) {
				var currentTime = new Date().getTime();

				$.each(Velocity.State.calls, function (i, activeCall) {

					if (activeCall) {

						/* If we have a queueName and this call is not on that queue, skip */
						if (queueName !== undefined && (activeCall[2].queue !== queueName || activeCall[2].queue === false)) {
							return true;
						}

						/* Set call to resumed if it was paused */
						if (activeCall[5]) {
							activeCall[5].resume = true;
						}
					}
				});
				/* Resume timers on any currently delayed calls */
				$.each(Velocity.State.delayedElements, function (k, element) {
					if (!element) {
						return;
					}
					resumeDelayOnElement(element, currentTime);
				});
			}
		};

		/* Retrieve the appropriate scroll anchor and property name for the browser: https://developer.mozilla.org/en-US/docs/Web/API/Window.scrollY */
		if (window.pageYOffset !== undefined) {
			Velocity.State.scrollAnchor = window;
			Velocity.State.scrollPropertyLeft = "pageXOffset";
			Velocity.State.scrollPropertyTop = "pageYOffset";
		} else {
			Velocity.State.scrollAnchor = document.documentElement || document.body.parentNode || document.body;
			Velocity.State.scrollPropertyLeft = "scrollLeft";
			Velocity.State.scrollPropertyTop = "scrollTop";
		}

		/* Shorthand alias for jQuery's $.data() utility. */
		function Data(element) {
			/* Hardcode a reference to the plugin name. */
			var response = $.data(element, "velocity");

			/* jQuery <=1.4.2 returns null instead of undefined when no match is found. We normalize this behavior. */
			return response === null ? undefined : response;
		}

		/**************
   Delay Timer
   **************/

		function pauseDelayOnElement(element, currentTime) {
			/* Check for any delay timers, and pause the set timeouts (while preserving time data)
    to be resumed when the "resume" command is issued */
			var data = Data(element);
			if (data && data.delayTimer && !data.delayPaused) {
				data.delayRemaining = data.delay - currentTime + data.delayBegin;
				data.delayPaused = true;
				clearTimeout(data.delayTimer.setTimeout);
			}
		}

		function resumeDelayOnElement(element, currentTime) {
			/* Check for any paused timers and resume */
			var data = Data(element);
			if (data && data.delayTimer && data.delayPaused) {
				/* If the element was mid-delay, re initiate the timeout with the remaining delay */
				data.delayPaused = false;
				data.delayTimer.setTimeout = setTimeout(data.delayTimer.next, data.delayRemaining);
			}
		}

		/**************
   Easing
   **************/

		/* Step easing generator. */
		function generateStep(steps) {
			return function (p) {
				return Math.round(p * steps) * (1 / steps);
			};
		}

		/* Bezier curve function generator. Copyright Gaetan Renaudeau. MIT License: http://en.wikipedia.org/wiki/MIT_License */
		function generateBezier(mX1, mY1, mX2, mY2) {
			var NEWTON_ITERATIONS = 4,
			    NEWTON_MIN_SLOPE = 0.001,
			    SUBDIVISION_PRECISION = 0.0000001,
			    SUBDIVISION_MAX_ITERATIONS = 10,
			    kSplineTableSize = 11,
			    kSampleStepSize = 1.0 / (kSplineTableSize - 1.0),
			    float32ArraySupported = "Float32Array" in window;

			/* Must contain four arguments. */
			if (arguments.length !== 4) {
				return false;
			}

			/* Arguments must be numbers. */
			for (var i = 0; i < 4; ++i) {
				if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
					return false;
				}
			}

			/* X values must be in the [0, 1] range. */
			mX1 = Math.min(mX1, 1);
			mX2 = Math.min(mX2, 1);
			mX1 = Math.max(mX1, 0);
			mX2 = Math.max(mX2, 0);

			var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

			function A(aA1, aA2) {
				return 1.0 - 3.0 * aA2 + 3.0 * aA1;
			}
			function B(aA1, aA2) {
				return 3.0 * aA2 - 6.0 * aA1;
			}
			function C(aA1) {
				return 3.0 * aA1;
			}

			function calcBezier(aT, aA1, aA2) {
				return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
			}

			function getSlope(aT, aA1, aA2) {
				return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
			}

			function newtonRaphsonIterate(aX, aGuessT) {
				for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
					var currentSlope = getSlope(aGuessT, mX1, mX2);

					if (currentSlope === 0.0) {
						return aGuessT;
					}

					var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
					aGuessT -= currentX / currentSlope;
				}

				return aGuessT;
			}

			function calcSampleValues() {
				for (var i = 0; i < kSplineTableSize; ++i) {
					mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
				}
			}

			function binarySubdivide(aX, aA, aB) {
				var currentX,
				    currentT,
				    i = 0;

				do {
					currentT = aA + (aB - aA) / 2.0;
					currentX = calcBezier(currentT, mX1, mX2) - aX;
					if (currentX > 0.0) {
						aB = currentT;
					} else {
						aA = currentT;
					}
				} while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);

				return currentT;
			}

			function getTForX(aX) {
				var intervalStart = 0.0,
				    currentSample = 1,
				    lastSample = kSplineTableSize - 1;

				for (; currentSample !== lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
					intervalStart += kSampleStepSize;
				}

				--currentSample;

				var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample + 1] - mSampleValues[currentSample]),
				    guessForT = intervalStart + dist * kSampleStepSize,
				    initialSlope = getSlope(guessForT, mX1, mX2);

				if (initialSlope >= NEWTON_MIN_SLOPE) {
					return newtonRaphsonIterate(aX, guessForT);
				} else if (initialSlope === 0.0) {
					return guessForT;
				} else {
					return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
				}
			}

			var _precomputed = false;

			function precompute() {
				_precomputed = true;
				if (mX1 !== mY1 || mX2 !== mY2) {
					calcSampleValues();
				}
			}

			var f = function f(aX) {
				if (!_precomputed) {
					precompute();
				}
				if (mX1 === mY1 && mX2 === mY2) {
					return aX;
				}
				if (aX === 0) {
					return 0;
				}
				if (aX === 1) {
					return 1;
				}

				return calcBezier(getTForX(aX), mY1, mY2);
			};

			f.getControlPoints = function () {
				return [{ x: mX1, y: mY1 }, { x: mX2, y: mY2 }];
			};

			var str = "generateBezier(" + [mX1, mY1, mX2, mY2] + ")";
			f.toString = function () {
				return str;
			};

			return f;
		}

		/* Runge-Kutta spring physics function generator. Adapted from Framer.js, copyright Koen Bok. MIT License: http://en.wikipedia.org/wiki/MIT_License */
		/* Given a tension, friction, and duration, a simulation at 60FPS will first run without a defined duration in order to calculate the full path. A second pass
   then adjusts the time delta -- using the relation between actual time and duration -- to calculate the path for the duration-constrained animation. */
		var generateSpringRK4 = function () {
			function springAccelerationForState(state) {
				return -state.tension * state.x - state.friction * state.v;
			}

			function springEvaluateStateWithDerivative(initialState, dt, derivative) {
				var state = {
					x: initialState.x + derivative.dx * dt,
					v: initialState.v + derivative.dv * dt,
					tension: initialState.tension,
					friction: initialState.friction
				};

				return { dx: state.v, dv: springAccelerationForState(state) };
			}

			function springIntegrateState(state, dt) {
				var a = {
					dx: state.v,
					dv: springAccelerationForState(state)
				},
				    b = springEvaluateStateWithDerivative(state, dt * 0.5, a),
				    c = springEvaluateStateWithDerivative(state, dt * 0.5, b),
				    d = springEvaluateStateWithDerivative(state, dt, c),
				    dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx),
				    dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);

				state.x = state.x + dxdt * dt;
				state.v = state.v + dvdt * dt;

				return state;
			}

			return function springRK4Factory(tension, friction, duration) {

				var initState = {
					x: -1,
					v: 0,
					tension: null,
					friction: null
				},
				    path = [0],
				    time_lapsed = 0,
				    tolerance = 1 / 10000,
				    DT = 16 / 1000,
				    have_duration,
				    dt,
				    last_state;

				tension = parseFloat(tension) || 500;
				friction = parseFloat(friction) || 20;
				duration = duration || null;

				initState.tension = tension;
				initState.friction = friction;

				have_duration = duration !== null;

				/* Calculate the actual time it takes for this animation to complete with the provided conditions. */
				if (have_duration) {
					/* Run the simulation without a duration. */
					time_lapsed = springRK4Factory(tension, friction);
					/* Compute the adjusted time delta. */
					dt = time_lapsed / duration * DT;
				} else {
					dt = DT;
				}

				while (true) {
					/* Next/step function .*/
					last_state = springIntegrateState(last_state || initState, dt);
					/* Store the position. */
					path.push(1 + last_state.x);
					time_lapsed += 16;
					/* If the change threshold is reached, break. */
					if (!(Math.abs(last_state.x) > tolerance && Math.abs(last_state.v) > tolerance)) {
						break;
					}
				}

				/* If duration is not defined, return the actual time required for completing this animation. Otherwise, return a closure that holds the
     computed path and returns a snapshot of the position according to a given percentComplete. */
				return !have_duration ? time_lapsed : function (percentComplete) {
					return path[percentComplete * (path.length - 1) | 0];
				};
			};
		}();

		/* jQuery easings. */
		Velocity.Easings = {
			linear: function linear(p) {
				return p;
			},
			swing: function swing(p) {
				return 0.5 - Math.cos(p * Math.PI) / 2;
			},
			/* Bonus "spring" easing, which is a less exaggerated version of easeInOutElastic. */
			spring: function spring(p) {
				return 1 - Math.cos(p * 4.5 * Math.PI) * Math.exp(-p * 6);
			}
		};

		/* CSS3 and Robert Penner easings. */
		$.each([["ease", [0.25, 0.1, 0.25, 1.0]], ["ease-in", [0.42, 0.0, 1.00, 1.0]], ["ease-out", [0.00, 0.0, 0.58, 1.0]], ["ease-in-out", [0.42, 0.0, 0.58, 1.0]], ["easeInSine", [0.47, 0, 0.745, 0.715]], ["easeOutSine", [0.39, 0.575, 0.565, 1]], ["easeInOutSine", [0.445, 0.05, 0.55, 0.95]], ["easeInQuad", [0.55, 0.085, 0.68, 0.53]], ["easeOutQuad", [0.25, 0.46, 0.45, 0.94]], ["easeInOutQuad", [0.455, 0.03, 0.515, 0.955]], ["easeInCubic", [0.55, 0.055, 0.675, 0.19]], ["easeOutCubic", [0.215, 0.61, 0.355, 1]], ["easeInOutCubic", [0.645, 0.045, 0.355, 1]], ["easeInQuart", [0.895, 0.03, 0.685, 0.22]], ["easeOutQuart", [0.165, 0.84, 0.44, 1]], ["easeInOutQuart", [0.77, 0, 0.175, 1]], ["easeInQuint", [0.755, 0.05, 0.855, 0.06]], ["easeOutQuint", [0.23, 1, 0.32, 1]], ["easeInOutQuint", [0.86, 0, 0.07, 1]], ["easeInExpo", [0.95, 0.05, 0.795, 0.035]], ["easeOutExpo", [0.19, 1, 0.22, 1]], ["easeInOutExpo", [1, 0, 0, 1]], ["easeInCirc", [0.6, 0.04, 0.98, 0.335]], ["easeOutCirc", [0.075, 0.82, 0.165, 1]], ["easeInOutCirc", [0.785, 0.135, 0.15, 0.86]]], function (i, easingArray) {
			Velocity.Easings[easingArray[0]] = generateBezier.apply(null, easingArray[1]);
		});

		/* Determine the appropriate easing type given an easing input. */
		function getEasing(value, duration) {
			var easing = value;

			/* The easing option can either be a string that references a pre-registered easing,
    or it can be a two-/four-item array of integers to be converted into a bezier/spring function. */
			if (Type.isString(value)) {
				/* Ensure that the easing has been assigned to jQuery's Velocity.Easings object. */
				if (!Velocity.Easings[value]) {
					easing = false;
				}
			} else if (Type.isArray(value) && value.length === 1) {
				easing = generateStep.apply(null, value);
			} else if (Type.isArray(value) && value.length === 2) {
				/* springRK4 must be passed the animation's duration. */
				/* Note: If the springRK4 array contains non-numbers, generateSpringRK4() returns an easing
     function generated with default tension and friction values. */
				easing = generateSpringRK4.apply(null, value.concat([duration]));
			} else if (Type.isArray(value) && value.length === 4) {
				/* Note: If the bezier array contains non-numbers, generateBezier() returns false. */
				easing = generateBezier.apply(null, value);
			} else {
				easing = false;
			}

			/* Revert to the Velocity-wide default easing type, or fall back to "swing" (which is also jQuery's default)
    if the Velocity-wide default has been incorrectly modified. */
			if (easing === false) {
				if (Velocity.Easings[Velocity.defaults.easing]) {
					easing = Velocity.defaults.easing;
				} else {
					easing = EASING_DEFAULT;
				}
			}

			return easing;
		}

		/*****************
   CSS Stack
   *****************/

		/* The CSS object is a highly condensed and performant CSS stack that fully replaces jQuery's.
   It handles the validation, getting, and setting of both standard CSS properties and CSS property hooks. */
		/* Note: A "CSS" shorthand is aliased so that our code is easier to read. */
		var CSS = Velocity.CSS = {
			/*************
    RegEx
    *************/

			RegEx: {
				isHex: /^#([A-f\d]{3}){1,2}$/i,
				/* Unwrap a property value's surrounding text, e.g. "rgba(4, 3, 2, 1)" ==> "4, 3, 2, 1" and "rect(4px 3px 2px 1px)" ==> "4px 3px 2px 1px". */
				valueUnwrap: /^[A-z]+\((.*)\)$/i,
				wrappedValueAlreadyExtracted: /[0-9.]+ [0-9.]+ [0-9.]+( [0-9.]+)?/,
				/* Split a multi-value property into an array of subvalues, e.g. "rgba(4, 3, 2, 1) 4px 3px 2px 1px" ==> [ "rgba(4, 3, 2, 1)", "4px", "3px", "2px", "1px" ]. */
				valueSplit: /([A-z]+\(.+\))|(([A-z0-9#-.]+?)(?=\s|$))/ig
			},
			/************
    Lists
    ************/

			Lists: {
				colors: ["fill", "stroke", "stopColor", "color", "backgroundColor", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor"],
				transformsBase: ["translateX", "translateY", "scale", "scaleX", "scaleY", "skewX", "skewY", "rotateZ"],
				transforms3D: ["transformPerspective", "translateZ", "scaleZ", "rotateX", "rotateY"],
				units: ["%", // relative
				"em", "ex", "ch", "rem", // font relative
				"vw", "vh", "vmin", "vmax", // viewport relative
				"cm", "mm", "Q", "in", "pc", "pt", "px", // absolute lengths
				"deg", "grad", "rad", "turn", // angles
				"s", "ms" // time
				],
				colorNames: {
					"aliceblue": "240,248,255",
					"antiquewhite": "250,235,215",
					"aquamarine": "127,255,212",
					"aqua": "0,255,255",
					"azure": "240,255,255",
					"beige": "245,245,220",
					"bisque": "255,228,196",
					"black": "0,0,0",
					"blanchedalmond": "255,235,205",
					"blueviolet": "138,43,226",
					"blue": "0,0,255",
					"brown": "165,42,42",
					"burlywood": "222,184,135",
					"cadetblue": "95,158,160",
					"chartreuse": "127,255,0",
					"chocolate": "210,105,30",
					"coral": "255,127,80",
					"cornflowerblue": "100,149,237",
					"cornsilk": "255,248,220",
					"crimson": "220,20,60",
					"cyan": "0,255,255",
					"darkblue": "0,0,139",
					"darkcyan": "0,139,139",
					"darkgoldenrod": "184,134,11",
					"darkgray": "169,169,169",
					"darkgrey": "169,169,169",
					"darkgreen": "0,100,0",
					"darkkhaki": "189,183,107",
					"darkmagenta": "139,0,139",
					"darkolivegreen": "85,107,47",
					"darkorange": "255,140,0",
					"darkorchid": "153,50,204",
					"darkred": "139,0,0",
					"darksalmon": "233,150,122",
					"darkseagreen": "143,188,143",
					"darkslateblue": "72,61,139",
					"darkslategray": "47,79,79",
					"darkturquoise": "0,206,209",
					"darkviolet": "148,0,211",
					"deeppink": "255,20,147",
					"deepskyblue": "0,191,255",
					"dimgray": "105,105,105",
					"dimgrey": "105,105,105",
					"dodgerblue": "30,144,255",
					"firebrick": "178,34,34",
					"floralwhite": "255,250,240",
					"forestgreen": "34,139,34",
					"fuchsia": "255,0,255",
					"gainsboro": "220,220,220",
					"ghostwhite": "248,248,255",
					"gold": "255,215,0",
					"goldenrod": "218,165,32",
					"gray": "128,128,128",
					"grey": "128,128,128",
					"greenyellow": "173,255,47",
					"green": "0,128,0",
					"honeydew": "240,255,240",
					"hotpink": "255,105,180",
					"indianred": "205,92,92",
					"indigo": "75,0,130",
					"ivory": "255,255,240",
					"khaki": "240,230,140",
					"lavenderblush": "255,240,245",
					"lavender": "230,230,250",
					"lawngreen": "124,252,0",
					"lemonchiffon": "255,250,205",
					"lightblue": "173,216,230",
					"lightcoral": "240,128,128",
					"lightcyan": "224,255,255",
					"lightgoldenrodyellow": "250,250,210",
					"lightgray": "211,211,211",
					"lightgrey": "211,211,211",
					"lightgreen": "144,238,144",
					"lightpink": "255,182,193",
					"lightsalmon": "255,160,122",
					"lightseagreen": "32,178,170",
					"lightskyblue": "135,206,250",
					"lightslategray": "119,136,153",
					"lightsteelblue": "176,196,222",
					"lightyellow": "255,255,224",
					"limegreen": "50,205,50",
					"lime": "0,255,0",
					"linen": "250,240,230",
					"magenta": "255,0,255",
					"maroon": "128,0,0",
					"mediumaquamarine": "102,205,170",
					"mediumblue": "0,0,205",
					"mediumorchid": "186,85,211",
					"mediumpurple": "147,112,219",
					"mediumseagreen": "60,179,113",
					"mediumslateblue": "123,104,238",
					"mediumspringgreen": "0,250,154",
					"mediumturquoise": "72,209,204",
					"mediumvioletred": "199,21,133",
					"midnightblue": "25,25,112",
					"mintcream": "245,255,250",
					"mistyrose": "255,228,225",
					"moccasin": "255,228,181",
					"navajowhite": "255,222,173",
					"navy": "0,0,128",
					"oldlace": "253,245,230",
					"olivedrab": "107,142,35",
					"olive": "128,128,0",
					"orangered": "255,69,0",
					"orange": "255,165,0",
					"orchid": "218,112,214",
					"palegoldenrod": "238,232,170",
					"palegreen": "152,251,152",
					"paleturquoise": "175,238,238",
					"palevioletred": "219,112,147",
					"papayawhip": "255,239,213",
					"peachpuff": "255,218,185",
					"peru": "205,133,63",
					"pink": "255,192,203",
					"plum": "221,160,221",
					"powderblue": "176,224,230",
					"purple": "128,0,128",
					"red": "255,0,0",
					"rosybrown": "188,143,143",
					"royalblue": "65,105,225",
					"saddlebrown": "139,69,19",
					"salmon": "250,128,114",
					"sandybrown": "244,164,96",
					"seagreen": "46,139,87",
					"seashell": "255,245,238",
					"sienna": "160,82,45",
					"silver": "192,192,192",
					"skyblue": "135,206,235",
					"slateblue": "106,90,205",
					"slategray": "112,128,144",
					"snow": "255,250,250",
					"springgreen": "0,255,127",
					"steelblue": "70,130,180",
					"tan": "210,180,140",
					"teal": "0,128,128",
					"thistle": "216,191,216",
					"tomato": "255,99,71",
					"turquoise": "64,224,208",
					"violet": "238,130,238",
					"wheat": "245,222,179",
					"whitesmoke": "245,245,245",
					"white": "255,255,255",
					"yellowgreen": "154,205,50",
					"yellow": "255,255,0"
				}
			},
			/************
    Hooks
    ************/

			/* Hooks allow a subproperty (e.g. "boxShadowBlur") of a compound-value CSS property
    (e.g. "boxShadow: X Y Blur Spread Color") to be animated as if it were a discrete property. */
			/* Note: Beyond enabling fine-grained property animation, hooking is necessary since Velocity only
    tweens properties with single numeric values; unlike CSS transitions, Velocity does not interpolate compound-values. */
			Hooks: {
				/********************
     Registration
     ********************/

				/* Templates are a concise way of indicating which subproperties must be individually registered for each compound-value CSS property. */
				/* Each template consists of the compound-value's base name, its constituent subproperty names, and those subproperties' default values. */
				templates: {
					"textShadow": ["Color X Y Blur", "black 0px 0px 0px"],
					"boxShadow": ["Color X Y Blur Spread", "black 0px 0px 0px 0px"],
					"clip": ["Top Right Bottom Left", "0px 0px 0px 0px"],
					"backgroundPosition": ["X Y", "0% 0%"],
					"transformOrigin": ["X Y Z", "50% 50% 0px"],
					"perspectiveOrigin": ["X Y", "50% 50%"]
				},
				/* A "registered" hook is one that has been converted from its template form into a live,
     tweenable property. It contains data to associate it with its root property. */
				registered: {
					/* Note: A registered hook looks like this ==> textShadowBlur: [ "textShadow", 3 ],
      which consists of the subproperty's name, the associated root property's name,
      and the subproperty's position in the root's value. */
				},
				/* Convert the templates into individual hooks then append them to the registered object above. */
				register: function register() {
					/* Color hooks registration: Colors are defaulted to white -- as opposed to black -- since colors that are
      currently set to "transparent" default to their respective template below when color-animated,
      and white is typically a closer match to transparent than black is. An exception is made for text ("color"),
      which is almost always set closer to black than white. */
					for (var i = 0; i < CSS.Lists.colors.length; i++) {
						var rgbComponents = CSS.Lists.colors[i] === "color" ? "0 0 0 1" : "255 255 255 1";
						CSS.Hooks.templates[CSS.Lists.colors[i]] = ["Red Green Blue Alpha", rgbComponents];
					}

					var rootProperty, hookTemplate, hookNames;

					/* In IE, color values inside compound-value properties are positioned at the end the value instead of at the beginning.
      Thus, we re-arrange the templates accordingly. */
					if (IE) {
						for (rootProperty in CSS.Hooks.templates) {
							if (!CSS.Hooks.templates.hasOwnProperty(rootProperty)) {
								continue;
							}
							hookTemplate = CSS.Hooks.templates[rootProperty];
							hookNames = hookTemplate[0].split(" ");

							var defaultValues = hookTemplate[1].match(CSS.RegEx.valueSplit);

							if (hookNames[0] === "Color") {
								/* Reposition both the hook's name and its default value to the end of their respective strings. */
								hookNames.push(hookNames.shift());
								defaultValues.push(defaultValues.shift());

								/* Replace the existing template for the hook's root property. */
								CSS.Hooks.templates[rootProperty] = [hookNames.join(" "), defaultValues.join(" ")];
							}
						}
					}

					/* Hook registration. */
					for (rootProperty in CSS.Hooks.templates) {
						if (!CSS.Hooks.templates.hasOwnProperty(rootProperty)) {
							continue;
						}
						hookTemplate = CSS.Hooks.templates[rootProperty];
						hookNames = hookTemplate[0].split(" ");

						for (var j in hookNames) {
							if (!hookNames.hasOwnProperty(j)) {
								continue;
							}
							var fullHookName = rootProperty + hookNames[j],
							    hookPosition = j;

							/* For each hook, register its full name (e.g. textShadowBlur) with its root property (e.g. textShadow)
        and the hook's position in its template's default value string. */
							CSS.Hooks.registered[fullHookName] = [rootProperty, hookPosition];
						}
					}
				},
				/*****************************
     Injection and Extraction
     *****************************/

				/* Look up the root property associated with the hook (e.g. return "textShadow" for "textShadowBlur"). */
				/* Since a hook cannot be set directly (the browser won't recognize it), style updating for hooks is routed through the hook's root property. */
				getRoot: function getRoot(property) {
					var hookData = CSS.Hooks.registered[property];

					if (hookData) {
						return hookData[0];
					} else {
						/* If there was no hook match, return the property name untouched. */
						return property;
					}
				},
				getUnit: function getUnit(str, start) {
					var unit = (str.substr(start || 0, 5).match(/^[a-z%]+/) || [])[0] || "";

					if (unit && _inArray(CSS.Lists.units, unit)) {
						return unit;
					}
					return "";
				},
				fixColors: function fixColors(str) {
					return str.replace(/(rgba?\(\s*)?(\b[a-z]+\b)/g, function ($0, $1, $2) {
						if (CSS.Lists.colorNames.hasOwnProperty($2)) {
							return ($1 ? $1 : "rgba(") + CSS.Lists.colorNames[$2] + ($1 ? "" : ",1)");
						}
						return $1 + $2;
					});
				},
				/* Convert any rootPropertyValue, null or otherwise, into a space-delimited list of hook values so that
     the targeted hook can be injected or extracted at its standard position. */
				cleanRootPropertyValue: function cleanRootPropertyValue(rootProperty, rootPropertyValue) {
					/* If the rootPropertyValue is wrapped with "rgb()", "clip()", etc., remove the wrapping to normalize the value before manipulation. */
					if (CSS.RegEx.valueUnwrap.test(rootPropertyValue)) {
						rootPropertyValue = rootPropertyValue.match(CSS.RegEx.valueUnwrap)[1];
					}

					/* If rootPropertyValue is a CSS null-value (from which there's inherently no hook value to extract),
      default to the root's default value as defined in CSS.Hooks.templates. */
					/* Note: CSS null-values include "none", "auto", and "transparent". They must be converted into their
      zero-values (e.g. textShadow: "none" ==> textShadow: "0px 0px 0px black") for hook manipulation to proceed. */
					if (CSS.Values.isCSSNullValue(rootPropertyValue)) {
						rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
					}

					return rootPropertyValue;
				},
				/* Extracted the hook's value from its root property's value. This is used to get the starting value of an animating hook. */
				extractValue: function extractValue(fullHookName, rootPropertyValue) {
					var hookData = CSS.Hooks.registered[fullHookName];

					if (hookData) {
						var hookRoot = hookData[0],
						    hookPosition = hookData[1];

						rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

						/* Split rootPropertyValue into its constituent hook values then grab the desired hook at its standard position. */
						return rootPropertyValue.toString().match(CSS.RegEx.valueSplit)[hookPosition];
					} else {
						/* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
						return rootPropertyValue;
					}
				},
				/* Inject the hook's value into its root property's value. This is used to piece back together the root property
     once Velocity has updated one of its individually hooked values through tweening. */
				injectValue: function injectValue(fullHookName, hookValue, rootPropertyValue) {
					var hookData = CSS.Hooks.registered[fullHookName];

					if (hookData) {
						var hookRoot = hookData[0],
						    hookPosition = hookData[1],
						    rootPropertyValueParts,
						    rootPropertyValueUpdated;

						rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

						/* Split rootPropertyValue into its individual hook values, replace the targeted value with hookValue,
       then reconstruct the rootPropertyValue string. */
						rootPropertyValueParts = rootPropertyValue.toString().match(CSS.RegEx.valueSplit);
						rootPropertyValueParts[hookPosition] = hookValue;
						rootPropertyValueUpdated = rootPropertyValueParts.join(" ");

						return rootPropertyValueUpdated;
					} else {
						/* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
						return rootPropertyValue;
					}
				}
			},
			/*******************
    Normalizations
    *******************/

			/* Normalizations standardize CSS property manipulation by pollyfilling browser-specific implementations (e.g. opacity)
    and reformatting special properties (e.g. clip, rgba) to look like standard ones. */
			Normalizations: {
				/* Normalizations are passed a normalization target (either the property's name, its extracted value, or its injected value),
     the targeted element (which may need to be queried), and the targeted property value. */
				registered: {
					clip: function clip(type, element, propertyValue) {
						switch (type) {
							case "name":
								return "clip";
							/* Clip needs to be unwrapped and stripped of its commas during extraction. */
							case "extract":
								var extracted;

								/* If Velocity also extracted this value, skip extraction. */
								if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
									extracted = propertyValue;
								} else {
									/* Remove the "rect()" wrapper. */
									extracted = propertyValue.toString().match(CSS.RegEx.valueUnwrap);

									/* Strip off commas. */
									extracted = extracted ? extracted[1].replace(/,(\s+)?/g, " ") : propertyValue;
								}

								return extracted;
							/* Clip needs to be re-wrapped during injection. */
							case "inject":
								return "rect(" + propertyValue + ")";
						}
					},
					blur: function blur(type, element, propertyValue) {
						switch (type) {
							case "name":
								return Velocity.State.isFirefox ? "filter" : "-webkit-filter";
							case "extract":
								var extracted = parseFloat(propertyValue);

								/* If extracted is NaN, meaning the value isn't already extracted. */
								if (!(extracted || extracted === 0)) {
									var blurComponent = propertyValue.toString().match(/blur\(([0-9]+[A-z]+)\)/i);

									/* If the filter string had a blur component, return just the blur value and unit type. */
									if (blurComponent) {
										extracted = blurComponent[1];
										/* If the component doesn't exist, default blur to 0. */
									} else {
										extracted = 0;
									}
								}

								return extracted;
							/* Blur needs to be re-wrapped during injection. */
							case "inject":
								/* For the blur effect to be fully de-applied, it needs to be set to "none" instead of 0. */
								if (!parseFloat(propertyValue)) {
									return "none";
								} else {
									return "blur(" + propertyValue + ")";
								}
						}
					},
					/* <=IE8 do not support the standard opacity property. They use filter:alpha(opacity=INT) instead. */
					opacity: function opacity(type, element, propertyValue) {
						if (IE <= 8) {
							switch (type) {
								case "name":
									return "filter";
								case "extract":
									/* <=IE8 return a "filter" value of "alpha(opacity=\d{1,3})".
          Extract the value and convert it to a decimal value to match the standard CSS opacity property's formatting. */
									var extracted = propertyValue.toString().match(/alpha\(opacity=(.*)\)/i);

									if (extracted) {
										/* Convert to decimal value. */
										propertyValue = extracted[1] / 100;
									} else {
										/* When extracting opacity, default to 1 since a null value means opacity hasn't been set. */
										propertyValue = 1;
									}

									return propertyValue;
								case "inject":
									/* Opacified elements are required to have their zoom property set to a non-zero value. */
									element.style.zoom = 1;

									/* Setting the filter property on elements with certain font property combinations can result in a
          highly unappealing ultra-bolding effect. There's no way to remedy this throughout a tween, but dropping the
          value altogether (when opacity hits 1) at leasts ensures that the glitch is gone post-tweening. */
									if (parseFloat(propertyValue) >= 1) {
										return "";
									} else {
										/* As per the filter property's spec, convert the decimal value to a whole number and wrap the value. */
										return "alpha(opacity=" + parseInt(parseFloat(propertyValue) * 100, 10) + ")";
									}
							}
							/* With all other browsers, normalization is not required; return the same values that were passed in. */
						} else {
							switch (type) {
								case "name":
									return "opacity";
								case "extract":
									return propertyValue;
								case "inject":
									return propertyValue;
							}
						}
					}
				},
				/*****************************
     Batched Registrations
     *****************************/

				/* Note: Batched normalizations extend the CSS.Normalizations.registered object. */
				register: function register() {

					/*****************
      Transforms
      *****************/

					/* Transforms are the subproperties contained by the CSS "transform" property. Transforms must undergo normalization
      so that they can be referenced in a properties map by their individual names. */
					/* Note: When transforms are "set", they are actually assigned to a per-element transformCache. When all transform
      setting is complete complete, CSS.flushTransformCache() must be manually called to flush the values to the DOM.
      Transform setting is batched in this way to improve performance: the transform style only needs to be updated
      once when multiple transform subproperties are being animated simultaneously. */
					/* Note: IE9 and Android Gingerbread have support for 2D -- but not 3D -- transforms. Since animating unsupported
      transform properties results in the browser ignoring the *entire* transform string, we prevent these 3D values
      from being normalized for these browsers so that tweening skips these properties altogether
      (since it will ignore them as being unsupported by the browser.) */
					if ((!IE || IE > 9) && !Velocity.State.isGingerbread) {
						/* Note: Since the standalone CSS "perspective" property and the CSS transform "perspective" subproperty
       share the same name, the latter is given a unique token within Velocity: "transformPerspective". */
						CSS.Lists.transformsBase = CSS.Lists.transformsBase.concat(CSS.Lists.transforms3D);
					}

					for (var i = 0; i < CSS.Lists.transformsBase.length; i++) {
						/* Wrap the dynamically generated normalization function in a new scope so that transformName's value is
       paired with its respective function. (Otherwise, all functions would take the final for loop's transformName.) */
						(function () {
							var transformName = CSS.Lists.transformsBase[i];

							CSS.Normalizations.registered[transformName] = function (type, element, propertyValue) {
								switch (type) {
									/* The normalized property name is the parent "transform" property -- the property that is actually set in CSS. */
									case "name":
										return "transform";
									/* Transform values are cached onto a per-element transformCache object. */
									case "extract":
										/* If this transform has yet to be assigned a value, return its null value. */
										if (Data(element) === undefined || Data(element).transformCache[transformName] === undefined) {
											/* Scale CSS.Lists.transformsBase default to 1 whereas all other transform properties default to 0. */
											return (/^scale/i.test(transformName) ? 1 : 0
											);
											/* When transform values are set, they are wrapped in parentheses as per the CSS spec.
            Thus, when extracting their values (for tween calculations), we strip off the parentheses. */
										}
										return Data(element).transformCache[transformName].replace(/[()]/g, "");
									case "inject":
										var invalid = false;

										/* If an individual transform property contains an unsupported unit type, the browser ignores the *entire* transform property.
           Thus, protect users from themselves by skipping setting for transform values supplied with invalid unit types. */
										/* Switch on the base transform type; ignore the axis by removing the last letter from the transform's name. */
										switch (transformName.substr(0, transformName.length - 1)) {
											/* Whitelist unit types for each transform. */
											case "translate":
												invalid = !/(%|px|em|rem|vw|vh|\d)$/i.test(propertyValue);
												break;
											/* Since an axis-free "scale" property is supported as well, a little hack is used here to detect it by chopping off its last letter. */
											case "scal":
											case "scale":
												/* Chrome on Android has a bug in which scaled elements blur if their initial scale
             value is below 1 (which can happen with forcefeeding). Thus, we detect a yet-unset scale property
             and ensure that its first value is always 1. More info: http://stackoverflow.com/questions/10417890/css3-animations-with-transform-causes-blurred-elements-on-webkit/10417962#10417962 */
												if (Velocity.State.isAndroid && Data(element).transformCache[transformName] === undefined && propertyValue < 1) {
													propertyValue = 1;
												}

												invalid = !/(\d)$/i.test(propertyValue);
												break;
											case "skew":
												invalid = !/(deg|\d)$/i.test(propertyValue);
												break;
											case "rotate":
												invalid = !/(deg|\d)$/i.test(propertyValue);
												break;
										}

										if (!invalid) {
											/* As per the CSS spec, wrap the value in parentheses. */
											Data(element).transformCache[transformName] = "(" + propertyValue + ")";
										}

										/* Although the value is set on the transformCache object, return the newly-updated value for the calling code to process as normal. */
										return Data(element).transformCache[transformName];
								}
							};
						})();
					}

					/*************
      Colors
      *************/

					/* Since Velocity only animates a single numeric value per property, color animation is achieved by hooking the individual RGBA components of CSS color properties.
      Accordingly, color values must be normalized (e.g. "#ff0000", "red", and "rgb(255, 0, 0)" ==> "255 0 0 1") so that their components can be injected/extracted by CSS.Hooks logic. */
					for (var j = 0; j < CSS.Lists.colors.length; j++) {
						/* Wrap the dynamically generated normalization function in a new scope so that colorName's value is paired with its respective function.
       (Otherwise, all functions would take the final for loop's colorName.) */
						(function () {
							var colorName = CSS.Lists.colors[j];

							/* Note: In IE<=8, which support rgb but not rgba, color properties are reverted to rgb by stripping off the alpha component. */
							CSS.Normalizations.registered[colorName] = function (type, element, propertyValue) {
								switch (type) {
									case "name":
										return colorName;
									/* Convert all color values into the rgb format. (Old IE can return hex values and color names instead of rgb/rgba.) */
									case "extract":
										var extracted;

										/* If the color is already in its hookable form (e.g. "255 255 255 1") due to having been previously extracted, skip extraction. */
										if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
											extracted = propertyValue;
										} else {
											var converted,
											    colorNames = {
												black: "rgb(0, 0, 0)",
												blue: "rgb(0, 0, 255)",
												gray: "rgb(128, 128, 128)",
												green: "rgb(0, 128, 0)",
												red: "rgb(255, 0, 0)",
												white: "rgb(255, 255, 255)"
											};

											/* Convert color names to rgb. */
											if (/^[A-z]+$/i.test(propertyValue)) {
												if (colorNames[propertyValue] !== undefined) {
													converted = colorNames[propertyValue];
												} else {
													/* If an unmatched color name is provided, default to black. */
													converted = colorNames.black;
												}
												/* Convert hex values to rgb. */
											} else if (CSS.RegEx.isHex.test(propertyValue)) {
												converted = "rgb(" + CSS.Values.hexToRgb(propertyValue).join(" ") + ")";
												/* If the provided color doesn't match any of the accepted color formats, default to black. */
											} else if (!/^rgba?\(/i.test(propertyValue)) {
												converted = colorNames.black;
											}

											/* Remove the surrounding "rgb/rgba()" string then replace commas with spaces and strip
            repeated spaces (in case the value included spaces to begin with). */
											extracted = (converted || propertyValue).toString().match(CSS.RegEx.valueUnwrap)[1].replace(/,(\s+)?/g, " ");
										}

										/* So long as this isn't <=IE8, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
										if ((!IE || IE > 8) && extracted.split(" ").length === 3) {
											extracted += " 1";
										}

										return extracted;
									case "inject":
										/* If we have a pattern then it might already have the right values */
										if (/^rgb/.test(propertyValue)) {
											return propertyValue;
										}

										/* If this is IE<=8 and an alpha component exists, strip it off. */
										if (IE <= 8) {
											if (propertyValue.split(" ").length === 4) {
												propertyValue = propertyValue.split(/\s+/).slice(0, 3).join(" ");
											}
											/* Otherwise, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
										} else if (propertyValue.split(" ").length === 3) {
											propertyValue += " 1";
										}

										/* Re-insert the browser-appropriate wrapper("rgb/rgba()"), insert commas, and strip off decimal units
           on all values but the fourth (R, G, and B only accept whole numbers). */
										return (IE <= 8 ? "rgb" : "rgba") + "(" + propertyValue.replace(/\s+/g, ",").replace(/\.(\d)+(?=,)/g, "") + ")";
								}
							};
						})();
					}

					/**************
      Dimensions
      **************/
					function augmentDimension(name, element, wantInner) {
						var isBorderBox = CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() === "border-box";

						if (isBorderBox === (wantInner || false)) {
							/* in box-sizing mode, the CSS width / height accessors already give the outerWidth / outerHeight. */
							var i,
							    value,
							    augment = 0,
							    sides = name === "width" ? ["Left", "Right"] : ["Top", "Bottom"],
							    fields = ["padding" + sides[0], "padding" + sides[1], "border" + sides[0] + "Width", "border" + sides[1] + "Width"];

							for (i = 0; i < fields.length; i++) {
								value = parseFloat(CSS.getPropertyValue(element, fields[i]));
								if (!isNaN(value)) {
									augment += value;
								}
							}
							return wantInner ? -augment : augment;
						}
						return 0;
					}
					function getDimension(name, wantInner) {
						return function (type, element, propertyValue) {
							switch (type) {
								case "name":
									return name;
								case "extract":
									return parseFloat(propertyValue) + augmentDimension(name, element, wantInner);
								case "inject":
									return parseFloat(propertyValue) - augmentDimension(name, element, wantInner) + "px";
							}
						};
					}
					CSS.Normalizations.registered.innerWidth = getDimension("width", true);
					CSS.Normalizations.registered.innerHeight = getDimension("height", true);
					CSS.Normalizations.registered.outerWidth = getDimension("width");
					CSS.Normalizations.registered.outerHeight = getDimension("height");
				}
			},
			/************************
    CSS Property Names
    ************************/

			Names: {
				/* Camelcase a property name into its JavaScript notation (e.g. "background-color" ==> "backgroundColor").
     Camelcasing is used to normalize property names between and across calls. */
				camelCase: function camelCase(property) {
					return property.replace(/-(\w)/g, function (match, subMatch) {
						return subMatch.toUpperCase();
					});
				},
				/* For SVG elements, some properties (namely, dimensional ones) are GET/SET via the element's HTML attributes (instead of via CSS styles). */
				SVGAttribute: function SVGAttribute(property) {
					var SVGAttributes = "width|height|x|y|cx|cy|r|rx|ry|x1|x2|y1|y2";

					/* Certain browsers require an SVG transform to be applied as an attribute. (Otherwise, application via CSS is preferable due to 3D support.) */
					if (IE || Velocity.State.isAndroid && !Velocity.State.isChrome) {
						SVGAttributes += "|transform";
					}

					return new RegExp("^(" + SVGAttributes + ")$", "i").test(property);
				},
				/* Determine whether a property should be set with a vendor prefix. */
				/* If a prefixed version of the property exists, return it. Otherwise, return the original property name.
     If the property is not at all supported by the browser, return a false flag. */
				prefixCheck: function prefixCheck(property) {
					/* If this property has already been checked, return the cached value. */
					if (Velocity.State.prefixMatches[property]) {
						return [Velocity.State.prefixMatches[property], true];
					} else {
						var vendors = ["", "Webkit", "Moz", "ms", "O"];

						for (var i = 0, vendorsLength = vendors.length; i < vendorsLength; i++) {
							var propertyPrefixed;

							if (i === 0) {
								propertyPrefixed = property;
							} else {
								/* Capitalize the first letter of the property to conform to JavaScript vendor prefix notation (e.g. webkitFilter). */
								propertyPrefixed = vendors[i] + property.replace(/^\w/, function (match) {
									return match.toUpperCase();
								});
							}

							/* Check if the browser supports this property as prefixed. */
							if (Type.isString(Velocity.State.prefixElement.style[propertyPrefixed])) {
								/* Cache the match. */
								Velocity.State.prefixMatches[property] = propertyPrefixed;

								return [propertyPrefixed, true];
							}
						}

						/* If the browser doesn't support this property in any form, include a false flag so that the caller can decide how to proceed. */
						return [property, false];
					}
				}
			},
			/************************
    CSS Property Values
    ************************/

			Values: {
				/* Hex to RGB conversion. Copyright Tim Down: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
				hexToRgb: function hexToRgb(hex) {
					var shortformRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
					    longformRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,
					    rgbParts;

					hex = hex.replace(shortformRegex, function (m, r, g, b) {
						return r + r + g + g + b + b;
					});

					rgbParts = longformRegex.exec(hex);

					return rgbParts ? [parseInt(rgbParts[1], 16), parseInt(rgbParts[2], 16), parseInt(rgbParts[3], 16)] : [0, 0, 0];
				},
				isCSSNullValue: function isCSSNullValue(value) {
					/* The browser defaults CSS values that have not been set to either 0 or one of several possible null-value strings.
      Thus, we check for both falsiness and these special strings. */
					/* Null-value checking is performed to default the special strings to 0 (for the sake of tweening) or their hook
      templates as defined as CSS.Hooks (for the sake of hook injection/extraction). */
					/* Note: Chrome returns "rgba(0, 0, 0, 0)" for an undefined color whereas IE returns "transparent". */
					return !value || /^(none|auto|transparent|(rgba\(0, ?0, ?0, ?0\)))$/i.test(value);
				},
				/* Retrieve a property's default unit type. Used for assigning a unit type when one is not supplied by the user. */
				getUnitType: function getUnitType(property) {
					if (/^(rotate|skew)/i.test(property)) {
						return "deg";
					} else if (/(^(scale|scaleX|scaleY|scaleZ|alpha|flexGrow|flexHeight|zIndex|fontWeight)$)|((opacity|red|green|blue|alpha)$)/i.test(property)) {
						/* The above properties are unitless. */
						return "";
					} else {
						/* Default to px for all other properties. */
						return "px";
					}
				},
				/* HTML elements default to an associated display type when they're not set to display:none. */
				/* Note: This function is used for correctly setting the non-"none" display value in certain Velocity redirects, such as fadeIn/Out. */
				getDisplayType: function getDisplayType(element) {
					var tagName = element && element.tagName.toString().toLowerCase();

					if (/^(b|big|i|small|tt|abbr|acronym|cite|code|dfn|em|kbd|strong|samp|var|a|bdo|br|img|map|object|q|script|span|sub|sup|button|input|label|select|textarea)$/i.test(tagName)) {
						return "inline";
					} else if (/^(li)$/i.test(tagName)) {
						return "list-item";
					} else if (/^(tr)$/i.test(tagName)) {
						return "table-row";
					} else if (/^(table)$/i.test(tagName)) {
						return "table";
					} else if (/^(tbody)$/i.test(tagName)) {
						return "table-row-group";
						/* Default to "block" when no match is found. */
					} else {
						return "block";
					}
				},
				/* The class add/remove functions are used to temporarily apply a "velocity-animating" class to elements while they're animating. */
				addClass: function addClass(element, className) {
					if (element) {
						if (element.classList) {
							element.classList.add(className);
						} else if (Type.isString(element.className)) {
							// Element.className is around 15% faster then set/getAttribute
							element.className += (element.className.length ? " " : "") + className;
						} else {
							// Work around for IE strict mode animating SVG - and anything else that doesn't behave correctly - the same way jQuery does it
							var currentClass = element.getAttribute(IE <= 7 ? "className" : "class") || "";

							element.setAttribute("class", currentClass + (currentClass ? " " : "") + className);
						}
					}
				},
				removeClass: function removeClass(element, className) {
					if (element) {
						if (element.classList) {
							element.classList.remove(className);
						} else if (Type.isString(element.className)) {
							// Element.className is around 15% faster then set/getAttribute
							// TODO: Need some jsperf tests on performance - can we get rid of the regex and maybe use split / array manipulation?
							element.className = element.className.toString().replace(new RegExp("(^|\\s)" + className.split(" ").join("|") + "(\\s|$)", "gi"), " ");
						} else {
							// Work around for IE strict mode animating SVG - and anything else that doesn't behave correctly - the same way jQuery does it
							var currentClass = element.getAttribute(IE <= 7 ? "className" : "class") || "";

							element.setAttribute("class", currentClass.replace(new RegExp("(^|\s)" + className.split(" ").join("|") + "(\s|$)", "gi"), " "));
						}
					}
				}
			},
			/****************************
    Style Getting & Setting
    ****************************/

			/* The singular getPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
			getPropertyValue: function getPropertyValue(element, property, rootPropertyValue, forceStyleLookup) {
				/* Get an element's computed property value. */
				/* Note: Retrieving the value of a CSS property cannot simply be performed by checking an element's
     style attribute (which only reflects user-defined values). Instead, the browser must be queried for a property's
     *computed* value. You can read more about getComputedStyle here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
				function computePropertyValue(element, property) {
					/* When box-sizing isn't set to border-box, height and width style values are incorrectly computed when an
      element's scrollbars are visible (which expands the element's dimensions). Thus, we defer to the more accurate
      offsetHeight/Width property, which includes the total dimensions for interior, border, padding, and scrollbar.
      We subtract border and padding to get the sum of interior + scrollbar. */
					var computedValue = 0;

					/* IE<=8 doesn't support window.getComputedStyle, thus we defer to jQuery, which has an extensive array
      of hacks to accurately retrieve IE8 property values. Re-implementing that logic here is not worth bloating the
      codebase for a dying browser. The performance repercussions of using jQuery here are minimal since
      Velocity is optimized to rarely (and sometimes never) query the DOM. Further, the $.css() codepath isn't that slow. */
					if (IE <= 8) {
						computedValue = $.css(element, property); /* GET */
						/* All other browsers support getComputedStyle. The returned live object reference is cached onto its
       associated element so that it does not need to be refetched upon every GET. */
					} else {
						/* Browsers do not return height and width values for elements that are set to display:"none". Thus, we temporarily
       toggle display to the element type's default value. */
						var toggleDisplay = false;

						if (/^(width|height)$/.test(property) && CSS.getPropertyValue(element, "display") === 0) {
							toggleDisplay = true;
							CSS.setPropertyValue(element, "display", CSS.Values.getDisplayType(element));
						}

						var revertDisplay = function revertDisplay() {
							if (toggleDisplay) {
								CSS.setPropertyValue(element, "display", "none");
							}
						};

						if (!forceStyleLookup) {
							if (property === "height" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
								var contentBoxHeight = element.offsetHeight - (parseFloat(CSS.getPropertyValue(element, "borderTopWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderBottomWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingTop")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingBottom")) || 0);
								revertDisplay();

								return contentBoxHeight;
							} else if (property === "width" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
								var contentBoxWidth = element.offsetWidth - (parseFloat(CSS.getPropertyValue(element, "borderLeftWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderRightWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingLeft")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingRight")) || 0);
								revertDisplay();

								return contentBoxWidth;
							}
						}

						var computedStyle;

						/* For elements that Velocity hasn't been called on directly (e.g. when Velocity queries the DOM on behalf
       of a parent of an element its animating), perform a direct getComputedStyle lookup since the object isn't cached. */
						if (Data(element) === undefined) {
							computedStyle = window.getComputedStyle(element, null); /* GET */
							/* If the computedStyle object has yet to be cached, do so now. */
						} else if (!Data(element).computedStyle) {
							computedStyle = Data(element).computedStyle = window.getComputedStyle(element, null); /* GET */
							/* If computedStyle is cached, use it. */
						} else {
							computedStyle = Data(element).computedStyle;
						}

						/* IE and Firefox do not return a value for the generic borderColor -- they only return individual values for each border side's color.
       Also, in all browsers, when border colors aren't all the same, a compound value is returned that Velocity isn't setup to parse.
       So, as a polyfill for querying individual border side colors, we just return the top border's color and animate all borders from that value. */
						if (property === "borderColor") {
							property = "borderTopColor";
						}

						/* IE9 has a bug in which the "filter" property must be accessed from computedStyle using the getPropertyValue method
       instead of a direct property lookup. The getPropertyValue method is slower than a direct lookup, which is why we avoid it by default. */
						if (IE === 9 && property === "filter") {
							computedValue = computedStyle.getPropertyValue(property); /* GET */
						} else {
							computedValue = computedStyle[property];
						}

						/* Fall back to the property's style value (if defined) when computedValue returns nothing,
       which can happen when the element hasn't been painted. */
						if (computedValue === "" || computedValue === null) {
							computedValue = element.style[property];
						}

						revertDisplay();
					}

					/* For top, right, bottom, and left (TRBL) values that are set to "auto" on elements of "fixed" or "absolute" position,
      defer to jQuery for converting "auto" to a numeric value. (For elements with a "static" or "relative" position, "auto" has the same
      effect as being set to 0, so no conversion is necessary.) */
					/* An example of why numeric conversion is necessary: When an element with "position:absolute" has an untouched "left"
      property, which reverts to "auto", left's value is 0 relative to its parent element, but is often non-zero relative
      to its *containing* (not parent) element, which is the nearest "position:relative" ancestor or the viewport (and always the viewport in the case of "position:fixed"). */
					if (computedValue === "auto" && /^(top|right|bottom|left)$/i.test(property)) {
						var position = computePropertyValue(element, "position"); /* GET */

						/* For absolute positioning, jQuery's $.position() only returns values for top and left;
       right and bottom will have their "auto" value reverted to 0. */
						/* Note: A jQuery object must be created here since jQuery doesn't have a low-level alias for $.position().
       Not a big deal since we're currently in a GET batch anyway. */
						if (position === "fixed" || position === "absolute" && /top|left/i.test(property)) {
							/* Note: jQuery strips the pixel unit from its returned values; we re-add it here to conform with computePropertyValue's behavior. */
							computedValue = $(element).position()[property] + "px"; /* GET */
						}
					}

					return computedValue;
				}

				var propertyValue;

				/* If this is a hooked property (e.g. "clipLeft" instead of the root property of "clip"),
     extract the hook's value from a normalized rootPropertyValue using CSS.Hooks.extractValue(). */
				if (CSS.Hooks.registered[property]) {
					var hook = property,
					    hookRoot = CSS.Hooks.getRoot(hook);

					/* If a cached rootPropertyValue wasn't passed in (which Velocity always attempts to do in order to avoid requerying the DOM),
      query the DOM for the root property's value. */
					if (rootPropertyValue === undefined) {
						/* Since the browser is now being directly queried, use the official post-prefixing property name for this lookup. */
						rootPropertyValue = CSS.getPropertyValue(element, CSS.Names.prefixCheck(hookRoot)[0]); /* GET */
					}

					/* If this root has a normalization registered, peform the associated normalization extraction. */
					if (CSS.Normalizations.registered[hookRoot]) {
						rootPropertyValue = CSS.Normalizations.registered[hookRoot]("extract", element, rootPropertyValue);
					}

					/* Extract the hook's value. */
					propertyValue = CSS.Hooks.extractValue(hook, rootPropertyValue);

					/* If this is a normalized property (e.g. "opacity" becomes "filter" in <=IE8) or "translateX" becomes "transform"),
      normalize the property's name and value, and handle the special case of transforms. */
					/* Note: Normalizing a property is mutually exclusive from hooking a property since hook-extracted values are strictly
      numerical and therefore do not require normalization extraction. */
				} else if (CSS.Normalizations.registered[property]) {
					var normalizedPropertyName, normalizedPropertyValue;

					normalizedPropertyName = CSS.Normalizations.registered[property]("name", element);

					/* Transform values are calculated via normalization extraction (see below), which checks against the element's transformCache.
      At no point do transform GETs ever actually query the DOM; initial stylesheet values are never processed.
      This is because parsing 3D transform matrices is not always accurate and would bloat our codebase;
      thus, normalization extraction defaults initial transform values to their zero-values (e.g. 1 for scaleX and 0 for translateX). */
					if (normalizedPropertyName !== "transform") {
						normalizedPropertyValue = computePropertyValue(element, CSS.Names.prefixCheck(normalizedPropertyName)[0]); /* GET */

						/* If the value is a CSS null-value and this property has a hook template, use that zero-value template so that hooks can be extracted from it. */
						if (CSS.Values.isCSSNullValue(normalizedPropertyValue) && CSS.Hooks.templates[property]) {
							normalizedPropertyValue = CSS.Hooks.templates[property][1];
						}
					}

					propertyValue = CSS.Normalizations.registered[property]("extract", element, normalizedPropertyValue);
				}

				/* If a (numeric) value wasn't produced via hook extraction or normalization, query the DOM. */
				if (!/^[\d-]/.test(propertyValue)) {
					/* For SVG elements, dimensional properties (which SVGAttribute() detects) are tweened via
      their HTML attribute values instead of their CSS style values. */
					var data = Data(element);

					if (data && data.isSVG && CSS.Names.SVGAttribute(property)) {
						/* Since the height/width attribute values must be set manually, they don't reflect computed values.
       Thus, we use use getBBox() to ensure we always get values for elements with undefined height/width attributes. */
						if (/^(height|width)$/i.test(property)) {
							/* Firefox throws an error if .getBBox() is called on an SVG that isn't attached to the DOM. */
							try {
								propertyValue = element.getBBox()[property];
							} catch (error) {
								propertyValue = 0;
							}
							/* Otherwise, access the attribute value directly. */
						} else {
							propertyValue = element.getAttribute(property);
						}
					} else {
						propertyValue = computePropertyValue(element, CSS.Names.prefixCheck(property)[0]); /* GET */
					}
				}

				/* Since property lookups are for animation purposes (which entails computing the numeric delta between start and end values),
     convert CSS null-values to an integer of value 0. */
				if (CSS.Values.isCSSNullValue(propertyValue)) {
					propertyValue = 0;
				}

				if (Velocity.debug >= 2) {
					console.log("Get " + property + ": " + propertyValue);
				}

				return propertyValue;
			},
			/* The singular setPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
			setPropertyValue: function setPropertyValue(element, property, propertyValue, rootPropertyValue, scrollData) {
				var propertyName = property;

				/* In order to be subjected to call options and element queueing, scroll animation is routed through Velocity as if it were a standard CSS property. */
				if (property === "scroll") {
					/* If a container option is present, scroll the container instead of the browser window. */
					if (scrollData.container) {
						scrollData.container["scroll" + scrollData.direction] = propertyValue;
						/* Otherwise, Velocity defaults to scrolling the browser window. */
					} else {
						if (scrollData.direction === "Left") {
							window.scrollTo(propertyValue, scrollData.alternateValue);
						} else {
							window.scrollTo(scrollData.alternateValue, propertyValue);
						}
					}
				} else {
					/* Transforms (translateX, rotateZ, etc.) are applied to a per-element transformCache object, which is manually flushed via flushTransformCache().
      Thus, for now, we merely cache transforms being SET. */
					if (CSS.Normalizations.registered[property] && CSS.Normalizations.registered[property]("name", element) === "transform") {
						/* Perform a normalization injection. */
						/* Note: The normalization logic handles the transformCache updating. */
						CSS.Normalizations.registered[property]("inject", element, propertyValue);

						propertyName = "transform";
						propertyValue = Data(element).transformCache[property];
					} else {
						/* Inject hooks. */
						if (CSS.Hooks.registered[property]) {
							var hookName = property,
							    hookRoot = CSS.Hooks.getRoot(property);

							/* If a cached rootPropertyValue was not provided, query the DOM for the hookRoot's current value. */
							rootPropertyValue = rootPropertyValue || CSS.getPropertyValue(element, hookRoot); /* GET */

							propertyValue = CSS.Hooks.injectValue(hookName, propertyValue, rootPropertyValue);
							property = hookRoot;
						}

						/* Normalize names and values. */
						if (CSS.Normalizations.registered[property]) {
							propertyValue = CSS.Normalizations.registered[property]("inject", element, propertyValue);
							property = CSS.Normalizations.registered[property]("name", element);
						}

						/* Assign the appropriate vendor prefix before performing an official style update. */
						propertyName = CSS.Names.prefixCheck(property)[0];

						/* A try/catch is used for IE<=8, which throws an error when "invalid" CSS values are set, e.g. a negative width.
       Try/catch is avoided for other browsers since it incurs a performance overhead. */
						if (IE <= 8) {
							try {
								element.style[propertyName] = propertyValue;
							} catch (error) {
								if (Velocity.debug) {
									console.log("Browser does not support [" + propertyValue + "] for [" + propertyName + "]");
								}
							}
							/* SVG elements have their dimensional properties (width, height, x, y, cx, etc.) applied directly as attributes instead of as styles. */
							/* Note: IE8 does not support SVG elements, so it's okay that we skip it for SVG animation. */
						} else {
							var data = Data(element);

							if (data && data.isSVG && CSS.Names.SVGAttribute(property)) {
								/* Note: For SVG attributes, vendor-prefixed property names are never used. */
								/* Note: Not all CSS properties can be animated via attributes, but the browser won't throw an error for unsupported properties. */
								element.setAttribute(property, propertyValue);
							} else {
								element.style[propertyName] = propertyValue;
							}
						}

						if (Velocity.debug >= 2) {
							console.log("Set " + property + " (" + propertyName + "): " + propertyValue);
						}
					}
				}

				/* Return the normalized property name and value in case the caller wants to know how these values were modified before being applied to the DOM. */
				return [propertyName, propertyValue];
			},
			/* To increase performance by batching transform updates into a single SET, transforms are not directly applied to an element until flushTransformCache() is called. */
			/* Note: Velocity applies transform properties in the same order that they are chronogically introduced to the element's CSS styles. */
			flushTransformCache: function flushTransformCache(element) {
				var transformString = "",
				    data = Data(element);

				/* Certain browsers require that SVG transforms be applied as an attribute. However, the SVG transform attribute takes a modified version of CSS's transform string
     (units are dropped and, except for skewX/Y, subproperties are merged into their master property -- e.g. scaleX and scaleY are merged into scale(X Y). */
				if ((IE || Velocity.State.isAndroid && !Velocity.State.isChrome) && data && data.isSVG) {
					/* Since transform values are stored in their parentheses-wrapped form, we use a helper function to strip out their numeric values.
      Further, SVG transform properties only take unitless (representing pixels) values, so it's okay that parseFloat() strips the unit suffixed to the float value. */
					var getTransformFloat = function getTransformFloat(transformProperty) {
						return parseFloat(CSS.getPropertyValue(element, transformProperty));
					};

					/* Create an object to organize all the transforms that we'll apply to the SVG element. To keep the logic simple,
      we process *all* transform properties -- even those that may not be explicitly applied (since they default to their zero-values anyway). */
					var SVGTransforms = {
						translate: [getTransformFloat("translateX"), getTransformFloat("translateY")],
						skewX: [getTransformFloat("skewX")], skewY: [getTransformFloat("skewY")],
						/* If the scale property is set (non-1), use that value for the scaleX and scaleY values
       (this behavior mimics the result of animating all these properties at once on HTML elements). */
						scale: getTransformFloat("scale") !== 1 ? [getTransformFloat("scale"), getTransformFloat("scale")] : [getTransformFloat("scaleX"), getTransformFloat("scaleY")],
						/* Note: SVG's rotate transform takes three values: rotation degrees followed by the X and Y values
       defining the rotation's origin point. We ignore the origin values (default them to 0). */
						rotate: [getTransformFloat("rotateZ"), 0, 0]
					};

					/* Iterate through the transform properties in the user-defined property map order.
      (This mimics the behavior of non-SVG transform animation.) */
					$.each(Data(element).transformCache, function (transformName) {
						/* Except for with skewX/Y, revert the axis-specific transform subproperties to their axis-free master
       properties so that they match up with SVG's accepted transform properties. */
						if (/^translate/i.test(transformName)) {
							transformName = "translate";
						} else if (/^scale/i.test(transformName)) {
							transformName = "scale";
						} else if (/^rotate/i.test(transformName)) {
							transformName = "rotate";
						}

						/* Check that we haven't yet deleted the property from the SVGTransforms container. */
						if (SVGTransforms[transformName]) {
							/* Append the transform property in the SVG-supported transform format. As per the spec, surround the space-delimited values in parentheses. */
							transformString += transformName + "(" + SVGTransforms[transformName].join(" ") + ")" + " ";

							/* After processing an SVG transform property, delete it from the SVGTransforms container so we don't
        re-insert the same master property if we encounter another one of its axis-specific properties. */
							delete SVGTransforms[transformName];
						}
					});
				} else {
					var transformValue, perspective;

					/* Transform properties are stored as members of the transformCache object. Concatenate all the members into a string. */
					$.each(Data(element).transformCache, function (transformName) {
						transformValue = Data(element).transformCache[transformName];

						/* Transform's perspective subproperty must be set first in order to take effect. Store it temporarily. */
						if (transformName === "transformPerspective") {
							perspective = transformValue;
							return true;
						}

						/* IE9 only supports one rotation type, rotateZ, which it refers to as "rotate". */
						if (IE === 9 && transformName === "rotateZ") {
							transformName = "rotate";
						}

						transformString += transformName + transformValue + " ";
					});

					/* If present, set the perspective subproperty first. */
					if (perspective) {
						transformString = "perspective" + perspective + " " + transformString;
					}
				}

				CSS.setPropertyValue(element, "transform", transformString);
			}
		};

		/* Register hooks and normalizations. */
		CSS.Hooks.register();
		CSS.Normalizations.register();

		/* Allow hook setting in the same fashion as jQuery's $.css(). */
		Velocity.hook = function (elements, arg2, arg3) {
			var value;

			elements = sanitizeElements(elements);

			$.each(elements, function (i, element) {
				/* Initialize Velocity's per-element data cache if this element hasn't previously been animated. */
				if (Data(element) === undefined) {
					Velocity.init(element);
				}

				/* Get property value. If an element set was passed in, only return the value for the first element. */
				if (arg3 === undefined) {
					if (value === undefined) {
						value = CSS.getPropertyValue(element, arg2);
					}
					/* Set property value. */
				} else {
					/* sPV returns an array of the normalized propertyName/propertyValue pair used to update the DOM. */
					var adjustedSet = CSS.setPropertyValue(element, arg2, arg3);

					/* Transform properties don't automatically set. They have to be flushed to the DOM. */
					if (adjustedSet[0] === "transform") {
						Velocity.CSS.flushTransformCache(element);
					}

					value = adjustedSet;
				}
			});

			return value;
		};

		/*****************
   Animation
   *****************/

		var animate = function animate() {
			var opts;

			/******************
    Call Chain
    ******************/

			/* Logic for determining what to return to the call stack when exiting out of Velocity. */
			function getChain() {
				/* If we are using the utility function, attempt to return this call's promise. If no promise library was detected,
     default to null instead of returning the targeted elements so that utility function's return value is standardized. */
				if (isUtility) {
					return promiseData.promise || null;
					/* Otherwise, if we're using $.fn, return the jQuery-/Zepto-wrapped element set. */
				} else {
					return elementsWrapped;
				}
			}

			/*************************
    Arguments Assignment
    *************************/

			/* To allow for expressive CoffeeScript code, Velocity supports an alternative syntax in which "elements" (or "e"), "properties" (or "p"), and "options" (or "o")
    objects are defined on a container object that's passed in as Velocity's sole argument. */
			/* Note: Some browsers automatically populate arguments with a "properties" object. We detect it by checking for its default "names" property. */
			var syntacticSugar = arguments[0] && (arguments[0].p || $.isPlainObject(arguments[0].properties) && !arguments[0].properties.names || Type.isString(arguments[0].properties)),

			/* Whether Velocity was called via the utility function (as opposed to on a jQuery/Zepto object). */
			isUtility,

			/* When Velocity is called via the utility function ($.Velocity()/Velocity()), elements are explicitly
    passed in as the first parameter. Thus, argument positioning varies. We normalize them here. */
			elementsWrapped,
			    argumentIndex;

			var elements, propertiesMap, options;

			/* Detect jQuery/Zepto elements being animated via the $.fn method. */
			if (Type.isWrapped(this)) {
				isUtility = false;

				argumentIndex = 0;
				elements = this;
				elementsWrapped = this;
				/* Otherwise, raw elements are being animated via the utility function. */
			} else {
				isUtility = true;

				argumentIndex = 1;
				elements = syntacticSugar ? arguments[0].elements || arguments[0].e : arguments[0];
			}

			/***************
    Promises
    ***************/

			var promiseData = {
				promise: null,
				resolver: null,
				rejecter: null
			};

			/* If this call was made via the utility function (which is the default method of invocation when jQuery/Zepto are not being used), and if
    promise support was detected, create a promise object for this call and store references to its resolver and rejecter methods. The resolve
    method is used when a call completes naturally or is prematurely stopped by the user. In both cases, completeCall() handles the associated
    call cleanup and promise resolving logic. The reject method is used when an invalid set of arguments is passed into a Velocity call. */
			/* Note: Velocity employs a call-based queueing architecture, which means that stopping an animating element actually stops the full call that
    triggered it -- not that one element exclusively. Similarly, there is one promise per call, and all elements targeted by a Velocity call are
    grouped together for the purposes of resolving and rejecting a promise. */
			if (isUtility && Velocity.Promise) {
				promiseData.promise = new Velocity.Promise(function (resolve, reject) {
					promiseData.resolver = resolve;
					promiseData.rejecter = reject;
				});
			}

			if (syntacticSugar) {
				propertiesMap = arguments[0].properties || arguments[0].p;
				options = arguments[0].options || arguments[0].o;
			} else {
				propertiesMap = arguments[argumentIndex];
				options = arguments[argumentIndex + 1];
			}

			elements = sanitizeElements(elements);

			if (!elements) {
				if (promiseData.promise) {
					if (!propertiesMap || !options || options.promiseRejectEmpty !== false) {
						promiseData.rejecter();
					} else {
						promiseData.resolver();
					}
				}
				return;
			}

			/* The length of the element set (in the form of a nodeList or an array of elements) is defaulted to 1 in case a
    single raw DOM element is passed in (which doesn't contain a length property). */
			var elementsLength = elements.length,
			    elementsIndex = 0;

			/***************************
    Argument Overloading
    ***************************/

			/* Support is included for jQuery's argument overloading: $.animate(propertyMap [, duration] [, easing] [, complete]).
    Overloading is detected by checking for the absence of an object being passed into options. */
			/* Note: The stop/finish/pause/resume actions do not accept animation options, and are therefore excluded from this check. */
			if (!/^(stop|finish|finishAll|pause|resume)$/i.test(propertiesMap) && !$.isPlainObject(options)) {
				/* The utility function shifts all arguments one position to the right, so we adjust for that offset. */
				var startingArgumentPosition = argumentIndex + 1;

				options = {};

				/* Iterate through all options arguments */
				for (var i = startingArgumentPosition; i < arguments.length; i++) {
					/* Treat a number as a duration. Parse it out. */
					/* Note: The following RegEx will return true if passed an array with a number as its first item.
      Thus, arrays are skipped from this check. */
					if (!Type.isArray(arguments[i]) && (/^(fast|normal|slow)$/i.test(arguments[i]) || /^\d/.test(arguments[i]))) {
						options.duration = arguments[i];
						/* Treat strings and arrays as easings. */
					} else if (Type.isString(arguments[i]) || Type.isArray(arguments[i])) {
						options.easing = arguments[i];
						/* Treat a function as a complete callback. */
					} else if (Type.isFunction(arguments[i])) {
						options.complete = arguments[i];
					}
				}
			}

			/*********************
    Action Detection
    *********************/

			/* Velocity's behavior is categorized into "actions": Elements can either be specially scrolled into view,
    or they can be started, stopped, paused, resumed, or reversed . If a literal or referenced properties map is passed in as Velocity's
    first argument, the associated action is "start". Alternatively, "scroll", "reverse", "pause", "resume" or "stop" can be passed in 
    instead of a properties map. */
			var action;

			switch (propertiesMap) {
				case "scroll":
					action = "scroll";
					break;

				case "reverse":
					action = "reverse";
					break;

				case "pause":

					/*******************
      Action: Pause
      *******************/

					var currentTime = new Date().getTime();

					/* Handle delay timers */
					$.each(elements, function (i, element) {
						pauseDelayOnElement(element, currentTime);
					});

					/* Pause and Resume are call-wide (not on a per element basis). Thus, calling pause or resume on a 
      single element will cause any calls that containt tweens for that element to be paused/resumed
      as well. */

					/* Iterate through all calls and pause any that contain any of our elements */
					$.each(Velocity.State.calls, function (i, activeCall) {

						var found = false;
						/* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
						if (activeCall) {
							/* Iterate through the active call's targeted elements. */
							$.each(activeCall[1], function (k, activeElement) {
								var queueName = options === undefined ? "" : options;

								if (queueName !== true && activeCall[2].queue !== queueName && !(options === undefined && activeCall[2].queue === false)) {
									return true;
								}

								/* Iterate through the calls targeted by the stop command. */
								$.each(elements, function (l, element) {
									/* Check that this call was applied to the target element. */
									if (element === activeElement) {

										/* Set call to paused */
										activeCall[5] = {
											resume: false
										};

										/* Once we match an element, we can bounce out to the next call entirely */
										found = true;
										return false;
									}
								});

								/* Proceed to check next call if we have already matched */
								if (found) {
									return false;
								}
							});
						}
					});

					/* Since pause creates no new tweens, exit out of Velocity. */
					return getChain();

				case "resume":

					/*******************
      Action: Resume
      *******************/

					/* Handle delay timers */
					$.each(elements, function (i, element) {
						resumeDelayOnElement(element, currentTime);
					});

					/* Pause and Resume are call-wide (not on a per elemnt basis). Thus, calling pause or resume on a 
      single element will cause any calls that containt tweens for that element to be paused/resumed
      as well. */

					/* Iterate through all calls and pause any that contain any of our elements */
					$.each(Velocity.State.calls, function (i, activeCall) {
						var found = false;
						/* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
						if (activeCall) {
							/* Iterate through the active call's targeted elements. */
							$.each(activeCall[1], function (k, activeElement) {
								var queueName = options === undefined ? "" : options;

								if (queueName !== true && activeCall[2].queue !== queueName && !(options === undefined && activeCall[2].queue === false)) {
									return true;
								}

								/* Skip any calls that have never been paused */
								if (!activeCall[5]) {
									return true;
								}

								/* Iterate through the calls targeted by the stop command. */
								$.each(elements, function (l, element) {
									/* Check that this call was applied to the target element. */
									if (element === activeElement) {

										/* Flag a pause object to be resumed, which will occur during the next tick. In
           addition, the pause object will at that time be deleted */
										activeCall[5].resume = true;

										/* Once we match an element, we can bounce out to the next call entirely */
										found = true;
										return false;
									}
								});

								/* Proceed to check next call if we have already matched */
								if (found) {
									return false;
								}
							});
						}
					});

					/* Since resume creates no new tweens, exit out of Velocity. */
					return getChain();

				case "finish":
				case "finishAll":
				case "stop":
					/*******************
      Action: Stop
      *******************/

					/* Clear the currently-active delay on each targeted element. */
					$.each(elements, function (i, element) {
						if (Data(element) && Data(element).delayTimer) {
							/* Stop the timer from triggering its cached next() function. */
							clearTimeout(Data(element).delayTimer.setTimeout);

							/* Manually call the next() function so that the subsequent queue items can progress. */
							if (Data(element).delayTimer.next) {
								Data(element).delayTimer.next();
							}

							delete Data(element).delayTimer;
						}

						/* If we want to finish everything in the queue, we have to iterate through it
       and call each function. This will make them active calls below, which will
       cause them to be applied via the duration setting. */
						if (propertiesMap === "finishAll" && (options === true || Type.isString(options))) {
							/* Iterate through the items in the element's queue. */
							$.each($.queue(element, Type.isString(options) ? options : ""), function (_, item) {
								/* The queue array can contain an "inprogress" string, which we skip. */
								if (Type.isFunction(item)) {
									item();
								}
							});

							/* Clearing the $.queue() array is achieved by resetting it to []. */
							$.queue(element, Type.isString(options) ? options : "", []);
						}
					});

					var callsToStop = [];

					/* When the stop action is triggered, the elements' currently active call is immediately stopped. The active call might have
      been applied to multiple elements, in which case all of the call's elements will be stopped. When an element
      is stopped, the next item in its animation queue is immediately triggered. */
					/* An additional argument may be passed in to clear an element's remaining queued calls. Either true (which defaults to the "fx" queue)
      or a custom queue string can be passed in. */
					/* Note: The stop command runs prior to Velocity's Queueing phase since its behavior is intended to take effect *immediately*,
      regardless of the element's current queue state. */

					/* Iterate through every active call. */
					$.each(Velocity.State.calls, function (i, activeCall) {
						/* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
						if (activeCall) {
							/* Iterate through the active call's targeted elements. */
							$.each(activeCall[1], function (k, activeElement) {
								/* If true was passed in as a secondary argument, clear absolutely all calls on this element. Otherwise, only
         clear calls associated with the relevant queue. */
								/* Call stopping logic works as follows:
         - options === true --> stop current default queue calls (and queue:false calls), including remaining queued ones.
         - options === undefined --> stop current queue:"" call and all queue:false calls.
         - options === false --> stop only queue:false calls.
         - options === "custom" --> stop current queue:"custom" call, including remaining queued ones (there is no functionality to only clear the currently-running queue:"custom" call). */
								var queueName = options === undefined ? "" : options;

								if (queueName !== true && activeCall[2].queue !== queueName && !(options === undefined && activeCall[2].queue === false)) {
									return true;
								}

								/* Iterate through the calls targeted by the stop command. */
								$.each(elements, function (l, element) {
									/* Check that this call was applied to the target element. */
									if (element === activeElement) {
										/* Optionally clear the remaining queued calls. If we're doing "finishAll" this won't find anything,
           due to the queue-clearing above. */
										if (options === true || Type.isString(options)) {
											/* Iterate through the items in the element's queue. */
											$.each($.queue(element, Type.isString(options) ? options : ""), function (_, item) {
												/* The queue array can contain an "inprogress" string, which we skip. */
												if (Type.isFunction(item)) {
													/* Pass the item's callback a flag indicating that we want to abort from the queue call.
              (Specifically, the queue will resolve the call's associated promise then abort.)  */
													item(null, true);
												}
											});

											/* Clearing the $.queue() array is achieved by resetting it to []. */
											$.queue(element, Type.isString(options) ? options : "", []);
										}

										if (propertiesMap === "stop") {
											/* Since "reverse" uses cached start values (the previous call's endValues), these values must be
            changed to reflect the final value that the elements were actually tweened to. */
											/* Note: If only queue:false animations are currently running on an element, it won't have a tweensContainer
            object. Also, queue:false animations can't be reversed. */
											var data = Data(element);
											if (data && data.tweensContainer && queueName !== false) {
												$.each(data.tweensContainer, function (m, activeTween) {
													activeTween.endValue = activeTween.currentValue;
												});
											}

											callsToStop.push(i);
										} else if (propertiesMap === "finish" || propertiesMap === "finishAll") {
											/* To get active tweens to finish immediately, we forcefully shorten their durations to 1ms so that
            they finish upon the next rAf tick then proceed with normal call completion logic. */
											activeCall[2].duration = 1;
										}
									}
								});
							});
						}
					});

					/* Prematurely call completeCall() on each matched active call. Pass an additional flag for "stop" to indicate
      that the complete callback and display:none setting should be skipped since we're completing prematurely. */
					if (propertiesMap === "stop") {
						$.each(callsToStop, function (i, j) {
							completeCall(j, true);
						});

						if (promiseData.promise) {
							/* Immediately resolve the promise associated with this stop call since stop runs synchronously. */
							promiseData.resolver(elements);
						}
					}

					/* Since we're stopping, and not proceeding with queueing, exit out of Velocity. */
					return getChain();

				default:
					/* Treat a non-empty plain object as a literal properties map. */
					if ($.isPlainObject(propertiesMap) && !Type.isEmptyObject(propertiesMap)) {
						action = "start";

						/****************
       Redirects
       ****************/

						/* Check if a string matches a registered redirect (see Redirects above). */
					} else if (Type.isString(propertiesMap) && Velocity.Redirects[propertiesMap]) {
						opts = $.extend({}, options);

						var durationOriginal = opts.duration,
						    delayOriginal = opts.delay || 0;

						/* If the backwards option was passed in, reverse the element set so that elements animate from the last to the first. */
						if (opts.backwards === true) {
							elements = $.extend(true, [], elements).reverse();
						}

						/* Individually trigger the redirect for each element in the set to prevent users from having to handle iteration logic in their redirect. */
						$.each(elements, function (elementIndex, element) {
							/* If the stagger option was passed in, successively delay each element by the stagger value (in ms). Retain the original delay value. */
							if (parseFloat(opts.stagger)) {
								opts.delay = delayOriginal + parseFloat(opts.stagger) * elementIndex;
							} else if (Type.isFunction(opts.stagger)) {
								opts.delay = delayOriginal + opts.stagger.call(element, elementIndex, elementsLength);
							}

							/* If the drag option was passed in, successively increase/decrease (depending on the presense of opts.backwards)
        the duration of each element's animation, using floors to prevent producing very short durations. */
							if (opts.drag) {
								/* Default the duration of UI pack effects (callouts and transitions) to 1000ms instead of the usual default duration of 400ms. */
								opts.duration = parseFloat(durationOriginal) || (/^(callout|transition)/.test(propertiesMap) ? 1000 : DURATION_DEFAULT);

								/* For each element, take the greater duration of: A) animation completion percentage relative to the original duration,
         B) 75% of the original duration, or C) a 200ms fallback (in case duration is already set to a low value).
         The end result is a baseline of 75% of the redirect's duration that increases/decreases as the end of the element set is approached. */
								opts.duration = Math.max(opts.duration * (opts.backwards ? 1 - elementIndex / elementsLength : (elementIndex + 1) / elementsLength), opts.duration * 0.75, 200);
							}

							/* Pass in the call's opts object so that the redirect can optionally extend it. It defaults to an empty object instead of null to
        reduce the opts checking logic required inside the redirect. */
							Velocity.Redirects[propertiesMap].call(element, element, opts || {}, elementIndex, elementsLength, elements, promiseData.promise ? promiseData : undefined);
						});

						/* Since the animation logic resides within the redirect's own code, abort the remainder of this call.
       (The performance overhead up to this point is virtually non-existant.) */
						/* Note: The jQuery call chain is kept intact by returning the complete element set. */
						return getChain();
					} else {
						var abortError = "Velocity: First argument (" + propertiesMap + ") was not a property map, a known action, or a registered redirect. Aborting.";

						if (promiseData.promise) {
							promiseData.rejecter(new Error(abortError));
						} else if (window.console) {
							console.log(abortError);
						}

						return getChain();
					}
			}

			/**************************
    Call-Wide Variables
    **************************/

			/* A container for CSS unit conversion ratios (e.g. %, rem, and em ==> px) that is used to cache ratios across all elements
    being animated in a single Velocity call. Calculating unit ratios necessitates DOM querying and updating, and is therefore
    avoided (via caching) wherever possible. This container is call-wide instead of page-wide to avoid the risk of using stale
    conversion metrics across Velocity animations that are not immediately consecutively chained. */
			var callUnitConversionData = {
				lastParent: null,
				lastPosition: null,
				lastFontSize: null,
				lastPercentToPxWidth: null,
				lastPercentToPxHeight: null,
				lastEmToPx: null,
				remToPx: null,
				vwToPx: null,
				vhToPx: null
			};

			/* A container for all the ensuing tween data and metadata associated with this call. This container gets pushed to the page-wide
    Velocity.State.calls array that is processed during animation ticking. */
			var call = [];

			/************************
    Element Processing
    ************************/

			/* Element processing consists of three parts -- data processing that cannot go stale and data processing that *can* go stale (i.e. third-party style modifications):
    1) Pre-Queueing: Element-wide variables, including the element's data storage, are instantiated. Call options are prepared. If triggered, the Stop action is executed.
    2) Queueing: The logic that runs once this call has reached its point of execution in the element's $.queue() stack. Most logic is placed here to avoid risking it becoming stale.
    3) Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
    `elementArrayIndex` allows passing index of the element in the original array to value functions.
    If `elementsIndex` were used instead the index would be determined by the elements' per-element queue.
    */
			function processElement(element, elementArrayIndex) {

				/*************************
     Part I: Pre-Queueing
     *************************/

				/***************************
     Element-Wide Variables
     ***************************/

				var /* The runtime opts object is the extension of the current call's options and Velocity's page-wide option defaults. */
				opts = $.extend({}, Velocity.defaults, options),

				/* A container for the processed data associated with each property in the propertyMap.
     (Each property in the map produces its own "tween".) */
				tweensContainer = {},
				    elementUnitConversionData;

				/******************
     Element Init
     ******************/

				if (Data(element) === undefined) {
					Velocity.init(element);
				}

				/******************
     Option: Delay
     ******************/

				/* Since queue:false doesn't respect the item's existing queue, we avoid injecting its delay here (it's set later on). */
				/* Note: Velocity rolls its own delay function since jQuery doesn't have a utility alias for $.fn.delay()
     (and thus requires jQuery element creation, which we avoid since its overhead includes DOM querying). */
				if (parseFloat(opts.delay) && opts.queue !== false) {
					$.queue(element, opts.queue, function (next) {
						/* This is a flag used to indicate to the upcoming completeCall() function that this queue entry was initiated by Velocity. See completeCall() for further details. */
						Velocity.velocityQueueEntryFlag = true;

						/* The ensuing queue item (which is assigned to the "next" argument that $.queue() automatically passes in) will be triggered after a setTimeout delay.
       The setTimeout is stored so that it can be subjected to clearTimeout() if this animation is prematurely stopped via Velocity's "stop" command, and
       delayBegin/delayTime is used to ensure we can "pause" and "resume" a tween that is still mid-delay. */

						/* Temporarily store delayed elements to facilite access for global pause/resume */
						var callIndex = Velocity.State.delayedElements.count++;
						Velocity.State.delayedElements[callIndex] = element;

						var delayComplete = function (index) {
							return function () {
								/* Clear the temporary element */
								Velocity.State.delayedElements[index] = false;

								/* Finally, issue the call */
								next();
							};
						}(callIndex);

						Data(element).delayBegin = new Date().getTime();
						Data(element).delay = parseFloat(opts.delay);
						Data(element).delayTimer = {
							setTimeout: setTimeout(next, parseFloat(opts.delay)),
							next: delayComplete
						};
					});
				}

				/*********************
     Option: Duration
     *********************/

				/* Support for jQuery's named durations. */
				switch (opts.duration.toString().toLowerCase()) {
					case "fast":
						opts.duration = 200;
						break;

					case "normal":
						opts.duration = DURATION_DEFAULT;
						break;

					case "slow":
						opts.duration = 600;
						break;

					default:
						/* Remove the potential "ms" suffix and default to 1 if the user is attempting to set a duration of 0 (in order to produce an immediate style change). */
						opts.duration = parseFloat(opts.duration) || 1;
				}

				/************************
     Global Option: Mock
     ************************/

				if (Velocity.mock !== false) {
					/* In mock mode, all animations are forced to 1ms so that they occur immediately upon the next rAF tick.
      Alternatively, a multiplier can be passed in to time remap all delays and durations. */
					if (Velocity.mock === true) {
						opts.duration = opts.delay = 1;
					} else {
						opts.duration *= parseFloat(Velocity.mock) || 1;
						opts.delay *= parseFloat(Velocity.mock) || 1;
					}
				}

				/*******************
     Option: Easing
     *******************/

				opts.easing = getEasing(opts.easing, opts.duration);

				/**********************
     Option: Callbacks
     **********************/

				/* Callbacks must functions. Otherwise, default to null. */
				if (opts.begin && !Type.isFunction(opts.begin)) {
					opts.begin = null;
				}

				if (opts.progress && !Type.isFunction(opts.progress)) {
					opts.progress = null;
				}

				if (opts.complete && !Type.isFunction(opts.complete)) {
					opts.complete = null;
				}

				/*********************************
     Option: Display & Visibility
     *********************************/

				/* Refer to Velocity's documentation (VelocityJS.org/#displayAndVisibility) for a description of the display and visibility options' behavior. */
				/* Note: We strictly check for undefined instead of falsiness because display accepts an empty string value. */
				if (opts.display !== undefined && opts.display !== null) {
					opts.display = opts.display.toString().toLowerCase();

					/* Users can pass in a special "auto" value to instruct Velocity to set the element to its default display value. */
					if (opts.display === "auto") {
						opts.display = Velocity.CSS.Values.getDisplayType(element);
					}
				}

				if (opts.visibility !== undefined && opts.visibility !== null) {
					opts.visibility = opts.visibility.toString().toLowerCase();
				}

				/**********************
     Option: mobileHA
     **********************/

				/* When set to true, and if this is a mobile device, mobileHA automatically enables hardware acceleration (via a null transform hack)
     on animating elements. HA is removed from the element at the completion of its animation. */
				/* Note: Android Gingerbread doesn't support HA. If a null transform hack (mobileHA) is in fact set, it will prevent other tranform subproperties from taking effect. */
				/* Note: You can read more about the use of mobileHA in Velocity's documentation: VelocityJS.org/#mobileHA. */
				opts.mobileHA = opts.mobileHA && Velocity.State.isMobile && !Velocity.State.isGingerbread;

				/***********************
     Part II: Queueing
     ***********************/

				/* When a set of elements is targeted by a Velocity call, the set is broken up and each element has the current Velocity call individually queued onto it.
     In this way, each element's existing queue is respected; some elements may already be animating and accordingly should not have this current Velocity call triggered immediately. */
				/* In each queue, tween data is processed for each animating property then pushed onto the call-wide calls array. When the last element in the set has had its tweens processed,
     the call array is pushed to Velocity.State.calls for live processing by the requestAnimationFrame tick. */
				function buildQueue(next) {
					var data, lastTweensContainer;

					/*******************
      Option: Begin
      *******************/

					/* The begin callback is fired once per call -- not once per elemenet -- and is passed the full raw DOM element set as both its context and its first argument. */
					if (opts.begin && elementsIndex === 0) {
						/* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
						try {
							opts.begin.call(elements, elements);
						} catch (error) {
							setTimeout(function () {
								throw error;
							}, 1);
						}
					}

					/*****************************************
      Tween Data Construction (for Scroll)
      *****************************************/

					/* Note: In order to be subjected to chaining and animation options, scroll's tweening is routed through Velocity as if it were a standard CSS property animation. */
					if (action === "scroll") {
						/* The scroll action uniquely takes an optional "offset" option -- specified in pixels -- that offsets the targeted scroll position. */
						var scrollDirection = /^x$/i.test(opts.axis) ? "Left" : "Top",
						    scrollOffset = parseFloat(opts.offset) || 0,
						    scrollPositionCurrent,
						    scrollPositionCurrentAlternate,
						    scrollPositionEnd;

						/* Scroll also uniquely takes an optional "container" option, which indicates the parent element that should be scrolled --
       as opposed to the browser window itself. This is useful for scrolling toward an element that's inside an overflowing parent element. */
						if (opts.container) {
							/* Ensure that either a jQuery object or a raw DOM element was passed in. */
							if (Type.isWrapped(opts.container) || Type.isNode(opts.container)) {
								/* Extract the raw DOM element from the jQuery wrapper. */
								opts.container = opts.container[0] || opts.container;
								/* Note: Unlike other properties in Velocity, the browser's scroll position is never cached since it so frequently changes
         (due to the user's natural interaction with the page). */
								scrollPositionCurrent = opts.container["scroll" + scrollDirection]; /* GET */

								/* $.position() values are relative to the container's currently viewable area (without taking into account the container's true dimensions
         -- say, for example, if the container was not overflowing). Thus, the scroll end value is the sum of the child element's position *and*
         the scroll container's current scroll position. */
								scrollPositionEnd = scrollPositionCurrent + $(element).position()[scrollDirection.toLowerCase()] + scrollOffset; /* GET */
								/* If a value other than a jQuery object or a raw DOM element was passed in, default to null so that this option is ignored. */
							} else {
								opts.container = null;
							}
						} else {
							/* If the window itself is being scrolled -- not a containing element -- perform a live scroll position lookup using
        the appropriate cached property names (which differ based on browser type). */
							scrollPositionCurrent = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + scrollDirection]]; /* GET */
							/* When scrolling the browser window, cache the alternate axis's current value since window.scrollTo() doesn't let us change only one value at a time. */
							scrollPositionCurrentAlternate = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + (scrollDirection === "Left" ? "Top" : "Left")]]; /* GET */

							/* Unlike $.position(), $.offset() values are relative to the browser window's true dimensions -- not merely its currently viewable area --
        and therefore end values do not need to be compounded onto current values. */
							scrollPositionEnd = $(element).offset()[scrollDirection.toLowerCase()] + scrollOffset; /* GET */
						}

						/* Since there's only one format that scroll's associated tweensContainer can take, we create it manually. */
						tweensContainer = {
							scroll: {
								rootPropertyValue: false,
								startValue: scrollPositionCurrent,
								currentValue: scrollPositionCurrent,
								endValue: scrollPositionEnd,
								unitType: "",
								easing: opts.easing,
								scrollData: {
									container: opts.container,
									direction: scrollDirection,
									alternateValue: scrollPositionCurrentAlternate
								}
							},
							element: element
						};

						if (Velocity.debug) {
							console.log("tweensContainer (scroll): ", tweensContainer.scroll, element);
						}

						/******************************************
       Tween Data Construction (for Reverse)
       ******************************************/

						/* Reverse acts like a "start" action in that a property map is animated toward. The only difference is
       that the property map used for reverse is the inverse of the map used in the previous call. Thus, we manipulate
       the previous call to construct our new map: use the previous map's end values as our new map's start values. Copy over all other data. */
						/* Note: Reverse can be directly called via the "reverse" parameter, or it can be indirectly triggered via the loop option. (Loops are composed of multiple reverses.) */
						/* Note: Reverse calls do not need to be consecutively chained onto a currently-animating element in order to operate on cached values;
       there is no harm to reverse being called on a potentially stale data cache since reverse's behavior is simply defined
       as reverting to the element's values as they were prior to the previous *Velocity* call. */
					} else if (action === "reverse") {
						data = Data(element);

						/* Abort if there is no prior animation data to reverse to. */
						if (!data) {
							return;
						}

						if (!data.tweensContainer) {
							/* Dequeue the element so that this queue entry releases itself immediately, allowing subsequent queue entries to run. */
							$.dequeue(element, opts.queue);

							return;
						} else {
							/*********************
        Options Parsing
        *********************/

							/* If the element was hidden via the display option in the previous call,
        revert display to "auto" prior to reversal so that the element is visible again. */
							if (data.opts.display === "none") {
								data.opts.display = "auto";
							}

							if (data.opts.visibility === "hidden") {
								data.opts.visibility = "visible";
							}

							/* If the loop option was set in the previous call, disable it so that "reverse" calls aren't recursively generated.
        Further, remove the previous call's callback options; typically, users do not want these to be refired. */
							data.opts.loop = false;
							data.opts.begin = null;
							data.opts.complete = null;

							/* Since we're extending an opts object that has already been extended with the defaults options object,
        we remove non-explicitly-defined properties that are auto-assigned values. */
							if (!options.easing) {
								delete opts.easing;
							}

							if (!options.duration) {
								delete opts.duration;
							}

							/* The opts object used for reversal is an extension of the options object optionally passed into this
        reverse call plus the options used in the previous Velocity call. */
							opts = $.extend({}, data.opts, opts);

							/*************************************
        Tweens Container Reconstruction
        *************************************/

							/* Create a deepy copy (indicated via the true flag) of the previous call's tweensContainer. */
							lastTweensContainer = $.extend(true, {}, data ? data.tweensContainer : null);

							/* Manipulate the previous tweensContainer by replacing its end values and currentValues with its start values. */
							for (var lastTween in lastTweensContainer) {
								/* In addition to tween data, tweensContainers contain an element property that we ignore here. */
								if (lastTweensContainer.hasOwnProperty(lastTween) && lastTween !== "element") {
									var lastStartValue = lastTweensContainer[lastTween].startValue;

									lastTweensContainer[lastTween].startValue = lastTweensContainer[lastTween].currentValue = lastTweensContainer[lastTween].endValue;
									lastTweensContainer[lastTween].endValue = lastStartValue;

									/* Easing is the only option that embeds into the individual tween data (since it can be defined on a per-property basis).
          Accordingly, every property's easing value must be updated when an options object is passed in with a reverse call.
          The side effect of this extensibility is that all per-property easing values are forcefully reset to the new value. */
									if (!Type.isEmptyObject(options)) {
										lastTweensContainer[lastTween].easing = opts.easing;
									}

									if (Velocity.debug) {
										console.log("reverse tweensContainer (" + lastTween + "): " + JSON.stringify(lastTweensContainer[lastTween]), element);
									}
								}
							}

							tweensContainer = lastTweensContainer;
						}

						/*****************************************
       Tween Data Construction (for Start)
       *****************************************/
					} else if (action === "start") {

						/*************************
       Value Transferring
       *************************/

						/* If this queue entry follows a previous Velocity-initiated queue entry *and* if this entry was created
       while the element was in the process of being animated by Velocity, then this current call is safe to use
       the end values from the prior call as its start values. Velocity attempts to perform this value transfer
       process whenever possible in order to avoid requerying the DOM. */
						/* If values aren't transferred from a prior call and start values were not forcefed by the user (more on this below),
       then the DOM is queried for the element's current values as a last resort. */
						/* Note: Conversely, animation reversal (and looping) *always* perform inter-call value transfers; they never requery the DOM. */

						data = Data(element);

						/* The per-element isAnimating flag is used to indicate whether it's safe (i.e. the data isn't stale)
       to transfer over end values to use as start values. If it's set to true and there is a previous
       Velocity call to pull values from, do so. */
						if (data && data.tweensContainer && data.isAnimating === true) {
							lastTweensContainer = data.tweensContainer;
						}

						/***************************
       Tween Data Calculation
       ***************************/

						/* This function parses property data and defaults endValue, easing, and startValue as appropriate. */
						/* Property map values can either take the form of 1) a single value representing the end value,
       or 2) an array in the form of [ endValue, [, easing] [, startValue] ].
       The optional third parameter is a forcefed startValue to be used instead of querying the DOM for
       the element's current value. Read Velocity's docmentation to learn more about forcefeeding: VelocityJS.org/#forcefeeding */
						var parsePropertyValue = function parsePropertyValue(valueData, skipResolvingEasing) {
							var endValue, easing, startValue;

							/* If we have a function as the main argument then resolve it first, in case it returns an array that needs to be split */
							if (Type.isFunction(valueData)) {
								valueData = valueData.call(element, elementArrayIndex, elementsLength);
							}

							/* Handle the array format, which can be structured as one of three potential overloads:
        A) [ endValue, easing, startValue ], B) [ endValue, easing ], or C) [ endValue, startValue ] */
							if (Type.isArray(valueData)) {
								/* endValue is always the first item in the array. Don't bother validating endValue's value now
         since the ensuing property cycling logic does that. */
								endValue = valueData[0];

								/* Two-item array format: If the second item is a number, function, or hex string, treat it as a
         start value since easings can only be non-hex strings or arrays. */
								if (!Type.isArray(valueData[1]) && /^[\d-]/.test(valueData[1]) || Type.isFunction(valueData[1]) || CSS.RegEx.isHex.test(valueData[1])) {
									startValue = valueData[1];
									/* Two or three-item array: If the second item is a non-hex string easing name or an array, treat it as an easing. */
								} else if (Type.isString(valueData[1]) && !CSS.RegEx.isHex.test(valueData[1]) && Velocity.Easings[valueData[1]] || Type.isArray(valueData[1])) {
									easing = skipResolvingEasing ? valueData[1] : getEasing(valueData[1], opts.duration);

									/* Don't bother validating startValue's value now since the ensuing property cycling logic inherently does that. */
									startValue = valueData[2];
								} else {
									startValue = valueData[1] || valueData[2];
								}
								/* Handle the single-value format. */
							} else {
								endValue = valueData;
							}

							/* Default to the call's easing if a per-property easing type was not defined. */
							if (!skipResolvingEasing) {
								easing = easing || opts.easing;
							}

							/* If functions were passed in as values, pass the function the current element as its context,
        plus the element's index and the element set's size as arguments. Then, assign the returned value. */
							if (Type.isFunction(endValue)) {
								endValue = endValue.call(element, elementArrayIndex, elementsLength);
							}

							if (Type.isFunction(startValue)) {
								startValue = startValue.call(element, elementArrayIndex, elementsLength);
							}

							/* Allow startValue to be left as undefined to indicate to the ensuing code that its value was not forcefed. */
							return [endValue || 0, easing, startValue];
						};

						var fixPropertyValue = function fixPropertyValue(property, valueData) {
							/* In case this property is a hook, there are circumstances where we will intend to work on the hook's root property and not the hooked subproperty. */
							var rootProperty = CSS.Hooks.getRoot(property),
							    rootPropertyValue = false,

							/* Parse out endValue, easing, and startValue from the property's data. */
							endValue = valueData[0],
							    easing = valueData[1],
							    startValue = valueData[2],
							    pattern;

							/**************************
        Start Value Sourcing
        **************************/

							/* Other than for the dummy tween property, properties that are not supported by the browser (and do not have an associated normalization) will
        inherently produce no style changes when set, so they are skipped in order to decrease animation tick overhead.
        Property support is determined via prefixCheck(), which returns a false flag when no supported is detected. */
							/* Note: Since SVG elements have some of their properties directly applied as HTML attributes,
        there is no way to check for their explicit browser support, and so we skip skip this check for them. */
							if ((!data || !data.isSVG) && rootProperty !== "tween" && CSS.Names.prefixCheck(rootProperty)[1] === false && CSS.Normalizations.registered[rootProperty] === undefined) {
								if (Velocity.debug) {
									console.log("Skipping [" + rootProperty + "] due to a lack of browser support.");
								}
								return;
							}

							/* If the display option is being set to a non-"none" (e.g. "block") and opacity (filter on IE<=8) is being
        animated to an endValue of non-zero, the user's intention is to fade in from invisible, thus we forcefeed opacity
        a startValue of 0 if its startValue hasn't already been sourced by value transferring or prior forcefeeding. */
							if ((opts.display !== undefined && opts.display !== null && opts.display !== "none" || opts.visibility !== undefined && opts.visibility !== "hidden") && /opacity|filter/.test(property) && !startValue && endValue !== 0) {
								startValue = 0;
							}

							/* If values have been transferred from the previous Velocity call, extract the endValue and rootPropertyValue
        for all of the current call's properties that were *also* animated in the previous call. */
							/* Note: Value transferring can optionally be disabled by the user via the _cacheValues option. */
							if (opts._cacheValues && lastTweensContainer && lastTweensContainer[property]) {
								if (startValue === undefined) {
									startValue = lastTweensContainer[property].endValue + lastTweensContainer[property].unitType;
								}

								/* The previous call's rootPropertyValue is extracted from the element's data cache since that's the
         instance of rootPropertyValue that gets freshly updated by the tweening process, whereas the rootPropertyValue
         attached to the incoming lastTweensContainer is equal to the root property's value prior to any tweening. */
								rootPropertyValue = data.rootPropertyValueCache[rootProperty];
								/* If values were not transferred from a previous Velocity call, query the DOM as needed. */
							} else {
								/* Handle hooked properties. */
								if (CSS.Hooks.registered[property]) {
									if (startValue === undefined) {
										rootPropertyValue = CSS.getPropertyValue(element, rootProperty); /* GET */
										/* Note: The following getPropertyValue() call does not actually trigger a DOM query;
           getPropertyValue() will extract the hook from rootPropertyValue. */
										startValue = CSS.getPropertyValue(element, property, rootPropertyValue);
										/* If startValue is already defined via forcefeeding, do not query the DOM for the root property's value;
           just grab rootProperty's zero-value template from CSS.Hooks. This overwrites the element's actual
           root property value (if one is set), but this is acceptable since the primary reason users forcefeed is
           to avoid DOM queries, and thus we likewise avoid querying the DOM for the root property's value. */
									} else {
										/* Grab this hook's zero-value template, e.g. "0px 0px 0px black". */
										rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
									}
									/* Handle non-hooked properties that haven't already been defined via forcefeeding. */
								} else if (startValue === undefined) {
									startValue = CSS.getPropertyValue(element, property); /* GET */
								}
							}

							/**************************
        Value Data Extraction
        **************************/

							var separatedValue,
							    endValueUnitType,
							    startValueUnitType,
							    operator = false;

							/* Separates a property value into its numeric value and its unit type. */
							var separateValue = function separateValue(property, value) {
								var unitType, numericValue;

								numericValue = (value || "0").toString().toLowerCase()
								/* Match the unit type at the end of the value. */
								.replace(/[%A-z]+$/, function (match) {
									/* Grab the unit type. */
									unitType = match;

									/* Strip the unit type off of value. */
									return "";
								});

								/* If no unit type was supplied, assign one that is appropriate for this property (e.g. "deg" for rotateZ or "px" for width). */
								if (!unitType) {
									unitType = CSS.Values.getUnitType(property);
								}

								return [numericValue, unitType];
							};

							if (startValue !== endValue && Type.isString(startValue) && Type.isString(endValue)) {
								pattern = "";
								var iStart = 0,
								    // index in startValue
								iEnd = 0,
								    // index in endValue
								aStart = [],
								    // array of startValue numbers
								aEnd = [],
								    // array of endValue numbers
								inCalc = 0,
								    // Keep track of being inside a "calc()" so we don't duplicate it
								inRGB = 0,
								    // Keep track of being inside an RGB as we can't use fractional values
								inRGBA = 0; // Keep track of being inside an RGBA as we must pass fractional for the alpha channel

								startValue = CSS.Hooks.fixColors(startValue);
								endValue = CSS.Hooks.fixColors(endValue);
								while (iStart < startValue.length && iEnd < endValue.length) {
									var cStart = startValue[iStart],
									    cEnd = endValue[iEnd];

									if (/[\d\.-]/.test(cStart) && /[\d\.-]/.test(cEnd)) {
										var tStart = cStart,
										    // temporary character buffer
										tEnd = cEnd,
										    // temporary character buffer
										dotStart = ".",
										    // Make sure we can only ever match a single dot in a decimal
										dotEnd = "."; // Make sure we can only ever match a single dot in a decimal

										while (++iStart < startValue.length) {
											cStart = startValue[iStart];
											if (cStart === dotStart) {
												dotStart = ".."; // Can never match two characters
											} else if (!/\d/.test(cStart)) {
												break;
											}
											tStart += cStart;
										}
										while (++iEnd < endValue.length) {
											cEnd = endValue[iEnd];
											if (cEnd === dotEnd) {
												dotEnd = ".."; // Can never match two characters
											} else if (!/\d/.test(cEnd)) {
												break;
											}
											tEnd += cEnd;
										}
										var uStart = CSS.Hooks.getUnit(startValue, iStart),
										    // temporary unit type
										uEnd = CSS.Hooks.getUnit(endValue, iEnd); // temporary unit type

										iStart += uStart.length;
										iEnd += uEnd.length;
										if (uStart === uEnd) {
											// Same units
											if (tStart === tEnd) {
												// Same numbers, so just copy over
												pattern += tStart + uStart;
											} else {
												// Different numbers, so store them
												pattern += "{" + aStart.length + (inRGB ? "!" : "") + "}" + uStart;
												aStart.push(parseFloat(tStart));
												aEnd.push(parseFloat(tEnd));
											}
										} else {
											// Different units, so put into a "calc(from + to)" and animate each side to/from zero
											var nStart = parseFloat(tStart),
											    nEnd = parseFloat(tEnd);

											pattern += (inCalc < 5 ? "calc" : "") + "(" + (nStart ? "{" + aStart.length + (inRGB ? "!" : "") + "}" : "0") + uStart + " + " + (nEnd ? "{" + (aStart.length + (nStart ? 1 : 0)) + (inRGB ? "!" : "") + "}" : "0") + uEnd + ")";
											if (nStart) {
												aStart.push(nStart);
												aEnd.push(0);
											}
											if (nEnd) {
												aStart.push(0);
												aEnd.push(nEnd);
											}
										}
									} else if (cStart === cEnd) {
										pattern += cStart;
										iStart++;
										iEnd++;
										// Keep track of being inside a calc()
										if (inCalc === 0 && cStart === "c" || inCalc === 1 && cStart === "a" || inCalc === 2 && cStart === "l" || inCalc === 3 && cStart === "c" || inCalc >= 4 && cStart === "(") {
											inCalc++;
										} else if (inCalc && inCalc < 5 || inCalc >= 4 && cStart === ")" && --inCalc < 5) {
											inCalc = 0;
										}
										// Keep track of being inside an rgb() / rgba()
										if (inRGB === 0 && cStart === "r" || inRGB === 1 && cStart === "g" || inRGB === 2 && cStart === "b" || inRGB === 3 && cStart === "a" || inRGB >= 3 && cStart === "(") {
											if (inRGB === 3 && cStart === "a") {
												inRGBA = 1;
											}
											inRGB++;
										} else if (inRGBA && cStart === ",") {
											if (++inRGBA > 3) {
												inRGB = inRGBA = 0;
											}
										} else if (inRGBA && inRGB < (inRGBA ? 5 : 4) || inRGB >= (inRGBA ? 4 : 3) && cStart === ")" && --inRGB < (inRGBA ? 5 : 4)) {
											inRGB = inRGBA = 0;
										}
									} else {
										inCalc = 0;
										// TODO: changing units, fixing colours
										break;
									}
								}
								if (iStart !== startValue.length || iEnd !== endValue.length) {
									if (Velocity.debug) {
										console.error("Trying to pattern match mis-matched strings [\"" + endValue + "\", \"" + startValue + "\"]");
									}
									pattern = undefined;
								}
								if (pattern) {
									if (aStart.length) {
										if (Velocity.debug) {
											console.log("Pattern found \"" + pattern + "\" -> ", aStart, aEnd, "[" + startValue + "," + endValue + "]");
										}
										startValue = aStart;
										endValue = aEnd;
										endValueUnitType = startValueUnitType = "";
									} else {
										pattern = undefined;
									}
								}
							}

							if (!pattern) {
								/* Separate startValue. */
								separatedValue = separateValue(property, startValue);
								startValue = separatedValue[0];
								startValueUnitType = separatedValue[1];

								/* Separate endValue, and extract a value operator (e.g. "+=", "-=") if one exists. */
								separatedValue = separateValue(property, endValue);
								endValue = separatedValue[0].replace(/^([+-\/*])=/, function (match, subMatch) {
									operator = subMatch;

									/* Strip the operator off of the value. */
									return "";
								});
								endValueUnitType = separatedValue[1];

								/* Parse float values from endValue and startValue. Default to 0 if NaN is returned. */
								startValue = parseFloat(startValue) || 0;
								endValue = parseFloat(endValue) || 0;

								/***************************************
         Property-Specific Value Conversion
         ***************************************/

								/* Custom support for properties that don't actually accept the % unit type, but where pollyfilling is trivial and relatively foolproof. */
								if (endValueUnitType === "%") {
									/* A %-value fontSize/lineHeight is relative to the parent's fontSize (as opposed to the parent's dimensions),
          which is identical to the em unit's behavior, so we piggyback off of that. */
									if (/^(fontSize|lineHeight)$/.test(property)) {
										/* Convert % into an em decimal value. */
										endValue = endValue / 100;
										endValueUnitType = "em";
										/* For scaleX and scaleY, convert the value into its decimal format and strip off the unit type. */
									} else if (/^scale/.test(property)) {
										endValue = endValue / 100;
										endValueUnitType = "";
										/* For RGB components, take the defined percentage of 255 and strip off the unit type. */
									} else if (/(Red|Green|Blue)$/i.test(property)) {
										endValue = endValue / 100 * 255;
										endValueUnitType = "";
									}
								}
							}

							/***************************
        Unit Ratio Calculation
        ***************************/

							/* When queried, the browser returns (most) CSS property values in pixels. Therefore, if an endValue with a unit type of
        %, em, or rem is animated toward, startValue must be converted from pixels into the same unit type as endValue in order
        for value manipulation logic (increment/decrement) to proceed. Further, if the startValue was forcefed or transferred
        from a previous call, startValue may also not be in pixels. Unit conversion logic therefore consists of two steps:
        1) Calculating the ratio of %/em/rem/vh/vw relative to pixels
        2) Converting startValue into the same unit of measurement as endValue based on these ratios. */
							/* Unit conversion ratios are calculated by inserting a sibling node next to the target node, copying over its position property,
        setting values with the target unit type then comparing the returned pixel value. */
							/* Note: Even if only one of these unit types is being animated, all unit ratios are calculated at once since the overhead
        of batching the SETs and GETs together upfront outweights the potential overhead
        of layout thrashing caused by re-querying for uncalculated ratios for subsequently-processed properties. */
							/* Todo: Shift this logic into the calls' first tick instance so that it's synced with RAF. */
							var calculateUnitRatios = function calculateUnitRatios() {

								/************************
         Same Ratio Checks
         ************************/

								/* The properties below are used to determine whether the element differs sufficiently from this call's
         previously iterated element to also differ in its unit conversion ratios. If the properties match up with those
         of the prior element, the prior element's conversion ratios are used. Like most optimizations in Velocity,
         this is done to minimize DOM querying. */
								var sameRatioIndicators = {
									myParent: element.parentNode || document.body, /* GET */
									position: CSS.getPropertyValue(element, "position"), /* GET */
									fontSize: CSS.getPropertyValue(element, "fontSize") /* GET */
								},

								/* Determine if the same % ratio can be used. % is based on the element's position value and its parent's width and height dimensions. */
								samePercentRatio = sameRatioIndicators.position === callUnitConversionData.lastPosition && sameRatioIndicators.myParent === callUnitConversionData.lastParent,

								/* Determine if the same em ratio can be used. em is relative to the element's fontSize. */
								sameEmRatio = sameRatioIndicators.fontSize === callUnitConversionData.lastFontSize;

								/* Store these ratio indicators call-wide for the next element to compare against. */
								callUnitConversionData.lastParent = sameRatioIndicators.myParent;
								callUnitConversionData.lastPosition = sameRatioIndicators.position;
								callUnitConversionData.lastFontSize = sameRatioIndicators.fontSize;

								/***************************
         Element-Specific Units
         ***************************/

								/* Note: IE8 rounds to the nearest pixel when returning CSS values, thus we perform conversions using a measurement
         of 100 (instead of 1) to give our ratios a precision of at least 2 decimal values. */
								var measurement = 100,
								    unitRatios = {};

								if (!sameEmRatio || !samePercentRatio) {
									var dummy = data && data.isSVG ? document.createElementNS("http://www.w3.org/2000/svg", "rect") : document.createElement("div");

									Velocity.init(dummy);
									sameRatioIndicators.myParent.appendChild(dummy);

									/* To accurately and consistently calculate conversion ratios, the element's cascaded overflow and box-sizing are stripped.
          Similarly, since width/height can be artificially constrained by their min-/max- equivalents, these are controlled for as well. */
									/* Note: Overflow must be also be controlled for per-axis since the overflow property overwrites its per-axis values. */
									$.each(["overflow", "overflowX", "overflowY"], function (i, property) {
										Velocity.CSS.setPropertyValue(dummy, property, "hidden");
									});
									Velocity.CSS.setPropertyValue(dummy, "position", sameRatioIndicators.position);
									Velocity.CSS.setPropertyValue(dummy, "fontSize", sameRatioIndicators.fontSize);
									Velocity.CSS.setPropertyValue(dummy, "boxSizing", "content-box");

									/* width and height act as our proxy properties for measuring the horizontal and vertical % ratios. */
									$.each(["minWidth", "maxWidth", "width", "minHeight", "maxHeight", "height"], function (i, property) {
										Velocity.CSS.setPropertyValue(dummy, property, measurement + "%");
									});
									/* paddingLeft arbitrarily acts as our proxy property for the em ratio. */
									Velocity.CSS.setPropertyValue(dummy, "paddingLeft", measurement + "em");

									/* Divide the returned value by the measurement to get the ratio between 1% and 1px. Default to 1 since working with 0 can produce Infinite. */
									unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth = (parseFloat(CSS.getPropertyValue(dummy, "width", null, true)) || 1) / measurement; /* GET */
									unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight = (parseFloat(CSS.getPropertyValue(dummy, "height", null, true)) || 1) / measurement; /* GET */
									unitRatios.emToPx = callUnitConversionData.lastEmToPx = (parseFloat(CSS.getPropertyValue(dummy, "paddingLeft")) || 1) / measurement; /* GET */

									sameRatioIndicators.myParent.removeChild(dummy);
								} else {
									unitRatios.emToPx = callUnitConversionData.lastEmToPx;
									unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth;
									unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight;
								}

								/***************************
         Element-Agnostic Units
         ***************************/

								/* Whereas % and em ratios are determined on a per-element basis, the rem unit only needs to be checked
         once per call since it's exclusively dependant upon document.body's fontSize. If this is the first time
         that calculateUnitRatios() is being run during this call, remToPx will still be set to its default value of null,
         so we calculate it now. */
								if (callUnitConversionData.remToPx === null) {
									/* Default to browsers' default fontSize of 16px in the case of 0. */
									callUnitConversionData.remToPx = parseFloat(CSS.getPropertyValue(document.body, "fontSize")) || 16; /* GET */
								}

								/* Similarly, viewport units are %-relative to the window's inner dimensions. */
								if (callUnitConversionData.vwToPx === null) {
									callUnitConversionData.vwToPx = parseFloat(window.innerWidth) / 100; /* GET */
									callUnitConversionData.vhToPx = parseFloat(window.innerHeight) / 100; /* GET */
								}

								unitRatios.remToPx = callUnitConversionData.remToPx;
								unitRatios.vwToPx = callUnitConversionData.vwToPx;
								unitRatios.vhToPx = callUnitConversionData.vhToPx;

								if (Velocity.debug >= 1) {
									console.log("Unit ratios: " + JSON.stringify(unitRatios), element);
								}
								return unitRatios;
							};

							/********************
        Unit Conversion
        ********************/

							/* The * and / operators, which are not passed in with an associated unit, inherently use startValue's unit. Skip value and unit conversion. */
							if (/[\/*]/.test(operator)) {
								endValueUnitType = startValueUnitType;
								/* If startValue and endValue differ in unit type, convert startValue into the same unit type as endValue so that if endValueUnitType
         is a relative unit (%, em, rem), the values set during tweening will continue to be accurately relative even if the metrics they depend
         on are dynamically changing during the course of the animation. Conversely, if we always normalized into px and used px for setting values, the px ratio
         would become stale if the original unit being animated toward was relative and the underlying metrics change during the animation. */
								/* Since 0 is 0 in any unit type, no conversion is necessary when startValue is 0 -- we just start at 0 with endValueUnitType. */
							} else if (startValueUnitType !== endValueUnitType && startValue !== 0) {
								/* Unit conversion is also skipped when endValue is 0, but *startValueUnitType* must be used for tween values to remain accurate. */
								/* Note: Skipping unit conversion here means that if endValueUnitType was originally a relative unit, the animation won't relatively
         match the underlying metrics if they change, but this is acceptable since we're animating toward invisibility instead of toward visibility,
         which remains past the point of the animation's completion. */
								if (endValue === 0) {
									endValueUnitType = startValueUnitType;
								} else {
									/* By this point, we cannot avoid unit conversion (it's undesirable since it causes layout thrashing).
          If we haven't already, we trigger calculateUnitRatios(), which runs once per element per call. */
									elementUnitConversionData = elementUnitConversionData || calculateUnitRatios();

									/* The following RegEx matches CSS properties that have their % values measured relative to the x-axis. */
									/* Note: W3C spec mandates that all of margin and padding's properties (even top and bottom) are %-relative to the *width* of the parent element. */
									var axis = /margin|padding|left|right|width|text|word|letter/i.test(property) || /X$/.test(property) || property === "x" ? "x" : "y";

									/* In order to avoid generating n^2 bespoke conversion functions, unit conversion is a two-step process:
          1) Convert startValue into pixels. 2) Convert this new pixel value into endValue's unit type. */
									switch (startValueUnitType) {
										case "%":
											/* Note: translateX and translateY are the only properties that are %-relative to an element's own dimensions -- not its parent's dimensions.
            Velocity does not include a special conversion process to account for this behavior. Therefore, animating translateX/Y from a % value
            to a non-% value will produce an incorrect start value. Fortunately, this sort of cross-unit conversion is rarely done by users in practice. */
											startValue *= axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight;
											break;

										case "px":
											/* px acts as our midpoint in the unit conversion process; do nothing. */
											break;

										default:
											startValue *= elementUnitConversionData[startValueUnitType + "ToPx"];
									}

									/* Invert the px ratios to convert into to the target unit. */
									switch (endValueUnitType) {
										case "%":
											startValue *= 1 / (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
											break;

										case "px":
											/* startValue is already in px, do nothing; we're done. */
											break;

										default:
											startValue *= 1 / elementUnitConversionData[endValueUnitType + "ToPx"];
									}
								}
							}

							/*********************
        Relative Values
        *********************/

							/* Operator logic must be performed last since it requires unit-normalized start and end values. */
							/* Note: Relative *percent values* do not behave how most people think; while one would expect "+=50%"
        to increase the property 1.5x its current value, it in fact increases the percent units in absolute terms:
        50 points is added on top of the current % value. */
							switch (operator) {
								case "+":
									endValue = startValue + endValue;
									break;

								case "-":
									endValue = startValue - endValue;
									break;

								case "*":
									endValue = startValue * endValue;
									break;

								case "/":
									endValue = startValue / endValue;
									break;
							}

							/**************************
        tweensContainer Push
        **************************/

							/* Construct the per-property tween object, and push it to the element's tweensContainer. */
							tweensContainer[property] = {
								rootPropertyValue: rootPropertyValue,
								startValue: startValue,
								currentValue: startValue,
								endValue: endValue,
								unitType: endValueUnitType,
								easing: easing
							};
							if (pattern) {
								tweensContainer[property].pattern = pattern;
							}

							if (Velocity.debug) {
								console.log("tweensContainer (" + property + "): " + JSON.stringify(tweensContainer[property]), element);
							}
						};

						/* Create a tween out of each property, and append its associated data to tweensContainer. */
						for (var property in propertiesMap) {

							if (!propertiesMap.hasOwnProperty(property)) {
								continue;
							}
							/* The original property name's format must be used for the parsePropertyValue() lookup,
        but we then use its camelCase styling to normalize it for manipulation. */
							var propertyName = CSS.Names.camelCase(property),
							    valueData = parsePropertyValue(propertiesMap[property]);

							/* Find shorthand color properties that have been passed a hex string. */
							/* Would be quicker to use CSS.Lists.colors.includes() if possible */
							if (_inArray(CSS.Lists.colors, propertyName)) {
								/* Parse the value data for each shorthand. */
								var endValue = valueData[0],
								    easing = valueData[1],
								    startValue = valueData[2];

								if (CSS.RegEx.isHex.test(endValue)) {
									/* Convert the hex strings into their RGB component arrays. */
									var colorComponents = ["Red", "Green", "Blue"],
									    endValueRGB = CSS.Values.hexToRgb(endValue),
									    startValueRGB = startValue ? CSS.Values.hexToRgb(startValue) : undefined;

									/* Inject the RGB component tweens into propertiesMap. */
									for (var i = 0; i < colorComponents.length; i++) {
										var dataArray = [endValueRGB[i]];

										if (easing) {
											dataArray.push(easing);
										}

										if (startValueRGB !== undefined) {
											dataArray.push(startValueRGB[i]);
										}

										fixPropertyValue(propertyName + colorComponents[i], dataArray);
									}
									/* If we have replaced a shortcut color value then don't update the standard property name */
									continue;
								}
							}
							fixPropertyValue(propertyName, valueData);
						}

						/* Along with its property data, store a reference to the element itself onto tweensContainer. */
						tweensContainer.element = element;
					}

					/*****************
      Call Push
      *****************/

					/* Note: tweensContainer can be empty if all of the properties in this call's property map were skipped due to not
      being supported by the browser. The element property is used for checking that the tweensContainer has been appended to. */
					if (tweensContainer.element) {
						/* Apply the "velocity-animating" indicator class. */
						CSS.Values.addClass(element, "velocity-animating");

						/* The call array houses the tweensContainers for each element being animated in the current call. */
						call.push(tweensContainer);

						data = Data(element);

						if (data) {
							/* Store the tweensContainer and options if we're working on the default effects queue, so that they can be used by the reverse command. */
							if (opts.queue === "") {

								data.tweensContainer = tweensContainer;
								data.opts = opts;
							}

							/* Switch on the element's animating flag. */
							data.isAnimating = true;
						}

						/* Once the final element in this call's element set has been processed, push the call array onto
       Velocity.State.calls for the animation tick to immediately begin processing. */
						if (elementsIndex === elementsLength - 1) {
							/* Add the current call plus its associated metadata (the element set and the call's options) onto the global call container.
        Anything on this call container is subjected to tick() processing. */
							Velocity.State.calls.push([call, elements, opts, null, promiseData.resolver, null, 0]);

							/* If the animation tick isn't running, start it. (Velocity shuts it off when there are no active calls to process.) */
							if (Velocity.State.isTicking === false) {
								Velocity.State.isTicking = true;

								/* Start the tick loop. */
								tick();
							}
						} else {
							elementsIndex++;
						}
					}
				}

				/* When the queue option is set to false, the call skips the element's queue and fires immediately. */
				if (opts.queue === false) {
					/* Since this buildQueue call doesn't respect the element's existing queue (which is where a delay option would have been appended),
      we manually inject the delay property here with an explicit setTimeout. */
					if (opts.delay) {

						/* Temporarily store delayed elements to facilitate access for global pause/resume */
						var callIndex = Velocity.State.delayedElements.count++;
						Velocity.State.delayedElements[callIndex] = element;

						var delayComplete = function (index) {
							return function () {
								/* Clear the temporary element */
								Velocity.State.delayedElements[index] = false;

								/* Finally, issue the call */
								buildQueue();
							};
						}(callIndex);

						Data(element).delayBegin = new Date().getTime();
						Data(element).delay = parseFloat(opts.delay);
						Data(element).delayTimer = {
							setTimeout: setTimeout(buildQueue, parseFloat(opts.delay)),
							next: delayComplete
						};
					} else {
						buildQueue();
					}
					/* Otherwise, the call undergoes element queueing as normal. */
					/* Note: To interoperate with jQuery, Velocity uses jQuery's own $.queue() stack for queuing logic. */
				} else {
					$.queue(element, opts.queue, function (next, clearQueue) {
						/* If the clearQueue flag was passed in by the stop command, resolve this call's promise. (Promises can only be resolved once,
       so it's fine if this is repeatedly triggered for each element in the associated call.) */
						if (clearQueue === true) {
							if (promiseData.promise) {
								promiseData.resolver(elements);
							}

							/* Do not continue with animation queueing. */
							return true;
						}

						/* This flag indicates to the upcoming completeCall() function that this queue entry was initiated by Velocity.
       See completeCall() for further details. */
						Velocity.velocityQueueEntryFlag = true;

						buildQueue(next);
					});
				}

				/*********************
     Auto-Dequeuing
     *********************/

				/* As per jQuery's $.queue() behavior, to fire the first non-custom-queue entry on an element, the element
     must be dequeued if its queue stack consists *solely* of the current call. (This can be determined by checking
     for the "inprogress" item that jQuery prepends to active queue stack arrays.) Regardless, whenever the element's
     queue is further appended with additional items -- including $.delay()'s or even $.animate() calls, the queue's
     first entry is automatically fired. This behavior contrasts that of custom queues, which never auto-fire. */
				/* Note: When an element set is being subjected to a non-parallel Velocity call, the animation will not begin until
     each one of the elements in the set has reached the end of its individually pre-existing queue chain. */
				/* Note: Unfortunately, most people don't fully grasp jQuery's powerful, yet quirky, $.queue() function.
     Lean more here: http://stackoverflow.com/questions/1058158/can-somebody-explain-jquery-queue-to-me */
				if ((opts.queue === "" || opts.queue === "fx") && $.queue(element)[0] !== "inprogress") {
					$.dequeue(element);
				}
			}

			/**************************
    Element Set Iteration
    **************************/

			/* If the "nodeType" property exists on the elements variable, we're animating a single element.
    Place it in an array so that $.each() can iterate over it. */
			$.each(elements, function (i, element) {
				/* Ensure each element in a set has a nodeType (is a real element) to avoid throwing errors. */
				if (Type.isNode(element)) {
					processElement(element, i);
				}
			});

			/******************
    Option: Loop
    ******************/

			/* The loop option accepts an integer indicating how many times the element should loop between the values in the
    current call's properties map and the element's property values prior to this call. */
			/* Note: The loop option's logic is performed here -- after element processing -- because the current call needs
    to undergo its queue insertion prior to the loop option generating its series of constituent "reverse" calls,
    which chain after the current call. Two reverse calls (two "alternations") constitute one loop. */
			opts = $.extend({}, Velocity.defaults, options);
			opts.loop = parseInt(opts.loop, 10);
			var reverseCallsCount = opts.loop * 2 - 1;

			if (opts.loop) {
				/* Double the loop count to convert it into its appropriate number of "reverse" calls.
     Subtract 1 from the resulting value since the current call is included in the total alternation count. */
				for (var x = 0; x < reverseCallsCount; x++) {
					/* Since the logic for the reverse action occurs inside Queueing and therefore this call's options object
      isn't parsed until then as well, the current call's delay option must be explicitly passed into the reverse
      call so that the delay logic that occurs inside *Pre-Queueing* can process it. */
					var reverseOptions = {
						delay: opts.delay,
						progress: opts.progress
					};

					/* If a complete callback was passed into this call, transfer it to the loop redirect's final "reverse" call
      so that it's triggered when the entire redirect is complete (and not when the very first animation is complete). */
					if (x === reverseCallsCount - 1) {
						reverseOptions.display = opts.display;
						reverseOptions.visibility = opts.visibility;
						reverseOptions.complete = opts.complete;
					}

					animate(elements, "reverse", reverseOptions);
				}
			}

			/***************
    Chaining
    ***************/

			/* Return the elements back to the call chain, with wrapped elements taking precedence in case Velocity was called via the $.fn. extension. */
			return getChain();
		};

		/* Turn Velocity into the animation function, extended with the pre-existing Velocity object. */
		Velocity = $.extend(animate, Velocity);
		/* For legacy support, also expose the literal animate method. */
		Velocity.animate = animate;

		/**************
   Timing
   **************/

		/* Ticker function. */
		var ticker = window.requestAnimationFrame || rAFShim;

		/* Inactive browser tabs pause rAF, which results in all active animations immediately sprinting to their completion states when the tab refocuses.
   To get around this, we dynamically switch rAF to setTimeout (which the browser *doesn't* pause) when the tab loses focus. We skip this for mobile
   devices to avoid wasting battery power on inactive tabs. */
		/* Note: Tab focus detection doesn't work on older versions of IE, but that's okay since they don't support rAF to begin with. */
		if (!Velocity.State.isMobile && document.hidden !== undefined) {
			var updateTicker = function updateTicker() {
				/* Reassign the rAF function (which the global tick() function uses) based on the tab's focus state. */
				if (document.hidden) {
					ticker = function ticker(callback) {
						/* The tick function needs a truthy first argument in order to pass its internal timestamp check. */
						return setTimeout(function () {
							callback(true);
						}, 16);
					};

					/* The rAF loop has been paused by the browser, so we manually restart the tick. */
					tick();
				} else {
					ticker = window.requestAnimationFrame || rAFShim;
				}
			};

			/* Page could be sitting in the background at this time (i.e. opened as new tab) so making sure we use correct ticker from the start */
			updateTicker();

			/* And then run check again every time visibility changes */
			document.addEventListener("visibilitychange", updateTicker);
		}

		/************
   Tick
   ************/

		/* Note: All calls to Velocity are pushed to the Velocity.State.calls array, which is fully iterated through upon each tick. */
		function tick(timestamp) {
			/* An empty timestamp argument indicates that this is the first tick occurence since ticking was turned on.
    We leverage this metadata to fully ignore the first tick pass since RAF's initial pass is fired whenever
    the browser's next tick sync time occurs, which results in the first elements subjected to Velocity
    calls being animated out of sync with any elements animated immediately thereafter. In short, we ignore
    the first RAF tick pass so that elements being immediately consecutively animated -- instead of simultaneously animated
    by the same Velocity call -- are properly batched into the same initial RAF tick and consequently remain in sync thereafter. */
			if (timestamp) {
				/* We normally use RAF's high resolution timestamp but as it can be significantly offset when the browser is
     under high stress we give the option for choppiness over allowing the browser to drop huge chunks of frames.
     We use performance.now() and shim it if it doesn't exist for when the tab is hidden. */
				var timeCurrent = Velocity.timestamp && timestamp !== true ? timestamp : performance.now();

				/********************
     Call Iteration
     ********************/

				var callsLength = Velocity.State.calls.length;

				/* To speed up iterating over this array, it is compacted (falsey items -- calls that have completed -- are removed)
     when its length has ballooned to a point that can impact tick performance. This only becomes necessary when animation
     has been continuous with many elements over a long period of time; whenever all active calls are completed, completeCall() clears Velocity.State.calls. */
				if (callsLength > 10000) {
					Velocity.State.calls = compactSparseArray(Velocity.State.calls);
					callsLength = Velocity.State.calls.length;
				}

				/* Iterate through each active call. */
				for (var i = 0; i < callsLength; i++) {
					/* When a Velocity call is completed, its Velocity.State.calls entry is set to false. Continue on to the next call. */
					if (!Velocity.State.calls[i]) {
						continue;
					}

					/************************
      Call-Wide Variables
      ************************/

					var callContainer = Velocity.State.calls[i],
					    call = callContainer[0],
					    opts = callContainer[2],
					    timeStart = callContainer[3],
					    firstTick = !!timeStart,
					    tweenDummyValue = null,
					    pauseObject = callContainer[5],
					    millisecondsEllapsed = callContainer[6];

					/* If timeStart is undefined, then this is the first time that this call has been processed by tick().
      We assign timeStart now so that its value is as close to the real animation start time as possible.
      (Conversely, had timeStart been defined when this call was added to Velocity.State.calls, the delay
      between that time and now would cause the first few frames of the tween to be skipped since
      percentComplete is calculated relative to timeStart.) */
					/* Further, subtract 16ms (the approximate resolution of RAF) from the current time value so that the
      first tick iteration isn't wasted by animating at 0% tween completion, which would produce the
      same style value as the element's current value. */
					if (!timeStart) {
						timeStart = Velocity.State.calls[i][3] = timeCurrent - 16;
					}

					/* If a pause object is present, skip processing unless it has been set to resume */
					if (pauseObject) {
						if (pauseObject.resume === true) {
							/* Update the time start to accomodate the paused completion amount */
							timeStart = callContainer[3] = Math.round(timeCurrent - millisecondsEllapsed - 16);

							/* Remove pause object after processing */
							callContainer[5] = null;
						} else {
							continue;
						}
					}

					millisecondsEllapsed = callContainer[6] = timeCurrent - timeStart;

					/* The tween's completion percentage is relative to the tween's start time, not the tween's start value
      (which would result in unpredictable tween durations since JavaScript's timers are not particularly accurate).
      Accordingly, we ensure that percentComplete does not exceed 1. */
					var percentComplete = Math.min(millisecondsEllapsed / opts.duration, 1);

					/**********************
      Element Iteration
      **********************/

					/* For every call, iterate through each of the elements in its set. */
					for (var j = 0, callLength = call.length; j < callLength; j++) {
						var tweensContainer = call[j],
						    element = tweensContainer.element;

						/* Check to see if this element has been deleted midway through the animation by checking for the
       continued existence of its data cache. If it's gone, or the element is currently paused, skip animating this element. */
						if (!Data(element)) {
							continue;
						}

						var transformPropertyExists = false;

						/**********************************
       Display & Visibility Toggling
       **********************************/

						/* If the display option is set to non-"none", set it upfront so that the element can become visible before tweening begins.
       (Otherwise, display's "none" value is set in completeCall() once the animation has completed.) */
						if (opts.display !== undefined && opts.display !== null && opts.display !== "none") {
							if (opts.display === "flex") {
								var flexValues = ["-webkit-box", "-moz-box", "-ms-flexbox", "-webkit-flex"];

								$.each(flexValues, function (i, flexValue) {
									CSS.setPropertyValue(element, "display", flexValue);
								});
							}

							CSS.setPropertyValue(element, "display", opts.display);
						}

						/* Same goes with the visibility option, but its "none" equivalent is "hidden". */
						if (opts.visibility !== undefined && opts.visibility !== "hidden") {
							CSS.setPropertyValue(element, "visibility", opts.visibility);
						}

						/************************
       Property Iteration
       ************************/

						/* For every element, iterate through each property. */
						for (var property in tweensContainer) {
							/* Note: In addition to property tween data, tweensContainer contains a reference to its associated element. */
							if (tweensContainer.hasOwnProperty(property) && property !== "element") {
								var tween = tweensContainer[property],
								    currentValue,

								/* Easing can either be a pre-genereated function or a string that references a pre-registered easing
         on the Velocity.Easings object. In either case, return the appropriate easing *function*. */
								easing = Type.isString(tween.easing) ? Velocity.Easings[tween.easing] : tween.easing;

								/******************************
         Current Value Calculation
         ******************************/

								if (Type.isString(tween.pattern)) {
									var patternReplace = percentComplete === 1 ? function ($0, index, round) {
										var result = tween.endValue[index];

										return round ? Math.round(result) : result;
									} : function ($0, index, round) {
										var startValue = tween.startValue[index],
										    tweenDelta = tween.endValue[index] - startValue,
										    result = startValue + tweenDelta * easing(percentComplete, opts, tweenDelta);

										return round ? Math.round(result) : result;
									};

									currentValue = tween.pattern.replace(/{(\d+)(!)?}/g, patternReplace);
								} else if (percentComplete === 1) {
									/* If this is the last tick pass (if we've reached 100% completion for this tween),
          ensure that currentValue is explicitly set to its target endValue so that it's not subjected to any rounding. */
									currentValue = tween.endValue;
								} else {
									/* Otherwise, calculate currentValue based on the current delta from startValue. */
									var tweenDelta = tween.endValue - tween.startValue;

									currentValue = tween.startValue + tweenDelta * easing(percentComplete, opts, tweenDelta);
									/* If no value change is occurring, don't proceed with DOM updating. */
								}
								if (!firstTick && currentValue === tween.currentValue) {
									continue;
								}

								tween.currentValue = currentValue;

								/* If we're tweening a fake 'tween' property in order to log transition values, update the one-per-call variable so that
         it can be passed into the progress callback. */
								if (property === "tween") {
									tweenDummyValue = currentValue;
								} else {
									/******************
          Hooks: Part I
          ******************/
									var hookRoot;

									/* For hooked properties, the newly-updated rootPropertyValueCache is cached onto the element so that it can be used
          for subsequent hooks in this call that are associated with the same root property. If we didn't cache the updated
          rootPropertyValue, each subsequent update to the root property in this tick pass would reset the previous hook's
          updates to rootPropertyValue prior to injection. A nice performance byproduct of rootPropertyValue caching is that
          subsequently chained animations using the same hookRoot but a different hook can use this cached rootPropertyValue. */
									if (CSS.Hooks.registered[property]) {
										hookRoot = CSS.Hooks.getRoot(property);

										var rootPropertyValueCache = Data(element).rootPropertyValueCache[hookRoot];

										if (rootPropertyValueCache) {
											tween.rootPropertyValue = rootPropertyValueCache;
										}
									}

									/*****************
          DOM Update
          *****************/

									/* setPropertyValue() returns an array of the property name and property value post any normalization that may have been performed. */
									/* Note: To solve an IE<=8 positioning bug, the unit type is dropped when setting a property value of 0. */
									var adjustedSetData = CSS.setPropertyValue(element, /* SET */
									property, tween.currentValue + (IE < 9 && parseFloat(currentValue) === 0 ? "" : tween.unitType), tween.rootPropertyValue, tween.scrollData);

									/*******************
          Hooks: Part II
          *******************/

									/* Now that we have the hook's updated rootPropertyValue (the post-processed value provided by adjustedSetData), cache it onto the element. */
									if (CSS.Hooks.registered[property]) {
										/* Since adjustedSetData contains normalized data ready for DOM updating, the rootPropertyValue needs to be re-extracted from its normalized form. ?? */
										if (CSS.Normalizations.registered[hookRoot]) {
											Data(element).rootPropertyValueCache[hookRoot] = CSS.Normalizations.registered[hookRoot]("extract", null, adjustedSetData[1]);
										} else {
											Data(element).rootPropertyValueCache[hookRoot] = adjustedSetData[1];
										}
									}

									/***************
          Transforms
          ***************/

									/* Flag whether a transform property is being animated so that flushTransformCache() can be triggered once this tick pass is complete. */
									if (adjustedSetData[0] === "transform") {
										transformPropertyExists = true;
									}
								}
							}
						}

						/****************
       mobileHA
       ****************/

						/* If mobileHA is enabled, set the translate3d transform to null to force hardware acceleration.
       It's safe to override this property since Velocity doesn't actually support its animation (hooks are used in its place). */
						if (opts.mobileHA) {
							/* Don't set the null transform hack if we've already done so. */
							if (Data(element).transformCache.translate3d === undefined) {
								/* All entries on the transformCache object are later concatenated into a single transform string via flushTransformCache(). */
								Data(element).transformCache.translate3d = "(0px, 0px, 0px)";

								transformPropertyExists = true;
							}
						}

						if (transformPropertyExists) {
							CSS.flushTransformCache(element);
						}
					}

					/* The non-"none" display value is only applied to an element once -- when its associated call is first ticked through.
      Accordingly, it's set to false so that it isn't re-processed by this call in the next tick. */
					if (opts.display !== undefined && opts.display !== "none") {
						Velocity.State.calls[i][2].display = false;
					}
					if (opts.visibility !== undefined && opts.visibility !== "hidden") {
						Velocity.State.calls[i][2].visibility = false;
					}

					/* Pass the elements and the timing data (percentComplete, msRemaining, timeStart, tweenDummyValue) into the progress callback. */
					if (opts.progress) {
						opts.progress.call(callContainer[1], callContainer[1], percentComplete, Math.max(0, timeStart + opts.duration - timeCurrent), timeStart, tweenDummyValue);
					}

					/* If this call has finished tweening, pass its index to completeCall() to handle call cleanup. */
					if (percentComplete === 1) {
						completeCall(i);
					}
				}
			}

			/* Note: completeCall() sets the isTicking flag to false when the last call on Velocity.State.calls has completed. */
			if (Velocity.State.isTicking) {
				ticker(tick);
			}
		}

		/**********************
   Call Completion
   **********************/

		/* Note: Unlike tick(), which processes all active calls at once, call completion is handled on a per-call basis. */
		function completeCall(callIndex, isStopped) {
			/* Ensure the call exists. */
			if (!Velocity.State.calls[callIndex]) {
				return false;
			}

			/* Pull the metadata from the call. */
			var call = Velocity.State.calls[callIndex][0],
			    elements = Velocity.State.calls[callIndex][1],
			    opts = Velocity.State.calls[callIndex][2],
			    resolver = Velocity.State.calls[callIndex][4];

			var remainingCallsExist = false;

			/*************************
    Element Finalization
    *************************/

			for (var i = 0, callLength = call.length; i < callLength; i++) {
				var element = call[i].element;

				/* If the user set display to "none" (intending to hide the element), set it now that the animation has completed. */
				/* Note: display:none isn't set when calls are manually stopped (via Velocity("stop"). */
				/* Note: Display gets ignored with "reverse" calls and infinite loops, since this behavior would be undesirable. */
				if (!isStopped && !opts.loop) {
					if (opts.display === "none") {
						CSS.setPropertyValue(element, "display", opts.display);
					}

					if (opts.visibility === "hidden") {
						CSS.setPropertyValue(element, "visibility", opts.visibility);
					}
				}

				/* If the element's queue is empty (if only the "inprogress" item is left at position 0) or if its queue is about to run
     a non-Velocity-initiated entry, turn off the isAnimating flag. A non-Velocity-initiatied queue entry's logic might alter
     an element's CSS values and thereby cause Velocity's cached value data to go stale. To detect if a queue entry was initiated by Velocity,
     we check for the existence of our special Velocity.queueEntryFlag declaration, which minifiers won't rename since the flag
     is assigned to jQuery's global $ object and thus exists out of Velocity's own scope. */
				var data = Data(element);

				if (opts.loop !== true && ($.queue(element)[1] === undefined || !/\.velocityQueueEntryFlag/i.test($.queue(element)[1]))) {
					/* The element may have been deleted. Ensure that its data cache still exists before acting on it. */
					if (data) {
						data.isAnimating = false;
						/* Clear the element's rootPropertyValueCache, which will become stale. */
						data.rootPropertyValueCache = {};

						var transformHAPropertyExists = false;
						/* If any 3D transform subproperty is at its default value (regardless of unit type), remove it. */
						$.each(CSS.Lists.transforms3D, function (i, transformName) {
							var defaultValue = /^scale/.test(transformName) ? 1 : 0,
							    currentValue = data.transformCache[transformName];

							if (data.transformCache[transformName] !== undefined && new RegExp("^\\(" + defaultValue + "[^.]").test(currentValue)) {
								transformHAPropertyExists = true;

								delete data.transformCache[transformName];
							}
						});

						/* Mobile devices have hardware acceleration removed at the end of the animation in order to avoid hogging the GPU's memory. */
						if (opts.mobileHA) {
							transformHAPropertyExists = true;
							delete data.transformCache.translate3d;
						}

						/* Flush the subproperty removals to the DOM. */
						if (transformHAPropertyExists) {
							CSS.flushTransformCache(element);
						}

						/* Remove the "velocity-animating" indicator class. */
						CSS.Values.removeClass(element, "velocity-animating");
					}
				}

				/*********************
     Option: Complete
     *********************/

				/* Complete is fired once per call (not once per element) and is passed the full raw DOM element set as both its context and its first argument. */
				/* Note: Callbacks aren't fired when calls are manually stopped (via Velocity("stop"). */
				if (!isStopped && opts.complete && !opts.loop && i === callLength - 1) {
					/* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
					try {
						opts.complete.call(elements, elements);
					} catch (error) {
						setTimeout(function () {
							throw error;
						}, 1);
					}
				}

				/**********************
     Promise Resolving
     **********************/

				/* Note: Infinite loops don't return promises. */
				if (resolver && opts.loop !== true) {
					resolver(elements);
				}

				/****************************
     Option: Loop (Infinite)
     ****************************/

				if (data && opts.loop === true && !isStopped) {
					/* If a rotateX/Y/Z property is being animated by 360 deg with loop:true, swap tween start/end values to enable
      continuous iterative rotation looping. (Otherise, the element would just rotate back and forth.) */
					$.each(data.tweensContainer, function (propertyName, tweenContainer) {
						if (/^rotate/.test(propertyName) && (parseFloat(tweenContainer.startValue) - parseFloat(tweenContainer.endValue)) % 360 === 0) {
							var oldStartValue = tweenContainer.startValue;

							tweenContainer.startValue = tweenContainer.endValue;
							tweenContainer.endValue = oldStartValue;
						}

						if (/^backgroundPosition/.test(propertyName) && parseFloat(tweenContainer.endValue) === 100 && tweenContainer.unitType === "%") {
							tweenContainer.endValue = 0;
							tweenContainer.startValue = 100;
						}
					});

					Velocity(element, "reverse", { loop: true, delay: opts.delay });
				}

				/***************
     Dequeueing
     ***************/

				/* Fire the next call in the queue so long as this call's queue wasn't set to false (to trigger a parallel animation),
     which would have already caused the next call to fire. Note: Even if the end of the animation queue has been reached,
     $.dequeue() must still be called in order to completely clear jQuery's animation queue. */
				if (opts.queue !== false) {
					$.dequeue(element, opts.queue);
				}
			}

			/************************
    Calls Array Cleanup
    ************************/

			/* Since this call is complete, set it to false so that the rAF tick skips it. This array is later compacted via compactSparseArray().
    (For performance reasons, the call is set to false instead of being deleted from the array: http://www.html5rocks.com/en/tutorials/speed/v8/) */
			Velocity.State.calls[callIndex] = false;

			/* Iterate through the calls array to determine if this was the final in-progress animation.
    If so, set a flag to end ticking and clear the calls array. */
			for (var j = 0, callsLength = Velocity.State.calls.length; j < callsLength; j++) {
				if (Velocity.State.calls[j] !== false) {
					remainingCallsExist = true;

					break;
				}
			}

			if (remainingCallsExist === false) {
				/* tick() will detect this flag upon its next iteration and subsequently turn itself off. */
				Velocity.State.isTicking = false;

				/* Clear the calls array so that its length is reset. */
				delete Velocity.State.calls;
				Velocity.State.calls = [];
			}
		}

		/******************
   Frameworks
   ******************/

		/* Both jQuery and Zepto allow their $.fn object to be extended to allow wrapped elements to be subjected to plugin calls.
   If either framework is loaded, register a "velocity" extension pointing to Velocity's core animate() method.  Velocity
   also registers itself onto a global container (window.jQuery || window.Zepto || window) so that certain features are
   accessible beyond just a per-element scope. This master object contains an .animate() method, which is later assigned to $.fn
   (if jQuery or Zepto are present). Accordingly, Velocity can both act on wrapped DOM elements and stand alone for targeting raw DOM elements. */
		global.Velocity = Velocity;

		if (global !== window) {
			/* Assign the element function to Velocity's core animate() method. */
			global.fn.velocity = animate;
			/* Assign the object function's defaults to Velocity's global defaults object. */
			global.fn.velocity.defaults = Velocity.defaults;
		}

		/***********************
   Packaged Redirects
   ***********************/

		/* slideUp, slideDown */
		$.each(["Down", "Up"], function (i, direction) {
			Velocity.Redirects["slide" + direction] = function (element, options, elementsIndex, elementsSize, elements, promiseData) {
				var opts = $.extend({}, options),
				    begin = opts.begin,
				    complete = opts.complete,
				    inlineValues = {},
				    computedValues = { height: "", marginTop: "", marginBottom: "", paddingTop: "", paddingBottom: "" };

				if (opts.display === undefined) {
					/* Show the element before slideDown begins and hide the element after slideUp completes. */
					/* Note: Inline elements cannot have dimensions animated, so they're reverted to inline-block. */
					opts.display = direction === "Down" ? Velocity.CSS.Values.getDisplayType(element) === "inline" ? "inline-block" : "block" : "none";
				}

				opts.begin = function () {
					/* If the user passed in a begin callback, fire it now. */
					if (elementsIndex === 0 && begin) {
						begin.call(elements, elements);
					}

					/* Cache the elements' original vertical dimensional property values so that we can animate back to them. */
					for (var property in computedValues) {
						if (!computedValues.hasOwnProperty(property)) {
							continue;
						}
						inlineValues[property] = element.style[property];

						/* For slideDown, use forcefeeding to animate all vertical properties from 0. For slideUp,
       use forcefeeding to start from computed values and animate down to 0. */
						var propertyValue = CSS.getPropertyValue(element, property);
						computedValues[property] = direction === "Down" ? [propertyValue, 0] : [0, propertyValue];
					}

					/* Force vertical overflow content to clip so that sliding works as expected. */
					inlineValues.overflow = element.style.overflow;
					element.style.overflow = "hidden";
				};

				opts.complete = function () {
					/* Reset element to its pre-slide inline values once its slide animation is complete. */
					for (var property in inlineValues) {
						if (inlineValues.hasOwnProperty(property)) {
							element.style[property] = inlineValues[property];
						}
					}

					/* If the user passed in a complete callback, fire it now. */
					if (elementsIndex === elementsSize - 1) {
						if (complete) {
							complete.call(elements, elements);
						}
						if (promiseData) {
							promiseData.resolver(elements);
						}
					}
				};

				Velocity(element, computedValues, opts);
			};
		});

		/* fadeIn, fadeOut */
		$.each(["In", "Out"], function (i, direction) {
			Velocity.Redirects["fade" + direction] = function (element, options, elementsIndex, elementsSize, elements, promiseData) {
				var opts = $.extend({}, options),
				    complete = opts.complete,
				    propertiesMap = { opacity: direction === "In" ? 1 : 0 };

				/* Since redirects are triggered individually for each element in the animated set, avoid repeatedly triggering
     callbacks by firing them only when the final element has been reached. */
				if (elementsIndex !== 0) {
					opts.begin = null;
				}
				if (elementsIndex !== elementsSize - 1) {
					opts.complete = null;
				} else {
					opts.complete = function () {
						if (complete) {
							complete.call(elements, elements);
						}
						if (promiseData) {
							promiseData.resolver(elements);
						}
					};
				}

				/* If a display was passed in, use it. Otherwise, default to "none" for fadeOut or the element-specific default for fadeIn. */
				/* Note: We allow users to pass in "null" to skip display setting altogether. */
				if (opts.display === undefined) {
					opts.display = direction === "In" ? "auto" : "none";
				}

				Velocity(this, propertiesMap, opts);
			};
		});

		return Velocity;
	}(window.jQuery || window.Zepto || window, window, window ? window.document : undefined);
});

/******************
 Known Issues
 ******************/

/* The CSS spec mandates that the translateX/Y/Z transforms are %-relative to the element itself -- not its parent.
 Velocity, however, doesn't make this distinction. Thus, converting to or from the % unit with these subproperties
 will produce an inaccurate conversion value. The same issue exists with the cx/cy attributes of SVG circles and ellipses. */

/**********************
 Velocity UI Pack
 **********************/

/* VelocityJS.org UI Pack (5.2.0). (C) 2014 Julian Shapiro. MIT @license: en.wikipedia.org/wiki/MIT_License. Portions copyright Daniel Eden, Christian Pucci. */

(function (factory) {
	"use strict";
	/* CommonJS module. */

	if (typeof require === "function" && (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === "object") {
		module.exports = factory();
		/* AMD module. */
	} else if (typeof define === "function" && define.amd) {
		define(["velocity"], factory);
		/* Browser globals. */
	} else {
		factory();
	}
})(function () {
	"use strict";

	return function (global, window, document, undefined) {

		/*************
   Checks
   *************/
		var Velocity = global.Velocity;

		if (!Velocity || !Velocity.Utilities) {
			if (window.console) {
				console.log("Velocity UI Pack: Velocity must be loaded first. Aborting.");
			}
			return;
		}
		var $ = Velocity.Utilities;

		var velocityVersion = Velocity.version,
		    requiredVersion = { major: 1, minor: 1, patch: 0 };

		function greaterSemver(primary, secondary) {
			var versionInts = [];

			if (!primary || !secondary) {
				return false;
			}

			$.each([primary, secondary], function (i, versionObject) {
				var versionIntsComponents = [];

				$.each(versionObject, function (component, value) {
					while (value.toString().length < 5) {
						value = "0" + value;
					}
					versionIntsComponents.push(value);
				});

				versionInts.push(versionIntsComponents.join(""));
			});

			return parseFloat(versionInts[0]) > parseFloat(versionInts[1]);
		}

		if (greaterSemver(requiredVersion, velocityVersion)) {
			var abortError = "Velocity UI Pack: You need to update Velocity (velocity.js) to a newer version. Visit http://github.com/julianshapiro/velocity.";
			alert(abortError);
			throw new Error(abortError);
		}

		/************************
   Effect Registration
   ************************/

		/* Note: RegisterUI is a legacy name. */
		Velocity.RegisterEffect = Velocity.RegisterUI = function (effectName, properties) {
			/* Animate the expansion/contraction of the elements' parent's height for In/Out effects. */
			function animateParentHeight(elements, direction, totalDuration, stagger) {
				var totalHeightDelta = 0,
				    parentNode;

				/* Sum the total height (including padding and margin) of all targeted elements. */
				$.each(elements.nodeType ? [elements] : elements, function (i, element) {
					if (stagger) {
						/* Increase the totalDuration by the successive delay amounts produced by the stagger option. */
						totalDuration += i * stagger;
					}

					parentNode = element.parentNode;

					var propertiesToSum = ["height", "paddingTop", "paddingBottom", "marginTop", "marginBottom"];

					/* If box-sizing is border-box, the height already includes padding and margin */
					if (Velocity.CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() === "border-box") {
						propertiesToSum = ["height"];
					}

					$.each(propertiesToSum, function (i, property) {
						totalHeightDelta += parseFloat(Velocity.CSS.getPropertyValue(element, property));
					});
				});

				/* Animate the parent element's height adjustment (with a varying duration multiplier for aesthetic benefits). */
				Velocity.animate(parentNode, { height: (direction === "In" ? "+" : "-") + "=" + totalHeightDelta }, { queue: false, easing: "ease-in-out", duration: totalDuration * (direction === "In" ? 0.6 : 1) });
			}

			/* Register a custom redirect for each effect. */
			Velocity.Redirects[effectName] = function (element, redirectOptions, elementsIndex, elementsSize, elements, promiseData, loop) {
				var finalElement = elementsIndex === elementsSize - 1,
				    totalDuration = 0;

				loop = loop || properties.loop;
				if (typeof properties.defaultDuration === "function") {
					properties.defaultDuration = properties.defaultDuration.call(elements, elements);
				} else {
					properties.defaultDuration = parseFloat(properties.defaultDuration);
				}

				/* Get the total duration used, so we can share it out with everything that doesn't have a duration */
				for (var callIndex = 0; callIndex < properties.calls.length; callIndex++) {
					durationPercentage = properties.calls[callIndex][1];
					if (typeof durationPercentage === "number") {
						totalDuration += durationPercentage;
					}
				}
				var shareDuration = totalDuration >= 1 ? 0 : properties.calls.length ? (1 - totalDuration) / properties.calls.length : 1;

				/* Iterate through each effect's call array. */
				for (callIndex = 0; callIndex < properties.calls.length; callIndex++) {
					var call = properties.calls[callIndex],
					    propertyMap = call[0],
					    redirectDuration = 1000,
					    durationPercentage = call[1],
					    callOptions = call[2] || {},
					    opts = {};

					if (redirectOptions.duration !== undefined) {
						redirectDuration = redirectOptions.duration;
					} else if (properties.defaultDuration !== undefined) {
						redirectDuration = properties.defaultDuration;
					}

					/* Assign the whitelisted per-call options. */
					opts.duration = redirectDuration * (typeof durationPercentage === "number" ? durationPercentage : shareDuration);
					opts.queue = redirectOptions.queue || "";
					opts.easing = callOptions.easing || "ease";
					opts.delay = parseFloat(callOptions.delay) || 0;
					opts.loop = !properties.loop && callOptions.loop;
					opts._cacheValues = callOptions._cacheValues || true;

					/* Special processing for the first effect call. */
					if (callIndex === 0) {
						/* If a delay was passed into the redirect, combine it with the first call's delay. */
						opts.delay += parseFloat(redirectOptions.delay) || 0;

						if (elementsIndex === 0) {
							opts.begin = function () {
								/* Only trigger a begin callback on the first effect call with the first element in the set. */
								if (redirectOptions.begin) {
									redirectOptions.begin.call(elements, elements);
								}

								var direction = effectName.match(/(In|Out)$/);

								/* Make "in" transitioning elements invisible immediately so that there's no FOUC between now
         and the first RAF tick. */
								if (direction && direction[0] === "In" && propertyMap.opacity !== undefined) {
									$.each(elements.nodeType ? [elements] : elements, function (i, element) {
										Velocity.CSS.setPropertyValue(element, "opacity", 0);
									});
								}

								/* Only trigger animateParentHeight() if we're using an In/Out transition. */
								if (redirectOptions.animateParentHeight && direction) {
									animateParentHeight(elements, direction[0], redirectDuration + opts.delay, redirectOptions.stagger);
								}
							};
						}

						/* If the user isn't overriding the display option, default to "auto" for "In"-suffixed transitions. */
						if (redirectOptions.display !== null) {
							if (redirectOptions.display !== undefined && redirectOptions.display !== "none") {
								opts.display = redirectOptions.display;
							} else if (/In$/.test(effectName)) {
								/* Inline elements cannot be subjected to transforms, so we switch them to inline-block. */
								var defaultDisplay = Velocity.CSS.Values.getDisplayType(element);
								opts.display = defaultDisplay === "inline" ? "inline-block" : defaultDisplay;
							}
						}

						if (redirectOptions.visibility && redirectOptions.visibility !== "hidden") {
							opts.visibility = redirectOptions.visibility;
						}
					}

					/* Special processing for the last effect call. */
					if (callIndex === properties.calls.length - 1) {
						/* Append promise resolving onto the user's redirect callback. */
						var injectFinalCallbacks = function injectFinalCallbacks() {
							if ((redirectOptions.display === undefined || redirectOptions.display === "none") && /Out$/.test(effectName)) {
								$.each(elements.nodeType ? [elements] : elements, function (i, element) {
									Velocity.CSS.setPropertyValue(element, "display", "none");
								});
							}
							if (redirectOptions.complete) {
								redirectOptions.complete.call(elements, elements);
							}
							if (promiseData) {
								promiseData.resolver(elements || element);
							}
						};

						opts.complete = function () {
							if (loop) {
								Velocity.Redirects[effectName](element, redirectOptions, elementsIndex, elementsSize, elements, promiseData, loop === true ? true : Math.max(0, loop - 1));
							}
							if (properties.reset) {
								for (var resetProperty in properties.reset) {
									if (!properties.reset.hasOwnProperty(resetProperty)) {
										continue;
									}
									var resetValue = properties.reset[resetProperty];

									/* Format each non-array value in the reset property map to [ value, value ] so that changes apply
          immediately and DOM querying is avoided (via forcefeeding). */
									/* Note: Don't forcefeed hooks, otherwise their hook roots will be defaulted to their null values. */
									if (Velocity.CSS.Hooks.registered[resetProperty] === undefined && (typeof resetValue === "string" || typeof resetValue === "number")) {
										properties.reset[resetProperty] = [properties.reset[resetProperty], properties.reset[resetProperty]];
									}
								}

								/* So that the reset values are applied instantly upon the next rAF tick, use a zero duration and parallel queueing. */
								var resetOptions = { duration: 0, queue: false };

								/* Since the reset option uses up the complete callback, we trigger the user's complete callback at the end of ours. */
								if (finalElement) {
									resetOptions.complete = injectFinalCallbacks;
								}

								Velocity.animate(element, properties.reset, resetOptions);
								/* Only trigger the user's complete callback on the last effect call with the last element in the set. */
							} else if (finalElement) {
								injectFinalCallbacks();
							}
						};

						if (redirectOptions.visibility === "hidden") {
							opts.visibility = redirectOptions.visibility;
						}
					}

					Velocity.animate(element, propertyMap, opts);
				}
			};

			/* Return the Velocity object so that RegisterUI calls can be chained. */
			return Velocity;
		};

		/*********************
   Packaged Effects
   *********************/

		/* Externalize the packagedEffects data so that they can optionally be modified and re-registered. */
		/* Support: <=IE8: Callouts will have no effect, and transitions will simply fade in/out. IE9/Android 2.3: Most effects are fully supported, the rest fade in/out. All other browsers: full support. */
		Velocity.RegisterEffect.packagedEffects = {
			/* Animate.css */
			"callout.bounce": {
				defaultDuration: 550,
				calls: [[{ translateY: -30 }, 0.25], [{ translateY: 0 }, 0.125], [{ translateY: -15 }, 0.125], [{ translateY: 0 }, 0.25]]
			},
			/* Animate.css */
			"callout.shake": {
				defaultDuration: 800,
				calls: [[{ translateX: -11 }], [{ translateX: 11 }], [{ translateX: -11 }], [{ translateX: 11 }], [{ translateX: -11 }], [{ translateX: 11 }], [{ translateX: -11 }], [{ translateX: 0 }]]
			},
			/* Animate.css */
			"callout.flash": {
				defaultDuration: 1100,
				calls: [[{ opacity: [0, "easeInOutQuad", 1] }], [{ opacity: [1, "easeInOutQuad"] }], [{ opacity: [0, "easeInOutQuad"] }], [{ opacity: [1, "easeInOutQuad"] }]]
			},
			/* Animate.css */
			"callout.pulse": {
				defaultDuration: 825,
				calls: [[{ scaleX: 1.1, scaleY: 1.1 }, 0.50, { easing: "easeInExpo" }], [{ scaleX: 1, scaleY: 1 }, 0.50]]
			},
			/* Animate.css */
			"callout.swing": {
				defaultDuration: 950,
				calls: [[{ rotateZ: 15 }], [{ rotateZ: -10 }], [{ rotateZ: 5 }], [{ rotateZ: -5 }], [{ rotateZ: 0 }]]
			},
			/* Animate.css */
			"callout.tada": {
				defaultDuration: 1000,
				calls: [[{ scaleX: 0.9, scaleY: 0.9, rotateZ: -3 }, 0.10], [{ scaleX: 1.1, scaleY: 1.1, rotateZ: 3 }, 0.10], [{ scaleX: 1.1, scaleY: 1.1, rotateZ: -3 }, 0.10], ["reverse", 0.125], ["reverse", 0.125], ["reverse", 0.125], ["reverse", 0.125], ["reverse", 0.125], [{ scaleX: 1, scaleY: 1, rotateZ: 0 }, 0.20]]
			},
			"transition.fadeIn": {
				defaultDuration: 500,
				calls: [[{ opacity: [1, 0] }]]
			},
			"transition.fadeOut": {
				defaultDuration: 500,
				calls: [[{ opacity: [0, 1] }]]
			},
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.flipXIn": {
				defaultDuration: 700,
				calls: [[{ opacity: [1, 0], transformPerspective: [800, 800], rotateY: [0, -55] }]],
				reset: { transformPerspective: 0 }
			},
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.flipXOut": {
				defaultDuration: 700,
				calls: [[{ opacity: [0, 1], transformPerspective: [800, 800], rotateY: 55 }]],
				reset: { transformPerspective: 0, rotateY: 0 }
			},
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.flipYIn": {
				defaultDuration: 800,
				calls: [[{ opacity: [1, 0], transformPerspective: [800, 800], rotateX: [0, -45] }]],
				reset: { transformPerspective: 0 }
			},
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.flipYOut": {
				defaultDuration: 800,
				calls: [[{ opacity: [0, 1], transformPerspective: [800, 800], rotateX: 25 }]],
				reset: { transformPerspective: 0, rotateX: 0 }
			},
			/* Animate.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.flipBounceXIn": {
				defaultDuration: 900,
				calls: [[{ opacity: [0.725, 0], transformPerspective: [400, 400], rotateY: [-10, 90] }, 0.50], [{ opacity: 0.80, rotateY: 10 }, 0.25], [{ opacity: 1, rotateY: 0 }, 0.25]],
				reset: { transformPerspective: 0 }
			},
			/* Animate.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.flipBounceXOut": {
				defaultDuration: 800,
				calls: [[{ opacity: [0.9, 1], transformPerspective: [400, 400], rotateY: -10 }], [{ opacity: 0, rotateY: 90 }]],
				reset: { transformPerspective: 0, rotateY: 0 }
			},
			/* Animate.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.flipBounceYIn": {
				defaultDuration: 850,
				calls: [[{ opacity: [0.725, 0], transformPerspective: [400, 400], rotateX: [-10, 90] }, 0.50], [{ opacity: 0.80, rotateX: 10 }, 0.25], [{ opacity: 1, rotateX: 0 }, 0.25]],
				reset: { transformPerspective: 0 }
			},
			/* Animate.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.flipBounceYOut": {
				defaultDuration: 800,
				calls: [[{ opacity: [0.9, 1], transformPerspective: [400, 400], rotateX: -15 }], [{ opacity: 0, rotateX: 90 }]],
				reset: { transformPerspective: 0, rotateX: 0 }
			},
			/* Magic.css */
			"transition.swoopIn": {
				defaultDuration: 850,
				calls: [[{ opacity: [1, 0], transformOriginX: ["100%", "50%"], transformOriginY: ["100%", "100%"], scaleX: [1, 0], scaleY: [1, 0], translateX: [0, -700], translateZ: 0 }]],
				reset: { transformOriginX: "50%", transformOriginY: "50%" }
			},
			/* Magic.css */
			"transition.swoopOut": {
				defaultDuration: 850,
				calls: [[{ opacity: [0, 1], transformOriginX: ["50%", "100%"], transformOriginY: ["100%", "100%"], scaleX: 0, scaleY: 0, translateX: -700, translateZ: 0 }]],
				reset: { transformOriginX: "50%", transformOriginY: "50%", scaleX: 1, scaleY: 1, translateX: 0 }
			},
			/* Magic.css */
			/* Support: Loses rotation in IE9/Android 2.3. (Fades and scales only.) */
			"transition.whirlIn": {
				defaultDuration: 850,
				calls: [[{ opacity: [1, 0], transformOriginX: ["50%", "50%"], transformOriginY: ["50%", "50%"], scaleX: [1, 0], scaleY: [1, 0], rotateY: [0, 160] }, 1, { easing: "easeInOutSine" }]]
			},
			/* Magic.css */
			/* Support: Loses rotation in IE9/Android 2.3. (Fades and scales only.) */
			"transition.whirlOut": {
				defaultDuration: 750,
				calls: [[{ opacity: [0, "easeInOutQuint", 1], transformOriginX: ["50%", "50%"], transformOriginY: ["50%", "50%"], scaleX: 0, scaleY: 0, rotateY: 160 }, 1, { easing: "swing" }]],
				reset: { scaleX: 1, scaleY: 1, rotateY: 0 }
			},
			"transition.shrinkIn": {
				defaultDuration: 750,
				calls: [[{ opacity: [1, 0], transformOriginX: ["50%", "50%"], transformOriginY: ["50%", "50%"], scaleX: [1, 1.5], scaleY: [1, 1.5], translateZ: 0 }]]
			},
			"transition.shrinkOut": {
				defaultDuration: 600,
				calls: [[{ opacity: [0, 1], transformOriginX: ["50%", "50%"], transformOriginY: ["50%", "50%"], scaleX: 1.3, scaleY: 1.3, translateZ: 0 }]],
				reset: { scaleX: 1, scaleY: 1 }
			},
			"transition.expandIn": {
				defaultDuration: 700,
				calls: [[{ opacity: [1, 0], transformOriginX: ["50%", "50%"], transformOriginY: ["50%", "50%"], scaleX: [1, 0.625], scaleY: [1, 0.625], translateZ: 0 }]]
			},
			"transition.expandOut": {
				defaultDuration: 700,
				calls: [[{ opacity: [0, 1], transformOriginX: ["50%", "50%"], transformOriginY: ["50%", "50%"], scaleX: 0.5, scaleY: 0.5, translateZ: 0 }]],
				reset: { scaleX: 1, scaleY: 1 }
			},
			/* Animate.css */
			"transition.bounceIn": {
				defaultDuration: 800,
				calls: [[{ opacity: [1, 0], scaleX: [1.05, 0.3], scaleY: [1.05, 0.3] }, 0.35], [{ scaleX: 0.9, scaleY: 0.9, translateZ: 0 }, 0.20], [{ scaleX: 1, scaleY: 1 }, 0.45]]
			},
			/* Animate.css */
			"transition.bounceOut": {
				defaultDuration: 800,
				calls: [[{ scaleX: 0.95, scaleY: 0.95 }, 0.35], [{ scaleX: 1.1, scaleY: 1.1, translateZ: 0 }, 0.35], [{ opacity: [0, 1], scaleX: 0.3, scaleY: 0.3 }, 0.30]],
				reset: { scaleX: 1, scaleY: 1 }
			},
			/* Animate.css */
			"transition.bounceUpIn": {
				defaultDuration: 800,
				calls: [[{ opacity: [1, 0], translateY: [-30, 1000] }, 0.60, { easing: "easeOutCirc" }], [{ translateY: 10 }, 0.20], [{ translateY: 0 }, 0.20]]
			},
			/* Animate.css */
			"transition.bounceUpOut": {
				defaultDuration: 1000,
				calls: [[{ translateY: 20 }, 0.20], [{ opacity: [0, "easeInCirc", 1], translateY: -1000 }, 0.80]],
				reset: { translateY: 0 }
			},
			/* Animate.css */
			"transition.bounceDownIn": {
				defaultDuration: 800,
				calls: [[{ opacity: [1, 0], translateY: [30, -1000] }, 0.60, { easing: "easeOutCirc" }], [{ translateY: -10 }, 0.20], [{ translateY: 0 }, 0.20]]
			},
			/* Animate.css */
			"transition.bounceDownOut": {
				defaultDuration: 1000,
				calls: [[{ translateY: -20 }, 0.20], [{ opacity: [0, "easeInCirc", 1], translateY: 1000 }, 0.80]],
				reset: { translateY: 0 }
			},
			/* Animate.css */
			"transition.bounceLeftIn": {
				defaultDuration: 750,
				calls: [[{ opacity: [1, 0], translateX: [30, -1250] }, 0.60, { easing: "easeOutCirc" }], [{ translateX: -10 }, 0.20], [{ translateX: 0 }, 0.20]]
			},
			/* Animate.css */
			"transition.bounceLeftOut": {
				defaultDuration: 750,
				calls: [[{ translateX: 30 }, 0.20], [{ opacity: [0, "easeInCirc", 1], translateX: -1250 }, 0.80]],
				reset: { translateX: 0 }
			},
			/* Animate.css */
			"transition.bounceRightIn": {
				defaultDuration: 750,
				calls: [[{ opacity: [1, 0], translateX: [-30, 1250] }, 0.60, { easing: "easeOutCirc" }], [{ translateX: 10 }, 0.20], [{ translateX: 0 }, 0.20]]
			},
			/* Animate.css */
			"transition.bounceRightOut": {
				defaultDuration: 750,
				calls: [[{ translateX: -30 }, 0.20], [{ opacity: [0, "easeInCirc", 1], translateX: 1250 }, 0.80]],
				reset: { translateX: 0 }
			},
			"transition.slideUpIn": {
				defaultDuration: 900,
				calls: [[{ opacity: [1, 0], translateY: [0, 20], translateZ: 0 }]]
			},
			"transition.slideUpOut": {
				defaultDuration: 900,
				calls: [[{ opacity: [0, 1], translateY: -20, translateZ: 0 }]],
				reset: { translateY: 0 }
			},
			"transition.slideDownIn": {
				defaultDuration: 900,
				calls: [[{ opacity: [1, 0], translateY: [0, -20], translateZ: 0 }]]
			},
			"transition.slideDownOut": {
				defaultDuration: 900,
				calls: [[{ opacity: [0, 1], translateY: 20, translateZ: 0 }]],
				reset: { translateY: 0 }
			},
			"transition.slideLeftIn": {
				defaultDuration: 1000,
				calls: [[{ opacity: [1, 0], translateX: [0, -20], translateZ: 0 }]]
			},
			"transition.slideLeftOut": {
				defaultDuration: 1050,
				calls: [[{ opacity: [0, 1], translateX: -20, translateZ: 0 }]],
				reset: { translateX: 0 }
			},
			"transition.slideRightIn": {
				defaultDuration: 1000,
				calls: [[{ opacity: [1, 0], translateX: [0, 20], translateZ: 0 }]]
			},
			"transition.slideRightOut": {
				defaultDuration: 1050,
				calls: [[{ opacity: [0, 1], translateX: 20, translateZ: 0 }]],
				reset: { translateX: 0 }
			},
			"transition.slideUpBigIn": {
				defaultDuration: 850,
				calls: [[{ opacity: [1, 0], translateY: [0, 75], translateZ: 0 }]]
			},
			"transition.slideUpBigOut": {
				defaultDuration: 800,
				calls: [[{ opacity: [0, 1], translateY: -75, translateZ: 0 }]],
				reset: { translateY: 0 }
			},
			"transition.slideDownBigIn": {
				defaultDuration: 850,
				calls: [[{ opacity: [1, 0], translateY: [0, -75], translateZ: 0 }]]
			},
			"transition.slideDownBigOut": {
				defaultDuration: 800,
				calls: [[{ opacity: [0, 1], translateY: 75, translateZ: 0 }]],
				reset: { translateY: 0 }
			},
			"transition.slideLeftBigIn": {
				defaultDuration: 800,
				calls: [[{ opacity: [1, 0], translateX: [0, -75], translateZ: 0 }]]
			},
			"transition.slideLeftBigOut": {
				defaultDuration: 750,
				calls: [[{ opacity: [0, 1], translateX: -75, translateZ: 0 }]],
				reset: { translateX: 0 }
			},
			"transition.slideRightBigIn": {
				defaultDuration: 800,
				calls: [[{ opacity: [1, 0], translateX: [0, 75], translateZ: 0 }]]
			},
			"transition.slideRightBigOut": {
				defaultDuration: 750,
				calls: [[{ opacity: [0, 1], translateX: 75, translateZ: 0 }]],
				reset: { translateX: 0 }
			},
			/* Magic.css */
			"transition.perspectiveUpIn": {
				defaultDuration: 800,
				calls: [[{ opacity: [1, 0], transformPerspective: [800, 800], transformOriginX: [0, 0], transformOriginY: ["100%", "100%"], rotateX: [0, -180] }]],
				reset: { transformPerspective: 0, transformOriginX: "50%", transformOriginY: "50%" }
			},
			/* Magic.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.perspectiveUpOut": {
				defaultDuration: 850,
				calls: [[{ opacity: [0, 1], transformPerspective: [800, 800], transformOriginX: [0, 0], transformOriginY: ["100%", "100%"], rotateX: -180 }]],
				reset: { transformPerspective: 0, transformOriginX: "50%", transformOriginY: "50%", rotateX: 0 }
			},
			/* Magic.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.perspectiveDownIn": {
				defaultDuration: 800,
				calls: [[{ opacity: [1, 0], transformPerspective: [800, 800], transformOriginX: [0, 0], transformOriginY: [0, 0], rotateX: [0, 180] }]],
				reset: { transformPerspective: 0, transformOriginX: "50%", transformOriginY: "50%" }
			},
			/* Magic.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.perspectiveDownOut": {
				defaultDuration: 850,
				calls: [[{ opacity: [0, 1], transformPerspective: [800, 800], transformOriginX: [0, 0], transformOriginY: [0, 0], rotateX: 180 }]],
				reset: { transformPerspective: 0, transformOriginX: "50%", transformOriginY: "50%", rotateX: 0 }
			},
			/* Magic.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.perspectiveLeftIn": {
				defaultDuration: 950,
				calls: [[{ opacity: [1, 0], transformPerspective: [2000, 2000], transformOriginX: [0, 0], transformOriginY: [0, 0], rotateY: [0, -180] }]],
				reset: { transformPerspective: 0, transformOriginX: "50%", transformOriginY: "50%" }
			},
			/* Magic.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.perspectiveLeftOut": {
				defaultDuration: 950,
				calls: [[{ opacity: [0, 1], transformPerspective: [2000, 2000], transformOriginX: [0, 0], transformOriginY: [0, 0], rotateY: -180 }]],
				reset: { transformPerspective: 0, transformOriginX: "50%", transformOriginY: "50%", rotateY: 0 }
			},
			/* Magic.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.perspectiveRightIn": {
				defaultDuration: 950,
				calls: [[{ opacity: [1, 0], transformPerspective: [2000, 2000], transformOriginX: ["100%", "100%"], transformOriginY: [0, 0], rotateY: [0, 180] }]],
				reset: { transformPerspective: 0, transformOriginX: "50%", transformOriginY: "50%" }
			},
			/* Magic.css */
			/* Support: Loses rotation in IE9/Android 2.3 (fades only). */
			"transition.perspectiveRightOut": {
				defaultDuration: 950,
				calls: [[{ opacity: [0, 1], transformPerspective: [2000, 2000], transformOriginX: ["100%", "100%"], transformOriginY: [0, 0], rotateY: 180 }]],
				reset: { transformPerspective: 0, transformOriginX: "50%", transformOriginY: "50%", rotateY: 0 }
			}
		};

		/* Register the packaged effects. */
		for (var effectName in Velocity.RegisterEffect.packagedEffects) {
			if (Velocity.RegisterEffect.packagedEffects.hasOwnProperty(effectName)) {
				Velocity.RegisterEffect(effectName, Velocity.RegisterEffect.packagedEffects[effectName]);
			}
		}

		/*********************
   Sequence Running
   **********************/

		/* Note: Sequence calls must use Velocity's single-object arguments syntax. */
		Velocity.RunSequence = function (originalSequence) {
			var sequence = $.extend(true, [], originalSequence);

			if (sequence.length > 1) {
				$.each(sequence.reverse(), function (i, currentCall) {
					var nextCall = sequence[i + 1];

					if (nextCall) {
						/* Parallel sequence calls (indicated via sequenceQueue:false) are triggered
       in the previous call's begin callback. Otherwise, chained calls are normally triggered
       in the previous call's complete callback. */
						var currentCallOptions = currentCall.o || currentCall.options,
						    nextCallOptions = nextCall.o || nextCall.options;

						var timing = currentCallOptions && currentCallOptions.sequenceQueue === false ? "begin" : "complete",
						    callbackOriginal = nextCallOptions && nextCallOptions[timing],
						    options = {};

						options[timing] = function () {
							var nextCallElements = nextCall.e || nextCall.elements;
							var elements = nextCallElements.nodeType ? [nextCallElements] : nextCallElements;

							if (callbackOriginal) {
								callbackOriginal.call(elements, elements);
							}
							Velocity(currentCall);
						};

						if (nextCall.o) {
							nextCall.o = $.extend({}, nextCallOptions, options);
						} else {
							nextCall.options = $.extend({}, nextCallOptions, options);
						}
					}
				});

				sequence.reverse();
			}

			Velocity(sequence[0]);
		};
	}(window.jQuery || window.Zepto || window, window, window ? window.document : undefined);
});

(function ($) {
	$.fn.validationEngineLanguage = function () {};
	$.validationEngineLanguage = {
		newLang: function newLang() {
			$.validationEngineLanguage.allRules = {
				"required": { // Add your regex rules here, you can take telephone as an example
					"regex": "none",
					"alertText": "* This field is required",
					"alertTextCheckboxMultiple": "* Please select an option",
					"alertTextCheckboxe": "* This checkbox is required",
					"alertTextDateRange": "* Both date range fields are required"
				},
				"requiredInFunction": {
					"func": function func(field, rules, i, options) {
						return field.val() == "test" ? true : false;
					},
					"alertText": "* Field must equal test"
				},
				"dateRange": {
					"regex": "none",
					"alertText": "* Invalid ",
					"alertText2": "Date Range"
				},
				"dateTimeRange": {
					"regex": "none",
					"alertText": "* Invalid ",
					"alertText2": "Date Time Range"
				},
				"minSize": {
					"regex": "none",
					"alertText": "* Minimum ",
					"alertText2": " characters required"
				},
				"maxSize": {
					"regex": "none",
					"alertText": "* Maximum ",
					"alertText2": " characters allowed"
				},
				"groupRequired": {
					"regex": "none",
					"alertText": "* You must fill one of the following fields"
				},
				"min": {
					"regex": "none",
					"alertText": "* Minimum value is "
				},
				"max": {
					"regex": "none",
					"alertText": "* Maximum value is "
				},
				"past": {
					"regex": "none",
					"alertText": "* Date prior to "
				},
				"future": {
					"regex": "none",
					"alertText": "* Date past "
				},
				"maxCheckbox": {
					"regex": "none",
					"alertText": "* Maximum ",
					"alertText2": " options allowed"
				},
				"minCheckbox": {
					"regex": "none",
					"alertText": "* Please select ",
					"alertText2": " options"
				},
				"equals": {
					"regex": "none",
					"alertText": "* Fields do not match"
				},
				"creditCard": {
					"regex": "none",
					"alertText": "* Invalid credit card number"
				},
				"phone": {
					// credit: jquery.h5validate.js / orefalo
					"regex": /^([\+][0-9]{1,3}[\ \.\-])?([\(]{1}[0-9]{2,6}[\)])?([0-9\ \.\-\/]{3,20})((x|ext|extension)[\ ]?[0-9]{1,4})?$/,
					"alertText": "* Invalid phone number"
				},
				"email": {
					// HTML5 compatible email regex ( http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#    e-mail-state-%28type=email%29 )
					"regex": /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
					"alertText": "* Invalid email address"
				},
				"integer": {
					"regex": /^[\-\+]?\d+$/,
					"alertText": "* Not a valid integer"
				},
				"number": {
					// Number, including positive, negative, and floating decimal. credit: orefalo
					"regex": /^[\-\+]?((([0-9]{1,3})([,][0-9]{3})*)|([0-9]+))?([\.]([0-9]+))?$/,
					"alertText": "* Invalid floating decimal number"
				}, "zipCode": {
					"regex": /^\d{5}$/, // /^\d{5}$|^\d{5}-\d{4}$/,
					"alertText": "* Invalid zip code"
				},
				"date": {
					//	Check if date is valid by leap year
					"func": function func(field) {
						var pattern = new RegExp(/^\d{2}\/\d{2}\/\d{4}$/);
						var match = pattern.exec(field.val());
						if (match == null) return false;

						//var year = match[1];
						//var month = match[2]*1;
						//var day = match[3]*1;					
						//var date = new Date(year, month - 1, day); // because months starts from 0.

						return true;
					},
					"alertText": "* Invalid date, must be in MM/DD/YYYY format"
				},
				"ipv4": {
					"regex": /^((([01]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))[.]){3}(([0-1]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))$/,
					"alertText": "* Invalid IP address"
				},
				"url": {
					"regex": /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i,
					"alertText": "* Invalid URL"
				},
				"onlyNumberSp": {
					"regex": /^[0-9\ ]+$/,
					"alertText": "* Numbers only"
				},
				"onlyLetterSp": {
					"regex": /^[a-zA-Z\ \']+$/,
					"alertText": "* Letters only"
				},
				"onlyLetterNumber": {
					"regex": /^[0-9a-zA-Z]+$/,
					"alertText": "* No special characters allowed"
				},
				// --- CUSTOM RULES -- Those are specific to the demos, they can be removed or changed to your likings
				"ajaxUserCall": {
					"url": "ajaxValidateFieldUser",
					// you may want to pass extra data on the ajax call
					"extraData": "name=eric",
					"alertText": "* This user is already taken",
					"alertTextLoad": "* Validating, please wait"
				},
				"ajaxUserCallPhp": {
					"url": "phpajax/ajaxValidateFieldUser.php",
					// you may want to pass extra data on the ajax call
					"extraData": "name=eric",
					// if you provide an "alertTextOk", it will show as a green prompt when the field validates
					"alertTextOk": "* This username is available",
					"alertText": "* This user is already taken",
					"alertTextLoad": "* Validating, please wait"
				},
				"ajaxNameCall": {
					// remote json service location
					"url": "ajaxValidateFieldName",
					// error
					"alertText": "* This name is already taken",
					// if you provide an "alertTextOk", it will show as a green prompt when the field validates
					"alertTextOk": "* This name is available",
					// speaks by itself
					"alertTextLoad": "* Validating, please wait"
				},
				"ajaxNameCallPhp": {
					// remote json service location
					"url": "phpajax/ajaxValidateFieldName.php",
					// error
					"alertText": "* This name is already taken",
					// speaks by itself
					"alertTextLoad": "* Validating, please wait"
				},
				"validate2fields": {
					"alertText": "* Please input HELLO"
				},
				//tls warning:homegrown not fielded 
				"dateFormat": {
					"regex": /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$|^(?:(?:(?:0?[13578]|1[02])(\/|-)31)|(?:(?:0?[1,3-9]|1[0-2])(\/|-)(?:29|30)))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^(?:(?:0?[1-9]|1[0-2])(\/|-)(?:0?[1-9]|1\d|2[0-8]))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^(0?2(\/|-)29)(\/|-)(?:(?:0[48]00|[13579][26]00|[2468][048]00)|(?:\d\d)?(?:0[48]|[2468][048]|[13579][26]))$/,
					"alertText": "* Invalid Date"
				},
				//tls warning:homegrown not fielded 
				"dateTimeFormat": {
					"regex": /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])\s+(1[012]|0?[1-9]){1}:(0?[1-5]|[0-6][0-9]){1}:(0?[0-6]|[0-6][0-9]){1}\s+(am|pm|AM|PM){1}$|^(?:(?:(?:0?[13578]|1[02])(\/|-)31)|(?:(?:0?[1,3-9]|1[0-2])(\/|-)(?:29|30)))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^((1[012]|0?[1-9]){1}\/(0?[1-9]|[12][0-9]|3[01]){1}\/\d{2,4}\s+(1[012]|0?[1-9]){1}:(0?[1-5]|[0-6][0-9]){1}:(0?[0-6]|[0-6][0-9]){1}\s+(am|pm|AM|PM){1})$/,
					"alertText": "* Invalid Date or Date Format",
					"alertText2": "Expected Format: ",
					"alertText3": "mm/dd/yyyy hh:mm:ss AM|PM or ",
					"alertText4": "yyyy-mm-dd hh:mm:ss AM|PM"
				}
			};
		}
	};

	$.validationEngineLanguage.newLang();
})(jQuery);

/*
 * Inline Form Validation Engine 2.6.2, jQuery plugin
 *
 * Copyright(c) 2010, Cedric Dugas
 * http://www.position-absolute.com
 *
 * 2.0 Rewrite by Olivier Refalo
 * http://www.crionics.com
 *
 * Form validation engine allowing custom regex rules to be added.
 * Licensed under the MIT License
 */
(function ($) {

	"use strict";

	var methods = {

		/**
  * Kind of the constructor, called before any action
  * @param {Map} user options
  */
		init: function init(options) {
			var form = this;
			if (!form.data('jqv') || form.data('jqv') == null) {
				options = methods._saveOptions(form, options);
				// bind all formError elements to close on click
				$(document).on("click", ".formError", function () {
					$(this).fadeOut(150, function () {
						// remove prompt once invisible
						$(this).closest('.formError').remove();
					});
				});
			}
			return this;
		},
		/**
  * Attachs jQuery.validationEngine to form.submit and field.blur events
  * Takes an optional params: a list of options
  * ie. jQuery("#formID1").validationEngine('attach', {promptPosition : "centerRight"});
  */
		attach: function attach(userOptions) {

			var form = this;
			var options;

			if (userOptions) options = methods._saveOptions(form, userOptions);else options = form.data('jqv');

			options.validateAttribute = form.find("[data-validation-engine*=validate]").length ? "data-validation-engine" : "class";
			if (options.binded) {

				// delegate fields
				form.on(options.validationEventTrigger, "[" + options.validateAttribute + "*=validate]:not([type=checkbox]):not([type=radio]):not(.datepicker)", methods._onFieldEvent);
				form.on("click", "[" + options.validateAttribute + "*=validate][type=checkbox],[" + options.validateAttribute + "*=validate][type=radio]", methods._onFieldEvent);
				form.on(options.validationEventTrigger, "[" + options.validateAttribute + "*=validate][class*=datepicker]", { "delay": 300 }, methods._onFieldEvent);
			}
			if (options.autoPositionUpdate) {
				$(window).bind("resize", {
					"noAnimation": true,
					"formElem": form
				}, methods.updatePromptsPosition);
			}
			form.on("click", "a[data-validation-engine-skip], a[class*='validate-skip'], button[data-validation-engine-skip], button[class*='validate-skip'], input[data-validation-engine-skip], input[class*='validate-skip']", methods._submitButtonClick);
			form.removeData('jqv_submitButton');

			// bind form.submit
			form.on("submit", methods._onSubmitEvent);
			return this;
		},
		/**
  * Unregisters any bindings that may point to jQuery.validaitonEngine
  */
		detach: function detach() {

			var form = this;
			var options = form.data('jqv');

			// unbind fields
			form.off(options.validationEventTrigger, "[" + options.validateAttribute + "*=validate]:not([type=checkbox]):not([type=radio]):not(.datepicker)", methods._onFieldEvent);
			form.off("click", "[" + options.validateAttribute + "*=validate][type=checkbox],[" + options.validateAttribute + "*=validate][type=radio]", methods._onFieldEvent);
			form.off(options.validationEventTrigger, "[" + options.validateAttribute + "*=validate][class*=datepicker]", methods._onFieldEvent);

			// unbind form.submit
			form.off("submit", methods._onSubmitEvent);
			form.removeData('jqv');

			form.off("click", "a[data-validation-engine-skip], a[class*='validate-skip'], button[data-validation-engine-skip], button[class*='validate-skip'], input[data-validation-engine-skip], input[class*='validate-skip']", methods._submitButtonClick);
			form.removeData('jqv_submitButton');

			if (options.autoPositionUpdate) $(window).off("resize", methods.updatePromptsPosition);

			return this;
		},
		/**
  * Validates either a form or a list of fields, shows prompts accordingly.
  * Note: There is no ajax form validation with this method, only field ajax validation are evaluated
  *
  * @return true if the form validates, false if it fails
  */
		validate: function validate(userOptions) {
			var element = $(this);
			var valid = null;
			var options;

			if (element.is("form") || element.hasClass("validationEngineContainer")) {
				if (element.hasClass('validating')) {
					// form is already validating.
					// Should abort old validation and start new one. I don't know how to implement it.
					return false;
				} else {
					element.addClass('validating');
					if (userOptions) options = methods._saveOptions(element, userOptions);else options = element.data('jqv');
					var valid = methods._validateFields(this);

					// If the form doesn't validate, clear the 'validating' class before the user has a chance to submit again
					setTimeout(function () {
						element.removeClass('validating');
					}, 100);
					if (valid && options.onSuccess) {
						options.onSuccess();
					} else if (!valid && options.onFailure) {
						options.onFailure();
					}
				}
			} else if (element.is('form') || element.hasClass('validationEngineContainer')) {
				element.removeClass('validating');
			} else {
				// field validation
				var form = element.closest('form, .validationEngineContainer');
				options = form.data('jqv') ? form.data('jqv') : $.validationEngine.defaults;
				valid = methods._validateField(element, options);

				if (valid && options.onFieldSuccess) options.onFieldSuccess();else if (options.onFieldFailure && options.InvalidFields.length > 0) {
					options.onFieldFailure();
				}

				return !valid;
			}
			if (options.onValidationComplete) {
				// !! ensures that an undefined return is interpreted as return false but allows a onValidationComplete() to possibly return true and have form continue processing
				return !!options.onValidationComplete(form, valid);
			}
			return valid;
		},
		/**
  *  Redraw prompts position, useful when you change the DOM state when validating
  */
		updatePromptsPosition: function updatePromptsPosition(event) {

			if (event && this == window) {
				var form = event.data.formElem;
				var noAnimation = event.data.noAnimation;
			} else var form = $(this.closest('form, .validationEngineContainer'));

			var options = form.data('jqv');
			// No option, take default one
			if (!options) options = methods._saveOptions(form, options);
			form.find('[' + options.validateAttribute + '*=validate]').not(":disabled").each(function () {
				var field = $(this);
				if (options.prettySelect && field.is(":hidden")) field = form.find("#" + options.usePrefix + field.attr('id') + options.useSuffix);
				var prompt = methods._getPrompt(field);
				var promptText = $(prompt).find(".formErrorContent").html();

				if (prompt) methods._updatePrompt(field, $(prompt), promptText, undefined, false, options, noAnimation);
			});
			return this;
		},
		/**
  * Displays a prompt on a element.
  * Note that the element needs an id!
  *
  * @param {String} promptText html text to display type
  * @param {String} type the type of bubble: 'pass' (green), 'load' (black) anything else (red)
  * @param {String} possible values topLeft, topRight, bottomLeft, centerRight, bottomRight
  */
		showPrompt: function showPrompt(promptText, type, promptPosition, showArrow) {
			var form = this.closest('form, .validationEngineContainer');
			var options = form.data('jqv');
			// No option, take default one
			if (!options) options = methods._saveOptions(this, options);
			if (promptPosition) options.promptPosition = promptPosition;
			options.showArrow = showArrow == true;

			methods._showPrompt(this, promptText, type, false, options);
			return this;
		},
		/**
  * Closes form error prompts, CAN be invidual
  */
		hide: function hide() {
			var form = $(this).closest('form, .validationEngineContainer');
			var options = form.data('jqv');
			// No option, take default one
			if (!options) options = methods._saveOptions(form, options);
			var fadeDuration = options && options.fadeDuration ? options.fadeDuration : 0.3;
			var closingtag;

			if (form.is("form") || form.hasClass("validationEngineContainer")) {
				closingtag = "parentForm" + methods._getClassName($(form).attr("id"));
			} else {
				closingtag = methods._getClassName($(form).attr("id")) + "formError";
			}
			$('.' + closingtag).fadeTo(fadeDuration, 0, function () {
				$(this).closest('.formError').remove();
			});
			return this;
		},
		/**
  * Closes all error prompts on the page
  */
		hideAll: function hideAll() {
			var form = this;
			var options = form.data('jqv');
			var duration = options ? options.fadeDuration : 300;
			$('.formError').fadeTo(duration, 0, function () {
				$(this).closest('.formError').remove();
			});
			return this;
		},
		/**
  * Typically called when user exists a field using tab or a mouse click, triggers a field
  * validation
  */
		_onFieldEvent: function _onFieldEvent(event) {
			var field = $(this);
			var form = field.closest('form, .validationEngineContainer');
			var options = form.data('jqv');
			// No option, take default one
			if (!options) options = methods._saveOptions(form, options);
			options.eventTrigger = "field";

			if (options.notEmpty == true) {

				if (field.val().length > 0) {
					// validate the current field
					window.setTimeout(function () {
						methods._validateField(field, options);
					}, event.data ? event.data.delay : 0);
				}
			} else {

				// validate the current field
				window.setTimeout(function () {
					methods._validateField(field, options);
				}, event.data ? event.data.delay : 0);
			}
		},
		/**
  * Called when the form is submited, shows prompts accordingly
  *
  * @param {jqObject}
  *            form
  * @return false if form submission needs to be cancelled
  */
		_onSubmitEvent: function _onSubmitEvent() {
			var form = $(this);
			var options = form.data('jqv');

			//check if it is trigger from skipped button
			if (form.data("jqv_submitButton")) {
				var submitButton = $("#" + form.data("jqv_submitButton"));
				if (submitButton) {
					if (submitButton.length > 0) {
						if (submitButton.hasClass("validate-skip") || submitButton.attr("data-validation-engine-skip") == "true") return true;
					}
				}
			}

			options.eventTrigger = "submit";

			// validate each field
			// (- skip field ajax validation, not necessary IF we will perform an ajax form validation)
			var r = methods._validateFields(form);

			if (r && options.ajaxFormValidation) {
				methods._validateFormWithAjax(form, options);
				// cancel form auto-submission - process with async call onAjaxFormComplete
				return false;
			}

			if (options.onValidationComplete) {
				// !! ensures that an undefined return is interpreted as return false but allows a onValidationComplete() to possibly return true and have form continue processing
				return !!options.onValidationComplete(form, r);
			}
			return r;
		},
		/**
  * Return true if the ajax field validations passed so far
  * @param {Object} options
  * @return true, is all ajax validation passed so far (remember ajax is async)
  */
		_checkAjaxStatus: function _checkAjaxStatus(options) {
			var status = true;
			$.each(options.ajaxValidCache, function (key, value) {
				if (!value) {
					status = false;
					// break the each
					return false;
				}
			});
			return status;
		},

		/**
  * Return true if the ajax field is validated
  * @param {String} fieldid
  * @param {Object} options
  * @return true, if validation passed, false if false or doesn't exist
  */
		_checkAjaxFieldStatus: function _checkAjaxFieldStatus(fieldid, options) {
			return options.ajaxValidCache[fieldid] == true;
		},
		/**
  * Validates form fields, shows prompts accordingly
  *
  * @param {jqObject}
  *            form
  * @param {skipAjaxFieldValidation}
  *            boolean - when set to true, ajax field validation is skipped, typically used when the submit button is clicked
  *
  * @return true if form is valid, false if not, undefined if ajax form validation is done
  */
		_validateFields: function _validateFields(form) {
			var options = form.data('jqv');

			// this variable is set to true if an error is found
			var errorFound = false;

			// Trigger hook, start validation
			form.trigger("jqv.form.validating");
			// first, evaluate status of non ajax fields
			var first_err = null;
			form.find('[' + options.validateAttribute + '*=validate]').not(":disabled").each(function () {
				var field = $(this);
				var names = [];
				if ($.inArray(field.attr('name'), names) < 0) {
					errorFound |= methods._validateField(field, options);
					if (errorFound && first_err == null) if (field.is(":hidden") && options.prettySelect) first_err = field = form.find("#" + options.usePrefix + methods._jqSelector(field.attr('id')) + options.useSuffix);else {

						//Check if we need to adjust what element to show the prompt on
						//and and such scroll to instead
						if (field.data('jqv-prompt-at') instanceof jQuery) {
							field = field.data('jqv-prompt-at');
						} else if (field.data('jqv-prompt-at')) {
							field = $(field.data('jqv-prompt-at'));
						}
						first_err = field;
					}
					if (options.doNotShowAllErrosOnSubmit) return false;
					names.push(field.attr('name'));

					//if option set, stop checking validation rules after one error is found
					if (options.showOneMessage == true && errorFound) {
						return false;
					}
				}
			});

			// second, check to see if all ajax calls completed ok
			// errorFound |= !methods._checkAjaxStatus(options);

			// third, check status and scroll the container accordingly
			form.trigger("jqv.form.result", [errorFound]);

			if (errorFound) {
				if (options.scroll) {
					var destination = first_err.offset().top;
					var fixleft = first_err.offset().left;

					//prompt positioning adjustment support. Usage: positionType:Xshift,Yshift (for ex.: bottomLeft:+20 or bottomLeft:-20,+10)
					var positionType = options.promptPosition;
					if (typeof positionType == 'string' && positionType.indexOf(":") != -1) positionType = positionType.substring(0, positionType.indexOf(":"));

					if (positionType != "bottomRight" && positionType != "bottomLeft") {
						var prompt_err = methods._getPrompt(first_err);
						if (prompt_err) {
							destination = prompt_err.offset().top;
						}
					}

					// Offset the amount the page scrolls by an amount in px to accomodate fixed elements at top of page
					if (options.scrollOffset) {
						destination -= options.scrollOffset;
					}

					// get the position of the first error, there should be at least one, no need to check this
					//var destination = form.find(".formError:not('.greenPopup'):first").offset().top;
					if (options.isOverflown) {
						var overflowDIV = $(options.overflownDIV);
						if (!overflowDIV.length) return false;
						var scrollContainerScroll = overflowDIV.scrollTop();
						var scrollContainerPos = -parseInt(overflowDIV.offset().top);

						destination += scrollContainerScroll + scrollContainerPos - 5;
						var scrollContainer = $(options.overflownDIV).filter(":not(:animated)");

						scrollContainer.animate({ scrollTop: destination }, 1100, function () {
							if (options.focusFirstField) first_err.focus();
						});
					} else {
						$("html, body").animate({
							scrollTop: destination
						}, 1100, function () {
							if (options.focusFirstField) first_err.focus();
						});
						$("html, body").animate({ scrollLeft: fixleft }, 1100);
					}
				} else if (options.focusFirstField) first_err.focus();
				return false;
			}
			return true;
		},
		/**
  * This method is called to perform an ajax form validation.
  * During this process all the (field, value) pairs are sent to the server which returns a list of invalid fields or true
  *
  * @param {jqObject} form
  * @param {Map} options
  */
		_validateFormWithAjax: function _validateFormWithAjax(form, options) {

			var data = form.serialize();
			var type = options.ajaxFormValidationMethod ? options.ajaxFormValidationMethod : "GET";
			var url = options.ajaxFormValidationURL ? options.ajaxFormValidationURL : form.attr("action");
			var dataType = options.dataType ? options.dataType : "json";
			$.ajax({
				type: type,
				url: url,
				cache: false,
				dataType: dataType,
				data: data,
				form: form,
				methods: methods,
				options: options,
				beforeSend: function beforeSend() {
					return options.onBeforeAjaxFormValidation(form, options);
				},
				error: function error(data, transport) {
					if (options.onFailure) {
						options.onFailure(data, transport);
					} else {
						methods._ajaxError(data, transport);
					}
				},
				success: function success(json) {
					if (dataType == "json" && json !== true) {
						// getting to this case doesn't necessary means that the form is invalid
						// the server may return green or closing prompt actions
						// this flag helps figuring it out
						var errorInForm = false;
						for (var i = 0; i < json.length; i++) {
							var value = json[i];

							var errorFieldId = value[0];
							var errorField = $($("#" + errorFieldId)[0]);

							// make sure we found the element
							if (errorField.length == 1) {

								// promptText or selector
								var msg = value[2];
								// if the field is valid
								if (value[1] == true) {

									if (msg == "" || !msg) {
										// if for some reason, status==true and error="", just close the prompt
										methods._closePrompt(errorField);
									} else {
										// the field is valid, but we are displaying a green prompt
										if (options.allrules[msg]) {
											var txt = options.allrules[msg].alertTextOk;
											if (txt) msg = txt;
										}
										if (options.showPrompts) methods._showPrompt(errorField, msg, "pass", false, options, true);
									}
								} else {
									// the field is invalid, show the red error prompt
									errorInForm |= true;
									if (options.allrules[msg]) {
										var txt = options.allrules[msg].alertText;
										if (txt) msg = txt;
									}
									if (options.showPrompts) methods._showPrompt(errorField, msg, "", false, options, true);
								}
							}
						}
						options.onAjaxFormComplete(!errorInForm, form, json, options);
					} else options.onAjaxFormComplete(true, form, json, options);
				}
			});
		},
		/**
  * Validates field, shows prompts accordingly
  *
  * @param {jqObject}
  *            field
  * @param {Array[String]}
  *            field's validation rules
  * @param {Map}
  *            user options
  * @return false if field is valid (It is inversed for *fields*, it return false on validate and true on errors.)
  */
		_validateField: function _validateField(field, options, skipAjaxValidation) {
			if (!field.attr("id")) {
				field.attr("id", "form-validation-field-" + $.validationEngine.fieldIdCounter);
				++$.validationEngine.fieldIdCounter;
			}

			if (field.hasClass(options.ignoreFieldsWithClass)) return false;

			if (!options.validateNonVisibleFields && (field.is(":hidden") && !options.prettySelect || field.parent().is(":hidden"))) return false;

			var rulesParsing = field.attr(options.validateAttribute);
			var getRules = /validate\[(.*)\]/.exec(rulesParsing);

			if (!getRules) return false;
			var str = getRules[1];
			var rules = str.split(/\[|,|\]/);

			// true if we ran the ajax validation, tells the logic to stop messing with prompts
			var isAjaxValidator = false;
			var fieldName = field.attr("name");
			var promptText = "";
			var promptType = "";
			var required = false;
			var limitErrors = false;
			options.isError = false;
			options.showArrow = true;

			// If the programmer wants to limit the amount of error messages per field,
			if (options.maxErrorsPerField > 0) {
				limitErrors = true;
			}

			var form = $(field.closest("form, .validationEngineContainer"));
			// Fix for adding spaces in the rules
			for (var i = 0; i < rules.length; i++) {
				rules[i] = rules[i].replace(" ", "");
				// Remove any parsing errors
				if (rules[i] === '') {
					delete rules[i];
				}
			}

			for (var i = 0, field_errors = 0; i < rules.length; i++) {

				// If we are limiting errors, and have hit the max, break
				if (limitErrors && field_errors >= options.maxErrorsPerField) {
					// If we haven't hit a required yet, check to see if there is one in the validation rules for this
					// field and that it's index is greater or equal to our current index
					if (!required) {
						var have_required = $.inArray('required', rules);
						required = have_required != -1 && have_required >= i;
					}
					break;
				}

				var errorMsg = undefined;
				switch (rules[i]) {

					case "required":
						required = true;
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._required);
						break;
					case "custom":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._custom);
						break;
					case "groupRequired":
						// Check is its the first of group, if not, reload validation with first field
						// AND continue normal validation on present field
						var classGroup = "[" + options.validateAttribute + "*=" + rules[i + 1] + "]";
						var firstOfGroup = form.find(classGroup).eq(0);
						if (firstOfGroup[0] != field[0]) {

							methods._validateField(firstOfGroup, options, skipAjaxValidation);
							options.showArrow = true;
						}
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._groupRequired);
						if (errorMsg) required = true;
						options.showArrow = false;
						break;
					case "ajax":
						// AJAX defaults to returning it's loading message
						errorMsg = methods._ajax(field, rules, i, options);
						if (errorMsg) {
							promptType = "load";
						}
						break;
					case "minSize":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._minSize);
						break;
					case "maxSize":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._maxSize);
						break;
					case "min":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._min);
						break;
					case "max":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._max);
						break;
					case "past":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._past);
						break;
					case "future":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._future);
						break;
					case "dateRange":
						var classGroup = "[" + options.validateAttribute + "*=" + rules[i + 1] + "]";
						options.firstOfGroup = form.find(classGroup).eq(0);
						options.secondOfGroup = form.find(classGroup).eq(1);

						//if one entry out of the pair has value then proceed to run through validation
						if (options.firstOfGroup[0].value || options.secondOfGroup[0].value) {
							errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._dateRange);
						}
						if (errorMsg) required = true;
						options.showArrow = false;
						break;

					case "dateTimeRange":
						var classGroup = "[" + options.validateAttribute + "*=" + rules[i + 1] + "]";
						options.firstOfGroup = form.find(classGroup).eq(0);
						options.secondOfGroup = form.find(classGroup).eq(1);

						//if one entry out of the pair has value then proceed to run through validation
						if (options.firstOfGroup[0].value || options.secondOfGroup[0].value) {
							errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._dateTimeRange);
						}
						if (errorMsg) required = true;
						options.showArrow = false;
						break;
					case "maxCheckbox":
						field = $(form.find("input[name='" + fieldName + "']"));
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._maxCheckbox);
						break;
					case "minCheckbox":
						field = $(form.find("input[name='" + fieldName + "']"));
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._minCheckbox);
						break;
					case "equals":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._equals);
						break;
					case "funcCall":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._funcCall);
						break;
					case "creditCard":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._creditCard);
						break;
					case "condRequired":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._condRequired);
						if (errorMsg !== undefined) {
							required = true;
						}
						break;
					case "funcCallRequired":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._funcCallRequired);
						if (errorMsg !== undefined) {
							required = true;
						}
						break;

					default:
				}

				var end_validation = false;

				// If we were passed back an message object, check what the status was to determine what to do
				if ((typeof errorMsg === 'undefined' ? 'undefined' : _typeof(errorMsg)) == "object") {
					switch (errorMsg.status) {
						case "_break":
							end_validation = true;
							break;
						// If we have an error message, set errorMsg to the error message
						case "_error":
							errorMsg = errorMsg.message;
							break;
						// If we want to throw an error, but not show a prompt, return early with true
						case "_error_no_prompt":
							return true;
							break;
						// Anything else we continue on
						default:
							break;
					}
				}

				//funcCallRequired, first in rules, and has error, skip anything else
				if (i == 0 && str.indexOf('funcCallRequired') == 0 && errorMsg !== undefined) {
					promptText += errorMsg + "<br/>";
					options.isError = true;
					field_errors++;
					end_validation = true;
				}

				// If it has been specified that validation should end now, break
				if (end_validation) {
					break;
				}

				// If we have a string, that means that we have an error, so add it to the error message.
				if (typeof errorMsg == 'string') {
					promptText += errorMsg + "<br/>";
					options.isError = true;
					field_errors++;
				}
			}
			// If the rules required is not added, an empty field is not validated
			//the 3rd condition is added so that even empty password fields should be equal
			//otherwise if one is filled and another left empty, the "equal" condition would fail
			//which does not make any sense
			if (!required && !field.val() && field.val().length < 1 && $.inArray('equals', rules) < 0) options.isError = false;

			// Hack for radio/checkbox group button, the validation go into the
			// first radio/checkbox of the group
			var fieldType = field.prop("type");
			var positionType = field.data("promptPosition") || options.promptPosition;

			if ((fieldType == "radio" || fieldType == "checkbox") && form.find("input[name='" + fieldName + "']").size() > 1) {
				if (positionType === 'inline') {
					field = $(form.find("input[name='" + fieldName + "'][type!=hidden]:last"));
				} else {
					field = $(form.find("input[name='" + fieldName + "'][type!=hidden]:first"));
				}
				options.showArrow = options.showArrowOnRadioAndCheckbox;
			}

			if (field.is(":hidden") && options.prettySelect) {
				field = form.find("#" + options.usePrefix + methods._jqSelector(field.attr('id')) + options.useSuffix);
			}

			if (options.isError && options.showPrompts) {
				methods._showPrompt(field, promptText, promptType, false, options);
			} else {
				if (!isAjaxValidator) methods._closePrompt(field);
			}

			if (!isAjaxValidator) {
				field.trigger("jqv.field.result", [field, options.isError, promptText]);
			}

			/* Record error */
			var errindex = $.inArray(field[0], options.InvalidFields);
			if (errindex == -1) {
				if (options.isError) options.InvalidFields.push(field[0]);
			} else if (!options.isError) {
				options.InvalidFields.splice(errindex, 1);
			}

			methods._handleStatusCssClasses(field, options);

			/* run callback function for each field */
			if (options.isError && options.onFieldFailure) options.onFieldFailure(field);

			if (!options.isError && options.onFieldSuccess) options.onFieldSuccess(field);

			return options.isError;
		},
		/**
  * Handling css classes of fields indicating result of validation
  *
  * @param {jqObject}
  *            field
  * @param {Array[String]}
  *            field's validation rules
  * @private
  */
		_handleStatusCssClasses: function _handleStatusCssClasses(field, options) {
			/* remove all classes */
			if (options.addSuccessCssClassToField) field.removeClass(options.addSuccessCssClassToField);

			if (options.addFailureCssClassToField) field.removeClass(options.addFailureCssClassToField);

			/* Add classes */
			if (options.addSuccessCssClassToField && !options.isError) field.addClass(options.addSuccessCssClassToField);

			if (options.addFailureCssClassToField && options.isError) field.addClass(options.addFailureCssClassToField);
		},

		/********************
   * _getErrorMessage
   *
   * @param form
   * @param field
   * @param rule
   * @param rules
   * @param i
   * @param options
   * @param originalValidationMethod
   * @return {*}
   * @private
   */
		_getErrorMessage: function _getErrorMessage(form, field, rule, rules, i, options, originalValidationMethod) {
			// If we are using the custon validation type, build the index for the rule.
			// Otherwise if we are doing a function call, make the call and return the object
			// that is passed back.
			var rule_index = jQuery.inArray(rule, rules);
			if (rule === "custom" || rule === "funcCall" || rule === "funcCallRequired") {
				var custom_validation_type = rules[rule_index + 1];
				rule = rule + "[" + custom_validation_type + "]";
				// Delete the rule from the rules array so that it doesn't try to call the
				// same rule over again
				delete rules[rule_index];
			}
			// Change the rule to the composite rule, if it was different from the original
			var alteredRule = rule;

			var element_classes = field.attr("data-validation-engine") ? field.attr("data-validation-engine") : field.attr("class");
			var element_classes_array = element_classes.split(" ");

			// Call the original validation method. If we are dealing with dates or checkboxes, also pass the form
			var errorMsg;
			if (rule == "future" || rule == "past" || rule == "maxCheckbox" || rule == "minCheckbox") {
				errorMsg = originalValidationMethod(form, field, rules, i, options);
			} else {
				errorMsg = originalValidationMethod(field, rules, i, options);
			}

			// If the original validation method returned an error and we have a custom error message,
			// return the custom message instead. Otherwise return the original error message.
			if (errorMsg != undefined) {
				var custom_message = methods._getCustomErrorMessage($(field), element_classes_array, alteredRule, options);
				if (custom_message) errorMsg = custom_message;
			}
			return errorMsg;
		},
		_getCustomErrorMessage: function _getCustomErrorMessage(field, classes, rule, options) {
			var custom_message = false;
			var validityProp = /^custom\[.*\]$/.test(rule) ? methods._validityProp["custom"] : methods._validityProp[rule];
			// If there is a validityProp for this rule, check to see if the field has an attribute for it
			if (validityProp != undefined) {
				custom_message = field.attr("data-errormessage-" + validityProp);
				// If there was an error message for it, return the message
				if (custom_message != undefined) return custom_message;
			}
			custom_message = field.attr("data-errormessage");
			// If there is an inline custom error message, return it
			if (custom_message != undefined) return custom_message;
			var id = '#' + field.attr("id");
			// If we have custom messages for the element's id, get the message for the rule from the id.
			// Otherwise, if we have custom messages for the element's classes, use the first class message we find instead.
			if (typeof options.custom_error_messages[id] != "undefined" && typeof options.custom_error_messages[id][rule] != "undefined") {
				custom_message = options.custom_error_messages[id][rule]['message'];
			} else if (classes.length > 0) {
				for (var i = 0; i < classes.length && classes.length > 0; i++) {
					var element_class = "." + classes[i];
					if (typeof options.custom_error_messages[element_class] != "undefined" && typeof options.custom_error_messages[element_class][rule] != "undefined") {
						custom_message = options.custom_error_messages[element_class][rule]['message'];
						break;
					}
				}
			}
			if (!custom_message && typeof options.custom_error_messages[rule] != "undefined" && typeof options.custom_error_messages[rule]['message'] != "undefined") {
				custom_message = options.custom_error_messages[rule]['message'];
			}
			return custom_message;
		},
		_validityProp: {
			"required": "value-missing",
			"custom": "custom-error",
			"groupRequired": "value-missing",
			"ajax": "custom-error",
			"minSize": "range-underflow",
			"maxSize": "range-overflow",
			"min": "range-underflow",
			"max": "range-overflow",
			"past": "type-mismatch",
			"future": "type-mismatch",
			"dateRange": "type-mismatch",
			"dateTimeRange": "type-mismatch",
			"maxCheckbox": "range-overflow",
			"minCheckbox": "range-underflow",
			"equals": "pattern-mismatch",
			"funcCall": "custom-error",
			"funcCallRequired": "custom-error",
			"creditCard": "pattern-mismatch",
			"condRequired": "value-missing"
		},
		/**
  * Required validation
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @param {bool} condRequired flag when method is used for internal purpose in condRequired check
  * @return an error string if validation failed
  */
		_required: function _required(field, rules, i, options, condRequired) {
			switch (field.prop("type")) {
				case "radio":
				case "checkbox":
					// new validation style to only check dependent field
					if (condRequired) {
						if (!field.prop('checked')) {
							return options.allrules[rules[i]].alertTextCheckboxMultiple;
						}
						break;
					}
					// old validation style
					var form = field.closest("form, .validationEngineContainer");
					var name = field.attr("name");
					if (form.find("input[name='" + name + "']:checked").size() == 0) {
						if (form.find("input[name='" + name + "']:visible").size() == 1) return options.allrules[rules[i]].alertTextCheckboxe;else return options.allrules[rules[i]].alertTextCheckboxMultiple;
					}
					break;
				case "text":
				case "password":
				case "textarea":
				case "file":
				case "select-one":
				case "select-multiple":
				default:
					var field_val = $.trim(field.val());
					var dv_placeholder = $.trim(field.attr("data-validation-placeholder"));
					var placeholder = $.trim(field.attr("placeholder"));
					if (!field_val || dv_placeholder && field_val == dv_placeholder || placeholder && field_val == placeholder) {
						return options.allrules[rules[i]].alertText;
					}
					break;
			}
		},
		/**
  * Validate that 1 from the group field is required
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_groupRequired: function _groupRequired(field, rules, i, options) {
			var classGroup = "[" + options.validateAttribute + "*=" + rules[i + 1] + "]";
			var isValid = false;
			// Check all fields from the group
			field.closest("form, .validationEngineContainer").find(classGroup).each(function () {
				if (!methods._required($(this), rules, i, options)) {
					isValid = true;
					return false;
				}
			});

			if (!isValid) {
				return options.allrules[rules[i]].alertText;
			}
		},
		/**
  * Validate rules
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_custom: function _custom(field, rules, i, options) {
			var customRule = rules[i + 1];
			var rule = options.allrules[customRule];
			var fn;
			if (!rule) {
				alert("jqv:custom rule not found - " + customRule);
				return;
			}

			if (rule["regex"]) {
				var ex = rule.regex;
				if (!ex) {
					alert("jqv:custom regex not found - " + customRule);
					return;
				}
				var pattern = new RegExp(ex);

				if (!pattern.test(field.val())) return options.allrules[customRule].alertText;
			} else if (rule["func"]) {
				fn = rule["func"];

				if (typeof fn !== "function") {
					alert("jqv:custom parameter 'function' is no function - " + customRule);
					return;
				}

				if (!fn(field, rules, i, options)) return options.allrules[customRule].alertText;
			} else {
				alert("jqv:custom type not allowed " + customRule);
				return;
			}
		},
		/**
  * Validate custom function outside of the engine scope
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_funcCall: function _funcCall(field, rules, i, options) {
			var functionName = rules[i + 1];
			var fn;
			if (functionName.indexOf('.') > -1) {
				var namespaces = functionName.split('.');
				var scope = window;
				while (namespaces.length) {
					scope = scope[namespaces.shift()];
				}
				fn = scope;
			} else fn = window[functionName] || options.customFunctions[functionName];
			if (typeof fn == 'function') return fn(field, rules, i, options);
		},
		_funcCallRequired: function _funcCallRequired(field, rules, i, options) {
			return methods._funcCall(field, rules, i, options);
		},
		/**
  * Field match
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_equals: function _equals(field, rules, i, options) {
			var equalsField = rules[i + 1];

			if (field.val() != $("#" + equalsField).val()) return options.allrules.equals.alertText;
		},
		/**
  * Check the maximum size (in characters)
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_maxSize: function _maxSize(field, rules, i, options) {
			var max = rules[i + 1];
			var len = field.val().length;

			if (len > max) {
				var rule = options.allrules.maxSize;
				return rule.alertText + max + rule.alertText2;
			}
		},
		/**
  * Check the minimum size (in characters)
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_minSize: function _minSize(field, rules, i, options) {
			var min = rules[i + 1];
			var len = field.val().length;

			if (len < min) {
				var rule = options.allrules.minSize;
				return rule.alertText + min + rule.alertText2;
			}
		},
		/**
  * Check number minimum value
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_min: function _min(field, rules, i, options) {
			var min = parseFloat(rules[i + 1]);
			var len = parseFloat(field.val());

			if (len < min) {
				var rule = options.allrules.min;
				if (rule.alertText2) return rule.alertText + min + rule.alertText2;
				return rule.alertText + min;
			}
		},
		/**
  * Check number maximum value
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_max: function _max(field, rules, i, options) {
			var max = parseFloat(rules[i + 1]);
			var len = parseFloat(field.val());

			if (len > max) {
				var rule = options.allrules.max;
				if (rule.alertText2) return rule.alertText + max + rule.alertText2;
				//orefalo: to review, also do the translations
				return rule.alertText + max;
			}
		},
		/**
  * Checks date is in the past
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_past: function _past(form, field, rules, i, options) {

			var p = rules[i + 1];
			var fieldAlt = $(form.find("*[name='" + p.replace(/^#+/, '') + "']"));
			var pdate;

			if (p.toLowerCase() == "now") {
				pdate = new Date();
			} else if (undefined != fieldAlt.val()) {
				if (fieldAlt.is(":disabled")) return;
				pdate = methods._parseDate(fieldAlt.val());
			} else {
				pdate = methods._parseDate(p);
			}
			var vdate = methods._parseDate(field.val());

			if (vdate > pdate) {
				var rule = options.allrules.past;
				if (rule.alertText2) return rule.alertText + methods._dateToString(pdate) + rule.alertText2;
				return rule.alertText + methods._dateToString(pdate);
			}
		},
		/**
  * Checks date is in the future
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_future: function _future(form, field, rules, i, options) {

			var p = rules[i + 1];
			var fieldAlt = $(form.find("*[name='" + p.replace(/^#+/, '') + "']"));
			var pdate;

			if (p.toLowerCase() == "now") {
				pdate = new Date();
			} else if (undefined != fieldAlt.val()) {
				if (fieldAlt.is(":disabled")) return;
				pdate = methods._parseDate(fieldAlt.val());
			} else {
				pdate = methods._parseDate(p);
			}
			var vdate = methods._parseDate(field.val());

			if (vdate < pdate) {
				var rule = options.allrules.future;
				if (rule.alertText2) return rule.alertText + methods._dateToString(pdate) + rule.alertText2;
				return rule.alertText + methods._dateToString(pdate);
			}
		},
		/**
  * Checks if valid date
  *
  * @param {string} date string
  * @return a bool based on determination of valid date
  */
		_isDate: function _isDate(value) {
			var dateRegEx = new RegExp(/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$|^(?:(?:(?:0?[13578]|1[02])(\/|-)31)|(?:(?:0?[1,3-9]|1[0-2])(\/|-)(?:29|30)))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^(?:(?:0?[1-9]|1[0-2])(\/|-)(?:0?[1-9]|1\d|2[0-8]))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^(0?2(\/|-)29)(\/|-)(?:(?:0[48]00|[13579][26]00|[2468][048]00)|(?:\d\d)?(?:0[48]|[2468][048]|[13579][26]))$/);
			return dateRegEx.test(value);
		},
		/**
  * Checks if valid date time
  *
  * @param {string} date string
  * @return a bool based on determination of valid date time
  */
		_isDateTime: function _isDateTime(value) {
			var dateTimeRegEx = new RegExp(/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])\s+(1[012]|0?[1-9]){1}:(0?[1-5]|[0-6][0-9]){1}:(0?[0-6]|[0-6][0-9]){1}\s+(am|pm|AM|PM){1}$|^(?:(?:(?:0?[13578]|1[02])(\/|-)31)|(?:(?:0?[1,3-9]|1[0-2])(\/|-)(?:29|30)))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^((1[012]|0?[1-9]){1}\/(0?[1-9]|[12][0-9]|3[01]){1}\/\d{2,4}\s+(1[012]|0?[1-9]){1}:(0?[1-5]|[0-6][0-9]){1}:(0?[0-6]|[0-6][0-9]){1}\s+(am|pm|AM|PM){1})$/);
			return dateTimeRegEx.test(value);
		},
		//Checks if the start date is before the end date
		//returns true if end is later than start
		_dateCompare: function _dateCompare(start, end) {
			return new Date(start.toString()) < new Date(end.toString());
		},
		/**
  * Checks date range
  *
  * @param {jqObject} first field name
  * @param {jqObject} second field name
  * @return an error string if validation failed
  */
		_dateRange: function _dateRange(field, rules, i, options) {
			//are not both populated
			if (!options.firstOfGroup[0].value && options.secondOfGroup[0].value || options.firstOfGroup[0].value && !options.secondOfGroup[0].value) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}

			//are not both dates
			if (!methods._isDate(options.firstOfGroup[0].value) || !methods._isDate(options.secondOfGroup[0].value)) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}

			//are both dates but range is off
			if (!methods._dateCompare(options.firstOfGroup[0].value, options.secondOfGroup[0].value)) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}
		},
		/**
  * Checks date time range
  *
  * @param {jqObject} first field name
  * @param {jqObject} second field name
  * @return an error string if validation failed
  */
		_dateTimeRange: function _dateTimeRange(field, rules, i, options) {
			//are not both populated
			if (!options.firstOfGroup[0].value && options.secondOfGroup[0].value || options.firstOfGroup[0].value && !options.secondOfGroup[0].value) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}
			//are not both dates
			if (!methods._isDateTime(options.firstOfGroup[0].value) || !methods._isDateTime(options.secondOfGroup[0].value)) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}
			//are both dates but range is off
			if (!methods._dateCompare(options.firstOfGroup[0].value, options.secondOfGroup[0].value)) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}
		},
		/**
  * Max number of checkbox selected
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_maxCheckbox: function _maxCheckbox(form, field, rules, i, options) {

			var nbCheck = rules[i + 1];
			var groupname = field.attr("name");
			var groupSize = form.find("input[name='" + groupname + "']:checked").size();
			if (groupSize > nbCheck) {
				options.showArrow = false;
				if (options.allrules.maxCheckbox.alertText2) return options.allrules.maxCheckbox.alertText + " " + nbCheck + " " + options.allrules.maxCheckbox.alertText2;
				return options.allrules.maxCheckbox.alertText;
			}
		},
		/**
  * Min number of checkbox selected
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_minCheckbox: function _minCheckbox(form, field, rules, i, options) {

			var nbCheck = rules[i + 1];
			var groupname = field.attr("name");
			var groupSize = form.find("input[name='" + groupname + "']:checked").size();
			if (groupSize < nbCheck) {
				options.showArrow = false;
				return options.allrules.minCheckbox.alertText + " " + nbCheck + " " + options.allrules.minCheckbox.alertText2;
			}
		},
		/**
  * Checks that it is a valid credit card number according to the
  * Luhn checksum algorithm.
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return an error string if validation failed
  */
		_creditCard: function _creditCard(field, rules, i, options) {
			//spaces and dashes may be valid characters, but must be stripped to calculate the checksum.
			var valid = false,
			    cardNumber = field.val().replace(/ +/g, '').replace(/-+/g, '');

			var numDigits = cardNumber.length;
			if (numDigits >= 14 && numDigits <= 16 && parseInt(cardNumber) > 0) {

				var sum = 0,
				    i = numDigits - 1,
				    pos = 1,
				    digit,
				    luhn = new String();
				do {
					digit = parseInt(cardNumber.charAt(i));
					luhn += pos++ % 2 == 0 ? digit * 2 : digit;
				} while (--i >= 0);

				for (i = 0; i < luhn.length; i++) {
					sum += parseInt(luhn.charAt(i));
				}
				valid = sum % 10 == 0;
			}
			if (!valid) return options.allrules.creditCard.alertText;
		},
		/**
  * Ajax field validation
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  *            user options
  * @return nothing! the ajax validator handles the prompts itself
  */
		_ajax: function _ajax(field, rules, i, options) {

			var errorSelector = rules[i + 1];
			var rule = options.allrules[errorSelector];
			var extraData = rule.extraData;
			var extraDataDynamic = rule.extraDataDynamic;
			var data = {
				"fieldId": field.attr("id"),
				"fieldValue": field.val()
			};

			if ((typeof extraData === 'undefined' ? 'undefined' : _typeof(extraData)) === "object") {
				$.extend(data, extraData);
			} else if (typeof extraData === "string") {
				var tempData = extraData.split("&");
				for (var i = 0; i < tempData.length; i++) {
					var values = tempData[i].split("=");
					if (values[0] && values[0]) {
						data[values[0]] = values[1];
					}
				}
			}

			if (extraDataDynamic) {
				var tmpData = [];
				var domIds = String(extraDataDynamic).split(",");
				for (var i = 0; i < domIds.length; i++) {
					var id = domIds[i];
					if ($(id).length) {
						var inputValue = field.closest("form, .validationEngineContainer").find(id).val();
						var keyValue = id.replace('#', '') + '=' + escape(inputValue);
						data[id.replace('#', '')] = inputValue;
					}
				}
			}

			// If a field change event triggered this we want to clear the cache for this ID
			if (options.eventTrigger == "field") {
				delete options.ajaxValidCache[field.attr("id")];
			}

			// If there is an error or if the the field is already validated, do not re-execute AJAX
			if (!options.isError && !methods._checkAjaxFieldStatus(field.attr("id"), options)) {
				$.ajax({
					type: options.ajaxFormValidationMethod,
					url: rule.url,
					cache: false,
					dataType: "json",
					data: data,
					field: field,
					rule: rule,
					methods: methods,
					options: options,
					beforeSend: function beforeSend() {},
					error: function error(data, transport) {
						if (options.onFailure) {
							options.onFailure(data, transport);
						} else {
							methods._ajaxError(data, transport);
						}
					},
					success: function success(json) {

						// asynchronously called on success, data is the json answer from the server
						var errorFieldId = json[0];
						//var errorField = $($("#" + errorFieldId)[0]);
						var errorField = $("#" + errorFieldId).eq(0);

						// make sure we found the element
						if (errorField.length == 1) {
							var status = json[1];
							// read the optional msg from the server
							var msg = json[2];
							if (!status) {
								// Houston we got a problem - display an red prompt
								options.ajaxValidCache[errorFieldId] = false;
								options.isError = true;

								// resolve the msg prompt
								if (msg) {
									if (options.allrules[msg]) {
										var txt = options.allrules[msg].alertText;
										if (txt) {
											msg = txt;
										}
									}
								} else msg = rule.alertText;

								if (options.showPrompts) methods._showPrompt(errorField, msg, "", true, options);
							} else {
								options.ajaxValidCache[errorFieldId] = true;

								// resolves the msg prompt
								if (msg) {
									if (options.allrules[msg]) {
										var txt = options.allrules[msg].alertTextOk;
										if (txt) {
											msg = txt;
										}
									}
								} else msg = rule.alertTextOk;

								if (options.showPrompts) {
									// see if we should display a green prompt
									if (msg) methods._showPrompt(errorField, msg, "pass", true, options);else methods._closePrompt(errorField);
								}

								// If a submit form triggered this, we want to re-submit the form
								if (options.eventTrigger == "submit") field.closest("form").submit();
							}
						}
						errorField.trigger("jqv.field.result", [errorField, options.isError, msg]);
					}
				});

				return rule.alertTextLoad;
			}
		},
		/**
  * Common method to handle ajax errors
  *
  * @param {Object} data
  * @param {Object} transport
  */
		_ajaxError: function _ajaxError(data, transport) {
			if (data.status == 0 && transport == null) alert("The page is not served from a server! ajax call failed");else if (typeof console != "undefined") console.log("Ajax error: " + data.status + " " + transport);
		},
		/**
  * date -> string
  *
  * @param {Object} date
  */
		_dateToString: function _dateToString(date) {
			return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
		},
		/**
  * Parses an ISO date
  * @param {String} d
  */
		_parseDate: function _parseDate(d) {

			var dateParts = d.split("-");
			if (dateParts == d) dateParts = d.split("/");
			if (dateParts == d) {
				dateParts = d.split(".");
				return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
			}
			return new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
		},
		/**
  * Builds or updates a prompt with the given information
  *
  * @param {jqObject} field
  * @param {String} promptText html text to display type
  * @param {String} type the type of bubble: 'pass' (green), 'load' (black) anything else (red)
  * @param {boolean} ajaxed - use to mark fields than being validated with ajax
  * @param {Map} options user options
  */
		_showPrompt: function _showPrompt(field, promptText, type, ajaxed, options, ajaxform) {
			//Check if we need to adjust what element to show the prompt on
			if (field.data('jqv-prompt-at') instanceof jQuery) {
				field = field.data('jqv-prompt-at');
			} else if (field.data('jqv-prompt-at')) {
				field = $(field.data('jqv-prompt-at'));
			}

			var prompt = methods._getPrompt(field);
			// The ajax submit errors are not see has an error in the form,
			// When the form errors are returned, the engine see 2 bubbles, but those are ebing closed by the engine at the same time
			// Because no error was found befor submitting
			if (ajaxform) prompt = false;
			// Check that there is indded text
			if ($.trim(promptText)) {
				if (prompt) methods._updatePrompt(field, prompt, promptText, type, ajaxed, options);else methods._buildPrompt(field, promptText, type, ajaxed, options);
			}
		},
		/**
  * Builds and shades a prompt for the given field.
  *
  * @param {jqObject} field
  * @param {String} promptText html text to display type
  * @param {String} type the type of bubble: 'pass' (green), 'load' (black) anything else (red)
  * @param {boolean} ajaxed - use to mark fields than being validated with ajax
  * @param {Map} options user options
  */
		_buildPrompt: function _buildPrompt(field, promptText, type, ajaxed, options) {

			// create the prompt
			var prompt = $('<div>');
			prompt.addClass(methods._getClassName(field.attr("id")) + "formError");
			// add a class name to identify the parent form of the prompt
			prompt.addClass("parentForm" + methods._getClassName(field.closest('form, .validationEngineContainer').attr("id")));
			prompt.addClass("formError");

			switch (type) {
				case "pass":
					prompt.addClass("greenPopup");
					break;
				case "load":
					prompt.addClass("blackPopup");
					break;
				default:
				/* it has error  */
				//alert("unknown popup type:"+type);
			}
			if (ajaxed) prompt.addClass("ajaxed");

			// create the prompt content
			var promptContent = $('<div>').addClass("formErrorContent").html(promptText).appendTo(prompt);

			// determine position type
			var positionType = field.data("promptPosition") || options.promptPosition;

			// create the css arrow pointing at the field
			// note that there is no triangle on max-checkbox and radio
			if (options.showArrow) {
				var arrow = $('<div>').addClass("formErrorArrow");

				//prompt positioning adjustment support. Usage: positionType:Xshift,Yshift (for ex.: bottomLeft:+20 or bottomLeft:-20,+10)
				if (typeof positionType == 'string') {
					var pos = positionType.indexOf(":");
					if (pos != -1) positionType = positionType.substring(0, pos);
				}

				switch (positionType) {
					case "bottomLeft":
					case "bottomRight":
						prompt.find(".formErrorContent").before(arrow);
						arrow.addClass("formErrorArrowBottom").html('<div class="line1"><!-- --></div><div class="line2"><!-- --></div><div class="line3"><!-- --></div><div class="line4"><!-- --></div><div class="line5"><!-- --></div><div class="line6"><!-- --></div><div class="line7"><!-- --></div><div class="line8"><!-- --></div><div class="line9"><!-- --></div><div class="line10"><!-- --></div>');
						break;
					case "topLeft":
					case "topRight":
						arrow.html('<div class="line10"><!-- --></div><div class="line9"><!-- --></div><div class="line8"><!-- --></div><div class="line7"><!-- --></div><div class="line6"><!-- --></div><div class="line5"><!-- --></div><div class="line4"><!-- --></div><div class="line3"><!-- --></div><div class="line2"><!-- --></div><div class="line1"><!-- --></div>');
						prompt.append(arrow);
						break;
				}
			}
			// Add custom prompt class
			if (options.addPromptClass) prompt.addClass(options.addPromptClass);

			// Add custom prompt class defined in element
			var requiredOverride = field.attr('data-required-class');
			if (requiredOverride !== undefined) {
				prompt.addClass(requiredOverride);
			} else {
				if (options.prettySelect) {
					if ($('#' + field.attr('id')).next().is('select')) {
						var prettyOverrideClass = $('#' + field.attr('id').substr(options.usePrefix.length).substring(options.useSuffix.length)).attr('data-required-class');
						if (prettyOverrideClass !== undefined) {
							prompt.addClass(prettyOverrideClass);
						}
					}
				}
			}

			prompt.css({
				"opacity": 0
			});
			if (positionType === 'inline') {
				prompt.addClass("inline");
				if (typeof field.attr('data-prompt-target') !== 'undefined' && $('#' + field.attr('data-prompt-target')).length > 0) {
					prompt.appendTo($('#' + field.attr('data-prompt-target')));
				} else {
					field.after(prompt);
				}
			} else {
				field.before(prompt);
			}

			var pos = methods._calculatePosition(field, prompt, options);
			prompt.css({
				'position': positionType === 'inline' ? 'relative' : 'absolute',
				"top": pos.callerTopPosition,
				"left": pos.callerleftPosition,
				"marginTop": pos.marginTopSize,
				"opacity": 0
			}).data("callerField", field);

			if (options.autoHidePrompt) {
				setTimeout(function () {
					prompt.animate({
						"opacity": 0
					}, function () {
						prompt.closest('.formError').remove();
					});
				}, options.autoHideDelay);
			}
			return prompt.animate({
				"opacity": 0.87
			});
		},
		/**
  * Updates the prompt text field - the field for which the prompt
  * @param {jqObject} field
  * @param {String} promptText html text to display type
  * @param {String} type the type of bubble: 'pass' (green), 'load' (black) anything else (red)
  * @param {boolean} ajaxed - use to mark fields than being validated with ajax
  * @param {Map} options user options
  */
		_updatePrompt: function _updatePrompt(field, prompt, promptText, type, ajaxed, options, noAnimation) {

			if (prompt) {
				if (typeof type !== "undefined") {
					if (type == "pass") prompt.addClass("greenPopup");else prompt.removeClass("greenPopup");

					if (type == "load") prompt.addClass("blackPopup");else prompt.removeClass("blackPopup");
				}
				if (ajaxed) prompt.addClass("ajaxed");else prompt.removeClass("ajaxed");

				prompt.find(".formErrorContent").html(promptText);

				var pos = methods._calculatePosition(field, prompt, options);
				var css = {
					"top": pos.callerTopPosition,
					"left": pos.callerleftPosition,
					"marginTop": pos.marginTopSize,
					"opacity": 0.87
				};

				prompt.css({
					"opacity": 0,
					"display": "block"
				});

				if (noAnimation) prompt.css(css);else prompt.animate(css);
			}
		},
		/**
  * Closes the prompt associated with the given field
  *
  * @param {jqObject}
  *            field
  */
		_closePrompt: function _closePrompt(field) {
			var prompt = methods._getPrompt(field);
			if (prompt) prompt.fadeTo("fast", 0, function () {
				prompt.closest('.formError').remove();
			});
		},
		closePrompt: function closePrompt(field) {
			return methods._closePrompt(field);
		},
		/**
  * Returns the error prompt matching the field if any
  *
  * @param {jqObject}
  *            field
  * @return undefined or the error prompt (jqObject)
  */
		_getPrompt: function _getPrompt(field) {
			var formId = $(field).closest('form, .validationEngineContainer').attr('id');
			var className = methods._getClassName(field.attr("id")) + "formError";
			var match = $("." + methods._escapeExpression(className) + '.parentForm' + methods._getClassName(formId))[0];
			if (match) return $(match);
		},
		/**
  * Returns the escapade classname
  *
  * @param {selector}
  *            className
  */
		_escapeExpression: function _escapeExpression(selector) {
			return selector.replace(/([#;&,\.\+\*\~':"\!\^$\[\]\(\)=>\|])/g, "\\$1");
		},
		/**
  * returns true if we are in a RTLed document
  *
  * @param {jqObject} field
  */
		isRTL: function isRTL(field) {
			var $document = $(document);
			var $body = $('body');
			var rtl = field && field.hasClass('rtl') || field && (field.attr('dir') || '').toLowerCase() === 'rtl' || $document.hasClass('rtl') || ($document.attr('dir') || '').toLowerCase() === 'rtl' || $body.hasClass('rtl') || ($body.attr('dir') || '').toLowerCase() === 'rtl';
			return Boolean(rtl);
		},
		/**
  * Calculates prompt position
  *
  * @param {jqObject}
  *            field
  * @param {jqObject}
  *            the prompt
  * @param {Map}
  *            options
  * @return positions
  */
		_calculatePosition: function _calculatePosition(field, promptElmt, options) {

			var promptTopPosition, promptleftPosition, marginTopSize;
			var fieldWidth = field.width();
			var fieldLeft = field.position().left;
			var fieldTop = field.position().top;
			var fieldHeight = field.height();
			var promptHeight = promptElmt.height();

			// is the form contained in an overflown container?
			promptTopPosition = promptleftPosition = 0;
			// compensation for the arrow
			marginTopSize = -promptHeight;

			//prompt positioning adjustment support
			//now you can adjust prompt position
			//usage: positionType:Xshift,Yshift
			//for example:
			//   bottomLeft:+20 means bottomLeft position shifted by 20 pixels right horizontally
			//   topRight:20, -15 means topRight position shifted by 20 pixels to right and 15 pixels to top
			//You can use +pixels, - pixels. If no sign is provided than + is default.
			var positionType = field.data("promptPosition") || options.promptPosition;
			var shift1 = "";
			var shift2 = "";
			var shiftX = 0;
			var shiftY = 0;
			if (typeof positionType == 'string') {
				//do we have any position adjustments ?
				if (positionType.indexOf(":") != -1) {
					shift1 = positionType.substring(positionType.indexOf(":") + 1);
					positionType = positionType.substring(0, positionType.indexOf(":"));

					//if any advanced positioning will be needed (percents or something else) - parser should be added here
					//for now we use simple parseInt()

					//do we have second parameter?
					if (shift1.indexOf(",") != -1) {
						shift2 = shift1.substring(shift1.indexOf(",") + 1);
						shift1 = shift1.substring(0, shift1.indexOf(","));
						shiftY = parseInt(shift2);
						if (isNaN(shiftY)) shiftY = 0;
					};

					shiftX = parseInt(shift1);
					if (isNaN(shift1)) shift1 = 0;
				};
			};

			switch (positionType) {
				default:
				case "topRight":
					promptleftPosition += fieldLeft + fieldWidth - 27;
					promptTopPosition += fieldTop;
					break;

				case "topLeft":
					promptTopPosition += fieldTop;
					promptleftPosition += fieldLeft;
					break;

				case "centerRight":
					promptTopPosition = fieldTop + 4;
					marginTopSize = 0;
					promptleftPosition = fieldLeft + field.outerWidth(true) + 5;
					break;
				case "centerLeft":
					promptleftPosition = fieldLeft - (promptElmt.width() + 2);
					promptTopPosition = fieldTop + 4;
					marginTopSize = 0;

					break;

				case "bottomLeft":
					promptTopPosition = fieldTop + field.height() + 5;
					marginTopSize = 0;
					promptleftPosition = fieldLeft;
					break;
				case "bottomRight":
					promptleftPosition = fieldLeft + fieldWidth - 27;
					promptTopPosition = fieldTop + field.height() + 5;
					marginTopSize = 0;
					break;
				case "inline":
					promptleftPosition = 0;
					promptTopPosition = 0;
					marginTopSize = 0;
			};

			//apply adjusments if any
			promptleftPosition += shiftX;
			promptTopPosition += shiftY;

			return {
				"callerTopPosition": promptTopPosition + "px",
				"callerleftPosition": promptleftPosition + "px",
				"marginTopSize": marginTopSize + "px"
			};
		},
		/**
  * Saves the user options and variables in the form.data
  *
  * @param {jqObject}
  *            form - the form where the user option should be saved
  * @param {Map}
  *            options - the user options
  * @return the user options (extended from the defaults)
  */
		_saveOptions: function _saveOptions(form, options) {

			// is there a language localisation ?
			if ($.validationEngineLanguage) var allRules = $.validationEngineLanguage.allRules;else $.error("jQuery.validationEngine rules are not loaded, plz add localization files to the page");
			// --- Internals DO NOT TOUCH or OVERLOAD ---
			// validation rules and i18
			$.validationEngine.defaults.allrules = allRules;

			var userOptions = $.extend(true, {}, $.validationEngine.defaults, options);

			form.data('jqv', userOptions);
			return userOptions;
		},

		/**
  * Removes forbidden characters from class name
  * @param {String} className
  */
		_getClassName: function _getClassName(className) {
			if (className) return className.replace(/:/g, "_").replace(/\./g, "_");
		},
		/**
  * Escape special character for jQuery selector
  * http://totaldev.com/content/escaping-characters-get-valid-jquery-id
  * @param {String} selector
  */
		_jqSelector: function _jqSelector(str) {
			return str.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
		},
		/**
  * Conditionally required field
  *
  * @param {jqObject} field
  * @param {Array[String]} rules
  * @param {int} i rules index
  * @param {Map}
  * user options
  * @return an error string if validation failed
  */
		_condRequired: function _condRequired(field, rules, i, options) {
			var idx, dependingField;

			for (idx = i + 1; idx < rules.length; idx++) {
				dependingField = jQuery("#" + rules[idx]).first();

				/* Use _required for determining wether dependingField has a value.
    * There is logic there for handling all field types, and default value; so we won't replicate that here
    * Indicate this special use by setting the last parameter to true so we only validate the dependingField on chackboxes and radio buttons (#462)
    */
				if (dependingField.length && methods._required(dependingField, ["required"], 0, options, true) == undefined) {
					/* We now know any of the depending fields has a value,
     * so we can validate this field as per normal required code
     */
					return methods._required(field, ["required"], 0, options);
				}
			}
		},

		_submitButtonClick: function _submitButtonClick(event) {
			var button = $(this);
			var form = button.closest('form, .validationEngineContainer');
			form.data("jqv_submitButton", button.attr("id"));
		}
	};

	/**
 * Plugin entry point.
 * You may pass an action as a parameter or a list of options.
 * if none, the init and attach methods are being called.
 * Remember: if you pass options, the attached method is NOT called automatically
 *
 * @param {String}
 *            method (optional) action
 */
	$.fn.validationEngine = function (method) {

		var form = $(this);
		if (!form[0]) return form; // stop here if the form does not exist

		if (typeof method == 'string' && method.charAt(0) != '_' && methods[method]) {

			// make sure init is called once
			if (method != "showPrompt" && method != "hide" && method != "hideAll") methods.init.apply(form);

			return methods[method].apply(form, Array.prototype.slice.call(arguments, 1));
		} else if ((typeof method === 'undefined' ? 'undefined' : _typeof(method)) == 'object' || !method) {

			// default constructor with or without arguments
			methods.init.apply(form, arguments);
			return methods.attach.apply(form);
		} else {
			$.error('Method ' + method + ' does not exist in jQuery.validationEngine');
		}
	};

	// LEAK GLOBAL OPTIONS
	$.validationEngine = {
		fieldIdCounter: 0, defaults: {

			// Name of the event triggering field validation
			validationEventTrigger: "blur",
			// Automatically scroll viewport to the first error
			scroll: true,
			// Focus on the first input
			focusFirstField: true,
			// Show prompts, set to false to disable prompts
			showPrompts: true,
			// Should we attempt to validate non-visible input fields contained in the form? (Useful in cases of tabbed containers, e.g. jQuery-UI tabs)
			validateNonVisibleFields: false,
			// ignore the validation for fields with this specific class (Useful in cases of tabbed containers AND hidden fields we don't want to validate)
			ignoreFieldsWithClass: 'ignoreMe',
			// Opening box position, possible locations are: topLeft,
			// topRight, bottomLeft, centerRight, bottomRight, inline
			// inline gets inserted after the validated field or into an element specified in data-prompt-target
			promptPosition: "topRight",
			bindMethod: "bind",
			// internal, automatically set to true when it parse a _ajax rule
			inlineAjax: false,
			// if set to true, the form data is sent asynchronously via ajax to the form.action url (get)
			ajaxFormValidation: false,
			// The url to send the submit ajax validation (default to action)
			ajaxFormValidationURL: false,
			// HTTP method used for ajax validation
			ajaxFormValidationMethod: 'get',
			// Ajax form validation callback method: boolean onComplete(form, status, errors, options)
			// retuns false if the form.submit event needs to be canceled.
			onAjaxFormComplete: $.noop,
			// called right before the ajax call, may return false to cancel
			onBeforeAjaxFormValidation: $.noop,
			// Stops form from submitting and execute function assiciated with it
			onValidationComplete: false,

			// Used when you have a form fields too close and the errors messages are on top of other disturbing viewing messages
			doNotShowAllErrosOnSubmit: false,
			// Object where you store custom messages to override the default error messages
			custom_error_messages: {},
			// true if you want to validate the input fields on blur event
			binded: true,
			// set to true if you want to validate the input fields on blur only if the field it's not empty
			notEmpty: false,
			// set to true, when the prompt arrow needs to be displayed
			showArrow: true,
			// set to false, determines if the prompt arrow should be displayed when validating
			// checkboxes and radio buttons
			showArrowOnRadioAndCheckbox: false,
			// did one of the validation fail ? kept global to stop further ajax validations
			isError: false,
			// Limit how many displayed errors a field can have
			maxErrorsPerField: false,

			// Caches field validation status, typically only bad status are created.
			// the array is used during ajax form validation to detect issues early and prevent an expensive submit
			ajaxValidCache: {},
			// Auto update prompt position after window resize
			autoPositionUpdate: false,

			InvalidFields: [],
			onFieldSuccess: false,
			onFieldFailure: false,
			onSuccess: false,
			onFailure: false,
			validateAttribute: "class",
			addSuccessCssClassToField: "",
			addFailureCssClassToField: "",

			// Auto-hide prompt
			autoHidePrompt: false,
			// Delay before auto-hide
			autoHideDelay: 10000,
			// Fade out duration while hiding the validations
			fadeDuration: 300,
			// Use Prettify select library
			prettySelect: false,
			// Add css class on prompt
			addPromptClass: "",
			// Custom ID uses prefix
			usePrefix: "",
			// Custom ID uses suffix
			useSuffix: "",
			// Only show one message per error prompt
			showOneMessage: false
		}
	};
	$(function () {
		$.validationEngine.defaults.promptPosition = methods.isRTL() ? 'topLeft' : "topRight";
	});
})(jQuery);
(function ($) {

	$.extend({

		app: {
			global: {
				init: function init() {
					console.log("global fired");

					// Initialize Foundation
					$(document).foundation();
				}
			},
			modules: {},
			pages: {
				homepage: {
					init: function init() {
						console.log("homepage fired");
					}
				}
			}
		}
	});

	// Fire global.init on all pages
	$(document).ready(function () {
		$.app.global.init();
	});
})(jQuery);
//# sourceMappingURL=app.js.map
