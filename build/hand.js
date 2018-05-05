(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _sceneBuilder = require('./sceneBuilder.js');

var _sceneBuilder2 = _interopRequireDefault(_sceneBuilder);

var _physicsHandler = require('./physicsHandler.js');

var _physicsHandler2 = _interopRequireDefault(_physicsHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var renderer = void 0;
var MARGIN = 0;
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var camera = void 0,
    scene = void 0,
    controls = void 0;
var mouseX = 0,
    mouseY = 0;
var sceneBuilder = void 0;
var physicsHandler = void 0;

var container;
var smoothie = null;
var smoothieCanvas = null;
var stats;

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  renderer = new THREE.WebGLRenderer({ clearColor: 0x000000, clearAlpha: 1, antialias: false });
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.domElement.style.position = "relative";
  renderer.domElement.style.top = MARGIN + 'px';
  container.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(24, SCREEN_WIDTH / SCREEN_HEIGHT, 0.1, 25);

  camera.up.set(0, 1, 0);
  camera.position.set(2, 0.5, -5);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 500, 10000);

  var cameraGroup = new THREE.Group();
  cameraGroup.position.set(0, 0, 0);
  cameraGroup.add(camera);
  scene.add(cameraGroup);

  document.addEventListener('mousemove', onDocumentMouseMove);
  window.addEventListener('resize', onWindowResize, false);

  physicsHandler = new _physicsHandler2.default(scene);
  sceneBuilder = new _sceneBuilder2.default(scene, camera, physicsHandler);

  sceneBuilder.build();

  // Smoothie
  smoothieCanvas = document.createElement("canvas");
  smoothieCanvas.width = window.innerWidth;
  smoothieCanvas.height = window.innerHeight;
  smoothieCanvas.style.opacity = 0.5;
  smoothieCanvas.style.position = 'absolute';
  smoothieCanvas.style.top = '0px';
  smoothieCanvas.style.zIndex = 90;
  renderer.domElement.appendChild(smoothieCanvas);
  smoothie = new SmoothieChart({
    labelOffsetY: 50,
    maxDataSetLength: 100,
    millisPerPixel: 2,
    grid: {
      strokeStyle: 'none',
      fillStyle: 'none',
      lineWidth: 1,
      millisPerLine: 250,
      verticalSections: 6
    },
    labels: {
      fillStyle: 'rgb(180, 180, 180)'
    }
  });
  smoothie.streamTo(smoothieCanvas);
  // Create time series for each profile label
  var lines = {};
  var colors = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [255, 0, 255], [0, 255, 255]];
  var i = 0;
  for (var label in physicsHandler.world.profile) {
    var c = colors[i % colors.length];
    lines[label] = new TimeSeries({
      label: label,
      fillStyle: "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")",
      maxDataLength: 500
    });
    i++;
  }

  // Add a random value to each line every second
  physicsHandler.world.addEventListener("postStep", function (evt) {
    for (var label in physicsHandler.world.profile) {
      lines[label].append(physicsHandler.world.time * 1000, physicsHandler.world.profile[label]);
    }
  });

  // Add to SmoothieChart
  var i = 0;
  for (var label in physicsHandler.world.profile) {
    var c = colors[i % colors.length];
    smoothie.addTimeSeries(lines[label], {
      strokeStyle: "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")",
      //fillStyle:"rgba("+c[0]+","+c[1]+","+c[2]+",0.3)",
      lineWidth: 2
    });
    i++;
  }
  physicsHandler.world.doProfiling = false;
  smoothie.stop();
  smoothieCanvas.style.display = "none";

  // STATS
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.zIndex = 100;
  container.appendChild(stats.domElement);

  // Trackball controls
  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.2;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = false;
  controls.dynamicDampingFactor = 0.3;
  var radius = 100;
  controls.minDistance = 0.0;
  controls.maxDistance = radius * 1000;
  //controls.keys = [ 65, 83, 68 ]; // [ rotateKey, zoomKey, panKey ]
  controls.screen.width = SCREEN_WIDTH;
  controls.screen.height = SCREEN_HEIGHT;
}

function onLoad() {
  init();
  animate();
}

window.addEventListener('load', onLoad);

window.addEventListener('dblclick', function (event) {
  console.log('double click! pos: ' + event.pageX + ', ' + event.pageY);
});

function onDocumentMouseMove(event) {
  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}

function onWindowResize(event) {
  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  camera.updateProjectionMatrix();

  controls.screen.width = SCREEN_WIDTH;
  controls.screen.height = SCREEN_HEIGHT;

  camera.radius = (SCREEN_WIDTH + SCREEN_HEIGHT) / 4;
}

function animate() {
  renderer.animate(render);
}

function render() {
  controls.update();
  renderer.clear();
  sceneBuilder.update();
  physicsHandler.updatePhysics();
  renderer.render(scene, camera);
  stats.update();
}

},{"./physicsHandler.js":2,"./sceneBuilder.js":3}],2:[function(require,module,exports){
"use strict";

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
    this.netConstraints = [];

    var axes = [];
    axes[0] = {
      value: [0, 0]
    };

    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    world.gravity.set(0, -3, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

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
      netRadius: 0.6,
      netHeightDiff: 0.12,
      netRadiusDiff: 0.11,
      shadows: false,
      aabbs: false,
      profiling: false,
      maxSubSteps: 20,
      dist: 0.5
    };
    this.particleGeo = new THREE.SphereGeometry(0.5, 16, 8);
    this.particleMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  }

  _createClass(PhysicsHandler, [{
    key: "addBallHandContactMaterial",
    value: function addBallHandContactMaterial(ballMaterial, handMaterial) {
      var contactMaterial = new CANNON.ContactMaterial(ballMaterial, handMaterial, { friction: 0.01, restitution: 0 });
      this.world.addBallGroundContactMaterial(contactMaterial);
    }
  }, {
    key: "updatePhysics",
    value: function updatePhysics() {
      this.world.step(this.dt);
      for (var i = 0; i !== this.meshes.length; i++) {
        if (this.meshes[i]) {
          this.meshes[i].position.copy(this.bodies[i].position);
          this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
        }
      }
    }
  }, {
    key: "filterAxis",
    value: function filterAxis(v) {
      this.axisThreshold = 0.2;
      return Math.abs(v) > this.axisThreshold ? v : 0;
    }
  }, {
    key: "addMesh",
    value: function addMesh(mesh) {
      this.meshes.push(mesh);
      this.scene.add(mesh);
    }
  }, {
    key: "addVisual",
    value: function addVisual(body, isDraggable, isWireframe) {
      var mesh = void 0;
      if (body instanceof CANNON.Body) {
        mesh = this.shape2mesh(body);
      }
      if (mesh) {
        this.bodies.push(body);
        this.meshes.push(mesh);
        this.scene.add(mesh);
        if (isWireframe && mesh.material) {
          mesh.material.setWireframe(true);
        }
        if (isWireframe && mesh.children && mesh.children.length > 0) {
          for (var l = 0; l < mesh.children.length; l++) {
            mesh.children[l].material.wireframe = true;
          }
        }
      }
      return mesh;
    }
  }, {
    key: "addBody",
    value: function addBody(body) {
      this.bodies.push(body);
      this.world.addBody(body);
    }
  }, {
    key: "connect",
    value: function connect(bodies, i1, j1, i2, j2) {
      var distance = bodies[i1 + " " + j1].position.distanceTo(bodies[i2 + " " + j2].position);
      var constraint = new CANNON.DistanceConstraint(bodies[i1 + " " + j1], bodies[i2 + " " + j2], distance);
      this.netConstraints.push(constraint);
      this.world.addConstraint(constraint);
    }
  }, {
    key: "toRadians",
    value: function toRadians(angle) {
      return angle * (Math.PI / 180);
    }
  }, {
    key: "addPointerConstraintToMesh",
    value: function addPointerConstraintToMesh(pos, mesh) {
      var idx = this.meshes.indexOf(mesh);
      if (idx !== -1) {
        this.addPointerConstraintToBody(pos.x, pos.y, pos.z, this.bodies[idx]);
      }
    }
  }, {
    key: "addPointerConstraintToBody",
    value: function addPointerConstraintToBody(x, y, z, body) {
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
    key: "moveJointToPoint",
    value: function moveJointToPoint(x, y, z) {
      // Move the joint body to a new position
      this.jointBody.position.set(x, y, z);
      this.pointerConstraint.update();
    }
  }, {
    key: "rotateJoint",
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
    key: "removeJointConstraint",
    value: function removeJointConstraint() {
      // Remove constraint from world
      this.world.removeConstraint(this.pointerConstraint);
      this.pointerConstraint = false;
      this.touchPadPosition = { x: 0, z: 0 };
    }
  }, {
    key: "shape2mesh",
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
            console.log(body);
            console.log(shape);
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

          case CANNON.Shape.types.CYLINDER:
            console.log('Cylinder!');
            break;

          default:
            throw "Visual type not recognized: " + shape.type;
        }

        // mesh.receiveShadow = true;
        // mesh.castShadow = true;
        // if(mesh.children){
        //   for(var i=0; i<mesh.children.length; i++){
        //     mesh.children[i].castShadow = true;
        //     mesh.children[i].receiveShadow = true;
        //     if(mesh.children[i]){
        //       for(var j=0; j<mesh.children[i].length; j++){
        //         mesh.children[i].children[j].castShadow = true;
        //         mesh.children[i].children[j].receiveShadow = true;
        //       }
        //     }
        //   }
        // }

        var o = body.shapeOffsets[l];
        var q = body.shapeOrientations[l];
        mesh.position.set(o.x, o.y, o.z);
        mesh.quaternion.set(q.x, q.y, q.z, q.w);

        obj.add(mesh);
      }

      return obj;
    }
  }], [{
    key: "toRadians",
    value: function toRadians(angle) {
      return angle * (Math.PI / 180);
    }
  }]);

  return PhysicsHandler;
}();

