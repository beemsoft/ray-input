import {ResonanceAudio} from "resonance-audio";

export default class AudioHandler {

  constructor(scene) {
    this.scene = scene;

    let dimensions = {
      width: 10, height: 7, depth: 10,
    };
    let materials = {
      left: 'uniform', right: 'uniform',
      front: 'uniform', back: 'uniform',
      up: 'uniform', down: 'uniform',
    };
    let audioReady = false;

    this.audioReady = audioReady;
    this.dimensions = dimensions;
    this.materials = materials;
  }

  initAudio() {
    // Create <audio> streaming audio source.
    this.audioContext = new (window.AudioContext || window.webkitAudioContext);
    let audioSource = 'js/resources/cube-sound.wav';
    let audioSource2 = 'js/resources/Basketball-BallBounce.mp3';
    let audioSource3 = 'js/resources/Basketball-Swish.mp3';
    this.audioElement = document.createElement('audio');
    this.audioElement2 = document.createElement('audio');
    this.audioElement3 = document.createElement('audio');
    this.audioElement.src = audioSource;
    this.audioElement2.src = audioSource2;
    this.audioElement3.src = audioSource3;
    this.audioElement.load();
    this.audioElement2.load();
    this.audioElement3.load();
    this.audioElement.loop = true;
    this.audioElement2.loop = false;
    this.audioElement3.loop = false;
    this.audioElementSource = this.audioContext.createMediaElementSource(this.audioElement);
    this.audioElementSource2 = this.audioContext.createMediaElementSource(this.audioElement2);
    this.audioElementSource3 = this.audioContext.createMediaElementSource(this.audioElement3);

    this.audioScene = new ResonanceAudio(this.audioContext, {
      ambisonicOrder: 3,
      dimensions: this.dimensions,
      materials: this.materials
    });
    this.source = this.audioScene.createSource();

    this.audioElementSource.connect(this.source.input);
    this.audioElementSource2.connect(this.source.input);
    this.audioElementSource3.connect(this.source.input);

    this.audioScene.output.connect(this.audioContext.destination);

    this.output = this.audioContext.createGain();

    this.audioReady = true;
  }

  setPosition(v) {
    console.log('Position: ' + JSON.stringify(v));
    this.source.setPosition(v.x, v.y, v.z);
  }

  setVolume(v) {
    let distance = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    console.log('distance: ' + distance);
    let gain = 1 - distance / 10;
    // Clamp gain between 0 and 1.
    gain = Math.max(0, Math.min(1, gain));
    this.output.gain.value = gain;
  }

}
