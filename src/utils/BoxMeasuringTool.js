import * as THREE from '../../libs/three.js/build/three.module.js';
import { MeasuringTool } from './MeasuringTool.js';
import { BoxMeasure } from './BoxMeasure.js';

export class BoxMeasuringTool extends MeasuringTool {
  constructor(viewer) {
    super(viewer);
  }

  startInsertion(args = {}) {
    let domElement = this.viewer.renderer.domElement;

    let boxMeasure = new BoxMeasure();

    const pick = (defaul, alternative) => {
      if (defaul != null) {
        return defaul;
      } else {
        return alternative;
      }
    };

    boxMeasure.showDistances =
      args.showDistances === null ? true : args.showDistances;

    boxMeasure.showArea = pick(args.showArea, false);
    boxMeasure.showAngles = pick(args.showAngles, false);
    boxMeasure.showCoordinates = pick(args.showCoordinates, false);
    boxMeasure.showHeight = pick(args.showHeight, false);
    boxMeasure.showCircle = pick(args.showCircle, false);
    boxMeasure.showAzimuth = pick(args.showAzimuth, false);
    boxMeasure.showEdges = pick(args.showEdges, true);
    boxMeasure.closed = pick(args.closed, false);
    boxMeasure.maxMarkers = pick(args.maxMarkers, Infinity);
    boxMeasure.name = args.name || 'boxMeasurement';

    this.scene.add(boxMeasure);

    let cancel = {
      removeLastMarker: boxMeasure.maxMarkers > 3,
      callback1: null,
      callback2: null,
    };

    let insertionCallback = (e) => {
      if (e.button === THREE.MOUSE.LEFT) {
        // if (boxMeasure.points.length === boxMeasure.maxMarkers + 1) {
        //   cancel.callback1();
        //   return;
        // }

        if (boxMeasure.points.length === boxMeasure.maxMarkers) {
          cancel.callback1();
          return;
        }

        boxMeasure.addMarker(
          boxMeasure.points[boxMeasure.points.length - 1].position.clone()
        );

        this.viewer.inputHandler.startDragging(
          boxMeasure.spheres[boxMeasure.spheres.length - 1]
        );
      }
    };

    cancel.callback1 = (e) => {
      for (let i = 4; i < 8; i++) {
        boxMeasure.addMarker(boxMeasure.points[3].position.clone());
      }

      this.viewer.inputHandler.startDragging(boxMeasure.spheres[7]);

      boxMeasure.addExtraEdges();

      domElement.removeEventListener('mouseup', insertionCallback, false);
      this.viewer.removeEventListener('cancel_insertions', cancel.callback1);
      let centroid = this.calculateCentroid(boxMeasure.points);
      let annotation = this.createAnnotation(boxMeasure.name, centroid);
      this.viewer.scene.annotations.add(annotation);
      boxMeasure.annotation = annotation;
    };

    if (boxMeasure.maxMarkers > 1) {
      this.viewer.addEventListener('cancel_insertions', cancel.callback1);
      domElement.addEventListener('mouseup', insertionCallback, false);
    }

    boxMeasure.addMarker(new THREE.Vector3(0, 0, 0));
    this.viewer.inputHandler.startDragging(boxMeasure.spheres[0]);

    this.viewer.scene.addMeasurement(boxMeasure);

    return boxMeasure;
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