exports.default = PhysicsHandler;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SceneBuilder = function () {
  function SceneBuilder(scene, camera, physicsHandler) {
    var _this = this;

    _classCallCheck(this, SceneBuilder);

    this.scene = scene;
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.loader = new THREE.TextureLoader();
    this.stickToCamera = false;
    this.fixBallPosition = false;
    this.handRotationStep = -0.005;

    this.APP = {
      /* BALL */
      ballRadius: 6,
      /* BASKET */
      basketColor: 0xc84b28,
      getBasketRadius: function getBasketRadius() {
        return _this.APP.ballRadius + 2;
      },
      basketTubeRadius: 0.5,
      basketY: 20,
      basketDistance: 80,
      getBasketZ: function getBasketZ() {
        return _this.APP.getBasketRadius() + _this.APP.basketTubeRadius * 2 - _this.APP.basketDistance;
      }
    };
  }

  _createClass(SceneBuilder, [{
    key: 'build',
    value: function build() {
      this.addLight();
      this.addBall();
      this.addFingerTips();
      // this.addBasketBoard();
      // this.physicsHandler.addBallHandContactMaterial(this.ballMaterial, this.handMaterial);
    }
  }, {
    key: 'addLight',
    value: function addLight() {
      var light = new THREE.DirectionalLight(0xFFFFFF, 1, 100);
      light.position.set(1, 10, -0.5);
      this.scene.add(light);
      this.scene.add(new THREE.HemisphereLight(0x909090, 0x404040));
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
      var mass = 0.1; //0.6237;
      var sphereShape = new CANNON.Sphere(ballRadius);
      this.ballMaterial = new CANNON.Material();
      var ball = new CANNON.Body({
        mass: mass,
        material: this.ballMaterial
      });

      ball.addShape(sphereShape);
      ball.linearDamping = damping;

      ball.position.set(0, 7, 0);

      this.physicsHandler.addBody(ball);

      this.ball = ball;
    }
  }, {
    key: 'addFingerTips',
    value: function addFingerTips() {
      var hand_material = new THREE.MeshBasicMaterial({
        color: 0xFF3333,
        metalness: 0.8,
        roughness: 0.5,
        emissive: 0xffccff,
        emissiveIntensity: 0.2
      });
      this.currentMaterial = hand_material;
      var Ncols = 4;
      var angle = 360 / Ncols;
      this.handMaterial = new CANNON.Material();
      var body = new CANNON.Body({
        mass: 0,
        material: this.handMaterial
      });
      var position = new CANNON.Vec3(0, 0, 0);
      for (var i = 0; i < Ncols; i++) {
        var radians = this.physicsHandler.toRadians(angle * i);
        var rowRadius = 0.15;

        var relativePosition = new CANNON.Vec3(rowRadius * Math.sin(radians), 0, rowRadius * Math.cos(radians));

        var lookAtPosition = relativePosition.vsub(position);
        var orientation = new CANNON.Quaternion(lookAtPosition.x, lookAtPosition.z, lookAtPosition.y, 0);
        // body.addShape(new CANNON.Cylinder(0.001, 0.0008, 0.1, 16), relativePosition, orientation);
        // body.addShape(new CANNON.Sphere(0.05), relativePosition);
        body.addShape(new CANNON.Box(new CANNON.Vec3(0.01, 0.01, 0.01)), relativePosition, orientation);
      }

      var mesh = this.physicsHandler.addVisual(body, false, true);
      mesh.receiveShadow = false;
      this.physicsHandler.world.addBody(body);

      this.hand = body;
      // this.hand.position.set(0,1,-0.5);
    }
  }, {
    key: 'toRadians',
    value: function toRadians(angle) {
      return angle * (Math.PI / 180);
    }
  }, {
    key: 'update',
    value: function update() {
      if (this.isThrowing) {
        this.hand.quaternion.x += 0.1;
        if (this.hand.quaternion.x > 1) {
          this.isThrowing = false;
        }
      } else {
        this.hand.quaternion.x += this.handRotationStep; // this.hand.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/1800);
      }

      console.log(this.hand.quaternion.x);
      console.log(this.handRotationStep);
      if (this.hand.quaternion.x < -0.3) {
        this.isThrowing = true;
        this.hand.quaternion.x = 0.5;
      }
      if (this.hand.quaternion.x < -1) {
        // this.hand.quaternion.x = -1;
        this.rotationHandStep = -1 * this.rotationHandStep;
      }
      if (this.ball.position.y < -5) {
        this.ball.position.y = 0.3;
        this.ball.position.x = 0;
        this.ball.position.z = 0;
        this.ball.velocity.set(0, 0, 0);
        this.ball.angularVelocity.set(0, 0, 0);
      }
    }
  }]);

  return SceneBuilder;
}();

