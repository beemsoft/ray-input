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

var _rayInput = require('../ray-input');

var _rayInput2 = _interopRequireDefault(_rayInput);

var _sceneBuilder = require('./sceneBuilder.js');

var _sceneBuilder2 = _interopRequireDefault(_sceneBuilder);

var _physicsHandler = require('./physicsHandler.js');

var _physicsHandler2 = _interopRequireDefault(_physicsHandler);

var _rayHandler = require('./rayHandler.js');

var _rayHandler2 = _interopRequireDefault(_rayHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var renderer = void 0;
var camera = void 0,
    scene = void 0,
    gamepad = void 0,
    rayInput = void 0;
var guiInputHelper = null;
var isDatGuiVisible = false;
var gui = void 0;
var sceneBuilder = void 0;
var physicsHandler = void 0;
var rayHandler = void 0;

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xCCCCCC);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.vr.enabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
  camera.position.y += 2;
  scene = new THREE.Scene();

  rayInput = new _rayInput2.default(camera);
  rayInput.setSize(renderer.getSize());

  var cameraGroup = new THREE.Group();
  cameraGroup.position.set(0, 0, 0);
  cameraGroup.add(camera);
  cameraGroup.add(rayInput.getMesh());
  scene.add(cameraGroup);
  // rayInput.setCameraGroup(cameraGroup);

  gamepad = new THREE.DaydreamController();
  gamepad.position.set(0, 0, 0);

  WEBVR.getVRDisplay(function (display) {
    renderer.vr.setDevice(display);
    document.body.appendChild(WEBVR.getButton(display, renderer.domElement));
  });

  window.addEventListener('resize', onWindowResize, false);

  physicsHandler = new _physicsHandler2.default(scene, rayInput);
  sceneBuilder = new _sceneBuilder2.default(scene, physicsHandler);
  rayHandler = new _rayHandler2.default(scene, rayInput, physicsHandler);

  rayInput.on('raydown', function (opt_mesh) {
    handleRayDown_();
    if (isDatGuiVisible && guiInputHelper !== null) {
      guiInputHelper.pressed(true);
    }
    rayHandler.handleRayDown_(opt_mesh);
  });
  rayInput.on('rayup', function () {
    rayHandler.handleRayUp_();
    if (isDatGuiVisible && guiInputHelper !== null) {
      guiInputHelper.pressed(false);
    }
    rayHandler.handleRayUp_();
  });
  rayInput.on('raydrag', function () {
    rayHandler.handleRayDrag_();
  });
  rayInput.on('raycancel', function (opt_mesh) {
    rayHandler.handleRayCancel_(opt_mesh);
  });

  sceneBuilder.build();
}

function createDatGui() {
  gui = dat.GUIVR.create('Settings');
  gui.position.set(0.2, 0.5, -1);
  gui.rotation.set(Math.PI / -12, 0, 0);
  sceneBuilder.addDatGuiOptions(gui);
  guiInputHelper = dat.GUIVR.addInputObject(rayInput);
}

function handleRayDown_() {
  if (gui == null) {
    createDatGui();
  }
  var orientation = rayInput.armModel.pose.orientation;
  if (orientation && Math.abs(orientation.x) > 0.6 && Math.abs(orientation.y) < 0.2 && Math.abs(orientation.z) < 0.2) {
    isDatGuiVisible = !isDatGuiVisible;
    if (isDatGuiVisible) {
      scene.add(gui);
      scene.add(guiInputHelper);
    } else {
      scene.remove(gui);
      scene.remove(guiInputHelper);
    }
  }
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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.animate(render);
}

function render() {
  gamepad.update();
  rayInput.update();

  if (isDatGuiVisible) {
    dat.GUIVR.update();
  }

  sceneBuilder.update();
  physicsHandler.updatePhysics(getVRGamepad());

  renderer.render(scene, camera);
}

