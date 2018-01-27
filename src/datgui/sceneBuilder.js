export default class SceneBuilder {

  constructor() {
    let torus = new THREE.Mesh(
      new THREE.TorusKnotGeometry( 0.4, 0.15, 256, 32 ),
      new THREE.MeshStandardMaterial({ roughness: 0.01, metalness: 0.2 })
    );
    this.torus = torus;
   }

  addDatGuiOptions(gui) {
    gui.add(this.torus.position, 'x', -1, 1).step(0.001).name('Position X');
    gui.add(this.torus.position, 'y', -1, 2).step(0.001).name('Position Y');
    gui.add(this.torus.rotation, 'y', -Math.PI, Math.PI).step(0.001).name('Rotation').listen();
  }

  build(scene) {
    let light = new THREE.DirectionalLight(0xFFFFFF, 1, 100);
    light.position.set(  1, 10, -0.5 );
    scene.add( light );

    scene.add( new THREE.HemisphereLight( 0x909090, 0x404040 ));

    let floor = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(6, 6, 12, 12),
      new THREE.MeshStandardMaterial({

        roughness: 1.0,
        metalness: 0.0,
        color: 0xFFFFFF,
        transparent: false,
        opacity: 0.8
      })
    );
    floor.rotation.x = Math.PI / -2;
    floor.receiveShadow = false;
    floor.position.y -=1;
    scene.add( floor );


    this.torus.position.set( -0.25, 1.4, -1.5 );
    this.torus.castShadow    = true;
    this.torus.receiveShadow = true;
    scene.add( this.torus );
  }

  update() {
    this.torus.rotation.y += 0.002;
    if( this.torus.rotation.y > Math.PI ) this.torus.rotation.y -= ( Math.PI * 2 );
  }
}
