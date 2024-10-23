import * as THREE from '../../libs/three.js/build/three.module.js';
import { MeasuringTool } from './MeasuringTool.js';
import { TopPrismMeasure } from './TopPrismMeasure.js';

export class TopPrismMeasuringTool extends MeasuringTool {
  constructor(viewer) {
    super(viewer);
  }

  startInsertion(args = {}) {
    let domElement = this.viewer.renderer.domElement;

    let topPrismMeasure = new TopPrismMeasure();

    const pick = (defaul, alternative) => {
      if (defaul != null) {
        return defaul;
      } else {
        return alternative;
      }
    };

    topPrismMeasure.showDistances =
      args.showDistances === null ? true : args.showDistances;

    topPrismMeasure.showArea = pick(args.showArea, false);
    topPrismMeasure.showAngles = pick(args.showAngles, false);
    topPrismMeasure.showCoordinates = pick(args.showCoordinates, false);
    topPrismMeasure.showHeight = pick(args.showHeight, false);
    topPrismMeasure.showCircle = pick(args.showCircle, false);
    topPrismMeasure.showAzimuth = pick(args.showAzimuth, false);
    topPrismMeasure.showEdges = pick(args.showEdges, true);
    topPrismMeasure.closed = pick(args.closed, false);
    topPrismMeasure.maxMarkers = pick(args.maxMarkers, Infinity);
    topPrismMeasure.name = args.name || 'topPrismMeasurement';

    this.scene.add(topPrismMeasure);

    let cancel = {
      removeLastMarker: topPrismMeasure.maxMarkers > 3,
      callback: null,
    };

    let insertionCallback = (e) => {
      if (e.button === THREE.MOUSE.LEFT) {
        if (topPrismMeasure.points.length >= topPrismMeasure.maxMarkers) {
          cancel.callback();
          return;
        }

        topPrismMeasure.addMarker(
          topPrismMeasure.points[
            topPrismMeasure.points.length - 1
          ].position.clone()
        );

        this.viewer.inputHandler.startDragging(
          topPrismMeasure.spheres[topPrismMeasure.spheres.length - 1]
        );
      }
    };

    cancel.callback = (e) => {
      const spheres = topPrismMeasure.spheres;
      const namedPoints = topPrismMeasure.namedPoints;

      let topPoint1Index = -1;
      let topPoint1Height = 0;
      for (let i = 0; i < 4; i++) {
        console.log(i, spheres[i].position.z);
        if (spheres[i].position.z > topPoint1Height) {
          topPoint1Height = spheres[i].position.z;
          topPoint1Index = i;
        }
      }

      console.log(topPoint1Index, topPoint1Height);
      namedPoints.topPoint1 = spheres[topPoint1Index];

      const prev = spheres[(topPoint1Index + 3) % 4];
      const next = spheres[(topPoint1Index + 1) % 4];
      const opposite = spheres[(topPoint1Index + 2) % 4];

      if (prev.position.z < next.position.z) {
        namedPoints.frontPoint1 = prev;
        namedPoints.topPoint2 = next;
        namedPoints.frontPoint2 = opposite;
      } else {
        namedPoints.frontPoint1 = next;
        namedPoints.topPoint2 = prev;
        namedPoints.frontPoint2 = opposite;
      }

      console.log(namedPoints);

      topPrismMeasure.addMarker(
        new THREE.Vector3(
          namedPoints.topPoint1.position.x,
          namedPoints.topPoint1.position.y,
          namedPoints.frontPoint1.position.z
        )
      );

      topPrismMeasure.addMarker(
        new THREE.Vector3(
          namedPoints.topPoint2.position.x,
          namedPoints.topPoint2.position.y,
          namedPoints.frontPoint2.position.z
        )
      );

      namedPoints.backPoint1 = spheres[4];
      namedPoints.backPoint2 = spheres[5];

      console.log(spheres);

      topPrismMeasure.make3DShape();

      domElement.removeEventListener('mouseup', insertionCallback, false);
      this.viewer.removeEventListener('cancel_insertions', cancel.callback);
      let centroid = this.calculateCentroid(topPrismMeasure.points);
      let annotation = this.createAnnotation(topPrismMeasure.name, centroid);
      this.viewer.scene.annotations.add(annotation);
      topPrismMeasure.annotation = annotation;
    };

    if (topPrismMeasure.maxMarkers > 1) {
      this.viewer.addEventListener('cancel_insertions', cancel.callback);
      domElement.addEventListener('mouseup', insertionCallback, false);
    }

    topPrismMeasure.addMarker(new THREE.Vector3(0, 0, 0));
    this.viewer.inputHandler.startDragging(
      topPrismMeasure.spheres[topPrismMeasure.spheres.length - 1]
    );

    this.viewer.scene.addMeasurement(topPrismMeasure);

    return topPrismMeasure;
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
}