function getVRGamepad() {
  // If there's no gamepad API, there's no gamepad.
  if (!navigator.getGamepads) {
    return null;
  }

  var gamepads = navigator.getGamepads();
  for (var i = 0; i < gamepads.length; ++i) {
    var _gamepad = gamepads[i];

    // The array may contain undefined gamepads, so check for that as well as
    // a non-null pose.
    if (_gamepad && _gamepad.pose) {
      return _gamepad;
    }
  }
  return null;
}

},{"../ray-input":8,"./physicsHandler.js":3,"./rayHandler.js":4,"./sceneBuilder.js":5}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PhysicsHandler = function () {
  function PhysicsHandler(scene, rayInput) {
    _classCallCheck(this, PhysicsHandler);

    this.scene = scene;
    this.rayInput = rayInput;
    this.dt = 1 / 60;

    var world = void 0;

    // To be synced
    var meshes = [],
        bodies = [];

    this.meshes = meshes;
    this.bodies = bodies;

    var axes = [];
    axes[0] = {
      value: [0, 0]
    };

    // Setup our world
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    world.gravity.set(0, -9.8, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Create a plane
    this.groundMaterial = new CANNON.Material();
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0, material: this.groundMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.y -= 1.75;
    world.addBody(groundBody);

    var constraintDown = false;
    var clickMarker = false;
    var jointBody = void 0,
        constrainedBody = void 0,
        pointerConstraint = void 0;

    // Joint body
    var shape = new CANNON.Sphere(0.1);
    jointBody = new CANNON.Body({ mass: 0 });
    jointBody.addShape(shape);
    jointBody.collisionFilterGroup = 0;
    jointBody.collisionFilterMask = 0;
    world.addBody(jointBody);

    this.jointBody = jointBody;
    this.pointerConstraint = pointerConstraint;
    this.world = world;
    this.constraintDown = constraintDown;
    this.axes = axes;
  }

  _createClass(PhysicsHandler, [{
    key: 'addContactMaterial',
    value: function addContactMaterial(mat) {
      // Create contact material behaviour
      var mat_ground = new CANNON.ContactMaterial(this.groundMaterial, mat, { friction: 0.5, restitution: 0.7 });

      this.world.addContactMaterial(mat_ground);
    }
  }, {
    key: 'addDatGuiOptions',
    value: function addDatGuiOptions(gui) {
      // gui.add(this.world.contactMaterial.f, 'y', -2, 2).step(0.001).name('Position floor Y').listen();
      // gui.add(this.torus.position, 'y', -1, 2).step(0.001).name('Position Y');
      // gui.add(this.torus.rotation, 'y', -Math.PI, Math.PI).step(0.001).name('Rotation').listen();
    }
  }, {
    key: 'updatePhysics',
    value: function updatePhysics(gamepad) {
      this.world.step(this.dt);
      for (var i = 0; i !== this.meshes.length; i++) {
        this.meshes[i].position.copy(this.bodies[i].position);
        this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
      }

      if (this.constraintDown) {
        //  Did any axes (assuming a 2D trackpad) values change?

        // let gamepad = DemoRenderer.getVRGamepad();
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
    }
  }, {
    key: 'filterAxis',
    value: function filterAxis(v) {
      this.axisThreshold = 0.2;
      return Math.abs(v) > this.axisThreshold ? v : 0;
    }
  }, {
    key: 'addMesh',
    value: function addMesh(mesh) {
      this.meshes.push(mesh);
      this.scene.add(mesh);
      this.rayInput.add(mesh);
    }
  }, {
    key: 'addVisual',
    value: function addVisual(body, isDraggable) {
      var mesh = void 0;
      if (body instanceof CANNON.Body) {
        mesh = this.shape2mesh(body);
      }
      if (mesh) {
        this.bodies.push(body);
        this.meshes.push(mesh);
        this.scene.add(mesh);
        if (isDraggable) {
          this.rayInput.add(mesh);
        }
      }
    }
  }, {
    key: 'addBody',
    value: function addBody(body) {
      this.bodies.push(body);
      this.world.addBody(body);
    }
  }, {
    key: 'addPointerConstraint',
    value: function addPointerConstraint(pos, mesh) {
      var idx = this.meshes.indexOf(mesh);
      if (idx !== -1) {
        this.addPointerConstraint2(pos.x, pos.y, pos.z, this.bodies[idx]);
      }
    }
  }, {
    key: 'addPointerConstraint2',
    value: function addPointerConstraint2(x, y, z, body) {
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

    // movePointerConstraint() {
    //   if (this.pointerConstraint) {
    //     let pos = this.rayInput.renderer.reticle.position;
    //     if(pos){
    //       this.setClickMarker(pos.x,pos.y,pos.z,this.scene);
    //       this.moveJointToPoint(pos.x,pos.y,pos.z);
    //     }
    //   }
    // }

    // Calculate rotation from two vectors on the touchpad
    // https://stackoverflow.com/questions/40520129/three-js-rotate-object-using-mouse-and-orbit-control
    // http://jsfiddle.net/x4mby38e/3/

  }, {
    key: 'rotateJoint',
    value: function rotateJoint(axisX, axisZ) {
      if (this.touchPadPosition.x !== 0 || this.touchPadPosition.z !== 0) {
        var deltaMove = { x: axisX - this.touchPadPosition.x, z: axisZ - this.touchPadPosition.z };
        if (this.pointerConstraint) {
          var deltaRotationQuaternion = new CANNON.Quaternion().setFromEuler(PhysicsHandler.toRadians(deltaMove.x), 0, PhysicsHandler.toRadians(deltaMove.z), 'XYZ');
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
    key: 'toRadians',
    value: function toRadians(angle) {
      return angle * (Math.PI / 180);
    }
  }]);

  return PhysicsHandler;
}();

exports.default = PhysicsHandler;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RayHandler = function () {
  function RayHandler(scene, rayInput, physicsHandler) {
    _classCallCheck(this, RayHandler);

    this.scene = scene;
    this.rayInput = rayInput;
    this.physicsHandler = physicsHandler;
  }

  _createClass(RayHandler, [{
    key: "handleRayDown_",
    value: function handleRayDown_(opt_mesh) {
      var pos = this.rayInput.renderer.reticle.position;
      if (pos) {
        this.physicsHandler.constraintDown = true;
        // Set marker on contact point
        this.setClickMarker(pos.x, pos.y, pos.z, this.scene);

        this.physicsHandler.addPointerConstraint(pos, opt_mesh);
      }
    }
  }, {
    key: "handleRayDrag_",
    value: function handleRayDrag_() {
      if (this.physicsHandler.pointerConstraint) {
        var pos = this.rayInput.renderer.reticle.position;
        if (pos) {
          this.setClickMarker(pos.x, pos.y, pos.z, this.scene);
          this.physicsHandler.moveJointToPoint(pos.x, pos.y, pos.z);
        }
      }
    }
  }, {
    key: "handleRayUp_",
    value: function handleRayUp_() {
      this.physicsHandler.constraintDown = false;
      this.removeClickMarker();

      this.physicsHandler.removeJointConstraint();
    }
  }, {
    key: "setClickMarker",
    value: function setClickMarker(x, y, z) {
      if (!this.clickMarker) {
        var shape = new THREE.SphereGeometry(0.2, 8, 8);
        var markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.clickMarker = new THREE.Mesh(shape, markerMaterial);
        this.scene.add(this.clickMarker);
      }
      this.clickMarker.visible = true;
      this.clickMarker.position.set(x, y, z);
    }
  }, {
    key: "removeClickMarker",
    value: function removeClickMarker() {
      this.clickMarker.visible = false;
    }
  }]);

  return RayHandler;
}();

exports.default = RayHandler;

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SceneBuilder = function () {
  function SceneBuilder(scene, physicsHandler) {
    _classCallCheck(this, SceneBuilder);

    this.scene = scene;
    this.physicsHandler = physicsHandler;
    this.loader = new THREE.TextureLoader();

    var floor = void 0;
    this.floor = floor;
  }

  _createClass(SceneBuilder, [{
    key: 'addDatGuiOptions',
    value: function addDatGuiOptions(gui) {
      gui.add(this.floor.position, 'y', -2, 2).step(0.001).name('Position floor Y').listen();
      // gui.add(this.torus.position, 'y', -1, 2).step(0.001).name('Position Y');
      // gui.add(this.torus.rotation, 'y', -Math.PI, Math.PI).step(0.001).name('Rotation').listen();
    }
  }, {
    key: 'build',
    value: function build() {
      var light = new THREE.DirectionalLight(0xFFFFFF, 1, 100);
      light.position.set(1, 10, -0.5);
      this.scene.add(light);

      this.scene.add(new THREE.HemisphereLight(0x909090, 0x404040));

      // let floor = new THREE.Mesh(
      //   new THREE.PlaneBufferGeometry(6, 6, 12, 12),
      //   new THREE.MeshStandardMaterial({
      //
      //     roughness: 1.0,
      //     metalness: 0.0,
      //     color: 0xFFFFFF,
      //     transparent: false,
      //     opacity: 0.8
      //   })
      // );
      // floor.rotation.x = Math.PI / -2;
      // floor.receiveShadow = false;
      // floor.position.y -=1;
      // this.scene.add( floor );

      var geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
      var material = new THREE.MeshLambertMaterial({ color: 0x777777 });
      this.markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      mesh.receiveShadow = true;
      mesh.position.y -= 1;
      this.scene.add(mesh);

      this.floor = mesh;

      this.addBall();
      // renderer.addBasket();
      //
      // let numBodiesAtStart = renderer.world.bodies.length;
      // // Move all body parts
      // for (let i = numBodiesAtStart; i < renderer.world.bodies.length; i++) {
      //   let body = this.world.bodies[i];
      //   body.position.vadd(position, body.position);
      // }
    }
  }, {
    key: 'addBall',
    value: function addBall() {
      var scale = 1;
      var ballRadius = 0.25 * scale;

      var ballSphere = new THREE.SphereGeometry(ballRadius, 16, 16);
      var ballMaterial = new THREE.MeshPhongMaterial({
        map: this.loader.load('/textures/ball.png'),
        normalMap: this.loader.load('/textures/ball_normal.png'),
        shininess: 20,
        reflectivity: 2,
        normalScale: new THREE.Vector2(0.5, 0.5)
      });

      var ballMesh = new THREE.Mesh(ballSphere, ballMaterial);
      ballMesh.castShadow = true;

      this.physicsHandler.addMesh(ballMesh);

      var size = 1;
      var damping = 0.01;
      var mass = 10;
      var sphereShape = new CANNON.Sphere(size);
      var mat = new CANNON.Material();
      var ball = new CANNON.Body({
        mass: mass,
        material: mat,
        position: new CANNON.Vec3(0, 7, -5)
      });

      this.physicsHandler.addContactMaterial(mat);

      ball.addShape(sphereShape);
      ball.linearDamping = damping;

      ball.position.set(0, 7, -5);

      this.physicsHandler.addBody(ball);
    }
  }, {
    key: 'update',
    value: function update() {
      // this.physicsHandler.updatePhysics();
      // this.torus.rotation.y += 0.002;
      // if( this.torus.rotation.y > Math.PI ) this.torus.rotation.y -= ( Math.PI * 2 );
    }
  }]);

  return SceneBuilder;
}();

exports.default = SceneBuilder;

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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
      if (gamepad !== null) {
        return gamepad.pose;
      } else {
        return null;
      }
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

},{"./ray-interaction-modes":9,"./util":11,"eventemitter3":1}],8:[function(require,module,exports){
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

},{"./orientation-arm-model":6,"./ray-controller":7,"./ray-interaction-modes":9,"./ray-renderer":10,"eventemitter3":1}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"./util":11,"eventemitter3":1}],11:[function(require,module,exports){
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

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4xMC4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwic3JjL2Jhc2tldGJhbGwvbWFpbi5qcyIsInNyYy9iYXNrZXRiYWxsL3BoeXNpY3NIYW5kbGVyLmpzIiwic3JjL2Jhc2tldGJhbGwvcmF5SGFuZGxlci5qcyIsInNyYy9iYXNrZXRiYWxsL3NjZW5lQnVpbGRlci5qcyIsInNyYy9vcmllbnRhdGlvbi1hcm0tbW9kZWwuanMiLCJzcmMvcmF5LWNvbnRyb2xsZXIuanMiLCJzcmMvcmF5LWlucHV0LmpzIiwic3JjL3JheS1pbnRlcmFjdGlvbi1tb2Rlcy5qcyIsInNyYy9yYXktcmVuZGVyZXIuanMiLCJzcmMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QU0sSUFBVixDQUFlLFFBQWYsRUFBeUIsUUFBekIsQ0FBWDs7QUFFQSxhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQWxSa0IsVzs7Ozs7Ozs7UUN4QkwsUSxHQUFBLFE7UUFNQSxNLEdBQUEsTTtBQXJCaEI7Ozs7Ozs7Ozs7Ozs7OztBQWVPLFNBQVMsUUFBVCxHQUFvQjtBQUN6QixNQUFJLFFBQVEsS0FBWjtBQUNBLEdBQUMsVUFBUyxDQUFULEVBQVc7QUFBQyxRQUFHLDJUQUEyVCxJQUEzVCxDQUFnVSxDQUFoVSxLQUFvVSwwa0RBQTBrRCxJQUExa0QsQ0FBK2tELEVBQUUsTUFBRixDQUFTLENBQVQsRUFBVyxDQUFYLENBQS9rRCxDQUF2VSxFQUFxNkQsUUFBUSxJQUFSO0FBQWEsR0FBLzdELEVBQWk4RCxVQUFVLFNBQVYsSUFBcUIsVUFBVSxNQUEvQixJQUF1QyxPQUFPLEtBQS8rRDtBQUNBLFNBQU8sS0FBUDtBQUNEOztBQUVNLFNBQVMsTUFBVCxDQUFnQixRQUFoQixFQUEwQixNQUExQixFQUFrQztBQUN2QyxTQUFPLFVBQVUsUUFBVixHQUFxQixVQUFyQixHQUFrQyxNQUF6QztBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vXG4vLyBXZSBzdG9yZSBvdXIgRUUgb2JqZWN0cyBpbiBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBgfmAgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Qgb3ZlcnJpZGRlbiBvclxuLy8gdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy8gV2UgYWxzbyBhc3N1bWUgdGhhdCBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgYXZhaWxhYmxlIHdoZW4gdGhlIGV2ZW50IG5hbWVcbi8vIGlzIGFuIEVTNiBTeW1ib2wuXG4vL1xudmFyIHByZWZpeCA9IHR5cGVvZiBPYmplY3QuY3JlYXRlICE9PSAnZnVuY3Rpb24nID8gJ34nIDogZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgRXZlbnRFbWl0dGVyIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEV2ZW50IGhhbmRsZXIgdG8gYmUgY2FsbGVkLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBDb250ZXh0IGZvciBmdW5jdGlvbiBleGVjdXRpb24uXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBPbmx5IGVtaXQgb25jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogRXZlbnRFbWl0dGVyIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHsgLyogTm90aGluZyB0byBzZXQgKi8gfVxuXG4vKipcbiAqIEhvbGQgdGhlIGFzc2lnbmVkIEV2ZW50RW1pdHRlcnMgYnkgbmFtZS5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1xuICAgICwgbmFtZXMgPSBbXVxuICAgICwgbmFtZTtcblxuICBpZiAoIWV2ZW50cykgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiBldmVudHMpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGEgbGlzdCBvZiBhc3NpZ25lZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudHMgdGhhdCBzaG91bGQgYmUgbGlzdGVkLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgV2Ugb25seSBuZWVkIHRvIGtub3cgaWYgdGhlcmUgYXJlIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtBcnJheXxCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQsIGV4aXN0cykge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgYXZhaWxhYmxlID0gdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogRW1pdCBhbiBldmVudCB0byBhbGwgcmVnaXN0ZXJlZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBJbmRpY2F0aW9uIGlmIHdlJ3ZlIGVtaXR0ZWQgYW4gZXZlbnQuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgbGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgbmV3IEV2ZW50TGlzdGVuZXIgZm9yIHRoZSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhbiBFdmVudExpc3RlbmVyIHRoYXQncyBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3ZSB3YW50IHRvIHJlbW92ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciB0aGF0IHdlIG5lZWQgdG8gZmluZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgT25seSByZW1vdmUgbGlzdGVuZXJzIG1hdGNoaW5nIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmNlIGxpc3RlbmVycy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGV2ZW50cyA9IFtdO1xuXG4gIGlmIChmbikge1xuICAgIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVycy5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVycyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm5cbiAgICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICAgICkge1xuICAgICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gIC8vXG4gIGlmIChldmVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICB9IGVsc2Uge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBvciBvbmx5IHRoZSBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3YW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcblxuICBpZiAoZXZlbnQpIGRlbGV0ZSB0aGlzLl9ldmVudHNbcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudF07XG4gIGVsc2UgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiaW1wb3J0IFJheUlucHV0IGZyb20gJy4uL3JheS1pbnB1dCdcbmltcG9ydCBTY2VuZUJ1aWxkZXIgZnJvbSAnLi9zY2VuZUJ1aWxkZXIuanMnXG5pbXBvcnQgUGh5c2ljc0hhbmRsZXIgZnJvbSBcIi4vcGh5c2ljc0hhbmRsZXIuanNcIjtcbmltcG9ydCBSYXlIYW5kbGVyIGZyb20gXCIuL3JheUhhbmRsZXIuanNcIjtcblxubGV0IHJlbmRlcmVyO1xubGV0IGNhbWVyYSwgc2NlbmUsIGdhbWVwYWQsIHJheUlucHV0O1xubGV0IGd1aUlucHV0SGVscGVyID0gbnVsbDtcbmxldCBpc0RhdEd1aVZpc2libGUgPSBmYWxzZTtcbmxldCBndWk7XG5sZXQgc2NlbmVCdWlsZGVyO1xubGV0IHBoeXNpY3NIYW5kbGVyO1xubGV0IHJheUhhbmRsZXI7XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoeyBhbnRpYWxpYXM6IHRydWUgfSk7XG4gIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoIDB4Q0NDQ0NDICk7XG4gIHJlbmRlcmVyLnNldFBpeGVsUmF0aW8oIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvICk7XG4gIHJlbmRlcmVyLnNldFNpemUoIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKTtcbiAgcmVuZGVyZXIudnIuZW5hYmxlZCAgPSB0cnVlO1xuICByZW5kZXJlci5zaGFkb3dNYXAuZW5hYmxlZCA9IHRydWU7XG4gIHJlbmRlcmVyLnNoYWRvd01hcC50eXBlID0gVEhSRUUuUENGU29mdFNoYWRvd01hcDtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggcmVuZGVyZXIuZG9tRWxlbWVudCApO1xuXG4gIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSggNTAsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwICk7XG4gIGNhbWVyYS5wb3NpdGlvbi55ICs9MjtcbiAgc2NlbmUgID0gbmV3IFRIUkVFLlNjZW5lKCk7XG5cbiAgcmF5SW5wdXQgPSBuZXcgUmF5SW5wdXQoY2FtZXJhKTtcbiAgcmF5SW5wdXQuc2V0U2l6ZShyZW5kZXJlci5nZXRTaXplKCkpO1xuXG4gIGxldCBjYW1lcmFHcm91cCA9IG5ldyBUSFJFRS5Hcm91cCgpO1xuICBjYW1lcmFHcm91cC5wb3NpdGlvbi5zZXQoIDAsIDAsIDAgKTtcbiAgY2FtZXJhR3JvdXAuYWRkKCBjYW1lcmEgKTtcbiAgY2FtZXJhR3JvdXAuYWRkKCByYXlJbnB1dC5nZXRNZXNoKCkgKTtcbiAgc2NlbmUuYWRkKGNhbWVyYUdyb3VwKTtcbiAgLy8gcmF5SW5wdXQuc2V0Q2FtZXJhR3JvdXAoY2FtZXJhR3JvdXApO1xuXG4gIGdhbWVwYWQgPSBuZXcgVEhSRUUuRGF5ZHJlYW1Db250cm9sbGVyKCk7XG4gIGdhbWVwYWQucG9zaXRpb24uc2V0KCAwLCAwLCAwICk7XG5cbiAgV0VCVlIuZ2V0VlJEaXNwbGF5KCBmdW5jdGlvbiggZGlzcGxheSApe1xuICAgIHJlbmRlcmVyLnZyLnNldERldmljZSggZGlzcGxheSApO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIFdFQlZSLmdldEJ1dHRvbiggZGlzcGxheSwgcmVuZGVyZXIuZG9tRWxlbWVudCApKVxuICB9KTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplLCBmYWxzZSApO1xuXG4gIHBoeXNpY3NIYW5kbGVyID0gbmV3IFBoeXNpY3NIYW5kbGVyKHNjZW5lLCByYXlJbnB1dCk7XG4gIHNjZW5lQnVpbGRlciA9IG5ldyBTY2VuZUJ1aWxkZXIoc2NlbmUsIHBoeXNpY3NIYW5kbGVyKTtcbiAgcmF5SGFuZGxlciA9IG5ldyBSYXlIYW5kbGVyKHNjZW5lLCByYXlJbnB1dCwgcGh5c2ljc0hhbmRsZXIpO1xuXG4gIHJheUlucHV0Lm9uKCdyYXlkb3duJywgKG9wdF9tZXNoKSA9PiB7XG4gICAgaGFuZGxlUmF5RG93bl8oKTtcbiAgICBpZiAoaXNEYXRHdWlWaXNpYmxlICYmIGd1aUlucHV0SGVscGVyICE9PSBudWxsKSB7XG4gICAgICBndWlJbnB1dEhlbHBlci5wcmVzc2VkKHRydWUpO1xuICAgIH1cbiAgICByYXlIYW5kbGVyLmhhbmRsZVJheURvd25fKG9wdF9tZXNoKTtcbiAgfSk7XG4gIHJheUlucHV0Lm9uKCdyYXl1cCcsICgpID0+IHtcbiAgICByYXlIYW5kbGVyLmhhbmRsZVJheVVwXygpO1xuICAgIGlmIChpc0RhdEd1aVZpc2libGUgJiYgZ3VpSW5wdXRIZWxwZXIgIT09IG51bGwpIHtcbiAgICAgIGd1aUlucHV0SGVscGVyLnByZXNzZWQoZmFsc2UpO1xuICAgIH1cbiAgICByYXlIYW5kbGVyLmhhbmRsZVJheVVwXygpO1xuICB9KTtcbiAgcmF5SW5wdXQub24oJ3JheWRyYWcnLCAoKSA9PiB7IHJheUhhbmRsZXIuaGFuZGxlUmF5RHJhZ18oKSB9KTtcbiAgcmF5SW5wdXQub24oJ3JheWNhbmNlbCcsIChvcHRfbWVzaCkgPT4geyByYXlIYW5kbGVyLmhhbmRsZVJheUNhbmNlbF8ob3B0X21lc2gpIH0pO1xuXG4gIHNjZW5lQnVpbGRlci5idWlsZCgpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVEYXRHdWkoKSB7XG4gIGd1aSA9IGRhdC5HVUlWUi5jcmVhdGUoJ1NldHRpbmdzJyk7XG4gIGd1aS5wb3NpdGlvbi5zZXQoMC4yLCAwLjUsIC0xKTtcbiAgZ3VpLnJvdGF0aW9uLnNldChNYXRoLlBJIC8gLTEyLCAwLCAwKTtcbiAgc2NlbmVCdWlsZGVyLmFkZERhdEd1aU9wdGlvbnMoZ3VpKTtcbiAgZ3VpSW5wdXRIZWxwZXIgPSBkYXQuR1VJVlIuYWRkSW5wdXRPYmplY3QoIHJheUlucHV0ICk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVJheURvd25fKCkge1xuICBpZiAoZ3VpID09IG51bGwpIHtcbiAgICBjcmVhdGVEYXRHdWkoKTtcbiAgfVxuICBsZXQgb3JpZW50YXRpb24gPSByYXlJbnB1dC5hcm1Nb2RlbC5wb3NlLm9yaWVudGF0aW9uO1xuICBpZiAob3JpZW50YXRpb24gJiYgTWF0aC5hYnMob3JpZW50YXRpb24ueCkgPiAwLjYgJiYgTWF0aC5hYnMob3JpZW50YXRpb24ueSkgPCAwLjIgJiYgTWF0aC5hYnMob3JpZW50YXRpb24ueikgPCAwLjIpIHtcbiAgICBpc0RhdEd1aVZpc2libGUgPSAhaXNEYXRHdWlWaXNpYmxlO1xuICAgIGlmIChpc0RhdEd1aVZpc2libGUpIHtcbiAgICAgIHNjZW5lLmFkZChndWkpO1xuICAgICAgc2NlbmUuYWRkKCBndWlJbnB1dEhlbHBlciApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY2VuZS5yZW1vdmUoZ3VpKTtcbiAgICAgIHNjZW5lLnJlbW92ZShndWlJbnB1dEhlbHBlcik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG9uTG9hZCgpIHtcbiAgV0VCVlIuY2hlY2tBdmFpbGFiaWxpdHkoKS5jYXRjaChmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoV0VCVlIuZ2V0TWVzc2FnZUNvbnRhaW5lcihtZXNzYWdlKSk7XG4gIH0pO1xuXG4gIGluaXQoKTtcbiAgYW5pbWF0ZSgpO1xufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIG9uTG9hZCk7XG5cbmZ1bmN0aW9uIG9uV2luZG93UmVzaXplKCkge1xuICBjYW1lcmEuYXNwZWN0ID0gd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gIHJlbmRlcmVyLnNldFNpemUoIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKVxufVxuXG5mdW5jdGlvbiBhbmltYXRlKCkge1xuICByZW5kZXJlci5hbmltYXRlKCByZW5kZXIgKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKCkge1xuICBnYW1lcGFkLnVwZGF0ZSgpO1xuICByYXlJbnB1dC51cGRhdGUoKTtcblxuICBpZihpc0RhdEd1aVZpc2libGUpIHtcbiAgICBkYXQuR1VJVlIudXBkYXRlKCk7XG4gIH1cblxuICBzY2VuZUJ1aWxkZXIudXBkYXRlKCk7XG4gIHBoeXNpY3NIYW5kbGVyLnVwZGF0ZVBoeXNpY3MoZ2V0VlJHYW1lcGFkKCkpO1xuXG4gIHJlbmRlcmVyLnJlbmRlciggc2NlbmUsIGNhbWVyYSApXG59XG5cbmZ1bmN0aW9uIGdldFZSR2FtZXBhZCgpIHtcbiAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkIEFQSSwgdGhlcmUncyBubyBnYW1lcGFkLlxuICBpZiAoIW5hdmlnYXRvci5nZXRHYW1lcGFkcykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbGV0IGdhbWVwYWRzID0gbmF2aWdhdG9yLmdldEdhbWVwYWRzKCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZ2FtZXBhZHMubGVuZ3RoOyArK2kpIHtcbiAgICBsZXQgZ2FtZXBhZCA9IGdhbWVwYWRzW2ldO1xuXG4gICAgLy8gVGhlIGFycmF5IG1heSBjb250YWluIHVuZGVmaW5lZCBnYW1lcGFkcywgc28gY2hlY2sgZm9yIHRoYXQgYXMgd2VsbCBhc1xuICAgIC8vIGEgbm9uLW51bGwgcG9zZS5cbiAgICBpZiAoZ2FtZXBhZCAmJiBnYW1lcGFkLnBvc2UpIHtcbiAgICAgIHJldHVybiBnYW1lcGFkO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG4iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBQaHlzaWNzSGFuZGxlciB7XG5cbiAgY29uc3RydWN0b3Ioc2NlbmUsIHJheUlucHV0KSB7XG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lO1xuICAgIHRoaXMucmF5SW5wdXQgPSByYXlJbnB1dDtcbiAgICB0aGlzLmR0ID0gMSAvIDYwO1xuXG4gICAgbGV0IHdvcmxkO1xuXG4gICAgLy8gVG8gYmUgc3luY2VkXG4gICAgbGV0IG1lc2hlcyA9IFtdLCBib2RpZXMgPSBbXTtcblxuICAgIHRoaXMubWVzaGVzID0gbWVzaGVzO1xuICAgIHRoaXMuYm9kaWVzID0gYm9kaWVzO1xuXG4gICAgbGV0IGF4ZXMgPSBbXTtcbiAgICBheGVzWyAwIF0gPSB7XG4gICAgICB2YWx1ZTogWyAwLCAwIF1cbiAgICB9O1xuXG4gICAgLy8gU2V0dXAgb3VyIHdvcmxkXG4gICAgd29ybGQgPSBuZXcgQ0FOTk9OLldvcmxkKCk7XG4gICAgd29ybGQucXVhdE5vcm1hbGl6ZVNraXAgPSAwO1xuICAgIHdvcmxkLnF1YXROb3JtYWxpemVGYXN0ID0gZmFsc2U7XG5cbiAgICB3b3JsZC5ncmF2aXR5LnNldCgwLCAtOS44ICwwKTtcbiAgICB3b3JsZC5icm9hZHBoYXNlID0gbmV3IENBTk5PTi5OYWl2ZUJyb2FkcGhhc2UoKTtcblxuICAgIC8vIENyZWF0ZSBhIHBsYW5lXG4gICAgdGhpcy5ncm91bmRNYXRlcmlhbCA9IG5ldyBDQU5OT04uTWF0ZXJpYWwoKTtcbiAgICBsZXQgZ3JvdW5kU2hhcGUgPSBuZXcgQ0FOTk9OLlBsYW5lKCk7XG4gICAgbGV0IGdyb3VuZEJvZHkgPSBuZXcgQ0FOTk9OLkJvZHkoeyBtYXNzOiAwLCBtYXRlcmlhbDogdGhpcy5ncm91bmRNYXRlcmlhbCB9KTtcbiAgICBncm91bmRCb2R5LmFkZFNoYXBlKGdyb3VuZFNoYXBlKTtcbiAgICBncm91bmRCb2R5LnF1YXRlcm5pb24uc2V0RnJvbUF4aXNBbmdsZShuZXcgQ0FOTk9OLlZlYzMoMSwwLDApLC1NYXRoLlBJLzIpO1xuICAgIGdyb3VuZEJvZHkucG9zaXRpb24ueSAtPSAxLjc1O1xuICAgIHdvcmxkLmFkZEJvZHkoZ3JvdW5kQm9keSk7XG5cblxuICAgIGxldCBjb25zdHJhaW50RG93biA9IGZhbHNlO1xuICAgIGxldCBjbGlja01hcmtlciA9IGZhbHNlO1xuICAgIGxldCBqb2ludEJvZHksIGNvbnN0cmFpbmVkQm9keSwgcG9pbnRlckNvbnN0cmFpbnQ7XG5cbiAgICAvLyBKb2ludCBib2R5XG4gICAgbGV0IHNoYXBlID0gbmV3IENBTk5PTi5TcGhlcmUoMC4xKTtcbiAgICBqb2ludEJvZHkgPSBuZXcgQ0FOTk9OLkJvZHkoeyBtYXNzOiAwIH0pO1xuICAgIGpvaW50Qm9keS5hZGRTaGFwZShzaGFwZSk7XG4gICAgam9pbnRCb2R5LmNvbGxpc2lvbkZpbHRlckdyb3VwID0gMDtcbiAgICBqb2ludEJvZHkuY29sbGlzaW9uRmlsdGVyTWFzayA9IDA7XG4gICAgd29ybGQuYWRkQm9keShqb2ludEJvZHkpO1xuXG4gICAgdGhpcy5qb2ludEJvZHkgPSBqb2ludEJvZHk7XG4gICAgdGhpcy5wb2ludGVyQ29uc3RyYWludCA9IHBvaW50ZXJDb25zdHJhaW50O1xuICAgIHRoaXMud29ybGQgPSB3b3JsZDtcbiAgICB0aGlzLmNvbnN0cmFpbnREb3duID0gY29uc3RyYWludERvd247XG4gICAgdGhpcy5heGVzID0gYXhlcztcbiAgfVxuXG4gIGFkZENvbnRhY3RNYXRlcmlhbChtYXQpIHtcbiAgICAvLyBDcmVhdGUgY29udGFjdCBtYXRlcmlhbCBiZWhhdmlvdXJcbiAgICBsZXQgbWF0X2dyb3VuZCA9IG5ldyBDQU5OT04uQ29udGFjdE1hdGVyaWFsKHRoaXMuZ3JvdW5kTWF0ZXJpYWwsIG1hdCwgeyBmcmljdGlvbjogMC41LCByZXN0aXR1dGlvbjogMC43IH0pO1xuXG4gICAgdGhpcy53b3JsZC5hZGRDb250YWN0TWF0ZXJpYWwobWF0X2dyb3VuZCk7XG4gIH1cblxuICBhZGREYXRHdWlPcHRpb25zKGd1aSkge1xuICAgIC8vIGd1aS5hZGQodGhpcy53b3JsZC5jb250YWN0TWF0ZXJpYWwuZiwgJ3knLCAtMiwgMikuc3RlcCgwLjAwMSkubmFtZSgnUG9zaXRpb24gZmxvb3IgWScpLmxpc3RlbigpO1xuICAgIC8vIGd1aS5hZGQodGhpcy50b3J1cy5wb3NpdGlvbiwgJ3knLCAtMSwgMikuc3RlcCgwLjAwMSkubmFtZSgnUG9zaXRpb24gWScpO1xuICAgIC8vIGd1aS5hZGQodGhpcy50b3J1cy5yb3RhdGlvbiwgJ3knLCAtTWF0aC5QSSwgTWF0aC5QSSkuc3RlcCgwLjAwMSkubmFtZSgnUm90YXRpb24nKS5saXN0ZW4oKTtcbiAgfVxuXG4gIHVwZGF0ZVBoeXNpY3MoZ2FtZXBhZCkge1xuICAgIHRoaXMud29ybGQuc3RlcCh0aGlzLmR0KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSAhPT0gdGhpcy5tZXNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMubWVzaGVzW2ldLnBvc2l0aW9uLmNvcHkodGhpcy5ib2RpZXNbaV0ucG9zaXRpb24pO1xuICAgICAgdGhpcy5tZXNoZXNbaV0ucXVhdGVybmlvbi5jb3B5KHRoaXMuYm9kaWVzW2ldLnF1YXRlcm5pb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNvbnN0cmFpbnREb3duKSB7XG4gICAgICAvLyAgRGlkIGFueSBheGVzIChhc3N1bWluZyBhIDJEIHRyYWNrcGFkKSB2YWx1ZXMgY2hhbmdlP1xuXG4gICAgICAvLyBsZXQgZ2FtZXBhZCA9IERlbW9SZW5kZXJlci5nZXRWUkdhbWVwYWQoKTtcbiAgICAgIGlmIChnYW1lcGFkICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChnYW1lcGFkLmF4ZXNbMF0gJiYgZ2FtZXBhZC5heGVzWzFdKSB7XG5cblxuICAgICAgICAgIGxldCBheGVzVmFsID0gdGhpcy5heGVzWzBdLnZhbHVlO1xuICAgICAgICAgIGxldCBheGlzWCA9IGdhbWVwYWQuYXhlc1swXTtcbiAgICAgICAgICBsZXQgYXhpc1kgPSBnYW1lcGFkLmF4ZXNbMV07XG5cbiAgICAgICAgICAvLyBvbmx5IGFwcGx5IGZpbHRlciBpZiBib3RoIGF4ZXMgYXJlIGJlbG93IHRocmVzaG9sZFxuICAgICAgICAgIGxldCBmaWx0ZXJlZFggPSB0aGlzLmZpbHRlckF4aXMoYXhpc1gpO1xuICAgICAgICAgIGxldCBmaWx0ZXJlZFkgPSB0aGlzLmZpbHRlckF4aXMoYXhpc1kpO1xuICAgICAgICAgIGlmICghZmlsdGVyZWRYICYmICFmaWx0ZXJlZFkpIHtcbiAgICAgICAgICAgIGF4aXNYID0gZmlsdGVyZWRYO1xuICAgICAgICAgICAgYXhpc1kgPSBmaWx0ZXJlZFk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGF4ZXNWYWxbMF0gIT09IGF4aXNYIHx8IGF4ZXNWYWxbMV0gIT09IGF4aXNZKSB7XG4gICAgICAgICAgICBheGVzVmFsWzBdID0gYXhpc1g7XG4gICAgICAgICAgICBheGVzVmFsWzFdID0gYXhpc1k7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYXhlcyBjaGFuZ2VkJywgYXhlc1ZhbCk7XG4gICAgICAgICAgICB0aGlzLnJvdGF0ZUpvaW50KGF4aXNYLCBheGlzWSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZmlsdGVyQXhpcyggdiApIHtcbiAgICB0aGlzLmF4aXNUaHJlc2hvbGQgPSAwLjI7XG4gICAgcmV0dXJuICggTWF0aC5hYnMoIHYgKSA+IHRoaXMuYXhpc1RocmVzaG9sZCApID8gdiA6IDA7XG4gIH1cblxuICBhZGRNZXNoKG1lc2gpIHtcbiAgICB0aGlzLm1lc2hlcy5wdXNoKG1lc2gpO1xuICAgIHRoaXMuc2NlbmUuYWRkKG1lc2gpO1xuICAgIHRoaXMucmF5SW5wdXQuYWRkKG1lc2gpO1xuICB9XG5cbiAgYWRkVmlzdWFsKGJvZHksIGlzRHJhZ2dhYmxlKSB7XG4gICAgbGV0IG1lc2g7XG4gICAgaWYoYm9keSBpbnN0YW5jZW9mIENBTk5PTi5Cb2R5KXtcbiAgICAgIG1lc2ggPSB0aGlzLnNoYXBlMm1lc2goYm9keSk7XG4gICAgfVxuICAgIGlmKG1lc2gpIHtcbiAgICAgIHRoaXMuYm9kaWVzLnB1c2goYm9keSk7XG4gICAgICB0aGlzLm1lc2hlcy5wdXNoKG1lc2gpO1xuICAgICAgdGhpcy5zY2VuZS5hZGQobWVzaCk7XG4gICAgICBpZiAoaXNEcmFnZ2FibGUpIHtcbiAgICAgICAgdGhpcy5yYXlJbnB1dC5hZGQobWVzaCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYWRkQm9keShib2R5KSB7XG4gICAgdGhpcy5ib2RpZXMucHVzaChib2R5KTtcbiAgICB0aGlzLndvcmxkLmFkZEJvZHkoYm9keSk7XG4gIH1cblxuICBhZGRQb2ludGVyQ29uc3RyYWludChwb3MsIG1lc2gpIHtcbiAgICBsZXQgaWR4ID0gdGhpcy5tZXNoZXMuaW5kZXhPZihtZXNoKTtcbiAgICBpZihpZHggIT09IC0xKXtcbiAgICAgIHRoaXMuYWRkUG9pbnRlckNvbnN0cmFpbnQyKHBvcy54LHBvcy55LHBvcy56LHRoaXMuYm9kaWVzW2lkeF0pO1xuICAgIH1cbiAgfVxuXG4gIGFkZFBvaW50ZXJDb25zdHJhaW50Mih4LCB5LCB6LCBib2R5KSB7XG4gICAgLy8gVGhlIGNhbm5vbiBib2R5IGNvbnN0cmFpbmVkIGJ5IHRoZSBwb2ludGVyIGpvaW50XG4gICAgdGhpcy5jb25zdHJhaW5lZEJvZHkgPSBib2R5O1xuXG4gICAgLy8gVmVjdG9yIHRvIHRoZSBjbGlja2VkIHBvaW50LCByZWxhdGl2ZSB0byB0aGUgYm9keVxuICAgIGxldCB2MSA9IG5ldyBDQU5OT04uVmVjMyh4LHkseikudnN1Yih0aGlzLmNvbnN0cmFpbmVkQm9keS5wb3NpdGlvbik7XG5cbiAgICAvLyBBcHBseSBhbnRpLXF1YXRlcm5pb24gdG8gdmVjdG9yIHRvIHRyYW5zZm9ybSBpdCBpbnRvIHRoZSBsb2NhbCBib2R5IGNvb3JkaW5hdGUgc3lzdGVtXG4gICAgbGV0IGFudGlSb3QgPSB0aGlzLmNvbnN0cmFpbmVkQm9keS5xdWF0ZXJuaW9uLmludmVyc2UoKTtcbiAgICBsZXQgcGl2b3QgPSBuZXcgQ0FOTk9OLlF1YXRlcm5pb24oYW50aVJvdC54LCBhbnRpUm90LnksIGFudGlSb3QueiwgYW50aVJvdC53KS52bXVsdCh2MSk7IC8vIHBpdm90IGlzIG5vdCBpbiBsb2NhbCBib2R5IGNvb3JkaW5hdGVzXG5cbiAgICAvLyBNb3ZlIHRoZSBjYW5ub24gY2xpY2sgbWFya2VyIHBhcnRpY2xlIHRvIHRoZSBjbGljayBwb3NpdGlvblxuICAgIHRoaXMuam9pbnRCb2R5LnBvc2l0aW9uLnNldCh4LHkseik7XG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgY29uc3RyYWludFxuICAgIC8vIFRoZSBwaXZvdCBmb3IgdGhlIGpvaW50Qm9keSBpcyB6ZXJvXG4gICAgdGhpcy5wb2ludGVyQ29uc3RyYWludCA9IG5ldyBDQU5OT04uUG9pbnRUb1BvaW50Q29uc3RyYWludCh0aGlzLmNvbnN0cmFpbmVkQm9keSwgcGl2b3QsIHRoaXMuam9pbnRCb2R5LCBuZXcgQ0FOTk9OLlZlYzMoMCwwLDApKTtcblxuICAgIC8vIEFkZCB0aGUgY29uc3RyYWludCB0byB3b3JsZFxuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludCh0aGlzLnBvaW50ZXJDb25zdHJhaW50KTtcbiAgfVxuXG4gIC8vIFRoaXMgZnVuY3Rpb24gbW92ZXMgdGhlIHRyYW5zcGFyZW50IGpvaW50IGJvZHkgdG8gYSBuZXcgcG9zaXRpb24gaW4gc3BhY2VcbiAgbW92ZUpvaW50VG9Qb2ludCh4LHkseikge1xuICAgIC8vIE1vdmUgdGhlIGpvaW50IGJvZHkgdG8gYSBuZXcgcG9zaXRpb25cbiAgICB0aGlzLmpvaW50Qm9keS5wb3NpdGlvbi5zZXQoeCx5LHopO1xuICAgIHRoaXMucG9pbnRlckNvbnN0cmFpbnQudXBkYXRlKCk7XG4gIH1cblxuICAvLyBtb3ZlUG9pbnRlckNvbnN0cmFpbnQoKSB7XG4gIC8vICAgaWYgKHRoaXMucG9pbnRlckNvbnN0cmFpbnQpIHtcbiAgLy8gICAgIGxldCBwb3MgPSB0aGlzLnJheUlucHV0LnJlbmRlcmVyLnJldGljbGUucG9zaXRpb247XG4gIC8vICAgICBpZihwb3Mpe1xuICAvLyAgICAgICB0aGlzLnNldENsaWNrTWFya2VyKHBvcy54LHBvcy55LHBvcy56LHRoaXMuc2NlbmUpO1xuICAvLyAgICAgICB0aGlzLm1vdmVKb2ludFRvUG9pbnQocG9zLngscG9zLnkscG9zLnopO1xuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIC8vIENhbGN1bGF0ZSByb3RhdGlvbiBmcm9tIHR3byB2ZWN0b3JzIG9uIHRoZSB0b3VjaHBhZFxuICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy80MDUyMDEyOS90aHJlZS1qcy1yb3RhdGUtb2JqZWN0LXVzaW5nLW1vdXNlLWFuZC1vcmJpdC1jb250cm9sXG4gIC8vIGh0dHA6Ly9qc2ZpZGRsZS5uZXQveDRtYnkzOGUvMy9cbiAgcm90YXRlSm9pbnQoYXhpc1gsIGF4aXNaKSB7XG4gICAgaWYgKHRoaXMudG91Y2hQYWRQb3NpdGlvbi54ICE9PSAwIHx8IHRoaXMudG91Y2hQYWRQb3NpdGlvbi56ICE9PSAwKSB7XG4gICAgICBsZXQgZGVsdGFNb3ZlID0geyB4OiBheGlzWCAtIHRoaXMudG91Y2hQYWRQb3NpdGlvbi54LCB6OiBheGlzWiAtIHRoaXMudG91Y2hQYWRQb3NpdGlvbi56IH07XG4gICAgICBpZiAodGhpcy5wb2ludGVyQ29uc3RyYWludCkge1xuICAgICAgICBsZXQgZGVsdGFSb3RhdGlvblF1YXRlcm5pb24gPSBuZXcgQ0FOTk9OLlF1YXRlcm5pb24oKVxuICAgICAgICAgIC5zZXRGcm9tRXVsZXIoXG4gICAgICAgICAgICBQaHlzaWNzSGFuZGxlci50b1JhZGlhbnMoZGVsdGFNb3ZlLngpLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIFBoeXNpY3NIYW5kbGVyLnRvUmFkaWFucyhkZWx0YU1vdmUueiksXG4gICAgICAgICAgICAnWFlaJ1xuICAgICAgICAgICk7XG4gICAgICAgIHRoaXMuY29uc3RyYWluZWRCb2R5LnF1YXRlcm5pb24gPSBuZXcgQ0FOTk9OLlF1YXRlcm5pb24oKS5tdWx0KGRlbHRhUm90YXRpb25RdWF0ZXJuaW9uLCB0aGlzLmNvbnN0cmFpbmVkQm9keS5xdWF0ZXJuaW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy50b3VjaFBhZFBvc2l0aW9uLnggPSBheGlzWDtcbiAgICB0aGlzLnRvdWNoUGFkUG9zaXRpb24ueiA9IGF4aXNaO1xuICB9XG5cbiAgc3RhdGljIHRvUmFkaWFucyhhbmdsZSkge1xuICAgIHJldHVybiBhbmdsZSAqIChNYXRoLlBJIC8gMTgwKTtcbiAgfVxuXG4gIHJlbW92ZUpvaW50Q29uc3RyYWludCgpe1xuICAgIC8vIFJlbW92ZSBjb25zdHJhaW50IGZyb20gd29ybGRcbiAgICB0aGlzLndvcmxkLnJlbW92ZUNvbnN0cmFpbnQodGhpcy5wb2ludGVyQ29uc3RyYWludCk7XG4gICAgdGhpcy5wb2ludGVyQ29uc3RyYWludCA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hQYWRQb3NpdGlvbiA9IHsgeDogMCwgejogMCB9O1xuICB9XG5cbiAgc2hhcGUybWVzaChib2R5KSB7XG4gICAgdmFyIG9iaiA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgZm9yICh2YXIgbCA9IDA7IGwgPCBib2R5LnNoYXBlcy5sZW5ndGg7IGwrKykge1xuICAgICAgdmFyIHNoYXBlID0gYm9keS5zaGFwZXNbbF07XG5cbiAgICAgIHZhciBtZXNoO1xuXG4gICAgICBzd2l0Y2goc2hhcGUudHlwZSl7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuU1BIRVJFOlxuICAgICAgICAgIHZhciBzcGhlcmVfZ2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoIHNoYXBlLnJhZGl1cywgOCwgOCk7XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKCBzcGhlcmVfZ2VvbWV0cnksIHRoaXMuY3VycmVudE1hdGVyaWFsICk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuUEFSVElDTEU6XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKCB0aGlzLnBhcnRpY2xlR2VvLCB0aGlzLnBhcnRpY2xlTWF0ZXJpYWwgKTtcbiAgICAgICAgICB2YXIgcyA9IHRoaXMuc2V0dGluZ3M7XG4gICAgICAgICAgbWVzaC5zY2FsZS5zZXQocy5wYXJ0aWNsZVNpemUscy5wYXJ0aWNsZVNpemUscy5wYXJ0aWNsZVNpemUpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgQ0FOTk9OLlNoYXBlLnR5cGVzLlBMQU5FOlxuICAgICAgICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5QbGFuZUdlb21ldHJ5KDEwLCAxMCwgNCwgNCk7XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgICAgICAgIHZhciBzdWJtZXNoID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgICAgICAgdmFyIGdyb3VuZCA9IG5ldyBUSFJFRS5NZXNoKCBnZW9tZXRyeSwgdGhpcy5jdXJyZW50TWF0ZXJpYWwgKTtcbiAgICAgICAgICBncm91bmQuc2NhbGUuc2V0KDEwMCwgMTAwLCAxMDApO1xuICAgICAgICAgIHN1Ym1lc2guYWRkKGdyb3VuZCk7XG5cbiAgICAgICAgICBncm91bmQuY2FzdFNoYWRvdyA9IHRydWU7XG4gICAgICAgICAgZ3JvdW5kLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuXG4gICAgICAgICAgbWVzaC5hZGQoc3VibWVzaCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuQk9YOlxuICAgICAgICAgIHZhciBib3hfZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQm94R2VvbWV0cnkoICBzaGFwZS5oYWxmRXh0ZW50cy54KjIsXG4gICAgICAgICAgICBzaGFwZS5oYWxmRXh0ZW50cy55KjIsXG4gICAgICAgICAgICBzaGFwZS5oYWxmRXh0ZW50cy56KjIgKTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIGJveF9nZW9tZXRyeSwgdGhpcy5jdXJyZW50TWF0ZXJpYWwgKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5DT05WRVhQT0xZSEVEUk9OOlxuICAgICAgICAgIHZhciBnZW8gPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICAgICAgICAgIC8vIEFkZCB2ZXJ0aWNlc1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhcGUudmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB2ID0gc2hhcGUudmVydGljZXNbaV07XG4gICAgICAgICAgICBnZW8udmVydGljZXMucHVzaChuZXcgVEhSRUUuVmVjdG9yMyh2LngsIHYueSwgdi56KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBzaGFwZS5mYWNlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgZmFjZSA9IHNoYXBlLmZhY2VzW2ldO1xuXG4gICAgICAgICAgICAvLyBhZGQgdHJpYW5nbGVzXG4gICAgICAgICAgICB2YXIgYSA9IGZhY2VbMF07XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMTsgaiA8IGZhY2UubGVuZ3RoIC0gMTsgaisrKSB7XG4gICAgICAgICAgICAgIHZhciBiID0gZmFjZVtqXTtcbiAgICAgICAgICAgICAgdmFyIGMgPSBmYWNlW2ogKyAxXTtcbiAgICAgICAgICAgICAgZ2VvLmZhY2VzLnB1c2gobmV3IFRIUkVFLkZhY2UzKGEsIGIsIGMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZ2VvLmNvbXB1dGVCb3VuZGluZ1NwaGVyZSgpO1xuICAgICAgICAgIGdlby5jb21wdXRlRmFjZU5vcm1hbHMoKTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIGdlbywgdGhpcy5jdXJyZW50TWF0ZXJpYWwgKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5IRUlHSFRGSUVMRDpcbiAgICAgICAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICAgICAgICAgIHZhciB2MCA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MSA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MiA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIGZvciAodmFyIHhpID0gMDsgeGkgPCBzaGFwZS5kYXRhLmxlbmd0aCAtIDE7IHhpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHlpID0gMDsgeWkgPCBzaGFwZS5kYXRhW3hpXS5sZW5ndGggLSAxOyB5aSsrKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgMjsgaysrKSB7XG4gICAgICAgICAgICAgICAgc2hhcGUuZ2V0Q29udmV4VHJpYW5nbGVQaWxsYXIoeGksIHlpLCBrPT09MCk7XG4gICAgICAgICAgICAgICAgdjAuY29weShzaGFwZS5waWxsYXJDb252ZXgudmVydGljZXNbMF0pO1xuICAgICAgICAgICAgICAgIHYxLmNvcHkoc2hhcGUucGlsbGFyQ29udmV4LnZlcnRpY2VzWzFdKTtcbiAgICAgICAgICAgICAgICB2Mi5jb3B5KHNoYXBlLnBpbGxhckNvbnZleC52ZXJ0aWNlc1syXSk7XG4gICAgICAgICAgICAgICAgdjAudmFkZChzaGFwZS5waWxsYXJPZmZzZXQsIHYwKTtcbiAgICAgICAgICAgICAgICB2MS52YWRkKHNoYXBlLnBpbGxhck9mZnNldCwgdjEpO1xuICAgICAgICAgICAgICAgIHYyLnZhZGQoc2hhcGUucGlsbGFyT2Zmc2V0LCB2Mik7XG4gICAgICAgICAgICAgICAgZ2VvbWV0cnkudmVydGljZXMucHVzaChcbiAgICAgICAgICAgICAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKHYwLngsIHYwLnksIHYwLnopLFxuICAgICAgICAgICAgICAgICAgbmV3IFRIUkVFLlZlY3RvcjModjEueCwgdjEueSwgdjEueiksXG4gICAgICAgICAgICAgICAgICBuZXcgVEhSRUUuVmVjdG9yMyh2Mi54LCB2Mi55LCB2Mi56KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSBnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggLSAzO1xuICAgICAgICAgICAgICAgIGdlb21ldHJ5LmZhY2VzLnB1c2gobmV3IFRIUkVFLkZhY2UzKGksIGkrMSwgaSsyKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nU3BoZXJlKCk7XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCB0aGlzLmN1cnJlbnRNYXRlcmlhbCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuVFJJTUVTSDpcbiAgICAgICAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICAgICAgICAgIHZhciB2MCA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MSA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MiA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhcGUuaW5kaWNlcy5sZW5ndGggLyAzOyBpKyspIHtcbiAgICAgICAgICAgIHNoYXBlLmdldFRyaWFuZ2xlVmVydGljZXMoaSwgdjAsIHYxLCB2Mik7XG4gICAgICAgICAgICBnZW9tZXRyeS52ZXJ0aWNlcy5wdXNoKFxuICAgICAgICAgICAgICBuZXcgVEhSRUUuVmVjdG9yMyh2MC54LCB2MC55LCB2MC56KSxcbiAgICAgICAgICAgICAgbmV3IFRIUkVFLlZlY3RvcjModjEueCwgdjEueSwgdjEueiksXG4gICAgICAgICAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKHYyLngsIHYyLnksIHYyLnopXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdmFyIGogPSBnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggLSAzO1xuICAgICAgICAgICAgZ2VvbWV0cnkuZmFjZXMucHVzaChuZXcgVEhSRUUuRmFjZTMoaiwgaisxLCBqKzIpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nU3BoZXJlKCk7XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCB0aGlzLmN1cnJlbnRNYXRlcmlhbCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBcIlZpc3VhbCB0eXBlIG5vdCByZWNvZ25pemVkOiBcIitzaGFwZS50eXBlO1xuICAgICAgfVxuXG4gICAgICBtZXNoLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgICAgbWVzaC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAgIGlmKG1lc2guY2hpbGRyZW4pe1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxtZXNoLmNoaWxkcmVuLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICBtZXNoLmNoaWxkcmVuW2ldLmNhc3RTaGFkb3cgPSB0cnVlO1xuICAgICAgICAgIG1lc2guY2hpbGRyZW5baV0ucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gICAgICAgICAgaWYobWVzaC5jaGlsZHJlbltpXSl7XG4gICAgICAgICAgICBmb3IodmFyIGo9MDsgajxtZXNoLmNoaWxkcmVuW2ldLmxlbmd0aDsgaisrKXtcbiAgICAgICAgICAgICAgbWVzaC5jaGlsZHJlbltpXS5jaGlsZHJlbltqXS5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgbWVzaC5jaGlsZHJlbltpXS5jaGlsZHJlbltqXS5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIG8gPSBib2R5LnNoYXBlT2Zmc2V0c1tsXTtcbiAgICAgIHZhciBxID0gYm9keS5zaGFwZU9yaWVudGF0aW9uc1tsXTtcbiAgICAgIG1lc2gucG9zaXRpb24uc2V0KG8ueCwgby55LCBvLnopO1xuICAgICAgbWVzaC5xdWF0ZXJuaW9uLnNldChxLngsIHEueSwgcS56LCBxLncpO1xuXG4gICAgICBvYmouYWRkKG1lc2gpO1xuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG4gIH07XG59IiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmF5SGFuZGxlciB7XG4gIGNvbnN0cnVjdG9yKHNjZW5lLCByYXlJbnB1dCwgcGh5c2ljc0hhbmRsZXIpIHtcbiAgICB0aGlzLnNjZW5lID0gc2NlbmU7XG4gICAgdGhpcy5yYXlJbnB1dCA9IHJheUlucHV0O1xuICAgIHRoaXMucGh5c2ljc0hhbmRsZXIgPSBwaHlzaWNzSGFuZGxlcjtcbiAgfVxuXG4gIGhhbmRsZVJheURvd25fKG9wdF9tZXNoKSB7XG4gICAgbGV0IHBvcyA9IHRoaXMucmF5SW5wdXQucmVuZGVyZXIucmV0aWNsZS5wb3NpdGlvbjtcbiAgICBpZihwb3Mpe1xuICAgICAgdGhpcy5waHlzaWNzSGFuZGxlci5jb25zdHJhaW50RG93biA9IHRydWU7XG4gICAgICAvLyBTZXQgbWFya2VyIG9uIGNvbnRhY3QgcG9pbnRcbiAgICAgIHRoaXMuc2V0Q2xpY2tNYXJrZXIocG9zLngscG9zLnkscG9zLnosdGhpcy5zY2VuZSk7XG5cbiAgICAgIHRoaXMucGh5c2ljc0hhbmRsZXIuYWRkUG9pbnRlckNvbnN0cmFpbnQocG9zLCBvcHRfbWVzaCk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlUmF5RHJhZ18oKSB7XG4gICAgaWYgKHRoaXMucGh5c2ljc0hhbmRsZXIucG9pbnRlckNvbnN0cmFpbnQpIHtcbiAgICAgIGxldCBwb3MgPSB0aGlzLnJheUlucHV0LnJlbmRlcmVyLnJldGljbGUucG9zaXRpb247XG4gICAgICBpZihwb3Mpe1xuICAgICAgICB0aGlzLnNldENsaWNrTWFya2VyKHBvcy54LHBvcy55LHBvcy56LHRoaXMuc2NlbmUpO1xuICAgICAgICB0aGlzLnBoeXNpY3NIYW5kbGVyLm1vdmVKb2ludFRvUG9pbnQocG9zLngscG9zLnkscG9zLnopO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZVJheVVwXygpIHtcbiAgICB0aGlzLnBoeXNpY3NIYW5kbGVyLmNvbnN0cmFpbnREb3duID0gZmFsc2U7XG4gICAgdGhpcy5yZW1vdmVDbGlja01hcmtlcigpO1xuXG4gICAgdGhpcy5waHlzaWNzSGFuZGxlci5yZW1vdmVKb2ludENvbnN0cmFpbnQoKTtcbiAgfVxuXG4gIHNldENsaWNrTWFya2VyKHgseSx6KSB7XG4gICAgaWYoIXRoaXMuY2xpY2tNYXJrZXIpe1xuICAgICAgY29uc3Qgc2hhcGUgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoMC4yLCA4LCA4KTtcbiAgICAgIGNvbnN0IG1hcmtlck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoeyBjb2xvcjogMHhmZjAwMDAgfSk7XG4gICAgICB0aGlzLmNsaWNrTWFya2VyID0gbmV3IFRIUkVFLk1lc2goc2hhcGUsIG1hcmtlck1hdGVyaWFsKTtcbiAgICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuY2xpY2tNYXJrZXIpO1xuICAgIH1cbiAgICB0aGlzLmNsaWNrTWFya2VyLnZpc2libGUgPSB0cnVlO1xuICAgIHRoaXMuY2xpY2tNYXJrZXIucG9zaXRpb24uc2V0KHgseSx6KTtcbiAgfVxuXG4gIHJlbW92ZUNsaWNrTWFya2VyKCl7XG4gICAgdGhpcy5jbGlja01hcmtlci52aXNpYmxlID0gZmFsc2U7XG4gIH1cbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBTY2VuZUJ1aWxkZXIge1xuXG4gIGNvbnN0cnVjdG9yKHNjZW5lLCBwaHlzaWNzSGFuZGxlcikge1xuICAgIHRoaXMuc2NlbmUgPSBzY2VuZTtcbiAgICB0aGlzLnBoeXNpY3NIYW5kbGVyID0gcGh5c2ljc0hhbmRsZXI7XG4gICAgdGhpcy5sb2FkZXIgPSBuZXcgVEhSRUUuVGV4dHVyZUxvYWRlcigpO1xuXG4gICAgbGV0IGZsb29yO1xuICAgIHRoaXMuZmxvb3IgPSBmbG9vcjtcbiAgIH1cblxuICBhZGREYXRHdWlPcHRpb25zKGd1aSkge1xuICAgIGd1aS5hZGQodGhpcy5mbG9vci5wb3NpdGlvbiwgJ3knLCAtMiwgMikuc3RlcCgwLjAwMSkubmFtZSgnUG9zaXRpb24gZmxvb3IgWScpLmxpc3RlbigpO1xuICAgIC8vIGd1aS5hZGQodGhpcy50b3J1cy5wb3NpdGlvbiwgJ3knLCAtMSwgMikuc3RlcCgwLjAwMSkubmFtZSgnUG9zaXRpb24gWScpO1xuICAgIC8vIGd1aS5hZGQodGhpcy50b3J1cy5yb3RhdGlvbiwgJ3knLCAtTWF0aC5QSSwgTWF0aC5QSSkuc3RlcCgwLjAwMSkubmFtZSgnUm90YXRpb24nKS5saXN0ZW4oKTtcbiAgfVxuXG4gIGJ1aWxkKCkge1xuICAgIGxldCBsaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4RkZGRkZGLCAxLCAxMDApO1xuICAgIGxpZ2h0LnBvc2l0aW9uLnNldCggIDEsIDEwLCAtMC41ICk7XG4gICAgdGhpcy5zY2VuZS5hZGQoIGxpZ2h0ICk7XG5cbiAgICB0aGlzLnNjZW5lLmFkZCggbmV3IFRIUkVFLkhlbWlzcGhlcmVMaWdodCggMHg5MDkwOTAsIDB4NDA0MDQwICkpO1xuXG4gICAgLy8gbGV0IGZsb29yID0gbmV3IFRIUkVFLk1lc2goXG4gICAgLy8gICBuZXcgVEhSRUUuUGxhbmVCdWZmZXJHZW9tZXRyeSg2LCA2LCAxMiwgMTIpLFxuICAgIC8vICAgbmV3IFRIUkVFLk1lc2hTdGFuZGFyZE1hdGVyaWFsKHtcbiAgICAvL1xuICAgIC8vICAgICByb3VnaG5lc3M6IDEuMCxcbiAgICAvLyAgICAgbWV0YWxuZXNzOiAwLjAsXG4gICAgLy8gICAgIGNvbG9yOiAweEZGRkZGRixcbiAgICAvLyAgICAgdHJhbnNwYXJlbnQ6IGZhbHNlLFxuICAgIC8vICAgICBvcGFjaXR5OiAwLjhcbiAgICAvLyAgIH0pXG4gICAgLy8gKTtcbiAgICAvLyBmbG9vci5yb3RhdGlvbi54ID0gTWF0aC5QSSAvIC0yO1xuICAgIC8vIGZsb29yLnJlY2VpdmVTaGFkb3cgPSBmYWxzZTtcbiAgICAvLyBmbG9vci5wb3NpdGlvbi55IC09MTtcbiAgICAvLyB0aGlzLnNjZW5lLmFkZCggZmxvb3IgKTtcblxuICAgIGxldCBnZW9tZXRyeSA9IG5ldyBUSFJFRS5QbGFuZUdlb21ldHJ5KCAxMDAsIDEwMCwgMSwgMSApO1xuICAgIGxldCBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKCB7IGNvbG9yOiAweDc3Nzc3NyB9ICk7XG4gICAgdGhpcy5tYXJrZXJNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHsgY29sb3I6IDB4ZmYwMDAwIH0pO1xuICAgIGxldCBtZXNoID0gbmV3IFRIUkVFLk1lc2goIGdlb21ldHJ5LCBtYXRlcmlhbCApO1xuICAgIG1lc2gucXVhdGVybmlvbi5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBUSFJFRS5WZWN0b3IzKDEsMCwwKSwgLU1hdGguUEkgLyAyKTtcbiAgICBtZXNoLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgIG1lc2gucG9zaXRpb24ueSAtPSAxO1xuICAgIHRoaXMuc2NlbmUuYWRkKG1lc2gpO1xuXG4gICAgdGhpcy5mbG9vciA9IG1lc2g7XG5cblxuICAgIHRoaXMuYWRkQmFsbCgpO1xuLy8gcmVuZGVyZXIuYWRkQmFza2V0KCk7XG4vL1xuLy8gbGV0IG51bUJvZGllc0F0U3RhcnQgPSByZW5kZXJlci53b3JsZC5ib2RpZXMubGVuZ3RoO1xuLy8gLy8gTW92ZSBhbGwgYm9keSBwYXJ0c1xuLy8gZm9yIChsZXQgaSA9IG51bUJvZGllc0F0U3RhcnQ7IGkgPCByZW5kZXJlci53b3JsZC5ib2RpZXMubGVuZ3RoOyBpKyspIHtcbi8vICAgbGV0IGJvZHkgPSB0aGlzLndvcmxkLmJvZGllc1tpXTtcbi8vICAgYm9keS5wb3NpdGlvbi52YWRkKHBvc2l0aW9uLCBib2R5LnBvc2l0aW9uKTtcbi8vIH1cbiAgfVxuXG4gIGFkZEJhbGwoKXtcbiAgICBjb25zdCBzY2FsZSA9IDE7XG4gICAgY29uc3QgYmFsbFJhZGl1cyA9IDAuMjUgKiBzY2FsZTtcblxuICAgIGxldCBiYWxsU3BoZXJlID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KCBiYWxsUmFkaXVzLCAxNiwgMTYgKTtcbiAgICBsZXQgYmFsbE1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKHtcbiAgICAgIG1hcDogdGhpcy5sb2FkZXIubG9hZCgnL3RleHR1cmVzL2JhbGwucG5nJyksXG4gICAgICBub3JtYWxNYXA6IHRoaXMubG9hZGVyLmxvYWQoJy90ZXh0dXJlcy9iYWxsX25vcm1hbC5wbmcnKSxcbiAgICAgIHNoaW5pbmVzczogMjAsXG4gICAgICByZWZsZWN0aXZpdHk6IDIsXG4gICAgICBub3JtYWxTY2FsZTogbmV3IFRIUkVFLlZlY3RvcjIoMC41LCAwLjUpXG4gICAgfSk7XG5cbiAgICBsZXQgYmFsbE1lc2ggPSBuZXcgVEhSRUUuTWVzaChiYWxsU3BoZXJlLCBiYWxsTWF0ZXJpYWwpO1xuICAgIGJhbGxNZXNoLmNhc3RTaGFkb3cgPSB0cnVlO1xuXG4gICAgdGhpcy5waHlzaWNzSGFuZGxlci5hZGRNZXNoKGJhbGxNZXNoKTtcblxuICAgIGxldCBzaXplID0gMTtcbiAgICBsZXQgZGFtcGluZyA9IDAuMDE7XG4gICAgbGV0IG1hc3MgPSAxMDtcbiAgICBsZXQgc3BoZXJlU2hhcGUgPSBuZXcgQ0FOTk9OLlNwaGVyZShzaXplKTtcbiAgICBsZXQgbWF0ID0gbmV3IENBTk5PTi5NYXRlcmlhbCgpO1xuICAgIGxldCBiYWxsID0gbmV3IENBTk5PTi5Cb2R5KHtcbiAgICAgIG1hc3M6IG1hc3MsXG4gICAgICBtYXRlcmlhbDogbWF0LFxuICAgICAgcG9zaXRpb246IG5ldyBDQU5OT04uVmVjMygwLCA3LCAtNSlcbiAgICB9KTtcblxuICAgIHRoaXMucGh5c2ljc0hhbmRsZXIuYWRkQ29udGFjdE1hdGVyaWFsKG1hdCk7XG5cbiAgICBiYWxsLmFkZFNoYXBlKHNwaGVyZVNoYXBlKTtcbiAgICBiYWxsLmxpbmVhckRhbXBpbmcgPSBkYW1waW5nO1xuXG4gICAgYmFsbC5wb3NpdGlvbi5zZXQoMCw3LC01KTtcblxuICAgIHRoaXMucGh5c2ljc0hhbmRsZXIuYWRkQm9keShiYWxsKTtcbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICAvLyB0aGlzLnBoeXNpY3NIYW5kbGVyLnVwZGF0ZVBoeXNpY3MoKTtcbiAgICAvLyB0aGlzLnRvcnVzLnJvdGF0aW9uLnkgKz0gMC4wMDI7XG4gICAgLy8gaWYoIHRoaXMudG9ydXMucm90YXRpb24ueSA+IE1hdGguUEkgKSB0aGlzLnRvcnVzLnJvdGF0aW9uLnkgLT0gKCBNYXRoLlBJICogMiApO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5jb25zdCBIRUFEX0VMQk9XX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAuMTU1LCAtMC40NjUsIC0wLjE1KTtcbmNvbnN0IEVMQk9XX1dSSVNUX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0wLjI1KTtcbmNvbnN0IFdSSVNUX0NPTlRST0xMRVJfT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMC4wNSk7XG5jb25zdCBBUk1fRVhURU5TSU9OX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKC0wLjA4LCAwLjE0LCAwLjA4KTtcblxuY29uc3QgRUxCT1dfQkVORF9SQVRJTyA9IDAuNDsgLy8gNDAlIGVsYm93LCA2MCUgd3Jpc3QuXG5jb25zdCBFWFRFTlNJT05fUkFUSU9fV0VJR0hUID0gMC40O1xuXG5jb25zdCBNSU5fQU5HVUxBUl9TUEVFRCA9IDAuNjE7IC8vIDM1IGRlZ3JlZXMgcGVyIHNlY29uZCAoaW4gcmFkaWFucykuXG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgYXJtIG1vZGVsIGZvciB0aGUgRGF5ZHJlYW0gY29udHJvbGxlci4gRmVlZCBpdCBhIGNhbWVyYSBhbmRcbiAqIHRoZSBjb250cm9sbGVyLiBVcGRhdGUgaXQgb24gYSBSQUYuXG4gKlxuICogR2V0IHRoZSBtb2RlbCdzIHBvc2UgdXNpbmcgZ2V0UG9zZSgpLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPcmllbnRhdGlvbkFybU1vZGVsIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBmYWxzZTtcblxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIGNvbnRyb2xsZXIgb3JpZW50YXRpb25zLlxuICAgIHRoaXMuY29udHJvbGxlclEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHRoaXMubGFzdENvbnRyb2xsZXJRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIGhlYWQgb3JpZW50YXRpb25zLlxuICAgIHRoaXMuaGVhZFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgLy8gQ3VycmVudCBoZWFkIHBvc2l0aW9uLlxuICAgIHRoaXMuaGVhZFBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICAvLyBQb3NpdGlvbnMgb2Ygb3RoZXIgam9pbnRzIChtb3N0bHkgZm9yIGRlYnVnZ2luZykuXG4gICAgdGhpcy5lbGJvd1BvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgdGhpcy53cmlzdFBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyB0aW1lcyB0aGUgbW9kZWwgd2FzIHVwZGF0ZWQuXG4gICAgdGhpcy50aW1lID0gbnVsbDtcbiAgICB0aGlzLmxhc3RUaW1lID0gbnVsbDtcblxuICAgIC8vIFJvb3Qgcm90YXRpb24uXG4gICAgdGhpcy5yb290USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAvLyBDdXJyZW50IHBvc2UgdGhhdCB0aGlzIGFybSBtb2RlbCBjYWxjdWxhdGVzLlxuICAgIHRoaXMucG9zZSA9IHtcbiAgICAgIG9yaWVudGF0aW9uOiBuZXcgVEhSRUUuUXVhdGVybmlvbigpLFxuICAgICAgcG9zaXRpb246IG5ldyBUSFJFRS5WZWN0b3IzKClcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIE1ldGhvZHMgdG8gc2V0IGNvbnRyb2xsZXIgYW5kIGhlYWQgcG9zZSAoaW4gd29ybGQgY29vcmRpbmF0ZXMpLlxuICAgKi9cbiAgc2V0Q29udHJvbGxlck9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcbiAgICB0aGlzLmxhc3RDb250cm9sbGVyUS5jb3B5KHRoaXMuY29udHJvbGxlclEpO1xuICAgIHRoaXMuY29udHJvbGxlclEuY29weShxdWF0ZXJuaW9uKTtcbiAgfVxuXG4gIHNldEhlYWRPcmllbnRhdGlvbihxdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5oZWFkUS5jb3B5KHF1YXRlcm5pb24pO1xuICB9XG5cbiAgc2V0SGVhZFBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgdGhpcy5oZWFkUG9zLmNvcHkocG9zaXRpb24pO1xuICB9XG5cbiAgc2V0TGVmdEhhbmRlZChpc0xlZnRIYW5kZWQpIHtcbiAgICAvLyBUT0RPKHNtdXMpOiBJbXBsZW1lbnQgbWUhXG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBpc0xlZnRIYW5kZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIG9uIGEgUkFGLlxuICAgKi9cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMudGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgLy8gSWYgdGhlIGNvbnRyb2xsZXIncyBhbmd1bGFyIHZlbG9jaXR5IGlzIGFib3ZlIGEgY2VydGFpbiBhbW91bnQsIHdlIGNhblxuICAgIC8vIGFzc3VtZSB0b3JzbyByb3RhdGlvbiBhbmQgbW92ZSB0aGUgZWxib3cgam9pbnQgcmVsYXRpdmUgdG8gdGhlXG4gICAgLy8gY2FtZXJhIG9yaWVudGF0aW9uLlxuICAgIGxldCBoZWFkWWF3USA9IHRoaXMuZ2V0SGVhZFlhd09yaWVudGF0aW9uXygpO1xuICAgIGxldCB0aW1lRGVsdGEgPSAodGhpcy50aW1lIC0gdGhpcy5sYXN0VGltZSkgLyAxMDAwO1xuICAgIGxldCBhbmdsZURlbHRhID0gdGhpcy5xdWF0QW5nbGVfKHRoaXMubGFzdENvbnRyb2xsZXJRLCB0aGlzLmNvbnRyb2xsZXJRKTtcbiAgICBsZXQgY29udHJvbGxlckFuZ3VsYXJTcGVlZCA9IGFuZ2xlRGVsdGEgLyB0aW1lRGVsdGE7XG4gICAgaWYgKGNvbnRyb2xsZXJBbmd1bGFyU3BlZWQgPiBNSU5fQU5HVUxBUl9TUEVFRCkge1xuICAgICAgLy8gQXR0ZW51YXRlIHRoZSBSb290IHJvdGF0aW9uIHNsaWdodGx5LlxuICAgICAgdGhpcy5yb290US5zbGVycChoZWFkWWF3USwgYW5nbGVEZWx0YSAvIDEwKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJvb3RRLmNvcHkoaGVhZFlhd1EpO1xuICAgIH1cblxuICAgIC8vIFdlIHdhbnQgdG8gbW92ZSB0aGUgZWxib3cgdXAgYW5kIHRvIHRoZSBjZW50ZXIgYXMgdGhlIHVzZXIgcG9pbnRzIHRoZVxuICAgIC8vIGNvbnRyb2xsZXIgdXB3YXJkcywgc28gdGhhdCB0aGV5IGNhbiBlYXNpbHkgc2VlIHRoZSBjb250cm9sbGVyIGFuZCBpdHNcbiAgICAvLyB0b29sIHRpcHMuXG4gICAgbGV0IGNvbnRyb2xsZXJFdWxlciA9IG5ldyBUSFJFRS5FdWxlcigpLnNldEZyb21RdWF0ZXJuaW9uKHRoaXMuY29udHJvbGxlclEsICdZWFonKTtcbiAgICBsZXQgY29udHJvbGxlclhEZWcgPSBUSFJFRS5NYXRoLnJhZFRvRGVnKGNvbnRyb2xsZXJFdWxlci54KTtcbiAgICBsZXQgZXh0ZW5zaW9uUmF0aW8gPSB0aGlzLmNsYW1wXygoY29udHJvbGxlclhEZWcgLSAxMSkgLyAoNTAgLSAxMSksIDAsIDEpO1xuXG4gICAgLy8gQ29udHJvbGxlciBvcmllbnRhdGlvbiBpbiBjYW1lcmEgc3BhY2UuXG4gICAgbGV0IGNvbnRyb2xsZXJDYW1lcmFRID0gdGhpcy5yb290US5jbG9uZSgpLmludmVyc2UoKTtcbiAgICBjb250cm9sbGVyQ2FtZXJhUS5tdWx0aXBseSh0aGlzLmNvbnRyb2xsZXJRKTtcblxuICAgIC8vIENhbGN1bGF0ZSBlbGJvdyBwb3NpdGlvbi5cbiAgICBsZXQgZWxib3dQb3MgPSB0aGlzLmVsYm93UG9zO1xuICAgIGVsYm93UG9zLmNvcHkodGhpcy5oZWFkUG9zKS5hZGQoSEVBRF9FTEJPV19PRkZTRVQpO1xuICAgIGxldCBlbGJvd09mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShBUk1fRVhURU5TSU9OX09GRlNFVCk7XG4gICAgZWxib3dPZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xuICAgIGVsYm93UG9zLmFkZChlbGJvd09mZnNldCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgam9pbnQgYW5nbGVzLiBHZW5lcmFsbHkgNDAlIG9mIHJvdGF0aW9uIGFwcGxpZWQgdG8gZWxib3csIDYwJVxuICAgIC8vIHRvIHdyaXN0LCBidXQgaWYgY29udHJvbGxlciBpcyByYWlzZWQgaGlnaGVyLCBtb3JlIHJvdGF0aW9uIGNvbWVzIGZyb21cbiAgICAvLyB0aGUgd3Jpc3QuXG4gICAgbGV0IHRvdGFsQW5nbGUgPSB0aGlzLnF1YXRBbmdsZV8oY29udHJvbGxlckNhbWVyYVEsIG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkpO1xuICAgIGxldCB0b3RhbEFuZ2xlRGVnID0gVEhSRUUuTWF0aC5yYWRUb0RlZyh0b3RhbEFuZ2xlKTtcbiAgICBsZXQgbGVycFN1cHByZXNzaW9uID0gMSAtIE1hdGgucG93KHRvdGFsQW5nbGVEZWcgLyAxODAsIDQpOyAvLyBUT0RPKHNtdXMpOiA/Pz9cblxuICAgIGxldCBlbGJvd1JhdGlvID0gRUxCT1dfQkVORF9SQVRJTztcbiAgICBsZXQgd3Jpc3RSYXRpbyA9IDEgLSBFTEJPV19CRU5EX1JBVElPO1xuICAgIGxldCBsZXJwVmFsdWUgPSBsZXJwU3VwcHJlc3Npb24gKlxuICAgICAgICAoZWxib3dSYXRpbyArIHdyaXN0UmF0aW8gKiBleHRlbnNpb25SYXRpbyAqIEVYVEVOU0lPTl9SQVRJT19XRUlHSFQpO1xuXG4gICAgbGV0IHdyaXN0USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2xlcnAoY29udHJvbGxlckNhbWVyYVEsIGxlcnBWYWx1ZSk7XG4gICAgbGV0IGludldyaXN0USA9IHdyaXN0US5pbnZlcnNlKCk7XG4gICAgbGV0IGVsYm93USA9IGNvbnRyb2xsZXJDYW1lcmFRLmNsb25lKCkubXVsdGlwbHkoaW52V3Jpc3RRKTtcblxuICAgIC8vIENhbGN1bGF0ZSBvdXIgZmluYWwgY29udHJvbGxlciBwb3NpdGlvbiBiYXNlZCBvbiBhbGwgb3VyIGpvaW50IHJvdGF0aW9uc1xuICAgIC8vIGFuZCBsZW5ndGhzLlxuICAgIC8qXG4gICAgcG9zaXRpb25fID1cbiAgICAgIHJvb3Rfcm90XyAqIChcbiAgICAgICAgY29udHJvbGxlcl9yb290X29mZnNldF8gK1xuMjogICAgICAoYXJtX2V4dGVuc2lvbl8gKiBhbXRfZXh0ZW5zaW9uKSArXG4xOiAgICAgIGVsYm93X3JvdCAqIChrQ29udHJvbGxlckZvcmVhcm0gKyAod3Jpc3Rfcm90ICoga0NvbnRyb2xsZXJQb3NpdGlvbikpXG4gICAgICApO1xuICAgICovXG4gICAgbGV0IHdyaXN0UG9zID0gdGhpcy53cmlzdFBvcztcbiAgICB3cmlzdFBvcy5jb3B5KFdSSVNUX0NPTlRST0xMRVJfT0ZGU0VUKTtcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24od3Jpc3RRKTtcbiAgICB3cmlzdFBvcy5hZGQoRUxCT1dfV1JJU1RfT0ZGU0VUKTtcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24oZWxib3dRKTtcbiAgICB3cmlzdFBvcy5hZGQodGhpcy5lbGJvd1Bvcyk7XG5cbiAgICBsZXQgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KEFSTV9FWFRFTlNJT05fT0ZGU0VUKTtcbiAgICBvZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xuXG4gICAgbGV0IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHRoaXMud3Jpc3RQb3MpO1xuICAgIHBvc2l0aW9uLmFkZChvZmZzZXQpO1xuICAgIHBvc2l0aW9uLmFwcGx5UXVhdGVybmlvbih0aGlzLnJvb3RRKTtcblxuICAgIGxldCBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuY29weSh0aGlzLmNvbnRyb2xsZXJRKTtcblxuICAgIC8vIFNldCB0aGUgcmVzdWx0aW5nIHBvc2Ugb3JpZW50YXRpb24gYW5kIHBvc2l0aW9uLlxuICAgIHRoaXMucG9zZS5vcmllbnRhdGlvbi5jb3B5KG9yaWVudGF0aW9uKTtcbiAgICB0aGlzLnBvc2UucG9zaXRpb24uY29weShwb3NpdGlvbik7XG5cbiAgICB0aGlzLmxhc3RUaW1lID0gdGhpcy50aW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBvc2UgY2FsY3VsYXRlZCBieSB0aGUgbW9kZWwuXG4gICAqL1xuICBnZXRQb3NlKCkge1xuICAgIHJldHVybiB0aGlzLnBvc2U7XG4gIH1cblxuICAvKipcbiAgICogRGVidWcgbWV0aG9kcyBmb3IgcmVuZGVyaW5nIHRoZSBhcm0gbW9kZWwuXG4gICAqL1xuICBnZXRGb3JlYXJtTGVuZ3RoKCkge1xuICAgIHJldHVybiBFTEJPV19XUklTVF9PRkZTRVQubGVuZ3RoKCk7XG4gIH1cblxuICBnZXRFbGJvd1Bvc2l0aW9uKCkge1xuICAgIGxldCBvdXQgPSB0aGlzLmVsYm93UG9zLmNsb25lKCk7XG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG4gIH1cblxuICBnZXRXcmlzdFBvc2l0aW9uKCkge1xuICAgIGxldCBvdXQgPSB0aGlzLndyaXN0UG9zLmNsb25lKCk7XG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG4gIH1cblxuICBnZXRIZWFkWWF3T3JpZW50YXRpb25fKCkge1xuICAgIGxldCBoZWFkRXVsZXIgPSBuZXcgVEhSRUUuRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbih0aGlzLmhlYWRRLCAnWVhaJyk7XG4gICAgaGVhZEV1bGVyLnggPSAwO1xuICAgIGhlYWRFdWxlci56ID0gMDtcbiAgICBsZXQgZGVzdGluYXRpb25RID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoaGVhZEV1bGVyKTtcbiAgICByZXR1cm4gZGVzdGluYXRpb25RO1xuICB9XG5cbiAgY2xhbXBfKHZhbHVlLCBtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCh2YWx1ZSwgbWluKSwgbWF4KTtcbiAgfVxuXG4gIHF1YXRBbmdsZV8ocTEsIHEyKSB7XG4gICAgbGV0IHZlYzEgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbGV0IHZlYzIgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgdmVjMS5hcHBseVF1YXRlcm5pb24ocTEpO1xuICAgIHZlYzIuYXBwbHlRdWF0ZXJuaW9uKHEyKTtcbiAgICByZXR1cm4gdmVjMS5hbmdsZVRvKHZlYzIpO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnXG5pbXBvcnQgSW50ZXJhY3Rpb25Nb2RlcyBmcm9tICcuL3JheS1pbnRlcmFjdGlvbi1tb2RlcydcbmltcG9ydCB7aXNNb2JpbGV9IGZyb20gJy4vdXRpbCdcblxuY29uc3QgRFJBR19ESVNUQU5DRV9QWCA9IDEwO1xuXG4vKipcbiAqIEVudW1lcmF0ZXMgYWxsIHBvc3NpYmxlIGludGVyYWN0aW9uIG1vZGVzLiBTZXRzIHVwIGFsbCBldmVudCBoYW5kbGVycyAobW91c2UsXG4gKiB0b3VjaCwgZXRjKSwgaW50ZXJmYWNlcyB3aXRoIGdhbWVwYWQgQVBJLlxuICpcbiAqIEVtaXRzIGV2ZW50czpcbiAqICAgIGFjdGlvbjogSW5wdXQgaXMgYWN0aXZhdGVkIChtb3VzZWRvd24sIHRvdWNoc3RhcnQsIGRheWRyZWFtIGNsaWNrLCB2aXZlIHRyaWdnZXIpLlxuICogICAgcmVsZWFzZTogSW5wdXQgaXMgZGVhY3RpdmF0ZWQgKG1vdXNldXAsIHRvdWNoZW5kLCBkYXlkcmVhbSByZWxlYXNlLCB2aXZlIHJlbGVhc2UpLlxuICogICAgY2FuY2VsOiBJbnB1dCBpcyBjYW5jZWxlZCAoZWcuIHdlIHNjcm9sbGVkIGluc3RlYWQgb2YgdGFwcGluZyBvbiBtb2JpbGUvZGVza3RvcCkuXG4gKiAgICBwb2ludGVybW92ZSgyRCBwb3NpdGlvbik6IFRoZSBwb2ludGVyIGlzIG1vdmVkIChtb3VzZSBvciB0b3VjaCkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUNvbnRyb2xsZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihvcHRfZWwpIHtcbiAgICBzdXBlcigpO1xuICAgIGxldCBlbCA9IG9wdF9lbCB8fCB3aW5kb3c7XG5cbiAgICAvLyBIYW5kbGUgaW50ZXJhY3Rpb25zLlxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZURvd25fLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmVfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2VVcF8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0Xy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZF8uYmluZCh0aGlzKSk7XG5cbiAgICAvLyBUaGUgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXG4gICAgdGhpcy5wb2ludGVyID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAvLyBUaGUgcHJldmlvdXMgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXG4gICAgdGhpcy5sYXN0UG9pbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgLy8gUG9zaXRpb24gb2YgcG9pbnRlciBpbiBOb3JtYWxpemVkIERldmljZSBDb29yZGluYXRlcyAoTkRDKS5cbiAgICB0aGlzLnBvaW50ZXJOZGMgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIC8vIEhvdyBtdWNoIHdlIGhhdmUgZHJhZ2dlZCAoaWYgd2UgYXJlIGRyYWdnaW5nKS5cbiAgICB0aGlzLmRyYWdEaXN0YW5jZSA9IDA7XG4gICAgLy8gQXJlIHdlIGRyYWdnaW5nIG9yIG5vdC5cbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAvLyBJcyBwb2ludGVyIGFjdGl2ZSBvciBub3QuXG4gICAgdGhpcy5pc1RvdWNoQWN0aXZlID0gZmFsc2U7XG4gICAgLy8gSXMgdGhpcyBhIHN5bnRoZXRpYyBtb3VzZSBldmVudD9cbiAgICB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCA9IGZhbHNlO1xuXG4gICAgLy8gR2FtZXBhZCBldmVudHMuXG4gICAgdGhpcy5nYW1lcGFkID0gbnVsbDtcblxuICAgIC8vIFZSIEV2ZW50cy5cbiAgICBpZiAoIW5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1dlYlZSIEFQSSBub3QgYXZhaWxhYmxlISBDb25zaWRlciB1c2luZyB0aGUgd2VidnItcG9seWZpbGwuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKCkudGhlbigoZGlzcGxheXMpID0+IHtcbiAgICAgICAgdGhpcy52ckRpc3BsYXkgPSBkaXNwbGF5c1swXTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGdldEludGVyYWN0aW9uTW9kZSgpIHtcbiAgICAvLyBUT0RPOiBEZWJ1Z2dpbmcgb25seS5cbiAgICAvL3JldHVybiBJbnRlcmFjdGlvbk1vZGVzLkRBWURSRUFNO1xuXG4gICAgdmFyIGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcblxuICAgIGlmIChnYW1lcGFkKSB7XG4gICAgICBsZXQgcG9zZSA9IGdhbWVwYWQucG9zZTtcbiAgICAgIC8vIElmIHRoZXJlJ3MgYSBnYW1lcGFkIGNvbm5lY3RlZCwgZGV0ZXJtaW5lIGlmIGl0J3MgRGF5ZHJlYW0gb3IgYSBWaXZlLlxuICAgICAgaWYgKHBvc2UuaGFzUG9zaXRpb24pIHtcbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVlJfNkRPRjtcbiAgICAgIH1cblxuICAgICAgaWYgKHBvc2UuaGFzT3JpZW50YXRpb24pIHtcbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRjtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQsIGl0IG1pZ2h0IGJlIENhcmRib2FyZCwgbWFnaWMgd2luZG93IG9yIGRlc2t0b3AuXG4gICAgICBpZiAoaXNNb2JpbGUoKSkge1xuICAgICAgICAvLyBFaXRoZXIgQ2FyZGJvYXJkIG9yIG1hZ2ljIHdpbmRvdywgZGVwZW5kaW5nIG9uIHdoZXRoZXIgd2UgYXJlXG4gICAgICAgIC8vIHByZXNlbnRpbmcuXG4gICAgICAgIGlmICh0aGlzLnZyRGlzcGxheSAmJiB0aGlzLnZyRGlzcGxheS5pc1ByZXNlbnRpbmcpIHtcbiAgICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8wRE9GO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlRPVUNIO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZSBtdXN0IGJlIG9uIGRlc2t0b3AuXG4gICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLk1PVVNFO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBCeSBkZWZhdWx0LCB1c2UgVE9VQ0guXG4gICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVE9VQ0g7XG4gIH1cblxuICBnZXRHYW1lcGFkUG9zZSgpIHtcbiAgICBsZXQgZ2FtZXBhZCA9IHRoaXMuZ2V0VlJHYW1lcGFkXygpO1xuICAgIGlmIChnYW1lcGFkICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZ2FtZXBhZC5wb3NlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGlmIHRoZXJlIGlzIGFuIGFjdGl2ZSB0b3VjaCBldmVudCBnb2luZyBvbi5cbiAgICogT25seSByZWxldmFudCBvbiB0b3VjaCBkZXZpY2VzXG4gICAqL1xuICBnZXRJc1RvdWNoQWN0aXZlKCkge1xuICAgIHJldHVybiB0aGlzLmlzVG91Y2hBY3RpdmU7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgY2xpY2sgaXMgdGhlIGNhcmRib2FyZC1jb21wYXRpYmxlIGZhbGxiYWNrXG4gICAqIGNsaWNrIG9uIERheWRyZWFtIGNvbnRyb2xsZXJzIHNvIHRoYXQgd2UgY2FuIGRlZHVwbGljYXRlIGl0LlxuICAgKiBUT0RPKGtsYXVzdyk6IEl0IHdvdWxkIGJlIG5pY2UgdG8gYmUgYWJsZSB0byBtb3ZlIGludGVyYWN0aW9uc1xuICAgKiB0byB0aGlzIGV2ZW50IHNpbmNlIGl0IGNvdW50cyBhcyBhIHVzZXIgYWN0aW9uIHdoaWxlIGNvbnRyb2xsZXJcbiAgICogY2xpY2tzIGRvbid0LiBCdXQgdGhhdCB3b3VsZCByZXF1aXJlIGxhcmdlciByZWZhY3RvcmluZy5cbiAgICovXG4gIGlzQ2FyZGJvYXJkQ29tcGF0Q2xpY2soZSkge1xuICAgIGxldCBtb2RlID0gdGhpcy5nZXRJbnRlcmFjdGlvbk1vZGUoKTtcbiAgICBpZiAobW9kZSA9PSBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0YgJiYgZS5zY3JlZW5YID09IDAgJiYgZS5zY3JlZW5ZID09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzZXRTaXplKHNpemUpIHtcbiAgICB0aGlzLnNpemUgPSBzaXplO1xuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIGxldCBtb2RlID0gdGhpcy5nZXRJbnRlcmFjdGlvbk1vZGUoKTtcbiAgICBpZiAobW9kZSA9PSBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0YgfHwgbW9kZSA9PSBJbnRlcmFjdGlvbk1vZGVzLlZSXzZET0YpIHtcbiAgICAgIC8vIElmIHdlJ3JlIGRlYWxpbmcgd2l0aCBhIGdhbWVwYWQsIGNoZWNrIGV2ZXJ5IGFuaW1hdGlvbiBmcmFtZSBmb3IgYVxuICAgICAgLy8gcHJlc3NlZCBhY3Rpb24uXG4gICAgICBsZXQgaXNHYW1lcGFkUHJlc3NlZCA9IHRoaXMuZ2V0R2FtZXBhZEJ1dHRvblByZXNzZWRfKCk7XG4gICAgICBpZiAoaXNHYW1lcGFkUHJlc3NlZCAmJiAhdGhpcy53YXNHYW1lcGFkUHJlc3NlZCkge1xuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmVtaXQoJ3JheWRvd24nKTtcbiAgICAgIH1cbiAgICAgIGlmICghaXNHYW1lcGFkUHJlc3NlZCAmJiB0aGlzLndhc0dhbWVwYWRQcmVzc2VkKSB7XG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVtaXQoJ3JheXVwJyk7XG4gICAgICB9XG4gICAgICB0aGlzLndhc0dhbWVwYWRQcmVzc2VkID0gaXNHYW1lcGFkUHJlc3NlZDtcblxuICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZykge1xuICAgICAgICB0aGlzLmVtaXQoJ3JheWRyYWcnKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRHYW1lcGFkQnV0dG9uUHJlc3NlZF8oKSB7XG4gICAgdmFyIGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcbiAgICBpZiAoIWdhbWVwYWQpIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCwgdGhlIGJ1dHRvbiB3YXMgbm90IHByZXNzZWQuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGZvciBjbGlja3MuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBnYW1lcGFkLmJ1dHRvbnMubGVuZ3RoOyArK2opIHtcbiAgICAgIGlmIChnYW1lcGFkLmJ1dHRvbnNbal0ucHJlc3NlZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgb25Nb3VzZURvd25fKGUpIHtcbiAgICBpZiAodGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQpIHJldHVybjtcbiAgICBpZiAodGhpcy5pc0NhcmRib2FyZENvbXBhdENsaWNrKGUpKSByZXR1cm47XG5cbiAgICB0aGlzLnN0YXJ0RHJhZ2dpbmdfKGUpO1xuICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xuICB9XG5cbiAgb25Nb3VzZU1vdmVfKGUpIHtcbiAgICBpZiAodGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQpIHJldHVybjtcblxuICAgIHRoaXMudXBkYXRlUG9pbnRlcl8oZSk7XG4gICAgdGhpcy51cGRhdGVEcmFnRGlzdGFuY2VfKCk7XG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XG4gIH1cblxuICBvbk1vdXNlVXBfKGUpIHtcbiAgICB2YXIgaXNTeW50aGV0aWMgPSB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudDtcbiAgICB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCA9IGZhbHNlO1xuICAgIGlmIChpc1N5bnRoZXRpYykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmlzQ2FyZGJvYXJkQ29tcGF0Q2xpY2soZSkpIHJldHVybjtcblxuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XG4gIH1cblxuICBvblRvdWNoU3RhcnRfKGUpIHtcbiAgICB0aGlzLmlzVG91Y2hBY3RpdmUgPSB0cnVlO1xuICAgIHZhciB0ID0gZS50b3VjaGVzWzBdO1xuICAgIHRoaXMuc3RhcnREcmFnZ2luZ18odCk7XG4gICAgdGhpcy51cGRhdGVUb3VjaFBvaW50ZXJfKGUpO1xuXG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG4gIH1cblxuICBvblRvdWNoTW92ZV8oZSkge1xuICAgIHRoaXMudXBkYXRlVG91Y2hQb2ludGVyXyhlKTtcbiAgICB0aGlzLnVwZGF0ZURyYWdEaXN0YW5jZV8oKTtcbiAgfVxuXG4gIG9uVG91Y2hFbmRfKGUpIHtcbiAgICB0aGlzLmVuZERyYWdnaW5nXygpO1xuXG4gICAgLy8gU3VwcHJlc3MgZHVwbGljYXRlIGV2ZW50cyBmcm9tIHN5bnRoZXRpYyBtb3VzZSBldmVudHMuXG4gICAgdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQgPSB0cnVlO1xuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVG91Y2hQb2ludGVyXyhlKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyB0b3VjaGVzIGFycmF5LCBpZ25vcmUuXG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUud2FybignUmVjZWl2ZWQgdG91Y2ggZXZlbnQgd2l0aCBubyB0b3VjaGVzLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdCA9IGUudG91Y2hlc1swXTtcbiAgICB0aGlzLnVwZGF0ZVBvaW50ZXJfKHQpO1xuICB9XG5cbiAgdXBkYXRlUG9pbnRlcl8oZSkge1xuICAgIC8vIEhvdyBtdWNoIHRoZSBwb2ludGVyIG1vdmVkLlxuICAgIHRoaXMucG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICAgIHRoaXMucG9pbnRlck5kYy54ID0gKGUuY2xpZW50WCAvIHRoaXMuc2l6ZS53aWR0aCkgKiAyIC0gMTtcbiAgICB0aGlzLnBvaW50ZXJOZGMueSA9IC0gKGUuY2xpZW50WSAvIHRoaXMuc2l6ZS5oZWlnaHQpICogMiArIDE7XG4gIH1cblxuICB1cGRhdGVEcmFnRGlzdGFuY2VfKCkge1xuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgIHZhciBkaXN0YW5jZSA9IHRoaXMubGFzdFBvaW50ZXIuc3ViKHRoaXMucG9pbnRlcikubGVuZ3RoKCk7XG4gICAgICB0aGlzLmRyYWdEaXN0YW5jZSArPSBkaXN0YW5jZTtcbiAgICAgIHRoaXMubGFzdFBvaW50ZXIuY29weSh0aGlzLnBvaW50ZXIpO1xuXG5cbiAgICAgIC8vY29uc29sZS5sb2coJ2RyYWdEaXN0YW5jZScsIHRoaXMuZHJhZ0Rpc3RhbmNlKTtcbiAgICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA+IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnKTtcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhcnREcmFnZ2luZ18oZSkge1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgdGhpcy5sYXN0UG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICB9XG5cbiAgZW5kRHJhZ2dpbmdfKCkge1xuICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA8IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgIHRoaXMuZW1pdCgncmF5dXAnKTtcbiAgICB9XG4gICAgdGhpcy5kcmFnRGlzdGFuY2UgPSAwO1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZpcnN0IFZSLWVuYWJsZWQgZ2FtZXBhZC5cbiAgICovXG4gIGdldFZSR2FtZXBhZF8oKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkIEFQSSwgdGhlcmUncyBubyBnYW1lcGFkLlxuICAgIGlmICghbmF2aWdhdG9yLmdldEdhbWVwYWRzKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZ2FtZXBhZHMgPSBuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVwYWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZ2FtZXBhZCA9IGdhbWVwYWRzW2ldO1xuXG4gICAgICAvLyBUaGUgYXJyYXkgbWF5IGNvbnRhaW4gdW5kZWZpbmVkIGdhbWVwYWRzLCBzbyBjaGVjayBmb3IgdGhhdCBhcyB3ZWxsIGFzXG4gICAgICAvLyBhIG5vbi1udWxsIHBvc2UuXG4gICAgICBpZiAoZ2FtZXBhZCAmJiBnYW1lcGFkLnBvc2UpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVwYWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgT3JpZW50YXRpb25Bcm1Nb2RlbCBmcm9tICcuL29yaWVudGF0aW9uLWFybS1tb2RlbCdcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcbmltcG9ydCBSYXlSZW5kZXJlciBmcm9tICcuL3JheS1yZW5kZXJlcidcbmltcG9ydCBSYXlDb250cm9sbGVyIGZyb20gJy4vcmF5LWNvbnRyb2xsZXInXG5pbXBvcnQgSW50ZXJhY3Rpb25Nb2RlcyBmcm9tICcuL3JheS1pbnRlcmFjdGlvbi1tb2RlcydcblxuLyoqXG4gKiBBUEkgd3JhcHBlciBmb3IgdGhlIGlucHV0IGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUlucHV0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY2FtZXJhLCBvcHRfZWwpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgdGhpcy5yZW5kZXJlciA9IG5ldyBSYXlSZW5kZXJlcihjYW1lcmEpO1xuICAgIHRoaXMuY29udHJvbGxlciA9IG5ldyBSYXlDb250cm9sbGVyKG9wdF9lbCk7XG5cbiAgICAvLyBBcm0gbW9kZWwgbmVlZGVkIHRvIHRyYW5zZm9ybSBjb250cm9sbGVyIG9yaWVudGF0aW9uIGludG8gcHJvcGVyIHBvc2UuXG4gICAgdGhpcy5hcm1Nb2RlbCA9IG5ldyBPcmllbnRhdGlvbkFybU1vZGVsKCk7XG5cbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheWRvd24nLCB0aGlzLm9uUmF5RG93bl8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXl1cCcsIHRoaXMub25SYXlVcF8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXljYW5jZWwnLCB0aGlzLm9uUmF5Q2FuY2VsXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3BvaW50ZXJtb3ZlJywgdGhpcy5vblBvaW50ZXJNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheWRyYWcnLCB0aGlzLm9uUmF5RHJhZ18uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5yZW5kZXJlci5vbigncmF5b3ZlcicsIChtZXNoKSA9PiB7IHRoaXMuZW1pdCgncmF5b3ZlcicsIG1lc2gpIH0pO1xuICAgIHRoaXMucmVuZGVyZXIub24oJ3JheW91dCcsIChtZXNoKSA9PiB7IHRoaXMuZW1pdCgncmF5b3V0JywgbWVzaCkgfSk7XG5cbiAgICAvLyBCeSBkZWZhdWx0LCBwdXQgdGhlIHBvaW50ZXIgb2Zmc2NyZWVuLlxuICAgIHRoaXMucG9pbnRlck5kYyA9IG5ldyBUSFJFRS5WZWN0b3IyKDEsIDEpO1xuXG4gICAgLy8gRXZlbnQgaGFuZGxlcnMuXG4gICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICB9XG5cbiAgYWRkKG9iamVjdCwgaGFuZGxlcnMpIHtcbiAgICB0aGlzLnJlbmRlcmVyLmFkZChvYmplY3QsIGhhbmRsZXJzKTtcbiAgICB0aGlzLmhhbmRsZXJzW29iamVjdC5pZF0gPSBoYW5kbGVycztcbiAgfVxuXG4gIHJlbW92ZShvYmplY3QpIHtcbiAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZShvYmplY3QpO1xuICAgIGRlbGV0ZSB0aGlzLmhhbmRsZXJzW29iamVjdC5pZF1cbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICBsZXQgbG9va0F0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIGxvb2tBdC5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG5cbiAgICBsZXQgbW9kZSA9IHRoaXMuY29udHJvbGxlci5nZXRJbnRlcmFjdGlvbk1vZGUoKTtcbiAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5NT1VTRTpcbiAgICAgICAgLy8gRGVza3RvcCBtb3VzZSBtb2RlLCBtb3VzZSBjb29yZGluYXRlcyBhcmUgd2hhdCBtYXR0ZXJzLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvaW50ZXIodGhpcy5wb2ludGVyTmRjKTtcbiAgICAgICAgLy8gSGlkZSB0aGUgcmF5IGFuZCByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkoZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KGZhbHNlKTtcblxuICAgICAgICAvLyBJbiBtb3VzZSBtb2RlIHJheSByZW5kZXJlciBpcyBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDpcbiAgICAgICAgLy8gTW9iaWxlIG1hZ2ljIHdpbmRvdyBtb2RlLiBUb3VjaCBjb29yZGluYXRlcyBtYXR0ZXIsIGJ1dCB3ZSB3YW50IHRvXG4gICAgICAgIC8vIGhpZGUgdGhlIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9pbnRlcih0aGlzLnBvaW50ZXJOZGMpO1xuXG4gICAgICAgIC8vIEhpZGUgdGhlIHJheSBhbmQgdGhlIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkoZmFsc2UpO1xuXG4gICAgICAgIC8vIEluIHRvdWNoIG1vZGUgdGhlIHJheSByZW5kZXJlciBpcyBvbmx5IGFjdGl2ZSBvbiB0b3VjaC5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodGhpcy5jb250cm9sbGVyLmdldElzVG91Y2hBY3RpdmUoKSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVlJfMERPRjpcbiAgICAgICAgLy8gQ2FyZGJvYXJkIG1vZGUsIHdlJ3JlIGRlYWxpbmcgd2l0aCBhIGdhemUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbih0aGlzLmNhbWVyYS5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG5cbiAgICAgICAgLy8gUmV0aWNsZSBvbmx5LlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkoZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KHRydWUpO1xuXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GOlxuICAgICAgICAvLyBEYXlkcmVhbSwgb3VyIG9yaWdpbiBpcyBzbGlnaHRseSBvZmYgKGRlcGVuZGluZyBvbiBoYW5kZWRuZXNzKS5cbiAgICAgICAgLy8gQnV0IHdlIHNob3VsZCBiZSB1c2luZyB0aGUgb3JpZW50YXRpb24gZnJvbSB0aGUgZ2FtZXBhZC5cbiAgICAgICAgLy8gVE9ETyhzbXVzKTogSW1wbGVtZW50IHRoZSByZWFsIGFybSBtb2RlbC5cbiAgICAgICAgdmFyIHBvc2UgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0R2FtZXBhZFBvc2UoKTtcblxuICAgICAgICAvLyBEZWJ1ZyBvbmx5OiB1c2UgY2FtZXJhIGFzIGlucHV0IGNvbnRyb2xsZXIuXG4gICAgICAgIC8vbGV0IGNvbnRyb2xsZXJPcmllbnRhdGlvbiA9IHRoaXMuY2FtZXJhLnF1YXRlcm5pb247XG4gICAgICAgIGxldCBjb250cm9sbGVyT3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLmZyb21BcnJheShwb3NlLm9yaWVudGF0aW9uKTtcblxuICAgICAgICAvLyBUcmFuc2Zvcm0gdGhlIGNvbnRyb2xsZXIgaW50byB0aGUgY2FtZXJhIGNvb3JkaW5hdGUgc3lzdGVtLlxuICAgICAgICAvKlxuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ubXVsdGlwbHkoXG4gICAgICAgICAgICBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21BeGlzQW5nbGUobmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCksIE1hdGguUEkpKTtcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLnggKj0gLTE7XG4gICAgICAgIGNvbnRyb2xsZXJPcmllbnRhdGlvbi56ICo9IC0xO1xuICAgICAgICAqL1xuXG4gICAgICAgIC8vIEZlZWQgY2FtZXJhIGFuZCBjb250cm9sbGVyIGludG8gdGhlIGFybSBtb2RlbC5cbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkT3JpZW50YXRpb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG4gICAgICAgIHRoaXMuYXJtTW9kZWwuc2V0SGVhZFBvc2l0aW9uKHRoaXMuY2FtZXJhLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRDb250cm9sbGVyT3JpZW50YXRpb24oY29udHJvbGxlck9yaWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC51cGRhdGUoKTtcblxuICAgICAgICAvLyBHZXQgcmVzdWx0aW5nIHBvc2UgYW5kIGNvbmZpZ3VyZSB0aGUgcmVuZGVyZXIuXG4gICAgICAgIGxldCBtb2RlbFBvc2UgPSB0aGlzLmFybU1vZGVsLmdldFBvc2UoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbihtb2RlbFBvc2UucG9zaXRpb24pO1xuICAgICAgICAvL3RoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24obmV3IFRIUkVFLlZlY3RvcjMoKSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24obW9kZWxQb3NlLm9yaWVudGF0aW9uKTtcbiAgICAgICAgLy90aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKGNvbnRyb2xsZXJPcmllbnRhdGlvbik7XG5cbiAgICAgICAgLy8gU2hvdyByYXkgYW5kIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eSh0cnVlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eSh0cnVlKTtcblxuICAgICAgICAvLyBSYXkgcmVuZGVyZXIgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVlJfNkRPRjpcbiAgICAgICAgLy8gVml2ZSwgb3JpZ2luIGRlcGVuZHMgb24gdGhlIHBvc2l0aW9uIG9mIHRoZSBjb250cm9sbGVyLlxuICAgICAgICAvLyBUT0RPKHNtdXMpLi4uXG4gICAgICAgIHZhciBwb3NlID0gdGhpcy5jb250cm9sbGVyLmdldEdhbWVwYWRQb3NlKCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgdGhhdCB0aGUgcG9zZSBpcyB2YWxpZC5cbiAgICAgICAgaWYgKCFwb3NlLm9yaWVudGF0aW9uIHx8ICFwb3NlLnBvc2l0aW9uKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIGdhbWVwYWQgcG9zZS4gQ2FuXFwndCB1cGRhdGUgcmF5LicpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGxldCBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuZnJvbUFycmF5KHBvc2Uub3JpZW50YXRpb24pO1xuICAgICAgICBsZXQgcG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpLmZyb21BcnJheShwb3NlLnBvc2l0aW9uKTtcblxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKG9yaWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbihwb3NpdGlvbik7XG5cbiAgICAgICAgLy8gU2hvdyByYXkgYW5kIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eSh0cnVlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eSh0cnVlKTtcblxuICAgICAgICAvLyBSYXkgcmVuZGVyZXIgYWx3YXlzIGFjdGl2ZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmVycm9yKCdVbmtub3duIGludGVyYWN0aW9uIG1vZGUuJyk7XG4gICAgfVxuICAgIHRoaXMucmVuZGVyZXIudXBkYXRlKCk7XG4gICAgdGhpcy5jb250cm9sbGVyLnVwZGF0ZSgpO1xuICB9XG5cbiAgc2V0U2l6ZShzaXplKSB7XG4gICAgdGhpcy5jb250cm9sbGVyLnNldFNpemUoc2l6ZSk7XG4gIH1cblxuICBnZXRNZXNoKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLmdldFJldGljbGVSYXlNZXNoKCk7XG4gIH1cblxuICBnZXRPcmlnaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0T3JpZ2luKCk7XG4gIH1cblxuICBnZXREaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0RGlyZWN0aW9uKCk7XG4gIH1cblxuICBnZXRSaWdodERpcmVjdGlvbigpIHtcbiAgICBsZXQgbG9va0F0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xuICAgIGxvb2tBdC5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XG4gICAgcmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IzKCkuY3Jvc3NWZWN0b3JzKGxvb2tBdCwgdGhpcy5jYW1lcmEudXApO1xuICB9XG5cbiAgb25SYXlEb3duXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlEb3duXycpO1xuXG4gICAgLy8gRm9yY2UgdGhlIHJlbmRlcmVyIHRvIHJheWNhc3QuXG4gICAgdGhpcy5yZW5kZXJlci51cGRhdGUoKTtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJywgbWVzaCk7XG5cbiAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcbiAgfVxuXG4gIG9uUmF5RHJhZ18oKSB7XG4gICAgdGhpcy5yZW5kZXJlci5zZXREcmFnZ2luZyh0cnVlKTtcbiAgICB0aGlzLmVtaXQoJ3JheWRyYWcnKTtcbiAgfVxuXG4gIG9uUmF5VXBfKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheVVwXycpO1xuICAgIHRoaXMucmVuZGVyZXIuc2V0RHJhZ2dpbmcoZmFsc2UpO1xuICAgIGxldCBtZXNoID0gdGhpcy5yZW5kZXJlci5nZXRTZWxlY3RlZE1lc2goKTtcbiAgICB0aGlzLmVtaXQoJ3JheXVwJywgbWVzaCk7XG5cbiAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZShmYWxzZSk7XG4gIH1cblxuICBvblJheUNhbmNlbF8oZSkge1xuICAgIC8vY29uc29sZS5sb2coJ29uUmF5Q2FuY2VsXycpO1xuICAgIHRoaXMucmVuZGVyZXIuc2V0RHJhZ2dpbmcoZmFsc2UpO1xuICAgIGxldCBtZXNoID0gdGhpcy5yZW5kZXJlci5nZXRTZWxlY3RlZE1lc2goKTtcbiAgICB0aGlzLmVtaXQoJ3JheWNhbmNlbCcsIG1lc2gpO1xuICB9XG5cbiAgb25Qb2ludGVyTW92ZV8obmRjKSB7XG4gICAgdGhpcy5wb2ludGVyTmRjLmNvcHkobmRjKTtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEludGVyYWN0aW9uTW9kZXMgPSB7XG4gIE1PVVNFOiAxLFxuICBUT1VDSDogMixcbiAgVlJfMERPRjogMyxcbiAgVlJfM0RPRjogNCxcbiAgVlJfNkRPRjogNVxufTtcblxuZXhwb3J0IHsgSW50ZXJhY3Rpb25Nb2RlcyBhcyBkZWZhdWx0IH07XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQge2Jhc2U2NH0gZnJvbSAnLi91dGlsJ1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xuXG5jb25zdCBSRVRJQ0xFX0RJU1RBTkNFID0gMztcbmNvbnN0IElOTkVSX1JBRElVUyA9IDAuMDI7XG5jb25zdCBPVVRFUl9SQURJVVMgPSAwLjA0O1xuY29uc3QgUkFZX1JBRElVUyA9IDAuMDI7XG5jb25zdCBHUkFESUVOVF9JTUFHRSA9IGJhc2U2NCgnaW1hZ2UvcG5nJywgJ2lWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFJQUFBQUNBQ0FZQUFBRERQbUhMQUFBQmRrbEVRVlI0bk8zV3dYSEVRQXdEUWNpbi9GT1d3K0JqdWlQWUIycTRHMm5QOTMzUDlTTzQ4MjR6Z0RBRGlET0F1SGZiMy9VanVLTUFjUVlRWndCeC9nQnhDaENuQUhFS0VLY0FjUW9RcHdCeENoQ25BSEVHRUdjQWNmNEFjUW9RWndCeEJoQm5BSEVHRUdjQWNRWVFad0J4QmhCbkFIRUdFR2NBY1FZUVp3QnhCaEJuQUhIdnR0LzFJN2lqQUhFR0VHY0FjZjRBY1FvUVp3QnhUa0NjQXNRWlFKd1RFS2NBY1FvUXB3QnhCaERuQk1RcFFKd0N4Q2xBbkFMRUtVQ2NBc1FwUUp3Q3hDbEFuQUxFS1VDY0FzUXBRSndCeERrQmNRb1Fwd0J4Q2hDbkFIRUtFS2NBY1FvUXB3QnhDaENuQUhFS0VHY0FjVTVBbkFMRUtVQ2NBc1FaUUp3VEVLY0FjUVlRNXdURUtVQ2NBY1FaUUp3L1FKd0N4QmxBbkFIRUdVQ2NBY1FaUUp3QnhCbEFuQUhFR1VDY0FjUVpRSndCeEJsQW5BSEVHVURjdSsyNWZnUjNGQ0RPQU9JTUlNNGZJRTRCNGhRZ1RnSGlGQ0JPQWVJVUlFNEI0aFFnemdEaURDRE9IeUJPQWVJTUlNNEE0djRCLzVJRjllRDZReGdBQUFBQVNVVk9SSzVDWUlJPScpO1xuXG4vKipcbiAqIEhhbmRsZXMgcmF5IGlucHV0IHNlbGVjdGlvbiBmcm9tIGZyYW1lIG9mIHJlZmVyZW5jZSBvZiBhbiBhcmJpdHJhcnkgb2JqZWN0LlxuICpcbiAqIFRoZSBzb3VyY2Ugb2YgdGhlIHJheSBpcyBmcm9tIHZhcmlvdXMgbG9jYXRpb25zOlxuICpcbiAqIERlc2t0b3A6IG1vdXNlLlxuICogTWFnaWMgd2luZG93OiB0b3VjaC5cbiAqIENhcmRib2FyZDogY2FtZXJhLlxuICogRGF5ZHJlYW06IDNET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cbiAqIFZpdmU6IDZET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cbiAqXG4gKiBFbWl0cyBzZWxlY3Rpb24gZXZlbnRzOlxuICogICAgIHJheW92ZXIobWVzaCk6IFRoaXMgbWVzaCB3YXMgc2VsZWN0ZWQuXG4gKiAgICAgcmF5b3V0KG1lc2gpOiBUaGlzIG1lc2ggd2FzIHVuc2VsZWN0ZWQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheVJlbmRlcmVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY2FtZXJhLCBvcHRfcGFyYW1zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXG4gICAgdmFyIHBhcmFtcyA9IG9wdF9wYXJhbXMgfHwge307XG5cbiAgICAvLyBXaGljaCBvYmplY3RzIGFyZSBpbnRlcmFjdGl2ZSAoa2V5ZWQgb24gaWQpLlxuICAgIHRoaXMubWVzaGVzID0ge307XG5cbiAgICAvLyBXaGljaCBvYmplY3RzIGFyZSBjdXJyZW50bHkgc2VsZWN0ZWQgKGtleWVkIG9uIGlkKS5cbiAgICB0aGlzLnNlbGVjdGVkID0ge307XG5cbiAgICAvLyBUaGUgcmF5Y2FzdGVyLlxuICAgIHRoaXMucmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuXG4gICAgLy8gUG9zaXRpb24gYW5kIG9yaWVudGF0aW9uLCBpbiBhZGRpdGlvbi5cbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICB0aGlzLm9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIHRoaXMucm9vdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgLy8gQWRkIHRoZSByZXRpY2xlIG1lc2ggdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cbiAgICB0aGlzLnJldGljbGUgPSB0aGlzLmNyZWF0ZVJldGljbGVfKCk7XG4gICAgdGhpcy5yb290LmFkZCh0aGlzLnJldGljbGUpO1xuXG4gICAgLy8gQWRkIHRoZSByYXkgdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cbiAgICB0aGlzLnJheSA9IHRoaXMuY3JlYXRlUmF5XygpO1xuICAgIHRoaXMucm9vdC5hZGQodGhpcy5yYXkpO1xuXG4gICAgLy8gSG93IGZhciB0aGUgcmV0aWNsZSBpcyBjdXJyZW50bHkgZnJvbSB0aGUgcmV0aWNsZSBvcmlnaW4uXG4gICAgdGhpcy5yZXRpY2xlRGlzdGFuY2UgPSBSRVRJQ0xFX0RJU1RBTkNFO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGFuIG9iamVjdCBzbyB0aGF0IGl0IGNhbiBiZSBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICBhZGQob2JqZWN0KSB7XG4gICAgdGhpcy5tZXNoZXNbb2JqZWN0LmlkXSA9IG9iamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmV2ZW50IGFuIG9iamVjdCBmcm9tIGJlaW5nIGludGVyYWN0ZWQgd2l0aC5cbiAgICovXG4gIHJlbW92ZShvYmplY3QpIHtcbiAgICB2YXIgaWQgPSBvYmplY3QuaWQ7XG4gICAgaWYgKHRoaXMubWVzaGVzW2lkXSkge1xuICAgICAgLy8gSWYgdGhlcmUncyBubyBleGlzdGluZyBtZXNoLCB3ZSBjYW4ndCByZW1vdmUgaXQuXG4gICAgICBkZWxldGUgdGhpcy5tZXNoZXNbaWRdO1xuICAgIH1cbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGN1cnJlbnRseSBzZWxlY3RlZCwgcmVtb3ZlIGl0LlxuICAgIGlmICh0aGlzLnNlbGVjdGVkW2lkXSkge1xuICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbb2JqZWN0LmlkXTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgLy8gRG8gdGhlIHJheWNhc3RpbmcgYW5kIGlzc3VlIHZhcmlvdXMgZXZlbnRzIGFzIG5lZWRlZC5cbiAgICBmb3IgKGxldCBpZCBpbiB0aGlzLm1lc2hlcykge1xuICAgICAgbGV0IG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG4gICAgICBsZXQgaW50ZXJzZWN0cyA9IHRoaXMucmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdChtZXNoLCB0cnVlKTtcbiAgICAgIGlmIChpbnRlcnNlY3RzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdVbmV4cGVjdGVkOiBtdWx0aXBsZSBtZXNoZXMgaW50ZXJzZWN0ZWQuJyk7XG4gICAgICB9XG4gICAgICBsZXQgaXNJbnRlcnNlY3RlZCA9IChpbnRlcnNlY3RzLmxlbmd0aCA+IDApO1xuICAgICAgbGV0IGlzU2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkW2lkXTtcblxuICAgICAgLy8gSWYgaXQncyBuZXdseSBzZWxlY3RlZCwgc2VuZCByYXlvdmVyLlxuICAgICAgaWYgKGlzSW50ZXJzZWN0ZWQgJiYgIWlzU2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFtpZF0gPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgIHRoaXMuZW1pdCgncmF5b3ZlcicsIG1lc2gpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0J3Mgbm8gbG9uZ2VyIGludGVyc2VjdGVkLCBzZW5kIHJheW91dC5cbiAgICAgIGlmICghaXNJbnRlcnNlY3RlZCAmJiBpc1NlbGVjdGVkICYmICF0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbaWRdO1xuICAgICAgICB0aGlzLm1vdmVSZXRpY2xlXyhudWxsKTtcbiAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JheW91dCcsIG1lc2gpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0ludGVyc2VjdGVkKSB7XG4gICAgICAgIHRoaXMubW92ZVJldGljbGVfKGludGVyc2VjdHMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmlnaW4gb2YgdGhlIHJheS5cbiAgICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvciBQb3NpdGlvbiBvZiB0aGUgb3JpZ2luIG9mIHRoZSBwaWNraW5nIHJheS5cbiAgICovXG4gIHNldFBvc2l0aW9uKHZlY3Rvcikge1xuICAgIHRoaXMucG9zaXRpb24uY29weSh2ZWN0b3IpO1xuICAgIHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW4uY29weSh2ZWN0b3IpO1xuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xuICB9XG5cbiAgZ2V0T3JpZ2luKCkge1xuICAgIHJldHVybiB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRpcmVjdGlvbiBvZiB0aGUgcmF5LlxuICAgKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yIFVuaXQgdmVjdG9yIGNvcnJlc3BvbmRpbmcgdG8gZGlyZWN0aW9uLlxuICAgKi9cbiAgc2V0T3JpZW50YXRpb24ocXVhdGVybmlvbikge1xuICAgIHRoaXMub3JpZW50YXRpb24uY29weShxdWF0ZXJuaW9uKTtcblxuICAgIHZhciBwb2ludEF0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpLmFwcGx5UXVhdGVybmlvbihxdWF0ZXJuaW9uKTtcbiAgICB0aGlzLnJheWNhc3Rlci5yYXkuZGlyZWN0aW9uLmNvcHkocG9pbnRBdClcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgfVxuXG4gIGdldERpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5yYXljYXN0ZXIucmF5LmRpcmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb2ludGVyIG9uIHRoZSBzY3JlZW4gZm9yIGNhbWVyYSArIHBvaW50ZXIgYmFzZWQgcGlja2luZy4gVGhpc1xuICAgKiBzdXBlcnNjZWRlcyBvcmlnaW4gYW5kIGRpcmVjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtWZWN0b3IyfSB2ZWN0b3IgVGhlIHBvc2l0aW9uIG9mIHRoZSBwb2ludGVyIChzY3JlZW4gY29vcmRzKS5cbiAgICovXG4gIHNldFBvaW50ZXIodmVjdG9yKSB7XG4gICAgdGhpcy5yYXljYXN0ZXIuc2V0RnJvbUNhbWVyYSh2ZWN0b3IsIHRoaXMuY2FtZXJhKTtcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtZXNoLCB3aGljaCBpbmNsdWRlcyByZXRpY2xlIGFuZC9vciByYXkuIFRoaXMgbWVzaCBpcyB0aGVuIGFkZGVkXG4gICAqIHRvIHRoZSBzY2VuZS5cbiAgICovXG4gIGdldFJldGljbGVSYXlNZXNoKCkge1xuICAgIHJldHVybiB0aGlzLnJvb3Q7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIG9iamVjdCBpbiB0aGUgc2NlbmUuXG4gICAqL1xuICBnZXRTZWxlY3RlZE1lc2goKSB7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICBsZXQgbWVzaCA9IG51bGw7XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5zZWxlY3RlZCkge1xuICAgICAgY291bnQgKz0gMTtcbiAgICAgIG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG4gICAgfVxuICAgIGlmIChjb3VudCA+IDEpIHtcbiAgICAgIGNvbnNvbGUud2FybignTW9yZSB0aGFuIG9uZSBtZXNoIHNlbGVjdGVkLicpO1xuICAgIH1cbiAgICByZXR1cm4gbWVzaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlcyBhbmQgc2hvd3MgdGhlIHJldGljbGUuXG4gICAqL1xuICBzZXRSZXRpY2xlVmlzaWJpbGl0eShpc1Zpc2libGUpIHtcbiAgICB0aGlzLnJldGljbGUudmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIG9yIGRpc2FibGVzIHRoZSByYXljYXN0aW5nIHJheSB3aGljaCBncmFkdWFsbHkgZmFkZXMgb3V0IGZyb21cbiAgICogdGhlIG9yaWdpbi5cbiAgICovXG4gIHNldFJheVZpc2liaWxpdHkoaXNWaXNpYmxlKSB7XG4gICAgdGhpcy5yYXkudmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGFuZCBkaXNhYmxlcyB0aGUgcmF5Y2FzdGVyLiBGb3IgdG91Y2gsIHdoZXJlIGZpbmdlciB1cCBtZWFucyB3ZVxuICAgKiBzaG91bGRuJ3QgYmUgcmF5Y2FzdGluZy5cbiAgICovXG4gIHNldEFjdGl2ZShpc0FjdGl2ZSkge1xuICAgIC8vIElmIG5vdGhpbmcgY2hhbmdlZCwgZG8gbm90aGluZy5cbiAgICBpZiAodGhpcy5pc0FjdGl2ZSA9PSBpc0FjdGl2ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUT0RPKHNtdXMpOiBTaG93IHRoZSByYXkgb3IgcmV0aWNsZSBhZGp1c3QgaW4gcmVzcG9uc2UuXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGlzQWN0aXZlO1xuXG4gICAgaWYgKCFpc0FjdGl2ZSkge1xuICAgICAgdGhpcy5tb3ZlUmV0aWNsZV8obnVsbCk7XG4gICAgICBmb3IgKGxldCBpZCBpbiB0aGlzLnNlbGVjdGVkKSB7XG4gICAgICAgIGxldCBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgICAgICBkZWxldGUgdGhpcy5zZWxlY3RlZFtpZF07XG4gICAgICAgIHRoaXMuZW1pdCgncmF5b3V0JywgbWVzaCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0RHJhZ2dpbmcoaXNEcmFnZ2luZykge1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGlzRHJhZ2dpbmc7XG4gIH1cblxuICB1cGRhdGVSYXljYXN0ZXJfKCkge1xuICAgIHZhciByYXkgPSB0aGlzLnJheWNhc3Rlci5yYXk7XG5cbiAgICAvLyBQb3NpdGlvbiB0aGUgcmV0aWNsZSBhdCBhIGRpc3RhbmNlLCBhcyBjYWxjdWxhdGVkIGZyb20gdGhlIG9yaWdpbiBhbmRcbiAgICAvLyBkaXJlY3Rpb24uXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5yZXRpY2xlLnBvc2l0aW9uO1xuICAgIHBvc2l0aW9uLmNvcHkocmF5LmRpcmVjdGlvbik7XG4gICAgcG9zaXRpb24ubXVsdGlwbHlTY2FsYXIodGhpcy5yZXRpY2xlRGlzdGFuY2UpO1xuICAgIHBvc2l0aW9uLmFkZChyYXkub3JpZ2luKTtcblxuICAgIC8vIFNldCBwb3NpdGlvbiBhbmQgb3JpZW50YXRpb24gb2YgdGhlIHJheSBzbyB0aGF0IGl0IGdvZXMgZnJvbSBvcmlnaW4gdG9cbiAgICAvLyByZXRpY2xlLlxuICAgIHZhciBkZWx0YSA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShyYXkuZGlyZWN0aW9uKTtcbiAgICBkZWx0YS5tdWx0aXBseVNjYWxhcih0aGlzLnJldGljbGVEaXN0YW5jZSk7XG4gICAgdGhpcy5yYXkuc2NhbGUueSA9IGRlbHRhLmxlbmd0aCgpO1xuICAgIHZhciBhcnJvdyA9IG5ldyBUSFJFRS5BcnJvd0hlbHBlcihyYXkuZGlyZWN0aW9uLCByYXkub3JpZ2luKTtcbiAgICB0aGlzLnJheS5yb3RhdGlvbi5jb3B5KGFycm93LnJvdGF0aW9uKTtcbiAgICB0aGlzLnJheS5wb3NpdGlvbi5hZGRWZWN0b3JzKHJheS5vcmlnaW4sIGRlbHRhLm11bHRpcGx5U2NhbGFyKDAuNSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGdlb21ldHJ5IG9mIHRoZSByZXRpY2xlLlxuICAgKi9cbiAgY3JlYXRlUmV0aWNsZV8oKSB7XG4gICAgLy8gQ3JlYXRlIGEgc3BoZXJpY2FsIHJldGljbGUuXG4gICAgbGV0IGlubmVyR2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoSU5ORVJfUkFESVVTLCAzMiwgMzIpO1xuICAgIGxldCBpbm5lck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgIGNvbG9yOiAweGZmZmZmZixcbiAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgb3BhY2l0eTogMC45XG4gICAgfSk7XG4gICAgbGV0IGlubmVyID0gbmV3IFRIUkVFLk1lc2goaW5uZXJHZW9tZXRyeSwgaW5uZXJNYXRlcmlhbCk7XG5cbiAgICBsZXQgb3V0ZXJHZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeShPVVRFUl9SQURJVVMsIDMyLCAzMik7XG4gICAgbGV0IG91dGVyTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IDB4MzMzMzMzLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjNcbiAgICB9KTtcbiAgICBsZXQgb3V0ZXIgPSBuZXcgVEhSRUUuTWVzaChvdXRlckdlb21ldHJ5LCBvdXRlck1hdGVyaWFsKTtcblxuICAgIGxldCByZXRpY2xlID0gbmV3IFRIUkVFLkdyb3VwKCk7XG4gICAgcmV0aWNsZS5hZGQoaW5uZXIpO1xuICAgIHJldGljbGUuYWRkKG91dGVyKTtcbiAgICByZXR1cm4gcmV0aWNsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlcyB0aGUgcmV0aWNsZSB0byBhIHBvc2l0aW9uIHNvIHRoYXQgaXQncyBqdXN0IGluIGZyb250IG9mIHRoZSBtZXNoIHRoYXRcbiAgICogaXQgaW50ZXJzZWN0ZWQgd2l0aC5cbiAgICovXG4gIG1vdmVSZXRpY2xlXyhpbnRlcnNlY3Rpb25zKSB7XG4gICAgLy8gSWYgbm8gaW50ZXJzZWN0aW9uLCByZXR1cm4gdGhlIHJldGljbGUgdG8gdGhlIGRlZmF1bHQgcG9zaXRpb24uXG4gICAgbGV0IGRpc3RhbmNlID0gUkVUSUNMRV9ESVNUQU5DRTtcbiAgICBpZiAoaW50ZXJzZWN0aW9ucykge1xuICAgICAgLy8gT3RoZXJ3aXNlLCBkZXRlcm1pbmUgdGhlIGNvcnJlY3QgZGlzdGFuY2UuXG4gICAgICBsZXQgaW50ZXIgPSBpbnRlcnNlY3Rpb25zWzBdO1xuICAgICAgZGlzdGFuY2UgPSBpbnRlci5kaXN0YW5jZTtcbiAgICB9XG5cbiAgICB0aGlzLnJldGljbGVEaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNyZWF0ZVJheV8oKSB7XG4gICAgLy8gQ3JlYXRlIGEgY3lsaW5kcmljYWwgcmF5LlxuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5DeWxpbmRlckdlb21ldHJ5KFJBWV9SQURJVVMsIFJBWV9SQURJVVMsIDEsIDMyKTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgbWFwOiBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKEdSQURJRU5UX0lNQUdFKSxcbiAgICAgIC8vY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjNcbiAgICB9KTtcbiAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG5cbiAgICByZXR1cm4gbWVzaDtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTW9iaWxlKCkge1xuICB2YXIgY2hlY2sgPSBmYWxzZTtcbiAgKGZ1bmN0aW9uKGEpe2lmKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcmlzfGtpbmRsZXxsZ2UgfG1hZW1vfG1pZHB8bW1wfG1vYmlsZS4rZmlyZWZveHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyBjZXx4ZGF8eGlpbm8vaS50ZXN0KGEpfHwvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KGEuc3Vic3RyKDAsNCkpKWNoZWNrID0gdHJ1ZX0pKG5hdmlnYXRvci51c2VyQWdlbnR8fG5hdmlnYXRvci52ZW5kb3J8fHdpbmRvdy5vcGVyYSk7XG4gIHJldHVybiBjaGVjaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2U2NChtaW1lVHlwZSwgYmFzZTY0KSB7XG4gIHJldHVybiAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgYmFzZTY0O1xufVxuIl19
