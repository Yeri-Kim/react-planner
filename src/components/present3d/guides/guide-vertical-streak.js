import * as Three from 'three';
import {List} from 'immutable';

export default function (width, height, guide) {
  let step = guide.properties.get('step');
  let colors;

  if (guide.properties.has('color')) {
    colors = new List([guide.properties.get('color')]);
  } else {
    colors = guide.properties.get('colors');
  }

  let streak = new Three.Object3D();

  let counter = 0;

  for (let i = 0; i <= width; i += step) {

    let geometry = new Three.Geometry();
    geometry.vertices.push(new Three.Vector3(i, 0, 0));
    geometry.vertices.push(new Three.Vector3(i, 0, -height));
    let color = colors.get(counter % colors.size);
    let material = new Three.LineBasicMaterial({
      opacity: 0,
      transparent: true,
      color
    });

    streak.add(new Three.LineSegments(geometry, material));
    counter++;
  }
  return streak;
}
