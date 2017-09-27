(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} [once=false] Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Hold the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var events = this._events
    , names = []
    , name;

  if (!events) return names;

  for (name in events) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WebVRManager = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Emitter = _dereq_('./emitter.js');
var Modes = _dereq_('./modes.js');
var Util = _dereq_('./util.js');

/**
 * Everything having to do with the WebVR button.
 * Emits a 'click' event when it's clicked.
 */
function ButtonManager(opt_root) {
  var root = opt_root || document.body;
  this.loadIcons_();

  // Make the fullscreen button.
  var fsButton = this.createButton();
  fsButton.src = this.ICONS.fullscreen;
  fsButton.title = 'Fullscreen mode';
  var s = fsButton.style;
  s.bottom = 0;
  s.right = 0;
  fsButton.addEventListener('click', this.createClickHandler_('fs'));
  root.appendChild(fsButton);
  this.fsButton = fsButton;

  // Make the VR button.
  var vrButton = this.createButton();
  vrButton.src = this.ICONS.cardboard;
  vrButton.title = 'Virtual reality mode';
  var s = vrButton.style;
  s.bottom = 0;
  s.right = '48px';
  vrButton.addEventListener('click', this.createClickHandler_('vr'));
  root.appendChild(vrButton);
  this.vrButton = vrButton;

  this.isVisible = true;

}
ButtonManager.prototype = new Emitter();

ButtonManager.prototype.createButton = function() {
  var button = document.createElement('img');
  button.className = 'webvr-button';
  var s = button.style;
  s.position = 'absolute';
  s.width = '24px'
  s.height = '24px';
  s.backgroundSize = 'cover';
  s.backgroundColor = 'transparent';
  s.border = 0;
  s.userSelect = 'none';
  s.webkitUserSelect = 'none';
  s.MozUserSelect = 'none';
  s.cursor = 'pointer';
  s.padding = '12px';
  s.zIndex = 1;
  s.display = 'none';
  s.boxSizing = 'content-box';

  // Prevent button from being selected and dragged.
  button.draggable = false;
  button.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });

  // Style it on hover.
  button.addEventListener('mouseenter', function(e) {
    s.filter = s.webkitFilter = 'drop-shadow(0 0 5px rgba(255,255,255,1))';
  });
  button.addEventListener('mouseleave', function(e) {
    s.filter = s.webkitFilter = '';
  });
  return button;
};

ButtonManager.prototype.setMode = function(mode, isVRCompatible) {
  isVRCompatible = isVRCompatible || WebVRConfig.FORCE_ENABLE_VR;
  if (!this.isVisible) {
    return;
  }
  switch (mode) {
    case Modes.NORMAL:
      this.fsButton.style.display = 'block';
      this.fsButton.src = this.ICONS.fullscreen;
      this.vrButton.style.display = (isVRCompatible ? 'block' : 'none');
      break;
    case Modes.MAGIC_WINDOW:
      this.fsButton.style.display = 'block';
      this.fsButton.src = this.ICONS.exitFullscreen;
      this.vrButton.style.display = 'none';
      break;
    case Modes.VR:
      this.fsButton.style.display = 'none';
      this.vrButton.style.display = 'none';
      break;
  }

  // Hack for Safari Mac/iOS to force relayout (svg-specific issue)
  // http://goo.gl/hjgR6r
  var oldValue = this.fsButton.style.display;
  this.fsButton.style.display = 'inline-block';
  this.fsButton.offsetHeight;
  this.fsButton.style.display = oldValue;
};

ButtonManager.prototype.setVisibility = function(isVisible) {
  this.isVisible = isVisible;
  this.fsButton.style.display = isVisible ? 'block' : 'none';
  this.vrButton.style.display = isVisible ? 'block' : 'none';
};

ButtonManager.prototype.createClickHandler_ = function(eventName) {
  return function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.emit(eventName);
  }.bind(this);
};

ButtonManager.prototype.loadIcons_ = function() {
  // Preload some hard-coded SVG.
  this.ICONS = {};
  this.ICONS.cardboard = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMjAuNzQgNkgzLjIxQzIuNTUgNiAyIDYuNTcgMiA3LjI4djEwLjQ0YzAgLjcuNTUgMS4yOCAxLjIzIDEuMjhoNC43OWMuNTIgMCAuOTYtLjMzIDEuMTQtLjc5bDEuNC0zLjQ4Yy4yMy0uNTkuNzktMS4wMSAxLjQ0LTEuMDFzMS4yMS40MiAxLjQ1IDEuMDFsMS4zOSAzLjQ4Yy4xOS40Ni42My43OSAxLjExLjc5aDQuNzljLjcxIDAgMS4yNi0uNTcgMS4yNi0xLjI4VjcuMjhjMC0uNy0uNTUtMS4yOC0xLjI2LTEuMjh6TTcuNSAxNC42MmMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTMgMS4xOCAwIDIuMTIuOTYgMi4xMiAyLjEzcy0uOTUgMi4xMi0yLjEyIDIuMTJ6bTkgMGMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTNzMi4xMi45NiAyLjEyIDIuMTMtLjk1IDIuMTItMi4xMiAyLjEyeiIvPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgwVjB6Ii8+Cjwvc3ZnPgo=');
  this.ICONS.fullscreen = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNyAxNEg1djVoNXYtMkg3di0zem0tMi00aDJWN2gzVjVINXY1em0xMiA3aC0zdjJoNXYtNWgtMnYzek0xNCA1djJoM3YzaDJWNWgtNXoiLz4KPC9zdmc+Cg==');
  this.ICONS.exitFullscreen = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNSAxNmgzdjNoMnYtNUg1djJ6bTMtOEg1djJoNVY1SDh2M3ptNiAxMWgydi0zaDN2LTJoLTV2NXptMi0xMVY1aC0ydjVoNVY4aC0zeiIvPgo8L3N2Zz4K');
  this.ICONS.settings = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMTkuNDMgMTIuOThjLjA0LS4zMi4wNy0uNjQuMDctLjk4cy0uMDMtLjY2LS4wNy0uOThsMi4xMS0xLjY1Yy4xOS0uMTUuMjQtLjQyLjEyLS42NGwtMi0zLjQ2Yy0uMTItLjIyLS4zOS0uMy0uNjEtLjIybC0yLjQ5IDFjLS41Mi0uNC0xLjA4LS43My0xLjY5LS45OGwtLjM4LTIuNjVDMTQuNDYgMi4xOCAxNC4yNSAyIDE0IDJoLTRjLS4yNSAwLS40Ni4xOC0uNDkuNDJsLS4zOCAyLjY1Yy0uNjEuMjUtMS4xNy41OS0xLjY5Ljk4bC0yLjQ5LTFjLS4yMy0uMDktLjQ5IDAtLjYxLjIybC0yIDMuNDZjLS4xMy4yMi0uMDcuNDkuMTIuNjRsMi4xMSAxLjY1Yy0uMDQuMzItLjA3LjY1LS4wNy45OHMuMDMuNjYuMDcuOThsLTIuMTEgMS42NWMtLjE5LjE1LS4yNC40Mi0uMTIuNjRsMiAzLjQ2Yy4xMi4yMi4zOS4zLjYxLjIybDIuNDktMWMuNTIuNCAxLjA4LjczIDEuNjkuOThsLjM4IDIuNjVjLjAzLjI0LjI0LjQyLjQ5LjQyaDRjLjI1IDAgLjQ2LS4xOC40OS0uNDJsLjM4LTIuNjVjLjYxLS4yNSAxLjE3LS41OSAxLjY5LS45OGwyLjQ5IDFjLjIzLjA5LjQ5IDAgLjYxLS4yMmwyLTMuNDZjLjEyLS4yMi4wNy0uNDktLjEyLS42NGwtMi4xMS0xLjY1ek0xMiAxNS41Yy0xLjkzIDAtMy41LTEuNTctMy41LTMuNXMxLjU3LTMuNSAzLjUtMy41IDMuNSAxLjU3IDMuNSAzLjUtMS41NyAzLjUtMy41IDMuNXoiLz4KPC9zdmc+Cg==');
};

module.exports = ButtonManager;

},{"./emitter.js":2,"./modes.js":3,"./util.js":4}],2:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function Emitter() {
  this.callbacks = {};
}

Emitter.prototype.emit = function(eventName) {
  var callbacks = this.callbacks[eventName];
  if (!callbacks) {
    //console.log('No valid callback specified.');
    return;
  }
  var args = [].slice.call(arguments);
  // Eliminate the first param (the callback).
  args.shift();
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i].apply(this, args);
  }
};

Emitter.prototype.on = function(eventName, callback) {
  if (eventName in this.callbacks) {
    this.callbacks[eventName].push(callback);
  } else {
    this.callbacks[eventName] = [callback];
  }
};

module.exports = Emitter;

},{}],3:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Modes = {
  UNKNOWN: 0,
  // Not fullscreen, just tracking.
  NORMAL: 1,
  // Magic window immersive mode.
  MAGIC_WINDOW: 2,
  // Full screen split screen VR mode.
  VR: 3,
};

module.exports = Modes;

},{}],4:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = {};

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.isFirefox = function() {
  return /firefox/i.test(navigator.userAgent);
};

Util.isIOS = function() {
  return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
};

Util.isIFrame = function() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

Util.appendQueryParameter = function(url, key, value) {
  // Determine delimiter based on if the URL already GET parameters in it.
  var delimiter = (url.indexOf('?') < 0 ? '?' : '&');
  url += delimiter + key + '=' + value;
  return url;
};

// From http://goo.gl/4WX3tg
Util.getQueryParameter = function(name) {
  var name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90);
};

Util.getScreenWidth = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.getScreenHeight = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

module.exports = Util;

},{}],5:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ButtonManager = _dereq_('./button-manager.js');
var Emitter = _dereq_('./emitter.js');
var Modes = _dereq_('./modes.js');
var Util = _dereq_('./util.js');

/**
 * Helper for getting in and out of VR mode.
 */
function WebVRManager(renderer, effect, params) {
  this.params = params || {};

  this.mode = Modes.UNKNOWN;

  // Set option to hide the button.
  this.hideButton = this.params.hideButton || false;
  // Whether or not the FOV should be distorted or un-distorted. By default, it
  // should be distorted, but in the case of vertex shader based distortion,
  // ensure that we use undistorted parameters.
  this.predistorted = !!this.params.predistorted;

  // Save the THREE.js renderer and effect for later.
  this.renderer = renderer;
  this.effect = effect;
  var polyfillWrapper = document.querySelector('.webvr-polyfill-fullscreen-wrapper');
  this.button = new ButtonManager(polyfillWrapper);

  this.isFullscreenDisabled = !!Util.getQueryParameter('no_fullscreen');
  this.startMode = Modes.NORMAL;
  var startModeParam = parseInt(Util.getQueryParameter('start_mode'));
  if (!isNaN(startModeParam)) {
    this.startMode = startModeParam;
  }

  if (this.hideButton) {
    this.button.setVisibility(false);
  }

  // Check if the browser is compatible with WebVR.
  this.getDeviceByType_(VRDisplay).then(function(hmd) {
    this.hmd = hmd;

    // Only enable VR mode if there's a VR device attached or we are running the
    // polyfill on mobile.
    if (!this.isVRCompatibleOverride) {
      this.isVRCompatible =  !hmd.isPolyfilled || Util.isMobile();
    }

    switch (this.startMode) {
      case Modes.MAGIC_WINDOW:
        this.setMode_(Modes.MAGIC_WINDOW);
        break;
      case Modes.VR:
        this.enterVRMode_();
        this.setMode_(Modes.VR);
        break;
      default:
        this.setMode_(Modes.NORMAL);
    }

    this.emit('initialized');
  }.bind(this));

  // Hook up button listeners.
  this.button.on('fs', this.onFSClick_.bind(this));
  this.button.on('vr', this.onVRClick_.bind(this));

  // Bind to fullscreen events.
  document.addEventListener('webkitfullscreenchange',
      this.onFullscreenChange_.bind(this));
  document.addEventListener('mozfullscreenchange',
      this.onFullscreenChange_.bind(this));
  document.addEventListener('msfullscreenchange',
      this.onFullscreenChange_.bind(this));

  // Bind to VR* specific events.
  window.addEventListener('vrdisplaypresentchange',
      this.onVRDisplayPresentChange_.bind(this));
  window.addEventListener('vrdisplaydeviceparamschange',
      this.onVRDisplayDeviceParamsChange_.bind(this));
}

WebVRManager.prototype = new Emitter();

// Expose these values externally.
WebVRManager.Modes = Modes;

WebVRManager.prototype.render = function(scene, camera, timestamp) {
  // Scene may be an array of two scenes, one for each eye.
  if (scene instanceof Array) {
    this.effect.render(scene[0], camera);
  } else {
    this.effect.render(scene, camera);
  }
};

WebVRManager.prototype.setVRCompatibleOverride = function(isVRCompatible) {
  this.isVRCompatible = isVRCompatible;
  this.isVRCompatibleOverride = true;

  // Don't actually change modes, just update the buttons.
  this.button.setMode(this.mode, this.isVRCompatible);
};

WebVRManager.prototype.setFullscreenCallback = function(callback) {
  this.fullscreenCallback = callback;
};

WebVRManager.prototype.setVRCallback = function(callback) {
  this.vrCallback = callback;
};

WebVRManager.prototype.setExitFullscreenCallback = function(callback) {
  this.exitFullscreenCallback = callback;
}

/**
 * Promise returns true if there is at least one HMD device available.
 */
WebVRManager.prototype.getDeviceByType_ = function(type) {
  return new Promise(function(resolve, reject) {
    navigator.getVRDisplays().then(function(displays) {
      // Promise succeeds, but check if there are any displays actually.
      for (var i = 0; i < displays.length; i++) {
        if (displays[i] instanceof type) {
          resolve(displays[i]);
          break;
        }
      }
      resolve(null);
    }, function() {
      // No displays are found.
      resolve(null);
    });
  });
};

/**
 * Helper for entering VR mode.
 */
WebVRManager.prototype.enterVRMode_ = function() {
  this.hmd.requestPresent([{
    source: this.renderer.domElement,
    predistorted: this.predistorted
  }]);
};

WebVRManager.prototype.setMode_ = function(mode) {
  var oldMode = this.mode;
  if (mode == this.mode) {
    console.warn('Not changing modes, already in %s', mode);
    return;
  }
  // console.log('Mode change: %s => %s', this.mode, mode);
  this.mode = mode;
  this.button.setMode(mode, this.isVRCompatible);

  // Emit an event indicating the mode changed.
  this.emit('modechange', mode, oldMode);
};

/**
 * Main button was clicked.
 */
WebVRManager.prototype.onFSClick_ = function() {
  switch (this.mode) {
    case Modes.NORMAL:
      // TODO: Remove this hack if/when iOS gets real fullscreen mode.
      // If this is an iframe on iOS, break out and open in no_fullscreen mode.
      if (Util.isIOS() && Util.isIFrame()) {
        if (this.fullscreenCallback) {
          this.fullscreenCallback();
        } else {
          var url = window.location.href;
          url = Util.appendQueryParameter(url, 'no_fullscreen', 'true');
          url = Util.appendQueryParameter(url, 'start_mode', Modes.MAGIC_WINDOW);
          top.location.href = url;
          return;
        }
      }
      this.setMode_(Modes.MAGIC_WINDOW);
      this.requestFullscreen_();
      break;
    case Modes.MAGIC_WINDOW:
      if (this.isFullscreenDisabled) {
        window.history.back();
        return;
      }
      if (this.exitFullscreenCallback) {
        this.exitFullscreenCallback();
      }
      this.setMode_(Modes.NORMAL);
      this.exitFullscreen_();
      break;
  }
};

/**
 * The VR button was clicked.
 */
WebVRManager.prototype.onVRClick_ = function() {
  // TODO: Remove this hack when iOS has fullscreen mode.
  // If this is an iframe on iOS, break out and open in no_fullscreen mode.
  if (this.mode == Modes.NORMAL && Util.isIOS() && Util.isIFrame()) {
    if (this.vrCallback) {
      this.vrCallback();
    } else {
      var url = window.location.href;
      url = Util.appendQueryParameter(url, 'no_fullscreen', 'true');
      url = Util.appendQueryParameter(url, 'start_mode', Modes.VR);
      top.location.href = url;
      return;
    }
  }
  this.enterVRMode_();
};

WebVRManager.prototype.requestFullscreen_ = function() {
  var canvas = document.body;
  //var canvas = this.renderer.domElement;
  if (canvas.requestFullscreen) {
    canvas.requestFullscreen();
  } else if (canvas.mozRequestFullScreen) {
    canvas.mozRequestFullScreen();
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen();
  } else if (canvas.msRequestFullscreen) {
    canvas.msRequestFullscreen();
  }
};

WebVRManager.prototype.exitFullscreen_ = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

WebVRManager.prototype.onVRDisplayPresentChange_ = function(e) {
  console.log('onVRDisplayPresentChange_', e);
  if (this.hmd.isPresenting) {
    this.setMode_(Modes.VR);
  } else {
    this.setMode_(Modes.NORMAL);
  }
};

WebVRManager.prototype.onVRDisplayDeviceParamsChange_ = function(e) {
  console.log('onVRDisplayDeviceParamsChange_', e);
};

WebVRManager.prototype.onFullscreenChange_ = function(e) {
  // If we leave full-screen, go back to normal mode.
  if (document.webkitFullscreenElement === null ||
      document.mozFullScreenElement === null) {
    this.setMode_(Modes.NORMAL);
  }
};

module.exports = WebVRManager;

},{"./button-manager.js":1,"./emitter.js":2,"./modes.js":3,"./util.js":4}]},{},[5])(5)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
'use strict';

var _renderer = require('./renderer.js');

var _renderer2 = _interopRequireDefault(_renderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var renderer = void 0; /*
                        * Copyright 2016 Google Inc. All Rights Reserved.
                        * Licensed under the Apache License, Version 2.0 (the "License");
                        * you may not use this file except in compliance with the License.
                        * You may obtain a copy of the License at
                        *
                        *     http://www.apache.org/licenses/LICENSE-2.0
                        *
                        * Unless required by applicable law or agreed to in writing, software
                        * distributed under the License is distributed on an "AS IS" BASIS,
                        * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                        * See the License for the specific language governing permissions and
                        * limitations under the License.
                        */

var vrDisplay = void 0;

function onLoad() {
  renderer = new _renderer2.default();

  window.addEventListener('resize', function () {
    renderer.resize();
  });

  navigator.getVRDisplays().then(function (displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];

      renderer.addCube();

      vrDisplay.requestAnimationFrame(render);
    }
  });
}

function render() {
  renderer.render();

  vrDisplay.requestAnimationFrame(render);
}

window.addEventListener('load', onLoad);

},{"./renderer.js":4}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _webvrBoilerplate = require('webvr-boilerplate');

var _webvrBoilerplate2 = _interopRequireDefault(_webvrBoilerplate);

var _rayInput = require('../ray-input');

var _rayInput2 = _interopRequireDefault(_rayInput);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_COLOR = new THREE.Color(0x00FF00);
var HIGHLIGHT_COLOR = new THREE.Color(0x1E90FF);
var ACTIVE_COLOR = new THREE.Color(0xFF3333);

var MenuRenderer = function () {
  function MenuRenderer() {
    var _this = this;

    _classCallCheck(this, MenuRenderer);

    var world = void 0;
    var dt = 1 / 60;
    var constraintDown = false;
    var jointBody = void 0,
        constrainedBody = void 0,
        pointerConstraint = void 0;
    var clickMarker = false;
    var geometry = void 0,
        material = void 0,
        mesh = void 0;
    // To be synced
    var meshes = [],
        bodies = [];

    var axes = [];
    axes[0] = {
      value: [0, 0]
    };

    // Setup our world
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    world.gravity.set(0, -4, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Create a plane
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Joint body
    var shape = new CANNON.Sphere(0.1);
    jointBody = new CANNON.Body({ mass: 0 });
    jointBody.addShape(shape);
    jointBody.collisionFilterGroup = 0;
    jointBody.collisionFilterMask = 0;
    world.addBody(jointBody);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 500, 10000);

    var aspect = window.innerWidth / window.innerHeight;
    var camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    scene.add(camera);

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    console.log('sizing');
    console.log('window.devicePixelRatio: ' + window.devicePixelRatio);
    console.log('window.innerWidth: ' + window.innerWidth);
    console.log('window.innerHeight: ' + window.innerHeight);
    renderer.setClearColor(scene.fog.color);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMapEnabled = true;

    var effect = new THREE.VREffect(renderer);
    var controls = new THREE.VRControls(camera);
    controls.standing = true;

    var manager = new _webvrBoilerplate2.default(renderer, effect);
    document.body.appendChild(renderer.domElement);

    // Input manager.
    var rayInput = new _rayInput2.default(camera);
    rayInput.setSize(renderer.getSize());
    rayInput.on('raydown', function (opt_mesh) {
      _this.handleRayDown_(opt_mesh);
    });
    rayInput.on('raydrag', function () {
      _this.handleRayDrag_();
    });
    rayInput.on('rayup', function (opt_mesh) {
      _this.handleRayUp_(opt_mesh);
    });
    rayInput.on('raycancel', function (opt_mesh) {
      _this.handleRayCancel_(opt_mesh);
    });
    rayInput.on('rayover', function (mesh) {
      MenuRenderer.setSelected_(mesh, true);
    });
    rayInput.on('rayout', function (mesh) {
      MenuRenderer.setSelected_(mesh, false);
    });

    // Add the ray input mesh to the scene.
    scene.add(rayInput.getMesh());

    this.manager = manager;
    this.camera = camera;
    this.scene = scene;
    this.controls = controls;
    this.rayInput = rayInput;
    this.effect = effect;
    this.renderer = renderer;
    this.world = world;
    this.dt = dt;
    this.meshes = meshes;
    this.bodies = bodies;
    this.clickMarker = clickMarker;
    this.constraintDown = constraintDown;
    this.constrainedBody = constrainedBody;
    this.pointerConstraint = pointerConstraint;
    this.jointBody = jointBody;
    this.axes = axes;
    this.touchPadPosition = { x: 0, z: 0 };

    // lights
    var light = void 0;
    scene.add(new THREE.AmbientLight(0x666666));

    light = new THREE.DirectionalLight(0xffffff, 1.75);
    var d = 20;

    light.position.set(d, d, d);

    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.width = 1024;
    light.shadow.camera.left = -d;
    light.shadow.cameraright = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.far = 3 * d;
    light.shadow.camera.near = d;

    scene.add(light);

    // floor
    geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
    material = new THREE.MeshLambertMaterial({ color: 0x777777 });
    this.markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    //THREE.ColorUtils.adjustHSV( material.color, 0, 0, 0.9 );
    mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  _createClass(MenuRenderer, [{
    key: 'addCube',
    value: function addCube() {
      var boxShape = void 0,
          boxBody = void 0;
      var mass = 5;
      var cubeGeo = new THREE.BoxGeometry(1, 1, 1, 10, 10);
      var cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x29ad83 });
      var cubeMesh = void 0;
      cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial);
      cubeMesh.castShadow = true;
      this.meshes.push(cubeMesh);
      this.scene.add(cubeMesh);
      this.rayInput.add(cubeMesh);

      boxShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
      for (var i = 0; i < 1; i++) {
        boxBody = new CANNON.Body({ mass: mass });
        boxBody.addShape(boxShape);
        boxBody.position.set(0, 7, -5);
        this.world.addBody(boxBody);
        this.bodies.push(boxBody);
      }
    }
  }, {
    key: 'updatePhysics',
    value: function updatePhysics() {
      this.world.step(this.dt);
      for (var i = 0; i !== this.meshes.length; i++) {
        this.meshes[i].position.copy(this.bodies[i].position);
        this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
      }
    }
  }, {
    key: 'render',
    value: function render() {
      this.controls.update();
      this.rayInput.update();

      if (this.constraintDown) {
        //  Did any axes (assuming a 2D trackpad) values change?

        var gamepad = MenuRenderer.getVRGamepad();
        if (gamepad !== null) {
          if (gamepad.axes[0] && gamepad.axes[1]) {

            var axesVal = this.axes[0].value;
            var axisX = gamepad.axes[0];
            var axisY = gamepad.axes[1];

            // only apply filter if both axes are below threshold
            var filteredX = this.filterAxis(axisX);
            var filteredY = this.filterAxis(axisY);
            if (!filteredX && !filteredY) {
              axisX = filteredX;
              axisY = filteredY;
            }

            if (axesVal[0] !== axisX || axesVal[1] !== axisY) {
              axesVal[0] = axisX;
              axesVal[1] = axisY;
              console.log('axes changed', axesVal);
              this.rotateJoint(axisX, axisY);
            }
          }
        }
      }

      this.updatePhysics();
      this.effect.render(this.scene, this.camera);
    }

    /**
     * Gets the first VR-enabled gamepad.
     */

  }, {
    key: 'filterAxis',
    value: function filterAxis(v) {
      this.axisThreshold = 0.2;
      return Math.abs(v) > this.axisThreshold ? v : 0;
    }
  }, {
    key: 'resize',
    value: function resize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      console.log('Resizing');
      console.log('window.devicePixelRatio: ' + window.devicePixelRatio);
      console.log('window.innerWidth: ' + window.innerWidth);
      console.log('window.innerHeight: ' + window.innerHeight);
      var DPR = window.devicePixelRatio ? window.devicePixelRatio : 1;
      var WW = window.innerWidth;
      var HH = window.innerHeight;
      this.renderer.setSize(WW, HH);
      this.renderer.setViewport(0, 0, WW * DPR, HH * DPR);
      this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
      this.rayInput.setSize(this.renderer.getSize());
    }
  }, {
    key: 'handleRayDown_',
    value: function handleRayDown_(opt_mesh) {
      MenuRenderer.setAction_(opt_mesh, true);

      var pos = this.rayInput.renderer.reticle.position;
      if (pos) {
        this.constraintDown = true;
        // Set marker on contact point
        this.setClickMarker(pos.x, pos.y, pos.z, this.scene);

        // Set the movement plane
        // setScreenPerpCenter(pos,camera);

        var idx = this.meshes.indexOf(opt_mesh);
        if (idx !== -1) {
          this.addPointerConstraint(pos.x, pos.y, pos.z, this.bodies[idx]);
        }
      }
    }
  }, {
    key: 'handleRayDrag_',
    value: function handleRayDrag_() {
      if (this.pointerConstraint) {
        var pos = this.rayInput.renderer.reticle.position;
        if (pos) {
          this.setClickMarker(pos.x, pos.y, pos.z, this.scene);
          this.moveJointToPoint(pos.x, pos.y, pos.z);
        }
      }
    }
  }, {
    key: 'handleRayUp_',
    value: function handleRayUp_(opt_mesh) {
      MenuRenderer.setAction_(opt_mesh, false);

      this.constraintDown = false;
      // remove the marker
      this.removeClickMarker();

      this.removeJointConstraint();
    }
  }, {
    key: 'handleRayCancel_',
    value: function handleRayCancel_(opt_mesh) {
      MenuRenderer.setAction_(opt_mesh, false);
    }
  }, {
    key: 'setClickMarker',
    value: function setClickMarker(x, y, z) {
      if (!this.clickMarker) {
        var shape = new THREE.SphereGeometry(0.2, 8, 8);
        this.clickMarker = new THREE.Mesh(shape, this.markerMaterial);
        this.scene.add(this.clickMarker);
      }
      this.clickMarker.visible = true;
      this.clickMarker.position.set(x, y, z);
    }
  }, {
    key: 'removeClickMarker',
    value: function removeClickMarker() {
      this.clickMarker.visible = false;
    }
  }, {
    key: 'addPointerConstraint',
    value: function addPointerConstraint(x, y, z, body) {
      // The cannon body constrained by the pointer joint
      this.constrainedBody = body;

      // Vector to the clicked point, relative to the body
      var v1 = new CANNON.Vec3(x, y, z).vsub(this.constrainedBody.position);

      // Apply anti-quaternion to vector to transform it into the local body coordinate system
      var antiRot = this.constrainedBody.quaternion.inverse();
      var pivot = new CANNON.Quaternion(antiRot.x, antiRot.y, antiRot.z, antiRot.w).vmult(v1); // pivot is not in local body coordinates

      // Move the cannon click marker particle to the click position
      this.jointBody.position.set(x, y, z);

      // Create a new constraint
      // The pivot for the jointBody is zero
      this.pointerConstraint = new CANNON.PointToPointConstraint(this.constrainedBody, pivot, this.jointBody, new CANNON.Vec3(0, 0, 0));

      // Add the constraint to world
      this.world.addConstraint(this.pointerConstraint);
    }

    // This function moves the transparent joint body to a new position in space

  }, {
    key: 'moveJointToPoint',
    value: function moveJointToPoint(x, y, z) {
      // Move the joint body to a new position
      this.jointBody.position.set(x, y, z);
      this.pointerConstraint.update();
    }

    // Calculate rotation from two vectors on the touchpad
    // https://stackoverflow.com/questions/40520129/three-js-rotate-object-using-mouse-and-orbit-control
    // http://jsfiddle.net/x4mby38e/3/

  }, {
    key: 'rotateJoint',
    value: function rotateJoint(axisX, axisZ) {
      if (this.touchPadPosition.x !== 0 || this.touchPadPosition.z !== 0) {
        var deltaMove = { x: axisX - this.touchPadPosition.x, z: axisZ - this.touchPadPosition.z };
        if (this.pointerConstraint) {
          var deltaRotationQuaternion = new CANNON.Quaternion().setFromEuler(MenuRenderer.toRadians(deltaMove.x), 0, MenuRenderer.toRadians(deltaMove.z), 'XYZ');
          this.constrainedBody.quaternion = new CANNON.Quaternion().mult(deltaRotationQuaternion, this.constrainedBody.quaternion);
        }
      }
      this.touchPadPosition.x = axisX;
      this.touchPadPosition.z = axisZ;
    }
  }, {
    key: 'removeJointConstraint',
    value: function removeJointConstraint() {
      // Remove constraint from world
      this.world.removeConstraint(this.pointerConstraint);
      this.pointerConstraint = false;
      this.touchPadPosition = { x: 0, z: 0 };
    }
  }], [{
    key: 'getVRGamepad',
    value: function getVRGamepad() {
      // If there's no gamepad API, there's no gamepad.
      if (!navigator.getGamepads) {
        return null;
      }

      var gamepads = navigator.getGamepads();
      for (var i = 0; i < gamepads.length; ++i) {
        var gamepad = gamepads[i];

        // The array may contain undefined gamepads, so check for that as well as
        // a non-null pose.
        if (gamepad && gamepad.pose) {
          return gamepad;
        }
      }
      return null;
    }
  }, {
    key: 'setSelected_',
    value: function setSelected_(mesh, isSelected) {
      //console.log('setSelected_', isSelected);
      mesh.material.color = isSelected ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
    }
  }, {
    key: 'setAction_',
    value: function setAction_(opt_mesh, isActive) {
      //console.log('setAction_', !!opt_mesh, isActive);
      if (opt_mesh) {
        opt_mesh.material.color = isActive ? ACTIVE_COLOR : HIGHLIGHT_COLOR;
        if (!isActive) {
          opt_mesh.material.wireframe = !opt_mesh.material.wireframe;
        }
      }
    }
  }, {
    key: 'toRadians',
    value: function toRadians(angle) {
      return angle * (Math.PI / 180);
    }
  }]);

  return MenuRenderer;
}();

