import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationManager } from './AnimationManager';

export class CharacterLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.cache = {};
  }

  loadModel(url) {
    if (this.cache[url]) {
      return Promise.resolve(this.cloneGltf(this.cache[url]));
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          this.cache[url] = gltf;
          resolve(this.cloneGltf(gltf));
        },
        undefined,
        (err) => {
          console.warn(`GLTF asset at ${url} not found or failed to load. Using fallback geometry.`, err);
          reject(err);
        }
      );
    });
  }

  cloneGltf(gltf) {
    const clone = {
      scene: gltf.scene.clone(true),
      animations: gltf.animations
    };

    clone.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clone;
  }
}

export const characterLoader = new CharacterLoader();
