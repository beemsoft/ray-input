(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Example = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
module.exports={
  "name": "webvr-polyfill",
  "version": "0.9.36",
  "homepage": "https://github.com/googlevr/webvr-polyfill",
  "authors": [
    "Boris Smus <boris@smus.com>",
    "Brandon Jones <tojiro@gmail.com>",
    "Jordan Santell <jordan@jsantell.com>"
  ],
  "description": "Use WebVR today, on mobile or desktop, without requiring a special browser build.",
  "devDependencies": {
    "chai": "^3.5.0",
    "jsdom": "^9.12.0",
    "mocha": "^3.2.0",
    "semver": "^5.3.0",
    "webpack": "^2.6.1",
    "webpack-dev-server": "^2.4.5"
  },
  "main": "src/node-entry",
  "keywords": [
    "vr",
    "webvr"
  ],
  "license": "Apache-2.0",
  "scripts": {
    "start": "npm run watch",
    "watch": "webpack-dev-server",
    "build": "webpack",
    "test": "mocha"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/googlevr/webvr-polyfill.git"
  },
  "bugs": {
    "url": "https://github.com/googlevr/webvr-polyfill/issues"
  },
  "gitHead": "5f8693a9053ee1dea425e96d14cd1f2bef7a284c",
  "_id": "webvr-polyfill@0.9.36",
  "_shasum": "4b1e1556667e804beb0c8c2e67fdfcba3371e8c6",
  "_from": "webvr-polyfill@>=0.9.15 <0.10.0",
  "_npmVersion": "2.15.11",
  "_nodeVersion": "4.8.4",
  "_npmUser": {
    "name": "jsantell",
    "email": "jsantell@gmail.com"
  },
  "dist": {
    "shasum": "4b1e1556667e804beb0c8c2e67fdfcba3371e8c6",
    "tarball": "https://registry.npmjs.org/webvr-polyfill/-/webvr-polyfill-0.9.36.tgz"
  },
  "maintainers": [
    {
      "name": "jsantell",
      "email": "jsantell@gmail.com"
    },
    {
      "name": "toji",
      "email": "tojiro@gmail.com"
    },
    {
      "name": "smus",
      "email": "boris@smus.com"
    }
  ],
  "_npmOperationalInternal": {
    "host": "s3://npm-registry-packages",
    "tmp": "tmp/webvr-polyfill-0.9.36.tgz_1499892972378_0.10267087002284825"
  },
  "directories": {},
  "_resolved": "https://registry.npmjs.org/webvr-polyfill/-/webvr-polyfill-0.9.36.tgz",
  "readme": "ERROR: No README data found!"
}

},{}],4:[function(require,module,exports){
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

var Util = require('./util.js');
var WakeLock = require('./wakelock.js');

// Start at a higher number to reduce chance of conflict.
var nextDisplayId = 1000;
var hasShowDeprecationWarning = false;

var defaultLeftBounds = [0, 0, 0.5, 1];
var defaultRightBounds = [0.5, 0, 0.5, 1];

/**
 * The base class for all VR frame data.
 */

function VRFrameData() {
  this.leftProjectionMatrix = new Float32Array(16);
  this.leftViewMatrix = new Float32Array(16);
  this.rightProjectionMatrix = new Float32Array(16);
  this.rightViewMatrix = new Float32Array(16);
  this.pose = null;
};

/**
 * The base class for all VR displays.
 */
function VRDisplay() {
  this.isPolyfilled = true;
  this.displayId = nextDisplayId++;
  this.displayName = 'webvr-polyfill displayName';

  this.depthNear = 0.01;
  this.depthFar = 10000.0;

  this.isConnected = true;
  this.isPresenting = false;
  this.capabilities = {
    hasPosition: false,
    hasOrientation: false,
    hasExternalDisplay: false,
    canPresent: false,
    maxLayers: 1
  };
  this.stageParameters = null;

  // "Private" members.
  this.waitingForPresent_ = false;
  this.layer_ = null;

  this.fullscreenElement_ = null;
  this.fullscreenWrapper_ = null;
  this.fullscreenElementCachedStyle_ = null;

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;

  this.wakelock_ = new WakeLock();
}

VRDisplay.prototype.getFrameData = function(frameData) {
  // TODO: Technically this should retain it's value for the duration of a frame
  // but I doubt that's practical to do in javascript.
  return Util.frameDataFromPose(frameData, this.getPose(), this);
};

VRDisplay.prototype.getPose = function() {
  // TODO: Technically this should retain it's value for the duration of a frame
  // but I doubt that's practical to do in javascript.
  return this.getImmediatePose();
};

VRDisplay.prototype.requestAnimationFrame = function(callback) {
  return window.requestAnimationFrame(callback);
};

VRDisplay.prototype.cancelAnimationFrame = function(id) {
  return window.cancelAnimationFrame(id);
};

VRDisplay.prototype.wrapForFullscreen = function(element) {
  // Don't wrap in iOS.
  if (Util.isIOS()) {
    return element;
  }
  if (!this.fullscreenWrapper_) {
    this.fullscreenWrapper_ = document.createElement('div');
    var cssProperties = [
      'height: ' + Math.min(screen.height, screen.width) + 'px !important',
      'top: 0 !important',
      'left: 0 !important',
      'right: 0 !important',
      'border: 0',
      'margin: 0',
      'padding: 0',
      'z-index: 999999 !important',
      'position: fixed',
    ];
    this.fullscreenWrapper_.setAttribute('style', cssProperties.join('; ') + ';');
    this.fullscreenWrapper_.classList.add('webvr-polyfill-fullscreen-wrapper');
  }

  if (this.fullscreenElement_ == element) {
    return this.fullscreenWrapper_;
  }

  // Remove any previously applied wrappers
  this.removeFullscreenWrapper();

  this.fullscreenElement_ = element;
  var parent = this.fullscreenElement_.parentElement;
  parent.insertBefore(this.fullscreenWrapper_, this.fullscreenElement_);
  parent.removeChild(this.fullscreenElement_);
  this.fullscreenWrapper_.insertBefore(this.fullscreenElement_, this.fullscreenWrapper_.firstChild);
  this.fullscreenElementCachedStyle_ = this.fullscreenElement_.getAttribute('style');

  var self = this;
  function applyFullscreenElementStyle() {
    if (!self.fullscreenElement_) {
      return;
    }

    var cssProperties = [
      'position: absolute',
      'top: 0',
      'left: 0',
      'width: ' + Math.max(screen.width, screen.height) + 'px',
      'height: ' + Math.min(screen.height, screen.width) + 'px',
      'border: 0',
      'margin: 0',
      'padding: 0',
    ];
    self.fullscreenElement_.setAttribute('style', cssProperties.join('; ') + ';');
  }

  applyFullscreenElementStyle();

  return this.fullscreenWrapper_;
};

VRDisplay.prototype.removeFullscreenWrapper = function() {
  if (!this.fullscreenElement_) {
    return;
  }

  var element = this.fullscreenElement_;
  if (this.fullscreenElementCachedStyle_) {
    element.setAttribute('style', this.fullscreenElementCachedStyle_);
  } else {
    element.removeAttribute('style');
  }
  this.fullscreenElement_ = null;
  this.fullscreenElementCachedStyle_ = null;

  var parent = this.fullscreenWrapper_.parentElement;
  this.fullscreenWrapper_.removeChild(element);
  parent.insertBefore(element, this.fullscreenWrapper_);
  parent.removeChild(this.fullscreenWrapper_);

  return element;
};

VRDisplay.prototype.requestPresent = function(layers) {
  var wasPresenting = this.isPresenting;
  var self = this;

  if (!(layers instanceof Array)) {
    if (!hasShowDeprecationWarning) {
      console.warn("Using a deprecated form of requestPresent. Should pass in an array of VRLayers.");
      hasShowDeprecationWarning = true;
    }
    layers = [layers];
  }

  return new Promise(function(resolve, reject) {
    if (!self.capabilities.canPresent) {
      reject(new Error('VRDisplay is not capable of presenting.'));
      return;
    }

    if (layers.length == 0 || layers.length > self.capabilities.maxLayers) {
      reject(new Error('Invalid number of layers.'));
      return;
    }

    var incomingLayer = layers[0];
    if (!incomingLayer.source) {
      /*
      todo: figure out the correct behavior if the source is not provided.
      see https://github.com/w3c/webvr/issues/58
      */
      resolve();
      return;
    }

    var leftBounds = incomingLayer.leftBounds || defaultLeftBounds;
    var rightBounds = incomingLayer.rightBounds || defaultRightBounds;
    if (wasPresenting) {
      // Already presenting, just changing configuration
      var layer = self.layer_;
      if (layer.source !== incomingLayer.source) {
        layer.source = incomingLayer.source;
      }

      for (var i = 0; i < 4; i++) {
        layer.leftBounds[i] = leftBounds[i];
        layer.rightBounds[i] = rightBounds[i];
      }

      resolve();
      return;
    }

    // Was not already presenting.
    self.layer_ = {
      predistorted: incomingLayer.predistorted,
      source: incomingLayer.source,
      leftBounds: leftBounds.slice(0),
      rightBounds: rightBounds.slice(0)
    };

    self.waitingForPresent_ = false;
    if (self.layer_ && self.layer_.source) {
      var fullscreenElement = self.wrapForFullscreen(self.layer_.source);

      var onFullscreenChange = function() {
        var actualFullscreenElement = Util.getFullscreenElement();

        self.isPresenting = (fullscreenElement === actualFullscreenElement);
        if (self.isPresenting) {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape-primary').catch(function(error){
                    console.error('screen.orientation.lock() failed due to', error.message)
            });
          }
          self.waitingForPresent_ = false;
          self.beginPresent_();
          resolve();
        } else {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
          self.removeFullscreenWrapper();
          self.wakelock_.release();
          self.endPresent_();
          self.removeFullscreenListeners_();
        }
        self.fireVRDisplayPresentChange_();
      }
      var onFullscreenError = function() {
        if (!self.waitingForPresent_) {
          return;
        }

        self.removeFullscreenWrapper();
        self.removeFullscreenListeners_();

        self.wakelock_.release();
        self.waitingForPresent_ = false;
        self.isPresenting = false;

        reject(new Error('Unable to present.'));
      }

      self.addFullscreenListeners_(fullscreenElement,
          onFullscreenChange, onFullscreenError);

      if (Util.requestFullscreen(fullscreenElement)) {
        self.wakelock_.request();
        self.waitingForPresent_ = true;
      } else if (Util.isIOS() || Util.isWebViewAndroid()) {
        // *sigh* Just fake it.
        self.wakelock_.request();
        self.isPresenting = true;
        self.beginPresent_();
        self.fireVRDisplayPresentChange_();
        resolve();
      }
    }

    if (!self.waitingForPresent_ && !Util.isIOS()) {
      Util.exitFullscreen();
      reject(new Error('Unable to present.'));
    }
  });
};

VRDisplay.prototype.exitPresent = function() {
  var wasPresenting = this.isPresenting;
  var self = this;
  this.isPresenting = false;
  this.layer_ = null;
  this.wakelock_.release();

  return new Promise(function(resolve, reject) {
    if (wasPresenting) {
      if (!Util.exitFullscreen() && Util.isIOS()) {
        self.endPresent_();
        self.fireVRDisplayPresentChange_();
      }

      if (Util.isWebViewAndroid()) {
        self.removeFullscreenWrapper();
        self.removeFullscreenListeners_();
        self.endPresent_();
        self.fireVRDisplayPresentChange_();
      }

      resolve();
    } else {
      reject(new Error('Was not presenting to VRDisplay.'));
    }
  });
};

VRDisplay.prototype.getLayers = function() {
  if (this.layer_) {
    return [this.layer_];
  }
  return [];
};

VRDisplay.prototype.fireVRDisplayPresentChange_ = function() {
  // Important: unfortunately we cannot have full spec compliance here.
  // CustomEvent custom fields all go under e.detail (so the VRDisplay ends up
  // being e.detail.display, instead of e.display as per WebVR spec).
  var event = new CustomEvent('vrdisplaypresentchange', {detail: {display: this}});
  window.dispatchEvent(event);
};

VRDisplay.prototype.fireVRDisplayConnect_ = function() {
  // Important: unfortunately we cannot have full spec compliance here.
  // CustomEvent custom fields all go under e.detail (so the VRDisplay ends up
  // being e.detail.display, instead of e.display as per WebVR spec).
  var event = new CustomEvent('vrdisplayconnect', {detail: {display: this}});
  window.dispatchEvent(event);
};

VRDisplay.prototype.addFullscreenListeners_ = function(element, changeHandler, errorHandler) {
  this.removeFullscreenListeners_();

  this.fullscreenEventTarget_ = element;
  this.fullscreenChangeHandler_ = changeHandler;
  this.fullscreenErrorHandler_ = errorHandler;

  if (changeHandler) {
    if (document.fullscreenEnabled) {
      element.addEventListener('fullscreenchange', changeHandler, false);
    } else if (document.webkitFullscreenEnabled) {
      element.addEventListener('webkitfullscreenchange', changeHandler, false);
    } else if (document.mozFullScreenEnabled) {
      document.addEventListener('mozfullscreenchange', changeHandler, false);
    } else if (document.msFullscreenEnabled) {
      element.addEventListener('msfullscreenchange', changeHandler, false);
    }
  }

  if (errorHandler) {
    if (document.fullscreenEnabled) {
      element.addEventListener('fullscreenerror', errorHandler, false);
    } else if (document.webkitFullscreenEnabled) {
      element.addEventListener('webkitfullscreenerror', errorHandler, false);
    } else if (document.mozFullScreenEnabled) {
      document.addEventListener('mozfullscreenerror', errorHandler, false);
    } else if (document.msFullscreenEnabled) {
      element.addEventListener('msfullscreenerror', errorHandler, false);
    }
  }
};

VRDisplay.prototype.removeFullscreenListeners_ = function() {
  if (!this.fullscreenEventTarget_)
    return;

  var element = this.fullscreenEventTarget_;

  if (this.fullscreenChangeHandler_) {
    var changeHandler = this.fullscreenChangeHandler_;
    element.removeEventListener('fullscreenchange', changeHandler, false);
    element.removeEventListener('webkitfullscreenchange', changeHandler, false);
    document.removeEventListener('mozfullscreenchange', changeHandler, false);
    element.removeEventListener('msfullscreenchange', changeHandler, false);
  }

  if (this.fullscreenErrorHandler_) {
    var errorHandler = this.fullscreenErrorHandler_;
    element.removeEventListener('fullscreenerror', errorHandler, false);
    element.removeEventListener('webkitfullscreenerror', errorHandler, false);
    document.removeEventListener('mozfullscreenerror', errorHandler, false);
    element.removeEventListener('msfullscreenerror', errorHandler, false);
  }

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;
};

VRDisplay.prototype.beginPresent_ = function() {
  // Override to add custom behavior when presentation begins.
};

VRDisplay.prototype.endPresent_ = function() {
  // Override to add custom behavior when presentation ends.
};

VRDisplay.prototype.submitFrame = function(pose) {
  // Override to add custom behavior for frame submission.
};

VRDisplay.prototype.getEyeParameters = function(whichEye) {
  // Override to return accurate eye parameters if canPresent is true.
  return null;
};

/*
 * Deprecated classes
 */

/**
 * The base class for all VR devices. (Deprecated)
 */
function VRDevice() {
  this.isPolyfilled = true;
  this.hardwareUnitId = 'webvr-polyfill hardwareUnitId';
  this.deviceId = 'webvr-polyfill deviceId';
  this.deviceName = 'webvr-polyfill deviceName';
}

/**
 * The base class for all VR HMD devices. (Deprecated)
 */
function HMDVRDevice() {
}
HMDVRDevice.prototype = new VRDevice();

/**
 * The base class for all VR position sensor devices. (Deprecated)
 */
function PositionSensorVRDevice() {
}
PositionSensorVRDevice.prototype = new VRDevice();

module.exports.VRFrameData = VRFrameData;
module.exports.VRDisplay = VRDisplay;
module.exports.VRDevice = VRDevice;
module.exports.HMDVRDevice = HMDVRDevice;
module.exports.PositionSensorVRDevice = PositionSensorVRDevice;

},{"./util.js":24,"./wakelock.js":26}],5:[function(require,module,exports){
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

var CardboardUI = require('./cardboard-ui.js');
var Util = require('./util.js');
var WGLUPreserveGLState = require('./deps/wglu-preserve-state.js');

var distortionVS = [
  'attribute vec2 position;',
  'attribute vec3 texCoord;',

  'varying vec2 vTexCoord;',

  'uniform vec4 viewportOffsetScale[2];',

  'void main() {',
  '  vec4 viewport = viewportOffsetScale[int(texCoord.z)];',
  '  vTexCoord = (texCoord.xy * viewport.zw) + viewport.xy;',
  '  gl_Position = vec4( position, 1.0, 1.0 );',
  '}',
].join('\n');

var distortionFS = [
  'precision mediump float;',
  'uniform sampler2D diffuse;',

  'varying vec2 vTexCoord;',

  'void main() {',
  '  gl_FragColor = texture2D(diffuse, vTexCoord);',
  '}',
].join('\n');

/**
 * A mesh-based distorter.
 */
function CardboardDistorter(gl) {
  this.gl = gl;
  this.ctxAttribs = gl.getContextAttributes();

  this.meshWidth = 20;
  this.meshHeight = 20;

  this.bufferScale = window.WebVRConfig.BUFFER_SCALE;

  this.bufferWidth = gl.drawingBufferWidth;
  this.bufferHeight = gl.drawingBufferHeight;

  // Patching support
  this.realBindFramebuffer = gl.bindFramebuffer;
  this.realEnable = gl.enable;
  this.realDisable = gl.disable;
  this.realColorMask = gl.colorMask;
  this.realClearColor = gl.clearColor;
  this.realViewport = gl.viewport;

  if (!Util.isIOS()) {
    this.realCanvasWidth = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'width');
    this.realCanvasHeight = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'height');
  }

  this.isPatched = false;

  // State tracking
  this.lastBoundFramebuffer = null;
  this.cullFace = false;
  this.depthTest = false;
  this.blend = false;
  this.scissorTest = false;
  this.stencilTest = false;
  this.viewport = [0, 0, 0, 0];
  this.colorMask = [true, true, true, true];
  this.clearColor = [0, 0, 0, 0];

  this.attribs = {
    position: 0,
    texCoord: 1
  };
  this.program = Util.linkProgram(gl, distortionVS, distortionFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.viewportOffsetScale = new Float32Array(8);
  this.setTextureBounds();

  this.vertexBuffer = gl.createBuffer();
  this.indexBuffer = gl.createBuffer();
  this.indexCount = 0;

  this.renderTarget = gl.createTexture();
  this.framebuffer = gl.createFramebuffer();

  this.depthStencilBuffer = null;
  this.depthBuffer = null;
  this.stencilBuffer = null;

  if (this.ctxAttribs.depth && this.ctxAttribs.stencil) {
    this.depthStencilBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.depth) {
    this.depthBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.stencil) {
    this.stencilBuffer = gl.createRenderbuffer();
  }

  this.patch();

  this.onResize();

  if (!window.WebVRConfig.CARDBOARD_UI_DISABLED) {
    this.cardboardUI = new CardboardUI(gl);
  }
};

/**
 * Tears down all the resources created by the distorter and removes any
 * patches.
 */
CardboardDistorter.prototype.destroy = function() {
  var gl = this.gl;

  this.unpatch();

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
  gl.deleteBuffer(this.indexBuffer);
  gl.deleteTexture(this.renderTarget);
  gl.deleteFramebuffer(this.framebuffer);
  if (this.depthStencilBuffer) {
    gl.deleteRenderbuffer(this.depthStencilBuffer);
  }
  if (this.depthBuffer) {
    gl.deleteRenderbuffer(this.depthBuffer);
  }
  if (this.stencilBuffer) {
    gl.deleteRenderbuffer(this.stencilBuffer);
  }

  if (this.cardboardUI) {
    this.cardboardUI.destroy();
  }
};


/**
 * Resizes the backbuffer to match the canvas width and height.
 */
CardboardDistorter.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.RENDERBUFFER_BINDING,
    gl.TEXTURE_BINDING_2D, gl.TEXTURE0
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind real backbuffer and clear it once. We don't need to clear it again
    // after that because we're overwriting the same area every frame.
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Put things in a good state
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    self.realClearColor.call(gl, 0, 0, 0, 1);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Now bind and resize the fake backbuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.framebuffer);

    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);
    gl.texImage2D(gl.TEXTURE_2D, 0, self.ctxAttribs.alpha ? gl.RGBA : gl.RGB,
        self.bufferWidth, self.bufferHeight, 0,
        self.ctxAttribs.alpha ? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, self.renderTarget, 0);

    if (self.ctxAttribs.depth && self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthStencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.depthStencilBuffer);
    } else if (self.ctxAttribs.depth) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
          gl.RENDERBUFFER, self.depthBuffer);
    } else if (self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.stencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.stencilBuffer);
    }

    if (!gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer incomplete!');
    }

    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);

    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    self.realClearColor.apply(gl, self.clearColor);
  });

  if (this.cardboardUI) {
    this.cardboardUI.onResize();
  }
};

CardboardDistorter.prototype.patch = function() {
  if (this.isPatched) {
    return;
  }

  var self = this;
  var canvas = this.gl.canvas;
  var gl = this.gl;

  if (!Util.isIOS()) {
    canvas.width = Util.getScreenWidth() * this.bufferScale;
    canvas.height = Util.getScreenHeight() * this.bufferScale;

    Object.defineProperty(canvas, 'width', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferWidth;
      },
      set: function(value) {
        self.bufferWidth = value;
        self.realCanvasWidth.set.call(canvas, value);
        self.onResize();
      }
    });

    Object.defineProperty(canvas, 'height', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferHeight;
      },
      set: function(value) {
        self.bufferHeight = value;
        self.realCanvasHeight.set.call(canvas, value);
        self.onResize();
      }
    });
  }

  this.lastBoundFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  if (this.lastBoundFramebuffer == null) {
    this.lastBoundFramebuffer = this.framebuffer;
    this.gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }

  this.gl.bindFramebuffer = function(target, framebuffer) {
    self.lastBoundFramebuffer = framebuffer ? framebuffer : self.framebuffer;
    // Silently make calls to bind the default framebuffer bind ours instead.
    self.realBindFramebuffer.call(gl, target, self.lastBoundFramebuffer);
  };

  this.cullFace = gl.getParameter(gl.CULL_FACE);
  this.depthTest = gl.getParameter(gl.DEPTH_TEST);
  this.blend = gl.getParameter(gl.BLEND);
  this.scissorTest = gl.getParameter(gl.SCISSOR_TEST);
  this.stencilTest = gl.getParameter(gl.STENCIL_TEST);

  gl.enable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = true; break;
      case gl.DEPTH_TEST: self.depthTest = true; break;
      case gl.BLEND: self.blend = true; break;
      case gl.SCISSOR_TEST: self.scissorTest = true; break;
      case gl.STENCIL_TEST: self.stencilTest = true; break;
    }
    self.realEnable.call(gl, pname);
  };

  gl.disable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = false; break;
      case gl.DEPTH_TEST: self.depthTest = false; break;
      case gl.BLEND: self.blend = false; break;
      case gl.SCISSOR_TEST: self.scissorTest = false; break;
      case gl.STENCIL_TEST: self.stencilTest = false; break;
    }
    self.realDisable.call(gl, pname);
  };

  this.colorMask = gl.getParameter(gl.COLOR_WRITEMASK);
  gl.colorMask = function(r, g, b, a) {
    self.colorMask[0] = r;
    self.colorMask[1] = g;
    self.colorMask[2] = b;
    self.colorMask[3] = a;
    self.realColorMask.call(gl, r, g, b, a);
  };

  this.clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
  gl.clearColor = function(r, g, b, a) {
    self.clearColor[0] = r;
    self.clearColor[1] = g;
    self.clearColor[2] = b;
    self.clearColor[3] = a;
    self.realClearColor.call(gl, r, g, b, a);
  };

  this.viewport = gl.getParameter(gl.VIEWPORT);
  gl.viewport = function(x, y, w, h) {
    self.viewport[0] = x;
    self.viewport[1] = y;
    self.viewport[2] = w;
    self.viewport[3] = h;
    self.realViewport.call(gl, x, y, w, h);
  };

  this.isPatched = true;
  Util.safariCssSizeWorkaround(canvas);
};

CardboardDistorter.prototype.unpatch = function() {
  if (!this.isPatched) {
    return;
  }

  var gl = this.gl;
  var canvas = this.gl.canvas;

  if (!Util.isIOS()) {
    Object.defineProperty(canvas, 'width', this.realCanvasWidth);
    Object.defineProperty(canvas, 'height', this.realCanvasHeight);
  }
  canvas.width = this.bufferWidth;
  canvas.height = this.bufferHeight;

  gl.bindFramebuffer = this.realBindFramebuffer;
  gl.enable = this.realEnable;
  gl.disable = this.realDisable;
  gl.colorMask = this.realColorMask;
  gl.clearColor = this.realClearColor;
  gl.viewport = this.realViewport;

  // Check to see if our fake backbuffer is bound and bind the real backbuffer
  // if that's the case.
  if (this.lastBoundFramebuffer == this.framebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  this.isPatched = false;

  setTimeout(function() {
    Util.safariCssSizeWorkaround(canvas);
  }, 1);
};

CardboardDistorter.prototype.setTextureBounds = function(leftBounds, rightBounds) {
  if (!leftBounds) {
    leftBounds = [0, 0, 0.5, 1];
  }

  if (!rightBounds) {
    rightBounds = [0.5, 0, 0.5, 1];
  }

  // Left eye
  this.viewportOffsetScale[0] = leftBounds[0]; // X
  this.viewportOffsetScale[1] = leftBounds[1]; // Y
  this.viewportOffsetScale[2] = leftBounds[2]; // Width
  this.viewportOffsetScale[3] = leftBounds[3]; // Height

  // Right eye
  this.viewportOffsetScale[4] = rightBounds[0]; // X
  this.viewportOffsetScale[5] = rightBounds[1]; // Y
  this.viewportOffsetScale[6] = rightBounds[2]; // Width
  this.viewportOffsetScale[7] = rightBounds[3]; // Height
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardDistorter.prototype.submitFrame = function() {
  var gl = this.gl;
  var self = this;

  var glState = [];

  if (!window.WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
    glState.push(
      gl.CURRENT_PROGRAM,
      gl.ARRAY_BUFFER_BINDING,
      gl.ELEMENT_ARRAY_BUFFER_BINDING,
      gl.TEXTURE_BINDING_2D, gl.TEXTURE0
    );
  }

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind the real default framebuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Make sure the GL state is in a good place
    if (self.cullFace) { self.realDisable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realDisable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realDisable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realDisable.call(gl, gl.STENCIL_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // If the backbuffer has an alpha channel clear every frame so the page
    // doesn't show through.
    if (self.ctxAttribs.alpha || Util.isIOS()) {
      self.realClearColor.call(gl, 0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Bind distortion program and mesh
    gl.useProgram(self.program);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.enableVertexAttribArray(self.attribs.position);
    gl.enableVertexAttribArray(self.attribs.texCoord);
    gl.vertexAttribPointer(self.attribs.position, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(self.attribs.texCoord, 3, gl.FLOAT, false, 20, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(self.uniforms.diffuse, 0);
    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);

    gl.uniform4fv(self.uniforms.viewportOffsetScale, self.viewportOffsetScale);

    // Draws both eyes
    gl.drawElements(gl.TRIANGLES, self.indexCount, gl.UNSIGNED_SHORT, 0);

    if (self.cardboardUI) {
      self.cardboardUI.renderNoState();
    }

    // Bind the fake default framebuffer again
    self.realBindFramebuffer.call(self.gl, gl.FRAMEBUFFER, self.framebuffer);

    // If preserveDrawingBuffer == false clear the framebuffer
    if (!self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.call(gl, 0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    if (!window.WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
      self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);
    }

    // Restore state
    if (self.cullFace) { self.realEnable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realEnable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realEnable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realEnable.call(gl, gl.STENCIL_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    if (self.ctxAttribs.alpha || !self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.apply(gl, self.clearColor);
    }
  });

  // Workaround for the fact that Safari doesn't allow us to patch the canvas
  // width and height correctly. After each submit frame check to see what the
  // real backbuffer size has been set to and resize the fake backbuffer size
  // to match.
  if (Util.isIOS()) {
    var canvas = gl.canvas;
    if (canvas.width != self.bufferWidth || canvas.height != self.bufferHeight) {
      self.bufferWidth = canvas.width;
      self.bufferHeight = canvas.height;
      self.onResize();
    }
  }
};

/**
 * Call when the deviceInfo has changed. At this point we need
 * to re-calculate the distortion mesh.
 */
CardboardDistorter.prototype.updateDeviceInfo = function(deviceInfo) {
  var gl = this.gl;
  var self = this;

  var glState = [gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING];
  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = self.computeMeshVertices_(self.meshWidth, self.meshHeight, deviceInfo);
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Indices don't change based on device parameters, so only compute once.
    if (!self.indexCount) {
      var indices = self.computeMeshIndices_(self.meshWidth, self.meshHeight);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      self.indexCount = indices.length;
    }
  });
};

/**
 * Build the distortion mesh vertices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshVertices_ = function(width, height, deviceInfo) {
  var vertices = new Float32Array(2 * width * height * 5);

  var lensFrustum = deviceInfo.getLeftEyeVisibleTanAngles();
  var noLensFrustum = deviceInfo.getLeftEyeNoLensTanAngles();
  var viewport = deviceInfo.getLeftEyeVisibleScreenRect(noLensFrustum);
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        var u = i / (width - 1);
        var v = j / (height - 1);

        // Grid points regularly spaced in StreoScreen, and barrel distorted in
        // the mesh.
        var s = u;
        var t = v;
        var x = Util.lerp(lensFrustum[0], lensFrustum[2], u);
        var y = Util.lerp(lensFrustum[3], lensFrustum[1], v);
        var d = Math.sqrt(x * x + y * y);
        var r = deviceInfo.distortion.distortInverse(d);
        var p = x * r / d;
        var q = y * r / d;
        u = (p - noLensFrustum[0]) / (noLensFrustum[2] - noLensFrustum[0]);
        v = (q - noLensFrustum[3]) / (noLensFrustum[1] - noLensFrustum[3]);

        // Convert u,v to mesh screen coordinates.
        var aspect = deviceInfo.device.widthMeters / deviceInfo.device.heightMeters;

        // FIXME: The original Unity plugin multiplied U by the aspect ratio
        // and didn't multiply either value by 2, but that seems to get it
        // really close to correct looking for me. I hate this kind of "Don't
        // know why it works" code though, and wold love a more logical
        // explanation of what needs to happen here.
        u = (viewport.x + u * viewport.width - 0.5) * 2.0; //* aspect;
        v = (viewport.y + v * viewport.height - 0.5) * 2.0;

        vertices[(vidx * 5) + 0] = u; // position.x
        vertices[(vidx * 5) + 1] = v; // position.y
        vertices[(vidx * 5) + 2] = s; // texCoord.x
        vertices[(vidx * 5) + 3] = t; // texCoord.y
        vertices[(vidx * 5) + 4] = e; // texCoord.z (viewport index)
      }
    }
    var w = lensFrustum[2] - lensFrustum[0];
    lensFrustum[0] = -(w + lensFrustum[0]);
    lensFrustum[2] = w - lensFrustum[2];
    w = noLensFrustum[2] - noLensFrustum[0];
    noLensFrustum[0] = -(w + noLensFrustum[0]);
    noLensFrustum[2] = w - noLensFrustum[2];
    viewport.x = 1 - (viewport.x + viewport.width);
  }
  return vertices;
}

/**
 * Build the distortion mesh indices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshIndices_ = function(width, height) {
  var indices = new Uint16Array(2 * (width - 1) * (height - 1) * 6);
  var halfwidth = width / 2;
  var halfheight = height / 2;
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        if (i == 0 || j == 0)
          continue;
        // Build a quad.  Lower right and upper left quadrants have quads with
        // the triangle diagonal flipped to get the vignette to interpolate
        // correctly.
        if ((i <= halfwidth) == (j <= halfheight)) {
          // Quad diagonal lower left to upper right.
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - 1;
        } else {
          // Quad diagonal upper left to lower right.
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width - 1;
        }
      }
    }
  }
  return indices;
};

CardboardDistorter.prototype.getOwnPropertyDescriptor_ = function(proto, attrName) {
  var descriptor = Object.getOwnPropertyDescriptor(proto, attrName);
  // In some cases (ahem... Safari), the descriptor returns undefined get and
  // set fields. In this case, we need to create a synthetic property
  // descriptor. This works around some of the issues in
  // https://github.com/borismus/webvr-polyfill/issues/46
  if (descriptor.get === undefined || descriptor.set === undefined) {
    descriptor.configurable = true;
    descriptor.enumerable = true;
    descriptor.get = function() {
      return this.getAttribute(attrName);
    };
    descriptor.set = function(val) {
      this.setAttribute(attrName, val);
    };
  }
  return descriptor;
};

module.exports = CardboardDistorter;

},{"./cardboard-ui.js":6,"./deps/wglu-preserve-state.js":8,"./util.js":24}],6:[function(require,module,exports){
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

var Util = require('./util.js');
var WGLUPreserveGLState = require('./deps/wglu-preserve-state.js');

var uiVS = [
  'attribute vec2 position;',

  'uniform mat4 projectionMat;',

  'void main() {',
  '  gl_Position = projectionMat * vec4( position, -1.0, 1.0 );',
  '}',
].join('\n');

var uiFS = [
  'precision mediump float;',

  'uniform vec4 color;',

  'void main() {',
  '  gl_FragColor = color;',
  '}',
].join('\n');

var DEG2RAD = Math.PI/180.0;

// The gear has 6 identical sections, each spanning 60 degrees.
var kAnglePerGearSection = 60;

// Half-angle of the span of the outer rim.
var kOuterRimEndAngle = 12;

// Angle between the middle of the outer rim and the start of the inner rim.
var kInnerRimBeginAngle = 20;

// Distance from center to outer rim, normalized so that the entire model
// fits in a [-1, 1] x [-1, 1] square.
var kOuterRadius = 1;

// Distance from center to depressed rim, in model units.
var kMiddleRadius = 0.75;

// Radius of the inner hollow circle, in model units.
var kInnerRadius = 0.3125;

// Center line thickness in DP.
var kCenterLineThicknessDp = 4;

// Button width in DP.
var kButtonWidthDp = 28;

// Factor to scale the touch area that responds to the touch.
var kTouchSlopFactor = 1.5;

var Angles = [
  0, kOuterRimEndAngle, kInnerRimBeginAngle,
  kAnglePerGearSection - kInnerRimBeginAngle,
  kAnglePerGearSection - kOuterRimEndAngle
];

/**
 * Renders the alignment line and "options" gear. It is assumed that the canvas
 * this is rendered into covers the entire screen (or close to it.)
 */
function CardboardUI(gl) {
  this.gl = gl;

  this.attribs = {
    position: 0
  };
  this.program = Util.linkProgram(gl, uiVS, uiFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.vertexBuffer = gl.createBuffer();
  this.gearOffset = 0;
  this.gearVertexCount = 0;
  this.arrowOffset = 0;
  this.arrowVertexCount = 0;

  this.projMat = new Float32Array(16);

  this.listener = null;

  this.onResize();
};

/**
 * Tears down all the resources created by the UI renderer.
 */
CardboardUI.prototype.destroy = function() {
  var gl = this.gl;

  if (this.listener) {
    gl.canvas.removeEventListener('click', this.listener, false);
  }

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
};

/**
 * Adds a listener to clicks on the gear and back icons
 */
CardboardUI.prototype.listen = function(optionsCallback, backCallback) {
  var canvas = this.gl.canvas;
  this.listener = function(event) {
    var midline = canvas.clientWidth / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor;
    // Check to see if the user clicked on (or around) the gear icon
    if (event.clientX > midline - buttonSize &&
        event.clientX < midline + buttonSize &&
        event.clientY > canvas.clientHeight - buttonSize) {
      optionsCallback(event);
    }
    // Check to see if the user clicked on (or around) the back icon
    else if (event.clientX < buttonSize && event.clientY < buttonSize) {
      backCallback(event);
    }
  };
  canvas.addEventListener('click', this.listener, false);
};

/**
 * Builds the UI mesh.
 */
CardboardUI.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = [];

    var midline = gl.drawingBufferWidth / 2;

    // The gl buffer size will likely be smaller than the physical pixel count.
    // So we need to scale the dps down based on the actual buffer size vs physical pixel count.
    // This will properly size the ui elements no matter what the gl buffer resolution is
    var physicalPixels = Math.max(screen.width, screen.height) * window.devicePixelRatio;
    var scalingRatio = gl.drawingBufferWidth / physicalPixels;
    var dps = scalingRatio *  window.devicePixelRatio;

    var lineWidth = kCenterLineThicknessDp * dps / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor * dps;
    var buttonScale = kButtonWidthDp * dps / 2;
    var buttonBorder = ((kButtonWidthDp * kTouchSlopFactor) - kButtonWidthDp) * dps;

    // Build centerline
    vertices.push(midline - lineWidth, buttonSize);
    vertices.push(midline - lineWidth, gl.drawingBufferHeight);
    vertices.push(midline + lineWidth, buttonSize);
    vertices.push(midline + lineWidth, gl.drawingBufferHeight);

    // Build gear
    self.gearOffset = (vertices.length / 2);

    function addGearSegment(theta, r) {
      var angle = (90 - theta) * DEG2RAD;
      var x = Math.cos(angle);
      var y = Math.sin(angle);
      vertices.push(kInnerRadius * x * buttonScale + midline, kInnerRadius * y * buttonScale + buttonScale);
      vertices.push(r * x * buttonScale + midline, r * y * buttonScale + buttonScale);
    }

    for (var i = 0; i <= 6; i++) {
      var segmentTheta = i * kAnglePerGearSection;

      addGearSegment(segmentTheta, kOuterRadius);
      addGearSegment(segmentTheta + kOuterRimEndAngle, kOuterRadius);
      addGearSegment(segmentTheta + kInnerRimBeginAngle, kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kInnerRimBeginAngle), kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kOuterRimEndAngle), kOuterRadius);
    }

    self.gearVertexCount = (vertices.length / 2) - self.gearOffset;

    // Build back arrow
    self.arrowOffset = (vertices.length / 2);

    function addArrowVertex(x, y) {
      vertices.push(buttonBorder + x, gl.drawingBufferHeight - buttonBorder - y);
    }

    var angledLineWidth = lineWidth / Math.sin(45 * DEG2RAD);

    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, 0);
    addArrowVertex(buttonScale + angledLineWidth, angledLineWidth);
    addArrowVertex(angledLineWidth, buttonScale + angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, buttonScale * 2);
    addArrowVertex(buttonScale + angledLineWidth, (buttonScale * 2) - angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);

    addArrowVertex(angledLineWidth, buttonScale - lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale - lineWidth);
    addArrowVertex(angledLineWidth, buttonScale + lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale + lineWidth);

    self.arrowVertexCount = (vertices.length / 2) - self.arrowOffset;

    // Buffer data
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  });
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardUI.prototype.render = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.CULL_FACE,
    gl.DEPTH_TEST,
    gl.BLEND,
    gl.SCISSOR_TEST,
    gl.STENCIL_TEST,
    gl.COLOR_WRITEMASK,
    gl.VIEWPORT,

    gl.CURRENT_PROGRAM,
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Make sure the GL state is in a good place
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    self.renderNoState();
  });
};

CardboardUI.prototype.renderNoState = function() {
  var gl = this.gl;

  // Bind distortion program and mesh
  gl.useProgram(this.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.enableVertexAttribArray(this.attribs.position);
  gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 8, 0);

  gl.uniform4f(this.uniforms.color, 1.0, 1.0, 1.0, 1.0);

  Util.orthoMatrix(this.projMat, 0, gl.drawingBufferWidth, 0, gl.drawingBufferHeight, 0.1, 1024.0);
  gl.uniformMatrix4fv(this.uniforms.projectionMat, false, this.projMat);

  // Draws UI element
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.gearOffset, this.gearVertexCount);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.arrowOffset, this.arrowVertexCount);
};

module.exports = CardboardUI;

},{"./deps/wglu-preserve-state.js":8,"./util.js":24}],7:[function(require,module,exports){
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

var CardboardDistorter = require('./cardboard-distorter.js');
var CardboardUI = require('./cardboard-ui.js');
var DeviceInfo = require('./device-info.js');
var Dpdb = require('./dpdb/dpdb.js');
var FusionPoseSensor = require('./sensor-fusion/fusion-pose-sensor.js');
var RotateInstructions = require('./rotate-instructions.js');
var ViewerSelector = require('./viewer-selector.js');
var VRDisplay = require('./base.js').VRDisplay;
var Util = require('./util.js');

var Eye = {
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * VRDisplay based on mobile device parameters and DeviceMotion APIs.
 */
function CardboardVRDisplay() {
  this.displayName = 'Cardboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;
  this.capabilities.canPresent = true;

  // "Private" members.
  this.bufferScale_ = window.WebVRConfig.BUFFER_SCALE;
  this.poseSensor_ = new FusionPoseSensor();
  this.distorter_ = null;
  this.cardboardUI_ = null;

  this.dpdb_ = new Dpdb(true, this.onDeviceParamsUpdated_.bind(this));
  this.deviceInfo_ = new DeviceInfo(this.dpdb_.getDeviceParams());

  this.viewerSelector_ = new ViewerSelector();
  this.viewerSelector_.onChange(this.onViewerChanged_.bind(this));

  // Set the correct initial viewer.
  this.deviceInfo_.setViewer(this.viewerSelector_.getCurrentViewer());

  if (!window.WebVRConfig.ROTATE_INSTRUCTIONS_DISABLED) {
    this.rotateInstructions_ = new RotateInstructions();
  }

  if (Util.isIOS()) {
    // Listen for resize events to workaround this awful Safari bug.
    window.addEventListener('resize', this.onResize_.bind(this));
  }
}
CardboardVRDisplay.prototype = new VRDisplay();

CardboardVRDisplay.prototype.getImmediatePose = function() {
  return {
    position: this.poseSensor_.getPosition(),
    orientation: this.poseSensor_.getOrientation(),
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

CardboardVRDisplay.prototype.resetPose = function() {
  this.poseSensor_.resetPose();
};

CardboardVRDisplay.prototype.getEyeParameters = function(whichEye) {
  var offset = [this.deviceInfo_.viewer.interLensDistance * 0.5, 0.0, 0.0];
  var fieldOfView;

  // TODO: FoV can be a little expensive to compute. Cache when device params change.
  if (whichEye == Eye.LEFT) {
    offset[0] *= -1.0;
    fieldOfView = this.deviceInfo_.getFieldOfViewLeftEye();
  } else if (whichEye == Eye.RIGHT) {
    fieldOfView = this.deviceInfo_.getFieldOfViewRightEye();
  } else {
    console.error('Invalid eye provided: %s', whichEye);
    return null;
  }

  return {
    fieldOfView: fieldOfView,
    offset: offset,
    // TODO: Should be able to provide better values than these.
    renderWidth: this.deviceInfo_.device.width * 0.5 * this.bufferScale_,
    renderHeight: this.deviceInfo_.device.height * this.bufferScale_,
  };
};

CardboardVRDisplay.prototype.onDeviceParamsUpdated_ = function(newParams) {
  if (Util.isDebug()) {
    console.log('DPDB reported that device params were updated.');
  }
  this.deviceInfo_.updateDeviceParams(newParams);

  if (this.distorter_) {
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
  }
};

CardboardVRDisplay.prototype.updateBounds_ = function () {
  if (this.layer_ && this.distorter_ && (this.layer_.leftBounds || this.layer_.rightBounds)) {
    this.distorter_.setTextureBounds(this.layer_.leftBounds, this.layer_.rightBounds);
  }
};

CardboardVRDisplay.prototype.beginPresent_ = function() {
  var gl = this.layer_.source.getContext('webgl');
  if (!gl)
    gl = this.layer_.source.getContext('experimental-webgl');
  if (!gl)
    gl = this.layer_.source.getContext('webgl2');

  if (!gl)
    return; // Can't do distortion without a WebGL context.

  // Provides a way to opt out of distortion
  if (this.layer_.predistorted) {
    if (!window.WebVRConfig.CARDBOARD_UI_DISABLED) {
      gl.canvas.width = Util.getScreenWidth() * this.bufferScale_;
      gl.canvas.height = Util.getScreenHeight() * this.bufferScale_;
      this.cardboardUI_ = new CardboardUI(gl);
    }
  } else {
    // Create a new distorter for the target context
    this.distorter_ = new CardboardDistorter(gl);
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
    this.cardboardUI_ = this.distorter_.cardboardUI;
  }

  if (this.cardboardUI_) {
    this.cardboardUI_.listen(function(e) {
      // Options clicked.
      this.viewerSelector_.show(this.layer_.source.parentElement);
      e.stopPropagation();
      e.preventDefault();
    }.bind(this), function(e) {
      // Back clicked.
      this.exitPresent();
      e.stopPropagation();
      e.preventDefault();
    }.bind(this));
  }

  if (this.rotateInstructions_) {
    if (Util.isLandscapeMode() && Util.isMobile()) {
      // In landscape mode, temporarily show the "put into Cardboard"
      // interstitial. Otherwise, do the default thing.
      this.rotateInstructions_.showTemporarily(3000, this.layer_.source.parentElement);
    } else {
      this.rotateInstructions_.update();
    }
  }

  // Listen for orientation change events in order to show interstitial.
  this.orientationHandler = this.onOrientationChange_.bind(this);
  window.addEventListener('orientationchange', this.orientationHandler);

  // Listen for present display change events in order to update distorter dimensions
  this.vrdisplaypresentchangeHandler = this.updateBounds_.bind(this);
  window.addEventListener('vrdisplaypresentchange', this.vrdisplaypresentchangeHandler);

  // Fire this event initially, to give geometry-distortion clients the chance
  // to do something custom.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.endPresent_ = function() {
  if (this.distorter_) {
    this.distorter_.destroy();
    this.distorter_ = null;
  }
  if (this.cardboardUI_) {
    this.cardboardUI_.destroy();
    this.cardboardUI_ = null;
  }

  if (this.rotateInstructions_) {
    this.rotateInstructions_.hide();
  }
  this.viewerSelector_.hide();

  window.removeEventListener('orientationchange', this.orientationHandler);
  window.removeEventListener('vrdisplaypresentchange', this.vrdisplaypresentchangeHandler);
};

CardboardVRDisplay.prototype.submitFrame = function(pose) {
  if (this.distorter_) {
    this.updateBounds_();
    this.distorter_.submitFrame();
  } else if (this.cardboardUI_ && this.layer_) {
    // Hack for predistorted: true.
    var canvas = this.layer_.source.getContext('webgl').canvas;
    if (canvas.width != this.lastWidth || canvas.height != this.lastHeight) {
      this.cardboardUI_.onResize();
    }
    this.lastWidth = canvas.width;
    this.lastHeight = canvas.height;

    // Render the Cardboard UI.
    this.cardboardUI_.render();
  }
};

CardboardVRDisplay.prototype.onOrientationChange_ = function(e) {
  // Hide the viewer selector.
  this.viewerSelector_.hide();

  // Update the rotate instructions.
  if (this.rotateInstructions_) {
    this.rotateInstructions_.update();
  }

  this.onResize_();
};

CardboardVRDisplay.prototype.onResize_ = function(e) {
  if (this.layer_) {
    var gl = this.layer_.source.getContext('webgl');
    // Size the CSS canvas.
    // Added padding on right and bottom because iPhone 5 will not
    // hide the URL bar unless content is bigger than the screen.
    // This will not be visible as long as the container element (e.g. body)
    // is set to 'overflow: hidden'.
    // Additionally, 'box-sizing: content-box' ensures renderWidth = width + padding.
    // This is required when 'box-sizing: border-box' is used elsewhere in the page.
    var cssProperties = [
      'position: absolute',
      'top: 0',
      'left: 0',
      'width: ' + Math.max(screen.width, screen.height) + 'px',
      'height: ' + Math.min(screen.height, screen.width) + 'px',
      'border: 0',
      'margin: 0',
      'padding: 0 10px 10px 0',
      'box-sizing: content-box',
    ];
    gl.canvas.setAttribute('style', cssProperties.join('; ') + ';');

    Util.safariCssSizeWorkaround(gl.canvas);
  }
};

CardboardVRDisplay.prototype.onViewerChanged_ = function(viewer) {
  this.deviceInfo_.setViewer(viewer);

  if (this.distorter_) {
    // Update the distortion appropriately.
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
  }

  // Fire a new event containing viewer and device parameters for clients that
  // want to implement their own geometry-based distortion.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.fireVRDisplayDeviceParamsChange_ = function() {
  var event = new CustomEvent('vrdisplaydeviceparamschange', {
    detail: {
      vrdisplay: this,
      deviceInfo: this.deviceInfo_,
    }
  });
  window.dispatchEvent(event);
};

module.exports = CardboardVRDisplay;

},{"./base.js":4,"./cardboard-distorter.js":5,"./cardboard-ui.js":6,"./device-info.js":9,"./dpdb/dpdb.js":13,"./rotate-instructions.js":18,"./sensor-fusion/fusion-pose-sensor.js":20,"./util.js":24,"./viewer-selector.js":25}],8:[function(require,module,exports){
/**
 * Copyright (c) 2016, Brandon Jones.
 * https://github.com/toji/webgl-utils/blob/master/src/wglu-preserve-state.js
 * LICENSE: https://github.com/toji/webgl-utils/blob/master/LICENSE.md
 */

function WGLUPreserveGLState(gl, bindings, callback) {
  if (!bindings) {
    callback(gl);
    return;
  }

  var boundValues = [];

  var activeTexture = null;
  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    switch (binding) {
      case gl.TEXTURE_BINDING_2D:
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31) {
          console.error("TEXTURE_BINDING_2D or TEXTURE_BINDING_CUBE_MAP must be followed by a valid texture unit");
          boundValues.push(null, null);
          break;
        }
        if (!activeTexture) {
          activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        }
        gl.activeTexture(textureUnit);
        boundValues.push(gl.getParameter(binding), null);
        break;
      case gl.ACTIVE_TEXTURE:
        activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        boundValues.push(null);
        break;
      default:
        boundValues.push(gl.getParameter(binding));
        break;
    }
  }

  callback(gl);

  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    var boundValue = boundValues[i];
    switch (binding) {
      case gl.ACTIVE_TEXTURE:
        break; // Ignore this binding, since we special-case it to happen last.
      case gl.ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ARRAY_BUFFER, boundValue);
        break;
      case gl.COLOR_CLEAR_VALUE:
        gl.clearColor(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.COLOR_WRITEMASK:
        gl.colorMask(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.CURRENT_PROGRAM:
        gl.useProgram(boundValue);
        break;
      case gl.ELEMENT_ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boundValue);
        break;
      case gl.FRAMEBUFFER_BINDING:
        gl.bindFramebuffer(gl.FRAMEBUFFER, boundValue);
        break;
      case gl.RENDERBUFFER_BINDING:
        gl.bindRenderbuffer(gl.RENDERBUFFER, boundValue);
        break;
      case gl.TEXTURE_BINDING_2D:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, boundValue);
        break;
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, boundValue);
        break;
      case gl.VIEWPORT:
        gl.viewport(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.BLEND:
      case gl.CULL_FACE:
      case gl.DEPTH_TEST:
      case gl.SCISSOR_TEST:
      case gl.STENCIL_TEST:
        if (boundValue) {
          gl.enable(binding);
        } else {
          gl.disable(binding);
        }
        break;
      default:
        console.log("No GL restore behavior for 0x" + binding.toString(16));
        break;
    }

    if (activeTexture) {
      gl.activeTexture(activeTexture);
    }
  }
}

module.exports = WGLUPreserveGLState;

},{}],9:[function(require,module,exports){
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

var Distortion = require('./distortion/distortion.js');
var MathUtil = require('./math-util.js');
var Util = require('./util.js');

function Device(params) {
  this.width = params.width || Util.getScreenWidth();
  this.height = params.height || Util.getScreenHeight();
  this.widthMeters = params.widthMeters;
  this.heightMeters = params.heightMeters;
  this.bevelMeters = params.bevelMeters;
}


// Fallback Android device (based on Nexus 5 measurements) for use when
// we can't recognize an Android device.
var DEFAULT_ANDROID = new Device({
  widthMeters: 0.110,
  heightMeters: 0.062,
  bevelMeters: 0.004
});

// Fallback iOS device (based on iPhone6) for use when
// we can't recognize an Android device.
var DEFAULT_IOS = new Device({
  widthMeters: 0.1038,
  heightMeters: 0.0584,
  bevelMeters: 0.004
});


var Viewers = {
  CardboardV1: new CardboardViewer({
    id: 'CardboardV1',
    label: 'Cardboard I/O 2014',
    fov: 40,
    interLensDistance: 0.060,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.042,
    distortionCoefficients: [0.441, 0.156],
    inverseCoefficients: [-0.4410035, 0.42756155, -0.4804439, 0.5460139,
      -0.58821183, 0.5733938, -0.48303202, 0.33299083, -0.17573841,
      0.0651772, -0.01488963, 0.001559834]
  }),
  CardboardV2: new CardboardViewer({
    id: 'CardboardV2',
    label: 'Cardboard I/O 2015',
    fov: 60,
    interLensDistance: 0.064,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.039,
    distortionCoefficients: [0.34, 0.55],
    inverseCoefficients: [-0.33836704, -0.18162185, 0.862655, -1.2462051,
      1.0560602, -0.58208317, 0.21609078, -0.05444823, 0.009177956,
      -9.904169E-4, 6.183535E-5, -1.6981803E-6]
  })
};


var DEFAULT_LEFT_CENTER = {x: 0.5, y: 0.5};
var DEFAULT_RIGHT_CENTER = {x: 0.5, y: 0.5};

/**
 * Manages information about the device and the viewer.
 *
 * deviceParams indicates the parameters of the device to use (generally
 * obtained from dpdb.getDeviceParams()). Can be null to mean no device
 * params were found.
 */
function DeviceInfo(deviceParams) {
  this.viewer = Viewers.CardboardV2;
  this.updateDeviceParams(deviceParams);
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
}

DeviceInfo.prototype.updateDeviceParams = function(deviceParams) {
  this.device = this.determineDevice_(deviceParams) || this.device;
};

DeviceInfo.prototype.getDevice = function() {
  return this.device;
};

DeviceInfo.prototype.setViewer = function(viewer) {
  this.viewer = viewer;
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
};

DeviceInfo.prototype.determineDevice_ = function(deviceParams) {
  if (!deviceParams) {
    // No parameters, so use a default.
    if (Util.isIOS()) {
      console.warn('Using fallback iOS device measurements.');
      return DEFAULT_IOS;
    } else {
      console.warn('Using fallback Android device measurements.');
      return DEFAULT_ANDROID;
    }
  }

  // Compute device screen dimensions based on deviceParams.
  var METERS_PER_INCH = 0.0254;
  var metersPerPixelX = METERS_PER_INCH / deviceParams.xdpi;
  var metersPerPixelY = METERS_PER_INCH / deviceParams.ydpi;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();
  return new Device({
    widthMeters: metersPerPixelX * width,
    heightMeters: metersPerPixelY * height,
    bevelMeters: deviceParams.bevelMm * 0.001,
  });
};

/**
 * Calculates field of view for the left eye.
 */
DeviceInfo.prototype.getDistortedFieldOfViewLeftEye = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Device.height and device.width for device in portrait mode, so transpose.
  var eyeToScreenDistance = viewer.screenLensDistance;

  var outerDist = (device.widthMeters - viewer.interLensDistance) / 2;
  var innerDist = viewer.interLensDistance / 2;
  var bottomDist = viewer.baselineLensDistance - device.bevelMeters;
  var topDist = device.heightMeters - bottomDist;

  var outerAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(outerDist / eyeToScreenDistance));
  var innerAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(innerDist / eyeToScreenDistance));
  var bottomAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(bottomDist / eyeToScreenDistance));
  var topAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(topDist / eyeToScreenDistance));

  return {
    leftDegrees: Math.min(outerAngle, viewer.fov),
    rightDegrees: Math.min(innerAngle, viewer.fov),
    downDegrees: Math.min(bottomAngle, viewer.fov),
    upDegrees: Math.min(topAngle, viewer.fov)
  };
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Tan-angles from the max FOV.
  var fovLeft = Math.tan(-MathUtil.degToRad * viewer.fov);
  var fovTop = Math.tan(MathUtil.degToRad * viewer.fov);
  var fovRight = Math.tan(MathUtil.degToRad * viewer.fov);
  var fovBottom = Math.tan(-MathUtil.degToRad * viewer.fov);
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = distortion.distort((centerX - halfWidth) / centerZ);
  var screenTop = distortion.distort((centerY + halfHeight) / centerZ);
  var screenRight = distortion.distort((centerX + halfWidth) / centerZ);
  var screenBottom = distortion.distort((centerY - halfHeight) / centerZ);
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  var result = new Float32Array(4);
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters, assuming no lenses.
 */
DeviceInfo.prototype.getLeftEyeNoLensTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  var result = new Float32Array(4);
  // Tan-angles from the max FOV.
  var fovLeft = distortion.distortInverse(Math.tan(-MathUtil.degToRad * viewer.fov));
  var fovTop = distortion.distortInverse(Math.tan(MathUtil.degToRad * viewer.fov));
  var fovRight = distortion.distortInverse(Math.tan(MathUtil.degToRad * viewer.fov));
  var fovBottom = distortion.distortInverse(Math.tan(-MathUtil.degToRad * viewer.fov));
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = (centerX - halfWidth) / centerZ;
  var screenTop = (centerY + halfHeight) / centerZ;
  var screenRight = (centerX + halfWidth) / centerZ;
  var screenBottom = (centerY - halfHeight) / centerZ;
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the screen rectangle visible from the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleScreenRect = function(undistortedFrustum) {
  var viewer = this.viewer;
  var device = this.device;

  var dist = viewer.screenLensDistance;
  var eyeX = (device.widthMeters - viewer.interLensDistance) / 2;
  var eyeY = viewer.baselineLensDistance - device.bevelMeters;
  var left = (undistortedFrustum[0] * dist + eyeX) / device.widthMeters;
  var top = (undistortedFrustum[1] * dist + eyeY) / device.heightMeters;
  var right = (undistortedFrustum[2] * dist + eyeX) / device.widthMeters;
  var bottom = (undistortedFrustum[3] * dist + eyeY) / device.heightMeters;
  return {
    x: left,
    y: bottom,
    width: right - left,
    height: top - bottom
  };
};

DeviceInfo.prototype.getFieldOfViewLeftEye = function(opt_isUndistorted) {
  return opt_isUndistorted ? this.getUndistortedFieldOfViewLeftEye() :
      this.getDistortedFieldOfViewLeftEye();
};

DeviceInfo.prototype.getFieldOfViewRightEye = function(opt_isUndistorted) {
  var fov = this.getFieldOfViewLeftEye(opt_isUndistorted);
  return {
    leftDegrees: fov.rightDegrees,
    rightDegrees: fov.leftDegrees,
    upDegrees: fov.upDegrees,
    downDegrees: fov.downDegrees
  };
};

/**
 * Calculates undistorted field of view for the left eye.
 */
DeviceInfo.prototype.getUndistortedFieldOfViewLeftEye = function() {
  var p = this.getUndistortedParams_();

  return {
    leftDegrees: MathUtil.radToDeg * Math.atan(p.outerDist),
    rightDegrees: MathUtil.radToDeg * Math.atan(p.innerDist),
    downDegrees: MathUtil.radToDeg * Math.atan(p.bottomDist),
    upDegrees: MathUtil.radToDeg * Math.atan(p.topDist)
  };
};

DeviceInfo.prototype.getUndistortedViewportLeftEye = function() {
  var p = this.getUndistortedParams_();
  var viewer = this.viewer;
  var device = this.device;

  // Distances stored in local variables are in tan-angle units unless otherwise
  // noted.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;
  var xPxPerTanAngle = device.width / screenWidth;
  var yPxPerTanAngle = device.height / screenHeight;

  var x = Math.round((p.eyePosX - p.outerDist) * xPxPerTanAngle);
  var y = Math.round((p.eyePosY - p.bottomDist) * yPxPerTanAngle);
  return {
    x: x,
    y: y,
    width: Math.round((p.eyePosX + p.innerDist) * xPxPerTanAngle) - x,
    height: Math.round((p.eyePosY + p.topDist) * yPxPerTanAngle) - y
  };
};

DeviceInfo.prototype.getUndistortedParams_ = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Most of these variables in tan-angle units.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var halfLensDistance = viewer.interLensDistance / 2 / eyeToScreenDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;

  var eyePosX = screenWidth / 2 - halfLensDistance;
  var eyePosY = (viewer.baselineLensDistance - device.bevelMeters) / eyeToScreenDistance;

  var maxFov = viewer.fov;
  var viewerMax = distortion.distortInverse(Math.tan(MathUtil.degToRad * maxFov));
  var outerDist = Math.min(eyePosX, viewerMax);
  var innerDist = Math.min(halfLensDistance, viewerMax);
  var bottomDist = Math.min(eyePosY, viewerMax);
  var topDist = Math.min(screenHeight - eyePosY, viewerMax);

  return {
    outerDist: outerDist,
    innerDist: innerDist,
    topDist: topDist,
    bottomDist: bottomDist,
    eyePosX: eyePosX,
    eyePosY: eyePosY
  };
};


function CardboardViewer(params) {
  // A machine readable ID.
  this.id = params.id;
  // A human readable label.
  this.label = params.label;

  // Field of view in degrees (per side).
  this.fov = params.fov;

  // Distance between lens centers in meters.
  this.interLensDistance = params.interLensDistance;
  // Distance between viewer baseline and lens center in meters.
  this.baselineLensDistance = params.baselineLensDistance;
  // Screen-to-lens distance in meters.
  this.screenLensDistance = params.screenLensDistance;

  // Distortion coefficients.
  this.distortionCoefficients = params.distortionCoefficients;
  // Inverse distortion coefficients.
  // TODO: Calculate these from distortionCoefficients in the future.
  this.inverseCoefficients = params.inverseCoefficients;
}

// Export viewer information.
DeviceInfo.Viewers = Viewers;
module.exports = DeviceInfo;

},{"./distortion/distortion.js":11,"./math-util.js":15,"./util.js":24}],10:[function(require,module,exports){
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
var VRDisplay = require('./base.js').VRDisplay;
var HMDVRDevice = require('./base.js').HMDVRDevice;
var PositionSensorVRDevice = require('./base.js').PositionSensorVRDevice;

/**
 * Wraps a VRDisplay and exposes it as a HMDVRDevice
 */
function VRDisplayHMDDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-polyfill:HMD:' + display.displayId;
  this.deviceName = display.displayName + ' (HMD)';
}
VRDisplayHMDDevice.prototype = new HMDVRDevice();

VRDisplayHMDDevice.prototype.getEyeParameters = function(whichEye) {
  var eyeParameters = this.display.getEyeParameters(whichEye);

  return {
    currentFieldOfView: eyeParameters.fieldOfView,
    maximumFieldOfView: eyeParameters.fieldOfView,
    minimumFieldOfView: eyeParameters.fieldOfView,
    recommendedFieldOfView: eyeParameters.fieldOfView,
    eyeTranslation: { x: eyeParameters.offset[0], y: eyeParameters.offset[1], z: eyeParameters.offset[2] },
    renderRect: {
      x: (whichEye == 'right') ? eyeParameters.renderWidth : 0,
      y: 0,
      width: eyeParameters.renderWidth,
      height: eyeParameters.renderHeight
    }
  };
};

VRDisplayHMDDevice.prototype.setFieldOfView =
    function(opt_fovLeft, opt_fovRight, opt_zNear, opt_zFar) {
  // Not supported. getEyeParameters reports that the min, max, and recommended
  // FoV is all the same, so no adjustment can be made.
};

// TODO: Need to hook requestFullscreen to see if a wrapped VRDisplay was passed
// in as an option. If so we should prevent the default fullscreen behavior and
// call VRDisplay.requestPresent instead.

/**
 * Wraps a VRDisplay and exposes it as a PositionSensorVRDevice
 */
function VRDisplayPositionSensorDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-polyfill:PositionSensor: ' + display.displayId;
  this.deviceName = display.displayName + ' (PositionSensor)';
}
VRDisplayPositionSensorDevice.prototype = new PositionSensorVRDevice();

VRDisplayPositionSensorDevice.prototype.getState = function() {
  var pose = this.display.getPose();
  return {
    position: pose.position ? { x: pose.position[0], y: pose.position[1], z: pose.position[2] } : null,
    orientation: pose.orientation ? { x: pose.orientation[0], y: pose.orientation[1], z: pose.orientation[2], w: pose.orientation[3] } : null,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

VRDisplayPositionSensorDevice.prototype.resetState = function() {
  return this.positionDevice.resetPose();
};


module.exports.VRDisplayHMDDevice = VRDisplayHMDDevice;
module.exports.VRDisplayPositionSensorDevice = VRDisplayPositionSensorDevice;


},{"./base.js":4}],11:[function(require,module,exports){
/**
 * TODO(smus): Implement coefficient inversion.
 */
function Distortion(coefficients) {
  this.coefficients = coefficients;
}

/**
 * Calculates the inverse distortion for a radius.
 * </p><p>
 * Allows to compute the original undistorted radius from a distorted one.
 * See also getApproximateInverseDistortion() for a faster but potentially
 * less accurate method.
 *
 * @param {Number} radius Distorted radius from the lens center in tan-angle units.
 * @return {Number} The undistorted radius in tan-angle units.
 */
Distortion.prototype.distortInverse = function(radius) {
  // Secant method.
  var r0 = 0;
  var r1 = 1;
  var dr0 = radius - this.distort(r0);
  while (Math.abs(r1 - r0) > 0.0001 /** 0.1mm */) {
    var dr1 = radius - this.distort(r1);
    var r2 = r1 - dr1 * ((r1 - r0) / (dr1 - dr0));
    r0 = r1;
    r1 = r2;
    dr0 = dr1;
  }
  return r1;
};

/**
 * Distorts a radius by its distortion factor from the center of the lenses.
 *
 * @param {Number} radius Radius from the lens center in tan-angle units.
 * @return {Number} The distorted radius in tan-angle units.
 */
Distortion.prototype.distort = function(radius) {
  var r2 = radius * radius;
  var ret = 0;
  for (var i = 0; i < this.coefficients.length; i++) {
    ret = r2 * (ret + this.coefficients[i]);
  }
  return (ret + 1) * radius;
};

module.exports = Distortion;

},{}],12:[function(require,module,exports){
module.exports={
  "format": 1,
  "last_updated": "2017-06-01T22:33:42Z",
  "devices": [
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "asus/*/Nexus 7/*"
        },
        {
          "ua": "Nexus 7"
        }
      ],
      "dpi": [
        320.8,
        323
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "asus/*/ASUS_Z00AD/*"
        },
        {
          "ua": "ASUS_Z00AD"
        }
      ],
      "dpi": [
        403,
        404.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Google/*/Pixel XL/*"
        },
        {
          "ua": "Pixel XL"
        }
      ],
      "dpi": [
        537.9,
        533
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Google/*/Pixel/*"
        },
        {
          "ua": "Pixel"
        }
      ],
      "dpi": [
        432.6,
        436.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "HTC/*/HTC6435LVW/*"
        },
        {
          "ua": "HTC6435LVW"
        }
      ],
      "dpi": [
        449.7,
        443.3
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "HTC/*/HTC One XL/*"
        },
        {
          "ua": "HTC One XL"
        }
      ],
      "dpi": [
        315.3,
        314.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "htc/*/Nexus 9/*"
        },
        {
          "ua": "Nexus 9"
        }
      ],
      "dpi": 289,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "HTC/*/HTC One M9/*"
        },
        {
          "ua": "HTC One M9"
        }
      ],
      "dpi": [
        442.5,
        443.3
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "HTC/*/HTC One_M8/*"
        },
        {
          "ua": "HTC One_M8"
        }
      ],
      "dpi": [
        449.7,
        447.4
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "HTC/*/HTC One/*"
        },
        {
          "ua": "HTC One"
        }
      ],
      "dpi": 472.8,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Huawei/*/Nexus 6P/*"
        },
        {
          "ua": "Nexus 6P"
        }
      ],
      "dpi": [
        515.1,
        518
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/Nexus 5X/*"
        },
        {
          "ua": "Nexus 5X"
        }
      ],
      "dpi": [
        422,
        419.9
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LGMS345/*"
        },
        {
          "ua": "LGMS345"
        }
      ],
      "dpi": [
        221.7,
        219.1
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LG-D800/*"
        },
        {
          "ua": "LG-D800"
        }
      ],
      "dpi": [
        422,
        424.1
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LG-D850/*"
        },
        {
          "ua": "LG-D850"
        }
      ],
      "dpi": [
        537.9,
        541.9
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/VS985 4G/*"
        },
        {
          "ua": "VS985 4G"
        }
      ],
      "dpi": [
        537.9,
        535.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/Nexus 5/*"
        },
        {
          "ua": "Nexus 5 B"
        }
      ],
      "dpi": [
        442.4,
        444.8
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/Nexus 4/*"
        },
        {
          "ua": "Nexus 4"
        }
      ],
      "dpi": [
        319.8,
        318.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LG-P769/*"
        },
        {
          "ua": "LG-P769"
        }
      ],
      "dpi": [
        240.6,
        247.5
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LGMS323/*"
        },
        {
          "ua": "LGMS323"
        }
      ],
      "dpi": [
        206.6,
        204.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LGLS996/*"
        },
        {
          "ua": "LGLS996"
        }
      ],
      "dpi": [
        403.4,
        401.5
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Micromax/*/4560MMX/*"
        },
        {
          "ua": "4560MMX"
        }
      ],
      "dpi": [
        240,
        219.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Micromax/*/A250/*"
        },
        {
          "ua": "Micromax A250"
        }
      ],
      "dpi": [
        480,
        446.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Micromax/*/Micromax AQ4501/*"
        },
        {
          "ua": "Micromax AQ4501"
        }
      ],
      "dpi": 240,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/DROID RAZR/*"
        },
        {
          "ua": "DROID RAZR"
        }
      ],
      "dpi": [
        368.1,
        256.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT830C/*"
        },
        {
          "ua": "XT830C"
        }
      ],
      "dpi": [
        254,
        255.9
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1021/*"
        },
        {
          "ua": "XT1021"
        }
      ],
      "dpi": [
        254,
        256.7
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1023/*"
        },
        {
          "ua": "XT1023"
        }
      ],
      "dpi": [
        254,
        256.7
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1028/*"
        },
        {
          "ua": "XT1028"
        }
      ],
      "dpi": [
        326.6,
        327.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1034/*"
        },
        {
          "ua": "XT1034"
        }
      ],
      "dpi": [
        326.6,
        328.4
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1053/*"
        },
        {
          "ua": "XT1053"
        }
      ],
      "dpi": [
        315.3,
        316.1
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1562/*"
        },
        {
          "ua": "XT1562"
        }
      ],
      "dpi": [
        403.4,
        402.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/Nexus 6/*"
        },
        {
          "ua": "Nexus 6 B"
        }
      ],
      "dpi": [
        494.3,
        489.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1063/*"
        },
        {
          "ua": "XT1063"
        }
      ],
      "dpi": [
        295,
        296.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1064/*"
        },
        {
          "ua": "XT1064"
        }
      ],
      "dpi": [
        295,
        295.6
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1092/*"
        },
        {
          "ua": "XT1092"
        }
      ],
      "dpi": [
        422,
        424.1
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1095/*"
        },
        {
          "ua": "XT1095"
        }
      ],
      "dpi": [
        422,
        423.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/G4/*"
        },
        {
          "ua": "Moto G (4)"
        }
      ],
      "dpi": 401,
      "bw": 4,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "OnePlus/*/A0001/*"
        },
        {
          "ua": "A0001"
        }
      ],
      "dpi": [
        403.4,
        401
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "OnePlus/*/ONE E1005/*"
        },
        {
          "ua": "ONE E1005"
        }
      ],
      "dpi": [
        442.4,
        441.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "OnePlus/*/ONE A2005/*"
        },
        {
          "ua": "ONE A2005"
        }
      ],
      "dpi": [
        391.9,
        405.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "OPPO/*/X909/*"
        },
        {
          "ua": "X909"
        }
      ],
      "dpi": [
        442.4,
        444.1
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9082/*"
        },
        {
          "ua": "GT-I9082"
        }
      ],
      "dpi": [
        184.7,
        185.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G360P/*"
        },
        {
          "ua": "SM-G360P"
        }
      ],
      "dpi": [
        196.7,
        205.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/Nexus S/*"
        },
        {
          "ua": "Nexus S"
        }
      ],
      "dpi": [
        234.5,
        229.8
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9300/*"
        },
        {
          "ua": "GT-I9300"
        }
      ],
      "dpi": [
        304.8,
        303.9
      ],
      "bw": 5,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-T230NU/*"
        },
        {
          "ua": "SM-T230NU"
        }
      ],
      "dpi": 216,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SGH-T399/*"
        },
        {
          "ua": "SGH-T399"
        }
      ],
      "dpi": [
        217.7,
        231.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SGH-M919/*"
        },
        {
          "ua": "SGH-M919"
        }
      ],
      "dpi": [
        440.8,
        437.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-N9005/*"
        },
        {
          "ua": "SM-N9005"
        }
      ],
      "dpi": [
        386.4,
        387
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SAMSUNG-SM-N900A/*"
        },
        {
          "ua": "SAMSUNG-SM-N900A"
        }
      ],
      "dpi": [
        386.4,
        387.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9500/*"
        },
        {
          "ua": "GT-I9500"
        }
      ],
      "dpi": [
        442.5,
        443.3
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9505/*"
        },
        {
          "ua": "GT-I9505"
        }
      ],
      "dpi": 439.4,
      "bw": 4,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G900F/*"
        },
        {
          "ua": "SM-G900F"
        }
      ],
      "dpi": [
        415.6,
        431.6
      ],
      "bw": 5,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G900M/*"
        },
        {
          "ua": "SM-G900M"
        }
      ],
      "dpi": [
        415.6,
        431.6
      ],
      "bw": 5,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G800F/*"
        },
        {
          "ua": "SM-G800F"
        }
      ],
      "dpi": 326.8,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G906S/*"
        },
        {
          "ua": "SM-G906S"
        }
      ],
      "dpi": [
        562.7,
        572.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9300/*"
        },
        {
          "ua": "GT-I9300"
        }
      ],
      "dpi": [
        306.7,
        304.8
      ],
      "bw": 5,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-T535/*"
        },
        {
          "ua": "SM-T535"
        }
      ],
      "dpi": [
        142.6,
        136.4
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-N920C/*"
        },
        {
          "ua": "SM-N920C"
        }
      ],
      "dpi": [
        515.1,
        518.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-N920W8/*"
        },
        {
          "ua": "SM-N920W8"
        }
      ],
      "dpi": [
        515.1,
        518.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9300I/*"
        },
        {
          "ua": "GT-I9300I"
        }
      ],
      "dpi": [
        304.8,
        305.8
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9195/*"
        },
        {
          "ua": "GT-I9195"
        }
      ],
      "dpi": [
        249.4,
        256.7
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SPH-L520/*"
        },
        {
          "ua": "SPH-L520"
        }
      ],
      "dpi": [
        249.4,
        255.9
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SAMSUNG-SGH-I717/*"
        },
        {
          "ua": "SAMSUNG-SGH-I717"
        }
      ],
      "dpi": 285.8,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SPH-D710/*"
        },
        {
          "ua": "SPH-D710"
        }
      ],
      "dpi": [
        217.7,
        204.2
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-N7100/*"
        },
        {
          "ua": "GT-N7100"
        }
      ],
      "dpi": 265.1,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SCH-I605/*"
        },
        {
          "ua": "SCH-I605"
        }
      ],
      "dpi": 265.1,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/Galaxy Nexus/*"
        },
        {
          "ua": "Galaxy Nexus"
        }
      ],
      "dpi": [
        315.3,
        314.2
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-N910H/*"
        },
        {
          "ua": "SM-N910H"
        }
      ],
      "dpi": [
        515.1,
        518
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-N910C/*"
        },
        {
          "ua": "SM-N910C"
        }
      ],
      "dpi": [
        515.2,
        520.2
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G130M/*"
        },
        {
          "ua": "SM-G130M"
        }
      ],
      "dpi": [
        165.9,
        164.8
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G928I/*"
        },
        {
          "ua": "SM-G928I"
        }
      ],
      "dpi": [
        515.1,
        518.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G920F/*"
        },
        {
          "ua": "SM-G920F"
        }
      ],
      "dpi": 580.6,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G920P/*"
        },
        {
          "ua": "SM-G920P"
        }
      ],
      "dpi": [
        522.5,
        577
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G925F/*"
        },
        {
          "ua": "SM-G925F"
        }
      ],
      "dpi": 580.6,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G925V/*"
        },
        {
          "ua": "SM-G925V"
        }
      ],
      "dpi": [
        522.5,
        576.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G930F/*"
        },
        {
          "ua": "SM-G930F"
        }
      ],
      "dpi": 576.6,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G935F/*"
        },
        {
          "ua": "SM-G935F"
        }
      ],
      "dpi": 533,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Sony/*/C6903/*"
        },
        {
          "ua": "C6903"
        }
      ],
      "dpi": [
        442.5,
        443.3
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Sony/*/D6653/*"
        },
        {
          "ua": "D6653"
        }
      ],
      "dpi": [
        428.6,
        427.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Sony/*/E6653/*"
        },
        {
          "ua": "E6653"
        }
      ],
      "dpi": [
        428.6,
        425.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Sony/*/E6853/*"
        },
        {
          "ua": "E6853"
        }
      ],
      "dpi": [
        403.4,
        401.9
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Sony/*/SGP321/*"
        },
        {
          "ua": "SGP321"
        }
      ],
      "dpi": [
        224.7,
        224.1
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "TCT/*/ALCATEL ONE TOUCH Fierce/*"
        },
        {
          "ua": "ALCATEL ONE TOUCH Fierce"
        }
      ],
      "dpi": [
        240,
        247.5
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "THL/*/thl 5000/*"
        },
        {
          "ua": "thl 5000"
        }
      ],
      "dpi": [
        480,
        443.3
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "ZTE/*/ZTE Blade L2/*"
        },
        {
          "ua": "ZTE Blade L2"
        }
      ],
      "dpi": 240,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "ios",
      "rules": [
        {
          "res": [
            640,
            960
          ]
        }
      ],
      "dpi": [
        325.1,
        328.4
      ],
      "bw": 4,
      "ac": 1000
    },
    {
      "type": "ios",
      "rules": [
        {
          "res": [
            640,
            1136
          ]
        }
      ],
      "dpi": [
        317.1,
        320.2
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "ios",
      "rules": [
        {
          "res": [
            750,
            1334
          ]
        }
      ],
      "dpi": 326.4,
      "bw": 4,
      "ac": 1000
    },
    {
      "type": "ios",
      "rules": [
        {
          "res": [
            1242,
            2208
          ]
        }
      ],
      "dpi": [
        453.6,
        458.4
      ],
      "bw": 4,
      "ac": 1000
    },
    {
      "type": "ios",
      "rules": [
        {
          "res": [
            1125,
            2001
          ]
        }
      ],
      "dpi": [
        410.9,
        415.4
      ],
      "bw": 4,
      "ac": 1000
    }
  ]
}
},{}],13:[function(require,module,exports){
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

// Offline cache of the DPDB, to be used until we load the online one (and
// as a fallback in case we can't load the online one).
var DPDB_CACHE = require('./dpdb.json');
var Util = require('../util.js');

// Online DPDB URL.
var ONLINE_DPDB_URL =
  'https://dpdb.webvr.rocks/dpdb.json';

/**
 * Calculates device parameters based on the DPDB (Device Parameter Database).
 * Initially, uses the cached DPDB values.
 *
 * If fetchOnline == true, then this object tries to fetch the online version
 * of the DPDB and updates the device info if a better match is found.
 * Calls the onDeviceParamsUpdated callback when there is an update to the
 * device information.
 */
function Dpdb(fetchOnline, onDeviceParamsUpdated) {
  // Start with the offline DPDB cache while we are loading the real one.
  this.dpdb = DPDB_CACHE;

  // Calculate device params based on the offline version of the DPDB.
  this.recalculateDeviceParams_();

  // XHR to fetch online DPDB file, if requested.
  if (fetchOnline) {
    // Set the callback.
    this.onDeviceParamsUpdated = onDeviceParamsUpdated;

    var xhr = new XMLHttpRequest();
    var obj = this;
    xhr.open('GET', ONLINE_DPDB_URL, true);
    xhr.addEventListener('load', function() {
      obj.loading = false;
      if (xhr.status >= 200 && xhr.status <= 299) {
        // Success.
        obj.dpdb = JSON.parse(xhr.response);
        obj.recalculateDeviceParams_();
      } else {
        // Error loading the DPDB.
        console.error('Error loading online DPDB!');
      }
    });
    xhr.send();
  }
}

// Returns the current device parameters.
Dpdb.prototype.getDeviceParams = function() {
  return this.deviceParams;
};

// Recalculates this device's parameters based on the DPDB.
Dpdb.prototype.recalculateDeviceParams_ = function() {
  var newDeviceParams = this.calcDeviceParams_();
  if (newDeviceParams) {
    this.deviceParams = newDeviceParams;
    // Invoke callback, if it is set.
    if (this.onDeviceParamsUpdated) {
      this.onDeviceParamsUpdated(this.deviceParams);
    }
  } else {
    console.error('Failed to recalculate device parameters.');
  }
};

// Returns a DeviceParams object that represents the best guess as to this
// device's parameters. Can return null if the device does not match any
// known devices.
Dpdb.prototype.calcDeviceParams_ = function() {
  var db = this.dpdb; // shorthand
  if (!db) {
    console.error('DPDB not available.');
    return null;
  }
  if (db.format != 1) {
    console.error('DPDB has unexpected format version.');
    return null;
  }
  if (!db.devices || !db.devices.length) {
    console.error('DPDB does not have a devices section.');
    return null;
  }

  // Get the actual user agent and screen dimensions in pixels.
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();

  if (!db.devices) {
    console.error('DPDB has no devices section.');
    return null;
  }

  for (var i = 0; i < db.devices.length; i++) {
    var device = db.devices[i];
    if (!device.rules) {
      console.warn('Device[' + i + '] has no rules section.');
      continue;
    }

    if (device.type != 'ios' && device.type != 'android') {
      console.warn('Device[' + i + '] has invalid type.');
      continue;
    }

    // See if this device is of the appropriate type.
    if (Util.isIOS() != (device.type == 'ios')) continue;

    // See if this device matches any of the rules:
    var matched = false;
    for (var j = 0; j < device.rules.length; j++) {
      var rule = device.rules[j];
      if (this.matchRule_(rule, userAgent, width, height)) {
        matched = true;
        break;
      }
    }
    if (!matched) continue;

    // device.dpi might be an array of [ xdpi, ydpi] or just a scalar.
    var xdpi = device.dpi[0] || device.dpi;
    var ydpi = device.dpi[1] || device.dpi;

    return new DeviceParams({ xdpi: xdpi, ydpi: ydpi, bevelMm: device.bw });
  }

  console.warn('No DPDB device match.');
  return null;
};

Dpdb.prototype.matchRule_ = function(rule, ua, screenWidth, screenHeight) {
  // We can only match 'ua' and 'res' rules, not other types like 'mdmh'
  // (which are meant for native platforms).
  if (!rule.ua && !rule.res) return false;

  // If our user agent string doesn't contain the indicated user agent string,
  // the match fails.
  if (rule.ua && ua.indexOf(rule.ua) < 0) return false;

  // If the rule specifies screen dimensions that don't correspond to ours,
  // the match fails.
  if (rule.res) {
    if (!rule.res[0] || !rule.res[1]) return false;
    var resX = rule.res[0];
    var resY = rule.res[1];
    // Compare min and max so as to make the order not matter, i.e., it should
    // be true that 640x480 == 480x640.
    if (Math.min(screenWidth, screenHeight) != Math.min(resX, resY) ||
        (Math.max(screenWidth, screenHeight) != Math.max(resX, resY))) {
      return false;
    }
  }

  return true;
}

function DeviceParams(params) {
  this.xdpi = params.xdpi;
  this.ydpi = params.ydpi;
  this.bevelMm = params.bevelMm;
}

module.exports = Dpdb;

},{"../util.js":24,"./dpdb.json":12}],14:[function(require,module,exports){
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
var Util = require('./util.js');
var WebVRPolyfill = require('./webvr-polyfill.js').WebVRPolyfill;

// Initialize a WebVRConfig just in case.
window.WebVRConfig = Util.extend({
  // Forces availability of VR mode, even for non-mobile devices.
  FORCE_ENABLE_VR: false,

  // Complementary filter coefficient. 0 for accelerometer, 1 for gyro.
  K_FILTER: 0.98,

  // How far into the future to predict during fast motion (in seconds).
  PREDICTION_TIME_S: 0.040,

  // Flag to enable touch panner. In case you have your own touch controls.
  TOUCH_PANNER_DISABLED: true,

  // Flag to disabled the UI in VR Mode.
  CARDBOARD_UI_DISABLED: false, // Default: false

  // Flag to disable the instructions to rotate your device.
  ROTATE_INSTRUCTIONS_DISABLED: false, // Default: false.

  // Enable yaw panning only, disabling roll and pitch. This can be useful
  // for panoramas with nothing interesting above or below.
  YAW_ONLY: false,

  // To disable keyboard and mouse controls, if you want to use your own
  // implementation.
  MOUSE_KEYBOARD_CONTROLS_DISABLED: false,

  // Prevent the polyfill from initializing immediately. Requires the app
  // to call InitializeWebVRPolyfill() before it can be used.
  DEFER_INITIALIZATION: false,

  // Enable the deprecated version of the API (navigator.getVRDevices).
  ENABLE_DEPRECATED_API: false,

  // Scales the recommended buffer size reported by WebVR, which can improve
  // performance.
  // UPDATE(2016-05-03): Setting this to 0.5 by default since 1.0 does not
  // perform well on many mobile devices.
  BUFFER_SCALE: 0.5,

  // Allow VRDisplay.submitFrame to change gl bindings, which is more
  // efficient if the application code will re-bind its resources on the
  // next frame anyway. This has been seen to cause rendering glitches with
  // THREE.js.
  // Dirty bindings include: gl.FRAMEBUFFER_BINDING, gl.CURRENT_PROGRAM,
  // gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING,
  // and gl.TEXTURE_BINDING_2D for texture unit 0.
  DIRTY_SUBMIT_FRAME_BINDINGS: false,

  // When set to true, this will cause a polyfilled VRDisplay to always be
  // appended to the list returned by navigator.getVRDisplays(), even if that
  // list includes a native VRDisplay.
  ALWAYS_APPEND_POLYFILL_DISPLAY: false,

  // There are versions of Chrome (M58-M60?) where the native WebVR API exists,
  // and instead of returning 0 VR displays when none are detected,
  // `navigator.getVRDisplays()`'s promise never resolves. This results
  // in the polyfill hanging and not being able to provide fallback
  // displays, so set a timeout in milliseconds to stop waiting for a response
  // and just use polyfilled displays.
  // https://bugs.chromium.org/p/chromium/issues/detail?id=727969
  GET_VR_DISPLAYS_TIMEOUT: 1000,
}, window.WebVRConfig);

if (!window.WebVRConfig.DEFER_INITIALIZATION) {
  new WebVRPolyfill();
} else {
  window.InitializeWebVRPolyfill = function() {
    new WebVRPolyfill();
  }
}

window.WebVRPolyfill = WebVRPolyfill;

},{"./util.js":24,"./webvr-polyfill.js":27}],15:[function(require,module,exports){
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

var MathUtil = window.MathUtil || {};

MathUtil.degToRad = Math.PI / 180;
MathUtil.radToDeg = 180 / Math.PI;

// Some minimal math functionality borrowed from THREE.Math and stripped down
// for the purposes of this library.


MathUtil.Vector2 = function ( x, y ) {
  this.x = x || 0;
  this.y = y || 0;
};

MathUtil.Vector2.prototype = {
  constructor: MathUtil.Vector2,

  set: function ( x, y ) {
    this.x = x;
    this.y = y;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;

    return this;
  },

  subVectors: function ( a, b ) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;

    return this;
  },
};

MathUtil.Vector3 = function ( x, y, z ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
};

MathUtil.Vector3.prototype = {
  constructor: MathUtil.Vector3,

  set: function ( x, y, z ) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    return this;
  },

  length: function () {
    return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
  },

  normalize: function () {
    var scalar = this.length();

    if ( scalar !== 0 ) {
      var invScalar = 1 / scalar;

      this.multiplyScalar(invScalar);
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }

    return this;
  },

  multiplyScalar: function ( scalar ) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
  },

  applyQuaternion: function ( q ) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var qx = q.x;
    var qy = q.y;
    var qz = q.z;
    var qw = q.w;

    // calculate quat * vector
    var ix =  qw * x + qy * z - qz * y;
    var iy =  qw * y + qz * x - qx * z;
    var iz =  qw * z + qx * y - qy * x;
    var iw = - qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
    this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
    this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

    return this;
  },

  dot: function ( v ) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  },

  crossVectors: function ( a, b ) {
    var ax = a.x, ay = a.y, az = a.z;
    var bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  },
};

MathUtil.Quaternion = function ( x, y, z, w ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = ( w !== undefined ) ? w : 1;
};

MathUtil.Quaternion.prototype = {
  constructor: MathUtil.Quaternion,

  set: function ( x, y, z, w ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    return this;
  },

  copy: function ( quaternion ) {
    this.x = quaternion.x;
    this.y = quaternion.y;
    this.z = quaternion.z;
    this.w = quaternion.w;

    return this;
  },

  setFromEulerXYZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;

    return this;
  },

  setFromEulerYXZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 - s1 * s2 * c3;
    this.w = c1 * c2 * c3 + s1 * s2 * s3;

    return this;
  },

  setFromAxisAngle: function ( axis, angle ) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
    // assumes axis is normalized

    var halfAngle = angle / 2, s = Math.sin( halfAngle );

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos( halfAngle );

    return this;
  },

  multiply: function ( q ) {
    return this.multiplyQuaternions( this, q );
  },

  multiplyQuaternions: function ( a, b ) {
    // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

    var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    var qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    return this;
  },

  inverse: function () {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;

    this.normalize();

    return this;
  },

  normalize: function () {
    var l = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

    if ( l === 0 ) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;

      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }

    return this;
  },

  slerp: function ( qb, t ) {
    if ( t === 0 ) return this;
    if ( t === 1 ) return this.copy( qb );

    var x = this.x, y = this.y, z = this.z, w = this.w;

    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

    var cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

    if ( cosHalfTheta < 0 ) {
      this.w = - qb.w;
      this.x = - qb.x;
      this.y = - qb.y;
      this.z = - qb.z;

      cosHalfTheta = - cosHalfTheta;
    } else {
      this.copy( qb );
    }

    if ( cosHalfTheta >= 1.0 ) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;

      return this;
    }

    var halfTheta = Math.acos( cosHalfTheta );
    var sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

    if ( Math.abs( sinHalfTheta ) < 0.001 ) {
      this.w = 0.5 * ( w + this.w );
      this.x = 0.5 * ( x + this.x );
      this.y = 0.5 * ( y + this.y );
      this.z = 0.5 * ( z + this.z );

      return this;
    }

    var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
    ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

    this.w = ( w * ratioA + this.w * ratioB );
    this.x = ( x * ratioA + this.x * ratioB );
    this.y = ( y * ratioA + this.y * ratioB );
    this.z = ( z * ratioA + this.z * ratioB );

    return this;
  },

  setFromUnitVectors: function () {
    // http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final
    // assumes direction vectors vFrom and vTo are normalized

    var v1, r;
    var EPS = 0.000001;

    return function ( vFrom, vTo ) {
      if ( v1 === undefined ) v1 = new MathUtil.Vector3();

      r = vFrom.dot( vTo ) + 1;

      if ( r < EPS ) {
        r = 0;

        if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {
          v1.set( - vFrom.y, vFrom.x, 0 );
        } else {
          v1.set( 0, - vFrom.z, vFrom.y );
        }
      } else {
        v1.crossVectors( vFrom, vTo );
      }

      this.x = v1.x;
      this.y = v1.y;
      this.z = v1.z;
      this.w = r;

      this.normalize();

      return this;
    }
  }(),
};

module.exports = MathUtil;

},{}],16:[function(require,module,exports){
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

var VRDisplay = require('./base.js').VRDisplay;
var MathUtil = require('./math-util.js');
var Util = require('./util.js');

// How much to rotate per key stroke.
var KEY_SPEED = 0.15;
var KEY_ANIMATION_DURATION = 80;

// How much to rotate for mouse events.
var MOUSE_SPEED_X = 0.5;
var MOUSE_SPEED_Y = 0.3;

/**
 * VRDisplay based on mouse and keyboard input. Designed for desktops/laptops
 * where orientation events aren't supported. Cannot present.
 */
function MouseKeyboardVRDisplay() {
  this.displayName = 'Mouse and Keyboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;

  // Attach to mouse and keyboard events.
  window.addEventListener('keydown', this.onKeyDown_.bind(this));
  window.addEventListener('mousemove', this.onMouseMove_.bind(this));
  window.addEventListener('mousedown', this.onMouseDown_.bind(this));
  window.addEventListener('mouseup', this.onMouseUp_.bind(this));

  // "Private" members.
  this.phi_ = 0;
  this.theta_ = 0;

  // Variables for keyboard-based rotation animation.
  this.targetAngle_ = null;
  this.angleAnimation_ = null;

  // State variables for calculations.
  this.orientation_ = new MathUtil.Quaternion();

  // Variables for mouse-based rotation.
  this.rotateStart_ = new MathUtil.Vector2();
  this.rotateEnd_ = new MathUtil.Vector2();
  this.rotateDelta_ = new MathUtil.Vector2();
  this.isDragging_ = false;

  this.orientationOut_ = new Float32Array(4);
}
MouseKeyboardVRDisplay.prototype = new VRDisplay();

MouseKeyboardVRDisplay.prototype.getImmediatePose = function() {
  this.orientation_.setFromEulerYXZ(this.phi_, this.theta_, 0);

  this.orientationOut_[0] = this.orientation_.x;
  this.orientationOut_[1] = this.orientation_.y;
  this.orientationOut_[2] = this.orientation_.z;
  this.orientationOut_[3] = this.orientation_.w;

  return {
    position: null,
    orientation: this.orientationOut_,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

MouseKeyboardVRDisplay.prototype.onKeyDown_ = function(e) {
  // Track WASD and arrow keys.
  if (e.keyCode == 38) { // Up key.
    this.animatePhi_(this.phi_ + KEY_SPEED);
  } else if (e.keyCode == 39) { // Right key.
    this.animateTheta_(this.theta_ - KEY_SPEED);
  } else if (e.keyCode == 40) { // Down key.
    this.animatePhi_(this.phi_ - KEY_SPEED);
  } else if (e.keyCode == 37) { // Left key.
    this.animateTheta_(this.theta_ + KEY_SPEED);
  }
};

MouseKeyboardVRDisplay.prototype.animateTheta_ = function(targetAngle) {
  this.animateKeyTransitions_('theta_', targetAngle);
};

MouseKeyboardVRDisplay.prototype.animatePhi_ = function(targetAngle) {
  // Prevent looking too far up or down.
  targetAngle = Util.clamp(targetAngle, -Math.PI/2, Math.PI/2);
  this.animateKeyTransitions_('phi_', targetAngle);
};

/**
 * Start an animation to transition an angle from one value to another.
 */
MouseKeyboardVRDisplay.prototype.animateKeyTransitions_ = function(angleName, targetAngle) {
  // If an animation is currently running, cancel it.
  if (this.angleAnimation_) {
    cancelAnimationFrame(this.angleAnimation_);
  }
  var startAngle = this[angleName];
  var startTime = new Date();
  // Set up an interval timer to perform the animation.
  this.angleAnimation_ = requestAnimationFrame(function animate() {
    // Once we're finished the animation, we're done.
    var elapsed = new Date() - startTime;
    if (elapsed >= KEY_ANIMATION_DURATION) {
      this[angleName] = targetAngle;
      cancelAnimationFrame(this.angleAnimation_);
      return;
    }
    // loop with requestAnimationFrame
    this.angleAnimation_ = requestAnimationFrame(animate.bind(this))
    // Linearly interpolate the angle some amount.
    var percent = elapsed / KEY_ANIMATION_DURATION;
    this[angleName] = startAngle + (targetAngle - startAngle) * percent;
  }.bind(this));
};

MouseKeyboardVRDisplay.prototype.onMouseDown_ = function(e) {
  this.rotateStart_.set(e.clientX, e.clientY);
  this.isDragging_ = true;
};

// Very similar to https://gist.github.com/mrflix/8351020
MouseKeyboardVRDisplay.prototype.onMouseMove_ = function(e) {
  if (!this.isDragging_ && !this.isPointerLocked_()) {
    return;
  }
  // Support pointer lock API.
  if (this.isPointerLocked_()) {
    var movementX = e.movementX || e.mozMovementX || 0;
    var movementY = e.movementY || e.mozMovementY || 0;
    this.rotateEnd_.set(this.rotateStart_.x - movementX, this.rotateStart_.y - movementY);
  } else {
    this.rotateEnd_.set(e.clientX, e.clientY);
  }
  // Calculate how much we moved in mouse space.
  this.rotateDelta_.subVectors(this.rotateEnd_, this.rotateStart_);
  this.rotateStart_.copy(this.rotateEnd_);

  // Keep track of the cumulative euler angles.
  this.phi_ += 2 * Math.PI * this.rotateDelta_.y / screen.height * MOUSE_SPEED_Y;
  this.theta_ += 2 * Math.PI * this.rotateDelta_.x / screen.width * MOUSE_SPEED_X;

  // Prevent looking too far up or down.
  this.phi_ = Util.clamp(this.phi_, -Math.PI/2, Math.PI/2);
};

MouseKeyboardVRDisplay.prototype.onMouseUp_ = function(e) {
  this.isDragging_ = false;
};

MouseKeyboardVRDisplay.prototype.isPointerLocked_ = function() {
  var el = document.pointerLockElement || document.mozPointerLockElement ||
      document.webkitPointerLockElement;
  return el !== undefined;
};

MouseKeyboardVRDisplay.prototype.resetPose = function() {
  this.phi_ = 0;
  this.theta_ = 0;
};

module.exports = MouseKeyboardVRDisplay;

},{"./base.js":4,"./math-util.js":15,"./util.js":24}],17:[function(require,module,exports){
(function (global){
// This is the entry point if requiring/importing via node, or
// a build tool that uses package.json entry (like browserify, webpack).
// If running in node with a window mock available, globalize its members
// if needed. Otherwise, just continue to `./main`
if (typeof global !== 'undefined' && global.window) {
  global.document = global.window.document;
  global.navigator = global.window.navigator;
}

require('./main');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./main":14}],18:[function(require,module,exports){
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

var Util = require('./util.js');

function RotateInstructions() {
  this.loadIcon_();

  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.top = 0;
  s.right = 0;
  s.bottom = 0;
  s.left = 0;
  s.backgroundColor = 'gray';
  s.fontFamily = 'sans-serif';
  // Force this to be above the fullscreen canvas, which is at zIndex: 999999.
  s.zIndex = 1000000;

  var img = document.createElement('img');
  img.src = this.icon;
  var s = img.style;
  s.marginLeft = '25%';
  s.marginTop = '25%';
  s.width = '50%';
  overlay.appendChild(img);

  var text = document.createElement('div');
  var s = text.style;
  s.textAlign = 'center';
  s.fontSize = '16px';
  s.lineHeight = '24px';
  s.margin = '24px 25%';
  s.width = '50%';
  text.innerHTML = 'Place your phone into your Cardboard viewer.';
  overlay.appendChild(text);

  var snackbar = document.createElement('div');
  var s = snackbar.style;
  s.backgroundColor = '#CFD8DC';
  s.position = 'fixed';
  s.bottom = 0;
  s.width = '100%';
  s.height = '48px';
  s.padding = '14px 24px';
  s.boxSizing = 'border-box';
  s.color = '#656A6B';
  overlay.appendChild(snackbar);

  var snackbarText = document.createElement('div');
  snackbarText.style.float = 'left';
  snackbarText.innerHTML = 'No Cardboard viewer?';

  var snackbarButton = document.createElement('a');
  snackbarButton.href = 'https://www.google.com/get/cardboard/get-cardboard/';
  snackbarButton.innerHTML = 'get one';
  snackbarButton.target = '_blank';
  var s = snackbarButton.style;
  s.float = 'right';
  s.fontWeight = 600;
  s.textTransform = 'uppercase';
  s.borderLeft = '1px solid gray';
  s.paddingLeft = '24px';
  s.textDecoration = 'none';
  s.color = '#656A6B';

  snackbar.appendChild(snackbarText);
  snackbar.appendChild(snackbarButton);

  this.overlay = overlay;
  this.text = text;

  this.hide();
}

RotateInstructions.prototype.show = function(parent) {
  if (!parent && !this.overlay.parentElement) {
    document.body.appendChild(this.overlay);
  } else if (parent) {
    if (this.overlay.parentElement && this.overlay.parentElement != parent)
      this.overlay.parentElement.removeChild(this.overlay);

    parent.appendChild(this.overlay);
  }

  this.overlay.style.display = 'block';

  var img = this.overlay.querySelector('img');
  var s = img.style;

  if (Util.isLandscapeMode()) {
    s.width = '20%';
    s.marginLeft = '40%';
    s.marginTop = '3%';
  } else {
    s.width = '50%';
    s.marginLeft = '25%';
    s.marginTop = '25%';
  }
};

RotateInstructions.prototype.hide = function() {
  this.overlay.style.display = 'none';
};

RotateInstructions.prototype.showTemporarily = function(ms, parent) {
  this.show(parent);
  this.timer = setTimeout(this.hide.bind(this), ms);
};

RotateInstructions.prototype.disableShowTemporarily = function() {
  clearTimeout(this.timer);
};

RotateInstructions.prototype.update = function() {
  this.disableShowTemporarily();
  // In portrait VR mode, tell the user to rotate to landscape. Otherwise, hide
  // the instructions.
  if (!Util.isLandscapeMode() && Util.isMobile()) {
    this.show();
  } else {
    this.hide();
  }
};

RotateInstructions.prototype.loadIcon_ = function() {
  // Encoded asset_src/rotate-instructions.svg
  this.icon = Util.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjE5OHB4IiBoZWlnaHQ9IjI0MHB4IiB2aWV3Qm94PSIwIDAgMTk4IDI0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpza2V0Y2g9Imh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaC9ucyI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDMuMy4zICgxMjA4MSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dHJhbnNpdGlvbjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHNrZXRjaDp0eXBlPSJNU1BhZ2UiPgogICAgICAgIDxnIGlkPSJ0cmFuc2l0aW9uIiBza2V0Y2g6dHlwZT0iTVNBcnRib2FyZEdyb3VwIj4KICAgICAgICAgICAgPGcgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTQtKy1JbXBvcnRlZC1MYXllcnMtQ29weS0rLUltcG9ydGVkLUxheWVycy1Db3B5LTItQ29weSIgc2tldGNoOnR5cGU9Ik1TTGF5ZXJHcm91cCI+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHktNCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsIDEwNy4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjYyNSwyLjUyNyBDMTQ5LjYyNSwyLjUyNyAxNTUuODA1LDYuMDk2IDE1Ni4zNjIsNi40MTggTDE1Ni4zNjIsNy4zMDQgQzE1Ni4zNjIsNy40ODEgMTU2LjM3NSw3LjY2NCAxNTYuNCw3Ljg1MyBDMTU2LjQxLDcuOTM0IDE1Ni40Miw4LjAxNSAxNTYuNDI3LDguMDk1IEMxNTYuNTY3LDkuNTEgMTU3LjQwMSwxMS4wOTMgMTU4LjUzMiwxMi4wOTQgTDE2NC4yNTIsMTcuMTU2IEwxNjQuMzMzLDE3LjA2NiBDMTY0LjMzMywxNy4wNjYgMTY4LjcxNSwxNC41MzYgMTY5LjU2OCwxNC4wNDIgQzE3MS4wMjUsMTQuODgzIDE5NS41MzgsMjkuMDM1IDE5NS41MzgsMjkuMDM1IEwxOTUuNTM4LDgzLjAzNiBDMTk1LjUzOCw4My44MDcgMTk1LjE1Miw4NC4yNTMgMTk0LjU5LDg0LjI1MyBDMTk0LjM1Nyw4NC4yNTMgMTk0LjA5NSw4NC4xNzcgMTkzLjgxOCw4NC4wMTcgTDE2OS44NTEsNzAuMTc5IEwxNjkuODM3LDcwLjIwMyBMMTQyLjUxNSw4NS45NzggTDE0MS42NjUsODQuNjU1IEMxMzYuOTM0LDgzLjEyNiAxMzEuOTE3LDgxLjkxNSAxMjYuNzE0LDgxLjA0NSBDMTI2LjcwOSw4MS4wNiAxMjYuNzA3LDgxLjA2OSAxMjYuNzA3LDgxLjA2OSBMMTIxLjY0LDk4LjAzIEwxMTMuNzQ5LDEwMi41ODYgTDExMy43MTIsMTAyLjUyMyBMMTEzLjcxMiwxMzAuMTEzIEMxMTMuNzEyLDEzMC44ODUgMTEzLjMyNiwxMzEuMzMgMTEyLjc2NCwxMzEuMzMgQzExMi41MzIsMTMxLjMzIDExMi4yNjksMTMxLjI1NCAxMTEuOTkyLDEzMS4wOTQgTDY5LjUxOSwxMDYuNTcyIEM2OC41NjksMTA2LjAyMyA2Ny43OTksMTA0LjY5NSA2Ny43OTksMTAzLjYwNSBMNjcuNzk5LDEwMi41NyBMNjcuNzc4LDEwMi42MTcgQzY3LjI3LDEwMi4zOTMgNjYuNjQ4LDEwMi4yNDkgNjUuOTYyLDEwMi4yMTggQzY1Ljg3NSwxMDIuMjE0IDY1Ljc4OCwxMDIuMjEyIDY1LjcwMSwxMDIuMjEyIEM2NS42MDYsMTAyLjIxMiA2NS41MTEsMTAyLjIxNSA2NS40MTYsMTAyLjIxOSBDNjUuMTk1LDEwMi4yMjkgNjQuOTc0LDEwMi4yMzUgNjQuNzU0LDEwMi4yMzUgQzY0LjMzMSwxMDIuMjM1IDYzLjkxMSwxMDIuMjE2IDYzLjQ5OCwxMDIuMTc4IEM2MS44NDMsMTAyLjAyNSA2MC4yOTgsMTAxLjU3OCA1OS4wOTQsMTAwLjg4MiBMMTIuNTE4LDczLjk5MiBMMTIuNTIzLDc0LjAwNCBMMi4yNDUsNTUuMjU0IEMxLjI0NCw1My40MjcgMi4wMDQsNTEuMDM4IDMuOTQzLDQ5LjkxOCBMNTkuOTU0LDE3LjU3MyBDNjAuNjI2LDE3LjE4NSA2MS4zNSwxNy4wMDEgNjIuMDUzLDE3LjAwMSBDNjMuMzc5LDE3LjAwMSA2NC42MjUsMTcuNjYgNjUuMjgsMTguODU0IEw2NS4yODUsMTguODUxIEw2NS41MTIsMTkuMjY0IEw2NS41MDYsMTkuMjY4IEM2NS45MDksMjAuMDAzIDY2LjQwNSwyMC42OCA2Ni45ODMsMjEuMjg2IEw2Ny4yNiwyMS41NTYgQzY5LjE3NCwyMy40MDYgNzEuNzI4LDI0LjM1NyA3NC4zNzMsMjQuMzU3IEM3Ni4zMjIsMjQuMzU3IDc4LjMyMSwyMy44NCA4MC4xNDgsMjIuNzg1IEM4MC4xNjEsMjIuNzg1IDg3LjQ2NywxOC41NjYgODcuNDY3LDE4LjU2NiBDODguMTM5LDE4LjE3OCA4OC44NjMsMTcuOTk0IDg5LjU2NiwxNy45OTQgQzkwLjg5MiwxNy45OTQgOTIuMTM4LDE4LjY1MiA5Mi43OTIsMTkuODQ3IEw5Ni4wNDIsMjUuNzc1IEw5Ni4wNjQsMjUuNzU3IEwxMDIuODQ5LDI5LjY3NCBMMTAyLjc0NCwyOS40OTIgTDE0OS42MjUsMi41MjcgTTE0OS42MjUsMC44OTIgQzE0OS4zNDMsMC44OTIgMTQ5LjA2MiwwLjk2NSAxNDguODEsMS4xMSBMMTAyLjY0MSwyNy42NjYgTDk3LjIzMSwyNC41NDIgTDk0LjIyNiwxOS4wNjEgQzkzLjMxMywxNy4zOTQgOTEuNTI3LDE2LjM1OSA4OS41NjYsMTYuMzU4IEM4OC41NTUsMTYuMzU4IDg3LjU0NiwxNi42MzIgODYuNjQ5LDE3LjE1IEM4My44NzgsMTguNzUgNzkuNjg3LDIxLjE2OSA3OS4zNzQsMjEuMzQ1IEM3OS4zNTksMjEuMzUzIDc5LjM0NSwyMS4zNjEgNzkuMzMsMjEuMzY5IEM3Ny43OTgsMjIuMjU0IDc2LjA4NCwyMi43MjIgNzQuMzczLDIyLjcyMiBDNzIuMDgxLDIyLjcyMiA2OS45NTksMjEuODkgNjguMzk3LDIwLjM4IEw2OC4xNDUsMjAuMTM1IEM2Ny43MDYsMTkuNjcyIDY3LjMyMywxOS4xNTYgNjcuMDA2LDE4LjYwMSBDNjYuOTg4LDE4LjU1OSA2Ni45NjgsMTguNTE5IDY2Ljk0NiwxOC40NzkgTDY2LjcxOSwxOC4wNjUgQzY2LjY5LDE4LjAxMiA2Ni42NTgsMTcuOTYgNjYuNjI0LDE3LjkxMSBDNjUuNjg2LDE2LjMzNyA2My45NTEsMTUuMzY2IDYyLjA1MywxNS4zNjYgQzYxLjA0MiwxNS4zNjYgNjAuMDMzLDE1LjY0IDU5LjEzNiwxNi4xNTggTDMuMTI1LDQ4LjUwMiBDMC40MjYsNTAuMDYxIC0wLjYxMyw1My40NDIgMC44MTEsNTYuMDQgTDExLjA4OSw3NC43OSBDMTEuMjY2LDc1LjExMyAxMS41MzcsNzUuMzUzIDExLjg1LDc1LjQ5NCBMNTguMjc2LDEwMi4yOTggQzU5LjY3OSwxMDMuMTA4IDYxLjQzMywxMDMuNjMgNjMuMzQ4LDEwMy44MDYgQzYzLjgxMiwxMDMuODQ4IDY0LjI4NSwxMDMuODcgNjQuNzU0LDEwMy44NyBDNjUsMTAzLjg3IDY1LjI0OSwxMDMuODY0IDY1LjQ5NCwxMDMuODUyIEM2NS41NjMsMTAzLjg0OSA2NS42MzIsMTAzLjg0NyA2NS43MDEsMTAzLjg0NyBDNjUuNzY0LDEwMy44NDcgNjUuODI4LDEwMy44NDkgNjUuODksMTAzLjg1MiBDNjUuOTg2LDEwMy44NTYgNjYuMDgsMTAzLjg2MyA2Ni4xNzMsMTAzLjg3NCBDNjYuMjgyLDEwNS40NjcgNjcuMzMyLDEwNy4xOTcgNjguNzAyLDEwNy45ODggTDExMS4xNzQsMTMyLjUxIEMxMTEuNjk4LDEzMi44MTIgMTEyLjIzMiwxMzIuOTY1IDExMi43NjQsMTMyLjk2NSBDMTE0LjI2MSwxMzIuOTY1IDExNS4zNDcsMTMxLjc2NSAxMTUuMzQ3LDEzMC4xMTMgTDExNS4zNDcsMTAzLjU1MSBMMTIyLjQ1OCw5OS40NDYgQzEyMi44MTksOTkuMjM3IDEyMy4wODcsOTguODk4IDEyMy4yMDcsOTguNDk4IEwxMjcuODY1LDgyLjkwNSBDMTMyLjI3OSw4My43MDIgMTM2LjU1Nyw4NC43NTMgMTQwLjYwNyw4Ni4wMzMgTDE0MS4xNCw4Ni44NjIgQzE0MS40NTEsODcuMzQ2IDE0MS45NzcsODcuNjEzIDE0Mi41MTYsODcuNjEzIEMxNDIuNzk0LDg3LjYxMyAxNDMuMDc2LDg3LjU0MiAxNDMuMzMzLDg3LjM5MyBMMTY5Ljg2NSw3Mi4wNzYgTDE5Myw4NS40MzMgQzE5My41MjMsODUuNzM1IDE5NC4wNTgsODUuODg4IDE5NC41OSw4NS44ODggQzE5Ni4wODcsODUuODg4IDE5Ny4xNzMsODQuNjg5IDE5Ny4xNzMsODMuMDM2IEwxOTcuMTczLDI5LjAzNSBDMTk3LjE3MywyOC40NTEgMTk2Ljg2MSwyNy45MTEgMTk2LjM1NSwyNy42MTkgQzE5Ni4zNTUsMjcuNjE5IDE3MS44NDMsMTMuNDY3IDE3MC4zODUsMTIuNjI2IEMxNzAuMTMyLDEyLjQ4IDE2OS44NSwxMi40MDcgMTY5LjU2OCwxMi40MDcgQzE2OS4yODUsMTIuNDA3IDE2OS4wMDIsMTIuNDgxIDE2OC43NDksMTIuNjI3IEMxNjguMTQzLDEyLjk3OCAxNjUuNzU2LDE0LjM1NyAxNjQuNDI0LDE1LjEyNSBMMTU5LjYxNSwxMC44NyBDMTU4Ljc5NiwxMC4xNDUgMTU4LjE1NCw4LjkzNyAxNTguMDU0LDcuOTM0IEMxNTguMDQ1LDcuODM3IDE1OC4wMzQsNy43MzkgMTU4LjAyMSw3LjY0IEMxNTguMDA1LDcuNTIzIDE1Ny45OTgsNy40MSAxNTcuOTk4LDcuMzA0IEwxNTcuOTk4LDYuNDE4IEMxNTcuOTk4LDUuODM0IDE1Ny42ODYsNS4yOTUgMTU3LjE4MSw1LjAwMiBDMTU2LjYyNCw0LjY4IDE1MC40NDIsMS4xMTEgMTUwLjQ0MiwxLjExMSBDMTUwLjE4OSwwLjk2NSAxNDkuOTA3LDAuODkyIDE0OS42MjUsMC44OTIiIGlkPSJGaWxsLTEiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTYuMDI3LDI1LjYzNiBMMTQyLjYwMyw1Mi41MjcgQzE0My44MDcsNTMuMjIyIDE0NC41ODIsNTQuMTE0IDE0NC44NDUsNTUuMDY4IEwxNDQuODM1LDU1LjA3NSBMNjMuNDYxLDEwMi4wNTcgTDYzLjQ2LDEwMi4wNTcgQzYxLjgwNiwxMDEuOTA1IDYwLjI2MSwxMDEuNDU3IDU5LjA1NywxMDAuNzYyIEwxMi40ODEsNzMuODcxIEw5Ni4wMjcsMjUuNjM2IiBpZD0iRmlsbC0yIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYzLjQ2MSwxMDIuMTc0IEM2My40NTMsMTAyLjE3NCA2My40NDYsMTAyLjE3NCA2My40MzksMTAyLjE3MiBDNjEuNzQ2LDEwMi4wMTYgNjAuMjExLDEwMS41NjMgNTguOTk4LDEwMC44NjMgTDEyLjQyMiw3My45NzMgQzEyLjM4Niw3My45NTIgMTIuMzY0LDczLjkxNCAxMi4zNjQsNzMuODcxIEMxMi4zNjQsNzMuODMgMTIuMzg2LDczLjc5MSAxMi40MjIsNzMuNzcgTDk1Ljk2OCwyNS41MzUgQzk2LjAwNCwyNS41MTQgOTYuMDQ5LDI1LjUxNCA5Ni4wODUsMjUuNTM1IEwxNDIuNjYxLDUyLjQyNiBDMTQzLjg4OCw1My4xMzQgMTQ0LjY4Miw1NC4wMzggMTQ0Ljk1Nyw1NS4wMzcgQzE0NC45Nyw1NS4wODMgMTQ0Ljk1Myw1NS4xMzMgMTQ0LjkxNSw1NS4xNjEgQzE0NC45MTEsNTUuMTY1IDE0NC44OTgsNTUuMTc0IDE0NC44OTQsNTUuMTc3IEw2My41MTksMTAyLjE1OCBDNjMuNTAxLDEwMi4xNjkgNjMuNDgxLDEwMi4xNzQgNjMuNDYxLDEwMi4xNzQgTDYzLjQ2MSwxMDIuMTc0IFogTTEyLjcxNCw3My44NzEgTDU5LjExNSwxMDAuNjYxIEM2MC4yOTMsMTAxLjM0MSA2MS43ODYsMTAxLjc4MiA2My40MzUsMTAxLjkzNyBMMTQ0LjcwNyw1NS4wMTUgQzE0NC40MjgsNTQuMTA4IDE0My42ODIsNTMuMjg1IDE0Mi41NDQsNTIuNjI4IEw5Ni4wMjcsMjUuNzcxIEwxMi43MTQsNzMuODcxIEwxMi43MTQsNzMuODcxIFoiIGlkPSJGaWxsLTMiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ4LjMyNyw1OC40NzEgQzE0OC4xNDUsNTguNDggMTQ3Ljk2Miw1OC40OCAxNDcuNzgxLDU4LjQ3MiBDMTQ1Ljg4Nyw1OC4zODkgMTQ0LjQ3OSw1Ny40MzQgMTQ0LjYzNiw1Ni4zNCBDMTQ0LjY4OSw1NS45NjcgMTQ0LjY2NCw1NS41OTcgMTQ0LjU2NCw1NS4yMzUgTDYzLjQ2MSwxMDIuMDU3IEM2NC4wODksMTAyLjExNSA2NC43MzMsMTAyLjEzIDY1LjM3OSwxMDIuMDk5IEM2NS41NjEsMTAyLjA5IDY1Ljc0MywxMDIuMDkgNjUuOTI1LDEwMi4wOTggQzY3LjgxOSwxMDIuMTgxIDY5LjIyNywxMDMuMTM2IDY5LjA3LDEwNC4yMyBMMTQ4LjMyNyw1OC40NzEiIGlkPSJGaWxsLTQiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNjkuMDcsMTA0LjM0NyBDNjkuMDQ4LDEwNC4zNDcgNjkuMDI1LDEwNC4zNCA2OS4wMDUsMTA0LjMyNyBDNjguOTY4LDEwNC4zMDEgNjguOTQ4LDEwNC4yNTcgNjguOTU1LDEwNC4yMTMgQzY5LDEwMy44OTYgNjguODk4LDEwMy41NzYgNjguNjU4LDEwMy4yODggQzY4LjE1MywxMDIuNjc4IDY3LjEwMywxMDIuMjY2IDY1LjkyLDEwMi4yMTQgQzY1Ljc0MiwxMDIuMjA2IDY1LjU2MywxMDIuMjA3IDY1LjM4NSwxMDIuMjE1IEM2NC43NDIsMTAyLjI0NiA2NC4wODcsMTAyLjIzMiA2My40NSwxMDIuMTc0IEM2My4zOTksMTAyLjE2OSA2My4zNTgsMTAyLjEzMiA2My4zNDcsMTAyLjA4MiBDNjMuMzM2LDEwMi4wMzMgNjMuMzU4LDEwMS45ODEgNjMuNDAyLDEwMS45NTYgTDE0NC41MDYsNTUuMTM0IEMxNDQuNTM3LDU1LjExNiAxNDQuNTc1LDU1LjExMyAxNDQuNjA5LDU1LjEyNyBDMTQ0LjY0Miw1NS4xNDEgMTQ0LjY2OCw1NS4xNyAxNDQuNjc3LDU1LjIwNCBDMTQ0Ljc4MSw1NS41ODUgMTQ0LjgwNiw1NS45NzIgMTQ0Ljc1MSw1Ni4zNTcgQzE0NC43MDYsNTYuNjczIDE0NC44MDgsNTYuOTk0IDE0NS4wNDcsNTcuMjgyIEMxNDUuNTUzLDU3Ljg5MiAxNDYuNjAyLDU4LjMwMyAxNDcuNzg2LDU4LjM1NSBDMTQ3Ljk2NCw1OC4zNjMgMTQ4LjE0Myw1OC4zNjMgMTQ4LjMyMSw1OC4zNTQgQzE0OC4zNzcsNTguMzUyIDE0OC40MjQsNTguMzg3IDE0OC40MzksNTguNDM4IEMxNDguNDU0LDU4LjQ5IDE0OC40MzIsNTguNTQ1IDE0OC4zODUsNTguNTcyIEw2OS4xMjksMTA0LjMzMSBDNjkuMTExLDEwNC4zNDIgNjkuMDksMTA0LjM0NyA2OS4wNywxMDQuMzQ3IEw2OS4wNywxMDQuMzQ3IFogTTY1LjY2NSwxMDEuOTc1IEM2NS43NTQsMTAxLjk3NSA2NS44NDIsMTAxLjk3NyA2NS45MywxMDEuOTgxIEM2Ny4xOTYsMTAyLjAzNyA2OC4yODMsMTAyLjQ2OSA2OC44MzgsMTAzLjEzOSBDNjkuMDY1LDEwMy40MTMgNjkuMTg4LDEwMy43MTQgNjkuMTk4LDEwNC4wMjEgTDE0Ny44ODMsNTguNTkyIEMxNDcuODQ3LDU4LjU5MiAxNDcuODExLDU4LjU5MSAxNDcuNzc2LDU4LjU4OSBDMTQ2LjUwOSw1OC41MzMgMTQ1LjQyMiw1OC4xIDE0NC44NjcsNTcuNDMxIEMxNDQuNTg1LDU3LjA5MSAxNDQuNDY1LDU2LjcwNyAxNDQuNTIsNTYuMzI0IEMxNDQuNTYzLDU2LjAyMSAxNDQuNTUyLDU1LjcxNiAxNDQuNDg4LDU1LjQxNCBMNjMuODQ2LDEwMS45NyBDNjQuMzUzLDEwMi4wMDIgNjQuODY3LDEwMi4wMDYgNjUuMzc0LDEwMS45ODIgQzY1LjQ3MSwxMDEuOTc3IDY1LjU2OCwxMDEuOTc1IDY1LjY2NSwxMDEuOTc1IEw2NS42NjUsMTAxLjk3NSBaIiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTIuMjA4LDU1LjEzNCBDMS4yMDcsNTMuMzA3IDEuOTY3LDUwLjkxNyAzLjkwNiw0OS43OTcgTDU5LjkxNywxNy40NTMgQzYxLjg1NiwxNi4zMzMgNjQuMjQxLDE2LjkwNyA2NS4yNDMsMTguNzM0IEw2NS40NzUsMTkuMTQ0IEM2NS44NzIsMTkuODgyIDY2LjM2OCwyMC41NiA2Ni45NDUsMjEuMTY1IEw2Ny4yMjMsMjEuNDM1IEM3MC41NDgsMjQuNjQ5IDc1LjgwNiwyNS4xNTEgODAuMTExLDIyLjY2NSBMODcuNDMsMTguNDQ1IEM4OS4zNywxNy4zMjYgOTEuNzU0LDE3Ljg5OSA5Mi43NTUsMTkuNzI3IEw5Ni4wMDUsMjUuNjU1IEwxMi40ODYsNzMuODg0IEwyLjIwOCw1NS4xMzQgWiIgaWQ9IkZpbGwtNiIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMi40ODYsNzQuMDAxIEMxMi40NzYsNzQuMDAxIDEyLjQ2NSw3My45OTkgMTIuNDU1LDczLjk5NiBDMTIuNDI0LDczLjk4OCAxMi4zOTksNzMuOTY3IDEyLjM4NCw3My45NCBMMi4xMDYsNTUuMTkgQzEuMDc1LDUzLjMxIDEuODU3LDUwLjg0NSAzLjg0OCw0OS42OTYgTDU5Ljg1OCwxNy4zNTIgQzYwLjUyNSwxNi45NjcgNjEuMjcxLDE2Ljc2NCA2Mi4wMTYsMTYuNzY0IEM2My40MzEsMTYuNzY0IDY0LjY2NiwxNy40NjYgNjUuMzI3LDE4LjY0NiBDNjUuMzM3LDE4LjY1NCA2NS4zNDUsMTguNjYzIDY1LjM1MSwxOC42NzQgTDY1LjU3OCwxOS4wODggQzY1LjU4NCwxOS4xIDY1LjU4OSwxOS4xMTIgNjUuNTkxLDE5LjEyNiBDNjUuOTg1LDE5LjgzOCA2Ni40NjksMjAuNDk3IDY3LjAzLDIxLjA4NSBMNjcuMzA1LDIxLjM1MSBDNjkuMTUxLDIzLjEzNyA3MS42NDksMjQuMTIgNzQuMzM2LDI0LjEyIEM3Ni4zMTMsMjQuMTIgNzguMjksMjMuNTgyIDgwLjA1MywyMi41NjMgQzgwLjA2NCwyMi41NTcgODAuMDc2LDIyLjU1MyA4MC4wODgsMjIuNTUgTDg3LjM3MiwxOC4zNDQgQzg4LjAzOCwxNy45NTkgODguNzg0LDE3Ljc1NiA4OS41MjksMTcuNzU2IEM5MC45NTYsMTcuNzU2IDkyLjIwMSwxOC40NzIgOTIuODU4LDE5LjY3IEw5Ni4xMDcsMjUuNTk5IEM5Ni4xMzgsMjUuNjU0IDk2LjExOCwyNS43MjQgOTYuMDYzLDI1Ljc1NiBMMTIuNTQ1LDczLjk4NSBDMTIuNTI2LDczLjk5NiAxMi41MDYsNzQuMDAxIDEyLjQ4Niw3NC4wMDEgTDEyLjQ4Niw3NC4wMDEgWiBNNjIuMDE2LDE2Ljk5NyBDNjEuMzEyLDE2Ljk5NyA2MC42MDYsMTcuMTkgNTkuOTc1LDE3LjU1NCBMMy45NjUsNDkuODk5IEMyLjA4Myw1MC45ODUgMS4zNDEsNTMuMzA4IDIuMzEsNTUuMDc4IEwxMi41MzEsNzMuNzIzIEw5NS44NDgsMjUuNjExIEw5Mi42NTMsMTkuNzgyIEM5Mi4wMzgsMTguNjYgOTAuODcsMTcuOTkgODkuNTI5LDE3Ljk5IEM4OC44MjUsMTcuOTkgODguMTE5LDE4LjE4MiA4Ny40ODksMTguNTQ3IEw4MC4xNzIsMjIuNzcyIEM4MC4xNjEsMjIuNzc4IDgwLjE0OSwyMi43ODIgODAuMTM3LDIyLjc4NSBDNzguMzQ2LDIzLjgxMSA3Ni4zNDEsMjQuMzU0IDc0LjMzNiwyNC4zNTQgQzcxLjU4OCwyNC4zNTQgNjkuMDMzLDIzLjM0NyA2Ny4xNDIsMjEuNTE5IEw2Ni44NjQsMjEuMjQ5IEM2Ni4yNzcsMjAuNjM0IDY1Ljc3NCwxOS45NDcgNjUuMzY3LDE5LjIwMyBDNjUuMzYsMTkuMTkyIDY1LjM1NiwxOS4xNzkgNjUuMzU0LDE5LjE2NiBMNjUuMTYzLDE4LjgxOSBDNjUuMTU0LDE4LjgxMSA2NS4xNDYsMTguODAxIDY1LjE0LDE4Ljc5IEM2NC41MjUsMTcuNjY3IDYzLjM1NywxNi45OTcgNjIuMDE2LDE2Ljk5NyBMNjIuMDE2LDE2Ljk5NyBaIiBpZD0iRmlsbC03IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTQyLjQzNCw0OC44MDggTDQyLjQzNCw0OC44MDggQzM5LjkyNCw0OC44MDcgMzcuNzM3LDQ3LjU1IDM2LjU4Miw0NS40NDMgQzM0Ljc3MSw0Mi4xMzkgMzYuMTQ0LDM3LjgwOSAzOS42NDEsMzUuNzg5IEw1MS45MzIsMjguNjkxIEM1My4xMDMsMjguMDE1IDU0LjQxMywyNy42NTggNTUuNzIxLDI3LjY1OCBDNTguMjMxLDI3LjY1OCA2MC40MTgsMjguOTE2IDYxLjU3MywzMS4wMjMgQzYzLjM4NCwzNC4zMjcgNjIuMDEyLDM4LjY1NyA1OC41MTQsNDAuNjc3IEw0Ni4yMjMsNDcuNzc1IEM0NS4wNTMsNDguNDUgNDMuNzQyLDQ4LjgwOCA0Mi40MzQsNDguODA4IEw0Mi40MzQsNDguODA4IFogTTU1LjcyMSwyOC4xMjUgQzU0LjQ5NSwyOC4xMjUgNTMuMjY1LDI4LjQ2MSA1Mi4xNjYsMjkuMDk2IEwzOS44NzUsMzYuMTk0IEMzNi41OTYsMzguMDg3IDM1LjMwMiw0Mi4xMzYgMzYuOTkyLDQ1LjIxOCBDMzguMDYzLDQ3LjE3MyA0MC4wOTgsNDguMzQgNDIuNDM0LDQ4LjM0IEM0My42NjEsNDguMzQgNDQuODksNDguMDA1IDQ1Ljk5LDQ3LjM3IEw1OC4yODEsNDAuMjcyIEM2MS41NiwzOC4zNzkgNjIuODUzLDM0LjMzIDYxLjE2NCwzMS4yNDggQzYwLjA5MiwyOS4yOTMgNTguMDU4LDI4LjEyNSA1NS43MjEsMjguMTI1IEw1NS43MjEsMjguMTI1IFoiIGlkPSJGaWxsLTgiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjU4OCwyLjQwNyBDMTQ5LjU4OCwyLjQwNyAxNTUuNzY4LDUuOTc1IDE1Ni4zMjUsNi4yOTcgTDE1Ni4zMjUsNy4xODQgQzE1Ni4zMjUsNy4zNiAxNTYuMzM4LDcuNTQ0IDE1Ni4zNjIsNy43MzMgQzE1Ni4zNzMsNy44MTQgMTU2LjM4Miw3Ljg5NCAxNTYuMzksNy45NzUgQzE1Ni41Myw5LjM5IDE1Ny4zNjMsMTAuOTczIDE1OC40OTUsMTEuOTc0IEwxNjUuODkxLDE4LjUxOSBDMTY2LjA2OCwxOC42NzUgMTY2LjI0OSwxOC44MTQgMTY2LjQzMiwxOC45MzQgQzE2OC4wMTEsMTkuOTc0IDE2OS4zODIsMTkuNCAxNjkuNDk0LDE3LjY1MiBDMTY5LjU0MywxNi44NjggMTY5LjU1MSwxNi4wNTcgMTY5LjUxNywxNS4yMjMgTDE2OS41MTQsMTUuMDYzIEwxNjkuNTE0LDEzLjkxMiBDMTcwLjc4LDE0LjY0MiAxOTUuNTAxLDI4LjkxNSAxOTUuNTAxLDI4LjkxNSBMMTk1LjUwMSw4Mi45MTUgQzE5NS41MDEsODQuMDA1IDE5NC43MzEsODQuNDQ1IDE5My43ODEsODMuODk3IEwxNTEuMzA4LDU5LjM3NCBDMTUwLjM1OCw1OC44MjYgMTQ5LjU4OCw1Ny40OTcgMTQ5LjU4OCw1Ni40MDggTDE0OS41ODgsMjIuMzc1IiBpZD0iRmlsbC05IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE5NC41NTMsODQuMjUgQzE5NC4yOTYsODQuMjUgMTk0LjAxMyw4NC4xNjUgMTkzLjcyMiw4My45OTcgTDE1MS4yNSw1OS40NzYgQzE1MC4yNjksNTguOTA5IDE0OS40NzEsNTcuNTMzIDE0OS40NzEsNTYuNDA4IEwxNDkuNDcxLDIyLjM3NSBMMTQ5LjcwNSwyMi4zNzUgTDE0OS43MDUsNTYuNDA4IEMxNDkuNzA1LDU3LjQ1OSAxNTAuNDUsNTguNzQ0IDE1MS4zNjYsNTkuMjc0IEwxOTMuODM5LDgzLjc5NSBDMTk0LjI2Myw4NC4wNCAxOTQuNjU1LDg0LjA4MyAxOTQuOTQyLDgzLjkxNyBDMTk1LjIyNyw4My43NTMgMTk1LjM4NCw4My4zOTcgMTk1LjM4NCw4Mi45MTUgTDE5NS4zODQsMjguOTgyIEMxOTQuMTAyLDI4LjI0MiAxNzIuMTA0LDE1LjU0MiAxNjkuNjMxLDE0LjExNCBMMTY5LjYzNCwxNS4yMiBDMTY5LjY2OCwxNi4wNTIgMTY5LjY2LDE2Ljg3NCAxNjkuNjEsMTcuNjU5IEMxNjkuNTU2LDE4LjUwMyAxNjkuMjE0LDE5LjEyMyAxNjguNjQ3LDE5LjQwNSBDMTY4LjAyOCwxOS43MTQgMTY3LjE5NywxOS41NzggMTY2LjM2NywxOS4wMzIgQzE2Ni4xODEsMTguOTA5IDE2NS45OTUsMTguNzY2IDE2NS44MTQsMTguNjA2IEwxNTguNDE3LDEyLjA2MiBDMTU3LjI1OSwxMS4wMzYgMTU2LjQxOCw5LjQzNyAxNTYuMjc0LDcuOTg2IEMxNTYuMjY2LDcuOTA3IDE1Ni4yNTcsNy44MjcgMTU2LjI0Nyw3Ljc0OCBDMTU2LjIyMSw3LjU1NSAxNTYuMjA5LDcuMzY1IDE1Ni4yMDksNy4xODQgTDE1Ni4yMDksNi4zNjQgQzE1NS4zNzUsNS44ODMgMTQ5LjUyOSwyLjUwOCAxNDkuNTI5LDIuNTA4IEwxNDkuNjQ2LDIuMzA2IEMxNDkuNjQ2LDIuMzA2IDE1NS44MjcsNS44NzQgMTU2LjM4NCw2LjE5NiBMMTU2LjQ0Miw2LjIzIEwxNTYuNDQyLDcuMTg0IEMxNTYuNDQyLDcuMzU1IDE1Ni40NTQsNy41MzUgMTU2LjQ3OCw3LjcxNyBDMTU2LjQ4OSw3LjggMTU2LjQ5OSw3Ljg4MiAxNTYuNTA3LDcuOTYzIEMxNTYuNjQ1LDkuMzU4IDE1Ny40NTUsMTAuODk4IDE1OC41NzIsMTEuODg2IEwxNjUuOTY5LDE4LjQzMSBDMTY2LjE0MiwxOC41ODQgMTY2LjMxOSwxOC43MiAxNjYuNDk2LDE4LjgzNyBDMTY3LjI1NCwxOS4zMzYgMTY4LDE5LjQ2NyAxNjguNTQzLDE5LjE5NiBDMTY5LjAzMywxOC45NTMgMTY5LjMyOSwxOC40MDEgMTY5LjM3NywxNy42NDUgQzE2OS40MjcsMTYuODY3IDE2OS40MzQsMTYuMDU0IDE2OS40MDEsMTUuMjI4IEwxNjkuMzk3LDE1LjA2NSBMMTY5LjM5NywxMy43MSBMMTY5LjU3MiwxMy44MSBDMTcwLjgzOSwxNC41NDEgMTk1LjU1OSwyOC44MTQgMTk1LjU1OSwyOC44MTQgTDE5NS42MTgsMjguODQ3IEwxOTUuNjE4LDgyLjkxNSBDMTk1LjYxOCw4My40ODQgMTk1LjQyLDgzLjkxMSAxOTUuMDU5LDg0LjExOSBDMTk0LjkwOCw4NC4yMDYgMTk0LjczNyw4NC4yNSAxOTQuNTUzLDg0LjI1IiBpZD0iRmlsbC0xMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDUuNjg1LDU2LjE2MSBMMTY5LjgsNzAuMDgzIEwxNDMuODIyLDg1LjA4MSBMMTQyLjM2LDg0Ljc3NCBDMTM1LjgyNiw4Mi42MDQgMTI4LjczMiw4MS4wNDYgMTIxLjM0MSw4MC4xNTggQzExNi45NzYsNzkuNjM0IDExMi42NzgsODEuMjU0IDExMS43NDMsODMuNzc4IEMxMTEuNTA2LDg0LjQxNCAxMTEuNTAzLDg1LjA3MSAxMTEuNzMyLDg1LjcwNiBDMTEzLjI3LDg5Ljk3MyAxMTUuOTY4LDk0LjA2OSAxMTkuNzI3LDk3Ljg0MSBMMTIwLjI1OSw5OC42ODYgQzEyMC4yNiw5OC42ODUgOTQuMjgyLDExMy42ODMgOTQuMjgyLDExMy42ODMgTDcwLjE2Nyw5OS43NjEgTDE0NS42ODUsNTYuMTYxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik05NC4yODIsMTEzLjgxOCBMOTQuMjIzLDExMy43ODUgTDY5LjkzMyw5OS43NjEgTDcwLjEwOCw5OS42NiBMMTQ1LjY4NSw1Ni4wMjYgTDE0NS43NDMsNTYuMDU5IEwxNzAuMDMzLDcwLjA4MyBMMTQzLjg0Miw4NS4yMDUgTDE0My43OTcsODUuMTk1IEMxNDMuNzcyLDg1LjE5IDE0Mi4zMzYsODQuODg4IDE0Mi4zMzYsODQuODg4IEMxMzUuNzg3LDgyLjcxNCAxMjguNzIzLDgxLjE2MyAxMjEuMzI3LDgwLjI3NCBDMTIwLjc4OCw4MC4yMDkgMTIwLjIzNiw4MC4xNzcgMTE5LjY4OSw4MC4xNzcgQzExNS45MzEsODAuMTc3IDExMi42MzUsODEuNzA4IDExMS44NTIsODMuODE5IEMxMTEuNjI0LDg0LjQzMiAxMTEuNjIxLDg1LjA1MyAxMTEuODQyLDg1LjY2NyBDMTEzLjM3Nyw4OS45MjUgMTE2LjA1OCw5My45OTMgMTE5LjgxLDk3Ljc1OCBMMTE5LjgyNiw5Ny43NzkgTDEyMC4zNTIsOTguNjE0IEMxMjAuMzU0LDk4LjYxNyAxMjAuMzU2LDk4LjYyIDEyMC4zNTgsOTguNjI0IEwxMjAuNDIyLDk4LjcyNiBMMTIwLjMxNyw5OC43ODcgQzEyMC4yNjQsOTguODE4IDk0LjU5OSwxMTMuNjM1IDk0LjM0LDExMy43ODUgTDk0LjI4MiwxMTMuODE4IEw5NC4yODIsMTEzLjgxOCBaIE03MC40MDEsOTkuNzYxIEw5NC4yODIsMTEzLjU0OSBMMTE5LjA4NCw5OS4yMjkgQzExOS42Myw5OC45MTQgMTE5LjkzLDk4Ljc0IDEyMC4xMDEsOTguNjU0IEwxMTkuNjM1LDk3LjkxNCBDMTE1Ljg2NCw5NC4xMjcgMTEzLjE2OCw5MC4wMzMgMTExLjYyMiw4NS43NDYgQzExMS4zODIsODUuMDc5IDExMS4zODYsODQuNDA0IDExMS42MzMsODMuNzM4IEMxMTIuNDQ4LDgxLjUzOSAxMTUuODM2LDc5Ljk0MyAxMTkuNjg5LDc5Ljk0MyBDMTIwLjI0Niw3OS45NDMgMTIwLjgwNiw3OS45NzYgMTIxLjM1NSw4MC4wNDIgQzEyOC43NjcsODAuOTMzIDEzNS44NDYsODIuNDg3IDE0Mi4zOTYsODQuNjYzIEMxNDMuMjMyLDg0LjgzOCAxNDMuNjExLDg0LjkxNyAxNDMuNzg2LDg0Ljk2NyBMMTY5LjU2Niw3MC4wODMgTDE0NS42ODUsNTYuMjk1IEw3MC40MDEsOTkuNzYxIEw3MC40MDEsOTkuNzYxIFoiIGlkPSJGaWxsLTEyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2Ny4yMywxOC45NzkgTDE2Ny4yMyw2OS44NSBMMTM5LjkwOSw4NS42MjMgTDEzMy40NDgsNzEuNDU2IEMxMzIuNTM4LDY5LjQ2IDEzMC4wMiw2OS43MTggMTI3LjgyNCw3Mi4wMyBDMTI2Ljc2OSw3My4xNCAxMjUuOTMxLDc0LjU4NSAxMjUuNDk0LDc2LjA0OCBMMTE5LjAzNCw5Ny42NzYgTDkxLjcxMiwxMTMuNDUgTDkxLjcxMiw2Mi41NzkgTDE2Ny4yMywxOC45NzkiIGlkPSJGaWxsLTEzIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTkxLjcxMiwxMTMuNTY3IEM5MS42OTIsMTEzLjU2NyA5MS42NzIsMTEzLjU2MSA5MS42NTMsMTEzLjU1MSBDOTEuNjE4LDExMy41MyA5MS41OTUsMTEzLjQ5MiA5MS41OTUsMTEzLjQ1IEw5MS41OTUsNjIuNTc5IEM5MS41OTUsNjIuNTM3IDkxLjYxOCw2Mi40OTkgOTEuNjUzLDYyLjQ3OCBMMTY3LjE3MiwxOC44NzggQzE2Ny4yMDgsMTguODU3IDE2Ny4yNTIsMTguODU3IDE2Ny4yODgsMTguODc4IEMxNjcuMzI0LDE4Ljg5OSAxNjcuMzQ3LDE4LjkzNyAxNjcuMzQ3LDE4Ljk3OSBMMTY3LjM0Nyw2OS44NSBDMTY3LjM0Nyw2OS44OTEgMTY3LjMyNCw2OS45MyAxNjcuMjg4LDY5Ljk1IEwxMzkuOTY3LDg1LjcyNSBDMTM5LjkzOSw4NS43NDEgMTM5LjkwNSw4NS43NDUgMTM5Ljg3Myw4NS43MzUgQzEzOS44NDIsODUuNzI1IDEzOS44MTYsODUuNzAyIDEzOS44MDIsODUuNjcyIEwxMzMuMzQyLDcxLjUwNCBDMTMyLjk2Nyw3MC42ODIgMTMyLjI4LDcwLjIyOSAxMzEuNDA4LDcwLjIyOSBDMTMwLjMxOSw3MC4yMjkgMTI5LjA0NCw3MC45MTUgMTI3LjkwOCw3Mi4xMSBDMTI2Ljg3NCw3My4yIDEyNi4wMzQsNzQuNjQ3IDEyNS42MDYsNzYuMDgyIEwxMTkuMTQ2LDk3LjcwOSBDMTE5LjEzNyw5Ny43MzggMTE5LjExOCw5Ny43NjIgMTE5LjA5Miw5Ny43NzcgTDkxLjc3LDExMy41NTEgQzkxLjc1MiwxMTMuNTYxIDkxLjczMiwxMTMuNTY3IDkxLjcxMiwxMTMuNTY3IEw5MS43MTIsMTEzLjU2NyBaIE05MS44MjksNjIuNjQ3IEw5MS44MjksMTEzLjI0OCBMMTE4LjkzNSw5Ny41OTggTDEyNS4zODIsNzYuMDE1IEMxMjUuODI3LDc0LjUyNSAxMjYuNjY0LDczLjA4MSAxMjcuNzM5LDcxLjk1IEMxMjguOTE5LDcwLjcwOCAxMzAuMjU2LDY5Ljk5NiAxMzEuNDA4LDY5Ljk5NiBDMTMyLjM3Nyw2OS45OTYgMTMzLjEzOSw3MC40OTcgMTMzLjU1NCw3MS40MDcgTDEzOS45NjEsODUuNDU4IEwxNjcuMTEzLDY5Ljc4MiBMMTY3LjExMywxOS4xODEgTDkxLjgyOSw2Mi42NDcgTDkxLjgyOSw2Mi42NDcgWiIgaWQ9IkZpbGwtMTQiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTY4LjU0MywxOS4yMTMgTDE2OC41NDMsNzAuMDgzIEwxNDEuMjIxLDg1Ljg1NyBMMTM0Ljc2MSw3MS42ODkgQzEzMy44NTEsNjkuNjk0IDEzMS4zMzMsNjkuOTUxIDEyOS4xMzcsNzIuMjYzIEMxMjguMDgyLDczLjM3NCAxMjcuMjQ0LDc0LjgxOSAxMjYuODA3LDc2LjI4MiBMMTIwLjM0Niw5Ny45MDkgTDkzLjAyNSwxMTMuNjgzIEw5My4wMjUsNjIuODEzIEwxNjguNTQzLDE5LjIxMyIgaWQ9IkZpbGwtMTUiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTMuMDI1LDExMy44IEM5My4wMDUsMTEzLjggOTIuOTg0LDExMy43OTUgOTIuOTY2LDExMy43ODUgQzkyLjkzMSwxMTMuNzY0IDkyLjkwOCwxMTMuNzI1IDkyLjkwOCwxMTMuNjg0IEw5Mi45MDgsNjIuODEzIEM5Mi45MDgsNjIuNzcxIDkyLjkzMSw2Mi43MzMgOTIuOTY2LDYyLjcxMiBMMTY4LjQ4NCwxOS4xMTIgQzE2OC41MiwxOS4wOSAxNjguNTY1LDE5LjA5IDE2OC42MDEsMTkuMTEyIEMxNjguNjM3LDE5LjEzMiAxNjguNjYsMTkuMTcxIDE2OC42NiwxOS4yMTIgTDE2OC42Niw3MC4wODMgQzE2OC42Niw3MC4xMjUgMTY4LjYzNyw3MC4xNjQgMTY4LjYwMSw3MC4xODQgTDE0MS4yOCw4NS45NTggQzE0MS4yNTEsODUuOTc1IDE0MS4yMTcsODUuOTc5IDE0MS4xODYsODUuOTY4IEMxNDEuMTU0LDg1Ljk1OCAxNDEuMTI5LDg1LjkzNiAxNDEuMTE1LDg1LjkwNiBMMTM0LjY1NSw3MS43MzggQzEzNC4yOCw3MC45MTUgMTMzLjU5Myw3MC40NjMgMTMyLjcyLDcwLjQ2MyBDMTMxLjYzMiw3MC40NjMgMTMwLjM1Nyw3MS4xNDggMTI5LjIyMSw3Mi4zNDQgQzEyOC4xODYsNzMuNDMzIDEyNy4zNDcsNzQuODgxIDEyNi45MTksNzYuMzE1IEwxMjAuNDU4LDk3Ljk0MyBDMTIwLjQ1LDk3Ljk3MiAxMjAuNDMxLDk3Ljk5NiAxMjAuNDA1LDk4LjAxIEw5My4wODMsMTEzLjc4NSBDOTMuMDY1LDExMy43OTUgOTMuMDQ1LDExMy44IDkzLjAyNSwxMTMuOCBMOTMuMDI1LDExMy44IFogTTkzLjE0Miw2Mi44ODEgTDkzLjE0MiwxMTMuNDgxIEwxMjAuMjQ4LDk3LjgzMiBMMTI2LjY5NSw3Ni4yNDggQzEyNy4xNCw3NC43NTggMTI3Ljk3Nyw3My4zMTUgMTI5LjA1Miw3Mi4xODMgQzEzMC4yMzEsNzAuOTQyIDEzMS41NjgsNzAuMjI5IDEzMi43Miw3MC4yMjkgQzEzMy42ODksNzAuMjI5IDEzNC40NTIsNzAuNzMxIDEzNC44NjcsNzEuNjQxIEwxNDEuMjc0LDg1LjY5MiBMMTY4LjQyNiw3MC4wMTYgTDE2OC40MjYsMTkuNDE1IEw5My4xNDIsNjIuODgxIEw5My4xNDIsNjIuODgxIFoiIGlkPSJGaWxsLTE2IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS44LDcwLjA4MyBMMTQyLjQ3OCw4NS44NTcgTDEzNi4wMTgsNzEuNjg5IEMxMzUuMTA4LDY5LjY5NCAxMzIuNTksNjkuOTUxIDEzMC4zOTMsNzIuMjYzIEMxMjkuMzM5LDczLjM3NCAxMjguNSw3NC44MTkgMTI4LjA2NCw3Ni4yODIgTDEyMS42MDMsOTcuOTA5IEw5NC4yODIsMTEzLjY4MyBMOTQuMjgyLDYyLjgxMyBMMTY5LjgsMTkuMjEzIEwxNjkuOCw3MC4wODMgWiIgaWQ9IkZpbGwtMTciIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTQuMjgyLDExMy45MTcgQzk0LjI0MSwxMTMuOTE3IDk0LjIwMSwxMTMuOTA3IDk0LjE2NSwxMTMuODg2IEM5NC4wOTMsMTEzLjg0NSA5NC4wNDgsMTEzLjc2NyA5NC4wNDgsMTEzLjY4NCBMOTQuMDQ4LDYyLjgxMyBDOTQuMDQ4LDYyLjczIDk0LjA5Myw2Mi42NTIgOTQuMTY1LDYyLjYxMSBMMTY5LjY4MywxOS4wMSBDMTY5Ljc1NSwxOC45NjkgMTY5Ljg0NCwxOC45NjkgMTY5LjkxNywxOS4wMSBDMTY5Ljk4OSwxOS4wNTIgMTcwLjAzMywxOS4xMjkgMTcwLjAzMywxOS4yMTIgTDE3MC4wMzMsNzAuMDgzIEMxNzAuMDMzLDcwLjE2NiAxNjkuOTg5LDcwLjI0NCAxNjkuOTE3LDcwLjI4NSBMMTQyLjU5NSw4Ni4wNiBDMTQyLjUzOCw4Ni4wOTIgMTQyLjQ2OSw4Ni4xIDE0Mi40MDcsODYuMDggQzE0Mi4zNDQsODYuMDYgMTQyLjI5Myw4Ni4wMTQgMTQyLjI2Niw4NS45NTQgTDEzNS44MDUsNzEuNzg2IEMxMzUuNDQ1LDcwLjk5NyAxMzQuODEzLDcwLjU4IDEzMy45NzcsNzAuNTggQzEzMi45MjEsNzAuNTggMTMxLjY3Niw3MS4yNTIgMTMwLjU2Miw3Mi40MjQgQzEyOS41NCw3My41MDEgMTI4LjcxMSw3NC45MzEgMTI4LjI4Nyw3Ni4zNDggTDEyMS44MjcsOTcuOTc2IEMxMjEuODEsOTguMDM0IDEyMS43NzEsOTguMDgyIDEyMS43Miw5OC4xMTIgTDk0LjM5OCwxMTMuODg2IEM5NC4zNjIsMTEzLjkwNyA5NC4zMjIsMTEzLjkxNyA5NC4yODIsMTEzLjkxNyBMOTQuMjgyLDExMy45MTcgWiBNOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDExMy4yNzkgTDEyMS40MDYsOTcuNzU0IEwxMjcuODQsNzYuMjE1IEMxMjguMjksNzQuNzA4IDEyOS4xMzcsNzMuMjQ3IDEzMC4yMjQsNzIuMTAzIEMxMzEuNDI1LDcwLjgzOCAxMzIuNzkzLDcwLjExMiAxMzMuOTc3LDcwLjExMiBDMTM0Ljk5NSw3MC4xMTIgMTM1Ljc5NSw3MC42MzggMTM2LjIzLDcxLjU5MiBMMTQyLjU4NCw4NS41MjYgTDE2OS41NjYsNjkuOTQ4IEwxNjkuNTY2LDE5LjYxNyBMOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDYyLjk0OCBaIiBpZD0iRmlsbC0xOCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMDkuODk0LDkyLjk0MyBMMTA5Ljg5NCw5Mi45NDMgQzEwOC4xMiw5Mi45NDMgMTA2LjY1Myw5Mi4yMTggMTA1LjY1LDkwLjgyMyBDMTA1LjU4Myw5MC43MzEgMTA1LjU5Myw5MC42MSAxMDUuNjczLDkwLjUyOSBDMTA1Ljc1Myw5MC40NDggMTA1Ljg4LDkwLjQ0IDEwNS45NzQsOTAuNTA2IEMxMDYuNzU0LDkxLjA1MyAxMDcuNjc5LDkxLjMzMyAxMDguNzI0LDkxLjMzMyBDMTEwLjA0Nyw5MS4zMzMgMTExLjQ3OCw5MC44OTQgMTEyLjk4LDkwLjAyNyBDMTE4LjI5MSw4Ni45NiAxMjIuNjExLDc5LjUwOSAxMjIuNjExLDczLjQxNiBDMTIyLjYxMSw3MS40ODkgMTIyLjE2OSw2OS44NTYgMTIxLjMzMyw2OC42OTIgQzEyMS4yNjYsNjguNiAxMjEuMjc2LDY4LjQ3MyAxMjEuMzU2LDY4LjM5MiBDMTIxLjQzNiw2OC4zMTEgMTIxLjU2Myw2OC4yOTkgMTIxLjY1Niw2OC4zNjUgQzEyMy4zMjcsNjkuNTM3IDEyNC4yNDcsNzEuNzQ2IDEyNC4yNDcsNzQuNTg0IEMxMjQuMjQ3LDgwLjgyNiAxMTkuODIxLDg4LjQ0NyAxMTQuMzgyLDkxLjU4NyBDMTEyLjgwOCw5Mi40OTUgMTExLjI5OCw5Mi45NDMgMTA5Ljg5NCw5Mi45NDMgTDEwOS44OTQsOTIuOTQzIFogTTEwNi45MjUsOTEuNDAxIEMxMDcuNzM4LDkyLjA1MiAxMDguNzQ1LDkyLjI3OCAxMDkuODkzLDkyLjI3OCBMMTA5Ljg5NCw5Mi4yNzggQzExMS4yMTUsOTIuMjc4IDExMi42NDcsOTEuOTUxIDExNC4xNDgsOTEuMDg0IEMxMTkuNDU5LDg4LjAxNyAxMjMuNzgsODAuNjIxIDEyMy43OCw3NC41MjggQzEyMy43OCw3Mi41NDkgMTIzLjMxNyw3MC45MjkgMTIyLjQ1NCw2OS43NjcgQzEyMi44NjUsNzAuODAyIDEyMy4wNzksNzIuMDQyIDEyMy4wNzksNzMuNDAyIEMxMjMuMDc5LDc5LjY0NSAxMTguNjUzLDg3LjI4NSAxMTMuMjE0LDkwLjQyNSBDMTExLjY0LDkxLjMzNCAxMTAuMTMsOTEuNzQyIDEwOC43MjQsOTEuNzQyIEMxMDguMDgzLDkxLjc0MiAxMDcuNDgxLDkxLjU5MyAxMDYuOTI1LDkxLjQwMSBMMTA2LjkyNSw5MS40MDEgWiIgaWQ9IkZpbGwtMTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjA5Nyw5MC4yMyBDMTE4LjQ4MSw4Ny4xMjIgMTIyLjg0NSw3OS41OTQgMTIyLjg0NSw3My40MTYgQzEyMi44NDUsNzEuMzY1IDEyMi4zNjIsNjkuNzI0IDEyMS41MjIsNjguNTU2IEMxMTkuNzM4LDY3LjMwNCAxMTcuMTQ4LDY3LjM2MiAxMTQuMjY1LDY5LjAyNiBDMTA4Ljg4MSw3Mi4xMzQgMTA0LjUxNyw3OS42NjIgMTA0LjUxNyw4NS44NCBDMTA0LjUxNyw4Ny44OTEgMTA1LDg5LjUzMiAxMDUuODQsOTAuNyBDMTA3LjYyNCw5MS45NTIgMTEwLjIxNCw5MS44OTQgMTEzLjA5Nyw5MC4yMyIgaWQ9IkZpbGwtMjAiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTA4LjcyNCw5MS42MTQgTDEwOC43MjQsOTEuNjE0IEMxMDcuNTgyLDkxLjYxNCAxMDYuNTY2LDkxLjQwMSAxMDUuNzA1LDkwLjc5NyBDMTA1LjY4NCw5MC43ODMgMTA1LjY2NSw5MC44MTEgMTA1LjY1LDkwLjc5IEMxMDQuNzU2LDg5LjU0NiAxMDQuMjgzLDg3Ljg0MiAxMDQuMjgzLDg1LjgxNyBDMTA0LjI4Myw3OS41NzUgMTA4LjcwOSw3MS45NTMgMTE0LjE0OCw2OC44MTIgQzExNS43MjIsNjcuOTA0IDExNy4yMzIsNjcuNDQ5IDExOC42MzgsNjcuNDQ5IEMxMTkuNzgsNjcuNDQ5IDEyMC43OTYsNjcuNzU4IDEyMS42NTYsNjguMzYyIEMxMjEuNjc4LDY4LjM3NyAxMjEuNjk3LDY4LjM5NyAxMjEuNzEyLDY4LjQxOCBDMTIyLjYwNiw2OS42NjIgMTIzLjA3OSw3MS4zOSAxMjMuMDc5LDczLjQxNSBDMTIzLjA3OSw3OS42NTggMTE4LjY1Myw4Ny4xOTggMTEzLjIxNCw5MC4zMzggQzExMS42NCw5MS4yNDcgMTEwLjEzLDkxLjYxNCAxMDguNzI0LDkxLjYxNCBMMTA4LjcyNCw5MS42MTQgWiBNMTA2LjAwNiw5MC41MDUgQzEwNi43OCw5MS4wMzcgMTA3LjY5NCw5MS4yODEgMTA4LjcyNCw5MS4yODEgQzExMC4wNDcsOTEuMjgxIDExMS40NzgsOTAuODY4IDExMi45OCw5MC4wMDEgQzExOC4yOTEsODYuOTM1IDEyMi42MTEsNzkuNDk2IDEyMi42MTEsNzMuNDAzIEMxMjIuNjExLDcxLjQ5NCAxMjIuMTc3LDY5Ljg4IDEyMS4zNTYsNjguNzE4IEMxMjAuNTgyLDY4LjE4NSAxMTkuNjY4LDY3LjkxOSAxMTguNjM4LDY3LjkxOSBDMTE3LjMxNSw2Ny45MTkgMTE1Ljg4Myw2OC4zNiAxMTQuMzgyLDY5LjIyNyBDMTA5LjA3MSw3Mi4yOTMgMTA0Ljc1MSw3OS43MzMgMTA0Ljc1MSw4NS44MjYgQzEwNC43NTEsODcuNzM1IDEwNS4xODUsODkuMzQzIDEwNi4wMDYsOTAuNTA1IEwxMDYuMDA2LDkwLjUwNSBaIiBpZD0iRmlsbC0yMSIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDkuMzE4LDcuMjYyIEwxMzkuMzM0LDE2LjE0IEwxNTUuMjI3LDI3LjE3MSBMMTYwLjgxNiwyMS4wNTkgTDE0OS4zMTgsNy4yNjIiIGlkPSJGaWxsLTIyIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS42NzYsMTMuODQgTDE1OS45MjgsMTkuNDY3IEMxNTYuMjg2LDIxLjU3IDE1MC40LDIxLjU4IDE0Ni43ODEsMTkuNDkxIEMxNDMuMTYxLDE3LjQwMiAxNDMuMTgsMTQuMDAzIDE0Ni44MjIsMTEuOSBMMTU2LjMxNyw2LjI5MiBMMTQ5LjU4OCwyLjQwNyBMNjcuNzUyLDQ5LjQ3OCBMMTEzLjY3NSw3NS45OTIgTDExNi43NTYsNzQuMjEzIEMxMTcuMzg3LDczLjg0OCAxMTcuNjI1LDczLjMxNSAxMTcuMzc0LDcyLjgyMyBDMTE1LjAxNyw2OC4xOTEgMTE0Ljc4MSw2My4yNzcgMTE2LjY5MSw1OC41NjEgQzEyMi4zMjksNDQuNjQxIDE0MS4yLDMzLjc0NiAxNjUuMzA5LDMwLjQ5MSBDMTczLjQ3OCwyOS4zODggMTgxLjk4OSwyOS41MjQgMTkwLjAxMywzMC44ODUgQzE5MC44NjUsMzEuMDMgMTkxLjc4OSwzMC44OTMgMTkyLjQyLDMwLjUyOCBMMTk1LjUwMSwyOC43NSBMMTY5LjY3NiwxMy44NCIgaWQ9IkZpbGwtMjMiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3Ni40NTkgQzExMy41OTQsNzYuNDU5IDExMy41MTQsNzYuNDM4IDExMy40NDIsNzYuMzk3IEw2Ny41MTgsNDkuODgyIEM2Ny4zNzQsNDkuNzk5IDY3LjI4NCw0OS42NDUgNjcuMjg1LDQ5LjQ3OCBDNjcuMjg1LDQ5LjMxMSA2Ny4zNzQsNDkuMTU3IDY3LjUxOSw0OS4wNzMgTDE0OS4zNTUsMi4wMDIgQzE0OS40OTksMS45MTkgMTQ5LjY3NywxLjkxOSAxNDkuODIxLDIuMDAyIEwxNTYuNTUsNS44ODcgQzE1Ni43NzQsNi4wMTcgMTU2Ljg1LDYuMzAyIDE1Ni43MjIsNi41MjYgQzE1Ni41OTIsNi43NDkgMTU2LjMwNyw2LjgyNiAxNTYuMDgzLDYuNjk2IEwxNDkuNTg3LDIuOTQ2IEw2OC42ODcsNDkuNDc5IEwxMTMuNjc1LDc1LjQ1MiBMMTE2LjUyMyw3My44MDggQzExNi43MTUsNzMuNjk3IDExNy4xNDMsNzMuMzk5IDExNi45NTgsNzMuMDM1IEMxMTQuNTQyLDY4LjI4NyAxMTQuMyw2My4yMjEgMTE2LjI1OCw1OC4zODUgQzExOS4wNjQsNTEuNDU4IDEyNS4xNDMsNDUuMTQzIDEzMy44NCw0MC4xMjIgQzE0Mi40OTcsMzUuMTI0IDE1My4zNTgsMzEuNjMzIDE2NS4yNDcsMzAuMDI4IEMxNzMuNDQ1LDI4LjkyMSAxODIuMDM3LDI5LjA1OCAxOTAuMDkxLDMwLjQyNSBDMTkwLjgzLDMwLjU1IDE5MS42NTIsMzAuNDMyIDE5Mi4xODYsMzAuMTI0IEwxOTQuNTY3LDI4Ljc1IEwxNjkuNDQyLDE0LjI0NCBDMTY5LjIxOSwxNC4xMTUgMTY5LjE0MiwxMy44MjkgMTY5LjI3MSwxMy42MDYgQzE2OS40LDEzLjM4MiAxNjkuNjg1LDEzLjMwNiAxNjkuOTA5LDEzLjQzNSBMMTk1LjczNCwyOC4zNDUgQzE5NS44NzksMjguNDI4IDE5NS45NjgsMjguNTgzIDE5NS45NjgsMjguNzUgQzE5NS45NjgsMjguOTE2IDE5NS44NzksMjkuMDcxIDE5NS43MzQsMjkuMTU0IEwxOTIuNjUzLDMwLjkzMyBDMTkxLjkzMiwzMS4zNSAxOTAuODksMzEuNTA4IDE4OS45MzUsMzEuMzQ2IEMxODEuOTcyLDI5Ljk5NSAxNzMuNDc4LDI5Ljg2IDE2NS4zNzIsMzAuOTU0IEMxNTMuNjAyLDMyLjU0MyAxNDIuODYsMzUuOTkzIDEzNC4zMDcsNDAuOTMxIEMxMjUuNzkzLDQ1Ljg0NyAxMTkuODUxLDUyLjAwNCAxMTcuMTI0LDU4LjczNiBDMTE1LjI3LDYzLjMxNCAxMTUuNTAxLDY4LjExMiAxMTcuNzksNzIuNjExIEMxMTguMTYsNzMuMzM2IDExNy44NDUsNzQuMTI0IDExNi45OSw3NC42MTcgTDExMy45MDksNzYuMzk3IEMxMTMuODM2LDc2LjQzOCAxMTMuNzU2LDc2LjQ1OSAxMTMuNjc1LDc2LjQ1OSIgaWQ9IkZpbGwtMjQiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUzLjMxNiwyMS4yNzkgQzE1MC45MDMsMjEuMjc5IDE0OC40OTUsMjAuNzUxIDE0Ni42NjQsMTkuNjkzIEMxNDQuODQ2LDE4LjY0NCAxNDMuODQ0LDE3LjIzMiAxNDMuODQ0LDE1LjcxOCBDMTQzLjg0NCwxNC4xOTEgMTQ0Ljg2LDEyLjc2MyAxNDYuNzA1LDExLjY5OCBMMTU2LjE5OCw2LjA5MSBDMTU2LjMwOSw2LjAyNSAxNTYuNDUyLDYuMDYyIDE1Ni41MTgsNi4xNzMgQzE1Ni41ODMsNi4yODQgMTU2LjU0Nyw2LjQyNyAxNTYuNDM2LDYuNDkzIEwxNDYuOTQsMTIuMTAyIEMxNDUuMjQ0LDEzLjA4MSAxNDQuMzEyLDE0LjM2NSAxNDQuMzEyLDE1LjcxOCBDMTQ0LjMxMiwxNy4wNTggMTQ1LjIzLDE4LjMyNiAxNDYuODk3LDE5LjI4OSBDMTUwLjQ0NiwyMS4zMzggMTU2LjI0LDIxLjMyNyAxNTkuODExLDE5LjI2NSBMMTY5LjU1OSwxMy42MzcgQzE2OS42NywxMy41NzMgMTY5LjgxMywxMy42MTEgMTY5Ljg3OCwxMy43MjMgQzE2OS45NDMsMTMuODM0IDE2OS45MDQsMTMuOTc3IDE2OS43OTMsMTQuMDQyIEwxNjAuMDQ1LDE5LjY3IEMxNTguMTg3LDIwLjc0MiAxNTUuNzQ5LDIxLjI3OSAxNTMuMzE2LDIxLjI3OSIgaWQ9IkZpbGwtMjUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3NS45OTIgTDY3Ljc2Miw0OS40ODQiIGlkPSJGaWxsLTI2IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMy42NzUsNzYuMzQyIEMxMTMuNjE1LDc2LjM0MiAxMTMuNTU1LDc2LjMyNyAxMTMuNSw3Ni4yOTUgTDY3LjU4Nyw0OS43ODcgQzY3LjQxOSw0OS42OSA2Ny4zNjIsNDkuNDc2IDY3LjQ1OSw0OS4zMDkgQzY3LjU1Niw0OS4xNDEgNjcuNzcsNDkuMDgzIDY3LjkzNyw0OS4xOCBMMTEzLjg1LDc1LjY4OCBDMTE0LjAxOCw3NS43ODUgMTE0LjA3NSw3NiAxMTMuOTc4LDc2LjE2NyBDMTEzLjkxNCw3Ni4yNzkgMTEzLjc5Niw3Ni4zNDIgMTEzLjY3NSw3Ni4zNDIiIGlkPSJGaWxsLTI3IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY3Ljc2Miw0OS40ODQgTDY3Ljc2MiwxMDMuNDg1IEM2Ny43NjIsMTA0LjU3NSA2OC41MzIsMTA1LjkwMyA2OS40ODIsMTA2LjQ1MiBMMTExLjk1NSwxMzAuOTczIEMxMTIuOTA1LDEzMS41MjIgMTEzLjY3NSwxMzEuMDgzIDExMy42NzUsMTI5Ljk5MyBMMTEzLjY3NSw3NS45OTIiIGlkPSJGaWxsLTI4IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMi43MjcsMTMxLjU2MSBDMTEyLjQzLDEzMS41NjEgMTEyLjEwNywxMzEuNDY2IDExMS43OCwxMzEuMjc2IEw2OS4zMDcsMTA2Ljc1NSBDNjguMjQ0LDEwNi4xNDIgNjcuNDEyLDEwNC43MDUgNjcuNDEyLDEwMy40ODUgTDY3LjQxMiw0OS40ODQgQzY3LjQxMiw0OS4yOSA2Ny41NjksNDkuMTM0IDY3Ljc2Miw0OS4xMzQgQzY3Ljk1Niw0OS4xMzQgNjguMTEzLDQ5LjI5IDY4LjExMyw0OS40ODQgTDY4LjExMywxMDMuNDg1IEM2OC4xMTMsMTA0LjQ0NSA2OC44MiwxMDUuNjY1IDY5LjY1NywxMDYuMTQ4IEwxMTIuMTMsMTMwLjY3IEMxMTIuNDc0LDEzMC44NjggMTEyLjc5MSwxMzAuOTEzIDExMywxMzAuNzkyIEMxMTMuMjA2LDEzMC42NzMgMTEzLjMyNSwxMzAuMzgxIDExMy4zMjUsMTI5Ljk5MyBMMTEzLjMyNSw3NS45OTIgQzExMy4zMjUsNzUuNzk4IDExMy40ODIsNzUuNjQxIDExMy42NzUsNzUuNjQxIEMxMTMuODY5LDc1LjY0MSAxMTQuMDI1LDc1Ljc5OCAxMTQuMDI1LDc1Ljk5MiBMMTE0LjAyNSwxMjkuOTkzIEMxMTQuMDI1LDEzMC42NDggMTEzLjc4NiwxMzEuMTQ3IDExMy4zNSwxMzEuMzk5IEMxMTMuMTYyLDEzMS41MDcgMTEyLjk1MiwxMzEuNTYxIDExMi43MjcsMTMxLjU2MSIgaWQ9IkZpbGwtMjkiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEyLjg2LDQwLjUxMiBDMTEyLjg2LDQwLjUxMiAxMTIuODYsNDAuNTEyIDExMi44NTksNDAuNTEyIEMxMTAuNTQxLDQwLjUxMiAxMDguMzYsMzkuOTkgMTA2LjcxNywzOS4wNDEgQzEwNS4wMTIsMzguMDU3IDEwNC4wNzQsMzYuNzI2IDEwNC4wNzQsMzUuMjkyIEMxMDQuMDc0LDMzLjg0NyAxMDUuMDI2LDMyLjUwMSAxMDYuNzU0LDMxLjUwNCBMMTE4Ljc5NSwyNC41NTEgQzEyMC40NjMsMjMuNTg5IDEyMi42NjksMjMuMDU4IDEyNS4wMDcsMjMuMDU4IEMxMjcuMzI1LDIzLjA1OCAxMjkuNTA2LDIzLjU4MSAxMzEuMTUsMjQuNTMgQzEzMi44NTQsMjUuNTE0IDEzMy43OTMsMjYuODQ1IDEzMy43OTMsMjguMjc4IEMxMzMuNzkzLDI5LjcyNCAxMzIuODQxLDMxLjA2OSAxMzEuMTEzLDMyLjA2NyBMMTE5LjA3MSwzOS4wMTkgQzExNy40MDMsMzkuOTgyIDExNS4xOTcsNDAuNTEyIDExMi44Niw0MC41MTIgTDExMi44Niw0MC41MTIgWiBNMTI1LjAwNywyMy43NTkgQzEyMi43OSwyMy43NTkgMTIwLjcwOSwyNC4yNTYgMTE5LjE0NiwyNS4xNTggTDEwNy4xMDQsMzIuMTEgQzEwNS42MDIsMzIuOTc4IDEwNC43NzQsMzQuMTA4IDEwNC43NzQsMzUuMjkyIEMxMDQuNzc0LDM2LjQ2NSAxMDUuNTg5LDM3LjU4MSAxMDcuMDY3LDM4LjQzNCBDMTA4LjYwNSwzOS4zMjMgMTEwLjY2MywzOS44MTIgMTEyLjg1OSwzOS44MTIgTDExMi44NiwzOS44MTIgQzExNS4wNzYsMzkuODEyIDExNy4xNTgsMzkuMzE1IDExOC43MjEsMzguNDEzIEwxMzAuNzYyLDMxLjQ2IEMxMzIuMjY0LDMwLjU5MyAxMzMuMDkyLDI5LjQ2MyAxMzMuMDkyLDI4LjI3OCBDMTMzLjA5MiwyNy4xMDYgMTMyLjI3OCwyNS45OSAxMzAuOCwyNS4xMzYgQzEyOS4yNjEsMjQuMjQ4IDEyNy4yMDQsMjMuNzU5IDEyNS4wMDcsMjMuNzU5IEwxMjUuMDA3LDIzLjc1OSBaIiBpZD0iRmlsbC0zMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNjUuNjMsMTYuMjE5IEwxNTkuODk2LDE5LjUzIEMxNTYuNzI5LDIxLjM1OCAxNTEuNjEsMjEuMzY3IDE0OC40NjMsMTkuNTUgQzE0NS4zMTYsMTcuNzMzIDE0NS4zMzIsMTQuNzc4IDE0OC40OTksMTIuOTQ5IEwxNTQuMjMzLDkuNjM5IEwxNjUuNjMsMTYuMjE5IiBpZD0iRmlsbC0zMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNTQuMjMzLDEwLjQ0OCBMMTY0LjIyOCwxNi4yMTkgTDE1OS41NDYsMTguOTIzIEMxNTguMTEyLDE5Ljc1IDE1Ni4xOTQsMjAuMjA2IDE1NC4xNDcsMjAuMjA2IEMxNTIuMTE4LDIwLjIwNiAxNTAuMjI0LDE5Ljc1NyAxNDguODE0LDE4Ljk0MyBDMTQ3LjUyNCwxOC4xOTkgMTQ2LjgxNCwxNy4yNDkgMTQ2LjgxNCwxNi4yNjkgQzE0Ni44MTQsMTUuMjc4IDE0Ny41MzcsMTQuMzE0IDE0OC44NSwxMy41NTYgTDE1NC4yMzMsMTAuNDQ4IE0xNTQuMjMzLDkuNjM5IEwxNDguNDk5LDEyLjk0OSBDMTQ1LjMzMiwxNC43NzggMTQ1LjMxNiwxNy43MzMgMTQ4LjQ2MywxOS41NSBDMTUwLjAzMSwyMC40NTUgMTUyLjA4NiwyMC45MDcgMTU0LjE0NywyMC45MDcgQzE1Ni4yMjQsMjAuOTA3IDE1OC4zMDYsMjAuNDQ3IDE1OS44OTYsMTkuNTMgTDE2NS42MywxNi4yMTkgTDE1NC4yMzMsOS42MzkiIGlkPSJGaWxsLTMyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NS40NDUsNzIuNjY3IEwxNDUuNDQ1LDcyLjY2NyBDMTQzLjY3Miw3Mi42NjcgMTQyLjIwNCw3MS44MTcgMTQxLjIwMiw3MC40MjIgQzE0MS4xMzUsNzAuMzMgMTQxLjE0NSw3MC4xNDcgMTQxLjIyNSw3MC4wNjYgQzE0MS4zMDUsNjkuOTg1IDE0MS40MzIsNjkuOTQ2IDE0MS41MjUsNzAuMDExIEMxNDIuMzA2LDcwLjU1OSAxNDMuMjMxLDcwLjgyMyAxNDQuMjc2LDcwLjgyMiBDMTQ1LjU5OCw3MC44MjIgMTQ3LjAzLDcwLjM3NiAxNDguNTMyLDY5LjUwOSBDMTUzLjg0Miw2Ni40NDMgMTU4LjE2Myw1OC45ODcgMTU4LjE2Myw1Mi44OTQgQzE1OC4xNjMsNTAuOTY3IDE1Ny43MjEsNDkuMzMyIDE1Ni44ODQsNDguMTY4IEMxNTYuODE4LDQ4LjA3NiAxNTYuODI4LDQ3Ljk0OCAxNTYuOTA4LDQ3Ljg2NyBDMTU2Ljk4OCw0Ny43ODYgMTU3LjExNCw0Ny43NzQgMTU3LjIwOCw0Ny44NCBDMTU4Ljg3OCw0OS4wMTIgMTU5Ljc5OCw1MS4yMiAxNTkuNzk4LDU0LjA1OSBDMTU5Ljc5OCw2MC4zMDEgMTU1LjM3Myw2OC4wNDYgMTQ5LjkzMyw3MS4xODYgQzE0OC4zNiw3Mi4wOTQgMTQ2Ljg1LDcyLjY2NyAxNDUuNDQ1LDcyLjY2NyBMMTQ1LjQ0NSw3Mi42NjcgWiBNMTQyLjQ3Niw3MSBDMTQzLjI5LDcxLjY1MSAxNDQuMjk2LDcyLjAwMiAxNDUuNDQ1LDcyLjAwMiBDMTQ2Ljc2Nyw3Mi4wMDIgMTQ4LjE5OCw3MS41NSAxNDkuNyw3MC42ODIgQzE1NS4wMSw2Ny42MTcgMTU5LjMzMSw2MC4xNTkgMTU5LjMzMSw1NC4wNjUgQzE1OS4zMzEsNTIuMDg1IDE1OC44NjgsNTAuNDM1IDE1OC4wMDYsNDkuMjcyIEMxNTguNDE3LDUwLjMwNyAxNTguNjMsNTEuNTMyIDE1OC42Myw1Mi44OTIgQzE1OC42Myw1OS4xMzQgMTU0LjIwNSw2Ni43NjcgMTQ4Ljc2NSw2OS45MDcgQzE0Ny4xOTIsNzAuODE2IDE0NS42ODEsNzEuMjgzIDE0NC4yNzYsNzEuMjgzIEMxNDMuNjM0LDcxLjI4MyAxNDMuMDMzLDcxLjE5MiAxNDIuNDc2LDcxIEwxNDIuNDc2LDcxIFoiIGlkPSJGaWxsLTMzIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0OC42NDgsNjkuNzA0IEMxNTQuMDMyLDY2LjU5NiAxNTguMzk2LDU5LjA2OCAxNTguMzk2LDUyLjg5MSBDMTU4LjM5Niw1MC44MzkgMTU3LjkxMyw0OS4xOTggMTU3LjA3NCw0OC4wMyBDMTU1LjI4OSw0Ni43NzggMTUyLjY5OSw0Ni44MzYgMTQ5LjgxNiw0OC41MDEgQzE0NC40MzMsNTEuNjA5IDE0MC4wNjgsNTkuMTM3IDE0MC4wNjgsNjUuMzE0IEMxNDAuMDY4LDY3LjM2NSAxNDAuNTUyLDY5LjAwNiAxNDEuMzkxLDcwLjE3NCBDMTQzLjE3Niw3MS40MjcgMTQ1Ljc2NSw3MS4zNjkgMTQ4LjY0OCw2OS43MDQiIGlkPSJGaWxsLTM0IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NC4yNzYsNzEuMjc2IEwxNDQuMjc2LDcxLjI3NiBDMTQzLjEzMyw3MS4yNzYgMTQyLjExOCw3MC45NjkgMTQxLjI1Nyw3MC4zNjUgQzE0MS4yMzYsNzAuMzUxIDE0MS4yMTcsNzAuMzMyIDE0MS4yMDIsNzAuMzExIEMxNDAuMzA3LDY5LjA2NyAxMzkuODM1LDY3LjMzOSAxMzkuODM1LDY1LjMxNCBDMTM5LjgzNSw1OS4wNzMgMTQ0LjI2LDUxLjQzOSAxNDkuNyw0OC4yOTggQzE1MS4yNzMsNDcuMzkgMTUyLjc4NCw0Ni45MjkgMTU0LjE4OSw0Ni45MjkgQzE1NS4zMzIsNDYuOTI5IDE1Ni4zNDcsNDcuMjM2IDE1Ny4yMDgsNDcuODM5IEMxNTcuMjI5LDQ3Ljg1NCAxNTcuMjQ4LDQ3Ljg3MyAxNTcuMjYzLDQ3Ljg5NCBDMTU4LjE1Nyw0OS4xMzggMTU4LjYzLDUwLjg2NSAxNTguNjMsNTIuODkxIEMxNTguNjMsNTkuMTMyIDE1NC4yMDUsNjYuNzY2IDE0OC43NjUsNjkuOTA3IEMxNDcuMTkyLDcwLjgxNSAxNDUuNjgxLDcxLjI3NiAxNDQuMjc2LDcxLjI3NiBMMTQ0LjI3Niw3MS4yNzYgWiBNMTQxLjU1OCw3MC4xMDQgQzE0Mi4zMzEsNzAuNjM3IDE0My4yNDUsNzEuMDA1IDE0NC4yNzYsNzEuMDA1IEMxNDUuNTk4LDcxLjAwNSAxNDcuMDMsNzAuNDY3IDE0OC41MzIsNjkuNiBDMTUzLjg0Miw2Ni41MzQgMTU4LjE2Myw1OS4wMzMgMTU4LjE2Myw1Mi45MzkgQzE1OC4xNjMsNTEuMDMxIDE1Ny43MjksNDkuMzg1IDE1Ni45MDcsNDguMjIzIEMxNTYuMTMzLDQ3LjY5MSAxNTUuMjE5LDQ3LjQwOSAxNTQuMTg5LDQ3LjQwOSBDMTUyLjg2Nyw0Ny40MDkgMTUxLjQzNSw0Ny44NDIgMTQ5LjkzMyw0OC43MDkgQzE0NC42MjMsNTEuNzc1IDE0MC4zMDIsNTkuMjczIDE0MC4zMDIsNjUuMzY2IEMxNDAuMzAyLDY3LjI3NiAxNDAuNzM2LDY4Ljk0MiAxNDEuNTU4LDcwLjEwNCBMMTQxLjU1OCw3MC4xMDQgWiIgaWQ9IkZpbGwtMzUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUwLjcyLDY1LjM2MSBMMTUwLjM1Nyw2NS4wNjYgQzE1MS4xNDcsNjQuMDkyIDE1MS44NjksNjMuMDQgMTUyLjUwNSw2MS45MzggQzE1My4zMTMsNjAuNTM5IDE1My45NzgsNTkuMDY3IDE1NC40ODIsNTcuNTYzIEwxNTQuOTI1LDU3LjcxMiBDMTU0LjQxMiw1OS4yNDUgMTUzLjczMyw2MC43NDUgMTUyLjkxLDYyLjE3MiBDMTUyLjI2Miw2My4yOTUgMTUxLjUyNSw2NC4zNjggMTUwLjcyLDY1LjM2MSIgaWQ9IkZpbGwtMzYiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE1LjkxNyw4NC41MTQgTDExNS41NTQsODQuMjIgQzExNi4zNDQsODMuMjQ1IDExNy4wNjYsODIuMTk0IDExNy43MDIsODEuMDkyIEMxMTguNTEsNzkuNjkyIDExOS4xNzUsNzguMjIgMTE5LjY3OCw3Ni43MTcgTDEyMC4xMjEsNzYuODY1IEMxMTkuNjA4LDc4LjM5OCAxMTguOTMsNzkuODk5IDExOC4xMDYsODEuMzI2IEMxMTcuNDU4LDgyLjQ0OCAxMTYuNzIyLDgzLjUyMSAxMTUuOTE3LDg0LjUxNCIgaWQ9IkZpbGwtMzciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE0LDEzMC40NzYgTDExNCwxMzAuMDA4IEwxMTQsNzYuMDUyIEwxMTQsNzUuNTg0IEwxMTQsNzYuMDUyIEwxMTQsMTMwLjAwOCBMMTE0LDEzMC40NzYiIGlkPSJGaWxsLTM4IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYyLjAwMDAwMCwgMC4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTkuODIyLDM3LjQ3NCBDMTkuODM5LDM3LjMzOSAxOS43NDcsMzcuMTk0IDE5LjU1NSwzNy4wODIgQzE5LjIyOCwzNi44OTQgMTguNzI5LDM2Ljg3MiAxOC40NDYsMzcuMDM3IEwxMi40MzQsNDAuNTA4IEMxMi4zMDMsNDAuNTg0IDEyLjI0LDQwLjY4NiAxMi4yNDMsNDAuNzkzIEMxMi4yNDUsNDAuOTI1IDEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQxLjM3MSBMMTIuMjQ1LDQxLjQxNCBMMTIuMjM4LDQxLjU0MiBDOC4xNDgsNDMuODg3IDUuNjQ3LDQ1LjMyMSA1LjY0Nyw0NS4zMjEgQzUuNjQ2LDQ1LjMyMSAzLjU3LDQ2LjM2NyAyLjg2LDUwLjUxMyBDMi44Niw1MC41MTMgMS45NDgsNTcuNDc0IDEuOTYyLDcwLjI1OCBDMS45NzcsODIuODI4IDIuNTY4LDg3LjMyOCAzLjEyOSw5MS42MDkgQzMuMzQ5LDkzLjI5MyA2LjEzLDkzLjczNCA2LjEzLDkzLjczNCBDNi40NjEsOTMuNzc0IDYuODI4LDkzLjcwNyA3LjIxLDkzLjQ4NiBMODIuNDgzLDQ5LjkzNSBDODQuMjkxLDQ4Ljg2NiA4NS4xNSw0Ni4yMTYgODUuNTM5LDQzLjY1MSBDODYuNzUyLDM1LjY2MSA4Ny4yMTQsMTAuNjczIDg1LjI2NCwzLjc3MyBDODUuMDY4LDMuMDggODQuNzU0LDIuNjkgODQuMzk2LDIuNDkxIEw4Mi4zMSwxLjcwMSBDODEuNTgzLDEuNzI5IDgwLjg5NCwyLjE2OCA4MC43NzYsMi4yMzYgQzgwLjYzNiwyLjMxNyA0MS44MDcsMjQuNTg1IDIwLjAzMiwzNy4wNzIgTDE5LjgyMiwzNy40NzQiIGlkPSJGaWxsLTEiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNODIuMzExLDEuNzAxIEw4NC4zOTYsMi40OTEgQzg0Ljc1NCwyLjY5IDg1LjA2OCwzLjA4IDg1LjI2NCwzLjc3MyBDODcuMjEzLDEwLjY3MyA4Ni43NTEsMzUuNjYgODUuNTM5LDQzLjY1MSBDODUuMTQ5LDQ2LjIxNiA4NC4yOSw0OC44NjYgODIuNDgzLDQ5LjkzNSBMNy4yMSw5My40ODYgQzYuODk3LDkzLjY2NyA2LjU5NSw5My43NDQgNi4zMTQsOTMuNzQ0IEw2LjEzMSw5My43MzMgQzYuMTMxLDkzLjczNCAzLjM0OSw5My4yOTMgMy4xMjgsOTEuNjA5IEMyLjU2OCw4Ny4zMjcgMS45NzcsODIuODI4IDEuOTYzLDcwLjI1OCBDMS45NDgsNTcuNDc0IDIuODYsNTAuNTEzIDIuODYsNTAuNTEzIEMzLjU3LDQ2LjM2NyA1LjY0Nyw0NS4zMjEgNS42NDcsNDUuMzIxIEM1LjY0Nyw0NS4zMjEgOC4xNDgsNDMuODg3IDEyLjIzOCw0MS41NDIgTDEyLjI0NSw0MS40MTQgTDEyLjI0NSw0MS4zNzEgQzEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQwLjkyNSAxMi4yNDMsNDAuNzkzIEMxMi4yNCw0MC42ODYgMTIuMzAyLDQwLjU4MyAxMi40MzQsNDAuNTA4IEwxOC40NDYsMzcuMDM2IEMxOC41NzQsMzYuOTYyIDE4Ljc0NiwzNi45MjYgMTguOTI3LDM2LjkyNiBDMTkuMTQ1LDM2LjkyNiAxOS4zNzYsMzYuOTc5IDE5LjU1NCwzNy4wODIgQzE5Ljc0NywzNy4xOTQgMTkuODM5LDM3LjM0IDE5LjgyMiwzNy40NzQgTDIwLjAzMywzNy4wNzIgQzQxLjgwNiwyNC41ODUgODAuNjM2LDIuMzE4IDgwLjc3NywyLjIzNiBDODAuODk0LDIuMTY4IDgxLjU4MywxLjcyOSA4Mi4zMTEsMS43MDEgTTgyLjMxMSwwLjcwNCBMODIuMjcyLDAuNzA1IEM4MS42NTQsMC43MjggODAuOTg5LDAuOTQ5IDgwLjI5OCwxLjM2MSBMODAuMjc3LDEuMzczIEM4MC4xMjksMS40NTggNTkuNzY4LDEzLjEzNSAxOS43NTgsMzYuMDc5IEMxOS41LDM1Ljk4MSAxOS4yMTQsMzUuOTI5IDE4LjkyNywzNS45MjkgQzE4LjU2MiwzNS45MjkgMTguMjIzLDM2LjAxMyAxNy45NDcsMzYuMTczIEwxMS45MzUsMzkuNjQ0IEMxMS40OTMsMzkuODk5IDExLjIzNiw0MC4zMzQgMTEuMjQ2LDQwLjgxIEwxMS4yNDcsNDAuOTYgTDUuMTY3LDQ0LjQ0NyBDNC43OTQsNDQuNjQ2IDIuNjI1LDQ1Ljk3OCAxLjg3Nyw1MC4zNDUgTDEuODcxLDUwLjM4NCBDMS44NjIsNTAuNDU0IDAuOTUxLDU3LjU1NyAwLjk2NSw3MC4yNTkgQzAuOTc5LDgyLjg3OSAxLjU2OCw4Ny4zNzUgMi4xMzcsOTEuNzI0IEwyLjEzOSw5MS43MzkgQzIuNDQ3LDk0LjA5NCA1LjYxNCw5NC42NjIgNS45NzUsOTQuNzE5IEw2LjAwOSw5NC43MjMgQzYuMTEsOTQuNzM2IDYuMjEzLDk0Ljc0MiA2LjMxNCw5NC43NDIgQzYuNzksOTQuNzQyIDcuMjYsOTQuNjEgNy43MSw5NC4zNSBMODIuOTgzLDUwLjc5OCBDODQuNzk0LDQ5LjcyNyA4NS45ODIsNDcuMzc1IDg2LjUyNSw0My44MDEgQzg3LjcxMSwzNS45ODcgODguMjU5LDEwLjcwNSA4Ni4yMjQsMy41MDIgQzg1Ljk3MSwyLjYwOSA4NS41MiwxLjk3NSA4NC44ODEsMS42MiBMODQuNzQ5LDEuNTU4IEw4Mi42NjQsMC43NjkgQzgyLjU1MSwwLjcyNSA4Mi40MzEsMC43MDQgODIuMzExLDAuNzA0IiBpZD0iRmlsbC0yIiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY2LjI2NywxMS41NjUgTDY3Ljc2MiwxMS45OTkgTDExLjQyMyw0NC4zMjUiIGlkPSJGaWxsLTMiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMjAyLDkwLjU0NSBDMTIuMDI5LDkwLjU0NSAxMS44NjIsOTAuNDU1IDExLjc2OSw5MC4yOTUgQzExLjYzMiw5MC4wNTcgMTEuNzEzLDg5Ljc1MiAxMS45NTIsODkuNjE0IEwzMC4zODksNzguOTY5IEMzMC42MjgsNzguODMxIDMwLjkzMyw3OC45MTMgMzEuMDcxLDc5LjE1MiBDMzEuMjA4LDc5LjM5IDMxLjEyNyw3OS42OTYgMzAuODg4LDc5LjgzMyBMMTIuNDUxLDkwLjQ3OCBMMTIuMjAyLDkwLjU0NSIgaWQ9IkZpbGwtNCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMy43NjQsNDIuNjU0IEwxMy42NTYsNDIuNTkyIEwxMy43MDIsNDIuNDIxIEwxOC44MzcsMzkuNDU3IEwxOS4wMDcsMzkuNTAyIEwxOC45NjIsMzkuNjczIEwxMy44MjcsNDIuNjM3IEwxMy43NjQsNDIuNjU0IiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTguNTIsOTAuMzc1IEw4LjUyLDQ2LjQyMSBMOC41ODMsNDYuMzg1IEw3NS44NCw3LjU1NCBMNzUuODQsNTEuNTA4IEw3NS43NzgsNTEuNTQ0IEw4LjUyLDkwLjM3NSBMOC41Miw5MC4zNzUgWiBNOC43Nyw0Ni41NjQgTDguNzcsODkuOTQ0IEw3NS41OTEsNTEuMzY1IEw3NS41OTEsNy45ODUgTDguNzcsNDYuNTY0IEw4Ljc3LDQ2LjU2NCBaIiBpZD0iRmlsbC02IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTI0Ljk4Niw4My4xODIgQzI0Ljc1Niw4My4zMzEgMjQuMzc0LDgzLjU2NiAyNC4xMzcsODMuNzA1IEwxMi42MzIsOTAuNDA2IEMxMi4zOTUsOTAuNTQ1IDEyLjQyNiw5MC42NTggMTIuNyw5MC42NTggTDEzLjI2NSw5MC42NTggQzEzLjU0LDkwLjY1OCAxMy45NTgsOTAuNTQ1IDE0LjE5NSw5MC40MDYgTDI1LjcsODMuNzA1IEMyNS45MzcsODMuNTY2IDI2LjEyOCw4My40NTIgMjYuMTI1LDgzLjQ0OSBDMjYuMTIyLDgzLjQ0NyAyNi4xMTksODMuMjIgMjYuMTE5LDgyLjk0NiBDMjYuMTE5LDgyLjY3MiAyNS45MzEsODIuNTY5IDI1LjcwMSw4Mi43MTkgTDI0Ljk4Niw4My4xODIiIGlkPSJGaWxsLTciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuMjY2LDkwLjc4MiBMMTIuNyw5MC43ODIgQzEyLjUsOTAuNzgyIDEyLjM4NCw5MC43MjYgMTIuMzU0LDkwLjYxNiBDMTIuMzI0LDkwLjUwNiAxMi4zOTcsOTAuMzk5IDEyLjU2OSw5MC4yOTkgTDI0LjA3NCw4My41OTcgQzI0LjMxLDgzLjQ1OSAyNC42ODksODMuMjI2IDI0LjkxOCw4My4wNzggTDI1LjYzMyw4Mi42MTQgQzI1LjcyMyw4Mi41NTUgMjUuODEzLDgyLjUyNSAyNS44OTksODIuNTI1IEMyNi4wNzEsODIuNTI1IDI2LjI0NCw4Mi42NTUgMjYuMjQ0LDgyLjk0NiBDMjYuMjQ0LDgzLjE2IDI2LjI0NSw4My4zMDkgMjYuMjQ3LDgzLjM4MyBMMjYuMjUzLDgzLjM4NyBMMjYuMjQ5LDgzLjQ1NiBDMjYuMjQ2LDgzLjUzMSAyNi4yNDYsODMuNTMxIDI1Ljc2Myw4My44MTIgTDE0LjI1OCw5MC41MTQgQzE0LDkwLjY2NSAxMy41NjQsOTAuNzgyIDEzLjI2Niw5MC43ODIgTDEzLjI2Niw5MC43ODIgWiBNMTIuNjY2LDkwLjUzMiBMMTIuNyw5MC41MzMgTDEzLjI2Niw5MC41MzMgQzEzLjUxOCw5MC41MzMgMTMuOTE1LDkwLjQyNSAxNC4xMzIsOTAuMjk5IEwyNS42MzcsODMuNTk3IEMyNS44MDUsODMuNDk5IDI1LjkzMSw4My40MjQgMjUuOTk4LDgzLjM4MyBDMjUuOTk0LDgzLjI5OSAyNS45OTQsODMuMTY1IDI1Ljk5NCw4Mi45NDYgTDI1Ljg5OSw4Mi43NzUgTDI1Ljc2OCw4Mi44MjQgTDI1LjA1NCw4My4yODcgQzI0LjgyMiw4My40MzcgMjQuNDM4LDgzLjY3MyAyNC4yLDgzLjgxMiBMMTIuNjk1LDkwLjUxNCBMMTIuNjY2LDkwLjUzMiBMMTIuNjY2LDkwLjUzMiBaIiBpZD0iRmlsbC04IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEzLjI2Niw4OS44NzEgTDEyLjcsODkuODcxIEMxMi41LDg5Ljg3MSAxMi4zODQsODkuODE1IDEyLjM1NCw4OS43MDUgQzEyLjMyNCw4OS41OTUgMTIuMzk3LDg5LjQ4OCAxMi41NjksODkuMzg4IEwyNC4wNzQsODIuNjg2IEMyNC4zMzIsODIuNTM1IDI0Ljc2OCw4Mi40MTggMjUuMDY3LDgyLjQxOCBMMjUuNjMyLDgyLjQxOCBDMjUuODMyLDgyLjQxOCAyNS45NDgsODIuNDc0IDI1Ljk3OCw4Mi41ODQgQzI2LjAwOCw4Mi42OTQgMjUuOTM1LDgyLjgwMSAyNS43NjMsODIuOTAxIEwxNC4yNTgsODkuNjAzIEMxNCw4OS43NTQgMTMuNTY0LDg5Ljg3MSAxMy4yNjYsODkuODcxIEwxMy4yNjYsODkuODcxIFogTTEyLjY2Niw4OS42MjEgTDEyLjcsODkuNjIyIEwxMy4yNjYsODkuNjIyIEMxMy41MTgsODkuNjIyIDEzLjkxNSw4OS41MTUgMTQuMTMyLDg5LjM4OCBMMjUuNjM3LDgyLjY4NiBMMjUuNjY3LDgyLjY2OCBMMjUuNjMyLDgyLjY2NyBMMjUuMDY3LDgyLjY2NyBDMjQuODE1LDgyLjY2NyAyNC40MTgsODIuNzc1IDI0LjIsODIuOTAxIEwxMi42OTUsODkuNjAzIEwxMi42NjYsODkuNjIxIEwxMi42NjYsODkuNjIxIFoiIGlkPSJGaWxsLTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMzcsOTAuODAxIEwxMi4zNyw4OS41NTQgTDEyLjM3LDkwLjgwMSIgaWQ9IkZpbGwtMTAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNi4xMyw5My45MDEgQzUuMzc5LDkzLjgwOCA0LjgxNiw5My4xNjQgNC42OTEsOTIuNTI1IEMzLjg2LDg4LjI4NyAzLjU0LDgzLjc0MyAzLjUyNiw3MS4xNzMgQzMuNTExLDU4LjM4OSA0LjQyMyw1MS40MjggNC40MjMsNTEuNDI4IEM1LjEzNCw0Ny4yODIgNy4yMSw0Ni4yMzYgNy4yMSw0Ni4yMzYgQzcuMjEsNDYuMjM2IDgxLjY2NywzLjI1IDgyLjA2OSwzLjAxNyBDODIuMjkyLDIuODg4IDg0LjU1NiwxLjQzMyA4NS4yNjQsMy45NCBDODcuMjE0LDEwLjg0IDg2Ljc1MiwzNS44MjcgODUuNTM5LDQzLjgxOCBDODUuMTUsNDYuMzgzIDg0LjI5MSw0OS4wMzMgODIuNDgzLDUwLjEwMSBMNy4yMSw5My42NTMgQzYuODI4LDkzLjg3NCA2LjQ2MSw5My45NDEgNi4xMyw5My45MDEgQzYuMTMsOTMuOTAxIDMuMzQ5LDkzLjQ2IDMuMTI5LDkxLjc3NiBDMi41NjgsODcuNDk1IDEuOTc3LDgyLjk5NSAxLjk2Miw3MC40MjUgQzEuOTQ4LDU3LjY0MSAyLjg2LDUwLjY4IDIuODYsNTAuNjggQzMuNTcsNDYuNTM0IDUuNjQ3LDQ1LjQ4OSA1LjY0Nyw0NS40ODkgQzUuNjQ2LDQ1LjQ4OSA4LjA2NSw0NC4wOTIgMTIuMjQ1LDQxLjY3OSBMMTMuMTE2LDQxLjU2IEwxOS43MTUsMzcuNzMgTDE5Ljc2MSwzNy4yNjkgTDYuMTMsOTMuOTAxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjMxNyw5NC4xNjEgTDYuMTAyLDk0LjE0OCBMNi4xMDEsOTQuMTQ4IEw1Ljg1Nyw5NC4xMDEgQzUuMTM4LDkzLjk0NSAzLjA4NSw5My4zNjUgMi44ODEsOTEuODA5IEMyLjMxMyw4Ny40NjkgMS43MjcsODIuOTk2IDEuNzEzLDcwLjQyNSBDMS42OTksNTcuNzcxIDIuNjA0LDUwLjcxOCAyLjYxMyw1MC42NDggQzMuMzM4LDQ2LjQxNyA1LjQ0NSw0NS4zMSA1LjUzNSw0NS4yNjYgTDEyLjE2Myw0MS40MzkgTDEzLjAzMyw0MS4zMiBMMTkuNDc5LDM3LjU3OCBMMTkuNTEzLDM3LjI0NCBDMTkuNTI2LDM3LjEwNyAxOS42NDcsMzcuMDA4IDE5Ljc4NiwzNy4wMjEgQzE5LjkyMiwzNy4wMzQgMjAuMDIzLDM3LjE1NiAyMC4wMDksMzcuMjkzIEwxOS45NSwzNy44ODIgTDEzLjE5OCw0MS44MDEgTDEyLjMyOCw0MS45MTkgTDUuNzcyLDQ1LjcwNCBDNS43NDEsNDUuNzIgMy43ODIsNDYuNzcyIDMuMTA2LDUwLjcyMiBDMy4wOTksNTAuNzgyIDIuMTk4LDU3LjgwOCAyLjIxMiw3MC40MjQgQzIuMjI2LDgyLjk2MyAyLjgwOSw4Ny40MiAzLjM3Myw5MS43MjkgQzMuNDY0LDkyLjQyIDQuMDYyLDkyLjg4MyA0LjY4Miw5My4xODEgQzQuNTY2LDkyLjk4NCA0LjQ4Niw5Mi43NzYgNC40NDYsOTIuNTcyIEMzLjY2NSw4OC41ODggMy4yOTEsODQuMzcgMy4yNzYsNzEuMTczIEMzLjI2Miw1OC41MiA0LjE2Nyw1MS40NjYgNC4xNzYsNTEuMzk2IEM0LjkwMSw0Ny4xNjUgNy4wMDgsNDYuMDU5IDcuMDk4LDQ2LjAxNCBDNy4wOTQsNDYuMDE1IDgxLjU0MiwzLjAzNCA4MS45NDQsMi44MDIgTDgxLjk3MiwyLjc4NSBDODIuODc2LDIuMjQ3IDgzLjY5MiwyLjA5NyA4NC4zMzIsMi4zNTIgQzg0Ljg4NywyLjU3MyA4NS4yODEsMy4wODUgODUuNTA0LDMuODcyIEM4Ny41MTgsMTEgODYuOTY0LDM2LjA5MSA4NS43ODUsNDMuODU1IEM4NS4yNzgsNDcuMTk2IDg0LjIxLDQ5LjM3IDgyLjYxLDUwLjMxNyBMNy4zMzUsOTMuODY5IEM2Ljk5OSw5NC4wNjMgNi42NTgsOTQuMTYxIDYuMzE3LDk0LjE2MSBMNi4zMTcsOTQuMTYxIFogTTYuMTcsOTMuNjU0IEM2LjQ2Myw5My42OSA2Ljc3NCw5My42MTcgNy4wODUsOTMuNDM3IEw4Mi4zNTgsNDkuODg2IEM4NC4xODEsNDguODA4IDg0Ljk2LDQ1Ljk3MSA4NS4yOTIsNDMuNzggQzg2LjQ2NiwzNi4wNDkgODcuMDIzLDExLjA4NSA4NS4wMjQsNC4wMDggQzg0Ljg0NiwzLjM3NyA4NC41NTEsMi45NzYgODQuMTQ4LDIuODE2IEM4My42NjQsMi42MjMgODIuOTgyLDIuNzY0IDgyLjIyNywzLjIxMyBMODIuMTkzLDMuMjM0IEM4MS43OTEsMy40NjYgNy4zMzUsNDYuNDUyIDcuMzM1LDQ2LjQ1MiBDNy4zMDQsNDYuNDY5IDUuMzQ2LDQ3LjUyMSA0LjY2OSw1MS40NzEgQzQuNjYyLDUxLjUzIDMuNzYxLDU4LjU1NiAzLjc3NSw3MS4xNzMgQzMuNzksODQuMzI4IDQuMTYxLDg4LjUyNCA0LjkzNiw5Mi40NzYgQzUuMDI2LDkyLjkzNyA1LjQxMiw5My40NTkgNS45NzMsOTMuNjE1IEM2LjA4Nyw5My42NCA2LjE1OCw5My42NTIgNi4xNjksOTMuNjU0IEw2LjE3LDkzLjY1NCBMNi4xNyw5My42NTQgWiIgaWQ9IkZpbGwtMTIiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4zMTcsNjguOTgyIEM3LjgwNiw2OC43MDEgOC4yMDIsNjguOTI2IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNi44MjksNzEuMjk0IDYuNDMzLDcxLjA2OSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIiBpZD0iRmlsbC0xMyIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjkyLDcxLjEzMyBDNi42MzEsNzEuMTMzIDYuNDMzLDcwLjkwNSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIEM3LjQ2LDY4LjkgNy41OTUsNjguODYxIDcuNzE0LDY4Ljg2MSBDOC4wMDMsNjguODYxIDguMjAyLDY5LjA5IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNy4xNzQsNzEuMDk0IDcuMDM5LDcxLjEzMyA2LjkyLDcxLjEzMyBNNy43MTQsNjguNjc0IEM3LjU1Nyw2OC42NzQgNy4zOTIsNjguNzIzIDcuMjI0LDY4LjgyMSBDNi42NzYsNjkuMTM4IDYuMjQ2LDY5Ljg3OSA2LjI0Niw3MC41MDggQzYuMjQ2LDcwLjk5NCA2LjUxNyw3MS4zMiA2LjkyLDcxLjMyIEM3LjA3OCw3MS4zMiA3LjI0Myw3MS4yNzEgNy40MTEsNzEuMTc0IEM3Ljk1OSw3MC44NTcgOC4zODksNzAuMTE3IDguMzg5LDY5LjQ4NyBDOC4zODksNjkuMDAxIDguMTE3LDY4LjY3NCA3LjcxNCw2OC42NzQiIGlkPSJGaWxsLTE0IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYuOTIsNzAuOTQ3IEM2LjY0OSw3MC45NDcgNi42MjEsNzAuNjQgNi42MjEsNzAuNTA4IEM2LjYyMSw3MC4wMTcgNi45ODIsNjkuMzkyIDcuNDExLDY5LjE0NSBDNy41MjEsNjkuMDgyIDcuNjI1LDY5LjA0OSA3LjcxNCw2OS4wNDkgQzcuOTg2LDY5LjA0OSA4LjAxNSw2OS4zNTUgOC4wMTUsNjkuNDg3IEM4LjAxNSw2OS45NzggNy42NTIsNzAuNjAzIDcuMjI0LDcwLjg1MSBDNy4xMTUsNzAuOTE0IDcuMDEsNzAuOTQ3IDYuOTIsNzAuOTQ3IE03LjcxNCw2OC44NjEgQzcuNTk1LDY4Ljg2MSA3LjQ2LDY4LjkgNy4zMTcsNjguOTgyIEM2LjgyOSw2OS4yNjUgNi40MzMsNjkuOTQ4IDYuNDMzLDcwLjUwOCBDNi40MzMsNzAuOTA1IDYuNjMxLDcxLjEzMyA2LjkyLDcxLjEzMyBDNy4wMzksNzEuMTMzIDcuMTc0LDcxLjA5NCA3LjMxNyw3MS4wMTIgQzcuODA2LDcwLjczIDguMjAyLDcwLjA0NyA4LjIwMiw2OS40ODcgQzguMjAyLDY5LjA5IDguMDAzLDY4Ljg2MSA3LjcxNCw2OC44NjEiIGlkPSJGaWxsLTE1IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTcuNDQ0LDg1LjM1IEM3LjcwOCw4NS4xOTggNy45MjEsODUuMzE5IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuOTI1IDcuNzA4LDg2LjI5MiA3LjQ0NCw4Ni40NDQgQzcuMTgxLDg2LjU5NyA2Ljk2Nyw4Ni40NzUgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IiBpZD0iRmlsbC0xNiIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik03LjIzLDg2LjUxIEM3LjA3NCw4Ni41MSA2Ljk2Nyw4Ni4zODcgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IEM3LjUyMSw4NS4zMDUgNy41OTQsODUuMjg0IDcuNjU4LDg1LjI4NCBDNy44MTQsODUuMjg0IDcuOTIxLDg1LjQwOCA3LjkyMSw4NS42MjIgQzcuOTIxLDg1LjkyNSA3LjcwOCw4Ni4yOTIgNy40NDQsODYuNDQ0IEM3LjM2Nyw4Ni40ODkgNy4yOTQsODYuNTEgNy4yMyw4Ni41MSBNNy42NTgsODUuMDk4IEM3LjU1OCw4NS4wOTggNy40NTUsODUuMTI3IDcuMzUxLDg1LjE4OCBDNy4wMzEsODUuMzczIDYuNzgxLDg1LjgwNiA2Ljc4MSw4Ni4xNzMgQzYuNzgxLDg2LjQ4MiA2Ljk2Niw4Ni42OTcgNy4yMyw4Ni42OTcgQzcuMzMsODYuNjk3IDcuNDMzLDg2LjY2NiA3LjUzOCw4Ni42MDcgQzcuODU4LDg2LjQyMiA4LjEwOCw4NS45ODkgOC4xMDgsODUuNjIyIEM4LjEwOCw4NS4zMTMgNy45MjMsODUuMDk4IDcuNjU4LDg1LjA5OCIgaWQ9IkZpbGwtMTciIGZpbGw9IiM4MDk3QTIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4yMyw4Ni4zMjIgTDcuMTU0LDg2LjE3MyBDNy4xNTQsODUuOTM4IDcuMzMzLDg1LjYyOSA3LjUzOCw4NS41MTIgTDcuNjU4LDg1LjQ3MSBMNy43MzQsODUuNjIyIEM3LjczNCw4NS44NTYgNy41NTUsODYuMTY0IDcuMzUxLDg2LjI4MiBMNy4yMyw4Ni4zMjIgTTcuNjU4LDg1LjI4NCBDNy41OTQsODUuMjg0IDcuNTIxLDg1LjMwNSA3LjQ0NCw4NS4zNSBDNy4xODEsODUuNTAyIDYuOTY3LDg1Ljg3MSA2Ljk2Nyw4Ni4xNzMgQzYuOTY3LDg2LjM4NyA3LjA3NCw4Ni41MSA3LjIzLDg2LjUxIEM3LjI5NCw4Ni41MSA3LjM2Nyw4Ni40ODkgNy40NDQsODYuNDQ0IEM3LjcwOCw4Ni4yOTIgNy45MjEsODUuOTI1IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuNDA4IDcuODE0LDg1LjI4NCA3LjY1OCw4NS4yODQiIGlkPSJGaWxsLTE4IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTc3LjI3OCw3Ljc2OSBMNzcuMjc4LDUxLjQzNiBMMTAuMjA4LDkwLjE2IEwxMC4yMDgsNDYuNDkzIEw3Ny4yNzgsNy43NjkiIGlkPSJGaWxsLTE5IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEwLjA4Myw5MC4zNzUgTDEwLjA4Myw0Ni40MjEgTDEwLjE0Niw0Ni4zODUgTDc3LjQwMyw3LjU1NCBMNzcuNDAzLDUxLjUwOCBMNzcuMzQxLDUxLjU0NCBMMTAuMDgzLDkwLjM3NSBMMTAuMDgzLDkwLjM3NSBaIE0xMC4zMzMsNDYuNTY0IEwxMC4zMzMsODkuOTQ0IEw3Ny4xNTQsNTEuMzY1IEw3Ny4xNTQsNy45ODUgTDEwLjMzMyw0Ni41NjQgTDEwLjMzMyw0Ni41NjQgWiIgaWQ9IkZpbGwtMjAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMjUuNzM3LDg4LjY0NyBMMTE4LjA5OCw5MS45ODEgTDExOC4wOTgsODQgTDEwNi42MzksODguNzEzIEwxMDYuNjM5LDk2Ljk4MiBMOTksMTAwLjMxNSBMMTEyLjM2OSwxMDMuOTYxIEwxMjUuNzM3LDg4LjY0NyIgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTIiIGZpbGw9IiM0NTVBNjQiIHNrZXRjaDp0eXBlPSJNU1NoYXBlR3JvdXAiPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+');
};

module.exports = RotateInstructions;

},{"./util.js":24}],19:[function(require,module,exports){
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

var SensorSample = require('./sensor-sample.js');
var MathUtil = require('../math-util.js');
var Util = require('../util.js');

/**
 * An implementation of a simple complementary filter, which fuses gyroscope and
 * accelerometer data from the 'devicemotion' event.
 *
 * Accelerometer data is very noisy, but stable over the long term.
 * Gyroscope data is smooth, but tends to drift over the long term.
 *
 * This fusion is relatively simple:
 * 1. Get orientation estimates from accelerometer by applying a low-pass filter
 *    on that data.
 * 2. Get orientation estimates from gyroscope by integrating over time.
 * 3. Combine the two estimates, weighing (1) in the long term, but (2) for the
 *    short term.
 */
function ComplementaryFilter(kFilter) {
  this.kFilter = kFilter;

  // Raw sensor measurements.
  this.currentAccelMeasurement = new SensorSample();
  this.currentGyroMeasurement = new SensorSample();
  this.previousGyroMeasurement = new SensorSample();

  // Set default look direction to be in the correct direction.
  if (Util.isIOS()) {
    this.filterQ = new MathUtil.Quaternion(-1, 0, 0, 1);
  } else {
    this.filterQ = new MathUtil.Quaternion(1, 0, 0, 1);
  }
  this.previousFilterQ = new MathUtil.Quaternion();
  this.previousFilterQ.copy(this.filterQ);

  // Orientation based on the accelerometer.
  this.accelQ = new MathUtil.Quaternion();
  // Whether or not the orientation has been initialized.
  this.isOrientationInitialized = false;
  // Running estimate of gravity based on the current orientation.
  this.estimatedGravity = new MathUtil.Vector3();
  // Measured gravity based on accelerometer.
  this.measuredGravity = new MathUtil.Vector3();

  // Debug only quaternion of gyro-based orientation.
  this.gyroIntegralQ = new MathUtil.Quaternion();
}

ComplementaryFilter.prototype.addAccelMeasurement = function(vector, timestampS) {
  this.currentAccelMeasurement.set(vector, timestampS);
};

ComplementaryFilter.prototype.addGyroMeasurement = function(vector, timestampS) {
  this.currentGyroMeasurement.set(vector, timestampS);

  var deltaT = timestampS - this.previousGyroMeasurement.timestampS;
  if (Util.isTimestampDeltaValid(deltaT)) {
    this.run_();
  }

  this.previousGyroMeasurement.copy(this.currentGyroMeasurement);
};

ComplementaryFilter.prototype.run_ = function() {

  if (!this.isOrientationInitialized) {
    this.accelQ = this.accelToQuaternion_(this.currentAccelMeasurement.sample);
    this.previousFilterQ.copy(this.accelQ);
    this.isOrientationInitialized = true;
    return;
  }

  var deltaT = this.currentGyroMeasurement.timestampS -
      this.previousGyroMeasurement.timestampS;

  // Convert gyro rotation vector to a quaternion delta.
  var gyroDeltaQ = this.gyroToQuaternionDelta_(this.currentGyroMeasurement.sample, deltaT);
  this.gyroIntegralQ.multiply(gyroDeltaQ);

  // filter_1 = K * (filter_0 + gyro * dT) + (1 - K) * accel.
  this.filterQ.copy(this.previousFilterQ);
  this.filterQ.multiply(gyroDeltaQ);

  // Calculate the delta between the current estimated gravity and the real
  // gravity vector from accelerometer.
  var invFilterQ = new MathUtil.Quaternion();
  invFilterQ.copy(this.filterQ);
  invFilterQ.inverse();

  this.estimatedGravity.set(0, 0, -1);
  this.estimatedGravity.applyQuaternion(invFilterQ);
  this.estimatedGravity.normalize();

  this.measuredGravity.copy(this.currentAccelMeasurement.sample);
  this.measuredGravity.normalize();

  // Compare estimated gravity with measured gravity, get the delta quaternion
  // between the two.
  var deltaQ = new MathUtil.Quaternion();
  deltaQ.setFromUnitVectors(this.estimatedGravity, this.measuredGravity);
  deltaQ.inverse();

  if (Util.isDebug()) {
    console.log('Delta: %d deg, G_est: (%s, %s, %s), G_meas: (%s, %s, %s)',
                MathUtil.radToDeg * Util.getQuaternionAngle(deltaQ),
                (this.estimatedGravity.x).toFixed(1),
                (this.estimatedGravity.y).toFixed(1),
                (this.estimatedGravity.z).toFixed(1),
                (this.measuredGravity.x).toFixed(1),
                (this.measuredGravity.y).toFixed(1),
                (this.measuredGravity.z).toFixed(1));
  }

  // Calculate the SLERP target: current orientation plus the measured-estimated
  // quaternion delta.
  var targetQ = new MathUtil.Quaternion();
  targetQ.copy(this.filterQ);
  targetQ.multiply(deltaQ);

  // SLERP factor: 0 is pure gyro, 1 is pure accel.
  this.filterQ.slerp(targetQ, 1 - this.kFilter);

  this.previousFilterQ.copy(this.filterQ);
};

ComplementaryFilter.prototype.getOrientation = function() {
  return this.filterQ;
};

ComplementaryFilter.prototype.accelToQuaternion_ = function(accel) {
  var normAccel = new MathUtil.Vector3();
  normAccel.copy(accel);
  normAccel.normalize();
  var quat = new MathUtil.Quaternion();
  quat.setFromUnitVectors(new MathUtil.Vector3(0, 0, -1), normAccel);
  quat.inverse();
  return quat;
};

ComplementaryFilter.prototype.gyroToQuaternionDelta_ = function(gyro, dt) {
  // Extract axis and angle from the gyroscope data.
  var quat = new MathUtil.Quaternion();
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();
  quat.setFromAxisAngle(axis, gyro.length() * dt);
  return quat;
};


module.exports = ComplementaryFilter;

},{"../math-util.js":15,"../util.js":24,"./sensor-sample.js":22}],20:[function(require,module,exports){
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
var ComplementaryFilter = require('./complementary-filter.js');
var PosePredictor = require('./pose-predictor.js');
var TouchPanner = require('../touch-panner.js');
var MathUtil = require('../math-util.js');
var Util = require('../util.js');

/**
 * The pose sensor, implemented using DeviceMotion APIs.
 */
function FusionPoseSensor() {
  this.deviceId = 'webvr-polyfill:fused';
  this.deviceName = 'VR Position Device (webvr-polyfill:fused)';

  this.accelerometer = new MathUtil.Vector3();
  this.gyroscope = new MathUtil.Vector3();

  this.start();

  this.filter = new ComplementaryFilter(window.WebVRConfig.K_FILTER);
  this.posePredictor = new PosePredictor(window.WebVRConfig.PREDICTION_TIME_S);
  this.touchPanner = new TouchPanner();

  this.filterToWorldQ = new MathUtil.Quaternion();

  // Set the filter to world transform, depending on OS.
  if (Util.isIOS()) {
    this.filterToWorldQ.setFromAxisAngle(new MathUtil.Vector3(1, 0, 0), Math.PI / 2);
  } else {
    this.filterToWorldQ.setFromAxisAngle(new MathUtil.Vector3(1, 0, 0), -Math.PI / 2);
  }

  this.inverseWorldToScreenQ = new MathUtil.Quaternion();
  this.worldToScreenQ = new MathUtil.Quaternion();
  this.originalPoseAdjustQ = new MathUtil.Quaternion();
  this.originalPoseAdjustQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1),
                                           -window.orientation * Math.PI / 180);

  this.setScreenTransform_();
  // Adjust this filter for being in landscape mode.
  if (Util.isLandscapeMode()) {
    this.filterToWorldQ.multiply(this.inverseWorldToScreenQ);
  }

  // Keep track of a reset transform for resetSensor.
  this.resetQ = new MathUtil.Quaternion();

  this.isFirefoxAndroid = Util.isFirefoxAndroid();
  this.isIOS = Util.isIOS();

  this.orientationOut_ = new Float32Array(4);
}

FusionPoseSensor.prototype.getPosition = function() {
  // This PoseSensor doesn't support position
  return null;
};

FusionPoseSensor.prototype.getOrientation = function() {
  // Convert from filter space to the the same system used by the
  // deviceorientation event.
  var orientation = this.filter.getOrientation();

  // Predict orientation.
  this.predictedQ = this.posePredictor.getPrediction(orientation, this.gyroscope, this.previousTimestampS);

  // Convert to THREE coordinate system: -Z forward, Y up, X right.
  var out = new MathUtil.Quaternion();
  out.copy(this.filterToWorldQ);
  out.multiply(this.resetQ);
  if (!window.WebVRConfig.TOUCH_PANNER_DISABLED) {
    out.multiply(this.touchPanner.getOrientation());
  }
  out.multiply(this.predictedQ);
  out.multiply(this.worldToScreenQ);

  // Handle the yaw-only case.
  if (window.WebVRConfig.YAW_ONLY) {
    // Make a quaternion that only turns around the Y-axis.
    out.x = 0;
    out.z = 0;
    out.normalize();
  }

  this.orientationOut_[0] = out.x;
  this.orientationOut_[1] = out.y;
  this.orientationOut_[2] = out.z;
  this.orientationOut_[3] = out.w;
  return this.orientationOut_;
};

FusionPoseSensor.prototype.resetPose = function() {
  // Reduce to inverted yaw-only.
  this.resetQ.copy(this.filter.getOrientation());
  this.resetQ.x = 0;
  this.resetQ.y = 0;
  this.resetQ.z *= -1;
  this.resetQ.normalize();

  // Take into account extra transformations in landscape mode.
  if (Util.isLandscapeMode()) {
    this.resetQ.multiply(this.inverseWorldToScreenQ);
  }

  // Take into account original pose.
  this.resetQ.multiply(this.originalPoseAdjustQ);

  if (!window.WebVRConfig.TOUCH_PANNER_DISABLED) {
    this.touchPanner.resetSensor();
  }
};

FusionPoseSensor.prototype.onDeviceMotion_ = function(deviceMotion) {
  this.updateDeviceMotion_(deviceMotion);
};

FusionPoseSensor.prototype.updateDeviceMotion_ = function(deviceMotion) {
  var accGravity = deviceMotion.accelerationIncludingGravity;
  var rotRate = deviceMotion.rotationRate;
  var timestampS = deviceMotion.timeStamp / 1000;

  var deltaS = timestampS - this.previousTimestampS;
  if (deltaS <= Util.MIN_TIMESTEP || deltaS > Util.MAX_TIMESTEP) {
    console.warn('Invalid timestamps detected. Time step between successive ' +
                 'gyroscope sensor samples is very small or not monotonic');
    this.previousTimestampS = timestampS;
    return;
  }
  this.accelerometer.set(-accGravity.x, -accGravity.y, -accGravity.z);
  this.gyroscope.set(rotRate.alpha, rotRate.beta, rotRate.gamma);

  // With iOS and Firefox Android, rotationRate is reported in degrees,
  // so we first convert to radians.
  if (this.isIOS || this.isFirefoxAndroid) {
    this.gyroscope.multiplyScalar(Math.PI / 180);
  }

  this.filter.addAccelMeasurement(this.accelerometer, timestampS);
  this.filter.addGyroMeasurement(this.gyroscope, timestampS);

  this.previousTimestampS = timestampS;
};

FusionPoseSensor.prototype.onOrientationChange_ = function(screenOrientation) {
  this.setScreenTransform_();
};

/**
 * This is only needed if we are in an cross origin iframe on iOS to work around
 * this issue: https://bugs.webkit.org/show_bug.cgi?id=152299.
 */
FusionPoseSensor.prototype.onMessage_ = function(event) {
  var message = event.data;

  // If there's no message type, ignore it.
  if (!message || !message.type) {
    return;
  }

  // Ignore all messages that aren't devicemotion.
  var type = message.type.toLowerCase();
  if (type !== 'devicemotion') {
    return;
  }

  // Update device motion.
  this.updateDeviceMotion_(message.deviceMotionEvent);
};

FusionPoseSensor.prototype.setScreenTransform_ = function() {
  this.worldToScreenQ.set(0, 0, 0, 1);
  switch (window.orientation) {
    case 0:
      break;
    case 90:
      this.worldToScreenQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1), -Math.PI / 2);
      break;
    case -90:
      this.worldToScreenQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1), Math.PI / 2);
      break;
    case 180:
      // TODO.
      break;
  }
  this.inverseWorldToScreenQ.copy(this.worldToScreenQ);
  this.inverseWorldToScreenQ.inverse();
};

FusionPoseSensor.prototype.start = function() {
  this.onDeviceMotionCallback_ = this.onDeviceMotion_.bind(this);
  this.onOrientationChangeCallback_ = this.onOrientationChange_.bind(this);
  this.onMessageCallback_ = this.onMessage_.bind(this);

  // Only listen for postMessages if we're in an iOS and embedded inside a cross
  // domain IFrame. In this case, the polyfill can still work if the containing
  // page sends synthetic devicemotion events. For an example of this, see
  // iframe-message-sender.js in VR View: https://goo.gl/XDtvFZ
  if (Util.isIOS() && Util.isInsideCrossDomainIFrame()) {
    window.addEventListener('message', this.onMessageCallback_);
  }
  window.addEventListener('orientationchange', this.onOrientationChangeCallback_);
  window.addEventListener('devicemotion', this.onDeviceMotionCallback_);
};

FusionPoseSensor.prototype.stop = function() {
  window.removeEventListener('devicemotion', this.onDeviceMotionCallback_);
  window.removeEventListener('orientationchange', this.onOrientationChangeCallback_);
  window.removeEventListener('message', this.onMessageCallback_);
};

module.exports = FusionPoseSensor;

},{"../math-util.js":15,"../touch-panner.js":23,"../util.js":24,"./complementary-filter.js":19,"./pose-predictor.js":21}],21:[function(require,module,exports){
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
var MathUtil = require('../math-util');
var Util = require('../util');

/**
 * Given an orientation and the gyroscope data, predicts the future orientation
 * of the head. This makes rendering appear faster.
 *
 * Also see: http://msl.cs.uiuc.edu/~lavalle/papers/LavYerKatAnt14.pdf
 *
 * @param {Number} predictionTimeS time from head movement to the appearance of
 * the corresponding image.
 */
function PosePredictor(predictionTimeS) {
  this.predictionTimeS = predictionTimeS;

  // The quaternion corresponding to the previous state.
  this.previousQ = new MathUtil.Quaternion();
  // Previous time a prediction occurred.
  this.previousTimestampS = null;

  // The delta quaternion that adjusts the current pose.
  this.deltaQ = new MathUtil.Quaternion();
  // The output quaternion.
  this.outQ = new MathUtil.Quaternion();
}

PosePredictor.prototype.getPrediction = function(currentQ, gyro, timestampS) {
  if (!this.previousTimestampS) {
    this.previousQ.copy(currentQ);
    this.previousTimestampS = timestampS;
    return currentQ;
  }

  // Calculate axis and angle based on gyroscope rotation rate data.
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();

  var angularSpeed = gyro.length();

  // If we're rotating slowly, don't do prediction.
  if (angularSpeed < MathUtil.degToRad * 20) {
    if (Util.isDebug()) {
      console.log('Moving slowly, at %s deg/s: no prediction',
                  (MathUtil.radToDeg * angularSpeed).toFixed(1));
    }
    this.outQ.copy(currentQ);
    this.previousQ.copy(currentQ);
    return this.outQ;
  }

  // Get the predicted angle based on the time delta and latency.
  var deltaT = timestampS - this.previousTimestampS;
  var predictAngle = angularSpeed * this.predictionTimeS;

  this.deltaQ.setFromAxisAngle(axis, predictAngle);
  this.outQ.copy(this.previousQ);
  this.outQ.multiply(this.deltaQ);

  this.previousQ.copy(currentQ);
  this.previousTimestampS = timestampS;

  return this.outQ;
};


module.exports = PosePredictor;

},{"../math-util":15,"../util":24}],22:[function(require,module,exports){
function SensorSample(sample, timestampS) {
  this.set(sample, timestampS);
};

SensorSample.prototype.set = function(sample, timestampS) {
  this.sample = sample;
  this.timestampS = timestampS;
};

SensorSample.prototype.copy = function(sensorSample) {
  this.set(sensorSample.sample, sensorSample.timestampS);
};

module.exports = SensorSample;

},{}],23:[function(require,module,exports){
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
var MathUtil = require('./math-util.js');
var Util = require('./util.js');

var ROTATE_SPEED = 0.5;
/**
 * Provides a quaternion responsible for pre-panning the scene before further
 * transformations due to device sensors.
 */
function TouchPanner() {
  window.addEventListener('touchstart', this.onTouchStart_.bind(this));
  window.addEventListener('touchmove', this.onTouchMove_.bind(this));
  window.addEventListener('touchend', this.onTouchEnd_.bind(this));

  this.isTouching = false;
  this.rotateStart = new MathUtil.Vector2();
  this.rotateEnd = new MathUtil.Vector2();
  this.rotateDelta = new MathUtil.Vector2();

  this.theta = 0;
  this.orientation = new MathUtil.Quaternion();
}

TouchPanner.prototype.getOrientation = function() {
  this.orientation.setFromEulerXYZ(0, 0, this.theta);
  return this.orientation;
};

TouchPanner.prototype.resetSensor = function() {
  this.theta = 0;
};

TouchPanner.prototype.onTouchStart_ = function(e) {
  // Only respond if there is exactly one touch.
  // Note that the Daydream controller passes in a `touchstart` event with
  // no `touches` property, so we must check for that case too.
  if (!e.touches || e.touches.length != 1) {
    return;
  }
  this.rotateStart.set(e.touches[0].pageX, e.touches[0].pageY);
  this.isTouching = true;
};

TouchPanner.prototype.onTouchMove_ = function(e) {
  if (!this.isTouching) {
    return;
  }
  this.rotateEnd.set(e.touches[0].pageX, e.touches[0].pageY);
  this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
  this.rotateStart.copy(this.rotateEnd);

  // On iOS, direction is inverted.
  if (Util.isIOS()) {
    this.rotateDelta.x *= -1;
  }

  var element = document.body;
  this.theta += 2 * Math.PI * this.rotateDelta.x / element.clientWidth * ROTATE_SPEED;
};

TouchPanner.prototype.onTouchEnd_ = function(e) {
  this.isTouching = false;
};

module.exports = TouchPanner;

},{"./math-util.js":15,"./util.js":24}],24:[function(require,module,exports){
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

var Util = window.Util || {};

Util.MIN_TIMESTEP = 0.001;
Util.MAX_TIMESTEP = 1;

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.clamp = function(value, min, max) {
  return Math.min(Math.max(min, value), max);
};

Util.lerp = function(a, b, t) {
  return a + ((b - a) * t);
};

/**
 * Light polyfill for `Promise.race`. Returns
 * a promise that resolves when the first promise
 * provided resolves.
 *
 * @param {Array<Promise>} promises
 */
Util.race = function(promises) {
  if (Promise.race) {
    return Promise.race(promises);
  }

  return new Promise(function (resolve, reject) {
    for (var i = 0; i < promises.length; i++) {
      promises[i].then(resolve, reject);
    }
  });
};

Util.isIOS = (function() {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.platform);
  return function() {
    return isIOS;
  };
})();

Util.isWebViewAndroid = (function() {
  var isWebViewAndroid = navigator.userAgent.indexOf('Version') !== -1 &&
      navigator.userAgent.indexOf('Android') !== -1 &&
      navigator.userAgent.indexOf('Chrome') !== -1;
  return function() {
    return isWebViewAndroid;
  };
})();

Util.isSafari = (function() {
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return function() {
    return isSafari;
  };
})();

Util.isFirefoxAndroid = (function() {
  var isFirefoxAndroid = navigator.userAgent.indexOf('Firefox') !== -1 &&
      navigator.userAgent.indexOf('Android') !== -1;
  return function() {
    return isFirefoxAndroid;
  };
})();

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90);
};

// Helper method to validate the time steps of sensor timestamps.
Util.isTimestampDeltaValid = function(timestampDeltaS) {
  if (isNaN(timestampDeltaS)) {
    return false;
  }
  if (timestampDeltaS <= Util.MIN_TIMESTEP) {
    return false;
  }
  if (timestampDeltaS > Util.MAX_TIMESTEP) {
    return false;
  }
  return true;
};

Util.getScreenWidth = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.getScreenHeight = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.requestFullscreen = function(element) {
  if (Util.isWebViewAndroid()) {
      return false;
  }
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.exitFullscreen = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.getFullscreenElement = function() {
  return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
};

Util.linkProgram = function(gl, vertexSource, fragmentSource, attribLocationMap) {
  // No error checking for brevity.
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  for (var attribName in attribLocationMap)
    gl.bindAttribLocation(program, attribLocationMap[attribName], attribName);

  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
};

Util.getProgramUniforms = function(gl, program) {
  var uniforms = {};
  var uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  var uniformName = '';
  for (var i = 0; i < uniformCount; i++) {
    var uniformInfo = gl.getActiveUniform(program, i);
    uniformName = uniformInfo.name.replace('[0]', '');
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
  }
  return uniforms;
};

Util.orthoMatrix = function (out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right),
      bt = 1 / (bottom - top),
      nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
};

Util.copyArray = function (source, dest) {
  for (var i = 0, n = source.length; i < n; i++) {
    dest[i] = source[i];
  }
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.extend = function(dest, src) {
  for (var key in src) {
    if (src.hasOwnProperty(key)) {
      dest[key] = src[key];
    }
  }

  return dest;
}

Util.safariCssSizeWorkaround = function(canvas) {
  // TODO(smus): Remove this workaround when Safari for iOS is fixed.
  // iOS only workaround (for https://bugs.webkit.org/show_bug.cgi?id=152556).
  //
  // "To the last I grapple with thee;
  //  from hell's heart I stab at thee;
  //  for hate's sake I spit my last breath at thee."
  // -- Moby Dick, by Herman Melville
  if (Util.isIOS()) {
    var width = canvas.style.width;
    var height = canvas.style.height;
    canvas.style.width = (parseInt(width) + 1) + 'px';
    canvas.style.height = (parseInt(height)) + 'px';
    setTimeout(function() {
      canvas.style.width = width;
      canvas.style.height = height;
    }, 100);
  }

  // Debug only.
  window.Util = Util;
  window.canvas = canvas;
};

Util.isDebug = function() {
  return Util.getQueryParameter('debug');
};

Util.getQueryParameter = function(name) {
  var name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Util.frameDataFromPose = (function() {
  var piOver180 = Math.PI / 180.0;
  var rad45 = Math.PI * 0.25;

  // Borrowed from glMatrix.
  function mat4_perspectiveFromFieldOfView(out, fov, near, far) {
    var upTan = Math.tan(fov ? (fov.upDegrees * piOver180) : rad45),
    downTan = Math.tan(fov ? (fov.downDegrees * piOver180) : rad45),
    leftTan = Math.tan(fov ? (fov.leftDegrees * piOver180) : rad45),
    rightTan = Math.tan(fov ? (fov.rightDegrees * piOver180) : rad45),
    xScale = 2.0 / (leftTan + rightTan),
    yScale = 2.0 / (upTan + downTan);

    out[0] = xScale;
    out[1] = 0.0;
    out[2] = 0.0;
    out[3] = 0.0;
    out[4] = 0.0;
    out[5] = yScale;
    out[6] = 0.0;
    out[7] = 0.0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = ((upTan - downTan) * yScale * 0.5);
    out[10] = far / (near - far);
    out[11] = -1.0;
    out[12] = 0.0;
    out[13] = 0.0;
    out[14] = (far * near) / (near - far);
    out[15] = 0.0;
    return out;
  }

  function mat4_fromRotationTranslation(out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;

    return out;
  };

  function mat4_translate(out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
      a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
      a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

      out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
      out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
      out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
  };

  function mat4_invert(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
      return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
  };

  var defaultOrientation = new Float32Array([0, 0, 0, 1]);
  var defaultPosition = new Float32Array([0, 0, 0]);

  function updateEyeMatrices(projection, view, pose, parameters, vrDisplay) {
    mat4_perspectiveFromFieldOfView(projection, parameters ? parameters.fieldOfView : null, vrDisplay.depthNear, vrDisplay.depthFar);

    var orientation = pose.orientation || defaultOrientation;
    var position = pose.position || defaultPosition;

    mat4_fromRotationTranslation(view, orientation, position);
    if (parameters)
      mat4_translate(view, view, parameters.offset);
    mat4_invert(view, view);
  }

  return function(frameData, pose, vrDisplay) {
    if (!frameData || !pose)
      return false;

    frameData.pose = pose;
    frameData.timestamp = pose.timestamp;

    updateEyeMatrices(
        frameData.leftProjectionMatrix, frameData.leftViewMatrix,
        pose, vrDisplay.getEyeParameters("left"), vrDisplay);
    updateEyeMatrices(
        frameData.rightProjectionMatrix, frameData.rightViewMatrix,
        pose, vrDisplay.getEyeParameters("right"), vrDisplay);

    return true;
  };
})();

Util.isInsideCrossDomainIFrame = function() {
  var isFramed = (window.self !== window.top);
  var refDomain = Util.getDomainFromUrl(document.referrer);
  var thisDomain = Util.getDomainFromUrl(window.location.href);

  return isFramed && (refDomain !== thisDomain);
};

// From http://stackoverflow.com/a/23945027.
Util.getDomainFromUrl = function(url) {
  var domain;
  // Find & remove protocol (http, ftp, etc.) and get domain.
  if (url.indexOf("://") > -1) {
    domain = url.split('/')[2];
  }
  else {
    domain = url.split('/')[0];
  }

  //find & remove port number
  domain = domain.split(':')[0];

  return domain;
}

module.exports = Util;

},{}],25:[function(require,module,exports){
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

var DeviceInfo = require('./device-info.js');
var Util = require('./util.js');

var DEFAULT_VIEWER = 'CardboardV1';
var VIEWER_KEY = 'WEBVR_CARDBOARD_VIEWER';
var CLASS_NAME = 'webvr-polyfill-viewer-selector';

/**
 * Creates a viewer selector with the options specified. Supports being shown
 * and hidden. Generates events when viewer parameters change. Also supports
 * saving the currently selected index in localStorage.
 */
function ViewerSelector() {
  // Try to load the selected key from local storage.
  try {
    this.selectedKey = localStorage.getItem(VIEWER_KEY);
  } catch (error) {
    console.error('Failed to load viewer profile: %s', error);
  }

  //If none exists, or if localstorage is unavailable, use the default key.
  if (!this.selectedKey) {
    this.selectedKey = DEFAULT_VIEWER;
  }

  this.dialog = this.createDialog_(DeviceInfo.Viewers);
  this.root = null;
  this.onChangeCallbacks_ = [];
}

ViewerSelector.prototype.show = function(root) {
  this.root = root;

  root.appendChild(this.dialog);

  // Ensure the currently selected item is checked.
  var selected = this.dialog.querySelector('#' + this.selectedKey);
  selected.checked = true;

  // Show the UI.
  this.dialog.style.display = 'block';
};

ViewerSelector.prototype.hide = function() {
  if (this.root && this.root.contains(this.dialog)) {
    this.root.removeChild(this.dialog);
  }
  this.dialog.style.display = 'none';
};

ViewerSelector.prototype.getCurrentViewer = function() {
  return DeviceInfo.Viewers[this.selectedKey];
};

ViewerSelector.prototype.getSelectedKey_ = function() {
  var input = this.dialog.querySelector('input[name=field]:checked');
  if (input) {
    return input.id;
  }
  return null;
};

ViewerSelector.prototype.onChange = function(cb) {
  this.onChangeCallbacks_.push(cb);
};

ViewerSelector.prototype.fireOnChange_ = function(viewer) {
  for (var i = 0; i < this.onChangeCallbacks_.length; i++) {
    this.onChangeCallbacks_[i](viewer);
  }
};

ViewerSelector.prototype.onSave_ = function() {
  this.selectedKey = this.getSelectedKey_();
  if (!this.selectedKey || !DeviceInfo.Viewers[this.selectedKey]) {
    console.error('ViewerSelector.onSave_: this should never happen!');
    return;
  }

  this.fireOnChange_(DeviceInfo.Viewers[this.selectedKey]);

  // Attempt to save the viewer profile, but fails in private mode.
  try {
    localStorage.setItem(VIEWER_KEY, this.selectedKey);
  } catch(error) {
    console.error('Failed to save viewer profile: %s', error);
  }
  this.hide();
};

/**
 * Creates the dialog.
 */
ViewerSelector.prototype.createDialog_ = function(options) {
  var container = document.createElement('div');
  container.classList.add(CLASS_NAME);
  container.style.display = 'none';
  // Create an overlay that dims the background, and which goes away when you
  // tap it.
  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.left = 0;
  s.top = 0;
  s.width = '100%';
  s.height = '100%';
  s.background = 'rgba(0, 0, 0, 0.3)';
  overlay.addEventListener('click', this.hide.bind(this));

  var width = 280;
  var dialog = document.createElement('div');
  var s = dialog.style;
  s.boxSizing = 'border-box';
  s.position = 'fixed';
  s.top = '24px';
  s.left = '50%';
  s.marginLeft = (-width/2) + 'px';
  s.width = width + 'px';
  s.padding = '24px';
  s.overflow = 'hidden';
  s.background = '#fafafa';
  s.fontFamily = "'Roboto', sans-serif";
  s.boxShadow = '0px 5px 20px #666';

  dialog.appendChild(this.createH1_('Select your viewer'));
  for (var id in options) {
    dialog.appendChild(this.createChoice_(id, options[id].label));
  }
  dialog.appendChild(this.createButton_('Save', this.onSave_.bind(this)));

  container.appendChild(overlay);
  container.appendChild(dialog);

  return container;
};

ViewerSelector.prototype.createH1_ = function(name) {
  var h1 = document.createElement('h1');
  var s = h1.style;
  s.color = 'black';
  s.fontSize = '20px';
  s.fontWeight = 'bold';
  s.marginTop = 0;
  s.marginBottom = '24px';
  h1.innerHTML = name;
  return h1;
};

ViewerSelector.prototype.createChoice_ = function(id, name) {
  /*
  <div class="choice">
  <input id="v1" type="radio" name="field" value="v1">
  <label for="v1">Cardboard V1</label>
  </div>
  */
  var div = document.createElement('div');
  div.style.marginTop = '8px';
  div.style.color = 'black';

  var input = document.createElement('input');
  input.style.fontSize = '30px';
  input.setAttribute('id', id);
  input.setAttribute('type', 'radio');
  input.setAttribute('value', id);
  input.setAttribute('name', 'field');

  var label = document.createElement('label');
  label.style.marginLeft = '4px';
  label.setAttribute('for', id);
  label.innerHTML = name;

  div.appendChild(input);
  div.appendChild(label);

  return div;
};

ViewerSelector.prototype.createButton_ = function(label, onclick) {
  var button = document.createElement('button');
  button.innerHTML = label;
  var s = button.style;
  s.float = 'right';
  s.textTransform = 'uppercase';
  s.color = '#1094f7';
  s.fontSize = '14px';
  s.letterSpacing = 0;
  s.border = 0;
  s.background = 'none';
  s.marginTop = '16px';

  button.addEventListener('click', onclick);

  return button;
};

module.exports = ViewerSelector;

},{"./device-info.js":9,"./util.js":24}],26:[function(require,module,exports){
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

var Util = require('./util.js');

/**
 * Android and iOS compatible wakelock implementation.
 *
 * Refactored thanks to dkovalev@.
 */
function AndroidWakeLock() {
  var video = document.createElement('video');
  video.setAttribute('loop', '');

  function addSourceToVideo(element, type, dataURI) {
    var source = document.createElement('source');
    source.src = dataURI;
    source.type = 'video/' + type;
    element.appendChild(source);
  }

  addSourceToVideo(video,'webm', Util.base64('video/webm', 'GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA='));
  addSourceToVideo(video, 'mp4', Util.base64('video/mp4', 'AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthADAowdbb9/AAAC6W1vb3YAAABsbXZoZAAAAAB8JbCAfCWwgAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIVdHJhawAAAFx0a2hkAAAAD3wlsIB8JbCAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAABsW1kaWEAAAAgbWRoZAAAAAB8JbCAfCWwgAAAA+gAAAAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVxtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEcc3RibAAAALhzdHNkAAAAAAAAAAEAAACobXA0dgAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAIAAgASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAFJlc2RzAAAAAANEAAEABDwgEQAAAAADDUAAAAAABS0AAAGwAQAAAbWJEwAAAQAAAAEgAMSNiB9FAEQBFGMAAAGyTGF2YzUyLjg3LjQGAQIAAAAYc3R0cwAAAAAAAAABAAAAAQAAAAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAEwAAAAEAAAAUc3RjbwAAAAAAAAABAAAALAAAAGB1ZHRhAAAAWG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAAK2lsc3QAAAAjqXRvbwAAABtkYXRhAAAAAQAAAABMYXZmNTIuNzguMw=='));

  this.request = function() {
    if (video.paused) {
      video.play();
    }
  };

  this.release = function() {
    video.pause();
  };
}

function iOSWakeLock() {
  var timer = null;

  this.request = function() {
    if (!timer) {
      timer = setInterval(function() {
        window.location = window.location;
        setTimeout(window.stop, 0);
      }, 30000);
    }
  }

  this.release = function() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
}


function getWakeLock() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
    return iOSWakeLock;
  } else {
    return AndroidWakeLock;
  }
}

module.exports = getWakeLock();
},{"./util.js":24}],27:[function(require,module,exports){
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

var Util = require('./util.js');
var CardboardVRDisplay = require('./cardboard-vr-display.js');
var MouseKeyboardVRDisplay = require('./mouse-keyboard-vr-display.js');
// Uncomment to add positional tracking via webcam.
//var WebcamPositionSensorVRDevice = require('./webcam-position-sensor-vr-device.js');
var VRDisplay = require('./base.js').VRDisplay;
var VRFrameData = require('./base.js').VRFrameData;
var HMDVRDevice = require('./base.js').HMDVRDevice;
var PositionSensorVRDevice = require('./base.js').PositionSensorVRDevice;
var VRDisplayHMDDevice = require('./display-wrappers.js').VRDisplayHMDDevice;
var VRDisplayPositionSensorDevice = require('./display-wrappers.js').VRDisplayPositionSensorDevice;
var version = require('../package.json').version;

function WebVRPolyfill() {
  this.displays = [];
  this.devices = []; // For deprecated objects
  this.devicesPopulated = false;
  this.nativeWebVRAvailable = this.isWebVRAvailable();
  this.nativeLegacyWebVRAvailable = this.isDeprecatedWebVRAvailable();
  this.nativeGetVRDisplaysFunc = this.nativeWebVRAvailable ?
                                 navigator.getVRDisplays :
                                 null;

  // https://github.com/gkatsev/webvr-polyfill/commit/8f8f071bd2657a24ccbd8c63ab34564dd024ea09
  if (!this.nativeLegacyWebVRAvailable && !this.nativeWebVRAvailable) {
    this.enablePolyfill();
    if (window.WebVRConfig.ENABLE_DEPRECATED_API) {
      this.enableDeprecatedPolyfill();
    }
  }

  // Put a shim in place to update the API to 1.1 if needed.
  InstallWebVRSpecShim();
}

WebVRPolyfill.prototype.isWebVRAvailable = function() {
  return ('getVRDisplays' in navigator);
};

WebVRPolyfill.prototype.isDeprecatedWebVRAvailable = function() {
  return ('getVRDevices' in navigator) || ('mozGetVRDevices' in navigator);
};

WebVRPolyfill.prototype.connectDisplay = function(vrDisplay) {
  vrDisplay.fireVRDisplayConnect_();
  this.displays.push(vrDisplay);
};

WebVRPolyfill.prototype.populateDevices = function() {
  if (this.devicesPopulated) {
    return;
  }

  // Initialize our virtual VR devices.
  var vrDisplay = null;

  // Add a Cardboard VRDisplay on compatible mobile devices
  if (this.isCardboardCompatible()) {
    vrDisplay = new CardboardVRDisplay();

    this.connectDisplay(vrDisplay);

    // For backwards compatibility
    if (window.WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Add a Mouse and Keyboard driven VRDisplay for desktops/laptops
  if (!this.isMobile() && !window.WebVRConfig.MOUSE_KEYBOARD_CONTROLS_DISABLED) {
    vrDisplay = new MouseKeyboardVRDisplay();
    this.connectDisplay(vrDisplay);

    // For backwards compatibility
    if (window.WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Uncomment to add positional tracking via webcam.
  //if (!this.isMobile() && window.WebVRConfig.ENABLE_DEPRECATED_API) {
  //  positionDevice = new WebcamPositionSensorVRDevice();
  //  this.devices.push(positionDevice);
  //}

  this.devicesPopulated = true;
};

WebVRPolyfill.prototype.enablePolyfill = function() {
  // Provide navigator.getVRDisplays.
  navigator.getVRDisplays = this.getVRDisplays.bind(this);

  // Polyfill native VRDisplay.getFrameData
  if (this.nativeWebVRAvailable && window.VRFrameData) {
    var NativeVRFrameData = window.VRFrameData;
    var nativeFrameData = new window.VRFrameData();
    var nativeGetFrameData = window.VRDisplay.prototype.getFrameData;
    window.VRFrameData = VRFrameData;

    window.VRDisplay.prototype.getFrameData = function(frameData) {
      if (frameData instanceof NativeVRFrameData) {
        nativeGetFrameData.call(this, frameData);
        return;
      }

      /*
      Copy frame data from the native object into the polyfilled object.
      */

      nativeGetFrameData.call(this, nativeFrameData);
      frameData.pose = nativeFrameData.pose;
      Util.copyArray(nativeFrameData.leftProjectionMatrix, frameData.leftProjectionMatrix);
      Util.copyArray(nativeFrameData.rightProjectionMatrix, frameData.rightProjectionMatrix);
      Util.copyArray(nativeFrameData.leftViewMatrix, frameData.leftViewMatrix);
      Util.copyArray(nativeFrameData.rightViewMatrix, frameData.rightViewMatrix);
      //todo: copy
    };
  }

  // Provide the `VRDisplay` object.
  window.VRDisplay = VRDisplay;

  // Provide the `navigator.vrEnabled` property.
  if (navigator && !navigator.vrEnabled) {
    var self = this;
    Object.defineProperty(navigator, 'vrEnabled', {
      get: function () {
        return self.isCardboardCompatible() &&
            (self.isFullScreenAvailable() || Util.isIOS());
      }
    });
  }

  if (!('VRFrameData' in window)) {
    // Provide the VRFrameData object.
    window.VRFrameData = VRFrameData;
  }
};

WebVRPolyfill.prototype.enableDeprecatedPolyfill = function() {
  // Provide navigator.getVRDevices.
  navigator.getVRDevices = this.getVRDevices.bind(this);

  // Provide the CardboardHMDVRDevice and PositionSensorVRDevice objects.
  window.HMDVRDevice = HMDVRDevice;
  window.PositionSensorVRDevice = PositionSensorVRDevice;
};

WebVRPolyfill.prototype.getVRDisplays = function() {
  this.populateDevices();
  var polyfillDisplays = this.displays;

  if (!this.nativeWebVRAvailable) {
    return Promise.resolve(polyfillDisplays);
  }

  // Set up a race condition if this browser has a bug where
  // `navigator.getVRDisplays()` never resolves.
  var timeoutId;
  var vrDisplaysNative = this.nativeGetVRDisplaysFunc.call(navigator);
  var timeoutPromise = new Promise(function(resolve) {
    timeoutId = setTimeout(function() {
      console.warn('Native WebVR implementation detected, but `getVRDisplays()` failed to resolve. Falling back to polyfill.');
      resolve([]);
    }, window.WebVRConfig.GET_VR_DISPLAYS_TIMEOUT);
  });

  return Util.race([
    vrDisplaysNative,
    timeoutPromise
  ]).then(function(nativeDisplays) {
    clearTimeout(timeoutId);
    if (window.WebVRConfig.ALWAYS_APPEND_POLYFILL_DISPLAY) {
      return nativeDisplays.concat(polyfillDisplays);
    } else {
      return nativeDisplays.length > 0 ? nativeDisplays : polyfillDisplays;
    }
  });
};

WebVRPolyfill.prototype.getVRDevices = function() {
  console.warn('getVRDevices is deprecated. Please update your code to use getVRDisplays instead.');
  var self = this;
  return new Promise(function(resolve, reject) {
    try {
      if (!self.devicesPopulated) {
        if (self.nativeWebVRAvailable) {
          return navigator.getVRDisplays(function(displays) {
            for (var i = 0; i < displays.length; ++i) {
              self.devices.push(new VRDisplayHMDDevice(displays[i]));
              self.devices.push(new VRDisplayPositionSensorDevice(displays[i]));
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }

        if (self.nativeLegacyWebVRAvailable) {
          return (navigator.getVRDDevices || navigator.mozGetVRDevices)(function(devices) {
            for (var i = 0; i < devices.length; ++i) {
              if (devices[i] instanceof HMDVRDevice) {
                self.devices.push(devices[i]);
              }
              if (devices[i] instanceof PositionSensorVRDevice) {
                self.devices.push(devices[i]);
              }
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }
      }

      self.populateDevices();
      resolve(self.devices);
    } catch (e) {
      reject(e);
    }
  });
};

WebVRPolyfill.prototype.NativeVRFrameData = window.VRFrameData;

/**
 * Determine if a device is mobile.
 */
WebVRPolyfill.prototype.isMobile = function() {
  return /Android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

WebVRPolyfill.prototype.isCardboardCompatible = function() {
  // For now, support all iOS and Android devices.
  // Also enable the WebVRConfig.FORCE_VR flag for debugging.
  return this.isMobile() || window.WebVRConfig.FORCE_ENABLE_VR;
};

WebVRPolyfill.prototype.isFullScreenAvailable = function() {
  return (document.fullscreenEnabled ||
          document.mozFullScreenEnabled ||
          document.webkitFullscreenEnabled ||
          false);
};

// Installs a shim that updates a WebVR 1.0 spec implementation to WebVR 1.1
function InstallWebVRSpecShim() {
  if ('VRDisplay' in window && !('VRFrameData' in window)) {
    // Provide the VRFrameData object.
    window.VRFrameData = VRFrameData;

    // A lot of Chrome builds don't have depthNear and depthFar, even
    // though they're in the WebVR 1.0 spec. Patch them in if they're not present.
    if(!('depthNear' in window.VRDisplay.prototype)) {
      window.VRDisplay.prototype.depthNear = 0.01;
    }

    if(!('depthFar' in window.VRDisplay.prototype)) {
      window.VRDisplay.prototype.depthFar = 10000.0;
    }

    window.VRDisplay.prototype.getFrameData = function(frameData) {
      return Util.frameDataFromPose(frameData, this.getPose(), this);
    }
  }
};

WebVRPolyfill.InstallWebVRSpecShim = InstallWebVRSpecShim;
WebVRPolyfill.version = version;

module.exports.WebVRPolyfill = WebVRPolyfill;

},{"../package.json":3,"./base.js":4,"./cardboard-vr-display.js":7,"./display-wrappers.js":10,"./mouse-keyboard-vr-display.js":16,"./util.js":24}],28:[function(require,module,exports){
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
      vrDisplay.requestAnimationFrame(render);
    }
  });
}

function render() {
  renderer.render();

  vrDisplay.requestAnimationFrame(render);
}

window.addEventListener('load', onLoad);

},{"./renderer.js":29}],29:[function(require,module,exports){
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

var _webvrPolyfill = require('webvr-polyfill');

var _webvrPolyfill2 = _interopRequireDefault(_webvrPolyfill);

var _rayInput = require('../ray-input');

var _rayInput2 = _interopRequireDefault(_rayInput);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WIDTH = 1;
var HEIGHT = 1;
var DEFAULT_COLOR = new THREE.Color(0x00FF00);
var HIGHLIGHT_COLOR = new THREE.Color(0x1E90FF);
var ACTIVE_COLOR = new THREE.Color(0xFF3333);

/**
 * Renders a menu of items that can be interacted with.
 */

var MenuRenderer = function () {
  function MenuRenderer() {
    var _this = this;

    _classCallCheck(this, MenuRenderer);

    var world = void 0,
        projector = void 0,
        boxShape = void 0,
        boxBody = void 0;
    var dt = 1 / 60;
    var constraintDown = false;
    var jointBody = void 0,
        constrainedBody = void 0,
        mouseConstraint = void 0;
    var N = 1;
    var clickMarker = false;
    var geometry = void 0,
        material = void 0,
        mesh = void 0;
    // To be synced
    var meshes = [],
        bodies = [];

    // Setup our world
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    world.gravity.set(0, -4, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Create boxes
    var mass = 5,
        radius = 1.3;
    boxShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    for (var _i = 0; _i < N; _i++) {
      boxBody = new CANNON.Body({ mass: mass });
      boxBody.addShape(boxShape);
      boxBody.position.set(-7, 5, 0);
      world.addBody(boxBody);
      bodies.push(boxBody);
    }

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

    // projector = new THREE.Projector();

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
    // renderer.setSize( window.innerWidth, window.innerHeight );
    // container.appendChild( renderer.domElement );

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
    rayInput.on('raydrag', function (opt_mesh) {
      _this.handleRayDrag_();
    });
    rayInput.on('rayup', function (opt_mesh) {
      _this.handleRayUp_(opt_mesh);
    });
    rayInput.on('raycancel', function (opt_mesh) {
      _this.handleRayCancel_(opt_mesh);
    });
    rayInput.on('rayover', function (mesh) {
      _this.setSelected_(mesh, true);
    });
    rayInput.on('rayout', function (mesh) {
      _this.setSelected_(mesh, false);
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
    this.mouseConstraint = mouseConstraint;
    this.jointBody = jointBody;

    // lights
    var light = void 0,
        materials = void 0;
    scene.add(new THREE.AmbientLight(0x666666));

    light = new THREE.DirectionalLight(0xffffff, 1.75);
    var d = 20;

    light.position.set(d, d, d);

    light.castShadow = true;
    //light.shadowCameraVisible = true;

    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;

    light.shadowCameraLeft = -d;
    light.shadowCameraRight = d;
    light.shadowCameraTop = d;
    light.shadowCameraBottom = -d;

    light.shadowCameraFar = 3 * d;
    light.shadowCameraNear = d;
    light.shadowDarkness = 0.5;

    scene.add(light);

    // floor
    geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
    material = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    this.markerMaterial = markerMaterial;
    //THREE.ColorUtils.adjustHSV( material.color, 0, 0, 0.9 );
    mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    mesh.receiveShadow = true;
    mesh.position.y = -0.1;
    scene.add(mesh);

    // cubes
    var cubeGeo = new THREE.BoxGeometry(1, 1, 1, 10, 10);
    var cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x29ad83 });
    var cubeMesh, sphereMesh;
    for (var i = 0; i < N; i++) {
      cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial);
      cubeMesh.castShadow = true;
      this.meshes.push(cubeMesh);
      this.scene.add(cubeMesh);
      rayInput.add(cubeMesh);
    }

    // Add a floor.
    // var floor = this.createFloor_();
    // this.scene.add(floor);
  }
  //


  _createClass(MenuRenderer, [{
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
      this.updatePhysics();
      this.effect.render(this.scene, this.camera);
    }
  }, {
    key: 'resize',
    value: function resize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
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
      this.setAction_(opt_mesh, true);

      var pos = this.rayInput.renderer.reticle.position;
      if (pos) {
        this.constraintDown = true;
        // Set marker on contact point
        this.setClickMarker(pos.x, pos.y, pos.z, this.scene);

        // Set the movement plane
        // setScreenPerpCenter(pos,camera);

        var idx = this.meshes.indexOf(opt_mesh);
        if (idx !== -1) {
          this.addMouseConstraint(pos.x, pos.y, pos.z, this.bodies[idx]);
        }
      }
    }
  }, {
    key: 'handleRayDrag_',
    value: function handleRayDrag_(opt_mesh) {
      // Move and project on the plane
      if (this.mouseConstraint) {
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
      this.setAction_(opt_mesh, false);

      this.constraintDown = false;
      // remove the marker
      this.removeClickMarker();

      // Send the remove mouse joint to server
      this.removeJointConstraint();
    }
  }, {
    key: 'handleRayCancel_',
    value: function handleRayCancel_(opt_mesh) {
      this.setAction_(opt_mesh, false);
    }
  }, {
    key: 'setSelected_',
    value: function setSelected_(mesh, isSelected) {
      //console.log('setSelected_', isSelected);
      var newColor = isSelected ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
      mesh.material.color = newColor;
    }
  }, {
    key: 'setAction_',
    value: function setAction_(opt_mesh, isActive) {
      //console.log('setAction_', !!opt_mesh, isActive);
      if (opt_mesh) {
        var newColor = isActive ? ACTIVE_COLOR : HIGHLIGHT_COLOR;
        opt_mesh.material.color = newColor;
        if (!isActive) {
          opt_mesh.material.wireframe = !opt_mesh.material.wireframe;
        }
      }
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
    key: 'addMouseConstraint',
    value: function addMouseConstraint(x, y, z, body) {
      // The cannon body constrained by the mouse joint
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
      this.mouseConstraint = new CANNON.PointToPointConstraint(this.constrainedBody, pivot, this.jointBody, new CANNON.Vec3(0, 0, 0));

      // Add the constriant to world
      this.world.addConstraint(this.mouseConstraint);
    }

    // This function moves the transparent joint body to a new position in space

  }, {
    key: 'moveJointToPoint',
    value: function moveJointToPoint(x, y, z) {
      // Move the joint body to a new position
      this.jointBody.position.set(x, y, z);
      this.mouseConstraint.update();
    }
  }, {
    key: 'removeJointConstraint',
    value: function removeJointConstraint() {
      // Remove constraint from world
      this.world.removeConstraint(this.mouseConstraint);
      this.mouseConstraint = false;
    }
  }, {
    key: 'createFloor_',
    value: function createFloor_() {
      var boxSize = 10;
      var loader = new THREE.TextureLoader();
      loader.load('img/box.png', onTextureLoaded);
      var out = new THREE.Object3D();

      function onTextureLoaded(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(boxSize, boxSize);

        var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        var material = new THREE.MeshBasicMaterial({
          map: texture,
          color: 0x015500,
          side: THREE.BackSide
        });

        // Align the skybox to the floor (which is at y=0).
        var skybox = new THREE.Mesh(geometry, material);
        skybox.position.y = boxSize / 2;

        out.add(skybox);
      }
      return out;
    }
  }]);

  return MenuRenderer;
}();

exports.default = MenuRenderer;

},{"../ray-input":32,"webvr-boilerplate":2,"webvr-polyfill":17}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{"./ray-interaction-modes":33,"./util":35,"eventemitter3":1}],32:[function(require,module,exports){
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
      this.emit('raydrag');
    }
  }, {
    key: 'onRayUp_',
    value: function onRayUp_(e) {
      //console.log('onRayUp_');
      var mesh = this.renderer.getSelectedMesh();
      this.emit('rayup', mesh);

      this.renderer.setActive(false);
    }
  }, {
    key: 'onRayCancel_',
    value: function onRayCancel_(e) {
      //console.log('onRayCancel_');
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

},{"./orientation-arm-model":30,"./ray-controller":31,"./ray-interaction-modes":33,"./ray-renderer":34,"eventemitter3":1}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
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
        if (!isIntersected && isSelected) {
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

},{"./util":35,"eventemitter3":1}],35:[function(require,module,exports){
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

},{}]},{},[28])(28)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4xMC4wL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvd2VidnItYm9pbGVycGxhdGUvYnVpbGQvd2VidnItbWFuYWdlci5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9wYWNrYWdlLmpzb24iLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2Jhc2UuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2NhcmRib2FyZC1kaXN0b3J0ZXIuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2NhcmRib2FyZC11aS5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvY2FyZGJvYXJkLXZyLWRpc3BsYXkuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2RlcHMvd2dsdS1wcmVzZXJ2ZS1zdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvZGV2aWNlLWluZm8uanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2Rpc3BsYXktd3JhcHBlcnMuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2Rpc3RvcnRpb24vZGlzdG9ydGlvbi5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvZHBkYi9kcGRiLmpzb24iLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2RwZGIvZHBkYi5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvbWF0aC11dGlsLmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy9tb3VzZS1rZXlib2FyZC12ci1kaXNwbGF5LmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy9ub2RlLWVudHJ5LmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy9yb3RhdGUtaW5zdHJ1Y3Rpb25zLmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy9zZW5zb3ItZnVzaW9uL2NvbXBsZW1lbnRhcnktZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy9zZW5zb3ItZnVzaW9uL2Z1c2lvbi1wb3NlLXNlbnNvci5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvc2Vuc29yLWZ1c2lvbi9wb3NlLXByZWRpY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvc2Vuc29yLWZ1c2lvbi9zZW5zb3Itc2FtcGxlLmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy90b3VjaC1wYW5uZXIuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL3V0aWwuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL3ZpZXdlci1zZWxlY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvd2FrZWxvY2suanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL3dlYnZyLXBvbHlmaWxsLmpzIiwic3JjL2V4YW1wbGUvbWFpbi5qcyIsInNyYy9leGFtcGxlL3JlbmRlcmVyLmpzIiwic3JjL29yaWVudGF0aW9uLWFybS1tb2RlbC5qcyIsInNyYy9yYXktY29udHJvbGxlci5qcyIsInNyYy9yYXktaW5wdXQuanMiLCJzcmMvcmF5LWludGVyYWN0aW9uLW1vZGVzLmpzIiwic3JjL3JheS1yZW5kZXJlci5qcyIsInNyYy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Y0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeG9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDai9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoUkE7Ozs7OztBQUVBLElBQUksaUJBQUosQyxDQWpCQTs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLElBQUksa0JBQUo7O0FBRUEsU0FBUyxNQUFULEdBQWtCO0FBQ2hCLGFBQVcsd0JBQVg7O0FBRUEsU0FBTyxnQkFBUCxDQUF3QixRQUF4QixFQUFr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a0IsVzs7Ozs7Ozs7UUN4QkwsUSxHQUFBLFE7UUFNQSxNLEdBQUEsTTtBQXJCaEI7Ozs7Ozs7Ozs7Ozs7OztBQWVPLFNBQVMsUUFBVCxHQUFvQjtBQUN6QixNQUFJLFFBQVEsS0FBWjtBQUNBLEdBQUMsVUFBUyxDQUFULEVBQVc7QUFBQyxRQUFHLDJUQUEyVCxJQUEzVCxDQUFnVSxDQUFoVSxLQUFvVSwwa0RBQTBrRCxJQUExa0QsQ0FBK2tELEVBQUUsTUFBRixDQUFTLENBQVQsRUFBVyxDQUFYLENBQS9rRCxDQUF2VSxFQUFxNkQsUUFBUSxJQUFSO0FBQWEsR0FBLzdELEVBQWk4RCxVQUFVLFNBQVYsSUFBcUIsVUFBVSxNQUEvQixJQUF1QyxPQUFPLEtBQS8rRDtBQUNBLFNBQU8sS0FBUDtBQUNEOztBQUVNLFNBQVMsTUFBVCxDQUFnQixRQUFoQixFQUEwQixNQUExQixFQUFrQztBQUN2QyxTQUFPLFVBQVUsUUFBVixHQUFxQixVQUFyQixHQUFrQyxNQUF6QztBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vXG4vLyBXZSBzdG9yZSBvdXIgRUUgb2JqZWN0cyBpbiBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBgfmAgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Qgb3ZlcnJpZGRlbiBvclxuLy8gdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy8gV2UgYWxzbyBhc3N1bWUgdGhhdCBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgYXZhaWxhYmxlIHdoZW4gdGhlIGV2ZW50IG5hbWVcbi8vIGlzIGFuIEVTNiBTeW1ib2wuXG4vL1xudmFyIHByZWZpeCA9IHR5cGVvZiBPYmplY3QuY3JlYXRlICE9PSAnZnVuY3Rpb24nID8gJ34nIDogZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgRXZlbnRFbWl0dGVyIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEV2ZW50IGhhbmRsZXIgdG8gYmUgY2FsbGVkLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBDb250ZXh0IGZvciBmdW5jdGlvbiBleGVjdXRpb24uXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBPbmx5IGVtaXQgb25jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogRXZlbnRFbWl0dGVyIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHsgLyogTm90aGluZyB0byBzZXQgKi8gfVxuXG4vKipcbiAqIEhvbGQgdGhlIGFzc2lnbmVkIEV2ZW50RW1pdHRlcnMgYnkgbmFtZS5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1xuICAgICwgbmFtZXMgPSBbXVxuICAgICwgbmFtZTtcblxuICBpZiAoIWV2ZW50cykgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiBldmVudHMpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGEgbGlzdCBvZiBhc3NpZ25lZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudHMgdGhhdCBzaG91bGQgYmUgbGlzdGVkLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgV2Ugb25seSBuZWVkIHRvIGtub3cgaWYgdGhlcmUgYXJlIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtBcnJheXxCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQsIGV4aXN0cykge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgYXZhaWxhYmxlID0gdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogRW1pdCBhbiBldmVudCB0byBhbGwgcmVnaXN0ZXJlZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBJbmRpY2F0aW9uIGlmIHdlJ3ZlIGVtaXR0ZWQgYW4gZXZlbnQuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgbGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgbmV3IEV2ZW50TGlzdGVuZXIgZm9yIHRoZSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhbiBFdmVudExpc3RlbmVyIHRoYXQncyBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3ZSB3YW50IHRvIHJlbW92ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciB0aGF0IHdlIG5lZWQgdG8gZmluZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgT25seSByZW1vdmUgbGlzdGVuZXJzIG1hdGNoaW5nIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmNlIGxpc3RlbmVycy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGV2ZW50cyA9IFtdO1xuXG4gIGlmIChmbikge1xuICAgIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVycy5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVycyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm5cbiAgICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICAgICkge1xuICAgICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gIC8vXG4gIGlmIChldmVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICB9IGVsc2Uge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBvciBvbmx5IHRoZSBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3YW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcblxuICBpZiAoZXZlbnQpIGRlbGV0ZSB0aGlzLl9ldmVudHNbcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudF07XG4gIGVsc2UgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiKGZ1bmN0aW9uKGYpe2lmKHR5cGVvZiBleHBvcnRzPT09XCJvYmplY3RcIiYmdHlwZW9mIG1vZHVsZSE9PVwidW5kZWZpbmVkXCIpe21vZHVsZS5leHBvcnRzPWYoKX1lbHNlIGlmKHR5cGVvZiBkZWZpbmU9PT1cImZ1bmN0aW9uXCImJmRlZmluZS5hbWQpe2RlZmluZShbXSxmKX1lbHNle3ZhciBnO2lmKHR5cGVvZiB3aW5kb3chPT1cInVuZGVmaW5lZFwiKXtnPXdpbmRvd31lbHNlIGlmKHR5cGVvZiBnbG9iYWwhPT1cInVuZGVmaW5lZFwiKXtnPWdsb2JhbH1lbHNlIGlmKHR5cGVvZiBzZWxmIT09XCJ1bmRlZmluZWRcIil7Zz1zZWxmfWVsc2V7Zz10aGlzfWcuV2ViVlJNYW5hZ2VyID0gZigpfX0pKGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEVtaXR0ZXIgPSBfZGVyZXFfKCcuL2VtaXR0ZXIuanMnKTtcbnZhciBNb2RlcyA9IF9kZXJlcV8oJy4vbW9kZXMuanMnKTtcbnZhciBVdGlsID0gX2RlcmVxXygnLi91dGlsLmpzJyk7XG5cbi8qKlxuICogRXZlcnl0aGluZyBoYXZpbmcgdG8gZG8gd2l0aCB0aGUgV2ViVlIgYnV0dG9uLlxuICogRW1pdHMgYSAnY2xpY2snIGV2ZW50IHdoZW4gaXQncyBjbGlja2VkLlxuICovXG5mdW5jdGlvbiBCdXR0b25NYW5hZ2VyKG9wdF9yb290KSB7XG4gIHZhciByb290ID0gb3B0X3Jvb3QgfHwgZG9jdW1lbnQuYm9keTtcbiAgdGhpcy5sb2FkSWNvbnNfKCk7XG5cbiAgLy8gTWFrZSB0aGUgZnVsbHNjcmVlbiBidXR0b24uXG4gIHZhciBmc0J1dHRvbiA9IHRoaXMuY3JlYXRlQnV0dG9uKCk7XG4gIGZzQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuZnVsbHNjcmVlbjtcbiAgZnNCdXR0b24udGl0bGUgPSAnRnVsbHNjcmVlbiBtb2RlJztcbiAgdmFyIHMgPSBmc0J1dHRvbi5zdHlsZTtcbiAgcy5ib3R0b20gPSAwO1xuICBzLnJpZ2h0ID0gMDtcbiAgZnNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNyZWF0ZUNsaWNrSGFuZGxlcl8oJ2ZzJykpO1xuICByb290LmFwcGVuZENoaWxkKGZzQnV0dG9uKTtcbiAgdGhpcy5mc0J1dHRvbiA9IGZzQnV0dG9uO1xuXG4gIC8vIE1ha2UgdGhlIFZSIGJ1dHRvbi5cbiAgdmFyIHZyQnV0dG9uID0gdGhpcy5jcmVhdGVCdXR0b24oKTtcbiAgdnJCdXR0b24uc3JjID0gdGhpcy5JQ09OUy5jYXJkYm9hcmQ7XG4gIHZyQnV0dG9uLnRpdGxlID0gJ1ZpcnR1YWwgcmVhbGl0eSBtb2RlJztcbiAgdmFyIHMgPSB2ckJ1dHRvbi5zdHlsZTtcbiAgcy5ib3R0b20gPSAwO1xuICBzLnJpZ2h0ID0gJzQ4cHgnO1xuICB2ckJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuY3JlYXRlQ2xpY2tIYW5kbGVyXygndnInKSk7XG4gIHJvb3QuYXBwZW5kQ2hpbGQodnJCdXR0b24pO1xuICB0aGlzLnZyQnV0dG9uID0gdnJCdXR0b247XG5cbiAgdGhpcy5pc1Zpc2libGUgPSB0cnVlO1xuXG59XG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZSA9IG5ldyBFbWl0dGVyKCk7XG5cbkJ1dHRvbk1hbmFnZXIucHJvdG90eXBlLmNyZWF0ZUJ1dHRvbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gIGJ1dHRvbi5jbGFzc05hbWUgPSAnd2VidnItYnV0dG9uJztcbiAgdmFyIHMgPSBidXR0b24uc3R5bGU7XG4gIHMucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBzLndpZHRoID0gJzI0cHgnXG4gIHMuaGVpZ2h0ID0gJzI0cHgnO1xuICBzLmJhY2tncm91bmRTaXplID0gJ2NvdmVyJztcbiAgcy5iYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICBzLmJvcmRlciA9IDA7XG4gIHMudXNlclNlbGVjdCA9ICdub25lJztcbiAgcy53ZWJraXRVc2VyU2VsZWN0ID0gJ25vbmUnO1xuICBzLk1velVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gIHMuY3Vyc29yID0gJ3BvaW50ZXInO1xuICBzLnBhZGRpbmcgPSAnMTJweCc7XG4gIHMuekluZGV4ID0gMTtcbiAgcy5kaXNwbGF5ID0gJ25vbmUnO1xuICBzLmJveFNpemluZyA9ICdjb250ZW50LWJveCc7XG5cbiAgLy8gUHJldmVudCBidXR0b24gZnJvbSBiZWluZyBzZWxlY3RlZCBhbmQgZHJhZ2dlZC5cbiAgYnV0dG9uLmRyYWdnYWJsZSA9IGZhbHNlO1xuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgLy8gU3R5bGUgaXQgb24gaG92ZXIuXG4gIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oZSkge1xuICAgIHMuZmlsdGVyID0gcy53ZWJraXRGaWx0ZXIgPSAnZHJvcC1zaGFkb3coMCAwIDVweCByZ2JhKDI1NSwyNTUsMjU1LDEpKSc7XG4gIH0pO1xuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICBzLmZpbHRlciA9IHMud2Via2l0RmlsdGVyID0gJyc7XG4gIH0pO1xuICByZXR1cm4gYnV0dG9uO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUuc2V0TW9kZSA9IGZ1bmN0aW9uKG1vZGUsIGlzVlJDb21wYXRpYmxlKSB7XG4gIGlzVlJDb21wYXRpYmxlID0gaXNWUkNvbXBhdGlibGUgfHwgV2ViVlJDb25maWcuRk9SQ0VfRU5BQkxFX1ZSO1xuICBpZiAoIXRoaXMuaXNWaXNpYmxlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHN3aXRjaCAobW9kZSkge1xuICAgIGNhc2UgTW9kZXMuTk9STUFMOlxuICAgICAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIHRoaXMuZnNCdXR0b24uc3JjID0gdGhpcy5JQ09OUy5mdWxsc2NyZWVuO1xuICAgICAgdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gKGlzVlJDb21wYXRpYmxlID8gJ2Jsb2NrJyA6ICdub25lJyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIE1vZGVzLk1BR0lDX1dJTkRPVzpcbiAgICAgIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB0aGlzLmZzQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuZXhpdEZ1bGxzY3JlZW47XG4gICAgICB0aGlzLnZyQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIE1vZGVzLlZSOlxuICAgICAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICAvLyBIYWNrIGZvciBTYWZhcmkgTWFjL2lPUyB0byBmb3JjZSByZWxheW91dCAoc3ZnLXNwZWNpZmljIGlzc3VlKVxuICAvLyBodHRwOi8vZ29vLmdsL2hqZ1I2clxuICB2YXIgb2xkVmFsdWUgPSB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXk7XG4gIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snO1xuICB0aGlzLmZzQnV0dG9uLm9mZnNldEhlaWdodDtcbiAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gb2xkVmFsdWU7XG59O1xuXG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZS5zZXRWaXNpYmlsaXR5ID0gZnVuY3Rpb24oaXNWaXNpYmxlKSB7XG4gIHRoaXMuaXNWaXNpYmxlID0gaXNWaXNpYmxlO1xuICB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSBpc1Zpc2libGUgPyAnYmxvY2snIDogJ25vbmUnO1xuICB0aGlzLnZyQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSBpc1Zpc2libGUgPyAnYmxvY2snIDogJ25vbmUnO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUuY3JlYXRlQ2xpY2tIYW5kbGVyXyA9IGZ1bmN0aW9uKGV2ZW50TmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuZW1pdChldmVudE5hbWUpO1xuICB9LmJpbmQodGhpcyk7XG59O1xuXG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZS5sb2FkSWNvbnNfID0gZnVuY3Rpb24oKSB7XG4gIC8vIFByZWxvYWQgc29tZSBoYXJkLWNvZGVkIFNWRy5cbiAgdGhpcy5JQ09OUyA9IHt9O1xuICB0aGlzLklDT05TLmNhcmRib2FyZCA9IFV0aWwuYmFzZTY0KCdpbWFnZS9zdmcreG1sJywgJ1BITjJaeUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lJSGRwWkhSb1BTSXlOSEI0SWlCb1pXbG5hSFE5SWpJMGNIZ2lJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0lnWm1sc2JEMGlJMFpHUmtaR1JpSStDaUFnSUNBOGNHRjBhQ0JrUFNKTk1qQXVOelFnTmtnekxqSXhRekl1TlRVZ05pQXlJRFl1TlRjZ01pQTNMakk0ZGpFd0xqUTBZekFnTGpjdU5UVWdNUzR5T0NBeExqSXpJREV1TWpob05DNDNPV011TlRJZ01DQXVPVFl0TGpNeklERXVNVFF0TGpjNWJERXVOQzB6TGpRNFl5NHlNeTB1TlRrdU56a3RNUzR3TVNBeExqUTBMVEV1TURGek1TNHlNUzQwTWlBeExqUTFJREV1TURGc01TNHpPU0F6TGpRNFl5NHhPUzQwTmk0Mk15NDNPU0F4TGpFeExqYzVhRFF1TnpsakxqY3hJREFnTVM0eU5pMHVOVGNnTVM0eU5pMHhMakk0VmpjdU1qaGpNQzB1TnkwdU5UVXRNUzR5T0MweExqSTJMVEV1TWpoNlRUY3VOU0F4TkM0Mk1tTXRNUzR4TnlBd0xUSXVNVE10TGprMUxUSXVNVE10TWk0eE1pQXdMVEV1TVRjdU9UWXRNaTR4TXlBeUxqRXpMVEl1TVRNZ01TNHhPQ0F3SURJdU1USXVPVFlnTWk0eE1pQXlMakV6Y3kwdU9UVWdNaTR4TWkweUxqRXlJREl1TVRKNmJUa2dNR010TVM0eE55QXdMVEl1TVRNdExqazFMVEl1TVRNdE1pNHhNaUF3TFRFdU1UY3VPVFl0TWk0eE15QXlMakV6TFRJdU1UTnpNaTR4TWk0NU5pQXlMakV5SURJdU1UTXRMamsxSURJdU1USXRNaTR4TWlBeUxqRXllaUl2UGdvZ0lDQWdQSEJoZEdnZ1ptbHNiRDBpYm05dVpTSWdaRDBpVFRBZ01HZ3lOSFl5TkVnd1ZqQjZJaTgrQ2p3dmMzWm5QZ289Jyk7XG4gIHRoaXMuSUNPTlMuZnVsbHNjcmVlbiA9IFV0aWwuYmFzZTY0KCdpbWFnZS9zdmcreG1sJywgJ1BITjJaeUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lJSGRwWkhSb1BTSXlOSEI0SWlCb1pXbG5hSFE5SWpJMGNIZ2lJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0lnWm1sc2JEMGlJMFpHUmtaR1JpSStDaUFnSUNBOGNHRjBhQ0JrUFNKTk1DQXdhREkwZGpJMFNEQjZJaUJtYVd4c1BTSnViMjVsSWk4K0NpQWdJQ0E4Y0dGMGFDQmtQU0pOTnlBeE5FZzFkalZvTlhZdE1rZzNkaTB6ZW0wdE1pMDBhREpXTjJnelZqVklOWFkxZW0weE1pQTNhQzB6ZGpKb05YWXROV2d0TW5ZemVrMHhOQ0ExZGpKb00zWXphREpXTldndE5Yb2lMejRLUEM5emRtYytDZz09Jyk7XG4gIHRoaXMuSUNPTlMuZXhpdEZ1bGxzY3JlZW4gPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NQ0F3YURJMGRqSTBTREI2SWlCbWFXeHNQU0p1YjI1bElpOCtDaUFnSUNBOGNHRjBhQ0JrUFNKTk5TQXhObWd6ZGpOb01uWXROVWcxZGpKNmJUTXRPRWcxZGpKb05WWTFTRGgyTTNwdE5pQXhNV2d5ZGkwemFETjJMVEpvTFRWMk5YcHRNaTB4TVZZMWFDMHlkalZvTlZZNGFDMHplaUl2UGdvOEwzTjJaejRLJyk7XG4gIHRoaXMuSUNPTlMuc2V0dGluZ3MgPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NQ0F3YURJMGRqSTBTREI2SWlCbWFXeHNQU0p1YjI1bElpOCtDaUFnSUNBOGNHRjBhQ0JrUFNKTk1Ua3VORE1nTVRJdU9UaGpMakEwTFM0ek1pNHdOeTB1TmpRdU1EY3RMams0Y3kwdU1ETXRMalkyTFM0d055MHVPVGhzTWk0eE1TMHhMalkxWXk0eE9TMHVNVFV1TWpRdExqUXlMakV5TFM0Mk5Hd3RNaTB6TGpRMll5MHVNVEl0TGpJeUxTNHpPUzB1TXkwdU5qRXRMakl5YkMweUxqUTVJREZqTFM0MU1pMHVOQzB4TGpBNExTNDNNeTB4TGpZNUxTNDVPR3d0TGpNNExUSXVOalZETVRRdU5EWWdNaTR4T0NBeE5DNHlOU0F5SURFMElESm9MVFJqTFM0eU5TQXdMUzQwTmk0eE9DMHVORGt1TkRKc0xTNHpPQ0F5TGpZMVl5MHVOakV1TWpVdE1TNHhOeTQxT1MweExqWTVMams0YkMweUxqUTVMVEZqTFM0eU15MHVNRGt0TGpRNUlEQXRMall4TGpJeWJDMHlJRE11TkRaakxTNHhNeTR5TWkwdU1EY3VORGt1TVRJdU5qUnNNaTR4TVNBeExqWTFZeTB1TURRdU16SXRMakEzTGpZMUxTNHdOeTQ1T0hNdU1ETXVOall1TURjdU9UaHNMVEl1TVRFZ01TNDJOV010TGpFNUxqRTFMUzR5TkM0ME1pMHVNVEl1TmpSc01pQXpMalEyWXk0eE1pNHlNaTR6T1M0ekxqWXhMakl5YkRJdU5Ea3RNV011TlRJdU5DQXhMakE0TGpjeklERXVOamt1T1Roc0xqTTRJREl1TmpWakxqQXpMakkwTGpJMExqUXlMalE1TGpReWFEUmpMakkxSURBZ0xqUTJMUzR4T0M0ME9TMHVOREpzTGpNNExUSXVOalZqTGpZeExTNHlOU0F4TGpFM0xTNDFPU0F4TGpZNUxTNDVPR3d5TGpRNUlERmpMakl6TGpBNUxqUTVJREFnTGpZeExTNHlNbXd5TFRNdU5EWmpMakV5TFM0eU1pNHdOeTB1TkRrdExqRXlMUzQyTkd3dE1pNHhNUzB4TGpZMWVrMHhNaUF4TlM0MVl5MHhMamt6SURBdE15NDFMVEV1TlRjdE15NDFMVE11TlhNeExqVTNMVE11TlNBekxqVXRNeTQxSURNdU5TQXhMalUzSURNdU5TQXpMalV0TVM0MU55QXpMalV0TXk0MUlETXVOWG9pTHo0S1BDOXpkbWMrQ2c9PScpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b25NYW5hZ2VyO1xuXG59LHtcIi4vZW1pdHRlci5qc1wiOjIsXCIuL21vZGVzLmpzXCI6MyxcIi4vdXRpbC5qc1wiOjR9XSwyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmZ1bmN0aW9uIEVtaXR0ZXIoKSB7XG4gIHRoaXMuY2FsbGJhY2tzID0ge307XG59XG5cbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV07XG4gIGlmICghY2FsbGJhY2tzKSB7XG4gICAgLy9jb25zb2xlLmxvZygnTm8gdmFsaWQgY2FsbGJhY2sgc3BlY2lmaWVkLicpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgLy8gRWxpbWluYXRlIHRoZSBmaXJzdCBwYXJhbSAodGhlIGNhbGxiYWNrKS5cbiAgYXJncy5zaGlmdCgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxufTtcblxuRW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gIGlmIChldmVudE5hbWUgaW4gdGhpcy5jYWxsYmFja3MpIHtcbiAgICB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0gPSBbY2FsbGJhY2tdO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXI7XG5cbn0se31dLDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIE1vZGVzID0ge1xuICBVTktOT1dOOiAwLFxuICAvLyBOb3QgZnVsbHNjcmVlbiwganVzdCB0cmFja2luZy5cbiAgTk9STUFMOiAxLFxuICAvLyBNYWdpYyB3aW5kb3cgaW1tZXJzaXZlIG1vZGUuXG4gIE1BR0lDX1dJTkRPVzogMixcbiAgLy8gRnVsbCBzY3JlZW4gc3BsaXQgc2NyZWVuIFZSIG1vZGUuXG4gIFZSOiAzLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlcztcblxufSx7fV0sNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHt9O1xuXG5VdGlsLmJhc2U2NCA9IGZ1bmN0aW9uKG1pbWVUeXBlLCBiYXNlNjQpIHtcbiAgcmV0dXJuICdkYXRhOicgKyBtaW1lVHlwZSArICc7YmFzZTY0LCcgKyBiYXNlNjQ7XG59O1xuXG5VdGlsLmlzTW9iaWxlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjaGVjayA9IGZhbHNlO1xuICAoZnVuY3Rpb24oYSl7aWYoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWluby9pLnRlc3QoYSl8fC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QoYS5zdWJzdHIoMCw0KSkpY2hlY2sgPSB0cnVlfSkobmF2aWdhdG9yLnVzZXJBZ2VudHx8bmF2aWdhdG9yLnZlbmRvcnx8d2luZG93Lm9wZXJhKTtcbiAgcmV0dXJuIGNoZWNrO1xufTtcblxuVXRpbC5pc0ZpcmVmb3ggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIC9maXJlZm94L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn07XG5cblV0aWwuaXNJT1MgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIC8oaVBhZHxpUGhvbmV8aVBvZCkvZy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xufTtcblxuVXRpbC5pc0lGcmFtZSA9IGZ1bmN0aW9uKCkge1xuICB0cnkge1xuICAgIHJldHVybiB3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59O1xuXG5VdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyID0gZnVuY3Rpb24odXJsLCBrZXksIHZhbHVlKSB7XG4gIC8vIERldGVybWluZSBkZWxpbWl0ZXIgYmFzZWQgb24gaWYgdGhlIFVSTCBhbHJlYWR5IEdFVCBwYXJhbWV0ZXJzIGluIGl0LlxuICB2YXIgZGVsaW1pdGVyID0gKHVybC5pbmRleE9mKCc/JykgPCAwID8gJz8nIDogJyYnKTtcbiAgdXJsICs9IGRlbGltaXRlciArIGtleSArICc9JyArIHZhbHVlO1xuICByZXR1cm4gdXJsO1xufTtcblxuLy8gRnJvbSBodHRwOi8vZ29vLmdsLzRXWDN0Z1xuVXRpbC5nZXRRdWVyeVBhcmFtZXRlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtdLywgXCJcXFxcW1wiKS5yZXBsYWNlKC9bXFxdXS8sIFwiXFxcXF1cIik7XG4gIHZhciByZWdleCA9IG5ldyBSZWdFeHAoXCJbXFxcXD8mXVwiICsgbmFtZSArIFwiPShbXiYjXSopXCIpLFxuICAgICAgcmVzdWx0cyA9IHJlZ2V4LmV4ZWMobG9jYXRpb24uc2VhcmNoKTtcbiAgcmV0dXJuIHJlc3VsdHMgPT09IG51bGwgPyBcIlwiIDogZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMV0ucmVwbGFjZSgvXFwrL2csIFwiIFwiKSk7XG59O1xuXG5VdGlsLmlzTGFuZHNjYXBlTW9kZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHdpbmRvdy5vcmllbnRhdGlvbiA9PSA5MCB8fCB3aW5kb3cub3JpZW50YXRpb24gPT0gLTkwKTtcbn07XG5cblV0aWwuZ2V0U2NyZWVuV2lkdGggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE1hdGgubWF4KHdpbmRvdy5zY3JlZW4ud2lkdGgsIHdpbmRvdy5zY3JlZW4uaGVpZ2h0KSAqXG4gICAgICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbn07XG5cblV0aWwuZ2V0U2NyZWVuSGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLm1pbih3aW5kb3cuc2NyZWVuLndpZHRoLCB3aW5kb3cuc2NyZWVuLmhlaWdodCkgKlxuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW87XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWw7XG5cbn0se31dLDU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEJ1dHRvbk1hbmFnZXIgPSBfZGVyZXFfKCcuL2J1dHRvbi1tYW5hZ2VyLmpzJyk7XG52YXIgRW1pdHRlciA9IF9kZXJlcV8oJy4vZW1pdHRlci5qcycpO1xudmFyIE1vZGVzID0gX2RlcmVxXygnLi9tb2Rlcy5qcycpO1xudmFyIFV0aWwgPSBfZGVyZXFfKCcuL3V0aWwuanMnKTtcblxuLyoqXG4gKiBIZWxwZXIgZm9yIGdldHRpbmcgaW4gYW5kIG91dCBvZiBWUiBtb2RlLlxuICovXG5mdW5jdGlvbiBXZWJWUk1hbmFnZXIocmVuZGVyZXIsIGVmZmVjdCwgcGFyYW1zKSB7XG4gIHRoaXMucGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuXG4gIHRoaXMubW9kZSA9IE1vZGVzLlVOS05PV047XG5cbiAgLy8gU2V0IG9wdGlvbiB0byBoaWRlIHRoZSBidXR0b24uXG4gIHRoaXMuaGlkZUJ1dHRvbiA9IHRoaXMucGFyYW1zLmhpZGVCdXR0b24gfHwgZmFsc2U7XG4gIC8vIFdoZXRoZXIgb3Igbm90IHRoZSBGT1Ygc2hvdWxkIGJlIGRpc3RvcnRlZCBvciB1bi1kaXN0b3J0ZWQuIEJ5IGRlZmF1bHQsIGl0XG4gIC8vIHNob3VsZCBiZSBkaXN0b3J0ZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZiB2ZXJ0ZXggc2hhZGVyIGJhc2VkIGRpc3RvcnRpb24sXG4gIC8vIGVuc3VyZSB0aGF0IHdlIHVzZSB1bmRpc3RvcnRlZCBwYXJhbWV0ZXJzLlxuICB0aGlzLnByZWRpc3RvcnRlZCA9ICEhdGhpcy5wYXJhbXMucHJlZGlzdG9ydGVkO1xuXG4gIC8vIFNhdmUgdGhlIFRIUkVFLmpzIHJlbmRlcmVyIGFuZCBlZmZlY3QgZm9yIGxhdGVyLlxuICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gIHRoaXMuZWZmZWN0ID0gZWZmZWN0O1xuICB2YXIgcG9seWZpbGxXcmFwcGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLndlYnZyLXBvbHlmaWxsLWZ1bGxzY3JlZW4td3JhcHBlcicpO1xuICB0aGlzLmJ1dHRvbiA9IG5ldyBCdXR0b25NYW5hZ2VyKHBvbHlmaWxsV3JhcHBlcik7XG5cbiAgdGhpcy5pc0Z1bGxzY3JlZW5EaXNhYmxlZCA9ICEhVXRpbC5nZXRRdWVyeVBhcmFtZXRlcignbm9fZnVsbHNjcmVlbicpO1xuICB0aGlzLnN0YXJ0TW9kZSA9IE1vZGVzLk5PUk1BTDtcbiAgdmFyIHN0YXJ0TW9kZVBhcmFtID0gcGFyc2VJbnQoVXRpbC5nZXRRdWVyeVBhcmFtZXRlcignc3RhcnRfbW9kZScpKTtcbiAgaWYgKCFpc05hTihzdGFydE1vZGVQYXJhbSkpIHtcbiAgICB0aGlzLnN0YXJ0TW9kZSA9IHN0YXJ0TW9kZVBhcmFtO1xuICB9XG5cbiAgaWYgKHRoaXMuaGlkZUJ1dHRvbikge1xuICAgIHRoaXMuYnV0dG9uLnNldFZpc2liaWxpdHkoZmFsc2UpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgdGhlIGJyb3dzZXIgaXMgY29tcGF0aWJsZSB3aXRoIFdlYlZSLlxuICB0aGlzLmdldERldmljZUJ5VHlwZV8oVlJEaXNwbGF5KS50aGVuKGZ1bmN0aW9uKGhtZCkge1xuICAgIHRoaXMuaG1kID0gaG1kO1xuXG4gICAgLy8gT25seSBlbmFibGUgVlIgbW9kZSBpZiB0aGVyZSdzIGEgVlIgZGV2aWNlIGF0dGFjaGVkIG9yIHdlIGFyZSBydW5uaW5nIHRoZVxuICAgIC8vIHBvbHlmaWxsIG9uIG1vYmlsZS5cbiAgICBpZiAoIXRoaXMuaXNWUkNvbXBhdGlibGVPdmVycmlkZSkge1xuICAgICAgdGhpcy5pc1ZSQ29tcGF0aWJsZSA9ICAhaG1kLmlzUG9seWZpbGxlZCB8fCBVdGlsLmlzTW9iaWxlKCk7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0aGlzLnN0YXJ0TW9kZSkge1xuICAgICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuTUFHSUNfV0lORE9XKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE1vZGVzLlZSOlxuICAgICAgICB0aGlzLmVudGVyVlJNb2RlXygpO1xuICAgICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLlZSKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gICAgfVxuXG4gICAgdGhpcy5lbWl0KCdpbml0aWFsaXplZCcpO1xuICB9LmJpbmQodGhpcykpO1xuXG4gIC8vIEhvb2sgdXAgYnV0dG9uIGxpc3RlbmVycy5cbiAgdGhpcy5idXR0b24ub24oJ2ZzJywgdGhpcy5vbkZTQ2xpY2tfLmJpbmQodGhpcykpO1xuICB0aGlzLmJ1dHRvbi5vbigndnInLCB0aGlzLm9uVlJDbGlja18uYmluZCh0aGlzKSk7XG5cbiAgLy8gQmluZCB0byBmdWxsc2NyZWVuIGV2ZW50cy5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsXG4gICAgICB0aGlzLm9uRnVsbHNjcmVlbkNoYW5nZV8uYmluZCh0aGlzKSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLFxuICAgICAgdGhpcy5vbkZ1bGxzY3JlZW5DaGFuZ2VfLmJpbmQodGhpcykpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLFxuICAgICAgdGhpcy5vbkZ1bGxzY3JlZW5DaGFuZ2VfLmJpbmQodGhpcykpO1xuXG4gIC8vIEJpbmQgdG8gVlIqIHNwZWNpZmljIGV2ZW50cy5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheXByZXNlbnRjaGFuZ2UnLFxuICAgICAgdGhpcy5vblZSRGlzcGxheVByZXNlbnRDaGFuZ2VfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndnJkaXNwbGF5ZGV2aWNlcGFyYW1zY2hhbmdlJyxcbiAgICAgIHRoaXMub25WUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfLmJpbmQodGhpcykpO1xufVxuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlID0gbmV3IEVtaXR0ZXIoKTtcblxuLy8gRXhwb3NlIHRoZXNlIHZhbHVlcyBleHRlcm5hbGx5LlxuV2ViVlJNYW5hZ2VyLk1vZGVzID0gTW9kZXM7XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2NlbmUsIGNhbWVyYSwgdGltZXN0YW1wKSB7XG4gIC8vIFNjZW5lIG1heSBiZSBhbiBhcnJheSBvZiB0d28gc2NlbmVzLCBvbmUgZm9yIGVhY2ggZXllLlxuICBpZiAoc2NlbmUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIHRoaXMuZWZmZWN0LnJlbmRlcihzY2VuZVswXSwgY2FtZXJhKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmVmZmVjdC5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gIH1cbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuc2V0VlJDb21wYXRpYmxlT3ZlcnJpZGUgPSBmdW5jdGlvbihpc1ZSQ29tcGF0aWJsZSkge1xuICB0aGlzLmlzVlJDb21wYXRpYmxlID0gaXNWUkNvbXBhdGlibGU7XG4gIHRoaXMuaXNWUkNvbXBhdGlibGVPdmVycmlkZSA9IHRydWU7XG5cbiAgLy8gRG9uJ3QgYWN0dWFsbHkgY2hhbmdlIG1vZGVzLCBqdXN0IHVwZGF0ZSB0aGUgYnV0dG9ucy5cbiAgdGhpcy5idXR0b24uc2V0TW9kZSh0aGlzLm1vZGUsIHRoaXMuaXNWUkNvbXBhdGlibGUpO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRGdWxsc2NyZWVuQ2FsbGJhY2sgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB0aGlzLmZ1bGxzY3JlZW5DYWxsYmFjayA9IGNhbGxiYWNrO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRWUkNhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdGhpcy52ckNhbGxiYWNrID0gY2FsbGJhY2s7XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnNldEV4aXRGdWxsc2NyZWVuQ2FsbGJhY2sgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB0aGlzLmV4aXRGdWxsc2NyZWVuQ2FsbGJhY2sgPSBjYWxsYmFjaztcbn1cblxuLyoqXG4gKiBQcm9taXNlIHJldHVybnMgdHJ1ZSBpZiB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgSE1EIGRldmljZSBhdmFpbGFibGUuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuZ2V0RGV2aWNlQnlUeXBlXyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKCkudGhlbihmdW5jdGlvbihkaXNwbGF5cykge1xuICAgICAgLy8gUHJvbWlzZSBzdWNjZWVkcywgYnV0IGNoZWNrIGlmIHRoZXJlIGFyZSBhbnkgZGlzcGxheXMgYWN0dWFsbHkuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpc3BsYXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChkaXNwbGF5c1tpXSBpbnN0YW5jZW9mIHR5cGUpIHtcbiAgICAgICAgICByZXNvbHZlKGRpc3BsYXlzW2ldKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgIC8vIE5vIGRpc3BsYXlzIGFyZSBmb3VuZC5cbiAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBIZWxwZXIgZm9yIGVudGVyaW5nIFZSIG1vZGUuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuZW50ZXJWUk1vZGVfID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuaG1kLnJlcXVlc3RQcmVzZW50KFt7XG4gICAgc291cmNlOiB0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQsXG4gICAgcHJlZGlzdG9ydGVkOiB0aGlzLnByZWRpc3RvcnRlZFxuICB9XSk7XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnNldE1vZGVfID0gZnVuY3Rpb24obW9kZSkge1xuICB2YXIgb2xkTW9kZSA9IHRoaXMubW9kZTtcbiAgaWYgKG1vZGUgPT0gdGhpcy5tb2RlKSB7XG4gICAgY29uc29sZS53YXJuKCdOb3QgY2hhbmdpbmcgbW9kZXMsIGFscmVhZHkgaW4gJXMnLCBtb2RlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gY29uc29sZS5sb2coJ01vZGUgY2hhbmdlOiAlcyA9PiAlcycsIHRoaXMubW9kZSwgbW9kZSk7XG4gIHRoaXMubW9kZSA9IG1vZGU7XG4gIHRoaXMuYnV0dG9uLnNldE1vZGUobW9kZSwgdGhpcy5pc1ZSQ29tcGF0aWJsZSk7XG5cbiAgLy8gRW1pdCBhbiBldmVudCBpbmRpY2F0aW5nIHRoZSBtb2RlIGNoYW5nZWQuXG4gIHRoaXMuZW1pdCgnbW9kZWNoYW5nZScsIG1vZGUsIG9sZE1vZGUpO1xufTtcblxuLyoqXG4gKiBNYWluIGJ1dHRvbiB3YXMgY2xpY2tlZC5cbiAqL1xuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vbkZTQ2xpY2tfID0gZnVuY3Rpb24oKSB7XG4gIHN3aXRjaCAodGhpcy5tb2RlKSB7XG4gICAgY2FzZSBNb2Rlcy5OT1JNQUw6XG4gICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBoYWNrIGlmL3doZW4gaU9TIGdldHMgcmVhbCBmdWxsc2NyZWVuIG1vZGUuXG4gICAgICAvLyBJZiB0aGlzIGlzIGFuIGlmcmFtZSBvbiBpT1MsIGJyZWFrIG91dCBhbmQgb3BlbiBpbiBub19mdWxsc2NyZWVuIG1vZGUuXG4gICAgICBpZiAoVXRpbC5pc0lPUygpICYmIFV0aWwuaXNJRnJhbWUoKSkge1xuICAgICAgICBpZiAodGhpcy5mdWxsc2NyZWVuQ2FsbGJhY2spIHtcbiAgICAgICAgICB0aGlzLmZ1bGxzY3JlZW5DYWxsYmFjaygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgICB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKHVybCwgJ25vX2Z1bGxzY3JlZW4nLCAndHJ1ZScpO1xuICAgICAgICAgIHVybCA9IFV0aWwuYXBwZW5kUXVlcnlQYXJhbWV0ZXIodXJsLCAnc3RhcnRfbW9kZScsIE1vZGVzLk1BR0lDX1dJTkRPVyk7XG4gICAgICAgICAgdG9wLmxvY2F0aW9uLmhyZWYgPSB1cmw7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk1BR0lDX1dJTkRPVyk7XG4gICAgICB0aGlzLnJlcXVlc3RGdWxsc2NyZWVuXygpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICBpZiAodGhpcy5pc0Z1bGxzY3JlZW5EaXNhYmxlZCkge1xuICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmV4aXRGdWxsc2NyZWVuQ2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5leGl0RnVsbHNjcmVlbkNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gICAgICB0aGlzLmV4aXRGdWxsc2NyZWVuXygpO1xuICAgICAgYnJlYWs7XG4gIH1cbn07XG5cbi8qKlxuICogVGhlIFZSIGJ1dHRvbiB3YXMgY2xpY2tlZC5cbiAqL1xuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vblZSQ2xpY2tfID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRPRE86IFJlbW92ZSB0aGlzIGhhY2sgd2hlbiBpT1MgaGFzIGZ1bGxzY3JlZW4gbW9kZS5cbiAgLy8gSWYgdGhpcyBpcyBhbiBpZnJhbWUgb24gaU9TLCBicmVhayBvdXQgYW5kIG9wZW4gaW4gbm9fZnVsbHNjcmVlbiBtb2RlLlxuICBpZiAodGhpcy5tb2RlID09IE1vZGVzLk5PUk1BTCAmJiBVdGlsLmlzSU9TKCkgJiYgVXRpbC5pc0lGcmFtZSgpKSB7XG4gICAgaWYgKHRoaXMudnJDYWxsYmFjaykge1xuICAgICAgdGhpcy52ckNhbGxiYWNrKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgIHVybCA9IFV0aWwuYXBwZW5kUXVlcnlQYXJhbWV0ZXIodXJsLCAnbm9fZnVsbHNjcmVlbicsICd0cnVlJyk7XG4gICAgICB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKHVybCwgJ3N0YXJ0X21vZGUnLCBNb2Rlcy5WUik7XG4gICAgICB0b3AubG9jYXRpb24uaHJlZiA9IHVybDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbiAgdGhpcy5lbnRlclZSTW9kZV8oKTtcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUucmVxdWVzdEZ1bGxzY3JlZW5fID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5ib2R5O1xuICAvL3ZhciBjYW52YXMgPSB0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQ7XG4gIGlmIChjYW52YXMucmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBjYW52YXMucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMubW96UmVxdWVzdEZ1bGxTY3JlZW4pIHtcbiAgICBjYW52YXMubW96UmVxdWVzdEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBjYW52YXMud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMubXNSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgIGNhbnZhcy5tc1JlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH1cbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuZXhpdEZ1bGxzY3JlZW5fID0gZnVuY3Rpb24oKSB7XG4gIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4oKTtcbiAgfVxufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vblZSRGlzcGxheVByZXNlbnRDaGFuZ2VfID0gZnVuY3Rpb24oZSkge1xuICBjb25zb2xlLmxvZygnb25WUkRpc3BsYXlQcmVzZW50Q2hhbmdlXycsIGUpO1xuICBpZiAodGhpcy5obWQuaXNQcmVzZW50aW5nKSB7XG4gICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5WUik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5OT1JNQUwpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLm9uVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgY29uc29sZS5sb2coJ29uVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXycsIGUpO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vbkZ1bGxzY3JlZW5DaGFuZ2VfID0gZnVuY3Rpb24oZSkge1xuICAvLyBJZiB3ZSBsZWF2ZSBmdWxsLXNjcmVlbiwgZ28gYmFjayB0byBub3JtYWwgbW9kZS5cbiAgaWYgKGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50ID09PSBudWxsIHx8XG4gICAgICBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCA9PT0gbnVsbCkge1xuICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuTk9STUFMKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJWUk1hbmFnZXI7XG5cbn0se1wiLi9idXR0b24tbWFuYWdlci5qc1wiOjEsXCIuL2VtaXR0ZXIuanNcIjoyLFwiLi9tb2Rlcy5qc1wiOjMsXCIuL3V0aWwuanNcIjo0fV19LHt9LFs1XSkoNSlcbn0pOyIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJuYW1lXCI6IFwid2VidnItcG9seWZpbGxcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMC45LjM2XCIsXG4gIFwiaG9tZXBhZ2VcIjogXCJodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xldnIvd2VidnItcG9seWZpbGxcIixcbiAgXCJhdXRob3JzXCI6IFtcbiAgICBcIkJvcmlzIFNtdXMgPGJvcmlzQHNtdXMuY29tPlwiLFxuICAgIFwiQnJhbmRvbiBKb25lcyA8dG9qaXJvQGdtYWlsLmNvbT5cIixcbiAgICBcIkpvcmRhbiBTYW50ZWxsIDxqb3JkYW5AanNhbnRlbGwuY29tPlwiXG4gIF0sXG4gIFwiZGVzY3JpcHRpb25cIjogXCJVc2UgV2ViVlIgdG9kYXksIG9uIG1vYmlsZSBvciBkZXNrdG9wLCB3aXRob3V0IHJlcXVpcmluZyBhIHNwZWNpYWwgYnJvd3NlciBidWlsZC5cIixcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiY2hhaVwiOiBcIl4zLjUuMFwiLFxuICAgIFwianNkb21cIjogXCJeOS4xMi4wXCIsXG4gICAgXCJtb2NoYVwiOiBcIl4zLjIuMFwiLFxuICAgIFwic2VtdmVyXCI6IFwiXjUuMy4wXCIsXG4gICAgXCJ3ZWJwYWNrXCI6IFwiXjIuNi4xXCIsXG4gICAgXCJ3ZWJwYWNrLWRldi1zZXJ2ZXJcIjogXCJeMi40LjVcIlxuICB9LFxuICBcIm1haW5cIjogXCJzcmMvbm9kZS1lbnRyeVwiLFxuICBcImtleXdvcmRzXCI6IFtcbiAgICBcInZyXCIsXG4gICAgXCJ3ZWJ2clwiXG4gIF0sXG4gIFwibGljZW5zZVwiOiBcIkFwYWNoZS0yLjBcIixcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcInN0YXJ0XCI6IFwibnBtIHJ1biB3YXRjaFwiLFxuICAgIFwid2F0Y2hcIjogXCJ3ZWJwYWNrLWRldi1zZXJ2ZXJcIixcbiAgICBcImJ1aWxkXCI6IFwid2VicGFja1wiLFxuICAgIFwidGVzdFwiOiBcIm1vY2hhXCJcbiAgfSxcbiAgXCJyZXBvc2l0b3J5XCI6IHtcbiAgICBcInR5cGVcIjogXCJnaXRcIixcbiAgICBcInVybFwiOiBcImdpdCtodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xldnIvd2VidnItcG9seWZpbGwuZ2l0XCJcbiAgfSxcbiAgXCJidWdzXCI6IHtcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGV2ci93ZWJ2ci1wb2x5ZmlsbC9pc3N1ZXNcIlxuICB9LFxuICBcImdpdEhlYWRcIjogXCI1Zjg2OTNhOTA1M2VlMWRlYTQyNWU5NmQxNGNkMWYyYmVmN2EyODRjXCIsXG4gIFwiX2lkXCI6IFwid2VidnItcG9seWZpbGxAMC45LjM2XCIsXG4gIFwiX3NoYXN1bVwiOiBcIjRiMWUxNTU2NjY3ZTgwNGJlYjBjOGMyZTY3ZmRmY2JhMzM3MWU4YzZcIixcbiAgXCJfZnJvbVwiOiBcIndlYnZyLXBvbHlmaWxsQD49MC45LjE1IDwwLjEwLjBcIixcbiAgXCJfbnBtVmVyc2lvblwiOiBcIjIuMTUuMTFcIixcbiAgXCJfbm9kZVZlcnNpb25cIjogXCI0LjguNFwiLFxuICBcIl9ucG1Vc2VyXCI6IHtcbiAgICBcIm5hbWVcIjogXCJqc2FudGVsbFwiLFxuICAgIFwiZW1haWxcIjogXCJqc2FudGVsbEBnbWFpbC5jb21cIlxuICB9LFxuICBcImRpc3RcIjoge1xuICAgIFwic2hhc3VtXCI6IFwiNGIxZTE1NTY2NjdlODA0YmViMGM4YzJlNjdmZGZjYmEzMzcxZThjNlwiLFxuICAgIFwidGFyYmFsbFwiOiBcImh0dHBzOi8vcmVnaXN0cnkubnBtanMub3JnL3dlYnZyLXBvbHlmaWxsLy0vd2VidnItcG9seWZpbGwtMC45LjM2LnRnelwiXG4gIH0sXG4gIFwibWFpbnRhaW5lcnNcIjogW1xuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcImpzYW50ZWxsXCIsXG4gICAgICBcImVtYWlsXCI6IFwianNhbnRlbGxAZ21haWwuY29tXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcInRvamlcIixcbiAgICAgIFwiZW1haWxcIjogXCJ0b2ppcm9AZ21haWwuY29tXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcInNtdXNcIixcbiAgICAgIFwiZW1haWxcIjogXCJib3Jpc0BzbXVzLmNvbVwiXG4gICAgfVxuICBdLFxuICBcIl9ucG1PcGVyYXRpb25hbEludGVybmFsXCI6IHtcbiAgICBcImhvc3RcIjogXCJzMzovL25wbS1yZWdpc3RyeS1wYWNrYWdlc1wiLFxuICAgIFwidG1wXCI6IFwidG1wL3dlYnZyLXBvbHlmaWxsLTAuOS4zNi50Z3pfMTQ5OTg5Mjk3MjM3OF8wLjEwMjY3MDg3MDAyMjg0ODI1XCJcbiAgfSxcbiAgXCJkaXJlY3Rvcmllc1wiOiB7fSxcbiAgXCJfcmVzb2x2ZWRcIjogXCJodHRwczovL3JlZ2lzdHJ5Lm5wbWpzLm9yZy93ZWJ2ci1wb2x5ZmlsbC8tL3dlYnZyLXBvbHlmaWxsLTAuOS4zNi50Z3pcIixcbiAgXCJyZWFkbWVcIjogXCJFUlJPUjogTm8gUkVBRE1FIGRhdGEgZm91bmQhXCJcbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgV2FrZUxvY2sgPSByZXF1aXJlKCcuL3dha2Vsb2NrLmpzJyk7XG5cbi8vIFN0YXJ0IGF0IGEgaGlnaGVyIG51bWJlciB0byByZWR1Y2UgY2hhbmNlIG9mIGNvbmZsaWN0LlxudmFyIG5leHREaXNwbGF5SWQgPSAxMDAwO1xudmFyIGhhc1Nob3dEZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZTtcblxudmFyIGRlZmF1bHRMZWZ0Qm91bmRzID0gWzAsIDAsIDAuNSwgMV07XG52YXIgZGVmYXVsdFJpZ2h0Qm91bmRzID0gWzAuNSwgMCwgMC41LCAxXTtcblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIGZyYW1lIGRhdGEuXG4gKi9cblxuZnVuY3Rpb24gVlJGcmFtZURhdGEoKSB7XG4gIHRoaXMubGVmdFByb2plY3Rpb25NYXRyaXggPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcbiAgdGhpcy5sZWZ0Vmlld01hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICB0aGlzLnJpZ2h0UHJvamVjdGlvbk1hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICB0aGlzLnJpZ2h0Vmlld01hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICB0aGlzLnBvc2UgPSBudWxsO1xufTtcblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIGRpc3BsYXlzLlxuICovXG5mdW5jdGlvbiBWUkRpc3BsYXkoKSB7XG4gIHRoaXMuaXNQb2x5ZmlsbGVkID0gdHJ1ZTtcbiAgdGhpcy5kaXNwbGF5SWQgPSBuZXh0RGlzcGxheUlkKys7XG4gIHRoaXMuZGlzcGxheU5hbWUgPSAnd2VidnItcG9seWZpbGwgZGlzcGxheU5hbWUnO1xuXG4gIHRoaXMuZGVwdGhOZWFyID0gMC4wMTtcbiAgdGhpcy5kZXB0aEZhciA9IDEwMDAwLjA7XG5cbiAgdGhpcy5pc0Nvbm5lY3RlZCA9IHRydWU7XG4gIHRoaXMuaXNQcmVzZW50aW5nID0gZmFsc2U7XG4gIHRoaXMuY2FwYWJpbGl0aWVzID0ge1xuICAgIGhhc1Bvc2l0aW9uOiBmYWxzZSxcbiAgICBoYXNPcmllbnRhdGlvbjogZmFsc2UsXG4gICAgaGFzRXh0ZXJuYWxEaXNwbGF5OiBmYWxzZSxcbiAgICBjYW5QcmVzZW50OiBmYWxzZSxcbiAgICBtYXhMYXllcnM6IDFcbiAgfTtcbiAgdGhpcy5zdGFnZVBhcmFtZXRlcnMgPSBudWxsO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gIHRoaXMubGF5ZXJfID0gbnVsbDtcblxuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudENhY2hlZFN0eWxlXyA9IG51bGw7XG5cbiAgdGhpcy5mdWxsc2NyZWVuRXZlbnRUYXJnZXRfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuQ2hhbmdlSGFuZGxlcl8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5FcnJvckhhbmRsZXJfID0gbnVsbDtcblxuICB0aGlzLndha2Vsb2NrXyA9IG5ldyBXYWtlTG9jaygpO1xufVxuXG5WUkRpc3BsYXkucHJvdG90eXBlLmdldEZyYW1lRGF0YSA9IGZ1bmN0aW9uKGZyYW1lRGF0YSkge1xuICAvLyBUT0RPOiBUZWNobmljYWxseSB0aGlzIHNob3VsZCByZXRhaW4gaXQncyB2YWx1ZSBmb3IgdGhlIGR1cmF0aW9uIG9mIGEgZnJhbWVcbiAgLy8gYnV0IEkgZG91YnQgdGhhdCdzIHByYWN0aWNhbCB0byBkbyBpbiBqYXZhc2NyaXB0LlxuICByZXR1cm4gVXRpbC5mcmFtZURhdGFGcm9tUG9zZShmcmFtZURhdGEsIHRoaXMuZ2V0UG9zZSgpLCB0aGlzKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBUT0RPOiBUZWNobmljYWxseSB0aGlzIHNob3VsZCByZXRhaW4gaXQncyB2YWx1ZSBmb3IgdGhlIGR1cmF0aW9uIG9mIGEgZnJhbWVcbiAgLy8gYnV0IEkgZG91YnQgdGhhdCdzIHByYWN0aWNhbCB0byBkbyBpbiBqYXZhc2NyaXB0LlxuICByZXR1cm4gdGhpcy5nZXRJbW1lZGlhdGVQb3NlKCk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICByZXR1cm4gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUud3JhcEZvckZ1bGxzY3JlZW4gPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gIC8vIERvbid0IHdyYXAgaW4gaU9TLlxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cbiAgaWYgKCF0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXykge1xuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdmFyIGNzc1Byb3BlcnRpZXMgPSBbXG4gICAgICAnaGVpZ2h0OiAnICsgTWF0aC5taW4oc2NyZWVuLmhlaWdodCwgc2NyZWVuLndpZHRoKSArICdweCAhaW1wb3J0YW50JyxcbiAgICAgICd0b3A6IDAgIWltcG9ydGFudCcsXG4gICAgICAnbGVmdDogMCAhaW1wb3J0YW50JyxcbiAgICAgICdyaWdodDogMCAhaW1wb3J0YW50JyxcbiAgICAgICdib3JkZXI6IDAnLFxuICAgICAgJ21hcmdpbjogMCcsXG4gICAgICAncGFkZGluZzogMCcsXG4gICAgICAnei1pbmRleDogOTk5OTk5ICFpbXBvcnRhbnQnLFxuICAgICAgJ3Bvc2l0aW9uOiBmaXhlZCcsXG4gICAgXTtcbiAgICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgY3NzUHJvcGVydGllcy5qb2luKCc7ICcpICsgJzsnKTtcbiAgICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5jbGFzc0xpc3QuYWRkKCd3ZWJ2ci1wb2x5ZmlsbC1mdWxsc2NyZWVuLXdyYXBwZXInKTtcbiAgfVxuXG4gIGlmICh0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XyA9PSBlbGVtZW50KSB7XG4gICAgcmV0dXJuIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfO1xuICB9XG5cbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91c2x5IGFwcGxpZWQgd3JhcHBlcnNcbiAgdGhpcy5yZW1vdmVGdWxsc2NyZWVuV3JhcHBlcigpO1xuXG4gIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfID0gZWxlbWVudDtcbiAgdmFyIHBhcmVudCA9IHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfLnBhcmVudEVsZW1lbnQ7XG4gIHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8sIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfKTtcbiAgcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfKTtcbiAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8uaW5zZXJ0QmVmb3JlKHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfLCB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5maXJzdENoaWxkKTtcbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudENhY2hlZFN0eWxlXyA9IHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfLmdldEF0dHJpYnV0ZSgnc3R5bGUnKTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGZ1bmN0aW9uIGFwcGx5RnVsbHNjcmVlbkVsZW1lbnRTdHlsZSgpIHtcbiAgICBpZiAoIXNlbGYuZnVsbHNjcmVlbkVsZW1lbnRfKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGNzc1Byb3BlcnRpZXMgPSBbXG4gICAgICAncG9zaXRpb246IGFic29sdXRlJyxcbiAgICAgICd0b3A6IDAnLFxuICAgICAgJ2xlZnQ6IDAnLFxuICAgICAgJ3dpZHRoOiAnICsgTWF0aC5tYXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KSArICdweCcsXG4gICAgICAnaGVpZ2h0OiAnICsgTWF0aC5taW4oc2NyZWVuLmhlaWdodCwgc2NyZWVuLndpZHRoKSArICdweCcsXG4gICAgICAnYm9yZGVyOiAwJyxcbiAgICAgICdtYXJnaW46IDAnLFxuICAgICAgJ3BhZGRpbmc6IDAnLFxuICAgIF07XG4gICAgc2VsZi5mdWxsc2NyZWVuRWxlbWVudF8uc2V0QXR0cmlidXRlKCdzdHlsZScsIGNzc1Byb3BlcnRpZXMuam9pbignOyAnKSArICc7Jyk7XG4gIH1cblxuICBhcHBseUZ1bGxzY3JlZW5FbGVtZW50U3R5bGUoKTtcblxuICByZXR1cm4gdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl87XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8pIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgZWxlbWVudCA9IHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfO1xuICBpZiAodGhpcy5mdWxsc2NyZWVuRWxlbWVudENhY2hlZFN0eWxlXykge1xuICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdzdHlsZScsIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRDYWNoZWRTdHlsZV8pO1xuICB9IGVsc2Uge1xuICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICB9XG4gIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudENhY2hlZFN0eWxlXyA9IG51bGw7XG5cbiAgdmFyIHBhcmVudCA9IHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLnBhcmVudEVsZW1lbnQ7XG4gIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLnJlbW92ZUNoaWxkKGVsZW1lbnQpO1xuICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfKTtcbiAgcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfKTtcblxuICByZXR1cm4gZWxlbWVudDtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUucmVxdWVzdFByZXNlbnQgPSBmdW5jdGlvbihsYXllcnMpIHtcbiAgdmFyIHdhc1ByZXNlbnRpbmcgPSB0aGlzLmlzUHJlc2VudGluZztcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGlmICghKGxheWVycyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgIGlmICghaGFzU2hvd0RlcHJlY2F0aW9uV2FybmluZykge1xuICAgICAgY29uc29sZS53YXJuKFwiVXNpbmcgYSBkZXByZWNhdGVkIGZvcm0gb2YgcmVxdWVzdFByZXNlbnQuIFNob3VsZCBwYXNzIGluIGFuIGFycmF5IG9mIFZSTGF5ZXJzLlwiKTtcbiAgICAgIGhhc1Nob3dEZXByZWNhdGlvbldhcm5pbmcgPSB0cnVlO1xuICAgIH1cbiAgICBsYXllcnMgPSBbbGF5ZXJzXTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAoIXNlbGYuY2FwYWJpbGl0aWVzLmNhblByZXNlbnQpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1ZSRGlzcGxheSBpcyBub3QgY2FwYWJsZSBvZiBwcmVzZW50aW5nLicpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobGF5ZXJzLmxlbmd0aCA9PSAwIHx8IGxheWVycy5sZW5ndGggPiBzZWxmLmNhcGFiaWxpdGllcy5tYXhMYXllcnMpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgbnVtYmVyIG9mIGxheWVycy4nKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGluY29taW5nTGF5ZXIgPSBsYXllcnNbMF07XG4gICAgaWYgKCFpbmNvbWluZ0xheWVyLnNvdXJjZSkge1xuICAgICAgLypcbiAgICAgIHRvZG86IGZpZ3VyZSBvdXQgdGhlIGNvcnJlY3QgYmVoYXZpb3IgaWYgdGhlIHNvdXJjZSBpcyBub3QgcHJvdmlkZWQuXG4gICAgICBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3czYy93ZWJ2ci9pc3N1ZXMvNThcbiAgICAgICovXG4gICAgICByZXNvbHZlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGxlZnRCb3VuZHMgPSBpbmNvbWluZ0xheWVyLmxlZnRCb3VuZHMgfHwgZGVmYXVsdExlZnRCb3VuZHM7XG4gICAgdmFyIHJpZ2h0Qm91bmRzID0gaW5jb21pbmdMYXllci5yaWdodEJvdW5kcyB8fCBkZWZhdWx0UmlnaHRCb3VuZHM7XG4gICAgaWYgKHdhc1ByZXNlbnRpbmcpIHtcbiAgICAgIC8vIEFscmVhZHkgcHJlc2VudGluZywganVzdCBjaGFuZ2luZyBjb25maWd1cmF0aW9uXG4gICAgICB2YXIgbGF5ZXIgPSBzZWxmLmxheWVyXztcbiAgICAgIGlmIChsYXllci5zb3VyY2UgIT09IGluY29taW5nTGF5ZXIuc291cmNlKSB7XG4gICAgICAgIGxheWVyLnNvdXJjZSA9IGluY29taW5nTGF5ZXIuc291cmNlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICBsYXllci5sZWZ0Qm91bmRzW2ldID0gbGVmdEJvdW5kc1tpXTtcbiAgICAgICAgbGF5ZXIucmlnaHRCb3VuZHNbaV0gPSByaWdodEJvdW5kc1tpXTtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdhcyBub3QgYWxyZWFkeSBwcmVzZW50aW5nLlxuICAgIHNlbGYubGF5ZXJfID0ge1xuICAgICAgcHJlZGlzdG9ydGVkOiBpbmNvbWluZ0xheWVyLnByZWRpc3RvcnRlZCxcbiAgICAgIHNvdXJjZTogaW5jb21pbmdMYXllci5zb3VyY2UsXG4gICAgICBsZWZ0Qm91bmRzOiBsZWZ0Qm91bmRzLnNsaWNlKDApLFxuICAgICAgcmlnaHRCb3VuZHM6IHJpZ2h0Qm91bmRzLnNsaWNlKDApXG4gICAgfTtcblxuICAgIHNlbGYud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gICAgaWYgKHNlbGYubGF5ZXJfICYmIHNlbGYubGF5ZXJfLnNvdXJjZSkge1xuICAgICAgdmFyIGZ1bGxzY3JlZW5FbGVtZW50ID0gc2VsZi53cmFwRm9yRnVsbHNjcmVlbihzZWxmLmxheWVyXy5zb3VyY2UpO1xuXG4gICAgICB2YXIgb25GdWxsc2NyZWVuQ2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhY3R1YWxGdWxsc2NyZWVuRWxlbWVudCA9IFV0aWwuZ2V0RnVsbHNjcmVlbkVsZW1lbnQoKTtcblxuICAgICAgICBzZWxmLmlzUHJlc2VudGluZyA9IChmdWxsc2NyZWVuRWxlbWVudCA9PT0gYWN0dWFsRnVsbHNjcmVlbkVsZW1lbnQpO1xuICAgICAgICBpZiAoc2VsZi5pc1ByZXNlbnRpbmcpIHtcbiAgICAgICAgICBpZiAoc2NyZWVuLm9yaWVudGF0aW9uICYmIHNjcmVlbi5vcmllbnRhdGlvbi5sb2NrKSB7XG4gICAgICAgICAgICBzY3JlZW4ub3JpZW50YXRpb24ubG9jaygnbGFuZHNjYXBlLXByaW1hcnknKS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NjcmVlbi5vcmllbnRhdGlvbi5sb2NrKCkgZmFpbGVkIGR1ZSB0bycsIGVycm9yLm1lc3NhZ2UpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2VsZi53YWl0aW5nRm9yUHJlc2VudF8gPSBmYWxzZTtcbiAgICAgICAgICBzZWxmLmJlZ2luUHJlc2VudF8oKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHNjcmVlbi5vcmllbnRhdGlvbiAmJiBzY3JlZW4ub3JpZW50YXRpb24udW5sb2NrKSB7XG4gICAgICAgICAgICBzY3JlZW4ub3JpZW50YXRpb24udW5sb2NrKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIoKTtcbiAgICAgICAgICBzZWxmLndha2Vsb2NrXy5yZWxlYXNlKCk7XG4gICAgICAgICAgc2VsZi5lbmRQcmVzZW50XygpO1xuICAgICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18oKTtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLmZpcmVWUkRpc3BsYXlQcmVzZW50Q2hhbmdlXygpO1xuICAgICAgfVxuICAgICAgdmFyIG9uRnVsbHNjcmVlbkVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghc2VsZi53YWl0aW5nRm9yUHJlc2VudF8pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG4gICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18oKTtcblxuICAgICAgICBzZWxmLndha2Vsb2NrXy5yZWxlYXNlKCk7XG4gICAgICAgIHNlbGYud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gICAgICAgIHNlbGYuaXNQcmVzZW50aW5nID0gZmFsc2U7XG5cbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignVW5hYmxlIHRvIHByZXNlbnQuJykpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLmFkZEZ1bGxzY3JlZW5MaXN0ZW5lcnNfKGZ1bGxzY3JlZW5FbGVtZW50LFxuICAgICAgICAgIG9uRnVsbHNjcmVlbkNoYW5nZSwgb25GdWxsc2NyZWVuRXJyb3IpO1xuXG4gICAgICBpZiAoVXRpbC5yZXF1ZXN0RnVsbHNjcmVlbihmdWxsc2NyZWVuRWxlbWVudCkpIHtcbiAgICAgICAgc2VsZi53YWtlbG9ja18ucmVxdWVzdCgpO1xuICAgICAgICBzZWxmLndhaXRpbmdGb3JQcmVzZW50XyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKFV0aWwuaXNJT1MoKSB8fCBVdGlsLmlzV2ViVmlld0FuZHJvaWQoKSkge1xuICAgICAgICAvLyAqc2lnaCogSnVzdCBmYWtlIGl0LlxuICAgICAgICBzZWxmLndha2Vsb2NrXy5yZXF1ZXN0KCk7XG4gICAgICAgIHNlbGYuaXNQcmVzZW50aW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5iZWdpblByZXNlbnRfKCk7XG4gICAgICAgIHNlbGYuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfKCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXNlbGYud2FpdGluZ0ZvclByZXNlbnRfICYmICFVdGlsLmlzSU9TKCkpIHtcbiAgICAgIFV0aWwuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1VuYWJsZSB0byBwcmVzZW50LicpKTtcbiAgICB9XG4gIH0pO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5leGl0UHJlc2VudCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2FzUHJlc2VudGluZyA9IHRoaXMuaXNQcmVzZW50aW5nO1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuaXNQcmVzZW50aW5nID0gZmFsc2U7XG4gIHRoaXMubGF5ZXJfID0gbnVsbDtcbiAgdGhpcy53YWtlbG9ja18ucmVsZWFzZSgpO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAod2FzUHJlc2VudGluZykge1xuICAgICAgaWYgKCFVdGlsLmV4aXRGdWxsc2NyZWVuKCkgJiYgVXRpbC5pc0lPUygpKSB7XG4gICAgICAgIHNlbGYuZW5kUHJlc2VudF8oKTtcbiAgICAgICAgc2VsZi5maXJlVlJEaXNwbGF5UHJlc2VudENoYW5nZV8oKTtcbiAgICAgIH1cblxuICAgICAgaWYgKFV0aWwuaXNXZWJWaWV3QW5kcm9pZCgpKSB7XG4gICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIoKTtcbiAgICAgICAgc2VsZi5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXygpO1xuICAgICAgICBzZWxmLmVuZFByZXNlbnRfKCk7XG4gICAgICAgIHNlbGYuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfKCk7XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcignV2FzIG5vdCBwcmVzZW50aW5nIHRvIFZSRGlzcGxheS4nKSk7XG4gICAgfVxuICB9KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0TGF5ZXJzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmxheWVyXykge1xuICAgIHJldHVybiBbdGhpcy5sYXllcl9dO1xuICB9XG4gIHJldHVybiBbXTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfID0gZnVuY3Rpb24oKSB7XG4gIC8vIEltcG9ydGFudDogdW5mb3J0dW5hdGVseSB3ZSBjYW5ub3QgaGF2ZSBmdWxsIHNwZWMgY29tcGxpYW5jZSBoZXJlLlxuICAvLyBDdXN0b21FdmVudCBjdXN0b20gZmllbGRzIGFsbCBnbyB1bmRlciBlLmRldGFpbCAoc28gdGhlIFZSRGlzcGxheSBlbmRzIHVwXG4gIC8vIGJlaW5nIGUuZGV0YWlsLmRpc3BsYXksIGluc3RlYWQgb2YgZS5kaXNwbGF5IGFzIHBlciBXZWJWUiBzcGVjKS5cbiAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCd2cmRpc3BsYXlwcmVzZW50Y2hhbmdlJywge2RldGFpbDoge2Rpc3BsYXk6IHRoaXN9fSk7XG4gIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZmlyZVZSRGlzcGxheUNvbm5lY3RfID0gZnVuY3Rpb24oKSB7XG4gIC8vIEltcG9ydGFudDogdW5mb3J0dW5hdGVseSB3ZSBjYW5ub3QgaGF2ZSBmdWxsIHNwZWMgY29tcGxpYW5jZSBoZXJlLlxuICAvLyBDdXN0b21FdmVudCBjdXN0b20gZmllbGRzIGFsbCBnbyB1bmRlciBlLmRldGFpbCAoc28gdGhlIFZSRGlzcGxheSBlbmRzIHVwXG4gIC8vIGJlaW5nIGUuZGV0YWlsLmRpc3BsYXksIGluc3RlYWQgb2YgZS5kaXNwbGF5IGFzIHBlciBXZWJWUiBzcGVjKS5cbiAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCd2cmRpc3BsYXljb25uZWN0Jywge2RldGFpbDoge2Rpc3BsYXk6IHRoaXN9fSk7XG4gIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuYWRkRnVsbHNjcmVlbkxpc3RlbmVyc18gPSBmdW5jdGlvbihlbGVtZW50LCBjaGFuZ2VIYW5kbGVyLCBlcnJvckhhbmRsZXIpIHtcbiAgdGhpcy5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXygpO1xuXG4gIHRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XyA9IGVsZW1lbnQ7XG4gIHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfID0gY2hhbmdlSGFuZGxlcjtcbiAgdGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXyA9IGVycm9ySGFuZGxlcjtcblxuICBpZiAoY2hhbmdlSGFuZGxlcikge1xuICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbmFibGVkKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVycm9ySGFuZGxlcikge1xuICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbmFibGVkKSB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubW96RnVsbFNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIH1cbiAgfVxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XylcbiAgICByZXR1cm47XG5cbiAgdmFyIGVsZW1lbnQgPSB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF87XG5cbiAgaWYgKHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfKSB7XG4gICAgdmFyIGNoYW5nZUhhbmRsZXIgPSB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXztcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gIH1cblxuICBpZiAodGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXykge1xuICAgIHZhciBlcnJvckhhbmRsZXIgPSB0aGlzLmZ1bGxzY3JlZW5FcnJvckhhbmRsZXJfO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21zZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gIH1cblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBudWxsO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5iZWdpblByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIC8vIE92ZXJyaWRlIHRvIGFkZCBjdXN0b20gYmVoYXZpb3Igd2hlbiBwcmVzZW50YXRpb24gYmVnaW5zLlxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5lbmRQcmVzZW50XyA9IGZ1bmN0aW9uKCkge1xuICAvLyBPdmVycmlkZSB0byBhZGQgY3VzdG9tIGJlaGF2aW9yIHdoZW4gcHJlc2VudGF0aW9uIGVuZHMuXG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnN1Ym1pdEZyYW1lID0gZnVuY3Rpb24ocG9zZSkge1xuICAvLyBPdmVycmlkZSB0byBhZGQgY3VzdG9tIGJlaGF2aW9yIGZvciBmcmFtZSBzdWJtaXNzaW9uLlxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRFeWVQYXJhbWV0ZXJzID0gZnVuY3Rpb24od2hpY2hFeWUpIHtcbiAgLy8gT3ZlcnJpZGUgdG8gcmV0dXJuIGFjY3VyYXRlIGV5ZSBwYXJhbWV0ZXJzIGlmIGNhblByZXNlbnQgaXMgdHJ1ZS5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKlxuICogRGVwcmVjYXRlZCBjbGFzc2VzXG4gKi9cblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIGRldmljZXMuIChEZXByZWNhdGVkKVxuICovXG5mdW5jdGlvbiBWUkRldmljZSgpIHtcbiAgdGhpcy5pc1BvbHlmaWxsZWQgPSB0cnVlO1xuICB0aGlzLmhhcmR3YXJlVW5pdElkID0gJ3dlYnZyLXBvbHlmaWxsIGhhcmR3YXJlVW5pdElkJztcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbCBkZXZpY2VJZCc7XG4gIHRoaXMuZGV2aWNlTmFtZSA9ICd3ZWJ2ci1wb2x5ZmlsbCBkZXZpY2VOYW1lJztcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIEhNRCBkZXZpY2VzLiAoRGVwcmVjYXRlZClcbiAqL1xuZnVuY3Rpb24gSE1EVlJEZXZpY2UoKSB7XG59XG5ITURWUkRldmljZS5wcm90b3R5cGUgPSBuZXcgVlJEZXZpY2UoKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIHBvc2l0aW9uIHNlbnNvciBkZXZpY2VzLiAoRGVwcmVjYXRlZClcbiAqL1xuZnVuY3Rpb24gUG9zaXRpb25TZW5zb3JWUkRldmljZSgpIHtcbn1cblBvc2l0aW9uU2Vuc29yVlJEZXZpY2UucHJvdG90eXBlID0gbmV3IFZSRGV2aWNlKCk7XG5cbm1vZHVsZS5leHBvcnRzLlZSRnJhbWVEYXRhID0gVlJGcmFtZURhdGE7XG5tb2R1bGUuZXhwb3J0cy5WUkRpc3BsYXkgPSBWUkRpc3BsYXk7XG5tb2R1bGUuZXhwb3J0cy5WUkRldmljZSA9IFZSRGV2aWNlO1xubW9kdWxlLmV4cG9ydHMuSE1EVlJEZXZpY2UgPSBITURWUkRldmljZTtcbm1vZHVsZS5leHBvcnRzLlBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSBQb3NpdGlvblNlbnNvclZSRGV2aWNlO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIENhcmRib2FyZFVJID0gcmVxdWlyZSgnLi9jYXJkYm9hcmQtdWkuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgV0dMVVByZXNlcnZlR0xTdGF0ZSA9IHJlcXVpcmUoJy4vZGVwcy93Z2x1LXByZXNlcnZlLXN0YXRlLmpzJyk7XG5cbnZhciBkaXN0b3J0aW9uVlMgPSBbXG4gICdhdHRyaWJ1dGUgdmVjMiBwb3NpdGlvbjsnLFxuICAnYXR0cmlidXRlIHZlYzMgdGV4Q29vcmQ7JyxcblxuICAndmFyeWluZyB2ZWMyIHZUZXhDb29yZDsnLFxuXG4gICd1bmlmb3JtIHZlYzQgdmlld3BvcnRPZmZzZXRTY2FsZVsyXTsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgdmVjNCB2aWV3cG9ydCA9IHZpZXdwb3J0T2Zmc2V0U2NhbGVbaW50KHRleENvb3JkLnopXTsnLFxuICAnICB2VGV4Q29vcmQgPSAodGV4Q29vcmQueHkgKiB2aWV3cG9ydC56dykgKyB2aWV3cG9ydC54eTsnLFxuICAnICBnbF9Qb3NpdGlvbiA9IHZlYzQoIHBvc2l0aW9uLCAxLjAsIDEuMCApOycsXG4gICd9Jyxcbl0uam9pbignXFxuJyk7XG5cbnZhciBkaXN0b3J0aW9uRlMgPSBbXG4gICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDsnLFxuICAndW5pZm9ybSBzYW1wbGVyMkQgZGlmZnVzZTsnLFxuXG4gICd2YXJ5aW5nIHZlYzIgdlRleENvb3JkOycsXG5cbiAgJ3ZvaWQgbWFpbigpIHsnLFxuICAnICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQoZGlmZnVzZSwgdlRleENvb3JkKTsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG4vKipcbiAqIEEgbWVzaC1iYXNlZCBkaXN0b3J0ZXIuXG4gKi9cbmZ1bmN0aW9uIENhcmRib2FyZERpc3RvcnRlcihnbCkge1xuICB0aGlzLmdsID0gZ2w7XG4gIHRoaXMuY3R4QXR0cmlicyA9IGdsLmdldENvbnRleHRBdHRyaWJ1dGVzKCk7XG5cbiAgdGhpcy5tZXNoV2lkdGggPSAyMDtcbiAgdGhpcy5tZXNoSGVpZ2h0ID0gMjA7XG5cbiAgdGhpcy5idWZmZXJTY2FsZSA9IHdpbmRvdy5XZWJWUkNvbmZpZy5CVUZGRVJfU0NBTEU7XG5cbiAgdGhpcy5idWZmZXJXaWR0aCA9IGdsLmRyYXdpbmdCdWZmZXJXaWR0aDtcbiAgdGhpcy5idWZmZXJIZWlnaHQgPSBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0O1xuXG4gIC8vIFBhdGNoaW5nIHN1cHBvcnRcbiAgdGhpcy5yZWFsQmluZEZyYW1lYnVmZmVyID0gZ2wuYmluZEZyYW1lYnVmZmVyO1xuICB0aGlzLnJlYWxFbmFibGUgPSBnbC5lbmFibGU7XG4gIHRoaXMucmVhbERpc2FibGUgPSBnbC5kaXNhYmxlO1xuICB0aGlzLnJlYWxDb2xvck1hc2sgPSBnbC5jb2xvck1hc2s7XG4gIHRoaXMucmVhbENsZWFyQ29sb3IgPSBnbC5jbGVhckNvbG9yO1xuICB0aGlzLnJlYWxWaWV3cG9ydCA9IGdsLnZpZXdwb3J0O1xuXG4gIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgdGhpcy5yZWFsQ2FudmFzV2lkdGggPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGdsLmNhbnZhcy5fX3Byb3RvX18sICd3aWR0aCcpO1xuICAgIHRoaXMucmVhbENhbnZhc0hlaWdodCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZ2wuY2FudmFzLl9fcHJvdG9fXywgJ2hlaWdodCcpO1xuICB9XG5cbiAgdGhpcy5pc1BhdGNoZWQgPSBmYWxzZTtcblxuICAvLyBTdGF0ZSB0cmFja2luZ1xuICB0aGlzLmxhc3RCb3VuZEZyYW1lYnVmZmVyID0gbnVsbDtcbiAgdGhpcy5jdWxsRmFjZSA9IGZhbHNlO1xuICB0aGlzLmRlcHRoVGVzdCA9IGZhbHNlO1xuICB0aGlzLmJsZW5kID0gZmFsc2U7XG4gIHRoaXMuc2Npc3NvclRlc3QgPSBmYWxzZTtcbiAgdGhpcy5zdGVuY2lsVGVzdCA9IGZhbHNlO1xuICB0aGlzLnZpZXdwb3J0ID0gWzAsIDAsIDAsIDBdO1xuICB0aGlzLmNvbG9yTWFzayA9IFt0cnVlLCB0cnVlLCB0cnVlLCB0cnVlXTtcbiAgdGhpcy5jbGVhckNvbG9yID0gWzAsIDAsIDAsIDBdO1xuXG4gIHRoaXMuYXR0cmlicyA9IHtcbiAgICBwb3NpdGlvbjogMCxcbiAgICB0ZXhDb29yZDogMVxuICB9O1xuICB0aGlzLnByb2dyYW0gPSBVdGlsLmxpbmtQcm9ncmFtKGdsLCBkaXN0b3J0aW9uVlMsIGRpc3RvcnRpb25GUywgdGhpcy5hdHRyaWJzKTtcbiAgdGhpcy51bmlmb3JtcyA9IFV0aWwuZ2V0UHJvZ3JhbVVuaWZvcm1zKGdsLCB0aGlzLnByb2dyYW0pO1xuXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZSA9IG5ldyBGbG9hdDMyQXJyYXkoOCk7XG4gIHRoaXMuc2V0VGV4dHVyZUJvdW5kcygpO1xuXG4gIHRoaXMudmVydGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gIHRoaXMuaW5kZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgdGhpcy5pbmRleENvdW50ID0gMDtcblxuICB0aGlzLnJlbmRlclRhcmdldCA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgdGhpcy5mcmFtZWJ1ZmZlciA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG5cbiAgdGhpcy5kZXB0aFN0ZW5jaWxCdWZmZXIgPSBudWxsO1xuICB0aGlzLmRlcHRoQnVmZmVyID0gbnVsbDtcbiAgdGhpcy5zdGVuY2lsQnVmZmVyID0gbnVsbDtcblxuICBpZiAodGhpcy5jdHhBdHRyaWJzLmRlcHRoICYmIHRoaXMuY3R4QXR0cmlicy5zdGVuY2lsKSB7XG4gICAgdGhpcy5kZXB0aFN0ZW5jaWxCdWZmZXIgPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgfSBlbHNlIGlmICh0aGlzLmN0eEF0dHJpYnMuZGVwdGgpIHtcbiAgICB0aGlzLmRlcHRoQnVmZmVyID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gIH0gZWxzZSBpZiAodGhpcy5jdHhBdHRyaWJzLnN0ZW5jaWwpIHtcbiAgICB0aGlzLnN0ZW5jaWxCdWZmZXIgPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgfVxuXG4gIHRoaXMucGF0Y2goKTtcblxuICB0aGlzLm9uUmVzaXplKCk7XG5cbiAgaWYgKCF3aW5kb3cuV2ViVlJDb25maWcuQ0FSREJPQVJEX1VJX0RJU0FCTEVEKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSSA9IG5ldyBDYXJkYm9hcmRVSShnbCk7XG4gIH1cbn07XG5cbi8qKlxuICogVGVhcnMgZG93biBhbGwgdGhlIHJlc291cmNlcyBjcmVhdGVkIGJ5IHRoZSBkaXN0b3J0ZXIgYW5kIHJlbW92ZXMgYW55XG4gKiBwYXRjaGVzLlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcblxuICB0aGlzLnVucGF0Y2goKTtcblxuICBnbC5kZWxldGVQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLnZlcnRleEJ1ZmZlcik7XG4gIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLmluZGV4QnVmZmVyKTtcbiAgZ2wuZGVsZXRlVGV4dHVyZSh0aGlzLnJlbmRlclRhcmdldCk7XG4gIGdsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuZnJhbWVidWZmZXIpO1xuICBpZiAodGhpcy5kZXB0aFN0ZW5jaWxCdWZmZXIpIHtcbiAgICBnbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5kZXB0aFN0ZW5jaWxCdWZmZXIpO1xuICB9XG4gIGlmICh0aGlzLmRlcHRoQnVmZmVyKSB7XG4gICAgZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMuZGVwdGhCdWZmZXIpO1xuICB9XG4gIGlmICh0aGlzLnN0ZW5jaWxCdWZmZXIpIHtcbiAgICBnbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5zdGVuY2lsQnVmZmVyKTtcbiAgfVxuXG4gIGlmICh0aGlzLmNhcmRib2FyZFVJKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSS5kZXN0cm95KCk7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBSZXNpemVzIHRoZSBiYWNrYnVmZmVyIHRvIG1hdGNoIHRoZSBjYW52YXMgd2lkdGggYW5kIGhlaWdodC5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5vblJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXG4gICAgZ2wuUkVOREVSQlVGRkVSX0JJTkRJTkcsXG4gICAgZ2wuVEVYVFVSRV9CSU5ESU5HXzJELCBnbC5URVhUVVJFMFxuICBdO1xuXG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgLy8gQmluZCByZWFsIGJhY2tidWZmZXIgYW5kIGNsZWFyIGl0IG9uY2UuIFdlIGRvbid0IG5lZWQgdG8gY2xlYXIgaXQgYWdhaW5cbiAgICAvLyBhZnRlciB0aGF0IGJlY2F1c2Ugd2UncmUgb3ZlcndyaXRpbmcgdGhlIHNhbWUgYXJlYSBldmVyeSBmcmFtZS5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuXG4gICAgLy8gUHV0IHRoaW5ncyBpbiBhIGdvb2Qgc3RhdGVcbiAgICBpZiAoc2VsZi5zY2lzc29yVGVzdCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cbiAgICBzZWxmLnJlYWxDb2xvck1hc2suY2FsbChnbCwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuY2FsbChnbCwgMCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcbiAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIDAsIDAsIDAsIDEpO1xuXG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG5cbiAgICAvLyBOb3cgYmluZCBhbmQgcmVzaXplIHRoZSBmYWtlIGJhY2tidWZmZXJcbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYuZnJhbWVidWZmZXIpO1xuXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgc2VsZi5yZW5kZXJUYXJnZXQpO1xuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgc2VsZi5jdHhBdHRyaWJzLmFscGhhID8gZ2wuUkdCQSA6IGdsLlJHQixcbiAgICAgICAgc2VsZi5idWZmZXJXaWR0aCwgc2VsZi5idWZmZXJIZWlnaHQsIDAsXG4gICAgICAgIHNlbGYuY3R4QXR0cmlicy5hbHBoYSA/IGdsLlJHQkEgOiBnbC5SR0IsIGdsLlVOU0lHTkVEX0JZVEUsIG51bGwpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgc2VsZi5yZW5kZXJUYXJnZXQsIDApO1xuXG4gICAgaWYgKHNlbGYuY3R4QXR0cmlicy5kZXB0aCAmJiBzZWxmLmN0eEF0dHJpYnMuc3RlbmNpbCkge1xuICAgICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIHNlbGYuZGVwdGhTdGVuY2lsQnVmZmVyKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5ERVBUSF9TVEVOQ0lMLFxuICAgICAgICAgIHNlbGYuYnVmZmVyV2lkdGgsIHNlbGYuYnVmZmVySGVpZ2h0KTtcbiAgICAgIGdsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9TVEVOQ0lMX0FUVEFDSE1FTlQsXG4gICAgICAgICAgZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoU3RlbmNpbEJ1ZmZlcik7XG4gICAgfSBlbHNlIGlmIChzZWxmLmN0eEF0dHJpYnMuZGVwdGgpIHtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoQnVmZmVyKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5ERVBUSF9DT01QT05FTlQxNixcbiAgICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoLCBzZWxmLmJ1ZmZlckhlaWdodCk7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfQVRUQUNITUVOVCxcbiAgICAgICAgICBnbC5SRU5ERVJCVUZGRVIsIHNlbGYuZGVwdGhCdWZmZXIpO1xuICAgIH0gZWxzZSBpZiAoc2VsZi5jdHhBdHRyaWJzLnN0ZW5jaWwpIHtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBzZWxmLnN0ZW5jaWxCdWZmZXIpO1xuICAgICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShnbC5SRU5ERVJCVUZGRVIsIGdsLlNURU5DSUxfSU5ERVg4LFxuICAgICAgICAgIHNlbGYuYnVmZmVyV2lkdGgsIHNlbGYuYnVmZmVySGVpZ2h0KTtcbiAgICAgIGdsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBnbC5TVEVOQ0lMX0FUVEFDSE1FTlQsXG4gICAgICAgICAgZ2wuUkVOREVSQlVGRkVSLCBzZWxmLnN0ZW5jaWxCdWZmZXIpO1xuICAgIH1cblxuICAgIGlmICghZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbC5GUkFNRUJVRkZFUikgPT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGcmFtZWJ1ZmZlciBpbmNvbXBsZXRlIScpO1xuICAgIH1cblxuICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKGdsLCBnbC5GUkFNRUJVRkZFUiwgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlcik7XG5cbiAgICBpZiAoc2VsZi5zY2lzc29yVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuU0NJU1NPUl9URVNUKTsgfVxuXG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmFwcGx5KGdsLCBzZWxmLmNvbG9yTWFzayk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuYXBwbHkoZ2wsIHNlbGYudmlld3BvcnQpO1xuICAgIHNlbGYucmVhbENsZWFyQ29sb3IuYXBwbHkoZ2wsIHNlbGYuY2xlYXJDb2xvcik7XG4gIH0pO1xuXG4gIGlmICh0aGlzLmNhcmRib2FyZFVJKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSS5vblJlc2l6ZSgpO1xuICB9XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnBhdGNoID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmlzUGF0Y2hlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGNhbnZhcyA9IHRoaXMuZ2wuY2FudmFzO1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgY2FudmFzLndpZHRoID0gVXRpbC5nZXRTY3JlZW5XaWR0aCgpICogdGhpcy5idWZmZXJTY2FsZTtcbiAgICBjYW52YXMuaGVpZ2h0ID0gVXRpbC5nZXRTY3JlZW5IZWlnaHQoKSAqIHRoaXMuYnVmZmVyU2NhbGU7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnd2lkdGgnLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuYnVmZmVyV2lkdGg7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoID0gdmFsdWU7XG4gICAgICAgIHNlbGYucmVhbENhbnZhc1dpZHRoLnNldC5jYWxsKGNhbnZhcywgdmFsdWUpO1xuICAgICAgICBzZWxmLm9uUmVzaXplKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnaGVpZ2h0Jywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmJ1ZmZlckhlaWdodDtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHNlbGYuYnVmZmVySGVpZ2h0ID0gdmFsdWU7XG4gICAgICAgIHNlbGYucmVhbENhbnZhc0hlaWdodC5zZXQuY2FsbChjYW52YXMsIHZhbHVlKTtcbiAgICAgICAgc2VsZi5vblJlc2l6ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IGdsLmdldFBhcmFtZXRlcihnbC5GUkFNRUJVRkZFUl9CSU5ESU5HKTtcblxuICBpZiAodGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9PSBudWxsKSB7XG4gICAgdGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IHRoaXMuZnJhbWVidWZmZXI7XG4gICAgdGhpcy5nbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHRoaXMuZnJhbWVidWZmZXIpO1xuICB9XG5cbiAgdGhpcy5nbC5iaW5kRnJhbWVidWZmZXIgPSBmdW5jdGlvbih0YXJnZXQsIGZyYW1lYnVmZmVyKSB7XG4gICAgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IGZyYW1lYnVmZmVyID8gZnJhbWVidWZmZXIgOiBzZWxmLmZyYW1lYnVmZmVyO1xuICAgIC8vIFNpbGVudGx5IG1ha2UgY2FsbHMgdG8gYmluZCB0aGUgZGVmYXVsdCBmcmFtZWJ1ZmZlciBiaW5kIG91cnMgaW5zdGVhZC5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgdGFyZ2V0LCBzZWxmLmxhc3RCb3VuZEZyYW1lYnVmZmVyKTtcbiAgfTtcblxuICB0aGlzLmN1bGxGYWNlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNVTExfRkFDRSk7XG4gIHRoaXMuZGVwdGhUZXN0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkRFUFRIX1RFU1QpO1xuICB0aGlzLmJsZW5kID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkJMRU5EKTtcbiAgdGhpcy5zY2lzc29yVGVzdCA9IGdsLmdldFBhcmFtZXRlcihnbC5TQ0lTU09SX1RFU1QpO1xuICB0aGlzLnN0ZW5jaWxUZXN0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlNURU5DSUxfVEVTVCk7XG5cbiAgZ2wuZW5hYmxlID0gZnVuY3Rpb24ocG5hbWUpIHtcbiAgICBzd2l0Y2ggKHBuYW1lKSB7XG4gICAgICBjYXNlIGdsLkNVTExfRkFDRTogc2VsZi5jdWxsRmFjZSA9IHRydWU7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5ERVBUSF9URVNUOiBzZWxmLmRlcHRoVGVzdCA9IHRydWU7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5CTEVORDogc2VsZi5ibGVuZCA9IHRydWU7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5TQ0lTU09SX1RFU1Q6IHNlbGYuc2Npc3NvclRlc3QgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU1RFTkNJTF9URVNUOiBzZWxmLnN0ZW5jaWxUZXN0ID0gdHJ1ZTsgYnJlYWs7XG4gICAgfVxuICAgIHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBwbmFtZSk7XG4gIH07XG5cbiAgZ2wuZGlzYWJsZSA9IGZ1bmN0aW9uKHBuYW1lKSB7XG4gICAgc3dpdGNoIChwbmFtZSkge1xuICAgICAgY2FzZSBnbC5DVUxMX0ZBQ0U6IHNlbGYuY3VsbEZhY2UgPSBmYWxzZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLkRFUFRIX1RFU1Q6IHNlbGYuZGVwdGhUZXN0ID0gZmFsc2U7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5CTEVORDogc2VsZi5ibGVuZCA9IGZhbHNlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU0NJU1NPUl9URVNUOiBzZWxmLnNjaXNzb3JUZXN0ID0gZmFsc2U7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5TVEVOQ0lMX1RFU1Q6IHNlbGYuc3RlbmNpbFRlc3QgPSBmYWxzZTsgYnJlYWs7XG4gICAgfVxuICAgIHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgcG5hbWUpO1xuICB9O1xuXG4gIHRoaXMuY29sb3JNYXNrID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNPTE9SX1dSSVRFTUFTSyk7XG4gIGdsLmNvbG9yTWFzayA9IGZ1bmN0aW9uKHIsIGcsIGIsIGEpIHtcbiAgICBzZWxmLmNvbG9yTWFza1swXSA9IHI7XG4gICAgc2VsZi5jb2xvck1hc2tbMV0gPSBnO1xuICAgIHNlbGYuY29sb3JNYXNrWzJdID0gYjtcbiAgICBzZWxmLmNvbG9yTWFza1szXSA9IGE7XG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmNhbGwoZ2wsIHIsIGcsIGIsIGEpO1xuICB9O1xuXG4gIHRoaXMuY2xlYXJDb2xvciA9IGdsLmdldFBhcmFtZXRlcihnbC5DT0xPUl9DTEVBUl9WQUxVRSk7XG4gIGdsLmNsZWFyQ29sb3IgPSBmdW5jdGlvbihyLCBnLCBiLCBhKSB7XG4gICAgc2VsZi5jbGVhckNvbG9yWzBdID0gcjtcbiAgICBzZWxmLmNsZWFyQ29sb3JbMV0gPSBnO1xuICAgIHNlbGYuY2xlYXJDb2xvclsyXSA9IGI7XG4gICAgc2VsZi5jbGVhckNvbG9yWzNdID0gYTtcbiAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIHIsIGcsIGIsIGEpO1xuICB9O1xuXG4gIHRoaXMudmlld3BvcnQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVklFV1BPUlQpO1xuICBnbC52aWV3cG9ydCA9IGZ1bmN0aW9uKHgsIHksIHcsIGgpIHtcbiAgICBzZWxmLnZpZXdwb3J0WzBdID0geDtcbiAgICBzZWxmLnZpZXdwb3J0WzFdID0geTtcbiAgICBzZWxmLnZpZXdwb3J0WzJdID0gdztcbiAgICBzZWxmLnZpZXdwb3J0WzNdID0gaDtcbiAgICBzZWxmLnJlYWxWaWV3cG9ydC5jYWxsKGdsLCB4LCB5LCB3LCBoKTtcbiAgfTtcblxuICB0aGlzLmlzUGF0Y2hlZCA9IHRydWU7XG4gIFV0aWwuc2FmYXJpQ3NzU2l6ZVdvcmthcm91bmQoY2FudmFzKTtcbn07XG5cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUudW5wYXRjaCA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuaXNQYXRjaGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIGNhbnZhcyA9IHRoaXMuZ2wuY2FudmFzO1xuXG4gIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNhbnZhcywgJ3dpZHRoJywgdGhpcy5yZWFsQ2FudmFzV2lkdGgpO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYW52YXMsICdoZWlnaHQnLCB0aGlzLnJlYWxDYW52YXNIZWlnaHQpO1xuICB9XG4gIGNhbnZhcy53aWR0aCA9IHRoaXMuYnVmZmVyV2lkdGg7XG4gIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmJ1ZmZlckhlaWdodDtcblxuICBnbC5iaW5kRnJhbWVidWZmZXIgPSB0aGlzLnJlYWxCaW5kRnJhbWVidWZmZXI7XG4gIGdsLmVuYWJsZSA9IHRoaXMucmVhbEVuYWJsZTtcbiAgZ2wuZGlzYWJsZSA9IHRoaXMucmVhbERpc2FibGU7XG4gIGdsLmNvbG9yTWFzayA9IHRoaXMucmVhbENvbG9yTWFzaztcbiAgZ2wuY2xlYXJDb2xvciA9IHRoaXMucmVhbENsZWFyQ29sb3I7XG4gIGdsLnZpZXdwb3J0ID0gdGhpcy5yZWFsVmlld3BvcnQ7XG5cbiAgLy8gQ2hlY2sgdG8gc2VlIGlmIG91ciBmYWtlIGJhY2tidWZmZXIgaXMgYm91bmQgYW5kIGJpbmQgdGhlIHJlYWwgYmFja2J1ZmZlclxuICAvLyBpZiB0aGF0J3MgdGhlIGNhc2UuXG4gIGlmICh0aGlzLmxhc3RCb3VuZEZyYW1lYnVmZmVyID09IHRoaXMuZnJhbWVidWZmZXIpIHtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICB9XG5cbiAgdGhpcy5pc1BhdGNoZWQgPSBmYWxzZTtcblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIFV0aWwuc2FmYXJpQ3NzU2l6ZVdvcmthcm91bmQoY2FudmFzKTtcbiAgfSwgMSk7XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnNldFRleHR1cmVCb3VuZHMgPSBmdW5jdGlvbihsZWZ0Qm91bmRzLCByaWdodEJvdW5kcykge1xuICBpZiAoIWxlZnRCb3VuZHMpIHtcbiAgICBsZWZ0Qm91bmRzID0gWzAsIDAsIDAuNSwgMV07XG4gIH1cblxuICBpZiAoIXJpZ2h0Qm91bmRzKSB7XG4gICAgcmlnaHRCb3VuZHMgPSBbMC41LCAwLCAwLjUsIDFdO1xuICB9XG5cbiAgLy8gTGVmdCBleWVcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzBdID0gbGVmdEJvdW5kc1swXTsgLy8gWFxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbMV0gPSBsZWZ0Qm91bmRzWzFdOyAvLyBZXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVsyXSA9IGxlZnRCb3VuZHNbMl07IC8vIFdpZHRoXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVszXSA9IGxlZnRCb3VuZHNbM107IC8vIEhlaWdodFxuXG4gIC8vIFJpZ2h0IGV5ZVxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbNF0gPSByaWdodEJvdW5kc1swXTsgLy8gWFxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbNV0gPSByaWdodEJvdW5kc1sxXTsgLy8gWVxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbNl0gPSByaWdodEJvdW5kc1syXTsgLy8gV2lkdGhcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzddID0gcmlnaHRCb3VuZHNbM107IC8vIEhlaWdodFxufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBkaXN0b3J0aW9uIHBhc3Mgb24gdGhlIGluamVjdGVkIGJhY2tidWZmZXIsIHJlbmRlcmluZyBpdCB0byB0aGUgcmVhbFxuICogYmFja2J1ZmZlci5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5zdWJtaXRGcmFtZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXTtcblxuICBpZiAoIXdpbmRvdy5XZWJWUkNvbmZpZy5ESVJUWV9TVUJNSVRfRlJBTUVfQklORElOR1MpIHtcbiAgICBnbFN0YXRlLnB1c2goXG4gICAgICBnbC5DVVJSRU5UX1BST0dSQU0sXG4gICAgICBnbC5BUlJBWV9CVUZGRVJfQklORElORyxcbiAgICAgIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkcsXG4gICAgICBnbC5URVhUVVJFX0JJTkRJTkdfMkQsIGdsLlRFWFRVUkUwXG4gICAgKTtcbiAgfVxuXG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgLy8gQmluZCB0aGUgcmVhbCBkZWZhdWx0IGZyYW1lYnVmZmVyXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgR0wgc3RhdGUgaXMgaW4gYSBnb29kIHBsYWNlXG4gICAgaWYgKHNlbGYuY3VsbEZhY2UpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5DVUxMX0ZBQ0UpOyB9XG4gICAgaWYgKHNlbGYuZGVwdGhUZXN0KSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuREVQVEhfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5ibGVuZCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLkJMRU5EKTsgfVxuICAgIGlmIChzZWxmLnNjaXNzb3JUZXN0KSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuU0NJU1NPUl9URVNUKTsgfVxuICAgIGlmIChzZWxmLnN0ZW5jaWxUZXN0KSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuU1RFTkNJTF9URVNUKTsgfVxuICAgIHNlbGYucmVhbENvbG9yTWFzay5jYWxsKGdsLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKTtcbiAgICBzZWxmLnJlYWxWaWV3cG9ydC5jYWxsKGdsLCAwLCAwLCBnbC5kcmF3aW5nQnVmZmVyV2lkdGgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQpO1xuXG4gICAgLy8gSWYgdGhlIGJhY2tidWZmZXIgaGFzIGFuIGFscGhhIGNoYW5uZWwgY2xlYXIgZXZlcnkgZnJhbWUgc28gdGhlIHBhZ2VcbiAgICAvLyBkb2Vzbid0IHNob3cgdGhyb3VnaC5cbiAgICBpZiAoc2VsZi5jdHhBdHRyaWJzLmFscGhhIHx8IFV0aWwuaXNJT1MoKSkge1xuICAgICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCAwLCAwLCAwLCAxKTtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH1cblxuICAgIC8vIEJpbmQgZGlzdG9ydGlvbiBwcm9ncmFtIGFuZCBtZXNoXG4gICAgZ2wudXNlUHJvZ3JhbShzZWxmLnByb2dyYW0pO1xuXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgc2VsZi5pbmRleEJ1ZmZlcik7XG5cbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc2VsZi52ZXJ0ZXhCdWZmZXIpO1xuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNlbGYuYXR0cmlicy5wb3NpdGlvbik7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2VsZi5hdHRyaWJzLnRleENvb3JkKTtcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNlbGYuYXR0cmlicy5wb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAyMCwgMCk7XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzZWxmLmF0dHJpYnMudGV4Q29vcmQsIDMsIGdsLkZMT0FULCBmYWxzZSwgMjAsIDgpO1xuXG4gICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCk7XG4gICAgZ2wudW5pZm9ybTFpKHNlbGYudW5pZm9ybXMuZGlmZnVzZSwgMCk7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgc2VsZi5yZW5kZXJUYXJnZXQpO1xuXG4gICAgZ2wudW5pZm9ybTRmdihzZWxmLnVuaWZvcm1zLnZpZXdwb3J0T2Zmc2V0U2NhbGUsIHNlbGYudmlld3BvcnRPZmZzZXRTY2FsZSk7XG5cbiAgICAvLyBEcmF3cyBib3RoIGV5ZXNcbiAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBzZWxmLmluZGV4Q291bnQsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcblxuICAgIGlmIChzZWxmLmNhcmRib2FyZFVJKSB7XG4gICAgICBzZWxmLmNhcmRib2FyZFVJLnJlbmRlck5vU3RhdGUoKTtcbiAgICB9XG5cbiAgICAvLyBCaW5kIHRoZSBmYWtlIGRlZmF1bHQgZnJhbWVidWZmZXIgYWdhaW5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChzZWxmLmdsLCBnbC5GUkFNRUJVRkZFUiwgc2VsZi5mcmFtZWJ1ZmZlcik7XG5cbiAgICAvLyBJZiBwcmVzZXJ2ZURyYXdpbmdCdWZmZXIgPT0gZmFsc2UgY2xlYXIgdGhlIGZyYW1lYnVmZmVyXG4gICAgaWYgKCFzZWxmLmN0eEF0dHJpYnMucHJlc2VydmVEcmF3aW5nQnVmZmVyKSB7XG4gICAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIDAsIDAsIDAsIDApO1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgfVxuXG4gICAgaWYgKCF3aW5kb3cuV2ViVlJDb25maWcuRElSVFlfU1VCTUlUX0ZSQU1FX0JJTkRJTkdTKSB7XG4gICAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYubGFzdEJvdW5kRnJhbWVidWZmZXIpO1xuICAgIH1cblxuICAgIC8vIFJlc3RvcmUgc3RhdGVcbiAgICBpZiAoc2VsZi5jdWxsRmFjZSkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuQ1VMTF9GQUNFKTsgfVxuICAgIGlmIChzZWxmLmRlcHRoVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuREVQVEhfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5ibGVuZCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuQkxFTkQpOyB9XG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5zdGVuY2lsVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuU1RFTkNJTF9URVNUKTsgfVxuXG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmFwcGx5KGdsLCBzZWxmLmNvbG9yTWFzayk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuYXBwbHkoZ2wsIHNlbGYudmlld3BvcnQpO1xuICAgIGlmIChzZWxmLmN0eEF0dHJpYnMuYWxwaGEgfHwgIXNlbGYuY3R4QXR0cmlicy5wcmVzZXJ2ZURyYXdpbmdCdWZmZXIpIHtcbiAgICAgIHNlbGYucmVhbENsZWFyQ29sb3IuYXBwbHkoZ2wsIHNlbGYuY2xlYXJDb2xvcik7XG4gICAgfVxuICB9KTtcblxuICAvLyBXb3JrYXJvdW5kIGZvciB0aGUgZmFjdCB0aGF0IFNhZmFyaSBkb2Vzbid0IGFsbG93IHVzIHRvIHBhdGNoIHRoZSBjYW52YXNcbiAgLy8gd2lkdGggYW5kIGhlaWdodCBjb3JyZWN0bHkuIEFmdGVyIGVhY2ggc3VibWl0IGZyYW1lIGNoZWNrIHRvIHNlZSB3aGF0IHRoZVxuICAvLyByZWFsIGJhY2tidWZmZXIgc2l6ZSBoYXMgYmVlbiBzZXQgdG8gYW5kIHJlc2l6ZSB0aGUgZmFrZSBiYWNrYnVmZmVyIHNpemVcbiAgLy8gdG8gbWF0Y2guXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICB2YXIgY2FudmFzID0gZ2wuY2FudmFzO1xuICAgIGlmIChjYW52YXMud2lkdGggIT0gc2VsZi5idWZmZXJXaWR0aCB8fCBjYW52YXMuaGVpZ2h0ICE9IHNlbGYuYnVmZmVySGVpZ2h0KSB7XG4gICAgICBzZWxmLmJ1ZmZlcldpZHRoID0gY2FudmFzLndpZHRoO1xuICAgICAgc2VsZi5idWZmZXJIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuICAgICAgc2VsZi5vblJlc2l6ZSgpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDYWxsIHdoZW4gdGhlIGRldmljZUluZm8gaGFzIGNoYW5nZWQuIEF0IHRoaXMgcG9pbnQgd2UgbmVlZFxuICogdG8gcmUtY2FsY3VsYXRlIHRoZSBkaXN0b3J0aW9uIG1lc2guXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUudXBkYXRlRGV2aWNlSW5mbyA9IGZ1bmN0aW9uKGRldmljZUluZm8pIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW2dsLkFSUkFZX0JVRkZFUl9CSU5ESU5HLCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HXTtcbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICB2YXIgdmVydGljZXMgPSBzZWxmLmNvbXB1dGVNZXNoVmVydGljZXNfKHNlbGYubWVzaFdpZHRoLCBzZWxmLm1lc2hIZWlnaHQsIGRldmljZUluZm8pO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBzZWxmLnZlcnRleEJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHZlcnRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICAvLyBJbmRpY2VzIGRvbid0IGNoYW5nZSBiYXNlZCBvbiBkZXZpY2UgcGFyYW1ldGVycywgc28gb25seSBjb21wdXRlIG9uY2UuXG4gICAgaWYgKCFzZWxmLmluZGV4Q291bnQpIHtcbiAgICAgIHZhciBpbmRpY2VzID0gc2VsZi5jb21wdXRlTWVzaEluZGljZXNfKHNlbGYubWVzaFdpZHRoLCBzZWxmLm1lc2hIZWlnaHQpO1xuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgc2VsZi5pbmRleEJ1ZmZlcik7XG4gICAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpbmRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICBzZWxmLmluZGV4Q291bnQgPSBpbmRpY2VzLmxlbmd0aDtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBCdWlsZCB0aGUgZGlzdG9ydGlvbiBtZXNoIHZlcnRpY2VzLlxuICogQmFzZWQgb24gY29kZSBmcm9tIHRoZSBVbml0eSBjYXJkYm9hcmQgcGx1Z2luLlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLmNvbXB1dGVNZXNoVmVydGljZXNfID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgZGV2aWNlSW5mbykge1xuICB2YXIgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KDIgKiB3aWR0aCAqIGhlaWdodCAqIDUpO1xuXG4gIHZhciBsZW5zRnJ1c3R1bSA9IGRldmljZUluZm8uZ2V0TGVmdEV5ZVZpc2libGVUYW5BbmdsZXMoKTtcbiAgdmFyIG5vTGVuc0ZydXN0dW0gPSBkZXZpY2VJbmZvLmdldExlZnRFeWVOb0xlbnNUYW5BbmdsZXMoKTtcbiAgdmFyIHZpZXdwb3J0ID0gZGV2aWNlSW5mby5nZXRMZWZ0RXllVmlzaWJsZVNjcmVlblJlY3Qobm9MZW5zRnJ1c3R1bSk7XG4gIHZhciB2aWR4ID0gMDtcbiAgdmFyIGlpZHggPSAwO1xuICBmb3IgKHZhciBlID0gMDsgZSA8IDI7IGUrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgaGVpZ2h0OyBqKyspIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2lkdGg7IGkrKywgdmlkeCsrKSB7XG4gICAgICAgIHZhciB1ID0gaSAvICh3aWR0aCAtIDEpO1xuICAgICAgICB2YXIgdiA9IGogLyAoaGVpZ2h0IC0gMSk7XG5cbiAgICAgICAgLy8gR3JpZCBwb2ludHMgcmVndWxhcmx5IHNwYWNlZCBpbiBTdHJlb1NjcmVlbiwgYW5kIGJhcnJlbCBkaXN0b3J0ZWQgaW5cbiAgICAgICAgLy8gdGhlIG1lc2guXG4gICAgICAgIHZhciBzID0gdTtcbiAgICAgICAgdmFyIHQgPSB2O1xuICAgICAgICB2YXIgeCA9IFV0aWwubGVycChsZW5zRnJ1c3R1bVswXSwgbGVuc0ZydXN0dW1bMl0sIHUpO1xuICAgICAgICB2YXIgeSA9IFV0aWwubGVycChsZW5zRnJ1c3R1bVszXSwgbGVuc0ZydXN0dW1bMV0sIHYpO1xuICAgICAgICB2YXIgZCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcbiAgICAgICAgdmFyIHIgPSBkZXZpY2VJbmZvLmRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoZCk7XG4gICAgICAgIHZhciBwID0geCAqIHIgLyBkO1xuICAgICAgICB2YXIgcSA9IHkgKiByIC8gZDtcbiAgICAgICAgdSA9IChwIC0gbm9MZW5zRnJ1c3R1bVswXSkgLyAobm9MZW5zRnJ1c3R1bVsyXSAtIG5vTGVuc0ZydXN0dW1bMF0pO1xuICAgICAgICB2ID0gKHEgLSBub0xlbnNGcnVzdHVtWzNdKSAvIChub0xlbnNGcnVzdHVtWzFdIC0gbm9MZW5zRnJ1c3R1bVszXSk7XG5cbiAgICAgICAgLy8gQ29udmVydCB1LHYgdG8gbWVzaCBzY3JlZW4gY29vcmRpbmF0ZXMuXG4gICAgICAgIHZhciBhc3BlY3QgPSBkZXZpY2VJbmZvLmRldmljZS53aWR0aE1ldGVycyAvIGRldmljZUluZm8uZGV2aWNlLmhlaWdodE1ldGVycztcblxuICAgICAgICAvLyBGSVhNRTogVGhlIG9yaWdpbmFsIFVuaXR5IHBsdWdpbiBtdWx0aXBsaWVkIFUgYnkgdGhlIGFzcGVjdCByYXRpb1xuICAgICAgICAvLyBhbmQgZGlkbid0IG11bHRpcGx5IGVpdGhlciB2YWx1ZSBieSAyLCBidXQgdGhhdCBzZWVtcyB0byBnZXQgaXRcbiAgICAgICAgLy8gcmVhbGx5IGNsb3NlIHRvIGNvcnJlY3QgbG9va2luZyBmb3IgbWUuIEkgaGF0ZSB0aGlzIGtpbmQgb2YgXCJEb24ndFxuICAgICAgICAvLyBrbm93IHdoeSBpdCB3b3Jrc1wiIGNvZGUgdGhvdWdoLCBhbmQgd29sZCBsb3ZlIGEgbW9yZSBsb2dpY2FsXG4gICAgICAgIC8vIGV4cGxhbmF0aW9uIG9mIHdoYXQgbmVlZHMgdG8gaGFwcGVuIGhlcmUuXG4gICAgICAgIHUgPSAodmlld3BvcnQueCArIHUgKiB2aWV3cG9ydC53aWR0aCAtIDAuNSkgKiAyLjA7IC8vKiBhc3BlY3Q7XG4gICAgICAgIHYgPSAodmlld3BvcnQueSArIHYgKiB2aWV3cG9ydC5oZWlnaHQgLSAwLjUpICogMi4wO1xuXG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyAwXSA9IHU7IC8vIHBvc2l0aW9uLnhcbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDFdID0gdjsgLy8gcG9zaXRpb24ueVxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgMl0gPSBzOyAvLyB0ZXhDb29yZC54XG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyAzXSA9IHQ7IC8vIHRleENvb3JkLnlcbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDRdID0gZTsgLy8gdGV4Q29vcmQueiAodmlld3BvcnQgaW5kZXgpXG4gICAgICB9XG4gICAgfVxuICAgIHZhciB3ID0gbGVuc0ZydXN0dW1bMl0gLSBsZW5zRnJ1c3R1bVswXTtcbiAgICBsZW5zRnJ1c3R1bVswXSA9IC0odyArIGxlbnNGcnVzdHVtWzBdKTtcbiAgICBsZW5zRnJ1c3R1bVsyXSA9IHcgLSBsZW5zRnJ1c3R1bVsyXTtcbiAgICB3ID0gbm9MZW5zRnJ1c3R1bVsyXSAtIG5vTGVuc0ZydXN0dW1bMF07XG4gICAgbm9MZW5zRnJ1c3R1bVswXSA9IC0odyArIG5vTGVuc0ZydXN0dW1bMF0pO1xuICAgIG5vTGVuc0ZydXN0dW1bMl0gPSB3IC0gbm9MZW5zRnJ1c3R1bVsyXTtcbiAgICB2aWV3cG9ydC54ID0gMSAtICh2aWV3cG9ydC54ICsgdmlld3BvcnQud2lkdGgpO1xuICB9XG4gIHJldHVybiB2ZXJ0aWNlcztcbn1cblxuLyoqXG4gKiBCdWlsZCB0aGUgZGlzdG9ydGlvbiBtZXNoIGluZGljZXMuXG4gKiBCYXNlZCBvbiBjb2RlIGZyb20gdGhlIFVuaXR5IGNhcmRib2FyZCBwbHVnaW4uXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuY29tcHV0ZU1lc2hJbmRpY2VzXyA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcbiAgdmFyIGluZGljZXMgPSBuZXcgVWludDE2QXJyYXkoMiAqICh3aWR0aCAtIDEpICogKGhlaWdodCAtIDEpICogNik7XG4gIHZhciBoYWxmd2lkdGggPSB3aWR0aCAvIDI7XG4gIHZhciBoYWxmaGVpZ2h0ID0gaGVpZ2h0IC8gMjtcbiAgdmFyIHZpZHggPSAwO1xuICB2YXIgaWlkeCA9IDA7XG4gIGZvciAodmFyIGUgPSAwOyBlIDwgMjsgZSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBoZWlnaHQ7IGorKykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3aWR0aDsgaSsrLCB2aWR4KyspIHtcbiAgICAgICAgaWYgKGkgPT0gMCB8fCBqID09IDApXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIC8vIEJ1aWxkIGEgcXVhZC4gIExvd2VyIHJpZ2h0IGFuZCB1cHBlciBsZWZ0IHF1YWRyYW50cyBoYXZlIHF1YWRzIHdpdGhcbiAgICAgICAgLy8gdGhlIHRyaWFuZ2xlIGRpYWdvbmFsIGZsaXBwZWQgdG8gZ2V0IHRoZSB2aWduZXR0ZSB0byBpbnRlcnBvbGF0ZVxuICAgICAgICAvLyBjb3JyZWN0bHkuXG4gICAgICAgIGlmICgoaSA8PSBoYWxmd2lkdGgpID09IChqIDw9IGhhbGZoZWlnaHQpKSB7XG4gICAgICAgICAgLy8gUXVhZCBkaWFnb25hbCBsb3dlciBsZWZ0IHRvIHVwcGVyIHJpZ2h0LlxuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoIC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoIC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4O1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFF1YWQgZGlhZ29uYWwgdXBwZXIgbGVmdCB0byBsb3dlciByaWdodC5cbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIDE7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoIC0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5kaWNlcztcbn07XG5cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yXyA9IGZ1bmN0aW9uKHByb3RvLCBhdHRyTmFtZSkge1xuICB2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvdG8sIGF0dHJOYW1lKTtcbiAgLy8gSW4gc29tZSBjYXNlcyAoYWhlbS4uLiBTYWZhcmkpLCB0aGUgZGVzY3JpcHRvciByZXR1cm5zIHVuZGVmaW5lZCBnZXQgYW5kXG4gIC8vIHNldCBmaWVsZHMuIEluIHRoaXMgY2FzZSwgd2UgbmVlZCB0byBjcmVhdGUgYSBzeW50aGV0aWMgcHJvcGVydHlcbiAgLy8gZGVzY3JpcHRvci4gVGhpcyB3b3JrcyBhcm91bmQgc29tZSBvZiB0aGUgaXNzdWVzIGluXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ib3Jpc211cy93ZWJ2ci1wb2x5ZmlsbC9pc3N1ZXMvNDZcbiAgaWYgKGRlc2NyaXB0b3IuZ2V0ID09PSB1bmRlZmluZWQgfHwgZGVzY3JpcHRvci5zZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSB0cnVlO1xuICAgIGRlc2NyaXB0b3IuZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgIH07XG4gICAgZGVzY3JpcHRvci5zZXQgPSBmdW5jdGlvbih2YWwpIHtcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCB2YWwpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGRlc2NyaXB0b3I7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcmRib2FyZERpc3RvcnRlcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgV0dMVVByZXNlcnZlR0xTdGF0ZSA9IHJlcXVpcmUoJy4vZGVwcy93Z2x1LXByZXNlcnZlLXN0YXRlLmpzJyk7XG5cbnZhciB1aVZTID0gW1xuICAnYXR0cmlidXRlIHZlYzIgcG9zaXRpb247JyxcblxuICAndW5pZm9ybSBtYXQ0IHByb2plY3Rpb25NYXQ7JyxcblxuICAndm9pZCBtYWluKCkgeycsXG4gICcgIGdsX1Bvc2l0aW9uID0gcHJvamVjdGlvbk1hdCAqIHZlYzQoIHBvc2l0aW9uLCAtMS4wLCAxLjAgKTsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgdWlGUyA9IFtcbiAgJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0OycsXG5cbiAgJ3VuaWZvcm0gdmVjNCBjb2xvcjsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgZ2xfRnJhZ0NvbG9yID0gY29sb3I7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxudmFyIERFRzJSQUQgPSBNYXRoLlBJLzE4MC4wO1xuXG4vLyBUaGUgZ2VhciBoYXMgNiBpZGVudGljYWwgc2VjdGlvbnMsIGVhY2ggc3Bhbm5pbmcgNjAgZGVncmVlcy5cbnZhciBrQW5nbGVQZXJHZWFyU2VjdGlvbiA9IDYwO1xuXG4vLyBIYWxmLWFuZ2xlIG9mIHRoZSBzcGFuIG9mIHRoZSBvdXRlciByaW0uXG52YXIga091dGVyUmltRW5kQW5nbGUgPSAxMjtcblxuLy8gQW5nbGUgYmV0d2VlbiB0aGUgbWlkZGxlIG9mIHRoZSBvdXRlciByaW0gYW5kIHRoZSBzdGFydCBvZiB0aGUgaW5uZXIgcmltLlxudmFyIGtJbm5lclJpbUJlZ2luQW5nbGUgPSAyMDtcblxuLy8gRGlzdGFuY2UgZnJvbSBjZW50ZXIgdG8gb3V0ZXIgcmltLCBub3JtYWxpemVkIHNvIHRoYXQgdGhlIGVudGlyZSBtb2RlbFxuLy8gZml0cyBpbiBhIFstMSwgMV0geCBbLTEsIDFdIHNxdWFyZS5cbnZhciBrT3V0ZXJSYWRpdXMgPSAxO1xuXG4vLyBEaXN0YW5jZSBmcm9tIGNlbnRlciB0byBkZXByZXNzZWQgcmltLCBpbiBtb2RlbCB1bml0cy5cbnZhciBrTWlkZGxlUmFkaXVzID0gMC43NTtcblxuLy8gUmFkaXVzIG9mIHRoZSBpbm5lciBob2xsb3cgY2lyY2xlLCBpbiBtb2RlbCB1bml0cy5cbnZhciBrSW5uZXJSYWRpdXMgPSAwLjMxMjU7XG5cbi8vIENlbnRlciBsaW5lIHRoaWNrbmVzcyBpbiBEUC5cbnZhciBrQ2VudGVyTGluZVRoaWNrbmVzc0RwID0gNDtcblxuLy8gQnV0dG9uIHdpZHRoIGluIERQLlxudmFyIGtCdXR0b25XaWR0aERwID0gMjg7XG5cbi8vIEZhY3RvciB0byBzY2FsZSB0aGUgdG91Y2ggYXJlYSB0aGF0IHJlc3BvbmRzIHRvIHRoZSB0b3VjaC5cbnZhciBrVG91Y2hTbG9wRmFjdG9yID0gMS41O1xuXG52YXIgQW5nbGVzID0gW1xuICAwLCBrT3V0ZXJSaW1FbmRBbmdsZSwga0lubmVyUmltQmVnaW5BbmdsZSxcbiAga0FuZ2xlUGVyR2VhclNlY3Rpb24gLSBrSW5uZXJSaW1CZWdpbkFuZ2xlLFxuICBrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtPdXRlclJpbUVuZEFuZ2xlXG5dO1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGFsaWdubWVudCBsaW5lIGFuZCBcIm9wdGlvbnNcIiBnZWFyLiBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIGNhbnZhc1xuICogdGhpcyBpcyByZW5kZXJlZCBpbnRvIGNvdmVycyB0aGUgZW50aXJlIHNjcmVlbiAob3IgY2xvc2UgdG8gaXQuKVxuICovXG5mdW5jdGlvbiBDYXJkYm9hcmRVSShnbCkge1xuICB0aGlzLmdsID0gZ2w7XG5cbiAgdGhpcy5hdHRyaWJzID0ge1xuICAgIHBvc2l0aW9uOiAwXG4gIH07XG4gIHRoaXMucHJvZ3JhbSA9IFV0aWwubGlua1Byb2dyYW0oZ2wsIHVpVlMsIHVpRlMsIHRoaXMuYXR0cmlicyk7XG4gIHRoaXMudW5pZm9ybXMgPSBVdGlsLmdldFByb2dyYW1Vbmlmb3JtcyhnbCwgdGhpcy5wcm9ncmFtKTtcblxuICB0aGlzLnZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICB0aGlzLmdlYXJPZmZzZXQgPSAwO1xuICB0aGlzLmdlYXJWZXJ0ZXhDb3VudCA9IDA7XG4gIHRoaXMuYXJyb3dPZmZzZXQgPSAwO1xuICB0aGlzLmFycm93VmVydGV4Q291bnQgPSAwO1xuXG4gIHRoaXMucHJvak1hdCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuXG4gIHRoaXMubGlzdGVuZXIgPSBudWxsO1xuXG4gIHRoaXMub25SZXNpemUoKTtcbn07XG5cbi8qKlxuICogVGVhcnMgZG93biBhbGwgdGhlIHJlc291cmNlcyBjcmVhdGVkIGJ5IHRoZSBVSSByZW5kZXJlci5cbiAqL1xuQ2FyZGJvYXJkVUkucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcblxuICBpZiAodGhpcy5saXN0ZW5lcikge1xuICAgIGdsLmNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMubGlzdGVuZXIsIGZhbHNlKTtcbiAgfVxuXG4gIGdsLmRlbGV0ZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMudmVydGV4QnVmZmVyKTtcbn07XG5cbi8qKlxuICogQWRkcyBhIGxpc3RlbmVyIHRvIGNsaWNrcyBvbiB0aGUgZ2VhciBhbmQgYmFjayBpY29uc1xuICovXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUubGlzdGVuID0gZnVuY3Rpb24ob3B0aW9uc0NhbGxiYWNrLCBiYWNrQ2FsbGJhY2spIHtcbiAgdmFyIGNhbnZhcyA9IHRoaXMuZ2wuY2FudmFzO1xuICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgbWlkbGluZSA9IGNhbnZhcy5jbGllbnRXaWR0aCAvIDI7XG4gICAgdmFyIGJ1dHRvblNpemUgPSBrQnV0dG9uV2lkdGhEcCAqIGtUb3VjaFNsb3BGYWN0b3I7XG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSB1c2VyIGNsaWNrZWQgb24gKG9yIGFyb3VuZCkgdGhlIGdlYXIgaWNvblxuICAgIGlmIChldmVudC5jbGllbnRYID4gbWlkbGluZSAtIGJ1dHRvblNpemUgJiZcbiAgICAgICAgZXZlbnQuY2xpZW50WCA8IG1pZGxpbmUgKyBidXR0b25TaXplICYmXG4gICAgICAgIGV2ZW50LmNsaWVudFkgPiBjYW52YXMuY2xpZW50SGVpZ2h0IC0gYnV0dG9uU2l6ZSkge1xuICAgICAgb3B0aW9uc0NhbGxiYWNrKGV2ZW50KTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSB1c2VyIGNsaWNrZWQgb24gKG9yIGFyb3VuZCkgdGhlIGJhY2sgaWNvblxuICAgIGVsc2UgaWYgKGV2ZW50LmNsaWVudFggPCBidXR0b25TaXplICYmIGV2ZW50LmNsaWVudFkgPCBidXR0b25TaXplKSB7XG4gICAgICBiYWNrQ2FsbGJhY2soZXZlbnQpO1xuICAgIH1cbiAgfTtcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5saXN0ZW5lciwgZmFsc2UpO1xufTtcblxuLyoqXG4gKiBCdWlsZHMgdGhlIFVJIG1lc2guXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5vblJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXG4gICAgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkdcbiAgXTtcblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIHZhciB2ZXJ0aWNlcyA9IFtdO1xuXG4gICAgdmFyIG1pZGxpbmUgPSBnbC5kcmF3aW5nQnVmZmVyV2lkdGggLyAyO1xuXG4gICAgLy8gVGhlIGdsIGJ1ZmZlciBzaXplIHdpbGwgbGlrZWx5IGJlIHNtYWxsZXIgdGhhbiB0aGUgcGh5c2ljYWwgcGl4ZWwgY291bnQuXG4gICAgLy8gU28gd2UgbmVlZCB0byBzY2FsZSB0aGUgZHBzIGRvd24gYmFzZWQgb24gdGhlIGFjdHVhbCBidWZmZXIgc2l6ZSB2cyBwaHlzaWNhbCBwaXhlbCBjb3VudC5cbiAgICAvLyBUaGlzIHdpbGwgcHJvcGVybHkgc2l6ZSB0aGUgdWkgZWxlbWVudHMgbm8gbWF0dGVyIHdoYXQgdGhlIGdsIGJ1ZmZlciByZXNvbHV0aW9uIGlzXG4gICAgdmFyIHBoeXNpY2FsUGl4ZWxzID0gTWF0aC5tYXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KSAqIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xuICAgIHZhciBzY2FsaW5nUmF0aW8gPSBnbC5kcmF3aW5nQnVmZmVyV2lkdGggLyBwaHlzaWNhbFBpeGVscztcbiAgICB2YXIgZHBzID0gc2NhbGluZ1JhdGlvICogIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xuXG4gICAgdmFyIGxpbmVXaWR0aCA9IGtDZW50ZXJMaW5lVGhpY2tuZXNzRHAgKiBkcHMgLyAyO1xuICAgIHZhciBidXR0b25TaXplID0ga0J1dHRvbldpZHRoRHAgKiBrVG91Y2hTbG9wRmFjdG9yICogZHBzO1xuICAgIHZhciBidXR0b25TY2FsZSA9IGtCdXR0b25XaWR0aERwICogZHBzIC8gMjtcbiAgICB2YXIgYnV0dG9uQm9yZGVyID0gKChrQnV0dG9uV2lkdGhEcCAqIGtUb3VjaFNsb3BGYWN0b3IpIC0ga0J1dHRvbldpZHRoRHApICogZHBzO1xuXG4gICAgLy8gQnVpbGQgY2VudGVybGluZVxuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSAtIGxpbmVXaWR0aCwgYnV0dG9uU2l6ZSk7XG4gICAgdmVydGljZXMucHVzaChtaWRsaW5lIC0gbGluZVdpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcbiAgICB2ZXJ0aWNlcy5wdXNoKG1pZGxpbmUgKyBsaW5lV2lkdGgsIGJ1dHRvblNpemUpO1xuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSArIGxpbmVXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgICAvLyBCdWlsZCBnZWFyXG4gICAgc2VsZi5nZWFyT2Zmc2V0ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpO1xuXG4gICAgZnVuY3Rpb24gYWRkR2VhclNlZ21lbnQodGhldGEsIHIpIHtcbiAgICAgIHZhciBhbmdsZSA9ICg5MCAtIHRoZXRhKSAqIERFRzJSQUQ7XG4gICAgICB2YXIgeCA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgIHZhciB5ID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgdmVydGljZXMucHVzaChrSW5uZXJSYWRpdXMgKiB4ICogYnV0dG9uU2NhbGUgKyBtaWRsaW5lLCBrSW5uZXJSYWRpdXMgKiB5ICogYnV0dG9uU2NhbGUgKyBidXR0b25TY2FsZSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHIgKiB4ICogYnV0dG9uU2NhbGUgKyBtaWRsaW5lLCByICogeSAqIGJ1dHRvblNjYWxlICsgYnV0dG9uU2NhbGUpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IDY7IGkrKykge1xuICAgICAgdmFyIHNlZ21lbnRUaGV0YSA9IGkgKiBrQW5nbGVQZXJHZWFyU2VjdGlvbjtcblxuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhLCBrT3V0ZXJSYWRpdXMpO1xuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhICsga091dGVyUmltRW5kQW5nbGUsIGtPdXRlclJhZGl1cyk7XG4gICAgICBhZGRHZWFyU2VnbWVudChzZWdtZW50VGhldGEgKyBrSW5uZXJSaW1CZWdpbkFuZ2xlLCBrTWlkZGxlUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIChrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtJbm5lclJpbUJlZ2luQW5nbGUpLCBrTWlkZGxlUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIChrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtPdXRlclJpbUVuZEFuZ2xlKSwga091dGVyUmFkaXVzKTtcbiAgICB9XG5cbiAgICBzZWxmLmdlYXJWZXJ0ZXhDb3VudCA9ICh2ZXJ0aWNlcy5sZW5ndGggLyAyKSAtIHNlbGYuZ2Vhck9mZnNldDtcblxuICAgIC8vIEJ1aWxkIGJhY2sgYXJyb3dcbiAgICBzZWxmLmFycm93T2Zmc2V0ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpO1xuXG4gICAgZnVuY3Rpb24gYWRkQXJyb3dWZXJ0ZXgoeCwgeSkge1xuICAgICAgdmVydGljZXMucHVzaChidXR0b25Cb3JkZXIgKyB4LCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0IC0gYnV0dG9uQm9yZGVyIC0geSk7XG4gICAgfVxuXG4gICAgdmFyIGFuZ2xlZExpbmVXaWR0aCA9IGxpbmVXaWR0aCAvIE1hdGguc2luKDQ1ICogREVHMlJBRCk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleCgwLCBidXR0b25TY2FsZSk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYnV0dG9uU2NhbGUsIDApO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlICsgYW5nbGVkTGluZVdpZHRoLCBhbmdsZWRMaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgKyBhbmdsZWRMaW5lV2lkdGgpO1xuXG4gICAgYWRkQXJyb3dWZXJ0ZXgoYW5nbGVkTGluZVdpZHRoLCBidXR0b25TY2FsZSAtIGFuZ2xlZExpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoMCwgYnV0dG9uU2NhbGUpO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlLCBidXR0b25TY2FsZSAqIDIpO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlICsgYW5nbGVkTGluZVdpZHRoLCAoYnV0dG9uU2NhbGUgKiAyKSAtIGFuZ2xlZExpbmVXaWR0aCk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlIC0gYW5nbGVkTGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleCgwLCBidXR0b25TY2FsZSk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlIC0gbGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleChrQnV0dG9uV2lkdGhEcCAqIGRwcywgYnV0dG9uU2NhbGUgLSBsaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgKyBsaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGtCdXR0b25XaWR0aERwICogZHBzLCBidXR0b25TY2FsZSArIGxpbmVXaWR0aCk7XG5cbiAgICBzZWxmLmFycm93VmVydGV4Q291bnQgPSAodmVydGljZXMubGVuZ3RoIC8gMikgLSBzZWxmLmFycm93T2Zmc2V0O1xuXG4gICAgLy8gQnVmZmVyIGRhdGFcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc2VsZi52ZXJ0ZXhCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzKSwgZ2wuU1RBVElDX0RSQVcpO1xuICB9KTtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgZGlzdG9ydGlvbiBwYXNzIG9uIHRoZSBpbmplY3RlZCBiYWNrYnVmZmVyLCByZW5kZXJpbmcgaXQgdG8gdGhlIHJlYWxcbiAqIGJhY2tidWZmZXIuXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW1xuICAgIGdsLkNVTExfRkFDRSxcbiAgICBnbC5ERVBUSF9URVNULFxuICAgIGdsLkJMRU5ELFxuICAgIGdsLlNDSVNTT1JfVEVTVCxcbiAgICBnbC5TVEVOQ0lMX1RFU1QsXG4gICAgZ2wuQ09MT1JfV1JJVEVNQVNLLFxuICAgIGdsLlZJRVdQT1JULFxuXG4gICAgZ2wuQ1VSUkVOVF9QUk9HUkFNLFxuICAgIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HXG4gIF07XG5cbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICAvLyBNYWtlIHN1cmUgdGhlIEdMIHN0YXRlIGlzIGluIGEgZ29vZCBwbGFjZVxuICAgIGdsLmRpc2FibGUoZ2wuQ1VMTF9GQUNFKTtcbiAgICBnbC5kaXNhYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xuICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5kaXNhYmxlKGdsLlNURU5DSUxfVEVTVCk7XG4gICAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xuICAgIGdsLnZpZXdwb3J0KDAsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgICBzZWxmLnJlbmRlck5vU3RhdGUoKTtcbiAgfSk7XG59O1xuXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUucmVuZGVyTm9TdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIC8vIEJpbmQgZGlzdG9ydGlvbiBwcm9ncmFtIGFuZCBtZXNoXG4gIGdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcblxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXIpO1xuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0aGlzLmF0dHJpYnMucG9zaXRpb24pO1xuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRoaXMuYXR0cmlicy5wb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCA4LCAwKTtcblxuICBnbC51bmlmb3JtNGYodGhpcy51bmlmb3Jtcy5jb2xvciwgMS4wLCAxLjAsIDEuMCwgMS4wKTtcblxuICBVdGlsLm9ydGhvTWF0cml4KHRoaXMucHJvak1hdCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCAwLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0LCAwLjEsIDEwMjQuMCk7XG4gIGdsLnVuaWZvcm1NYXRyaXg0ZnYodGhpcy51bmlmb3Jtcy5wcm9qZWN0aW9uTWF0LCBmYWxzZSwgdGhpcy5wcm9qTWF0KTtcblxuICAvLyBEcmF3cyBVSSBlbGVtZW50XG4gIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIDQpO1xuICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFX1NUUklQLCB0aGlzLmdlYXJPZmZzZXQsIHRoaXMuZ2VhclZlcnRleENvdW50KTtcbiAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRV9TVFJJUCwgdGhpcy5hcnJvd09mZnNldCwgdGhpcy5hcnJvd1ZlcnRleENvdW50KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FyZGJvYXJkVUk7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgQ2FyZGJvYXJkRGlzdG9ydGVyID0gcmVxdWlyZSgnLi9jYXJkYm9hcmQtZGlzdG9ydGVyLmpzJyk7XG52YXIgQ2FyZGJvYXJkVUkgPSByZXF1aXJlKCcuL2NhcmRib2FyZC11aS5qcycpO1xudmFyIERldmljZUluZm8gPSByZXF1aXJlKCcuL2RldmljZS1pbmZvLmpzJyk7XG52YXIgRHBkYiA9IHJlcXVpcmUoJy4vZHBkYi9kcGRiLmpzJyk7XG52YXIgRnVzaW9uUG9zZVNlbnNvciA9IHJlcXVpcmUoJy4vc2Vuc29yLWZ1c2lvbi9mdXNpb24tcG9zZS1zZW5zb3IuanMnKTtcbnZhciBSb3RhdGVJbnN0cnVjdGlvbnMgPSByZXF1aXJlKCcuL3JvdGF0ZS1pbnN0cnVjdGlvbnMuanMnKTtcbnZhciBWaWV3ZXJTZWxlY3RvciA9IHJlcXVpcmUoJy4vdmlld2VyLXNlbGVjdG9yLmpzJyk7XG52YXIgVlJEaXNwbGF5ID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuVlJEaXNwbGF5O1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxudmFyIEV5ZSA9IHtcbiAgTEVGVDogJ2xlZnQnLFxuICBSSUdIVDogJ3JpZ2h0J1xufTtcblxuLyoqXG4gKiBWUkRpc3BsYXkgYmFzZWQgb24gbW9iaWxlIGRldmljZSBwYXJhbWV0ZXJzIGFuZCBEZXZpY2VNb3Rpb24gQVBJcy5cbiAqL1xuZnVuY3Rpb24gQ2FyZGJvYXJkVlJEaXNwbGF5KCkge1xuICB0aGlzLmRpc3BsYXlOYW1lID0gJ0NhcmRib2FyZCBWUkRpc3BsYXkgKHdlYnZyLXBvbHlmaWxsKSc7XG5cbiAgdGhpcy5jYXBhYmlsaXRpZXMuaGFzT3JpZW50YXRpb24gPSB0cnVlO1xuICB0aGlzLmNhcGFiaWxpdGllcy5jYW5QcmVzZW50ID0gdHJ1ZTtcblxuICAvLyBcIlByaXZhdGVcIiBtZW1iZXJzLlxuICB0aGlzLmJ1ZmZlclNjYWxlXyA9IHdpbmRvdy5XZWJWUkNvbmZpZy5CVUZGRVJfU0NBTEU7XG4gIHRoaXMucG9zZVNlbnNvcl8gPSBuZXcgRnVzaW9uUG9zZVNlbnNvcigpO1xuICB0aGlzLmRpc3RvcnRlcl8gPSBudWxsO1xuICB0aGlzLmNhcmRib2FyZFVJXyA9IG51bGw7XG5cbiAgdGhpcy5kcGRiXyA9IG5ldyBEcGRiKHRydWUsIHRoaXMub25EZXZpY2VQYXJhbXNVcGRhdGVkXy5iaW5kKHRoaXMpKTtcbiAgdGhpcy5kZXZpY2VJbmZvXyA9IG5ldyBEZXZpY2VJbmZvKHRoaXMuZHBkYl8uZ2V0RGV2aWNlUGFyYW1zKCkpO1xuXG4gIHRoaXMudmlld2VyU2VsZWN0b3JfID0gbmV3IFZpZXdlclNlbGVjdG9yKCk7XG4gIHRoaXMudmlld2VyU2VsZWN0b3JfLm9uQ2hhbmdlKHRoaXMub25WaWV3ZXJDaGFuZ2VkXy5iaW5kKHRoaXMpKTtcblxuICAvLyBTZXQgdGhlIGNvcnJlY3QgaW5pdGlhbCB2aWV3ZXIuXG4gIHRoaXMuZGV2aWNlSW5mb18uc2V0Vmlld2VyKHRoaXMudmlld2VyU2VsZWN0b3JfLmdldEN1cnJlbnRWaWV3ZXIoKSk7XG5cbiAgaWYgKCF3aW5kb3cuV2ViVlJDb25maWcuUk9UQVRFX0lOU1RSVUNUSU9OU19ESVNBQkxFRCkge1xuICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXyA9IG5ldyBSb3RhdGVJbnN0cnVjdGlvbnMoKTtcbiAgfVxuXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICAvLyBMaXN0ZW4gZm9yIHJlc2l6ZSBldmVudHMgdG8gd29ya2Fyb3VuZCB0aGlzIGF3ZnVsIFNhZmFyaSBidWcuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25SZXNpemVfLmJpbmQodGhpcykpO1xuICB9XG59XG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlID0gbmV3IFZSRGlzcGxheSgpO1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmdldEltbWVkaWF0ZVBvc2UgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbjogdGhpcy5wb3NlU2Vuc29yXy5nZXRQb3NpdGlvbigpLFxuICAgIG9yaWVudGF0aW9uOiB0aGlzLnBvc2VTZW5zb3JfLmdldE9yaWVudGF0aW9uKCksXG4gICAgbGluZWFyVmVsb2NpdHk6IG51bGwsXG4gICAgbGluZWFyQWNjZWxlcmF0aW9uOiBudWxsLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbnVsbCxcbiAgICBhbmd1bGFyQWNjZWxlcmF0aW9uOiBudWxsXG4gIH07XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLnJlc2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBvc2VTZW5zb3JfLnJlc2V0UG9zZSgpO1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRFeWVQYXJhbWV0ZXJzID0gZnVuY3Rpb24od2hpY2hFeWUpIHtcbiAgdmFyIG9mZnNldCA9IFt0aGlzLmRldmljZUluZm9fLnZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAqIDAuNSwgMC4wLCAwLjBdO1xuICB2YXIgZmllbGRPZlZpZXc7XG5cbiAgLy8gVE9ETzogRm9WIGNhbiBiZSBhIGxpdHRsZSBleHBlbnNpdmUgdG8gY29tcHV0ZS4gQ2FjaGUgd2hlbiBkZXZpY2UgcGFyYW1zIGNoYW5nZS5cbiAgaWYgKHdoaWNoRXllID09IEV5ZS5MRUZUKSB7XG4gICAgb2Zmc2V0WzBdICo9IC0xLjA7XG4gICAgZmllbGRPZlZpZXcgPSB0aGlzLmRldmljZUluZm9fLmdldEZpZWxkT2ZWaWV3TGVmdEV5ZSgpO1xuICB9IGVsc2UgaWYgKHdoaWNoRXllID09IEV5ZS5SSUdIVCkge1xuICAgIGZpZWxkT2ZWaWV3ID0gdGhpcy5kZXZpY2VJbmZvXy5nZXRGaWVsZE9mVmlld1JpZ2h0RXllKCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcignSW52YWxpZCBleWUgcHJvdmlkZWQ6ICVzJywgd2hpY2hFeWUpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBmaWVsZE9mVmlldzogZmllbGRPZlZpZXcsXG4gICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgLy8gVE9ETzogU2hvdWxkIGJlIGFibGUgdG8gcHJvdmlkZSBiZXR0ZXIgdmFsdWVzIHRoYW4gdGhlc2UuXG4gICAgcmVuZGVyV2lkdGg6IHRoaXMuZGV2aWNlSW5mb18uZGV2aWNlLndpZHRoICogMC41ICogdGhpcy5idWZmZXJTY2FsZV8sXG4gICAgcmVuZGVySGVpZ2h0OiB0aGlzLmRldmljZUluZm9fLmRldmljZS5oZWlnaHQgKiB0aGlzLmJ1ZmZlclNjYWxlXyxcbiAgfTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25EZXZpY2VQYXJhbXNVcGRhdGVkXyA9IGZ1bmN0aW9uKG5ld1BhcmFtcykge1xuICBpZiAoVXRpbC5pc0RlYnVnKCkpIHtcbiAgICBjb25zb2xlLmxvZygnRFBEQiByZXBvcnRlZCB0aGF0IGRldmljZSBwYXJhbXMgd2VyZSB1cGRhdGVkLicpO1xuICB9XG4gIHRoaXMuZGV2aWNlSW5mb18udXBkYXRlRGV2aWNlUGFyYW1zKG5ld1BhcmFtcyk7XG5cbiAgaWYgKHRoaXMuZGlzdG9ydGVyXykge1xuICAgIHRoaXMuZGlzdG9ydGVyXy51cGRhdGVEZXZpY2VJbmZvKHRoaXMuZGV2aWNlSW5mb18pO1xuICB9XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLnVwZGF0ZUJvdW5kc18gPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmxheWVyXyAmJiB0aGlzLmRpc3RvcnRlcl8gJiYgKHRoaXMubGF5ZXJfLmxlZnRCb3VuZHMgfHwgdGhpcy5sYXllcl8ucmlnaHRCb3VuZHMpKSB7XG4gICAgdGhpcy5kaXN0b3J0ZXJfLnNldFRleHR1cmVCb3VuZHModGhpcy5sYXllcl8ubGVmdEJvdW5kcywgdGhpcy5sYXllcl8ucmlnaHRCb3VuZHMpO1xuICB9XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmJlZ2luUHJlc2VudF8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsJyk7XG4gIGlmICghZ2wpXG4gICAgZ2wgPSB0aGlzLmxheWVyXy5zb3VyY2UuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XG4gIGlmICghZ2wpXG4gICAgZ2wgPSB0aGlzLmxheWVyXy5zb3VyY2UuZ2V0Q29udGV4dCgnd2ViZ2wyJyk7XG5cbiAgaWYgKCFnbClcbiAgICByZXR1cm47IC8vIENhbid0IGRvIGRpc3RvcnRpb24gd2l0aG91dCBhIFdlYkdMIGNvbnRleHQuXG5cbiAgLy8gUHJvdmlkZXMgYSB3YXkgdG8gb3B0IG91dCBvZiBkaXN0b3J0aW9uXG4gIGlmICh0aGlzLmxheWVyXy5wcmVkaXN0b3J0ZWQpIHtcbiAgICBpZiAoIXdpbmRvdy5XZWJWUkNvbmZpZy5DQVJEQk9BUkRfVUlfRElTQUJMRUQpIHtcbiAgICAgIGdsLmNhbnZhcy53aWR0aCA9IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKSAqIHRoaXMuYnVmZmVyU2NhbGVfO1xuICAgICAgZ2wuY2FudmFzLmhlaWdodCA9IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCkgKiB0aGlzLmJ1ZmZlclNjYWxlXztcbiAgICAgIHRoaXMuY2FyZGJvYXJkVUlfID0gbmV3IENhcmRib2FyZFVJKGdsKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gQ3JlYXRlIGEgbmV3IGRpc3RvcnRlciBmb3IgdGhlIHRhcmdldCBjb250ZXh0XG4gICAgdGhpcy5kaXN0b3J0ZXJfID0gbmV3IENhcmRib2FyZERpc3RvcnRlcihnbCk7XG4gICAgdGhpcy5kaXN0b3J0ZXJfLnVwZGF0ZURldmljZUluZm8odGhpcy5kZXZpY2VJbmZvXyk7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8gPSB0aGlzLmRpc3RvcnRlcl8uY2FyZGJvYXJkVUk7XG4gIH1cblxuICBpZiAodGhpcy5jYXJkYm9hcmRVSV8pIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJXy5saXN0ZW4oZnVuY3Rpb24oZSkge1xuICAgICAgLy8gT3B0aW9ucyBjbGlja2VkLlxuICAgICAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uc2hvdyh0aGlzLmxheWVyXy5zb3VyY2UucGFyZW50RWxlbWVudCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0uYmluZCh0aGlzKSwgZnVuY3Rpb24oZSkge1xuICAgICAgLy8gQmFjayBjbGlja2VkLlxuICAgICAgdGhpcy5leGl0UHJlc2VudCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9XG5cbiAgaWYgKHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXykge1xuICAgIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpICYmIFV0aWwuaXNNb2JpbGUoKSkge1xuICAgICAgLy8gSW4gbGFuZHNjYXBlIG1vZGUsIHRlbXBvcmFyaWx5IHNob3cgdGhlIFwicHV0IGludG8gQ2FyZGJvYXJkXCJcbiAgICAgIC8vIGludGVyc3RpdGlhbC4gT3RoZXJ3aXNlLCBkbyB0aGUgZGVmYXVsdCB0aGluZy5cbiAgICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy5zaG93VGVtcG9yYXJpbHkoMzAwMCwgdGhpcy5sYXllcl8uc291cmNlLnBhcmVudEVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18udXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gTGlzdGVuIGZvciBvcmllbnRhdGlvbiBjaGFuZ2UgZXZlbnRzIGluIG9yZGVyIHRvIHNob3cgaW50ZXJzdGl0aWFsLlxuICB0aGlzLm9yaWVudGF0aW9uSGFuZGxlciA9IHRoaXMub25PcmllbnRhdGlvbkNoYW5nZV8uYmluZCh0aGlzKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5vcmllbnRhdGlvbkhhbmRsZXIpO1xuXG4gIC8vIExpc3RlbiBmb3IgcHJlc2VudCBkaXNwbGF5IGNoYW5nZSBldmVudHMgaW4gb3JkZXIgdG8gdXBkYXRlIGRpc3RvcnRlciBkaW1lbnNpb25zXG4gIHRoaXMudnJkaXNwbGF5cHJlc2VudGNoYW5nZUhhbmRsZXIgPSB0aGlzLnVwZGF0ZUJvdW5kc18uYmluZCh0aGlzKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheXByZXNlbnRjaGFuZ2UnLCB0aGlzLnZyZGlzcGxheXByZXNlbnRjaGFuZ2VIYW5kbGVyKTtcblxuICAvLyBGaXJlIHRoaXMgZXZlbnQgaW5pdGlhbGx5LCB0byBnaXZlIGdlb21ldHJ5LWRpc3RvcnRpb24gY2xpZW50cyB0aGUgY2hhbmNlXG4gIC8vIHRvIGRvIHNvbWV0aGluZyBjdXN0b20uXG4gIHRoaXMuZmlyZVZSRGlzcGxheURldmljZVBhcmFtc0NoYW5nZV8oKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZW5kUHJlc2VudF8gPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGlzdG9ydGVyXykge1xuICAgIHRoaXMuZGlzdG9ydGVyXy5kZXN0cm95KCk7XG4gICAgdGhpcy5kaXN0b3J0ZXJfID0gbnVsbDtcbiAgfVxuICBpZiAodGhpcy5jYXJkYm9hcmRVSV8pIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJXy5kZXN0cm95KCk7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8gPSBudWxsO1xuICB9XG5cbiAgaWYgKHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXykge1xuICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy5oaWRlKCk7XG4gIH1cbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uaGlkZSgpO1xuXG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub3JpZW50YXRpb25IYW5kbGVyKTtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheXByZXNlbnRjaGFuZ2UnLCB0aGlzLnZyZGlzcGxheXByZXNlbnRjaGFuZ2VIYW5kbGVyKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuc3VibWl0RnJhbWUgPSBmdW5jdGlvbihwb3NlKSB7XG4gIGlmICh0aGlzLmRpc3RvcnRlcl8pIHtcbiAgICB0aGlzLnVwZGF0ZUJvdW5kc18oKTtcbiAgICB0aGlzLmRpc3RvcnRlcl8uc3VibWl0RnJhbWUoKTtcbiAgfSBlbHNlIGlmICh0aGlzLmNhcmRib2FyZFVJXyAmJiB0aGlzLmxheWVyXykge1xuICAgIC8vIEhhY2sgZm9yIHByZWRpc3RvcnRlZDogdHJ1ZS5cbiAgICB2YXIgY2FudmFzID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsJykuY2FudmFzO1xuICAgIGlmIChjYW52YXMud2lkdGggIT0gdGhpcy5sYXN0V2lkdGggfHwgY2FudmFzLmhlaWdodCAhPSB0aGlzLmxhc3RIZWlnaHQpIHtcbiAgICAgIHRoaXMuY2FyZGJvYXJkVUlfLm9uUmVzaXplKCk7XG4gICAgfVxuICAgIHRoaXMubGFzdFdpZHRoID0gY2FudmFzLndpZHRoO1xuICAgIHRoaXMubGFzdEhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cbiAgICAvLyBSZW5kZXIgdGhlIENhcmRib2FyZCBVSS5cbiAgICB0aGlzLmNhcmRib2FyZFVJXy5yZW5kZXIoKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbk9yaWVudGF0aW9uQ2hhbmdlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgLy8gSGlkZSB0aGUgdmlld2VyIHNlbGVjdG9yLlxuICB0aGlzLnZpZXdlclNlbGVjdG9yXy5oaWRlKCk7XG5cbiAgLy8gVXBkYXRlIHRoZSByb3RhdGUgaW5zdHJ1Y3Rpb25zLlxuICBpZiAodGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfKSB7XG4gICAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfLnVwZGF0ZSgpO1xuICB9XG5cbiAgdGhpcy5vblJlc2l6ZV8oKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25SZXNpemVfID0gZnVuY3Rpb24oZSkge1xuICBpZiAodGhpcy5sYXllcl8pIHtcbiAgICB2YXIgZ2wgPSB0aGlzLmxheWVyXy5zb3VyY2UuZ2V0Q29udGV4dCgnd2ViZ2wnKTtcbiAgICAvLyBTaXplIHRoZSBDU1MgY2FudmFzLlxuICAgIC8vIEFkZGVkIHBhZGRpbmcgb24gcmlnaHQgYW5kIGJvdHRvbSBiZWNhdXNlIGlQaG9uZSA1IHdpbGwgbm90XG4gICAgLy8gaGlkZSB0aGUgVVJMIGJhciB1bmxlc3MgY29udGVudCBpcyBiaWdnZXIgdGhhbiB0aGUgc2NyZWVuLlxuICAgIC8vIFRoaXMgd2lsbCBub3QgYmUgdmlzaWJsZSBhcyBsb25nIGFzIHRoZSBjb250YWluZXIgZWxlbWVudCAoZS5nLiBib2R5KVxuICAgIC8vIGlzIHNldCB0byAnb3ZlcmZsb3c6IGhpZGRlbicuXG4gICAgLy8gQWRkaXRpb25hbGx5LCAnYm94LXNpemluZzogY29udGVudC1ib3gnIGVuc3VyZXMgcmVuZGVyV2lkdGggPSB3aWR0aCArIHBhZGRpbmcuXG4gICAgLy8gVGhpcyBpcyByZXF1aXJlZCB3aGVuICdib3gtc2l6aW5nOiBib3JkZXItYm94JyBpcyB1c2VkIGVsc2V3aGVyZSBpbiB0aGUgcGFnZS5cbiAgICB2YXIgY3NzUHJvcGVydGllcyA9IFtcbiAgICAgICdwb3NpdGlvbjogYWJzb2x1dGUnLFxuICAgICAgJ3RvcDogMCcsXG4gICAgICAnbGVmdDogMCcsXG4gICAgICAnd2lkdGg6ICcgKyBNYXRoLm1heChzY3JlZW4ud2lkdGgsIHNjcmVlbi5oZWlnaHQpICsgJ3B4JyxcbiAgICAgICdoZWlnaHQ6ICcgKyBNYXRoLm1pbihzY3JlZW4uaGVpZ2h0LCBzY3JlZW4ud2lkdGgpICsgJ3B4JyxcbiAgICAgICdib3JkZXI6IDAnLFxuICAgICAgJ21hcmdpbjogMCcsXG4gICAgICAncGFkZGluZzogMCAxMHB4IDEwcHggMCcsXG4gICAgICAnYm94LXNpemluZzogY29udGVudC1ib3gnLFxuICAgIF07XG4gICAgZ2wuY2FudmFzLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBjc3NQcm9wZXJ0aWVzLmpvaW4oJzsgJykgKyAnOycpO1xuXG4gICAgVXRpbC5zYWZhcmlDc3NTaXplV29ya2Fyb3VuZChnbC5jYW52YXMpO1xuICB9XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uVmlld2VyQ2hhbmdlZF8gPSBmdW5jdGlvbih2aWV3ZXIpIHtcbiAgdGhpcy5kZXZpY2VJbmZvXy5zZXRWaWV3ZXIodmlld2VyKTtcblxuICBpZiAodGhpcy5kaXN0b3J0ZXJfKSB7XG4gICAgLy8gVXBkYXRlIHRoZSBkaXN0b3J0aW9uIGFwcHJvcHJpYXRlbHkuXG4gICAgdGhpcy5kaXN0b3J0ZXJfLnVwZGF0ZURldmljZUluZm8odGhpcy5kZXZpY2VJbmZvXyk7XG4gIH1cblxuICAvLyBGaXJlIGEgbmV3IGV2ZW50IGNvbnRhaW5pbmcgdmlld2VyIGFuZCBkZXZpY2UgcGFyYW1ldGVycyBmb3IgY2xpZW50cyB0aGF0XG4gIC8vIHdhbnQgdG8gaW1wbGVtZW50IHRoZWlyIG93biBnZW9tZXRyeS1iYXNlZCBkaXN0b3J0aW9uLlxuICB0aGlzLmZpcmVWUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfKCk7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmZpcmVWUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCgndnJkaXNwbGF5ZGV2aWNlcGFyYW1zY2hhbmdlJywge1xuICAgIGRldGFpbDoge1xuICAgICAgdnJkaXNwbGF5OiB0aGlzLFxuICAgICAgZGV2aWNlSW5mbzogdGhpcy5kZXZpY2VJbmZvXyxcbiAgICB9XG4gIH0pO1xuICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcmRib2FyZFZSRGlzcGxheTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE2LCBCcmFuZG9uIEpvbmVzLlxuICogaHR0cHM6Ly9naXRodWIuY29tL3Rvamkvd2ViZ2wtdXRpbHMvYmxvYi9tYXN0ZXIvc3JjL3dnbHUtcHJlc2VydmUtc3RhdGUuanNcbiAqIExJQ0VOU0U6IGh0dHBzOi8vZ2l0aHViLmNvbS90b2ppL3dlYmdsLXV0aWxzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG5mdW5jdGlvbiBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBiaW5kaW5ncywgY2FsbGJhY2spIHtcbiAgaWYgKCFiaW5kaW5ncykge1xuICAgIGNhbGxiYWNrKGdsKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgYm91bmRWYWx1ZXMgPSBbXTtcblxuICB2YXIgYWN0aXZlVGV4dHVyZSA9IG51bGw7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYmluZGluZyA9IGJpbmRpbmdzW2ldO1xuICAgIHN3aXRjaCAoYmluZGluZykge1xuICAgICAgY2FzZSBnbC5URVhUVVJFX0JJTkRJTkdfMkQ6XG4gICAgICBjYXNlIGdsLlRFWFRVUkVfQklORElOR19DVUJFX01BUDpcbiAgICAgICAgdmFyIHRleHR1cmVVbml0ID0gYmluZGluZ3NbKytpXTtcbiAgICAgICAgaWYgKHRleHR1cmVVbml0IDwgZ2wuVEVYVFVSRTAgfHwgdGV4dHVyZVVuaXQgPiBnbC5URVhUVVJFMzEpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVEVYVFVSRV9CSU5ESU5HXzJEIG9yIFRFWFRVUkVfQklORElOR19DVUJFX01BUCBtdXN0IGJlIGZvbGxvd2VkIGJ5IGEgdmFsaWQgdGV4dHVyZSB1bml0XCIpO1xuICAgICAgICAgIGJvdW5kVmFsdWVzLnB1c2gobnVsbCwgbnVsbCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhY3RpdmVUZXh0dXJlKSB7XG4gICAgICAgICAgYWN0aXZlVGV4dHVyZSA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSk7XG4gICAgICAgIH1cbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSh0ZXh0dXJlVW5pdCk7XG4gICAgICAgIGJvdW5kVmFsdWVzLnB1c2goZ2wuZ2V0UGFyYW1ldGVyKGJpbmRpbmcpLCBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkFDVElWRV9URVhUVVJFOlxuICAgICAgICBhY3RpdmVUZXh0dXJlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKTtcbiAgICAgICAgYm91bmRWYWx1ZXMucHVzaChudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBib3VuZFZhbHVlcy5wdXNoKGdsLmdldFBhcmFtZXRlcihiaW5kaW5nKSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGNhbGxiYWNrKGdsKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tpXTtcbiAgICB2YXIgYm91bmRWYWx1ZSA9IGJvdW5kVmFsdWVzW2ldO1xuICAgIHN3aXRjaCAoYmluZGluZykge1xuICAgICAgY2FzZSBnbC5BQ1RJVkVfVEVYVFVSRTpcbiAgICAgICAgYnJlYWs7IC8vIElnbm9yZSB0aGlzIGJpbmRpbmcsIHNpbmNlIHdlIHNwZWNpYWwtY2FzZSBpdCB0byBoYXBwZW4gbGFzdC5cbiAgICAgIGNhc2UgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkc6XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkNPTE9SX0NMRUFSX1ZBTFVFOlxuICAgICAgICBnbC5jbGVhckNvbG9yKGJvdW5kVmFsdWVbMF0sIGJvdW5kVmFsdWVbMV0sIGJvdW5kVmFsdWVbMl0sIGJvdW5kVmFsdWVbM10pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQ09MT1JfV1JJVEVNQVNLOlxuICAgICAgICBnbC5jb2xvck1hc2soYm91bmRWYWx1ZVswXSwgYm91bmRWYWx1ZVsxXSwgYm91bmRWYWx1ZVsyXSwgYm91bmRWYWx1ZVszXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5DVVJSRU5UX1BST0dSQU06XG4gICAgICAgIGdsLnVzZVByb2dyYW0oYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HOlxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkZSQU1FQlVGRkVSX0JJTkRJTkc6XG4gICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5SRU5ERVJCVUZGRVJfQklORElORzpcbiAgICAgICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuVEVYVFVSRV9CSU5ESU5HXzJEOlxuICAgICAgICB2YXIgdGV4dHVyZVVuaXQgPSBiaW5kaW5nc1srK2ldO1xuICAgICAgICBpZiAodGV4dHVyZVVuaXQgPCBnbC5URVhUVVJFMCB8fCB0ZXh0dXJlVW5pdCA+IGdsLlRFWFRVUkUzMSlcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSh0ZXh0dXJlVW5pdCk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuVEVYVFVSRV9CSU5ESU5HX0NVQkVfTUFQOlxuICAgICAgICB2YXIgdGV4dHVyZVVuaXQgPSBiaW5kaW5nc1srK2ldO1xuICAgICAgICBpZiAodGV4dHVyZVVuaXQgPCBnbC5URVhUVVJFMCB8fCB0ZXh0dXJlVW5pdCA+IGdsLlRFWFRVUkUzMSlcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSh0ZXh0dXJlVW5pdCk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuVklFV1BPUlQ6XG4gICAgICAgIGdsLnZpZXdwb3J0KGJvdW5kVmFsdWVbMF0sIGJvdW5kVmFsdWVbMV0sIGJvdW5kVmFsdWVbMl0sIGJvdW5kVmFsdWVbM10pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQkxFTkQ6XG4gICAgICBjYXNlIGdsLkNVTExfRkFDRTpcbiAgICAgIGNhc2UgZ2wuREVQVEhfVEVTVDpcbiAgICAgIGNhc2UgZ2wuU0NJU1NPUl9URVNUOlxuICAgICAgY2FzZSBnbC5TVEVOQ0lMX1RFU1Q6XG4gICAgICAgIGlmIChib3VuZFZhbHVlKSB7XG4gICAgICAgICAgZ2wuZW5hYmxlKGJpbmRpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGdsLmRpc2FibGUoYmluZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmxvZyhcIk5vIEdMIHJlc3RvcmUgYmVoYXZpb3IgZm9yIDB4XCIgKyBiaW5kaW5nLnRvU3RyaW5nKDE2KSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChhY3RpdmVUZXh0dXJlKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGFjdGl2ZVRleHR1cmUpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdHTFVQcmVzZXJ2ZUdMU3RhdGU7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgRGlzdG9ydGlvbiA9IHJlcXVpcmUoJy4vZGlzdG9ydGlvbi9kaXN0b3J0aW9uLmpzJyk7XG52YXIgTWF0aFV0aWwgPSByZXF1aXJlKCcuL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gRGV2aWNlKHBhcmFtcykge1xuICB0aGlzLndpZHRoID0gcGFyYW1zLndpZHRoIHx8IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKTtcbiAgdGhpcy5oZWlnaHQgPSBwYXJhbXMuaGVpZ2h0IHx8IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCk7XG4gIHRoaXMud2lkdGhNZXRlcnMgPSBwYXJhbXMud2lkdGhNZXRlcnM7XG4gIHRoaXMuaGVpZ2h0TWV0ZXJzID0gcGFyYW1zLmhlaWdodE1ldGVycztcbiAgdGhpcy5iZXZlbE1ldGVycyA9IHBhcmFtcy5iZXZlbE1ldGVycztcbn1cblxuXG4vLyBGYWxsYmFjayBBbmRyb2lkIGRldmljZSAoYmFzZWQgb24gTmV4dXMgNSBtZWFzdXJlbWVudHMpIGZvciB1c2Ugd2hlblxuLy8gd2UgY2FuJ3QgcmVjb2duaXplIGFuIEFuZHJvaWQgZGV2aWNlLlxudmFyIERFRkFVTFRfQU5EUk9JRCA9IG5ldyBEZXZpY2Uoe1xuICB3aWR0aE1ldGVyczogMC4xMTAsXG4gIGhlaWdodE1ldGVyczogMC4wNjIsXG4gIGJldmVsTWV0ZXJzOiAwLjAwNFxufSk7XG5cbi8vIEZhbGxiYWNrIGlPUyBkZXZpY2UgKGJhc2VkIG9uIGlQaG9uZTYpIGZvciB1c2Ugd2hlblxuLy8gd2UgY2FuJ3QgcmVjb2duaXplIGFuIEFuZHJvaWQgZGV2aWNlLlxudmFyIERFRkFVTFRfSU9TID0gbmV3IERldmljZSh7XG4gIHdpZHRoTWV0ZXJzOiAwLjEwMzgsXG4gIGhlaWdodE1ldGVyczogMC4wNTg0LFxuICBiZXZlbE1ldGVyczogMC4wMDRcbn0pO1xuXG5cbnZhciBWaWV3ZXJzID0ge1xuICBDYXJkYm9hcmRWMTogbmV3IENhcmRib2FyZFZpZXdlcih7XG4gICAgaWQ6ICdDYXJkYm9hcmRWMScsXG4gICAgbGFiZWw6ICdDYXJkYm9hcmQgSS9PIDIwMTQnLFxuICAgIGZvdjogNDAsXG4gICAgaW50ZXJMZW5zRGlzdGFuY2U6IDAuMDYwLFxuICAgIGJhc2VsaW5lTGVuc0Rpc3RhbmNlOiAwLjAzNSxcbiAgICBzY3JlZW5MZW5zRGlzdGFuY2U6IDAuMDQyLFxuICAgIGRpc3RvcnRpb25Db2VmZmljaWVudHM6IFswLjQ0MSwgMC4xNTZdLFxuICAgIGludmVyc2VDb2VmZmljaWVudHM6IFstMC40NDEwMDM1LCAwLjQyNzU2MTU1LCAtMC40ODA0NDM5LCAwLjU0NjAxMzksXG4gICAgICAtMC41ODgyMTE4MywgMC41NzMzOTM4LCAtMC40ODMwMzIwMiwgMC4zMzI5OTA4MywgLTAuMTc1NzM4NDEsXG4gICAgICAwLjA2NTE3NzIsIC0wLjAxNDg4OTYzLCAwLjAwMTU1OTgzNF1cbiAgfSksXG4gIENhcmRib2FyZFYyOiBuZXcgQ2FyZGJvYXJkVmlld2VyKHtcbiAgICBpZDogJ0NhcmRib2FyZFYyJyxcbiAgICBsYWJlbDogJ0NhcmRib2FyZCBJL08gMjAxNScsXG4gICAgZm92OiA2MCxcbiAgICBpbnRlckxlbnNEaXN0YW5jZTogMC4wNjQsXG4gICAgYmFzZWxpbmVMZW5zRGlzdGFuY2U6IDAuMDM1LFxuICAgIHNjcmVlbkxlbnNEaXN0YW5jZTogMC4wMzksXG4gICAgZGlzdG9ydGlvbkNvZWZmaWNpZW50czogWzAuMzQsIDAuNTVdLFxuICAgIGludmVyc2VDb2VmZmljaWVudHM6IFstMC4zMzgzNjcwNCwgLTAuMTgxNjIxODUsIDAuODYyNjU1LCAtMS4yNDYyMDUxLFxuICAgICAgMS4wNTYwNjAyLCAtMC41ODIwODMxNywgMC4yMTYwOTA3OCwgLTAuMDU0NDQ4MjMsIDAuMDA5MTc3OTU2LFxuICAgICAgLTkuOTA0MTY5RS00LCA2LjE4MzUzNUUtNSwgLTEuNjk4MTgwM0UtNl1cbiAgfSlcbn07XG5cblxudmFyIERFRkFVTFRfTEVGVF9DRU5URVIgPSB7eDogMC41LCB5OiAwLjV9O1xudmFyIERFRkFVTFRfUklHSFRfQ0VOVEVSID0ge3g6IDAuNSwgeTogMC41fTtcblxuLyoqXG4gKiBNYW5hZ2VzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBkZXZpY2UgYW5kIHRoZSB2aWV3ZXIuXG4gKlxuICogZGV2aWNlUGFyYW1zIGluZGljYXRlcyB0aGUgcGFyYW1ldGVycyBvZiB0aGUgZGV2aWNlIHRvIHVzZSAoZ2VuZXJhbGx5XG4gKiBvYnRhaW5lZCBmcm9tIGRwZGIuZ2V0RGV2aWNlUGFyYW1zKCkpLiBDYW4gYmUgbnVsbCB0byBtZWFuIG5vIGRldmljZVxuICogcGFyYW1zIHdlcmUgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIERldmljZUluZm8oZGV2aWNlUGFyYW1zKSB7XG4gIHRoaXMudmlld2VyID0gVmlld2Vycy5DYXJkYm9hcmRWMjtcbiAgdGhpcy51cGRhdGVEZXZpY2VQYXJhbXMoZGV2aWNlUGFyYW1zKTtcbiAgdGhpcy5kaXN0b3J0aW9uID0gbmV3IERpc3RvcnRpb24odGhpcy52aWV3ZXIuZGlzdG9ydGlvbkNvZWZmaWNpZW50cyk7XG59XG5cbkRldmljZUluZm8ucHJvdG90eXBlLnVwZGF0ZURldmljZVBhcmFtcyA9IGZ1bmN0aW9uKGRldmljZVBhcmFtcykge1xuICB0aGlzLmRldmljZSA9IHRoaXMuZGV0ZXJtaW5lRGV2aWNlXyhkZXZpY2VQYXJhbXMpIHx8IHRoaXMuZGV2aWNlO1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0RGV2aWNlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmRldmljZTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLnNldFZpZXdlciA9IGZ1bmN0aW9uKHZpZXdlcikge1xuICB0aGlzLnZpZXdlciA9IHZpZXdlcjtcbiAgdGhpcy5kaXN0b3J0aW9uID0gbmV3IERpc3RvcnRpb24odGhpcy52aWV3ZXIuZGlzdG9ydGlvbkNvZWZmaWNpZW50cyk7XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5kZXRlcm1pbmVEZXZpY2VfID0gZnVuY3Rpb24oZGV2aWNlUGFyYW1zKSB7XG4gIGlmICghZGV2aWNlUGFyYW1zKSB7XG4gICAgLy8gTm8gcGFyYW1ldGVycywgc28gdXNlIGEgZGVmYXVsdC5cbiAgICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1VzaW5nIGZhbGxiYWNrIGlPUyBkZXZpY2UgbWVhc3VyZW1lbnRzLicpO1xuICAgICAgcmV0dXJuIERFRkFVTFRfSU9TO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1VzaW5nIGZhbGxiYWNrIEFuZHJvaWQgZGV2aWNlIG1lYXN1cmVtZW50cy4nKTtcbiAgICAgIHJldHVybiBERUZBVUxUX0FORFJPSUQ7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29tcHV0ZSBkZXZpY2Ugc2NyZWVuIGRpbWVuc2lvbnMgYmFzZWQgb24gZGV2aWNlUGFyYW1zLlxuICB2YXIgTUVURVJTX1BFUl9JTkNIID0gMC4wMjU0O1xuICB2YXIgbWV0ZXJzUGVyUGl4ZWxYID0gTUVURVJTX1BFUl9JTkNIIC8gZGV2aWNlUGFyYW1zLnhkcGk7XG4gIHZhciBtZXRlcnNQZXJQaXhlbFkgPSBNRVRFUlNfUEVSX0lOQ0ggLyBkZXZpY2VQYXJhbXMueWRwaTtcbiAgdmFyIHdpZHRoID0gVXRpbC5nZXRTY3JlZW5XaWR0aCgpO1xuICB2YXIgaGVpZ2h0ID0gVXRpbC5nZXRTY3JlZW5IZWlnaHQoKTtcbiAgcmV0dXJuIG5ldyBEZXZpY2Uoe1xuICAgIHdpZHRoTWV0ZXJzOiBtZXRlcnNQZXJQaXhlbFggKiB3aWR0aCxcbiAgICBoZWlnaHRNZXRlcnM6IG1ldGVyc1BlclBpeGVsWSAqIGhlaWdodCxcbiAgICBiZXZlbE1ldGVyczogZGV2aWNlUGFyYW1zLmJldmVsTW0gKiAwLjAwMSxcbiAgfSk7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgZmllbGQgb2YgdmlldyBmb3IgdGhlIGxlZnQgZXllLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXREaXN0b3J0ZWRGaWVsZE9mVmlld0xlZnRFeWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG4gIHZhciBkaXN0b3J0aW9uID0gdGhpcy5kaXN0b3J0aW9uO1xuXG4gIC8vIERldmljZS5oZWlnaHQgYW5kIGRldmljZS53aWR0aCBmb3IgZGV2aWNlIGluIHBvcnRyYWl0IG1vZGUsIHNvIHRyYW5zcG9zZS5cbiAgdmFyIGV5ZVRvU2NyZWVuRGlzdGFuY2UgPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuXG4gIHZhciBvdXRlckRpc3QgPSAoZGV2aWNlLndpZHRoTWV0ZXJzIC0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlKSAvIDI7XG4gIHZhciBpbm5lckRpc3QgPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyO1xuICB2YXIgYm90dG9tRGlzdCA9IHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycztcbiAgdmFyIHRvcERpc3QgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC0gYm90dG9tRGlzdDtcblxuICB2YXIgb3V0ZXJBbmdsZSA9IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKFxuICAgICAgZGlzdG9ydGlvbi5kaXN0b3J0KG91dGVyRGlzdCAvIGV5ZVRvU2NyZWVuRGlzdGFuY2UpKTtcbiAgdmFyIGlubmVyQW5nbGUgPSBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydChpbm5lckRpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG4gIHZhciBib3R0b21BbmdsZSA9IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKFxuICAgICAgZGlzdG9ydGlvbi5kaXN0b3J0KGJvdHRvbURpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG4gIHZhciB0b3BBbmdsZSA9IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKFxuICAgICAgZGlzdG9ydGlvbi5kaXN0b3J0KHRvcERpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBsZWZ0RGVncmVlczogTWF0aC5taW4ob3V0ZXJBbmdsZSwgdmlld2VyLmZvdiksXG4gICAgcmlnaHREZWdyZWVzOiBNYXRoLm1pbihpbm5lckFuZ2xlLCB2aWV3ZXIuZm92KSxcbiAgICBkb3duRGVncmVlczogTWF0aC5taW4oYm90dG9tQW5nbGUsIHZpZXdlci5mb3YpLFxuICAgIHVwRGVncmVlczogTWF0aC5taW4odG9wQW5nbGUsIHZpZXdlci5mb3YpXG4gIH07XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4aW11bSBGT1YgZm9yIHRoZSBsZWZ0IGV5ZSBmb3IgdGhlXG4gKiBjdXJyZW50IGRldmljZSBhbmQgc2NyZWVuIHBhcmFtZXRlcnMuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldExlZnRFeWVWaXNpYmxlVGFuQW5nbGVzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICAvLyBUYW4tYW5nbGVzIGZyb20gdGhlIG1heCBGT1YuXG4gIHZhciBmb3ZMZWZ0ID0gTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdik7XG4gIHZhciBmb3ZUb3AgPSBNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpO1xuICB2YXIgZm92UmlnaHQgPSBNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpO1xuICB2YXIgZm92Qm90dG9tID0gTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdik7XG4gIC8vIFZpZXdwb3J0IHNpemUuXG4gIHZhciBoYWxmV2lkdGggPSBkZXZpY2Uud2lkdGhNZXRlcnMgLyA0O1xuICB2YXIgaGFsZkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyAyO1xuICAvLyBWaWV3cG9ydCBjZW50ZXIsIG1lYXN1cmVkIGZyb20gbGVmdCBsZW5zIHBvc2l0aW9uLlxuICB2YXIgdmVydGljYWxMZW5zT2Zmc2V0ID0gKHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycyAtIGhhbGZIZWlnaHQpO1xuICB2YXIgY2VudGVyWCA9IHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAvIDIgLSBoYWxmV2lkdGg7XG4gIHZhciBjZW50ZXJZID0gLXZlcnRpY2FsTGVuc09mZnNldDtcbiAgdmFyIGNlbnRlclogPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICAvLyBUYW4tYW5nbGVzIG9mIHRoZSB2aWV3cG9ydCBlZGdlcywgYXMgc2VlbiB0aHJvdWdoIHRoZSBsZW5zLlxuICB2YXIgc2NyZWVuTGVmdCA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWCAtIGhhbGZXaWR0aCkgLyBjZW50ZXJaKTtcbiAgdmFyIHNjcmVlblRvcCA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWSArIGhhbGZIZWlnaHQpIC8gY2VudGVyWik7XG4gIHZhciBzY3JlZW5SaWdodCA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWCArIGhhbGZXaWR0aCkgLyBjZW50ZXJaKTtcbiAgdmFyIHNjcmVlbkJvdHRvbSA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWSAtIGhhbGZIZWlnaHQpIC8gY2VudGVyWik7XG4gIC8vIENvbXBhcmUgdGhlIHR3byBzZXRzIG9mIHRhbi1hbmdsZXMgYW5kIHRha2UgdGhlIHZhbHVlIGNsb3NlciB0byB6ZXJvIG9uIGVhY2ggc2lkZS5cbiAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gIHJlc3VsdFswXSA9IE1hdGgubWF4KGZvdkxlZnQsIHNjcmVlbkxlZnQpO1xuICByZXN1bHRbMV0gPSBNYXRoLm1pbihmb3ZUb3AsIHNjcmVlblRvcCk7XG4gIHJlc3VsdFsyXSA9IE1hdGgubWluKGZvdlJpZ2h0LCBzY3JlZW5SaWdodCk7XG4gIHJlc3VsdFszXSA9IE1hdGgubWF4KGZvdkJvdHRvbSwgc2NyZWVuQm90dG9tKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgdGFuLWFuZ2xlcyBmcm9tIHRoZSBtYXhpbXVtIEZPViBmb3IgdGhlIGxlZnQgZXllIGZvciB0aGVcbiAqIGN1cnJlbnQgZGV2aWNlIGFuZCBzY3JlZW4gcGFyYW1ldGVycywgYXNzdW1pbmcgbm8gbGVuc2VzLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRMZWZ0RXllTm9MZW5zVGFuQW5nbGVzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICB2YXIgcmVzdWx0ID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgLy8gVGFuLWFuZ2xlcyBmcm9tIHRoZSBtYXggRk9WLlxuICB2YXIgZm92TGVmdCA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdikpO1xuICB2YXIgZm92VG9wID0gZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpKTtcbiAgdmFyIGZvdlJpZ2h0ID0gZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpKTtcbiAgdmFyIGZvdkJvdHRvbSA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdikpO1xuICAvLyBWaWV3cG9ydCBzaXplLlxuICB2YXIgaGFsZldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gNDtcbiAgdmFyIGhhbGZIZWlnaHQgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC8gMjtcbiAgLy8gVmlld3BvcnQgY2VudGVyLCBtZWFzdXJlZCBmcm9tIGxlZnQgbGVucyBwb3NpdGlvbi5cbiAgdmFyIHZlcnRpY2FsTGVuc09mZnNldCA9ICh2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnMgLSBoYWxmSGVpZ2h0KTtcbiAgdmFyIGNlbnRlclggPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyIC0gaGFsZldpZHRoO1xuICB2YXIgY2VudGVyWSA9IC12ZXJ0aWNhbExlbnNPZmZzZXQ7XG4gIHZhciBjZW50ZXJaID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgLy8gVGFuLWFuZ2xlcyBvZiB0aGUgdmlld3BvcnQgZWRnZXMsIGFzIHNlZW4gdGhyb3VnaCB0aGUgbGVucy5cbiAgdmFyIHNjcmVlbkxlZnQgPSAoY2VudGVyWCAtIGhhbGZXaWR0aCkgLyBjZW50ZXJaO1xuICB2YXIgc2NyZWVuVG9wID0gKGNlbnRlclkgKyBoYWxmSGVpZ2h0KSAvIGNlbnRlclo7XG4gIHZhciBzY3JlZW5SaWdodCA9IChjZW50ZXJYICsgaGFsZldpZHRoKSAvIGNlbnRlclo7XG4gIHZhciBzY3JlZW5Cb3R0b20gPSAoY2VudGVyWSAtIGhhbGZIZWlnaHQpIC8gY2VudGVyWjtcbiAgLy8gQ29tcGFyZSB0aGUgdHdvIHNldHMgb2YgdGFuLWFuZ2xlcyBhbmQgdGFrZSB0aGUgdmFsdWUgY2xvc2VyIHRvIHplcm8gb24gZWFjaCBzaWRlLlxuICByZXN1bHRbMF0gPSBNYXRoLm1heChmb3ZMZWZ0LCBzY3JlZW5MZWZ0KTtcbiAgcmVzdWx0WzFdID0gTWF0aC5taW4oZm92VG9wLCBzY3JlZW5Ub3ApO1xuICByZXN1bHRbMl0gPSBNYXRoLm1pbihmb3ZSaWdodCwgc2NyZWVuUmlnaHQpO1xuICByZXN1bHRbM10gPSBNYXRoLm1heChmb3ZCb3R0b20sIHNjcmVlbkJvdHRvbSk7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNjcmVlbiByZWN0YW5nbGUgdmlzaWJsZSBmcm9tIHRoZSBsZWZ0IGV5ZSBmb3IgdGhlXG4gKiBjdXJyZW50IGRldmljZSBhbmQgc2NyZWVuIHBhcmFtZXRlcnMuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldExlZnRFeWVWaXNpYmxlU2NyZWVuUmVjdCA9IGZ1bmN0aW9uKHVuZGlzdG9ydGVkRnJ1c3R1bSkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcblxuICB2YXIgZGlzdCA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG4gIHZhciBleWVYID0gKGRldmljZS53aWR0aE1ldGVycyAtIHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSkgLyAyO1xuICB2YXIgZXllWSA9IHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycztcbiAgdmFyIGxlZnQgPSAodW5kaXN0b3J0ZWRGcnVzdHVtWzBdICogZGlzdCArIGV5ZVgpIC8gZGV2aWNlLndpZHRoTWV0ZXJzO1xuICB2YXIgdG9wID0gKHVuZGlzdG9ydGVkRnJ1c3R1bVsxXSAqIGRpc3QgKyBleWVZKSAvIGRldmljZS5oZWlnaHRNZXRlcnM7XG4gIHZhciByaWdodCA9ICh1bmRpc3RvcnRlZEZydXN0dW1bMl0gKiBkaXN0ICsgZXllWCkgLyBkZXZpY2Uud2lkdGhNZXRlcnM7XG4gIHZhciBib3R0b20gPSAodW5kaXN0b3J0ZWRGcnVzdHVtWzNdICogZGlzdCArIGV5ZVkpIC8gZGV2aWNlLmhlaWdodE1ldGVycztcbiAgcmV0dXJuIHtcbiAgICB4OiBsZWZ0LFxuICAgIHk6IGJvdHRvbSxcbiAgICB3aWR0aDogcmlnaHQgLSBsZWZ0LFxuICAgIGhlaWdodDogdG9wIC0gYm90dG9tXG4gIH07XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRGaWVsZE9mVmlld0xlZnRFeWUgPSBmdW5jdGlvbihvcHRfaXNVbmRpc3RvcnRlZCkge1xuICByZXR1cm4gb3B0X2lzVW5kaXN0b3J0ZWQgPyB0aGlzLmdldFVuZGlzdG9ydGVkRmllbGRPZlZpZXdMZWZ0RXllKCkgOlxuICAgICAgdGhpcy5nZXREaXN0b3J0ZWRGaWVsZE9mVmlld0xlZnRFeWUoKTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldEZpZWxkT2ZWaWV3UmlnaHRFeWUgPSBmdW5jdGlvbihvcHRfaXNVbmRpc3RvcnRlZCkge1xuICB2YXIgZm92ID0gdGhpcy5nZXRGaWVsZE9mVmlld0xlZnRFeWUob3B0X2lzVW5kaXN0b3J0ZWQpO1xuICByZXR1cm4ge1xuICAgIGxlZnREZWdyZWVzOiBmb3YucmlnaHREZWdyZWVzLFxuICAgIHJpZ2h0RGVncmVlczogZm92LmxlZnREZWdyZWVzLFxuICAgIHVwRGVncmVlczogZm92LnVwRGVncmVlcyxcbiAgICBkb3duRGVncmVlczogZm92LmRvd25EZWdyZWVzXG4gIH07XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdW5kaXN0b3J0ZWQgZmllbGQgb2YgdmlldyBmb3IgdGhlIGxlZnQgZXllLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRVbmRpc3RvcnRlZEZpZWxkT2ZWaWV3TGVmdEV5ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcCA9IHRoaXMuZ2V0VW5kaXN0b3J0ZWRQYXJhbXNfKCk7XG5cbiAgcmV0dXJuIHtcbiAgICBsZWZ0RGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC5vdXRlckRpc3QpLFxuICAgIHJpZ2h0RGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC5pbm5lckRpc3QpLFxuICAgIGRvd25EZWdyZWVzOiBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihwLmJvdHRvbURpc3QpLFxuICAgIHVwRGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC50b3BEaXN0KVxuICB9O1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0VW5kaXN0b3J0ZWRWaWV3cG9ydExlZnRFeWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHAgPSB0aGlzLmdldFVuZGlzdG9ydGVkUGFyYW1zXygpO1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcblxuICAvLyBEaXN0YW5jZXMgc3RvcmVkIGluIGxvY2FsIHZhcmlhYmxlcyBhcmUgaW4gdGFuLWFuZ2xlIHVuaXRzIHVubGVzcyBvdGhlcndpc2VcbiAgLy8gbm90ZWQuXG4gIHZhciBleWVUb1NjcmVlbkRpc3RhbmNlID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgdmFyIHNjcmVlbldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHNjcmVlbkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuICB2YXIgeFB4UGVyVGFuQW5nbGUgPSBkZXZpY2Uud2lkdGggLyBzY3JlZW5XaWR0aDtcbiAgdmFyIHlQeFBlclRhbkFuZ2xlID0gZGV2aWNlLmhlaWdodCAvIHNjcmVlbkhlaWdodDtcblxuICB2YXIgeCA9IE1hdGgucm91bmQoKHAuZXllUG9zWCAtIHAub3V0ZXJEaXN0KSAqIHhQeFBlclRhbkFuZ2xlKTtcbiAgdmFyIHkgPSBNYXRoLnJvdW5kKChwLmV5ZVBvc1kgLSBwLmJvdHRvbURpc3QpICogeVB4UGVyVGFuQW5nbGUpO1xuICByZXR1cm4ge1xuICAgIHg6IHgsXG4gICAgeTogeSxcbiAgICB3aWR0aDogTWF0aC5yb3VuZCgocC5leWVQb3NYICsgcC5pbm5lckRpc3QpICogeFB4UGVyVGFuQW5nbGUpIC0geCxcbiAgICBoZWlnaHQ6IE1hdGgucm91bmQoKHAuZXllUG9zWSArIHAudG9wRGlzdCkgKiB5UHhQZXJUYW5BbmdsZSkgLSB5XG4gIH07XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRVbmRpc3RvcnRlZFBhcmFtc18gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG4gIHZhciBkaXN0b3J0aW9uID0gdGhpcy5kaXN0b3J0aW9uO1xuXG4gIC8vIE1vc3Qgb2YgdGhlc2UgdmFyaWFibGVzIGluIHRhbi1hbmdsZSB1bml0cy5cbiAgdmFyIGV5ZVRvU2NyZWVuRGlzdGFuY2UgPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICB2YXIgaGFsZkxlbnNEaXN0YW5jZSA9IHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAvIDIgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuICB2YXIgc2NyZWVuV2lkdGggPSBkZXZpY2Uud2lkdGhNZXRlcnMgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuICB2YXIgc2NyZWVuSGVpZ2h0ID0gZGV2aWNlLmhlaWdodE1ldGVycyAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG5cbiAgdmFyIGV5ZVBvc1ggPSBzY3JlZW5XaWR0aCAvIDIgLSBoYWxmTGVuc0Rpc3RhbmNlO1xuICB2YXIgZXllUG9zWSA9ICh2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnMpIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcblxuICB2YXIgbWF4Rm92ID0gdmlld2VyLmZvdjtcbiAgdmFyIHZpZXdlck1heCA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oTWF0aFV0aWwuZGVnVG9SYWQgKiBtYXhGb3YpKTtcbiAgdmFyIG91dGVyRGlzdCA9IE1hdGgubWluKGV5ZVBvc1gsIHZpZXdlck1heCk7XG4gIHZhciBpbm5lckRpc3QgPSBNYXRoLm1pbihoYWxmTGVuc0Rpc3RhbmNlLCB2aWV3ZXJNYXgpO1xuICB2YXIgYm90dG9tRGlzdCA9IE1hdGgubWluKGV5ZVBvc1ksIHZpZXdlck1heCk7XG4gIHZhciB0b3BEaXN0ID0gTWF0aC5taW4oc2NyZWVuSGVpZ2h0IC0gZXllUG9zWSwgdmlld2VyTWF4KTtcblxuICByZXR1cm4ge1xuICAgIG91dGVyRGlzdDogb3V0ZXJEaXN0LFxuICAgIGlubmVyRGlzdDogaW5uZXJEaXN0LFxuICAgIHRvcERpc3Q6IHRvcERpc3QsXG4gICAgYm90dG9tRGlzdDogYm90dG9tRGlzdCxcbiAgICBleWVQb3NYOiBleWVQb3NYLFxuICAgIGV5ZVBvc1k6IGV5ZVBvc1lcbiAgfTtcbn07XG5cblxuZnVuY3Rpb24gQ2FyZGJvYXJkVmlld2VyKHBhcmFtcykge1xuICAvLyBBIG1hY2hpbmUgcmVhZGFibGUgSUQuXG4gIHRoaXMuaWQgPSBwYXJhbXMuaWQ7XG4gIC8vIEEgaHVtYW4gcmVhZGFibGUgbGFiZWwuXG4gIHRoaXMubGFiZWwgPSBwYXJhbXMubGFiZWw7XG5cbiAgLy8gRmllbGQgb2YgdmlldyBpbiBkZWdyZWVzIChwZXIgc2lkZSkuXG4gIHRoaXMuZm92ID0gcGFyYW1zLmZvdjtcblxuICAvLyBEaXN0YW5jZSBiZXR3ZWVuIGxlbnMgY2VudGVycyBpbiBtZXRlcnMuXG4gIHRoaXMuaW50ZXJMZW5zRGlzdGFuY2UgPSBwYXJhbXMuaW50ZXJMZW5zRGlzdGFuY2U7XG4gIC8vIERpc3RhbmNlIGJldHdlZW4gdmlld2VyIGJhc2VsaW5lIGFuZCBsZW5zIGNlbnRlciBpbiBtZXRlcnMuXG4gIHRoaXMuYmFzZWxpbmVMZW5zRGlzdGFuY2UgPSBwYXJhbXMuYmFzZWxpbmVMZW5zRGlzdGFuY2U7XG4gIC8vIFNjcmVlbi10by1sZW5zIGRpc3RhbmNlIGluIG1ldGVycy5cbiAgdGhpcy5zY3JlZW5MZW5zRGlzdGFuY2UgPSBwYXJhbXMuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuXG4gIC8vIERpc3RvcnRpb24gY29lZmZpY2llbnRzLlxuICB0aGlzLmRpc3RvcnRpb25Db2VmZmljaWVudHMgPSBwYXJhbXMuZGlzdG9ydGlvbkNvZWZmaWNpZW50cztcbiAgLy8gSW52ZXJzZSBkaXN0b3J0aW9uIGNvZWZmaWNpZW50cy5cbiAgLy8gVE9ETzogQ2FsY3VsYXRlIHRoZXNlIGZyb20gZGlzdG9ydGlvbkNvZWZmaWNpZW50cyBpbiB0aGUgZnV0dXJlLlxuICB0aGlzLmludmVyc2VDb2VmZmljaWVudHMgPSBwYXJhbXMuaW52ZXJzZUNvZWZmaWNpZW50cztcbn1cblxuLy8gRXhwb3J0IHZpZXdlciBpbmZvcm1hdGlvbi5cbkRldmljZUluZm8uVmlld2VycyA9IFZpZXdlcnM7XG5tb2R1bGUuZXhwb3J0cyA9IERldmljZUluZm87XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRGlzcGxheTtcbnZhciBITURWUkRldmljZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLkhNRFZSRGV2aWNlO1xudmFyIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5Qb3NpdGlvblNlbnNvclZSRGV2aWNlO1xuXG4vKipcbiAqIFdyYXBzIGEgVlJEaXNwbGF5IGFuZCBleHBvc2VzIGl0IGFzIGEgSE1EVlJEZXZpY2VcbiAqL1xuZnVuY3Rpb24gVlJEaXNwbGF5SE1ERGV2aWNlKGRpc3BsYXkpIHtcbiAgdGhpcy5kaXNwbGF5ID0gZGlzcGxheTtcblxuICB0aGlzLmhhcmR3YXJlVW5pdElkID0gZGlzcGxheS5kaXNwbGF5SWQ7XG4gIHRoaXMuZGV2aWNlSWQgPSAnd2VidnItcG9seWZpbGw6SE1EOicgKyBkaXNwbGF5LmRpc3BsYXlJZDtcbiAgdGhpcy5kZXZpY2VOYW1lID0gZGlzcGxheS5kaXNwbGF5TmFtZSArICcgKEhNRCknO1xufVxuVlJEaXNwbGF5SE1ERGV2aWNlLnByb3RvdHlwZSA9IG5ldyBITURWUkRldmljZSgpO1xuXG5WUkRpc3BsYXlITUREZXZpY2UucHJvdG90eXBlLmdldEV5ZVBhcmFtZXRlcnMgPSBmdW5jdGlvbih3aGljaEV5ZSkge1xuICB2YXIgZXllUGFyYW1ldGVycyA9IHRoaXMuZGlzcGxheS5nZXRFeWVQYXJhbWV0ZXJzKHdoaWNoRXllKTtcblxuICByZXR1cm4ge1xuICAgIGN1cnJlbnRGaWVsZE9mVmlldzogZXllUGFyYW1ldGVycy5maWVsZE9mVmlldyxcbiAgICBtYXhpbXVtRmllbGRPZlZpZXc6IGV5ZVBhcmFtZXRlcnMuZmllbGRPZlZpZXcsXG4gICAgbWluaW11bUZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIHJlY29tbWVuZGVkRmllbGRPZlZpZXc6IGV5ZVBhcmFtZXRlcnMuZmllbGRPZlZpZXcsXG4gICAgZXllVHJhbnNsYXRpb246IHsgeDogZXllUGFyYW1ldGVycy5vZmZzZXRbMF0sIHk6IGV5ZVBhcmFtZXRlcnMub2Zmc2V0WzFdLCB6OiBleWVQYXJhbWV0ZXJzLm9mZnNldFsyXSB9LFxuICAgIHJlbmRlclJlY3Q6IHtcbiAgICAgIHg6ICh3aGljaEV5ZSA9PSAncmlnaHQnKSA/IGV5ZVBhcmFtZXRlcnMucmVuZGVyV2lkdGggOiAwLFxuICAgICAgeTogMCxcbiAgICAgIHdpZHRoOiBleWVQYXJhbWV0ZXJzLnJlbmRlcldpZHRoLFxuICAgICAgaGVpZ2h0OiBleWVQYXJhbWV0ZXJzLnJlbmRlckhlaWdodFxuICAgIH1cbiAgfTtcbn07XG5cblZSRGlzcGxheUhNRERldmljZS5wcm90b3R5cGUuc2V0RmllbGRPZlZpZXcgPVxuICAgIGZ1bmN0aW9uKG9wdF9mb3ZMZWZ0LCBvcHRfZm92UmlnaHQsIG9wdF96TmVhciwgb3B0X3pGYXIpIHtcbiAgLy8gTm90IHN1cHBvcnRlZC4gZ2V0RXllUGFyYW1ldGVycyByZXBvcnRzIHRoYXQgdGhlIG1pbiwgbWF4LCBhbmQgcmVjb21tZW5kZWRcbiAgLy8gRm9WIGlzIGFsbCB0aGUgc2FtZSwgc28gbm8gYWRqdXN0bWVudCBjYW4gYmUgbWFkZS5cbn07XG5cbi8vIFRPRE86IE5lZWQgdG8gaG9vayByZXF1ZXN0RnVsbHNjcmVlbiB0byBzZWUgaWYgYSB3cmFwcGVkIFZSRGlzcGxheSB3YXMgcGFzc2VkXG4vLyBpbiBhcyBhbiBvcHRpb24uIElmIHNvIHdlIHNob3VsZCBwcmV2ZW50IHRoZSBkZWZhdWx0IGZ1bGxzY3JlZW4gYmVoYXZpb3IgYW5kXG4vLyBjYWxsIFZSRGlzcGxheS5yZXF1ZXN0UHJlc2VudCBpbnN0ZWFkLlxuXG4vKipcbiAqIFdyYXBzIGEgVlJEaXNwbGF5IGFuZCBleHBvc2VzIGl0IGFzIGEgUG9zaXRpb25TZW5zb3JWUkRldmljZVxuICovXG5mdW5jdGlvbiBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZShkaXNwbGF5KSB7XG4gIHRoaXMuZGlzcGxheSA9IGRpc3BsYXk7XG5cbiAgdGhpcy5oYXJkd2FyZVVuaXRJZCA9IGRpc3BsYXkuZGlzcGxheUlkO1xuICB0aGlzLmRldmljZUlkID0gJ3dlYnZyLXBvbHlmaWxsOlBvc2l0aW9uU2Vuc29yOiAnICsgZGlzcGxheS5kaXNwbGF5SWQ7XG4gIHRoaXMuZGV2aWNlTmFtZSA9IGRpc3BsYXkuZGlzcGxheU5hbWUgKyAnIChQb3NpdGlvblNlbnNvciknO1xufVxuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UucHJvdG90eXBlID0gbmV3IFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UoKTtcblxuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UucHJvdG90eXBlLmdldFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwb3NlID0gdGhpcy5kaXNwbGF5LmdldFBvc2UoKTtcbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbjogcG9zZS5wb3NpdGlvbiA/IHsgeDogcG9zZS5wb3NpdGlvblswXSwgeTogcG9zZS5wb3NpdGlvblsxXSwgejogcG9zZS5wb3NpdGlvblsyXSB9IDogbnVsbCxcbiAgICBvcmllbnRhdGlvbjogcG9zZS5vcmllbnRhdGlvbiA/IHsgeDogcG9zZS5vcmllbnRhdGlvblswXSwgeTogcG9zZS5vcmllbnRhdGlvblsxXSwgejogcG9zZS5vcmllbnRhdGlvblsyXSwgdzogcG9zZS5vcmllbnRhdGlvblszXSB9IDogbnVsbCxcbiAgICBsaW5lYXJWZWxvY2l0eTogbnVsbCxcbiAgICBsaW5lYXJBY2NlbGVyYXRpb246IG51bGwsXG4gICAgYW5ndWxhclZlbG9jaXR5OiBudWxsLFxuICAgIGFuZ3VsYXJBY2NlbGVyYXRpb246IG51bGxcbiAgfTtcbn07XG5cblZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlLnByb3RvdHlwZS5yZXNldFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnBvc2l0aW9uRGV2aWNlLnJlc2V0UG9zZSgpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cy5WUkRpc3BsYXlITUREZXZpY2UgPSBWUkRpc3BsYXlITUREZXZpY2U7XG5tb2R1bGUuZXhwb3J0cy5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZSA9IFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlO1xuXG4iLCIvKipcbiAqIFRPRE8oc211cyk6IEltcGxlbWVudCBjb2VmZmljaWVudCBpbnZlcnNpb24uXG4gKi9cbmZ1bmN0aW9uIERpc3RvcnRpb24oY29lZmZpY2llbnRzKSB7XG4gIHRoaXMuY29lZmZpY2llbnRzID0gY29lZmZpY2llbnRzO1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGludmVyc2UgZGlzdG9ydGlvbiBmb3IgYSByYWRpdXMuXG4gKiA8L3A+PHA+XG4gKiBBbGxvd3MgdG8gY29tcHV0ZSB0aGUgb3JpZ2luYWwgdW5kaXN0b3J0ZWQgcmFkaXVzIGZyb20gYSBkaXN0b3J0ZWQgb25lLlxuICogU2VlIGFsc28gZ2V0QXBwcm94aW1hdGVJbnZlcnNlRGlzdG9ydGlvbigpIGZvciBhIGZhc3RlciBidXQgcG90ZW50aWFsbHlcbiAqIGxlc3MgYWNjdXJhdGUgbWV0aG9kLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWRpdXMgRGlzdG9ydGVkIHJhZGl1cyBmcm9tIHRoZSBsZW5zIGNlbnRlciBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSB1bmRpc3RvcnRlZCByYWRpdXMgaW4gdGFuLWFuZ2xlIHVuaXRzLlxuICovXG5EaXN0b3J0aW9uLnByb3RvdHlwZS5kaXN0b3J0SW52ZXJzZSA9IGZ1bmN0aW9uKHJhZGl1cykge1xuICAvLyBTZWNhbnQgbWV0aG9kLlxuICB2YXIgcjAgPSAwO1xuICB2YXIgcjEgPSAxO1xuICB2YXIgZHIwID0gcmFkaXVzIC0gdGhpcy5kaXN0b3J0KHIwKTtcbiAgd2hpbGUgKE1hdGguYWJzKHIxIC0gcjApID4gMC4wMDAxIC8qKiAwLjFtbSAqLykge1xuICAgIHZhciBkcjEgPSByYWRpdXMgLSB0aGlzLmRpc3RvcnQocjEpO1xuICAgIHZhciByMiA9IHIxIC0gZHIxICogKChyMSAtIHIwKSAvIChkcjEgLSBkcjApKTtcbiAgICByMCA9IHIxO1xuICAgIHIxID0gcjI7XG4gICAgZHIwID0gZHIxO1xuICB9XG4gIHJldHVybiByMTtcbn07XG5cbi8qKlxuICogRGlzdG9ydHMgYSByYWRpdXMgYnkgaXRzIGRpc3RvcnRpb24gZmFjdG9yIGZyb20gdGhlIGNlbnRlciBvZiB0aGUgbGVuc2VzLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWRpdXMgUmFkaXVzIGZyb20gdGhlIGxlbnMgY2VudGVyIGluIHRhbi1hbmdsZSB1bml0cy5cbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIGRpc3RvcnRlZCByYWRpdXMgaW4gdGFuLWFuZ2xlIHVuaXRzLlxuICovXG5EaXN0b3J0aW9uLnByb3RvdHlwZS5kaXN0b3J0ID0gZnVuY3Rpb24ocmFkaXVzKSB7XG4gIHZhciByMiA9IHJhZGl1cyAqIHJhZGl1cztcbiAgdmFyIHJldCA9IDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb2VmZmljaWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICByZXQgPSByMiAqIChyZXQgKyB0aGlzLmNvZWZmaWNpZW50c1tpXSk7XG4gIH1cbiAgcmV0dXJuIChyZXQgKyAxKSAqIHJhZGl1cztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGlzdG9ydGlvbjtcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJmb3JtYXRcIjogMSxcbiAgXCJsYXN0X3VwZGF0ZWRcIjogXCIyMDE3LTA2LTAxVDIyOjMzOjQyWlwiLFxuICBcImRldmljZXNcIjogW1xuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiYXN1cy8qL05leHVzIDcvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiTmV4dXMgN1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMyMC44LFxuICAgICAgICAzMjNcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJhc3VzLyovQVNVU19aMDBBRC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJBU1VTX1owMEFEXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDAzLFxuICAgICAgICA0MDQuNlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJHb29nbGUvKi9QaXhlbCBYTC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJQaXhlbCBYTFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUzNy45LFxuICAgICAgICA1MzNcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiR29vZ2xlLyovUGl4ZWwvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiUGl4ZWxcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0MzIuNixcbiAgICAgICAgNDM2LjdcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiSFRDLyovSFRDNjQzNUxWVy8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJIVEM2NDM1TFZXXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDQ5LjcsXG4gICAgICAgIDQ0My4zXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmUgWEwvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiSFRDIE9uZSBYTFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMxNS4zLFxuICAgICAgICAzMTQuNlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJodGMvKi9OZXh1cyA5LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIk5leHVzIDlcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogMjg5LFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiSFRDLyovSFRDIE9uZSBNOS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJIVEMgT25lIE05XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDQyLjUsXG4gICAgICAgIDQ0My4zXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiSFRDLyovSFRDIE9uZV9NOC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJIVEMgT25lX004XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDQ5LjcsXG4gICAgICAgIDQ0Ny40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiSFRDLyovSFRDIE9uZS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJIVEMgT25lXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDQ3Mi44LFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkh1YXdlaS8qL05leHVzIDZQLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIk5leHVzIDZQXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNTE1LjEsXG4gICAgICAgIDUxOFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA1WC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJOZXh1cyA1WFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQyMixcbiAgICAgICAgNDE5LjlcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiTEdFLyovTEdNUzM0NS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJMR01TMzQ1XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMjIxLjcsXG4gICAgICAgIDIxOS4xXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiTEdFLyovTEctRDgwMC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJMRy1EODAwXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDIyLFxuICAgICAgICA0MjQuMVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkxHRS8qL0xHLUQ4NTAvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiTEctRDg1MFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUzNy45LFxuICAgICAgICA1NDEuOVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkxHRS8qL1ZTOTg1IDRHLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlZTOTg1IDRHXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNTM3LjksXG4gICAgICAgIDUzNS42XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkxHRS8qL05leHVzIDUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiTmV4dXMgNSBCXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDQyLjQsXG4gICAgICAgIDQ0NC44XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkxHRS8qL05leHVzIDQvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiTmV4dXMgNFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMxOS44LFxuICAgICAgICAzMTguNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJMR0UvKi9MRy1QNzY5LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkxHLVA3NjlcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyNDAuNixcbiAgICAgICAgMjQ3LjVcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiTEdFLyovTEdNUzMyMy8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJMR01TMzIzXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMjA2LjYsXG4gICAgICAgIDIwNC42XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkxHRS8qL0xHTFM5OTYvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiTEdMUzk5NlwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQwMy40LFxuICAgICAgICA0MDEuNVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJNaWNyb21heC8qLzQ1NjBNTVgvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiNDU2ME1NWFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDI0MCxcbiAgICAgICAgMjE5LjRcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiTWljcm9tYXgvKi9BMjUwLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIk1pY3JvbWF4IEEyNTBcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0ODAsXG4gICAgICAgIDQ0Ni40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIk1pY3JvbWF4LyovTWljcm9tYXggQVE0NTAxLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIk1pY3JvbWF4IEFRNDUwMVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiAyNDAsXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL0RST0lEIFJBWlIvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiRFJPSUQgUkFaUlwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDM2OC4xLFxuICAgICAgICAyNTYuN1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUODMwQy8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJYVDgzMENcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyNTQsXG4gICAgICAgIDI1NS45XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDIxLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlhUMTAyMVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDI1NCxcbiAgICAgICAgMjU2LjdcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTAyMy8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJYVDEwMjNcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyNTQsXG4gICAgICAgIDI1Ni43XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwMjgvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiWFQxMDI4XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMzI2LjYsXG4gICAgICAgIDMyNy42XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDM0LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlhUMTAzNFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMyNi42LFxuICAgICAgICAzMjguNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDUzLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlhUMTA1M1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMxNS4zLFxuICAgICAgICAzMTYuMVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTU2Mi8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJYVDE1NjJcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0MDMuNCxcbiAgICAgICAgNDAyLjdcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9OZXh1cyA2LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIk5leHVzIDYgQlwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQ5NC4zLFxuICAgICAgICA0ODkuN1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTA2My8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJYVDEwNjNcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyOTUsXG4gICAgICAgIDI5Ni42XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDY0LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlhUMTA2NFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDI5NSxcbiAgICAgICAgMjk1LjZcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTA5Mi8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJYVDEwOTJcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0MjIsXG4gICAgICAgIDQyNC4xXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwOTUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiWFQxMDk1XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDIyLFxuICAgICAgICA0MjMuNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL0c0LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIk1vdG8gRyAoNClcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogNDAxLFxuICAgICAgXCJid1wiOiA0LFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIk9uZVBsdXMvKi9BMDAwMS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJBMDAwMVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQwMy40LFxuICAgICAgICA0MDFcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiT25lUGx1cy8qL09ORSBFMTAwNS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJPTkUgRTEwMDVcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0NDIuNCxcbiAgICAgICAgNDQxLjRcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiT25lUGx1cy8qL09ORSBBMjAwNS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJPTkUgQTIwMDVcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAzOTEuOSxcbiAgICAgICAgNDA1LjRcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiT1BQTy8qL1g5MDkvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiWDkwOVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQ0Mi40LFxuICAgICAgICA0NDQuMVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkwODIvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiR1QtSTkwODJcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAxODQuNyxcbiAgICAgICAgMTg1LjRcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUczNjBQLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLUczNjBQXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMTk2LjcsXG4gICAgICAgIDIwNS40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9OZXh1cyBTLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIk5leHVzIFNcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyMzQuNSxcbiAgICAgICAgMjI5LjhcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MzAwLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkdULUk5MzAwXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMzA0LjgsXG4gICAgICAgIDMwMy45XG4gICAgICBdLFxuICAgICAgXCJid1wiOiA1LFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLVQyMzBOVS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1UMjMwTlVcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogMjE2LFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NHSC1UMzk5LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNHSC1UMzk5XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMjE3LjcsXG4gICAgICAgIDIzMS40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TR0gtTTkxOS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTR0gtTTkxOVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQ0MC44LFxuICAgICAgICA0MzcuN1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tTjkwMDUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tTjkwMDVcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAzODYuNCxcbiAgICAgICAgMzg3XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NBTVNVTkctU00tTjkwMEEvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU0FNU1VORy1TTS1OOTAwQVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDM4Ni40LFxuICAgICAgICAzODcuN1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTk1MDAvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiR1QtSTk1MDBcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0NDIuNSxcbiAgICAgICAgNDQzLjNcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTk1MDUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiR1QtSTk1MDVcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogNDM5LjQsXG4gICAgICBcImJ3XCI6IDQsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MDBGLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLUc5MDBGXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDE1LjYsXG4gICAgICAgIDQzMS42XG4gICAgICBdLFxuICAgICAgXCJid1wiOiA1LFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTAwTS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HOTAwTVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQxNS42LFxuICAgICAgICA0MzEuNlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogNSxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzgwMEYvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tRzgwMEZcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogMzI2LjgsXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MDZTLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLUc5MDZTXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNTYyLjcsXG4gICAgICAgIDU3Mi40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTMwMC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJHVC1JOTMwMFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMwNi43LFxuICAgICAgICAzMDQuOFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogNSxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tVDUzNS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1UNTM1XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMTQyLjYsXG4gICAgICAgIDEzNi40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLU45MjBDLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLU45MjBDXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNTE1LjEsXG4gICAgICAgIDUxOC40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTIwVzgvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tTjkyMFc4XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNTE1LjEsXG4gICAgICAgIDUxOC40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTMwMEkvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiR1QtSTkzMDBJXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMzA0LjgsXG4gICAgICAgIDMwNS44XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTE5NS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJHVC1JOTE5NVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDI0OS40LFxuICAgICAgICAyNTYuN1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TUEgtTDUyMC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTUEgtTDUyMFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDI0OS40LFxuICAgICAgICAyNTUuOVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU0FNU1VORy1TR0gtSTcxNy8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTQU1TVU5HLVNHSC1JNzE3XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDI4NS44LFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TUEgtRDcxMC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTUEgtRDcxMFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDIxNy43LFxuICAgICAgICAyMDQuMlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtTjcxMDAvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiR1QtTjcxMDBcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogMjY1LjEsXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NDSC1JNjA1LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNDSC1JNjA1XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDI2NS4xLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9HYWxheHkgTmV4dXMvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiR2FsYXh5IE5leHVzXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMzE1LjMsXG4gICAgICAgIDMxNC4yXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTEwSC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1OOTEwSFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUxNS4xLFxuICAgICAgICA1MThcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLU45MTBDLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLU45MTBDXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNTE1LjIsXG4gICAgICAgIDUyMC4yXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUcxMzBNLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLUcxMzBNXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMTY1LjksXG4gICAgICAgIDE2NC44XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjhJLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLUc5MjhJXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNTE1LjEsXG4gICAgICAgIDUxOC40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTIwRi8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HOTIwRlwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiA1ODAuNixcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTIwUC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HOTIwUFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUyMi41LFxuICAgICAgICA1NzdcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjVGLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLUc5MjVGXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDU4MC42LFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjVWLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLUc5MjVWXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNTIyLjUsXG4gICAgICAgIDU3Ni42XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTMwRi8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HOTMwRlwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiA1NzYuNixcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkzNUYvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tRzkzNUZcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogNTMzLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiU29ueS8qL0M2OTAzLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkM2OTAzXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDQyLjUsXG4gICAgICAgIDQ0My4zXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiU29ueS8qL0Q2NjUzLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkQ2NjUzXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDI4LjYsXG4gICAgICAgIDQyNy42XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIlNvbnkvKi9FNjY1My8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJFNjY1M1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQyOC42LFxuICAgICAgICA0MjUuN1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJTb255LyovRTY4NTMvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiRTY4NTNcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0MDMuNCxcbiAgICAgICAgNDAxLjlcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiU29ueS8qL1NHUDMyMS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTR1AzMjFcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyMjQuNyxcbiAgICAgICAgMjI0LjFcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJUQ1QvKi9BTENBVEVMIE9ORSBUT1VDSCBGaWVyY2UvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiQUxDQVRFTCBPTkUgVE9VQ0ggRmllcmNlXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMjQwLFxuICAgICAgICAyNDcuNVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJUSEwvKi90aGwgNTAwMC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJ0aGwgNTAwMFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQ4MCxcbiAgICAgICAgNDQzLjNcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiWlRFLyovWlRFIEJsYWRlIEwyLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlpURSBCbGFkZSBMMlwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiAyNDAsXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwicmVzXCI6IFtcbiAgICAgICAgICAgIDY0MCxcbiAgICAgICAgICAgIDk2MFxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMzI1LjEsXG4gICAgICAgIDMyOC40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiA0LFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJyZXNcIjogW1xuICAgICAgICAgICAgNjQwLFxuICAgICAgICAgICAgMTEzNlxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMzE3LjEsXG4gICAgICAgIDMyMC4yXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJyZXNcIjogW1xuICAgICAgICAgICAgNzUwLFxuICAgICAgICAgICAgMTMzNFxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDMyNi40LFxuICAgICAgXCJid1wiOiA0LFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJyZXNcIjogW1xuICAgICAgICAgICAgMTI0MixcbiAgICAgICAgICAgIDIyMDhcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQ1My42LFxuICAgICAgICA0NTguNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogNCxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwicmVzXCI6IFtcbiAgICAgICAgICAgIDExMjUsXG4gICAgICAgICAgICAyMDAxXG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0MTAuOSxcbiAgICAgICAgNDE1LjRcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDQsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9XG4gIF1cbn0iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBPZmZsaW5lIGNhY2hlIG9mIHRoZSBEUERCLCB0byBiZSB1c2VkIHVudGlsIHdlIGxvYWQgdGhlIG9ubGluZSBvbmUgKGFuZFxuLy8gYXMgYSBmYWxsYmFjayBpbiBjYXNlIHdlIGNhbid0IGxvYWQgdGhlIG9ubGluZSBvbmUpLlxudmFyIERQREJfQ0FDSEUgPSByZXF1aXJlKCcuL2RwZGIuanNvbicpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbi8vIE9ubGluZSBEUERCIFVSTC5cbnZhciBPTkxJTkVfRFBEQl9VUkwgPVxuICAnaHR0cHM6Ly9kcGRiLndlYnZyLnJvY2tzL2RwZGIuanNvbic7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyBkZXZpY2UgcGFyYW1ldGVycyBiYXNlZCBvbiB0aGUgRFBEQiAoRGV2aWNlIFBhcmFtZXRlciBEYXRhYmFzZSkuXG4gKiBJbml0aWFsbHksIHVzZXMgdGhlIGNhY2hlZCBEUERCIHZhbHVlcy5cbiAqXG4gKiBJZiBmZXRjaE9ubGluZSA9PSB0cnVlLCB0aGVuIHRoaXMgb2JqZWN0IHRyaWVzIHRvIGZldGNoIHRoZSBvbmxpbmUgdmVyc2lvblxuICogb2YgdGhlIERQREIgYW5kIHVwZGF0ZXMgdGhlIGRldmljZSBpbmZvIGlmIGEgYmV0dGVyIG1hdGNoIGlzIGZvdW5kLlxuICogQ2FsbHMgdGhlIG9uRGV2aWNlUGFyYW1zVXBkYXRlZCBjYWxsYmFjayB3aGVuIHRoZXJlIGlzIGFuIHVwZGF0ZSB0byB0aGVcbiAqIGRldmljZSBpbmZvcm1hdGlvbi5cbiAqL1xuZnVuY3Rpb24gRHBkYihmZXRjaE9ubGluZSwgb25EZXZpY2VQYXJhbXNVcGRhdGVkKSB7XG4gIC8vIFN0YXJ0IHdpdGggdGhlIG9mZmxpbmUgRFBEQiBjYWNoZSB3aGlsZSB3ZSBhcmUgbG9hZGluZyB0aGUgcmVhbCBvbmUuXG4gIHRoaXMuZHBkYiA9IERQREJfQ0FDSEU7XG5cbiAgLy8gQ2FsY3VsYXRlIGRldmljZSBwYXJhbXMgYmFzZWQgb24gdGhlIG9mZmxpbmUgdmVyc2lvbiBvZiB0aGUgRFBEQi5cbiAgdGhpcy5yZWNhbGN1bGF0ZURldmljZVBhcmFtc18oKTtcblxuICAvLyBYSFIgdG8gZmV0Y2ggb25saW5lIERQREIgZmlsZSwgaWYgcmVxdWVzdGVkLlxuICBpZiAoZmV0Y2hPbmxpbmUpIHtcbiAgICAvLyBTZXQgdGhlIGNhbGxiYWNrLlxuICAgIHRoaXMub25EZXZpY2VQYXJhbXNVcGRhdGVkID0gb25EZXZpY2VQYXJhbXNVcGRhdGVkO1xuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHZhciBvYmogPSB0aGlzO1xuICAgIHhoci5vcGVuKCdHRVQnLCBPTkxJTkVfRFBEQl9VUkwsIHRydWUpO1xuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICBvYmoubG9hZGluZyA9IGZhbHNlO1xuICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPD0gMjk5KSB7XG4gICAgICAgIC8vIFN1Y2Nlc3MuXG4gICAgICAgIG9iai5kcGRiID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2UpO1xuICAgICAgICBvYmoucmVjYWxjdWxhdGVEZXZpY2VQYXJhbXNfKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBFcnJvciBsb2FkaW5nIHRoZSBEUERCLlxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIG9ubGluZSBEUERCIScpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHhoci5zZW5kKCk7XG4gIH1cbn1cblxuLy8gUmV0dXJucyB0aGUgY3VycmVudCBkZXZpY2UgcGFyYW1ldGVycy5cbkRwZGIucHJvdG90eXBlLmdldERldmljZVBhcmFtcyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5kZXZpY2VQYXJhbXM7XG59O1xuXG4vLyBSZWNhbGN1bGF0ZXMgdGhpcyBkZXZpY2UncyBwYXJhbWV0ZXJzIGJhc2VkIG9uIHRoZSBEUERCLlxuRHBkYi5wcm90b3R5cGUucmVjYWxjdWxhdGVEZXZpY2VQYXJhbXNfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBuZXdEZXZpY2VQYXJhbXMgPSB0aGlzLmNhbGNEZXZpY2VQYXJhbXNfKCk7XG4gIGlmIChuZXdEZXZpY2VQYXJhbXMpIHtcbiAgICB0aGlzLmRldmljZVBhcmFtcyA9IG5ld0RldmljZVBhcmFtcztcbiAgICAvLyBJbnZva2UgY2FsbGJhY2ssIGlmIGl0IGlzIHNldC5cbiAgICBpZiAodGhpcy5vbkRldmljZVBhcmFtc1VwZGF0ZWQpIHtcbiAgICAgIHRoaXMub25EZXZpY2VQYXJhbXNVcGRhdGVkKHRoaXMuZGV2aWNlUGFyYW1zKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHJlY2FsY3VsYXRlIGRldmljZSBwYXJhbWV0ZXJzLicpO1xuICB9XG59O1xuXG4vLyBSZXR1cm5zIGEgRGV2aWNlUGFyYW1zIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGJlc3QgZ3Vlc3MgYXMgdG8gdGhpc1xuLy8gZGV2aWNlJ3MgcGFyYW1ldGVycy4gQ2FuIHJldHVybiBudWxsIGlmIHRoZSBkZXZpY2UgZG9lcyBub3QgbWF0Y2ggYW55XG4vLyBrbm93biBkZXZpY2VzLlxuRHBkYi5wcm90b3R5cGUuY2FsY0RldmljZVBhcmFtc18gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRiID0gdGhpcy5kcGRiOyAvLyBzaG9ydGhhbmRcbiAgaWYgKCFkYikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0RQREIgbm90IGF2YWlsYWJsZS4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoZGIuZm9ybWF0ICE9IDEpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEUERCIGhhcyB1bmV4cGVjdGVkIGZvcm1hdCB2ZXJzaW9uLicpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGlmICghZGIuZGV2aWNlcyB8fCAhZGIuZGV2aWNlcy5sZW5ndGgpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEUERCIGRvZXMgbm90IGhhdmUgYSBkZXZpY2VzIHNlY3Rpb24uJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBHZXQgdGhlIGFjdHVhbCB1c2VyIGFnZW50IGFuZCBzY3JlZW4gZGltZW5zaW9ucyBpbiBwaXhlbHMuXG4gIHZhciB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8IG5hdmlnYXRvci52ZW5kb3IgfHwgd2luZG93Lm9wZXJhO1xuICB2YXIgd2lkdGggPSBVdGlsLmdldFNjcmVlbldpZHRoKCk7XG4gIHZhciBoZWlnaHQgPSBVdGlsLmdldFNjcmVlbkhlaWdodCgpO1xuXG4gIGlmICghZGIuZGV2aWNlcykge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0RQREIgaGFzIG5vIGRldmljZXMgc2VjdGlvbi4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGIuZGV2aWNlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBkZXZpY2UgPSBkYi5kZXZpY2VzW2ldO1xuICAgIGlmICghZGV2aWNlLnJ1bGVzKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0RldmljZVsnICsgaSArICddIGhhcyBubyBydWxlcyBzZWN0aW9uLicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGRldmljZS50eXBlICE9ICdpb3MnICYmIGRldmljZS50eXBlICE9ICdhbmRyb2lkJykge1xuICAgICAgY29uc29sZS53YXJuKCdEZXZpY2VbJyArIGkgKyAnXSBoYXMgaW52YWxpZCB0eXBlLicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gU2VlIGlmIHRoaXMgZGV2aWNlIGlzIG9mIHRoZSBhcHByb3ByaWF0ZSB0eXBlLlxuICAgIGlmIChVdGlsLmlzSU9TKCkgIT0gKGRldmljZS50eXBlID09ICdpb3MnKSkgY29udGludWU7XG5cbiAgICAvLyBTZWUgaWYgdGhpcyBkZXZpY2UgbWF0Y2hlcyBhbnkgb2YgdGhlIHJ1bGVzOlxuICAgIHZhciBtYXRjaGVkID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBkZXZpY2UucnVsZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIHZhciBydWxlID0gZGV2aWNlLnJ1bGVzW2pdO1xuICAgICAgaWYgKHRoaXMubWF0Y2hSdWxlXyhydWxlLCB1c2VyQWdlbnQsIHdpZHRoLCBoZWlnaHQpKSB7XG4gICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFtYXRjaGVkKSBjb250aW51ZTtcblxuICAgIC8vIGRldmljZS5kcGkgbWlnaHQgYmUgYW4gYXJyYXkgb2YgWyB4ZHBpLCB5ZHBpXSBvciBqdXN0IGEgc2NhbGFyLlxuICAgIHZhciB4ZHBpID0gZGV2aWNlLmRwaVswXSB8fCBkZXZpY2UuZHBpO1xuICAgIHZhciB5ZHBpID0gZGV2aWNlLmRwaVsxXSB8fCBkZXZpY2UuZHBpO1xuXG4gICAgcmV0dXJuIG5ldyBEZXZpY2VQYXJhbXMoeyB4ZHBpOiB4ZHBpLCB5ZHBpOiB5ZHBpLCBiZXZlbE1tOiBkZXZpY2UuYncgfSk7XG4gIH1cblxuICBjb25zb2xlLndhcm4oJ05vIERQREIgZGV2aWNlIG1hdGNoLicpO1xuICByZXR1cm4gbnVsbDtcbn07XG5cbkRwZGIucHJvdG90eXBlLm1hdGNoUnVsZV8gPSBmdW5jdGlvbihydWxlLCB1YSwgc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCkge1xuICAvLyBXZSBjYW4gb25seSBtYXRjaCAndWEnIGFuZCAncmVzJyBydWxlcywgbm90IG90aGVyIHR5cGVzIGxpa2UgJ21kbWgnXG4gIC8vICh3aGljaCBhcmUgbWVhbnQgZm9yIG5hdGl2ZSBwbGF0Zm9ybXMpLlxuICBpZiAoIXJ1bGUudWEgJiYgIXJ1bGUucmVzKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gSWYgb3VyIHVzZXIgYWdlbnQgc3RyaW5nIGRvZXNuJ3QgY29udGFpbiB0aGUgaW5kaWNhdGVkIHVzZXIgYWdlbnQgc3RyaW5nLFxuICAvLyB0aGUgbWF0Y2ggZmFpbHMuXG4gIGlmIChydWxlLnVhICYmIHVhLmluZGV4T2YocnVsZS51YSkgPCAwKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gSWYgdGhlIHJ1bGUgc3BlY2lmaWVzIHNjcmVlbiBkaW1lbnNpb25zIHRoYXQgZG9uJ3QgY29ycmVzcG9uZCB0byBvdXJzLFxuICAvLyB0aGUgbWF0Y2ggZmFpbHMuXG4gIGlmIChydWxlLnJlcykge1xuICAgIGlmICghcnVsZS5yZXNbMF0gfHwgIXJ1bGUucmVzWzFdKSByZXR1cm4gZmFsc2U7XG4gICAgdmFyIHJlc1ggPSBydWxlLnJlc1swXTtcbiAgICB2YXIgcmVzWSA9IHJ1bGUucmVzWzFdO1xuICAgIC8vIENvbXBhcmUgbWluIGFuZCBtYXggc28gYXMgdG8gbWFrZSB0aGUgb3JkZXIgbm90IG1hdHRlciwgaS5lLiwgaXQgc2hvdWxkXG4gICAgLy8gYmUgdHJ1ZSB0aGF0IDY0MHg0ODAgPT0gNDgweDY0MC5cbiAgICBpZiAoTWF0aC5taW4oc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCkgIT0gTWF0aC5taW4ocmVzWCwgcmVzWSkgfHxcbiAgICAgICAgKE1hdGgubWF4KHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpICE9IE1hdGgubWF4KHJlc1gsIHJlc1kpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBEZXZpY2VQYXJhbXMocGFyYW1zKSB7XG4gIHRoaXMueGRwaSA9IHBhcmFtcy54ZHBpO1xuICB0aGlzLnlkcGkgPSBwYXJhbXMueWRwaTtcbiAgdGhpcy5iZXZlbE1tID0gcGFyYW1zLmJldmVsTW07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRHBkYjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xudmFyIFdlYlZSUG9seWZpbGwgPSByZXF1aXJlKCcuL3dlYnZyLXBvbHlmaWxsLmpzJykuV2ViVlJQb2x5ZmlsbDtcblxuLy8gSW5pdGlhbGl6ZSBhIFdlYlZSQ29uZmlnIGp1c3QgaW4gY2FzZS5cbndpbmRvdy5XZWJWUkNvbmZpZyA9IFV0aWwuZXh0ZW5kKHtcbiAgLy8gRm9yY2VzIGF2YWlsYWJpbGl0eSBvZiBWUiBtb2RlLCBldmVuIGZvciBub24tbW9iaWxlIGRldmljZXMuXG4gIEZPUkNFX0VOQUJMRV9WUjogZmFsc2UsXG5cbiAgLy8gQ29tcGxlbWVudGFyeSBmaWx0ZXIgY29lZmZpY2llbnQuIDAgZm9yIGFjY2VsZXJvbWV0ZXIsIDEgZm9yIGd5cm8uXG4gIEtfRklMVEVSOiAwLjk4LFxuXG4gIC8vIEhvdyBmYXIgaW50byB0aGUgZnV0dXJlIHRvIHByZWRpY3QgZHVyaW5nIGZhc3QgbW90aW9uIChpbiBzZWNvbmRzKS5cbiAgUFJFRElDVElPTl9USU1FX1M6IDAuMDQwLFxuXG4gIC8vIEZsYWcgdG8gZW5hYmxlIHRvdWNoIHBhbm5lci4gSW4gY2FzZSB5b3UgaGF2ZSB5b3VyIG93biB0b3VjaCBjb250cm9scy5cbiAgVE9VQ0hfUEFOTkVSX0RJU0FCTEVEOiB0cnVlLFxuXG4gIC8vIEZsYWcgdG8gZGlzYWJsZWQgdGhlIFVJIGluIFZSIE1vZGUuXG4gIENBUkRCT0FSRF9VSV9ESVNBQkxFRDogZmFsc2UsIC8vIERlZmF1bHQ6IGZhbHNlXG5cbiAgLy8gRmxhZyB0byBkaXNhYmxlIHRoZSBpbnN0cnVjdGlvbnMgdG8gcm90YXRlIHlvdXIgZGV2aWNlLlxuICBST1RBVEVfSU5TVFJVQ1RJT05TX0RJU0FCTEVEOiBmYWxzZSwgLy8gRGVmYXVsdDogZmFsc2UuXG5cbiAgLy8gRW5hYmxlIHlhdyBwYW5uaW5nIG9ubHksIGRpc2FibGluZyByb2xsIGFuZCBwaXRjaC4gVGhpcyBjYW4gYmUgdXNlZnVsXG4gIC8vIGZvciBwYW5vcmFtYXMgd2l0aCBub3RoaW5nIGludGVyZXN0aW5nIGFib3ZlIG9yIGJlbG93LlxuICBZQVdfT05MWTogZmFsc2UsXG5cbiAgLy8gVG8gZGlzYWJsZSBrZXlib2FyZCBhbmQgbW91c2UgY29udHJvbHMsIGlmIHlvdSB3YW50IHRvIHVzZSB5b3VyIG93blxuICAvLyBpbXBsZW1lbnRhdGlvbi5cbiAgTU9VU0VfS0VZQk9BUkRfQ09OVFJPTFNfRElTQUJMRUQ6IGZhbHNlLFxuXG4gIC8vIFByZXZlbnQgdGhlIHBvbHlmaWxsIGZyb20gaW5pdGlhbGl6aW5nIGltbWVkaWF0ZWx5LiBSZXF1aXJlcyB0aGUgYXBwXG4gIC8vIHRvIGNhbGwgSW5pdGlhbGl6ZVdlYlZSUG9seWZpbGwoKSBiZWZvcmUgaXQgY2FuIGJlIHVzZWQuXG4gIERFRkVSX0lOSVRJQUxJWkFUSU9OOiBmYWxzZSxcblxuICAvLyBFbmFibGUgdGhlIGRlcHJlY2F0ZWQgdmVyc2lvbiBvZiB0aGUgQVBJIChuYXZpZ2F0b3IuZ2V0VlJEZXZpY2VzKS5cbiAgRU5BQkxFX0RFUFJFQ0FURURfQVBJOiBmYWxzZSxcblxuICAvLyBTY2FsZXMgdGhlIHJlY29tbWVuZGVkIGJ1ZmZlciBzaXplIHJlcG9ydGVkIGJ5IFdlYlZSLCB3aGljaCBjYW4gaW1wcm92ZVxuICAvLyBwZXJmb3JtYW5jZS5cbiAgLy8gVVBEQVRFKDIwMTYtMDUtMDMpOiBTZXR0aW5nIHRoaXMgdG8gMC41IGJ5IGRlZmF1bHQgc2luY2UgMS4wIGRvZXMgbm90XG4gIC8vIHBlcmZvcm0gd2VsbCBvbiBtYW55IG1vYmlsZSBkZXZpY2VzLlxuICBCVUZGRVJfU0NBTEU6IDAuNSxcblxuICAvLyBBbGxvdyBWUkRpc3BsYXkuc3VibWl0RnJhbWUgdG8gY2hhbmdlIGdsIGJpbmRpbmdzLCB3aGljaCBpcyBtb3JlXG4gIC8vIGVmZmljaWVudCBpZiB0aGUgYXBwbGljYXRpb24gY29kZSB3aWxsIHJlLWJpbmQgaXRzIHJlc291cmNlcyBvbiB0aGVcbiAgLy8gbmV4dCBmcmFtZSBhbnl3YXkuIFRoaXMgaGFzIGJlZW4gc2VlbiB0byBjYXVzZSByZW5kZXJpbmcgZ2xpdGNoZXMgd2l0aFxuICAvLyBUSFJFRS5qcy5cbiAgLy8gRGlydHkgYmluZGluZ3MgaW5jbHVkZTogZ2wuRlJBTUVCVUZGRVJfQklORElORywgZ2wuQ1VSUkVOVF9QUk9HUkFNLFxuICAvLyBnbC5BUlJBWV9CVUZGRVJfQklORElORywgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVJfQklORElORyxcbiAgLy8gYW5kIGdsLlRFWFRVUkVfQklORElOR18yRCBmb3IgdGV4dHVyZSB1bml0IDAuXG4gIERJUlRZX1NVQk1JVF9GUkFNRV9CSU5ESU5HUzogZmFsc2UsXG5cbiAgLy8gV2hlbiBzZXQgdG8gdHJ1ZSwgdGhpcyB3aWxsIGNhdXNlIGEgcG9seWZpbGxlZCBWUkRpc3BsYXkgdG8gYWx3YXlzIGJlXG4gIC8vIGFwcGVuZGVkIHRvIHRoZSBsaXN0IHJldHVybmVkIGJ5IG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKCksIGV2ZW4gaWYgdGhhdFxuICAvLyBsaXN0IGluY2x1ZGVzIGEgbmF0aXZlIFZSRGlzcGxheS5cbiAgQUxXQVlTX0FQUEVORF9QT0xZRklMTF9ESVNQTEFZOiBmYWxzZSxcblxuICAvLyBUaGVyZSBhcmUgdmVyc2lvbnMgb2YgQ2hyb21lIChNNTgtTTYwPykgd2hlcmUgdGhlIG5hdGl2ZSBXZWJWUiBBUEkgZXhpc3RzLFxuICAvLyBhbmQgaW5zdGVhZCBvZiByZXR1cm5pbmcgMCBWUiBkaXNwbGF5cyB3aGVuIG5vbmUgYXJlIGRldGVjdGVkLFxuICAvLyBgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKWAncyBwcm9taXNlIG5ldmVyIHJlc29sdmVzLiBUaGlzIHJlc3VsdHNcbiAgLy8gaW4gdGhlIHBvbHlmaWxsIGhhbmdpbmcgYW5kIG5vdCBiZWluZyBhYmxlIHRvIHByb3ZpZGUgZmFsbGJhY2tcbiAgLy8gZGlzcGxheXMsIHNvIHNldCBhIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzIHRvIHN0b3Agd2FpdGluZyBmb3IgYSByZXNwb25zZVxuICAvLyBhbmQganVzdCB1c2UgcG9seWZpbGxlZCBkaXNwbGF5cy5cbiAgLy8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9NzI3OTY5XG4gIEdFVF9WUl9ESVNQTEFZU19USU1FT1VUOiAxMDAwLFxufSwgd2luZG93LldlYlZSQ29uZmlnKTtcblxuaWYgKCF3aW5kb3cuV2ViVlJDb25maWcuREVGRVJfSU5JVElBTElaQVRJT04pIHtcbiAgbmV3IFdlYlZSUG9seWZpbGwoKTtcbn0gZWxzZSB7XG4gIHdpbmRvdy5Jbml0aWFsaXplV2ViVlJQb2x5ZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBXZWJWUlBvbHlmaWxsKCk7XG4gIH1cbn1cblxud2luZG93LldlYlZSUG9seWZpbGwgPSBXZWJWUlBvbHlmaWxsO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIE1hdGhVdGlsID0gd2luZG93Lk1hdGhVdGlsIHx8IHt9O1xuXG5NYXRoVXRpbC5kZWdUb1JhZCA9IE1hdGguUEkgLyAxODA7XG5NYXRoVXRpbC5yYWRUb0RlZyA9IDE4MCAvIE1hdGguUEk7XG5cbi8vIFNvbWUgbWluaW1hbCBtYXRoIGZ1bmN0aW9uYWxpdHkgYm9ycm93ZWQgZnJvbSBUSFJFRS5NYXRoIGFuZCBzdHJpcHBlZCBkb3duXG4vLyBmb3IgdGhlIHB1cnBvc2VzIG9mIHRoaXMgbGlicmFyeS5cblxuXG5NYXRoVXRpbC5WZWN0b3IyID0gZnVuY3Rpb24gKCB4LCB5ICkge1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbn07XG5cbk1hdGhVdGlsLlZlY3RvcjIucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogTWF0aFV0aWwuVmVjdG9yMixcblxuICBzZXQ6IGZ1bmN0aW9uICggeCwgeSApIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb3B5OiBmdW5jdGlvbiAoIHYgKSB7XG4gICAgdGhpcy54ID0gdi54O1xuICAgIHRoaXMueSA9IHYueTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHN1YlZlY3RvcnM6IGZ1bmN0aW9uICggYSwgYiApIHtcbiAgICB0aGlzLnggPSBhLnggLSBiLng7XG4gICAgdGhpcy55ID0gYS55IC0gYi55O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG59O1xuXG5NYXRoVXRpbC5WZWN0b3IzID0gZnVuY3Rpb24gKCB4LCB5LCB6ICkge1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbiAgdGhpcy56ID0geiB8fCAwO1xufTtcblxuTWF0aFV0aWwuVmVjdG9yMy5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBNYXRoVXRpbC5WZWN0b3IzLFxuXG4gIHNldDogZnVuY3Rpb24gKCB4LCB5LCB6ICkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLnogPSB6O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29weTogZnVuY3Rpb24gKCB2ICkge1xuICAgIHRoaXMueCA9IHYueDtcbiAgICB0aGlzLnkgPSB2Lnk7XG4gICAgdGhpcy56ID0gdi56O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbGVuZ3RoOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIE1hdGguc3FydCggdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55ICsgdGhpcy56ICogdGhpcy56ICk7XG4gIH0sXG5cbiAgbm9ybWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNjYWxhciA9IHRoaXMubGVuZ3RoKCk7XG5cbiAgICBpZiAoIHNjYWxhciAhPT0gMCApIHtcbiAgICAgIHZhciBpbnZTY2FsYXIgPSAxIC8gc2NhbGFyO1xuXG4gICAgICB0aGlzLm11bHRpcGx5U2NhbGFyKGludlNjYWxhcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMueCA9IDA7XG4gICAgICB0aGlzLnkgPSAwO1xuICAgICAgdGhpcy56ID0gMDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBtdWx0aXBseVNjYWxhcjogZnVuY3Rpb24gKCBzY2FsYXIgKSB7XG4gICAgdGhpcy54ICo9IHNjYWxhcjtcbiAgICB0aGlzLnkgKj0gc2NhbGFyO1xuICAgIHRoaXMueiAqPSBzY2FsYXI7XG4gIH0sXG5cbiAgYXBwbHlRdWF0ZXJuaW9uOiBmdW5jdGlvbiAoIHEgKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgcXggPSBxLng7XG4gICAgdmFyIHF5ID0gcS55O1xuICAgIHZhciBxeiA9IHEuejtcbiAgICB2YXIgcXcgPSBxLnc7XG5cbiAgICAvLyBjYWxjdWxhdGUgcXVhdCAqIHZlY3RvclxuICAgIHZhciBpeCA9ICBxdyAqIHggKyBxeSAqIHogLSBxeiAqIHk7XG4gICAgdmFyIGl5ID0gIHF3ICogeSArIHF6ICogeCAtIHF4ICogejtcbiAgICB2YXIgaXogPSAgcXcgKiB6ICsgcXggKiB5IC0gcXkgKiB4O1xuICAgIHZhciBpdyA9IC0gcXggKiB4IC0gcXkgKiB5IC0gcXogKiB6O1xuXG4gICAgLy8gY2FsY3VsYXRlIHJlc3VsdCAqIGludmVyc2UgcXVhdFxuICAgIHRoaXMueCA9IGl4ICogcXcgKyBpdyAqIC0gcXggKyBpeSAqIC0gcXogLSBpeiAqIC0gcXk7XG4gICAgdGhpcy55ID0gaXkgKiBxdyArIGl3ICogLSBxeSArIGl6ICogLSBxeCAtIGl4ICogLSBxejtcbiAgICB0aGlzLnogPSBpeiAqIHF3ICsgaXcgKiAtIHF6ICsgaXggKiAtIHF5IC0gaXkgKiAtIHF4O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgZG90OiBmdW5jdGlvbiAoIHYgKSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueSArIHRoaXMueiAqIHYuejtcbiAgfSxcblxuICBjcm9zc1ZlY3RvcnM6IGZ1bmN0aW9uICggYSwgYiApIHtcbiAgICB2YXIgYXggPSBhLngsIGF5ID0gYS55LCBheiA9IGEuejtcbiAgICB2YXIgYnggPSBiLngsIGJ5ID0gYi55LCBieiA9IGIuejtcblxuICAgIHRoaXMueCA9IGF5ICogYnogLSBheiAqIGJ5O1xuICAgIHRoaXMueSA9IGF6ICogYnggLSBheCAqIGJ6O1xuICAgIHRoaXMueiA9IGF4ICogYnkgLSBheSAqIGJ4O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG59O1xuXG5NYXRoVXRpbC5RdWF0ZXJuaW9uID0gZnVuY3Rpb24gKCB4LCB5LCB6LCB3ICkge1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbiAgdGhpcy56ID0geiB8fCAwO1xuICB0aGlzLncgPSAoIHcgIT09IHVuZGVmaW5lZCApID8gdyA6IDE7XG59O1xuXG5NYXRoVXRpbC5RdWF0ZXJuaW9uLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IE1hdGhVdGlsLlF1YXRlcm5pb24sXG5cbiAgc2V0OiBmdW5jdGlvbiAoIHgsIHksIHosIHcgKSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMueiA9IHo7XG4gICAgdGhpcy53ID0gdztcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGNvcHk6IGZ1bmN0aW9uICggcXVhdGVybmlvbiApIHtcbiAgICB0aGlzLnggPSBxdWF0ZXJuaW9uLng7XG4gICAgdGhpcy55ID0gcXVhdGVybmlvbi55O1xuICAgIHRoaXMueiA9IHF1YXRlcm5pb24uejtcbiAgICB0aGlzLncgPSBxdWF0ZXJuaW9uLnc7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzZXRGcm9tRXVsZXJYWVo6IGZ1bmN0aW9uKCB4LCB5LCB6ICkge1xuICAgIHZhciBjMSA9IE1hdGguY29zKCB4IC8gMiApO1xuICAgIHZhciBjMiA9IE1hdGguY29zKCB5IC8gMiApO1xuICAgIHZhciBjMyA9IE1hdGguY29zKCB6IC8gMiApO1xuICAgIHZhciBzMSA9IE1hdGguc2luKCB4IC8gMiApO1xuICAgIHZhciBzMiA9IE1hdGguc2luKCB5IC8gMiApO1xuICAgIHZhciBzMyA9IE1hdGguc2luKCB6IC8gMiApO1xuXG4gICAgdGhpcy54ID0gczEgKiBjMiAqIGMzICsgYzEgKiBzMiAqIHMzO1xuICAgIHRoaXMueSA9IGMxICogczIgKiBjMyAtIHMxICogYzIgKiBzMztcbiAgICB0aGlzLnogPSBjMSAqIGMyICogczMgKyBzMSAqIHMyICogYzM7XG4gICAgdGhpcy53ID0gYzEgKiBjMiAqIGMzIC0gczEgKiBzMiAqIHMzO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0RnJvbUV1bGVyWVhaOiBmdW5jdGlvbiggeCwgeSwgeiApIHtcbiAgICB2YXIgYzEgPSBNYXRoLmNvcyggeCAvIDIgKTtcbiAgICB2YXIgYzIgPSBNYXRoLmNvcyggeSAvIDIgKTtcbiAgICB2YXIgYzMgPSBNYXRoLmNvcyggeiAvIDIgKTtcbiAgICB2YXIgczEgPSBNYXRoLnNpbiggeCAvIDIgKTtcbiAgICB2YXIgczIgPSBNYXRoLnNpbiggeSAvIDIgKTtcbiAgICB2YXIgczMgPSBNYXRoLnNpbiggeiAvIDIgKTtcblxuICAgIHRoaXMueCA9IHMxICogYzIgKiBjMyArIGMxICogczIgKiBzMztcbiAgICB0aGlzLnkgPSBjMSAqIHMyICogYzMgLSBzMSAqIGMyICogczM7XG4gICAgdGhpcy56ID0gYzEgKiBjMiAqIHMzIC0gczEgKiBzMiAqIGMzO1xuICAgIHRoaXMudyA9IGMxICogYzIgKiBjMyArIHMxICogczIgKiBzMztcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNldEZyb21BeGlzQW5nbGU6IGZ1bmN0aW9uICggYXhpcywgYW5nbGUgKSB7XG4gICAgLy8gaHR0cDovL3d3dy5ldWNsaWRlYW5zcGFjZS5jb20vbWF0aHMvZ2VvbWV0cnkvcm90YXRpb25zL2NvbnZlcnNpb25zL2FuZ2xlVG9RdWF0ZXJuaW9uL2luZGV4Lmh0bVxuICAgIC8vIGFzc3VtZXMgYXhpcyBpcyBub3JtYWxpemVkXG5cbiAgICB2YXIgaGFsZkFuZ2xlID0gYW5nbGUgLyAyLCBzID0gTWF0aC5zaW4oIGhhbGZBbmdsZSApO1xuXG4gICAgdGhpcy54ID0gYXhpcy54ICogcztcbiAgICB0aGlzLnkgPSBheGlzLnkgKiBzO1xuICAgIHRoaXMueiA9IGF4aXMueiAqIHM7XG4gICAgdGhpcy53ID0gTWF0aC5jb3MoIGhhbGZBbmdsZSApO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbXVsdGlwbHk6IGZ1bmN0aW9uICggcSApIHtcbiAgICByZXR1cm4gdGhpcy5tdWx0aXBseVF1YXRlcm5pb25zKCB0aGlzLCBxICk7XG4gIH0sXG5cbiAgbXVsdGlwbHlRdWF0ZXJuaW9uczogZnVuY3Rpb24gKCBhLCBiICkge1xuICAgIC8vIGZyb20gaHR0cDovL3d3dy5ldWNsaWRlYW5zcGFjZS5jb20vbWF0aHMvYWxnZWJyYS9yZWFsTm9ybWVkQWxnZWJyYS9xdWF0ZXJuaW9ucy9jb2RlL2luZGV4Lmh0bVxuXG4gICAgdmFyIHFheCA9IGEueCwgcWF5ID0gYS55LCBxYXogPSBhLnosIHFhdyA9IGEudztcbiAgICB2YXIgcWJ4ID0gYi54LCBxYnkgPSBiLnksIHFieiA9IGIueiwgcWJ3ID0gYi53O1xuXG4gICAgdGhpcy54ID0gcWF4ICogcWJ3ICsgcWF3ICogcWJ4ICsgcWF5ICogcWJ6IC0gcWF6ICogcWJ5O1xuICAgIHRoaXMueSA9IHFheSAqIHFidyArIHFhdyAqIHFieSArIHFheiAqIHFieCAtIHFheCAqIHFiejtcbiAgICB0aGlzLnogPSBxYXogKiBxYncgKyBxYXcgKiBxYnogKyBxYXggKiBxYnkgLSBxYXkgKiBxYng7XG4gICAgdGhpcy53ID0gcWF3ICogcWJ3IC0gcWF4ICogcWJ4IC0gcWF5ICogcWJ5IC0gcWF6ICogcWJ6O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgaW52ZXJzZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMueCAqPSAtMTtcbiAgICB0aGlzLnkgKj0gLTE7XG4gICAgdGhpcy56ICo9IC0xO1xuXG4gICAgdGhpcy5ub3JtYWxpemUoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG5vcm1hbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBsID0gTWF0aC5zcXJ0KCB0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkgKyB0aGlzLnogKiB0aGlzLnogKyB0aGlzLncgKiB0aGlzLncgKTtcblxuICAgIGlmICggbCA9PT0gMCApIHtcbiAgICAgIHRoaXMueCA9IDA7XG4gICAgICB0aGlzLnkgPSAwO1xuICAgICAgdGhpcy56ID0gMDtcbiAgICAgIHRoaXMudyA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGwgPSAxIC8gbDtcblxuICAgICAgdGhpcy54ID0gdGhpcy54ICogbDtcbiAgICAgIHRoaXMueSA9IHRoaXMueSAqIGw7XG4gICAgICB0aGlzLnogPSB0aGlzLnogKiBsO1xuICAgICAgdGhpcy53ID0gdGhpcy53ICogbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzbGVycDogZnVuY3Rpb24gKCBxYiwgdCApIHtcbiAgICBpZiAoIHQgPT09IDAgKSByZXR1cm4gdGhpcztcbiAgICBpZiAoIHQgPT09IDEgKSByZXR1cm4gdGhpcy5jb3B5KCBxYiApO1xuXG4gICAgdmFyIHggPSB0aGlzLngsIHkgPSB0aGlzLnksIHogPSB0aGlzLnosIHcgPSB0aGlzLnc7XG5cbiAgICAvLyBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9hbGdlYnJhL3JlYWxOb3JtZWRBbGdlYnJhL3F1YXRlcm5pb25zL3NsZXJwL1xuXG4gICAgdmFyIGNvc0hhbGZUaGV0YSA9IHcgKiBxYi53ICsgeCAqIHFiLnggKyB5ICogcWIueSArIHogKiBxYi56O1xuXG4gICAgaWYgKCBjb3NIYWxmVGhldGEgPCAwICkge1xuICAgICAgdGhpcy53ID0gLSBxYi53O1xuICAgICAgdGhpcy54ID0gLSBxYi54O1xuICAgICAgdGhpcy55ID0gLSBxYi55O1xuICAgICAgdGhpcy56ID0gLSBxYi56O1xuXG4gICAgICBjb3NIYWxmVGhldGEgPSAtIGNvc0hhbGZUaGV0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb3B5KCBxYiApO1xuICAgIH1cblxuICAgIGlmICggY29zSGFsZlRoZXRhID49IDEuMCApIHtcbiAgICAgIHRoaXMudyA9IHc7XG4gICAgICB0aGlzLnggPSB4O1xuICAgICAgdGhpcy55ID0geTtcbiAgICAgIHRoaXMueiA9IHo7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciBoYWxmVGhldGEgPSBNYXRoLmFjb3MoIGNvc0hhbGZUaGV0YSApO1xuICAgIHZhciBzaW5IYWxmVGhldGEgPSBNYXRoLnNxcnQoIDEuMCAtIGNvc0hhbGZUaGV0YSAqIGNvc0hhbGZUaGV0YSApO1xuXG4gICAgaWYgKCBNYXRoLmFicyggc2luSGFsZlRoZXRhICkgPCAwLjAwMSApIHtcbiAgICAgIHRoaXMudyA9IDAuNSAqICggdyArIHRoaXMudyApO1xuICAgICAgdGhpcy54ID0gMC41ICogKCB4ICsgdGhpcy54ICk7XG4gICAgICB0aGlzLnkgPSAwLjUgKiAoIHkgKyB0aGlzLnkgKTtcbiAgICAgIHRoaXMueiA9IDAuNSAqICggeiArIHRoaXMueiApO1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB2YXIgcmF0aW9BID0gTWF0aC5zaW4oICggMSAtIHQgKSAqIGhhbGZUaGV0YSApIC8gc2luSGFsZlRoZXRhLFxuICAgIHJhdGlvQiA9IE1hdGguc2luKCB0ICogaGFsZlRoZXRhICkgLyBzaW5IYWxmVGhldGE7XG5cbiAgICB0aGlzLncgPSAoIHcgKiByYXRpb0EgKyB0aGlzLncgKiByYXRpb0IgKTtcbiAgICB0aGlzLnggPSAoIHggKiByYXRpb0EgKyB0aGlzLnggKiByYXRpb0IgKTtcbiAgICB0aGlzLnkgPSAoIHkgKiByYXRpb0EgKyB0aGlzLnkgKiByYXRpb0IgKTtcbiAgICB0aGlzLnogPSAoIHogKiByYXRpb0EgKyB0aGlzLnogKiByYXRpb0IgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNldEZyb21Vbml0VmVjdG9yczogZnVuY3Rpb24gKCkge1xuICAgIC8vIGh0dHA6Ly9sb2xlbmdpbmUubmV0L2Jsb2cvMjAxNC8wMi8yNC9xdWF0ZXJuaW9uLWZyb20tdHdvLXZlY3RvcnMtZmluYWxcbiAgICAvLyBhc3N1bWVzIGRpcmVjdGlvbiB2ZWN0b3JzIHZGcm9tIGFuZCB2VG8gYXJlIG5vcm1hbGl6ZWRcblxuICAgIHZhciB2MSwgcjtcbiAgICB2YXIgRVBTID0gMC4wMDAwMDE7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCB2RnJvbSwgdlRvICkge1xuICAgICAgaWYgKCB2MSA9PT0gdW5kZWZpbmVkICkgdjEgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuXG4gICAgICByID0gdkZyb20uZG90KCB2VG8gKSArIDE7XG5cbiAgICAgIGlmICggciA8IEVQUyApIHtcbiAgICAgICAgciA9IDA7XG5cbiAgICAgICAgaWYgKCBNYXRoLmFicyggdkZyb20ueCApID4gTWF0aC5hYnMoIHZGcm9tLnogKSApIHtcbiAgICAgICAgICB2MS5zZXQoIC0gdkZyb20ueSwgdkZyb20ueCwgMCApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHYxLnNldCggMCwgLSB2RnJvbS56LCB2RnJvbS55ICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHYxLmNyb3NzVmVjdG9ycyggdkZyb20sIHZUbyApO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnggPSB2MS54O1xuICAgICAgdGhpcy55ID0gdjEueTtcbiAgICAgIHRoaXMueiA9IHYxLno7XG4gICAgICB0aGlzLncgPSByO1xuXG4gICAgICB0aGlzLm5vcm1hbGl6ZSgpO1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0oKSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWF0aFV0aWw7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVlJEaXNwbGF5ID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuVlJEaXNwbGF5O1xudmFyIE1hdGhVdGlsID0gcmVxdWlyZSgnLi9tYXRoLXV0aWwuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbi8vIEhvdyBtdWNoIHRvIHJvdGF0ZSBwZXIga2V5IHN0cm9rZS5cbnZhciBLRVlfU1BFRUQgPSAwLjE1O1xudmFyIEtFWV9BTklNQVRJT05fRFVSQVRJT04gPSA4MDtcblxuLy8gSG93IG11Y2ggdG8gcm90YXRlIGZvciBtb3VzZSBldmVudHMuXG52YXIgTU9VU0VfU1BFRURfWCA9IDAuNTtcbnZhciBNT1VTRV9TUEVFRF9ZID0gMC4zO1xuXG4vKipcbiAqIFZSRGlzcGxheSBiYXNlZCBvbiBtb3VzZSBhbmQga2V5Ym9hcmQgaW5wdXQuIERlc2lnbmVkIGZvciBkZXNrdG9wcy9sYXB0b3BzXG4gKiB3aGVyZSBvcmllbnRhdGlvbiBldmVudHMgYXJlbid0IHN1cHBvcnRlZC4gQ2Fubm90IHByZXNlbnQuXG4gKi9cbmZ1bmN0aW9uIE1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkoKSB7XG4gIHRoaXMuZGlzcGxheU5hbWUgPSAnTW91c2UgYW5kIEtleWJvYXJkIFZSRGlzcGxheSAod2VidnItcG9seWZpbGwpJztcblxuICB0aGlzLmNhcGFiaWxpdGllcy5oYXNPcmllbnRhdGlvbiA9IHRydWU7XG5cbiAgLy8gQXR0YWNoIHRvIG1vdXNlIGFuZCBrZXlib2FyZCBldmVudHMuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleURvd25fLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZV8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2VEb3duXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2VVcF8uYmluZCh0aGlzKSk7XG5cbiAgLy8gXCJQcml2YXRlXCIgbWVtYmVycy5cbiAgdGhpcy5waGlfID0gMDtcbiAgdGhpcy50aGV0YV8gPSAwO1xuXG4gIC8vIFZhcmlhYmxlcyBmb3Iga2V5Ym9hcmQtYmFzZWQgcm90YXRpb24gYW5pbWF0aW9uLlxuICB0aGlzLnRhcmdldEFuZ2xlXyA9IG51bGw7XG4gIHRoaXMuYW5nbGVBbmltYXRpb25fID0gbnVsbDtcblxuICAvLyBTdGF0ZSB2YXJpYWJsZXMgZm9yIGNhbGN1bGF0aW9ucy5cbiAgdGhpcy5vcmllbnRhdGlvbl8gPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuXG4gIC8vIFZhcmlhYmxlcyBmb3IgbW91c2UtYmFzZWQgcm90YXRpb24uXG4gIHRoaXMucm90YXRlU3RhcnRfID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5yb3RhdGVFbmRfID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5yb3RhdGVEZWx0YV8gPSBuZXcgTWF0aFV0aWwuVmVjdG9yMigpO1xuICB0aGlzLmlzRHJhZ2dpbmdfID0gZmFsc2U7XG5cbiAgdGhpcy5vcmllbnRhdGlvbk91dF8gPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xufVxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUgPSBuZXcgVlJEaXNwbGF5KCk7XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmdldEltbWVkaWF0ZVBvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vcmllbnRhdGlvbl8uc2V0RnJvbUV1bGVyWVhaKHRoaXMucGhpXywgdGhpcy50aGV0YV8sIDApO1xuXG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzBdID0gdGhpcy5vcmllbnRhdGlvbl8ueDtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMV0gPSB0aGlzLm9yaWVudGF0aW9uXy55O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1syXSA9IHRoaXMub3JpZW50YXRpb25fLno7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzNdID0gdGhpcy5vcmllbnRhdGlvbl8udztcblxuICByZXR1cm4ge1xuICAgIHBvc2l0aW9uOiBudWxsLFxuICAgIG9yaWVudGF0aW9uOiB0aGlzLm9yaWVudGF0aW9uT3V0XyxcbiAgICBsaW5lYXJWZWxvY2l0eTogbnVsbCxcbiAgICBsaW5lYXJBY2NlbGVyYXRpb246IG51bGwsXG4gICAgYW5ndWxhclZlbG9jaXR5OiBudWxsLFxuICAgIGFuZ3VsYXJBY2NlbGVyYXRpb246IG51bGxcbiAgfTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uS2V5RG93bl8gPSBmdW5jdGlvbihlKSB7XG4gIC8vIFRyYWNrIFdBU0QgYW5kIGFycm93IGtleXMuXG4gIGlmIChlLmtleUNvZGUgPT0gMzgpIHsgLy8gVXAga2V5LlxuICAgIHRoaXMuYW5pbWF0ZVBoaV8odGhpcy5waGlfICsgS0VZX1NQRUVEKTtcbiAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT0gMzkpIHsgLy8gUmlnaHQga2V5LlxuICAgIHRoaXMuYW5pbWF0ZVRoZXRhXyh0aGlzLnRoZXRhXyAtIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDQwKSB7IC8vIERvd24ga2V5LlxuICAgIHRoaXMuYW5pbWF0ZVBoaV8odGhpcy5waGlfIC0gS0VZX1NQRUVEKTtcbiAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT0gMzcpIHsgLy8gTGVmdCBrZXkuXG4gICAgdGhpcy5hbmltYXRlVGhldGFfKHRoaXMudGhldGFfICsgS0VZX1NQRUVEKTtcbiAgfVxufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuYW5pbWF0ZVRoZXRhXyA9IGZ1bmN0aW9uKHRhcmdldEFuZ2xlKSB7XG4gIHRoaXMuYW5pbWF0ZUtleVRyYW5zaXRpb25zXygndGhldGFfJywgdGFyZ2V0QW5nbGUpO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuYW5pbWF0ZVBoaV8gPSBmdW5jdGlvbih0YXJnZXRBbmdsZSkge1xuICAvLyBQcmV2ZW50IGxvb2tpbmcgdG9vIGZhciB1cCBvciBkb3duLlxuICB0YXJnZXRBbmdsZSA9IFV0aWwuY2xhbXAodGFyZ2V0QW5nbGUsIC1NYXRoLlBJLzIsIE1hdGguUEkvMik7XG4gIHRoaXMuYW5pbWF0ZUtleVRyYW5zaXRpb25zXygncGhpXycsIHRhcmdldEFuZ2xlKTtcbn07XG5cbi8qKlxuICogU3RhcnQgYW4gYW5pbWF0aW9uIHRvIHRyYW5zaXRpb24gYW4gYW5nbGUgZnJvbSBvbmUgdmFsdWUgdG8gYW5vdGhlci5cbiAqL1xuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuYW5pbWF0ZUtleVRyYW5zaXRpb25zXyA9IGZ1bmN0aW9uKGFuZ2xlTmFtZSwgdGFyZ2V0QW5nbGUpIHtcbiAgLy8gSWYgYW4gYW5pbWF0aW9uIGlzIGN1cnJlbnRseSBydW5uaW5nLCBjYW5jZWwgaXQuXG4gIGlmICh0aGlzLmFuZ2xlQW5pbWF0aW9uXykge1xuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuYW5nbGVBbmltYXRpb25fKTtcbiAgfVxuICB2YXIgc3RhcnRBbmdsZSA9IHRoaXNbYW5nbGVOYW1lXTtcbiAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gIC8vIFNldCB1cCBhbiBpbnRlcnZhbCB0aW1lciB0byBwZXJmb3JtIHRoZSBhbmltYXRpb24uXG4gIHRoaXMuYW5nbGVBbmltYXRpb25fID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uIGFuaW1hdGUoKSB7XG4gICAgLy8gT25jZSB3ZSdyZSBmaW5pc2hlZCB0aGUgYW5pbWF0aW9uLCB3ZSdyZSBkb25lLlxuICAgIHZhciBlbGFwc2VkID0gbmV3IERhdGUoKSAtIHN0YXJ0VGltZTtcbiAgICBpZiAoZWxhcHNlZCA+PSBLRVlfQU5JTUFUSU9OX0RVUkFUSU9OKSB7XG4gICAgICB0aGlzW2FuZ2xlTmFtZV0gPSB0YXJnZXRBbmdsZTtcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuYW5nbGVBbmltYXRpb25fKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gbG9vcCB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHRoaXMuYW5nbGVBbmltYXRpb25fID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUuYmluZCh0aGlzKSlcbiAgICAvLyBMaW5lYXJseSBpbnRlcnBvbGF0ZSB0aGUgYW5nbGUgc29tZSBhbW91bnQuXG4gICAgdmFyIHBlcmNlbnQgPSBlbGFwc2VkIC8gS0VZX0FOSU1BVElPTl9EVVJBVElPTjtcbiAgICB0aGlzW2FuZ2xlTmFtZV0gPSBzdGFydEFuZ2xlICsgKHRhcmdldEFuZ2xlIC0gc3RhcnRBbmdsZSkgKiBwZXJjZW50O1xuICB9LmJpbmQodGhpcykpO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25Nb3VzZURvd25fID0gZnVuY3Rpb24oZSkge1xuICB0aGlzLnJvdGF0ZVN0YXJ0Xy5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICB0aGlzLmlzRHJhZ2dpbmdfID0gdHJ1ZTtcbn07XG5cbi8vIFZlcnkgc2ltaWxhciB0byBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9tcmZsaXgvODM1MTAyMFxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25Nb3VzZU1vdmVfID0gZnVuY3Rpb24oZSkge1xuICBpZiAoIXRoaXMuaXNEcmFnZ2luZ18gJiYgIXRoaXMuaXNQb2ludGVyTG9ja2VkXygpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIFN1cHBvcnQgcG9pbnRlciBsb2NrIEFQSS5cbiAgaWYgKHRoaXMuaXNQb2ludGVyTG9ja2VkXygpKSB7XG4gICAgdmFyIG1vdmVtZW50WCA9IGUubW92ZW1lbnRYIHx8IGUubW96TW92ZW1lbnRYIHx8IDA7XG4gICAgdmFyIG1vdmVtZW50WSA9IGUubW92ZW1lbnRZIHx8IGUubW96TW92ZW1lbnRZIHx8IDA7XG4gICAgdGhpcy5yb3RhdGVFbmRfLnNldCh0aGlzLnJvdGF0ZVN0YXJ0Xy54IC0gbW92ZW1lbnRYLCB0aGlzLnJvdGF0ZVN0YXJ0Xy55IC0gbW92ZW1lbnRZKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnJvdGF0ZUVuZF8uc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgfVxuICAvLyBDYWxjdWxhdGUgaG93IG11Y2ggd2UgbW92ZWQgaW4gbW91c2Ugc3BhY2UuXG4gIHRoaXMucm90YXRlRGVsdGFfLnN1YlZlY3RvcnModGhpcy5yb3RhdGVFbmRfLCB0aGlzLnJvdGF0ZVN0YXJ0Xyk7XG4gIHRoaXMucm90YXRlU3RhcnRfLmNvcHkodGhpcy5yb3RhdGVFbmRfKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIHRoZSBjdW11bGF0aXZlIGV1bGVyIGFuZ2xlcy5cbiAgdGhpcy5waGlfICs9IDIgKiBNYXRoLlBJICogdGhpcy5yb3RhdGVEZWx0YV8ueSAvIHNjcmVlbi5oZWlnaHQgKiBNT1VTRV9TUEVFRF9ZO1xuICB0aGlzLnRoZXRhXyArPSAyICogTWF0aC5QSSAqIHRoaXMucm90YXRlRGVsdGFfLnggLyBzY3JlZW4ud2lkdGggKiBNT1VTRV9TUEVFRF9YO1xuXG4gIC8vIFByZXZlbnQgbG9va2luZyB0b28gZmFyIHVwIG9yIGRvd24uXG4gIHRoaXMucGhpXyA9IFV0aWwuY2xhbXAodGhpcy5waGlfLCAtTWF0aC5QSS8yLCBNYXRoLlBJLzIpO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25Nb3VzZVVwXyA9IGZ1bmN0aW9uKGUpIHtcbiAgdGhpcy5pc0RyYWdnaW5nXyA9IGZhbHNlO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuaXNQb2ludGVyTG9ja2VkXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZWwgPSBkb2N1bWVudC5wb2ludGVyTG9ja0VsZW1lbnQgfHwgZG9jdW1lbnQubW96UG9pbnRlckxvY2tFbGVtZW50IHx8XG4gICAgICBkb2N1bWVudC53ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQ7XG4gIHJldHVybiBlbCAhPT0gdW5kZWZpbmVkO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUucmVzZXRQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucGhpXyA9IDA7XG4gIHRoaXMudGhldGFfID0gMDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW91c2VLZXlib2FyZFZSRGlzcGxheTtcbiIsIi8vIFRoaXMgaXMgdGhlIGVudHJ5IHBvaW50IGlmIHJlcXVpcmluZy9pbXBvcnRpbmcgdmlhIG5vZGUsIG9yXHJcbi8vIGEgYnVpbGQgdG9vbCB0aGF0IHVzZXMgcGFja2FnZS5qc29uIGVudHJ5IChsaWtlIGJyb3dzZXJpZnksIHdlYnBhY2spLlxyXG4vLyBJZiBydW5uaW5nIGluIG5vZGUgd2l0aCBhIHdpbmRvdyBtb2NrIGF2YWlsYWJsZSwgZ2xvYmFsaXplIGl0cyBtZW1iZXJzXHJcbi8vIGlmIG5lZWRlZC4gT3RoZXJ3aXNlLCBqdXN0IGNvbnRpbnVlIHRvIGAuL21haW5gXHJcbmlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiBnbG9iYWwud2luZG93KSB7XHJcbiAgZ2xvYmFsLmRvY3VtZW50ID0gZ2xvYmFsLndpbmRvdy5kb2N1bWVudDtcclxuICBnbG9iYWwubmF2aWdhdG9yID0gZ2xvYmFsLndpbmRvdy5uYXZpZ2F0b3I7XHJcbn1cclxuXHJcbnJlcXVpcmUoJy4vbWFpbicpO1xyXG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5mdW5jdGlvbiBSb3RhdGVJbnN0cnVjdGlvbnMoKSB7XG4gIHRoaXMubG9hZEljb25fKCk7XG5cbiAgdmFyIG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHMgPSBvdmVybGF5LnN0eWxlO1xuICBzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgcy50b3AgPSAwO1xuICBzLnJpZ2h0ID0gMDtcbiAgcy5ib3R0b20gPSAwO1xuICBzLmxlZnQgPSAwO1xuICBzLmJhY2tncm91bmRDb2xvciA9ICdncmF5JztcbiAgcy5mb250RmFtaWx5ID0gJ3NhbnMtc2VyaWYnO1xuICAvLyBGb3JjZSB0aGlzIHRvIGJlIGFib3ZlIHRoZSBmdWxsc2NyZWVuIGNhbnZhcywgd2hpY2ggaXMgYXQgekluZGV4OiA5OTk5OTkuXG4gIHMuekluZGV4ID0gMTAwMDAwMDtcblxuICB2YXIgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gIGltZy5zcmMgPSB0aGlzLmljb247XG4gIHZhciBzID0gaW1nLnN0eWxlO1xuICBzLm1hcmdpbkxlZnQgPSAnMjUlJztcbiAgcy5tYXJnaW5Ub3AgPSAnMjUlJztcbiAgcy53aWR0aCA9ICc1MCUnO1xuICBvdmVybGF5LmFwcGVuZENoaWxkKGltZyk7XG5cbiAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHMgPSB0ZXh0LnN0eWxlO1xuICBzLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICBzLmZvbnRTaXplID0gJzE2cHgnO1xuICBzLmxpbmVIZWlnaHQgPSAnMjRweCc7XG4gIHMubWFyZ2luID0gJzI0cHggMjUlJztcbiAgcy53aWR0aCA9ICc1MCUnO1xuICB0ZXh0LmlubmVySFRNTCA9ICdQbGFjZSB5b3VyIHBob25lIGludG8geW91ciBDYXJkYm9hcmQgdmlld2VyLic7XG4gIG92ZXJsYXkuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgdmFyIHNuYWNrYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gc25hY2tiYXIuc3R5bGU7XG4gIHMuYmFja2dyb3VuZENvbG9yID0gJyNDRkQ4REMnO1xuICBzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgcy5ib3R0b20gPSAwO1xuICBzLndpZHRoID0gJzEwMCUnO1xuICBzLmhlaWdodCA9ICc0OHB4JztcbiAgcy5wYWRkaW5nID0gJzE0cHggMjRweCc7XG4gIHMuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnO1xuICBzLmNvbG9yID0gJyM2NTZBNkInO1xuICBvdmVybGF5LmFwcGVuZENoaWxkKHNuYWNrYmFyKTtcblxuICB2YXIgc25hY2tiYXJUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHNuYWNrYmFyVGV4dC5zdHlsZS5mbG9hdCA9ICdsZWZ0JztcbiAgc25hY2tiYXJUZXh0LmlubmVySFRNTCA9ICdObyBDYXJkYm9hcmQgdmlld2VyPyc7XG5cbiAgdmFyIHNuYWNrYmFyQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICBzbmFja2JhckJ1dHRvbi5ocmVmID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vZ2V0L2NhcmRib2FyZC9nZXQtY2FyZGJvYXJkLyc7XG4gIHNuYWNrYmFyQnV0dG9uLmlubmVySFRNTCA9ICdnZXQgb25lJztcbiAgc25hY2tiYXJCdXR0b24udGFyZ2V0ID0gJ19ibGFuayc7XG4gIHZhciBzID0gc25hY2tiYXJCdXR0b24uc3R5bGU7XG4gIHMuZmxvYXQgPSAncmlnaHQnO1xuICBzLmZvbnRXZWlnaHQgPSA2MDA7XG4gIHMudGV4dFRyYW5zZm9ybSA9ICd1cHBlcmNhc2UnO1xuICBzLmJvcmRlckxlZnQgPSAnMXB4IHNvbGlkIGdyYXknO1xuICBzLnBhZGRpbmdMZWZ0ID0gJzI0cHgnO1xuICBzLnRleHREZWNvcmF0aW9uID0gJ25vbmUnO1xuICBzLmNvbG9yID0gJyM2NTZBNkInO1xuXG4gIHNuYWNrYmFyLmFwcGVuZENoaWxkKHNuYWNrYmFyVGV4dCk7XG4gIHNuYWNrYmFyLmFwcGVuZENoaWxkKHNuYWNrYmFyQnV0dG9uKTtcblxuICB0aGlzLm92ZXJsYXkgPSBvdmVybGF5O1xuICB0aGlzLnRleHQgPSB0ZXh0O1xuXG4gIHRoaXMuaGlkZSgpO1xufVxuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbihwYXJlbnQpIHtcbiAgaWYgKCFwYXJlbnQgJiYgIXRoaXMub3ZlcmxheS5wYXJlbnRFbGVtZW50KSB7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLm92ZXJsYXkpO1xuICB9IGVsc2UgaWYgKHBhcmVudCkge1xuICAgIGlmICh0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudCAmJiB0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudCAhPSBwYXJlbnQpXG4gICAgICB0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLm92ZXJsYXkpO1xuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHRoaXMub3ZlcmxheSk7XG4gIH1cblxuICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgdmFyIGltZyA9IHRoaXMub3ZlcmxheS5xdWVyeVNlbGVjdG9yKCdpbWcnKTtcbiAgdmFyIHMgPSBpbWcuc3R5bGU7XG5cbiAgaWYgKFV0aWwuaXNMYW5kc2NhcGVNb2RlKCkpIHtcbiAgICBzLndpZHRoID0gJzIwJSc7XG4gICAgcy5tYXJnaW5MZWZ0ID0gJzQwJSc7XG4gICAgcy5tYXJnaW5Ub3AgPSAnMyUnO1xuICB9IGVsc2Uge1xuICAgIHMud2lkdGggPSAnNTAlJztcbiAgICBzLm1hcmdpbkxlZnQgPSAnMjUlJztcbiAgICBzLm1hcmdpblRvcCA9ICcyNSUnO1xuICB9XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLnNob3dUZW1wb3JhcmlseSA9IGZ1bmN0aW9uKG1zLCBwYXJlbnQpIHtcbiAgdGhpcy5zaG93KHBhcmVudCk7XG4gIHRoaXMudGltZXIgPSBzZXRUaW1lb3V0KHRoaXMuaGlkZS5iaW5kKHRoaXMpLCBtcyk7XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLmRpc2FibGVTaG93VGVtcG9yYXJpbHkgPSBmdW5jdGlvbigpIHtcbiAgY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpO1xufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5kaXNhYmxlU2hvd1RlbXBvcmFyaWx5KCk7XG4gIC8vIEluIHBvcnRyYWl0IFZSIG1vZGUsIHRlbGwgdGhlIHVzZXIgdG8gcm90YXRlIHRvIGxhbmRzY2FwZS4gT3RoZXJ3aXNlLCBoaWRlXG4gIC8vIHRoZSBpbnN0cnVjdGlvbnMuXG4gIGlmICghVXRpbC5pc0xhbmRzY2FwZU1vZGUoKSAmJiBVdGlsLmlzTW9iaWxlKCkpIHtcbiAgICB0aGlzLnNob3coKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmhpZGUoKTtcbiAgfVxufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5sb2FkSWNvbl8gPSBmdW5jdGlvbigpIHtcbiAgLy8gRW5jb2RlZCBhc3NldF9zcmMvcm90YXRlLWluc3RydWN0aW9ucy5zdmdcbiAgdGhpcy5pY29uID0gVXRpbC5iYXNlNjQoJ2ltYWdlL3N2Zyt4bWwnLCAnUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrQ2p4emRtY2dkMmxrZEdnOUlqRTVPSEI0SWlCb1pXbG5hSFE5SWpJME1IQjRJaUIyYVdWM1FtOTRQU0l3SURBZ01UazRJREkwTUNJZ2RtVnljMmx2YmowaU1TNHhJaUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lJSGh0Ykc1ek9uaHNhVzVyUFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eE9UazVMM2hzYVc1cklpQjRiV3h1Y3pwemEyVjBZMmc5SW1oMGRIQTZMeTkzZDNjdVltOW9aVzFwWVc1amIyUnBibWN1WTI5dEwzTnJaWFJqYUM5dWN5SStDaUFnSUNBOElTMHRJRWRsYm1WeVlYUnZjam9nVTJ0bGRHTm9JRE11TXk0eklDZ3hNakE0TVNrZ0xTQm9kSFJ3T2k4dmQzZDNMbUp2YUdWdGFXRnVZMjlrYVc1bkxtTnZiUzl6YTJWMFkyZ2dMUzArQ2lBZ0lDQThkR2wwYkdVK2RISmhibk5wZEdsdmJqd3ZkR2wwYkdVK0NpQWdJQ0E4WkdWell6NURjbVZoZEdWa0lIZHBkR2dnVTJ0bGRHTm9Mand2WkdWell6NEtJQ0FnSUR4a1pXWnpQand2WkdWbWN6NEtJQ0FnSUR4bklHbGtQU0pRWVdkbExURWlJSE4wY205clpUMGlibTl1WlNJZ2MzUnliMnRsTFhkcFpIUm9QU0l4SWlCbWFXeHNQU0p1YjI1bElpQm1hV3hzTFhKMWJHVTlJbVYyWlc1dlpHUWlJSE5yWlhSamFEcDBlWEJsUFNKTlUxQmhaMlVpUGdvZ0lDQWdJQ0FnSUR4bklHbGtQU0owY21GdWMybDBhVzl1SWlCemEyVjBZMmc2ZEhsd1pUMGlUVk5CY25SaWIyRnlaRWR5YjNWd0lqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEdjZ2FXUTlJa2x0Y0c5eWRHVmtMVXhoZVdWeWN5MURiM0I1TFRRdEt5MUpiWEJ2Y25SbFpDMU1ZWGxsY25NdFEyOXdlUzByTFVsdGNHOXlkR1ZrTFV4aGVXVnljeTFEYjNCNUxUSXRRMjl3ZVNJZ2MydGxkR05vT25SNWNHVTlJazFUVEdGNVpYSkhjbTkxY0NJK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOFp5QnBaRDBpU1cxd2IzSjBaV1F0VEdGNVpYSnpMVU52Y0hrdE5DSWdkSEpoYm5ObWIzSnRQU0owY21GdWMyeGhkR1VvTUM0d01EQXdNREFzSURFd055NHdNREF3TURBcElpQnphMlYwWTJnNmRIbHdaVDBpVFZOVGFHRndaVWR5YjNWd0lqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRRNUxqWXlOU3d5TGpVeU55QkRNVFE1TGpZeU5Td3lMalV5TnlBeE5UVXVPREExTERZdU1EazJJREUxTmk0ek5qSXNOaTQwTVRnZ1RERTFOaTR6TmpJc055NHpNRFFnUXpFMU5pNHpOaklzTnk0ME9ERWdNVFUyTGpNM05TdzNMalkyTkNBeE5UWXVOQ3czTGpnMU15QkRNVFUyTGpReExEY3VPVE0wSURFMU5pNDBNaXc0TGpBeE5TQXhOVFl1TkRJM0xEZ3VNRGsxSUVNeE5UWXVOVFkzTERrdU5URWdNVFUzTGpRd01Td3hNUzR3T1RNZ01UVTRMalV6TWl3eE1pNHdPVFFnVERFMk5DNHlOVElzTVRjdU1UVTJJRXd4TmpRdU16TXpMREUzTGpBMk5pQkRNVFkwTGpNek15d3hOeTR3TmpZZ01UWTRMamN4TlN3eE5DNDFNellnTVRZNUxqVTJPQ3d4TkM0d05ESWdRekUzTVM0d01qVXNNVFF1T0RneklERTVOUzQxTXpnc01qa3VNRE0xSURFNU5TNDFNemdzTWprdU1ETTFJRXd4T1RVdU5UTTRMRGd6TGpBek5pQkRNVGsxTGpVek9DdzRNeTQ0TURjZ01UazFMakUxTWl3NE5DNHlOVE1nTVRrMExqVTVMRGcwTGpJMU15QkRNVGswTGpNMU55dzROQzR5TlRNZ01UazBMakE1TlN3NE5DNHhOemNnTVRrekxqZ3hPQ3c0TkM0d01UY2dUREUyT1M0NE5URXNOekF1TVRjNUlFd3hOamt1T0RNM0xEY3dMakl3TXlCTU1UUXlMalV4TlN3NE5TNDVOemdnVERFME1TNDJOalVzT0RRdU5qVTFJRU14TXpZdU9UTTBMRGd6TGpFeU5pQXhNekV1T1RFM0xEZ3hMamt4TlNBeE1qWXVOekUwTERneExqQTBOU0JETVRJMkxqY3dPU3c0TVM0d05pQXhNall1TnpBM0xEZ3hMakEyT1NBeE1qWXVOekEzTERneExqQTJPU0JNTVRJeExqWTBMRGs0TGpBeklFd3hNVE11TnpRNUxERXdNaTQxT0RZZ1RERXhNeTQzTVRJc01UQXlMalV5TXlCTU1URXpMamN4TWl3eE16QXVNVEV6SUVNeE1UTXVOekV5TERFek1DNDRPRFVnTVRFekxqTXlOaXd4TXpFdU16TWdNVEV5TGpjMk5Dd3hNekV1TXpNZ1F6RXhNaTQxTXpJc01UTXhMak16SURFeE1pNHlOamtzTVRNeExqSTFOQ0F4TVRFdU9Ua3lMREV6TVM0d09UUWdURFk1TGpVeE9Td3hNRFl1TlRjeUlFTTJPQzQxTmprc01UQTJMakF5TXlBMk55NDNPVGtzTVRBMExqWTVOU0EyTnk0M09Ua3NNVEF6TGpZd05TQk1OamN1TnprNUxERXdNaTQxTnlCTU5qY3VOemM0TERFd01pNDJNVGNnUXpZM0xqSTNMREV3TWk0ek9UTWdOall1TmpRNExERXdNaTR5TkRrZ05qVXVPVFl5TERFd01pNHlNVGdnUXpZMUxqZzNOU3d4TURJdU1qRTBJRFkxTGpjNE9Dd3hNREl1TWpFeUlEWTFMamN3TVN3eE1ESXVNakV5SUVNMk5TNDJNRFlzTVRBeUxqSXhNaUEyTlM0MU1URXNNVEF5TGpJeE5TQTJOUzQwTVRZc01UQXlMakl4T1NCRE5qVXVNVGsxTERFd01pNHlNamtnTmpRdU9UYzBMREV3TWk0eU16VWdOalF1TnpVMExERXdNaTR5TXpVZ1F6WTBMak16TVN3eE1ESXVNak0xSURZekxqa3hNU3d4TURJdU1qRTJJRFl6TGpRNU9Dd3hNREl1TVRjNElFTTJNUzQ0TkRNc01UQXlMakF5TlNBMk1DNHlPVGdzTVRBeExqVTNPQ0ExT1M0d09UUXNNVEF3TGpnNE1pQk1NVEl1TlRFNExEY3pMams1TWlCTU1USXVOVEl6TERjMExqQXdOQ0JNTWk0eU5EVXNOVFV1TWpVMElFTXhMakkwTkN3MU15NDBNamNnTWk0d01EUXNOVEV1TURNNElETXVPVFF6TERRNUxqa3hPQ0JNTlRrdU9UVTBMREUzTGpVM015QkROakF1TmpJMkxERTNMakU0TlNBMk1TNHpOU3d4Tnk0d01ERWdOakl1TURVekxERTNMakF3TVNCRE5qTXVNemM1TERFM0xqQXdNU0EyTkM0Mk1qVXNNVGN1TmpZZ05qVXVNamdzTVRndU9EVTBJRXcyTlM0eU9EVXNNVGd1T0RVeElFdzJOUzQxTVRJc01Ua3VNalkwSUV3Mk5TNDFNRFlzTVRrdU1qWTRJRU0yTlM0NU1Ea3NNakF1TURBeklEWTJMalF3TlN3eU1DNDJPQ0EyTmk0NU9ETXNNakV1TWpnMklFdzJOeTR5Tml3eU1TNDFOVFlnUXpZNUxqRTNOQ3d5TXk0ME1EWWdOekV1TnpJNExESTBMak0xTnlBM05DNHpOek1zTWpRdU16VTNJRU0zTmk0ek1qSXNNalF1TXpVM0lEYzRMak15TVN3eU15NDROQ0E0TUM0eE5EZ3NNakl1TnpnMUlFTTRNQzR4TmpFc01qSXVOemcxSURnM0xqUTJOeXd4T0M0MU5qWWdPRGN1TkRZM0xERTRMalUyTmlCRE9EZ3VNVE01TERFNExqRTNPQ0E0T0M0NE5qTXNNVGN1T1RrMElEZzVMalUyTml3eE55NDVPVFFnUXprd0xqZzVNaXd4Tnk0NU9UUWdPVEl1TVRNNExERTRMalkxTWlBNU1pNDNPVElzTVRrdU9EUTNJRXc1Tmk0d05ESXNNalV1TnpjMUlFdzVOaTR3TmpRc01qVXVOelUzSUV3eE1ESXVPRFE1TERJNUxqWTNOQ0JNTVRBeUxqYzBOQ3d5T1M0ME9USWdUREUwT1M0Mk1qVXNNaTQxTWpjZ1RURTBPUzQyTWpVc01DNDRPVElnUXpFME9TNHpORE1zTUM0NE9USWdNVFE1TGpBMk1pd3dMamsyTlNBeE5EZ3VPREVzTVM0eE1TQk1NVEF5TGpZME1Td3lOeTQyTmpZZ1REazNMakl6TVN3eU5DNDFORElnVERrMExqSXlOaXd4T1M0d05qRWdRemt6TGpNeE15d3hOeTR6T1RRZ09URXVOVEkzTERFMkxqTTFPU0E0T1M0MU5qWXNNVFl1TXpVNElFTTRPQzQxTlRVc01UWXVNelU0SURnM0xqVTBOaXd4Tmk0Mk16SWdPRFl1TmpRNUxERTNMakUxSUVNNE15NDROemdzTVRndU56VWdOemt1TmpnM0xESXhMakUyT1NBM09TNHpOelFzTWpFdU16UTFJRU0zT1M0ek5Ua3NNakV1TXpVeklEYzVMak0wTlN3eU1TNHpOakVnTnprdU16TXNNakV1TXpZNUlFTTNOeTQzT1Rnc01qSXVNalUwSURjMkxqQTROQ3d5TWk0M01qSWdOelF1TXpjekxESXlMamN5TWlCRE56SXVNRGd4TERJeUxqY3lNaUEyT1M0NU5Ua3NNakV1T0RrZ05qZ3VNemszTERJd0xqTTRJRXcyT0M0eE5EVXNNakF1TVRNMUlFTTJOeTQzTURZc01Ua3VOamN5SURZM0xqTXlNeXd4T1M0eE5UWWdOamN1TURBMkxERTRMall3TVNCRE5qWXVPVGc0TERFNExqVTFPU0EyTmk0NU5qZ3NNVGd1TlRFNUlEWTJMamswTml3eE9DNDBOemtnVERZMkxqY3hPU3d4T0M0d05qVWdRelkyTGpZNUxERTRMakF4TWlBMk5pNDJOVGdzTVRjdU9UWWdOall1TmpJMExERTNMamt4TVNCRE5qVXVOamcyTERFMkxqTXpOeUEyTXk0NU5URXNNVFV1TXpZMklEWXlMakExTXl3eE5TNHpOallnUXpZeExqQTBNaXd4TlM0ek5qWWdOakF1TURNekxERTFMalkwSURVNUxqRXpOaXd4Tmk0eE5UZ2dURE11TVRJMUxEUTRMalV3TWlCRE1DNDBNallzTlRBdU1EWXhJQzB3TGpZeE15dzFNeTQwTkRJZ01DNDRNVEVzTlRZdU1EUWdUREV4TGpBNE9TdzNOQzQzT1NCRE1URXVNalkyTERjMUxqRXhNeUF4TVM0MU16Y3NOelV1TXpVeklERXhMamcxTERjMUxqUTVOQ0JNTlRndU1qYzJMREV3TWk0eU9UZ2dRelU1TGpZM09Td3hNRE11TVRBNElEWXhMalF6TXl3eE1ETXVOak1nTmpNdU16UTRMREV3TXk0NE1EWWdRell6TGpneE1pd3hNRE11T0RRNElEWTBMakk0TlN3eE1ETXVPRGNnTmpRdU56VTBMREV3TXk0NE55QkROalVzTVRBekxqZzNJRFkxTGpJME9Td3hNRE11T0RZMElEWTFMalE1TkN3eE1ETXVPRFV5SUVNMk5TNDFOak1zTVRBekxqZzBPU0EyTlM0Mk16SXNNVEF6TGpnME55QTJOUzQzTURFc01UQXpMamcwTnlCRE5qVXVOelkwTERFd015NDRORGNnTmpVdU9ESTRMREV3TXk0NE5Ea2dOalV1T0Rrc01UQXpMamcxTWlCRE5qVXVPVGcyTERFd015NDROVFlnTmpZdU1EZ3NNVEF6TGpnMk15QTJOaTR4TnpNc01UQXpMamczTkNCRE5qWXVNamd5TERFd05TNDBOamNnTmpjdU16TXlMREV3Tnk0eE9UY2dOamd1TnpBeUxERXdOeTQ1T0RnZ1RERXhNUzR4TnpRc01UTXlMalV4SUVNeE1URXVOams0TERFek1pNDRNVElnTVRFeUxqSXpNaXd4TXpJdU9UWTFJREV4TWk0M05qUXNNVE15TGprMk5TQkRNVEUwTGpJMk1Td3hNekl1T1RZMUlERXhOUzR6TkRjc01UTXhMamMyTlNBeE1UVXVNelEzTERFek1DNHhNVE1nVERFeE5TNHpORGNzTVRBekxqVTFNU0JNTVRJeUxqUTFPQ3c1T1M0ME5EWWdRekV5TWk0NE1Ua3NPVGt1TWpNM0lERXlNeTR3T0Rjc09UZ3VPRGs0SURFeU15NHlNRGNzT1RndU5EazRJRXd4TWpjdU9EWTFMRGd5TGprd05TQkRNVE15TGpJM09TdzRNeTQzTURJZ01UTTJMalUxTnl3NE5DNDNOVE1nTVRRd0xqWXdOeXc0Tmk0d016TWdUREUwTVM0eE5DdzROaTQ0TmpJZ1F6RTBNUzQwTlRFc09EY3VNelEySURFME1TNDVOemNzT0RjdU5qRXpJREUwTWk0MU1UWXNPRGN1TmpFeklFTXhOREl1TnprMExEZzNMall4TXlBeE5ETXVNRGMyTERnM0xqVTBNaUF4TkRNdU16TXpMRGczTGpNNU15Qk1NVFk1TGpnMk5TdzNNaTR3TnpZZ1RERTVNeXc0TlM0ME16TWdRekU1TXk0MU1qTXNPRFV1TnpNMUlERTVOQzR3TlRnc09EVXVPRGc0SURFNU5DNDFPU3c0TlM0NE9EZ2dRekU1Tmk0d09EY3NPRFV1T0RnNElERTVOeTR4TnpNc09EUXVOamc1SURFNU55NHhOek1zT0RNdU1ETTJJRXd4T1RjdU1UY3pMREk1TGpBek5TQkRNVGszTGpFM015d3lPQzQwTlRFZ01UazJMamcyTVN3eU55NDVNVEVnTVRrMkxqTTFOU3d5Tnk0Mk1Ua2dRekU1Tmk0ek5UVXNNamN1TmpFNUlERTNNUzQ0TkRNc01UTXVORFkzSURFM01DNHpPRFVzTVRJdU5qSTJJRU14TnpBdU1UTXlMREV5TGpRNElERTJPUzQ0TlN3eE1pNDBNRGNnTVRZNUxqVTJPQ3d4TWk0ME1EY2dRekUyT1M0eU9EVXNNVEl1TkRBM0lERTJPUzR3TURJc01USXVORGd4SURFMk9DNDNORGtzTVRJdU5qSTNJRU14TmpndU1UUXpMREV5TGprM09DQXhOalV1TnpVMkxERTBMak0xTnlBeE5qUXVOREkwTERFMUxqRXlOU0JNTVRVNUxqWXhOU3d4TUM0NE55QkRNVFU0TGpjNU5pd3hNQzR4TkRVZ01UVTRMakUxTkN3NExqa3pOeUF4TlRndU1EVTBMRGN1T1RNMElFTXhOVGd1TURRMUxEY3VPRE0zSURFMU9DNHdNelFzTnk0M016a2dNVFU0TGpBeU1TdzNMalkwSUVNeE5UZ3VNREExTERjdU5USXpJREUxTnk0NU9UZ3NOeTQwTVNBeE5UY3VPVGs0TERjdU16QTBJRXd4TlRjdU9UazRMRFl1TkRFNElFTXhOVGN1T1RrNExEVXVPRE0wSURFMU55NDJPRFlzTlM0eU9UVWdNVFUzTGpFNE1TdzFMakF3TWlCRE1UVTJMall5TkN3MExqWTRJREUxTUM0ME5ESXNNUzR4TVRFZ01UVXdMalEwTWl3eExqRXhNU0JETVRVd0xqRTRPU3d3TGprMk5TQXhORGt1T1RBM0xEQXVPRGt5SURFME9TNDJNalVzTUM0NE9USWlJR2xrUFNKR2FXeHNMVEVpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT1RZdU1ESTNMREkxTGpZek5pQk1NVFF5TGpZd015dzFNaTQxTWpjZ1F6RTBNeTQ0TURjc05UTXVNakl5SURFME5DNDFPRElzTlRRdU1URTBJREUwTkM0NE5EVXNOVFV1TURZNElFd3hORFF1T0RNMUxEVTFMakEzTlNCTU5qTXVORFl4TERFd01pNHdOVGNnVERZekxqUTJMREV3TWk0d05UY2dRell4TGpnd05pd3hNREV1T1RBMUlEWXdMakkyTVN3eE1ERXVORFUzSURVNUxqQTFOeXd4TURBdU56WXlJRXd4TWk0ME9ERXNOek11T0RjeElFdzVOaTR3TWpjc01qVXVOak0ySWlCcFpEMGlSbWxzYkMweUlpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWXpMalEyTVN3eE1ESXVNVGMwSUVNMk15NDBOVE1zTVRBeUxqRTNOQ0EyTXk0ME5EWXNNVEF5TGpFM05DQTJNeTQwTXprc01UQXlMakUzTWlCRE5qRXVOelEyTERFd01pNHdNVFlnTmpBdU1qRXhMREV3TVM0MU5qTWdOVGd1T1RrNExERXdNQzQ0TmpNZ1RERXlMalF5TWl3M015NDVOek1nUXpFeUxqTTROaXczTXk0NU5USWdNVEl1TXpZMExEY3pMamt4TkNBeE1pNHpOalFzTnpNdU9EY3hJRU14TWk0ek5qUXNOek11T0RNZ01USXVNemcyTERjekxqYzVNU0F4TWk0ME1qSXNOek11TnpjZ1REazFMamsyT0N3eU5TNDFNelVnUXprMkxqQXdOQ3d5TlM0MU1UUWdPVFl1TURRNUxESTFMalV4TkNBNU5pNHdPRFVzTWpVdU5UTTFJRXd4TkRJdU5qWXhMRFV5TGpReU5pQkRNVFF6TGpnNE9DdzFNeTR4TXpRZ01UUTBMalk0TWl3MU5DNHdNemdnTVRRMExqazFOeXcxTlM0d016Y2dRekUwTkM0NU55dzFOUzR3T0RNZ01UUTBMamsxTXl3MU5TNHhNek1nTVRRMExqa3hOU3cxTlM0eE5qRWdRekUwTkM0NU1URXNOVFV1TVRZMUlERTBOQzQ0T1Rnc05UVXVNVGMwSURFME5DNDRPVFFzTlRVdU1UYzNJRXcyTXk0MU1Ua3NNVEF5TGpFMU9DQkROak11TlRBeExERXdNaTR4TmprZ05qTXVORGd4TERFd01pNHhOelFnTmpNdU5EWXhMREV3TWk0eE56UWdURFl6TGpRMk1Td3hNREl1TVRjMElGb2dUVEV5TGpjeE5DdzNNeTQ0TnpFZ1REVTVMakV4TlN3eE1EQXVOall4SUVNMk1DNHlPVE1zTVRBeExqTTBNU0EyTVM0M09EWXNNVEF4TGpjNE1pQTJNeTQwTXpVc01UQXhMamt6TnlCTU1UUTBMamN3Tnl3MU5TNHdNVFVnUXpFME5DNDBNamdzTlRRdU1UQTRJREUwTXk0Mk9ESXNOVE11TWpnMUlERTBNaTQxTkRRc05USXVOakk0SUV3NU5pNHdNamNzTWpVdU56Y3hJRXd4TWk0M01UUXNOek11T0RjeElFd3hNaTQzTVRRc056TXVPRGN4SUZvaUlHbGtQU0pHYVd4c0xUTWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFE0TGpNeU55dzFPQzQwTnpFZ1F6RTBPQzR4TkRVc05UZ3VORGdnTVRRM0xqazJNaXcxT0M0ME9DQXhORGN1TnpneExEVTRMalEzTWlCRE1UUTFMamc0Tnl3MU9DNHpPRGtnTVRRMExqUTNPU3cxTnk0ME16UWdNVFEwTGpZek5pdzFOaTR6TkNCRE1UUTBMalk0T1N3MU5TNDVOamNnTVRRMExqWTJOQ3cxTlM0MU9UY2dNVFEwTGpVMk5DdzFOUzR5TXpVZ1REWXpMalEyTVN3eE1ESXVNRFUzSUVNMk5DNHdPRGtzTVRBeUxqRXhOU0EyTkM0M016TXNNVEF5TGpFeklEWTFMak0zT1N3eE1ESXVNRGs1SUVNMk5TNDFOakVzTVRBeUxqQTVJRFkxTGpjME15d3hNREl1TURrZ05qVXVPVEkxTERFd01pNHdPVGdnUXpZM0xqZ3hPU3d4TURJdU1UZ3hJRFk1TGpJeU55d3hNRE11TVRNMklEWTVMakEzTERFd05DNHlNeUJNTVRRNExqTXlOeXcxT0M0ME56RWlJR2xrUFNKR2FXeHNMVFFpSUdacGJHdzlJaU5HUmtaR1JrWWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTmprdU1EY3NNVEEwTGpNME55QkROamt1TURRNExERXdOQzR6TkRjZ05qa3VNREkxTERFd05DNHpOQ0EyT1M0d01EVXNNVEEwTGpNeU55QkROamd1T1RZNExERXdOQzR6TURFZ05qZ3VPVFE0TERFd05DNHlOVGNnTmpndU9UVTFMREV3TkM0eU1UTWdRelk1TERFd015NDRPVFlnTmpndU9EazRMREV3TXk0MU56WWdOamd1TmpVNExERXdNeTR5T0RnZ1F6WTRMakUxTXl3eE1ESXVOamM0SURZM0xqRXdNeXd4TURJdU1qWTJJRFkxTGpreUxERXdNaTR5TVRRZ1F6WTFMamMwTWl3eE1ESXVNakEySURZMUxqVTJNeXd4TURJdU1qQTNJRFkxTGpNNE5Td3hNREl1TWpFMUlFTTJOQzQzTkRJc01UQXlMakkwTmlBMk5DNHdPRGNzTVRBeUxqSXpNaUEyTXk0ME5Td3hNREl1TVRjMElFTTJNeTR6T1Rrc01UQXlMakUyT1NBMk15NHpOVGdzTVRBeUxqRXpNaUEyTXk0ek5EY3NNVEF5TGpBNE1pQkROak11TXpNMkxERXdNaTR3TXpNZ05qTXVNelU0TERFd01TNDVPREVnTmpNdU5EQXlMREV3TVM0NU5UWWdUREUwTkM0MU1EWXNOVFV1TVRNMElFTXhORFF1TlRNM0xEVTFMakV4TmlBeE5EUXVOVGMxTERVMUxqRXhNeUF4TkRRdU5qQTVMRFUxTGpFeU55QkRNVFEwTGpZME1pdzFOUzR4TkRFZ01UUTBMalkyT0N3MU5TNHhOeUF4TkRRdU5qYzNMRFUxTGpJd05DQkRNVFEwTGpjNE1TdzFOUzQxT0RVZ01UUTBMamd3Tml3MU5TNDVOeklnTVRRMExqYzFNU3cxTmk0ek5UY2dRekUwTkM0M01EWXNOVFl1TmpjeklERTBOQzQ0TURnc05UWXVPVGswSURFME5TNHdORGNzTlRjdU1qZ3lJRU14TkRVdU5UVXpMRFUzTGpnNU1pQXhORFl1TmpBeUxEVTRMak13TXlBeE5EY3VOemcyTERVNExqTTFOU0JETVRRM0xqazJOQ3cxT0M0ek5qTWdNVFE0TGpFME15dzFPQzR6TmpNZ01UUTRMak15TVN3MU9DNHpOVFFnUXpFME9DNHpOemNzTlRndU16VXlJREUwT0M0ME1qUXNOVGd1TXpnM0lERTBPQzQwTXprc05UZ3VORE00SUVNeE5EZ3VORFUwTERVNExqUTVJREUwT0M0ME16SXNOVGd1TlRRMUlERTBPQzR6T0RVc05UZ3VOVGN5SUV3Mk9TNHhNamtzTVRBMExqTXpNU0JETmprdU1URXhMREV3TkM0ek5ESWdOamt1TURrc01UQTBMak0wTnlBMk9TNHdOeXd4TURRdU16UTNJRXcyT1M0d055d3hNRFF1TXpRM0lGb2dUVFkxTGpZMk5Td3hNREV1T1RjMUlFTTJOUzQzTlRRc01UQXhMamszTlNBMk5TNDRORElzTVRBeExqazNOeUEyTlM0NU15d3hNREV1T1RneElFTTJOeTR4T1RZc01UQXlMakF6TnlBMk9DNHlPRE1zTVRBeUxqUTJPU0EyT0M0NE16Z3NNVEF6TGpFek9TQkROamt1TURZMUxERXdNeTQwTVRNZ05qa3VNVGc0TERFd015NDNNVFFnTmprdU1UazRMREV3TkM0d01qRWdUREUwTnk0NE9ETXNOVGd1TlRreUlFTXhORGN1T0RRM0xEVTRMalU1TWlBeE5EY3VPREV4TERVNExqVTVNU0F4TkRjdU56YzJMRFU0TGpVNE9TQkRNVFEyTGpVd09TdzFPQzQxTXpNZ01UUTFMalF5TWl3MU9DNHhJREUwTkM0NE5qY3NOVGN1TkRNeElFTXhORFF1TlRnMUxEVTNMakE1TVNBeE5EUXVORFkxTERVMkxqY3dOeUF4TkRRdU5USXNOVFl1TXpJMElFTXhORFF1TlRZekxEVTJMakF5TVNBeE5EUXVOVFV5TERVMUxqY3hOaUF4TkRRdU5EZzRMRFUxTGpReE5DQk1Oak11T0RRMkxERXdNUzQ1TnlCRE5qUXVNelV6TERFd01pNHdNRElnTmpRdU9EWTNMREV3TWk0d01EWWdOalV1TXpjMExERXdNUzQ1T0RJZ1F6WTFMalEzTVN3eE1ERXVPVGMzSURZMUxqVTJPQ3d4TURFdU9UYzFJRFkxTGpZMk5Td3hNREV1T1RjMUlFdzJOUzQyTmpVc01UQXhMamszTlNCYUlpQnBaRDBpUm1sc2JDMDFJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEl1TWpBNExEVTFMakV6TkNCRE1TNHlNRGNzTlRNdU16QTNJREV1T1RZM0xEVXdMamt4TnlBekxqa3dOaXcwT1M0M09UY2dURFU1TGpreE55d3hOeTQwTlRNZ1F6WXhMamcxTml3eE5pNHpNek1nTmpRdU1qUXhMREUyTGprd055QTJOUzR5TkRNc01UZ3VOek0wSUV3Mk5TNDBOelVzTVRrdU1UUTBJRU0yTlM0NE56SXNNVGt1T0RneUlEWTJMak0yT0N3eU1DNDFOaUEyTmk0NU5EVXNNakV1TVRZMUlFdzJOeTR5TWpNc01qRXVORE0xSUVNM01DNDFORGdzTWpRdU5qUTVJRGMxTGpnd05pd3lOUzR4TlRFZ09EQXVNVEV4TERJeUxqWTJOU0JNT0RjdU5ETXNNVGd1TkRRMUlFTTRPUzR6Tnl3eE55NHpNallnT1RFdU56VTBMREUzTGpnNU9TQTVNaTQzTlRVc01Ua3VOekkzSUV3NU5pNHdNRFVzTWpVdU5qVTFJRXd4TWk0ME9EWXNOek11T0RnMElFd3lMakl3T0N3MU5TNHhNelFnV2lJZ2FXUTlJa1pwYkd3dE5pSWdabWxzYkQwaUkwWkJSa0ZHUVNJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNaTQwT0RZc056UXVNREF4SUVNeE1pNDBOellzTnpRdU1EQXhJREV5TGpRMk5TdzNNeTQ1T1RrZ01USXVORFUxTERjekxqazVOaUJETVRJdU5ESTBMRGN6TGprNE9DQXhNaTR6T1Rrc056TXVPVFkzSURFeUxqTTROQ3czTXk0NU5DQk1NaTR4TURZc05UVXVNVGtnUXpFdU1EYzFMRFV6TGpNeElERXVPRFUzTERVd0xqZzBOU0F6TGpnME9DdzBPUzQyT1RZZ1REVTVMamcxT0N3eE55NHpOVElnUXpZd0xqVXlOU3d4Tmk0NU5qY2dOakV1TWpjeExERTJMamMyTkNBMk1pNHdNVFlzTVRZdU56WTBJRU0yTXk0ME16RXNNVFl1TnpZMElEWTBMalkyTml3eE55NDBOallnTmpVdU16STNMREU0TGpZME5pQkROalV1TXpNM0xERTRMalkxTkNBMk5TNHpORFVzTVRndU5qWXpJRFkxTGpNMU1Td3hPQzQyTnpRZ1REWTFMalUzT0N3eE9TNHdPRGdnUXpZMUxqVTROQ3d4T1M0eElEWTFMalU0T1N3eE9TNHhNVElnTmpVdU5Ua3hMREU1TGpFeU5pQkROalV1T1RnMUxERTVMamd6T0NBMk5pNDBOamtzTWpBdU5EazNJRFkzTGpBekxESXhMakE0TlNCTU5qY3VNekExTERJeExqTTFNU0JETmprdU1UVXhMREl6TGpFek55QTNNUzQyTkRrc01qUXVNVElnTnpRdU16TTJMREkwTGpFeUlFTTNOaTR6TVRNc01qUXVNVElnTnpndU1qa3NNak11TlRneUlEZ3dMakExTXl3eU1pNDFOak1nUXpnd0xqQTJOQ3d5TWk0MU5UY2dPREF1TURjMkxESXlMalUxTXlBNE1DNHdPRGdzTWpJdU5UVWdURGczTGpNM01pd3hPQzR6TkRRZ1F6ZzRMakF6T0N3eE55NDVOVGtnT0RndU56ZzBMREUzTGpjMU5pQTRPUzQxTWprc01UY3VOelUySUVNNU1DNDVOVFlzTVRjdU56VTJJRGt5TGpJd01Td3hPQzQwTnpJZ09USXVPRFU0TERFNUxqWTNJRXc1Tmk0eE1EY3NNalV1TlRrNUlFTTVOaTR4TXpnc01qVXVOalUwSURrMkxqRXhPQ3d5TlM0M01qUWdPVFl1TURZekxESTFMamMxTmlCTU1USXVOVFExTERjekxqazROU0JETVRJdU5USTJMRGN6TGprNU5pQXhNaTQxTURZc056UXVNREF4SURFeUxqUTROaXczTkM0d01ERWdUREV5TGpRNE5pdzNOQzR3TURFZ1dpQk5Oakl1TURFMkxERTJMams1TnlCRE5qRXVNekV5TERFMkxqazVOeUEyTUM0Mk1EWXNNVGN1TVRrZ05Ua3VPVGMxTERFM0xqVTFOQ0JNTXk0NU5qVXNORGt1T0RrNUlFTXlMakE0TXl3MU1DNDVPRFVnTVM0ek5ERXNOVE11TXpBNElESXVNekVzTlRVdU1EYzRJRXd4TWk0MU16RXNOek11TnpJeklFdzVOUzQ0TkRnc01qVXVOakV4SUV3NU1pNDJOVE1zTVRrdU56Z3lJRU01TWk0d016Z3NNVGd1TmpZZ09UQXVPRGNzTVRjdU9Ua2dPRGt1TlRJNUxERTNMams1SUVNNE9DNDRNalVzTVRjdU9Ua2dPRGd1TVRFNUxERTRMakU0TWlBNE55NDBPRGtzTVRndU5UUTNJRXc0TUM0eE56SXNNakl1TnpjeUlFTTRNQzR4TmpFc01qSXVOemM0SURnd0xqRTBPU3d5TWk0M09ESWdPREF1TVRNM0xESXlMamM0TlNCRE56Z3VNelEyTERJekxqZ3hNU0EzTmk0ek5ERXNNalF1TXpVMElEYzBMak16Tml3eU5DNHpOVFFnUXpjeExqVTRPQ3d5TkM0ek5UUWdOamt1TURNekxESXpMak0wTnlBMk55NHhORElzTWpFdU5URTVJRXcyTmk0NE5qUXNNakV1TWpRNUlFTTJOaTR5Tnpjc01qQXVOak0wSURZMUxqYzNOQ3d4T1M0NU5EY2dOalV1TXpZM0xERTVMakl3TXlCRE5qVXVNellzTVRrdU1Ua3lJRFkxTGpNMU5pd3hPUzR4TnprZ05qVXVNelUwTERFNUxqRTJOaUJNTmpVdU1UWXpMREU0TGpneE9TQkROalV1TVRVMExERTRMamd4TVNBMk5TNHhORFlzTVRndU9EQXhJRFkxTGpFMExERTRMamM1SUVNMk5DNDFNalVzTVRjdU5qWTNJRFl6TGpNMU55d3hOaTQ1T1RjZ05qSXVNREUyTERFMkxqazVOeUJNTmpJdU1ERTJMREUyTGprNU55QmFJaUJwWkQwaVJtbHNiQzAzSWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRReUxqUXpOQ3cwT0M0NE1EZ2dURFF5TGpRek5DdzBPQzQ0TURnZ1F6TTVMamt5TkN3ME9DNDRNRGNnTXpjdU56TTNMRFEzTGpVMUlETTJMalU0TWl3ME5TNDBORE1nUXpNMExqYzNNU3cwTWk0eE16a2dNell1TVRRMExETTNMamd3T1NBek9TNDJOREVzTXpVdU56ZzVJRXcxTVM0NU16SXNNamd1TmpreElFTTFNeTR4TURNc01qZ3VNREUxSURVMExqUXhNeXd5Tnk0Mk5UZ2dOVFV1TnpJeExESTNMalkxT0NCRE5UZ3VNak14TERJM0xqWTFPQ0EyTUM0ME1UZ3NNamd1T1RFMklEWXhMalUzTXl3ek1TNHdNak1nUXpZekxqTTROQ3d6TkM0ek1qY2dOakl1TURFeUxETTRMalkxTnlBMU9DNDFNVFFzTkRBdU5qYzNJRXcwTmk0eU1qTXNORGN1TnpjMUlFTTBOUzR3TlRNc05EZ3VORFVnTkRNdU56UXlMRFE0TGpnd09DQTBNaTQwTXpRc05EZ3VPREE0SUV3ME1pNDBNelFzTkRndU9EQTRJRm9nVFRVMUxqY3lNU3d5T0M0eE1qVWdRelUwTGpRNU5Td3lPQzR4TWpVZ05UTXVNalkxTERJNExqUTJNU0ExTWk0eE5qWXNNamt1TURrMklFd3pPUzQ0TnpVc016WXVNVGswSUVNek5pNDFPVFlzTXpndU1EZzNJRE0xTGpNd01pdzBNaTR4TXpZZ016WXVPVGt5TERRMUxqSXhPQ0JETXpndU1EWXpMRFEzTGpFM015QTBNQzR3T1Rnc05EZ3VNelFnTkRJdU5ETTBMRFE0TGpNMElFTTBNeTQyTmpFc05EZ3VNelFnTkRRdU9Ea3NORGd1TURBMUlEUTFMams1TERRM0xqTTNJRXcxT0M0eU9ERXNOREF1TWpjeUlFTTJNUzQxTml3ek9DNHpOemtnTmpJdU9EVXpMRE0wTGpNeklEWXhMakUyTkN3ek1TNHlORGdnUXpZd0xqQTVNaXd5T1M0eU9UTWdOVGd1TURVNExESTRMakV5TlNBMU5TNDNNakVzTWpndU1USTFJRXcxTlM0M01qRXNNamd1TVRJMUlGb2lJR2xrUFNKR2FXeHNMVGdpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRRNUxqVTRPQ3d5TGpRd055QkRNVFE1TGpVNE9Dd3lMalF3TnlBeE5UVXVOelk0TERVdU9UYzFJREUxTmk0ek1qVXNOaTR5T1RjZ1RERTFOaTR6TWpVc055NHhPRFFnUXpFMU5pNHpNalVzTnk0ek5pQXhOVFl1TXpNNExEY3VOVFEwSURFMU5pNHpOaklzTnk0M016TWdRekUxTmk0ek56TXNOeTQ0TVRRZ01UVTJMak00TWl3M0xqZzVOQ0F4TlRZdU16a3NOeTQ1TnpVZ1F6RTFOaTQxTXl3NUxqTTVJREUxTnk0ek5qTXNNVEF1T1RjeklERTFPQzQwT1RVc01URXVPVGMwSUV3eE5qVXVPRGt4TERFNExqVXhPU0JETVRZMkxqQTJPQ3d4T0M0Mk56VWdNVFkyTGpJME9Td3hPQzQ0TVRRZ01UWTJMalF6TWl3eE9DNDVNelFnUXpFMk9DNHdNVEVzTVRrdU9UYzBJREUyT1M0ek9ESXNNVGt1TkNBeE5qa3VORGswTERFM0xqWTFNaUJETVRZNUxqVTBNeXd4Tmk0NE5qZ2dNVFk1TGpVMU1Td3hOaTR3TlRjZ01UWTVMalV4Tnl3eE5TNHlNak1nVERFMk9TNDFNVFFzTVRVdU1EWXpJRXd4TmprdU5URTBMREV6TGpreE1pQkRNVGN3TGpjNExERTBMalkwTWlBeE9UVXVOVEF4TERJNExqa3hOU0F4T1RVdU5UQXhMREk0TGpreE5TQk1NVGsxTGpVd01TdzRNaTQ1TVRVZ1F6RTVOUzQxTURFc09EUXVNREExSURFNU5DNDNNekVzT0RRdU5EUTFJREU1TXk0M09ERXNPRE11T0RrM0lFd3hOVEV1TXpBNExEVTVMak0zTkNCRE1UVXdMak0xT0N3MU9DNDRNallnTVRRNUxqVTRPQ3cxTnk0ME9UY2dNVFE1TGpVNE9DdzFOaTQwTURnZ1RERTBPUzQxT0Rnc01qSXVNemMxSWlCcFpEMGlSbWxzYkMwNUlpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTVOQzQxTlRNc09EUXVNalVnUXpFNU5DNHlPVFlzT0RRdU1qVWdNVGswTGpBeE15dzROQzR4TmpVZ01Ua3pMamN5TWl3NE15NDVPVGNnVERFMU1TNHlOU3cxT1M0ME56WWdRekUxTUM0eU5qa3NOVGd1T1RBNUlERTBPUzQwTnpFc05UY3VOVE16SURFME9TNDBOekVzTlRZdU5EQTRJRXd4TkRrdU5EY3hMREl5TGpNM05TQk1NVFE1TGpjd05Td3lNaTR6TnpVZ1RERTBPUzQzTURVc05UWXVOREE0SUVNeE5Ea3VOekExTERVM0xqUTFPU0F4TlRBdU5EVXNOVGd1TnpRMElERTFNUzR6TmpZc05Ua3VNamMwSUV3eE9UTXVPRE01TERnekxqYzVOU0JETVRrMExqSTJNeXc0TkM0d05DQXhPVFF1TmpVMUxEZzBMakE0TXlBeE9UUXVPVFF5TERnekxqa3hOeUJETVRrMUxqSXlOeXc0TXk0M05UTWdNVGsxTGpNNE5DdzRNeTR6T1RjZ01UazFMak00TkN3NE1pNDVNVFVnVERFNU5TNHpPRFFzTWpndU9UZ3lJRU14T1RRdU1UQXlMREk0TGpJME1pQXhOekl1TVRBMExERTFMalUwTWlBeE5qa3VOak14TERFMExqRXhOQ0JNTVRZNUxqWXpOQ3d4TlM0eU1pQkRNVFk1TGpZMk9Dd3hOaTR3TlRJZ01UWTVMalkyTERFMkxqZzNOQ0F4TmprdU5qRXNNVGN1TmpVNUlFTXhOamt1TlRVMkxERTRMalV3TXlBeE5qa3VNakUwTERFNUxqRXlNeUF4TmpndU5qUTNMREU1TGpRd05TQkRNVFk0TGpBeU9Dd3hPUzQzTVRRZ01UWTNMakU1Tnl3eE9TNDFOemdnTVRZMkxqTTJOeXd4T1M0d016SWdRekUyTmk0eE9ERXNNVGd1T1RBNUlERTJOUzQ1T1RVc01UZ3VOelkySURFMk5TNDRNVFFzTVRndU5qQTJJRXd4TlRndU5ERTNMREV5TGpBMk1pQkRNVFUzTGpJMU9Td3hNUzR3TXpZZ01UVTJMalF4T0N3NUxqUXpOeUF4TlRZdU1qYzBMRGN1T1RnMklFTXhOVFl1TWpZMkxEY3VPVEEzSURFMU5pNHlOVGNzTnk0NE1qY2dNVFUyTGpJME55dzNMamMwT0NCRE1UVTJMakl5TVN3M0xqVTFOU0F4TlRZdU1qQTVMRGN1TXpZMUlERTFOaTR5TURrc055NHhPRFFnVERFMU5pNHlNRGtzTmk0ek5qUWdRekUxTlM0ek56VXNOUzQ0T0RNZ01UUTVMalV5T1N3eUxqVXdPQ0F4TkRrdU5USTVMREl1TlRBNElFd3hORGt1TmpRMkxESXVNekEySUVNeE5Ea3VOalEyTERJdU16QTJJREUxTlM0NE1qY3NOUzQ0TnpRZ01UVTJMak00TkN3MkxqRTVOaUJNTVRVMkxqUTBNaXcyTGpJeklFd3hOVFl1TkRReUxEY3VNVGcwSUVNeE5UWXVORFF5TERjdU16VTFJREUxTmk0ME5UUXNOeTQxTXpVZ01UVTJMalEzT0N3M0xqY3hOeUJETVRVMkxqUTRPU3czTGpnZ01UVTJMalE1T1N3M0xqZzRNaUF4TlRZdU5UQTNMRGN1T1RZeklFTXhOVFl1TmpRMUxEa3VNelU0SURFMU55NDBOVFVzTVRBdU9EazRJREUxT0M0MU56SXNNVEV1T0RnMklFd3hOalV1T1RZNUxERTRMalF6TVNCRE1UWTJMakUwTWl3eE9DNDFPRFFnTVRZMkxqTXhPU3d4T0M0M01pQXhOall1TkRrMkxERTRMamd6TnlCRE1UWTNMakkxTkN3eE9TNHpNellnTVRZNExERTVMalEyTnlBeE5qZ3VOVFF6TERFNUxqRTVOaUJETVRZNUxqQXpNeXd4T0M0NU5UTWdNVFk1TGpNeU9Td3hPQzQwTURFZ01UWTVMak0zTnl3eE55NDJORFVnUXpFMk9TNDBNamNzTVRZdU9EWTNJREUyT1M0ME16UXNNVFl1TURVMElERTJPUzQwTURFc01UVXVNakk0SUV3eE5qa3VNemszTERFMUxqQTJOU0JNTVRZNUxqTTVOeXd4TXk0M01TQk1NVFk1TGpVM01pd3hNeTQ0TVNCRE1UY3dMamd6T1N3eE5DNDFOREVnTVRrMUxqVTFPU3d5T0M0NE1UUWdNVGsxTGpVMU9Td3lPQzQ0TVRRZ1RERTVOUzQyTVRnc01qZ3VPRFEzSUV3eE9UVXVOakU0TERneUxqa3hOU0JETVRrMUxqWXhPQ3c0TXk0ME9EUWdNVGsxTGpReUxEZ3pMamt4TVNBeE9UVXVNRFU1TERnMExqRXhPU0JETVRrMExqa3dPQ3c0TkM0eU1EWWdNVGswTGpjek55dzROQzR5TlNBeE9UUXVOVFV6TERnMExqSTFJaUJwWkQwaVJtbHNiQzB4TUNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE5EVXVOamcxTERVMkxqRTJNU0JNTVRZNUxqZ3NOekF1TURneklFd3hORE11T0RJeUxEZzFMakE0TVNCTU1UUXlMak0yTERnMExqYzNOQ0JETVRNMUxqZ3lOaXc0TWk0Mk1EUWdNVEk0TGpjek1pdzRNUzR3TkRZZ01USXhMak0wTVN3NE1DNHhOVGdnUXpFeE5pNDVOellzTnprdU5qTTBJREV4TWk0Mk56Z3NPREV1TWpVMElERXhNUzQzTkRNc09ETXVOemM0SUVNeE1URXVOVEEyTERnMExqUXhOQ0F4TVRFdU5UQXpMRGcxTGpBM01TQXhNVEV1TnpNeUxEZzFMamN3TmlCRE1URXpMakkzTERnNUxqazNNeUF4TVRVdU9UWTRMRGswTGpBMk9TQXhNVGt1TnpJM0xEazNMamcwTVNCTU1USXdMakkxT1N3NU9DNDJPRFlnUXpFeU1DNHlOaXc1T0M0Mk9EVWdPVFF1TWpneUxERXhNeTQyT0RNZ09UUXVNamd5TERFeE15NDJPRE1nVERjd0xqRTJOeXc1T1M0M05qRWdUREUwTlM0Mk9EVXNOVFl1TVRZeElpQnBaRDBpUm1sc2JDMHhNU0lnWm1sc2JEMGlJMFpHUmtaR1JpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazA1TkM0eU9ESXNNVEV6TGpneE9DQk1PVFF1TWpJekxERXhNeTQzT0RVZ1REWTVMamt6TXl3NU9TNDNOakVnVERjd0xqRXdPQ3c1T1M0Mk5pQk1NVFExTGpZNE5TdzFOaTR3TWpZZ1RERTBOUzQzTkRNc05UWXVNRFU1SUV3eE56QXVNRE16TERjd0xqQTRNeUJNTVRRekxqZzBNaXc0TlM0eU1EVWdUREUwTXk0M09UY3NPRFV1TVRrMUlFTXhORE11TnpjeUxEZzFMakU1SURFME1pNHpNellzT0RRdU9EZzRJREUwTWk0ek16WXNPRFF1T0RnNElFTXhNelV1TnpnM0xEZ3lMamN4TkNBeE1qZ3VOekl6TERneExqRTJNeUF4TWpFdU16STNMRGd3TGpJM05DQkRNVEl3TGpjNE9DdzRNQzR5TURrZ01USXdMakl6Tml3NE1DNHhOemNnTVRFNUxqWTRPU3c0TUM0eE56Y2dRekV4TlM0NU16RXNPREF1TVRjM0lERXhNaTQyTXpVc09ERXVOekE0SURFeE1TNDROVElzT0RNdU9ERTVJRU14TVRFdU5qSTBMRGcwTGpRek1pQXhNVEV1TmpJeExEZzFMakExTXlBeE1URXVPRFF5TERnMUxqWTJOeUJETVRFekxqTTNOeXc0T1M0NU1qVWdNVEUyTGpBMU9DdzVNeTQ1T1RNZ01URTVMamd4TERrM0xqYzFPQ0JNTVRFNUxqZ3lOaXc1Tnk0M056a2dUREV5TUM0ek5USXNPVGd1TmpFMElFTXhNakF1TXpVMExEazRMall4TnlBeE1qQXVNelUyTERrNExqWXlJREV5TUM0ek5UZ3NPVGd1TmpJMElFd3hNakF1TkRJeUxEazRMamN5TmlCTU1USXdMak14Tnl3NU9DNDNPRGNnUXpFeU1DNHlOalFzT1RndU9ERTRJRGswTGpVNU9Td3hNVE11TmpNMUlEazBMak0wTERFeE15NDNPRFVnVERrMExqSTRNaXd4TVRNdU9ERTRJRXc1TkM0eU9ESXNNVEV6TGpneE9DQmFJRTAzTUM0ME1ERXNPVGt1TnpZeElFdzVOQzR5T0RJc01URXpMalUwT1NCTU1URTVMakE0TkN3NU9TNHlNamtnUXpFeE9TNDJNeXc1T0M0NU1UUWdNVEU1TGprekxEazRMamMwSURFeU1DNHhNREVzT1RndU5qVTBJRXd4TVRrdU5qTTFMRGszTGpreE5DQkRNVEUxTGpnMk5DdzVOQzR4TWpjZ01URXpMakUyT0N3NU1DNHdNek1nTVRFeExqWXlNaXc0TlM0M05EWWdRekV4TVM0ek9ESXNPRFV1TURjNUlERXhNUzR6T0RZc09EUXVOREEwSURFeE1TNDJNek1zT0RNdU56TTRJRU14TVRJdU5EUTRMRGd4TGpVek9TQXhNVFV1T0RNMkxEYzVMamswTXlBeE1Ua3VOamc1TERjNUxqazBNeUJETVRJd0xqSTBOaXczT1M0NU5ETWdNVEl3TGpnd05pdzNPUzQ1TnpZZ01USXhMak0xTlN3NE1DNHdORElnUXpFeU9DNDNOamNzT0RBdU9UTXpJREV6TlM0NE5EWXNPREl1TkRnM0lERTBNaTR6T1RZc09EUXVOall6SUVNeE5ETXVNak15TERnMExqZ3pPQ0F4TkRNdU5qRXhMRGcwTGpreE55QXhORE11TnpnMkxEZzBMamsyTnlCTU1UWTVMalUyTml3M01DNHdPRE1nVERFME5TNDJPRFVzTlRZdU1qazFJRXczTUM0ME1ERXNPVGt1TnpZeElFdzNNQzQwTURFc09Ua3VOell4SUZvaUlHbGtQU0pHYVd4c0xURXlJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUyTnk0eU15d3hPQzQ1TnprZ1RERTJOeTR5TXl3Mk9TNDROU0JNTVRNNUxqa3dPU3c0TlM0Mk1qTWdUREV6TXk0ME5EZ3NOekV1TkRVMklFTXhNekl1TlRNNExEWTVMalEySURFek1DNHdNaXcyT1M0M01UZ2dNVEkzTGpneU5DdzNNaTR3TXlCRE1USTJMamMyT1N3M015NHhOQ0F4TWpVdU9UTXhMRGMwTGpVNE5TQXhNalV1TkRrMExEYzJMakEwT0NCTU1URTVMakF6TkN3NU55NDJOellnVERreExqY3hNaXd4TVRNdU5EVWdURGt4TGpjeE1pdzJNaTQxTnprZ1RERTJOeTR5TXl3eE9DNDVOemtpSUdsa1BTSkdhV3hzTFRFeklpQm1hV3hzUFNJalJrWkdSa1pHSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUa3hMamN4TWl3eE1UTXVOVFkzSUVNNU1TNDJPVElzTVRFekxqVTJOeUE1TVM0Mk56SXNNVEV6TGpVMk1TQTVNUzQyTlRNc01URXpMalUxTVNCRE9URXVOakU0TERFeE15NDFNeUE1TVM0MU9UVXNNVEV6TGpRNU1pQTVNUzQxT1RVc01URXpMalExSUV3NU1TNDFPVFVzTmpJdU5UYzVJRU01TVM0MU9UVXNOakl1TlRNM0lEa3hMall4T0N3Mk1pNDBPVGtnT1RFdU5qVXpMRFl5TGpRM09DQk1NVFkzTGpFM01pd3hPQzQ0TnpnZ1F6RTJOeTR5TURnc01UZ3VPRFUzSURFMk55NHlOVElzTVRndU9EVTNJREUyTnk0eU9EZ3NNVGd1T0RjNElFTXhOamN1TXpJMExERTRMamc1T1NBeE5qY3VNelEzTERFNExqa3pOeUF4TmpjdU16UTNMREU0TGprM09TQk1NVFkzTGpNME55dzJPUzQ0TlNCRE1UWTNMak0wTnl3Mk9TNDRPVEVnTVRZM0xqTXlOQ3cyT1M0NU15QXhOamN1TWpnNExEWTVMamsxSUV3eE16a3VPVFkzTERnMUxqY3lOU0JETVRNNUxqa3pPU3c0TlM0M05ERWdNVE01TGprd05TdzROUzQzTkRVZ01UTTVMamczTXl3NE5TNDNNelVnUXpFek9TNDRORElzT0RVdU56STFJREV6T1M0NE1UWXNPRFV1TnpBeUlERXpPUzQ0TURJc09EVXVOamN5SUV3eE16TXVNelF5TERjeExqVXdOQ0JETVRNeUxqazJOeXczTUM0Mk9ESWdNVE15TGpJNExEY3dMakl5T1NBeE16RXVOREE0TERjd0xqSXlPU0JETVRNd0xqTXhPU3czTUM0eU1qa2dNVEk1TGpBME5DdzNNQzQ1TVRVZ01USTNMamt3T0N3M01pNHhNU0JETVRJMkxqZzNOQ3czTXk0eUlERXlOaTR3TXpRc056UXVOalEzSURFeU5TNDJNRFlzTnpZdU1EZ3lJRXd4TVRrdU1UUTJMRGszTGpjd09TQkRNVEU1TGpFek55dzVOeTQzTXpnZ01URTVMakV4T0N3NU55NDNOaklnTVRFNUxqQTVNaXc1Tnk0M056Y2dURGt4TGpjM0xERXhNeTQxTlRFZ1F6a3hMamMxTWl3eE1UTXVOVFl4SURreExqY3pNaXd4TVRNdU5UWTNJRGt4TGpjeE1pd3hNVE11TlRZM0lFdzVNUzQzTVRJc01URXpMalUyTnlCYUlFMDVNUzQ0TWprc05qSXVOalEzSUV3NU1TNDRNamtzTVRFekxqSTBPQ0JNTVRFNExqa3pOU3c1Tnk0MU9UZ2dUREV5TlM0ek9ESXNOell1TURFMUlFTXhNalV1T0RJM0xEYzBMalV5TlNBeE1qWXVOalkwTERjekxqQTRNU0F4TWpjdU56TTVMRGN4TGprMUlFTXhNamd1T1RFNUxEY3dMamN3T0NBeE16QXVNalUyTERZNUxqazVOaUF4TXpFdU5EQTRMRFk1TGprNU5pQkRNVE15TGpNM055dzJPUzQ1T1RZZ01UTXpMakV6T1N3M01DNDBPVGNnTVRNekxqVTFOQ3czTVM0ME1EY2dUREV6T1M0NU5qRXNPRFV1TkRVNElFd3hOamN1TVRFekxEWTVMamM0TWlCTU1UWTNMakV4TXl3eE9TNHhPREVnVERreExqZ3lPU3cyTWk0Mk5EY2dURGt4TGpneU9TdzJNaTQyTkRjZ1dpSWdhV1E5SWtacGJHd3RNVFFpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRZNExqVTBNeXd4T1M0eU1UTWdUREUyT0M0MU5ETXNOekF1TURneklFd3hOREV1TWpJeExEZzFMamcxTnlCTU1UTTBMamMyTVN3M01TNDJPRGtnUXpFek15NDROVEVzTmprdU5qazBJREV6TVM0ek16TXNOamt1T1RVeElERXlPUzR4TXpjc056SXVNall6SUVNeE1qZ3VNRGd5TERjekxqTTNOQ0F4TWpjdU1qUTBMRGMwTGpneE9TQXhNall1T0RBM0xEYzJMakk0TWlCTU1USXdMak0wTml3NU55NDVNRGtnVERrekxqQXlOU3d4TVRNdU5qZ3pJRXc1TXk0d01qVXNOakl1T0RFeklFd3hOamd1TlRRekxERTVMakl4TXlJZ2FXUTlJa1pwYkd3dE1UVWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PVE11TURJMUxERXhNeTQ0SUVNNU15NHdNRFVzTVRFekxqZ2dPVEl1T1RnMExERXhNeTQzT1RVZ09USXVPVFkyTERFeE15NDNPRFVnUXpreUxqa3pNU3d4TVRNdU56WTBJRGt5TGprd09Dd3hNVE11TnpJMUlEa3lMamt3T0N3eE1UTXVOamcwSUV3NU1pNDVNRGdzTmpJdU9ERXpJRU01TWk0NU1EZ3NOakl1TnpjeElEa3lMamt6TVN3Mk1pNDNNek1nT1RJdU9UWTJMRFl5TGpjeE1pQk1NVFk0TGpRNE5Dd3hPUzR4TVRJZ1F6RTJPQzQxTWl3eE9TNHdPU0F4TmpndU5UWTFMREU1TGpBNUlERTJPQzQyTURFc01Ua3VNVEV5SUVNeE5qZ3VOak0zTERFNUxqRXpNaUF4TmpndU5qWXNNVGt1TVRjeElERTJPQzQyTml3eE9TNHlNVElnVERFMk9DNDJOaXczTUM0d09ETWdRekUyT0M0Mk5pdzNNQzR4TWpVZ01UWTRMall6Tnl3M01DNHhOalFnTVRZNExqWXdNU3czTUM0eE9EUWdUREUwTVM0eU9DdzROUzQ1TlRnZ1F6RTBNUzR5TlRFc09EVXVPVGMxSURFME1TNHlNVGNzT0RVdU9UYzVJREUwTVM0eE9EWXNPRFV1T1RZNElFTXhOREV1TVRVMExEZzFMamsxT0NBeE5ERXVNVEk1TERnMUxqa3pOaUF4TkRFdU1URTFMRGcxTGprd05pQk1NVE0wTGpZMU5TdzNNUzQzTXpnZ1F6RXpOQzR5T0N3M01DNDVNVFVnTVRNekxqVTVNeXczTUM0ME5qTWdNVE15TGpjeUxEY3dMalEyTXlCRE1UTXhMall6TWl3M01DNDBOak1nTVRNd0xqTTFOeXczTVM0eE5EZ2dNVEk1TGpJeU1TdzNNaTR6TkRRZ1F6RXlPQzR4T0RZc056TXVORE16SURFeU55NHpORGNzTnpRdU9EZ3hJREV5Tmk0NU1Ua3NOell1TXpFMUlFd3hNakF1TkRVNExEazNMamswTXlCRE1USXdMalExTERrM0xqazNNaUF4TWpBdU5ETXhMRGszTGprNU5pQXhNakF1TkRBMUxEazRMakF4SUV3NU15NHdPRE1zTVRFekxqYzROU0JET1RNdU1EWTFMREV4TXk0M09UVWdPVE11TURRMUxERXhNeTQ0SURrekxqQXlOU3d4TVRNdU9DQk1PVE11TURJMUxERXhNeTQ0SUZvZ1RUa3pMakUwTWl3Mk1pNDRPREVnVERrekxqRTBNaXd4TVRNdU5EZ3hJRXd4TWpBdU1qUTRMRGszTGpnek1pQk1NVEkyTGpZNU5TdzNOaTR5TkRnZ1F6RXlOeTR4TkN3M05DNDNOVGdnTVRJM0xqazNOeXczTXk0ek1UVWdNVEk1TGpBMU1pdzNNaTR4T0RNZ1F6RXpNQzR5TXpFc056QXVPVFF5SURFek1TNDFOamdzTnpBdU1qSTVJREV6TWk0M01pdzNNQzR5TWprZ1F6RXpNeTQyT0Rrc056QXVNakk1SURFek5DNDBOVElzTnpBdU56TXhJREV6TkM0NE5qY3NOekV1TmpReElFd3hOREV1TWpjMExEZzFMalk1TWlCTU1UWTRMalF5Tml3M01DNHdNVFlnVERFMk9DNDBNallzTVRrdU5ERTFJRXc1TXk0eE5ESXNOakl1T0RneElFdzVNeTR4TkRJc05qSXVPRGd4SUZvaUlHbGtQU0pHYVd4c0xURTJJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUyT1M0NExEY3dMakE0TXlCTU1UUXlMalEzT0N3NE5TNDROVGNnVERFek5pNHdNVGdzTnpFdU5qZzVJRU14TXpVdU1UQTRMRFk1TGpZNU5DQXhNekl1TlRrc05qa3VPVFV4SURFek1DNHpPVE1zTnpJdU1qWXpJRU14TWprdU16TTVMRGN6TGpNM05DQXhNamd1TlN3M05DNDRNVGtnTVRJNExqQTJOQ3czTmk0eU9ESWdUREV5TVM0Mk1ETXNPVGN1T1RBNUlFdzVOQzR5T0RJc01URXpMalk0TXlCTU9UUXVNamd5TERZeUxqZ3hNeUJNTVRZNUxqZ3NNVGt1TWpFeklFd3hOamt1T0N3M01DNHdPRE1nV2lJZ2FXUTlJa1pwYkd3dE1UY2lJR1pwYkd3OUlpTkdRVVpCUmtFaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PVFF1TWpneUxERXhNeTQ1TVRjZ1F6azBMakkwTVN3eE1UTXVPVEUzSURrMExqSXdNU3d4TVRNdU9UQTNJRGswTGpFMk5Td3hNVE11T0RnMklFTTVOQzR3T1RNc01URXpMamcwTlNBNU5DNHdORGdzTVRFekxqYzJOeUE1TkM0d05EZ3NNVEV6TGpZNE5DQk1PVFF1TURRNExEWXlMamd4TXlCRE9UUXVNRFE0TERZeUxqY3pJRGswTGpBNU15dzJNaTQyTlRJZ09UUXVNVFkxTERZeUxqWXhNU0JNTVRZNUxqWTRNeXd4T1M0d01TQkRNVFk1TGpjMU5Td3hPQzQ1TmprZ01UWTVMamcwTkN3eE9DNDVOamtnTVRZNUxqa3hOeXd4T1M0d01TQkRNVFk1TGprNE9Td3hPUzR3TlRJZ01UY3dMakF6TXl3eE9TNHhNamtnTVRjd0xqQXpNeXd4T1M0eU1USWdUREUzTUM0d016TXNOekF1TURneklFTXhOekF1TURNekxEY3dMakUyTmlBeE5qa3VPVGc1TERjd0xqSTBOQ0F4TmprdU9URTNMRGN3TGpJNE5TQk1NVFF5TGpVNU5TdzROaTR3TmlCRE1UUXlMalV6T0N3NE5pNHdPVElnTVRReUxqUTJPU3c0Tmk0eElERTBNaTQwTURjc09EWXVNRGdnUXpFME1pNHpORFFzT0RZdU1EWWdNVFF5TGpJNU15dzROaTR3TVRRZ01UUXlMakkyTml3NE5TNDVOVFFnVERFek5TNDRNRFVzTnpFdU56ZzJJRU14TXpVdU5EUTFMRGN3TGprNU55QXhNelF1T0RFekxEY3dMalU0SURFek15NDVOemNzTnpBdU5UZ2dRekV6TWk0NU1qRXNOekF1TlRnZ01UTXhMalkzTml3M01TNHlOVElnTVRNd0xqVTJNaXczTWk0ME1qUWdRekV5T1M0MU5DdzNNeTQxTURFZ01USTRMamN4TVN3M05DNDVNekVnTVRJNExqSTROeXczTmk0ek5EZ2dUREV5TVM0NE1qY3NPVGN1T1RjMklFTXhNakV1T0RFc09UZ3VNRE0wSURFeU1TNDNOekVzT1RndU1EZ3lJREV5TVM0M01pdzVPQzR4TVRJZ1REazBMak01T0N3eE1UTXVPRGcySUVNNU5DNHpOaklzTVRFekxqa3dOeUE1TkM0ek1qSXNNVEV6TGpreE55QTVOQzR5T0RJc01URXpMamt4TnlCTU9UUXVNamd5TERFeE15NDVNVGNnV2lCTk9UUXVOVEUxTERZeUxqazBPQ0JNT1RRdU5URTFMREV4TXk0eU56a2dUREV5TVM0ME1EWXNPVGN1TnpVMElFd3hNamN1T0RRc056WXVNakUxSUVNeE1qZ3VNamtzTnpRdU56QTRJREV5T1M0eE16Y3NOek11TWpRM0lERXpNQzR5TWpRc056SXVNVEF6SUVNeE16RXVOREkxTERjd0xqZ3pPQ0F4TXpJdU56a3pMRGN3TGpFeE1pQXhNek11T1RjM0xEY3dMakV4TWlCRE1UTTBMams1TlN3M01DNHhNVElnTVRNMUxqYzVOU3czTUM0Mk16Z2dNVE0yTGpJekxEY3hMalU1TWlCTU1UUXlMalU0TkN3NE5TNDFNallnVERFMk9TNDFOallzTmprdU9UUTRJRXd4TmprdU5UWTJMREU1TGpZeE55Qk1PVFF1TlRFMUxEWXlMamswT0NCTU9UUXVOVEUxTERZeUxqazBPQ0JhSWlCcFpEMGlSbWxzYkMweE9DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNRGt1T0RrMExEa3lMamswTXlCTU1UQTVMamc1TkN3NU1pNDVORE1nUXpFd09DNHhNaXc1TWk0NU5ETWdNVEEyTGpZMU15dzVNaTR5TVRnZ01UQTFMalkxTERrd0xqZ3lNeUJETVRBMUxqVTRNeXc1TUM0M016RWdNVEExTGpVNU15dzVNQzQyTVNBeE1EVXVOamN6TERrd0xqVXlPU0JETVRBMUxqYzFNeXc1TUM0ME5EZ2dNVEExTGpnNExEa3dMalEwSURFd05TNDVOelFzT1RBdU5UQTJJRU14TURZdU56VTBMRGt4TGpBMU15QXhNRGN1TmpjNUxEa3hMak16TXlBeE1EZ3VOekkwTERreExqTXpNeUJETVRFd0xqQTBOeXc1TVM0ek16TWdNVEV4TGpRM09DdzVNQzQ0T1RRZ01URXlMams0TERrd0xqQXlOeUJETVRFNExqSTVNU3c0Tmk0NU5pQXhNakl1TmpFeExEYzVMalV3T1NBeE1qSXVOakV4TERjekxqUXhOaUJETVRJeUxqWXhNU3czTVM0ME9Ea2dNVEl5TGpFMk9TdzJPUzQ0TlRZZ01USXhMak16TXl3Mk9DNDJPVElnUXpFeU1TNHlOallzTmpndU5pQXhNakV1TWpjMkxEWTRMalEzTXlBeE1qRXVNelUyTERZNExqTTVNaUJETVRJeExqUXpOaXcyT0M0ek1URWdNVEl4TGpVMk15dzJPQzR5T1RrZ01USXhMalkxTml3Mk9DNHpOalVnUXpFeU15NHpNamNzTmprdU5UTTNJREV5TkM0eU5EY3NOekV1TnpRMklERXlOQzR5TkRjc056UXVOVGcwSUVNeE1qUXVNalEzTERnd0xqZ3lOaUF4TVRrdU9ESXhMRGc0TGpRME55QXhNVFF1TXpneUxEa3hMalU0TnlCRE1URXlMamd3T0N3NU1pNDBPVFVnTVRFeExqSTVPQ3c1TWk0NU5ETWdNVEE1TGpnNU5DdzVNaTQ1TkRNZ1RERXdPUzQ0T1RRc09USXVPVFF6SUZvZ1RURXdOaTQ1TWpVc09URXVOREF4SUVNeE1EY3VOek00TERreUxqQTFNaUF4TURndU56UTFMRGt5TGpJM09DQXhNRGt1T0RrekxEa3lMakkzT0NCTU1UQTVMamc1TkN3NU1pNHlOemdnUXpFeE1TNHlNVFVzT1RJdU1qYzRJREV4TWk0Mk5EY3NPVEV1T1RVeElERXhOQzR4TkRnc09URXVNRGcwSUVNeE1Ua3VORFU1TERnNExqQXhOeUF4TWpNdU56Z3NPREF1TmpJeElERXlNeTQzT0N3M05DNDFNamdnUXpFeU15NDNPQ3czTWk0MU5Ea2dNVEl6TGpNeE55dzNNQzQ1TWprZ01USXlMalExTkN3Mk9TNDNOamNnUXpFeU1pNDROalVzTnpBdU9EQXlJREV5TXk0d056a3NOekl1TURReUlERXlNeTR3Tnprc056TXVOREF5SUVNeE1qTXVNRGM1TERjNUxqWTBOU0F4TVRndU5qVXpMRGczTGpJNE5TQXhNVE11TWpFMExEa3dMalF5TlNCRE1URXhMalkwTERreExqTXpOQ0F4TVRBdU1UTXNPVEV1TnpReUlERXdPQzQzTWpRc09URXVOelF5SUVNeE1EZ3VNRGd6TERreExqYzBNaUF4TURjdU5EZ3hMRGt4TGpVNU15QXhNRFl1T1RJMUxEa3hMalF3TVNCTU1UQTJMamt5TlN3NU1TNDBNREVnV2lJZ2FXUTlJa1pwYkd3dE1Ua2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV6TGpBNU55dzVNQzR5TXlCRE1URTRMalE0TVN3NE55NHhNaklnTVRJeUxqZzBOU3czT1M0MU9UUWdNVEl5TGpnME5TdzNNeTQwTVRZZ1F6RXlNaTQ0TkRVc056RXVNelkxSURFeU1pNHpOaklzTmprdU56STBJREV5TVM0MU1qSXNOamd1TlRVMklFTXhNVGt1TnpNNExEWTNMak13TkNBeE1UY3VNVFE0TERZM0xqTTJNaUF4TVRRdU1qWTFMRFk1TGpBeU5pQkRNVEE0TGpnNE1TdzNNaTR4TXpRZ01UQTBMalV4Tnl3M09TNDJOaklnTVRBMExqVXhOeXc0TlM0NE5DQkRNVEEwTGpVeE55dzROeTQ0T1RFZ01UQTFMRGc1TGpVek1pQXhNRFV1T0RRc09UQXVOeUJETVRBM0xqWXlOQ3c1TVM0NU5USWdNVEV3TGpJeE5DdzVNUzQ0T1RRZ01URXpMakE1Tnl3NU1DNHlNeUlnYVdROUlrWnBiR3d0TWpBaUlHWnBiR3c5SWlOR1FVWkJSa0VpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UQTRMamN5TkN3NU1TNDJNVFFnVERFd09DNDNNalFzT1RFdU5qRTBJRU14TURjdU5UZ3lMRGt4TGpZeE5DQXhNRFl1TlRZMkxEa3hMalF3TVNBeE1EVXVOekExTERrd0xqYzVOeUJETVRBMUxqWTROQ3c1TUM0M09ETWdNVEExTGpZMk5TdzVNQzQ0TVRFZ01UQTFMalkxTERrd0xqYzVJRU14TURRdU56VTJMRGc1TGpVME5pQXhNRFF1TWpnekxEZzNMamcwTWlBeE1EUXVNamd6TERnMUxqZ3hOeUJETVRBMExqSTRNeXczT1M0MU56VWdNVEE0TGpjd09TdzNNUzQ1TlRNZ01URTBMakUwT0N3Mk9DNDRNVElnUXpFeE5TNDNNaklzTmpjdU9UQTBJREV4Tnk0eU16SXNOamN1TkRRNUlERXhPQzQyTXpnc05qY3VORFE1SUVNeE1Ua3VOemdzTmpjdU5EUTVJREV5TUM0M09UWXNOamN1TnpVNElERXlNUzQyTlRZc05qZ3VNell5SUVNeE1qRXVOamM0TERZNExqTTNOeUF4TWpFdU5qazNMRFk0TGpNNU55QXhNakV1TnpFeUxEWTRMalF4T0NCRE1USXlMall3Tml3Mk9TNDJOaklnTVRJekxqQTNPU3czTVM0ek9TQXhNak11TURjNUxEY3pMalF4TlNCRE1USXpMakEzT1N3M09TNDJOVGdnTVRFNExqWTFNeXc0Tnk0eE9UZ2dNVEV6TGpJeE5DdzVNQzR6TXpnZ1F6RXhNUzQyTkN3NU1TNHlORGNnTVRFd0xqRXpMRGt4TGpZeE5DQXhNRGd1TnpJMExEa3hMall4TkNCTU1UQTRMamN5TkN3NU1TNDJNVFFnV2lCTk1UQTJMakF3Tml3NU1DNDFNRFVnUXpFd05pNDNPQ3c1TVM0d016Y2dNVEEzTGpZNU5DdzVNUzR5T0RFZ01UQTRMamN5TkN3NU1TNHlPREVnUXpFeE1DNHdORGNzT1RFdU1qZ3hJREV4TVM0ME56Z3NPVEF1T0RZNElERXhNaTQ1T0N3NU1DNHdNREVnUXpFeE9DNHlPVEVzT0RZdU9UTTFJREV5TWk0Mk1URXNOemt1TkRrMklERXlNaTQyTVRFc056TXVOREF6SUVNeE1qSXVOakV4TERjeExqUTVOQ0F4TWpJdU1UYzNMRFk1TGpnNElERXlNUzR6TlRZc05qZ3VOekU0SUVNeE1qQXVOVGd5TERZNExqRTROU0F4TVRrdU5qWTRMRFkzTGpreE9TQXhNVGd1TmpNNExEWTNMamt4T1NCRE1URTNMak14TlN3Mk55NDVNVGtnTVRFMUxqZzRNeXcyT0M0ek5pQXhNVFF1TXpneUxEWTVMakl5TnlCRE1UQTVMakEzTVN3M01pNHlPVE1nTVRBMExqYzFNU3czT1M0M016TWdNVEEwTGpjMU1TdzROUzQ0TWpZZ1F6RXdOQzQzTlRFc09EY3VOek0xSURFd05TNHhPRFVzT0RrdU16UXpJREV3Tmk0d01EWXNPVEF1TlRBMUlFd3hNRFl1TURBMkxEa3dMalV3TlNCYUlpQnBaRDBpUm1sc2JDMHlNU0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TkRrdU16RTRMRGN1TWpZeUlFd3hNemt1TXpNMExERTJMakUwSUV3eE5UVXVNakkzTERJM0xqRTNNU0JNTVRZd0xqZ3hOaXd5TVM0d05Ua2dUREUwT1M0ek1UZ3NOeTR5TmpJaUlHbGtQU0pHYVd4c0xUSXlJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUyT1M0Mk56WXNNVE11T0RRZ1RERTFPUzQ1TWpnc01Ua3VORFkzSUVNeE5UWXVNamcyTERJeExqVTNJREUxTUM0MExESXhMalU0SURFME5pNDNPREVzTVRrdU5Ea3hJRU14TkRNdU1UWXhMREUzTGpRd01pQXhORE11TVRnc01UUXVNREF6SURFME5pNDRNaklzTVRFdU9TQk1NVFUyTGpNeE55dzJMakk1TWlCTU1UUTVMalU0T0N3eUxqUXdOeUJNTmpjdU56VXlMRFE1TGpRM09DQk1NVEV6TGpZM05TdzNOUzQ1T1RJZ1RERXhOaTQzTlRZc056UXVNakV6SUVNeE1UY3VNemczTERjekxqZzBPQ0F4TVRjdU5qSTFMRGN6TGpNeE5TQXhNVGN1TXpjMExEY3lMamd5TXlCRE1URTFMakF4Tnl3Mk9DNHhPVEVnTVRFMExqYzRNU3cyTXk0eU56Y2dNVEUyTGpZNU1TdzFPQzQxTmpFZ1F6RXlNaTR6TWprc05EUXVOalF4SURFME1TNHlMRE16TGpjME5pQXhOalV1TXpBNUxETXdMalE1TVNCRE1UY3pMalEzT0N3eU9TNHpPRGdnTVRneExqazRPU3d5T1M0MU1qUWdNVGt3TGpBeE15d3pNQzQ0T0RVZ1F6RTVNQzQ0TmpVc016RXVNRE1nTVRreExqYzRPU3d6TUM0NE9UTWdNVGt5TGpReUxETXdMalV5T0NCTU1UazFMalV3TVN3eU9DNDNOU0JNTVRZNUxqWTNOaXd4TXk0NE5DSWdhV1E5SWtacGJHd3RNak1pSUdacGJHdzlJaU5HUVVaQlJrRWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFekxqWTNOU3czTmk0ME5Ua2dRekV4TXk0MU9UUXNOell1TkRVNUlERXhNeTQxTVRRc056WXVORE00SURFeE15NDBORElzTnpZdU16azNJRXcyTnk0MU1UZ3NORGt1T0RneUlFTTJOeTR6TnpRc05Ea3VOems1SURZM0xqSTROQ3cwT1M0Mk5EVWdOamN1TWpnMUxEUTVMalEzT0NCRE5qY3VNamcxTERRNUxqTXhNU0EyTnk0ek56UXNORGt1TVRVM0lEWTNMalV4T1N3ME9TNHdOek1nVERFME9TNHpOVFVzTWk0d01ESWdRekUwT1M0ME9Ua3NNUzQ1TVRrZ01UUTVMalkzTnl3eExqa3hPU0F4TkRrdU9ESXhMREl1TURBeUlFd3hOVFl1TlRVc05TNDRPRGNnUXpFMU5pNDNOelFzTmk0d01UY2dNVFUyTGpnMUxEWXVNekF5SURFMU5pNDNNaklzTmk0MU1qWWdRekUxTmk0MU9USXNOaTQzTkRrZ01UVTJMak13Tnl3MkxqZ3lOaUF4TlRZdU1EZ3pMRFl1TmprMklFd3hORGt1TlRnM0xESXVPVFEySUV3Mk9DNDJPRGNzTkRrdU5EYzVJRXd4TVRNdU5qYzFMRGMxTGpRMU1pQk1NVEUyTGpVeU15dzNNeTQ0TURnZ1F6RXhOaTQzTVRVc056TXVOamszSURFeE55NHhORE1zTnpNdU16azVJREV4Tmk0NU5UZ3NOek11TURNMUlFTXhNVFF1TlRReUxEWTRMakk0TnlBeE1UUXVNeXcyTXk0eU1qRWdNVEUyTGpJMU9DdzFPQzR6T0RVZ1F6RXhPUzR3TmpRc05URXVORFU0SURFeU5TNHhORE1zTkRVdU1UUXpJREV6TXk0NE5DdzBNQzR4TWpJZ1F6RTBNaTQwT1Rjc016VXVNVEkwSURFMU15NHpOVGdzTXpFdU5qTXpJREUyTlM0eU5EY3NNekF1TURJNElFTXhOek11TkRRMUxESTRMamt5TVNBeE9ESXVNRE0zTERJNUxqQTFPQ0F4T1RBdU1Ea3hMRE13TGpReU5TQkRNVGt3TGpnekxETXdMalUxSURFNU1TNDJOVElzTXpBdU5ETXlJREU1TWk0eE9EWXNNekF1TVRJMElFd3hPVFF1TlRZM0xESTRMamMxSUV3eE5qa3VORFF5TERFMExqSTBOQ0JETVRZNUxqSXhPU3d4TkM0eE1UVWdNVFk1TGpFME1pd3hNeTQ0TWprZ01UWTVMakkzTVN3eE15NDJNRFlnUXpFMk9TNDBMREV6TGpNNE1pQXhOamt1TmpnMUxERXpMak13TmlBeE5qa3VPVEE1TERFekxqUXpOU0JNTVRrMUxqY3pOQ3d5T0M0ek5EVWdRekU1TlM0NE56a3NNamd1TkRJNElERTVOUzQ1Tmpnc01qZ3VOVGd6SURFNU5TNDVOamdzTWpndU56VWdRekU1TlM0NU5qZ3NNamd1T1RFMklERTVOUzQ0Tnprc01qa3VNRGN4SURFNU5TNDNNelFzTWprdU1UVTBJRXd4T1RJdU5qVXpMRE13TGprek15QkRNVGt4TGprek1pd3pNUzR6TlNBeE9UQXVPRGtzTXpFdU5UQTRJREU0T1M0NU16VXNNekV1TXpRMklFTXhPREV1T1RjeUxESTVMams1TlNBeE56TXVORGM0TERJNUxqZzJJREUyTlM0ek56SXNNekF1T1RVMElFTXhOVE11TmpBeUxETXlMalUwTXlBeE5ESXVPRFlzTXpVdU9Ua3pJREV6TkM0ek1EY3NOREF1T1RNeElFTXhNalV1TnprekxEUTFMamcwTnlBeE1Ua3VPRFV4TERVeUxqQXdOQ0F4TVRjdU1USTBMRFU0TGpjek5pQkRNVEUxTGpJM0xEWXpMak14TkNBeE1UVXVOVEF4TERZNExqRXhNaUF4TVRjdU56a3NOekl1TmpFeElFTXhNVGd1TVRZc056TXVNek0ySURFeE55NDRORFVzTnpRdU1USTBJREV4Tmk0NU9TdzNOQzQyTVRjZ1RERXhNeTQ1TURrc056WXVNemszSUVNeE1UTXVPRE0yTERjMkxqUXpPQ0F4TVRNdU56VTJMRGMyTGpRMU9TQXhNVE11TmpjMUxEYzJMalExT1NJZ2FXUTlJa1pwYkd3dE1qUWlJR1pwYkd3OUlpTTBOVFZCTmpRaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFV6TGpNeE5pd3lNUzR5TnprZ1F6RTFNQzQ1TURNc01qRXVNamM1SURFME9DNDBPVFVzTWpBdU56VXhJREUwTmk0Mk5qUXNNVGt1TmpreklFTXhORFF1T0RRMkxERTRMalkwTkNBeE5ETXVPRFEwTERFM0xqSXpNaUF4TkRNdU9EUTBMREUxTGpjeE9DQkRNVFF6TGpnME5Dd3hOQzR4T1RFZ01UUTBMamcyTERFeUxqYzJNeUF4TkRZdU56QTFMREV4TGpZNU9DQk1NVFUyTGpFNU9DdzJMakE1TVNCRE1UVTJMak13T1N3MkxqQXlOU0F4TlRZdU5EVXlMRFl1TURZeUlERTFOaTQxTVRnc05pNHhOek1nUXpFMU5pNDFPRE1zTmk0eU9EUWdNVFUyTGpVME55dzJMalF5TnlBeE5UWXVORE0yTERZdU5Ea3pJRXd4TkRZdU9UUXNNVEl1TVRBeUlFTXhORFV1TWpRMExERXpMakE0TVNBeE5EUXVNekV5TERFMExqTTJOU0F4TkRRdU16RXlMREUxTGpjeE9DQkRNVFEwTGpNeE1pd3hOeTR3TlRnZ01UUTFMakl6TERFNExqTXlOaUF4TkRZdU9EazNMREU1TGpJNE9TQkRNVFV3TGpRME5pd3lNUzR6TXpnZ01UVTJMakkwTERJeExqTXlOeUF4TlRrdU9ERXhMREU1TGpJMk5TQk1NVFk1TGpVMU9Td3hNeTQyTXpjZ1F6RTJPUzQyTnl3eE15NDFOek1nTVRZNUxqZ3hNeXd4TXk0Mk1URWdNVFk1TGpnM09Dd3hNeTQzTWpNZ1F6RTJPUzQ1TkRNc01UTXVPRE0wSURFMk9TNDVNRFFzTVRNdU9UYzNJREUyT1M0M09UTXNNVFF1TURReUlFd3hOakF1TURRMUxERTVMalkzSUVNeE5UZ3VNVGczTERJd0xqYzBNaUF4TlRVdU56UTVMREl4TGpJM09TQXhOVE11TXpFMkxESXhMakkzT1NJZ2FXUTlJa1pwYkd3dE1qVWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV6TGpZM05TdzNOUzQ1T1RJZ1REWTNMamMyTWl3ME9TNDBPRFFpSUdsa1BTSkdhV3hzTFRJMklpQm1hV3hzUFNJak5EVTFRVFkwSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURXhNeTQyTnpVc056WXVNelF5SUVNeE1UTXVOakUxTERjMkxqTTBNaUF4TVRNdU5UVTFMRGMyTGpNeU55QXhNVE11TlN3M05pNHlPVFVnVERZM0xqVTROeXcwT1M0M09EY2dRelkzTGpReE9TdzBPUzQyT1NBMk55NHpOaklzTkRrdU5EYzJJRFkzTGpRMU9TdzBPUzR6TURrZ1F6WTNMalUxTml3ME9TNHhOREVnTmpjdU56Y3NORGt1TURneklEWTNMamt6Tnl3ME9TNHhPQ0JNTVRFekxqZzFMRGMxTGpZNE9DQkRNVEUwTGpBeE9DdzNOUzQzT0RVZ01URTBMakEzTlN3M05pQXhNVE11T1RjNExEYzJMakUyTnlCRE1URXpMamt4TkN3M05pNHlOemtnTVRFekxqYzVOaXczTmk0ek5ESWdNVEV6TGpZM05TdzNOaTR6TkRJaUlHbGtQU0pHYVd4c0xUSTNJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFkzTGpjMk1pdzBPUzQwT0RRZ1REWTNMamMyTWl3eE1ETXVORGcxSUVNMk55NDNOaklzTVRBMExqVTNOU0EyT0M0MU16SXNNVEExTGprd015QTJPUzQwT0RJc01UQTJMalExTWlCTU1URXhMamsxTlN3eE16QXVPVGN6SUVNeE1USXVPVEExTERFek1TNDFNaklnTVRFekxqWTNOU3d4TXpFdU1EZ3pJREV4TXk0Mk56VXNNVEk1TGprNU15Qk1NVEV6TGpZM05TdzNOUzQ1T1RJaUlHbGtQU0pHYVd4c0xUSTRJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV4TWk0M01qY3NNVE14TGpVMk1TQkRNVEV5TGpRekxERXpNUzQxTmpFZ01URXlMakV3Tnl3eE16RXVORFkySURFeE1TNDNPQ3d4TXpFdU1qYzJJRXcyT1M0ek1EY3NNVEEyTGpjMU5TQkROamd1TWpRMExERXdOaTR4TkRJZ05qY3VOREV5TERFd05DNDNNRFVnTmpjdU5ERXlMREV3TXk0ME9EVWdURFkzTGpReE1pdzBPUzQwT0RRZ1F6WTNMalF4TWl3ME9TNHlPU0EyTnk0MU5qa3NORGt1TVRNMElEWTNMamMyTWl3ME9TNHhNelFnUXpZM0xqazFOaXcwT1M0eE16UWdOamd1TVRFekxEUTVMakk1SURZNExqRXhNeXcwT1M0ME9EUWdURFk0TGpFeE15d3hNRE11TkRnMUlFTTJPQzR4TVRNc01UQTBMalEwTlNBMk9DNDRNaXd4TURVdU5qWTFJRFk1TGpZMU55d3hNRFl1TVRRNElFd3hNVEl1TVRNc01UTXdMalkzSUVNeE1USXVORGMwTERFek1DNDROamdnTVRFeUxqYzVNU3d4TXpBdU9URXpJREV4TXl3eE16QXVOemt5SUVNeE1UTXVNakEyTERFek1DNDJOek1nTVRFekxqTXlOU3d4TXpBdU16Z3hJREV4TXk0ek1qVXNNVEk1TGprNU15Qk1NVEV6TGpNeU5TdzNOUzQ1T1RJZ1F6RXhNeTR6TWpVc056VXVOems0SURFeE15NDBPRElzTnpVdU5qUXhJREV4TXk0Mk56VXNOelV1TmpReElFTXhNVE11T0RZNUxEYzFMalkwTVNBeE1UUXVNREkxTERjMUxqYzVPQ0F4TVRRdU1ESTFMRGMxTGprNU1pQk1NVEUwTGpBeU5Td3hNamt1T1RreklFTXhNVFF1TURJMUxERXpNQzQyTkRnZ01URXpMamM0Tml3eE16RXVNVFEzSURFeE15NHpOU3d4TXpFdU16azVJRU14TVRNdU1UWXlMREV6TVM0MU1EY2dNVEV5TGprMU1pd3hNekV1TlRZeElERXhNaTQzTWpjc01UTXhMalUyTVNJZ2FXUTlJa1pwYkd3dE1qa2lJR1pwYkd3OUlpTTBOVFZCTmpRaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV5TGpnMkxEUXdMalV4TWlCRE1URXlMamcyTERRd0xqVXhNaUF4TVRJdU9EWXNOREF1TlRFeUlERXhNaTQ0TlRrc05EQXVOVEV5SUVNeE1UQXVOVFF4TERRd0xqVXhNaUF4TURndU16WXNNemt1T1RrZ01UQTJMamN4Tnl3ek9TNHdOREVnUXpFd05TNHdNVElzTXpndU1EVTNJREV3TkM0d056UXNNell1TnpJMklERXdOQzR3TnpRc016VXVNamt5SUVNeE1EUXVNRGMwTERNekxqZzBOeUF4TURVdU1ESTJMRE15TGpVd01TQXhNRFl1TnpVMExETXhMalV3TkNCTU1URTRMamM1TlN3eU5DNDFOVEVnUXpFeU1DNDBOak1zTWpNdU5UZzVJREV5TWk0Mk5qa3NNak11TURVNElERXlOUzR3TURjc01qTXVNRFU0SUVNeE1qY3VNekkxTERJekxqQTFPQ0F4TWprdU5UQTJMREl6TGpVNE1TQXhNekV1TVRVc01qUXVOVE1nUXpFek1pNDROVFFzTWpVdU5URTBJREV6TXk0M09UTXNNall1T0RRMUlERXpNeTQzT1RNc01qZ3VNamM0SUVNeE16TXVOemt6TERJNUxqY3lOQ0F4TXpJdU9EUXhMRE14TGpBMk9TQXhNekV1TVRFekxETXlMakEyTnlCTU1URTVMakEzTVN3ek9TNHdNVGtnUXpFeE55NDBNRE1zTXprdU9UZ3lJREV4TlM0eE9UY3NOREF1TlRFeUlERXhNaTQ0Tml3ME1DNDFNVElnVERFeE1pNDROaXcwTUM0MU1USWdXaUJOTVRJMUxqQXdOeXd5TXk0M05Ua2dRekV5TWk0M09Td3lNeTQzTlRrZ01USXdMamN3T1N3eU5DNHlOVFlnTVRFNUxqRTBOaXd5TlM0eE5UZ2dUREV3Tnk0eE1EUXNNekl1TVRFZ1F6RXdOUzQyTURJc016SXVPVGM0SURFd05DNDNOelFzTXpRdU1UQTRJREV3TkM0M056UXNNelV1TWpreUlFTXhNRFF1TnpjMExETTJMalEyTlNBeE1EVXVOVGc1TERNM0xqVTRNU0F4TURjdU1EWTNMRE00TGpRek5DQkRNVEE0TGpZd05Td3pPUzR6TWpNZ01URXdMalkyTXl3ek9TNDRNVElnTVRFeUxqZzFPU3d6T1M0NE1USWdUREV4TWk0NE5pd3pPUzQ0TVRJZ1F6RXhOUzR3TnpZc016a3VPREV5SURFeE55NHhOVGdzTXprdU16RTFJREV4T0M0M01qRXNNemd1TkRFeklFd3hNekF1TnpZeUxETXhMalEySUVNeE16SXVNalkwTERNd0xqVTVNeUF4TXpNdU1Ea3lMREk1TGpRMk15QXhNek11TURreUxESTRMakkzT0NCRE1UTXpMakE1TWl3eU55NHhNRFlnTVRNeUxqSTNPQ3d5TlM0NU9TQXhNekF1T0N3eU5TNHhNellnUXpFeU9TNHlOakVzTWpRdU1qUTRJREV5Tnk0eU1EUXNNak11TnpVNUlERXlOUzR3TURjc01qTXVOelU1SUV3eE1qVXVNREEzTERJekxqYzFPU0JhSWlCcFpEMGlSbWxzYkMwek1DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhOalV1TmpNc01UWXVNakU1SUV3eE5Ua3VPRGsyTERFNUxqVXpJRU14TlRZdU56STVMREl4TGpNMU9DQXhOVEV1TmpFc01qRXVNelkzSURFME9DNDBOak1zTVRrdU5UVWdRekUwTlM0ek1UWXNNVGN1TnpNeklERTBOUzR6TXpJc01UUXVOemM0SURFME9DNDBPVGtzTVRJdU9UUTVJRXd4TlRRdU1qTXpMRGt1TmpNNUlFd3hOalV1TmpNc01UWXVNakU1SWlCcFpEMGlSbWxzYkMwek1TSWdabWxzYkQwaUkwWkJSa0ZHUVNJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhOVFF1TWpNekxERXdMalEwT0NCTU1UWTBMakl5T0N3eE5pNHlNVGtnVERFMU9TNDFORFlzTVRndU9USXpJRU14TlRndU1URXlMREU1TGpjMUlERTFOaTR4T1RRc01qQXVNakEySURFMU5DNHhORGNzTWpBdU1qQTJJRU14TlRJdU1URTRMREl3TGpJd05pQXhOVEF1TWpJMExERTVMamMxTnlBeE5EZ3VPREUwTERFNExqazBNeUJETVRRM0xqVXlOQ3d4T0M0eE9Ua2dNVFEyTGpneE5Dd3hOeTR5TkRrZ01UUTJMamd4TkN3eE5pNHlOamtnUXpFME5pNDRNVFFzTVRVdU1qYzRJREUwTnk0MU16Y3NNVFF1TXpFMElERTBPQzQ0TlN3eE15NDFOVFlnVERFMU5DNHlNek1zTVRBdU5EUTRJRTB4TlRRdU1qTXpMRGt1TmpNNUlFd3hORGd1TkRrNUxERXlMamswT1NCRE1UUTFMak16TWl3eE5DNDNOemdnTVRRMUxqTXhOaXd4Tnk0M016TWdNVFE0TGpRMk15d3hPUzQxTlNCRE1UVXdMakF6TVN3eU1DNDBOVFVnTVRVeUxqQTROaXd5TUM0NU1EY2dNVFUwTGpFME55d3lNQzQ1TURjZ1F6RTFOaTR5TWpRc01qQXVPVEEzSURFMU9DNHpNRFlzTWpBdU5EUTNJREUxT1M0NE9UWXNNVGt1TlRNZ1RERTJOUzQyTXl3eE5pNHlNVGtnVERFMU5DNHlNek1zT1M0Mk16a2lJR2xrUFNKR2FXeHNMVE15SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFME5TNDBORFVzTnpJdU5qWTNJRXd4TkRVdU5EUTFMRGN5TGpZMk55QkRNVFF6TGpZM01pdzNNaTQyTmpjZ01UUXlMakl3TkN3M01TNDRNVGNnTVRReExqSXdNaXczTUM0ME1qSWdRekUwTVM0eE16VXNOekF1TXpNZ01UUXhMakUwTlN3M01DNHhORGNnTVRReExqSXlOU3czTUM0d05qWWdRekUwTVM0ek1EVXNOamt1T1RnMUlERTBNUzQwTXpJc05qa3VPVFEySURFME1TNDFNalVzTnpBdU1ERXhJRU14TkRJdU16QTJMRGN3TGpVMU9TQXhORE11TWpNeExEY3dMamd5TXlBeE5EUXVNamMyTERjd0xqZ3lNaUJETVRRMUxqVTVPQ3czTUM0NE1qSWdNVFEzTGpBekxEY3dMak0zTmlBeE5EZ3VOVE15TERZNUxqVXdPU0JETVRVekxqZzBNaXcyTmk0ME5ETWdNVFU0TGpFMk15dzFPQzQ1T0RjZ01UVTRMakUyTXl3MU1pNDRPVFFnUXpFMU9DNHhOak1zTlRBdU9UWTNJREUxTnk0M01qRXNORGt1TXpNeUlERTFOaTQ0T0RRc05EZ3VNVFk0SUVNeE5UWXVPREU0TERRNExqQTNOaUF4TlRZdU9ESTRMRFEzTGprME9DQXhOVFl1T1RBNExEUTNMamcyTnlCRE1UVTJMams0T0N3ME55NDNPRFlnTVRVM0xqRXhOQ3cwTnk0M056UWdNVFUzTGpJd09DdzBOeTQ0TkNCRE1UVTRMamczT0N3ME9TNHdNVElnTVRVNUxqYzVPQ3cxTVM0eU1pQXhOVGt1TnprNExEVTBMakExT1NCRE1UVTVMamM1T0N3Mk1DNHpNREVnTVRVMUxqTTNNeXcyT0M0d05EWWdNVFE1TGprek15dzNNUzR4T0RZZ1F6RTBPQzR6Tml3M01pNHdPVFFnTVRRMkxqZzFMRGN5TGpZMk55QXhORFV1TkRRMUxEY3lMalkyTnlCTU1UUTFMalEwTlN3M01pNDJOamNnV2lCTk1UUXlMalEzTml3M01TQkRNVFF6TGpJNUxEY3hMalkxTVNBeE5EUXVNamsyTERjeUxqQXdNaUF4TkRVdU5EUTFMRGN5TGpBd01pQkRNVFEyTGpjMk55dzNNaTR3TURJZ01UUTRMakU1T0N3M01TNDFOU0F4TkRrdU55dzNNQzQyT0RJZ1F6RTFOUzR3TVN3Mk55NDJNVGNnTVRVNUxqTXpNU3cyTUM0eE5Ua2dNVFU1TGpNek1TdzFOQzR3TmpVZ1F6RTFPUzR6TXpFc05USXVNRGcxSURFMU9DNDROamdzTlRBdU5ETTFJREUxT0M0d01EWXNORGt1TWpjeUlFTXhOVGd1TkRFM0xEVXdMak13TnlBeE5UZ3VOak1zTlRFdU5UTXlJREUxT0M0Mk15dzFNaTQ0T1RJZ1F6RTFPQzQyTXl3MU9TNHhNelFnTVRVMExqSXdOU3cyTmk0M05qY2dNVFE0TGpjMk5TdzJPUzQ1TURjZ1F6RTBOeTR4T1RJc056QXVPREUySURFME5TNDJPREVzTnpFdU1qZ3pJREUwTkM0eU56WXNOekV1TWpneklFTXhORE11TmpNMExEY3hMakk0TXlBeE5ETXVNRE16TERjeExqRTVNaUF4TkRJdU5EYzJMRGN4SUV3eE5ESXVORGMyTERjeElGb2lJR2xrUFNKR2FXeHNMVE16SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFME9DNDJORGdzTmprdU56QTBJRU14TlRRdU1ETXlMRFkyTGpVNU5pQXhOVGd1TXprMkxEVTVMakEyT0NBeE5UZ3VNemsyTERVeUxqZzVNU0JETVRVNExqTTVOaXcxTUM0NE16a2dNVFUzTGpreE15dzBPUzR4T1RnZ01UVTNMakEzTkN3ME9DNHdNeUJETVRVMUxqSTRPU3cwTmk0M056Z2dNVFV5TGpZNU9TdzBOaTQ0TXpZZ01UUTVMamd4Tml3ME9DNDFNREVnUXpFME5DNDBNek1zTlRFdU5qQTVJREUwTUM0d05qZ3NOVGt1TVRNM0lERTBNQzR3Tmpnc05qVXVNekUwSUVNeE5EQXVNRFk0TERZM0xqTTJOU0F4TkRBdU5UVXlMRFk1TGpBd05pQXhOREV1TXpreExEY3dMakUzTkNCRE1UUXpMakUzTml3M01TNDBNamNnTVRRMUxqYzJOU3czTVM0ek5qa2dNVFE0TGpZME9DdzJPUzQzTURRaUlHbGtQU0pHYVd4c0xUTTBJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUwTkM0eU56WXNOekV1TWpjMklFd3hORFF1TWpjMkxEY3hMakkzTmlCRE1UUXpMakV6TXl3M01TNHlOellnTVRReUxqRXhPQ3czTUM0NU5qa2dNVFF4TGpJMU55dzNNQzR6TmpVZ1F6RTBNUzR5TXpZc056QXVNelV4SURFME1TNHlNVGNzTnpBdU16TXlJREUwTVM0eU1ESXNOekF1TXpFeElFTXhOREF1TXpBM0xEWTVMakEyTnlBeE16a3VPRE0xTERZM0xqTXpPU0F4TXprdU9ETTFMRFkxTGpNeE5DQkRNVE01TGpnek5TdzFPUzR3TnpNZ01UUTBMakkyTERVeExqUXpPU0F4TkRrdU55dzBPQzR5T1RnZ1F6RTFNUzR5TnpNc05EY3VNemtnTVRVeUxqYzROQ3cwTmk0NU1qa2dNVFUwTGpFNE9TdzBOaTQ1TWprZ1F6RTFOUzR6TXpJc05EWXVPVEk1SURFMU5pNHpORGNzTkRjdU1qTTJJREUxTnk0eU1EZ3NORGN1T0RNNUlFTXhOVGN1TWpJNUxEUTNMamcxTkNBeE5UY3VNalE0TERRM0xqZzNNeUF4TlRjdU1qWXpMRFEzTGpnNU5DQkRNVFU0TGpFMU55dzBPUzR4TXpnZ01UVTRMall6TERVd0xqZzJOU0F4TlRndU5qTXNOVEl1T0RreElFTXhOVGd1TmpNc05Ua3VNVE15SURFMU5DNHlNRFVzTmpZdU56WTJJREUwT0M0M05qVXNOamt1T1RBM0lFTXhORGN1TVRreUxEY3dMamd4TlNBeE5EVXVOamd4TERjeExqSTNOaUF4TkRRdU1qYzJMRGN4TGpJM05pQk1NVFEwTGpJM05pdzNNUzR5TnpZZ1dpQk5NVFF4TGpVMU9DdzNNQzR4TURRZ1F6RTBNaTR6TXpFc056QXVOak0zSURFME15NHlORFVzTnpFdU1EQTFJREUwTkM0eU56WXNOekV1TURBMUlFTXhORFV1TlRrNExEY3hMakF3TlNBeE5EY3VNRE1zTnpBdU5EWTNJREUwT0M0MU16SXNOamt1TmlCRE1UVXpMamcwTWl3Mk5pNDFNelFnTVRVNExqRTJNeXcxT1M0d016TWdNVFU0TGpFMk15dzFNaTQ1TXprZ1F6RTFPQzR4TmpNc05URXVNRE14SURFMU55NDNNamtzTkRrdU16ZzFJREUxTmk0NU1EY3NORGd1TWpJeklFTXhOVFl1TVRNekxEUTNMalk1TVNBeE5UVXVNakU1TERRM0xqUXdPU0F4TlRRdU1UZzVMRFEzTGpRd09TQkRNVFV5TGpnMk55dzBOeTQwTURrZ01UVXhMalF6TlN3ME55NDRORElnTVRRNUxqa3pNeXcwT0M0M01Ea2dRekUwTkM0Mk1qTXNOVEV1TnpjMUlERTBNQzR6TURJc05Ua3VNamN6SURFME1DNHpNRElzTmpVdU16WTJJRU14TkRBdU16QXlMRFkzTGpJM05pQXhOREF1TnpNMkxEWTRMamswTWlBeE5ERXVOVFU0TERjd0xqRXdOQ0JNTVRReExqVTFPQ3czTUM0eE1EUWdXaUlnYVdROUlrWnBiR3d0TXpVaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UVXdMamN5TERZMUxqTTJNU0JNTVRVd0xqTTFOeXcyTlM0d05qWWdRekUxTVM0eE5EY3NOalF1TURreUlERTFNUzQ0Tmprc05qTXVNRFFnTVRVeUxqVXdOU3cyTVM0NU16Z2dRekUxTXk0ek1UTXNOakF1TlRNNUlERTFNeTQ1Tnpnc05Ua3VNRFkzSURFMU5DNDBPRElzTlRjdU5UWXpJRXd4TlRRdU9USTFMRFUzTGpjeE1pQkRNVFUwTGpReE1pdzFPUzR5TkRVZ01UVXpMamN6TXl3Mk1DNDNORFVnTVRVeUxqa3hMRFl5TGpFM01pQkRNVFV5TGpJMk1pdzJNeTR5T1RVZ01UVXhMalV5TlN3Mk5DNHpOamdnTVRVd0xqY3lMRFkxTGpNMk1TSWdhV1E5SWtacGJHd3RNellpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFMUxqa3hOeXc0TkM0MU1UUWdUREV4TlM0MU5UUXNPRFF1TWpJZ1F6RXhOaTR6TkRRc09ETXVNalExSURFeE55NHdOallzT0RJdU1UazBJREV4Tnk0M01ESXNPREV1TURreUlFTXhNVGd1TlRFc056a3VOamt5SURFeE9TNHhOelVzTnpndU1qSWdNVEU1TGpZM09DdzNOaTQzTVRjZ1RERXlNQzR4TWpFc056WXVPRFkxSUVNeE1Ua3VOakE0TERjNExqTTVPQ0F4TVRndU9UTXNOemt1T0RrNUlERXhPQzR4TURZc09ERXVNekkySUVNeE1UY3VORFU0TERneUxqUTBPQ0F4TVRZdU56SXlMRGd6TGpVeU1TQXhNVFV1T1RFM0xEZzBMalV4TkNJZ2FXUTlJa1pwYkd3dE16Y2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEUwTERFek1DNDBOellnVERFeE5Dd3hNekF1TURBNElFd3hNVFFzTnpZdU1EVXlJRXd4TVRRc056VXVOVGcwSUV3eE1UUXNOell1TURVeUlFd3hNVFFzTVRNd0xqQXdPQ0JNTVRFMExERXpNQzQwTnpZaUlHbGtQU0pHYVd4c0xUTTRJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOEwyYytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThaeUJwWkQwaVNXMXdiM0owWldRdFRHRjVaWEp6TFVOdmNIa2lJSFJ5WVc1elptOXliVDBpZEhKaGJuTnNZWFJsS0RZeUxqQXdNREF3TUN3Z01DNHdNREF3TURBcElpQnphMlYwWTJnNmRIbHdaVDBpVFZOVGFHRndaVWR5YjNWd0lqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRrdU9ESXlMRE0zTGpRM05DQkRNVGt1T0RNNUxETTNMak16T1NBeE9TNDNORGNzTXpjdU1UazBJREU1TGpVMU5Td3pOeTR3T0RJZ1F6RTVMakl5T0N3ek5pNDRPVFFnTVRndU56STVMRE0yTGpnM01pQXhPQzQwTkRZc016Y3VNRE0zSUV3eE1pNDBNelFzTkRBdU5UQTRJRU14TWk0ek1ETXNOREF1TlRnMElERXlMakkwTERRd0xqWTROaUF4TWk0eU5ETXNOREF1TnpreklFTXhNaTR5TkRVc05EQXVPVEkxSURFeUxqSTBOU3cwTVM0eU5UUWdNVEl1TWpRMUxEUXhMak0zTVNCTU1USXVNalExTERReExqUXhOQ0JNTVRJdU1qTTRMRFF4TGpVME1pQkRPQzR4TkRnc05ETXVPRGczSURVdU5qUTNMRFExTGpNeU1TQTFMalkwTnl3ME5TNHpNakVnUXpVdU5qUTJMRFExTGpNeU1TQXpMalUzTERRMkxqTTJOeUF5TGpnMkxEVXdMalV4TXlCRE1pNDROaXcxTUM0MU1UTWdNUzQ1TkRnc05UY3VORGMwSURFdU9UWXlMRGN3TGpJMU9DQkRNUzQ1Tnpjc09ESXVPREk0SURJdU5UWTRMRGczTGpNeU9DQXpMakV5T1N3NU1TNDJNRGtnUXpNdU16UTVMRGt6TGpJNU15QTJMakV6TERrekxqY3pOQ0EyTGpFekxEa3pMamN6TkNCRE5pNDBOakVzT1RNdU56YzBJRFl1T0RJNExEa3pMamN3TnlBM0xqSXhMRGt6TGpRNE5pQk1PREl1TkRnekxEUTVMamt6TlNCRE9EUXVNamt4TERRNExqZzJOaUE0TlM0eE5TdzBOaTR5TVRZZ09EVXVOVE01TERRekxqWTFNU0JET0RZdU56VXlMRE0xTGpZMk1TQTROeTR5TVRRc01UQXVOamN6SURnMUxqSTJOQ3d6TGpjM015QkRPRFV1TURZNExETXVNRGdnT0RRdU56VTBMREl1TmprZ09EUXVNemsyTERJdU5Ea3hJRXc0TWk0ek1Td3hMamN3TVNCRE9ERXVOVGd6TERFdU56STVJRGd3TGpnNU5Dd3lMakUyT0NBNE1DNDNOellzTWk0eU16WWdRemd3TGpZek5pd3lMak14TnlBME1TNDRNRGNzTWpRdU5UZzFJREl3TGpBek1pd3pOeTR3TnpJZ1RERTVMamd5TWl3ek55NDBOelFpSUdsa1BTSkdhV3hzTFRFaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk9ESXVNekV4TERFdU56QXhJRXc0TkM0ek9UWXNNaTQwT1RFZ1F6ZzBMamMxTkN3eUxqWTVJRGcxTGpBMk9Dd3pMakE0SURnMUxqSTJOQ3d6TGpjM015QkRPRGN1TWpFekxERXdMalkzTXlBNE5pNDNOVEVzTXpVdU5qWWdPRFV1TlRNNUxEUXpMalkxTVNCRE9EVXVNVFE1TERRMkxqSXhOaUE0TkM0eU9TdzBPQzQ0TmpZZ09ESXVORGd6TERRNUxqa3pOU0JNTnk0eU1TdzVNeTQwT0RZZ1F6WXVPRGszTERrekxqWTJOeUEyTGpVNU5TdzVNeTQzTkRRZ05pNHpNVFFzT1RNdU56UTBJRXcyTGpFek1TdzVNeTQzTXpNZ1F6WXVNVE14TERrekxqY3pOQ0F6TGpNME9TdzVNeTR5T1RNZ015NHhNamdzT1RFdU5qQTVJRU15TGpVMk9DdzROeTR6TWpjZ01TNDVOemNzT0RJdU9ESTRJREV1T1RZekxEY3dMakkxT0NCRE1TNDVORGdzTlRjdU5EYzBJREl1T0RZc05UQXVOVEV6SURJdU9EWXNOVEF1TlRFeklFTXpMalUzTERRMkxqTTJOeUExTGpZME55dzBOUzR6TWpFZ05TNDJORGNzTkRVdU16SXhJRU0xTGpZME55dzBOUzR6TWpFZ09DNHhORGdzTkRNdU9EZzNJREV5TGpJek9DdzBNUzQxTkRJZ1RERXlMakkwTlN3ME1TNDBNVFFnVERFeUxqSTBOU3cwTVM0ek56RWdRekV5TGpJME5TdzBNUzR5TlRRZ01USXVNalExTERRd0xqa3lOU0F4TWk0eU5ETXNOREF1TnpreklFTXhNaTR5TkN3ME1DNDJPRFlnTVRJdU16QXlMRFF3TGpVNE15QXhNaTQwTXpRc05EQXVOVEE0SUV3eE9DNDBORFlzTXpjdU1ETTJJRU14T0M0MU56UXNNell1T1RZeUlERTRMamMwTml3ek5pNDVNallnTVRndU9USTNMRE0yTGpreU5pQkRNVGt1TVRRMUxETTJMamt5TmlBeE9TNHpOellzTXpZdU9UYzVJREU1TGpVMU5Dd3pOeTR3T0RJZ1F6RTVMamMwTnl3ek55NHhPVFFnTVRrdU9ETTVMRE0zTGpNMElERTVMamd5TWl3ek55NDBOelFnVERJd0xqQXpNeXd6Tnk0d056SWdRelF4TGpnd05pd3lOQzQxT0RVZ09EQXVOak0yTERJdU16RTRJRGd3TGpjM055d3lMakl6TmlCRE9EQXVPRGswTERJdU1UWTRJRGd4TGpVNE15d3hMamN5T1NBNE1pNHpNVEVzTVM0M01ERWdUVGd5TGpNeE1Td3dMamN3TkNCTU9ESXVNamN5TERBdU56QTFJRU00TVM0Mk5UUXNNQzQzTWpnZ09EQXVPVGc1TERBdU9UUTVJRGd3TGpJNU9Dd3hMak0yTVNCTU9EQXVNamMzTERFdU16Y3pJRU00TUM0eE1qa3NNUzQwTlRnZ05Ua3VOelk0TERFekxqRXpOU0F4T1M0M05UZ3NNell1TURjNUlFTXhPUzQxTERNMUxqazRNU0F4T1M0eU1UUXNNelV1T1RJNUlERTRMamt5Tnl3ek5TNDVNamtnUXpFNExqVTJNaXd6TlM0NU1qa2dNVGd1TWpJekxETTJMakF4TXlBeE55NDVORGNzTXpZdU1UY3pJRXd4TVM0NU16VXNNemt1TmpRMElFTXhNUzQwT1RNc016a3VPRGs1SURFeExqSXpOaXcwTUM0ek16UWdNVEV1TWpRMkxEUXdMamd4SUV3eE1TNHlORGNzTkRBdU9UWWdURFV1TVRZM0xEUTBMalEwTnlCRE5DNDNPVFFzTkRRdU5qUTJJREl1TmpJMUxEUTFMamszT0NBeExqZzNOeXcxTUM0ek5EVWdUREV1T0RjeExEVXdMak00TkNCRE1TNDROaklzTlRBdU5EVTBJREF1T1RVeExEVTNMalUxTnlBd0xqazJOU3czTUM0eU5Ua2dRekF1T1RjNUxEZ3lMamczT1NBeExqVTJPQ3c0Tnk0ek56VWdNaTR4TXpjc09URXVOekkwSUV3eUxqRXpPU3c1TVM0M016a2dRekl1TkRRM0xEazBMakE1TkNBMUxqWXhOQ3c1TkM0Mk5qSWdOUzQ1TnpVc09UUXVOekU1SUV3MkxqQXdPU3c1TkM0M01qTWdRell1TVRFc09UUXVOek0ySURZdU1qRXpMRGswTGpjME1pQTJMak14TkN3NU5DNDNORElnUXpZdU56a3NPVFF1TnpReUlEY3VNallzT1RRdU5qRWdOeTQzTVN3NU5DNHpOU0JNT0RJdU9UZ3pMRFV3TGpjNU9DQkRPRFF1TnprMExEUTVMamN5TnlBNE5TNDVPRElzTkRjdU16YzFJRGcyTGpVeU5TdzBNeTQ0TURFZ1F6ZzNMamN4TVN3ek5TNDVPRGNnT0RndU1qVTVMREV3TGpjd05TQTROaTR5TWpRc015NDFNRElnUXpnMUxqazNNU3d5TGpZd09TQTROUzQxTWl3eExqazNOU0E0TkM0NE9ERXNNUzQyTWlCTU9EUXVOelE1TERFdU5UVTRJRXc0TWk0Mk5qUXNNQzQzTmprZ1F6Z3lMalUxTVN3d0xqY3lOU0E0TWk0ME16RXNNQzQzTURRZ09ESXVNekV4TERBdU56QTBJaUJwWkQwaVJtbHNiQzB5SWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZMkxqSTJOeXd4TVM0MU5qVWdURFkzTGpjMk1pd3hNUzQ1T1RrZ1RERXhMalF5TXl3ME5DNHpNalVpSUdsa1BTSkdhV3hzTFRNaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1USXVNakF5TERrd0xqVTBOU0JETVRJdU1ESTVMRGt3TGpVME5TQXhNUzQ0TmpJc09UQXVORFUxSURFeExqYzJPU3c1TUM0eU9UVWdRekV4TGpZek1pdzVNQzR3TlRjZ01URXVOekV6TERnNUxqYzFNaUF4TVM0NU5USXNPRGt1TmpFMElFd3pNQzR6T0Rrc056Z3VPVFk1SUVNek1DNDJNamdzTnpndU9ETXhJRE13TGprek15dzNPQzQ1TVRNZ016RXVNRGN4TERjNUxqRTFNaUJETXpFdU1qQTRMRGM1TGpNNUlETXhMakV5Tnl3M09TNDJPVFlnTXpBdU9EZzRMRGM1TGpnek15Qk1NVEl1TkRVeExEa3dMalEzT0NCTU1USXVNakF5TERrd0xqVTBOU0lnYVdROUlrWnBiR3d0TkNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE15NDNOalFzTkRJdU5qVTBJRXd4TXk0Mk5UWXNOREl1TlRreUlFd3hNeTQzTURJc05ESXVOREl4SUV3eE9DNDRNemNzTXprdU5EVTNJRXd4T1M0d01EY3NNemt1TlRBeUlFd3hPQzQ1TmpJc016a3VOamN6SUV3eE15NDRNamNzTkRJdU5qTTNJRXd4TXk0M05qUXNOREl1TmpVMElpQnBaRDBpUm1sc2JDMDFJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGd1TlRJc09UQXVNemMxSUV3NExqVXlMRFEyTGpReU1TQk1PQzQxT0RNc05EWXVNemcxSUV3M05TNDROQ3czTGpVMU5DQk1OelV1T0RRc05URXVOVEE0SUV3M05TNDNOemdzTlRFdU5UUTBJRXc0TGpVeUxEa3dMak0zTlNCTU9DNDFNaXc1TUM0ek56VWdXaUJOT0M0M055dzBOaTQxTmpRZ1REZ3VOemNzT0RrdU9UUTBJRXczTlM0MU9URXNOVEV1TXpZMUlFdzNOUzQxT1RFc055NDVPRFVnVERndU56Y3NORFl1TlRZMElFdzRMamMzTERRMkxqVTJOQ0JhSWlCcFpEMGlSbWxzYkMwMklpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUSTBMams0Tml3NE15NHhPRElnUXpJMExqYzFOaXc0TXk0ek16RWdNalF1TXpjMExEZ3pMalUyTmlBeU5DNHhNemNzT0RNdU56QTFJRXd4TWk0Mk16SXNPVEF1TkRBMklFTXhNaTR6T1RVc09UQXVOVFExSURFeUxqUXlOaXc1TUM0Mk5UZ2dNVEl1Tnl3NU1DNDJOVGdnVERFekxqSTJOU3c1TUM0Mk5UZ2dRekV6TGpVMExEa3dMalkxT0NBeE15NDVOVGdzT1RBdU5UUTFJREUwTGpFNU5TdzVNQzQwTURZZ1RESTFMamNzT0RNdU56QTFJRU15TlM0NU16Y3NPRE11TlRZMklESTJMakV5T0N3NE15NDBOVElnTWpZdU1USTFMRGd6TGpRME9TQkRNall1TVRJeUxEZ3pMalEwTnlBeU5pNHhNVGtzT0RNdU1qSWdNall1TVRFNUxEZ3lMamswTmlCRE1qWXVNVEU1TERneUxqWTNNaUF5TlM0NU16RXNPREl1TlRZNUlESTFMamN3TVN3NE1pNDNNVGtnVERJMExqazROaXc0TXk0eE9ESWlJR2xrUFNKR2FXeHNMVGNpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRNdU1qWTJMRGt3TGpjNE1pQk1NVEl1Tnl3NU1DNDNPRElnUXpFeUxqVXNPVEF1TnpneUlERXlMak00TkN3NU1DNDNNallnTVRJdU16VTBMRGt3TGpZeE5pQkRNVEl1TXpJMExEa3dMalV3TmlBeE1pNHpPVGNzT1RBdU16azVJREV5TGpVMk9TdzVNQzR5T1RrZ1RESTBMakEzTkN3NE15NDFPVGNnUXpJMExqTXhMRGd6TGpRMU9TQXlOQzQyT0Rrc09ETXVNakkySURJMExqa3hPQ3c0TXk0d056Z2dUREkxTGpZek15dzRNaTQyTVRRZ1F6STFMamN5TXl3NE1pNDFOVFVnTWpVdU9ERXpMRGd5TGpVeU5TQXlOUzQ0T1Rrc09ESXVOVEkxSUVNeU5pNHdOekVzT0RJdU5USTFJREkyTGpJME5DdzRNaTQyTlRVZ01qWXVNalEwTERneUxqazBOaUJETWpZdU1qUTBMRGd6TGpFMklESTJMakkwTlN3NE15NHpNRGtnTWpZdU1qUTNMRGd6TGpNNE15Qk1Nall1TWpVekxEZ3pMak00TnlCTU1qWXVNalE1TERnekxqUTFOaUJETWpZdU1qUTJMRGd6TGpVek1TQXlOaTR5TkRZc09ETXVOVE14SURJMUxqYzJNeXc0TXk0NE1USWdUREUwTGpJMU9DdzVNQzQxTVRRZ1F6RTBMRGt3TGpZMk5TQXhNeTQxTmpRc09UQXVOemd5SURFekxqSTJOaXc1TUM0M09ESWdUREV6TGpJMk5pdzVNQzQzT0RJZ1dpQk5NVEl1TmpZMkxEa3dMalV6TWlCTU1USXVOeXc1TUM0MU16TWdUREV6TGpJMk5pdzVNQzQxTXpNZ1F6RXpMalV4T0N3NU1DNDFNek1nTVRNdU9URTFMRGt3TGpReU5TQXhOQzR4TXpJc09UQXVNams1SUV3eU5TNDJNemNzT0RNdU5UazNJRU15TlM0NE1EVXNPRE11TkRrNUlESTFMamt6TVN3NE15NDBNalFnTWpVdU9UazRMRGd6TGpNNE15QkRNalV1T1RrMExEZ3pMakk1T1NBeU5TNDVPVFFzT0RNdU1UWTFJREkxTGprNU5DdzRNaTQ1TkRZZ1RESTFMamc1T1N3NE1pNDNOelVnVERJMUxqYzJPQ3c0TWk0NE1qUWdUREkxTGpBMU5DdzRNeTR5T0RjZ1F6STBMamd5TWl3NE15NDBNemNnTWpRdU5ETTRMRGd6TGpZM015QXlOQzR5TERnekxqZ3hNaUJNTVRJdU5qazFMRGt3TGpVeE5DQk1NVEl1TmpZMkxEa3dMalV6TWlCTU1USXVOalkyTERrd0xqVXpNaUJhSWlCcFpEMGlSbWxzYkMwNElpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURXpMakkyTml3NE9TNDROekVnVERFeUxqY3NPRGt1T0RjeElFTXhNaTQxTERnNUxqZzNNU0F4TWk0ek9EUXNPRGt1T0RFMUlERXlMak0xTkN3NE9TNDNNRFVnUXpFeUxqTXlOQ3c0T1M0MU9UVWdNVEl1TXprM0xEZzVMalE0T0NBeE1pNDFOamtzT0RrdU16ZzRJRXd5TkM0d056UXNPREl1TmpnMklFTXlOQzR6TXpJc09ESXVOVE0xSURJMExqYzJPQ3c0TWk0ME1UZ2dNalV1TURZM0xEZ3lMalF4T0NCTU1qVXVOak15TERneUxqUXhPQ0JETWpVdU9ETXlMRGd5TGpReE9DQXlOUzQ1TkRnc09ESXVORGMwSURJMUxqazNPQ3c0TWk0MU9EUWdRekkyTGpBd09DdzRNaTQyT1RRZ01qVXVPVE0xTERneUxqZ3dNU0F5TlM0M05qTXNPREl1T1RBeElFd3hOQzR5TlRnc09Ea3VOakF6SUVNeE5DdzRPUzQzTlRRZ01UTXVOVFkwTERnNUxqZzNNU0F4TXk0eU5qWXNPRGt1T0RjeElFd3hNeTR5TmpZc09Ea3VPRGN4SUZvZ1RURXlMalkyTml3NE9TNDJNakVnVERFeUxqY3NPRGt1TmpJeUlFd3hNeTR5TmpZc09Ea3VOakl5SUVNeE15NDFNVGdzT0RrdU5qSXlJREV6TGpreE5TdzRPUzQxTVRVZ01UUXVNVE15TERnNUxqTTRPQ0JNTWpVdU5qTTNMRGd5TGpZNE5pQk1NalV1TmpZM0xEZ3lMalkyT0NCTU1qVXVOak15TERneUxqWTJOeUJNTWpVdU1EWTNMRGd5TGpZMk55QkRNalF1T0RFMUxEZ3lMalkyTnlBeU5DNDBNVGdzT0RJdU56YzFJREkwTGpJc09ESXVPVEF4SUV3eE1pNDJPVFVzT0RrdU5qQXpJRXd4TWk0Mk5qWXNPRGt1TmpJeElFd3hNaTQyTmpZc09Ea3VOakl4SUZvaUlHbGtQU0pHYVd4c0xUa2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEl1TXpjc09UQXVPREF4SUV3eE1pNHpOeXc0T1M0MU5UUWdUREV5TGpNM0xEa3dMamd3TVNJZ2FXUTlJa1pwYkd3dE1UQWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5OaTR4TXl3NU15NDVNREVnUXpVdU16YzVMRGt6TGpnd09DQTBMamd4Tml3NU15NHhOalFnTkM0Mk9URXNPVEl1TlRJMUlFTXpMamcyTERnNExqSTROeUF6TGpVMExEZ3pMamMwTXlBekxqVXlOaXczTVM0eE56TWdRek11TlRFeExEVTRMak00T1NBMExqUXlNeXcxTVM0ME1qZ2dOQzQwTWpNc05URXVOREk0SUVNMUxqRXpOQ3cwTnk0eU9ESWdOeTR5TVN3ME5pNHlNellnTnk0eU1TdzBOaTR5TXpZZ1F6Y3VNakVzTkRZdU1qTTJJRGd4TGpZMk55d3pMakkxSURneUxqQTJPU3d6TGpBeE55QkRPREl1TWpreUxESXVPRGc0SURnMExqVTFOaXd4TGpRek15QTROUzR5TmpRc015NDVOQ0JET0RjdU1qRTBMREV3TGpnMElEZzJMamMxTWl3ek5TNDRNamNnT0RVdU5UTTVMRFF6TGpneE9DQkRPRFV1TVRVc05EWXVNemd6SURnMExqSTVNU3cwT1M0d016TWdPREl1TkRnekxEVXdMakV3TVNCTU55NHlNU3c1TXk0Mk5UTWdRell1T0RJNExEa3pMamczTkNBMkxqUTJNU3c1TXk0NU5ERWdOaTR4TXl3NU15NDVNREVnUXpZdU1UTXNPVE11T1RBeElETXVNelE1TERrekxqUTJJRE11TVRJNUxEa3hMamMzTmlCRE1pNDFOamdzT0RjdU5EazFJREV1T1RjM0xEZ3lMams1TlNBeExqazJNaXczTUM0ME1qVWdRekV1T1RRNExEVTNMalkwTVNBeUxqZzJMRFV3TGpZNElESXVPRFlzTlRBdU5qZ2dRek11TlRjc05EWXVOVE0wSURVdU5qUTNMRFExTGpRNE9TQTFMalkwTnl3ME5TNDBPRGtnUXpVdU5qUTJMRFExTGpRNE9TQTRMakEyTlN3ME5DNHdPVElnTVRJdU1qUTFMRFF4TGpZM09TQk1NVE11TVRFMkxEUXhMalUySUV3eE9TNDNNVFVzTXpjdU56TWdUREU1TGpjMk1Td3pOeTR5TmprZ1REWXVNVE1zT1RNdU9UQXhJaUJwWkQwaVJtbHNiQzB4TVNJZ1ptbHNiRDBpSTBaQlJrRkdRU0krUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswMkxqTXhOeXc1TkM0eE5qRWdURFl1TVRBeUxEazBMakUwT0NCTU5pNHhNREVzT1RRdU1UUTRJRXcxTGpnMU55dzVOQzR4TURFZ1F6VXVNVE00TERrekxqazBOU0F6TGpBNE5TdzVNeTR6TmpVZ01pNDRPREVzT1RFdU9EQTVJRU15TGpNeE15dzROeTQwTmprZ01TNDNNamNzT0RJdU9UazJJREV1TnpFekxEY3dMalF5TlNCRE1TNDJPVGtzTlRjdU56Y3hJREl1TmpBMExEVXdMamN4T0NBeUxqWXhNeXcxTUM0Mk5EZ2dRek11TXpNNExEUTJMalF4TnlBMUxqUTBOU3cwTlM0ek1TQTFMalV6TlN3ME5TNHlOallnVERFeUxqRTJNeXcwTVM0ME16a2dUREV6TGpBek15dzBNUzR6TWlCTU1Ua3VORGM1TERNM0xqVTNPQ0JNTVRrdU5URXpMRE0zTGpJME5DQkRNVGt1TlRJMkxETTNMakV3TnlBeE9TNDJORGNzTXpjdU1EQTRJREU1TGpjNE5pd3pOeTR3TWpFZ1F6RTVMamt5TWl3ek55NHdNelFnTWpBdU1ESXpMRE0zTGpFMU5pQXlNQzR3TURrc016Y3VNamt6SUV3eE9TNDVOU3d6Tnk0NE9ESWdUREV6TGpFNU9DdzBNUzQ0TURFZ1RERXlMak15T0N3ME1TNDVNVGtnVERVdU56Y3lMRFExTGpjd05DQkROUzQzTkRFc05EVXVOeklnTXk0M09ESXNORFl1TnpjeUlETXVNVEEyTERVd0xqY3lNaUJETXk0d09Ua3NOVEF1TnpneUlESXVNVGs0TERVM0xqZ3dPQ0F5TGpJeE1pdzNNQzQwTWpRZ1F6SXVNakkyTERneUxqazJNeUF5TGpnd09TdzROeTQwTWlBekxqTTNNeXc1TVM0M01qa2dRek11TkRZMExEa3lMalF5SURRdU1EWXlMRGt5TGpnNE15QTBMalk0TWl3NU15NHhPREVnUXpRdU5UWTJMRGt5TGprNE5DQTBMalE0Tml3NU1pNDNOellnTkM0ME5EWXNPVEl1TlRjeUlFTXpMalkyTlN3NE9DNDFPRGdnTXk0eU9URXNPRFF1TXpjZ015NHlOellzTnpFdU1UY3pJRU16TGpJMk1pdzFPQzQxTWlBMExqRTJOeXcxTVM0ME5qWWdOQzR4TnpZc05URXVNemsySUVNMExqa3dNU3cwTnk0eE5qVWdOeTR3TURnc05EWXVNRFU1SURjdU1EazRMRFEyTGpBeE5DQkROeTR3T1RRc05EWXVNREUxSURneExqVTBNaXd6TGpBek5DQTRNUzQ1TkRRc01pNDRNRElnVERneExqazNNaXd5TGpjNE5TQkRPREl1T0RjMkxESXVNalEzSURnekxqWTVNaXd5TGpBNU55QTROQzR6TXpJc01pNHpOVElnUXpnMExqZzROeXd5TGpVM015QTROUzR5T0RFc015NHdPRFVnT0RVdU5UQTBMRE11T0RjeUlFTTROeTQxTVRnc01URWdPRFl1T1RZMExETTJMakE1TVNBNE5TNDNPRFVzTkRNdU9EVTFJRU00TlM0eU56Z3NORGN1TVRrMklEZzBMakl4TERRNUxqTTNJRGd5TGpZeExEVXdMak14TnlCTU55NHpNelVzT1RNdU9EWTVJRU0yTGprNU9TdzVOQzR3TmpNZ05pNDJOVGdzT1RRdU1UWXhJRFl1TXpFM0xEazBMakUyTVNCTU5pNHpNVGNzT1RRdU1UWXhJRm9nVFRZdU1UY3NPVE11TmpVMElFTTJMalEyTXl3NU15NDJPU0EyTGpjM05DdzVNeTQyTVRjZ055NHdPRFVzT1RNdU5ETTNJRXc0TWk0ek5UZ3NORGt1T0RnMklFTTROQzR4T0RFc05EZ3VPREE0SURnMExqazJMRFExTGprM01TQTROUzR5T1RJc05ETXVOemdnUXpnMkxqUTJOaXd6Tmk0d05Ea2dPRGN1TURJekxERXhMakE0TlNBNE5TNHdNalFzTkM0d01EZ2dRemcwTGpnME5pd3pMak0zTnlBNE5DNDFOVEVzTWk0NU56WWdPRFF1TVRRNExESXVPREUySUVNNE15NDJOalFzTWk0Mk1qTWdPREl1T1RneUxESXVOelkwSURneUxqSXlOeXd6TGpJeE15Qk1PREl1TVRrekxETXVNak0wSUVNNE1TNDNPVEVzTXk0ME5qWWdOeTR6TXpVc05EWXVORFV5SURjdU16TTFMRFEyTGpRMU1pQkROeTR6TURRc05EWXVORFk1SURVdU16UTJMRFEzTGpVeU1TQTBMalkyT1N3MU1TNDBOekVnUXpRdU5qWXlMRFV4TGpVeklETXVOell4TERVNExqVTFOaUF6TGpjM05TdzNNUzR4TnpNZ1F6TXVOemtzT0RRdU16STRJRFF1TVRZeExEZzRMalV5TkNBMExqa3pOaXc1TWk0ME56WWdRelV1TURJMkxEa3lMamt6TnlBMUxqUXhNaXc1TXk0ME5Ua2dOUzQ1TnpNc09UTXVOakUxSUVNMkxqQTROeXc1TXk0Mk5DQTJMakUxT0N3NU15NDJOVElnTmk0eE5qa3NPVE11TmpVMElFdzJMakUzTERrekxqWTFOQ0JNTmk0eE55dzVNeTQyTlRRZ1dpSWdhV1E5SWtacGJHd3RNVElpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTnk0ek1UY3NOamd1T1RneUlFTTNMamd3Tml3Mk9DNDNNREVnT0M0eU1ESXNOamd1T1RJMklEZ3VNakF5TERZNUxqUTROeUJET0M0eU1ESXNOekF1TURRM0lEY3VPREEyTERjd0xqY3pJRGN1TXpFM0xEY3hMakF4TWlCRE5pNDRNamtzTnpFdU1qazBJRFl1TkRNekxEY3hMakEyT1NBMkxqUXpNeXczTUM0MU1EZ2dRell1TkRNekxEWTVMamswT0NBMkxqZ3lPU3cyT1M0eU5qVWdOeTR6TVRjc05qZ3VPVGd5SWlCcFpEMGlSbWxzYkMweE15SWdabWxzYkQwaUkwWkdSa1pHUmlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDJMamt5TERjeExqRXpNeUJETmk0Mk16RXNOekV1TVRNeklEWXVORE16TERjd0xqa3dOU0EyTGpRek15dzNNQzQxTURnZ1F6WXVORE16TERZNUxqazBPQ0EyTGpneU9TdzJPUzR5TmpVZ055NHpNVGNzTmpndU9UZ3lJRU0zTGpRMkxEWTRMamtnTnk0MU9UVXNOamd1T0RZeElEY3VOekUwTERZNExqZzJNU0JET0M0d01ETXNOamd1T0RZeElEZ3VNakF5TERZNUxqQTVJRGd1TWpBeUxEWTVMalE0TnlCRE9DNHlNRElzTnpBdU1EUTNJRGN1T0RBMkxEY3dMamN6SURjdU16RTNMRGN4TGpBeE1pQkROeTR4TnpRc056RXVNRGswSURjdU1ETTVMRGN4TGpFek15QTJMamt5TERjeExqRXpNeUJOTnk0M01UUXNOamd1TmpjMElFTTNMalUxTnl3Mk9DNDJOelFnTnk0ek9USXNOamd1TnpJeklEY3VNakkwTERZNExqZ3lNU0JETmk0Mk56WXNOamt1TVRNNElEWXVNalEyTERZNUxqZzNPU0EyTGpJME5pdzNNQzQxTURnZ1F6WXVNalEyTERjd0xqazVOQ0EyTGpVeE55dzNNUzR6TWlBMkxqa3lMRGN4TGpNeUlFTTNMakEzT0N3M01TNHpNaUEzTGpJME15dzNNUzR5TnpFZ055NDBNVEVzTnpFdU1UYzBJRU0zTGprMU9TdzNNQzQ0TlRjZ09DNHpPRGtzTnpBdU1URTNJRGd1TXpnNUxEWTVMalE0TnlCRE9DNHpPRGtzTmprdU1EQXhJRGd1TVRFM0xEWTRMalkzTkNBM0xqY3hOQ3cyT0M0Mk56UWlJR2xrUFNKR2FXeHNMVEUwSWlCbWFXeHNQU0lqT0RBNU4wRXlJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZdU9USXNOekF1T1RRM0lFTTJMalkwT1N3M01DNDVORGNnTmk0Mk1qRXNOekF1TmpRZ05pNDJNakVzTnpBdU5UQTRJRU0yTGpZeU1TdzNNQzR3TVRjZ05pNDVPRElzTmprdU16a3lJRGN1TkRFeExEWTVMakUwTlNCRE55NDFNakVzTmprdU1EZ3lJRGN1TmpJMUxEWTVMakEwT1NBM0xqY3hOQ3cyT1M0d05Ea2dRemN1T1RnMkxEWTVMakEwT1NBNExqQXhOU3cyT1M0ek5UVWdPQzR3TVRVc05qa3VORGczSUVNNExqQXhOU3cyT1M0NU56Z2dOeTQyTlRJc056QXVOakF6SURjdU1qSTBMRGN3TGpnMU1TQkROeTR4TVRVc056QXVPVEUwSURjdU1ERXNOekF1T1RRM0lEWXVPVElzTnpBdU9UUTNJRTAzTGpjeE5DdzJPQzQ0TmpFZ1F6Y3VOVGsxTERZNExqZzJNU0EzTGpRMkxEWTRMamtnTnk0ek1UY3NOamd1T1RneUlFTTJMamd5T1N3Mk9TNHlOalVnTmk0ME16TXNOamt1T1RRNElEWXVORE16TERjd0xqVXdPQ0JETmk0ME16TXNOekF1T1RBMUlEWXVOak14TERjeExqRXpNeUEyTGpreUxEY3hMakV6TXlCRE55NHdNemtzTnpFdU1UTXpJRGN1TVRjMExEY3hMakE1TkNBM0xqTXhOeXczTVM0d01USWdRemN1T0RBMkxEY3dMamN6SURndU1qQXlMRGN3TGpBME55QTRMakl3TWl3Mk9TNDBPRGNnUXpndU1qQXlMRFk1TGpBNUlEZ3VNREF6TERZNExqZzJNU0EzTGpjeE5DdzJPQzQ0TmpFaUlHbGtQU0pHYVd4c0xURTFJaUJtYVd4c1BTSWpPREE1TjBFeUlqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGN1TkRRMExEZzFMak0xSUVNM0xqY3dPQ3c0TlM0eE9UZ2dOeTQ1TWpFc09EVXVNekU1SURjdU9USXhMRGcxTGpZeU1pQkROeTQ1TWpFc09EVXVPVEkxSURjdU56QTRMRGcyTGpJNU1pQTNMalEwTkN3NE5pNDBORFFnUXpjdU1UZ3hMRGcyTGpVNU55QTJMamsyTnl3NE5pNDBOelVnTmk0NU5qY3NPRFl1TVRjeklFTTJMamsyTnl3NE5TNDROekVnTnk0eE9ERXNPRFV1TlRBeUlEY3VORFEwTERnMUxqTTFJaUJwWkQwaVJtbHNiQzB4TmlJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswM0xqSXpMRGcyTGpVeElFTTNMakEzTkN3NE5pNDFNU0EyTGprMk55dzROaTR6T0RjZ05pNDVOamNzT0RZdU1UY3pJRU0yTGprMk55dzROUzQ0TnpFZ055NHhPREVzT0RVdU5UQXlJRGN1TkRRMExEZzFMak0xSUVNM0xqVXlNU3c0TlM0ek1EVWdOeTQxT1RRc09EVXVNamcwSURjdU5qVTRMRGcxTGpJNE5DQkROeTQ0TVRRc09EVXVNamcwSURjdU9USXhMRGcxTGpRd09DQTNMamt5TVN3NE5TNDJNaklnUXpjdU9USXhMRGcxTGpreU5TQTNMamN3T0N3NE5pNHlPVElnTnk0ME5EUXNPRFl1TkRRMElFTTNMak0yTnl3NE5pNDBPRGtnTnk0eU9UUXNPRFl1TlRFZ055NHlNeXc0Tmk0MU1TQk5OeTQyTlRnc09EVXVNRGs0SUVNM0xqVTFPQ3c0TlM0d09UZ2dOeTQwTlRVc09EVXVNVEkzSURjdU16VXhMRGcxTGpFNE9DQkROeTR3TXpFc09EVXVNemN6SURZdU56Z3hMRGcxTGpnd05pQTJMamM0TVN3NE5pNHhOek1nUXpZdU56Z3hMRGcyTGpRNE1pQTJMamsyTml3NE5pNDJPVGNnTnk0eU15dzROaTQyT1RjZ1F6Y3VNek1zT0RZdU5qazNJRGN1TkRNekxEZzJMalkyTmlBM0xqVXpPQ3c0Tmk0Mk1EY2dRemN1T0RVNExEZzJMalF5TWlBNExqRXdPQ3c0TlM0NU9Ea2dPQzR4TURnc09EVXVOakl5SUVNNExqRXdPQ3c0TlM0ek1UTWdOeTQ1TWpNc09EVXVNRGs0SURjdU5qVTRMRGcxTGpBNU9DSWdhV1E5SWtacGJHd3RNVGNpSUdacGJHdzlJaU00TURrM1FUSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTnk0eU15dzROaTR6TWpJZ1REY3VNVFUwTERnMkxqRTNNeUJETnk0eE5UUXNPRFV1T1RNNElEY3VNek16TERnMUxqWXlPU0EzTGpVek9DdzROUzQxTVRJZ1REY3VOalU0TERnMUxqUTNNU0JNTnk0M016UXNPRFV1TmpJeUlFTTNMamN6TkN3NE5TNDROVFlnTnk0MU5UVXNPRFl1TVRZMElEY3VNelV4TERnMkxqSTRNaUJNTnk0eU15dzROaTR6TWpJZ1RUY3VOalU0TERnMUxqSTROQ0JETnk0MU9UUXNPRFV1TWpnMElEY3VOVEl4TERnMUxqTXdOU0EzTGpRME5DdzROUzR6TlNCRE55NHhPREVzT0RVdU5UQXlJRFl1T1RZM0xEZzFMamczTVNBMkxqazJOeXc0Tmk0eE56TWdRell1T1RZM0xEZzJMak00TnlBM0xqQTNOQ3c0Tmk0MU1TQTNMakl6TERnMkxqVXhJRU0zTGpJNU5DdzROaTQxTVNBM0xqTTJOeXc0Tmk0ME9Ea2dOeTQwTkRRc09EWXVORFEwSUVNM0xqY3dPQ3c0Tmk0eU9USWdOeTQ1TWpFc09EVXVPVEkxSURjdU9USXhMRGcxTGpZeU1pQkROeTQ1TWpFc09EVXVOREE0SURjdU9ERTBMRGcxTGpJNE5DQTNMalkxT0N3NE5TNHlPRFFpSUdsa1BTSkdhV3hzTFRFNElpQm1hV3hzUFNJak9EQTVOMEV5SWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUYzNMakkzT0N3M0xqYzJPU0JNTnpjdU1qYzRMRFV4TGpRek5pQk1NVEF1TWpBNExEa3dMakUySUV3eE1DNHlNRGdzTkRZdU5Ea3pJRXczTnk0eU56Z3NOeTQzTmpraUlHbGtQU0pHYVd4c0xURTVJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV3TGpBNE15dzVNQzR6TnpVZ1RERXdMakE0TXl3ME5pNDBNakVnVERFd0xqRTBOaXcwTmk0ek9EVWdURGMzTGpRd015dzNMalUxTkNCTU56Y3VOREF6TERVeExqVXdPQ0JNTnpjdU16UXhMRFV4TGpVME5DQk1NVEF1TURnekxEa3dMak0zTlNCTU1UQXVNRGd6TERrd0xqTTNOU0JhSUUweE1DNHpNek1zTkRZdU5UWTBJRXd4TUM0ek16TXNPRGt1T1RRMElFdzNOeTR4TlRRc05URXVNelkxSUV3M055NHhOVFFzTnk0NU9EVWdUREV3TGpNek15dzBOaTQxTmpRZ1RERXdMak16TXl3ME5pNDFOalFnV2lJZ2FXUTlJa1pwYkd3dE1qQWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR3dlp6NEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNalV1TnpNM0xEZzRMalkwTnlCTU1URTRMakE1T0N3NU1TNDVPREVnVERFeE9DNHdPVGdzT0RRZ1RERXdOaTQyTXprc09EZ3VOekV6SUV3eE1EWXVOak01TERrMkxqazRNaUJNT1Rrc01UQXdMak14TlNCTU1URXlMak0yT1N3eE1ETXVPVFl4SUV3eE1qVXVOek0zTERnNExqWTBOeUlnYVdROUlrbHRjRzl5ZEdWa0xVeGhlV1Z5Y3kxRGIzQjVMVElpSUdacGJHdzlJaU0wTlRWQk5qUWlJSE5yWlhSamFEcDBlWEJsUFNKTlUxTm9ZWEJsUjNKdmRYQWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnUEM5blBnb2dJQ0FnSUNBZ0lEd3ZaejRLSUNBZ0lEd3ZaejRLUEM5emRtYysnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUm90YXRlSW5zdHJ1Y3Rpb25zO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFNlbnNvclNhbXBsZSA9IHJlcXVpcmUoJy4vc2Vuc29yLXNhbXBsZS5qcycpO1xudmFyIE1hdGhVdGlsID0gcmVxdWlyZSgnLi4vbWF0aC11dGlsLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBhIHNpbXBsZSBjb21wbGVtZW50YXJ5IGZpbHRlciwgd2hpY2ggZnVzZXMgZ3lyb3Njb3BlIGFuZFxuICogYWNjZWxlcm9tZXRlciBkYXRhIGZyb20gdGhlICdkZXZpY2Vtb3Rpb24nIGV2ZW50LlxuICpcbiAqIEFjY2VsZXJvbWV0ZXIgZGF0YSBpcyB2ZXJ5IG5vaXN5LCBidXQgc3RhYmxlIG92ZXIgdGhlIGxvbmcgdGVybS5cbiAqIEd5cm9zY29wZSBkYXRhIGlzIHNtb290aCwgYnV0IHRlbmRzIHRvIGRyaWZ0IG92ZXIgdGhlIGxvbmcgdGVybS5cbiAqXG4gKiBUaGlzIGZ1c2lvbiBpcyByZWxhdGl2ZWx5IHNpbXBsZTpcbiAqIDEuIEdldCBvcmllbnRhdGlvbiBlc3RpbWF0ZXMgZnJvbSBhY2NlbGVyb21ldGVyIGJ5IGFwcGx5aW5nIGEgbG93LXBhc3MgZmlsdGVyXG4gKiAgICBvbiB0aGF0IGRhdGEuXG4gKiAyLiBHZXQgb3JpZW50YXRpb24gZXN0aW1hdGVzIGZyb20gZ3lyb3Njb3BlIGJ5IGludGVncmF0aW5nIG92ZXIgdGltZS5cbiAqIDMuIENvbWJpbmUgdGhlIHR3byBlc3RpbWF0ZXMsIHdlaWdoaW5nICgxKSBpbiB0aGUgbG9uZyB0ZXJtLCBidXQgKDIpIGZvciB0aGVcbiAqICAgIHNob3J0IHRlcm0uXG4gKi9cbmZ1bmN0aW9uIENvbXBsZW1lbnRhcnlGaWx0ZXIoa0ZpbHRlcikge1xuICB0aGlzLmtGaWx0ZXIgPSBrRmlsdGVyO1xuXG4gIC8vIFJhdyBzZW5zb3IgbWVhc3VyZW1lbnRzLlxuICB0aGlzLmN1cnJlbnRBY2NlbE1lYXN1cmVtZW50ID0gbmV3IFNlbnNvclNhbXBsZSgpO1xuICB0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQgPSBuZXcgU2Vuc29yU2FtcGxlKCk7XG4gIHRoaXMucHJldmlvdXNHeXJvTWVhc3VyZW1lbnQgPSBuZXcgU2Vuc29yU2FtcGxlKCk7XG5cbiAgLy8gU2V0IGRlZmF1bHQgbG9vayBkaXJlY3Rpb24gdG8gYmUgaW4gdGhlIGNvcnJlY3QgZGlyZWN0aW9uLlxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgdGhpcy5maWx0ZXJRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oLTEsIDAsIDAsIDEpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZmlsdGVyUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKDEsIDAsIDAsIDEpO1xuICB9XG4gIHRoaXMucHJldmlvdXNGaWx0ZXJRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdGhpcy5wcmV2aW91c0ZpbHRlclEuY29weSh0aGlzLmZpbHRlclEpO1xuXG4gIC8vIE9yaWVudGF0aW9uIGJhc2VkIG9uIHRoZSBhY2NlbGVyb21ldGVyLlxuICB0aGlzLmFjY2VsUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIC8vIFdoZXRoZXIgb3Igbm90IHRoZSBvcmllbnRhdGlvbiBoYXMgYmVlbiBpbml0aWFsaXplZC5cbiAgdGhpcy5pc09yaWVudGF0aW9uSW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgLy8gUnVubmluZyBlc3RpbWF0ZSBvZiBncmF2aXR5IGJhc2VkIG9uIHRoZSBjdXJyZW50IG9yaWVudGF0aW9uLlxuICB0aGlzLmVzdGltYXRlZEdyYXZpdHkgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuICAvLyBNZWFzdXJlZCBncmF2aXR5IGJhc2VkIG9uIGFjY2VsZXJvbWV0ZXIuXG4gIHRoaXMubWVhc3VyZWRHcmF2aXR5ID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcblxuICAvLyBEZWJ1ZyBvbmx5IHF1YXRlcm5pb24gb2YgZ3lyby1iYXNlZCBvcmllbnRhdGlvbi5cbiAgdGhpcy5neXJvSW50ZWdyYWxRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbn1cblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUuYWRkQWNjZWxNZWFzdXJlbWVudCA9IGZ1bmN0aW9uKHZlY3RvciwgdGltZXN0YW1wUykge1xuICB0aGlzLmN1cnJlbnRBY2NlbE1lYXN1cmVtZW50LnNldCh2ZWN0b3IsIHRpbWVzdGFtcFMpO1xufTtcblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUuYWRkR3lyb01lYXN1cmVtZW50ID0gZnVuY3Rpb24odmVjdG9yLCB0aW1lc3RhbXBTKSB7XG4gIHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudC5zZXQodmVjdG9yLCB0aW1lc3RhbXBTKTtcblxuICB2YXIgZGVsdGFUID0gdGltZXN0YW1wUyAtIHRoaXMucHJldmlvdXNHeXJvTWVhc3VyZW1lbnQudGltZXN0YW1wUztcbiAgaWYgKFV0aWwuaXNUaW1lc3RhbXBEZWx0YVZhbGlkKGRlbHRhVCkpIHtcbiAgICB0aGlzLnJ1bl8oKTtcbiAgfVxuXG4gIHRoaXMucHJldmlvdXNHeXJvTWVhc3VyZW1lbnQuY29weSh0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQpO1xufTtcblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUucnVuXyA9IGZ1bmN0aW9uKCkge1xuXG4gIGlmICghdGhpcy5pc09yaWVudGF0aW9uSW5pdGlhbGl6ZWQpIHtcbiAgICB0aGlzLmFjY2VsUSA9IHRoaXMuYWNjZWxUb1F1YXRlcm5pb25fKHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQuc2FtcGxlKTtcbiAgICB0aGlzLnByZXZpb3VzRmlsdGVyUS5jb3B5KHRoaXMuYWNjZWxRKTtcbiAgICB0aGlzLmlzT3JpZW50YXRpb25Jbml0aWFsaXplZCA9IHRydWU7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGRlbHRhVCA9IHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudC50aW1lc3RhbXBTIC1cbiAgICAgIHRoaXMucHJldmlvdXNHeXJvTWVhc3VyZW1lbnQudGltZXN0YW1wUztcblxuICAvLyBDb252ZXJ0IGd5cm8gcm90YXRpb24gdmVjdG9yIHRvIGEgcXVhdGVybmlvbiBkZWx0YS5cbiAgdmFyIGd5cm9EZWx0YVEgPSB0aGlzLmd5cm9Ub1F1YXRlcm5pb25EZWx0YV8odGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50LnNhbXBsZSwgZGVsdGFUKTtcbiAgdGhpcy5neXJvSW50ZWdyYWxRLm11bHRpcGx5KGd5cm9EZWx0YVEpO1xuXG4gIC8vIGZpbHRlcl8xID0gSyAqIChmaWx0ZXJfMCArIGd5cm8gKiBkVCkgKyAoMSAtIEspICogYWNjZWwuXG4gIHRoaXMuZmlsdGVyUS5jb3B5KHRoaXMucHJldmlvdXNGaWx0ZXJRKTtcbiAgdGhpcy5maWx0ZXJRLm11bHRpcGx5KGd5cm9EZWx0YVEpO1xuXG4gIC8vIENhbGN1bGF0ZSB0aGUgZGVsdGEgYmV0d2VlbiB0aGUgY3VycmVudCBlc3RpbWF0ZWQgZ3Jhdml0eSBhbmQgdGhlIHJlYWxcbiAgLy8gZ3Jhdml0eSB2ZWN0b3IgZnJvbSBhY2NlbGVyb21ldGVyLlxuICB2YXIgaW52RmlsdGVyUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIGludkZpbHRlclEuY29weSh0aGlzLmZpbHRlclEpO1xuICBpbnZGaWx0ZXJRLmludmVyc2UoKTtcblxuICB0aGlzLmVzdGltYXRlZEdyYXZpdHkuc2V0KDAsIDAsIC0xKTtcbiAgdGhpcy5lc3RpbWF0ZWRHcmF2aXR5LmFwcGx5UXVhdGVybmlvbihpbnZGaWx0ZXJRKTtcbiAgdGhpcy5lc3RpbWF0ZWRHcmF2aXR5Lm5vcm1hbGl6ZSgpO1xuXG4gIHRoaXMubWVhc3VyZWRHcmF2aXR5LmNvcHkodGhpcy5jdXJyZW50QWNjZWxNZWFzdXJlbWVudC5zYW1wbGUpO1xuICB0aGlzLm1lYXN1cmVkR3Jhdml0eS5ub3JtYWxpemUoKTtcblxuICAvLyBDb21wYXJlIGVzdGltYXRlZCBncmF2aXR5IHdpdGggbWVhc3VyZWQgZ3Jhdml0eSwgZ2V0IHRoZSBkZWx0YSBxdWF0ZXJuaW9uXG4gIC8vIGJldHdlZW4gdGhlIHR3by5cbiAgdmFyIGRlbHRhUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIGRlbHRhUS5zZXRGcm9tVW5pdFZlY3RvcnModGhpcy5lc3RpbWF0ZWRHcmF2aXR5LCB0aGlzLm1lYXN1cmVkR3Jhdml0eSk7XG4gIGRlbHRhUS5pbnZlcnNlKCk7XG5cbiAgaWYgKFV0aWwuaXNEZWJ1ZygpKSB7XG4gICAgY29uc29sZS5sb2coJ0RlbHRhOiAlZCBkZWcsIEdfZXN0OiAoJXMsICVzLCAlcyksIEdfbWVhczogKCVzLCAlcywgJXMpJyxcbiAgICAgICAgICAgICAgICBNYXRoVXRpbC5yYWRUb0RlZyAqIFV0aWwuZ2V0UXVhdGVybmlvbkFuZ2xlKGRlbHRhUSksXG4gICAgICAgICAgICAgICAgKHRoaXMuZXN0aW1hdGVkR3Jhdml0eS54KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLmVzdGltYXRlZEdyYXZpdHkueSkudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5lc3RpbWF0ZWRHcmF2aXR5LnopLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMubWVhc3VyZWRHcmF2aXR5LngpLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMubWVhc3VyZWRHcmF2aXR5LnkpLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMubWVhc3VyZWRHcmF2aXR5LnopLnRvRml4ZWQoMSkpO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIHRoZSBTTEVSUCB0YXJnZXQ6IGN1cnJlbnQgb3JpZW50YXRpb24gcGx1cyB0aGUgbWVhc3VyZWQtZXN0aW1hdGVkXG4gIC8vIHF1YXRlcm5pb24gZGVsdGEuXG4gIHZhciB0YXJnZXRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdGFyZ2V0US5jb3B5KHRoaXMuZmlsdGVyUSk7XG4gIHRhcmdldFEubXVsdGlwbHkoZGVsdGFRKTtcblxuICAvLyBTTEVSUCBmYWN0b3I6IDAgaXMgcHVyZSBneXJvLCAxIGlzIHB1cmUgYWNjZWwuXG4gIHRoaXMuZmlsdGVyUS5zbGVycCh0YXJnZXRRLCAxIC0gdGhpcy5rRmlsdGVyKTtcblxuICB0aGlzLnByZXZpb3VzRmlsdGVyUS5jb3B5KHRoaXMuZmlsdGVyUSk7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5nZXRPcmllbnRhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5maWx0ZXJRO1xufTtcblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUuYWNjZWxUb1F1YXRlcm5pb25fID0gZnVuY3Rpb24oYWNjZWwpIHtcbiAgdmFyIG5vcm1BY2NlbCA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIG5vcm1BY2NlbC5jb3B5KGFjY2VsKTtcbiAgbm9ybUFjY2VsLm5vcm1hbGl6ZSgpO1xuICB2YXIgcXVhdCA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHF1YXQuc2V0RnJvbVVuaXRWZWN0b3JzKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDAsIDAsIC0xKSwgbm9ybUFjY2VsKTtcbiAgcXVhdC5pbnZlcnNlKCk7XG4gIHJldHVybiBxdWF0O1xufTtcblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUuZ3lyb1RvUXVhdGVybmlvbkRlbHRhXyA9IGZ1bmN0aW9uKGd5cm8sIGR0KSB7XG4gIC8vIEV4dHJhY3QgYXhpcyBhbmQgYW5nbGUgZnJvbSB0aGUgZ3lyb3Njb3BlIGRhdGEuXG4gIHZhciBxdWF0ID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdmFyIGF4aXMgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuICBheGlzLmNvcHkoZ3lybyk7XG4gIGF4aXMubm9ybWFsaXplKCk7XG4gIHF1YXQuc2V0RnJvbUF4aXNBbmdsZShheGlzLCBneXJvLmxlbmd0aCgpICogZHQpO1xuICByZXR1cm4gcXVhdDtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGVtZW50YXJ5RmlsdGVyO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBDb21wbGVtZW50YXJ5RmlsdGVyID0gcmVxdWlyZSgnLi9jb21wbGVtZW50YXJ5LWZpbHRlci5qcycpO1xudmFyIFBvc2VQcmVkaWN0b3IgPSByZXF1aXJlKCcuL3Bvc2UtcHJlZGljdG9yLmpzJyk7XG52YXIgVG91Y2hQYW5uZXIgPSByZXF1aXJlKCcuLi90b3VjaC1wYW5uZXIuanMnKTtcbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4uL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbi8qKlxuICogVGhlIHBvc2Ugc2Vuc29yLCBpbXBsZW1lbnRlZCB1c2luZyBEZXZpY2VNb3Rpb24gQVBJcy5cbiAqL1xuZnVuY3Rpb24gRnVzaW9uUG9zZVNlbnNvcigpIHtcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbDpmdXNlZCc7XG4gIHRoaXMuZGV2aWNlTmFtZSA9ICdWUiBQb3NpdGlvbiBEZXZpY2UgKHdlYnZyLXBvbHlmaWxsOmZ1c2VkKSc7XG5cbiAgdGhpcy5hY2NlbGVyb21ldGVyID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgdGhpcy5neXJvc2NvcGUgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuXG4gIHRoaXMuc3RhcnQoKTtcblxuICB0aGlzLmZpbHRlciA9IG5ldyBDb21wbGVtZW50YXJ5RmlsdGVyKHdpbmRvdy5XZWJWUkNvbmZpZy5LX0ZJTFRFUik7XG4gIHRoaXMucG9zZVByZWRpY3RvciA9IG5ldyBQb3NlUHJlZGljdG9yKHdpbmRvdy5XZWJWUkNvbmZpZy5QUkVESUNUSU9OX1RJTUVfUyk7XG4gIHRoaXMudG91Y2hQYW5uZXIgPSBuZXcgVG91Y2hQYW5uZXIoKTtcblxuICB0aGlzLmZpbHRlclRvV29ybGRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcblxuICAvLyBTZXQgdGhlIGZpbHRlciB0byB3b3JsZCB0cmFuc2Zvcm0sIGRlcGVuZGluZyBvbiBPUy5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMuZmlsdGVyVG9Xb3JsZFEuc2V0RnJvbUF4aXNBbmdsZShuZXcgTWF0aFV0aWwuVmVjdG9yMygxLCAwLCAwKSwgTWF0aC5QSSAvIDIpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZmlsdGVyVG9Xb3JsZFEuc2V0RnJvbUF4aXNBbmdsZShuZXcgTWF0aFV0aWwuVmVjdG9yMygxLCAwLCAwKSwgLU1hdGguUEkgLyAyKTtcbiAgfVxuXG4gIHRoaXMuaW52ZXJzZVdvcmxkVG9TY3JlZW5RID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdGhpcy53b3JsZFRvU2NyZWVuUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHRoaXMub3JpZ2luYWxQb3NlQWRqdXN0USA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHRoaXMub3JpZ2luYWxQb3NlQWRqdXN0US5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDAsIDAsIDEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC13aW5kb3cub3JpZW50YXRpb24gKiBNYXRoLlBJIC8gMTgwKTtcblxuICB0aGlzLnNldFNjcmVlblRyYW5zZm9ybV8oKTtcbiAgLy8gQWRqdXN0IHRoaXMgZmlsdGVyIGZvciBiZWluZyBpbiBsYW5kc2NhcGUgbW9kZS5cbiAgaWYgKFV0aWwuaXNMYW5kc2NhcGVNb2RlKCkpIHtcbiAgICB0aGlzLmZpbHRlclRvV29ybGRRLm11bHRpcGx5KHRoaXMuaW52ZXJzZVdvcmxkVG9TY3JlZW5RKTtcbiAgfVxuXG4gIC8vIEtlZXAgdHJhY2sgb2YgYSByZXNldCB0cmFuc2Zvcm0gZm9yIHJlc2V0U2Vuc29yLlxuICB0aGlzLnJlc2V0USA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG5cbiAgdGhpcy5pc0ZpcmVmb3hBbmRyb2lkID0gVXRpbC5pc0ZpcmVmb3hBbmRyb2lkKCk7XG4gIHRoaXMuaXNJT1MgPSBVdGlsLmlzSU9TKCk7XG5cbiAgdGhpcy5vcmllbnRhdGlvbk91dF8gPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xufVxuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAvLyBUaGlzIFBvc2VTZW5zb3IgZG9lc24ndCBzdXBwb3J0IHBvc2l0aW9uXG4gIHJldHVybiBudWxsO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuZ2V0T3JpZW50YXRpb24gPSBmdW5jdGlvbigpIHtcbiAgLy8gQ29udmVydCBmcm9tIGZpbHRlciBzcGFjZSB0byB0aGUgdGhlIHNhbWUgc3lzdGVtIHVzZWQgYnkgdGhlXG4gIC8vIGRldmljZW9yaWVudGF0aW9uIGV2ZW50LlxuICB2YXIgb3JpZW50YXRpb24gPSB0aGlzLmZpbHRlci5nZXRPcmllbnRhdGlvbigpO1xuXG4gIC8vIFByZWRpY3Qgb3JpZW50YXRpb24uXG4gIHRoaXMucHJlZGljdGVkUSA9IHRoaXMucG9zZVByZWRpY3Rvci5nZXRQcmVkaWN0aW9uKG9yaWVudGF0aW9uLCB0aGlzLmd5cm9zY29wZSwgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMpO1xuXG4gIC8vIENvbnZlcnQgdG8gVEhSRUUgY29vcmRpbmF0ZSBzeXN0ZW06IC1aIGZvcndhcmQsIFkgdXAsIFggcmlnaHQuXG4gIHZhciBvdXQgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICBvdXQuY29weSh0aGlzLmZpbHRlclRvV29ybGRRKTtcbiAgb3V0Lm11bHRpcGx5KHRoaXMucmVzZXRRKTtcbiAgaWYgKCF3aW5kb3cuV2ViVlJDb25maWcuVE9VQ0hfUEFOTkVSX0RJU0FCTEVEKSB7XG4gICAgb3V0Lm11bHRpcGx5KHRoaXMudG91Y2hQYW5uZXIuZ2V0T3JpZW50YXRpb24oKSk7XG4gIH1cbiAgb3V0Lm11bHRpcGx5KHRoaXMucHJlZGljdGVkUSk7XG4gIG91dC5tdWx0aXBseSh0aGlzLndvcmxkVG9TY3JlZW5RKTtcblxuICAvLyBIYW5kbGUgdGhlIHlhdy1vbmx5IGNhc2UuXG4gIGlmICh3aW5kb3cuV2ViVlJDb25maWcuWUFXX09OTFkpIHtcbiAgICAvLyBNYWtlIGEgcXVhdGVybmlvbiB0aGF0IG9ubHkgdHVybnMgYXJvdW5kIHRoZSBZLWF4aXMuXG4gICAgb3V0LnggPSAwO1xuICAgIG91dC56ID0gMDtcbiAgICBvdXQubm9ybWFsaXplKCk7XG4gIH1cblxuICB0aGlzLm9yaWVudGF0aW9uT3V0X1swXSA9IG91dC54O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1sxXSA9IG91dC55O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1syXSA9IG91dC56O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1szXSA9IG91dC53O1xuICByZXR1cm4gdGhpcy5vcmllbnRhdGlvbk91dF87XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5yZXNldFBvc2UgPSBmdW5jdGlvbigpIHtcbiAgLy8gUmVkdWNlIHRvIGludmVydGVkIHlhdy1vbmx5LlxuICB0aGlzLnJlc2V0US5jb3B5KHRoaXMuZmlsdGVyLmdldE9yaWVudGF0aW9uKCkpO1xuICB0aGlzLnJlc2V0US54ID0gMDtcbiAgdGhpcy5yZXNldFEueSA9IDA7XG4gIHRoaXMucmVzZXRRLnogKj0gLTE7XG4gIHRoaXMucmVzZXRRLm5vcm1hbGl6ZSgpO1xuXG4gIC8vIFRha2UgaW50byBhY2NvdW50IGV4dHJhIHRyYW5zZm9ybWF0aW9ucyBpbiBsYW5kc2NhcGUgbW9kZS5cbiAgaWYgKFV0aWwuaXNMYW5kc2NhcGVNb2RlKCkpIHtcbiAgICB0aGlzLnJlc2V0US5tdWx0aXBseSh0aGlzLmludmVyc2VXb3JsZFRvU2NyZWVuUSk7XG4gIH1cblxuICAvLyBUYWtlIGludG8gYWNjb3VudCBvcmlnaW5hbCBwb3NlLlxuICB0aGlzLnJlc2V0US5tdWx0aXBseSh0aGlzLm9yaWdpbmFsUG9zZUFkanVzdFEpO1xuXG4gIGlmICghd2luZG93LldlYlZSQ29uZmlnLlRPVUNIX1BBTk5FUl9ESVNBQkxFRCkge1xuICAgIHRoaXMudG91Y2hQYW5uZXIucmVzZXRTZW5zb3IoKTtcbiAgfVxufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUub25EZXZpY2VNb3Rpb25fID0gZnVuY3Rpb24oZGV2aWNlTW90aW9uKSB7XG4gIHRoaXMudXBkYXRlRGV2aWNlTW90aW9uXyhkZXZpY2VNb3Rpb24pO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUudXBkYXRlRGV2aWNlTW90aW9uXyA9IGZ1bmN0aW9uKGRldmljZU1vdGlvbikge1xuICB2YXIgYWNjR3Jhdml0eSA9IGRldmljZU1vdGlvbi5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5O1xuICB2YXIgcm90UmF0ZSA9IGRldmljZU1vdGlvbi5yb3RhdGlvblJhdGU7XG4gIHZhciB0aW1lc3RhbXBTID0gZGV2aWNlTW90aW9uLnRpbWVTdGFtcCAvIDEwMDA7XG5cbiAgdmFyIGRlbHRhUyA9IHRpbWVzdGFtcFMgLSB0aGlzLnByZXZpb3VzVGltZXN0YW1wUztcbiAgaWYgKGRlbHRhUyA8PSBVdGlsLk1JTl9USU1FU1RFUCB8fCBkZWx0YVMgPiBVdGlsLk1BWF9USU1FU1RFUCkge1xuICAgIGNvbnNvbGUud2FybignSW52YWxpZCB0aW1lc3RhbXBzIGRldGVjdGVkLiBUaW1lIHN0ZXAgYmV0d2VlbiBzdWNjZXNzaXZlICcgK1xuICAgICAgICAgICAgICAgICAnZ3lyb3Njb3BlIHNlbnNvciBzYW1wbGVzIGlzIHZlcnkgc21hbGwgb3Igbm90IG1vbm90b25pYycpO1xuICAgIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gdGltZXN0YW1wUztcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5hY2NlbGVyb21ldGVyLnNldCgtYWNjR3Jhdml0eS54LCAtYWNjR3Jhdml0eS55LCAtYWNjR3Jhdml0eS56KTtcbiAgdGhpcy5neXJvc2NvcGUuc2V0KHJvdFJhdGUuYWxwaGEsIHJvdFJhdGUuYmV0YSwgcm90UmF0ZS5nYW1tYSk7XG5cbiAgLy8gV2l0aCBpT1MgYW5kIEZpcmVmb3ggQW5kcm9pZCwgcm90YXRpb25SYXRlIGlzIHJlcG9ydGVkIGluIGRlZ3JlZXMsXG4gIC8vIHNvIHdlIGZpcnN0IGNvbnZlcnQgdG8gcmFkaWFucy5cbiAgaWYgKHRoaXMuaXNJT1MgfHwgdGhpcy5pc0ZpcmVmb3hBbmRyb2lkKSB7XG4gICAgdGhpcy5neXJvc2NvcGUubXVsdGlwbHlTY2FsYXIoTWF0aC5QSSAvIDE4MCk7XG4gIH1cblxuICB0aGlzLmZpbHRlci5hZGRBY2NlbE1lYXN1cmVtZW50KHRoaXMuYWNjZWxlcm9tZXRlciwgdGltZXN0YW1wUyk7XG4gIHRoaXMuZmlsdGVyLmFkZEd5cm9NZWFzdXJlbWVudCh0aGlzLmd5cm9zY29wZSwgdGltZXN0YW1wUyk7XG5cbiAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSB0aW1lc3RhbXBTO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUub25PcmllbnRhdGlvbkNoYW5nZV8gPSBmdW5jdGlvbihzY3JlZW5PcmllbnRhdGlvbikge1xuICB0aGlzLnNldFNjcmVlblRyYW5zZm9ybV8oKTtcbn07XG5cbi8qKlxuICogVGhpcyBpcyBvbmx5IG5lZWRlZCBpZiB3ZSBhcmUgaW4gYW4gY3Jvc3Mgb3JpZ2luIGlmcmFtZSBvbiBpT1MgdG8gd29yayBhcm91bmRcbiAqIHRoaXMgaXNzdWU6IGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNTIyOTkuXG4gKi9cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLm9uTWVzc2FnZV8gPSBmdW5jdGlvbihldmVudCkge1xuICB2YXIgbWVzc2FnZSA9IGV2ZW50LmRhdGE7XG5cbiAgLy8gSWYgdGhlcmUncyBubyBtZXNzYWdlIHR5cGUsIGlnbm9yZSBpdC5cbiAgaWYgKCFtZXNzYWdlIHx8ICFtZXNzYWdlLnR5cGUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJZ25vcmUgYWxsIG1lc3NhZ2VzIHRoYXQgYXJlbid0IGRldmljZW1vdGlvbi5cbiAgdmFyIHR5cGUgPSBtZXNzYWdlLnR5cGUudG9Mb3dlckNhc2UoKTtcbiAgaWYgKHR5cGUgIT09ICdkZXZpY2Vtb3Rpb24nKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVXBkYXRlIGRldmljZSBtb3Rpb24uXG4gIHRoaXMudXBkYXRlRGV2aWNlTW90aW9uXyhtZXNzYWdlLmRldmljZU1vdGlvbkV2ZW50KTtcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLnNldFNjcmVlblRyYW5zZm9ybV8gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy53b3JsZFRvU2NyZWVuUS5zZXQoMCwgMCwgMCwgMSk7XG4gIHN3aXRjaCAod2luZG93Lm9yaWVudGF0aW9uKSB7XG4gICAgY2FzZSAwOlxuICAgICAgYnJlYWs7XG4gICAgY2FzZSA5MDpcbiAgICAgIHRoaXMud29ybGRUb1NjcmVlblEuc2V0RnJvbUF4aXNBbmdsZShuZXcgTWF0aFV0aWwuVmVjdG9yMygwLCAwLCAxKSwgLU1hdGguUEkgLyAyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgLTkwOlxuICAgICAgdGhpcy53b3JsZFRvU2NyZWVuUS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDAsIDAsIDEpLCBNYXRoLlBJIC8gMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDE4MDpcbiAgICAgIC8vIFRPRE8uXG4gICAgICBicmVhaztcbiAgfVxuICB0aGlzLmludmVyc2VXb3JsZFRvU2NyZWVuUS5jb3B5KHRoaXMud29ybGRUb1NjcmVlblEpO1xuICB0aGlzLmludmVyc2VXb3JsZFRvU2NyZWVuUS5pbnZlcnNlKCk7XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm9uRGV2aWNlTW90aW9uQ2FsbGJhY2tfID0gdGhpcy5vbkRldmljZU1vdGlvbl8uYmluZCh0aGlzKTtcbiAgdGhpcy5vbk9yaWVudGF0aW9uQ2hhbmdlQ2FsbGJhY2tfID0gdGhpcy5vbk9yaWVudGF0aW9uQ2hhbmdlXy5iaW5kKHRoaXMpO1xuICB0aGlzLm9uTWVzc2FnZUNhbGxiYWNrXyA9IHRoaXMub25NZXNzYWdlXy5iaW5kKHRoaXMpO1xuXG4gIC8vIE9ubHkgbGlzdGVuIGZvciBwb3N0TWVzc2FnZXMgaWYgd2UncmUgaW4gYW4gaU9TIGFuZCBlbWJlZGRlZCBpbnNpZGUgYSBjcm9zc1xuICAvLyBkb21haW4gSUZyYW1lLiBJbiB0aGlzIGNhc2UsIHRoZSBwb2x5ZmlsbCBjYW4gc3RpbGwgd29yayBpZiB0aGUgY29udGFpbmluZ1xuICAvLyBwYWdlIHNlbmRzIHN5bnRoZXRpYyBkZXZpY2Vtb3Rpb24gZXZlbnRzLiBGb3IgYW4gZXhhbXBsZSBvZiB0aGlzLCBzZWVcbiAgLy8gaWZyYW1lLW1lc3NhZ2Utc2VuZGVyLmpzIGluIFZSIFZpZXc6IGh0dHBzOi8vZ29vLmdsL1hEdHZGWlxuICBpZiAoVXRpbC5pc0lPUygpICYmIFV0aWwuaXNJbnNpZGVDcm9zc0RvbWFpbklGcmFtZSgpKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLm9uTWVzc2FnZUNhbGxiYWNrXyk7XG4gIH1cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5vbk9yaWVudGF0aW9uQ2hhbmdlQ2FsbGJhY2tfKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2RldmljZW1vdGlvbicsIHRoaXMub25EZXZpY2VNb3Rpb25DYWxsYmFja18pO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignZGV2aWNlbW90aW9uJywgdGhpcy5vbkRldmljZU1vdGlvbkNhbGxiYWNrXyk7XG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub25PcmllbnRhdGlvbkNoYW5nZUNhbGxiYWNrXyk7XG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5vbk1lc3NhZ2VDYWxsYmFja18pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGdXNpb25Qb3NlU2Vuc29yO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4uL21hdGgtdXRpbCcpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbi8qKlxuICogR2l2ZW4gYW4gb3JpZW50YXRpb24gYW5kIHRoZSBneXJvc2NvcGUgZGF0YSwgcHJlZGljdHMgdGhlIGZ1dHVyZSBvcmllbnRhdGlvblxuICogb2YgdGhlIGhlYWQuIFRoaXMgbWFrZXMgcmVuZGVyaW5nIGFwcGVhciBmYXN0ZXIuXG4gKlxuICogQWxzbyBzZWU6IGh0dHA6Ly9tc2wuY3MudWl1Yy5lZHUvfmxhdmFsbGUvcGFwZXJzL0xhdlllckthdEFudDE0LnBkZlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVkaWN0aW9uVGltZVMgdGltZSBmcm9tIGhlYWQgbW92ZW1lbnQgdG8gdGhlIGFwcGVhcmFuY2Ugb2ZcbiAqIHRoZSBjb3JyZXNwb25kaW5nIGltYWdlLlxuICovXG5mdW5jdGlvbiBQb3NlUHJlZGljdG9yKHByZWRpY3Rpb25UaW1lUykge1xuICB0aGlzLnByZWRpY3Rpb25UaW1lUyA9IHByZWRpY3Rpb25UaW1lUztcblxuICAvLyBUaGUgcXVhdGVybmlvbiBjb3JyZXNwb25kaW5nIHRvIHRoZSBwcmV2aW91cyBzdGF0ZS5cbiAgdGhpcy5wcmV2aW91c1EgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICAvLyBQcmV2aW91cyB0aW1lIGEgcHJlZGljdGlvbiBvY2N1cnJlZC5cbiAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSBudWxsO1xuXG4gIC8vIFRoZSBkZWx0YSBxdWF0ZXJuaW9uIHRoYXQgYWRqdXN0cyB0aGUgY3VycmVudCBwb3NlLlxuICB0aGlzLmRlbHRhUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIC8vIFRoZSBvdXRwdXQgcXVhdGVybmlvbi5cbiAgdGhpcy5vdXRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbn1cblxuUG9zZVByZWRpY3Rvci5wcm90b3R5cGUuZ2V0UHJlZGljdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRRLCBneXJvLCB0aW1lc3RhbXBTKSB7XG4gIGlmICghdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMpIHtcbiAgICB0aGlzLnByZXZpb3VzUS5jb3B5KGN1cnJlbnRRKTtcbiAgICB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG4gICAgcmV0dXJuIGN1cnJlbnRRO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIGF4aXMgYW5kIGFuZ2xlIGJhc2VkIG9uIGd5cm9zY29wZSByb3RhdGlvbiByYXRlIGRhdGEuXG4gIHZhciBheGlzID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgYXhpcy5jb3B5KGd5cm8pO1xuICBheGlzLm5vcm1hbGl6ZSgpO1xuXG4gIHZhciBhbmd1bGFyU3BlZWQgPSBneXJvLmxlbmd0aCgpO1xuXG4gIC8vIElmIHdlJ3JlIHJvdGF0aW5nIHNsb3dseSwgZG9uJ3QgZG8gcHJlZGljdGlvbi5cbiAgaWYgKGFuZ3VsYXJTcGVlZCA8IE1hdGhVdGlsLmRlZ1RvUmFkICogMjApIHtcbiAgICBpZiAoVXRpbC5pc0RlYnVnKCkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNb3Zpbmcgc2xvd2x5LCBhdCAlcyBkZWcvczogbm8gcHJlZGljdGlvbicsXG4gICAgICAgICAgICAgICAgICAoTWF0aFV0aWwucmFkVG9EZWcgKiBhbmd1bGFyU3BlZWQpLnRvRml4ZWQoMSkpO1xuICAgIH1cbiAgICB0aGlzLm91dFEuY29weShjdXJyZW50USk7XG4gICAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG4gICAgcmV0dXJuIHRoaXMub3V0UTtcbiAgfVxuXG4gIC8vIEdldCB0aGUgcHJlZGljdGVkIGFuZ2xlIGJhc2VkIG9uIHRoZSB0aW1lIGRlbHRhIGFuZCBsYXRlbmN5LlxuICB2YXIgZGVsdGFUID0gdGltZXN0YW1wUyAtIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTO1xuICB2YXIgcHJlZGljdEFuZ2xlID0gYW5ndWxhclNwZWVkICogdGhpcy5wcmVkaWN0aW9uVGltZVM7XG5cbiAgdGhpcy5kZWx0YVEuc2V0RnJvbUF4aXNBbmdsZShheGlzLCBwcmVkaWN0QW5nbGUpO1xuICB0aGlzLm91dFEuY29weSh0aGlzLnByZXZpb3VzUSk7XG4gIHRoaXMub3V0US5tdWx0aXBseSh0aGlzLmRlbHRhUSk7XG5cbiAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG4gIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gdGltZXN0YW1wUztcblxuICByZXR1cm4gdGhpcy5vdXRRO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2VQcmVkaWN0b3I7XG4iLCJmdW5jdGlvbiBTZW5zb3JTYW1wbGUoc2FtcGxlLCB0aW1lc3RhbXBTKSB7XG4gIHRoaXMuc2V0KHNhbXBsZSwgdGltZXN0YW1wUyk7XG59O1xuXG5TZW5zb3JTYW1wbGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKHNhbXBsZSwgdGltZXN0YW1wUykge1xuICB0aGlzLnNhbXBsZSA9IHNhbXBsZTtcbiAgdGhpcy50aW1lc3RhbXBTID0gdGltZXN0YW1wUztcbn07XG5cblNlbnNvclNhbXBsZS5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKHNlbnNvclNhbXBsZSkge1xuICB0aGlzLnNldChzZW5zb3JTYW1wbGUuc2FtcGxlLCBzZW5zb3JTYW1wbGUudGltZXN0YW1wUyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbnNvclNhbXBsZTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgTWF0aFV0aWwgPSByZXF1aXJlKCcuL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxudmFyIFJPVEFURV9TUEVFRCA9IDAuNTtcbi8qKlxuICogUHJvdmlkZXMgYSBxdWF0ZXJuaW9uIHJlc3BvbnNpYmxlIGZvciBwcmUtcGFubmluZyB0aGUgc2NlbmUgYmVmb3JlIGZ1cnRoZXJcbiAqIHRyYW5zZm9ybWF0aW9ucyBkdWUgdG8gZGV2aWNlIHNlbnNvcnMuXG4gKi9cbmZ1bmN0aW9uIFRvdWNoUGFubmVyKCkge1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0Xy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmVfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmRfLmJpbmQodGhpcykpO1xuXG4gIHRoaXMuaXNUb3VjaGluZyA9IGZhbHNlO1xuICB0aGlzLnJvdGF0ZVN0YXJ0ID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5yb3RhdGVFbmQgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMigpO1xuICB0aGlzLnJvdGF0ZURlbHRhID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcblxuICB0aGlzLnRoZXRhID0gMDtcbiAgdGhpcy5vcmllbnRhdGlvbiA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG59XG5cblRvdWNoUGFubmVyLnByb3RvdHlwZS5nZXRPcmllbnRhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm9yaWVudGF0aW9uLnNldEZyb21FdWxlclhZWigwLCAwLCB0aGlzLnRoZXRhKTtcbiAgcmV0dXJuIHRoaXMub3JpZW50YXRpb247XG59O1xuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUucmVzZXRTZW5zb3IgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy50aGV0YSA9IDA7XG59O1xuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUub25Ub3VjaFN0YXJ0XyA9IGZ1bmN0aW9uKGUpIHtcbiAgLy8gT25seSByZXNwb25kIGlmIHRoZXJlIGlzIGV4YWN0bHkgb25lIHRvdWNoLlxuICAvLyBOb3RlIHRoYXQgdGhlIERheWRyZWFtIGNvbnRyb2xsZXIgcGFzc2VzIGluIGEgYHRvdWNoc3RhcnRgIGV2ZW50IHdpdGhcbiAgLy8gbm8gYHRvdWNoZXNgIHByb3BlcnR5LCBzbyB3ZSBtdXN0IGNoZWNrIGZvciB0aGF0IGNhc2UgdG9vLlxuICBpZiAoIWUudG91Y2hlcyB8fCBlLnRvdWNoZXMubGVuZ3RoICE9IDEpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5yb3RhdGVTdGFydC5zZXQoZS50b3VjaGVzWzBdLnBhZ2VYLCBlLnRvdWNoZXNbMF0ucGFnZVkpO1xuICB0aGlzLmlzVG91Y2hpbmcgPSB0cnVlO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLm9uVG91Y2hNb3ZlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKCF0aGlzLmlzVG91Y2hpbmcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5yb3RhdGVFbmQuc2V0KGUudG91Y2hlc1swXS5wYWdlWCwgZS50b3VjaGVzWzBdLnBhZ2VZKTtcbiAgdGhpcy5yb3RhdGVEZWx0YS5zdWJWZWN0b3JzKHRoaXMucm90YXRlRW5kLCB0aGlzLnJvdGF0ZVN0YXJ0KTtcbiAgdGhpcy5yb3RhdGVTdGFydC5jb3B5KHRoaXMucm90YXRlRW5kKTtcblxuICAvLyBPbiBpT1MsIGRpcmVjdGlvbiBpcyBpbnZlcnRlZC5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMucm90YXRlRGVsdGEueCAqPSAtMTtcbiAgfVxuXG4gIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcbiAgdGhpcy50aGV0YSArPSAyICogTWF0aC5QSSAqIHRoaXMucm90YXRlRGVsdGEueCAvIGVsZW1lbnQuY2xpZW50V2lkdGggKiBST1RBVEVfU1BFRUQ7XG59O1xuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUub25Ub3VjaEVuZF8gPSBmdW5jdGlvbihlKSB7XG4gIHRoaXMuaXNUb3VjaGluZyA9IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb3VjaFBhbm5lcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gd2luZG93LlV0aWwgfHwge307XG5cblV0aWwuTUlOX1RJTUVTVEVQID0gMC4wMDE7XG5VdGlsLk1BWF9USU1FU1RFUCA9IDE7XG5cblV0aWwuYmFzZTY0ID0gZnVuY3Rpb24obWltZVR5cGUsIGJhc2U2NCkge1xuICByZXR1cm4gJ2RhdGE6JyArIG1pbWVUeXBlICsgJztiYXNlNjQsJyArIGJhc2U2NDtcbn07XG5cblV0aWwuY2xhbXAgPSBmdW5jdGlvbih2YWx1ZSwgbWluLCBtYXgpIHtcbiAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KG1pbiwgdmFsdWUpLCBtYXgpO1xufTtcblxuVXRpbC5sZXJwID0gZnVuY3Rpb24oYSwgYiwgdCkge1xuICByZXR1cm4gYSArICgoYiAtIGEpICogdCk7XG59O1xuXG4vKipcbiAqIExpZ2h0IHBvbHlmaWxsIGZvciBgUHJvbWlzZS5yYWNlYC4gUmV0dXJuc1xuICogYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgZmlyc3QgcHJvbWlzZVxuICogcHJvdmlkZWQgcmVzb2x2ZXMuXG4gKlxuICogQHBhcmFtIHtBcnJheTxQcm9taXNlPn0gcHJvbWlzZXNcbiAqL1xuVXRpbC5yYWNlID0gZnVuY3Rpb24ocHJvbWlzZXMpIHtcbiAgaWYgKFByb21pc2UucmFjZSkge1xuICAgIHJldHVybiBQcm9taXNlLnJhY2UocHJvbWlzZXMpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb21pc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwcm9taXNlc1tpXS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxuICB9KTtcbn07XG5cblV0aWwuaXNJT1MgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpc0lPUyA9IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gaXNJT1M7XG4gIH07XG59KSgpO1xuXG5VdGlsLmlzV2ViVmlld0FuZHJvaWQgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpc1dlYlZpZXdBbmRyb2lkID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdWZXJzaW9uJykgIT09IC0xICYmXG4gICAgICBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSAhPT0gLTEgJiZcbiAgICAgIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQ2hyb21lJykgIT09IC0xO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzV2ViVmlld0FuZHJvaWQ7XG4gIH07XG59KSgpO1xuXG5VdGlsLmlzU2FmYXJpID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNTYWZhcmkgPSAvXigoPyFjaHJvbWV8YW5kcm9pZCkuKSpzYWZhcmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzU2FmYXJpO1xuICB9O1xufSkoKTtcblxuVXRpbC5pc0ZpcmVmb3hBbmRyb2lkID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNGaXJlZm94QW5kcm9pZCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignRmlyZWZveCcpICE9PSAtMSAmJlxuICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgIT09IC0xO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzRmlyZWZveEFuZHJvaWQ7XG4gIH07XG59KSgpO1xuXG5VdGlsLmlzTGFuZHNjYXBlTW9kZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHdpbmRvdy5vcmllbnRhdGlvbiA9PSA5MCB8fCB3aW5kb3cub3JpZW50YXRpb24gPT0gLTkwKTtcbn07XG5cbi8vIEhlbHBlciBtZXRob2QgdG8gdmFsaWRhdGUgdGhlIHRpbWUgc3RlcHMgb2Ygc2Vuc29yIHRpbWVzdGFtcHMuXG5VdGlsLmlzVGltZXN0YW1wRGVsdGFWYWxpZCA9IGZ1bmN0aW9uKHRpbWVzdGFtcERlbHRhUykge1xuICBpZiAoaXNOYU4odGltZXN0YW1wRGVsdGFTKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodGltZXN0YW1wRGVsdGFTIDw9IFV0aWwuTUlOX1RJTUVTVEVQKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0aW1lc3RhbXBEZWx0YVMgPiBVdGlsLk1BWF9USU1FU1RFUCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblV0aWwuZ2V0U2NyZWVuV2lkdGggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE1hdGgubWF4KHdpbmRvdy5zY3JlZW4ud2lkdGgsIHdpbmRvdy5zY3JlZW4uaGVpZ2h0KSAqXG4gICAgICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbn07XG5cblV0aWwuZ2V0U2NyZWVuSGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLm1pbih3aW5kb3cuc2NyZWVuLndpZHRoLCB3aW5kb3cuc2NyZWVuLmhlaWdodCkgKlxuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW87XG59O1xuXG5VdGlsLnJlcXVlc3RGdWxsc2NyZWVuID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICBpZiAoVXRpbC5pc1dlYlZpZXdBbmRyb2lkKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW4pIHtcbiAgICBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC5tc1JlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgZWxlbWVudC5tc1JlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5VdGlsLmV4aXRGdWxsc2NyZWVuID0gZnVuY3Rpb24oKSB7XG4gIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblV0aWwuZ2V0RnVsbHNjcmVlbkVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICBkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVsZW1lbnQgfHxcbiAgICAgIGRvY3VtZW50Lm1zRnVsbHNjcmVlbkVsZW1lbnQ7XG59O1xuXG5VdGlsLmxpbmtQcm9ncmFtID0gZnVuY3Rpb24oZ2wsIHZlcnRleFNvdXJjZSwgZnJhZ21lbnRTb3VyY2UsIGF0dHJpYkxvY2F0aW9uTWFwKSB7XG4gIC8vIE5vIGVycm9yIGNoZWNraW5nIGZvciBicmV2aXR5LlxuICB2YXIgdmVydGV4U2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLlZFUlRFWF9TSEFERVIpO1xuICBnbC5zaGFkZXJTb3VyY2UodmVydGV4U2hhZGVyLCB2ZXJ0ZXhTb3VyY2UpO1xuICBnbC5jb21waWxlU2hhZGVyKHZlcnRleFNoYWRlcik7XG5cbiAgdmFyIGZyYWdtZW50U2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XG4gIGdsLnNoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlciwgZnJhZ21lbnRTb3VyY2UpO1xuICBnbC5jb21waWxlU2hhZGVyKGZyYWdtZW50U2hhZGVyKTtcblxuICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZlcnRleFNoYWRlcik7XG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcmFnbWVudFNoYWRlcik7XG5cbiAgZm9yICh2YXIgYXR0cmliTmFtZSBpbiBhdHRyaWJMb2NhdGlvbk1hcClcbiAgICBnbC5iaW5kQXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgYXR0cmliTG9jYXRpb25NYXBbYXR0cmliTmFtZV0sIGF0dHJpYk5hbWUpO1xuXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuXG4gIGdsLmRlbGV0ZVNoYWRlcih2ZXJ0ZXhTaGFkZXIpO1xuICBnbC5kZWxldGVTaGFkZXIoZnJhZ21lbnRTaGFkZXIpO1xuXG4gIHJldHVybiBwcm9ncmFtO1xufTtcblxuVXRpbC5nZXRQcm9ncmFtVW5pZm9ybXMgPSBmdW5jdGlvbihnbCwgcHJvZ3JhbSkge1xuICB2YXIgdW5pZm9ybXMgPSB7fTtcbiAgdmFyIHVuaWZvcm1Db3VudCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKTtcbiAgdmFyIHVuaWZvcm1OYW1lID0gJyc7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdW5pZm9ybUNvdW50OyBpKyspIHtcbiAgICB2YXIgdW5pZm9ybUluZm8gPSBnbC5nZXRBY3RpdmVVbmlmb3JtKHByb2dyYW0sIGkpO1xuICAgIHVuaWZvcm1OYW1lID0gdW5pZm9ybUluZm8ubmFtZS5yZXBsYWNlKCdbMF0nLCAnJyk7XG4gICAgdW5pZm9ybXNbdW5pZm9ybU5hbWVdID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIHVuaWZvcm1OYW1lKTtcbiAgfVxuICByZXR1cm4gdW5pZm9ybXM7XG59O1xuXG5VdGlsLm9ydGhvTWF0cml4ID0gZnVuY3Rpb24gKG91dCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcbiAgdmFyIGxyID0gMSAvIChsZWZ0IC0gcmlnaHQpLFxuICAgICAgYnQgPSAxIC8gKGJvdHRvbSAtIHRvcCksXG4gICAgICBuZiA9IDEgLyAobmVhciAtIGZhcik7XG4gIG91dFswXSA9IC0yICogbHI7XG4gIG91dFsxXSA9IDA7XG4gIG91dFsyXSA9IDA7XG4gIG91dFszXSA9IDA7XG4gIG91dFs0XSA9IDA7XG4gIG91dFs1XSA9IC0yICogYnQ7XG4gIG91dFs2XSA9IDA7XG4gIG91dFs3XSA9IDA7XG4gIG91dFs4XSA9IDA7XG4gIG91dFs5XSA9IDA7XG4gIG91dFsxMF0gPSAyICogbmY7XG4gIG91dFsxMV0gPSAwO1xuICBvdXRbMTJdID0gKGxlZnQgKyByaWdodCkgKiBscjtcbiAgb3V0WzEzXSA9ICh0b3AgKyBib3R0b20pICogYnQ7XG4gIG91dFsxNF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgb3V0WzE1XSA9IDE7XG4gIHJldHVybiBvdXQ7XG59O1xuXG5VdGlsLmNvcHlBcnJheSA9IGZ1bmN0aW9uIChzb3VyY2UsIGRlc3QpIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSBzb3VyY2UubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgZGVzdFtpXSA9IHNvdXJjZVtpXTtcbiAgfVxufTtcblxuVXRpbC5pc01vYmlsZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2hlY2sgPSBmYWxzZTtcbiAgKGZ1bmN0aW9uKGEpe2lmKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcmlzfGtpbmRsZXxsZ2UgfG1hZW1vfG1pZHB8bW1wfG1vYmlsZS4rZmlyZWZveHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyBjZXx4ZGF8eGlpbm8vaS50ZXN0KGEpfHwvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KGEuc3Vic3RyKDAsNCkpKWNoZWNrID0gdHJ1ZX0pKG5hdmlnYXRvci51c2VyQWdlbnR8fG5hdmlnYXRvci52ZW5kb3J8fHdpbmRvdy5vcGVyYSk7XG4gIHJldHVybiBjaGVjaztcbn07XG5cblV0aWwuZXh0ZW5kID0gZnVuY3Rpb24oZGVzdCwgc3JjKSB7XG4gIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGRlc3Rba2V5XSA9IHNyY1trZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZXN0O1xufVxuXG5VdGlsLnNhZmFyaUNzc1NpemVXb3JrYXJvdW5kID0gZnVuY3Rpb24oY2FudmFzKSB7XG4gIC8vIFRPRE8oc211cyk6IFJlbW92ZSB0aGlzIHdvcmthcm91bmQgd2hlbiBTYWZhcmkgZm9yIGlPUyBpcyBmaXhlZC5cbiAgLy8gaU9TIG9ubHkgd29ya2Fyb3VuZCAoZm9yIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNTI1NTYpLlxuICAvL1xuICAvLyBcIlRvIHRoZSBsYXN0IEkgZ3JhcHBsZSB3aXRoIHRoZWU7XG4gIC8vICBmcm9tIGhlbGwncyBoZWFydCBJIHN0YWIgYXQgdGhlZTtcbiAgLy8gIGZvciBoYXRlJ3Mgc2FrZSBJIHNwaXQgbXkgbGFzdCBicmVhdGggYXQgdGhlZS5cIlxuICAvLyAtLSBNb2J5IERpY2ssIGJ5IEhlcm1hbiBNZWx2aWxsZVxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgdmFyIHdpZHRoID0gY2FudmFzLnN0eWxlLndpZHRoO1xuICAgIHZhciBoZWlnaHQgPSBjYW52YXMuc3R5bGUuaGVpZ2h0O1xuICAgIGNhbnZhcy5zdHlsZS53aWR0aCA9IChwYXJzZUludCh3aWR0aCkgKyAxKSArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IChwYXJzZUludChoZWlnaHQpKSArICdweCc7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGNhbnZhcy5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICB9LCAxMDApO1xuICB9XG5cbiAgLy8gRGVidWcgb25seS5cbiAgd2luZG93LlV0aWwgPSBVdGlsO1xuICB3aW5kb3cuY2FudmFzID0gY2FudmFzO1xufTtcblxuVXRpbC5pc0RlYnVnID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBVdGlsLmdldFF1ZXJ5UGFyYW1ldGVyKCdkZWJ1ZycpO1xufTtcblxuVXRpbC5nZXRRdWVyeVBhcmFtZXRlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtdLywgXCJcXFxcW1wiKS5yZXBsYWNlKC9bXFxdXS8sIFwiXFxcXF1cIik7XG4gIHZhciByZWdleCA9IG5ldyBSZWdFeHAoXCJbXFxcXD8mXVwiICsgbmFtZSArIFwiPShbXiYjXSopXCIpLFxuICAgICAgcmVzdWx0cyA9IHJlZ2V4LmV4ZWMobG9jYXRpb24uc2VhcmNoKTtcbiAgcmV0dXJuIHJlc3VsdHMgPT09IG51bGwgPyBcIlwiIDogZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMV0ucmVwbGFjZSgvXFwrL2csIFwiIFwiKSk7XG59O1xuXG5VdGlsLmZyYW1lRGF0YUZyb21Qb3NlID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgcGlPdmVyMTgwID0gTWF0aC5QSSAvIDE4MC4wO1xuICB2YXIgcmFkNDUgPSBNYXRoLlBJICogMC4yNTtcblxuICAvLyBCb3Jyb3dlZCBmcm9tIGdsTWF0cml4LlxuICBmdW5jdGlvbiBtYXQ0X3BlcnNwZWN0aXZlRnJvbUZpZWxkT2ZWaWV3KG91dCwgZm92LCBuZWFyLCBmYXIpIHtcbiAgICB2YXIgdXBUYW4gPSBNYXRoLnRhbihmb3YgPyAoZm92LnVwRGVncmVlcyAqIHBpT3ZlcjE4MCkgOiByYWQ0NSksXG4gICAgZG93blRhbiA9IE1hdGgudGFuKGZvdiA/IChmb3YuZG93bkRlZ3JlZXMgKiBwaU92ZXIxODApIDogcmFkNDUpLFxuICAgIGxlZnRUYW4gPSBNYXRoLnRhbihmb3YgPyAoZm92LmxlZnREZWdyZWVzICogcGlPdmVyMTgwKSA6IHJhZDQ1KSxcbiAgICByaWdodFRhbiA9IE1hdGgudGFuKGZvdiA/IChmb3YucmlnaHREZWdyZWVzICogcGlPdmVyMTgwKSA6IHJhZDQ1KSxcbiAgICB4U2NhbGUgPSAyLjAgLyAobGVmdFRhbiArIHJpZ2h0VGFuKSxcbiAgICB5U2NhbGUgPSAyLjAgLyAodXBUYW4gKyBkb3duVGFuKTtcblxuICAgIG91dFswXSA9IHhTY2FsZTtcbiAgICBvdXRbMV0gPSAwLjA7XG4gICAgb3V0WzJdID0gMC4wO1xuICAgIG91dFszXSA9IDAuMDtcbiAgICBvdXRbNF0gPSAwLjA7XG4gICAgb3V0WzVdID0geVNjYWxlO1xuICAgIG91dFs2XSA9IDAuMDtcbiAgICBvdXRbN10gPSAwLjA7XG4gICAgb3V0WzhdID0gLSgobGVmdFRhbiAtIHJpZ2h0VGFuKSAqIHhTY2FsZSAqIDAuNSk7XG4gICAgb3V0WzldID0gKCh1cFRhbiAtIGRvd25UYW4pICogeVNjYWxlICogMC41KTtcbiAgICBvdXRbMTBdID0gZmFyIC8gKG5lYXIgLSBmYXIpO1xuICAgIG91dFsxMV0gPSAtMS4wO1xuICAgIG91dFsxMl0gPSAwLjA7XG4gICAgb3V0WzEzXSA9IDAuMDtcbiAgICBvdXRbMTRdID0gKGZhciAqIG5lYXIpIC8gKG5lYXIgLSBmYXIpO1xuICAgIG91dFsxNV0gPSAwLjA7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1hdDRfZnJvbVJvdGF0aW9uVHJhbnNsYXRpb24ob3V0LCBxLCB2KSB7XG4gICAgLy8gUXVhdGVybmlvbiBtYXRoXG4gICAgdmFyIHggPSBxWzBdLCB5ID0gcVsxXSwgeiA9IHFbMl0sIHcgPSBxWzNdLFxuICAgICAgICB4MiA9IHggKyB4LFxuICAgICAgICB5MiA9IHkgKyB5LFxuICAgICAgICB6MiA9IHogKyB6LFxuXG4gICAgICAgIHh4ID0geCAqIHgyLFxuICAgICAgICB4eSA9IHggKiB5MixcbiAgICAgICAgeHogPSB4ICogejIsXG4gICAgICAgIHl5ID0geSAqIHkyLFxuICAgICAgICB5eiA9IHkgKiB6MixcbiAgICAgICAgenogPSB6ICogejIsXG4gICAgICAgIHd4ID0gdyAqIHgyLFxuICAgICAgICB3eSA9IHcgKiB5MixcbiAgICAgICAgd3ogPSB3ICogejI7XG5cbiAgICBvdXRbMF0gPSAxIC0gKHl5ICsgenopO1xuICAgIG91dFsxXSA9IHh5ICsgd3o7XG4gICAgb3V0WzJdID0geHogLSB3eTtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IHh5IC0gd3o7XG4gICAgb3V0WzVdID0gMSAtICh4eCArIHp6KTtcbiAgICBvdXRbNl0gPSB5eiArIHd4O1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0geHogKyB3eTtcbiAgICBvdXRbOV0gPSB5eiAtIHd4O1xuICAgIG91dFsxMF0gPSAxIC0gKHh4ICsgeXkpO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSB2WzBdO1xuICAgIG91dFsxM10gPSB2WzFdO1xuICAgIG91dFsxNF0gPSB2WzJdO1xuICAgIG91dFsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIG91dDtcbiAgfTtcblxuICBmdW5jdGlvbiBtYXQ0X3RyYW5zbGF0ZShvdXQsIGEsIHYpIHtcbiAgICB2YXIgeCA9IHZbMF0sIHkgPSB2WzFdLCB6ID0gdlsyXSxcbiAgICAgICAgYTAwLCBhMDEsIGEwMiwgYTAzLFxuICAgICAgICBhMTAsIGExMSwgYTEyLCBhMTMsXG4gICAgICAgIGEyMCwgYTIxLCBhMjIsIGEyMztcblxuICAgIGlmIChhID09PSBvdXQpIHtcbiAgICAgIG91dFsxMl0gPSBhWzBdICogeCArIGFbNF0gKiB5ICsgYVs4XSAqIHogKyBhWzEyXTtcbiAgICAgIG91dFsxM10gPSBhWzFdICogeCArIGFbNV0gKiB5ICsgYVs5XSAqIHogKyBhWzEzXTtcbiAgICAgIG91dFsxNF0gPSBhWzJdICogeCArIGFbNl0gKiB5ICsgYVsxMF0gKiB6ICsgYVsxNF07XG4gICAgICBvdXRbMTVdID0gYVszXSAqIHggKyBhWzddICogeSArIGFbMTFdICogeiArIGFbMTVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBhMDAgPSBhWzBdOyBhMDEgPSBhWzFdOyBhMDIgPSBhWzJdOyBhMDMgPSBhWzNdO1xuICAgICAgYTEwID0gYVs0XTsgYTExID0gYVs1XTsgYTEyID0gYVs2XTsgYTEzID0gYVs3XTtcbiAgICAgIGEyMCA9IGFbOF07IGEyMSA9IGFbOV07IGEyMiA9IGFbMTBdOyBhMjMgPSBhWzExXTtcblxuICAgICAgb3V0WzBdID0gYTAwOyBvdXRbMV0gPSBhMDE7IG91dFsyXSA9IGEwMjsgb3V0WzNdID0gYTAzO1xuICAgICAgb3V0WzRdID0gYTEwOyBvdXRbNV0gPSBhMTE7IG91dFs2XSA9IGExMjsgb3V0WzddID0gYTEzO1xuICAgICAgb3V0WzhdID0gYTIwOyBvdXRbOV0gPSBhMjE7IG91dFsxMF0gPSBhMjI7IG91dFsxMV0gPSBhMjM7XG5cbiAgICAgIG91dFsxMl0gPSBhMDAgKiB4ICsgYTEwICogeSArIGEyMCAqIHogKyBhWzEyXTtcbiAgICAgIG91dFsxM10gPSBhMDEgKiB4ICsgYTExICogeSArIGEyMSAqIHogKyBhWzEzXTtcbiAgICAgIG91dFsxNF0gPSBhMDIgKiB4ICsgYTEyICogeSArIGEyMiAqIHogKyBhWzE0XTtcbiAgICAgIG91dFsxNV0gPSBhMDMgKiB4ICsgYTEzICogeSArIGEyMyAqIHogKyBhWzE1XTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIGZ1bmN0aW9uIG1hdDRfaW52ZXJ0KG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdLFxuXG4gICAgICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICAgICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXG4gICAgICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICAgICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXG4gICAgICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICAgICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXG4gICAgICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICAgICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzIsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XG5cbiAgICBpZiAoIWRldCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGRldCA9IDEuMCAvIGRldDtcblxuICAgIG91dFswXSA9IChhMTEgKiBiMTEgLSBhMTIgKiBiMTAgKyBhMTMgKiBiMDkpICogZGV0O1xuICAgIG91dFsxXSA9IChhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDkpICogZGV0O1xuICAgIG91dFsyXSA9IChhMzEgKiBiMDUgLSBhMzIgKiBiMDQgKyBhMzMgKiBiMDMpICogZGV0O1xuICAgIG91dFszXSA9IChhMjIgKiBiMDQgLSBhMjEgKiBiMDUgLSBhMjMgKiBiMDMpICogZGV0O1xuICAgIG91dFs0XSA9IChhMTIgKiBiMDggLSBhMTAgKiBiMTEgLSBhMTMgKiBiMDcpICogZGV0O1xuICAgIG91dFs1XSA9IChhMDAgKiBiMTEgLSBhMDIgKiBiMDggKyBhMDMgKiBiMDcpICogZGV0O1xuICAgIG91dFs2XSA9IChhMzIgKiBiMDIgLSBhMzAgKiBiMDUgLSBhMzMgKiBiMDEpICogZGV0O1xuICAgIG91dFs3XSA9IChhMjAgKiBiMDUgLSBhMjIgKiBiMDIgKyBhMjMgKiBiMDEpICogZGV0O1xuICAgIG91dFs4XSA9IChhMTAgKiBiMTAgLSBhMTEgKiBiMDggKyBhMTMgKiBiMDYpICogZGV0O1xuICAgIG91dFs5XSA9IChhMDEgKiBiMDggLSBhMDAgKiBiMTAgLSBhMDMgKiBiMDYpICogZGV0O1xuICAgIG91dFsxMF0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldDtcbiAgICBvdXRbMTFdID0gKGEyMSAqIGIwMiAtIGEyMCAqIGIwNCAtIGEyMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzEyXSA9IChhMTEgKiBiMDcgLSBhMTAgKiBiMDkgLSBhMTIgKiBiMDYpICogZGV0O1xuICAgIG91dFsxM10gPSAoYTAwICogYjA5IC0gYTAxICogYjA3ICsgYTAyICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTRdID0gKGEzMSAqIGIwMSAtIGEzMCAqIGIwMyAtIGEzMiAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzE1XSA9IChhMjAgKiBiMDMgLSBhMjEgKiBiMDEgKyBhMjIgKiBiMDApICogZGV0O1xuXG4gICAgcmV0dXJuIG91dDtcbiAgfTtcblxuICB2YXIgZGVmYXVsdE9yaWVudGF0aW9uID0gbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pO1xuICB2YXIgZGVmYXVsdFBvc2l0aW9uID0gbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMF0pO1xuXG4gIGZ1bmN0aW9uIHVwZGF0ZUV5ZU1hdHJpY2VzKHByb2plY3Rpb24sIHZpZXcsIHBvc2UsIHBhcmFtZXRlcnMsIHZyRGlzcGxheSkge1xuICAgIG1hdDRfcGVyc3BlY3RpdmVGcm9tRmllbGRPZlZpZXcocHJvamVjdGlvbiwgcGFyYW1ldGVycyA/IHBhcmFtZXRlcnMuZmllbGRPZlZpZXcgOiBudWxsLCB2ckRpc3BsYXkuZGVwdGhOZWFyLCB2ckRpc3BsYXkuZGVwdGhGYXIpO1xuXG4gICAgdmFyIG9yaWVudGF0aW9uID0gcG9zZS5vcmllbnRhdGlvbiB8fCBkZWZhdWx0T3JpZW50YXRpb247XG4gICAgdmFyIHBvc2l0aW9uID0gcG9zZS5wb3NpdGlvbiB8fCBkZWZhdWx0UG9zaXRpb247XG5cbiAgICBtYXQ0X2Zyb21Sb3RhdGlvblRyYW5zbGF0aW9uKHZpZXcsIG9yaWVudGF0aW9uLCBwb3NpdGlvbik7XG4gICAgaWYgKHBhcmFtZXRlcnMpXG4gICAgICBtYXQ0X3RyYW5zbGF0ZSh2aWV3LCB2aWV3LCBwYXJhbWV0ZXJzLm9mZnNldCk7XG4gICAgbWF0NF9pbnZlcnQodmlldywgdmlldyk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24oZnJhbWVEYXRhLCBwb3NlLCB2ckRpc3BsYXkpIHtcbiAgICBpZiAoIWZyYW1lRGF0YSB8fCAhcG9zZSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGZyYW1lRGF0YS5wb3NlID0gcG9zZTtcbiAgICBmcmFtZURhdGEudGltZXN0YW1wID0gcG9zZS50aW1lc3RhbXA7XG5cbiAgICB1cGRhdGVFeWVNYXRyaWNlcyhcbiAgICAgICAgZnJhbWVEYXRhLmxlZnRQcm9qZWN0aW9uTWF0cml4LCBmcmFtZURhdGEubGVmdFZpZXdNYXRyaXgsXG4gICAgICAgIHBvc2UsIHZyRGlzcGxheS5nZXRFeWVQYXJhbWV0ZXJzKFwibGVmdFwiKSwgdnJEaXNwbGF5KTtcbiAgICB1cGRhdGVFeWVNYXRyaWNlcyhcbiAgICAgICAgZnJhbWVEYXRhLnJpZ2h0UHJvamVjdGlvbk1hdHJpeCwgZnJhbWVEYXRhLnJpZ2h0Vmlld01hdHJpeCxcbiAgICAgICAgcG9zZSwgdnJEaXNwbGF5LmdldEV5ZVBhcmFtZXRlcnMoXCJyaWdodFwiKSwgdnJEaXNwbGF5KTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xufSkoKTtcblxuVXRpbC5pc0luc2lkZUNyb3NzRG9tYWluSUZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpc0ZyYW1lZCA9ICh3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcCk7XG4gIHZhciByZWZEb21haW4gPSBVdGlsLmdldERvbWFpbkZyb21VcmwoZG9jdW1lbnQucmVmZXJyZXIpO1xuICB2YXIgdGhpc0RvbWFpbiA9IFV0aWwuZ2V0RG9tYWluRnJvbVVybCh3aW5kb3cubG9jYXRpb24uaHJlZik7XG5cbiAgcmV0dXJuIGlzRnJhbWVkICYmIChyZWZEb21haW4gIT09IHRoaXNEb21haW4pO1xufTtcblxuLy8gRnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMzk0NTAyNy5cblV0aWwuZ2V0RG9tYWluRnJvbVVybCA9IGZ1bmN0aW9uKHVybCkge1xuICB2YXIgZG9tYWluO1xuICAvLyBGaW5kICYgcmVtb3ZlIHByb3RvY29sIChodHRwLCBmdHAsIGV0Yy4pIGFuZCBnZXQgZG9tYWluLlxuICBpZiAodXJsLmluZGV4T2YoXCI6Ly9cIikgPiAtMSkge1xuICAgIGRvbWFpbiA9IHVybC5zcGxpdCgnLycpWzJdO1xuICB9XG4gIGVsc2Uge1xuICAgIGRvbWFpbiA9IHVybC5zcGxpdCgnLycpWzBdO1xuICB9XG5cbiAgLy9maW5kICYgcmVtb3ZlIHBvcnQgbnVtYmVyXG4gIGRvbWFpbiA9IGRvbWFpbi5zcGxpdCgnOicpWzBdO1xuXG4gIHJldHVybiBkb21haW47XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVXRpbDtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBEZXZpY2VJbmZvID0gcmVxdWlyZSgnLi9kZXZpY2UtaW5mby5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxudmFyIERFRkFVTFRfVklFV0VSID0gJ0NhcmRib2FyZFYxJztcbnZhciBWSUVXRVJfS0VZID0gJ1dFQlZSX0NBUkRCT0FSRF9WSUVXRVInO1xudmFyIENMQVNTX05BTUUgPSAnd2VidnItcG9seWZpbGwtdmlld2VyLXNlbGVjdG9yJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgdmlld2VyIHNlbGVjdG9yIHdpdGggdGhlIG9wdGlvbnMgc3BlY2lmaWVkLiBTdXBwb3J0cyBiZWluZyBzaG93blxuICogYW5kIGhpZGRlbi4gR2VuZXJhdGVzIGV2ZW50cyB3aGVuIHZpZXdlciBwYXJhbWV0ZXJzIGNoYW5nZS4gQWxzbyBzdXBwb3J0c1xuICogc2F2aW5nIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaW5kZXggaW4gbG9jYWxTdG9yYWdlLlxuICovXG5mdW5jdGlvbiBWaWV3ZXJTZWxlY3RvcigpIHtcbiAgLy8gVHJ5IHRvIGxvYWQgdGhlIHNlbGVjdGVkIGtleSBmcm9tIGxvY2FsIHN0b3JhZ2UuXG4gIHRyeSB7XG4gICAgdGhpcy5zZWxlY3RlZEtleSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFZJRVdFUl9LRVkpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIHZpZXdlciBwcm9maWxlOiAlcycsIGVycm9yKTtcbiAgfVxuXG4gIC8vSWYgbm9uZSBleGlzdHMsIG9yIGlmIGxvY2Fsc3RvcmFnZSBpcyB1bmF2YWlsYWJsZSwgdXNlIHRoZSBkZWZhdWx0IGtleS5cbiAgaWYgKCF0aGlzLnNlbGVjdGVkS2V5KSB7XG4gICAgdGhpcy5zZWxlY3RlZEtleSA9IERFRkFVTFRfVklFV0VSO1xuICB9XG5cbiAgdGhpcy5kaWFsb2cgPSB0aGlzLmNyZWF0ZURpYWxvZ18oRGV2aWNlSW5mby5WaWV3ZXJzKTtcbiAgdGhpcy5yb290ID0gbnVsbDtcbiAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrc18gPSBbXTtcbn1cblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbihyb290KSB7XG4gIHRoaXMucm9vdCA9IHJvb3Q7XG5cbiAgcm9vdC5hcHBlbmRDaGlsZCh0aGlzLmRpYWxvZyk7XG5cbiAgLy8gRW5zdXJlIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaXRlbSBpcyBjaGVja2VkLlxuICB2YXIgc2VsZWN0ZWQgPSB0aGlzLmRpYWxvZy5xdWVyeVNlbGVjdG9yKCcjJyArIHRoaXMuc2VsZWN0ZWRLZXkpO1xuICBzZWxlY3RlZC5jaGVja2VkID0gdHJ1ZTtcblxuICAvLyBTaG93IHRoZSBVSS5cbiAgdGhpcy5kaWFsb2cuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5yb290ICYmIHRoaXMucm9vdC5jb250YWlucyh0aGlzLmRpYWxvZykpIHtcbiAgICB0aGlzLnJvb3QucmVtb3ZlQ2hpbGQodGhpcy5kaWFsb2cpO1xuICB9XG4gIHRoaXMuZGlhbG9nLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuZ2V0Q3VycmVudFZpZXdlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gRGV2aWNlSW5mby5WaWV3ZXJzW3RoaXMuc2VsZWN0ZWRLZXldO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmdldFNlbGVjdGVkS2V5XyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaW5wdXQgPSB0aGlzLmRpYWxvZy5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPWZpZWxkXTpjaGVja2VkJyk7XG4gIGlmIChpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dC5pZDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5vbkNoYW5nZSA9IGZ1bmN0aW9uKGNiKSB7XG4gIHRoaXMub25DaGFuZ2VDYWxsYmFja3NfLnB1c2goY2IpO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmZpcmVPbkNoYW5nZV8gPSBmdW5jdGlvbih2aWV3ZXIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm9uQ2hhbmdlQ2FsbGJhY2tzXy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMub25DaGFuZ2VDYWxsYmFja3NfW2ldKHZpZXdlcik7XG4gIH1cbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5vblNhdmVfID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2VsZWN0ZWRLZXkgPSB0aGlzLmdldFNlbGVjdGVkS2V5XygpO1xuICBpZiAoIXRoaXMuc2VsZWN0ZWRLZXkgfHwgIURldmljZUluZm8uVmlld2Vyc1t0aGlzLnNlbGVjdGVkS2V5XSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1ZpZXdlclNlbGVjdG9yLm9uU2F2ZV86IHRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbiEnKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmZpcmVPbkNoYW5nZV8oRGV2aWNlSW5mby5WaWV3ZXJzW3RoaXMuc2VsZWN0ZWRLZXldKTtcblxuICAvLyBBdHRlbXB0IHRvIHNhdmUgdGhlIHZpZXdlciBwcm9maWxlLCBidXQgZmFpbHMgaW4gcHJpdmF0ZSBtb2RlLlxuICB0cnkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFZJRVdFUl9LRVksIHRoaXMuc2VsZWN0ZWRLZXkpO1xuICB9IGNhdGNoKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHNhdmUgdmlld2VyIHByb2ZpbGU6ICVzJywgZXJyb3IpO1xuICB9XG4gIHRoaXMuaGlkZSgpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBkaWFsb2cuXG4gKi9cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5jcmVhdGVEaWFsb2dfID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKENMQVNTX05BTUUpO1xuICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgLy8gQ3JlYXRlIGFuIG92ZXJsYXkgdGhhdCBkaW1zIHRoZSBiYWNrZ3JvdW5kLCBhbmQgd2hpY2ggZ29lcyBhd2F5IHdoZW4geW91XG4gIC8vIHRhcCBpdC5cbiAgdmFyIG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHMgPSBvdmVybGF5LnN0eWxlO1xuICBzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgcy5sZWZ0ID0gMDtcbiAgcy50b3AgPSAwO1xuICBzLndpZHRoID0gJzEwMCUnO1xuICBzLmhlaWdodCA9ICcxMDAlJztcbiAgcy5iYWNrZ3JvdW5kID0gJ3JnYmEoMCwgMCwgMCwgMC4zKSc7XG4gIG92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhpZGUuYmluZCh0aGlzKSk7XG5cbiAgdmFyIHdpZHRoID0gMjgwO1xuICB2YXIgZGlhbG9nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gZGlhbG9nLnN0eWxlO1xuICBzLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMudG9wID0gJzI0cHgnO1xuICBzLmxlZnQgPSAnNTAlJztcbiAgcy5tYXJnaW5MZWZ0ID0gKC13aWR0aC8yKSArICdweCc7XG4gIHMud2lkdGggPSB3aWR0aCArICdweCc7XG4gIHMucGFkZGluZyA9ICcyNHB4JztcbiAgcy5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICBzLmJhY2tncm91bmQgPSAnI2ZhZmFmYSc7XG4gIHMuZm9udEZhbWlseSA9IFwiJ1JvYm90bycsIHNhbnMtc2VyaWZcIjtcbiAgcy5ib3hTaGFkb3cgPSAnMHB4IDVweCAyMHB4ICM2NjYnO1xuXG4gIGRpYWxvZy5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUgxXygnU2VsZWN0IHlvdXIgdmlld2VyJykpO1xuICBmb3IgKHZhciBpZCBpbiBvcHRpb25zKSB7XG4gICAgZGlhbG9nLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlQ2hvaWNlXyhpZCwgb3B0aW9uc1tpZF0ubGFiZWwpKTtcbiAgfVxuICBkaWFsb2cuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVCdXR0b25fKCdTYXZlJywgdGhpcy5vblNhdmVfLmJpbmQodGhpcykpKTtcblxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQob3ZlcmxheSk7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChkaWFsb2cpO1xuXG4gIHJldHVybiBjb250YWluZXI7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuY3JlYXRlSDFfID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgaDEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMScpO1xuICB2YXIgcyA9IGgxLnN0eWxlO1xuICBzLmNvbG9yID0gJ2JsYWNrJztcbiAgcy5mb250U2l6ZSA9ICcyMHB4JztcbiAgcy5mb250V2VpZ2h0ID0gJ2JvbGQnO1xuICBzLm1hcmdpblRvcCA9IDA7XG4gIHMubWFyZ2luQm90dG9tID0gJzI0cHgnO1xuICBoMS5pbm5lckhUTUwgPSBuYW1lO1xuICByZXR1cm4gaDE7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuY3JlYXRlQ2hvaWNlXyA9IGZ1bmN0aW9uKGlkLCBuYW1lKSB7XG4gIC8qXG4gIDxkaXYgY2xhc3M9XCJjaG9pY2VcIj5cbiAgPGlucHV0IGlkPVwidjFcIiB0eXBlPVwicmFkaW9cIiBuYW1lPVwiZmllbGRcIiB2YWx1ZT1cInYxXCI+XG4gIDxsYWJlbCBmb3I9XCJ2MVwiPkNhcmRib2FyZCBWMTwvbGFiZWw+XG4gIDwvZGl2PlxuICAqL1xuICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRpdi5zdHlsZS5tYXJnaW5Ub3AgPSAnOHB4JztcbiAgZGl2LnN0eWxlLmNvbG9yID0gJ2JsYWNrJztcblxuICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICBpbnB1dC5zdHlsZS5mb250U2l6ZSA9ICczMHB4JztcbiAgaW5wdXQuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhZGlvJyk7XG4gIGlucHV0LnNldEF0dHJpYnV0ZSgndmFsdWUnLCBpZCk7XG4gIGlucHV0LnNldEF0dHJpYnV0ZSgnbmFtZScsICdmaWVsZCcpO1xuXG4gIHZhciBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gIGxhYmVsLnN0eWxlLm1hcmdpbkxlZnQgPSAnNHB4JztcbiAgbGFiZWwuc2V0QXR0cmlidXRlKCdmb3InLCBpZCk7XG4gIGxhYmVsLmlubmVySFRNTCA9IG5hbWU7XG5cbiAgZGl2LmFwcGVuZENoaWxkKGlucHV0KTtcbiAgZGl2LmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICByZXR1cm4gZGl2O1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmNyZWF0ZUJ1dHRvbl8gPSBmdW5jdGlvbihsYWJlbCwgb25jbGljaykge1xuICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gIGJ1dHRvbi5pbm5lckhUTUwgPSBsYWJlbDtcbiAgdmFyIHMgPSBidXR0b24uc3R5bGU7XG4gIHMuZmxvYXQgPSAncmlnaHQnO1xuICBzLnRleHRUcmFuc2Zvcm0gPSAndXBwZXJjYXNlJztcbiAgcy5jb2xvciA9ICcjMTA5NGY3JztcbiAgcy5mb250U2l6ZSA9ICcxNHB4JztcbiAgcy5sZXR0ZXJTcGFjaW5nID0gMDtcbiAgcy5ib3JkZXIgPSAwO1xuICBzLmJhY2tncm91bmQgPSAnbm9uZSc7XG4gIHMubWFyZ2luVG9wID0gJzE2cHgnO1xuXG4gIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9uY2xpY2spO1xuXG4gIHJldHVybiBidXR0b247XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdlclNlbGVjdG9yO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuLyoqXG4gKiBBbmRyb2lkIGFuZCBpT1MgY29tcGF0aWJsZSB3YWtlbG9jayBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBSZWZhY3RvcmVkIHRoYW5rcyB0byBka292YWxldkAuXG4gKi9cbmZ1bmN0aW9uIEFuZHJvaWRXYWtlTG9jaygpIHtcbiAgdmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcbiAgdmlkZW8uc2V0QXR0cmlidXRlKCdsb29wJywgJycpO1xuXG4gIGZ1bmN0aW9uIGFkZFNvdXJjZVRvVmlkZW8oZWxlbWVudCwgdHlwZSwgZGF0YVVSSSkge1xuICAgIHZhciBzb3VyY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcbiAgICBzb3VyY2Uuc3JjID0gZGF0YVVSSTtcbiAgICBzb3VyY2UudHlwZSA9ICd2aWRlby8nICsgdHlwZTtcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKHNvdXJjZSk7XG4gIH1cblxuICBhZGRTb3VyY2VUb1ZpZGVvKHZpZGVvLCd3ZWJtJywgVXRpbC5iYXNlNjQoJ3ZpZGVvL3dlYm0nLCAnR2tYZm8wQWdRb2FCQVVMM2dRRkM4b0VFUXZPQkNFS0NRQVIzWldKdFFvZUJBa0tGZ1FJWVU0Qm5RSTBWU2FsbVFDZ3ExN0ZBQXc5Q1FFMkFRQVozYUdGdGJYbFhRVUFHZDJoaGJXMTVSSWxBQ0VDUFFBQUFBQUFBRmxTdWEwQXhya0F1MTRFQlk4V0JBWnlCQUNLMW5FQURkVzVraGtBRlZsOVdVRGdsaG9oQUExWlFPSU9CQWVCQUJyQ0JDTHFCQ0I5RHRuVkFJdWVCQUtOQUhJRUFBSUF3QVFDZEFTb0lBQWdBQVVBbUphUUFBM0FBL3Z6MEFBQT0nKSk7XG4gIGFkZFNvdXJjZVRvVmlkZW8odmlkZW8sICdtcDQnLCBVdGlsLmJhc2U2NCgndmlkZW8vbXA0JywgJ0FBQUFIR1owZVhCcGMyOXRBQUFDQUdsemIyMXBjMjh5YlhBME1RQUFBQWhtY21WbEFBQUFHMjFrWVhRQUFBR3pBQkFIQUFBQnRoQURBb3dkYmI5L0FBQUM2VzF2YjNZQUFBQnNiWFpvWkFBQUFBQjhKYkNBZkNXd2dBQUFBK2dBQUFBQUFBRUFBQUVBQUFBQUFBQUFBQUFBQUFBQkFBQUFBQUFBQUFBQUFBQUFBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFJQUFBSVZkSEpoYXdBQUFGeDBhMmhrQUFBQUQzd2xzSUI4SmJDQUFBQUFBUUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUJBQUFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBUUFBQUFBQUlBQUFBQ0FBQUFBQUJzVzFrYVdFQUFBQWdiV1JvWkFBQUFBQjhKYkNBZkNXd2dBQUFBK2dBQUFBQVZjUUFBQUFBQUMxb1pHeHlBQUFBQUFBQUFBQjJhV1JsQUFBQUFBQUFBQUFBQUFBQVZtbGtaVzlJWVc1a2JHVnlBQUFBQVZ4dGFXNW1BQUFBRkhadGFHUUFBQUFCQUFBQUFBQUFBQUFBQUFBa1pHbHVaZ0FBQUJ4a2NtVm1BQUFBQUFBQUFBRUFBQUFNZFhKc0lBQUFBQUVBQUFFY2MzUmliQUFBQUxoemRITmtBQUFBQUFBQUFBRUFBQUNvYlhBMGRnQUFBQUFBQUFBQkFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBSUFBZ0FTQUFBQUVnQUFBQUFBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQmovL3dBQUFGSmxjMlJ6QUFBQUFBTkVBQUVBQkR3Z0VRQUFBQUFERFVBQUFBQUFCUzBBQUFHd0FRQUFBYldKRXdBQUFRQUFBQUVnQU1TTmlCOUZBRVFCRkdNQUFBR3lUR0YyWXpVeUxqZzNMalFHQVFJQUFBQVljM1IwY3dBQUFBQUFBQUFCQUFBQUFRQUFBQUFBQUFBY2MzUnpZd0FBQUFBQUFBQUJBQUFBQVFBQUFBRUFBQUFCQUFBQUZITjBjM29BQUFBQUFBQUFFd0FBQUFFQUFBQVVjM1JqYndBQUFBQUFBQUFCQUFBQUxBQUFBR0IxWkhSaEFBQUFXRzFsZEdFQUFBQUFBQUFBSVdoa2JISUFBQUFBQUFBQUFHMWthWEpoY0hCc0FBQUFBQUFBQUFBQUFBQUFLMmxzYzNRQUFBQWpxWFJ2YndBQUFCdGtZWFJoQUFBQUFRQUFBQUJNWVhabU5USXVOemd1TXc9PScpKTtcblxuICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodmlkZW8ucGF1c2VkKSB7XG4gICAgICB2aWRlby5wbGF5KCk7XG4gICAgfVxuICB9O1xuXG4gIHRoaXMucmVsZWFzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZpZGVvLnBhdXNlKCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGlPU1dha2VMb2NrKCkge1xuICB2YXIgdGltZXIgPSBudWxsO1xuXG4gIHRoaXMucmVxdWVzdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGltZXIpIHtcbiAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgICAgICAgc2V0VGltZW91dCh3aW5kb3cuc3RvcCwgMCk7XG4gICAgICB9LCAzMDAwMCk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5yZWxlYXNlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRpbWVyKSB7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgIHRpbWVyID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBnZXRXYWtlTG9jaygpIHtcbiAgdmFyIHVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQgfHwgbmF2aWdhdG9yLnZlbmRvciB8fCB3aW5kb3cub3BlcmE7XG4gIGlmICh1c2VyQWdlbnQubWF0Y2goL2lQaG9uZS9pKSB8fCB1c2VyQWdlbnQubWF0Y2goL2lQb2QvaSkpIHtcbiAgICByZXR1cm4gaU9TV2FrZUxvY2s7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIEFuZHJvaWRXYWtlTG9jaztcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFdha2VMb2NrKCk7IiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBDYXJkYm9hcmRWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2NhcmRib2FyZC12ci1kaXNwbGF5LmpzJyk7XG52YXIgTW91c2VLZXlib2FyZFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vbW91c2Uta2V5Ym9hcmQtdnItZGlzcGxheS5qcycpO1xuLy8gVW5jb21tZW50IHRvIGFkZCBwb3NpdGlvbmFsIHRyYWNraW5nIHZpYSB3ZWJjYW0uXG4vL3ZhciBXZWJjYW1Qb3NpdGlvblNlbnNvclZSRGV2aWNlID0gcmVxdWlyZSgnLi93ZWJjYW0tcG9zaXRpb24tc2Vuc29yLXZyLWRldmljZS5qcycpO1xudmFyIFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRGlzcGxheTtcbnZhciBWUkZyYW1lRGF0YSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRnJhbWVEYXRhO1xudmFyIEhNRFZSRGV2aWNlID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuSE1EVlJEZXZpY2U7XG52YXIgUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlBvc2l0aW9uU2Vuc29yVlJEZXZpY2U7XG52YXIgVlJEaXNwbGF5SE1ERGV2aWNlID0gcmVxdWlyZSgnLi9kaXNwbGF5LXdyYXBwZXJzLmpzJykuVlJEaXNwbGF5SE1ERGV2aWNlO1xudmFyIFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlID0gcmVxdWlyZSgnLi9kaXNwbGF5LXdyYXBwZXJzLmpzJykuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2U7XG52YXIgdmVyc2lvbiA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpLnZlcnNpb247XG5cbmZ1bmN0aW9uIFdlYlZSUG9seWZpbGwoKSB7XG4gIHRoaXMuZGlzcGxheXMgPSBbXTtcbiAgdGhpcy5kZXZpY2VzID0gW107IC8vIEZvciBkZXByZWNhdGVkIG9iamVjdHNcbiAgdGhpcy5kZXZpY2VzUG9wdWxhdGVkID0gZmFsc2U7XG4gIHRoaXMubmF0aXZlV2ViVlJBdmFpbGFibGUgPSB0aGlzLmlzV2ViVlJBdmFpbGFibGUoKTtcbiAgdGhpcy5uYXRpdmVMZWdhY3lXZWJWUkF2YWlsYWJsZSA9IHRoaXMuaXNEZXByZWNhdGVkV2ViVlJBdmFpbGFibGUoKTtcbiAgdGhpcy5uYXRpdmVHZXRWUkRpc3BsYXlzRnVuYyA9IHRoaXMubmF0aXZlV2ViVlJBdmFpbGFibGUgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbDtcblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ2thdHNldi93ZWJ2ci1wb2x5ZmlsbC9jb21taXQvOGY4ZjA3MWJkMjY1N2EyNGNjYmQ4YzYzYWIzNDU2NGRkMDI0ZWEwOVxuICBpZiAoIXRoaXMubmF0aXZlTGVnYWN5V2ViVlJBdmFpbGFibGUgJiYgIXRoaXMubmF0aXZlV2ViVlJBdmFpbGFibGUpIHtcbiAgICB0aGlzLmVuYWJsZVBvbHlmaWxsKCk7XG4gICAgaWYgKHdpbmRvdy5XZWJWUkNvbmZpZy5FTkFCTEVfREVQUkVDQVRFRF9BUEkpIHtcbiAgICAgIHRoaXMuZW5hYmxlRGVwcmVjYXRlZFBvbHlmaWxsKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUHV0IGEgc2hpbSBpbiBwbGFjZSB0byB1cGRhdGUgdGhlIEFQSSB0byAxLjEgaWYgbmVlZGVkLlxuICBJbnN0YWxsV2ViVlJTcGVjU2hpbSgpO1xufVxuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5pc1dlYlZSQXZhaWxhYmxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAoJ2dldFZSRGlzcGxheXMnIGluIG5hdmlnYXRvcik7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5pc0RlcHJlY2F0ZWRXZWJWUkF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKCdnZXRWUkRldmljZXMnIGluIG5hdmlnYXRvcikgfHwgKCdtb3pHZXRWUkRldmljZXMnIGluIG5hdmlnYXRvcik7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5jb25uZWN0RGlzcGxheSA9IGZ1bmN0aW9uKHZyRGlzcGxheSkge1xuICB2ckRpc3BsYXkuZmlyZVZSRGlzcGxheUNvbm5lY3RfKCk7XG4gIHRoaXMuZGlzcGxheXMucHVzaCh2ckRpc3BsYXkpO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUucG9wdWxhdGVEZXZpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRldmljZXNQb3B1bGF0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJbml0aWFsaXplIG91ciB2aXJ0dWFsIFZSIGRldmljZXMuXG4gIHZhciB2ckRpc3BsYXkgPSBudWxsO1xuXG4gIC8vIEFkZCBhIENhcmRib2FyZCBWUkRpc3BsYXkgb24gY29tcGF0aWJsZSBtb2JpbGUgZGV2aWNlc1xuICBpZiAodGhpcy5pc0NhcmRib2FyZENvbXBhdGlibGUoKSkge1xuICAgIHZyRGlzcGxheSA9IG5ldyBDYXJkYm9hcmRWUkRpc3BsYXkoKTtcblxuICAgIHRoaXMuY29ubmVjdERpc3BsYXkodnJEaXNwbGF5KTtcblxuICAgIC8vIEZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgIGlmICh3aW5kb3cuV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gICAgICB0aGlzLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5SE1ERGV2aWNlKHZyRGlzcGxheSkpO1xuICAgICAgdGhpcy5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKHZyRGlzcGxheSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBhIE1vdXNlIGFuZCBLZXlib2FyZCBkcml2ZW4gVlJEaXNwbGF5IGZvciBkZXNrdG9wcy9sYXB0b3BzXG4gIGlmICghdGhpcy5pc01vYmlsZSgpICYmICF3aW5kb3cuV2ViVlJDb25maWcuTU9VU0VfS0VZQk9BUkRfQ09OVFJPTFNfRElTQUJMRUQpIHtcbiAgICB2ckRpc3BsYXkgPSBuZXcgTW91c2VLZXlib2FyZFZSRGlzcGxheSgpO1xuICAgIHRoaXMuY29ubmVjdERpc3BsYXkodnJEaXNwbGF5KTtcblxuICAgIC8vIEZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgIGlmICh3aW5kb3cuV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gICAgICB0aGlzLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5SE1ERGV2aWNlKHZyRGlzcGxheSkpO1xuICAgICAgdGhpcy5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKHZyRGlzcGxheSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFVuY29tbWVudCB0byBhZGQgcG9zaXRpb25hbCB0cmFja2luZyB2aWEgd2ViY2FtLlxuICAvL2lmICghdGhpcy5pc01vYmlsZSgpICYmIHdpbmRvdy5XZWJWUkNvbmZpZy5FTkFCTEVfREVQUkVDQVRFRF9BUEkpIHtcbiAgLy8gIHBvc2l0aW9uRGV2aWNlID0gbmV3IFdlYmNhbVBvc2l0aW9uU2Vuc29yVlJEZXZpY2UoKTtcbiAgLy8gIHRoaXMuZGV2aWNlcy5wdXNoKHBvc2l0aW9uRGV2aWNlKTtcbiAgLy99XG5cbiAgdGhpcy5kZXZpY2VzUG9wdWxhdGVkID0gdHJ1ZTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmVuYWJsZVBvbHlmaWxsID0gZnVuY3Rpb24oKSB7XG4gIC8vIFByb3ZpZGUgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMuXG4gIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzID0gdGhpcy5nZXRWUkRpc3BsYXlzLmJpbmQodGhpcyk7XG5cbiAgLy8gUG9seWZpbGwgbmF0aXZlIFZSRGlzcGxheS5nZXRGcmFtZURhdGFcbiAgaWYgKHRoaXMubmF0aXZlV2ViVlJBdmFpbGFibGUgJiYgd2luZG93LlZSRnJhbWVEYXRhKSB7XG4gICAgdmFyIE5hdGl2ZVZSRnJhbWVEYXRhID0gd2luZG93LlZSRnJhbWVEYXRhO1xuICAgIHZhciBuYXRpdmVGcmFtZURhdGEgPSBuZXcgd2luZG93LlZSRnJhbWVEYXRhKCk7XG4gICAgdmFyIG5hdGl2ZUdldEZyYW1lRGF0YSA9IHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlLmdldEZyYW1lRGF0YTtcbiAgICB3aW5kb3cuVlJGcmFtZURhdGEgPSBWUkZyYW1lRGF0YTtcblxuICAgIHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlLmdldEZyYW1lRGF0YSA9IGZ1bmN0aW9uKGZyYW1lRGF0YSkge1xuICAgICAgaWYgKGZyYW1lRGF0YSBpbnN0YW5jZW9mIE5hdGl2ZVZSRnJhbWVEYXRhKSB7XG4gICAgICAgIG5hdGl2ZUdldEZyYW1lRGF0YS5jYWxsKHRoaXMsIGZyYW1lRGF0YSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLypcbiAgICAgIENvcHkgZnJhbWUgZGF0YSBmcm9tIHRoZSBuYXRpdmUgb2JqZWN0IGludG8gdGhlIHBvbHlmaWxsZWQgb2JqZWN0LlxuICAgICAgKi9cblxuICAgICAgbmF0aXZlR2V0RnJhbWVEYXRhLmNhbGwodGhpcywgbmF0aXZlRnJhbWVEYXRhKTtcbiAgICAgIGZyYW1lRGF0YS5wb3NlID0gbmF0aXZlRnJhbWVEYXRhLnBvc2U7XG4gICAgICBVdGlsLmNvcHlBcnJheShuYXRpdmVGcmFtZURhdGEubGVmdFByb2plY3Rpb25NYXRyaXgsIGZyYW1lRGF0YS5sZWZ0UHJvamVjdGlvbk1hdHJpeCk7XG4gICAgICBVdGlsLmNvcHlBcnJheShuYXRpdmVGcmFtZURhdGEucmlnaHRQcm9qZWN0aW9uTWF0cml4LCBmcmFtZURhdGEucmlnaHRQcm9qZWN0aW9uTWF0cml4KTtcbiAgICAgIFV0aWwuY29weUFycmF5KG5hdGl2ZUZyYW1lRGF0YS5sZWZ0Vmlld01hdHJpeCwgZnJhbWVEYXRhLmxlZnRWaWV3TWF0cml4KTtcbiAgICAgIFV0aWwuY29weUFycmF5KG5hdGl2ZUZyYW1lRGF0YS5yaWdodFZpZXdNYXRyaXgsIGZyYW1lRGF0YS5yaWdodFZpZXdNYXRyaXgpO1xuICAgICAgLy90b2RvOiBjb3B5XG4gICAgfTtcbiAgfVxuXG4gIC8vIFByb3ZpZGUgdGhlIGBWUkRpc3BsYXlgIG9iamVjdC5cbiAgd2luZG93LlZSRGlzcGxheSA9IFZSRGlzcGxheTtcblxuICAvLyBQcm92aWRlIHRoZSBgbmF2aWdhdG9yLnZyRW5hYmxlZGAgcHJvcGVydHkuXG4gIGlmIChuYXZpZ2F0b3IgJiYgIW5hdmlnYXRvci52ckVuYWJsZWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG5hdmlnYXRvciwgJ3ZyRW5hYmxlZCcsIHtcbiAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc2VsZi5pc0NhcmRib2FyZENvbXBhdGlibGUoKSAmJlxuICAgICAgICAgICAgKHNlbGYuaXNGdWxsU2NyZWVuQXZhaWxhYmxlKCkgfHwgVXRpbC5pc0lPUygpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGlmICghKCdWUkZyYW1lRGF0YScgaW4gd2luZG93KSkge1xuICAgIC8vIFByb3ZpZGUgdGhlIFZSRnJhbWVEYXRhIG9iamVjdC5cbiAgICB3aW5kb3cuVlJGcmFtZURhdGEgPSBWUkZyYW1lRGF0YTtcbiAgfVxufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuZW5hYmxlRGVwcmVjYXRlZFBvbHlmaWxsID0gZnVuY3Rpb24oKSB7XG4gIC8vIFByb3ZpZGUgbmF2aWdhdG9yLmdldFZSRGV2aWNlcy5cbiAgbmF2aWdhdG9yLmdldFZSRGV2aWNlcyA9IHRoaXMuZ2V0VlJEZXZpY2VzLmJpbmQodGhpcyk7XG5cbiAgLy8gUHJvdmlkZSB0aGUgQ2FyZGJvYXJkSE1EVlJEZXZpY2UgYW5kIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2Ugb2JqZWN0cy5cbiAgd2luZG93LkhNRFZSRGV2aWNlID0gSE1EVlJEZXZpY2U7XG4gIHdpbmRvdy5Qb3NpdGlvblNlbnNvclZSRGV2aWNlID0gUG9zaXRpb25TZW5zb3JWUkRldmljZTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmdldFZSRGlzcGxheXMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wb3B1bGF0ZURldmljZXMoKTtcbiAgdmFyIHBvbHlmaWxsRGlzcGxheXMgPSB0aGlzLmRpc3BsYXlzO1xuXG4gIGlmICghdGhpcy5uYXRpdmVXZWJWUkF2YWlsYWJsZSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocG9seWZpbGxEaXNwbGF5cyk7XG4gIH1cblxuICAvLyBTZXQgdXAgYSByYWNlIGNvbmRpdGlvbiBpZiB0aGlzIGJyb3dzZXIgaGFzIGEgYnVnIHdoZXJlXG4gIC8vIGBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cygpYCBuZXZlciByZXNvbHZlcy5cbiAgdmFyIHRpbWVvdXRJZDtcbiAgdmFyIHZyRGlzcGxheXNOYXRpdmUgPSB0aGlzLm5hdGl2ZUdldFZSRGlzcGxheXNGdW5jLmNhbGwobmF2aWdhdG9yKTtcbiAgdmFyIHRpbWVvdXRQcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ05hdGl2ZSBXZWJWUiBpbXBsZW1lbnRhdGlvbiBkZXRlY3RlZCwgYnV0IGBnZXRWUkRpc3BsYXlzKClgIGZhaWxlZCB0byByZXNvbHZlLiBGYWxsaW5nIGJhY2sgdG8gcG9seWZpbGwuJyk7XG4gICAgICByZXNvbHZlKFtdKTtcbiAgICB9LCB3aW5kb3cuV2ViVlJDb25maWcuR0VUX1ZSX0RJU1BMQVlTX1RJTUVPVVQpO1xuICB9KTtcblxuICByZXR1cm4gVXRpbC5yYWNlKFtcbiAgICB2ckRpc3BsYXlzTmF0aXZlLFxuICAgIHRpbWVvdXRQcm9taXNlXG4gIF0pLnRoZW4oZnVuY3Rpb24obmF0aXZlRGlzcGxheXMpIHtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICBpZiAod2luZG93LldlYlZSQ29uZmlnLkFMV0FZU19BUFBFTkRfUE9MWUZJTExfRElTUExBWSkge1xuICAgICAgcmV0dXJuIG5hdGl2ZURpc3BsYXlzLmNvbmNhdChwb2x5ZmlsbERpc3BsYXlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5hdGl2ZURpc3BsYXlzLmxlbmd0aCA+IDAgPyBuYXRpdmVEaXNwbGF5cyA6IHBvbHlmaWxsRGlzcGxheXM7XG4gICAgfVxuICB9KTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmdldFZSRGV2aWNlcyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLndhcm4oJ2dldFZSRGV2aWNlcyBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXBkYXRlIHlvdXIgY29kZSB0byB1c2UgZ2V0VlJEaXNwbGF5cyBpbnN0ZWFkLicpO1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFzZWxmLmRldmljZXNQb3B1bGF0ZWQpIHtcbiAgICAgICAgaWYgKHNlbGYubmF0aXZlV2ViVlJBdmFpbGFibGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoZnVuY3Rpb24oZGlzcGxheXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlzcGxheXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgc2VsZi5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheUhNRERldmljZShkaXNwbGF5c1tpXSkpO1xuICAgICAgICAgICAgICBzZWxmLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UoZGlzcGxheXNbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuZGV2aWNlc1BvcHVsYXRlZCA9IHRydWU7XG4gICAgICAgICAgICByZXNvbHZlKHNlbGYuZGV2aWNlcyk7XG4gICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWxmLm5hdGl2ZUxlZ2FjeVdlYlZSQXZhaWxhYmxlKSB7XG4gICAgICAgICAgcmV0dXJuIChuYXZpZ2F0b3IuZ2V0VlJERGV2aWNlcyB8fCBuYXZpZ2F0b3IubW96R2V0VlJEZXZpY2VzKShmdW5jdGlvbihkZXZpY2VzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRldmljZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgaWYgKGRldmljZXNbaV0gaW5zdGFuY2VvZiBITURWUkRldmljZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuZGV2aWNlcy5wdXNoKGRldmljZXNbaV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChkZXZpY2VzW2ldIGluc3RhbmNlb2YgUG9zaXRpb25TZW5zb3JWUkRldmljZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuZGV2aWNlcy5wdXNoKGRldmljZXNbaV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLmRldmljZXNQb3B1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZShzZWxmLmRldmljZXMpO1xuICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5wb3B1bGF0ZURldmljZXMoKTtcbiAgICAgIHJlc29sdmUoc2VsZi5kZXZpY2VzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZWplY3QoZSk7XG4gICAgfVxuICB9KTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLk5hdGl2ZVZSRnJhbWVEYXRhID0gd2luZG93LlZSRnJhbWVEYXRhO1xuXG4vKipcbiAqIERldGVybWluZSBpZiBhIGRldmljZSBpcyBtb2JpbGUuXG4gKi9cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzTW9iaWxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAvQW5kcm9pZC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHxcbiAgICAgIC9pUGhvbmV8aVBhZHxpUG9kL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzQ2FyZGJvYXJkQ29tcGF0aWJsZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBGb3Igbm93LCBzdXBwb3J0IGFsbCBpT1MgYW5kIEFuZHJvaWQgZGV2aWNlcy5cbiAgLy8gQWxzbyBlbmFibGUgdGhlIFdlYlZSQ29uZmlnLkZPUkNFX1ZSIGZsYWcgZm9yIGRlYnVnZ2luZy5cbiAgcmV0dXJuIHRoaXMuaXNNb2JpbGUoKSB8fCB3aW5kb3cuV2ViVlJDb25maWcuRk9SQ0VfRU5BQkxFX1ZSO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNGdWxsU2NyZWVuQXZhaWxhYmxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVuYWJsZWQgfHxcbiAgICAgICAgICBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRW5hYmxlZCB8fFxuICAgICAgICAgIGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbmFibGVkIHx8XG4gICAgICAgICAgZmFsc2UpO1xufTtcblxuLy8gSW5zdGFsbHMgYSBzaGltIHRoYXQgdXBkYXRlcyBhIFdlYlZSIDEuMCBzcGVjIGltcGxlbWVudGF0aW9uIHRvIFdlYlZSIDEuMVxuZnVuY3Rpb24gSW5zdGFsbFdlYlZSU3BlY1NoaW0oKSB7XG4gIGlmICgnVlJEaXNwbGF5JyBpbiB3aW5kb3cgJiYgISgnVlJGcmFtZURhdGEnIGluIHdpbmRvdykpIHtcbiAgICAvLyBQcm92aWRlIHRoZSBWUkZyYW1lRGF0YSBvYmplY3QuXG4gICAgd2luZG93LlZSRnJhbWVEYXRhID0gVlJGcmFtZURhdGE7XG5cbiAgICAvLyBBIGxvdCBvZiBDaHJvbWUgYnVpbGRzIGRvbid0IGhhdmUgZGVwdGhOZWFyIGFuZCBkZXB0aEZhciwgZXZlblxuICAgIC8vIHRob3VnaCB0aGV5J3JlIGluIHRoZSBXZWJWUiAxLjAgc3BlYy4gUGF0Y2ggdGhlbSBpbiBpZiB0aGV5J3JlIG5vdCBwcmVzZW50LlxuICAgIGlmKCEoJ2RlcHRoTmVhcicgaW4gd2luZG93LlZSRGlzcGxheS5wcm90b3R5cGUpKSB7XG4gICAgICB3aW5kb3cuVlJEaXNwbGF5LnByb3RvdHlwZS5kZXB0aE5lYXIgPSAwLjAxO1xuICAgIH1cblxuICAgIGlmKCEoJ2RlcHRoRmFyJyBpbiB3aW5kb3cuVlJEaXNwbGF5LnByb3RvdHlwZSkpIHtcbiAgICAgIHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlLmRlcHRoRmFyID0gMTAwMDAuMDtcbiAgICB9XG5cbiAgICB3aW5kb3cuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRGcmFtZURhdGEgPSBmdW5jdGlvbihmcmFtZURhdGEpIHtcbiAgICAgIHJldHVybiBVdGlsLmZyYW1lRGF0YUZyb21Qb3NlKGZyYW1lRGF0YSwgdGhpcy5nZXRQb3NlKCksIHRoaXMpO1xuICAgIH1cbiAgfVxufTtcblxuV2ViVlJQb2x5ZmlsbC5JbnN0YWxsV2ViVlJTcGVjU2hpbSA9IEluc3RhbGxXZWJWUlNwZWNTaGltO1xuV2ViVlJQb2x5ZmlsbC52ZXJzaW9uID0gdmVyc2lvbjtcblxubW9kdWxlLmV4cG9ydHMuV2ViVlJQb2x5ZmlsbCA9IFdlYlZSUG9seWZpbGw7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgTWVudVJlbmRlcmVyIGZyb20gJy4vcmVuZGVyZXIuanMnO1xuXG5sZXQgcmVuZGVyZXI7XG5sZXQgdnJEaXNwbGF5O1xuXG5mdW5jdGlvbiBvbkxvYWQoKSB7XG4gIHJlbmRlcmVyID0gbmV3IE1lbnVSZW5kZXJlcigpO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7IHJlbmRlcmVyLnJlc2l6ZSgpIH0pO1xuXG4gIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKCkudGhlbihmdW5jdGlvbihkaXNwbGF5cykge1xuICAgIGlmIChkaXNwbGF5cy5sZW5ndGggPiAwKSB7XG4gICAgICB2ckRpc3BsYXkgPSBkaXNwbGF5c1swXTtcbiAgICAgIHZyRGlzcGxheS5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiByZW5kZXIoKSB7XG4gIHJlbmRlcmVyLnJlbmRlcigpO1xuXG4gIHZyRGlzcGxheS5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBvbkxvYWQpO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IFdlYlZSTWFuYWdlciBmcm9tICd3ZWJ2ci1ib2lsZXJwbGF0ZSdcbmltcG9ydCBXZWJWUlBvbHlmaWxsIGZyb20gJ3dlYnZyLXBvbHlmaWxsJ1xuaW1wb3J0IFJheUlucHV0IGZyb20gJy4uL3JheS1pbnB1dCdcblxuY29uc3QgV0lEVEggPSAxO1xuY29uc3QgSEVJR0hUID0gMTtcbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBuZXcgVEhSRUUuQ29sb3IoMHgwMEZGMDApO1xuY29uc3QgSElHSExJR0hUX0NPTE9SID0gbmV3IFRIUkVFLkNvbG9yKDB4MUU5MEZGKTtcbmNvbnN0IEFDVElWRV9DT0xPUiA9IG5ldyBUSFJFRS5Db2xvcigweEZGMzMzMyk7XG5cbi8qKlxuICogUmVuZGVycyBhIG1lbnUgb2YgaXRlbXMgdGhhdCBjYW4gYmUgaW50ZXJhY3RlZCB3aXRoLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNZW51UmVuZGVyZXIge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGxldCB3b3JsZCwgcHJvamVjdG9yLCBib3hTaGFwZSwgYm94Qm9keTtcbiAgICBjb25zdCBkdCA9IDEgLyA2MDtcbiAgICBsZXQgY29uc3RyYWludERvd24gPSBmYWxzZTtcbiAgICBsZXQgam9pbnRCb2R5LCBjb25zdHJhaW5lZEJvZHksIG1vdXNlQ29uc3RyYWludDtcbiAgICBjb25zdCBOID0gMTtcbiAgICBsZXQgY2xpY2tNYXJrZXIgPSBmYWxzZTtcbiAgICBsZXQgZ2VvbWV0cnksIG1hdGVyaWFsLCBtZXNoO1xuICAgIC8vIFRvIGJlIHN5bmNlZFxuICAgIGxldCBtZXNoZXMgPSBbXSwgYm9kaWVzID0gW107XG5cbiAgICAvLyBTZXR1cCBvdXIgd29ybGRcbiAgICB3b3JsZCA9IG5ldyBDQU5OT04uV29ybGQoKTtcbiAgICB3b3JsZC5xdWF0Tm9ybWFsaXplU2tpcCA9IDA7XG4gICAgd29ybGQucXVhdE5vcm1hbGl6ZUZhc3QgPSBmYWxzZTtcblxuICAgIHdvcmxkLmdyYXZpdHkuc2V0KDAsLTQsMCk7XG4gICAgd29ybGQuYnJvYWRwaGFzZSA9IG5ldyBDQU5OT04uTmFpdmVCcm9hZHBoYXNlKCk7XG5cbiAgICAvLyBDcmVhdGUgYm94ZXNcbiAgICBjb25zdCBtYXNzID0gNSwgcmFkaXVzID0gMS4zO1xuICAgIGJveFNoYXBlID0gbmV3IENBTk5PTi5Cb3gobmV3IENBTk5PTi5WZWMzKDAuNSwwLjUsMC41KSk7XG4gICAgZm9yKGxldCBpPTA7IGk8TjsgaSsrKXtcbiAgICAgIGJveEJvZHkgPSBuZXcgQ0FOTk9OLkJvZHkoeyBtYXNzOiBtYXNzIH0pO1xuICAgICAgYm94Qm9keS5hZGRTaGFwZShib3hTaGFwZSk7XG4gICAgICBib3hCb2R5LnBvc2l0aW9uLnNldCgtNyw1LDApO1xuICAgICAgd29ybGQuYWRkQm9keShib3hCb2R5KTtcbiAgICAgIGJvZGllcy5wdXNoKGJveEJvZHkpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhIHBsYW5lXG4gICAgbGV0IGdyb3VuZFNoYXBlID0gbmV3IENBTk5PTi5QbGFuZSgpO1xuICAgIGxldCBncm91bmRCb2R5ID0gbmV3IENBTk5PTi5Cb2R5KHsgbWFzczogMCB9KTtcbiAgICBncm91bmRCb2R5LmFkZFNoYXBlKGdyb3VuZFNoYXBlKTtcbiAgICBncm91bmRCb2R5LnF1YXRlcm5pb24uc2V0RnJvbUF4aXNBbmdsZShuZXcgQ0FOTk9OLlZlYzMoMSwwLDApLC1NYXRoLlBJLzIpO1xuICAgIHdvcmxkLmFkZEJvZHkoZ3JvdW5kQm9keSk7XG5cbiAgICAvLyBKb2ludCBib2R5XG4gICAgbGV0IHNoYXBlID0gbmV3IENBTk5PTi5TcGhlcmUoMC4xKTtcbiAgICBqb2ludEJvZHkgPSBuZXcgQ0FOTk9OLkJvZHkoeyBtYXNzOiAwIH0pO1xuICAgIGpvaW50Qm9keS5hZGRTaGFwZShzaGFwZSk7XG4gICAgam9pbnRCb2R5LmNvbGxpc2lvbkZpbHRlckdyb3VwID0gMDtcbiAgICBqb2ludEJvZHkuY29sbGlzaW9uRmlsdGVyTWFzayA9IDA7XG4gICAgd29ybGQuYWRkQm9keShqb2ludEJvZHkpO1xuXG4gICAgLy8gcHJvamVjdG9yID0gbmV3IFRIUkVFLlByb2plY3RvcigpO1xuXG4gICAgbGV0IHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgc2NlbmUuZm9nID0gbmV3IFRIUkVFLkZvZyggMHgwMDAwMDAsIDUwMCwgMTAwMDAgKTtcblxuICAgIGxldCBhc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICBsZXQgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDc1LCBhc3BlY3QsIDAuMSwgMTAwKTtcbiAgICBzY2VuZS5hZGQoY2FtZXJhKTtcblxuICAgIGxldCByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgYW50aWFsaWFzOiB0cnVlIH0pO1xuICAgIGNvbnNvbGUubG9nKCdzaXppbmcnKTtcbiAgICBjb25zb2xlLmxvZygnd2luZG93LmRldmljZVBpeGVsUmF0aW86ICcgKyB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgY29uc29sZS5sb2coJ3dpbmRvdy5pbm5lcldpZHRoOiAnICsgd2luZG93LmlubmVyV2lkdGgpO1xuICAgIGNvbnNvbGUubG9nKCd3aW5kb3cuaW5uZXJIZWlnaHQ6ICcgKyB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICAgIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoIHNjZW5lLmZvZy5jb2xvciApO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgLy8gcmVuZGVyZXIuc2V0U2l6ZSggd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCApO1xuICAgIC8vIGNvbnRhaW5lci5hcHBlbmRDaGlsZCggcmVuZGVyZXIuZG9tRWxlbWVudCApO1xuXG4gICAgdmFyIGVmZmVjdCA9IG5ldyBUSFJFRS5WUkVmZmVjdChyZW5kZXJlcik7XG4gICAgdmFyIGNvbnRyb2xzID0gbmV3IFRIUkVFLlZSQ29udHJvbHMoY2FtZXJhKTtcbiAgICBjb250cm9scy5zdGFuZGluZyA9IHRydWU7XG5cbiAgICBsZXQgbWFuYWdlciA9IG5ldyBXZWJWUk1hbmFnZXIocmVuZGVyZXIsIGVmZmVjdCk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgIC8vIElucHV0IG1hbmFnZXIuXG4gICAgbGV0IHJheUlucHV0ID0gbmV3IFJheUlucHV0KGNhbWVyYSk7XG4gICAgcmF5SW5wdXQuc2V0U2l6ZShyZW5kZXJlci5nZXRTaXplKCkpO1xuICAgIHJheUlucHV0Lm9uKCdyYXlkb3duJywgKG9wdF9tZXNoKSA9PiB7IHRoaXMuaGFuZGxlUmF5RG93bl8ob3B0X21lc2gpIH0pO1xuICAgIHJheUlucHV0Lm9uKCdyYXlkcmFnJywgKG9wdF9tZXNoKSA9PiB7IHRoaXMuaGFuZGxlUmF5RHJhZ18oKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5dXAnLCAob3B0X21lc2gpID0+IHsgdGhpcy5oYW5kbGVSYXlVcF8ob3B0X21lc2gpIH0pO1xuICAgIHJheUlucHV0Lm9uKCdyYXljYW5jZWwnLCAob3B0X21lc2gpID0+IHsgdGhpcy5oYW5kbGVSYXlDYW5jZWxfKG9wdF9tZXNoKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5b3ZlcicsIChtZXNoKSA9PiB7IHRoaXMuc2V0U2VsZWN0ZWRfKG1lc2gsIHRydWUpIH0pO1xuICAgIHJheUlucHV0Lm9uKCdyYXlvdXQnLCAobWVzaCkgPT4geyB0aGlzLnNldFNlbGVjdGVkXyhtZXNoLCBmYWxzZSkgfSk7XG5cbiAgICAvLyBBZGQgdGhlIHJheSBpbnB1dCBtZXNoIHRvIHRoZSBzY2VuZS5cbiAgICBzY2VuZS5hZGQocmF5SW5wdXQuZ2V0TWVzaCgpKTtcblxuICAgIHRoaXMubWFuYWdlciA9IG1hbmFnZXI7XG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lO1xuICAgIHRoaXMuY29udHJvbHMgPSBjb250cm9scztcbiAgICB0aGlzLnJheUlucHV0ID0gcmF5SW5wdXQ7XG4gICAgdGhpcy5lZmZlY3QgPSBlZmZlY3Q7XG4gICAgdGhpcy5yZW5kZXJlciA9IHJlbmRlcmVyO1xuICAgIHRoaXMud29ybGQgPSB3b3JsZDtcbiAgICB0aGlzLmR0ID0gZHQ7XG4gICAgdGhpcy5tZXNoZXMgPSBtZXNoZXM7XG4gICAgdGhpcy5ib2RpZXMgPSBib2RpZXM7XG4gICAgdGhpcy5jbGlja01hcmtlciA9IGNsaWNrTWFya2VyO1xuICAgIHRoaXMuY29uc3RyYWludERvd24gPSBjb25zdHJhaW50RG93bjtcbiAgICB0aGlzLmNvbnN0cmFpbmVkQm9keSA9IGNvbnN0cmFpbmVkQm9keTtcbiAgICB0aGlzLm1vdXNlQ29uc3RyYWludCA9IG1vdXNlQ29uc3RyYWludDtcbiAgICB0aGlzLmpvaW50Qm9keSA9IGpvaW50Qm9keTtcblxuICAgIC8vIGxpZ2h0c1xuICAgIGxldCBsaWdodCwgbWF0ZXJpYWxzO1xuICAgIHNjZW5lLmFkZCggbmV3IFRIUkVFLkFtYmllbnRMaWdodCggMHg2NjY2NjYgKSApO1xuXG4gICAgbGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCggMHhmZmZmZmYsIDEuNzUgKTtcbiAgICBjb25zdCBkID0gMjA7XG5cbiAgICBsaWdodC5wb3NpdGlvbi5zZXQoIGQsIGQsIGQgKTtcblxuICAgIGxpZ2h0LmNhc3RTaGFkb3cgPSB0cnVlO1xuICAgIC8vbGlnaHQuc2hhZG93Q2FtZXJhVmlzaWJsZSA9IHRydWU7XG5cbiAgICBsaWdodC5zaGFkb3dNYXBXaWR0aCA9IDEwMjQ7XG4gICAgbGlnaHQuc2hhZG93TWFwSGVpZ2h0ID0gMTAyNDtcblxuICAgIGxpZ2h0LnNoYWRvd0NhbWVyYUxlZnQgPSAtZDtcbiAgICBsaWdodC5zaGFkb3dDYW1lcmFSaWdodCA9IGQ7XG4gICAgbGlnaHQuc2hhZG93Q2FtZXJhVG9wID0gZDtcbiAgICBsaWdodC5zaGFkb3dDYW1lcmFCb3R0b20gPSAtZDtcblxuICAgIGxpZ2h0LnNoYWRvd0NhbWVyYUZhciA9IDMqZDtcbiAgICBsaWdodC5zaGFkb3dDYW1lcmFOZWFyID0gZDtcbiAgICBsaWdodC5zaGFkb3dEYXJrbmVzcyA9IDAuNTtcblxuICAgIHNjZW5lLmFkZCggbGlnaHQgKTtcblxuICAgIC8vIGZsb29yXG4gICAgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuUGxhbmVHZW9tZXRyeSggMTAwLCAxMDAsIDEsIDEgKTtcbiAgICAvL2dlb21ldHJ5LmFwcGx5TWF0cml4KCBuZXcgVEhSRUUuTWF0cml4NCgpLm1ha2VSb3RhdGlvblgoIC1NYXRoLlBJIC8gMiApICk7XG4gICAgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCggeyBjb2xvcjogMHg3Nzc3NzcgfSApO1xuICAgIGxldCBtYXJrZXJNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKCB7IGNvbG9yOiAweGZmMDAwMCB9ICk7XG4gICAgdGhpcy5tYXJrZXJNYXRlcmlhbCA9IG1hcmtlck1hdGVyaWFsO1xuICAgIC8vVEhSRUUuQ29sb3JVdGlscy5hZGp1c3RIU1YoIG1hdGVyaWFsLmNvbG9yLCAwLCAwLCAwLjkgKTtcbiAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIGdlb21ldHJ5LCBtYXRlcmlhbCApO1xuICAgIG1lc2guY2FzdFNoYWRvdyA9IHRydWU7XG4gICAgbWVzaC5xdWF0ZXJuaW9uLnNldEZyb21BeGlzQW5nbGUobmV3IFRIUkVFLlZlY3RvcjMoMSwwLDApLCAtTWF0aC5QSSAvIDIpO1xuICAgIG1lc2gucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gICAgbWVzaC5wb3NpdGlvbi55ID0gLTAuMTtcbiAgICBzY2VuZS5hZGQobWVzaCk7XG5cbiAgICAvLyBjdWJlc1xuICAgIHZhciBjdWJlR2VvID0gbmV3IFRIUkVFLkJveEdlb21ldHJ5KCAxLCAxLCAxLCAxMCwgMTAgKTtcbiAgICB2YXIgY3ViZU1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKCB7IGNvbG9yOiAweDI5YWQ4MyB9ICk7XG4gICAgdmFyIGN1YmVNZXNoLCBzcGhlcmVNZXNoO1xuICAgIGZvcih2YXIgaT0wOyBpPE47IGkrKyl7XG4gICAgICBjdWJlTWVzaCA9IG5ldyBUSFJFRS5NZXNoKGN1YmVHZW8sIGN1YmVNYXRlcmlhbCk7XG4gICAgICBjdWJlTWVzaC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAgIHRoaXMubWVzaGVzLnB1c2goY3ViZU1lc2gpO1xuICAgICAgdGhpcy5zY2VuZS5hZGQoY3ViZU1lc2gpO1xuICAgICAgcmF5SW5wdXQuYWRkKGN1YmVNZXNoKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgYSBmbG9vci5cbiAgICAvLyB2YXIgZmxvb3IgPSB0aGlzLmNyZWF0ZUZsb29yXygpO1xuICAgIC8vIHRoaXMuc2NlbmUuYWRkKGZsb29yKTtcbiAgfVxuLy9cbiAgdXBkYXRlUGh5c2ljcygpIHtcbiAgICB0aGlzLndvcmxkLnN0ZXAodGhpcy5kdCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgIT09IHRoaXMubWVzaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLm1lc2hlc1tpXS5wb3NpdGlvbi5jb3B5KHRoaXMuYm9kaWVzW2ldLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMubWVzaGVzW2ldLnF1YXRlcm5pb24uY29weSh0aGlzLmJvZGllc1tpXS5xdWF0ZXJuaW9uKTtcbiAgICB9XG4gIH1cblxuXG4gIHJlbmRlcigpIHtcbiAgICB0aGlzLmNvbnRyb2xzLnVwZGF0ZSgpO1xuICAgIHRoaXMucmF5SW5wdXQudXBkYXRlKCk7XG4gICAgdGhpcy51cGRhdGVQaHlzaWNzKCk7XG4gICAgdGhpcy5lZmZlY3QucmVuZGVyKHRoaXMuc2NlbmUsIHRoaXMuY2FtZXJhKTtcbiAgfVxuXG4gIHJlc2l6ZSgpIHtcbiAgICB0aGlzLmNhbWVyYS5hc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB0aGlzLmNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRTaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICAgIGNvbnNvbGUubG9nKCdSZXNpemluZycpO1xuICAgIGNvbnNvbGUubG9nKCd3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbzogJyArIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKTtcbiAgICBjb25zb2xlLmxvZygnd2luZG93LmlubmVyV2lkdGg6ICcgKyB3aW5kb3cuaW5uZXJXaWR0aCk7XG4gICAgY29uc29sZS5sb2coJ3dpbmRvdy5pbm5lckhlaWdodDogJyArIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgdmFyIERQUiA9ICh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbykgPyB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA6IDE7XG4gICAgdmFyIFdXID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdmFyIEhIID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSggV1csIEhIICk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRWaWV3cG9ydCggMCwgMCwgV1cqRFBSLCBISCpEUFIgKTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFBpeGVsUmF0aW8od2luZG93LmRldmljZVBpeGVsUmF0aW8gPyB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA6IDEpO1xuICAgIHRoaXMucmF5SW5wdXQuc2V0U2l6ZSh0aGlzLnJlbmRlcmVyLmdldFNpemUoKSk7XG4gIH1cblxuICBoYW5kbGVSYXlEb3duXyhvcHRfbWVzaCkge1xuICAgIHRoaXMuc2V0QWN0aW9uXyhvcHRfbWVzaCwgdHJ1ZSk7XG5cbiAgICBsZXQgcG9zID0gdGhpcy5yYXlJbnB1dC5yZW5kZXJlci5yZXRpY2xlLnBvc2l0aW9uO1xuICAgIGlmKHBvcyl7XG4gICAgICB0aGlzLmNvbnN0cmFpbnREb3duID0gdHJ1ZTtcbiAgICAgIC8vIFNldCBtYXJrZXIgb24gY29udGFjdCBwb2ludFxuICAgICAgdGhpcy5zZXRDbGlja01hcmtlcihwb3MueCxwb3MueSxwb3Mueix0aGlzLnNjZW5lKTtcblxuICAgICAgLy8gU2V0IHRoZSBtb3ZlbWVudCBwbGFuZVxuICAgICAgLy8gc2V0U2NyZWVuUGVycENlbnRlcihwb3MsY2FtZXJhKTtcblxuICAgICAgbGV0IGlkeCA9IHRoaXMubWVzaGVzLmluZGV4T2Yob3B0X21lc2gpO1xuICAgICAgaWYoaWR4ICE9PSAtMSl7XG4gICAgICAgIHRoaXMuYWRkTW91c2VDb25zdHJhaW50KHBvcy54LHBvcy55LHBvcy56LHRoaXMuYm9kaWVzW2lkeF0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZVJheURyYWdfKG9wdF9tZXNoKSB7XG4gICAgLy8gTW92ZSBhbmQgcHJvamVjdCBvbiB0aGUgcGxhbmVcbiAgICBpZiAodGhpcy5tb3VzZUNvbnN0cmFpbnQpIHtcbiAgICAgIGxldCBwb3MgPSB0aGlzLnJheUlucHV0LnJlbmRlcmVyLnJldGljbGUucG9zaXRpb247XG4gICAgICBpZihwb3Mpe1xuICAgICAgICB0aGlzLnNldENsaWNrTWFya2VyKHBvcy54LHBvcy55LHBvcy56LHRoaXMuc2NlbmUpO1xuICAgICAgICB0aGlzLm1vdmVKb2ludFRvUG9pbnQocG9zLngscG9zLnkscG9zLnopO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZVJheVVwXyhvcHRfbWVzaCkge1xuICAgIHRoaXMuc2V0QWN0aW9uXyhvcHRfbWVzaCwgZmFsc2UpO1xuXG4gICAgdGhpcy5jb25zdHJhaW50RG93biA9IGZhbHNlO1xuICAgIC8vIHJlbW92ZSB0aGUgbWFya2VyXG4gICAgdGhpcy5yZW1vdmVDbGlja01hcmtlcigpO1xuXG4gICAgLy8gU2VuZCB0aGUgcmVtb3ZlIG1vdXNlIGpvaW50IHRvIHNlcnZlclxuICAgIHRoaXMucmVtb3ZlSm9pbnRDb25zdHJhaW50KCk7XG4gIH1cblxuICBoYW5kbGVSYXlDYW5jZWxfKG9wdF9tZXNoKSB7XG4gICAgdGhpcy5zZXRBY3Rpb25fKG9wdF9tZXNoLCBmYWxzZSk7XG4gIH1cblxuICBzZXRTZWxlY3RlZF8obWVzaCwgaXNTZWxlY3RlZCkge1xuICAgIC8vY29uc29sZS5sb2coJ3NldFNlbGVjdGVkXycsIGlzU2VsZWN0ZWQpO1xuICAgIGxldCBuZXdDb2xvciA9IGlzU2VsZWN0ZWQgPyBISUdITElHSFRfQ09MT1IgOiBERUZBVUxUX0NPTE9SO1xuICAgIG1lc2gubWF0ZXJpYWwuY29sb3IgPSBuZXdDb2xvcjtcbiAgfVxuXG4gIHNldEFjdGlvbl8ob3B0X21lc2gsIGlzQWN0aXZlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnc2V0QWN0aW9uXycsICEhb3B0X21lc2gsIGlzQWN0aXZlKTtcbiAgICBpZiAob3B0X21lc2gpIHtcbiAgICAgIGxldCBuZXdDb2xvciA9IGlzQWN0aXZlID8gQUNUSVZFX0NPTE9SIDogSElHSExJR0hUX0NPTE9SO1xuICAgICAgb3B0X21lc2gubWF0ZXJpYWwuY29sb3IgPSBuZXdDb2xvcjtcbiAgICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgICAgb3B0X21lc2gubWF0ZXJpYWwud2lyZWZyYW1lID0gIW9wdF9tZXNoLm1hdGVyaWFsLndpcmVmcmFtZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXRDbGlja01hcmtlcih4LHkseikge1xuICAgIGlmKCF0aGlzLmNsaWNrTWFya2VyKXtcbiAgICAgIGNvbnN0IHNoYXBlID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KDAuMiwgOCwgOCk7XG4gICAgICB0aGlzLmNsaWNrTWFya2VyID0gbmV3IFRIUkVFLk1lc2goc2hhcGUsIHRoaXMubWFya2VyTWF0ZXJpYWwpO1xuICAgICAgdGhpcy5zY2VuZS5hZGQodGhpcy5jbGlja01hcmtlcik7XG4gICAgfVxuICAgIHRoaXMuY2xpY2tNYXJrZXIudmlzaWJsZSA9IHRydWU7XG4gICAgdGhpcy5jbGlja01hcmtlci5wb3NpdGlvbi5zZXQoeCx5LHopO1xuICB9XG5cbiAgcmVtb3ZlQ2xpY2tNYXJrZXIoKXtcbiAgICB0aGlzLmNsaWNrTWFya2VyLnZpc2libGUgPSBmYWxzZTtcbiAgfVxuXG4gIGFkZE1vdXNlQ29uc3RyYWludCh4LHkseixib2R5KSB7XG4gICAgLy8gVGhlIGNhbm5vbiBib2R5IGNvbnN0cmFpbmVkIGJ5IHRoZSBtb3VzZSBqb2ludFxuICAgIHRoaXMuY29uc3RyYWluZWRCb2R5ID0gYm9keTtcblxuICAgIC8vIFZlY3RvciB0byB0aGUgY2xpY2tlZCBwb2ludCwgcmVsYXRpdmUgdG8gdGhlIGJvZHlcbiAgICBsZXQgdjEgPSBuZXcgQ0FOTk9OLlZlYzMoeCx5LHopLnZzdWIodGhpcy5jb25zdHJhaW5lZEJvZHkucG9zaXRpb24pO1xuXG4gICAgLy8gQXBwbHkgYW50aS1xdWF0ZXJuaW9uIHRvIHZlY3RvciB0byB0cmFuc2Zvcm0gaXQgaW50byB0aGUgbG9jYWwgYm9keSBjb29yZGluYXRlIHN5c3RlbVxuICAgIGxldCBhbnRpUm90ID0gdGhpcy5jb25zdHJhaW5lZEJvZHkucXVhdGVybmlvbi5pbnZlcnNlKCk7XG4gICAgbGV0IHBpdm90ID0gbmV3IENBTk5PTi5RdWF0ZXJuaW9uKGFudGlSb3QueCwgYW50aVJvdC55LCBhbnRpUm90LnosIGFudGlSb3Qudykudm11bHQodjEpOyAvLyBwaXZvdCBpcyBub3QgaW4gbG9jYWwgYm9keSBjb29yZGluYXRlc1xuXG4gICAgLy8gTW92ZSB0aGUgY2Fubm9uIGNsaWNrIG1hcmtlciBwYXJ0aWNsZSB0byB0aGUgY2xpY2sgcG9zaXRpb25cbiAgICB0aGlzLmpvaW50Qm9keS5wb3NpdGlvbi5zZXQoeCx5LHopO1xuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IGNvbnN0cmFpbnRcbiAgICAvLyBUaGUgcGl2b3QgZm9yIHRoZSBqb2ludEJvZHkgaXMgemVyb1xuICAgIHRoaXMubW91c2VDb25zdHJhaW50ID0gbmV3IENBTk5PTi5Qb2ludFRvUG9pbnRDb25zdHJhaW50KHRoaXMuY29uc3RyYWluZWRCb2R5LCBwaXZvdCwgdGhpcy5qb2ludEJvZHksIG5ldyBDQU5OT04uVmVjMygwLDAsMCkpO1xuXG4gICAgLy8gQWRkIHRoZSBjb25zdHJpYW50IHRvIHdvcmxkXG4gICAgdGhpcy53b3JsZC5hZGRDb25zdHJhaW50KHRoaXMubW91c2VDb25zdHJhaW50KTtcbiAgfVxuXG4gIC8vIFRoaXMgZnVuY3Rpb24gbW92ZXMgdGhlIHRyYW5zcGFyZW50IGpvaW50IGJvZHkgdG8gYSBuZXcgcG9zaXRpb24gaW4gc3BhY2VcbiAgbW92ZUpvaW50VG9Qb2ludCh4LHkseikge1xuICAgIC8vIE1vdmUgdGhlIGpvaW50IGJvZHkgdG8gYSBuZXcgcG9zaXRpb25cbiAgICB0aGlzLmpvaW50Qm9keS5wb3NpdGlvbi5zZXQoeCx5LHopO1xuICAgIHRoaXMubW91c2VDb25zdHJhaW50LnVwZGF0ZSgpO1xuICB9XG5cbiAgcmVtb3ZlSm9pbnRDb25zdHJhaW50KCl7XG4gICAgLy8gUmVtb3ZlIGNvbnN0cmFpbnQgZnJvbSB3b3JsZFxuICAgIHRoaXMud29ybGQucmVtb3ZlQ29uc3RyYWludCh0aGlzLm1vdXNlQ29uc3RyYWludCk7XG4gICAgdGhpcy5tb3VzZUNvbnN0cmFpbnQgPSBmYWxzZTtcbiAgfVxuXG4gIGNyZWF0ZUZsb29yXygpIHtcbiAgICB2YXIgYm94U2l6ZSA9IDEwO1xuICAgIHZhciBsb2FkZXIgPSBuZXcgVEhSRUUuVGV4dHVyZUxvYWRlcigpO1xuICAgIGxvYWRlci5sb2FkKCdpbWcvYm94LnBuZycsIG9uVGV4dHVyZUxvYWRlZCk7XG4gICAgdmFyIG91dCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgZnVuY3Rpb24gb25UZXh0dXJlTG9hZGVkKHRleHR1cmUpIHtcbiAgICAgIHRleHR1cmUud3JhcFMgPSBUSFJFRS5SZXBlYXRXcmFwcGluZztcbiAgICAgIHRleHR1cmUud3JhcFQgPSBUSFJFRS5SZXBlYXRXcmFwcGluZztcbiAgICAgIHRleHR1cmUucmVwZWF0LnNldChib3hTaXplLCBib3hTaXplKTtcblxuICAgICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkJveEdlb21ldHJ5KGJveFNpemUsIGJveFNpemUsIGJveFNpemUpO1xuICAgICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgbWFwOiB0ZXh0dXJlLFxuICAgICAgICBjb2xvcjogMHgwMTU1MDAsXG4gICAgICAgIHNpZGU6IFRIUkVFLkJhY2tTaWRlXG4gICAgICB9KTtcblxuICAgICAgLy8gQWxpZ24gdGhlIHNreWJveCB0byB0aGUgZmxvb3IgKHdoaWNoIGlzIGF0IHk9MCkuXG4gICAgICBsZXQgc2t5Ym94ID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIG1hdGVyaWFsKTtcbiAgICAgIHNreWJveC5wb3NpdGlvbi55ID0gYm94U2l6ZS8yO1xuXG4gICAgICBvdXQuYWRkKHNreWJveCk7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmNvbnN0IEhFQURfRUxCT1dfT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoMC4xNTUsIC0wLjQ2NSwgLTAuMTUpO1xuY29uc3QgRUxCT1dfV1JJU1RfT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTAuMjUpO1xuY29uc3QgV1JJU1RfQ09OVFJPTExFUl9PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwLjA1KTtcbmNvbnN0IEFSTV9FWFRFTlNJT05fT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoLTAuMDgsIDAuMTQsIDAuMDgpO1xuXG5jb25zdCBFTEJPV19CRU5EX1JBVElPID0gMC40OyAvLyA0MCUgZWxib3csIDYwJSB3cmlzdC5cbmNvbnN0IEVYVEVOU0lPTl9SQVRJT19XRUlHSFQgPSAwLjQ7XG5cbmNvbnN0IE1JTl9BTkdVTEFSX1NQRUVEID0gMC42MTsgLy8gMzUgZGVncmVlcyBwZXIgc2Vjb25kIChpbiByYWRpYW5zKS5cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBhcm0gbW9kZWwgZm9yIHRoZSBEYXlkcmVhbSBjb250cm9sbGVyLiBGZWVkIGl0IGEgY2FtZXJhIGFuZFxuICogdGhlIGNvbnRyb2xsZXIuIFVwZGF0ZSBpdCBvbiBhIFJBRi5cbiAqXG4gKiBHZXQgdGhlIG1vZGVsJ3MgcG9zZSB1c2luZyBnZXRQb3NlKCkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9yaWVudGF0aW9uQXJtTW9kZWwge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmlzTGVmdEhhbmRlZCA9IGZhbHNlO1xuXG4gICAgLy8gQ3VycmVudCBhbmQgcHJldmlvdXMgY29udHJvbGxlciBvcmllbnRhdGlvbnMuXG4gICAgdGhpcy5jb250cm9sbGVyUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgdGhpcy5sYXN0Q29udHJvbGxlclEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgLy8gQ3VycmVudCBhbmQgcHJldmlvdXMgaGVhZCBvcmllbnRhdGlvbnMuXG4gICAgdGhpcy5oZWFkUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAvLyBDdXJyZW50IGhlYWQgcG9zaXRpb24uXG4gICAgdGhpcy5oZWFkUG9zID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIC8vIFBvc2l0aW9ucyBvZiBvdGhlciBqb2ludHMgKG1vc3RseSBmb3IgZGVidWdnaW5nKS5cbiAgICB0aGlzLmVsYm93UG9zID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICB0aGlzLndyaXN0UG9zID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIHRpbWVzIHRoZSBtb2RlbCB3YXMgdXBkYXRlZC5cbiAgICB0aGlzLnRpbWUgPSBudWxsO1xuICAgIHRoaXMubGFzdFRpbWUgPSBudWxsO1xuXG4gICAgLy8gUm9vdCByb3RhdGlvbi5cbiAgICB0aGlzLnJvb3RRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIC8vIEN1cnJlbnQgcG9zZSB0aGF0IHRoaXMgYXJtIG1vZGVsIGNhbGN1bGF0ZXMuXG4gICAgdGhpcy5wb3NlID0ge1xuICAgICAgb3JpZW50YXRpb246IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCksXG4gICAgICBwb3NpdGlvbjogbmV3IFRIUkVFLlZlY3RvcjMoKVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogTWV0aG9kcyB0byBzZXQgY29udHJvbGxlciBhbmQgaGVhZCBwb3NlIChpbiB3b3JsZCBjb29yZGluYXRlcykuXG4gICAqL1xuICBzZXRDb250cm9sbGVyT3JpZW50YXRpb24ocXVhdGVybmlvbikge1xuICAgIHRoaXMubGFzdENvbnRyb2xsZXJRLmNvcHkodGhpcy5jb250cm9sbGVyUSk7XG4gICAgdGhpcy5jb250cm9sbGVyUS5jb3B5KHF1YXRlcm5pb24pO1xuICB9XG5cbiAgc2V0SGVhZE9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLmhlYWRRLmNvcHkocXVhdGVybmlvbik7XG4gIH1cblxuICBzZXRIZWFkUG9zaXRpb24ocG9zaXRpb24pIHtcbiAgICB0aGlzLmhlYWRQb3MuY29weShwb3NpdGlvbik7XG4gIH1cblxuICBzZXRMZWZ0SGFuZGVkKGlzTGVmdEhhbmRlZCkge1xuICAgIC8vIFRPRE8oc211cyk6IEltcGxlbWVudCBtZSFcbiAgICB0aGlzLmlzTGVmdEhhbmRlZCA9IGlzTGVmdEhhbmRlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgb24gYSBSQUYuXG4gICAqL1xuICB1cGRhdGUoKSB7XG4gICAgdGhpcy50aW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAvLyBJZiB0aGUgY29udHJvbGxlcidzIGFuZ3VsYXIgdmVsb2NpdHkgaXMgYWJvdmUgYSBjZXJ0YWluIGFtb3VudCwgd2UgY2FuXG4gICAgLy8gYXNzdW1lIHRvcnNvIHJvdGF0aW9uIGFuZCBtb3ZlIHRoZSBlbGJvdyBqb2ludCByZWxhdGl2ZSB0byB0aGVcbiAgICAvLyBjYW1lcmEgb3JpZW50YXRpb24uXG4gICAgbGV0IGhlYWRZYXdRID0gdGhpcy5nZXRIZWFkWWF3T3JpZW50YXRpb25fKCk7XG4gICAgbGV0IHRpbWVEZWx0YSA9ICh0aGlzLnRpbWUgLSB0aGlzLmxhc3RUaW1lKSAvIDEwMDA7XG4gICAgbGV0IGFuZ2xlRGVsdGEgPSB0aGlzLnF1YXRBbmdsZV8odGhpcy5sYXN0Q29udHJvbGxlclEsIHRoaXMuY29udHJvbGxlclEpO1xuICAgIGxldCBjb250cm9sbGVyQW5ndWxhclNwZWVkID0gYW5nbGVEZWx0YSAvIHRpbWVEZWx0YTtcbiAgICBpZiAoY29udHJvbGxlckFuZ3VsYXJTcGVlZCA+IE1JTl9BTkdVTEFSX1NQRUVEKSB7XG4gICAgICAvLyBBdHRlbnVhdGUgdGhlIFJvb3Qgcm90YXRpb24gc2xpZ2h0bHkuXG4gICAgICB0aGlzLnJvb3RRLnNsZXJwKGhlYWRZYXdRLCBhbmdsZURlbHRhIC8gMTApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucm9vdFEuY29weShoZWFkWWF3USk7XG4gICAgfVxuXG4gICAgLy8gV2Ugd2FudCB0byBtb3ZlIHRoZSBlbGJvdyB1cCBhbmQgdG8gdGhlIGNlbnRlciBhcyB0aGUgdXNlciBwb2ludHMgdGhlXG4gICAgLy8gY29udHJvbGxlciB1cHdhcmRzLCBzbyB0aGF0IHRoZXkgY2FuIGVhc2lseSBzZWUgdGhlIGNvbnRyb2xsZXIgYW5kIGl0c1xuICAgIC8vIHRvb2wgdGlwcy5cbiAgICBsZXQgY29udHJvbGxlckV1bGVyID0gbmV3IFRIUkVFLkV1bGVyKCkuc2V0RnJvbVF1YXRlcm5pb24odGhpcy5jb250cm9sbGVyUSwgJ1lYWicpO1xuICAgIGxldCBjb250cm9sbGVyWERlZyA9IFRIUkVFLk1hdGgucmFkVG9EZWcoY29udHJvbGxlckV1bGVyLngpO1xuICAgIGxldCBleHRlbnNpb25SYXRpbyA9IHRoaXMuY2xhbXBfKChjb250cm9sbGVyWERlZyAtIDExKSAvICg1MCAtIDExKSwgMCwgMSk7XG5cbiAgICAvLyBDb250cm9sbGVyIG9yaWVudGF0aW9uIGluIGNhbWVyYSBzcGFjZS5cbiAgICBsZXQgY29udHJvbGxlckNhbWVyYVEgPSB0aGlzLnJvb3RRLmNsb25lKCkuaW52ZXJzZSgpO1xuICAgIGNvbnRyb2xsZXJDYW1lcmFRLm11bHRpcGx5KHRoaXMuY29udHJvbGxlclEpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGVsYm93IHBvc2l0aW9uLlxuICAgIGxldCBlbGJvd1BvcyA9IHRoaXMuZWxib3dQb3M7XG4gICAgZWxib3dQb3MuY29weSh0aGlzLmhlYWRQb3MpLmFkZChIRUFEX0VMQk9XX09GRlNFVCk7XG4gICAgbGV0IGVsYm93T2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KEFSTV9FWFRFTlNJT05fT0ZGU0VUKTtcbiAgICBlbGJvd09mZnNldC5tdWx0aXBseVNjYWxhcihleHRlbnNpb25SYXRpbyk7XG4gICAgZWxib3dQb3MuYWRkKGVsYm93T2Zmc2V0KTtcblxuICAgIC8vIENhbGN1bGF0ZSBqb2ludCBhbmdsZXMuIEdlbmVyYWxseSA0MCUgb2Ygcm90YXRpb24gYXBwbGllZCB0byBlbGJvdywgNjAlXG4gICAgLy8gdG8gd3Jpc3QsIGJ1dCBpZiBjb250cm9sbGVyIGlzIHJhaXNlZCBoaWdoZXIsIG1vcmUgcm90YXRpb24gY29tZXMgZnJvbVxuICAgIC8vIHRoZSB3cmlzdC5cbiAgICBsZXQgdG90YWxBbmdsZSA9IHRoaXMucXVhdEFuZ2xlXyhjb250cm9sbGVyQ2FtZXJhUSwgbmV3IFRIUkVFLlF1YXRlcm5pb24oKSk7XG4gICAgbGV0IHRvdGFsQW5nbGVEZWcgPSBUSFJFRS5NYXRoLnJhZFRvRGVnKHRvdGFsQW5nbGUpO1xuICAgIGxldCBsZXJwU3VwcHJlc3Npb24gPSAxIC0gTWF0aC5wb3codG90YWxBbmdsZURlZyAvIDE4MCwgNCk7IC8vIFRPRE8oc211cyk6ID8/P1xuXG4gICAgbGV0IGVsYm93UmF0aW8gPSBFTEJPV19CRU5EX1JBVElPO1xuICAgIGxldCB3cmlzdFJhdGlvID0gMSAtIEVMQk9XX0JFTkRfUkFUSU87XG4gICAgbGV0IGxlcnBWYWx1ZSA9IGxlcnBTdXBwcmVzc2lvbiAqXG4gICAgICAgIChlbGJvd1JhdGlvICsgd3Jpc3RSYXRpbyAqIGV4dGVuc2lvblJhdGlvICogRVhURU5TSU9OX1JBVElPX1dFSUdIVCk7XG5cbiAgICBsZXQgd3Jpc3RRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zbGVycChjb250cm9sbGVyQ2FtZXJhUSwgbGVycFZhbHVlKTtcbiAgICBsZXQgaW52V3Jpc3RRID0gd3Jpc3RRLmludmVyc2UoKTtcbiAgICBsZXQgZWxib3dRID0gY29udHJvbGxlckNhbWVyYVEuY2xvbmUoKS5tdWx0aXBseShpbnZXcmlzdFEpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIG91ciBmaW5hbCBjb250cm9sbGVyIHBvc2l0aW9uIGJhc2VkIG9uIGFsbCBvdXIgam9pbnQgcm90YXRpb25zXG4gICAgLy8gYW5kIGxlbmd0aHMuXG4gICAgLypcbiAgICBwb3NpdGlvbl8gPVxuICAgICAgcm9vdF9yb3RfICogKFxuICAgICAgICBjb250cm9sbGVyX3Jvb3Rfb2Zmc2V0XyArXG4yOiAgICAgIChhcm1fZXh0ZW5zaW9uXyAqIGFtdF9leHRlbnNpb24pICtcbjE6ICAgICAgZWxib3dfcm90ICogKGtDb250cm9sbGVyRm9yZWFybSArICh3cmlzdF9yb3QgKiBrQ29udHJvbGxlclBvc2l0aW9uKSlcbiAgICAgICk7XG4gICAgKi9cbiAgICBsZXQgd3Jpc3RQb3MgPSB0aGlzLndyaXN0UG9zO1xuICAgIHdyaXN0UG9zLmNvcHkoV1JJU1RfQ09OVFJPTExFUl9PRkZTRVQpO1xuICAgIHdyaXN0UG9zLmFwcGx5UXVhdGVybmlvbih3cmlzdFEpO1xuICAgIHdyaXN0UG9zLmFkZChFTEJPV19XUklTVF9PRkZTRVQpO1xuICAgIHdyaXN0UG9zLmFwcGx5UXVhdGVybmlvbihlbGJvd1EpO1xuICAgIHdyaXN0UG9zLmFkZCh0aGlzLmVsYm93UG9zKTtcblxuICAgIGxldCBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkoQVJNX0VYVEVOU0lPTl9PRkZTRVQpO1xuICAgIG9mZnNldC5tdWx0aXBseVNjYWxhcihleHRlbnNpb25SYXRpbyk7XG5cbiAgICBsZXQgcG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkodGhpcy53cmlzdFBvcyk7XG4gICAgcG9zaXRpb24uYWRkKG9mZnNldCk7XG4gICAgcG9zaXRpb24uYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm9vdFEpO1xuXG4gICAgbGV0IG9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5jb3B5KHRoaXMuY29udHJvbGxlclEpO1xuXG4gICAgLy8gU2V0IHRoZSByZXN1bHRpbmcgcG9zZSBvcmllbnRhdGlvbiBhbmQgcG9zaXRpb24uXG4gICAgdGhpcy5wb3NlLm9yaWVudGF0aW9uLmNvcHkob3JpZW50YXRpb24pO1xuICAgIHRoaXMucG9zZS5wb3NpdGlvbi5jb3B5KHBvc2l0aW9uKTtcblxuICAgIHRoaXMubGFzdFRpbWUgPSB0aGlzLnRpbWU7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcG9zZSBjYWxjdWxhdGVkIGJ5IHRoZSBtb2RlbC5cbiAgICovXG4gIGdldFBvc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMucG9zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWJ1ZyBtZXRob2RzIGZvciByZW5kZXJpbmcgdGhlIGFybSBtb2RlbC5cbiAgICovXG4gIGdldEZvcmVhcm1MZW5ndGgoKSB7XG4gICAgcmV0dXJuIEVMQk9XX1dSSVNUX09GRlNFVC5sZW5ndGgoKTtcbiAgfVxuXG4gIGdldEVsYm93UG9zaXRpb24oKSB7XG4gICAgbGV0IG91dCA9IHRoaXMuZWxib3dQb3MuY2xvbmUoKTtcbiAgICByZXR1cm4gb3V0LmFwcGx5UXVhdGVybmlvbih0aGlzLnJvb3RRKTtcbiAgfVxuXG4gIGdldFdyaXN0UG9zaXRpb24oKSB7XG4gICAgbGV0IG91dCA9IHRoaXMud3Jpc3RQb3MuY2xvbmUoKTtcbiAgICByZXR1cm4gb3V0LmFwcGx5UXVhdGVybmlvbih0aGlzLnJvb3RRKTtcbiAgfVxuXG4gIGdldEhlYWRZYXdPcmllbnRhdGlvbl8oKSB7XG4gICAgbGV0IGhlYWRFdWxlciA9IG5ldyBUSFJFRS5FdWxlcigpLnNldEZyb21RdWF0ZXJuaW9uKHRoaXMuaGVhZFEsICdZWFonKTtcbiAgICBoZWFkRXVsZXIueCA9IDA7XG4gICAgaGVhZEV1bGVyLnogPSAwO1xuICAgIGxldCBkZXN0aW5hdGlvblEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihoZWFkRXVsZXIpO1xuICAgIHJldHVybiBkZXN0aW5hdGlvblE7XG4gIH1cblxuICBjbGFtcF8odmFsdWUsIG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KHZhbHVlLCBtaW4pLCBtYXgpO1xuICB9XG5cbiAgcXVhdEFuZ2xlXyhxMSwgcTIpIHtcbiAgICBsZXQgdmVjMSA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICBsZXQgdmVjMiA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICB2ZWMxLmFwcGx5UXVhdGVybmlvbihxMSk7XG4gICAgdmVjMi5hcHBseVF1YXRlcm5pb24ocTIpO1xuICAgIHJldHVybiB2ZWMxLmFuZ2xlVG8odmVjMik7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcbmltcG9ydCBJbnRlcmFjdGlvbk1vZGVzIGZyb20gJy4vcmF5LWludGVyYWN0aW9uLW1vZGVzJ1xuaW1wb3J0IHtpc01vYmlsZX0gZnJvbSAnLi91dGlsJ1xuXG5jb25zdCBEUkFHX0RJU1RBTkNFX1BYID0gMTA7XG5cbi8qKlxuICogRW51bWVyYXRlcyBhbGwgcG9zc2libGUgaW50ZXJhY3Rpb24gbW9kZXMuIFNldHMgdXAgYWxsIGV2ZW50IGhhbmRsZXJzIChtb3VzZSxcbiAqIHRvdWNoLCBldGMpLCBpbnRlcmZhY2VzIHdpdGggZ2FtZXBhZCBBUEkuXG4gKlxuICogRW1pdHMgZXZlbnRzOlxuICogICAgYWN0aW9uOiBJbnB1dCBpcyBhY3RpdmF0ZWQgKG1vdXNlZG93biwgdG91Y2hzdGFydCwgZGF5ZHJlYW0gY2xpY2ssIHZpdmUgdHJpZ2dlcikuXG4gKiAgICByZWxlYXNlOiBJbnB1dCBpcyBkZWFjdGl2YXRlZCAobW91c2V1cCwgdG91Y2hlbmQsIGRheWRyZWFtIHJlbGVhc2UsIHZpdmUgcmVsZWFzZSkuXG4gKiAgICBjYW5jZWw6IElucHV0IGlzIGNhbmNlbGVkIChlZy4gd2Ugc2Nyb2xsZWQgaW5zdGVhZCBvZiB0YXBwaW5nIG9uIG1vYmlsZS9kZXNrdG9wKS5cbiAqICAgIHBvaW50ZXJtb3ZlKDJEIHBvc2l0aW9uKTogVGhlIHBvaW50ZXIgaXMgbW92ZWQgKG1vdXNlIG9yIHRvdWNoKS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmF5Q29udHJvbGxlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKG9wdF9lbCkge1xuICAgIHN1cGVyKCk7XG4gICAgbGV0IGVsID0gb3B0X2VsIHx8IHdpbmRvdztcblxuICAgIC8vIEhhbmRsZSBpbnRlcmFjdGlvbnMuXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlRG93bl8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZV8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZVVwXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5vblRvdWNoU3RhcnRfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmVfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kXy5iaW5kKHRoaXMpKTtcblxuICAgIC8vIFRoZSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlci5cbiAgICB0aGlzLnBvaW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIC8vIFRoZSBwcmV2aW91cyBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlci5cbiAgICB0aGlzLmxhc3RQb2ludGVyID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAvLyBQb3NpdGlvbiBvZiBwb2ludGVyIGluIE5vcm1hbGl6ZWQgRGV2aWNlIENvb3JkaW5hdGVzIChOREMpLlxuICAgIHRoaXMucG9pbnRlck5kYyA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgLy8gSG93IG11Y2ggd2UgaGF2ZSBkcmFnZ2VkIChpZiB3ZSBhcmUgZHJhZ2dpbmcpLlxuICAgIHRoaXMuZHJhZ0Rpc3RhbmNlID0gMDtcbiAgICAvLyBBcmUgd2UgZHJhZ2dpbmcgb3Igbm90LlxuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgIC8vIElzIHBvaW50ZXIgYWN0aXZlIG9yIG5vdC5cbiAgICB0aGlzLmlzVG91Y2hBY3RpdmUgPSBmYWxzZTtcbiAgICAvLyBJcyB0aGlzIGEgc3ludGhldGljIG1vdXNlIGV2ZW50P1xuICAgIHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50ID0gZmFsc2U7XG5cbiAgICAvLyBHYW1lcGFkIGV2ZW50cy5cbiAgICB0aGlzLmdhbWVwYWQgPSBudWxsO1xuXG4gICAgLy8gVlIgRXZlbnRzLlxuICAgIGlmICghbmF2aWdhdG9yLmdldFZSRGlzcGxheXMpIHtcbiAgICAgIGNvbnNvbGUud2FybignV2ViVlIgQVBJIG5vdCBhdmFpbGFibGUhIENvbnNpZGVyIHVzaW5nIHRoZSB3ZWJ2ci1wb2x5ZmlsbC4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKS50aGVuKChkaXNwbGF5cykgPT4ge1xuICAgICAgICB0aGlzLnZyRGlzcGxheSA9IGRpc3BsYXlzWzBdO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0SW50ZXJhY3Rpb25Nb2RlKCkge1xuICAgIC8vIFRPRE86IERlYnVnZ2luZyBvbmx5LlxuICAgIC8vcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuREFZRFJFQU07XG5cbiAgICB2YXIgZ2FtZXBhZCA9IHRoaXMuZ2V0VlJHYW1lcGFkXygpO1xuXG4gICAgaWYgKGdhbWVwYWQpIHtcbiAgICAgIGxldCBwb3NlID0gZ2FtZXBhZC5wb3NlO1xuICAgICAgLy8gSWYgdGhlcmUncyBhIGdhbWVwYWQgY29ubmVjdGVkLCBkZXRlcm1pbmUgaWYgaXQncyBEYXlkcmVhbSBvciBhIFZpdmUuXG4gICAgICBpZiAocG9zZS5oYXNQb3NpdGlvbikge1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9zZS5oYXNPcmllbnRhdGlvbikge1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCwgaXQgbWlnaHQgYmUgQ2FyZGJvYXJkLCBtYWdpYyB3aW5kb3cgb3IgZGVza3RvcC5cbiAgICAgIGlmIChpc01vYmlsZSgpKSB7XG4gICAgICAgIC8vIEVpdGhlciBDYXJkYm9hcmQgb3IgbWFnaWMgd2luZG93LCBkZXBlbmRpbmcgb24gd2hldGhlciB3ZSBhcmVcbiAgICAgICAgLy8gcHJlc2VudGluZy5cbiAgICAgICAgaWYgKHRoaXMudnJEaXNwbGF5ICYmIHRoaXMudnJEaXNwbGF5LmlzUHJlc2VudGluZykge1xuICAgICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzBET0Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVE9VQ0g7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIG11c3QgYmUgb24gZGVza3RvcC5cbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuTU9VU0U7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEJ5IGRlZmF1bHQsIHVzZSBUT1VDSC5cbiAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDtcbiAgfVxuXG4gIGdldEdhbWVwYWRQb3NlKCkge1xuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG4gICAgcmV0dXJuIGdhbWVwYWQucG9zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaWYgdGhlcmUgaXMgYW4gYWN0aXZlIHRvdWNoIGV2ZW50IGdvaW5nIG9uLlxuICAgKiBPbmx5IHJlbGV2YW50IG9uIHRvdWNoIGRldmljZXNcbiAgICovXG4gIGdldElzVG91Y2hBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNUb3VjaEFjdGl2ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBjbGljayBpcyB0aGUgY2FyZGJvYXJkLWNvbXBhdGlibGUgZmFsbGJhY2tcbiAgICogY2xpY2sgb24gRGF5ZHJlYW0gY29udHJvbGxlcnMgc28gdGhhdCB3ZSBjYW4gZGVkdXBsaWNhdGUgaXQuXG4gICAqIFRPRE8oa2xhdXN3KTogSXQgd291bGQgYmUgbmljZSB0byBiZSBhYmxlIHRvIG1vdmUgaW50ZXJhY3Rpb25zXG4gICAqIHRvIHRoaXMgZXZlbnQgc2luY2UgaXQgY291bnRzIGFzIGEgdXNlciBhY3Rpb24gd2hpbGUgY29udHJvbGxlclxuICAgKiBjbGlja3MgZG9uJ3QuIEJ1dCB0aGF0IHdvdWxkIHJlcXVpcmUgbGFyZ2VyIHJlZmFjdG9yaW5nLlxuICAgKi9cbiAgaXNDYXJkYm9hcmRDb21wYXRDbGljayhlKSB7XG4gICAgbGV0IG1vZGUgPSB0aGlzLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIGlmIChtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRiAmJiBlLnNjcmVlblggPT0gMCAmJiBlLnNjcmVlblkgPT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHNldFNpemUoc2l6ZSkge1xuICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgbGV0IG1vZGUgPSB0aGlzLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIGlmIChtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRiB8fCBtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfNkRPRikge1xuICAgICAgLy8gSWYgd2UncmUgZGVhbGluZyB3aXRoIGEgZ2FtZXBhZCwgY2hlY2sgZXZlcnkgYW5pbWF0aW9uIGZyYW1lIGZvciBhXG4gICAgICAvLyBwcmVzc2VkIGFjdGlvbi5cbiAgICAgIGxldCBpc0dhbWVwYWRQcmVzc2VkID0gdGhpcy5nZXRHYW1lcGFkQnV0dG9uUHJlc3NlZF8oKTtcbiAgICAgIGlmIChpc0dhbWVwYWRQcmVzc2VkICYmICF0aGlzLndhc0dhbWVwYWRQcmVzc2VkKSB7XG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xuICAgICAgfVxuICAgICAgaWYgKCFpc0dhbWVwYWRQcmVzc2VkICYmIHRoaXMud2FzR2FtZXBhZFByZXNzZWQpIHtcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZW1pdCgncmF5dXAnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMud2FzR2FtZXBhZFByZXNzZWQgPSBpc0dhbWVwYWRQcmVzc2VkO1xuXG4gICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICAgIHRoaXMuZW1pdCgncmF5ZHJhZycpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldEdhbWVwYWRCdXR0b25QcmVzc2VkXygpIHtcbiAgICB2YXIgZ2FtZXBhZCA9IHRoaXMuZ2V0VlJHYW1lcGFkXygpO1xuICAgIGlmICghZ2FtZXBhZCkge1xuICAgICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkLCB0aGUgYnV0dG9uIHdhcyBub3QgcHJlc3NlZC5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgZm9yIGNsaWNrcy5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGdhbWVwYWQuYnV0dG9ucy5sZW5ndGg7ICsraikge1xuICAgICAgaWYgKGdhbWVwYWQuYnV0dG9uc1tqXS5wcmVzc2VkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBvbk1vdXNlRG93bl8oZSkge1xuICAgIGlmICh0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCkgcmV0dXJuO1xuICAgIGlmICh0aGlzLmlzQ2FyZGJvYXJkQ29tcGF0Q2xpY2soZSkpIHJldHVybjtcblxuICAgIHRoaXMuc3RhcnREcmFnZ2luZ18oZSk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG4gIH1cblxuICBvbk1vdXNlTW92ZV8oZSkge1xuICAgIGlmICh0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCkgcmV0dXJuO1xuXG4gICAgdGhpcy51cGRhdGVQb2ludGVyXyhlKTtcbiAgICB0aGlzLnVwZGF0ZURyYWdEaXN0YW5jZV8oKTtcbiAgICB0aGlzLmVtaXQoJ3BvaW50ZXJtb3ZlJywgdGhpcy5wb2ludGVyTmRjKTtcbiAgfVxuXG4gIG9uTW91c2VVcF8oZSkge1xuICAgIHZhciBpc1N5bnRoZXRpYyA9IHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50O1xuICAgIHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50ID0gZmFsc2U7XG4gICAgaWYgKGlzU3ludGhldGljKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaXNDYXJkYm9hcmRDb21wYXRDbGljayhlKSkgcmV0dXJuO1xuXG4gICAgdGhpcy5lbmREcmFnZ2luZ18oKTtcbiAgfVxuXG4gIG9uVG91Y2hTdGFydF8oZSkge1xuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IHRydWU7XG4gICAgdmFyIHQgPSBlLnRvdWNoZXNbMF07XG4gICAgdGhpcy5zdGFydERyYWdnaW5nXyh0KTtcbiAgICB0aGlzLnVwZGF0ZVRvdWNoUG9pbnRlcl8oZSk7XG5cbiAgICB0aGlzLmVtaXQoJ3BvaW50ZXJtb3ZlJywgdGhpcy5wb2ludGVyTmRjKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nKTtcbiAgfVxuXG4gIG9uVG91Y2hNb3ZlXyhlKSB7XG4gICAgdGhpcy51cGRhdGVUb3VjaFBvaW50ZXJfKGUpO1xuICAgIHRoaXMudXBkYXRlRHJhZ0Rpc3RhbmNlXygpO1xuICB9XG5cbiAgb25Ub3VjaEVuZF8oZSkge1xuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XG5cbiAgICAvLyBTdXBwcmVzcyBkdXBsaWNhdGUgZXZlbnRzIGZyb20gc3ludGhldGljIG1vdXNlIGV2ZW50cy5cbiAgICB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCA9IHRydWU7XG4gICAgdGhpcy5pc1RvdWNoQWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICB1cGRhdGVUb3VjaFBvaW50ZXJfKGUpIHtcbiAgICAvLyBJZiB0aGVyZSdzIG5vIHRvdWNoZXMgYXJyYXksIGlnbm9yZS5cbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS53YXJuKCdSZWNlaXZlZCB0b3VjaCBldmVudCB3aXRoIG5vIHRvdWNoZXMuJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0ID0gZS50b3VjaGVzWzBdO1xuICAgIHRoaXMudXBkYXRlUG9pbnRlcl8odCk7XG4gIH1cblxuICB1cGRhdGVQb2ludGVyXyhlKSB7XG4gICAgLy8gSG93IG11Y2ggdGhlIHBvaW50ZXIgbW92ZWQuXG4gICAgdGhpcy5wb2ludGVyLnNldChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gICAgdGhpcy5wb2ludGVyTmRjLnggPSAoZS5jbGllbnRYIC8gdGhpcy5zaXplLndpZHRoKSAqIDIgLSAxO1xuICAgIHRoaXMucG9pbnRlck5kYy55ID0gLSAoZS5jbGllbnRZIC8gdGhpcy5zaXplLmhlaWdodCkgKiAyICsgMTtcbiAgfVxuXG4gIHVwZGF0ZURyYWdEaXN0YW5jZV8oKSB7XG4gICAgaWYgKHRoaXMuaXNEcmFnZ2luZykge1xuICAgICAgdmFyIGRpc3RhbmNlID0gdGhpcy5sYXN0UG9pbnRlci5zdWIodGhpcy5wb2ludGVyKS5sZW5ndGgoKTtcbiAgICAgIHRoaXMuZHJhZ0Rpc3RhbmNlICs9IGRpc3RhbmNlO1xuICAgICAgdGhpcy5sYXN0UG9pbnRlci5jb3B5KHRoaXMucG9pbnRlcik7XG5cblxuICAgICAgLy9jb25zb2xlLmxvZygnZHJhZ0Rpc3RhbmNlJywgdGhpcy5kcmFnRGlzdGFuY2UpO1xuICAgICAgaWYgKHRoaXMuZHJhZ0Rpc3RhbmNlID4gRFJBR19ESVNUQU5DRV9QWCkge1xuICAgICAgICB0aGlzLmVtaXQoJ3JheWNhbmNlbCcpO1xuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzdGFydERyYWdnaW5nXyhlKSB7XG4gICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmxhc3RQb2ludGVyLnNldChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gIH1cblxuICBlbmREcmFnZ2luZ18oKSB7XG4gICAgaWYgKHRoaXMuZHJhZ0Rpc3RhbmNlIDwgRFJBR19ESVNUQU5DRV9QWCkge1xuICAgICAgdGhpcy5lbWl0KCdyYXl1cCcpO1xuICAgIH1cbiAgICB0aGlzLmRyYWdEaXN0YW5jZSA9IDA7XG4gICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZmlyc3QgVlItZW5hYmxlZCBnYW1lcGFkLlxuICAgKi9cbiAgZ2V0VlJHYW1lcGFkXygpIHtcbiAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQgQVBJLCB0aGVyZSdzIG5vIGdhbWVwYWQuXG4gICAgaWYgKCFuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBnYW1lcGFkcyA9IG5hdmlnYXRvci5nZXRHYW1lcGFkcygpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2FtZXBhZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBnYW1lcGFkID0gZ2FtZXBhZHNbaV07XG5cbiAgICAgIC8vIFRoZSBhcnJheSBtYXkgY29udGFpbiB1bmRlZmluZWQgZ2FtZXBhZHMsIHNvIGNoZWNrIGZvciB0aGF0IGFzIHdlbGwgYXNcbiAgICAgIC8vIGEgbm9uLW51bGwgcG9zZS5cbiAgICAgIGlmIChnYW1lcGFkICYmIGdhbWVwYWQucG9zZSkge1xuICAgICAgICByZXR1cm4gZ2FtZXBhZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBPcmllbnRhdGlvbkFybU1vZGVsIGZyb20gJy4vb3JpZW50YXRpb24tYXJtLW1vZGVsJ1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuaW1wb3J0IFJheVJlbmRlcmVyIGZyb20gJy4vcmF5LXJlbmRlcmVyJ1xuaW1wb3J0IFJheUNvbnRyb2xsZXIgZnJvbSAnLi9yYXktY29udHJvbGxlcidcbmltcG9ydCBJbnRlcmFjdGlvbk1vZGVzIGZyb20gJy4vcmF5LWludGVyYWN0aW9uLW1vZGVzJ1xuXG4vKipcbiAqIEFQSSB3cmFwcGVyIGZvciB0aGUgaW5wdXQgbGlicmFyeS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmF5SW5wdXQgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihjYW1lcmEsIG9wdF9lbCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFJheVJlbmRlcmVyKGNhbWVyYSk7XG4gICAgdGhpcy5jb250cm9sbGVyID0gbmV3IFJheUNvbnRyb2xsZXIob3B0X2VsKTtcblxuICAgIC8vIEFybSBtb2RlbCBuZWVkZWQgdG8gdHJhbnNmb3JtIGNvbnRyb2xsZXIgb3JpZW50YXRpb24gaW50byBwcm9wZXIgcG9zZS5cbiAgICB0aGlzLmFybU1vZGVsID0gbmV3IE9yaWVudGF0aW9uQXJtTW9kZWwoKTtcblxuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5ZG93bicsIHRoaXMub25SYXlEb3duXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheXVwJywgdGhpcy5vblJheVVwXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheWNhbmNlbCcsIHRoaXMub25SYXlDYW5jZWxfLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncG9pbnRlcm1vdmUnLCB0aGlzLm9uUG9pbnRlck1vdmVfLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5ZHJhZycsIHRoaXMub25SYXlEcmFnXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnJlbmRlcmVyLm9uKCdyYXlvdmVyJywgKG1lc2gpID0+IHsgdGhpcy5lbWl0KCdyYXlvdmVyJywgbWVzaCkgfSk7XG4gICAgdGhpcy5yZW5kZXJlci5vbigncmF5b3V0JywgKG1lc2gpID0+IHsgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKSB9KTtcblxuICAgIC8vIEJ5IGRlZmF1bHQsIHB1dCB0aGUgcG9pbnRlciBvZmZzY3JlZW4uXG4gICAgdGhpcy5wb2ludGVyTmRjID0gbmV3IFRIUkVFLlZlY3RvcjIoMSwgMSk7XG5cbiAgICAvLyBFdmVudCBoYW5kbGVycy5cbiAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gIH1cblxuICBhZGQob2JqZWN0LCBoYW5kbGVycykge1xuICAgIHRoaXMucmVuZGVyZXIuYWRkKG9iamVjdCwgaGFuZGxlcnMpO1xuICAgIHRoaXMuaGFuZGxlcnNbb2JqZWN0LmlkXSA9IGhhbmRsZXJzO1xuICB9XG5cbiAgcmVtb3ZlKG9iamVjdCkge1xuICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlKG9iamVjdCk7XG4gICAgZGVsZXRlIHRoaXMuaGFuZGxlcnNbb2JqZWN0LmlkXVxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIGxldCBsb29rQXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbG9va0F0LmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcblxuICAgIGxldCBtb2RlID0gdGhpcy5jb250cm9sbGVyLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLk1PVVNFOlxuICAgICAgICAvLyBEZXNrdG9wIG1vdXNlIG1vZGUsIG1vdXNlIGNvb3JkaW5hdGVzIGFyZSB3aGF0IG1hdHRlcnMuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9pbnRlcih0aGlzLnBvaW50ZXJOZGMpO1xuICAgICAgICAvLyBIaWRlIHRoZSByYXkgYW5kIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkoZmFsc2UpO1xuXG4gICAgICAgIC8vIEluIG1vdXNlIG1vZGUgcmF5IHJlbmRlcmVyIGlzIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlRPVUNIOlxuICAgICAgICAvLyBNb2JpbGUgbWFnaWMgd2luZG93IG1vZGUuIFRvdWNoIGNvb3JkaW5hdGVzIG1hdHRlciwgYnV0IHdlIHdhbnQgdG9cbiAgICAgICAgLy8gaGlkZSB0aGUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb2ludGVyKHRoaXMucG9pbnRlck5kYyk7XG5cbiAgICAgICAgLy8gSGlkZSB0aGUgcmF5IGFuZCB0aGUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eShmYWxzZSk7XG5cbiAgICAgICAgLy8gSW4gdG91Y2ggbW9kZSB0aGUgcmF5IHJlbmRlcmVyIGlzIG9ubHkgYWN0aXZlIG9uIHRvdWNoLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0aGlzLmNvbnRyb2xsZXIuZ2V0SXNUb3VjaEFjdGl2ZSgpKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl8wRE9GOlxuICAgICAgICAvLyBDYXJkYm9hcmQgbW9kZSwgd2UncmUgZGVhbGluZyB3aXRoIGEgZ2F6ZSByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKHRoaXMuY2FtZXJhLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcblxuICAgICAgICAvLyBSZXRpY2xlIG9ubHkuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XG5cbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0Y6XG4gICAgICAgIC8vIERheWRyZWFtLCBvdXIgb3JpZ2luIGlzIHNsaWdodGx5IG9mZiAoZGVwZW5kaW5nIG9uIGhhbmRlZG5lc3MpLlxuICAgICAgICAvLyBCdXQgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoZSBvcmllbnRhdGlvbiBmcm9tIHRoZSBnYW1lcGFkLlxuICAgICAgICAvLyBUT0RPKHNtdXMpOiBJbXBsZW1lbnQgdGhlIHJlYWwgYXJtIG1vZGVsLlxuICAgICAgICB2YXIgcG9zZSA9IHRoaXMuY29udHJvbGxlci5nZXRHYW1lcGFkUG9zZSgpO1xuXG4gICAgICAgIC8vIERlYnVnIG9ubHk6IHVzZSBjYW1lcmEgYXMgaW5wdXQgY29udHJvbGxlci5cbiAgICAgICAgLy9sZXQgY29udHJvbGxlck9yaWVudGF0aW9uID0gdGhpcy5jYW1lcmEucXVhdGVybmlvbjtcbiAgICAgICAgbGV0IGNvbnRyb2xsZXJPcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuZnJvbUFycmF5KHBvc2Uub3JpZW50YXRpb24pO1xuXG4gICAgICAgIC8vIFRyYW5zZm9ybSB0aGUgY29udHJvbGxlciBpbnRvIHRoZSBjYW1lcmEgY29vcmRpbmF0ZSBzeXN0ZW0uXG4gICAgICAgIC8qXG4gICAgICAgIGNvbnRyb2xsZXJPcmllbnRhdGlvbi5tdWx0aXBseShcbiAgICAgICAgICAgIG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUF4aXNBbmdsZShuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKSwgTWF0aC5QSSkpO1xuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ueCAqPSAtMTtcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLnogKj0gLTE7XG4gICAgICAgICovXG5cbiAgICAgICAgLy8gRmVlZCBjYW1lcmEgYW5kIGNvbnRyb2xsZXIgaW50byB0aGUgYXJtIG1vZGVsLlxuICAgICAgICB0aGlzLmFybU1vZGVsLnNldEhlYWRPcmllbnRhdGlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkUG9zaXRpb24odGhpcy5jYW1lcmEucG9zaXRpb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnNldENvbnRyb2xsZXJPcmllbnRhdGlvbihjb250cm9sbGVyT3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnVwZGF0ZSgpO1xuXG4gICAgICAgIC8vIEdldCByZXN1bHRpbmcgcG9zZSBhbmQgY29uZmlndXJlIHRoZSByZW5kZXJlci5cbiAgICAgICAgbGV0IG1vZGVsUG9zZSA9IHRoaXMuYXJtTW9kZWwuZ2V0UG9zZSgpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKG1vZGVsUG9zZS5wb3NpdGlvbik7XG4gICAgICAgIC8vdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbihuZXcgVEhSRUUuVmVjdG9yMygpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihtb2RlbFBvc2Uub3JpZW50YXRpb24pO1xuICAgICAgICAvL3RoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24oY29udHJvbGxlck9yaWVudGF0aW9uKTtcblxuICAgICAgICAvLyBTaG93IHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KHRydWUpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GOlxuICAgICAgICAvLyBWaXZlLCBvcmlnaW4gZGVwZW5kcyBvbiB0aGUgcG9zaXRpb24gb2YgdGhlIGNvbnRyb2xsZXIuXG4gICAgICAgIC8vIFRPRE8oc211cykuLi5cbiAgICAgICAgdmFyIHBvc2UgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0R2FtZXBhZFBvc2UoKTtcblxuICAgICAgICAvLyBDaGVjayB0aGF0IHRoZSBwb3NlIGlzIHZhbGlkLlxuICAgICAgICBpZiAoIXBvc2Uub3JpZW50YXRpb24gfHwgIXBvc2UucG9zaXRpb24pIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgZ2FtZXBhZCBwb3NlLiBDYW5cXCd0IHVwZGF0ZSByYXkuJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5mcm9tQXJyYXkocG9zZS5vcmllbnRhdGlvbik7XG4gICAgICAgIGxldCBwb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuZnJvbUFycmF5KHBvc2UucG9zaXRpb24pO1xuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24ob3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKHBvc2l0aW9uKTtcblxuICAgICAgICAvLyBTaG93IHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KHRydWUpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Vua25vd24gaW50ZXJhY3Rpb24gbW9kZS4nKTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXJlci51cGRhdGUoKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIudXBkYXRlKCk7XG4gIH1cblxuICBzZXRTaXplKHNpemUpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIuc2V0U2l6ZShzaXplKTtcbiAgfVxuXG4gIGdldE1lc2goKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0UmV0aWNsZVJheU1lc2goKTtcbiAgfVxuXG4gIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXRPcmlnaW4oKTtcbiAgfVxuXG4gIGdldERpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXREaXJlY3Rpb24oKTtcbiAgfVxuXG4gIGdldFJpZ2h0RGlyZWN0aW9uKCkge1xuICAgIGxldCBsb29rQXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbG9va0F0LmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcbiAgICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoKS5jcm9zc1ZlY3RvcnMobG9va0F0LCB0aGlzLmNhbWVyYS51cCk7XG4gIH1cblxuICBvblJheURvd25fKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheURvd25fJyk7XG5cbiAgICAvLyBGb3JjZSB0aGUgcmVuZGVyZXIgdG8gcmF5Y2FzdC5cbiAgICB0aGlzLnJlbmRlcmVyLnVwZGF0ZSgpO1xuICAgIGxldCBtZXNoID0gdGhpcy5yZW5kZXJlci5nZXRTZWxlY3RlZE1lc2goKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nLCBtZXNoKTtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICB9XG5cbiAgb25SYXlEcmFnXygpIHtcbiAgICB0aGlzLmVtaXQoJ3JheWRyYWcnKTtcbiAgfVxuXG4gIG9uUmF5VXBfKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheVVwXycpO1xuICAgIGxldCBtZXNoID0gdGhpcy5yZW5kZXJlci5nZXRTZWxlY3RlZE1lc2goKTtcbiAgICB0aGlzLmVtaXQoJ3JheXVwJywgbWVzaCk7XG5cbiAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZShmYWxzZSk7XG4gIH1cblxuICBvblJheUNhbmNlbF8oZSkge1xuICAgIC8vY29uc29sZS5sb2coJ29uUmF5Q2FuY2VsXycpO1xuICAgIGxldCBtZXNoID0gdGhpcy5yZW5kZXJlci5nZXRTZWxlY3RlZE1lc2goKTtcbiAgICB0aGlzLmVtaXQoJ3JheWNhbmNlbCcsIG1lc2gpO1xuICB9XG5cbiAgb25Qb2ludGVyTW92ZV8obmRjKSB7XG4gICAgdGhpcy5wb2ludGVyTmRjLmNvcHkobmRjKTtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEludGVyYWN0aW9uTW9kZXMgPSB7XG4gIE1PVVNFOiAxLFxuICBUT1VDSDogMixcbiAgVlJfMERPRjogMyxcbiAgVlJfM0RPRjogNCxcbiAgVlJfNkRPRjogNVxufTtcblxuZXhwb3J0IHsgSW50ZXJhY3Rpb25Nb2RlcyBhcyBkZWZhdWx0IH07XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQge2Jhc2U2NH0gZnJvbSAnLi91dGlsJ1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuXG5jb25zdCBSRVRJQ0xFX0RJU1RBTkNFID0gMztcbmNvbnN0IElOTkVSX1JBRElVUyA9IDAuMDI7XG5jb25zdCBPVVRFUl9SQURJVVMgPSAwLjA0O1xuY29uc3QgUkFZX1JBRElVUyA9IDAuMDI7XG5jb25zdCBHUkFESUVOVF9JTUFHRSA9IGJhc2U2NCgnaW1hZ2UvcG5nJywgJ2lWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFJQUFBQUNBQ0FZQUFBRERQbUhMQUFBQmRrbEVRVlI0bk8zV3dYSEVRQXdEUWNpbi9GT1d3K0JqdWlQWUIycTRHMm5QOTMzUDlTTzQ4MjR6Z0RBRGlET0F1SGZiMy9VanVLTUFjUVlRWndCeC9nQnhDaENuQUhFS0VLY0FjUW9RcHdCeENoQ25BSEVHRUdjQWNmNEFjUW9RWndCeEJoQm5BSEVHRUdjQWNRWVFad0J4QmhCbkFIRUdFR2NBY1FZUVp3QnhCaEJuQUhIdnR0LzFJN2lqQUhFR0VHY0FjZjRBY1FvUVp3QnhUa0NjQXNRWlFKd1RFS2NBY1FvUXB3QnhCaERuQk1RcFFKd0N4Q2xBbkFMRUtVQ2NBc1FwUUp3Q3hDbEFuQUxFS1VDY0FzUXBRSndCeERrQmNRb1Fwd0J4Q2hDbkFIRUtFS2NBY1FvUXB3QnhDaENuQUhFS0VHY0FjVTVBbkFMRUtVQ2NBc1FaUUp3VEVLY0FjUVlRNXdURUtVQ2NBY1FaUUp3L1FKd0N4QmxBbkFIRUdVQ2NBY1FaUUp3QnhCbEFuQUhFR1VDY0FjUVpRSndCeEJsQW5BSEVHVURjdSsyNWZnUjNGQ0RPQU9JTUlNNGZJRTRCNGhRZ1RnSGlGQ0JPQWVJVUlFNEI0aFFnemdEaURDRE9IeUJPQWVJTUlNNEE0djRCLzVJRjllRDZReGdBQUFBQVNVVk9SSzVDWUlJPScpO1xuXG4vKipcbiAqIEhhbmRsZXMgcmF5IGlucHV0IHNlbGVjdGlvbiBmcm9tIGZyYW1lIG9mIHJlZmVyZW5jZSBvZiBhbiBhcmJpdHJhcnkgb2JqZWN0LlxuICpcbiAqIFRoZSBzb3VyY2Ugb2YgdGhlIHJheSBpcyBmcm9tIHZhcmlvdXMgbG9jYXRpb25zOlxuICpcbiAqIERlc2t0b3A6IG1vdXNlLlxuICogTWFnaWMgd2luZG93OiB0b3VjaC5cbiAqIENhcmRib2FyZDogY2FtZXJhLlxuICogRGF5ZHJlYW06IDNET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cbiAqIFZpdmU6IDZET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cbiAqXG4gKiBFbWl0cyBzZWxlY3Rpb24gZXZlbnRzOlxuICogICAgIHJheW92ZXIobWVzaCk6IFRoaXMgbWVzaCB3YXMgc2VsZWN0ZWQuXG4gKiAgICAgcmF5b3V0KG1lc2gpOiBUaGlzIG1lc2ggd2FzIHVuc2VsZWN0ZWQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheVJlbmRlcmVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY2FtZXJhLCBvcHRfcGFyYW1zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXG4gICAgdmFyIHBhcmFtcyA9IG9wdF9wYXJhbXMgfHwge307XG5cbiAgICAvLyBXaGljaCBvYmplY3RzIGFyZSBpbnRlcmFjdGl2ZSAoa2V5ZWQgb24gaWQpLlxuICAgIHRoaXMubWVzaGVzID0ge307XG5cbiAgICAvLyBXaGljaCBvYmplY3RzIGFyZSBjdXJyZW50bHkgc2VsZWN0ZWQgKGtleWVkIG9uIGlkKS5cbiAgICB0aGlzLnNlbGVjdGVkID0ge307XG5cbiAgICAvLyBUaGUgcmF5Y2FzdGVyLlxuICAgIHRoaXMucmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuXG4gICAgLy8gUG9zaXRpb24gYW5kIG9yaWVudGF0aW9uLCBpbiBhZGRpdGlvbi5cbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICB0aGlzLm9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIHRoaXMucm9vdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgLy8gQWRkIHRoZSByZXRpY2xlIG1lc2ggdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cbiAgICB0aGlzLnJldGljbGUgPSB0aGlzLmNyZWF0ZVJldGljbGVfKCk7XG4gICAgdGhpcy5yb290LmFkZCh0aGlzLnJldGljbGUpO1xuXG4gICAgLy8gQWRkIHRoZSByYXkgdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cbiAgICB0aGlzLnJheSA9IHRoaXMuY3JlYXRlUmF5XygpO1xuICAgIHRoaXMucm9vdC5hZGQodGhpcy5yYXkpO1xuXG4gICAgLy8gSG93IGZhciB0aGUgcmV0aWNsZSBpcyBjdXJyZW50bHkgZnJvbSB0aGUgcmV0aWNsZSBvcmlnaW4uXG4gICAgdGhpcy5yZXRpY2xlRGlzdGFuY2UgPSBSRVRJQ0xFX0RJU1RBTkNFO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGFuIG9iamVjdCBzbyB0aGF0IGl0IGNhbiBiZSBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICBhZGQob2JqZWN0KSB7XG4gICAgdGhpcy5tZXNoZXNbb2JqZWN0LmlkXSA9IG9iamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmV2ZW50IGFuIG9iamVjdCBmcm9tIGJlaW5nIGludGVyYWN0ZWQgd2l0aC5cbiAgICovXG4gIHJlbW92ZShvYmplY3QpIHtcbiAgICB2YXIgaWQgPSBvYmplY3QuaWQ7XG4gICAgaWYgKHRoaXMubWVzaGVzW2lkXSkge1xuICAgICAgLy8gSWYgdGhlcmUncyBubyBleGlzdGluZyBtZXNoLCB3ZSBjYW4ndCByZW1vdmUgaXQuXG4gICAgICBkZWxldGUgdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGN1cnJlbnRseSBzZWxlY3RlZCwgcmVtb3ZlIGl0LlxuICAgIGlmICh0aGlzLnNlbGVjdGVkW2lkXSkge1xuICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbb2JqZWN0LmlkXTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgLy8gRG8gdGhlIHJheWNhc3RpbmcgYW5kIGlzc3VlIHZhcmlvdXMgZXZlbnRzIGFzIG5lZWRlZC5cbiAgICBmb3IgKGxldCBpZCBpbiB0aGlzLm1lc2hlcykge1xuICAgICAgbGV0IG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG4gICAgICBsZXQgaW50ZXJzZWN0cyA9IHRoaXMucmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdChtZXNoLCB0cnVlKTtcbiAgICAgIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdVbmV4cGVjdGVkOiBtdWx0aXBsZSBtZXNoZXMgaW50ZXJzZWN0ZWQuJyk7XG4gICAgICB9XG4gICAgICBsZXQgaXNJbnRlcnNlY3RlZCA9IChpbnRlcnNlY3RzLmxlbmd0aCA+IDApO1xuICAgICAgbGV0IGlzU2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkW2lkXTtcblxuICAgICAgLy8gSWYgaXQncyBuZXdseSBzZWxlY3RlZCwgc2VuZCByYXlvdmVyLlxuICAgICAgaWYgKGlzSW50ZXJzZWN0ZWQgJiYgIWlzU2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFtpZF0gPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgIHRoaXMuZW1pdCgncmF5b3ZlcicsIG1lc2gpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0J3Mgbm8gbG9uZ2VyIGludGVyc2VjdGVkLCBzZW5kIHJheW91dC5cbiAgICAgIGlmICghaXNJbnRlcnNlY3RlZCAmJiBpc1NlbGVjdGVkKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW2lkXTtcbiAgICAgICAgdGhpcy5tb3ZlUmV0aWNsZV8obnVsbCk7XG4gICAgICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNJbnRlcnNlY3RlZCkge1xuICAgICAgICB0aGlzLm1vdmVSZXRpY2xlXyhpbnRlcnNlY3RzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luIG9mIHRoZSByYXkuXG4gICAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3IgUG9zaXRpb24gb2YgdGhlIG9yaWdpbiBvZiB0aGUgcGlja2luZyByYXkuXG4gICAqL1xuICBzZXRQb3NpdGlvbih2ZWN0b3IpIHtcbiAgICB0aGlzLnBvc2l0aW9uLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luLmNvcHkodmVjdG9yKTtcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgfVxuXG4gIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHJheS5cbiAgICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvciBVbml0IHZlY3RvciBjb3JyZXNwb25kaW5nIHRvIGRpcmVjdGlvbi5cbiAgICovXG4gIHNldE9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLm9yaWVudGF0aW9uLmNvcHkocXVhdGVybmlvbik7XG5cbiAgICB2YXIgcG9pbnRBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKS5hcHBseVF1YXRlcm5pb24ocXVhdGVybmlvbik7XG4gICAgdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvbi5jb3B5KHBvaW50QXQpXG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICBnZXREaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9pbnRlciBvbiB0aGUgc2NyZWVuIGZvciBjYW1lcmEgKyBwb2ludGVyIGJhc2VkIHBpY2tpbmcuIFRoaXNcbiAgICogc3VwZXJzY2VkZXMgb3JpZ2luIGFuZCBkaXJlY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gdmVjdG9yIFRoZSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlciAoc2NyZWVuIGNvb3JkcykuXG4gICAqL1xuICBzZXRQb2ludGVyKHZlY3Rvcikge1xuICAgIHRoaXMucmF5Y2FzdGVyLnNldEZyb21DYW1lcmEodmVjdG9yLCB0aGlzLmNhbWVyYSk7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWVzaCwgd2hpY2ggaW5jbHVkZXMgcmV0aWNsZSBhbmQvb3IgcmF5LiBUaGlzIG1lc2ggaXMgdGhlbiBhZGRlZFxuICAgKiB0byB0aGUgc2NlbmUuXG4gICAqL1xuICBnZXRSZXRpY2xlUmF5TWVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBvYmplY3QgaW4gdGhlIHNjZW5lLlxuICAgKi9cbiAgZ2V0U2VsZWN0ZWRNZXNoKCkge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgbGV0IG1lc2ggPSBudWxsO1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgIGNvdW50ICs9IDE7XG4gICAgICBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICBpZiAoY291bnQgPiAxKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ01vcmUgdGhhbiBvbmUgbWVzaCBzZWxlY3RlZC4nKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc2g7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYW5kIHNob3dzIHRoZSByZXRpY2xlLlxuICAgKi9cbiAgc2V0UmV0aWNsZVZpc2liaWxpdHkoaXNWaXNpYmxlKSB7XG4gICAgdGhpcy5yZXRpY2xlLnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBvciBkaXNhYmxlcyB0aGUgcmF5Y2FzdGluZyByYXkgd2hpY2ggZ3JhZHVhbGx5IGZhZGVzIG91dCBmcm9tXG4gICAqIHRoZSBvcmlnaW4uXG4gICAqL1xuICBzZXRSYXlWaXNpYmlsaXR5KGlzVmlzaWJsZSkge1xuICAgIHRoaXMucmF5LnZpc2libGUgPSBpc1Zpc2libGU7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhbmQgZGlzYWJsZXMgdGhlIHJheWNhc3Rlci4gRm9yIHRvdWNoLCB3aGVyZSBmaW5nZXIgdXAgbWVhbnMgd2VcbiAgICogc2hvdWxkbid0IGJlIHJheWNhc3RpbmcuXG4gICAqL1xuICBzZXRBY3RpdmUoaXNBY3RpdmUpIHtcbiAgICAvLyBJZiBub3RoaW5nIGNoYW5nZWQsIGRvIG5vdGhpbmcuXG4gICAgaWYgKHRoaXMuaXNBY3RpdmUgPT0gaXNBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVE9ETyhzbXVzKTogU2hvdyB0aGUgcmF5IG9yIHJldGljbGUgYWRqdXN0IGluIHJlc3BvbnNlLlxuICAgIHRoaXMuaXNBY3RpdmUgPSBpc0FjdGl2ZTtcblxuICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgIHRoaXMubW92ZVJldGljbGVfKG51bGwpO1xuICAgICAgZm9yIChsZXQgaWQgaW4gdGhpcy5zZWxlY3RlZCkge1xuICAgICAgICBsZXQgbWVzaCA9IHRoaXMubWVzaGVzW2lkXTtcbiAgICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbaWRdO1xuICAgICAgICB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVJheWNhc3Rlcl8oKSB7XG4gICAgdmFyIHJheSA9IHRoaXMucmF5Y2FzdGVyLnJheTtcblxuICAgIC8vIFBvc2l0aW9uIHRoZSByZXRpY2xlIGF0IGEgZGlzdGFuY2UsIGFzIGNhbGN1bGF0ZWQgZnJvbSB0aGUgb3JpZ2luIGFuZFxuICAgIC8vIGRpcmVjdGlvbi5cbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLnJldGljbGUucG9zaXRpb247XG4gICAgcG9zaXRpb24uY29weShyYXkuZGlyZWN0aW9uKTtcbiAgICBwb3NpdGlvbi5tdWx0aXBseVNjYWxhcih0aGlzLnJldGljbGVEaXN0YW5jZSk7XG4gICAgcG9zaXRpb24uYWRkKHJheS5vcmlnaW4pO1xuXG4gICAgLy8gU2V0IHBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiBvZiB0aGUgcmF5IHNvIHRoYXQgaXQgZ29lcyBmcm9tIG9yaWdpbiB0b1xuICAgIC8vIHJldGljbGUuXG4gICAgdmFyIGRlbHRhID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHJheS5kaXJlY3Rpb24pO1xuICAgIGRlbHRhLm11bHRpcGx5U2NhbGFyKHRoaXMucmV0aWNsZURpc3RhbmNlKTtcbiAgICB0aGlzLnJheS5zY2FsZS55ID0gZGVsdGEubGVuZ3RoKCk7XG4gICAgdmFyIGFycm93ID0gbmV3IFRIUkVFLkFycm93SGVscGVyKHJheS5kaXJlY3Rpb24sIHJheS5vcmlnaW4pO1xuICAgIHRoaXMucmF5LnJvdGF0aW9uLmNvcHkoYXJyb3cucm90YXRpb24pO1xuICAgIHRoaXMucmF5LnBvc2l0aW9uLmFkZFZlY3RvcnMocmF5Lm9yaWdpbiwgZGVsdGEubXVsdGlwbHlTY2FsYXIoMC41KSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgZ2VvbWV0cnkgb2YgdGhlIHJldGljbGUuXG4gICAqL1xuICBjcmVhdGVSZXRpY2xlXygpIHtcbiAgICAvLyBDcmVhdGUgYSBzcGhlcmljYWwgcmV0aWNsZS5cbiAgICBsZXQgaW5uZXJHZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeShJTk5FUl9SQURJVVMsIDMyLCAzMik7XG4gICAgbGV0IGlubmVyTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjlcbiAgICB9KTtcbiAgICBsZXQgaW5uZXIgPSBuZXcgVEhSRUUuTWVzaChpbm5lckdlb21ldHJ5LCBpbm5lck1hdGVyaWFsKTtcblxuICAgIGxldCBvdXRlckdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KE9VVEVSX1JBRElVUywgMzIsIDMyKTtcbiAgICBsZXQgb3V0ZXJNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogMHgzMzMzMzMsXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgIG9wYWNpdHk6IDAuM1xuICAgIH0pO1xuICAgIGxldCBvdXRlciA9IG5ldyBUSFJFRS5NZXNoKG91dGVyR2VvbWV0cnksIG91dGVyTWF0ZXJpYWwpO1xuXG4gICAgbGV0IHJldGljbGUgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgICByZXRpY2xlLmFkZChpbm5lcik7XG4gICAgcmV0aWNsZS5hZGQob3V0ZXIpO1xuICAgIHJldHVybiByZXRpY2xlO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmVzIHRoZSByZXRpY2xlIHRvIGEgcG9zaXRpb24gc28gdGhhdCBpdCdzIGp1c3QgaW4gZnJvbnQgb2YgdGhlIG1lc2ggdGhhdFxuICAgKiBpdCBpbnRlcnNlY3RlZCB3aXRoLlxuICAgKi9cbiAgbW92ZVJldGljbGVfKGludGVyc2VjdGlvbnMpIHtcbiAgICAvLyBJZiBubyBpbnRlcnNlY3Rpb24sIHJldHVybiB0aGUgcmV0aWNsZSB0byB0aGUgZGVmYXVsdCBwb3NpdGlvbi5cbiAgICBsZXQgZGlzdGFuY2UgPSBSRVRJQ0xFX0RJU1RBTkNFO1xuICAgIGlmIChpbnRlcnNlY3Rpb25zKSB7XG4gICAgICAvLyBPdGhlcndpc2UsIGRldGVybWluZSB0aGUgY29ycmVjdCBkaXN0YW5jZS5cbiAgICAgIGxldCBpbnRlciA9IGludGVyc2VjdGlvbnNbMF07XG4gICAgICBkaXN0YW5jZSA9IGludGVyLmRpc3RhbmNlO1xuICAgIH1cblxuICAgIHRoaXMucmV0aWNsZURpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY3JlYXRlUmF5XygpIHtcbiAgICAvLyBDcmVhdGUgYSBjeWxpbmRyaWNhbCByYXkuXG4gICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkN5bGluZGVyR2VvbWV0cnkoUkFZX1JBRElVUywgUkFZX1JBRElVUywgMSwgMzIpO1xuICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICBtYXA6IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoR1JBRElFTlRfSU1BR0UpLFxuICAgICAgLy9jb2xvcjogMHhmZmZmZmYsXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgIG9wYWNpdHk6IDAuM1xuICAgIH0pO1xuICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIG1hdGVyaWFsKTtcblxuICAgIHJldHVybiBtZXNoO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gaXNNb2JpbGUoKSB7XG4gIHZhciBjaGVjayA9IGZhbHNlO1xuICAoZnVuY3Rpb24oYSl7aWYoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWluby9pLnRlc3QoYSl8fC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QoYS5zdWJzdHIoMCw0KSkpY2hlY2sgPSB0cnVlfSkobmF2aWdhdG9yLnVzZXJBZ2VudHx8bmF2aWdhdG9yLnZlbmRvcnx8d2luZG93Lm9wZXJhKTtcbiAgcmV0dXJuIGNoZWNrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmFzZTY0KG1pbWVUeXBlLCBiYXNlNjQpIHtcbiAgcmV0dXJuICdkYXRhOicgKyBtaW1lVHlwZSArICc7YmFzZTY0LCcgKyBiYXNlNjQ7XG59XG4iXX0=
