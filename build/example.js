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
    renderer.setClearColor(scene.fog.color);
    // renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.setSize( window.innerWidth, window.innerHeight );
    // container.appendChild( renderer.domElement );

    // renderer.vr.enabled = true;

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
      this.rayInput.setSize(this.renderer.getSize());
    }

    // TODO: hoe om te gaan met ray move?
    // Eerst click marken en dan rotate met controller pad?, bewegen met ray move?
    // Of: click marken en dan draggen met ray move?
    //  --> ray endpoint verschuiven naar reticle.position

  }, {
    key: 'handleRayDown_',
    value: function handleRayDown_(opt_mesh) {
      this.setAction_(opt_mesh, true);

      var pos = this.rayInput.renderer.reticle.position;
      // console.log('Test: ' + JSON.stringify(this.rayInput.renderer.reticle.position));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4xMC4wL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvd2VidnItYm9pbGVycGxhdGUvYnVpbGQvd2VidnItbWFuYWdlci5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9wYWNrYWdlLmpzb24iLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2Jhc2UuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2NhcmRib2FyZC1kaXN0b3J0ZXIuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2NhcmRib2FyZC11aS5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvY2FyZGJvYXJkLXZyLWRpc3BsYXkuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2RlcHMvd2dsdS1wcmVzZXJ2ZS1zdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvZGV2aWNlLWluZm8uanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2Rpc3BsYXktd3JhcHBlcnMuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2Rpc3RvcnRpb24vZGlzdG9ydGlvbi5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvZHBkYi9kcGRiLmpzb24iLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL2RwZGIvZHBkYi5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvbWF0aC11dGlsLmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy9tb3VzZS1rZXlib2FyZC12ci1kaXNwbGF5LmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy9ub2RlLWVudHJ5LmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy9yb3RhdGUtaW5zdHJ1Y3Rpb25zLmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy9zZW5zb3ItZnVzaW9uL2NvbXBsZW1lbnRhcnktZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy9zZW5zb3ItZnVzaW9uL2Z1c2lvbi1wb3NlLXNlbnNvci5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvc2Vuc29yLWZ1c2lvbi9wb3NlLXByZWRpY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvc2Vuc29yLWZ1c2lvbi9zZW5zb3Itc2FtcGxlLmpzIiwibm9kZV9tb2R1bGVzL3dlYnZyLXBvbHlmaWxsL3NyYy90b3VjaC1wYW5uZXIuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL3V0aWwuanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL3ZpZXdlci1zZWxlY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy93ZWJ2ci1wb2x5ZmlsbC9zcmMvd2FrZWxvY2suanMiLCJub2RlX21vZHVsZXMvd2VidnItcG9seWZpbGwvc3JjL3dlYnZyLXBvbHlmaWxsLmpzIiwic3JjL2V4YW1wbGUvbWFpbi5qcyIsInNyYy9leGFtcGxlL3JlbmRlcmVyLmpzIiwic3JjL29yaWVudGF0aW9uLWFybS1tb2RlbC5qcyIsInNyYy9yYXktY29udHJvbGxlci5qcyIsInNyYy9yYXktaW5wdXQuanMiLCJzcmMvcmF5LWludGVyYWN0aW9uLW1vZGVzLmpzIiwic3JjL3JheS1yZW5kZXJlci5qcyIsInNyYy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Y0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeG9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDai9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoUkE7Ozs7OztBQUVBLElBQUksaUJBQUosQyxDQWpCQTs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLElBQUksa0JBQUo7O0FBRUEsU0FBUyxNQUFULEdBQWtCO0FBQ2hCLGFBQVcsd0JBQVg7O0FBRUEsU0FBTyxnQkFBUCxDQUF3QixRQUF4QixFQUFr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V0FBSyxnQkFBTDtBQUNBO0FBQ0Q7OztpQ0FFWTtBQUNYO0FBQ0EsVUFBSSxXQUFXLElBQUksTUFBTSxnQkFBVixDQUEyQixVQUEzQixFQUF1QyxVQUF2QyxFQUFtRCxDQUFuRCxFQUFzRCxFQUF0RCxDQUFmO0FBQ0EsVUFBSSxXQUFXLElBQUksTUFBTSxpQkFBVixDQUE0QjtBQUN6QyxhQUFLLE1BQU0sVUFBTixDQUFpQixXQUFqQixDQUE2QixjQUE3QixDQURvQztBQUV6QztBQUNBLHFCQUFhLElBSDRCO0FBSXpDLGlCQUFTO0FBSmdDLE9BQTVCLENBQWY7QUFNQSxVQUFJLE9BQU8sSUFBSSxNQUFNLElBQVYsQ0FBZSxRQUFmLEVBQXlCLFFBQXpCLENBQVg7O0FBRUEsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztrQkE5UWtCLFc7Ozs7Ozs7O1FDeEJMLFEsR0FBQSxRO1FBTUEsTSxHQUFBLE07QUFyQmhCOzs7Ozs7Ozs7Ozs7Ozs7QUFlTyxTQUFTLFFBQVQsR0FBb0I7QUFDekIsTUFBSSxRQUFRLEtBQVo7QUFDQSxHQUFDLFVBQVMsQ0FBVCxFQUFXO0FBQUMsUUFBRywyVEFBMlQsSUFBM1QsQ0FBZ1UsQ0FBaFUsS0FBb1UsMGtEQUEwa0QsSUFBMWtELENBQStrRCxFQUFFLE1BQUYsQ0FBUyxDQUFULEVBQVcsQ0FBWCxDQUEva0QsQ0FBdlUsRUFBcTZELFFBQVEsSUFBUjtBQUFhLEdBQS83RCxFQUFpOEQsVUFBVSxTQUFWLElBQXFCLFVBQVUsTUFBL0IsSUFBdUMsT0FBTyxLQUEvK0Q7QUFDQSxTQUFPLEtBQVA7QUFDRDs7QUFFTSxTQUFTLE1BQVQsQ0FBZ0IsUUFBaEIsRUFBMEIsTUFBMUIsRUFBa0M7QUFDdkMsU0FBTyxVQUFVLFFBQVYsR0FBcUIsVUFBckIsR0FBa0MsTUFBekM7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vL1xuLy8gV2Ugc3RvcmUgb3VyIEVFIG9iamVjdHMgaW4gYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gYH5gIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90IG92ZXJyaWRkZW4gb3Jcbi8vIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vIFdlIGFsc28gYXNzdW1lIHRoYXQgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIGF2YWlsYWJsZSB3aGVuIHRoZSBldmVudCBuYW1lXG4vLyBpcyBhbiBFUzYgU3ltYm9sLlxuLy9cbnZhciBwcmVmaXggPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSAhPT0gJ2Z1bmN0aW9uJyA/ICd+JyA6IGZhbHNlO1xuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIEV2ZW50RW1pdHRlciBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBFdmVudCBoYW5kbGVyIHRvIGJlIGNhbGxlZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgQ29udGV4dCBmb3IgZnVuY3Rpb24gZXhlY3V0aW9uLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gT25seSBlbWl0IG9uY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogTWluaW1hbCBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7IC8qIE5vdGhpbmcgdG8gc2V0ICovIH1cblxuLyoqXG4gKiBIb2xkIHRoZSBhc3NpZ25lZCBFdmVudEVtaXR0ZXJzIGJ5IG5hbWUuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNcbiAgICAsIG5hbWVzID0gW11cbiAgICAsIG5hbWU7XG5cbiAgaWYgKCFldmVudHMpIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gZXZlbnRzKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhIGxpc3Qgb2YgYXNzaWduZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnRzIHRoYXQgc2hvdWxkIGJlIGxpc3RlZC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXhpc3RzIFdlIG9ubHkgbmVlZCB0byBrbm93IGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIEVtaXQgYW4gZXZlbnQgdG8gYWxsIHJlZ2lzdGVyZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gSW5kaWNhdGlvbiBpZiB3ZSd2ZSBlbWl0dGVkIGFuIGV2ZW50LlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIG5ldyBFdmVudExpc3RlbmVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYW4gRXZlbnRMaXN0ZW5lciB0aGF0J3Mgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2Ugd2FudCB0byByZW1vdmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgdGhhdCB3ZSBuZWVkIHRvIGZpbmQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIGxpc3RlbmVycyBtYXRjaGluZyB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25jZSBsaXN0ZW5lcnMuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBldmVudHMgPSBbXTtcblxuICBpZiAoZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgICBpZiAoXG4gICAgICAgICAgIGxpc3RlbmVycy5mbiAhPT0gZm5cbiAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVycy5vbmNlKVxuICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnMuY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKVxuICAgICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgICApIHtcbiAgICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAvL1xuICBpZiAoZXZlbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgb3Igb25seSB0aGUgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2FudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG5cbiAgaWYgKGV2ZW50KSBkZWxldGUgdGhpcy5fZXZlbnRzW3ByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRdO1xuICBlbHNlIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsIihmdW5jdGlvbihmKXtpZih0eXBlb2YgZXhwb3J0cz09PVwib2JqZWN0XCImJnR5cGVvZiBtb2R1bGUhPT1cInVuZGVmaW5lZFwiKXttb2R1bGUuZXhwb3J0cz1mKCl9ZWxzZSBpZih0eXBlb2YgZGVmaW5lPT09XCJmdW5jdGlvblwiJiZkZWZpbmUuYW1kKXtkZWZpbmUoW10sZil9ZWxzZXt2YXIgZztpZih0eXBlb2Ygd2luZG93IT09XCJ1bmRlZmluZWRcIil7Zz13aW5kb3d9ZWxzZSBpZih0eXBlb2YgZ2xvYmFsIT09XCJ1bmRlZmluZWRcIil7Zz1nbG9iYWx9ZWxzZSBpZih0eXBlb2Ygc2VsZiE9PVwidW5kZWZpbmVkXCIpe2c9c2VsZn1lbHNle2c9dGhpc31nLldlYlZSTWFuYWdlciA9IGYoKX19KShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBFbWl0dGVyID0gX2RlcmVxXygnLi9lbWl0dGVyLmpzJyk7XG52YXIgTW9kZXMgPSBfZGVyZXFfKCcuL21vZGVzLmpzJyk7XG52YXIgVXRpbCA9IF9kZXJlcV8oJy4vdXRpbC5qcycpO1xuXG4vKipcbiAqIEV2ZXJ5dGhpbmcgaGF2aW5nIHRvIGRvIHdpdGggdGhlIFdlYlZSIGJ1dHRvbi5cbiAqIEVtaXRzIGEgJ2NsaWNrJyBldmVudCB3aGVuIGl0J3MgY2xpY2tlZC5cbiAqL1xuZnVuY3Rpb24gQnV0dG9uTWFuYWdlcihvcHRfcm9vdCkge1xuICB2YXIgcm9vdCA9IG9wdF9yb290IHx8IGRvY3VtZW50LmJvZHk7XG4gIHRoaXMubG9hZEljb25zXygpO1xuXG4gIC8vIE1ha2UgdGhlIGZ1bGxzY3JlZW4gYnV0dG9uLlxuICB2YXIgZnNCdXR0b24gPSB0aGlzLmNyZWF0ZUJ1dHRvbigpO1xuICBmc0J1dHRvbi5zcmMgPSB0aGlzLklDT05TLmZ1bGxzY3JlZW47XG4gIGZzQnV0dG9uLnRpdGxlID0gJ0Z1bGxzY3JlZW4gbW9kZSc7XG4gIHZhciBzID0gZnNCdXR0b24uc3R5bGU7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5yaWdodCA9IDA7XG4gIGZzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5jcmVhdGVDbGlja0hhbmRsZXJfKCdmcycpKTtcbiAgcm9vdC5hcHBlbmRDaGlsZChmc0J1dHRvbik7XG4gIHRoaXMuZnNCdXR0b24gPSBmc0J1dHRvbjtcblxuICAvLyBNYWtlIHRoZSBWUiBidXR0b24uXG4gIHZhciB2ckJ1dHRvbiA9IHRoaXMuY3JlYXRlQnV0dG9uKCk7XG4gIHZyQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuY2FyZGJvYXJkO1xuICB2ckJ1dHRvbi50aXRsZSA9ICdWaXJ0dWFsIHJlYWxpdHkgbW9kZSc7XG4gIHZhciBzID0gdnJCdXR0b24uc3R5bGU7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5yaWdodCA9ICc0OHB4JztcbiAgdnJCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNyZWF0ZUNsaWNrSGFuZGxlcl8oJ3ZyJykpO1xuICByb290LmFwcGVuZENoaWxkKHZyQnV0dG9uKTtcbiAgdGhpcy52ckJ1dHRvbiA9IHZyQnV0dG9uO1xuXG4gIHRoaXMuaXNWaXNpYmxlID0gdHJ1ZTtcblxufVxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUgPSBuZXcgRW1pdHRlcigpO1xuXG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZS5jcmVhdGVCdXR0b24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBidXR0b24uY2xhc3NOYW1lID0gJ3dlYnZyLWJ1dHRvbic7XG4gIHZhciBzID0gYnV0dG9uLnN0eWxlO1xuICBzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgcy53aWR0aCA9ICcyNHB4J1xuICBzLmhlaWdodCA9ICcyNHB4JztcbiAgcy5iYWNrZ3JvdW5kU2l6ZSA9ICdjb3Zlcic7XG4gIHMuYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgcy5ib3JkZXIgPSAwO1xuICBzLnVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gIHMud2Via2l0VXNlclNlbGVjdCA9ICdub25lJztcbiAgcy5Nb3pVc2VyU2VsZWN0ID0gJ25vbmUnO1xuICBzLmN1cnNvciA9ICdwb2ludGVyJztcbiAgcy5wYWRkaW5nID0gJzEycHgnO1xuICBzLnpJbmRleCA9IDE7XG4gIHMuZGlzcGxheSA9ICdub25lJztcbiAgcy5ib3hTaXppbmcgPSAnY29udGVudC1ib3gnO1xuXG4gIC8vIFByZXZlbnQgYnV0dG9uIGZyb20gYmVpbmcgc2VsZWN0ZWQgYW5kIGRyYWdnZWQuXG4gIGJ1dHRvbi5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIC8vIFN0eWxlIGl0IG9uIGhvdmVyLlxuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICBzLmZpbHRlciA9IHMud2Via2l0RmlsdGVyID0gJ2Ryb3Atc2hhZG93KDAgMCA1cHggcmdiYSgyNTUsMjU1LDI1NSwxKSknO1xuICB9KTtcbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgcy5maWx0ZXIgPSBzLndlYmtpdEZpbHRlciA9ICcnO1xuICB9KTtcbiAgcmV0dXJuIGJ1dHRvbjtcbn07XG5cbkJ1dHRvbk1hbmFnZXIucHJvdG90eXBlLnNldE1vZGUgPSBmdW5jdGlvbihtb2RlLCBpc1ZSQ29tcGF0aWJsZSkge1xuICBpc1ZSQ29tcGF0aWJsZSA9IGlzVlJDb21wYXRpYmxlIHx8IFdlYlZSQ29uZmlnLkZPUkNFX0VOQUJMRV9WUjtcbiAgaWYgKCF0aGlzLmlzVmlzaWJsZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBzd2l0Y2ggKG1vZGUpIHtcbiAgICBjYXNlIE1vZGVzLk5PUk1BTDpcbiAgICAgIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB0aGlzLmZzQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuZnVsbHNjcmVlbjtcbiAgICAgIHRoaXMudnJCdXR0b24uc3R5bGUuZGlzcGxheSA9IChpc1ZSQ29tcGF0aWJsZSA/ICdibG9jaycgOiAnbm9uZScpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgdGhpcy5mc0J1dHRvbi5zcmMgPSB0aGlzLklDT05TLmV4aXRGdWxsc2NyZWVuO1xuICAgICAgdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5WUjpcbiAgICAgIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMudnJCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gSGFjayBmb3IgU2FmYXJpIE1hYy9pT1MgdG8gZm9yY2UgcmVsYXlvdXQgKHN2Zy1zcGVjaWZpYyBpc3N1ZSlcbiAgLy8gaHR0cDovL2dvby5nbC9oamdSNnJcbiAgdmFyIG9sZFZhbHVlID0gdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5O1xuICB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJztcbiAgdGhpcy5mc0J1dHRvbi5vZmZzZXRIZWlnaHQ7XG4gIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9IG9sZFZhbHVlO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUuc2V0VmlzaWJpbGl0eSA9IGZ1bmN0aW9uKGlzVmlzaWJsZSkge1xuICB0aGlzLmlzVmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gaXNWaXNpYmxlID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gaXNWaXNpYmxlID8gJ2Jsb2NrJyA6ICdub25lJztcbn07XG5cbkJ1dHRvbk1hbmFnZXIucHJvdG90eXBlLmNyZWF0ZUNsaWNrSGFuZGxlcl8gPSBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmVtaXQoZXZlbnROYW1lKTtcbiAgfS5iaW5kKHRoaXMpO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUubG9hZEljb25zXyA9IGZ1bmN0aW9uKCkge1xuICAvLyBQcmVsb2FkIHNvbWUgaGFyZC1jb2RlZCBTVkcuXG4gIHRoaXMuSUNPTlMgPSB7fTtcbiAgdGhpcy5JQ09OUy5jYXJkYm9hcmQgPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NakF1TnpRZ05rZ3pMakl4UXpJdU5UVWdOaUF5SURZdU5UY2dNaUEzTGpJNGRqRXdMalEwWXpBZ0xqY3VOVFVnTVM0eU9DQXhMakl6SURFdU1qaG9OQzQzT1dNdU5USWdNQ0F1T1RZdExqTXpJREV1TVRRdExqYzViREV1TkMwekxqUTRZeTR5TXkwdU5Ua3VOemt0TVM0d01TQXhMalEwTFRFdU1ERnpNUzR5TVM0ME1pQXhMalExSURFdU1ERnNNUzR6T1NBekxqUTRZeTR4T1M0ME5pNDJNeTQzT1NBeExqRXhMamM1YURRdU56bGpMamN4SURBZ01TNHlOaTB1TlRjZ01TNHlOaTB4TGpJNFZqY3VNamhqTUMwdU55MHVOVFV0TVM0eU9DMHhMakkyTFRFdU1qaDZUVGN1TlNBeE5DNDJNbU10TVM0eE55QXdMVEl1TVRNdExqazFMVEl1TVRNdE1pNHhNaUF3TFRFdU1UY3VPVFl0TWk0eE15QXlMakV6TFRJdU1UTWdNUzR4T0NBd0lESXVNVEl1T1RZZ01pNHhNaUF5TGpFemN5MHVPVFVnTWk0eE1pMHlMakV5SURJdU1USjZiVGtnTUdNdE1TNHhOeUF3TFRJdU1UTXRMamsxTFRJdU1UTXRNaTR4TWlBd0xURXVNVGN1T1RZdE1pNHhNeUF5TGpFekxUSXVNVE56TWk0eE1pNDVOaUF5TGpFeUlESXVNVE10TGprMUlESXVNVEl0TWk0eE1pQXlMakV5ZWlJdlBnb2dJQ0FnUEhCaGRHZ2dabWxzYkQwaWJtOXVaU0lnWkQwaVRUQWdNR2d5TkhZeU5FZ3dWakI2SWk4K0Nqd3ZjM1puUGdvPScpO1xuICB0aGlzLklDT05TLmZ1bGxzY3JlZW4gPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NQ0F3YURJMGRqSTBTREI2SWlCbWFXeHNQU0p1YjI1bElpOCtDaUFnSUNBOGNHRjBhQ0JrUFNKTk55QXhORWcxZGpWb05YWXRNa2czZGkwemVtMHRNaTAwYURKV04yZ3pWalZJTlhZMWVtMHhNaUEzYUMwemRqSm9OWFl0TldndE1uWXplazB4TkNBMWRqSm9NM1l6YURKV05XZ3ROWG9pTHo0S1BDOXpkbWMrQ2c9PScpO1xuICB0aGlzLklDT05TLmV4aXRGdWxsc2NyZWVuID0gVXRpbC5iYXNlNjQoJ2ltYWdlL3N2Zyt4bWwnLCAnUEhOMlp5QjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIZHBaSFJvUFNJeU5IQjRJaUJvWldsbmFIUTlJakkwY0hnaUlIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSWdabWxzYkQwaUkwWkdSa1pHUmlJK0NpQWdJQ0E4Y0dGMGFDQmtQU0pOTUNBd2FESTBkakkwU0RCNklpQm1hV3hzUFNKdWIyNWxJaTgrQ2lBZ0lDQThjR0YwYUNCa1BTSk5OU0F4Tm1nemRqTm9Nbll0TlVnMWRqSjZiVE10T0VnMWRqSm9OVlkxU0RoMk0zcHROaUF4TVdneWRpMHphRE4yTFRKb0xUVjJOWHB0TWkweE1WWTFhQzB5ZGpWb05WWTRhQzB6ZWlJdlBnbzhMM04yWno0SycpO1xuICB0aGlzLklDT05TLnNldHRpbmdzID0gVXRpbC5iYXNlNjQoJ2ltYWdlL3N2Zyt4bWwnLCAnUEhOMlp5QjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIZHBaSFJvUFNJeU5IQjRJaUJvWldsbmFIUTlJakkwY0hnaUlIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSWdabWxzYkQwaUkwWkdSa1pHUmlJK0NpQWdJQ0E4Y0dGMGFDQmtQU0pOTUNBd2FESTBkakkwU0RCNklpQm1hV3hzUFNKdWIyNWxJaTgrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NVGt1TkRNZ01USXVPVGhqTGpBMExTNHpNaTR3TnkwdU5qUXVNRGN0TGprNGN5MHVNRE10TGpZMkxTNHdOeTB1T1Roc01pNHhNUzB4TGpZMVl5NHhPUzB1TVRVdU1qUXRMalF5TGpFeUxTNDJOR3d0TWkwekxqUTJZeTB1TVRJdExqSXlMUzR6T1MwdU15MHVOakV0TGpJeWJDMHlMalE1SURGakxTNDFNaTB1TkMweExqQTRMUzQzTXkweExqWTVMUzQ1T0d3dExqTTRMVEl1TmpWRE1UUXVORFlnTWk0eE9DQXhOQzR5TlNBeUlERTBJREpvTFRSakxTNHlOU0F3TFM0ME5pNHhPQzB1TkRrdU5ESnNMUzR6T0NBeUxqWTFZeTB1TmpFdU1qVXRNUzR4Tnk0MU9TMHhMalk1TGprNGJDMHlMalE1TFRGakxTNHlNeTB1TURrdExqUTVJREF0TGpZeExqSXliQzB5SURNdU5EWmpMUzR4TXk0eU1pMHVNRGN1TkRrdU1USXVOalJzTWk0eE1TQXhMalkxWXkwdU1EUXVNekl0TGpBM0xqWTFMUzR3Tnk0NU9ITXVNRE11TmpZdU1EY3VPVGhzTFRJdU1URWdNUzQyTldNdExqRTVMakUxTFM0eU5DNDBNaTB1TVRJdU5qUnNNaUF6TGpRMll5NHhNaTR5TWk0ek9TNHpMall4TGpJeWJESXVORGt0TVdNdU5USXVOQ0F4TGpBNExqY3pJREV1TmprdU9UaHNMak00SURJdU5qVmpMakF6TGpJMExqSTBMalF5TGpRNUxqUXlhRFJqTGpJMUlEQWdMalEyTFM0eE9DNDBPUzB1TkRKc0xqTTRMVEl1TmpWakxqWXhMUzR5TlNBeExqRTNMUzQxT1NBeExqWTVMUzQ1T0d3eUxqUTVJREZqTGpJekxqQTVMalE1SURBZ0xqWXhMUzR5TW13eUxUTXVORFpqTGpFeUxTNHlNaTR3TnkwdU5Ea3RMakV5TFM0Mk5Hd3RNaTR4TVMweExqWTFlazB4TWlBeE5TNDFZeTB4TGpreklEQXRNeTQxTFRFdU5UY3RNeTQxTFRNdU5YTXhMalUzTFRNdU5TQXpMalV0TXk0MUlETXVOU0F4TGpVM0lETXVOU0F6TGpVdE1TNDFOeUF6TGpVdE15NDFJRE11TlhvaUx6NEtQQzl6ZG1jK0NnPT0nKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uTWFuYWdlcjtcblxufSx7XCIuL2VtaXR0ZXIuanNcIjoyLFwiLi9tb2Rlcy5qc1wiOjMsXCIuL3V0aWwuanNcIjo0fV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5mdW5jdGlvbiBFbWl0dGVyKCkge1xuICB0aGlzLmNhbGxiYWNrcyA9IHt9O1xufVxuXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnROYW1lKSB7XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdO1xuICBpZiAoIWNhbGxiYWNrcykge1xuICAgIC8vY29uc29sZS5sb2coJ05vIHZhbGlkIGNhbGxiYWNrIHNwZWNpZmllZC4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gIC8vIEVsaW1pbmF0ZSB0aGUgZmlyc3QgcGFyYW0gKHRoZSBjYWxsYmFjaykuXG4gIGFyZ3Muc2hpZnQoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cbn07XG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICBpZiAoZXZlbnROYW1lIGluIHRoaXMuY2FsbGJhY2tzKSB7XG4gICAgdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdID0gW2NhbGxiYWNrXTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xuXG59LHt9XSwzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBNb2RlcyA9IHtcbiAgVU5LTk9XTjogMCxcbiAgLy8gTm90IGZ1bGxzY3JlZW4sIGp1c3QgdHJhY2tpbmcuXG4gIE5PUk1BTDogMSxcbiAgLy8gTWFnaWMgd2luZG93IGltbWVyc2l2ZSBtb2RlLlxuICBNQUdJQ19XSU5ET1c6IDIsXG4gIC8vIEZ1bGwgc2NyZWVuIHNwbGl0IHNjcmVlbiBWUiBtb2RlLlxuICBWUjogMyxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZXM7XG5cbn0se31dLDQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSB7fTtcblxuVXRpbC5iYXNlNjQgPSBmdW5jdGlvbihtaW1lVHlwZSwgYmFzZTY0KSB7XG4gIHJldHVybiAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgYmFzZTY0O1xufTtcblxuVXRpbC5pc01vYmlsZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2hlY2sgPSBmYWxzZTtcbiAgKGZ1bmN0aW9uKGEpe2lmKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcmlzfGtpbmRsZXxsZ2UgfG1hZW1vfG1pZHB8bW1wfG1vYmlsZS4rZmlyZWZveHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyBjZXx4ZGF8eGlpbm8vaS50ZXN0KGEpfHwvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KGEuc3Vic3RyKDAsNCkpKWNoZWNrID0gdHJ1ZX0pKG5hdmlnYXRvci51c2VyQWdlbnR8fG5hdmlnYXRvci52ZW5kb3J8fHdpbmRvdy5vcGVyYSk7XG4gIHJldHVybiBjaGVjaztcbn07XG5cblV0aWwuaXNGaXJlZm94ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAvZmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59O1xuXG5VdGlsLmlzSU9TID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAvKGlQYWR8aVBob25lfGlQb2QpL2cudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn07XG5cblV0aWwuaXNJRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93LnNlbGYgIT09IHdpbmRvdy50b3A7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTtcblxuVXRpbC5hcHBlbmRRdWVyeVBhcmFtZXRlciA9IGZ1bmN0aW9uKHVybCwga2V5LCB2YWx1ZSkge1xuICAvLyBEZXRlcm1pbmUgZGVsaW1pdGVyIGJhc2VkIG9uIGlmIHRoZSBVUkwgYWxyZWFkeSBHRVQgcGFyYW1ldGVycyBpbiBpdC5cbiAgdmFyIGRlbGltaXRlciA9ICh1cmwuaW5kZXhPZignPycpIDwgMCA/ICc/JyA6ICcmJyk7XG4gIHVybCArPSBkZWxpbWl0ZXIgKyBrZXkgKyAnPScgKyB2YWx1ZTtcbiAgcmV0dXJuIHVybDtcbn07XG5cbi8vIEZyb20gaHR0cDovL2dvby5nbC80V1gzdGdcblV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXS8sIFwiXFxcXFtcIikucmVwbGFjZSgvW1xcXV0vLCBcIlxcXFxdXCIpO1xuICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiW1xcXFw/Jl1cIiArIG5hbWUgKyBcIj0oW14mI10qKVwiKSxcbiAgICAgIHJlc3VsdHMgPSByZWdleC5leGVjKGxvY2F0aW9uLnNlYXJjaCk7XG4gIHJldHVybiByZXN1bHRzID09PSBudWxsID8gXCJcIiA6IGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzFdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xufTtcblxuVXRpbC5pc0xhbmRzY2FwZU1vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh3aW5kb3cub3JpZW50YXRpb24gPT0gOTAgfHwgd2luZG93Lm9yaWVudGF0aW9uID09IC05MCk7XG59O1xuXG5VdGlsLmdldFNjcmVlbldpZHRoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLm1heCh3aW5kb3cuc2NyZWVuLndpZHRoLCB3aW5kb3cuc2NyZWVuLmhlaWdodCkgKlxuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW87XG59O1xuXG5VdGlsLmdldFNjcmVlbkhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5taW4od2luZG93LnNjcmVlbi53aWR0aCwgd2luZG93LnNjcmVlbi5oZWlnaHQpICpcbiAgICAgIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBVdGlsO1xuXG59LHt9XSw1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBCdXR0b25NYW5hZ2VyID0gX2RlcmVxXygnLi9idXR0b24tbWFuYWdlci5qcycpO1xudmFyIEVtaXR0ZXIgPSBfZGVyZXFfKCcuL2VtaXR0ZXIuanMnKTtcbnZhciBNb2RlcyA9IF9kZXJlcV8oJy4vbW9kZXMuanMnKTtcbnZhciBVdGlsID0gX2RlcmVxXygnLi91dGlsLmpzJyk7XG5cbi8qKlxuICogSGVscGVyIGZvciBnZXR0aW5nIGluIGFuZCBvdXQgb2YgVlIgbW9kZS5cbiAqL1xuZnVuY3Rpb24gV2ViVlJNYW5hZ2VyKHJlbmRlcmVyLCBlZmZlY3QsIHBhcmFtcykge1xuICB0aGlzLnBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcblxuICB0aGlzLm1vZGUgPSBNb2Rlcy5VTktOT1dOO1xuXG4gIC8vIFNldCBvcHRpb24gdG8gaGlkZSB0aGUgYnV0dG9uLlxuICB0aGlzLmhpZGVCdXR0b24gPSB0aGlzLnBhcmFtcy5oaWRlQnV0dG9uIHx8IGZhbHNlO1xuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGUgRk9WIHNob3VsZCBiZSBkaXN0b3J0ZWQgb3IgdW4tZGlzdG9ydGVkLiBCeSBkZWZhdWx0LCBpdFxuICAvLyBzaG91bGQgYmUgZGlzdG9ydGVkLCBidXQgaW4gdGhlIGNhc2Ugb2YgdmVydGV4IHNoYWRlciBiYXNlZCBkaXN0b3J0aW9uLFxuICAvLyBlbnN1cmUgdGhhdCB3ZSB1c2UgdW5kaXN0b3J0ZWQgcGFyYW1ldGVycy5cbiAgdGhpcy5wcmVkaXN0b3J0ZWQgPSAhIXRoaXMucGFyYW1zLnByZWRpc3RvcnRlZDtcblxuICAvLyBTYXZlIHRoZSBUSFJFRS5qcyByZW5kZXJlciBhbmQgZWZmZWN0IGZvciBsYXRlci5cbiAgdGhpcy5yZW5kZXJlciA9IHJlbmRlcmVyO1xuICB0aGlzLmVmZmVjdCA9IGVmZmVjdDtcbiAgdmFyIHBvbHlmaWxsV3JhcHBlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy53ZWJ2ci1wb2x5ZmlsbC1mdWxsc2NyZWVuLXdyYXBwZXInKTtcbiAgdGhpcy5idXR0b24gPSBuZXcgQnV0dG9uTWFuYWdlcihwb2x5ZmlsbFdyYXBwZXIpO1xuXG4gIHRoaXMuaXNGdWxsc2NyZWVuRGlzYWJsZWQgPSAhIVV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIoJ25vX2Z1bGxzY3JlZW4nKTtcbiAgdGhpcy5zdGFydE1vZGUgPSBNb2Rlcy5OT1JNQUw7XG4gIHZhciBzdGFydE1vZGVQYXJhbSA9IHBhcnNlSW50KFV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIoJ3N0YXJ0X21vZGUnKSk7XG4gIGlmICghaXNOYU4oc3RhcnRNb2RlUGFyYW0pKSB7XG4gICAgdGhpcy5zdGFydE1vZGUgPSBzdGFydE1vZGVQYXJhbTtcbiAgfVxuXG4gIGlmICh0aGlzLmhpZGVCdXR0b24pIHtcbiAgICB0aGlzLmJ1dHRvbi5zZXRWaXNpYmlsaXR5KGZhbHNlKTtcbiAgfVxuXG4gIC8vIENoZWNrIGlmIHRoZSBicm93c2VyIGlzIGNvbXBhdGlibGUgd2l0aCBXZWJWUi5cbiAgdGhpcy5nZXREZXZpY2VCeVR5cGVfKFZSRGlzcGxheSkudGhlbihmdW5jdGlvbihobWQpIHtcbiAgICB0aGlzLmhtZCA9IGhtZDtcblxuICAgIC8vIE9ubHkgZW5hYmxlIFZSIG1vZGUgaWYgdGhlcmUncyBhIFZSIGRldmljZSBhdHRhY2hlZCBvciB3ZSBhcmUgcnVubmluZyB0aGVcbiAgICAvLyBwb2x5ZmlsbCBvbiBtb2JpbGUuXG4gICAgaWYgKCF0aGlzLmlzVlJDb21wYXRpYmxlT3ZlcnJpZGUpIHtcbiAgICAgIHRoaXMuaXNWUkNvbXBhdGlibGUgPSAgIWhtZC5pc1BvbHlmaWxsZWQgfHwgVXRpbC5pc01vYmlsZSgpO1xuICAgIH1cblxuICAgIHN3aXRjaCAodGhpcy5zdGFydE1vZGUpIHtcbiAgICAgIGNhc2UgTW9kZXMuTUFHSUNfV0lORE9XOlxuICAgICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk1BR0lDX1dJTkRPVyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBNb2Rlcy5WUjpcbiAgICAgICAgdGhpcy5lbnRlclZSTW9kZV8oKTtcbiAgICAgICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5WUik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5OT1JNQUwpO1xuICAgIH1cblxuICAgIHRoaXMuZW1pdCgnaW5pdGlhbGl6ZWQnKTtcbiAgfS5iaW5kKHRoaXMpKTtcblxuICAvLyBIb29rIHVwIGJ1dHRvbiBsaXN0ZW5lcnMuXG4gIHRoaXMuYnV0dG9uLm9uKCdmcycsIHRoaXMub25GU0NsaWNrXy5iaW5kKHRoaXMpKTtcbiAgdGhpcy5idXR0b24ub24oJ3ZyJywgdGhpcy5vblZSQ2xpY2tfLmJpbmQodGhpcykpO1xuXG4gIC8vIEJpbmQgdG8gZnVsbHNjcmVlbiBldmVudHMuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UnLFxuICAgICAgdGhpcy5vbkZ1bGxzY3JlZW5DaGFuZ2VfLmJpbmQodGhpcykpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJyxcbiAgICAgIHRoaXMub25GdWxsc2NyZWVuQ2hhbmdlXy5iaW5kKHRoaXMpKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbXNmdWxsc2NyZWVuY2hhbmdlJyxcbiAgICAgIHRoaXMub25GdWxsc2NyZWVuQ2hhbmdlXy5iaW5kKHRoaXMpKTtcblxuICAvLyBCaW5kIHRvIFZSKiBzcGVjaWZpYyBldmVudHMuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd2cmRpc3BsYXlwcmVzZW50Y2hhbmdlJyxcbiAgICAgIHRoaXMub25WUkRpc3BsYXlQcmVzZW50Q2hhbmdlXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheWRldmljZXBhcmFtc2NoYW5nZScsXG4gICAgICB0aGlzLm9uVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXy5iaW5kKHRoaXMpKTtcbn1cblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZSA9IG5ldyBFbWl0dGVyKCk7XG5cbi8vIEV4cG9zZSB0aGVzZSB2YWx1ZXMgZXh0ZXJuYWxseS5cbldlYlZSTWFuYWdlci5Nb2RlcyA9IE1vZGVzO1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKHNjZW5lLCBjYW1lcmEsIHRpbWVzdGFtcCkge1xuICAvLyBTY2VuZSBtYXkgYmUgYW4gYXJyYXkgb2YgdHdvIHNjZW5lcywgb25lIGZvciBlYWNoIGV5ZS5cbiAgaWYgKHNjZW5lIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICB0aGlzLmVmZmVjdC5yZW5kZXIoc2NlbmVbMF0sIGNhbWVyYSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5lZmZlY3QucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnNldFZSQ29tcGF0aWJsZU92ZXJyaWRlID0gZnVuY3Rpb24oaXNWUkNvbXBhdGlibGUpIHtcbiAgdGhpcy5pc1ZSQ29tcGF0aWJsZSA9IGlzVlJDb21wYXRpYmxlO1xuICB0aGlzLmlzVlJDb21wYXRpYmxlT3ZlcnJpZGUgPSB0cnVlO1xuXG4gIC8vIERvbid0IGFjdHVhbGx5IGNoYW5nZSBtb2RlcywganVzdCB1cGRhdGUgdGhlIGJ1dHRvbnMuXG4gIHRoaXMuYnV0dG9uLnNldE1vZGUodGhpcy5tb2RlLCB0aGlzLmlzVlJDb21wYXRpYmxlKTtcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuc2V0RnVsbHNjcmVlbkNhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdGhpcy5mdWxsc2NyZWVuQ2FsbGJhY2sgPSBjYWxsYmFjaztcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuc2V0VlJDYWxsYmFjayA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHRoaXMudnJDYWxsYmFjayA9IGNhbGxiYWNrO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRFeGl0RnVsbHNjcmVlbkNhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdGhpcy5leGl0RnVsbHNjcmVlbkNhbGxiYWNrID0gY2FsbGJhY2s7XG59XG5cbi8qKlxuICogUHJvbWlzZSByZXR1cm5zIHRydWUgaWYgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIEhNRCBkZXZpY2UgYXZhaWxhYmxlLlxuICovXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLmdldERldmljZUJ5VHlwZV8gPSBmdW5jdGlvbih0eXBlKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cygpLnRoZW4oZnVuY3Rpb24oZGlzcGxheXMpIHtcbiAgICAgIC8vIFByb21pc2Ugc3VjY2VlZHMsIGJ1dCBjaGVjayBpZiB0aGVyZSBhcmUgYW55IGRpc3BsYXlzIGFjdHVhbGx5LlxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkaXNwbGF5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZGlzcGxheXNbaV0gaW5zdGFuY2VvZiB0eXBlKSB7XG4gICAgICAgICAgcmVzb2x2ZShkaXNwbGF5c1tpXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAvLyBObyBkaXNwbGF5cyBhcmUgZm91bmQuXG4gICAgICByZXNvbHZlKG51bGwpO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbi8qKlxuICogSGVscGVyIGZvciBlbnRlcmluZyBWUiBtb2RlLlxuICovXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLmVudGVyVlJNb2RlXyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmhtZC5yZXF1ZXN0UHJlc2VudChbe1xuICAgIHNvdXJjZTogdGhpcy5yZW5kZXJlci5kb21FbGVtZW50LFxuICAgIHByZWRpc3RvcnRlZDogdGhpcy5wcmVkaXN0b3J0ZWRcbiAgfV0pO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRNb2RlXyA9IGZ1bmN0aW9uKG1vZGUpIHtcbiAgdmFyIG9sZE1vZGUgPSB0aGlzLm1vZGU7XG4gIGlmIChtb2RlID09IHRoaXMubW9kZSkge1xuICAgIGNvbnNvbGUud2FybignTm90IGNoYW5naW5nIG1vZGVzLCBhbHJlYWR5IGluICVzJywgbW9kZSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIGNvbnNvbGUubG9nKCdNb2RlIGNoYW5nZTogJXMgPT4gJXMnLCB0aGlzLm1vZGUsIG1vZGUpO1xuICB0aGlzLm1vZGUgPSBtb2RlO1xuICB0aGlzLmJ1dHRvbi5zZXRNb2RlKG1vZGUsIHRoaXMuaXNWUkNvbXBhdGlibGUpO1xuXG4gIC8vIEVtaXQgYW4gZXZlbnQgaW5kaWNhdGluZyB0aGUgbW9kZSBjaGFuZ2VkLlxuICB0aGlzLmVtaXQoJ21vZGVjaGFuZ2UnLCBtb2RlLCBvbGRNb2RlKTtcbn07XG5cbi8qKlxuICogTWFpbiBidXR0b24gd2FzIGNsaWNrZWQuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUub25GU0NsaWNrXyA9IGZ1bmN0aW9uKCkge1xuICBzd2l0Y2ggKHRoaXMubW9kZSkge1xuICAgIGNhc2UgTW9kZXMuTk9STUFMOlxuICAgICAgLy8gVE9ETzogUmVtb3ZlIHRoaXMgaGFjayBpZi93aGVuIGlPUyBnZXRzIHJlYWwgZnVsbHNjcmVlbiBtb2RlLlxuICAgICAgLy8gSWYgdGhpcyBpcyBhbiBpZnJhbWUgb24gaU9TLCBicmVhayBvdXQgYW5kIG9wZW4gaW4gbm9fZnVsbHNjcmVlbiBtb2RlLlxuICAgICAgaWYgKFV0aWwuaXNJT1MoKSAmJiBVdGlsLmlzSUZyYW1lKCkpIHtcbiAgICAgICAgaWYgKHRoaXMuZnVsbHNjcmVlbkNhbGxiYWNrKSB7XG4gICAgICAgICAgdGhpcy5mdWxsc2NyZWVuQ2FsbGJhY2soKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICAgICAgdXJsID0gVXRpbC5hcHBlbmRRdWVyeVBhcmFtZXRlcih1cmwsICdub19mdWxsc2NyZWVuJywgJ3RydWUnKTtcbiAgICAgICAgICB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKHVybCwgJ3N0YXJ0X21vZGUnLCBNb2Rlcy5NQUdJQ19XSU5ET1cpO1xuICAgICAgICAgIHRvcC5sb2NhdGlvbi5ocmVmID0gdXJsO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5NQUdJQ19XSU5ET1cpO1xuICAgICAgdGhpcy5yZXF1ZXN0RnVsbHNjcmVlbl8oKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgTW9kZXMuTUFHSUNfV0lORE9XOlxuICAgICAgaWYgKHRoaXMuaXNGdWxsc2NyZWVuRGlzYWJsZWQpIHtcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5leGl0RnVsbHNjcmVlbkNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuZXhpdEZ1bGxzY3JlZW5DYWxsYmFjaygpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5OT1JNQUwpO1xuICAgICAgdGhpcy5leGl0RnVsbHNjcmVlbl8oKTtcbiAgICAgIGJyZWFrO1xuICB9XG59O1xuXG4vKipcbiAqIFRoZSBWUiBidXR0b24gd2FzIGNsaWNrZWQuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUub25WUkNsaWNrXyA9IGZ1bmN0aW9uKCkge1xuICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBoYWNrIHdoZW4gaU9TIGhhcyBmdWxsc2NyZWVuIG1vZGUuXG4gIC8vIElmIHRoaXMgaXMgYW4gaWZyYW1lIG9uIGlPUywgYnJlYWsgb3V0IGFuZCBvcGVuIGluIG5vX2Z1bGxzY3JlZW4gbW9kZS5cbiAgaWYgKHRoaXMubW9kZSA9PSBNb2Rlcy5OT1JNQUwgJiYgVXRpbC5pc0lPUygpICYmIFV0aWwuaXNJRnJhbWUoKSkge1xuICAgIGlmICh0aGlzLnZyQ2FsbGJhY2spIHtcbiAgICAgIHRoaXMudnJDYWxsYmFjaygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKHVybCwgJ25vX2Z1bGxzY3JlZW4nLCAndHJ1ZScpO1xuICAgICAgdXJsID0gVXRpbC5hcHBlbmRRdWVyeVBhcmFtZXRlcih1cmwsICdzdGFydF9tb2RlJywgTW9kZXMuVlIpO1xuICAgICAgdG9wLmxvY2F0aW9uLmhyZWYgPSB1cmw7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIHRoaXMuZW50ZXJWUk1vZGVfKCk7XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnJlcXVlc3RGdWxsc2NyZWVuXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuYm9keTtcbiAgLy92YXIgY2FudmFzID0gdGhpcy5yZW5kZXJlci5kb21FbGVtZW50O1xuICBpZiAoY2FudmFzLnJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgY2FudmFzLnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoY2FudmFzLm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgY2FudmFzLm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoY2FudmFzLndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgY2FudmFzLndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoY2FudmFzLm1zUmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBjYW52YXMubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLmV4aXRGdWxsc2NyZWVuXyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC5tc0V4aXRGdWxsc2NyZWVuKCk7XG4gIH1cbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUub25WUkRpc3BsYXlQcmVzZW50Q2hhbmdlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgY29uc29sZS5sb2coJ29uVlJEaXNwbGF5UHJlc2VudENoYW5nZV8nLCBlKTtcbiAgaWYgKHRoaXMuaG1kLmlzUHJlc2VudGluZykge1xuICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuVlIpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuTk9STUFMKTtcbiAgfVxufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vblZSRGlzcGxheURldmljZVBhcmFtc0NoYW5nZV8gPSBmdW5jdGlvbihlKSB7XG4gIGNvbnNvbGUubG9nKCdvblZSRGlzcGxheURldmljZVBhcmFtc0NoYW5nZV8nLCBlKTtcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUub25GdWxsc2NyZWVuQ2hhbmdlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgLy8gSWYgd2UgbGVhdmUgZnVsbC1zY3JlZW4sIGdvIGJhY2sgdG8gbm9ybWFsIG1vZGUuXG4gIGlmIChkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCA9PT0gbnVsbCB8fFxuICAgICAgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVsZW1lbnQgPT09IG51bGwpIHtcbiAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViVlJNYW5hZ2VyO1xuXG59LHtcIi4vYnV0dG9uLW1hbmFnZXIuanNcIjoxLFwiLi9lbWl0dGVyLmpzXCI6MixcIi4vbW9kZXMuanNcIjozLFwiLi91dGlsLmpzXCI6NH1dfSx7fSxbNV0pKDUpXG59KTsiLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwibmFtZVwiOiBcIndlYnZyLXBvbHlmaWxsXCIsXG4gIFwidmVyc2lvblwiOiBcIjAuOS4zNlwiLFxuICBcImhvbWVwYWdlXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZXZyL3dlYnZyLXBvbHlmaWxsXCIsXG4gIFwiYXV0aG9yc1wiOiBbXG4gICAgXCJCb3JpcyBTbXVzIDxib3Jpc0BzbXVzLmNvbT5cIixcbiAgICBcIkJyYW5kb24gSm9uZXMgPHRvamlyb0BnbWFpbC5jb20+XCIsXG4gICAgXCJKb3JkYW4gU2FudGVsbCA8am9yZGFuQGpzYW50ZWxsLmNvbT5cIlxuICBdLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiVXNlIFdlYlZSIHRvZGF5LCBvbiBtb2JpbGUgb3IgZGVza3RvcCwgd2l0aG91dCByZXF1aXJpbmcgYSBzcGVjaWFsIGJyb3dzZXIgYnVpbGQuXCIsXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcImNoYWlcIjogXCJeMy41LjBcIixcbiAgICBcImpzZG9tXCI6IFwiXjkuMTIuMFwiLFxuICAgIFwibW9jaGFcIjogXCJeMy4yLjBcIixcbiAgICBcInNlbXZlclwiOiBcIl41LjMuMFwiLFxuICAgIFwid2VicGFja1wiOiBcIl4yLjYuMVwiLFxuICAgIFwid2VicGFjay1kZXYtc2VydmVyXCI6IFwiXjIuNC41XCJcbiAgfSxcbiAgXCJtYWluXCI6IFwic3JjL25vZGUtZW50cnlcIixcbiAgXCJrZXl3b3Jkc1wiOiBbXG4gICAgXCJ2clwiLFxuICAgIFwid2VidnJcIlxuICBdLFxuICBcImxpY2Vuc2VcIjogXCJBcGFjaGUtMi4wXCIsXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJzdGFydFwiOiBcIm5wbSBydW4gd2F0Y2hcIixcbiAgICBcIndhdGNoXCI6IFwid2VicGFjay1kZXYtc2VydmVyXCIsXG4gICAgXCJidWlsZFwiOiBcIndlYnBhY2tcIixcbiAgICBcInRlc3RcIjogXCJtb2NoYVwiXG4gIH0sXG4gIFwicmVwb3NpdG9yeVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiZ2l0XCIsXG4gICAgXCJ1cmxcIjogXCJnaXQraHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZXZyL3dlYnZyLXBvbHlmaWxsLmdpdFwiXG4gIH0sXG4gIFwiYnVnc1wiOiB7XG4gICAgXCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xldnIvd2VidnItcG9seWZpbGwvaXNzdWVzXCJcbiAgfSxcbiAgXCJnaXRIZWFkXCI6IFwiNWY4NjkzYTkwNTNlZTFkZWE0MjVlOTZkMTRjZDFmMmJlZjdhMjg0Y1wiLFxuICBcIl9pZFwiOiBcIndlYnZyLXBvbHlmaWxsQDAuOS4zNlwiLFxuICBcIl9zaGFzdW1cIjogXCI0YjFlMTU1NjY2N2U4MDRiZWIwYzhjMmU2N2ZkZmNiYTMzNzFlOGM2XCIsXG4gIFwiX2Zyb21cIjogXCJ3ZWJ2ci1wb2x5ZmlsbEA+PTAuOS4xNSA8MC4xMC4wXCIsXG4gIFwiX25wbVZlcnNpb25cIjogXCIyLjE1LjExXCIsXG4gIFwiX25vZGVWZXJzaW9uXCI6IFwiNC44LjRcIixcbiAgXCJfbnBtVXNlclwiOiB7XG4gICAgXCJuYW1lXCI6IFwianNhbnRlbGxcIixcbiAgICBcImVtYWlsXCI6IFwianNhbnRlbGxAZ21haWwuY29tXCJcbiAgfSxcbiAgXCJkaXN0XCI6IHtcbiAgICBcInNoYXN1bVwiOiBcIjRiMWUxNTU2NjY3ZTgwNGJlYjBjOGMyZTY3ZmRmY2JhMzM3MWU4YzZcIixcbiAgICBcInRhcmJhbGxcIjogXCJodHRwczovL3JlZ2lzdHJ5Lm5wbWpzLm9yZy93ZWJ2ci1wb2x5ZmlsbC8tL3dlYnZyLXBvbHlmaWxsLTAuOS4zNi50Z3pcIlxuICB9LFxuICBcIm1haW50YWluZXJzXCI6IFtcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJqc2FudGVsbFwiLFxuICAgICAgXCJlbWFpbFwiOiBcImpzYW50ZWxsQGdtYWlsLmNvbVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJ0b2ppXCIsXG4gICAgICBcImVtYWlsXCI6IFwidG9qaXJvQGdtYWlsLmNvbVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJzbXVzXCIsXG4gICAgICBcImVtYWlsXCI6IFwiYm9yaXNAc211cy5jb21cIlxuICAgIH1cbiAgXSxcbiAgXCJfbnBtT3BlcmF0aW9uYWxJbnRlcm5hbFwiOiB7XG4gICAgXCJob3N0XCI6IFwiczM6Ly9ucG0tcmVnaXN0cnktcGFja2FnZXNcIixcbiAgICBcInRtcFwiOiBcInRtcC93ZWJ2ci1wb2x5ZmlsbC0wLjkuMzYudGd6XzE0OTk4OTI5NzIzNzhfMC4xMDI2NzA4NzAwMjI4NDgyNVwiXG4gIH0sXG4gIFwiZGlyZWN0b3JpZXNcIjoge30sXG4gIFwiX3Jlc29sdmVkXCI6IFwiaHR0cHM6Ly9yZWdpc3RyeS5ucG1qcy5vcmcvd2VidnItcG9seWZpbGwvLS93ZWJ2ci1wb2x5ZmlsbC0wLjkuMzYudGd6XCIsXG4gIFwicmVhZG1lXCI6IFwiRVJST1I6IE5vIFJFQURNRSBkYXRhIGZvdW5kIVwiXG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xudmFyIFdha2VMb2NrID0gcmVxdWlyZSgnLi93YWtlbG9jay5qcycpO1xuXG4vLyBTdGFydCBhdCBhIGhpZ2hlciBudW1iZXIgdG8gcmVkdWNlIGNoYW5jZSBvZiBjb25mbGljdC5cbnZhciBuZXh0RGlzcGxheUlkID0gMTAwMDtcbnZhciBoYXNTaG93RGVwcmVjYXRpb25XYXJuaW5nID0gZmFsc2U7XG5cbnZhciBkZWZhdWx0TGVmdEJvdW5kcyA9IFswLCAwLCAwLjUsIDFdO1xudmFyIGRlZmF1bHRSaWdodEJvdW5kcyA9IFswLjUsIDAsIDAuNSwgMV07XG5cbi8qKlxuICogVGhlIGJhc2UgY2xhc3MgZm9yIGFsbCBWUiBmcmFtZSBkYXRhLlxuICovXG5cbmZ1bmN0aW9uIFZSRnJhbWVEYXRhKCkge1xuICB0aGlzLmxlZnRQcm9qZWN0aW9uTWF0cml4ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gIHRoaXMubGVmdFZpZXdNYXRyaXggPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcbiAgdGhpcy5yaWdodFByb2plY3Rpb25NYXRyaXggPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcbiAgdGhpcy5yaWdodFZpZXdNYXRyaXggPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcbiAgdGhpcy5wb3NlID0gbnVsbDtcbn07XG5cbi8qKlxuICogVGhlIGJhc2UgY2xhc3MgZm9yIGFsbCBWUiBkaXNwbGF5cy5cbiAqL1xuZnVuY3Rpb24gVlJEaXNwbGF5KCkge1xuICB0aGlzLmlzUG9seWZpbGxlZCA9IHRydWU7XG4gIHRoaXMuZGlzcGxheUlkID0gbmV4dERpc3BsYXlJZCsrO1xuICB0aGlzLmRpc3BsYXlOYW1lID0gJ3dlYnZyLXBvbHlmaWxsIGRpc3BsYXlOYW1lJztcblxuICB0aGlzLmRlcHRoTmVhciA9IDAuMDE7XG4gIHRoaXMuZGVwdGhGYXIgPSAxMDAwMC4wO1xuXG4gIHRoaXMuaXNDb25uZWN0ZWQgPSB0cnVlO1xuICB0aGlzLmlzUHJlc2VudGluZyA9IGZhbHNlO1xuICB0aGlzLmNhcGFiaWxpdGllcyA9IHtcbiAgICBoYXNQb3NpdGlvbjogZmFsc2UsXG4gICAgaGFzT3JpZW50YXRpb246IGZhbHNlLFxuICAgIGhhc0V4dGVybmFsRGlzcGxheTogZmFsc2UsXG4gICAgY2FuUHJlc2VudDogZmFsc2UsXG4gICAgbWF4TGF5ZXJzOiAxXG4gIH07XG4gIHRoaXMuc3RhZ2VQYXJhbWV0ZXJzID0gbnVsbDtcblxuICAvLyBcIlByaXZhdGVcIiBtZW1iZXJzLlxuICB0aGlzLndhaXRpbmdGb3JQcmVzZW50XyA9IGZhbHNlO1xuICB0aGlzLmxheWVyXyA9IG51bGw7XG5cbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRDYWNoZWRTdHlsZV8gPSBudWxsO1xuXG4gIHRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXyA9IG51bGw7XG5cbiAgdGhpcy53YWtlbG9ja18gPSBuZXcgV2FrZUxvY2soKTtcbn1cblxuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRGcmFtZURhdGEgPSBmdW5jdGlvbihmcmFtZURhdGEpIHtcbiAgLy8gVE9ETzogVGVjaG5pY2FsbHkgdGhpcyBzaG91bGQgcmV0YWluIGl0J3MgdmFsdWUgZm9yIHRoZSBkdXJhdGlvbiBvZiBhIGZyYW1lXG4gIC8vIGJ1dCBJIGRvdWJ0IHRoYXQncyBwcmFjdGljYWwgdG8gZG8gaW4gamF2YXNjcmlwdC5cbiAgcmV0dXJuIFV0aWwuZnJhbWVEYXRhRnJvbVBvc2UoZnJhbWVEYXRhLCB0aGlzLmdldFBvc2UoKSwgdGhpcyk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmdldFBvc2UgPSBmdW5jdGlvbigpIHtcbiAgLy8gVE9ETzogVGVjaG5pY2FsbHkgdGhpcyBzaG91bGQgcmV0YWluIGl0J3MgdmFsdWUgZm9yIHRoZSBkdXJhdGlvbiBvZiBhIGZyYW1lXG4gIC8vIGJ1dCBJIGRvdWJ0IHRoYXQncyBwcmFjdGljYWwgdG8gZG8gaW4gamF2YXNjcmlwdC5cbiAgcmV0dXJuIHRoaXMuZ2V0SW1tZWRpYXRlUG9zZSgpO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICByZXR1cm4gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjayk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oaWQpIHtcbiAgcmV0dXJuIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShpZCk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLndyYXBGb3JGdWxsc2NyZWVuID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAvLyBEb24ndCB3cmFwIGluIGlPUy5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG4gIGlmICghdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8pIHtcbiAgICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHZhciBjc3NQcm9wZXJ0aWVzID0gW1xuICAgICAgJ2hlaWdodDogJyArIE1hdGgubWluKHNjcmVlbi5oZWlnaHQsIHNjcmVlbi53aWR0aCkgKyAncHggIWltcG9ydGFudCcsXG4gICAgICAndG9wOiAwICFpbXBvcnRhbnQnLFxuICAgICAgJ2xlZnQ6IDAgIWltcG9ydGFudCcsXG4gICAgICAncmlnaHQ6IDAgIWltcG9ydGFudCcsXG4gICAgICAnYm9yZGVyOiAwJyxcbiAgICAgICdtYXJnaW46IDAnLFxuICAgICAgJ3BhZGRpbmc6IDAnLFxuICAgICAgJ3otaW5kZXg6IDk5OTk5OSAhaW1wb3J0YW50JyxcbiAgICAgICdwb3NpdGlvbjogZml4ZWQnLFxuICAgIF07XG4gICAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8uc2V0QXR0cmlidXRlKCdzdHlsZScsIGNzc1Byb3BlcnRpZXMuam9pbignOyAnKSArICc7Jyk7XG4gICAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8uY2xhc3NMaXN0LmFkZCgnd2VidnItcG9seWZpbGwtZnVsbHNjcmVlbi13cmFwcGVyJyk7XG4gIH1cblxuICBpZiAodGhpcy5mdWxsc2NyZWVuRWxlbWVudF8gPT0gZWxlbWVudCkge1xuICAgIHJldHVybiB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXztcbiAgfVxuXG4gIC8vIFJlbW92ZSBhbnkgcHJldmlvdXNseSBhcHBsaWVkIHdyYXBwZXJzXG4gIHRoaXMucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIoKTtcblxuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XyA9IGVsZW1lbnQ7XG4gIHZhciBwYXJlbnQgPSB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Xy5wYXJlbnRFbGVtZW50O1xuICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLCB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Xyk7XG4gIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Xyk7XG4gIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLmluc2VydEJlZm9yZSh0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XywgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8uZmlyc3RDaGlsZCk7XG4gIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRDYWNoZWRTdHlsZV8gPSB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Xy5nZXRBdHRyaWJ1dGUoJ3N0eWxlJyk7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBmdW5jdGlvbiBhcHBseUZ1bGxzY3JlZW5FbGVtZW50U3R5bGUoKSB7XG4gICAgaWYgKCFzZWxmLmZ1bGxzY3JlZW5FbGVtZW50Xykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBjc3NQcm9wZXJ0aWVzID0gW1xuICAgICAgJ3Bvc2l0aW9uOiBhYnNvbHV0ZScsXG4gICAgICAndG9wOiAwJyxcbiAgICAgICdsZWZ0OiAwJyxcbiAgICAgICd3aWR0aDogJyArIE1hdGgubWF4KHNjcmVlbi53aWR0aCwgc2NyZWVuLmhlaWdodCkgKyAncHgnLFxuICAgICAgJ2hlaWdodDogJyArIE1hdGgubWluKHNjcmVlbi5oZWlnaHQsIHNjcmVlbi53aWR0aCkgKyAncHgnLFxuICAgICAgJ2JvcmRlcjogMCcsXG4gICAgICAnbWFyZ2luOiAwJyxcbiAgICAgICdwYWRkaW5nOiAwJyxcbiAgICBdO1xuICAgIHNlbGYuZnVsbHNjcmVlbkVsZW1lbnRfLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBjc3NQcm9wZXJ0aWVzLmpvaW4oJzsgJykgKyAnOycpO1xuICB9XG5cbiAgYXBwbHlGdWxsc2NyZWVuRWxlbWVudFN0eWxlKCk7XG5cbiAgcmV0dXJuIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5yZW1vdmVGdWxsc2NyZWVuV3JhcHBlciA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGVsZW1lbnQgPSB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XztcbiAgaWYgKHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRDYWNoZWRTdHlsZV8pIHtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Q2FjaGVkU3R5bGVfKTtcbiAgfSBlbHNlIHtcbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKTtcbiAgfVxuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRDYWNoZWRTdHlsZV8gPSBudWxsO1xuXG4gIHZhciBwYXJlbnQgPSB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5wYXJlbnRFbGVtZW50O1xuICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5yZW1vdmVDaGlsZChlbGVtZW50KTtcbiAgcGFyZW50Lmluc2VydEJlZm9yZShlbGVtZW50LCB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXyk7XG4gIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXyk7XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnJlcXVlc3RQcmVzZW50ID0gZnVuY3Rpb24obGF5ZXJzKSB7XG4gIHZhciB3YXNQcmVzZW50aW5nID0gdGhpcy5pc1ByZXNlbnRpbmc7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAoIShsYXllcnMgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICBpZiAoIWhhc1Nob3dEZXByZWNhdGlvbldhcm5pbmcpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIlVzaW5nIGEgZGVwcmVjYXRlZCBmb3JtIG9mIHJlcXVlc3RQcmVzZW50LiBTaG91bGQgcGFzcyBpbiBhbiBhcnJheSBvZiBWUkxheWVycy5cIik7XG4gICAgICBoYXNTaG93RGVwcmVjYXRpb25XYXJuaW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgbGF5ZXJzID0gW2xheWVyc107XG4gIH1cblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaWYgKCFzZWxmLmNhcGFiaWxpdGllcy5jYW5QcmVzZW50KSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdWUkRpc3BsYXkgaXMgbm90IGNhcGFibGUgb2YgcHJlc2VudGluZy4nKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGxheWVycy5sZW5ndGggPT0gMCB8fCBsYXllcnMubGVuZ3RoID4gc2VsZi5jYXBhYmlsaXRpZXMubWF4TGF5ZXJzKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIG51bWJlciBvZiBsYXllcnMuJykpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpbmNvbWluZ0xheWVyID0gbGF5ZXJzWzBdO1xuICAgIGlmICghaW5jb21pbmdMYXllci5zb3VyY2UpIHtcbiAgICAgIC8qXG4gICAgICB0b2RvOiBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGJlaGF2aW9yIGlmIHRoZSBzb3VyY2UgaXMgbm90IHByb3ZpZGVkLlxuICAgICAgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93M2Mvd2VidnIvaXNzdWVzLzU4XG4gICAgICAqL1xuICAgICAgcmVzb2x2ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBsZWZ0Qm91bmRzID0gaW5jb21pbmdMYXllci5sZWZ0Qm91bmRzIHx8IGRlZmF1bHRMZWZ0Qm91bmRzO1xuICAgIHZhciByaWdodEJvdW5kcyA9IGluY29taW5nTGF5ZXIucmlnaHRCb3VuZHMgfHwgZGVmYXVsdFJpZ2h0Qm91bmRzO1xuICAgIGlmICh3YXNQcmVzZW50aW5nKSB7XG4gICAgICAvLyBBbHJlYWR5IHByZXNlbnRpbmcsIGp1c3QgY2hhbmdpbmcgY29uZmlndXJhdGlvblxuICAgICAgdmFyIGxheWVyID0gc2VsZi5sYXllcl87XG4gICAgICBpZiAobGF5ZXIuc291cmNlICE9PSBpbmNvbWluZ0xheWVyLnNvdXJjZSkge1xuICAgICAgICBsYXllci5zb3VyY2UgPSBpbmNvbWluZ0xheWVyLnNvdXJjZTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgbGF5ZXIubGVmdEJvdW5kc1tpXSA9IGxlZnRCb3VuZHNbaV07XG4gICAgICAgIGxheWVyLnJpZ2h0Qm91bmRzW2ldID0gcmlnaHRCb3VuZHNbaV07XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXYXMgbm90IGFscmVhZHkgcHJlc2VudGluZy5cbiAgICBzZWxmLmxheWVyXyA9IHtcbiAgICAgIHByZWRpc3RvcnRlZDogaW5jb21pbmdMYXllci5wcmVkaXN0b3J0ZWQsXG4gICAgICBzb3VyY2U6IGluY29taW5nTGF5ZXIuc291cmNlLFxuICAgICAgbGVmdEJvdW5kczogbGVmdEJvdW5kcy5zbGljZSgwKSxcbiAgICAgIHJpZ2h0Qm91bmRzOiByaWdodEJvdW5kcy5zbGljZSgwKVxuICAgIH07XG5cbiAgICBzZWxmLndhaXRpbmdGb3JQcmVzZW50XyA9IGZhbHNlO1xuICAgIGlmIChzZWxmLmxheWVyXyAmJiBzZWxmLmxheWVyXy5zb3VyY2UpIHtcbiAgICAgIHZhciBmdWxsc2NyZWVuRWxlbWVudCA9IHNlbGYud3JhcEZvckZ1bGxzY3JlZW4oc2VsZi5sYXllcl8uc291cmNlKTtcblxuICAgICAgdmFyIG9uRnVsbHNjcmVlbkNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYWN0dWFsRnVsbHNjcmVlbkVsZW1lbnQgPSBVdGlsLmdldEZ1bGxzY3JlZW5FbGVtZW50KCk7XG5cbiAgICAgICAgc2VsZi5pc1ByZXNlbnRpbmcgPSAoZnVsbHNjcmVlbkVsZW1lbnQgPT09IGFjdHVhbEZ1bGxzY3JlZW5FbGVtZW50KTtcbiAgICAgICAgaWYgKHNlbGYuaXNQcmVzZW50aW5nKSB7XG4gICAgICAgICAgaWYgKHNjcmVlbi5vcmllbnRhdGlvbiAmJiBzY3JlZW4ub3JpZW50YXRpb24ubG9jaykge1xuICAgICAgICAgICAgc2NyZWVuLm9yaWVudGF0aW9uLmxvY2soJ2xhbmRzY2FwZS1wcmltYXJ5JykuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdzY3JlZW4ub3JpZW50YXRpb24ubG9jaygpIGZhaWxlZCBkdWUgdG8nLCBlcnJvci5tZXNzYWdlKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlbGYud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gICAgICAgICAgc2VsZi5iZWdpblByZXNlbnRfKCk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChzY3JlZW4ub3JpZW50YXRpb24gJiYgc2NyZWVuLm9yaWVudGF0aW9uLnVubG9jaykge1xuICAgICAgICAgICAgc2NyZWVuLm9yaWVudGF0aW9uLnVubG9jaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG4gICAgICAgICAgc2VsZi53YWtlbG9ja18ucmVsZWFzZSgpO1xuICAgICAgICAgIHNlbGYuZW5kUHJlc2VudF8oKTtcbiAgICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5MaXN0ZW5lcnNfKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5maXJlVlJEaXNwbGF5UHJlc2VudENoYW5nZV8oKTtcbiAgICAgIH1cbiAgICAgIHZhciBvbkZ1bGxzY3JlZW5FcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXNlbGYud2FpdGluZ0ZvclByZXNlbnRfKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5yZW1vdmVGdWxsc2NyZWVuV3JhcHBlcigpO1xuICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5MaXN0ZW5lcnNfKCk7XG5cbiAgICAgICAgc2VsZi53YWtlbG9ja18ucmVsZWFzZSgpO1xuICAgICAgICBzZWxmLndhaXRpbmdGb3JQcmVzZW50XyA9IGZhbHNlO1xuICAgICAgICBzZWxmLmlzUHJlc2VudGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1VuYWJsZSB0byBwcmVzZW50LicpKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5hZGRGdWxsc2NyZWVuTGlzdGVuZXJzXyhmdWxsc2NyZWVuRWxlbWVudCxcbiAgICAgICAgICBvbkZ1bGxzY3JlZW5DaGFuZ2UsIG9uRnVsbHNjcmVlbkVycm9yKTtcblxuICAgICAgaWYgKFV0aWwucmVxdWVzdEZ1bGxzY3JlZW4oZnVsbHNjcmVlbkVsZW1lbnQpKSB7XG4gICAgICAgIHNlbGYud2FrZWxvY2tfLnJlcXVlc3QoKTtcbiAgICAgICAgc2VsZi53YWl0aW5nRm9yUHJlc2VudF8gPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChVdGlsLmlzSU9TKCkgfHwgVXRpbC5pc1dlYlZpZXdBbmRyb2lkKCkpIHtcbiAgICAgICAgLy8gKnNpZ2gqIEp1c3QgZmFrZSBpdC5cbiAgICAgICAgc2VsZi53YWtlbG9ja18ucmVxdWVzdCgpO1xuICAgICAgICBzZWxmLmlzUHJlc2VudGluZyA9IHRydWU7XG4gICAgICAgIHNlbGYuYmVnaW5QcmVzZW50XygpO1xuICAgICAgICBzZWxmLmZpcmVWUkRpc3BsYXlQcmVzZW50Q2hhbmdlXygpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzZWxmLndhaXRpbmdGb3JQcmVzZW50XyAmJiAhVXRpbC5pc0lPUygpKSB7XG4gICAgICBVdGlsLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdVbmFibGUgdG8gcHJlc2VudC4nKSk7XG4gICAgfVxuICB9KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZXhpdFByZXNlbnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHdhc1ByZXNlbnRpbmcgPSB0aGlzLmlzUHJlc2VudGluZztcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLmlzUHJlc2VudGluZyA9IGZhbHNlO1xuICB0aGlzLmxheWVyXyA9IG51bGw7XG4gIHRoaXMud2FrZWxvY2tfLnJlbGVhc2UoKTtcblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaWYgKHdhc1ByZXNlbnRpbmcpIHtcbiAgICAgIGlmICghVXRpbC5leGl0RnVsbHNjcmVlbigpICYmIFV0aWwuaXNJT1MoKSkge1xuICAgICAgICBzZWxmLmVuZFByZXNlbnRfKCk7XG4gICAgICAgIHNlbGYuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChVdGlsLmlzV2ViVmlld0FuZHJvaWQoKSkge1xuICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG4gICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18oKTtcbiAgICAgICAgc2VsZi5lbmRQcmVzZW50XygpO1xuICAgICAgICBzZWxmLmZpcmVWUkRpc3BsYXlQcmVzZW50Q2hhbmdlXygpO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1dhcyBub3QgcHJlc2VudGluZyB0byBWUkRpc3BsYXkuJykpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmdldExheWVycyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5sYXllcl8pIHtcbiAgICByZXR1cm4gW3RoaXMubGF5ZXJfXTtcbiAgfVxuICByZXR1cm4gW107XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmZpcmVWUkRpc3BsYXlQcmVzZW50Q2hhbmdlXyA9IGZ1bmN0aW9uKCkge1xuICAvLyBJbXBvcnRhbnQ6IHVuZm9ydHVuYXRlbHkgd2UgY2Fubm90IGhhdmUgZnVsbCBzcGVjIGNvbXBsaWFuY2UgaGVyZS5cbiAgLy8gQ3VzdG9tRXZlbnQgY3VzdG9tIGZpZWxkcyBhbGwgZ28gdW5kZXIgZS5kZXRhaWwgKHNvIHRoZSBWUkRpc3BsYXkgZW5kcyB1cFxuICAvLyBiZWluZyBlLmRldGFpbC5kaXNwbGF5LCBpbnN0ZWFkIG9mIGUuZGlzcGxheSBhcyBwZXIgV2ViVlIgc3BlYykuXG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCgndnJkaXNwbGF5cHJlc2VudGNoYW5nZScsIHtkZXRhaWw6IHtkaXNwbGF5OiB0aGlzfX0pO1xuICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmZpcmVWUkRpc3BsYXlDb25uZWN0XyA9IGZ1bmN0aW9uKCkge1xuICAvLyBJbXBvcnRhbnQ6IHVuZm9ydHVuYXRlbHkgd2UgY2Fubm90IGhhdmUgZnVsbCBzcGVjIGNvbXBsaWFuY2UgaGVyZS5cbiAgLy8gQ3VzdG9tRXZlbnQgY3VzdG9tIGZpZWxkcyBhbGwgZ28gdW5kZXIgZS5kZXRhaWwgKHNvIHRoZSBWUkRpc3BsYXkgZW5kcyB1cFxuICAvLyBiZWluZyBlLmRldGFpbC5kaXNwbGF5LCBpbnN0ZWFkIG9mIGUuZGlzcGxheSBhcyBwZXIgV2ViVlIgc3BlYykuXG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCgndnJkaXNwbGF5Y29ubmVjdCcsIHtkZXRhaWw6IHtkaXNwbGF5OiB0aGlzfX0pO1xuICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmFkZEZ1bGxzY3JlZW5MaXN0ZW5lcnNfID0gZnVuY3Rpb24oZWxlbWVudCwgY2hhbmdlSGFuZGxlciwgZXJyb3JIYW5kbGVyKSB7XG4gIHRoaXMucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18oKTtcblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBlbGVtZW50O1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IGNoYW5nZUhhbmRsZXI7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBlcnJvckhhbmRsZXI7XG5cbiAgaWYgKGNoYW5nZUhhbmRsZXIpIHtcbiAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbmFibGVkKSB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5tb3pGdWxsU2NyZWVuRW5hYmxlZCkge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbXNmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlcnJvckhhbmRsZXIpIHtcbiAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbmFibGVkKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbXNmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICB9XG4gIH1cbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18gPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8pXG4gICAgcmV0dXJuO1xuXG4gIHZhciBlbGVtZW50ID0gdGhpcy5mdWxsc2NyZWVuRXZlbnRUYXJnZXRfO1xuXG4gIGlmICh0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXykge1xuICAgIHZhciBjaGFuZ2VIYW5kbGVyID0gdGhpcy5mdWxsc2NyZWVuQ2hhbmdlSGFuZGxlcl87XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbXNmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICB9XG5cbiAgaWYgKHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8pIHtcbiAgICB2YXIgZXJyb3JIYW5kbGVyID0gdGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXztcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICB9XG5cbiAgdGhpcy5mdWxsc2NyZWVuRXZlbnRUYXJnZXRfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuQ2hhbmdlSGFuZGxlcl8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5FcnJvckhhbmRsZXJfID0gbnVsbDtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuYmVnaW5QcmVzZW50XyA9IGZ1bmN0aW9uKCkge1xuICAvLyBPdmVycmlkZSB0byBhZGQgY3VzdG9tIGJlaGF2aW9yIHdoZW4gcHJlc2VudGF0aW9uIGJlZ2lucy5cbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZW5kUHJlc2VudF8gPSBmdW5jdGlvbigpIHtcbiAgLy8gT3ZlcnJpZGUgdG8gYWRkIGN1c3RvbSBiZWhhdmlvciB3aGVuIHByZXNlbnRhdGlvbiBlbmRzLlxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5zdWJtaXRGcmFtZSA9IGZ1bmN0aW9uKHBvc2UpIHtcbiAgLy8gT3ZlcnJpZGUgdG8gYWRkIGN1c3RvbSBiZWhhdmlvciBmb3IgZnJhbWUgc3VibWlzc2lvbi5cbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0RXllUGFyYW1ldGVycyA9IGZ1bmN0aW9uKHdoaWNoRXllKSB7XG4gIC8vIE92ZXJyaWRlIHRvIHJldHVybiBhY2N1cmF0ZSBleWUgcGFyYW1ldGVycyBpZiBjYW5QcmVzZW50IGlzIHRydWUuXG4gIHJldHVybiBudWxsO1xufTtcblxuLypcbiAqIERlcHJlY2F0ZWQgY2xhc3Nlc1xuICovXG5cbi8qKlxuICogVGhlIGJhc2UgY2xhc3MgZm9yIGFsbCBWUiBkZXZpY2VzLiAoRGVwcmVjYXRlZClcbiAqL1xuZnVuY3Rpb24gVlJEZXZpY2UoKSB7XG4gIHRoaXMuaXNQb2x5ZmlsbGVkID0gdHJ1ZTtcbiAgdGhpcy5oYXJkd2FyZVVuaXRJZCA9ICd3ZWJ2ci1wb2x5ZmlsbCBoYXJkd2FyZVVuaXRJZCc7XG4gIHRoaXMuZGV2aWNlSWQgPSAnd2VidnItcG9seWZpbGwgZGV2aWNlSWQnO1xuICB0aGlzLmRldmljZU5hbWUgPSAnd2VidnItcG9seWZpbGwgZGV2aWNlTmFtZSc7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgY2xhc3MgZm9yIGFsbCBWUiBITUQgZGV2aWNlcy4gKERlcHJlY2F0ZWQpXG4gKi9cbmZ1bmN0aW9uIEhNRFZSRGV2aWNlKCkge1xufVxuSE1EVlJEZXZpY2UucHJvdG90eXBlID0gbmV3IFZSRGV2aWNlKCk7XG5cbi8qKlxuICogVGhlIGJhc2UgY2xhc3MgZm9yIGFsbCBWUiBwb3NpdGlvbiBzZW5zb3IgZGV2aWNlcy4gKERlcHJlY2F0ZWQpXG4gKi9cbmZ1bmN0aW9uIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UoKSB7XG59XG5Qb3NpdGlvblNlbnNvclZSRGV2aWNlLnByb3RvdHlwZSA9IG5ldyBWUkRldmljZSgpO1xuXG5tb2R1bGUuZXhwb3J0cy5WUkZyYW1lRGF0YSA9IFZSRnJhbWVEYXRhO1xubW9kdWxlLmV4cG9ydHMuVlJEaXNwbGF5ID0gVlJEaXNwbGF5O1xubW9kdWxlLmV4cG9ydHMuVlJEZXZpY2UgPSBWUkRldmljZTtcbm1vZHVsZS5leHBvcnRzLkhNRFZSRGV2aWNlID0gSE1EVlJEZXZpY2U7XG5tb2R1bGUuZXhwb3J0cy5Qb3NpdGlvblNlbnNvclZSRGV2aWNlID0gUG9zaXRpb25TZW5zb3JWUkRldmljZTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBDYXJkYm9hcmRVSSA9IHJlcXVpcmUoJy4vY2FyZGJvYXJkLXVpLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xudmFyIFdHTFVQcmVzZXJ2ZUdMU3RhdGUgPSByZXF1aXJlKCcuL2RlcHMvd2dsdS1wcmVzZXJ2ZS1zdGF0ZS5qcycpO1xuXG52YXIgZGlzdG9ydGlvblZTID0gW1xuICAnYXR0cmlidXRlIHZlYzIgcG9zaXRpb247JyxcbiAgJ2F0dHJpYnV0ZSB2ZWMzIHRleENvb3JkOycsXG5cbiAgJ3ZhcnlpbmcgdmVjMiB2VGV4Q29vcmQ7JyxcblxuICAndW5pZm9ybSB2ZWM0IHZpZXdwb3J0T2Zmc2V0U2NhbGVbMl07JyxcblxuICAndm9pZCBtYWluKCkgeycsXG4gICcgIHZlYzQgdmlld3BvcnQgPSB2aWV3cG9ydE9mZnNldFNjYWxlW2ludCh0ZXhDb29yZC56KV07JyxcbiAgJyAgdlRleENvb3JkID0gKHRleENvb3JkLnh5ICogdmlld3BvcnQuencpICsgdmlld3BvcnQueHk7JyxcbiAgJyAgZ2xfUG9zaXRpb24gPSB2ZWM0KCBwb3NpdGlvbiwgMS4wLCAxLjAgKTsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgZGlzdG9ydGlvbkZTID0gW1xuICAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7JyxcbiAgJ3VuaWZvcm0gc2FtcGxlcjJEIGRpZmZ1c2U7JyxcblxuICAndmFyeWluZyB2ZWMyIHZUZXhDb29yZDsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKGRpZmZ1c2UsIHZUZXhDb29yZCk7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxuLyoqXG4gKiBBIG1lc2gtYmFzZWQgZGlzdG9ydGVyLlxuICovXG5mdW5jdGlvbiBDYXJkYm9hcmREaXN0b3J0ZXIoZ2wpIHtcbiAgdGhpcy5nbCA9IGdsO1xuICB0aGlzLmN0eEF0dHJpYnMgPSBnbC5nZXRDb250ZXh0QXR0cmlidXRlcygpO1xuXG4gIHRoaXMubWVzaFdpZHRoID0gMjA7XG4gIHRoaXMubWVzaEhlaWdodCA9IDIwO1xuXG4gIHRoaXMuYnVmZmVyU2NhbGUgPSB3aW5kb3cuV2ViVlJDb25maWcuQlVGRkVSX1NDQUxFO1xuXG4gIHRoaXMuYnVmZmVyV2lkdGggPSBnbC5kcmF3aW5nQnVmZmVyV2lkdGg7XG4gIHRoaXMuYnVmZmVySGVpZ2h0ID0gZ2wuZHJhd2luZ0J1ZmZlckhlaWdodDtcblxuICAvLyBQYXRjaGluZyBzdXBwb3J0XG4gIHRoaXMucmVhbEJpbmRGcmFtZWJ1ZmZlciA9IGdsLmJpbmRGcmFtZWJ1ZmZlcjtcbiAgdGhpcy5yZWFsRW5hYmxlID0gZ2wuZW5hYmxlO1xuICB0aGlzLnJlYWxEaXNhYmxlID0gZ2wuZGlzYWJsZTtcbiAgdGhpcy5yZWFsQ29sb3JNYXNrID0gZ2wuY29sb3JNYXNrO1xuICB0aGlzLnJlYWxDbGVhckNvbG9yID0gZ2wuY2xlYXJDb2xvcjtcbiAgdGhpcy5yZWFsVmlld3BvcnQgPSBnbC52aWV3cG9ydDtcblxuICBpZiAoIVV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMucmVhbENhbnZhc1dpZHRoID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihnbC5jYW52YXMuX19wcm90b19fLCAnd2lkdGgnKTtcbiAgICB0aGlzLnJlYWxDYW52YXNIZWlnaHQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGdsLmNhbnZhcy5fX3Byb3RvX18sICdoZWlnaHQnKTtcbiAgfVxuXG4gIHRoaXMuaXNQYXRjaGVkID0gZmFsc2U7XG5cbiAgLy8gU3RhdGUgdHJhY2tpbmdcbiAgdGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IG51bGw7XG4gIHRoaXMuY3VsbEZhY2UgPSBmYWxzZTtcbiAgdGhpcy5kZXB0aFRlc3QgPSBmYWxzZTtcbiAgdGhpcy5ibGVuZCA9IGZhbHNlO1xuICB0aGlzLnNjaXNzb3JUZXN0ID0gZmFsc2U7XG4gIHRoaXMuc3RlbmNpbFRlc3QgPSBmYWxzZTtcbiAgdGhpcy52aWV3cG9ydCA9IFswLCAwLCAwLCAwXTtcbiAgdGhpcy5jb2xvck1hc2sgPSBbdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZV07XG4gIHRoaXMuY2xlYXJDb2xvciA9IFswLCAwLCAwLCAwXTtcblxuICB0aGlzLmF0dHJpYnMgPSB7XG4gICAgcG9zaXRpb246IDAsXG4gICAgdGV4Q29vcmQ6IDFcbiAgfTtcbiAgdGhpcy5wcm9ncmFtID0gVXRpbC5saW5rUHJvZ3JhbShnbCwgZGlzdG9ydGlvblZTLCBkaXN0b3J0aW9uRlMsIHRoaXMuYXR0cmlicyk7XG4gIHRoaXMudW5pZm9ybXMgPSBVdGlsLmdldFByb2dyYW1Vbmlmb3JtcyhnbCwgdGhpcy5wcm9ncmFtKTtcblxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGUgPSBuZXcgRmxvYXQzMkFycmF5KDgpO1xuICB0aGlzLnNldFRleHR1cmVCb3VuZHMoKTtcblxuICB0aGlzLnZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICB0aGlzLmluZGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gIHRoaXMuaW5kZXhDb3VudCA9IDA7XG5cbiAgdGhpcy5yZW5kZXJUYXJnZXQgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gIHRoaXMuZnJhbWVidWZmZXIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuXG4gIHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyID0gbnVsbDtcbiAgdGhpcy5kZXB0aEJ1ZmZlciA9IG51bGw7XG4gIHRoaXMuc3RlbmNpbEJ1ZmZlciA9IG51bGw7XG5cbiAgaWYgKHRoaXMuY3R4QXR0cmlicy5kZXB0aCAmJiB0aGlzLmN0eEF0dHJpYnMuc3RlbmNpbCkge1xuICAgIHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gIH0gZWxzZSBpZiAodGhpcy5jdHhBdHRyaWJzLmRlcHRoKSB7XG4gICAgdGhpcy5kZXB0aEJ1ZmZlciA9IGdsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xuICB9IGVsc2UgaWYgKHRoaXMuY3R4QXR0cmlicy5zdGVuY2lsKSB7XG4gICAgdGhpcy5zdGVuY2lsQnVmZmVyID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gIH1cblxuICB0aGlzLnBhdGNoKCk7XG5cbiAgdGhpcy5vblJlc2l6ZSgpO1xuXG4gIGlmICghd2luZG93LldlYlZSQ29uZmlnLkNBUkRCT0FSRF9VSV9ESVNBQkxFRCkge1xuICAgIHRoaXMuY2FyZGJvYXJkVUkgPSBuZXcgQ2FyZGJvYXJkVUkoZ2wpO1xuICB9XG59O1xuXG4vKipcbiAqIFRlYXJzIGRvd24gYWxsIHRoZSByZXNvdXJjZXMgY3JlYXRlZCBieSB0aGUgZGlzdG9ydGVyIGFuZCByZW1vdmVzIGFueVxuICogcGF0Y2hlcy5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG5cbiAgdGhpcy51bnBhdGNoKCk7XG5cbiAgZ2wuZGVsZXRlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuICBnbC5kZWxldGVCdWZmZXIodGhpcy52ZXJ0ZXhCdWZmZXIpO1xuICBnbC5kZWxldGVCdWZmZXIodGhpcy5pbmRleEJ1ZmZlcik7XG4gIGdsLmRlbGV0ZVRleHR1cmUodGhpcy5yZW5kZXJUYXJnZXQpO1xuICBnbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmZyYW1lYnVmZmVyKTtcbiAgaWYgKHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyKSB7XG4gICAgZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyKTtcbiAgfVxuICBpZiAodGhpcy5kZXB0aEJ1ZmZlcikge1xuICAgIGdsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLmRlcHRoQnVmZmVyKTtcbiAgfVxuICBpZiAodGhpcy5zdGVuY2lsQnVmZmVyKSB7XG4gICAgZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMuc3RlbmNpbEJ1ZmZlcik7XG4gIH1cblxuICBpZiAodGhpcy5jYXJkYm9hcmRVSSkge1xuICAgIHRoaXMuY2FyZGJvYXJkVUkuZGVzdHJveSgpO1xuICB9XG59O1xuXG5cbi8qKlxuICogUmVzaXplcyB0aGUgYmFja2J1ZmZlciB0byBtYXRjaCB0aGUgY2FudmFzIHdpZHRoIGFuZCBoZWlnaHQuXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW1xuICAgIGdsLlJFTkRFUkJVRkZFUl9CSU5ESU5HLFxuICAgIGdsLlRFWFRVUkVfQklORElOR18yRCwgZ2wuVEVYVFVSRTBcbiAgXTtcblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIC8vIEJpbmQgcmVhbCBiYWNrYnVmZmVyIGFuZCBjbGVhciBpdCBvbmNlLiBXZSBkb24ndCBuZWVkIHRvIGNsZWFyIGl0IGFnYWluXG4gICAgLy8gYWZ0ZXIgdGhhdCBiZWNhdXNlIHdlJ3JlIG92ZXJ3cml0aW5nIHRoZSBzYW1lIGFyZWEgZXZlcnkgZnJhbWUuXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICAgIC8vIFB1dCB0aGluZ3MgaW4gYSBnb29kIHN0YXRlXG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5TQ0lTU09SX1RFU1QpOyB9XG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmNhbGwoZ2wsIHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmNhbGwoZ2wsIDAsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG4gICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCAwLCAwLCAwLCAxKTtcblxuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuXG4gICAgLy8gTm93IGJpbmQgYW5kIHJlc2l6ZSB0aGUgZmFrZSBiYWNrYnVmZmVyXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBzZWxmLmZyYW1lYnVmZmVyKTtcblxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHNlbGYucmVuZGVyVGFyZ2V0KTtcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIHNlbGYuY3R4QXR0cmlicy5hbHBoYSA/IGdsLlJHQkEgOiBnbC5SR0IsXG4gICAgICAgIHNlbGYuYnVmZmVyV2lkdGgsIHNlbGYuYnVmZmVySGVpZ2h0LCAwLFxuICAgICAgICBzZWxmLmN0eEF0dHJpYnMuYWxwaGEgPyBnbC5SR0JBIDogZ2wuUkdCLCBnbC5VTlNJR05FRF9CWVRFLCBudWxsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHNlbGYucmVuZGVyVGFyZ2V0LCAwKTtcblxuICAgIGlmIChzZWxmLmN0eEF0dHJpYnMuZGVwdGggJiYgc2VsZi5jdHhBdHRyaWJzLnN0ZW5jaWwpIHtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoU3RlbmNpbEJ1ZmZlcik7XG4gICAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlKGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfU1RFTkNJTCxcbiAgICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoLCBzZWxmLmJ1ZmZlckhlaWdodCk7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfU1RFTkNJTF9BVFRBQ0hNRU5ULFxuICAgICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5kZXB0aFN0ZW5jaWxCdWZmZXIpO1xuICAgIH0gZWxzZSBpZiAoc2VsZi5jdHhBdHRyaWJzLmRlcHRoKSB7XG4gICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5kZXB0aEJ1ZmZlcik7XG4gICAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlKGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfQ09NUE9ORU5UMTYsXG4gICAgICAgICAgc2VsZi5idWZmZXJXaWR0aCwgc2VsZi5idWZmZXJIZWlnaHQpO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGdsLkRFUFRIX0FUVEFDSE1FTlQsXG4gICAgICAgICAgZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoQnVmZmVyKTtcbiAgICB9IGVsc2UgaWYgKHNlbGYuY3R4QXR0cmlicy5zdGVuY2lsKSB7XG4gICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5zdGVuY2lsQnVmZmVyKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5TVEVOQ0lMX0lOREVYOCxcbiAgICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoLCBzZWxmLmJ1ZmZlckhlaWdodCk7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuU1RFTkNJTF9BVFRBQ0hNRU5ULFxuICAgICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5zdGVuY2lsQnVmZmVyKTtcbiAgICB9XG5cbiAgICBpZiAoIWdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpID09PSBnbC5GUkFNRUJVRkZFUl9DT01QTEVURSkge1xuICAgICAgY29uc29sZS5lcnJvcignRnJhbWVidWZmZXIgaW5jb21wbGV0ZSEnKTtcbiAgICB9XG5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYubGFzdEJvdW5kRnJhbWVidWZmZXIpO1xuXG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cblxuICAgIHNlbGYucmVhbENvbG9yTWFzay5hcHBseShnbCwgc2VsZi5jb2xvck1hc2spO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmFwcGx5KGdsLCBzZWxmLnZpZXdwb3J0KTtcbiAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmFwcGx5KGdsLCBzZWxmLmNsZWFyQ29sb3IpO1xuICB9KTtcblxuICBpZiAodGhpcy5jYXJkYm9hcmRVSSkge1xuICAgIHRoaXMuY2FyZGJvYXJkVUkub25SZXNpemUoKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5wYXRjaCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pc1BhdGNoZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBjYW52YXMgPSB0aGlzLmdsLmNhbnZhcztcbiAgdmFyIGdsID0gdGhpcy5nbDtcblxuICBpZiAoIVV0aWwuaXNJT1MoKSkge1xuICAgIGNhbnZhcy53aWR0aCA9IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKSAqIHRoaXMuYnVmZmVyU2NhbGU7XG4gICAgY2FudmFzLmhlaWdodCA9IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCkgKiB0aGlzLmJ1ZmZlclNjYWxlO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNhbnZhcywgJ3dpZHRoJywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmJ1ZmZlcldpZHRoO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgc2VsZi5idWZmZXJXaWR0aCA9IHZhbHVlO1xuICAgICAgICBzZWxmLnJlYWxDYW52YXNXaWR0aC5zZXQuY2FsbChjYW52YXMsIHZhbHVlKTtcbiAgICAgICAgc2VsZi5vblJlc2l6ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNhbnZhcywgJ2hlaWdodCcsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2VsZi5idWZmZXJIZWlnaHQ7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBzZWxmLmJ1ZmZlckhlaWdodCA9IHZhbHVlO1xuICAgICAgICBzZWxmLnJlYWxDYW52YXNIZWlnaHQuc2V0LmNhbGwoY2FudmFzLCB2YWx1ZSk7XG4gICAgICAgIHNlbGYub25SZXNpemUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuRlJBTUVCVUZGRVJfQklORElORyk7XG5cbiAgaWYgKHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPT0gbnVsbCkge1xuICAgIHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPSB0aGlzLmZyYW1lYnVmZmVyO1xuICAgIHRoaXMuZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLmZyYW1lYnVmZmVyKTtcbiAgfVxuXG4gIHRoaXMuZ2wuYmluZEZyYW1lYnVmZmVyID0gZnVuY3Rpb24odGFyZ2V0LCBmcmFtZWJ1ZmZlcikge1xuICAgIHNlbGYubGFzdEJvdW5kRnJhbWVidWZmZXIgPSBmcmFtZWJ1ZmZlciA/IGZyYW1lYnVmZmVyIDogc2VsZi5mcmFtZWJ1ZmZlcjtcbiAgICAvLyBTaWxlbnRseSBtYWtlIGNhbGxzIHRvIGJpbmQgdGhlIGRlZmF1bHQgZnJhbWVidWZmZXIgYmluZCBvdXJzIGluc3RlYWQuXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIHRhcmdldCwgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlcik7XG4gIH07XG5cbiAgdGhpcy5jdWxsRmFjZSA9IGdsLmdldFBhcmFtZXRlcihnbC5DVUxMX0ZBQ0UpO1xuICB0aGlzLmRlcHRoVGVzdCA9IGdsLmdldFBhcmFtZXRlcihnbC5ERVBUSF9URVNUKTtcbiAgdGhpcy5ibGVuZCA9IGdsLmdldFBhcmFtZXRlcihnbC5CTEVORCk7XG4gIHRoaXMuc2Npc3NvclRlc3QgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuU0NJU1NPUl9URVNUKTtcbiAgdGhpcy5zdGVuY2lsVGVzdCA9IGdsLmdldFBhcmFtZXRlcihnbC5TVEVOQ0lMX1RFU1QpO1xuXG4gIGdsLmVuYWJsZSA9IGZ1bmN0aW9uKHBuYW1lKSB7XG4gICAgc3dpdGNoIChwbmFtZSkge1xuICAgICAgY2FzZSBnbC5DVUxMX0ZBQ0U6IHNlbGYuY3VsbEZhY2UgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuREVQVEhfVEVTVDogc2VsZi5kZXB0aFRlc3QgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuQkxFTkQ6IHNlbGYuYmxlbmQgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU0NJU1NPUl9URVNUOiBzZWxmLnNjaXNzb3JUZXN0ID0gdHJ1ZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLlNURU5DSUxfVEVTVDogc2VsZi5zdGVuY2lsVGVzdCA9IHRydWU7IGJyZWFrO1xuICAgIH1cbiAgICBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgcG5hbWUpO1xuICB9O1xuXG4gIGdsLmRpc2FibGUgPSBmdW5jdGlvbihwbmFtZSkge1xuICAgIHN3aXRjaCAocG5hbWUpIHtcbiAgICAgIGNhc2UgZ2wuQ1VMTF9GQUNFOiBzZWxmLmN1bGxGYWNlID0gZmFsc2U7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5ERVBUSF9URVNUOiBzZWxmLmRlcHRoVGVzdCA9IGZhbHNlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuQkxFTkQ6IHNlbGYuYmxlbmQgPSBmYWxzZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLlNDSVNTT1JfVEVTVDogc2VsZi5zY2lzc29yVGVzdCA9IGZhbHNlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU1RFTkNJTF9URVNUOiBzZWxmLnN0ZW5jaWxUZXN0ID0gZmFsc2U7IGJyZWFrO1xuICAgIH1cbiAgICBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIHBuYW1lKTtcbiAgfTtcblxuICB0aGlzLmNvbG9yTWFzayA9IGdsLmdldFBhcmFtZXRlcihnbC5DT0xPUl9XUklURU1BU0spO1xuICBnbC5jb2xvck1hc2sgPSBmdW5jdGlvbihyLCBnLCBiLCBhKSB7XG4gICAgc2VsZi5jb2xvck1hc2tbMF0gPSByO1xuICAgIHNlbGYuY29sb3JNYXNrWzFdID0gZztcbiAgICBzZWxmLmNvbG9yTWFza1syXSA9IGI7XG4gICAgc2VsZi5jb2xvck1hc2tbM10gPSBhO1xuICAgIHNlbGYucmVhbENvbG9yTWFzay5jYWxsKGdsLCByLCBnLCBiLCBhKTtcbiAgfTtcblxuICB0aGlzLmNsZWFyQ29sb3IgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQ09MT1JfQ0xFQVJfVkFMVUUpO1xuICBnbC5jbGVhckNvbG9yID0gZnVuY3Rpb24ociwgZywgYiwgYSkge1xuICAgIHNlbGYuY2xlYXJDb2xvclswXSA9IHI7XG4gICAgc2VsZi5jbGVhckNvbG9yWzFdID0gZztcbiAgICBzZWxmLmNsZWFyQ29sb3JbMl0gPSBiO1xuICAgIHNlbGYuY2xlYXJDb2xvclszXSA9IGE7XG4gICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCByLCBnLCBiLCBhKTtcbiAgfTtcblxuICB0aGlzLnZpZXdwb3J0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlZJRVdQT1JUKTtcbiAgZ2wudmlld3BvcnQgPSBmdW5jdGlvbih4LCB5LCB3LCBoKSB7XG4gICAgc2VsZi52aWV3cG9ydFswXSA9IHg7XG4gICAgc2VsZi52aWV3cG9ydFsxXSA9IHk7XG4gICAgc2VsZi52aWV3cG9ydFsyXSA9IHc7XG4gICAgc2VsZi52aWV3cG9ydFszXSA9IGg7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuY2FsbChnbCwgeCwgeSwgdywgaCk7XG4gIH07XG5cbiAgdGhpcy5pc1BhdGNoZWQgPSB0cnVlO1xuICBVdGlsLnNhZmFyaUNzc1NpemVXb3JrYXJvdW5kKGNhbnZhcyk7XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnVucGF0Y2ggPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmlzUGF0Y2hlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBnbCA9IHRoaXMuZ2w7XG4gIHZhciBjYW52YXMgPSB0aGlzLmdsLmNhbnZhcztcblxuICBpZiAoIVV0aWwuaXNJT1MoKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYW52YXMsICd3aWR0aCcsIHRoaXMucmVhbENhbnZhc1dpZHRoKTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnaGVpZ2h0JywgdGhpcy5yZWFsQ2FudmFzSGVpZ2h0KTtcbiAgfVxuICBjYW52YXMud2lkdGggPSB0aGlzLmJ1ZmZlcldpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gdGhpcy5idWZmZXJIZWlnaHQ7XG5cbiAgZ2wuYmluZEZyYW1lYnVmZmVyID0gdGhpcy5yZWFsQmluZEZyYW1lYnVmZmVyO1xuICBnbC5lbmFibGUgPSB0aGlzLnJlYWxFbmFibGU7XG4gIGdsLmRpc2FibGUgPSB0aGlzLnJlYWxEaXNhYmxlO1xuICBnbC5jb2xvck1hc2sgPSB0aGlzLnJlYWxDb2xvck1hc2s7XG4gIGdsLmNsZWFyQ29sb3IgPSB0aGlzLnJlYWxDbGVhckNvbG9yO1xuICBnbC52aWV3cG9ydCA9IHRoaXMucmVhbFZpZXdwb3J0O1xuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiBvdXIgZmFrZSBiYWNrYnVmZmVyIGlzIGJvdW5kIGFuZCBiaW5kIHRoZSByZWFsIGJhY2tidWZmZXJcbiAgLy8gaWYgdGhhdCdzIHRoZSBjYXNlLlxuICBpZiAodGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9PSB0aGlzLmZyYW1lYnVmZmVyKSB7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgfVxuXG4gIHRoaXMuaXNQYXRjaGVkID0gZmFsc2U7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBVdGlsLnNhZmFyaUNzc1NpemVXb3JrYXJvdW5kKGNhbnZhcyk7XG4gIH0sIDEpO1xufTtcblxuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5zZXRUZXh0dXJlQm91bmRzID0gZnVuY3Rpb24obGVmdEJvdW5kcywgcmlnaHRCb3VuZHMpIHtcbiAgaWYgKCFsZWZ0Qm91bmRzKSB7XG4gICAgbGVmdEJvdW5kcyA9IFswLCAwLCAwLjUsIDFdO1xuICB9XG5cbiAgaWYgKCFyaWdodEJvdW5kcykge1xuICAgIHJpZ2h0Qm91bmRzID0gWzAuNSwgMCwgMC41LCAxXTtcbiAgfVxuXG4gIC8vIExlZnQgZXllXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVswXSA9IGxlZnRCb3VuZHNbMF07IC8vIFhcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzFdID0gbGVmdEJvdW5kc1sxXTsgLy8gWVxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbMl0gPSBsZWZ0Qm91bmRzWzJdOyAvLyBXaWR0aFxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbM10gPSBsZWZ0Qm91bmRzWzNdOyAvLyBIZWlnaHRcblxuICAvLyBSaWdodCBleWVcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzRdID0gcmlnaHRCb3VuZHNbMF07IC8vIFhcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzVdID0gcmlnaHRCb3VuZHNbMV07IC8vIFlcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzZdID0gcmlnaHRCb3VuZHNbMl07IC8vIFdpZHRoXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVs3XSA9IHJpZ2h0Qm91bmRzWzNdOyAvLyBIZWlnaHRcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgZGlzdG9ydGlvbiBwYXNzIG9uIHRoZSBpbmplY3RlZCBiYWNrYnVmZmVyLCByZW5kZXJpbmcgaXQgdG8gdGhlIHJlYWxcbiAqIGJhY2tidWZmZXIuXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuc3VibWl0RnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW107XG5cbiAgaWYgKCF3aW5kb3cuV2ViVlJDb25maWcuRElSVFlfU1VCTUlUX0ZSQU1FX0JJTkRJTkdTKSB7XG4gICAgZ2xTdGF0ZS5wdXNoKFxuICAgICAgZ2wuQ1VSUkVOVF9QUk9HUkFNLFxuICAgICAgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkcsXG4gICAgICBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HLFxuICAgICAgZ2wuVEVYVFVSRV9CSU5ESU5HXzJELCBnbC5URVhUVVJFMFxuICAgICk7XG4gIH1cblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIC8vIEJpbmQgdGhlIHJlYWwgZGVmYXVsdCBmcmFtZWJ1ZmZlclxuICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKGdsLCBnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhlIEdMIHN0YXRlIGlzIGluIGEgZ29vZCBwbGFjZVxuICAgIGlmIChzZWxmLmN1bGxGYWNlKSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuQ1VMTF9GQUNFKTsgfVxuICAgIGlmIChzZWxmLmRlcHRoVGVzdCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLkRFUFRIX1RFU1QpOyB9XG4gICAgaWYgKHNlbGYuYmxlbmQpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5CTEVORCk7IH1cbiAgICBpZiAoc2VsZi5zY2lzc29yVGVzdCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5zdGVuY2lsVGVzdCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLlNURU5DSUxfVEVTVCk7IH1cbiAgICBzZWxmLnJlYWxDb2xvck1hc2suY2FsbChnbCwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuY2FsbChnbCwgMCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcblxuICAgIC8vIElmIHRoZSBiYWNrYnVmZmVyIGhhcyBhbiBhbHBoYSBjaGFubmVsIGNsZWFyIGV2ZXJ5IGZyYW1lIHNvIHRoZSBwYWdlXG4gICAgLy8gZG9lc24ndCBzaG93IHRocm91Z2guXG4gICAgaWYgKHNlbGYuY3R4QXR0cmlicy5hbHBoYSB8fCBVdGlsLmlzSU9TKCkpIHtcbiAgICAgIHNlbGYucmVhbENsZWFyQ29sb3IuY2FsbChnbCwgMCwgMCwgMCwgMSk7XG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICB9XG5cbiAgICAvLyBCaW5kIGRpc3RvcnRpb24gcHJvZ3JhbSBhbmQgbWVzaFxuICAgIGdsLnVzZVByb2dyYW0oc2VsZi5wcm9ncmFtKTtcblxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHNlbGYuaW5kZXhCdWZmZXIpO1xuXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHNlbGYudmVydGV4QnVmZmVyKTtcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzZWxmLmF0dHJpYnMucG9zaXRpb24pO1xuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNlbGYuYXR0cmlicy50ZXhDb29yZCk7XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzZWxmLmF0dHJpYnMucG9zaXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgMjAsIDApO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2VsZi5hdHRyaWJzLnRleENvb3JkLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDIwLCA4KTtcblxuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xuICAgIGdsLnVuaWZvcm0xaShzZWxmLnVuaWZvcm1zLmRpZmZ1c2UsIDApO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHNlbGYucmVuZGVyVGFyZ2V0KTtcblxuICAgIGdsLnVuaWZvcm00ZnYoc2VsZi51bmlmb3Jtcy52aWV3cG9ydE9mZnNldFNjYWxlLCBzZWxmLnZpZXdwb3J0T2Zmc2V0U2NhbGUpO1xuXG4gICAgLy8gRHJhd3MgYm90aCBleWVzXG4gICAgZ2wuZHJhd0VsZW1lbnRzKGdsLlRSSUFOR0xFUywgc2VsZi5pbmRleENvdW50LCBnbC5VTlNJR05FRF9TSE9SVCwgMCk7XG5cbiAgICBpZiAoc2VsZi5jYXJkYm9hcmRVSSkge1xuICAgICAgc2VsZi5jYXJkYm9hcmRVSS5yZW5kZXJOb1N0YXRlKCk7XG4gICAgfVxuXG4gICAgLy8gQmluZCB0aGUgZmFrZSBkZWZhdWx0IGZyYW1lYnVmZmVyIGFnYWluXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoc2VsZi5nbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYuZnJhbWVidWZmZXIpO1xuXG4gICAgLy8gSWYgcHJlc2VydmVEcmF3aW5nQnVmZmVyID09IGZhbHNlIGNsZWFyIHRoZSBmcmFtZWJ1ZmZlclxuICAgIGlmICghc2VsZi5jdHhBdHRyaWJzLnByZXNlcnZlRHJhd2luZ0J1ZmZlcikge1xuICAgICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCAwLCAwLCAwLCAwKTtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH1cblxuICAgIGlmICghd2luZG93LldlYlZSQ29uZmlnLkRJUlRZX1NVQk1JVF9GUkFNRV9CSU5ESU5HUykge1xuICAgICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBzZWxmLmxhc3RCb3VuZEZyYW1lYnVmZmVyKTtcbiAgICB9XG5cbiAgICAvLyBSZXN0b3JlIHN0YXRlXG4gICAgaWYgKHNlbGYuY3VsbEZhY2UpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLkNVTExfRkFDRSk7IH1cbiAgICBpZiAoc2VsZi5kZXB0aFRlc3QpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLkRFUFRIX1RFU1QpOyB9XG4gICAgaWYgKHNlbGYuYmxlbmQpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLkJMRU5EKTsgfVxuICAgIGlmIChzZWxmLnNjaXNzb3JUZXN0KSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5TQ0lTU09SX1RFU1QpOyB9XG4gICAgaWYgKHNlbGYuc3RlbmNpbFRlc3QpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLlNURU5DSUxfVEVTVCk7IH1cblxuICAgIHNlbGYucmVhbENvbG9yTWFzay5hcHBseShnbCwgc2VsZi5jb2xvck1hc2spO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmFwcGx5KGdsLCBzZWxmLnZpZXdwb3J0KTtcbiAgICBpZiAoc2VsZi5jdHhBdHRyaWJzLmFscGhhIHx8ICFzZWxmLmN0eEF0dHJpYnMucHJlc2VydmVEcmF3aW5nQnVmZmVyKSB7XG4gICAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmFwcGx5KGdsLCBzZWxmLmNsZWFyQ29sb3IpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gV29ya2Fyb3VuZCBmb3IgdGhlIGZhY3QgdGhhdCBTYWZhcmkgZG9lc24ndCBhbGxvdyB1cyB0byBwYXRjaCB0aGUgY2FudmFzXG4gIC8vIHdpZHRoIGFuZCBoZWlnaHQgY29ycmVjdGx5LiBBZnRlciBlYWNoIHN1Ym1pdCBmcmFtZSBjaGVjayB0byBzZWUgd2hhdCB0aGVcbiAgLy8gcmVhbCBiYWNrYnVmZmVyIHNpemUgaGFzIGJlZW4gc2V0IHRvIGFuZCByZXNpemUgdGhlIGZha2UgYmFja2J1ZmZlciBzaXplXG4gIC8vIHRvIG1hdGNoLlxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgdmFyIGNhbnZhcyA9IGdsLmNhbnZhcztcbiAgICBpZiAoY2FudmFzLndpZHRoICE9IHNlbGYuYnVmZmVyV2lkdGggfHwgY2FudmFzLmhlaWdodCAhPSBzZWxmLmJ1ZmZlckhlaWdodCkge1xuICAgICAgc2VsZi5idWZmZXJXaWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICAgIHNlbGYuYnVmZmVySGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcbiAgICAgIHNlbGYub25SZXNpemUoKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ2FsbCB3aGVuIHRoZSBkZXZpY2VJbmZvIGhhcyBjaGFuZ2VkLiBBdCB0aGlzIHBvaW50IHdlIG5lZWRcbiAqIHRvIHJlLWNhbGN1bGF0ZSB0aGUgZGlzdG9ydGlvbiBtZXNoLlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnVwZGF0ZURldmljZUluZm8gPSBmdW5jdGlvbihkZXZpY2VJbmZvKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZ2xTdGF0ZSA9IFtnbC5BUlJBWV9CVUZGRVJfQklORElORywgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVJfQklORElOR107XG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgdmFyIHZlcnRpY2VzID0gc2VsZi5jb21wdXRlTWVzaFZlcnRpY2VzXyhzZWxmLm1lc2hXaWR0aCwgc2VsZi5tZXNoSGVpZ2h0LCBkZXZpY2VJbmZvKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc2VsZi52ZXJ0ZXhCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB2ZXJ0aWNlcywgZ2wuU1RBVElDX0RSQVcpO1xuXG4gICAgLy8gSW5kaWNlcyBkb24ndCBjaGFuZ2UgYmFzZWQgb24gZGV2aWNlIHBhcmFtZXRlcnMsIHNvIG9ubHkgY29tcHV0ZSBvbmNlLlxuICAgIGlmICghc2VsZi5pbmRleENvdW50KSB7XG4gICAgICB2YXIgaW5kaWNlcyA9IHNlbGYuY29tcHV0ZU1lc2hJbmRpY2VzXyhzZWxmLm1lc2hXaWR0aCwgc2VsZi5tZXNoSGVpZ2h0KTtcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHNlbGYuaW5kZXhCdWZmZXIpO1xuICAgICAgZ2wuYnVmZmVyRGF0YShnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaW5kaWNlcywgZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgc2VsZi5pbmRleENvdW50ID0gaW5kaWNlcy5sZW5ndGg7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogQnVpbGQgdGhlIGRpc3RvcnRpb24gbWVzaCB2ZXJ0aWNlcy5cbiAqIEJhc2VkIG9uIGNvZGUgZnJvbSB0aGUgVW5pdHkgY2FyZGJvYXJkIHBsdWdpbi5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5jb21wdXRlTWVzaFZlcnRpY2VzXyA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIGRldmljZUluZm8pIHtcbiAgdmFyIHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheSgyICogd2lkdGggKiBoZWlnaHQgKiA1KTtcblxuICB2YXIgbGVuc0ZydXN0dW0gPSBkZXZpY2VJbmZvLmdldExlZnRFeWVWaXNpYmxlVGFuQW5nbGVzKCk7XG4gIHZhciBub0xlbnNGcnVzdHVtID0gZGV2aWNlSW5mby5nZXRMZWZ0RXllTm9MZW5zVGFuQW5nbGVzKCk7XG4gIHZhciB2aWV3cG9ydCA9IGRldmljZUluZm8uZ2V0TGVmdEV5ZVZpc2libGVTY3JlZW5SZWN0KG5vTGVuc0ZydXN0dW0pO1xuICB2YXIgdmlkeCA9IDA7XG4gIHZhciBpaWR4ID0gMDtcbiAgZm9yICh2YXIgZSA9IDA7IGUgPCAyOyBlKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGhlaWdodDsgaisrKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdpZHRoOyBpKyssIHZpZHgrKykge1xuICAgICAgICB2YXIgdSA9IGkgLyAod2lkdGggLSAxKTtcbiAgICAgICAgdmFyIHYgPSBqIC8gKGhlaWdodCAtIDEpO1xuXG4gICAgICAgIC8vIEdyaWQgcG9pbnRzIHJlZ3VsYXJseSBzcGFjZWQgaW4gU3RyZW9TY3JlZW4sIGFuZCBiYXJyZWwgZGlzdG9ydGVkIGluXG4gICAgICAgIC8vIHRoZSBtZXNoLlxuICAgICAgICB2YXIgcyA9IHU7XG4gICAgICAgIHZhciB0ID0gdjtcbiAgICAgICAgdmFyIHggPSBVdGlsLmxlcnAobGVuc0ZydXN0dW1bMF0sIGxlbnNGcnVzdHVtWzJdLCB1KTtcbiAgICAgICAgdmFyIHkgPSBVdGlsLmxlcnAobGVuc0ZydXN0dW1bM10sIGxlbnNGcnVzdHVtWzFdLCB2KTtcbiAgICAgICAgdmFyIGQgPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSk7XG4gICAgICAgIHZhciByID0gZGV2aWNlSW5mby5kaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKGQpO1xuICAgICAgICB2YXIgcCA9IHggKiByIC8gZDtcbiAgICAgICAgdmFyIHEgPSB5ICogciAvIGQ7XG4gICAgICAgIHUgPSAocCAtIG5vTGVuc0ZydXN0dW1bMF0pIC8gKG5vTGVuc0ZydXN0dW1bMl0gLSBub0xlbnNGcnVzdHVtWzBdKTtcbiAgICAgICAgdiA9IChxIC0gbm9MZW5zRnJ1c3R1bVszXSkgLyAobm9MZW5zRnJ1c3R1bVsxXSAtIG5vTGVuc0ZydXN0dW1bM10pO1xuXG4gICAgICAgIC8vIENvbnZlcnQgdSx2IHRvIG1lc2ggc2NyZWVuIGNvb3JkaW5hdGVzLlxuICAgICAgICB2YXIgYXNwZWN0ID0gZGV2aWNlSW5mby5kZXZpY2Uud2lkdGhNZXRlcnMgLyBkZXZpY2VJbmZvLmRldmljZS5oZWlnaHRNZXRlcnM7XG5cbiAgICAgICAgLy8gRklYTUU6IFRoZSBvcmlnaW5hbCBVbml0eSBwbHVnaW4gbXVsdGlwbGllZCBVIGJ5IHRoZSBhc3BlY3QgcmF0aW9cbiAgICAgICAgLy8gYW5kIGRpZG4ndCBtdWx0aXBseSBlaXRoZXIgdmFsdWUgYnkgMiwgYnV0IHRoYXQgc2VlbXMgdG8gZ2V0IGl0XG4gICAgICAgIC8vIHJlYWxseSBjbG9zZSB0byBjb3JyZWN0IGxvb2tpbmcgZm9yIG1lLiBJIGhhdGUgdGhpcyBraW5kIG9mIFwiRG9uJ3RcbiAgICAgICAgLy8ga25vdyB3aHkgaXQgd29ya3NcIiBjb2RlIHRob3VnaCwgYW5kIHdvbGQgbG92ZSBhIG1vcmUgbG9naWNhbFxuICAgICAgICAvLyBleHBsYW5hdGlvbiBvZiB3aGF0IG5lZWRzIHRvIGhhcHBlbiBoZXJlLlxuICAgICAgICB1ID0gKHZpZXdwb3J0LnggKyB1ICogdmlld3BvcnQud2lkdGggLSAwLjUpICogMi4wOyAvLyogYXNwZWN0O1xuICAgICAgICB2ID0gKHZpZXdwb3J0LnkgKyB2ICogdmlld3BvcnQuaGVpZ2h0IC0gMC41KSAqIDIuMDtcblxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgMF0gPSB1OyAvLyBwb3NpdGlvbi54XG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyAxXSA9IHY7IC8vIHBvc2l0aW9uLnlcbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDJdID0gczsgLy8gdGV4Q29vcmQueFxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgM10gPSB0OyAvLyB0ZXhDb29yZC55XG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyA0XSA9IGU7IC8vIHRleENvb3JkLnogKHZpZXdwb3J0IGluZGV4KVxuICAgICAgfVxuICAgIH1cbiAgICB2YXIgdyA9IGxlbnNGcnVzdHVtWzJdIC0gbGVuc0ZydXN0dW1bMF07XG4gICAgbGVuc0ZydXN0dW1bMF0gPSAtKHcgKyBsZW5zRnJ1c3R1bVswXSk7XG4gICAgbGVuc0ZydXN0dW1bMl0gPSB3IC0gbGVuc0ZydXN0dW1bMl07XG4gICAgdyA9IG5vTGVuc0ZydXN0dW1bMl0gLSBub0xlbnNGcnVzdHVtWzBdO1xuICAgIG5vTGVuc0ZydXN0dW1bMF0gPSAtKHcgKyBub0xlbnNGcnVzdHVtWzBdKTtcbiAgICBub0xlbnNGcnVzdHVtWzJdID0gdyAtIG5vTGVuc0ZydXN0dW1bMl07XG4gICAgdmlld3BvcnQueCA9IDEgLSAodmlld3BvcnQueCArIHZpZXdwb3J0LndpZHRoKTtcbiAgfVxuICByZXR1cm4gdmVydGljZXM7XG59XG5cbi8qKlxuICogQnVpbGQgdGhlIGRpc3RvcnRpb24gbWVzaCBpbmRpY2VzLlxuICogQmFzZWQgb24gY29kZSBmcm9tIHRoZSBVbml0eSBjYXJkYm9hcmQgcGx1Z2luLlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLmNvbXB1dGVNZXNoSW5kaWNlc18gPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gIHZhciBpbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KDIgKiAod2lkdGggLSAxKSAqIChoZWlnaHQgLSAxKSAqIDYpO1xuICB2YXIgaGFsZndpZHRoID0gd2lkdGggLyAyO1xuICB2YXIgaGFsZmhlaWdodCA9IGhlaWdodCAvIDI7XG4gIHZhciB2aWR4ID0gMDtcbiAgdmFyIGlpZHggPSAwO1xuICBmb3IgKHZhciBlID0gMDsgZSA8IDI7IGUrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgaGVpZ2h0OyBqKyspIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2lkdGg7IGkrKywgdmlkeCsrKSB7XG4gICAgICAgIGlmIChpID09IDAgfHwgaiA9PSAwKVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAvLyBCdWlsZCBhIHF1YWQuICBMb3dlciByaWdodCBhbmQgdXBwZXIgbGVmdCBxdWFkcmFudHMgaGF2ZSBxdWFkcyB3aXRoXG4gICAgICAgIC8vIHRoZSB0cmlhbmdsZSBkaWFnb25hbCBmbGlwcGVkIHRvIGdldCB0aGUgdmlnbmV0dGUgdG8gaW50ZXJwb2xhdGVcbiAgICAgICAgLy8gY29ycmVjdGx5LlxuICAgICAgICBpZiAoKGkgPD0gaGFsZndpZHRoKSA9PSAoaiA8PSBoYWxmaGVpZ2h0KSkge1xuICAgICAgICAgIC8vIFF1YWQgZGlhZ29uYWwgbG93ZXIgbGVmdCB0byB1cHBlciByaWdodC5cbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4O1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aCAtIDE7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aCAtIDE7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBRdWFkIGRpYWdvbmFsIHVwcGVyIGxlZnQgdG8gbG93ZXIgcmlnaHQuXG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIDE7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSAxO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aCAtIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGljZXM7XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLmdldE93blByb3BlcnR5RGVzY3JpcHRvcl8gPSBmdW5jdGlvbihwcm90bywgYXR0ck5hbWUpIHtcbiAgdmFyIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvLCBhdHRyTmFtZSk7XG4gIC8vIEluIHNvbWUgY2FzZXMgKGFoZW0uLi4gU2FmYXJpKSwgdGhlIGRlc2NyaXB0b3IgcmV0dXJucyB1bmRlZmluZWQgZ2V0IGFuZFxuICAvLyBzZXQgZmllbGRzLiBJbiB0aGlzIGNhc2UsIHdlIG5lZWQgdG8gY3JlYXRlIGEgc3ludGhldGljIHByb3BlcnR5XG4gIC8vIGRlc2NyaXB0b3IuIFRoaXMgd29ya3MgYXJvdW5kIHNvbWUgb2YgdGhlIGlzc3VlcyBpblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYm9yaXNtdXMvd2VidnItcG9seWZpbGwvaXNzdWVzLzQ2XG4gIGlmIChkZXNjcmlwdG9yLmdldCA9PT0gdW5kZWZpbmVkIHx8IGRlc2NyaXB0b3Iuc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7XG4gICAgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gdHJ1ZTtcbiAgICBkZXNjcmlwdG9yLmdldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICB9O1xuICAgIGRlc2NyaXB0b3Iuc2V0ID0gZnVuY3Rpb24odmFsKSB7XG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgdmFsKTtcbiAgICB9O1xuICB9XG4gIHJldHVybiBkZXNjcmlwdG9yO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYXJkYm9hcmREaXN0b3J0ZXI7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xudmFyIFdHTFVQcmVzZXJ2ZUdMU3RhdGUgPSByZXF1aXJlKCcuL2RlcHMvd2dsdS1wcmVzZXJ2ZS1zdGF0ZS5qcycpO1xuXG52YXIgdWlWUyA9IFtcbiAgJ2F0dHJpYnV0ZSB2ZWMyIHBvc2l0aW9uOycsXG5cbiAgJ3VuaWZvcm0gbWF0NCBwcm9qZWN0aW9uTWF0OycsXG5cbiAgJ3ZvaWQgbWFpbigpIHsnLFxuICAnICBnbF9Qb3NpdGlvbiA9IHByb2plY3Rpb25NYXQgKiB2ZWM0KCBwb3NpdGlvbiwgLTEuMCwgMS4wICk7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxudmFyIHVpRlMgPSBbXG4gICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDsnLFxuXG4gICd1bmlmb3JtIHZlYzQgY29sb3I7JyxcblxuICAndm9pZCBtYWluKCkgeycsXG4gICcgIGdsX0ZyYWdDb2xvciA9IGNvbG9yOycsXG4gICd9Jyxcbl0uam9pbignXFxuJyk7XG5cbnZhciBERUcyUkFEID0gTWF0aC5QSS8xODAuMDtcblxuLy8gVGhlIGdlYXIgaGFzIDYgaWRlbnRpY2FsIHNlY3Rpb25zLCBlYWNoIHNwYW5uaW5nIDYwIGRlZ3JlZXMuXG52YXIga0FuZ2xlUGVyR2VhclNlY3Rpb24gPSA2MDtcblxuLy8gSGFsZi1hbmdsZSBvZiB0aGUgc3BhbiBvZiB0aGUgb3V0ZXIgcmltLlxudmFyIGtPdXRlclJpbUVuZEFuZ2xlID0gMTI7XG5cbi8vIEFuZ2xlIGJldHdlZW4gdGhlIG1pZGRsZSBvZiB0aGUgb3V0ZXIgcmltIGFuZCB0aGUgc3RhcnQgb2YgdGhlIGlubmVyIHJpbS5cbnZhciBrSW5uZXJSaW1CZWdpbkFuZ2xlID0gMjA7XG5cbi8vIERpc3RhbmNlIGZyb20gY2VudGVyIHRvIG91dGVyIHJpbSwgbm9ybWFsaXplZCBzbyB0aGF0IHRoZSBlbnRpcmUgbW9kZWxcbi8vIGZpdHMgaW4gYSBbLTEsIDFdIHggWy0xLCAxXSBzcXVhcmUuXG52YXIga091dGVyUmFkaXVzID0gMTtcblxuLy8gRGlzdGFuY2UgZnJvbSBjZW50ZXIgdG8gZGVwcmVzc2VkIHJpbSwgaW4gbW9kZWwgdW5pdHMuXG52YXIga01pZGRsZVJhZGl1cyA9IDAuNzU7XG5cbi8vIFJhZGl1cyBvZiB0aGUgaW5uZXIgaG9sbG93IGNpcmNsZSwgaW4gbW9kZWwgdW5pdHMuXG52YXIga0lubmVyUmFkaXVzID0gMC4zMTI1O1xuXG4vLyBDZW50ZXIgbGluZSB0aGlja25lc3MgaW4gRFAuXG52YXIga0NlbnRlckxpbmVUaGlja25lc3NEcCA9IDQ7XG5cbi8vIEJ1dHRvbiB3aWR0aCBpbiBEUC5cbnZhciBrQnV0dG9uV2lkdGhEcCA9IDI4O1xuXG4vLyBGYWN0b3IgdG8gc2NhbGUgdGhlIHRvdWNoIGFyZWEgdGhhdCByZXNwb25kcyB0byB0aGUgdG91Y2guXG52YXIga1RvdWNoU2xvcEZhY3RvciA9IDEuNTtcblxudmFyIEFuZ2xlcyA9IFtcbiAgMCwga091dGVyUmltRW5kQW5nbGUsIGtJbm5lclJpbUJlZ2luQW5nbGUsXG4gIGtBbmdsZVBlckdlYXJTZWN0aW9uIC0ga0lubmVyUmltQmVnaW5BbmdsZSxcbiAga0FuZ2xlUGVyR2VhclNlY3Rpb24gLSBrT3V0ZXJSaW1FbmRBbmdsZVxuXTtcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBhbGlnbm1lbnQgbGluZSBhbmQgXCJvcHRpb25zXCIgZ2Vhci4gSXQgaXMgYXNzdW1lZCB0aGF0IHRoZSBjYW52YXNcbiAqIHRoaXMgaXMgcmVuZGVyZWQgaW50byBjb3ZlcnMgdGhlIGVudGlyZSBzY3JlZW4gKG9yIGNsb3NlIHRvIGl0LilcbiAqL1xuZnVuY3Rpb24gQ2FyZGJvYXJkVUkoZ2wpIHtcbiAgdGhpcy5nbCA9IGdsO1xuXG4gIHRoaXMuYXR0cmlicyA9IHtcbiAgICBwb3NpdGlvbjogMFxuICB9O1xuICB0aGlzLnByb2dyYW0gPSBVdGlsLmxpbmtQcm9ncmFtKGdsLCB1aVZTLCB1aUZTLCB0aGlzLmF0dHJpYnMpO1xuICB0aGlzLnVuaWZvcm1zID0gVXRpbC5nZXRQcm9ncmFtVW5pZm9ybXMoZ2wsIHRoaXMucHJvZ3JhbSk7XG5cbiAgdGhpcy52ZXJ0ZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgdGhpcy5nZWFyT2Zmc2V0ID0gMDtcbiAgdGhpcy5nZWFyVmVydGV4Q291bnQgPSAwO1xuICB0aGlzLmFycm93T2Zmc2V0ID0gMDtcbiAgdGhpcy5hcnJvd1ZlcnRleENvdW50ID0gMDtcblxuICB0aGlzLnByb2pNYXQgPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcblxuICB0aGlzLmxpc3RlbmVyID0gbnVsbDtcblxuICB0aGlzLm9uUmVzaXplKCk7XG59O1xuXG4vKipcbiAqIFRlYXJzIGRvd24gYWxsIHRoZSByZXNvdXJjZXMgY3JlYXRlZCBieSB0aGUgVUkgcmVuZGVyZXIuXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG5cbiAgaWYgKHRoaXMubGlzdGVuZXIpIHtcbiAgICBnbC5jYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmxpc3RlbmVyLCBmYWxzZSk7XG4gIH1cblxuICBnbC5kZWxldGVQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLnZlcnRleEJ1ZmZlcik7XG59O1xuXG4vKipcbiAqIEFkZHMgYSBsaXN0ZW5lciB0byBjbGlja3Mgb24gdGhlIGdlYXIgYW5kIGJhY2sgaWNvbnNcbiAqL1xuQ2FyZGJvYXJkVUkucHJvdG90eXBlLmxpc3RlbiA9IGZ1bmN0aW9uKG9wdGlvbnNDYWxsYmFjaywgYmFja0NhbGxiYWNrKSB7XG4gIHZhciBjYW52YXMgPSB0aGlzLmdsLmNhbnZhcztcbiAgdGhpcy5saXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIG1pZGxpbmUgPSBjYW52YXMuY2xpZW50V2lkdGggLyAyO1xuICAgIHZhciBidXR0b25TaXplID0ga0J1dHRvbldpZHRoRHAgKiBrVG91Y2hTbG9wRmFjdG9yO1xuICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgdXNlciBjbGlja2VkIG9uIChvciBhcm91bmQpIHRoZSBnZWFyIGljb25cbiAgICBpZiAoZXZlbnQuY2xpZW50WCA+IG1pZGxpbmUgLSBidXR0b25TaXplICYmXG4gICAgICAgIGV2ZW50LmNsaWVudFggPCBtaWRsaW5lICsgYnV0dG9uU2l6ZSAmJlxuICAgICAgICBldmVudC5jbGllbnRZID4gY2FudmFzLmNsaWVudEhlaWdodCAtIGJ1dHRvblNpemUpIHtcbiAgICAgIG9wdGlvbnNDYWxsYmFjayhldmVudCk7XG4gICAgfVxuICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgdXNlciBjbGlja2VkIG9uIChvciBhcm91bmQpIHRoZSBiYWNrIGljb25cbiAgICBlbHNlIGlmIChldmVudC5jbGllbnRYIDwgYnV0dG9uU2l6ZSAmJiBldmVudC5jbGllbnRZIDwgYnV0dG9uU2l6ZSkge1xuICAgICAgYmFja0NhbGxiYWNrKGV2ZW50KTtcbiAgICB9XG4gIH07XG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMubGlzdGVuZXIsIGZhbHNlKTtcbn07XG5cbi8qKlxuICogQnVpbGRzIHRoZSBVSSBtZXNoLlxuICovXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW1xuICAgIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HXG4gIF07XG5cbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcblxuICAgIHZhciBtaWRsaW5lID0gZ2wuZHJhd2luZ0J1ZmZlcldpZHRoIC8gMjtcblxuICAgIC8vIFRoZSBnbCBidWZmZXIgc2l6ZSB3aWxsIGxpa2VseSBiZSBzbWFsbGVyIHRoYW4gdGhlIHBoeXNpY2FsIHBpeGVsIGNvdW50LlxuICAgIC8vIFNvIHdlIG5lZWQgdG8gc2NhbGUgdGhlIGRwcyBkb3duIGJhc2VkIG9uIHRoZSBhY3R1YWwgYnVmZmVyIHNpemUgdnMgcGh5c2ljYWwgcGl4ZWwgY291bnQuXG4gICAgLy8gVGhpcyB3aWxsIHByb3Blcmx5IHNpemUgdGhlIHVpIGVsZW1lbnRzIG5vIG1hdHRlciB3aGF0IHRoZSBnbCBidWZmZXIgcmVzb2x1dGlvbiBpc1xuICAgIHZhciBwaHlzaWNhbFBpeGVscyA9IE1hdGgubWF4KHNjcmVlbi53aWR0aCwgc2NyZWVuLmhlaWdodCkgKiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbiAgICB2YXIgc2NhbGluZ1JhdGlvID0gZ2wuZHJhd2luZ0J1ZmZlcldpZHRoIC8gcGh5c2ljYWxQaXhlbHM7XG4gICAgdmFyIGRwcyA9IHNjYWxpbmdSYXRpbyAqICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcblxuICAgIHZhciBsaW5lV2lkdGggPSBrQ2VudGVyTGluZVRoaWNrbmVzc0RwICogZHBzIC8gMjtcbiAgICB2YXIgYnV0dG9uU2l6ZSA9IGtCdXR0b25XaWR0aERwICoga1RvdWNoU2xvcEZhY3RvciAqIGRwcztcbiAgICB2YXIgYnV0dG9uU2NhbGUgPSBrQnV0dG9uV2lkdGhEcCAqIGRwcyAvIDI7XG4gICAgdmFyIGJ1dHRvbkJvcmRlciA9ICgoa0J1dHRvbldpZHRoRHAgKiBrVG91Y2hTbG9wRmFjdG9yKSAtIGtCdXR0b25XaWR0aERwKSAqIGRwcztcblxuICAgIC8vIEJ1aWxkIGNlbnRlcmxpbmVcbiAgICB2ZXJ0aWNlcy5wdXNoKG1pZGxpbmUgLSBsaW5lV2lkdGgsIGJ1dHRvblNpemUpO1xuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSAtIGxpbmVXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG4gICAgdmVydGljZXMucHVzaChtaWRsaW5lICsgbGluZVdpZHRoLCBidXR0b25TaXplKTtcbiAgICB2ZXJ0aWNlcy5wdXNoKG1pZGxpbmUgKyBsaW5lV2lkdGgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQpO1xuXG4gICAgLy8gQnVpbGQgZ2VhclxuICAgIHNlbGYuZ2Vhck9mZnNldCA9ICh2ZXJ0aWNlcy5sZW5ndGggLyAyKTtcblxuICAgIGZ1bmN0aW9uIGFkZEdlYXJTZWdtZW50KHRoZXRhLCByKSB7XG4gICAgICB2YXIgYW5nbGUgPSAoOTAgLSB0aGV0YSkgKiBERUcyUkFEO1xuICAgICAgdmFyIHggPSBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICB2YXIgeSA9IE1hdGguc2luKGFuZ2xlKTtcbiAgICAgIHZlcnRpY2VzLnB1c2goa0lubmVyUmFkaXVzICogeCAqIGJ1dHRvblNjYWxlICsgbWlkbGluZSwga0lubmVyUmFkaXVzICogeSAqIGJ1dHRvblNjYWxlICsgYnV0dG9uU2NhbGUpO1xuICAgICAgdmVydGljZXMucHVzaChyICogeCAqIGJ1dHRvblNjYWxlICsgbWlkbGluZSwgciAqIHkgKiBidXR0b25TY2FsZSArIGJ1dHRvblNjYWxlKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSA2OyBpKyspIHtcbiAgICAgIHZhciBzZWdtZW50VGhldGEgPSBpICoga0FuZ2xlUGVyR2VhclNlY3Rpb247XG5cbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSwga091dGVyUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIGtPdXRlclJpbUVuZEFuZ2xlLCBrT3V0ZXJSYWRpdXMpO1xuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhICsga0lubmVyUmltQmVnaW5BbmdsZSwga01pZGRsZVJhZGl1cyk7XG4gICAgICBhZGRHZWFyU2VnbWVudChzZWdtZW50VGhldGEgKyAoa0FuZ2xlUGVyR2VhclNlY3Rpb24gLSBrSW5uZXJSaW1CZWdpbkFuZ2xlKSwga01pZGRsZVJhZGl1cyk7XG4gICAgICBhZGRHZWFyU2VnbWVudChzZWdtZW50VGhldGEgKyAoa0FuZ2xlUGVyR2VhclNlY3Rpb24gLSBrT3V0ZXJSaW1FbmRBbmdsZSksIGtPdXRlclJhZGl1cyk7XG4gICAgfVxuXG4gICAgc2VsZi5nZWFyVmVydGV4Q291bnQgPSAodmVydGljZXMubGVuZ3RoIC8gMikgLSBzZWxmLmdlYXJPZmZzZXQ7XG5cbiAgICAvLyBCdWlsZCBiYWNrIGFycm93XG4gICAgc2VsZi5hcnJvd09mZnNldCA9ICh2ZXJ0aWNlcy5sZW5ndGggLyAyKTtcblxuICAgIGZ1bmN0aW9uIGFkZEFycm93VmVydGV4KHgsIHkpIHtcbiAgICAgIHZlcnRpY2VzLnB1c2goYnV0dG9uQm9yZGVyICsgeCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCAtIGJ1dHRvbkJvcmRlciAtIHkpO1xuICAgIH1cblxuICAgIHZhciBhbmdsZWRMaW5lV2lkdGggPSBsaW5lV2lkdGggLyBNYXRoLnNpbig0NSAqIERFRzJSQUQpO1xuXG4gICAgYWRkQXJyb3dWZXJ0ZXgoMCwgYnV0dG9uU2NhbGUpO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlLCAwKTtcbiAgICBhZGRBcnJvd1ZlcnRleChidXR0b25TY2FsZSArIGFuZ2xlZExpbmVXaWR0aCwgYW5nbGVkTGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlICsgYW5nbGVkTGluZVdpZHRoKTtcblxuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgLSBhbmdsZWRMaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KDAsIGJ1dHRvblNjYWxlKTtcbiAgICBhZGRBcnJvd1ZlcnRleChidXR0b25TY2FsZSwgYnV0dG9uU2NhbGUgKiAyKTtcbiAgICBhZGRBcnJvd1ZlcnRleChidXR0b25TY2FsZSArIGFuZ2xlZExpbmVXaWR0aCwgKGJ1dHRvblNjYWxlICogMikgLSBhbmdsZWRMaW5lV2lkdGgpO1xuXG4gICAgYWRkQXJyb3dWZXJ0ZXgoYW5nbGVkTGluZVdpZHRoLCBidXR0b25TY2FsZSAtIGFuZ2xlZExpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoMCwgYnV0dG9uU2NhbGUpO1xuXG4gICAgYWRkQXJyb3dWZXJ0ZXgoYW5nbGVkTGluZVdpZHRoLCBidXR0b25TY2FsZSAtIGxpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoa0J1dHRvbldpZHRoRHAgKiBkcHMsIGJ1dHRvblNjYWxlIC0gbGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlICsgbGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleChrQnV0dG9uV2lkdGhEcCAqIGRwcywgYnV0dG9uU2NhbGUgKyBsaW5lV2lkdGgpO1xuXG4gICAgc2VsZi5hcnJvd1ZlcnRleENvdW50ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpIC0gc2VsZi5hcnJvd09mZnNldDtcblxuICAgIC8vIEJ1ZmZlciBkYXRhXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHNlbGYudmVydGV4QnVmZmVyKTtcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh2ZXJ0aWNlcyksIGdsLlNUQVRJQ19EUkFXKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGRpc3RvcnRpb24gcGFzcyBvbiB0aGUgaW5qZWN0ZWQgYmFja2J1ZmZlciwgcmVuZGVyaW5nIGl0IHRvIHRoZSByZWFsXG4gKiBiYWNrYnVmZmVyLlxuICovXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZ2xTdGF0ZSA9IFtcbiAgICBnbC5DVUxMX0ZBQ0UsXG4gICAgZ2wuREVQVEhfVEVTVCxcbiAgICBnbC5CTEVORCxcbiAgICBnbC5TQ0lTU09SX1RFU1QsXG4gICAgZ2wuU1RFTkNJTF9URVNULFxuICAgIGdsLkNPTE9SX1dSSVRFTUFTSyxcbiAgICBnbC5WSUVXUE9SVCxcblxuICAgIGdsLkNVUlJFTlRfUFJPR1JBTSxcbiAgICBnbC5BUlJBWV9CVUZGRVJfQklORElOR1xuICBdO1xuXG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgLy8gTWFrZSBzdXJlIHRoZSBHTCBzdGF0ZSBpcyBpbiBhIGdvb2QgcGxhY2VcbiAgICBnbC5kaXNhYmxlKGdsLkNVTExfRkFDRSk7XG4gICAgZ2wuZGlzYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICBnbC5kaXNhYmxlKGdsLkJMRU5EKTtcbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuZGlzYWJsZShnbC5TVEVOQ0lMX1RFU1QpO1xuICAgIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKTtcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBnbC5kcmF3aW5nQnVmZmVyV2lkdGgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQpO1xuXG4gICAgc2VsZi5yZW5kZXJOb1N0YXRlKCk7XG4gIH0pO1xufTtcblxuQ2FyZGJvYXJkVUkucHJvdG90eXBlLnJlbmRlck5vU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcblxuICAvLyBCaW5kIGRpc3RvcnRpb24gcHJvZ3JhbSBhbmQgbWVzaFxuICBnbC51c2VQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG5cbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyKTtcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGhpcy5hdHRyaWJzLnBvc2l0aW9uKTtcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcih0aGlzLmF0dHJpYnMucG9zaXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgOCwgMCk7XG5cbiAgZ2wudW5pZm9ybTRmKHRoaXMudW5pZm9ybXMuY29sb3IsIDEuMCwgMS4wLCAxLjAsIDEuMCk7XG5cbiAgVXRpbC5vcnRob01hdHJpeCh0aGlzLnByb2pNYXQsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgMCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCwgMC4xLCAxMDI0LjApO1xuICBnbC51bmlmb3JtTWF0cml4NGZ2KHRoaXMudW5pZm9ybXMucHJvamVjdGlvbk1hdCwgZmFsc2UsIHRoaXMucHJvak1hdCk7XG5cbiAgLy8gRHJhd3MgVUkgZWxlbWVudFxuICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFX1NUUklQLCAwLCA0KTtcbiAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRV9TVFJJUCwgdGhpcy5nZWFyT2Zmc2V0LCB0aGlzLmdlYXJWZXJ0ZXhDb3VudCk7XG4gIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIHRoaXMuYXJyb3dPZmZzZXQsIHRoaXMuYXJyb3dWZXJ0ZXhDb3VudCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcmRib2FyZFVJO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIENhcmRib2FyZERpc3RvcnRlciA9IHJlcXVpcmUoJy4vY2FyZGJvYXJkLWRpc3RvcnRlci5qcycpO1xudmFyIENhcmRib2FyZFVJID0gcmVxdWlyZSgnLi9jYXJkYm9hcmQtdWkuanMnKTtcbnZhciBEZXZpY2VJbmZvID0gcmVxdWlyZSgnLi9kZXZpY2UtaW5mby5qcycpO1xudmFyIERwZGIgPSByZXF1aXJlKCcuL2RwZGIvZHBkYi5qcycpO1xudmFyIEZ1c2lvblBvc2VTZW5zb3IgPSByZXF1aXJlKCcuL3NlbnNvci1mdXNpb24vZnVzaW9uLXBvc2Utc2Vuc29yLmpzJyk7XG52YXIgUm90YXRlSW5zdHJ1Y3Rpb25zID0gcmVxdWlyZSgnLi9yb3RhdGUtaW5zdHJ1Y3Rpb25zLmpzJyk7XG52YXIgVmlld2VyU2VsZWN0b3IgPSByZXF1aXJlKCcuL3ZpZXdlci1zZWxlY3Rvci5qcycpO1xudmFyIFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRGlzcGxheTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbnZhciBFeWUgPSB7XG4gIExFRlQ6ICdsZWZ0JyxcbiAgUklHSFQ6ICdyaWdodCdcbn07XG5cbi8qKlxuICogVlJEaXNwbGF5IGJhc2VkIG9uIG1vYmlsZSBkZXZpY2UgcGFyYW1ldGVycyBhbmQgRGV2aWNlTW90aW9uIEFQSXMuXG4gKi9cbmZ1bmN0aW9uIENhcmRib2FyZFZSRGlzcGxheSgpIHtcbiAgdGhpcy5kaXNwbGF5TmFtZSA9ICdDYXJkYm9hcmQgVlJEaXNwbGF5ICh3ZWJ2ci1wb2x5ZmlsbCknO1xuXG4gIHRoaXMuY2FwYWJpbGl0aWVzLmhhc09yaWVudGF0aW9uID0gdHJ1ZTtcbiAgdGhpcy5jYXBhYmlsaXRpZXMuY2FuUHJlc2VudCA9IHRydWU7XG5cbiAgLy8gXCJQcml2YXRlXCIgbWVtYmVycy5cbiAgdGhpcy5idWZmZXJTY2FsZV8gPSB3aW5kb3cuV2ViVlJDb25maWcuQlVGRkVSX1NDQUxFO1xuICB0aGlzLnBvc2VTZW5zb3JfID0gbmV3IEZ1c2lvblBvc2VTZW5zb3IoKTtcbiAgdGhpcy5kaXN0b3J0ZXJfID0gbnVsbDtcbiAgdGhpcy5jYXJkYm9hcmRVSV8gPSBudWxsO1xuXG4gIHRoaXMuZHBkYl8gPSBuZXcgRHBkYih0cnVlLCB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZF8uYmluZCh0aGlzKSk7XG4gIHRoaXMuZGV2aWNlSW5mb18gPSBuZXcgRGV2aWNlSW5mbyh0aGlzLmRwZGJfLmdldERldmljZVBhcmFtcygpKTtcblxuICB0aGlzLnZpZXdlclNlbGVjdG9yXyA9IG5ldyBWaWV3ZXJTZWxlY3RvcigpO1xuICB0aGlzLnZpZXdlclNlbGVjdG9yXy5vbkNoYW5nZSh0aGlzLm9uVmlld2VyQ2hhbmdlZF8uYmluZCh0aGlzKSk7XG5cbiAgLy8gU2V0IHRoZSBjb3JyZWN0IGluaXRpYWwgdmlld2VyLlxuICB0aGlzLmRldmljZUluZm9fLnNldFZpZXdlcih0aGlzLnZpZXdlclNlbGVjdG9yXy5nZXRDdXJyZW50Vmlld2VyKCkpO1xuXG4gIGlmICghd2luZG93LldlYlZSQ29uZmlnLlJPVEFURV9JTlNUUlVDVElPTlNfRElTQUJMRUQpIHtcbiAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18gPSBuZXcgUm90YXRlSW5zdHJ1Y3Rpb25zKCk7XG4gIH1cblxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgLy8gTGlzdGVuIGZvciByZXNpemUgZXZlbnRzIHRvIHdvcmthcm91bmQgdGhpcyBhd2Z1bCBTYWZhcmkgYnVnLlxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uUmVzaXplXy5iaW5kKHRoaXMpKTtcbiAgfVxufVxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZSA9IG5ldyBWUkRpc3BsYXkoKTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRJbW1lZGlhdGVQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246IHRoaXMucG9zZVNlbnNvcl8uZ2V0UG9zaXRpb24oKSxcbiAgICBvcmllbnRhdGlvbjogdGhpcy5wb3NlU2Vuc29yXy5nZXRPcmllbnRhdGlvbigpLFxuICAgIGxpbmVhclZlbG9jaXR5OiBudWxsLFxuICAgIGxpbmVhckFjY2VsZXJhdGlvbjogbnVsbCxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG51bGwsXG4gICAgYW5ndWxhckFjY2VsZXJhdGlvbjogbnVsbFxuICB9O1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5yZXNldFBvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wb3NlU2Vuc29yXy5yZXNldFBvc2UoKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZ2V0RXllUGFyYW1ldGVycyA9IGZ1bmN0aW9uKHdoaWNoRXllKSB7XG4gIHZhciBvZmZzZXQgPSBbdGhpcy5kZXZpY2VJbmZvXy52aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgKiAwLjUsIDAuMCwgMC4wXTtcbiAgdmFyIGZpZWxkT2ZWaWV3O1xuXG4gIC8vIFRPRE86IEZvViBjYW4gYmUgYSBsaXR0bGUgZXhwZW5zaXZlIHRvIGNvbXB1dGUuIENhY2hlIHdoZW4gZGV2aWNlIHBhcmFtcyBjaGFuZ2UuXG4gIGlmICh3aGljaEV5ZSA9PSBFeWUuTEVGVCkge1xuICAgIG9mZnNldFswXSAqPSAtMS4wO1xuICAgIGZpZWxkT2ZWaWV3ID0gdGhpcy5kZXZpY2VJbmZvXy5nZXRGaWVsZE9mVmlld0xlZnRFeWUoKTtcbiAgfSBlbHNlIGlmICh3aGljaEV5ZSA9PSBFeWUuUklHSFQpIHtcbiAgICBmaWVsZE9mVmlldyA9IHRoaXMuZGV2aWNlSW5mb18uZ2V0RmllbGRPZlZpZXdSaWdodEV5ZSgpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgZXllIHByb3ZpZGVkOiAlcycsIHdoaWNoRXllKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZmllbGRPZlZpZXc6IGZpZWxkT2ZWaWV3LFxuICAgIG9mZnNldDogb2Zmc2V0LFxuICAgIC8vIFRPRE86IFNob3VsZCBiZSBhYmxlIHRvIHByb3ZpZGUgYmV0dGVyIHZhbHVlcyB0aGFuIHRoZXNlLlxuICAgIHJlbmRlcldpZHRoOiB0aGlzLmRldmljZUluZm9fLmRldmljZS53aWR0aCAqIDAuNSAqIHRoaXMuYnVmZmVyU2NhbGVfLFxuICAgIHJlbmRlckhlaWdodDogdGhpcy5kZXZpY2VJbmZvXy5kZXZpY2UuaGVpZ2h0ICogdGhpcy5idWZmZXJTY2FsZV8sXG4gIH07XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uRGV2aWNlUGFyYW1zVXBkYXRlZF8gPSBmdW5jdGlvbihuZXdQYXJhbXMpIHtcbiAgaWYgKFV0aWwuaXNEZWJ1ZygpKSB7XG4gICAgY29uc29sZS5sb2coJ0RQREIgcmVwb3J0ZWQgdGhhdCBkZXZpY2UgcGFyYW1zIHdlcmUgdXBkYXRlZC4nKTtcbiAgfVxuICB0aGlzLmRldmljZUluZm9fLnVwZGF0ZURldmljZVBhcmFtcyhuZXdQYXJhbXMpO1xuXG4gIGlmICh0aGlzLmRpc3RvcnRlcl8pIHtcbiAgICB0aGlzLmRpc3RvcnRlcl8udXBkYXRlRGV2aWNlSW5mbyh0aGlzLmRldmljZUluZm9fKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS51cGRhdGVCb3VuZHNfID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5sYXllcl8gJiYgdGhpcy5kaXN0b3J0ZXJfICYmICh0aGlzLmxheWVyXy5sZWZ0Qm91bmRzIHx8IHRoaXMubGF5ZXJfLnJpZ2h0Qm91bmRzKSkge1xuICAgIHRoaXMuZGlzdG9ydGVyXy5zZXRUZXh0dXJlQm91bmRzKHRoaXMubGF5ZXJfLmxlZnRCb3VuZHMsIHRoaXMubGF5ZXJfLnJpZ2h0Qm91bmRzKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5iZWdpblByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMubGF5ZXJfLnNvdXJjZS5nZXRDb250ZXh0KCd3ZWJnbCcpO1xuICBpZiAoIWdsKVxuICAgIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpO1xuICBpZiAoIWdsKVxuICAgIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsMicpO1xuXG4gIGlmICghZ2wpXG4gICAgcmV0dXJuOyAvLyBDYW4ndCBkbyBkaXN0b3J0aW9uIHdpdGhvdXQgYSBXZWJHTCBjb250ZXh0LlxuXG4gIC8vIFByb3ZpZGVzIGEgd2F5IHRvIG9wdCBvdXQgb2YgZGlzdG9ydGlvblxuICBpZiAodGhpcy5sYXllcl8ucHJlZGlzdG9ydGVkKSB7XG4gICAgaWYgKCF3aW5kb3cuV2ViVlJDb25maWcuQ0FSREJPQVJEX1VJX0RJU0FCTEVEKSB7XG4gICAgICBnbC5jYW52YXMud2lkdGggPSBVdGlsLmdldFNjcmVlbldpZHRoKCkgKiB0aGlzLmJ1ZmZlclNjYWxlXztcbiAgICAgIGdsLmNhbnZhcy5oZWlnaHQgPSBVdGlsLmdldFNjcmVlbkhlaWdodCgpICogdGhpcy5idWZmZXJTY2FsZV87XG4gICAgICB0aGlzLmNhcmRib2FyZFVJXyA9IG5ldyBDYXJkYm9hcmRVSShnbCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIENyZWF0ZSBhIG5ldyBkaXN0b3J0ZXIgZm9yIHRoZSB0YXJnZXQgY29udGV4dFxuICAgIHRoaXMuZGlzdG9ydGVyXyA9IG5ldyBDYXJkYm9hcmREaXN0b3J0ZXIoZ2wpO1xuICAgIHRoaXMuZGlzdG9ydGVyXy51cGRhdGVEZXZpY2VJbmZvKHRoaXMuZGV2aWNlSW5mb18pO1xuICAgIHRoaXMuY2FyZGJvYXJkVUlfID0gdGhpcy5kaXN0b3J0ZXJfLmNhcmRib2FyZFVJO1xuICB9XG5cbiAgaWYgKHRoaXMuY2FyZGJvYXJkVUlfKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8ubGlzdGVuKGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIE9wdGlvbnMgY2xpY2tlZC5cbiAgICAgIHRoaXMudmlld2VyU2VsZWN0b3JfLnNob3codGhpcy5sYXllcl8uc291cmNlLnBhcmVudEVsZW1lbnQpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9LmJpbmQodGhpcyksIGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIEJhY2sgY2xpY2tlZC5cbiAgICAgIHRoaXMuZXhpdFByZXNlbnQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIGlmICh0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18pIHtcbiAgICBpZiAoVXRpbC5pc0xhbmRzY2FwZU1vZGUoKSAmJiBVdGlsLmlzTW9iaWxlKCkpIHtcbiAgICAgIC8vIEluIGxhbmRzY2FwZSBtb2RlLCB0ZW1wb3JhcmlseSBzaG93IHRoZSBcInB1dCBpbnRvIENhcmRib2FyZFwiXG4gICAgICAvLyBpbnRlcnN0aXRpYWwuIE90aGVyd2lzZSwgZG8gdGhlIGRlZmF1bHQgdGhpbmcuXG4gICAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18uc2hvd1RlbXBvcmFyaWx5KDMwMDAsIHRoaXMubGF5ZXJfLnNvdXJjZS5wYXJlbnRFbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfLnVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIExpc3RlbiBmb3Igb3JpZW50YXRpb24gY2hhbmdlIGV2ZW50cyBpbiBvcmRlciB0byBzaG93IGludGVyc3RpdGlhbC5cbiAgdGhpcy5vcmllbnRhdGlvbkhhbmRsZXIgPSB0aGlzLm9uT3JpZW50YXRpb25DaGFuZ2VfLmJpbmQodGhpcyk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub3JpZW50YXRpb25IYW5kbGVyKTtcblxuICAvLyBMaXN0ZW4gZm9yIHByZXNlbnQgZGlzcGxheSBjaGFuZ2UgZXZlbnRzIGluIG9yZGVyIHRvIHVwZGF0ZSBkaXN0b3J0ZXIgZGltZW5zaW9uc1xuICB0aGlzLnZyZGlzcGxheXByZXNlbnRjaGFuZ2VIYW5kbGVyID0gdGhpcy51cGRhdGVCb3VuZHNfLmJpbmQodGhpcyk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd2cmRpc3BsYXlwcmVzZW50Y2hhbmdlJywgdGhpcy52cmRpc3BsYXlwcmVzZW50Y2hhbmdlSGFuZGxlcik7XG5cbiAgLy8gRmlyZSB0aGlzIGV2ZW50IGluaXRpYWxseSwgdG8gZ2l2ZSBnZW9tZXRyeS1kaXN0b3J0aW9uIGNsaWVudHMgdGhlIGNoYW5jZVxuICAvLyB0byBkbyBzb21ldGhpbmcgY3VzdG9tLlxuICB0aGlzLmZpcmVWUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfKCk7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmVuZFByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRpc3RvcnRlcl8pIHtcbiAgICB0aGlzLmRpc3RvcnRlcl8uZGVzdHJveSgpO1xuICAgIHRoaXMuZGlzdG9ydGVyXyA9IG51bGw7XG4gIH1cbiAgaWYgKHRoaXMuY2FyZGJvYXJkVUlfKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8uZGVzdHJveSgpO1xuICAgIHRoaXMuY2FyZGJvYXJkVUlfID0gbnVsbDtcbiAgfVxuXG4gIGlmICh0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18pIHtcbiAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18uaGlkZSgpO1xuICB9XG4gIHRoaXMudmlld2VyU2VsZWN0b3JfLmhpZGUoKTtcblxuICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCB0aGlzLm9yaWVudGF0aW9uSGFuZGxlcik7XG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd2cmRpc3BsYXlwcmVzZW50Y2hhbmdlJywgdGhpcy52cmRpc3BsYXlwcmVzZW50Y2hhbmdlSGFuZGxlcik7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLnN1Ym1pdEZyYW1lID0gZnVuY3Rpb24ocG9zZSkge1xuICBpZiAodGhpcy5kaXN0b3J0ZXJfKSB7XG4gICAgdGhpcy51cGRhdGVCb3VuZHNfKCk7XG4gICAgdGhpcy5kaXN0b3J0ZXJfLnN1Ym1pdEZyYW1lKCk7XG4gIH0gZWxzZSBpZiAodGhpcy5jYXJkYm9hcmRVSV8gJiYgdGhpcy5sYXllcl8pIHtcbiAgICAvLyBIYWNrIGZvciBwcmVkaXN0b3J0ZWQ6IHRydWUuXG4gICAgdmFyIGNhbnZhcyA9IHRoaXMubGF5ZXJfLnNvdXJjZS5nZXRDb250ZXh0KCd3ZWJnbCcpLmNhbnZhcztcbiAgICBpZiAoY2FudmFzLndpZHRoICE9IHRoaXMubGFzdFdpZHRoIHx8IGNhbnZhcy5oZWlnaHQgIT0gdGhpcy5sYXN0SGVpZ2h0KSB7XG4gICAgICB0aGlzLmNhcmRib2FyZFVJXy5vblJlc2l6ZSgpO1xuICAgIH1cbiAgICB0aGlzLmxhc3RXaWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICB0aGlzLmxhc3RIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuXG4gICAgLy8gUmVuZGVyIHRoZSBDYXJkYm9hcmQgVUkuXG4gICAgdGhpcy5jYXJkYm9hcmRVSV8ucmVuZGVyKCk7XG4gIH1cbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25PcmllbnRhdGlvbkNoYW5nZV8gPSBmdW5jdGlvbihlKSB7XG4gIC8vIEhpZGUgdGhlIHZpZXdlciBzZWxlY3Rvci5cbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uaGlkZSgpO1xuXG4gIC8vIFVwZGF0ZSB0aGUgcm90YXRlIGluc3RydWN0aW9ucy5cbiAgaWYgKHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXykge1xuICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy51cGRhdGUoKTtcbiAgfVxuXG4gIHRoaXMub25SZXNpemVfKCk7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uUmVzaXplXyA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKHRoaXMubGF5ZXJfKSB7XG4gICAgdmFyIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsJyk7XG4gICAgLy8gU2l6ZSB0aGUgQ1NTIGNhbnZhcy5cbiAgICAvLyBBZGRlZCBwYWRkaW5nIG9uIHJpZ2h0IGFuZCBib3R0b20gYmVjYXVzZSBpUGhvbmUgNSB3aWxsIG5vdFxuICAgIC8vIGhpZGUgdGhlIFVSTCBiYXIgdW5sZXNzIGNvbnRlbnQgaXMgYmlnZ2VyIHRoYW4gdGhlIHNjcmVlbi5cbiAgICAvLyBUaGlzIHdpbGwgbm90IGJlIHZpc2libGUgYXMgbG9uZyBhcyB0aGUgY29udGFpbmVyIGVsZW1lbnQgKGUuZy4gYm9keSlcbiAgICAvLyBpcyBzZXQgdG8gJ292ZXJmbG93OiBoaWRkZW4nLlxuICAgIC8vIEFkZGl0aW9uYWxseSwgJ2JveC1zaXppbmc6IGNvbnRlbnQtYm94JyBlbnN1cmVzIHJlbmRlcldpZHRoID0gd2lkdGggKyBwYWRkaW5nLlxuICAgIC8vIFRoaXMgaXMgcmVxdWlyZWQgd2hlbiAnYm94LXNpemluZzogYm9yZGVyLWJveCcgaXMgdXNlZCBlbHNld2hlcmUgaW4gdGhlIHBhZ2UuXG4gICAgdmFyIGNzc1Byb3BlcnRpZXMgPSBbXG4gICAgICAncG9zaXRpb246IGFic29sdXRlJyxcbiAgICAgICd0b3A6IDAnLFxuICAgICAgJ2xlZnQ6IDAnLFxuICAgICAgJ3dpZHRoOiAnICsgTWF0aC5tYXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KSArICdweCcsXG4gICAgICAnaGVpZ2h0OiAnICsgTWF0aC5taW4oc2NyZWVuLmhlaWdodCwgc2NyZWVuLndpZHRoKSArICdweCcsXG4gICAgICAnYm9yZGVyOiAwJyxcbiAgICAgICdtYXJnaW46IDAnLFxuICAgICAgJ3BhZGRpbmc6IDAgMTBweCAxMHB4IDAnLFxuICAgICAgJ2JveC1zaXppbmc6IGNvbnRlbnQtYm94JyxcbiAgICBdO1xuICAgIGdsLmNhbnZhcy5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgY3NzUHJvcGVydGllcy5qb2luKCc7ICcpICsgJzsnKTtcblxuICAgIFV0aWwuc2FmYXJpQ3NzU2l6ZVdvcmthcm91bmQoZ2wuY2FudmFzKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vblZpZXdlckNoYW5nZWRfID0gZnVuY3Rpb24odmlld2VyKSB7XG4gIHRoaXMuZGV2aWNlSW5mb18uc2V0Vmlld2VyKHZpZXdlcik7XG5cbiAgaWYgKHRoaXMuZGlzdG9ydGVyXykge1xuICAgIC8vIFVwZGF0ZSB0aGUgZGlzdG9ydGlvbiBhcHByb3ByaWF0ZWx5LlxuICAgIHRoaXMuZGlzdG9ydGVyXy51cGRhdGVEZXZpY2VJbmZvKHRoaXMuZGV2aWNlSW5mb18pO1xuICB9XG5cbiAgLy8gRmlyZSBhIG5ldyBldmVudCBjb250YWluaW5nIHZpZXdlciBhbmQgZGV2aWNlIHBhcmFtZXRlcnMgZm9yIGNsaWVudHMgdGhhdFxuICAvLyB3YW50IHRvIGltcGxlbWVudCB0aGVpciBvd24gZ2VvbWV0cnktYmFzZWQgZGlzdG9ydGlvbi5cbiAgdGhpcy5maXJlVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXygpO1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5maXJlVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ3ZyZGlzcGxheWRldmljZXBhcmFtc2NoYW5nZScsIHtcbiAgICBkZXRhaWw6IHtcbiAgICAgIHZyZGlzcGxheTogdGhpcyxcbiAgICAgIGRldmljZUluZm86IHRoaXMuZGV2aWNlSW5mb18sXG4gICAgfVxuICB9KTtcbiAgd2luZG93LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYXJkYm9hcmRWUkRpc3BsYXk7XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNiwgQnJhbmRvbiBKb25lcy5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS90b2ppL3dlYmdsLXV0aWxzL2Jsb2IvbWFzdGVyL3NyYy93Z2x1LXByZXNlcnZlLXN0YXRlLmpzXG4gKiBMSUNFTlNFOiBodHRwczovL2dpdGh1Yi5jb20vdG9qaS93ZWJnbC11dGlscy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuZnVuY3Rpb24gV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgYmluZGluZ3MsIGNhbGxiYWNrKSB7XG4gIGlmICghYmluZGluZ3MpIHtcbiAgICBjYWxsYmFjayhnbCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGJvdW5kVmFsdWVzID0gW107XG5cbiAgdmFyIGFjdGl2ZVRleHR1cmUgPSBudWxsO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tpXTtcbiAgICBzd2l0Y2ggKGJpbmRpbmcpIHtcbiAgICAgIGNhc2UgZ2wuVEVYVFVSRV9CSU5ESU5HXzJEOlxuICAgICAgY2FzZSBnbC5URVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVA6XG4gICAgICAgIHZhciB0ZXh0dXJlVW5pdCA9IGJpbmRpbmdzWysraV07XG4gICAgICAgIGlmICh0ZXh0dXJlVW5pdCA8IGdsLlRFWFRVUkUwIHx8IHRleHR1cmVVbml0ID4gZ2wuVEVYVFVSRTMxKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlRFWFRVUkVfQklORElOR18yRCBvciBURVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVAgbXVzdCBiZSBmb2xsb3dlZCBieSBhIHZhbGlkIHRleHR1cmUgdW5pdFwiKTtcbiAgICAgICAgICBib3VuZFZhbHVlcy5wdXNoKG51bGwsIG51bGwpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYWN0aXZlVGV4dHVyZSkge1xuICAgICAgICAgIGFjdGl2ZVRleHR1cmUgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQUNUSVZFX1RFWFRVUkUpO1xuICAgICAgICB9XG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUodGV4dHVyZVVuaXQpO1xuICAgICAgICBib3VuZFZhbHVlcy5wdXNoKGdsLmdldFBhcmFtZXRlcihiaW5kaW5nKSwgbnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5BQ1RJVkVfVEVYVFVSRTpcbiAgICAgICAgYWN0aXZlVGV4dHVyZSA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSk7XG4gICAgICAgIGJvdW5kVmFsdWVzLnB1c2gobnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYm91bmRWYWx1ZXMucHVzaChnbC5nZXRQYXJhbWV0ZXIoYmluZGluZykpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBjYWxsYmFjayhnbCk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaW5kaW5ncy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBiaW5kaW5nID0gYmluZGluZ3NbaV07XG4gICAgdmFyIGJvdW5kVmFsdWUgPSBib3VuZFZhbHVlc1tpXTtcbiAgICBzd2l0Y2ggKGJpbmRpbmcpIHtcbiAgICAgIGNhc2UgZ2wuQUNUSVZFX1RFWFRVUkU6XG4gICAgICAgIGJyZWFrOyAvLyBJZ25vcmUgdGhpcyBiaW5kaW5nLCBzaW5jZSB3ZSBzcGVjaWFsLWNhc2UgaXQgdG8gaGFwcGVuIGxhc3QuXG4gICAgICBjYXNlIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HOlxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5DT0xPUl9DTEVBUl9WQUxVRTpcbiAgICAgICAgZ2wuY2xlYXJDb2xvcihib3VuZFZhbHVlWzBdLCBib3VuZFZhbHVlWzFdLCBib3VuZFZhbHVlWzJdLCBib3VuZFZhbHVlWzNdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkNPTE9SX1dSSVRFTUFTSzpcbiAgICAgICAgZ2wuY29sb3JNYXNrKGJvdW5kVmFsdWVbMF0sIGJvdW5kVmFsdWVbMV0sIGJvdW5kVmFsdWVbMl0sIGJvdW5kVmFsdWVbM10pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQ1VSUkVOVF9QUk9HUkFNOlxuICAgICAgICBnbC51c2VQcm9ncmFtKGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVJfQklORElORzpcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5GUkFNRUJVRkZFUl9CSU5ESU5HOlxuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuUkVOREVSQlVGRkVSX0JJTkRJTkc6XG4gICAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLlRFWFRVUkVfQklORElOR18yRDpcbiAgICAgICAgdmFyIHRleHR1cmVVbml0ID0gYmluZGluZ3NbKytpXTtcbiAgICAgICAgaWYgKHRleHR1cmVVbml0IDwgZ2wuVEVYVFVSRTAgfHwgdGV4dHVyZVVuaXQgPiBnbC5URVhUVVJFMzEpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUodGV4dHVyZVVuaXQpO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLlRFWFRVUkVfQklORElOR19DVUJFX01BUDpcbiAgICAgICAgdmFyIHRleHR1cmVVbml0ID0gYmluZGluZ3NbKytpXTtcbiAgICAgICAgaWYgKHRleHR1cmVVbml0IDwgZ2wuVEVYVFVSRTAgfHwgdGV4dHVyZVVuaXQgPiBnbC5URVhUVVJFMzEpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUodGV4dHVyZVVuaXQpO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLlZJRVdQT1JUOlxuICAgICAgICBnbC52aWV3cG9ydChib3VuZFZhbHVlWzBdLCBib3VuZFZhbHVlWzFdLCBib3VuZFZhbHVlWzJdLCBib3VuZFZhbHVlWzNdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkJMRU5EOlxuICAgICAgY2FzZSBnbC5DVUxMX0ZBQ0U6XG4gICAgICBjYXNlIGdsLkRFUFRIX1RFU1Q6XG4gICAgICBjYXNlIGdsLlNDSVNTT1JfVEVTVDpcbiAgICAgIGNhc2UgZ2wuU1RFTkNJTF9URVNUOlxuICAgICAgICBpZiAoYm91bmRWYWx1ZSkge1xuICAgICAgICAgIGdsLmVuYWJsZShiaW5kaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBnbC5kaXNhYmxlKGJpbmRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5sb2coXCJObyBHTCByZXN0b3JlIGJlaGF2aW9yIGZvciAweFwiICsgYmluZGluZy50b1N0cmluZygxNikpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoYWN0aXZlVGV4dHVyZSkge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShhY3RpdmVUZXh0dXJlKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXR0xVUHJlc2VydmVHTFN0YXRlO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIERpc3RvcnRpb24gPSByZXF1aXJlKCcuL2Rpc3RvcnRpb24vZGlzdG9ydGlvbi5qcycpO1xudmFyIE1hdGhVdGlsID0gcmVxdWlyZSgnLi9tYXRoLXV0aWwuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbmZ1bmN0aW9uIERldmljZShwYXJhbXMpIHtcbiAgdGhpcy53aWR0aCA9IHBhcmFtcy53aWR0aCB8fCBVdGlsLmdldFNjcmVlbldpZHRoKCk7XG4gIHRoaXMuaGVpZ2h0ID0gcGFyYW1zLmhlaWdodCB8fCBVdGlsLmdldFNjcmVlbkhlaWdodCgpO1xuICB0aGlzLndpZHRoTWV0ZXJzID0gcGFyYW1zLndpZHRoTWV0ZXJzO1xuICB0aGlzLmhlaWdodE1ldGVycyA9IHBhcmFtcy5oZWlnaHRNZXRlcnM7XG4gIHRoaXMuYmV2ZWxNZXRlcnMgPSBwYXJhbXMuYmV2ZWxNZXRlcnM7XG59XG5cblxuLy8gRmFsbGJhY2sgQW5kcm9pZCBkZXZpY2UgKGJhc2VkIG9uIE5leHVzIDUgbWVhc3VyZW1lbnRzKSBmb3IgdXNlIHdoZW5cbi8vIHdlIGNhbid0IHJlY29nbml6ZSBhbiBBbmRyb2lkIGRldmljZS5cbnZhciBERUZBVUxUX0FORFJPSUQgPSBuZXcgRGV2aWNlKHtcbiAgd2lkdGhNZXRlcnM6IDAuMTEwLFxuICBoZWlnaHRNZXRlcnM6IDAuMDYyLFxuICBiZXZlbE1ldGVyczogMC4wMDRcbn0pO1xuXG4vLyBGYWxsYmFjayBpT1MgZGV2aWNlIChiYXNlZCBvbiBpUGhvbmU2KSBmb3IgdXNlIHdoZW5cbi8vIHdlIGNhbid0IHJlY29nbml6ZSBhbiBBbmRyb2lkIGRldmljZS5cbnZhciBERUZBVUxUX0lPUyA9IG5ldyBEZXZpY2Uoe1xuICB3aWR0aE1ldGVyczogMC4xMDM4LFxuICBoZWlnaHRNZXRlcnM6IDAuMDU4NCxcbiAgYmV2ZWxNZXRlcnM6IDAuMDA0XG59KTtcblxuXG52YXIgVmlld2VycyA9IHtcbiAgQ2FyZGJvYXJkVjE6IG5ldyBDYXJkYm9hcmRWaWV3ZXIoe1xuICAgIGlkOiAnQ2FyZGJvYXJkVjEnLFxuICAgIGxhYmVsOiAnQ2FyZGJvYXJkIEkvTyAyMDE0JyxcbiAgICBmb3Y6IDQwLFxuICAgIGludGVyTGVuc0Rpc3RhbmNlOiAwLjA2MCxcbiAgICBiYXNlbGluZUxlbnNEaXN0YW5jZTogMC4wMzUsXG4gICAgc2NyZWVuTGVuc0Rpc3RhbmNlOiAwLjA0MixcbiAgICBkaXN0b3J0aW9uQ29lZmZpY2llbnRzOiBbMC40NDEsIDAuMTU2XSxcbiAgICBpbnZlcnNlQ29lZmZpY2llbnRzOiBbLTAuNDQxMDAzNSwgMC40Mjc1NjE1NSwgLTAuNDgwNDQzOSwgMC41NDYwMTM5LFxuICAgICAgLTAuNTg4MjExODMsIDAuNTczMzkzOCwgLTAuNDgzMDMyMDIsIDAuMzMyOTkwODMsIC0wLjE3NTczODQxLFxuICAgICAgMC4wNjUxNzcyLCAtMC4wMTQ4ODk2MywgMC4wMDE1NTk4MzRdXG4gIH0pLFxuICBDYXJkYm9hcmRWMjogbmV3IENhcmRib2FyZFZpZXdlcih7XG4gICAgaWQ6ICdDYXJkYm9hcmRWMicsXG4gICAgbGFiZWw6ICdDYXJkYm9hcmQgSS9PIDIwMTUnLFxuICAgIGZvdjogNjAsXG4gICAgaW50ZXJMZW5zRGlzdGFuY2U6IDAuMDY0LFxuICAgIGJhc2VsaW5lTGVuc0Rpc3RhbmNlOiAwLjAzNSxcbiAgICBzY3JlZW5MZW5zRGlzdGFuY2U6IDAuMDM5LFxuICAgIGRpc3RvcnRpb25Db2VmZmljaWVudHM6IFswLjM0LCAwLjU1XSxcbiAgICBpbnZlcnNlQ29lZmZpY2llbnRzOiBbLTAuMzM4MzY3MDQsIC0wLjE4MTYyMTg1LCAwLjg2MjY1NSwgLTEuMjQ2MjA1MSxcbiAgICAgIDEuMDU2MDYwMiwgLTAuNTgyMDgzMTcsIDAuMjE2MDkwNzgsIC0wLjA1NDQ0ODIzLCAwLjAwOTE3Nzk1NixcbiAgICAgIC05LjkwNDE2OUUtNCwgNi4xODM1MzVFLTUsIC0xLjY5ODE4MDNFLTZdXG4gIH0pXG59O1xuXG5cbnZhciBERUZBVUxUX0xFRlRfQ0VOVEVSID0ge3g6IDAuNSwgeTogMC41fTtcbnZhciBERUZBVUxUX1JJR0hUX0NFTlRFUiA9IHt4OiAwLjUsIHk6IDAuNX07XG5cbi8qKlxuICogTWFuYWdlcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZGV2aWNlIGFuZCB0aGUgdmlld2VyLlxuICpcbiAqIGRldmljZVBhcmFtcyBpbmRpY2F0ZXMgdGhlIHBhcmFtZXRlcnMgb2YgdGhlIGRldmljZSB0byB1c2UgKGdlbmVyYWxseVxuICogb2J0YWluZWQgZnJvbSBkcGRiLmdldERldmljZVBhcmFtcygpKS4gQ2FuIGJlIG51bGwgdG8gbWVhbiBubyBkZXZpY2VcbiAqIHBhcmFtcyB3ZXJlIGZvdW5kLlxuICovXG5mdW5jdGlvbiBEZXZpY2VJbmZvKGRldmljZVBhcmFtcykge1xuICB0aGlzLnZpZXdlciA9IFZpZXdlcnMuQ2FyZGJvYXJkVjI7XG4gIHRoaXMudXBkYXRlRGV2aWNlUGFyYW1zKGRldmljZVBhcmFtcyk7XG4gIHRoaXMuZGlzdG9ydGlvbiA9IG5ldyBEaXN0b3J0aW9uKHRoaXMudmlld2VyLmRpc3RvcnRpb25Db2VmZmljaWVudHMpO1xufVxuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS51cGRhdGVEZXZpY2VQYXJhbXMgPSBmdW5jdGlvbihkZXZpY2VQYXJhbXMpIHtcbiAgdGhpcy5kZXZpY2UgPSB0aGlzLmRldGVybWluZURldmljZV8oZGV2aWNlUGFyYW1zKSB8fCB0aGlzLmRldmljZTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldERldmljZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5kZXZpY2U7XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5zZXRWaWV3ZXIgPSBmdW5jdGlvbih2aWV3ZXIpIHtcbiAgdGhpcy52aWV3ZXIgPSB2aWV3ZXI7XG4gIHRoaXMuZGlzdG9ydGlvbiA9IG5ldyBEaXN0b3J0aW9uKHRoaXMudmlld2VyLmRpc3RvcnRpb25Db2VmZmljaWVudHMpO1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZGV0ZXJtaW5lRGV2aWNlXyA9IGZ1bmN0aW9uKGRldmljZVBhcmFtcykge1xuICBpZiAoIWRldmljZVBhcmFtcykge1xuICAgIC8vIE5vIHBhcmFtZXRlcnMsIHNvIHVzZSBhIGRlZmF1bHQuXG4gICAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgICAgY29uc29sZS53YXJuKCdVc2luZyBmYWxsYmFjayBpT1MgZGV2aWNlIG1lYXN1cmVtZW50cy4nKTtcbiAgICAgIHJldHVybiBERUZBVUxUX0lPUztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKCdVc2luZyBmYWxsYmFjayBBbmRyb2lkIGRldmljZSBtZWFzdXJlbWVudHMuJyk7XG4gICAgICByZXR1cm4gREVGQVVMVF9BTkRST0lEO1xuICAgIH1cbiAgfVxuXG4gIC8vIENvbXB1dGUgZGV2aWNlIHNjcmVlbiBkaW1lbnNpb25zIGJhc2VkIG9uIGRldmljZVBhcmFtcy5cbiAgdmFyIE1FVEVSU19QRVJfSU5DSCA9IDAuMDI1NDtcbiAgdmFyIG1ldGVyc1BlclBpeGVsWCA9IE1FVEVSU19QRVJfSU5DSCAvIGRldmljZVBhcmFtcy54ZHBpO1xuICB2YXIgbWV0ZXJzUGVyUGl4ZWxZID0gTUVURVJTX1BFUl9JTkNIIC8gZGV2aWNlUGFyYW1zLnlkcGk7XG4gIHZhciB3aWR0aCA9IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKTtcbiAgdmFyIGhlaWdodCA9IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCk7XG4gIHJldHVybiBuZXcgRGV2aWNlKHtcbiAgICB3aWR0aE1ldGVyczogbWV0ZXJzUGVyUGl4ZWxYICogd2lkdGgsXG4gICAgaGVpZ2h0TWV0ZXJzOiBtZXRlcnNQZXJQaXhlbFkgKiBoZWlnaHQsXG4gICAgYmV2ZWxNZXRlcnM6IGRldmljZVBhcmFtcy5iZXZlbE1tICogMC4wMDEsXG4gIH0pO1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIGZpZWxkIG9mIHZpZXcgZm9yIHRoZSBsZWZ0IGV5ZS5cbiAqL1xuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0RGlzdG9ydGVkRmllbGRPZlZpZXdMZWZ0RXllID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICAvLyBEZXZpY2UuaGVpZ2h0IGFuZCBkZXZpY2Uud2lkdGggZm9yIGRldmljZSBpbiBwb3J0cmFpdCBtb2RlLCBzbyB0cmFuc3Bvc2UuXG4gIHZhciBleWVUb1NjcmVlbkRpc3RhbmNlID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcblxuICB2YXIgb3V0ZXJEaXN0ID0gKGRldmljZS53aWR0aE1ldGVycyAtIHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSkgLyAyO1xuICB2YXIgaW5uZXJEaXN0ID0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlIC8gMjtcbiAgdmFyIGJvdHRvbURpc3QgPSB2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnM7XG4gIHZhciB0b3BEaXN0ID0gZGV2aWNlLmhlaWdodE1ldGVycyAtIGJvdHRvbURpc3Q7XG5cbiAgdmFyIG91dGVyQW5nbGUgPSBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydChvdXRlckRpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG4gIHZhciBpbm5lckFuZ2xlID0gTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4oXG4gICAgICBkaXN0b3J0aW9uLmRpc3RvcnQoaW5uZXJEaXN0IC8gZXllVG9TY3JlZW5EaXN0YW5jZSkpO1xuICB2YXIgYm90dG9tQW5nbGUgPSBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydChib3R0b21EaXN0IC8gZXllVG9TY3JlZW5EaXN0YW5jZSkpO1xuICB2YXIgdG9wQW5nbGUgPSBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydCh0b3BEaXN0IC8gZXllVG9TY3JlZW5EaXN0YW5jZSkpO1xuXG4gIHJldHVybiB7XG4gICAgbGVmdERlZ3JlZXM6IE1hdGgubWluKG91dGVyQW5nbGUsIHZpZXdlci5mb3YpLFxuICAgIHJpZ2h0RGVncmVlczogTWF0aC5taW4oaW5uZXJBbmdsZSwgdmlld2VyLmZvdiksXG4gICAgZG93bkRlZ3JlZXM6IE1hdGgubWluKGJvdHRvbUFuZ2xlLCB2aWV3ZXIuZm92KSxcbiAgICB1cERlZ3JlZXM6IE1hdGgubWluKHRvcEFuZ2xlLCB2aWV3ZXIuZm92KVxuICB9O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSB0YW4tYW5nbGVzIGZyb20gdGhlIG1heGltdW0gRk9WIGZvciB0aGUgbGVmdCBleWUgZm9yIHRoZVxuICogY3VycmVudCBkZXZpY2UgYW5kIHNjcmVlbiBwYXJhbWV0ZXJzLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRMZWZ0RXllVmlzaWJsZVRhbkFuZ2xlcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcbiAgdmFyIGRpc3RvcnRpb24gPSB0aGlzLmRpc3RvcnRpb247XG5cbiAgLy8gVGFuLWFuZ2xlcyBmcm9tIHRoZSBtYXggRk9WLlxuICB2YXIgZm92TGVmdCA9IE1hdGgudGFuKC1NYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpO1xuICB2YXIgZm92VG9wID0gTWF0aC50YW4oTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KTtcbiAgdmFyIGZvdlJpZ2h0ID0gTWF0aC50YW4oTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KTtcbiAgdmFyIGZvdkJvdHRvbSA9IE1hdGgudGFuKC1NYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpO1xuICAvLyBWaWV3cG9ydCBzaXplLlxuICB2YXIgaGFsZldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gNDtcbiAgdmFyIGhhbGZIZWlnaHQgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC8gMjtcbiAgLy8gVmlld3BvcnQgY2VudGVyLCBtZWFzdXJlZCBmcm9tIGxlZnQgbGVucyBwb3NpdGlvbi5cbiAgdmFyIHZlcnRpY2FsTGVuc09mZnNldCA9ICh2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnMgLSBoYWxmSGVpZ2h0KTtcbiAgdmFyIGNlbnRlclggPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyIC0gaGFsZldpZHRoO1xuICB2YXIgY2VudGVyWSA9IC12ZXJ0aWNhbExlbnNPZmZzZXQ7XG4gIHZhciBjZW50ZXJaID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgLy8gVGFuLWFuZ2xlcyBvZiB0aGUgdmlld3BvcnQgZWRnZXMsIGFzIHNlZW4gdGhyb3VnaCB0aGUgbGVucy5cbiAgdmFyIHNjcmVlbkxlZnQgPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclggLSBoYWxmV2lkdGgpIC8gY2VudGVyWik7XG4gIHZhciBzY3JlZW5Ub3AgPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclkgKyBoYWxmSGVpZ2h0KSAvIGNlbnRlclopO1xuICB2YXIgc2NyZWVuUmlnaHQgPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclggKyBoYWxmV2lkdGgpIC8gY2VudGVyWik7XG4gIHZhciBzY3JlZW5Cb3R0b20gPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclkgLSBoYWxmSGVpZ2h0KSAvIGNlbnRlclopO1xuICAvLyBDb21wYXJlIHRoZSB0d28gc2V0cyBvZiB0YW4tYW5nbGVzIGFuZCB0YWtlIHRoZSB2YWx1ZSBjbG9zZXIgdG8gemVybyBvbiBlYWNoIHNpZGUuXG4gIHZhciByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICByZXN1bHRbMF0gPSBNYXRoLm1heChmb3ZMZWZ0LCBzY3JlZW5MZWZ0KTtcbiAgcmVzdWx0WzFdID0gTWF0aC5taW4oZm92VG9wLCBzY3JlZW5Ub3ApO1xuICByZXN1bHRbMl0gPSBNYXRoLm1pbihmb3ZSaWdodCwgc2NyZWVuUmlnaHQpO1xuICByZXN1bHRbM10gPSBNYXRoLm1heChmb3ZCb3R0b20sIHNjcmVlbkJvdHRvbSk7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4aW11bSBGT1YgZm9yIHRoZSBsZWZ0IGV5ZSBmb3IgdGhlXG4gKiBjdXJyZW50IGRldmljZSBhbmQgc2NyZWVuIHBhcmFtZXRlcnMsIGFzc3VtaW5nIG5vIGxlbnNlcy5cbiAqL1xuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0TGVmdEV5ZU5vTGVuc1RhbkFuZ2xlcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcbiAgdmFyIGRpc3RvcnRpb24gPSB0aGlzLmRpc3RvcnRpb247XG5cbiAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gIC8vIFRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4IEZPVi5cbiAgdmFyIGZvdkxlZnQgPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKC1NYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpKTtcbiAgdmFyIGZvdlRvcCA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KSk7XG4gIHZhciBmb3ZSaWdodCA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KSk7XG4gIHZhciBmb3ZCb3R0b20gPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKC1NYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpKTtcbiAgLy8gVmlld3BvcnQgc2l6ZS5cbiAgdmFyIGhhbGZXaWR0aCA9IGRldmljZS53aWR0aE1ldGVycyAvIDQ7XG4gIHZhciBoYWxmSGVpZ2h0ID0gZGV2aWNlLmhlaWdodE1ldGVycyAvIDI7XG4gIC8vIFZpZXdwb3J0IGNlbnRlciwgbWVhc3VyZWQgZnJvbSBsZWZ0IGxlbnMgcG9zaXRpb24uXG4gIHZhciB2ZXJ0aWNhbExlbnNPZmZzZXQgPSAodmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzIC0gaGFsZkhlaWdodCk7XG4gIHZhciBjZW50ZXJYID0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlIC8gMiAtIGhhbGZXaWR0aDtcbiAgdmFyIGNlbnRlclkgPSAtdmVydGljYWxMZW5zT2Zmc2V0O1xuICB2YXIgY2VudGVyWiA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG4gIC8vIFRhbi1hbmdsZXMgb2YgdGhlIHZpZXdwb3J0IGVkZ2VzLCBhcyBzZWVuIHRocm91Z2ggdGhlIGxlbnMuXG4gIHZhciBzY3JlZW5MZWZ0ID0gKGNlbnRlclggLSBoYWxmV2lkdGgpIC8gY2VudGVyWjtcbiAgdmFyIHNjcmVlblRvcCA9IChjZW50ZXJZICsgaGFsZkhlaWdodCkgLyBjZW50ZXJaO1xuICB2YXIgc2NyZWVuUmlnaHQgPSAoY2VudGVyWCArIGhhbGZXaWR0aCkgLyBjZW50ZXJaO1xuICB2YXIgc2NyZWVuQm90dG9tID0gKGNlbnRlclkgLSBoYWxmSGVpZ2h0KSAvIGNlbnRlclo7XG4gIC8vIENvbXBhcmUgdGhlIHR3byBzZXRzIG9mIHRhbi1hbmdsZXMgYW5kIHRha2UgdGhlIHZhbHVlIGNsb3NlciB0byB6ZXJvIG9uIGVhY2ggc2lkZS5cbiAgcmVzdWx0WzBdID0gTWF0aC5tYXgoZm92TGVmdCwgc2NyZWVuTGVmdCk7XG4gIHJlc3VsdFsxXSA9IE1hdGgubWluKGZvdlRvcCwgc2NyZWVuVG9wKTtcbiAgcmVzdWx0WzJdID0gTWF0aC5taW4oZm92UmlnaHQsIHNjcmVlblJpZ2h0KTtcbiAgcmVzdWx0WzNdID0gTWF0aC5tYXgoZm92Qm90dG9tLCBzY3JlZW5Cb3R0b20pO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzY3JlZW4gcmVjdGFuZ2xlIHZpc2libGUgZnJvbSB0aGUgbGVmdCBleWUgZm9yIHRoZVxuICogY3VycmVudCBkZXZpY2UgYW5kIHNjcmVlbiBwYXJhbWV0ZXJzLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRMZWZ0RXllVmlzaWJsZVNjcmVlblJlY3QgPSBmdW5jdGlvbih1bmRpc3RvcnRlZEZydXN0dW0pIHtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG5cbiAgdmFyIGRpc3QgPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICB2YXIgZXllWCA9IChkZXZpY2Uud2lkdGhNZXRlcnMgLSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UpIC8gMjtcbiAgdmFyIGV5ZVkgPSB2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnM7XG4gIHZhciBsZWZ0ID0gKHVuZGlzdG9ydGVkRnJ1c3R1bVswXSAqIGRpc3QgKyBleWVYKSAvIGRldmljZS53aWR0aE1ldGVycztcbiAgdmFyIHRvcCA9ICh1bmRpc3RvcnRlZEZydXN0dW1bMV0gKiBkaXN0ICsgZXllWSkgLyBkZXZpY2UuaGVpZ2h0TWV0ZXJzO1xuICB2YXIgcmlnaHQgPSAodW5kaXN0b3J0ZWRGcnVzdHVtWzJdICogZGlzdCArIGV5ZVgpIC8gZGV2aWNlLndpZHRoTWV0ZXJzO1xuICB2YXIgYm90dG9tID0gKHVuZGlzdG9ydGVkRnJ1c3R1bVszXSAqIGRpc3QgKyBleWVZKSAvIGRldmljZS5oZWlnaHRNZXRlcnM7XG4gIHJldHVybiB7XG4gICAgeDogbGVmdCxcbiAgICB5OiBib3R0b20sXG4gICAgd2lkdGg6IHJpZ2h0IC0gbGVmdCxcbiAgICBoZWlnaHQ6IHRvcCAtIGJvdHRvbVxuICB9O1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0RmllbGRPZlZpZXdMZWZ0RXllID0gZnVuY3Rpb24ob3B0X2lzVW5kaXN0b3J0ZWQpIHtcbiAgcmV0dXJuIG9wdF9pc1VuZGlzdG9ydGVkID8gdGhpcy5nZXRVbmRpc3RvcnRlZEZpZWxkT2ZWaWV3TGVmdEV5ZSgpIDpcbiAgICAgIHRoaXMuZ2V0RGlzdG9ydGVkRmllbGRPZlZpZXdMZWZ0RXllKCk7XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRGaWVsZE9mVmlld1JpZ2h0RXllID0gZnVuY3Rpb24ob3B0X2lzVW5kaXN0b3J0ZWQpIHtcbiAgdmFyIGZvdiA9IHRoaXMuZ2V0RmllbGRPZlZpZXdMZWZ0RXllKG9wdF9pc1VuZGlzdG9ydGVkKTtcbiAgcmV0dXJuIHtcbiAgICBsZWZ0RGVncmVlczogZm92LnJpZ2h0RGVncmVlcyxcbiAgICByaWdodERlZ3JlZXM6IGZvdi5sZWZ0RGVncmVlcyxcbiAgICB1cERlZ3JlZXM6IGZvdi51cERlZ3JlZXMsXG4gICAgZG93bkRlZ3JlZXM6IGZvdi5kb3duRGVncmVlc1xuICB9O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHVuZGlzdG9ydGVkIGZpZWxkIG9mIHZpZXcgZm9yIHRoZSBsZWZ0IGV5ZS5cbiAqL1xuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0VW5kaXN0b3J0ZWRGaWVsZE9mVmlld0xlZnRFeWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHAgPSB0aGlzLmdldFVuZGlzdG9ydGVkUGFyYW1zXygpO1xuXG4gIHJldHVybiB7XG4gICAgbGVmdERlZ3JlZXM6IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKHAub3V0ZXJEaXN0KSxcbiAgICByaWdodERlZ3JlZXM6IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKHAuaW5uZXJEaXN0KSxcbiAgICBkb3duRGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC5ib3R0b21EaXN0KSxcbiAgICB1cERlZ3JlZXM6IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKHAudG9wRGlzdClcbiAgfTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldFVuZGlzdG9ydGVkVmlld3BvcnRMZWZ0RXllID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwID0gdGhpcy5nZXRVbmRpc3RvcnRlZFBhcmFtc18oKTtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG5cbiAgLy8gRGlzdGFuY2VzIHN0b3JlZCBpbiBsb2NhbCB2YXJpYWJsZXMgYXJlIGluIHRhbi1hbmdsZSB1bml0cyB1bmxlc3Mgb3RoZXJ3aXNlXG4gIC8vIG5vdGVkLlxuICB2YXIgZXllVG9TY3JlZW5EaXN0YW5jZSA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG4gIHZhciBzY3JlZW5XaWR0aCA9IGRldmljZS53aWR0aE1ldGVycyAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG4gIHZhciBzY3JlZW5IZWlnaHQgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHhQeFBlclRhbkFuZ2xlID0gZGV2aWNlLndpZHRoIC8gc2NyZWVuV2lkdGg7XG4gIHZhciB5UHhQZXJUYW5BbmdsZSA9IGRldmljZS5oZWlnaHQgLyBzY3JlZW5IZWlnaHQ7XG5cbiAgdmFyIHggPSBNYXRoLnJvdW5kKChwLmV5ZVBvc1ggLSBwLm91dGVyRGlzdCkgKiB4UHhQZXJUYW5BbmdsZSk7XG4gIHZhciB5ID0gTWF0aC5yb3VuZCgocC5leWVQb3NZIC0gcC5ib3R0b21EaXN0KSAqIHlQeFBlclRhbkFuZ2xlKTtcbiAgcmV0dXJuIHtcbiAgICB4OiB4LFxuICAgIHk6IHksXG4gICAgd2lkdGg6IE1hdGgucm91bmQoKHAuZXllUG9zWCArIHAuaW5uZXJEaXN0KSAqIHhQeFBlclRhbkFuZ2xlKSAtIHgsXG4gICAgaGVpZ2h0OiBNYXRoLnJvdW5kKChwLmV5ZVBvc1kgKyBwLnRvcERpc3QpICogeVB4UGVyVGFuQW5nbGUpIC0geVxuICB9O1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0VW5kaXN0b3J0ZWRQYXJhbXNfID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICAvLyBNb3N0IG9mIHRoZXNlIHZhcmlhYmxlcyBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gIHZhciBleWVUb1NjcmVlbkRpc3RhbmNlID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgdmFyIGhhbGZMZW5zRGlzdGFuY2UgPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHNjcmVlbldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHNjcmVlbkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuXG4gIHZhciBleWVQb3NYID0gc2NyZWVuV2lkdGggLyAyIC0gaGFsZkxlbnNEaXN0YW5jZTtcbiAgdmFyIGV5ZVBvc1kgPSAodmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzKSAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG5cbiAgdmFyIG1heEZvdiA9IHZpZXdlci5mb3Y7XG4gIHZhciB2aWV3ZXJNYXggPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKE1hdGhVdGlsLmRlZ1RvUmFkICogbWF4Rm92KSk7XG4gIHZhciBvdXRlckRpc3QgPSBNYXRoLm1pbihleWVQb3NYLCB2aWV3ZXJNYXgpO1xuICB2YXIgaW5uZXJEaXN0ID0gTWF0aC5taW4oaGFsZkxlbnNEaXN0YW5jZSwgdmlld2VyTWF4KTtcbiAgdmFyIGJvdHRvbURpc3QgPSBNYXRoLm1pbihleWVQb3NZLCB2aWV3ZXJNYXgpO1xuICB2YXIgdG9wRGlzdCA9IE1hdGgubWluKHNjcmVlbkhlaWdodCAtIGV5ZVBvc1ksIHZpZXdlck1heCk7XG5cbiAgcmV0dXJuIHtcbiAgICBvdXRlckRpc3Q6IG91dGVyRGlzdCxcbiAgICBpbm5lckRpc3Q6IGlubmVyRGlzdCxcbiAgICB0b3BEaXN0OiB0b3BEaXN0LFxuICAgIGJvdHRvbURpc3Q6IGJvdHRvbURpc3QsXG4gICAgZXllUG9zWDogZXllUG9zWCxcbiAgICBleWVQb3NZOiBleWVQb3NZXG4gIH07XG59O1xuXG5cbmZ1bmN0aW9uIENhcmRib2FyZFZpZXdlcihwYXJhbXMpIHtcbiAgLy8gQSBtYWNoaW5lIHJlYWRhYmxlIElELlxuICB0aGlzLmlkID0gcGFyYW1zLmlkO1xuICAvLyBBIGh1bWFuIHJlYWRhYmxlIGxhYmVsLlxuICB0aGlzLmxhYmVsID0gcGFyYW1zLmxhYmVsO1xuXG4gIC8vIEZpZWxkIG9mIHZpZXcgaW4gZGVncmVlcyAocGVyIHNpZGUpLlxuICB0aGlzLmZvdiA9IHBhcmFtcy5mb3Y7XG5cbiAgLy8gRGlzdGFuY2UgYmV0d2VlbiBsZW5zIGNlbnRlcnMgaW4gbWV0ZXJzLlxuICB0aGlzLmludGVyTGVuc0Rpc3RhbmNlID0gcGFyYW1zLmludGVyTGVuc0Rpc3RhbmNlO1xuICAvLyBEaXN0YW5jZSBiZXR3ZWVuIHZpZXdlciBiYXNlbGluZSBhbmQgbGVucyBjZW50ZXIgaW4gbWV0ZXJzLlxuICB0aGlzLmJhc2VsaW5lTGVuc0Rpc3RhbmNlID0gcGFyYW1zLmJhc2VsaW5lTGVuc0Rpc3RhbmNlO1xuICAvLyBTY3JlZW4tdG8tbGVucyBkaXN0YW5jZSBpbiBtZXRlcnMuXG4gIHRoaXMuc2NyZWVuTGVuc0Rpc3RhbmNlID0gcGFyYW1zLnNjcmVlbkxlbnNEaXN0YW5jZTtcblxuICAvLyBEaXN0b3J0aW9uIGNvZWZmaWNpZW50cy5cbiAgdGhpcy5kaXN0b3J0aW9uQ29lZmZpY2llbnRzID0gcGFyYW1zLmRpc3RvcnRpb25Db2VmZmljaWVudHM7XG4gIC8vIEludmVyc2UgZGlzdG9ydGlvbiBjb2VmZmljaWVudHMuXG4gIC8vIFRPRE86IENhbGN1bGF0ZSB0aGVzZSBmcm9tIGRpc3RvcnRpb25Db2VmZmljaWVudHMgaW4gdGhlIGZ1dHVyZS5cbiAgdGhpcy5pbnZlcnNlQ29lZmZpY2llbnRzID0gcGFyYW1zLmludmVyc2VDb2VmZmljaWVudHM7XG59XG5cbi8vIEV4cG9ydCB2aWV3ZXIgaW5mb3JtYXRpb24uXG5EZXZpY2VJbmZvLlZpZXdlcnMgPSBWaWV3ZXJzO1xubW9kdWxlLmV4cG9ydHMgPSBEZXZpY2VJbmZvO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5WUkRpc3BsYXk7XG52YXIgSE1EVlJEZXZpY2UgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5ITURWUkRldmljZTtcbnZhciBQb3NpdGlvblNlbnNvclZSRGV2aWNlID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuUG9zaXRpb25TZW5zb3JWUkRldmljZTtcblxuLyoqXG4gKiBXcmFwcyBhIFZSRGlzcGxheSBhbmQgZXhwb3NlcyBpdCBhcyBhIEhNRFZSRGV2aWNlXG4gKi9cbmZ1bmN0aW9uIFZSRGlzcGxheUhNRERldmljZShkaXNwbGF5KSB7XG4gIHRoaXMuZGlzcGxheSA9IGRpc3BsYXk7XG5cbiAgdGhpcy5oYXJkd2FyZVVuaXRJZCA9IGRpc3BsYXkuZGlzcGxheUlkO1xuICB0aGlzLmRldmljZUlkID0gJ3dlYnZyLXBvbHlmaWxsOkhNRDonICsgZGlzcGxheS5kaXNwbGF5SWQ7XG4gIHRoaXMuZGV2aWNlTmFtZSA9IGRpc3BsYXkuZGlzcGxheU5hbWUgKyAnIChITUQpJztcbn1cblZSRGlzcGxheUhNRERldmljZS5wcm90b3R5cGUgPSBuZXcgSE1EVlJEZXZpY2UoKTtcblxuVlJEaXNwbGF5SE1ERGV2aWNlLnByb3RvdHlwZS5nZXRFeWVQYXJhbWV0ZXJzID0gZnVuY3Rpb24od2hpY2hFeWUpIHtcbiAgdmFyIGV5ZVBhcmFtZXRlcnMgPSB0aGlzLmRpc3BsYXkuZ2V0RXllUGFyYW1ldGVycyh3aGljaEV5ZSk7XG5cbiAgcmV0dXJuIHtcbiAgICBjdXJyZW50RmllbGRPZlZpZXc6IGV5ZVBhcmFtZXRlcnMuZmllbGRPZlZpZXcsXG4gICAgbWF4aW11bUZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIG1pbmltdW1GaWVsZE9mVmlldzogZXllUGFyYW1ldGVycy5maWVsZE9mVmlldyxcbiAgICByZWNvbW1lbmRlZEZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIGV5ZVRyYW5zbGF0aW9uOiB7IHg6IGV5ZVBhcmFtZXRlcnMub2Zmc2V0WzBdLCB5OiBleWVQYXJhbWV0ZXJzLm9mZnNldFsxXSwgejogZXllUGFyYW1ldGVycy5vZmZzZXRbMl0gfSxcbiAgICByZW5kZXJSZWN0OiB7XG4gICAgICB4OiAod2hpY2hFeWUgPT0gJ3JpZ2h0JykgPyBleWVQYXJhbWV0ZXJzLnJlbmRlcldpZHRoIDogMCxcbiAgICAgIHk6IDAsXG4gICAgICB3aWR0aDogZXllUGFyYW1ldGVycy5yZW5kZXJXaWR0aCxcbiAgICAgIGhlaWdodDogZXllUGFyYW1ldGVycy5yZW5kZXJIZWlnaHRcbiAgICB9XG4gIH07XG59O1xuXG5WUkRpc3BsYXlITUREZXZpY2UucHJvdG90eXBlLnNldEZpZWxkT2ZWaWV3ID1cbiAgICBmdW5jdGlvbihvcHRfZm92TGVmdCwgb3B0X2ZvdlJpZ2h0LCBvcHRfek5lYXIsIG9wdF96RmFyKSB7XG4gIC8vIE5vdCBzdXBwb3J0ZWQuIGdldEV5ZVBhcmFtZXRlcnMgcmVwb3J0cyB0aGF0IHRoZSBtaW4sIG1heCwgYW5kIHJlY29tbWVuZGVkXG4gIC8vIEZvViBpcyBhbGwgdGhlIHNhbWUsIHNvIG5vIGFkanVzdG1lbnQgY2FuIGJlIG1hZGUuXG59O1xuXG4vLyBUT0RPOiBOZWVkIHRvIGhvb2sgcmVxdWVzdEZ1bGxzY3JlZW4gdG8gc2VlIGlmIGEgd3JhcHBlZCBWUkRpc3BsYXkgd2FzIHBhc3NlZFxuLy8gaW4gYXMgYW4gb3B0aW9uLiBJZiBzbyB3ZSBzaG91bGQgcHJldmVudCB0aGUgZGVmYXVsdCBmdWxsc2NyZWVuIGJlaGF2aW9yIGFuZFxuLy8gY2FsbCBWUkRpc3BsYXkucmVxdWVzdFByZXNlbnQgaW5zdGVhZC5cblxuLyoqXG4gKiBXcmFwcyBhIFZSRGlzcGxheSBhbmQgZXhwb3NlcyBpdCBhcyBhIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2VcbiAqL1xuZnVuY3Rpb24gVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UoZGlzcGxheSkge1xuICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5O1xuXG4gIHRoaXMuaGFyZHdhcmVVbml0SWQgPSBkaXNwbGF5LmRpc3BsYXlJZDtcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbDpQb3NpdGlvblNlbnNvcjogJyArIGRpc3BsYXkuZGlzcGxheUlkO1xuICB0aGlzLmRldmljZU5hbWUgPSBkaXNwbGF5LmRpc3BsYXlOYW1lICsgJyAoUG9zaXRpb25TZW5zb3IpJztcbn1cblZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlLnByb3RvdHlwZSA9IG5ldyBQb3NpdGlvblNlbnNvclZSRGV2aWNlKCk7XG5cblZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlLnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcG9zZSA9IHRoaXMuZGlzcGxheS5nZXRQb3NlKCk7XG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246IHBvc2UucG9zaXRpb24gPyB7IHg6IHBvc2UucG9zaXRpb25bMF0sIHk6IHBvc2UucG9zaXRpb25bMV0sIHo6IHBvc2UucG9zaXRpb25bMl0gfSA6IG51bGwsXG4gICAgb3JpZW50YXRpb246IHBvc2Uub3JpZW50YXRpb24gPyB7IHg6IHBvc2Uub3JpZW50YXRpb25bMF0sIHk6IHBvc2Uub3JpZW50YXRpb25bMV0sIHo6IHBvc2Uub3JpZW50YXRpb25bMl0sIHc6IHBvc2Uub3JpZW50YXRpb25bM10gfSA6IG51bGwsXG4gICAgbGluZWFyVmVsb2NpdHk6IG51bGwsXG4gICAgbGluZWFyQWNjZWxlcmF0aW9uOiBudWxsLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbnVsbCxcbiAgICBhbmd1bGFyQWNjZWxlcmF0aW9uOiBudWxsXG4gIH07XG59O1xuXG5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZS5wcm90b3R5cGUucmVzZXRTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5wb3NpdGlvbkRldmljZS5yZXNldFBvc2UoKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMuVlJEaXNwbGF5SE1ERGV2aWNlID0gVlJEaXNwbGF5SE1ERGV2aWNlO1xubW9kdWxlLmV4cG9ydHMuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UgPSBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZTtcblxuIiwiLyoqXG4gKiBUT0RPKHNtdXMpOiBJbXBsZW1lbnQgY29lZmZpY2llbnQgaW52ZXJzaW9uLlxuICovXG5mdW5jdGlvbiBEaXN0b3J0aW9uKGNvZWZmaWNpZW50cykge1xuICB0aGlzLmNvZWZmaWNpZW50cyA9IGNvZWZmaWNpZW50cztcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBpbnZlcnNlIGRpc3RvcnRpb24gZm9yIGEgcmFkaXVzLlxuICogPC9wPjxwPlxuICogQWxsb3dzIHRvIGNvbXB1dGUgdGhlIG9yaWdpbmFsIHVuZGlzdG9ydGVkIHJhZGl1cyBmcm9tIGEgZGlzdG9ydGVkIG9uZS5cbiAqIFNlZSBhbHNvIGdldEFwcHJveGltYXRlSW52ZXJzZURpc3RvcnRpb24oKSBmb3IgYSBmYXN0ZXIgYnV0IHBvdGVudGlhbGx5XG4gKiBsZXNzIGFjY3VyYXRlIG1ldGhvZC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkaXVzIERpc3RvcnRlZCByYWRpdXMgZnJvbSB0aGUgbGVucyBjZW50ZXIgaW4gdGFuLWFuZ2xlIHVuaXRzLlxuICogQHJldHVybiB7TnVtYmVyfSBUaGUgdW5kaXN0b3J0ZWQgcmFkaXVzIGluIHRhbi1hbmdsZSB1bml0cy5cbiAqL1xuRGlzdG9ydGlvbi5wcm90b3R5cGUuZGlzdG9ydEludmVyc2UgPSBmdW5jdGlvbihyYWRpdXMpIHtcbiAgLy8gU2VjYW50IG1ldGhvZC5cbiAgdmFyIHIwID0gMDtcbiAgdmFyIHIxID0gMTtcbiAgdmFyIGRyMCA9IHJhZGl1cyAtIHRoaXMuZGlzdG9ydChyMCk7XG4gIHdoaWxlIChNYXRoLmFicyhyMSAtIHIwKSA+IDAuMDAwMSAvKiogMC4xbW0gKi8pIHtcbiAgICB2YXIgZHIxID0gcmFkaXVzIC0gdGhpcy5kaXN0b3J0KHIxKTtcbiAgICB2YXIgcjIgPSByMSAtIGRyMSAqICgocjEgLSByMCkgLyAoZHIxIC0gZHIwKSk7XG4gICAgcjAgPSByMTtcbiAgICByMSA9IHIyO1xuICAgIGRyMCA9IGRyMTtcbiAgfVxuICByZXR1cm4gcjE7XG59O1xuXG4vKipcbiAqIERpc3RvcnRzIGEgcmFkaXVzIGJ5IGl0cyBkaXN0b3J0aW9uIGZhY3RvciBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGxlbnNlcy5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkaXVzIFJhZGl1cyBmcm9tIHRoZSBsZW5zIGNlbnRlciBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBkaXN0b3J0ZWQgcmFkaXVzIGluIHRhbi1hbmdsZSB1bml0cy5cbiAqL1xuRGlzdG9ydGlvbi5wcm90b3R5cGUuZGlzdG9ydCA9IGZ1bmN0aW9uKHJhZGl1cykge1xuICB2YXIgcjIgPSByYWRpdXMgKiByYWRpdXM7XG4gIHZhciByZXQgPSAwO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY29lZmZpY2llbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmV0ID0gcjIgKiAocmV0ICsgdGhpcy5jb2VmZmljaWVudHNbaV0pO1xuICB9XG4gIHJldHVybiAocmV0ICsgMSkgKiByYWRpdXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERpc3RvcnRpb247XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwiZm9ybWF0XCI6IDEsXG4gIFwibGFzdF91cGRhdGVkXCI6IFwiMjAxNy0wNi0wMVQyMjozMzo0MlpcIixcbiAgXCJkZXZpY2VzXCI6IFtcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcImFzdXMvKi9OZXh1cyA3LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIk5leHVzIDdcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAzMjAuOCxcbiAgICAgICAgMzIzXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiYXN1cy8qL0FTVVNfWjAwQUQvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiQVNVU19aMDBBRFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQwMyxcbiAgICAgICAgNDA0LjZcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiR29vZ2xlLyovUGl4ZWwgWEwvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiUGl4ZWwgWExcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA1MzcuOSxcbiAgICAgICAgNTMzXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkdvb2dsZS8qL1BpeGVsLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlBpeGVsXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDMyLjYsXG4gICAgICAgIDQzNi43XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkhUQy8qL0hUQzY0MzVMVlcvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiSFRDNjQzNUxWV1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQ0OS43LFxuICAgICAgICA0NDMuM1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJIVEMvKi9IVEMgT25lIFhMLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkhUQyBPbmUgWExcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAzMTUuMyxcbiAgICAgICAgMzE0LjZcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiaHRjLyovTmV4dXMgOS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJOZXh1cyA5XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDI4OSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmUgTTkvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiSFRDIE9uZSBNOVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQ0Mi41LFxuICAgICAgICA0NDMuM1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmVfTTgvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiSFRDIE9uZV9NOFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQ0OS43LFxuICAgICAgICA0NDcuNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiSFRDIE9uZVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiA0NzIuOCxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJIdWF3ZWkvKi9OZXh1cyA2UC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJOZXh1cyA2UFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUxNS4xLFxuICAgICAgICA1MThcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiTEdFLyovTmV4dXMgNVgvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiTmV4dXMgNVhcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0MjIsXG4gICAgICAgIDQxOS45XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkxHRS8qL0xHTVMzNDUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiTEdNUzM0NVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDIyMS43LFxuICAgICAgICAyMTkuMVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkxHRS8qL0xHLUQ4MDAvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiTEctRDgwMFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQyMixcbiAgICAgICAgNDI0LjFcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJMR0UvKi9MRy1EODUwLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkxHLUQ4NTBcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA1MzcuOSxcbiAgICAgICAgNTQxLjlcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJMR0UvKi9WUzk4NSA0Ry8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJWUzk4NSA0R1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUzNy45LFxuICAgICAgICA1MzUuNlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA1LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIk5leHVzIDUgQlwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQ0Mi40LFxuICAgICAgICA0NDQuOFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA0LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIk5leHVzIDRcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAzMTkuOCxcbiAgICAgICAgMzE4LjRcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiTEdFLyovTEctUDc2OS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJMRy1QNzY5XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMjQwLjYsXG4gICAgICAgIDI0Ny41XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIkxHRS8qL0xHTVMzMjMvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiTEdNUzMyM1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDIwNi42LFxuICAgICAgICAyMDQuNlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJMR0UvKi9MR0xTOTk2LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkxHTFM5OTZcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0MDMuNCxcbiAgICAgICAgNDAxLjVcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiTWljcm9tYXgvKi80NTYwTU1YLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIjQ1NjBNTVhcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyNDAsXG4gICAgICAgIDIxOS40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIk1pY3JvbWF4LyovQTI1MC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJNaWNyb21heCBBMjUwXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDgwLFxuICAgICAgICA0NDYuNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJNaWNyb21heC8qL01pY3JvbWF4IEFRNDUwMS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJNaWNyb21heCBBUTQ1MDFcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogMjQwLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9EUk9JRCBSQVpSLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkRST0lEIFJBWlJcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAzNjguMSxcbiAgICAgICAgMjU2LjdcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDgzMEMvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiWFQ4MzBDXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMjU0LFxuICAgICAgICAyNTUuOVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTAyMS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJYVDEwMjFcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyNTQsXG4gICAgICAgIDI1Ni43XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwMjMvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiWFQxMDIzXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMjU0LFxuICAgICAgICAyNTYuN1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDI4LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlhUMTAyOFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMyNi42LFxuICAgICAgICAzMjcuNlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTAzNC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJYVDEwMzRcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAzMjYuNixcbiAgICAgICAgMzI4LjRcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTA1My8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJYVDEwNTNcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAzMTUuMyxcbiAgICAgICAgMzE2LjFcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDE1NjIvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiWFQxNTYyXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDAzLjQsXG4gICAgICAgIDQwMi43XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIm1vdG9yb2xhLyovTmV4dXMgNi8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJOZXh1cyA2IEJcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0OTQuMyxcbiAgICAgICAgNDg5LjdcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwNjMvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiWFQxMDYzXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMjk1LFxuICAgICAgICAyOTYuNlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTA2NC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJYVDEwNjRcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyOTUsXG4gICAgICAgIDI5NS42XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwOTIvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiWFQxMDkyXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDIyLFxuICAgICAgICA0MjQuMVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDk1LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlhUMTA5NVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQyMixcbiAgICAgICAgNDIzLjRcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9HNC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJNb3RvIEcgKDQpXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDQwMSxcbiAgICAgIFwiYndcIjogNCxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJPbmVQbHVzLyovQTAwMDEvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiQTAwMDFcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0MDMuNCxcbiAgICAgICAgNDAxXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIk9uZVBsdXMvKi9PTkUgRTEwMDUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiT05FIEUxMDA1XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDQyLjQsXG4gICAgICAgIDQ0MS40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIk9uZVBsdXMvKi9PTkUgQTIwMDUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiT05FIEEyMDA1XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMzkxLjksXG4gICAgICAgIDQwNS40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIk9QUE8vKi9YOTA5LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlg5MDlcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0NDIuNCxcbiAgICAgICAgNDQ0LjFcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MDgyLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkdULUk5MDgyXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMTg0LjcsXG4gICAgICAgIDE4NS40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HMzYwUC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HMzYwUFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDE5Ni43LFxuICAgICAgICAyMDUuNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovTmV4dXMgUy8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJOZXh1cyBTXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMjM0LjUsXG4gICAgICAgIDIyOS44XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTMwMC8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJHVC1JOTMwMFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMwNC44LFxuICAgICAgICAzMDMuOVxuICAgICAgXSxcbiAgICAgIFwiYndcIjogNSxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1UMjMwTlUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tVDIzME5VXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDIxNixcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TR0gtVDM5OS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTR0gtVDM5OVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDIxNy43LFxuICAgICAgICAyMzEuNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU0dILU05MTkvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU0dILU05MTlcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0NDAuOCxcbiAgICAgICAgNDM3LjdcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLU45MDA1LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLU45MDA1XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMzg2LjQsXG4gICAgICAgIDM4N1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TQU1TVU5HLVNNLU45MDBBLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNBTVNVTkctU00tTjkwMEFcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAzODYuNCxcbiAgICAgICAgMzg3LjdcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5NTAwLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkdULUk5NTAwXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDQyLjUsXG4gICAgICAgIDQ0My4zXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5NTA1LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkdULUk5NTA1XCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDQzOS40LFxuICAgICAgXCJid1wiOiA0LFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTAwRi8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HOTAwRlwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQxNS42LFxuICAgICAgICA0MzEuNlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogNSxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkwME0vKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tRzkwME1cIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0MTUuNixcbiAgICAgICAgNDMxLjZcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDUsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc4MDBGLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLUc4MDBGXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDMyNi44LFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTA2Uy8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HOTA2U1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDU2Mi43LFxuICAgICAgICA1NzIuNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkzMDAvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiR1QtSTkzMDBcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAzMDYuNyxcbiAgICAgICAgMzA0LjhcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDUsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLVQ1MzUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tVDUzNVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDE0Mi42LFxuICAgICAgICAxMzYuNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTIwQy8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1OOTIwQ1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUxNS4xLFxuICAgICAgICA1MTguNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tTjkyMFc4LypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLU45MjBXOFwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUxNS4xLFxuICAgICAgICA1MTguNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkzMDBJLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkdULUk5MzAwSVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMwNC44LFxuICAgICAgICAzMDUuOFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkxOTUvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiR1QtSTkxOTVcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyNDkuNCxcbiAgICAgICAgMjU2LjdcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU1BILUw1MjAvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU1BILUw1MjBcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyNDkuNCxcbiAgICAgICAgMjU1LjlcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NBTVNVTkctU0dILUk3MTcvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU0FNU1VORy1TR0gtSTcxN1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiAyODUuOCxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU1BILUQ3MTAvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU1BILUQ3MTBcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICAyMTcuNyxcbiAgICAgICAgMjA0LjJcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULU43MTAwLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkdULU43MTAwXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDI2NS4xLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TQ0gtSTYwNS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTQ0gtSTYwNVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiAyNjUuMSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovR2FsYXh5IE5leHVzLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkdhbGF4eSBOZXh1c1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMxNS4zLFxuICAgICAgICAzMTQuMlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tTjkxMEgvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tTjkxMEhcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA1MTUuMSxcbiAgICAgICAgNTE4XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTEwQy8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1OOTEwQ1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUxNS4yLFxuICAgICAgICA1MjAuMlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HMTMwTS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HMTMwTVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDE2NS45LFxuICAgICAgICAxNjQuOFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTI4SS8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HOTI4SVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUxNS4xLFxuICAgICAgICA1MTguNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyMEYvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tRzkyMEZcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogNTgwLjYsXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDUwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyMFAvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tRzkyMFBcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA1MjIuNSxcbiAgICAgICAgNTc3XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTI1Ri8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HOTI1RlwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiA1ODAuNixcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTI1Vi8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJTTS1HOTI1VlwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDUyMi41LFxuICAgICAgICA1NzYuNlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkzMEYvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU00tRzkzMEZcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogNTc2LjYsXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MzVGLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIlNNLUc5MzVGXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IDUzMyxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIlNvbnkvKi9DNjkwMy8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJDNjkwM1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQ0Mi41LFxuICAgICAgICA0NDMuM1xuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogNTAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIlNvbnkvKi9ENjY1My8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJENjY1M1wiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDQyOC42LFxuICAgICAgICA0MjcuNlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcIm1kbWhcIjogXCJTb255LyovRTY2NTMvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiRTY2NTNcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0MjguNixcbiAgICAgICAgNDI1LjdcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiU29ueS8qL0U2ODUzLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkU2ODUzXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDAzLjQsXG4gICAgICAgIDQwMS45XG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIlNvbnkvKi9TR1AzMjEvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwiU0dQMzIxXCJcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgMjI0LjcsXG4gICAgICAgIDIyNC4xXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiVENULyovQUxDQVRFTCBPTkUgVE9VQ0ggRmllcmNlLypcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgXCJ1YVwiOiBcIkFMQ0FURUwgT05FIFRPVUNIIEZpZXJjZVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDI0MCxcbiAgICAgICAgMjQ3LjVcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDMsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICAgIFwicnVsZXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJtZG1oXCI6IFwiVEhMLyovdGhsIDUwMDAvKlwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBcInVhXCI6IFwidGhsIDUwMDBcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0ODAsXG4gICAgICAgIDQ0My4zXG4gICAgICBdLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwibWRtaFwiOiBcIlpURS8qL1pURSBCbGFkZSBMMi8qXCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFwidWFcIjogXCJaVEUgQmxhZGUgTDJcIlxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogMjQwLFxuICAgICAgXCJid1wiOiAzLFxuICAgICAgXCJhY1wiOiA1MDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcInJlc1wiOiBbXG4gICAgICAgICAgICA2NDAsXG4gICAgICAgICAgICA5NjBcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMyNS4xLFxuICAgICAgICAzMjguNFxuICAgICAgXSxcbiAgICAgIFwiYndcIjogNCxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwicmVzXCI6IFtcbiAgICAgICAgICAgIDY0MCxcbiAgICAgICAgICAgIDExMzZcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiBbXG4gICAgICAgIDMxNy4xLFxuICAgICAgICAzMjAuMlxuICAgICAgXSxcbiAgICAgIFwiYndcIjogMyxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwicmVzXCI6IFtcbiAgICAgICAgICAgIDc1MCxcbiAgICAgICAgICAgIDEzMzRcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcImRwaVwiOiAzMjYuNCxcbiAgICAgIFwiYndcIjogNCxcbiAgICAgIFwiYWNcIjogMTAwMFxuICAgIH0sXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgICBcInJ1bGVzXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIFwicmVzXCI6IFtcbiAgICAgICAgICAgIDEyNDIsXG4gICAgICAgICAgICAyMjA4XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgXCJkcGlcIjogW1xuICAgICAgICA0NTMuNixcbiAgICAgICAgNDU4LjRcbiAgICAgIF0sXG4gICAgICBcImJ3XCI6IDQsXG4gICAgICBcImFjXCI6IDEwMDBcbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgICAgXCJydWxlc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcInJlc1wiOiBbXG4gICAgICAgICAgICAxMTI1LFxuICAgICAgICAgICAgMjAwMVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiZHBpXCI6IFtcbiAgICAgICAgNDEwLjksXG4gICAgICAgIDQxNS40XG4gICAgICBdLFxuICAgICAgXCJid1wiOiA0LFxuICAgICAgXCJhY1wiOiAxMDAwXG4gICAgfVxuICBdXG59IiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gT2ZmbGluZSBjYWNoZSBvZiB0aGUgRFBEQiwgdG8gYmUgdXNlZCB1bnRpbCB3ZSBsb2FkIHRoZSBvbmxpbmUgb25lIChhbmRcbi8vIGFzIGEgZmFsbGJhY2sgaW4gY2FzZSB3ZSBjYW4ndCBsb2FkIHRoZSBvbmxpbmUgb25lKS5cbnZhciBEUERCX0NBQ0hFID0gcmVxdWlyZSgnLi9kcGRiLmpzb24nKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG4vLyBPbmxpbmUgRFBEQiBVUkwuXG52YXIgT05MSU5FX0RQREJfVVJMID1cbiAgJ2h0dHBzOi8vZHBkYi53ZWJ2ci5yb2Nrcy9kcGRiLmpzb24nO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgZGV2aWNlIHBhcmFtZXRlcnMgYmFzZWQgb24gdGhlIERQREIgKERldmljZSBQYXJhbWV0ZXIgRGF0YWJhc2UpLlxuICogSW5pdGlhbGx5LCB1c2VzIHRoZSBjYWNoZWQgRFBEQiB2YWx1ZXMuXG4gKlxuICogSWYgZmV0Y2hPbmxpbmUgPT0gdHJ1ZSwgdGhlbiB0aGlzIG9iamVjdCB0cmllcyB0byBmZXRjaCB0aGUgb25saW5lIHZlcnNpb25cbiAqIG9mIHRoZSBEUERCIGFuZCB1cGRhdGVzIHRoZSBkZXZpY2UgaW5mbyBpZiBhIGJldHRlciBtYXRjaCBpcyBmb3VuZC5cbiAqIENhbGxzIHRoZSBvbkRldmljZVBhcmFtc1VwZGF0ZWQgY2FsbGJhY2sgd2hlbiB0aGVyZSBpcyBhbiB1cGRhdGUgdG8gdGhlXG4gKiBkZXZpY2UgaW5mb3JtYXRpb24uXG4gKi9cbmZ1bmN0aW9uIERwZGIoZmV0Y2hPbmxpbmUsIG9uRGV2aWNlUGFyYW1zVXBkYXRlZCkge1xuICAvLyBTdGFydCB3aXRoIHRoZSBvZmZsaW5lIERQREIgY2FjaGUgd2hpbGUgd2UgYXJlIGxvYWRpbmcgdGhlIHJlYWwgb25lLlxuICB0aGlzLmRwZGIgPSBEUERCX0NBQ0hFO1xuXG4gIC8vIENhbGN1bGF0ZSBkZXZpY2UgcGFyYW1zIGJhc2VkIG9uIHRoZSBvZmZsaW5lIHZlcnNpb24gb2YgdGhlIERQREIuXG4gIHRoaXMucmVjYWxjdWxhdGVEZXZpY2VQYXJhbXNfKCk7XG5cbiAgLy8gWEhSIHRvIGZldGNoIG9ubGluZSBEUERCIGZpbGUsIGlmIHJlcXVlc3RlZC5cbiAgaWYgKGZldGNoT25saW5lKSB7XG4gICAgLy8gU2V0IHRoZSBjYWxsYmFjay5cbiAgICB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZCA9IG9uRGV2aWNlUGFyYW1zVXBkYXRlZDtcblxuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB2YXIgb2JqID0gdGhpcztcbiAgICB4aHIub3BlbignR0VUJywgT05MSU5FX0RQREJfVVJMLCB0cnVlKTtcbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgb2JqLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDw9IDI5OSkge1xuICAgICAgICAvLyBTdWNjZXNzLlxuICAgICAgICBvYmouZHBkYiA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlKTtcbiAgICAgICAgb2JqLnJlY2FsY3VsYXRlRGV2aWNlUGFyYW1zXygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRXJyb3IgbG9hZGluZyB0aGUgRFBEQi5cbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgbG9hZGluZyBvbmxpbmUgRFBEQiEnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB4aHIuc2VuZCgpO1xuICB9XG59XG5cbi8vIFJldHVybnMgdGhlIGN1cnJlbnQgZGV2aWNlIHBhcmFtZXRlcnMuXG5EcGRiLnByb3RvdHlwZS5nZXREZXZpY2VQYXJhbXMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZGV2aWNlUGFyYW1zO1xufTtcblxuLy8gUmVjYWxjdWxhdGVzIHRoaXMgZGV2aWNlJ3MgcGFyYW1ldGVycyBiYXNlZCBvbiB0aGUgRFBEQi5cbkRwZGIucHJvdG90eXBlLnJlY2FsY3VsYXRlRGV2aWNlUGFyYW1zXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbmV3RGV2aWNlUGFyYW1zID0gdGhpcy5jYWxjRGV2aWNlUGFyYW1zXygpO1xuICBpZiAobmV3RGV2aWNlUGFyYW1zKSB7XG4gICAgdGhpcy5kZXZpY2VQYXJhbXMgPSBuZXdEZXZpY2VQYXJhbXM7XG4gICAgLy8gSW52b2tlIGNhbGxiYWNrLCBpZiBpdCBpcyBzZXQuXG4gICAgaWYgKHRoaXMub25EZXZpY2VQYXJhbXNVcGRhdGVkKSB7XG4gICAgICB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZCh0aGlzLmRldmljZVBhcmFtcyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWNhbGN1bGF0ZSBkZXZpY2UgcGFyYW1ldGVycy4nKTtcbiAgfVxufTtcblxuLy8gUmV0dXJucyBhIERldmljZVBhcmFtcyBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBiZXN0IGd1ZXNzIGFzIHRvIHRoaXNcbi8vIGRldmljZSdzIHBhcmFtZXRlcnMuIENhbiByZXR1cm4gbnVsbCBpZiB0aGUgZGV2aWNlIGRvZXMgbm90IG1hdGNoIGFueVxuLy8ga25vd24gZGV2aWNlcy5cbkRwZGIucHJvdG90eXBlLmNhbGNEZXZpY2VQYXJhbXNfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkYiA9IHRoaXMuZHBkYjsgLy8gc2hvcnRoYW5kXG4gIGlmICghZGIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEUERCIG5vdCBhdmFpbGFibGUuJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKGRiLmZvcm1hdCAhPSAxKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBoYXMgdW5leHBlY3RlZCBmb3JtYXQgdmVyc2lvbi4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoIWRiLmRldmljZXMgfHwgIWRiLmRldmljZXMubGVuZ3RoKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBkb2VzIG5vdCBoYXZlIGEgZGV2aWNlcyBzZWN0aW9uLicpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBhY3R1YWwgdXNlciBhZ2VudCBhbmQgc2NyZWVuIGRpbWVuc2lvbnMgaW4gcGl4ZWxzLlxuICB2YXIgdXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCBuYXZpZ2F0b3IudmVuZG9yIHx8IHdpbmRvdy5vcGVyYTtcbiAgdmFyIHdpZHRoID0gVXRpbC5nZXRTY3JlZW5XaWR0aCgpO1xuICB2YXIgaGVpZ2h0ID0gVXRpbC5nZXRTY3JlZW5IZWlnaHQoKTtcblxuICBpZiAoIWRiLmRldmljZXMpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEUERCIGhhcyBubyBkZXZpY2VzIHNlY3Rpb24uJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRiLmRldmljZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZGV2aWNlID0gZGIuZGV2aWNlc1tpXTtcbiAgICBpZiAoIWRldmljZS5ydWxlcykge1xuICAgICAgY29uc29sZS53YXJuKCdEZXZpY2VbJyArIGkgKyAnXSBoYXMgbm8gcnVsZXMgc2VjdGlvbi4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChkZXZpY2UudHlwZSAhPSAnaW9zJyAmJiBkZXZpY2UudHlwZSAhPSAnYW5kcm9pZCcpIHtcbiAgICAgIGNvbnNvbGUud2FybignRGV2aWNlWycgKyBpICsgJ10gaGFzIGludmFsaWQgdHlwZS4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFNlZSBpZiB0aGlzIGRldmljZSBpcyBvZiB0aGUgYXBwcm9wcmlhdGUgdHlwZS5cbiAgICBpZiAoVXRpbC5pc0lPUygpICE9IChkZXZpY2UudHlwZSA9PSAnaW9zJykpIGNvbnRpbnVlO1xuXG4gICAgLy8gU2VlIGlmIHRoaXMgZGV2aWNlIG1hdGNoZXMgYW55IG9mIHRoZSBydWxlczpcbiAgICB2YXIgbWF0Y2hlZCA9IGZhbHNlO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGV2aWNlLnJ1bGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICB2YXIgcnVsZSA9IGRldmljZS5ydWxlc1tqXTtcbiAgICAgIGlmICh0aGlzLm1hdGNoUnVsZV8ocnVsZSwgdXNlckFnZW50LCB3aWR0aCwgaGVpZ2h0KSkge1xuICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghbWF0Y2hlZCkgY29udGludWU7XG5cbiAgICAvLyBkZXZpY2UuZHBpIG1pZ2h0IGJlIGFuIGFycmF5IG9mIFsgeGRwaSwgeWRwaV0gb3IganVzdCBhIHNjYWxhci5cbiAgICB2YXIgeGRwaSA9IGRldmljZS5kcGlbMF0gfHwgZGV2aWNlLmRwaTtcbiAgICB2YXIgeWRwaSA9IGRldmljZS5kcGlbMV0gfHwgZGV2aWNlLmRwaTtcblxuICAgIHJldHVybiBuZXcgRGV2aWNlUGFyYW1zKHsgeGRwaTogeGRwaSwgeWRwaTogeWRwaSwgYmV2ZWxNbTogZGV2aWNlLmJ3IH0pO1xuICB9XG5cbiAgY29uc29sZS53YXJuKCdObyBEUERCIGRldmljZSBtYXRjaC4nKTtcbiAgcmV0dXJuIG51bGw7XG59O1xuXG5EcGRiLnByb3RvdHlwZS5tYXRjaFJ1bGVfID0gZnVuY3Rpb24ocnVsZSwgdWEsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpIHtcbiAgLy8gV2UgY2FuIG9ubHkgbWF0Y2ggJ3VhJyBhbmQgJ3JlcycgcnVsZXMsIG5vdCBvdGhlciB0eXBlcyBsaWtlICdtZG1oJ1xuICAvLyAod2hpY2ggYXJlIG1lYW50IGZvciBuYXRpdmUgcGxhdGZvcm1zKS5cbiAgaWYgKCFydWxlLnVhICYmICFydWxlLnJlcykgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIG91ciB1c2VyIGFnZW50IHN0cmluZyBkb2Vzbid0IGNvbnRhaW4gdGhlIGluZGljYXRlZCB1c2VyIGFnZW50IHN0cmluZyxcbiAgLy8gdGhlIG1hdGNoIGZhaWxzLlxuICBpZiAocnVsZS51YSAmJiB1YS5pbmRleE9mKHJ1bGUudWEpIDwgMCkgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIHRoZSBydWxlIHNwZWNpZmllcyBzY3JlZW4gZGltZW5zaW9ucyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gb3VycyxcbiAgLy8gdGhlIG1hdGNoIGZhaWxzLlxuICBpZiAocnVsZS5yZXMpIHtcbiAgICBpZiAoIXJ1bGUucmVzWzBdIHx8ICFydWxlLnJlc1sxXSkgcmV0dXJuIGZhbHNlO1xuICAgIHZhciByZXNYID0gcnVsZS5yZXNbMF07XG4gICAgdmFyIHJlc1kgPSBydWxlLnJlc1sxXTtcbiAgICAvLyBDb21wYXJlIG1pbiBhbmQgbWF4IHNvIGFzIHRvIG1ha2UgdGhlIG9yZGVyIG5vdCBtYXR0ZXIsIGkuZS4sIGl0IHNob3VsZFxuICAgIC8vIGJlIHRydWUgdGhhdCA2NDB4NDgwID09IDQ4MHg2NDAuXG4gICAgaWYgKE1hdGgubWluKHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpICE9IE1hdGgubWluKHJlc1gsIHJlc1kpIHx8XG4gICAgICAgIChNYXRoLm1heChzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSAhPSBNYXRoLm1heChyZXNYLCByZXNZKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gRGV2aWNlUGFyYW1zKHBhcmFtcykge1xuICB0aGlzLnhkcGkgPSBwYXJhbXMueGRwaTtcbiAgdGhpcy55ZHBpID0gcGFyYW1zLnlkcGk7XG4gIHRoaXMuYmV2ZWxNbSA9IHBhcmFtcy5iZXZlbE1tO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERwZGI7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBXZWJWUlBvbHlmaWxsID0gcmVxdWlyZSgnLi93ZWJ2ci1wb2x5ZmlsbC5qcycpLldlYlZSUG9seWZpbGw7XG5cbi8vIEluaXRpYWxpemUgYSBXZWJWUkNvbmZpZyBqdXN0IGluIGNhc2UuXG53aW5kb3cuV2ViVlJDb25maWcgPSBVdGlsLmV4dGVuZCh7XG4gIC8vIEZvcmNlcyBhdmFpbGFiaWxpdHkgb2YgVlIgbW9kZSwgZXZlbiBmb3Igbm9uLW1vYmlsZSBkZXZpY2VzLlxuICBGT1JDRV9FTkFCTEVfVlI6IGZhbHNlLFxuXG4gIC8vIENvbXBsZW1lbnRhcnkgZmlsdGVyIGNvZWZmaWNpZW50LiAwIGZvciBhY2NlbGVyb21ldGVyLCAxIGZvciBneXJvLlxuICBLX0ZJTFRFUjogMC45OCxcblxuICAvLyBIb3cgZmFyIGludG8gdGhlIGZ1dHVyZSB0byBwcmVkaWN0IGR1cmluZyBmYXN0IG1vdGlvbiAoaW4gc2Vjb25kcykuXG4gIFBSRURJQ1RJT05fVElNRV9TOiAwLjA0MCxcblxuICAvLyBGbGFnIHRvIGVuYWJsZSB0b3VjaCBwYW5uZXIuIEluIGNhc2UgeW91IGhhdmUgeW91ciBvd24gdG91Y2ggY29udHJvbHMuXG4gIFRPVUNIX1BBTk5FUl9ESVNBQkxFRDogdHJ1ZSxcblxuICAvLyBGbGFnIHRvIGRpc2FibGVkIHRoZSBVSSBpbiBWUiBNb2RlLlxuICBDQVJEQk9BUkRfVUlfRElTQUJMRUQ6IGZhbHNlLCAvLyBEZWZhdWx0OiBmYWxzZVxuXG4gIC8vIEZsYWcgdG8gZGlzYWJsZSB0aGUgaW5zdHJ1Y3Rpb25zIHRvIHJvdGF0ZSB5b3VyIGRldmljZS5cbiAgUk9UQVRFX0lOU1RSVUNUSU9OU19ESVNBQkxFRDogZmFsc2UsIC8vIERlZmF1bHQ6IGZhbHNlLlxuXG4gIC8vIEVuYWJsZSB5YXcgcGFubmluZyBvbmx5LCBkaXNhYmxpbmcgcm9sbCBhbmQgcGl0Y2guIFRoaXMgY2FuIGJlIHVzZWZ1bFxuICAvLyBmb3IgcGFub3JhbWFzIHdpdGggbm90aGluZyBpbnRlcmVzdGluZyBhYm92ZSBvciBiZWxvdy5cbiAgWUFXX09OTFk6IGZhbHNlLFxuXG4gIC8vIFRvIGRpc2FibGUga2V5Ym9hcmQgYW5kIG1vdXNlIGNvbnRyb2xzLCBpZiB5b3Ugd2FudCB0byB1c2UgeW91ciBvd25cbiAgLy8gaW1wbGVtZW50YXRpb24uXG4gIE1PVVNFX0tFWUJPQVJEX0NPTlRST0xTX0RJU0FCTEVEOiBmYWxzZSxcblxuICAvLyBQcmV2ZW50IHRoZSBwb2x5ZmlsbCBmcm9tIGluaXRpYWxpemluZyBpbW1lZGlhdGVseS4gUmVxdWlyZXMgdGhlIGFwcFxuICAvLyB0byBjYWxsIEluaXRpYWxpemVXZWJWUlBvbHlmaWxsKCkgYmVmb3JlIGl0IGNhbiBiZSB1c2VkLlxuICBERUZFUl9JTklUSUFMSVpBVElPTjogZmFsc2UsXG5cbiAgLy8gRW5hYmxlIHRoZSBkZXByZWNhdGVkIHZlcnNpb24gb2YgdGhlIEFQSSAobmF2aWdhdG9yLmdldFZSRGV2aWNlcykuXG4gIEVOQUJMRV9ERVBSRUNBVEVEX0FQSTogZmFsc2UsXG5cbiAgLy8gU2NhbGVzIHRoZSByZWNvbW1lbmRlZCBidWZmZXIgc2l6ZSByZXBvcnRlZCBieSBXZWJWUiwgd2hpY2ggY2FuIGltcHJvdmVcbiAgLy8gcGVyZm9ybWFuY2UuXG4gIC8vIFVQREFURSgyMDE2LTA1LTAzKTogU2V0dGluZyB0aGlzIHRvIDAuNSBieSBkZWZhdWx0IHNpbmNlIDEuMCBkb2VzIG5vdFxuICAvLyBwZXJmb3JtIHdlbGwgb24gbWFueSBtb2JpbGUgZGV2aWNlcy5cbiAgQlVGRkVSX1NDQUxFOiAwLjUsXG5cbiAgLy8gQWxsb3cgVlJEaXNwbGF5LnN1Ym1pdEZyYW1lIHRvIGNoYW5nZSBnbCBiaW5kaW5ncywgd2hpY2ggaXMgbW9yZVxuICAvLyBlZmZpY2llbnQgaWYgdGhlIGFwcGxpY2F0aW9uIGNvZGUgd2lsbCByZS1iaW5kIGl0cyByZXNvdXJjZXMgb24gdGhlXG4gIC8vIG5leHQgZnJhbWUgYW55d2F5LiBUaGlzIGhhcyBiZWVuIHNlZW4gdG8gY2F1c2UgcmVuZGVyaW5nIGdsaXRjaGVzIHdpdGhcbiAgLy8gVEhSRUUuanMuXG4gIC8vIERpcnR5IGJpbmRpbmdzIGluY2x1ZGU6IGdsLkZSQU1FQlVGRkVSX0JJTkRJTkcsIGdsLkNVUlJFTlRfUFJPR1JBTSxcbiAgLy8gZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkcsIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkcsXG4gIC8vIGFuZCBnbC5URVhUVVJFX0JJTkRJTkdfMkQgZm9yIHRleHR1cmUgdW5pdCAwLlxuICBESVJUWV9TVUJNSVRfRlJBTUVfQklORElOR1M6IGZhbHNlLFxuXG4gIC8vIFdoZW4gc2V0IHRvIHRydWUsIHRoaXMgd2lsbCBjYXVzZSBhIHBvbHlmaWxsZWQgVlJEaXNwbGF5IHRvIGFsd2F5cyBiZVxuICAvLyBhcHBlbmRlZCB0byB0aGUgbGlzdCByZXR1cm5lZCBieSBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cygpLCBldmVuIGlmIHRoYXRcbiAgLy8gbGlzdCBpbmNsdWRlcyBhIG5hdGl2ZSBWUkRpc3BsYXkuXG4gIEFMV0FZU19BUFBFTkRfUE9MWUZJTExfRElTUExBWTogZmFsc2UsXG5cbiAgLy8gVGhlcmUgYXJlIHZlcnNpb25zIG9mIENocm9tZSAoTTU4LU02MD8pIHdoZXJlIHRoZSBuYXRpdmUgV2ViVlIgQVBJIGV4aXN0cyxcbiAgLy8gYW5kIGluc3RlYWQgb2YgcmV0dXJuaW5nIDAgVlIgZGlzcGxheXMgd2hlbiBub25lIGFyZSBkZXRlY3RlZCxcbiAgLy8gYG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKClgJ3MgcHJvbWlzZSBuZXZlciByZXNvbHZlcy4gVGhpcyByZXN1bHRzXG4gIC8vIGluIHRoZSBwb2x5ZmlsbCBoYW5naW5nIGFuZCBub3QgYmVpbmcgYWJsZSB0byBwcm92aWRlIGZhbGxiYWNrXG4gIC8vIGRpc3BsYXlzLCBzbyBzZXQgYSB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcyB0byBzdG9wIHdhaXRpbmcgZm9yIGEgcmVzcG9uc2VcbiAgLy8gYW5kIGp1c3QgdXNlIHBvbHlmaWxsZWQgZGlzcGxheXMuXG4gIC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTcyNzk2OVxuICBHRVRfVlJfRElTUExBWVNfVElNRU9VVDogMTAwMCxcbn0sIHdpbmRvdy5XZWJWUkNvbmZpZyk7XG5cbmlmICghd2luZG93LldlYlZSQ29uZmlnLkRFRkVSX0lOSVRJQUxJWkFUSU9OKSB7XG4gIG5ldyBXZWJWUlBvbHlmaWxsKCk7XG59IGVsc2Uge1xuICB3aW5kb3cuSW5pdGlhbGl6ZVdlYlZSUG9seWZpbGwgPSBmdW5jdGlvbigpIHtcbiAgICBuZXcgV2ViVlJQb2x5ZmlsbCgpO1xuICB9XG59XG5cbndpbmRvdy5XZWJWUlBvbHlmaWxsID0gV2ViVlJQb2x5ZmlsbDtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBNYXRoVXRpbCA9IHdpbmRvdy5NYXRoVXRpbCB8fCB7fTtcblxuTWF0aFV0aWwuZGVnVG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuTWF0aFV0aWwucmFkVG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuXG4vLyBTb21lIG1pbmltYWwgbWF0aCBmdW5jdGlvbmFsaXR5IGJvcnJvd2VkIGZyb20gVEhSRUUuTWF0aCBhbmQgc3RyaXBwZWQgZG93blxuLy8gZm9yIHRoZSBwdXJwb3NlcyBvZiB0aGlzIGxpYnJhcnkuXG5cblxuTWF0aFV0aWwuVmVjdG9yMiA9IGZ1bmN0aW9uICggeCwgeSApIHtcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG59O1xuXG5NYXRoVXRpbC5WZWN0b3IyLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IE1hdGhVdGlsLlZlY3RvcjIsXG5cbiAgc2V0OiBmdW5jdGlvbiAoIHgsIHkgKSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29weTogZnVuY3Rpb24gKCB2ICkge1xuICAgIHRoaXMueCA9IHYueDtcbiAgICB0aGlzLnkgPSB2Lnk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzdWJWZWN0b3JzOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG4gICAgdGhpcy54ID0gYS54IC0gYi54O1xuICAgIHRoaXMueSA9IGEueSAtIGIueTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxufTtcblxuTWF0aFV0aWwuVmVjdG9yMyA9IGZ1bmN0aW9uICggeCwgeSwgeiApIHtcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG4gIHRoaXMueiA9IHogfHwgMDtcbn07XG5cbk1hdGhVdGlsLlZlY3RvcjMucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogTWF0aFV0aWwuVmVjdG9yMyxcblxuICBzZXQ6IGZ1bmN0aW9uICggeCwgeSwgeiApIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy56ID0gejtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGNvcHk6IGZ1bmN0aW9uICggdiApIHtcbiAgICB0aGlzLnggPSB2Lng7XG4gICAgdGhpcy55ID0gdi55O1xuICAgIHRoaXMueiA9IHYuejtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGxlbmd0aDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBNYXRoLnNxcnQoIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueiApO1xuICB9LFxuXG4gIG5vcm1hbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzY2FsYXIgPSB0aGlzLmxlbmd0aCgpO1xuXG4gICAgaWYgKCBzY2FsYXIgIT09IDAgKSB7XG4gICAgICB2YXIgaW52U2NhbGFyID0gMSAvIHNjYWxhcjtcblxuICAgICAgdGhpcy5tdWx0aXBseVNjYWxhcihpbnZTY2FsYXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnggPSAwO1xuICAgICAgdGhpcy55ID0gMDtcbiAgICAgIHRoaXMueiA9IDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbXVsdGlwbHlTY2FsYXI6IGZ1bmN0aW9uICggc2NhbGFyICkge1xuICAgIHRoaXMueCAqPSBzY2FsYXI7XG4gICAgdGhpcy55ICo9IHNjYWxhcjtcbiAgICB0aGlzLnogKj0gc2NhbGFyO1xuICB9LFxuXG4gIGFwcGx5UXVhdGVybmlvbjogZnVuY3Rpb24gKCBxICkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIHF4ID0gcS54O1xuICAgIHZhciBxeSA9IHEueTtcbiAgICB2YXIgcXogPSBxLno7XG4gICAgdmFyIHF3ID0gcS53O1xuXG4gICAgLy8gY2FsY3VsYXRlIHF1YXQgKiB2ZWN0b3JcbiAgICB2YXIgaXggPSAgcXcgKiB4ICsgcXkgKiB6IC0gcXogKiB5O1xuICAgIHZhciBpeSA9ICBxdyAqIHkgKyBxeiAqIHggLSBxeCAqIHo7XG4gICAgdmFyIGl6ID0gIHF3ICogeiArIHF4ICogeSAtIHF5ICogeDtcbiAgICB2YXIgaXcgPSAtIHF4ICogeCAtIHF5ICogeSAtIHF6ICogejtcblxuICAgIC8vIGNhbGN1bGF0ZSByZXN1bHQgKiBpbnZlcnNlIHF1YXRcbiAgICB0aGlzLnggPSBpeCAqIHF3ICsgaXcgKiAtIHF4ICsgaXkgKiAtIHF6IC0gaXogKiAtIHF5O1xuICAgIHRoaXMueSA9IGl5ICogcXcgKyBpdyAqIC0gcXkgKyBpeiAqIC0gcXggLSBpeCAqIC0gcXo7XG4gICAgdGhpcy56ID0gaXogKiBxdyArIGl3ICogLSBxeiArIGl4ICogLSBxeSAtIGl5ICogLSBxeDtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGRvdDogZnVuY3Rpb24gKCB2ICkge1xuICAgIHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2LnkgKyB0aGlzLnogKiB2Lno7XG4gIH0sXG5cbiAgY3Jvc3NWZWN0b3JzOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG4gICAgdmFyIGF4ID0gYS54LCBheSA9IGEueSwgYXogPSBhLno7XG4gICAgdmFyIGJ4ID0gYi54LCBieSA9IGIueSwgYnogPSBiLno7XG5cbiAgICB0aGlzLnggPSBheSAqIGJ6IC0gYXogKiBieTtcbiAgICB0aGlzLnkgPSBheiAqIGJ4IC0gYXggKiBiejtcbiAgICB0aGlzLnogPSBheCAqIGJ5IC0gYXkgKiBieDtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxufTtcblxuTWF0aFV0aWwuUXVhdGVybmlvbiA9IGZ1bmN0aW9uICggeCwgeSwgeiwgdyApIHtcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG4gIHRoaXMueiA9IHogfHwgMDtcbiAgdGhpcy53ID0gKCB3ICE9PSB1bmRlZmluZWQgKSA/IHcgOiAxO1xufTtcblxuTWF0aFV0aWwuUXVhdGVybmlvbi5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBNYXRoVXRpbC5RdWF0ZXJuaW9uLFxuXG4gIHNldDogZnVuY3Rpb24gKCB4LCB5LCB6LCB3ICkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLnogPSB6O1xuICAgIHRoaXMudyA9IHc7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb3B5OiBmdW5jdGlvbiAoIHF1YXRlcm5pb24gKSB7XG4gICAgdGhpcy54ID0gcXVhdGVybmlvbi54O1xuICAgIHRoaXMueSA9IHF1YXRlcm5pb24ueTtcbiAgICB0aGlzLnogPSBxdWF0ZXJuaW9uLno7XG4gICAgdGhpcy53ID0gcXVhdGVybmlvbi53O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0RnJvbUV1bGVyWFlaOiBmdW5jdGlvbiggeCwgeSwgeiApIHtcbiAgICB2YXIgYzEgPSBNYXRoLmNvcyggeCAvIDIgKTtcbiAgICB2YXIgYzIgPSBNYXRoLmNvcyggeSAvIDIgKTtcbiAgICB2YXIgYzMgPSBNYXRoLmNvcyggeiAvIDIgKTtcbiAgICB2YXIgczEgPSBNYXRoLnNpbiggeCAvIDIgKTtcbiAgICB2YXIgczIgPSBNYXRoLnNpbiggeSAvIDIgKTtcbiAgICB2YXIgczMgPSBNYXRoLnNpbiggeiAvIDIgKTtcblxuICAgIHRoaXMueCA9IHMxICogYzIgKiBjMyArIGMxICogczIgKiBzMztcbiAgICB0aGlzLnkgPSBjMSAqIHMyICogYzMgLSBzMSAqIGMyICogczM7XG4gICAgdGhpcy56ID0gYzEgKiBjMiAqIHMzICsgczEgKiBzMiAqIGMzO1xuICAgIHRoaXMudyA9IGMxICogYzIgKiBjMyAtIHMxICogczIgKiBzMztcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNldEZyb21FdWxlcllYWjogZnVuY3Rpb24oIHgsIHksIHogKSB7XG4gICAgdmFyIGMxID0gTWF0aC5jb3MoIHggLyAyICk7XG4gICAgdmFyIGMyID0gTWF0aC5jb3MoIHkgLyAyICk7XG4gICAgdmFyIGMzID0gTWF0aC5jb3MoIHogLyAyICk7XG4gICAgdmFyIHMxID0gTWF0aC5zaW4oIHggLyAyICk7XG4gICAgdmFyIHMyID0gTWF0aC5zaW4oIHkgLyAyICk7XG4gICAgdmFyIHMzID0gTWF0aC5zaW4oIHogLyAyICk7XG5cbiAgICB0aGlzLnggPSBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczM7XG4gICAgdGhpcy55ID0gYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzO1xuICAgIHRoaXMueiA9IGMxICogYzIgKiBzMyAtIHMxICogczIgKiBjMztcbiAgICB0aGlzLncgPSBjMSAqIGMyICogYzMgKyBzMSAqIHMyICogczM7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzZXRGcm9tQXhpc0FuZ2xlOiBmdW5jdGlvbiAoIGF4aXMsIGFuZ2xlICkge1xuICAgIC8vIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2dlb21ldHJ5L3JvdGF0aW9ucy9jb252ZXJzaW9ucy9hbmdsZVRvUXVhdGVybmlvbi9pbmRleC5odG1cbiAgICAvLyBhc3N1bWVzIGF4aXMgaXMgbm9ybWFsaXplZFxuXG4gICAgdmFyIGhhbGZBbmdsZSA9IGFuZ2xlIC8gMiwgcyA9IE1hdGguc2luKCBoYWxmQW5nbGUgKTtcblxuICAgIHRoaXMueCA9IGF4aXMueCAqIHM7XG4gICAgdGhpcy55ID0gYXhpcy55ICogcztcbiAgICB0aGlzLnogPSBheGlzLnogKiBzO1xuICAgIHRoaXMudyA9IE1hdGguY29zKCBoYWxmQW5nbGUgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG11bHRpcGx5OiBmdW5jdGlvbiAoIHEgKSB7XG4gICAgcmV0dXJuIHRoaXMubXVsdGlwbHlRdWF0ZXJuaW9ucyggdGhpcywgcSApO1xuICB9LFxuXG4gIG11bHRpcGx5UXVhdGVybmlvbnM6IGZ1bmN0aW9uICggYSwgYiApIHtcbiAgICAvLyBmcm9tIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2FsZ2VicmEvcmVhbE5vcm1lZEFsZ2VicmEvcXVhdGVybmlvbnMvY29kZS9pbmRleC5odG1cblxuICAgIHZhciBxYXggPSBhLngsIHFheSA9IGEueSwgcWF6ID0gYS56LCBxYXcgPSBhLnc7XG4gICAgdmFyIHFieCA9IGIueCwgcWJ5ID0gYi55LCBxYnogPSBiLnosIHFidyA9IGIudztcblxuICAgIHRoaXMueCA9IHFheCAqIHFidyArIHFhdyAqIHFieCArIHFheSAqIHFieiAtIHFheiAqIHFieTtcbiAgICB0aGlzLnkgPSBxYXkgKiBxYncgKyBxYXcgKiBxYnkgKyBxYXogKiBxYnggLSBxYXggKiBxYno7XG4gICAgdGhpcy56ID0gcWF6ICogcWJ3ICsgcWF3ICogcWJ6ICsgcWF4ICogcWJ5IC0gcWF5ICogcWJ4O1xuICAgIHRoaXMudyA9IHFhdyAqIHFidyAtIHFheCAqIHFieCAtIHFheSAqIHFieSAtIHFheiAqIHFiejtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGludmVyc2U6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnggKj0gLTE7XG4gICAgdGhpcy55ICo9IC0xO1xuICAgIHRoaXMueiAqPSAtMTtcblxuICAgIHRoaXMubm9ybWFsaXplKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBub3JtYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbCA9IE1hdGguc3FydCggdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55ICsgdGhpcy56ICogdGhpcy56ICsgdGhpcy53ICogdGhpcy53ICk7XG5cbiAgICBpZiAoIGwgPT09IDAgKSB7XG4gICAgICB0aGlzLnggPSAwO1xuICAgICAgdGhpcy55ID0gMDtcbiAgICAgIHRoaXMueiA9IDA7XG4gICAgICB0aGlzLncgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBsID0gMSAvIGw7XG5cbiAgICAgIHRoaXMueCA9IHRoaXMueCAqIGw7XG4gICAgICB0aGlzLnkgPSB0aGlzLnkgKiBsO1xuICAgICAgdGhpcy56ID0gdGhpcy56ICogbDtcbiAgICAgIHRoaXMudyA9IHRoaXMudyAqIGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2xlcnA6IGZ1bmN0aW9uICggcWIsIHQgKSB7XG4gICAgaWYgKCB0ID09PSAwICkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKCB0ID09PSAxICkgcmV0dXJuIHRoaXMuY29weSggcWIgKTtcblxuICAgIHZhciB4ID0gdGhpcy54LCB5ID0gdGhpcy55LCB6ID0gdGhpcy56LCB3ID0gdGhpcy53O1xuXG4gICAgLy8gaHR0cDovL3d3dy5ldWNsaWRlYW5zcGFjZS5jb20vbWF0aHMvYWxnZWJyYS9yZWFsTm9ybWVkQWxnZWJyYS9xdWF0ZXJuaW9ucy9zbGVycC9cblxuICAgIHZhciBjb3NIYWxmVGhldGEgPSB3ICogcWIudyArIHggKiBxYi54ICsgeSAqIHFiLnkgKyB6ICogcWIuejtcblxuICAgIGlmICggY29zSGFsZlRoZXRhIDwgMCApIHtcbiAgICAgIHRoaXMudyA9IC0gcWIudztcbiAgICAgIHRoaXMueCA9IC0gcWIueDtcbiAgICAgIHRoaXMueSA9IC0gcWIueTtcbiAgICAgIHRoaXMueiA9IC0gcWIuejtcblxuICAgICAgY29zSGFsZlRoZXRhID0gLSBjb3NIYWxmVGhldGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29weSggcWIgKTtcbiAgICB9XG5cbiAgICBpZiAoIGNvc0hhbGZUaGV0YSA+PSAxLjAgKSB7XG4gICAgICB0aGlzLncgPSB3O1xuICAgICAgdGhpcy54ID0geDtcbiAgICAgIHRoaXMueSA9IHk7XG4gICAgICB0aGlzLnogPSB6O1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB2YXIgaGFsZlRoZXRhID0gTWF0aC5hY29zKCBjb3NIYWxmVGhldGEgKTtcbiAgICB2YXIgc2luSGFsZlRoZXRhID0gTWF0aC5zcXJ0KCAxLjAgLSBjb3NIYWxmVGhldGEgKiBjb3NIYWxmVGhldGEgKTtcblxuICAgIGlmICggTWF0aC5hYnMoIHNpbkhhbGZUaGV0YSApIDwgMC4wMDEgKSB7XG4gICAgICB0aGlzLncgPSAwLjUgKiAoIHcgKyB0aGlzLncgKTtcbiAgICAgIHRoaXMueCA9IDAuNSAqICggeCArIHRoaXMueCApO1xuICAgICAgdGhpcy55ID0gMC41ICogKCB5ICsgdGhpcy55ICk7XG4gICAgICB0aGlzLnogPSAwLjUgKiAoIHogKyB0aGlzLnogKTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIHJhdGlvQSA9IE1hdGguc2luKCAoIDEgLSB0ICkgKiBoYWxmVGhldGEgKSAvIHNpbkhhbGZUaGV0YSxcbiAgICByYXRpb0IgPSBNYXRoLnNpbiggdCAqIGhhbGZUaGV0YSApIC8gc2luSGFsZlRoZXRhO1xuXG4gICAgdGhpcy53ID0gKCB3ICogcmF0aW9BICsgdGhpcy53ICogcmF0aW9CICk7XG4gICAgdGhpcy54ID0gKCB4ICogcmF0aW9BICsgdGhpcy54ICogcmF0aW9CICk7XG4gICAgdGhpcy55ID0gKCB5ICogcmF0aW9BICsgdGhpcy55ICogcmF0aW9CICk7XG4gICAgdGhpcy56ID0gKCB6ICogcmF0aW9BICsgdGhpcy56ICogcmF0aW9CICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzZXRGcm9tVW5pdFZlY3RvcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBodHRwOi8vbG9sZW5naW5lLm5ldC9ibG9nLzIwMTQvMDIvMjQvcXVhdGVybmlvbi1mcm9tLXR3by12ZWN0b3JzLWZpbmFsXG4gICAgLy8gYXNzdW1lcyBkaXJlY3Rpb24gdmVjdG9ycyB2RnJvbSBhbmQgdlRvIGFyZSBub3JtYWxpemVkXG5cbiAgICB2YXIgdjEsIHI7XG4gICAgdmFyIEVQUyA9IDAuMDAwMDAxO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICggdkZyb20sIHZUbyApIHtcbiAgICAgIGlmICggdjEgPT09IHVuZGVmaW5lZCApIHYxID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcblxuICAgICAgciA9IHZGcm9tLmRvdCggdlRvICkgKyAxO1xuXG4gICAgICBpZiAoIHIgPCBFUFMgKSB7XG4gICAgICAgIHIgPSAwO1xuXG4gICAgICAgIGlmICggTWF0aC5hYnMoIHZGcm9tLnggKSA+IE1hdGguYWJzKCB2RnJvbS56ICkgKSB7XG4gICAgICAgICAgdjEuc2V0KCAtIHZGcm9tLnksIHZGcm9tLngsIDAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2MS5zZXQoIDAsIC0gdkZyb20ueiwgdkZyb20ueSApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2MS5jcm9zc1ZlY3RvcnMoIHZGcm9tLCB2VG8gKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy54ID0gdjEueDtcbiAgICAgIHRoaXMueSA9IHYxLnk7XG4gICAgICB0aGlzLnogPSB2MS56O1xuICAgICAgdGhpcy53ID0gcjtcblxuICAgICAgdGhpcy5ub3JtYWxpemUoKTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9KCksXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGhVdGlsO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRGlzcGxheTtcbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4vbWF0aC11dGlsLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG4vLyBIb3cgbXVjaCB0byByb3RhdGUgcGVyIGtleSBzdHJva2UuXG52YXIgS0VZX1NQRUVEID0gMC4xNTtcbnZhciBLRVlfQU5JTUFUSU9OX0RVUkFUSU9OID0gODA7XG5cbi8vIEhvdyBtdWNoIHRvIHJvdGF0ZSBmb3IgbW91c2UgZXZlbnRzLlxudmFyIE1PVVNFX1NQRUVEX1ggPSAwLjU7XG52YXIgTU9VU0VfU1BFRURfWSA9IDAuMztcblxuLyoqXG4gKiBWUkRpc3BsYXkgYmFzZWQgb24gbW91c2UgYW5kIGtleWJvYXJkIGlucHV0LiBEZXNpZ25lZCBmb3IgZGVza3RvcHMvbGFwdG9wc1xuICogd2hlcmUgb3JpZW50YXRpb24gZXZlbnRzIGFyZW4ndCBzdXBwb3J0ZWQuIENhbm5vdCBwcmVzZW50LlxuICovXG5mdW5jdGlvbiBNb3VzZUtleWJvYXJkVlJEaXNwbGF5KCkge1xuICB0aGlzLmRpc3BsYXlOYW1lID0gJ01vdXNlIGFuZCBLZXlib2FyZCBWUkRpc3BsYXkgKHdlYnZyLXBvbHlmaWxsKSc7XG5cbiAgdGhpcy5jYXBhYmlsaXRpZXMuaGFzT3JpZW50YXRpb24gPSB0cnVlO1xuXG4gIC8vIEF0dGFjaCB0byBtb3VzZSBhbmQga2V5Ym9hcmQgZXZlbnRzLlxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmVfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlRG93bl8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlVXBfLmJpbmQodGhpcykpO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMucGhpXyA9IDA7XG4gIHRoaXMudGhldGFfID0gMDtcblxuICAvLyBWYXJpYWJsZXMgZm9yIGtleWJvYXJkLWJhc2VkIHJvdGF0aW9uIGFuaW1hdGlvbi5cbiAgdGhpcy50YXJnZXRBbmdsZV8gPSBudWxsO1xuICB0aGlzLmFuZ2xlQW5pbWF0aW9uXyA9IG51bGw7XG5cbiAgLy8gU3RhdGUgdmFyaWFibGVzIGZvciBjYWxjdWxhdGlvbnMuXG4gIHRoaXMub3JpZW50YXRpb25fID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcblxuICAvLyBWYXJpYWJsZXMgZm9yIG1vdXNlLWJhc2VkIHJvdGF0aW9uLlxuICB0aGlzLnJvdGF0ZVN0YXJ0XyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRW5kXyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRGVsdGFfID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5pc0RyYWdnaW5nXyA9IGZhbHNlO1xuXG4gIHRoaXMub3JpZW50YXRpb25PdXRfID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbn1cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlID0gbmV3IFZSRGlzcGxheSgpO1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRJbW1lZGlhdGVQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3JpZW50YXRpb25fLnNldEZyb21FdWxlcllYWih0aGlzLnBoaV8sIHRoaXMudGhldGFfLCAwKTtcblxuICB0aGlzLm9yaWVudGF0aW9uT3V0X1swXSA9IHRoaXMub3JpZW50YXRpb25fLng7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzFdID0gdGhpcy5vcmllbnRhdGlvbl8ueTtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMl0gPSB0aGlzLm9yaWVudGF0aW9uXy56O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1szXSA9IHRoaXMub3JpZW50YXRpb25fLnc7XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbjogbnVsbCxcbiAgICBvcmllbnRhdGlvbjogdGhpcy5vcmllbnRhdGlvbk91dF8sXG4gICAgbGluZWFyVmVsb2NpdHk6IG51bGwsXG4gICAgbGluZWFyQWNjZWxlcmF0aW9uOiBudWxsLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbnVsbCxcbiAgICBhbmd1bGFyQWNjZWxlcmF0aW9uOiBudWxsXG4gIH07XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbktleURvd25fID0gZnVuY3Rpb24oZSkge1xuICAvLyBUcmFjayBXQVNEIGFuZCBhcnJvdyBrZXlzLlxuICBpZiAoZS5rZXlDb2RlID09IDM4KSB7IC8vIFVwIGtleS5cbiAgICB0aGlzLmFuaW1hdGVQaGlfKHRoaXMucGhpXyArIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM5KSB7IC8vIFJpZ2h0IGtleS5cbiAgICB0aGlzLmFuaW1hdGVUaGV0YV8odGhpcy50aGV0YV8gLSBLRVlfU1BFRUQpO1xuICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSA0MCkgeyAvLyBEb3duIGtleS5cbiAgICB0aGlzLmFuaW1hdGVQaGlfKHRoaXMucGhpXyAtIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM3KSB7IC8vIExlZnQga2V5LlxuICAgIHRoaXMuYW5pbWF0ZVRoZXRhXyh0aGlzLnRoZXRhXyArIEtFWV9TUEVFRCk7XG4gIH1cbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVUaGV0YV8gPSBmdW5jdGlvbih0YXJnZXRBbmdsZSkge1xuICB0aGlzLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18oJ3RoZXRhXycsIHRhcmdldEFuZ2xlKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVQaGlfID0gZnVuY3Rpb24odGFyZ2V0QW5nbGUpIHtcbiAgLy8gUHJldmVudCBsb29raW5nIHRvbyBmYXIgdXAgb3IgZG93bi5cbiAgdGFyZ2V0QW5nbGUgPSBVdGlsLmNsYW1wKHRhcmdldEFuZ2xlLCAtTWF0aC5QSS8yLCBNYXRoLlBJLzIpO1xuICB0aGlzLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18oJ3BoaV8nLCB0YXJnZXRBbmdsZSk7XG59O1xuXG4vKipcbiAqIFN0YXJ0IGFuIGFuaW1hdGlvbiB0byB0cmFuc2l0aW9uIGFuIGFuZ2xlIGZyb20gb25lIHZhbHVlIHRvIGFub3RoZXIuXG4gKi9cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18gPSBmdW5jdGlvbihhbmdsZU5hbWUsIHRhcmdldEFuZ2xlKSB7XG4gIC8vIElmIGFuIGFuaW1hdGlvbiBpcyBjdXJyZW50bHkgcnVubmluZywgY2FuY2VsIGl0LlxuICBpZiAodGhpcy5hbmdsZUFuaW1hdGlvbl8pIHtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuZ2xlQW5pbWF0aW9uXyk7XG4gIH1cbiAgdmFyIHN0YXJ0QW5nbGUgPSB0aGlzW2FuZ2xlTmFtZV07XG4gIHZhciBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAvLyBTZXQgdXAgYW4gaW50ZXJ2YWwgdGltZXIgdG8gcGVyZm9ybSB0aGUgYW5pbWF0aW9uLlxuICB0aGlzLmFuZ2xlQW5pbWF0aW9uXyA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiBhbmltYXRlKCkge1xuICAgIC8vIE9uY2Ugd2UncmUgZmluaXNoZWQgdGhlIGFuaW1hdGlvbiwgd2UncmUgZG9uZS5cbiAgICB2YXIgZWxhcHNlZCA9IG5ldyBEYXRlKCkgLSBzdGFydFRpbWU7XG4gICAgaWYgKGVsYXBzZWQgPj0gS0VZX0FOSU1BVElPTl9EVVJBVElPTikge1xuICAgICAgdGhpc1thbmdsZU5hbWVdID0gdGFyZ2V0QW5nbGU7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuZ2xlQW5pbWF0aW9uXyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGxvb3Agd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB0aGlzLmFuZ2xlQW5pbWF0aW9uXyA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlLmJpbmQodGhpcykpXG4gICAgLy8gTGluZWFybHkgaW50ZXJwb2xhdGUgdGhlIGFuZ2xlIHNvbWUgYW1vdW50LlxuICAgIHZhciBwZXJjZW50ID0gZWxhcHNlZCAvIEtFWV9BTklNQVRJT05fRFVSQVRJT047XG4gICAgdGhpc1thbmdsZU5hbWVdID0gc3RhcnRBbmdsZSArICh0YXJnZXRBbmdsZSAtIHN0YXJ0QW5nbGUpICogcGVyY2VudDtcbiAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uTW91c2VEb3duXyA9IGZ1bmN0aW9uKGUpIHtcbiAgdGhpcy5yb3RhdGVTdGFydF8uc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgdGhpcy5pc0RyYWdnaW5nXyA9IHRydWU7XG59O1xuXG4vLyBWZXJ5IHNpbWlsYXIgdG8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vbXJmbGl4LzgzNTEwMjBcbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uTW91c2VNb3ZlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKCF0aGlzLmlzRHJhZ2dpbmdfICYmICF0aGlzLmlzUG9pbnRlckxvY2tlZF8oKSkge1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBTdXBwb3J0IHBvaW50ZXIgbG9jayBBUEkuXG4gIGlmICh0aGlzLmlzUG9pbnRlckxvY2tlZF8oKSkge1xuICAgIHZhciBtb3ZlbWVudFggPSBlLm1vdmVtZW50WCB8fCBlLm1vek1vdmVtZW50WCB8fCAwO1xuICAgIHZhciBtb3ZlbWVudFkgPSBlLm1vdmVtZW50WSB8fCBlLm1vek1vdmVtZW50WSB8fCAwO1xuICAgIHRoaXMucm90YXRlRW5kXy5zZXQodGhpcy5yb3RhdGVTdGFydF8ueCAtIG1vdmVtZW50WCwgdGhpcy5yb3RhdGVTdGFydF8ueSAtIG1vdmVtZW50WSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5yb3RhdGVFbmRfLnNldChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gIH1cbiAgLy8gQ2FsY3VsYXRlIGhvdyBtdWNoIHdlIG1vdmVkIGluIG1vdXNlIHNwYWNlLlxuICB0aGlzLnJvdGF0ZURlbHRhXy5zdWJWZWN0b3JzKHRoaXMucm90YXRlRW5kXywgdGhpcy5yb3RhdGVTdGFydF8pO1xuICB0aGlzLnJvdGF0ZVN0YXJ0Xy5jb3B5KHRoaXMucm90YXRlRW5kXyk7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiB0aGUgY3VtdWxhdGl2ZSBldWxlciBhbmdsZXMuXG4gIHRoaXMucGhpXyArPSAyICogTWF0aC5QSSAqIHRoaXMucm90YXRlRGVsdGFfLnkgLyBzY3JlZW4uaGVpZ2h0ICogTU9VU0VfU1BFRURfWTtcbiAgdGhpcy50aGV0YV8gKz0gMiAqIE1hdGguUEkgKiB0aGlzLnJvdGF0ZURlbHRhXy54IC8gc2NyZWVuLndpZHRoICogTU9VU0VfU1BFRURfWDtcblxuICAvLyBQcmV2ZW50IGxvb2tpbmcgdG9vIGZhciB1cCBvciBkb3duLlxuICB0aGlzLnBoaV8gPSBVdGlsLmNsYW1wKHRoaXMucGhpXywgLU1hdGguUEkvMiwgTWF0aC5QSS8yKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uTW91c2VVcF8gPSBmdW5jdGlvbihlKSB7XG4gIHRoaXMuaXNEcmFnZ2luZ18gPSBmYWxzZTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmlzUG9pbnRlckxvY2tlZF8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGVsID0gZG9jdW1lbnQucG9pbnRlckxvY2tFbGVtZW50IHx8IGRvY3VtZW50Lm1velBvaW50ZXJMb2NrRWxlbWVudCB8fFxuICAgICAgZG9jdW1lbnQud2Via2l0UG9pbnRlckxvY2tFbGVtZW50O1xuICByZXR1cm4gZWwgIT09IHVuZGVmaW5lZDtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLnJlc2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBoaV8gPSAwO1xuICB0aGlzLnRoZXRhXyA9IDA7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vdXNlS2V5Ym9hcmRWUkRpc3BsYXk7XG4iLCIvLyBUaGlzIGlzIHRoZSBlbnRyeSBwb2ludCBpZiByZXF1aXJpbmcvaW1wb3J0aW5nIHZpYSBub2RlLCBvclxyXG4vLyBhIGJ1aWxkIHRvb2wgdGhhdCB1c2VzIHBhY2thZ2UuanNvbiBlbnRyeSAobGlrZSBicm93c2VyaWZ5LCB3ZWJwYWNrKS5cclxuLy8gSWYgcnVubmluZyBpbiBub2RlIHdpdGggYSB3aW5kb3cgbW9jayBhdmFpbGFibGUsIGdsb2JhbGl6ZSBpdHMgbWVtYmVyc1xyXG4vLyBpZiBuZWVkZWQuIE90aGVyd2lzZSwganVzdCBjb250aW51ZSB0byBgLi9tYWluYFxyXG5pZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsLndpbmRvdykge1xyXG4gIGdsb2JhbC5kb2N1bWVudCA9IGdsb2JhbC53aW5kb3cuZG9jdW1lbnQ7XHJcbiAgZ2xvYmFsLm5hdmlnYXRvciA9IGdsb2JhbC53aW5kb3cubmF2aWdhdG9yO1xyXG59XHJcblxyXG5yZXF1aXJlKCcuL21haW4nKTtcclxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gUm90YXRlSW5zdHJ1Y3Rpb25zKCkge1xuICB0aGlzLmxvYWRJY29uXygpO1xuXG4gIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gb3ZlcmxheS5zdHlsZTtcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMudG9wID0gMDtcbiAgcy5yaWdodCA9IDA7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5sZWZ0ID0gMDtcbiAgcy5iYWNrZ3JvdW5kQ29sb3IgPSAnZ3JheSc7XG4gIHMuZm9udEZhbWlseSA9ICdzYW5zLXNlcmlmJztcbiAgLy8gRm9yY2UgdGhpcyB0byBiZSBhYm92ZSB0aGUgZnVsbHNjcmVlbiBjYW52YXMsIHdoaWNoIGlzIGF0IHpJbmRleDogOTk5OTk5LlxuICBzLnpJbmRleCA9IDEwMDAwMDA7XG5cbiAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBpbWcuc3JjID0gdGhpcy5pY29uO1xuICB2YXIgcyA9IGltZy5zdHlsZTtcbiAgcy5tYXJnaW5MZWZ0ID0gJzI1JSc7XG4gIHMubWFyZ2luVG9wID0gJzI1JSc7XG4gIHMud2lkdGggPSAnNTAlJztcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChpbWcpO1xuXG4gIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gdGV4dC5zdHlsZTtcbiAgcy50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgcy5mb250U2l6ZSA9ICcxNnB4JztcbiAgcy5saW5lSGVpZ2h0ID0gJzI0cHgnO1xuICBzLm1hcmdpbiA9ICcyNHB4IDI1JSc7XG4gIHMud2lkdGggPSAnNTAlJztcbiAgdGV4dC5pbm5lckhUTUwgPSAnUGxhY2UgeW91ciBwaG9uZSBpbnRvIHlvdXIgQ2FyZGJvYXJkIHZpZXdlci4nO1xuICBvdmVybGF5LmFwcGVuZENoaWxkKHRleHQpO1xuXG4gIHZhciBzbmFja2JhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IHNuYWNrYmFyLnN0eWxlO1xuICBzLmJhY2tncm91bmRDb2xvciA9ICcjQ0ZEOERDJztcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMuYm90dG9tID0gMDtcbiAgcy53aWR0aCA9ICcxMDAlJztcbiAgcy5oZWlnaHQgPSAnNDhweCc7XG4gIHMucGFkZGluZyA9ICcxNHB4IDI0cHgnO1xuICBzLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgcy5jb2xvciA9ICcjNjU2QTZCJztcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChzbmFja2Jhcik7XG5cbiAgdmFyIHNuYWNrYmFyVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBzbmFja2JhclRleHQuc3R5bGUuZmxvYXQgPSAnbGVmdCc7XG4gIHNuYWNrYmFyVGV4dC5pbm5lckhUTUwgPSAnTm8gQ2FyZGJvYXJkIHZpZXdlcj8nO1xuXG4gIHZhciBzbmFja2JhckJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgc25hY2tiYXJCdXR0b24uaHJlZiA9ICdodHRwczovL3d3dy5nb29nbGUuY29tL2dldC9jYXJkYm9hcmQvZ2V0LWNhcmRib2FyZC8nO1xuICBzbmFja2JhckJ1dHRvbi5pbm5lckhUTUwgPSAnZ2V0IG9uZSc7XG4gIHNuYWNrYmFyQnV0dG9uLnRhcmdldCA9ICdfYmxhbmsnO1xuICB2YXIgcyA9IHNuYWNrYmFyQnV0dG9uLnN0eWxlO1xuICBzLmZsb2F0ID0gJ3JpZ2h0JztcbiAgcy5mb250V2VpZ2h0ID0gNjAwO1xuICBzLnRleHRUcmFuc2Zvcm0gPSAndXBwZXJjYXNlJztcbiAgcy5ib3JkZXJMZWZ0ID0gJzFweCBzb2xpZCBncmF5JztcbiAgcy5wYWRkaW5nTGVmdCA9ICcyNHB4JztcbiAgcy50ZXh0RGVjb3JhdGlvbiA9ICdub25lJztcbiAgcy5jb2xvciA9ICcjNjU2QTZCJztcblxuICBzbmFja2Jhci5hcHBlbmRDaGlsZChzbmFja2JhclRleHQpO1xuICBzbmFja2Jhci5hcHBlbmRDaGlsZChzbmFja2JhckJ1dHRvbik7XG5cbiAgdGhpcy5vdmVybGF5ID0gb3ZlcmxheTtcbiAgdGhpcy50ZXh0ID0gdGV4dDtcblxuICB0aGlzLmhpZGUoKTtcbn1cblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24ocGFyZW50KSB7XG4gIGlmICghcGFyZW50ICYmICF0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudCkge1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5vdmVybGF5KTtcbiAgfSBlbHNlIGlmIChwYXJlbnQpIHtcbiAgICBpZiAodGhpcy5vdmVybGF5LnBhcmVudEVsZW1lbnQgJiYgdGhpcy5vdmVybGF5LnBhcmVudEVsZW1lbnQgIT0gcGFyZW50KVxuICAgICAgdGhpcy5vdmVybGF5LnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5vdmVybGF5KTtcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZCh0aGlzLm92ZXJsYXkpO1xuICB9XG5cbiAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG4gIHZhciBpbWcgPSB0aGlzLm92ZXJsYXkucXVlcnlTZWxlY3RvcignaW1nJyk7XG4gIHZhciBzID0gaW1nLnN0eWxlO1xuXG4gIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpKSB7XG4gICAgcy53aWR0aCA9ICcyMCUnO1xuICAgIHMubWFyZ2luTGVmdCA9ICc0MCUnO1xuICAgIHMubWFyZ2luVG9wID0gJzMlJztcbiAgfSBlbHNlIHtcbiAgICBzLndpZHRoID0gJzUwJSc7XG4gICAgcy5tYXJnaW5MZWZ0ID0gJzI1JSc7XG4gICAgcy5tYXJnaW5Ub3AgPSAnMjUlJztcbiAgfVxufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5zaG93VGVtcG9yYXJpbHkgPSBmdW5jdGlvbihtcywgcGFyZW50KSB7XG4gIHRoaXMuc2hvdyhwYXJlbnQpO1xuICB0aGlzLnRpbWVyID0gc2V0VGltZW91dCh0aGlzLmhpZGUuYmluZCh0aGlzKSwgbXMpO1xufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5kaXNhYmxlU2hvd1RlbXBvcmFyaWx5ID0gZnVuY3Rpb24oKSB7XG4gIGNsZWFyVGltZW91dCh0aGlzLnRpbWVyKTtcbn07XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZGlzYWJsZVNob3dUZW1wb3JhcmlseSgpO1xuICAvLyBJbiBwb3J0cmFpdCBWUiBtb2RlLCB0ZWxsIHRoZSB1c2VyIHRvIHJvdGF0ZSB0byBsYW5kc2NhcGUuIE90aGVyd2lzZSwgaGlkZVxuICAvLyB0aGUgaW5zdHJ1Y3Rpb25zLlxuICBpZiAoIVV0aWwuaXNMYW5kc2NhcGVNb2RlKCkgJiYgVXRpbC5pc01vYmlsZSgpKSB7XG4gICAgdGhpcy5zaG93KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5oaWRlKCk7XG4gIH1cbn07XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUubG9hZEljb25fID0gZnVuY3Rpb24oKSB7XG4gIC8vIEVuY29kZWQgYXNzZXRfc3JjL3JvdGF0ZS1pbnN0cnVjdGlvbnMuc3ZnXG4gIHRoaXMuaWNvbiA9IFV0aWwuYmFzZTY0KCdpbWFnZS9zdmcreG1sJywgJ1BEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0NqeHpkbWNnZDJsa2RHZzlJakU1T0hCNElpQm9aV2xuYUhROUlqSTBNSEI0SWlCMmFXVjNRbTk0UFNJd0lEQWdNVGs0SURJME1DSWdkbVZ5YzJsdmJqMGlNUzR4SWlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhodGJHNXpPbmhzYVc1clBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHhPVGs1TDNoc2FXNXJJaUI0Yld4dWN6cHphMlYwWTJnOUltaDBkSEE2THk5M2QzY3VZbTlvWlcxcFlXNWpiMlJwYm1jdVkyOXRMM05yWlhSamFDOXVjeUkrQ2lBZ0lDQThJUzB0SUVkbGJtVnlZWFJ2Y2pvZ1UydGxkR05vSURNdU15NHpJQ2d4TWpBNE1Ta2dMU0JvZEhSd09pOHZkM2QzTG1KdmFHVnRhV0Z1WTI5a2FXNW5MbU52YlM5emEyVjBZMmdnTFMwK0NpQWdJQ0E4ZEdsMGJHVStkSEpoYm5OcGRHbHZiand2ZEdsMGJHVStDaUFnSUNBOFpHVnpZejVEY21WaGRHVmtJSGRwZEdnZ1UydGxkR05vTGp3dlpHVnpZejRLSUNBZ0lEeGtaV1p6UGp3dlpHVm1jejRLSUNBZ0lEeG5JR2xrUFNKUVlXZGxMVEVpSUhOMGNtOXJaVDBpYm05dVpTSWdjM1J5YjJ0bExYZHBaSFJvUFNJeElpQm1hV3hzUFNKdWIyNWxJaUJtYVd4c0xYSjFiR1U5SW1WMlpXNXZaR1FpSUhOclpYUmphRHAwZVhCbFBTSk5VMUJoWjJVaVBnb2dJQ0FnSUNBZ0lEeG5JR2xrUFNKMGNtRnVjMmwwYVc5dUlpQnphMlYwWTJnNmRIbHdaVDBpVFZOQmNuUmliMkZ5WkVkeWIzVndJajRLSUNBZ0lDQWdJQ0FnSUNBZ1BHY2dhV1E5SWtsdGNHOXlkR1ZrTFV4aGVXVnljeTFEYjNCNUxUUXRLeTFKYlhCdmNuUmxaQzFNWVhsbGNuTXRRMjl3ZVMwckxVbHRjRzl5ZEdWa0xVeGhlV1Z5Y3kxRGIzQjVMVEl0UTI5d2VTSWdjMnRsZEdOb09uUjVjR1U5SWsxVFRHRjVaWEpIY205MWNDSStDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThaeUJwWkQwaVNXMXdiM0owWldRdFRHRjVaWEp6TFVOdmNIa3ROQ0lnZEhKaGJuTm1iM0p0UFNKMGNtRnVjMnhoZEdVb01DNHdNREF3TURBc0lERXdOeTR3TURBd01EQXBJaUJ6YTJWMFkyZzZkSGx3WlQwaVRWTlRhR0Z3WlVkeWIzVndJajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UUTVMall5TlN3eUxqVXlOeUJETVRRNUxqWXlOU3d5TGpVeU55QXhOVFV1T0RBMUxEWXVNRGsySURFMU5pNHpOaklzTmk0ME1UZ2dUREUxTmk0ek5qSXNOeTR6TURRZ1F6RTFOaTR6TmpJc055NDBPREVnTVRVMkxqTTNOU3czTGpZMk5DQXhOVFl1TkN3M0xqZzFNeUJETVRVMkxqUXhMRGN1T1RNMElERTFOaTQwTWl3NExqQXhOU0F4TlRZdU5ESTNMRGd1TURrMUlFTXhOVFl1TlRZM0xEa3VOVEVnTVRVM0xqUXdNU3d4TVM0d09UTWdNVFU0TGpVek1pd3hNaTR3T1RRZ1RERTJOQzR5TlRJc01UY3VNVFUySUV3eE5qUXVNek16TERFM0xqQTJOaUJETVRZMExqTXpNeXd4Tnk0d05qWWdNVFk0TGpjeE5Td3hOQzQxTXpZZ01UWTVMalUyT0N3eE5DNHdORElnUXpFM01TNHdNalVzTVRRdU9EZ3pJREU1TlM0MU16Z3NNamt1TURNMUlERTVOUzQxTXpnc01qa3VNRE0xSUV3eE9UVXVOVE00TERnekxqQXpOaUJETVRrMUxqVXpPQ3c0TXk0NE1EY2dNVGsxTGpFMU1pdzROQzR5TlRNZ01UazBMalU1TERnMExqSTFNeUJETVRrMExqTTFOeXc0TkM0eU5UTWdNVGswTGpBNU5TdzROQzR4TnpjZ01Ua3pMamd4T0N3NE5DNHdNVGNnVERFMk9TNDROVEVzTnpBdU1UYzVJRXd4TmprdU9ETTNMRGN3TGpJd015Qk1NVFF5TGpVeE5TdzROUzQ1TnpnZ1RERTBNUzQyTmpVc09EUXVOalUxSUVNeE16WXVPVE0wTERnekxqRXlOaUF4TXpFdU9URTNMRGd4TGpreE5TQXhNall1TnpFMExEZ3hMakEwTlNCRE1USTJMamN3T1N3NE1TNHdOaUF4TWpZdU56QTNMRGd4TGpBMk9TQXhNall1TnpBM0xEZ3hMakEyT1NCTU1USXhMalkwTERrNExqQXpJRXd4TVRNdU56UTVMREV3TWk0MU9EWWdUREV4TXk0M01USXNNVEF5TGpVeU15Qk1NVEV6TGpjeE1pd3hNekF1TVRFeklFTXhNVE11TnpFeUxERXpNQzQ0T0RVZ01URXpMak15Tml3eE16RXVNek1nTVRFeUxqYzJOQ3d4TXpFdU16TWdRekV4TWk0MU16SXNNVE14TGpNeklERXhNaTR5Tmprc01UTXhMakkxTkNBeE1URXVPVGt5TERFek1TNHdPVFFnVERZNUxqVXhPU3d4TURZdU5UY3lJRU0yT0M0MU5qa3NNVEEyTGpBeU15QTJOeTQzT1Rrc01UQTBMalk1TlNBMk55NDNPVGtzTVRBekxqWXdOU0JNTmpjdU56azVMREV3TWk0MU55Qk1OamN1TnpjNExERXdNaTQyTVRjZ1F6WTNMakkzTERFd01pNHpPVE1nTmpZdU5qUTRMREV3TWk0eU5Ea2dOalV1T1RZeUxERXdNaTR5TVRnZ1F6WTFMamczTlN3eE1ESXVNakUwSURZMUxqYzRPQ3d4TURJdU1qRXlJRFkxTGpjd01Td3hNREl1TWpFeUlFTTJOUzQyTURZc01UQXlMakl4TWlBMk5TNDFNVEVzTVRBeUxqSXhOU0EyTlM0ME1UWXNNVEF5TGpJeE9TQkROalV1TVRrMUxERXdNaTR5TWprZ05qUXVPVGMwTERFd01pNHlNelVnTmpRdU56VTBMREV3TWk0eU16VWdRelkwTGpNek1Td3hNREl1TWpNMUlEWXpMamt4TVN3eE1ESXVNakUySURZekxqUTVPQ3d4TURJdU1UYzRJRU0yTVM0NE5ETXNNVEF5TGpBeU5TQTJNQzR5T1Rnc01UQXhMalUzT0NBMU9TNHdPVFFzTVRBd0xqZzRNaUJNTVRJdU5URTRMRGN6TGprNU1pQk1NVEl1TlRJekxEYzBMakF3TkNCTU1pNHlORFVzTlRVdU1qVTBJRU14TGpJME5DdzFNeTQwTWpjZ01pNHdNRFFzTlRFdU1ETTRJRE11T1RRekxEUTVMamt4T0NCTU5Ua3VPVFUwTERFM0xqVTNNeUJETmpBdU5qSTJMREUzTGpFNE5TQTJNUzR6TlN3eE55NHdNREVnTmpJdU1EVXpMREUzTGpBd01TQkROak11TXpjNUxERTNMakF3TVNBMk5DNDJNalVzTVRjdU5qWWdOalV1TWpnc01UZ3VPRFUwSUV3Mk5TNHlPRFVzTVRndU9EVXhJRXcyTlM0MU1USXNNVGt1TWpZMElFdzJOUzQxTURZc01Ua3VNalk0SUVNMk5TNDVNRGtzTWpBdU1EQXpJRFkyTGpRd05Td3lNQzQyT0NBMk5pNDVPRE1zTWpFdU1qZzJJRXcyTnk0eU5pd3lNUzQxTlRZZ1F6WTVMakUzTkN3eU15NDBNRFlnTnpFdU56STRMREkwTGpNMU55QTNOQzR6TnpNc01qUXVNelUzSUVNM05pNHpNaklzTWpRdU16VTNJRGM0TGpNeU1Td3lNeTQ0TkNBNE1DNHhORGdzTWpJdU56ZzFJRU00TUM0eE5qRXNNakl1TnpnMUlEZzNMalEyTnl3eE9DNDFOallnT0RjdU5EWTNMREU0TGpVMk5pQkRPRGd1TVRNNUxERTRMakUzT0NBNE9DNDROak1zTVRjdU9UazBJRGc1TGpVMk5pd3hOeTQ1T1RRZ1F6a3dMamc1TWl3eE55NDVPVFFnT1RJdU1UTTRMREU0TGpZMU1pQTVNaTQzT1RJc01Ua3VPRFEzSUV3NU5pNHdORElzTWpVdU56YzFJRXc1Tmk0d05qUXNNalV1TnpVM0lFd3hNREl1T0RRNUxESTVMalkzTkNCTU1UQXlMamMwTkN3eU9TNDBPVElnVERFME9TNDJNalVzTWk0MU1qY2dUVEUwT1M0Mk1qVXNNQzQ0T1RJZ1F6RTBPUzR6TkRNc01DNDRPVElnTVRRNUxqQTJNaXd3TGprMk5TQXhORGd1T0RFc01TNHhNU0JNTVRBeUxqWTBNU3d5Tnk0Mk5qWWdURGszTGpJek1Td3lOQzQxTkRJZ1REazBMakl5Tml3eE9TNHdOakVnUXprekxqTXhNeXd4Tnk0ek9UUWdPVEV1TlRJM0xERTJMak0xT1NBNE9TNDFOallzTVRZdU16VTRJRU00T0M0MU5UVXNNVFl1TXpVNElEZzNMalUwTml3eE5pNDJNeklnT0RZdU5qUTVMREUzTGpFMUlFTTRNeTQ0Tnpnc01UZ3VOelVnTnprdU5qZzNMREl4TGpFMk9TQTNPUzR6TnpRc01qRXVNelExSUVNM09TNHpOVGtzTWpFdU16VXpJRGM1TGpNME5Td3lNUzR6TmpFZ056a3VNek1zTWpFdU16WTVJRU0zTnk0M09UZ3NNakl1TWpVMElEYzJMakE0TkN3eU1pNDNNaklnTnpRdU16Y3pMREl5TGpjeU1pQkROekl1TURneExESXlMamN5TWlBMk9TNDVOVGtzTWpFdU9Ea2dOamd1TXprM0xESXdMak00SUV3Mk9DNHhORFVzTWpBdU1UTTFJRU0yTnk0M01EWXNNVGt1TmpjeUlEWTNMak15TXl3eE9TNHhOVFlnTmpjdU1EQTJMREU0TGpZd01TQkROall1T1RnNExERTRMalUxT1NBMk5pNDVOamdzTVRndU5URTVJRFkyTGprME5pd3hPQzQwTnprZ1REWTJMamN4T1N3eE9DNHdOalVnUXpZMkxqWTVMREU0TGpBeE1pQTJOaTQyTlRnc01UY3VPVFlnTmpZdU5qSTBMREUzTGpreE1TQkROalV1TmpnMkxERTJMak16TnlBMk15NDVOVEVzTVRVdU16WTJJRFl5TGpBMU15d3hOUzR6TmpZZ1F6WXhMakEwTWl3eE5TNHpOallnTmpBdU1ETXpMREUxTGpZMElEVTVMakV6Tml3eE5pNHhOVGdnVERNdU1USTFMRFE0TGpVd01pQkRNQzQwTWpZc05UQXVNRFl4SUMwd0xqWXhNeXcxTXk0ME5ESWdNQzQ0TVRFc05UWXVNRFFnVERFeExqQTRPU3czTkM0M09TQkRNVEV1TWpZMkxEYzFMakV4TXlBeE1TNDFNemNzTnpVdU16VXpJREV4TGpnMUxEYzFMalE1TkNCTU5UZ3VNamMyTERFd01pNHlPVGdnUXpVNUxqWTNPU3d4TURNdU1UQTRJRFl4TGpRek15d3hNRE11TmpNZ05qTXVNelE0TERFd015NDRNRFlnUXpZekxqZ3hNaXd4TURNdU9EUTRJRFkwTGpJNE5Td3hNRE11T0RjZ05qUXVOelUwTERFd015NDROeUJETmpVc01UQXpMamczSURZMUxqSTBPU3d4TURNdU9EWTBJRFkxTGpRNU5Dd3hNRE11T0RVeUlFTTJOUzQxTmpNc01UQXpMamcwT1NBMk5TNDJNeklzTVRBekxqZzBOeUEyTlM0M01ERXNNVEF6TGpnME55QkROalV1TnpZMExERXdNeTQ0TkRjZ05qVXVPREk0TERFd015NDRORGtnTmpVdU9Ea3NNVEF6TGpnMU1pQkROalV1T1RnMkxERXdNeTQ0TlRZZ05qWXVNRGdzTVRBekxqZzJNeUEyTmk0eE56TXNNVEF6TGpnM05DQkROall1TWpneUxERXdOUzQwTmpjZ05qY3VNek15TERFd055NHhPVGNnTmpndU56QXlMREV3Tnk0NU9EZ2dUREV4TVM0eE56UXNNVE15TGpVeElFTXhNVEV1TmprNExERXpNaTQ0TVRJZ01URXlMakl6TWl3eE16SXVPVFkxSURFeE1pNDNOalFzTVRNeUxqazJOU0JETVRFMExqSTJNU3d4TXpJdU9UWTFJREV4TlM0ek5EY3NNVE14TGpjMk5TQXhNVFV1TXpRM0xERXpNQzR4TVRNZ1RERXhOUzR6TkRjc01UQXpMalUxTVNCTU1USXlMalExT0N3NU9TNDBORFlnUXpFeU1pNDRNVGtzT1RrdU1qTTNJREV5TXk0d09EY3NPVGd1T0RrNElERXlNeTR5TURjc09UZ3VORGs0SUV3eE1qY3VPRFkxTERneUxqa3dOU0JETVRNeUxqSTNPU3c0TXk0M01ESWdNVE0yTGpVMU55dzROQzQzTlRNZ01UUXdMall3Tnl3NE5pNHdNek1nVERFME1TNHhOQ3c0Tmk0NE5qSWdRekUwTVM0ME5URXNPRGN1TXpRMklERTBNUzQ1Tnpjc09EY3VOakV6SURFME1pNDFNVFlzT0RjdU5qRXpJRU14TkRJdU56azBMRGczTGpZeE15QXhORE11TURjMkxEZzNMalUwTWlBeE5ETXVNek16TERnM0xqTTVNeUJNTVRZNUxqZzJOU3czTWk0d056WWdUREU1TXl3NE5TNDBNek1nUXpFNU15NDFNak1zT0RVdU56TTFJREU1TkM0d05UZ3NPRFV1T0RnNElERTVOQzQxT1N3NE5TNDRPRGdnUXpFNU5pNHdPRGNzT0RVdU9EZzRJREU1Tnk0eE56TXNPRFF1TmpnNUlERTVOeTR4TnpNc09ETXVNRE0ySUV3eE9UY3VNVGN6TERJNUxqQXpOU0JETVRrM0xqRTNNeXd5T0M0ME5URWdNVGsyTGpnMk1Td3lOeTQ1TVRFZ01UazJMak0xTlN3eU55NDJNVGtnUXpFNU5pNHpOVFVzTWpjdU5qRTVJREUzTVM0NE5ETXNNVE11TkRZM0lERTNNQzR6T0RVc01USXVOakkySUVNeE56QXVNVE15TERFeUxqUTRJREUyT1M0NE5Td3hNaTQwTURjZ01UWTVMalUyT0N3eE1pNDBNRGNnUXpFMk9TNHlPRFVzTVRJdU5EQTNJREUyT1M0d01ESXNNVEl1TkRneElERTJPQzQzTkRrc01USXVOakkzSUVNeE5qZ3VNVFF6TERFeUxqazNPQ0F4TmpVdU56VTJMREUwTGpNMU55QXhOalF1TkRJMExERTFMakV5TlNCTU1UVTVMall4TlN3eE1DNDROeUJETVRVNExqYzVOaXd4TUM0eE5EVWdNVFU0TGpFMU5DdzRMamt6TnlBeE5UZ3VNRFUwTERjdU9UTTBJRU14TlRndU1EUTFMRGN1T0RNM0lERTFPQzR3TXpRc055NDNNemtnTVRVNExqQXlNU3czTGpZMElFTXhOVGd1TURBMUxEY3VOVEl6SURFMU55NDVPVGdzTnk0ME1TQXhOVGN1T1RrNExEY3VNekEwSUV3eE5UY3VPVGs0TERZdU5ERTRJRU14TlRjdU9UazRMRFV1T0RNMElERTFOeTQyT0RZc05TNHlPVFVnTVRVM0xqRTRNU3cxTGpBd01pQkRNVFUyTGpZeU5DdzBMalk0SURFMU1DNDBORElzTVM0eE1URWdNVFV3TGpRME1pd3hMakV4TVNCRE1UVXdMakU0T1N3d0xqazJOU0F4TkRrdU9UQTNMREF1T0RreUlERTBPUzQyTWpVc01DNDRPVElpSUdsa1BTSkdhV3hzTFRFaUlHWnBiR3c5SWlNME5UVkJOalFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk9UWXVNREkzTERJMUxqWXpOaUJNTVRReUxqWXdNeXcxTWk0MU1qY2dRekUwTXk0NE1EY3NOVE11TWpJeUlERTBOQzQxT0RJc05UUXVNVEUwSURFME5DNDRORFVzTlRVdU1EWTRJRXd4TkRRdU9ETTFMRFUxTGpBM05TQk1Oak11TkRZeExERXdNaTR3TlRjZ1REWXpMalEyTERFd01pNHdOVGNnUXpZeExqZ3dOaXd4TURFdU9UQTFJRFl3TGpJMk1Td3hNREV1TkRVM0lEVTVMakExTnl3eE1EQXVOell5SUV3eE1pNDBPREVzTnpNdU9EY3hJRXc1Tmk0d01qY3NNalV1TmpNMklpQnBaRDBpUm1sc2JDMHlJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFl6TGpRMk1Td3hNREl1TVRjMElFTTJNeTQwTlRNc01UQXlMakUzTkNBMk15NDBORFlzTVRBeUxqRTNOQ0EyTXk0ME16a3NNVEF5TGpFM01pQkROakV1TnpRMkxERXdNaTR3TVRZZ05qQXVNakV4TERFd01TNDFOak1nTlRndU9UazRMREV3TUM0NE5qTWdUREV5TGpReU1pdzNNeTQ1TnpNZ1F6RXlMak00Tml3M015NDVOVElnTVRJdU16WTBMRGN6TGpreE5DQXhNaTR6TmpRc056TXVPRGN4SUVNeE1pNHpOalFzTnpNdU9ETWdNVEl1TXpnMkxEY3pMamM1TVNBeE1pNDBNaklzTnpNdU56Y2dURGsxTGprMk9Dd3lOUzQxTXpVZ1F6azJMakF3TkN3eU5TNDFNVFFnT1RZdU1EUTVMREkxTGpVeE5DQTVOaTR3T0RVc01qVXVOVE0xSUV3eE5ESXVOall4TERVeUxqUXlOaUJETVRRekxqZzRPQ3cxTXk0eE16UWdNVFEwTGpZNE1pdzFOQzR3TXpnZ01UUTBMamsxTnl3MU5TNHdNemNnUXpFME5DNDVOeXcxTlM0d09ETWdNVFEwTGprMU15dzFOUzR4TXpNZ01UUTBMamt4TlN3MU5TNHhOakVnUXpFME5DNDVNVEVzTlRVdU1UWTFJREUwTkM0NE9UZ3NOVFV1TVRjMElERTBOQzQ0T1RRc05UVXVNVGMzSUV3Mk15NDFNVGtzTVRBeUxqRTFPQ0JETmpNdU5UQXhMREV3TWk0eE5qa2dOak11TkRneExERXdNaTR4TnpRZ05qTXVORFl4TERFd01pNHhOelFnVERZekxqUTJNU3d4TURJdU1UYzBJRm9nVFRFeUxqY3hOQ3czTXk0NE56RWdURFU1TGpFeE5Td3hNREF1TmpZeElFTTJNQzR5T1RNc01UQXhMak0wTVNBMk1TNDNPRFlzTVRBeExqYzRNaUEyTXk0ME16VXNNVEF4TGprek55Qk1NVFEwTGpjd055dzFOUzR3TVRVZ1F6RTBOQzQwTWpnc05UUXVNVEE0SURFME15NDJPRElzTlRNdU1qZzFJREUwTWk0MU5EUXNOVEl1TmpJNElFdzVOaTR3TWpjc01qVXVOemN4SUV3eE1pNDNNVFFzTnpNdU9EY3hJRXd4TWk0M01UUXNOek11T0RjeElGb2lJR2xrUFNKR2FXeHNMVE1pSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRRNExqTXlOeXcxT0M0ME56RWdRekUwT0M0eE5EVXNOVGd1TkRnZ01UUTNMamsyTWl3MU9DNDBPQ0F4TkRjdU56Z3hMRFU0TGpRM01pQkRNVFExTGpnNE55dzFPQzR6T0RrZ01UUTBMalEzT1N3MU55NDBNelFnTVRRMExqWXpOaXcxTmk0ek5DQkRNVFEwTGpZNE9TdzFOUzQ1TmpjZ01UUTBMalkyTkN3MU5TNDFPVGNnTVRRMExqVTJOQ3cxTlM0eU16VWdURFl6TGpRMk1Td3hNREl1TURVM0lFTTJOQzR3T0Rrc01UQXlMakV4TlNBMk5DNDNNek1zTVRBeUxqRXpJRFkxTGpNM09Td3hNREl1TURrNUlFTTJOUzQxTmpFc01UQXlMakE1SURZMUxqYzBNeXd4TURJdU1Ea2dOalV1T1RJMUxERXdNaTR3T1RnZ1F6WTNMamd4T1N3eE1ESXVNVGd4SURZNUxqSXlOeXd4TURNdU1UTTJJRFk1TGpBM0xERXdOQzR5TXlCTU1UUTRMak15Tnl3MU9DNDBOekVpSUdsa1BTSkdhV3hzTFRRaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk5qa3VNRGNzTVRBMExqTTBOeUJETmprdU1EUTRMREV3TkM0ek5EY2dOamt1TURJMUxERXdOQzR6TkNBMk9TNHdNRFVzTVRBMExqTXlOeUJETmpndU9UWTRMREV3TkM0ek1ERWdOamd1T1RRNExERXdOQzR5TlRjZ05qZ3VPVFUxTERFd05DNHlNVE1nUXpZNUxERXdNeTQ0T1RZZ05qZ3VPRGs0TERFd015NDFOellnTmpndU5qVTRMREV3TXk0eU9EZ2dRelk0TGpFMU15d3hNREl1TmpjNElEWTNMakV3TXl3eE1ESXVNalkySURZMUxqa3lMREV3TWk0eU1UUWdRelkxTGpjME1pd3hNREl1TWpBMklEWTFMalUyTXl3eE1ESXVNakEzSURZMUxqTTROU3d4TURJdU1qRTFJRU0yTkM0M05ESXNNVEF5TGpJME5pQTJOQzR3T0Rjc01UQXlMakl6TWlBMk15NDBOU3d4TURJdU1UYzBJRU0yTXk0ek9Ua3NNVEF5TGpFMk9TQTJNeTR6TlRnc01UQXlMakV6TWlBMk15NHpORGNzTVRBeUxqQTRNaUJETmpNdU16TTJMREV3TWk0d016TWdOak11TXpVNExERXdNUzQ1T0RFZ05qTXVOREF5TERFd01TNDVOVFlnVERFME5DNDFNRFlzTlRVdU1UTTBJRU14TkRRdU5UTTNMRFUxTGpFeE5pQXhORFF1TlRjMUxEVTFMakV4TXlBeE5EUXVOakE1TERVMUxqRXlOeUJETVRRMExqWTBNaXcxTlM0eE5ERWdNVFEwTGpZMk9DdzFOUzR4TnlBeE5EUXVOamMzTERVMUxqSXdOQ0JETVRRMExqYzRNU3cxTlM0MU9EVWdNVFEwTGpnd05pdzFOUzQ1TnpJZ01UUTBMamMxTVN3MU5pNHpOVGNnUXpFME5DNDNNRFlzTlRZdU5qY3pJREUwTkM0NE1EZ3NOVFl1T1RrMElERTBOUzR3TkRjc05UY3VNamd5SUVNeE5EVXVOVFV6TERVM0xqZzVNaUF4TkRZdU5qQXlMRFU0TGpNd015QXhORGN1TnpnMkxEVTRMak0xTlNCRE1UUTNMamsyTkN3MU9DNHpOak1nTVRRNExqRTBNeXcxT0M0ek5qTWdNVFE0TGpNeU1TdzFPQzR6TlRRZ1F6RTBPQzR6Tnpjc05UZ3VNelV5SURFME9DNDBNalFzTlRndU16ZzNJREUwT0M0ME16a3NOVGd1TkRNNElFTXhORGd1TkRVMExEVTRMalE1SURFME9DNDBNeklzTlRndU5UUTFJREUwT0M0ek9EVXNOVGd1TlRjeUlFdzJPUzR4TWprc01UQTBMak16TVNCRE5qa3VNVEV4TERFd05DNHpORElnTmprdU1Ea3NNVEEwTGpNME55QTJPUzR3Tnl3eE1EUXVNelEzSUV3Mk9TNHdOeXd4TURRdU16UTNJRm9nVFRZMUxqWTJOU3d4TURFdU9UYzFJRU0yTlM0M05UUXNNVEF4TGprM05TQTJOUzQ0TkRJc01UQXhMamszTnlBMk5TNDVNeXd4TURFdU9UZ3hJRU0yTnk0eE9UWXNNVEF5TGpBek55QTJPQzR5T0RNc01UQXlMalEyT1NBMk9DNDRNemdzTVRBekxqRXpPU0JETmprdU1EWTFMREV3TXk0ME1UTWdOamt1TVRnNExERXdNeTQzTVRRZ05qa3VNVGs0TERFd05DNHdNakVnVERFME55NDRPRE1zTlRndU5Ua3lJRU14TkRjdU9EUTNMRFU0TGpVNU1pQXhORGN1T0RFeExEVTRMalU1TVNBeE5EY3VOemMyTERVNExqVTRPU0JETVRRMkxqVXdPU3cxT0M0MU16TWdNVFExTGpReU1pdzFPQzR4SURFME5DNDROamNzTlRjdU5ETXhJRU14TkRRdU5UZzFMRFUzTGpBNU1TQXhORFF1TkRZMUxEVTJMamN3TnlBeE5EUXVOVElzTlRZdU16STBJRU14TkRRdU5UWXpMRFUyTGpBeU1TQXhORFF1TlRVeUxEVTFMamN4TmlBeE5EUXVORGc0TERVMUxqUXhOQ0JNTmpNdU9EUTJMREV3TVM0NU55QkROalF1TXpVekxERXdNaTR3TURJZ05qUXVPRFkzTERFd01pNHdNRFlnTmpVdU16YzBMREV3TVM0NU9ESWdRelkxTGpRM01Td3hNREV1T1RjM0lEWTFMalUyT0N3eE1ERXVPVGMxSURZMUxqWTJOU3d4TURFdU9UYzFJRXcyTlM0Mk5qVXNNVEF4TGprM05TQmFJaUJwWkQwaVJtbHNiQzAxSWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRJdU1qQTRMRFUxTGpFek5DQkRNUzR5TURjc05UTXVNekEzSURFdU9UWTNMRFV3TGpreE55QXpMamt3Tml3ME9TNDNPVGNnVERVNUxqa3hOeXd4Tnk0ME5UTWdRell4TGpnMU5pd3hOaTR6TXpNZ05qUXVNalF4TERFMkxqa3dOeUEyTlM0eU5ETXNNVGd1TnpNMElFdzJOUzQwTnpVc01Ua3VNVFEwSUVNMk5TNDROeklzTVRrdU9EZ3lJRFkyTGpNMk9Dd3lNQzQxTmlBMk5pNDVORFVzTWpFdU1UWTFJRXcyTnk0eU1qTXNNakV1TkRNMUlFTTNNQzQxTkRnc01qUXVOalE1SURjMUxqZ3dOaXd5TlM0eE5URWdPREF1TVRFeExESXlMalkyTlNCTU9EY3VORE1zTVRndU5EUTFJRU00T1M0ek55d3hOeTR6TWpZZ09URXVOelUwTERFM0xqZzVPU0E1TWk0M05UVXNNVGt1TnpJM0lFdzVOaTR3TURVc01qVXVOalUxSUV3eE1pNDBPRFlzTnpNdU9EZzBJRXd5TGpJd09DdzFOUzR4TXpRZ1dpSWdhV1E5SWtacGJHd3ROaUlnWm1sc2JEMGlJMFpCUmtGR1FTSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TWk0ME9EWXNOelF1TURBeElFTXhNaTQwTnpZc056UXVNREF4SURFeUxqUTJOU3czTXk0NU9Ua2dNVEl1TkRVMUxEY3pMams1TmlCRE1USXVOREkwTERjekxqazRPQ0F4TWk0ek9Ua3NOek11T1RZM0lERXlMak00TkN3M015NDVOQ0JNTWk0eE1EWXNOVFV1TVRrZ1F6RXVNRGMxTERVekxqTXhJREV1T0RVM0xEVXdMamcwTlNBekxqZzBPQ3cwT1M0Mk9UWWdURFU1TGpnMU9Dd3hOeTR6TlRJZ1F6WXdMalV5TlN3eE5pNDVOamNnTmpFdU1qY3hMREUyTGpjMk5DQTJNaTR3TVRZc01UWXVOelkwSUVNMk15NDBNekVzTVRZdU56WTBJRFkwTGpZMk5pd3hOeTQwTmpZZ05qVXVNekkzTERFNExqWTBOaUJETmpVdU16TTNMREU0TGpZMU5DQTJOUzR6TkRVc01UZ3VOall6SURZMUxqTTFNU3d4T0M0Mk56UWdURFkxTGpVM09Dd3hPUzR3T0RnZ1F6WTFMalU0TkN3eE9TNHhJRFkxTGpVNE9Td3hPUzR4TVRJZ05qVXVOVGt4TERFNUxqRXlOaUJETmpVdU9UZzFMREU1TGpnek9DQTJOaTQwTmprc01qQXVORGszSURZM0xqQXpMREl4TGpBNE5TQk1OamN1TXpBMUxESXhMak0xTVNCRE5qa3VNVFV4TERJekxqRXpOeUEzTVM0Mk5Ea3NNalF1TVRJZ056UXVNek0yTERJMExqRXlJRU0zTmk0ek1UTXNNalF1TVRJZ056Z3VNamtzTWpNdU5UZ3lJRGd3TGpBMU15d3lNaTQxTmpNZ1F6Z3dMakEyTkN3eU1pNDFOVGNnT0RBdU1EYzJMREl5TGpVMU15QTRNQzR3T0Rnc01qSXVOVFVnVERnM0xqTTNNaXd4T0M0ek5EUWdRemc0TGpBek9Dd3hOeTQ1TlRrZ09EZ3VOemcwTERFM0xqYzFOaUE0T1M0MU1qa3NNVGN1TnpVMklFTTVNQzQ1TlRZc01UY3VOelUySURreUxqSXdNU3d4T0M0ME56SWdPVEl1T0RVNExERTVMalkzSUV3NU5pNHhNRGNzTWpVdU5UazVJRU01Tmk0eE16Z3NNalV1TmpVMElEazJMakV4T0N3eU5TNDNNalFnT1RZdU1EWXpMREkxTGpjMU5pQk1NVEl1TlRRMUxEY3pMams0TlNCRE1USXVOVEkyTERjekxqazVOaUF4TWk0MU1EWXNOelF1TURBeElERXlMalE0Tml3M05DNHdNREVnVERFeUxqUTROaXczTkM0d01ERWdXaUJOTmpJdU1ERTJMREUyTGprNU55QkROakV1TXpFeUxERTJMams1TnlBMk1DNDJNRFlzTVRjdU1Ua2dOVGt1T1RjMUxERTNMalUxTkNCTU15NDVOalVzTkRrdU9EazVJRU15TGpBNE15dzFNQzQ1T0RVZ01TNHpOREVzTlRNdU16QTRJREl1TXpFc05UVXVNRGM0SUV3eE1pNDFNekVzTnpNdU56SXpJRXc1TlM0NE5EZ3NNalV1TmpFeElFdzVNaTQyTlRNc01Ua3VOemd5SUVNNU1pNHdNemdzTVRndU5qWWdPVEF1T0Rjc01UY3VPVGtnT0RrdU5USTVMREUzTGprNUlFTTRPQzQ0TWpVc01UY3VPVGtnT0RndU1URTVMREU0TGpFNE1pQTROeTQwT0Rrc01UZ3VOVFEzSUV3NE1DNHhOeklzTWpJdU56Y3lJRU00TUM0eE5qRXNNakl1TnpjNElEZ3dMakUwT1N3eU1pNDNPRElnT0RBdU1UTTNMREl5TGpjNE5TQkROemd1TXpRMkxESXpMamd4TVNBM05pNHpOREVzTWpRdU16VTBJRGMwTGpNek5pd3lOQzR6TlRRZ1F6Y3hMalU0T0N3eU5DNHpOVFFnTmprdU1ETXpMREl6TGpNME55QTJOeTR4TkRJc01qRXVOVEU1SUV3Mk5pNDROalFzTWpFdU1qUTVJRU0yTmk0eU56Y3NNakF1TmpNMElEWTFMamMzTkN3eE9TNDVORGNnTmpVdU16WTNMREU1TGpJd015QkROalV1TXpZc01Ua3VNVGt5SURZMUxqTTFOaXd4T1M0eE56a2dOalV1TXpVMExERTVMakUyTmlCTU5qVXVNVFl6TERFNExqZ3hPU0JETmpVdU1UVTBMREU0TGpneE1TQTJOUzR4TkRZc01UZ3VPREF4SURZMUxqRTBMREU0TGpjNUlFTTJOQzQxTWpVc01UY3VOalkzSURZekxqTTFOeXd4Tmk0NU9UY2dOakl1TURFMkxERTJMams1TnlCTU5qSXVNREUyTERFMkxqazVOeUJhSWlCcFpEMGlSbWxzYkMwM0lpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUUXlMalF6TkN3ME9DNDRNRGdnVERReUxqUXpOQ3cwT0M0NE1EZ2dRek01TGpreU5DdzBPQzQ0TURjZ016Y3VOek0zTERRM0xqVTFJRE0yTGpVNE1pdzBOUzQwTkRNZ1F6TTBMamMzTVN3ME1pNHhNemtnTXpZdU1UUTBMRE0zTGpnd09TQXpPUzQyTkRFc016VXVOemc1SUV3MU1TNDVNeklzTWpndU5qa3hJRU0xTXk0eE1ETXNNamd1TURFMUlEVTBMalF4TXl3eU55NDJOVGdnTlRVdU56SXhMREkzTGpZMU9DQkROVGd1TWpNeExESTNMalkxT0NBMk1DNDBNVGdzTWpndU9URTJJRFl4TGpVM015d3pNUzR3TWpNZ1F6WXpMak00TkN3ek5DNHpNamNnTmpJdU1ERXlMRE00TGpZMU55QTFPQzQxTVRRc05EQXVOamMzSUV3ME5pNHlNak1zTkRjdU56YzFJRU0wTlM0d05UTXNORGd1TkRVZ05ETXVOelF5TERRNExqZ3dPQ0EwTWk0ME16UXNORGd1T0RBNElFdzBNaTQwTXpRc05EZ3VPREE0SUZvZ1RUVTFMamN5TVN3eU9DNHhNalVnUXpVMExqUTVOU3d5T0M0eE1qVWdOVE11TWpZMUxESTRMalEyTVNBMU1pNHhOallzTWprdU1EazJJRXd6T1M0NE56VXNNell1TVRrMElFTXpOaTQxT1RZc016Z3VNRGczSURNMUxqTXdNaXcwTWk0eE16WWdNell1T1RreUxEUTFMakl4T0NCRE16Z3VNRFl6TERRM0xqRTNNeUEwTUM0d09UZ3NORGd1TXpRZ05ESXVORE0wTERRNExqTTBJRU0wTXk0Mk5qRXNORGd1TXpRZ05EUXVPRGtzTkRndU1EQTFJRFExTGprNUxEUTNMak0zSUV3MU9DNHlPREVzTkRBdU1qY3lJRU0yTVM0MU5pd3pPQzR6TnprZ05qSXVPRFV6TERNMExqTXpJRFl4TGpFMk5Dd3pNUzR5TkRnZ1F6WXdMakE1TWl3eU9TNHlPVE1nTlRndU1EVTRMREk0TGpFeU5TQTFOUzQzTWpFc01qZ3VNVEkxSUV3MU5TNDNNakVzTWpndU1USTFJRm9pSUdsa1BTSkdhV3hzTFRnaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UUTVMalU0T0N3eUxqUXdOeUJETVRRNUxqVTRPQ3d5TGpRd055QXhOVFV1TnpZNExEVXVPVGMxSURFMU5pNHpNalVzTmk0eU9UY2dUREUxTmk0ek1qVXNOeTR4T0RRZ1F6RTFOaTR6TWpVc055NHpOaUF4TlRZdU16TTRMRGN1TlRRMElERTFOaTR6TmpJc055NDNNek1nUXpFMU5pNHpOek1zTnk0NE1UUWdNVFUyTGpNNE1pdzNMamc1TkNBeE5UWXVNemtzTnk0NU56VWdRekUxTmk0MU15dzVMak01SURFMU55NHpOak1zTVRBdU9UY3pJREUxT0M0ME9UVXNNVEV1T1RjMElFd3hOalV1T0RreExERTRMalV4T1NCRE1UWTJMakEyT0N3eE9DNDJOelVnTVRZMkxqSTBPU3d4T0M0NE1UUWdNVFkyTGpRek1pd3hPQzQ1TXpRZ1F6RTJPQzR3TVRFc01Ua3VPVGMwSURFMk9TNHpPRElzTVRrdU5DQXhOamt1TkRrMExERTNMalkxTWlCRE1UWTVMalUwTXl3eE5pNDROamdnTVRZNUxqVTFNU3d4Tmk0d05UY2dNVFk1TGpVeE55d3hOUzR5TWpNZ1RERTJPUzQxTVRRc01UVXVNRFl6SUV3eE5qa3VOVEUwTERFekxqa3hNaUJETVRjd0xqYzRMREUwTGpZME1pQXhPVFV1TlRBeExESTRMamt4TlNBeE9UVXVOVEF4TERJNExqa3hOU0JNTVRrMUxqVXdNU3c0TWk0NU1UVWdRekU1TlM0MU1ERXNPRFF1TURBMUlERTVOQzQzTXpFc09EUXVORFExSURFNU15NDNPREVzT0RNdU9EazNJRXd4TlRFdU16QTRMRFU1TGpNM05DQkRNVFV3TGpNMU9DdzFPQzQ0TWpZZ01UUTVMalU0T0N3MU55NDBPVGNnTVRRNUxqVTRPQ3cxTmk0ME1EZ2dUREUwT1M0MU9EZ3NNakl1TXpjMUlpQnBaRDBpUm1sc2JDMDVJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEU1TkM0MU5UTXNPRFF1TWpVZ1F6RTVOQzR5T1RZc09EUXVNalVnTVRrMExqQXhNeXc0TkM0eE5qVWdNVGt6TGpjeU1pdzRNeTQ1T1RjZ1RERTFNUzR5TlN3MU9TNDBOellnUXpFMU1DNHlOamtzTlRndU9UQTVJREUwT1M0ME56RXNOVGN1TlRNeklERTBPUzQwTnpFc05UWXVOREE0SUV3eE5Ea3VORGN4TERJeUxqTTNOU0JNTVRRNUxqY3dOU3d5TWk0ek56VWdUREUwT1M0M01EVXNOVFl1TkRBNElFTXhORGt1TnpBMUxEVTNMalExT1NBeE5UQXVORFVzTlRndU56UTBJREUxTVM0ek5qWXNOVGt1TWpjMElFd3hPVE11T0RNNUxEZ3pMamM1TlNCRE1UazBMakkyTXl3NE5DNHdOQ0F4T1RRdU5qVTFMRGcwTGpBNE15QXhPVFF1T1RReUxEZ3pMamt4TnlCRE1UazFMakl5Tnl3NE15NDNOVE1nTVRrMUxqTTROQ3c0TXk0ek9UY2dNVGsxTGpNNE5DdzRNaTQ1TVRVZ1RERTVOUzR6T0RRc01qZ3VPVGd5SUVNeE9UUXVNVEF5TERJNExqSTBNaUF4TnpJdU1UQTBMREUxTGpVME1pQXhOamt1TmpNeExERTBMakV4TkNCTU1UWTVMall6TkN3eE5TNHlNaUJETVRZNUxqWTJPQ3d4Tmk0d05USWdNVFk1TGpZMkxERTJMamczTkNBeE5qa3VOakVzTVRjdU5qVTVJRU14TmprdU5UVTJMREU0TGpVd015QXhOamt1TWpFMExERTVMakV5TXlBeE5qZ3VOalEzTERFNUxqUXdOU0JETVRZNExqQXlPQ3d4T1M0M01UUWdNVFkzTGpFNU55d3hPUzQxTnpnZ01UWTJMak0yTnl3eE9TNHdNeklnUXpFMk5pNHhPREVzTVRndU9UQTVJREUyTlM0NU9UVXNNVGd1TnpZMklERTJOUzQ0TVRRc01UZ3VOakEySUV3eE5UZ3VOREUzTERFeUxqQTJNaUJETVRVM0xqSTFPU3d4TVM0d016WWdNVFUyTGpReE9DdzVMalF6TnlBeE5UWXVNamMwTERjdU9UZzJJRU14TlRZdU1qWTJMRGN1T1RBM0lERTFOaTR5TlRjc055NDRNamNnTVRVMkxqSTBOeXczTGpjME9DQkRNVFUyTGpJeU1TdzNMalUxTlNBeE5UWXVNakE1TERjdU16WTFJREUxTmk0eU1Ea3NOeTR4T0RRZ1RERTFOaTR5TURrc05pNHpOalFnUXpFMU5TNHpOelVzTlM0NE9ETWdNVFE1TGpVeU9Td3lMalV3T0NBeE5Ea3VOVEk1TERJdU5UQTRJRXd4TkRrdU5qUTJMREl1TXpBMklFTXhORGt1TmpRMkxESXVNekEySURFMU5TNDRNamNzTlM0NE56UWdNVFUyTGpNNE5DdzJMakU1TmlCTU1UVTJMalEwTWl3MkxqSXpJRXd4TlRZdU5EUXlMRGN1TVRnMElFTXhOVFl1TkRReUxEY3VNelUxSURFMU5pNDBOVFFzTnk0MU16VWdNVFUyTGpRM09DdzNMamN4TnlCRE1UVTJMalE0T1N3M0xqZ2dNVFUyTGpRNU9TdzNMamc0TWlBeE5UWXVOVEEzTERjdU9UWXpJRU14TlRZdU5qUTFMRGt1TXpVNElERTFOeTQwTlRVc01UQXVPRGs0SURFMU9DNDFOeklzTVRFdU9EZzJJRXd4TmpVdU9UWTVMREU0TGpRek1TQkRNVFkyTGpFME1pd3hPQzQxT0RRZ01UWTJMak14T1N3eE9DNDNNaUF4TmpZdU5EazJMREU0TGpnek55QkRNVFkzTGpJMU5Dd3hPUzR6TXpZZ01UWTRMREU1TGpRMk55QXhOamd1TlRRekxERTVMakU1TmlCRE1UWTVMakF6TXl3eE9DNDVOVE1nTVRZNUxqTXlPU3d4T0M0ME1ERWdNVFk1TGpNM055d3hOeTQyTkRVZ1F6RTJPUzQwTWpjc01UWXVPRFkzSURFMk9TNDBNelFzTVRZdU1EVTBJREUyT1M0ME1ERXNNVFV1TWpJNElFd3hOamt1TXprM0xERTFMakEyTlNCTU1UWTVMak01Tnl3eE15NDNNU0JNTVRZNUxqVTNNaXd4TXk0NE1TQkRNVGN3TGpnek9Td3hOQzQxTkRFZ01UazFMalUxT1N3eU9DNDRNVFFnTVRrMUxqVTFPU3d5T0M0NE1UUWdUREU1TlM0Mk1UZ3NNamd1T0RRM0lFd3hPVFV1TmpFNExEZ3lMamt4TlNCRE1UazFMall4T0N3NE15NDBPRFFnTVRrMUxqUXlMRGd6TGpreE1TQXhPVFV1TURVNUxEZzBMakV4T1NCRE1UazBMamt3T0N3NE5DNHlNRFlnTVRrMExqY3pOeXc0TkM0eU5TQXhPVFF1TlRVekxEZzBMakkxSWlCcFpEMGlSbWxzYkMweE1DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhORFV1TmpnMUxEVTJMakUyTVNCTU1UWTVMamdzTnpBdU1EZ3pJRXd4TkRNdU9ESXlMRGcxTGpBNE1TQk1NVFF5TGpNMkxEZzBMamMzTkNCRE1UTTFMamd5Tml3NE1pNDJNRFFnTVRJNExqY3pNaXc0TVM0d05EWWdNVEl4TGpNME1TdzRNQzR4TlRnZ1F6RXhOaTQ1TnpZc056a3VOak0wSURFeE1pNDJOemdzT0RFdU1qVTBJREV4TVM0M05ETXNPRE11TnpjNElFTXhNVEV1TlRBMkxEZzBMalF4TkNBeE1URXVOVEF6TERnMUxqQTNNU0F4TVRFdU56TXlMRGcxTGpjd05pQkRNVEV6TGpJM0xEZzVMamszTXlBeE1UVXVPVFk0TERrMExqQTJPU0F4TVRrdU56STNMRGszTGpnME1TQk1NVEl3TGpJMU9TdzVPQzQyT0RZZ1F6RXlNQzR5Tml3NU9DNDJPRFVnT1RRdU1qZ3lMREV4TXk0Mk9ETWdPVFF1TWpneUxERXhNeTQyT0RNZ1REY3dMakUyTnl3NU9TNDNOakVnVERFME5TNDJPRFVzTlRZdU1UWXhJaUJwWkQwaVJtbHNiQzB4TVNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswNU5DNHlPRElzTVRFekxqZ3hPQ0JNT1RRdU1qSXpMREV4TXk0M09EVWdURFk1TGprek15dzVPUzQzTmpFZ1REY3dMakV3T0N3NU9TNDJOaUJNTVRRMUxqWTROU3cxTmk0d01qWWdUREUwTlM0M05ETXNOVFl1TURVNUlFd3hOekF1TURNekxEY3dMakE0TXlCTU1UUXpMamcwTWl3NE5TNHlNRFVnVERFME15NDNPVGNzT0RVdU1UazFJRU14TkRNdU56Y3lMRGcxTGpFNUlERTBNaTR6TXpZc09EUXVPRGc0SURFME1pNHpNellzT0RRdU9EZzRJRU14TXpVdU56ZzNMRGd5TGpjeE5DQXhNamd1TnpJekxEZ3hMakUyTXlBeE1qRXVNekkzTERnd0xqSTNOQ0JETVRJd0xqYzRPQ3c0TUM0eU1Ea2dNVEl3TGpJek5pdzRNQzR4TnpjZ01URTVMalk0T1N3NE1DNHhOemNnUXpFeE5TNDVNekVzT0RBdU1UYzNJREV4TWk0Mk16VXNPREV1TnpBNElERXhNUzQ0TlRJc09ETXVPREU1SUVNeE1URXVOakkwTERnMExqUXpNaUF4TVRFdU5qSXhMRGcxTGpBMU15QXhNVEV1T0RReUxEZzFMalkyTnlCRE1URXpMak0zTnl3NE9TNDVNalVnTVRFMkxqQTFPQ3c1TXk0NU9UTWdNVEU1TGpneExEazNMamMxT0NCTU1URTVMamd5Tml3NU55NDNOemtnVERFeU1DNHpOVElzT1RndU5qRTBJRU14TWpBdU16VTBMRGs0TGpZeE55QXhNakF1TXpVMkxEazRMall5SURFeU1DNHpOVGdzT1RndU5qSTBJRXd4TWpBdU5ESXlMRGs0TGpjeU5pQk1NVEl3TGpNeE55dzVPQzQzT0RjZ1F6RXlNQzR5TmpRc09UZ3VPREU0SURrMExqVTVPU3d4TVRNdU5qTTFJRGswTGpNMExERXhNeTQzT0RVZ1REazBMakk0TWl3eE1UTXVPREU0SUV3NU5DNHlPRElzTVRFekxqZ3hPQ0JhSUUwM01DNDBNREVzT1RrdU56WXhJRXc1TkM0eU9ESXNNVEV6TGpVME9TQk1NVEU1TGpBNE5DdzVPUzR5TWprZ1F6RXhPUzQyTXl3NU9DNDVNVFFnTVRFNUxqa3pMRGs0TGpjMElERXlNQzR4TURFc09UZ3VOalUwSUV3eE1Ua3VOak0xTERrM0xqa3hOQ0JETVRFMUxqZzJOQ3c1TkM0eE1qY2dNVEV6TGpFMk9DdzVNQzR3TXpNZ01URXhMall5TWl3NE5TNDNORFlnUXpFeE1TNHpPRElzT0RVdU1EYzVJREV4TVM0ek9EWXNPRFF1TkRBMElERXhNUzQyTXpNc09ETXVOek00SUVNeE1USXVORFE0TERneExqVXpPU0F4TVRVdU9ETTJMRGM1TGprME15QXhNVGt1TmpnNUxEYzVMamswTXlCRE1USXdMakkwTml3M09TNDVORE1nTVRJd0xqZ3dOaXczT1M0NU56WWdNVEl4TGpNMU5TdzRNQzR3TkRJZ1F6RXlPQzQzTmpjc09EQXVPVE16SURFek5TNDRORFlzT0RJdU5EZzNJREUwTWk0ek9UWXNPRFF1TmpZeklFTXhORE11TWpNeUxEZzBMamd6T0NBeE5ETXVOakV4TERnMExqa3hOeUF4TkRNdU56ZzJMRGcwTGprMk55Qk1NVFk1TGpVMk5pdzNNQzR3T0RNZ1RERTBOUzQyT0RVc05UWXVNamsxSUV3M01DNDBNREVzT1RrdU56WXhJRXczTUM0ME1ERXNPVGt1TnpZeElGb2lJR2xrUFNKR2FXeHNMVEV5SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFMk55NHlNeXd4T0M0NU56a2dUREUyTnk0eU15dzJPUzQ0TlNCTU1UTTVMamt3T1N3NE5TNDJNak1nVERFek15NDBORGdzTnpFdU5EVTJJRU14TXpJdU5UTTRMRFk1TGpRMklERXpNQzR3TWl3Mk9TNDNNVGdnTVRJM0xqZ3lOQ3czTWk0d015QkRNVEkyTGpjMk9TdzNNeTR4TkNBeE1qVXVPVE14TERjMExqVTROU0F4TWpVdU5EazBMRGMyTGpBME9DQk1NVEU1TGpBek5DdzVOeTQyTnpZZ1REa3hMamN4TWl3eE1UTXVORFVnVERreExqY3hNaXcyTWk0MU56a2dUREUyTnk0eU15d3hPQzQ1TnpraUlHbGtQU0pHYVd4c0xURXpJaUJtYVd4c1BTSWpSa1pHUmtaR0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGt4TGpjeE1pd3hNVE11TlRZM0lFTTVNUzQyT1RJc01URXpMalUyTnlBNU1TNDJOeklzTVRFekxqVTJNU0E1TVM0Mk5UTXNNVEV6TGpVMU1TQkRPVEV1TmpFNExERXhNeTQxTXlBNU1TNDFPVFVzTVRFekxqUTVNaUE1TVM0MU9UVXNNVEV6TGpRMUlFdzVNUzQxT1RVc05qSXVOVGM1SUVNNU1TNDFPVFVzTmpJdU5UTTNJRGt4TGpZeE9DdzJNaTQwT1RrZ09URXVOalV6TERZeUxqUTNPQ0JNTVRZM0xqRTNNaXd4T0M0NE56Z2dRekUyTnk0eU1EZ3NNVGd1T0RVM0lERTJOeTR5TlRJc01UZ3VPRFUzSURFMk55NHlPRGdzTVRndU9EYzRJRU14TmpjdU16STBMREU0TGpnNU9TQXhOamN1TXpRM0xERTRMamt6TnlBeE5qY3VNelEzTERFNExqazNPU0JNTVRZM0xqTTBOeXcyT1M0NE5TQkRNVFkzTGpNME55dzJPUzQ0T1RFZ01UWTNMak15TkN3Mk9TNDVNeUF4TmpjdU1qZzRMRFk1TGprMUlFd3hNemt1T1RZM0xEZzFMamN5TlNCRE1UTTVMamt6T1N3NE5TNDNOREVnTVRNNUxqa3dOU3c0TlM0M05EVWdNVE01TGpnM015dzROUzQzTXpVZ1F6RXpPUzQ0TkRJc09EVXVOekkxSURFek9TNDRNVFlzT0RVdU56QXlJREV6T1M0NE1ESXNPRFV1TmpjeUlFd3hNek11TXpReUxEY3hMalV3TkNCRE1UTXlMamsyTnl3M01DNDJPRElnTVRNeUxqSTRMRGN3TGpJeU9TQXhNekV1TkRBNExEY3dMakl5T1NCRE1UTXdMak14T1N3M01DNHlNamtnTVRJNUxqQTBOQ3czTUM0NU1UVWdNVEkzTGprd09DdzNNaTR4TVNCRE1USTJMamczTkN3M015NHlJREV5Tmk0d016UXNOelF1TmpRM0lERXlOUzQyTURZc056WXVNRGd5SUV3eE1Ua3VNVFEyTERrM0xqY3dPU0JETVRFNUxqRXpOeXc1Tnk0M016Z2dNVEU1TGpFeE9DdzVOeTQzTmpJZ01URTVMakE1TWl3NU55NDNOemNnVERreExqYzNMREV4TXk0MU5URWdRemt4TGpjMU1pd3hNVE11TlRZeElEa3hMamN6TWl3eE1UTXVOVFkzSURreExqY3hNaXd4TVRNdU5UWTNJRXc1TVM0M01USXNNVEV6TGpVMk55QmFJRTA1TVM0NE1qa3NOakl1TmpRM0lFdzVNUzQ0TWprc01URXpMakkwT0NCTU1URTRMamt6TlN3NU55NDFPVGdnVERFeU5TNHpPRElzTnpZdU1ERTFJRU14TWpVdU9ESTNMRGMwTGpVeU5TQXhNall1TmpZMExEY3pMakE0TVNBeE1qY3VOek01TERjeExqazFJRU14TWpndU9URTVMRGN3TGpjd09DQXhNekF1TWpVMkxEWTVMams1TmlBeE16RXVOREE0TERZNUxqazVOaUJETVRNeUxqTTNOeXcyT1M0NU9UWWdNVE16TGpFek9TdzNNQzQwT1RjZ01UTXpMalUxTkN3M01TNDBNRGNnVERFek9TNDVOakVzT0RVdU5EVTRJRXd4TmpjdU1URXpMRFk1TGpjNE1pQk1NVFkzTGpFeE15d3hPUzR4T0RFZ1REa3hMamd5T1N3Mk1pNDJORGNnVERreExqZ3lPU3cyTWk0Mk5EY2dXaUlnYVdROUlrWnBiR3d0TVRRaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UWTRMalUwTXl3eE9TNHlNVE1nVERFMk9DNDFORE1zTnpBdU1EZ3pJRXd4TkRFdU1qSXhMRGcxTGpnMU55Qk1NVE0wTGpjMk1TdzNNUzQyT0RrZ1F6RXpNeTQ0TlRFc05qa3VOamswSURFek1TNHpNek1zTmprdU9UVXhJREV5T1M0eE16Y3NOekl1TWpZeklFTXhNamd1TURneUxEY3pMak0zTkNBeE1qY3VNalEwTERjMExqZ3hPU0F4TWpZdU9EQTNMRGMyTGpJNE1pQk1NVEl3TGpNME5pdzVOeTQ1TURrZ1REa3pMakF5TlN3eE1UTXVOamd6SUV3NU15NHdNalVzTmpJdU9ERXpJRXd4TmpndU5UUXpMREU1TGpJeE15SWdhV1E5SWtacGJHd3RNVFVpSUdacGJHdzlJaU5HUmtaR1JrWWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT1RNdU1ESTFMREV4TXk0NElFTTVNeTR3TURVc01URXpMamdnT1RJdU9UZzBMREV4TXk0M09UVWdPVEl1T1RZMkxERXhNeTQzT0RVZ1F6a3lMamt6TVN3eE1UTXVOelkwSURreUxqa3dPQ3d4TVRNdU56STFJRGt5TGprd09Dd3hNVE11TmpnMElFdzVNaTQ1TURnc05qSXVPREV6SUVNNU1pNDVNRGdzTmpJdU56Y3hJRGt5TGprek1TdzJNaTQzTXpNZ09USXVPVFkyTERZeUxqY3hNaUJNTVRZNExqUTROQ3d4T1M0eE1USWdRekUyT0M0MU1pd3hPUzR3T1NBeE5qZ3VOVFkxTERFNUxqQTVJREUyT0M0Mk1ERXNNVGt1TVRFeUlFTXhOamd1TmpNM0xERTVMakV6TWlBeE5qZ3VOallzTVRrdU1UY3hJREUyT0M0Mk5pd3hPUzR5TVRJZ1RERTJPQzQyTml3M01DNHdPRE1nUXpFMk9DNDJOaXczTUM0eE1qVWdNVFk0TGpZek55dzNNQzR4TmpRZ01UWTRMall3TVN3M01DNHhPRFFnVERFME1TNHlPQ3c0TlM0NU5UZ2dRekUwTVM0eU5URXNPRFV1T1RjMUlERTBNUzR5TVRjc09EVXVPVGM1SURFME1TNHhPRFlzT0RVdU9UWTRJRU14TkRFdU1UVTBMRGcxTGprMU9DQXhOREV1TVRJNUxEZzFMamt6TmlBeE5ERXVNVEUxTERnMUxqa3dOaUJNTVRNMExqWTFOU3czTVM0M016Z2dRekV6TkM0eU9DdzNNQzQ1TVRVZ01UTXpMalU1TXl3M01DNDBOak1nTVRNeUxqY3lMRGN3TGpRMk15QkRNVE14TGpZek1pdzNNQzQwTmpNZ01UTXdMak0xTnl3M01TNHhORGdnTVRJNUxqSXlNU3czTWk0ek5EUWdRekV5T0M0eE9EWXNOek11TkRNeklERXlOeTR6TkRjc056UXVPRGd4SURFeU5pNDVNVGtzTnpZdU16RTFJRXd4TWpBdU5EVTRMRGszTGprME15QkRNVEl3TGpRMUxEazNMamszTWlBeE1qQXVORE14TERrM0xqazVOaUF4TWpBdU5EQTFMRGs0TGpBeElFdzVNeTR3T0RNc01URXpMamM0TlNCRE9UTXVNRFkxTERFeE15NDNPVFVnT1RNdU1EUTFMREV4TXk0NElEa3pMakF5TlN3eE1UTXVPQ0JNT1RNdU1ESTFMREV4TXk0NElGb2dUVGt6TGpFME1pdzJNaTQ0T0RFZ1REa3pMakUwTWl3eE1UTXVORGd4SUV3eE1qQXVNalE0TERrM0xqZ3pNaUJNTVRJMkxqWTVOU3czTmk0eU5EZ2dRekV5Tnk0eE5DdzNOQzQzTlRnZ01USTNMamszTnl3M015NHpNVFVnTVRJNUxqQTFNaXczTWk0eE9ETWdRekV6TUM0eU16RXNOekF1T1RReUlERXpNUzQxTmpnc056QXVNakk1SURFek1pNDNNaXczTUM0eU1qa2dRekV6TXk0Mk9Ea3NOekF1TWpJNUlERXpOQzQwTlRJc056QXVOek14SURFek5DNDROamNzTnpFdU5qUXhJRXd4TkRFdU1qYzBMRGcxTGpZNU1pQk1NVFk0TGpReU5pdzNNQzR3TVRZZ1RERTJPQzQwTWpZc01Ua3VOREUxSUV3NU15NHhORElzTmpJdU9EZ3hJRXc1TXk0eE5ESXNOakl1T0RneElGb2lJR2xrUFNKR2FXeHNMVEUySWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFMk9TNDRMRGN3TGpBNE15Qk1NVFF5TGpRM09DdzROUzQ0TlRjZ1RERXpOaTR3TVRnc056RXVOamc1SUVNeE16VXVNVEE0TERZNUxqWTVOQ0F4TXpJdU5Ua3NOamt1T1RVeElERXpNQzR6T1RNc056SXVNall6SUVNeE1qa3VNek01TERjekxqTTNOQ0F4TWpndU5TdzNOQzQ0TVRrZ01USTRMakEyTkN3M05pNHlPRElnVERFeU1TNDJNRE1zT1RjdU9UQTVJRXc1TkM0eU9ESXNNVEV6TGpZNE15Qk1PVFF1TWpneUxEWXlMamd4TXlCTU1UWTVMamdzTVRrdU1qRXpJRXd4TmprdU9DdzNNQzR3T0RNZ1dpSWdhV1E5SWtacGJHd3RNVGNpSUdacGJHdzlJaU5HUVVaQlJrRWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT1RRdU1qZ3lMREV4TXk0NU1UY2dRemswTGpJME1Td3hNVE11T1RFM0lEazBMakl3TVN3eE1UTXVPVEEzSURrMExqRTJOU3d4TVRNdU9EZzJJRU01TkM0d09UTXNNVEV6TGpnME5TQTVOQzR3TkRnc01URXpMamMyTnlBNU5DNHdORGdzTVRFekxqWTROQ0JNT1RRdU1EUTRMRFl5TGpneE15QkRPVFF1TURRNExEWXlMamN6SURrMExqQTVNeXcyTWk0Mk5USWdPVFF1TVRZMUxEWXlMall4TVNCTU1UWTVMalk0TXl3eE9TNHdNU0JETVRZNUxqYzFOU3d4T0M0NU5qa2dNVFk1TGpnME5Dd3hPQzQ1TmprZ01UWTVMamt4Tnl3eE9TNHdNU0JETVRZNUxqazRPU3d4T1M0d05USWdNVGN3TGpBek15d3hPUzR4TWprZ01UY3dMakF6TXl3eE9TNHlNVElnVERFM01DNHdNek1zTnpBdU1EZ3pJRU14TnpBdU1ETXpMRGN3TGpFMk5pQXhOamt1T1RnNUxEY3dMakkwTkNBeE5qa3VPVEUzTERjd0xqSTROU0JNTVRReUxqVTVOU3c0Tmk0d05pQkRNVFF5TGpVek9DdzROaTR3T1RJZ01UUXlMalEyT1N3NE5pNHhJREUwTWk0ME1EY3NPRFl1TURnZ1F6RTBNaTR6TkRRc09EWXVNRFlnTVRReUxqSTVNeXc0Tmk0d01UUWdNVFF5TGpJMk5pdzROUzQ1TlRRZ1RERXpOUzQ0TURVc056RXVOemcySUVNeE16VXVORFExTERjd0xqazVOeUF4TXpRdU9ERXpMRGN3TGpVNElERXpNeTQ1Tnpjc056QXVOVGdnUXpFek1pNDVNakVzTnpBdU5UZ2dNVE14TGpZM05pdzNNUzR5TlRJZ01UTXdMalUyTWl3M01pNDBNalFnUXpFeU9TNDFOQ3czTXk0MU1ERWdNVEk0TGpjeE1TdzNOQzQ1TXpFZ01USTRMakk0Tnl3M05pNHpORGdnVERFeU1TNDRNamNzT1RjdU9UYzJJRU14TWpFdU9ERXNPVGd1TURNMElERXlNUzQzTnpFc09UZ3VNRGd5SURFeU1TNDNNaXc1T0M0eE1USWdURGswTGpNNU9Dd3hNVE11T0RnMklFTTVOQzR6TmpJc01URXpMamt3TnlBNU5DNHpNaklzTVRFekxqa3hOeUE1TkM0eU9ESXNNVEV6TGpreE55Qk1PVFF1TWpneUxERXhNeTQ1TVRjZ1dpQk5PVFF1TlRFMUxEWXlMamswT0NCTU9UUXVOVEUxTERFeE15NHlOemtnVERFeU1TNDBNRFlzT1RjdU56VTBJRXd4TWpjdU9EUXNOell1TWpFMUlFTXhNamd1TWprc056UXVOekE0SURFeU9TNHhNemNzTnpNdU1qUTNJREV6TUM0eU1qUXNOekl1TVRBeklFTXhNekV1TkRJMUxEY3dMamd6T0NBeE16SXVOemt6TERjd0xqRXhNaUF4TXpNdU9UYzNMRGN3TGpFeE1pQkRNVE0wTGprNU5TdzNNQzR4TVRJZ01UTTFMamM1TlN3M01DNDJNemdnTVRNMkxqSXpMRGN4TGpVNU1pQk1NVFF5TGpVNE5DdzROUzQxTWpZZ1RERTJPUzQxTmpZc05qa3VPVFE0SUV3eE5qa3VOVFkyTERFNUxqWXhOeUJNT1RRdU5URTFMRFl5TGprME9DQk1PVFF1TlRFMUxEWXlMamswT0NCYUlpQnBaRDBpUm1sc2JDMHhPQ0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TURrdU9EazBMRGt5TGprME15Qk1NVEE1TGpnNU5DdzVNaTQ1TkRNZ1F6RXdPQzR4TWl3NU1pNDVORE1nTVRBMkxqWTFNeXc1TWk0eU1UZ2dNVEExTGpZMUxEa3dMamd5TXlCRE1UQTFMalU0TXl3NU1DNDNNekVnTVRBMUxqVTVNeXc1TUM0Mk1TQXhNRFV1TmpjekxEa3dMalV5T1NCRE1UQTFMamMxTXl3NU1DNDBORGdnTVRBMUxqZzRMRGt3TGpRMElERXdOUzQ1TnpRc09UQXVOVEEySUVNeE1EWXVOelUwTERreExqQTFNeUF4TURjdU5qYzVMRGt4TGpNek15QXhNRGd1TnpJMExEa3hMak16TXlCRE1URXdMakEwTnl3NU1TNHpNek1nTVRFeExqUTNPQ3c1TUM0NE9UUWdNVEV5TGprNExEa3dMakF5TnlCRE1URTRMakk1TVN3NE5pNDVOaUF4TWpJdU5qRXhMRGM1TGpVd09TQXhNakl1TmpFeExEY3pMalF4TmlCRE1USXlMall4TVN3M01TNDBPRGtnTVRJeUxqRTJPU3cyT1M0NE5UWWdNVEl4TGpNek15dzJPQzQyT1RJZ1F6RXlNUzR5TmpZc05qZ3VOaUF4TWpFdU1qYzJMRFk0TGpRM015QXhNakV1TXpVMkxEWTRMak01TWlCRE1USXhMalF6Tml3Mk9DNHpNVEVnTVRJeExqVTJNeXcyT0M0eU9Ua2dNVEl4TGpZMU5pdzJPQzR6TmpVZ1F6RXlNeTR6TWpjc05qa3VOVE0zSURFeU5DNHlORGNzTnpFdU56UTJJREV5TkM0eU5EY3NOelF1TlRnMElFTXhNalF1TWpRM0xEZ3dMamd5TmlBeE1Ua3VPREl4TERnNExqUTBOeUF4TVRRdU16Z3lMRGt4TGpVNE55QkRNVEV5TGpnd09DdzVNaTQwT1RVZ01URXhMakk1T0N3NU1pNDVORE1nTVRBNUxqZzVOQ3c1TWk0NU5ETWdUREV3T1M0NE9UUXNPVEl1T1RReklGb2dUVEV3Tmk0NU1qVXNPVEV1TkRBeElFTXhNRGN1TnpNNExEa3lMakExTWlBeE1EZ3VOelExTERreUxqSTNPQ0F4TURrdU9Ea3pMRGt5TGpJM09DQk1NVEE1TGpnNU5DdzVNaTR5TnpnZ1F6RXhNUzR5TVRVc09USXVNamM0SURFeE1pNDJORGNzT1RFdU9UVXhJREV4TkM0eE5EZ3NPVEV1TURnMElFTXhNVGt1TkRVNUxEZzRMakF4TnlBeE1qTXVOemdzT0RBdU5qSXhJREV5TXk0M09DdzNOQzQxTWpnZ1F6RXlNeTQzT0N3M01pNDFORGtnTVRJekxqTXhOeXczTUM0NU1qa2dNVEl5TGpRMU5DdzJPUzQzTmpjZ1F6RXlNaTQ0TmpVc056QXVPREF5SURFeU15NHdOemtzTnpJdU1EUXlJREV5TXk0d056a3NOek11TkRBeUlFTXhNak11TURjNUxEYzVMalkwTlNBeE1UZ3VOalV6TERnM0xqSTROU0F4TVRNdU1qRTBMRGt3TGpReU5TQkRNVEV4TGpZMExEa3hMak16TkNBeE1UQXVNVE1zT1RFdU56UXlJREV3T0M0M01qUXNPVEV1TnpReUlFTXhNRGd1TURnekxEa3hMamMwTWlBeE1EY3VORGd4TERreExqVTVNeUF4TURZdU9USTFMRGt4TGpRd01TQk1NVEEyTGpreU5TdzVNUzQwTURFZ1dpSWdhV1E5SWtacGJHd3RNVGtpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFekxqQTVOeXc1TUM0eU15QkRNVEU0TGpRNE1TdzROeTR4TWpJZ01USXlMamcwTlN3M09TNDFPVFFnTVRJeUxqZzBOU3czTXk0ME1UWWdRekV5TWk0NE5EVXNOekV1TXpZMUlERXlNaTR6TmpJc05qa3VOekkwSURFeU1TNDFNaklzTmpndU5UVTJJRU14TVRrdU56TTRMRFkzTGpNd05DQXhNVGN1TVRRNExEWTNMak0yTWlBeE1UUXVNalkxTERZNUxqQXlOaUJETVRBNExqZzRNU3czTWk0eE16UWdNVEEwTGpVeE55dzNPUzQyTmpJZ01UQTBMalV4Tnl3NE5TNDROQ0JETVRBMExqVXhOeXc0Tnk0NE9URWdNVEExTERnNUxqVXpNaUF4TURVdU9EUXNPVEF1TnlCRE1UQTNMall5TkN3NU1TNDVOVElnTVRFd0xqSXhOQ3c1TVM0NE9UUWdNVEV6TGpBNU55dzVNQzR5TXlJZ2FXUTlJa1pwYkd3dE1qQWlJR1pwYkd3OUlpTkdRVVpCUmtFaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEE0TGpjeU5DdzVNUzQyTVRRZ1RERXdPQzQzTWpRc09URXVOakUwSUVNeE1EY3VOVGd5TERreExqWXhOQ0F4TURZdU5UWTJMRGt4TGpRd01TQXhNRFV1TnpBMUxEa3dMamM1TnlCRE1UQTFMalk0TkN3NU1DNDNPRE1nTVRBMUxqWTJOU3c1TUM0NE1URWdNVEExTGpZMUxEa3dMamM1SUVNeE1EUXVOelUyTERnNUxqVTBOaUF4TURRdU1qZ3pMRGczTGpnME1pQXhNRFF1TWpnekxEZzFMamd4TnlCRE1UQTBMakk0TXl3M09TNDFOelVnTVRBNExqY3dPU3czTVM0NU5UTWdNVEUwTGpFME9DdzJPQzQ0TVRJZ1F6RXhOUzQzTWpJc05qY3VPVEEwSURFeE55NHlNeklzTmpjdU5EUTVJREV4T0M0Mk16Z3NOamN1TkRRNUlFTXhNVGt1Tnpnc05qY3VORFE1SURFeU1DNDNPVFlzTmpjdU56VTRJREV5TVM0Mk5UWXNOamd1TXpZeUlFTXhNakV1TmpjNExEWTRMak0zTnlBeE1qRXVOamszTERZNExqTTVOeUF4TWpFdU56RXlMRFk0TGpReE9DQkRNVEl5TGpZd05pdzJPUzQyTmpJZ01USXpMakEzT1N3M01TNHpPU0F4TWpNdU1EYzVMRGN6TGpReE5TQkRNVEl6TGpBM09TdzNPUzQyTlRnZ01URTRMalkxTXl3NE55NHhPVGdnTVRFekxqSXhOQ3c1TUM0ek16Z2dRekV4TVM0Mk5DdzVNUzR5TkRjZ01URXdMakV6TERreExqWXhOQ0F4TURndU56STBMRGt4TGpZeE5DQk1NVEE0TGpjeU5DdzVNUzQyTVRRZ1dpQk5NVEEyTGpBd05pdzVNQzQxTURVZ1F6RXdOaTQzT0N3NU1TNHdNemNnTVRBM0xqWTVOQ3c1TVM0eU9ERWdNVEE0TGpjeU5DdzVNUzR5T0RFZ1F6RXhNQzR3TkRjc09URXVNamd4SURFeE1TNDBOemdzT1RBdU9EWTRJREV4TWk0NU9DdzVNQzR3TURFZ1F6RXhPQzR5T1RFc09EWXVPVE0xSURFeU1pNDJNVEVzTnprdU5EazJJREV5TWk0Mk1URXNOek11TkRBeklFTXhNakl1TmpFeExEY3hMalE1TkNBeE1qSXVNVGMzTERZNUxqZzRJREV5TVM0ek5UWXNOamd1TnpFNElFTXhNakF1TlRneUxEWTRMakU0TlNBeE1Ua3VOalk0TERZM0xqa3hPU0F4TVRndU5qTTRMRFkzTGpreE9TQkRNVEUzTGpNeE5TdzJOeTQ1TVRrZ01URTFMamc0TXl3Mk9DNHpOaUF4TVRRdU16Z3lMRFk1TGpJeU55QkRNVEE1TGpBM01TdzNNaTR5T1RNZ01UQTBMamMxTVN3M09TNDNNek1nTVRBMExqYzFNU3c0TlM0NE1qWWdRekV3TkM0M05URXNPRGN1TnpNMUlERXdOUzR4T0RVc09Ea3VNelF6SURFd05pNHdNRFlzT1RBdU5UQTFJRXd4TURZdU1EQTJMRGt3TGpVd05TQmFJaUJwWkQwaVJtbHNiQzB5TVNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE5Ea3VNekU0TERjdU1qWXlJRXd4TXprdU16TTBMREUyTGpFMElFd3hOVFV1TWpJM0xESTNMakUzTVNCTU1UWXdMamd4Tml3eU1TNHdOVGtnVERFME9TNHpNVGdzTnk0eU5qSWlJR2xrUFNKR2FXeHNMVEl5SWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFMk9TNDJOellzTVRNdU9EUWdUREUxT1M0NU1qZ3NNVGt1TkRZM0lFTXhOVFl1TWpnMkxESXhMalUzSURFMU1DNDBMREl4TGpVNElERTBOaTQzT0RFc01Ua3VORGt4SUVNeE5ETXVNVFl4TERFM0xqUXdNaUF4TkRNdU1UZ3NNVFF1TURBeklERTBOaTQ0TWpJc01URXVPU0JNTVRVMkxqTXhOeXcyTGpJNU1pQk1NVFE1TGpVNE9Dd3lMalF3TnlCTU5qY3VOelV5TERRNUxqUTNPQ0JNTVRFekxqWTNOU3czTlM0NU9USWdUREV4Tmk0M05UWXNOelF1TWpFeklFTXhNVGN1TXpnM0xEY3pMamcwT0NBeE1UY3VOakkxTERjekxqTXhOU0F4TVRjdU16YzBMRGN5TGpneU15QkRNVEUxTGpBeE55dzJPQzR4T1RFZ01URTBMamM0TVN3Mk15NHlOemNnTVRFMkxqWTVNU3cxT0M0MU5qRWdRekV5TWk0ek1qa3NORFF1TmpReElERTBNUzR5TERNekxqYzBOaUF4TmpVdU16QTVMRE13TGpRNU1TQkRNVGN6TGpRM09Dd3lPUzR6T0RnZ01UZ3hMams0T1N3eU9TNDFNalFnTVRrd0xqQXhNeXd6TUM0NE9EVWdRekU1TUM0NE5qVXNNekV1TURNZ01Ua3hMamM0T1N3ek1DNDRPVE1nTVRreUxqUXlMRE13TGpVeU9DQk1NVGsxTGpVd01Td3lPQzQzTlNCTU1UWTVMalkzTml3eE15NDROQ0lnYVdROUlrWnBiR3d0TWpNaUlHWnBiR3c5SWlOR1FVWkJSa0VpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URXpMalkzTlN3M05pNDBOVGtnUXpFeE15NDFPVFFzTnpZdU5EVTVJREV4TXk0MU1UUXNOell1TkRNNElERXhNeTQwTkRJc056WXVNemszSUV3Mk55NDFNVGdzTkRrdU9EZ3lJRU0yTnk0ek56UXNORGt1TnprNUlEWTNMakk0TkN3ME9TNDJORFVnTmpjdU1qZzFMRFE1TGpRM09DQkROamN1TWpnMUxEUTVMak14TVNBMk55NHpOelFzTkRrdU1UVTNJRFkzTGpVeE9TdzBPUzR3TnpNZ1RERTBPUzR6TlRVc01pNHdNRElnUXpFME9TNDBPVGtzTVM0NU1Ua2dNVFE1TGpZM055d3hMamt4T1NBeE5Ea3VPREl4TERJdU1EQXlJRXd4TlRZdU5UVXNOUzQ0T0RjZ1F6RTFOaTQzTnpRc05pNHdNVGNnTVRVMkxqZzFMRFl1TXpBeUlERTFOaTQzTWpJc05pNDFNallnUXpFMU5pNDFPVElzTmk0M05Ea2dNVFUyTGpNd055dzJMamd5TmlBeE5UWXVNRGd6TERZdU5qazJJRXd4TkRrdU5UZzNMREl1T1RRMklFdzJPQzQyT0Rjc05Ea3VORGM1SUV3eE1UTXVOamMxTERjMUxqUTFNaUJNTVRFMkxqVXlNeXczTXk0NE1EZ2dRekV4Tmk0M01UVXNOek11TmprM0lERXhOeTR4TkRNc056TXVNems1SURFeE5pNDVOVGdzTnpNdU1ETTFJRU14TVRRdU5UUXlMRFk0TGpJNE55QXhNVFF1TXl3Mk15NHlNakVnTVRFMkxqSTFPQ3cxT0M0ek9EVWdRekV4T1M0d05qUXNOVEV1TkRVNElERXlOUzR4TkRNc05EVXVNVFF6SURFek15NDROQ3cwTUM0eE1qSWdRekUwTWk0ME9UY3NNelV1TVRJMElERTFNeTR6TlRnc016RXVOak16SURFMk5TNHlORGNzTXpBdU1ESTRJRU14TnpNdU5EUTFMREk0TGpreU1TQXhPREl1TURNM0xESTVMakExT0NBeE9UQXVNRGt4TERNd0xqUXlOU0JETVRrd0xqZ3pMRE13TGpVMUlERTVNUzQyTlRJc016QXVORE15SURFNU1pNHhPRFlzTXpBdU1USTBJRXd4T1RRdU5UWTNMREk0TGpjMUlFd3hOamt1TkRReUxERTBMakkwTkNCRE1UWTVMakl4T1N3eE5DNHhNVFVnTVRZNUxqRTBNaXd4TXk0NE1qa2dNVFk1TGpJM01Td3hNeTQyTURZZ1F6RTJPUzQwTERFekxqTTRNaUF4TmprdU5qZzFMREV6TGpNd05pQXhOamt1T1RBNUxERXpMalF6TlNCTU1UazFMamN6TkN3eU9DNHpORFVnUXpFNU5TNDROemtzTWpndU5ESTRJREU1TlM0NU5qZ3NNamd1TlRneklERTVOUzQ1Tmpnc01qZ3VOelVnUXpFNU5TNDVOamdzTWpndU9URTJJREU1TlM0NE56a3NNamt1TURjeElERTVOUzQzTXpRc01qa3VNVFUwSUV3eE9USXVOalV6TERNd0xqa3pNeUJETVRreExqa3pNaXd6TVM0ek5TQXhPVEF1T0Rrc016RXVOVEE0SURFNE9TNDVNelVzTXpFdU16UTJJRU14T0RFdU9UY3lMREk1TGprNU5TQXhOek11TkRjNExESTVMamcySURFMk5TNHpOeklzTXpBdU9UVTBJRU14TlRNdU5qQXlMRE15TGpVME15QXhOREl1T0RZc016VXVPVGt6SURFek5DNHpNRGNzTkRBdU9UTXhJRU14TWpVdU56a3pMRFExTGpnME55QXhNVGt1T0RVeExEVXlMakF3TkNBeE1UY3VNVEkwTERVNExqY3pOaUJETVRFMUxqSTNMRFl6TGpNeE5DQXhNVFV1TlRBeExEWTRMakV4TWlBeE1UY3VOemtzTnpJdU5qRXhJRU14TVRndU1UWXNOek11TXpNMklERXhOeTQ0TkRVc056UXVNVEkwSURFeE5pNDVPU3czTkM0Mk1UY2dUREV4TXk0NU1Ea3NOell1TXprM0lFTXhNVE11T0RNMkxEYzJMalF6T0NBeE1UTXVOelUyTERjMkxqUTFPU0F4TVRNdU5qYzFMRGMyTGpRMU9TSWdhV1E5SWtacGJHd3RNalFpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRVekxqTXhOaXd5TVM0eU56a2dRekUxTUM0NU1ETXNNakV1TWpjNUlERTBPQzQwT1RVc01qQXVOelV4SURFME5pNDJOalFzTVRrdU5qa3pJRU14TkRRdU9EUTJMREU0TGpZME5DQXhORE11T0RRMExERTNMakl6TWlBeE5ETXVPRFEwTERFMUxqY3hPQ0JETVRRekxqZzBOQ3d4TkM0eE9URWdNVFEwTGpnMkxERXlMamMyTXlBeE5EWXVOekExTERFeExqWTVPQ0JNTVRVMkxqRTVPQ3cyTGpBNU1TQkRNVFUyTGpNd09TdzJMakF5TlNBeE5UWXVORFV5TERZdU1EWXlJREUxTmk0MU1UZ3NOaTR4TnpNZ1F6RTFOaTQxT0RNc05pNHlPRFFnTVRVMkxqVTBOeXcyTGpReU55QXhOVFl1TkRNMkxEWXVORGt6SUV3eE5EWXVPVFFzTVRJdU1UQXlJRU14TkRVdU1qUTBMREV6TGpBNE1TQXhORFF1TXpFeUxERTBMak0yTlNBeE5EUXVNekV5TERFMUxqY3hPQ0JETVRRMExqTXhNaXd4Tnk0d05UZ2dNVFExTGpJekxERTRMak15TmlBeE5EWXVPRGszTERFNUxqSTRPU0JETVRVd0xqUTBOaXd5TVM0ek16Z2dNVFUyTGpJMExESXhMak15TnlBeE5Ua3VPREV4TERFNUxqSTJOU0JNTVRZNUxqVTFPU3d4TXk0Mk16Y2dRekUyT1M0Mk55d3hNeTQxTnpNZ01UWTVMamd4TXl3eE15NDJNVEVnTVRZNUxqZzNPQ3d4TXk0M01qTWdRekUyT1M0NU5ETXNNVE11T0RNMElERTJPUzQ1TURRc01UTXVPVGMzSURFMk9TNDNPVE1zTVRRdU1EUXlJRXd4TmpBdU1EUTFMREU1TGpZM0lFTXhOVGd1TVRnM0xESXdMamMwTWlBeE5UVXVOelE1TERJeExqSTNPU0F4TlRNdU16RTJMREl4TGpJM09TSWdhV1E5SWtacGJHd3RNalVpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFekxqWTNOU3czTlM0NU9USWdURFkzTGpjMk1pdzBPUzQwT0RRaUlHbGtQU0pHYVd4c0xUSTJJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV4TXk0Mk56VXNOell1TXpReUlFTXhNVE11TmpFMUxEYzJMak0wTWlBeE1UTXVOVFUxTERjMkxqTXlOeUF4TVRNdU5TdzNOaTR5T1RVZ1REWTNMalU0Tnl3ME9TNDNPRGNnUXpZM0xqUXhPU3cwT1M0Mk9TQTJOeTR6TmpJc05Ea3VORGMySURZM0xqUTFPU3cwT1M0ek1Ea2dRelkzTGpVMU5pdzBPUzR4TkRFZ05qY3VOemNzTkRrdU1EZ3pJRFkzTGprek55dzBPUzR4T0NCTU1URXpMamcxTERjMUxqWTRPQ0JETVRFMExqQXhPQ3czTlM0M09EVWdNVEUwTGpBM05TdzNOaUF4TVRNdU9UYzRMRGMyTGpFMk55QkRNVEV6TGpreE5DdzNOaTR5TnprZ01URXpMamM1Tml3M05pNHpORElnTVRFekxqWTNOU3czTmk0ek5ESWlJR2xrUFNKR2FXeHNMVEkzSWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZM0xqYzJNaXcwT1M0ME9EUWdURFkzTGpjMk1pd3hNRE11TkRnMUlFTTJOeTQzTmpJc01UQTBMalUzTlNBMk9DNDFNeklzTVRBMUxqa3dNeUEyT1M0ME9ESXNNVEEyTGpRMU1pQk1NVEV4TGprMU5Td3hNekF1T1RjeklFTXhNVEl1T1RBMUxERXpNUzQxTWpJZ01URXpMalkzTlN3eE16RXVNRGd6SURFeE15NDJOelVzTVRJNUxqazVNeUJNTVRFekxqWTNOU3czTlM0NU9USWlJR2xrUFNKR2FXeHNMVEk0SWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFeE1pNDNNamNzTVRNeExqVTJNU0JETVRFeUxqUXpMREV6TVM0MU5qRWdNVEV5TGpFd055d3hNekV1TkRZMklERXhNUzQzT0N3eE16RXVNamMySUV3Mk9TNHpNRGNzTVRBMkxqYzFOU0JETmpndU1qUTBMREV3Tmk0eE5ESWdOamN1TkRFeUxERXdOQzQzTURVZ05qY3VOREV5TERFd015NDBPRFVnVERZM0xqUXhNaXcwT1M0ME9EUWdRelkzTGpReE1pdzBPUzR5T1NBMk55NDFOamtzTkRrdU1UTTBJRFkzTGpjMk1pdzBPUzR4TXpRZ1F6WTNMamsxTml3ME9TNHhNelFnTmpndU1URXpMRFE1TGpJNUlEWTRMakV4TXl3ME9TNDBPRFFnVERZNExqRXhNeXd4TURNdU5EZzFJRU0yT0M0eE1UTXNNVEEwTGpRME5TQTJPQzQ0TWl3eE1EVXVOalkxSURZNUxqWTFOeXd4TURZdU1UUTRJRXd4TVRJdU1UTXNNVE13TGpZM0lFTXhNVEl1TkRjMExERXpNQzQ0TmpnZ01URXlMamM1TVN3eE16QXVPVEV6SURFeE15d3hNekF1TnpreUlFTXhNVE11TWpBMkxERXpNQzQyTnpNZ01URXpMak15TlN3eE16QXVNemd4SURFeE15NHpNalVzTVRJNUxqazVNeUJNTVRFekxqTXlOU3czTlM0NU9USWdRekV4TXk0ek1qVXNOelV1TnprNElERXhNeTQwT0RJc056VXVOalF4SURFeE15NDJOelVzTnpVdU5qUXhJRU14TVRNdU9EWTVMRGMxTGpZME1TQXhNVFF1TURJMUxEYzFMamM1T0NBeE1UUXVNREkxTERjMUxqazVNaUJNTVRFMExqQXlOU3d4TWprdU9Ua3pJRU14TVRRdU1ESTFMREV6TUM0Mk5EZ2dNVEV6TGpjNE5pd3hNekV1TVRRM0lERXhNeTR6TlN3eE16RXVNems1SUVNeE1UTXVNVFl5TERFek1TNDFNRGNnTVRFeUxqazFNaXd4TXpFdU5UWXhJREV4TWk0M01qY3NNVE14TGpVMk1TSWdhV1E5SWtacGJHd3RNamtpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFeUxqZzJMRFF3TGpVeE1pQkRNVEV5TGpnMkxEUXdMalV4TWlBeE1USXVPRFlzTkRBdU5URXlJREV4TWk0NE5Ua3NOREF1TlRFeUlFTXhNVEF1TlRReExEUXdMalV4TWlBeE1EZ3VNellzTXprdU9Ua2dNVEEyTGpjeE55d3pPUzR3TkRFZ1F6RXdOUzR3TVRJc016Z3VNRFUzSURFd05DNHdOelFzTXpZdU56STJJREV3TkM0d056UXNNelV1TWpreUlFTXhNRFF1TURjMExETXpMamcwTnlBeE1EVXVNREkyTERNeUxqVXdNU0F4TURZdU56VTBMRE14TGpVd05DQk1NVEU0TGpjNU5Td3lOQzQxTlRFZ1F6RXlNQzQwTmpNc01qTXVOVGc1SURFeU1pNDJOamtzTWpNdU1EVTRJREV5TlM0d01EY3NNak11TURVNElFTXhNamN1TXpJMUxESXpMakExT0NBeE1qa3VOVEEyTERJekxqVTRNU0F4TXpFdU1UVXNNalF1TlRNZ1F6RXpNaTQ0TlRRc01qVXVOVEUwSURFek15NDNPVE1zTWpZdU9EUTFJREV6TXk0M09UTXNNamd1TWpjNElFTXhNek11TnprekxESTVMamN5TkNBeE16SXVPRFF4TERNeExqQTJPU0F4TXpFdU1URXpMRE15TGpBMk55Qk1NVEU1TGpBM01Td3pPUzR3TVRrZ1F6RXhOeTQwTURNc016a3VPVGd5SURFeE5TNHhPVGNzTkRBdU5URXlJREV4TWk0NE5pdzBNQzQxTVRJZ1RERXhNaTQ0Tml3ME1DNDFNVElnV2lCTk1USTFMakF3Tnl3eU15NDNOVGtnUXpFeU1pNDNPU3d5TXk0M05Ua2dNVEl3TGpjd09Td3lOQzR5TlRZZ01URTVMakUwTml3eU5TNHhOVGdnVERFd055NHhNRFFzTXpJdU1URWdRekV3TlM0Mk1ESXNNekl1T1RjNElERXdOQzQzTnpRc016UXVNVEE0SURFd05DNDNOelFzTXpVdU1qa3lJRU14TURRdU56YzBMRE0yTGpRMk5TQXhNRFV1TlRnNUxETTNMalU0TVNBeE1EY3VNRFkzTERNNExqUXpOQ0JETVRBNExqWXdOU3d6T1M0ek1qTWdNVEV3TGpZMk15d3pPUzQ0TVRJZ01URXlMamcxT1N3ek9TNDRNVElnVERFeE1pNDROaXd6T1M0NE1USWdRekV4TlM0d056WXNNemt1T0RFeUlERXhOeTR4TlRnc016a3VNekUxSURFeE9DNDNNakVzTXpndU5ERXpJRXd4TXpBdU56WXlMRE14TGpRMklFTXhNekl1TWpZMExETXdMalU1TXlBeE16TXVNRGt5TERJNUxqUTJNeUF4TXpNdU1Ea3lMREk0TGpJM09DQkRNVE16TGpBNU1pd3lOeTR4TURZZ01UTXlMakkzT0N3eU5TNDVPU0F4TXpBdU9Dd3lOUzR4TXpZZ1F6RXlPUzR5TmpFc01qUXVNalE0SURFeU55NHlNRFFzTWpNdU56VTVJREV5TlM0d01EY3NNak11TnpVNUlFd3hNalV1TURBM0xESXpMamMxT1NCYUlpQnBaRDBpUm1sc2JDMHpNQ0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TmpVdU5qTXNNVFl1TWpFNUlFd3hOVGt1T0RrMkxERTVMalV6SUVNeE5UWXVOekk1TERJeExqTTFPQ0F4TlRFdU5qRXNNakV1TXpZM0lERTBPQzQwTmpNc01Ua3VOVFVnUXpFME5TNHpNVFlzTVRjdU56TXpJREUwTlM0ek16SXNNVFF1TnpjNElERTBPQzQwT1Rrc01USXVPVFE1SUV3eE5UUXVNak16TERrdU5qTTVJRXd4TmpVdU5qTXNNVFl1TWpFNUlpQnBaRDBpUm1sc2JDMHpNU0lnWm1sc2JEMGlJMFpCUmtGR1FTSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TlRRdU1qTXpMREV3TGpRME9DQk1NVFkwTGpJeU9Dd3hOaTR5TVRrZ1RERTFPUzQxTkRZc01UZ3VPVEl6SUVNeE5UZ3VNVEV5TERFNUxqYzFJREUxTmk0eE9UUXNNakF1TWpBMklERTFOQzR4TkRjc01qQXVNakEySUVNeE5USXVNVEU0TERJd0xqSXdOaUF4TlRBdU1qSTBMREU1TGpjMU55QXhORGd1T0RFMExERTRMamswTXlCRE1UUTNMalV5TkN3eE9DNHhPVGtnTVRRMkxqZ3hOQ3d4Tnk0eU5Ea2dNVFEyTGpneE5Dd3hOaTR5TmprZ1F6RTBOaTQ0TVRRc01UVXVNamM0SURFME55NDFNemNzTVRRdU16RTBJREUwT0M0NE5Td3hNeTQxTlRZZ1RERTFOQzR5TXpNc01UQXVORFE0SUUweE5UUXVNak16TERrdU5qTTVJRXd4TkRndU5EazVMREV5TGprME9TQkRNVFExTGpNek1pd3hOQzQzTnpnZ01UUTFMak14Tml3eE55NDNNek1nTVRRNExqUTJNeXd4T1M0MU5TQkRNVFV3TGpBek1Td3lNQzQwTlRVZ01UVXlMakE0Tml3eU1DNDVNRGNnTVRVMExqRTBOeXd5TUM0NU1EY2dRekUxTmk0eU1qUXNNakF1T1RBM0lERTFPQzR6TURZc01qQXVORFEzSURFMU9TNDRPVFlzTVRrdU5UTWdUREUyTlM0Mk15d3hOaTR5TVRrZ1RERTFOQzR5TXpNc09TNDJNemtpSUdsa1BTSkdhV3hzTFRNeUlpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTBOUzQwTkRVc056SXVOalkzSUV3eE5EVXVORFExTERjeUxqWTJOeUJETVRRekxqWTNNaXczTWk0Mk5qY2dNVFF5TGpJd05DdzNNUzQ0TVRjZ01UUXhMakl3TWl3M01DNDBNaklnUXpFME1TNHhNelVzTnpBdU16TWdNVFF4TGpFME5TdzNNQzR4TkRjZ01UUXhMakl5TlN3M01DNHdOallnUXpFME1TNHpNRFVzTmprdU9UZzFJREUwTVM0ME16SXNOamt1T1RRMklERTBNUzQxTWpVc056QXVNREV4SUVNeE5ESXVNekEyTERjd0xqVTFPU0F4TkRNdU1qTXhMRGN3TGpneU15QXhORFF1TWpjMkxEY3dMamd5TWlCRE1UUTFMalU1T0N3M01DNDRNaklnTVRRM0xqQXpMRGN3TGpNM05pQXhORGd1TlRNeUxEWTVMalV3T1NCRE1UVXpMamcwTWl3Mk5pNDBORE1nTVRVNExqRTJNeXcxT0M0NU9EY2dNVFU0TGpFMk15dzFNaTQ0T1RRZ1F6RTFPQzR4TmpNc05UQXVPVFkzSURFMU55NDNNakVzTkRrdU16TXlJREUxTmk0NE9EUXNORGd1TVRZNElFTXhOVFl1T0RFNExEUTRMakEzTmlBeE5UWXVPREk0TERRM0xqazBPQ0F4TlRZdU9UQTRMRFEzTGpnMk55QkRNVFUyTGprNE9DdzBOeTQzT0RZZ01UVTNMakV4TkN3ME55NDNOelFnTVRVM0xqSXdPQ3cwTnk0NE5DQkRNVFU0TGpnM09DdzBPUzR3TVRJZ01UVTVMamM1T0N3MU1TNHlNaUF4TlRrdU56azRMRFUwTGpBMU9TQkRNVFU1TGpjNU9DdzJNQzR6TURFZ01UVTFMak0zTXl3Mk9DNHdORFlnTVRRNUxqa3pNeXczTVM0eE9EWWdRekUwT0M0ek5pdzNNaTR3T1RRZ01UUTJMamcxTERjeUxqWTJOeUF4TkRVdU5EUTFMRGN5TGpZMk55Qk1NVFExTGpRME5TdzNNaTQyTmpjZ1dpQk5NVFF5TGpRM05pdzNNU0JETVRRekxqSTVMRGN4TGpZMU1TQXhORFF1TWprMkxEY3lMakF3TWlBeE5EVXVORFExTERjeUxqQXdNaUJETVRRMkxqYzJOeXczTWk0d01ESWdNVFE0TGpFNU9DdzNNUzQxTlNBeE5Ea3VOeXczTUM0Mk9ESWdRekUxTlM0d01TdzJOeTQyTVRjZ01UVTVMak16TVN3Mk1DNHhOVGtnTVRVNUxqTXpNU3cxTkM0d05qVWdRekUxT1M0ek16RXNOVEl1TURnMUlERTFPQzQ0Tmpnc05UQXVORE0xSURFMU9DNHdNRFlzTkRrdU1qY3lJRU14TlRndU5ERTNMRFV3TGpNd055QXhOVGd1TmpNc05URXVOVE15SURFMU9DNDJNeXcxTWk0NE9USWdRekUxT0M0Mk15dzFPUzR4TXpRZ01UVTBMakl3TlN3Mk5pNDNOamNnTVRRNExqYzJOU3cyT1M0NU1EY2dRekUwTnk0eE9USXNOekF1T0RFMklERTBOUzQyT0RFc056RXVNamd6SURFME5DNHlOellzTnpFdU1qZ3pJRU14TkRNdU5qTTBMRGN4TGpJNE15QXhORE11TURNekxEY3hMakU1TWlBeE5ESXVORGMyTERjeElFd3hOREl1TkRjMkxEY3hJRm9pSUdsa1BTSkdhV3hzTFRNeklpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTBPQzQyTkRnc05qa3VOekEwSUVNeE5UUXVNRE15TERZMkxqVTVOaUF4TlRndU16azJMRFU1TGpBMk9DQXhOVGd1TXprMkxEVXlMamc1TVNCRE1UVTRMak01Tml3MU1DNDRNemtnTVRVM0xqa3hNeXcwT1M0eE9UZ2dNVFUzTGpBM05DdzBPQzR3TXlCRE1UVTFMakk0T1N3ME5pNDNOemdnTVRVeUxqWTVPU3cwTmk0NE16WWdNVFE1TGpneE5pdzBPQzQxTURFZ1F6RTBOQzQwTXpNc05URXVOakE1SURFME1DNHdOamdzTlRrdU1UTTNJREUwTUM0d05qZ3NOalV1TXpFMElFTXhOREF1TURZNExEWTNMak0yTlNBeE5EQXVOVFV5TERZNUxqQXdOaUF4TkRFdU16a3hMRGN3TGpFM05DQkRNVFF6TGpFM05pdzNNUzQwTWpjZ01UUTFMamMyTlN3M01TNHpOamtnTVRRNExqWTBPQ3cyT1M0M01EUWlJR2xrUFNKR2FXeHNMVE0wSWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFME5DNHlOellzTnpFdU1qYzJJRXd4TkRRdU1qYzJMRGN4TGpJM05pQkRNVFF6TGpFek15dzNNUzR5TnpZZ01UUXlMakV4T0N3M01DNDVOamtnTVRReExqSTFOeXczTUM0ek5qVWdRekUwTVM0eU16WXNOekF1TXpVeElERTBNUzR5TVRjc056QXVNek15SURFME1TNHlNRElzTnpBdU16RXhJRU14TkRBdU16QTNMRFk1TGpBMk55QXhNemt1T0RNMUxEWTNMak16T1NBeE16a3VPRE0xTERZMUxqTXhOQ0JETVRNNUxqZ3pOU3cxT1M0d056TWdNVFEwTGpJMkxEVXhMalF6T1NBeE5Ea3VOeXcwT0M0eU9UZ2dRekUxTVM0eU56TXNORGN1TXprZ01UVXlMamM0TkN3ME5pNDVNamtnTVRVMExqRTRPU3cwTmk0NU1qa2dRekUxTlM0ek16SXNORFl1T1RJNUlERTFOaTR6TkRjc05EY3VNak0ySURFMU55NHlNRGdzTkRjdU9ETTVJRU14TlRjdU1qSTVMRFEzTGpnMU5DQXhOVGN1TWpRNExEUTNMamczTXlBeE5UY3VNall6TERRM0xqZzVOQ0JETVRVNExqRTFOeXcwT1M0eE16Z2dNVFU0TGpZekxEVXdMamcyTlNBeE5UZ3VOak1zTlRJdU9Ea3hJRU14TlRndU5qTXNOVGt1TVRNeUlERTFOQzR5TURVc05qWXVOelkySURFME9DNDNOalVzTmprdU9UQTNJRU14TkRjdU1Ua3lMRGN3TGpneE5TQXhORFV1TmpneExEY3hMakkzTmlBeE5EUXVNamMyTERjeExqSTNOaUJNTVRRMExqSTNOaXczTVM0eU56WWdXaUJOTVRReExqVTFPQ3czTUM0eE1EUWdRekUwTWk0ek16RXNOekF1TmpNM0lERTBNeTR5TkRVc056RXVNREExSURFME5DNHlOellzTnpFdU1EQTFJRU14TkRVdU5UazRMRGN4TGpBd05TQXhORGN1TURNc056QXVORFkzSURFME9DNDFNeklzTmprdU5pQkRNVFV6TGpnME1pdzJOaTQxTXpRZ01UVTRMakUyTXl3MU9TNHdNek1nTVRVNExqRTJNeXcxTWk0NU16a2dRekUxT0M0eE5qTXNOVEV1TURNeElERTFOeTQzTWprc05Ea3VNemcxSURFMU5pNDVNRGNzTkRndU1qSXpJRU14TlRZdU1UTXpMRFEzTGpZNU1TQXhOVFV1TWpFNUxEUTNMalF3T1NBeE5UUXVNVGc1TERRM0xqUXdPU0JETVRVeUxqZzJOeXcwTnk0ME1Ea2dNVFV4TGpRek5TdzBOeTQ0TkRJZ01UUTVMamt6TXl3ME9DNDNNRGtnUXpFME5DNDJNak1zTlRFdU56YzFJREUwTUM0ek1ESXNOVGt1TWpjeklERTBNQzR6TURJc05qVXVNelkySUVNeE5EQXVNekF5TERZM0xqSTNOaUF4TkRBdU56TTJMRFk0TGprME1pQXhOREV1TlRVNExEY3dMakV3TkNCTU1UUXhMalUxT0N3M01DNHhNRFFnV2lJZ2FXUTlJa1pwYkd3dE16VWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFV3TGpjeUxEWTFMak0yTVNCTU1UVXdMak0xTnl3Mk5TNHdOallnUXpFMU1TNHhORGNzTmpRdU1Ea3lJREUxTVM0NE5qa3NOak11TURRZ01UVXlMalV3TlN3Mk1TNDVNemdnUXpFMU15NHpNVE1zTmpBdU5UTTVJREUxTXk0NU56Z3NOVGt1TURZM0lERTFOQzQwT0RJc05UY3VOVFl6SUV3eE5UUXVPVEkxTERVM0xqY3hNaUJETVRVMExqUXhNaXcxT1M0eU5EVWdNVFV6TGpjek15dzJNQzQzTkRVZ01UVXlMamt4TERZeUxqRTNNaUJETVRVeUxqSTJNaXcyTXk0eU9UVWdNVFV4TGpVeU5TdzJOQzR6TmpnZ01UVXdMamN5TERZMUxqTTJNU0lnYVdROUlrWnBiR3d0TXpZaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URTFMamt4Tnl3NE5DNDFNVFFnVERFeE5TNDFOVFFzT0RRdU1qSWdRekV4Tmk0ek5EUXNPRE11TWpRMUlERXhOeTR3TmpZc09ESXVNVGswSURFeE55NDNNRElzT0RFdU1Ea3lJRU14TVRndU5URXNOemt1TmpreUlERXhPUzR4TnpVc056Z3VNaklnTVRFNUxqWTNPQ3czTmk0M01UY2dUREV5TUM0eE1qRXNOell1T0RZMUlFTXhNVGt1TmpBNExEYzRMak01T0NBeE1UZ3VPVE1zTnprdU9EazVJREV4T0M0eE1EWXNPREV1TXpJMklFTXhNVGN1TkRVNExEZ3lMalEwT0NBeE1UWXVOekl5TERnekxqVXlNU0F4TVRVdU9URTNMRGcwTGpVeE5DSWdhV1E5SWtacGJHd3RNemNpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFMExERXpNQzQwTnpZZ1RERXhOQ3d4TXpBdU1EQTRJRXd4TVRRc056WXVNRFV5SUV3eE1UUXNOelV1TlRnMElFd3hNVFFzTnpZdU1EVXlJRXd4TVRRc01UTXdMakF3T0NCTU1URTBMREV6TUM0ME56WWlJR2xrUFNKR2FXeHNMVE00SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThMMmMrQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4WnlCcFpEMGlTVzF3YjNKMFpXUXRUR0Y1WlhKekxVTnZjSGtpSUhSeVlXNXpabTl5YlQwaWRISmhibk5zWVhSbEtEWXlMakF3TURBd01Dd2dNQzR3TURBd01EQXBJaUJ6YTJWMFkyZzZkSGx3WlQwaVRWTlRhR0Z3WlVkeWIzVndJajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1Ua3VPREl5TERNM0xqUTNOQ0JETVRrdU9ETTVMRE0zTGpNek9TQXhPUzQzTkRjc016Y3VNVGswSURFNUxqVTFOU3d6Tnk0d09ESWdRekU1TGpJeU9Dd3pOaTQ0T1RRZ01UZ3VOekk1TERNMkxqZzNNaUF4T0M0ME5EWXNNemN1TURNM0lFd3hNaTQwTXpRc05EQXVOVEE0SUVNeE1pNHpNRE1zTkRBdU5UZzBJREV5TGpJMExEUXdMalk0TmlBeE1pNHlORE1zTkRBdU56a3pJRU14TWk0eU5EVXNOREF1T1RJMUlERXlMakkwTlN3ME1TNHlOVFFnTVRJdU1qUTFMRFF4TGpNM01TQk1NVEl1TWpRMUxEUXhMalF4TkNCTU1USXVNak00TERReExqVTBNaUJET0M0eE5EZ3NORE11T0RnM0lEVXVOalEzTERRMUxqTXlNU0ExTGpZME55dzBOUzR6TWpFZ1F6VXVOalEyTERRMUxqTXlNU0F6TGpVM0xEUTJMak0yTnlBeUxqZzJMRFV3TGpVeE15QkRNaTQ0Tml3MU1DNDFNVE1nTVM0NU5EZ3NOVGN1TkRjMElERXVPVFl5TERjd0xqSTFPQ0JETVM0NU56Y3NPREl1T0RJNElESXVOVFk0TERnM0xqTXlPQ0F6TGpFeU9TdzVNUzQyTURrZ1F6TXVNelE1TERrekxqSTVNeUEyTGpFekxEa3pMamN6TkNBMkxqRXpMRGt6TGpjek5DQkROaTQwTmpFc09UTXVOemMwSURZdU9ESTRMRGt6TGpjd055QTNMakl4TERrekxqUTROaUJNT0RJdU5EZ3pMRFE1TGprek5TQkRPRFF1TWpreExEUTRMamcyTmlBNE5TNHhOU3cwTmk0eU1UWWdPRFV1TlRNNUxEUXpMalkxTVNCRE9EWXVOelV5TERNMUxqWTJNU0E0Tnk0eU1UUXNNVEF1TmpjeklEZzFMakkyTkN3ekxqYzNNeUJET0RVdU1EWTRMRE11TURnZ09EUXVOelUwTERJdU5qa2dPRFF1TXprMkxESXVORGt4SUV3NE1pNHpNU3d4TGpjd01TQkRPREV1TlRnekxERXVOekk1SURnd0xqZzVOQ3d5TGpFMk9DQTRNQzQzTnpZc01pNHlNellnUXpnd0xqWXpOaXd5TGpNeE55QTBNUzQ0TURjc01qUXVOVGcxSURJd0xqQXpNaXd6Tnk0d056SWdUREU1TGpneU1pd3pOeTQwTnpRaUlHbGtQU0pHYVd4c0xURWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PREl1TXpFeExERXVOekF4SUV3NE5DNHpPVFlzTWk0ME9URWdRemcwTGpjMU5Dd3lMalk1SURnMUxqQTJPQ3d6TGpBNElEZzFMakkyTkN3ekxqYzNNeUJET0RjdU1qRXpMREV3TGpZM015QTROaTQzTlRFc016VXVOallnT0RVdU5UTTVMRFF6TGpZMU1TQkRPRFV1TVRRNUxEUTJMakl4TmlBNE5DNHlPU3cwT0M0NE5qWWdPREl1TkRnekxEUTVMamt6TlNCTU55NHlNU3c1TXk0ME9EWWdRell1T0RrM0xEa3pMalkyTnlBMkxqVTVOU3c1TXk0M05EUWdOaTR6TVRRc09UTXVOelEwSUV3MkxqRXpNU3c1TXk0M016TWdRell1TVRNeExEa3pMamN6TkNBekxqTTBPU3c1TXk0eU9UTWdNeTR4TWpnc09URXVOakE1SUVNeUxqVTJPQ3c0Tnk0ek1qY2dNUzQ1Tnpjc09ESXVPREk0SURFdU9UWXpMRGN3TGpJMU9DQkRNUzQ1TkRnc05UY3VORGMwSURJdU9EWXNOVEF1TlRFeklESXVPRFlzTlRBdU5URXpJRU16TGpVM0xEUTJMak0yTnlBMUxqWTBOeXcwTlM0ek1qRWdOUzQyTkRjc05EVXVNekl4SUVNMUxqWTBOeXcwTlM0ek1qRWdPQzR4TkRnc05ETXVPRGczSURFeUxqSXpPQ3cwTVM0MU5ESWdUREV5TGpJME5TdzBNUzQwTVRRZ1RERXlMakkwTlN3ME1TNHpOekVnUXpFeUxqSTBOU3cwTVM0eU5UUWdNVEl1TWpRMUxEUXdMamt5TlNBeE1pNHlORE1zTkRBdU56a3pJRU14TWk0eU5DdzBNQzQyT0RZZ01USXVNekF5TERRd0xqVTRNeUF4TWk0ME16UXNOREF1TlRBNElFd3hPQzQwTkRZc016Y3VNRE0ySUVNeE9DNDFOelFzTXpZdU9UWXlJREU0TGpjME5pd3pOaTQ1TWpZZ01UZ3VPVEkzTERNMkxqa3lOaUJETVRrdU1UUTFMRE0yTGpreU5pQXhPUzR6TnpZc016WXVPVGM1SURFNUxqVTFOQ3d6Tnk0d09ESWdRekU1TGpjME55d3pOeTR4T1RRZ01Ua3VPRE01TERNM0xqTTBJREU1TGpneU1pd3pOeTQwTnpRZ1RESXdMakF6TXl3ek55NHdOeklnUXpReExqZ3dOaXd5TkM0MU9EVWdPREF1TmpNMkxESXVNekU0SURnd0xqYzNOeXd5TGpJek5pQkRPREF1T0RrMExESXVNVFk0SURneExqVTRNeXd4TGpjeU9TQTRNaTR6TVRFc01TNDNNREVnVFRneUxqTXhNU3d3TGpjd05DQk1PREl1TWpjeUxEQXVOekExSUVNNE1TNDJOVFFzTUM0M01qZ2dPREF1T1RnNUxEQXVPVFE1SURnd0xqSTVPQ3d4TGpNMk1TQk1PREF1TWpjM0xERXVNemN6SUVNNE1DNHhNamtzTVM0ME5UZ2dOVGt1TnpZNExERXpMakV6TlNBeE9TNDNOVGdzTXpZdU1EYzVJRU14T1M0MUxETTFMams0TVNBeE9TNHlNVFFzTXpVdU9USTVJREU0TGpreU55d3pOUzQ1TWprZ1F6RTRMalUyTWl3ek5TNDVNamtnTVRndU1qSXpMRE0yTGpBeE15QXhOeTQ1TkRjc016WXVNVGN6SUV3eE1TNDVNelVzTXprdU5qUTBJRU14TVM0ME9UTXNNemt1T0RrNUlERXhMakl6Tml3ME1DNHpNelFnTVRFdU1qUTJMRFF3TGpneElFd3hNUzR5TkRjc05EQXVPVFlnVERVdU1UWTNMRFEwTGpRME55QkROQzQzT1RRc05EUXVOalEySURJdU5qSTFMRFExTGprM09DQXhMamczTnl3MU1DNHpORFVnVERFdU9EY3hMRFV3TGpNNE5DQkRNUzQ0TmpJc05UQXVORFUwSURBdU9UVXhMRFUzTGpVMU55QXdMamsyTlN3M01DNHlOVGtnUXpBdU9UYzVMRGd5TGpnM09TQXhMalUyT0N3NE55NHpOelVnTWk0eE16Y3NPVEV1TnpJMElFd3lMakV6T1N3NU1TNDNNemtnUXpJdU5EUTNMRGswTGpBNU5DQTFMall4TkN3NU5DNDJOaklnTlM0NU56VXNPVFF1TnpFNUlFdzJMakF3T1N3NU5DNDNNak1nUXpZdU1URXNPVFF1TnpNMklEWXVNakV6TERrMExqYzBNaUEyTGpNeE5DdzVOQzQzTkRJZ1F6WXVOemtzT1RRdU56UXlJRGN1TWpZc09UUXVOakVnTnk0M01TdzVOQzR6TlNCTU9ESXVPVGd6TERVd0xqYzVPQ0JET0RRdU56azBMRFE1TGpjeU55QTROUzQ1T0RJc05EY3VNemMxSURnMkxqVXlOU3cwTXk0NE1ERWdRemczTGpjeE1Td3pOUzQ1T0RjZ09EZ3VNalU1TERFd0xqY3dOU0E0Tmk0eU1qUXNNeTQxTURJZ1F6ZzFMamszTVN3eUxqWXdPU0E0TlM0MU1pd3hMamszTlNBNE5DNDRPREVzTVM0Mk1pQk1PRFF1TnpRNUxERXVOVFU0SUV3NE1pNDJOalFzTUM0M05qa2dRemd5TGpVMU1Td3dMamN5TlNBNE1pNDBNekVzTUM0M01EUWdPREl1TXpFeExEQXVOekEwSWlCcFpEMGlSbWxzYkMweUlpQm1hV3hzUFNJak5EVTFRVFkwSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWTJMakkyTnl3eE1TNDFOalVnVERZM0xqYzJNaXd4TVM0NU9Ua2dUREV4TGpReU15dzBOQzR6TWpVaUlHbGtQU0pHYVd4c0xUTWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEl1TWpBeUxEa3dMalUwTlNCRE1USXVNREk1TERrd0xqVTBOU0F4TVM0NE5qSXNPVEF1TkRVMUlERXhMamMyT1N3NU1DNHlPVFVnUXpFeExqWXpNaXc1TUM0d05UY2dNVEV1TnpFekxEZzVMamMxTWlBeE1TNDVOVElzT0RrdU5qRTBJRXd6TUM0ek9Ea3NOemd1T1RZNUlFTXpNQzQyTWpnc056Z3VPRE14SURNd0xqa3pNeXczT0M0NU1UTWdNekV1TURjeExEYzVMakUxTWlCRE16RXVNakE0TERjNUxqTTVJRE14TGpFeU55dzNPUzQyT1RZZ016QXVPRGc0TERjNUxqZ3pNeUJNTVRJdU5EVXhMRGt3TGpRM09DQk1NVEl1TWpBeUxEa3dMalUwTlNJZ2FXUTlJa1pwYkd3dE5DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNeTQzTmpRc05ESXVOalUwSUV3eE15NDJOVFlzTkRJdU5Ua3lJRXd4TXk0M01ESXNOREl1TkRJeElFd3hPQzQ0TXpjc016a3VORFUzSUV3eE9TNHdNRGNzTXprdU5UQXlJRXd4T0M0NU5qSXNNemt1TmpjeklFd3hNeTQ0TWpjc05ESXVOak0zSUV3eE15NDNOalFzTkRJdU5qVTBJaUJwWkQwaVJtbHNiQzAxSWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRndU5USXNPVEF1TXpjMUlFdzRMalV5TERRMkxqUXlNU0JNT0M0MU9ETXNORFl1TXpnMUlFdzNOUzQ0TkN3M0xqVTFOQ0JNTnpVdU9EUXNOVEV1TlRBNElFdzNOUzQzTnpnc05URXVOVFEwSUV3NExqVXlMRGt3TGpNM05TQk1PQzQxTWl3NU1DNHpOelVnV2lCTk9DNDNOeXcwTmk0MU5qUWdURGd1Tnpjc09Ea3VPVFEwSUV3M05TNDFPVEVzTlRFdU16WTFJRXczTlM0MU9URXNOeTQ1T0RVZ1REZ3VOemNzTkRZdU5UWTBJRXc0TGpjM0xEUTJMalUyTkNCYUlpQnBaRDBpUm1sc2JDMDJJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEkwTGprNE5pdzRNeTR4T0RJZ1F6STBMamMxTml3NE15NHpNekVnTWpRdU16YzBMRGd6TGpVMk5pQXlOQzR4TXpjc09ETXVOekExSUV3eE1pNDJNeklzT1RBdU5EQTJJRU14TWk0ek9UVXNPVEF1TlRRMUlERXlMalF5Tml3NU1DNDJOVGdnTVRJdU55dzVNQzQyTlRnZ1RERXpMakkyTlN3NU1DNDJOVGdnUXpFekxqVTBMRGt3TGpZMU9DQXhNeTQ1TlRnc09UQXVOVFExSURFMExqRTVOU3c1TUM0ME1EWWdUREkxTGpjc09ETXVOekExSUVNeU5TNDVNemNzT0RNdU5UWTJJREkyTGpFeU9DdzRNeTQwTlRJZ01qWXVNVEkxTERnekxqUTBPU0JETWpZdU1USXlMRGd6TGpRME55QXlOaTR4TVRrc09ETXVNaklnTWpZdU1URTVMRGd5TGprME5pQkRNall1TVRFNUxEZ3lMalkzTWlBeU5TNDVNekVzT0RJdU5UWTVJREkxTGpjd01TdzRNaTQzTVRrZ1RESTBMams0Tml3NE15NHhPRElpSUdsa1BTSkdhV3hzTFRjaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UTXVNalkyTERrd0xqYzRNaUJNTVRJdU55dzVNQzQzT0RJZ1F6RXlMalVzT1RBdU56Z3lJREV5TGpNNE5DdzVNQzQzTWpZZ01USXVNelUwTERrd0xqWXhOaUJETVRJdU16STBMRGt3TGpVd05pQXhNaTR6T1Rjc09UQXVNems1SURFeUxqVTJPU3c1TUM0eU9Ua2dUREkwTGpBM05DdzRNeTQxT1RjZ1F6STBMak14TERnekxqUTFPU0F5TkM0Mk9Ea3NPRE11TWpJMklESTBMamt4T0N3NE15NHdOemdnVERJMUxqWXpNeXc0TWk0Mk1UUWdRekkxTGpjeU15dzRNaTQxTlRVZ01qVXVPREV6TERneUxqVXlOU0F5TlM0NE9Ua3NPREl1TlRJMUlFTXlOaTR3TnpFc09ESXVOVEkxSURJMkxqSTBOQ3c0TWk0Mk5UVWdNall1TWpRMExEZ3lMamswTmlCRE1qWXVNalEwTERnekxqRTJJREkyTGpJME5TdzRNeTR6TURrZ01qWXVNalEzTERnekxqTTRNeUJNTWpZdU1qVXpMRGd6TGpNNE55Qk1Nall1TWpRNUxEZ3pMalExTmlCRE1qWXVNalEyTERnekxqVXpNU0F5Tmk0eU5EWXNPRE11TlRNeElESTFMamMyTXl3NE15NDRNVElnVERFMExqSTFPQ3c1TUM0MU1UUWdRekUwTERrd0xqWTJOU0F4TXk0MU5qUXNPVEF1TnpneUlERXpMakkyTml3NU1DNDNPRElnVERFekxqSTJOaXc1TUM0M09ESWdXaUJOTVRJdU5qWTJMRGt3TGpVek1pQk1NVEl1Tnl3NU1DNDFNek1nVERFekxqSTJOaXc1TUM0MU16TWdRekV6TGpVeE9DdzVNQzQxTXpNZ01UTXVPVEUxTERrd0xqUXlOU0F4TkM0eE16SXNPVEF1TWprNUlFd3lOUzQyTXpjc09ETXVOVGszSUVNeU5TNDRNRFVzT0RNdU5EazVJREkxTGprek1TdzRNeTQwTWpRZ01qVXVPVGs0TERnekxqTTRNeUJETWpVdU9UazBMRGd6TGpJNU9TQXlOUzQ1T1RRc09ETXVNVFkxSURJMUxqazVOQ3c0TWk0NU5EWWdUREkxTGpnNU9TdzRNaTQzTnpVZ1RESTFMamMyT0N3NE1pNDRNalFnVERJMUxqQTFOQ3c0TXk0eU9EY2dRekkwTGpneU1pdzRNeTQwTXpjZ01qUXVORE00TERnekxqWTNNeUF5TkM0eUxEZ3pMamd4TWlCTU1USXVOamsxTERrd0xqVXhOQ0JNTVRJdU5qWTJMRGt3TGpVek1pQk1NVEl1TmpZMkxEa3dMalV6TWlCYUlpQnBaRDBpUm1sc2JDMDRJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV6TGpJMk5pdzRPUzQ0TnpFZ1RERXlMamNzT0RrdU9EY3hJRU14TWk0MUxEZzVMamczTVNBeE1pNHpPRFFzT0RrdU9ERTFJREV5TGpNMU5DdzRPUzQzTURVZ1F6RXlMak15TkN3NE9TNDFPVFVnTVRJdU16azNMRGc1TGpRNE9DQXhNaTQxTmprc09Ea3VNemc0SUV3eU5DNHdOelFzT0RJdU5qZzJJRU15TkM0ek16SXNPREl1TlRNMUlESTBMamMyT0N3NE1pNDBNVGdnTWpVdU1EWTNMRGd5TGpReE9DQk1NalV1TmpNeUxEZ3lMalF4T0NCRE1qVXVPRE15TERneUxqUXhPQ0F5TlM0NU5EZ3NPREl1TkRjMElESTFMamszT0N3NE1pNDFPRFFnUXpJMkxqQXdPQ3c0TWk0Mk9UUWdNalV1T1RNMUxEZ3lMamd3TVNBeU5TNDNOak1zT0RJdU9UQXhJRXd4TkM0eU5UZ3NPRGt1TmpBeklFTXhOQ3c0T1M0M05UUWdNVE11TlRZMExEZzVMamczTVNBeE15NHlOallzT0RrdU9EY3hJRXd4TXk0eU5qWXNPRGt1T0RjeElGb2dUVEV5TGpZMk5pdzRPUzQyTWpFZ1RERXlMamNzT0RrdU5qSXlJRXd4TXk0eU5qWXNPRGt1TmpJeUlFTXhNeTQxTVRnc09Ea3VOakl5SURFekxqa3hOU3c0T1M0MU1UVWdNVFF1TVRNeUxEZzVMak00T0NCTU1qVXVOak0zTERneUxqWTROaUJNTWpVdU5qWTNMRGd5TGpZMk9DQk1NalV1TmpNeUxEZ3lMalkyTnlCTU1qVXVNRFkzTERneUxqWTJOeUJETWpRdU9ERTFMRGd5TGpZMk55QXlOQzQwTVRnc09ESXVOemMxSURJMExqSXNPREl1T1RBeElFd3hNaTQyT1RVc09Ea3VOakF6SUV3eE1pNDJOallzT0RrdU5qSXhJRXd4TWk0Mk5qWXNPRGt1TmpJeElGb2lJR2xrUFNKR2FXeHNMVGtpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRJdU16Y3NPVEF1T0RBeElFd3hNaTR6Tnl3NE9TNDFOVFFnVERFeUxqTTNMRGt3TGpnd01TSWdhV1E5SWtacGJHd3RNVEFpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTmk0eE15dzVNeTQ1TURFZ1F6VXVNemM1TERrekxqZ3dPQ0EwTGpneE5pdzVNeTR4TmpRZ05DNDJPVEVzT1RJdU5USTFJRU16TGpnMkxEZzRMakk0TnlBekxqVTBMRGd6TGpjME15QXpMalV5Tml3M01TNHhOek1nUXpNdU5URXhMRFU0TGpNNE9TQTBMalF5TXl3MU1TNDBNamdnTkM0ME1qTXNOVEV1TkRJNElFTTFMakV6TkN3ME55NHlPRElnTnk0eU1TdzBOaTR5TXpZZ055NHlNU3cwTmk0eU16WWdRemN1TWpFc05EWXVNak0ySURneExqWTJOeXd6TGpJMUlEZ3lMakEyT1N3ekxqQXhOeUJET0RJdU1qa3lMREl1T0RnNElEZzBMalUxTml3eExqUXpNeUE0TlM0eU5qUXNNeTQ1TkNCRE9EY3VNakUwTERFd0xqZzBJRGcyTGpjMU1pd3pOUzQ0TWpjZ09EVXVOVE01TERRekxqZ3hPQ0JET0RVdU1UVXNORFl1TXpneklEZzBMakk1TVN3ME9TNHdNek1nT0RJdU5EZ3pMRFV3TGpFd01TQk1OeTR5TVN3NU15NDJOVE1nUXpZdU9ESTRMRGt6TGpnM05DQTJMalEyTVN3NU15NDVOREVnTmk0eE15dzVNeTQ1TURFZ1F6WXVNVE1zT1RNdU9UQXhJRE11TXpRNUxEa3pMalEySURNdU1USTVMRGt4TGpjM05pQkRNaTQxTmpnc09EY3VORGsxSURFdU9UYzNMRGd5TGprNU5TQXhMamsyTWl3M01DNDBNalVnUXpFdU9UUTRMRFUzTGpZME1TQXlMamcyTERVd0xqWTRJREl1T0RZc05UQXVOamdnUXpNdU5UY3NORFl1TlRNMElEVXVOalEzTERRMUxqUTRPU0ExTGpZME55dzBOUzQwT0RrZ1F6VXVOalEyTERRMUxqUTRPU0E0TGpBMk5TdzBOQzR3T1RJZ01USXVNalExTERReExqWTNPU0JNTVRNdU1URTJMRFF4TGpVMklFd3hPUzQzTVRVc016Y3VOek1nVERFNUxqYzJNU3d6Tnk0eU5qa2dURFl1TVRNc09UTXVPVEF4SWlCcFpEMGlSbWxzYkMweE1TSWdabWxzYkQwaUkwWkJSa0ZHUVNJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDJMak14Tnl3NU5DNHhOakVnVERZdU1UQXlMRGswTGpFME9DQk1OaTR4TURFc09UUXVNVFE0SUV3MUxqZzFOeXc1TkM0eE1ERWdRelV1TVRNNExEa3pMamswTlNBekxqQTROU3c1TXk0ek5qVWdNaTQ0T0RFc09URXVPREE1SUVNeUxqTXhNeXc0Tnk0ME5qa2dNUzQzTWpjc09ESXVPVGsySURFdU56RXpMRGN3TGpReU5TQkRNUzQyT1Rrc05UY3VOemN4SURJdU5qQTBMRFV3TGpjeE9DQXlMall4TXl3MU1DNDJORGdnUXpNdU16TTRMRFEyTGpReE55QTFMalEwTlN3ME5TNHpNU0ExTGpVek5TdzBOUzR5TmpZZ1RERXlMakUyTXl3ME1TNDBNemtnVERFekxqQXpNeXcwTVM0ek1pQk1NVGt1TkRjNUxETTNMalUzT0NCTU1Ua3VOVEV6TERNM0xqSTBOQ0JETVRrdU5USTJMRE0zTGpFd055QXhPUzQyTkRjc016Y3VNREE0SURFNUxqYzROaXd6Tnk0d01qRWdRekU1TGpreU1pd3pOeTR3TXpRZ01qQXVNREl6TERNM0xqRTFOaUF5TUM0d01Ea3NNemN1TWpreklFd3hPUzQ1TlN3ek55NDRPRElnVERFekxqRTVPQ3cwTVM0NE1ERWdUREV5TGpNeU9DdzBNUzQ1TVRrZ1REVXVOemN5TERRMUxqY3dOQ0JETlM0M05ERXNORFV1TnpJZ015NDNPRElzTkRZdU56Y3lJRE11TVRBMkxEVXdMamN5TWlCRE15NHdPVGtzTlRBdU56Z3lJREl1TVRrNExEVTNMamd3T0NBeUxqSXhNaXczTUM0ME1qUWdRekl1TWpJMkxEZ3lMamsyTXlBeUxqZ3dPU3c0Tnk0ME1pQXpMak0zTXl3NU1TNDNNamtnUXpNdU5EWTBMRGt5TGpReUlEUXVNRFl5TERreUxqZzRNeUEwTGpZNE1pdzVNeTR4T0RFZ1F6UXVOVFkyTERreUxqazROQ0EwTGpRNE5pdzVNaTQzTnpZZ05DNDBORFlzT1RJdU5UY3lJRU16TGpZMk5TdzRPQzQxT0RnZ015NHlPVEVzT0RRdU16Y2dNeTR5TnpZc056RXVNVGN6SUVNekxqSTJNaXcxT0M0MU1pQTBMakUyTnl3MU1TNDBOallnTkM0eE56WXNOVEV1TXprMklFTTBMamt3TVN3ME55NHhOalVnTnk0d01EZ3NORFl1TURVNUlEY3VNRGs0TERRMkxqQXhOQ0JETnk0d09UUXNORFl1TURFMUlEZ3hMalUwTWl3ekxqQXpOQ0E0TVM0NU5EUXNNaTQ0TURJZ1REZ3hMamszTWl3eUxqYzROU0JET0RJdU9EYzJMREl1TWpRM0lEZ3pMalk1TWl3eUxqQTVOeUE0TkM0ek16SXNNaTR6TlRJZ1F6ZzBMamc0Tnl3eUxqVTNNeUE0TlM0eU9ERXNNeTR3T0RVZ09EVXVOVEEwTERNdU9EY3lJRU00Tnk0MU1UZ3NNVEVnT0RZdU9UWTBMRE0yTGpBNU1TQTROUzQzT0RVc05ETXVPRFUxSUVNNE5TNHlOemdzTkRjdU1UazJJRGcwTGpJeExEUTVMak0zSURneUxqWXhMRFV3TGpNeE55Qk1OeTR6TXpVc09UTXVPRFk1SUVNMkxqazVPU3c1TkM0d05qTWdOaTQyTlRnc09UUXVNVFl4SURZdU16RTNMRGswTGpFMk1TQk1OaTR6TVRjc09UUXVNVFl4SUZvZ1RUWXVNVGNzT1RNdU5qVTBJRU0yTGpRMk15dzVNeTQyT1NBMkxqYzNOQ3c1TXk0Mk1UY2dOeTR3T0RVc09UTXVORE0zSUV3NE1pNHpOVGdzTkRrdU9EZzJJRU00TkM0eE9ERXNORGd1T0RBNElEZzBMamsyTERRMUxqazNNU0E0TlM0eU9USXNORE11TnpnZ1F6ZzJMalEyTml3ek5pNHdORGtnT0RjdU1ESXpMREV4TGpBNE5TQTROUzR3TWpRc05DNHdNRGdnUXpnMExqZzBOaXd6TGpNM055QTROQzQxTlRFc01pNDVOellnT0RRdU1UUTRMREl1T0RFMklFTTRNeTQyTmpRc01pNDJNak1nT0RJdU9UZ3lMREl1TnpZMElEZ3lMakl5Tnl3ekxqSXhNeUJNT0RJdU1Ua3pMRE11TWpNMElFTTRNUzQzT1RFc015NDBOallnTnk0ek16VXNORFl1TkRVeUlEY3VNek0xTERRMkxqUTFNaUJETnk0ek1EUXNORFl1TkRZNUlEVXVNelEyTERRM0xqVXlNU0EwTGpZMk9TdzFNUzQwTnpFZ1F6UXVOall5TERVeExqVXpJRE11TnpZeExEVTRMalUxTmlBekxqYzNOU3czTVM0eE56TWdRek11Tnprc09EUXVNekk0SURRdU1UWXhMRGc0TGpVeU5DQTBMamt6Tml3NU1pNDBOellnUXpVdU1ESTJMRGt5TGprek55QTFMalF4TWl3NU15NDBOVGtnTlM0NU56TXNPVE11TmpFMUlFTTJMakE0Tnl3NU15NDJOQ0EyTGpFMU9DdzVNeTQyTlRJZ05pNHhOamtzT1RNdU5qVTBJRXcyTGpFM0xEa3pMalkxTkNCTU5pNHhOeXc1TXk0Mk5UUWdXaUlnYVdROUlrWnBiR3d0TVRJaUlHWnBiR3c5SWlNME5UVkJOalFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk55NHpNVGNzTmpndU9UZ3lJRU0zTGpnd05pdzJPQzQzTURFZ09DNHlNRElzTmpndU9USTJJRGd1TWpBeUxEWTVMalE0TnlCRE9DNHlNRElzTnpBdU1EUTNJRGN1T0RBMkxEY3dMamN6SURjdU16RTNMRGN4TGpBeE1pQkROaTQ0TWprc056RXVNamswSURZdU5ETXpMRGN4TGpBMk9TQTJMalF6TXl3M01DNDFNRGdnUXpZdU5ETXpMRFk1TGprME9DQTJMamd5T1N3Mk9TNHlOalVnTnk0ek1UY3NOamd1T1RneUlpQnBaRDBpUm1sc2JDMHhNeUlnWm1sc2JEMGlJMFpHUmtaR1JpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazAyTGpreUxEY3hMakV6TXlCRE5pNDJNekVzTnpFdU1UTXpJRFl1TkRNekxEY3dMamt3TlNBMkxqUXpNeXczTUM0MU1EZ2dRell1TkRNekxEWTVMamswT0NBMkxqZ3lPU3cyT1M0eU5qVWdOeTR6TVRjc05qZ3VPVGd5SUVNM0xqUTJMRFk0TGprZ055NDFPVFVzTmpndU9EWXhJRGN1TnpFMExEWTRMamcyTVNCRE9DNHdNRE1zTmpndU9EWXhJRGd1TWpBeUxEWTVMakE1SURndU1qQXlMRFk1TGpRNE55QkRPQzR5TURJc056QXVNRFEzSURjdU9EQTJMRGN3TGpjeklEY3VNekUzTERjeExqQXhNaUJETnk0eE56UXNOekV1TURrMElEY3VNRE01TERjeExqRXpNeUEyTGpreUxEY3hMakV6TXlCTk55NDNNVFFzTmpndU5qYzBJRU0zTGpVMU55dzJPQzQyTnpRZ055NHpPVElzTmpndU56SXpJRGN1TWpJMExEWTRMamd5TVNCRE5pNDJOellzTmprdU1UTTRJRFl1TWpRMkxEWTVMamczT1NBMkxqSTBOaXczTUM0MU1EZ2dRell1TWpRMkxEY3dMams1TkNBMkxqVXhOeXczTVM0ek1pQTJMamt5TERjeExqTXlJRU0zTGpBM09DdzNNUzR6TWlBM0xqSTBNeXczTVM0eU56RWdOeTQwTVRFc056RXVNVGMwSUVNM0xqazFPU3czTUM0NE5UY2dPQzR6T0Rrc056QXVNVEUzSURndU16ZzVMRFk1TGpRNE55QkRPQzR6T0Rrc05qa3VNREF4SURndU1URTNMRFk0TGpZM05DQTNMamN4TkN3Mk9DNDJOelFpSUdsa1BTSkdhV3hzTFRFMElpQm1hV3hzUFNJak9EQTVOMEV5SWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWXVPVElzTnpBdU9UUTNJRU0yTGpZME9TdzNNQzQ1TkRjZ05pNDJNakVzTnpBdU5qUWdOaTQyTWpFc056QXVOVEE0SUVNMkxqWXlNU3czTUM0d01UY2dOaTQ1T0RJc05qa3VNemt5SURjdU5ERXhMRFk1TGpFME5TQkROeTQxTWpFc05qa3VNRGd5SURjdU5qSTFMRFk1TGpBME9TQTNMamN4TkN3Mk9TNHdORGtnUXpjdU9UZzJMRFk1TGpBME9TQTRMakF4TlN3Mk9TNHpOVFVnT0M0d01UVXNOamt1TkRnM0lFTTRMakF4TlN3Mk9TNDVOemdnTnk0Mk5USXNOekF1TmpBeklEY3VNakkwTERjd0xqZzFNU0JETnk0eE1UVXNOekF1T1RFMElEY3VNREVzTnpBdU9UUTNJRFl1T1RJc056QXVPVFEzSUUwM0xqY3hOQ3cyT0M0NE5qRWdRemN1TlRrMUxEWTRMamcyTVNBM0xqUTJMRFk0TGprZ055NHpNVGNzTmpndU9UZ3lJRU0yTGpneU9TdzJPUzR5TmpVZ05pNDBNek1zTmprdU9UUTRJRFl1TkRNekxEY3dMalV3T0NCRE5pNDBNek1zTnpBdU9UQTFJRFl1TmpNeExEY3hMakV6TXlBMkxqa3lMRGN4TGpFek15QkROeTR3TXprc056RXVNVE16SURjdU1UYzBMRGN4TGpBNU5DQTNMak14Tnl3M01TNHdNVElnUXpjdU9EQTJMRGN3TGpjeklEZ3VNakF5TERjd0xqQTBOeUE0TGpJd01pdzJPUzQwT0RjZ1F6Z3VNakF5TERZNUxqQTVJRGd1TURBekxEWTRMamcyTVNBM0xqY3hOQ3cyT0M0NE5qRWlJR2xrUFNKR2FXeHNMVEUxSWlCbWFXeHNQU0lqT0RBNU4wRXlJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRjdU5EUTBMRGcxTGpNMUlFTTNMamN3T0N3NE5TNHhPVGdnTnk0NU1qRXNPRFV1TXpFNUlEY3VPVEl4TERnMUxqWXlNaUJETnk0NU1qRXNPRFV1T1RJMUlEY3VOekE0TERnMkxqSTVNaUEzTGpRME5DdzROaTQwTkRRZ1F6Y3VNVGd4TERnMkxqVTVOeUEyTGprMk55dzROaTQwTnpVZ05pNDVOamNzT0RZdU1UY3pJRU0yTGprMk55dzROUzQ0TnpFZ055NHhPREVzT0RVdU5UQXlJRGN1TkRRMExEZzFMak0xSWlCcFpEMGlSbWxzYkMweE5pSWdabWxzYkQwaUkwWkdSa1pHUmlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDNMakl6TERnMkxqVXhJRU0zTGpBM05DdzROaTQxTVNBMkxqazJOeXc0Tmk0ek9EY2dOaTQ1Tmpjc09EWXVNVGN6SUVNMkxqazJOeXc0TlM0NE56RWdOeTR4T0RFc09EVXVOVEF5SURjdU5EUTBMRGcxTGpNMUlFTTNMalV5TVN3NE5TNHpNRFVnTnk0MU9UUXNPRFV1TWpnMElEY3VOalU0TERnMUxqSTROQ0JETnk0NE1UUXNPRFV1TWpnMElEY3VPVEl4TERnMUxqUXdPQ0EzTGpreU1TdzROUzQyTWpJZ1F6Y3VPVEl4TERnMUxqa3lOU0EzTGpjd09DdzROaTR5T1RJZ055NDBORFFzT0RZdU5EUTBJRU0zTGpNMk55dzROaTQwT0RrZ055NHlPVFFzT0RZdU5URWdOeTR5TXl3NE5pNDFNU0JOTnk0Mk5UZ3NPRFV1TURrNElFTTNMalUxT0N3NE5TNHdPVGdnTnk0ME5UVXNPRFV1TVRJM0lEY3VNelV4TERnMUxqRTRPQ0JETnk0d016RXNPRFV1TXpjeklEWXVOemd4TERnMUxqZ3dOaUEyTGpjNE1TdzROaTR4TnpNZ1F6WXVOemd4TERnMkxqUTRNaUEyTGprMk5pdzROaTQyT1RjZ055NHlNeXc0Tmk0Mk9UY2dRemN1TXpNc09EWXVOamszSURjdU5ETXpMRGcyTGpZMk5pQTNMalV6T0N3NE5pNDJNRGNnUXpjdU9EVTRMRGcyTGpReU1pQTRMakV3T0N3NE5TNDVPRGtnT0M0eE1EZ3NPRFV1TmpJeUlFTTRMakV3T0N3NE5TNHpNVE1nTnk0NU1qTXNPRFV1TURrNElEY3VOalU0TERnMUxqQTVPQ0lnYVdROUlrWnBiR3d0TVRjaUlHWnBiR3c5SWlNNE1EazNRVElpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk55NHlNeXc0Tmk0ek1qSWdURGN1TVRVMExEZzJMakUzTXlCRE55NHhOVFFzT0RVdU9UTTRJRGN1TXpNekxEZzFMall5T1NBM0xqVXpPQ3c0TlM0MU1USWdURGN1TmpVNExEZzFMalEzTVNCTU55NDNNelFzT0RVdU5qSXlJRU0zTGpjek5DdzROUzQ0TlRZZ055NDFOVFVzT0RZdU1UWTBJRGN1TXpVeExEZzJMakk0TWlCTU55NHlNeXc0Tmk0ek1qSWdUVGN1TmpVNExEZzFMakk0TkNCRE55NDFPVFFzT0RVdU1qZzBJRGN1TlRJeExEZzFMak13TlNBM0xqUTBOQ3c0TlM0ek5TQkROeTR4T0RFc09EVXVOVEF5SURZdU9UWTNMRGcxTGpnM01TQTJMamsyTnl3NE5pNHhOek1nUXpZdU9UWTNMRGcyTGpNNE55QTNMakEzTkN3NE5pNDFNU0EzTGpJekxEZzJMalV4SUVNM0xqSTVOQ3c0Tmk0MU1TQTNMak0yTnl3NE5pNDBPRGtnTnk0ME5EUXNPRFl1TkRRMElFTTNMamN3T0N3NE5pNHlPVElnTnk0NU1qRXNPRFV1T1RJMUlEY3VPVEl4TERnMUxqWXlNaUJETnk0NU1qRXNPRFV1TkRBNElEY3VPREUwTERnMUxqSTROQ0EzTGpZMU9DdzROUzR5T0RRaUlHbGtQU0pHYVd4c0xURTRJaUJtYVd4c1BTSWpPREE1TjBFeUlqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGMzTGpJM09DdzNMamMyT1NCTU56Y3VNamM0TERVeExqUXpOaUJNTVRBdU1qQTRMRGt3TGpFMklFd3hNQzR5TURnc05EWXVORGt6SUV3M055NHlOemdzTnk0M05qa2lJR2xrUFNKR2FXeHNMVEU1SWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFd0xqQTRNeXc1TUM0ek56VWdUREV3TGpBNE15dzBOaTQwTWpFZ1RERXdMakUwTml3ME5pNHpPRFVnVERjM0xqUXdNeXczTGpVMU5DQk1OemN1TkRBekxEVXhMalV3T0NCTU56Y3VNelF4TERVeExqVTBOQ0JNTVRBdU1EZ3pMRGt3TGpNM05TQk1NVEF1TURnekxEa3dMak0zTlNCYUlFMHhNQzR6TXpNc05EWXVOVFkwSUV3eE1DNHpNek1zT0RrdU9UUTBJRXczTnk0eE5UUXNOVEV1TXpZMUlFdzNOeTR4TlRRc055NDVPRFVnVERFd0xqTXpNeXcwTmk0MU5qUWdUREV3TGpNek15dzBOaTQxTmpRZ1dpSWdhV1E5SWtacGJHd3RNakFpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEd3ZaejRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TWpVdU56TTNMRGc0TGpZME55Qk1NVEU0TGpBNU9DdzVNUzQ1T0RFZ1RERXhPQzR3T1Rnc09EUWdUREV3Tmk0Mk16a3NPRGd1TnpFeklFd3hNRFl1TmpNNUxEazJMams0TWlCTU9Ua3NNVEF3TGpNeE5TQk1NVEV5TGpNMk9Td3hNRE11T1RZeElFd3hNalV1TnpNM0xEZzRMalkwTnlJZ2FXUTlJa2x0Y0c5eWRHVmtMVXhoZVdWeWN5MURiM0I1TFRJaUlHWnBiR3c5SWlNME5UVkJOalFpSUhOclpYUmphRHAwZVhCbFBTSk5VMU5vWVhCbFIzSnZkWEFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ1BDOW5QZ29nSUNBZ0lDQWdJRHd2Wno0S0lDQWdJRHd2Wno0S1BDOXpkbWMrJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdGF0ZUluc3RydWN0aW9ucztcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBTZW5zb3JTYW1wbGUgPSByZXF1aXJlKCcuL3NlbnNvci1zYW1wbGUuanMnKTtcbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4uL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgYSBzaW1wbGUgY29tcGxlbWVudGFyeSBmaWx0ZXIsIHdoaWNoIGZ1c2VzIGd5cm9zY29wZSBhbmRcbiAqIGFjY2VsZXJvbWV0ZXIgZGF0YSBmcm9tIHRoZSAnZGV2aWNlbW90aW9uJyBldmVudC5cbiAqXG4gKiBBY2NlbGVyb21ldGVyIGRhdGEgaXMgdmVyeSBub2lzeSwgYnV0IHN0YWJsZSBvdmVyIHRoZSBsb25nIHRlcm0uXG4gKiBHeXJvc2NvcGUgZGF0YSBpcyBzbW9vdGgsIGJ1dCB0ZW5kcyB0byBkcmlmdCBvdmVyIHRoZSBsb25nIHRlcm0uXG4gKlxuICogVGhpcyBmdXNpb24gaXMgcmVsYXRpdmVseSBzaW1wbGU6XG4gKiAxLiBHZXQgb3JpZW50YXRpb24gZXN0aW1hdGVzIGZyb20gYWNjZWxlcm9tZXRlciBieSBhcHBseWluZyBhIGxvdy1wYXNzIGZpbHRlclxuICogICAgb24gdGhhdCBkYXRhLlxuICogMi4gR2V0IG9yaWVudGF0aW9uIGVzdGltYXRlcyBmcm9tIGd5cm9zY29wZSBieSBpbnRlZ3JhdGluZyBvdmVyIHRpbWUuXG4gKiAzLiBDb21iaW5lIHRoZSB0d28gZXN0aW1hdGVzLCB3ZWlnaGluZyAoMSkgaW4gdGhlIGxvbmcgdGVybSwgYnV0ICgyKSBmb3IgdGhlXG4gKiAgICBzaG9ydCB0ZXJtLlxuICovXG5mdW5jdGlvbiBDb21wbGVtZW50YXJ5RmlsdGVyKGtGaWx0ZXIpIHtcbiAgdGhpcy5rRmlsdGVyID0ga0ZpbHRlcjtcblxuICAvLyBSYXcgc2Vuc29yIG1lYXN1cmVtZW50cy5cbiAgdGhpcy5jdXJyZW50QWNjZWxNZWFzdXJlbWVudCA9IG5ldyBTZW5zb3JTYW1wbGUoKTtcbiAgdGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50ID0gbmV3IFNlbnNvclNhbXBsZSgpO1xuICB0aGlzLnByZXZpb3VzR3lyb01lYXN1cmVtZW50ID0gbmV3IFNlbnNvclNhbXBsZSgpO1xuXG4gIC8vIFNldCBkZWZhdWx0IGxvb2sgZGlyZWN0aW9uIHRvIGJlIGluIHRoZSBjb3JyZWN0IGRpcmVjdGlvbi5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMuZmlsdGVyUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKC0xLCAwLCAwLCAxKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmZpbHRlclEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigxLCAwLCAwLCAxKTtcbiAgfVxuICB0aGlzLnByZXZpb3VzRmlsdGVyUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHRoaXMucHJldmlvdXNGaWx0ZXJRLmNvcHkodGhpcy5maWx0ZXJRKTtcblxuICAvLyBPcmllbnRhdGlvbiBiYXNlZCBvbiB0aGUgYWNjZWxlcm9tZXRlci5cbiAgdGhpcy5hY2NlbFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGUgb3JpZW50YXRpb24gaGFzIGJlZW4gaW5pdGlhbGl6ZWQuXG4gIHRoaXMuaXNPcmllbnRhdGlvbkluaXRpYWxpemVkID0gZmFsc2U7XG4gIC8vIFJ1bm5pbmcgZXN0aW1hdGUgb2YgZ3Jhdml0eSBiYXNlZCBvbiB0aGUgY3VycmVudCBvcmllbnRhdGlvbi5cbiAgdGhpcy5lc3RpbWF0ZWRHcmF2aXR5ID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgLy8gTWVhc3VyZWQgZ3Jhdml0eSBiYXNlZCBvbiBhY2NlbGVyb21ldGVyLlxuICB0aGlzLm1lYXN1cmVkR3Jhdml0eSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG5cbiAgLy8gRGVidWcgb25seSBxdWF0ZXJuaW9uIG9mIGd5cm8tYmFzZWQgb3JpZW50YXRpb24uXG4gIHRoaXMuZ3lyb0ludGVncmFsUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG59XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmFkZEFjY2VsTWVhc3VyZW1lbnQgPSBmdW5jdGlvbih2ZWN0b3IsIHRpbWVzdGFtcFMpIHtcbiAgdGhpcy5jdXJyZW50QWNjZWxNZWFzdXJlbWVudC5zZXQodmVjdG9yLCB0aW1lc3RhbXBTKTtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmFkZEd5cm9NZWFzdXJlbWVudCA9IGZ1bmN0aW9uKHZlY3RvciwgdGltZXN0YW1wUykge1xuICB0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQuc2V0KHZlY3RvciwgdGltZXN0YW1wUyk7XG5cbiAgdmFyIGRlbHRhVCA9IHRpbWVzdGFtcFMgLSB0aGlzLnByZXZpb3VzR3lyb01lYXN1cmVtZW50LnRpbWVzdGFtcFM7XG4gIGlmIChVdGlsLmlzVGltZXN0YW1wRGVsdGFWYWxpZChkZWx0YVQpKSB7XG4gICAgdGhpcy5ydW5fKCk7XG4gIH1cblxuICB0aGlzLnByZXZpb3VzR3lyb01lYXN1cmVtZW50LmNvcHkodGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50KTtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLnJ1bl8gPSBmdW5jdGlvbigpIHtcblxuICBpZiAoIXRoaXMuaXNPcmllbnRhdGlvbkluaXRpYWxpemVkKSB7XG4gICAgdGhpcy5hY2NlbFEgPSB0aGlzLmFjY2VsVG9RdWF0ZXJuaW9uXyh0aGlzLmN1cnJlbnRBY2NlbE1lYXN1cmVtZW50LnNhbXBsZSk7XG4gICAgdGhpcy5wcmV2aW91c0ZpbHRlclEuY29weSh0aGlzLmFjY2VsUSk7XG4gICAgdGhpcy5pc09yaWVudGF0aW9uSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBkZWx0YVQgPSB0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQudGltZXN0YW1wUyAtXG4gICAgICB0aGlzLnByZXZpb3VzR3lyb01lYXN1cmVtZW50LnRpbWVzdGFtcFM7XG5cbiAgLy8gQ29udmVydCBneXJvIHJvdGF0aW9uIHZlY3RvciB0byBhIHF1YXRlcm5pb24gZGVsdGEuXG4gIHZhciBneXJvRGVsdGFRID0gdGhpcy5neXJvVG9RdWF0ZXJuaW9uRGVsdGFfKHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudC5zYW1wbGUsIGRlbHRhVCk7XG4gIHRoaXMuZ3lyb0ludGVncmFsUS5tdWx0aXBseShneXJvRGVsdGFRKTtcblxuICAvLyBmaWx0ZXJfMSA9IEsgKiAoZmlsdGVyXzAgKyBneXJvICogZFQpICsgKDEgLSBLKSAqIGFjY2VsLlxuICB0aGlzLmZpbHRlclEuY29weSh0aGlzLnByZXZpb3VzRmlsdGVyUSk7XG4gIHRoaXMuZmlsdGVyUS5tdWx0aXBseShneXJvRGVsdGFRKTtcblxuICAvLyBDYWxjdWxhdGUgdGhlIGRlbHRhIGJldHdlZW4gdGhlIGN1cnJlbnQgZXN0aW1hdGVkIGdyYXZpdHkgYW5kIHRoZSByZWFsXG4gIC8vIGdyYXZpdHkgdmVjdG9yIGZyb20gYWNjZWxlcm9tZXRlci5cbiAgdmFyIGludkZpbHRlclEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICBpbnZGaWx0ZXJRLmNvcHkodGhpcy5maWx0ZXJRKTtcbiAgaW52RmlsdGVyUS5pbnZlcnNlKCk7XG5cbiAgdGhpcy5lc3RpbWF0ZWRHcmF2aXR5LnNldCgwLCAwLCAtMSk7XG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eS5hcHBseVF1YXRlcm5pb24oaW52RmlsdGVyUSk7XG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eS5ub3JtYWxpemUoKTtcblxuICB0aGlzLm1lYXN1cmVkR3Jhdml0eS5jb3B5KHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQuc2FtcGxlKTtcbiAgdGhpcy5tZWFzdXJlZEdyYXZpdHkubm9ybWFsaXplKCk7XG5cbiAgLy8gQ29tcGFyZSBlc3RpbWF0ZWQgZ3Jhdml0eSB3aXRoIG1lYXN1cmVkIGdyYXZpdHksIGdldCB0aGUgZGVsdGEgcXVhdGVybmlvblxuICAvLyBiZXR3ZWVuIHRoZSB0d28uXG4gIHZhciBkZWx0YVEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICBkZWx0YVEuc2V0RnJvbVVuaXRWZWN0b3JzKHRoaXMuZXN0aW1hdGVkR3Jhdml0eSwgdGhpcy5tZWFzdXJlZEdyYXZpdHkpO1xuICBkZWx0YVEuaW52ZXJzZSgpO1xuXG4gIGlmIChVdGlsLmlzRGVidWcoKSkge1xuICAgIGNvbnNvbGUubG9nKCdEZWx0YTogJWQgZGVnLCBHX2VzdDogKCVzLCAlcywgJXMpLCBHX21lYXM6ICglcywgJXMsICVzKScsXG4gICAgICAgICAgICAgICAgTWF0aFV0aWwucmFkVG9EZWcgKiBVdGlsLmdldFF1YXRlcm5pb25BbmdsZShkZWx0YVEpLFxuICAgICAgICAgICAgICAgICh0aGlzLmVzdGltYXRlZEdyYXZpdHkueCkudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5lc3RpbWF0ZWRHcmF2aXR5LnkpLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMuZXN0aW1hdGVkR3Jhdml0eS56KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLm1lYXN1cmVkR3Jhdml0eS54KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLm1lYXN1cmVkR3Jhdml0eS55KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLm1lYXN1cmVkR3Jhdml0eS56KS50b0ZpeGVkKDEpKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZSB0aGUgU0xFUlAgdGFyZ2V0OiBjdXJyZW50IG9yaWVudGF0aW9uIHBsdXMgdGhlIG1lYXN1cmVkLWVzdGltYXRlZFxuICAvLyBxdWF0ZXJuaW9uIGRlbHRhLlxuICB2YXIgdGFyZ2V0USA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHRhcmdldFEuY29weSh0aGlzLmZpbHRlclEpO1xuICB0YXJnZXRRLm11bHRpcGx5KGRlbHRhUSk7XG5cbiAgLy8gU0xFUlAgZmFjdG9yOiAwIGlzIHB1cmUgZ3lybywgMSBpcyBwdXJlIGFjY2VsLlxuICB0aGlzLmZpbHRlclEuc2xlcnAodGFyZ2V0USwgMSAtIHRoaXMua0ZpbHRlcik7XG5cbiAgdGhpcy5wcmV2aW91c0ZpbHRlclEuY29weSh0aGlzLmZpbHRlclEpO1xufTtcblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUuZ2V0T3JpZW50YXRpb24gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZmlsdGVyUTtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmFjY2VsVG9RdWF0ZXJuaW9uXyA9IGZ1bmN0aW9uKGFjY2VsKSB7XG4gIHZhciBub3JtQWNjZWwgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuICBub3JtQWNjZWwuY29weShhY2NlbCk7XG4gIG5vcm1BY2NlbC5ub3JtYWxpemUoKTtcbiAgdmFyIHF1YXQgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICBxdWF0LnNldEZyb21Vbml0VmVjdG9ycyhuZXcgTWF0aFV0aWwuVmVjdG9yMygwLCAwLCAtMSksIG5vcm1BY2NlbCk7XG4gIHF1YXQuaW52ZXJzZSgpO1xuICByZXR1cm4gcXVhdDtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmd5cm9Ub1F1YXRlcm5pb25EZWx0YV8gPSBmdW5jdGlvbihneXJvLCBkdCkge1xuICAvLyBFeHRyYWN0IGF4aXMgYW5kIGFuZ2xlIGZyb20gdGhlIGd5cm9zY29wZSBkYXRhLlxuICB2YXIgcXVhdCA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHZhciBheGlzID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgYXhpcy5jb3B5KGd5cm8pO1xuICBheGlzLm5vcm1hbGl6ZSgpO1xuICBxdWF0LnNldEZyb21BeGlzQW5nbGUoYXhpcywgZ3lyby5sZW5ndGgoKSAqIGR0KTtcbiAgcmV0dXJuIHF1YXQ7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcGxlbWVudGFyeUZpbHRlcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgQ29tcGxlbWVudGFyeUZpbHRlciA9IHJlcXVpcmUoJy4vY29tcGxlbWVudGFyeS1maWx0ZXIuanMnKTtcbnZhciBQb3NlUHJlZGljdG9yID0gcmVxdWlyZSgnLi9wb3NlLXByZWRpY3Rvci5qcycpO1xudmFyIFRvdWNoUGFubmVyID0gcmVxdWlyZSgnLi4vdG91Y2gtcGFubmVyLmpzJyk7XG52YXIgTWF0aFV0aWwgPSByZXF1aXJlKCcuLi9tYXRoLXV0aWwuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG4vKipcbiAqIFRoZSBwb3NlIHNlbnNvciwgaW1wbGVtZW50ZWQgdXNpbmcgRGV2aWNlTW90aW9uIEFQSXMuXG4gKi9cbmZ1bmN0aW9uIEZ1c2lvblBvc2VTZW5zb3IoKSB7XG4gIHRoaXMuZGV2aWNlSWQgPSAnd2VidnItcG9seWZpbGw6ZnVzZWQnO1xuICB0aGlzLmRldmljZU5hbWUgPSAnVlIgUG9zaXRpb24gRGV2aWNlICh3ZWJ2ci1wb2x5ZmlsbDpmdXNlZCknO1xuXG4gIHRoaXMuYWNjZWxlcm9tZXRlciA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIHRoaXMuZ3lyb3Njb3BlID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcblxuICB0aGlzLnN0YXJ0KCk7XG5cbiAgdGhpcy5maWx0ZXIgPSBuZXcgQ29tcGxlbWVudGFyeUZpbHRlcih3aW5kb3cuV2ViVlJDb25maWcuS19GSUxURVIpO1xuICB0aGlzLnBvc2VQcmVkaWN0b3IgPSBuZXcgUG9zZVByZWRpY3Rvcih3aW5kb3cuV2ViVlJDb25maWcuUFJFRElDVElPTl9USU1FX1MpO1xuICB0aGlzLnRvdWNoUGFubmVyID0gbmV3IFRvdWNoUGFubmVyKCk7XG5cbiAgdGhpcy5maWx0ZXJUb1dvcmxkUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG5cbiAgLy8gU2V0IHRoZSBmaWx0ZXIgdG8gd29ybGQgdHJhbnNmb3JtLCBkZXBlbmRpbmcgb24gT1MuXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICB0aGlzLmZpbHRlclRvV29ybGRRLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMSwgMCwgMCksIE1hdGguUEkgLyAyKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmZpbHRlclRvV29ybGRRLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMSwgMCwgMCksIC1NYXRoLlBJIC8gMik7XG4gIH1cblxuICB0aGlzLmludmVyc2VXb3JsZFRvU2NyZWVuUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHRoaXMud29ybGRUb1NjcmVlblEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB0aGlzLm9yaWdpbmFsUG9zZUFkanVzdFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB0aGlzLm9yaWdpbmFsUG9zZUFkanVzdFEuc2V0RnJvbUF4aXNBbmdsZShuZXcgTWF0aFV0aWwuVmVjdG9yMygwLCAwLCAxKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtd2luZG93Lm9yaWVudGF0aW9uICogTWF0aC5QSSAvIDE4MCk7XG5cbiAgdGhpcy5zZXRTY3JlZW5UcmFuc2Zvcm1fKCk7XG4gIC8vIEFkanVzdCB0aGlzIGZpbHRlciBmb3IgYmVpbmcgaW4gbGFuZHNjYXBlIG1vZGUuXG4gIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpKSB7XG4gICAgdGhpcy5maWx0ZXJUb1dvcmxkUS5tdWx0aXBseSh0aGlzLmludmVyc2VXb3JsZFRvU2NyZWVuUSk7XG4gIH1cblxuICAvLyBLZWVwIHRyYWNrIG9mIGEgcmVzZXQgdHJhbnNmb3JtIGZvciByZXNldFNlbnNvci5cbiAgdGhpcy5yZXNldFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuXG4gIHRoaXMuaXNGaXJlZm94QW5kcm9pZCA9IFV0aWwuaXNGaXJlZm94QW5kcm9pZCgpO1xuICB0aGlzLmlzSU9TID0gVXRpbC5pc0lPUygpO1xuXG4gIHRoaXMub3JpZW50YXRpb25PdXRfID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbn1cblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuZ2V0UG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgLy8gVGhpcyBQb3NlU2Vuc29yIGRvZXNuJ3Qgc3VwcG9ydCBwb3NpdGlvblxuICByZXR1cm4gbnVsbDtcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLmdldE9yaWVudGF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIC8vIENvbnZlcnQgZnJvbSBmaWx0ZXIgc3BhY2UgdG8gdGhlIHRoZSBzYW1lIHN5c3RlbSB1c2VkIGJ5IHRoZVxuICAvLyBkZXZpY2VvcmllbnRhdGlvbiBldmVudC5cbiAgdmFyIG9yaWVudGF0aW9uID0gdGhpcy5maWx0ZXIuZ2V0T3JpZW50YXRpb24oKTtcblxuICAvLyBQcmVkaWN0IG9yaWVudGF0aW9uLlxuICB0aGlzLnByZWRpY3RlZFEgPSB0aGlzLnBvc2VQcmVkaWN0b3IuZ2V0UHJlZGljdGlvbihvcmllbnRhdGlvbiwgdGhpcy5neXJvc2NvcGUsIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTKTtcblxuICAvLyBDb252ZXJ0IHRvIFRIUkVFIGNvb3JkaW5hdGUgc3lzdGVtOiAtWiBmb3J3YXJkLCBZIHVwLCBYIHJpZ2h0LlxuICB2YXIgb3V0ID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgb3V0LmNvcHkodGhpcy5maWx0ZXJUb1dvcmxkUSk7XG4gIG91dC5tdWx0aXBseSh0aGlzLnJlc2V0USk7XG4gIGlmICghd2luZG93LldlYlZSQ29uZmlnLlRPVUNIX1BBTk5FUl9ESVNBQkxFRCkge1xuICAgIG91dC5tdWx0aXBseSh0aGlzLnRvdWNoUGFubmVyLmdldE9yaWVudGF0aW9uKCkpO1xuICB9XG4gIG91dC5tdWx0aXBseSh0aGlzLnByZWRpY3RlZFEpO1xuICBvdXQubXVsdGlwbHkodGhpcy53b3JsZFRvU2NyZWVuUSk7XG5cbiAgLy8gSGFuZGxlIHRoZSB5YXctb25seSBjYXNlLlxuICBpZiAod2luZG93LldlYlZSQ29uZmlnLllBV19PTkxZKSB7XG4gICAgLy8gTWFrZSBhIHF1YXRlcm5pb24gdGhhdCBvbmx5IHR1cm5zIGFyb3VuZCB0aGUgWS1heGlzLlxuICAgIG91dC54ID0gMDtcbiAgICBvdXQueiA9IDA7XG4gICAgb3V0Lm5vcm1hbGl6ZSgpO1xuICB9XG5cbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMF0gPSBvdXQueDtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMV0gPSBvdXQueTtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMl0gPSBvdXQuejtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bM10gPSBvdXQudztcbiAgcmV0dXJuIHRoaXMub3JpZW50YXRpb25PdXRfO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUucmVzZXRQb3NlID0gZnVuY3Rpb24oKSB7XG4gIC8vIFJlZHVjZSB0byBpbnZlcnRlZCB5YXctb25seS5cbiAgdGhpcy5yZXNldFEuY29weSh0aGlzLmZpbHRlci5nZXRPcmllbnRhdGlvbigpKTtcbiAgdGhpcy5yZXNldFEueCA9IDA7XG4gIHRoaXMucmVzZXRRLnkgPSAwO1xuICB0aGlzLnJlc2V0US56ICo9IC0xO1xuICB0aGlzLnJlc2V0US5ub3JtYWxpemUoKTtcblxuICAvLyBUYWtlIGludG8gYWNjb3VudCBleHRyYSB0cmFuc2Zvcm1hdGlvbnMgaW4gbGFuZHNjYXBlIG1vZGUuXG4gIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpKSB7XG4gICAgdGhpcy5yZXNldFEubXVsdGlwbHkodGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEpO1xuICB9XG5cbiAgLy8gVGFrZSBpbnRvIGFjY291bnQgb3JpZ2luYWwgcG9zZS5cbiAgdGhpcy5yZXNldFEubXVsdGlwbHkodGhpcy5vcmlnaW5hbFBvc2VBZGp1c3RRKTtcblxuICBpZiAoIXdpbmRvdy5XZWJWUkNvbmZpZy5UT1VDSF9QQU5ORVJfRElTQUJMRUQpIHtcbiAgICB0aGlzLnRvdWNoUGFubmVyLnJlc2V0U2Vuc29yKCk7XG4gIH1cbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLm9uRGV2aWNlTW90aW9uXyA9IGZ1bmN0aW9uKGRldmljZU1vdGlvbikge1xuICB0aGlzLnVwZGF0ZURldmljZU1vdGlvbl8oZGV2aWNlTW90aW9uKTtcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLnVwZGF0ZURldmljZU1vdGlvbl8gPSBmdW5jdGlvbihkZXZpY2VNb3Rpb24pIHtcbiAgdmFyIGFjY0dyYXZpdHkgPSBkZXZpY2VNb3Rpb24uYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eTtcbiAgdmFyIHJvdFJhdGUgPSBkZXZpY2VNb3Rpb24ucm90YXRpb25SYXRlO1xuICB2YXIgdGltZXN0YW1wUyA9IGRldmljZU1vdGlvbi50aW1lU3RhbXAgLyAxMDAwO1xuXG4gIHZhciBkZWx0YVMgPSB0aW1lc3RhbXBTIC0gdGhpcy5wcmV2aW91c1RpbWVzdGFtcFM7XG4gIGlmIChkZWx0YVMgPD0gVXRpbC5NSU5fVElNRVNURVAgfHwgZGVsdGFTID4gVXRpbC5NQVhfVElNRVNURVApIHtcbiAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgdGltZXN0YW1wcyBkZXRlY3RlZC4gVGltZSBzdGVwIGJldHdlZW4gc3VjY2Vzc2l2ZSAnICtcbiAgICAgICAgICAgICAgICAgJ2d5cm9zY29wZSBzZW5zb3Igc2FtcGxlcyBpcyB2ZXJ5IHNtYWxsIG9yIG5vdCBtb25vdG9uaWMnKTtcbiAgICB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuYWNjZWxlcm9tZXRlci5zZXQoLWFjY0dyYXZpdHkueCwgLWFjY0dyYXZpdHkueSwgLWFjY0dyYXZpdHkueik7XG4gIHRoaXMuZ3lyb3Njb3BlLnNldChyb3RSYXRlLmFscGhhLCByb3RSYXRlLmJldGEsIHJvdFJhdGUuZ2FtbWEpO1xuXG4gIC8vIFdpdGggaU9TIGFuZCBGaXJlZm94IEFuZHJvaWQsIHJvdGF0aW9uUmF0ZSBpcyByZXBvcnRlZCBpbiBkZWdyZWVzLFxuICAvLyBzbyB3ZSBmaXJzdCBjb252ZXJ0IHRvIHJhZGlhbnMuXG4gIGlmICh0aGlzLmlzSU9TIHx8IHRoaXMuaXNGaXJlZm94QW5kcm9pZCkge1xuICAgIHRoaXMuZ3lyb3Njb3BlLm11bHRpcGx5U2NhbGFyKE1hdGguUEkgLyAxODApO1xuICB9XG5cbiAgdGhpcy5maWx0ZXIuYWRkQWNjZWxNZWFzdXJlbWVudCh0aGlzLmFjY2VsZXJvbWV0ZXIsIHRpbWVzdGFtcFMpO1xuICB0aGlzLmZpbHRlci5hZGRHeXJvTWVhc3VyZW1lbnQodGhpcy5neXJvc2NvcGUsIHRpbWVzdGFtcFMpO1xuXG4gIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gdGltZXN0YW1wUztcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLm9uT3JpZW50YXRpb25DaGFuZ2VfID0gZnVuY3Rpb24oc2NyZWVuT3JpZW50YXRpb24pIHtcbiAgdGhpcy5zZXRTY3JlZW5UcmFuc2Zvcm1fKCk7XG59O1xuXG4vKipcbiAqIFRoaXMgaXMgb25seSBuZWVkZWQgaWYgd2UgYXJlIGluIGFuIGNyb3NzIG9yaWdpbiBpZnJhbWUgb24gaU9TIHRvIHdvcmsgYXJvdW5kXG4gKiB0aGlzIGlzc3VlOiBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTUyMjk5LlxuICovXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5vbk1lc3NhZ2VfID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgdmFyIG1lc3NhZ2UgPSBldmVudC5kYXRhO1xuXG4gIC8vIElmIHRoZXJlJ3Mgbm8gbWVzc2FnZSB0eXBlLCBpZ25vcmUgaXQuXG4gIGlmICghbWVzc2FnZSB8fCAhbWVzc2FnZS50eXBlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSWdub3JlIGFsbCBtZXNzYWdlcyB0aGF0IGFyZW4ndCBkZXZpY2Vtb3Rpb24uXG4gIHZhciB0eXBlID0gbWVzc2FnZS50eXBlLnRvTG93ZXJDYXNlKCk7XG4gIGlmICh0eXBlICE9PSAnZGV2aWNlbW90aW9uJykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFVwZGF0ZSBkZXZpY2UgbW90aW9uLlxuICB0aGlzLnVwZGF0ZURldmljZU1vdGlvbl8obWVzc2FnZS5kZXZpY2VNb3Rpb25FdmVudCk7XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5zZXRTY3JlZW5UcmFuc2Zvcm1fID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMud29ybGRUb1NjcmVlblEuc2V0KDAsIDAsIDAsIDEpO1xuICBzd2l0Y2ggKHdpbmRvdy5vcmllbnRhdGlvbikge1xuICAgIGNhc2UgMDpcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgOTA6XG4gICAgICB0aGlzLndvcmxkVG9TY3JlZW5RLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMCwgMCwgMSksIC1NYXRoLlBJIC8gMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIC05MDpcbiAgICAgIHRoaXMud29ybGRUb1NjcmVlblEuc2V0RnJvbUF4aXNBbmdsZShuZXcgTWF0aFV0aWwuVmVjdG9yMygwLCAwLCAxKSwgTWF0aC5QSSAvIDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAxODA6XG4gICAgICAvLyBUT0RPLlxuICAgICAgYnJlYWs7XG4gIH1cbiAgdGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEuY29weSh0aGlzLndvcmxkVG9TY3JlZW5RKTtcbiAgdGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEuaW52ZXJzZSgpO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vbkRldmljZU1vdGlvbkNhbGxiYWNrXyA9IHRoaXMub25EZXZpY2VNb3Rpb25fLmJpbmQodGhpcyk7XG4gIHRoaXMub25PcmllbnRhdGlvbkNoYW5nZUNhbGxiYWNrXyA9IHRoaXMub25PcmllbnRhdGlvbkNoYW5nZV8uYmluZCh0aGlzKTtcbiAgdGhpcy5vbk1lc3NhZ2VDYWxsYmFja18gPSB0aGlzLm9uTWVzc2FnZV8uYmluZCh0aGlzKTtcblxuICAvLyBPbmx5IGxpc3RlbiBmb3IgcG9zdE1lc3NhZ2VzIGlmIHdlJ3JlIGluIGFuIGlPUyBhbmQgZW1iZWRkZWQgaW5zaWRlIGEgY3Jvc3NcbiAgLy8gZG9tYWluIElGcmFtZS4gSW4gdGhpcyBjYXNlLCB0aGUgcG9seWZpbGwgY2FuIHN0aWxsIHdvcmsgaWYgdGhlIGNvbnRhaW5pbmdcbiAgLy8gcGFnZSBzZW5kcyBzeW50aGV0aWMgZGV2aWNlbW90aW9uIGV2ZW50cy4gRm9yIGFuIGV4YW1wbGUgb2YgdGhpcywgc2VlXG4gIC8vIGlmcmFtZS1tZXNzYWdlLXNlbmRlci5qcyBpbiBWUiBWaWV3OiBodHRwczovL2dvby5nbC9YRHR2RlpcbiAgaWYgKFV0aWwuaXNJT1MoKSAmJiBVdGlsLmlzSW5zaWRlQ3Jvc3NEb21haW5JRnJhbWUoKSkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5vbk1lc3NhZ2VDYWxsYmFja18pO1xuICB9XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub25PcmllbnRhdGlvbkNoYW5nZUNhbGxiYWNrXyk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2Vtb3Rpb24nLCB0aGlzLm9uRGV2aWNlTW90aW9uQ2FsbGJhY2tfKTtcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RldmljZW1vdGlvbicsIHRoaXMub25EZXZpY2VNb3Rpb25DYWxsYmFja18pO1xuICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCB0aGlzLm9uT3JpZW50YXRpb25DaGFuZ2VDYWxsYmFja18pO1xuICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMub25NZXNzYWdlQ2FsbGJhY2tfKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRnVzaW9uUG9zZVNlbnNvcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgTWF0aFV0aWwgPSByZXF1aXJlKCcuLi9tYXRoLXV0aWwnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG4vKipcbiAqIEdpdmVuIGFuIG9yaWVudGF0aW9uIGFuZCB0aGUgZ3lyb3Njb3BlIGRhdGEsIHByZWRpY3RzIHRoZSBmdXR1cmUgb3JpZW50YXRpb25cbiAqIG9mIHRoZSBoZWFkLiBUaGlzIG1ha2VzIHJlbmRlcmluZyBhcHBlYXIgZmFzdGVyLlxuICpcbiAqIEFsc28gc2VlOiBodHRwOi8vbXNsLmNzLnVpdWMuZWR1L35sYXZhbGxlL3BhcGVycy9MYXZZZXJLYXRBbnQxNC5wZGZcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZGljdGlvblRpbWVTIHRpbWUgZnJvbSBoZWFkIG1vdmVtZW50IHRvIHRoZSBhcHBlYXJhbmNlIG9mXG4gKiB0aGUgY29ycmVzcG9uZGluZyBpbWFnZS5cbiAqL1xuZnVuY3Rpb24gUG9zZVByZWRpY3RvcihwcmVkaWN0aW9uVGltZVMpIHtcbiAgdGhpcy5wcmVkaWN0aW9uVGltZVMgPSBwcmVkaWN0aW9uVGltZVM7XG5cbiAgLy8gVGhlIHF1YXRlcm5pb24gY29ycmVzcG9uZGluZyB0byB0aGUgcHJldmlvdXMgc3RhdGUuXG4gIHRoaXMucHJldmlvdXNRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgLy8gUHJldmlvdXMgdGltZSBhIHByZWRpY3Rpb24gb2NjdXJyZWQuXG4gIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gbnVsbDtcblxuICAvLyBUaGUgZGVsdGEgcXVhdGVybmlvbiB0aGF0IGFkanVzdHMgdGhlIGN1cnJlbnQgcG9zZS5cbiAgdGhpcy5kZWx0YVEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICAvLyBUaGUgb3V0cHV0IHF1YXRlcm5pb24uXG4gIHRoaXMub3V0USA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG59XG5cblBvc2VQcmVkaWN0b3IucHJvdG90eXBlLmdldFByZWRpY3Rpb24gPSBmdW5jdGlvbihjdXJyZW50USwgZ3lybywgdGltZXN0YW1wUykge1xuICBpZiAoIXRoaXMucHJldmlvdXNUaW1lc3RhbXBTKSB7XG4gICAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG4gICAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSB0aW1lc3RhbXBTO1xuICAgIHJldHVybiBjdXJyZW50UTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZSBheGlzIGFuZCBhbmdsZSBiYXNlZCBvbiBneXJvc2NvcGUgcm90YXRpb24gcmF0ZSBkYXRhLlxuICB2YXIgYXhpcyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIGF4aXMuY29weShneXJvKTtcbiAgYXhpcy5ub3JtYWxpemUoKTtcblxuICB2YXIgYW5ndWxhclNwZWVkID0gZ3lyby5sZW5ndGgoKTtcblxuICAvLyBJZiB3ZSdyZSByb3RhdGluZyBzbG93bHksIGRvbid0IGRvIHByZWRpY3Rpb24uXG4gIGlmIChhbmd1bGFyU3BlZWQgPCBNYXRoVXRpbC5kZWdUb1JhZCAqIDIwKSB7XG4gICAgaWYgKFV0aWwuaXNEZWJ1ZygpKSB7XG4gICAgICBjb25zb2xlLmxvZygnTW92aW5nIHNsb3dseSwgYXQgJXMgZGVnL3M6IG5vIHByZWRpY3Rpb24nLFxuICAgICAgICAgICAgICAgICAgKE1hdGhVdGlsLnJhZFRvRGVnICogYW5ndWxhclNwZWVkKS50b0ZpeGVkKDEpKTtcbiAgICB9XG4gICAgdGhpcy5vdXRRLmNvcHkoY3VycmVudFEpO1xuICAgIHRoaXMucHJldmlvdXNRLmNvcHkoY3VycmVudFEpO1xuICAgIHJldHVybiB0aGlzLm91dFE7XG4gIH1cblxuICAvLyBHZXQgdGhlIHByZWRpY3RlZCBhbmdsZSBiYXNlZCBvbiB0aGUgdGltZSBkZWx0YSBhbmQgbGF0ZW5jeS5cbiAgdmFyIGRlbHRhVCA9IHRpbWVzdGFtcFMgLSB0aGlzLnByZXZpb3VzVGltZXN0YW1wUztcbiAgdmFyIHByZWRpY3RBbmdsZSA9IGFuZ3VsYXJTcGVlZCAqIHRoaXMucHJlZGljdGlvblRpbWVTO1xuXG4gIHRoaXMuZGVsdGFRLnNldEZyb21BeGlzQW5nbGUoYXhpcywgcHJlZGljdEFuZ2xlKTtcbiAgdGhpcy5vdXRRLmNvcHkodGhpcy5wcmV2aW91c1EpO1xuICB0aGlzLm91dFEubXVsdGlwbHkodGhpcy5kZWx0YVEpO1xuXG4gIHRoaXMucHJldmlvdXNRLmNvcHkoY3VycmVudFEpO1xuICB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG5cbiAgcmV0dXJuIHRoaXMub3V0UTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBQb3NlUHJlZGljdG9yO1xuIiwiZnVuY3Rpb24gU2Vuc29yU2FtcGxlKHNhbXBsZSwgdGltZXN0YW1wUykge1xuICB0aGlzLnNldChzYW1wbGUsIHRpbWVzdGFtcFMpO1xufTtcblxuU2Vuc29yU2FtcGxlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihzYW1wbGUsIHRpbWVzdGFtcFMpIHtcbiAgdGhpcy5zYW1wbGUgPSBzYW1wbGU7XG4gIHRoaXMudGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG59O1xuXG5TZW5zb3JTYW1wbGUucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbihzZW5zb3JTYW1wbGUpIHtcbiAgdGhpcy5zZXQoc2Vuc29yU2FtcGxlLnNhbXBsZSwgc2Vuc29yU2FtcGxlLnRpbWVzdGFtcFMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZW5zb3JTYW1wbGU7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIE1hdGhVdGlsID0gcmVxdWlyZSgnLi9tYXRoLXV0aWwuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbnZhciBST1RBVEVfU1BFRUQgPSAwLjU7XG4vKipcbiAqIFByb3ZpZGVzIGEgcXVhdGVybmlvbiByZXNwb25zaWJsZSBmb3IgcHJlLXBhbm5pbmcgdGhlIHNjZW5lIGJlZm9yZSBmdXJ0aGVyXG4gKiB0cmFuc2Zvcm1hdGlvbnMgZHVlIHRvIGRldmljZSBzZW5zb3JzLlxuICovXG5mdW5jdGlvbiBUb3VjaFBhbm5lcigpIHtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydF8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kXy5iaW5kKHRoaXMpKTtcblxuICB0aGlzLmlzVG91Y2hpbmcgPSBmYWxzZTtcbiAgdGhpcy5yb3RhdGVTdGFydCA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRW5kID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5yb3RhdGVEZWx0YSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG5cbiAgdGhpcy50aGV0YSA9IDA7XG4gIHRoaXMub3JpZW50YXRpb24gPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xufVxuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUuZ2V0T3JpZW50YXRpb24gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vcmllbnRhdGlvbi5zZXRGcm9tRXVsZXJYWVooMCwgMCwgdGhpcy50aGV0YSk7XG4gIHJldHVybiB0aGlzLm9yaWVudGF0aW9uO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLnJlc2V0U2Vuc29yID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudGhldGEgPSAwO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLm9uVG91Y2hTdGFydF8gPSBmdW5jdGlvbihlKSB7XG4gIC8vIE9ubHkgcmVzcG9uZCBpZiB0aGVyZSBpcyBleGFjdGx5IG9uZSB0b3VjaC5cbiAgLy8gTm90ZSB0aGF0IHRoZSBEYXlkcmVhbSBjb250cm9sbGVyIHBhc3NlcyBpbiBhIGB0b3VjaHN0YXJ0YCBldmVudCB3aXRoXG4gIC8vIG5vIGB0b3VjaGVzYCBwcm9wZXJ0eSwgc28gd2UgbXVzdCBjaGVjayBmb3IgdGhhdCBjYXNlIHRvby5cbiAgaWYgKCFlLnRvdWNoZXMgfHwgZS50b3VjaGVzLmxlbmd0aCAhPSAxKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMucm90YXRlU3RhcnQuc2V0KGUudG91Y2hlc1swXS5wYWdlWCwgZS50b3VjaGVzWzBdLnBhZ2VZKTtcbiAgdGhpcy5pc1RvdWNoaW5nID0gdHJ1ZTtcbn07XG5cblRvdWNoUGFubmVyLnByb3RvdHlwZS5vblRvdWNoTW92ZV8gPSBmdW5jdGlvbihlKSB7XG4gIGlmICghdGhpcy5pc1RvdWNoaW5nKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMucm90YXRlRW5kLnNldChlLnRvdWNoZXNbMF0ucGFnZVgsIGUudG91Y2hlc1swXS5wYWdlWSk7XG4gIHRoaXMucm90YXRlRGVsdGEuc3ViVmVjdG9ycyh0aGlzLnJvdGF0ZUVuZCwgdGhpcy5yb3RhdGVTdGFydCk7XG4gIHRoaXMucm90YXRlU3RhcnQuY29weSh0aGlzLnJvdGF0ZUVuZCk7XG5cbiAgLy8gT24gaU9TLCBkaXJlY3Rpb24gaXMgaW52ZXJ0ZWQuXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICB0aGlzLnJvdGF0ZURlbHRhLnggKj0gLTE7XG4gIH1cblxuICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG4gIHRoaXMudGhldGEgKz0gMiAqIE1hdGguUEkgKiB0aGlzLnJvdGF0ZURlbHRhLnggLyBlbGVtZW50LmNsaWVudFdpZHRoICogUk9UQVRFX1NQRUVEO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLm9uVG91Y2hFbmRfID0gZnVuY3Rpb24oZSkge1xuICB0aGlzLmlzVG91Y2hpbmcgPSBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVG91Y2hQYW5uZXI7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHdpbmRvdy5VdGlsIHx8IHt9O1xuXG5VdGlsLk1JTl9USU1FU1RFUCA9IDAuMDAxO1xuVXRpbC5NQVhfVElNRVNURVAgPSAxO1xuXG5VdGlsLmJhc2U2NCA9IGZ1bmN0aW9uKG1pbWVUeXBlLCBiYXNlNjQpIHtcbiAgcmV0dXJuICdkYXRhOicgKyBtaW1lVHlwZSArICc7YmFzZTY0LCcgKyBiYXNlNjQ7XG59O1xuXG5VdGlsLmNsYW1wID0gZnVuY3Rpb24odmFsdWUsIG1pbiwgbWF4KSB7XG4gIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChtaW4sIHZhbHVlKSwgbWF4KTtcbn07XG5cblV0aWwubGVycCA9IGZ1bmN0aW9uKGEsIGIsIHQpIHtcbiAgcmV0dXJuIGEgKyAoKGIgLSBhKSAqIHQpO1xufTtcblxuLyoqXG4gKiBMaWdodCBwb2x5ZmlsbCBmb3IgYFByb21pc2UucmFjZWAuIFJldHVybnNcbiAqIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGZpcnN0IHByb21pc2VcbiAqIHByb3ZpZGVkIHJlc29sdmVzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXk8UHJvbWlzZT59IHByb21pc2VzXG4gKi9cblV0aWwucmFjZSA9IGZ1bmN0aW9uKHByb21pc2VzKSB7XG4gIGlmIChQcm9taXNlLnJhY2UpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yYWNlKHByb21pc2VzKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9taXNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgcHJvbWlzZXNbaV0udGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5VdGlsLmlzSU9TID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNJT1MgPSAvaVBhZHxpUGhvbmV8aVBvZC8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzSU9TO1xuICB9O1xufSkoKTtcblxuVXRpbC5pc1dlYlZpZXdBbmRyb2lkID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNXZWJWaWV3QW5kcm9pZCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignVmVyc2lvbicpICE9PSAtMSAmJlxuICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgIT09IC0xICYmXG4gICAgICBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0Nocm9tZScpICE9PSAtMTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBpc1dlYlZpZXdBbmRyb2lkO1xuICB9O1xufSkoKTtcblxuVXRpbC5pc1NhZmFyaSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGlzU2FmYXJpID0gL14oKD8hY2hyb21lfGFuZHJvaWQpLikqc2FmYXJpL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBpc1NhZmFyaTtcbiAgfTtcbn0pKCk7XG5cblV0aWwuaXNGaXJlZm94QW5kcm9pZCA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGlzRmlyZWZveEFuZHJvaWQgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0ZpcmVmb3gnKSAhPT0gLTEgJiZcbiAgICAgIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQW5kcm9pZCcpICE9PSAtMTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBpc0ZpcmVmb3hBbmRyb2lkO1xuICB9O1xufSkoKTtcblxuVXRpbC5pc0xhbmRzY2FwZU1vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh3aW5kb3cub3JpZW50YXRpb24gPT0gOTAgfHwgd2luZG93Lm9yaWVudGF0aW9uID09IC05MCk7XG59O1xuXG4vLyBIZWxwZXIgbWV0aG9kIHRvIHZhbGlkYXRlIHRoZSB0aW1lIHN0ZXBzIG9mIHNlbnNvciB0aW1lc3RhbXBzLlxuVXRpbC5pc1RpbWVzdGFtcERlbHRhVmFsaWQgPSBmdW5jdGlvbih0aW1lc3RhbXBEZWx0YVMpIHtcbiAgaWYgKGlzTmFOKHRpbWVzdGFtcERlbHRhUykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHRpbWVzdGFtcERlbHRhUyA8PSBVdGlsLk1JTl9USU1FU1RFUCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodGltZXN0YW1wRGVsdGFTID4gVXRpbC5NQVhfVElNRVNURVApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5VdGlsLmdldFNjcmVlbldpZHRoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLm1heCh3aW5kb3cuc2NyZWVuLndpZHRoLCB3aW5kb3cuc2NyZWVuLmhlaWdodCkgKlxuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW87XG59O1xuXG5VdGlsLmdldFNjcmVlbkhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5taW4od2luZG93LnNjcmVlbi53aWR0aCwgd2luZG93LnNjcmVlbi5oZWlnaHQpICpcbiAgICAgIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xufTtcblxuVXRpbC5yZXF1ZXN0RnVsbHNjcmVlbiA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgaWYgKFV0aWwuaXNXZWJWaWV3QW5kcm9pZCgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgIGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQubXNSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgIGVsZW1lbnQubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuVXRpbC5leGl0RnVsbHNjcmVlbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAoZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKSB7XG4gICAgZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKSB7XG4gICAgZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC5tc0V4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5VdGlsLmdldEZ1bGxzY3JlZW5FbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgIGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8XG4gICAgICBkb2N1bWVudC5tc0Z1bGxzY3JlZW5FbGVtZW50O1xufTtcblxuVXRpbC5saW5rUHJvZ3JhbSA9IGZ1bmN0aW9uKGdsLCB2ZXJ0ZXhTb3VyY2UsIGZyYWdtZW50U291cmNlLCBhdHRyaWJMb2NhdGlvbk1hcCkge1xuICAvLyBObyBlcnJvciBjaGVja2luZyBmb3IgYnJldml0eS5cbiAgdmFyIHZlcnRleFNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcbiAgZ2wuc2hhZGVyU291cmNlKHZlcnRleFNoYWRlciwgdmVydGV4U291cmNlKTtcbiAgZ2wuY29tcGlsZVNoYWRlcih2ZXJ0ZXhTaGFkZXIpO1xuXG4gIHZhciBmcmFnbWVudFNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xuICBnbC5zaGFkZXJTb3VyY2UoZnJhZ21lbnRTaGFkZXIsIGZyYWdtZW50U291cmNlKTtcbiAgZ2wuY29tcGlsZVNoYWRlcihmcmFnbWVudFNoYWRlcik7XG5cbiAgdmFyIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2ZXJ0ZXhTaGFkZXIpO1xuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnJhZ21lbnRTaGFkZXIpO1xuXG4gIGZvciAodmFyIGF0dHJpYk5hbWUgaW4gYXR0cmliTG9jYXRpb25NYXApXG4gICAgZ2wuYmluZEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIGF0dHJpYkxvY2F0aW9uTWFwW2F0dHJpYk5hbWVdLCBhdHRyaWJOYW1lKTtcblxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcblxuICBnbC5kZWxldGVTaGFkZXIodmVydGV4U2hhZGVyKTtcbiAgZ2wuZGVsZXRlU2hhZGVyKGZyYWdtZW50U2hhZGVyKTtcblxuICByZXR1cm4gcHJvZ3JhbTtcbn07XG5cblV0aWwuZ2V0UHJvZ3JhbVVuaWZvcm1zID0gZnVuY3Rpb24oZ2wsIHByb2dyYW0pIHtcbiAgdmFyIHVuaWZvcm1zID0ge307XG4gIHZhciB1bmlmb3JtQ291bnQgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9VTklGT1JNUyk7XG4gIHZhciB1bmlmb3JtTmFtZSA9ICcnO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHVuaWZvcm1Db3VudDsgaSsrKSB7XG4gICAgdmFyIHVuaWZvcm1JbmZvID0gZ2wuZ2V0QWN0aXZlVW5pZm9ybShwcm9ncmFtLCBpKTtcbiAgICB1bmlmb3JtTmFtZSA9IHVuaWZvcm1JbmZvLm5hbWUucmVwbGFjZSgnWzBdJywgJycpO1xuICAgIHVuaWZvcm1zW3VuaWZvcm1OYW1lXSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCB1bmlmb3JtTmFtZSk7XG4gIH1cbiAgcmV0dXJuIHVuaWZvcm1zO1xufTtcblxuVXRpbC5vcnRob01hdHJpeCA9IGZ1bmN0aW9uIChvdXQsIGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XG4gIHZhciBsciA9IDEgLyAobGVmdCAtIHJpZ2h0KSxcbiAgICAgIGJ0ID0gMSAvIChib3R0b20gLSB0b3ApLFxuICAgICAgbmYgPSAxIC8gKG5lYXIgLSBmYXIpO1xuICBvdXRbMF0gPSAtMiAqIGxyO1xuICBvdXRbMV0gPSAwO1xuICBvdXRbMl0gPSAwO1xuICBvdXRbM10gPSAwO1xuICBvdXRbNF0gPSAwO1xuICBvdXRbNV0gPSAtMiAqIGJ0O1xuICBvdXRbNl0gPSAwO1xuICBvdXRbN10gPSAwO1xuICBvdXRbOF0gPSAwO1xuICBvdXRbOV0gPSAwO1xuICBvdXRbMTBdID0gMiAqIG5mO1xuICBvdXRbMTFdID0gMDtcbiAgb3V0WzEyXSA9IChsZWZ0ICsgcmlnaHQpICogbHI7XG4gIG91dFsxM10gPSAodG9wICsgYm90dG9tKSAqIGJ0O1xuICBvdXRbMTRdID0gKGZhciArIG5lYXIpICogbmY7XG4gIG91dFsxNV0gPSAxO1xuICByZXR1cm4gb3V0O1xufTtcblxuVXRpbC5jb3B5QXJyYXkgPSBmdW5jdGlvbiAoc291cmNlLCBkZXN0KSB7XG4gIGZvciAodmFyIGkgPSAwLCBuID0gc291cmNlLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgIGRlc3RbaV0gPSBzb3VyY2VbaV07XG4gIH1cbn07XG5cblV0aWwuaXNNb2JpbGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNoZWNrID0gZmFsc2U7XG4gIChmdW5jdGlvbihhKXtpZigvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXJpc3xraW5kbGV8bGdlIHxtYWVtb3xtaWRwfG1tcHxtb2JpbGUuK2ZpcmVmb3h8bmV0ZnJvbnR8b3BlcmEgbShvYnxpbilpfHBhbG0oIG9zKT98cGhvbmV8cChpeGl8cmUpXFwvfHBsdWNrZXJ8cG9ja2V0fHBzcHxzZXJpZXMoNHw2KTB8c3ltYmlhbnx0cmVvfHVwXFwuKGJyb3dzZXJ8bGluayl8dm9kYWZvbmV8d2FwfHdpbmRvd3MgY2V8eGRhfHhpaW5vL2kudGVzdChhKXx8LzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdChhLnN1YnN0cigwLDQpKSljaGVjayA9IHRydWV9KShuYXZpZ2F0b3IudXNlckFnZW50fHxuYXZpZ2F0b3IudmVuZG9yfHx3aW5kb3cub3BlcmEpO1xuICByZXR1cm4gY2hlY2s7XG59O1xuXG5VdGlsLmV4dGVuZCA9IGZ1bmN0aW9uKGRlc3QsIHNyYykge1xuICBmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBkZXN0W2tleV0gPSBzcmNba2V5XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVzdDtcbn1cblxuVXRpbC5zYWZhcmlDc3NTaXplV29ya2Fyb3VuZCA9IGZ1bmN0aW9uKGNhbnZhcykge1xuICAvLyBUT0RPKHNtdXMpOiBSZW1vdmUgdGhpcyB3b3JrYXJvdW5kIHdoZW4gU2FmYXJpIGZvciBpT1MgaXMgZml4ZWQuXG4gIC8vIGlPUyBvbmx5IHdvcmthcm91bmQgKGZvciBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTUyNTU2KS5cbiAgLy9cbiAgLy8gXCJUbyB0aGUgbGFzdCBJIGdyYXBwbGUgd2l0aCB0aGVlO1xuICAvLyAgZnJvbSBoZWxsJ3MgaGVhcnQgSSBzdGFiIGF0IHRoZWU7XG4gIC8vICBmb3IgaGF0ZSdzIHNha2UgSSBzcGl0IG15IGxhc3QgYnJlYXRoIGF0IHRoZWUuXCJcbiAgLy8gLS0gTW9ieSBEaWNrLCBieSBIZXJtYW4gTWVsdmlsbGVcbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHZhciB3aWR0aCA9IGNhbnZhcy5zdHlsZS53aWR0aDtcbiAgICB2YXIgaGVpZ2h0ID0gY2FudmFzLnN0eWxlLmhlaWdodDtcbiAgICBjYW52YXMuc3R5bGUud2lkdGggPSAocGFyc2VJbnQod2lkdGgpICsgMSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSAocGFyc2VJbnQoaGVpZ2h0KSkgKyAncHgnO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBjYW52YXMuc3R5bGUud2lkdGggPSB3aWR0aDtcbiAgICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfSwgMTAwKTtcbiAgfVxuXG4gIC8vIERlYnVnIG9ubHkuXG4gIHdpbmRvdy5VdGlsID0gVXRpbDtcbiAgd2luZG93LmNhbnZhcyA9IGNhbnZhcztcbn07XG5cblV0aWwuaXNEZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gVXRpbC5nZXRRdWVyeVBhcmFtZXRlcignZGVidWcnKTtcbn07XG5cblV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXS8sIFwiXFxcXFtcIikucmVwbGFjZSgvW1xcXV0vLCBcIlxcXFxdXCIpO1xuICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiW1xcXFw/Jl1cIiArIG5hbWUgKyBcIj0oW14mI10qKVwiKSxcbiAgICAgIHJlc3VsdHMgPSByZWdleC5leGVjKGxvY2F0aW9uLnNlYXJjaCk7XG4gIHJldHVybiByZXN1bHRzID09PSBudWxsID8gXCJcIiA6IGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzFdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xufTtcblxuVXRpbC5mcmFtZURhdGFGcm9tUG9zZSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHBpT3ZlcjE4MCA9IE1hdGguUEkgLyAxODAuMDtcbiAgdmFyIHJhZDQ1ID0gTWF0aC5QSSAqIDAuMjU7XG5cbiAgLy8gQm9ycm93ZWQgZnJvbSBnbE1hdHJpeC5cbiAgZnVuY3Rpb24gbWF0NF9wZXJzcGVjdGl2ZUZyb21GaWVsZE9mVmlldyhvdXQsIGZvdiwgbmVhciwgZmFyKSB7XG4gICAgdmFyIHVwVGFuID0gTWF0aC50YW4oZm92ID8gKGZvdi51cERlZ3JlZXMgKiBwaU92ZXIxODApIDogcmFkNDUpLFxuICAgIGRvd25UYW4gPSBNYXRoLnRhbihmb3YgPyAoZm92LmRvd25EZWdyZWVzICogcGlPdmVyMTgwKSA6IHJhZDQ1KSxcbiAgICBsZWZ0VGFuID0gTWF0aC50YW4oZm92ID8gKGZvdi5sZWZ0RGVncmVlcyAqIHBpT3ZlcjE4MCkgOiByYWQ0NSksXG4gICAgcmlnaHRUYW4gPSBNYXRoLnRhbihmb3YgPyAoZm92LnJpZ2h0RGVncmVlcyAqIHBpT3ZlcjE4MCkgOiByYWQ0NSksXG4gICAgeFNjYWxlID0gMi4wIC8gKGxlZnRUYW4gKyByaWdodFRhbiksXG4gICAgeVNjYWxlID0gMi4wIC8gKHVwVGFuICsgZG93blRhbik7XG5cbiAgICBvdXRbMF0gPSB4U2NhbGU7XG4gICAgb3V0WzFdID0gMC4wO1xuICAgIG91dFsyXSA9IDAuMDtcbiAgICBvdXRbM10gPSAwLjA7XG4gICAgb3V0WzRdID0gMC4wO1xuICAgIG91dFs1XSA9IHlTY2FsZTtcbiAgICBvdXRbNl0gPSAwLjA7XG4gICAgb3V0WzddID0gMC4wO1xuICAgIG91dFs4XSA9IC0oKGxlZnRUYW4gLSByaWdodFRhbikgKiB4U2NhbGUgKiAwLjUpO1xuICAgIG91dFs5XSA9ICgodXBUYW4gLSBkb3duVGFuKSAqIHlTY2FsZSAqIDAuNSk7XG4gICAgb3V0WzEwXSA9IGZhciAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMTFdID0gLTEuMDtcbiAgICBvdXRbMTJdID0gMC4wO1xuICAgIG91dFsxM10gPSAwLjA7XG4gICAgb3V0WzE0XSA9IChmYXIgKiBuZWFyKSAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMTVdID0gMC4wO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBmdW5jdGlvbiBtYXQ0X2Zyb21Sb3RhdGlvblRyYW5zbGF0aW9uKG91dCwgcSwgdikge1xuICAgIC8vIFF1YXRlcm5pb24gbWF0aFxuICAgIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgICAgeDIgPSB4ICsgeCxcbiAgICAgICAgeTIgPSB5ICsgeSxcbiAgICAgICAgejIgPSB6ICsgeixcblxuICAgICAgICB4eCA9IHggKiB4MixcbiAgICAgICAgeHkgPSB4ICogeTIsXG4gICAgICAgIHh6ID0geCAqIHoyLFxuICAgICAgICB5eSA9IHkgKiB5MixcbiAgICAgICAgeXogPSB5ICogejIsXG4gICAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgICB3eCA9IHcgKiB4MixcbiAgICAgICAgd3kgPSB3ICogeTIsXG4gICAgICAgIHd6ID0gdyAqIHoyO1xuXG4gICAgb3V0WzBdID0gMSAtICh5eSArIHp6KTtcbiAgICBvdXRbMV0gPSB4eSArIHd6O1xuICAgIG91dFsyXSA9IHh6IC0gd3k7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSB4eSAtIHd6O1xuICAgIG91dFs1XSA9IDEgLSAoeHggKyB6eik7XG4gICAgb3V0WzZdID0geXogKyB3eDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IHh6ICsgd3k7XG4gICAgb3V0WzldID0geXogLSB3eDtcbiAgICBvdXRbMTBdID0gMSAtICh4eCArIHl5KTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gdlswXTtcbiAgICBvdXRbMTNdID0gdlsxXTtcbiAgICBvdXRbMTRdID0gdlsyXTtcbiAgICBvdXRbMTVdID0gMTtcblxuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgZnVuY3Rpb24gbWF0NF90cmFuc2xhdGUob3V0LCBhLCB2KSB7XG4gICAgdmFyIHggPSB2WzBdLCB5ID0gdlsxXSwgeiA9IHZbMl0sXG4gICAgICAgIGEwMCwgYTAxLCBhMDIsIGEwMyxcbiAgICAgICAgYTEwLCBhMTEsIGExMiwgYTEzLFxuICAgICAgICBhMjAsIGEyMSwgYTIyLCBhMjM7XG5cbiAgICBpZiAoYSA9PT0gb3V0KSB7XG4gICAgICBvdXRbMTJdID0gYVswXSAqIHggKyBhWzRdICogeSArIGFbOF0gKiB6ICsgYVsxMl07XG4gICAgICBvdXRbMTNdID0gYVsxXSAqIHggKyBhWzVdICogeSArIGFbOV0gKiB6ICsgYVsxM107XG4gICAgICBvdXRbMTRdID0gYVsyXSAqIHggKyBhWzZdICogeSArIGFbMTBdICogeiArIGFbMTRdO1xuICAgICAgb3V0WzE1XSA9IGFbM10gKiB4ICsgYVs3XSAqIHkgKyBhWzExXSAqIHogKyBhWzE1XTtcbiAgICB9IGVsc2Uge1xuICAgICAgYTAwID0gYVswXTsgYTAxID0gYVsxXTsgYTAyID0gYVsyXTsgYTAzID0gYVszXTtcbiAgICAgIGExMCA9IGFbNF07IGExMSA9IGFbNV07IGExMiA9IGFbNl07IGExMyA9IGFbN107XG4gICAgICBhMjAgPSBhWzhdOyBhMjEgPSBhWzldOyBhMjIgPSBhWzEwXTsgYTIzID0gYVsxMV07XG5cbiAgICAgIG91dFswXSA9IGEwMDsgb3V0WzFdID0gYTAxOyBvdXRbMl0gPSBhMDI7IG91dFszXSA9IGEwMztcbiAgICAgIG91dFs0XSA9IGExMDsgb3V0WzVdID0gYTExOyBvdXRbNl0gPSBhMTI7IG91dFs3XSA9IGExMztcbiAgICAgIG91dFs4XSA9IGEyMDsgb3V0WzldID0gYTIxOyBvdXRbMTBdID0gYTIyOyBvdXRbMTFdID0gYTIzO1xuXG4gICAgICBvdXRbMTJdID0gYTAwICogeCArIGExMCAqIHkgKyBhMjAgKiB6ICsgYVsxMl07XG4gICAgICBvdXRbMTNdID0gYTAxICogeCArIGExMSAqIHkgKyBhMjEgKiB6ICsgYVsxM107XG4gICAgICBvdXRbMTRdID0gYTAyICogeCArIGExMiAqIHkgKyBhMjIgKiB6ICsgYVsxNF07XG4gICAgICBvdXRbMTVdID0gYTAzICogeCArIGExMyAqIHkgKyBhMjMgKiB6ICsgYVsxNV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbiAgfTtcblxuICBmdW5jdGlvbiBtYXQ0X2ludmVydChvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XSxcblxuICAgICAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXG4gICAgICAgIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCxcbiAgICAgICAgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLFxuICAgICAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXG4gICAgICAgIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSxcbiAgICAgICAgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLFxuICAgICAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXG4gICAgICAgIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCxcbiAgICAgICAgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLFxuICAgICAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXG4gICAgICAgIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSxcbiAgICAgICAgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLFxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICAgICAgZGV0ID0gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xuXG4gICAgaWYgKCFkZXQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMV0gPSAoYTAyICogYjEwIC0gYTAxICogYjExIC0gYTAzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMl0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcbiAgICBvdXRbM10gPSAoYTIyICogYjA0IC0gYTIxICogYjA1IC0gYTIzICogYjAzKSAqIGRldDtcbiAgICBvdXRbNF0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNV0gPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNl0gPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldDtcbiAgICBvdXRbN10gPSAoYTIwICogYjA1IC0gYTIyICogYjAyICsgYTIzICogYjAxKSAqIGRldDtcbiAgICBvdXRbOF0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcbiAgICBvdXRbOV0gPSAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTBdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzExXSA9IChhMjEgKiBiMDIgLSBhMjAgKiBiMDQgLSBhMjMgKiBiMDApICogZGV0O1xuICAgIG91dFsxMl0gPSAoYTExICogYjA3IC0gYTEwICogYjA5IC0gYTEyICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTNdID0gKGEwMCAqIGIwOSAtIGEwMSAqIGIwNyArIGEwMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzE0XSA9IChhMzEgKiBiMDEgLSBhMzAgKiBiMDMgLSBhMzIgKiBiMDApICogZGV0O1xuICAgIG91dFsxNV0gPSAoYTIwICogYjAzIC0gYTIxICogYjAxICsgYTIyICogYjAwKSAqIGRldDtcblxuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgdmFyIGRlZmF1bHRPcmllbnRhdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKTtcbiAgdmFyIGRlZmF1bHRQb3NpdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDBdKTtcblxuICBmdW5jdGlvbiB1cGRhdGVFeWVNYXRyaWNlcyhwcm9qZWN0aW9uLCB2aWV3LCBwb3NlLCBwYXJhbWV0ZXJzLCB2ckRpc3BsYXkpIHtcbiAgICBtYXQ0X3BlcnNwZWN0aXZlRnJvbUZpZWxkT2ZWaWV3KHByb2plY3Rpb24sIHBhcmFtZXRlcnMgPyBwYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3IDogbnVsbCwgdnJEaXNwbGF5LmRlcHRoTmVhciwgdnJEaXNwbGF5LmRlcHRoRmFyKTtcblxuICAgIHZhciBvcmllbnRhdGlvbiA9IHBvc2Uub3JpZW50YXRpb24gfHwgZGVmYXVsdE9yaWVudGF0aW9uO1xuICAgIHZhciBwb3NpdGlvbiA9IHBvc2UucG9zaXRpb24gfHwgZGVmYXVsdFBvc2l0aW9uO1xuXG4gICAgbWF0NF9mcm9tUm90YXRpb25UcmFuc2xhdGlvbih2aWV3LCBvcmllbnRhdGlvbiwgcG9zaXRpb24pO1xuICAgIGlmIChwYXJhbWV0ZXJzKVxuICAgICAgbWF0NF90cmFuc2xhdGUodmlldywgdmlldywgcGFyYW1ldGVycy5vZmZzZXQpO1xuICAgIG1hdDRfaW52ZXJ0KHZpZXcsIHZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGZyYW1lRGF0YSwgcG9zZSwgdnJEaXNwbGF5KSB7XG4gICAgaWYgKCFmcmFtZURhdGEgfHwgIXBvc2UpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBmcmFtZURhdGEucG9zZSA9IHBvc2U7XG4gICAgZnJhbWVEYXRhLnRpbWVzdGFtcCA9IHBvc2UudGltZXN0YW1wO1xuXG4gICAgdXBkYXRlRXllTWF0cmljZXMoXG4gICAgICAgIGZyYW1lRGF0YS5sZWZ0UHJvamVjdGlvbk1hdHJpeCwgZnJhbWVEYXRhLmxlZnRWaWV3TWF0cml4LFxuICAgICAgICBwb3NlLCB2ckRpc3BsYXkuZ2V0RXllUGFyYW1ldGVycyhcImxlZnRcIiksIHZyRGlzcGxheSk7XG4gICAgdXBkYXRlRXllTWF0cmljZXMoXG4gICAgICAgIGZyYW1lRGF0YS5yaWdodFByb2plY3Rpb25NYXRyaXgsIGZyYW1lRGF0YS5yaWdodFZpZXdNYXRyaXgsXG4gICAgICAgIHBvc2UsIHZyRGlzcGxheS5nZXRFeWVQYXJhbWV0ZXJzKFwicmlnaHRcIiksIHZyRGlzcGxheSk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn0pKCk7XG5cblV0aWwuaXNJbnNpZGVDcm9zc0RvbWFpbklGcmFtZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXNGcmFtZWQgPSAod2luZG93LnNlbGYgIT09IHdpbmRvdy50b3ApO1xuICB2YXIgcmVmRG9tYWluID0gVXRpbC5nZXREb21haW5Gcm9tVXJsKGRvY3VtZW50LnJlZmVycmVyKTtcbiAgdmFyIHRoaXNEb21haW4gPSBVdGlsLmdldERvbWFpbkZyb21Vcmwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXG4gIHJldHVybiBpc0ZyYW1lZCAmJiAocmVmRG9tYWluICE9PSB0aGlzRG9tYWluKTtcbn07XG5cbi8vIEZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjM5NDUwMjcuXG5VdGlsLmdldERvbWFpbkZyb21VcmwgPSBmdW5jdGlvbih1cmwpIHtcbiAgdmFyIGRvbWFpbjtcbiAgLy8gRmluZCAmIHJlbW92ZSBwcm90b2NvbCAoaHR0cCwgZnRwLCBldGMuKSBhbmQgZ2V0IGRvbWFpbi5cbiAgaWYgKHVybC5pbmRleE9mKFwiOi8vXCIpID4gLTEpIHtcbiAgICBkb21haW4gPSB1cmwuc3BsaXQoJy8nKVsyXTtcbiAgfVxuICBlbHNlIHtcbiAgICBkb21haW4gPSB1cmwuc3BsaXQoJy8nKVswXTtcbiAgfVxuXG4gIC8vZmluZCAmIHJlbW92ZSBwb3J0IG51bWJlclxuICBkb21haW4gPSBkb21haW4uc3BsaXQoJzonKVswXTtcblxuICByZXR1cm4gZG9tYWluO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWw7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgRGV2aWNlSW5mbyA9IHJlcXVpcmUoJy4vZGV2aWNlLWluZm8uanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbnZhciBERUZBVUxUX1ZJRVdFUiA9ICdDYXJkYm9hcmRWMSc7XG52YXIgVklFV0VSX0tFWSA9ICdXRUJWUl9DQVJEQk9BUkRfVklFV0VSJztcbnZhciBDTEFTU19OQU1FID0gJ3dlYnZyLXBvbHlmaWxsLXZpZXdlci1zZWxlY3Rvcic7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHZpZXdlciBzZWxlY3RvciB3aXRoIHRoZSBvcHRpb25zIHNwZWNpZmllZC4gU3VwcG9ydHMgYmVpbmcgc2hvd25cbiAqIGFuZCBoaWRkZW4uIEdlbmVyYXRlcyBldmVudHMgd2hlbiB2aWV3ZXIgcGFyYW1ldGVycyBjaGFuZ2UuIEFsc28gc3VwcG9ydHNcbiAqIHNhdmluZyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGluZGV4IGluIGxvY2FsU3RvcmFnZS5cbiAqL1xuZnVuY3Rpb24gVmlld2VyU2VsZWN0b3IoKSB7XG4gIC8vIFRyeSB0byBsb2FkIHRoZSBzZWxlY3RlZCBrZXkgZnJvbSBsb2NhbCBzdG9yYWdlLlxuICB0cnkge1xuICAgIHRoaXMuc2VsZWN0ZWRLZXkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShWSUVXRVJfS0VZKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbG9hZCB2aWV3ZXIgcHJvZmlsZTogJXMnLCBlcnJvcik7XG4gIH1cblxuICAvL0lmIG5vbmUgZXhpc3RzLCBvciBpZiBsb2NhbHN0b3JhZ2UgaXMgdW5hdmFpbGFibGUsIHVzZSB0aGUgZGVmYXVsdCBrZXkuXG4gIGlmICghdGhpcy5zZWxlY3RlZEtleSkge1xuICAgIHRoaXMuc2VsZWN0ZWRLZXkgPSBERUZBVUxUX1ZJRVdFUjtcbiAgfVxuXG4gIHRoaXMuZGlhbG9nID0gdGhpcy5jcmVhdGVEaWFsb2dfKERldmljZUluZm8uVmlld2Vycyk7XG4gIHRoaXMucm9vdCA9IG51bGw7XG4gIHRoaXMub25DaGFuZ2VDYWxsYmFja3NfID0gW107XG59XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24ocm9vdCkge1xuICB0aGlzLnJvb3QgPSByb290O1xuXG4gIHJvb3QuYXBwZW5kQ2hpbGQodGhpcy5kaWFsb2cpO1xuXG4gIC8vIEVuc3VyZSB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0gaXMgY2hlY2tlZC5cbiAgdmFyIHNlbGVjdGVkID0gdGhpcy5kaWFsb2cucXVlcnlTZWxlY3RvcignIycgKyB0aGlzLnNlbGVjdGVkS2V5KTtcbiAgc2VsZWN0ZWQuY2hlY2tlZCA9IHRydWU7XG5cbiAgLy8gU2hvdyB0aGUgVUkuXG4gIHRoaXMuZGlhbG9nLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMucm9vdCAmJiB0aGlzLnJvb3QuY29udGFpbnModGhpcy5kaWFsb2cpKSB7XG4gICAgdGhpcy5yb290LnJlbW92ZUNoaWxkKHRoaXMuZGlhbG9nKTtcbiAgfVxuICB0aGlzLmRpYWxvZy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmdldEN1cnJlbnRWaWV3ZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIERldmljZUluZm8uVmlld2Vyc1t0aGlzLnNlbGVjdGVkS2V5XTtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5nZXRTZWxlY3RlZEtleV8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGlucHV0ID0gdGhpcy5kaWFsb2cucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1maWVsZF06Y2hlY2tlZCcpO1xuICBpZiAoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQuaWQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUub25DaGFuZ2UgPSBmdW5jdGlvbihjYikge1xuICB0aGlzLm9uQ2hhbmdlQ2FsbGJhY2tzXy5wdXNoKGNiKTtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5maXJlT25DaGFuZ2VfID0gZnVuY3Rpb24odmlld2VyKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vbkNoYW5nZUNhbGxiYWNrc18ubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLm9uQ2hhbmdlQ2FsbGJhY2tzX1tpXSh2aWV3ZXIpO1xuICB9XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUub25TYXZlXyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNlbGVjdGVkS2V5ID0gdGhpcy5nZXRTZWxlY3RlZEtleV8oKTtcbiAgaWYgKCF0aGlzLnNlbGVjdGVkS2V5IHx8ICFEZXZpY2VJbmZvLlZpZXdlcnNbdGhpcy5zZWxlY3RlZEtleV0pIHtcbiAgICBjb25zb2xlLmVycm9yKCdWaWV3ZXJTZWxlY3Rvci5vblNhdmVfOiB0aGlzIHNob3VsZCBuZXZlciBoYXBwZW4hJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5maXJlT25DaGFuZ2VfKERldmljZUluZm8uVmlld2Vyc1t0aGlzLnNlbGVjdGVkS2V5XSk7XG5cbiAgLy8gQXR0ZW1wdCB0byBzYXZlIHRoZSB2aWV3ZXIgcHJvZmlsZSwgYnV0IGZhaWxzIGluIHByaXZhdGUgbW9kZS5cbiAgdHJ5IHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShWSUVXRVJfS0VZLCB0aGlzLnNlbGVjdGVkS2V5KTtcbiAgfSBjYXRjaChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzYXZlIHZpZXdlciBwcm9maWxlOiAlcycsIGVycm9yKTtcbiAgfVxuICB0aGlzLmhpZGUoKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgZGlhbG9nLlxuICovXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuY3JlYXRlRGlhbG9nXyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb250YWluZXIuY2xhc3NMaXN0LmFkZChDTEFTU19OQU1FKTtcbiAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIC8vIENyZWF0ZSBhbiBvdmVybGF5IHRoYXQgZGltcyB0aGUgYmFja2dyb3VuZCwgYW5kIHdoaWNoIGdvZXMgYXdheSB3aGVuIHlvdVxuICAvLyB0YXAgaXQuXG4gIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gb3ZlcmxheS5zdHlsZTtcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMubGVmdCA9IDA7XG4gIHMudG9wID0gMDtcbiAgcy53aWR0aCA9ICcxMDAlJztcbiAgcy5oZWlnaHQgPSAnMTAwJSc7XG4gIHMuYmFja2dyb3VuZCA9ICdyZ2JhKDAsIDAsIDAsIDAuMyknO1xuICBvdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oaWRlLmJpbmQodGhpcykpO1xuXG4gIHZhciB3aWR0aCA9IDI4MDtcbiAgdmFyIGRpYWxvZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IGRpYWxvZy5zdHlsZTtcbiAgcy5ib3hTaXppbmcgPSAnYm9yZGVyLWJveCc7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLnRvcCA9ICcyNHB4JztcbiAgcy5sZWZ0ID0gJzUwJSc7XG4gIHMubWFyZ2luTGVmdCA9ICgtd2lkdGgvMikgKyAncHgnO1xuICBzLndpZHRoID0gd2lkdGggKyAncHgnO1xuICBzLnBhZGRpbmcgPSAnMjRweCc7XG4gIHMub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgcy5iYWNrZ3JvdW5kID0gJyNmYWZhZmEnO1xuICBzLmZvbnRGYW1pbHkgPSBcIidSb2JvdG8nLCBzYW5zLXNlcmlmXCI7XG4gIHMuYm94U2hhZG93ID0gJzBweCA1cHggMjBweCAjNjY2JztcblxuICBkaWFsb2cuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVIMV8oJ1NlbGVjdCB5b3VyIHZpZXdlcicpKTtcbiAgZm9yICh2YXIgaWQgaW4gb3B0aW9ucykge1xuICAgIGRpYWxvZy5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUNob2ljZV8oaWQsIG9wdGlvbnNbaWRdLmxhYmVsKSk7XG4gIH1cbiAgZGlhbG9nLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlQnV0dG9uXygnU2F2ZScsIHRoaXMub25TYXZlXy5iaW5kKHRoaXMpKSk7XG5cbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKG92ZXJsYXkpO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZGlhbG9nKTtcblxuICByZXR1cm4gY29udGFpbmVyO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmNyZWF0ZUgxXyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIGgxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcbiAgdmFyIHMgPSBoMS5zdHlsZTtcbiAgcy5jb2xvciA9ICdibGFjayc7XG4gIHMuZm9udFNpemUgPSAnMjBweCc7XG4gIHMuZm9udFdlaWdodCA9ICdib2xkJztcbiAgcy5tYXJnaW5Ub3AgPSAwO1xuICBzLm1hcmdpbkJvdHRvbSA9ICcyNHB4JztcbiAgaDEuaW5uZXJIVE1MID0gbmFtZTtcbiAgcmV0dXJuIGgxO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmNyZWF0ZUNob2ljZV8gPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuICAvKlxuICA8ZGl2IGNsYXNzPVwiY2hvaWNlXCI+XG4gIDxpbnB1dCBpZD1cInYxXCIgdHlwZT1cInJhZGlvXCIgbmFtZT1cImZpZWxkXCIgdmFsdWU9XCJ2MVwiPlxuICA8bGFiZWwgZm9yPVwidjFcIj5DYXJkYm9hcmQgVjE8L2xhYmVsPlxuICA8L2Rpdj5cbiAgKi9cbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuc3R5bGUubWFyZ2luVG9wID0gJzhweCc7XG4gIGRpdi5zdHlsZS5jb2xvciA9ICdibGFjayc7XG5cbiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXQuc3R5bGUuZm9udFNpemUgPSAnMzBweCc7XG4gIGlucHV0LnNldEF0dHJpYnV0ZSgnaWQnLCBpZCk7XG4gIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgaWQpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ25hbWUnLCAnZmllbGQnKTtcblxuICB2YXIgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICBsYWJlbC5zdHlsZS5tYXJnaW5MZWZ0ID0gJzRweCc7XG4gIGxhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgaWQpO1xuICBsYWJlbC5pbm5lckhUTUwgPSBuYW1lO1xuXG4gIGRpdi5hcHBlbmRDaGlsZChpbnB1dCk7XG4gIGRpdi5hcHBlbmRDaGlsZChsYWJlbCk7XG5cbiAgcmV0dXJuIGRpdjtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5jcmVhdGVCdXR0b25fID0gZnVuY3Rpb24obGFiZWwsIG9uY2xpY2spIHtcbiAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICBidXR0b24uaW5uZXJIVE1MID0gbGFiZWw7XG4gIHZhciBzID0gYnV0dG9uLnN0eWxlO1xuICBzLmZsb2F0ID0gJ3JpZ2h0JztcbiAgcy50ZXh0VHJhbnNmb3JtID0gJ3VwcGVyY2FzZSc7XG4gIHMuY29sb3IgPSAnIzEwOTRmNyc7XG4gIHMuZm9udFNpemUgPSAnMTRweCc7XG4gIHMubGV0dGVyU3BhY2luZyA9IDA7XG4gIHMuYm9yZGVyID0gMDtcbiAgcy5iYWNrZ3JvdW5kID0gJ25vbmUnO1xuICBzLm1hcmdpblRvcCA9ICcxNnB4JztcblxuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbmNsaWNrKTtcblxuICByZXR1cm4gYnV0dG9uO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3ZXJTZWxlY3RvcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbi8qKlxuICogQW5kcm9pZCBhbmQgaU9TIGNvbXBhdGlibGUgd2FrZWxvY2sgaW1wbGVtZW50YXRpb24uXG4gKlxuICogUmVmYWN0b3JlZCB0aGFua3MgdG8gZGtvdmFsZXZALlxuICovXG5mdW5jdGlvbiBBbmRyb2lkV2FrZUxvY2soKSB7XG4gIHZhciB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XG4gIHZpZGVvLnNldEF0dHJpYnV0ZSgnbG9vcCcsICcnKTtcblxuICBmdW5jdGlvbiBhZGRTb3VyY2VUb1ZpZGVvKGVsZW1lbnQsIHR5cGUsIGRhdGFVUkkpIHtcbiAgICB2YXIgc291cmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XG4gICAgc291cmNlLnNyYyA9IGRhdGFVUkk7XG4gICAgc291cmNlLnR5cGUgPSAndmlkZW8vJyArIHR5cGU7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChzb3VyY2UpO1xuICB9XG5cbiAgYWRkU291cmNlVG9WaWRlbyh2aWRlbywnd2VibScsIFV0aWwuYmFzZTY0KCd2aWRlby93ZWJtJywgJ0drWGZvMEFnUW9hQkFVTDNnUUZDOG9FRVF2T0JDRUtDUUFSM1pXSnRRb2VCQWtLRmdRSVlVNEJuUUkwVlNhbG1RQ2dxMTdGQUF3OUNRRTJBUUFaM2FHRnRiWGxYUVVBR2QyaGhiVzE1UklsQUNFQ1BRQUFBQUFBQUZsU3VhMEF4cmtBdTE0RUJZOFdCQVp5QkFDSzFuRUFEZFc1a2hrQUZWbDlXVURnbGhvaEFBMVpRT0lPQkFlQkFCckNCQ0xxQkNCOUR0blZBSXVlQkFLTkFISUVBQUlBd0FRQ2RBU29JQUFnQUFVQW1KYVFBQTNBQS92ejBBQUE9JykpO1xuICBhZGRTb3VyY2VUb1ZpZGVvKHZpZGVvLCAnbXA0JywgVXRpbC5iYXNlNjQoJ3ZpZGVvL21wNCcsICdBQUFBSEdaMGVYQnBjMjl0QUFBQ0FHbHpiMjFwYzI4eWJYQTBNUUFBQUFobWNtVmxBQUFBRzIxa1lYUUFBQUd6QUJBSEFBQUJ0aEFEQW93ZGJiOS9BQUFDNlcxdmIzWUFBQUJzYlhab1pBQUFBQUI4SmJDQWZDV3dnQUFBQStnQUFBQUFBQUVBQUFFQUFBQUFBQUFBQUFBQUFBQUJBQUFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBUUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBSUFBQUlWZEhKaGF3QUFBRngwYTJoa0FBQUFEM3dsc0lCOEpiQ0FBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFCQUFBQUFBQUFBQUFBQUFBQUFBQUFBUUFBQUFBQUFBQUFBQUFBQUFBQVFBQUFBQUFJQUFBQUNBQUFBQUFCc1cxa2FXRUFBQUFnYldSb1pBQUFBQUI4SmJDQWZDV3dnQUFBQStnQUFBQUFWY1FBQUFBQUFDMW9aR3h5QUFBQUFBQUFBQUIyYVdSbEFBQUFBQUFBQUFBQUFBQUFWbWxrWlc5SVlXNWtiR1Z5QUFBQUFWeHRhVzVtQUFBQUZIWnRhR1FBQUFBQkFBQUFBQUFBQUFBQUFBQWtaR2x1WmdBQUFCeGtjbVZtQUFBQUFBQUFBQUVBQUFBTWRYSnNJQUFBQUFFQUFBRWNjM1JpYkFBQUFMaHpkSE5rQUFBQUFBQUFBQUVBQUFDb2JYQTBkZ0FBQUFBQUFBQUJBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUlBQWdBU0FBQUFFZ0FBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUJqLy93QUFBRkpsYzJSekFBQUFBQU5FQUFFQUJEd2dFUUFBQUFBRERVQUFBQUFBQlMwQUFBR3dBUUFBQWJXSkV3QUFBUUFBQUFFZ0FNU05pQjlGQUVRQkZHTUFBQUd5VEdGMll6VXlMamczTGpRR0FRSUFBQUFZYzNSMGN3QUFBQUFBQUFBQkFBQUFBUUFBQUFBQUFBQWNjM1J6WXdBQUFBQUFBQUFCQUFBQUFRQUFBQUVBQUFBQkFBQUFGSE4wYzNvQUFBQUFBQUFBRXdBQUFBRUFBQUFVYzNSamJ3QUFBQUFBQUFBQkFBQUFMQUFBQUdCMVpIUmhBQUFBV0cxbGRHRUFBQUFBQUFBQUlXaGtiSElBQUFBQUFBQUFBRzFrYVhKaGNIQnNBQUFBQUFBQUFBQUFBQUFBSzJsc2MzUUFBQUFqcVhSdmJ3QUFBQnRrWVhSaEFBQUFBUUFBQUFCTVlYWm1OVEl1TnpndU13PT0nKSk7XG5cbiAgdGhpcy5yZXF1ZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHZpZGVvLnBhdXNlZCkge1xuICAgICAgdmlkZW8ucGxheSgpO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLnJlbGVhc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2aWRlby5wYXVzZSgpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBpT1NXYWtlTG9jaygpIHtcbiAgdmFyIHRpbWVyID0gbnVsbDtcblxuICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRpbWVyKSB7XG4gICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb247XG4gICAgICAgIHNldFRpbWVvdXQod2luZG93LnN0b3AsIDApO1xuICAgICAgfSwgMzAwMDApO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMucmVsZWFzZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aW1lcikge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICB0aW1lciA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cblxuZnVuY3Rpb24gZ2V0V2FrZUxvY2soKSB7XG4gIHZhciB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8IG5hdmlnYXRvci52ZW5kb3IgfHwgd2luZG93Lm9wZXJhO1xuICBpZiAodXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHwgdXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpKSB7XG4gICAgcmV0dXJuIGlPU1dha2VMb2NrO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBBbmRyb2lkV2FrZUxvY2s7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRXYWtlTG9jaygpOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgQ2FyZGJvYXJkVlJEaXNwbGF5ID0gcmVxdWlyZSgnLi9jYXJkYm9hcmQtdnItZGlzcGxheS5qcycpO1xudmFyIE1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkgPSByZXF1aXJlKCcuL21vdXNlLWtleWJvYXJkLXZyLWRpc3BsYXkuanMnKTtcbi8vIFVuY29tbWVudCB0byBhZGQgcG9zaXRpb25hbCB0cmFja2luZyB2aWEgd2ViY2FtLlxuLy92YXIgV2ViY2FtUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IHJlcXVpcmUoJy4vd2ViY2FtLXBvc2l0aW9uLXNlbnNvci12ci1kZXZpY2UuanMnKTtcbnZhciBWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5WUkRpc3BsYXk7XG52YXIgVlJGcmFtZURhdGEgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5WUkZyYW1lRGF0YTtcbnZhciBITURWUkRldmljZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLkhNRFZSRGV2aWNlO1xudmFyIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5Qb3NpdGlvblNlbnNvclZSRGV2aWNlO1xudmFyIFZSRGlzcGxheUhNRERldmljZSA9IHJlcXVpcmUoJy4vZGlzcGxheS13cmFwcGVycy5qcycpLlZSRGlzcGxheUhNRERldmljZTtcbnZhciBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZSA9IHJlcXVpcmUoJy4vZGlzcGxheS13cmFwcGVycy5qcycpLlZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlO1xudmFyIHZlcnNpb24gPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKS52ZXJzaW9uO1xuXG5mdW5jdGlvbiBXZWJWUlBvbHlmaWxsKCkge1xuICB0aGlzLmRpc3BsYXlzID0gW107XG4gIHRoaXMuZGV2aWNlcyA9IFtdOyAvLyBGb3IgZGVwcmVjYXRlZCBvYmplY3RzXG4gIHRoaXMuZGV2aWNlc1BvcHVsYXRlZCA9IGZhbHNlO1xuICB0aGlzLm5hdGl2ZVdlYlZSQXZhaWxhYmxlID0gdGhpcy5pc1dlYlZSQXZhaWxhYmxlKCk7XG4gIHRoaXMubmF0aXZlTGVnYWN5V2ViVlJBdmFpbGFibGUgPSB0aGlzLmlzRGVwcmVjYXRlZFdlYlZSQXZhaWxhYmxlKCk7XG4gIHRoaXMubmF0aXZlR2V0VlJEaXNwbGF5c0Z1bmMgPSB0aGlzLm5hdGl2ZVdlYlZSQXZhaWxhYmxlID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGw7XG5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2drYXRzZXYvd2VidnItcG9seWZpbGwvY29tbWl0LzhmOGYwNzFiZDI2NTdhMjRjY2JkOGM2M2FiMzQ1NjRkZDAyNGVhMDlcbiAgaWYgKCF0aGlzLm5hdGl2ZUxlZ2FjeVdlYlZSQXZhaWxhYmxlICYmICF0aGlzLm5hdGl2ZVdlYlZSQXZhaWxhYmxlKSB7XG4gICAgdGhpcy5lbmFibGVQb2x5ZmlsbCgpO1xuICAgIGlmICh3aW5kb3cuV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gICAgICB0aGlzLmVuYWJsZURlcHJlY2F0ZWRQb2x5ZmlsbCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1dCBhIHNoaW0gaW4gcGxhY2UgdG8gdXBkYXRlIHRoZSBBUEkgdG8gMS4xIGlmIG5lZWRlZC5cbiAgSW5zdGFsbFdlYlZSU3BlY1NoaW0oKTtcbn1cblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNXZWJWUkF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKCdnZXRWUkRpc3BsYXlzJyBpbiBuYXZpZ2F0b3IpO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNEZXByZWNhdGVkV2ViVlJBdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICgnZ2V0VlJEZXZpY2VzJyBpbiBuYXZpZ2F0b3IpIHx8ICgnbW96R2V0VlJEZXZpY2VzJyBpbiBuYXZpZ2F0b3IpO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuY29ubmVjdERpc3BsYXkgPSBmdW5jdGlvbih2ckRpc3BsYXkpIHtcbiAgdnJEaXNwbGF5LmZpcmVWUkRpc3BsYXlDb25uZWN0XygpO1xuICB0aGlzLmRpc3BsYXlzLnB1c2godnJEaXNwbGF5KTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLnBvcHVsYXRlRGV2aWNlcyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5kZXZpY2VzUG9wdWxhdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSW5pdGlhbGl6ZSBvdXIgdmlydHVhbCBWUiBkZXZpY2VzLlxuICB2YXIgdnJEaXNwbGF5ID0gbnVsbDtcblxuICAvLyBBZGQgYSBDYXJkYm9hcmQgVlJEaXNwbGF5IG9uIGNvbXBhdGlibGUgbW9iaWxlIGRldmljZXNcbiAgaWYgKHRoaXMuaXNDYXJkYm9hcmRDb21wYXRpYmxlKCkpIHtcbiAgICB2ckRpc3BsYXkgPSBuZXcgQ2FyZGJvYXJkVlJEaXNwbGF5KCk7XG5cbiAgICB0aGlzLmNvbm5lY3REaXNwbGF5KHZyRGlzcGxheSk7XG5cbiAgICAvLyBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBpZiAod2luZG93LldlYlZSQ29uZmlnLkVOQUJMRV9ERVBSRUNBVEVEX0FQSSkge1xuICAgICAgdGhpcy5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheUhNRERldmljZSh2ckRpc3BsYXkpKTtcbiAgICAgIHRoaXMuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZSh2ckRpc3BsYXkpKTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgYSBNb3VzZSBhbmQgS2V5Ym9hcmQgZHJpdmVuIFZSRGlzcGxheSBmb3IgZGVza3RvcHMvbGFwdG9wc1xuICBpZiAoIXRoaXMuaXNNb2JpbGUoKSAmJiAhd2luZG93LldlYlZSQ29uZmlnLk1PVVNFX0tFWUJPQVJEX0NPTlRST0xTX0RJU0FCTEVEKSB7XG4gICAgdnJEaXNwbGF5ID0gbmV3IE1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkoKTtcbiAgICB0aGlzLmNvbm5lY3REaXNwbGF5KHZyRGlzcGxheSk7XG5cbiAgICAvLyBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBpZiAod2luZG93LldlYlZSQ29uZmlnLkVOQUJMRV9ERVBSRUNBVEVEX0FQSSkge1xuICAgICAgdGhpcy5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheUhNRERldmljZSh2ckRpc3BsYXkpKTtcbiAgICAgIHRoaXMuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZSh2ckRpc3BsYXkpKTtcbiAgICB9XG4gIH1cblxuICAvLyBVbmNvbW1lbnQgdG8gYWRkIHBvc2l0aW9uYWwgdHJhY2tpbmcgdmlhIHdlYmNhbS5cbiAgLy9pZiAoIXRoaXMuaXNNb2JpbGUoKSAmJiB3aW5kb3cuV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gIC8vICBwb3NpdGlvbkRldmljZSA9IG5ldyBXZWJjYW1Qb3NpdGlvblNlbnNvclZSRGV2aWNlKCk7XG4gIC8vICB0aGlzLmRldmljZXMucHVzaChwb3NpdGlvbkRldmljZSk7XG4gIC8vfVxuXG4gIHRoaXMuZGV2aWNlc1BvcHVsYXRlZCA9IHRydWU7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5lbmFibGVQb2x5ZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAvLyBQcm92aWRlIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzLlxuICBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cyA9IHRoaXMuZ2V0VlJEaXNwbGF5cy5iaW5kKHRoaXMpO1xuXG4gIC8vIFBvbHlmaWxsIG5hdGl2ZSBWUkRpc3BsYXkuZ2V0RnJhbWVEYXRhXG4gIGlmICh0aGlzLm5hdGl2ZVdlYlZSQXZhaWxhYmxlICYmIHdpbmRvdy5WUkZyYW1lRGF0YSkge1xuICAgIHZhciBOYXRpdmVWUkZyYW1lRGF0YSA9IHdpbmRvdy5WUkZyYW1lRGF0YTtcbiAgICB2YXIgbmF0aXZlRnJhbWVEYXRhID0gbmV3IHdpbmRvdy5WUkZyYW1lRGF0YSgpO1xuICAgIHZhciBuYXRpdmVHZXRGcmFtZURhdGEgPSB3aW5kb3cuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRGcmFtZURhdGE7XG4gICAgd2luZG93LlZSRnJhbWVEYXRhID0gVlJGcmFtZURhdGE7XG5cbiAgICB3aW5kb3cuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRGcmFtZURhdGEgPSBmdW5jdGlvbihmcmFtZURhdGEpIHtcbiAgICAgIGlmIChmcmFtZURhdGEgaW5zdGFuY2VvZiBOYXRpdmVWUkZyYW1lRGF0YSkge1xuICAgICAgICBuYXRpdmVHZXRGcmFtZURhdGEuY2FsbCh0aGlzLCBmcmFtZURhdGEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8qXG4gICAgICBDb3B5IGZyYW1lIGRhdGEgZnJvbSB0aGUgbmF0aXZlIG9iamVjdCBpbnRvIHRoZSBwb2x5ZmlsbGVkIG9iamVjdC5cbiAgICAgICovXG5cbiAgICAgIG5hdGl2ZUdldEZyYW1lRGF0YS5jYWxsKHRoaXMsIG5hdGl2ZUZyYW1lRGF0YSk7XG4gICAgICBmcmFtZURhdGEucG9zZSA9IG5hdGl2ZUZyYW1lRGF0YS5wb3NlO1xuICAgICAgVXRpbC5jb3B5QXJyYXkobmF0aXZlRnJhbWVEYXRhLmxlZnRQcm9qZWN0aW9uTWF0cml4LCBmcmFtZURhdGEubGVmdFByb2plY3Rpb25NYXRyaXgpO1xuICAgICAgVXRpbC5jb3B5QXJyYXkobmF0aXZlRnJhbWVEYXRhLnJpZ2h0UHJvamVjdGlvbk1hdHJpeCwgZnJhbWVEYXRhLnJpZ2h0UHJvamVjdGlvbk1hdHJpeCk7XG4gICAgICBVdGlsLmNvcHlBcnJheShuYXRpdmVGcmFtZURhdGEubGVmdFZpZXdNYXRyaXgsIGZyYW1lRGF0YS5sZWZ0Vmlld01hdHJpeCk7XG4gICAgICBVdGlsLmNvcHlBcnJheShuYXRpdmVGcmFtZURhdGEucmlnaHRWaWV3TWF0cml4LCBmcmFtZURhdGEucmlnaHRWaWV3TWF0cml4KTtcbiAgICAgIC8vdG9kbzogY29weVxuICAgIH07XG4gIH1cblxuICAvLyBQcm92aWRlIHRoZSBgVlJEaXNwbGF5YCBvYmplY3QuXG4gIHdpbmRvdy5WUkRpc3BsYXkgPSBWUkRpc3BsYXk7XG5cbiAgLy8gUHJvdmlkZSB0aGUgYG5hdmlnYXRvci52ckVuYWJsZWRgIHByb3BlcnR5LlxuICBpZiAobmF2aWdhdG9yICYmICFuYXZpZ2F0b3IudnJFbmFibGVkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShuYXZpZ2F0b3IsICd2ckVuYWJsZWQnLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuaXNDYXJkYm9hcmRDb21wYXRpYmxlKCkgJiZcbiAgICAgICAgICAgIChzZWxmLmlzRnVsbFNjcmVlbkF2YWlsYWJsZSgpIHx8IFV0aWwuaXNJT1MoKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBpZiAoISgnVlJGcmFtZURhdGEnIGluIHdpbmRvdykpIHtcbiAgICAvLyBQcm92aWRlIHRoZSBWUkZyYW1lRGF0YSBvYmplY3QuXG4gICAgd2luZG93LlZSRnJhbWVEYXRhID0gVlJGcmFtZURhdGE7XG4gIH1cbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmVuYWJsZURlcHJlY2F0ZWRQb2x5ZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAvLyBQcm92aWRlIG5hdmlnYXRvci5nZXRWUkRldmljZXMuXG4gIG5hdmlnYXRvci5nZXRWUkRldmljZXMgPSB0aGlzLmdldFZSRGV2aWNlcy5iaW5kKHRoaXMpO1xuXG4gIC8vIFByb3ZpZGUgdGhlIENhcmRib2FyZEhNRFZSRGV2aWNlIGFuZCBQb3NpdGlvblNlbnNvclZSRGV2aWNlIG9iamVjdHMuXG4gIHdpbmRvdy5ITURWUkRldmljZSA9IEhNRFZSRGV2aWNlO1xuICB3aW5kb3cuUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IFBvc2l0aW9uU2Vuc29yVlJEZXZpY2U7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5nZXRWUkRpc3BsYXlzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucG9wdWxhdGVEZXZpY2VzKCk7XG4gIHZhciBwb2x5ZmlsbERpc3BsYXlzID0gdGhpcy5kaXNwbGF5cztcblxuICBpZiAoIXRoaXMubmF0aXZlV2ViVlJBdmFpbGFibGUpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHBvbHlmaWxsRGlzcGxheXMpO1xuICB9XG5cbiAgLy8gU2V0IHVwIGEgcmFjZSBjb25kaXRpb24gaWYgdGhpcyBicm93c2VyIGhhcyBhIGJ1ZyB3aGVyZVxuICAvLyBgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKWAgbmV2ZXIgcmVzb2x2ZXMuXG4gIHZhciB0aW1lb3V0SWQ7XG4gIHZhciB2ckRpc3BsYXlzTmF0aXZlID0gdGhpcy5uYXRpdmVHZXRWUkRpc3BsYXlzRnVuYy5jYWxsKG5hdmlnYXRvcik7XG4gIHZhciB0aW1lb3V0UHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgY29uc29sZS53YXJuKCdOYXRpdmUgV2ViVlIgaW1wbGVtZW50YXRpb24gZGV0ZWN0ZWQsIGJ1dCBgZ2V0VlJEaXNwbGF5cygpYCBmYWlsZWQgdG8gcmVzb2x2ZS4gRmFsbGluZyBiYWNrIHRvIHBvbHlmaWxsLicpO1xuICAgICAgcmVzb2x2ZShbXSk7XG4gICAgfSwgd2luZG93LldlYlZSQ29uZmlnLkdFVF9WUl9ESVNQTEFZU19USU1FT1VUKTtcbiAgfSk7XG5cbiAgcmV0dXJuIFV0aWwucmFjZShbXG4gICAgdnJEaXNwbGF5c05hdGl2ZSxcbiAgICB0aW1lb3V0UHJvbWlzZVxuICBdKS50aGVuKGZ1bmN0aW9uKG5hdGl2ZURpc3BsYXlzKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgaWYgKHdpbmRvdy5XZWJWUkNvbmZpZy5BTFdBWVNfQVBQRU5EX1BPTFlGSUxMX0RJU1BMQVkpIHtcbiAgICAgIHJldHVybiBuYXRpdmVEaXNwbGF5cy5jb25jYXQocG9seWZpbGxEaXNwbGF5cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuYXRpdmVEaXNwbGF5cy5sZW5ndGggPiAwID8gbmF0aXZlRGlzcGxheXMgOiBwb2x5ZmlsbERpc3BsYXlzO1xuICAgIH1cbiAgfSk7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5nZXRWUkRldmljZXMgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS53YXJuKCdnZXRWUkRldmljZXMgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVwZGF0ZSB5b3VyIGNvZGUgdG8gdXNlIGdldFZSRGlzcGxheXMgaW5zdGVhZC4nKTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghc2VsZi5kZXZpY2VzUG9wdWxhdGVkKSB7XG4gICAgICAgIGlmIChzZWxmLm5hdGl2ZVdlYlZSQXZhaWxhYmxlKSB7XG4gICAgICAgICAgcmV0dXJuIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKGZ1bmN0aW9uKGRpc3BsYXlzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpc3BsYXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgIHNlbGYuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlITUREZXZpY2UoZGlzcGxheXNbaV0pKTtcbiAgICAgICAgICAgICAgc2VsZi5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKGRpc3BsYXlzW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLmRldmljZXNQb3B1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZShzZWxmLmRldmljZXMpO1xuICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5uYXRpdmVMZWdhY3lXZWJWUkF2YWlsYWJsZSkge1xuICAgICAgICAgIHJldHVybiAobmF2aWdhdG9yLmdldFZSRERldmljZXMgfHwgbmF2aWdhdG9yLm1vekdldFZSRGV2aWNlcykoZnVuY3Rpb24oZGV2aWNlcykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXZpY2VzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgIGlmIChkZXZpY2VzW2ldIGluc3RhbmNlb2YgSE1EVlJEZXZpY2UpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmRldmljZXMucHVzaChkZXZpY2VzW2ldKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoZGV2aWNlc1tpXSBpbnN0YW5jZW9mIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmRldmljZXMucHVzaChkZXZpY2VzW2ldKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5kZXZpY2VzUG9wdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUoc2VsZi5kZXZpY2VzKTtcbiAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNlbGYucG9wdWxhdGVEZXZpY2VzKCk7XG4gICAgICByZXNvbHZlKHNlbGYuZGV2aWNlcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmVqZWN0KGUpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5OYXRpdmVWUkZyYW1lRGF0YSA9IHdpbmRvdy5WUkZyYW1lRGF0YTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgYSBkZXZpY2UgaXMgbW9iaWxlLlxuICovXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5pc01vYmlsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gL0FuZHJvaWQvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpIHx8XG4gICAgICAvaVBob25lfGlQYWR8aVBvZC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5pc0NhcmRib2FyZENvbXBhdGlibGUgPSBmdW5jdGlvbigpIHtcbiAgLy8gRm9yIG5vdywgc3VwcG9ydCBhbGwgaU9TIGFuZCBBbmRyb2lkIGRldmljZXMuXG4gIC8vIEFsc28gZW5hYmxlIHRoZSBXZWJWUkNvbmZpZy5GT1JDRV9WUiBmbGFnIGZvciBkZWJ1Z2dpbmcuXG4gIHJldHVybiB0aGlzLmlzTW9iaWxlKCkgfHwgd2luZG93LldlYlZSQ29uZmlnLkZPUkNFX0VOQUJMRV9WUjtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzRnVsbFNjcmVlbkF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKGRvY3VtZW50LmZ1bGxzY3JlZW5FbmFibGVkIHx8XG4gICAgICAgICAgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVuYWJsZWQgfHxcbiAgICAgICAgICBkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRW5hYmxlZCB8fFxuICAgICAgICAgIGZhbHNlKTtcbn07XG5cbi8vIEluc3RhbGxzIGEgc2hpbSB0aGF0IHVwZGF0ZXMgYSBXZWJWUiAxLjAgc3BlYyBpbXBsZW1lbnRhdGlvbiB0byBXZWJWUiAxLjFcbmZ1bmN0aW9uIEluc3RhbGxXZWJWUlNwZWNTaGltKCkge1xuICBpZiAoJ1ZSRGlzcGxheScgaW4gd2luZG93ICYmICEoJ1ZSRnJhbWVEYXRhJyBpbiB3aW5kb3cpKSB7XG4gICAgLy8gUHJvdmlkZSB0aGUgVlJGcmFtZURhdGEgb2JqZWN0LlxuICAgIHdpbmRvdy5WUkZyYW1lRGF0YSA9IFZSRnJhbWVEYXRhO1xuXG4gICAgLy8gQSBsb3Qgb2YgQ2hyb21lIGJ1aWxkcyBkb24ndCBoYXZlIGRlcHRoTmVhciBhbmQgZGVwdGhGYXIsIGV2ZW5cbiAgICAvLyB0aG91Z2ggdGhleSdyZSBpbiB0aGUgV2ViVlIgMS4wIHNwZWMuIFBhdGNoIHRoZW0gaW4gaWYgdGhleSdyZSBub3QgcHJlc2VudC5cbiAgICBpZighKCdkZXB0aE5lYXInIGluIHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlKSkge1xuICAgICAgd2luZG93LlZSRGlzcGxheS5wcm90b3R5cGUuZGVwdGhOZWFyID0gMC4wMTtcbiAgICB9XG5cbiAgICBpZighKCdkZXB0aEZhcicgaW4gd2luZG93LlZSRGlzcGxheS5wcm90b3R5cGUpKSB7XG4gICAgICB3aW5kb3cuVlJEaXNwbGF5LnByb3RvdHlwZS5kZXB0aEZhciA9IDEwMDAwLjA7XG4gICAgfVxuXG4gICAgd2luZG93LlZSRGlzcGxheS5wcm90b3R5cGUuZ2V0RnJhbWVEYXRhID0gZnVuY3Rpb24oZnJhbWVEYXRhKSB7XG4gICAgICByZXR1cm4gVXRpbC5mcmFtZURhdGFGcm9tUG9zZShmcmFtZURhdGEsIHRoaXMuZ2V0UG9zZSgpLCB0aGlzKTtcbiAgICB9XG4gIH1cbn07XG5cbldlYlZSUG9seWZpbGwuSW5zdGFsbFdlYlZSU3BlY1NoaW0gPSBJbnN0YWxsV2ViVlJTcGVjU2hpbTtcbldlYlZSUG9seWZpbGwudmVyc2lvbiA9IHZlcnNpb247XG5cbm1vZHVsZS5leHBvcnRzLldlYlZSUG9seWZpbGwgPSBXZWJWUlBvbHlmaWxsO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IE1lbnVSZW5kZXJlciBmcm9tICcuL3JlbmRlcmVyLmpzJztcblxubGV0IHJlbmRlcmVyO1xubGV0IHZyRGlzcGxheTtcblxuZnVuY3Rpb24gb25Mb2FkKCkge1xuICByZW5kZXJlciA9IG5ldyBNZW51UmVuZGVyZXIoKTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4geyByZW5kZXJlci5yZXNpemUoKSB9KTtcblxuICBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cygpLnRoZW4oZnVuY3Rpb24oZGlzcGxheXMpIHtcbiAgICBpZiAoZGlzcGxheXMubGVuZ3RoID4gMCkge1xuICAgICAgdnJEaXNwbGF5ID0gZGlzcGxheXNbMF07XG4gICAgICB2ckRpc3BsYXkucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKCkge1xuICByZW5kZXJlci5yZW5kZXIoKTtcblxuICB2ckRpc3BsYXkucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG59XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgb25Mb2FkKTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBXZWJWUk1hbmFnZXIgZnJvbSAnd2VidnItYm9pbGVycGxhdGUnXG5pbXBvcnQgV2ViVlJQb2x5ZmlsbCBmcm9tICd3ZWJ2ci1wb2x5ZmlsbCdcbmltcG9ydCBSYXlJbnB1dCBmcm9tICcuLi9yYXktaW5wdXQnXG5cbmNvbnN0IFdJRFRIID0gMTtcbmNvbnN0IEhFSUdIVCA9IDE7XG5jb25zdCBERUZBVUxUX0NPTE9SID0gbmV3IFRIUkVFLkNvbG9yKDB4MDBGRjAwKTtcbmNvbnN0IEhJR0hMSUdIVF9DT0xPUiA9IG5ldyBUSFJFRS5Db2xvcigweDFFOTBGRik7XG5jb25zdCBBQ1RJVkVfQ09MT1IgPSBuZXcgVEhSRUUuQ29sb3IoMHhGRjMzMzMpO1xuXG4vKipcbiAqIFJlbmRlcnMgYSBtZW51IG9mIGl0ZW1zIHRoYXQgY2FuIGJlIGludGVyYWN0ZWQgd2l0aC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWVudVJlbmRlcmVyIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBsZXQgd29ybGQsIHByb2plY3RvciwgYm94U2hhcGUsIGJveEJvZHk7XG4gICAgY29uc3QgZHQgPSAxIC8gNjA7XG4gICAgbGV0IGNvbnN0cmFpbnREb3duID0gZmFsc2U7XG4gICAgbGV0IGpvaW50Qm9keSwgY29uc3RyYWluZWRCb2R5LCBtb3VzZUNvbnN0cmFpbnQ7XG4gICAgY29uc3QgTiA9IDE7XG4gICAgbGV0IGNsaWNrTWFya2VyID0gZmFsc2U7XG4gICAgbGV0IGdlb21ldHJ5LCBtYXRlcmlhbCwgbWVzaDtcbiAgICAvLyBUbyBiZSBzeW5jZWRcbiAgICBsZXQgbWVzaGVzID0gW10sIGJvZGllcyA9IFtdO1xuXG4gICAgLy8gU2V0dXAgb3VyIHdvcmxkXG4gICAgd29ybGQgPSBuZXcgQ0FOTk9OLldvcmxkKCk7XG4gICAgd29ybGQucXVhdE5vcm1hbGl6ZVNraXAgPSAwO1xuICAgIHdvcmxkLnF1YXROb3JtYWxpemVGYXN0ID0gZmFsc2U7XG5cbiAgICB3b3JsZC5ncmF2aXR5LnNldCgwLC00LDApO1xuICAgIHdvcmxkLmJyb2FkcGhhc2UgPSBuZXcgQ0FOTk9OLk5haXZlQnJvYWRwaGFzZSgpO1xuXG4gICAgLy8gQ3JlYXRlIGJveGVzXG4gICAgY29uc3QgbWFzcyA9IDUsIHJhZGl1cyA9IDEuMztcbiAgICBib3hTaGFwZSA9IG5ldyBDQU5OT04uQm94KG5ldyBDQU5OT04uVmVjMygwLjUsMC41LDAuNSkpO1xuICAgIGZvcihsZXQgaT0wOyBpPE47IGkrKyl7XG4gICAgICBib3hCb2R5ID0gbmV3IENBTk5PTi5Cb2R5KHsgbWFzczogbWFzcyB9KTtcbiAgICAgIGJveEJvZHkuYWRkU2hhcGUoYm94U2hhcGUpO1xuICAgICAgYm94Qm9keS5wb3NpdGlvbi5zZXQoLTcsNSwwKTtcbiAgICAgIHdvcmxkLmFkZEJvZHkoYm94Qm9keSk7XG4gICAgICBib2RpZXMucHVzaChib3hCb2R5KTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYSBwbGFuZVxuICAgIGxldCBncm91bmRTaGFwZSA9IG5ldyBDQU5OT04uUGxhbmUoKTtcbiAgICBsZXQgZ3JvdW5kQm9keSA9IG5ldyBDQU5OT04uQm9keSh7IG1hc3M6IDAgfSk7XG4gICAgZ3JvdW5kQm9keS5hZGRTaGFwZShncm91bmRTaGFwZSk7XG4gICAgZ3JvdW5kQm9keS5xdWF0ZXJuaW9uLnNldEZyb21BeGlzQW5nbGUobmV3IENBTk5PTi5WZWMzKDEsMCwwKSwtTWF0aC5QSS8yKTtcbiAgICB3b3JsZC5hZGRCb2R5KGdyb3VuZEJvZHkpO1xuXG4gICAgLy8gSm9pbnQgYm9keVxuICAgIGxldCBzaGFwZSA9IG5ldyBDQU5OT04uU3BoZXJlKDAuMSk7XG4gICAgam9pbnRCb2R5ID0gbmV3IENBTk5PTi5Cb2R5KHsgbWFzczogMCB9KTtcbiAgICBqb2ludEJvZHkuYWRkU2hhcGUoc2hhcGUpO1xuICAgIGpvaW50Qm9keS5jb2xsaXNpb25GaWx0ZXJHcm91cCA9IDA7XG4gICAgam9pbnRCb2R5LmNvbGxpc2lvbkZpbHRlck1hc2sgPSAwO1xuICAgIHdvcmxkLmFkZEJvZHkoam9pbnRCb2R5KTtcblxuICAgIC8vIHByb2plY3RvciA9IG5ldyBUSFJFRS5Qcm9qZWN0b3IoKTtcblxuICAgIGxldCBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICAgIHNjZW5lLmZvZyA9IG5ldyBUSFJFRS5Gb2coIDB4MDAwMDAwLCA1MDAsIDEwMDAwICk7XG5cbiAgICBsZXQgYXNwZWN0ID0gd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgbGV0IGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg3NSwgYXNwZWN0LCAwLjEsIDEwMCk7XG4gICAgc2NlbmUuYWRkKGNhbWVyYSk7XG5cbiAgICBsZXQgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7IGFudGlhbGlhczogdHJ1ZSB9KTtcbiAgICByZW5kZXJlci5zZXRDbGVhckNvbG9yKCBzY2VuZS5mb2cuY29sb3IgKTtcbiAgICAvLyByZW5kZXJlci5zZXRQaXhlbFJhdGlvKCB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyApXG4gICAgcmVuZGVyZXIuc2V0U2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgICAvLyByZW5kZXJlci5zZXRTaXplKCB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0ICk7XG4gICAgLy8gY29udGFpbmVyLmFwcGVuZENoaWxkKCByZW5kZXJlci5kb21FbGVtZW50ICk7XG5cbiAgICAvLyByZW5kZXJlci52ci5lbmFibGVkID0gdHJ1ZTtcblxuICAgIGxldCBlZmZlY3QgPSBuZXcgVEhSRUUuVlJFZmZlY3QocmVuZGVyZXIpO1xuICAgIGxldCBjb250cm9scyA9IG5ldyBUSFJFRS5WUkNvbnRyb2xzKGNhbWVyYSk7XG4gICAgY29udHJvbHMuc3RhbmRpbmcgPSB0cnVlO1xuXG4gICAgbGV0IG1hbmFnZXIgPSBuZXcgV2ViVlJNYW5hZ2VyKHJlbmRlcmVyLCBlZmZlY3QpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgICAvLyBJbnB1dCBtYW5hZ2VyLlxuICAgIGxldCByYXlJbnB1dCA9IG5ldyBSYXlJbnB1dChjYW1lcmEpO1xuICAgIHJheUlucHV0LnNldFNpemUocmVuZGVyZXIuZ2V0U2l6ZSgpKTtcbiAgICByYXlJbnB1dC5vbigncmF5ZG93bicsIChvcHRfbWVzaCkgPT4geyB0aGlzLmhhbmRsZVJheURvd25fKG9wdF9tZXNoKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5ZHJhZycsIChvcHRfbWVzaCkgPT4geyB0aGlzLmhhbmRsZVJheURyYWdfKCkgfSk7XG4gICAgcmF5SW5wdXQub24oJ3JheXVwJywgKG9wdF9tZXNoKSA9PiB7IHRoaXMuaGFuZGxlUmF5VXBfKG9wdF9tZXNoKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5Y2FuY2VsJywgKG9wdF9tZXNoKSA9PiB7IHRoaXMuaGFuZGxlUmF5Q2FuY2VsXyhvcHRfbWVzaCkgfSk7XG4gICAgcmF5SW5wdXQub24oJ3JheW92ZXInLCAobWVzaCkgPT4geyB0aGlzLnNldFNlbGVjdGVkXyhtZXNoLCB0cnVlKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5b3V0JywgKG1lc2gpID0+IHsgdGhpcy5zZXRTZWxlY3RlZF8obWVzaCwgZmFsc2UpIH0pO1xuXG4gICAgLy8gQWRkIHRoZSByYXkgaW5wdXQgbWVzaCB0byB0aGUgc2NlbmUuXG4gICAgc2NlbmUuYWRkKHJheUlucHV0LmdldE1lc2goKSk7XG5cbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuICAgIHRoaXMuc2NlbmUgPSBzY2VuZTtcbiAgICB0aGlzLmNvbnRyb2xzID0gY29udHJvbHM7XG4gICAgdGhpcy5yYXlJbnB1dCA9IHJheUlucHV0O1xuICAgIHRoaXMuZWZmZWN0ID0gZWZmZWN0O1xuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgdGhpcy5kdCA9IGR0O1xuICAgIHRoaXMubWVzaGVzID0gbWVzaGVzO1xuICAgIHRoaXMuYm9kaWVzID0gYm9kaWVzO1xuICAgIHRoaXMuY2xpY2tNYXJrZXIgPSBjbGlja01hcmtlcjtcbiAgICB0aGlzLmNvbnN0cmFpbnREb3duID0gY29uc3RyYWludERvd247XG4gICAgdGhpcy5jb25zdHJhaW5lZEJvZHkgPSBjb25zdHJhaW5lZEJvZHk7XG4gICAgdGhpcy5tb3VzZUNvbnN0cmFpbnQgPSBtb3VzZUNvbnN0cmFpbnQ7XG4gICAgdGhpcy5qb2ludEJvZHkgPSBqb2ludEJvZHk7XG5cbiAgICAvLyBsaWdodHNcbiAgICBsZXQgbGlnaHQsIG1hdGVyaWFscztcbiAgICBzY2VuZS5hZGQoIG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoIDB4NjY2NjY2ICkgKTtcblxuICAgIGxpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoIDB4ZmZmZmZmLCAxLjc1ICk7XG4gICAgY29uc3QgZCA9IDIwO1xuXG4gICAgbGlnaHQucG9zaXRpb24uc2V0KCBkLCBkLCBkICk7XG5cbiAgICBsaWdodC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAvL2xpZ2h0LnNoYWRvd0NhbWVyYVZpc2libGUgPSB0cnVlO1xuXG4gICAgbGlnaHQuc2hhZG93TWFwV2lkdGggPSAxMDI0O1xuICAgIGxpZ2h0LnNoYWRvd01hcEhlaWdodCA9IDEwMjQ7XG5cbiAgICBsaWdodC5zaGFkb3dDYW1lcmFMZWZ0ID0gLWQ7XG4gICAgbGlnaHQuc2hhZG93Q2FtZXJhUmlnaHQgPSBkO1xuICAgIGxpZ2h0LnNoYWRvd0NhbWVyYVRvcCA9IGQ7XG4gICAgbGlnaHQuc2hhZG93Q2FtZXJhQm90dG9tID0gLWQ7XG5cbiAgICBsaWdodC5zaGFkb3dDYW1lcmFGYXIgPSAzKmQ7XG4gICAgbGlnaHQuc2hhZG93Q2FtZXJhTmVhciA9IGQ7XG4gICAgbGlnaHQuc2hhZG93RGFya25lc3MgPSAwLjU7XG5cbiAgICBzY2VuZS5hZGQoIGxpZ2h0ICk7XG5cbiAgICAvLyBmbG9vclxuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoIDEwMCwgMTAwLCAxLCAxICk7XG4gICAgLy9nZW9tZXRyeS5hcHBseU1hdHJpeCggbmV3IFRIUkVFLk1hdHJpeDQoKS5tYWtlUm90YXRpb25YKCAtTWF0aC5QSSAvIDIgKSApO1xuICAgIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoIHsgY29sb3I6IDB4Nzc3Nzc3IH0gKTtcbiAgICBsZXQgbWFya2VyTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCggeyBjb2xvcjogMHhmZjAwMDAgfSApO1xuICAgIHRoaXMubWFya2VyTWF0ZXJpYWwgPSBtYXJrZXJNYXRlcmlhbDtcbiAgICAvL1RIUkVFLkNvbG9yVXRpbHMuYWRqdXN0SFNWKCBtYXRlcmlhbC5jb2xvciwgMCwgMCwgMC45ICk7XG4gICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKCBnZW9tZXRyeSwgbWF0ZXJpYWwgKTtcbiAgICBtZXNoLmNhc3RTaGFkb3cgPSB0cnVlO1xuICAgIG1lc2gucXVhdGVybmlvbi5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBUSFJFRS5WZWN0b3IzKDEsMCwwKSwgLU1hdGguUEkgLyAyKTtcbiAgICBtZXNoLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgIG1lc2gucG9zaXRpb24ueSA9IC0wLjE7XG4gICAgc2NlbmUuYWRkKG1lc2gpO1xuXG4gICAgLy8gY3ViZXNcbiAgICB2YXIgY3ViZUdlbyA9IG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSggMSwgMSwgMSwgMTAsIDEwICk7XG4gICAgdmFyIGN1YmVNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCggeyBjb2xvcjogMHgyOWFkODMgfSApO1xuICAgIHZhciBjdWJlTWVzaCwgc3BoZXJlTWVzaDtcbiAgICBmb3IodmFyIGk9MDsgaTxOOyBpKyspe1xuICAgICAgY3ViZU1lc2ggPSBuZXcgVEhSRUUuTWVzaChjdWJlR2VvLCBjdWJlTWF0ZXJpYWwpO1xuICAgICAgY3ViZU1lc2guY2FzdFNoYWRvdyA9IHRydWU7XG4gICAgICB0aGlzLm1lc2hlcy5wdXNoKGN1YmVNZXNoKTtcbiAgICAgIHRoaXMuc2NlbmUuYWRkKGN1YmVNZXNoKTtcbiAgICAgIHJheUlucHV0LmFkZChjdWJlTWVzaCk7XG4gICAgfVxuXG4gICAgLy8gQWRkIGEgZmxvb3IuXG4gICAgLy8gdmFyIGZsb29yID0gdGhpcy5jcmVhdGVGbG9vcl8oKTtcbiAgICAvLyB0aGlzLnNjZW5lLmFkZChmbG9vcik7XG4gIH1cbi8vXG4gIHVwZGF0ZVBoeXNpY3MoKSB7XG4gICAgdGhpcy53b3JsZC5zdGVwKHRoaXMuZHQpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpICE9PSB0aGlzLm1lc2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5tZXNoZXNbaV0ucG9zaXRpb24uY29weSh0aGlzLmJvZGllc1tpXS5wb3NpdGlvbik7XG4gICAgICB0aGlzLm1lc2hlc1tpXS5xdWF0ZXJuaW9uLmNvcHkodGhpcy5ib2RpZXNbaV0ucXVhdGVybmlvbik7XG4gICAgfVxuICB9XG5cblxuICByZW5kZXIoKSB7XG4gICAgdGhpcy5jb250cm9scy51cGRhdGUoKTtcbiAgICB0aGlzLnJheUlucHV0LnVwZGF0ZSgpO1xuICAgIHRoaXMudXBkYXRlUGh5c2ljcygpO1xuICAgIHRoaXMuZWZmZWN0LnJlbmRlcih0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYSk7XG4gIH1cblxuICByZXNpemUoKSB7XG4gICAgdGhpcy5jYW1lcmEuYXNwZWN0ID0gd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgdGhpcy5jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgICB0aGlzLnJheUlucHV0LnNldFNpemUodGhpcy5yZW5kZXJlci5nZXRTaXplKCkpO1xuICB9XG5cbiAgLy8gVE9ETzogaG9lIG9tIHRlIGdhYW4gbWV0IHJheSBtb3ZlP1xuICAvLyBFZXJzdCBjbGljayBtYXJrZW4gZW4gZGFuIHJvdGF0ZSBtZXQgY29udHJvbGxlciBwYWQ/LCBiZXdlZ2VuIG1ldCByYXkgbW92ZT9cbiAgLy8gT2Y6IGNsaWNrIG1hcmtlbiBlbiBkYW4gZHJhZ2dlbiBtZXQgcmF5IG1vdmU/XG4gIC8vICAtLT4gcmF5IGVuZHBvaW50IHZlcnNjaHVpdmVuIG5hYXIgcmV0aWNsZS5wb3NpdGlvblxuXG4gIGhhbmRsZVJheURvd25fKG9wdF9tZXNoKSB7XG4gICAgdGhpcy5zZXRBY3Rpb25fKG9wdF9tZXNoLCB0cnVlKTtcblxuICAgIGxldCBwb3MgPSB0aGlzLnJheUlucHV0LnJlbmRlcmVyLnJldGljbGUucG9zaXRpb247XG4gICAgLy8gY29uc29sZS5sb2coJ1Rlc3Q6ICcgKyBKU09OLnN0cmluZ2lmeSh0aGlzLnJheUlucHV0LnJlbmRlcmVyLnJldGljbGUucG9zaXRpb24pKTtcbiAgICBpZihwb3Mpe1xuICAgICAgdGhpcy5jb25zdHJhaW50RG93biA9IHRydWU7XG4gICAgICAvLyBTZXQgbWFya2VyIG9uIGNvbnRhY3QgcG9pbnRcbiAgICAgIHRoaXMuc2V0Q2xpY2tNYXJrZXIocG9zLngscG9zLnkscG9zLnosdGhpcy5zY2VuZSk7XG5cbiAgICAgIC8vIFNldCB0aGUgbW92ZW1lbnQgcGxhbmVcbiAgICAgIC8vIHNldFNjcmVlblBlcnBDZW50ZXIocG9zLGNhbWVyYSk7XG5cbiAgICAgIGxldCBpZHggPSB0aGlzLm1lc2hlcy5pbmRleE9mKG9wdF9tZXNoKTtcbiAgICAgIGlmKGlkeCAhPT0gLTEpe1xuICAgICAgICB0aGlzLmFkZE1vdXNlQ29uc3RyYWludChwb3MueCxwb3MueSxwb3Mueix0aGlzLmJvZGllc1tpZHhdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVSYXlEcmFnXyhvcHRfbWVzaCkge1xuICAgIC8vIE1vdmUgYW5kIHByb2plY3Qgb24gdGhlIHBsYW5lXG4gICAgaWYgKHRoaXMubW91c2VDb25zdHJhaW50KSB7XG4gICAgICBsZXQgcG9zID0gdGhpcy5yYXlJbnB1dC5yZW5kZXJlci5yZXRpY2xlLnBvc2l0aW9uO1xuICAgICAgaWYocG9zKXtcbiAgICAgICAgdGhpcy5zZXRDbGlja01hcmtlcihwb3MueCxwb3MueSxwb3Mueix0aGlzLnNjZW5lKTtcbiAgICAgICAgdGhpcy5tb3ZlSm9pbnRUb1BvaW50KHBvcy54LHBvcy55LHBvcy56KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVSYXlVcF8ob3B0X21lc2gpIHtcbiAgICB0aGlzLnNldEFjdGlvbl8ob3B0X21lc2gsIGZhbHNlKTtcblxuICAgIHRoaXMuY29uc3RyYWludERvd24gPSBmYWxzZTtcbiAgICAvLyByZW1vdmUgdGhlIG1hcmtlclxuICAgIHRoaXMucmVtb3ZlQ2xpY2tNYXJrZXIoKTtcblxuICAgIC8vIFNlbmQgdGhlIHJlbW92ZSBtb3VzZSBqb2ludCB0byBzZXJ2ZXJcbiAgICB0aGlzLnJlbW92ZUpvaW50Q29uc3RyYWludCgpO1xuICB9XG5cbiAgaGFuZGxlUmF5Q2FuY2VsXyhvcHRfbWVzaCkge1xuICAgIHRoaXMuc2V0QWN0aW9uXyhvcHRfbWVzaCwgZmFsc2UpO1xuICB9XG5cbiAgc2V0U2VsZWN0ZWRfKG1lc2gsIGlzU2VsZWN0ZWQpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdzZXRTZWxlY3RlZF8nLCBpc1NlbGVjdGVkKTtcbiAgICBsZXQgbmV3Q29sb3IgPSBpc1NlbGVjdGVkID8gSElHSExJR0hUX0NPTE9SIDogREVGQVVMVF9DT0xPUjtcbiAgICBtZXNoLm1hdGVyaWFsLmNvbG9yID0gbmV3Q29sb3I7XG4gIH1cblxuICBzZXRBY3Rpb25fKG9wdF9tZXNoLCBpc0FjdGl2ZSkge1xuICAgIC8vY29uc29sZS5sb2coJ3NldEFjdGlvbl8nLCAhIW9wdF9tZXNoLCBpc0FjdGl2ZSk7XG4gICAgaWYgKG9wdF9tZXNoKSB7XG4gICAgICBsZXQgbmV3Q29sb3IgPSBpc0FjdGl2ZSA/IEFDVElWRV9DT0xPUiA6IEhJR0hMSUdIVF9DT0xPUjtcbiAgICAgIG9wdF9tZXNoLm1hdGVyaWFsLmNvbG9yID0gbmV3Q29sb3I7XG4gICAgICBpZiAoIWlzQWN0aXZlKSB7XG4gICAgICAgIG9wdF9tZXNoLm1hdGVyaWFsLndpcmVmcmFtZSA9ICFvcHRfbWVzaC5tYXRlcmlhbC53aXJlZnJhbWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0Q2xpY2tNYXJrZXIoeCx5LHopIHtcbiAgICBpZighdGhpcy5jbGlja01hcmtlcil7XG4gICAgICBjb25zdCBzaGFwZSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSgwLjIsIDgsIDgpO1xuICAgICAgdGhpcy5jbGlja01hcmtlciA9IG5ldyBUSFJFRS5NZXNoKHNoYXBlLCB0aGlzLm1hcmtlck1hdGVyaWFsKTtcbiAgICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuY2xpY2tNYXJrZXIpO1xuICAgIH1cbiAgICB0aGlzLmNsaWNrTWFya2VyLnZpc2libGUgPSB0cnVlO1xuICAgIHRoaXMuY2xpY2tNYXJrZXIucG9zaXRpb24uc2V0KHgseSx6KTtcbiAgfVxuXG4gIHJlbW92ZUNsaWNrTWFya2VyKCl7XG4gICAgdGhpcy5jbGlja01hcmtlci52aXNpYmxlID0gZmFsc2U7XG4gIH1cblxuICBhZGRNb3VzZUNvbnN0cmFpbnQoeCx5LHosYm9keSkge1xuICAgIC8vIFRoZSBjYW5ub24gYm9keSBjb25zdHJhaW5lZCBieSB0aGUgbW91c2Ugam9pbnRcbiAgICB0aGlzLmNvbnN0cmFpbmVkQm9keSA9IGJvZHk7XG5cbiAgICAvLyBWZWN0b3IgdG8gdGhlIGNsaWNrZWQgcG9pbnQsIHJlbGF0aXZlIHRvIHRoZSBib2R5XG4gICAgbGV0IHYxID0gbmV3IENBTk5PTi5WZWMzKHgseSx6KS52c3ViKHRoaXMuY29uc3RyYWluZWRCb2R5LnBvc2l0aW9uKTtcblxuICAgIC8vIEFwcGx5IGFudGktcXVhdGVybmlvbiB0byB2ZWN0b3IgdG8gdHJhbnNmb3JtIGl0IGludG8gdGhlIGxvY2FsIGJvZHkgY29vcmRpbmF0ZSBzeXN0ZW1cbiAgICBsZXQgYW50aVJvdCA9IHRoaXMuY29uc3RyYWluZWRCb2R5LnF1YXRlcm5pb24uaW52ZXJzZSgpO1xuICAgIGxldCBwaXZvdCA9IG5ldyBDQU5OT04uUXVhdGVybmlvbihhbnRpUm90LngsIGFudGlSb3QueSwgYW50aVJvdC56LCBhbnRpUm90LncpLnZtdWx0KHYxKTsgLy8gcGl2b3QgaXMgbm90IGluIGxvY2FsIGJvZHkgY29vcmRpbmF0ZXNcblxuICAgIC8vIE1vdmUgdGhlIGNhbm5vbiBjbGljayBtYXJrZXIgcGFydGljbGUgdG8gdGhlIGNsaWNrIHBvc2l0aW9uXG4gICAgdGhpcy5qb2ludEJvZHkucG9zaXRpb24uc2V0KHgseSx6KTtcblxuICAgIC8vIENyZWF0ZSBhIG5ldyBjb25zdHJhaW50XG4gICAgLy8gVGhlIHBpdm90IGZvciB0aGUgam9pbnRCb2R5IGlzIHplcm9cbiAgICB0aGlzLm1vdXNlQ29uc3RyYWludCA9IG5ldyBDQU5OT04uUG9pbnRUb1BvaW50Q29uc3RyYWludCh0aGlzLmNvbnN0cmFpbmVkQm9keSwgcGl2b3QsIHRoaXMuam9pbnRCb2R5LCBuZXcgQ0FOTk9OLlZlYzMoMCwwLDApKTtcblxuICAgIC8vIEFkZCB0aGUgY29uc3RyaWFudCB0byB3b3JsZFxuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludCh0aGlzLm1vdXNlQ29uc3RyYWludCk7XG4gIH1cblxuICAvLyBUaGlzIGZ1bmN0aW9uIG1vdmVzIHRoZSB0cmFuc3BhcmVudCBqb2ludCBib2R5IHRvIGEgbmV3IHBvc2l0aW9uIGluIHNwYWNlXG4gIG1vdmVKb2ludFRvUG9pbnQoeCx5LHopIHtcbiAgICAvLyBNb3ZlIHRoZSBqb2ludCBib2R5IHRvIGEgbmV3IHBvc2l0aW9uXG4gICAgdGhpcy5qb2ludEJvZHkucG9zaXRpb24uc2V0KHgseSx6KTtcbiAgICB0aGlzLm1vdXNlQ29uc3RyYWludC51cGRhdGUoKTtcbiAgfVxuXG4gIHJlbW92ZUpvaW50Q29uc3RyYWludCgpe1xuICAgIC8vIFJlbW92ZSBjb25zdHJhaW50IGZyb20gd29ybGRcbiAgICB0aGlzLndvcmxkLnJlbW92ZUNvbnN0cmFpbnQodGhpcy5tb3VzZUNvbnN0cmFpbnQpO1xuICAgIHRoaXMubW91c2VDb25zdHJhaW50ID0gZmFsc2U7XG4gIH1cblxuICBjcmVhdGVGbG9vcl8oKSB7XG4gICAgdmFyIGJveFNpemUgPSAxMDtcbiAgICB2YXIgbG9hZGVyID0gbmV3IFRIUkVFLlRleHR1cmVMb2FkZXIoKTtcbiAgICBsb2FkZXIubG9hZCgnaW1nL2JveC5wbmcnLCBvblRleHR1cmVMb2FkZWQpO1xuICAgIHZhciBvdXQgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICAgIGZ1bmN0aW9uIG9uVGV4dHVyZUxvYWRlZCh0ZXh0dXJlKSB7XG4gICAgICB0ZXh0dXJlLndyYXBTID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gICAgICB0ZXh0dXJlLndyYXBUID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gICAgICB0ZXh0dXJlLnJlcGVhdC5zZXQoYm94U2l6ZSwgYm94U2l6ZSk7XG5cbiAgICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5Cb3hHZW9tZXRyeShib3hTaXplLCBib3hTaXplLCBib3hTaXplKTtcbiAgICAgIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgIG1hcDogdGV4dHVyZSxcbiAgICAgICAgY29sb3I6IDB4MDE1NTAwLFxuICAgICAgICBzaWRlOiBUSFJFRS5CYWNrU2lkZVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEFsaWduIHRoZSBza3lib3ggdG8gdGhlIGZsb29yICh3aGljaCBpcyBhdCB5PTApLlxuICAgICAgbGV0IHNreWJveCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gICAgICBza3lib3gucG9zaXRpb24ueSA9IGJveFNpemUvMjtcblxuICAgICAgb3V0LmFkZChza3lib3gpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5jb25zdCBIRUFEX0VMQk9XX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAuMTU1LCAtMC40NjUsIC0wLjE1KTtcbmNvbnN0IEVMQk9XX1dSSVNUX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0wLjI1KTtcbmNvbnN0IFdSSVNUX0NPTlRST0xMRVJfT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMC4wNSk7XG5jb25zdCBBUk1fRVhURU5TSU9OX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKC0wLjA4LCAwLjE0LCAwLjA4KTtcblxuY29uc3QgRUxCT1dfQkVORF9SQVRJTyA9IDAuNDsgLy8gNDAlIGVsYm93LCA2MCUgd3Jpc3QuXG5jb25zdCBFWFRFTlNJT05fUkFUSU9fV0VJR0hUID0gMC40O1xuXG5jb25zdCBNSU5fQU5HVUxBUl9TUEVFRCA9IDAuNjE7IC8vIDM1IGRlZ3JlZXMgcGVyIHNlY29uZCAoaW4gcmFkaWFucykuXG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgYXJtIG1vZGVsIGZvciB0aGUgRGF5ZHJlYW0gY29udHJvbGxlci4gRmVlZCBpdCBhIGNhbWVyYSBhbmRcbiAqIHRoZSBjb250cm9sbGVyLiBVcGRhdGUgaXQgb24gYSBSQUYuXG4gKlxuICogR2V0IHRoZSBtb2RlbCdzIHBvc2UgdXNpbmcgZ2V0UG9zZSgpLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPcmllbnRhdGlvbkFybU1vZGVsIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBmYWxzZTtcblxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIGNvbnRyb2xsZXIgb3JpZW50YXRpb25zLlxuICAgIHRoaXMuY29udHJvbGxlclEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHRoaXMubGFzdENvbnRyb2xsZXJRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIGhlYWQgb3JpZW50YXRpb25zLlxuICAgIHRoaXMuaGVhZFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgLy8gQ3VycmVudCBoZWFkIHBvc2l0aW9uLlxuICAgIHRoaXMuaGVhZFBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICAvLyBQb3NpdGlvbnMgb2Ygb3RoZXIgam9pbnRzIChtb3N0bHkgZm9yIGRlYnVnZ2luZykuXG4gICAgdGhpcy5lbGJvd1BvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgdGhpcy53cmlzdFBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyB0aW1lcyB0aGUgbW9kZWwgd2FzIHVwZGF0ZWQuXG4gICAgdGhpcy50aW1lID0gbnVsbDtcbiAgICB0aGlzLmxhc3RUaW1lID0gbnVsbDtcblxuICAgIC8vIFJvb3Qgcm90YXRpb24uXG4gICAgdGhpcy5yb290USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAvLyBDdXJyZW50IHBvc2UgdGhhdCB0aGlzIGFybSBtb2RlbCBjYWxjdWxhdGVzLlxuICAgIHRoaXMucG9zZSA9IHtcbiAgICAgIG9yaWVudGF0aW9uOiBuZXcgVEhSRUUuUXVhdGVybmlvbigpLFxuICAgICAgcG9zaXRpb246IG5ldyBUSFJFRS5WZWN0b3IzKClcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIE1ldGhvZHMgdG8gc2V0IGNvbnRyb2xsZXIgYW5kIGhlYWQgcG9zZSAoaW4gd29ybGQgY29vcmRpbmF0ZXMpLlxuICAgKi9cbiAgc2V0Q29udHJvbGxlck9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLmxhc3RDb250cm9sbGVyUS5jb3B5KHRoaXMuY29udHJvbGxlclEpO1xuICAgIHRoaXMuY29udHJvbGxlclEuY29weShxdWF0ZXJuaW9uKTtcbiAgfVxuXG4gIHNldEhlYWRPcmllbnRhdGlvbihxdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5oZWFkUS5jb3B5KHF1YXRlcm5pb24pO1xuICB9XG5cbiAgc2V0SGVhZFBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgdGhpcy5oZWFkUG9zLmNvcHkocG9zaXRpb24pO1xuICB9XG5cbiAgc2V0TGVmdEhhbmRlZChpc0xlZnRIYW5kZWQpIHtcbiAgICAvLyBUT0RPKHNtdXMpOiBJbXBsZW1lbnQgbWUhXG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBpc0xlZnRIYW5kZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIG9uIGEgUkFGLlxuICAgKi9cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMudGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgLy8gSWYgdGhlIGNvbnRyb2xsZXIncyBhbmd1bGFyIHZlbG9jaXR5IGlzIGFib3ZlIGEgY2VydGFpbiBhbW91bnQsIHdlIGNhblxuICAgIC8vIGFzc3VtZSB0b3JzbyByb3RhdGlvbiBhbmQgbW92ZSB0aGUgZWxib3cgam9pbnQgcmVsYXRpdmUgdG8gdGhlXG4gICAgLy8gY2FtZXJhIG9yaWVudGF0aW9uLlxuICAgIGxldCBoZWFkWWF3USA9IHRoaXMuZ2V0SGVhZFlhd09yaWVudGF0aW9uXygpO1xuICAgIGxldCB0aW1lRGVsdGEgPSAodGhpcy50aW1lIC0gdGhpcy5sYXN0VGltZSkgLyAxMDAwO1xuICAgIGxldCBhbmdsZURlbHRhID0gdGhpcy5xdWF0QW5nbGVfKHRoaXMubGFzdENvbnRyb2xsZXJRLCB0aGlzLmNvbnRyb2xsZXJRKTtcbiAgICBsZXQgY29udHJvbGxlckFuZ3VsYXJTcGVlZCA9IGFuZ2xlRGVsdGEgLyB0aW1lRGVsdGE7XG4gICAgaWYgKGNvbnRyb2xsZXJBbmd1bGFyU3BlZWQgPiBNSU5fQU5HVUxBUl9TUEVFRCkge1xuICAgICAgLy8gQXR0ZW51YXRlIHRoZSBSb290IHJvdGF0aW9uIHNsaWdodGx5LlxuICAgICAgdGhpcy5yb290US5zbGVycChoZWFkWWF3USwgYW5nbGVEZWx0YSAvIDEwKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJvb3RRLmNvcHkoaGVhZFlhd1EpO1xuICAgIH1cblxuICAgIC8vIFdlIHdhbnQgdG8gbW92ZSB0aGUgZWxib3cgdXAgYW5kIHRvIHRoZSBjZW50ZXIgYXMgdGhlIHVzZXIgcG9pbnRzIHRoZVxuICAgIC8vIGNvbnRyb2xsZXIgdXB3YXJkcywgc28gdGhhdCB0aGV5IGNhbiBlYXNpbHkgc2VlIHRoZSBjb250cm9sbGVyIGFuZCBpdHNcbiAgICAvLyB0b29sIHRpcHMuXG4gICAgbGV0IGNvbnRyb2xsZXJFdWxlciA9IG5ldyBUSFJFRS5FdWxlcigpLnNldEZyb21RdWF0ZXJuaW9uKHRoaXMuY29udHJvbGxlclEsICdZWFonKTtcbiAgICBsZXQgY29udHJvbGxlclhEZWcgPSBUSFJFRS5NYXRoLnJhZFRvRGVnKGNvbnRyb2xsZXJFdWxlci54KTtcbiAgICBsZXQgZXh0ZW5zaW9uUmF0aW8gPSB0aGlzLmNsYW1wXygoY29udHJvbGxlclhEZWcgLSAxMSkgLyAoNTAgLSAxMSksIDAsIDEpO1xuXG4gICAgLy8gQ29udHJvbGxlciBvcmllbnRhdGlvbiBpbiBjYW1lcmEgc3BhY2UuXG4gICAgbGV0IGNvbnRyb2xsZXJDYW1lcmFRID0gdGhpcy5yb290US5jbG9uZSgpLmludmVyc2UoKTtcbiAgICBjb250cm9sbGVyQ2FtZXJhUS5tdWx0aXBseSh0aGlzLmNvbnRyb2xsZXJRKTtcblxuICAgIC8vIENhbGN1bGF0ZSBlbGJvdyBwb3NpdGlvbi5cbiAgICBsZXQgZWxib3dQb3MgPSB0aGlzLmVsYm93UG9zO1xuICAgIGVsYm93UG9zLmNvcHkodGhpcy5oZWFkUG9zKS5hZGQoSEVBRF9FTEJPV19PRkZTRVQpO1xuICAgIGxldCBlbGJvd09mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShBUk1fRVhURU5TSU9OX09GRlNFVCk7XG4gICAgZWxib3dPZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xuICAgIGVsYm93UG9zLmFkZChlbGJvd09mZnNldCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgam9pbnQgYW5nbGVzLiBHZW5lcmFsbHkgNDAlIG9mIHJvdGF0aW9uIGFwcGxpZWQgdG8gZWxib3csIDYwJVxuICAgIC8vIHRvIHdyaXN0LCBidXQgaWYgY29udHJvbGxlciBpcyByYWlzZWQgaGlnaGVyLCBtb3JlIHJvdGF0aW9uIGNvbWVzIGZyb21cbiAgICAvLyB0aGUgd3Jpc3QuXG4gICAgbGV0IHRvdGFsQW5nbGUgPSB0aGlzLnF1YXRBbmdsZV8oY29udHJvbGxlckNhbWVyYVEsIG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkpO1xuICAgIGxldCB0b3RhbEFuZ2xlRGVnID0gVEhSRUUuTWF0aC5yYWRUb0RlZyh0b3RhbEFuZ2xlKTtcbiAgICBsZXQgbGVycFN1cHByZXNzaW9uID0gMSAtIE1hdGgucG93KHRvdGFsQW5nbGVEZWcgLyAxODAsIDQpOyAvLyBUT0RPKHNtdXMpOiA/Pz9cblxuICAgIGxldCBlbGJvd1JhdGlvID0gRUxCT1dfQkVORF9SQVRJTztcbiAgICBsZXQgd3Jpc3RSYXRpbyA9IDEgLSBFTEJPV19CRU5EX1JBVElPO1xuICAgIGxldCBsZXJwVmFsdWUgPSBsZXJwU3VwcHJlc3Npb24gKlxuICAgICAgICAoZWxib3dSYXRpbyArIHdyaXN0UmF0aW8gKiBleHRlbnNpb25SYXRpbyAqIEVYVEVOU0lPTl9SQVRJT19XRUlHSFQpO1xuXG4gICAgbGV0IHdyaXN0USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2xlcnAoY29udHJvbGxlckNhbWVyYVEsIGxlcnBWYWx1ZSk7XG4gICAgbGV0IGludldyaXN0USA9IHdyaXN0US5pbnZlcnNlKCk7XG4gICAgbGV0IGVsYm93USA9IGNvbnRyb2xsZXJDYW1lcmFRLmNsb25lKCkubXVsdGlwbHkoaW52V3Jpc3RRKTtcblxuICAgIC8vIENhbGN1bGF0ZSBvdXIgZmluYWwgY29udHJvbGxlciBwb3NpdGlvbiBiYXNlZCBvbiBhbGwgb3VyIGpvaW50IHJvdGF0aW9uc1xuICAgIC8vIGFuZCBsZW5ndGhzLlxuICAgIC8qXG4gICAgcG9zaXRpb25fID1cbiAgICAgIHJvb3Rfcm90XyAqIChcbiAgICAgICAgY29udHJvbGxlcl9yb290X29mZnNldF8gK1xuMjogICAgICAoYXJtX2V4dGVuc2lvbl8gKiBhbXRfZXh0ZW5zaW9uKSArXG4xOiAgICAgIGVsYm93X3JvdCAqIChrQ29udHJvbGxlckZvcmVhcm0gKyAod3Jpc3Rfcm90ICoga0NvbnRyb2xsZXJQb3NpdGlvbikpXG4gICAgICApO1xuICAgICovXG4gICAgbGV0IHdyaXN0UG9zID0gdGhpcy53cmlzdFBvcztcbiAgICB3cmlzdFBvcy5jb3B5KFdSSVNUX0NPTlRST0xMRVJfT0ZGU0VUKTtcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24od3Jpc3RRKTtcbiAgICB3cmlzdFBvcy5hZGQoRUxCT1dfV1JJU1RfT0ZGU0VUKTtcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24oZWxib3dRKTtcbiAgICB3cmlzdFBvcy5hZGQodGhpcy5lbGJvd1Bvcyk7XG5cbiAgICBsZXQgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KEFSTV9FWFRFTlNJT05fT0ZGU0VUKTtcbiAgICBvZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xuXG4gICAgbGV0IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHRoaXMud3Jpc3RQb3MpO1xuICAgIHBvc2l0aW9uLmFkZChvZmZzZXQpO1xuICAgIHBvc2l0aW9uLmFwcGx5UXVhdGVybmlvbih0aGlzLnJvb3RRKTtcblxuICAgIGxldCBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuY29weSh0aGlzLmNvbnRyb2xsZXJRKTtcblxuICAgIC8vIFNldCB0aGUgcmVzdWx0aW5nIHBvc2Ugb3JpZW50YXRpb24gYW5kIHBvc2l0aW9uLlxuICAgIHRoaXMucG9zZS5vcmllbnRhdGlvbi5jb3B5KG9yaWVudGF0aW9uKTtcbiAgICB0aGlzLnBvc2UucG9zaXRpb24uY29weShwb3NpdGlvbik7XG5cbiAgICB0aGlzLmxhc3RUaW1lID0gdGhpcy50aW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBvc2UgY2FsY3VsYXRlZCBieSB0aGUgbW9kZWwuXG4gICAqL1xuICBnZXRQb3NlKCkge1xuICAgIHJldHVybiB0aGlzLnBvc2U7XG4gIH1cblxuICAvKipcbiAgICogRGVidWcgbWV0aG9kcyBmb3IgcmVuZGVyaW5nIHRoZSBhcm0gbW9kZWwuXG4gICAqL1xuICBnZXRGb3JlYXJtTGVuZ3RoKCkge1xuICAgIHJldHVybiBFTEJPV19XUklTVF9PRkZTRVQubGVuZ3RoKCk7XG4gIH1cblxuICBnZXRFbGJvd1Bvc2l0aW9uKCkge1xuICAgIGxldCBvdXQgPSB0aGlzLmVsYm93UG9zLmNsb25lKCk7XG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG4gIH1cblxuICBnZXRXcmlzdFBvc2l0aW9uKCkge1xuICAgIGxldCBvdXQgPSB0aGlzLndyaXN0UG9zLmNsb25lKCk7XG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG4gIH1cblxuICBnZXRIZWFkWWF3T3JpZW50YXRpb25fKCkge1xuICAgIGxldCBoZWFkRXVsZXIgPSBuZXcgVEhSRUUuRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbih0aGlzLmhlYWRRLCAnWVhaJyk7XG4gICAgaGVhZEV1bGVyLnggPSAwO1xuICAgIGhlYWRFdWxlci56ID0gMDtcbiAgICBsZXQgZGVzdGluYXRpb25RID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoaGVhZEV1bGVyKTtcbiAgICByZXR1cm4gZGVzdGluYXRpb25RO1xuICB9XG5cbiAgY2xhbXBfKHZhbHVlLCBtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCh2YWx1ZSwgbWluKSwgbWF4KTtcbiAgfVxuXG4gIHF1YXRBbmdsZV8ocTEsIHEyKSB7XG4gICAgbGV0IHZlYzEgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbGV0IHZlYzIgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgdmVjMS5hcHBseVF1YXRlcm5pb24ocTEpO1xuICAgIHZlYzIuYXBwbHlRdWF0ZXJuaW9uKHEyKTtcbiAgICByZXR1cm4gdmVjMS5hbmdsZVRvKHZlYzIpO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnXG5pbXBvcnQgSW50ZXJhY3Rpb25Nb2RlcyBmcm9tICcuL3JheS1pbnRlcmFjdGlvbi1tb2RlcydcbmltcG9ydCB7aXNNb2JpbGV9IGZyb20gJy4vdXRpbCdcblxuY29uc3QgRFJBR19ESVNUQU5DRV9QWCA9IDEwO1xuXG4vKipcbiAqIEVudW1lcmF0ZXMgYWxsIHBvc3NpYmxlIGludGVyYWN0aW9uIG1vZGVzLiBTZXRzIHVwIGFsbCBldmVudCBoYW5kbGVycyAobW91c2UsXG4gKiB0b3VjaCwgZXRjKSwgaW50ZXJmYWNlcyB3aXRoIGdhbWVwYWQgQVBJLlxuICpcbiAqIEVtaXRzIGV2ZW50czpcbiAqICAgIGFjdGlvbjogSW5wdXQgaXMgYWN0aXZhdGVkIChtb3VzZWRvd24sIHRvdWNoc3RhcnQsIGRheWRyZWFtIGNsaWNrLCB2aXZlIHRyaWdnZXIpLlxuICogICAgcmVsZWFzZTogSW5wdXQgaXMgZGVhY3RpdmF0ZWQgKG1vdXNldXAsIHRvdWNoZW5kLCBkYXlkcmVhbSByZWxlYXNlLCB2aXZlIHJlbGVhc2UpLlxuICogICAgY2FuY2VsOiBJbnB1dCBpcyBjYW5jZWxlZCAoZWcuIHdlIHNjcm9sbGVkIGluc3RlYWQgb2YgdGFwcGluZyBvbiBtb2JpbGUvZGVza3RvcCkuXG4gKiAgICBwb2ludGVybW92ZSgyRCBwb3NpdGlvbik6IFRoZSBwb2ludGVyIGlzIG1vdmVkIChtb3VzZSBvciB0b3VjaCkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUNvbnRyb2xsZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihvcHRfZWwpIHtcbiAgICBzdXBlcigpO1xuICAgIGxldCBlbCA9IG9wdF9lbCB8fCB3aW5kb3c7XG5cbiAgICAvLyBIYW5kbGUgaW50ZXJhY3Rpb25zLlxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZURvd25fLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmVfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2VVcF8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0Xy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZF8uYmluZCh0aGlzKSk7XG5cbiAgICAvLyBUaGUgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXG4gICAgdGhpcy5wb2ludGVyID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAvLyBUaGUgcHJldmlvdXMgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXG4gICAgdGhpcy5sYXN0UG9pbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgLy8gUG9zaXRpb24gb2YgcG9pbnRlciBpbiBOb3JtYWxpemVkIERldmljZSBDb29yZGluYXRlcyAoTkRDKS5cbiAgICB0aGlzLnBvaW50ZXJOZGMgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIC8vIEhvdyBtdWNoIHdlIGhhdmUgZHJhZ2dlZCAoaWYgd2UgYXJlIGRyYWdnaW5nKS5cbiAgICB0aGlzLmRyYWdEaXN0YW5jZSA9IDA7XG4gICAgLy8gQXJlIHdlIGRyYWdnaW5nIG9yIG5vdC5cbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAvLyBJcyBwb2ludGVyIGFjdGl2ZSBvciBub3QuXG4gICAgdGhpcy5pc1RvdWNoQWN0aXZlID0gZmFsc2U7XG4gICAgLy8gSXMgdGhpcyBhIHN5bnRoZXRpYyBtb3VzZSBldmVudD9cbiAgICB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCA9IGZhbHNlO1xuXG4gICAgLy8gR2FtZXBhZCBldmVudHMuXG4gICAgdGhpcy5nYW1lcGFkID0gbnVsbDtcblxuICAgIC8vIFZSIEV2ZW50cy5cbiAgICBpZiAoIW5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1dlYlZSIEFQSSBub3QgYXZhaWxhYmxlISBDb25zaWRlciB1c2luZyB0aGUgd2VidnItcG9seWZpbGwuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKCkudGhlbigoZGlzcGxheXMpID0+IHtcbiAgICAgICAgdGhpcy52ckRpc3BsYXkgPSBkaXNwbGF5c1swXTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGdldEludGVyYWN0aW9uTW9kZSgpIHtcbiAgICAvLyBUT0RPOiBEZWJ1Z2dpbmcgb25seS5cbiAgICAvL3JldHVybiBJbnRlcmFjdGlvbk1vZGVzLkRBWURSRUFNO1xuXG4gICAgdmFyIGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcblxuICAgIGlmIChnYW1lcGFkKSB7XG4gICAgICBsZXQgcG9zZSA9IGdhbWVwYWQucG9zZTtcbiAgICAgIC8vIElmIHRoZXJlJ3MgYSBnYW1lcGFkIGNvbm5lY3RlZCwgZGV0ZXJtaW5lIGlmIGl0J3MgRGF5ZHJlYW0gb3IgYSBWaXZlLlxuICAgICAgaWYgKHBvc2UuaGFzUG9zaXRpb24pIHtcbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVlJfNkRPRjtcbiAgICAgIH1cblxuICAgICAgaWYgKHBvc2UuaGFzT3JpZW50YXRpb24pIHtcbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRjtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQsIGl0IG1pZ2h0IGJlIENhcmRib2FyZCwgbWFnaWMgd2luZG93IG9yIGRlc2t0b3AuXG4gICAgICBpZiAoaXNNb2JpbGUoKSkge1xuICAgICAgICAvLyBFaXRoZXIgQ2FyZGJvYXJkIG9yIG1hZ2ljIHdpbmRvdywgZGVwZW5kaW5nIG9uIHdoZXRoZXIgd2UgYXJlXG4gICAgICAgIC8vIHByZXNlbnRpbmcuXG4gICAgICAgIGlmICh0aGlzLnZyRGlzcGxheSAmJiB0aGlzLnZyRGlzcGxheS5pc1ByZXNlbnRpbmcpIHtcbiAgICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8wRE9GO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlRPVUNIO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZSBtdXN0IGJlIG9uIGRlc2t0b3AuXG4gICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLk1PVVNFO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBCeSBkZWZhdWx0LCB1c2UgVE9VQ0guXG4gICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVE9VQ0g7XG4gIH1cblxuICBnZXRHYW1lcGFkUG9zZSgpIHtcbiAgICB2YXIgZ2FtZXBhZCA9IHRoaXMuZ2V0VlJHYW1lcGFkXygpO1xuICAgIHJldHVybiBnYW1lcGFkLnBvc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGlmIHRoZXJlIGlzIGFuIGFjdGl2ZSB0b3VjaCBldmVudCBnb2luZyBvbi5cbiAgICogT25seSByZWxldmFudCBvbiB0b3VjaCBkZXZpY2VzXG4gICAqL1xuICBnZXRJc1RvdWNoQWN0aXZlKCkge1xuICAgIHJldHVybiB0aGlzLmlzVG91Y2hBY3RpdmU7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgY2xpY2sgaXMgdGhlIGNhcmRib2FyZC1jb21wYXRpYmxlIGZhbGxiYWNrXG4gICAqIGNsaWNrIG9uIERheWRyZWFtIGNvbnRyb2xsZXJzIHNvIHRoYXQgd2UgY2FuIGRlZHVwbGljYXRlIGl0LlxuICAgKiBUT0RPKGtsYXVzdyk6IEl0IHdvdWxkIGJlIG5pY2UgdG8gYmUgYWJsZSB0byBtb3ZlIGludGVyYWN0aW9uc1xuICAgKiB0byB0aGlzIGV2ZW50IHNpbmNlIGl0IGNvdW50cyBhcyBhIHVzZXIgYWN0aW9uIHdoaWxlIGNvbnRyb2xsZXJcbiAgICogY2xpY2tzIGRvbid0LiBCdXQgdGhhdCB3b3VsZCByZXF1aXJlIGxhcmdlciByZWZhY3RvcmluZy5cbiAgICovXG4gIGlzQ2FyZGJvYXJkQ29tcGF0Q2xpY2soZSkge1xuICAgIGxldCBtb2RlID0gdGhpcy5nZXRJbnRlcmFjdGlvbk1vZGUoKTtcbiAgICBpZiAobW9kZSA9PSBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0YgJiYgZS5zY3JlZW5YID09IDAgJiYgZS5zY3JlZW5ZID09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzZXRTaXplKHNpemUpIHtcbiAgICB0aGlzLnNpemUgPSBzaXplO1xuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIGxldCBtb2RlID0gdGhpcy5nZXRJbnRlcmFjdGlvbk1vZGUoKTtcbiAgICBpZiAobW9kZSA9PSBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0YgfHwgbW9kZSA9PSBJbnRlcmFjdGlvbk1vZGVzLlZSXzZET0YpIHtcbiAgICAgIC8vIElmIHdlJ3JlIGRlYWxpbmcgd2l0aCBhIGdhbWVwYWQsIGNoZWNrIGV2ZXJ5IGFuaW1hdGlvbiBmcmFtZSBmb3IgYVxuICAgICAgLy8gcHJlc3NlZCBhY3Rpb24uXG4gICAgICBsZXQgaXNHYW1lcGFkUHJlc3NlZCA9IHRoaXMuZ2V0R2FtZXBhZEJ1dHRvblByZXNzZWRfKCk7XG4gICAgICBpZiAoaXNHYW1lcGFkUHJlc3NlZCAmJiAhdGhpcy53YXNHYW1lcGFkUHJlc3NlZCkge1xuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmVtaXQoJ3JheWRvd24nKTtcbiAgICAgIH1cbiAgICAgIGlmICghaXNHYW1lcGFkUHJlc3NlZCAmJiB0aGlzLndhc0dhbWVwYWRQcmVzc2VkKSB7XG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVtaXQoJ3JheXVwJyk7XG4gICAgICB9XG4gICAgICB0aGlzLndhc0dhbWVwYWRQcmVzc2VkID0gaXNHYW1lcGFkUHJlc3NlZDtcblxuICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZykge1xuICAgICAgICB0aGlzLmVtaXQoJ3JheWRyYWcnKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRHYW1lcGFkQnV0dG9uUHJlc3NlZF8oKSB7XG4gICAgdmFyIGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcbiAgICBpZiAoIWdhbWVwYWQpIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCwgdGhlIGJ1dHRvbiB3YXMgbm90IHByZXNzZWQuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGZvciBjbGlja3MuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBnYW1lcGFkLmJ1dHRvbnMubGVuZ3RoOyArK2opIHtcbiAgICAgIGlmIChnYW1lcGFkLmJ1dHRvbnNbal0ucHJlc3NlZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgb25Nb3VzZURvd25fKGUpIHtcbiAgICBpZiAodGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQpIHJldHVybjtcbiAgICBpZiAodGhpcy5pc0NhcmRib2FyZENvbXBhdENsaWNrKGUpKSByZXR1cm47XG5cbiAgICB0aGlzLnN0YXJ0RHJhZ2dpbmdfKGUpO1xuICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xuICB9XG5cbiAgb25Nb3VzZU1vdmVfKGUpIHtcbiAgICBpZiAodGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQpIHJldHVybjtcblxuICAgIHRoaXMudXBkYXRlUG9pbnRlcl8oZSk7XG4gICAgdGhpcy51cGRhdGVEcmFnRGlzdGFuY2VfKCk7XG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XG4gIH1cblxuICBvbk1vdXNlVXBfKGUpIHtcbiAgICB2YXIgaXNTeW50aGV0aWMgPSB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudDtcbiAgICB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCA9IGZhbHNlO1xuICAgIGlmIChpc1N5bnRoZXRpYykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmlzQ2FyZGJvYXJkQ29tcGF0Q2xpY2soZSkpIHJldHVybjtcblxuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XG4gIH1cblxuICBvblRvdWNoU3RhcnRfKGUpIHtcbiAgICB0aGlzLmlzVG91Y2hBY3RpdmUgPSB0cnVlO1xuICAgIHZhciB0ID0gZS50b3VjaGVzWzBdO1xuICAgIHRoaXMuc3RhcnREcmFnZ2luZ18odCk7XG4gICAgdGhpcy51cGRhdGVUb3VjaFBvaW50ZXJfKGUpO1xuXG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG4gIH1cblxuICBvblRvdWNoTW92ZV8oZSkge1xuICAgIHRoaXMudXBkYXRlVG91Y2hQb2ludGVyXyhlKTtcbiAgICB0aGlzLnVwZGF0ZURyYWdEaXN0YW5jZV8oKTtcbiAgfVxuXG4gIG9uVG91Y2hFbmRfKGUpIHtcbiAgICB0aGlzLmVuZERyYWdnaW5nXygpO1xuXG4gICAgLy8gU3VwcHJlc3MgZHVwbGljYXRlIGV2ZW50cyBmcm9tIHN5bnRoZXRpYyBtb3VzZSBldmVudHMuXG4gICAgdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQgPSB0cnVlO1xuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVG91Y2hQb2ludGVyXyhlKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyB0b3VjaGVzIGFycmF5LCBpZ25vcmUuXG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUud2FybignUmVjZWl2ZWQgdG91Y2ggZXZlbnQgd2l0aCBubyB0b3VjaGVzLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdCA9IGUudG91Y2hlc1swXTtcbiAgICB0aGlzLnVwZGF0ZVBvaW50ZXJfKHQpO1xuICB9XG5cbiAgdXBkYXRlUG9pbnRlcl8oZSkge1xuICAgIC8vIEhvdyBtdWNoIHRoZSBwb2ludGVyIG1vdmVkLlxuICAgIHRoaXMucG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICAgIHRoaXMucG9pbnRlck5kYy54ID0gKGUuY2xpZW50WCAvIHRoaXMuc2l6ZS53aWR0aCkgKiAyIC0gMTtcbiAgICB0aGlzLnBvaW50ZXJOZGMueSA9IC0gKGUuY2xpZW50WSAvIHRoaXMuc2l6ZS5oZWlnaHQpICogMiArIDE7XG4gIH1cblxuICB1cGRhdGVEcmFnRGlzdGFuY2VfKCkge1xuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgIHZhciBkaXN0YW5jZSA9IHRoaXMubGFzdFBvaW50ZXIuc3ViKHRoaXMucG9pbnRlcikubGVuZ3RoKCk7XG4gICAgICB0aGlzLmRyYWdEaXN0YW5jZSArPSBkaXN0YW5jZTtcbiAgICAgIHRoaXMubGFzdFBvaW50ZXIuY29weSh0aGlzLnBvaW50ZXIpO1xuXG5cbiAgICAgIC8vY29uc29sZS5sb2coJ2RyYWdEaXN0YW5jZScsIHRoaXMuZHJhZ0Rpc3RhbmNlKTtcbiAgICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA+IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnKTtcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhcnREcmFnZ2luZ18oZSkge1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgdGhpcy5sYXN0UG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICB9XG5cbiAgZW5kRHJhZ2dpbmdfKCkge1xuICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA8IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgIHRoaXMuZW1pdCgncmF5dXAnKTtcbiAgICB9XG4gICAgdGhpcy5kcmFnRGlzdGFuY2UgPSAwO1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZpcnN0IFZSLWVuYWJsZWQgZ2FtZXBhZC5cbiAgICovXG4gIGdldFZSR2FtZXBhZF8oKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkIEFQSSwgdGhlcmUncyBubyBnYW1lcGFkLlxuICAgIGlmICghbmF2aWdhdG9yLmdldEdhbWVwYWRzKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZ2FtZXBhZHMgPSBuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVwYWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZ2FtZXBhZCA9IGdhbWVwYWRzW2ldO1xuXG4gICAgICAvLyBUaGUgYXJyYXkgbWF5IGNvbnRhaW4gdW5kZWZpbmVkIGdhbWVwYWRzLCBzbyBjaGVjayBmb3IgdGhhdCBhcyB3ZWxsIGFzXG4gICAgICAvLyBhIG5vbi1udWxsIHBvc2UuXG4gICAgICBpZiAoZ2FtZXBhZCAmJiBnYW1lcGFkLnBvc2UpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVwYWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgT3JpZW50YXRpb25Bcm1Nb2RlbCBmcm9tICcuL29yaWVudGF0aW9uLWFybS1tb2RlbCdcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcbmltcG9ydCBSYXlSZW5kZXJlciBmcm9tICcuL3JheS1yZW5kZXJlcidcbmltcG9ydCBSYXlDb250cm9sbGVyIGZyb20gJy4vcmF5LWNvbnRyb2xsZXInXG5pbXBvcnQgSW50ZXJhY3Rpb25Nb2RlcyBmcm9tICcuL3JheS1pbnRlcmFjdGlvbi1tb2RlcydcblxuLyoqXG4gKiBBUEkgd3JhcHBlciBmb3IgdGhlIGlucHV0IGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUlucHV0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY2FtZXJhLCBvcHRfZWwpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgdGhpcy5yZW5kZXJlciA9IG5ldyBSYXlSZW5kZXJlcihjYW1lcmEpO1xuICAgIHRoaXMuY29udHJvbGxlciA9IG5ldyBSYXlDb250cm9sbGVyKG9wdF9lbCk7XG5cbiAgICAvLyBBcm0gbW9kZWwgbmVlZGVkIHRvIHRyYW5zZm9ybSBjb250cm9sbGVyIG9yaWVudGF0aW9uIGludG8gcHJvcGVyIHBvc2UuXG4gICAgdGhpcy5hcm1Nb2RlbCA9IG5ldyBPcmllbnRhdGlvbkFybU1vZGVsKCk7XG5cbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheWRvd24nLCB0aGlzLm9uUmF5RG93bl8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXl1cCcsIHRoaXMub25SYXlVcF8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXljYW5jZWwnLCB0aGlzLm9uUmF5Q2FuY2VsXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3BvaW50ZXJtb3ZlJywgdGhpcy5vblBvaW50ZXJNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheWRyYWcnLCB0aGlzLm9uUmF5RHJhZ18uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5yZW5kZXJlci5vbigncmF5b3ZlcicsIChtZXNoKSA9PiB7IHRoaXMuZW1pdCgncmF5b3ZlcicsIG1lc2gpIH0pO1xuICAgIHRoaXMucmVuZGVyZXIub24oJ3JheW91dCcsIChtZXNoKSA9PiB7IHRoaXMuZW1pdCgncmF5b3V0JywgbWVzaCkgfSk7XG5cbiAgICAvLyBCeSBkZWZhdWx0LCBwdXQgdGhlIHBvaW50ZXIgb2Zmc2NyZWVuLlxuICAgIHRoaXMucG9pbnRlck5kYyA9IG5ldyBUSFJFRS5WZWN0b3IyKDEsIDEpO1xuXG4gICAgLy8gRXZlbnQgaGFuZGxlcnMuXG4gICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICB9XG5cbiAgYWRkKG9iamVjdCwgaGFuZGxlcnMpIHtcbiAgICB0aGlzLnJlbmRlcmVyLmFkZChvYmplY3QsIGhhbmRsZXJzKTtcbiAgICB0aGlzLmhhbmRsZXJzW29iamVjdC5pZF0gPSBoYW5kbGVycztcbiAgfVxuXG4gIHJlbW92ZShvYmplY3QpIHtcbiAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZShvYmplY3QpO1xuICAgIGRlbGV0ZSB0aGlzLmhhbmRsZXJzW29iamVjdC5pZF1cbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICBsZXQgbG9va0F0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIGxvb2tBdC5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG5cbiAgICBsZXQgbW9kZSA9IHRoaXMuY29udHJvbGxlci5nZXRJbnRlcmFjdGlvbk1vZGUoKTtcbiAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5NT1VTRTpcbiAgICAgICAgLy8gRGVza3RvcCBtb3VzZSBtb2RlLCBtb3VzZSBjb29yZGluYXRlcyBhcmUgd2hhdCBtYXR0ZXJzLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvaW50ZXIodGhpcy5wb2ludGVyTmRjKTtcbiAgICAgICAgLy8gSGlkZSB0aGUgcmF5IGFuZCByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkoZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KGZhbHNlKTtcblxuICAgICAgICAvLyBJbiBtb3VzZSBtb2RlIHJheSByZW5kZXJlciBpcyBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDpcbiAgICAgICAgLy8gTW9iaWxlIG1hZ2ljIHdpbmRvdyBtb2RlLiBUb3VjaCBjb29yZGluYXRlcyBtYXR0ZXIsIGJ1dCB3ZSB3YW50IHRvXG4gICAgICAgIC8vIGhpZGUgdGhlIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9pbnRlcih0aGlzLnBvaW50ZXJOZGMpO1xuXG4gICAgICAgIC8vIEhpZGUgdGhlIHJheSBhbmQgdGhlIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkoZmFsc2UpO1xuXG4gICAgICAgIC8vIEluIHRvdWNoIG1vZGUgdGhlIHJheSByZW5kZXJlciBpcyBvbmx5IGFjdGl2ZSBvbiB0b3VjaC5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodGhpcy5jb250cm9sbGVyLmdldElzVG91Y2hBY3RpdmUoKSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVlJfMERPRjpcbiAgICAgICAgLy8gQ2FyZGJvYXJkIG1vZGUsIHdlJ3JlIGRlYWxpbmcgd2l0aCBhIGdhemUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbih0aGlzLmNhbWVyYS5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG5cbiAgICAgICAgLy8gUmV0aWNsZSBvbmx5LlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkoZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GOlxuICAgICAgICAvLyBEYXlkcmVhbSwgb3VyIG9yaWdpbiBpcyBzbGlnaHRseSBvZmYgKGRlcGVuZGluZyBvbiBoYW5kZWRuZXNzKS5cbiAgICAgICAgLy8gQnV0IHdlIHNob3VsZCBiZSB1c2luZyB0aGUgb3JpZW50YXRpb24gZnJvbSB0aGUgZ2FtZXBhZC5cbiAgICAgICAgLy8gVE9ETyhzbXVzKTogSW1wbGVtZW50IHRoZSByZWFsIGFybSBtb2RlbC5cbiAgICAgICAgdmFyIHBvc2UgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0R2FtZXBhZFBvc2UoKTtcblxuICAgICAgICAvLyBEZWJ1ZyBvbmx5OiB1c2UgY2FtZXJhIGFzIGlucHV0IGNvbnRyb2xsZXIuXG4gICAgICAgIC8vbGV0IGNvbnRyb2xsZXJPcmllbnRhdGlvbiA9IHRoaXMuY2FtZXJhLnF1YXRlcm5pb247XG4gICAgICAgIGxldCBjb250cm9sbGVyT3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLmZyb21BcnJheShwb3NlLm9yaWVudGF0aW9uKTtcblxuICAgICAgICAvLyBUcmFuc2Zvcm0gdGhlIGNvbnRyb2xsZXIgaW50byB0aGUgY2FtZXJhIGNvb3JkaW5hdGUgc3lzdGVtLlxuICAgICAgICAvKlxuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ubXVsdGlwbHkoXG4gICAgICAgICAgICBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21BeGlzQW5nbGUobmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCksIE1hdGguUEkpKTtcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLnggKj0gLTE7XG4gICAgICAgIGNvbnRyb2xsZXJPcmllbnRhdGlvbi56ICo9IC0xO1xuICAgICAgICAqL1xuXG4gICAgICAgIC8vIEZlZWQgY2FtZXJhIGFuZCBjb250cm9sbGVyIGludG8gdGhlIGFybSBtb2RlbC5cbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkT3JpZW50YXRpb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMuYXJtTW9kZWwuc2V0SGVhZFBvc2l0aW9uKHRoaXMuY2FtZXJhLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRDb250cm9sbGVyT3JpZW50YXRpb24oY29udHJvbGxlck9yaWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC51cGRhdGUoKTtcblxuICAgICAgICAvLyBHZXQgcmVzdWx0aW5nIHBvc2UgYW5kIGNvbmZpZ3VyZSB0aGUgcmVuZGVyZXIuXG4gICAgICAgIGxldCBtb2RlbFBvc2UgPSB0aGlzLmFybU1vZGVsLmdldFBvc2UoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbihtb2RlbFBvc2UucG9zaXRpb24pO1xuICAgICAgICAvL3RoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24obmV3IFRIUkVFLlZlY3RvcjMoKSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24obW9kZWxQb3NlLm9yaWVudGF0aW9uKTtcbiAgICAgICAgLy90aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKGNvbnRyb2xsZXJPcmllbnRhdGlvbik7XG5cbiAgICAgICAgLy8gU2hvdyByYXkgYW5kIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eSh0cnVlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eSh0cnVlKTtcblxuICAgICAgICAvLyBSYXkgcmVuZGVyZXIgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVlJfNkRPRjpcbiAgICAgICAgLy8gVml2ZSwgb3JpZ2luIGRlcGVuZHMgb24gdGhlIHBvc2l0aW9uIG9mIHRoZSBjb250cm9sbGVyLlxuICAgICAgICAvLyBUT0RPKHNtdXMpLi4uXG4gICAgICAgIHZhciBwb3NlID0gdGhpcy5jb250cm9sbGVyLmdldEdhbWVwYWRQb3NlKCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgdGhhdCB0aGUgcG9zZSBpcyB2YWxpZC5cbiAgICAgICAgaWYgKCFwb3NlLm9yaWVudGF0aW9uIHx8ICFwb3NlLnBvc2l0aW9uKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIGdhbWVwYWQgcG9zZS4gQ2FuXFwndCB1cGRhdGUgcmF5LicpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGxldCBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuZnJvbUFycmF5KHBvc2Uub3JpZW50YXRpb24pO1xuICAgICAgICBsZXQgcG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpLmZyb21BcnJheShwb3NlLnBvc2l0aW9uKTtcblxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKG9yaWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbihwb3NpdGlvbik7XG5cbiAgICAgICAgLy8gU2hvdyByYXkgYW5kIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eSh0cnVlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eSh0cnVlKTtcblxuICAgICAgICAvLyBSYXkgcmVuZGVyZXIgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmVycm9yKCdVbmtub3duIGludGVyYWN0aW9uIG1vZGUuJyk7XG4gICAgfVxuICAgIHRoaXMucmVuZGVyZXIudXBkYXRlKCk7XG4gICAgdGhpcy5jb250cm9sbGVyLnVwZGF0ZSgpO1xuICB9XG5cbiAgc2V0U2l6ZShzaXplKSB7XG4gICAgdGhpcy5jb250cm9sbGVyLnNldFNpemUoc2l6ZSk7XG4gIH1cblxuICBnZXRNZXNoKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLmdldFJldGljbGVSYXlNZXNoKCk7XG4gIH1cblxuICBnZXRPcmlnaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0T3JpZ2luKCk7XG4gIH1cblxuICBnZXREaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0RGlyZWN0aW9uKCk7XG4gIH1cblxuICBnZXRSaWdodERpcmVjdGlvbigpIHtcbiAgICBsZXQgbG9va0F0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIGxvb2tBdC5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG4gICAgcmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IzKCkuY3Jvc3NWZWN0b3JzKGxvb2tBdCwgdGhpcy5jYW1lcmEudXApO1xuICB9XG5cbiAgb25SYXlEb3duXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlEb3duXycpO1xuXG4gICAgLy8gRm9yY2UgdGhlIHJlbmRlcmVyIHRvIHJheWNhc3QuXG4gICAgdGhpcy5yZW5kZXJlci51cGRhdGUoKTtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJywgbWVzaCk7XG5cbiAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgfVxuXG4gIG9uUmF5RHJhZ18oKSB7XG4gICAgdGhpcy5lbWl0KCdyYXlkcmFnJyk7XG4gIH1cblxuICBvblJheVVwXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlVcF8nKTtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXl1cCcsIG1lc2gpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUoZmFsc2UpO1xuICB9XG5cbiAgb25SYXlDYW5jZWxfKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheUNhbmNlbF8nKTtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnLCBtZXNoKTtcbiAgfVxuXG4gIG9uUG9pbnRlck1vdmVfKG5kYykge1xuICAgIHRoaXMucG9pbnRlck5kYy5jb3B5KG5kYyk7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBJbnRlcmFjdGlvbk1vZGVzID0ge1xuICBNT1VTRTogMSxcbiAgVE9VQ0g6IDIsXG4gIFZSXzBET0Y6IDMsXG4gIFZSXzNET0Y6IDQsXG4gIFZSXzZET0Y6IDVcbn07XG5cbmV4cG9ydCB7IEludGVyYWN0aW9uTW9kZXMgYXMgZGVmYXVsdCB9O1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtiYXNlNjR9IGZyb20gJy4vdXRpbCdcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcblxuY29uc3QgUkVUSUNMRV9ESVNUQU5DRSA9IDM7XG5jb25zdCBJTk5FUl9SQURJVVMgPSAwLjAyO1xuY29uc3QgT1VURVJfUkFESVVTID0gMC4wNDtcbmNvbnN0IFJBWV9SQURJVVMgPSAwLjAyO1xuY29uc3QgR1JBRElFTlRfSU1BR0UgPSBiYXNlNjQoJ2ltYWdlL3BuZycsICdpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBSUFBQUFDQUNBWUFBQUREUG1ITEFBQUJka2xFUVZSNG5PM1d3WEhFUUF3RFFjaW4vRk9XdytCanVpUFlCMnE0RzJuUDkzM1A5U080ODI0emdEQURpRE9BdUhmYjMvVWp1S01BY1FZUVp3QngvZ0J4Q2hDbkFIRUtFS2NBY1FvUXB3QnhDaENuQUhFR0VHY0FjZjRBY1FvUVp3QnhCaEJuQUhFR0VHY0FjUVlRWndCeEJoQm5BSEVHRUdjQWNRWVFad0J4QmhCbkFISHZ0dC8xSTdpakFIRUdFR2NBY2Y0QWNRb1Fad0J4VGtDY0FzUVpRSndURUtjQWNRb1Fwd0J4QmhEbkJNUXBRSndDeENsQW5BTEVLVUNjQXNRcFFKd0N4Q2xBbkFMRUtVQ2NBc1FwUUp3QnhEa0JjUW9RcHdCeENoQ25BSEVLRUtjQWNRb1Fwd0J4Q2hDbkFIRUtFR2NBY1U1QW5BTEVLVUNjQXNRWlFKd1RFS2NBY1FZUTV3VEVLVUNjQWNRWlFKdy9RSndDeEJsQW5BSEVHVUNjQWNRWlFKd0J4QmxBbkFIRUdVQ2NBY1FaUUp3QnhCbEFuQUhFR1VEY3UrMjVmZ1IzRkNET0FPSU1JTTRmSUU0QjRoUWdUZ0hpRkNCT0FlSVVJRTRCNGhRZ3pnRGlEQ0RPSHlCT0FlSU1JTTRBNHY0Qi81SUY5ZUQ2UXhnQUFBQUFTVVZPUks1Q1lJST0nKTtcblxuLyoqXG4gKiBIYW5kbGVzIHJheSBpbnB1dCBzZWxlY3Rpb24gZnJvbSBmcmFtZSBvZiByZWZlcmVuY2Ugb2YgYW4gYXJiaXRyYXJ5IG9iamVjdC5cbiAqXG4gKiBUaGUgc291cmNlIG9mIHRoZSByYXkgaXMgZnJvbSB2YXJpb3VzIGxvY2F0aW9uczpcbiAqXG4gKiBEZXNrdG9wOiBtb3VzZS5cbiAqIE1hZ2ljIHdpbmRvdzogdG91Y2guXG4gKiBDYXJkYm9hcmQ6IGNhbWVyYS5cbiAqIERheWRyZWFtOiAzRE9GIGNvbnRyb2xsZXIgdmlhIGdhbWVwYWQgKGFuZCBzaG93IHJheSkuXG4gKiBWaXZlOiA2RE9GIGNvbnRyb2xsZXIgdmlhIGdhbWVwYWQgKGFuZCBzaG93IHJheSkuXG4gKlxuICogRW1pdHMgc2VsZWN0aW9uIGV2ZW50czpcbiAqICAgICByYXlvdmVyKG1lc2gpOiBUaGlzIG1lc2ggd2FzIHNlbGVjdGVkLlxuICogICAgIHJheW91dChtZXNoKTogVGhpcyBtZXNoIHdhcyB1bnNlbGVjdGVkLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYXlSZW5kZXJlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKGNhbWVyYSwgb3B0X3BhcmFtcykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcblxuICAgIHZhciBwYXJhbXMgPSBvcHRfcGFyYW1zIHx8IHt9O1xuXG4gICAgLy8gV2hpY2ggb2JqZWN0cyBhcmUgaW50ZXJhY3RpdmUgKGtleWVkIG9uIGlkKS5cbiAgICB0aGlzLm1lc2hlcyA9IHt9O1xuXG4gICAgLy8gV2hpY2ggb2JqZWN0cyBhcmUgY3VycmVudGx5IHNlbGVjdGVkIChrZXllZCBvbiBpZCkuXG4gICAgdGhpcy5zZWxlY3RlZCA9IHt9O1xuXG4gICAgLy8gVGhlIHJheWNhc3Rlci5cbiAgICB0aGlzLnJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoKTtcblxuICAgIC8vIFBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiwgaW4gYWRkaXRpb24uXG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgdGhpcy5vcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICB0aGlzLnJvb3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICAgIC8vIEFkZCB0aGUgcmV0aWNsZSBtZXNoIHRvIHRoZSByb290IG9mIHRoZSBvYmplY3QuXG4gICAgdGhpcy5yZXRpY2xlID0gdGhpcy5jcmVhdGVSZXRpY2xlXygpO1xuICAgIHRoaXMucm9vdC5hZGQodGhpcy5yZXRpY2xlKTtcblxuICAgIC8vIEFkZCB0aGUgcmF5IHRvIHRoZSByb290IG9mIHRoZSBvYmplY3QuXG4gICAgdGhpcy5yYXkgPSB0aGlzLmNyZWF0ZVJheV8oKTtcbiAgICB0aGlzLnJvb3QuYWRkKHRoaXMucmF5KTtcblxuICAgIC8vIEhvdyBmYXIgdGhlIHJldGljbGUgaXMgY3VycmVudGx5IGZyb20gdGhlIHJldGljbGUgb3JpZ2luLlxuICAgIHRoaXMucmV0aWNsZURpc3RhbmNlID0gUkVUSUNMRV9ESVNUQU5DRTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhbiBvYmplY3Qgc28gdGhhdCBpdCBjYW4gYmUgaW50ZXJhY3RlZCB3aXRoLlxuICAgKi9cbiAgYWRkKG9iamVjdCkge1xuICAgIHRoaXMubWVzaGVzW29iamVjdC5pZF0gPSBvYmplY3Q7XG4gIH1cblxuICAvKipcbiAgICogUHJldmVudCBhbiBvYmplY3QgZnJvbSBiZWluZyBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICByZW1vdmUob2JqZWN0KSB7XG4gICAgdmFyIGlkID0gb2JqZWN0LmlkO1xuICAgIGlmICh0aGlzLm1lc2hlc1tpZF0pIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZXhpc3RpbmcgbWVzaCwgd2UgY2FuJ3QgcmVtb3ZlIGl0LlxuICAgICAgZGVsZXRlIHRoaXMubWVzaGVzW2lkXTtcbiAgICB9XG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBjdXJyZW50bHkgc2VsZWN0ZWQsIHJlbW92ZSBpdC5cbiAgICBpZiAodGhpcy5zZWxlY3RlZFtpZF0pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW29iamVjdC5pZF07XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIC8vIERvIHRoZSByYXljYXN0aW5nIGFuZCBpc3N1ZSB2YXJpb3VzIGV2ZW50cyBhcyBuZWVkZWQuXG4gICAgZm9yIChsZXQgaWQgaW4gdGhpcy5tZXNoZXMpIHtcbiAgICAgIGxldCBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgICAgbGV0IGludGVyc2VjdHMgPSB0aGlzLnJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3QobWVzaCwgdHJ1ZSk7XG4gICAgICBpZiAoaW50ZXJzZWN0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignVW5leHBlY3RlZDogbXVsdGlwbGUgbWVzaGVzIGludGVyc2VjdGVkLicpO1xuICAgICAgfVxuICAgICAgbGV0IGlzSW50ZXJzZWN0ZWQgPSAoaW50ZXJzZWN0cy5sZW5ndGggPiAwKTtcbiAgICAgIGxldCBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFtpZF07XG5cbiAgICAgIC8vIElmIGl0J3MgbmV3bHkgc2VsZWN0ZWQsIHNlbmQgcmF5b3Zlci5cbiAgICAgIGlmIChpc0ludGVyc2VjdGVkICYmICFpc1NlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRbaWRdID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JheW92ZXInLCBtZXNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBpdCdzIG5vIGxvbmdlciBpbnRlcnNlY3RlZCwgc2VuZCByYXlvdXQuXG4gICAgICBpZiAoIWlzSW50ZXJzZWN0ZWQgJiYgaXNTZWxlY3RlZCkge1xuICAgICAgICBkZWxldGUgdGhpcy5zZWxlY3RlZFtpZF07XG4gICAgICAgIHRoaXMubW92ZVJldGljbGVfKG51bGwpO1xuICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgIHRoaXMuZW1pdCgncmF5b3V0JywgbWVzaCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzSW50ZXJzZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5tb3ZlUmV0aWNsZV8oaW50ZXJzZWN0cyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWdpbiBvZiB0aGUgcmF5LlxuICAgKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yIFBvc2l0aW9uIG9mIHRoZSBvcmlnaW4gb2YgdGhlIHBpY2tpbmcgcmF5LlxuICAgKi9cbiAgc2V0UG9zaXRpb24odmVjdG9yKSB7XG4gICAgdGhpcy5wb3NpdGlvbi5jb3B5KHZlY3Rvcik7XG4gICAgdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpbi5jb3B5KHZlY3Rvcik7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICBnZXRPcmlnaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW47XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZGlyZWN0aW9uIG9mIHRoZSByYXkuXG4gICAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3IgVW5pdCB2ZWN0b3IgY29ycmVzcG9uZGluZyB0byBkaXJlY3Rpb24uXG4gICAqL1xuICBzZXRPcmllbnRhdGlvbihxdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5vcmllbnRhdGlvbi5jb3B5KHF1YXRlcm5pb24pO1xuXG4gICAgdmFyIHBvaW50QXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSkuYXBwbHlRdWF0ZXJuaW9uKHF1YXRlcm5pb24pO1xuICAgIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb24uY29weShwb2ludEF0KVxuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xuICB9XG5cbiAgZ2V0RGlyZWN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnJheWNhc3Rlci5yYXkuZGlyZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBvaW50ZXIgb24gdGhlIHNjcmVlbiBmb3IgY2FtZXJhICsgcG9pbnRlciBiYXNlZCBwaWNraW5nLiBUaGlzXG4gICAqIHN1cGVyc2NlZGVzIG9yaWdpbiBhbmQgZGlyZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHZlY3RvciBUaGUgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIgKHNjcmVlbiBjb29yZHMpLlxuICAgKi9cbiAgc2V0UG9pbnRlcih2ZWN0b3IpIHtcbiAgICB0aGlzLnJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKHZlY3RvciwgdGhpcy5jYW1lcmEpO1xuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1lc2gsIHdoaWNoIGluY2x1ZGVzIHJldGljbGUgYW5kL29yIHJheS4gVGhpcyBtZXNoIGlzIHRoZW4gYWRkZWRcbiAgICogdG8gdGhlIHNjZW5lLlxuICAgKi9cbiAgZ2V0UmV0aWNsZVJheU1lc2goKSB7XG4gICAgcmV0dXJuIHRoaXMucm9vdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgb2JqZWN0IGluIHRoZSBzY2VuZS5cbiAgICovXG4gIGdldFNlbGVjdGVkTWVzaCgpIHtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGxldCBtZXNoID0gbnVsbDtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnNlbGVjdGVkKSB7XG4gICAgICBjb3VudCArPSAxO1xuICAgICAgbWVzaCA9IHRoaXMubWVzaGVzW2lkXTtcbiAgICB9XG4gICAgaWYgKGNvdW50ID4gMSkge1xuICAgICAgY29uc29sZS53YXJuKCdNb3JlIHRoYW4gb25lIG1lc2ggc2VsZWN0ZWQuJyk7XG4gICAgfVxuICAgIHJldHVybiBtZXNoO1xuICB9XG5cbiAgLyoqXG4gICAqIEhpZGVzIGFuZCBzaG93cyB0aGUgcmV0aWNsZS5cbiAgICovXG4gIHNldFJldGljbGVWaXNpYmlsaXR5KGlzVmlzaWJsZSkge1xuICAgIHRoaXMucmV0aWNsZS52aXNpYmxlID0gaXNWaXNpYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgb3IgZGlzYWJsZXMgdGhlIHJheWNhc3RpbmcgcmF5IHdoaWNoIGdyYWR1YWxseSBmYWRlcyBvdXQgZnJvbVxuICAgKiB0aGUgb3JpZ2luLlxuICAgKi9cbiAgc2V0UmF5VmlzaWJpbGl0eShpc1Zpc2libGUpIHtcbiAgICB0aGlzLnJheS52aXNpYmxlID0gaXNWaXNpYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgYW5kIGRpc2FibGVzIHRoZSByYXljYXN0ZXIuIEZvciB0b3VjaCwgd2hlcmUgZmluZ2VyIHVwIG1lYW5zIHdlXG4gICAqIHNob3VsZG4ndCBiZSByYXljYXN0aW5nLlxuICAgKi9cbiAgc2V0QWN0aXZlKGlzQWN0aXZlKSB7XG4gICAgLy8gSWYgbm90aGluZyBjaGFuZ2VkLCBkbyBub3RoaW5nLlxuICAgIGlmICh0aGlzLmlzQWN0aXZlID09IGlzQWN0aXZlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFRPRE8oc211cyk6IFNob3cgdGhlIHJheSBvciByZXRpY2xlIGFkanVzdCBpbiByZXNwb25zZS5cbiAgICB0aGlzLmlzQWN0aXZlID0gaXNBY3RpdmU7XG5cbiAgICBpZiAoIWlzQWN0aXZlKSB7XG4gICAgICB0aGlzLm1vdmVSZXRpY2xlXyhudWxsKTtcbiAgICAgIGZvciAobGV0IGlkIGluIHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgICAgbGV0IG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW2lkXTtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGVSYXljYXN0ZXJfKCkge1xuICAgIHZhciByYXkgPSB0aGlzLnJheWNhc3Rlci5yYXk7XG5cbiAgICAvLyBQb3NpdGlvbiB0aGUgcmV0aWNsZSBhdCBhIGRpc3RhbmNlLCBhcyBjYWxjdWxhdGVkIGZyb20gdGhlIG9yaWdpbiBhbmRcbiAgICAvLyBkaXJlY3Rpb24uXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5yZXRpY2xlLnBvc2l0aW9uO1xuICAgIHBvc2l0aW9uLmNvcHkocmF5LmRpcmVjdGlvbik7XG4gICAgcG9zaXRpb24ubXVsdGlwbHlTY2FsYXIodGhpcy5yZXRpY2xlRGlzdGFuY2UpO1xuICAgIHBvc2l0aW9uLmFkZChyYXkub3JpZ2luKTtcblxuICAgIC8vIFNldCBwb3NpdGlvbiBhbmQgb3JpZW50YXRpb24gb2YgdGhlIHJheSBzbyB0aGF0IGl0IGdvZXMgZnJvbSBvcmlnaW4gdG9cbiAgICAvLyByZXRpY2xlLlxuICAgIHZhciBkZWx0YSA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShyYXkuZGlyZWN0aW9uKTtcbiAgICBkZWx0YS5tdWx0aXBseVNjYWxhcih0aGlzLnJldGljbGVEaXN0YW5jZSk7XG4gICAgdGhpcy5yYXkuc2NhbGUueSA9IGRlbHRhLmxlbmd0aCgpO1xuICAgIHZhciBhcnJvdyA9IG5ldyBUSFJFRS5BcnJvd0hlbHBlcihyYXkuZGlyZWN0aW9uLCByYXkub3JpZ2luKTtcbiAgICB0aGlzLnJheS5yb3RhdGlvbi5jb3B5KGFycm93LnJvdGF0aW9uKTtcbiAgICB0aGlzLnJheS5wb3NpdGlvbi5hZGRWZWN0b3JzKHJheS5vcmlnaW4sIGRlbHRhLm11bHRpcGx5U2NhbGFyKDAuNSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGdlb21ldHJ5IG9mIHRoZSByZXRpY2xlLlxuICAgKi9cbiAgY3JlYXRlUmV0aWNsZV8oKSB7XG4gICAgLy8gQ3JlYXRlIGEgc3BoZXJpY2FsIHJldGljbGUuXG4gICAgbGV0IGlubmVyR2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoSU5ORVJfUkFESVVTLCAzMiwgMzIpO1xuICAgIGxldCBpbm5lck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgIGNvbG9yOiAweGZmZmZmZixcbiAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgb3BhY2l0eTogMC45XG4gICAgfSk7XG4gICAgbGV0IGlubmVyID0gbmV3IFRIUkVFLk1lc2goaW5uZXJHZW9tZXRyeSwgaW5uZXJNYXRlcmlhbCk7XG5cbiAgICBsZXQgb3V0ZXJHZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeShPVVRFUl9SQURJVVMsIDMyLCAzMik7XG4gICAgbGV0IG91dGVyTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IDB4MzMzMzMzLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjNcbiAgICB9KTtcbiAgICBsZXQgb3V0ZXIgPSBuZXcgVEhSRUUuTWVzaChvdXRlckdlb21ldHJ5LCBvdXRlck1hdGVyaWFsKTtcblxuICAgIGxldCByZXRpY2xlID0gbmV3IFRIUkVFLkdyb3VwKCk7XG4gICAgcmV0aWNsZS5hZGQoaW5uZXIpO1xuICAgIHJldGljbGUuYWRkKG91dGVyKTtcbiAgICByZXR1cm4gcmV0aWNsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlcyB0aGUgcmV0aWNsZSB0byBhIHBvc2l0aW9uIHNvIHRoYXQgaXQncyBqdXN0IGluIGZyb250IG9mIHRoZSBtZXNoIHRoYXRcbiAgICogaXQgaW50ZXJzZWN0ZWQgd2l0aC5cbiAgICovXG4gIG1vdmVSZXRpY2xlXyhpbnRlcnNlY3Rpb25zKSB7XG4gICAgLy8gSWYgbm8gaW50ZXJzZWN0aW9uLCByZXR1cm4gdGhlIHJldGljbGUgdG8gdGhlIGRlZmF1bHQgcG9zaXRpb24uXG4gICAgbGV0IGRpc3RhbmNlID0gUkVUSUNMRV9ESVNUQU5DRTtcbiAgICBpZiAoaW50ZXJzZWN0aW9ucykge1xuICAgICAgLy8gT3RoZXJ3aXNlLCBkZXRlcm1pbmUgdGhlIGNvcnJlY3QgZGlzdGFuY2UuXG4gICAgICBsZXQgaW50ZXIgPSBpbnRlcnNlY3Rpb25zWzBdO1xuICAgICAgZGlzdGFuY2UgPSBpbnRlci5kaXN0YW5jZTtcbiAgICB9XG5cbiAgICB0aGlzLnJldGljbGVEaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNyZWF0ZVJheV8oKSB7XG4gICAgLy8gQ3JlYXRlIGEgY3lsaW5kcmljYWwgcmF5LlxuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5DeWxpbmRlckdlb21ldHJ5KFJBWV9SQURJVVMsIFJBWV9SQURJVVMsIDEsIDMyKTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgbWFwOiBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKEdSQURJRU5UX0lNQUdFKSxcbiAgICAgIC8vY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjNcbiAgICB9KTtcbiAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG5cbiAgICByZXR1cm4gbWVzaDtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTW9iaWxlKCkge1xuICB2YXIgY2hlY2sgPSBmYWxzZTtcbiAgKGZ1bmN0aW9uKGEpe2lmKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcmlzfGtpbmRsZXxsZ2UgfG1hZW1vfG1pZHB8bW1wfG1vYmlsZS4rZmlyZWZveHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyBjZXx4ZGF8eGlpbm8vaS50ZXN0KGEpfHwvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KGEuc3Vic3RyKDAsNCkpKWNoZWNrID0gdHJ1ZX0pKG5hdmlnYXRvci51c2VyQWdlbnR8fG5hdmlnYXRvci52ZW5kb3J8fHdpbmRvdy5vcGVyYSk7XG4gIHJldHVybiBjaGVjaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2U2NChtaW1lVHlwZSwgYmFzZTY0KSB7XG4gIHJldHVybiAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgYmFzZTY0O1xufVxuIl19
