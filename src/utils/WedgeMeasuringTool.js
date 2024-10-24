import * as THREE from '../../libs/three.js/build/three.module.js';
import { MeasuringTool } from './MeasuringTool.js';
import { Wedge } from './Wedge.js';

export class WedgeMeasuringTool extends MeasuringTool {
  constructor(viewer) {
    super(viewer);
  }

  startInsertion(args = {}) {
    let domElement = this.viewer.renderer.domElement;

    let wedge = new Wedge();

    const pick = (defaul, alternative) => {
      if (defaul != null) {
        return defaul;
      } else {
        return alternative;
      }
    };

    wedge.showDistances =
      args.showDistances === null ? true : args.showDistances;

    wedge.showArea = pick(args.showArea, false);
    wedge.showAngles = pick(args.showAngles, false);
    wedge.showCoordinates = pick(args.showCoordinates, false);
    wedge.showHeight = pick(args.showHeight, false);
    wedge.showCircle = pick(args.showCircle, false);
    wedge.showAzimuth = pick(args.showAzimuth, false);
    wedge.showEdges = pick(args.showEdges, true);
    wedge.closed = pick(args.closed, false);
    wedge.maxMarkers = pick(args.maxMarkers, Infinity);
    wedge.name = args.name || 'wedgement';

    this.scene.add(wedge);

    let cancel = {
      removeLastMarker: wedge.maxMarkers > 3,
      callback: null,
    };

    let insertionCallback = (e) => {
      if (e.button === THREE.MOUSE.LEFT) {
        if (wedge.points.length >= wedge.maxMarkers) {
          cancel.callback();
          return;
        }

        wedge.addMarker(wedge.points[wedge.points.length - 1].position.clone());

        this.viewer.inputHandler.startDragging(
          wedge.spheres[wedge.spheres.length - 1]
        );
      }
    };

    cancel.callback = (e) => {
      const spheres = wedge.spheres;
      const namedPoints = wedge.namedPoints;

      let topPoint1Index = -1;
      let topPoint1Height = 0;
      for (let i = 0; i < 4; i++) {
        if (spheres[i].position.z > topPoint1Height) {
          topPoint1Height = spheres[i].position.z;
          topPoint1Index = i;
        }
      }

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

      wedge.addMarker(
        new THREE.Vector3(
          namedPoints.topPoint1.position.x,
          namedPoints.topPoint1.position.y,
          namedPoints.frontPoint1.position.z
        )
      );

      wedge.addMarker(
        new THREE.Vector3(
          namedPoints.topPoint2.position.x,
          namedPoints.topPoint2.position.y,
          namedPoints.frontPoint2.position.z
        )
      );

      namedPoints.backPoint1 = spheres[4];
      namedPoints.backPoint2 = spheres[5];

      wedge.addExtraEdges();

      domElement.removeEventListener('mouseup', insertionCallback, false);
      this.viewer.removeEventListener('cancel_insertions', cancel.callback);
      let centroid = this.calculateCentroid(wedge.points);
      let annotation = this.createAnnotation(wedge.name, centroid);
      this.viewer.scene.annotations.add(annotation);
      wedge.annotation = annotation;
    };

    if (wedge.maxMarkers > 1) {
      this.viewer.addEventListener('cancel_insertions', cancel.callback);
      domElement.addEventListener('mouseup', insertionCallback, false);
    }

    wedge.addMarker(new THREE.Vector3(0, 0, 0));
    this.viewer.inputHandler.startDragging(
      wedge.spheres[wedge.spheres.length - 1]
    );

    this.viewer.scene.addMeasurement(wedge);

    return wedge;
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
