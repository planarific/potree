import * as THREE from '../../libs/three.js/build/three.module.js';

export class Folder extends THREE.Object3D {
  constructor(name) {
    super();
    this._name = name;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }
}
