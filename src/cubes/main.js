import DemoRenderer from './renderer.js';

var container;
var camera, scene, ray, raycaster, renderer;
let demoRenderer;
var gamepad;

var room;

function init() {

  container = document.createElement('div');
  document.body.appendChild(container);

  var info = document.createElement('div');
  info.style.position = 'absolute';
  info.style.top = '10px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
  info.innerHTML = '<a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> webvr-physics cubes';
  container.appendChild(info);

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  renderer.vr.enabled = true;

  demoRenderer = new DemoRenderer();
  demoRenderer.setSize(renderer.getSize());
  demoRenderer.createScene();

  raycaster = new THREE.Raycaster();



  WEBVR.getVRDisplay( function ( device ) {

    renderer.vr.setDevice( device );
    document.body.appendChild( WEBVR.getButton( device, renderer.domElement ) );

  } );

  gamepad = new THREE.DaydreamController();
  gamepad.position.set( 0.25, - 0.5, 0 );
  demoRenderer.scene.add( gamepad );

  let gamepadHelper = new THREE.Line( new THREE.BufferGeometry(), new THREE.LineBasicMaterial( { linewidth: 4 } ) );
  gamepadHelper.geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 10 ], 3 ) );
  gamepad.add( gamepadHelper );

  renderer.domElement.addEventListener( 'click', function ( event ) {

    gamepadHelper.material.color.setHex( Math.random() * 0xffffff );

  } );

  window.addEventListener( 'resize', onWindowResize, false );

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

  demoRenderer.camera.aspect = window.innerWidth / window.innerHeight;
  demoRenderer.camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

  renderer.animate( render );

}

function render() {

  gamepad.update();

  demoRenderer.render();

  renderer.render( demoRenderer.scene, demoRenderer.camera );

}