exports.default = MenuRenderer;

},{"../ray-input":7,"webvr-boilerplate":2}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var HEAD_ELBOW_OFFSET = new THREE.Vector3(0.155, -0.465, -0.15);
var ELBOW_WRIST_OFFSET = new THREE.Vector3(0, 0, -0.25);
var WRIST_CONTROLLER_OFFSET = new THREE.Vector3(0, 0, 0.05);
var ARM_EXTENSION_OFFSET = new THREE.Vector3(-0.08, 0.14, 0.08);

var ELBOW_BEND_RATIO = 0.4; // 40% elbow, 60% wrist.
var EXTENSION_RATIO_WEIGHT = 0.4;

var MIN_ANGULAR_SPEED = 0.61; // 35 degrees per second (in radians).

/**
 * Represents the arm model for the Daydream controller. Feed it a camera and
 * the controller. Update it on a RAF.
 *
 * Get the model's pose using getPose().
 */

var OrientationArmModel = function () {
  function OrientationArmModel() {
    _classCallCheck(this, OrientationArmModel);

    this.isLeftHanded = false;

    // Current and previous controller orientations.
    this.controllerQ = new THREE.Quaternion();
    this.lastControllerQ = new THREE.Quaternion();

    // Current and previous head orientations.
    this.headQ = new THREE.Quaternion();

    // Current head position.
    this.headPos = new THREE.Vector3();

    // Positions of other joints (mostly for debugging).
    this.elbowPos = new THREE.Vector3();
    this.wristPos = new THREE.Vector3();

    // Current and previous times the model was updated.
    this.time = null;
    this.lastTime = null;

    // Root rotation.
    this.rootQ = new THREE.Quaternion();

    // Current pose that this arm model calculates.
    this.pose = {
      orientation: new THREE.Quaternion(),
      position: new THREE.Vector3()
    };
  }

  /**
   * Methods to set controller and head pose (in world coordinates).
   */


  _createClass(OrientationArmModel, [{
    key: 'setControllerOrientation',
    value: function setControllerOrientation(quaternion) {
      this.lastControllerQ.copy(this.controllerQ);
      this.controllerQ.copy(quaternion);
    }
  }, {
    key: 'setHeadOrientation',
    value: function setHeadOrientation(quaternion) {
      this.headQ.copy(quaternion);
    }
  }, {
    key: 'setHeadPosition',
    value: function setHeadPosition(position) {
      this.headPos.copy(position);
    }
  }, {
    key: 'setLeftHanded',
    value: function setLeftHanded(isLeftHanded) {
      // TODO(smus): Implement me!
      this.isLeftHanded = isLeftHanded;
    }

    /**
     * Called on a RAF.
     */

  }, {
    key: 'update',
    value: function update() {
      this.time = performance.now();

      // If the controller's angular velocity is above a certain amount, we can
      // assume torso rotation and move the elbow joint relative to the
      // camera orientation.
      var headYawQ = this.getHeadYawOrientation_();
      var timeDelta = (this.time - this.lastTime) / 1000;
      var angleDelta = this.quatAngle_(this.lastControllerQ, this.controllerQ);
      var controllerAngularSpeed = angleDelta / timeDelta;
      if (controllerAngularSpeed > MIN_ANGULAR_SPEED) {
        // Attenuate the Root rotation slightly.
        this.rootQ.slerp(headYawQ, angleDelta / 10);
      } else {
        this.rootQ.copy(headYawQ);
      }

      // We want to move the elbow up and to the center as the user points the
      // controller upwards, so that they can easily see the controller and its
      // tool tips.
      var controllerEuler = new THREE.Euler().setFromQuaternion(this.controllerQ, 'YXZ');
      var controllerXDeg = THREE.Math.radToDeg(controllerEuler.x);
      var extensionRatio = this.clamp_((controllerXDeg - 11) / (50 - 11), 0, 1);

      // Controller orientation in camera space.
      var controllerCameraQ = this.rootQ.clone().inverse();
      controllerCameraQ.multiply(this.controllerQ);

      // Calculate elbow position.
      var elbowPos = this.elbowPos;
      elbowPos.copy(this.headPos).add(HEAD_ELBOW_OFFSET);
      var elbowOffset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
      elbowOffset.multiplyScalar(extensionRatio);
      elbowPos.add(elbowOffset);

      // Calculate joint angles. Generally 40% of rotation applied to elbow, 60%
      // to wrist, but if controller is raised higher, more rotation comes from
      // the wrist.
      var totalAngle = this.quatAngle_(controllerCameraQ, new THREE.Quaternion());
      var totalAngleDeg = THREE.Math.radToDeg(totalAngle);
      var lerpSuppression = 1 - Math.pow(totalAngleDeg / 180, 4); // TODO(smus): ???

      var elbowRatio = ELBOW_BEND_RATIO;
      var wristRatio = 1 - ELBOW_BEND_RATIO;
      var lerpValue = lerpSuppression * (elbowRatio + wristRatio * extensionRatio * EXTENSION_RATIO_WEIGHT);

      var wristQ = new THREE.Quaternion().slerp(controllerCameraQ, lerpValue);
      var invWristQ = wristQ.inverse();
      var elbowQ = controllerCameraQ.clone().multiply(invWristQ);

      // Calculate our final controller position based on all our joint rotations
      // and lengths.
      /*
      position_ =
        root_rot_ * (
          controller_root_offset_ +
      2:      (arm_extension_ * amt_extension) +
      1:      elbow_rot * (kControllerForearm + (wrist_rot * kControllerPosition))
        );
      */
      var wristPos = this.wristPos;
      wristPos.copy(WRIST_CONTROLLER_OFFSET);
      wristPos.applyQuaternion(wristQ);
      wristPos.add(ELBOW_WRIST_OFFSET);
      wristPos.applyQuaternion(elbowQ);
      wristPos.add(this.elbowPos);

      var offset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
      offset.multiplyScalar(extensionRatio);

      var position = new THREE.Vector3().copy(this.wristPos);
      position.add(offset);
      position.applyQuaternion(this.rootQ);

      var orientation = new THREE.Quaternion().copy(this.controllerQ);

      // Set the resulting pose orientation and position.
      this.pose.orientation.copy(orientation);
      this.pose.position.copy(position);

      this.lastTime = this.time;
    }

    /**
     * Returns the pose calculated by the model.
     */

  }, {
    key: 'getPose',
    value: function getPose() {
      return this.pose;
    }

    /**
     * Debug methods for rendering the arm model.
     */

  }, {
    key: 'getForearmLength',
    value: function getForearmLength() {
      return ELBOW_WRIST_OFFSET.length();
    }
  }, {
    key: 'getElbowPosition',
    value: function getElbowPosition() {
      var out = this.elbowPos.clone();
      return out.applyQuaternion(this.rootQ);
    }
  }, {
    key: 'getWristPosition',
    value: function getWristPosition() {
      var out = this.wristPos.clone();
      return out.applyQuaternion(this.rootQ);
    }
  }, {
    key: 'getHeadYawOrientation_',
    value: function getHeadYawOrientation_() {
      var headEuler = new THREE.Euler().setFromQuaternion(this.headQ, 'YXZ');
      headEuler.x = 0;
      headEuler.z = 0;
      var destinationQ = new THREE.Quaternion().setFromEuler(headEuler);
      return destinationQ;
    }
  }, {
    key: 'clamp_',
    value: function clamp_(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }
  }, {
    key: 'quatAngle_',
    value: function quatAngle_(q1, q2) {
      var vec1 = new THREE.Vector3(0, 0, -1);
      var vec2 = new THREE.Vector3(0, 0, -1);
      vec1.applyQuaternion(q1);
      vec2.applyQuaternion(q2);
      return vec1.angleTo(vec2);
    }
  }]);

  return OrientationArmModel;
}();

exports.default = OrientationArmModel;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _rayInteractionModes = require('./ray-interaction-modes');

var _rayInteractionModes2 = _interopRequireDefault(_rayInteractionModes);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var DRAG_DISTANCE_PX = 10;

/**
 * Enumerates all possible interaction modes. Sets up all event handlers (mouse,
 * touch, etc), interfaces with gamepad API.
 *
 * Emits events:
 *    action: Input is activated (mousedown, touchstart, daydream click, vive trigger).
 *    release: Input is deactivated (mouseup, touchend, daydream release, vive release).
 *    cancel: Input is canceled (eg. we scrolled instead of tapping on mobile/desktop).
 *    pointermove(2D position): The pointer is moved (mouse or touch).
 */

var RayController = function (_EventEmitter) {
  _inherits(RayController, _EventEmitter);

  function RayController(opt_el) {
    _classCallCheck(this, RayController);

    var _this = _possibleConstructorReturn(this, (RayController.__proto__ || Object.getPrototypeOf(RayController)).call(this));

    var el = opt_el || window;

    // Handle interactions.
    el.addEventListener('mousedown', _this.onMouseDown_.bind(_this));
    el.addEventListener('mousemove', _this.onMouseMove_.bind(_this));
    el.addEventListener('mouseup', _this.onMouseUp_.bind(_this));
    el.addEventListener('touchstart', _this.onTouchStart_.bind(_this));
    el.addEventListener('touchmove', _this.onTouchMove_.bind(_this));
    el.addEventListener('touchend', _this.onTouchEnd_.bind(_this));

    // The position of the pointer.
    _this.pointer = new THREE.Vector2();
    // The previous position of the pointer.
    _this.lastPointer = new THREE.Vector2();
    // Position of pointer in Normalized Device Coordinates (NDC).
    _this.pointerNdc = new THREE.Vector2();
    // How much we have dragged (if we are dragging).
    _this.dragDistance = 0;
    // Are we dragging or not.
    _this.isDragging = false;
    // Is pointer active or not.
    _this.isTouchActive = false;
    // Is this a synthetic mouse event?
    _this.isSyntheticMouseEvent = false;

    // Gamepad events.
    _this.gamepad = null;

    // VR Events.
    if (!navigator.getVRDisplays) {
      console.warn('WebVR API not available! Consider using the webvr-polyfill.');
    } else {
      navigator.getVRDisplays().then(function (displays) {
        _this.vrDisplay = displays[0];
      });
    }
    return _this;
  }

  _createClass(RayController, [{
    key: 'getInteractionMode',
    value: function getInteractionMode() {
      // TODO: Debugging only.
      //return InteractionModes.DAYDREAM;

      var gamepad = this.getVRGamepad_();

      if (gamepad) {
        var pose = gamepad.pose;
        // If there's a gamepad connected, determine if it's Daydream or a Vive.
        if (pose.hasPosition) {
          return _rayInteractionModes2.default.VR_6DOF;
        }

        if (pose.hasOrientation) {
          return _rayInteractionModes2.default.VR_3DOF;
        }
      } else {
        // If there's no gamepad, it might be Cardboard, magic window or desktop.
        if ((0, _util.isMobile)()) {
          // Either Cardboard or magic window, depending on whether we are
          // presenting.
          if (this.vrDisplay && this.vrDisplay.isPresenting) {
            return _rayInteractionModes2.default.VR_0DOF;
          } else {
            return _rayInteractionModes2.default.TOUCH;
          }
        } else {
          // We must be on desktop.
          return _rayInteractionModes2.default.MOUSE;
        }
      }
      // By default, use TOUCH.
      return _rayInteractionModes2.default.TOUCH;
    }
  }, {
    key: 'getGamepadPose',
    value: function getGamepadPose() {
      var gamepad = this.getVRGamepad_();
      return gamepad.pose;
    }

    /**
     * Get if there is an active touch event going on.
     * Only relevant on touch devices
     */

  }, {
    key: 'getIsTouchActive',
    value: function getIsTouchActive() {
      return this.isTouchActive;
    }

    /**
     * Checks if this click is the cardboard-compatible fallback
     * click on Daydream controllers so that we can deduplicate it.
     * TODO(klausw): It would be nice to be able to move interactions
     * to this event since it counts as a user action while controller
     * clicks don't. But that would require larger refactoring.
     */

  }, {
    key: 'isCardboardCompatClick',
    value: function isCardboardCompatClick(e) {
      var mode = this.getInteractionMode();
      if (mode == _rayInteractionModes2.default.VR_3DOF && e.screenX == 0 && e.screenY == 0) {
        return true;
      }
      return false;
    }
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.size = size;
    }
  }, {
    key: 'update',
    value: function update() {
      var mode = this.getInteractionMode();
      if (mode == _rayInteractionModes2.default.VR_3DOF || mode == _rayInteractionModes2.default.VR_6DOF) {
        // If we're dealing with a gamepad, check every animation frame for a
        // pressed action.
        var isGamepadPressed = this.getGamepadButtonPressed_();
        if (isGamepadPressed && !this.wasGamepadPressed) {
          this.isDragging = true;
          this.emit('raydown');
        }
        if (!isGamepadPressed && this.wasGamepadPressed) {
          this.isDragging = false;
          this.emit('rayup');
        }
        this.wasGamepadPressed = isGamepadPressed;

        if (this.isDragging) {
          this.emit('raydrag');
        }
      }
    }
  }, {
    key: 'getGamepadButtonPressed_',
    value: function getGamepadButtonPressed_() {
      var gamepad = this.getVRGamepad_();
      if (!gamepad) {
        // If there's no gamepad, the button was not pressed.
        return false;
      }
      // Check for clicks.
      for (var j = 0; j < gamepad.buttons.length; ++j) {
        if (gamepad.buttons[j].pressed) {
          return true;
        }
      }
      return false;
    }
  }, {
    key: 'onMouseDown_',
    value: function onMouseDown_(e) {
      if (this.isSyntheticMouseEvent) return;
      if (this.isCardboardCompatClick(e)) return;

      this.startDragging_(e);
      this.emit('raydown');
    }
  }, {
    key: 'onMouseMove_',
    value: function onMouseMove_(e) {
      if (this.isSyntheticMouseEvent) return;

      this.updatePointer_(e);
      this.updateDragDistance_();
      this.emit('pointermove', this.pointerNdc);
    }
  }, {
    key: 'onMouseUp_',
    value: function onMouseUp_(e) {
      var isSynthetic = this.isSyntheticMouseEvent;
      this.isSyntheticMouseEvent = false;
      if (isSynthetic) return;
      if (this.isCardboardCompatClick(e)) return;

      this.endDragging_();
    }
  }, {
    key: 'onTouchStart_',
    value: function onTouchStart_(e) {
      this.isTouchActive = true;
      var t = e.touches[0];
      this.startDragging_(t);
      this.updateTouchPointer_(e);

      this.emit('pointermove', this.pointerNdc);
      this.emit('raydown');
    }
  }, {
    key: 'onTouchMove_',
    value: function onTouchMove_(e) {
      this.updateTouchPointer_(e);
      this.updateDragDistance_();
    }
  }, {
    key: 'onTouchEnd_',
    value: function onTouchEnd_(e) {
      this.endDragging_();

      // Suppress duplicate events from synthetic mouse events.
      this.isSyntheticMouseEvent = true;
      this.isTouchActive = false;
    }
  }, {
    key: 'updateTouchPointer_',
    value: function updateTouchPointer_(e) {
      // If there's no touches array, ignore.
      if (e.touches.length === 0) {
        console.warn('Received touch event with no touches.');
        return;
      }
      var t = e.touches[0];
      this.updatePointer_(t);
    }
  }, {
    key: 'updatePointer_',
    value: function updatePointer_(e) {
      // How much the pointer moved.
      this.pointer.set(e.clientX, e.clientY);
      this.pointerNdc.x = e.clientX / this.size.width * 2 - 1;
      this.pointerNdc.y = -(e.clientY / this.size.height) * 2 + 1;
    }
  }, {
    key: 'updateDragDistance_',
    value: function updateDragDistance_() {
      if (this.isDragging) {
        var distance = this.lastPointer.sub(this.pointer).length();
        this.dragDistance += distance;
        this.lastPointer.copy(this.pointer);

        //console.log('dragDistance', this.dragDistance);
        if (this.dragDistance > DRAG_DISTANCE_PX) {
          this.emit('raycancel');
          this.isDragging = false;
        }
      }
    }
  }, {
    key: 'startDragging_',
    value: function startDragging_(e) {
      this.isDragging = true;
      this.lastPointer.set(e.clientX, e.clientY);
    }
  }, {
    key: 'endDragging_',
    value: function endDragging_() {
      if (this.dragDistance < DRAG_DISTANCE_PX) {
        this.emit('rayup');
      }
      this.dragDistance = 0;
      this.isDragging = false;
    }

    /**
     * Gets the first VR-enabled gamepad.
     */

  }, {
    key: 'getVRGamepad_',
    value: function getVRGamepad_() {
      // If there's no gamepad API, there's no gamepad.
      if (!navigator.getGamepads) {
        return null;
      }

      var gamepads = navigator.getGamepads();
      for (var i = 0; i < gamepads.length; ++i) {
        var gamepad = gamepads[i];

        // The array may contain undefined gamepads, so check for that as well as
        // a non-null pose.
        if (gamepad && gamepad.pose) {
          return gamepad;
        }
      }
      return null;
    }
  }]);

  return RayController;
}(_eventemitter2.default);

exports.default = RayController;

},{"./ray-interaction-modes":8,"./util":10,"eventemitter3":1}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _orientationArmModel = require('./orientation-arm-model');

var _orientationArmModel2 = _interopRequireDefault(_orientationArmModel);

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _rayRenderer = require('./ray-renderer');

var _rayRenderer2 = _interopRequireDefault(_rayRenderer);

var _rayController = require('./ray-controller');

var _rayController2 = _interopRequireDefault(_rayController);

var _rayInteractionModes = require('./ray-interaction-modes');

