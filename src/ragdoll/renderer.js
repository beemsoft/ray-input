import WebVRManager from 'webvr-boilerplate'
import RayInput from '../ray-input'

const DEFAULT_COLOR = new THREE.Color(0x00FF00);
const HIGHLIGHT_COLOR = new THREE.Color(0x1E90FF);
const ACTIVE_COLOR = new THREE.Color(0xFF3333);

export default class DemoRenderer {

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
    rayInput.on('raydrag', () => { this.handleRayDrag_() });
    rayInput.on('rayup', (opt_mesh) => { this.handleRayUp_(opt_mesh) });
    rayInput.on('raycancel', (opt_mesh) => { this.handleRayCancel_(opt_mesh) });
    rayInput.on('rayover', (mesh) => { DemoRenderer.setSelected_(mesh, true) });
    rayInput.on('rayout', (mesh) => { DemoRenderer.setSelected_(mesh, false) });

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
      contacts: false,  // Contact points
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
    scene.add(mesh);
  }

  addVisual(body) {
    // var s = this.settings;
    // What geometry should be used?
    let mesh;
    if(body instanceof CANNON.Body){
      mesh = this.shape2mesh(body);
    }
    if(mesh) {
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
  };

  createRagdoll(){
    const scale = 3;
    let position = new CANNON.Vec3(0,10,-5);
    const angleA = Math.PI, angleB = Math.PI, twistAngle = Math.PI;

    let numBodiesAtStart = this.world.bodies.length;

    const shouldersDistance = 0.5 * scale,
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

    let headShape =      new CANNON.Sphere(headRadius),
      upperArmShape =  new CANNON.Box(new CANNON.Vec3(upperArmLength * 0.5, upperArmSize * 0.5, upperArmSize * 0.5)),
      lowerArmShape =  new CANNON.Box(new CANNON.Vec3(lowerArmLength * 0.5, lowerArmSize * 0.5, lowerArmSize * 0.5)),
      upperBodyShape = new CANNON.Box(new CANNON.Vec3(shouldersDistance * 0.5, upperBodyLength * 0.5, lowerArmSize * 0.5)),
      pelvisShape =    new CANNON.Box(new CANNON.Vec3(shouldersDistance * 0.5, pelvisLength * 0.5, lowerArmSize * 0.5)),
      upperLegShape =  new CANNON.Box(new CANNON.Vec3(upperLegSize * 0.5, upperLegLength * 0.5, lowerArmSize * 0.5)),
      lowerLegShape =  new CANNON.Box(new CANNON.Vec3(lowerLegSize * 0.5, lowerLegLength * 0.5, lowerArmSize * 0.5));

    // Lower legs
    let lowerLeftLeg = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(-shouldersDistance/2,lowerLegLength / 2, 0)
    });
    let lowerRightLeg = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(shouldersDistance/2,lowerLegLength / 2, 0)
    });
    lowerLeftLeg.addShape(lowerLegShape);
    lowerRightLeg.addShape(lowerLegShape);
    this.world.addBody(lowerLeftLeg);
    this.world.addBody(lowerRightLeg);
    this.addVisual(lowerLeftLeg);
    this.addVisual(lowerRightLeg);

    // Upper legs
    let upperLeftLeg = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(-shouldersDistance/2,lowerLeftLeg.position.y+lowerLegLength/2+upperLegLength / 2, 0),
    });
    let upperRightLeg = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(shouldersDistance/2,lowerRightLeg.position.y+lowerLegLength/2+upperLegLength / 2, 0),
    });
    upperLeftLeg.addShape(upperLegShape);
    upperRightLeg.addShape(upperLegShape);
    this.world.addBody(upperLeftLeg);
    this.world.addBody(upperRightLeg);
    this.addVisual(upperLeftLeg);
    this.addVisual(upperRightLeg);

    // Pelvis
    let pelvis = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(0, upperLeftLeg.position.y+upperLegLength/2+pelvisLength/2, 0),
    });
    pelvis.addShape(pelvisShape);
    this.world.addBody(pelvis);
    this.addVisual(pelvis);

    // Upper body
    let upperBody = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(0,pelvis.position.y+pelvisLength/2+upperBodyLength/2, 0),
    });
    upperBody.addShape(upperBodyShape);
    this.world.addBody(upperBody);
    this.addVisual(upperBody);

    // Head
    let head = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(0,upperBody.position.y+upperBodyLength/2+headRadius+neckLength, 0),
    });
    head.addShape(headShape);
    this.world.addBody(head);
    this.addVisual(head);

    // Upper arms
    let upperLeftArm = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(-shouldersDistance/2-upperArmLength/2, upperBody.position.y+upperBodyLength/2, 0),
    });
    let upperRightArm = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(shouldersDistance/2+upperArmLength/2, upperBody.position.y+upperBodyLength/2, 0),
    });
    upperLeftArm.addShape(upperArmShape);
    upperRightArm.addShape(upperArmShape);
    this.world.addBody(upperLeftArm);
    this.world.addBody(upperRightArm);
    this.addVisual(upperLeftArm);
    this.addVisual(upperRightArm);

    // lower arms
    let lowerLeftArm = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3( upperLeftArm.position.x - lowerArmLength/2 - upperArmLength/2, upperLeftArm.position.y, 0)
    });
    let lowerRightArm = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3( upperRightArm.position.x + lowerArmLength/2 + upperArmLength/2, upperRightArm.position.y, 0)
    });
    lowerLeftArm.addShape(lowerArmShape);
    lowerRightArm.addShape(lowerArmShape);
    this.world.addBody(lowerLeftArm);
    this.world.addBody(lowerRightArm);
    this.addVisual(lowerLeftArm);
    this.addVisual(lowerRightArm);


    // Neck joint
    let neckJoint = new CANNON.ConeTwistConstraint(head, upperBody, {
      pivotA: new CANNON.Vec3(0,-headRadius-neckLength/2,0),
      pivotB: new CANNON.Vec3(0,upperBodyLength/2,0),
      axisA: CANNON.Vec3.UNIT_Y,
      axisB: CANNON.Vec3.UNIT_Y,
      angle: angleA,
      twistAngle: twistAngle
    });
    this.world.addConstraint(neckJoint);

    // Knee joints
    let leftKneeJoint = new CANNON.ConeTwistConstraint(lowerLeftLeg, upperLeftLeg, {
      pivotA: new CANNON.Vec3(0, lowerLegLength/2,0),
      pivotB: new CANNON.Vec3(0,-upperLegLength/2,0),
      axisA: CANNON.Vec3.UNIT_Y,
      axisB: CANNON.Vec3.UNIT_Y,
      angle: angleA,
      twistAngle: twistAngle
    });
    let rightKneeJoint= new CANNON.ConeTwistConstraint(lowerRightLeg, upperRightLeg, {
      pivotA: new CANNON.Vec3(0, lowerLegLength/2,0),
      pivotB: new CANNON.Vec3(0,-upperLegLength/2,0),
      axisA: CANNON.Vec3.UNIT_Y,
      axisB: CANNON.Vec3.UNIT_Y,
      angle: angleA,
      twistAngle: twistAngle
    });
    this.world.addConstraint(leftKneeJoint);
    this.world.addConstraint(rightKneeJoint);

    // Hip joints
    let leftHipJoint = new CANNON.ConeTwistConstraint(upperLeftLeg, pelvis, {
      pivotA: new CANNON.Vec3(0, upperLegLength/2,0),
      pivotB: new CANNON.Vec3(-shouldersDistance/2,-pelvisLength/2,0),
      axisA: CANNON.Vec3.UNIT_Y,
      axisB: CANNON.Vec3.UNIT_Y,
      angle: angleA,
      twistAngle: twistAngle
    });
    let rightHipJoint = new CANNON.ConeTwistConstraint(upperRightLeg, pelvis, {
      pivotA: new CANNON.Vec3(0, upperLegLength/2,0),
      pivotB: new CANNON.Vec3(shouldersDistance/2,-pelvisLength/2,0),
      axisA: CANNON.Vec3.UNIT_Y,
      axisB: CANNON.Vec3.UNIT_Y,
      angle: angleA,
      twistAngle: twistAngle
    });
    this.world.addConstraint(leftHipJoint);
    this.world.addConstraint(rightHipJoint);

    // Spine
    let spineJoint = new CANNON.ConeTwistConstraint(pelvis, upperBody, {
      pivotA: new CANNON.Vec3(0,pelvisLength/2,0),
      pivotB: new CANNON.Vec3(0,-upperBodyLength/2,0),
      axisA: CANNON.Vec3.UNIT_Y,
      axisB: CANNON.Vec3.UNIT_Y,
      angle: angleA,
      twistAngle: twistAngle
    });
    this.world.addConstraint(spineJoint);

    // Shoulders
    let leftShoulder = new CANNON.ConeTwistConstraint(upperBody, upperLeftArm, {
      pivotA: new CANNON.Vec3(-shouldersDistance/2, upperBodyLength/2,0),
      pivotB: new CANNON.Vec3(upperArmLength/2,0,0),
      axisA: CANNON.Vec3.UNIT_X,
      axisB: CANNON.Vec3.UNIT_X,
      angle: angleB
    });
    let rightShoulder= new CANNON.ConeTwistConstraint(upperBody, upperRightArm, {
      pivotA: new CANNON.Vec3(shouldersDistance/2,  upperBodyLength/2,0),
      pivotB: new CANNON.Vec3(-upperArmLength/2,0,0),
      axisA: CANNON.Vec3.UNIT_X,
      axisB: CANNON.Vec3.UNIT_X,
      angle: angleB,
      twistAngle: twistAngle
    });
    this.world.addConstraint(leftShoulder);
    this.world.addConstraint(rightShoulder);

    // Elbow joint
    let leftElbowJoint = new CANNON.ConeTwistConstraint(lowerLeftArm, upperLeftArm, {
      pivotA: new CANNON.Vec3(lowerArmLength/2, 0,0),
      pivotB: new CANNON.Vec3(-upperArmLength/2,0,0),
      axisA: CANNON.Vec3.UNIT_X,
      axisB: CANNON.Vec3.UNIT_X,
      angle: angleA,
      twistAngle: twistAngle
    });
    let rightElbowJoint= new CANNON.ConeTwistConstraint(lowerRightArm, upperRightArm, {
      pivotA: new CANNON.Vec3(-lowerArmLength/2,0,0),
      pivotB: new CANNON.Vec3(upperArmLength/2,0,0),
      axisA: CANNON.Vec3.UNIT_X,
      axisB: CANNON.Vec3.UNIT_X,
      angle: angleA,
      twistAngle: twistAngle
    });
    this.world.addConstraint(leftElbowJoint);
    this.world.addConstraint(rightElbowJoint);

    // Move all body parts
    for (let i = numBodiesAtStart; i < this.world.bodies.length; i++) {
      let body = this.world.bodies[i];
      body.position.vadd(position, body.position);
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

      let gamepad = DemoRenderer.getVRGamepad();
      if (gamepad !== null) {
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
  static getVRGamepad() {
    // If there's no gamepad API, there's no gamepad.
    if (!navigator.getGamepads) {
      return null;
    }

    let gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; ++i) {
      let gamepad = gamepads[i];

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
    const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
    const WW = window.innerWidth;
    const HH = window.innerHeight;
    this.renderer.setSize( WW, HH );
    this.renderer.setViewport( 0, 0, WW*DPR, HH*DPR );
    this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    this.rayInput.setSize(this.renderer.getSize());
  }

  handleRayDown_(opt_mesh) {
    DemoRenderer.setAction_(opt_mesh, true);

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

  handleRayDrag_() {
    if (this.pointerConstraint) {
      let pos = this.rayInput.renderer.reticle.position;
      if(pos){
        this.setClickMarker(pos.x,pos.y,pos.z,this.scene);
        this.moveJointToPoint(pos.x,pos.y,pos.z);
      }
    }
  }

  handleRayUp_(opt_mesh) {
    DemoRenderer.setAction_(opt_mesh, false);

    this.constraintDown = false;
    // remove the marker
    this.removeClickMarker();

    this.removeJointConstraint();
  }

  handleRayCancel_(opt_mesh) {
    DemoRenderer.setAction_(opt_mesh, false);
  }

  static setSelected_(mesh, isSelected) {
    //console.log('setSelected_', isSelected);
    if (mesh.material) {
      mesh.material.color = isSelected ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
    }
  }

  static setAction_(opt_mesh, isActive) {
    //console.log('setAction_', !!opt_mesh, isActive);
    if (opt_mesh && opt_mesh.material) {
      opt_mesh.material.color = isActive ? ACTIVE_COLOR : HIGHLIGHT_COLOR;
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

  // Calculate rotation from two vectors on the touchpad
  // https://stackoverflow.com/questions/40520129/three-js-rotate-object-using-mouse-and-orbit-control
  // http://jsfiddle.net/x4mby38e/3/
  rotateJoint(axisX, axisZ) {
    if (this.touchPadPosition.x !== 0 || this.touchPadPosition.z !== 0) {
      let deltaMove = { x: axisX - this.touchPadPosition.x, z: axisZ - this.touchPadPosition.z };
      if (this.pointerConstraint) {
      let deltaRotationQuaternion = new CANNON.Quaternion()
        .setFromEuler(
          DemoRenderer.toRadians(deltaMove.x),
          0,
          DemoRenderer.toRadians(deltaMove.z),
          'XYZ'
        );
        this.constrainedBody.quaternion = new CANNON.Quaternion().mult(deltaRotationQuaternion, this.constrainedBody.quaternion);
      }
    }
    this.touchPadPosition.x = axisX;
    this.touchPadPosition.z = axisZ;
  }

  static toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  removeJointConstraint(){
    // Remove constraint from world
    this.world.removeConstraint(this.pointerConstraint);
    this.pointerConstraint = false;
    this.touchPadPosition = { x: 0, z: 0 };
  }

  shape2mesh(body) {
    var wireframe = this.settings.renderMode === "wireframe";
    var obj = new THREE.Object3D();

    for (var l = 0; l < body.shapes.length; l++) {
      var shape = body.shapes[l];

      var mesh;

      switch(shape.type){

        case CANNON.Shape.types.SPHERE:
          var sphere_geometry = new THREE.SphereGeometry( shape.radius, 8, 8);
          mesh = new THREE.Mesh( sphere_geometry, this.currentMaterial );
          break;

        case CANNON.Shape.types.PARTICLE:
          mesh = new THREE.Mesh( this.particleGeo, this.particleMaterial );
          var s = this.settings;
          mesh.scale.set(s.particleSize,s.particleSize,s.particleSize);
          break;

        case CANNON.Shape.types.PLANE:
          var geometry = new THREE.PlaneGeometry(10, 10, 4, 4);
          mesh = new THREE.Object3D();
          var submesh = new THREE.Object3D();
          var ground = new THREE.Mesh( geometry, this.currentMaterial );
          ground.scale.set(100, 100, 100);
          submesh.add(ground);

          ground.castShadow = true;
          ground.receiveShadow = true;

          mesh.add(submesh);
          break;

        case CANNON.Shape.types.BOX:
          var box_geometry = new THREE.BoxGeometry(  shape.halfExtents.x*2,
            shape.halfExtents.y*2,
            shape.halfExtents.z*2 );
          mesh = new THREE.Mesh( box_geometry, this.currentMaterial );
          break;

        case CANNON.Shape.types.CONVEXPOLYHEDRON:
          var geo = new THREE.Geometry();

          // Add vertices
          for (var i = 0; i < shape.vertices.length; i++) {
            var v = shape.vertices[i];
            geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
          }

          for(var i=0; i < shape.faces.length; i++){
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
          mesh = new THREE.Mesh( geo, this.currentMaterial );
          break;

        case CANNON.Shape.types.HEIGHTFIELD:
          var geometry = new THREE.Geometry();

          var v0 = new CANNON.Vec3();
          var v1 = new CANNON.Vec3();
          var v2 = new CANNON.Vec3();
          for (var xi = 0; xi < shape.data.length - 1; xi++) {
            for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
              for (var k = 0; k < 2; k++) {
                shape.getConvexTrianglePillar(xi, yi, k===0);
                v0.copy(shape.pillarConvex.vertices[0]);
                v1.copy(shape.pillarConvex.vertices[1]);
                v2.copy(shape.pillarConvex.vertices[2]);
                v0.vadd(shape.pillarOffset, v0);
                v1.vadd(shape.pillarOffset, v1);
                v2.vadd(shape.pillarOffset, v2);
                geometry.vertices.push(
                  new THREE.Vector3(v0.x, v0.y, v0.z),
                  new THREE.Vector3(v1.x, v1.y, v1.z),
                  new THREE.Vector3(v2.x, v2.y, v2.z)
                );
                var i = geometry.vertices.length - 3;
                geometry.faces.push(new THREE.Face3(i, i+1, i+2));
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
            geometry.vertices.push(
              new THREE.Vector3(v0.x, v0.y, v0.z),
              new THREE.Vector3(v1.x, v1.y, v1.z),
              new THREE.Vector3(v2.x, v2.y, v2.z)
            );
            var j = geometry.vertices.length - 3;
            geometry.faces.push(new THREE.Face3(j, j+1, j+2));
          }
          geometry.computeBoundingSphere();
          geometry.computeFaceNormals();
          mesh = new THREE.Mesh(geometry, this.currentMaterial);
          break;

        default:
          throw "Visual type not recognized: "+shape.type;
      }

      mesh.receiveShadow = true;
      mesh.castShadow = true;
      if(mesh.children){
        for(var i=0; i<mesh.children.length; i++){
          mesh.children[i].castShadow = true;
          mesh.children[i].receiveShadow = true;
          if(mesh.children[i]){
            for(var j=0; j<mesh.children[i].length; j++){
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
  };

}
