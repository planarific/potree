import * as THREE from '../../libs/three.js/build/three.module.js';
import { TextSprite } from '../TextSprite.js';
import { Utils } from '../utils.js';
import { Line2 } from '../../libs/three.js/lines/Line2.js';
import { LineGeometry } from '../../libs/three.js/lines/LineGeometry.js';
import { LineMaterial } from '../../libs/three.js/lines/LineMaterial.js';
import { Measure } from './Measure.js';

export class TopPrismMeasure extends Measure {
  constructor(name) {
    super();
    this.instanceOf = 'TopPrism';
    this.namedPoints = {
      topPoint1: null,
      frontPoint1: null,
      backPoint1: null,
      topPoint2: null,
      frontPoint2: null,
      backPoint2: null,
    };
  }

  addEdge() {
    {
      // edges
      let lineGeometry = new LineGeometry();
      lineGeometry.setPositions([0, 0, 0, 0, 0, 0]);

      let lineMaterial = new LineMaterial({
        color: 0xff0000,
        linewidth: 2,
        resolution: new THREE.Vector2(1000, 1000),
      });

      lineMaterial.depthTest = false;

      let edge = new Line2(lineGeometry, lineMaterial);
      edge.visible = true;

      this.add(edge);
      this.edges.push(edge);
    }

    {
      // edge labels
      let edgeLabel = new TextSprite();
      edgeLabel.setBorderColor({ r: 0, g: 0, b: 0, a: 1.0 });
      edgeLabel.setBackgroundColor({ r: 0, g: 0, b: 0, a: 1.0 });
      edgeLabel.material.depthTest = false;
      edgeLabel.visible = true;
      edgeLabel.fontsize = 16;
      this.edgeLabels.push(edgeLabel);
      this.add(edgeLabel);
    }
  }

  make3DShape() {
    this.addEdge();
    this.addEdge();
    this.addEdge();

    console.log('edge', this.edges.length);
    console.log('label', this.edgeLabels.length);
  }

