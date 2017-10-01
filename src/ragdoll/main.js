import DemoRenderer from './renderer.js';

let renderer;
let vrDisplay;

function onLoad() {
  renderer = new DemoRenderer();

  window.addEventListener('resize', () => { renderer.resize() });

  navigator.getVRDisplays().then(function(displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];

      renderer.createRagdoll();

      vrDisplay.requestAnimationFrame(render);
    }
  });
}

function render() {
  renderer.render();

  vrDisplay.requestAnimationFrame(render);
}

window.addEventListener('load', onLoad);
