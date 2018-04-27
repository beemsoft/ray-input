import RayInput from '../ray-input'
import SceneBuilder from './sceneBuilder.js'

let renderer;
let camera, scene, gamepad, rayInput;
let guiInputHelper = null;
let isDatGuiVisible = false;
let gui;
let sceneBuilder;

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor( 0xCCCCCC );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.vr.enabled  = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10 );
  camera.position.y +=2;
  scene  = new THREE.Scene();

  rayInput = new RayInput(camera);
  rayInput.setSize(renderer.getSize());
  rayInput.on('raydown', () => {
    handleRayDown_();
    if (isDatGuiVisible && guiInputHelper !== null) {
      guiInputHelper.pressed(true);
    }
  });
  rayInput.on('rayup', () => {
    if (isDatGuiVisible && guiInputHelper !== null) {
      guiInputHelper.pressed(false);
    }
  });
  let cameraGroup = new THREE.Group();
  cameraGroup.position.set( 0, 0, 0 );
  cameraGroup.add( camera );
  cameraGroup.add( rayInput.getMesh() );
  scene.add(cameraGroup);

  gamepad = new THREE.DaydreamController();
  gamepad.position.set( 0, 0, 0 );

  WEBVR.getVRDisplay( function( display ){
    renderer.vr.setDevice( display );
    document.body.appendChild( WEBVR.getButton( display, renderer.domElement ))
  });

  window.addEventListener( 'resize', onWindowResize, false );

  sceneBuilder = new SceneBuilder();
  sceneBuilder.build(scene);
}

function createDatGui() {
  gui = dat.GUIVR.create('Settings');
  gui.position.set(0.2, 0.5, -1);
  gui.rotation.set(Math.PI / -12, 0, 0);
  sceneBuilder.addDatGuiOptions(gui);
  guiInputHelper = dat.GUIVR.addInputObject( rayInput );
}

function handleRayDown_() {
  if (gui == null) {
    createDatGui();
  }
  let orientation = rayInput.armModel.pose.orientation;
  if (orientation && Math.abs(orientation.x) > 0.6 && Math.abs(orientation.y) < 0.2 && Math.abs(orientation.z) < 0.2) {
    isDatGuiVisible = !isDatGuiVisible;
    if (isDatGuiVisible) {
      scene.add(gui);
      scene.add( guiInputHelper );
    } else {
      scene.remove(gui);
      scene.remove(guiInputHelper);
    }
  }
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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight )
}

function animate() {
  renderer.animate( render );
}

function render() {
  gamepad.update();
  rayInput.update();

  if(isDatGuiVisible) {
    dat.GUIVR.update();
  }

  sceneBuilder.update();

  renderer.render( scene, camera )
}
