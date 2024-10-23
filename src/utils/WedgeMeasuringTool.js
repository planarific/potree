import * as THREE from '../../libs/three.js/build/three.module.js';
import { MeasuringTool } from './MeasuringTool.js';
import { WedgeMeasure } from './WedgeMeasure.js';

export class WedgeMeasuringTool extends MeasuringTool {
  constructor(viewer) {
    super(viewer);
  }

  startInsertion(args = {}) {
    let domElement = this.viewer.renderer.domElement;

    let wedgeMeasure = new WedgeMeasure();

    const pick = (defaul, alternative) => {
      if (defaul != null) {
        return defaul;
      } else {
        return alternative;
      }
    };

    wedgeMeasure.showDistances =
      args.showDistances === null ? true : args.showDistances;

    wedgeMeasure.showArea = pick(args.showArea, false);
    wedgeMeasure.showAngles = pick(args.showAngles, false);
    wedgeMeasure.showCoordinates = pick(args.showCoordinates, false);
    wedgeMeasure.showHeight = pick(args.showHeight, false);
    wedgeMeasure.showCircle = pick(args.showCircle, false);
    wedgeMeasure.showAzimuth = pick(args.showAzimuth, false);
    wedgeMeasure.showEdges = pick(args.showEdges, true);
    wedgeMeasure.closed = pick(args.closed, false);
    wedgeMeasure.maxMarkers = pick(args.maxMarkers, Infinity);
    wedgeMeasure.name = args.name || 'wedgeMeasurement';

    this.scene.add(wedgeMeasure);

    let cancel = {
      removeLastMarker: wedgeMeasure.maxMarkers > 3,
      callback: null,
    };

    let insertionCallback = (e) => {
      if (e.button === THREE.MOUSE.LEFT) {
        if (wedgeMeasure.points.length >= wedgeMeasure.maxMarkers) {
          cancel.callback();
          return;
        }

        wedgeMeasure.addMarker(
          wedgeMeasure.points[wedgeMeasure.points.length - 1].position.clone()
        );

        this.viewer.inputHandler.startDragging(
          wedgeMeasure.spheres[wedgeMeasure.spheres.length - 1]
        );
      }
    };

    cancel.callback = (e) => {
      const spheres = wedgeMeasure.spheres;
      const namedPoints = wedgeMeasure.namedPoints;

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

      wedgeMeasure.addMarker(
        new THREE.Vector3(
          namedPoints.topPoint1.position.x,
          namedPoints.topPoint1.position.y,
          namedPoints.frontPoint1.position.z
        )
      );

      wedgeMeasure.addMarker(
        new THREE.Vector3(
          namedPoints.topPoint2.position.x,
          namedPoints.topPoint2.position.y,
          namedPoints.frontPoint2.position.z
        )
      );

      namedPoints.backPoint1 = spheres[4];
      namedPoints.backPoint2 = spheres[5];

      console.log(spheres);

      wedgeMeasure.make3DShape();

      domElement.removeEventListener('mouseup', insertionCallback, false);
      this.viewer.removeEventListener('cancel_insertions', cancel.callback);
      let centroid = this.calculateCentroid(wedgeMeasure.points);
      let annotation = this.createAnnotation(wedgeMeasure.name, centroid);
      this.viewer.scene.annotations.add(annotation);
      wedgeMeasure.annotation = annotation;
    };

    if (wedgeMeasure.maxMarkers > 1) {
      this.viewer.addEventListener('cancel_insertions', cancel.callback);
      domElement.addEventListener('mouseup', insertionCallback, false);
    }

    wedgeMeasure.addMarker(new THREE.Vector3(0, 0, 0));
    this.viewer.inputHandler.startDragging(
      wedgeMeasure.spheres[wedgeMeasure.spheres.length - 1]
    );

    this.viewer.scene.addMeasurement(wedgeMeasure);

    return wedgeMeasure;
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