  update() {
    if (this.points.length === 0) {
      return;
    } else if (this.points.length === 1) {
      let point = this.points[0];
      let position = point.position;
      this.spheres[0].position.copy(position);

      {
        // coordinate labels
        let coordinateLabel = this.coordinateLabels[0];

        let msg = position
          .toArray()
          .map((p) => Utils.addCommas(p.toFixed(2)))
          .join(' / ');
        coordinateLabel.setText(msg);

        coordinateLabel.visible = this.showCoordinates;
      }

      return;
    }

    let lastIndex = this.points.length - 1;

    for (let i = 0; i <= lastIndex; i++) {
      let index = i;
      let nextIndex = i + 1 > lastIndex ? 0 : i + 1;
      let previousIndex = i === 0 ? lastIndex : i - 1;

      let point = this.points[index];
      let nextPoint = this.points[nextIndex];
      let previousPoint = this.points[previousIndex];

      let sphere = this.spheres[index];

      // spheres
      sphere.position.copy(point.position);
      sphere.material.color = this.color;

      if (index < 4) {
        let nextIndex = index === lastIndex || index === 3 ? 0 : index + 1;
        let visible = index < lastIndex || this.closed;

        this.makeEdge(
          index,
          this.points[index],
          this.points[nextIndex],
          visible
        );
      }

      {
        // angle labels
        let angleLabel = this.angleLabels[i];
        let angle = this.getAngleBetweenLines(point, previousPoint, nextPoint);

        let dir = nextPoint.position.clone().sub(previousPoint.position);
        dir.multiplyScalar(0.5);
        dir = previousPoint.position
          .clone()
          .add(dir)
          .sub(point.position)
          .normalize();

        let dist = Math.min(
          point.position.distanceTo(previousPoint.position),
          point.position.distanceTo(nextPoint.position)
        );
        dist = dist / 9;

        let labelPos = point.position.clone().add(dir.multiplyScalar(dist));
        angleLabel.position.copy(labelPos);

        let msg =
          Utils.addCommas((angle * (180.0 / Math.PI)).toFixed(1)) + '\u00B0';
        angleLabel.setText(msg);

        angleLabel.visible =
          this.showAngles &&
          (index < lastIndex || this.closed) &&
          this.points.length >= 3 &&
          angle > 0;
      }
    }

    if (this.edges.length === 9) {
      this.makeEdge(4, this.namedPoints.backPoint1, this.namedPoints.topPoint1);
      this.makeEdge(
        5,
        this.namedPoints.backPoint1,
        this.namedPoints.frontPoint1
      );
      this.makeEdge(6, this.namedPoints.backPoint2, this.namedPoints.topPoint2);
      this.makeEdge(
        7,
        this.namedPoints.backPoint2,
        this.namedPoints.frontPoint2
      );
      this.makeEdge(
        8,
        this.namedPoints.backPoint1,
        this.namedPoints.backPoint2
      );
    }

    {
      // update height stuff
      let heightEdge = this.heightEdge;
      heightEdge.visible = this.showHeight;
      this.heightLabel.visible = this.showHeight;

      if (this.showHeight) {
        let sorted = this.points
          .slice()
          .sort((a, b) => a.position.z - b.position.z);
        let lowPoint = sorted[0].position.clone();
        let highPoint = sorted[sorted.length - 1].position.clone();
        let min = lowPoint.z;
        let max = highPoint.z;
        let height = max - min;

        let start = new THREE.Vector3(highPoint.x, highPoint.y, min);
        let end = new THREE.Vector3(highPoint.x, highPoint.y, max);

        heightEdge.position.copy(lowPoint);

        heightEdge.geometry.setPositions([
          0,
          0,
          0,
          ...start.clone().sub(lowPoint).toArray(),
          ...start.clone().sub(lowPoint).toArray(),
          ...end.clone().sub(lowPoint).toArray(),
        ]);

        heightEdge.geometry.verticesNeedUpdate = true;
        // heightEdge.geometry.computeLineDistances();
        // heightEdge.geometry.lineDistancesNeedUpdate = true;
        heightEdge.geometry.computeBoundingSphere();
        heightEdge.computeLineDistances();

        // heightEdge.material.dashSize = height / 40;
        // heightEdge.material.gapSize = height / 40;

        let heightLabelPosition = start.clone().add(end).multiplyScalar(0.5);
        this.heightLabel.position.copy(heightLabelPosition);

        let suffix = '';
        if (this.lengthUnit != null && this.lengthUnitDisplay != null) {
          height =
            (height / this.lengthUnit.unitspermeter) *
            this.lengthUnitDisplay.unitspermeter; //convert to meters then to the display unit
          suffix = this.lengthUnitDisplay.code;
        }

        let txtHeight = Utils.addCommas(height.toFixed(2));
        let msg = `${txtHeight} ${suffix}`;
        this.heightLabel.setText(msg);
      }
    }

    {
      // update circle stuff
      const circleRadiusLabel = this.circleRadiusLabel;
      const circleRadiusLine = this.circleRadiusLine;
      const circleLine = this.circleLine;
      const circleCenter = this.circleCenter;

      const circleOkay = this.points.length === 3;

      circleRadiusLabel.visible = this.showCircle && circleOkay;
      circleRadiusLine.visible = this.showCircle && circleOkay;
      circleLine.visible = this.showCircle && circleOkay;
      circleCenter.visible = this.showCircle && circleOkay;

      if (this.showCircle && circleOkay) {
        const A = this.points[0].position;
        const B = this.points[1].position;
        const C = this.points[2].position;
        const AB = B.clone().sub(A);
        const AC = C.clone().sub(A);
        const N = AC.clone().cross(AB).normalize();

        const center = Potree.Utils.computeCircleCenter(A, B, C);
        const radius = center.distanceTo(A);

        const scale = radius / 20;
        circleCenter.position.copy(center);
        circleCenter.scale.set(scale, scale, scale);

        //circleRadiusLine.geometry.vertices[0].set(0, 0, 0);
        //circleRadiusLine.geometry.vertices[1].copy(B.clone().sub(center));

        circleRadiusLine.geometry.setPositions([
          0,
          0,
          0,
          ...B.clone().sub(center).toArray(),
        ]);

        circleRadiusLine.geometry.verticesNeedUpdate = true;
        circleRadiusLine.geometry.computeBoundingSphere();
        circleRadiusLine.position.copy(center);
        circleRadiusLine.computeLineDistances();

        const target = center.clone().add(N);
        circleLine.position.copy(center);
        circleLine.scale.set(radius, radius, radius);
        circleLine.lookAt(target);

        circleRadiusLabel.visible = true;
        circleRadiusLabel.position.copy(
          center.clone().add(B).multiplyScalar(0.5)
        );
        circleRadiusLabel.setText(`${radius.toFixed(3)}`);
      }
    }
  }

  makeEdge(edgeIndex, startPoint, endPoint, visible = true) {
    {
      // edges

      let edge = this.edges[edgeIndex];

      edge.material.color = this.color;

      edge.position.copy(startPoint.position);

      edge.geometry.setPositions([
        0,
        0,
        0,
        ...endPoint.position.clone().sub(startPoint.position).toArray(),
      ]);

      edge.geometry.verticesNeedUpdate = true;
      edge.geometry.computeBoundingSphere();
      edge.computeLineDistances();
      edge.visible = visible;

      if (!this.showEdges) {
        edge.visible = false;
      }
    }

    {
      // edge labels
      let edgeLabel = this.edgeLabels[edgeIndex];

      let center = new THREE.Vector3().add(startPoint.position);
      center.add(endPoint.position);
      center = center.multiplyScalar(0.5);
      let distance = startPoint.position.distanceTo(endPoint.position);

      edgeLabel.position.copy(center);

      let suffix = '';
      if (this.lengthUnit != null && this.lengthUnitDisplay != null) {
        distance =
          (distance / this.lengthUnit.unitspermeter) *
          this.lengthUnitDisplay.unitspermeter; //convert to meters then to the display unit
        suffix = this.lengthUnitDisplay.code;
      }

      let txtLength = Utils.addCommas(distance.toFixed(2));
      edgeLabel.setText(`${txtLength} ${suffix}`);
      edgeLabel.visible =
        this.showDistances && this.points.length >= 2 && distance > 0;
    }
  }
}