var _rayInteractionModes2 = _interopRequireDefault(_rayInteractionModes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

/**
 * API wrapper for the input library.
 */
var RayInput = function (_EventEmitter) {
  _inherits(RayInput, _EventEmitter);

  function RayInput(camera, opt_el) {
    _classCallCheck(this, RayInput);

    var _this = _possibleConstructorReturn(this, (RayInput.__proto__ || Object.getPrototypeOf(RayInput)).call(this));

    _this.camera = camera;
    _this.renderer = new _rayRenderer2.default(camera);
    _this.controller = new _rayController2.default(opt_el);

    // Arm model needed to transform controller orientation into proper pose.
    _this.armModel = new _orientationArmModel2.default();

    _this.controller.on('raydown', _this.onRayDown_.bind(_this));
    _this.controller.on('rayup', _this.onRayUp_.bind(_this));
    _this.controller.on('raycancel', _this.onRayCancel_.bind(_this));
    _this.controller.on('pointermove', _this.onPointerMove_.bind(_this));
    _this.controller.on('raydrag', _this.onRayDrag_.bind(_this));
    _this.renderer.on('rayover', function (mesh) {
      _this.emit('rayover', mesh);
    });
    _this.renderer.on('rayout', function (mesh) {
      _this.emit('rayout', mesh);
    });

    // By default, put the pointer offscreen.
    _this.pointerNdc = new THREE.Vector2(1, 1);

    // Event handlers.
    _this.handlers = {};
    return _this;
  }

  _createClass(RayInput, [{
    key: 'add',
    value: function add(object, handlers) {
      this.renderer.add(object, handlers);
      this.handlers[object.id] = handlers;
    }
  }, {
    key: 'remove',
    value: function remove(object) {
      this.renderer.remove(object);
      delete this.handlers[object.id];
    }
  }, {
    key: 'update',
    value: function update() {
      var lookAt = new THREE.Vector3(0, 0, -1);
      lookAt.applyQuaternion(this.camera.quaternion);

      var mode = this.controller.getInteractionMode();
      switch (mode) {
        case _rayInteractionModes2.default.MOUSE:
          // Desktop mouse mode, mouse coordinates are what matters.
          this.renderer.setPointer(this.pointerNdc);
          // Hide the ray and reticle.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(false);

          // In mouse mode ray renderer is always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.TOUCH:
          // Mobile magic window mode. Touch coordinates matter, but we want to
          // hide the reticle.
          this.renderer.setPointer(this.pointerNdc);

          // Hide the ray and the reticle.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(false);

          // In touch mode the ray renderer is only active on touch.
          this.renderer.setActive(this.controller.getIsTouchActive());
          break;

        case _rayInteractionModes2.default.VR_0DOF:
          // Cardboard mode, we're dealing with a gaze reticle.
          this.renderer.setPosition(this.camera.position);
          this.renderer.setOrientation(this.camera.quaternion);

          // Reticle only.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.VR_3DOF:
          // Daydream, our origin is slightly off (depending on handedness).
          // But we should be using the orientation from the gamepad.
          // TODO(smus): Implement the real arm model.
          var pose = this.controller.getGamepadPose();

          // Debug only: use camera as input controller.
          //let controllerOrientation = this.camera.quaternion;
          var controllerOrientation = new THREE.Quaternion().fromArray(pose.orientation);

          // Transform the controller into the camera coordinate system.
          /*
          controllerOrientation.multiply(
              new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
          controllerOrientation.x *= -1;
          controllerOrientation.z *= -1;
          */

          // Feed camera and controller into the arm model.
          this.armModel.setHeadOrientation(this.camera.quaternion);
          this.armModel.setHeadPosition(this.camera.position);
          this.armModel.setControllerOrientation(controllerOrientation);
          this.armModel.update();

          // Get resulting pose and configure the renderer.
          var modelPose = this.armModel.getPose();
          this.renderer.setPosition(modelPose.position);
          //this.renderer.setPosition(new THREE.Vector3());
          this.renderer.setOrientation(modelPose.orientation);
          //this.renderer.setOrientation(controllerOrientation);

          // Show ray and reticle.
          this.renderer.setRayVisibility(true);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.VR_6DOF:
          // Vive, origin depends on the position of the controller.
          // TODO(smus)...
          var pose = this.controller.getGamepadPose();

          // Check that the pose is valid.
          if (!pose.orientation || !pose.position) {
            console.warn('Invalid gamepad pose. Can\'t update ray.');
            break;
          }
          var orientation = new THREE.Quaternion().fromArray(pose.orientation);
          var position = new THREE.Vector3().fromArray(pose.position);

          this.renderer.setOrientation(orientation);
          this.renderer.setPosition(position);

          // Show ray and reticle.
          this.renderer.setRayVisibility(true);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        default:
          console.error('Unknown interaction mode.');
      }
      this.renderer.update();
      this.controller.update();
    }
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.controller.setSize(size);
    }
  }, {
    key: 'getMesh',
    value: function getMesh() {
      return this.renderer.getReticleRayMesh();
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.renderer.getOrigin();
    }
  }, {
    key: 'getDirection',
    value: function getDirection() {
      return this.renderer.getDirection();
    }
  }, {
    key: 'getRightDirection',
    value: function getRightDirection() {
      var lookAt = new THREE.Vector3(0, 0, -1);
      lookAt.applyQuaternion(this.camera.quaternion);
      return new THREE.Vector3().crossVectors(lookAt, this.camera.up);
    }
  }, {
    key: 'onRayDown_',
    value: function onRayDown_(e) {
      //console.log('onRayDown_');

      // Force the renderer to raycast.
      this.renderer.update();
      var mesh = this.renderer.getSelectedMesh();
      this.emit('raydown', mesh);

      this.renderer.setActive(true);
    }
  }, {
    key: 'onRayDrag_',
    value: function onRayDrag_() {
      this.renderer.setDragging(true);
      this.emit('raydrag');
    }
  }, {
    key: 'onRayUp_',
    value: function onRayUp_(e) {
      //console.log('onRayUp_');
      this.renderer.setDragging(false);
      var mesh = this.renderer.getSelectedMesh();
      this.emit('rayup', mesh);

      this.renderer.setActive(false);
    }
  }, {
    key: 'onRayCancel_',
    value: function onRayCancel_(e) {
      //console.log('onRayCancel_');
      this.renderer.setDragging(false);
      var mesh = this.renderer.getSelectedMesh();
      this.emit('raycancel', mesh);
    }
  }, {
    key: 'onPointerMove_',
    value: function onPointerMove_(ndc) {
      this.pointerNdc.copy(ndc);
    }
  }]);

  return RayInput;
}(_eventemitter2.default);

exports.default = RayInput;

},{"./orientation-arm-model":5,"./ray-controller":6,"./ray-interaction-modes":8,"./ray-renderer":9,"eventemitter3":1}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var InteractionModes = {
  MOUSE: 1,
  TOUCH: 2,
  VR_0DOF: 3,
  VR_3DOF: 4,
  VR_6DOF: 5
};

exports.default = InteractionModes;

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require('./util');

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var RETICLE_DISTANCE = 3;
var INNER_RADIUS = 0.02;
var OUTER_RADIUS = 0.04;
var RAY_RADIUS = 0.02;
var GRADIENT_IMAGE = (0, _util.base64)('image/png', 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABdklEQVR4nO3WwXHEQAwDQcin/FOWw+BjuiPYB2q4G2nP933P9SO4824zgDADiDOAuHfb3/UjuKMAcQYQZwBx/gBxChCnAHEKEKcAcQoQpwBxChCnAHEGEGcAcf4AcQoQZwBxBhBnAHEGEGcAcQYQZwBxBhBnAHEGEGcAcQYQZwBxBhBnAHHvtt/1I7ijAHEGEGcAcf4AcQoQZwBxTkCcAsQZQJwTEKcAcQoQpwBxBhDnBMQpQJwCxClAnALEKUCcAsQpQJwCxClAnALEKUCcAsQpQJwBxDkBcQoQpwBxChCnAHEKEKcAcQoQpwBxChCnAHEKEGcAcU5AnALEKUCcAsQZQJwTEKcAcQYQ5wTEKUCcAcQZQJw/QJwCxBlAnAHEGUCcAcQZQJwBxBlAnAHEGUCcAcQZQJwBxBlAnAHEGUDcu+25fgR3FCDOAOIMIM4fIE4B4hQgTgHiFCBOAeIUIE4B4hQgzgDiDCDOHyBOAeIMIM4A4v4B/5IF9eD6QxgAAAAASUVORK5CYII=');

/**
 * Handles ray input selection from frame of reference of an arbitrary object.
 *
 * The source of the ray is from various locations:
 *
 * Desktop: mouse.
 * Magic window: touch.
 * Cardboard: camera.
 * Daydream: 3DOF controller via gamepad (and show ray).
 * Vive: 6DOF controller via gamepad (and show ray).
 *
 * Emits selection events:
 *     rayover(mesh): This mesh was selected.
 *     rayout(mesh): This mesh was unselected.
 */

var RayRenderer = function (_EventEmitter) {
  _inherits(RayRenderer, _EventEmitter);

  function RayRenderer(camera, opt_params) {
    _classCallCheck(this, RayRenderer);

    var _this = _possibleConstructorReturn(this, (RayRenderer.__proto__ || Object.getPrototypeOf(RayRenderer)).call(this));

    _this.camera = camera;

    var params = opt_params || {};

    // Which objects are interactive (keyed on id).
    _this.meshes = {};

    // Which objects are currently selected (keyed on id).
    _this.selected = {};

    // The raycaster.
    _this.raycaster = new THREE.Raycaster();

    // Position and orientation, in addition.
    _this.position = new THREE.Vector3();
    _this.orientation = new THREE.Quaternion();

    _this.root = new THREE.Object3D();

    // Add the reticle mesh to the root of the object.
    _this.reticle = _this.createReticle_();
    _this.root.add(_this.reticle);

    // Add the ray to the root of the object.
    _this.ray = _this.createRay_();
    _this.root.add(_this.ray);

    // How far the reticle is currently from the reticle origin.
    _this.reticleDistance = RETICLE_DISTANCE;
    return _this;
  }

  /**
   * Register an object so that it can be interacted with.
   */


  _createClass(RayRenderer, [{
    key: 'add',
    value: function add(object) {
      this.meshes[object.id] = object;
    }

    /**
     * Prevent an object from being interacted with.
     */

  }, {
    key: 'remove',
    value: function remove(object) {
      var id = object.id;
      if (this.meshes[id]) {
        // If there's no existing mesh, we can't remove it.
        delete this.meshes[id];
      }
      // If the object is currently selected, remove it.
      if (this.selected[id]) {
        delete this.selected[object.id];
      }
    }
  }, {
    key: 'update',
    value: function update() {
      // Do the raycasting and issue various events as needed.
      for (var id in this.meshes) {
        var mesh = this.meshes[id];
        var intersects = this.raycaster.intersectObject(mesh, true);
        if (intersects.length > 1) {
          console.warn('Unexpected: multiple meshes intersected.');
        }
        var isIntersected = intersects.length > 0;
        var isSelected = this.selected[id];

        // If it's newly selected, send rayover.
        if (isIntersected && !isSelected) {
          this.selected[id] = true;
          if (this.isActive) {
            this.emit('rayover', mesh);
          }
        }

        // If it's no longer intersected, send rayout.
        if (!isIntersected && isSelected && !this.isDragging) {
          delete this.selected[id];
          this.moveReticle_(null);
          if (this.isActive) {
            this.emit('rayout', mesh);
          }
        }

        if (isIntersected) {
          this.moveReticle_(intersects);
        }
      }
    }

    /**
     * Sets the origin of the ray.
     * @param {Vector} vector Position of the origin of the picking ray.
     */

  }, {
    key: 'setPosition',
    value: function setPosition(vector) {
      this.position.copy(vector);
      this.raycaster.ray.origin.copy(vector);
      this.updateRaycaster_();
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.raycaster.ray.origin;
    }

    /**
     * Sets the direction of the ray.
     * @param {Vector} vector Unit vector corresponding to direction.
     */

  }, {
    key: 'setOrientation',
    value: function setOrientation(quaternion) {
      this.orientation.copy(quaternion);

      var pointAt = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
      this.raycaster.ray.direction.copy(pointAt);
      this.updateRaycaster_();
    }
  }, {
    key: 'getDirection',
    value: function getDirection() {
      return this.raycaster.ray.direction;
    }

    /**
     * Sets the pointer on the screen for camera + pointer based picking. This
     * superscedes origin and direction.
     *
     * @param {Vector2} vector The position of the pointer (screen coords).
     */

  }, {
    key: 'setPointer',
    value: function setPointer(vector) {
      this.raycaster.setFromCamera(vector, this.camera);
      this.updateRaycaster_();
    }

    /**
     * Gets the mesh, which includes reticle and/or ray. This mesh is then added
     * to the scene.
     */

  }, {
    key: 'getReticleRayMesh',
    value: function getReticleRayMesh() {
      return this.root;
    }

    /**
     * Gets the currently selected object in the scene.
     */

  }, {
    key: 'getSelectedMesh',
    value: function getSelectedMesh() {
      var count = 0;
      var mesh = null;
      for (var id in this.selected) {
        count += 1;
        mesh = this.meshes[id];
      }
      if (count > 1) {
        console.warn('More than one mesh selected.');
      }
      return mesh;
    }

    /**
     * Hides and shows the reticle.
     */

  }, {
    key: 'setReticleVisibility',
    value: function setReticleVisibility(isVisible) {
      this.reticle.visible = isVisible;
    }

    /**
     * Enables or disables the raycasting ray which gradually fades out from
     * the origin.
     */

  }, {
    key: 'setRayVisibility',
    value: function setRayVisibility(isVisible) {
      this.ray.visible = isVisible;
    }

    /**
     * Enables and disables the raycaster. For touch, where finger up means we
     * shouldn't be raycasting.
     */

  }, {
    key: 'setActive',
    value: function setActive(isActive) {
      // If nothing changed, do nothing.
      if (this.isActive == isActive) {
        return;
      }
      // TODO(smus): Show the ray or reticle adjust in response.
      this.isActive = isActive;

      if (!isActive) {
        this.moveReticle_(null);
        for (var id in this.selected) {
          var mesh = this.meshes[id];
          delete this.selected[id];
          this.emit('rayout', mesh);
        }
      }
    }
  }, {
    key: 'setDragging',
    value: function setDragging(isDragging) {
      this.isDragging = isDragging;
    }
  }, {
    key: 'updateRaycaster_',
    value: function updateRaycaster_() {
      var ray = this.raycaster.ray;

      // Position the reticle at a distance, as calculated from the origin and
      // direction.
      var position = this.reticle.position;
      position.copy(ray.direction);
      position.multiplyScalar(this.reticleDistance);
      position.add(ray.origin);

      // Set position and orientation of the ray so that it goes from origin to
      // reticle.
      var delta = new THREE.Vector3().copy(ray.direction);
      delta.multiplyScalar(this.reticleDistance);
      this.ray.scale.y = delta.length();
      var arrow = new THREE.ArrowHelper(ray.direction, ray.origin);
      this.ray.rotation.copy(arrow.rotation);
      this.ray.position.addVectors(ray.origin, delta.multiplyScalar(0.5));
    }

    /**
     * Creates the geometry of the reticle.
     */

  }, {
    key: 'createReticle_',
    value: function createReticle_() {
      // Create a spherical reticle.
      var innerGeometry = new THREE.SphereGeometry(INNER_RADIUS, 32, 32);
      var innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      var inner = new THREE.Mesh(innerGeometry, innerMaterial);

      var outerGeometry = new THREE.SphereGeometry(OUTER_RADIUS, 32, 32);
      var outerMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.3
      });
      var outer = new THREE.Mesh(outerGeometry, outerMaterial);

      var reticle = new THREE.Group();
      reticle.add(inner);
      reticle.add(outer);
      return reticle;
    }

    /**
     * Moves the reticle to a position so that it's just in front of the mesh that
     * it intersected with.
     */

  }, {
    key: 'moveReticle_',
    value: function moveReticle_(intersections) {
      // If no intersection, return the reticle to the default position.
      var distance = RETICLE_DISTANCE;
      if (intersections) {
        // Otherwise, determine the correct distance.
        var inter = intersections[0];
        distance = inter.distance;
      }

      this.reticleDistance = distance;
      this.updateRaycaster_();
      return;
    }
  }, {
    key: 'createRay_',
    value: function createRay_() {
      // Create a cylindrical ray.
      var geometry = new THREE.CylinderGeometry(RAY_RADIUS, RAY_RADIUS, 1, 32);
      var material = new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture(GRADIENT_IMAGE),
        //color: 0xffffff,
        transparent: true,
        opacity: 0.3
      });
      var mesh = new THREE.Mesh(geometry, material);

      return mesh;
    }
  }]);

  return RayRenderer;
}(_eventemitter2.default);

