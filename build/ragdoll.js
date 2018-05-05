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

},{}],3:[function(require,module,exports){
'use strict';

var _renderer = require('./renderer.js');

var _renderer2 = _interopRequireDefault(_renderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var container = void 0;
var renderer = void 0;
var demoRenderer = void 0;
var gamepad = void 0;

function init() {

  container = document.createElement('div');
  document.body.appendChild(container);

  var info = document.createElement('div');
  info.style.position = 'absolute';
  info.style.top = '10px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
  info.innerHTML = '<a href="https://github.com/beemsoft/webvr-physics" target="_blank" rel="noopener">webvr-physics</a>';
  container.appendChild(info);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMapEnabled = true;

  container.appendChild(renderer.domElement);

  renderer.vr.enabled = true;

  demoRenderer = new _renderer2.default(renderer.getSize());
  demoRenderer.createRagdoll();

  WEBVR.getVRDisplay(function (device) {

    renderer.vr.setDevice(device);
    document.body.appendChild(WEBVR.getButton(device, renderer.domElement));
  });

  gamepad = new THREE.DaydreamController();
  gamepad.position.set(0.25, -0.5, 0);
  demoRenderer.scene.add(gamepad);

  var gamepadHelper = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ linewidth: 4 }));
  gamepadHelper.geometry.addAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -10], 3));
  gamepad.add(gamepadHelper);

  renderer.domElement.addEventListener('click', function (event) {

    gamepadHelper.material.color.setHex(Math.random() * 0xffffff);
  });

  window.addEventListener('resize', onWindowResize, false);
}

function onLoad() {

  WEBVR.checkAvailability().catch(function (message) {

    document.body.appendChild(WEBVR.getMessageContainer(message));
  });

  init();
  animate();
}

window.addEventListener('load', onLoad);

function onWindowResize() {

  demoRenderer.camera.aspect = window.innerWidth / window.innerHeight;
  demoRenderer.camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {

  renderer.animate(render);
}

function render() {

  gamepad.update();
  demoRenderer.render();
  renderer.render(demoRenderer.scene, demoRenderer.camera);
}

},{"./renderer.js":4}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rayInput = require('../ray-input');

var _rayInput2 = _interopRequireDefault(_rayInput);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_COLOR = new THREE.Color(0x00FF00);
var HIGHLIGHT_COLOR = new THREE.Color(0x1E90FF);
var ACTIVE_COLOR = new THREE.Color(0xFF3333);

