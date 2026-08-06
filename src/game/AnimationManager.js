import * as THREE from 'three';

export class AnimationManager {
  constructor(mesh, animations = []) {
    this.mesh = mesh;
    this.animations = animations;
    this.mixer = new THREE.AnimationMixer(mesh);
    this.actions = {};
    this.currentAction = null;

    this.initActions();
  }

  initActions() {
    for (const clip of this.animations) {
      const name = clip.name.toLowerCase();
      const action = this.mixer.clipAction(clip);
      this.actions[name] = action;
    }
  }

  play(name, duration = 0.2) {
    const nextAction = this.findAction(name);
    if (!nextAction) return;

    if (this.currentAction === nextAction) return;

    if (this.currentAction) {
      this.currentAction.fadeOut(duration);
    }

    nextAction.reset().fadeIn(duration).play();
    this.currentAction = nextAction;
  }

  findAction(query) {
    const q = query.toLowerCase();
    for (const key in this.actions) {
      if (key.includes(q)) return this.actions[key];
    }
    return null;
  }

  update(dt) {
    if (this.mixer) {
      this.mixer.update(dt);
    }
  }
}
