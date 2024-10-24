import * as THREE from '../../libs/three.js/build/three.module.js';
import { TextSprite } from '../TextSprite.js';
import { Utils } from '../utils.js';
import { Line2 } from '../../libs/three.js/lines/Line2.js';
import { LineGeometry } from '../../libs/three.js/lines/LineGeometry.js';
import { LineMaterial } from '../../libs/three.js/lines/LineMaterial.js';
import { Measure } from './Measure.js';

export class Box extends Measure {
  constructor(name) {
    super();
    this.instanceOf = 'Box';
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

  addExtraEdges() {
    this.addEdge();
    this.addEdge();
    this.addEdge();
    this.addEdge();
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
    }

    if (this.points.length === 8) {
      const sidesDifference = new THREE.Vector3().subVectors(
        this.points[7].position,
        this.points[3].position
      );

      for (let i = 0; i < 3; i++) {
        this.points[i + 4].position = new THREE.Vector3().addVectors(
          this.points[i].position,
          sidesDifference
        );
      }
    }

    if (this.edges.length === 12) {
      for (let i = 0; i < 4; i++) {
        this.makeEdge(i + 4, this.points[i], this.points[i + 4]);
        this.makeEdge(
          i + 8,
          this.points[i + 4],
          this.points[i + 5 > 7 ? 4 : i + 5]
        );
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
