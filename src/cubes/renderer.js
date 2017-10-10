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

    let clock = new THREE.Clock();
    let room;

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

    // Joint body
    let shape = new CANNON.Sphere(0.1);
    jointBody = new CANNON.Body({ mass: 0 });
    jointBody.addShape(shape);
    jointBody.collisionFilterGroup = 0;
    jointBody.collisionFilterMask = 0;
    world.addBody(jointBody);

    let scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 500, 10000 );

    let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10 );
    scene.add(camera);

    // Input manager.
    let rayInput = new RayInput(camera);
    rayInput.setSize(this.size);
    rayInput.on('raydown', (opt_mesh) => { this.handleRayDown_(opt_mesh) });
    rayInput.on('raydrag', () => { this.handleRayDrag_() });
    rayInput.on('rayup', (opt_mesh) => { this.handleRayUp_(opt_mesh) });
    rayInput.on('raycancel', (opt_mesh) => { this.handleRayCancel_(opt_mesh) });
    rayInput.on('rayover', (mesh) => { DemoRenderer.setSelected_(mesh, true) });
    rayInput.on('rayout', (mesh) => { DemoRenderer.setSelected_(mesh, false) });

    // Add the ray input mesh to the scene.
    scene.add(rayInput.getMesh());

    this.camera = camera;
    this.scene = scene;
    this.rayInput = rayInput;
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
    this.clock = clock;

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

  }

  setSize(size) {
    this.size = size;
  }

  createScene() {
    let background = new THREE.CubeTextureLoader()
      .setPath( 'textures/cube/MilkyWay/' )
      .load( [ 'dark-s_px.jpg', 'dark-s_nx.jpg', 'dark-s_py.jpg', 'dark-s_ny.jpg', 'dark-s_pz.jpg', 'dark-s_nz.jpg' ] );
    background.format = THREE.RGBFormat;

    // scene = new THREE.Scene();
    this.scene.background = background;

    let room = new THREE.Mesh(
      new THREE.BoxGeometry( 6, 6, 6, 8, 8, 8 ),
      new THREE.MeshBasicMaterial( { color: 0x808080, wireframe: true } )
    );

    this.scene.add( room );

    this.scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

    let light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 1, 1, 1 ).normalize();
    this.scene.add( light );

    let geometry = new THREE.BoxGeometry( 0.15, 0.15, 0.15 );

    for ( let i = 0; i < 200; i ++ ) {

      let object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

      object.position.x = Math.random() * 4 - 2;
      object.position.y = Math.random() * 4 - 2;
      object.position.z = Math.random() * 4 - 2;

      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      object.scale.x = Math.random() + 0.5;
      object.scale.y = Math.random() + 0.5;
      object.scale.z = Math.random() + 0.5;

      object.userData.velocity = new THREE.Vector3();
      object.userData.velocity.x = Math.random() * 0.01 - 0.005;
      object.userData.velocity.y = Math.random() * 0.01 - 0.005;
      object.userData.velocity.z = Math.random() * 0.01 - 0.005;

      room.add( object );

    }
    this.room = room;

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

  updatePhysics() {
    this.world.step(this.dt);
    for (let i = 0; i !== this.meshes.length; i++) {
        this.meshes[i].position.copy(this.bodies[i].position);
      this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
    }
  }

  render() {
    // this.controls.update();
    // this.rayInput.update();
    //
    // if (this.constraintDown) {
    //   //  Did any axes (assuming a 2D trackpad) values change?
    //
    //   let gamepad = DemoRenderer.getVRGamepad();
    //   if (gamepad !== null) {
    //     if (gamepad.axes[0] && gamepad.axes[1]) {
    //
    //
    //       let axesVal = this.axes[0].value;
    //       let axisX = gamepad.axes[0];
    //       let axisY = gamepad.axes[1];
    //
    //       // only apply filter if both axes are below threshold
    //       let filteredX = this.filterAxis(axisX);
    //       let filteredY = this.filterAxis(axisY);
    //       if (!filteredX && !filteredY) {
    //         axisX = filteredX;
    //         axisY = filteredY;
    //       }
    //
    //       if (axesVal[0] !== axisX || axesVal[1] !== axisY) {
    //         axesVal[0] = axisX;
    //         axesVal[1] = axisY;
    //         console.log('axes changed', axesVal);
    //         this.rotateJoint(axisX, axisY);
    //       }
    //     }
    //   }
    // }
    //
    // this.updatePhysics();

    // keep cubes inside room

    for ( let i = 0; i < this.room.children.length; i ++ ) {

      let cube = this.room.children[ i ];

      cube.position.add( cube.userData.velocity );

      if ( cube.position.x < - 3 || cube.position.x > 3 ) {

        cube.position.x = THREE.Math.clamp( cube.position.x, - 3, 3 );
        cube.userData.velocity.x = - cube.userData.velocity.x;

      }

      if ( cube.position.y < - 3 || cube.position.y > 3 ) {

        cube.position.y = THREE.Math.clamp( cube.position.y, - 3, 3 );
        cube.userData.velocity.y = - cube.userData.velocity.y;

      }

      if ( cube.position.z < - 3 || cube.position.z > 3 ) {

        cube.position.z = THREE.Math.clamp( cube.position.z, - 3, 3 );
        cube.userData.velocity.z = - cube.userData.velocity.z;

      }

      let delta = this.clock.getDelta() * 60;

      cube.rotation.x += cube.userData.velocity.x * 2 * delta;
      cube.rotation.y += cube.userData.velocity.y * 2 * delta;
      cube.rotation.z += cube.userData.velocity.z * 2 * delta;

    }
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

  // resize() {
  //   this.camera.aspect = window.innerWidth / window.innerHeight;
  //   this.camera.updateProjectionMatrix();
  //   console.log('Resizing');
  //   console.log('window.devicePixelRatio: ' + window.devicePixelRatio);
  //   console.log('window.innerWidth: ' + window.innerWidth);
  //   console.log('window.innerHeight: ' + window.innerHeight);
  //   const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
  //   const WW = window.innerWidth;
  //   const HH = window.innerHeight;
  //   this.renderer.setSize( WW, HH );
  //   this.renderer.setViewport( 0, 0, WW*DPR, HH*DPR );
  //   this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
  //   this.rayInput.setSize(this.renderer.getSize());
  // }

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
