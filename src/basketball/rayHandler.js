export default class RayHandler {
  constructor(scene, rayInput, physicsHandler) {
    this.scene = scene;
    this.rayInput = rayInput;
    this.physicsHandler = physicsHandler;
  }

  handleRayDown_(opt_mesh) {
    let pos = this.rayInput.renderer.reticle.position;
    if(pos){
      this.physicsHandler.constraintDown = true;
      // Set marker on contact point
      this.setClickMarker(pos.x,pos.y,pos.z,this.scene);

      this.physicsHandler.addPointerConstraintToMesh(pos, opt_mesh);
    }
  }

  handleRayDrag_() {
    if (this.physicsHandler.pointerConstraint) {
      let pos = this.rayInput.renderer.reticle.position;
      if(pos){
        this.setClickMarker(pos.x,pos.y,pos.z,this.scene);
        this.physicsHandler.moveJointToPoint(pos.x,pos.y,pos.z);
      }
    }
  }

  handleRayUp_() {
    this.physicsHandler.constraintDown = false;
    this.removeClickMarker();

    this.physicsHandler.removeJointConstraint();
  }

  setClickMarker(x,y,z) {
    if(!this.clickMarker){
      const shape = new THREE.SphereGeometry(0.2, 8, 8);
      const markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      this.clickMarker = new THREE.Mesh(shape, markerMaterial);
      this.clickMarker.material.setWireframe(true);
      this.scene.add(this.clickMarker);
    }
    this.clickMarker.visible = true;
    this.clickMarker.position.set(x,y,z);
  }

  removeClickMarker(){
    this.clickMarker.visible = false;
  }
}