exports.default = RayRenderer;

},{"./util":10,"eventemitter3":1}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isMobile = isMobile;
exports.base64 = base64;
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function isMobile() {
  var check = false;
  (function (a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

function base64(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
}

},{}]},{},[3,4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4xMC4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLWJvaWxlcnBsYXRlL2J1aWxkL3dlYnZyLW1hbmFnZXIuanMiLCJzcmMvZXhhbXBsZS9tYWluLmpzIiwic3JjL2V4YW1wbGUvcmVuZGVyZXIuanMiLCJzcmMvb3JpZW50YXRpb24tYXJtLW1vZGVsLmpzIiwic3JjL3JheS1jb250cm9sbGVyLmpzIiwic3JjL3JheS1pbnB1dC5qcyIsInNyYy9yYXktaW50ZXJhY3Rpb24tbW9kZXMuanMiLCJzcmMvcmF5LXJlbmRlcmVyLmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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Ozs7O2tCQWxSa0IsVzs7Ozs7Ozs7UUN4QkwsUSxHQUFBLFE7UUFNQSxNLEdBQUEsTTtBQXJCaEI7Ozs7Ozs7Ozs7Ozs7OztBQWVPLFNBQVMsUUFBVCxHQUFvQjtBQUN6QixNQUFJLFFBQVEsS0FBWjtBQUNBLEdBQUMsVUFBUyxDQUFULEVBQVc7QUFBQyxRQUFHLDJUQUEyVCxJQUEzVCxDQUFnVSxDQUFoVSxLQUFvVSwwa0RBQTBrRCxJQUExa0QsQ0FBK2tELEVBQUUsTUFBRixDQUFTLENBQVQsRUFBVyxDQUFYLENBQS9rRCxDQUF2VSxFQUFxNkQsUUFBUSxJQUFSO0FBQWEsR0FBLzdELEVBQWk4RCxVQUFVLFNBQVYsSUFBcUIsVUFBVSxNQUEvQixJQUF1QyxPQUFPLEtBQS8rRDtBQUNBLFNBQU8sS0FBUDtBQUNEOztBQUVNLFNBQVMsTUFBVCxDQUFnQixRQUFoQixFQUEwQixNQUExQixFQUFrQztBQUN2QyxTQUFPLFVBQVUsUUFBVixHQUFxQixVQUFyQixHQUFrQyxNQUF6QztBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vXG4vLyBXZSBzdG9yZSBvdXIgRUUgb2JqZWN0cyBpbiBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBgfmAgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Qgb3ZlcnJpZGRlbiBvclxuLy8gdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy8gV2UgYWxzbyBhc3N1bWUgdGhhdCBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgYXZhaWxhYmxlIHdoZW4gdGhlIGV2ZW50IG5hbWVcbi8vIGlzIGFuIEVTNiBTeW1ib2wuXG4vL1xudmFyIHByZWZpeCA9IHR5cGVvZiBPYmplY3QuY3JlYXRlICE9PSAnZnVuY3Rpb24nID8gJ34nIDogZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgRXZlbnRFbWl0dGVyIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEV2ZW50IGhhbmRsZXIgdG8gYmUgY2FsbGVkLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBDb250ZXh0IGZvciBmdW5jdGlvbiBleGVjdXRpb24uXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBPbmx5IGVtaXQgb25jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogRXZlbnRFbWl0dGVyIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHsgLyogTm90aGluZyB0byBzZXQgKi8gfVxuXG4vKipcbiAqIEhvbGQgdGhlIGFzc2lnbmVkIEV2ZW50RW1pdHRlcnMgYnkgbmFtZS5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1xuICAgICwgbmFtZXMgPSBbXVxuICAgICwgbmFtZTtcblxuICBpZiAoIWV2ZW50cykgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiBldmVudHMpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGEgbGlzdCBvZiBhc3NpZ25lZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudHMgdGhhdCBzaG91bGQgYmUgbGlzdGVkLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgV2Ugb25seSBuZWVkIHRvIGtub3cgaWYgdGhlcmUgYXJlIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtBcnJheXxCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQsIGV4aXN0cykge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgYXZhaWxhYmxlID0gdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogRW1pdCBhbiBldmVudCB0byBhbGwgcmVnaXN0ZXJlZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBJbmRpY2F0aW9uIGlmIHdlJ3ZlIGVtaXR0ZWQgYW4gZXZlbnQuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgbGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgbmV3IEV2ZW50TGlzdGVuZXIgZm9yIHRoZSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhbiBFdmVudExpc3RlbmVyIHRoYXQncyBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3ZSB3YW50IHRvIHJlbW92ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciB0aGF0IHdlIG5lZWQgdG8gZmluZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgT25seSByZW1vdmUgbGlzdGVuZXJzIG1hdGNoaW5nIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmNlIGxpc3RlbmVycy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGV2ZW50cyA9IFtdO1xuXG4gIGlmIChmbikge1xuICAgIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVycy5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVycyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm5cbiAgICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICAgICkge1xuICAgICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gIC8vXG4gIGlmIChldmVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICB9IGVsc2Uge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBvciBvbmx5IHRoZSBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3YW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcblxuICBpZiAoZXZlbnQpIGRlbGV0ZSB0aGlzLl9ldmVudHNbcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudF07XG4gIGVsc2UgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiKGZ1bmN0aW9uKGYpe2lmKHR5cGVvZiBleHBvcnRzPT09XCJvYmplY3RcIiYmdHlwZW9mIG1vZHVsZSE9PVwidW5kZWZpbmVkXCIpe21vZHVsZS5leHBvcnRzPWYoKX1lbHNlIGlmKHR5cGVvZiBkZWZpbmU9PT1cImZ1bmN0aW9uXCImJmRlZmluZS5hbWQpe2RlZmluZShbXSxmKX1lbHNle3ZhciBnO2lmKHR5cGVvZiB3aW5kb3chPT1cInVuZGVmaW5lZFwiKXtnPXdpbmRvd31lbHNlIGlmKHR5cGVvZiBnbG9iYWwhPT1cInVuZGVmaW5lZFwiKXtnPWdsb2JhbH1lbHNlIGlmKHR5cGVvZiBzZWxmIT09XCJ1bmRlZmluZWRcIil7Zz1zZWxmfWVsc2V7Zz10aGlzfWcuV2ViVlJNYW5hZ2VyID0gZigpfX0pKGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEVtaXR0ZXIgPSBfZGVyZXFfKCcuL2VtaXR0ZXIuanMnKTtcbnZhciBNb2RlcyA9IF9kZXJlcV8oJy4vbW9kZXMuanMnKTtcbnZhciBVdGlsID0gX2RlcmVxXygnLi91dGlsLmpzJyk7XG5cbi8qKlxuICogRXZlcnl0aGluZyBoYXZpbmcgdG8gZG8gd2l0aCB0aGUgV2ViVlIgYnV0dG9uLlxuICogRW1pdHMgYSAnY2xpY2snIGV2ZW50IHdoZW4gaXQncyBjbGlja2VkLlxuICovXG5mdW5jdGlvbiBCdXR0b25NYW5hZ2VyKG9wdF9yb290KSB7XG4gIHZhciByb290ID0gb3B0X3Jvb3QgfHwgZG9jdW1lbnQuYm9keTtcbiAgdGhpcy5sb2FkSWNvbnNfKCk7XG5cbiAgLy8gTWFrZSB0aGUgZnVsbHNjcmVlbiBidXR0b24uXG4gIHZhciBmc0J1dHRvbiA9IHRoaXMuY3JlYXRlQnV0dG9uKCk7XG4gIGZzQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuZnVsbHNjcmVlbjtcbiAgZnNCdXR0b24udGl0bGUgPSAnRnVsbHNjcmVlbiBtb2RlJztcbiAgdmFyIHMgPSBmc0J1dHRvbi5zdHlsZTtcbiAgcy5ib3R0b20gPSAwO1xuICBzLnJpZ2h0ID0gMDtcbiAgZnNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNyZWF0ZUNsaWNrSGFuZGxlcl8oJ2ZzJykpO1xuICByb290LmFwcGVuZENoaWxkKGZzQnV0dG9uKTtcbiAgdGhpcy5mc0J1dHRvbiA9IGZzQnV0dG9uO1xuXG4gIC8vIE1ha2UgdGhlIFZSIGJ1dHRvbi5cbiAgdmFyIHZyQnV0dG9uID0gdGhpcy5jcmVhdGVCdXR0b24oKTtcbiAgdnJCdXR0b24uc3JjID0gdGhpcy5JQ09OUy5jYXJkYm9hcmQ7XG4gIHZyQnV0dG9uLnRpdGxlID0gJ1ZpcnR1YWwgcmVhbGl0eSBtb2RlJztcbiAgdmFyIHMgPSB2ckJ1dHRvbi5zdHlsZTtcbiAgcy5ib3R0b20gPSAwO1xuICBzLnJpZ2h0ID0gJzQ4cHgnO1xuICB2ckJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuY3JlYXRlQ2xpY2tIYW5kbGVyXygndnInKSk7XG4gIHJvb3QuYXBwZW5kQ2hpbGQodnJCdXR0b24pO1xuICB0aGlzLnZyQnV0dG9uID0gdnJCdXR0b247XG5cbiAgdGhpcy5pc1Zpc2libGUgPSB0cnVlO1xuXG59XG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZSA9IG5ldyBFbWl0dGVyKCk7XG5cbkJ1dHRvbk1hbmFnZXIucHJvdG90eXBlLmNyZWF0ZUJ1dHRvbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gIGJ1dHRvbi5jbGFzc05hbWUgPSAnd2VidnItYnV0dG9uJztcbiAgdmFyIHMgPSBidXR0b24uc3R5bGU7XG4gIHMucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBzLndpZHRoID0gJzI0cHgnXG4gIHMuaGVpZ2h0ID0gJzI0cHgnO1xuICBzLmJhY2tncm91bmRTaXplID0gJ2NvdmVyJztcbiAgcy5iYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICBzLmJvcmRlciA9IDA7XG4gIHMudXNlclNlbGVjdCA9ICdub25lJztcbiAgcy53ZWJraXRVc2VyU2VsZWN0ID0gJ25vbmUnO1xuICBzLk1velVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gIHMuY3Vyc29yID0gJ3BvaW50ZXInO1xuICBzLnBhZGRpbmcgPSAnMTJweCc7XG4gIHMuekluZGV4ID0gMTtcbiAgcy5kaXNwbGF5ID0gJ25vbmUnO1xuICBzLmJveFNpemluZyA9ICdjb250ZW50LWJveCc7XG5cbiAgLy8gUHJldmVudCBidXR0b24gZnJvbSBiZWluZyBzZWxlY3RlZCBhbmQgZHJhZ2dlZC5cbiAgYnV0dG9uLmRyYWdnYWJsZSA9IGZhbHNlO1xuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgLy8gU3R5bGUgaXQgb24gaG92ZXIuXG4gIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oZSkge1xuICAgIHMuZmlsdGVyID0gcy53ZWJraXRGaWx0ZXIgPSAnZHJvcC1zaGFkb3coMCAwIDVweCByZ2JhKDI1NSwyNTUsMjU1LDEpKSc7XG4gIH0pO1xuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICBzLmZpbHRlciA9IHMud2Via2l0RmlsdGVyID0gJyc7XG4gIH0pO1xuICByZXR1cm4gYnV0dG9uO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUuc2V0TW9kZSA9IGZ1bmN0aW9uKG1vZGUsIGlzVlJDb21wYXRpYmxlKSB7XG4gIGlzVlJDb21wYXRpYmxlID0gaXNWUkNvbXBhdGlibGUgfHwgV2ViVlJDb25maWcuRk9SQ0VfRU5BQkxFX1ZSO1xuICBpZiAoIXRoaXMuaXNWaXNpYmxlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHN3aXRjaCAobW9kZSkge1xuICAgIGNhc2UgTW9kZXMuTk9STUFMOlxuICAgICAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIHRoaXMuZnNCdXR0b24uc3JjID0gdGhpcy5JQ09OUy5mdWxsc2NyZWVuO1xuICAgICAgdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gKGlzVlJDb21wYXRpYmxlID8gJ2Jsb2NrJyA6ICdub25lJyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIE1vZGVzLk1BR0lDX1dJTkRPVzpcbiAgICAgIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB0aGlzLmZzQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuZXhpdEZ1bGxzY3JlZW47XG4gICAgICB0aGlzLnZyQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIE1vZGVzLlZSOlxuICAgICAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICAvLyBIYWNrIGZvciBTYWZhcmkgTWFjL2lPUyB0byBmb3JjZSByZWxheW91dCAoc3ZnLXNwZWNpZmljIGlzc3VlKVxuICAvLyBodHRwOi8vZ29vLmdsL2hqZ1I2clxuICB2YXIgb2xkVmFsdWUgPSB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXk7XG4gIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snO1xuICB0aGlzLmZzQnV0dG9uLm9mZnNldEhlaWdodDtcbiAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gb2xkVmFsdWU7XG59O1xuXG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZS5zZXRWaXNpYmlsaXR5ID0gZnVuY3Rpb24oaXNWaXNpYmxlKSB7XG4gIHRoaXMuaXNWaXNpYmxlID0gaXNWaXNpYmxlO1xuICB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSBpc1Zpc2libGUgPyAnYmxvY2snIDogJ25vbmUnO1xuICB0aGlzLnZyQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSBpc1Zpc2libGUgPyAnYmxvY2snIDogJ25vbmUnO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUuY3JlYXRlQ2xpY2tIYW5kbGVyXyA9IGZ1bmN0aW9uKGV2ZW50TmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuZW1pdChldmVudE5hbWUpO1xuICB9LmJpbmQodGhpcyk7XG59O1xuXG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZS5sb2FkSWNvbnNfID0gZnVuY3Rpb24oKSB7XG4gIC8vIFByZWxvYWQgc29tZSBoYXJkLWNvZGVkIFNWRy5cbiAgdGhpcy5JQ09OUyA9IHt9O1xuICB0aGlzLklDT05TLmNhcmRib2FyZCA9IFV0aWwuYmFzZTY0KCdpbWFnZS9zdmcreG1sJywgJ1BITjJaeUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lJSGRwWkhSb1BTSXlOSEI0SWlCb1pXbG5hSFE5SWpJMGNIZ2lJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0lnWm1sc2JEMGlJMFpHUmtaR1JpSStDaUFnSUNBOGNHRjBhQ0JrUFNKTk1qQXVOelFnTmtnekxqSXhRekl1TlRVZ05pQXlJRFl1TlRjZ01pQTNMakk0ZGpFd0xqUTBZekFnTGpjdU5UVWdNUzR5T0NBeExqSXpJREV1TWpob05DNDNPV011TlRJZ01DQXVPVFl0TGpNeklERXVNVFF0TGpjNWJERXVOQzB6TGpRNFl5NHlNeTB1TlRrdU56a3RNUzR3TVNBeExqUTBMVEV1TURGek1TNHlNUzQwTWlBeExqUTFJREV1TURGc01TNHpPU0F6TGpRNFl5NHhPUzQwTmk0Mk15NDNPU0F4TGpFeExqYzVhRFF1TnpsakxqY3hJREFnTVM0eU5pMHVOVGNnTVM0eU5pMHhMakk0VmpjdU1qaGpNQzB1TnkwdU5UVXRNUzR5T0MweExqSTJMVEV1TWpoNlRUY3VOU0F4TkM0Mk1tTXRNUzR4TnlBd0xUSXVNVE10TGprMUxUSXVNVE10TWk0eE1pQXdMVEV1TVRjdU9UWXRNaTR4TXlBeUxqRXpMVEl1TVRNZ01TNHhPQ0F3SURJdU1USXVPVFlnTWk0eE1pQXlMakV6Y3kwdU9UVWdNaTR4TWkweUxqRXlJREl1TVRKNmJUa2dNR010TVM0eE55QXdMVEl1TVRNdExqazFMVEl1TVRNdE1pNHhNaUF3TFRFdU1UY3VPVFl0TWk0eE15QXlMakV6TFRJdU1UTnpNaTR4TWk0NU5pQXlMakV5SURJdU1UTXRMamsxSURJdU1USXRNaTR4TWlBeUxqRXllaUl2UGdvZ0lDQWdQSEJoZEdnZ1ptbHNiRDBpYm05dVpTSWdaRDBpVFRBZ01HZ3lOSFl5TkVnd1ZqQjZJaTgrQ2p3dmMzWm5QZ289Jyk7XG4gIHRoaXMuSUNPTlMuZnVsbHNjcmVlbiA9IFV0aWwuYmFzZTY0KCdpbWFnZS9zdmcreG1sJywgJ1BITjJaeUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lJSGRwWkhSb1BTSXlOSEI0SWlCb1pXbG5hSFE5SWpJMGNIZ2lJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0lnWm1sc2JEMGlJMFpHUmtaR1JpSStDaUFnSUNBOGNHRjBhQ0JrUFNKTk1DQXdhREkwZGpJMFNEQjZJaUJtYVd4c1BTSnViMjVsSWk4K0NpQWdJQ0E4Y0dGMGFDQmtQU0pOTnlBeE5FZzFkalZvTlhZdE1rZzNkaTB6ZW0wdE1pMDBhREpXTjJnelZqVklOWFkxZW0weE1pQTNhQzB6ZGpKb05YWXROV2d0TW5ZemVrMHhOQ0ExZGpKb00zWXphREpXTldndE5Yb2lMejRLUEM5emRtYytDZz09Jyk7XG4gIHRoaXMuSUNPTlMuZXhpdEZ1bGxzY3JlZW4gPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NQ0F3YURJMGRqSTBTREI2SWlCbWFXeHNQU0p1YjI1bElpOCtDaUFnSUNBOGNHRjBhQ0JrUFNKTk5TQXhObWd6ZGpOb01uWXROVWcxZGpKNmJUTXRPRWcxZGpKb05WWTFTRGgyTTNwdE5pQXhNV2d5ZGkwemFETjJMVEpvTFRWMk5YcHRNaTB4TVZZMWFDMHlkalZvTlZZNGFDMHplaUl2UGdvOEwzTjJaejRLJyk7XG4gIHRoaXMuSUNPTlMuc2V0dGluZ3MgPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NQ0F3YURJMGRqSTBTREI2SWlCbWFXeHNQU0p1YjI1bElpOCtDaUFnSUNBOGNHRjBhQ0JrUFNKTk1Ua3VORE1nTVRJdU9UaGpMakEwTFM0ek1pNHdOeTB1TmpRdU1EY3RMams0Y3kwdU1ETXRMalkyTFM0d055MHVPVGhzTWk0eE1TMHhMalkxWXk0eE9TMHVNVFV1TWpRdExqUXlMakV5TFM0Mk5Hd3RNaTB6TGpRMll5MHVNVEl0TGpJeUxTNHpPUzB1TXkwdU5qRXRMakl5YkMweUxqUTVJREZqTFM0MU1pMHVOQzB4TGpBNExTNDNNeTB4TGpZNUxTNDVPR3d0TGpNNExUSXVOalZETVRRdU5EWWdNaTR4T0NBeE5DNHlOU0F5SURFMElESm9MVFJqTFM0eU5TQXdMUzQwTmk0eE9DMHVORGt1TkRKc0xTNHpPQ0F5TGpZMVl5MHVOakV1TWpVdE1TNHhOeTQxT1MweExqWTVMams0YkMweUxqUTVMVEZqTFM0eU15MHVNRGt0TGpRNUlEQXRMall4TGpJeWJDMHlJRE11TkRaakxTNHhNeTR5TWkwdU1EY3VORGt1TVRJdU5qUnNNaTR4TVNBeExqWTFZeTB1TURRdU16SXRMakEzTGpZMUxTNHdOeTQ1T0hNdU1ETXVOall1TURjdU9UaHNMVEl1TVRFZ01TNDJOV010TGpFNUxqRTFMUzR5TkM0ME1pMHVNVEl1TmpSc01pQXpMalEyWXk0eE1pNHlNaTR6T1M0ekxqWXhMakl5YkRJdU5Ea3RNV011TlRJdU5DQXhMakE0TGpjeklERXVOamt1T1Roc0xqTTRJREl1TmpWakxqQXpMakkwTGpJMExqUXlMalE1TGpReWFEUmpMakkxSURBZ0xqUTJMUzR4T0M0ME9TMHVOREpzTGpNNExUSXVOalZqTGpZeExTNHlOU0F4TGpFM0xTNDFPU0F4TGpZNUxTNDVPR3d5TGpRNUlERmpMakl6TGpBNUxqUTVJREFnTGpZeExTNHlNbXd5TFRNdU5EWmpMakV5TFM0eU1pNHdOeTB1TkRrdExqRXlMUzQyTkd3dE1pNHhNUzB4TGpZMWVrMHhNaUF4TlM0MVl5MHhMamt6SURBdE15NDFMVEV1TlRjdE15NDFMVE11TlhNeExqVTNMVE11TlNBekxqVXRNeTQxSURNdU5TQXhMalUzSURNdU5TQXpMalV0TVM0MU55QXpMalV0TXk0MUlETXVOWG9pTHo0S1BDOXpkbWMrQ2c9PScpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b25NYW5hZ2VyO1xuXG59LHtcIi4vZW1pdHRlci5qc1wiOjIsXCIuL21vZGVzLmpzXCI6MyxcIi4vdXRpbC5qc1wiOjR9XSwyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmZ1bmN0aW9uIEVtaXR0ZXIoKSB7XG4gIHRoaXMuY2FsbGJhY2tzID0ge307XG59XG5cbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV07XG4gIGlmICghY2FsbGJhY2tzKSB7XG4gICAgLy9jb25zb2xlLmxvZygnTm8gdmFsaWQgY2FsbGJhY2sgc3BlY2lmaWVkLicpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgLy8gRWxpbWluYXRlIHRoZSBmaXJzdCBwYXJhbSAodGhlIGNhbGxiYWNrKS5cbiAgYXJncy5zaGlmdCgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxufTtcblxuRW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gIGlmIChldmVudE5hbWUgaW4gdGhpcy5jYWxsYmFja3MpIHtcbiAgICB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0gPSBbY2FsbGJhY2tdO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXI7XG5cbn0se31dLDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIE1vZGVzID0ge1xuICBVTktOT1dOOiAwLFxuICAvLyBOb3QgZnVsbHNjcmVlbiwganVzdCB0cmFja2luZy5cbiAgTk9STUFMOiAxLFxuICAvLyBNYWdpYyB3aW5kb3cgaW1tZXJzaXZlIG1vZGUuXG4gIE1BR0lDX1dJTkRPVzogMixcbiAgLy8gRnVsbCBzY3JlZW4gc3BsaXQgc2NyZWVuIFZSIG1vZGUuXG4gIFZSOiAzLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlcztcblxufSx7fV0sNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHt9O1xuXG5VdGlsLmJhc2U2NCA9IGZ1bmN0aW9uKG1pbWVUeXBlLCBiYXNlNjQpIHtcbiAgcmV0dXJuICdkYXRhOicgKyBtaW1lVHlwZSArICc7YmFzZTY0LCcgKyBiYXNlNjQ7XG59O1xuXG5VdGlsLmlzTW9iaWxlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjaGVjayA9IGZhbHNlO1xuICAoZnVuY3Rpb24oYSl7aWYoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWluby9pLnRlc3QoYSl8fC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QoYS5zdWJzdHIoMCw0KSkpY2hlY2sgPSB0cnVlfSkobmF2aWdhdG9yLnVzZXJBZ2VudHx8bmF2aWdhdG9yLnZlbmRvcnx8d2luZG93Lm9wZXJhKTtcbiAgcmV0dXJuIGNoZWNrO1xufTtcblxuVXRpbC5pc0ZpcmVmb3ggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIC9maXJlZm94L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn07XG5cblV0aWwuaXNJT1MgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIC8oaVBhZHxpUGhvbmV8aVBvZCkvZy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xufTtcblxuVXRpbC5pc0lGcmFtZSA9IGZ1bmN0aW9uKCkge1xuICB0cnkge1xuICAgIHJldHVybiB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59O1xuXG5VdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyID0gZnVuY3Rpb24odXJsLCBrZXksIHZhbHVlKSB7XG4gIC8vIERldGVybWluZSBkZWxpbWl0ZXIgYmFzZWQgb24gaWYgdGhlIFVSTCBhbHJlYWR5IEdFVCBwYXJhbWV0ZXJzIGluIGl0LlxuICB2YXIgZGVsaW1pdGVyID0gKHVybC5pbmRleE9mKCc/JykgPCAwID8gJz8nIDogJyYnKTtcbiAgdXJsICs9IGRlbGltaXRlciArIGtleSArICc9JyArIHZhbHVlO1xuICByZXR1cm4gdXJsO1xufTtcblxuLy8gRnJvbSBodHRwOi8vZ29vLmdsLzRXWDN0Z1xuVXRpbC5nZXRRdWVyeVBhcmFtZXRlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtdLywgXCJcXFxcW1wiKS5yZXBsYWNlKC9bXFxdXS8sIFwiXFxcXF1cIik7XG4gIHZhciByZWdleCA9IG5ldyBSZWdFeHAoXCJbXFxcXD8mXVwiICsgbmFtZSArIFwiPShbXiYjXSopXCIpLFxuICAgICAgcmVzdWx0cyA9IHJlZ2V4LmV4ZWMobG9jYXRpb24uc2VhcmNoKTtcbiAgcmV0dXJuIHJlc3VsdHMgPT09IG51bGwgPyBcIlwiIDogZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMV0ucmVwbGFjZSgvXFwrL2csIFwiIFwiKSk7XG59O1xuXG5VdGlsLmlzTGFuZHNjYXBlTW9kZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHdpbmRvdy5vcmllbnRhdGlvbiA9PSA5MCB8fCB3aW5kb3cub3JpZW50YXRpb24gPT0gLTkwKTtcbn07XG5cblV0aWwuZ2V0U2NyZWVuV2lkdGggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE1hdGgubWF4KHdpbmRvdy5zY3JlZW4ud2lkdGgsIHdpbmRvdy5zY3JlZW4uaGVpZ2h0KSAqXG4gICAgICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbn07XG5cblV0aWwuZ2V0U2NyZWVuSGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLm1pbih3aW5kb3cuc2NyZWVuLndpZHRoLCB3aW5kb3cuc2NyZWVuLmhlaWdodCkgKlxuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW87XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWw7XG5cbn0se31dLDU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEJ1dHRvbk1hbmFnZXIgPSBfZGVyZXFfKCcuL2J1dHRvbi1tYW5hZ2VyLmpzJyk7XG52YXIgRW1pdHRlciA9IF9kZXJlcV8oJy4vZW1pdHRlci5qcycpO1xudmFyIE1vZGVzID0gX2RlcmVxXygnLi9tb2Rlcy5qcycpO1xudmFyIFV0aWwgPSBfZGVyZXFfKCcuL3V0aWwuanMnKTtcblxuLyoqXG4gKiBIZWxwZXIgZm9yIGdldHRpbmcgaW4gYW5kIG91dCBvZiBWUiBtb2RlLlxuICovXG5mdW5jdGlvbiBXZWJWUk1hbmFnZXIocmVuZGVyZXIsIGVmZmVjdCwgcGFyYW1zKSB7XG4gIHRoaXMucGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuXG4gIHRoaXMubW9kZSA9IE1vZGVzLlVOS05PV047XG5cbiAgLy8gU2V0IG9wdGlvbiB0byBoaWRlIHRoZSBidXR0b24uXG4gIHRoaXMuaGlkZUJ1dHRvbiA9IHRoaXMucGFyYW1zLmhpZGVCdXR0b24gfHwgZmFsc2U7XG4gIC8vIFdoZXRoZXIgb3Igbm90IHRoZSBGT1Ygc2hvdWxkIGJlIGRpc3RvcnRlZCBvciB1bi1kaXN0b3J0ZWQuIEJ5IGRlZmF1bHQsIGl0XG4gIC8vIHNob3VsZCBiZSBkaXN0b3J0ZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZiB2ZXJ0ZXggc2hhZGVyIGJhc2VkIGRpc3RvcnRpb24sXG4gIC8vIGVuc3VyZSB0aGF0IHdlIHVzZSB1bmRpc3RvcnRlZCBwYXJhbWV0ZXJzLlxuICB0aGlzLnByZWRpc3RvcnRlZCA9ICEhdGhpcy5wYXJhbXMucHJlZGlzdG9ydGVkO1xuXG4gIC8vIFNhdmUgdGhlIFRIUkVFLmpzIHJlbmRlcmVyIGFuZCBlZmZlY3QgZm9yIGxhdGVyLlxuICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gIHRoaXMuZWZmZWN0ID0gZWZmZWN0O1xuICB2YXIgcG9seWZpbGxXcmFwcGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLndlYnZyLXBvbHlmaWxsLWZ1bGxzY3JlZW4td3JhcHBlcicpO1xuICB0aGlzLmJ1dHRvbiA9IG5ldyBCdXR0b25NYW5hZ2VyKHBvbHlmaWxsV3JhcHBlcik7XG5cbiAgdGhpcy5pc0Z1bGxzY3JlZW5EaXNhYmxlZCA9ICEhVXRpbC5nZXRRdWVyeVBhcmFtZXRlcignbm9fZnVsbHNjcmVlbicpO1xuICB0aGlzLnN0YXJ0TW9kZSA9IE1vZGVzLk5PUk1BTDtcbiAgdmFyIHN0YXJ0TW9kZVBhcmFtID0gcGFyc2VJbnQoVXRpbC5nZXRRdWVyeVBhcmFtZXRlcignc3RhcnRfbW9kZScpKTtcbiAgaWYgKCFpc05hTihzdGFydE1vZGVQYXJhbSkpIHtcbiAgICB0aGlzLnN0YXJ0TW9kZSA9IHN0YXJ0TW9kZVBhcmFtO1xuICB9XG5cbiAgaWYgKHRoaXMuaGlkZUJ1dHRvbikge1xuICAgIHRoaXMuYnV0dG9uLnNldFZpc2liaWxpdHkoZmFsc2UpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgdGhlIGJyb3dzZXIgaXMgY29tcGF0aWJsZSB3aXRoIFdlYlZSLlxuICB0aGlzLmdldERldmljZUJ5VHlwZV8oVlJEaXNwbGF5KS50aGVuKGZ1bmN0aW9uKGhtZCkge1xuICAgIHRoaXMuaG1kID0gaG1kO1xuXG4gICAgLy8gT25seSBlbmFibGUgVlIgbW9kZSBpZiB0aGVyZSdzIGEgVlIgZGV2aWNlIGF0dGFjaGVkIG9yIHdlIGFyZSBydW5uaW5nIHRoZVxuICAgIC8vIHBvbHlmaWxsIG9uIG1vYmlsZS5cbiAgICBpZiAoIXRoaXMuaXNWUkNvbXBhdGlibGVPdmVycmlkZSkge1xuICAgICAgdGhpcy5pc1ZSQ29tcGF0aWJsZSA9ICAhaG1kLmlzUG9seWZpbGxlZCB8fCBVdGlsLmlzTW9iaWxlKCk7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0aGlzLnN0YXJ0TW9kZSkge1xuICAgICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuTUFHSUNfV0lORE9XKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE1vZGVzLlZSOlxuICAgICAgICB0aGlzLmVudGVyVlJNb2RlXygpO1xuICAgICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLlZSKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gICAgfVxuXG4gICAgdGhpcy5lbWl0KCdpbml0aWFsaXplZCcpO1xuICB9LmJpbmQodGhpcykpO1xuXG4gIC8vIEhvb2sgdXAgYnV0dG9uIGxpc3RlbmVycy5cbiAgdGhpcy5idXR0b24ub24oJ2ZzJywgdGhpcy5vbkZTQ2xpY2tfLmJpbmQodGhpcykpO1xuICB0aGlzLmJ1dHRvbi5vbigndnInLCB0aGlzLm9uVlJDbGlja18uYmluZCh0aGlzKSk7XG5cbiAgLy8gQmluZCB0byBmdWxsc2NyZWVuIGV2ZW50cy5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsXG4gICAgICB0aGlzLm9uRnVsbHNjcmVlbkNoYW5nZV8uYmluZCh0aGlzKSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLFxuICAgICAgdGhpcy5vbkZ1bGxzY3JlZW5DaGFuZ2VfLmJpbmQodGhpcykpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLFxuICAgICAgdGhpcy5vbkZ1bGxzY3JlZW5DaGFuZ2VfLmJpbmQodGhpcykpO1xuXG4gIC8vIEJpbmQgdG8gVlIqIHNwZWNpZmljIGV2ZW50cy5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheXByZXNlbnRjaGFuZ2UnLFxuICAgICAgdGhpcy5vblZSRGlzcGxheVByZXNlbnRDaGFuZ2VfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndnJkaXNwbGF5ZGV2aWNlcGFyYW1zY2hhbmdlJyxcbiAgICAgIHRoaXMub25WUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfLmJpbmQodGhpcykpO1xufVxuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlID0gbmV3IEVtaXR0ZXIoKTtcblxuLy8gRXhwb3NlIHRoZXNlIHZhbHVlcyBleHRlcm5hbGx5LlxuV2ViVlJNYW5hZ2VyLk1vZGVzID0gTW9kZXM7XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2NlbmUsIGNhbWVyYSwgdGltZXN0YW1wKSB7XG4gIC8vIFNjZW5lIG1heSBiZSBhbiBhcnJheSBvZiB0d28gc2NlbmVzLCBvbmUgZm9yIGVhY2ggZXllLlxuICBpZiAoc2NlbmUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIHRoaXMuZWZmZWN0LnJlbmRlcihzY2VuZVswXSwgY2FtZXJhKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmVmZmVjdC5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gIH1cbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuc2V0VlJDb21wYXRpYmxlT3ZlcnJpZGUgPSBmdW5jdGlvbihpc1ZSQ29tcGF0aWJsZSkge1xuICB0aGlzLmlzVlJDb21wYXRpYmxlID0gaXNWUkNvbXBhdGlibGU7XG4gIHRoaXMuaXNWUkNvbXBhdGlibGVPdmVycmlkZSA9IHRydWU7XG5cbiAgLy8gRG9uJ3QgYWN0dWFsbHkgY2hhbmdlIG1vZGVzLCBqdXN0IHVwZGF0ZSB0aGUgYnV0dG9ucy5cbiAgdGhpcy5idXR0b24uc2V0TW9kZSh0aGlzLm1vZGUsIHRoaXMuaXNWUkNvbXBhdGlibGUpO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRGdWxsc2NyZWVuQ2FsbGJhY2sgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB0aGlzLmZ1bGxzY3JlZW5DYWxsYmFjayA9IGNhbGxiYWNrO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRWUkNhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdGhpcy52ckNhbGxiYWNrID0gY2FsbGJhY2s7XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnNldEV4aXRGdWxsc2NyZWVuQ2FsbGJhY2sgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB0aGlzLmV4aXRGdWxsc2NyZWVuQ2FsbGJhY2sgPSBjYWxsYmFjaztcbn1cblxuLyoqXG4gKiBQcm9taXNlIHJldHVybnMgdHJ1ZSBpZiB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgSE1EIGRldmljZSBhdmFpbGFibGUuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuZ2V0RGV2aWNlQnlUeXBlXyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKCkudGhlbihmdW5jdGlvbihkaXNwbGF5cykge1xuICAgICAgLy8gUHJvbWlzZSBzdWNjZWVkcywgYnV0IGNoZWNrIGlmIHRoZXJlIGFyZSBhbnkgZGlzcGxheXMgYWN0dWFsbHkuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpc3BsYXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChkaXNwbGF5c1tpXSBpbnN0YW5jZW9mIHR5cGUpIHtcbiAgICAgICAgICByZXNvbHZlKGRpc3BsYXlzW2ldKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgIC8vIE5vIGRpc3BsYXlzIGFyZSBmb3VuZC5cbiAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBIZWxwZXIgZm9yIGVudGVyaW5nIFZSIG1vZGUuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuZW50ZXJWUk1vZGVfID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuaG1kLnJlcXVlc3RQcmVzZW50KFt7XG4gICAgc291cmNlOiB0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQsXG4gICAgcHJlZGlzdG9ydGVkOiB0aGlzLnByZWRpc3RvcnRlZFxuICB9XSk7XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnNldE1vZGVfID0gZnVuY3Rpb24obW9kZSkge1xuICB2YXIgb2xkTW9kZSA9IHRoaXMubW9kZTtcbiAgaWYgKG1vZGUgPT0gdGhpcy5tb2RlKSB7XG4gICAgY29uc29sZS53YXJuKCdOb3QgY2hhbmdpbmcgbW9kZXMsIGFscmVhZHkgaW4gJXMnLCBtb2RlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gY29uc29sZS5sb2coJ01vZGUgY2hhbmdlOiAlcyA9PiAlcycsIHRoaXMubW9kZSwgbW9kZSk7XG4gIHRoaXMubW9kZSA9IG1vZGU7XG4gIHRoaXMuYnV0dG9uLnNldE1vZGUobW9kZSwgdGhpcy5pc1ZSQ29tcGF0aWJsZSk7XG5cbiAgLy8gRW1pdCBhbiBldmVudCBpbmRpY2F0aW5nIHRoZSBtb2RlIGNoYW5nZWQuXG4gIHRoaXMuZW1pdCgnbW9kZWNoYW5nZScsIG1vZGUsIG9sZE1vZGUpO1xufTtcblxuLyoqXG4gKiBNYWluIGJ1dHRvbiB3YXMgY2xpY2tlZC5cbiAqL1xuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vbkZTQ2xpY2tfID0gZnVuY3Rpb24oKSB7XG4gIHN3aXRjaCAodGhpcy5tb2RlKSB7XG4gICAgY2FzZSBNb2Rlcy5OT1JNQUw6XG4gICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBoYWNrIGlmL3doZW4gaU9TIGdldHMgcmVhbCBmdWxsc2NyZWVuIG1vZGUuXG4gICAgICAvLyBJZiB0aGlzIGlzIGFuIGlmcmFtZSBvbiBpT1MsIGJyZWFrIG91dCBhbmQgb3BlbiBpbiBub19mdWxsc2NyZWVuIG1vZGUuXG4gICAgICBpZiAoVXRpbC5pc0lPUygpICYmIFV0aWwuaXNJRnJhbWUoKSkge1xuICAgICAgICBpZiAodGhpcy5mdWxsc2NyZWVuQ2FsbGJhY2spIHtcbiAgICAgICAgICB0aGlzLmZ1bGxzY3JlZW5DYWxsYmFjaygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgICB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKHVybCwgJ25vX2Z1bGxzY3JlZW4nLCAndHJ1ZScpO1xuICAgICAgICAgIHVybCA9IFV0aWwuYXBwZW5kUXVlcnlQYXJhbWV0ZXIodXJsLCAnc3RhcnRfbW9kZScsIE1vZGVzLk1BR0lDX1dJTkRPVyk7XG4gICAgICAgICAgdG9wLmxvY2F0aW9uLmhyZWYgPSB1cmw7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk1BR0lDX1dJTkRPVyk7XG4gICAgICB0aGlzLnJlcXVlc3RGdWxsc2NyZWVuXygpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICBpZiAodGhpcy5pc0Z1bGxzY3JlZW5EaXNhYmxlZCkge1xuICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmV4aXRGdWxsc2NyZWVuQ2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5leGl0RnVsbHNjcmVlbkNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gICAgICB0aGlzLmV4aXRGdWxsc2NyZWVuXygpO1xuICAgICAgYnJlYWs7XG4gIH1cbn07XG5cbi8qKlxuICogVGhlIFZSIGJ1dHRvbiB3YXMgY2xpY2tlZC5cbiAqL1xuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vblZSQ2xpY2tfID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRPRE86IFJlbW92ZSB0aGlzIGhhY2sgd2hlbiBpT1MgaGFzIGZ1bGxzY3JlZW4gbW9kZS5cbiAgLy8gSWYgdGhpcyBpcyBhbiBpZnJhbWUgb24gaU9TLCBicmVhayBvdXQgYW5kIG9wZW4gaW4gbm9fZnVsbHNjcmVlbiBtb2RlLlxuICBpZiAodGhpcy5tb2RlID09IE1vZGVzLk5PUk1BTCAmJiBVdGlsLmlzSU9TKCkgJiYgVXRpbC5pc0lGcmFtZSgpKSB7XG4gICAgaWYgKHRoaXMudnJDYWxsYmFjaykge1xuICAgICAgdGhpcy52ckNhbGxiYWNrKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgIHVybCA9IFV0aWwuYXBwZW5kUXVlcnlQYXJhbWV0ZXIodXJsLCAnbm9fZnVsbHNjcmVlbicsICd0cnVlJyk7XG4gICAgICB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKHVybCwgJ3N0YXJ0X21vZGUnLCBNb2Rlcy5WUik7XG4gICAgICB0b3AubG9jYXRpb24uaHJlZiA9IHVybDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbiAgdGhpcy5lbnRlclZSTW9kZV8oKTtcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUucmVxdWVzdEZ1bGxzY3JlZW5fID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5ib2R5O1xuICAvL3ZhciBjYW52YXMgPSB0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQ7XG4gIGlmIChjYW52YXMucmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBjYW52YXMucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMubW96UmVxdWVzdEZ1bGxTY3JlZW4pIHtcbiAgICBjYW52YXMubW96UmVxdWVzdEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBjYW52YXMud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMubXNSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgIGNhbnZhcy5tc1JlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH1cbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuZXhpdEZ1bGxzY3JlZW5fID0gZnVuY3Rpb24oKSB7XG4gIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4oKTtcbiAgfVxufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vblZSRGlzcGxheVByZXNlbnRDaGFuZ2VfID0gZnVuY3Rpb24oZSkge1xuICBjb25zb2xlLmxvZygnb25WUkRpc3BsYXlQcmVzZW50Q2hhbmdlXycsIGUpO1xuICBpZiAodGhpcy5obWQuaXNQcmVzZW50aW5nKSB7XG4gICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5WUik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5OT1JNQUwpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLm9uVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgY29uc29sZS5sb2coJ29uVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXycsIGUpO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vbkZ1bGxzY3JlZW5DaGFuZ2VfID0gZnVuY3Rpb24oZSkge1xuICAvLyBJZiB3ZSBsZWF2ZSBmdWxsLXNjcmVlbiwgZ28gYmFjayB0byBub3JtYWwgbW9kZS5cbiAgaWYgKGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50ID09PSBudWxsIHx8XG4gICAgICBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCA9PT0gbnVsbCkge1xuICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuTk9STUFMKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJWUk1hbmFnZXI7XG5cbn0se1wiLi9idXR0b24tbWFuYWdlci5qc1wiOjEsXCIuL2VtaXR0ZXIuanNcIjoyLFwiLi9tb2Rlcy5qc1wiOjMsXCIuL3V0aWwuanNcIjo0fV19LHt9LFs1XSkoNSlcbn0pOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBNZW51UmVuZGVyZXIgZnJvbSAnLi9yZW5kZXJlci5qcyc7XG5cbmxldCByZW5kZXJlcjtcbmxldCB2ckRpc3BsYXk7XG5cbmZ1bmN0aW9uIG9uTG9hZCgpIHtcbiAgcmVuZGVyZXIgPSBuZXcgTWVudVJlbmRlcmVyKCk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHsgcmVuZGVyZXIucmVzaXplKCkgfSk7XG5cbiAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKS50aGVuKGZ1bmN0aW9uKGRpc3BsYXlzKSB7XG4gICAgaWYgKGRpc3BsYXlzLmxlbmd0aCA+IDApIHtcbiAgICAgIHZyRGlzcGxheSA9IGRpc3BsYXlzWzBdO1xuXG4gICAgICByZW5kZXJlci5hZGRDdWJlKCk7XG5cbiAgICAgIHZyRGlzcGxheS5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiByZW5kZXIoKSB7XG4gIHJlbmRlcmVyLnJlbmRlcigpO1xuXG4gIHZyRGlzcGxheS5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBvbkxvYWQpO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IFdlYlZSTWFuYWdlciBmcm9tICd3ZWJ2ci1ib2lsZXJwbGF0ZSdcbmltcG9ydCBSYXlJbnB1dCBmcm9tICcuLi9yYXktaW5wdXQnXG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBuZXcgVEhSRUUuQ29sb3IoMHgwMEZGMDApO1xuY29uc3QgSElHSExJR0hUX0NPTE9SID0gbmV3IFRIUkVFLkNvbG9yKDB4MUU5MEZGKTtcbmNvbnN0IEFDVElWRV9DT0xPUiA9IG5ldyBUSFJFRS5Db2xvcigweEZGMzMzMyk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1lbnVSZW5kZXJlciB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgbGV0IHdvcmxkO1xuICAgIGNvbnN0IGR0ID0gMSAvIDYwO1xuICAgIGxldCBjb25zdHJhaW50RG93biA9IGZhbHNlO1xuICAgIGxldCBqb2ludEJvZHksIGNvbnN0cmFpbmVkQm9keSwgcG9pbnRlckNvbnN0cmFpbnQ7XG4gICAgbGV0IGNsaWNrTWFya2VyID0gZmFsc2U7XG4gICAgbGV0IGdlb21ldHJ5LCBtYXRlcmlhbCwgbWVzaDtcbiAgICAvLyBUbyBiZSBzeW5jZWRcbiAgICBsZXQgbWVzaGVzID0gW10sIGJvZGllcyA9IFtdO1xuXG4gICAgbGV0IGF4ZXMgPSBbXTtcbiAgICBheGVzWyAwIF0gPSB7XG4gICAgICB2YWx1ZTogWyAwLCAwIF1cbiAgICB9O1xuXG4gICAgLy8gU2V0dXAgb3VyIHdvcmxkXG4gICAgd29ybGQgPSBuZXcgQ0FOTk9OLldvcmxkKCk7XG4gICAgd29ybGQucXVhdE5vcm1hbGl6ZVNraXAgPSAwO1xuICAgIHdvcmxkLnF1YXROb3JtYWxpemVGYXN0ID0gZmFsc2U7XG5cbiAgICB3b3JsZC5ncmF2aXR5LnNldCgwLC00LDApO1xuICAgIHdvcmxkLmJyb2FkcGhhc2UgPSBuZXcgQ0FOTk9OLk5haXZlQnJvYWRwaGFzZSgpO1xuXG4gICAgLy8gQ3JlYXRlIGEgcGxhbmVcbiAgICBsZXQgZ3JvdW5kU2hhcGUgPSBuZXcgQ0FOTk9OLlBsYW5lKCk7XG4gICAgbGV0IGdyb3VuZEJvZHkgPSBuZXcgQ0FOTk9OLkJvZHkoeyBtYXNzOiAwIH0pO1xuICAgIGdyb3VuZEJvZHkuYWRkU2hhcGUoZ3JvdW5kU2hhcGUpO1xuICAgIGdyb3VuZEJvZHkucXVhdGVybmlvbi5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBDQU5OT04uVmVjMygxLDAsMCksLU1hdGguUEkvMik7XG4gICAgd29ybGQuYWRkQm9keShncm91bmRCb2R5KTtcblxuICAgIC8vIEpvaW50IGJvZHlcbiAgICBsZXQgc2hhcGUgPSBuZXcgQ0FOTk9OLlNwaGVyZSgwLjEpO1xuICAgIGpvaW50Qm9keSA9IG5ldyBDQU5OT04uQm9keSh7IG1hc3M6IDAgfSk7XG4gICAgam9pbnRCb2R5LmFkZFNoYXBlKHNoYXBlKTtcbiAgICBqb2ludEJvZHkuY29sbGlzaW9uRmlsdGVyR3JvdXAgPSAwO1xuICAgIGpvaW50Qm9keS5jb2xsaXNpb25GaWx0ZXJNYXNrID0gMDtcbiAgICB3b3JsZC5hZGRCb2R5KGpvaW50Qm9keSk7XG5cbiAgICBsZXQgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbiAgICBzY2VuZS5mb2cgPSBuZXcgVEhSRUUuRm9nKCAweDAwMDAwMCwgNTAwLCAxMDAwMCApO1xuXG4gICAgbGV0IGFzcGVjdCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIGxldCBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNzUsIGFzcGVjdCwgMC4xLCAxMDApO1xuICAgIHNjZW5lLmFkZChjYW1lcmEpO1xuXG4gICAgbGV0IHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoeyBhbnRpYWxpYXM6IHRydWUgfSk7XG4gICAgY29uc29sZS5sb2coJ3NpemluZycpO1xuICAgIGNvbnNvbGUubG9nKCd3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbzogJyArIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKTtcbiAgICBjb25zb2xlLmxvZygnd2luZG93LmlubmVyV2lkdGg6ICcgKyB3aW5kb3cuaW5uZXJXaWR0aCk7XG4gICAgY29uc29sZS5sb2coJ3dpbmRvdy5pbm5lckhlaWdodDogJyArIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvciggc2NlbmUuZm9nLmNvbG9yICk7XG4gICAgcmVuZGVyZXIuc2V0U2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgICByZW5kZXJlci5nYW1tYUlucHV0ID0gdHJ1ZTtcbiAgICByZW5kZXJlci5nYW1tYU91dHB1dCA9IHRydWU7XG4gICAgcmVuZGVyZXIuc2hhZG93TWFwRW5hYmxlZCA9IHRydWU7XG5cbiAgICBsZXQgZWZmZWN0ID0gbmV3IFRIUkVFLlZSRWZmZWN0KHJlbmRlcmVyKTtcbiAgICBsZXQgY29udHJvbHMgPSBuZXcgVEhSRUUuVlJDb250cm9scyhjYW1lcmEpO1xuICAgIGNvbnRyb2xzLnN0YW5kaW5nID0gdHJ1ZTtcblxuICAgIGxldCBtYW5hZ2VyID0gbmV3IFdlYlZSTWFuYWdlcihyZW5kZXJlciwgZWZmZWN0KTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgLy8gSW5wdXQgbWFuYWdlci5cbiAgICBsZXQgcmF5SW5wdXQgPSBuZXcgUmF5SW5wdXQoY2FtZXJhKTtcbiAgICByYXlJbnB1dC5zZXRTaXplKHJlbmRlcmVyLmdldFNpemUoKSk7XG4gICAgcmF5SW5wdXQub24oJ3JheWRvd24nLCAob3B0X21lc2gpID0+IHsgdGhpcy5oYW5kbGVSYXlEb3duXyhvcHRfbWVzaCkgfSk7XG4gICAgcmF5SW5wdXQub24oJ3JheWRyYWcnLCAoKSA9PiB7IHRoaXMuaGFuZGxlUmF5RHJhZ18oKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5dXAnLCAob3B0X21lc2gpID0+IHsgdGhpcy5oYW5kbGVSYXlVcF8ob3B0X21lc2gpIH0pO1xuICAgIHJheUlucHV0Lm9uKCdyYXljYW5jZWwnLCAob3B0X21lc2gpID0+IHsgdGhpcy5oYW5kbGVSYXlDYW5jZWxfKG9wdF9tZXNoKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5b3ZlcicsIChtZXNoKSA9PiB7IE1lbnVSZW5kZXJlci5zZXRTZWxlY3RlZF8obWVzaCwgdHJ1ZSkgfSk7XG4gICAgcmF5SW5wdXQub24oJ3JheW91dCcsIChtZXNoKSA9PiB7IE1lbnVSZW5kZXJlci5zZXRTZWxlY3RlZF8obWVzaCwgZmFsc2UpIH0pO1xuXG4gICAgLy8gQWRkIHRoZSByYXkgaW5wdXQgbWVzaCB0byB0aGUgc2NlbmUuXG4gICAgc2NlbmUuYWRkKHJheUlucHV0LmdldE1lc2goKSk7XG5cbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgIHRoaXMuc2NlbmUgPSBzY2VuZTtcbiAgICB0aGlzLmNvbnRyb2xzID0gY29udHJvbHM7XG4gICAgdGhpcy5yYXlJbnB1dCA9IHJheUlucHV0O1xuICAgIHRoaXMuZWZmZWN0ID0gZWZmZWN0O1xuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgdGhpcy5kdCA9IGR0O1xuICAgIHRoaXMubWVzaGVzID0gbWVzaGVzO1xuICAgIHRoaXMuYm9kaWVzID0gYm9kaWVzO1xuICAgIHRoaXMuY2xpY2tNYXJrZXIgPSBjbGlja01hcmtlcjtcbiAgICB0aGlzLmNvbnN0cmFpbnREb3duID0gY29uc3RyYWludERvd247XG4gICAgdGhpcy5jb25zdHJhaW5lZEJvZHkgPSBjb25zdHJhaW5lZEJvZHk7XG4gICAgdGhpcy5wb2ludGVyQ29uc3RyYWludCA9IHBvaW50ZXJDb25zdHJhaW50O1xuICAgIHRoaXMuam9pbnRCb2R5ID0gam9pbnRCb2R5O1xuICAgIHRoaXMuYXhlcyA9IGF4ZXM7XG4gICAgdGhpcy50b3VjaFBhZFBvc2l0aW9uID0geyB4OiAwLCB6OiAwIH07XG5cbiAgICAvLyBsaWdodHNcbiAgICBsZXQgbGlnaHQ7XG4gICAgc2NlbmUuYWRkKCBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KCAweDY2NjY2NiApICk7XG5cbiAgICBsaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KCAweGZmZmZmZiwgMS43NSApO1xuICAgIGNvbnN0IGQgPSAyMDtcblxuICAgIGxpZ2h0LnBvc2l0aW9uLnNldCggZCwgZCwgZCApO1xuXG4gICAgbGlnaHQuY2FzdFNoYWRvdyA9IHRydWU7XG4gICAgbGlnaHQuc2hhZG93Lm1hcFNpemUud2lkdGg9IDEwMjQ7XG4gICAgbGlnaHQuc2hhZG93Lm1hcFNpemUud2lkdGggPSAxMDI0O1xuICAgIGxpZ2h0LnNoYWRvdy5jYW1lcmEubGVmdCA9IC1kO1xuICAgIGxpZ2h0LnNoYWRvdy5jYW1lcmFyaWdodCA9IGQ7XG4gICAgbGlnaHQuc2hhZG93LmNhbWVyYS50b3AgPSBkO1xuICAgIGxpZ2h0LnNoYWRvdy5jYW1lcmEuYm90dG9tID0gLWQ7XG4gICAgbGlnaHQuc2hhZG93LmNhbWVyYS5mYXIgPSAzKmQ7XG4gICAgbGlnaHQuc2hhZG93LmNhbWVyYS5uZWFyID0gZDtcblxuICAgIHNjZW5lLmFkZCggbGlnaHQgKTtcblxuICAgIC8vIGZsb29yXG4gICAgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuUGxhbmVHZW9tZXRyeSggMTAwLCAxMDAsIDEsIDEgKTtcbiAgICAvL2dlb21ldHJ5LmFwcGx5TWF0cml4KCBuZXcgVEhSRUUuTWF0cml4NCgpLm1ha2VSb3RhdGlvblgoIC1NYXRoLlBJIC8gMiApICk7XG4gICAgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCggeyBjb2xvcjogMHg3Nzc3NzcgfSApO1xuICAgIHRoaXMubWFya2VyTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCh7IGNvbG9yOiAweGZmMDAwMCB9KTtcbiAgICAvL1RIUkVFLkNvbG9yVXRpbHMuYWRqdXN0SFNWKCBtYXRlcmlhbC5jb2xvciwgMCwgMCwgMC45ICk7XG4gICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKCBnZW9tZXRyeSwgbWF0ZXJpYWwgKTtcbiAgICBtZXNoLmNhc3RTaGFkb3cgPSB0cnVlO1xuICAgIG1lc2gucXVhdGVybmlvbi5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBUSFJFRS5WZWN0b3IzKDEsMCwwKSwgLU1hdGguUEkgLyAyKTtcbiAgICBtZXNoLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgIHNjZW5lLmFkZChtZXNoKTtcbiAgfVxuXG4gIGFkZEN1YmUoKSB7XG4gICAgbGV0IGJveFNoYXBlLCBib3hCb2R5O1xuICAgIGNvbnN0IG1hc3MgPSA1O1xuICAgIGxldCBjdWJlR2VvID0gbmV3IFRIUkVFLkJveEdlb21ldHJ5KCAxLCAxLCAxLCAxMCwgMTAgKTtcbiAgICBsZXQgY3ViZU1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKCB7IGNvbG9yOiAweDI5YWQ4MyB9ICk7XG4gICAgbGV0IGN1YmVNZXNoO1xuICAgIGN1YmVNZXNoID0gbmV3IFRIUkVFLk1lc2goY3ViZUdlbywgY3ViZU1hdGVyaWFsKTtcbiAgICBjdWJlTWVzaC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICB0aGlzLm1lc2hlcy5wdXNoKGN1YmVNZXNoKTtcbiAgICB0aGlzLnNjZW5lLmFkZChjdWJlTWVzaCk7XG4gICAgdGhpcy5yYXlJbnB1dC5hZGQoY3ViZU1lc2gpO1xuXG4gICAgYm94U2hhcGUgPSBuZXcgQ0FOTk9OLkJveChuZXcgQ0FOTk9OLlZlYzMoMC41LDAuNSwwLjUpKTtcbiAgICBmb3IobGV0IGk9MDsgaTwxOyBpKyspe1xuICAgICAgYm94Qm9keSA9IG5ldyBDQU5OT04uQm9keSh7IG1hc3M6IG1hc3MgfSk7XG4gICAgICBib3hCb2R5LmFkZFNoYXBlKGJveFNoYXBlKTtcbiAgICAgIGJveEJvZHkucG9zaXRpb24uc2V0KDAsNywtNSk7XG4gICAgICB0aGlzLndvcmxkLmFkZEJvZHkoYm94Qm9keSk7XG4gICAgICB0aGlzLmJvZGllcy5wdXNoKGJveEJvZHkpO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVBoeXNpY3MoKSB7XG4gICAgdGhpcy53b3JsZC5zdGVwKHRoaXMuZHQpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpICE9PSB0aGlzLm1lc2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLm1lc2hlc1tpXS5wb3NpdGlvbi5jb3B5KHRoaXMuYm9kaWVzW2ldLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMubWVzaGVzW2ldLnF1YXRlcm5pb24uY29weSh0aGlzLmJvZGllc1tpXS5xdWF0ZXJuaW9uKTtcbiAgICB9XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgdGhpcy5jb250cm9scy51cGRhdGUoKTtcbiAgICB0aGlzLnJheUlucHV0LnVwZGF0ZSgpO1xuXG4gICAgaWYgKHRoaXMuY29uc3RyYWludERvd24pIHtcbiAgICAgIC8vICBEaWQgYW55IGF4ZXMgKGFzc3VtaW5nIGEgMkQgdHJhY2twYWQpIHZhbHVlcyBjaGFuZ2U/XG5cbiAgICAgIGxldCBnYW1lcGFkID0gTWVudVJlbmRlcmVyLmdldFZSR2FtZXBhZCgpO1xuICAgICAgaWYgKGdhbWVwYWQgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKGdhbWVwYWQuYXhlc1swXSAmJiBnYW1lcGFkLmF4ZXNbMV0pIHtcblxuXG4gICAgICAgICAgbGV0IGF4ZXNWYWwgPSB0aGlzLmF4ZXNbMF0udmFsdWU7XG4gICAgICAgICAgbGV0IGF4aXNYID0gZ2FtZXBhZC5heGVzWzBdO1xuICAgICAgICAgIGxldCBheGlzWSA9IGdhbWVwYWQuYXhlc1sxXTtcblxuICAgICAgICAgIC8vIG9ubHkgYXBwbHkgZmlsdGVyIGlmIGJvdGggYXhlcyBhcmUgYmVsb3cgdGhyZXNob2xkXG4gICAgICAgICAgbGV0IGZpbHRlcmVkWCA9IHRoaXMuZmlsdGVyQXhpcyhheGlzWCk7XG4gICAgICAgICAgbGV0IGZpbHRlcmVkWSA9IHRoaXMuZmlsdGVyQXhpcyhheGlzWSk7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJlZFggJiYgIWZpbHRlcmVkWSkge1xuICAgICAgICAgICAgYXhpc1ggPSBmaWx0ZXJlZFg7XG4gICAgICAgICAgICBheGlzWSA9IGZpbHRlcmVkWTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYXhlc1ZhbFswXSAhPT0gYXhpc1ggfHwgYXhlc1ZhbFsxXSAhPT0gYXhpc1kpIHtcbiAgICAgICAgICAgIGF4ZXNWYWxbMF0gPSBheGlzWDtcbiAgICAgICAgICAgIGF4ZXNWYWxbMV0gPSBheGlzWTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdheGVzIGNoYW5nZWQnLCBheGVzVmFsKTtcbiAgICAgICAgICAgIHRoaXMucm90YXRlSm9pbnQoYXhpc1gsIGF4aXNZKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZVBoeXNpY3MoKTtcbiAgICB0aGlzLmVmZmVjdC5yZW5kZXIodGhpcy5zY2VuZSwgdGhpcy5jYW1lcmEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZpcnN0IFZSLWVuYWJsZWQgZ2FtZXBhZC5cbiAgICovXG4gIHN0YXRpYyBnZXRWUkdhbWVwYWQoKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkIEFQSSwgdGhlcmUncyBubyBnYW1lcGFkLlxuICAgIGlmICghbmF2aWdhdG9yLmdldEdhbWVwYWRzKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgZ2FtZXBhZHMgPSBuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdhbWVwYWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICBsZXQgZ2FtZXBhZCA9IGdhbWVwYWRzW2ldO1xuXG4gICAgICAvLyBUaGUgYXJyYXkgbWF5IGNvbnRhaW4gdW5kZWZpbmVkIGdhbWVwYWRzLCBzbyBjaGVjayBmb3IgdGhhdCBhcyB3ZWxsIGFzXG4gICAgICAvLyBhIG5vbi1udWxsIHBvc2UuXG4gICAgICBpZiAoZ2FtZXBhZCAmJiBnYW1lcGFkLnBvc2UpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVwYWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZmlsdGVyQXhpcyggdiApIHtcbiAgICB0aGlzLmF4aXNUaHJlc2hvbGQgPSAwLjI7XG4gICAgcmV0dXJuICggTWF0aC5hYnMoIHYgKSA+IHRoaXMuYXhpc1RocmVzaG9sZCApID8gdiA6IDA7XG4gIH1cblxuICByZXNpemUoKSB7XG4gICAgdGhpcy5jYW1lcmEuYXNwZWN0ID0gd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgdGhpcy5jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgIGNvbnNvbGUubG9nKCdSZXNpemluZycpO1xuICAgIGNvbnNvbGUubG9nKCd3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbzogJyArIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKTtcbiAgICBjb25zb2xlLmxvZygnd2luZG93LmlubmVyV2lkdGg6ICcgKyB3aW5kb3cuaW5uZXJXaWR0aCk7XG4gICAgY29uc29sZS5sb2coJ3dpbmRvdy5pbm5lckhlaWdodDogJyArIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgY29uc3QgRFBSID0gKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKSA/IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIDogMTtcbiAgICBjb25zdCBXVyA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIGNvbnN0IEhIID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSggV1csIEhIICk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRWaWV3cG9ydCggMCwgMCwgV1cqRFBSLCBISCpEUFIgKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFBpeGVsUmF0aW8od2luZG93LmRldmljZVBpeGVsUmF0aW8gPyB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA6IDEpO1xuICAgIHRoaXMucmF5SW5wdXQuc2V0U2l6ZSh0aGlzLnJlbmRlcmVyLmdldFNpemUoKSk7XG4gIH1cblxuICBoYW5kbGVSYXlEb3duXyhvcHRfbWVzaCkge1xuICAgIE1lbnVSZW5kZXJlci5zZXRBY3Rpb25fKG9wdF9tZXNoLCB0cnVlKTtcblxuICAgIGxldCBwb3MgPSB0aGlzLnJheUlucHV0LnJlbmRlcmVyLnJldGljbGUucG9zaXRpb247XG4gICAgaWYocG9zKXtcbiAgICAgIHRoaXMuY29uc3RyYWludERvd24gPSB0cnVlO1xuICAgICAgLy8gU2V0IG1hcmtlciBvbiBjb250YWN0IHBvaW50XG4gICAgICB0aGlzLnNldENsaWNrTWFya2VyKHBvcy54LHBvcy55LHBvcy56LHRoaXMuc2NlbmUpO1xuXG4gICAgICAvLyBTZXQgdGhlIG1vdmVtZW50IHBsYW5lXG4gICAgICAvLyBzZXRTY3JlZW5QZXJwQ2VudGVyKHBvcyxjYW1lcmEpO1xuXG4gICAgICBsZXQgaWR4ID0gdGhpcy5tZXNoZXMuaW5kZXhPZihvcHRfbWVzaCk7XG4gICAgICBpZihpZHggIT09IC0xKXtcbiAgICAgICAgdGhpcy5hZGRQb2ludGVyQ29uc3RyYWludChwb3MueCxwb3MueSxwb3Mueix0aGlzLmJvZGllc1tpZHhdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVSYXlEcmFnXygpIHtcbiAgICBpZiAodGhpcy5wb2ludGVyQ29uc3RyYWludCkge1xuICAgICAgbGV0IHBvcyA9IHRoaXMucmF5SW5wdXQucmVuZGVyZXIucmV0aWNsZS5wb3NpdGlvbjtcbiAgICAgIGlmKHBvcyl7XG4gICAgICAgIHRoaXMuc2V0Q2xpY2tNYXJrZXIocG9zLngscG9zLnkscG9zLnosdGhpcy5zY2VuZSk7XG4gICAgICAgIHRoaXMubW92ZUpvaW50VG9Qb2ludChwb3MueCxwb3MueSxwb3Mueik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlUmF5VXBfKG9wdF9tZXNoKSB7XG4gICAgTWVudVJlbmRlcmVyLnNldEFjdGlvbl8ob3B0X21lc2gsIGZhbHNlKTtcblxuICAgIHRoaXMuY29uc3RyYWludERvd24gPSBmYWxzZTtcbiAgICAvLyByZW1vdmUgdGhlIG1hcmtlclxuICAgIHRoaXMucmVtb3ZlQ2xpY2tNYXJrZXIoKTtcblxuICAgIHRoaXMucmVtb3ZlSm9pbnRDb25zdHJhaW50KCk7XG4gIH1cblxuICBoYW5kbGVSYXlDYW5jZWxfKG9wdF9tZXNoKSB7XG4gICAgTWVudVJlbmRlcmVyLnNldEFjdGlvbl8ob3B0X21lc2gsIGZhbHNlKTtcbiAgfVxuXG4gIHN0YXRpYyBzZXRTZWxlY3RlZF8obWVzaCwgaXNTZWxlY3RlZCkge1xuICAgIC8vY29uc29sZS5sb2coJ3NldFNlbGVjdGVkXycsIGlzU2VsZWN0ZWQpO1xuICAgIG1lc2gubWF0ZXJpYWwuY29sb3IgPSBpc1NlbGVjdGVkID8gSElHSExJR0hUX0NPTE9SIDogREVGQVVMVF9DT0xPUjtcbiAgfVxuXG4gIHN0YXRpYyBzZXRBY3Rpb25fKG9wdF9tZXNoLCBpc0FjdGl2ZSkge1xuICAgIC8vY29uc29sZS5sb2coJ3NldEFjdGlvbl8nLCAhIW9wdF9tZXNoLCBpc0FjdGl2ZSk7XG4gICAgaWYgKG9wdF9tZXNoKSB7XG4gICAgICBvcHRfbWVzaC5tYXRlcmlhbC5jb2xvciA9IGlzQWN0aXZlID8gQUNUSVZFX0NPTE9SIDogSElHSExJR0hUX0NPTE9SO1xuICAgICAgaWYgKCFpc0FjdGl2ZSkge1xuICAgICAgICBvcHRfbWVzaC5tYXRlcmlhbC53aXJlZnJhbWUgPSAhb3B0X21lc2gubWF0ZXJpYWwud2lyZWZyYW1lO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldENsaWNrTWFya2VyKHgseSx6KSB7XG4gICAgaWYoIXRoaXMuY2xpY2tNYXJrZXIpe1xuICAgICAgY29uc3Qgc2hhcGUgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoMC4yLCA4LCA4KTtcbiAgICAgIHRoaXMuY2xpY2tNYXJrZXIgPSBuZXcgVEhSRUUuTWVzaChzaGFwZSwgdGhpcy5tYXJrZXJNYXRlcmlhbCk7XG4gICAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLmNsaWNrTWFya2VyKTtcbiAgICB9XG4gICAgdGhpcy5jbGlja01hcmtlci52aXNpYmxlID0gdHJ1ZTtcbiAgICB0aGlzLmNsaWNrTWFya2VyLnBvc2l0aW9uLnNldCh4LHkseik7XG4gIH1cblxuICByZW1vdmVDbGlja01hcmtlcigpe1xuICAgIHRoaXMuY2xpY2tNYXJrZXIudmlzaWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgYWRkUG9pbnRlckNvbnN0cmFpbnQoeCwgeSwgeiwgYm9keSkge1xuICAgIC8vIFRoZSBjYW5ub24gYm9keSBjb25zdHJhaW5lZCBieSB0aGUgcG9pbnRlciBqb2ludFxuICAgIHRoaXMuY29uc3RyYWluZWRCb2R5ID0gYm9keTtcblxuICAgIC8vIFZlY3RvciB0byB0aGUgY2xpY2tlZCBwb2ludCwgcmVsYXRpdmUgdG8gdGhlIGJvZHlcbiAgICBsZXQgdjEgPSBuZXcgQ0FOTk9OLlZlYzMoeCx5LHopLnZzdWIodGhpcy5jb25zdHJhaW5lZEJvZHkucG9zaXRpb24pO1xuXG4gICAgLy8gQXBwbHkgYW50aS1xdWF0ZXJuaW9uIHRvIHZlY3RvciB0byB0cmFuc2Zvcm0gaXQgaW50byB0aGUgbG9jYWwgYm9keSBjb29yZGluYXRlIHN5c3RlbVxuICAgIGxldCBhbnRpUm90ID0gdGhpcy5jb25zdHJhaW5lZEJvZHkucXVhdGVybmlvbi5pbnZlcnNlKCk7XG4gICAgbGV0IHBpdm90ID0gbmV3IENBTk5PTi5RdWF0ZXJuaW9uKGFudGlSb3QueCwgYW50aVJvdC55LCBhbnRpUm90LnosIGFudGlSb3Qudykudm11bHQodjEpOyAvLyBwaXZvdCBpcyBub3QgaW4gbG9jYWwgYm9keSBjb29yZGluYXRlc1xuXG4gICAgLy8gTW92ZSB0aGUgY2Fubm9uIGNsaWNrIG1hcmtlciBwYXJ0aWNsZSB0byB0aGUgY2xpY2sgcG9zaXRpb25cbiAgICB0aGlzLmpvaW50Qm9keS5wb3NpdGlvbi5zZXQoeCx5LHopO1xuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IGNvbnN0cmFpbnRcbiAgICAvLyBUaGUgcGl2b3QgZm9yIHRoZSBqb2ludEJvZHkgaXMgemVyb1xuICAgIHRoaXMucG9pbnRlckNvbnN0cmFpbnQgPSBuZXcgQ0FOTk9OLlBvaW50VG9Qb2ludENvbnN0cmFpbnQodGhpcy5jb25zdHJhaW5lZEJvZHksIHBpdm90LCB0aGlzLmpvaW50Qm9keSwgbmV3IENBTk5PTi5WZWMzKDAsMCwwKSk7XG5cbiAgICAvLyBBZGQgdGhlIGNvbnN0cmFpbnQgdG8gd29ybGRcbiAgICB0aGlzLndvcmxkLmFkZENvbnN0cmFpbnQodGhpcy5wb2ludGVyQ29uc3RyYWludCk7XG4gIH1cblxuICAvLyBUaGlzIGZ1bmN0aW9uIG1vdmVzIHRoZSB0cmFuc3BhcmVudCBqb2ludCBib2R5IHRvIGEgbmV3IHBvc2l0aW9uIGluIHNwYWNlXG4gIG1vdmVKb2ludFRvUG9pbnQoeCx5LHopIHtcbiAgICAvLyBNb3ZlIHRoZSBqb2ludCBib2R5IHRvIGEgbmV3IHBvc2l0aW9uXG4gICAgdGhpcy5qb2ludEJvZHkucG9zaXRpb24uc2V0KHgseSx6KTtcbiAgICB0aGlzLnBvaW50ZXJDb25zdHJhaW50LnVwZGF0ZSgpO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIHJvdGF0aW9uIGZyb20gdHdvIHZlY3RvcnMgb24gdGhlIHRvdWNocGFkXG4gIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzQwNTIwMTI5L3RocmVlLWpzLXJvdGF0ZS1vYmplY3QtdXNpbmctbW91c2UtYW5kLW9yYml0LWNvbnRyb2xcbiAgLy8gaHR0cDovL2pzZmlkZGxlLm5ldC94NG1ieTM4ZS8zL1xuICByb3RhdGVKb2ludChheGlzWCwgYXhpc1opIHtcbiAgICBpZiAodGhpcy50b3VjaFBhZFBvc2l0aW9uLnggIT09IDAgfHwgdGhpcy50b3VjaFBhZFBvc2l0aW9uLnogIT09IDApIHtcbiAgICAgIGxldCBkZWx0YU1vdmUgPSB7IHg6IGF4aXNYIC0gdGhpcy50b3VjaFBhZFBvc2l0aW9uLngsIHo6IGF4aXNaIC0gdGhpcy50b3VjaFBhZFBvc2l0aW9uLnogfTtcbiAgICAgIGlmICh0aGlzLnBvaW50ZXJDb25zdHJhaW50KSB7XG4gICAgICBsZXQgZGVsdGFSb3RhdGlvblF1YXRlcm5pb24gPSBuZXcgQ0FOTk9OLlF1YXRlcm5pb24oKVxuICAgICAgICAuc2V0RnJvbUV1bGVyKFxuICAgICAgICAgIE1lbnVSZW5kZXJlci50b1JhZGlhbnMoZGVsdGFNb3ZlLngpLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgTWVudVJlbmRlcmVyLnRvUmFkaWFucyhkZWx0YU1vdmUueiksXG4gICAgICAgICAgJ1hZWidcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5jb25zdHJhaW5lZEJvZHkucXVhdGVybmlvbiA9IG5ldyBDQU5OT04uUXVhdGVybmlvbigpLm11bHQoZGVsdGFSb3RhdGlvblF1YXRlcm5pb24sIHRoaXMuY29uc3RyYWluZWRCb2R5LnF1YXRlcm5pb24pO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnRvdWNoUGFkUG9zaXRpb24ueCA9IGF4aXNYO1xuICAgIHRoaXMudG91Y2hQYWRQb3NpdGlvbi56ID0gYXhpc1o7XG4gIH1cblxuICBzdGF0aWMgdG9SYWRpYW5zKGFuZ2xlKSB7XG4gICAgcmV0dXJuIGFuZ2xlICogKE1hdGguUEkgLyAxODApO1xuICB9XG5cbiAgcmVtb3ZlSm9pbnRDb25zdHJhaW50KCl7XG4gICAgLy8gUmVtb3ZlIGNvbnN0cmFpbnQgZnJvbSB3b3JsZFxuICAgIHRoaXMud29ybGQucmVtb3ZlQ29uc3RyYWludCh0aGlzLnBvaW50ZXJDb25zdHJhaW50KTtcbiAgICB0aGlzLnBvaW50ZXJDb25zdHJhaW50ID0gZmFsc2U7XG4gICAgdGhpcy50b3VjaFBhZFBvc2l0aW9uID0geyB4OiAwLCB6OiAwIH07XG4gIH1cblxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuY29uc3QgSEVBRF9FTEJPV19PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLjE1NSwgLTAuNDY1LCAtMC4xNSk7XG5jb25zdCBFTEJPV19XUklTVF9PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMC4yNSk7XG5jb25zdCBXUklTVF9DT05UUk9MTEVSX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDAuMDUpO1xuY29uc3QgQVJNX0VYVEVOU0lPTl9PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygtMC4wOCwgMC4xNCwgMC4wOCk7XG5cbmNvbnN0IEVMQk9XX0JFTkRfUkFUSU8gPSAwLjQ7IC8vIDQwJSBlbGJvdywgNjAlIHdyaXN0LlxuY29uc3QgRVhURU5TSU9OX1JBVElPX1dFSUdIVCA9IDAuNDtcblxuY29uc3QgTUlOX0FOR1VMQVJfU1BFRUQgPSAwLjYxOyAvLyAzNSBkZWdyZWVzIHBlciBzZWNvbmQgKGluIHJhZGlhbnMpLlxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGFybSBtb2RlbCBmb3IgdGhlIERheWRyZWFtIGNvbnRyb2xsZXIuIEZlZWQgaXQgYSBjYW1lcmEgYW5kXG4gKiB0aGUgY29udHJvbGxlci4gVXBkYXRlIGl0IG9uIGEgUkFGLlxuICpcbiAqIEdldCB0aGUgbW9kZWwncyBwb3NlIHVzaW5nIGdldFBvc2UoKS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT3JpZW50YXRpb25Bcm1Nb2RlbCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuaXNMZWZ0SGFuZGVkID0gZmFsc2U7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyBjb250cm9sbGVyIG9yaWVudGF0aW9ucy5cbiAgICB0aGlzLmNvbnRyb2xsZXJRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICB0aGlzLmxhc3RDb250cm9sbGVyUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyBoZWFkIG9yaWVudGF0aW9ucy5cbiAgICB0aGlzLmhlYWRRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIC8vIEN1cnJlbnQgaGVhZCBwb3NpdGlvbi5cbiAgICB0aGlzLmhlYWRQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLy8gUG9zaXRpb25zIG9mIG90aGVyIGpvaW50cyAobW9zdGx5IGZvciBkZWJ1Z2dpbmcpLlxuICAgIHRoaXMuZWxib3dQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHRoaXMud3Jpc3RQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLy8gQ3VycmVudCBhbmQgcHJldmlvdXMgdGltZXMgdGhlIG1vZGVsIHdhcyB1cGRhdGVkLlxuICAgIHRoaXMudGltZSA9IG51bGw7XG4gICAgdGhpcy5sYXN0VGltZSA9IG51bGw7XG5cbiAgICAvLyBSb290IHJvdGF0aW9uLlxuICAgIHRoaXMucm9vdFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgLy8gQ3VycmVudCBwb3NlIHRoYXQgdGhpcyBhcm0gbW9kZWwgY2FsY3VsYXRlcy5cbiAgICB0aGlzLnBvc2UgPSB7XG4gICAgICBvcmllbnRhdGlvbjogbmV3IFRIUkVFLlF1YXRlcm5pb24oKSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgVEhSRUUuVmVjdG9yMygpXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZXRob2RzIHRvIHNldCBjb250cm9sbGVyIGFuZCBoZWFkIHBvc2UgKGluIHdvcmxkIGNvb3JkaW5hdGVzKS5cbiAgICovXG4gIHNldENvbnRyb2xsZXJPcmllbnRhdGlvbihxdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5sYXN0Q29udHJvbGxlclEuY29weSh0aGlzLmNvbnRyb2xsZXJRKTtcbiAgICB0aGlzLmNvbnRyb2xsZXJRLmNvcHkocXVhdGVybmlvbik7XG4gIH1cblxuICBzZXRIZWFkT3JpZW50YXRpb24ocXVhdGVybmlvbikge1xuICAgIHRoaXMuaGVhZFEuY29weShxdWF0ZXJuaW9uKTtcbiAgfVxuXG4gIHNldEhlYWRQb3NpdGlvbihwb3NpdGlvbikge1xuICAgIHRoaXMuaGVhZFBvcy5jb3B5KHBvc2l0aW9uKTtcbiAgfVxuXG4gIHNldExlZnRIYW5kZWQoaXNMZWZ0SGFuZGVkKSB7XG4gICAgLy8gVE9ETyhzbXVzKTogSW1wbGVtZW50IG1lIVxuICAgIHRoaXMuaXNMZWZ0SGFuZGVkID0gaXNMZWZ0SGFuZGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCBvbiBhIFJBRi5cbiAgICovXG4gIHVwZGF0ZSgpIHtcbiAgICB0aGlzLnRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIC8vIElmIHRoZSBjb250cm9sbGVyJ3MgYW5ndWxhciB2ZWxvY2l0eSBpcyBhYm92ZSBhIGNlcnRhaW4gYW1vdW50LCB3ZSBjYW5cbiAgICAvLyBhc3N1bWUgdG9yc28gcm90YXRpb24gYW5kIG1vdmUgdGhlIGVsYm93IGpvaW50IHJlbGF0aXZlIHRvIHRoZVxuICAgIC8vIGNhbWVyYSBvcmllbnRhdGlvbi5cbiAgICBsZXQgaGVhZFlhd1EgPSB0aGlzLmdldEhlYWRZYXdPcmllbnRhdGlvbl8oKTtcbiAgICBsZXQgdGltZURlbHRhID0gKHRoaXMudGltZSAtIHRoaXMubGFzdFRpbWUpIC8gMTAwMDtcbiAgICBsZXQgYW5nbGVEZWx0YSA9IHRoaXMucXVhdEFuZ2xlXyh0aGlzLmxhc3RDb250cm9sbGVyUSwgdGhpcy5jb250cm9sbGVyUSk7XG4gICAgbGV0IGNvbnRyb2xsZXJBbmd1bGFyU3BlZWQgPSBhbmdsZURlbHRhIC8gdGltZURlbHRhO1xuICAgIGlmIChjb250cm9sbGVyQW5ndWxhclNwZWVkID4gTUlOX0FOR1VMQVJfU1BFRUQpIHtcbiAgICAgIC8vIEF0dGVudWF0ZSB0aGUgUm9vdCByb3RhdGlvbiBzbGlnaHRseS5cbiAgICAgIHRoaXMucm9vdFEuc2xlcnAoaGVhZFlhd1EsIGFuZ2xlRGVsdGEgLyAxMClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yb290US5jb3B5KGhlYWRZYXdRKTtcbiAgICB9XG5cbiAgICAvLyBXZSB3YW50IHRvIG1vdmUgdGhlIGVsYm93IHVwIGFuZCB0byB0aGUgY2VudGVyIGFzIHRoZSB1c2VyIHBvaW50cyB0aGVcbiAgICAvLyBjb250cm9sbGVyIHVwd2FyZHMsIHNvIHRoYXQgdGhleSBjYW4gZWFzaWx5IHNlZSB0aGUgY29udHJvbGxlciBhbmQgaXRzXG4gICAgLy8gdG9vbCB0aXBzLlxuICAgIGxldCBjb250cm9sbGVyRXVsZXIgPSBuZXcgVEhSRUUuRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbih0aGlzLmNvbnRyb2xsZXJRLCAnWVhaJyk7XG4gICAgbGV0IGNvbnRyb2xsZXJYRGVnID0gVEhSRUUuTWF0aC5yYWRUb0RlZyhjb250cm9sbGVyRXVsZXIueCk7XG4gICAgbGV0IGV4dGVuc2lvblJhdGlvID0gdGhpcy5jbGFtcF8oKGNvbnRyb2xsZXJYRGVnIC0gMTEpIC8gKDUwIC0gMTEpLCAwLCAxKTtcblxuICAgIC8vIENvbnRyb2xsZXIgb3JpZW50YXRpb24gaW4gY2FtZXJhIHNwYWNlLlxuICAgIGxldCBjb250cm9sbGVyQ2FtZXJhUSA9IHRoaXMucm9vdFEuY2xvbmUoKS5pbnZlcnNlKCk7XG4gICAgY29udHJvbGxlckNhbWVyYVEubXVsdGlwbHkodGhpcy5jb250cm9sbGVyUSk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZWxib3cgcG9zaXRpb24uXG4gICAgbGV0IGVsYm93UG9zID0gdGhpcy5lbGJvd1BvcztcbiAgICBlbGJvd1Bvcy5jb3B5KHRoaXMuaGVhZFBvcykuYWRkKEhFQURfRUxCT1dfT0ZGU0VUKTtcbiAgICBsZXQgZWxib3dPZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkoQVJNX0VYVEVOU0lPTl9PRkZTRVQpO1xuICAgIGVsYm93T2Zmc2V0Lm11bHRpcGx5U2NhbGFyKGV4dGVuc2lvblJhdGlvKTtcbiAgICBlbGJvd1Bvcy5hZGQoZWxib3dPZmZzZXQpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGpvaW50IGFuZ2xlcy4gR2VuZXJhbGx5IDQwJSBvZiByb3RhdGlvbiBhcHBsaWVkIHRvIGVsYm93LCA2MCVcbiAgICAvLyB0byB3cmlzdCwgYnV0IGlmIGNvbnRyb2xsZXIgaXMgcmFpc2VkIGhpZ2hlciwgbW9yZSByb3RhdGlvbiBjb21lcyBmcm9tXG4gICAgLy8gdGhlIHdyaXN0LlxuICAgIGxldCB0b3RhbEFuZ2xlID0gdGhpcy5xdWF0QW5nbGVfKGNvbnRyb2xsZXJDYW1lcmFRLCBuZXcgVEhSRUUuUXVhdGVybmlvbigpKTtcbiAgICBsZXQgdG90YWxBbmdsZURlZyA9IFRIUkVFLk1hdGgucmFkVG9EZWcodG90YWxBbmdsZSk7XG4gICAgbGV0IGxlcnBTdXBwcmVzc2lvbiA9IDEgLSBNYXRoLnBvdyh0b3RhbEFuZ2xlRGVnIC8gMTgwLCA0KTsgLy8gVE9ETyhzbXVzKTogPz8/XG5cbiAgICBsZXQgZWxib3dSYXRpbyA9IEVMQk9XX0JFTkRfUkFUSU87XG4gICAgbGV0IHdyaXN0UmF0aW8gPSAxIC0gRUxCT1dfQkVORF9SQVRJTztcbiAgICBsZXQgbGVycFZhbHVlID0gbGVycFN1cHByZXNzaW9uICpcbiAgICAgICAgKGVsYm93UmF0aW8gKyB3cmlzdFJhdGlvICogZXh0ZW5zaW9uUmF0aW8gKiBFWFRFTlNJT05fUkFUSU9fV0VJR0hUKTtcblxuICAgIGxldCB3cmlzdFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNsZXJwKGNvbnRyb2xsZXJDYW1lcmFRLCBsZXJwVmFsdWUpO1xuICAgIGxldCBpbnZXcmlzdFEgPSB3cmlzdFEuaW52ZXJzZSgpO1xuICAgIGxldCBlbGJvd1EgPSBjb250cm9sbGVyQ2FtZXJhUS5jbG9uZSgpLm11bHRpcGx5KGludldyaXN0USk7XG5cbiAgICAvLyBDYWxjdWxhdGUgb3VyIGZpbmFsIGNvbnRyb2xsZXIgcG9zaXRpb24gYmFzZWQgb24gYWxsIG91ciBqb2ludCByb3RhdGlvbnNcbiAgICAvLyBhbmQgbGVuZ3Rocy5cbiAgICAvKlxuICAgIHBvc2l0aW9uXyA9XG4gICAgICByb290X3JvdF8gKiAoXG4gICAgICAgIGNvbnRyb2xsZXJfcm9vdF9vZmZzZXRfICtcbjI6ICAgICAgKGFybV9leHRlbnNpb25fICogYW10X2V4dGVuc2lvbikgK1xuMTogICAgICBlbGJvd19yb3QgKiAoa0NvbnRyb2xsZXJGb3JlYXJtICsgKHdyaXN0X3JvdCAqIGtDb250cm9sbGVyUG9zaXRpb24pKVxuICAgICAgKTtcbiAgICAqL1xuICAgIGxldCB3cmlzdFBvcyA9IHRoaXMud3Jpc3RQb3M7XG4gICAgd3Jpc3RQb3MuY29weShXUklTVF9DT05UUk9MTEVSX09GRlNFVCk7XG4gICAgd3Jpc3RQb3MuYXBwbHlRdWF0ZXJuaW9uKHdyaXN0USk7XG4gICAgd3Jpc3RQb3MuYWRkKEVMQk9XX1dSSVNUX09GRlNFVCk7XG4gICAgd3Jpc3RQb3MuYXBwbHlRdWF0ZXJuaW9uKGVsYm93USk7XG4gICAgd3Jpc3RQb3MuYWRkKHRoaXMuZWxib3dQb3MpO1xuXG4gICAgbGV0IG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShBUk1fRVhURU5TSU9OX09GRlNFVCk7XG4gICAgb2Zmc2V0Lm11bHRpcGx5U2NhbGFyKGV4dGVuc2lvblJhdGlvKTtcblxuICAgIGxldCBwb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weSh0aGlzLndyaXN0UG9zKTtcbiAgICBwb3NpdGlvbi5hZGQob2Zmc2V0KTtcbiAgICBwb3NpdGlvbi5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG5cbiAgICBsZXQgb3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLmNvcHkodGhpcy5jb250cm9sbGVyUSk7XG5cbiAgICAvLyBTZXQgdGhlIHJlc3VsdGluZyBwb3NlIG9yaWVudGF0aW9uIGFuZCBwb3NpdGlvbi5cbiAgICB0aGlzLnBvc2Uub3JpZW50YXRpb24uY29weShvcmllbnRhdGlvbik7XG4gICAgdGhpcy5wb3NlLnBvc2l0aW9uLmNvcHkocG9zaXRpb24pO1xuXG4gICAgdGhpcy5sYXN0VGltZSA9IHRoaXMudGltZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwb3NlIGNhbGN1bGF0ZWQgYnkgdGhlIG1vZGVsLlxuICAgKi9cbiAgZ2V0UG9zZSgpIHtcbiAgICByZXR1cm4gdGhpcy5wb3NlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlYnVnIG1ldGhvZHMgZm9yIHJlbmRlcmluZyB0aGUgYXJtIG1vZGVsLlxuICAgKi9cbiAgZ2V0Rm9yZWFybUxlbmd0aCgpIHtcbiAgICByZXR1cm4gRUxCT1dfV1JJU1RfT0ZGU0VULmxlbmd0aCgpO1xuICB9XG5cbiAgZ2V0RWxib3dQb3NpdGlvbigpIHtcbiAgICBsZXQgb3V0ID0gdGhpcy5lbGJvd1Bvcy5jbG9uZSgpO1xuICAgIHJldHVybiBvdXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm9vdFEpO1xuICB9XG5cbiAgZ2V0V3Jpc3RQb3NpdGlvbigpIHtcbiAgICBsZXQgb3V0ID0gdGhpcy53cmlzdFBvcy5jbG9uZSgpO1xuICAgIHJldHVybiBvdXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm9vdFEpO1xuICB9XG5cbiAgZ2V0SGVhZFlhd09yaWVudGF0aW9uXygpIHtcbiAgICBsZXQgaGVhZEV1bGVyID0gbmV3IFRIUkVFLkV1bGVyKCkuc2V0RnJvbVF1YXRlcm5pb24odGhpcy5oZWFkUSwgJ1lYWicpO1xuICAgIGhlYWRFdWxlci54ID0gMDtcbiAgICBoZWFkRXVsZXIueiA9IDA7XG4gICAgbGV0IGRlc3RpbmF0aW9uUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKGhlYWRFdWxlcik7XG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uUTtcbiAgfVxuXG4gIGNsYW1wXyh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgodmFsdWUsIG1pbiksIG1heCk7XG4gIH1cblxuICBxdWF0QW5nbGVfKHExLCBxMikge1xuICAgIGxldCB2ZWMxID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIGxldCB2ZWMyID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIHZlYzEuYXBwbHlRdWF0ZXJuaW9uKHExKTtcbiAgICB2ZWMyLmFwcGx5UXVhdGVybmlvbihxMik7XG4gICAgcmV0dXJuIHZlYzEuYW5nbGVUbyh2ZWMyKTtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuaW1wb3J0IEludGVyYWN0aW9uTW9kZXMgZnJvbSAnLi9yYXktaW50ZXJhY3Rpb24tbW9kZXMnXG5pbXBvcnQge2lzTW9iaWxlfSBmcm9tICcuL3V0aWwnXG5cbmNvbnN0IERSQUdfRElTVEFOQ0VfUFggPSAxMDtcblxuLyoqXG4gKiBFbnVtZXJhdGVzIGFsbCBwb3NzaWJsZSBpbnRlcmFjdGlvbiBtb2Rlcy4gU2V0cyB1cCBhbGwgZXZlbnQgaGFuZGxlcnMgKG1vdXNlLFxuICogdG91Y2gsIGV0YyksIGludGVyZmFjZXMgd2l0aCBnYW1lcGFkIEFQSS5cbiAqXG4gKiBFbWl0cyBldmVudHM6XG4gKiAgICBhY3Rpb246IElucHV0IGlzIGFjdGl2YXRlZCAobW91c2Vkb3duLCB0b3VjaHN0YXJ0LCBkYXlkcmVhbSBjbGljaywgdml2ZSB0cmlnZ2VyKS5cbiAqICAgIHJlbGVhc2U6IElucHV0IGlzIGRlYWN0aXZhdGVkIChtb3VzZXVwLCB0b3VjaGVuZCwgZGF5ZHJlYW0gcmVsZWFzZSwgdml2ZSByZWxlYXNlKS5cbiAqICAgIGNhbmNlbDogSW5wdXQgaXMgY2FuY2VsZWQgKGVnLiB3ZSBzY3JvbGxlZCBpbnN0ZWFkIG9mIHRhcHBpbmcgb24gbW9iaWxlL2Rlc2t0b3ApLlxuICogICAgcG9pbnRlcm1vdmUoMkQgcG9zaXRpb24pOiBUaGUgcG9pbnRlciBpcyBtb3ZlZCAobW91c2Ugb3IgdG91Y2gpLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYXlDb250cm9sbGVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3Iob3B0X2VsKSB7XG4gICAgc3VwZXIoKTtcbiAgICBsZXQgZWwgPSBvcHRfZWwgfHwgd2luZG93O1xuXG4gICAgLy8gSGFuZGxlIGludGVyYWN0aW9ucy5cbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2VEb3duXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlVXBfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydF8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZV8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmRfLmJpbmQodGhpcykpO1xuXG4gICAgLy8gVGhlIHBvc2l0aW9uIG9mIHRoZSBwb2ludGVyLlxuICAgIHRoaXMucG9pbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgLy8gVGhlIHByZXZpb3VzIHBvc2l0aW9uIG9mIHRoZSBwb2ludGVyLlxuICAgIHRoaXMubGFzdFBvaW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIC8vIFBvc2l0aW9uIG9mIHBvaW50ZXIgaW4gTm9ybWFsaXplZCBEZXZpY2UgQ29vcmRpbmF0ZXMgKE5EQykuXG4gICAgdGhpcy5wb2ludGVyTmRjID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAvLyBIb3cgbXVjaCB3ZSBoYXZlIGRyYWdnZWQgKGlmIHdlIGFyZSBkcmFnZ2luZykuXG4gICAgdGhpcy5kcmFnRGlzdGFuY2UgPSAwO1xuICAgIC8vIEFyZSB3ZSBkcmFnZ2luZyBvciBub3QuXG4gICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgLy8gSXMgcG9pbnRlciBhY3RpdmUgb3Igbm90LlxuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IGZhbHNlO1xuICAgIC8vIElzIHRoaXMgYSBzeW50aGV0aWMgbW91c2UgZXZlbnQ/XG4gICAgdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQgPSBmYWxzZTtcblxuICAgIC8vIEdhbWVwYWQgZXZlbnRzLlxuICAgIHRoaXMuZ2FtZXBhZCA9IG51bGw7XG5cbiAgICAvLyBWUiBFdmVudHMuXG4gICAgaWYgKCFuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cykge1xuICAgICAgY29uc29sZS53YXJuKCdXZWJWUiBBUEkgbm90IGF2YWlsYWJsZSEgQ29uc2lkZXIgdXNpbmcgdGhlIHdlYnZyLXBvbHlmaWxsLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cygpLnRoZW4oKGRpc3BsYXlzKSA9PiB7XG4gICAgICAgIHRoaXMudnJEaXNwbGF5ID0gZGlzcGxheXNbMF07XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBnZXRJbnRlcmFjdGlvbk1vZGUoKSB7XG4gICAgLy8gVE9ETzogRGVidWdnaW5nIG9ubHkuXG4gICAgLy9yZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5EQVlEUkVBTTtcblxuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG5cbiAgICBpZiAoZ2FtZXBhZCkge1xuICAgICAgbGV0IHBvc2UgPSBnYW1lcGFkLnBvc2U7XG4gICAgICAvLyBJZiB0aGVyZSdzIGEgZ2FtZXBhZCBjb25uZWN0ZWQsIGRldGVybWluZSBpZiBpdCdzIERheWRyZWFtIG9yIGEgVml2ZS5cbiAgICAgIGlmIChwb3NlLmhhc1Bvc2l0aW9uKSB7XG4gICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzZET0Y7XG4gICAgICB9XG5cbiAgICAgIGlmIChwb3NlLmhhc09yaWVudGF0aW9uKSB7XG4gICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0Y7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkLCBpdCBtaWdodCBiZSBDYXJkYm9hcmQsIG1hZ2ljIHdpbmRvdyBvciBkZXNrdG9wLlxuICAgICAgaWYgKGlzTW9iaWxlKCkpIHtcbiAgICAgICAgLy8gRWl0aGVyIENhcmRib2FyZCBvciBtYWdpYyB3aW5kb3csIGRlcGVuZGluZyBvbiB3aGV0aGVyIHdlIGFyZVxuICAgICAgICAvLyBwcmVzZW50aW5nLlxuICAgICAgICBpZiAodGhpcy52ckRpc3BsYXkgJiYgdGhpcy52ckRpc3BsYXkuaXNQcmVzZW50aW5nKSB7XG4gICAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVlJfMERPRjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2UgbXVzdCBiZSBvbiBkZXNrdG9wLlxuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5NT1VTRTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQnkgZGVmYXVsdCwgdXNlIFRPVUNILlxuICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlRPVUNIO1xuICB9XG5cbiAgZ2V0R2FtZXBhZFBvc2UoKSB7XG4gICAgbGV0IGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcbiAgICByZXR1cm4gZ2FtZXBhZC5wb3NlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpZiB0aGVyZSBpcyBhbiBhY3RpdmUgdG91Y2ggZXZlbnQgZ29pbmcgb24uXG4gICAqIE9ubHkgcmVsZXZhbnQgb24gdG91Y2ggZGV2aWNlc1xuICAgKi9cbiAgZ2V0SXNUb3VjaEFjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1RvdWNoQWN0aXZlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIGNsaWNrIGlzIHRoZSBjYXJkYm9hcmQtY29tcGF0aWJsZSBmYWxsYmFja1xuICAgKiBjbGljayBvbiBEYXlkcmVhbSBjb250cm9sbGVycyBzbyB0aGF0IHdlIGNhbiBkZWR1cGxpY2F0ZSBpdC5cbiAgICogVE9ETyhrbGF1c3cpOiBJdCB3b3VsZCBiZSBuaWNlIHRvIGJlIGFibGUgdG8gbW92ZSBpbnRlcmFjdGlvbnNcbiAgICogdG8gdGhpcyBldmVudCBzaW5jZSBpdCBjb3VudHMgYXMgYSB1c2VyIGFjdGlvbiB3aGlsZSBjb250cm9sbGVyXG4gICAqIGNsaWNrcyBkb24ndC4gQnV0IHRoYXQgd291bGQgcmVxdWlyZSBsYXJnZXIgcmVmYWN0b3JpbmcuXG4gICAqL1xuICBpc0NhcmRib2FyZENvbXBhdENsaWNrKGUpIHtcbiAgICBsZXQgbW9kZSA9IHRoaXMuZ2V0SW50ZXJhY3Rpb25Nb2RlKCk7XG4gICAgaWYgKG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GICYmIGUuc2NyZWVuWCA9PSAwICYmIGUuc2NyZWVuWSA9PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc2V0U2l6ZShzaXplKSB7XG4gICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICBsZXQgbW9kZSA9IHRoaXMuZ2V0SW50ZXJhY3Rpb25Nb2RlKCk7XG4gICAgaWYgKG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GIHx8IG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GKSB7XG4gICAgICAvLyBJZiB3ZSdyZSBkZWFsaW5nIHdpdGggYSBnYW1lcGFkLCBjaGVjayBldmVyeSBhbmltYXRpb24gZnJhbWUgZm9yIGFcbiAgICAgIC8vIHByZXNzZWQgYWN0aW9uLlxuICAgICAgbGV0IGlzR2FtZXBhZFByZXNzZWQgPSB0aGlzLmdldEdhbWVwYWRCdXR0b25QcmVzc2VkXygpO1xuICAgICAgaWYgKGlzR2FtZXBhZFByZXNzZWQgJiYgIXRoaXMud2FzR2FtZXBhZFByZXNzZWQpIHtcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG4gICAgICB9XG4gICAgICBpZiAoIWlzR2FtZXBhZFByZXNzZWQgJiYgdGhpcy53YXNHYW1lcGFkUHJlc3NlZCkge1xuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXl1cCcpO1xuICAgICAgfVxuICAgICAgdGhpcy53YXNHYW1lcGFkUHJlc3NlZCA9IGlzR2FtZXBhZFByZXNzZWQ7XG5cbiAgICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXlkcmFnJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0R2FtZXBhZEJ1dHRvblByZXNzZWRfKCkge1xuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG4gICAgaWYgKCFnYW1lcGFkKSB7XG4gICAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQsIHRoZSBidXR0b24gd2FzIG5vdCBwcmVzc2VkLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBmb3IgY2xpY2tzLlxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZ2FtZXBhZC5idXR0b25zLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZiAoZ2FtZXBhZC5idXR0b25zW2pdLnByZXNzZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIG9uTW91c2VEb3duXyhlKSB7XG4gICAgaWYgKHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50KSByZXR1cm47XG4gICAgaWYgKHRoaXMuaXNDYXJkYm9hcmRDb21wYXRDbGljayhlKSkgcmV0dXJuO1xuXG4gICAgdGhpcy5zdGFydERyYWdnaW5nXyhlKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nKTtcbiAgfVxuXG4gIG9uTW91c2VNb3ZlXyhlKSB7XG4gICAgaWYgKHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50KSByZXR1cm47XG5cbiAgICB0aGlzLnVwZGF0ZVBvaW50ZXJfKGUpO1xuICAgIHRoaXMudXBkYXRlRHJhZ0Rpc3RhbmNlXygpO1xuICAgIHRoaXMuZW1pdCgncG9pbnRlcm1vdmUnLCB0aGlzLnBvaW50ZXJOZGMpO1xuICB9XG5cbiAgb25Nb3VzZVVwXyhlKSB7XG4gICAgdmFyIGlzU3ludGhldGljID0gdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQ7XG4gICAgdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQgPSBmYWxzZTtcbiAgICBpZiAoaXNTeW50aGV0aWMpIHJldHVybjtcbiAgICBpZiAodGhpcy5pc0NhcmRib2FyZENvbXBhdENsaWNrKGUpKSByZXR1cm47XG5cbiAgICB0aGlzLmVuZERyYWdnaW5nXygpO1xuICB9XG5cbiAgb25Ub3VjaFN0YXJ0XyhlKSB7XG4gICAgdGhpcy5pc1RvdWNoQWN0aXZlID0gdHJ1ZTtcbiAgICB2YXIgdCA9IGUudG91Y2hlc1swXTtcbiAgICB0aGlzLnN0YXJ0RHJhZ2dpbmdfKHQpO1xuICAgIHRoaXMudXBkYXRlVG91Y2hQb2ludGVyXyhlKTtcblxuICAgIHRoaXMuZW1pdCgncG9pbnRlcm1vdmUnLCB0aGlzLnBvaW50ZXJOZGMpO1xuICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xuICB9XG5cbiAgb25Ub3VjaE1vdmVfKGUpIHtcbiAgICB0aGlzLnVwZGF0ZVRvdWNoUG9pbnRlcl8oZSk7XG4gICAgdGhpcy51cGRhdGVEcmFnRGlzdGFuY2VfKCk7XG4gIH1cblxuICBvblRvdWNoRW5kXyhlKSB7XG4gICAgdGhpcy5lbmREcmFnZ2luZ18oKTtcblxuICAgIC8vIFN1cHByZXNzIGR1cGxpY2F0ZSBldmVudHMgZnJvbSBzeW50aGV0aWMgbW91c2UgZXZlbnRzLlxuICAgIHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50ID0gdHJ1ZTtcbiAgICB0aGlzLmlzVG91Y2hBY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIHVwZGF0ZVRvdWNoUG9pbnRlcl8oZSkge1xuICAgIC8vIElmIHRoZXJlJ3Mgbm8gdG91Y2hlcyBhcnJheSwgaWdub3JlLlxuICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1JlY2VpdmVkIHRvdWNoIGV2ZW50IHdpdGggbm8gdG91Y2hlcy4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHQgPSBlLnRvdWNoZXNbMF07XG4gICAgdGhpcy51cGRhdGVQb2ludGVyXyh0KTtcbiAgfVxuXG4gIHVwZGF0ZVBvaW50ZXJfKGUpIHtcbiAgICAvLyBIb3cgbXVjaCB0aGUgcG9pbnRlciBtb3ZlZC5cbiAgICB0aGlzLnBvaW50ZXIuc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgICB0aGlzLnBvaW50ZXJOZGMueCA9IChlLmNsaWVudFggLyB0aGlzLnNpemUud2lkdGgpICogMiAtIDE7XG4gICAgdGhpcy5wb2ludGVyTmRjLnkgPSAtIChlLmNsaWVudFkgLyB0aGlzLnNpemUuaGVpZ2h0KSAqIDIgKyAxO1xuICB9XG5cbiAgdXBkYXRlRHJhZ0Rpc3RhbmNlXygpIHtcbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICB2YXIgZGlzdGFuY2UgPSB0aGlzLmxhc3RQb2ludGVyLnN1Yih0aGlzLnBvaW50ZXIpLmxlbmd0aCgpO1xuICAgICAgdGhpcy5kcmFnRGlzdGFuY2UgKz0gZGlzdGFuY2U7XG4gICAgICB0aGlzLmxhc3RQb2ludGVyLmNvcHkodGhpcy5wb2ludGVyKTtcblxuXG4gICAgICAvL2NvbnNvbGUubG9nKCdkcmFnRGlzdGFuY2UnLCB0aGlzLmRyYWdEaXN0YW5jZSk7XG4gICAgICBpZiAodGhpcy5kcmFnRGlzdGFuY2UgPiBEUkFHX0RJU1RBTkNFX1BYKSB7XG4gICAgICAgIHRoaXMuZW1pdCgncmF5Y2FuY2VsJyk7XG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0YXJ0RHJhZ2dpbmdfKGUpIHtcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xuICAgIHRoaXMubGFzdFBvaW50ZXIuc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgfVxuXG4gIGVuZERyYWdnaW5nXygpIHtcbiAgICBpZiAodGhpcy5kcmFnRGlzdGFuY2UgPCBEUkFHX0RJU1RBTkNFX1BYKSB7XG4gICAgICB0aGlzLmVtaXQoJ3JheXVwJyk7XG4gICAgfVxuICAgIHRoaXMuZHJhZ0Rpc3RhbmNlID0gMDtcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBmaXJzdCBWUi1lbmFibGVkIGdhbWVwYWQuXG4gICAqL1xuICBnZXRWUkdhbWVwYWRfKCkge1xuICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCBBUEksIHRoZXJlJ3Mgbm8gZ2FtZXBhZC5cbiAgICBpZiAoIW5hdmlnYXRvci5nZXRHYW1lcGFkcykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGdhbWVwYWRzID0gbmF2aWdhdG9yLmdldEdhbWVwYWRzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lcGFkcy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIGdhbWVwYWQgPSBnYW1lcGFkc1tpXTtcblxuICAgICAgLy8gVGhlIGFycmF5IG1heSBjb250YWluIHVuZGVmaW5lZCBnYW1lcGFkcywgc28gY2hlY2sgZm9yIHRoYXQgYXMgd2VsbCBhc1xuICAgICAgLy8gYSBub24tbnVsbCBwb3NlLlxuICAgICAgaWYgKGdhbWVwYWQgJiYgZ2FtZXBhZC5wb3NlKSB7XG4gICAgICAgIHJldHVybiBnYW1lcGFkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IE9yaWVudGF0aW9uQXJtTW9kZWwgZnJvbSAnLi9vcmllbnRhdGlvbi1hcm0tbW9kZWwnXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnXG5pbXBvcnQgUmF5UmVuZGVyZXIgZnJvbSAnLi9yYXktcmVuZGVyZXInXG5pbXBvcnQgUmF5Q29udHJvbGxlciBmcm9tICcuL3JheS1jb250cm9sbGVyJ1xuaW1wb3J0IEludGVyYWN0aW9uTW9kZXMgZnJvbSAnLi9yYXktaW50ZXJhY3Rpb24tbW9kZXMnXG5cbi8qKlxuICogQVBJIHdyYXBwZXIgZm9yIHRoZSBpbnB1dCBsaWJyYXJ5LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYXlJbnB1dCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKGNhbWVyYSwgb3B0X2VsKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgUmF5UmVuZGVyZXIoY2FtZXJhKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIgPSBuZXcgUmF5Q29udHJvbGxlcihvcHRfZWwpO1xuXG4gICAgLy8gQXJtIG1vZGVsIG5lZWRlZCB0byB0cmFuc2Zvcm0gY29udHJvbGxlciBvcmllbnRhdGlvbiBpbnRvIHByb3BlciBwb3NlLlxuICAgIHRoaXMuYXJtTW9kZWwgPSBuZXcgT3JpZW50YXRpb25Bcm1Nb2RlbCgpO1xuXG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXlkb3duJywgdGhpcy5vblJheURvd25fLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5dXAnLCB0aGlzLm9uUmF5VXBfLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5Y2FuY2VsJywgdGhpcy5vblJheUNhbmNlbF8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdwb2ludGVybW92ZScsIHRoaXMub25Qb2ludGVyTW92ZV8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXlkcmFnJywgdGhpcy5vblJheURyYWdfLmJpbmQodGhpcykpO1xuICAgIHRoaXMucmVuZGVyZXIub24oJ3JheW92ZXInLCAobWVzaCkgPT4geyB0aGlzLmVtaXQoJ3JheW92ZXInLCBtZXNoKSB9KTtcbiAgICB0aGlzLnJlbmRlcmVyLm9uKCdyYXlvdXQnLCAobWVzaCkgPT4geyB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpIH0pO1xuXG4gICAgLy8gQnkgZGVmYXVsdCwgcHV0IHRoZSBwb2ludGVyIG9mZnNjcmVlbi5cbiAgICB0aGlzLnBvaW50ZXJOZGMgPSBuZXcgVEhSRUUuVmVjdG9yMigxLCAxKTtcblxuICAgIC8vIEV2ZW50IGhhbmRsZXJzLlxuICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgfVxuXG4gIGFkZChvYmplY3QsIGhhbmRsZXJzKSB7XG4gICAgdGhpcy5yZW5kZXJlci5hZGQob2JqZWN0LCBoYW5kbGVycyk7XG4gICAgdGhpcy5oYW5kbGVyc1tvYmplY3QuaWRdID0gaGFuZGxlcnM7XG4gIH1cblxuICByZW1vdmUob2JqZWN0KSB7XG4gICAgdGhpcy5yZW5kZXJlci5yZW1vdmUob2JqZWN0KTtcbiAgICBkZWxldGUgdGhpcy5oYW5kbGVyc1tvYmplY3QuaWRdXG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgbGV0IGxvb2tBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICBsb29rQXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuXG4gICAgbGV0IG1vZGUgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0SW50ZXJhY3Rpb25Nb2RlKCk7XG4gICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuTU9VU0U6XG4gICAgICAgIC8vIERlc2t0b3AgbW91c2UgbW9kZSwgbW91c2UgY29vcmRpbmF0ZXMgYXJlIHdoYXQgbWF0dGVycy5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb2ludGVyKHRoaXMucG9pbnRlck5kYyk7XG4gICAgICAgIC8vIEhpZGUgdGhlIHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eShmYWxzZSk7XG5cbiAgICAgICAgLy8gSW4gbW91c2UgbW9kZSByYXkgcmVuZGVyZXIgaXMgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVE9VQ0g6XG4gICAgICAgIC8vIE1vYmlsZSBtYWdpYyB3aW5kb3cgbW9kZS4gVG91Y2ggY29vcmRpbmF0ZXMgbWF0dGVyLCBidXQgd2Ugd2FudCB0b1xuICAgICAgICAvLyBoaWRlIHRoZSByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvaW50ZXIodGhpcy5wb2ludGVyTmRjKTtcblxuICAgICAgICAvLyBIaWRlIHRoZSByYXkgYW5kIHRoZSByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkoZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KGZhbHNlKTtcblxuICAgICAgICAvLyBJbiB0b3VjaCBtb2RlIHRoZSByYXkgcmVuZGVyZXIgaXMgb25seSBhY3RpdmUgb24gdG91Y2guXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRoaXMuY29udHJvbGxlci5nZXRJc1RvdWNoQWN0aXZlKCkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzBET0Y6XG4gICAgICAgIC8vIENhcmRib2FyZCBtb2RlLCB3ZSdyZSBkZWFsaW5nIHdpdGggYSBnYXplIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24odGhpcy5jYW1lcmEucG9zaXRpb24pO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuXG4gICAgICAgIC8vIFJldGljbGUgb25seS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eSh0cnVlKTtcblxuICAgICAgICAvLyBSYXkgcmVuZGVyZXIgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRjpcbiAgICAgICAgLy8gRGF5ZHJlYW0sIG91ciBvcmlnaW4gaXMgc2xpZ2h0bHkgb2ZmIChkZXBlbmRpbmcgb24gaGFuZGVkbmVzcykuXG4gICAgICAgIC8vIEJ1dCB3ZSBzaG91bGQgYmUgdXNpbmcgdGhlIG9yaWVudGF0aW9uIGZyb20gdGhlIGdhbWVwYWQuXG4gICAgICAgIC8vIFRPRE8oc211cyk6IEltcGxlbWVudCB0aGUgcmVhbCBhcm0gbW9kZWwuXG4gICAgICAgIHZhciBwb3NlID0gdGhpcy5jb250cm9sbGVyLmdldEdhbWVwYWRQb3NlKCk7XG5cbiAgICAgICAgLy8gRGVidWcgb25seTogdXNlIGNhbWVyYSBhcyBpbnB1dCBjb250cm9sbGVyLlxuICAgICAgICAvL2xldCBjb250cm9sbGVyT3JpZW50YXRpb24gPSB0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uO1xuICAgICAgICBsZXQgY29udHJvbGxlck9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5mcm9tQXJyYXkocG9zZS5vcmllbnRhdGlvbik7XG5cbiAgICAgICAgLy8gVHJhbnNmb3JtIHRoZSBjb250cm9sbGVyIGludG8gdGhlIGNhbWVyYSBjb29yZGluYXRlIHN5c3RlbS5cbiAgICAgICAgLypcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLm11bHRpcGx5KFxuICAgICAgICAgICAgbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLCBNYXRoLlBJKSk7XG4gICAgICAgIGNvbnRyb2xsZXJPcmllbnRhdGlvbi54ICo9IC0xO1xuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ueiAqPSAtMTtcbiAgICAgICAgKi9cblxuICAgICAgICAvLyBGZWVkIGNhbWVyYSBhbmQgY29udHJvbGxlciBpbnRvIHRoZSBhcm0gbW9kZWwuXG4gICAgICAgIHRoaXMuYXJtTW9kZWwuc2V0SGVhZE9yaWVudGF0aW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnNldEhlYWRQb3NpdGlvbih0aGlzLmNhbWVyYS5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMuYXJtTW9kZWwuc2V0Q29udHJvbGxlck9yaWVudGF0aW9uKGNvbnRyb2xsZXJPcmllbnRhdGlvbik7XG4gICAgICAgIHRoaXMuYXJtTW9kZWwudXBkYXRlKCk7XG5cbiAgICAgICAgLy8gR2V0IHJlc3VsdGluZyBwb3NlIGFuZCBjb25maWd1cmUgdGhlIHJlbmRlcmVyLlxuICAgICAgICBsZXQgbW9kZWxQb3NlID0gdGhpcy5hcm1Nb2RlbC5nZXRQb3NlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24obW9kZWxQb3NlLnBvc2l0aW9uKTtcbiAgICAgICAgLy90aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKG5ldyBUSFJFRS5WZWN0b3IzKCkpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKG1vZGVsUG9zZS5vcmllbnRhdGlvbik7XG4gICAgICAgIC8vdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihjb250cm9sbGVyT3JpZW50YXRpb24pO1xuXG4gICAgICAgIC8vIFNob3cgcmF5IGFuZCByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkodHJ1ZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XG5cbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzZET0Y6XG4gICAgICAgIC8vIFZpdmUsIG9yaWdpbiBkZXBlbmRzIG9uIHRoZSBwb3NpdGlvbiBvZiB0aGUgY29udHJvbGxlci5cbiAgICAgICAgLy8gVE9ETyhzbXVzKS4uLlxuICAgICAgICB2YXIgcG9zZSA9IHRoaXMuY29udHJvbGxlci5nZXRHYW1lcGFkUG9zZSgpO1xuXG4gICAgICAgIC8vIENoZWNrIHRoYXQgdGhlIHBvc2UgaXMgdmFsaWQuXG4gICAgICAgIGlmICghcG9zZS5vcmllbnRhdGlvbiB8fCAhcG9zZS5wb3NpdGlvbikge1xuICAgICAgICAgIGNvbnNvbGUud2FybignSW52YWxpZCBnYW1lcGFkIHBvc2UuIENhblxcJ3QgdXBkYXRlIHJheS4nKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBsZXQgb3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLmZyb21BcnJheShwb3NlLm9yaWVudGF0aW9uKTtcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5mcm9tQXJyYXkocG9zZS5wb3NpdGlvbik7XG5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihvcmllbnRhdGlvbik7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24ocG9zaXRpb24pO1xuXG4gICAgICAgIC8vIFNob3cgcmF5IGFuZCByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkodHJ1ZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XG5cbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBpbnRlcmFjdGlvbiBtb2RlLicpO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlcmVyLnVwZGF0ZSgpO1xuICAgIHRoaXMuY29udHJvbGxlci51cGRhdGUoKTtcbiAgfVxuXG4gIHNldFNpemUoc2l6ZSkge1xuICAgIHRoaXMuY29udHJvbGxlci5zZXRTaXplKHNpemUpO1xuICB9XG5cbiAgZ2V0TWVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXRSZXRpY2xlUmF5TWVzaCgpO1xuICB9XG5cbiAgZ2V0T3JpZ2luKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLmdldE9yaWdpbigpO1xuICB9XG5cbiAgZ2V0RGlyZWN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLmdldERpcmVjdGlvbigpO1xuICB9XG5cbiAgZ2V0UmlnaHREaXJlY3Rpb24oKSB7XG4gICAgbGV0IGxvb2tBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICBsb29rQXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuICAgIHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMygpLmNyb3NzVmVjdG9ycyhsb29rQXQsIHRoaXMuY2FtZXJhLnVwKTtcbiAgfVxuXG4gIG9uUmF5RG93bl8oZSkge1xuICAgIC8vY29uc29sZS5sb2coJ29uUmF5RG93bl8nKTtcblxuICAgIC8vIEZvcmNlIHRoZSByZW5kZXJlciB0byByYXljYXN0LlxuICAgIHRoaXMucmVuZGVyZXIudXBkYXRlKCk7XG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5ZG93bicsIG1lc2gpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gIH1cblxuICBvblJheURyYWdfKCkge1xuICAgIHRoaXMucmVuZGVyZXIuc2V0RHJhZ2dpbmcodHJ1ZSk7XG4gICAgdGhpcy5lbWl0KCdyYXlkcmFnJyk7XG4gIH1cblxuICBvblJheVVwXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlVcF8nKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldERyYWdnaW5nKGZhbHNlKTtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXl1cCcsIG1lc2gpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUoZmFsc2UpO1xuICB9XG5cbiAgb25SYXlDYW5jZWxfKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheUNhbmNlbF8nKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldERyYWdnaW5nKGZhbHNlKTtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnLCBtZXNoKTtcbiAgfVxuXG4gIG9uUG9pbnRlck1vdmVfKG5kYykge1xuICAgIHRoaXMucG9pbnRlck5kYy5jb3B5KG5kYyk7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBJbnRlcmFjdGlvbk1vZGVzID0ge1xuICBNT1VTRTogMSxcbiAgVE9VQ0g6IDIsXG4gIFZSXzBET0Y6IDMsXG4gIFZSXzNET0Y6IDQsXG4gIFZSXzZET0Y6IDVcbn07XG5cbmV4cG9ydCB7IEludGVyYWN0aW9uTW9kZXMgYXMgZGVmYXVsdCB9O1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtiYXNlNjR9IGZyb20gJy4vdXRpbCdcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcblxuY29uc3QgUkVUSUNMRV9ESVNUQU5DRSA9IDM7XG5jb25zdCBJTk5FUl9SQURJVVMgPSAwLjAyO1xuY29uc3QgT1VURVJfUkFESVVTID0gMC4wNDtcbmNvbnN0IFJBWV9SQURJVVMgPSAwLjAyO1xuY29uc3QgR1JBRElFTlRfSU1BR0UgPSBiYXNlNjQoJ2ltYWdlL3BuZycsICdpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBSUFBQUFDQUNBWUFBQUREUG1ITEFBQUJka2xFUVZSNG5PM1d3WEhFUUF3RFFjaW4vRk9XdytCanVpUFlCMnE0RzJuUDkzM1A5U080ODI0emdEQURpRE9BdUhmYjMvVWp1S01BY1FZUVp3QngvZ0J4Q2hDbkFIRUtFS2NBY1FvUXB3QnhDaENuQUhFR0VHY0FjZjRBY1FvUVp3QnhCaEJuQUhFR0VHY0FjUVlRWndCeEJoQm5BSEVHRUdjQWNRWVFad0J4QmhCbkFISHZ0dC8xSTdpakFIRUdFR2NBY2Y0QWNRb1Fad0J4VGtDY0FzUVpRSndURUtjQWNRb1Fwd0J4QmhEbkJNUXBRSndDeENsQW5BTEVLVUNjQXNRcFFKd0N4Q2xBbkFMRUtVQ2NBc1FwUUp3QnhEa0JjUW9RcHdCeENoQ25BSEVLRUtjQWNRb1Fwd0J4Q2hDbkFIRUtFR2NBY1U1QW5BTEVLVUNjQXNRWlFKd1RFS2NBY1FZUTV3VEVLVUNjQWNRWlFKdy9RSndDeEJsQW5BSEVHVUNjQWNRWlFKd0J4QmxBbkFIRUdVQ2NBY1FaUUp3QnhCbEFuQUhFR1VEY3UrMjVmZ1IzRkNET0FPSU1JTTRmSUU0QjRoUWdUZ0hpRkNCT0FlSVVJRTRCNGhRZ3pnRGlEQ0RPSHlCT0FlSU1JTTRBNHY0Qi81SUY5ZUQ2UXhnQUFBQUFTVVZPUks1Q1lJST0nKTtcblxuLyoqXG4gKiBIYW5kbGVzIHJheSBpbnB1dCBzZWxlY3Rpb24gZnJvbSBmcmFtZSBvZiByZWZlcmVuY2Ugb2YgYW4gYXJiaXRyYXJ5IG9iamVjdC5cbiAqXG4gKiBUaGUgc291cmNlIG9mIHRoZSByYXkgaXMgZnJvbSB2YXJpb3VzIGxvY2F0aW9uczpcbiAqXG4gKiBEZXNrdG9wOiBtb3VzZS5cbiAqIE1hZ2ljIHdpbmRvdzogdG91Y2guXG4gKiBDYXJkYm9hcmQ6IGNhbWVyYS5cbiAqIERheWRyZWFtOiAzRE9GIGNvbnRyb2xsZXIgdmlhIGdhbWVwYWQgKGFuZCBzaG93IHJheSkuXG4gKiBWaXZlOiA2RE9GIGNvbnRyb2xsZXIgdmlhIGdhbWVwYWQgKGFuZCBzaG93IHJheSkuXG4gKlxuICogRW1pdHMgc2VsZWN0aW9uIGV2ZW50czpcbiAqICAgICByYXlvdmVyKG1lc2gpOiBUaGlzIG1lc2ggd2FzIHNlbGVjdGVkLlxuICogICAgIHJheW91dChtZXNoKTogVGhpcyBtZXNoIHdhcyB1bnNlbGVjdGVkLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYXlSZW5kZXJlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKGNhbWVyYSwgb3B0X3BhcmFtcykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcblxuICAgIHZhciBwYXJhbXMgPSBvcHRfcGFyYW1zIHx8IHt9O1xuXG4gICAgLy8gV2hpY2ggb2JqZWN0cyBhcmUgaW50ZXJhY3RpdmUgKGtleWVkIG9uIGlkKS5cbiAgICB0aGlzLm1lc2hlcyA9IHt9O1xuXG4gICAgLy8gV2hpY2ggb2JqZWN0cyBhcmUgY3VycmVudGx5IHNlbGVjdGVkIChrZXllZCBvbiBpZCkuXG4gICAgdGhpcy5zZWxlY3RlZCA9IHt9O1xuXG4gICAgLy8gVGhlIHJheWNhc3Rlci5cbiAgICB0aGlzLnJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoKTtcblxuICAgIC8vIFBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiwgaW4gYWRkaXRpb24uXG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgdGhpcy5vcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICB0aGlzLnJvb3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICAgIC8vIEFkZCB0aGUgcmV0aWNsZSBtZXNoIHRvIHRoZSByb290IG9mIHRoZSBvYmplY3QuXG4gICAgdGhpcy5yZXRpY2xlID0gdGhpcy5jcmVhdGVSZXRpY2xlXygpO1xuICAgIHRoaXMucm9vdC5hZGQodGhpcy5yZXRpY2xlKTtcblxuICAgIC8vIEFkZCB0aGUgcmF5IHRvIHRoZSByb290IG9mIHRoZSBvYmplY3QuXG4gICAgdGhpcy5yYXkgPSB0aGlzLmNyZWF0ZVJheV8oKTtcbiAgICB0aGlzLnJvb3QuYWRkKHRoaXMucmF5KTtcblxuICAgIC8vIEhvdyBmYXIgdGhlIHJldGljbGUgaXMgY3VycmVudGx5IGZyb20gdGhlIHJldGljbGUgb3JpZ2luLlxuICAgIHRoaXMucmV0aWNsZURpc3RhbmNlID0gUkVUSUNMRV9ESVNUQU5DRTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhbiBvYmplY3Qgc28gdGhhdCBpdCBjYW4gYmUgaW50ZXJhY3RlZCB3aXRoLlxuICAgKi9cbiAgYWRkKG9iamVjdCkge1xuICAgIHRoaXMubWVzaGVzW29iamVjdC5pZF0gPSBvYmplY3Q7XG4gIH1cblxuICAvKipcbiAgICogUHJldmVudCBhbiBvYmplY3QgZnJvbSBiZWluZyBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICByZW1vdmUob2JqZWN0KSB7XG4gICAgdmFyIGlkID0gb2JqZWN0LmlkO1xuICAgIGlmICh0aGlzLm1lc2hlc1tpZF0pIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZXhpc3RpbmcgbWVzaCwgd2UgY2FuJ3QgcmVtb3ZlIGl0LlxuICAgICAgZGVsZXRlIHRoaXMubWVzaGVzW2lkXTtcbiAgICB9XG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBjdXJyZW50bHkgc2VsZWN0ZWQsIHJlbW92ZSBpdC5cbiAgICBpZiAodGhpcy5zZWxlY3RlZFtpZF0pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW29iamVjdC5pZF07XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIC8vIERvIHRoZSByYXljYXN0aW5nIGFuZCBpc3N1ZSB2YXJpb3VzIGV2ZW50cyBhcyBuZWVkZWQuXG4gICAgZm9yIChsZXQgaWQgaW4gdGhpcy5tZXNoZXMpIHtcbiAgICAgIGxldCBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgICAgbGV0IGludGVyc2VjdHMgPSB0aGlzLnJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3QobWVzaCwgdHJ1ZSk7XG4gICAgICBpZiAoaW50ZXJzZWN0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignVW5leHBlY3RlZDogbXVsdGlwbGUgbWVzaGVzIGludGVyc2VjdGVkLicpO1xuICAgICAgfVxuICAgICAgbGV0IGlzSW50ZXJzZWN0ZWQgPSAoaW50ZXJzZWN0cy5sZW5ndGggPiAwKTtcbiAgICAgIGxldCBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFtpZF07XG5cbiAgICAgIC8vIElmIGl0J3MgbmV3bHkgc2VsZWN0ZWQsIHNlbmQgcmF5b3Zlci5cbiAgICAgIGlmIChpc0ludGVyc2VjdGVkICYmICFpc1NlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRbaWRdID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JheW92ZXInLCBtZXNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBpdCdzIG5vIGxvbmdlciBpbnRlcnNlY3RlZCwgc2VuZCByYXlvdXQuXG4gICAgICBpZiAoIWlzSW50ZXJzZWN0ZWQgJiYgaXNTZWxlY3RlZCAmJiAhdGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW2lkXTtcbiAgICAgICAgdGhpcy5tb3ZlUmV0aWNsZV8obnVsbCk7XG4gICAgICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNJbnRlcnNlY3RlZCkge1xuICAgICAgICB0aGlzLm1vdmVSZXRpY2xlXyhpbnRlcnNlY3RzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luIG9mIHRoZSByYXkuXG4gICAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3IgUG9zaXRpb24gb2YgdGhlIG9yaWdpbiBvZiB0aGUgcGlja2luZyByYXkuXG4gICAqL1xuICBzZXRQb3NpdGlvbih2ZWN0b3IpIHtcbiAgICB0aGlzLnBvc2l0aW9uLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgfVxuXG4gIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHJheS5cbiAgICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvciBVbml0IHZlY3RvciBjb3JyZXNwb25kaW5nIHRvIGRpcmVjdGlvbi5cbiAgICovXG4gIHNldE9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLm9yaWVudGF0aW9uLmNvcHkocXVhdGVybmlvbik7XG5cbiAgICB2YXIgcG9pbnRBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKS5hcHBseVF1YXRlcm5pb24ocXVhdGVybmlvbik7XG4gICAgdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvbi5jb3B5KHBvaW50QXQpXG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICBnZXREaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9pbnRlciBvbiB0aGUgc2NyZWVuIGZvciBjYW1lcmEgKyBwb2ludGVyIGJhc2VkIHBpY2tpbmcuIFRoaXNcbiAgICogc3VwZXJzY2VkZXMgb3JpZ2luIGFuZCBkaXJlY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gdmVjdG9yIFRoZSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlciAoc2NyZWVuIGNvb3JkcykuXG4gICAqL1xuICBzZXRQb2ludGVyKHZlY3Rvcikge1xuICAgIHRoaXMucmF5Y2FzdGVyLnNldEZyb21DYW1lcmEodmVjdG9yLCB0aGlzLmNhbWVyYSk7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWVzaCwgd2hpY2ggaW5jbHVkZXMgcmV0aWNsZSBhbmQvb3IgcmF5LiBUaGlzIG1lc2ggaXMgdGhlbiBhZGRlZFxuICAgKiB0byB0aGUgc2NlbmUuXG4gICAqL1xuICBnZXRSZXRpY2xlUmF5TWVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBvYmplY3QgaW4gdGhlIHNjZW5lLlxuICAgKi9cbiAgZ2V0U2VsZWN0ZWRNZXNoKCkge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgbGV0IG1lc2ggPSBudWxsO1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgIGNvdW50ICs9IDE7XG4gICAgICBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICBpZiAoY291bnQgPiAxKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ01vcmUgdGhhbiBvbmUgbWVzaCBzZWxlY3RlZC4nKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc2g7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYW5kIHNob3dzIHRoZSByZXRpY2xlLlxuICAgKi9cbiAgc2V0UmV0aWNsZVZpc2liaWxpdHkoaXNWaXNpYmxlKSB7XG4gICAgdGhpcy5yZXRpY2xlLnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBvciBkaXNhYmxlcyB0aGUgcmF5Y2FzdGluZyByYXkgd2hpY2ggZ3JhZHVhbGx5IGZhZGVzIG91dCBmcm9tXG4gICAqIHRoZSBvcmlnaW4uXG4gICAqL1xuICBzZXRSYXlWaXNpYmlsaXR5KGlzVmlzaWJsZSkge1xuICAgIHRoaXMucmF5LnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhbmQgZGlzYWJsZXMgdGhlIHJheWNhc3Rlci4gRm9yIHRvdWNoLCB3aGVyZSBmaW5nZXIgdXAgbWVhbnMgd2VcbiAgICogc2hvdWxkbid0IGJlIHJheWNhc3RpbmcuXG4gICAqL1xuICBzZXRBY3RpdmUoaXNBY3RpdmUpIHtcbiAgICAvLyBJZiBub3RoaW5nIGNoYW5nZWQsIGRvIG5vdGhpbmcuXG4gICAgaWYgKHRoaXMuaXNBY3RpdmUgPT0gaXNBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVE9ETyhzbXVzKTogU2hvdyB0aGUgcmF5IG9yIHJldGljbGUgYWRqdXN0IGluIHJlc3BvbnNlLlxuICAgIHRoaXMuaXNBY3RpdmUgPSBpc0FjdGl2ZTtcblxuICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgIHRoaXMubW92ZVJldGljbGVfKG51bGwpO1xuICAgICAgZm9yIChsZXQgaWQgaW4gdGhpcy5zZWxlY3RlZCkge1xuICAgICAgICBsZXQgbWVzaCA9IHRoaXMubWVzaGVzW2lkXTtcbiAgICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbaWRdO1xuICAgICAgICB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldERyYWdnaW5nKGlzRHJhZ2dpbmcpIHtcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBpc0RyYWdnaW5nO1xuICB9XG5cbiAgdXBkYXRlUmF5Y2FzdGVyXygpIHtcbiAgICB2YXIgcmF5ID0gdGhpcy5yYXljYXN0ZXIucmF5O1xuXG4gICAgLy8gUG9zaXRpb24gdGhlIHJldGljbGUgYXQgYSBkaXN0YW5jZSwgYXMgY2FsY3VsYXRlZCBmcm9tIHRoZSBvcmlnaW4gYW5kXG4gICAgLy8gZGlyZWN0aW9uLlxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMucmV0aWNsZS5wb3NpdGlvbjtcbiAgICBwb3NpdGlvbi5jb3B5KHJheS5kaXJlY3Rpb24pO1xuICAgIHBvc2l0aW9uLm11bHRpcGx5U2NhbGFyKHRoaXMucmV0aWNsZURpc3RhbmNlKTtcbiAgICBwb3NpdGlvbi5hZGQocmF5Lm9yaWdpbik7XG5cbiAgICAvLyBTZXQgcG9zaXRpb24gYW5kIG9yaWVudGF0aW9uIG9mIHRoZSByYXkgc28gdGhhdCBpdCBnb2VzIGZyb20gb3JpZ2luIHRvXG4gICAgLy8gcmV0aWNsZS5cbiAgICB2YXIgZGVsdGEgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkocmF5LmRpcmVjdGlvbik7XG4gICAgZGVsdGEubXVsdGlwbHlTY2FsYXIodGhpcy5yZXRpY2xlRGlzdGFuY2UpO1xuICAgIHRoaXMucmF5LnNjYWxlLnkgPSBkZWx0YS5sZW5ndGgoKTtcbiAgICB2YXIgYXJyb3cgPSBuZXcgVEhSRUUuQXJyb3dIZWxwZXIocmF5LmRpcmVjdGlvbiwgcmF5Lm9yaWdpbik7XG4gICAgdGhpcy5yYXkucm90YXRpb24uY29weShhcnJvdy5yb3RhdGlvbik7XG4gICAgdGhpcy5yYXkucG9zaXRpb24uYWRkVmVjdG9ycyhyYXkub3JpZ2luLCBkZWx0YS5tdWx0aXBseVNjYWxhcigwLjUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBnZW9tZXRyeSBvZiB0aGUgcmV0aWNsZS5cbiAgICovXG4gIGNyZWF0ZVJldGljbGVfKCkge1xuICAgIC8vIENyZWF0ZSBhIHNwaGVyaWNhbCByZXRpY2xlLlxuICAgIGxldCBpbm5lckdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KElOTkVSX1JBRElVUywgMzIsIDMyKTtcbiAgICBsZXQgaW5uZXJNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogMHhmZmZmZmYsXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgIG9wYWNpdHk6IDAuOVxuICAgIH0pO1xuICAgIGxldCBpbm5lciA9IG5ldyBUSFJFRS5NZXNoKGlubmVyR2VvbWV0cnksIGlubmVyTWF0ZXJpYWwpO1xuXG4gICAgbGV0IG91dGVyR2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoT1VURVJfUkFESVVTLCAzMiwgMzIpO1xuICAgIGxldCBvdXRlck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgIGNvbG9yOiAweDMzMzMzMyxcbiAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgb3BhY2l0eTogMC4zXG4gICAgfSk7XG4gICAgbGV0IG91dGVyID0gbmV3IFRIUkVFLk1lc2gob3V0ZXJHZW9tZXRyeSwgb3V0ZXJNYXRlcmlhbCk7XG5cbiAgICBsZXQgcmV0aWNsZSA9IG5ldyBUSFJFRS5Hcm91cCgpO1xuICAgIHJldGljbGUuYWRkKGlubmVyKTtcbiAgICByZXRpY2xlLmFkZChvdXRlcik7XG4gICAgcmV0dXJuIHJldGljbGU7XG4gIH1cblxuICAvKipcbiAgICogTW92ZXMgdGhlIHJldGljbGUgdG8gYSBwb3NpdGlvbiBzbyB0aGF0IGl0J3MganVzdCBpbiBmcm9udCBvZiB0aGUgbWVzaCB0aGF0XG4gICAqIGl0IGludGVyc2VjdGVkIHdpdGguXG4gICAqL1xuICBtb3ZlUmV0aWNsZV8oaW50ZXJzZWN0aW9ucykge1xuICAgIC8vIElmIG5vIGludGVyc2VjdGlvbiwgcmV0dXJuIHRoZSByZXRpY2xlIHRvIHRoZSBkZWZhdWx0IHBvc2l0aW9uLlxuICAgIGxldCBkaXN0YW5jZSA9IFJFVElDTEVfRElTVEFOQ0U7XG4gICAgaWYgKGludGVyc2VjdGlvbnMpIHtcbiAgICAgIC8vIE90aGVyd2lzZSwgZGV0ZXJtaW5lIHRoZSBjb3JyZWN0IGRpc3RhbmNlLlxuICAgICAgbGV0IGludGVyID0gaW50ZXJzZWN0aW9uc1swXTtcbiAgICAgIGRpc3RhbmNlID0gaW50ZXIuZGlzdGFuY2U7XG4gICAgfVxuXG4gICAgdGhpcy5yZXRpY2xlRGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjcmVhdGVSYXlfKCkge1xuICAgIC8vIENyZWF0ZSBhIGN5bGluZHJpY2FsIHJheS5cbiAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQ3lsaW5kZXJHZW9tZXRyeShSQVlfUkFESVVTLCBSQVlfUkFESVVTLCAxLCAzMik7XG4gICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgIG1hcDogVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZShHUkFESUVOVF9JTUFHRSksXG4gICAgICAvL2NvbG9yOiAweGZmZmZmZixcbiAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgb3BhY2l0eTogMC4zXG4gICAgfSk7XG4gICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuXG4gICAgcmV0dXJuIG1lc2g7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBpc01vYmlsZSgpIHtcbiAgdmFyIGNoZWNrID0gZmFsc2U7XG4gIChmdW5jdGlvbihhKXtpZigvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXJpc3xraW5kbGV8bGdlIHxtYWVtb3xtaWRwfG1tcHxtb2JpbGUuK2ZpcmVmb3h8bmV0ZnJvbnR8b3BlcmEgbShvYnxpbilpfHBhbG0oIG9zKT98cGhvbmV8cChpeGl8cmUpXFwvfHBsdWNrZXJ8cG9ja2V0fHBzcHxzZXJpZXMoNHw2KTB8c3ltYmlhbnx0cmVvfHVwXFwuKGJyb3dzZXJ8bGluayl8dm9kYWZvbmV8d2FwfHdpbmRvd3MgY2V8eGRhfHhpaW5vL2kudGVzdChhKXx8LzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdChhLnN1YnN0cigwLDQpKSljaGVjayA9IHRydWV9KShuYXZpZ2F0b3IudXNlckFnZW50fHxuYXZpZ2F0b3IudmVuZG9yfHx3aW5kb3cub3BlcmEpO1xuICByZXR1cm4gY2hlY2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjQobWltZVR5cGUsIGJhc2U2NCkge1xuICByZXR1cm4gJ2RhdGE6JyArIG1pbWVUeXBlICsgJztiYXNlNjQsJyArIGJhc2U2NDtcbn1cbiJdfQ==
