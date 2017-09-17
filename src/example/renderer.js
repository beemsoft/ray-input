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

import WebVRManager from 'webvr-boilerplate'
import RayInput from '../ray-input'

const DEFAULT_COLOR = new THREE.Color(0x00FF00);
const HIGHLIGHT_COLOR = new THREE.Color(0x1E90FF);
const ACTIVE_COLOR = new THREE.Color(0xFF3333);

/**
 * Renders a menu of items that can be interacted with.
 */
export default class MenuRenderer {

  constructor() {
    let world;
    const dt = 1 / 60;
    let constraintDown = false;
    let jointBody, constrainedBody, pointerConstraint;
    let clickMarker = false;
    let geometry, material, mesh;
    // To be synced
    let meshes = [], bodies = [];

    let axes = [];
    axes[ 0 ] = {
      value: [ 0, 0 ]
    };

    // Setup our world
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    world.gravity.set(0,-4,0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Create a plane
    let groundShape = new CANNON.Plane();
    let groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    world.addBody(groundBody);

    // Joint body
    let shape = new CANNON.Sphere(0.1);
    jointBody = new CANNON.Body({ mass: 0 });
    jointBody.addShape(shape);
    jointBody.collisionFilterGroup = 0;
    jointBody.collisionFilterMask = 0;
    world.addBody(jointBody);

    let scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 500, 10000 );

    let aspect = window.innerWidth / window.innerHeight;
    let camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    scene.add(camera);

    let renderer = new THREE.WebGLRenderer({ antialias: true });
    console.log('sizing');
    console.log('window.devicePixelRatio: ' + window.devicePixelRatio);
    console.log('window.innerWidth: ' + window.innerWidth);
    console.log('window.innerHeight: ' + window.innerHeight);
    renderer.setClearColor( scene.fog.color );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMapEnabled = true;

    let effect = new THREE.VREffect(renderer);
    let controls = new THREE.VRControls(camera);
    controls.standing = true;

    let manager = new WebVRManager(renderer, effect);
    document.body.appendChild(renderer.domElement);

    // Input manager.
    let rayInput = new RayInput(camera);
    rayInput.setSize(renderer.getSize());
    rayInput.on('raydown', (opt_mesh) => { this.handleRayDown_(opt_mesh) });
    rayInput.on('raydrag', (opt_mesh) => { this.handleRayDrag_() });
    rayInput.on('rayup', (opt_mesh) => { this.handleRayUp_(opt_mesh) });
    rayInput.on('raycancel', (opt_mesh) => { this.handleRayCancel_(opt_mesh) });
    rayInput.on('rayover', (mesh) => { this.setSelected_(mesh, true) });
    rayInput.on('rayout', (mesh) => { this.setSelected_(mesh, false) });

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

    // lights
    let light;
    scene.add( new THREE.AmbientLight( 0x666666 ) );

    light = new THREE.DirectionalLight( 0xffffff, 1.75 );
    const d = 20;

    light.position.set( d, d, d );

    light.castShadow = true;
    light.shadow.mapSize.width= 1024;
    light.shadow.mapSize.width = 1024;
    light.shadow.camera.left = -d;
    light.shadow.cameraright = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.far = 3*d;
    light.shadow.camera.near = d;

    scene.add( light );

    // floor
    geometry = new THREE.PlaneGeometry( 100, 100, 1, 1 );
    //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
    material = new THREE.MeshLambertMaterial( { color: 0x777777 } );
    this.markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    //THREE.ColorUtils.adjustHSV( material.color, 0, 0, 0.9 );
    mesh = new THREE.Mesh( geometry, material );
    mesh.castShadow = true;
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
    mesh.receiveShadow = true;
    // mesh.position.y = -0.1;
    scene.add(mesh);

    // cubes
    let cubeGeo = new THREE.BoxGeometry( 1, 1, 1, 10, 10 );
    let cubeMaterial = new THREE.MeshPhongMaterial( { color: 0x29ad83 } );
    let cubeMesh;
    for(let i=0; i<1; i++){
      cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial);
      cubeMesh.castShadow = true;
      this.meshes.push(cubeMesh);
      this.scene.add(cubeMesh);
      rayInput.add(cubeMesh);
    }
  }

  addCube() {
    let boxShape, boxBody;
    const mass = 5;
    boxShape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5));
    for(let i=0; i<1; i++){
      boxBody = new CANNON.Body({ mass: mass });
      boxBody.addShape(boxShape);
      boxBody.position.set(0,7,-5);
      this.world.addBody(boxBody);
      this.bodies.push(boxBody);
    }
  }

  updatePhysics() {
    this.world.step(this.dt);
    for (let i = 0; i !== this.meshes.length; i++) {
      this.meshes[i].position.copy(this.bodies[i].position);
      this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
    }
  }

  render() {
    this.controls.update();
    this.rayInput.update();

    if (this.constraintDown) {
      //  Did any axes (assuming a 2D trackpad) values change?

      let gamepad = this.getVRGamepad();
      if (gamepad != null) {
        if (gamepad.axes[0] && gamepad.axes[1]) {


          let axesVal = this.axes[0].value;
          let axisX = gamepad.axes[0];
          let axisY = gamepad.axes[1];

          // only apply filter if both axes are below threshold
          let filteredX = this.filterAxis(axisX);
          let filteredY = this.filterAxis(axisY);
          if (!filteredX && !filteredY) {
            axisX = filteredX;
            axisY = filteredY;
          }

          if (axesVal[0] !== axisX || axesVal[1] !== axisY) {
            axesVal[0] = axisX;
            axesVal[1] = axisY;
            console.log('axes changed', axesVal);
            // controller.dispatchEvent({ type: 'axes ' + i + ' changed', axes: axesVal });
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
  getVRGamepad() {
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

  filterAxis( v ) {
    this.axisThreshold = 0.2;
    return ( Math.abs( v ) > this.axisThreshold ) ? v : 0;
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    console.log('Resizing');
    console.log('window.devicePixelRatio: ' + window.devicePixelRatio);
    console.log('window.innerWidth: ' + window.innerWidth);
    console.log('window.innerHeight: ' + window.innerHeight);
    var DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
    var WW = window.innerWidth;
    var HH = window.innerHeight;
    this.renderer.setSize( WW, HH );
    this.renderer.setViewport( 0, 0, WW*DPR, HH*DPR );
    this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    this.rayInput.setSize(this.renderer.getSize());
  }

  handleRayDown_(opt_mesh) {
    this.setAction_(opt_mesh, true);

    let pos = this.rayInput.renderer.reticle.position;
    if(pos){
      this.constraintDown = true;
      // Set marker on contact point
      this.setClickMarker(pos.x,pos.y,pos.z,this.scene);

      // Set the movement plane
      // setScreenPerpCenter(pos,camera);

      let idx = this.meshes.indexOf(opt_mesh);
      if(idx !== -1){
        this.addPointerConstraint(pos.x,pos.y,pos.z,this.bodies[idx]);
      }
    }
  }

  handleRayDrag_(opt_mesh) {
    // Move and project on the plane
    if (this.pointerConstraint) {
      let pos = this.rayInput.renderer.reticle.position;
      if(pos){
        this.setClickMarker(pos.x,pos.y,pos.z,this.scene);
        this.moveJointToPoint(pos.x,pos.y,pos.z);
      }
    }
  }

  handleRayUp_(opt_mesh) {
    this.setAction_(opt_mesh, false);

    this.constraintDown = false;
    // remove the marker
    this.removeClickMarker();

    // Send the remove mouse joint to server
    this.removeJointConstraint();
  }

  handleRayCancel_(opt_mesh) {
    this.setAction_(opt_mesh, false);
  }

  setSelected_(mesh, isSelected) {
    //console.log('setSelected_', isSelected);
    let newColor = isSelected ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
    mesh.material.color = newColor;
  }

  setAction_(opt_mesh, isActive) {
    //console.log('setAction_', !!opt_mesh, isActive);
    if (opt_mesh) {
      let newColor = isActive ? ACTIVE_COLOR : HIGHLIGHT_COLOR;
      opt_mesh.material.color = newColor;
      if (!isActive) {
        opt_mesh.material.wireframe = !opt_mesh.material.wireframe;
      }
    }
  }

  setClickMarker(x,y,z) {
    if(!this.clickMarker){
      const shape = new THREE.SphereGeometry(0.2, 8, 8);
      this.clickMarker = new THREE.Mesh(shape, this.markerMaterial);
      this.scene.add(this.clickMarker);
    }
    this.clickMarker.visible = true;
    this.clickMarker.position.set(x,y,z);
  }

  removeClickMarker(){
    this.clickMarker.visible = false;
  }

  addPointerConstraint(x, y, z, body) {
    // The cannon body constrained by the pointer joint
    this.constrainedBody = body;

    // Vector to the clicked point, relative to the body
    let v1 = new CANNON.Vec3(x,y,z).vsub(this.constrainedBody.position);

    // Apply anti-quaternion to vector to transform it into the local body coordinate system
    let antiRot = this.constrainedBody.quaternion.inverse();
    let pivot = new CANNON.Quaternion(antiRot.x, antiRot.y, antiRot.z, antiRot.w).vmult(v1); // pivot is not in local body coordinates

    // Move the cannon click marker particle to the click position
    this.jointBody.position.set(x,y,z);

    // Create a new constraint
    // The pivot for the jointBody is zero
    this.pointerConstraint = new CANNON.PointToPointConstraint(this.constrainedBody, pivot, this.jointBody, new CANNON.Vec3(0,0,0));

    // Add the constraint to world
    this.world.addConstraint(this.pointerConstraint);
  }

  // This function moves the transparent joint body to a new position in space
  moveJointToPoint(x,y,z) {
    // Move the joint body to a new position
    this.jointBody.position.set(x,y,z);
    this.pointerConstraint.update();
  }

  removeJointConstraint(){
    // Remove constraint from world
    this.world.removeConstraint(this.pointerConstraint);
    this.pointerConstraint = false;
  }

}
