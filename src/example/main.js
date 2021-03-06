/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import MenuRenderer from './renderer.js';

let renderer;
let vrDisplay;

function onLoad() {
  renderer = new MenuRenderer();

  window.addEventListener('resize', () => { renderer.resize() });

  navigator.getVRDisplays().then(function(displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];

      renderer.addCube();

      vrDisplay.requestAnimationFrame(render);
    }
  });
}

function render() {
  renderer.render();

  vrDisplay.requestAnimationFrame(render);
}

window.addEventListener('load', onLoad);
