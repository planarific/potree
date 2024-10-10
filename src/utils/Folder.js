import * as THREE from '../../libs/three.js/build/three.module.js';

export class Folder extends THREE.Object3D {
  constructor(name) {
    super();
    this._instanceOf = 'Folder';
    this._name = name;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  get instanceOf() {
    return this._instanceOf;
  }
}