exports.default = SceneBuilder;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4xMC4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9oYW5kL21haW4uanMiLCJzcmMvaGFuZC9waHlzaWNzSGFuZGxlci5qcyIsInNyYy9oYW5kL3NjZW5lQnVpbGRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7Ozs7QUFDQTs7Ozs7O0FBRUEsSUFBSSxpQkFBSjtBQUNBLElBQUksU0FBUyxDQUFiO0FBQ0EsSUFBSSxlQUFlLE9BQU8sVUFBMUI7QUFDQSxJQUFJLGdCQUFnQixPQUFPLFdBQVAsR0FBcUIsSUFBSSxNQUE3QztBQUNBLElBQUksY0FBYyxPQUFPLFVBQVAsR0FBb0IsQ0FBdEM7QUFDQSxJQUFJLGNBQWMsT0FBTyxXQUFQLEdBQXFCLENBQXZDO0FBQ0EsSUFBSSxlQUFKO0FBQUEsSUFBWSxjQUFaO0FBQUEsSUFBbUIsaUJBQW5CO0FBQ0EsSUFBSSxTQUFTLENBQWI7QUFBQSxJQUFnQixTQUFTLENBQXpCO0FBQ0EsSUFBSSxxQkFBSjtBQUNBLElBQUksdUJBQUo7O0FBRUEsSUFBSSxTQUFKO0FBQ0EsSUFBSSxXQUFXLElBQWY7QUFDQSxJQUFJLGlCQUFpQixJQUFyQjtBQUNBLElBQUksS0FBSjs7QUFFQSxTQUFTLElBQVQsR0FBZ0I7QUFDZCxjQUFZLFNBQVMsYUFBVCxDQUF3QixLQUF4QixDQUFaO0FBQ0EsV0FBUyxJQUFULENBQWMsV0FBZCxDQUEyQixTQUEzQjs7QUFFQSxhQUFXLElBQUksTUFBTSxhQUFWLENBQXlCLEVBQUUsWUFBWSxRQUFkLEVBQXdCLFlBQVksQ0FBcEMsRUFBdUMsV0FBVyxLQUFsRCxFQUF6QixDQUFYO0FBQ0EsV0FBUyxPQUFULENBQWtCLFlBQWxCLEVBQWdDLGFBQWhDO0FBQ0EsV0FBUyxVQUFULENBQW9CLEtBQXBCLENBQTBCLFFBQTFCLEdBQXFDLFVBQXJD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QixDQUFuQixHQUF1QixHQUF2QjtBQUNBLGFBQUssSUFBTCxDQUFVLFFBQVYsQ0FBbUIsQ0FBbkIsR0FBdUIsQ0FBdkI7QUFDQSxhQUFLLElBQUwsQ0FBVSxRQUFWLENBQW1CLENBQW5CLEdBQXVCLENBQXZCO0FBQ0EsYUFBSyxJQUFMLENBQVUsUUFBVixDQUFtQixHQUFuQixDQUF1QixDQUF2QixFQUEwQixDQUExQixFQUE2QixDQUE3QjtBQUNBLGFBQUssSUFBTCxDQUFVLGVBQVYsQ0FBMEIsR0FBMUIsQ0FBOEIsQ0FBOUIsRUFBaUMsQ0FBakMsRUFBb0MsQ0FBcEM7QUFDRDtBQUNGOzs7Ozs7a0JBdkprQixZIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBTY2VuZUJ1aWxkZXIgZnJvbSAnLi9zY2VuZUJ1aWxkZXIuanMnO1xuaW1wb3J0IFBoeXNpY3NIYW5kbGVyIGZyb20gJy4vcGh5c2ljc0hhbmRsZXIuanMnO1xuXG5sZXQgcmVuZGVyZXI7XG52YXIgTUFSR0lOID0gMDtcbnZhciBTQ1JFRU5fV0lEVEggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbnZhciBTQ1JFRU5fSEVJR0hUID0gd2luZG93LmlubmVySGVpZ2h0IC0gMiAqIE1BUkdJTjtcbnZhciB3aW5kb3dIYWxmWCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gMjtcbnZhciB3aW5kb3dIYWxmWSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIDI7XG5sZXQgY2FtZXJhLCBzY2VuZSwgY29udHJvbHM7XG52YXIgbW91c2VYID0gMCwgbW91c2VZID0gMDtcbmxldCBzY2VuZUJ1aWxkZXI7XG5sZXQgcGh5c2ljc0hhbmRsZXI7XG5cbnZhciBjb250YWluZXI7XG52YXIgc21vb3RoaWUgPSBudWxsO1xudmFyIHNtb290aGllQ2FudmFzID0gbnVsbDtcbnZhciBzdGF0cztcblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggY29udGFpbmVyICk7XG5cbiAgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlciggeyBjbGVhckNvbG9yOiAweDAwMDAwMCwgY2xlYXJBbHBoYTogMSwgYW50aWFsaWFzOiBmYWxzZSB9ICk7XG4gIHJlbmRlcmVyLnNldFNpemUoIFNDUkVFTl9XSURUSCwgU0NSRUVOX0hFSUdIVCApO1xuICByZW5kZXJlci5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xuICByZW5kZXJlci5kb21FbGVtZW50LnN0eWxlLnRvcCA9IE1BUkdJTiArICdweCc7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZCggcmVuZGVyZXIuZG9tRWxlbWVudCApO1xuXG4gIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSggMjQsIFNDUkVFTl9XSURUSCAvIFNDUkVFTl9IRUlHSFQsIDAuMSwgMjUgKTtcblxuICBjYW1lcmEudXAuc2V0KDAsMSwwKTtcbiAgY2FtZXJhLnBvc2l0aW9uLnNldCgyLDAuNSwtNSk7XG5cbiAgc2NlbmUgID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gIHNjZW5lLmZvZyA9IG5ldyBUSFJFRS5Gb2coIDB4MDAwMDAwLCA1MDAsIDEwMDAwICk7XG5cbiAgbGV0IGNhbWVyYUdyb3VwID0gbmV3IFRIUkVFLkdyb3VwKCk7XG4gIGNhbWVyYUdyb3VwLnBvc2l0aW9uLnNldCggMCwgMCwgMCApO1xuICBjYW1lcmFHcm91cC5hZGQoIGNhbWVyYSApO1xuICBzY2VuZS5hZGQoY2FtZXJhR3JvdXApO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsb25Eb2N1bWVudE1vdXNlTW92ZSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlICk7XG5cbiAgcGh5c2ljc0hhbmRsZXIgPSBuZXcgUGh5c2ljc0hhbmRsZXIoc2NlbmUpO1xuICBzY2VuZUJ1aWxkZXIgPSBuZXcgU2NlbmVCdWlsZGVyKHNjZW5lLCBjYW1lcmEsIHBoeXNpY3NIYW5kbGVyKTtcblxuICBzY2VuZUJ1aWxkZXIuYnVpbGQoKTtcblxuXG4gIC8vIFNtb290aGllXG4gIHNtb290aGllQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgc21vb3RoaWVDYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgc21vb3RoaWVDYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICBzbW9vdGhpZUNhbnZhcy5zdHlsZS5vcGFjaXR5ID0gMC41O1xuICBzbW9vdGhpZUNhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIHNtb290aGllQ2FudmFzLnN0eWxlLnRvcCA9ICcwcHgnO1xuICBzbW9vdGhpZUNhbnZhcy5zdHlsZS56SW5kZXggPSA5MDtcbiAgcmVuZGVyZXIuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCggc21vb3RoaWVDYW52YXMgKTtcbiAgc21vb3RoaWUgPSBuZXcgU21vb3RoaWVDaGFydCh7XG4gICAgbGFiZWxPZmZzZXRZOjUwLFxuICAgIG1heERhdGFTZXRMZW5ndGg6MTAwLFxuICAgIG1pbGxpc1BlclBpeGVsOjIsXG4gICAgZ3JpZDoge1xuICAgICAgc3Ryb2tlU3R5bGU6J25vbmUnLFxuICAgICAgZmlsbFN0eWxlOidub25lJyxcbiAgICAgIGxpbmVXaWR0aDogMSxcbiAgICAgIG1pbGxpc1BlckxpbmU6IDI1MCxcbiAgICAgIHZlcnRpY2FsU2VjdGlvbnM6IDZcbiAgICB9LFxuICAgIGxhYmVsczoge1xuICAgICAgZmlsbFN0eWxlOidyZ2IoMTgwLCAxODAsIDE4MCknXG4gICAgfVxuICB9KTtcbiAgc21vb3RoaWUuc3RyZWFtVG8oc21vb3RoaWVDYW52YXMpO1xuICAvLyBDcmVhdGUgdGltZSBzZXJpZXMgZm9yIGVhY2ggcHJvZmlsZSBsYWJlbFxuICB2YXIgbGluZXMgPSB7fTtcbiAgdmFyIGNvbG9ycyA9IFtbMjU1LCAwLCAwXSxbMCwgMjU1LCAwXSxbMCwgMCwgMjU1XSxbMjU1LDI1NSwwXSxbMjU1LDAsMjU1XSxbMCwyNTUsMjU1XV07XG4gIHZhciBpPTA7XG4gIGZvcih2YXIgbGFiZWwgaW4gcGh5c2ljc0hhbmRsZXIud29ybGQucHJvZmlsZSl7XG4gICAgdmFyIGMgPSBjb2xvcnNbaSVjb2xvcnMubGVuZ3RoXTtcbiAgICBsaW5lc1tsYWJlbF0gPSBuZXcgVGltZVNlcmllcyh7XG4gICAgICBsYWJlbCA6IGxhYmVsLFxuICAgICAgZmlsbFN0eWxlIDogXCJyZ2IoXCIrY1swXStcIixcIitjWzFdK1wiLFwiK2NbMl0rXCIpXCIsXG4gICAgICBtYXhEYXRhTGVuZ3RoIDogNTAwLFxuICAgIH0pO1xuICAgIGkrKztcbiAgfVxuXG4gIC8vIEFkZCBhIHJhbmRvbSB2YWx1ZSB0byBlYWNoIGxpbmUgZXZlcnkgc2Vjb25kXG4gIHBoeXNpY3NIYW5kbGVyLndvcmxkLmFkZEV2ZW50TGlzdGVuZXIoXCJwb3N0U3RlcFwiLGZ1bmN0aW9uKGV2dCkge1xuICAgIGZvcih2YXIgbGFiZWwgaW4gcGh5c2ljc0hhbmRsZXIud29ybGQucHJvZmlsZSlcbiAgICAgIGxpbmVzW2xhYmVsXS5hcHBlbmQocGh5c2ljc0hhbmRsZXIud29ybGQudGltZSAqIDEwMDAsIHBoeXNpY3NIYW5kbGVyLndvcmxkLnByb2ZpbGVbbGFiZWxdKTtcbiAgfSk7XG5cbiAgLy8gQWRkIHRvIFNtb290aGllQ2hhcnRcbiAgdmFyIGk9MDtcbiAgZm9yKHZhciBsYWJlbCBpbiBwaHlzaWNzSGFuZGxlci53b3JsZC5wcm9maWxlKXtcbiAgICB2YXIgYyA9IGNvbG9yc1tpJWNvbG9ycy5sZW5ndGhdO1xuICAgIHNtb290aGllLmFkZFRpbWVTZXJpZXMobGluZXNbbGFiZWxdLHtcbiAgICAgIHN0cm9rZVN0eWxlIDogXCJyZ2IoXCIrY1swXStcIixcIitjWzFdK1wiLFwiK2NbMl0rXCIpXCIsXG4gICAgICAvL2ZpbGxTdHlsZTpcInJnYmEoXCIrY1swXStcIixcIitjWzFdK1wiLFwiK2NbMl0rXCIsMC4zKVwiLFxuICAgICAgbGluZVdpZHRoOjJcbiAgICB9KTtcbiAgICBpKys7XG4gIH1cbiAgcGh5c2ljc0hhbmRsZXIud29ybGQuZG9Qcm9maWxpbmcgPSBmYWxzZTtcbiAgc21vb3RoaWUuc3RvcCgpO1xuICBzbW9vdGhpZUNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cbiAgLy8gU1RBVFNcbiAgc3RhdHMgPSBuZXcgU3RhdHMoKTtcbiAgc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gJzBweCc7XG4gIHN0YXRzLmRvbUVsZW1lbnQuc3R5bGUuekluZGV4ID0gMTAwO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoIHN0YXRzLmRvbUVsZW1lbnQgKTtcblxuICAvLyBUcmFja2JhbGwgY29udHJvbHNcbiAgY29udHJvbHMgPSBuZXcgVEhSRUUuVHJhY2tiYWxsQ29udHJvbHMoIGNhbWVyYSwgcmVuZGVyZXIuZG9tRWxlbWVudCApO1xuICBjb250cm9scy5yb3RhdGVTcGVlZCA9IDEuMDtcbiAgY29udHJvbHMuem9vbVNwZWVkID0gMS4yO1xuICBjb250cm9scy5wYW5TcGVlZCA9IDAuMjtcbiAgY29udHJvbHMubm9ab29tID0gZmFsc2U7XG4gIGNvbnRyb2xzLm5vUGFuID0gZmFsc2U7XG4gIGNvbnRyb2xzLnN0YXRpY01vdmluZyA9IGZhbHNlO1xuICBjb250cm9scy5keW5hbWljRGFtcGluZ0ZhY3RvciA9IDAuMztcbiAgdmFyIHJhZGl1cyA9IDEwMDtcbiAgY29udHJvbHMubWluRGlzdGFuY2UgPSAwLjA7XG4gIGNvbnRyb2xzLm1heERpc3RhbmNlID0gcmFkaXVzICogMTAwMDtcbiAgLy9jb250cm9scy5rZXlzID0gWyA2NSwgODMsIDY4IF07IC8vIFsgcm90YXRlS2V5LCB6b29tS2V5LCBwYW5LZXkgXVxuICBjb250cm9scy5zY3JlZW4ud2lkdGggPSBTQ1JFRU5fV0lEVEg7XG4gIGNvbnRyb2xzLnNjcmVlbi5oZWlnaHQgPSBTQ1JFRU5fSEVJR0hUO1xufVxuXG5mdW5jdGlvbiBvbkxvYWQoKSB7XG4gIGluaXQoKTtcbiAgYW5pbWF0ZSgpO1xufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIG9uTG9hZCk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gIGNvbnNvbGUubG9nKCdkb3VibGUgY2xpY2shIHBvczogJyArIGV2ZW50LnBhZ2VYICsgJywgJyArIGV2ZW50LnBhZ2VZKTtcbn0pO1xuXG5mdW5jdGlvbiBvbkRvY3VtZW50TW91c2VNb3ZlKCBldmVudCApIHtcbiAgbW91c2VYID0gKCBldmVudC5jbGllbnRYIC0gd2luZG93SGFsZlggKTtcbiAgbW91c2VZID0gKCBldmVudC5jbGllbnRZIC0gd2luZG93SGFsZlkgKTtcbn1cblxuZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoIGV2ZW50ICkge1xuICBTQ1JFRU5fV0lEVEggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgU0NSRUVOX0hFSUdIVCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICByZW5kZXJlci5zZXRTaXplKCBTQ1JFRU5fV0lEVEgsIFNDUkVFTl9IRUlHSFQgKTtcblxuICBjYW1lcmEuYXNwZWN0ID0gU0NSRUVOX1dJRFRIIC8gU0NSRUVOX0hFSUdIVDtcbiAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcblxuICBjb250cm9scy5zY3JlZW4ud2lkdGggPSBTQ1JFRU5fV0lEVEg7XG4gIGNvbnRyb2xzLnNjcmVlbi5oZWlnaHQgPSBTQ1JFRU5fSEVJR0hUO1xuXG4gIGNhbWVyYS5yYWRpdXMgPSAoIFNDUkVFTl9XSURUSCArIFNDUkVFTl9IRUlHSFQgKSAvIDQ7XG59XG5cbmZ1bmN0aW9uIGFuaW1hdGUoKSB7XG4gIHJlbmRlcmVyLmFuaW1hdGUoIHJlbmRlciApO1xufVxuXG5mdW5jdGlvbiByZW5kZXIoKSB7XG4gIGNvbnRyb2xzLnVwZGF0ZSgpO1xuICByZW5kZXJlci5jbGVhcigpO1xuICBzY2VuZUJ1aWxkZXIudXBkYXRlKCk7XG4gIHBoeXNpY3NIYW5kbGVyLnVwZGF0ZVBoeXNpY3MoKTtcbiAgcmVuZGVyZXIucmVuZGVyKCBzY2VuZSwgY2FtZXJhICk7XG4gIHN0YXRzLnVwZGF0ZSgpO1xufVxuXG5cbiIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFBoeXNpY3NIYW5kbGVyIHtcblxuICBjb25zdHJ1Y3RvcihzY2VuZSwgcmF5SW5wdXQpIHtcbiAgICB0aGlzLnNjZW5lID0gc2NlbmU7XG4gICAgdGhpcy5yYXlJbnB1dCA9IHJheUlucHV0O1xuICAgIHRoaXMuZHQgPSAxIC8gNjA7XG5cbiAgICBsZXQgd29ybGQ7XG5cbiAgICAvLyBUbyBiZSBzeW5jZWRcbiAgICBsZXQgbWVzaGVzID0gW10sIGJvZGllcyA9IFtdO1xuXG4gICAgdGhpcy5tZXNoZXMgPSBtZXNoZXM7XG4gICAgdGhpcy5ib2RpZXMgPSBib2RpZXM7XG4gICAgdGhpcy5uZXRDb25zdHJhaW50cyA9IFtdO1xuXG4gICAgbGV0IGF4ZXMgPSBbXTtcbiAgICBheGVzWyAwIF0gPSB7XG4gICAgICB2YWx1ZTogWyAwLCAwIF1cbiAgICB9O1xuXG4gICAgd29ybGQgPSBuZXcgQ0FOTk9OLldvcmxkKCk7XG4gICAgd29ybGQucXVhdE5vcm1hbGl6ZVNraXAgPSAwO1xuICAgIHdvcmxkLnF1YXROb3JtYWxpemVGYXN0ID0gZmFsc2U7XG5cbiAgICB3b3JsZC5ncmF2aXR5LnNldCgwLCAtMyAsMCk7XG4gICAgd29ybGQuYnJvYWRwaGFzZSA9IG5ldyBDQU5OT04uTmFpdmVCcm9hZHBoYXNlKCk7XG5cbiAgICBsZXQgY29uc3RyYWludERvd24gPSBmYWxzZTtcbiAgICBsZXQgY2xpY2tNYXJrZXIgPSBmYWxzZTtcbiAgICBsZXQgam9pbnRCb2R5LCBjb25zdHJhaW5lZEJvZHksIHBvaW50ZXJDb25zdHJhaW50O1xuXG4gICAgLy8gSm9pbnQgYm9keVxuICAgIGxldCBzaGFwZSA9IG5ldyBDQU5OT04uU3BoZXJlKDAuMSk7XG4gICAgam9pbnRCb2R5ID0gbmV3IENBTk5PTi5Cb2R5KHsgbWFzczogMCB9KTtcbiAgICBqb2ludEJvZHkuYWRkU2hhcGUoc2hhcGUpO1xuICAgIGpvaW50Qm9keS5jb2xsaXNpb25GaWx0ZXJHcm91cCA9IDA7XG4gICAgam9pbnRCb2R5LmNvbGxpc2lvbkZpbHRlck1hc2sgPSAwO1xuICAgIHdvcmxkLmFkZEJvZHkoam9pbnRCb2R5KTtcblxuICAgIHRoaXMuam9pbnRCb2R5ID0gam9pbnRCb2R5O1xuICAgIHRoaXMucG9pbnRlckNvbnN0cmFpbnQgPSBwb2ludGVyQ29uc3RyYWludDtcbiAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgdGhpcy5jb25zdHJhaW50RG93biA9IGNvbnN0cmFpbnREb3duO1xuICAgIHRoaXMuYXhlcyA9IGF4ZXM7XG5cbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgc3RlcEZyZXF1ZW5jeTogNjAsXG4gICAgICBxdWF0Tm9ybWFsaXplU2tpcDogMixcbiAgICAgIHF1YXROb3JtYWxpemVGYXN0OiB0cnVlLFxuICAgICAgZ3g6IDAsXG4gICAgICBneTogMCxcbiAgICAgIGd6OiAwLFxuICAgICAgaXRlcmF0aW9uczogMyxcbiAgICAgIHRvbGVyYW5jZTogMC4wMDAxLFxuICAgICAgazogMWU2LFxuICAgICAgZDogMyxcbiAgICAgIHNjZW5lOiAwLFxuICAgICAgcGF1c2VkOiBmYWxzZSxcbiAgICAgIHJlbmRlcm1vZGU6IFwic29saWRcIixcbiAgICAgIGNvbnN0cmFpbnRzOiBmYWxzZSxcbiAgICAgIGNvbnRhY3RzOiBmYWxzZSwgIC8vIENvbnRhY3QgcG9pbnRzXG4gICAgICBjbTJjb250YWN0OiBmYWxzZSwgLy8gY2VudGVyIG9mIG1hc3MgdG8gY29udGFjdCBwb2ludHNcbiAgICAgIG5vcm1hbHM6IGZhbHNlLCAvLyBjb250YWN0IG5vcm1hbHNcbiAgICAgIGF4ZXM6IGZhbHNlLCAvLyBcImxvY2FsXCIgZnJhbWUgYXhlc1xuICAgICAgcGFydGljbGVTaXplOiAwLjEsXG4gICAgICBuZXRSYWRpdXM6IDAuNixcbiAgICAgIG5ldEhlaWdodERpZmY6IDAuMTIsXG4gICAgICBuZXRSYWRpdXNEaWZmOiAwLjExLFxuICAgICAgc2hhZG93czogZmFsc2UsXG4gICAgICBhYWJiczogZmFsc2UsXG4gICAgICBwcm9maWxpbmc6IGZhbHNlLFxuICAgICAgbWF4U3ViU3RlcHM6IDIwLFxuICAgICAgZGlzdDogMC41XG4gICAgfTtcbiAgICB0aGlzLnBhcnRpY2xlR2VvID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KCAwLjUsIDE2LCA4ICk7XG4gICAgdGhpcy5wYXJ0aWNsZU1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoIHsgY29sb3I6IDB4ZmZmZmZmIH0gKTtcbiAgfVxuXG4gIGFkZEJhbGxIYW5kQ29udGFjdE1hdGVyaWFsKGJhbGxNYXRlcmlhbCwgaGFuZE1hdGVyaWFsKSB7XG4gICAgbGV0IGNvbnRhY3RNYXRlcmlhbCA9IG5ldyBDQU5OT04uQ29udGFjdE1hdGVyaWFsKGJhbGxNYXRlcmlhbCwgaGFuZE1hdGVyaWFsLCB7IGZyaWN0aW9uOiAwLjAxLCByZXN0aXR1dGlvbjogMCB9KTtcbiAgICB0aGlzLndvcmxkLmFkZEJhbGxHcm91bmRDb250YWN0TWF0ZXJpYWwoY29udGFjdE1hdGVyaWFsKTtcbiAgfVxuXG4gIHVwZGF0ZVBoeXNpY3MoKSB7XG4gICAgdGhpcy53b3JsZC5zdGVwKHRoaXMuZHQpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpICE9PSB0aGlzLm1lc2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMubWVzaGVzW2ldKSB7XG4gICAgICAgIHRoaXMubWVzaGVzW2ldLnBvc2l0aW9uLmNvcHkodGhpcy5ib2RpZXNbaV0ucG9zaXRpb24pO1xuICAgICAgICB0aGlzLm1lc2hlc1tpXS5xdWF0ZXJuaW9uLmNvcHkodGhpcy5ib2RpZXNbaV0ucXVhdGVybmlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZmlsdGVyQXhpcyggdiApIHtcbiAgICB0aGlzLmF4aXNUaHJlc2hvbGQgPSAwLjI7XG4gICAgcmV0dXJuICggTWF0aC5hYnMoIHYgKSA+IHRoaXMuYXhpc1RocmVzaG9sZCApID8gdiA6IDA7XG4gIH1cblxuICBhZGRNZXNoKG1lc2gpIHtcbiAgICB0aGlzLm1lc2hlcy5wdXNoKG1lc2gpO1xuICAgIHRoaXMuc2NlbmUuYWRkKG1lc2gpO1xuICB9XG5cbiAgYWRkVmlzdWFsKGJvZHksIGlzRHJhZ2dhYmxlLCBpc1dpcmVmcmFtZSkge1xuICAgIGxldCBtZXNoO1xuICAgIGlmKGJvZHkgaW5zdGFuY2VvZiBDQU5OT04uQm9keSl7XG4gICAgICBtZXNoID0gdGhpcy5zaGFwZTJtZXNoKGJvZHkpO1xuICAgIH1cbiAgICBpZihtZXNoKSB7XG4gICAgICB0aGlzLmJvZGllcy5wdXNoKGJvZHkpO1xuICAgICAgdGhpcy5tZXNoZXMucHVzaChtZXNoKTtcbiAgICAgIHRoaXMuc2NlbmUuYWRkKG1lc2gpO1xuICAgICAgaWYgKGlzV2lyZWZyYW1lICYmIG1lc2gubWF0ZXJpYWwpIHtcbiAgICAgICAgbWVzaC5tYXRlcmlhbC5zZXRXaXJlZnJhbWUodHJ1ZSk7XG4gICAgICB9XG4gICAgICBpZiAoaXNXaXJlZnJhbWUgJiYgbWVzaC5jaGlsZHJlbiAmJiBtZXNoLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChsZXQgbCA9IDA7IGwgPCBtZXNoLmNoaWxkcmVuLmxlbmd0aDsgbCsrKSB7XG4gICAgICAgICAgbWVzaC5jaGlsZHJlbltsXS5tYXRlcmlhbC53aXJlZnJhbWUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNoO1xuICB9XG5cbiAgYWRkQm9keShib2R5KSB7XG4gICAgdGhpcy5ib2RpZXMucHVzaChib2R5KTtcbiAgICB0aGlzLndvcmxkLmFkZEJvZHkoYm9keSk7XG4gIH1cblxuICBjb25uZWN0KGJvZGllcywgaTEsajEsaTIsajIpe1xuICAgIGxldCBkaXN0YW5jZSA9IGJvZGllc1tpMStcIiBcIitqMV0ucG9zaXRpb24uZGlzdGFuY2VUbyhib2RpZXNbaTIrXCIgXCIrajJdLnBvc2l0aW9uKTtcbiAgICBsZXQgY29uc3RyYWludCA9IG5ldyBDQU5OT04uRGlzdGFuY2VDb25zdHJhaW50KGJvZGllc1tpMStcIiBcIitqMV0sYm9kaWVzW2kyK1wiIFwiK2oyXSxkaXN0YW5jZSk7XG4gICAgdGhpcy5uZXRDb25zdHJhaW50cy5wdXNoKGNvbnN0cmFpbnQpO1xuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludChjb25zdHJhaW50KTtcbiAgfVxuXG4gIHRvUmFkaWFucyhhbmdsZSkge1xuICAgIHJldHVybiBhbmdsZSAqIChNYXRoLlBJIC8gMTgwKTtcbiAgfVxuXG4gIGFkZFBvaW50ZXJDb25zdHJhaW50VG9NZXNoKHBvcywgbWVzaCkge1xuICAgIGxldCBpZHggPSB0aGlzLm1lc2hlcy5pbmRleE9mKG1lc2gpO1xuICAgIGlmKGlkeCAhPT0gLTEpe1xuICAgICAgdGhpcy5hZGRQb2ludGVyQ29uc3RyYWludFRvQm9keShwb3MueCxwb3MueSxwb3Mueix0aGlzLmJvZGllc1tpZHhdKTtcbiAgICB9XG4gIH1cblxuICBhZGRQb2ludGVyQ29uc3RyYWludFRvQm9keSh4LCB5LCB6LCBib2R5KSB7XG4gICAgLy8gVGhlIGNhbm5vbiBib2R5IGNvbnN0cmFpbmVkIGJ5IHRoZSBwb2ludGVyIGpvaW50XG4gICAgdGhpcy5jb25zdHJhaW5lZEJvZHkgPSBib2R5O1xuXG4gICAgLy8gVmVjdG9yIHRvIHRoZSBjbGlja2VkIHBvaW50LCByZWxhdGl2ZSB0byB0aGUgYm9keVxuICAgIGxldCB2MSA9IG5ldyBDQU5OT04uVmVjMyh4LHkseikudnN1Yih0aGlzLmNvbnN0cmFpbmVkQm9keS5wb3NpdGlvbik7XG5cbiAgICAvLyBBcHBseSBhbnRpLXF1YXRlcm5pb24gdG8gdmVjdG9yIHRvIHRyYW5zZm9ybSBpdCBpbnRvIHRoZSBsb2NhbCBib2R5IGNvb3JkaW5hdGUgc3lzdGVtXG4gICAgbGV0IGFudGlSb3QgPSB0aGlzLmNvbnN0cmFpbmVkQm9keS5xdWF0ZXJuaW9uLmludmVyc2UoKTtcbiAgICBsZXQgcGl2b3QgPSBuZXcgQ0FOTk9OLlF1YXRlcm5pb24oYW50aVJvdC54LCBhbnRpUm90LnksIGFudGlSb3QueiwgYW50aVJvdC53KS52bXVsdCh2MSk7IC8vIHBpdm90IGlzIG5vdCBpbiBsb2NhbCBib2R5IGNvb3JkaW5hdGVzXG5cbiAgICAvLyBNb3ZlIHRoZSBjYW5ub24gY2xpY2sgbWFya2VyIHBhcnRpY2xlIHRvIHRoZSBjbGljayBwb3NpdGlvblxuICAgIHRoaXMuam9pbnRCb2R5LnBvc2l0aW9uLnNldCh4LHkseik7XG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgY29uc3RyYWludFxuICAgIC8vIFRoZSBwaXZvdCBmb3IgdGhlIGpvaW50Qm9keSBpcyB6ZXJvXG4gICAgdGhpcy5wb2ludGVyQ29uc3RyYWludCA9IG5ldyBDQU5OT04uUG9pbnRUb1BvaW50Q29uc3RyYWludCh0aGlzLmNvbnN0cmFpbmVkQm9keSwgcGl2b3QsIHRoaXMuam9pbnRCb2R5LCBuZXcgQ0FOTk9OLlZlYzMoMCwwLDApKTtcblxuICAgIC8vIEFkZCB0aGUgY29uc3RyYWludCB0byB3b3JsZFxuICAgIHRoaXMud29ybGQuYWRkQ29uc3RyYWludCh0aGlzLnBvaW50ZXJDb25zdHJhaW50KTtcbiAgfVxuXG4gIC8vIFRoaXMgZnVuY3Rpb24gbW92ZXMgdGhlIHRyYW5zcGFyZW50IGpvaW50IGJvZHkgdG8gYSBuZXcgcG9zaXRpb24gaW4gc3BhY2VcbiAgbW92ZUpvaW50VG9Qb2ludCh4LHkseikge1xuICAgIC8vIE1vdmUgdGhlIGpvaW50IGJvZHkgdG8gYSBuZXcgcG9zaXRpb25cbiAgICB0aGlzLmpvaW50Qm9keS5wb3NpdGlvbi5zZXQoeCx5LHopO1xuICAgIHRoaXMucG9pbnRlckNvbnN0cmFpbnQudXBkYXRlKCk7XG4gIH1cblxuICByb3RhdGVKb2ludChheGlzWCwgYXhpc1opIHtcbiAgICBpZiAodGhpcy50b3VjaFBhZFBvc2l0aW9uLnggIT09IDAgfHwgdGhpcy50b3VjaFBhZFBvc2l0aW9uLnogIT09IDApIHtcbiAgICAgIGxldCBkZWx0YU1vdmUgPSB7IHg6IGF4aXNYIC0gdGhpcy50b3VjaFBhZFBvc2l0aW9uLngsIHo6IGF4aXNaIC0gdGhpcy50b3VjaFBhZFBvc2l0aW9uLnogfTtcbiAgICAgIGlmICh0aGlzLnBvaW50ZXJDb25zdHJhaW50KSB7XG4gICAgICAgIGxldCBkZWx0YVJvdGF0aW9uUXVhdGVybmlvbiA9IG5ldyBDQU5OT04uUXVhdGVybmlvbigpXG4gICAgICAgICAgLnNldEZyb21FdWxlcihcbiAgICAgICAgICAgIFBoeXNpY3NIYW5kbGVyLnRvUmFkaWFucyhkZWx0YU1vdmUueCksXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgUGh5c2ljc0hhbmRsZXIudG9SYWRpYW5zKGRlbHRhTW92ZS56KSxcbiAgICAgICAgICAgICdYWVonXG4gICAgICAgICAgKTtcbiAgICAgICAgdGhpcy5jb25zdHJhaW5lZEJvZHkucXVhdGVybmlvbiA9IG5ldyBDQU5OT04uUXVhdGVybmlvbigpLm11bHQoZGVsdGFSb3RhdGlvblF1YXRlcm5pb24sIHRoaXMuY29uc3RyYWluZWRCb2R5LnF1YXRlcm5pb24pO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnRvdWNoUGFkUG9zaXRpb24ueCA9IGF4aXNYO1xuICAgIHRoaXMudG91Y2hQYWRQb3NpdGlvbi56ID0gYXhpc1o7XG4gIH1cblxuICBzdGF0aWMgdG9SYWRpYW5zKGFuZ2xlKSB7XG4gICAgcmV0dXJuIGFuZ2xlICogKE1hdGguUEkgLyAxODApO1xuICB9XG5cbiAgcmVtb3ZlSm9pbnRDb25zdHJhaW50KCl7XG4gICAgLy8gUmVtb3ZlIGNvbnN0cmFpbnQgZnJvbSB3b3JsZFxuICAgIHRoaXMud29ybGQucmVtb3ZlQ29uc3RyYWludCh0aGlzLnBvaW50ZXJDb25zdHJhaW50KTtcbiAgICB0aGlzLnBvaW50ZXJDb25zdHJhaW50ID0gZmFsc2U7XG4gICAgdGhpcy50b3VjaFBhZFBvc2l0aW9uID0geyB4OiAwLCB6OiAwIH07XG4gIH1cblxuICBzaGFwZTJtZXNoKGJvZHkpIHtcbiAgICB2YXIgb2JqID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG5cbiAgICBmb3IgKHZhciBsID0gMDsgbCA8IGJvZHkuc2hhcGVzLmxlbmd0aDsgbCsrKSB7XG4gICAgICB2YXIgc2hhcGUgPSBib2R5LnNoYXBlc1tsXTtcblxuICAgICAgdmFyIG1lc2g7XG5cbiAgICAgIHN3aXRjaChzaGFwZS50eXBlKXtcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5TUEhFUkU6XG4gICAgICAgICAgdmFyIHNwaGVyZV9nZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSggc2hhcGUucmFkaXVzLCA4LCA4KTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIHNwaGVyZV9nZW9tZXRyeSwgdGhpcy5jdXJyZW50TWF0ZXJpYWwgKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5QQVJUSUNMRTpcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIHRoaXMucGFydGljbGVHZW8sIHRoaXMucGFydGljbGVNYXRlcmlhbCApO1xuICAgICAgICAgIHZhciBzID0gdGhpcy5zZXR0aW5ncztcbiAgICAgICAgICBtZXNoLnNjYWxlLnNldChzLnBhcnRpY2xlU2l6ZSxzLnBhcnRpY2xlU2l6ZSxzLnBhcnRpY2xlU2l6ZSk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuUExBTkU6XG4gICAgICAgICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoMTAsIDEwLCA0LCA0KTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgICAgICAgdmFyIHN1Ym1lc2ggPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICAgICAgICB2YXIgZ3JvdW5kID0gbmV3IFRIUkVFLk1lc2goIGdlb21ldHJ5LCB0aGlzLmN1cnJlbnRNYXRlcmlhbCApO1xuICAgICAgICAgIGdyb3VuZC5zY2FsZS5zZXQoMTAwLCAxMDAsIDEwMCk7XG4gICAgICAgICAgc3VibWVzaC5hZGQoZ3JvdW5kKTtcblxuICAgICAgICAgIGdyb3VuZC5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAgICAgICBncm91bmQucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG5cbiAgICAgICAgICBtZXNoLmFkZChzdWJtZXNoKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5CT1g6XG4gICAgICAgICAgdmFyIGJveF9nZW9tZXRyeSA9IG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSggIHNoYXBlLmhhbGZFeHRlbnRzLngqMixcbiAgICAgICAgICAgIHNoYXBlLmhhbGZFeHRlbnRzLnkqMixcbiAgICAgICAgICAgIHNoYXBlLmhhbGZFeHRlbnRzLnoqMiApO1xuICAgICAgICAgIG1lc2ggPSBuZXcgVEhSRUUuTWVzaCggYm94X2dlb21ldHJ5LCB0aGlzLmN1cnJlbnRNYXRlcmlhbCApO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgQ0FOTk9OLlNoYXBlLnR5cGVzLkNPTlZFWFBPTFlIRURST046XG4gICAgICAgICAgY29uc29sZS5sb2coYm9keSk7XG4gICAgICAgICAgY29uc29sZS5sb2coc2hhcGUpO1xuICAgICAgICAgIHZhciBnZW8gPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICAgICAgICAgIC8vIEFkZCB2ZXJ0aWNlc1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhcGUudmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB2ID0gc2hhcGUudmVydGljZXNbaV07XG4gICAgICAgICAgICBnZW8udmVydGljZXMucHVzaChuZXcgVEhSRUUuVmVjdG9yMyh2LngsIHYueSwgdi56KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBzaGFwZS5mYWNlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgZmFjZSA9IHNoYXBlLmZhY2VzW2ldO1xuXG4gICAgICAgICAgICAvLyBhZGQgdHJpYW5nbGVzXG4gICAgICAgICAgICB2YXIgYSA9IGZhY2VbMF07XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMTsgaiA8IGZhY2UubGVuZ3RoIC0gMTsgaisrKSB7XG4gICAgICAgICAgICAgIHZhciBiID0gZmFjZVtqXTtcbiAgICAgICAgICAgICAgdmFyIGMgPSBmYWNlW2ogKyAxXTtcbiAgICAgICAgICAgICAgZ2VvLmZhY2VzLnB1c2gobmV3IFRIUkVFLkZhY2UzKGEsIGIsIGMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZ2VvLmNvbXB1dGVCb3VuZGluZ1NwaGVyZSgpO1xuICAgICAgICAgIGdlby5jb21wdXRlRmFjZU5vcm1hbHMoKTtcbiAgICAgICAgICBtZXNoID0gbmV3IFRIUkVFLk1lc2goIGdlbywgdGhpcy5jdXJyZW50TWF0ZXJpYWwgKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENBTk5PTi5TaGFwZS50eXBlcy5IRUlHSFRGSUVMRDpcbiAgICAgICAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICAgICAgICAgIHZhciB2MCA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MSA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MiA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIGZvciAodmFyIHhpID0gMDsgeGkgPCBzaGFwZS5kYXRhLmxlbmd0aCAtIDE7IHhpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHlpID0gMDsgeWkgPCBzaGFwZS5kYXRhW3hpXS5sZW5ndGggLSAxOyB5aSsrKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgMjsgaysrKSB7XG4gICAgICAgICAgICAgICAgc2hhcGUuZ2V0Q29udmV4VHJpYW5nbGVQaWxsYXIoeGksIHlpLCBrPT09MCk7XG4gICAgICAgICAgICAgICAgdjAuY29weShzaGFwZS5waWxsYXJDb252ZXgudmVydGljZXNbMF0pO1xuICAgICAgICAgICAgICAgIHYxLmNvcHkoc2hhcGUucGlsbGFyQ29udmV4LnZlcnRpY2VzWzFdKTtcbiAgICAgICAgICAgICAgICB2Mi5jb3B5KHNoYXBlLnBpbGxhckNvbnZleC52ZXJ0aWNlc1syXSk7XG4gICAgICAgICAgICAgICAgdjAudmFkZChzaGFwZS5waWxsYXJPZmZzZXQsIHYwKTtcbiAgICAgICAgICAgICAgICB2MS52YWRkKHNoYXBlLnBpbGxhck9mZnNldCwgdjEpO1xuICAgICAgICAgICAgICAgIHYyLnZhZGQoc2hhcGUucGlsbGFyT2Zmc2V0LCB2Mik7XG4gICAgICAgICAgICAgICAgZ2VvbWV0cnkudmVydGljZXMucHVzaChcbiAgICAgICAgICAgICAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKHYwLngsIHYwLnksIHYwLnopLFxuICAgICAgICAgICAgICAgICAgbmV3IFRIUkVFLlZlY3RvcjModjEueCwgdjEueSwgdjEueiksXG4gICAgICAgICAgICAgICAgICBuZXcgVEhSRUUuVmVjdG9yMyh2Mi54LCB2Mi55LCB2Mi56KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSBnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggLSAzO1xuICAgICAgICAgICAgICAgIGdlb21ldHJ5LmZhY2VzLnB1c2gobmV3IFRIUkVFLkZhY2UzKGksIGkrMSwgaSsyKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nU3BoZXJlKCk7XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCB0aGlzLmN1cnJlbnRNYXRlcmlhbCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuVFJJTUVTSDpcbiAgICAgICAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuR2VvbWV0cnkoKTtcblxuICAgICAgICAgIHZhciB2MCA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MSA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIHZhciB2MiA9IG5ldyBDQU5OT04uVmVjMygpO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2hhcGUuaW5kaWNlcy5sZW5ndGggLyAzOyBpKyspIHtcbiAgICAgICAgICAgIHNoYXBlLmdldFRyaWFuZ2xlVmVydGljZXMoaSwgdjAsIHYxLCB2Mik7XG4gICAgICAgICAgICBnZW9tZXRyeS52ZXJ0aWNlcy5wdXNoKFxuICAgICAgICAgICAgICBuZXcgVEhSRUUuVmVjdG9yMyh2MC54LCB2MC55LCB2MC56KSxcbiAgICAgICAgICAgICAgbmV3IFRIUkVFLlZlY3RvcjModjEueCwgdjEueSwgdjEueiksXG4gICAgICAgICAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKHYyLngsIHYyLnksIHYyLnopXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdmFyIGogPSBnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggLSAzO1xuICAgICAgICAgICAgZ2VvbWV0cnkuZmFjZXMucHVzaChuZXcgVEhSRUUuRmFjZTMoaiwgaisxLCBqKzIpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nU3BoZXJlKCk7XG4gICAgICAgICAgZ2VvbWV0cnkuY29tcHV0ZUZhY2VOb3JtYWxzKCk7XG4gICAgICAgICAgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCB0aGlzLmN1cnJlbnRNYXRlcmlhbCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDQU5OT04uU2hhcGUudHlwZXMuQ1lMSU5ERVI6XG4gICAgICAgICAgY29uc29sZS5sb2coJ0N5bGluZGVyIScpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgXCJWaXN1YWwgdHlwZSBub3QgcmVjb2duaXplZDogXCIrc2hhcGUudHlwZTtcbiAgICAgIH1cblxuICAgICAgLy8gbWVzaC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTtcbiAgICAgIC8vIG1lc2guY2FzdFNoYWRvdyA9IHRydWU7XG4gICAgICAvLyBpZihtZXNoLmNoaWxkcmVuKXtcbiAgICAgIC8vICAgZm9yKHZhciBpPTA7IGk8bWVzaC5jaGlsZHJlbi5sZW5ndGg7IGkrKyl7XG4gICAgICAvLyAgICAgbWVzaC5jaGlsZHJlbltpXS5jYXN0U2hhZG93ID0gdHJ1ZTtcbiAgICAgIC8vICAgICBtZXNoLmNoaWxkcmVuW2ldLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgICAgLy8gICAgIGlmKG1lc2guY2hpbGRyZW5baV0pe1xuICAgICAgLy8gICAgICAgZm9yKHZhciBqPTA7IGo8bWVzaC5jaGlsZHJlbltpXS5sZW5ndGg7IGorKyl7XG4gICAgICAvLyAgICAgICAgIG1lc2guY2hpbGRyZW5baV0uY2hpbGRyZW5bal0uY2FzdFNoYWRvdyA9IHRydWU7XG4gICAgICAvLyAgICAgICAgIG1lc2guY2hpbGRyZW5baV0uY2hpbGRyZW5bal0ucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gICAgICAvLyAgICAgICB9XG4gICAgICAvLyAgICAgfVxuICAgICAgLy8gICB9XG4gICAgICAvLyB9XG5cbiAgICAgIHZhciBvID0gYm9keS5zaGFwZU9mZnNldHNbbF07XG4gICAgICB2YXIgcSA9IGJvZHkuc2hhcGVPcmllbnRhdGlvbnNbbF07XG4gICAgICBtZXNoLnBvc2l0aW9uLnNldChvLngsIG8ueSwgby56KTtcbiAgICAgIG1lc2gucXVhdGVybmlvbi5zZXQocS54LCBxLnksIHEueiwgcS53KTtcblxuICAgICAgb2JqLmFkZChtZXNoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xuICB9O1xufSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjZW5lQnVpbGRlciB7XG5cbiAgY29uc3RydWN0b3Ioc2NlbmUsIGNhbWVyYSwgcGh5c2ljc0hhbmRsZXIpIHtcbiAgICB0aGlzLnNjZW5lID0gc2NlbmU7XG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgdGhpcy5waHlzaWNzSGFuZGxlciA9IHBoeXNpY3NIYW5kbGVyO1xuICAgIHRoaXMubG9hZGVyID0gbmV3IFRIUkVFLlRleHR1cmVMb2FkZXIoKTtcbiAgICB0aGlzLnN0aWNrVG9DYW1lcmEgPSBmYWxzZTtcbiAgICB0aGlzLmZpeEJhbGxQb3NpdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaGFuZFJvdGF0aW9uU3RlcCA9IC0wLjAwNTtcblxuICAgIHRoaXMuQVBQID0ge1xuICAgICAgLyogQkFMTCAqL1xuICAgICAgYmFsbFJhZGl1czogNixcbiAgICAgIC8qIEJBU0tFVCAqL1xuICAgICAgYmFza2V0Q29sb3I6IDB4Yzg0YjI4LFxuICAgICAgZ2V0QmFza2V0UmFkaXVzOiAoKSA9PiB0aGlzLkFQUC5iYWxsUmFkaXVzICsgMixcbiAgICAgIGJhc2tldFR1YmVSYWRpdXM6IDAuNSxcbiAgICAgIGJhc2tldFk6IDIwLFxuICAgICAgYmFza2V0RGlzdGFuY2U6IDgwLFxuICAgICAgZ2V0QmFza2V0WjogKCkgPT4gdGhpcy5BUFAuZ2V0QmFza2V0UmFkaXVzKCkgKyB0aGlzLkFQUC5iYXNrZXRUdWJlUmFkaXVzICogMiAtIHRoaXMuQVBQLmJhc2tldERpc3RhbmNlXG4gICAgfTtcbiAgIH1cblxuXG4gIGJ1aWxkKCkge1xuICAgIHRoaXMuYWRkTGlnaHQoKTtcbiAgICB0aGlzLmFkZEJhbGwoKTtcbiAgICB0aGlzLmFkZEZpbmdlclRpcHMoKTtcbiAgICAvLyB0aGlzLmFkZEJhc2tldEJvYXJkKCk7XG4gICAgLy8gdGhpcy5waHlzaWNzSGFuZGxlci5hZGRCYWxsSGFuZENvbnRhY3RNYXRlcmlhbCh0aGlzLmJhbGxNYXRlcmlhbCwgdGhpcy5oYW5kTWF0ZXJpYWwpO1xuICB9XG5cbiAgYWRkTGlnaHQoKSB7XG4gICAgbGV0IGxpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhGRkZGRkYsIDEsIDEwMCk7XG4gICAgbGlnaHQucG9zaXRpb24uc2V0KDEsIDEwLCAtMC41KTtcbiAgICB0aGlzLnNjZW5lLmFkZChsaWdodCk7XG4gICAgdGhpcy5zY2VuZS5hZGQobmV3IFRIUkVFLkhlbWlzcGhlcmVMaWdodCgweDkwOTA5MCwgMHg0MDQwNDApKTtcbiAgfVxuXG4gIGFkZEJhbGwoKXtcbiAgICBjb25zdCBzY2FsZSA9IDE7XG4gICAgY29uc3QgYmFsbFJhZGl1cyA9IDAuMjUgKiBzY2FsZTtcblxuICAgIGxldCBiYWxsU3BoZXJlID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KCBiYWxsUmFkaXVzLCAxNiwgMTYgKTtcbiAgICBsZXQgYmFsbE1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKHtcbiAgICAgIG1hcDogdGhpcy5sb2FkZXIubG9hZCgnL3RleHR1cmVzL2JhbGwucG5nJyksXG4gICAgICBub3JtYWxNYXA6IHRoaXMubG9hZGVyLmxvYWQoJy90ZXh0dXJlcy9iYWxsX25vcm1hbC5wbmcnKSxcbiAgICAgIHNoaW5pbmVzczogMjAsXG4gICAgICByZWZsZWN0aXZpdHk6IDIsXG4gICAgICBub3JtYWxTY2FsZTogbmV3IFRIUkVFLlZlY3RvcjIoMC41LCAwLjUpXG4gICAgfSk7XG5cbiAgICBsZXQgYmFsbE1lc2ggPSBuZXcgVEhSRUUuTWVzaChiYWxsU3BoZXJlLCBiYWxsTWF0ZXJpYWwpO1xuICAgIGJhbGxNZXNoLmNhc3RTaGFkb3cgPSB0cnVlO1xuXG4gICAgdGhpcy5waHlzaWNzSGFuZGxlci5hZGRNZXNoKGJhbGxNZXNoKTtcblxuICAgIGxldCBzaXplID0gMTtcbiAgICBsZXQgZGFtcGluZyA9IDAuMDE7XG4gICAgbGV0IG1hc3MgPSAwLjE7IC8vMC42MjM3O1xuICAgIGxldCBzcGhlcmVTaGFwZSA9IG5ldyBDQU5OT04uU3BoZXJlKGJhbGxSYWRpdXMpO1xuICAgIHRoaXMuYmFsbE1hdGVyaWFsID0gbmV3IENBTk5PTi5NYXRlcmlhbCgpO1xuICAgIGxldCBiYWxsID0gbmV3IENBTk5PTi5Cb2R5KHtcbiAgICAgIG1hc3M6IG1hc3MsXG4gICAgICBtYXRlcmlhbDogdGhpcy5iYWxsTWF0ZXJpYWxcbiAgICB9KTtcblxuICAgIGJhbGwuYWRkU2hhcGUoc3BoZXJlU2hhcGUpO1xuICAgIGJhbGwubGluZWFyRGFtcGluZyA9IGRhbXBpbmc7XG5cbiAgICBiYWxsLnBvc2l0aW9uLnNldCgwLDcsMCk7XG5cbiAgICB0aGlzLnBoeXNpY3NIYW5kbGVyLmFkZEJvZHkoYmFsbCk7XG5cbiAgICB0aGlzLmJhbGwgPSBiYWxsO1xuICB9XG5cbiAgYWRkRmluZ2VyVGlwcygpIHtcbiAgICBsZXQgaGFuZF9tYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogMHhGRjMzMzMsXG4gICAgICBtZXRhbG5lc3M6IDAuOCxcbiAgICAgIHJvdWdobmVzczogMC41LFxuICAgICAgZW1pc3NpdmU6IDB4ZmZjY2ZmLFxuICAgICAgZW1pc3NpdmVJbnRlbnNpdHk6IDAuMlxuICAgIH0pO1xuICAgIHRoaXMuY3VycmVudE1hdGVyaWFsID0gaGFuZF9tYXRlcmlhbDtcbiAgICBjb25zdCBOY29scyA9IDQ7XG4gICAgY29uc3QgYW5nbGUgPSAzNjAgLyBOY29scztcbiAgICB0aGlzLmhhbmRNYXRlcmlhbCA9IG5ldyBDQU5OT04uTWF0ZXJpYWwoKTtcbiAgICBsZXQgYm9keSA9IG5ldyBDQU5OT04uQm9keSh7XG4gICAgICBtYXNzOiAwLFxuICAgICAgbWF0ZXJpYWw6IHRoaXMuaGFuZE1hdGVyaWFsXG4gICAgfSk7XG4gICAgbGV0IHBvc2l0aW9uID0gbmV3IENBTk5PTi5WZWMzKDAsMCwwKTtcbiAgICBmb3IobGV0IGk9MDsgaTxOY29sczsgaSsrKXtcbiAgICAgICAgbGV0IHJhZGlhbnMgPSB0aGlzLnBoeXNpY3NIYW5kbGVyLnRvUmFkaWFucyhhbmdsZSAqIGkpO1xuICAgICAgICBsZXQgcm93UmFkaXVzID0gMC4xNTtcblxuICAgICAgICBsZXQgcmVsYXRpdmVQb3NpdGlvbiA9IG5ldyBDQU5OT04uVmVjMyhcbiAgICAgICAgICByb3dSYWRpdXMgKiBNYXRoLnNpbihyYWRpYW5zKSxcbiAgICAgICAgICAwLFxuICAgICAgICAgIHJvd1JhZGl1cyAqIE1hdGguY29zKHJhZGlhbnMpXG4gICAgICAgICk7XG5cbiAgICAgICAgbGV0IGxvb2tBdFBvc2l0aW9uID0gcmVsYXRpdmVQb3NpdGlvbi52c3ViKHBvc2l0aW9uKTtcbiAgICAgICAgbGV0IG9yaWVudGF0aW9uID0gbmV3IENBTk5PTi5RdWF0ZXJuaW9uKGxvb2tBdFBvc2l0aW9uLngsIGxvb2tBdFBvc2l0aW9uLnosIGxvb2tBdFBvc2l0aW9uLnksMCk7XG4gICAgICAgIC8vIGJvZHkuYWRkU2hhcGUobmV3IENBTk5PTi5DeWxpbmRlcigwLjAwMSwgMC4wMDA4LCAwLjEsIDE2KSwgcmVsYXRpdmVQb3NpdGlvbiwgb3JpZW50YXRpb24pO1xuICAgICAgICAvLyBib2R5LmFkZFNoYXBlKG5ldyBDQU5OT04uU3BoZXJlKDAuMDUpLCByZWxhdGl2ZVBvc2l0aW9uKTtcbiAgICAgICAgYm9keS5hZGRTaGFwZShuZXcgQ0FOTk9OLkJveChuZXcgQ0FOTk9OLlZlYzMoMC4wMSwgMC4wMSwgMC4wMSkpLCByZWxhdGl2ZVBvc2l0aW9uLCBvcmllbnRhdGlvbik7XG4gICAgfVxuXG4gICAgbGV0IG1lc2ggPSB0aGlzLnBoeXNpY3NIYW5kbGVyLmFkZFZpc3VhbChib2R5LCBmYWxzZSwgdHJ1ZSk7XG4gICAgbWVzaC5yZWNlaXZlU2hhZG93ID0gZmFsc2U7XG4gICAgdGhpcy5waHlzaWNzSGFuZGxlci53b3JsZC5hZGRCb2R5KGJvZHkpO1xuXG4gICAgdGhpcy5oYW5kID0gYm9keTtcbiAgICAvLyB0aGlzLmhhbmQucG9zaXRpb24uc2V0KDAsMSwtMC41KTtcbiAgfVxuXG4gIHRvUmFkaWFucyhhbmdsZSkge1xuICAgIHJldHVybiBhbmdsZSAqIChNYXRoLlBJIC8gMTgwKTtcbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICBpZiAodGhpcy5pc1Rocm93aW5nKSB7XG4gICAgICB0aGlzLmhhbmQucXVhdGVybmlvbi54ICs9IDAuMTtcbiAgICAgIGlmICh0aGlzLmhhbmQucXVhdGVybmlvbi54ID4gMSkge1xuICAgICAgICB0aGlzLmlzVGhyb3dpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oYW5kLnF1YXRlcm5pb24ueCArPSB0aGlzLmhhbmRSb3RhdGlvblN0ZXA7IC8vIHRoaXMuaGFuZC5xdWF0ZXJuaW9uLnNldEZyb21BeGlzQW5nbGUobmV3IENBTk5PTi5WZWMzKDEsMCwwKSwtTWF0aC5QSS8xODAwKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyh0aGlzLmhhbmQucXVhdGVybmlvbi54KTtcbiAgICBjb25zb2xlLmxvZyh0aGlzLmhhbmRSb3RhdGlvblN0ZXApO1xuICAgIGlmICh0aGlzLmhhbmQucXVhdGVybmlvbi54IDwgLTAuMykge1xuICAgICAgdGhpcy5pc1Rocm93aW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMuaGFuZC5xdWF0ZXJuaW9uLnggPSAwLjU7XG4gICAgfVxuICAgIGlmICh0aGlzLmhhbmQucXVhdGVybmlvbi54IDwgLTEpIHtcbiAgICAgIC8vIHRoaXMuaGFuZC5xdWF0ZXJuaW9uLnggPSAtMTtcbiAgICAgIHRoaXMucm90YXRpb25IYW5kU3RlcCA9IC0xICogdGhpcy5yb3RhdGlvbkhhbmRTdGVwO1xuICAgIH1cbiAgICBpZiAodGhpcy5iYWxsLnBvc2l0aW9uLnkgPCAtNSkge1xuICAgICAgdGhpcy5iYWxsLnBvc2l0aW9uLnkgPSAwLjM7XG4gICAgICB0aGlzLmJhbGwucG9zaXRpb24ueCA9IDA7XG4gICAgICB0aGlzLmJhbGwucG9zaXRpb24ueiA9IDA7XG4gICAgICB0aGlzLmJhbGwudmVsb2NpdHkuc2V0KDAsIDAsIDApO1xuICAgICAgdGhpcy5iYWxsLmFuZ3VsYXJWZWxvY2l0eS5zZXQoMCwgMCwgMCk7XG4gICAgfVxuICB9XG59XG4iXX0=
