export default class SceneBuilder {

  constructor(scene, physicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
    this.loader = new THREE.TextureLoader();

    let floor;
    this.floor = floor;
   }

  addDatGuiOptions(gui) {
    gui.add(this.floor.position, 'y', -2, 2).step(0.001).name('Position floor Y').listen();
    // gui.add(this.torus.position, 'y', -1, 2).step(0.001).name('Position Y');
    // gui.add(this.torus.rotation, 'y', -Math.PI, Math.PI).step(0.001).name('Rotation').listen();
  }

  build() {
    let light = new THREE.DirectionalLight(0xFFFFFF, 1, 100);
    light.position.set(  1, 10, -0.5 );
    this.scene.add( light );

    this.scene.add( new THREE.HemisphereLight( 0x909090, 0x404040 ));

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

    let geometry = new THREE.PlaneGeometry( 100, 100, 1, 1 );
    let material = new THREE.MeshLambertMaterial( { color: 0x777777 } );
    this.markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    let mesh = new THREE.Mesh( geometry, material );
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
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

  addBall(){
    const scale = 1;
    const ballRadius = 0.25 * scale;

    let ballSphere = new THREE.SphereGeometry( ballRadius, 16, 16 );
    let ballMaterial = new THREE.MeshPhongMaterial({
      map: this.loader.load('/textures/ball.png'),
      normalMap: this.loader.load('/textures/ball_normal.png'),
      shininess: 20,
      reflectivity: 2,
      normalScale: new THREE.Vector2(0.5, 0.5)
    });

    let ballMesh = new THREE.Mesh(ballSphere, ballMaterial);
    ballMesh.castShadow = true;

    this.physicsHandler.addMesh(ballMesh);

    let size = 1;
    let damping = 0.01;
    let mass = 10;
    let sphereShape = new CANNON.Sphere(size);
    let mat = new CANNON.Material();
    let ball = new CANNON.Body({
      mass: mass,
      material: mat,
      position: new CANNON.Vec3(0, 7, -5)
    });

    this.physicsHandler.addContactMaterial(mat);

    ball.addShape(sphereShape);
    ball.linearDamping = damping;

    ball.position.set(0,7,-5);

    this.physicsHandler.addBody(ball);
  }

  update() {
    // this.physicsHandler.updatePhysics();
    // this.torus.rotation.y += 0.002;
    // if( this.torus.rotation.y > Math.PI ) this.torus.rotation.y -= ( Math.PI * 2 );
  }
}
