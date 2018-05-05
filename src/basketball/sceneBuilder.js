export default class SceneBuilder {

  constructor(scene, camera, physicsHandler, audioHandler) {
    this.scene = scene;
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.audioHandler = audioHandler;
    this.loader = new THREE.TextureLoader();
    this.stickToCamera = false;
    this.fixBallPosition = false;
    this.handRotationStep = 0.005;
    this.totalRotation = Math.PI/2;
    this.initialRotation = Math.PI/2;

    this.APP = {
      ballRadius: 6,
      basketColor: 0xc84b28,
      getBasketRadius: () => this.APP.ballRadius + 2,
      basketTubeRadius: 0.5,
      basketY: 20,
      basketDistance: 80,
      getBasketZ: () => this.APP.getBasketRadius() + this.APP.basketTubeRadius * 2 - this.APP.basketDistance
    };
    this.handSettings = {
      throwAngleStep: 0.738, // Math.PI/4,
      throwAngleStart: 0.221, // Math.PI/2 + Math.PI/4,
      throwAngleStop: -2.423, // -Math.PI,
      handRadius: 0.2, // 0.15,
      fingerTips: 7, // 4,
      fingerTipSize: 0.019 // 0.01
    }
   }

  addDatGuiOptions(gui) {
    let handler = {
      moveRing: () => {
        this.moveRing()
      },
      replaceHandSphere: () => {
        this.replaceHand(0)
      },
      replaceHandBox: () => {
        this.replaceHand(1)
      },
      replaceHandTorus: () => {
        this.replaceHand(2)
      },
      switchAutomaticManual: () => {
        this.switchAutomaticManual()
      }
    };
    gui.add(this.basket.position, 'x', -5, 5).step(0.1).name('Basket X').listen();
    gui.add(this.basket.position, 'y', 0, 8).step(0.1).name('Basket Y').listen();
    gui.add(this.basket.position, 'z', -10, 10).step(0.1).name('Basket Z').listen();
    gui.add(handler,'moveRing');
    gui.add(handler,'replaceHandSphere');
    gui.add(handler,'replaceHandBox');
    gui.add(handler,'replaceHandTorus');
    gui.add(handler,'switchAutomaticManual');
    gui.add(this.handSettings, 'throwAngleStep', 0, Math.PI).step(0.001).name('Throw angle step').listen();
    gui.add(this.handSettings, 'throwAngleStart', 0, Math.PI).step(0.001).name('Throw angle start').listen();
    gui.add(this.handSettings, 'throwAngleStop', -Math.PI, 0).step(0.001).name('Throw angle stop').listen();
    gui.add(this.handSettings, 'handRadius', 0.05, 0.2).step(0.01).name('Hand radius').listen();
    gui.add(this.handSettings, 'fingerTips', 3, 16).step(1).name('Finger tips').listen();
    gui.add(this.handSettings, 'fingerTipSize', 0.001, 0.05).step(0.001).name('Finger tip size').listen();
  }

  build() {
    this.addHall();
    this.addLight();
    // this.addFloor();
    this.addBall();
    // this.addHand();
    this.addFingerTips(0);

    // this.physicsHandler.addBallHandContactMaterial(this.ballMaterial, this.handMaterial);

    this.addBasket();
    this.moveRing();
  }

  addWall(length, height, positionX, positionZ, rotationY) {
    let wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry( length, height, 0.1, 8, 8, 1 ),
      new THREE.MeshBasicMaterial( {
        color: 0xffffff,
        transparent: true,
        opacity: 0
      } )
    );

    this.physicsHandler.addMesh(wallMesh);

    let wallShape = new CANNON.Box(new CANNON.Vec3(length, height, 0.1));

    let wall = new CANNON.Body({
      mass: 0
    });
    wall.addShape(wallShape);
    wall.position.x = positionX;
    wall.position.z = positionZ;
    wall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotationY);

    this.physicsHandler.addBody(wall);
  }

  addHall() {

    let sphere = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 32),
      new THREE.MeshBasicMaterial({
        map: this.loader.load('/textures/basketball/equirectangular_court.jpg')
      })
    );
    sphere.scale.x = -1;
    this.scene.add(sphere);

    this.addWall(28, 20, 0, 7.5, 0);
    this.addWall(28, 20, 0, -7.5, 0);
    this.addWall(15, 20, 14, 0, Math.PI / 2);
    this.addWall(15, 20, -14, 0, Math.PI / 2);
  }

  addFloor() {
    let geometry = new THREE.PlaneGeometry(28, 15, 1, 1);
    let texture = this.loader.load('/textures/basketball-court-tiles-396756-free-texture-wall-pine-construction-tile.jpg', function (texture) {

      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.offset.set(0, 0);
      texture.repeat.set(5, 5);

    });
    let material = new THREE.MeshBasicMaterial({
      map: texture,
      metalness: 0,
      roughness: 0.3
    });
    this.markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);  // floor.rotation.x = Math.PI / -2;
    mesh.receiveShadow = true;
    mesh.position.y -= 2;
    this.scene.add(mesh);
    this.floor = mesh;
  }

  addLight() {
    let light = new THREE.DirectionalLight(0xFFFFFF, 1, 100);
    light.position.set(1, 10, -0.5);
    this.scene.add(light);
    this.scene.add(new THREE.HemisphereLight(0x909090, 0x404040));
  }

  handleBallCollision(e){
    let relativeVelocity = e.contact.getImpactVelocityAlongNormal();
    let pos = new THREE.Vector3().copy(e.target.position);
    let ballIsInRing = (Math.abs(pos.x - this.ring.position.x) < 0.5 &&
    Math.abs(pos.y - this.ring.position.y) < 0.5 &&
    Math.abs(pos.z - this.ring.position.z) < 0.5);
    let audioElement;
    if (ballIsInRing) {
      audioElement = this.audioHandler.audioElement3;
    } else {
      audioElement = this.audioHandler.audioElement2;
    }
    this.audioHandler.setVolume(pos);
    if(Math.abs(relativeVelocity) > 10){
      // More energy
      this.audioHandler.setPosition(pos.normalize());
      audioElement.play();
    } else {
      // Less energy
      this.audioHandler.setPosition(pos.normalize());
      audioElement.play();
    }
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

    let damping = 0.01;
    let mass = 0.6237;
    let sphereShape = new CANNON.Sphere(ballRadius);
    this.ballMaterial = new CANNON.Material();
    let ball = new CANNON.Body({
      mass: mass,
      material: this.ballMaterial
    });

    this.physicsHandler.addBallGroundContactMaterial(this.ballMaterial);

    ball.addShape(sphereShape);
    ball.linearDamping = damping;

    ball.position.set(0,7,-5);

    ball.addEventListener("collide", (e) => this.handleBallCollision(e));

    this.physicsHandler.addBody(ball);

    this.ball = ball;
  }

  addHand() {
    let hand_material = new THREE.MeshBasicMaterial({
      color: 0xFF3333,
      metalness: 0.8,
      roughness: 0.5,
      emissive: 0xffccff,
      emissiveIntensity: 0.2
    });

    let handShape = new CANNON.Trimesh.createTorus(0.3, 0.1, 8, 16);
    this.handMaterial = new CANNON.Material();
    let hand = new CANNON.Body({
      mass: 0,
      material: this.handMaterial
    });
    hand.addShape(handShape);
    hand.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);

    this.handMesh = this.physicsHandler.addVisual(hand, hand_material, false, true);
    this.physicsHandler.world.addBody(hand);

    this.hand = hand;
  }

  addFingerTips(fingerTipType) {
    let hand_material = new THREE.MeshBasicMaterial({
      color: 0xFF3333,
      metalness: 0.8,
      roughness: 0.5,
      emissive: 0xffccff,
      emissiveIntensity: 0.2
    });
    const Ncols = this.handSettings.fingerTips;
    const angle = 360 / Ncols;
    this.handMaterial = new CANNON.Material();
    let body = new CANNON.Body({
      mass: 0,
      material: this.handMaterial
      // collisionResponse: false
    });
    let position = new CANNON.Vec3(0,0,1.8);
    for(let i=0; i<Ncols; i++){
      let radians = this.physicsHandler.toRadians(angle * i);
      let rowRadius = this.handSettings.handRadius;

      let relativePosition = new CANNON.Vec3(
        rowRadius * Math.sin(radians),
        rowRadius * Math.cos(radians),
        0
      );

      let lookAtPosition = relativePosition.vsub(position);
      let orientation = new CANNON.Quaternion(lookAtPosition.x, lookAtPosition.y, lookAtPosition.z,0);
      // body.addShape(new CANNON.Cylinder(0.001, 0.0008, 0.1, 16), relativePosition, orientation);
      let fingerTipShape;
      if (fingerTipType === 0) {
        fingerTipShape = new CANNON.Sphere(this.handSettings.fingerTipSize, this.handSettings.fingerTipSize);
      } else if (fingerTipType === 1) {
        fingerTipShape = new CANNON.Box(new CANNON.Vec3(this.handSettings.fingerTipSize, this.handSettings.fingerTipSize, this.handSettings.fingerTipSize));
      }
      body.addShape(fingerTipShape, relativePosition);
    }

    let mesh = this.physicsHandler.addVisual(body, hand_material, false, true);
    mesh.receiveShadow = false;
    this.handMesh = mesh;
    this.physicsHandler.world.addBody(body);

    this.hand = body;
  }

  addBasket() {
    this.addBasketBoard();
    this.addBasketRing();
  }

  addBasketBoard() {
    let geometry = new THREE.BoxGeometry(4, 3, 0.2);
    let imageCanvas2 = document.createElement("canvas");
    canvg(imageCanvas2, '/img/NBA_Logo.svg');

    let texture = new THREE.Texture(imageCanvas2);
    texture.needsUpdate = true;
    let material2 = new THREE.MeshBasicMaterial({
      color:0xffffff,
      map: texture,
      transparent:true,
      opacity:0.3,
      side: THREE.FrontSide
    });

    let basketMesh = new THREE.Mesh(geometry, material2);

    this.physicsHandler.addMesh(basketMesh);

    let basketShape = new CANNON.Box(new CANNON.Vec3(4, 3, 0.2));

    let basket = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, this.APP.getBasketZ() - this.APP.getBasketRadius(), this.APP.basketY + 10),
    });
    basket.addShape(basketShape);

    basket.position.set(0, 2.9, -4.57);
    this.basket = basket;

    this.physicsHandler.addBody(basket);
  }

  addBasketRing() {
    let ring_material = new THREE.MeshBasicMaterial({
      color: this.APP.basketColor,
      metalness: 0.8,
      roughness: 0.5,
      emissive: 0xffccff,
      emissiveIntensity: 0.2
    });
    this.ringMaterial = ring_material;

    let ringShape = new CANNON.Trimesh.createTorus(0.6, 0.06, 16, 32);

    let ring = new CANNON.Body({
      mass: 0
    });
    ring.addShape(ringShape);

    ring.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);

    let mesh = this.physicsHandler.addVisual(ring, ring_material, false);
    for (let l = 0; l < mesh.children.length; l++) {
      mesh.children[l].material = this.ringMaterial;
      // this.physicsHandler.addBallRingContactMaterial(this.ballMaterial, mesh.children[l].material);
    }
    this.physicsHandler.world.addBody(ring);

    this.physicsHandler.addNet(ring.position);

    this.ring = ring;
  }

  moveRing() {
    this.ring.position.set(this.basket.position.x,this.basket.position.y - 1,this.basket.position.z + 0.6);
    this.physicsHandler.replaceNet(this.ring.position);
  }

  replaceHand(fingerTipType) {
    this.physicsHandler.world.removeBody(this.hand);
    this.scene.remove(this.handMesh);
    if (fingerTipType === 2) {
      this.addHand();
    } else {
      this.addFingerTips(fingerTipType);
    }
  }

  switchAutomaticManual() {
    this.handSettings.isAutomatic = !this.handSettings.isAutomatic;
  }

  update() {
    if (this.stickToCamera) {
      let pointAt = new THREE.Vector3(0, 0, -1).normalize();
      if (this.fixBallPosition) {
        this.ball.velocity.set(0,0,0);
        this.ball.angularVelocity.set(0,0,0);
        this.ball.position.x = this.camera.position.x + pointAt.x + 0.25;
        this.ball.position.y = this.camera.position.y + pointAt.y + 0.40;
        this.ball.position.z = this.camera.position.z + pointAt.z;

        this.totalRotation = this.initialRotation;
        this.isThrowing = false;
        this.hand.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),this.totalRotation);
      }

      this.hand.position.x = this.camera.position.x + pointAt.x + 0.25;
      this.hand.position.y = this.camera.position.y + pointAt.y + 0.2;
      this.hand.position.z = this.camera.position.z + pointAt.z;

      if (!this.handSettings.isAutomatic) {
        let o = this.physicsHandler.rayInput.renderer.orientation;
        this.hand.quaternion.set(o.x, o.y, o.z, o.w);
      }
    }

    if (this.handSettings.isAutomatic) {
      if (this.isThrowing) {
        if (this.totalRotation < this.handSettings.throwAngleStop) {
        } else {
          this.totalRotation -= this.handSettings.throwAngleStep;
          this.hand.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),this.totalRotation);
        }
      } else {
        this.totalRotation += Math.PI/180;
        this.hand.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),this.totalRotation);
      }
      if (this.totalRotation > Math.PI/2 + Math.PI/4) { //  this.handSettings.throwAngleStart
        this.isThrowing = true;
        this.totalRotation = -Math.PI/4;
      }
    }
  }
}
