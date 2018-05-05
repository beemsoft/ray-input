import SceneBuilder from './sceneBuilder.js';
import PhysicsHandler from './physicsHandler.js';

let renderer;
var MARGIN = 0;
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
let camera, scene, controls;
var mouseX = 0, mouseY = 0;
let sceneBuilder;
let physicsHandler;

var container;
var smoothie = null;
var smoothieCanvas = null;
var stats;

function init() {
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
  renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
  renderer.domElement.style.position = "relative";
  renderer.domElement.style.top = MARGIN + 'px';
  container.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 24, SCREEN_WIDTH / SCREEN_HEIGHT, 0.1, 25 );

  camera.up.set(0,1,0);
  camera.position.set(2,0.5,-5);

  scene  = new THREE.Scene();
  scene.fog = new THREE.Fog( 0x000000, 500, 10000 );

  let cameraGroup = new THREE.Group();
  cameraGroup.position.set( 0, 0, 0 );
  cameraGroup.add( camera );
  scene.add(cameraGroup);

  document.addEventListener('mousemove',onDocumentMouseMove);
  window.addEventListener( 'resize', onWindowResize, false );

  physicsHandler = new PhysicsHandler(scene);
  sceneBuilder = new SceneBuilder(scene, camera, physicsHandler);

  sceneBuilder.build();


  // Smoothie
  smoothieCanvas = document.createElement("canvas");
  smoothieCanvas.width = window.innerWidth;
  smoothieCanvas.height = window.innerHeight;
  smoothieCanvas.style.opacity = 0.5;
  smoothieCanvas.style.position = 'absolute';
  smoothieCanvas.style.top = '0px';
  smoothieCanvas.style.zIndex = 90;
  renderer.domElement.appendChild( smoothieCanvas );
  smoothie = new SmoothieChart({
    labelOffsetY:50,
    maxDataSetLength:100,
    millisPerPixel:2,
    grid: {
      strokeStyle:'none',
      fillStyle:'none',
      lineWidth: 1,
      millisPerLine: 250,
      verticalSections: 6
    },
    labels: {
      fillStyle:'rgb(180, 180, 180)'
    }
  });
  smoothie.streamTo(smoothieCanvas);
  // Create time series for each profile label
  var lines = {};
  var colors = [[255, 0, 0],[0, 255, 0],[0, 0, 255],[255,255,0],[255,0,255],[0,255,255]];
  var i=0;
  for(var label in physicsHandler.world.profile){
    var c = colors[i%colors.length];
    lines[label] = new TimeSeries({
      label : label,
      fillStyle : "rgb("+c[0]+","+c[1]+","+c[2]+")",
      maxDataLength : 500,
    });
    i++;
  }

  // Add a random value to each line every second
  physicsHandler.world.addEventListener("postStep",function(evt) {
    for(var label in physicsHandler.world.profile)
      lines[label].append(physicsHandler.world.time * 1000, physicsHandler.world.profile[label]);
  });

  // Add to SmoothieChart
  var i=0;
  for(var label in physicsHandler.world.profile){
    var c = colors[i%colors.length];
    smoothie.addTimeSeries(lines[label],{
      strokeStyle : "rgb("+c[0]+","+c[1]+","+c[2]+")",
      //fillStyle:"rgba("+c[0]+","+c[1]+","+c[2]+",0.3)",
      lineWidth:2
    });
    i++;
  }
  physicsHandler.world.doProfiling = false;
  smoothie.stop();
  smoothieCanvas.style.display = "none";

  // STATS
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.zIndex = 100;
  container.appendChild( stats.domElement );

  // Trackball controls
  controls = new THREE.TrackballControls( camera, renderer.domElement );
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.2;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = false;
  controls.dynamicDampingFactor = 0.3;
  var radius = 100;
  controls.minDistance = 0.0;
  controls.maxDistance = radius * 1000;
  //controls.keys = [ 65, 83, 68 ]; // [ rotateKey, zoomKey, panKey ]
  controls.screen.width = SCREEN_WIDTH;
  controls.screen.height = SCREEN_HEIGHT;
}

function onLoad() {
  init();
  animate();
}

window.addEventListener('load', onLoad);

window.addEventListener('dblclick', function(event) {
  console.log('double click! pos: ' + event.pageX + ', ' + event.pageY);
});

function onDocumentMouseMove( event ) {
  mouseX = ( event.clientX - windowHalfX );
  mouseY = ( event.clientY - windowHalfY );
}

function onWindowResize( event ) {
  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;

  renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

  camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  camera.updateProjectionMatrix();

  controls.screen.width = SCREEN_WIDTH;
  controls.screen.height = SCREEN_HEIGHT;

  camera.radius = ( SCREEN_WIDTH + SCREEN_HEIGHT ) / 4;
}

function animate() {
  renderer.animate( render );
}

function render() {
  controls.update();
  renderer.clear();
  sceneBuilder.update();
  physicsHandler.updatePhysics();
  renderer.render( scene, camera );
  stats.update();
}


