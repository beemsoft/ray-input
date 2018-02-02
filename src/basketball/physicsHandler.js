export default class PhysicsHandler {

  constructor(scene, rayInput) {
    this.scene = scene;
    this.rayInput = rayInput;
    this.dt = 1 / 60;

    let world;

    // To be synced
    let meshes = [], bodies = [];

    this.meshes = meshes;
    this.bodies = bodies;

    let axes = [];
    axes[ 0 ] = {
      value: [ 0, 0 ]
    };

    // Setup our world
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    world.gravity.set(0, -9.8 ,0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Create a plane
    this.groundMaterial = new CANNON.Material();
    let groundShape = new CANNON.Plane();
    let groundBody = new CANNON.Body({ mass: 0, material: this.groundMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    groundBody.position.y -= 1.75;
    world.addBody(groundBody);


    let constraintDown = false;
    let clickMarker = false;
    let jointBody, constrainedBody, pointerConstraint;

    // Joint body
    let shape = new CANNON.Sphere(0.1);
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

  addContactMaterial(mat) {
    // Create contact material behaviour
    let mat_ground = new CANNON.ContactMaterial(this.groundMaterial, mat, { friction: 0.5, restitution: 0.7 });

    this.world.addContactMaterial(mat_ground);
  }

  addDatGuiOptions(gui) {
    // gui.add(this.world.contactMaterial.f, 'y', -2, 2).step(0.001).name('Position floor Y').listen();
    // gui.add(this.torus.position, 'y', -1, 2).step(0.001).name('Position Y');
    // gui.add(this.torus.rotation, 'y', -Math.PI, Math.PI).step(0.001).name('Rotation').listen();
  }

  updatePhysics(gamepad) {
    this.world.step(this.dt);
    for (let i = 0; i !== this.meshes.length; i++) {
      this.meshes[i].position.copy(this.bodies[i].position);
      this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
    }

    if (this.constraintDown) {
      //  Did any axes (assuming a 2D trackpad) values change?

      // let gamepad = DemoRenderer.getVRGamepad();
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
  }

  filterAxis( v ) {
    this.axisThreshold = 0.2;
    return ( Math.abs( v ) > this.axisThreshold ) ? v : 0;
  }

  addMesh(mesh) {
    this.meshes.push(mesh);
    this.scene.add(mesh);
    this.rayInput.add(mesh);
  }

  addVisual(body, isDraggable) {
    let mesh;
    if(body instanceof CANNON.Body){
      mesh = this.shape2mesh(body);
    }
    if(mesh) {
      this.bodies.push(body);
      this.meshes.push(mesh);
      this.scene.add(mesh);
      if (isDraggable) {
        this.rayInput.add(mesh);
      }
    }
  }

  addBody(body) {
    this.bodies.push(body);
    this.world.addBody(body);
  }

  addPointerConstraint(pos, mesh) {
    let idx = this.meshes.indexOf(mesh);
    if(idx !== -1){
      this.addPointerConstraint2(pos.x,pos.y,pos.z,this.bodies[idx]);
    }
  }

  addPointerConstraint2(x, y, z, body) {
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
  rotateJoint(axisX, axisZ) {
    if (this.touchPadPosition.x !== 0 || this.touchPadPosition.z !== 0) {
      let deltaMove = { x: axisX - this.touchPadPosition.x, z: axisZ - this.touchPadPosition.z };
      if (this.pointerConstraint) {
        let deltaRotationQuaternion = new CANNON.Quaternion()
          .setFromEuler(
            PhysicsHandler.toRadians(deltaMove.x),
            0,
            PhysicsHandler.toRadians(deltaMove.z),
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