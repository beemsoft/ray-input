export default class SceneBuilder {

  constructor(scene, camera, physicsHandler) {
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
      getBasketRadius: () => this.APP.ballRadius + 2,
      basketTubeRadius: 0.5,
      basketY: 20,
      basketDistance: 80,
      getBasketZ: () => this.APP.getBasketRadius() + this.APP.basketTubeRadius * 2 - this.APP.basketDistance
    };
   }


  build() {
    this.addLight();
    this.addBall();
    this.addFingerTips();
    // this.addBasketBoard();
    this.physicsHandler.addBallHandContactMaterial(this.ballMaterial, this.handMaterial);
  }

  addLight() {
    let light = new THREE.DirectionalLight(0xFFFFFF, 1, 100);
    light.position.set(1, 10, -0.5);
    this.scene.add(light);
    this.scene.add(new THREE.HemisphereLight(0x909090, 0x404040));
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
    let mass = 0.1; //0.6237;
    let sphereShape = new CANNON.Sphere(ballRadius);
    this.ballMaterial = new CANNON.Material();
    let ball = new CANNON.Body({
      mass: mass,
      material: this.ballMaterial
    });

    ball.addShape(sphereShape);
    ball.linearDamping = damping;

    ball.position.set(0,7,0);

    this.physicsHandler.addBody(ball);

    this.ball = ball;
  }

  addFingerTips() {
    let hand_material = new THREE.MeshBasicMaterial({
      color: 0xFF3333,
      metalness: 0.8,
      roughness: 0.5,
      emissive: 0xffccff,
      emissiveIntensity: 0.2
    });
    this.currentMaterial = hand_material;
    const Ncols = 4;
    const angle = 360 / Ncols;
    this.handMaterial = new CANNON.Material();
    let body = new CANNON.Body({
      mass: 0,
      material: this.handMaterial
    });
    let position = new CANNON.Vec3(0,0,0);
    for(let i=0; i<Ncols; i++){
        let radians = this.physicsHandler.toRadians(angle * i);
        let rowRadius = 0.15;

        let relativePosition = new CANNON.Vec3(
          rowRadius * Math.sin(radians),
          0,
          rowRadius * Math.cos(radians)
        );

        let lookAtPosition = relativePosition.vsub(position);
        let orientation = new CANNON.Quaternion(lookAtPosition.x, lookAtPosition.z, lookAtPosition.y,0);
        // body.addShape(new CANNON.Cylinder(0.001, 0.0008, 0.1, 16), relativePosition, orientation);
        // body.addShape(new CANNON.Sphere(0.05), relativePosition);
        body.addShape(new CANNON.Box(new CANNON.Vec3(0.01, 0.01, 0.01)), relativePosition, orientation);
    }

    let mesh = this.physicsHandler.addVisual(body, false, true);
    mesh.receiveShadow = false;
    this.physicsHandler.world.addBody(body);

    this.hand = body;
    // this.hand.position.set(0,1,-0.5);
  }

  toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  update() {
    if (this.isThrowing) {
      this.hand.quaternion.x += 0.1;
      if (this.hand.quaternion.x > 1) {
        this.isThrowing = false;
      }
    } else {
      this.hand.quaternion.x += this.handRotationStep; // this.hand.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/1800);
    }

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
}
