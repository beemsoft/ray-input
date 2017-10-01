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

},{}],4:[function(require,module,exports){
'use strict';

var _renderer = require('./renderer.js');

var _renderer2 = _interopRequireDefault(_renderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var renderer = void 0;
var vrDisplay = void 0;

function onLoad() {
  renderer = new _renderer2.default();

  window.addEventListener('resize', function () {
    renderer.resize();
  });

  navigator.getVRDisplays().then(function (displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];

      renderer.createRagdoll();

      vrDisplay.requestAnimationFrame(render);
    }
  });
}

function render() {
  renderer.render();

  vrDisplay.requestAnimationFrame(render);
}

window.addEventListener('load', onLoad);

},{"./renderer.js":5}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webvrBoilerplate = require('webvr-boilerplate');

var _webvrBoilerplate2 = _interopRequireDefault(_webvrBoilerplate);

var _rayInput = require('../ray-input');

var _rayInput2 = _interopRequireDefault(_rayInput);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_COLOR = new THREE.Color(0x00FF00);
var HIGHLIGHT_COLOR = new THREE.Color(0x1E90FF);
var ACTIVE_COLOR = new THREE.Color(0xFF3333);

var DemoRenderer = function () {
  function DemoRenderer() {
    var _this = this;

    _classCallCheck(this, DemoRenderer);

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
      DemoRenderer.setSelected_(mesh, true);
    });
    rayInput.on('rayout', function (mesh) {
      DemoRenderer.setSelected_(mesh, false);
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

    // Global settings
    this.settings = {
      stepFrequency: 60,
      quatNormalizeSkip: 2,
      quatNormalizeFast: true,
      gx: 0,
      gy: 0,
      gz: 0,
      iterations: 3,
      tolerance: 0.0001,
      k: 1e6,
      d: 3,
      scene: 0,
      paused: false,
      rendermode: "solid",
      constraints: false,
      contacts: false, // Contact points
      cm2contact: false, // center of mass to contact points
      normals: false, // contact normals
      axes: false, // "local" frame axes
      particleSize: 0.1,
      shadows: false,
      aabbs: false,
      profiling: false,
      maxSubSteps: 20
    };

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

  _createClass(DemoRenderer, [{
    key: 'addVisual',
    value: function addVisual(body) {
      // var s = this.settings;
      // What geometry should be used?
      var mesh = void 0;
      if (body instanceof CANNON.Body) {
        mesh = this.shape2mesh(body);
      }
      if (mesh) {
        // Add body
        this.bodies.push(body);
        // this.visuals.push(mesh);
        // body.visualref = mesh;
        // body.visualref.visualId = this.bodies.length - 1;
        //mesh.useQuaternion = true;
        this.meshes.push(mesh);
        this.scene.add(mesh);
        this.rayInput.add(mesh);
      }
    }
  }, {
    key: 'createRagdoll',
    value: function createRagdoll() {
      var scale = 3;
      var position = new CANNON.Vec3(0, 10, -5);
      var angleA = Math.PI,
          angleB = Math.PI,
          twistAngle = Math.PI;

      var numBodiesAtStart = this.world.bodies.length;

      var shouldersDistance = 0.5 * scale,
          upperArmLength = 0.4 * scale,
          lowerArmLength = 0.4 * scale,
          upperArmSize = 0.2 * scale,
          lowerArmSize = 0.2 * scale,
          neckLength = 0.1 * scale,
          headRadius = 0.25 * scale,
          upperBodyLength = 0.6 * scale,
          pelvisLength = 0.4 * scale,
          upperLegLength = 0.5 * scale,
          upperLegSize = 0.2 * scale,
          lowerLegSize = 0.2 * scale,
          lowerLegLength = 0.5 * scale;

      var headShape = new CANNON.Sphere(headRadius),
          upperArmShape = new CANNON.Box(new CANNON.Vec3(upperArmLength * 0.5, upperArmSize * 0.5, upperArmSize * 0.5)),
          lowerArmShape = new CANNON.Box(new CANNON.Vec3(lowerArmLength * 0.5, lowerArmSize * 0.5, lowerArmSize * 0.5)),
          upperBodyShape = new CANNON.Box(new CANNON.Vec3(shouldersDistance * 0.5, upperBodyLength * 0.5, lowerArmSize * 0.5)),
          pelvisShape = new CANNON.Box(new CANNON.Vec3(shouldersDistance * 0.5, pelvisLength * 0.5, lowerArmSize * 0.5)),
          upperLegShape = new CANNON.Box(new CANNON.Vec3(upperLegSize * 0.5, upperLegLength * 0.5, lowerArmSize * 0.5)),
          lowerLegShape = new CANNON.Box(new CANNON.Vec3(lowerLegSize * 0.5, lowerLegLength * 0.5, lowerArmSize * 0.5));

      // Lower legs
      var lowerLeftLeg = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(-shouldersDistance / 2, lowerLegLength / 2, 0)
      });
      var lowerRightLeg = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(shouldersDistance / 2, lowerLegLength / 2, 0)
      });
      lowerLeftLeg.addShape(lowerLegShape);
      lowerRightLeg.addShape(lowerLegShape);
      this.world.addBody(lowerLeftLeg);
      this.world.addBody(lowerRightLeg);
      this.addVisual(lowerLeftLeg);
      this.addVisual(lowerRightLeg);

      // Upper legs
      var upperLeftLeg = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(-shouldersDistance / 2, lowerLeftLeg.position.y + lowerLegLength / 2 + upperLegLength / 2, 0)
      });
      var upperRightLeg = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(shouldersDistance / 2, lowerRightLeg.position.y + lowerLegLength / 2 + upperLegLength / 2, 0)
      });
      upperLeftLeg.addShape(upperLegShape);
      upperRightLeg.addShape(upperLegShape);
      this.world.addBody(upperLeftLeg);
      this.world.addBody(upperRightLeg);
      this.addVisual(upperLeftLeg);
      this.addVisual(upperRightLeg);

      // Pelvis
      var pelvis = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, upperLeftLeg.position.y + upperLegLength / 2 + pelvisLength / 2, 0)
      });
      pelvis.addShape(pelvisShape);
      this.world.addBody(pelvis);
      this.addVisual(pelvis);

      // Upper body
      var upperBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, pelvis.position.y + pelvisLength / 2 + upperBodyLength / 2, 0)
      });
      upperBody.addShape(upperBodyShape);
      this.world.addBody(upperBody);
      this.addVisual(upperBody);

      // Head
      var head = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, upperBody.position.y + upperBodyLength / 2 + headRadius + neckLength, 0)
      });
      head.addShape(headShape);
      this.world.addBody(head);
      this.addVisual(head);

      // Upper arms
      var upperLeftArm = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(-shouldersDistance / 2 - upperArmLength / 2, upperBody.position.y + upperBodyLength / 2, 0)
      });
      var upperRightArm = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(shouldersDistance / 2 + upperArmLength / 2, upperBody.position.y + upperBodyLength / 2, 0)
      });
      upperLeftArm.addShape(upperArmShape);
      upperRightArm.addShape(upperArmShape);
      this.world.addBody(upperLeftArm);
      this.world.addBody(upperRightArm);
      this.addVisual(upperLeftArm);
      this.addVisual(upperRightArm);

      // lower arms
      var lowerLeftArm = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(upperLeftArm.position.x - lowerArmLength / 2 - upperArmLength / 2, upperLeftArm.position.y, 0)
      });
      var lowerRightArm = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(upperRightArm.position.x + lowerArmLength / 2 + upperArmLength / 2, upperRightArm.position.y, 0)
      });
      lowerLeftArm.addShape(lowerArmShape);
      lowerRightArm.addShape(lowerArmShape);
      this.world.addBody(lowerLeftArm);
      this.world.addBody(lowerRightArm);
      this.addVisual(lowerLeftArm);
      this.addVisual(lowerRightArm);

      // Neck joint
      var neckJoint = new CANNON.ConeTwistConstraint(head, upperBody, {
        pivotA: new CANNON.Vec3(0, -headRadius - neckLength / 2, 0),
        pivotB: new CANNON.Vec3(0, upperBodyLength / 2, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: angleA,
        twistAngle: twistAngle
      });
      this.world.addConstraint(neckJoint);

      // Knee joints
      var leftKneeJoint = new CANNON.ConeTwistConstraint(lowerLeftLeg, upperLeftLeg, {
        pivotA: new CANNON.Vec3(0, lowerLegLength / 2, 0),
        pivotB: new CANNON.Vec3(0, -upperLegLength / 2, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: angleA,
        twistAngle: twistAngle
      });
      var rightKneeJoint = new CANNON.ConeTwistConstraint(lowerRightLeg, upperRightLeg, {
        pivotA: new CANNON.Vec3(0, lowerLegLength / 2, 0),
        pivotB: new CANNON.Vec3(0, -upperLegLength / 2, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: angleA,
        twistAngle: twistAngle
      });
      this.world.addConstraint(leftKneeJoint);
      this.world.addConstraint(rightKneeJoint);

      // Hip joints
      var leftHipJoint = new CANNON.ConeTwistConstraint(upperLeftLeg, pelvis, {
        pivotA: new CANNON.Vec3(0, upperLegLength / 2, 0),
        pivotB: new CANNON.Vec3(-shouldersDistance / 2, -pelvisLength / 2, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: angleA,
        twistAngle: twistAngle
      });
      var rightHipJoint = new CANNON.ConeTwistConstraint(upperRightLeg, pelvis, {
        pivotA: new CANNON.Vec3(0, upperLegLength / 2, 0),
        pivotB: new CANNON.Vec3(shouldersDistance / 2, -pelvisLength / 2, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: angleA,
        twistAngle: twistAngle
      });
      this.world.addConstraint(leftHipJoint);
      this.world.addConstraint(rightHipJoint);

      // Spine
      var spineJoint = new CANNON.ConeTwistConstraint(pelvis, upperBody, {
        pivotA: new CANNON.Vec3(0, pelvisLength / 2, 0),
        pivotB: new CANNON.Vec3(0, -upperBodyLength / 2, 0),
        axisA: CANNON.Vec3.UNIT_Y,
        axisB: CANNON.Vec3.UNIT_Y,
        angle: angleA,
        twistAngle: twistAngle
      });
      this.world.addConstraint(spineJoint);

      // Shoulders
      var leftShoulder = new CANNON.ConeTwistConstraint(upperBody, upperLeftArm, {
        pivotA: new CANNON.Vec3(-shouldersDistance / 2, upperBodyLength / 2, 0),
        pivotB: new CANNON.Vec3(upperArmLength / 2, 0, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        angle: angleB
      });
      var rightShoulder = new CANNON.ConeTwistConstraint(upperBody, upperRightArm, {
        pivotA: new CANNON.Vec3(shouldersDistance / 2, upperBodyLength / 2, 0),
        pivotB: new CANNON.Vec3(-upperArmLength / 2, 0, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        angle: angleB,
        twistAngle: twistAngle
      });
      this.world.addConstraint(leftShoulder);
      this.world.addConstraint(rightShoulder);

      // Elbow joint
      var leftElbowJoint = new CANNON.ConeTwistConstraint(lowerLeftArm, upperLeftArm, {
        pivotA: new CANNON.Vec3(lowerArmLength / 2, 0, 0),
        pivotB: new CANNON.Vec3(-upperArmLength / 2, 0, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        angle: angleA,
        twistAngle: twistAngle
      });
      var rightElbowJoint = new CANNON.ConeTwistConstraint(lowerRightArm, upperRightArm, {
        pivotA: new CANNON.Vec3(-lowerArmLength / 2, 0, 0),
        pivotB: new CANNON.Vec3(upperArmLength / 2, 0, 0),
        axisA: CANNON.Vec3.UNIT_X,
        axisB: CANNON.Vec3.UNIT_X,
        angle: angleA,
        twistAngle: twistAngle
      });
      this.world.addConstraint(leftElbowJoint);
      this.world.addConstraint(rightElbowJoint);

      // Move all body parts
      for (var i = numBodiesAtStart; i < this.world.bodies.length; i++) {
        var body = this.world.bodies[i];
        body.position.vadd(position, body.position);
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

        var gamepad = DemoRenderer.getVRGamepad();
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
      DemoRenderer.setAction_(opt_mesh, true);

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
      DemoRenderer.setAction_(opt_mesh, false);

      this.constraintDown = false;
      // remove the marker
      this.removeClickMarker();

      this.removeJointConstraint();
    }
  }, {
    key: 'handleRayCancel_',
    value: function handleRayCancel_(opt_mesh) {
      DemoRenderer.setAction_(opt_mesh, false);
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
          var deltaRotationQuaternion = new CANNON.Quaternion().setFromEuler(DemoRenderer.toRadians(deltaMove.x), 0, DemoRenderer.toRadians(deltaMove.z), 'XYZ');
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
  }, {
    key: 'shape2mesh',
    value: function shape2mesh(body) {
      var wireframe = this.settings.renderMode === "wireframe";
      var obj = new THREE.Object3D();

      for (var l = 0; l < body.shapes.length; l++) {
        var shape = body.shapes[l];

        var mesh;

        switch (shape.type) {

          case CANNON.Shape.types.SPHERE:
            var sphere_geometry = new THREE.SphereGeometry(shape.radius, 8, 8);
            mesh = new THREE.Mesh(sphere_geometry, this.currentMaterial);
            break;

          case CANNON.Shape.types.PARTICLE:
            mesh = new THREE.Mesh(this.particleGeo, this.particleMaterial);
            var s = this.settings;
            mesh.scale.set(s.particleSize, s.particleSize, s.particleSize);
            break;

          case CANNON.Shape.types.PLANE:
            var geometry = new THREE.PlaneGeometry(10, 10, 4, 4);
            mesh = new THREE.Object3D();
            var submesh = new THREE.Object3D();
            var ground = new THREE.Mesh(geometry, this.currentMaterial);
            ground.scale.set(100, 100, 100);
            submesh.add(ground);

            ground.castShadow = true;
            ground.receiveShadow = true;

            mesh.add(submesh);
            break;

          case CANNON.Shape.types.BOX:
            var box_geometry = new THREE.BoxGeometry(shape.halfExtents.x * 2, shape.halfExtents.y * 2, shape.halfExtents.z * 2);
            mesh = new THREE.Mesh(box_geometry, this.currentMaterial);
            break;

          case CANNON.Shape.types.CONVEXPOLYHEDRON:
            var geo = new THREE.Geometry();

            // Add vertices
            for (var i = 0; i < shape.vertices.length; i++) {
              var v = shape.vertices[i];
              geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
            }

            for (var i = 0; i < shape.faces.length; i++) {
              var face = shape.faces[i];

              // add triangles
              var a = face[0];
              for (var j = 1; j < face.length - 1; j++) {
                var b = face[j];
                var c = face[j + 1];
                geo.faces.push(new THREE.Face3(a, b, c));
              }
            }
            geo.computeBoundingSphere();
            geo.computeFaceNormals();
            mesh = new THREE.Mesh(geo, this.currentMaterial);
            break;

          case CANNON.Shape.types.HEIGHTFIELD:
            var geometry = new THREE.Geometry();

            var v0 = new CANNON.Vec3();
            var v1 = new CANNON.Vec3();
            var v2 = new CANNON.Vec3();
            for (var xi = 0; xi < shape.data.length - 1; xi++) {
              for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
                for (var k = 0; k < 2; k++) {
                  shape.getConvexTrianglePillar(xi, yi, k === 0);
                  v0.copy(shape.pillarConvex.vertices[0]);
                  v1.copy(shape.pillarConvex.vertices[1]);
                  v2.copy(shape.pillarConvex.vertices[2]);
                  v0.vadd(shape.pillarOffset, v0);
                  v1.vadd(shape.pillarOffset, v1);
                  v2.vadd(shape.pillarOffset, v2);
                  geometry.vertices.push(new THREE.Vector3(v0.x, v0.y, v0.z), new THREE.Vector3(v1.x, v1.y, v1.z), new THREE.Vector3(v2.x, v2.y, v2.z));
                  var i = geometry.vertices.length - 3;
                  geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
                }
              }
            }
            geometry.computeBoundingSphere();
            geometry.computeFaceNormals();
            mesh = new THREE.Mesh(geometry, this.currentMaterial);
            break;

          case CANNON.Shape.types.TRIMESH:
            var geometry = new THREE.Geometry();

            var v0 = new CANNON.Vec3();
            var v1 = new CANNON.Vec3();
            var v2 = new CANNON.Vec3();
            for (var i = 0; i < shape.indices.length / 3; i++) {
              shape.getTriangleVertices(i, v0, v1, v2);
              geometry.vertices.push(new THREE.Vector3(v0.x, v0.y, v0.z), new THREE.Vector3(v1.x, v1.y, v1.z), new THREE.Vector3(v2.x, v2.y, v2.z));
              var j = geometry.vertices.length - 3;
              geometry.faces.push(new THREE.Face3(j, j + 1, j + 2));
            }
            geometry.computeBoundingSphere();
            geometry.computeFaceNormals();
            mesh = new THREE.Mesh(geometry, this.currentMaterial);
            break;

          default:
            throw "Visual type not recognized: " + shape.type;
        }

        mesh.receiveShadow = true;
        mesh.castShadow = true;
        if (mesh.children) {
          for (var i = 0; i < mesh.children.length; i++) {
            mesh.children[i].castShadow = true;
            mesh.children[i].receiveShadow = true;
            if (mesh.children[i]) {
              for (var j = 0; j < mesh.children[i].length; j++) {
                mesh.children[i].children[j].castShadow = true;
                mesh.children[i].children[j].receiveShadow = true;
              }
            }
          }
        }

        var o = body.shapeOffsets[l];
        var q = body.shapeOrientations[l];
        mesh.position.set(o.x, o.y, o.z);
        mesh.quaternion.set(q.x, q.y, q.z, q.w);

        obj.add(mesh);
      }

      return obj;
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
      if (mesh.material) {
        mesh.material.color = isSelected ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
      }
    }
  }, {
    key: 'setAction_',
    value: function setAction_(opt_mesh, isActive) {
      //console.log('setAction_', !!opt_mesh, isActive);
      if (opt_mesh && opt_mesh.material) {
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

  return DemoRenderer;
}();

exports.default = DemoRenderer;

},{"../ray-input":7,"webvr-boilerplate":2}],6:[function(require,module,exports){
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

},{"./orientation-arm-model":3,"./ray-controller":6,"./ray-interaction-modes":8,"./ray-renderer":9,"eventemitter3":1}],8:[function(require,module,exports){
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

},{}]},{},[4,5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4xMC4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLWJvaWxlcnBsYXRlL2J1aWxkL3dlYnZyLW1hbmFnZXIuanMiLCJzcmMvb3JpZW50YXRpb24tYXJtLW1vZGVsLmpzIiwic3JjL3JhZ2RvbGwvbWFpbi5qcyIsInNyYy9yYWdkb2xsL3JlbmRlcmVyLmpzIiwic3JjL3JheS1jb250cm9sbGVyLmpzIiwic3JjL3JheS1pbnB1dC5qcyIsInNyYy9yYXktaW50ZXJhY3Rpb24tbW9kZXMuanMiLCJzcmMvcmF5LXJlbmRlcmVyLmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFNQSxVQUFJLE9BQU8sSUFBSSxNQUFNLElBQVYsQ0FBZSxRQUFmLEVBQXlCLFFBQXpCLENBQVg7O0FBRUEsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztrQkFsUmtCLFc7Ozs7Ozs7O1FDeEJMLFEsR0FBQSxRO1FBTUEsTSxHQUFBLE07QUFyQmhCOzs7Ozs7Ozs7Ozs7Ozs7QUFlTyxTQUFTLFFBQVQsR0FBb0I7QUFDekIsTUFBSSxRQUFRLEtBQVo7QUFDQSxHQUFDLFVBQVMsQ0FBVCxFQUFXO0FBQUMsUUFBRywyVEFBMlQsSUFBM1QsQ0FBZ1UsQ0FBaFUsS0FBb1UsMGtEQUEwa0QsSUFBMWtELENBQStrRCxFQUFFLE1BQUYsQ0FBUyxDQUFULEVBQVcsQ0FBWCxDQUEva0QsQ0FBdlUsRUFBcTZELFFBQVEsSUFBUjtBQUFhLEdBQS83RCxFQUFpOEQsVUFBVSxTQUFWLElBQXFCLFVBQVUsTUFBL0IsSUFBdUMsT0FBTyxLQUEvK0Q7QUFDQSxTQUFPLEtBQVA7QUFDRDs7QUFFTSxTQUFTLE1BQVQsQ0FBZ0IsUUFBaEIsRUFBMEIsTUFBMUIsRUFBa0M7QUFDdkMsU0FBTyxVQUFVLFFBQVYsR0FBcUIsVUFBckIsR0FBa0MsTUFBekM7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vL1xuLy8gV2Ugc3RvcmUgb3VyIEVFIG9iamVjdHMgaW4gYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gYH5gIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90IG92ZXJyaWRkZW4gb3Jcbi8vIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vIFdlIGFsc28gYXNzdW1lIHRoYXQgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIGF2YWlsYWJsZSB3aGVuIHRoZSBldmVudCBuYW1lXG4vLyBpcyBhbiBFUzYgU3ltYm9sLlxuLy9cbnZhciBwcmVmaXggPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSAhPT0gJ2Z1bmN0aW9uJyA/ICd+JyA6IGZhbHNlO1xuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIEV2ZW50RW1pdHRlciBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBFdmVudCBoYW5kbGVyIHRvIGJlIGNhbGxlZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgQ29udGV4dCBmb3IgZnVuY3Rpb24gZXhlY3V0aW9uLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gT25seSBlbWl0IG9uY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogTWluaW1hbCBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7IC8qIE5vdGhpbmcgdG8gc2V0ICovIH1cblxuLyoqXG4gKiBIb2xkIHRoZSBhc3NpZ25lZCBFdmVudEVtaXR0ZXJzIGJ5IG5hbWUuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNcbiAgICAsIG5hbWVzID0gW11cbiAgICAsIG5hbWU7XG5cbiAgaWYgKCFldmVudHMpIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gZXZlbnRzKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhIGxpc3Qgb2YgYXNzaWduZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnRzIHRoYXQgc2hvdWxkIGJlIGxpc3RlZC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXhpc3RzIFdlIG9ubHkgbmVlZCB0byBrbm93IGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIEVtaXQgYW4gZXZlbnQgdG8gYWxsIHJlZ2lzdGVyZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gSW5kaWNhdGlvbiBpZiB3ZSd2ZSBlbWl0dGVkIGFuIGV2ZW50LlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIG5ldyBFdmVudExpc3RlbmVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYW4gRXZlbnRMaXN0ZW5lciB0aGF0J3Mgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2Ugd2FudCB0byByZW1vdmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgdGhhdCB3ZSBuZWVkIHRvIGZpbmQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIGxpc3RlbmVycyBtYXRjaGluZyB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25jZSBsaXN0ZW5lcnMuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBldmVudHMgPSBbXTtcblxuICBpZiAoZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgICBpZiAoXG4gICAgICAgICAgIGxpc3RlbmVycy5mbiAhPT0gZm5cbiAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVycy5vbmNlKVxuICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnMuY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKVxuICAgICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgICApIHtcbiAgICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAvL1xuICBpZiAoZXZlbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgb3Igb25seSB0aGUgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2FudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG5cbiAgaWYgKGV2ZW50KSBkZWxldGUgdGhpcy5fZXZlbnRzW3ByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRdO1xuICBlbHNlIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsIihmdW5jdGlvbihmKXtpZih0eXBlb2YgZXhwb3J0cz09PVwib2JqZWN0XCImJnR5cGVvZiBtb2R1bGUhPT1cInVuZGVmaW5lZFwiKXttb2R1bGUuZXhwb3J0cz1mKCl9ZWxzZSBpZih0eXBlb2YgZGVmaW5lPT09XCJmdW5jdGlvblwiJiZkZWZpbmUuYW1kKXtkZWZpbmUoW10sZil9ZWxzZXt2YXIgZztpZih0eXBlb2Ygd2luZG93IT09XCJ1bmRlZmluZWRcIil7Zz13aW5kb3d9ZWxzZSBpZih0eXBlb2YgZ2xvYmFsIT09XCJ1bmRlZmluZWRcIil7Zz1nbG9iYWx9ZWxzZSBpZih0eXBlb2Ygc2VsZiE9PVwidW5kZWZpbmVkXCIpe2c9c2VsZn1lbHNle2c9dGhpc31nLldlYlZSTWFuYWdlciA9IGYoKX19KShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBFbWl0dGVyID0gX2RlcmVxXygnLi9lbWl0dGVyLmpzJyk7XG52YXIgTW9kZXMgPSBfZGVyZXFfKCcuL21vZGVzLmpzJyk7XG52YXIgVXRpbCA9IF9kZXJlcV8oJy4vdXRpbC5qcycpO1xuXG4vKipcbiAqIEV2ZXJ5dGhpbmcgaGF2aW5nIHRvIGRvIHdpdGggdGhlIFdlYlZSIGJ1dHRvbi5cbiAqIEVtaXRzIGEgJ2NsaWNrJyBldmVudCB3aGVuIGl0J3MgY2xpY2tlZC5cbiAqL1xuZnVuY3Rpb24gQnV0dG9uTWFuYWdlcihvcHRfcm9vdCkge1xuICB2YXIgcm9vdCA9IG9wdF9yb290IHx8IGRvY3VtZW50LmJvZHk7XG4gIHRoaXMubG9hZEljb25zXygpO1xuXG4gIC8vIE1ha2UgdGhlIGZ1bGxzY3JlZW4gYnV0dG9uLlxuICB2YXIgZnNCdXR0b24gPSB0aGlzLmNyZWF0ZUJ1dHRvbigpO1xuICBmc0J1dHRvbi5zcmMgPSB0aGlzLklDT05TLmZ1bGxzY3JlZW47XG4gIGZzQnV0dG9uLnRpdGxlID0gJ0Z1bGxzY3JlZW4gbW9kZSc7XG4gIHZhciBzID0gZnNCdXR0b24uc3R5bGU7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5yaWdodCA9IDA7XG4gIGZzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5jcmVhdGVDbGlja0hhbmRsZXJfKCdmcycpKTtcbiAgcm9vdC5hcHBlbmRDaGlsZChmc0J1dHRvbik7XG4gIHRoaXMuZnNCdXR0b24gPSBmc0J1dHRvbjtcblxuICAvLyBNYWtlIHRoZSBWUiBidXR0b24uXG4gIHZhciB2ckJ1dHRvbiA9IHRoaXMuY3JlYXRlQnV0dG9uKCk7XG4gIHZyQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuY2FyZGJvYXJkO1xuICB2ckJ1dHRvbi50aXRsZSA9ICdWaXJ0dWFsIHJlYWxpdHkgbW9kZSc7XG4gIHZhciBzID0gdnJCdXR0b24uc3R5bGU7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5yaWdodCA9ICc0OHB4JztcbiAgdnJCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNyZWF0ZUNsaWNrSGFuZGxlcl8oJ3ZyJykpO1xuICByb290LmFwcGVuZENoaWxkKHZyQnV0dG9uKTtcbiAgdGhpcy52ckJ1dHRvbiA9IHZyQnV0dG9uO1xuXG4gIHRoaXMuaXNWaXNpYmxlID0gdHJ1ZTtcblxufVxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUgPSBuZXcgRW1pdHRlcigpO1xuXG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZS5jcmVhdGVCdXR0b24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBidXR0b24uY2xhc3NOYW1lID0gJ3dlYnZyLWJ1dHRvbic7XG4gIHZhciBzID0gYnV0dG9uLnN0eWxlO1xuICBzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgcy53aWR0aCA9ICcyNHB4J1xuICBzLmhlaWdodCA9ICcyNHB4JztcbiAgcy5iYWNrZ3JvdW5kU2l6ZSA9ICdjb3Zlcic7XG4gIHMuYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgcy5ib3JkZXIgPSAwO1xuICBzLnVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gIHMud2Via2l0VXNlclNlbGVjdCA9ICdub25lJztcbiAgcy5Nb3pVc2VyU2VsZWN0ID0gJ25vbmUnO1xuICBzLmN1cnNvciA9ICdwb2ludGVyJztcbiAgcy5wYWRkaW5nID0gJzEycHgnO1xuICBzLnpJbmRleCA9IDE7XG4gIHMuZGlzcGxheSA9ICdub25lJztcbiAgcy5ib3hTaXppbmcgPSAnY29udGVudC1ib3gnO1xuXG4gIC8vIFByZXZlbnQgYnV0dG9uIGZyb20gYmVpbmcgc2VsZWN0ZWQgYW5kIGRyYWdnZWQuXG4gIGJ1dHRvbi5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIC8vIFN0eWxlIGl0IG9uIGhvdmVyLlxuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICBzLmZpbHRlciA9IHMud2Via2l0RmlsdGVyID0gJ2Ryb3Atc2hhZG93KDAgMCA1cHggcmdiYSgyNTUsMjU1LDI1NSwxKSknO1xuICB9KTtcbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgcy5maWx0ZXIgPSBzLndlYmtpdEZpbHRlciA9ICcnO1xuICB9KTtcbiAgcmV0dXJuIGJ1dHRvbjtcbn07XG5cbkJ1dHRvbk1hbmFnZXIucHJvdG90eXBlLnNldE1vZGUgPSBmdW5jdGlvbihtb2RlLCBpc1ZSQ29tcGF0aWJsZSkge1xuICBpc1ZSQ29tcGF0aWJsZSA9IGlzVlJDb21wYXRpYmxlIHx8IFdlYlZSQ29uZmlnLkZPUkNFX0VOQUJMRV9WUjtcbiAgaWYgKCF0aGlzLmlzVmlzaWJsZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBzd2l0Y2ggKG1vZGUpIHtcbiAgICBjYXNlIE1vZGVzLk5PUk1BTDpcbiAgICAgIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB0aGlzLmZzQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuZnVsbHNjcmVlbjtcbiAgICAgIHRoaXMudnJCdXR0b24uc3R5bGUuZGlzcGxheSA9IChpc1ZSQ29tcGF0aWJsZSA/ICdibG9jaycgOiAnbm9uZScpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgdGhpcy5mc0J1dHRvbi5zcmMgPSB0aGlzLklDT05TLmV4aXRGdWxsc2NyZWVuO1xuICAgICAgdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5WUjpcbiAgICAgIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMudnJCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gSGFjayBmb3IgU2FmYXJpIE1hYy9pT1MgdG8gZm9yY2UgcmVsYXlvdXQgKHN2Zy1zcGVjaWZpYyBpc3N1ZSlcbiAgLy8gaHR0cDovL2dvby5nbC9oamdSNnJcbiAgdmFyIG9sZFZhbHVlID0gdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5O1xuICB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJztcbiAgdGhpcy5mc0J1dHRvbi5vZmZzZXRIZWlnaHQ7XG4gIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9IG9sZFZhbHVlO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUuc2V0VmlzaWJpbGl0eSA9IGZ1bmN0aW9uKGlzVmlzaWJsZSkge1xuICB0aGlzLmlzVmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gaXNWaXNpYmxlID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gaXNWaXNpYmxlID8gJ2Jsb2NrJyA6ICdub25lJztcbn07XG5cbkJ1dHRvbk1hbmFnZXIucHJvdG90eXBlLmNyZWF0ZUNsaWNrSGFuZGxlcl8gPSBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmVtaXQoZXZlbnROYW1lKTtcbiAgfS5iaW5kKHRoaXMpO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUubG9hZEljb25zXyA9IGZ1bmN0aW9uKCkge1xuICAvLyBQcmVsb2FkIHNvbWUgaGFyZC1jb2RlZCBTVkcuXG4gIHRoaXMuSUNPTlMgPSB7fTtcbiAgdGhpcy5JQ09OUy5jYXJkYm9hcmQgPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NakF1TnpRZ05rZ3pMakl4UXpJdU5UVWdOaUF5SURZdU5UY2dNaUEzTGpJNGRqRXdMalEwWXpBZ0xqY3VOVFVnTVM0eU9DQXhMakl6SURFdU1qaG9OQzQzT1dNdU5USWdNQ0F1T1RZdExqTXpJREV1TVRRdExqYzViREV1TkMwekxqUTRZeTR5TXkwdU5Ua3VOemt0TVM0d01TQXhMalEwTFRFdU1ERnpNUzR5TVM0ME1pQXhMalExSURFdU1ERnNNUzR6T1NBekxqUTRZeTR4T1M0ME5pNDJNeTQzT1NBeExqRXhMamM1YURRdU56bGpMamN4SURBZ01TNHlOaTB1TlRjZ01TNHlOaTB4TGpJNFZqY3VNamhqTUMwdU55MHVOVFV0TVM0eU9DMHhMakkyTFRFdU1qaDZUVGN1TlNBeE5DNDJNbU10TVM0eE55QXdMVEl1TVRNdExqazFMVEl1TVRNdE1pNHhNaUF3TFRFdU1UY3VPVFl0TWk0eE15QXlMakV6TFRJdU1UTWdNUzR4T0NBd0lESXVNVEl1T1RZZ01pNHhNaUF5TGpFemN5MHVPVFVnTWk0eE1pMHlMakV5SURJdU1USjZiVGtnTUdNdE1TNHhOeUF3TFRJdU1UTXRMamsxTFRJdU1UTXRNaTR4TWlBd0xURXVNVGN1T1RZdE1pNHhNeUF5TGpFekxUSXVNVE56TWk0eE1pNDVOaUF5TGpFeUlESXVNVE10TGprMUlESXVNVEl0TWk0eE1pQXlMakV5ZWlJdlBnb2dJQ0FnUEhCaGRHZ2dabWxzYkQwaWJtOXVaU0lnWkQwaVRUQWdNR2d5TkhZeU5FZ3dWakI2SWk4K0Nqd3ZjM1puUGdvPScpO1xuICB0aGlzLklDT05TLmZ1bGxzY3JlZW4gPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NQ0F3YURJMGRqSTBTREI2SWlCbWFXeHNQU0p1YjI1bElpOCtDaUFnSUNBOGNHRjBhQ0JrUFNKTk55QXhORWcxZGpWb05YWXRNa2czZGkwemVtMHRNaTAwYURKV04yZ3pWalZJTlhZMWVtMHhNaUEzYUMwemRqSm9OWFl0TldndE1uWXplazB4TkNBMWRqSm9NM1l6YURKV05XZ3ROWG9pTHo0S1BDOXpkbWMrQ2c9PScpO1xuICB0aGlzLklDT05TLmV4aXRGdWxsc2NyZWVuID0gVXRpbC5iYXNlNjQoJ2ltYWdlL3N2Zyt4bWwnLCAnUEhOMlp5QjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIZHBaSFJvUFNJeU5IQjRJaUJvWldsbmFIUTlJakkwY0hnaUlIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSWdabWxzYkQwaUkwWkdSa1pHUmlJK0NpQWdJQ0E4Y0dGMGFDQmtQU0pOTUNBd2FESTBkakkwU0RCNklpQm1hV3hzUFNKdWIyNWxJaTgrQ2lBZ0lDQThjR0YwYUNCa1BTSk5OU0F4Tm1nemRqTm9Nbll0TlVnMWRqSjZiVE10T0VnMWRqSm9OVlkxU0RoMk0zcHROaUF4TVdneWRpMHphRE4yTFRKb0xUVjJOWHB0TWkweE1WWTFhQzB5ZGpWb05WWTRhQzB6ZWlJdlBnbzhMM04yWno0SycpO1xuICB0aGlzLklDT05TLnNldHRpbmdzID0gVXRpbC5iYXNlNjQoJ2ltYWdlL3N2Zyt4bWwnLCAnUEhOMlp5QjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIZHBaSFJvUFNJeU5IQjRJaUJvWldsbmFIUTlJakkwY0hnaUlIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSWdabWxzYkQwaUkwWkdSa1pHUmlJK0NpQWdJQ0E4Y0dGMGFDQmtQU0pOTUNBd2FESTBkakkwU0RCNklpQm1hV3hzUFNKdWIyNWxJaTgrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NVGt1TkRNZ01USXVPVGhqTGpBMExTNHpNaTR3TnkwdU5qUXVNRGN0TGprNGN5MHVNRE10TGpZMkxTNHdOeTB1T1Roc01pNHhNUzB4TGpZMVl5NHhPUzB1TVRVdU1qUXRMalF5TGpFeUxTNDJOR3d0TWkwekxqUTJZeTB1TVRJdExqSXlMUzR6T1MwdU15MHVOakV0TGpJeWJDMHlMalE1SURGakxTNDFNaTB1TkMweExqQTRMUzQzTXkweExqWTVMUzQ1T0d3dExqTTRMVEl1TmpWRE1UUXVORFlnTWk0eE9DQXhOQzR5TlNBeUlERTBJREpvTFRSakxTNHlOU0F3TFM0ME5pNHhPQzB1TkRrdU5ESnNMUzR6T0NBeUxqWTFZeTB1TmpFdU1qVXRNUzR4Tnk0MU9TMHhMalk1TGprNGJDMHlMalE1TFRGakxTNHlNeTB1TURrdExqUTVJREF0TGpZeExqSXliQzB5SURNdU5EWmpMUzR4TXk0eU1pMHVNRGN1TkRrdU1USXVOalJzTWk0eE1TQXhMalkxWXkwdU1EUXVNekl0TGpBM0xqWTFMUzR3Tnk0NU9ITXVNRE11TmpZdU1EY3VPVGhzTFRJdU1URWdNUzQyTldNdExqRTVMakUxTFM0eU5DNDBNaTB1TVRJdU5qUnNNaUF6TGpRMll5NHhNaTR5TWk0ek9TNHpMall4TGpJeWJESXVORGt0TVdNdU5USXVOQ0F4TGpBNExqY3pJREV1TmprdU9UaHNMak00SURJdU5qVmpMakF6TGpJMExqSTBMalF5TGpRNUxqUXlhRFJqTGpJMUlEQWdMalEyTFM0eE9DNDBPUzB1TkRKc0xqTTRMVEl1TmpWakxqWXhMUzR5TlNBeExqRTNMUzQxT1NBeExqWTVMUzQ1T0d3eUxqUTVJREZqTGpJekxqQTVMalE1SURBZ0xqWXhMUzR5TW13eUxUTXVORFpqTGpFeUxTNHlNaTR3TnkwdU5Ea3RMakV5TFM0Mk5Hd3RNaTR4TVMweExqWTFlazB4TWlBeE5TNDFZeTB4TGpreklEQXRNeTQxTFRFdU5UY3RNeTQxTFRNdU5YTXhMalUzTFRNdU5TQXpMalV0TXk0MUlETXVOU0F4TGpVM0lETXVOU0F6TGpVdE1TNDFOeUF6TGpVdE15NDFJRE11TlhvaUx6NEtQQzl6ZG1jK0NnPT0nKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uTWFuYWdlcjtcblxufSx7XCIuL2VtaXR0ZXIuanNcIjoyLFwiLi9tb2Rlcy5qc1wiOjMsXCIuL3V0aWwuanNcIjo0fV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5mdW5jdGlvbiBFbWl0dGVyKCkge1xuICB0aGlzLmNhbGxiYWNrcyA9IHt9O1xufVxuXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnROYW1lKSB7XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdO1xuICBpZiAoIWNhbGxiYWNrcykge1xuICAgIC8vY29uc29sZS5sb2coJ05vIHZhbGlkIGNhbGxiYWNrIHNwZWNpZmllZC4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gIC8vIEVsaW1pbmF0ZSB0aGUgZmlyc3QgcGFyYW0gKHRoZSBjYWxsYmFjaykuXG4gIGFyZ3Muc2hpZnQoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cbn07XG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICBpZiAoZXZlbnROYW1lIGluIHRoaXMuY2FsbGJhY2tzKSB7XG4gICAgdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdID0gW2NhbGxiYWNrXTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xuXG59LHt9XSwzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBNb2RlcyA9IHtcbiAgVU5LTk9XTjogMCxcbiAgLy8gTm90IGZ1bGxzY3JlZW4sIGp1c3QgdHJhY2tpbmcuXG4gIE5PUk1BTDogMSxcbiAgLy8gTWFnaWMgd2luZG93IGltbWVyc2l2ZSBtb2RlLlxuICBNQUdJQ19XSU5ET1c6IDIsXG4gIC8vIEZ1bGwgc2NyZWVuIHNwbGl0IHNjcmVlbiBWUiBtb2RlLlxuICBWUjogMyxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZXM7XG5cbn0se31dLDQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSB7fTtcblxuVXRpbC5iYXNlNjQgPSBmdW5jdGlvbihtaW1lVHlwZSwgYmFzZTY0KSB7XG4gIHJldHVybiAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgYmFzZTY0O1xufTtcblxuVXRpbC5pc01vYmlsZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2hlY2sgPSBmYWxzZTtcbiAgKGZ1bmN0aW9uKGEpe2lmKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcmlzfGtpbmRsZXxsZ2UgfG1hZW1vfG1pZHB8bW1wfG1vYmlsZS4rZmlyZWZveHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyBjZXx4ZGF8eGlpbm8vaS50ZXN0KGEpfHwvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KGEuc3Vic3RyKDAsNCkpKWNoZWNrID0gdHJ1ZX0pKG5hdmlnYXRvci51c2VyQWdlbnR8fG5hdmlnYXRvci52ZW5kb3J8fHdpbmRvdy5vcGVyYSk7XG4gIHJldHVybiBjaGVjaztcbn07XG5cblV0aWwuaXNGaXJlZm94ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAvZmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59O1xuXG5VdGlsLmlzSU9TID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAvKGlQYWR8aVBob25lfGlQb2QpL2cudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn07XG5cblV0aWwuaXNJRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93LnNlbGYgIT09IHdpbmRvdy50b3A7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTtcblxuVXRpbC5hcHBlbmRRdWVyeVBhcmFtZXRlciA9IGZ1bmN0aW9uKHVybCwga2V5LCB2YWx1ZSkge1xuICAvLyBEZXRlcm1pbmUgZGVsaW1pdGVyIGJhc2VkIG9uIGlmIHRoZSBVUkwgYWxyZWFkeSBHRVQgcGFyYW1ldGVycyBpbiBpdC5cbiAgdmFyIGRlbGltaXRlciA9ICh1cmwuaW5kZXhPZignPycpIDwgMCA/ICc/JyA6ICcmJyk7XG4gIHVybCArPSBkZWxpbWl0ZXIgKyBrZXkgKyAnPScgKyB2YWx1ZTtcbiAgcmV0dXJuIHVybDtcbn07XG5cbi8vIEZyb20gaHR0cDovL2dvby5nbC80V1gzdGdcblV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXS8sIFwiXFxcXFtcIikucmVwbGFjZSgvW1xcXV0vLCBcIlxcXFxdXCIpO1xuICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiW1xcXFw/Jl1cIiArIG5hbWUgKyBcIj0oW14mI10qKVwiKSxcbiAgICAgIHJlc3VsdHMgPSByZWdleC5leGVjKGxvY2F0aW9uLnNlYXJjaCk7XG4gIHJldHVybiByZXN1bHRzID09PSBudWxsID8gXCJcIiA6IGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzFdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xufTtcblxuVXRpbC5pc0xhbmRzY2FwZU1vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh3aW5kb3cub3JpZW50YXRpb24gPT0gOTAgfHwgd2luZG93Lm9yaWVudGF0aW9uID09IC05MCk7XG59O1xuXG5VdGlsLmdldFNjcmVlbldpZHRoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLm1heCh3aW5kb3cuc2NyZWVuLndpZHRoLCB3aW5kb3cuc2NyZWVuLmhlaWdodCkgKlxuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW87XG59O1xuXG5VdGlsLmdldFNjcmVlbkhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5taW4od2luZG93LnNjcmVlbi53aWR0aCwgd2luZG93LnNjcmVlbi5oZWlnaHQpICpcbiAgICAgIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBVdGlsO1xuXG59LHt9XSw1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBCdXR0b25NYW5hZ2VyID0gX2RlcmVxXygnLi9idXR0b24tbWFuYWdlci5qcycpO1xudmFyIEVtaXR0ZXIgPSBfZGVyZXFfKCcuL2VtaXR0ZXIuanMnKTtcbnZhciBNb2RlcyA9IF9kZXJlcV8oJy4vbW9kZXMuanMnKTtcbnZhciBVdGlsID0gX2RlcmVxXygnLi91dGlsLmpzJyk7XG5cbi8qKlxuICogSGVscGVyIGZvciBnZXR0aW5nIGluIGFuZCBvdXQgb2YgVlIgbW9kZS5cbiAqL1xuZnVuY3Rpb24gV2ViVlJNYW5hZ2VyKHJlbmRlcmVyLCBlZmZlY3QsIHBhcmFtcykge1xuICB0aGlzLnBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcblxuICB0aGlzLm1vZGUgPSBNb2Rlcy5VTktOT1dOO1xuXG4gIC8vIFNldCBvcHRpb24gdG8gaGlkZSB0aGUgYnV0dG9uLlxuICB0aGlzLmhpZGVCdXR0b24gPSB0aGlzLnBhcmFtcy5oaWRlQnV0dG9uIHx8IGZhbHNlO1xuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGUgRk9WIHNob3VsZCBiZSBkaXN0b3J0ZWQgb3IgdW4tZGlzdG9ydGVkLiBCeSBkZWZhdWx0LCBpdFxuICAvLyBzaG91bGQgYmUgZGlzdG9ydGVkLCBidXQgaW4gdGhlIGNhc2Ugb2YgdmVydGV4IHNoYWRlciBiYXNlZCBkaXN0b3J0aW9uLFxuICAvLyBlbnN1cmUgdGhhdCB3ZSB1c2UgdW5kaXN0b3J0ZWQgcGFyYW1ldGVycy5cbiAgdGhpcy5wcmVkaXN0b3J0ZWQgPSAhIXRoaXMucGFyYW1zLnByZWRpc3RvcnRlZDtcblxuICAvLyBTYXZlIHRoZSBUSFJFRS5qcyByZW5kZXJlciBhbmQgZWZmZWN0IGZvciBsYXRlci5cbiAgdGhpcy5yZW5kZXJlciA9IHJlbmRlcmVyO1xuICB0aGlzLmVmZmVjdCA9IGVmZmVjdDtcbiAgdmFyIHBvbHlmaWxsV3JhcHBlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy53ZWJ2ci1wb2x5ZmlsbC1mdWxsc2NyZWVuLXdyYXBwZXInKTtcbiAgdGhpcy5idXR0b24gPSBuZXcgQnV0dG9uTWFuYWdlcihwb2x5ZmlsbFdyYXBwZXIpO1xuXG4gIHRoaXMuaXNGdWxsc2NyZWVuRGlzYWJsZWQgPSAhIVV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIoJ25vX2Z1bGxzY3JlZW4nKTtcbiAgdGhpcy5zdGFydE1vZGUgPSBNb2Rlcy5OT1JNQUw7XG4gIHZhciBzdGFydE1vZGVQYXJhbSA9IHBhcnNlSW50KFV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIoJ3N0YXJ0X21vZGUnKSk7XG4gIGlmICghaXNOYU4oc3RhcnRNb2RlUGFyYW0pKSB7XG4gICAgdGhpcy5zdGFydE1vZGUgPSBzdGFydE1vZGVQYXJhbTtcbiAgfVxuXG4gIGlmICh0aGlzLmhpZGVCdXR0b24pIHtcbiAgICB0aGlzLmJ1dHRvbi5zZXRWaXNpYmlsaXR5KGZhbHNlKTtcbiAgfVxuXG4gIC8vIENoZWNrIGlmIHRoZSBicm93c2VyIGlzIGNvbXBhdGlibGUgd2l0aCBXZWJWUi5cbiAgdGhpcy5nZXREZXZpY2VCeVR5cGVfKFZSRGlzcGxheSkudGhlbihmdW5jdGlvbihobWQpIHtcbiAgICB0aGlzLmhtZCA9IGhtZDtcblxuICAgIC8vIE9ubHkgZW5hYmxlIFZSIG1vZGUgaWYgdGhlcmUncyBhIFZSIGRldmljZSBhdHRhY2hlZCBvciB3ZSBhcmUgcnVubmluZyB0aGVcbiAgICAvLyBwb2x5ZmlsbCBvbiBtb2JpbGUuXG4gICAgaWYgKCF0aGlzLmlzVlJDb21wYXRpYmxlT3ZlcnJpZGUpIHtcbiAgICAgIHRoaXMuaXNWUkNvbXBhdGlibGUgPSAgIWhtZC5pc1BvbHlmaWxsZWQgfHwgVXRpbC5pc01vYmlsZSgpO1xuICAgIH1cblxuICAgIHN3aXRjaCAodGhpcy5zdGFydE1vZGUpIHtcbiAgICAgIGNhc2UgTW9kZXMuTUFHSUNfV0lORE9XOlxuICAgICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk1BR0lDX1dJTkRPVyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBNb2Rlcy5WUjpcbiAgICAgICAgdGhpcy5lbnRlclZSTW9kZV8oKTtcbiAgICAgICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5WUik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5OT1JNQUwpO1xuICAgIH1cblxuICAgIHRoaXMuZW1pdCgnaW5pdGlhbGl6ZWQnKTtcbiAgfS5iaW5kKHRoaXMpKTtcblxuICAvLyBIb29rIHVwIGJ1dHRvbiBsaXN0ZW5lcnMuXG4gIHRoaXMuYnV0dG9uLm9uKCdmcycsIHRoaXMub25GU0NsaWNrXy5iaW5kKHRoaXMpKTtcbiAgdGhpcy5idXR0b24ub24oJ3ZyJywgdGhpcy5vblZSQ2xpY2tfLmJpbmQodGhpcykpO1xuXG4gIC8vIEJpbmQgdG8gZnVsbHNjcmVlbiBldmVudHMuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UnLFxuICAgICAgdGhpcy5vbkZ1bGxzY3JlZW5DaGFuZ2VfLmJpbmQodGhpcykpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJyxcbiAgICAgIHRoaXMub25GdWxsc2NyZWVuQ2hhbmdlXy5iaW5kKHRoaXMpKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbXNmdWxsc2NyZWVuY2hhbmdlJyxcbiAgICAgIHRoaXMub25GdWxsc2NyZWVuQ2hhbmdlXy5iaW5kKHRoaXMpKTtcblxuICAvLyBCaW5kIHRvIFZSKiBzcGVjaWZpYyBldmVudHMuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd2cmRpc3BsYXlwcmVzZW50Y2hhbmdlJyxcbiAgICAgIHRoaXMub25WUkRpc3BsYXlQcmVzZW50Q2hhbmdlXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheWRldmljZXBhcmFtc2NoYW5nZScsXG4gICAgICB0aGlzLm9uVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXy5iaW5kKHRoaXMpKTtcbn1cblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZSA9IG5ldyBFbWl0dGVyKCk7XG5cbi8vIEV4cG9zZSB0aGVzZSB2YWx1ZXMgZXh0ZXJuYWxseS5cbldlYlZSTWFuYWdlci5Nb2RlcyA9IE1vZGVzO1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKHNjZW5lLCBjYW1lcmEsIHRpbWVzdGFtcCkge1xuICAvLyBTY2VuZSBtYXkgYmUgYW4gYXJyYXkgb2YgdHdvIHNjZW5lcywgb25lIGZvciBlYWNoIGV5ZS5cbiAgaWYgKHNjZW5lIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICB0aGlzLmVmZmVjdC5yZW5kZXIoc2NlbmVbMF0sIGNhbWVyYSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5lZmZlY3QucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnNldFZSQ29tcGF0aWJsZU92ZXJyaWRlID0gZnVuY3Rpb24oaXNWUkNvbXBhdGlibGUpIHtcbiAgdGhpcy5pc1ZSQ29tcGF0aWJsZSA9IGlzVlJDb21wYXRpYmxlO1xuICB0aGlzLmlzVlJDb21wYXRpYmxlT3ZlcnJpZGUgPSB0cnVlO1xuXG4gIC8vIERvbid0IGFjdHVhbGx5IGNoYW5nZSBtb2RlcywganVzdCB1cGRhdGUgdGhlIGJ1dHRvbnMuXG4gIHRoaXMuYnV0dG9uLnNldE1vZGUodGhpcy5tb2RlLCB0aGlzLmlzVlJDb21wYXRpYmxlKTtcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuc2V0RnVsbHNjcmVlbkNhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdGhpcy5mdWxsc2NyZWVuQ2FsbGJhY2sgPSBjYWxsYmFjaztcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuc2V0VlJDYWxsYmFjayA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHRoaXMudnJDYWxsYmFjayA9IGNhbGxiYWNrO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRFeGl0RnVsbHNjcmVlbkNhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdGhpcy5leGl0RnVsbHNjcmVlbkNhbGxiYWNrID0gY2FsbGJhY2s7XG59XG5cbi8qKlxuICogUHJvbWlzZSByZXR1cm5zIHRydWUgaWYgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIEhNRCBkZXZpY2UgYXZhaWxhYmxlLlxuICovXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLmdldERldmljZUJ5VHlwZV8gPSBmdW5jdGlvbih0eXBlKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cygpLnRoZW4oZnVuY3Rpb24oZGlzcGxheXMpIHtcbiAgICAgIC8vIFByb21pc2Ugc3VjY2VlZHMsIGJ1dCBjaGVjayBpZiB0aGVyZSBhcmUgYW55IGRpc3BsYXlzIGFjdHVhbGx5LlxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkaXNwbGF5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZGlzcGxheXNbaV0gaW5zdGFuY2VvZiB0eXBlKSB7XG4gICAgICAgICAgcmVzb2x2ZShkaXNwbGF5c1tpXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAvLyBObyBkaXNwbGF5cyBhcmUgZm91bmQuXG4gICAgICByZXNvbHZlKG51bGwpO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbi8qKlxuICogSGVscGVyIGZvciBlbnRlcmluZyBWUiBtb2RlLlxuICovXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLmVudGVyVlJNb2RlXyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmhtZC5yZXF1ZXN0UHJlc2VudChbe1xuICAgIHNvdXJjZTogdGhpcy5yZW5kZXJlci5kb21FbGVtZW50LFxuICAgIHByZWRpc3RvcnRlZDogdGhpcy5wcmVkaXN0b3J0ZWRcbiAgfV0pO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRNb2RlXyA9IGZ1bmN0aW9uKG1vZGUpIHtcbiAgdmFyIG9sZE1vZGUgPSB0aGlzLm1vZGU7XG4gIGlmIChtb2RlID09IHRoaXMubW9kZSkge1xuICAgIGNvbnNvbGUud2FybignTm90IGNoYW5naW5nIG1vZGVzLCBhbHJlYWR5IGluICVzJywgbW9kZSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIGNvbnNvbGUubG9nKCdNb2RlIGNoYW5nZTogJXMgPT4gJXMnLCB0aGlzLm1vZGUsIG1vZGUpO1xuICB0aGlzLm1vZGUgPSBtb2RlO1xuICB0aGlzLmJ1dHRvbi5zZXRNb2RlKG1vZGUsIHRoaXMuaXNWUkNvbXBhdGlibGUpO1xuXG4gIC8vIEVtaXQgYW4gZXZlbnQgaW5kaWNhdGluZyB0aGUgbW9kZSBjaGFuZ2VkLlxuICB0aGlzLmVtaXQoJ21vZGVjaGFuZ2UnLCBtb2RlLCBvbGRNb2RlKTtcbn07XG5cbi8qKlxuICogTWFpbiBidXR0b24gd2FzIGNsaWNrZWQuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUub25GU0NsaWNrXyA9IGZ1bmN0aW9uKCkge1xuICBzd2l0Y2ggKHRoaXMubW9kZSkge1xuICAgIGNhc2UgTW9kZXMuTk9STUFMOlxuICAgICAgLy8gVE9ETzogUmVtb3ZlIHRoaXMgaGFjayBpZi93aGVuIGlPUyBnZXRzIHJlYWwgZnVsbHNjcmVlbiBtb2RlLlxuICAgICAgLy8gSWYgdGhpcyBpcyBhbiBpZnJhbWUgb24gaU9TLCBicmVhayBvdXQgYW5kIG9wZW4gaW4gbm9fZnVsbHNjcmVlbiBtb2RlLlxuICAgICAgaWYgKFV0aWwuaXNJT1MoKSAmJiBVdGlsLmlzSUZyYW1lKCkpIHtcbiAgICAgICAgaWYgKHRoaXMuZnVsbHNjcmVlbkNhbGxiYWNrKSB7XG4gICAgICAgICAgdGhpcy5mdWxsc2NyZWVuQ2FsbGJhY2soKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICAgICAgdXJsID0gVXRpbC5hcHBlbmRRdWVyeVBhcmFtZXRlcih1cmwsICdub19mdWxsc2NyZWVuJywgJ3RydWUnKTtcbiAgICAgICAgICB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKHVybCwgJ3N0YXJ0X21vZGUnLCBNb2Rlcy5NQUdJQ19XSU5ET1cpO1xuICAgICAgICAgIHRvcC5sb2NhdGlvbi5ocmVmID0gdXJsO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5NQUdJQ19XSU5ET1cpO1xuICAgICAgdGhpcy5yZXF1ZXN0RnVsbHNjcmVlbl8oKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgTW9kZXMuTUFHSUNfV0lORE9XOlxuICAgICAgaWYgKHRoaXMuaXNGdWxsc2NyZWVuRGlzYWJsZWQpIHtcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5leGl0RnVsbHNjcmVlbkNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuZXhpdEZ1bGxzY3JlZW5DYWxsYmFjaygpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5OT1JNQUwpO1xuICAgICAgdGhpcy5leGl0RnVsbHNjcmVlbl8oKTtcbiAgICAgIGJyZWFrO1xuICB9XG59O1xuXG4vKipcbiAqIFRoZSBWUiBidXR0b24gd2FzIGNsaWNrZWQuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUub25WUkNsaWNrXyA9IGZ1bmN0aW9uKCkge1xuICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBoYWNrIHdoZW4gaU9TIGhhcyBmdWxsc2NyZWVuIG1vZGUuXG4gIC8vIElmIHRoaXMgaXMgYW4gaWZyYW1lIG9uIGlPUywgYnJlYWsgb3V0IGFuZCBvcGVuIGluIG5vX2Z1bGxzY3JlZW4gbW9kZS5cbiAgaWYgKHRoaXMubW9kZSA9PSBNb2Rlcy5OT1JNQUwgJiYgVXRpbC5pc0lPUygpICYmIFV0aWwuaXNJRnJhbWUoKSkge1xuICAgIGlmICh0aGlzLnZyQ2FsbGJhY2spIHtcbiAgICAgIHRoaXMudnJDYWxsYmFjaygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKHVybCwgJ25vX2Z1bGxzY3JlZW4nLCAndHJ1ZScpO1xuICAgICAgdXJsID0gVXRpbC5hcHBlbmRRdWVyeVBhcmFtZXRlcih1cmwsICdzdGFydF9tb2RlJywgTW9kZXMuVlIpO1xuICAgICAgdG9wLmxvY2F0aW9uLmhyZWYgPSB1cmw7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIHRoaXMuZW50ZXJWUk1vZGVfKCk7XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnJlcXVlc3RGdWxsc2NyZWVuXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuYm9keTtcbiAgLy92YXIgY2FudmFzID0gdGhpcy5yZW5kZXJlci5kb21FbGVtZW50O1xuICBpZiAoY2FudmFzLnJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgY2FudmFzLnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoY2FudmFzLm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgY2FudmFzLm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoY2FudmFzLndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgY2FudmFzLndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoY2FudmFzLm1zUmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBjYW52YXMubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLmV4aXRGdWxsc2NyZWVuXyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC5tc0V4aXRGdWxsc2NyZWVuKCk7XG4gIH1cbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUub25WUkRpc3BsYXlQcmVzZW50Q2hhbmdlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgY29uc29sZS5sb2coJ29uVlJEaXNwbGF5UHJlc2VudENoYW5nZV8nLCBlKTtcbiAgaWYgKHRoaXMuaG1kLmlzUHJlc2VudGluZykge1xuICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuVlIpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuTk9STUFMKTtcbiAgfVxufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vblZSRGlzcGxheURldmljZVBhcmFtc0NoYW5nZV8gPSBmdW5jdGlvbihlKSB7XG4gIGNvbnNvbGUubG9nKCdvblZSRGlzcGxheURldmljZVBhcmFtc0NoYW5nZV8nLCBlKTtcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUub25GdWxsc2NyZWVuQ2hhbmdlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgLy8gSWYgd2UgbGVhdmUgZnVsbC1zY3JlZW4sIGdvIGJhY2sgdG8gbm9ybWFsIG1vZGUuXG4gIGlmIChkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCA9PT0gbnVsbCB8fFxuICAgICAgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVsZW1lbnQgPT09IG51bGwpIHtcbiAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViVlJNYW5hZ2VyO1xuXG59LHtcIi4vYnV0dG9uLW1hbmFnZXIuanNcIjoxLFwiLi9lbWl0dGVyLmpzXCI6MixcIi4vbW9kZXMuanNcIjozLFwiLi91dGlsLmpzXCI6NH1dfSx7fSxbNV0pKDUpXG59KTsiLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5jb25zdCBIRUFEX0VMQk9XX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAuMTU1LCAtMC40NjUsIC0wLjE1KTtcbmNvbnN0IEVMQk9XX1dSSVNUX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0wLjI1KTtcbmNvbnN0IFdSSVNUX0NPTlRST0xMRVJfT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMC4wNSk7XG5jb25zdCBBUk1fRVhURU5TSU9OX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKC0wLjA4LCAwLjE0LCAwLjA4KTtcblxuY29uc3QgRUxCT1dfQkVORF9SQVRJTyA9IDAuNDsgLy8gNDAlIGVsYm93LCA2MCUgd3Jpc3QuXG5jb25zdCBFWFRFTlNJT05fUkFUSU9fV0VJR0hUID0gMC40O1xuXG5jb25zdCBNSU5fQU5HVUxBUl9TUEVFRCA9IDAuNjE7IC8vIDM1IGRlZ3JlZXMgcGVyIHNlY29uZCAoaW4gcmFkaWFucykuXG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgYXJtIG1vZGVsIGZvciB0aGUgRGF5ZHJlYW0gY29udHJvbGxlci4gRmVlZCBpdCBhIGNhbWVyYSBhbmRcbiAqIHRoZSBjb250cm9sbGVyLiBVcGRhdGUgaXQgb24gYSBSQUYuXG4gKlxuICogR2V0IHRoZSBtb2RlbCdzIHBvc2UgdXNpbmcgZ2V0UG9zZSgpLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPcmllbnRhdGlvbkFybU1vZGVsIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBmYWxzZTtcblxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIGNvbnRyb2xsZXIgb3JpZW50YXRpb25zLlxuICAgIHRoaXMuY29udHJvbGxlclEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHRoaXMubGFzdENvbnRyb2xsZXJRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIGhlYWQgb3JpZW50YXRpb25zLlxuICAgIHRoaXMuaGVhZFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgLy8gQ3VycmVudCBoZWFkIHBvc2l0aW9uLlxuICAgIHRoaXMuaGVhZFBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICAvLyBQb3NpdGlvbnMgb2Ygb3RoZXIgam9pbnRzIChtb3N0bHkgZm9yIGRlYnVnZ2luZykuXG4gICAgdGhpcy5lbGJvd1BvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgdGhpcy53cmlzdFBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyB0aW1lcyB0aGUgbW9kZWwgd2FzIHVwZGF0ZWQuXG4gICAgdGhpcy50aW1lID0gbnVsbDtcbiAgICB0aGlzLmxhc3RUaW1lID0gbnVsbDtcblxuICAgIC8vIFJvb3Qgcm90YXRpb24uXG4gICAgdGhpcy5yb290USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAvLyBDdXJyZW50IHBvc2UgdGhhdCB0aGlzIGFybSBtb2RlbCBjYWxjdWxhdGVzLlxuICAgIHRoaXMucG9zZSA9IHtcbiAgICAgIG9yaWVudGF0aW9uOiBuZXcgVEhSRUUuUXVhdGVybmlvbigpLFxuICAgICAgcG9zaXRpb246IG5ldyBUSFJFRS5WZWN0b3IzKClcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIE1ldGhvZHMgdG8gc2V0IGNvbnRyb2xsZXIgYW5kIGhlYWQgcG9zZSAoaW4gd29ybGQgY29vcmRpbmF0ZXMpLlxuICAgKi9cbiAgc2V0Q29udHJvbGxlck9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLmxhc3RDb250cm9sbGVyUS5jb3B5KHRoaXMuY29udHJvbGxlclEpO1xuICAgIHRoaXMuY29udHJvbGxlclEuY29weShxdWF0ZXJuaW9uKTtcbiAgfVxuXG4gIHNldEhlYWRPcmllbnRhdGlvbihxdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5oZWFkUS5jb3B5KHF1YXRlcm5pb24pO1xuICB9XG5cbiAgc2V0SGVhZFBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgdGhpcy5oZWFkUG9zLmNvcHkocG9zaXRpb24pO1xuICB9XG5cbiAgc2V0TGVmdEhhbmRlZChpc0xlZnRIYW5kZWQpIHtcbiAgICAvLyBUT0RPKHNtdXMpOiBJbXBsZW1lbnQgbWUhXG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBpc0xlZnRIYW5kZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIG9uIGEgUkFGLlxuICAgKi9cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMudGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgLy8gSWYgdGhlIGNvbnRyb2xsZXIncyBhbmd1bGFyIHZlbG9jaXR5IGlzIGFib3ZlIGEgY2VydGFpbiBhbW91bnQsIHdlIGNhblxuICAgIC8vIGFzc3VtZSB0b3JzbyByb3RhdGlvbiBhbmQgbW92ZSB0aGUgZWxib3cgam9pbnQgcmVsYXRpdmUgdG8gdGhlXG4gICAgLy8gY2FtZXJhIG9yaWVudGF0aW9uLlxuICAgIGxldCBoZWFkWWF3USA9IHRoaXMuZ2V0SGVhZFlhd09yaWVudGF0aW9uXygpO1xuICAgIGxldCB0aW1lRGVsdGEgPSAodGhpcy50aW1lIC0gdGhpcy5sYXN0VGltZSkgLyAxMDAwO1xuICAgIGxldCBhbmdsZURlbHRhID0gdGhpcy5xdWF0QW5nbGVfKHRoaXMubGFzdENvbnRyb2xsZXJRLCB0aGlzLmNvbnRyb2xsZXJRKTtcbiAgICBsZXQgY29udHJvbGxlckFuZ3VsYXJTcGVlZCA9IGFuZ2xlRGVsdGEgLyB0aW1lRGVsdGE7XG4gICAgaWYgKGNvbnRyb2xsZXJBbmd1bGFyU3BlZWQgPiBNSU5fQU5HVUxBUl9TUEVFRCkge1xuICAgICAgLy8gQXR0ZW51YXRlIHRoZSBSb290IHJvdGF0aW9uIHNsaWdodGx5LlxuICAgICAgdGhpcy5yb290US5zbGVycChoZWFkWWF3USwgYW5nbGVEZWx0YSAvIDEwKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJvb3RRLmNvcHkoaGVhZFlhd1EpO1xuICAgIH1cblxuICAgIC8vIFdlIHdhbnQgdG8gbW92ZSB0aGUgZWxib3cgdXAgYW5kIHRvIHRoZSBjZW50ZXIgYXMgdGhlIHVzZXIgcG9pbnRzIHRoZVxuICAgIC8vIGNvbnRyb2xsZXIgdXB3YXJkcywgc28gdGhhdCB0aGV5IGNhbiBlYXNpbHkgc2VlIHRoZSBjb250cm9sbGVyIGFuZCBpdHNcbiAgICAvLyB0b29sIHRpcHMuXG4gICAgbGV0IGNvbnRyb2xsZXJFdWxlciA9IG5ldyBUSFJFRS5FdWxlcigpLnNldEZyb21RdWF0ZXJuaW9uKHRoaXMuY29udHJvbGxlclEsICdZWFonKTtcbiAgICBsZXQgY29udHJvbGxlclhEZWcgPSBUSFJFRS5NYXRoLnJhZFRvRGVnKGNvbnRyb2xsZXJFdWxlci54KTtcbiAgICBsZXQgZXh0ZW5zaW9uUmF0aW8gPSB0aGlzLmNsYW1wXygoY29udHJvbGxlclhEZWcgLSAxMSkgLyAoNTAgLSAxMSksIDAsIDEpO1xuXG4gICAgLy8gQ29udHJvbGxlciBvcmllbnRhdGlvbiBpbiBjYW1lcmEgc3BhY2UuXG4gICAgbGV0IGNvbnRyb2xsZXJDYW1lcmFRID0gdGhpcy5yb290US5jbG9uZSgpLmludmVyc2UoKTtcbiAgICBjb250cm9sbGVyQ2FtZXJhUS5tdWx0aXBseSh0aGlzLmNvbnRyb2xsZXJRKTtcblxuICAgIC8vIENhbGN1bGF0ZSBlbGJvdyBwb3NpdGlvbi5cbiAgICBsZXQgZWxib3dQb3MgPSB0aGlzLmVsYm93UG9zO1xuICAgIGVsYm93UG9zLmNvcHkodGhpcy5oZWFkUG9zKS5hZGQoSEVBRF9FTEJPV19PRkZTRVQpO1xuICAgIGxldCBlbGJvd09mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShBUk1fRVhURU5TSU9OX09GRlNFVCk7XG4gICAgZWxib3dPZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xuICAgIGVsYm93UG9zLmFkZChlbGJvd09mZnNldCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgam9pbnQgYW5nbGVzLiBHZW5lcmFsbHkgNDAlIG9mIHJvdGF0aW9uIGFwcGxpZWQgdG8gZWxib3csIDYwJVxuICAgIC8vIHRvIHdyaXN0LCBidXQgaWYgY29udHJvbGxlciBpcyByYWlzZWQgaGlnaGVyLCBtb3JlIHJvdGF0aW9uIGNvbWVzIGZyb21cbiAgICAvLyB0aGUgd3Jpc3QuXG4gICAgbGV0IHRvdGFsQW5nbGUgPSB0aGlzLnF1YXRBbmdsZV8oY29udHJvbGxlckNhbWVyYVEsIG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkpO1xuICAgIGxldCB0b3RhbEFuZ2xlRGVnID0gVEhSRUUuTWF0aC5yYWRUb0RlZyh0b3RhbEFuZ2xlKTtcbiAgICBsZXQgbGVycFN1cHByZXNzaW9uID0gMSAtIE1hdGgucG93KHRvdGFsQW5nbGVEZWcgLyAxODAsIDQpOyAvLyBUT0RPKHNtdXMpOiA/Pz9cblxuICAgIGxldCBlbGJvd1JhdGlvID0gRUxCT1dfQkVORF9SQVRJTztcbiAgICBsZXQgd3Jpc3RSYXRpbyA9IDEgLSBFTEJPV19CRU5EX1JBVElPO1xuICAgIGxldCBsZXJwVmFsdWUgPSBsZXJwU3VwcHJlc3Npb24gKlxuICAgICAgICAoZWxib3dSYXRpbyArIHdyaXN0UmF0aW8gKiBleHRlbnNpb25SYXRpbyAqIEVYVEVOU0lPTl9SQVRJT19XRUlHSFQpO1xuXG4gICAgbGV0IHdyaXN0USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2xlcnAoY29udHJvbGxlckNhbWVyYVEsIGxlcnBWYWx1ZSk7XG4gICAgbGV0IGludldyaXN0USA9IHdyaXN0US5pbnZlcnNlKCk7XG4gICAgbGV0IGVsYm93USA9IGNvbnRyb2xsZXJDYW1lcmFRLmNsb25lKCkubXVsdGlwbHkoaW52V3Jpc3RRKTtcblxuICAgIC8vIENhbGN1bGF0ZSBvdXIgZmluYWwgY29udHJvbGxlciBwb3NpdGlvbiBiYXNlZCBvbiBhbGwgb3VyIGpvaW50IHJvdGF0aW9uc1xuICAgIC8vIGFuZCBsZW5ndGhzLlxuICAgIC8qXG4gICAgcG9zaXRpb25fID1cbiAgICAgIHJvb3Rfcm90XyAqIChcbiAgICAgICAgY29udHJvbGxlcl9yb290X29mZnNldF8gK1xuMjogICAgICAoYXJtX2V4dGVuc2lvbl8gKiBhbXRfZXh0ZW5zaW9uKSArXG4xOiAgICAgIGVsYm93X3JvdCAqIChrQ29udHJvbGxlckZvcmVhcm0gKyAod3Jpc3Rfcm90ICoga0NvbnRyb2xsZXJQb3NpdGlvbikpXG4gICAgICApO1xuICAgICovXG4gICAgbGV0IHdyaXN0UG9zID0gdGhpcy53cmlzdFBvcztcbiAgICB3cmlzdFBvcy5jb3B5KFdSSVNUX0NPTlRST0xMRVJfT0ZGU0VUKTtcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24od3Jpc3RRKTtcbiAgICB3cmlzdFBvcy5hZGQoRUxCT1dfV1JJU1RfT0ZGU0VUKTtcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24oZWxib3dRKTtcbiAgICB3cmlzdFBvcy5hZGQodGhpcy5lbGJvd1Bvcyk7XG5cbiAgICBsZXQgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KEFSTV9FWFRFTlNJT05fT0ZGU0VUKTtcbiAgICBvZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xuXG4gICAgbGV0IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHRoaXMud3Jpc3RQb3MpO1xuICAgIHBvc2l0aW9uLmFkZChvZmZzZXQpO1xuICAgIHBvc2l0aW9uLmFwcGx5UXVhdGVybmlvbih0aGlzLnJvb3RRKTtcblxuICAgIGxldCBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuY29weSh0aGlzLmNvbnRyb2xsZXJRKTtcblxuICAgIC8vIFNldCB0aGUgcmVzdWx0aW5nIHBvc2Ugb3JpZW50YXRpb24gYW5kIHBvc2l0aW9uLlxuICAgIHRoaXMucG9zZS5vcmllbnRhdGlvbi5jb3B5KG9yaWVudGF0aW9uKTtcbiAgICB0aGlzLnBvc2UucG9zaXRpb24uY29weShwb3NpdGlvbik7XG5cbiAgICB0aGlzLmxhc3RUaW1lID0gdGhpcy50aW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBvc2UgY2FsY3VsYXRlZCBieSB0aGUgbW9kZWwuXG4gICAqL1xuICBnZXRQb3NlKCkge1xuICAgIHJldHVybiB0aGlzLnBvc2U7XG4gIH1cblxuICAvKipcbiAgICogRGVidWcgbWV0aG9kcyBmb3IgcmVuZGVyaW5nIHRoZSBhcm0gbW9kZWwuXG4gICAqL1xuICBnZXRGb3JlYXJtTGVuZ3RoKCkge1xuICAgIHJldHVybiBFTEJPV19XUklTVF9PRkZTRVQubGVuZ3RoKCk7XG4gIH1cblxuICBnZXRFbGJvd1Bvc2l0aW9uKCkge1xuICAgIGxldCBvdXQgPSB0aGlzLmVsYm93UG9zLmNsb25lKCk7XG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG4gIH1cblxuICBnZXRXcmlzdFBvc2l0aW9uKCkge1xuICAgIGxldCBvdXQgPSB0aGlzLndyaXN0UG9zLmNsb25lKCk7XG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG4gIH1cblxuICBnZXRIZWFkWWF3T3JpZW50YXRpb25fKCkge1xuICAgIGxldCBoZWFkRXVsZXIgPSBuZXcgVEhSRUUuRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbih0aGlzLmhlYWRRLCAnWVhaJyk7XG4gICAgaGVhZEV1bGVyLnggPSAwO1xuICAgIGhlYWRFdWxlci56ID0gMDtcbiAgICBsZXQgZGVzdGluYXRpb25RID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoaGVhZEV1bGVyKTtcbiAgICByZXR1cm4gZGVzdGluYXRpb25RO1xuICB9XG5cbiAgY2xhbXBfKHZhbHVlLCBtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCh2YWx1ZSwgbWluKSwgbWF4KTtcbiAgfVxuXG4gIHF1YXRBbmdsZV8ocTEsIHEyKSB7XG4gICAgbGV0IHZlYzEgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbGV0IHZlYzIgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgdmVjMS5hcHBseVF1YXRlcm5pb24ocTEpO1xuICAgIHZlYzIuYXBwbHlRdWF0ZXJuaW9uKHEyKTtcbiAgICByZXR1cm4gdmVjMS5hbmdsZVRvKHZlYzIpO1xuICB9XG59XG4iLCJpbXBvcnQgRGVtb1JlbmRlcmVyIGZyb20gJy4vcmVuZGVyZXIuanMnO1xuXG5sZXQgcmVuZGVyZXI7XG5sZXQgdnJEaXNwbGF5O1xuXG5mdW5jdGlvbiBvbkxvYWQoKSB7XG4gIHJlbmRlcmVyID0gbmV3IERlbW9SZW5kZXJlcigpO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7IHJlbmRlcmVyLnJlc2l6ZSgpIH0pO1xuXG4gIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKCkudGhlbihmdW5jdGlvbihkaXNwbGF5cykge1xuICAgIGlmIChkaXNwbGF5cy5sZW5ndGggPiAwKSB7XG4gICAgICB2ckRpc3BsYXkgPSBkaXNwbGF5c1swXTtcblxuICAgICAgcmVuZGVyZXIuY3JlYXRlUmFnZG9sbCgpO1xuXG4gICAgICB2ckRpc3BsYXkucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKCkge1xuICByZW5kZXJlci5yZW5kZXIoKTtcblxuICB2ckRpc3BsYXkucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG59XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgb25Mb2FkKTtcbiIsImltcG9ydCBXZWJWUk1hbmFnZXIgZnJvbSAnd2VidnItYm9pbGVycGxhdGUnXG5pbXBvcnQgUmF5SW5wdXQgZnJvbSAnLi4vcmF5LWlucHV0J1xuXG5jb25zdCBERUZBVUxUX0NPTE9SID0gbmV3IFRIUkVFLkNvbG9yKDB4MDBGRjAwKTtcbmNvbnN0IEhJR0hMSUdIVF9DT0xPUiA9IG5ldyBUSFJFRS5Db2xvcigweDFFOTBGRik7XG5jb25zdCBBQ1RJVkVfQ09MT1IgPSBuZXcgVEhSRUUuQ29sb3IoMHhGRjMzMzMpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZW1vUmVuZGVyZXIge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGxldCB3b3JsZDtcbiAgICBjb25zdCBkdCA9IDEgLyA2MDtcbiAgICBsZXQgY29uc3RyYWludERvd24gPSBmYWxzZTtcbiAgICBsZXQgam9pbnRCb2R5LCBjb25zdHJhaW5lZEJvZHksIHBvaW50ZXJDb25zdHJhaW50O1xuICAgIGxldCBjbGlja01hcmtlciA9IGZhbHNlO1xuICAgIGxldCBnZW9tZXRyeSwgbWF0ZXJpYWwsIG1lc2g7XG4gICAgLy8gVG8gYmUgc3luY2VkXG4gICAgbGV0IG1lc2hlcyA9IFtdLCBib2RpZXMgPSBbXTtcblxuICAgIGxldCBheGVzID0gW107XG4gICAgYXhlc1sgMCBdID0ge1xuICAgICAgdmFsdWU6IFsgMCwgMCBdXG4gICAgfTtcblxuICAgIC8vIFNldHVwIG91ciB3b3JsZFxuICAgIHdvcmxkID0gbmV3IENBTk5PTi5Xb3JsZCgpO1xuICAgIHdvcmxkLnF1YXROb3JtYWxpemVTa2lwID0gMDtcbiAgICB3b3JsZC5xdWF0Tm9ybWFsaXplRmFzdCA9IGZhbHNlO1xuXG4gICAgd29ybGQuZ3Jhdml0eS5zZXQoMCwtNCwwKTtcbiAgICB3b3JsZC5icm9hZHBoYXNlID0gbmV3IENBTk5PTi5OYWl2ZUJyb2FkcGhhc2UoKTtcblxuICAgIC8vIENyZWF0ZSBhIHBsYW5lXG4gICAgbGV0IGdyb3VuZFNoYXBlID0gbmV3IENBTk5PTi5QbGFuZSgpO1xuICAgIGxldCBncm91bmRCb2R5ID0gbmV3IENBTk5PTi5Cb2R5KHsgbWFzczogMCB9KTtcbiAgICBncm91bmRCb2R5LmFkZFNoYXBlKGdyb3VuZFNoYXBlKTtcbiAgICBncm91bmRCb2R5LnF1YXRlcm5pb24uc2V0RnJvbUF4aXNBbmdsZShuZXcgQ0FOTk9OLlZlYzMoMSwwLDApLC1NYXRoLlBJLzIpO1xuICAgIHdvcmxkLmFkZEJvZHkoZ3JvdW5kQm9keSk7XG5cbiAgICAvLyBKb2ludCBib2R5XG4gICAgbGV0IHNoYXBlID0gbmV3IENBTk5PTi5TcGhlcmUoMC4xKTtcbiAgICBqb2ludEJvZHkgPSBuZXcgQ0FOTk9OLkJvZHkoeyBtYXNzOiAwIH0pO1xuICAgIGpvaW50Qm9keS5hZGRTaGFwZShzaGFwZSk7XG4gICAgam9pbnRCb2R5LmNvbGxpc2lvbkZpbHRlckdyb3VwID0gMDtcbiAgICBqb2ludEJvZHkuY29sbGlzaW9uRmlsdGVyTWFzayA9IDA7XG4gICAgd29ybGQuYWRkQm9keShqb2ludEJvZHkpO1xuXG4gICAgbGV0IHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgc2NlbmUuZm9nID0gbmV3IFRIUkVFLkZvZyggMHgwMDAwMDAsIDUwMCwgMTAwMDAgKTtcblxuICAgIGxldCBhc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICBsZXQgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDc1LCBhc3BlY3QsIDAuMSwgMTAwKTtcbiAgICBzY2VuZS5hZGQoY2FtZXJhKTtcblxuICAgIGxldCByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgYW50aWFsaWFzOiB0cnVlIH0pO1xuICAgIGNvbnNvbGUubG9nKCdzaXppbmcnKTtcbiAgICBjb25zb2xlLmxvZygnd2luZG93LmRldmljZVBpeGVsUmF0aW86ICcgKyB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgY29uc29sZS5sb2coJ3dpbmRvdy5pbm5lcldpZHRoOiAnICsgd2luZG93LmlubmVyV2lkdGgpO1xuICAgIGNvbnNvbGUubG9nKCd3aW5kb3cuaW5uZXJIZWlnaHQ6ICcgKyB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICAgIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoIHNjZW5lLmZvZy5jb2xvciApO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgcmVuZGVyZXIuZ2FtbWFJbnB1dCA9IHRydWU7XG4gICAgcmVuZGVyZXIuZ2FtbWFPdXRwdXQgPSB0cnVlO1xuICAgIHJlbmRlcmVyLnNoYWRvd01hcEVuYWJsZWQgPSB0cnVlO1xuXG4gICAgbGV0IGVmZmVjdCA9IG5ldyBUSFJFRS5WUkVmZmVjdChyZW5kZXJlcik7XG4gICAgbGV0IGNvbnRyb2xzID0gbmV3IFRIUkVFLlZSQ29udHJvbHMoY2FtZXJhKTtcbiAgICBjb250cm9scy5zdGFuZGluZyA9IHRydWU7XG5cbiAgICBsZXQgbWFuYWdlciA9IG5ldyBXZWJWUk1hbmFnZXIocmVuZGVyZXIsIGVmZmVjdCk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgIC8vIElucHV0IG1hbmFnZXIuXG4gICAgbGV0IHJheUlucHV0ID0gbmV3IFJheUlucHV0KGNhbWVyYSk7XG4gICAgcmF5SW5wdXQuc2V0U2l6ZShyZW5kZXJlci5nZXRTaXplKCkpO1xuICAgIHJheUlucHV0Lm9uKCdyYXlkb3duJywgKG9wdF9tZXNoKSA9PiB7IHRoaXMuaGFuZGxlUmF5RG93bl8ob3B0X21lc2gpIH0pO1xuICAgIHJheUlucHV0Lm9uKCdyYXlkcmFnJywgKCkgPT4geyB0aGlzLmhhbmRsZVJheURyYWdfKCkgfSk7XG4gICAgcmF5SW5wdXQub24oJ3JheXVwJywgKG9wdF9tZXNoKSA9PiB7IHRoaXMuaGFuZGxlUmF5VXBfKG9wdF9tZXNoKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5Y2FuY2VsJywgKG9wdF9tZXNoKSA9PiB7IHRoaXMuaGFuZGxlUmF5Q2FuY2VsXyhvcHRfbWVzaCkgfSk7XG4gICAgcmF5SW5wdXQub24oJ3JheW92ZXInLCAobWVzaCkgPT4geyBEZW1vUmVuZGVyZXIuc2V0U2VsZWN0ZWRfKG1lc2gsIHRydWUpIH0pO1xuICAgIHJheUlucHV0Lm9uKCdyYXlvdXQnLCAobWVzaCkgPT4geyBEZW1vUmVuZGVyZXIuc2V0U2VsZWN0ZWRfKG1lc2gsIGZhbHNlKSB9KTtcblxuICAgIC8vIEFkZCB0aGUgcmF5IGlucHV0IG1lc2ggdG8gdGhlIHNjZW5lLlxuICAgIHNjZW5lLmFkZChyYXlJbnB1dC5nZXRNZXNoKCkpO1xuXG4gICAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICB0aGlzLnNjZW5lID0gc2NlbmU7XG4gICAgdGhpcy5jb250cm9scyA9IGNvbnRyb2xzO1xuICAgIHRoaXMucmF5SW5wdXQgPSByYXlJbnB1dDtcbiAgICB0aGlzLmVmZmVjdCA9IGVmZmVjdDtcbiAgICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gICAgdGhpcy53b3JsZCA9IHdvcmxkO1xuICAgIHRoaXMuZHQgPSBkdDtcbiAgICB0aGlzLm1lc2hlcyA9IG1lc2hlcztcbiAgICB0aGlzLmJvZGllcyA9IGJvZGllcztcbiAgICB0aGlzLmNsaWNrTWFya2VyID0gY2xpY2tNYXJrZXI7XG4gICAgdGhpcy5jb25zdHJhaW50RG93biA9IGNvbnN0cmFpbnREb3duO1xuICAgIHRoaXMuY29uc3RyYWluZWRCb2R5ID0gY29uc3RyYWluZWRCb2R5O1xuICAgIHRoaXMucG9pbnRlckNvbnN0cmFpbnQgPSBwb2ludGVyQ29uc3RyYWludDtcbiAgICB0aGlzLmpvaW50Qm9keSA9IGpvaW50Qm9keTtcbiAgICB0aGlzLmF4ZXMgPSBheGVzO1xuICAgIHRoaXMudG91Y2hQYWRQb3NpdGlvbiA9IHsgeDogMCwgejogMCB9O1xuXG4gICAgLy8gR2xvYmFsIHNldHRpbmdzXG4gICAgdGhpcy5zZXR0aW5ncyA9IHtcbiAgICAgIHN0ZXBGcmVxdWVuY3k6IDYwLFxuICAgICAgcXVhdE5vcm1hbGl6ZVNraXA6IDIsXG4gICAgICBxdWF0Tm9ybWFsaXplRmFzdDogdHJ1ZSxcbiAgICAgIGd4OiAwLFxuICAgICAgZ3k6IDAsXG4gICAgICBnejogMCxcbiAgICAgIGl0ZXJhdGlvbnM6IDMsXG4gICAgICB0b2xlcmFuY2U6IDAuMDAwMSxcbiAgICAgIGs6IDFlNixcbiAgICAgIGQ6IDMsXG4gICAgICBzY2VuZTogMCxcbiAgICAgIHBhdXNlZDogZmFsc2UsXG4gICAgICByZW5kZXJtb2RlOiBcInNvbGlkXCIsXG4gICAgICBjb25zdHJhaW50czogZmFsc2UsXG4gICAgICBjb250YWN0czogZmFsc2UsICAvLyBDb250YWN0IHBvaW50c1xuICAgICAgY20yY29udGFjdDogZmFsc2UsIC8vIGNlbnRlciBvZiBtYXNzIHRvIGNvbnRhY3QgcG9pbnRzXG4gICAgICBub3JtYWxzOiBmYWxzZSwgLy8gY29udGFjdCBub3JtYWxzXG4gICAgICBheGVzOiBmYWxzZSwgLy8gXCJsb2NhbFwiIGZyYW1lIGF4ZXNcbiAgICAgIHBhcnRpY2xlU2l6ZTogMC4xLFxuICAgICAgc2hhZG93czogZmFsc2UsXG4gICAgICBhYWJiczogZmFsc2UsXG4gICAgICBwcm9maWxpbmc6IGZhbHNlLFxuICAgICAgbWF4U3ViU3RlcHM6IDIwXG4gICAgfTtcblxuICAgIC8vIGxpZ2h0c1xuICAgIGxldCBsaWdodDtcbiAgICBzY2VuZS5hZGQoIG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoIDB4NjY2NjY2ICkgKTtcblxuICAgIGxpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoIDB4ZmZmZmZmLCAxLjc1ICk7XG4gICAgY29uc3QgZCA9IDIwO1xuXG4gICAgbGlnaHQucG9zaXRpb24uc2V0KCBkLCBkLCBkICk7XG5cbiAgICBsaWdodC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICBsaWdodC5zaGFkb3cubWFwU2l6ZS53aWR0aD0gMTAyNDtcbiAgICBsaWdodC5zaGFkb3cubWFwU2l6ZS53aWR0aCA9IDEwMjQ7XG4gICAgbGlnaHQuc2hhZG93LmNhbWVyYS5sZWZ0ID0gLWQ7XG4gICAgbGlnaHQuc2hhZG93LmNhbWVyYXJpZ2h0ID0gZDtcbiAgICBsaWdodC5zaGFkb3cuY2FtZXJhLnRvcCA9IGQ7XG4gICAgbGlnaHQuc2hhZG93LmNhbWVyYS5ib3R0b20gPSAtZDtcbiAgICBsaWdodC5zaGFkb3cuY2FtZXJhLmZhciA9IDMqZDtcbiAgICBsaWdodC5zaGFkb3cuY2FtZXJhLm5lYXIgPSBkO1xuXG4gICAgc2NlbmUuYWRkKCBsaWdodCApO1xuXG4gICAgLy8gZmxvb3JcbiAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5QbGFuZUdlb21ldHJ5KCAxMDAsIDEwMCwgMSwgMSApO1xuICAgIC8vZ2VvbWV0cnkuYXBwbHlNYXRyaXgoIG5ldyBUSFJFRS5NYXRyaXg0KCkubWFrZVJvdGF0aW9uWCggLU1hdGguUEkgLyAyICkgKTtcbiAgICBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKCB7IGNvbG9yOiAweDc3Nzc3NyB9ICk7XG4gICAgdGhpcy5tYXJrZXJNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHsgY29sb3I6IDB4ZmYwMDAwIH0pO1xuICAgIC8vVEhSRUUuQ29sb3JVdGlscy5hZGp1c3RIU1YoIG1hdGVyaWFsLmNvbG9yLCAwLCAwLCAwLjkgKTtcbiAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIGdlb21ldHJ5LCBtYXRlcmlhbCApO1xuICAgIG1lc2guY2FzdFNoYWRvdyA9IHRydWU7XG4gICAgbWVzaC5xdWF0ZXJuaW9uLnNldEZyb21BeGlzQW5nbGUobmV3IFRIUkVFLlZlY3RvcjMoMSwwLDApLCAtTWF0aC5QSSAvIDIpO1xuICAgIG1lc2gucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gICAgc2NlbmUuYWRkKG1lc2gpO1xuICB9XG5cbiAgYWRkVmlzdWFsKGJvZHkpIHtcbiAgICAvLyB2YXIgcyA9IHRoaXMuc2V0dGluZ3M7XG4gICAgLy8gV2hhdCBnZW9tZXRyeSBzaG91bGQgYmUgdXNlZD9cbiAgICBsZXQgbWVzaDtcbiAgICBpZihib2R5IGluc3RhbmNlb2YgQ0FOTk9OLkJvZHkpe1xuICAgICAgbWVzaCA9IHRoaXMuc2hhcGUybWVzaChib2R5KTtcbiAgICB9XG4gICAgaWYobWVzaCkge1xuICAgICAgLy8gQWRkIGJvZHlcbiAgICAgIHRoaXMuYm9kaWVzLnB1c2goYm9keSk7XG4gICAgICAvLyB0aGlzLnZpc3VhbHMucHVzaChtZXNoKTtcbiAgICAgIC8vIGJvZHkudmlzdWFscmVmID0gbWVzaDtcbiAgICAgIC8vIGJvZHkudmlzdWFscmVmLnZpc3VhbElkID0gdGhpcy5ib2RpZXMubGVuZ3RoIC0gMTtcbiAgICAgIC8vbWVzaC51c2VRdWF0ZXJuaW9uID0gdHJ1ZTtcbiAgICAgIHRoaXMubWVzaGVzLnB1c2gobWVzaCk7XG4gICAgICB0aGlzLnNjZW5lLmFkZChtZXNoKTtcbiAgICAgIHRoaXMucmF5SW5wdXQuYWRkKG1lc2gpO1xuICAgIH1cbiAgfTtcblxuICBjcmVhdGVSYWdkb2xsKCl7XG4gICAgY29uc3Qgc2NhbGUgPSAzO1xuICAgIGxldCBwb3NpdGlvbiA9IG5ldyBDQU5OT04uVmVjMygwLDEwLC01KTtcbiAgICBjb25zdCBhbmdsZUEgPSBNYXRoLlBJLCBhbmdsZUIgPSBNYXRoLlBJLCB0d2lzdEFuZ2xlID0gTWF0aC5QSTtcblxuICAgIGxldCBudW1Cb2RpZXNBdFN0YXJ0ID0gdGhpcy53b3JsZC5ib2RpZXMubGVuZ3RoO1xuXG4gICAgY29uc3Qgc2hvdWxkZXJzRGlzdGFuY2UgPSAwLjUgKiBzY2FsZSxcbiAgICAgIHVwcGVyQXJtTGVuZ3RoID0gMC40ICogc2NhbGUsXG4gICAgICBsb3dlckFybUxlbmd0aCA9IDAuNCAqIHNjYWxlLFxuICAgICAgdXBwZXJBcm1TaXplID0gMC4yICogc2NhbGUsXG4gICAgICBsb3dlckFybVNpemUgPSAwLjIgKiBzY2FsZSxcbiAgICAgIG5lY2tMZW5ndGggPSAwLjEgKiBzY2FsZSxcbiAgICAgIGhlYWRSYWRpdXMgPSAwLjI1ICogc2NhbGUsXG4gICAgICB1cHBlckJvZHlMZW5ndGggPSAwLjYgKiBzY2FsZSxcbiAgICAgIHBlbHZpc0xlbmd0aCA9IDAuNCAqIHNjYWxlLFxuICAgICAgdXBwZXJMZWdMZW5ndGggPSAwLjUgKiBzY2FsZSxcbiAgICAgIHVwcGVyTGVnU2l6ZSA9IDAuMiAqIHNjYWxlLFxuICAgICAgbG93ZXJMZWdTaXplID0gMC4yICogc2NhbGUsXG4gICAgICBsb3dlckxlZ0xlbmd0aCA9IDAuNSAqIHNjYWxlO1xuXG4gICAgbGV0IGhlYWRTaGFwZSA9ICAgICAgbmV3IENBTk5PTi5TcGhlcmUoaGVhZFJhZGl1cyksXG4gICAgICB1cHBlckFybVNoYXBlID0gIG5ldyBDQU5OT04uQm94KG5ldyBDQU5OT04uVmVjMyh1cHBlckFybUxlbmd0aCAqIDAuNSwgdXBwZXJBcm1TaXplICogMC41LCB1cHBlckFybVNpemUgKiAwLjUpKSxcbiAgICAgIGxvd2VyQXJtU2hhcGUgPSAgbmV3IENBTk5PTi5Cb3gobmV3IENBTk5PTi5WZWMzKGxvd2VyQXJtTGVuZ3RoICogMC41LCBsb3dlckFybVNpemUgKiAwLjUsIGxvd2VyQXJtU2l6ZSAqIDAuNSkpLFxuICAgICAgdXBwZXJCb2R5U2hhcGUgPSBuZXcgQ0FOTk9OLkJveChuZXcgQ0FOTk9OLlZlYzMoc2hvdWxkZXJzRGlzdGFuY2UgKiAwLjUsIHVwcGVyQm9keUxlbmd0aCAqIDAuNSwgbG93ZXJBcm1TaXplICogMC41KSksXG4gICAgICBwZWx2aXNTaGFwZSA9ICAgIG5ldyBDQU5OT04uQm94KG5ldyBDQU5OT04uVmVjMyhzaG91bGRlcnNEaXN0YW5jZSAqIDAuNSwgcGVsdmlzTGVuZ3RoICogMC41LCBsb3dlckFybVNpemUgKiAwLjUpKSxcbiAgICAgIHVwcGVyTGVnU2hhcGUgPSAgbmV3IENBTk5PTi5Cb3gobmV3IENBTk5PTi5WZWMzKHVwcGVyTGVnU2l6ZSAqIDAuNSwgdXBwZXJMZWdMZW5ndGggKiAwLjUsIGxvd2VyQXJtU2l6ZSAqIDAuNSkpLFxuICAgICAgbG93ZXJMZWdTaGFwZSA9ICBuZXcgQ0FOTk9OLkJveChuZXcgQ0FOTk9OLlZlYzMobG93ZXJMZWdTaXplICogMC41LCBsb3dlckxlZ0xlbmd0aCAqIDAuNSwgbG93ZXJBcm1TaXplICogMC41KSk7XG5cbiAgICAvLyBMb3dlciBsZWdzXG4gICAgbGV0IGxvd2VyTGVmdExlZyA9IG5ldyBDQU5OT04uQm9keSh7XG4gICAgICBtYXNzOiAxLFxuICAgICAgcG9zaXRpb246IG5ldyBDQU5OT04uVmVjMygtc2hvdWxkZXJzRGlzdGFuY2UvMixsb3dlckxlZ0xlbmd0aCAvIDIsIDApXG4gICAgfSk7XG4gICAgbGV0IGxvd2VyUmlnaHRMZWcgPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoc2hvdWxkZXJzRGlzdGFuY2UvMixsb3dlckxlZ0xlbmd0aCAvIDIsIDApXG4gICAgfSk7XG4gICAgbG93ZXJMZWZ0TGVnLmFkZFNoYXBlKGxvd2VyTGVnU2hhcGUpO1xuICAgIGxvd2VyUmlnaHRMZWcuYWRkU2hhcGUobG93ZXJMZWdTaGFwZSk7XG4gICAgdGhpcy53b3JsZC5hZGRCb2R5KGxvd2VyTGVmdExlZyk7XG4gICAgdGhpcy53b3JsZC5hZGRCb2R5KGxvd2VyUmlnaHRMZWcpO1xuICAgIHRoaXMuYWRkVmlzdWFsKGxvd2VyTGVmdExlZyk7XG4gICAgdGhpcy5hZGRWaXN1YWwobG93ZXJSaWdodExlZyk7XG5cbiAgICAvLyBVcHBlciBsZWdzXG4gICAgbGV0IHVwcGVyTGVmdExlZyA9IG5ldyBDQU5OT04uQm9keSh7XG4gICAgICBtYXNzOiAxLFxuICAgICAgcG9zaXRpb246IG5ldyBDQU5OT04uVmVjMygtc2hvdWxkZXJzRGlzdGFuY2UvMixsb3dlckxlZnRMZWcucG9zaXRpb24ueStsb3dlckxlZ0xlbmd0aC8yK3VwcGVyTGVnTGVuZ3RoIC8gMiwgMCksXG4gICAgfSk7XG4gICAgbGV0IHVwcGVyUmlnaHRMZWcgPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoc2hvdWxkZXJzRGlzdGFuY2UvMixsb3dlclJpZ2h0TGVnLnBvc2l0aW9uLnkrbG93ZXJMZWdMZW5ndGgvMit1cHBlckxlZ0xlbmd0aCAvIDIsIDApLFxuICAgIH0pO1xuICAgIHVwcGVyTGVmdExlZy5hZGRTaGFwZSh1cHBlckxlZ1NoYXBlKTtcbiAgICB1cHBlclJpZ2h0TGVnLmFkZFNoYXBlKHVwcGVyTGVnU2hhcGUpO1xuICAgIHRoaXMud29ybGQuYWRkQm9keSh1cHBlckxlZnRMZWcpO1xuICAgIHRoaXMud29ybGQuYWRkQm9keSh1cHBlclJpZ2h0TGVnKTtcbiAgICB0aGlzLmFkZFZpc3VhbCh1cHBlckxlZnRMZWcpO1xuICAgIHRoaXMuYWRkVmlzdWFsKHVwcGVyUmlnaHRMZWcpO1xuXG4gICAgLy8gUGVsdmlzXG4gICAgbGV0IHBlbHZpcyA9IG5ldyBDQU5OT04uQm9keSh7XG4gICAgICBtYXNzOiAxLFxuICAgICAgcG9zaXRpb246IG5ldyBDQU5OT04uVmVjMygwLCB1cHBlckxlZnRMZWcucG9zaXRpb24ueSt1cHBlckxlZ0xlbmd0aC8yK3BlbHZpc0xlbmd0aC8yLCAwKSxcbiAgICB9KTtcbiAgICBwZWx2aXMuYWRkU2hhcGUocGVsdmlzU2hhcGUpO1xuICAgIHRoaXMud29ybGQuYWRkQm9keShwZWx2aXMpO1xuICAgIHRoaXMuYWRkVmlzdWFsKHBlbHZpcyk7XG5cbiAgICAvLyBVcHBlciBib2R5XG4gICAgbGV0IHVwcGVyQm9keSA9IG5ldyBDQU5OT04uQm9keSh7XG4gICAgICBtYXNzOiAxLFxuICAgICAgcG9zaXRpb246IG5ldyBDQU5OT04uVmVjMygwLHBlbHZpcy5wb3NpdGlvbi55K3BlbHZpc0xlbmd0aC8yK3VwcGVyQm9keUxlbmd0aC8yLCAwKSxcbiAgICB9KTtcbiAgICB1cHBlckJvZHkuYWRkU2hhcGUodXBwZXJCb2R5U2hhcGUpO1xuICAgIHRoaXMud29ybGQuYWRkQm9keSh1cHBlckJvZHkpO1xuICAgIHRoaXMuYWRkVmlzdWFsKHVwcGVyQm9keSk7XG5cbiAgICAvLyBIZWFkXG4gICAgbGV0IGhlYWQgPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoMCx1cHBlckJvZHkucG9zaXRpb24ueSt1cHBlckJvZHlMZW5ndGgvMitoZWFkUmFkaXVzK25lY2tMZW5ndGgsIDApLFxuICAgIH0pO1xuICAgIGhlYWQuYWRkU2hhcGUoaGVhZFNoYXBlKTtcbiAgICB0aGlzLndvcmxkLmFkZEJvZHkoaGVhZCk7XG4gICAgdGhpcy5hZGRWaXN1YWwoaGVhZCk7XG5cbiAgICAvLyBVcHBlciBhcm1zXG4gICAgbGV0IHVwcGVyTGVmdEFybSA9IG5ldyBDQU5OT04uQm9keSh7XG4gICAgICBtYXNzOiAxLFxuICAgICAgcG9zaXRpb246IG5ldyBDQU5OT04uVmVjMygtc2hvdWxkZXJzRGlzdGFuY2UvMi11cHBlckFybUxlbmd0aC8yLCB1cHBlckJvZHkucG9zaXRpb24ueSt1cHBlckJvZHlMZW5ndGgvMiwgMCksXG4gICAgfSk7XG4gICAgbGV0IHVwcGVyUmlnaHRBcm0gPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoc2hvdWxkZXJzRGlzdGFuY2UvMit1cHBlckFybUxlbmd0aC8yLCB1cHBlckJvZHkucG9zaXRpb24ueSt1cHBlckJvZHlMZW5ndGgvMiwgMCksXG4gICAgfSk7XG4gICAgdXBwZXJMZWZ0QXJtLmFkZFNoYXBlKHVwcGVyQXJtU2hhcGUpO1xuICAgIHVwcGVyUmlnaHRBcm0uYWRkU2hhcGUodXBwZXJBcm1TaGFwZSk7XG4gICAgdGhpcy53b3JsZC5hZGRCb2R5KHVwcGVyTGVmdEFybSk7XG4gICAgdGhpcy53b3JsZC5hZGRCb2R5KHVwcGVyUmlnaHRBcm0pO1xuICAgIHRoaXMuYWRkVmlzdWFsKHVwcGVyTGVmdEFybSk7XG4gICAgdGhpcy5hZGRWaXN1YWwodXBwZXJSaWdodEFybSk7XG5cbiAgICAvLyBsb3dlciBhcm1zXG4gICAgbGV0IGxvd2VyTGVmdEFybSA9IG5ldyBDQU5OT04uQm9keSh7XG4gICAgICBtYXNzOiAxLFxuICAgICAgcG9zaXRpb246IG5ldyBDQU5OT04uVmVjMyggdXBwZXJMZWZ0QXJtLnBvc2l0aW9uLnggLSBsb3dlckFybUxlbmd0aC8yIC0gdXBwZXJBcm1MZW5ndGgvMiwgdXBwZXJMZWZ0QXJtLnBvc2l0aW9uLnksIDApXG4gICAgfSk7XG4gICAgbGV0IGxvd2VyUmlnaHRBcm0gPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoIHVwcGVyUmlnaHRBcm0ucG9zaXRpb24ueCArIGxvd2VyQXJtTGVuZ3RoLzIgKyB1cHBlckFybUxlbmd0aC8yLCB1cHBlclJpZ2h0QXJtLnBvc2l0aW9uLnksIDApXG4gICAgfSk7XG4gICAgbG93ZXJMZWZ0QXJtLmFkZFNoYXBlKGxvd2VyQXJtU2hhcGUpO1xuICAgIGxvd2VyUmlnaHRBcm0uYWRkU2hhcGUobG93ZXJBcm1TaGFwZSk7XG4gICAgdGhpcy53b3JsZC5hZGRCb2R5KGxvd2VyTGVmdEFybSk7XG4gICAgdGhpcy53b3JsZC5hZGRCb2R5KGxvd2VyUmlnaHRBcm0pO1xuICAgIHRoaXMuYWRkVmlzdWFsKGxvd2VyTGVmdEFybSk7XG4gICAgdGhpcy5hZGRWaXN1YWwobG93ZXJSaWdodEFybSk7XG5cblxuICAgIC8vIE5lY2sgam9pbnRcbiAgICBsZXQgbmVja0pvaW50ID0gbmV3IENBTk5PTi5Db25lVHdpc3RDb25zdHJhaW50KGhlYWQsIHVwcGVyQm9keSwge1xuICAgICAgcGl2b3RBOiBuZXcgQ0FOTk9OLlZlYzMoMCwtaGVhZFJhZGl1cy1uZWNrTGVuZ3RoLzIsMCksXG4gICAgICBwaXZvdEI6IG5ldyBDQU5OT04uVmVjMygwLHVwcGVyQm9keUxlbmd0aC8yLDApLFxuICAgICAgYXhpc0E6IENBTk5PTi5WZWMzLlVOSVRfWSxcbiAgICAgIGF4aXNCOiBDQU5OT04uVmVjMy5VTklUX1ksXG4gICAgICBhbmdsZTogYW5nbGVBLFxuICAgICAgdHdpc3RBbmdsZTogdHdpc3RBbmdsZVxuICAgIH0pO1xuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludChuZWNrSm9pbnQpO1xuXG4gICAgLy8gS25lZSBqb2ludHNcbiAgICBsZXQgbGVmdEtuZWVKb2ludCA9IG5ldyBDQU5OT04uQ29uZVR3aXN0Q29uc3RyYWludChsb3dlckxlZnRMZWcsIHVwcGVyTGVmdExlZywge1xuICAgICAgcGl2b3RBOiBuZXcgQ0FOTk9OLlZlYzMoMCwgbG93ZXJMZWdMZW5ndGgvMiwwKSxcbiAgICAgIHBpdm90QjogbmV3IENBTk5PTi5WZWMzKDAsLXVwcGVyTGVnTGVuZ3RoLzIsMCksXG4gICAgICBheGlzQTogQ0FOTk9OLlZlYzMuVU5JVF9ZLFxuICAgICAgYXhpc0I6IENBTk5PTi5WZWMzLlVOSVRfWSxcbiAgICAgIGFuZ2xlOiBhbmdsZUEsXG4gICAgICB0d2lzdEFuZ2xlOiB0d2lzdEFuZ2xlXG4gICAgfSk7XG4gICAgbGV0IHJpZ2h0S25lZUpvaW50PSBuZXcgQ0FOTk9OLkNvbmVUd2lzdENvbnN0cmFpbnQobG93ZXJSaWdodExlZywgdXBwZXJSaWdodExlZywge1xuICAgICAgcGl2b3RBOiBuZXcgQ0FOTk9OLlZlYzMoMCwgbG93ZXJMZWdMZW5ndGgvMiwwKSxcbiAgICAgIHBpdm90QjogbmV3IENBTk5PTi5WZWMzKDAsLXVwcGVyTGVnTGVuZ3RoLzIsMCksXG4gICAgICBheGlzQTogQ0FOTk9OLlZlYzMuVU5JVF9ZLFxuICAgICAgYXhpc0I6IENBTk5PTi5WZWMzLlVOSVRfWSxcbiAgICAgIGFuZ2xlOiBhbmdsZUEsXG4gICAgICB0d2lzdEFuZ2xlOiB0d2lzdEFuZ2xlXG4gICAgfSk7XG4gICAgdGhpcy53b3JsZC5hZGRDb25zdHJhaW50KGxlZnRLbmVlSm9pbnQpO1xuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludChyaWdodEtuZWVKb2ludCk7XG5cbiAgICAvLyBIaXAgam9pbnRzXG4gICAgbGV0IGxlZnRIaXBKb2ludCA9IG5ldyBDQU5OT04uQ29uZVR3aXN0Q29uc3RyYWludCh1cHBlckxlZnRMZWcsIHBlbHZpcywge1xuICAgICAgcGl2b3RBOiBuZXcgQ0FOTk9OLlZlYzMoMCwgdXBwZXJMZWdMZW5ndGgvMiwwKSxcbiAgICAgIHBpdm90QjogbmV3IENBTk5PTi5WZWMzKC1zaG91bGRlcnNEaXN0YW5jZS8yLC1wZWx2aXNMZW5ndGgvMiwwKSxcbiAgICAgIGF4aXNBOiBDQU5OT04uVmVjMy5VTklUX1ksXG4gICAgICBheGlzQjogQ0FOTk9OLlZlYzMuVU5JVF9ZLFxuICAgICAgYW5nbGU6IGFuZ2xlQSxcbiAgICAgIHR3aXN0QW5nbGU6IHR3aXN0QW5nbGVcbiAgICB9KTtcbiAgICBsZXQgcmlnaHRIaXBKb2ludCA9IG5ldyBDQU5OT04uQ29uZVR3aXN0Q29uc3RyYWludCh1cHBlclJpZ2h0TGVnLCBwZWx2aXMsIHtcbiAgICAgIHBpdm90QTogbmV3IENBTk5PTi5WZWMzKDAsIHVwcGVyTGVnTGVuZ3RoLzIsMCksXG4gICAgICBwaXZvdEI6IG5ldyBDQU5OT04uVmVjMyhzaG91bGRlcnNEaXN0YW5jZS8yLC1wZWx2aXNMZW5ndGgvMiwwKSxcbiAgICAgIGF4aXNBOiBDQU5OT04uVmVjMy5VTklUX1ksXG4gICAgICBheGlzQjogQ0FOTk9OLlZlYzMuVU5JVF9ZLFxuICAgICAgYW5nbGU6IGFuZ2xlQSxcbiAgICAgIHR3aXN0QW5nbGU6IHR3aXN0QW5nbGVcbiAgICB9KTtcbiAgICB0aGlzLndvcmxkLmFkZENvbnN0cmFpbnQobGVmdEhpcEpvaW50KTtcbiAgICB0aGlzLndvcmxkLmFkZENvbnN0cmFpbnQocmlnaHRIaXBKb2ludCk7XG5cbiAgICAvLyBTcGluZVxuICAgIGxldCBzcGluZUpvaW50ID0gbmV3IENBTk5PTi5Db25lVHdpc3RDb25zdHJhaW50KHBlbHZpcywgdXBwZXJCb2R5LCB7XG4gICAgICBwaXZvdEE6IG5ldyBDQU5OT04uVmVjMygwLHBlbHZpc0xlbmd0aC8yLDApLFxuICAgICAgcGl2b3RCOiBuZXcgQ0FOTk9OLlZlYzMoMCwtdXBwZXJCb2R5TGVuZ3RoLzIsMCksXG4gICAgICBheGlzQTogQ0FOTk9OLlZlYzMuVU5JVF9ZLFxuICAgICAgYXhpc0I6IENBTk5PTi5WZWMzLlVOSVRfWSxcbiAgICAgIGFuZ2xlOiBhbmdsZUEsXG4gICAgICB0d2lzdEFuZ2xlOiB0d2lzdEFuZ2xlXG4gICAgfSk7XG4gICAgdGhpcy53b3JsZC5hZGRDb25zdHJhaW50KHNwaW5lSm9pbnQpO1xuXG4gICAgLy8gU2hvdWxkZXJzXG4gICAgbGV0IGxlZnRTaG91bGRlciA9IG5ldyBDQU5OT04uQ29uZVR3aXN0Q29uc3RyYWludCh1cHBlckJvZHksIHVwcGVyTGVmdEFybSwge1xuICAgICAgcGl2b3RBOiBuZXcgQ0FOTk9OLlZlYzMoLXNob3VsZGVyc0Rpc3RhbmNlLzIsIHVwcGVyQm9keUxlbmd0aC8yLDApLFxuICAgICAgcGl2b3RCOiBuZXcgQ0FOTk9OLlZlYzModXBwZXJBcm1MZW5ndGgvMiwwLDApLFxuICAgICAgYXhpc0E6IENBTk5PTi5WZWMzLlVOSVRfWCxcbiAgICAgIGF4aXNCOiBDQU5OT04uVmVjMy5VTklUX1gsXG4gICAgICBhbmdsZTogYW5nbGVCXG4gICAgfSk7XG4gICAgbGV0IHJpZ2h0U2hvdWxkZXI9IG5ldyBDQU5OT04uQ29uZVR3aXN0Q29uc3RyYWludCh1cHBlckJvZHksIHVwcGVyUmlnaHRBcm0sIHtcbiAgICAgIHBpdm90QTogbmV3IENBTk5PTi5WZWMzKHNob3VsZGVyc0Rpc3RhbmNlLzIsICB1cHBlckJvZHlMZW5ndGgvMiwwKSxcbiAgICAgIHBpdm90QjogbmV3IENBTk5PTi5WZWMzKC11cHBlckFybUxlbmd0aC8yLDAsMCksXG4gICAgICBheGlzQTogQ0FOTk9OLlZlYzMuVU5JVF9YLFxuICAgICAgYXhpc0I6IENBTk5PTi5WZWMzLlVOSVRfWCxcbiAgICAgIGFuZ2xlOiBhbmdsZUIsXG4gICAgICB0d2lzdEFuZ2xlOiB0d2lzdEFuZ2xlXG4gICAgfSk7XG4gICAgdGhpcy53b3JsZC5hZGRDb25zdHJhaW50KGxlZnRTaG91bGRlcik7XG4gICAgdGhpcy53b3JsZC5hZGRDb25zdHJhaW50KHJpZ2h0U2hvdWxkZXIpO1xuXG4gICAgLy8gRWxib3cgam9pbnRcbiAgICBsZXQgbGVmdEVsYm93Sm9pbnQgPSBuZXcgQ0FOTk9OLkNvbmVUd2lzdENvbnN0cmFpbnQobG93ZXJMZWZ0QXJtLCB1cHBlckxlZnRBcm0sIHtcbiAgICAgIHBpdm90QTogbmV3IENBTk5PTi5WZWMzKGxvd2VyQXJtTGVuZ3RoLzIsIDAsMCksXG4gICAgICBwaXZvdEI6IG5ldyBDQU5OT04uVmVjMygtdXBwZXJBcm1MZW5ndGgvMiwwLDApLFxuICAgICAgYXhpc0E6IENBTk5PTi5WZWMzLlVOSVRfWCxcbiAgICAgIGF4aXNCOiBDQU5OT04uVmVjMy5VTklUX1gsXG4gICAgICBhbmdsZTogYW5nbGVBLFxuICAgICAgdHdpc3RBbmdsZTogdHdpc3RBbmdsZVxuICAgIH0pO1xuICAgIGxldCByaWdodEVsYm93Sm9pbnQ9IG5ldyBDQU5OT04uQ29uZVR3aXN0Q29uc3RyYWludChsb3dlclJpZ2h0QXJtLCB1cHBlclJpZ2h0QXJtLCB7XG4gICAgICBwaXZvdEE6IG5ldyBDQU5OT04uVmVjMygtbG93ZXJBcm1MZW5ndGgvMiwwLDApLFxuICAgICAgcGl2b3RCOiBuZXcgQ0FOTk9OLlZlYzModXBwZXJBcm1MZW5ndGgvMiwwLDApLFxuICAgICAgYXhpc0E6IENBTk5PTi5WZWMzLlVOSVRfWCxcbiAgICAgIGF4aXNCOiBDQU5OT04uVmVjMy5VTklUX1gsXG4gICAgICBhbmdsZTogYW5nbGVBLFxuICAgICAgdHdpc3RBbmdsZTogdHdpc3RBbmdsZVxuICAgIH0pO1xuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludChsZWZ0RWxib3dKb2ludCk7XG4gICAgdGhpcy53b3JsZC5hZGRDb25zdHJhaW50KHJpZ2h0RWxib3dKb2ludCk7XG5cbiAgICAvLyBNb3ZlIGFsbCBib2R5IHBhcnRzXG4gICAgZm9yIChsZXQgaSA9IG51bUJvZGllc0F0U3RhcnQ7IGkgPCB0aGlzLndvcmxkLmJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGJvZHkgPSB0aGlzLndvcmxkLmJvZGllc1tpXTtcbiAgICAgIGJvZHkucG9zaXRpb24udmFkZChwb3NpdGlvbiwgYm9keS5wb3NpdGlvbik7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlUGh5c2ljcygpIHtcbiAgICB0aGlzLndvcmxkLnN0ZXAodGhpcy5kdCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgIT09IHRoaXMubWVzaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMubWVzaGVzW2ldLnBvc2l0aW9uLmNvcHkodGhpcy5ib2RpZXNbaV0ucG9zaXRpb24pO1xuICAgICAgdGhpcy5tZXNoZXNbaV0ucXVhdGVybmlvbi5jb3B5KHRoaXMuYm9kaWVzW2ldLnF1YXRlcm5pb24pO1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICB0aGlzLmNvbnRyb2xzLnVwZGF0ZSgpO1xuICAgIHRoaXMucmF5SW5wdXQudXBkYXRlKCk7XG5cbiAgICBpZiAodGhpcy5jb25zdHJhaW50RG93bikge1xuICAgICAgLy8gIERpZCBhbnkgYXhlcyAoYXNzdW1pbmcgYSAyRCB0cmFja3BhZCkgdmFsdWVzIGNoYW5nZT9cblxuICAgICAgbGV0IGdhbWVwYWQgPSBEZW1vUmVuZGVyZXIuZ2V0VlJHYW1lcGFkKCk7XG4gICAgICBpZiAoZ2FtZXBhZCAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoZ2FtZXBhZC5heGVzWzBdICYmIGdhbWVwYWQuYXhlc1sxXSkge1xuXG5cbiAgICAgICAgICBsZXQgYXhlc1ZhbCA9IHRoaXMuYXhlc1swXS52YWx1ZTtcbiAgICAgICAgICBsZXQgYXhpc1ggPSBnYW1lcGFkLmF4ZXNbMF07XG4gICAgICAgICAgbGV0IGF4aXNZID0gZ2FtZXBhZC5heGVzWzFdO1xuXG4gICAgICAgICAgLy8gb25seSBhcHBseSBmaWx0ZXIgaWYgYm90aCBheGVzIGFyZSBiZWxvdyB0aHJlc2hvbGRcbiAgICAgICAgICBsZXQgZmlsdGVyZWRYID0gdGhpcy5maWx0ZXJBeGlzKGF4aXNYKTtcbiAgICAgICAgICBsZXQgZmlsdGVyZWRZID0gdGhpcy5maWx0ZXJBeGlzKGF4aXNZKTtcbiAgICAgICAgICBpZiAoIWZpbHRlcmVkWCAmJiAhZmlsdGVyZWRZKSB7XG4gICAgICAgICAgICBheGlzWCA9IGZpbHRlcmVkWDtcbiAgICAgICAgICAgIGF4aXNZID0gZmlsdGVyZWRZO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChheGVzVmFsWzBdICE9PSBheGlzWCB8fCBheGVzVmFsWzFdICE9PSBheGlzWSkge1xuICAgICAgICAgICAgYXhlc1ZhbFswXSA9IGF4aXNYO1xuICAgICAgICAgICAgYXhlc1ZhbFsxXSA9IGF4aXNZO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2F4ZXMgY2hhbmdlZCcsIGF4ZXNWYWwpO1xuICAgICAgICAgICAgdGhpcy5yb3RhdGVKb2ludChheGlzWCwgYXhpc1kpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudXBkYXRlUGh5c2ljcygpO1xuICAgIHRoaXMuZWZmZWN0LnJlbmRlcih0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZmlyc3QgVlItZW5hYmxlZCBnYW1lcGFkLlxuICAgKi9cbiAgc3RhdGljIGdldFZSR2FtZXBhZCgpIHtcbiAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQgQVBJLCB0aGVyZSdzIG5vIGdhbWVwYWQuXG4gICAgaWYgKCFuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCBnYW1lcGFkcyA9IG5hdmlnYXRvci5nZXRHYW1lcGFkcygpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2FtZXBhZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGxldCBnYW1lcGFkID0gZ2FtZXBhZHNbaV07XG5cbiAgICAgIC8vIFRoZSBhcnJheSBtYXkgY29udGFpbiB1bmRlZmluZWQgZ2FtZXBhZHMsIHNvIGNoZWNrIGZvciB0aGF0IGFzIHdlbGwgYXNcbiAgICAgIC8vIGEgbm9uLW51bGwgcG9zZS5cbiAgICAgIGlmIChnYW1lcGFkICYmIGdhbWVwYWQucG9zZSkge1xuICAgICAgICByZXR1cm4gZ2FtZXBhZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmaWx0ZXJBeGlzKCB2ICkge1xuICAgIHRoaXMuYXhpc1RocmVzaG9sZCA9IDAuMjtcbiAgICByZXR1cm4gKCBNYXRoLmFicyggdiApID4gdGhpcy5heGlzVGhyZXNob2xkICkgPyB2IDogMDtcbiAgfVxuXG4gIHJlc2l6ZSgpIHtcbiAgICB0aGlzLmNhbWVyYS5hc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB0aGlzLmNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgY29uc29sZS5sb2coJ1Jlc2l6aW5nJyk7XG4gICAgY29uc29sZS5sb2coJ3dpbmRvdy5kZXZpY2VQaXhlbFJhdGlvOiAnICsgd2luZG93LmRldmljZVBpeGVsUmF0aW8pO1xuICAgIGNvbnNvbGUubG9nKCd3aW5kb3cuaW5uZXJXaWR0aDogJyArIHdpbmRvdy5pbm5lcldpZHRoKTtcbiAgICBjb25zb2xlLmxvZygnd2luZG93LmlubmVySGVpZ2h0OiAnICsgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgICBjb25zdCBEUFIgPSAod2luZG93LmRldmljZVBpeGVsUmF0aW8pID8gd2luZG93LmRldmljZVBpeGVsUmF0aW8gOiAxO1xuICAgIGNvbnN0IFdXID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgY29uc3QgSEggPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRTaXplKCBXVywgSEggKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFZpZXdwb3J0KCAwLCAwLCBXVypEUFIsIEhIKkRQUiApO1xuICAgIHRoaXMucmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA/IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIDogMSk7XG4gICAgdGhpcy5yYXlJbnB1dC5zZXRTaXplKHRoaXMucmVuZGVyZXIuZ2V0U2l6ZSgpKTtcbiAgfVxuXG4gIGhhbmRsZVJheURvd25fKG9wdF9tZXNoKSB7XG4gICAgRGVtb1JlbmRlcmVyLnNldEFjdGlvbl8ob3B0X21lc2gsIHRydWUpO1xuXG4gICAgbGV0IHBvcyA9IHRoaXMucmF5SW5wdXQucmVuZGVyZXIucmV0aWNsZS5wb3NpdGlvbjtcbiAgICBpZihwb3Mpe1xuICAgICAgdGhpcy5jb25zdHJhaW50RG93biA9IHRydWU7XG4gICAgICAvLyBTZXQgbWFya2VyIG9uIGNvbnRhY3QgcG9pbnRcbiAgICAgIHRoaXMuc2V0Q2xpY2tNYXJrZXIocG9zLngscG9zLnkscG9zLnosdGhpcy5zY2VuZSk7XG5cbiAgICAgIC8vIFNldCB0aGUgbW92ZW1lbnQgcGxhbmVcbiAgICAgIC8vIHNldFNjcmVlblBlcnBDZW50ZXIocG9zLGNhbWVyYSk7XG5cbiAgICAgIGxldCBpZHggPSB0aGlzLm1lc2hlcy5pbmRleE9mKG9wdF9tZXNoKTtcbiAgICAgIGlmKGlkeCAhPT0gLTEpe1xuICAgICAgICB0aGlzLmFkZFBvaW50ZXJDb25zdHJhaW50KHBvcy54LHBvcy55LHBvcy56LHRoaXMuYm9kaWVzW2lkeF0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZVJheURyYWdfKCkge1xuICAgIGlmICh0aGlzLnBvaW50ZXJDb25zdHJhaW50KSB7XG4gICAgICBsZXQgcG9zID0gdGhpcy5yYXlJbnB1dC5yZW5kZXJlci5yZXRpY2xlLnBvc2l0aW9uO1xuICAgICAgaWYocG9zKXtcbiAgICAgICAgdGhpcy5zZXRDbGlja01hcmtlcihwb3MueCxwb3MueSxwb3Mueix0aGlzLnNjZW5lKTtcbiAgICAgICAgdGhpcy5tb3ZlSm9pbnRUb1BvaW50KHBvcy54LHBvcy55LHBvcy56KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVSYXlVcF8ob3B0X21lc2gpIHtcbiAgICBEZW1vUmVuZGVyZXIuc2V0QWN0aW9uXyhvcHRfbWVzaCwgZmFsc2UpO1xuXG4gICAgdGhpcy5jb25zdHJhaW50RG93biA9IGZhbHNlO1xuICAgIC8vIHJlbW92ZSB0aGUgbWFya2VyXG4gICAgdGhpcy5yZW1vdmVDbGlja01hcmtlcigpO1xuXG4gICAgdGhpcy5yZW1vdmVKb2ludENvbnN0cmFpbnQoKTtcbiAgfVxuXG4gIGhhbmRsZVJheUNhbmNlbF8ob3B0X21lc2gpIHtcbiAgICBEZW1vUmVuZGVyZXIuc2V0QWN0aW9uXyhvcHRfbWVzaCwgZmFsc2UpO1xuICB9XG5cbiAgc3RhdGljIHNldFNlbGVjdGVkXyhtZXNoLCBpc1NlbGVjdGVkKSB7XG4gICAgLy9jb25zb2xlLmxvZygnc2V0U2VsZWN0ZWRfJywgaXNTZWxlY3RlZCk7XG4gICAgaWYgKG1lc2gubWF0ZXJpYWwpIHtcbiAgICAgIG1lc2gubWF0ZXJpYWwuY29sb3IgPSBpc1NlbGVjdGVkID8gSElHSExJR0hUX0NPTE9SIDogREVGQVVMVF9DT0xPUjtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgc2V0QWN0aW9uXyhvcHRfbWVzaCwgaXNBY3RpdmUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdzZXRBY3Rpb25fJywgISFvcHRfbWVzaCwgaXNBY3RpdmUpO1xuICAgIGlmIChvcHRfbWVzaCAmJiBvcHRfbWVzaC5tYXRlcmlhbCkge1xuICAgICAgb3B0X21lc2gubWF0ZXJpYWwuY29sb3IgPSBpc0FjdGl2ZSA/IEFDVElWRV9DT0xPUiA6IEhJR0hMSUdIVF9DT0xPUjtcbiAgICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgICAgb3B0X21lc2gubWF0ZXJpYWwud2lyZWZyYW1lID0gIW9wdF9tZXNoLm1hdGVyaWFsLndpcmVmcmFtZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXRDbGlja01hcmtlcih4LHkseikge1xuICAgIGlmKCF0aGlzLmNsaWNrTWFya2VyKXtcbiAgICAgIGNvbnN0IHNoYXBlID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KDAuMiwgOCwgOCk7XG4gICAgICB0aGlzLmNsaWNrTWFya2VyID0gbmV3IFRIUkVFLk1lc2goc2hhcGUsIHRoaXMubWFya2VyTWF0ZXJpYWwpO1xuICAgICAgdGhpcy5zY2VuZS5hZGQodGhpcy5jbGlja01hcmtlcik7XG4gICAgfVxuICAgIHRoaXMuY2xpY2tNYXJrZXIudmlzaWJsZSA9IHRydWU7XG4gICAgdGhpcy5jbGlja01hcmtlci5wb3NpdGlvbi5zZXQoeCx5LHopO1xuICB9XG5cbiAgcmVtb3ZlQ2xpY2tNYXJrZXIoKXtcbiAgICB0aGlzLmNsaWNrTWFya2VyLnZpc2libGUgPSBmYWxzZTtcbiAgfVxuXG4gIGFkZFBvaW50ZXJDb25zdHJhaW50KHgsIHksIHosIGJvZHkpIHtcbiAgICAvLyBUaGUgY2Fubm9uIGJvZHkgY29uc3RyYWluZWQgYnkgdGhlIHBvaW50ZXIgam9pbnRcbiAgICB0aGlzLmNvbnN0cmFpbmVkQm9keSA9IGJvZHk7XG5cbiAgICAvLyBWZWN0b3IgdG8gdGhlIGNsaWNrZWQgcG9pbnQsIHJlbGF0aXZlIHRvIHRoZSBib2R5XG4gICAgbGV0IHYxID0gbmV3IENBTk5PTi5WZWMzKHgseSx6KS52c3ViKHRoaXMuY29uc3RyYWluZWRCb2R5LnBvc2l0aW9uKTtcblxuICAgIC8vIEFwcGx5IGFudGktcXVhdGVybmlvbiB0byB2ZWN0b3IgdG8gdHJhbnNmb3JtIGl0IGludG8gdGhlIGxvY2FsIGJvZHkgY29vcmRpbmF0ZSBzeXN0ZW1cbiAgICBsZXQgYW50aVJvdCA9IHRoaXMuY29uc3RyYWluZWRCb2R5LnF1YXRlcm5pb24uaW52ZXJzZSgpO1xuICAgIGxldCBwaXZvdCA9IG5ldyBDQU5OT04uUXVhdGVybmlvbihhbnRpUm90LngsIGFudGlSb3QueSwgYW50aVJvdC56LCBhbnRpUm90LncpLnZtdWx0KHYxKTsgLy8gcGl2b3QgaXMgbm90IGluIGxvY2FsIGJvZHkgY29vcmRpbmF0ZXNcblxuICAgIC8vIE1vdmUgdGhlIGNhbm5vbiBjbGljayBtYXJrZXIgcGFydGljbGUgdG8gdGhlIGNsaWNrIHBvc2l0aW9uXG4gICAgdGhpcy5qb2ludEJvZHkucG9zaXRpb24uc2V0KHgseSx6KTtcblxuICAgIC8vIENyZWF0ZSBhIG5ldyBjb25zdHJhaW50XG4gICAgLy8gVGhlIHBpdm90IGZvciB0aGUgam9pbnRCb2R5IGlzIHplcm9cbiAgICB0aGlzLnBvaW50ZXJDb25zdHJhaW50ID0gbmV3IENBTk5PTi5Qb2ludFRvUG9pbnRDb25zdHJhaW50KHRoaXMuY29uc3RyYWluZWRCb2R5LCBwaXZvdCwgdGhpcy5qb2ludEJvZHksIG5ldyBDQU5OT04uVmVjMygwLDAsMCkpO1xuXG4gICAgLy8gQWRkIHRoZSBjb25zdHJhaW50IHRvIHdvcmxkXG4gICAgdGhpcy53b3JsZC5hZGRDb25zdHJhaW50KHRoaXMucG9pbnRlckNvbnN0cmFpbnQpO1xuICB9XG5cbiAgLy8gVGhpcyBmdW5jdGlvbiBtb3ZlcyB0aGUgdHJhbnNwYXJlbnQgam9pbnQgYm9keSB0byBhIG5ldyBwb3NpdGlvbiBpbiBzcGFjZVxuICBtb3ZlSm9pbnRUb1BvaW50KHgseSx6KSB7XG4gICAgLy8gTW92ZSB0aGUgam9pbnQgYm9keSB0byBhIG5ldyBwb3NpdGlvblxuICAgIHRoaXMuam9pbnRCb2R5LnBvc2l0aW9uLnNldCh4LHkseik7XG4gICAgdGhpcy5wb2ludGVyQ29uc3RyYWludC51cGRhdGUoKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZSByb3RhdGlvbiBmcm9tIHR3byB2ZWN0b3JzIG9uIHRoZSB0b3VjaHBhZFxuICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy80MDUyMDEyOS90aHJlZS1qcy1yb3RhdGUtb2JqZWN0LXVzaW5nLW1vdXNlLWFuZC1vcmJpdC1jb250cm9sXG4gIC8vIGh0dHA6Ly9qc2ZpZGRsZS5uZXQveDRtYnkzOGUvMy9cbiAgcm90YXRlSm9pbnQoYXhpc1gsIGF4aXNaKSB7XG4gICAgaWYgKHRoaXMudG91Y2hQYWRQb3NpdGlvbi54ICE9PSAwIHx8IHRoaXMudG91Y2hQYWRQb3NpdGlvbi56ICE9PSAwKSB7XG4gICAgICBsZXQgZGVsdGFNb3ZlID0geyB4OiBheGlzWCAtIHRoaXMudG91Y2hQYWRQb3NpdGlvbi54LCB6OiBheGlzWiAtIHRoaXMudG91Y2hQYWRQb3NpdGlvbi56IH07XG4gICAgICBpZiAodGhpcy5wb2ludGVyQ29uc3RyYWludCkge1xuICAgICAgbGV0IGRlbHRhUm90YXRpb25RdWF0ZXJuaW9uID0gbmV3IENBTk5PTi5RdWF0ZXJuaW9uKClcbiAgICAgICAgLnNldEZyb21FdWxlcihcbiAgICAgICAgICBEZW1vUmVuZGVyZXIudG9SYWRpYW5zKGRlbHRhTW92ZS54KSxcbiAgICAgICAgICAwLFxuICAgICAgICAgIERlbW9SZW5kZXJlci50b1JhZGlhbnMoZGVsdGFNb3ZlLnopLFxuICAgICAgICAgICdYWVonXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuY29uc3RyYWluZWRCb2R5LnF1YXRlcm5pb24gPSBuZXcgQ0FOTk9OLlF1YXRlcm5pb24oKS5tdWx0KGRlbHRhUm90YXRpb25RdWF0ZXJuaW9uLCB0aGlzLmNvbnN0cmFpbmVkQm9keS5xdWF0ZXJuaW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy50b3VjaFBhZFBvc2l0aW9uLnggPSBheGlzWDtcbiAgICB0aGlzLnRvdWNoUGFkUG9zaXRpb24ueiA9IGF4aXNaO1xuICB9XG5cbiAgc3RhdGljIHRvUmFkaWFucyhhbmdsZSkge1xuICAgIHJldHVybiBhbmdsZSAqIChNYXRoLlBJIC8gMTgwKTtcbiAgfVxuXG4gIHJlbW92ZUpvaW50Q29uc3RyYWludCgpe1xuICAgIC8vIFJlbW92ZSBjb25zdHJhaW50IGZyb20gd29ybGRcbiAgICB0aGlzLndvcmxkLnJlbW92ZUNvbnN0cmFpbnQodGhpcy5wb2ludGVyQ29uc3RyYWludCk7XG4gICAgdGhpcy5wb2ludGVyQ29uc3RyYWludCA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hQYWRQb3NpdGlvbiA9IHsgeDogMCwgejogMCB9O1xuICB9XG5cbiAgc2hhcGUybWVzaChib2R5KSB7XG4gICAgdmFyIHdpcmVmcmFtZSA9IHRoaXMuc2V0dGluZ3MucmVuZGVyTW9kZSA9PT0gXCJ3aXJlZnJhbWVcIjtcbiAgICB2YXIgb2JqID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG5cbiAgICBmb3IgKHZhciBsID0gMDsgbCA8IGJvZHkuc2hhcGVzLmxlbmd0aDsgbCsrKSB7XG4gICAgICB2YXIgc2hhcGUgPSBib2R5LnNoYXBlc1tsXTtcblxuICAgICAgdmFyIG1lc2g7XG5cbiAgICAgIHN3aXRjaChzaGFwZS50eXBlKXtcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5TUEhFUkU6XG4gICAgICAgICAgdmFyIHNwaGVyZV9nZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSggc2hhcGUucmFkaXVzLCA4LCA4KTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIHNwaGVyZV9nZW9tZXRyeSwgdGhpcy5jdXJyZW50TWF0ZXJpYWwgKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5QQVJUSUNMRTpcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIHRoaXMucGFydGljbGVHZW8sIHRoaXMucGFydGljbGVNYXRlcmlhbCApO1xuICAgICAgICAgIHZhciBzID0gdGhpcy5zZXR0aW5ncztcbiAgICAgICAgICBtZXNoLnNjYWxlLnNldChzLnBhcnRpY2xlU2l6ZSxzLnBhcnRpY2xlU2l6ZSxzLnBhcnRpY2xlU2l6ZSk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuUExBTkU6XG4gICAgICAgICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoMTAsIDEwLCA0LCA0KTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgICAgICAgdmFyIHN1Ym1lc2ggPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICAgICAgICB2YXIgZ3JvdW5kID0gbmV3IFRIUkVFLk1lc2goIGdlb21ldHJ5LCB0aGlzLmN1cnJlbnRNYXRlcmlhbCApO1xuICAgICAgICAgIGdyb3VuZC5zY2FsZS5zZXQoMTAwLCAxMDAsIDEwMCk7XG4gICAgICAgICAgc3VibWVzaC5hZGQoZ3JvdW5kKTtcblxuICAgICAgICAgIGdyb3VuZC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAgICAgICBncm91bmQucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG5cbiAgICAgICAgICBtZXNoLmFkZChzdWJtZXNoKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5CT1g6XG4gICAgICAgICAgdmFyIGJveF9nZW9tZXRyeSA9IG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSggIHNoYXBlLmhhbGZFeHRlbnRzLngqMixcbiAgICAgICAgICAgIHNoYXBlLmhhbGZFeHRlbnRzLnkqMixcbiAgICAgICAgICAgIHNoYXBlLmhhbGZFeHRlbnRzLnoqMiApO1xuICAgICAgICAgIG1lc2ggPSBuZXcgVEhSRUUuTWVzaCggYm94X2dlb21ldHJ5LCB0aGlzLmN1cnJlbnRNYXRlcmlhbCApO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgQ0FOTk9OLlNoYXBlLnR5cGVzLkNPTlZFWFBPTFlIRURST046XG4gICAgICAgICAgdmFyIGdlbyA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuXG4gICAgICAgICAgLy8gQWRkIHZlcnRpY2VzXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaGFwZS52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHYgPSBzaGFwZS52ZXJ0aWNlc1tpXTtcbiAgICAgICAgICAgIGdlby52ZXJ0aWNlcy5wdXNoKG5ldyBUSFJFRS5WZWN0b3IzKHYueCwgdi55LCB2LnopKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IodmFyIGk9MDsgaSA8IHNoYXBlLmZhY2VzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBmYWNlID0gc2hhcGUuZmFjZXNbaV07XG5cbiAgICAgICAgICAgIC8vIGFkZCB0cmlhbmdsZXNcbiAgICAgICAgICAgIHZhciBhID0gZmFjZVswXTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAxOyBqIDwgZmFjZS5sZW5ndGggLSAxOyBqKyspIHtcbiAgICAgICAgICAgICAgdmFyIGIgPSBmYWNlW2pdO1xuICAgICAgICAgICAgICB2YXIgYyA9IGZhY2VbaiArIDFdO1xuICAgICAgICAgICAgICBnZW8uZmFjZXMucHVzaChuZXcgVEhSRUUuRmFjZTMoYSwgYiwgYykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBnZW8uY29tcHV0ZUJvdW5kaW5nU3BoZXJlKCk7XG4gICAgICAgICAgZ2VvLmNvbXB1dGVGYWNlTm9ybWFscygpO1xuICAgICAgICAgIG1lc2ggPSBuZXcgVEhSRUUuTWVzaCggZ2VvLCB0aGlzLmN1cnJlbnRNYXRlcmlhbCApO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgQ0FOTk9OLlNoYXBlLnR5cGVzLkhFSUdIVEZJRUxEOlxuICAgICAgICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuXG4gICAgICAgICAgdmFyIHYwID0gbmV3IENBTk5PTi5WZWMzKCk7XG4gICAgICAgICAgdmFyIHYxID0gbmV3IENBTk5PTi5WZWMzKCk7XG4gICAgICAgICAgdmFyIHYyID0gbmV3IENBTk5PTi5WZWMzKCk7XG4gICAgICAgICAgZm9yICh2YXIgeGkgPSAwOyB4aSA8IHNoYXBlLmRhdGEubGVuZ3RoIC0gMTsgeGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgeWkgPSAwOyB5aSA8IHNoYXBlLmRhdGFbeGldLmxlbmd0aCAtIDE7IHlpKyspIHtcbiAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCAyOyBrKyspIHtcbiAgICAgICAgICAgICAgICBzaGFwZS5nZXRDb252ZXhUcmlhbmdsZVBpbGxhcih4aSwgeWksIGs9PT0wKTtcbiAgICAgICAgICAgICAgICB2MC5jb3B5KHNoYXBlLnBpbGxhckNvbnZleC52ZXJ0aWNlc1swXSk7XG4gICAgICAgICAgICAgICAgdjEuY29weShzaGFwZS5waWxsYXJDb252ZXgudmVydGljZXNbMV0pO1xuICAgICAgICAgICAgICAgIHYyLmNvcHkoc2hhcGUucGlsbGFyQ29udmV4LnZlcnRpY2VzWzJdKTtcbiAgICAgICAgICAgICAgICB2MC52YWRkKHNoYXBlLnBpbGxhck9mZnNldCwgdjApO1xuICAgICAgICAgICAgICAgIHYxLnZhZGQoc2hhcGUucGlsbGFyT2Zmc2V0LCB2MSk7XG4gICAgICAgICAgICAgICAgdjIudmFkZChzaGFwZS5waWxsYXJPZmZzZXQsIHYyKTtcbiAgICAgICAgICAgICAgICBnZW9tZXRyeS52ZXJ0aWNlcy5wdXNoKFxuICAgICAgICAgICAgICAgICAgbmV3IFRIUkVFLlZlY3RvcjModjAueCwgdjAueSwgdjAueiksXG4gICAgICAgICAgICAgICAgICBuZXcgVEhSRUUuVmVjdG9yMyh2MS54LCB2MS55LCB2MS56KSxcbiAgICAgICAgICAgICAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKHYyLngsIHYyLnksIHYyLnopXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAtIDM7XG4gICAgICAgICAgICAgICAgZ2VvbWV0cnkuZmFjZXMucHVzaChuZXcgVEhSRUUuRmFjZTMoaSwgaSsxLCBpKzIpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdTcGhlcmUoKTtcbiAgICAgICAgICBnZW9tZXRyeS5jb21wdXRlRmFjZU5vcm1hbHMoKTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIHRoaXMuY3VycmVudE1hdGVyaWFsKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5UUklNRVNIOlxuICAgICAgICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuXG4gICAgICAgICAgdmFyIHYwID0gbmV3IENBTk5PTi5WZWMzKCk7XG4gICAgICAgICAgdmFyIHYxID0gbmV3IENBTk5PTi5WZWMzKCk7XG4gICAgICAgICAgdmFyIHYyID0gbmV3IENBTk5PTi5WZWMzKCk7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaGFwZS5pbmRpY2VzLmxlbmd0aCAvIDM7IGkrKykge1xuICAgICAgICAgICAgc2hhcGUuZ2V0VHJpYW5nbGVWZXJ0aWNlcyhpLCB2MCwgdjEsIHYyKTtcbiAgICAgICAgICAgIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2goXG4gICAgICAgICAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKHYwLngsIHYwLnksIHYwLnopLFxuICAgICAgICAgICAgICBuZXcgVEhSRUUuVmVjdG9yMyh2MS54LCB2MS55LCB2MS56KSxcbiAgICAgICAgICAgICAgbmV3IFRIUkVFLlZlY3RvcjModjIueCwgdjIueSwgdjIueilcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2YXIgaiA9IGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAtIDM7XG4gICAgICAgICAgICBnZW9tZXRyeS5mYWNlcy5wdXNoKG5ldyBUSFJFRS5GYWNlMyhqLCBqKzEsIGorMikpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdTcGhlcmUoKTtcbiAgICAgICAgICBnZW9tZXRyeS5jb21wdXRlRmFjZU5vcm1hbHMoKTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIHRoaXMuY3VycmVudE1hdGVyaWFsKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IFwiVmlzdWFsIHR5cGUgbm90IHJlY29nbml6ZWQ6IFwiK3NoYXBlLnR5cGU7XG4gICAgICB9XG5cbiAgICAgIG1lc2gucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gICAgICBtZXNoLmNhc3RTaGFkb3cgPSB0cnVlO1xuICAgICAgaWYobWVzaC5jaGlsZHJlbil7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPG1lc2guY2hpbGRyZW4ubGVuZ3RoOyBpKyspe1xuICAgICAgICAgIG1lc2guY2hpbGRyZW5baV0uY2FzdFNoYWRvdyA9IHRydWU7XG4gICAgICAgICAgbWVzaC5jaGlsZHJlbltpXS5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgICAgICAgICBpZihtZXNoLmNoaWxkcmVuW2ldKXtcbiAgICAgICAgICAgIGZvcih2YXIgaj0wOyBqPG1lc2guY2hpbGRyZW5baV0ubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICBtZXNoLmNoaWxkcmVuW2ldLmNoaWxkcmVuW2pdLmNhc3RTaGFkb3cgPSB0cnVlO1xuICAgICAgICAgICAgICBtZXNoLmNoaWxkcmVuW2ldLmNoaWxkcmVuW2pdLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgbyA9IGJvZHkuc2hhcGVPZmZzZXRzW2xdO1xuICAgICAgdmFyIHEgPSBib2R5LnNoYXBlT3JpZW50YXRpb25zW2xdO1xuICAgICAgbWVzaC5wb3NpdGlvbi5zZXQoby54LCBvLnksIG8ueik7XG4gICAgICBtZXNoLnF1YXRlcm5pb24uc2V0KHEueCwgcS55LCBxLnosIHEudyk7XG5cbiAgICAgIG9iai5hZGQobWVzaCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuaW1wb3J0IEludGVyYWN0aW9uTW9kZXMgZnJvbSAnLi9yYXktaW50ZXJhY3Rpb24tbW9kZXMnXG5pbXBvcnQge2lzTW9iaWxlfSBmcm9tICcuL3V0aWwnXG5cbmNvbnN0IERSQUdfRElTVEFOQ0VfUFggPSAxMDtcblxuLyoqXG4gKiBFbnVtZXJhdGVzIGFsbCBwb3NzaWJsZSBpbnRlcmFjdGlvbiBtb2Rlcy4gU2V0cyB1cCBhbGwgZXZlbnQgaGFuZGxlcnMgKG1vdXNlLFxuICogdG91Y2gsIGV0YyksIGludGVyZmFjZXMgd2l0aCBnYW1lcGFkIEFQSS5cbiAqXG4gKiBFbWl0cyBldmVudHM6XG4gKiAgICBhY3Rpb246IElucHV0IGlzIGFjdGl2YXRlZCAobW91c2Vkb3duLCB0b3VjaHN0YXJ0LCBkYXlkcmVhbSBjbGljaywgdml2ZSB0cmlnZ2VyKS5cbiAqICAgIHJlbGVhc2U6IElucHV0IGlzIGRlYWN0aXZhdGVkIChtb3VzZXVwLCB0b3VjaGVuZCwgZGF5ZHJlYW0gcmVsZWFzZSwgdml2ZSByZWxlYXNlKS5cbiAqICAgIGNhbmNlbDogSW5wdXQgaXMgY2FuY2VsZWQgKGVnLiB3ZSBzY3JvbGxlZCBpbnN0ZWFkIG9mIHRhcHBpbmcgb24gbW9iaWxlL2Rlc2t0b3ApLlxuICogICAgcG9pbnRlcm1vdmUoMkQgcG9zaXRpb24pOiBUaGUgcG9pbnRlciBpcyBtb3ZlZCAobW91c2Ugb3IgdG91Y2gpLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYXlDb250cm9sbGVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3Iob3B0X2VsKSB7XG4gICAgc3VwZXIoKTtcbiAgICBsZXQgZWwgPSBvcHRfZWwgfHwgd2luZG93O1xuXG4gICAgLy8gSGFuZGxlIGludGVyYWN0aW9ucy5cbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2VEb3duXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlVXBfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydF8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZV8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmRfLmJpbmQodGhpcykpO1xuXG4gICAgLy8gVGhlIHBvc2l0aW9uIG9mIHRoZSBwb2ludGVyLlxuICAgIHRoaXMucG9pbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgLy8gVGhlIHByZXZpb3VzIHBvc2l0aW9uIG9mIHRoZSBwb2ludGVyLlxuICAgIHRoaXMubGFzdFBvaW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIC8vIFBvc2l0aW9uIG9mIHBvaW50ZXIgaW4gTm9ybWFsaXplZCBEZXZpY2UgQ29vcmRpbmF0ZXMgKE5EQykuXG4gICAgdGhpcy5wb2ludGVyTmRjID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAvLyBIb3cgbXVjaCB3ZSBoYXZlIGRyYWdnZWQgKGlmIHdlIGFyZSBkcmFnZ2luZykuXG4gICAgdGhpcy5kcmFnRGlzdGFuY2UgPSAwO1xuICAgIC8vIEFyZSB3ZSBkcmFnZ2luZyBvciBub3QuXG4gICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgLy8gSXMgcG9pbnRlciBhY3RpdmUgb3Igbm90LlxuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IGZhbHNlO1xuICAgIC8vIElzIHRoaXMgYSBzeW50aGV0aWMgbW91c2UgZXZlbnQ/XG4gICAgdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQgPSBmYWxzZTtcblxuICAgIC8vIEdhbWVwYWQgZXZlbnRzLlxuICAgIHRoaXMuZ2FtZXBhZCA9IG51bGw7XG5cbiAgICAvLyBWUiBFdmVudHMuXG4gICAgaWYgKCFuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cykge1xuICAgICAgY29uc29sZS53YXJuKCdXZWJWUiBBUEkgbm90IGF2YWlsYWJsZSEgQ29uc2lkZXIgdXNpbmcgdGhlIHdlYnZyLXBvbHlmaWxsLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cygpLnRoZW4oKGRpc3BsYXlzKSA9PiB7XG4gICAgICAgIHRoaXMudnJEaXNwbGF5ID0gZGlzcGxheXNbMF07XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBnZXRJbnRlcmFjdGlvbk1vZGUoKSB7XG4gICAgLy8gVE9ETzogRGVidWdnaW5nIG9ubHkuXG4gICAgLy9yZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5EQVlEUkVBTTtcblxuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG5cbiAgICBpZiAoZ2FtZXBhZCkge1xuICAgICAgbGV0IHBvc2UgPSBnYW1lcGFkLnBvc2U7XG4gICAgICAvLyBJZiB0aGVyZSdzIGEgZ2FtZXBhZCBjb25uZWN0ZWQsIGRldGVybWluZSBpZiBpdCdzIERheWRyZWFtIG9yIGEgVml2ZS5cbiAgICAgIGlmIChwb3NlLmhhc1Bvc2l0aW9uKSB7XG4gICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzZET0Y7XG4gICAgICB9XG5cbiAgICAgIGlmIChwb3NlLmhhc09yaWVudGF0aW9uKSB7XG4gICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0Y7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkLCBpdCBtaWdodCBiZSBDYXJkYm9hcmQsIG1hZ2ljIHdpbmRvdyBvciBkZXNrdG9wLlxuICAgICAgaWYgKGlzTW9iaWxlKCkpIHtcbiAgICAgICAgLy8gRWl0aGVyIENhcmRib2FyZCBvciBtYWdpYyB3aW5kb3csIGRlcGVuZGluZyBvbiB3aGV0aGVyIHdlIGFyZVxuICAgICAgICAvLyBwcmVzZW50aW5nLlxuICAgICAgICBpZiAodGhpcy52ckRpc3BsYXkgJiYgdGhpcy52ckRpc3BsYXkuaXNQcmVzZW50aW5nKSB7XG4gICAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVlJfMERPRjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2UgbXVzdCBiZSBvbiBkZXNrdG9wLlxuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5NT1VTRTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQnkgZGVmYXVsdCwgdXNlIFRPVUNILlxuICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlRPVUNIO1xuICB9XG5cbiAgZ2V0R2FtZXBhZFBvc2UoKSB7XG4gICAgbGV0IGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcbiAgICByZXR1cm4gZ2FtZXBhZC5wb3NlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpZiB0aGVyZSBpcyBhbiBhY3RpdmUgdG91Y2ggZXZlbnQgZ29pbmcgb24uXG4gICAqIE9ubHkgcmVsZXZhbnQgb24gdG91Y2ggZGV2aWNlc1xuICAgKi9cbiAgZ2V0SXNUb3VjaEFjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1RvdWNoQWN0aXZlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIGNsaWNrIGlzIHRoZSBjYXJkYm9hcmQtY29tcGF0aWJsZSBmYWxsYmFja1xuICAgKiBjbGljayBvbiBEYXlkcmVhbSBjb250cm9sbGVycyBzbyB0aGF0IHdlIGNhbiBkZWR1cGxpY2F0ZSBpdC5cbiAgICogVE9ETyhrbGF1c3cpOiBJdCB3b3VsZCBiZSBuaWNlIHRvIGJlIGFibGUgdG8gbW92ZSBpbnRlcmFjdGlvbnNcbiAgICogdG8gdGhpcyBldmVudCBzaW5jZSBpdCBjb3VudHMgYXMgYSB1c2VyIGFjdGlvbiB3aGlsZSBjb250cm9sbGVyXG4gICAqIGNsaWNrcyBkb24ndC4gQnV0IHRoYXQgd291bGQgcmVxdWlyZSBsYXJnZXIgcmVmYWN0b3JpbmcuXG4gICAqL1xuICBpc0NhcmRib2FyZENvbXBhdENsaWNrKGUpIHtcbiAgICBsZXQgbW9kZSA9IHRoaXMuZ2V0SW50ZXJhY3Rpb25Nb2RlKCk7XG4gICAgaWYgKG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GICYmIGUuc2NyZWVuWCA9PSAwICYmIGUuc2NyZWVuWSA9PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc2V0U2l6ZShzaXplKSB7XG4gICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICBsZXQgbW9kZSA9IHRoaXMuZ2V0SW50ZXJhY3Rpb25Nb2RlKCk7XG4gICAgaWYgKG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GIHx8IG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GKSB7XG4gICAgICAvLyBJZiB3ZSdyZSBkZWFsaW5nIHdpdGggYSBnYW1lcGFkLCBjaGVjayBldmVyeSBhbmltYXRpb24gZnJhbWUgZm9yIGFcbiAgICAgIC8vIHByZXNzZWQgYWN0aW9uLlxuICAgICAgbGV0IGlzR2FtZXBhZFByZXNzZWQgPSB0aGlzLmdldEdhbWVwYWRCdXR0b25QcmVzc2VkXygpO1xuICAgICAgaWYgKGlzR2FtZXBhZFByZXNzZWQgJiYgIXRoaXMud2FzR2FtZXBhZFByZXNzZWQpIHtcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG4gICAgICB9XG4gICAgICBpZiAoIWlzR2FtZXBhZFByZXNzZWQgJiYgdGhpcy53YXNHYW1lcGFkUHJlc3NlZCkge1xuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXl1cCcpO1xuICAgICAgfVxuICAgICAgdGhpcy53YXNHYW1lcGFkUHJlc3NlZCA9IGlzR2FtZXBhZFByZXNzZWQ7XG5cbiAgICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXlkcmFnJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0R2FtZXBhZEJ1dHRvblByZXNzZWRfKCkge1xuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG4gICAgaWYgKCFnYW1lcGFkKSB7XG4gICAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQsIHRoZSBidXR0b24gd2FzIG5vdCBwcmVzc2VkLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBmb3IgY2xpY2tzLlxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZ2FtZXBhZC5idXR0b25zLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZiAoZ2FtZXBhZC5idXR0b25zW2pdLnByZXNzZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIG9uTW91c2VEb3duXyhlKSB7XG4gICAgaWYgKHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50KSByZXR1cm47XG4gICAgaWYgKHRoaXMuaXNDYXJkYm9hcmRDb21wYXRDbGljayhlKSkgcmV0dXJuO1xuXG4gICAgdGhpcy5zdGFydERyYWdnaW5nXyhlKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nKTtcbiAgfVxuXG4gIG9uTW91c2VNb3ZlXyhlKSB7XG4gICAgaWYgKHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50KSByZXR1cm47XG5cbiAgICB0aGlzLnVwZGF0ZVBvaW50ZXJfKGUpO1xuICAgIHRoaXMudXBkYXRlRHJhZ0Rpc3RhbmNlXygpO1xuICAgIHRoaXMuZW1pdCgncG9pbnRlcm1vdmUnLCB0aGlzLnBvaW50ZXJOZGMpO1xuICB9XG5cbiAgb25Nb3VzZVVwXyhlKSB7XG4gICAgdmFyIGlzU3ludGhldGljID0gdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQ7XG4gICAgdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQgPSBmYWxzZTtcbiAgICBpZiAoaXNTeW50aGV0aWMpIHJldHVybjtcbiAgICBpZiAodGhpcy5pc0NhcmRib2FyZENvbXBhdENsaWNrKGUpKSByZXR1cm47XG5cbiAgICB0aGlzLmVuZERyYWdnaW5nXygpO1xuICB9XG5cbiAgb25Ub3VjaFN0YXJ0XyhlKSB7XG4gICAgdGhpcy5pc1RvdWNoQWN0aXZlID0gdHJ1ZTtcbiAgICB2YXIgdCA9IGUudG91Y2hlc1swXTtcbiAgICB0aGlzLnN0YXJ0RHJhZ2dpbmdfKHQpO1xuICAgIHRoaXMudXBkYXRlVG91Y2hQb2ludGVyXyhlKTtcblxuICAgIHRoaXMuZW1pdCgncG9pbnRlcm1vdmUnLCB0aGlzLnBvaW50ZXJOZGMpO1xuICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xuICB9XG5cbiAgb25Ub3VjaE1vdmVfKGUpIHtcbiAgICB0aGlzLnVwZGF0ZVRvdWNoUG9pbnRlcl8oZSk7XG4gICAgdGhpcy51cGRhdGVEcmFnRGlzdGFuY2VfKCk7XG4gIH1cblxuICBvblRvdWNoRW5kXyhlKSB7XG4gICAgdGhpcy5lbmREcmFnZ2luZ18oKTtcblxuICAgIC8vIFN1cHByZXNzIGR1cGxpY2F0ZSBldmVudHMgZnJvbSBzeW50aGV0aWMgbW91c2UgZXZlbnRzLlxuICAgIHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50ID0gdHJ1ZTtcbiAgICB0aGlzLmlzVG91Y2hBY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIHVwZGF0ZVRvdWNoUG9pbnRlcl8oZSkge1xuICAgIC8vIElmIHRoZXJlJ3Mgbm8gdG91Y2hlcyBhcnJheSwgaWdub3JlLlxuICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1JlY2VpdmVkIHRvdWNoIGV2ZW50IHdpdGggbm8gdG91Y2hlcy4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHQgPSBlLnRvdWNoZXNbMF07XG4gICAgdGhpcy51cGRhdGVQb2ludGVyXyh0KTtcbiAgfVxuXG4gIHVwZGF0ZVBvaW50ZXJfKGUpIHtcbiAgICAvLyBIb3cgbXVjaCB0aGUgcG9pbnRlciBtb3ZlZC5cbiAgICB0aGlzLnBvaW50ZXIuc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgICB0aGlzLnBvaW50ZXJOZGMueCA9IChlLmNsaWVudFggLyB0aGlzLnNpemUud2lkdGgpICogMiAtIDE7XG4gICAgdGhpcy5wb2ludGVyTmRjLnkgPSAtIChlLmNsaWVudFkgLyB0aGlzLnNpemUuaGVpZ2h0KSAqIDIgKyAxO1xuICB9XG5cbiAgdXBkYXRlRHJhZ0Rpc3RhbmNlXygpIHtcbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICB2YXIgZGlzdGFuY2UgPSB0aGlzLmxhc3RQb2ludGVyLnN1Yih0aGlzLnBvaW50ZXIpLmxlbmd0aCgpO1xuICAgICAgdGhpcy5kcmFnRGlzdGFuY2UgKz0gZGlzdGFuY2U7XG4gICAgICB0aGlzLmxhc3RQb2ludGVyLmNvcHkodGhpcy5wb2ludGVyKTtcblxuXG4gICAgICAvL2NvbnNvbGUubG9nKCdkcmFnRGlzdGFuY2UnLCB0aGlzLmRyYWdEaXN0YW5jZSk7XG4gICAgICBpZiAodGhpcy5kcmFnRGlzdGFuY2UgPiBEUkFHX0RJU1RBTkNFX1BYKSB7XG4gICAgICAgIHRoaXMuZW1pdCgncmF5Y2FuY2VsJyk7XG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0YXJ0RHJhZ2dpbmdfKGUpIHtcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xuICAgIHRoaXMubGFzdFBvaW50ZXIuc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgfVxuXG4gIGVuZERyYWdnaW5nXygpIHtcbiAgICBpZiAodGhpcy5kcmFnRGlzdGFuY2UgPCBEUkFHX0RJU1RBTkNFX1BYKSB7XG4gICAgICB0aGlzLmVtaXQoJ3JheXVwJyk7XG4gICAgfVxuICAgIHRoaXMuZHJhZ0Rpc3RhbmNlID0gMDtcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBmaXJzdCBWUi1lbmFibGVkIGdhbWVwYWQuXG4gICAqL1xuICBnZXRWUkdhbWVwYWRfKCkge1xuICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCBBUEksIHRoZXJlJ3Mgbm8gZ2FtZXBhZC5cbiAgICBpZiAoIW5hdmlnYXRvci5nZXRHYW1lcGFkcykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGdhbWVwYWRzID0gbmF2aWdhdG9yLmdldEdhbWVwYWRzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lcGFkcy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIGdhbWVwYWQgPSBnYW1lcGFkc1tpXTtcblxuICAgICAgLy8gVGhlIGFycmF5IG1heSBjb250YWluIHVuZGVmaW5lZCBnYW1lcGFkcywgc28gY2hlY2sgZm9yIHRoYXQgYXMgd2VsbCBhc1xuICAgICAgLy8gYSBub24tbnVsbCBwb3NlLlxuICAgICAgaWYgKGdhbWVwYWQgJiYgZ2FtZXBhZC5wb3NlKSB7XG4gICAgICAgIHJldHVybiBnYW1lcGFkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IE9yaWVudGF0aW9uQXJtTW9kZWwgZnJvbSAnLi9vcmllbnRhdGlvbi1hcm0tbW9kZWwnXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnXG5pbXBvcnQgUmF5UmVuZGVyZXIgZnJvbSAnLi9yYXktcmVuZGVyZXInXG5pbXBvcnQgUmF5Q29udHJvbGxlciBmcm9tICcuL3JheS1jb250cm9sbGVyJ1xuaW1wb3J0IEludGVyYWN0aW9uTW9kZXMgZnJvbSAnLi9yYXktaW50ZXJhY3Rpb24tbW9kZXMnXG5cbi8qKlxuICogQVBJIHdyYXBwZXIgZm9yIHRoZSBpbnB1dCBsaWJyYXJ5LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYXlJbnB1dCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKGNhbWVyYSwgb3B0X2VsKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgUmF5UmVuZGVyZXIoY2FtZXJhKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIgPSBuZXcgUmF5Q29udHJvbGxlcihvcHRfZWwpO1xuXG4gICAgLy8gQXJtIG1vZGVsIG5lZWRlZCB0byB0cmFuc2Zvcm0gY29udHJvbGxlciBvcmllbnRhdGlvbiBpbnRvIHByb3BlciBwb3NlLlxuICAgIHRoaXMuYXJtTW9kZWwgPSBuZXcgT3JpZW50YXRpb25Bcm1Nb2RlbCgpO1xuXG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXlkb3duJywgdGhpcy5vblJheURvd25fLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5dXAnLCB0aGlzLm9uUmF5VXBfLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5Y2FuY2VsJywgdGhpcy5vblJheUNhbmNlbF8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdwb2ludGVybW92ZScsIHRoaXMub25Qb2ludGVyTW92ZV8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXlkcmFnJywgdGhpcy5vblJheURyYWdfLmJpbmQodGhpcykpO1xuICAgIHRoaXMucmVuZGVyZXIub24oJ3JheW92ZXInLCAobWVzaCkgPT4geyB0aGlzLmVtaXQoJ3JheW92ZXInLCBtZXNoKSB9KTtcbiAgICB0aGlzLnJlbmRlcmVyLm9uKCdyYXlvdXQnLCAobWVzaCkgPT4geyB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpIH0pO1xuXG4gICAgLy8gQnkgZGVmYXVsdCwgcHV0IHRoZSBwb2ludGVyIG9mZnNjcmVlbi5cbiAgICB0aGlzLnBvaW50ZXJOZGMgPSBuZXcgVEhSRUUuVmVjdG9yMigxLCAxKTtcblxuICAgIC8vIEV2ZW50IGhhbmRsZXJzLlxuICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgfVxuXG4gIGFkZChvYmplY3QsIGhhbmRsZXJzKSB7XG4gICAgdGhpcy5yZW5kZXJlci5hZGQob2JqZWN0LCBoYW5kbGVycyk7XG4gICAgdGhpcy5oYW5kbGVyc1tvYmplY3QuaWRdID0gaGFuZGxlcnM7XG4gIH1cblxuICByZW1vdmUob2JqZWN0KSB7XG4gICAgdGhpcy5yZW5kZXJlci5yZW1vdmUob2JqZWN0KTtcbiAgICBkZWxldGUgdGhpcy5oYW5kbGVyc1tvYmplY3QuaWRdXG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgbGV0IGxvb2tBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICBsb29rQXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuXG4gICAgbGV0IG1vZGUgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0SW50ZXJhY3Rpb25Nb2RlKCk7XG4gICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuTU9VU0U6XG4gICAgICAgIC8vIERlc2t0b3AgbW91c2UgbW9kZSwgbW91c2UgY29vcmRpbmF0ZXMgYXJlIHdoYXQgbWF0dGVycy5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb2ludGVyKHRoaXMucG9pbnRlck5kYyk7XG4gICAgICAgIC8vIEhpZGUgdGhlIHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eShmYWxzZSk7XG5cbiAgICAgICAgLy8gSW4gbW91c2UgbW9kZSByYXkgcmVuZGVyZXIgaXMgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVE9VQ0g6XG4gICAgICAgIC8vIE1vYmlsZSBtYWdpYyB3aW5kb3cgbW9kZS4gVG91Y2ggY29vcmRpbmF0ZXMgbWF0dGVyLCBidXQgd2Ugd2FudCB0b1xuICAgICAgICAvLyBoaWRlIHRoZSByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvaW50ZXIodGhpcy5wb2ludGVyTmRjKTtcblxuICAgICAgICAvLyBIaWRlIHRoZSByYXkgYW5kIHRoZSByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkoZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KGZhbHNlKTtcblxuICAgICAgICAvLyBJbiB0b3VjaCBtb2RlIHRoZSByYXkgcmVuZGVyZXIgaXMgb25seSBhY3RpdmUgb24gdG91Y2guXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRoaXMuY29udHJvbGxlci5nZXRJc1RvdWNoQWN0aXZlKCkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzBET0Y6XG4gICAgICAgIC8vIENhcmRib2FyZCBtb2RlLCB3ZSdyZSBkZWFsaW5nIHdpdGggYSBnYXplIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24odGhpcy5jYW1lcmEucG9zaXRpb24pO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuXG4gICAgICAgIC8vIFJldGljbGUgb25seS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eSh0cnVlKTtcblxuICAgICAgICAvLyBSYXkgcmVuZGVyZXIgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRjpcbiAgICAgICAgLy8gRGF5ZHJlYW0sIG91ciBvcmlnaW4gaXMgc2xpZ2h0bHkgb2ZmIChkZXBlbmRpbmcgb24gaGFuZGVkbmVzcykuXG4gICAgICAgIC8vIEJ1dCB3ZSBzaG91bGQgYmUgdXNpbmcgdGhlIG9yaWVudGF0aW9uIGZyb20gdGhlIGdhbWVwYWQuXG4gICAgICAgIC8vIFRPRE8oc211cyk6IEltcGxlbWVudCB0aGUgcmVhbCBhcm0gbW9kZWwuXG4gICAgICAgIHZhciBwb3NlID0gdGhpcy5jb250cm9sbGVyLmdldEdhbWVwYWRQb3NlKCk7XG5cbiAgICAgICAgLy8gRGVidWcgb25seTogdXNlIGNhbWVyYSBhcyBpbnB1dCBjb250cm9sbGVyLlxuICAgICAgICAvL2xldCBjb250cm9sbGVyT3JpZW50YXRpb24gPSB0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uO1xuICAgICAgICBsZXQgY29udHJvbGxlck9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5mcm9tQXJyYXkocG9zZS5vcmllbnRhdGlvbik7XG5cbiAgICAgICAgLy8gVHJhbnNmb3JtIHRoZSBjb250cm9sbGVyIGludG8gdGhlIGNhbWVyYSBjb29yZGluYXRlIHN5c3RlbS5cbiAgICAgICAgLypcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLm11bHRpcGx5KFxuICAgICAgICAgICAgbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLCBNYXRoLlBJKSk7XG4gICAgICAgIGNvbnRyb2xsZXJPcmllbnRhdGlvbi54ICo9IC0xO1xuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ueiAqPSAtMTtcbiAgICAgICAgKi9cblxuICAgICAgICAvLyBGZWVkIGNhbWVyYSBhbmQgY29udHJvbGxlciBpbnRvIHRoZSBhcm0gbW9kZWwuXG4gICAgICAgIHRoaXMuYXJtTW9kZWwuc2V0SGVhZE9yaWVudGF0aW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnNldEhlYWRQb3NpdGlvbih0aGlzLmNhbWVyYS5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMuYXJtTW9kZWwuc2V0Q29udHJvbGxlck9yaWVudGF0aW9uKGNvbnRyb2xsZXJPcmllbnRhdGlvbik7XG4gICAgICAgIHRoaXMuYXJtTW9kZWwudXBkYXRlKCk7XG5cbiAgICAgICAgLy8gR2V0IHJlc3VsdGluZyBwb3NlIGFuZCBjb25maWd1cmUgdGhlIHJlbmRlcmVyLlxuICAgICAgICBsZXQgbW9kZWxQb3NlID0gdGhpcy5hcm1Nb2RlbC5nZXRQb3NlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24obW9kZWxQb3NlLnBvc2l0aW9uKTtcbiAgICAgICAgLy90aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKG5ldyBUSFJFRS5WZWN0b3IzKCkpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKG1vZGVsUG9zZS5vcmllbnRhdGlvbik7XG4gICAgICAgIC8vdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihjb250cm9sbGVyT3JpZW50YXRpb24pO1xuXG4gICAgICAgIC8vIFNob3cgcmF5IGFuZCByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkodHJ1ZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XG5cbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzZET0Y6XG4gICAgICAgIC8vIFZpdmUsIG9yaWdpbiBkZXBlbmRzIG9uIHRoZSBwb3NpdGlvbiBvZiB0aGUgY29udHJvbGxlci5cbiAgICAgICAgLy8gVE9ETyhzbXVzKS4uLlxuICAgICAgICB2YXIgcG9zZSA9IHRoaXMuY29udHJvbGxlci5nZXRHYW1lcGFkUG9zZSgpO1xuXG4gICAgICAgIC8vIENoZWNrIHRoYXQgdGhlIHBvc2UgaXMgdmFsaWQuXG4gICAgICAgIGlmICghcG9zZS5vcmllbnRhdGlvbiB8fCAhcG9zZS5wb3NpdGlvbikge1xuICAgICAgICAgIGNvbnNvbGUud2FybignSW52YWxpZCBnYW1lcGFkIHBvc2UuIENhblxcJ3QgdXBkYXRlIHJheS4nKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBsZXQgb3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLmZyb21BcnJheShwb3NlLm9yaWVudGF0aW9uKTtcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5mcm9tQXJyYXkocG9zZS5wb3NpdGlvbik7XG5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihvcmllbnRhdGlvbik7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24ocG9zaXRpb24pO1xuXG4gICAgICAgIC8vIFNob3cgcmF5IGFuZCByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkodHJ1ZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XG5cbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBpbnRlcmFjdGlvbiBtb2RlLicpO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlcmVyLnVwZGF0ZSgpO1xuICAgIHRoaXMuY29udHJvbGxlci51cGRhdGUoKTtcbiAgfVxuXG4gIHNldFNpemUoc2l6ZSkge1xuICAgIHRoaXMuY29udHJvbGxlci5zZXRTaXplKHNpemUpO1xuICB9XG5cbiAgZ2V0TWVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXRSZXRpY2xlUmF5TWVzaCgpO1xuICB9XG5cbiAgZ2V0T3JpZ2luKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLmdldE9yaWdpbigpO1xuICB9XG5cbiAgZ2V0RGlyZWN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLmdldERpcmVjdGlvbigpO1xuICB9XG5cbiAgZ2V0UmlnaHREaXJlY3Rpb24oKSB7XG4gICAgbGV0IGxvb2tBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICBsb29rQXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuICAgIHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMygpLmNyb3NzVmVjdG9ycyhsb29rQXQsIHRoaXMuY2FtZXJhLnVwKTtcbiAgfVxuXG4gIG9uUmF5RG93bl8oZSkge1xuICAgIC8vY29uc29sZS5sb2coJ29uUmF5RG93bl8nKTtcblxuICAgIC8vIEZvcmNlIHRoZSByZW5kZXJlciB0byByYXljYXN0LlxuICAgIHRoaXMucmVuZGVyZXIudXBkYXRlKCk7XG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5ZG93bicsIG1lc2gpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gIH1cblxuICBvblJheURyYWdfKCkge1xuICAgIHRoaXMucmVuZGVyZXIuc2V0RHJhZ2dpbmcodHJ1ZSk7XG4gICAgdGhpcy5lbWl0KCdyYXlkcmFnJyk7XG4gIH1cblxuICBvblJheVVwXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlVcF8nKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldERyYWdnaW5nKGZhbHNlKTtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXl1cCcsIG1lc2gpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUoZmFsc2UpO1xuICB9XG5cbiAgb25SYXlDYW5jZWxfKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheUNhbmNlbF8nKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldERyYWdnaW5nKGZhbHNlKTtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnLCBtZXNoKTtcbiAgfVxuXG4gIG9uUG9pbnRlck1vdmVfKG5kYykge1xuICAgIHRoaXMucG9pbnRlck5kYy5jb3B5KG5kYyk7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBJbnRlcmFjdGlvbk1vZGVzID0ge1xuICBNT1VTRTogMSxcbiAgVE9VQ0g6IDIsXG4gIFZSXzBET0Y6IDMsXG4gIFZSXzNET0Y6IDQsXG4gIFZSXzZET0Y6IDVcbn07XG5cbmV4cG9ydCB7IEludGVyYWN0aW9uTW9kZXMgYXMgZGVmYXVsdCB9O1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtiYXNlNjR9IGZyb20gJy4vdXRpbCdcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcblxuY29uc3QgUkVUSUNMRV9ESVNUQU5DRSA9IDM7XG5jb25zdCBJTk5FUl9SQURJVVMgPSAwLjAyO1xuY29uc3QgT1VURVJfUkFESVVTID0gMC4wNDtcbmNvbnN0IFJBWV9SQURJVVMgPSAwLjAyO1xuY29uc3QgR1JBRElFTlRfSU1BR0UgPSBiYXNlNjQoJ2ltYWdlL3BuZycsICdpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBSUFBQUFDQUNBWUFBQUREUG1ITEFBQUJka2xFUVZSNG5PM1d3WEhFUUF3RFFjaW4vRk9XdytCanVpUFlCMnE0RzJuUDkzM1A5U080ODI0emdEQURpRE9BdUhmYjMvVWp1S01BY1FZUVp3QngvZ0J4Q2hDbkFIRUtFS2NBY1FvUXB3QnhDaENuQUhFR0VHY0FjZjRBY1FvUVp3QnhCaEJuQUhFR0VHY0FjUVlRWndCeEJoQm5BSEVHRUdjQWNRWVFad0J4QmhCbkFISHZ0dC8xSTdpakFIRUdFR2NBY2Y0QWNRb1Fad0J4VGtDY0FzUVpRSndURUtjQWNRb1Fwd0J4QmhEbkJNUXBRSndDeENsQW5BTEVLVUNjQXNRcFFKd0N4Q2xBbkFMRUtVQ2NBc1FwUUp3QnhEa0JjUW9RcHdCeENoQ25BSEVLRUtjQWNRb1Fwd0J4Q2hDbkFIRUtFR2NBY1U1QW5BTEVLVUNjQXNRWlFKd1RFS2NBY1FZUTV3VEVLVUNjQWNRWlFKdy9RSndDeEJsQW5BSEVHVUNjQWNRWlFKd0J4QmxBbkFIRUdVQ2NBY1FaUUp3QnhCbEFuQUhFR1VEY3UrMjVmZ1IzRkNET0FPSU1JTTRmSUU0QjRoUWdUZ0hpRkNCT0FlSVVJRTRCNGhRZ3pnRGlEQ0RPSHlCT0FlSU1JTTRBNHY0Qi81SUY5ZUQ2UXhnQUFBQUFTVVZPUks1Q1lJST0nKTtcblxuLyoqXG4gKiBIYW5kbGVzIHJheSBpbnB1dCBzZWxlY3Rpb24gZnJvbSBmcmFtZSBvZiByZWZlcmVuY2Ugb2YgYW4gYXJiaXRyYXJ5IG9iamVjdC5cbiAqXG4gKiBUaGUgc291cmNlIG9mIHRoZSByYXkgaXMgZnJvbSB2YXJpb3VzIGxvY2F0aW9uczpcbiAqXG4gKiBEZXNrdG9wOiBtb3VzZS5cbiAqIE1hZ2ljIHdpbmRvdzogdG91Y2guXG4gKiBDYXJkYm9hcmQ6IGNhbWVyYS5cbiAqIERheWRyZWFtOiAzRE9GIGNvbnRyb2xsZXIgdmlhIGdhbWVwYWQgKGFuZCBzaG93IHJheSkuXG4gKiBWaXZlOiA2RE9GIGNvbnRyb2xsZXIgdmlhIGdhbWVwYWQgKGFuZCBzaG93IHJheSkuXG4gKlxuICogRW1pdHMgc2VsZWN0aW9uIGV2ZW50czpcbiAqICAgICByYXlvdmVyKG1lc2gpOiBUaGlzIG1lc2ggd2FzIHNlbGVjdGVkLlxuICogICAgIHJheW91dChtZXNoKTogVGhpcyBtZXNoIHdhcyB1bnNlbGVjdGVkLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYXlSZW5kZXJlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKGNhbWVyYSwgb3B0X3BhcmFtcykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcblxuICAgIHZhciBwYXJhbXMgPSBvcHRfcGFyYW1zIHx8IHt9O1xuXG4gICAgLy8gV2hpY2ggb2JqZWN0cyBhcmUgaW50ZXJhY3RpdmUgKGtleWVkIG9uIGlkKS5cbiAgICB0aGlzLm1lc2hlcyA9IHt9O1xuXG4gICAgLy8gV2hpY2ggb2JqZWN0cyBhcmUgY3VycmVudGx5IHNlbGVjdGVkIChrZXllZCBvbiBpZCkuXG4gICAgdGhpcy5zZWxlY3RlZCA9IHt9O1xuXG4gICAgLy8gVGhlIHJheWNhc3Rlci5cbiAgICB0aGlzLnJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoKTtcblxuICAgIC8vIFBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiwgaW4gYWRkaXRpb24uXG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgdGhpcy5vcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICB0aGlzLnJvb3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICAgIC8vIEFkZCB0aGUgcmV0aWNsZSBtZXNoIHRvIHRoZSByb290IG9mIHRoZSBvYmplY3QuXG4gICAgdGhpcy5yZXRpY2xlID0gdGhpcy5jcmVhdGVSZXRpY2xlXygpO1xuICAgIHRoaXMucm9vdC5hZGQodGhpcy5yZXRpY2xlKTtcblxuICAgIC8vIEFkZCB0aGUgcmF5IHRvIHRoZSByb290IG9mIHRoZSBvYmplY3QuXG4gICAgdGhpcy5yYXkgPSB0aGlzLmNyZWF0ZVJheV8oKTtcbiAgICB0aGlzLnJvb3QuYWRkKHRoaXMucmF5KTtcblxuICAgIC8vIEhvdyBmYXIgdGhlIHJldGljbGUgaXMgY3VycmVudGx5IGZyb20gdGhlIHJldGljbGUgb3JpZ2luLlxuICAgIHRoaXMucmV0aWNsZURpc3RhbmNlID0gUkVUSUNMRV9ESVNUQU5DRTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhbiBvYmplY3Qgc28gdGhhdCBpdCBjYW4gYmUgaW50ZXJhY3RlZCB3aXRoLlxuICAgKi9cbiAgYWRkKG9iamVjdCkge1xuICAgIHRoaXMubWVzaGVzW29iamVjdC5pZF0gPSBvYmplY3Q7XG4gIH1cblxuICAvKipcbiAgICogUHJldmVudCBhbiBvYmplY3QgZnJvbSBiZWluZyBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICByZW1vdmUob2JqZWN0KSB7XG4gICAgdmFyIGlkID0gb2JqZWN0LmlkO1xuICAgIGlmICh0aGlzLm1lc2hlc1tpZF0pIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZXhpc3RpbmcgbWVzaCwgd2UgY2FuJ3QgcmVtb3ZlIGl0LlxuICAgICAgZGVsZXRlIHRoaXMubWVzaGVzW2lkXTtcbiAgICB9XG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBjdXJyZW50bHkgc2VsZWN0ZWQsIHJlbW92ZSBpdC5cbiAgICBpZiAodGhpcy5zZWxlY3RlZFtpZF0pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW29iamVjdC5pZF07XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIC8vIERvIHRoZSByYXljYXN0aW5nIGFuZCBpc3N1ZSB2YXJpb3VzIGV2ZW50cyBhcyBuZWVkZWQuXG4gICAgZm9yIChsZXQgaWQgaW4gdGhpcy5tZXNoZXMpIHtcbiAgICAgIGxldCBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgICAgbGV0IGludGVyc2VjdHMgPSB0aGlzLnJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3QobWVzaCwgdHJ1ZSk7XG4gICAgICBpZiAoaW50ZXJzZWN0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignVW5leHBlY3RlZDogbXVsdGlwbGUgbWVzaGVzIGludGVyc2VjdGVkLicpO1xuICAgICAgfVxuICAgICAgbGV0IGlzSW50ZXJzZWN0ZWQgPSAoaW50ZXJzZWN0cy5sZW5ndGggPiAwKTtcbiAgICAgIGxldCBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFtpZF07XG5cbiAgICAgIC8vIElmIGl0J3MgbmV3bHkgc2VsZWN0ZWQsIHNlbmQgcmF5b3Zlci5cbiAgICAgIGlmIChpc0ludGVyc2VjdGVkICYmICFpc1NlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRbaWRdID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JheW92ZXInLCBtZXNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBpdCdzIG5vIGxvbmdlciBpbnRlcnNlY3RlZCwgc2VuZCByYXlvdXQuXG4gICAgICBpZiAoIWlzSW50ZXJzZWN0ZWQgJiYgaXNTZWxlY3RlZCAmJiAhdGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW2lkXTtcbiAgICAgICAgdGhpcy5tb3ZlUmV0aWNsZV8obnVsbCk7XG4gICAgICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNJbnRlcnNlY3RlZCkge1xuICAgICAgICB0aGlzLm1vdmVSZXRpY2xlXyhpbnRlcnNlY3RzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luIG9mIHRoZSByYXkuXG4gICAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3IgUG9zaXRpb24gb2YgdGhlIG9yaWdpbiBvZiB0aGUgcGlja2luZyByYXkuXG4gICAqL1xuICBzZXRQb3NpdGlvbih2ZWN0b3IpIHtcbiAgICB0aGlzLnBvc2l0aW9uLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgfVxuXG4gIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHJheS5cbiAgICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvciBVbml0IHZlY3RvciBjb3JyZXNwb25kaW5nIHRvIGRpcmVjdGlvbi5cbiAgICovXG4gIHNldE9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLm9yaWVudGF0aW9uLmNvcHkocXVhdGVybmlvbik7XG5cbiAgICB2YXIgcG9pbnRBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKS5hcHBseVF1YXRlcm5pb24ocXVhdGVybmlvbik7XG4gICAgdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvbi5jb3B5KHBvaW50QXQpXG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICBnZXREaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9pbnRlciBvbiB0aGUgc2NyZWVuIGZvciBjYW1lcmEgKyBwb2ludGVyIGJhc2VkIHBpY2tpbmcuIFRoaXNcbiAgICogc3VwZXJzY2VkZXMgb3JpZ2luIGFuZCBkaXJlY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gdmVjdG9yIFRoZSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlciAoc2NyZWVuIGNvb3JkcykuXG4gICAqL1xuICBzZXRQb2ludGVyKHZlY3Rvcikge1xuICAgIHRoaXMucmF5Y2FzdGVyLnNldEZyb21DYW1lcmEodmVjdG9yLCB0aGlzLmNhbWVyYSk7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWVzaCwgd2hpY2ggaW5jbHVkZXMgcmV0aWNsZSBhbmQvb3IgcmF5LiBUaGlzIG1lc2ggaXMgdGhlbiBhZGRlZFxuICAgKiB0byB0aGUgc2NlbmUuXG4gICAqL1xuICBnZXRSZXRpY2xlUmF5TWVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBvYmplY3QgaW4gdGhlIHNjZW5lLlxuICAgKi9cbiAgZ2V0U2VsZWN0ZWRNZXNoKCkge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgbGV0IG1lc2ggPSBudWxsO1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgIGNvdW50ICs9IDE7XG4gICAgICBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICBpZiAoY291bnQgPiAxKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ01vcmUgdGhhbiBvbmUgbWVzaCBzZWxlY3RlZC4nKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc2g7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYW5kIHNob3dzIHRoZSByZXRpY2xlLlxuICAgKi9cbiAgc2V0UmV0aWNsZVZpc2liaWxpdHkoaXNWaXNpYmxlKSB7XG4gICAgdGhpcy5yZXRpY2xlLnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBvciBkaXNhYmxlcyB0aGUgcmF5Y2FzdGluZyByYXkgd2hpY2ggZ3JhZHVhbGx5IGZhZGVzIG91dCBmcm9tXG4gICAqIHRoZSBvcmlnaW4uXG4gICAqL1xuICBzZXRSYXlWaXNpYmlsaXR5KGlzVmlzaWJsZSkge1xuICAgIHRoaXMucmF5LnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhbmQgZGlzYWJsZXMgdGhlIHJheWNhc3Rlci4gRm9yIHRvdWNoLCB3aGVyZSBmaW5nZXIgdXAgbWVhbnMgd2VcbiAgICogc2hvdWxkbid0IGJlIHJheWNhc3RpbmcuXG4gICAqL1xuICBzZXRBY3RpdmUoaXNBY3RpdmUpIHtcbiAgICAvLyBJZiBub3RoaW5nIGNoYW5nZWQsIGRvIG5vdGhpbmcuXG4gICAgaWYgKHRoaXMuaXNBY3RpdmUgPT0gaXNBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVE9ETyhzbXVzKTogU2hvdyB0aGUgcmF5IG9yIHJldGljbGUgYWRqdXN0IGluIHJlc3BvbnNlLlxuICAgIHRoaXMuaXNBY3RpdmUgPSBpc0FjdGl2ZTtcblxuICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgIHRoaXMubW92ZVJldGljbGVfKG51bGwpO1xuICAgICAgZm9yIChsZXQgaWQgaW4gdGhpcy5zZWxlY3RlZCkge1xuICAgICAgICBsZXQgbWVzaCA9IHRoaXMubWVzaGVzW2lkXTtcbiAgICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbaWRdO1xuICAgICAgICB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldERyYWdnaW5nKGlzRHJhZ2dpbmcpIHtcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBpc0RyYWdnaW5nO1xuICB9XG5cbiAgdXBkYXRlUmF5Y2FzdGVyXygpIHtcbiAgICB2YXIgcmF5ID0gdGhpcy5yYXljYXN0ZXIucmF5O1xuXG4gICAgLy8gUG9zaXRpb24gdGhlIHJldGljbGUgYXQgYSBkaXN0YW5jZSwgYXMgY2FsY3VsYXRlZCBmcm9tIHRoZSBvcmlnaW4gYW5kXG4gICAgLy8gZGlyZWN0aW9uLlxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMucmV0aWNsZS5wb3NpdGlvbjtcbiAgICBwb3NpdGlvbi5jb3B5KHJheS5kaXJlY3Rpb24pO1xuICAgIHBvc2l0aW9uLm11bHRpcGx5U2NhbGFyKHRoaXMucmV0aWNsZURpc3RhbmNlKTtcbiAgICBwb3NpdGlvbi5hZGQocmF5Lm9yaWdpbik7XG5cbiAgICAvLyBTZXQgcG9zaXRpb24gYW5kIG9yaWVudGF0aW9uIG9mIHRoZSByYXkgc28gdGhhdCBpdCBnb2VzIGZyb20gb3JpZ2luIHRvXG4gICAgLy8gcmV0aWNsZS5cbiAgICB2YXIgZGVsdGEgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkocmF5LmRpcmVjdGlvbik7XG4gICAgZGVsdGEubXVsdGlwbHlTY2FsYXIodGhpcy5yZXRpY2xlRGlzdGFuY2UpO1xuICAgIHRoaXMucmF5LnNjYWxlLnkgPSBkZWx0YS5sZW5ndGgoKTtcbiAgICB2YXIgYXJyb3cgPSBuZXcgVEhSRUUuQXJyb3dIZWxwZXIocmF5LmRpcmVjdGlvbiwgcmF5Lm9yaWdpbik7XG4gICAgdGhpcy5yYXkucm90YXRpb24uY29weShhcnJvdy5yb3RhdGlvbik7XG4gICAgdGhpcy5yYXkucG9zaXRpb24uYWRkVmVjdG9ycyhyYXkub3JpZ2luLCBkZWx0YS5tdWx0aXBseVNjYWxhcigwLjUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBnZW9tZXRyeSBvZiB0aGUgcmV0aWNsZS5cbiAgICovXG4gIGNyZWF0ZVJldGljbGVfKCkge1xuICAgIC8vIENyZWF0ZSBhIHNwaGVyaWNhbCByZXRpY2xlLlxuICAgIGxldCBpbm5lckdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KElOTkVSX1JBRElVUywgMzIsIDMyKTtcbiAgICBsZXQgaW5uZXJNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogMHhmZmZmZmYsXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgIG9wYWNpdHk6IDAuOVxuICAgIH0pO1xuICAgIGxldCBpbm5lciA9IG5ldyBUSFJFRS5NZXNoKGlubmVyR2VvbWV0cnksIGlubmVyTWF0ZXJpYWwpO1xuXG4gICAgbGV0IG91dGVyR2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoT1VURVJfUkFESVVTLCAzMiwgMzIpO1xuICAgIGxldCBvdXRlck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgIGNvbG9yOiAweDMzMzMzMyxcbiAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgb3BhY2l0eTogMC4zXG4gICAgfSk7XG4gICAgbGV0IG91dGVyID0gbmV3IFRIUkVFLk1lc2gob3V0ZXJHZW9tZXRyeSwgb3V0ZXJNYXRlcmlhbCk7XG5cbiAgICBsZXQgcmV0aWNsZSA9IG5ldyBUSFJFRS5Hcm91cCgpO1xuICAgIHJldGljbGUuYWRkKGlubmVyKTtcbiAgICByZXRpY2xlLmFkZChvdXRlcik7XG4gICAgcmV0dXJuIHJldGljbGU7XG4gIH1cblxuICAvKipcbiAgICogTW92ZXMgdGhlIHJldGljbGUgdG8gYSBwb3NpdGlvbiBzbyB0aGF0IGl0J3MganVzdCBpbiBmcm9udCBvZiB0aGUgbWVzaCB0aGF0XG4gICAqIGl0IGludGVyc2VjdGVkIHdpdGguXG4gICAqL1xuICBtb3ZlUmV0aWNsZV8oaW50ZXJzZWN0aW9ucykge1xuICAgIC8vIElmIG5vIGludGVyc2VjdGlvbiwgcmV0dXJuIHRoZSByZXRpY2xlIHRvIHRoZSBkZWZhdWx0IHBvc2l0aW9uLlxuICAgIGxldCBkaXN0YW5jZSA9IFJFVElDTEVfRElTVEFOQ0U7XG4gICAgaWYgKGludGVyc2VjdGlvbnMpIHtcbiAgICAgIC8vIE90aGVyd2lzZSwgZGV0ZXJtaW5lIHRoZSBjb3JyZWN0IGRpc3RhbmNlLlxuICAgICAgbGV0IGludGVyID0gaW50ZXJzZWN0aW9uc1swXTtcbiAgICAgIGRpc3RhbmNlID0gaW50ZXIuZGlzdGFuY2U7XG4gICAgfVxuXG4gICAgdGhpcy5yZXRpY2xlRGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjcmVhdGVSYXlfKCkge1xuICAgIC8vIENyZWF0ZSBhIGN5bGluZHJpY2FsIHJheS5cbiAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQ3lsaW5kZXJHZW9tZXRyeShSQVlfUkFESVVTLCBSQVlfUkFESVVTLCAxLCAzMik7XG4gICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgIG1hcDogVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZShHUkFESUVOVF9JTUFHRSksXG4gICAgICAvL2NvbG9yOiAweGZmZmZmZixcbiAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgb3BhY2l0eTogMC4zXG4gICAgfSk7XG4gICAgdmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuXG4gICAgcmV0dXJuIG1lc2g7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBpc01vYmlsZSgpIHtcbiAgdmFyIGNoZWNrID0gZmFsc2U7XG4gIChmdW5jdGlvbihhKXtpZigvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXJpc3xraW5kbGV8bGdlIHxtYWVtb3xtaWRwfG1tcHxtb2JpbGUuK2ZpcmVmb3h8bmV0ZnJvbnR8b3BlcmEgbShvYnxpbilpfHBhbG0oIG9zKT98cGhvbmV8cChpeGl8cmUpXFwvfHBsdWNrZXJ8cG9ja2V0fHBzcHxzZXJpZXMoNHw2KTB8c3ltYmlhbnx0cmVvfHVwXFwuKGJyb3dzZXJ8bGluayl8dm9kYWZvbmV8d2FwfHdpbmRvd3MgY2V8eGRhfHhpaW5vL2kudGVzdChhKXx8LzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdChhLnN1YnN0cigwLDQpKSljaGVjayA9IHRydWV9KShuYXZpZ2F0b3IudXNlckFnZW50fHxuYXZpZ2F0b3IudmVuZG9yfHx3aW5kb3cub3BlcmEpO1xuICByZXR1cm4gY2hlY2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjQobWltZVR5cGUsIGJhc2U2NCkge1xuICByZXR1cm4gJ2RhdGE6JyArIG1pbWVUeXBlICsgJztiYXNlNjQsJyArIGJhc2U2NDtcbn1cbiJdfQ==