var DemoRenderer = function () {
  function DemoRenderer(size) {
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
    groundBody.position.y -= 1;
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

    // let renderer = new THREE.WebGLRenderer({ antialias: true });
    // console.log('sizing');
    // console.log('window.devicePixelRatio: ' + window.devicePixelRatio);
    // console.log('window.innerWidth: ' + window.innerWidth);
    // console.log('window.innerHeight: ' + window.innerHeight);
    // renderer.setClearColor( scene.fog.color );
    // renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.gammaInput = true;
    // renderer.gammaOutput = true;
    // renderer.shadowMap.enabled = true;
    //
    // document.body.appendChild(renderer.domElement);

    // Input manager.
    var rayInput = new _rayInput2.default(camera);
    rayInput.setSize(size);
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
    // This helps move the camera
    // let dolly = new THREE.Group();
    // dolly.position.set( 0, 2, 0 );
    // dolly.add( camera );
    // dolly.add( rayInput.getMesh() );
    // scene.add(dolly);
    // camera.position.y +=2;

    this.camera = camera;
    this.scene = scene;
    this.rayInput = rayInput;
    // this.renderer = renderer;
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
    // mesh.castShadow = true;
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    // mesh.position.set(0, -1, 0);
    mesh.position.y -= 1;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  _createClass(DemoRenderer, [{
    key: 'addVisual',
    value: function addVisual(body) {
      // What geometry should be used?
      var mesh = void 0;
      if (body instanceof CANNON.Body) {
        mesh = this.shape2mesh(body);
      }
      if (mesh) {
        // Add body
        mesh.castShadow = true;
        this.bodies.push(body);
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
          this.addPointerConstraintToMesh(pos.x, pos.y, pos.z, this.bodies[idx]);
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
      if (mesh.material) {
        mesh.material.color = isSelected ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
      }
    }
  }, {
    key: 'setAction_',
    value: function setAction_(opt_mesh, isActive) {
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

},{"../ray-input":6}],5:[function(require,module,exports){
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

},{"./ray-interaction-modes":7,"./util":9,"eventemitter3":1}],6:[function(require,module,exports){
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
  }, {
    key: 'setArmModelHeadPosition',
    value: function setArmModelHeadPosition(pos) {
      this.armModel.setHeadPosition(pos);
    }
  }]);

  return RayInput;
}(_eventemitter2.default);

exports.default = RayInput;

},{"./orientation-arm-model":2,"./ray-controller":5,"./ray-interaction-modes":7,"./ray-renderer":8,"eventemitter3":1}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{"./util":9,"eventemitter3":1}],9:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4xMC4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwic3JjL29yaWVudGF0aW9uLWFybS1tb2RlbC5qcyIsInNyYy9yYWdkb2xsL21haW4uanMiLCJzcmMvcmFnZG9sbC9yZW5kZXJlci5qcyIsInNyYy9yYXktY29udHJvbGxlci5qcyIsInNyYy9yYXktaW5wdXQuanMiLCJzcmMvcmF5LWludGVyYWN0aW9uLW1vZGVzLmpzIiwic3JjL3JheS1yZW5kZXJlci5qcyIsInNyYy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QkFBTDtBQUNBO0FBQ0Q7OztpQ0FFWTtBQUNYO0FBQ0EsVUFBSSxXQUFXLElBQUksTUFBTSxnQkFBVixDQUEyQixVQUEzQixFQUF1QyxVQUF2QyxFQUFtRCxDQUFuRCxFQUFzRCxFQUF0RCxDQUFmO0FBQ0EsVUFBSSxXQUFXLElBQUksTUFBTSxpQkFBVixDQUE0QjtBQUN6QyxhQUFLLE1BQU0sVUFBTixDQUFpQixXQUFqQixDQUE2QixjQUE3QixDQURvQztBQUV6QztBQUNBLHFCQUFhLElBSDRCO0FBSXpDLGlCQUFTO0FBSmdDLE9BQTVCLENBQWY7QUFNQSxVQUFJLE9BQU8sSUFBSSxNQUFNLElBQVYsQ0FBZSxRQUFmLEVBQXlCLFFBQXpCLENBQVg7O0FBRUEsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztrQkFsUmtCLFc7Ozs7Ozs7O1FDeEJMLFEsR0FBQSxRO1FBTUEsTSxHQUFBLE07QUFyQmhCOzs7Ozs7Ozs7Ozs7Ozs7QUFlTyxTQUFTLFFBQVQsR0FBb0I7QUFDekIsTUFBSSxRQUFRLEtBQVo7QUFDQSxHQUFDLFVBQVMsQ0FBVCxFQUFXO0FBQUMsUUFBRywyVEFBMlQsSUFBM1QsQ0FBZ1UsQ0FBaFUsS0FBb1UsMGtEQUEwa0QsSUFBMWtELENBQStrRCxFQUFFLE1BQUYsQ0FBUyxDQUFULEVBQVcsQ0FBWCxDQUEva0QsQ0FBdlUsRUFBcTZELFFBQVEsSUFBUjtBQUFhLEdBQS83RCxFQUFpOEQsVUFBVSxTQUFWLElBQXFCLFVBQVUsTUFBL0IsSUFBdUMsT0FBTyxLQUEvK0Q7QUFDQSxTQUFPLEtBQVA7QUFDRDs7QUFFTSxTQUFTLE1BQVQsQ0FBZ0IsUUFBaEIsRUFBMEIsTUFBMUIsRUFBa0M7QUFDdkMsU0FBTyxVQUFVLFFBQVYsR0FBcUIsVUFBckIsR0FBa0MsTUFBekM7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vL1xuLy8gV2Ugc3RvcmUgb3VyIEVFIG9iamVjdHMgaW4gYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gYH5gIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90IG92ZXJyaWRkZW4gb3Jcbi8vIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vIFdlIGFsc28gYXNzdW1lIHRoYXQgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIGF2YWlsYWJsZSB3aGVuIHRoZSBldmVudCBuYW1lXG4vLyBpcyBhbiBFUzYgU3ltYm9sLlxuLy9cbnZhciBwcmVmaXggPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSAhPT0gJ2Z1bmN0aW9uJyA/ICd+JyA6IGZhbHNlO1xuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIEV2ZW50RW1pdHRlciBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBFdmVudCBoYW5kbGVyIHRvIGJlIGNhbGxlZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgQ29udGV4dCBmb3IgZnVuY3Rpb24gZXhlY3V0aW9uLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gT25seSBlbWl0IG9uY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogTWluaW1hbCBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7IC8qIE5vdGhpbmcgdG8gc2V0ICovIH1cblxuLyoqXG4gKiBIb2xkIHRoZSBhc3NpZ25lZCBFdmVudEVtaXR0ZXJzIGJ5IG5hbWUuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNcbiAgICAsIG5hbWVzID0gW11cbiAgICAsIG5hbWU7XG5cbiAgaWYgKCFldmVudHMpIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gZXZlbnRzKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhIGxpc3Qgb2YgYXNzaWduZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnRzIHRoYXQgc2hvdWxkIGJlIGxpc3RlZC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXhpc3RzIFdlIG9ubHkgbmVlZCB0byBrbm93IGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIEVtaXQgYW4gZXZlbnQgdG8gYWxsIHJlZ2lzdGVyZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gSW5kaWNhdGlvbiBpZiB3ZSd2ZSBlbWl0dGVkIGFuIGV2ZW50LlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIG5ldyBFdmVudExpc3RlbmVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYW4gRXZlbnRMaXN0ZW5lciB0aGF0J3Mgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2Ugd2FudCB0byByZW1vdmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgdGhhdCB3ZSBuZWVkIHRvIGZpbmQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIGxpc3RlbmVycyBtYXRjaGluZyB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25jZSBsaXN0ZW5lcnMuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBldmVudHMgPSBbXTtcblxuICBpZiAoZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgICBpZiAoXG4gICAgICAgICAgIGxpc3RlbmVycy5mbiAhPT0gZm5cbiAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVycy5vbmNlKVxuICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnMuY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKVxuICAgICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgICApIHtcbiAgICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAvL1xuICBpZiAoZXZlbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgb3Igb25seSB0aGUgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2FudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG5cbiAgaWYgKGV2ZW50KSBkZWxldGUgdGhpcy5fZXZlbnRzW3ByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRdO1xuICBlbHNlIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmNvbnN0IEhFQURfRUxCT1dfT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoMC4xNTUsIC0wLjQ2NSwgLTAuMTUpO1xuY29uc3QgRUxCT1dfV1JJU1RfT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTAuMjUpO1xuY29uc3QgV1JJU1RfQ09OVFJPTExFUl9PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwLjA1KTtcbmNvbnN0IEFSTV9FWFRFTlNJT05fT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoLTAuMDgsIDAuMTQsIDAuMDgpO1xuXG5jb25zdCBFTEJPV19CRU5EX1JBVElPID0gMC40OyAvLyA0MCUgZWxib3csIDYwJSB3cmlzdC5cbmNvbnN0IEVYVEVOU0lPTl9SQVRJT19XRUlHSFQgPSAwLjQ7XG5cbmNvbnN0IE1JTl9BTkdVTEFSX1NQRUVEID0gMC42MTsgLy8gMzUgZGVncmVlcyBwZXIgc2Vjb25kIChpbiByYWRpYW5zKS5cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBhcm0gbW9kZWwgZm9yIHRoZSBEYXlkcmVhbSBjb250cm9sbGVyLiBGZWVkIGl0IGEgY2FtZXJhIGFuZFxuICogdGhlIGNvbnRyb2xsZXIuIFVwZGF0ZSBpdCBvbiBhIFJBRi5cbiAqXG4gKiBHZXQgdGhlIG1vZGVsJ3MgcG9zZSB1c2luZyBnZXRQb3NlKCkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9yaWVudGF0aW9uQXJtTW9kZWwge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmlzTGVmdEhhbmRlZCA9IGZhbHNlO1xuXG4gICAgLy8gQ3VycmVudCBhbmQgcHJldmlvdXMgY29udHJvbGxlciBvcmllbnRhdGlvbnMuXG4gICAgdGhpcy5jb250cm9sbGVyUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgdGhpcy5sYXN0Q29udHJvbGxlclEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgLy8gQ3VycmVudCBhbmQgcHJldmlvdXMgaGVhZCBvcmllbnRhdGlvbnMuXG4gICAgdGhpcy5oZWFkUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAvLyBDdXJyZW50IGhlYWQgcG9zaXRpb24uXG4gICAgdGhpcy5oZWFkUG9zID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIC8vIFBvc2l0aW9ucyBvZiBvdGhlciBqb2ludHMgKG1vc3RseSBmb3IgZGVidWdnaW5nKS5cbiAgICB0aGlzLmVsYm93UG9zID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICB0aGlzLndyaXN0UG9zID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIHRpbWVzIHRoZSBtb2RlbCB3YXMgdXBkYXRlZC5cbiAgICB0aGlzLnRpbWUgPSBudWxsO1xuICAgIHRoaXMubGFzdFRpbWUgPSBudWxsO1xuXG4gICAgLy8gUm9vdCByb3RhdGlvbi5cbiAgICB0aGlzLnJvb3RRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIC8vIEN1cnJlbnQgcG9zZSB0aGF0IHRoaXMgYXJtIG1vZGVsIGNhbGN1bGF0ZXMuXG4gICAgdGhpcy5wb3NlID0ge1xuICAgICAgb3JpZW50YXRpb246IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCksXG4gICAgICBwb3NpdGlvbjogbmV3IFRIUkVFLlZlY3RvcjMoKVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogTWV0aG9kcyB0byBzZXQgY29udHJvbGxlciBhbmQgaGVhZCBwb3NlIChpbiB3b3JsZCBjb29yZGluYXRlcykuXG4gICAqL1xuICBzZXRDb250cm9sbGVyT3JpZW50YXRpb24ocXVhdGVybmlvbikge1xuICAgIHRoaXMubGFzdENvbnRyb2xsZXJRLmNvcHkodGhpcy5jb250cm9sbGVyUSk7XG4gICAgdGhpcy5jb250cm9sbGVyUS5jb3B5KHF1YXRlcm5pb24pO1xuICB9XG5cbiAgc2V0SGVhZE9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLmhlYWRRLmNvcHkocXVhdGVybmlvbik7XG4gIH1cblxuICBzZXRIZWFkUG9zaXRpb24ocG9zaXRpb24pIHtcbiAgICB0aGlzLmhlYWRQb3MuY29weShwb3NpdGlvbik7XG4gIH1cblxuICBzZXRMZWZ0SGFuZGVkKGlzTGVmdEhhbmRlZCkge1xuICAgIC8vIFRPRE8oc211cyk6IEltcGxlbWVudCBtZSFcbiAgICB0aGlzLmlzTGVmdEhhbmRlZCA9IGlzTGVmdEhhbmRlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgb24gYSBSQUYuXG4gICAqL1xuICB1cGRhdGUoKSB7XG4gICAgdGhpcy50aW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAvLyBJZiB0aGUgY29udHJvbGxlcidzIGFuZ3VsYXIgdmVsb2NpdHkgaXMgYWJvdmUgYSBjZXJ0YWluIGFtb3VudCwgd2UgY2FuXG4gICAgLy8gYXNzdW1lIHRvcnNvIHJvdGF0aW9uIGFuZCBtb3ZlIHRoZSBlbGJvdyBqb2ludCByZWxhdGl2ZSB0byB0aGVcbiAgICAvLyBjYW1lcmEgb3JpZW50YXRpb24uXG4gICAgbGV0IGhlYWRZYXdRID0gdGhpcy5nZXRIZWFkWWF3T3JpZW50YXRpb25fKCk7XG4gICAgbGV0IHRpbWVEZWx0YSA9ICh0aGlzLnRpbWUgLSB0aGlzLmxhc3RUaW1lKSAvIDEwMDA7XG4gICAgbGV0IGFuZ2xlRGVsdGEgPSB0aGlzLnF1YXRBbmdsZV8odGhpcy5sYXN0Q29udHJvbGxlclEsIHRoaXMuY29udHJvbGxlclEpO1xuICAgIGxldCBjb250cm9sbGVyQW5ndWxhclNwZWVkID0gYW5nbGVEZWx0YSAvIHRpbWVEZWx0YTtcbiAgICBpZiAoY29udHJvbGxlckFuZ3VsYXJTcGVlZCA+IE1JTl9BTkdVTEFSX1NQRUVEKSB7XG4gICAgICAvLyBBdHRlbnVhdGUgdGhlIFJvb3Qgcm90YXRpb24gc2xpZ2h0bHkuXG4gICAgICB0aGlzLnJvb3RRLnNsZXJwKGhlYWRZYXdRLCBhbmdsZURlbHRhIC8gMTApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucm9vdFEuY29weShoZWFkWWF3USk7XG4gICAgfVxuXG4gICAgLy8gV2Ugd2FudCB0byBtb3ZlIHRoZSBlbGJvdyB1cCBhbmQgdG8gdGhlIGNlbnRlciBhcyB0aGUgdXNlciBwb2ludHMgdGhlXG4gICAgLy8gY29udHJvbGxlciB1cHdhcmRzLCBzbyB0aGF0IHRoZXkgY2FuIGVhc2lseSBzZWUgdGhlIGNvbnRyb2xsZXIgYW5kIGl0c1xuICAgIC8vIHRvb2wgdGlwcy5cbiAgICBsZXQgY29udHJvbGxlckV1bGVyID0gbmV3IFRIUkVFLkV1bGVyKCkuc2V0RnJvbVF1YXRlcm5pb24odGhpcy5jb250cm9sbGVyUSwgJ1lYWicpO1xuICAgIGxldCBjb250cm9sbGVyWERlZyA9IFRIUkVFLk1hdGgucmFkVG9EZWcoY29udHJvbGxlckV1bGVyLngpO1xuICAgIGxldCBleHRlbnNpb25SYXRpbyA9IHRoaXMuY2xhbXBfKChjb250cm9sbGVyWERlZyAtIDExKSAvICg1MCAtIDExKSwgMCwgMSk7XG5cbiAgICAvLyBDb250cm9sbGVyIG9yaWVudGF0aW9uIGluIGNhbWVyYSBzcGFjZS5cbiAgICBsZXQgY29udHJvbGxlckNhbWVyYVEgPSB0aGlzLnJvb3RRLmNsb25lKCkuaW52ZXJzZSgpO1xuICAgIGNvbnRyb2xsZXJDYW1lcmFRLm11bHRpcGx5KHRoaXMuY29udHJvbGxlclEpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGVsYm93IHBvc2l0aW9uLlxuICAgIGxldCBlbGJvd1BvcyA9IHRoaXMuZWxib3dQb3M7XG4gICAgZWxib3dQb3MuY29weSh0aGlzLmhlYWRQb3MpLmFkZChIRUFEX0VMQk9XX09GRlNFVCk7XG4gICAgbGV0IGVsYm93T2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KEFSTV9FWFRFTlNJT05fT0ZGU0VUKTtcbiAgICBlbGJvd09mZnNldC5tdWx0aXBseVNjYWxhcihleHRlbnNpb25SYXRpbyk7XG4gICAgZWxib3dQb3MuYWRkKGVsYm93T2Zmc2V0KTtcblxuICAgIC8vIENhbGN1bGF0ZSBqb2ludCBhbmdsZXMuIEdlbmVyYWxseSA0MCUgb2Ygcm90YXRpb24gYXBwbGllZCB0byBlbGJvdywgNjAlXG4gICAgLy8gdG8gd3Jpc3QsIGJ1dCBpZiBjb250cm9sbGVyIGlzIHJhaXNlZCBoaWdoZXIsIG1vcmUgcm90YXRpb24gY29tZXMgZnJvbVxuICAgIC8vIHRoZSB3cmlzdC5cbiAgICBsZXQgdG90YWxBbmdsZSA9IHRoaXMucXVhdEFuZ2xlXyhjb250cm9sbGVyQ2FtZXJhUSwgbmV3IFRIUkVFLlF1YXRlcm5pb24oKSk7XG4gICAgbGV0IHRvdGFsQW5nbGVEZWcgPSBUSFJFRS5NYXRoLnJhZFRvRGVnKHRvdGFsQW5nbGUpO1xuICAgIGxldCBsZXJwU3VwcHJlc3Npb24gPSAxIC0gTWF0aC5wb3codG90YWxBbmdsZURlZyAvIDE4MCwgNCk7IC8vIFRPRE8oc211cyk6ID8/P1xuXG4gICAgbGV0IGVsYm93UmF0aW8gPSBFTEJPV19CRU5EX1JBVElPO1xuICAgIGxldCB3cmlzdFJhdGlvID0gMSAtIEVMQk9XX0JFTkRfUkFUSU87XG4gICAgbGV0IGxlcnBWYWx1ZSA9IGxlcnBTdXBwcmVzc2lvbiAqXG4gICAgICAgIChlbGJvd1JhdGlvICsgd3Jpc3RSYXRpbyAqIGV4dGVuc2lvblJhdGlvICogRVhURU5TSU9OX1JBVElPX1dFSUdIVCk7XG5cbiAgICBsZXQgd3Jpc3RRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zbGVycChjb250cm9sbGVyQ2FtZXJhUSwgbGVycFZhbHVlKTtcbiAgICBsZXQgaW52V3Jpc3RRID0gd3Jpc3RRLmludmVyc2UoKTtcbiAgICBsZXQgZWxib3dRID0gY29udHJvbGxlckNhbWVyYVEuY2xvbmUoKS5tdWx0aXBseShpbnZXcmlzdFEpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIG91ciBmaW5hbCBjb250cm9sbGVyIHBvc2l0aW9uIGJhc2VkIG9uIGFsbCBvdXIgam9pbnQgcm90YXRpb25zXG4gICAgLy8gYW5kIGxlbmd0aHMuXG4gICAgLypcbiAgICBwb3NpdGlvbl8gPVxuICAgICAgcm9vdF9yb3RfICogKFxuICAgICAgICBjb250cm9sbGVyX3Jvb3Rfb2Zmc2V0XyArXG4yOiAgICAgIChhcm1fZXh0ZW5zaW9uXyAqIGFtdF9leHRlbnNpb24pICtcbjE6ICAgICAgZWxib3dfcm90ICogKGtDb250cm9sbGVyRm9yZWFybSArICh3cmlzdF9yb3QgKiBrQ29udHJvbGxlclBvc2l0aW9uKSlcbiAgICAgICk7XG4gICAgKi9cbiAgICBsZXQgd3Jpc3RQb3MgPSB0aGlzLndyaXN0UG9zO1xuICAgIHdyaXN0UG9zLmNvcHkoV1JJU1RfQ09OVFJPTExFUl9PRkZTRVQpO1xuICAgIHdyaXN0UG9zLmFwcGx5UXVhdGVybmlvbih3cmlzdFEpO1xuICAgIHdyaXN0UG9zLmFkZChFTEJPV19XUklTVF9PRkZTRVQpO1xuICAgIHdyaXN0UG9zLmFwcGx5UXVhdGVybmlvbihlbGJvd1EpO1xuICAgIHdyaXN0UG9zLmFkZCh0aGlzLmVsYm93UG9zKTtcblxuICAgIGxldCBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkoQVJNX0VYVEVOU0lPTl9PRkZTRVQpO1xuICAgIG9mZnNldC5tdWx0aXBseVNjYWxhcihleHRlbnNpb25SYXRpbyk7XG5cbiAgICBsZXQgcG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpLmNvcHkodGhpcy53cmlzdFBvcyk7XG4gICAgcG9zaXRpb24uYWRkKG9mZnNldCk7XG4gICAgcG9zaXRpb24uYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm9vdFEpO1xuXG4gICAgbGV0IG9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5jb3B5KHRoaXMuY29udHJvbGxlclEpO1xuXG4gICAgLy8gU2V0IHRoZSByZXN1bHRpbmcgcG9zZSBvcmllbnRhdGlvbiBhbmQgcG9zaXRpb24uXG4gICAgdGhpcy5wb3NlLm9yaWVudGF0aW9uLmNvcHkob3JpZW50YXRpb24pO1xuICAgIHRoaXMucG9zZS5wb3NpdGlvbi5jb3B5KHBvc2l0aW9uKTtcblxuICAgIHRoaXMubGFzdFRpbWUgPSB0aGlzLnRpbWU7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcG9zZSBjYWxjdWxhdGVkIGJ5IHRoZSBtb2RlbC5cbiAgICovXG4gIGdldFBvc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMucG9zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWJ1ZyBtZXRob2RzIGZvciByZW5kZXJpbmcgdGhlIGFybSBtb2RlbC5cbiAgICovXG4gIGdldEZvcmVhcm1MZW5ndGgoKSB7XG4gICAgcmV0dXJuIEVMQk9XX1dSSVNUX09GRlNFVC5sZW5ndGgoKTtcbiAgfVxuXG4gIGdldEVsYm93UG9zaXRpb24oKSB7XG4gICAgbGV0IG91dCA9IHRoaXMuZWxib3dQb3MuY2xvbmUoKTtcbiAgICByZXR1cm4gb3V0LmFwcGx5UXVhdGVybmlvbih0aGlzLnJvb3RRKTtcbiAgfVxuXG4gIGdldFdyaXN0UG9zaXRpb24oKSB7XG4gICAgbGV0IG91dCA9IHRoaXMud3Jpc3RQb3MuY2xvbmUoKTtcbiAgICByZXR1cm4gb3V0LmFwcGx5UXVhdGVybmlvbih0aGlzLnJvb3RRKTtcbiAgfVxuXG4gIGdldEhlYWRZYXdPcmllbnRhdGlvbl8oKSB7XG4gICAgbGV0IGhlYWRFdWxlciA9IG5ldyBUSFJFRS5FdWxlcigpLnNldEZyb21RdWF0ZXJuaW9uKHRoaXMuaGVhZFEsICdZWFonKTtcbiAgICBoZWFkRXVsZXIueCA9IDA7XG4gICAgaGVhZEV1bGVyLnogPSAwO1xuICAgIGxldCBkZXN0aW5hdGlvblEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihoZWFkRXVsZXIpO1xuICAgIHJldHVybiBkZXN0aW5hdGlvblE7XG4gIH1cblxuICBjbGFtcF8odmFsdWUsIG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KHZhbHVlLCBtaW4pLCBtYXgpO1xuICB9XG5cbiAgcXVhdEFuZ2xlXyhxMSwgcTIpIHtcbiAgICBsZXQgdmVjMSA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICBsZXQgdmVjMiA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICB2ZWMxLmFwcGx5UXVhdGVybmlvbihxMSk7XG4gICAgdmVjMi5hcHBseVF1YXRlcm5pb24ocTIpO1xuICAgIHJldHVybiB2ZWMxLmFuZ2xlVG8odmVjMik7XG4gIH1cbn1cbiIsImltcG9ydCBEZW1vUmVuZGVyZXIgZnJvbSAnLi9yZW5kZXJlci5qcyc7XG5cbmxldCBjb250YWluZXI7XG5sZXQgcmVuZGVyZXI7XG5sZXQgZGVtb1JlbmRlcmVyO1xubGV0IGdhbWVwYWQ7XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG5cbiAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcblxuICBsZXQgaW5mbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBpbmZvLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgaW5mby5zdHlsZS50b3AgPSAnMTBweCc7XG4gIGluZm8uc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIGluZm8uc3R5bGUudGV4dEFsaWduID0gJ2NlbnRlcic7XG4gIGluZm8uaW5uZXJIVE1MID0gJzxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vYmVlbXNvZnQvd2VidnItcGh5c2ljc1wiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyXCI+d2VidnItcGh5c2ljczwvYT4nO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaW5mbyk7XG5cbiAgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlciggeyBhbnRpYWxpYXM6IHRydWUgfSApO1xuICByZW5kZXJlci5zZXRQaXhlbFJhdGlvKCB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyApO1xuICByZW5kZXJlci5zZXRTaXplKCB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0ICk7XG4gIHJlbmRlcmVyLmdhbW1hSW5wdXQgPSB0cnVlO1xuICByZW5kZXJlci5nYW1tYU91dHB1dCA9IHRydWU7XG4gIHJlbmRlcmVyLnNoYWRvd01hcEVuYWJsZWQgPSB0cnVlO1xuXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZCggcmVuZGVyZXIuZG9tRWxlbWVudCApO1xuXG4gIHJlbmRlcmVyLnZyLmVuYWJsZWQgPSB0cnVlO1xuXG4gIGRlbW9SZW5kZXJlciA9IG5ldyBEZW1vUmVuZGVyZXIocmVuZGVyZXIuZ2V0U2l6ZSgpKTtcbiAgZGVtb1JlbmRlcmVyLmNyZWF0ZVJhZ2RvbGwoKTtcblxuICBXRUJWUi5nZXRWUkRpc3BsYXkoIGZ1bmN0aW9uICggZGV2aWNlICkge1xuXG4gICAgcmVuZGVyZXIudnIuc2V0RGV2aWNlKCBkZXZpY2UgKTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBXRUJWUi5nZXRCdXR0b24oIGRldmljZSwgcmVuZGVyZXIuZG9tRWxlbWVudCApICk7XG5cbiAgfSApO1xuXG4gIGdhbWVwYWQgPSBuZXcgVEhSRUUuRGF5ZHJlYW1Db250cm9sbGVyKCk7XG4gIGdhbWVwYWQucG9zaXRpb24uc2V0KCAwLjI1LCAtIDAuNSwgMCApO1xuICBkZW1vUmVuZGVyZXIuc2NlbmUuYWRkKCBnYW1lcGFkICk7XG5cbiAgbGV0IGdhbWVwYWRIZWxwZXIgPSBuZXcgVEhSRUUuTGluZSggbmV3IFRIUkVFLkJ1ZmZlckdlb21ldHJ5KCksIG5ldyBUSFJFRS5MaW5lQmFzaWNNYXRlcmlhbCggeyBsaW5ld2lkdGg6IDQgfSApICk7XG4gIGdhbWVwYWRIZWxwZXIuZ2VvbWV0cnkuYWRkQXR0cmlidXRlKCAncG9zaXRpb24nLCBuZXcgVEhSRUUuRmxvYXQzMkJ1ZmZlckF0dHJpYnV0ZSggWyAwLCAwLCAwLCAwLCAwLCAtIDEwIF0sIDMgKSApO1xuICBnYW1lcGFkLmFkZCggZ2FtZXBhZEhlbHBlciApO1xuXG4gIHJlbmRlcmVyLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgZnVuY3Rpb24gKCBldmVudCApIHtcblxuICAgIGdhbWVwYWRIZWxwZXIubWF0ZXJpYWwuY29sb3Iuc2V0SGV4KCBNYXRoLnJhbmRvbSgpICogMHhmZmZmZmYgKTtcblxuICB9ICk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSwgZmFsc2UgKTtcblxufVxuXG5mdW5jdGlvbiBvbkxvYWQoKSB7XG5cbiAgV0VCVlIuY2hlY2tBdmFpbGFiaWxpdHkoKS5jYXRjaChmdW5jdGlvbiAobWVzc2FnZSkge1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChXRUJWUi5nZXRNZXNzYWdlQ29udGFpbmVyKG1lc3NhZ2UpKTtcblxuICB9KTtcblxuICBpbml0KCk7XG4gIGFuaW1hdGUoKTtcbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBvbkxvYWQpO1xuXG5cbmZ1bmN0aW9uIG9uV2luZG93UmVzaXplKCkge1xuXG4gIGRlbW9SZW5kZXJlci5jYW1lcmEuYXNwZWN0ID0gd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gIGRlbW9SZW5kZXJlci5jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuXG4gIHJlbmRlcmVyLnNldFNpemUoIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKTtcblxufVxuXG5mdW5jdGlvbiBhbmltYXRlKCkge1xuXG4gIHJlbmRlcmVyLmFuaW1hdGUoIHJlbmRlciApO1xuXG59XG5cbmZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICBnYW1lcGFkLnVwZGF0ZSgpO1xuICBkZW1vUmVuZGVyZXIucmVuZGVyKCk7XG4gIHJlbmRlcmVyLnJlbmRlciggZGVtb1JlbmRlcmVyLnNjZW5lLCBkZW1vUmVuZGVyZXIuY2FtZXJhICk7XG5cbn1cbiIsImltcG9ydCBSYXlJbnB1dCBmcm9tICcuLi9yYXktaW5wdXQnXG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBuZXcgVEhSRUUuQ29sb3IoMHgwMEZGMDApO1xuY29uc3QgSElHSExJR0hUX0NPTE9SID0gbmV3IFRIUkVFLkNvbG9yKDB4MUU5MEZGKTtcbmNvbnN0IEFDVElWRV9DT0xPUiA9IG5ldyBUSFJFRS5Db2xvcigweEZGMzMzMyk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERlbW9SZW5kZXJlciB7XG5cbiAgY29uc3RydWN0b3Ioc2l6ZSkge1xuICAgIGxldCB3b3JsZDtcbiAgICBjb25zdCBkdCA9IDEgLyA2MDtcbiAgICBsZXQgY29uc3RyYWludERvd24gPSBmYWxzZTtcbiAgICBsZXQgam9pbnRCb2R5LCBjb25zdHJhaW5lZEJvZHksIHBvaW50ZXJDb25zdHJhaW50O1xuICAgIGxldCBjbGlja01hcmtlciA9IGZhbHNlO1xuICAgIGxldCBnZW9tZXRyeSwgbWF0ZXJpYWwsIG1lc2g7XG4gICAgLy8gVG8gYmUgc3luY2VkXG4gICAgbGV0IG1lc2hlcyA9IFtdLCBib2RpZXMgPSBbXTtcblxuICAgIGxldCBheGVzID0gW107XG4gICAgYXhlc1sgMCBdID0ge1xuICAgICAgdmFsdWU6IFsgMCwgMCBdXG4gICAgfTtcblxuICAgIC8vIFNldHVwIG91ciB3b3JsZFxuICAgIHdvcmxkID0gbmV3IENBTk5PTi5Xb3JsZCgpO1xuICAgIHdvcmxkLnF1YXROb3JtYWxpemVTa2lwID0gMDtcbiAgICB3b3JsZC5xdWF0Tm9ybWFsaXplRmFzdCA9IGZhbHNlO1xuXG4gICAgd29ybGQuZ3Jhdml0eS5zZXQoMCwtNCwwKTtcbiAgICB3b3JsZC5icm9hZHBoYXNlID0gbmV3IENBTk5PTi5OYWl2ZUJyb2FkcGhhc2UoKTtcblxuICAgIC8vIENyZWF0ZSBhIHBsYW5lXG4gICAgbGV0IGdyb3VuZFNoYXBlID0gbmV3IENBTk5PTi5QbGFuZSgpO1xuICAgIGxldCBncm91bmRCb2R5ID0gbmV3IENBTk5PTi5Cb2R5KHsgbWFzczogMCB9KTtcbiAgICBncm91bmRCb2R5LmFkZFNoYXBlKGdyb3VuZFNoYXBlKTtcbiAgICBncm91bmRCb2R5LnBvc2l0aW9uLnkgLT0gMTtcbiAgICBncm91bmRCb2R5LnF1YXRlcm5pb24uc2V0RnJvbUF4aXNBbmdsZShuZXcgQ0FOTk9OLlZlYzMoMSwwLDApLC1NYXRoLlBJLzIpO1xuICAgIHdvcmxkLmFkZEJvZHkoZ3JvdW5kQm9keSk7XG5cbiAgICAvLyBKb2ludCBib2R5XG4gICAgbGV0IHNoYXBlID0gbmV3IENBTk5PTi5TcGhlcmUoMC4xKTtcbiAgICBqb2ludEJvZHkgPSBuZXcgQ0FOTk9OLkJvZHkoeyBtYXNzOiAwIH0pO1xuICAgIGpvaW50Qm9keS5hZGRTaGFwZShzaGFwZSk7XG4gICAgam9pbnRCb2R5LmNvbGxpc2lvbkZpbHRlckdyb3VwID0gMDtcbiAgICBqb2ludEJvZHkuY29sbGlzaW9uRmlsdGVyTWFzayA9IDA7XG4gICAgd29ybGQuYWRkQm9keShqb2ludEJvZHkpO1xuXG4gICAgbGV0IHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgc2NlbmUuZm9nID0gbmV3IFRIUkVFLkZvZyggMHgwMDAwMDAsIDUwMCwgMTAwMDAgKTtcblxuICAgIGxldCBhc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICBsZXQgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDc1LCBhc3BlY3QsIDAuMSwgMTAwKTtcbiAgICBzY2VuZS5hZGQoY2FtZXJhKTtcblxuICAgIC8vIGxldCByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgYW50aWFsaWFzOiB0cnVlIH0pO1xuICAgIC8vIGNvbnNvbGUubG9nKCdzaXppbmcnKTtcbiAgICAvLyBjb25zb2xlLmxvZygnd2luZG93LmRldmljZVBpeGVsUmF0aW86ICcgKyB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgLy8gY29uc29sZS5sb2coJ3dpbmRvdy5pbm5lcldpZHRoOiAnICsgd2luZG93LmlubmVyV2lkdGgpO1xuICAgIC8vIGNvbnNvbGUubG9nKCd3aW5kb3cuaW5uZXJIZWlnaHQ6ICcgKyB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICAgIC8vIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoIHNjZW5lLmZvZy5jb2xvciApO1xuICAgIC8vIHJlbmRlcmVyLnNldFNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgLy8gcmVuZGVyZXIuZ2FtbWFJbnB1dCA9IHRydWU7XG4gICAgLy8gcmVuZGVyZXIuZ2FtbWFPdXRwdXQgPSB0cnVlO1xuICAgIC8vIHJlbmRlcmVyLnNoYWRvd01hcC5lbmFibGVkID0gdHJ1ZTtcbiAgICAvL1xuICAgIC8vIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgICAvLyBJbnB1dCBtYW5hZ2VyLlxuICAgIGxldCByYXlJbnB1dCA9IG5ldyBSYXlJbnB1dChjYW1lcmEpO1xuICAgIHJheUlucHV0LnNldFNpemUoc2l6ZSk7XG4gICAgcmF5SW5wdXQub24oJ3JheWRvd24nLCAob3B0X21lc2gpID0+IHsgdGhpcy5oYW5kbGVSYXlEb3duXyhvcHRfbWVzaCkgfSk7XG4gICAgcmF5SW5wdXQub24oJ3JheWRyYWcnLCAoKSA9PiB7IHRoaXMuaGFuZGxlUmF5RHJhZ18oKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5dXAnLCAob3B0X21lc2gpID0+IHsgdGhpcy5oYW5kbGVSYXlVcF8ob3B0X21lc2gpIH0pO1xuICAgIHJheUlucHV0Lm9uKCdyYXljYW5jZWwnLCAob3B0X21lc2gpID0+IHsgdGhpcy5oYW5kbGVSYXlDYW5jZWxfKG9wdF9tZXNoKSB9KTtcbiAgICByYXlJbnB1dC5vbigncmF5b3ZlcicsIChtZXNoKSA9PiB7IERlbW9SZW5kZXJlci5zZXRTZWxlY3RlZF8obWVzaCwgdHJ1ZSkgfSk7XG4gICAgcmF5SW5wdXQub24oJ3JheW91dCcsIChtZXNoKSA9PiB7IERlbW9SZW5kZXJlci5zZXRTZWxlY3RlZF8obWVzaCwgZmFsc2UpIH0pO1xuXG4gICAgLy8gQWRkIHRoZSByYXkgaW5wdXQgbWVzaCB0byB0aGUgc2NlbmUuXG4gICAgc2NlbmUuYWRkKHJheUlucHV0LmdldE1lc2goKSk7XG4gICAgLy8gVGhpcyBoZWxwcyBtb3ZlIHRoZSBjYW1lcmFcbiAgICAvLyBsZXQgZG9sbHkgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgICAvLyBkb2xseS5wb3NpdGlvbi5zZXQoIDAsIDIsIDAgKTtcbiAgICAvLyBkb2xseS5hZGQoIGNhbWVyYSApO1xuICAgIC8vIGRvbGx5LmFkZCggcmF5SW5wdXQuZ2V0TWVzaCgpICk7XG4gICAgLy8gc2NlbmUuYWRkKGRvbGx5KTtcbiAgICAvLyBjYW1lcmEucG9zaXRpb24ueSArPTI7XG5cbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICB0aGlzLnNjZW5lID0gc2NlbmU7XG4gICAgdGhpcy5yYXlJbnB1dCA9IHJheUlucHV0O1xuICAgIC8vIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgdGhpcy5kdCA9IGR0O1xuICAgIHRoaXMubWVzaGVzID0gbWVzaGVzO1xuICAgIHRoaXMuYm9kaWVzID0gYm9kaWVzO1xuICAgIHRoaXMuY2xpY2tNYXJrZXIgPSBjbGlja01hcmtlcjtcbiAgICB0aGlzLmNvbnN0cmFpbnREb3duID0gY29uc3RyYWludERvd247XG4gICAgdGhpcy5jb25zdHJhaW5lZEJvZHkgPSBjb25zdHJhaW5lZEJvZHk7XG4gICAgdGhpcy5wb2ludGVyQ29uc3RyYWludCA9IHBvaW50ZXJDb25zdHJhaW50O1xuICAgIHRoaXMuam9pbnRCb2R5ID0gam9pbnRCb2R5O1xuICAgIHRoaXMuYXhlcyA9IGF4ZXM7XG4gICAgdGhpcy50b3VjaFBhZFBvc2l0aW9uID0geyB4OiAwLCB6OiAwIH07XG5cbiAgICAvLyBHbG9iYWwgc2V0dGluZ3NcbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgc3RlcEZyZXF1ZW5jeTogNjAsXG4gICAgICBxdWF0Tm9ybWFsaXplU2tpcDogMixcbiAgICAgIHF1YXROb3JtYWxpemVGYXN0OiB0cnVlLFxuICAgICAgZ3g6IDAsXG4gICAgICBneTogMCxcbiAgICAgIGd6OiAwLFxuICAgICAgaXRlcmF0aW9uczogMyxcbiAgICAgIHRvbGVyYW5jZTogMC4wMDAxLFxuICAgICAgazogMWU2LFxuICAgICAgZDogMyxcbiAgICAgIHNjZW5lOiAwLFxuICAgICAgcGF1c2VkOiBmYWxzZSxcbiAgICAgIHJlbmRlcm1vZGU6IFwic29saWRcIixcbiAgICAgIGNvbnN0cmFpbnRzOiBmYWxzZSxcbiAgICAgIGNvbnRhY3RzOiBmYWxzZSwgIC8vIENvbnRhY3QgcG9pbnRzXG4gICAgICBjbTJjb250YWN0OiBmYWxzZSwgLy8gY2VudGVyIG9mIG1hc3MgdG8gY29udGFjdCBwb2ludHNcbiAgICAgIG5vcm1hbHM6IGZhbHNlLCAvLyBjb250YWN0IG5vcm1hbHNcbiAgICAgIGF4ZXM6IGZhbHNlLCAvLyBcImxvY2FsXCIgZnJhbWUgYXhlc1xuICAgICAgcGFydGljbGVTaXplOiAwLjEsXG4gICAgICBzaGFkb3dzOiBmYWxzZSxcbiAgICAgIGFhYmJzOiBmYWxzZSxcbiAgICAgIHByb2ZpbGluZzogZmFsc2UsXG4gICAgICBtYXhTdWJTdGVwczogMjBcbiAgICB9O1xuXG4gICAgLy8gbGlnaHRzXG4gICAgbGV0IGxpZ2h0O1xuICAgIHNjZW5lLmFkZCggbmV3IFRIUkVFLkFtYmllbnRMaWdodCggMHg2NjY2NjYgKSApO1xuXG4gICAgbGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCggMHhmZmZmZmYsIDEuNzUgKTtcbiAgICBjb25zdCBkID0gMjA7XG5cbiAgICBsaWdodC5wb3NpdGlvbi5zZXQoIGQsIGQsIGQgKTtcblxuICAgIGxpZ2h0LmNhc3RTaGFkb3cgPSB0cnVlO1xuICAgIGxpZ2h0LnNoYWRvdy5tYXBTaXplLndpZHRoPSAxMDI0O1xuICAgIGxpZ2h0LnNoYWRvdy5tYXBTaXplLndpZHRoID0gMTAyNDtcbiAgICBsaWdodC5zaGFkb3cuY2FtZXJhLmxlZnQgPSAtZDtcbiAgICBsaWdodC5zaGFkb3cuY2FtZXJhcmlnaHQgPSBkO1xuICAgIGxpZ2h0LnNoYWRvdy5jYW1lcmEudG9wID0gZDtcbiAgICBsaWdodC5zaGFkb3cuY2FtZXJhLmJvdHRvbSA9IC1kO1xuICAgIGxpZ2h0LnNoYWRvdy5jYW1lcmEuZmFyID0gMypkO1xuICAgIGxpZ2h0LnNoYWRvdy5jYW1lcmEubmVhciA9IGQ7XG5cbiAgICBzY2VuZS5hZGQoIGxpZ2h0ICk7XG5cbiAgICAvLyBmbG9vclxuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoIDEwMCwgMTAwLCAxLCAxICk7XG4gICAgLy9nZW9tZXRyeS5hcHBseU1hdHJpeCggbmV3IFRIUkVFLk1hdHJpeDQoKS5tYWtlUm90YXRpb25YKCAtTWF0aC5QSSAvIDIgKSApO1xuICAgIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoIHsgY29sb3I6IDB4Nzc3Nzc3IH0gKTtcbiAgICB0aGlzLm1hcmtlck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoeyBjb2xvcjogMHhmZjAwMDAgfSk7XG4gICAgLy9USFJFRS5Db2xvclV0aWxzLmFkanVzdEhTViggbWF0ZXJpYWwuY29sb3IsIDAsIDAsIDAuOSApO1xuICAgIG1lc2ggPSBuZXcgVEhSRUUuTWVzaCggZ2VvbWV0cnksIG1hdGVyaWFsICk7XG4gICAgLy8gbWVzaC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICBtZXNoLnF1YXRlcm5pb24uc2V0RnJvbUF4aXNBbmdsZShuZXcgVEhSRUUuVmVjdG9yMygxLDAsMCksIC1NYXRoLlBJIC8gMik7XG4gICAgLy8gbWVzaC5wb3NpdGlvbi5zZXQoMCwgLTEsIDApO1xuICAgIG1lc2gucG9zaXRpb24ueSAtPSAxO1xuICAgIG1lc2gucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gICAgc2NlbmUuYWRkKG1lc2gpO1xuICB9XG5cbiAgYWRkVmlzdWFsKGJvZHkpIHtcbiAgICAvLyBXaGF0IGdlb21ldHJ5IHNob3VsZCBiZSB1c2VkP1xuICAgIGxldCBtZXNoO1xuICAgIGlmKGJvZHkgaW5zdGFuY2VvZiBDQU5OT04uQm9keSl7XG4gICAgICBtZXNoID0gdGhpcy5zaGFwZTJtZXNoKGJvZHkpO1xuICAgIH1cbiAgICBpZihtZXNoKSB7XG4gICAgICAvLyBBZGQgYm9keVxuICAgICAgbWVzaC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAgIHRoaXMuYm9kaWVzLnB1c2goYm9keSk7XG4gICAgICB0aGlzLm1lc2hlcy5wdXNoKG1lc2gpO1xuICAgICAgdGhpcy5zY2VuZS5hZGQobWVzaCk7XG4gICAgICB0aGlzLnJheUlucHV0LmFkZChtZXNoKTtcbiAgICB9XG4gIH07XG5cbiAgY3JlYXRlUmFnZG9sbCgpe1xuICAgIGNvbnN0IHNjYWxlID0gMztcbiAgICBsZXQgcG9zaXRpb24gPSBuZXcgQ0FOTk9OLlZlYzMoMCwxMCwtNSk7XG4gICAgY29uc3QgYW5nbGVBID0gTWF0aC5QSSwgYW5nbGVCID0gTWF0aC5QSSwgdHdpc3RBbmdsZSA9IE1hdGguUEk7XG5cbiAgICBsZXQgbnVtQm9kaWVzQXRTdGFydCA9IHRoaXMud29ybGQuYm9kaWVzLmxlbmd0aDtcblxuICAgIGNvbnN0IHNob3VsZGVyc0Rpc3RhbmNlID0gMC41ICogc2NhbGUsXG4gICAgICB1cHBlckFybUxlbmd0aCA9IDAuNCAqIHNjYWxlLFxuICAgICAgbG93ZXJBcm1MZW5ndGggPSAwLjQgKiBzY2FsZSxcbiAgICAgIHVwcGVyQXJtU2l6ZSA9IDAuMiAqIHNjYWxlLFxuICAgICAgbG93ZXJBcm1TaXplID0gMC4yICogc2NhbGUsXG4gICAgICBuZWNrTGVuZ3RoID0gMC4xICogc2NhbGUsXG4gICAgICBoZWFkUmFkaXVzID0gMC4yNSAqIHNjYWxlLFxuICAgICAgdXBwZXJCb2R5TGVuZ3RoID0gMC42ICogc2NhbGUsXG4gICAgICBwZWx2aXNMZW5ndGggPSAwLjQgKiBzY2FsZSxcbiAgICAgIHVwcGVyTGVnTGVuZ3RoID0gMC41ICogc2NhbGUsXG4gICAgICB1cHBlckxlZ1NpemUgPSAwLjIgKiBzY2FsZSxcbiAgICAgIGxvd2VyTGVnU2l6ZSA9IDAuMiAqIHNjYWxlLFxuICAgICAgbG93ZXJMZWdMZW5ndGggPSAwLjUgKiBzY2FsZTtcblxuICAgIGxldCBoZWFkU2hhcGUgPSAgICAgIG5ldyBDQU5OT04uU3BoZXJlKGhlYWRSYWRpdXMpLFxuICAgICAgdXBwZXJBcm1TaGFwZSA9ICBuZXcgQ0FOTk9OLkJveChuZXcgQ0FOTk9OLlZlYzModXBwZXJBcm1MZW5ndGggKiAwLjUsIHVwcGVyQXJtU2l6ZSAqIDAuNSwgdXBwZXJBcm1TaXplICogMC41KSksXG4gICAgICBsb3dlckFybVNoYXBlID0gIG5ldyBDQU5OT04uQm94KG5ldyBDQU5OT04uVmVjMyhsb3dlckFybUxlbmd0aCAqIDAuNSwgbG93ZXJBcm1TaXplICogMC41LCBsb3dlckFybVNpemUgKiAwLjUpKSxcbiAgICAgIHVwcGVyQm9keVNoYXBlID0gbmV3IENBTk5PTi5Cb3gobmV3IENBTk5PTi5WZWMzKHNob3VsZGVyc0Rpc3RhbmNlICogMC41LCB1cHBlckJvZHlMZW5ndGggKiAwLjUsIGxvd2VyQXJtU2l6ZSAqIDAuNSkpLFxuICAgICAgcGVsdmlzU2hhcGUgPSAgICBuZXcgQ0FOTk9OLkJveChuZXcgQ0FOTk9OLlZlYzMoc2hvdWxkZXJzRGlzdGFuY2UgKiAwLjUsIHBlbHZpc0xlbmd0aCAqIDAuNSwgbG93ZXJBcm1TaXplICogMC41KSksXG4gICAgICB1cHBlckxlZ1NoYXBlID0gIG5ldyBDQU5OT04uQm94KG5ldyBDQU5OT04uVmVjMyh1cHBlckxlZ1NpemUgKiAwLjUsIHVwcGVyTGVnTGVuZ3RoICogMC41LCBsb3dlckFybVNpemUgKiAwLjUpKSxcbiAgICAgIGxvd2VyTGVnU2hhcGUgPSAgbmV3IENBTk5PTi5Cb3gobmV3IENBTk5PTi5WZWMzKGxvd2VyTGVnU2l6ZSAqIDAuNSwgbG93ZXJMZWdMZW5ndGggKiAwLjUsIGxvd2VyQXJtU2l6ZSAqIDAuNSkpO1xuXG4gICAgLy8gTG93ZXIgbGVnc1xuICAgIGxldCBsb3dlckxlZnRMZWcgPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoLXNob3VsZGVyc0Rpc3RhbmNlLzIsbG93ZXJMZWdMZW5ndGggLyAyLCAwKVxuICAgIH0pO1xuICAgIGxldCBsb3dlclJpZ2h0TGVnID0gbmV3IENBTk5PTi5Cb2R5KHtcbiAgICAgIG1hc3M6IDEsXG4gICAgICBwb3NpdGlvbjogbmV3IENBTk5PTi5WZWMzKHNob3VsZGVyc0Rpc3RhbmNlLzIsbG93ZXJMZWdMZW5ndGggLyAyLCAwKVxuICAgIH0pO1xuICAgIGxvd2VyTGVmdExlZy5hZGRTaGFwZShsb3dlckxlZ1NoYXBlKTtcbiAgICBsb3dlclJpZ2h0TGVnLmFkZFNoYXBlKGxvd2VyTGVnU2hhcGUpO1xuICAgIHRoaXMud29ybGQuYWRkQm9keShsb3dlckxlZnRMZWcpO1xuICAgIHRoaXMud29ybGQuYWRkQm9keShsb3dlclJpZ2h0TGVnKTtcbiAgICB0aGlzLmFkZFZpc3VhbChsb3dlckxlZnRMZWcpO1xuICAgIHRoaXMuYWRkVmlzdWFsKGxvd2VyUmlnaHRMZWcpO1xuXG4gICAgLy8gVXBwZXIgbGVnc1xuICAgIGxldCB1cHBlckxlZnRMZWcgPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoLXNob3VsZGVyc0Rpc3RhbmNlLzIsbG93ZXJMZWZ0TGVnLnBvc2l0aW9uLnkrbG93ZXJMZWdMZW5ndGgvMit1cHBlckxlZ0xlbmd0aCAvIDIsIDApLFxuICAgIH0pO1xuICAgIGxldCB1cHBlclJpZ2h0TGVnID0gbmV3IENBTk5PTi5Cb2R5KHtcbiAgICAgIG1hc3M6IDEsXG4gICAgICBwb3NpdGlvbjogbmV3IENBTk5PTi5WZWMzKHNob3VsZGVyc0Rpc3RhbmNlLzIsbG93ZXJSaWdodExlZy5wb3NpdGlvbi55K2xvd2VyTGVnTGVuZ3RoLzIrdXBwZXJMZWdMZW5ndGggLyAyLCAwKSxcbiAgICB9KTtcbiAgICB1cHBlckxlZnRMZWcuYWRkU2hhcGUodXBwZXJMZWdTaGFwZSk7XG4gICAgdXBwZXJSaWdodExlZy5hZGRTaGFwZSh1cHBlckxlZ1NoYXBlKTtcbiAgICB0aGlzLndvcmxkLmFkZEJvZHkodXBwZXJMZWZ0TGVnKTtcbiAgICB0aGlzLndvcmxkLmFkZEJvZHkodXBwZXJSaWdodExlZyk7XG4gICAgdGhpcy5hZGRWaXN1YWwodXBwZXJMZWZ0TGVnKTtcbiAgICB0aGlzLmFkZFZpc3VhbCh1cHBlclJpZ2h0TGVnKTtcblxuICAgIC8vIFBlbHZpc1xuICAgIGxldCBwZWx2aXMgPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoMCwgdXBwZXJMZWZ0TGVnLnBvc2l0aW9uLnkrdXBwZXJMZWdMZW5ndGgvMitwZWx2aXNMZW5ndGgvMiwgMCksXG4gICAgfSk7XG4gICAgcGVsdmlzLmFkZFNoYXBlKHBlbHZpc1NoYXBlKTtcbiAgICB0aGlzLndvcmxkLmFkZEJvZHkocGVsdmlzKTtcbiAgICB0aGlzLmFkZFZpc3VhbChwZWx2aXMpO1xuXG4gICAgLy8gVXBwZXIgYm9keVxuICAgIGxldCB1cHBlckJvZHkgPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoMCxwZWx2aXMucG9zaXRpb24ueStwZWx2aXNMZW5ndGgvMit1cHBlckJvZHlMZW5ndGgvMiwgMCksXG4gICAgfSk7XG4gICAgdXBwZXJCb2R5LmFkZFNoYXBlKHVwcGVyQm9keVNoYXBlKTtcbiAgICB0aGlzLndvcmxkLmFkZEJvZHkodXBwZXJCb2R5KTtcbiAgICB0aGlzLmFkZFZpc3VhbCh1cHBlckJvZHkpO1xuXG4gICAgLy8gSGVhZFxuICAgIGxldCBoZWFkID0gbmV3IENBTk5PTi5Cb2R5KHtcbiAgICAgIG1hc3M6IDEsXG4gICAgICBwb3NpdGlvbjogbmV3IENBTk5PTi5WZWMzKDAsdXBwZXJCb2R5LnBvc2l0aW9uLnkrdXBwZXJCb2R5TGVuZ3RoLzIraGVhZFJhZGl1cytuZWNrTGVuZ3RoLCAwKSxcbiAgICB9KTtcbiAgICBoZWFkLmFkZFNoYXBlKGhlYWRTaGFwZSk7XG4gICAgdGhpcy53b3JsZC5hZGRCb2R5KGhlYWQpO1xuICAgIHRoaXMuYWRkVmlzdWFsKGhlYWQpO1xuXG4gICAgLy8gVXBwZXIgYXJtc1xuICAgIGxldCB1cHBlckxlZnRBcm0gPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoLXNob3VsZGVyc0Rpc3RhbmNlLzItdXBwZXJBcm1MZW5ndGgvMiwgdXBwZXJCb2R5LnBvc2l0aW9uLnkrdXBwZXJCb2R5TGVuZ3RoLzIsIDApLFxuICAgIH0pO1xuICAgIGxldCB1cHBlclJpZ2h0QXJtID0gbmV3IENBTk5PTi5Cb2R5KHtcbiAgICAgIG1hc3M6IDEsXG4gICAgICBwb3NpdGlvbjogbmV3IENBTk5PTi5WZWMzKHNob3VsZGVyc0Rpc3RhbmNlLzIrdXBwZXJBcm1MZW5ndGgvMiwgdXBwZXJCb2R5LnBvc2l0aW9uLnkrdXBwZXJCb2R5TGVuZ3RoLzIsIDApLFxuICAgIH0pO1xuICAgIHVwcGVyTGVmdEFybS5hZGRTaGFwZSh1cHBlckFybVNoYXBlKTtcbiAgICB1cHBlclJpZ2h0QXJtLmFkZFNoYXBlKHVwcGVyQXJtU2hhcGUpO1xuICAgIHRoaXMud29ybGQuYWRkQm9keSh1cHBlckxlZnRBcm0pO1xuICAgIHRoaXMud29ybGQuYWRkQm9keSh1cHBlclJpZ2h0QXJtKTtcbiAgICB0aGlzLmFkZFZpc3VhbCh1cHBlckxlZnRBcm0pO1xuICAgIHRoaXMuYWRkVmlzdWFsKHVwcGVyUmlnaHRBcm0pO1xuXG4gICAgLy8gbG93ZXIgYXJtc1xuICAgIGxldCBsb3dlckxlZnRBcm0gPSBuZXcgQ0FOTk9OLkJvZHkoe1xuICAgICAgbWFzczogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgQ0FOTk9OLlZlYzMoIHVwcGVyTGVmdEFybS5wb3NpdGlvbi54IC0gbG93ZXJBcm1MZW5ndGgvMiAtIHVwcGVyQXJtTGVuZ3RoLzIsIHVwcGVyTGVmdEFybS5wb3NpdGlvbi55LCAwKVxuICAgIH0pO1xuICAgIGxldCBsb3dlclJpZ2h0QXJtID0gbmV3IENBTk5PTi5Cb2R5KHtcbiAgICAgIG1hc3M6IDEsXG4gICAgICBwb3NpdGlvbjogbmV3IENBTk5PTi5WZWMzKCB1cHBlclJpZ2h0QXJtLnBvc2l0aW9uLnggKyBsb3dlckFybUxlbmd0aC8yICsgdXBwZXJBcm1MZW5ndGgvMiwgdXBwZXJSaWdodEFybS5wb3NpdGlvbi55LCAwKVxuICAgIH0pO1xuICAgIGxvd2VyTGVmdEFybS5hZGRTaGFwZShsb3dlckFybVNoYXBlKTtcbiAgICBsb3dlclJpZ2h0QXJtLmFkZFNoYXBlKGxvd2VyQXJtU2hhcGUpO1xuICAgIHRoaXMud29ybGQuYWRkQm9keShsb3dlckxlZnRBcm0pO1xuICAgIHRoaXMud29ybGQuYWRkQm9keShsb3dlclJpZ2h0QXJtKTtcbiAgICB0aGlzLmFkZFZpc3VhbChsb3dlckxlZnRBcm0pO1xuICAgIHRoaXMuYWRkVmlzdWFsKGxvd2VyUmlnaHRBcm0pO1xuXG5cbiAgICAvLyBOZWNrIGpvaW50XG4gICAgbGV0IG5lY2tKb2ludCA9IG5ldyBDQU5OT04uQ29uZVR3aXN0Q29uc3RyYWludChoZWFkLCB1cHBlckJvZHksIHtcbiAgICAgIHBpdm90QTogbmV3IENBTk5PTi5WZWMzKDAsLWhlYWRSYWRpdXMtbmVja0xlbmd0aC8yLDApLFxuICAgICAgcGl2b3RCOiBuZXcgQ0FOTk9OLlZlYzMoMCx1cHBlckJvZHlMZW5ndGgvMiwwKSxcbiAgICAgIGF4aXNBOiBDQU5OT04uVmVjMy5VTklUX1ksXG4gICAgICBheGlzQjogQ0FOTk9OLlZlYzMuVU5JVF9ZLFxuICAgICAgYW5nbGU6IGFuZ2xlQSxcbiAgICAgIHR3aXN0QW5nbGU6IHR3aXN0QW5nbGVcbiAgICB9KTtcbiAgICB0aGlzLndvcmxkLmFkZENvbnN0cmFpbnQobmVja0pvaW50KTtcblxuICAgIC8vIEtuZWUgam9pbnRzXG4gICAgbGV0IGxlZnRLbmVlSm9pbnQgPSBuZXcgQ0FOTk9OLkNvbmVUd2lzdENvbnN0cmFpbnQobG93ZXJMZWZ0TGVnLCB1cHBlckxlZnRMZWcsIHtcbiAgICAgIHBpdm90QTogbmV3IENBTk5PTi5WZWMzKDAsIGxvd2VyTGVnTGVuZ3RoLzIsMCksXG4gICAgICBwaXZvdEI6IG5ldyBDQU5OT04uVmVjMygwLC11cHBlckxlZ0xlbmd0aC8yLDApLFxuICAgICAgYXhpc0E6IENBTk5PTi5WZWMzLlVOSVRfWSxcbiAgICAgIGF4aXNCOiBDQU5OT04uVmVjMy5VTklUX1ksXG4gICAgICBhbmdsZTogYW5nbGVBLFxuICAgICAgdHdpc3RBbmdsZTogdHdpc3RBbmdsZVxuICAgIH0pO1xuICAgIGxldCByaWdodEtuZWVKb2ludD0gbmV3IENBTk5PTi5Db25lVHdpc3RDb25zdHJhaW50KGxvd2VyUmlnaHRMZWcsIHVwcGVyUmlnaHRMZWcsIHtcbiAgICAgIHBpdm90QTogbmV3IENBTk5PTi5WZWMzKDAsIGxvd2VyTGVnTGVuZ3RoLzIsMCksXG4gICAgICBwaXZvdEI6IG5ldyBDQU5OT04uVmVjMygwLC11cHBlckxlZ0xlbmd0aC8yLDApLFxuICAgICAgYXhpc0E6IENBTk5PTi5WZWMzLlVOSVRfWSxcbiAgICAgIGF4aXNCOiBDQU5OT04uVmVjMy5VTklUX1ksXG4gICAgICBhbmdsZTogYW5nbGVBLFxuICAgICAgdHdpc3RBbmdsZTogdHdpc3RBbmdsZVxuICAgIH0pO1xuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludChsZWZ0S25lZUpvaW50KTtcbiAgICB0aGlzLndvcmxkLmFkZENvbnN0cmFpbnQocmlnaHRLbmVlSm9pbnQpO1xuXG4gICAgLy8gSGlwIGpvaW50c1xuICAgIGxldCBsZWZ0SGlwSm9pbnQgPSBuZXcgQ0FOTk9OLkNvbmVUd2lzdENvbnN0cmFpbnQodXBwZXJMZWZ0TGVnLCBwZWx2aXMsIHtcbiAgICAgIHBpdm90QTogbmV3IENBTk5PTi5WZWMzKDAsIHVwcGVyTGVnTGVuZ3RoLzIsMCksXG4gICAgICBwaXZvdEI6IG5ldyBDQU5OT04uVmVjMygtc2hvdWxkZXJzRGlzdGFuY2UvMiwtcGVsdmlzTGVuZ3RoLzIsMCksXG4gICAgICBheGlzQTogQ0FOTk9OLlZlYzMuVU5JVF9ZLFxuICAgICAgYXhpc0I6IENBTk5PTi5WZWMzLlVOSVRfWSxcbiAgICAgIGFuZ2xlOiBhbmdsZUEsXG4gICAgICB0d2lzdEFuZ2xlOiB0d2lzdEFuZ2xlXG4gICAgfSk7XG4gICAgbGV0IHJpZ2h0SGlwSm9pbnQgPSBuZXcgQ0FOTk9OLkNvbmVUd2lzdENvbnN0cmFpbnQodXBwZXJSaWdodExlZywgcGVsdmlzLCB7XG4gICAgICBwaXZvdEE6IG5ldyBDQU5OT04uVmVjMygwLCB1cHBlckxlZ0xlbmd0aC8yLDApLFxuICAgICAgcGl2b3RCOiBuZXcgQ0FOTk9OLlZlYzMoc2hvdWxkZXJzRGlzdGFuY2UvMiwtcGVsdmlzTGVuZ3RoLzIsMCksXG4gICAgICBheGlzQTogQ0FOTk9OLlZlYzMuVU5JVF9ZLFxuICAgICAgYXhpc0I6IENBTk5PTi5WZWMzLlVOSVRfWSxcbiAgICAgIGFuZ2xlOiBhbmdsZUEsXG4gICAgICB0d2lzdEFuZ2xlOiB0d2lzdEFuZ2xlXG4gICAgfSk7XG4gICAgdGhpcy53b3JsZC5hZGRDb25zdHJhaW50KGxlZnRIaXBKb2ludCk7XG4gICAgdGhpcy53b3JsZC5hZGRDb25zdHJhaW50KHJpZ2h0SGlwSm9pbnQpO1xuXG4gICAgLy8gU3BpbmVcbiAgICBsZXQgc3BpbmVKb2ludCA9IG5ldyBDQU5OT04uQ29uZVR3aXN0Q29uc3RyYWludChwZWx2aXMsIHVwcGVyQm9keSwge1xuICAgICAgcGl2b3RBOiBuZXcgQ0FOTk9OLlZlYzMoMCxwZWx2aXNMZW5ndGgvMiwwKSxcbiAgICAgIHBpdm90QjogbmV3IENBTk5PTi5WZWMzKDAsLXVwcGVyQm9keUxlbmd0aC8yLDApLFxuICAgICAgYXhpc0E6IENBTk5PTi5WZWMzLlVOSVRfWSxcbiAgICAgIGF4aXNCOiBDQU5OT04uVmVjMy5VTklUX1ksXG4gICAgICBhbmdsZTogYW5nbGVBLFxuICAgICAgdHdpc3RBbmdsZTogdHdpc3RBbmdsZVxuICAgIH0pO1xuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludChzcGluZUpvaW50KTtcblxuICAgIC8vIFNob3VsZGVyc1xuICAgIGxldCBsZWZ0U2hvdWxkZXIgPSBuZXcgQ0FOTk9OLkNvbmVUd2lzdENvbnN0cmFpbnQodXBwZXJCb2R5LCB1cHBlckxlZnRBcm0sIHtcbiAgICAgIHBpdm90QTogbmV3IENBTk5PTi5WZWMzKC1zaG91bGRlcnNEaXN0YW5jZS8yLCB1cHBlckJvZHlMZW5ndGgvMiwwKSxcbiAgICAgIHBpdm90QjogbmV3IENBTk5PTi5WZWMzKHVwcGVyQXJtTGVuZ3RoLzIsMCwwKSxcbiAgICAgIGF4aXNBOiBDQU5OT04uVmVjMy5VTklUX1gsXG4gICAgICBheGlzQjogQ0FOTk9OLlZlYzMuVU5JVF9YLFxuICAgICAgYW5nbGU6IGFuZ2xlQlxuICAgIH0pO1xuICAgIGxldCByaWdodFNob3VsZGVyPSBuZXcgQ0FOTk9OLkNvbmVUd2lzdENvbnN0cmFpbnQodXBwZXJCb2R5LCB1cHBlclJpZ2h0QXJtLCB7XG4gICAgICBwaXZvdEE6IG5ldyBDQU5OT04uVmVjMyhzaG91bGRlcnNEaXN0YW5jZS8yLCAgdXBwZXJCb2R5TGVuZ3RoLzIsMCksXG4gICAgICBwaXZvdEI6IG5ldyBDQU5OT04uVmVjMygtdXBwZXJBcm1MZW5ndGgvMiwwLDApLFxuICAgICAgYXhpc0E6IENBTk5PTi5WZWMzLlVOSVRfWCxcbiAgICAgIGF4aXNCOiBDQU5OT04uVmVjMy5VTklUX1gsXG4gICAgICBhbmdsZTogYW5nbGVCLFxuICAgICAgdHdpc3RBbmdsZTogdHdpc3RBbmdsZVxuICAgIH0pO1xuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludChsZWZ0U2hvdWxkZXIpO1xuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludChyaWdodFNob3VsZGVyKTtcblxuICAgIC8vIEVsYm93IGpvaW50XG4gICAgbGV0IGxlZnRFbGJvd0pvaW50ID0gbmV3IENBTk5PTi5Db25lVHdpc3RDb25zdHJhaW50KGxvd2VyTGVmdEFybSwgdXBwZXJMZWZ0QXJtLCB7XG4gICAgICBwaXZvdEE6IG5ldyBDQU5OT04uVmVjMyhsb3dlckFybUxlbmd0aC8yLCAwLDApLFxuICAgICAgcGl2b3RCOiBuZXcgQ0FOTk9OLlZlYzMoLXVwcGVyQXJtTGVuZ3RoLzIsMCwwKSxcbiAgICAgIGF4aXNBOiBDQU5OT04uVmVjMy5VTklUX1gsXG4gICAgICBheGlzQjogQ0FOTk9OLlZlYzMuVU5JVF9YLFxuICAgICAgYW5nbGU6IGFuZ2xlQSxcbiAgICAgIHR3aXN0QW5nbGU6IHR3aXN0QW5nbGVcbiAgICB9KTtcbiAgICBsZXQgcmlnaHRFbGJvd0pvaW50PSBuZXcgQ0FOTk9OLkNvbmVUd2lzdENvbnN0cmFpbnQobG93ZXJSaWdodEFybSwgdXBwZXJSaWdodEFybSwge1xuICAgICAgcGl2b3RBOiBuZXcgQ0FOTk9OLlZlYzMoLWxvd2VyQXJtTGVuZ3RoLzIsMCwwKSxcbiAgICAgIHBpdm90QjogbmV3IENBTk5PTi5WZWMzKHVwcGVyQXJtTGVuZ3RoLzIsMCwwKSxcbiAgICAgIGF4aXNBOiBDQU5OT04uVmVjMy5VTklUX1gsXG4gICAgICBheGlzQjogQ0FOTk9OLlZlYzMuVU5JVF9YLFxuICAgICAgYW5nbGU6IGFuZ2xlQSxcbiAgICAgIHR3aXN0QW5nbGU6IHR3aXN0QW5nbGVcbiAgICB9KTtcbiAgICB0aGlzLndvcmxkLmFkZENvbnN0cmFpbnQobGVmdEVsYm93Sm9pbnQpO1xuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludChyaWdodEVsYm93Sm9pbnQpO1xuXG4gICAgLy8gTW92ZSBhbGwgYm9keSBwYXJ0c1xuICAgIGZvciAobGV0IGkgPSBudW1Cb2RpZXNBdFN0YXJ0OyBpIDwgdGhpcy53b3JsZC5ib2RpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBib2R5ID0gdGhpcy53b3JsZC5ib2RpZXNbaV07XG4gICAgICBib2R5LnBvc2l0aW9uLnZhZGQocG9zaXRpb24sIGJvZHkucG9zaXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVBoeXNpY3MoKSB7XG4gICAgdGhpcy53b3JsZC5zdGVwKHRoaXMuZHQpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpICE9PSB0aGlzLm1lc2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLm1lc2hlc1tpXS5wb3NpdGlvbi5jb3B5KHRoaXMuYm9kaWVzW2ldLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMubWVzaGVzW2ldLnF1YXRlcm5pb24uY29weSh0aGlzLmJvZGllc1tpXS5xdWF0ZXJuaW9uKTtcbiAgICB9XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgdGhpcy5yYXlJbnB1dC51cGRhdGUoKTtcblxuICAgIGlmICh0aGlzLmNvbnN0cmFpbnREb3duKSB7XG4gICAgICAvLyAgRGlkIGFueSBheGVzIChhc3N1bWluZyBhIDJEIHRyYWNrcGFkKSB2YWx1ZXMgY2hhbmdlP1xuXG4gICAgICBsZXQgZ2FtZXBhZCA9IERlbW9SZW5kZXJlci5nZXRWUkdhbWVwYWQoKTtcbiAgICAgIGlmIChnYW1lcGFkICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChnYW1lcGFkLmF4ZXNbMF0gJiYgZ2FtZXBhZC5heGVzWzFdKSB7XG5cblxuICAgICAgICAgIGxldCBheGVzVmFsID0gdGhpcy5heGVzWzBdLnZhbHVlO1xuICAgICAgICAgIGxldCBheGlzWCA9IGdhbWVwYWQuYXhlc1swXTtcbiAgICAgICAgICBsZXQgYXhpc1kgPSBnYW1lcGFkLmF4ZXNbMV07XG5cbiAgICAgICAgICAvLyBvbmx5IGFwcGx5IGZpbHRlciBpZiBib3RoIGF4ZXMgYXJlIGJlbG93IHRocmVzaG9sZFxuICAgICAgICAgIGxldCBmaWx0ZXJlZFggPSB0aGlzLmZpbHRlckF4aXMoYXhpc1gpO1xuICAgICAgICAgIGxldCBmaWx0ZXJlZFkgPSB0aGlzLmZpbHRlckF4aXMoYXhpc1kpO1xuICAgICAgICAgIGlmICghZmlsdGVyZWRYICYmICFmaWx0ZXJlZFkpIHtcbiAgICAgICAgICAgIGF4aXNYID0gZmlsdGVyZWRYO1xuICAgICAgICAgICAgYXhpc1kgPSBmaWx0ZXJlZFk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGF4ZXNWYWxbMF0gIT09IGF4aXNYIHx8IGF4ZXNWYWxbMV0gIT09IGF4aXNZKSB7XG4gICAgICAgICAgICBheGVzVmFsWzBdID0gYXhpc1g7XG4gICAgICAgICAgICBheGVzVmFsWzFdID0gYXhpc1k7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYXhlcyBjaGFuZ2VkJywgYXhlc1ZhbCk7XG4gICAgICAgICAgICB0aGlzLnJvdGF0ZUpvaW50KGF4aXNYLCBheGlzWSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGVQaHlzaWNzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZmlyc3QgVlItZW5hYmxlZCBnYW1lcGFkLlxuICAgKi9cbiAgc3RhdGljIGdldFZSR2FtZXBhZCgpIHtcbiAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQgQVBJLCB0aGVyZSdzIG5vIGdhbWVwYWQuXG4gICAgaWYgKCFuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCBnYW1lcGFkcyA9IG5hdmlnYXRvci5nZXRHYW1lcGFkcygpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2FtZXBhZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGxldCBnYW1lcGFkID0gZ2FtZXBhZHNbaV07XG5cbiAgICAgIC8vIFRoZSBhcnJheSBtYXkgY29udGFpbiB1bmRlZmluZWQgZ2FtZXBhZHMsIHNvIGNoZWNrIGZvciB0aGF0IGFzIHdlbGwgYXNcbiAgICAgIC8vIGEgbm9uLW51bGwgcG9zZS5cbiAgICAgIGlmIChnYW1lcGFkICYmIGdhbWVwYWQucG9zZSkge1xuICAgICAgICByZXR1cm4gZ2FtZXBhZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmaWx0ZXJBeGlzKCB2ICkge1xuICAgIHRoaXMuYXhpc1RocmVzaG9sZCA9IDAuMjtcbiAgICByZXR1cm4gKCBNYXRoLmFicyggdiApID4gdGhpcy5heGlzVGhyZXNob2xkICkgPyB2IDogMDtcbiAgfVxuXG4gIGhhbmRsZVJheURvd25fKG9wdF9tZXNoKSB7XG4gICAgRGVtb1JlbmRlcmVyLnNldEFjdGlvbl8ob3B0X21lc2gsIHRydWUpO1xuXG4gICAgbGV0IHBvcyA9IHRoaXMucmF5SW5wdXQucmVuZGVyZXIucmV0aWNsZS5wb3NpdGlvbjtcbiAgICBpZihwb3Mpe1xuICAgICAgdGhpcy5jb25zdHJhaW50RG93biA9IHRydWU7XG4gICAgICAvLyBTZXQgbWFya2VyIG9uIGNvbnRhY3QgcG9pbnRcbiAgICAgIHRoaXMuc2V0Q2xpY2tNYXJrZXIocG9zLngscG9zLnkscG9zLnosdGhpcy5zY2VuZSk7XG5cbiAgICAgIC8vIFNldCB0aGUgbW92ZW1lbnQgcGxhbmVcbiAgICAgIC8vIHNldFNjcmVlblBlcnBDZW50ZXIocG9zLGNhbWVyYSk7XG5cbiAgICAgIGxldCBpZHggPSB0aGlzLm1lc2hlcy5pbmRleE9mKG9wdF9tZXNoKTtcbiAgICAgIGlmKGlkeCAhPT0gLTEpe1xuICAgICAgICB0aGlzLmFkZFBvaW50ZXJDb25zdHJhaW50KHBvcy54LHBvcy55LHBvcy56LHRoaXMuYm9kaWVzW2lkeF0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZVJheURyYWdfKCkge1xuICAgIGlmICh0aGlzLnBvaW50ZXJDb25zdHJhaW50KSB7XG4gICAgICBsZXQgcG9zID0gdGhpcy5yYXlJbnB1dC5yZW5kZXJlci5yZXRpY2xlLnBvc2l0aW9uO1xuICAgICAgaWYocG9zKXtcbiAgICAgICAgdGhpcy5zZXRDbGlja01hcmtlcihwb3MueCxwb3MueSxwb3Mueix0aGlzLnNjZW5lKTtcbiAgICAgICAgdGhpcy5tb3ZlSm9pbnRUb1BvaW50KHBvcy54LHBvcy55LHBvcy56KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVSYXlVcF8ob3B0X21lc2gpIHtcbiAgICBEZW1vUmVuZGVyZXIuc2V0QWN0aW9uXyhvcHRfbWVzaCwgZmFsc2UpO1xuXG4gICAgdGhpcy5jb25zdHJhaW50RG93biA9IGZhbHNlO1xuICAgIC8vIHJlbW92ZSB0aGUgbWFya2VyXG4gICAgdGhpcy5yZW1vdmVDbGlja01hcmtlcigpO1xuXG4gICAgdGhpcy5yZW1vdmVKb2ludENvbnN0cmFpbnQoKTtcbiAgfVxuXG4gIGhhbmRsZVJheUNhbmNlbF8ob3B0X21lc2gpIHtcbiAgICBEZW1vUmVuZGVyZXIuc2V0QWN0aW9uXyhvcHRfbWVzaCwgZmFsc2UpO1xuICB9XG5cbiAgc3RhdGljIHNldFNlbGVjdGVkXyhtZXNoLCBpc1NlbGVjdGVkKSB7XG4gICAgaWYgKG1lc2gubWF0ZXJpYWwpIHtcbiAgICAgIG1lc2gubWF0ZXJpYWwuY29sb3IgPSBpc1NlbGVjdGVkID8gSElHSExJR0hUX0NPTE9SIDogREVGQVVMVF9DT0xPUjtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgc2V0QWN0aW9uXyhvcHRfbWVzaCwgaXNBY3RpdmUpIHtcbiAgICBpZiAob3B0X21lc2ggJiYgb3B0X21lc2gubWF0ZXJpYWwpIHtcbiAgICAgIG9wdF9tZXNoLm1hdGVyaWFsLmNvbG9yID0gaXNBY3RpdmUgPyBBQ1RJVkVfQ09MT1IgOiBISUdITElHSFRfQ09MT1I7XG4gICAgICBpZiAoIWlzQWN0aXZlKSB7XG4gICAgICAgIG9wdF9tZXNoLm1hdGVyaWFsLndpcmVmcmFtZSA9ICFvcHRfbWVzaC5tYXRlcmlhbC53aXJlZnJhbWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0Q2xpY2tNYXJrZXIoeCx5LHopIHtcbiAgICBpZighdGhpcy5jbGlja01hcmtlcil7XG4gICAgICBjb25zdCBzaGFwZSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSgwLjIsIDgsIDgpO1xuICAgICAgdGhpcy5jbGlja01hcmtlciA9IG5ldyBUSFJFRS5NZXNoKHNoYXBlLCB0aGlzLm1hcmtlck1hdGVyaWFsKTtcbiAgICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuY2xpY2tNYXJrZXIpO1xuICAgIH1cbiAgICB0aGlzLmNsaWNrTWFya2VyLnZpc2libGUgPSB0cnVlO1xuICAgIHRoaXMuY2xpY2tNYXJrZXIucG9zaXRpb24uc2V0KHgseSx6KTtcbiAgfVxuXG4gIHJlbW92ZUNsaWNrTWFya2VyKCl7XG4gICAgdGhpcy5jbGlja01hcmtlci52aXNpYmxlID0gZmFsc2U7XG4gIH1cblxuICBhZGRQb2ludGVyQ29uc3RyYWludCh4LCB5LCB6LCBib2R5KSB7XG4gICAgLy8gVGhlIGNhbm5vbiBib2R5IGNvbnN0cmFpbmVkIGJ5IHRoZSBwb2ludGVyIGpvaW50XG4gICAgdGhpcy5jb25zdHJhaW5lZEJvZHkgPSBib2R5O1xuXG4gICAgLy8gVmVjdG9yIHRvIHRoZSBjbGlja2VkIHBvaW50LCByZWxhdGl2ZSB0byB0aGUgYm9keVxuICAgIGxldCB2MSA9IG5ldyBDQU5OT04uVmVjMyh4LHkseikudnN1Yih0aGlzLmNvbnN0cmFpbmVkQm9keS5wb3NpdGlvbik7XG5cbiAgICAvLyBBcHBseSBhbnRpLXF1YXRlcm5pb24gdG8gdmVjdG9yIHRvIHRyYW5zZm9ybSBpdCBpbnRvIHRoZSBsb2NhbCBib2R5IGNvb3JkaW5hdGUgc3lzdGVtXG4gICAgbGV0IGFudGlSb3QgPSB0aGlzLmNvbnN0cmFpbmVkQm9keS5xdWF0ZXJuaW9uLmludmVyc2UoKTtcbiAgICBsZXQgcGl2b3QgPSBuZXcgQ0FOTk9OLlF1YXRlcm5pb24oYW50aVJvdC54LCBhbnRpUm90LnksIGFudGlSb3QueiwgYW50aVJvdC53KS52bXVsdCh2MSk7IC8vIHBpdm90IGlzIG5vdCBpbiBsb2NhbCBib2R5IGNvb3JkaW5hdGVzXG5cbiAgICAvLyBNb3ZlIHRoZSBjYW5ub24gY2xpY2sgbWFya2VyIHBhcnRpY2xlIHRvIHRoZSBjbGljayBwb3NpdGlvblxuICAgIHRoaXMuam9pbnRCb2R5LnBvc2l0aW9uLnNldCh4LHkseik7XG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgY29uc3RyYWludFxuICAgIC8vIFRoZSBwaXZvdCBmb3IgdGhlIGpvaW50Qm9keSBpcyB6ZXJvXG4gICAgdGhpcy5wb2ludGVyQ29uc3RyYWludCA9IG5ldyBDQU5OT04uUG9pbnRUb1BvaW50Q29uc3RyYWludCh0aGlzLmNvbnN0cmFpbmVkQm9keSwgcGl2b3QsIHRoaXMuam9pbnRCb2R5LCBuZXcgQ0FOTk9OLlZlYzMoMCwwLDApKTtcblxuICAgIC8vIEFkZCB0aGUgY29uc3RyYWludCB0byB3b3JsZFxuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludCh0aGlzLnBvaW50ZXJDb25zdHJhaW50KTtcbiAgfVxuXG4gIC8vIFRoaXMgZnVuY3Rpb24gbW92ZXMgdGhlIHRyYW5zcGFyZW50IGpvaW50IGJvZHkgdG8gYSBuZXcgcG9zaXRpb24gaW4gc3BhY2VcbiAgbW92ZUpvaW50VG9Qb2ludCh4LHkseikge1xuICAgIC8vIE1vdmUgdGhlIGpvaW50IGJvZHkgdG8gYSBuZXcgcG9zaXRpb25cbiAgICB0aGlzLmpvaW50Qm9keS5wb3NpdGlvbi5zZXQoeCx5LHopO1xuICAgIHRoaXMucG9pbnRlckNvbnN0cmFpbnQudXBkYXRlKCk7XG4gIH1cblxuICAvLyBDYWxjdWxhdGUgcm90YXRpb24gZnJvbSB0d28gdmVjdG9ycyBvbiB0aGUgdG91Y2hwYWRcbiAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNDA1MjAxMjkvdGhyZWUtanMtcm90YXRlLW9iamVjdC11c2luZy1tb3VzZS1hbmQtb3JiaXQtY29udHJvbFxuICAvLyBodHRwOi8vanNmaWRkbGUubmV0L3g0bWJ5MzhlLzMvXG4gIHJvdGF0ZUpvaW50KGF4aXNYLCBheGlzWikge1xuICAgIGlmICh0aGlzLnRvdWNoUGFkUG9zaXRpb24ueCAhPT0gMCB8fCB0aGlzLnRvdWNoUGFkUG9zaXRpb24ueiAhPT0gMCkge1xuICAgICAgbGV0IGRlbHRhTW92ZSA9IHsgeDogYXhpc1ggLSB0aGlzLnRvdWNoUGFkUG9zaXRpb24ueCwgejogYXhpc1ogLSB0aGlzLnRvdWNoUGFkUG9zaXRpb24ueiB9O1xuICAgICAgaWYgKHRoaXMucG9pbnRlckNvbnN0cmFpbnQpIHtcbiAgICAgIGxldCBkZWx0YVJvdGF0aW9uUXVhdGVybmlvbiA9IG5ldyBDQU5OT04uUXVhdGVybmlvbigpXG4gICAgICAgIC5zZXRGcm9tRXVsZXIoXG4gICAgICAgICAgRGVtb1JlbmRlcmVyLnRvUmFkaWFucyhkZWx0YU1vdmUueCksXG4gICAgICAgICAgMCxcbiAgICAgICAgICBEZW1vUmVuZGVyZXIudG9SYWRpYW5zKGRlbHRhTW92ZS56KSxcbiAgICAgICAgICAnWFlaJ1xuICAgICAgICApO1xuICAgICAgICB0aGlzLmNvbnN0cmFpbmVkQm9keS5xdWF0ZXJuaW9uID0gbmV3IENBTk5PTi5RdWF0ZXJuaW9uKCkubXVsdChkZWx0YVJvdGF0aW9uUXVhdGVybmlvbiwgdGhpcy5jb25zdHJhaW5lZEJvZHkucXVhdGVybmlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMudG91Y2hQYWRQb3NpdGlvbi54ID0gYXhpc1g7XG4gICAgdGhpcy50b3VjaFBhZFBvc2l0aW9uLnogPSBheGlzWjtcbiAgfVxuXG4gIHN0YXRpYyB0b1JhZGlhbnMoYW5nbGUpIHtcbiAgICByZXR1cm4gYW5nbGUgKiAoTWF0aC5QSSAvIDE4MCk7XG4gIH1cblxuICByZW1vdmVKb2ludENvbnN0cmFpbnQoKXtcbiAgICAvLyBSZW1vdmUgY29uc3RyYWludCBmcm9tIHdvcmxkXG4gICAgdGhpcy53b3JsZC5yZW1vdmVDb25zdHJhaW50KHRoaXMucG9pbnRlckNvbnN0cmFpbnQpO1xuICAgIHRoaXMucG9pbnRlckNvbnN0cmFpbnQgPSBmYWxzZTtcbiAgICB0aGlzLnRvdWNoUGFkUG9zaXRpb24gPSB7IHg6IDAsIHo6IDAgfTtcbiAgfVxuXG4gIHNoYXBlMm1lc2goYm9keSkge1xuICAgIHZhciB3aXJlZnJhbWUgPSB0aGlzLnNldHRpbmdzLnJlbmRlck1vZGUgPT09IFwid2lyZWZyYW1lXCI7XG4gICAgdmFyIG9iaiA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgZm9yICh2YXIgbCA9IDA7IGwgPCBib2R5LnNoYXBlcy5sZW5ndGg7IGwrKykge1xuICAgICAgdmFyIHNoYXBlID0gYm9keS5zaGFwZXNbbF07XG5cbiAgICAgIHZhciBtZXNoO1xuXG4gICAgICBzd2l0Y2goc2hhcGUudHlwZSl7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuU1BIRVJFOlxuICAgICAgICAgIHZhciBzcGhlcmVfZ2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoIHNoYXBlLnJhZGl1cywgOCwgOCk7XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKCBzcGhlcmVfZ2VvbWV0cnksIHRoaXMuY3VycmVudE1hdGVyaWFsICk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuUEFSVElDTEU6XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKCB0aGlzLnBhcnRpY2xlR2VvLCB0aGlzLnBhcnRpY2xlTWF0ZXJpYWwgKTtcbiAgICAgICAgICB2YXIgcyA9IHRoaXMuc2V0dGluZ3M7XG4gICAgICAgICAgbWVzaC5zY2FsZS5zZXQocy5wYXJ0aWNsZVNpemUscy5wYXJ0aWNsZVNpemUscy5wYXJ0aWNsZVNpemUpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgQ0FOTk9OLlNoYXBlLnR5cGVzLlBMQU5FOlxuICAgICAgICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5QbGFuZUdlb21ldHJ5KDEwLCAxMCwgNCwgNCk7XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgICAgICAgIHZhciBzdWJtZXNoID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgICAgICAgdmFyIGdyb3VuZCA9IG5ldyBUSFJFRS5NZXNoKCBnZW9tZXRyeSwgdGhpcy5jdXJyZW50TWF0ZXJpYWwgKTtcbiAgICAgICAgICBncm91bmQuc2NhbGUuc2V0KDEwMCwgMTAwLCAxMDApO1xuICAgICAgICAgIHN1Ym1lc2guYWRkKGdyb3VuZCk7XG5cbiAgICAgICAgICBncm91bmQuY2FzdFNoYWRvdyA9IHRydWU7XG4gICAgICAgICAgZ3JvdW5kLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuXG4gICAgICAgICAgbWVzaC5hZGQoc3VibWVzaCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuQk9YOlxuICAgICAgICAgIHZhciBib3hfZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQm94R2VvbWV0cnkoICBzaGFwZS5oYWxmRXh0ZW50cy54KjIsXG4gICAgICAgICAgICBzaGFwZS5oYWxmRXh0ZW50cy55KjIsXG4gICAgICAgICAgICBzaGFwZS5oYWxmRXh0ZW50cy56KjIgKTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIGJveF9nZW9tZXRyeSwgdGhpcy5jdXJyZW50TWF0ZXJpYWwgKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5DT05WRVhQT0xZSEVEUk9OOlxuICAgICAgICAgIHZhciBnZW8gPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICAgICAgICAgIC8vIEFkZCB2ZXJ0aWNlc1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhcGUudmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB2ID0gc2hhcGUudmVydGljZXNbaV07XG4gICAgICAgICAgICBnZW8udmVydGljZXMucHVzaChuZXcgVEhSRUUuVmVjdG9yMyh2LngsIHYueSwgdi56KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBzaGFwZS5mYWNlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgZmFjZSA9IHNoYXBlLmZhY2VzW2ldO1xuXG4gICAgICAgICAgICAvLyBhZGQgdHJpYW5nbGVzXG4gICAgICAgICAgICB2YXIgYSA9IGZhY2VbMF07XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMTsgaiA8IGZhY2UubGVuZ3RoIC0gMTsgaisrKSB7XG4gICAgICAgICAgICAgIHZhciBiID0gZmFjZVtqXTtcbiAgICAgICAgICAgICAgdmFyIGMgPSBmYWNlW2ogKyAxXTtcbiAgICAgICAgICAgICAgZ2VvLmZhY2VzLnB1c2gobmV3IFRIUkVFLkZhY2UzKGEsIGIsIGMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZ2VvLmNvbXB1dGVCb3VuZGluZ1NwaGVyZSgpO1xuICAgICAgICAgIGdlby5jb21wdXRlRmFjZU5vcm1hbHMoKTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIGdlbywgdGhpcy5jdXJyZW50TWF0ZXJpYWwgKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5IRUlHSFRGSUVMRDpcbiAgICAgICAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICAgICAgICAgIHZhciB2MCA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MSA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MiA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIGZvciAodmFyIHhpID0gMDsgeGkgPCBzaGFwZS5kYXRhLmxlbmd0aCAtIDE7IHhpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHlpID0gMDsgeWkgPCBzaGFwZS5kYXRhW3hpXS5sZW5ndGggLSAxOyB5aSsrKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgMjsgaysrKSB7XG4gICAgICAgICAgICAgICAgc2hhcGUuZ2V0Q29udmV4VHJpYW5nbGVQaWxsYXIoeGksIHlpLCBrPT09MCk7XG4gICAgICAgICAgICAgICAgdjAuY29weShzaGFwZS5waWxsYXJDb252ZXgudmVydGljZXNbMF0pO1xuICAgICAgICAgICAgICAgIHYxLmNvcHkoc2hhcGUucGlsbGFyQ29udmV4LnZlcnRpY2VzWzFdKTtcbiAgICAgICAgICAgICAgICB2Mi5jb3B5KHNoYXBlLnBpbGxhckNvbnZleC52ZXJ0aWNlc1syXSk7XG4gICAgICAgICAgICAgICAgdjAudmFkZChzaGFwZS5waWxsYXJPZmZzZXQsIHYwKTtcbiAgICAgICAgICAgICAgICB2MS52YWRkKHNoYXBlLnBpbGxhck9mZnNldCwgdjEpO1xuICAgICAgICAgICAgICAgIHYyLnZhZGQoc2hhcGUucGlsbGFyT2Zmc2V0LCB2Mik7XG4gICAgICAgICAgICAgICAgZ2VvbWV0cnkudmVydGljZXMucHVzaChcbiAgICAgICAgICAgICAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKHYwLngsIHYwLnksIHYwLnopLFxuICAgICAgICAgICAgICAgICAgbmV3IFRIUkVFLlZlY3RvcjModjEueCwgdjEueSwgdjEueiksXG4gICAgICAgICAgICAgICAgICBuZXcgVEhSRUUuVmVjdG9yMyh2Mi54LCB2Mi55LCB2Mi56KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSBnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggLSAzO1xuICAgICAgICAgICAgICAgIGdlb21ldHJ5LmZhY2VzLnB1c2gobmV3IFRIUkVFLkZhY2UzKGksIGkrMSwgaSsyKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nU3BoZXJlKCk7XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCB0aGlzLmN1cnJlbnRNYXRlcmlhbCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuVFJJTUVTSDpcbiAgICAgICAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICAgICAgICAgIHZhciB2MCA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MSA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MiA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhcGUuaW5kaWNlcy5sZW5ndGggLyAzOyBpKyspIHtcbiAgICAgICAgICAgIHNoYXBlLmdldFRyaWFuZ2xlVmVydGljZXMoaSwgdjAsIHYxLCB2Mik7XG4gICAgICAgICAgICBnZW9tZXRyeS52ZXJ0aWNlcy5wdXNoKFxuICAgICAgICAgICAgICBuZXcgVEhSRUUuVmVjdG9yMyh2MC54LCB2MC55LCB2MC56KSxcbiAgICAgICAgICAgICAgbmV3IFRIUkVFLlZlY3RvcjModjEueCwgdjEueSwgdjEueiksXG4gICAgICAgICAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKHYyLngsIHYyLnksIHYyLnopXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdmFyIGogPSBnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggLSAzO1xuICAgICAgICAgICAgZ2VvbWV0cnkuZmFjZXMucHVzaChuZXcgVEhSRUUuRmFjZTMoaiwgaisxLCBqKzIpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nU3BoZXJlKCk7XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCB0aGlzLmN1cnJlbnRNYXRlcmlhbCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBcIlZpc3VhbCB0eXBlIG5vdCByZWNvZ25pemVkOiBcIitzaGFwZS50eXBlO1xuICAgICAgfVxuXG4gICAgICBtZXNoLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgICAgbWVzaC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAgIGlmKG1lc2guY2hpbGRyZW4pe1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxtZXNoLmNoaWxkcmVuLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICBtZXNoLmNoaWxkcmVuW2ldLmNhc3RTaGFkb3cgPSB0cnVlO1xuICAgICAgICAgIG1lc2guY2hpbGRyZW5baV0ucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gICAgICAgICAgaWYobWVzaC5jaGlsZHJlbltpXSl7XG4gICAgICAgICAgICBmb3IodmFyIGo9MDsgajxtZXNoLmNoaWxkcmVuW2ldLmxlbmd0aDsgaisrKXtcbiAgICAgICAgICAgICAgbWVzaC5jaGlsZHJlbltpXS5jaGlsZHJlbltqXS5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgbWVzaC5jaGlsZHJlbltpXS5jaGlsZHJlbltqXS5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIG8gPSBib2R5LnNoYXBlT2Zmc2V0c1tsXTtcbiAgICAgIHZhciBxID0gYm9keS5zaGFwZU9yaWVudGF0aW9uc1tsXTtcbiAgICAgIG1lc2gucG9zaXRpb24uc2V0KG8ueCwgby55LCBvLnopO1xuICAgICAgbWVzaC5xdWF0ZXJuaW9uLnNldChxLngsIHEueSwgcS56LCBxLncpO1xuXG4gICAgICBvYmouYWRkKG1lc2gpO1xuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcbmltcG9ydCBJbnRlcmFjdGlvbk1vZGVzIGZyb20gJy4vcmF5LWludGVyYWN0aW9uLW1vZGVzJ1xuaW1wb3J0IHtpc01vYmlsZX0gZnJvbSAnLi91dGlsJ1xuXG5jb25zdCBEUkFHX0RJU1RBTkNFX1BYID0gMTA7XG5cbi8qKlxuICogRW51bWVyYXRlcyBhbGwgcG9zc2libGUgaW50ZXJhY3Rpb24gbW9kZXMuIFNldHMgdXAgYWxsIGV2ZW50IGhhbmRsZXJzIChtb3VzZSxcbiAqIHRvdWNoLCBldGMpLCBpbnRlcmZhY2VzIHdpdGggZ2FtZXBhZCBBUEkuXG4gKlxuICogRW1pdHMgZXZlbnRzOlxuICogICAgYWN0aW9uOiBJbnB1dCBpcyBhY3RpdmF0ZWQgKG1vdXNlZG93biwgdG91Y2hzdGFydCwgZGF5ZHJlYW0gY2xpY2ssIHZpdmUgdHJpZ2dlcikuXG4gKiAgICByZWxlYXNlOiBJbnB1dCBpcyBkZWFjdGl2YXRlZCAobW91c2V1cCwgdG91Y2hlbmQsIGRheWRyZWFtIHJlbGVhc2UsIHZpdmUgcmVsZWFzZSkuXG4gKiAgICBjYW5jZWw6IElucHV0IGlzIGNhbmNlbGVkIChlZy4gd2Ugc2Nyb2xsZWQgaW5zdGVhZCBvZiB0YXBwaW5nIG9uIG1vYmlsZS9kZXNrdG9wKS5cbiAqICAgIHBvaW50ZXJtb3ZlKDJEIHBvc2l0aW9uKTogVGhlIHBvaW50ZXIgaXMgbW92ZWQgKG1vdXNlIG9yIHRvdWNoKS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmF5Q29udHJvbGxlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKG9wdF9lbCkge1xuICAgIHN1cGVyKCk7XG4gICAgbGV0IGVsID0gb3B0X2VsIHx8IHdpbmRvdztcblxuICAgIC8vIEhhbmRsZSBpbnRlcmFjdGlvbnMuXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlRG93bl8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZV8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZVVwXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5vblRvdWNoU3RhcnRfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmVfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kXy5iaW5kKHRoaXMpKTtcblxuICAgIC8vIFRoZSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlci5cbiAgICB0aGlzLnBvaW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIC8vIFRoZSBwcmV2aW91cyBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlci5cbiAgICB0aGlzLmxhc3RQb2ludGVyID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAvLyBQb3NpdGlvbiBvZiBwb2ludGVyIGluIE5vcm1hbGl6ZWQgRGV2aWNlIENvb3JkaW5hdGVzIChOREMpLlxuICAgIHRoaXMucG9pbnRlck5kYyA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgLy8gSG93IG11Y2ggd2UgaGF2ZSBkcmFnZ2VkIChpZiB3ZSBhcmUgZHJhZ2dpbmcpLlxuICAgIHRoaXMuZHJhZ0Rpc3RhbmNlID0gMDtcbiAgICAvLyBBcmUgd2UgZHJhZ2dpbmcgb3Igbm90LlxuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgIC8vIElzIHBvaW50ZXIgYWN0aXZlIG9yIG5vdC5cbiAgICB0aGlzLmlzVG91Y2hBY3RpdmUgPSBmYWxzZTtcbiAgICAvLyBJcyB0aGlzIGEgc3ludGhldGljIG1vdXNlIGV2ZW50P1xuICAgIHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50ID0gZmFsc2U7XG5cbiAgICAvLyBHYW1lcGFkIGV2ZW50cy5cbiAgICB0aGlzLmdhbWVwYWQgPSBudWxsO1xuXG4gICAgLy8gVlIgRXZlbnRzLlxuICAgIGlmICghbmF2aWdhdG9yLmdldFZSRGlzcGxheXMpIHtcbiAgICAgIGNvbnNvbGUud2FybignV2ViVlIgQVBJIG5vdCBhdmFpbGFibGUhIENvbnNpZGVyIHVzaW5nIHRoZSB3ZWJ2ci1wb2x5ZmlsbC4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKS50aGVuKChkaXNwbGF5cykgPT4ge1xuICAgICAgICB0aGlzLnZyRGlzcGxheSA9IGRpc3BsYXlzWzBdO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0SW50ZXJhY3Rpb25Nb2RlKCkge1xuICAgIC8vIFRPRE86IERlYnVnZ2luZyBvbmx5LlxuICAgIC8vcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuREFZRFJFQU07XG5cbiAgICB2YXIgZ2FtZXBhZCA9IHRoaXMuZ2V0VlJHYW1lcGFkXygpO1xuXG4gICAgaWYgKGdhbWVwYWQpIHtcbiAgICAgIGxldCBwb3NlID0gZ2FtZXBhZC5wb3NlO1xuICAgICAgLy8gSWYgdGhlcmUncyBhIGdhbWVwYWQgY29ubmVjdGVkLCBkZXRlcm1pbmUgaWYgaXQncyBEYXlkcmVhbSBvciBhIFZpdmUuXG4gICAgICBpZiAocG9zZS5oYXNQb3NpdGlvbikge1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9zZS5oYXNPcmllbnRhdGlvbikge1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCwgaXQgbWlnaHQgYmUgQ2FyZGJvYXJkLCBtYWdpYyB3aW5kb3cgb3IgZGVza3RvcC5cbiAgICAgIGlmIChpc01vYmlsZSgpKSB7XG4gICAgICAgIC8vIEVpdGhlciBDYXJkYm9hcmQgb3IgbWFnaWMgd2luZG93LCBkZXBlbmRpbmcgb24gd2hldGhlciB3ZSBhcmVcbiAgICAgICAgLy8gcHJlc2VudGluZy5cbiAgICAgICAgaWYgKHRoaXMudnJEaXNwbGF5ICYmIHRoaXMudnJEaXNwbGF5LmlzUHJlc2VudGluZykge1xuICAgICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzBET0Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVE9VQ0g7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIG11c3QgYmUgb24gZGVza3RvcC5cbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuTU9VU0U7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEJ5IGRlZmF1bHQsIHVzZSBUT1VDSC5cbiAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDtcbiAgfVxuXG4gIGdldEdhbWVwYWRQb3NlKCkge1xuICAgIGxldCBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XG4gICAgcmV0dXJuIGdhbWVwYWQucG9zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaWYgdGhlcmUgaXMgYW4gYWN0aXZlIHRvdWNoIGV2ZW50IGdvaW5nIG9uLlxuICAgKiBPbmx5IHJlbGV2YW50IG9uIHRvdWNoIGRldmljZXNcbiAgICovXG4gIGdldElzVG91Y2hBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNUb3VjaEFjdGl2ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBjbGljayBpcyB0aGUgY2FyZGJvYXJkLWNvbXBhdGlibGUgZmFsbGJhY2tcbiAgICogY2xpY2sgb24gRGF5ZHJlYW0gY29udHJvbGxlcnMgc28gdGhhdCB3ZSBjYW4gZGVkdXBsaWNhdGUgaXQuXG4gICAqIFRPRE8oa2xhdXN3KTogSXQgd291bGQgYmUgbmljZSB0byBiZSBhYmxlIHRvIG1vdmUgaW50ZXJhY3Rpb25zXG4gICAqIHRvIHRoaXMgZXZlbnQgc2luY2UgaXQgY291bnRzIGFzIGEgdXNlciBhY3Rpb24gd2hpbGUgY29udHJvbGxlclxuICAgKiBjbGlja3MgZG9uJ3QuIEJ1dCB0aGF0IHdvdWxkIHJlcXVpcmUgbGFyZ2VyIHJlZmFjdG9yaW5nLlxuICAgKi9cbiAgaXNDYXJkYm9hcmRDb21wYXRDbGljayhlKSB7XG4gICAgbGV0IG1vZGUgPSB0aGlzLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIGlmIChtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRiAmJiBlLnNjcmVlblggPT0gMCAmJiBlLnNjcmVlblkgPT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHNldFNpemUoc2l6ZSkge1xuICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgbGV0IG1vZGUgPSB0aGlzLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIGlmIChtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRiB8fCBtb2RlID09IEludGVyYWN0aW9uTW9kZXMuVlJfNkRPRikge1xuICAgICAgLy8gSWYgd2UncmUgZGVhbGluZyB3aXRoIGEgZ2FtZXBhZCwgY2hlY2sgZXZlcnkgYW5pbWF0aW9uIGZyYW1lIGZvciBhXG4gICAgICAvLyBwcmVzc2VkIGFjdGlvbi5cbiAgICAgIGxldCBpc0dhbWVwYWRQcmVzc2VkID0gdGhpcy5nZXRHYW1lcGFkQnV0dG9uUHJlc3NlZF8oKTtcbiAgICAgIGlmIChpc0dhbWVwYWRQcmVzc2VkICYmICF0aGlzLndhc0dhbWVwYWRQcmVzc2VkKSB7XG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xuICAgICAgfVxuICAgICAgaWYgKCFpc0dhbWVwYWRQcmVzc2VkICYmIHRoaXMud2FzR2FtZXBhZFByZXNzZWQpIHtcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZW1pdCgncmF5dXAnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMud2FzR2FtZXBhZFByZXNzZWQgPSBpc0dhbWVwYWRQcmVzc2VkO1xuXG4gICAgICBpZiAodGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICAgIHRoaXMuZW1pdCgncmF5ZHJhZycpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldEdhbWVwYWRCdXR0b25QcmVzc2VkXygpIHtcbiAgICB2YXIgZ2FtZXBhZCA9IHRoaXMuZ2V0VlJHYW1lcGFkXygpO1xuICAgIGlmICghZ2FtZXBhZCkge1xuICAgICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkLCB0aGUgYnV0dG9uIHdhcyBub3QgcHJlc3NlZC5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgZm9yIGNsaWNrcy5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGdhbWVwYWQuYnV0dG9ucy5sZW5ndGg7ICsraikge1xuICAgICAgaWYgKGdhbWVwYWQuYnV0dG9uc1tqXS5wcmVzc2VkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBvbk1vdXNlRG93bl8oZSkge1xuICAgIGlmICh0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCkgcmV0dXJuO1xuICAgIGlmICh0aGlzLmlzQ2FyZGJvYXJkQ29tcGF0Q2xpY2soZSkpIHJldHVybjtcblxuICAgIHRoaXMuc3RhcnREcmFnZ2luZ18oZSk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG4gIH1cblxuICBvbk1vdXNlTW92ZV8oZSkge1xuICAgIGlmICh0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCkgcmV0dXJuO1xuXG4gICAgdGhpcy51cGRhdGVQb2ludGVyXyhlKTtcbiAgICB0aGlzLnVwZGF0ZURyYWdEaXN0YW5jZV8oKTtcbiAgICB0aGlzLmVtaXQoJ3BvaW50ZXJtb3ZlJywgdGhpcy5wb2ludGVyTmRjKTtcbiAgfVxuXG4gIG9uTW91c2VVcF8oZSkge1xuICAgIHZhciBpc1N5bnRoZXRpYyA9IHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50O1xuICAgIHRoaXMuaXNTeW50aGV0aWNNb3VzZUV2ZW50ID0gZmFsc2U7XG4gICAgaWYgKGlzU3ludGhldGljKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaXNDYXJkYm9hcmRDb21wYXRDbGljayhlKSkgcmV0dXJuO1xuXG4gICAgdGhpcy5lbmREcmFnZ2luZ18oKTtcbiAgfVxuXG4gIG9uVG91Y2hTdGFydF8oZSkge1xuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IHRydWU7XG4gICAgdmFyIHQgPSBlLnRvdWNoZXNbMF07XG4gICAgdGhpcy5zdGFydERyYWdnaW5nXyh0KTtcbiAgICB0aGlzLnVwZGF0ZVRvdWNoUG9pbnRlcl8oZSk7XG5cbiAgICB0aGlzLmVtaXQoJ3BvaW50ZXJtb3ZlJywgdGhpcy5wb2ludGVyTmRjKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nKTtcbiAgfVxuXG4gIG9uVG91Y2hNb3ZlXyhlKSB7XG4gICAgdGhpcy51cGRhdGVUb3VjaFBvaW50ZXJfKGUpO1xuICAgIHRoaXMudXBkYXRlRHJhZ0Rpc3RhbmNlXygpO1xuICB9XG5cbiAgb25Ub3VjaEVuZF8oZSkge1xuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XG5cbiAgICAvLyBTdXBwcmVzcyBkdXBsaWNhdGUgZXZlbnRzIGZyb20gc3ludGhldGljIG1vdXNlIGV2ZW50cy5cbiAgICB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCA9IHRydWU7XG4gICAgdGhpcy5pc1RvdWNoQWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICB1cGRhdGVUb3VjaFBvaW50ZXJfKGUpIHtcbiAgICAvLyBJZiB0aGVyZSdzIG5vIHRvdWNoZXMgYXJyYXksIGlnbm9yZS5cbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS53YXJuKCdSZWNlaXZlZCB0b3VjaCBldmVudCB3aXRoIG5vIHRvdWNoZXMuJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0ID0gZS50b3VjaGVzWzBdO1xuICAgIHRoaXMudXBkYXRlUG9pbnRlcl8odCk7XG4gIH1cblxuICB1cGRhdGVQb2ludGVyXyhlKSB7XG4gICAgLy8gSG93IG11Y2ggdGhlIHBvaW50ZXIgbW92ZWQuXG4gICAgdGhpcy5wb2ludGVyLnNldChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gICAgdGhpcy5wb2ludGVyTmRjLnggPSAoZS5jbGllbnRYIC8gdGhpcy5zaXplLndpZHRoKSAqIDIgLSAxO1xuICAgIHRoaXMucG9pbnRlck5kYy55ID0gLSAoZS5jbGllbnRZIC8gdGhpcy5zaXplLmhlaWdodCkgKiAyICsgMTtcbiAgfVxuXG4gIHVwZGF0ZURyYWdEaXN0YW5jZV8oKSB7XG4gICAgaWYgKHRoaXMuaXNEcmFnZ2luZykge1xuICAgICAgdmFyIGRpc3RhbmNlID0gdGhpcy5sYXN0UG9pbnRlci5zdWIodGhpcy5wb2ludGVyKS5sZW5ndGgoKTtcbiAgICAgIHRoaXMuZHJhZ0Rpc3RhbmNlICs9IGRpc3RhbmNlO1xuICAgICAgdGhpcy5sYXN0UG9pbnRlci5jb3B5KHRoaXMucG9pbnRlcik7XG5cblxuICAgICAgLy9jb25zb2xlLmxvZygnZHJhZ0Rpc3RhbmNlJywgdGhpcy5kcmFnRGlzdGFuY2UpO1xuICAgICAgaWYgKHRoaXMuZHJhZ0Rpc3RhbmNlID4gRFJBR19ESVNUQU5DRV9QWCkge1xuICAgICAgICB0aGlzLmVtaXQoJ3JheWNhbmNlbCcpO1xuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzdGFydERyYWdnaW5nXyhlKSB7XG4gICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmxhc3RQb2ludGVyLnNldChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gIH1cblxuICBlbmREcmFnZ2luZ18oKSB7XG4gICAgaWYgKHRoaXMuZHJhZ0Rpc3RhbmNlIDwgRFJBR19ESVNUQU5DRV9QWCkge1xuICAgICAgdGhpcy5lbWl0KCdyYXl1cCcpO1xuICAgIH1cbiAgICB0aGlzLmRyYWdEaXN0YW5jZSA9IDA7XG4gICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZmlyc3QgVlItZW5hYmxlZCBnYW1lcGFkLlxuICAgKi9cbiAgZ2V0VlJHYW1lcGFkXygpIHtcbiAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQgQVBJLCB0aGVyZSdzIG5vIGdhbWVwYWQuXG4gICAgaWYgKCFuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBnYW1lcGFkcyA9IG5hdmlnYXRvci5nZXRHYW1lcGFkcygpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2FtZXBhZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBnYW1lcGFkID0gZ2FtZXBhZHNbaV07XG5cbiAgICAgIC8vIFRoZSBhcnJheSBtYXkgY29udGFpbiB1bmRlZmluZWQgZ2FtZXBhZHMsIHNvIGNoZWNrIGZvciB0aGF0IGFzIHdlbGwgYXNcbiAgICAgIC8vIGEgbm9uLW51bGwgcG9zZS5cbiAgICAgIGlmIChnYW1lcGFkICYmIGdhbWVwYWQucG9zZSkge1xuICAgICAgICByZXR1cm4gZ2FtZXBhZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBPcmllbnRhdGlvbkFybU1vZGVsIGZyb20gJy4vb3JpZW50YXRpb24tYXJtLW1vZGVsJ1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuaW1wb3J0IFJheVJlbmRlcmVyIGZyb20gJy4vcmF5LXJlbmRlcmVyJ1xuaW1wb3J0IFJheUNvbnRyb2xsZXIgZnJvbSAnLi9yYXktY29udHJvbGxlcidcbmltcG9ydCBJbnRlcmFjdGlvbk1vZGVzIGZyb20gJy4vcmF5LWludGVyYWN0aW9uLW1vZGVzJ1xuXG4vKipcbiAqIEFQSSB3cmFwcGVyIGZvciB0aGUgaW5wdXQgbGlicmFyeS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmF5SW5wdXQgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihjYW1lcmEsIG9wdF9lbCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFJheVJlbmRlcmVyKGNhbWVyYSk7XG4gICAgdGhpcy5jb250cm9sbGVyID0gbmV3IFJheUNvbnRyb2xsZXIob3B0X2VsKTtcblxuICAgIC8vIEFybSBtb2RlbCBuZWVkZWQgdG8gdHJhbnNmb3JtIGNvbnRyb2xsZXIgb3JpZW50YXRpb24gaW50byBwcm9wZXIgcG9zZS5cbiAgICB0aGlzLmFybU1vZGVsID0gbmV3IE9yaWVudGF0aW9uQXJtTW9kZWwoKTtcblxuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5ZG93bicsIHRoaXMub25SYXlEb3duXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheXVwJywgdGhpcy5vblJheVVwXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheWNhbmNlbCcsIHRoaXMub25SYXlDYW5jZWxfLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncG9pbnRlcm1vdmUnLCB0aGlzLm9uUG9pbnRlck1vdmVfLmJpbmQodGhpcykpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5ZHJhZycsIHRoaXMub25SYXlEcmFnXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnJlbmRlcmVyLm9uKCdyYXlvdmVyJywgKG1lc2gpID0+IHsgdGhpcy5lbWl0KCdyYXlvdmVyJywgbWVzaCkgfSk7XG4gICAgdGhpcy5yZW5kZXJlci5vbigncmF5b3V0JywgKG1lc2gpID0+IHsgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKSB9KTtcblxuICAgIC8vIEJ5IGRlZmF1bHQsIHB1dCB0aGUgcG9pbnRlciBvZmZzY3JlZW4uXG4gICAgdGhpcy5wb2ludGVyTmRjID0gbmV3IFRIUkVFLlZlY3RvcjIoMSwgMSk7XG5cbiAgICAvLyBFdmVudCBoYW5kbGVycy5cbiAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gIH1cblxuICBhZGQob2JqZWN0LCBoYW5kbGVycykge1xuICAgIHRoaXMucmVuZGVyZXIuYWRkKG9iamVjdCwgaGFuZGxlcnMpO1xuICAgIHRoaXMuaGFuZGxlcnNbb2JqZWN0LmlkXSA9IGhhbmRsZXJzO1xuICB9XG5cbiAgcmVtb3ZlKG9iamVjdCkge1xuICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlKG9iamVjdCk7XG4gICAgZGVsZXRlIHRoaXMuaGFuZGxlcnNbb2JqZWN0LmlkXVxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIGxldCBsb29rQXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbG9va0F0LmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcblxuICAgIGxldCBtb2RlID0gdGhpcy5jb250cm9sbGVyLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLk1PVVNFOlxuICAgICAgICAvLyBEZXNrdG9wIG1vdXNlIG1vZGUsIG1vdXNlIGNvb3JkaW5hdGVzIGFyZSB3aGF0IG1hdHRlcnMuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9pbnRlcih0aGlzLnBvaW50ZXJOZGMpO1xuICAgICAgICAvLyBIaWRlIHRoZSByYXkgYW5kIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkoZmFsc2UpO1xuXG4gICAgICAgIC8vIEluIG1vdXNlIG1vZGUgcmF5IHJlbmRlcmVyIGlzIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlRPVUNIOlxuICAgICAgICAvLyBNb2JpbGUgbWFnaWMgd2luZG93IG1vZGUuIFRvdWNoIGNvb3JkaW5hdGVzIG1hdHRlciwgYnV0IHdlIHdhbnQgdG9cbiAgICAgICAgLy8gaGlkZSB0aGUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb2ludGVyKHRoaXMucG9pbnRlck5kYyk7XG5cbiAgICAgICAgLy8gSGlkZSB0aGUgcmF5IGFuZCB0aGUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eShmYWxzZSk7XG5cbiAgICAgICAgLy8gSW4gdG91Y2ggbW9kZSB0aGUgcmF5IHJlbmRlcmVyIGlzIG9ubHkgYWN0aXZlIG9uIHRvdWNoLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0aGlzLmNvbnRyb2xsZXIuZ2V0SXNUb3VjaEFjdGl2ZSgpKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl8wRE9GOlxuICAgICAgICAvLyBDYXJkYm9hcmQgbW9kZSwgd2UncmUgZGVhbGluZyB3aXRoIGEgZ2F6ZSByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKHRoaXMuY2FtZXJhLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcblxuICAgICAgICAvLyBSZXRpY2xlIG9ubHkuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XG5cbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0Y6XG4gICAgICAgIC8vIERheWRyZWFtLCBvdXIgb3JpZ2luIGlzIHNsaWdodGx5IG9mZiAoZGVwZW5kaW5nIG9uIGhhbmRlZG5lc3MpLlxuICAgICAgICAvLyBCdXQgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoZSBvcmllbnRhdGlvbiBmcm9tIHRoZSBnYW1lcGFkLlxuICAgICAgICAvLyBUT0RPKHNtdXMpOiBJbXBsZW1lbnQgdGhlIHJlYWwgYXJtIG1vZGVsLlxuICAgICAgICB2YXIgcG9zZSA9IHRoaXMuY29udHJvbGxlci5nZXRHYW1lcGFkUG9zZSgpO1xuXG4gICAgICAgIC8vIERlYnVnIG9ubHk6IHVzZSBjYW1lcmEgYXMgaW5wdXQgY29udHJvbGxlci5cbiAgICAgICAgLy9sZXQgY29udHJvbGxlck9yaWVudGF0aW9uID0gdGhpcy5jYW1lcmEucXVhdGVybmlvbjtcbiAgICAgICAgbGV0IGNvbnRyb2xsZXJPcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuZnJvbUFycmF5KHBvc2Uub3JpZW50YXRpb24pO1xuXG4gICAgICAgIC8vIFRyYW5zZm9ybSB0aGUgY29udHJvbGxlciBpbnRvIHRoZSBjYW1lcmEgY29vcmRpbmF0ZSBzeXN0ZW0uXG4gICAgICAgIC8qXG4gICAgICAgIGNvbnRyb2xsZXJPcmllbnRhdGlvbi5tdWx0aXBseShcbiAgICAgICAgICAgIG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUF4aXNBbmdsZShuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKSwgTWF0aC5QSSkpO1xuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ueCAqPSAtMTtcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLnogKj0gLTE7XG4gICAgICAgICovXG5cbiAgICAgICAgLy8gRmVlZCBjYW1lcmEgYW5kIGNvbnRyb2xsZXIgaW50byB0aGUgYXJtIG1vZGVsLlxuICAgICAgICB0aGlzLmFybU1vZGVsLnNldEhlYWRPcmllbnRhdGlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkUG9zaXRpb24odGhpcy5jYW1lcmEucG9zaXRpb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnNldENvbnRyb2xsZXJPcmllbnRhdGlvbihjb250cm9sbGVyT3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnVwZGF0ZSgpO1xuXG4gICAgICAgIC8vIEdldCByZXN1bHRpbmcgcG9zZSBhbmQgY29uZmlndXJlIHRoZSByZW5kZXJlci5cbiAgICAgICAgbGV0IG1vZGVsUG9zZSA9IHRoaXMuYXJtTW9kZWwuZ2V0UG9zZSgpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKG1vZGVsUG9zZS5wb3NpdGlvbik7XG4gICAgICAgIC8vdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbihuZXcgVEhSRUUuVmVjdG9yMygpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihtb2RlbFBvc2Uub3JpZW50YXRpb24pO1xuICAgICAgICAvL3RoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24oY29udHJvbGxlck9yaWVudGF0aW9uKTtcblxuICAgICAgICAvLyBTaG93IHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KHRydWUpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GOlxuICAgICAgICAvLyBWaXZlLCBvcmlnaW4gZGVwZW5kcyBvbiB0aGUgcG9zaXRpb24gb2YgdGhlIGNvbnRyb2xsZXIuXG4gICAgICAgIC8vIFRPRE8oc211cykuLi5cbiAgICAgICAgdmFyIHBvc2UgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0R2FtZXBhZFBvc2UoKTtcblxuICAgICAgICAvLyBDaGVjayB0aGF0IHRoZSBwb3NlIGlzIHZhbGlkLlxuICAgICAgICBpZiAoIXBvc2Uub3JpZW50YXRpb24gfHwgIXBvc2UucG9zaXRpb24pIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgZ2FtZXBhZCBwb3NlLiBDYW5cXCd0IHVwZGF0ZSByYXkuJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5mcm9tQXJyYXkocG9zZS5vcmllbnRhdGlvbik7XG4gICAgICAgIGxldCBwb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuZnJvbUFycmF5KHBvc2UucG9zaXRpb24pO1xuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24ob3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKHBvc2l0aW9uKTtcblxuICAgICAgICAvLyBTaG93IHJheSBhbmQgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KHRydWUpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Vua25vd24gaW50ZXJhY3Rpb24gbW9kZS4nKTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXJlci51cGRhdGUoKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIudXBkYXRlKCk7XG4gIH1cblxuICBzZXRTaXplKHNpemUpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIuc2V0U2l6ZShzaXplKTtcbiAgfVxuXG4gIGdldE1lc2goKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0UmV0aWNsZVJheU1lc2goKTtcbiAgfVxuXG4gIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXRPcmlnaW4oKTtcbiAgfVxuXG4gIGdldERpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXREaXJlY3Rpb24oKTtcbiAgfVxuXG4gIGdldFJpZ2h0RGlyZWN0aW9uKCkge1xuICAgIGxldCBsb29rQXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbG9va0F0LmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcbiAgICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoKS5jcm9zc1ZlY3RvcnMobG9va0F0LCB0aGlzLmNhbWVyYS51cCk7XG4gIH1cblxuICBvblJheURvd25fKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheURvd25fJyk7XG5cbiAgICAvLyBGb3JjZSB0aGUgcmVuZGVyZXIgdG8gcmF5Y2FzdC5cbiAgICB0aGlzLnJlbmRlcmVyLnVwZGF0ZSgpO1xuICAgIGxldCBtZXNoID0gdGhpcy5yZW5kZXJlci5nZXRTZWxlY3RlZE1lc2goKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nLCBtZXNoKTtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICB9XG5cbiAgb25SYXlEcmFnXygpIHtcbiAgICB0aGlzLnJlbmRlcmVyLnNldERyYWdnaW5nKHRydWUpO1xuICAgIHRoaXMuZW1pdCgncmF5ZHJhZycpO1xuICB9XG5cbiAgb25SYXlVcF8oZSkge1xuICAgIC8vY29uc29sZS5sb2coJ29uUmF5VXBfJyk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXREcmFnZ2luZyhmYWxzZSk7XG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5dXAnLCBtZXNoKTtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKGZhbHNlKTtcbiAgfVxuXG4gIG9uUmF5Q2FuY2VsXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlDYW5jZWxfJyk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXREcmFnZ2luZyhmYWxzZSk7XG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5Y2FuY2VsJywgbWVzaCk7XG4gIH1cblxuICBvblBvaW50ZXJNb3ZlXyhuZGMpIHtcbiAgICB0aGlzLnBvaW50ZXJOZGMuY29weShuZGMpO1xuICB9XG5cbiAgc2V0QXJtTW9kZWxIZWFkUG9zaXRpb24ocG9zKSB7XG4gICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkUG9zaXRpb24ocG9zKTtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEludGVyYWN0aW9uTW9kZXMgPSB7XG4gIE1PVVNFOiAxLFxuICBUT1VDSDogMixcbiAgVlJfMERPRjogMyxcbiAgVlJfM0RPRjogNCxcbiAgVlJfNkRPRjogNVxufTtcblxuZXhwb3J0IHsgSW50ZXJhY3Rpb25Nb2RlcyBhcyBkZWZhdWx0IH07XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQge2Jhc2U2NH0gZnJvbSAnLi91dGlsJ1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuXG5jb25zdCBSRVRJQ0xFX0RJU1RBTkNFID0gMztcbmNvbnN0IElOTkVSX1JBRElVUyA9IDAuMDI7XG5jb25zdCBPVVRFUl9SQURJVVMgPSAwLjA0O1xuY29uc3QgUkFZX1JBRElVUyA9IDAuMDI7XG5jb25zdCBHUkFESUVOVF9JTUFHRSA9IGJhc2U2NCgnaW1hZ2UvcG5nJywgJ2lWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFJQUFBQUNBQ0FZQUFBRERQbUhMQUFBQmRrbEVRVlI0bk8zV3dYSEVRQXdEUWNpbi9GT1d3K0JqdWlQWUIycTRHMm5QOTMzUDlTTzQ4MjR6Z0RBRGlET0F1SGZiMy9VanVLTUFjUVlRWndCeC9nQnhDaENuQUhFS0VLY0FjUW9RcHdCeENoQ25BSEVHRUdjQWNmNEFjUW9RWndCeEJoQm5BSEVHRUdjQWNRWVFad0J4QmhCbkFIRUdFR2NBY1FZUVp3QnhCaEJuQUhIdnR0LzFJN2lqQUhFR0VHY0FjZjRBY1FvUVp3QnhUa0NjQXNRWlFKd1RFS2NBY1FvUXB3QnhCaERuQk1RcFFKd0N4Q2xBbkFMRUtVQ2NBc1FwUUp3Q3hDbEFuQUxFS1VDY0FzUXBRSndCeERrQmNRb1Fwd0J4Q2hDbkFIRUtFS2NBY1FvUXB3QnhDaENuQUhFS0VHY0FjVTVBbkFMRUtVQ2NBc1FaUUp3VEVLY0FjUVlRNXdURUtVQ2NBY1FaUUp3L1FKd0N4QmxBbkFIRUdVQ2NBY1FaUUp3QnhCbEFuQUhFR1VDY0FjUVpRSndCeEJsQW5BSEVHVURjdSsyNWZnUjNGQ0RPQU9JTUlNNGZJRTRCNGhRZ1RnSGlGQ0JPQWVJVUlFNEI0aFFnemdEaURDRE9IeUJPQWVJTUlNNEE0djRCLzVJRjllRDZReGdBQUFBQVNVVk9SSzVDWUlJPScpO1xuXG4vKipcbiAqIEhhbmRsZXMgcmF5IGlucHV0IHNlbGVjdGlvbiBmcm9tIGZyYW1lIG9mIHJlZmVyZW5jZSBvZiBhbiBhcmJpdHJhcnkgb2JqZWN0LlxuICpcbiAqIFRoZSBzb3VyY2Ugb2YgdGhlIHJheSBpcyBmcm9tIHZhcmlvdXMgbG9jYXRpb25zOlxuICpcbiAqIERlc2t0b3A6IG1vdXNlLlxuICogTWFnaWMgd2luZG93OiB0b3VjaC5cbiAqIENhcmRib2FyZDogY2FtZXJhLlxuICogRGF5ZHJlYW06IDNET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cbiAqIFZpdmU6IDZET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cbiAqXG4gKiBFbWl0cyBzZWxlY3Rpb24gZXZlbnRzOlxuICogICAgIHJheW92ZXIobWVzaCk6IFRoaXMgbWVzaCB3YXMgc2VsZWN0ZWQuXG4gKiAgICAgcmF5b3V0KG1lc2gpOiBUaGlzIG1lc2ggd2FzIHVuc2VsZWN0ZWQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheVJlbmRlcmVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY2FtZXJhLCBvcHRfcGFyYW1zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXG4gICAgdmFyIHBhcmFtcyA9IG9wdF9wYXJhbXMgfHwge307XG5cbiAgICAvLyBXaGljaCBvYmplY3RzIGFyZSBpbnRlcmFjdGl2ZSAoa2V5ZWQgb24gaWQpLlxuICAgIHRoaXMubWVzaGVzID0ge307XG5cbiAgICAvLyBXaGljaCBvYmplY3RzIGFyZSBjdXJyZW50bHkgc2VsZWN0ZWQgKGtleWVkIG9uIGlkKS5cbiAgICB0aGlzLnNlbGVjdGVkID0ge307XG5cbiAgICAvLyBUaGUgcmF5Y2FzdGVyLlxuICAgIHRoaXMucmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuXG4gICAgLy8gUG9zaXRpb24gYW5kIG9yaWVudGF0aW9uLCBpbiBhZGRpdGlvbi5cbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICB0aGlzLm9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIHRoaXMucm9vdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgLy8gQWRkIHRoZSByZXRpY2xlIG1lc2ggdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cbiAgICB0aGlzLnJldGljbGUgPSB0aGlzLmNyZWF0ZVJldGljbGVfKCk7XG4gICAgdGhpcy5yb290LmFkZCh0aGlzLnJldGljbGUpO1xuXG4gICAgLy8gQWRkIHRoZSByYXkgdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cbiAgICB0aGlzLnJheSA9IHRoaXMuY3JlYXRlUmF5XygpO1xuICAgIHRoaXMucm9vdC5hZGQodGhpcy5yYXkpO1xuXG4gICAgLy8gSG93IGZhciB0aGUgcmV0aWNsZSBpcyBjdXJyZW50bHkgZnJvbSB0aGUgcmV0aWNsZSBvcmlnaW4uXG4gICAgdGhpcy5yZXRpY2xlRGlzdGFuY2UgPSBSRVRJQ0xFX0RJU1RBTkNFO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGFuIG9iamVjdCBzbyB0aGF0IGl0IGNhbiBiZSBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICBhZGQob2JqZWN0KSB7XG4gICAgdGhpcy5tZXNoZXNbb2JqZWN0LmlkXSA9IG9iamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmV2ZW50IGFuIG9iamVjdCBmcm9tIGJlaW5nIGludGVyYWN0ZWQgd2l0aC5cbiAgICovXG4gIHJlbW92ZShvYmplY3QpIHtcbiAgICB2YXIgaWQgPSBvYmplY3QuaWQ7XG4gICAgaWYgKHRoaXMubWVzaGVzW2lkXSkge1xuICAgICAgLy8gSWYgdGhlcmUncyBubyBleGlzdGluZyBtZXNoLCB3ZSBjYW4ndCByZW1vdmUgaXQuXG4gICAgICBkZWxldGUgdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGN1cnJlbnRseSBzZWxlY3RlZCwgcmVtb3ZlIGl0LlxuICAgIGlmICh0aGlzLnNlbGVjdGVkW2lkXSkge1xuICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbb2JqZWN0LmlkXTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgLy8gRG8gdGhlIHJheWNhc3RpbmcgYW5kIGlzc3VlIHZhcmlvdXMgZXZlbnRzIGFzIG5lZWRlZC5cbiAgICBmb3IgKGxldCBpZCBpbiB0aGlzLm1lc2hlcykge1xuICAgICAgbGV0IG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG4gICAgICBsZXQgaW50ZXJzZWN0cyA9IHRoaXMucmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdChtZXNoLCB0cnVlKTtcbiAgICAgIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdVbmV4cGVjdGVkOiBtdWx0aXBsZSBtZXNoZXMgaW50ZXJzZWN0ZWQuJyk7XG4gICAgICB9XG4gICAgICBsZXQgaXNJbnRlcnNlY3RlZCA9IChpbnRlcnNlY3RzLmxlbmd0aCA+IDApO1xuICAgICAgbGV0IGlzU2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkW2lkXTtcblxuICAgICAgLy8gSWYgaXQncyBuZXdseSBzZWxlY3RlZCwgc2VuZCByYXlvdmVyLlxuICAgICAgaWYgKGlzSW50ZXJzZWN0ZWQgJiYgIWlzU2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFtpZF0gPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgIHRoaXMuZW1pdCgncmF5b3ZlcicsIG1lc2gpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0J3Mgbm8gbG9uZ2VyIGludGVyc2VjdGVkLCBzZW5kIHJheW91dC5cbiAgICAgIGlmICghaXNJbnRlcnNlY3RlZCAmJiBpc1NlbGVjdGVkICYmICF0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbaWRdO1xuICAgICAgICB0aGlzLm1vdmVSZXRpY2xlXyhudWxsKTtcbiAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0ludGVyc2VjdGVkKSB7XG4gICAgICAgIHRoaXMubW92ZVJldGljbGVfKGludGVyc2VjdHMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmlnaW4gb2YgdGhlIHJheS5cbiAgICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvciBQb3NpdGlvbiBvZiB0aGUgb3JpZ2luIG9mIHRoZSBwaWNraW5nIHJheS5cbiAgICovXG4gIHNldFBvc2l0aW9uKHZlY3Rvcikge1xuICAgIHRoaXMucG9zaXRpb24uY29weSh2ZWN0b3IpO1xuICAgIHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW4uY29weSh2ZWN0b3IpO1xuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xuICB9XG5cbiAgZ2V0T3JpZ2luKCkge1xuICAgIHJldHVybiB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRpcmVjdGlvbiBvZiB0aGUgcmF5LlxuICAgKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yIFVuaXQgdmVjdG9yIGNvcnJlc3BvbmRpbmcgdG8gZGlyZWN0aW9uLlxuICAgKi9cbiAgc2V0T3JpZW50YXRpb24ocXVhdGVybmlvbikge1xuICAgIHRoaXMub3JpZW50YXRpb24uY29weShxdWF0ZXJuaW9uKTtcblxuICAgIHZhciBwb2ludEF0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpLmFwcGx5UXVhdGVybmlvbihxdWF0ZXJuaW9uKTtcbiAgICB0aGlzLnJheWNhc3Rlci5yYXkuZGlyZWN0aW9uLmNvcHkocG9pbnRBdClcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgfVxuXG4gIGdldERpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb2ludGVyIG9uIHRoZSBzY3JlZW4gZm9yIGNhbWVyYSArIHBvaW50ZXIgYmFzZWQgcGlja2luZy4gVGhpc1xuICAgKiBzdXBlcnNjZWRlcyBvcmlnaW4gYW5kIGRpcmVjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtWZWN0b3IyfSB2ZWN0b3IgVGhlIHBvc2l0aW9uIG9mIHRoZSBwb2ludGVyIChzY3JlZW4gY29vcmRzKS5cbiAgICovXG4gIHNldFBvaW50ZXIodmVjdG9yKSB7XG4gICAgdGhpcy5yYXljYXN0ZXIuc2V0RnJvbUNhbWVyYSh2ZWN0b3IsIHRoaXMuY2FtZXJhKTtcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtZXNoLCB3aGljaCBpbmNsdWRlcyByZXRpY2xlIGFuZC9vciByYXkuIFRoaXMgbWVzaCBpcyB0aGVuIGFkZGVkXG4gICAqIHRvIHRoZSBzY2VuZS5cbiAgICovXG4gIGdldFJldGljbGVSYXlNZXNoKCkge1xuICAgIHJldHVybiB0aGlzLnJvb3Q7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIG9iamVjdCBpbiB0aGUgc2NlbmUuXG4gICAqL1xuICBnZXRTZWxlY3RlZE1lc2goKSB7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICBsZXQgbWVzaCA9IG51bGw7XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5zZWxlY3RlZCkge1xuICAgICAgY291bnQgKz0gMTtcbiAgICAgIG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG4gICAgfVxuICAgIGlmIChjb3VudCA+IDEpIHtcbiAgICAgIGNvbnNvbGUud2FybignTW9yZSB0aGFuIG9uZSBtZXNoIHNlbGVjdGVkLicpO1xuICAgIH1cbiAgICByZXR1cm4gbWVzaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlcyBhbmQgc2hvd3MgdGhlIHJldGljbGUuXG4gICAqL1xuICBzZXRSZXRpY2xlVmlzaWJpbGl0eShpc1Zpc2libGUpIHtcbiAgICB0aGlzLnJldGljbGUudmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIG9yIGRpc2FibGVzIHRoZSByYXljYXN0aW5nIHJheSB3aGljaCBncmFkdWFsbHkgZmFkZXMgb3V0IGZyb21cbiAgICogdGhlIG9yaWdpbi5cbiAgICovXG4gIHNldFJheVZpc2liaWxpdHkoaXNWaXNpYmxlKSB7XG4gICAgdGhpcy5yYXkudmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGFuZCBkaXNhYmxlcyB0aGUgcmF5Y2FzdGVyLiBGb3IgdG91Y2gsIHdoZXJlIGZpbmdlciB1cCBtZWFucyB3ZVxuICAgKiBzaG91bGRuJ3QgYmUgcmF5Y2FzdGluZy5cbiAgICovXG4gIHNldEFjdGl2ZShpc0FjdGl2ZSkge1xuICAgIC8vIElmIG5vdGhpbmcgY2hhbmdlZCwgZG8gbm90aGluZy5cbiAgICBpZiAodGhpcy5pc0FjdGl2ZSA9PSBpc0FjdGl2ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUT0RPKHNtdXMpOiBTaG93IHRoZSByYXkgb3IgcmV0aWNsZSBhZGp1c3QgaW4gcmVzcG9uc2UuXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGlzQWN0aXZlO1xuXG4gICAgaWYgKCFpc0FjdGl2ZSkge1xuICAgICAgdGhpcy5tb3ZlUmV0aWNsZV8obnVsbCk7XG4gICAgICBmb3IgKGxldCBpZCBpbiB0aGlzLnNlbGVjdGVkKSB7XG4gICAgICAgIGxldCBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgICAgICBkZWxldGUgdGhpcy5zZWxlY3RlZFtpZF07XG4gICAgICAgIHRoaXMuZW1pdCgncmF5b3V0JywgbWVzaCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0RHJhZ2dpbmcoaXNEcmFnZ2luZykge1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGlzRHJhZ2dpbmc7XG4gIH1cblxuICB1cGRhdGVSYXljYXN0ZXJfKCkge1xuICAgIHZhciByYXkgPSB0aGlzLnJheWNhc3Rlci5yYXk7XG5cbiAgICAvLyBQb3NpdGlvbiB0aGUgcmV0aWNsZSBhdCBhIGRpc3RhbmNlLCBhcyBjYWxjdWxhdGVkIGZyb20gdGhlIG9yaWdpbiBhbmRcbiAgICAvLyBkaXJlY3Rpb24uXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5yZXRpY2xlLnBvc2l0aW9uO1xuICAgIHBvc2l0aW9uLmNvcHkocmF5LmRpcmVjdGlvbik7XG4gICAgcG9zaXRpb24ubXVsdGlwbHlTY2FsYXIodGhpcy5yZXRpY2xlRGlzdGFuY2UpO1xuICAgIHBvc2l0aW9uLmFkZChyYXkub3JpZ2luKTtcblxuICAgIC8vIFNldCBwb3NpdGlvbiBhbmQgb3JpZW50YXRpb24gb2YgdGhlIHJheSBzbyB0aGF0IGl0IGdvZXMgZnJvbSBvcmlnaW4gdG9cbiAgICAvLyByZXRpY2xlLlxuICAgIHZhciBkZWx0YSA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShyYXkuZGlyZWN0aW9uKTtcbiAgICBkZWx0YS5tdWx0aXBseVNjYWxhcih0aGlzLnJldGljbGVEaXN0YW5jZSk7XG4gICAgdGhpcy5yYXkuc2NhbGUueSA9IGRlbHRhLmxlbmd0aCgpO1xuICAgIHZhciBhcnJvdyA9IG5ldyBUSFJFRS5BcnJvd0hlbHBlcihyYXkuZGlyZWN0aW9uLCByYXkub3JpZ2luKTtcbiAgICB0aGlzLnJheS5yb3RhdGlvbi5jb3B5KGFycm93LnJvdGF0aW9uKTtcbiAgICB0aGlzLnJheS5wb3NpdGlvbi5hZGRWZWN0b3JzKHJheS5vcmlnaW4sIGRlbHRhLm11bHRpcGx5U2NhbGFyKDAuNSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGdlb21ldHJ5IG9mIHRoZSByZXRpY2xlLlxuICAgKi9cbiAgY3JlYXRlUmV0aWNsZV8oKSB7XG4gICAgLy8gQ3JlYXRlIGEgc3BoZXJpY2FsIHJldGljbGUuXG4gICAgbGV0IGlubmVyR2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoSU5ORVJfUkFESVVTLCAzMiwgMzIpO1xuICAgIGxldCBpbm5lck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgIGNvbG9yOiAweGZmZmZmZixcbiAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgb3BhY2l0eTogMC45XG4gICAgfSk7XG4gICAgbGV0IGlubmVyID0gbmV3IFRIUkVFLk1lc2goaW5uZXJHZW9tZXRyeSwgaW5uZXJNYXRlcmlhbCk7XG5cbiAgICBsZXQgb3V0ZXJHZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeShPVVRFUl9SQURJVVMsIDMyLCAzMik7XG4gICAgbGV0IG91dGVyTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IDB4MzMzMzMzLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjNcbiAgICB9KTtcbiAgICBsZXQgb3V0ZXIgPSBuZXcgVEhSRUUuTWVzaChvdXRlckdlb21ldHJ5LCBvdXRlck1hdGVyaWFsKTtcblxuICAgIGxldCByZXRpY2xlID0gbmV3IFRIUkVFLkdyb3VwKCk7XG4gICAgcmV0aWNsZS5hZGQoaW5uZXIpO1xuICAgIHJldGljbGUuYWRkKG91dGVyKTtcbiAgICByZXR1cm4gcmV0aWNsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlcyB0aGUgcmV0aWNsZSB0byBhIHBvc2l0aW9uIHNvIHRoYXQgaXQncyBqdXN0IGluIGZyb250IG9mIHRoZSBtZXNoIHRoYXRcbiAgICogaXQgaW50ZXJzZWN0ZWQgd2l0aC5cbiAgICovXG4gIG1vdmVSZXRpY2xlXyhpbnRlcnNlY3Rpb25zKSB7XG4gICAgLy8gSWYgbm8gaW50ZXJzZWN0aW9uLCByZXR1cm4gdGhlIHJldGljbGUgdG8gdGhlIGRlZmF1bHQgcG9zaXRpb24uXG4gICAgbGV0IGRpc3RhbmNlID0gUkVUSUNMRV9ESVNUQU5DRTtcbiAgICBpZiAoaW50ZXJzZWN0aW9ucykge1xuICAgICAgLy8gT3RoZXJ3aXNlLCBkZXRlcm1pbmUgdGhlIGNvcnJlY3QgZGlzdGFuY2UuXG4gICAgICBsZXQgaW50ZXIgPSBpbnRlcnNlY3Rpb25zWzBdO1xuICAgICAgZGlzdGFuY2UgPSBpbnRlci5kaXN0YW5jZTtcbiAgICB9XG5cbiAgICB0aGlzLnJldGljbGVEaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNyZWF0ZVJheV8oKSB7XG4gICAgLy8gQ3JlYXRlIGEgY3lsaW5kcmljYWwgcmF5LlxuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5DeWxpbmRlckdlb21ldHJ5KFJBWV9SQURJVVMsIFJBWV9SQURJVVMsIDEsIDMyKTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgbWFwOiBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKEdSQURJRU5UX0lNQUdFKSxcbiAgICAgIC8vY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjNcbiAgICB9KTtcbiAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG5cbiAgICByZXR1cm4gbWVzaDtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTW9iaWxlKCkge1xuICB2YXIgY2hlY2sgPSBmYWxzZTtcbiAgKGZ1bmN0aW9uKGEpe2lmKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcmlzfGtpbmRsZXxsZ2UgfG1hZW1vfG1pZHB8bW1wfG1vYmlsZS4rZmlyZWZveHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyBjZXx4ZGF8eGlpbm8vaS50ZXN0KGEpfHwvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KGEuc3Vic3RyKDAsNCkpKWNoZWNrID0gdHJ1ZX0pKG5hdmlnYXRvci51c2VyQWdlbnR8fG5hdmlnYXRvci52ZW5kb3J8fHdpbmRvdy5vcGVyYSk7XG4gIHJldHVybiBjaGVjaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2U2NChtaW1lVHlwZSwgYmFzZTY0KSB7XG4gIHJldHVybiAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgYmFzZTY0O1xufVxuIl19
