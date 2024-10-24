import * as THREE from '../../libs/three.js/build/three.module.js';
import { MeasuringTool } from './MeasuringTool.js';
import { Box } from './Box.js';

export class BoxMeasuringTool extends MeasuringTool {
  constructor(viewer) {
    super(viewer);
  }

  startInsertion(args = {}) {
    let domElement = this.viewer.renderer.domElement;

    let box = new Box();

    const pick = (defaul, alternative) => {
      if (defaul != null) {
        return defaul;
      } else {
        return alternative;
      }
    };

    box.showDistances = args.showDistances === null ? true : args.showDistances;

    box.showArea = pick(args.showArea, false);
    box.showAngles = pick(args.showAngles, false);
    box.showCoordinates = pick(args.showCoordinates, false);
    box.showHeight = pick(args.showHeight, false);
    box.showCircle = pick(args.showCircle, false);
    box.showAzimuth = pick(args.showAzimuth, false);
    box.showEdges = pick(args.showEdges, true);
    box.closed = pick(args.closed, false);
    box.maxMarkers = pick(args.maxMarkers, Infinity);
    box.name = args.name || 'boxment';

    this.scene.add(box);

    let cancel = {
      removeLastMarker: box.maxMarkers > 3,
      callback1: null,
      callback2: null,
    };

    let insertionCallback = (e) => {
      if (e.button === THREE.MOUSE.LEFT) {
        // if (box.points.length === box.maxMarkers + 1) {
        //   cancel.callback1();
        //   return;
        // }

        if (box.points.length === box.maxMarkers) {
          cancel.callback1();
          return;
        }

        box.addMarker(box.points[box.points.length - 1].position.clone());

        this.viewer.inputHandler.startDragging(
          box.spheres[box.spheres.length - 1]
        );
      }
    };

    cancel.callback1 = (e) => {
      for (let i = 4; i < 8; i++) {
        box.addMarker(box.points[3].position.clone());
      }

      this.viewer.inputHandler.startDragging(box.spheres[7]);

      box.addExtraEdges();

      domElement.removeEventListener('mouseup', insertionCallback, false);
      this.viewer.removeEventListener('cancel_insertions', cancel.callback1);
      let centroid = this.calculateCentroid(box.points);
      let annotation = this.createAnnotation(box.name, centroid);
      this.viewer.scene.annotations.add(annotation);
      box.annotation = annotation;
    };

    if (box.maxMarkers > 1) {
      this.viewer.addEventListener('cancel_insertions', cancel.callback1);
      domElement.addEventListener('mouseup', insertionCallback, false);
    }

    box.addMarker(new THREE.Vector3(0, 0, 0));
    this.viewer.inputHandler.startDragging(box.spheres[0]);

    this.viewer.scene.addMeasurement(box);

    return box;
  }

  calculateCentroid(points) {
    let sum = new THREE.Vector3(0, 0, 0);

    // Sum up all the points
    for (let i = 0; i < 4; i++) {
      sum.add(points[i].position);
    }

    // Divide by the number of points to get the average position (centroid)
    let centroid = sum.divideScalar(4);
    return centroid;
  }

  createAnnotation(name, position) {
    let cameraPosition = this.viewer.scene.view.position.clone(); // Camera position

    let annotation = new Potree.Annotation({
      title: name, // Use area name for the annotation label
      position: position, // Set annotation position (target)
      cameraPosition: cameraPosition, // Store camera position
      cameraTarget: position, // Store camera target
      //description: 'Annotation for ' + areaName, // Optional description
    });

    return annotation;
  }

  update() {}
}
